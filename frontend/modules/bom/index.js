function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponivel.");
  }
  return bridge;
}

function renderBomMaterialsForm(helpers) {
  return `
    <section class="module-subpanel">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">Nova Peca / Material</p>
          <h3>Pecas / Materiais</h3>
        </div>
      </div>

      <form id="bom-material-form" class="products-form-grid">
        <input type="hidden" name="edit_id" />
        <div class="form-section form-section-full">
          <h4>Dados principais</h4>
          <div class="product-form-row">
            ${helpers.inputField("code", "Codigo")}
            ${helpers.inputField("name", "Nome")}
            ${helpers.selectField("category", "Categoria", [
              { value: "raw_material", label: "Materia-prima" },
              { value: "component", label: "Componente" },
              { value: "subassembly", label: "Subconjunto" },
              { value: "packaging", label: "Embalagem" },
            ])}
            ${helpers.inputField("unit", "Unidade", "text", "un")}
          </div>
          ${helpers.optionalTextAreaField("description", "Descricao")}
        </div>

        <div class="form-section form-section-full">
          <h4>Custos e estoque</h4>
          <div class="product-form-row">
            ${helpers.currencyInputField("unit_cost", "Custo Unitario")}
            ${helpers.optionalInputField("supplier", "Fornecedor")}
            ${helpers.inputField("current_stock", "Estoque Atual", "number", "0")}
            ${helpers.inputField("minimum_stock", "Estoque Minimo", "number", "0")}
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
  const options = helpers.buildBomComponentOptions()
    .map(
      (option) => `
        <option value="${option.value}" ${option.value === item.sourceKey ? "selected" : ""}>
          ${option.label}
        </option>
      `
    )
    .join("");
  const details = helpers.getBomDraftItemComputed(item);

  return `
    <div class="bom-item-row">
      <label>
        Peca selecionada
        <select data-bom-item-field="sourceKey" data-bom-item-index="${index}">
          <option value="">Selecione...</option>
          ${options}
        </select>
      </label>
      <label>
        Quantidade
        <input data-bom-item-field="quantity" data-bom-item-index="${index}" type="number" min="0" step="0.0001" value="${item.quantity}" />
      </label>
      <label>
        Custo unitario
        <input type="text" value="${helpers.formatCurrency(details.unitCost)}" readonly />
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
  const productOptions = (state.moduleData.products || []).map((product) => ({
    value: product.id,
    label: `${product.name} (${product.code})`,
  }));
  const materialOptions = state.moduleData.bomMaterials || [];

  if (!productOptions.length) {
    return `
      <section class="module-subpanel">
        <div class="empty-state">Cadastre ao menos um produto no modulo Produtos para criar um conjunto BOM.</div>
      </section>
    `;
  }

  if (!materialOptions.length) {
    return `
      <section class="module-subpanel">
        <div class="empty-state">Cadastre ao menos uma peca em Pecas / Materiais antes de montar um conjunto BOM.</div>
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
            ${helpers.draftSelectField("product_id", "Produto final", draft.product_id, productOptions, true)}
            ${helpers.draftInputField("version", "Versao", draft.version, "text", "1.0", false, true)}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Producao</h4>
          <div class="product-form-row">
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
            <button class="secondary-button" type="button" data-bom-add-item>+ Adicionar peca</button>
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
          <h4>Instrucoes de Producao</h4>
          ${helpers.draftTextAreaField("instructions", "Instrucoes de producao", draft.instructions)}
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
          ${helpers.draftTextAreaField("notes", "Observacoes", draft.notes)}
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
    const filteredMaterials = materials.filter((item) => {
      const term = state.bomMaterialSearch.trim().toLowerCase();
      if (!term) return true;
      return [item.code, item.name, item.description, item.supplier].some((value) =>
        String(value || "").toLowerCase().includes(term)
      );
    });
    const totalStructureCost = helpers.calculateBomDraftTotal();

    return `
      <section class="module-panel">
        <div class="module-head">
          <div>
            <p class="eyebrow muted">Bill of Materials</p>
            <h3>BOM - Estrutura de Produtos</h3>
            <p class="muted">Receita industrial com materiais base, subconjuntos e custo consolidado por versao.</p>
          </div>
          <div class="module-head-actions">
            ${
              canEdit && state.bomTab === "materials"
                ? `<button class="primary-button" type="button" data-bom-material-create>Nova Peca/Material</button>`
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
            label: "Pecas e Materiais",
            value: materials.length,
            note: materials.length ? "Base tecnica cadastrada" : "Nenhum item cadastrado",
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
            note: "Edicao liberada antes da ativacao",
            icon: "◩",
            tone: "amber",
          })}
        </div>

        <div class="bom-tabs">
          <button class="bom-tab-button ${state.bomTab === "materials" ? "active" : ""}" type="button" data-bom-tab="materials">Pecas / Materiais</button>
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
                  : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
              }
              <section class="module-subpanel">
                <div class="module-head compact-head">
                  <div>
                    <p class="eyebrow muted">Consulta</p>
                    <h3>Pecas cadastradas</h3>
                  </div>
                </div>
                <div class="table-actions single-search-row">
                  <label>
                    Buscar pecas...
                    <input id="bom-material-search" type="text" placeholder="Buscar pecas..." value="${helpers.escapeHtml(state.bomMaterialSearch)}" />
                  </label>
                </div>
                ${helpers.renderTable(
                  ["Codigo", "Nome", "Descricao", "Categoria", "Unidade", "Custo", "Fornecedor", "Estoque", "Minimo", "Status", "Acao"],
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
                    helpers.deleteButtonCell("bom_materials", item.id, canEdit),
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
                  : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
              }
              <section class="module-subpanel">
                <div class="module-head compact-head">
                  <div>
                    <p class="eyebrow muted">Estruturas ativas e rascunhos</p>
                    <h3>Conjuntos BOM</h3>
                  </div>
                </div>
                ${helpers.renderTable(
                  ["Codigo", "Nome", "Versao", "Lote", "Status", "Custo Total", "Itens", "Instrucoes", "Acao"],
                  structures.map((item) => [
                    item.code,
                    item.name,
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
  },
};
