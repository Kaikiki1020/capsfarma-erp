function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

function buildDuplicateTextValue(value, existingValues, joiner = "-COPIA") {
  const baseValue = String(value || "").trim() || "ITEM";
  const normalizedExisting = new Set((existingValues || []).map((item) => String(item || "").trim().toLowerCase()));
  let candidate = `${baseValue}${joiner}`;
  let counter = 2;
  while (normalizedExisting.has(candidate.trim().toLowerCase())) {
    candidate = `${baseValue}${joiner}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function buildDuplicateBomMaterialDraft(material, materials) {
  const allMaterials = Array.isArray(materials) ? materials : [];
  return {
    ...material,
    code: buildDuplicateTextValue(material.code, allMaterials.map((item) => item.code), "-COPIA"),
    name: buildDuplicateTextValue(material.name, allMaterials.map((item) => item.name), " (Cópia)"),
    current_stock: 0,
  };
}

function renderBomMaterialActionCell(item, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  return `
    <div class="action-button-group">
      <button class="inline-button" type="button" data-bom-material-edit-id="${item.id}">Editar</button>
      <button class="inline-button" type="button" data-bom-material-duplicate-id="${item.id}">Duplicar</button>
      <button class="inline-button danger-button" type="button" data-delete-table="bom_materials" data-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function getBomFinalProductOptions(state) {
  const activeProducts = (state.moduleData.products || []).filter((product) => product.status !== "inactive");
  const products = activeProducts.filter((product) => getBridge().helpers.getProductType(product) === "finished_product");

  return products.map((product) => ({
    value: product.id,
    code: product.code || "",
    name: product.name || "",
    category: product.category || "",
    label: `${product.name || "Produto"} (${product.code || "sem código"})`,
  }));
}

function renderBomProductPickerField({ name, label, value, displayValue, required = false, target }) {
  return `
    <label>
      ${label}${required ? " *" : ""}
      <input data-bom-structure-field="${name}" name="${name}" type="hidden" value="${value || ""}" ${required ? "required" : ""} />
      <span class="input-action-shell">
        <input type="text" readonly value="${displayValue || ""}" placeholder="Clique para buscar" data-bom-open-product-picker="${target}" />
      </span>
    </label>
  `;
}

function openBomFinalProductPicker({ state, helpers, onSelect }) {
  const existing = document.querySelector("[data-bom-product-picker-overlay]");
  if (existing) existing.remove();

  const products = getBomFinalProductOptions(state);
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay sales-document-modal-overlay";
  overlay.setAttribute("data-bom-product-picker-overlay", "true");
  overlay.innerHTML = `
    <div class="modal-card sales-document-modal" role="dialog" aria-modal="true" aria-label="Selecionar produto final">
      <div class="sales-config-header">
        <div>
          <p class="eyebrow muted">Conjunto BOM</p>
          <h3>Selecionar Produto Final</h3>
          <p class="muted">Pesquise pelo nome ou código do produto final.</p>
        </div>
        <div class="sales-config-header-actions">
          <button class="ghost-button" type="button" data-bom-product-picker-close>Fechar</button>
        </div>
      </div>
      <div class="table-actions">
        <label class="search-input-shell">
          <span class="search-input-icon">⌕</span>
          <input type="text" placeholder="Buscar produto final..." data-bom-product-picker-search />
        </label>
      </div>
      <div class="table-card" style="max-height: 55vh; overflow: auto;">
        <div data-bom-product-picker-results></div>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  const results = overlay.querySelector("[data-bom-product-picker-results]");
  const searchInput = overlay.querySelector("[data-bom-product-picker-search]");

  const renderResults = (term = "") => {
    const normalized = String(term || "").trim().toLowerCase();
    const filtered = !normalized
      ? products
      : products.filter((product) =>
        product.name.toLowerCase().includes(normalized)
        || product.code.toLowerCase().includes(normalized)
      );

    results.innerHTML = filtered.length
      ? filtered.map((product) => `
          <button class="bom-file-card" type="button" data-bom-product-picker-select="${helpers.escapeHtml(product.value)}" style="width:100%; text-align:left; cursor:pointer;">
            <div>
              <strong>${helpers.escapeHtml(product.label)}</strong>
              <div class="table-inline-copy muted">Produto final</div>
            </div>
          </button>
        `).join("")
      : `<div class="empty-state">Nenhum produto final encontrado.</div>`;

    results.querySelectorAll("[data-bom-product-picker-select]").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = products.find((product) => product.value === button.dataset.bomProductPickerSelect);
        if (!selected) return;
        onSelect(selected);
        close();
      });
    });
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.hasAttribute("data-bom-product-picker-close")) {
      close();
    }
  });

  searchInput?.addEventListener("input", () => renderResults(searchInput.value));
  document.body.appendChild(overlay);
  renderResults("");
  searchInput?.focus();
}

function openBomComponentPicker({ state, helpers, index, onSelect }) {
  const existing = document.querySelector("[data-bom-component-picker-overlay]");
  if (existing) existing.remove();

  const components = helpers.buildBomComponentOptions().map((option) => {
    const [type] = String(option.value || "").split(":");
    return {
      value: option.value,
      label: option.label,
      type,
      typeLabel: type === "product" ? "Produto" : type === "material" ? "Material" : "Conjunto",
    };
  });
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay sales-document-modal-overlay";
  overlay.setAttribute("data-bom-component-picker-overlay", "true");
  overlay.innerHTML = `
    <div class="modal-card sales-document-modal" role="dialog" aria-modal="true" aria-label="Selecionar item do conjunto">
      <div class="sales-config-header">
        <div>
          <p class="eyebrow muted">Itens do Conjunto</p>
          <h3>Selecionar Item</h3>
          <p class="muted">Pesquise produtos, peças, materiais ou subconjuntos.</p>
        </div>
        <div class="sales-config-header-actions">
          <button class="ghost-button" type="button" data-bom-component-picker-close>Fechar</button>
        </div>
      </div>
      <div class="table-actions">
        <label class="search-input-shell">
          <span class="search-input-icon">⌕</span>
          <input type="text" placeholder="Buscar item..." data-bom-component-picker-search />
        </label>
      </div>
      <div class="table-card" style="max-height: 55vh; overflow: auto;">
        <div data-bom-component-picker-results></div>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  const results = overlay.querySelector("[data-bom-component-picker-results]");
  const searchInput = overlay.querySelector("[data-bom-component-picker-search]");

  const renderResults = (term = "") => {
    const normalized = String(term || "").trim().toLowerCase();
    const filtered = !normalized
      ? components
      : components.filter((component) =>
        component.label.toLowerCase().includes(normalized)
        || component.typeLabel.toLowerCase().includes(normalized)
      );

    results.innerHTML = filtered.length
      ? filtered.map((component) => `
          <button class="bom-file-card" type="button" data-bom-component-picker-select="${helpers.escapeHtml(component.value)}" style="width:100%; text-align:left; cursor:pointer;">
            <div>
              <strong>${helpers.escapeHtml(component.label)}</strong>
              <div class="table-inline-copy muted">${helpers.escapeHtml(component.typeLabel)}</div>
            </div>
          </button>
        `).join("")
      : `<div class="empty-state">Nenhum item encontrado.</div>`;

    results.querySelectorAll("[data-bom-component-picker-select]").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = components.find((component) => component.value === button.dataset.bomComponentPickerSelect);
        if (!selected) return;
        onSelect(selected, index);
        close();
      });
    });
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.hasAttribute("data-bom-component-picker-close")) {
      close();
    }
  });

  searchInput?.addEventListener("input", () => renderResults(searchInput.value));
  document.body.appendChild(overlay);
  renderResults("");
  searchInput?.focus();
}

function renderBomMaterialsForm(helpers) {
  const bomCategorySuggestions = helpers.buildBomMaterialCategoryOptions()
    .filter((option) => option.value !== "all")
    .map((option) => `<option value="${helpers.escapeHtml(option.value)}">${helpers.escapeHtml(option.label)}</option>`)
    .join("");

  return `
    <section class="module-subpanel">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">Nova Peça / Material</p>
          <h3>Peças / Materiais</h3>
        </div>
      </div>

      <form id="bom-material-form" class="products-form-grid">
        <input type="hidden" name="edit_id" />
        <div class="form-section form-section-full">
          <h4>Dados principais</h4>
          <div class="product-form-row">
            ${helpers.inputField("code", "Código")}
            ${helpers.inputField("name", "Nome")}
            <label>
              Categoria
              <input name="category" list="bom-material-category-suggestions" placeholder="Ex.: Componente" required />
              <datalist id="bom-material-category-suggestions">${bomCategorySuggestions}</datalist>
            </label>
            ${helpers.inputField("unit", "Unidade", "text", "un")}
          </div>
          ${helpers.optionalTextAreaField("description", "Descrição")}
        </div>

        <div class="form-section form-section-full">
          <h4>Custos e estoque</h4>
          <div class="product-form-row">
            ${helpers.currencyInputField("unit_cost", "Custo Unitário")}
            ${helpers.optionalInputField("supplier", "Fornecedor")}
            ${helpers.inputField("current_stock", "Estoque Atual", "number", "0")}
            ${helpers.inputField("minimum_stock", "Estoque Mínimo", "number", "0")}
          </div>
          <div class="product-form-row">
            ${helpers.selectField("status", "Status", [
              { value: "active", label: "Ativo" },
              { value: "inactive", label: "Inativo" },
            ])}
          </div>
        </div>

        <div class="form-actions-row form-section-full">
          <button class="ghost-button secondary-surface-button" type="button" data-bom-material-cancel>Cancelar</button>
          <button class="primary-button" type="submit">Salvar</button>
        </div>
      </form>
    </section>
  `;
}

function renderBomDraftItemRow(item, index, helpers) {
  const variationOptions = helpers.getBomDraftItemVariationOptions(item);
  const variationField = variationOptions.length
    ? `
      <label>
        Variação
        <select id="bom-item-${index}-sale-option" data-bom-item-field="saleOptionId" data-bom-item-index="${index}">
          <option value="">Sem variação</option>
          ${variationOptions.map((option) => `
            <option value="${helpers.escapeHtml(option.value)}" ${option.value === item.saleOptionId ? "selected" : ""}>
              ${helpers.escapeHtml(option.label)}
            </option>
          `).join("")}
        </select>
      </label>
    `
    : "";
  const productionSections = helpers.getBomFinalProductProductionSections();
  const sectionField = productionSections.length
    ? `
      <label>
        Sessão interna
        <select id="bom-item-${index}-section" data-bom-item-field="productionSectionId" data-bom-item-index="${index}">
          <option value="">Sem sessão</option>
          ${productionSections.map((section) => `
            <option value="${helpers.escapeHtml(section.id)}" ${section.id === item.productionSectionId ? "selected" : ""}>
              ${helpers.escapeHtml(section.label)}
            </option>
          `).join("")}
        </select>
      </label>
    `
    : "";
  const details = helpers.getBomDraftItemComputed(item);
  const selectedItemLabel = details.component
    ? `${details.component.name} (${details.component.code || "sem código"})`
    : "";

  return `
    <div class="bom-item-row">
      <label>
        Item selecionado
        <input id="bom-item-${index}-source" data-bom-item-field="sourceKey" data-bom-item-index="${index}" type="hidden" value="${helpers.escapeHtml(item.sourceKey || "")}" />
        <span class="input-action-shell">
          <input type="text" readonly value="${helpers.escapeHtml(selectedItemLabel)}" placeholder="Clique para buscar o item" data-bom-open-component-picker="${index}" />
        </span>
      </label>
      ${variationField}
      ${sectionField}
      <label>
        Quantidade
        <input id="bom-item-${index}-quantity" data-bom-item-field="quantity" data-bom-item-index="${index}" type="number" min="1" step="1" value="${item.quantity}" />
      </label>
      <label>
        Custo unitário
        <input id="bom-item-${index}-unit-cost" data-bom-item-field="unitCost" data-bom-item-index="${index}" type="number" min="0" step="0.01" value="${helpers.escapeHtml(details.unitCost)}" />
      </label>
      <label>
        Custo total
        <input type="text" value="${helpers.formatCurrency(details.totalCost)}" readonly />
      </label>
      <button class="inline-button danger-button" type="button" data-bom-remove-item="${index}">Remover</button>
    </div>
  `;
}

function renderBomAttachmentPreviews(state, helpers) {
  if (!state.bomAttachmentDrafts.length) {
    return `<div class="empty-state compact-empty">Nenhum arquivo selecionado.</div>`;
  }

  return state.bomAttachmentDrafts
    .map(
      (file, index) => `
        <article class="bom-file-card">
          <div>
            <strong>${helpers.escapeHtml(file.name)}</strong>
            <div class="table-inline-copy muted">${helpers.formatFileSize(file.size)} • ${file.type || "arquivo"}</div>
          </div>
          ${
            file.previewUrl && file.type.startsWith("image/")
              ? `<img class="bom-file-preview" src="${file.previewUrl}" alt="${helpers.escapeHtml(file.name)}" />`
              : `<div class="bom-file-placeholder">${helpers.getFileExtensionLabel(file.name)}</div>`
          }
          <button class="inline-button danger-button" type="button" data-bom-remove-file="${index}">Remover</button>
        </article>
      `
    )
    .join("");
}

function renderBomStructuresForm(state, totalStructureCost, helpers) {
  const draft = state.bomStructureDraft;
  const productOptions = getBomFinalProductOptions(state);
  const selectedProduct = (state.moduleData.products || []).find((product) => product.id === draft.product_id);
  const selectedProductLabel = selectedProduct ? `${selectedProduct.name || "Produto"} (${selectedProduct.code || "sem código"})` : "";
  const finalProductVariationOptions = helpers.getBomFinalProductVariationOptions();
  const finalProductVariationField = finalProductVariationOptions.length
    ? `
      <label>
        Variação do produto final
        <select data-bom-structure-field="sale_option_id" name="sale_option_id">
          <option value="">Sem variação</option>
          ${finalProductVariationOptions.map((option) => `
            <option value="${helpers.escapeHtml(option.value)}" ${option.value === draft.sale_option_id ? "selected" : ""}>
              ${helpers.escapeHtml(option.label)}
            </option>
          `).join("")}
        </select>
      </label>
    `
    : "";
  const componentOptions = helpers.buildBomComponentOptions();

  if (!productOptions.length) {
    return `
      <section class="module-subpanel">
        <div class="empty-state">Cadastre ao menos um produto no módulo Produtos para criar um conjunto BOM.</div>
      </section>
    `;
  }

  if (!componentOptions.length) {
    return `
      <section class="module-subpanel">
        <div class="empty-state">Cadastre ao menos um produto, peça/material ou conjunto ativo antes de montar um conjunto BOM.</div>
      </section>
    `;
  }

  return `
    <section class="module-subpanel">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">${draft.edit_id ? "Editar Conjunto (BOM)" : "Novo Conjunto (BOM)"}</p>
          <h3>Conjuntos</h3>
        </div>
      </div>

      <form id="bom-structure-form" class="products-form-grid">
        <input type="hidden" name="edit_id" value="${helpers.escapeHtml(draft.edit_id)}" />
        <div class="form-section form-section-full">
          <h4>Dados principais</h4>
          <div class="product-form-row">
            ${renderBomProductPickerField({
              name: "product_id",
              label: "Produto final",
              value: helpers.escapeHtml(draft.product_id || ""),
              displayValue: helpers.escapeHtml(selectedProductLabel),
              required: true,
              target: "final",
            })}
            ${finalProductVariationField}
            ${helpers.draftInputField("version", "Versao", draft.version, "text", "1.0", false, true)}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Produção</h4>
          <div class="product-form-row">
            ${helpers.draftInputField("category", "Categoria do BOM", draft.category, "text", "Ex.: Linha, Família, Cliente")}
            ${helpers.draftInputField("batch_size", "Tamanho do lote", draft.batch_size, "number", "1", false, true)}
            ${helpers.draftInputField("batch_unit", "Unidade do lote", draft.batch_unit, "text", "un", false, true)}
            ${helpers.draftSelectField("status", "Status", draft.status, [
              { value: "draft", label: "Rascunho" },
              { value: "active", label: "Ativo" },
            ], true)}
          </div>
        </div>

        <div class="form-section form-section-full">
          <div class="module-head compact-head">
            <div>
              <h4>Itens do Conjunto</h4>
            </div>
            <button class="secondary-button" type="button" data-bom-add-item>+ Adicionar peça</button>
          </div>
          <div class="bom-items-list">
            ${state.bomDraftItems.map((item, index) => renderBomDraftItemRow(item, index, helpers)).join("")}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Custos</h4>
          <div class="cost-display-card">
            <span class="muted">Custo Total do Conjunto</span>
            <strong>${helpers.formatCurrency(totalStructureCost)}</strong>
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Instruções de Produção</h4>
          ${helpers.draftTextAreaField("instructions", "Instruções de produção", draft.instructions)}
          <div class="product-form-row">
            ${helpers.draftInputField("height", "Altura", draft.height, "number", "0")}
            ${helpers.draftInputField("width", "Largura", draft.width, "number", "0")}
            ${helpers.draftInputField("length", "Comprimento", draft.length, "number", "0")}
            ${helpers.draftInputField("weight", "Peso", draft.weight, "number", "0")}
          </div>
          <div class="bom-upload-panel">
            <label>
              Upload de arquivos
              <input id="bom-file-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
            </label>
            <div class="bom-upload-list">
              ${renderBomAttachmentPreviews(state, helpers)}
            </div>
          </div>
          ${helpers.draftTextAreaField("notes", "Observações", draft.notes)}
        </div>

        <div class="form-actions-row form-section-full bom-form-actions">
          <button class="ghost-button secondary-surface-button" type="button" data-bom-structure-cancel>Cancelar</button>
          <button class="primary-button" type="submit">Salvar</button>
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
    const canEdit = bridge.hasPermission("bom", "edit");
    const materials = state.moduleData.bomMaterials || [];
    const structures = state.moduleData.bomStructures || [];
    const structureTerm = String(state.bomStructureSearch || "").trim().toLowerCase();
    const filteredMaterials = materials.filter((item) => {
      const term = state.bomMaterialSearch.trim().toLowerCase();
      if (!term) return true;
      return [item.code, item.name, item.description, item.category, item.supplier].some((value) =>
        String(value || "").toLowerCase().includes(term)
      );
    });
    const filteredStructures = structures.filter((item) => {
      if (!structureTerm) return true;
      return [item.code, item.name, item.category, item.version, item.product_name, item.product_code, item.instructions].some((value) =>
        String(value || "").toLowerCase().includes(structureTerm)
      );
    });
    const totalStructureCost = helpers.calculateBomDraftTotal();

    return `
      <section class="module-panel">
        <div class="module-head">
          <div>
            <p class="eyebrow muted">Bill of Materials</p>
            <h3>BOM - Estrutura de Produtos</h3>
            <p class="muted">Receita industrial com materiais base, subconjuntos e custo consolidado por versão.</p>
          </div>
          <div class="module-head-actions">
            ${
              canEdit && state.bomTab === "materials"
                ? `<button class="primary-button" type="button" data-bom-material-create>Nova Peça/Material</button>`
                : ""
            }
            ${
              canEdit && state.bomTab === "structures"
                ? `<button class="primary-button" type="button" data-bom-structure-create>Novo Conjunto</button>`
                : ""
            }
          </div>
        </div>

        <div class="summary-grid">
          ${helpers.renderKpiCard({
            label: "Peças e Materiais",
            value: materials.length,
            note: materials.length ? "Base técnica cadastrada" : "Nenhum item cadastrado",
            icon: "⊞",
            tone: "blue",
          })}
          ${helpers.renderKpiCard({
            label: "Conjuntos BOM",
            value: structures.length,
            note: structures.length ? "Estruturas de produto final" : "Nenhum conjunto cadastrado",
            icon: "◫",
            tone: "green",
          })}
          ${helpers.renderKpiCard({
            label: "Rascunhos",
            value: structures.filter((item) => item.status === "draft").length,
            note: "Edicao liberada antes da ativação",
            icon: "◩",
            tone: "amber",
          })}
        </div>

        <div class="bom-tabs">
          <button class="bom-tab-button ${state.bomTab === "materials" ? "active" : ""}" type="button" data-bom-tab="materials">Peças / Materiais</button>
          <button class="bom-tab-button ${state.bomTab === "structures" ? "active" : ""}" type="button" data-bom-tab="structures">Conjuntos (BOM)</button>
        </div>

        ${
          state.bomTab === "materials"
            ? `
              ${
                canEdit
                  ? state.bomMaterialFormVisible
                    ? renderBomMaterialsForm(helpers)
                    : ""
                  : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
              }
              <section class="module-subpanel">
                <div class="module-head compact-head">
                  <div>
                    <p class="eyebrow muted">Consulta</p>
                    <h3>Peças cadastradas</h3>
                  </div>
                </div>
                <div class="table-actions single-search-row">
                  <label>
                    Buscar peças...
                    <input id="bom-material-search" type="text" placeholder="Buscar peças..." value="${helpers.escapeHtml(state.bomMaterialSearch)}" />
                  </label>
                </div>
                ${helpers.renderTable(
                  ["Código", "Nome", "Descrição", "Categoria", "Unidade", "Custo", "Fornecedor", "Estoque", "Mínimo", "Status", "Ação"],
                  filteredMaterials.map((item) => [
                    item.code,
                    item.name,
                    item.description || "-",
                    helpers.formatBomCategory(item.category),
                    item.unit,
                    helpers.formatCurrency(item.unit_cost),
                    item.supplier || "-",
                    helpers.formatQuantity(item.current_stock),
                    helpers.formatQuantity(item.minimum_stock),
                    helpers.materialStatusCell(item.status),
                    renderBomMaterialActionCell(item, canEdit),
                  ])
                )}
              </section>
            `
            : `
              ${
                canEdit
                  ? state.bomStructureFormVisible
                    ? renderBomStructuresForm(state, totalStructureCost, helpers)
                    : ""
                  : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
              }
              <section class="module-subpanel">
                <div class="module-head compact-head">
                  <div>
                    <p class="eyebrow muted">Estruturas ativas e rascunhos</p>
                    <h3>Conjuntos BOM</h3>
                  </div>
                </div>
                <div class="table-actions single-search-row">
                  <label>
                    Buscar conjunto...
                    <input id="bom-structure-search" type="text" placeholder="Buscar conjunto..." value="${helpers.escapeHtml(state.bomStructureSearch || "")}" />
                  </label>
                </div>
                ${helpers.renderTable(
                  ["Código", "Nome", "Categoria", "Versao", "Lote", "Status", "Custo Total", "Itens", "Instruções", "Ação"],
                  filteredStructures.map((item) => [
                    item.code,
                    item.name,
                    helpers.formatBomCategory(item.category),
                    item.version,
                    `${helpers.formatQuantity(item.batch_size)} ${item.batch_unit}`,
                    helpers.bomStructureStatusCell(item.status),
                    helpers.formatCurrency(item.total_cost),
                    helpers.renderBomStructureItemsSummary(item),
                    item.instructions || "-",
                    helpers.bomStructureActionCell(item, canEdit),
                  ])
                )}
              </section>
            `
        }
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    document.querySelectorAll("[data-bom-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextTab = button.dataset.bomTab;
        state.bomTab = nextTab;
        if (nextTab === "materials") {
          state.bomStructureFormVisible = false;
        }
        if (nextTab === "structures") {
          state.bomMaterialFormVisible = false;
        }
        helpers.renderActiveModule();
      });
    });

    document.querySelector("[data-bom-material-create]")?.addEventListener("click", async () => {
      const shouldOpen = !state.bomMaterialFormVisible;
      state.bomTab = "materials";
      state.bomStructureFormVisible = false;
      state.bomMaterialFormVisible = shouldOpen;
      await helpers.renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#bom-material-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    document.querySelector("[data-bom-structure-create]")?.addEventListener("click", async () => {
      const shouldOpen = !state.bomStructureFormVisible;
      state.bomTab = "structures";
      state.bomMaterialFormVisible = false;
      if (shouldOpen) {
        helpers.resetBomStructureDraft();
      }
      state.bomStructureFormVisible = shouldOpen;
      await helpers.renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#bom-structure-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    helpers.bindDeferredTextFilter("#bom-material-search", (value) => {
      state.bomMaterialSearch = value;
    });
    helpers.bindDeferredTextFilter("#bom-structure-search", (value) => {
      state.bomStructureSearch = value;
    });

    document.querySelector("#bom-material-form")?.addEventListener("submit", helpers.handleBomMaterialSubmit);

    const materialForm = document.querySelector("#bom-material-form");
    document.querySelector("[data-bom-material-cancel]")?.addEventListener("click", () => {
      materialForm?.reset();
      const editField = materialForm?.elements.namedItem("edit_id");
      if (editField) editField.value = "";
      state.bomMaterialFormVisible = false;
      helpers.renderActiveModule();
    });

    document.querySelector("#bom-structure-form")?.addEventListener("submit", helpers.handleBomStructureSubmit);

    document.querySelectorAll("[data-bom-structure-field]").forEach((field) => {
      field.addEventListener("input", helpers.handleBomStructureDraftFieldChange);
      field.addEventListener("change", helpers.handleBomStructureDraftFieldChange);
    });

    document.querySelectorAll("[data-bom-open-product-picker='final']").forEach((field) => {
      field.addEventListener("click", () => {
        openBomFinalProductPicker({
          state,
          helpers,
          onSelect: (product) => {
            state.bomStructureDraft.product_id = product.value;
            state.bomStructureDraft.product_code = product.code || "";
            state.bomStructureDraft.product_name = product.name || "";
            state.bomStructureDraft.sale_option_id = "";
            state.bomStructureDraft.sale_option_code = "";
            state.bomStructureDraft.sale_option_label = "";
            state.bomStructureDraft.name = product.name || "";
            state.bomDraftItems = state.bomDraftItems.map((item) => ({ ...item, productionSectionId: "" }));
            helpers.renderActiveModule();
          },
        });
      });
    });

    const structureForm = document.querySelector("#bom-structure-form");
    document.querySelector("[data-bom-structure-cancel]")?.addEventListener("click", () => {
      structureForm?.reset();
      helpers.resetBomStructureDraft();
      state.bomStructureFormVisible = false;
      helpers.renderActiveModule();
    });

    document.querySelector("[data-bom-add-item]")?.addEventListener("click", () => {
      state.bomDraftItems.push(helpers.createEmptyBomDraftItem());
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-bom-remove-item]").forEach((button) => {
      button.addEventListener("click", () => {
        state.bomDraftItems.splice(Number(button.dataset.bomRemoveItem), 1);
        if (!state.bomDraftItems.length) {
          helpers.resetBomDraftItems();
        }
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-bom-item-field]").forEach((field) => {
      field.addEventListener("input", helpers.handleBomDraftItemFieldChange);
      field.addEventListener("change", helpers.handleBomDraftItemFieldChange);
    });

    document.querySelectorAll("[data-bom-open-component-picker]").forEach((field) => {
      field.addEventListener("click", () => {
        const index = Number(field.dataset.bomOpenComponentPicker);
        openBomComponentPicker({
          state,
          helpers,
          index,
          onSelect: (component, selectedIndex) => {
            if (!state.bomDraftItems[selectedIndex]) return;
            const nextItem = {
              ...state.bomDraftItems[selectedIndex],
              sourceKey: component.value,
              saleOptionId: "",
            };
            const computed = helpers.getBomDraftItemComputed(nextItem);
            state.bomDraftItems[selectedIndex] = {
              ...nextItem,
              unitCost: computed.component ? String(Number(computed.unitCost || 0)) : "",
            };
            helpers.renderActiveModule();
          },
        });
      });
    });

    document.querySelector("#bom-file-upload")?.addEventListener("change", helpers.handleBomFileSelection);

    document.querySelectorAll("[data-bom-remove-file]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.removeBomAttachmentAt(Number(button.dataset.bomRemoveFile));
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-bom-structure-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const structure = state.moduleData.bomStructures.find((item) => item.id === button.dataset.bomStructureEditId);
        if (!structure) return;
        helpers.hydrateBomDraftFromStructure(structure);
        state.bomTab = "structures";
        state.bomMaterialFormVisible = false;
        state.bomStructureFormVisible = true;
        await helpers.renderActiveModule();
        document.querySelector("#bom-structure-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-bom-material-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const material = state.moduleData.bomMaterials.find((item) => item.id === button.dataset.bomMaterialEditId);
        if (!material) return;

        state.bomTab = "materials";
        state.bomStructureFormVisible = false;
        state.bomMaterialFormVisible = true;
        await helpers.renderActiveModule();

        const editForm = document.querySelector("#bom-material-form");
        if (!editForm) return;

        helpers.populateForm(editForm, material);
        editForm.elements.namedItem("edit_id").value = material.id;
        helpers.bindCurrencyInputs(editForm);
        editForm.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-bom-material-duplicate-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const material = state.moduleData.bomMaterials.find((item) => item.id === button.dataset.bomMaterialDuplicateId);
        if (!material) return;

        const duplicatedMaterial = buildDuplicateBomMaterialDraft(material, state.moduleData.bomMaterials);
        state.bomTab = "materials";
        state.bomStructureFormVisible = false;
        state.bomMaterialFormVisible = true;
        await helpers.renderActiveModule();

        const createForm = document.querySelector("#bom-material-form");
        if (!createForm) return;

        helpers.populateForm(createForm, duplicatedMaterial);
        createForm.elements.namedItem("edit_id").value = "";
        helpers.bindCurrencyInputs(createForm);
        createForm.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-bom-structure-duplicate-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const structure = state.moduleData.bomStructures.find((item) => item.id === button.dataset.bomStructureDuplicateId);
        if (!structure) return;

        helpers.hydrateBomDraftFromStructure(structure);
        state.bomStructureDraft.edit_id = "";
        state.bomStructureDraft.code = buildDuplicateTextValue(
          structure.code,
          (state.moduleData.bomStructures || []).map((item) => item.code),
          "-COPIA"
        );
        state.bomStructureDraft.name = buildDuplicateTextValue(
          structure.name,
          (state.moduleData.bomStructures || []).map((item) => item.name),
          " (Cópia)"
        );
        state.bomTab = "structures";
        state.bomMaterialFormVisible = false;
        state.bomStructureFormVisible = true;
        await helpers.renderActiveModule();
        document.querySelector("#bom-structure-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  },
};
