function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`).join(";"))
    .join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("reports", "view")) {
      return helpers.noPermissionTemplate("Seu perfil não possui acesso ao módulo de relatórios.");
    }

    const snapshot = helpers.buildReportsSnapshot();

    return `
      <section class="module-panel">
        <div class="module-head">
          <div>
            <p class="eyebrow muted">Analise gerencial</p>
            <h3>Relatórios</h3>
            <p class="muted">Consolidado operacional de vendas, produção, compras, contas a pagar, estoque e ordens de serviço.</p>
          </div>
          <div class="module-head-actions">
            <button class="ghost-button" type="button" data-reports-refresh>Atualizar</button>
            <button class="ghost-button" type="button" data-reports-export-excel>Exportar Excel</button>
            <button class="primary-button" type="button" data-reports-export>Exportar PDF</button>
          </div>
        </div>

        <form id="reports-filter-form" class="table-actions reports-filter-grid">
          <label>De<input type="date" name="from" value="${helpers.escapeHtml(state.reportsFilters.from)}" /></label>
          <label>Até<input type="date" name="to" value="${helpers.escapeHtml(state.reportsFilters.to)}" /></label>
          <div class="form-actions-row">
            <button class="primary-button" type="submit">Aplicar periodo</button>
          </div>
        </form>

        <div class="summary-grid">
          ${helpers.renderKpiCard({ label: "Vendas Finalizadas", value: helpers.formatCurrency(snapshot.totalSales), note: `${snapshot.finalizedSalesCount} venda(s) no periodo`, icon: "◨", tone: "green" })}
          ${helpers.renderKpiCard({ label: "Compras", value: helpers.formatCurrency(snapshot.totalPurchases), note: `${snapshot.openPurchasesCount} solicitação(oes) em aberto`, icon: "◧", tone: "amber" })}
          ${helpers.renderKpiCard({ label: "Contas a Pagar", value: helpers.formatCurrency(snapshot.totalPayables), note: `${snapshot.pendingPayablesCount} conta(s) pendentes/atrasadas`, icon: "◫", tone: snapshot.pendingPayablesCount ? "red" : "green" })}
          ${helpers.renderKpiCard({ label: "Produção Concluída", value: snapshot.completedProductionCount, note: `${snapshot.inProgressProductionCount} ordem(ns) em andamento`, icon: "◭", tone: "blue" })}
          ${helpers.renderKpiCard({ label: "Pago vs Pendente", value: helpers.formatCurrency(snapshot.paidPayablesTotal), note: `${helpers.formatCurrency(snapshot.totalPayables - snapshot.paidPayablesTotal)} ainda em aberto`, icon: "R$", tone: "blue" })}
        </div>

        <div class="reports-grid">
          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Vendas recentes</h4>
                <p class="muted">Últimas vendas finalizadas dentro do período.</p>
              </div>
            </div>
            ${helpers.renderTable(
              ["Número", "Cliente", "Total", "Status"],
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
                <h4>Produção</h4>
                <p class="muted">Ordens planejadas, em andamento e concluídas.</p>
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
                <p class="muted">Itens abaixo do mínimo para acompanhamento imediato.</p>
              </div>
            </div>
            ${helpers.renderTable(
              ["Produto", "Atual", "Mínimo", "Unidade"],
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
                <h4>Ordens de serviço abertas</h4>
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

          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Contas por fornecedor</h4>
                <p class="muted">Top fornecedores por valor acumulado no periodo.</p>
              </div>
            </div>
            ${helpers.renderTable(
              ["Fornecedor", "Total"],
              Array.from(snapshot.payables.reduce((map, { metadata }) => {
                map.set(metadata.supplier || "-", (map.get(metadata.supplier || "-") || 0) + Number(metadata.amount || 0));
                return map;
              }, new Map()).entries())
                .sort((left, right) => right[1] - left[1])
                .slice(0, 10)
                .map(([supplier, total]) => [supplier, helpers.formatCurrency(total)])
            )}
          </section>

          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Contas por categoria</h4>
                <p class="muted">Distribuicao do contas a pagar por categoria financeira.</p>
              </div>
            </div>
            ${helpers.renderTable(
              ["Categoria", "Total"],
              Array.from(snapshot.payables.reduce((map, { metadata }) => {
                map.set(metadata.category || "-", (map.get(metadata.category || "-") || 0) + Number(metadata.amount || 0));
                return map;
              }, new Map()).entries())
                .sort((left, right) => right[1] - left[1])
                .map(([category, total]) => [category, helpers.formatCurrency(total)])
            )}
          </section>

          <section class="table-card">
            <div class="dashboard-block-header">
              <div>
                <h4>Contas atrasadas</h4>
                <p class="muted">Títulos que exigem atuação imediata.</p>
              </div>
            </div>
            ${helpers.renderTable(
              ["Conta", "Fornecedor", "Valor", "Vencimento"],
              snapshot.payables
                .filter(({ metadata }) => metadata.status === "overdue")
                .slice(0, 10)
                .map(({ payable, metadata }) => [
                  metadata.payable_number || payable.id || "-",
                  metadata.supplier || "-",
                  helpers.formatCurrency(metadata.amount || 0),
                  helpers.formatDate(metadata.due_date || ""),
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
      helpers.showToast("Relatórios atualizados.", "success");
    });

    document.querySelector("[data-reports-export]")?.addEventListener("click", () => {
      const snapshot = helpers.buildReportsSnapshot();
      helpers.openPrintWindowForHtml(helpers.buildReportsExportHtml(snapshot), "Relatórios Gerenciais");
    });

    document.querySelector("[data-reports-export-excel]")?.addEventListener("click", () => {
      const snapshot = helpers.buildReportsSnapshot();
      downloadCsv("relatorio-contas-a-pagar.csv", [
        ["Número", "Descrição", "Fornecedor", "Categoria", "Valor", "Vencimento", "Status", "Tipo"],
        ...snapshot.payables.map(({ payable, metadata }) => [
          metadata.payable_number || payable.id || "-",
          metadata.description || "-",
          metadata.supplier || "-",
          metadata.category || "-",
          Number(metadata.amount || 0).toFixed(2),
          metadata.due_date || "",
          metadata.status || "",
          metadata.account_type || "",
        ]),
      ]);
    });
  },
};
