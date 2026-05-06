function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

const MACHINING_MACHINES_STORAGE_KEY = "capsfarma_machining_machines";

function readMachiningMachines() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MACHINING_MACHINES_STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed
          .map((machine) => ({
            id: String(machine.id || `mach-machine-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
            name: String(machine.name || "").trim(),
            code: String(machine.code || "").trim(),
          }))
          .filter((machine) => machine.name)
      : [];
  } catch {
    return [];
  }
}

function persistMachiningMachines(machines) {
  const normalized = (machines || [])
    .map((machine) => ({
      id: String(machine.id || `mach-machine-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
      name: String(machine.name || "").trim(),
      code: String(machine.code || "").trim(),
    }))
    .filter((machine) => machine.name);
  localStorage.setItem(MACHINING_MACHINES_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function getMachiningMachineOptions(state) {
  const registeredMachines = readMachiningMachines();
  const processMachines = (state.moduleData.machiningPieces || [])
    .flatMap((piece) => piece.processes || [])
    .map((process) => String(process.machine || "").trim())
    .filter(Boolean)
    .map((name) => ({ id: `legacy-${name.toLowerCase()}`, name, code: "" }));
  const byName = new Map();
  [...registeredMachines, ...processMachines].forEach((machine) => {
    const key = machine.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, machine);
  });
  return Array.from(byName.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function getFinishedProductLabel(product) {
  if (!product) return "";
  const code = product.code ? ` (${product.code})` : "";
  const stock = Number.isFinite(Number(product.current_stock)) ? ` • Estoque ${Number(product.current_stock)}` : "";
  return `${product.name}${code}${stock}`;
}

function renderMachiningProcessDraftRow(process, index, state, helpers) {
  const machineOptions = getMachiningMachineOptions(state).map((machine) => ({
    value: machine.name,
    label: machine.code ? `${machine.name} (${machine.code})` : machine.name,
  }));

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
          Máquina
          <select data-machining-process-field="machine" data-machining-process-index="${index}">
            <option value="">Selecione a máquina</option>
            ${helpers.renderOptions(machineOptions, process.machine || "")}
          </select>
        </label>
        <label>
          Operador
          <input type="text" value="Automático ao iniciar" readonly />
        </label>
        <label>
          Tempo Estimado (min)
          <input data-machining-process-field="estimated_minutes" data-machining-process-index="${index}" type="number" min="0" step="1" value="${helpers.escapeHtml(process.estimated_minutes)}" />
        </label>
      </div>

      <div class="machining-process-grid machining-process-grid-notes">
        <label>
          Observações
          <textarea data-machining-process-field="notes" data-machining-process-index="${index}" placeholder="Informações operacionais">${helpers.escapeHtml(process.notes)}</textarea>
        </label>
      </div>
    </article>
  `;
}

function renderMachiningForm(state, helpers) {
  const totalMinutes = helpers.getMachiningDraftTotalMinutes();
  const processCount = state.machiningDraft.processes.length;
  const selectedFinishedProduct = (state.moduleData.products || [])
    .find((product) => product.id === state.machiningDraft.finished_product_id);
  const finishedProductLabel = selectedFinishedProduct
    ? getFinishedProductLabel(selectedFinishedProduct)
    : state.machiningDraft.finished_name || "";

  return `
    <div class="machining-form-header">
      <div>
        <p class="eyebrow muted">Nova Peça</p>
        <h4>${state.machiningDraft.edit_id ? "Editar Peça" : "Nova Peça"}</h4>
        <p class="muted">Dados da peça e processos de fabricação em sequência controlada.</p>
      </div>
      <div class="machining-form-summary">
        <span>${processCount} processo(s)</span>
        <strong>${helpers.formatMinutesLabel(totalMinutes)}</strong>
      </div>
    </div>

    <form id="machining-form" class="machining-form-grid">
      <input type="hidden" name="edit_id" value="${helpers.escapeHtml(state.machiningDraft.edit_id)}" />

      <div class="form-section">
        <h4>Dados da peça</h4>
        <div class="machining-form-row">
          <label>
            Código *
            <input name="code" type="text" required value="${helpers.escapeHtml(state.machiningDraft.code)}" />
          </label>
          <label>
            Nome da Peça *
            <input name="name" type="text" required value="${helpers.escapeHtml(state.machiningDraft.name)}" />
          </label>
          <label>
            Produto acabado no estoque
            <button class="machining-product-picker-trigger" type="button" data-machining-open-product-picker title="Clique duas vezes para selecionar">
              <span>${helpers.escapeHtml(finishedProductLabel || "Selecione o produto acabado")}</span>
            </button>
            <input name="finished_product_id" type="hidden" value="${helpers.escapeHtml(state.machiningDraft.finished_product_id || "")}" />
            <input name="finished_name" type="hidden" value="${helpers.escapeHtml(state.machiningDraft.finished_name || state.machiningDraft.name)}" />
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
            Descrição
            <textarea name="description" placeholder="Detalhes técnicos da peça">${helpers.escapeHtml(state.machiningDraft.description)}</textarea>
          </label>
        </div>
      </div>

      <div class="form-section">
        <div class="machining-process-header">
          <div>
            <h4>Processos de Fabricação</h4>
            <p class="muted">Cadastre ate 8 etapas na ordem em que a produção deve acontecer.</p>
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

function renderMachiningMachinesModal(state, helpers) {
  if (!state.machiningMachinesModalOpen) return "";
  const machines = readMachiningMachines();

  return `
    <div class="modal-overlay machining-modal-overlay" data-machining-machines-backdrop aria-hidden="false">
      <div class="modal-card machining-settings-modal" role="dialog" aria-modal="true" aria-labelledby="machining-machines-title">
        <div class="machining-modal-head">
          <div>
            <p class="eyebrow muted">Usinagem</p>
            <h3 id="machining-machines-title">Máquinas da empresa</h3>
          </div>
          <button class="icon-inline-button" type="button" data-machining-close-machines aria-label="Fechar">×</button>
        </div>

        <form class="machining-machine-form" data-machining-machine-form>
          <label>
            Nome da máquina *
            <input name="machine_name" type="text" required placeholder="Ex.: Torno CNC" />
          </label>
          <label>
            Código ou setor
            <input name="machine_code" type="text" placeholder="Ex.: CNC-01" />
          </label>
          <button class="primary-button" type="submit">Cadastrar</button>
        </form>

        <div class="machining-machine-list">
          ${
            machines.length
              ? machines.map((machine) => `
                <article class="machining-machine-item">
                  <div>
                    <strong>${helpers.escapeHtml(machine.name)}</strong>
                    <span class="muted">${helpers.escapeHtml(machine.code || "Sem código")}</span>
                  </div>
                  <button class="inline-button danger-button" type="button" data-machining-remove-machine="${helpers.escapeHtml(machine.id)}">Remover</button>
                </article>
              `).join("")
              : `<div class="empty-state">Nenhuma máquina cadastrada.</div>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderMachiningProductPickerModal(state, helpers) {
  if (!state.machiningProductPickerOpen) return "";
  const query = String(state.machiningProductPickerSearch || "").trim().toLowerCase();
  const products = (state.moduleData.products || [])
    .filter((product) => helpers.getProductType(product) === "finished_product")
    .filter((product) => {
      if (!query) return true;
      return [product.name, product.code, product.sku, product.product_type, product.description]
        .some((value) => String(value || "").toLowerCase().includes(query));
    });

  return `
    <div class="modal-overlay machining-modal-overlay" data-machining-product-picker-backdrop aria-hidden="false">
      <div class="modal-card machining-product-picker-modal" role="dialog" aria-modal="true" aria-labelledby="machining-product-picker-title">
        <div class="machining-modal-head">
          <div>
            <p class="eyebrow muted">Produto acabado</p>
            <h3 id="machining-product-picker-title">Selecionar produto do estoque</h3>
          </div>
          <button class="icon-inline-button" type="button" data-machining-close-product-picker aria-label="Fechar">×</button>
        </div>

        <label class="search-input-shell machining-product-picker-search">
          <span class="search-input-icon">⌕</span>
          <input
            id="machining-product-picker-search"
            type="text"
            placeholder="Buscar produto por nome ou código..."
            value="${helpers.escapeHtml(state.machiningProductPickerSearch || "")}"
          />
        </label>

        <div class="machining-product-picker-list">
          ${
            products.length
              ? products.map((product) => `
                <button class="machining-product-picker-item" type="button" data-machining-select-finished-product="${helpers.escapeHtml(product.id)}">
                  <strong>${helpers.escapeHtml(product.name || "-")}</strong>
                  <span>${helpers.escapeHtml(product.code || "Sem código")} • Estoque ${helpers.formatQuantity(product.current_stock || 0)}</span>
                </button>
              `).join("")
              : `<div class="empty-state">Nenhum produto acabado encontrado.</div>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderMachiningTabs(state) {
  return `
    <div class="bom-tabs">
      <button class="bom-tab-button ${state.machiningTab === "production" ? "active" : ""}" type="button" data-machining-tab="production">
        Produção Usinagem
      </button>
      <button class="bom-tab-button ${state.machiningTab === "products" ? "active" : ""}" type="button" data-machining-tab="products">
        Produtos
      </button>
    </div>
  `;
}

function renderMachiningProcessTimelineItem(process, index, helpers) {
  return `
    <article class="machining-stage-item">
      <div class="machining-stage-index">Etapa ${index + 1}</div>
      <div class="machining-stage-copy">
        <strong>${helpers.escapeHtml(process.name)}</strong>
        <span class="muted">
          ${helpers.escapeHtml(process.machine || "Máquina não informada")} •
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
          ${helpers.escapeHtml(step.machine || "Máquina não informada")} •
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
        <h4>Iniciar produção por etapas</h4>
        <p class="muted">Toda nova produção exige quantidade e lote obrigatórios.</p>
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
        <input type="text" readonly value="${helpers.escapeHtml(helpers.getLoggedUserName("Automático ao iniciar"))}" />
      </label>
      <label>
        Produto acabado no estoque
        <input name="finished_name" type="text" readonly value="${helpers.escapeHtml(draft.finished_name || piece.finished_name || piece.name)}" />
      </label>
      <div class="form-actions-row machining-form-actions">
        <button class="ghost-button" type="button" data-machining-close-inline>Cancelar</button>
        <button class="primary-button" type="submit">Iniciar Produção</button>
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
        <h4>Detalhes da peça</h4>
        <p class="muted">${helpers.escapeHtml(piece.description || "Sem descrição cadastrada.")}</p>
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
        <h4>Produção atual</h4>
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
            : `<div class="empty-state">Nenhuma produção iniciada para esta peça.</div>`
        }
      </section>
    </div>

    <section class="form-section">
      <h4>Histórico de estoque</h4>
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
          : `<div class="empty-state">A peça entra no estoque somente após concluir todas as etapas.</div>`
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
            <span>${helpers.escapeHtml(piece.material || "Material não informado")}</span>
            <span>${processCount} processo(s)</span>
            <span>${helpers.formatMinutesLabel(piece.total_minutes)}</span>
          </div>

          <div class="machining-piece-kpis">
            <div>
              <span>Código</span>
              <strong>${helpers.escapeHtml(piece.code)}</strong>
            </div>
            <div>
              <span>Material</span>
              <strong>${helpers.escapeHtml(piece.material || "-")}</strong>
            </div>
            <div>
              <span>Última produção</span>
              <strong>${latestOrder ? helpers.escapeHtml(latestOrder.lot) : "Não iniciada"}</strong>
            </div>
            <div>
              <span>Etapa atual</span>
              <strong>${latestOrder ? helpers.escapeHtml(helpers.getMachiningCurrentStageLabel(latestOrder)) : "Cadastro"}</strong>
            </div>
          </div>
        </div>

        <div class="machining-piece-actions">
          ${canEdit ? `<button class="primary-button" type="button" data-machining-start-production="${piece.id}">Enviar para Produção da Usinagem</button>` : ""}
          ${canEdit ? `<button class="inline-button" type="button" data-machining-edit-id="${piece.id}">Editar</button>` : ""}
          ${canEdit ? `<button class="inline-button" type="button" data-machining-duplicate-id="${piece.id}">Duplicar</button>` : ""}
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

function renderMachiningProductionCard(piece, state, helpers) {
  const latestOrder = helpers.getLatestMachiningOrder(piece);
  if (!latestOrder) return "";

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
            <span>Lote ${helpers.escapeHtml(latestOrder.lot || "-")}</span>
            <span>${helpers.formatQuantity(latestOrder.quantity_planned || 0)} un</span>
            <span>${helpers.escapeHtml(helpers.getMachiningCurrentStageLabel(latestOrder))}</span>
          </div>
        </div>
      </div>
      <div class="machining-accordion-card machining-inline-card">
        ${renderMachiningPieceDetails(piece, state, helpers)}
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
      return helpers.noPermissionTemplate("Seu perfil não possui acesso ao módulo de usinagem.");
    }

    const canEdit = bridge.hasPermission("machining", "edit");
    const pieces = state.moduleData.machiningPieces || [];
    const activeTab = state.machiningTab || "production";
    const isFormOpen = state.openAccordionKey === "machining-form";
    const searchTerm = state.machiningSearch.trim().toLowerCase();
    const productionPieces = pieces.filter((piece) => (piece.productions || []).some((order) => order.status !== "Concluída"));
    const sourcePieces = activeTab === "production" ? productionPieces : pieces;
    const filteredPieces = sourcePieces.filter((piece) => {
      const matchesSearch = !searchTerm
        || [piece.code, piece.name, piece.material].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesStatus = activeTab === "production" || state.machiningStatusFilter === "all" || piece.status === state.machiningStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const inRegistration = pieces.filter((piece) => piece.status === "Cadastro").length;
    const inProduction = pieces.filter((piece) => piece.status === "Em Produção").length;
    const finished = pieces.filter((piece) => piece.status === "Finalizada").length;

    return `
      <section class="module-panel machining-module">
        <div class="module-head machining-head">
          <div>
            <p class="eyebrow muted">Usinagem</p>
            <h3>Peças &amp; Processos de Usinagem</h3>
            <p class="muted">${pieces.length} peça(s) cadastrada(s)</p>
          </div>
          <div class="module-head-actions">
            ${canEdit && activeTab === "products" ? `
              <button
                class="inline-button machining-settings-button"
                type="button"
                data-machining-open-machines
                aria-label="Cadastrar máquinas"
                title="Cadastrar máquinas"
              >
                ⚙
              </button>
              <button
                class="primary-button machining-create-button ${isFormOpen ? "is-open" : ""}"
                type="button"
                data-machining-toggle-form
              >
                <span>+ Nova Peça</span>
                <span class="production-toggle-icon">${isFormOpen ? "▴" : "▾"}</span>
              </button>
            ` : ""}
          </div>
        </div>

        <div class="summary-grid">
          ${helpers.renderKpiCard({
            label: "Peças Cadastradas",
            value: pieces.length,
            note: pieces.length ? "Cadastro técnico pronto para produção" : "Nenhuma peça cadastrada",
            icon: "◈",
            tone: "blue",
          })}
          ${helpers.renderKpiCard({
            label: "Em Cadastro",
            value: inRegistration,
            note: inRegistration ? "Peças aguardando envio para produção" : "Sem cadastro pendente",
            icon: "⊞",
            tone: "amber",
          })}
          ${helpers.renderKpiCard({
            label: "Em Produção",
            value: inProduction,
            note: inProduction ? "Ordens em execucao por etapas" : "Nenhuma ordem ativa",
            icon: "◭",
            tone: "green",
          })}
          ${helpers.renderKpiCard({
            label: "Finalizadas",
            value: finished,
            note: finished ? "Peças já integradas ao estoque" : "Sem peças concluídas",
            icon: "◬",
            tone: "red",
          })}
        </div>

        ${renderMachiningTabs(state)}

        ${
          activeTab === "products"
            ? canEdit
              ? `
                <div class="machining-accordion-shell ${isFormOpen ? "open" : ""}">
                  <div class="machining-accordion-card">
                    ${renderMachiningForm(state, helpers)}
                  </div>
                </div>
              `
              : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
            : ""
        }

        <div class="table-actions machining-filters-row">
          <label class="search-input-shell">
            <span class="search-input-icon">⌕</span>
            <input
              id="machining-search-input"
              type="text"
              placeholder="Buscar por código, nome ou material..."
              value="${helpers.escapeHtml(state.machiningSearch)}"
            />
          </label>

          ${
            activeTab === "products"
              ? `
                <label>
                  Filtro
                  <select id="machining-status-filter">
                    ${helpers.renderOptions([
                      { value: "all", label: "Todas" },
                      { value: "Cadastro", label: "Cadastro" },
                      { value: "Em Produção", label: "Em Produção" },
                      { value: "Finalizada", label: "Finalizada" },
                    ], state.machiningStatusFilter)}
                  </select>
                </label>
              `
              : ""
          }
        </div>

        <div class="machining-list">
          ${
            filteredPieces.length
              ? filteredPieces
                  .map((piece) => activeTab === "production"
                    ? renderMachiningProductionCard(piece, state, helpers)
                    : renderMachiningPieceCard(piece, canEdit, state, helpers))
                  .join("")
              : `
                <div class="table-card machining-empty-card">
                  <div class="production-empty-state">
                    <div class="production-empty-icon">◈</div>
                    <strong>${activeTab === "production" ? "Nenhum produto em produção na usinagem" : "Nenhuma peça encontrada"}</strong>
                  </div>
                </div>
              `
          }
        </div>
      </section>
      ${renderMachiningMachinesModal(state, helpers)}
      ${renderMachiningProductPickerModal(state, helpers)}
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    document.querySelectorAll("[data-machining-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.machiningTab = button.dataset.machiningTab;
        state.openAccordionKey = null;
        state.machiningDraft = helpers.createEmptyMachiningDraft();
        helpers.renderActiveModule();
      });
    });

    document.querySelector("[data-machining-toggle-form]")?.addEventListener("click", async () => {
      const shouldOpen = state.openAccordionKey !== "machining-form";
      state.openAccordionKey = shouldOpen ? "machining-form" : null;
      state.machiningDraft = helpers.createEmptyMachiningDraft();
      await helpers.renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#machining-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    document.querySelector("[data-machining-open-machines]")?.addEventListener("click", () => {
      state.machiningMachinesModalOpen = true;
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-machining-close-machines], [data-machining-machines-backdrop]").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target !== element && !element.matches("[data-machining-close-machines]")) return;
        state.machiningMachinesModalOpen = false;
        helpers.renderActiveModule();
      });
    });

    document.querySelector("[data-machining-machine-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const name = form.elements.namedItem("machine_name")?.value.trim() || "";
      const code = form.elements.namedItem("machine_code")?.value.trim() || "";
      if (!name) {
        helpers.showToast("Informe o nome da máquina.", "warning");
        return;
      }
      const machines = readMachiningMachines();
      if (machines.some((machine) => machine.name.toLowerCase() === name.toLowerCase())) {
        helpers.showToast("Esta máquina já está cadastrada.", "warning");
        return;
      }
      persistMachiningMachines([{ id: `mach-machine-${Date.now()}`, name, code }, ...machines]);
      helpers.showToast("Máquina cadastrada com sucesso.", "success");
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-machining-remove-machine]").forEach((button) => {
      button.addEventListener("click", () => {
        persistMachiningMachines(readMachiningMachines().filter((machine) => machine.id !== button.dataset.machiningRemoveMachine));
        helpers.renderActiveModule();
      });
    });

    document.querySelector("[data-machining-open-product-picker]")?.addEventListener("dblclick", () => {
      helpers.syncMachiningDraftFromForm(document.querySelector("#machining-form"));
      state.machiningProductPickerOpen = true;
      state.machiningProductPickerSearch = "";
      helpers.renderActiveModule();
      setTimeout(() => document.querySelector("#machining-product-picker-search")?.focus(), 0);
    });

    document.querySelector("[data-machining-close-product-picker]")?.addEventListener("click", () => {
      state.machiningProductPickerOpen = false;
      helpers.renderActiveModule();
    });

    document.querySelector("[data-machining-product-picker-backdrop]")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        state.machiningProductPickerOpen = false;
        helpers.renderActiveModule();
      }
    });

    helpers.bindDeferredTextFilter("#machining-product-picker-search", (value) => {
      state.machiningProductPickerSearch = value;
    });

    document.querySelectorAll("[data-machining-select-finished-product]").forEach((button) => {
      button.addEventListener("dblclick", () => {
        const product = (state.moduleData.products || []).find((item) => item.id === button.dataset.machiningSelectFinishedProduct);
        if (!product) return;
        state.machiningDraft.finished_product_id = product.id;
        state.machiningDraft.finished_name = product.name || "";
        state.machiningProductPickerOpen = false;
        state.machiningProductPickerSearch = "";
        helpers.renderActiveModule();
      });
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
        helpers.showToast("A peça pode ter no máximo 8 processos.", "warning");
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

    document.querySelectorAll("[data-machining-duplicate-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const piece = helpers.findMachiningPiece(button.dataset.machiningDuplicateId);
        if (!piece) return;
        const existingCodes = new Set((state.moduleData.machiningPieces || []).map((item) => String(item.code || "").toLowerCase()));
        let nextCode = `${piece.code || "PECA"}-COPIA`;
        let counter = 2;
        while (existingCodes.has(nextCode.toLowerCase())) {
          nextCode = `${piece.code || "PECA"}-COPIA-${counter}`;
          counter += 1;
        }
        state.machiningDraft = {
          ...helpers.hydrateMachiningDraft(piece),
          edit_id: "",
          code: nextCode,
          name: `${piece.name || "Peça"} (Cópia)`,
        };
        state.openAccordionKey = "machining-form";
        helpers.renderActiveModule();
        document.querySelector("#machining-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-machining-delete-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const pieces = (state.moduleData.machiningPieces || []).filter((piece) => piece.id !== button.dataset.machiningDeleteId);
        helpers.persistMachiningPieces(pieces);
        helpers.renderActiveModule();
        helpers.showToast("Peça excluída com sucesso.", "success");
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
