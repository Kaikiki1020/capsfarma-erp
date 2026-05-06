function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

function renderAttachmentList(files, helpers) {
  if (!files.length) {
    return `<div class="empty-state compact-empty">Nenhum comprovante enviado.</div>`;
  }

  return files.map((file, index) => `
    <article class="bom-file-card">
      <div>
        <strong>${helpers.escapeHtml(file.name)}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(file.category || "anexo")} • ${helpers.formatFileSize(file.size || 0)}</div>
      </div>
      <div class="action-button-group">
        ${file.data_url ? `<button class="inline-button" type="button" data-payable-open-attachment="${index}">Visualizar</button>` : ""}
        <button class="inline-button danger-button" type="button" data-payable-remove-attachment="${index}">Remover</button>
      </div>
    </article>
  `).join("");
}

function renderReadonlyAttachmentList(files, helpers) {
  if (!files.length) {
    return `<div class="empty-state compact-empty">Nenhum comprovante salvo.</div>`;
  }

  return files.map((file, index) => `
    <article class="bom-file-card">
      <div>
        <strong>${helpers.escapeHtml(file.name)}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(file.category || "anexo")} • ${helpers.formatFileSize(file.size || 0)}</div>
      </div>
      ${file.data_url ? `<button class="inline-button" type="button" data-payable-open-saved-attachment="${index}">Visualizar</button>` : `<span class="muted">Sem preview</span>`}
    </article>
  `).join("");
}

function renderPayableActionCell(entry, helpers) {
  const { payable, metadata } = entry;
  return `
    <div class="action-button-group">
      <button class="inline-button" type="button" data-payable-select-id="${payable.id}">Detalhes</button>
      <button class="inline-button" type="button" data-payable-edit-id="${payable.id}">Editar</button>
      ${["pending", "overdue"].includes(metadata.status) ? `<button class="inline-button movement-button" type="button" data-payable-pay-id="${payable.id}">Marcar como pago</button>` : ""}
      ${metadata.status !== "paid" && metadata.status !== "cancelled" ? `<button class="inline-button danger-button" type="button" data-payable-cancel-id="${payable.id}">Cancelar</button>` : ""}
    </div>
  `;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("payables", "view")) {
      return helpers.noPermissionTemplate("Seu perfil não possui acesso ao módulo de contas a pagar.");
    }

    const snapshot = helpers.getPayablesSnapshot();
    const filters = state.payablesFilters || helpers.createEmptyPayablesFilters();
    const selectedId = state.payablesSelectedId || snapshot.entries[0]?.payable.id || "";
    const selectedEntry = snapshot.entries.find((entry) => entry.payable.id === selectedId) || snapshot.entries[0] || null;
    const isFormOpen = state.openAccordionKey === "payable-form";
    const isPaymentOpen = Boolean(state.payablesPaymentDraft?.payable_id);

    const filteredEntries = snapshot.entries.filter((entry) => {
      const { metadata } = entry;
      const search = filters.search?.trim().toLowerCase() || "";
      const matchesSearch = !search || [
        metadata.payable_number,
        metadata.description,
        metadata.supplier,
        metadata.category,
        metadata.purchase_request_number,
      ].some((value) => String(value || "").toLowerCase().includes(search));
      const matchesStatus = filters.status === "all" || metadata.status === filters.status;
      const matchesCategory = filters.category === "all" || metadata.category === filters.category;
      const matchesType = filters.type === "all" || metadata.account_type === filters.type;
      const matchesFrom = !filters.from || metadata.due_date >= filters.from;
      const matchesTo = !filters.to || metadata.due_date <= filters.to;
      return matchesSearch && matchesStatus && matchesCategory && matchesType && matchesFrom && matchesTo;
    });
    const groupedEntries = Array.from(filteredEntries.reduce((map, entry) => {
      const groupKey = entry.metadata.purchase_request_number || `manual:${entry.payable.id}`;
      const current = map.get(groupKey) || {
        key: groupKey,
        label: entry.metadata.purchase_request_number
          ? `Compra ${entry.metadata.purchase_request_number}`
          : "Conta avulsa",
        supplier: entry.metadata.supplier || "-",
        entries: [],
      };
      current.entries.push(entry);
      map.set(groupKey, current);
      return map;
    }, new Map()).values()).map((group) => ({
      ...group,
      isExpanded: state.payablesExpandedGroups?.[group.key] !== false,
      entries: group.entries.sort((left, right) => {
        const installmentDelta = Number(left.metadata.purchase_installment_number || 0) - Number(right.metadata.purchase_installment_number || 0);
        if (installmentDelta !== 0) return installmentDelta;
        return String(left.metadata.due_date || "").localeCompare(String(right.metadata.due_date || ""));
      }),
    }));

    const urgentEntries = filteredEntries.filter((entry) => entry.metadata.priorityRank <= 2).slice(0, 3);

    return `
      <section class="module-panel payables-module">
        <div class="module-head">
          <div>
            <p class="eyebrow muted">Financeiro operacional</p>
            <h3>Contas a Pagar</h3>
            <p class="muted">Controle completo, recorrencia, comprovantes, alertas e baixa financeira.</p>
          </div>
          <div class="module-head-actions">
            <button class="ghost-button" type="button" data-payable-reset-filters>Limpar filtros</button>
            <button class="primary-button" type="button" data-payable-toggle-form>${isFormOpen ? "Fechar cadastro" : "Nova Conta"}</button>
          </div>
        </div>

        <div class="summary-grid">
          ${helpers.renderKpiCard({ label: "Total hoje", value: helpers.formatCurrency(snapshot.totalDueToday), note: `${snapshot.entries.filter((entry) => entry.metadata.isDueToday).length} vencimento(s) hoje`, icon: "◔", tone: snapshot.totalDueToday ? "amber" : "green" })}
          ${helpers.renderKpiCard({ label: "Semana", value: helpers.formatCurrency(snapshot.totalWeek), note: `${snapshot.pending.length} conta(s) em aberto`, icon: "◷", tone: snapshot.totalWeek ? "blue" : "green" })}
          ${helpers.renderKpiCard({ label: "Mes", value: helpers.formatCurrency(snapshot.totalMonth), note: `${snapshot.entries.length} conta(s) monitoradas`, icon: "◲", tone: "blue" })}
          ${helpers.renderKpiCard({ label: "Vencidas", value: helpers.formatCurrency(snapshot.totalOverdue), note: `${snapshot.overdue.length} conta(s) atrasadas`, icon: "!", tone: snapshot.overdue.length ? "red" : "green" })}
          ${helpers.renderKpiCard({ label: "Fluxo de caixa", value: helpers.formatCurrency(snapshot.cashFlow), note: "Recebimentos menos compromissos da semana", icon: "R$", tone: snapshot.cashFlow >= 0 ? "green" : "red" })}
        </div>

        <form id="payables-filter-form" class="table-actions reports-filter-grid">
          <label>Busca<input type="text" name="search" placeholder="Descrição, fornecedor, número..." value="${helpers.escapeHtml(filters.search || "")}" /></label>
          <label>De<input type="date" name="from" value="${helpers.escapeHtml(filters.from || "")}" /></label>
          <label>Até<input type="date" name="to" value="${helpers.escapeHtml(filters.to || "")}" /></label>
          <label>Status<select name="status"><option value="all">Todos</option>${helpers.renderOptions([
            { value: "pending", label: "Pendente" },
            { value: "paid", label: "Pago" },
            { value: "overdue", label: "Atrasado" },
            { value: "cancelled", label: "Cancelado" },
          ], filters.status)}</select></label>
          <label>Categoria<select name="category"><option value="all">Todas</option>${helpers.renderOptions(helpers.getPayableCategoryOptions(), filters.category)}</select></label>
          <label>Tipo<select name="type"><option value="all">Todos</option>${helpers.renderOptions([
            { value: "fixed", label: "Fixa" },
            { value: "variable", label: "Variavel" },
          ], filters.type)}</select></label>
          <div class="form-actions-row">
            <button class="primary-button" type="submit">Aplicar filtros</button>
          </div>
        </form>

        ${urgentEntries.length ? `
          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Prioridade de pagamento</h4>
                <p class="muted">Sugestão automática considerando vencimento e atraso.</p>
              </div>
            </div>
            <div class="stack-list">
              ${urgentEntries.map((entry) => `
                <article class="dashboard-alert dashboard-alert-${entry.metadata.isOverdue ? "danger" : entry.metadata.isDueToday ? "warning" : "info"}">
                  <div>
                    <strong>${helpers.escapeHtml(entry.metadata.description)}</strong>
                    <p>${helpers.escapeHtml(entry.metadata.supplier)}${entry.metadata.purchase_installment_label ? ` • ${helpers.escapeHtml(entry.metadata.purchase_installment_label)}` : ""} • vence em ${helpers.escapeHtml(helpers.formatDate(entry.metadata.due_date))} • ${helpers.formatCurrency(entry.metadata.amount)}</p>
                  </div>
                  <button class="inline-button" type="button" data-payable-pay-id="${entry.payable.id}">Pagar</button>
                </article>
              `).join("")}
            </div>
          </section>
        ` : ""}

        ${isFormOpen ? `
          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>${state.payablesDraft.edit_id ? "Editar conta" : "Nova conta a pagar"}</h4>
                <p class="muted">Suporte para contas fixas, variaveis e comprovantes PDF/nota/boleto.</p>
              </div>
            </div>
            <form id="payables-form" class="purchase-form-grid">
              <input type="hidden" name="edit_id" value="${helpers.escapeHtml(state.payablesDraft.edit_id || "")}" />
              <input type="hidden" name="payable_number" value="${helpers.escapeHtml(state.payablesDraft.payable_number || "")}" />
              <div class="purchase-form-row">
                <label>Descrição *<input name="description" type="text" required value="${helpers.escapeHtml(state.payablesDraft.description || "")}" /></label>
                <label>Fornecedor *<input name="supplier" type="text" required value="${helpers.escapeHtml(state.payablesDraft.supplier || "")}" /></label>
                <label>Categoria *<select name="category">${helpers.renderOptions(helpers.getPayableCategoryOptions(), state.payablesDraft.category)}</select></label>
              </div>
              <div class="purchase-form-row">
                <label>Valor *<input name="amount" type="number" min="0.01" step="0.01" required value="${helpers.escapeHtml(state.payablesDraft.amount || "")}" /></label>
                <label>Vencimento *<input name="due_date" type="date" required value="${helpers.escapeHtml(state.payablesDraft.due_date || "")}" /></label>
                <label>Forma de pagamento<select name="payment_method">${helpers.renderOptions([
                  { value: "", label: "Selecione" },
                  { value: "pix", label: "Pix" },
                  { value: "boleto", label: "Boleto" },
                  { value: "cartao", label: "Cartão" },
                  { value: "transferencia", label: "Transferência" },
                ], state.payablesDraft.payment_method)}</select></label>
              </div>
              <div class="purchase-form-row">
                <label>Tipo<select name="account_type">${helpers.renderOptions([
                  { value: "fixed", label: "Conta fixa" },
                  { value: "variable", label: "Conta variavel" },
                ], state.payablesDraft.account_type)}</select></label>
                <label>Frequência<select name="frequency" ${state.payablesDraft.account_type === "fixed" ? "" : "disabled"}>${helpers.renderOptions(helpers.getPayableFrequencyOptions(), state.payablesDraft.frequency)}</select></label>
                <label class="checkbox-field"><span>Geração automática</span><input name="auto_generate" type="checkbox" ${state.payablesDraft.auto_generate ? "checked" : ""} ${state.payablesDraft.account_type === "fixed" ? "" : "disabled"} /></label>
              </div>
              <label>Observações<textarea name="notes" rows="4">${helpers.escapeHtml(state.payablesDraft.notes || "")}</textarea></label>

              <section class="purchase-upload-panel">
                <div class="purchase-upload-header">
                  <div>
                    <strong>Comprovantes</strong>
                    <div class="table-inline-copy muted">PDF, nota fiscal e boleto com visualização rápida.</div>
                  </div>
                  <input class="purchase-upload-input" type="file" data-payable-attachment-category="comprovante" data-payable-upload multiple accept=".pdf,image/*" />
                </div>
                <div class="bom-upload-list">${renderAttachmentList(state.payablesDraft.attachments || [], helpers)}</div>
              </section>

              <div class="form-actions-row">
                <button class="primary-button" type="submit">${state.payablesDraft.edit_id ? "Salvar alterações" : "Criar conta"}</button>
                <button class="ghost-button" type="button" data-payable-cancel-form>Cancelar</button>
              </div>
            </form>
          </section>
        ` : ""}

        ${isPaymentOpen ? `
          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Marcar como pago</h4>
                <p class="muted">Baixa financeira com log automatico em auditoria.</p>
              </div>
            </div>
            <form id="payables-payment-form" class="purchase-form-grid">
              <input type="hidden" name="payable_id" value="${helpers.escapeHtml(state.payablesPaymentDraft.payable_id || "")}" />
              <div class="purchase-form-row">
                <label>Data do pagamento *<input name="payment_date" type="date" required value="${helpers.escapeHtml(state.payablesPaymentDraft.payment_date || "")}" /></label>
                <label>Forma de pagamento *<select name="payment_method" required>${helpers.renderOptions([
                  { value: "pix", label: "Pix" },
                  { value: "boleto", label: "Boleto" },
                  { value: "cartao", label: "Cartão" },
                  { value: "transferencia", label: "Transferência" },
                ], state.payablesPaymentDraft.payment_method || "pix")}</select></label>
              </div>
              <label>Observações do pagamento<textarea name="payment_notes" rows="3">${helpers.escapeHtml(state.payablesPaymentDraft.payment_notes || "")}</textarea></label>
              <div class="form-actions-row">
                <button class="primary-button" type="submit">Confirmar pagamento</button>
                <button class="ghost-button" type="button" data-payable-close-payment>Fechar</button>
              </div>
            </form>
          </section>
        ` : ""}

        <div class="audit-layout">
          <div class="table-card audit-table-card">
            <table>
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Parcela</th>
                  <th>Fornecedor</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Tipo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${
                  groupedEntries.length
                    ? groupedEntries.map((group) => `
                      <tr>
                        <td colspan="9" class="table-inline-copy">
                          <button class="inline-button" type="button" data-payable-toggle-group="${helpers.escapeHtml(group.key)}">
                            ${group.isExpanded ? "▾" : "▸"} ${helpers.escapeHtml(group.label)}
                          </button>
                          <span class="muted"> • ${helpers.escapeHtml(group.supplier)} • ${group.entries.length} titulo(s)</span>
                        </td>
                      </tr>
                      ${group.isExpanded ? group.entries.map((entry) => `
                        <tr class="${selectedEntry?.payable.id === entry.payable.id ? "audit-log-row-selected" : ""}">
                          <td>
                            <strong>${helpers.escapeHtml(entry.metadata.description)}</strong>
                            <div class="table-inline-copy muted">${helpers.escapeHtml(entry.metadata.payable_number || entry.payable.id)}</div>
                          </td>
                          <td>${helpers.escapeHtml(entry.metadata.purchase_installment_label || "-")}</td>
                          <td>${helpers.escapeHtml(entry.metadata.supplier)}</td>
                          <td>${helpers.escapeHtml(entry.metadata.category)}</td>
                          <td>${helpers.formatCurrency(entry.metadata.amount)}</td>
                          <td>${helpers.escapeHtml(helpers.formatDate(entry.metadata.due_date))}</td>
                          <td>${helpers.payableStatusCell(entry.metadata.status)}</td>
                          <td>${helpers.escapeHtml(helpers.getPayableTypeLabel(entry.metadata.account_type))}</td>
                          <td>${renderPayableActionCell(entry, helpers)}</td>
                        </tr>
                      `).join("") : ""}
                    `).join("")
                    : `<tr><td colspan="9"><div class="empty-state">Nenhuma conta encontrada para os filtros aplicados.</div></td></tr>`
                }
              </tbody>
            </table>
          </div>

          <aside class="table-card audit-detail-card">
            ${
              selectedEntry
                ? `
                  <div class="module-head compact-head">
                    <div>
                      <p class="eyebrow muted">Detalhamento financeiro</p>
                      <h3>${helpers.escapeHtml(selectedEntry.metadata.description)}</h3>
                    </div>
                  </div>
                  <div class="audit-detail-grid">
                    <div><span>Número</span><strong>${helpers.escapeHtml(selectedEntry.metadata.payable_number || selectedEntry.payable.id)}</strong></div>
                    <div><span>Parcela</span><strong>${helpers.escapeHtml(selectedEntry.metadata.purchase_installment_label || "Parcela unica")}</strong></div>
                    <div><span>Fornecedor</span><strong>${helpers.escapeHtml(selectedEntry.metadata.supplier)}</strong></div>
                    <div><span>Categoria</span><strong>${helpers.escapeHtml(selectedEntry.metadata.category)}</strong></div>
                    <div><span>Valor</span><strong>${helpers.escapeHtml(helpers.formatCurrency(selectedEntry.metadata.amount))}</strong></div>
                    <div><span>Vencimento</span><strong>${helpers.escapeHtml(helpers.formatDate(selectedEntry.metadata.due_date))}</strong></div>
                    <div><span>Status</span><strong>${helpers.escapeHtml(selectedEntry.metadata.status)}</strong></div>
                    <div><span>Forma</span><strong>${helpers.escapeHtml(selectedEntry.metadata.payment_method_label)}</strong></div>
                    <div><span>Origem</span><strong>${helpers.escapeHtml(selectedEntry.metadata.source_module || "manual")}</strong></div>
                    <div><span>Compra vinculada</span><strong>${helpers.escapeHtml(selectedEntry.metadata.purchase_request_number || "-")}</strong></div>
                  </div>
                  <section class="form-section">
                    <h4>Comprovantes</h4>
                    ${renderReadonlyAttachmentList(selectedEntry.metadata.attachments, helpers)}
                  </section>
                  <section class="form-section">
                    <h4>Logs de pagamento</h4>
                    ${
                      selectedEntry.metadata.paymentLog.length
                        ? selectedEntry.metadata.paymentLog.map((log) => `
                          <article class="dashboard-alert dashboard-alert-info">
                            <div>
                              <strong>${helpers.escapeHtml(log.user_name || "-")}</strong>
                              <p>${helpers.escapeHtml(helpers.formatDateTime(log.paid_at || log.created_at || ""))} • ${helpers.escapeHtml(helpers.getPaymentMethodLabel ? helpers.getPaymentMethodLabel(log.payment_method) : log.payment_method || "-")}</p>
                            </div>
                          </article>
                        `).join("")
                        : `<div class="empty-state compact-empty">Nenhuma baixa registrada.</div>`
                    }
                  </section>
                `
                : `<div class="empty-state">Selecione uma conta para ver detalhes e comprovantes.</div>`
            }
          </aside>
        </div>
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    document.querySelector("#payables-filter-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      state.payablesFilters = {
        search: formData.get("search")?.toString() || "",
        from: formData.get("from")?.toString() || "",
        to: formData.get("to")?.toString() || "",
        status: formData.get("status")?.toString() || "all",
        category: formData.get("category")?.toString() || "all",
        type: formData.get("type")?.toString() || "all",
      };
      helpers.renderActiveModule();
    });

    document.querySelector("[data-payable-reset-filters]")?.addEventListener("click", () => {
      state.payablesFilters = helpers.createEmptyPayablesFilters();
      helpers.renderActiveModule();
    });

    document.querySelector("[data-payable-toggle-form]")?.addEventListener("click", () => {
      const opening = state.openAccordionKey !== "payable-form";
      state.openAccordionKey = opening ? "payable-form" : null;
      if (opening && !state.payablesDraft.edit_id) {
        helpers.resetPayableDraftState();
      }
      helpers.renderActiveModule();
    });

    document.querySelector("#payables-form")?.addEventListener("submit", helpers.handlePayableSubmit);

    document.querySelector("[data-payable-cancel-form]")?.addEventListener("click", () => {
      helpers.resetPayableDraftState();
      state.openAccordionKey = null;
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-payable-upload]").forEach((input) => {
      input.addEventListener("change", helpers.handlePayableAttachmentSelection);
    });

    document.querySelectorAll("[data-payable-remove-attachment]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.removePayableAttachment(Number(button.dataset.payableRemoveAttachment));
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-payable-open-attachment]").forEach((button) => {
      button.addEventListener("click", () => {
        const file = (state.payablesDraft.attachments || [])[Number(button.dataset.payableOpenAttachment)];
        if (file?.data_url) window.open(file.data_url, "_blank");
      });
    });

    document.querySelectorAll("[data-payable-select-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.payablesSelectedId = button.dataset.payableSelectId || "";
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-payable-toggle-group]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.payableToggleGroup || "";
        state.payablesExpandedGroups = {
          ...(state.payablesExpandedGroups || {}),
          [key]: state.payablesExpandedGroups?.[key] === false,
        };
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-payable-edit-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const payable = (state.moduleData.payables || []).find((item) => item.id === button.dataset.payableEditId);
        if (!payable) return;
        helpers.hydratePayableDraft(payable);
        state.payablesSelectedId = payable.id;
        state.openAccordionKey = "payable-form";
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-payable-pay-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const payable = (state.moduleData.payables || []).find((item) => item.id === button.dataset.payablePayId);
        if (!payable) return;
        helpers.hydratePayablePaymentDraft(payable);
        state.payablesSelectedId = payable.id;
        helpers.renderActiveModule();
      });
    });

    document.querySelector("#payables-payment-form")?.addEventListener("submit", helpers.handlePayablePaymentSubmit);

    document.querySelector("[data-payable-close-payment]")?.addEventListener("click", () => {
      helpers.resetPayablePaymentDraftState();
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-payable-cancel-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        await helpers.cancelPayableRecord(button.dataset.payableCancelId);
      });
    });

    const selectedEntry = helpers.getPayablesSnapshot().entries.find((entry) => entry.payable.id === state.payablesSelectedId)
      || helpers.getPayablesSnapshot().entries[0];

    document.querySelectorAll("[data-payable-open-saved-attachment]").forEach((button) => {
      button.addEventListener("click", () => {
        const file = selectedEntry?.metadata.attachments?.[Number(button.dataset.payableOpenSavedAttachment)];
        if (file?.data_url) window.open(file.data_url, "_blank");
      });
    });
  },
};
