function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

function renderProductionRow(item, canEdit, canDelete, helpers) {
  const metadata = helpers.getProductionOrderMetadata(item);

  return `
    <tr>
      <td>
        <strong>${helpers.escapeHtml(item.product_name || "-")}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(metadata.lotNumber || "Sem lote")}</div>
      </td>
      <td>
        <strong>${helpers.escapeHtml(item.order_number || "-")}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(item.product_code || "Sem código do produto")}</div>
      </td>
      <td>${helpers.formatQuantity(item.batch_size)}</td>
      <td>${helpers.productionPriorityCell(metadata.priority)}</td>
      <td>${helpers.statusCell(item.status || "planned")}</td>
      <td>${helpers.escapeHtml(metadata.responsibleName || "-")}</td>
      <td>
        <strong>${helpers.formatDate(item.planned_start)}</strong>
        <div class="table-inline-copy muted">Ate ${helpers.formatDate(item.planned_end)}</div>
      </td>
      <td>${renderProductionActionCell(item, canEdit, canDelete)}</td>
    </tr>
  `;
}

function renderProductionActionCell(item, canEdit, canDelete) {
  return `
    <div class="action-button-group">
      ${
        canEdit && item.status === "planned"
          ? `<button class="primary-button" type="button" data-production-start-id="${item.id}">Iniciar</button>`
          : ""
      }
      ${item.status !== "planned" ? `<button class="inline-button" type="button" data-production-dashboard-id="${item.id}">Painel</button>` : ""}
      <button class="inline-button" type="button" data-production-print-id="${item.id}">Imprimir</button>
      ${canEdit ? `<button class="inline-button" type="button" data-production-edit-id="${item.id}">Editar</button>` : ""}
      ${canDelete ? `<button class="inline-button danger-button" type="button" data-production-delete-id="${item.id}">Excluir</button>` : ""}
    </div>
  `;
}

function getProductionDashboardOrder(orders, state) {
  const selected = orders.find((item) => item.id === state.productionSelectedOrderId);
  if (selected && selected.status !== "planned") return selected;
  return orders.find((item) => item.status === "in_progress")
    || orders.find((item) => item.status === "paused")
    || orders.find((item) => item.status === "completed")
    || null;
}

function getProductionMetrics(order, helpers) {
  const metadata = helpers.getProductionOrderMetadata(order);
  const steps = metadata.operationSteps || [];
  const completedSteps = steps.filter((step) => step.status === "completed").length;
  const progress = steps.length ? Math.round((completedSteps / steps.length) * 100) : 0;
  const totalQuantity = Number(order.batch_size || 0);
  const producedQuantity = Math.max(Number(metadata.producedQuantity || 0), Math.round((totalQuantity * progress) / 100));
  const pendingQuantity = Math.max(totalQuantity - producedQuantity, 0);
  const activeStepIndex = Math.max(0, steps.findIndex((step) => ["pending", "in_progress", "quality"].includes(step.status)));
  const activeStep = steps[activeStepIndex] || steps[steps.length - 1] || null;
  const estimatedMinutes = Number(metadata.estimatedMinutes || steps.reduce((total, step) => total + Number(step.estimated_minutes || 0), 0));
  const elapsedMinutes = steps.reduce((total, step) => total + Number(step.elapsed_minutes || 0), 0);
  const remainingMinutes = Math.max(estimatedMinutes - elapsedMinutes, 0);
  const isDelayed = order.planned_end && new Date(`${order.planned_end}T23:59:59`) < new Date() && order.status !== "completed";
  const hasAttention = Boolean((metadata.alerts || []).length || (metadata.materialPlan || []).some((item) => Number(item.missing_quantity || 0) > 0));
  const tone = order.status === "completed" ? "success" : isDelayed ? "danger" : hasAttention ? "warning" : "active";

  return {
    metadata,
    steps,
    completedSteps,
    progress,
    totalQuantity,
    producedQuantity,
    pendingQuantity,
    activeStepIndex,
    activeStep,
    remainingMinutes,
    isDelayed,
    hasAttention,
    tone,
  };
}

function formatProductionDuration(minutes) {
  const total = Number(minutes || 0);
  if (total <= 0) return "Sem base";
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins} min`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

function renderProductionDashboard(order, orders, canEdit, helpers) {
  const state = getBridge().getState();
  if (!order) {
    return `
      <section class="production-command-empty">
        <div>
          <p class="eyebrow muted">Dashboard OP</p>
          <h3>Nenhuma OP iniciada</h3>
          <p>O centro de comando aparece automaticamente quando uma ordem entra em produção.</p>
        </div>
      </section>
    `;
  }

  const metrics = getProductionMetrics(order, helpers);
  const metadata = metrics.metadata;
  const items = metadata.productionItems?.length ? metadata.productionItems : [{
    product_name: order.product_name,
    product_code: order.product_code,
    quantity: order.batch_size,
    batchSize: order.batch_size,
  }];
  const tabs = [
    { key: "details", label: "Detalhes da OP" },
    { key: "materials", label: "Materiais / BOM" },
    { key: "operations", label: "Operações / Etapas" },
    { key: "tracking", label: "Acompanhamento" },
    { key: "attachments", label: "Anexos" },
    { key: "reports", label: "Relatórios" },
  ];
  const activeTab = state.productionDashboardTab || "operations";
  const isFocusMode = state.productionFocusOrderId === order.id;

  return `
    <section class="production-command-center production-tone-${metrics.tone} ${isFocusMode ? "production-focus-command" : ""}">
      <div class="production-command-hero">
        <div class="production-command-title">
          <span class="production-command-kicker">Sistema de gestão de produção</span>
          <h2>Ordem de Produção <strong>#${helpers.escapeHtml(order.order_number || "-")}</strong></h2>
        </div>
        <div class="production-command-actions">
          <div class="production-live-chip">
            <span></span>
            Atualização em tempo real
          </div>
          ${isFocusMode ? `<button class="ghost-button production-exit-focus-button" type="button" data-production-exit-focus>Sair da tela cheia</button>` : ""}
        </div>
      </div>

      <div class="production-command-grid">
        <article class="production-glass-card production-op-card">
          <dl>
            <div><dt>OP ID</dt><dd>${helpers.escapeHtml(order.order_number || "-")}</dd></div>
            <div><dt>Cliente</dt><dd>${helpers.escapeHtml(metadata.customerName || order.customer_name || "-")}</dd></div>
            <div><dt>ID da venda</dt><dd>${helpers.escapeHtml(metadata.saleNumber || metadata.saleId || "-")}</dd></div>
            <div><dt>Prioridade</dt><dd>${helpers.productionPriorityCell(metadata.priority)}</dd></div>
            <div><dt>Emissão</dt><dd>${helpers.formatDate(order.planned_start || order.created_at)}</dd></div>
            <div><dt>Entrega</dt><dd>${helpers.formatDate(order.planned_end)}</dd></div>
          </dl>
        </article>

        <article class="production-glass-card production-progress-card">
          <div class="production-progress-head">
            <span>Status: <strong>${helpers.escapeHtml(helpers.getProductionOperationStepLabel(metrics.activeStep?.status || order.status))}</strong></span>
            <b>${metrics.progress}%</b>
          </div>
          <div class="production-main-progress"><span style="width:${metrics.progress}%"></span></div>
          <div class="production-progress-stats">
            <span>${helpers.formatQuantity(metrics.producedQuantity)} concluído</span>
            <span>${helpers.formatQuantity(metrics.pendingQuantity)} pendente</span>
            <span>${formatProductionDuration(metrics.remainingMinutes)} restante</span>
          </div>
        </article>

        <article class="production-glass-card production-products-card">
          <div>
            <span>Produtos no lote</span>
            <strong>${items.length}</strong>
          </div>
          <ul>
            ${items.slice(0, 4).map((item) => `
              <li>
                <b>${helpers.escapeHtml(item.productionLabel || item.product_name || "-")}</b>
                <span>${helpers.formatWholeQuantity(item.quantity || 0)} venda / ${helpers.formatWholeQuantity(item.batchSize || item.batch_size || item.quantity || 0)} prod.</span>
              </li>
            `).join("")}
          </ul>
        </article>
      </div>

      <div class="production-command-tabs">
        ${tabs.map((tab) => `
          <button class="${tab.key === activeTab ? "active" : ""}" type="button" data-production-dashboard-tab="${tab.key}">
            ${tab.label}
          </button>
        `).join("")}
      </div>

      <div class="production-command-body">
        <main class="production-command-main">
          ${renderProductionDashboardTab(activeTab, order, metrics, items, canEdit, helpers)}
        </main>
        ${renderProductionSidePanel(order, metrics, canEdit, helpers)}
      </div>
    </section>
  `;
}

function renderProductionDashboardTab(activeTab, order, metrics, items, canEdit, helpers) {
  if (activeTab === "details") return renderProductionDetailsTab(order, metrics, items, helpers);
  if (activeTab === "materials") return renderProductionMaterialsTab(metrics, helpers);
  if (activeTab === "tracking") return renderProductionTrackingTab(metrics, helpers);
  if (activeTab === "attachments") return renderProductionAttachmentsTab(metrics, helpers);
  if (activeTab === "reports") return renderProductionReportsTab(metrics, helpers);
  return renderProductionOperationsTab(order, metrics, canEdit, helpers);
}

function renderProductionDetailsTab(order, metrics, items, helpers) {
  const metadata = metrics.metadata;
  return `
    <section class="production-dashboard-panel">
      <h3>Detalhes da OP</h3>
      <div class="production-detail-grid">
        <div><span>Cliente</span><strong>${helpers.escapeHtml(metadata.customerName || order.customer_name || "-")}</strong></div>
        <div><span>Venda</span><strong>${helpers.escapeHtml(metadata.saleNumber || "-")}</strong></div>
        <div><span>Contrato</span><strong>${helpers.escapeHtml((metadata.notes || "").match(/Contrato [^|]+/)?.[0] || "-")}</strong></div>
        <div><span>Responsável</span><strong>${helpers.escapeHtml(metadata.responsibleName || order.responsible_name || "PCP")}</strong></div>
      </div>
      <div class="production-items-list">
        ${items.map((item) => `
          <article>
            <strong>${helpers.escapeHtml(item.productionLabel || item.product_name || "-")}</strong>
            <span>${helpers.escapeHtml(item.product_code || "-")} • Qtd ${helpers.formatWholeQuantity(item.quantity || 0)} • Produção ${helpers.formatWholeQuantity(item.batchSize || item.batch_size || item.quantity || 0)}</span>
          </article>
        `).join("")}
      </div>
      ${metadata.notes ? `<p class="production-notes">${helpers.escapeHtml(metadata.notes)}</p>` : ""}
    </section>
  `;
}

function renderProductionMaterialsTab(metrics, helpers) {
  const plan = metrics.metadata.materialPlan || [];
  return `
    <section class="production-dashboard-panel">
      <h3>Materiais / BOM</h3>
      <div class="production-material-table">
        ${plan.length ? plan.map((item) => {
          const missing = Number(item.missing_quantity || 0);
          return `
            <article class="${missing > 0 ? "is-missing" : ""}">
              <div><strong>${helpers.escapeHtml(item.name || "-")}</strong><span>${helpers.escapeHtml(item.code || item.type || "-")}</span></div>
              <div><span>Necessário</span><b>${helpers.formatQuantity(item.required_quantity || 0)} ${helpers.escapeHtml(item.unit || "")}</b></div>
              <div><span>Disponível</span><b>${helpers.formatQuantity(item.available_quantity || 0)}</b></div>
              <div><span>Faltante</span><b>${helpers.formatQuantity(missing)}</b></div>
            </article>
          `;
        }).join("") : `<div class="empty-state compact-empty">Sem BOM vinculado ao lote.</div>`}
      </div>
    </section>
  `;
}

function renderProductionOperationsTab(order, metrics, canEdit, helpers) {
  return `
    <section class="production-dashboard-panel">
      <h3>Resumo de operações</h3>
      <div class="production-flow">
        ${metrics.steps.map((step, index) => renderProductionFlowStep(order, step, index, metrics, canEdit, helpers)).join("")}
      </div>
    </section>
  `;
}

function renderProductionFlowStep(order, step, index, metrics, canEdit, helpers) {
  const isActive = index === metrics.activeStepIndex && ["pending", "in_progress", "quality"].includes(step.status);
  const disabled = !canEdit || !isActive || order.status === "completed";
  return `
    <article class="production-flow-step ${step.status} ${isActive ? "active" : ""}">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <strong>${helpers.escapeHtml(step.name)}</strong>
      <small>${helpers.escapeHtml(helpers.getProductionOperationStepLabel(step.status))}</small>
      <em>${helpers.escapeHtml(step.operator || "-")}</em>
      <small>${formatProductionDuration(step.elapsed_minutes || step.estimated_minutes)}</small>
      <button class="inline-button" type="button" data-production-operation-advance="${order.id}|${index}" ${disabled ? "disabled" : ""}>
        ${helpers.escapeHtml(helpers.getProductionOperationActionLabel(step.status))}
      </button>
    </article>
  `;
}

function renderProductionTrackingTab(metrics, helpers) {
  const entries = metrics.metadata.timelineEntries || [];
  return `
    <section class="production-dashboard-panel">
      <h3>Acompanhamento diário</h3>
      <div class="production-timeline">
        ${entries.length ? entries.map((entry) => `
          <article>
            <span></span>
            <div>
              <strong>${helpers.escapeHtml(entry.title || "Atualização")}</strong>
              <p>${helpers.escapeHtml(entry.description || "")}</p>
              <small>${helpers.escapeHtml(entry.operator || "-")} • ${helpers.formatDateTime(entry.created_at)}</small>
            </div>
          </article>
        `).join("") : `<div class="empty-state compact-empty">Sem histórico registrado.</div>`}
      </div>
    </section>
  `;
}

function renderProductionAttachmentsTab(metrics, helpers) {
  const attachments = metrics.metadata.attachments || [];
  return `
    <section class="production-dashboard-panel">
      <h3>Anexos</h3>
      <div class="production-attachments-grid">
        ${attachments.length ? attachments.map((file) => `
          <article>
            <span>${helpers.escapeHtml(file.type || "doc")}</span>
            <strong>${helpers.escapeHtml(file.name || "Documento")}</strong>
            <small>${helpers.escapeHtml(file.status || "Disponível")}</small>
          </article>
        `).join("") : `<div class="empty-state compact-empty">Desenhos, PDFs, fotos e checklists serão listados aqui.</div>`}
      </div>
    </section>
  `;
}

function renderProductionReportsTab(metrics, helpers) {
  const totalDefects = (metrics.metadata.qualityLogs || []).reduce((sum, item) => sum + Number(item.defects || 0), 0);
  const totalRework = (metrics.metadata.qualityLogs || []).reduce((sum, item) => sum + Number(item.rework || 0), 0);
  const efficiency = metrics.progress >= 100 && totalDefects === 0 ? 98 : Math.max(45, metrics.progress - totalDefects * 3);
  return `
    <section class="production-dashboard-panel">
      <h3>Relatórios</h3>
      <div class="production-report-grid">
        <div><span>Tempo restante</span><strong>${formatProductionDuration(metrics.remainingMinutes)}</strong></div>
        <div><span>Eficiência produtiva</span><strong>${efficiency}%</strong></div>
        <div><span>Defeitos</span><strong>${helpers.formatWholeQuantity(totalDefects)}</strong></div>
        <div><span>Retrabalho</span><strong>${helpers.formatWholeQuantity(totalRework)}</strong></div>
      </div>
    </section>
  `;
}

function renderProductionSidePanel(order, metrics, canEdit, helpers) {
  const alerts = metrics.metadata.alerts || [];
  return `
    <aside class="production-current-panel">
      <div class="production-current-head">
        <span>Operação atual</span>
        <strong>${helpers.escapeHtml(metrics.activeStep?.name || helpers.getProductionStatusLabel(order.status))}</strong>
      </div>
      <dl>
        <div><dt>Operador</dt><dd>${helpers.escapeHtml(metrics.activeStep?.operator || metrics.metadata.activeOperator || "-")}</dd></div>
        <div><dt>Progresso</dt><dd>${metrics.progress}%</dd></div>
        <div><dt>Defeitos</dt><dd>${helpers.formatWholeQuantity(metrics.metadata.defectiveQuantity || 0)}</dd></div>
        <div><dt>Produzido</dt><dd>${helpers.formatQuantity(metrics.producedQuantity)} / ${helpers.formatQuantity(metrics.totalQuantity)}</dd></div>
        <div><dt>Tempo ativo</dt><dd>${formatProductionDuration(metrics.steps.reduce((total, step) => total + Number(step.elapsed_minutes || 0), 0))}</dd></div>
      </dl>
      <div class="production-alert-list">
        ${alerts.length ? alerts.map((alert) => `
          <article class="${alert.level || "warning"}">
            <strong>${helpers.escapeHtml(alert.title || "Alerta")}</strong>
            <span>${helpers.escapeHtml(alert.description || "")}</span>
          </article>
        `).join("") : `<article><strong>Sem alertas críticos</strong><span>Materiais e etapas sob controle.</span></article>`}
      </div>
      ${canEdit && order.status === "planned" ? `<button class="primary-button" type="button" data-production-start-id="${order.id}">Iniciar OP</button>` : ""}
    </aside>
  `;
}

function renderProductionOperationConfigPanel(state, helpers) {
  const draft = state.productionOperationConfigDraft || helpers.createProductionOperationConfigDraft();
  const steps = draft.steps?.length ? draft.steps : helpers.createProductionOperationConfigDraft().steps;

  return `
    <div class="production-config-shell open">
      <div class="production-config-card">
        <div class="production-form-header">
          <div>
            <h4>Configuração do resumo da operação</h4>
            <p class="muted">Essas etapas serão usadas nas próximas ordens de produção criadas.</p>
          </div>
        </div>
        <form id="production-operation-config-form" class="production-config-form">
          <div class="production-config-steps">
            ${steps.map((step, index) => renderProductionOperationConfigRow(step, index, helpers)).join("")}
          </div>
          <div class="form-actions-row production-form-actions">
            <button class="inline-button" type="button" data-production-config-add-step>Adicionar etapa</button>
            <button class="ghost-button" type="button" data-production-config-restore-defaults>Restaurar padrão</button>
            <button class="ghost-button" type="button" data-production-config-cancel>Cancelar</button>
            <button class="primary-button" type="submit">Salvar config</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderProductionOperationConfigRow(step, index, helpers) {
  return `
    <div class="production-config-step-row" data-production-config-step-row="${helpers.escapeHtml(step.id || `config-step-${index + 1}`)}">
      <label>
        Ordem
        <input name="operation_sequence" type="number" min="1" step="1" value="${helpers.escapeHtml(step.sequence || index + 1)}" />
      </label>
      <label>
        Nome da etapa
        <input name="operation_name" type="text" value="${helpers.escapeHtml(step.name || "")}" required />
      </label>
      <label>
        Tempo em minutos
        <input name="operation_minutes" type="number" min="0" step="1" value="${helpers.escapeHtml(step.estimated_minutes ?? 0)}" />
      </label>
      <button class="inline-button danger-button" type="button" data-production-config-remove-step="${helpers.escapeHtml(step.id || "")}">
        Remover
      </button>
    </div>
  `;
}

function renderProductionMachiningSection(machiningOrders) {
  return `
    <section class="production-machining-section">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">USINAGEM POR ETAPAS</p>
          <h3>Ordens agrupadas por peça</h3>
          <p class="muted">Fluxo sequencial com liberação automática da próxima etapa e entrada no estoque ao concluir.</p>
        </div>
      </div>

      <div class="production-machining-list">
        ${
          machiningOrders.length
            ? machiningOrders.map((entry) => renderProductionMachiningCard(entry)).join("")
            : `<div class="empty-state">Nenhuma ordem de usinagem enviada para produção.</div>`
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
          <p class="muted">${entry.order.steps.length} etapa(s) • ${completedSteps} concluída(s)</p>
        </div>
        <div class="production-machining-progress">
          <strong>${progress}%</strong>
          <span>${completedSteps}/${entry.order.steps.length} concluídas</span>
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
          <div><span>Código da Ordem</span><strong>${helpers.escapeHtml(order.order_number)}</strong></div>
          <div><span>Status</span><strong>${helpers.escapeHtml(step.status === "Bloqueada" ? "Pendente" : step.status)}</strong></div>
          <div><span>Nome da Etapa</span><strong>${helpers.escapeHtml(step.name)}</strong></div>
          <div><span>Operador</span><strong>${helpers.escapeHtml(step.completed_by || step.operator || order.operator || "-")}</strong></div>
          <div><span>Data de Inicio</span><strong>${helpers.escapeHtml(step.started_at ? helpers.formatDateTime(step.started_at) : "-")}</strong></div>
          <div><span>Peça</span><strong>${helpers.escapeHtml(piece.name)}</strong></div>
          <div><span>Processo</span><strong>${helpers.escapeHtml(step.name)}</strong></div>
          <div><span>Máquina</span><strong>${helpers.escapeHtml(step.machine || "-")}</strong></div>
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
      return helpers.noPermissionTemplate("Seu perfil não possui acesso ao módulo de produção.");
    }

    const canEdit = bridge.hasPermission("production", "edit");
    const canManageProductionConfig = helpers.isPermissionsAdmin();
    const isFormOpen = state.openAccordionKey === "production-order-form";
    const isConfigOpen = state.openAccordionKey === "production-operation-config";
    const products = state.moduleData.products || [];
    const allOrders = state.moduleData.production || [];
    const activeDashboardOrder = getProductionDashboardOrder(allOrders, state);
    const isFocusMode = state.productionFocusOrderId && activeDashboardOrder?.id === state.productionFocusOrderId;
    const searchTerm = state.productionSearch.trim().toLowerCase();
    const filteredOrders = allOrders.filter((item) => {
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
      <section class="module-panel production-module ${isFocusMode ? "production-focus-module" : ""}">
        <div class="module-head production-head">
          <div>
            <p class="eyebrow muted">Produção</p>
            <h3>Ordens de produção</h3>
            <p class="muted">Gerencie ordens de produção.</p>
          </div>
          <div class="module-head-actions">
            ${canManageProductionConfig ? `
              <button
                class="inline-button production-config-button ${isConfigOpen ? "is-open" : ""}"
                type="button"
                data-production-toggle-config
                aria-label="Configurar resumo da operação"
                title="Configurar resumo da operação"
              >
                <span aria-hidden="true">⚙</span>
              </button>
            ` : ""}
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

        ${renderProductionDashboard(activeDashboardOrder, allOrders, canEdit, helpers)}

        ${canManageProductionConfig && isConfigOpen ? renderProductionOperationConfigPanel(state, helpers) : ""}

        ${
          canEdit
            ? products.length
              ? `
              <div class="production-accordion-shell ${isFormOpen ? "open" : ""}">
                <div class="production-accordion-card">
                  <div class="production-form-header">
                    <div>
                      <h4>${state.productionDraft.edit_id ? "Editar Ordem de Produção" : "Nova Ordem de Produção"}</h4>
                      <p class="muted">Fluxo em accordion com integração aos produtos cadastrados.</p>
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
                        Código
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
                        Observações
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
              : `<div class="empty-state">Cadastre ao menos um produto no módulo Produtos para abrir novas ordens de produção.</div>`
            : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
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
                { value: "paused", label: "Pausada" },
                { value: "completed", label: "Concluída" },
                { value: "cancelled", label: "Cancelada" },
              ], state.productionStatusFilter)}
            </select>
          </label>
        </div>

        <div class="table-card production-table-card">
          ${
            filteredOrders.length
              ? `
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Código</th>
                      <th>Quantidade</th>
                      <th>Prioridade</th>
                      <th>Status</th>
                      <th>Responsavel</th>
                      <th>Datas</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredOrders.map((item) => renderProductionRow(item, canEdit, canManageProductionConfig, helpers)).join("")}
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

    const configButton = document.querySelector("[data-production-toggle-config]");
    if (configButton) {
      configButton.addEventListener("click", () => {
        const shouldOpen = state.openAccordionKey !== "production-operation-config";
        state.openAccordionKey = shouldOpen ? "production-operation-config" : null;
        helpers.resetProductionOperationConfigDraft();
        helpers.renderActiveModule();
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

    const configForm = document.querySelector("#production-operation-config-form");
    if (configForm) {
      configForm.addEventListener("submit", helpers.handleProductionOperationConfigSubmit);
      configForm.addEventListener("input", () => helpers.syncProductionOperationConfigDraftFromForm(configForm));
      configForm.addEventListener("change", () => helpers.syncProductionOperationConfigDraftFromForm(configForm));
    }

    document.querySelector("[data-production-config-add-step]")?.addEventListener("click", () => {
      helpers.addProductionOperationConfigStep();
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-production-config-remove-step]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.removeProductionOperationConfigStep(button.dataset.productionConfigRemoveStep);
        helpers.renderActiveModule();
      });
    });

    document.querySelector("[data-production-config-restore-defaults]")?.addEventListener("click", () => {
      helpers.restoreDefaultProductionOperationConfig();
      helpers.renderActiveModule();
    });

    document.querySelector("[data-production-config-cancel]")?.addEventListener("click", () => {
      helpers.resetProductionOperationConfigDraft();
      state.openAccordionKey = null;
      helpers.renderActiveModule();
    });

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

    document.querySelectorAll("[data-production-dashboard-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.productionDashboardTab = button.dataset.productionDashboardTab || "operations";
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-production-dashboard-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.productionSelectedOrderId = button.dataset.productionDashboardId;
        state.productionDashboardTab = state.productionDashboardTab || "operations";
        helpers.renderActiveModule();
        document.querySelector(".production-command-center")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-production-operation-advance]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.handleProductionOperationAdvance(button.dataset.productionOperationAdvance);
      });
    });

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
        if (!helpers.isPermissionsAdmin()) {
          helpers.showToast("Somente TI e ADMINISTRADOR podem excluir ordem de produção.", "warning");
          return;
        }
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
            description: "Ordem de produção excluída.",
            entityType: "production_order",
            entityId: button.dataset.productionDeleteId,
          });
          helpers.showToast("Ordem excluída com sucesso.", "success");
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-production-start-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        helpers.enterProductionFocusMode?.(button.dataset.productionStartId);
        await helpers.handleProductionStart(button.dataset.productionStartId);
      });
    });

    document.querySelector("[data-production-exit-focus]")?.addEventListener("click", () => {
      helpers.exitProductionFocusMode?.();
    });

    document.querySelectorAll("[data-production-print-id]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.handleProductionPrint(button.dataset.productionPrintId);
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
