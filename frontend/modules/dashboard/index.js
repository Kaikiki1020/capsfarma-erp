function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponivel.");
  }
  return bridge;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const {
      buildDashboardSnapshot,
      formatDateTime,
      escapeHtml,
      renderStrategicKpiCard,
      renderDashboardAlert,
      renderDashboardBarChart,
      renderDashboardPipelineStage,
      productionPriorityCell,
      formatCurrency,
      formatDate,
      formatQuantity,
    } = bridge.helpers;
    const snapshot = buildDashboardSnapshot();

    return `
      <section class="module-panel admin-dashboard">
        <div class="module-head dashboard-head">
          <div>
            <p class="eyebrow muted">Visao estrategica do negocio</p>
            <h3>Dashboard do Administrador</h3>
            <p class="muted">Leitura rapida de lucro, operacao, riscos e desempenho geral em um unico painel.</p>
          </div>
          <div class="module-head-actions dashboard-head-actions">
            <div class="dashboard-updated-badge">
              <span class="muted">Atualizado</span>
              <strong>${formatDateTime(state.dashboardLastUpdatedAt)}</strong>
            </div>
            <button class="ghost-button secondary-surface-button" type="button" data-dashboard-refresh>Atualizar agora</button>
          </div>
        </div>

        <section class="dashboard-block dashboard-filter-block">
          <div class="dashboard-block-header">
            <div>
              <h4>Filtro Global</h4>
              <p class="muted">Todos os indicadores, graficos e listas respondem ao mesmo periodo.</p>
            </div>
            <span class="status-chip chip-blue">${escapeHtml(snapshot.rangeLabel)}</span>
          </div>
          <div class="dashboard-filter-toolbar">
            ${[
              { value: "today", label: "Hoje" },
              { value: "7d", label: "7 dias" },
              { value: "30d", label: "30 dias" },
              { value: "custom", label: "Personalizado" },
            ].map((option) => `
              <button
                class="dashboard-filter-chip ${state.dashboardRange === option.value ? "active" : ""}"
                type="button"
                data-dashboard-range="${option.value}"
              >
                ${option.label}
              </button>
            `).join("")}
            <div class="dashboard-custom-range ${state.dashboardRange === "custom" ? "visible" : ""}">
              <label>
                De
                <input type="date" id="dashboard-range-from" value="${escapeHtml(state.dashboardCustomRange.from)}" />
              </label>
              <label>
                Ate
                <input type="date" id="dashboard-range-to" value="${escapeHtml(state.dashboardCustomRange.to)}" />
              </label>
            </div>
          </div>
        </section>

        <div class="summary-grid dashboard-kpi-grid">
          ${snapshot.kpis.map(renderStrategicKpiCard).join("")}
        </div>

        <section class="dashboard-block dashboard-alerts-block">
          <div class="dashboard-block-header">
            <div>
              <h4>Alertas Prioritarios</h4>
              <p class="muted">Problemas que exigem acao imediata ou acompanhamento de perto.</p>
            </div>
            <span class="status-chip ${snapshot.alerts.length ? "status-pending" : "status-completed"}">
              ${snapshot.alerts.length ? `${snapshot.alerts.length} alerta(s)` : "Operacao estavel"}
            </span>
          </div>
          <div class="dashboard-alert-list">
            ${
              snapshot.alerts.length
                ? snapshot.alerts.map(renderDashboardAlert).join("")
                : `<div class="empty-state">Nenhum alerta urgente para o periodo selecionado.</div>`
            }
          </div>
        </section>

        <div class="dashboard-grid dashboard-strategic-grid">
          <div class="dashboard-stack">
            <section class="dashboard-block">
              <div class="dashboard-block-header">
                <div>
                  <h4>Financeiro</h4>
                  <p class="muted">Faturamento por periodo com comparativo entre custo e lucro estimado.</p>
                </div>
              </div>
              ${renderDashboardBarChart({
                labels: snapshot.financeChart.labels,
                series: snapshot.financeChart.series,
                emptyLabel: "Sem dados financeiros para o periodo selecionado.",
              })}
            </section>

            <section class="dashboard-block">
              <div class="dashboard-block-header">
                <div>
                  <h4>Producao</h4>
                  <p class="muted">Volume produzido por periodo e tempo medio para concluir ordens.</p>
                </div>
              </div>
              ${renderDashboardBarChart({
                labels: snapshot.productionChart.labels,
                series: snapshot.productionChart.series,
                emptyLabel: "Sem ordens produtivas dentro do filtro atual.",
              })}
              <div class="dashboard-chart-metrics">
                <article class="dashboard-stat-card">
                  <span class="muted">Tempo medio de producao</span>
                  <strong>${snapshot.productionAverageTimeLabel}</strong>
                </article>
                <article class="dashboard-stat-card">
                  <span class="muted">Ordens concluidas</span>
                  <strong>${snapshot.productionCompletedCount}</strong>
                </article>
              </div>
            </section>

            <section class="dashboard-block">
              <div class="dashboard-block-header">
                <div>
                  <h4>Pedidos Recentes</h4>
                  <p class="muted">Pedidos mais relevantes com status, prioridade e atalhos de acao.</p>
                </div>
              </div>
              <div class="table-wrapper dashboard-orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Prioridade</th>
                      <th>Data</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      snapshot.recentOrders.length
                        ? snapshot.recentOrders.map((item) => `
                          <tr>
                            <td>
                              <strong>${escapeHtml(item.customerName)}</strong>
                              <div class="table-inline-copy muted">${escapeHtml(item.saleNumber)}</div>
                            </td>
                            <td>${formatCurrency(item.total)}</td>
                            <td>${item.statusBadge}</td>
                            <td>${productionPriorityCell(item.priority)}</td>
                            <td>${formatDate(item.date)}</td>
                            <td>
                              <div class="dashboard-inline-actions">
                                <button class="inline-button" type="button" data-dashboard-sales-view-id="${item.id}">Visualizar</button>
                                <button class="inline-button" type="button" data-dashboard-sales-edit-id="${item.id}">Editar</button>
                              </div>
                            </td>
                          </tr>
                        `).join("")
                        : `<tr><td colspan="6"><div class="empty-state">Nenhum pedido encontrado no periodo selecionado.</div></td></tr>`
                    }
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div class="dashboard-stack">
            <section class="dashboard-block">
              <div class="dashboard-block-header">
                <div>
                  <h4>Comercial</h4>
                  <p class="muted">Pedidos por periodo com leitura rapida de volume e ticket medio.</p>
                </div>
              </div>
              ${renderDashboardBarChart({
                labels: snapshot.commercialChart.labels,
                series: snapshot.commercialChart.series,
                emptyLabel: "Sem pedidos comerciais para o periodo selecionado.",
              })}
              <div class="dashboard-chart-metrics">
                <article class="dashboard-stat-card">
                  <span class="muted">Ticket medio</span>
                  <strong>${formatCurrency(snapshot.averageTicket)}</strong>
                </article>
                <article class="dashboard-stat-card">
                  <span class="muted">Pedidos em aberto</span>
                  <strong>${snapshot.openOrdersCount}</strong>
                </article>
              </div>
            </section>

            <section class="dashboard-block">
              <div class="dashboard-block-header">
                <div>
                  <h4>Pipeline da Producao</h4>
                  <p class="muted">Fluxo resumido por etapa com destaque para gargalos.</p>
                </div>
              </div>
              <div class="dashboard-pipeline">
                ${snapshot.pipeline.map(renderDashboardPipelineStage).join("")}
              </div>
            </section>

            <section class="dashboard-block">
              <div class="dashboard-block-header">
                <div>
                  <h4>Resumo Financeiro</h4>
                  <p class="muted">Contas previstas e saldo operacional a partir dos registros atuais.</p>
                </div>
              </div>
              <div class="dashboard-financial-summary">
                ${snapshot.financialSummary.map((item) => `
                  <article class="dashboard-financial-card">
                    <span class="muted">${item.label}</span>
                    <strong>${item.isCurrency ? formatCurrency(item.value) : escapeHtml(String(item.value))}</strong>
                    <small class="${item.tone ? `metric-${item.tone}` : "muted"}">${escapeHtml(item.note)}</small>
                  </article>
                `).join("")}
              </div>
            </section>

            <section class="dashboard-block">
              <div class="dashboard-block-header">
                <div>
                  <h4>Estoque Critico</h4>
                  <p class="muted">Itens baixos ou zerados que podem afetar a operacao.</p>
                </div>
                <button class="ghost-button" type="button" data-dashboard-module="inventory">Ir para modulo</button>
              </div>
              <div class="dashboard-list">
                ${
                  snapshot.criticalStock.length
                    ? snapshot.criticalStock.map((item) => `
                      <article class="dashboard-list-item dashboard-stock-alert ${item.level}">
                        <div>
                          <strong>${escapeHtml(item.name)}</strong>
                          <span class="muted">Saldo ${formatQuantity(item.currentStock)} ${escapeHtml(item.unit)} | Minimo ${formatQuantity(item.minimumStock)} ${escapeHtml(item.unit)}</span>
                        </div>
                        <span class="status-chip ${item.level === "danger" ? "status-cancelled" : "status-pending"}">
                          ${item.level === "danger" ? "Zerado" : "Baixo"}
                        </span>
                      </article>
                    `).join("")
                    : `<div class="empty-state">Nenhum item com estoque critico no momento.</div>`
                }
              </div>
            </section>
          </div>
        </div>
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const {
      renderActiveModule,
      getDateShiftedIso,
      refreshDashboardData,
      showToast,
      formatError,
      openSaleFromDashboard,
    } = bridge.helpers;

    document.querySelectorAll("[data-dashboard-range]").forEach((button) => {
      button.addEventListener("click", () => {
        state.dashboardRange = button.dataset.dashboardRange || "30d";
        if (state.dashboardRange !== "custom") {
          renderActiveModule();
          return;
        }

        if (!state.dashboardCustomRange.to) {
          state.dashboardCustomRange.to = new Date().toISOString().slice(0, 10);
        }
        if (!state.dashboardCustomRange.from) {
          state.dashboardCustomRange.from = getDateShiftedIso(state.dashboardCustomRange.to, -29);
        }
        renderActiveModule();
      });
    });

    document.querySelector("#dashboard-range-from")?.addEventListener("change", (event) => {
      state.dashboardRange = "custom";
      state.dashboardCustomRange.from = event.currentTarget.value;
      renderActiveModule();
    });

    document.querySelector("#dashboard-range-to")?.addEventListener("change", (event) => {
      state.dashboardRange = "custom";
      state.dashboardCustomRange.to = event.currentTarget.value;
      renderActiveModule();
    });

    document.querySelector("[data-dashboard-refresh]")?.addEventListener("click", async () => {
      await refreshDashboardData();
    });

    document.querySelectorAll("[data-dashboard-module]").forEach((button) => {
      button.addEventListener("click", async () => {
        const moduleKey = button.dataset.dashboardModule;
        if (!moduleKey || !bridge.hasPermission(moduleKey, "view")) return;
        try {
          state.activeModule = moduleKey;
          bridge.helpers.renderModuleNav();
          await bridge.loadModuleData(moduleKey);
          renderActiveModule();
        } catch (error) {
          showToast(formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-dashboard-sales-view-id]").forEach((button) => {
      button.addEventListener("click", () => {
        void openSaleFromDashboard(button.dataset.dashboardSalesViewId);
      });
    });

    document.querySelectorAll("[data-dashboard-sales-edit-id]").forEach((button) => {
      button.addEventListener("click", () => {
        void openSaleFromDashboard(button.dataset.dashboardSalesEditId);
      });
    });
  },
};
