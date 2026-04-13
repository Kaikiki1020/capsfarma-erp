function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponivel.");
  }
  return bridge;
}

function renderSalesItemRow(item, index, state, helpers) {
  const productOptions = (state.moduleData.products || []).map((product) => ({
    value: product.id,
    label: `${product.name} (${product.code})`,
  }));
  const subtotal = Number(item.quantity || 0) * Number(item.unit_price || 0) - Number(item.discount || 0);

  return `
    <article class="sales-item-row" data-sales-item-index="${index}">
      <label>
        Produto
        <select data-sales-item-field="product_id" data-sales-item-index="${index}">
          <option value="">Selecione um produto</option>
          ${helpers.renderOptions(productOptions, item.product_id)}
        </select>
      </label>
      <label>
        Codigo
        <input data-sales-item-field="product_code" data-sales-item-index="${index}" type="text" readonly value="${helpers.escapeHtml(item.product_code)}" />
      </label>
      <label>
        Quantidade
        <input data-sales-item-field="quantity" data-sales-item-index="${index}" type="number" min="0.01" step="0.01" value="${helpers.escapeHtml(item.quantity)}" />
      </label>
      <label>
        Valor unitario
        <input
          data-sales-item-field="unit_price"
          data-sales-item-index="${index}"
          data-currency-input="true"
          data-currency-allow-empty="true"
          type="text"
          inputmode="decimal"
          value="${helpers.escapeHtml(item.unit_price)}"
        />
      </label>
      <label>
        Desconto
        <input
          data-sales-item-field="discount"
          data-sales-item-index="${index}"
          data-currency-input="true"
          data-currency-allow-empty="true"
          type="text"
          inputmode="decimal"
          value="${helpers.escapeHtml(item.discount)}"
        />
      </label>
      <div class="sales-item-subtotal">
        <span>Subtotal</span>
        <strong data-sales-item-subtotal="${index}">${helpers.formatCurrency(subtotal)}</strong>
      </div>
      <button class="inline-button danger-button sales-item-remove" type="button" data-sales-remove-item="${index}">Remover</button>
    </article>
  `;
}

function renderSaleActionCell(item, metadata, canEdit) {
  if (!canEdit) {
    return `
      <div class="action-button-group">
        <button class="inline-button" type="button" data-sales-generate-document="quote" data-sales-document-id="${item.id}">Visualizar</button>
      </div>
    `;
  }

  return `
    <div class="action-button-group">
      <button class="inline-button" type="button" data-sales-generate-document="${metadata.status === "quote" ? "quote" : "sale"}" data-sales-document-id="${item.id}">
        ${metadata.status === "quote" ? "Orcamento" : "Venda PDF"}
      </button>
      ${
        metadata.status === "quote"
          ? `<button class="inline-button" type="button" data-sales-send-document="${item.id}">Enviar cliente</button>`
          : ""
      }
      <button class="inline-button" type="button" data-sales-contract-id="${item.id}">Contrato</button>
      <button class="inline-button" type="button" data-sales-view-id="${item.id}">Visualizar</button>
      <button class="inline-button" type="button" data-sales-edit-id="${item.id}">Editar</button>
      ${
        metadata.status === "quote"
          ? `<button class="inline-button movement-button" type="button" data-sales-finalize-id="${item.id}">Finalizar venda</button>`
          : ""
      }
      <button class="inline-button danger-button" type="button" data-sales-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderSaleRow(item, canEdit, helpers) {
  const metadata = helpers.getSaleMetadata(item);
  const itemSummary = metadata.items.length
    ? metadata.items.map((saleItem) => `${saleItem.product_name || "-"} x ${helpers.formatQuantity(saleItem.quantity || 0)}`).join(" • ")
    : "Sem itens";

  return `
    <tr>
      <td>
        <strong>${helpers.escapeHtml(item.customer_name || "-")}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(item.sale_number || metadata.contractNumber || "-")}</div>
        <div class="table-inline-copy muted">${helpers.escapeHtml(itemSummary)}</div>
      </td>
      <td>${helpers.formatDate(item.sale_date)}</td>
      <td>${helpers.formatDate(item.delivery_date)}</td>
      <td>${helpers.escapeHtml(helpers.getPaymentMethodLabel(metadata.paymentMethod))}</td>
      <td>${helpers.saleStatusCell(metadata.status)}</td>
      <td>${helpers.formatCurrency(metadata.total)}</td>
      <td>${renderSaleActionCell(item, metadata, canEdit)}</td>
    </tr>
  `;
}

function renderSalesTemplateSettingsForm(type, template, canManageConfig, helpers) {
  const disabled = canManageConfig ? "" : "disabled";
  const isContract = type === "contract";

  return `
    <form id="sales-config-template-form" class="sales-config-form" data-sales-config-form="${type}">
      <input type="hidden" name="template_type" value="${type}" />
      <div class="sales-config-grid">
        <label>
          Nome do modelo
          <input name="name" type="text" value="${helpers.escapeHtml(template.name)}" ${disabled} />
        </label>
        <label>
          Titulo do documento
          <input name="title" type="text" value="${helpers.escapeHtml(template.title)}" ${disabled} />
        </label>
        <label>
          Validade do orcamento
          <input name="validity_days" type="number" min="0" step="1" value="${helpers.escapeHtml(template.validity_days)}" ${disabled} />
        </label>
      </div>

      <label>
        Cabecalho
        <textarea name="header" ${disabled}>${helpers.escapeHtml(template.header)}</textarea>
      </label>
      ${
        isContract
          ? `
            <label>
              Resumo inicial do contrato
              <textarea name="presentation_text" ${disabled}>${helpers.escapeHtml(template.presentation_text)}</textarea>
            </label>
          `
          : `
            <label>
              Texto de apresentacao
              <textarea name="presentation_text" ${disabled}>${helpers.escapeHtml(template.presentation_text)}</textarea>
            </label>
          `
      }
      <div class="sales-config-grid">
        <label>
          Condicoes de pagamento
          <textarea name="payment_terms" ${disabled}>${helpers.escapeHtml(template.payment_terms)}</textarea>
        </label>
        <label>
          Prazo de entrega
          <textarea name="delivery_terms" ${disabled}>${helpers.escapeHtml(template.delivery_terms)}</textarea>
        </label>
      </div>
      <div class="sales-config-grid">
        <label>
          Garantia
          <textarea name="warranty" ${disabled}>${helpers.escapeHtml(template.warranty)}</textarea>
        </label>
        <label>
          Dados de contato
          <textarea name="contact_details" ${disabled}>${helpers.escapeHtml(template.contact_details)}</textarea>
        </label>
      </div>
      <label>
        Observacoes
        <textarea name="notes" ${disabled}>${helpers.escapeHtml(template.notes)}</textarea>
      </label>
      <label>
        Assinatura
        <textarea name="signature" ${disabled}>${helpers.escapeHtml(template.signature)}</textarea>
      </label>
      <label>
        Mensagem final
        <textarea name="final_message" ${disabled}>${helpers.escapeHtml(template.final_message)}</textarea>
      </label>
      <label>
        Rodape
        <textarea name="footer" ${disabled}>${helpers.escapeHtml(template.footer)}</textarea>
      </label>
      <label>
        ${isContract ? "Texto completo do contrato" : "Editor do modelo (HTML com placeholders)"}
        <textarea name="body_html" class="sales-config-html-editor ${isContract ? "sales-config-contract-editor" : ""}" ${disabled}>${helpers.escapeHtml(template.body_html)}</textarea>
      </label>
      ${
        isContract
          ? `
            <p class="muted">
              Escreva aqui o contrato completo. Use os placeholders para preencher automaticamente dados do cliente,
              empresa, valores, itens e condicoes negociadas. O cabecalho e o rodape permanecem em campos separados.
            </p>
          `
          : ""
      }

      <div class="form-actions-row sales-config-actions">
        ${
          canManageConfig
            ? `
              <button class="ghost-button" type="button" data-sales-template-restore="${type}">Restaurar padrao</button>
              <button class="secondary-button" type="button" data-sales-template-save="${type}">Salvar modelo</button>
              <button class="primary-button" type="button" data-sales-template-default="${type}">Definir como padrao</button>
            `
            : ""
        }
      </div>
    </form>
  `;
}

function renderSalesCompanySettingsForm(company, numbering, canManageConfig, helpers) {
  const disabled = canManageConfig ? "" : "disabled";
  const yearSuffix = String(new Date().getFullYear()).slice(-2);

  return `
    <form id="sales-company-settings-form" class="sales-config-form" data-sales-config-form="company">
      <div class="sales-config-grid">
        <label>
          Nome da empresa
          <input name="company_name" type="text" value="${helpers.escapeHtml(company.company_name)}" ${disabled} />
        </label>
        <label>
          CNPJ
          <input name="cnpj" type="text" value="${helpers.escapeHtml(company.cnpj)}" ${disabled} />
        </label>
      </div>
      <div class="sales-config-grid">
        <label>
          Telefone
          <input name="phone" type="text" value="${helpers.escapeHtml(company.phone)}" ${disabled} />
        </label>
        <label>
          E-mail
          <input name="email" type="email" value="${helpers.escapeHtml(company.email)}" ${disabled} />
        </label>
      </div>
      <div class="sales-config-grid">
        <label>
          Site
          <input name="site" type="text" value="${helpers.escapeHtml(company.site)}" ${disabled} />
        </label>
        <label>
          Endereco
          <input name="address" type="text" value="${helpers.escapeHtml(company.address)}" ${disabled} />
        </label>
      </div>
      <div class="sales-config-grid">
        <label>
          Responsavel
          <input name="responsible_name" type="text" value="${helpers.escapeHtml(company.responsible_name)}" ${disabled} />
        </label>
        <label>
          Cargo do responsavel
          <input name="responsible_role" type="text" value="${helpers.escapeHtml(company.responsible_role)}" ${disabled} />
        </label>
      </div>
      <label>
        Assinatura do responsavel
        <textarea name="signature" ${disabled}>${helpers.escapeHtml(company.signature)}</textarea>
      </label>
      <div class="sales-config-numbering-card">
        <h4>Numeracao automatica</h4>
        <p class="muted">A numeracao agora eh gerada automaticamente no backend, por tipo e por ano, sem edicao manual.</p>
        <div class="sales-config-numbering-grid">
          <div><strong>Orcamento</strong><span>ORC-01${yearSuffix}</span></div>
          <div><strong>Venda</strong><span>VEN-01${yearSuffix}</span></div>
          <div><strong>Contrato</strong><span>CONT-01${yearSuffix}</span></div>
        </div>
      </div>
      <div class="sales-config-grid">
        <label>
          Logo
          <input name="logo_file" type="file" accept="image/*" ${disabled} />
        </label>
      </div>
      ${
        company.logo
          ? `
            <div class="sales-company-logo-preview">
              <img src="${company.logo}" alt="Logo da empresa" />
              ${canManageConfig ? `<button class="ghost-button" type="button" data-sales-company-remove-logo>Remover logo</button>` : ""}
            </div>
          `
          : ""
      }
      <div class="form-actions-row sales-config-actions">
        ${
          canManageConfig
            ? `<button class="primary-button" type="button" data-sales-company-save>Salvar dados da empresa</button>`
            : ""
        }
      </div>
    </form>
  `;
}

function renderSalesConfigModal(canManageConfig, state, helpers) {
  const activeTab = state.salesConfigTab || "quote";
  const settings = state.salesDocumentSettings;
  const template = helpers.getSalesTemplate(activeTab === "company" ? "quote" : activeTab);
  const preview = helpers.resolveSalesTemplateContent(activeTab === "company" ? "quote" : activeTab, null);
  const tabs = [
    { key: "quote", label: "Orcamento" },
    { key: "sale", label: "Venda" },
    { key: "contract", label: "Contrato" },
    { key: "company", label: "Dados da Empresa" },
  ];

  return `
    <div class="modal-overlay sales-config-overlay" data-sales-config-close>
      <div class="modal-card sales-config-modal" role="dialog" aria-modal="true" aria-label="Configuracao de modelos comerciais" data-sales-config-card>
        <div class="sales-config-header">
          <div>
            <p class="eyebrow muted">Modelos Comerciais</p>
            <h3>Config</h3>
            <p class="muted">Configure os modelos de orcamento, venda, contrato e os dados fixos da empresa.</p>
          </div>
          <div class="sales-config-header-actions">
            ${canManageConfig ? `<span class="status-chip chip-green">Edicao liberada</span>` : `<span class="status-chip chip-blue">Somente leitura</span>`}
            <button class="ghost-button" type="button" data-sales-config-close-button>Fechar</button>
          </div>
        </div>

        <div class="sales-config-tabs">
          ${tabs.map((tab) => `
            <button class="sales-config-tab ${tab.key === activeTab ? "active" : ""}" type="button" data-sales-config-tab="${tab.key}">
              ${tab.label}
            </button>
          `).join("")}
        </div>

        <div class="sales-config-layout">
          <section class="sales-config-editor">
            ${
              activeTab === "company"
                ? renderSalesCompanySettingsForm(settings.company, settings.numbering, canManageConfig, helpers)
                : renderSalesTemplateSettingsForm(activeTab, template, canManageConfig, helpers)
            }
          </section>

          <aside class="sales-config-preview-panel">
            <div class="sales-config-preview-head">
              <div>
                <span class="eyebrow muted">Pre-visualizacao</span>
                <h4>${activeTab === "company" ? "Orcamento Padrao" : template.title}</h4>
              </div>
              <div class="sales-config-preview-actions">
                <button class="ghost-button" type="button" data-sales-template-preview="${activeTab === "company" ? "quote" : activeTab}">Visualizar modelo</button>
                <button class="secondary-button" type="button" data-sales-template-generate="${activeTab === "company" ? "quote" : activeTab}">Gerar previa</button>
              </div>
            </div>
            <div class="sales-config-placeholders">
              ${helpers.getSalesTemplatePlaceholderList(activeTab === "company" ? "quote" : activeTab).map((item) => `<code>${item}</code>`).join("")}
            </div>
            <div class="sales-document-preview-frame">${preview.html}</div>
          </aside>
        </div>
      </div>
    </div>
  `;
}

function renderSalesDocumentPreviewModal(state, helpers) {
  return `
    <div class="modal-overlay sales-document-modal-overlay" data-sales-preview-close>
      <div class="modal-card sales-document-modal" role="dialog" aria-modal="true" aria-label="Visualizacao do documento comercial" data-sales-preview-card>
        <div class="sales-config-header">
          <div>
            <p class="eyebrow muted">Documento Comercial</p>
            <h3>${helpers.escapeHtml(state.salesDocumentPreview.title || "Previa")}</h3>
            <p class="muted">Documento pronto para impressao, exportacao em PDF e envio ao cliente.</p>
          </div>
          <div class="sales-config-header-actions">
            <button class="secondary-button" type="button" data-sales-preview-export>Baixar PDF</button>
            <button class="ghost-button" type="button" data-sales-preview-print>Imprimir</button>
            <button class="primary-button" type="button" data-sales-preview-send>Enviar ao cliente</button>
            <button class="ghost-button" type="button" data-sales-preview-close-button>Fechar</button>
          </div>
        </div>
        <div class="sales-document-preview-frame sales-document-preview-modal-frame">${state.salesDocumentPreview.html}</div>
      </div>
    </div>
  `;
}

function bindSalesConfigEvents(bridge) {
  const state = bridge.getState();
  const helpers = bridge.helpers;

  const ensureSalesConfigAccess = () => {
    if (helpers.canManageSalesTemplates()) return true;
    helpers.showToast("Somente TI e ADMINISTRADOR podem alterar a configuracao de vendas.", "warning");
    return false;
  };

  document.querySelector("[data-sales-config-close-button]")?.addEventListener("click", helpers.closeSalesConfigModal);
  document.querySelector("[data-sales-config-close]")?.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-sales-config-close")) {
      helpers.closeSalesConfigModal();
    }
  });

  document.querySelectorAll("[data-sales-config-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.salesConfigTab = button.dataset.salesConfigTab;
      helpers.renderActiveModule();
    });
  });

  document.querySelectorAll("[data-sales-template-preview], [data-sales-template-generate]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.salesConfigTab === "company") {
        helpers.syncSalesCompanySettingsFromForm();
      } else {
        helpers.syncSalesTemplateFromForm(state.salesConfigTab);
      }
      helpers.openSalesDocumentPreview(button.dataset.salesTemplatePreview || button.dataset.salesTemplateGenerate);
    });
  });

  document.querySelectorAll("[data-sales-template-save]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!ensureSalesConfigAccess()) return;
      try {
        helpers.syncSalesTemplateFromForm(button.dataset.salesTemplateSave);
        await helpers.persistSalesDocumentSettings();
        helpers.showToast("Modelo salvo com sucesso.", "success");
        helpers.renderActiveModule();
      } catch (error) {
        helpers.showToast(helpers.formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-sales-template-default]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!ensureSalesConfigAccess()) return;
      try {
        helpers.syncSalesTemplateFromForm(button.dataset.salesTemplateDefault);
        await helpers.persistSalesDocumentSettings();
        helpers.showToast("Modelo definido como padrao.", "success");
        helpers.renderActiveModule();
      } catch (error) {
        helpers.showToast(helpers.formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-sales-template-restore]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!ensureSalesConfigAccess()) return;
      try {
        state.salesDocumentSettings.templates[button.dataset.salesTemplateRestore] = helpers.createDefaultSalesTemplate(button.dataset.salesTemplateRestore);
        await helpers.persistSalesDocumentSettings();
        helpers.renderActiveModule();
        helpers.showToast("Modelo restaurado para o padrao.", "success");
      } catch (error) {
        helpers.showToast(helpers.formatError(error), "danger");
      }
    });
  });

  document.querySelector("[data-sales-company-save]")?.addEventListener("click", async () => {
    if (!ensureSalesConfigAccess()) return;
    try {
      helpers.syncSalesCompanySettingsFromForm();
      await helpers.persistSalesDocumentSettings();
      void helpers.queueSystemLog({
        moduleKey: "sales",
        action: "edicao",
        level: "Informativo",
        itemAffected: "Dados da empresa",
        description: "Dados fixos da empresa atualizados nos modelos comerciais.",
        entityType: "sales_company_settings",
      });
      helpers.showToast("Dados fixos da empresa salvos.", "success");
      helpers.renderActiveModule();
    } catch (error) {
      helpers.showToast(helpers.formatError(error), "danger");
    }
  });

  document.querySelector("[data-sales-company-remove-logo]")?.addEventListener("click", async () => {
    if (!ensureSalesConfigAccess()) return;
    try {
      state.salesDocumentSettings.company.logo = "";
      await helpers.persistSalesDocumentSettings();
      void helpers.queueSystemLog({
        moduleKey: "sales",
        action: "edicao",
        level: "Atencao",
        itemAffected: "Logo da empresa",
        description: "Logo removida dos modelos comerciais.",
        entityType: "sales_company_settings",
      });
      helpers.renderActiveModule();
    } catch (error) {
      helpers.showToast(helpers.formatError(error), "danger");
    }
  });

  const logoInput = document.querySelector('#sales-company-settings-form input[name="logo_file"]');
  if (logoInput) {
    logoInput.addEventListener("change", async (event) => {
      if (!ensureSalesConfigAccess()) return;
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      try {
        state.salesDocumentSettings.company.logo = await helpers.readFileAsDataUrl(file);
        await helpers.persistSalesDocumentSettings();
        helpers.renderActiveModule();
        void helpers.queueSystemLog({
          moduleKey: "sales",
          action: "edicao",
          level: "Informativo",
          itemAffected: "Logo da empresa",
          description: "Logo atualizada nos modelos comerciais.",
          entityType: "sales_company_settings",
        });
        helpers.showToast("Logo atualizada com sucesso.", "success");
      } catch (error) {
        helpers.showToast(helpers.formatError(error), "danger");
      }
    });
  }
}

function bindSalesDocumentPreviewEvents(bridge) {
  const state = bridge.getState();
  const helpers = bridge.helpers;

  document.querySelector("[data-sales-preview-close-button]")?.addEventListener("click", () => {
    helpers.closeSalesDocumentPreview();
    helpers.renderActiveModule();
  });
  document.querySelector("[data-sales-preview-close]")?.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-sales-preview-close")) {
      helpers.closeSalesDocumentPreview();
      helpers.renderActiveModule();
    }
  });

  document.querySelector("[data-sales-preview-export]")?.addEventListener("click", () => {
    helpers.openPrintWindowForHtml(state.salesDocumentPreview.html, state.salesDocumentPreview.title);
  });
  document.querySelector("[data-sales-preview-print]")?.addEventListener("click", () => {
    helpers.openPrintWindowForHtml(state.salesDocumentPreview.html, state.salesDocumentPreview.title);
  });
  document.querySelector("[data-sales-preview-send]")?.addEventListener("click", () => {
    helpers.openPreparedSalesDocumentShare();
  });
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("sales", "view")) {
      return helpers.noPermissionTemplate("Seu perfil nao possui acesso ao modulo de vendas.");
    }

    const canEdit = bridge.hasPermission("sales", "edit");
    const canManageConfig = helpers.canManageSalesTemplates();
    const isFormOpen = state.openAccordionKey === "sales-form";
    const isContractOpen = state.openAccordionKey === "sales-contract-form";
    const sales = state.moduleData.sales || [];
    const searchTerm = state.salesSearch.trim().toLowerCase();
    const filteredSales = sales.filter((item) => {
      const metadata = helpers.getSaleMetadata(item);
      const itemNames = (metadata.items || []).map((saleItem) => saleItem.product_name).join(" ");
      const matchesSearch = !searchTerm || [
        item.customer_name,
        item.invoice_number,
        metadata.statusLabel,
        itemNames,
      ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesStatus = state.salesStatusFilter === "all" || metadata.status === state.salesStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const customerOptions = (state.moduleData.customers || []).map((customer) => ({
      value: customer.id,
      label: customer.name,
    }));
    const salesSummaryLabel = `${sales.length} ${sales.length === 1 ? "venda registrada" : "vendas registradas"}`;
    const totals = helpers.getSalesDraftTotals();

    return `
      <section class="module-panel sales-module">
        <div class="module-head sales-head">
          <div>
            <p class="eyebrow muted">Comercial</p>
            <h3>Vendas</h3>
            <p class="muted">${salesSummaryLabel}</p>
          </div>
          <div class="module-head-actions">
            ${
              canManageConfig
                ? `
                  <button class="topbar-icon-button sales-config-button" type="button" data-sales-open-config aria-label="Configurações" title="Configurações">
                    <span aria-hidden="true">⚙</span>
                  </button>
                `
                : ""
            }
            ${canEdit ? `
              <button class="primary-button sales-create-button ${isFormOpen && state.salesDraft.status === "finalized" ? "is-open" : ""}" type="button" data-sales-open-mode="finalized">
                <span>+ Nova Venda</span>
                <span class="production-toggle-icon">${isFormOpen && state.salesDraft.status === "finalized" ? "▴" : "▾"}</span>
              </button>
              <button class="ghost-button sales-create-button ${isFormOpen && state.salesDraft.status === "quote" ? "is-open" : ""}" type="button" data-sales-open-mode="quote">
                <span>Novo Orcamento</span>
                <span class="production-toggle-icon">${isFormOpen && state.salesDraft.status === "quote" ? "▴" : "▾"}</span>
              </button>
            ` : ""}
          </div>
        </div>

        ${
          canEdit
            ? `
              <div class="sales-accordion-shell ${isFormOpen ? "open" : ""}">
                <div class="sales-accordion-card">
                  <div class="sales-form-header">
                    <div>
                      <h4>${state.salesDraft.edit_id ? "Editar Venda" : state.salesDraft.status === "quote" ? "Novo Orcamento" : "Nova Venda"}</h4>
                      <p class="muted">Fluxo comercial com integracao entre clientes, produtos e producao.</p>
                    </div>
                  </div>

                  <form id="sales-form" class="sales-form-grid">
                    <input type="hidden" name="edit_id" value="${helpers.escapeHtml(state.salesDraft.edit_id)}" />
                    <input type="hidden" name="production_generated" value="${state.salesDraft.production_generated ? "true" : "false"}" />

                    <div class="sales-form-row">
                      <label>
                        Cliente *
                        <select name="customer_id" required>
                          <option value="">Selecione um cliente</option>
                          ${helpers.renderOptions(customerOptions, state.salesDraft.customer_id)}
                        </select>
                      </label>
                      <label>
                        CNPJ
                        <input name="cnpj" type="text" readonly value="${helpers.escapeHtml(state.salesDraft.cnpj)}" />
                      </label>
                      <label>
                        Endereco
                        <input name="address" type="text" readonly value="${helpers.escapeHtml(state.salesDraft.address)}" />
                      </label>
                    </div>

                    <div class="sales-form-row">
                      <label>
                        No Nota Fiscal
                        <input name="invoice_number" type="text" placeholder="NF-0001" value="${helpers.escapeHtml(state.salesDraft.invoice_number)}" />
                      </label>
                      <label>
                        Data da Venda *
                        <input name="sale_date" type="date" required value="${helpers.escapeHtml(state.salesDraft.sale_date)}" />
                      </label>
                      <label>
                        Data de Entrega *
                        <input name="delivery_date" type="date" required value="${helpers.escapeHtml(state.salesDraft.delivery_date)}" />
                      </label>
                      <label>
                        Pagamento
                        <select name="payment_method">
                          ${helpers.renderOptions([
                            { value: "", label: "Selecione" },
                            { value: "boleto", label: "Boleto" },
                            { value: "pix", label: "Pix" },
                            { value: "transferencia", label: "Transferencia" },
                            { value: "cartao", label: "Cartao" },
                            { value: "dinheiro", label: "Dinheiro" },
                            { value: "cheque", label: "Cheque" },
                            { value: "negociado_com_o_dono", label: "Negociado com o dono" },
                          ], state.salesDraft.payment_method)}
                        </select>
                      </label>
                    </div>

                    <div class="sales-form-row">
                      <label>
                        Status da venda *
                        <select name="status" required>
                          ${helpers.renderOptions([
                            { value: "quote", label: "Orcamento" },
                            { value: "finalized", label: "Venda Finalizada" },
                          ], state.salesDraft.status)}
                        </select>
                      </label>
                      <label>
                        Contrato de venda
                        <input name="contract_number" type="text" readonly placeholder="Gerado automaticamente" value="${helpers.escapeHtml(state.salesDraft.contract_number)}" />
                      </label>
                    </div>

                    <div class="sales-items-panel">
                      <div class="sales-items-header">
                        <h5>Itens da Venda</h5>
                        <button class="ghost-button" type="button" data-sales-add-item>+ Adicionar</button>
                      </div>

                      <div class="sales-items-list">
                        ${state.salesDraft.items.map((item, index) => renderSalesItemRow(item, index, state, helpers)).join("")}
                      </div>

                      <div class="sales-totals-grid">
                        <article class="sales-total-card">
                          <span>Subtotal</span>
                          <strong data-sales-total="subtotal">${helpers.formatCurrency(totals.subtotal)}</strong>
                        </article>
                        <article class="sales-total-card">
                          <span>Desconto</span>
                          <strong data-sales-total="discount">${helpers.formatCurrency(totals.discount)}</strong>
                        </article>
                        <article class="sales-total-card sales-total-card-primary">
                          <span>Total final</span>
                          <strong data-sales-total="total">${helpers.formatCurrency(totals.total)}</strong>
                        </article>
                      </div>
                    </div>

                    <div class="sales-form-row sales-form-row-full">
                      <label>
                        Observacoes
                        <textarea name="contract_notes" placeholder="Observacoes da venda">${helpers.escapeHtml(state.salesDraft.contract_notes)}</textarea>
                      </label>
                    </div>

                    <div class="form-actions-row sales-form-actions">
                      <button class="ghost-button" type="button" data-sales-cancel>Cancelar</button>
                      <button class="secondary-button" type="button" data-sales-draft-preview="${state.salesDraft.status}">Gerar previa</button>
                      <button class="primary-button" type="submit">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            `
            : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
        }

        ${
          canEdit
            ? `
              <div class="sales-accordion-shell sales-contract-shell ${isContractOpen ? "open" : ""}">
                <div class="sales-accordion-card sales-contract-card">
                  <div class="sales-form-header">
                    <div>
                      <h4>Cadastrar Contrato</h4>
                      <p class="muted">Contrato preenchido automaticamente a partir da venda selecionada.</p>
                    </div>
                  </div>

                  <form id="sales-contract-form" class="sales-form-grid">
                    <input type="hidden" name="sale_id" value="${helpers.escapeHtml(state.salesContractDraft.sale_id)}" />

                    <div class="sales-form-row">
                      <label>
                        Cliente
                        <input name="customer_name" type="text" readonly value="${helpers.escapeHtml(state.salesContractDraft.customer_name)}" />
                      </label>
                      <label>
                        CNPJ
                        <input name="cnpj" type="text" readonly value="${helpers.escapeHtml(state.salesContractDraft.cnpj)}" />
                      </label>
                      <label>
                        Endereco
                        <input name="address" type="text" readonly value="${helpers.escapeHtml(state.salesContractDraft.address)}" />
                      </label>
                      <label>
                        Nota Fiscal
                        <input name="invoice_number" type="text" readonly value="${helpers.escapeHtml(state.salesContractDraft.invoice_number)}" />
                      </label>
                    </div>

                    <div class="sales-form-row">
                      <label>
                        Data da Venda
                        <input name="sale_date" type="date" readonly value="${helpers.escapeHtml(state.salesContractDraft.sale_date)}" />
                      </label>
                      <label>
                        Data de Entrega
                        <input name="delivery_date" type="date" readonly value="${helpers.escapeHtml(state.salesContractDraft.delivery_date)}" />
                      </label>
                      <label>
                        Pagamento
                        <input name="payment_method" type="text" readonly value="${helpers.escapeHtml(helpers.getPaymentMethodLabel(state.salesContractDraft.payment_method))}" />
                      </label>
                      <label>
                        Status
                        <input name="status_label" type="text" readonly value="${helpers.escapeHtml(state.salesContractDraft.status === "finalized" ? "Venda Finalizada" : "Orcamento")}" />
                      </label>
                    </div>

                    <div class="sales-form-row">
                      <label>
                        Contrato de venda
                        <input name="contract_number" type="text" readonly value="${helpers.escapeHtml(state.salesContractDraft.contract_number)}" placeholder="Gerado automaticamente" />
                      </label>
                      <label class="sales-contract-total">
                        Total da venda
                        <input name="total_amount_label" type="text" readonly value="${helpers.escapeHtml(helpers.formatCurrency(state.salesContractDraft.total_amount))}" />
                      </label>
                    </div>

                    <div class="sales-form-row sales-form-row-full">
                      <label>
                        Itens da venda
                        <textarea name="items_label" readonly>${helpers.escapeHtml(state.salesContractDraft.items_label)}</textarea>
                      </label>
                    </div>

                    <div class="sales-form-row sales-form-row-full">
                      <label>
                        Observacoes do contrato
                        <textarea name="contract_notes" placeholder="Clausulas, observacoes e detalhes do contrato">${helpers.escapeHtml(state.salesContractDraft.contract_notes)}</textarea>
                      </label>
                    </div>

                    <div class="form-actions-row sales-form-actions">
                      <button class="ghost-button" type="button" data-sales-contract-cancel>Cancelar</button>
                      <button class="secondary-button" type="button" data-sales-contract-preview="${helpers.escapeHtml(state.salesContractDraft.sale_id)}">Visualizar contrato</button>
                      <button class="primary-button" type="submit">Salvar contrato</button>
                    </div>
                  </form>
                </div>
              </div>
            `
            : ""
        }

        <div class="table-actions sales-filters-row">
          <label class="search-input-shell">
            <span class="search-input-icon">⌕</span>
            <input id="sales-search-input" type="text" placeholder="Buscar venda..." value="${helpers.escapeHtml(state.salesSearch)}" />
          </label>
          <label>
            Status
            <select id="sales-status-filter">
              ${helpers.renderOptions([
                { value: "all", label: "Todos" },
                { value: "quote", label: "Orcamento" },
                { value: "finalized", label: "Venda Finalizada" },
              ], state.salesStatusFilter)}
            </select>
          </label>
        </div>

        <div class="table-card sales-table-card">
          ${
            filteredSales.length
              ? `
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Data da venda</th>
                      <th>Entrega</th>
                      <th>Pagamento</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredSales.map((item) => renderSaleRow(item, canEdit, helpers)).join("")}
                  </tbody>
                </table>
              `
              : `
                <div class="production-empty-state">
                  <div class="production-empty-icon">◨</div>
                  <strong>Nenhuma venda encontrada</strong>
                </div>
              `
          }
        </div>
        ${state.salesConfigModalOpen ? renderSalesConfigModal(canManageConfig, state, helpers) : ""}
        ${state.salesDocumentPreview.open ? renderSalesDocumentPreviewModal(state, helpers) : ""}
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    document.querySelector("[data-sales-open-config]")?.addEventListener("click", () => {
      state.salesConfigModalOpen = true;
      state.salesConfigTab = state.salesDocumentSettings.activeTab || state.salesConfigTab || "quote";
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-sales-open-mode]").forEach((button) => {
      button.addEventListener("click", async () => {
        const mode = button.dataset.salesOpenMode || "quote";
        const shouldOpen = !(state.openAccordionKey === "sales-form" && state.salesDraft.status === mode && !state.salesDraft.edit_id);
        state.openAccordionKey = shouldOpen ? "sales-form" : null;
        state.salesDraft = shouldOpen ? helpers.createEmptySalesDraft(mode) : helpers.createEmptySalesDraft();
        await helpers.renderActiveModule();
        if (shouldOpen) {
          document.querySelector("#sales-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    helpers.bindDeferredTextFilter("#sales-search-input", (value) => {
      state.salesSearch = value;
    });

    helpers.bindDeferredSelectFilter("#sales-status-filter", (value) => {
      state.salesStatusFilter = value;
    });

    const salesForm = document.querySelector("#sales-form");
    if (salesForm) {
      salesForm.addEventListener("submit", helpers.handleSalesSubmit);
      salesForm.addEventListener("input", () => helpers.syncSalesDraftFromForm(salesForm));
      salesForm.addEventListener("change", () => helpers.syncSalesDraftFromForm(salesForm));
    }

    document.querySelector("[data-sales-cancel]")?.addEventListener("click", () => {
      helpers.resetSalesFormState();
      helpers.renderActiveModule();
    });

    document.querySelector("[data-sales-draft-preview]")?.addEventListener("click", () => {
      const type = state.salesDraft.status === "finalized" ? "sale" : "quote";
      helpers.openSalesDocumentPreview(type, state.salesDraft.edit_id);
    });

    document.querySelector('#sales-form select[name="customer_id"]')?.addEventListener("change", helpers.handleSalesCustomerSelection);

    document.querySelector('#sales-form select[name="status"]')?.addEventListener("change", () => {
      helpers.syncSalesDraftFromForm(salesForm);
      helpers.renderActiveModule();
    });

    document.querySelector("[data-sales-add-item]")?.addEventListener("click", () => {
      state.salesDraft.items.push(helpers.createEmptySalesItemDraft());
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-sales-remove-item]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.salesDraft.items.length === 1) {
          state.salesDraft.items = [helpers.createEmptySalesItemDraft()];
        } else {
          state.salesDraft.items.splice(Number(button.dataset.salesRemoveItem), 1);
        }
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-sales-item-field]").forEach((field) => {
      field.addEventListener("change", helpers.handleSalesItemFieldChange);
      field.addEventListener("input", helpers.handleSalesItemFieldChange);
    });

    document.querySelectorAll("[data-sales-edit-id], [data-sales-view-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const sale = state.moduleData.sales.find((item) => item.id === (button.dataset.salesEditId || button.dataset.salesViewId));
        if (!sale) return;

        state.salesDraft = helpers.hydrateSalesDraft(sale);
        state.openAccordionKey = "sales-form";
        await helpers.renderActiveModule();
        document.querySelector("#sales-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-sales-contract-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const sale = state.moduleData.sales.find((item) => item.id === button.dataset.salesContractId);
        if (!sale) return;

        state.salesContractDraft = helpers.hydrateSalesContractDraft(sale);
        state.openAccordionKey = "sales-contract-form";
        await helpers.renderActiveModule();
        document.querySelector("#sales-contract-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-sales-generate-document]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.openSalesDocumentPreview(button.dataset.salesGenerateDocument, button.dataset.salesDocumentId);
      });
    });

    document.querySelectorAll("[data-sales-send-document]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.openSalesDocumentPreview("quote", button.dataset.salesSendDocument);
      });
    });

    document.querySelectorAll("[data-sales-delete-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const { error } = await state.supabase.from("sales").delete().eq("id", button.dataset.salesDeleteId);
          if (error) throw error;
          await helpers.loadTable("sales", "sales");
          helpers.renderActiveModule();
          helpers.showToast("Venda excluida com sucesso.", "success");
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-sales-finalize-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const sale = state.moduleData.sales.find((item) => item.id === button.dataset.salesFinalizeId);
        if (!sale) return;

        try {
          await helpers.finalizeSaleRecord(sale);
          await helpers.loadTable("sales", "sales");
          await helpers.loadTable("production_orders", "production");
          helpers.renderActiveModule();
          helpers.showToast("Venda finalizada e enviada para producao.", "success");
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });

    const salesContractForm = document.querySelector("#sales-contract-form");
    if (salesContractForm) {
      salesContractForm.addEventListener("submit", helpers.handleSalesContractSubmit);
      salesContractForm.addEventListener("input", () => helpers.syncSalesContractDraftFromForm(salesContractForm));
      salesContractForm.addEventListener("change", () => helpers.syncSalesContractDraftFromForm(salesContractForm));
    }

    document.querySelector("[data-sales-contract-cancel]")?.addEventListener("click", () => {
      helpers.resetSalesContractFormState();
      helpers.renderActiveModule();
    });

    document.querySelector("[data-sales-contract-preview]")?.addEventListener("click", () => {
      if (!state.salesContractDraft.sale_id) {
        helpers.showToast("Salve ou selecione uma venda para visualizar o contrato.", "warning");
        return;
      }
      helpers.openSalesDocumentPreview("contract", state.salesContractDraft.sale_id);
    });

    bindSalesConfigEvents(bridge);
    bindSalesDocumentPreviewEvents(bridge);
  },
};
