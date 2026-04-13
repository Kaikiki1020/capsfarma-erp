function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponivel.");
  }
  return bridge;
}

function renderInventoryMovementForm(state, helpers) {
  const productOptions = (state.moduleData.products || []).map((product) => ({
    value: product.id,
    label: `${product.name} (${product.code})`,
  }));

  if (!productOptions.length) {
    return `
      <section class="module-subpanel movement-panel">
        <div class="empty-state">Cadastre ao menos um produto antes de registrar movimentacoes de estoque.</div>
      </section>
    `;
  }

  return `
    <section class="module-subpanel movement-panel">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">Nova Movimentacao</p>
          <h3>Nova Movimentacao</h3>
          <p class="muted">Entrada, saida ou ajuste de estoque.</p>
        </div>
      </div>

      <form id="inventory-movement-form" class="inventory-form-grid">
        <div class="form-section">
          <h4>Dados principais</h4>
          ${helpers.selectField("product_id", "Produto", productOptions)}
          ${helpers.selectField("movement_type", "Tipo", [
            { value: "entry", label: "Entrada" },
            { value: "exit", label: "Saida" },
            { value: "adjustment", label: "Ajuste" },
          ])}
          ${helpers.inputField("quantity", "Quantidade", "number", "0")}
          ${helpers.optionalInputField("machine_serial", "Numero de Serie")}
        </div>

        <div class="form-section form-section-full">
          <h4>Observacao</h4>
          ${helpers.textAreaField("notes", "Observacao")}
        </div>

        <div class="form-actions-row form-section-full">
          <button class="ghost-button" type="button" data-inventory-cancel>Voltar</button>
          <button class="primary-button" type="submit">Salvar Movimentacao</button>
        </div>
      </form>
    </section>
  `;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;
    const canEdit = bridge.hasPermission("inventory", "edit");
    const movements = state.moduleData.inventory || [];
    const entryCount = movements.filter((item) => item.movement_type === "entry").length;
    const exitCount = movements.filter((item) => item.movement_type === "exit").length;
    const adjustmentCount = movements.filter((item) => item.movement_type === "adjustment").length;

    return `
      <section class="module-panel">
        <div class="module-head">
          <div>
            <p class="eyebrow muted">Movimentacoes e controle de saldo</p>
            <h3>Estoque</h3>
            <p class="muted">Historico completo de entradas, saidas e ajustes com atualizacao automatica do saldo.</p>
          </div>
          ${
            canEdit
              ? `<button class="primary-button" type="button" data-inventory-create>Nova Movimentacao</button>`
              : ""
          }
        </div>

        <div class="summary-grid">
          ${helpers.renderKpiCard({
            label: "Movimentacoes",
            value: movements.length,
            note: movements.length ? "Historico total registrado" : "Nenhuma movimentacao registrada",
            icon: "◬",
            tone: "blue",
          })}
          ${helpers.renderKpiCard({
            label: "Entradas",
            value: entryCount,
            note: entryCount ? "Reposicoes e recebimentos" : "Sem entradas registradas",
            icon: "↗",
            tone: "green",
          })}
          ${helpers.renderKpiCard({
            label: "Saidas",
            value: exitCount,
            note: exitCount ? "Baixas de estoque realizadas" : "Sem saidas registradas",
            icon: "↘",
            tone: "red",
          })}
          ${helpers.renderKpiCard({
            label: "Ajustes",
            value: adjustmentCount,
            note: adjustmentCount ? "Correcoes manuais aplicadas" : "Sem ajustes realizados",
            icon: "≋",
            tone: "amber",
          })}
        </div>

        ${
          state.inventoryFormVisible && canEdit
            ? renderInventoryMovementForm(state, helpers)
            : !canEdit
              ? `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
              : ""
        }

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Observacao</th>
                <th>Movimentado por</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              ${
                movements.length
                  ? movements
                      .map(
                        (item) => `
                          <tr>
                            <td>${helpers.formatShortId(item.id)}</td>
                            <td>
                              <strong>${item.product_name}</strong>
                              <div class="table-inline-copy muted">${item.product_code || "-"}</div>
                            </td>
                            <td>${helpers.inventoryMovementTypeCell(item.movement_type)}</td>
                            <td>${helpers.formatQuantity(item.quantity)}</td>
                            <td>
                              ${item.notes || "-"}
                              <div class="table-inline-copy muted">Serie ${item.machine_serial || "-"} | Lote ${item.batch || "-"}</div>
                            </td>
                            <td>${item.moved_by_name ? helpers.escapeHtml(item.moved_by_name) : "-"}</td>
                            <td>${helpers.formatDateTime(item.created_at)}</td>
                          </tr>
                        `
                      )
                      .join("")
                  : `<tr><td colspan="7"><div class="empty-state">Nenhuma movimentacao encontrada.</div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    document.querySelector("[data-inventory-create]")?.addEventListener("click", async () => {
      state.inventoryFormVisible = true;
      await helpers.renderActiveModule();
      document.querySelector("#inventory-movement-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.querySelector("[data-inventory-cancel]")?.addEventListener("click", () => {
      state.inventoryFormVisible = false;
      helpers.renderActiveModule();
    });

    document.querySelector("#inventory-movement-form")?.addEventListener("submit", helpers.handleInventoryMovementSubmit);
  },
};
