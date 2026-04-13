function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponivel.");
  }
  return bridge;
}

function renderProductionRow(item, canEdit, helpers) {
  const metadata = helpers.getProductionOrderMetadata(item);

  return `
    <tr>
      <td>
        <strong>${helpers.escapeHtml(item.product_name || "-")}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(metadata.lotNumber || "Sem lote")}</div>
      </td>
      <td>
        <strong>${helpers.escapeHtml(item.order_number || "-")}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(item.product_code || "Sem codigo do produto")}</div>
      </td>
      <td>${helpers.formatQuantity(item.batch_size)}</td>
      <td>${helpers.productionPriorityCell(metadata.priority)}</td>
      <td>${helpers.statusCell(item.status || "planned")}</td>
      <td>${helpers.escapeHtml(metadata.responsibleName || "-")}</td>
      <td>
        <strong>${helpers.formatDate(item.planned_start)}</strong>
        <div class="table-inline-copy muted">Ate ${helpers.formatDate(item.planned_end)}</div>
      </td>
      <td>${renderProductionActionCell(item, canEdit)}</td>
    </tr>
  `;
}

function renderProductionActionCell(item, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  return `
    <div class="action-button-group">
      ${
        item.status === "planned"
          ? `<button class="primary-button" type="button" data-production-start-id="${item.id}">Iniciar</button>`
          : ""
      }
      <button class="inline-button" type="button" data-production-edit-id="${item.id}">Editar</button>
      <button class="inline-button danger-button" type="button" data-production-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderProductionMachiningSection(machiningOrders) {
  return `
    <section class="production-machining-section">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">USINAGEM POR ETAPAS</p>
          <h3>Ordens agrupadas por peca</h3>
          <p class="muted">Fluxo sequencial com liberacao automatica da proxima etapa e entrada no estoque ao concluir.</p>
        </div>
      </div>

      <div class="production-machining-list">
        ${
          machiningOrders.length
            ? machiningOrders.map((entry) => renderProductionMachiningCard(entry)).join("")
            : `<div class="empty-state">Nenhuma ordem de usinagem enviada para producao.</div>`
        }
      </div>
    </section>
  `;
}

function renderProductionMachiningCard(entry) {
  const completedSteps = entry.order.steps.filter((step) => step.status === "Finalizada").length;
  const progress = entry.order.steps.length ? Math.round((completedSteps / entry.order.steps.length) * 100) : 0;
  const visibleSteps = getBridge().helpers.getVisibleMachiningSteps(entry.order);

  return `
    <article class="table-card production-machining-card">
      <div class="production-machining-top">
        <div>
          <span class="machining-piece-code">${getBridge().helpers.escapeHtml(entry.piece.code)}</span>
          <h4>${getBridge().helpers.escapeHtml(entry.piece.name)}</h4>
          <p class="muted">${entry.order.steps.length} etapa(s) • ${completedSteps} concluida(s)</p>
        </div>
        <div class="production-machining-progress">
          <strong>${progress}%</strong>
          <span>${completedSteps}/${entry.order.steps.length} concluidas</span>
          <div class="production-machining-progressbar">
            <span style="width: ${progress}%"></span>
          </div>
        </div>
      </div>

      <div class="production-machining-steps">
        ${visibleSteps.map(({ step, index }) => renderProductionMachiningStep(entry.piece, entry.order, step, index)).join("")}
      </div>
    </article>
  `;
}

function renderProductionMachiningStep(piece, order, step, index) {
  const helpers = getBridge().helpers;
  const action = helpers.getProductionStepActionLabel(step.status);
  const disabled = helpers.isProductionStepAdvanceDisabled(order, step);

  return `
    <article class="production-machining-step">
      <div class="production-machining-step-main">
        <div class="production-machining-step-index">Etapa ${index + 1}</div>
        <div class="production-machining-step-grid">
          <div><span>Codigo da Ordem</span><strong>${helpers.escapeHtml(order.order_number)}</strong></div>
          <div><span>Status</span><strong>${helpers.escapeHtml(step.status === "Bloqueada" ? "Pendente" : step.status)}</strong></div>
          <div><span>Nome da Etapa</span><strong>${helpers.escapeHtml(step.name)}</strong></div>
          <div><span>Operador</span><strong>${helpers.escapeHtml(step.completed_by || step.operator || order.operator || "-")}</strong></div>
          <div><span>Data de Inicio</span><strong>${helpers.escapeHtml(step.started_at ? helpers.formatDateTime(step.started_at) : "-")}</strong></div>
          <div><span>Peca</span><strong>${helpers.escapeHtml(piece.name)}</strong></div>
          <div><span>Processo</span><strong>${helpers.escapeHtml(step.name)}</strong></div>
          <div><span>Maquina</span><strong>${helpers.escapeHtml(step.machine || "-")}</strong></div>
          <div><span>Tempo Estimado</span><strong>${helpers.formatProcessMinutes(step.estimated_minutes)}</strong></div>
        </div>
        <label class="production-machining-step-operator-field">
          <span>Trocar operador da etapa</span>
          <input
            type="text"
            value="${helpers.escapeHtml(step.operator || order.operator || "")}"
            data-machining-step-operator="${piece.id}|${order.id}|${index}"
          />
        </label>
      </div>
      <div class="production-machining-step-action">
        ${helpers.renderProductionStageStatusBadge(step.status)}
        <button
          class="${step.status === "Qualidade" ? "primary-button" : "inline-button"}"
          type="button"
          data-production-machining-advance="${piece.id}|${order.id}|${index}"
          ${disabled ? "disabled" : ""}
        >
          ${helpers.escapeHtml(action)}
        </button>
      </div>
    </article>
  `;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("production", "view")) {
      return helpers.noPermissionTemplate("Seu perfil nao possui acesso ao modulo de producao.");
    }

    const canEdit = bridge.hasPermission("production", "edit");
    const isFormOpen = state.openAccordionKey === "production-order-form";
    const products = state.moduleData.products || [];
    const machiningOrders = helpers.getProductionMachiningOrders();
    const searchTerm = state.productionSearch.trim().toLowerCase();
    const filteredOrders = (state.moduleData.production || []).filter((item) => {
      const metadata = helpers.getProductionOrderMetadata(item);
      const matchesSearch = !searchTerm
        || [
          item.order_number,
          item.product_name,
          item.product_code,
          metadata.responsibleName,
          metadata.lotNumber,
        ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesStatus = state.productionStatusFilter === "all" || item.status === state.productionStatusFilter;
      return matchesSearch && matchesStatus;
    });

    return `
      <section class="module-panel production-module">
        <div class="module-head production-head">
          <div>
            <p class="eyebrow muted">Producao</p>
            <h3>Ordens de producao</h3>
            <p class="muted">Gerencie ordens de producao.</p>
          </div>
          <div class="module-head-actions">
            ${canEdit ? `
              <button
                class="primary-button production-create-button ${isFormOpen ? "is-open" : ""}"
                type="button"
                data-production-toggle-form
                ${products.length ? "" : "disabled"}
              >
                <span>+ Nova Ordem</span>
                <span class="production-toggle-icon">${isFormOpen ? "▴" : "▾"}</span>
              </button>
            ` : ""}
          </div>
        </div>

        ${
          canEdit
            ? products.length
              ? `
              <div class="production-accordion-shell ${isFormOpen ? "open" : ""}">
                <div class="production-accordion-card">
                  <div class="production-form-header">
                    <div>
                      <h4>${state.productionDraft.edit_id ? "Editar Ordem de Producao" : "Nova Ordem de Producao"}</h4>
                      <p class="muted">Fluxo em accordion com integracao aos produtos cadastrados.</p>
                    </div>
                  </div>
                  <form id="production-form" class="production-form-grid">
                    <input type="hidden" name="edit_id" value="${helpers.escapeHtml(state.productionDraft.edit_id)}" />
                    <input type="hidden" name="status" value="${helpers.escapeHtml(state.productionDraft.status || "planned")}" />

                    <div class="production-form-row production-form-row-primary">
                      <label>
                        Produto *
                        <select name="product_id" required>
                          <option value="">Selecione um produto</option>
                          ${products
                            .map(
                              (product) => `
                                <option value="${product.id}" ${product.id === state.productionDraft.product_id ? "selected" : ""}>
                                  ${helpers.escapeHtml(product.name)}${product.code ? ` (${helpers.escapeHtml(product.code)})` : ""}
                                </option>
                              `
                            )
                            .join("")}
                        </select>
                      </label>

                      <label>
                        Codigo
                        <input
                          name="order_number"
                          type="text"
                          placeholder="OP-PRD-20260407-001"
                          value="${helpers.escapeHtml(state.productionDraft.order_number)}"
                        />
                      </label>

                      <label>
                        Quantidade *
                        <input
                          name="batch_size"
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value="${helpers.escapeHtml(state.productionDraft.batch_size)}"
                        />
                      </label>

                      <label>
                        Prioridade
                        <select name="priority">
                          ${helpers.renderOptions([
                            { value: "baixa", label: "Baixa" },
                            { value: "media", label: "Media" },
                            { value: "alta", label: "Alta" },
                            { value: "urgente", label: "Urgente" },
                          ], state.productionDraft.priority || "media")}
                        </select>
                      </label>
                    </div>

                    <div class="production-form-row">
                      <label>
                        Inicio Previsto
                        <input name="planned_start" type="date" value="${helpers.escapeHtml(state.productionDraft.planned_start)}" />
                      </label>

                      <label>
                        Fim Previsto
                        <input name="planned_end" type="date" value="${helpers.escapeHtml(state.productionDraft.planned_end)}" />
                      </label>

                      <label>
                        No Lote
                        <input name="lot_number" type="text" placeholder="Lote" value="${helpers.escapeHtml(state.productionDraft.lot_number)}" />
                      </label>

                      <label>
                        Responsavel
                        <input
                          name="responsible_name"
                          type="text"
                          placeholder="Responsavel pela ordem"
                          value="${helpers.escapeHtml(state.productionDraft.responsible_name)}"
                        />
                      </label>
                    </div>

                    <div class="production-form-row production-form-row-full">
                      <label>
                        Observacoes
                        <textarea name="notes" placeholder="Detalhes adicionais da ordem">${helpers.escapeHtml(state.productionDraft.notes)}</textarea>
                      </label>
                    </div>

                    <div class="form-actions-row production-form-actions">
                      <button class="ghost-button" type="button" data-production-cancel>Cancelar</button>
                      <button class="primary-button" type="submit">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            `
              : `<div class="empty-state">Cadastre ao menos um produto no modulo Produtos para abrir novas ordens de producao.</div>`
            : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
        }

        <div class="table-actions production-filters-row">
          <label>
            Buscar...
            <input
              id="production-search-input"
              type="text"
              placeholder="Buscar..."
              value="${helpers.escapeHtml(state.productionSearch)}"
            />
          </label>
          <label>
            Status
            <select id="production-status-filter">
              ${helpers.renderOptions([
                { value: "all", label: "Todos" },
                { value: "planned", label: "Planejada" },
                { value: "in_progress", label: "Em andamento" },
                { value: "completed", label: "Concluida" },
                { value: "cancelled", label: "Cancelada" },
              ], state.productionStatusFilter)}
            </select>
          </label>
        </div>

        ${renderProductionMachiningSection(machiningOrders)}

        <div class="table-card production-table-card">
          ${
            filteredOrders.length
              ? `
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Codigo</th>
                      <th>Quantidade</th>
                      <th>Prioridade</th>
                      <th>Status</th>
                      <th>Responsavel</th>
                      <th>Datas</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredOrders.map((item) => renderProductionRow(item, canEdit, helpers)).join("")}
                  </tbody>
                </table>
              `
              : `
                <div class="production-empty-state">
                  <div class="production-empty-icon">◭</div>
                  <strong>Nenhuma ordem encontrada</strong>
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

    const toggleButton = document.querySelector("[data-production-toggle-form]");
    if (toggleButton) {
      toggleButton.addEventListener("click", () => {
        const shouldOpen = state.openAccordionKey !== "production-order-form";
        state.openAccordionKey = shouldOpen ? "production-order-form" : null;
        state.productionDraft = helpers.createEmptyProductionDraft();
        helpers.renderActiveModule();
        if (shouldOpen) {
          document.querySelector("#production-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    helpers.bindDeferredTextFilter("#production-search-input", (value) => {
      state.productionSearch = value;
    });

    helpers.bindDeferredSelectFilter("#production-status-filter", (value) => {
      state.productionStatusFilter = value;
    });

    const productionForm = document.querySelector("#production-form");
    if (productionForm) {
      productionForm.addEventListener("submit", helpers.handleProductionSubmit);
      productionForm.addEventListener("input", () => helpers.syncProductionDraftFromForm(productionForm));
      productionForm.addEventListener("change", () => helpers.syncProductionDraftFromForm(productionForm));
    }

    const cancelButton = document.querySelector("[data-production-cancel]");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        helpers.resetProductionFormState();
        helpers.renderActiveModule();
      });
    }

    const productField = document.querySelector('#production-form select[name="product_id"]');
    if (productField) {
      productField.addEventListener("change", helpers.handleProductionProductSelection);
    }

    document.querySelectorAll("[data-production-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const order = state.moduleData.production.find((item) => item.id === button.dataset.productionEditId);
        if (!order) return;

        state.productionDraft = helpers.hydrateProductionDraft(order);
        state.openAccordionKey = "production-order-form";
        await helpers.renderActiveModule();
        document.querySelector("#production-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-production-delete-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const { error } = await state.supabase.from("production_orders").delete().eq("id", button.dataset.productionDeleteId);
          if (error) throw error;
          await helpers.loadTable("production_orders", "production");
          await helpers.renderActiveModule();
          void helpers.queueSystemLog({
            moduleKey: "production",
            action: "exclusao",
            level: "Critico",
            itemAffected: button.dataset.productionDeleteId,
            description: "Ordem de producao excluida.",
            entityType: "production_order",
            entityId: button.dataset.productionDeleteId,
          });
          helpers.showToast("Ordem excluida com sucesso.", "success");
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-production-start-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        await helpers.handleProductionStart(button.dataset.productionStartId);
      });
    });

    document.querySelectorAll("[data-production-machining-advance]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.handleMachiningStepAdvance(button.dataset.productionMachiningAdvance);
      });
    });

    document.querySelectorAll("[data-machining-step-operator]").forEach((field) => {
      field.addEventListener("change", () => {
        helpers.handleMachiningStepOperatorChange(field.dataset.machiningStepOperator, field.value);
      });
    });
  },
};
