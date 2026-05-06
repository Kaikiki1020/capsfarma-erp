function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

function getInventoryProductLabel(product, helpers) {
  if (!product) return "";
  const code = product.code ? ` (${product.code})` : "";
  return `${product.name}${code} • Estoque ${helpers.formatQuantity(product.current_stock || 0)}`;
}

function renderInventoryProductPickerModal(state, helpers) {
  if (!state.inventoryProductPickerOpen) return "";
  const query = String(state.inventoryProductPickerSearch || "").trim().toLowerCase();
  const products = (state.moduleData.products || []).filter((product) => {
    if (!query) return true;
    return [product.name, product.code, product.sku, product.category, product.product_type, product.description]
      .some((value) => String(value || "").toLowerCase().includes(query));
  });

  return `
    <div class="modal-overlay inventory-modal-overlay" data-inventory-product-picker-backdrop aria-hidden="false">
      <div class="modal-card inventory-product-picker-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-product-picker-title">
        <div class="inventory-modal-head">
          <div>
            <p class="eyebrow muted">Estoque</p>
            <h3 id="inventory-product-picker-title">Selecionar produto</h3>
          </div>
          <button class="icon-inline-button" type="button" data-inventory-close-product-picker aria-label="Fechar">×</button>
        </div>

        <label class="search-input-shell inventory-product-picker-search">
          <span class="search-input-icon">⌕</span>
          <input
            id="inventory-product-picker-search"
            type="text"
            placeholder="Buscar produto por nome, código, categoria ou tipo..."
            value="${helpers.escapeHtml(state.inventoryProductPickerSearch || "")}"
          />
        </label>

        <div class="inventory-product-picker-list">
          ${
            products.length
              ? products.map((product) => `
                <button class="inventory-product-picker-item" type="button" data-inventory-select-product="${helpers.escapeHtml(product.id)}">
                  <strong>${helpers.escapeHtml(product.name || "-")}</strong>
                  <span>${helpers.escapeHtml(product.code || "Sem código")} • ${helpers.escapeHtml(helpers.formatProductTypeLabel(helpers.getProductType(product)))} • Estoque ${helpers.formatQuantity(product.current_stock || 0)}</span>
                </button>
              `).join("")
              : `<div class="empty-state">Nenhum produto encontrado.</div>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderInventoryMovementForm(state, helpers) {
  const products = state.moduleData.products || [];
  const selectedProductId = state.inventoryMovementProductId || "";
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const saleOptions = helpers.normalizeProductSaleOptions(selectedProduct);
  const saleOptionField = saleOptions.length
    ? `
      <label>
        Variação
        <select name="sale_option_id" data-inventory-sale-option-field>
          <option value="">Produto base</option>
          ${saleOptions.map((option) => `
            <option value="${helpers.escapeHtml(option.id)}" ${option.id === state.inventoryMovementSaleOptionId ? "selected" : ""}>
              ${helpers.escapeHtml(`${option.code ? `${option.code} - ` : ""}${option.label} | saldo ${helpers.formatQuantity(option.current_stock)}`)}
            </option>
          `).join("")}
        </select>
      </label>
    `
    : "";

  if (!products.length) {
    return `
      <section class="module-subpanel movement-panel">
        <div class="empty-state">Cadastre ao menos um produto antes de registrar movimentações de estoque.</div>
      </section>
    `;
  }

  return `
    <section class="module-subpanel movement-panel">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">Nova Movimentação</p>
          <h3>Nova Movimentação</h3>
          <p class="muted">Entrada, saída ou ajuste de estoque.</p>
        </div>
      </div>

      <form id="inventory-movement-form" class="inventory-form-grid">
        <div class="form-section">
          <h4>Dados principais</h4>
          <label>
            Produto
            <button class="inventory-product-picker-trigger" type="button" data-inventory-open-product-picker title="Clique duas vezes para selecionar">
              <span>${helpers.escapeHtml(selectedProduct ? getInventoryProductLabel(selectedProduct, helpers) : "Selecione o produto")}</span>
            </button>
            <input name="product_id" type="hidden" data-inventory-product-field required value="${helpers.escapeHtml(selectedProductId)}" />
          </label>
          ${saleOptionField}
          ${helpers.selectField("movement_type", "Tipo", [
            { value: "entry", label: "Entrada" },
            { value: "exit", label: "Saída" },
            { value: "adjustment", label: "Ajuste" },
          ])}
          ${helpers.inputField("quantity", "Quantidade", "number", "0")}
          ${helpers.optionalInputField("machine_serial", "Número de Série")}
        </div>

        <div class="form-section form-section-full">
          <h4>Observação</h4>
          ${helpers.textAreaField("notes", "Observação")}
        </div>

        <div class="form-actions-row form-section-full">
          <button class="ghost-button" type="button" data-inventory-cancel>Voltar</button>
          <button class="primary-button" type="submit">Salvar Movimentação</button>
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
            <p class="eyebrow muted">Movimentações e controle de saldo</p>
            <h3>Estoque</h3>
            <p class="muted">Histórico completo de entradas, saídas e ajustes com atualização automática do saldo.</p>
          </div>
          ${
            canEdit
              ? `<button class="primary-button" type="button" data-inventory-create>Nova Movimentação</button>`
            : ""
        }
        </div>

        <div class="summary-grid">
          ${helpers.renderKpiCard({
            label: "Movimentações",
            value: movements.length,
            note: movements.length ? "Histórico total registrado" : "Nenhuma movimentação registrada",
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
            label: "Saídas",
            value: exitCount,
            note: exitCount ? "Baixas de estoque realizadas" : "Sem saídas registradas",
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
              ? `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
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
                <th>Observação</th>
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
                              ${item.sale_option_label ? `<div class="table-inline-copy">${helpers.escapeHtml(item.sale_option_label)}</div>` : ""}
                              ${helpers.renderInventoryMovementBomDescription(item) || ""}
                              <div class="table-inline-copy muted">${item.sale_option_code || item.product_code || "-"}</div>
                            </td>
                            <td>${helpers.inventoryMovementTypeCell(item.movement_type)}</td>
                            <td>${helpers.formatQuantity(item.quantity)}</td>
                            <td>
                              ${item.notes || "-"}
                              <div class="table-inline-copy muted">Série ${item.machine_serial || "-"} | Lote ${item.batch || "-"}</div>
                            </td>
                            <td>${item.moved_by_name ? helpers.escapeHtml(item.moved_by_name) : "-"}</td>
                            <td>${helpers.formatDateTime(item.created_at)}</td>
                          </tr>
                        `
                      )
                      .join("")
                  : `<tr><td colspan="7"><div class="empty-state">Nenhuma movimentação encontrada.</div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
      ${renderInventoryProductPickerModal(state, helpers)}
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
      state.inventoryMovementProductId = "";
      state.inventoryMovementSaleOptionId = "";
      helpers.renderActiveModule();
    });

    document.querySelector("[data-inventory-open-product-picker]")?.addEventListener("dblclick", () => {
      state.inventoryProductPickerOpen = true;
      state.inventoryProductPickerSearch = "";
      helpers.renderActiveModule();
      setTimeout(() => document.querySelector("#inventory-product-picker-search")?.focus(), 0);
    });

    document.querySelector("[data-inventory-close-product-picker]")?.addEventListener("click", () => {
      state.inventoryProductPickerOpen = false;
      helpers.renderActiveModule();
    });

    document.querySelector("[data-inventory-product-picker-backdrop]")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        state.inventoryProductPickerOpen = false;
        helpers.renderActiveModule();
      }
    });

    helpers.bindDeferredTextFilter("#inventory-product-picker-search", (value) => {
      state.inventoryProductPickerSearch = value;
    });

    document.querySelectorAll("[data-inventory-select-product]").forEach((button) => {
      button.addEventListener("dblclick", () => {
        state.inventoryMovementProductId = button.dataset.inventorySelectProduct || "";
        state.inventoryMovementSaleOptionId = "";
        state.inventoryProductPickerOpen = false;
        state.inventoryProductPickerSearch = "";
        helpers.renderActiveModule();
      });
    });

    const form = document.querySelector("#inventory-movement-form");
    if (form) {
      form.querySelector("[data-inventory-sale-option-field]")?.addEventListener("change", (event) => {
        state.inventoryMovementSaleOptionId = event.currentTarget.value;
      });
      form.addEventListener("submit", helpers.handleInventoryMovementSubmit);
    }
  },
};
