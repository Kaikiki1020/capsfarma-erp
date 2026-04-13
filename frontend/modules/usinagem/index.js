function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponivel.");
  }
  return bridge;
}

function renderMachiningProcessDraftRow(process, index, state, helpers) {
  return `
    <article class="machining-process-card">
      <div class="machining-process-card-head">
        <div>
          <span class="machining-stage-tag">Etapa ${index + 1}</span>
          <strong>${helpers.escapeHtml(process.name || `Processo ${index + 1}`)}</strong>
        </div>
        <div class="machining-process-actions">
          <button class="inline-button" type="button" data-machining-move-process="${index}" data-direction="-1" ${index === 0 ? "disabled" : ""}>Subir</button>
          <button class="inline-button" type="button" data-machining-move-process="${index}" data-direction="1" ${index === state.machiningDraft.processes.length - 1 ? "disabled" : ""}>Descer</button>
          <button class="inline-button danger-button" type="button" data-machining-remove-process="${index}" ${state.machiningDraft.processes.length === 1 ? "disabled" : ""}>Remover</button>
        </div>
      </div>

      <div class="machining-process-grid">
        <label>
          Nome do Processo *
          <input data-machining-process-field="name" data-machining-process-index="${index}" type="text" value="${helpers.escapeHtml(process.name)}" placeholder="Ex.: Corte" />
        </label>
        <label>
          Maquina
          <input data-machining-process-field="machine" data-machining-process-index="${index}" type="text" value="${helpers.escapeHtml(process.machine)}" />
        </label>
        <label>
          Operador
          <input data-machining-process-field="operator" data-machining-process-index="${index}" type="text" value="${helpers.escapeHtml(process.operator)}" />
        </label>
        <label>
          Tempo Estimado (min)
          <input data-machining-process-field="estimated_minutes" data-machining-process-index="${index}" type="number" min="0" step="1" value="${helpers.escapeHtml(process.estimated_minutes)}" />
        </label>
      </div>

      <div class="machining-process-grid machining-process-grid-notes">
        <label>
          Observacoes
          <textarea data-machining-process-field="notes" data-machining-process-index="${index}" placeholder="Informacoes operacionais">${helpers.escapeHtml(process.notes)}</textarea>
        </label>
      </div>
    </article>
  `;
}

function renderMachiningForm(state, helpers) {
  const totalMinutes = helpers.getMachiningDraftTotalMinutes();
  const processCount = state.machiningDraft.processes.length;

  return `
    <div class="machining-form-header">
      <div>
        <p class="eyebrow muted">Nova Peca</p>
        <h4>${state.machiningDraft.edit_id ? "Editar Peca" : "Nova Peca"}</h4>
        <p class="muted">Dados da peca e processos de fabricacao em sequencia controlada.</p>
      </div>
      <div class="machining-form-summary">
        <span>${processCount} processo(s)</span>
        <strong>${helpers.formatMinutesLabel(totalMinutes)}</strong>
      </div>
    </div>

    <form id="machining-form" class="machining-form-grid">
      <input type="hidden" name="edit_id" value="${helpers.escapeHtml(state.machiningDraft.edit_id)}" />

      <div class="form-section">
        <h4>Dados da peca</h4>
        <div class="machining-form-row">
          <label>
            Codigo *
            <input name="code" type="text" required value="${helpers.escapeHtml(state.machiningDraft.code)}" />
          </label>
          <label>
            Nome da Peca *
            <input name="name" type="text" required value="${helpers.escapeHtml(state.machiningDraft.name)}" />
          </label>
          <label>
            Nome no Estoque Terminado
            <input name="finished_name" type="text" value="${helpers.escapeHtml(state.machiningDraft.finished_name || state.machiningDraft.name)}" />
          </label>
        </div>
        <div class="machining-form-row">
          <label>
            Material
            <input name="material" type="text" value="${helpers.escapeHtml(state.machiningDraft.material)}" />
          </label>
        </div>
        <div class="machining-form-row machining-form-row-full">
          <label>
            Descricao
            <textarea name="description" placeholder="Detalhes tecnicos da peca">${helpers.escapeHtml(state.machiningDraft.description)}</textarea>
          </label>
        </div>
      </div>

      <div class="form-section">
        <div class="machining-process-header">
          <div>
            <h4>Processos de Fabricacao</h4>
            <p class="muted">Cadastre ate 8 etapas na ordem em que a producao deve acontecer.</p>
          </div>
          <button
            class="inline-button"
            type="button"
            data-machining-add-process
            ${processCount >= 8 ? "disabled" : ""}
          >
            + Adicionar Processo
          </button>
        </div>

        <div class="machining-process-list">
          ${state.machiningDraft.processes.map((process, index) => renderMachiningProcessDraftRow(process, index, state, helpers)).join("")}
        </div>
      </div>

      <div class="form-actions-row machining-form-actions">
        <button class="ghost-button" type="button" data-machining-cancel>Cancelar</button>
        <button class="primary-button" type="submit">Salvar Cadastro</button>
      </div>
    </form>
  `;
}

function renderMachiningProcessTimelineItem(process, index, helpers) {
  return `
    <article class="machining-stage-item">
      <div class="machining-stage-index">Etapa ${index + 1}</div>
      <div class="machining-stage-copy">
        <strong>${helpers.escapeHtml(process.name)}</strong>
        <span class="muted">
          ${helpers.escapeHtml(process.machine || "Maquina nao informada")} •
          ${helpers.formatMinutesLabel(process.estimated_minutes).replace(" total", "")}
        </span>
      </div>
    </article>
  `;
}

function renderMachiningOrderStepItem(pieceId, orderId, step, index, actionState, helpers) {
  return `
    <article class="machining-stage-item machining-stage-item-live">
      <div class="machining-stage-index">Etapa ${index + 1}</div>
      <div class="machining-stage-copy">
        <strong>${helpers.escapeHtml(step.name)}</strong>
        <span class="muted">
          ${helpers.escapeHtml(step.machine || "Maquina nao informada")} •
          ${helpers.formatMinutesLabel(step.estimated_minutes).replace(" total", "")}
          ${step.completed_at ? ` • Finalizada em ${helpers.formatDateTime(step.completed_at)}` : ""}
        </span>
      </div>
      <label class="machining-step-operator-field">
        <span>Operador da etapa</span>
        <input
          type="text"
          value="${helpers.escapeHtml(step.operator || "")}"
          data-machining-step-operator="${pieceId}|${orderId}|${index}"
        />
      </label>
      <div class="machining-stage-actions">
        ${helpers.renderMachiningStepStatusBadge(step.status)}
        <button class="inline-button" type="button" data-machining-step-start="${pieceId}|${orderId}|${index}" ${actionState.disableStart ? "disabled" : ""}>
          Iniciar
        </button>
        <button class="primary-button" type="button" data-machining-step-complete="${pieceId}|${orderId}|${index}" ${actionState.disableComplete ? "disabled" : ""}>
          Finalizar
        </button>
      </div>
    </article>
  `;
}

function renderMachiningStartProductionForm(piece, state, helpers) {
  const draft = state.machiningStartDraft.piece_id === piece.id
    ? state.machiningStartDraft
    : helpers.createEmptyMachiningStartDraft(piece.id);

  return `
    <div class="machining-inline-head">
      <div>
        <h4>Iniciar producao por etapas</h4>
        <p class="muted">Toda nova producao exige quantidade e lote obrigatorios.</p>
      </div>
    </div>

    <form class="machining-start-form" data-machining-start-form="${piece.id}">
      <input type="hidden" name="piece_id" value="${helpers.escapeHtml(piece.id)}" />
      <label>
        Quantidade a produzir *
        <input name="quantity" type="number" min="1" step="1" required value="${helpers.escapeHtml(draft.quantity)}" />
      </label>
      <label>
        Lote *
        <input name="lot" type="text" required value="${helpers.escapeHtml(draft.lot)}" />
      </label>
      <label>
        Operador
        <input name="operator" type="text" value="${helpers.escapeHtml(draft.operator)}" />
      </label>
      <label>
        Nome no estoque terminado
        <input name="finished_name" type="text" value="${helpers.escapeHtml(draft.finished_name || piece.finished_name || piece.name)}" />
      </label>
      <div class="form-actions-row machining-form-actions">
        <button class="ghost-button" type="button" data-machining-close-inline>Cancelar</button>
        <button class="primary-button" type="submit">Iniciar Producao</button>
      </div>
    </form>
  `;
}

function renderMachiningPieceDetails(piece, state, helpers) {
  const latestOrder = helpers.getLatestMachiningOrder(piece);
  const stockEntries = piece.stock_entries || [];
  const visibleSteps = latestOrder ? helpers.getVisibleMachiningSteps(latestOrder) : [];

  return `
    <div class="machining-inline-head">
      <div>
        <h4>Detalhes da peca</h4>
        <p class="muted">${helpers.escapeHtml(piece.description || "Sem descricao cadastrada.")}</p>
      </div>
    </div>

    <div class="machining-detail-grid">
      <section class="form-section">
        <h4>Sequencia de processos</h4>
        <div class="machining-stage-list">
          ${piece.processes.map((process, index) => renderMachiningProcessTimelineItem(process, index, helpers)).join("")}
        </div>
      </section>

      <section class="form-section">
        <h4>Producao atual</h4>
        ${
          latestOrder
            ? `
              <div class="machining-production-summary">
                <div>
                  <span>Lote</span>
                  <strong>${helpers.escapeHtml(latestOrder.lot)}</strong>
                </div>
                <div>
                  <span>Quantidade</span>
                  <strong>${helpers.formatQuantity(latestOrder.quantity_planned)}</strong>
                </div>
                <div>
                  <span>Status geral</span>
                  <strong>${helpers.escapeHtml(latestOrder.status)}</strong>
                </div>
                <div>
                  <span>Etapa atual</span>
                  <strong>${helpers.escapeHtml(helpers.getMachiningCurrentStageLabel(latestOrder))}</strong>
                </div>
                <div>
                  <span>Nome no estoque</span>
                  <strong>${helpers.escapeHtml(latestOrder.finished_name || piece.finished_name || piece.name)}</strong>
                </div>
              </div>
              <div class="machining-stage-list">
                ${visibleSteps.map(({ step, index }) => renderMachiningOrderStepItem(piece.id, latestOrder.id, step, index, helpers.canStepAction(latestOrder, step), helpers)).join("")}
              </div>
            `
            : `<div class="empty-state">Nenhuma producao iniciada para esta peca.</div>`
        }
      </section>
    </div>

    <section class="form-section">
      <h4>Historico de estoque</h4>
      ${
        stockEntries.length
          ? `
            <div class="machining-stock-list">
              ${stockEntries.map((entry) => `
                <article class="machining-stock-item">
                  <strong>${helpers.escapeHtml(entry.product_name || piece.finished_name || piece.name)} • ${helpers.formatQuantity(entry.quantity)} un • Lote ${helpers.escapeHtml(entry.lot)}</strong>
                  <span class="muted">${helpers.formatDateTime(entry.created_at)} • ${helpers.escapeHtml(entry.origin)}</span>
                </article>
              `).join("")}
            </div>
          `
          : `<div class="empty-state">A peca entra no estoque somente apos concluir todas as etapas.</div>`
      }
    </section>
  `;
}

function renderMachiningPieceCard(piece, canEdit, state, helpers) {
  const processCount = piece.processes.length;
  const latestOrder = helpers.getLatestMachiningOrder(piece);
  const isDetailOpen = state.openAccordionKey === `machining-detail-${piece.id}`;
  const isStartOpen = state.openAccordionKey === `machining-start-${piece.id}`;

  return `
    <article class="table-card machining-piece-card">
      <div class="machining-piece-top">
        <div class="machining-piece-main">
          <div class="machining-piece-title-row">
            <div>
              <span class="machining-piece-code">${helpers.escapeHtml(piece.code)}</span>
              <h4>${helpers.escapeHtml(piece.name)}</h4>
            </div>
            ${helpers.renderMachiningStatusBadge(piece.status)}
          </div>

          <div class="machining-piece-meta">
            <span>${helpers.escapeHtml(piece.material || "Material nao informado")}</span>
            <span>${processCount} processo(s)</span>
            <span>${helpers.formatMinutesLabel(piece.total_minutes)}</span>
          </div>

          <div class="machining-piece-kpis">
            <div>
              <span>Codigo</span>
              <strong>${helpers.escapeHtml(piece.code)}</strong>
            </div>
            <div>
              <span>Material</span>
              <strong>${helpers.escapeHtml(piece.material || "-")}</strong>
            </div>
            <div>
              <span>Ultima producao</span>
              <strong>${latestOrder ? helpers.escapeHtml(latestOrder.lot) : "Nao iniciada"}</strong>
            </div>
            <div>
              <span>Etapa atual</span>
              <strong>${latestOrder ? helpers.escapeHtml(helpers.getMachiningCurrentStageLabel(latestOrder)) : "Cadastro"}</strong>
            </div>
          </div>
        </div>

        <div class="machining-piece-actions">
          ${canEdit ? `<button class="primary-button" type="button" data-machining-start-production="${piece.id}">Enviar para Producao</button>` : ""}
          ${canEdit ? `<button class="inline-button" type="button" data-machining-edit-id="${piece.id}">Editar</button>` : ""}
          ${canEdit ? `<button class="inline-button danger-button" type="button" data-machining-delete-id="${piece.id}">Excluir</button>` : ""}
          <button class="ghost-button" type="button" data-machining-toggle-details="${piece.id}">
            ${isDetailOpen ? "Recolher detalhes" : "Expandir detalhes"}
          </button>
        </div>
      </div>

      <div class="machining-accordion-shell ${isStartOpen ? "open" : ""}">
        <div class="machining-accordion-card machining-inline-card">
          ${renderMachiningStartProductionForm(piece, state, helpers)}
        </div>
      </div>

      <div class="machining-accordion-shell ${isDetailOpen ? "open" : ""}">
        <div class="machining-accordion-card machining-inline-card">
          ${renderMachiningPieceDetails(piece, state, helpers)}
        </div>
      </div>
    </article>
  `;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("machining", "view")) {
      return helpers.noPermissionTemplate("Seu perfil nao possui acesso ao modulo de usinagem.");
    }

    const canEdit = bridge.hasPermission("machining", "edit");
    const pieces = state.moduleData.machiningPieces || [];
    const isFormOpen = state.openAccordionKey === "machining-form";
    const searchTerm = state.machiningSearch.trim().toLowerCase();
    const filteredPieces = pieces.filter((piece) => {
      const matchesSearch = !searchTerm
        || [piece.code, piece.name, piece.material].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesStatus = state.machiningStatusFilter === "all" || piece.status === state.machiningStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const inRegistration = pieces.filter((piece) => piece.status === "Cadastro").length;
    const inProduction = pieces.filter((piece) => piece.status === "Em Producao").length;
    const finished = pieces.filter((piece) => piece.status === "Finalizada").length;

    return `
      <section class="module-panel machining-module">
        <div class="module-head machining-head">
          <div>
            <p class="eyebrow muted">Usinagem</p>
            <h3>Pecas &amp; Processos de Usinagem</h3>
            <p class="muted">${pieces.length} peca(s) cadastrada(s)</p>
          </div>
          <div class="module-head-actions">
            ${canEdit ? `
              <button
                class="primary-button machining-create-button ${isFormOpen ? "is-open" : ""}"
                type="button"
                data-machining-toggle-form
              >
                <span>+ Nova Peca</span>
                <span class="production-toggle-icon">${isFormOpen ? "▴" : "▾"}</span>
              </button>
            ` : ""}
          </div>
        </div>

        <div class="summary-grid">
          ${helpers.renderKpiCard({
            label: "Pecas Cadastradas",
            value: pieces.length,
            note: pieces.length ? "Cadastro tecnico pronto para producao" : "Nenhuma peca cadastrada",
            icon: "◈",
            tone: "blue",
          })}
          ${helpers.renderKpiCard({
            label: "Em Cadastro",
            value: inRegistration,
            note: inRegistration ? "Pecas aguardando envio para producao" : "Sem cadastro pendente",
            icon: "⊞",
            tone: "amber",
          })}
          ${helpers.renderKpiCard({
            label: "Em Producao",
            value: inProduction,
            note: inProduction ? "Ordens em execucao por etapas" : "Nenhuma ordem ativa",
            icon: "◭",
            tone: "green",
          })}
          ${helpers.renderKpiCard({
            label: "Finalizadas",
            value: finished,
            note: finished ? "Pecas ja integradas ao estoque" : "Sem pecas concluidas",
            icon: "◬",
            tone: "red",
          })}
        </div>

        ${
          canEdit
            ? `
              <div class="machining-accordion-shell ${isFormOpen ? "open" : ""}">
                <div class="machining-accordion-card">
                  ${renderMachiningForm(state, helpers)}
                </div>
              </div>
            `
            : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
        }

        <div class="table-actions machining-filters-row">
          <label class="search-input-shell">
            <span class="search-input-icon">⌕</span>
            <input
              id="machining-search-input"
              type="text"
              placeholder="Buscar por codigo, nome ou material..."
              value="${helpers.escapeHtml(state.machiningSearch)}"
            />
          </label>

          <label>
            Filtro
            <select id="machining-status-filter">
              ${helpers.renderOptions([
                { value: "all", label: "Todas" },
                { value: "Cadastro", label: "Cadastro" },
                { value: "Em Producao", label: "Em Producao" },
                { value: "Finalizada", label: "Finalizada" },
              ], state.machiningStatusFilter)}
            </select>
          </label>
        </div>

        <div class="machining-list">
          ${
            filteredPieces.length
              ? filteredPieces.map((piece) => renderMachiningPieceCard(piece, canEdit, state, helpers)).join("")
              : `
                <div class="table-card machining-empty-card">
                  <div class="production-empty-state">
                    <div class="production-empty-icon">◈</div>
                    <strong>Nenhuma peca encontrada</strong>
                  </div>
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

    document.querySelector("[data-machining-toggle-form]")?.addEventListener("click", async () => {
      const shouldOpen = state.openAccordionKey !== "machining-form";
      state.openAccordionKey = shouldOpen ? "machining-form" : null;
      state.machiningDraft = helpers.createEmptyMachiningDraft();
      await helpers.renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#machining-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    helpers.bindDeferredTextFilter("#machining-search-input", (value) => {
      state.machiningSearch = value;
    });

    helpers.bindDeferredSelectFilter("#machining-status-filter", (value) => {
      state.machiningStatusFilter = value;
    });

    const machiningForm = document.querySelector("#machining-form");
    if (machiningForm) {
      machiningForm.addEventListener("submit", helpers.handleMachiningSubmit);
      machiningForm.addEventListener("input", () => helpers.syncMachiningDraftFromForm(machiningForm));
      machiningForm.addEventListener("change", () => helpers.syncMachiningDraftFromForm(machiningForm));
    }

    document.querySelector("[data-machining-add-process]")?.addEventListener("click", () => {
      helpers.syncMachiningDraftFromForm(document.querySelector("#machining-form"));
      if (state.machiningDraft.processes.length >= 8) {
        helpers.showToast("A peca pode ter no maximo 8 processos.", "warning");
        return;
      }
      state.machiningDraft.processes.push({
        ...helpers.createEmptyMachiningProcessDraft(),
        sequence: state.machiningDraft.processes.length + 1,
      });
      helpers.renderActiveModule();
      helpers.showToast("Processo adicionado com sucesso.", "success");
    });

    document.querySelectorAll("[data-machining-remove-process]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.syncMachiningDraftFromForm(document.querySelector("#machining-form"));
        if (state.machiningDraft.processes.length === 1) {
          return;
        }
        state.machiningDraft.processes.splice(Number(button.dataset.machiningRemoveProcess), 1);
        state.machiningDraft.processes = helpers.resequenceMachiningProcesses(state.machiningDraft.processes);
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-machining-move-process]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.syncMachiningDraftFromForm(document.querySelector("#machining-form"));
        const index = Number(button.dataset.machiningMoveProcess);
        const direction = Number(button.dataset.direction);
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= state.machiningDraft.processes.length) return;
        const [movedItem] = state.machiningDraft.processes.splice(index, 1);
        state.machiningDraft.processes.splice(nextIndex, 0, movedItem);
        state.machiningDraft.processes = helpers.resequenceMachiningProcesses(state.machiningDraft.processes);
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-machining-process-field]").forEach((field) => {
      field.addEventListener("input", helpers.handleMachiningProcessFieldChange);
      field.addEventListener("change", helpers.handleMachiningProcessFieldChange);
    });

    document.querySelector("[data-machining-cancel]")?.addEventListener("click", () => {
      helpers.resetMachiningFormState();
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-machining-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const piece = helpers.findMachiningPiece(button.dataset.machiningEditId);
        if (!piece) return;
        state.machiningDraft = helpers.hydrateMachiningDraft(piece);
        state.openAccordionKey = "machining-form";
        await helpers.renderActiveModule();
        document.querySelector("#machining-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-machining-delete-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const pieces = (state.moduleData.machiningPieces || []).filter((piece) => piece.id !== button.dataset.machiningDeleteId);
        helpers.persistMachiningPieces(pieces);
        helpers.renderActiveModule();
        helpers.showToast("Peca excluida com sucesso.", "success");
      });
    });

    document.querySelectorAll("[data-machining-toggle-details]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = `machining-detail-${button.dataset.machiningToggleDetails}`;
        state.openAccordionKey = state.openAccordionKey === key ? null : key;
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-machining-start-production]").forEach((button) => {
      button.addEventListener("click", async () => {
        const pieceId = button.dataset.machiningStartProduction;
        const key = `machining-start-${pieceId}`;
        const shouldOpen = state.openAccordionKey !== key;
        state.openAccordionKey = shouldOpen ? key : null;
        state.machiningStartDraft = helpers.createEmptyMachiningStartDraft(pieceId);
        await helpers.renderActiveModule();
        if (shouldOpen) {
          document.querySelector(`[data-machining-start-form="${pieceId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });

    document.querySelectorAll("[data-machining-close-inline]").forEach((button) => {
      button.addEventListener("click", () => {
        state.openAccordionKey = null;
        state.machiningStartDraft = helpers.createEmptyMachiningStartDraft();
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-machining-start-form]").forEach((form) => {
      form.addEventListener("submit", helpers.handleMachiningStartProductionSubmit);
      form.addEventListener("input", () => helpers.syncMachiningStartDraftFromForm(form));
      form.addEventListener("change", () => helpers.syncMachiningStartDraftFromForm(form));
    });

    document.querySelectorAll("[data-machining-step-start]").forEach((button) => {
      button.addEventListener("click", () => helpers.handleMachiningStepStart(button.dataset.machiningStepStart));
    });

    document.querySelectorAll("[data-machining-step-complete]").forEach((button) => {
      button.addEventListener("click", () => helpers.handleMachiningStepComplete(button.dataset.machiningStepComplete));
    });

    document.querySelectorAll("[data-machining-step-operator]").forEach((field) => {
      field.addEventListener("change", () => {
        helpers.handleMachiningStepOperatorChange(field.dataset.machiningStepOperator, field.value);
      });
    });
  },
};
