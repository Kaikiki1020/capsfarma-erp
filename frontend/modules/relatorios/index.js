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
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("reports", "view")) {
      return helpers.noPermissionTemplate("Seu perfil nao possui acesso ao modulo de relatorios.");
    }

    const snapshot = helpers.buildReportsSnapshot();

    return `
      <section class="module-panel">
        <div class="module-head">
          <div>
            <p class="eyebrow muted">Analise gerencial</p>
            <h3>Relatorios</h3>
            <p class="muted">Consolidado operacional de vendas, producao, compras, estoque e ordens de servico.</p>
          </div>
          <div class="module-head-actions">
            <button class="ghost-button" type="button" data-reports-refresh>Atualizar</button>
            <button class="primary-button" type="button" data-reports-export>Exportar PDF</button>
          </div>
        </div>

        <form id="reports-filter-form" class="table-actions reports-filter-grid">
          <label>De<input type="date" name="from" value="${helpers.escapeHtml(state.reportsFilters.from)}" /></label>
          <label>Ate<input type="date" name="to" value="${helpers.escapeHtml(state.reportsFilters.to)}" /></label>
          <div class="form-actions-row">
            <button class="primary-button" type="submit">Aplicar periodo</button>
          </div>
        </form>

        <div class="summary-grid">
          ${helpers.renderKpiCard({ label: "Vendas Finalizadas", value: helpers.formatCurrency(snapshot.totalSales), note: `${snapshot.finalizedSalesCount} venda(s) no periodo`, icon: "◨", tone: "green" })}
          ${helpers.renderKpiCard({ label: "Compras", value: helpers.formatCurrency(snapshot.totalPurchases), note: `${snapshot.openPurchasesCount} solicitacao(oes) em aberto`, icon: "◧", tone: "amber" })}
          ${helpers.renderKpiCard({ label: "Producao Concluida", value: snapshot.completedProductionCount, note: `${snapshot.inProgressProductionCount} ordem(ns) em andamento`, icon: "◭", tone: "blue" })}
          ${helpers.renderKpiCard({ label: "Estoque Critico", value: snapshot.criticalStockCount, note: `${snapshot.openServiceOrdersCount} OS abertas`, icon: "◬", tone: "red" })}
        </div>

        <div class="reports-grid">
          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Vendas recentes</h4>
                <p class="muted">Ultimas vendas finalizadas dentro do periodo.</p>
              </div>
            </div>
            ${helpers.renderTable(
              ["Numero", "Cliente", "Total", "Status"],
              snapshot.recentSales.map(({ sale, metadata }) => [
                sale.sale_number || sale.id || "-",
                sale.customer_name || "-",
                helpers.formatCurrency(metadata.total || 0),
                helpers.saleStatusCell(metadata.status || "quote"),
              ])
            )}
          </section>

          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Producao</h4>
                <p class="muted">Ordens planejadas, em andamento e concluidas.</p>
              </div>
            </div>
            ${helpers.renderTable(
              ["Ordem", "Produto", "Quantidade", "Status"],
              snapshot.production.slice(0, 10).map((order) => [
                order.order_number || "-",
                order.product_name || "-",
                helpers.formatQuantity(order.batch_size),
                helpers.statusCell(order.status || "planned"),
              ])
            )}
          </section>

          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Estoque critico</h4>
                <p class="muted">Itens abaixo do minimo para acompanhamento imediato.</p>
              </div>
            </div>
            ${helpers.renderTable(
              ["Produto", "Atual", "Minimo", "Unidade"],
              snapshot.criticalStock.slice(0, 10).map((item) => [
                item.name,
                helpers.formatQuantity(item.current_stock),
                helpers.formatQuantity(item.minimum_stock),
                item.unit || "-",
              ])
            )}
          </section>

          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Ordens de servico abertas</h4>
                <p class="muted">Pendencias operacionais no periodo selecionado.</p>
              </div>
            </div>
            ${helpers.renderTable(
              ["OS", "Cliente", "Responsavel", "Status"],
              snapshot.serviceOrders.map((order) => [
                order.order_number || "-",
                order.customer_name || "-",
                order.responsible_name || "-",
                helpers.statusCell(order.status || "open"),
              ])
            )}
          </section>
        </div>
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    document.querySelector("#reports-filter-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      state.reportsFilters = {
        from: formData.get("from")?.toString() || state.reportsFilters.from,
        to: formData.get("to")?.toString() || state.reportsFilters.to,
      };
      helpers.renderActiveModule();
    });

    document.querySelector("[data-reports-refresh]")?.addEventListener("click", async () => {
      await helpers.loadAllVisibleData();
      helpers.renderActiveModule();
      helpers.showToast("Relatorios atualizados.", "success");
    });

    document.querySelector("[data-reports-export]")?.addEventListener("click", () => {
      const snapshot = helpers.buildReportsSnapshot();
      helpers.openPrintWindowForHtml(helpers.buildReportsExportHtml(snapshot), "Relatorios Gerenciais");
    });
  },
};
