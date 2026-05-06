function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

const PRODUCT_IMPORT_EXPORT_COLUMNS = [
  "code",
  "name",
  "status",
  "category",
  "product_type",
  "unit",
  "minimum_stock",
  "current_stock",
  "cost_price",
  "sale_price",
  "supplier",
  "batch",
  "machine_serial",
  "expiration_date",
  "location",
  "description",
  "photo_data_url",
  "available_for_sale",
  "sale_options",
];

const PRODUCT_NUMERIC_COLUMNS = new Set(["minimum_stock", "current_stock", "cost_price", "sale_price"]);
const PRODUCT_OPTION_COLUMNS = {
  status: new Set(["active", "inactive"]),
};

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

function buildDuplicateProductDraft(product, products) {
  const allProducts = Array.isArray(products) ? products : [];
  const nextCode = buildDuplicateTextValue(product.code, allProducts.map((item) => item.code), "-COPIA");
  const nextName = buildDuplicateTextValue(product.name, allProducts.map((item) => item.name), " (Cópia)");
  const duplicatedOptions = (Array.isArray(product.sale_options) ? product.sale_options : []).map((option) => ({
    ...option,
    code: option.code ? `${option.code}-COPIA` : "",
    current_stock: 0,
  }));

  return {
    ...product,
    code: nextCode,
    name: nextName,
    current_stock: 0,
    batch: "",
    machine_serial: "",
    expiration_date: "",
    last_moved_by_user_id: "",
    last_moved_by_name: "",
    last_movement_at: "",
    sale_options: duplicatedOptions,
  };
}

function getKitPickerStructures(state) {
  return (state.moduleData.bomStructures || [])
    .filter((structure) => structure.status === "active")
    .map((structure) => {
      const totalCost = Number(structure.total_cost || 0);
      const batchSize = Number(structure.batch_size || 1);
      const unitValue = totalCost > 0 ? (batchSize > 0 ? totalCost / batchSize : totalCost) : 0;
      return {
        id: structure.id,
        label: `${structure.name || structure.product_name || "Kit"} (${structure.code || structure.version || "sem código"})`,
        unitValue,
      };
    });
}

function openProductKitPickerModal({ state, showToast, onSelect }) {
  const existing = document.querySelector("[data-product-kit-picker-overlay]");
  if (existing) existing.remove();

  const structures = getKitPickerStructures(state);
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay sales-document-modal-overlay";
  overlay.setAttribute("data-product-kit-picker-overlay", "true");
  overlay.innerHTML = `
    <div class="modal-card sales-document-modal" role="dialog" aria-modal="true" aria-label="Selecionar conjunto BOM">
      <div class="sales-config-header">
        <div>
          <p class="eyebrow muted">Produtos</p>
          <h3>Selecionar Conjunto</h3>
          <p class="muted">Pesquise o conjunto que deseja vincular à variação.</p>
        </div>
        <div class="sales-config-header-actions">
          <button class="ghost-button" type="button" data-product-kit-picker-close>Fechar</button>
        </div>
      </div>
      <div class="table-actions">
        <label class="search-input-shell">
          <span class="search-input-icon">⌕</span>
          <input type="text" placeholder="Buscar conjunto..." data-product-kit-picker-search />
        </label>
      </div>
      <div class="table-card" style="max-height: 55vh; overflow: auto;">
        <div data-product-kit-picker-results></div>
      </div>
    </div>
  `;

  const close = () => overlay.remove();
  const results = overlay.querySelector("[data-product-kit-picker-results]");
  const searchInput = overlay.querySelector("[data-product-kit-picker-search]");

  const renderResults = (term = "") => {
    const normalized = String(term || "").trim().toLowerCase();
    const filtered = !normalized
      ? structures
      : structures.filter((structure) => structure.label.toLowerCase().includes(normalized));

    results.innerHTML = filtered.length
      ? filtered.map((structure) => `
          <button class="bom-file-card" type="button" data-product-kit-picker-select="${structure.id}" style="width:100%; text-align:left; cursor:pointer;">
            <div>
              <strong>${structure.label}</strong>
              <div class="table-inline-copy muted">Valor automático: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(structure.unitValue || 0)}</div>
            </div>
          </button>
        `).join("")
      : `<div class="empty-state">Nenhum conjunto encontrado.</div>`;

    results.querySelectorAll("[data-product-kit-picker-select]").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = structures.find((structure) => structure.id === button.dataset.productKitPickerSelect);
        if (!selected) {
          showToast("Conjunto não encontrado.", "warning");
          return;
        }
        onSelect(selected);
        close();
      });
    });
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.hasAttribute("data-product-kit-picker-close")) {
      close();
    }
  });

  searchInput?.addEventListener("input", () => renderResults(searchInput.value));
  document.body.appendChild(overlay);
  renderResults("");
  searchInput?.focus();
}

function productPhotoCell(item, escapeHtml) {
  if (!item.photo_data_url) {
    return `<span class="product-photo-thumb is-empty" aria-label="Sem foto">-</span>`;
  }

  return `<img class="product-photo-thumb" src="${escapeHtml(item.photo_data_url)}" alt="Foto de ${escapeHtml(item.name || "produto")}" />`;
}

function exportProductsCsv(products) {
  const rows = [
    PRODUCT_IMPORT_EXPORT_COLUMNS,
    ...products.map((product) => PRODUCT_IMPORT_EXPORT_COLUMNS.map((column) => normalizeProductCsvValue(product[column], column))),
  ];
  const csv = rows.map((row) => row.map(encodeCsvCell).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `produtos-capsfarma-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeProductCsvValue(value, column) {
  if (value === null || value === undefined) return "";
  if (PRODUCT_NUMERIC_COLUMNS.has(column)) return String(Number(value || 0));
  if (column === "available_for_sale") return value === false ? "false" : "true";
  if (column === "sale_options") return Array.isArray(value) ? JSON.stringify(value) : String(value || "");
  return String(value);
}

function inferProductTypeFromRecord(record) {
  const values = [record.product_type, record.category, record.code, record.name]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const normalizedValues = values.map(normalizeProductText);
  if (normalizedValues.some((value) =>
    value === "produto acabado"
    || value === "finished product"
    || value === "finished_product"
    || value === "acabado"
    || value.startsWith("kit")
    || value.startsWith("caps05")
    || value.startsWith("caps10")
    || ["bombas", "misturadores", "polidoras", "encapsuladoras"].includes(value)
  )) {
    return "finished_product";
  }
  return "raw_material";
}

function normalizeProductText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function encodeCsvCell(value) {
  const text = String(value ?? "");
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseProductsCsv(text) {
  const delimiter = detectCsvDelimiter(text);
  const rows = parseDelimitedRows(text, delimiter).filter((row) => row.some((cell) => String(cell || "").trim()));
  if (!rows.length) return [];

  const headers = rows.shift().map((header) => normalizeCsvHeader(header));
  const missingColumns = PRODUCT_IMPORT_EXPORT_COLUMNS
    .filter((column) => !["available_for_sale", "sale_options", "product_type"].includes(column))
    .filter((column) => !headers.includes(column));
  if (missingColumns.length) {
    throw new Error(`Arquivo sem coluna obrigatoria: ${missingColumns.join(", ")}.`);
  }

  return rows.map((row, index) => {
    const payload = {};
    headers.forEach((header, columnIndex) => {
      if (!PRODUCT_IMPORT_EXPORT_COLUMNS.includes(header)) return;
      payload[header] = String(row[columnIndex] ?? "").trim();
    });

    PRODUCT_NUMERIC_COLUMNS.forEach((column) => {
      payload[column] = parseProductNumber(payload[column]);
    });

    payload.status = payload.status || "active";
    payload.product_type = inferProductTypeFromRecord(payload);
    payload.category = normalizeImportCategoryInput(payload.category || "general_products");
    payload.unit = payload.unit || "un";
    payload.available_for_sale = !["false", "0", "não", "nao", "no"].includes(String(payload.available_for_sale || "true").toLowerCase());

    ["supplier", "batch", "machine_serial", "expiration_date", "location", "description", "photo_data_url"].forEach((column) => {
      payload[column] = payload[column] || null;
    });
    try {
      payload.sale_options = payload.sale_options ? JSON.parse(payload.sale_options) : [];
    } catch {
      payload.sale_options = [];
    }

    validateProductImportRow(payload, index + 2);
    return payload;
  });
}

function detectCsvDelimiter(text) {
  const firstLine = String(text || "").split(/\r?\n/, 1)[0] || "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseDelimitedRows(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeCsvHeader(header) {
  return String(header || "").replace(/^\uFEFF/, "").trim().toLowerCase();
}

function parseProductNumber(value) {
  const raw = String(value || "0").trim();
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeImportCategoryInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "general_products";
  const normalized = normalizeProductText(raw);
  const aliases = {
    "materia prima": "general_products",
    "produto acabado": "general_products",
    acabado: "general_products",
    "produtos em geral": "general_products",
    geral: "general_products",
    general: "general_products",
    embalagem: "packaging",
    insumo: "consumable",
    componente: "component",
    subconjunto: "subassembly",
  };
  return aliases[normalized] || raw;
}

function validateProductImportRow(payload, rowNumber) {
  ["code", "name"].forEach((column) => {
    if (!payload[column]) {
      throw new Error(`Linha ${rowNumber}: preencha ${column}.`);
    }
  });

  Object.entries(PRODUCT_OPTION_COLUMNS).forEach(([column, options]) => {
    if (!options.has(payload[column])) {
      throw new Error(`Linha ${rowNumber}: valor invalido em ${column}.`);
    }
  });
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
      return noPermissionTemplate("Seu perfil não possui acesso ao módulo de produtos.");
    }

    const canEdit = hasPermission("products", "edit");
    const products = state.moduleData.products || [];
    const searchTerm = state.productSearch.trim().toLowerCase();
    const filteredProducts = products.filter((item) => {
      const matchesSearch = !searchTerm
        || [item.code, item.name, item.category, item.product_type, item.supplier, item.location, item.batch]
          .some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesCategory = state.productCategoryFilter === "all" || bridge.helpers.getProductCategory(item) === state.productCategoryFilter;
      return matchesSearch && matchesCategory;
    });
    const activeProducts = products.filter((item) => item.status === "active").length;
    const lowStockItems = products.filter((item) => Number(item.current_stock) <= Number(item.minimum_stock));
    const finishedProducts = products.filter((item) => bridge.helpers.getProductType(item) === "finished_product").length;
    const movementProduct = products.find((item) => item.id === state.productMovementId);
    const categoryOptions = bridge.helpers.buildProductCategoryOptions();

    return `
      <section class="module-panel">
        <div class="module-head">
          <div>
            <p class="eyebrow muted">Cadastro mestre</p>
            <h3>Cadastro de Produtos</h3>
            <p class="muted">Itens integrados a estoque, produção, compras e vendas em um único cadastro.</p>
          </div>
          <div class="module-head-actions">
            <button class="ghost-button secondary-surface-button" type="button" data-product-view-inventory>Ver Estoque</button>
            <button class="ghost-button secondary-surface-button" type="button" data-product-export>Exportar</button>
            ${
              canEdit
                ? `
                  <button class="ghost-button secondary-surface-button" type="button" data-product-import>Importar</button>
                  <input id="product-import-input" class="hidden" type="file" accept=".csv,text/csv" />
                `
                : ""
            }
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
            note: lowStockItems.length ? "Itens abaixo do mínimo configurado" : "Sem alerta de estoque mínimo",
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
            : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
        }
        ${movementProduct && canEdit ? renderProductMovementPanel(movementProduct) : ""}

        <div class="product-import-hint">
          <strong>Importação e exportação</strong>
          <span>O arquivo exportado já vem no mesmo modelo aceito pela importação. Edite apenas os dados necessários e mantenha os cabeçalhos.</span>
        </div>

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
                    `<option value="${escapeHtml(option.value)}" ${option.value === state.productCategoryFilter ? "selected" : ""}>${escapeHtml(option.label)}</option>`
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
                <th>Foto</th>
                <th>Código</th>
                <th>Nome</th>
                <th>Status</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Venda</th>
                <th>Unidade</th>
                <th>Estoque Atual</th>
                <th>Lote</th>
                <th>Série da Máquina</th>
                <th>Último Movimentador</th>
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
                            <td>${productPhotoCell(item, escapeHtml)}</td>
                            <td>${escapeHtml(item.code)}</td>
                            <td>
                              <strong>${escapeHtml(item.name)}</strong>
                              <div class="table-inline-copy muted">${escapeHtml(item.location || "Sem localização")}</div>
                            </td>
                            <td>${productStatusCell(item.status)}</td>
                            <td>${productCategoryCell(item.category)}</td>
                            <td>${bridge.helpers.productTypeCell(bridge.helpers.getProductType(item))}</td>
                            <td>${item.available_for_sale === false ? "Não" : "Sim"}</td>
                            <td>${escapeHtml(item.unit)}</td>
                            <td>${productStockCell(item)}</td>
                            <td>${escapeHtml(item.batch || "-")}</td>
                            <td>${escapeHtml(item.machine_serial || "-")}</td>
                            <td>${renderLastMovementUserCell(item)}</td>
                            <td>${productActionCell(item, canEdit)}</td>
                          </tr>
                        `
                      )
                      .join("")
                  : `<tr><td colspan="14"><div class="empty-state">Nenhum produto encontrado</div></td></tr>`
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
      resizeProductImageFile,
      formatFileSize,
      renderProductSaleVariationRows,
      renderProductProductionSectionRows,
      syncProductSectionsPanel,
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

    const exportButton = document.querySelector("[data-product-export]");
    if (exportButton) {
      exportButton.addEventListener("click", () => {
        exportProductsCsv(state.moduleData.products || []);
        showToast("Arquivo de produtos exportado.", "success");
      });
    }

    const importButton = document.querySelector("[data-product-import]");
    const importInput = document.querySelector("#product-import-input");
    if (importButton && importInput) {
      importButton.addEventListener("click", () => importInput.click());
      importInput.addEventListener("change", async () => {
        const file = importInput.files?.[0];
        if (!file) return;

        try {
          const csvText = await file.text();
          const rows = parseProductsCsv(csvText);
          if (!rows.length) {
            showToast("Arquivo sem produtos para importar.", "warning");
            return;
          }

          const { error } = await state.supabase.from("products").upsert(rows, { onConflict: "code" });
          if (error) throw error;

          await loadTable("products", "products");
          renderActiveModule();
          void queueSystemLog({
            moduleKey: "products",
            action: "importacao",
            level: "Informativo",
            itemAffected: `${rows.length} produto(s)`,
            description: `Importação de ${rows.length} produto(s) via CSV.`,
            entityType: "product_import",
            payload: { file_name: file.name, rows: rows.length },
          });
          showToast(`${rows.length} produto(s) importado(s) ou atualizado(s).`, "success");
        } catch (error) {
          showToast(formatError(error), "danger");
        } finally {
          importInput.value = "";
        }
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

      const photoInput = productForm.elements.namedItem("product_photo_file");
      const photoPreview = productForm.querySelector("[data-product-photo-preview]");
      if (photoInput && photoPreview) {
        photoInput.addEventListener("change", async () => {
          const file = photoInput.files?.[0];
          if (!file) return;
          try {
            const processedPhoto = await resizeProductImageFile(file);
            const hiddenField = productForm.elements.namedItem("photo_data_url");
            if (hiddenField) hiddenField.value = processedPhoto.dataUrl;
            const sizeLabel = processedPhoto.resized
              ? `${formatFileSize(processedPhoto.size)} após ajuste`
              : formatFileSize(processedPhoto.size);
            photoPreview.innerHTML = `<img src="${processedPhoto.dataUrl}" alt="Foto selecionada" /><span>${file.name} - ${sizeLabel}</span>`;
          } catch (error) {
            showToast(formatError(error), "warning");
            photoInput.value = "";
          }
        });
      }

      const variationList = productForm.querySelector("[data-product-variations-list]");
      productForm.elements.namedItem("has_production_sections")?.addEventListener("change", () => {
        syncProductSectionsPanel(productForm);
      });

      productForm.querySelector("[data-product-add-section]")?.addEventListener("click", () => {
        const list = productForm.querySelector("[data-product-sections-list]");
        if (!list) return;
        list.insertAdjacentHTML("beforeend", renderProductProductionSectionRows([{ id: "", label: "" }]));
      });

      const readCurrentVariationRows = () => Array.from(productForm.querySelectorAll("[data-product-variation-row]")).map((row) => ({
          code: row.querySelector('[name="sale_option_code"]')?.value.trim() || "",
          label: row.querySelector('[name="sale_option_label"]')?.value.trim() || "",
          price: row.querySelector('[name="sale_option_price"]')?.value || "",
          production_quantity: row.querySelector('[name="sale_option_production_quantity"]')?.value || "",
          current_stock: row.querySelector('[name="sale_option_current_stock"]')?.value || "",
          minimum_stock: row.querySelector('[name="sale_option_minimum_stock"]')?.value || "",
          kit_structure_id: row.querySelector('[name="sale_option_kit_structure_id"]')?.value || "",
        }));
      const renderVariationRows = (rows) => {
        if (variationList) {
          const editId = productForm.elements.namedItem("edit_id")?.value || "";
          const currentProduct = (state.moduleData.products || []).find((product) => product.id === editId) || null;
          variationList.innerHTML = renderProductSaleVariationRows(rows, currentProduct);
          bindCurrencyInputs(variationList);
        }
      };

      productForm.addEventListener("click", (event) => {
        const removeSectionButton = event.target.closest("[data-product-remove-section]");
        if (removeSectionButton) {
          event.preventDefault();
          const row = removeSectionButton.closest("[data-product-section-row]");
          row?.remove();
          const list = productForm.querySelector("[data-product-sections-list]");
          if (list && !list.querySelector("[data-product-section-row]")) {
            list.innerHTML = renderProductProductionSectionRows([]);
          }
          return;
        }

        const addButton = event.target.closest("[data-product-add-variation]");
        if (addButton) {
          event.preventDefault();
          const currentRows = readCurrentVariationRows();
          currentRows.push({ code: "", label: "", price: "", production_quantity: 1, current_stock: 0, minimum_stock: 0, kit_structure_id: "" });
          renderVariationRows(currentRows);
          return;
        }

        const removeButton = event.target.closest("[data-product-remove-variation]");
        if (removeButton) {
          event.preventDefault();
          const removeIndex = Number(removeButton.dataset.productRemoveVariation);
          const currentRows = readCurrentVariationRows().filter((_, index) => index !== removeIndex);
          renderVariationRows(currentRows.length ? currentRows : []);
          return;
        }

        const kitButton = event.target.closest("[data-product-open-kit-picker]");
        if (!kitButton) return;

        event.preventDefault();
        const rowIndex = Number(kitButton.dataset.productOpenKitPicker);
        openProductKitPickerModal({
          state,
          showToast,
          onSelect: (selectedStructure) => {
            const currentRows = readCurrentVariationRows();
            const targetRow = currentRows[rowIndex];
            if (!targetRow) return;
            targetRow.kit_structure_id = selectedStructure.id;
            targetRow.price = String(selectedStructure.unitValue || 0);
            renderVariationRows(currentRows);
          },
        });
      });
      syncProductSectionsPanel(productForm, []);
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

        editForm.elements.namedItem("edit_id").value = product.id;
        populateForm(editForm, product);
        bindCurrencyInputs(editForm);
        editForm.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-product-duplicate-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const product = state.moduleData.products.find((item) => item.id === button.dataset.productDuplicateId);
        if (!product) return;

        const duplicatedProduct = buildDuplicateProductDraft(product, state.moduleData.products);
        state.productFormMode = "create";
        state.productFormVisible = true;
        state.productMovementId = null;
        await renderActiveModule();

        const createForm = document.querySelector("#products-form");
        if (!createForm) return;

        createForm.elements.namedItem("edit_id").value = "";
        populateForm(createForm, duplicatedProduct);
        bindCurrencyInputs(createForm);
        createForm.scrollIntoView({ behavior: "smooth", block: "start" });
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
              level: "Atenção",
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
