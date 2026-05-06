function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

const CNPJA_OPEN_CNPJ_URL = "https://open.cnpja.com/office";
const CNPJ_WS_CNPJ_URL = "https://publica.cnpj.ws/cnpj";

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function buildCnpjAddress(company) {
  return [
    company.address?.street,
    company.address?.number,
    company.address?.details,
    company.address?.district,
    company.address?.zip ? `CEP ${company.address.zip}` : "",
  ].filter(Boolean).join(", ");
}

function getCnpjPhone(company, helpers) {
  if (Array.isArray(company.phones) && company.phones.length) {
    const phone = company.phones[0];
    return helpers.formatPhoneBr([phone.area, phone.number].filter(Boolean).join(""));
  }

  return "";
}

function getCnpjEmail(company) {
  if (Array.isArray(company.emails) && company.emails.length) {
    return company.emails[0]?.address || "";
  }

  return "";
}

function getCnpjStateRegistration(company) {
  const registrations = company?.registrations || [];
  if (Array.isArray(registrations)) {
    const activeRegistration = registrations.find((entry) =>
      entry?.number && String(entry?.enabled ?? true) !== "false"
    ) || registrations.find((entry) => entry?.number);
    return activeRegistration?.number || "";
  }

  return "";
}

function normalizeCnpjWsCompany(company) {
  const office = company.estabelecimento || {};
  const city = office.cidade || {};
  const state = office.estado || {};
  const registrations = Array.isArray(office.inscricoes_estaduais)
    ? office.inscricoes_estaduais.map((entry) => ({
      number: entry.inscricao_estadual,
      enabled: entry.ativo !== false,
    }))
    : [];

  return {
    taxId: onlyDigits(office.cnpj || company.cnpj),
    alias: office.nome_fantasia || "",
    company: {
      name: company.razao_social || company.nome || "",
    },
    address: {
      street: office.logradouro || "",
      number: office.número || "",
      details: office.complemento || "",
      district: office.bairro || "",
      zip: office.cep || "",
      city: city.nome || office.cidade_nome || "",
      state: state.sigla || office.estado_sigla || "",
    },
    phones: [{
      area: office.ddd1 || "",
      number: office.telefone1 || "",
    }],
    emails: [{
      address: office.email || "",
    }],
    registrations,
  };
}

function mergeCnpjCompanyData(primaryCompany, fallbackCompany) {
  if (!primaryCompany) {
    return fallbackCompany;
  }

  const merged = {
    ...primaryCompany,
    registrations: primaryCompany.registrations || fallbackCompany?.registrations || [],
  };

  if (!getCnpjStateRegistration(merged) && getCnpjStateRegistration(fallbackCompany)) {
    merged.registrations = fallbackCompany.registrations;
  }

  return merged;
}

async function fetchCnpjWsCompany(cnpjDigits) {
  const response = await fetch(`${CNPJ_WS_CNPJ_URL}/${cnpjDigits}`, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) {
    throw new Error("CNPJ não encontrado na CNPJ.ws.");
  }
  if (!response.ok) {
    throw new Error("Não foi possível consultar a CNPJ.ws agora.");
  }

  return normalizeCnpjWsCompany(await response.json());
}

function applyCnpjCompanyToForm(form, company, helpers) {
  const values = {
    name: company.company?.name || company.alias || "",
    cnpj: helpers.formatCnpj(company.taxId || ""),
    state_registration: getCnpjStateRegistration(company),
    email: getCnpjEmail(company),
    phone: getCnpjPhone(company, helpers),
    contact: company.alias || "",
    address: buildCnpjAddress(company),
    city: company.address?.city || "",
    state: company.address?.state || "",
  };

  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements.namedItem(name);
    if (field && value) {
      field.value = value;
    }
  });

  helpers.syncCustomerDraftFromForm(form);
}

async function fetchCnpjCompany(cnpjDigits) {
  let cnpjaCompany = null;
  let cnpjaError = null;

  try {
    const response = await fetch(`${CNPJA_OPEN_CNPJ_URL}/${cnpjDigits}`, {
      headers: { Accept: "application/json" },
    });

    if (response.status === 404) {
      throw new Error("CNPJ não encontrado na CNPJa.");
    }
    if (!response.ok) {
      throw new Error("Não foi possível consultar o CNPJ na CNPJa agora.");
    }

    cnpjaCompany = await response.json();
  } catch (error) {
    cnpjaError = error;
  }

  try {
    const cnpjWsCompany = await fetchCnpjWsCompany(cnpjDigits);
    return mergeCnpjCompanyData(cnpjaCompany, cnpjWsCompany);
  } catch (cnpjWsError) {
    if (cnpjaCompany) {
      return cnpjaCompany;
    }
    throw cnpjaError || cnpjWsError;
  }
}

function renderCustomerActionCell(item, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  return `
    <div class="customer-action-group">
      <button class="inline-button icon-inline-button" type="button" data-customer-sales-history-id="${item.id}" aria-label="Ver histórico de compras" title="Histórico de compras">🧾</button>
      ${
        canEdit
          ? `
            <button class="inline-button icon-inline-button" type="button" data-customer-edit-id="${item.id}" aria-label="Editar cliente">✎</button>
            <button class="inline-button danger-button icon-inline-button" type="button" data-customer-delete-id="${item.id}" aria-label="Excluir cliente">⌫</button>
          `
          : ""
      }
    </div>
  `;
}

function renderCustomerRow(item, canEdit, canViewSalesHistory, helpers) {
  const metadata = helpers.getCustomerMetadata(item);

  return `
    <tr>
      <td>
        <strong>${helpers.escapeHtml(item.name || "-")}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(metadata.contact || "Sem contato definido")}</div>
      </td>
      <td>${helpers.escapeHtml(metadata.document || "-")}</td>
      <td>${helpers.escapeHtml(metadata.email || "-")}</td>
      <td>${helpers.escapeHtml(metadata.phone || "-")}</td>
      <td>${helpers.escapeHtml(metadata.city || "-")}</td>
      <td>${renderCustomerActionCell(item, canEdit)}</td>
    </tr>
  `;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("customers", "view")) {
      return helpers.noPermissionTemplate("Seu perfil não possui acesso ao módulo de clientes.");
    }

    const canEdit = bridge.hasPermission("customers", "edit");
    const canViewSalesHistory = bridge.hasPermission("sales", "view");
    const isFormOpen = state.openAccordionKey === "customer-form";
    const customers = state.moduleData.customers || [];
    const searchTerm = state.customerSearch.trim().toLowerCase();
    const filteredCustomers = customers.filter((item) => {
      const metadata = helpers.getCustomerMetadata(item);
      return [
        item.name,
        metadata.document,
        metadata.email,
        metadata.city,
      ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
    });

    return `
      <section class="module-panel customers-module">
        <div class="module-head customers-head">
          <div>
            <p class="eyebrow muted">Clientes</p>
            <h3>Cadastro de clientes</h3>
            <p class="muted">${customers.length} cliente(s) cadastrado(s)</p>
          </div>
          <div class="module-head-actions">
            ${canEdit ? `
              <button
                class="primary-button customer-create-button ${isFormOpen ? "is-open" : ""}"
                type="button"
                data-customer-toggle-form
              >
                <span>+ Novo Cliente</span>
                <span class="production-toggle-icon">${isFormOpen ? "▴" : "▾"}</span>
              </button>
            ` : ""}
          </div>
        </div>

        ${
          canEdit
            ? `
              <div class="customer-accordion-shell ${isFormOpen ? "open" : ""}">
                <div class="customer-accordion-card">
                  <div class="customer-form-header">
                    <div>
                      <h4>${state.customerDraft.edit_id ? "Editar Cliente" : "Novo Cliente"}</h4>
                      <p class="muted">Cadastro comercial no mesmo padrão visual do ERP.</p>
                    </div>
                  </div>

                  <form id="customers-form" class="customer-form-grid">
                    <input type="hidden" name="edit_id" value="${helpers.escapeHtml(state.customerDraft.edit_id)}" />

                    <div class="customer-form-row">
                      <label>
                        Nome *
                        <input name="name" type="text" required value="${helpers.escapeHtml(state.customerDraft.name)}" />
                      </label>
                      <label>
                        CNPJ
                        <span class="customer-cnpj-field">
                          <input name="cnpj" type="text" inputmode="numeric" placeholder="00.000.000/0000-00" value="${helpers.escapeHtml(state.customerDraft.cnpj)}" />
                          <button class="secondary-button customer-cnpj-button" type="button" data-customer-cnpj-lookup>Buscar</button>
                        </span>
                      </label>
                      <label>
                        CPF
                        <input name="cpf" type="text" inputmode="numeric" placeholder="000.000.000-00" value="${helpers.escapeHtml(state.customerDraft.cpf)}" />
                      </label>
                      <label>
                        Inscricao Estadual
                        <input name="state_registration" type="text" placeholder="ISENTO ou número" value="${helpers.escapeHtml(state.customerDraft.state_registration || "")}" />
                      </label>
                    </div>

                    <div class="customer-form-row">
                      <label>
                        Email
                        <input name="email" type="email" placeholder="cliente@empresa.com" value="${helpers.escapeHtml(state.customerDraft.email)}" />
                      </label>
                      <label>
                        Telefone
                        <input name="phone" type="text" inputmode="numeric" placeholder="(11) 99999-9999" value="${helpers.escapeHtml(state.customerDraft.phone)}" />
                      </label>
                      <label>
                        Contato
                        <input name="contact" type="text" placeholder="Pessoa de contato" value="${helpers.escapeHtml(state.customerDraft.contact)}" />
                      </label>
                    </div>

                    <div class="customer-form-row">
                      <label>
                        Endereço
                        <input name="address" type="text" value="${helpers.escapeHtml(state.customerDraft.address)}" />
                      </label>
                      <label>
                        Cidade
                        <input name="city" type="text" value="${helpers.escapeHtml(state.customerDraft.city)}" />
                      </label>
                      <label>
                        Estado
                        <input name="state" type="text" maxlength="2" placeholder="SP" value="${helpers.escapeHtml(state.customerDraft.state)}" />
                      </label>
                    </div>

                    <div class="customer-form-row customer-form-row-full">
                      <label>
                        Observações
                        <textarea name="notes" placeholder="Anotações sobre o cliente">${helpers.escapeHtml(state.customerDraft.notes)}</textarea>
                      </label>
                    </div>

                    <div class="form-actions-row customer-form-actions">
                      <button class="ghost-button" type="button" data-customer-cancel>Cancelar</button>
                      <button class="primary-button" type="submit">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            `
            : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
        }

        <div class="table-actions single-search-row">
          <label class="search-input-shell">
            <span class="search-input-icon">⌕</span>
            <input id="customer-search-input" type="text" placeholder="Buscar cliente..." value="${helpers.escapeHtml(state.customerSearch)}" />
          </label>
        </div>

        <div class="table-card customer-table-card">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNPJ/CPF</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Cidade</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredCustomers.length
                  ? filteredCustomers.map((item) => renderCustomerRow(item, canEdit, canViewSalesHistory, helpers)).join("")
                  : `<tr><td colspan="6"><div class="empty-state">Nenhum cliente encontrado.</div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    document.querySelector("[data-customer-toggle-form]")?.addEventListener("click", async () => {
      const shouldOpen = state.openAccordionKey !== "customer-form";
      state.openAccordionKey = shouldOpen ? "customer-form" : null;
      state.customerDraft = helpers.createEmptyCustomerDraft();
      await helpers.renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#customers-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    helpers.bindDeferredTextFilter("#customer-search-input", (value) => {
      state.customerSearch = value;
    });

    const customerForm = document.querySelector("#customers-form");
    if (customerForm) {
      customerForm.addEventListener("submit", helpers.handleCustomerSubmit);
      customerForm.addEventListener("input", () => helpers.syncCustomerDraftFromForm(customerForm));
      customerForm.addEventListener("change", () => helpers.syncCustomerDraftFromForm(customerForm));
    }

    document.querySelector("[data-customer-cancel]")?.addEventListener("click", () => {
      helpers.resetCustomerFormState();
      helpers.renderActiveModule();
    });

    const cnpjField = document.querySelector('#customers-form input[name="cnpj"]');
    if (cnpjField) {
      cnpjField.addEventListener("input", () => {
        cnpjField.value = helpers.formatCnpj(cnpjField.value);
        helpers.syncCustomerDraftFromForm(customerForm);
      });
    }

    const cnpjLookupButton = document.querySelector("[data-customer-cnpj-lookup]");
    if (cnpjLookupButton && cnpjField && customerForm) {
      cnpjLookupButton.addEventListener("click", async () => {
        const cnpjDigits = onlyDigits(cnpjField.value);
        if (cnpjDigits.length !== 14) {
          helpers.showToast("Informe um CNPJ com 14 digitos para consultar.", "warning");
          cnpjField.focus();
          return;
        }

        const originalText = cnpjLookupButton.textContent;
        cnpjLookupButton.disabled = true;
        cnpjLookupButton.textContent = "Buscando...";

        try {
          const company = await fetchCnpjCompany(cnpjDigits);
          applyCnpjCompanyToForm(customerForm, company, helpers);
          if (getCnpjStateRegistration(company)) {
            helpers.showToast("Dados do CNPJ e inscricao estadual preenchidos.", "success");
          } else {
            helpers.showToast("Dados preenchidos. A CNPJ.ws não retornou inscricao estadual para este CNPJ.", "warning");
          }
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        } finally {
          cnpjLookupButton.disabled = false;
          cnpjLookupButton.textContent = originalText;
        }
      });
    }

    const cpfField = document.querySelector('#customers-form input[name="cpf"]');
    if (cpfField) {
      cpfField.addEventListener("input", () => {
        cpfField.value = helpers.formatCpf(cpfField.value);
        helpers.syncCustomerDraftFromForm(customerForm);
      });
    }

    const phoneField = document.querySelector('#customers-form input[name="phone"]');
    if (phoneField) {
      phoneField.addEventListener("input", () => {
        phoneField.value = helpers.formatPhoneBr(phoneField.value);
        helpers.syncCustomerDraftFromForm(customerForm);
      });
    }

    const stateField = document.querySelector('#customers-form input[name="state"]');
    if (stateField) {
      stateField.addEventListener("input", () => {
        stateField.value = String(stateField.value || "").replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
        helpers.syncCustomerDraftFromForm(customerForm);
      });
    }

    document.querySelectorAll("[data-customer-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const customer = state.moduleData.customers.find((item) => item.id === button.dataset.customerEditId);
        if (!customer) return;

        state.customerDraft = helpers.hydrateCustomerDraft(customer);
        state.openAccordionKey = "customer-form";
        await helpers.renderActiveModule();
        document.querySelector("#customers-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-customer-sales-history-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!bridge.hasPermission("sales", "view")) {
          helpers.showToast("Seu perfil não possui acesso ao histórico de compras em vendas.", "warning");
          return;
        }

        const customer = state.moduleData.customers.find((item) => item.id === button.dataset.customerSalesHistoryId);
        if (!customer) return;

        state.activeModule = "sales";
        state.salesSearch = customer.name || "";
        state.salesStatusFilter = "finalized";
        state.openAccordionKey = null;
        helpers.renderModuleNav();
        await helpers.renderActiveModule();
        document.querySelector("#sales-search-input")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-customer-delete-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const { error } = await state.supabase.from("customers").delete().eq("id", button.dataset.customerDeleteId);
          if (error) throw error;
          await helpers.loadTable("customers", "customers");
          helpers.renderActiveModule();
          helpers.showToast("Cliente excluido com sucesso.", "success");
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });
  },
};
