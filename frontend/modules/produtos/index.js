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
      hasPermission,
      helpers: {
        noPermissionTemplate,
        renderKpiCard,
        renderProductForm,
        renderProductMovementPanel,
        escapeHtml,
        formatShortId,
        productStatusCell,
        productCategoryCell,
        productStockCell,
        renderLastMovementUserCell,
        productActionCell,
      },
    } = bridge;

    if (!hasPermission("products", "view")) {
      return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de produtos.");
    }

    const canEdit = hasPermission("products", "edit");
    const products = state.moduleData.products || [];
    const searchTerm = state.productSearch.trim().toLowerCase();
    const filteredProducts = products.filter((item) => {
      const matchesSearch = !searchTerm
        || [item.code, item.name, item.supplier, item.location, item.batch]
          .some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesCategory = state.productCategoryFilter === "all" || item.category === state.productCategoryFilter;
      return matchesSearch && matchesCategory;
    });
    const activeProducts = products.filter((item) => item.status === "active").length;
    const lowStockItems = products.filter((item) => Number(item.current_stock) <= Number(item.minimum_stock));
    const finishedProducts = products.filter((item) => item.category === "finished_product").length;
    const movementProduct = products.find((item) => item.id === state.productMovementId);
    const categoryOptions = [
      { value: "all", label: "Todas categorias" },
      { value: "raw_material", label: "Materia-prima" },
      { value: "finished_product", label: "Produto acabado" },
      { value: "packaging", label: "Embalagem" },
      { value: "consumable", label: "Insumo" },
    ];

    return `
      <section class="module-panel">
        <div class="module-head">
          <div>
            <p class="eyebrow muted">Cadastro mestre</p>
            <h3>Cadastro de Produtos</h3>
            <p class="muted">Itens integrados a estoque, producao, compras e vendas em um unico cadastro.</p>
          </div>
          <div class="module-head-actions">
            <button class="ghost-button secondary-surface-button" type="button" data-product-view-inventory>Ver Estoque</button>
            ${canEdit ? `<button class="primary-button" type="button" data-product-create>Novo Produto</button>` : ""}
          </div>
        </div>

        <div class="summary-grid">
          ${renderKpiCard({
            label: "Produtos Cadastrados",
            value: products.length,
            note: activeProducts ? `${activeProducts} ativo(s) no catalogo` : "Nenhum produto ativo cadastrado",
            icon: "◪",
            tone: "blue",
          })}
          ${renderKpiCard({
            label: "Produtos Ativos",
            value: activeProducts,
            note: activeProducts ? "Itens prontos para uso operacional" : "Nenhum item ativo",
            icon: "◎",
            tone: "green",
          })}
          ${renderKpiCard({
            label: "Estoque Baixo",
            value: lowStockItems.length,
            note: lowStockItems.length ? "Itens abaixo do minimo configurado" : "Sem alerta de estoque minimo",
            icon: "◩",
            tone: "red",
          })}
          ${renderKpiCard({
            label: "Acabados",
            value: finishedProducts,
            note: finishedProducts ? "Produtos finais cadastrados" : "Nenhum produto acabado",
            icon: "◧",
            tone: "amber",
          })}
        </div>

        ${
          canEdit
            ? state.productFormVisible
              ? renderProductForm()
              : ""
            : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
        }
        ${movementProduct && canEdit ? renderProductMovementPanel(movementProduct) : ""}

        <div class="table-actions product-filters-row">
          <label>
            Buscar produto...
            <input id="product-search-input" type="text" placeholder="Buscar produto..." value="${escapeHtml(state.productSearch)}" />
          </label>
          <label>
            Todas categorias
            <select id="product-category-filter">
              ${categoryOptions
                .map(
                  (option) =>
                    `<option value="${option.value}" ${option.value === state.productCategoryFilter ? "selected" : ""}>${option.label}</option>`
                )
                .join("")}
            </select>
          </label>
        </div>

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Codigo</th>
                <th>Nome</th>
                <th>Status</th>
                <th>Categoria</th>
                <th>Unidade</th>
                <th>Estoque Atual</th>
                <th>Lote</th>
                <th>Serie da Maquina</th>
                <th>Ultimo Movimentador</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredProducts.length
                  ? filteredProducts
                      .map(
                        (item) => `
                          <tr>
                            <td>${formatShortId(item.id)}</td>
                            <td>${item.code}</td>
                            <td>
                              <strong>${item.name}</strong>
                              <div class="table-inline-copy muted">${item.location || "Sem localizacao"}</div>
                            </td>
                            <td>${productStatusCell(item.status)}</td>
                            <td>${productCategoryCell(item.category)}</td>
                            <td>${item.unit}</td>
                            <td>${productStockCell(item)}</td>
                            <td>${item.batch || "-"}</td>
                            <td>${item.machine_serial || "-"}</td>
                            <td>${renderLastMovementUserCell(item)}</td>
                            <td>${productActionCell(item, canEdit)}</td>
                          </tr>
                        `
                      )
                      .join("")
                  : `<tr><td colspan="11"><div class="empty-state">Nenhum produto encontrado</div></td></tr>`
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
    const {
      resetProductModuleState,
      renderActiveModule,
      renderModuleNav,
      bindDeferredTextFilter,
      bindDeferredSelectFilter,
      handleProductSubmit,
      resetProductForm,
      populateForm,
      bindCurrencyInputs,
      isProductLinkedDeleteError,
      loadTable,
      queueSystemLog,
      showToast,
      handleProductMovementSubmit,
      formatError,
    } = bridge.helpers;

    const createButton = document.querySelector("[data-product-create]");
    if (createButton) {
      createButton.addEventListener("click", () => {
        const shouldOpen = !state.productFormVisible;
        resetProductModuleState();
        state.productFormVisible = shouldOpen;
        renderActiveModule();
        if (shouldOpen) {
          document.querySelector("#products-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    const inventoryButton = document.querySelector("[data-product-view-inventory]");
    if (inventoryButton) {
      inventoryButton.addEventListener("click", async () => {
        state.activeModule = "inventory";
        renderModuleNav();
        await bridge.loadModuleData("inventory");
        renderActiveModule();
      });
    }

    bindDeferredTextFilter("#product-search-input", (value) => {
      state.productSearch = value;
    });

    bindDeferredSelectFilter("#product-category-filter", (value) => {
      state.productCategoryFilter = value;
    });

    const productForm = document.querySelector("#products-form");
    if (productForm) {
      productForm.addEventListener("submit", handleProductSubmit);
    }

    const cancelButton = document.querySelector("[data-product-cancel]");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        resetProductForm(productForm);
        state.productFormMode = "create";
        state.productFormVisible = false;
        renderActiveModule();
      });
    }

    document.querySelectorAll("[data-product-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const product = state.moduleData.products.find((item) => item.id === button.dataset.productEditId);
        if (!product) return;

        state.productFormMode = "edit";
        state.productFormVisible = true;
        state.productMovementId = null;
        await renderActiveModule();

        const editForm = document.querySelector("#products-form");
        if (!editForm) return;

        populateForm(editForm, product);
        bindCurrencyInputs(editForm);
        editForm.elements.namedItem("edit_id").value = product.id;
        editForm.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-product-delete-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const { error } = await state.supabase.from("products").delete().eq("id", button.dataset.productDeleteId);
          if (error) {
            if (!isProductLinkedDeleteError(error)) {
              throw error;
            }

            const { error: updateError } = await state.supabase
              .from("products")
              .update({ status: "inactive" })
              .eq("id", button.dataset.productDeleteId);
            if (updateError) throw updateError;

            resetProductModuleState();
            await loadTable("products", "products");
            await renderActiveModule();
            void queueSystemLog({
              moduleKey: "products",
              action: "mudanca_status",
              level: "Atencao",
              itemAffected: button.dataset.productDeleteId,
              description: "Produto inativado por possuir historico vinculado.",
              entityType: "product",
              entityId: button.dataset.productDeleteId,
            });
            showToast("Produto possui historico vinculado e foi inativado em vez de excluido.", "warning");
            return;
          }

          resetProductModuleState();
          await loadTable("products", "products");
          await renderActiveModule();
          void queueSystemLog({
            moduleKey: "products",
            action: "exclusao",
            level: "Critico",
            itemAffected: button.dataset.productDeleteId,
            description: "Produto excluido do cadastro.",
            entityType: "product",
            entityId: button.dataset.productDeleteId,
          });
          showToast("Produto excluido.", "success");
        } catch (error) {
          showToast(formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-product-move-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        state.productMovementId = state.productMovementId === button.dataset.productMoveId ? null : button.dataset.productMoveId;
        await renderActiveModule();
        document.querySelector("#product-movement-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    const movementForm = document.querySelector("#product-movement-form");
    if (movementForm) {
      movementForm.addEventListener("submit", handleProductMovementSubmit);
    }

    const closeMovementButton = document.querySelector("[data-product-movement-cancel]");
    if (closeMovementButton) {
      closeMovementButton.addEventListener("click", () => {
        state.productMovementId = null;
        renderActiveModule();
      });
    }
  },
};
