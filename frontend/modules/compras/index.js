function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponivel.");
  }
  return bridge;
}

function buildPurchaseRequesterOptions(state) {
  return (state.moduleData.users || []).map((user) => ({
    value: user.id,
    label: user.full_name,
  }));
}

function renderPurchaseItemRow(item, index, helpers) {
  return `
    <article class="purchase-item-row" data-purchase-item-index="${index}">
      <label>
        Produto / Item solicitado
        <input data-purchase-item-field="product_name" data-purchase-item-index="${index}" type="text" value="${helpers.escapeHtml(item.product_name)}" />
      </label>
      <label>
        Descricao
        <input data-purchase-item-field="description" data-purchase-item-index="${index}" type="text" value="${helpers.escapeHtml(item.description)}" />
      </label>
      <label>
        Quantidade
        <input data-purchase-item-field="quantity" data-purchase-item-index="${index}" type="number" min="0.01" step="0.01" value="${helpers.escapeHtml(item.quantity)}" />
      </label>
      <label>
        Unidade
        <input data-purchase-item-field="unit" data-purchase-item-index="${index}" type="text" value="${helpers.escapeHtml(item.unit)}" />
      </label>
      <label>
        Medidas
        <input data-purchase-item-field="measures" data-purchase-item-index="${index}" type="text" placeholder="Ex.: 1200 x 800 x 3 mm" value="${helpers.escapeHtml(item.measures)}" />
      </label>
      <button class="inline-button danger-button sales-item-remove" type="button" data-purchase-remove-item="${index}">Remover</button>
    </article>
  `;
}

function renderPurchaseFileList(files, key, helpers) {
  if (!files.length) {
    return `<div class="empty-state compact-empty">Nenhum arquivo enviado.</div>`;
  }

  return files
    .map((file, index) => `
      <article class="bom-file-card">
        <div>
          <strong>${helpers.escapeHtml(file.name)}</strong>
          <div class="table-inline-copy muted">${helpers.formatFileSize(file.size)} • ${helpers.escapeHtml(file.type || "arquivo")}</div>
        </div>
        <button class="inline-button danger-button" type="button" data-purchase-remove-file="${key}" data-purchase-file-index="${index}">Remover</button>
      </article>
    `)
    .join("");
}

function renderPurchaseUploadField(label, key, files, accept, helpers, multiple = false) {
  return `
    <section class="purchase-upload-panel">
      <div class="purchase-upload-header">
        <div>
          <strong>${label}</strong>
          <div class="table-inline-copy muted">${multiple ? "Multiplos arquivos permitidos" : "Um arquivo por vez"}</div>
        </div>
        <input class="purchase-upload-input" type="file" data-purchase-upload="${key}" ${multiple ? "multiple" : ""} accept="${accept}" />
      </div>
      <div class="bom-upload-list">
        ${renderPurchaseFileList(files, key, helpers)}
      </div>
    </section>
  `;
}

function purchaseActionCell(item, canEdit, helpers) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  const metadata = item.metadata || helpers.getPurchaseRequestMetadata(item);
  const canConclude = metadata.status === "approved" || metadata.status === "in_purchase" || metadata.status === "purchase_completed";

  return `
    <div class="action-button-group">
      <button class="inline-button" type="button" data-purchase-view-id="${item.id}">Visualizar</button>
      <button class="inline-button" type="button" data-purchase-edit-id="${item.id}">Editar</button>
      ${
        metadata.status === "pending" || metadata.status === "in_analysis"
          ? `<button class="inline-button movement-button" type="button" data-purchase-status-action="${item.id}" data-purchase-next-status="approved">Aprovar</button>`
          : ""
      }
      ${
        metadata.status === "approved"
          ? `<button class="inline-button" type="button" data-purchase-status-action="${item.id}" data-purchase-next-status="purchase_completed">Marcar compra efetuada</button>`
          : ""
      }
      ${
        canConclude
          ? `<button class="inline-button" type="button" data-purchase-open-conclusion="${item.id}">Concluir compra</button>`
          : ""
      }
      <button class="inline-button" type="button" data-purchase-notify-id="${item.id}">Notificar</button>
      <button class="inline-button danger-button" type="button" data-purchase-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderPurchaseRow(item, canEdit, helpers) {
  return `
    <tr>
      <td>
        <strong>${helpers.escapeHtml(item.metadata.requester_name || "-")}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(item.metadata.primaryItemLabel || "Sem itens")}</div>
        <div class="table-inline-copy muted">${helpers.escapeHtml(item.metadata.primaryMeasuresLabel || "Sem medidas")}</div>
      </td>
      <td>${helpers.escapeHtml(item.metadata.department || "-")}</td>
      <td>${helpers.purchaseUrgencyCell(item.metadata.urgency)}</td>
      <td>${helpers.purchaseStatusCell(item.metadata.status)}</td>
      <td>${helpers.formatDateTime(item.created_at)}</td>
      <td>${purchaseActionCell(item, canEdit, helpers)}</td>
    </tr>
  `;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("purchases", "view")) {
      return helpers.noPermissionTemplate("Seu perfil nao possui acesso ao modulo de compras.");
    }

    const canEdit = bridge.hasPermission("purchases", "edit");
    const isRequestFormOpen = state.openAccordionKey === "purchase-form";
    const isConclusionFormOpen = state.openAccordionKey === "purchase-conclusion-form";
    const requesterOptions = buildPurchaseRequesterOptions(state);
    const requests = (state.moduleData.purchases || []).map((item) => ({
      ...item,
      metadata: helpers.getPurchaseRequestMetadata(item),
    }));
    const searchTerm = state.purchaseSearch.trim().toLowerCase();
    const filteredRequests = requests.filter(({ metadata }) => {
      const searchableItems = (metadata.items || [])
        .map((purchaseItem) => [purchaseItem.product_name, purchaseItem.description, purchaseItem.unit].join(" "))
        .join(" ");
      const matchesSearch = !searchTerm
        || [
          metadata.requester_name,
          metadata.department,
          searchableItems,
          metadata.purchaseDetails.order_number,
          metadata.purchaseDetails.invoice_number,
          metadata.purchaseDetails.supplier,
        ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesStatus = state.purchaseStatusFilter === "all" || metadata.status === state.purchaseStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const pendingCount = requests.filter(({ metadata }) => metadata.status === "pending").length;
    const inPurchaseCount = requests.filter(({ metadata }) => metadata.status === "in_purchase").length;
    const completedCount = requests.filter(({ metadata }) => metadata.status === "completed").length;
    const notificationCount = requests.reduce((total, { metadata }) => total + (metadata.notifications || []).length, 0);
    const requestSummaryLabel = `${requests.length} ${requests.length === 1 ? "solicitacao" : "solicitacoes"}`;

    return `
      <section class="module-panel purchases-module">
        <div class="module-head purchases-head">
          <div>
            <p class="eyebrow muted">Compras</p>
            <h3>Solicitacao de Compras</h3>
            <p class="muted">${requestSummaryLabel}</p>
          </div>
          <div class="module-head-actions">
            <button class="topbar-icon-button purchase-alert-button" type="button" data-purchase-notification-center aria-label="Alertas de compras">
              <span>◔</span>
              ${notificationCount ? `<strong class="notification-pill">${notificationCount}</strong>` : ""}
            </button>
          </div>
        </div>

        <div class="summary-grid purchases-summary-grid">
          ${helpers.renderKpiCard({
            label: "Solicitacoes",
            value: requests.length,
            note: `${pendingCount} pendente(s) para analise`,
            icon: "◧",
            tone: "blue",
          })}
          ${helpers.renderKpiCard({
            label: "Em Compra",
            value: inPurchaseCount,
            note: inPurchaseCount ? "Pedidos em andamento" : "Nenhuma compra em andamento",
            icon: "◎",
            tone: "amber",
          })}
          ${helpers.renderKpiCard({
            label: "Concluidas",
            value: completedCount,
            note: completedCount ? "Compras finalizadas" : "Nenhuma compra concluida",
            icon: "◪",
            tone: "green",
          })}
        </div>

        ${
          canEdit
            ? `
              <div class="purchase-accordion-shell ${isRequestFormOpen ? "open" : ""}">
                <div class="purchase-accordion-card">
                  <div class="purchase-form-header">
                    <div>
                      <h4>${state.purchaseDraft.edit_id ? "Editar Solicitacao" : "Nova Solicitacao"}</h4>
                      <p class="muted">Accordion controlado, responsivo e preparado para integracao com backend.</p>
                    </div>
                  </div>

                  <form id="purchase-form" class="purchase-form-grid">
                    <input type="hidden" name="edit_id" value="${helpers.escapeHtml(state.purchaseDraft.edit_id)}" />

                    <div class="purchase-form-row">
                      ${
                        requesterOptions.length
                          ? `
                            <label>
                              Solicitante *
                              <select name="requester_id" required>
                                <option value="">Selecione um solicitante</option>
                                ${helpers.renderOptions(requesterOptions, state.purchaseDraft.requester_id)}
                              </select>
                            </label>
                          `
                          : `
                            <label>
                              Solicitante *
                              <input name="requester_name" type="text" required value="${helpers.escapeHtml(state.purchaseDraft.requester_name)}" />
                            </label>
                          `
                      }
                      <label>
                        Departamento *
                        <select name="department" required>
                          ${helpers.renderOptions([
                            { value: "", label: "Selecione" },
                            { value: "Usinagem", label: "Usinagem" },
                            { value: "Montagem", label: "Montagem" },
                            { value: "Fabricacao", label: "Fabricacao" },
                            { value: "Compras", label: "Compras" },
                            { value: "Administrativo", label: "Administrativo" },
                            { value: "Financeiro", label: "Financeiro" },
                          ], state.purchaseDraft.department)}
                        </select>
                      </label>
                      <label>
                        Urgencia
                        <select name="urgency">
                          ${helpers.renderOptions([
                            { value: "baixa", label: "Baixa" },
                            { value: "media", label: "Media" },
                            { value: "alta", label: "Alta" },
                            { value: "urgente", label: "Urgente" },
                          ], state.purchaseDraft.urgency || "media")}
                        </select>
                      </label>
                    </div>

                    <div class="purchase-items-panel">
                      <div class="purchase-items-header">
                        <div>
                          <h5>Itens da solicitacao</h5>
                          <p class="muted">Adicione varios itens e acompanhe o subtotal de cada linha.</p>
                        </div>
                        <button class="ghost-button" type="button" data-purchase-add-item>+ Adicionar</button>
                      </div>

                      <div class="purchase-items-list">
                        ${state.purchaseDraft.items.map((item, index) => renderPurchaseItemRow(item, index, helpers)).join("")}
                      </div>
                    </div>

                    <div class="purchase-form-row purchase-form-row-full">
                      <label>
                        Justificativa
                        <textarea name="justification" placeholder="Explique o motivo da compra">${helpers.escapeHtml(state.purchaseDraft.justification)}</textarea>
                      </label>
                    </div>

                    <div class="form-actions-row purchase-form-actions">
                      <button class="ghost-button" type="button" data-purchase-cancel>Cancelar</button>
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
              <div class="purchase-accordion-shell purchase-conclusion-shell ${isConclusionFormOpen ? "open" : ""}">
                <div class="purchase-accordion-card purchase-conclusion-card">
                  <div class="purchase-form-header">
                    <div>
                      <h4>Concluir Compra</h4>
                      <p class="muted">Registre pedido, nota fiscal, pagamento, anexos e a notificacao ao solicitante.</p>
                    </div>
                  </div>

                  <form id="purchase-conclusion-form" class="purchase-form-grid">
                    <input type="hidden" name="request_id" value="${helpers.escapeHtml(state.purchaseConclusionDraft.request_id)}" />

                    <div class="purchase-form-row">
                      <label>
                        Numero do pedido
                        <input name="order_number" type="text" placeholder="PED-20260407-001" value="${helpers.escapeHtml(state.purchaseConclusionDraft.order_number)}" />
                      </label>
                      <label>
                        Numero da nota fiscal
                        <input name="invoice_number" type="text" placeholder="NF-000123" value="${helpers.escapeHtml(state.purchaseConclusionDraft.invoice_number)}" />
                      </label>
                      <label>
                        Valor total da compra *
                        <input
                          name="total_amount"
                          type="text"
                          inputmode="decimal"
                          data-currency-input="true"
                          data-currency-allow-empty="true"
                          value="${helpers.escapeHtml(state.purchaseConclusionDraft.total_amount)}"
                        />
                      </label>
                      <label>
                        Forma de Pagamento *
                        <select name="payment_method" required>
                          ${helpers.renderOptions([
                            { value: "", label: "Selecione" },
                            { value: "Dinheiro", label: "Dinheiro" },
                            { value: "Pix", label: "Pix" },
                            { value: "Cartao", label: "Cartao" },
                            { value: "Boleto", label: "Boleto" },
                            { value: "Notinha", label: "Notinha" },
                          ], state.purchaseConclusionDraft.payment_method)}
                        </select>
                      </label>
                    </div>

                    <div class="purchase-form-row">
                      <label>
                        Data da compra
                        <input name="purchase_date" type="date" value="${helpers.escapeHtml(state.purchaseConclusionDraft.purchase_date)}" />
                      </label>
                      <label>
                        Fornecedor
                        <input name="supplier" type="text" placeholder="Fornecedor" value="${helpers.escapeHtml(state.purchaseConclusionDraft.supplier)}" />
                      </label>
                    </div>

                    <div class="purchase-form-row purchase-form-row-full">
                      <label>
                        Observacoes da compra
                        <textarea name="purchase_notes" placeholder="Detalhes da compra">${helpers.escapeHtml(state.purchaseConclusionDraft.purchase_notes)}</textarea>
                      </label>
                    </div>

                    <div class="purchase-upload-grid">
                      ${renderPurchaseUploadField("Arquivo do pedido", "order_files", state.purchaseConclusionDraft.order_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx", helpers)}
                      ${renderPurchaseUploadField("Arquivo da nota fiscal", "invoice_files", state.purchaseConclusionDraft.invoice_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx", helpers)}
                      ${renderPurchaseUploadField("Comprovantes adicionais", "attachment_files", state.purchaseConclusionDraft.attachment_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx", helpers, true)}
                      ${
                        state.purchaseConclusionDraft.payment_method === "Boleto"
                          ? renderPurchaseUploadField("Boletos", "boleto_files", state.purchaseConclusionDraft.boleto_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx", helpers, true)
                          : ""
                      }
                    </div>

                    <div class="form-actions-row purchase-form-actions">
                      <button class="ghost-button" type="button" data-purchase-conclusion-cancel>Cancelar</button>
                      <button class="primary-button" type="submit">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            `
            : ""
        }

        <div class="purchase-toolbar">
          <div class="purchase-toolbar-head">
            <div>
              <p class="eyebrow muted">Solicitacoes</p>
              <h4>${requests.length} solicitacoes</h4>
            </div>
            <div class="purchase-toolbar-actions">
              <button class="topbar-icon-button purchase-alert-button" type="button" data-purchase-inline-alert aria-label="Notificacoes">
                <span>◔</span>
              </button>
              ${
                canEdit
                  ? `
                    <button class="primary-button purchase-create-button ${isRequestFormOpen ? "is-open" : ""}" type="button" data-purchase-toggle-form>
                      <span>+ Nova Solicitacao</span>
                      <span class="production-toggle-icon">${isRequestFormOpen ? "▴" : "▾"}</span>
                    </button>
                  `
                  : ""
              }
            </div>
          </div>

          <div class="table-actions purchases-filters-row">
            <label class="search-input-shell">
              <span class="search-input-icon">⌕</span>
              <input id="purchase-search-input" type="text" placeholder="Buscar..." value="${helpers.escapeHtml(state.purchaseSearch)}" />
            </label>
            <label>
              Status
              <select id="purchase-status-filter">
                ${helpers.renderOptions([
                  { value: "all", label: "Todos" },
                  { value: "pending", label: "Pendente" },
                  { value: "in_analysis", label: "Em analise" },
                  { value: "approved", label: "Aprovada" },
                  { value: "in_purchase", label: "Em compra" },
                  { value: "purchase_completed", label: "Compra efetuada" },
                  { value: "completed", label: "Concluida" },
                  { value: "cancelled", label: "Cancelada" },
                ], state.purchaseStatusFilter)}
              </select>
            </label>
          </div>
        </div>

        <div class="table-card purchase-table-card">
          ${
            filteredRequests.length
              ? `
                <table>
                  <thead>
                    <tr>
                      <th>Solicitante</th>
                      <th>Departamento</th>
                      <th>Urgencia</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredRequests.map(({ id, created_at, metadata }) => renderPurchaseRow({ id, created_at, metadata }, canEdit, helpers)).join("")}
                  </tbody>
                </table>
              `
              : `
                <div class="production-empty-state purchase-empty-state">
                  <div class="production-empty-icon">◧</div>
                  <strong>Nenhuma solicitacao encontrada</strong>
                </div>
              `
          }
        </div>
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    document.querySelectorAll("[data-purchase-toggle-form]").forEach((button) => {
      button.addEventListener("click", () => {
        const shouldOpen = state.openAccordionKey !== "purchase-form";
        state.openAccordionKey = shouldOpen ? "purchase-form" : null;
        state.purchaseDraft = helpers.createEmptyPurchaseDraft();
        if (shouldOpen) {
          state.purchaseDraft.requester_id = state.currentUser?.user_id || "";
          state.purchaseDraft.requester_name = helpers.getLoggedUserName("");
        }
        helpers.renderActiveModule();
        if (shouldOpen) {
          document.querySelector("#purchase-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    helpers.bindDeferredTextFilter("#purchase-search-input", (value) => {
      state.purchaseSearch = value;
    });

    helpers.bindDeferredSelectFilter("#purchase-status-filter", (value) => {
      state.purchaseStatusFilter = value;
    });

    const purchaseForm = document.querySelector("#purchase-form");
    if (purchaseForm) {
      purchaseForm.addEventListener("submit", helpers.handlePurchaseSubmit);
      purchaseForm.addEventListener("input", () => helpers.syncPurchaseDraftFromForm(purchaseForm));
      purchaseForm.addEventListener("change", () => helpers.syncPurchaseDraftFromForm(purchaseForm));
    }

    const requesterField = document.querySelector('#purchase-form select[name="requester_id"]');
    if (requesterField) {
      requesterField.addEventListener("change", helpers.handlePurchaseRequesterSelection);
    }

    const cancelButton = document.querySelector("[data-purchase-cancel]");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        helpers.resetPurchaseFormState();
        helpers.renderActiveModule();
      });
    }

    const addItemButton = document.querySelector("[data-purchase-add-item]");
    if (addItemButton) {
      addItemButton.addEventListener("click", () => {
        state.purchaseDraft.items.push(helpers.createEmptyPurchaseItemDraft());
        helpers.renderActiveModule();
      });
    }

    document.querySelectorAll("[data-purchase-remove-item]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.purchaseDraft.items.length === 1) {
          state.purchaseDraft.items = [helpers.createEmptyPurchaseItemDraft()];
        } else {
          state.purchaseDraft.items.splice(Number(button.dataset.purchaseRemoveItem), 1);
        }
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-purchase-item-field]").forEach((field) => {
      field.addEventListener("input", helpers.handlePurchaseItemFieldChange);
      field.addEventListener("change", helpers.handlePurchaseItemFieldChange);
    });

    document.querySelectorAll("[data-purchase-view-id], [data-purchase-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const recordId = button.dataset.purchaseViewId || button.dataset.purchaseEditId;
        const request = (state.moduleData.purchases || []).find((item) => item.id === recordId);
        if (!request) return;
        state.purchaseDraft = helpers.hydratePurchaseDraft(request);
        state.openAccordionKey = "purchase-form";
        await helpers.renderActiveModule();
        document.querySelector("#purchase-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-purchase-open-conclusion]").forEach((button) => {
      button.addEventListener("click", async () => {
        const request = (state.moduleData.purchases || []).find((item) => item.id === button.dataset.purchaseOpenConclusion);
        if (!request) return;
        state.purchaseConclusionDraft = helpers.hydratePurchaseConclusionDraft(request);
        state.openAccordionKey = "purchase-conclusion-form";
        await helpers.renderActiveModule();
        document.querySelector("#purchase-conclusion-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-purchase-status-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const request = (state.moduleData.purchases || []).find((item) => item.id === button.dataset.purchaseStatusAction);
        if (!request) return;
        try {
          await helpers.updatePurchaseRequestStatus(request, button.dataset.purchaseNextStatus);
          await helpers.loadTable("purchase_requests", "purchases");
          await helpers.renderActiveModule();
        } catch (error) {
          helpers.showPurchaseNotification(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-purchase-delete-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const { error } = await state.supabase.from("purchase_requests").delete().eq("id", button.dataset.purchaseDeleteId);
          if (error) throw error;
          await helpers.loadTable("purchase_requests", "purchases");
          helpers.resetPurchaseFormState();
          helpers.resetPurchaseConclusionState();
          await helpers.renderActiveModule();
          helpers.showPurchaseNotification("Solicitacao excluida com sucesso.", "approved");
        } catch (error) {
          helpers.showPurchaseNotification(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-purchase-notify-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const request = (state.moduleData.purchases || []).find((item) => item.id === button.dataset.purchaseNotifyId);
        if (!request) return;
        try {
          await helpers.notifyPurchaseRequester(request, helpers.buildPurchaseRequesterMessage(helpers.getPurchaseRequestMetadata(request)));
          await helpers.loadTable("purchase_requests", "purchases");
          await helpers.renderActiveModule();
        } catch (error) {
          helpers.showPurchaseNotification(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-purchase-notification-center], [data-purchase-inline-alert]").forEach((button) => {
      button.addEventListener("click", () => {
        const latestNotifications = (state.moduleData.purchases || [])
          .flatMap((item) => helpers.getPurchaseRequestMetadata(item).notifications || [])
          .slice(0, 4)
          .map((notification) => notification.message)
          .filter(Boolean);
        helpers.showPurchaseNotification(latestNotifications[0] || "Sem novos avisos de compras.", latestNotifications.length ? "notified" : "approved");
      });
    });

    const purchaseConclusionForm = document.querySelector("#purchase-conclusion-form");
    if (purchaseConclusionForm) {
      purchaseConclusionForm.addEventListener("submit", helpers.handlePurchaseConclusionSubmit);
      purchaseConclusionForm.addEventListener("input", () => helpers.syncPurchaseConclusionDraftFromForm(purchaseConclusionForm));
      purchaseConclusionForm.addEventListener("change", () => helpers.syncPurchaseConclusionDraftFromForm(purchaseConclusionForm));
    }

    const purchaseConclusionCancel = document.querySelector("[data-purchase-conclusion-cancel]");
    if (purchaseConclusionCancel) {
      purchaseConclusionCancel.addEventListener("click", () => {
        helpers.resetPurchaseConclusionState();
        helpers.renderActiveModule();
      });
    }

    document.querySelectorAll("[data-purchase-upload]").forEach((input) => {
      input.addEventListener("change", helpers.handlePurchaseFileSelection);
    });

    document.querySelectorAll("[data-purchase-remove-file]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.removePurchaseFile(button.dataset.purchaseRemoveFile, Number(button.dataset.purchaseFileIndex));
        helpers.renderActiveModule();
      });
    });
  },
};
