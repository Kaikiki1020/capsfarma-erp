function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

function buildPurchaseRequesterOptions(state) {
  return (state.moduleData.users || []).map((user) => ({
    value: user.id,
    label: user.full_name,
  }));
}

function renderPurchaseItemRow(item, index, helpers) {
  return `
    <article class="purchase-item-row" data-purchase-item-index="${index}">
      <label>
        Produto / Item solicitado
        <input data-purchase-item-field="product_name" data-purchase-item-index="${index}" type="text" value="${helpers.escapeHtml(item.product_name)}" />
      </label>
      <label>
        Descrição
        <input data-purchase-item-field="description" data-purchase-item-index="${index}" type="text" value="${helpers.escapeHtml(item.description)}" />
      </label>
      <label>
        Quantidade
        <input data-purchase-item-field="quantity" data-purchase-item-index="${index}" type="number" min="0.01" step="0.01" value="${helpers.escapeHtml(item.quantity)}" />
      </label>
      <label>
        Unidade
        <input data-purchase-item-field="unit" data-purchase-item-index="${index}" type="text" value="${helpers.escapeHtml(item.unit)}" />
      </label>
      <label>
        Medidas
        <input data-purchase-item-field="measures" data-purchase-item-index="${index}" type="text" placeholder="Ex.: 1200 x 800 x 3 mm" value="${helpers.escapeHtml(item.measures)}" />
      </label>
      <button class="inline-button danger-button sales-item-remove" type="button" data-purchase-remove-item="${index}">Remover</button>
    </article>
  `;
}

function renderPurchaseFileList(files, key, helpers) {
  if (!files.length) {
    return `<div class="empty-state compact-empty">Nenhum arquivo enviado.</div>`;
  }

  return files
    .map((file, index) => `
      <article class="bom-file-card">
        <div>
          <strong>${helpers.escapeHtml(file.name)}</strong>
          <div class="table-inline-copy muted">${helpers.formatFileSize(file.size)} • ${helpers.escapeHtml(file.type || "arquivo")}</div>
        </div>
        <button class="inline-button danger-button" type="button" data-purchase-remove-file="${key}" data-purchase-file-index="${index}">Remover</button>
      </article>
    `)
    .join("");
}

function renderPurchaseUploadField(label, key, files, accept, helpers, multiple = false) {
  return `
    <section class="purchase-upload-panel">
      <div class="purchase-upload-header">
        <div>
          <strong>${label}</strong>
          <div class="table-inline-copy muted">${multiple ? "Multiplos arquivos permitidos" : "Um arquivo por vez"}</div>
        </div>
        <input class="purchase-upload-input" type="file" data-purchase-upload="${key}" ${multiple ? "multiple" : ""} accept="${accept}" />
      </div>
      <div class="bom-upload-list">
        ${renderPurchaseFileList(files, key, helpers)}
      </div>
    </section>
  `;
}

function renderPurchaseInstallmentRow(installment, index, helpers) {
  const files = Array.isArray(installment.boleto_files) ? installment.boleto_files : [];
  return `
    <article class="purchase-item-row" data-purchase-installment-index="${index}">
      <label>
        Parcela
        <input type="text" readonly value="${helpers.escapeHtml(`${index + 1}`)}" />
      </label>
      <label>
        Vencimento do boleto *
        <input data-purchase-installment-field="due_date" data-purchase-installment-index="${index}" type="date" value="${helpers.escapeHtml(installment.due_date || "")}" />
      </label>
      <label>
        Valor da parcela *
        <input data-purchase-installment-field="amount" data-purchase-installment-index="${index}" type="number" min="0.01" step="0.01" value="${helpers.escapeHtml(installment.amount || "")}" />
      </label>
      <div class="purchase-upload-panel">
        <div class="purchase-upload-header">
          <div>
            <strong>Boleto da parcela *</strong>
            <div class="table-inline-copy muted">${files.length ? `${files.length} arquivo(s)` : "Envie o boleto desta parcela"}</div>
          </div>
          <input class="purchase-upload-input" type="file" data-purchase-installment-upload-index="${index}" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        </div>
        <div class="bom-upload-list">
          ${
            files.length
              ? files.map((file, fileIndex) => `
                <article class="bom-file-card">
                  <div>
                    <strong>${helpers.escapeHtml(file.name)}</strong>
                    <div class="table-inline-copy muted">${helpers.formatFileSize(file.size || 0)} • ${helpers.escapeHtml(file.type || "arquivo")}</div>
                  </div>
                  <button class="inline-button danger-button" type="button" data-purchase-remove-installment-file="${index}" data-purchase-installment-file-index="${fileIndex}">Remover</button>
                </article>
              `).join("")
              : `<div class="empty-state compact-empty">Nenhum boleto enviado.</div>`
          }
        </div>
      </div>
      <button class="inline-button danger-button sales-item-remove" type="button" data-purchase-remove-installment="${index}" ${index === 0 ? "disabled" : ""}>Remover parcela</button>
    </article>
  `;
}

function renderPurchaseStockEntryRows(request, state, helpers) {
  const entries = helpers.getPurchaseConclusionStockEntries(request);
  if (!entries.length) return "";

  const productOptions = [
    { value: "", label: "Não lançar no estoque" },
    ...(state.moduleData.products || []).map((product) => ({
      value: product.id,
      label: `${product.code ? `${product.code} - ` : ""}${product.name} | saldo ${helpers.formatQuantity(product.current_stock || 0)} | custo ${helpers.formatCurrency(product.cost_price || 0)}`,
    })),
  ];

  return `
    <section class="purchase-items-panel">
      <div class="purchase-items-header">
        <div>
          <h5>Entrada no estoque</h5>
          <p class="muted">Vincule os itens comprados aos produtos cadastrados para dar entrada e atualizar o custo.</p>
        </div>
      </div>
      <div class="purchase-items-list">
        ${entries.map((entry, index) => `
          <article
            class="purchase-item-row"
            data-purchase-stock-entry-index="${index}"
            data-purchase-stock-entry-id="${helpers.escapeHtml(entry.id)}"
            data-purchase-stock-requested-name="${helpers.escapeHtml(entry.requested_product_name)}"
            data-purchase-stock-requested-description="${helpers.escapeHtml(entry.requested_description)}"
            data-purchase-stock-requested-unit="${helpers.escapeHtml(entry.requested_unit)}"
            data-purchase-stock-registered="${entry.stock_registered ? "true" : "false"}"
            data-purchase-stock-registered-at="${helpers.escapeHtml(entry.stock_registered_at || "")}"
          >
            <label>
              Item comprado
              <input type="text" readonly value="${helpers.escapeHtml(`${entry.requested_product_name || "Item"}${entry.requested_description ? ` - ${entry.requested_description}` : ""}`)}" />
            </label>
            <label>
              Produto cadastrado
              <select data-purchase-stock-product ${entry.stock_registered ? "disabled" : ""}>
                ${helpers.renderOptions(productOptions, entry.product_id)}
              </select>
            </label>
            <label>
              Quantidade de entrada
              <input data-purchase-stock-quantity type="number" min="0" step="1" value="${helpers.escapeHtml(entry.quantity || 0)}" ${entry.stock_registered ? "readonly" : ""} />
            </label>
            <label>
              Custo unitário
              <input
                data-purchase-stock-cost
                type="text"
                inputmode="decimal"
                data-currency-input="true"
                data-currency-allow-empty="true"
                value="${helpers.escapeHtml(entry.unit_cost || "")}"
                ${entry.stock_registered ? "readonly" : ""}
              />
            </label>
            <span class="table-inline-copy muted">
              ${entry.stock_registered ? `Entrada registrada em ${helpers.formatDateTime(entry.stock_registered_at)}` : "Será lançado ao concluir a compra"}
            </span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

const PURCHASE_QUOTE_BUCKET_CANDIDATES = ["purchase-quotes", "documents", "public-documents"];

function normalizePhoneBrForWhatsApp(number) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function sanitizePurchaseQuoteFileName(value) {
  return String(value || "cotacao")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "cotacao";
}

function escapePdfText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function wrapPdfText(text, maxCharsPerLine) {
  const normalized = String(text || "").trim();
  if (!normalized) return [""];
  const words = normalized.split(/\s+/);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });
  if (current) lines.push(current);
  return lines.length ? lines : [normalized];
}

function formatPurchaseQuoteDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function getPurchaseCompanyData(state) {
  const company = state.salesDocumentSettings?.company || {};
  return {
    company_name: company.company_name || "CAPSFARMA LTDA",
    cnpj: company.cnpj || "XX.XXX.XXX/0001-XX",
    address: company.address || "[endereço da empresa]",
    phone: company.phone || "[telefone da empresa]",
    email: company.email || "[e-mail da empresa]",
    responsible_name: company.responsible_name || "",
    responsible_role: company.responsible_role || "Setor de Compras",
  };
}

function getPurchaseQuoteSource(state, helpers, requestId = "") {
  const request = requestId
    ? (state.moduleData.purchases || []).find((item) => item.id === requestId)
    : null;
  const metadata = request
    ? helpers.getPurchaseRequestMetadata(request)
    : {
      request_number: state.purchaseDraft.request_number || "",
      requester_name: state.purchaseDraft.requester_name || helpers.getLoggedUserName(""),
      department: state.purchaseDraft.department || "",
      urgency: state.purchaseDraft.urgency || "media",
      justification: state.purchaseDraft.justification || "",
      purchaseDetails: {
        quotation_details: {},
      },
      items: (state.purchaseDraft.items || [])
        .map((item) => ({
          product_name: String(item.product_name || "").trim(),
          description: String(item.description || "").trim(),
          quantity: Number(item.quantity || 0),
          unit: String(item.unit || "un").trim() || "un",
          measures: String(item.measures || "").trim(),
        }))
        .filter((item) => item.product_name && item.quantity > 0),
    };

  if (!metadata.items?.length) {
    helpers.showPurchaseNotification("Adicione ao menos um item para gerar a cotação.", "warning");
    return null;
  }

  return { request, metadata };
}

function getNextPurchaseQuoteNumber(state) {
  const year = new Date().getFullYear();
  const currentMax = (state.moduleData.purchases || []).reduce((max, request) => {
    const quoteNumber = request?.purchase_details?.quotation_details?.quote_number
      || request?.purchase_details?.quote_number
      || "";
    const match = String(quoteNumber).match(/^COT-(\d+)\/(\d{4})$/);
    if (!match) return max;
    const [, sequence, sequenceYear] = match;
    if (Number(sequenceYear) !== year) return max;
    return Math.max(max, Number(sequence || 0));
  }, 0);
  return `COT-${String(currentMax + 1).padStart(4, "0")}/${year}`;
}

function buildDefaultPurchaseQuoteMessage(draft, companyData, link = "[LINK_DO_PDF]") {
  return [
    "Olá, tudo bem?",
    "",
    `Segue nossa Solicitação de Cotação da ${companyData.company_name}.`,
    "",
    "Link do PDF:",
    link,
    "",
    "Fico no aguardo do orçamento.",
    "",
    "Atenciosamente,",
    draft.requester_name || companyData.responsible_name || "",
    companyData.company_name,
  ].filter(Boolean).join("\n");
}

function createPurchaseSupplierQuoteDraft(state, helpers, requestId = "") {
  const source = getPurchaseQuoteSource(state, helpers, requestId);
  if (!source) return null;

  const { request, metadata } = source;
  const quoteDetails = metadata.purchaseDetails?.quotation_details || {};
  const companyData = getPurchaseCompanyData(state);
  const quoteNumber = quoteDetails.quote_number || getNextPurchaseQuoteNumber(state);

  return {
    open: true,
    request_id: request?.id || "",
    request_number: metadata.request_number || "RASCUNHO",
    quote_number: quoteNumber,
    quote_date: quoteDetails.pdf_generated_at || request?.created_at || new Date().toISOString(),
    requester_name: metadata.requester_name || helpers.getLoggedUserName(""),
    department: metadata.department || "Compras",
    subject: "Solicitação de Orçamento",
    supplier_company: quoteDetails.supplier_company || metadata.purchaseDetails?.supplier || "",
    supplier_contact: quoteDetails.supplier_contact || "",
    supplier_phone: quoteDetails.supplier_phone || "",
    general_notes: quoteDetails.general_notes || metadata.justification || "",
    items: metadata.items,
    pdf_file_name: quoteDetails.pdf_file_name || "",
    pdf_storage_bucket: quoteDetails.pdf_storage_bucket || "",
    pdf_storage_path: quoteDetails.pdf_storage_path || "",
    pdf_public_url: quoteDetails.pdf_public_url || "",
    pdf_generated_at: quoteDetails.pdf_generated_at || "",
    whatsapp_message: quoteDetails.whatsapp_message || buildDefaultPurchaseQuoteMessage({
      requester_name: metadata.requester_name || helpers.getLoggedUserName(""),
    }, companyData),
  };
}

function syncPurchaseSupplierQuoteDraftFromForm(form, state, helpers) {
  if (!form || !state.purchaseSupplierQuoteDraft?.open) return;
  const companyData = getPurchaseCompanyData(state);
  const nextDraft = {
    ...state.purchaseSupplierQuoteDraft,
    supplier_company: form.elements.namedItem("supplier_company")?.value || "",
    supplier_contact: form.elements.namedItem("supplier_contact")?.value || "",
    supplier_phone: form.elements.namedItem("supplier_phone")?.value || "",
    general_notes: form.elements.namedItem("general_notes")?.value || "",
    whatsapp_message: form.elements.namedItem("whatsapp_message")?.value || "",
  };
  if (!nextDraft.whatsapp_message.trim()) {
    nextDraft.whatsapp_message = buildDefaultPurchaseQuoteMessage(nextDraft, companyData, nextDraft.pdf_public_url || "[LINK_DO_PDF]");
  }
  state.purchaseSupplierQuoteDraft = nextDraft;
}

function updatePurchaseQuoteMessageLink(draft, companyData, nextLink) {
  const currentMessage = String(draft.whatsapp_message || "").trim()
    || buildDefaultPurchaseQuoteMessage(draft, companyData);
  const currentLink = draft.pdf_public_url || "[LINK_DO_PDF]";
  if (currentMessage.includes(currentLink)) {
    return currentMessage.replace(currentLink, nextLink);
  }
  if (currentMessage.includes("[LINK_DO_PDF]")) {
    return currentMessage.replace("[LINK_DO_PDF]", nextLink);
  }
  return currentMessage;
}

function renderPurchaseQuoteHtml(draft, companyData, helpers) {
  const rows = (draft.items || []).map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${helpers.escapeHtml(item.product_name || "-")}</td>
      <td>${helpers.escapeHtml(helpers.formatQuantity(item.quantity || 0))}</td>
      <td>${helpers.escapeHtml(item.unit || "un")}</td>
      <td>${helpers.escapeHtml([item.description, item.measures].filter(Boolean).join(" | ") || "-")}</td>
    </tr>
  `).join("");

  return `
    <article class="sales-document-sheet sales-document-sheet-quote">
      <div class="sales-print-shell">
        <header class="sales-print-header">
          <div class="sales-print-company">
            <span class="sales-print-company-name">${helpers.escapeHtml(companyData.company_name)}</span>
            <span><strong>CNPJ:</strong> ${helpers.escapeHtml(companyData.cnpj)}</span>
            <span><strong>Endereço:</strong> ${helpers.escapeHtml(companyData.address)}</span>
            <span><strong>Telefone:</strong> ${helpers.escapeHtml(companyData.phone)}</span>
            <span><strong>E-mail:</strong> ${helpers.escapeHtml(companyData.email)}</span>
          </div>
          <div class="sales-print-summary">
            <div class="sales-print-summary-row"><span>Solicitação de Cotação Nº</span><strong>${helpers.escapeHtml(draft.quote_number)}</strong></div>
            <div class="sales-print-summary-row"><span>Data</span><strong>${helpers.escapeHtml(formatPurchaseQuoteDate(draft.quote_date))}</strong></div>
          </div>
        </header>
        <section class="sales-print-block">
          <p><strong>Fornecedor:</strong></p>
          <p><strong>Empresa:</strong> ${helpers.escapeHtml(draft.supplier_company || "-")}</p>
          <p><strong>Contato:</strong> ${helpers.escapeHtml(draft.supplier_contact || "-")}</p>
        </section>
        <section class="sales-print-band">${helpers.escapeHtml(draft.subject || "Solicitação de Orçamento")}</section>
        <section class="sales-print-block">
          <p>Prezados,</p>
          <p>Solicitamos a cotação dos itens abaixo:</p>
        </section>
        <section class="sales-print-table-wrap">
          <table class="sales-document-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Unidade</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
        <section class="sales-print-block">
          <p><strong>Observações:</strong></p>
          <p>${helpers.escapeHtml(draft.general_notes || "-")}</p>
        </section>
        <section class="sales-print-signatures">
          <div class="sales-print-signature-card">
            <span class="sales-print-signature-line"></span>
            <strong>${helpers.escapeHtml(draft.requester_name || companyData.responsible_name || "-")}</strong>
            <span>${helpers.escapeHtml(companyData.responsible_role || "Setor de Compras")}</span>
            <span>${helpers.escapeHtml(companyData.company_name)}</span>
          </div>
        </section>
      </div>
    </article>
  `.trim();
}

function createPurchaseQuotePdfBlob(draft, companyData) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginLeft = 42;
  const marginRight = 42;
  const topMargin = 48;
  const bottomMargin = 48;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const tableColumns = [
    { key: "index", width: 34 },
    { key: "description", width: 224 },
    { key: "quantity", width: 58 },
    { key: "unit", width: 62 },
    { key: "notes", width: contentWidth - 34 - 224 - 58 - 62 },
  ];
  const pages = [];
  let currentPage = [];
  let cursorY = topMargin;

  const ensureSpace = (height) => {
    if (cursorY + height <= pageHeight - bottomMargin) return;
    pages.push(currentPage.join("\n"));
    currentPage = [];
    cursorY = topMargin;
  };
  const text = (value, x, y, size = 11, bold = false) => {
    const pdfY = pageHeight - y;
    currentPage.push(`BT /F${bold ? 2 : 1} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${pdfY.toFixed(2)} Tm (${escapePdfText(value)}) Tj ET`);
  };
  const line = (x1, y1, x2, y2) => {
    currentPage.push(`${x1.toFixed(2)} ${(pageHeight - y1).toFixed(2)} m ${x2.toFixed(2)} ${(pageHeight - y2).toFixed(2)} l S`);
  };
  const rect = (x, y, width, height, fillRgb = null) => {
    if (fillRgb) {
      currentPage.push(`${fillRgb[0]} ${fillRgb[1]} ${fillRgb[2]} rg`);
      currentPage.push(`${x.toFixed(2)} ${(pageHeight - y - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
      currentPage.push("0 0 0 rg");
    } else {
      currentPage.push(`${x.toFixed(2)} ${(pageHeight - y - height).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
    }
  };
  const paragraph = (value, x, maxChars, size = 11, bold = false, spacing = 14) => {
    const lines = wrapPdfText(value, maxChars);
    ensureSpace(lines.length * spacing + 2);
    lines.forEach((entry) => {
      text(entry, x, cursorY, size, bold);
      cursorY += spacing;
    });
  };
  const tableHeader = () => {
    ensureSpace(28);
    rect(marginLeft, cursorY - 14, contentWidth, 22, [0.89, 0.93, 0.97]);
    let x = marginLeft + 6;
    [["Item", tableColumns[0].width], ["Descrição", tableColumns[1].width], ["Qtd", tableColumns[2].width], ["Unidade", tableColumns[3].width], ["Observações", tableColumns[4].width]]
      .forEach(([label, width]) => {
        text(label, x, cursorY, 10, true);
        x += width;
      });
    cursorY += 18;
    line(marginLeft, cursorY - 8, marginLeft + contentWidth, cursorY - 8);
  };

  paragraph(companyData.company_name, marginLeft, 55, 15, true, 18);
  paragraph(`CNPJ: ${companyData.cnpj}`, marginLeft, 90, 10, false, 13);
  paragraph(`Endereço: ${companyData.address}`, marginLeft, 90, 10, false, 13);
  paragraph(`Telefone: ${companyData.phone}`, marginLeft, 90, 10, false, 13);
  paragraph(`E-mail: ${companyData.email}`, marginLeft, 90, 10, false, 13);
  cursorY += 10;
  paragraph(`Solicitação de Cotação Nº: ${draft.quote_number}`, marginLeft, 80, 11, true, 14);
  paragraph(`Data: ${formatPurchaseQuoteDate(draft.quote_date)}`, marginLeft, 80, 11, false, 14);
  cursorY += 8;
  paragraph("Fornecedor:", marginLeft, 80, 11, true, 14);
  paragraph(`Empresa: ${draft.supplier_company || "-"}`, marginLeft, 80, 11, false, 14);
  paragraph(`Contato: ${draft.supplier_contact || "-"}`, marginLeft, 80, 11, false, 14);
  cursorY += 8;
  paragraph(`Assunto: ${draft.subject || "Solicitação de Orçamento"}`, marginLeft, 80, 11, true, 14);
  cursorY += 4;
  paragraph("Prezados,", marginLeft, 90, 11, false, 14);
  paragraph("Solicitamos a cotação dos itens abaixo:", marginLeft, 90, 11, false, 14);
  cursorY += 8;
  tableHeader();

  (draft.items || []).forEach((item, index) => {
    const cells = [
      wrapPdfText(String(index + 1), 4),
      wrapPdfText(item.product_name || "-", 32),
      wrapPdfText(String(item.quantity || 0), 8),
      wrapPdfText(item.unit || "un", 10),
      wrapPdfText([item.description, item.measures].filter(Boolean).join(" | ") || "-", 26),
    ];
    const rowLineCount = Math.max(...cells.map((entry) => entry.length), 1);
    const rowHeight = Math.max(20, rowLineCount * 12 + 8);
    ensureSpace(rowHeight + 8);
    let columnX = marginLeft;
    tableColumns.forEach((column, columnIndex) => {
      rect(columnX, cursorY - 10, column.width, rowHeight);
      cells[columnIndex].forEach((entry, lineIndex) => {
        text(entry, columnX + 5, cursorY + (lineIndex * 11), 9.5, false);
      });
      columnX += column.width;
    });
    cursorY += rowHeight;
  });

  cursorY += 12;
  paragraph("Observações:", marginLeft, 90, 11, true, 14);
  paragraph(draft.general_notes || "-", marginLeft, 92, 10, false, 13);
  cursorY += 18;
  paragraph("Atenciosamente,", marginLeft, 90, 11, false, 14);
  paragraph(draft.requester_name || companyData.responsible_name || "-", marginLeft, 90, 11, true, 14);
  paragraph(companyData.responsible_role || "Setor de Compras", marginLeft, 90, 10, false, 13);
  paragraph(companyData.company_name, marginLeft, 90, 10, false, 13);

  pages.push(currentPage.join("\n"));

  const objects = [];
  const pushObject = (body) => {
    objects.push(body);
    return objects.length;
  };
  const catalogId = pushObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = pushObject("<< /Type /Pages /Kids [] /Count 0 >>");
  const fontRegularId = pushObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = pushObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageObjectIds = [];

  pages.forEach((pageContent) => {
    const contentId = pushObject(`<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream`);
    const pageId = pushObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageObjectIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

async function uploadPurchaseQuotePdf(state, draft, pdfBlob) {
  if (!state.supabase) {
    throw new Error("Conecte o sistema ao Supabase para publicar o PDF da cotação.");
  }

  const safeName = sanitizePurchaseQuoteFileName(draft.quote_number || `cotacao-${Date.now()}`);
  const now = new Date();
  const relativePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${safeName}.pdf`;
  let lastError = null;

  for (const bucket of PURCHASE_QUOTE_BUCKET_CANDIDATES) {
    const { error } = await state.supabase.storage
      .from(bucket)
      .upload(relativePath, pdfBlob, { contentType: "application/pdf", upsert: true });
    if (error) {
      lastError = error;
      continue;
    }

    const publicUrl = state.supabase.storage.from(bucket).getPublicUrl(relativePath)?.data?.publicUrl || "";
    if (publicUrl) {
      return { bucket, path: relativePath, publicUrl, fileName: `${safeName}.pdf` };
    }

    const { data, error: signedError } = await state.supabase.storage
      .from(bucket)
      .createSignedUrl(relativePath, 60 * 60 * 24 * 7);
    if (!signedError && data?.signedUrl) {
      return { bucket, path: relativePath, publicUrl: data.signedUrl, fileName: `${safeName}.pdf` };
    }
    lastError = signedError || new Error("Não foi possível gerar o link do PDF.");
  }

  throw new Error(
    `Não foi possível publicar o PDF da cotação no armazenamento. Verifique se existe um bucket como ${PURCHASE_QUOTE_BUCKET_CANDIDATES.join(", ")}. ${lastError ? String(lastError.message || lastError) : ""}`.trim()
  );
}

async function persistPurchaseSupplierQuote(state, helpers, draft) {
  if (!draft.request_id) return;
  const request = (state.moduleData.purchases || []).find((item) => item.id === draft.request_id);
  if (!request) return;
  const metadata = helpers.getPurchaseRequestMetadata(request);
  const quotationDetails = {
    quote_number: draft.quote_number,
    supplier_company: draft.supplier_company,
    supplier_contact: draft.supplier_contact,
    supplier_phone: draft.supplier_phone,
    general_notes: draft.general_notes,
    whatsapp_message: draft.whatsapp_message,
    pdf_file_name: draft.pdf_file_name || "",
    pdf_storage_bucket: draft.pdf_storage_bucket || "",
    pdf_storage_path: draft.pdf_storage_path || "",
    pdf_public_url: draft.pdf_public_url || "",
    pdf_generated_at: draft.pdf_generated_at || "",
  };
  const { error } = await state.supabase
    .from("purchase_requests")
    .update({
      purchase_details: {
        ...metadata.purchaseDetails,
        quotation_details: quotationDetails,
      },
    })
    .eq("id", draft.request_id);
  if (error) throw error;
}

function renderPurchaseSupplierQuoteModal(draft, state, helpers) {
  const companyData = getPurchaseCompanyData(state);
  const htmlPreview = renderPurchaseQuoteHtml(draft, companyData, helpers);

  return `
    <div class="modal-overlay sales-document-modal-overlay" data-purchase-supplier-quote-close>
      <div class="modal-card sales-document-modal" role="dialog" aria-modal="true" aria-label="Cotação para fornecedor">
        <div class="sales-config-header">
          <div>
            <p class="eyebrow muted">Compras</p>
            <h3>Cotação para Fornecedor</h3>
            <p class="muted">Gere um PDF A4, publique o link e envie pelo WhatsApp com a mensagem editável.</p>
          </div>
          <div class="sales-config-header-actions">
            <button class="ghost-button" type="button" data-purchase-supplier-quote-close-button>Fechar</button>
          </div>
        </div>

        <form id="purchase-supplier-quote-form" class="sales-config-form">
          <div class="sales-config-grid">
            <label>
              Número da cotação
              <input name="quote_number" type="text" readonly value="${helpers.escapeHtml(draft.quote_number || "")}" />
            </label>
            <label>
              Referência da solicitação
              <input name="request_number" type="text" readonly value="${helpers.escapeHtml(draft.request_number || "")}" />
            </label>
          </div>
          <div class="sales-config-grid">
            <label>
              Empresa do fornecedor
              <input name="supplier_company" type="text" value="${helpers.escapeHtml(draft.supplier_company || "")}" />
            </label>
            <label>
              Contato do fornecedor
              <input name="supplier_contact" type="text" value="${helpers.escapeHtml(draft.supplier_contact || "")}" />
            </label>
          </div>
          <div class="sales-config-grid">
            <label>
              Telefone / WhatsApp do fornecedor
              <input name="supplier_phone" type="text" inputmode="tel" placeholder="(11) 99999-9999" value="${helpers.escapeHtml(draft.supplier_phone || "")}" />
            </label>
            <label>
              Responsável
              <input type="text" readonly value="${helpers.escapeHtml(draft.requester_name || companyData.responsible_name || "")}" />
            </label>
          </div>
          <label>
            Observações gerais
            <textarea name="general_notes" placeholder="Observações gerais da cotação">${helpers.escapeHtml(draft.general_notes || "")}</textarea>
          </label>
          <label>
            Mensagem para WhatsApp
            <textarea name="whatsapp_message" placeholder="Mensagem editável para envio ao fornecedor">${helpers.escapeHtml(draft.whatsapp_message || "")}</textarea>
          </label>
          <div class="sales-config-grid">
            <label>
              Link do PDF
              <input type="text" readonly value="${helpers.escapeHtml(draft.pdf_public_url || "")}" />
            </label>
            <label>
              Última geração
              <input type="text" readonly value="${helpers.escapeHtml(draft.pdf_generated_at ? helpers.formatDateTime(draft.pdf_generated_at) : "Ainda não gerado")}" />
            </label>
          </div>
          <div class="form-actions-row sales-config-actions">
            <button class="secondary-button" type="button" data-purchase-supplier-quote-generate>Gerar PDF da Cotação</button>
            <button class="ghost-button" type="button" data-purchase-supplier-quote-copy-link ${draft.pdf_public_url ? "" : "disabled"}>Copiar link</button>
            <button class="ghost-button" type="button" data-purchase-supplier-quote-download ${draft.pdf_public_url ? "" : "disabled"}>Baixar PDF</button>
            <button class="primary-button" type="button" data-purchase-supplier-quote-whatsapp ${draft.pdf_public_url ? "" : "disabled"}>Enviar PDF pelo WhatsApp</button>
          </div>
        </form>

        <div class="sales-document-preview-frame sales-document-preview-modal-frame">${htmlPreview}</div>
      </div>
    </div>
  `;
}

function purchaseActionCell(item, canEdit, helpers) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  const metadata = item.metadata || helpers.getPurchaseRequestMetadata(item);
  const canConclude = metadata.status === "approved" || metadata.status === "in_purchase" || metadata.status === "purchase_completed";

  return `
    <div class="action-button-group">
      <button class="inline-button" type="button" data-purchase-view-id="${item.id}">Visualizar</button>
      <button class="inline-button" type="button" data-purchase-edit-id="${item.id}">Editar</button>
      <button class="inline-button" type="button" data-purchase-open-supplier-quote="${item.id}">PDF da cotação</button>
      ${
        metadata.status === "pending" || metadata.status === "in_analysis"
          ? `<button class="inline-button movement-button" type="button" data-purchase-status-action="${item.id}" data-purchase-next-status="approved">Aprovar</button>`
          : ""
      }
      ${
        metadata.status === "approved"
          ? `<button class="inline-button" type="button" data-purchase-status-action="${item.id}" data-purchase-next-status="purchase_completed">Marcar compra efetuada</button>`
          : ""
      }
      ${
        canConclude
          ? `<button class="inline-button" type="button" data-purchase-open-conclusion="${item.id}">Concluir compra</button>`
          : ""
      }
      <button class="inline-button" type="button" data-purchase-notify-id="${item.id}">Notificar</button>
      <button class="inline-button danger-button" type="button" data-purchase-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderPurchaseRow(item, canEdit, helpers) {
  return `
    <tr>
      <td>
        <strong>${helpers.escapeHtml(item.metadata.requester_name || "-")}</strong>
        <div class="table-inline-copy muted">${helpers.escapeHtml(item.metadata.primaryItemLabel || "Sem itens")}</div>
        <div class="table-inline-copy muted">${helpers.escapeHtml(item.metadata.primaryMeasuresLabel || "Sem medidas")}</div>
      </td>
      <td>${helpers.escapeHtml(item.metadata.department || "-")}</td>
      <td>${helpers.purchaseUrgencyCell(item.metadata.urgency)}</td>
      <td>${helpers.purchaseStatusCell(item.metadata.status)}</td>
      <td>${helpers.formatDateTime(item.created_at)}</td>
      <td>${purchaseActionCell(item, canEdit, helpers)}</td>
    </tr>
  `;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("purchases", "view")) {
      return helpers.noPermissionTemplate("Seu perfil não possui acesso ao módulo de compras.");
    }

    const canEdit = bridge.hasPermission("purchases", "edit");
    const isRequestFormOpen = state.openAccordionKey === "purchase-form";
    const isConclusionFormOpen = state.openAccordionKey === "purchase-conclusion-form";
    const requesterOptions = buildPurchaseRequesterOptions(state);
    const requests = (state.moduleData.purchases || []).map((item) => ({
      ...item,
      metadata: helpers.getPurchaseRequestMetadata(item),
    }));
    const searchTerm = state.purchaseSearch.trim().toLowerCase();
    const filteredRequests = requests.filter(({ metadata }) => {
      const searchableItems = (metadata.items || [])
        .map((purchaseItem) => [purchaseItem.product_name, purchaseItem.description, purchaseItem.unit].join(" "))
        .join(" ");
      const matchesSearch = !searchTerm
        || [
          metadata.requester_name,
          metadata.department,
          searchableItems,
          metadata.purchaseDetails.order_number,
          metadata.purchaseDetails.invoice_number,
          metadata.purchaseDetails.supplier,
        ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
      const matchesStatus = state.purchaseStatusFilter === "all" || metadata.status === state.purchaseStatusFilter;
      return matchesSearch && matchesStatus;
    });
    const conclusionRequest = requests.find((item) => item.id === state.purchaseConclusionDraft.request_id) || null;
    const pendingCount = requests.filter(({ metadata }) => metadata.status === "pending").length;
    const inPurchaseCount = requests.filter(({ metadata }) => metadata.status === "in_purchase").length;
    const completedCount = requests.filter(({ metadata }) => metadata.status === "completed").length;
    const notificationCount = requests.reduce((total, { metadata }) => total + (metadata.notifications || []).length, 0);
    const requestSummaryLabel = `${requests.length} ${requests.length === 1 ? "solicitação" : "solicitações"}`;

    return `
      <section class="module-panel purchases-module">
        <div class="module-head purchases-head">
          <div>
            <p class="eyebrow muted">Compras</p>
            <h3>Solicitação de Compras</h3>
            <p class="muted">${requestSummaryLabel}</p>
          </div>
          <div class="module-head-actions">
            <button class="topbar-icon-button purchase-alert-button" type="button" data-purchase-notification-center aria-label="Alertas de compras">
              <span>◔</span>
              ${notificationCount ? `<strong class="notification-pill">${notificationCount}</strong>` : ""}
            </button>
          </div>
        </div>

        <div class="summary-grid purchases-summary-grid">
          ${helpers.renderKpiCard({
            label: "Solicitações",
            value: requests.length,
            note: `${pendingCount} pendente(s) para analise`,
            icon: "◧",
            tone: "blue",
          })}
          ${helpers.renderKpiCard({
            label: "Em Compra",
            value: inPurchaseCount,
            note: inPurchaseCount ? "Pedidos em andamento" : "Nenhuma compra em andamento",
            icon: "◎",
            tone: "amber",
          })}
          ${helpers.renderKpiCard({
            label: "Concluídas",
            value: completedCount,
            note: completedCount ? "Compras finalizadas" : "Nenhuma compra concluída",
            icon: "◪",
            tone: "green",
          })}
        </div>

        ${
          canEdit
            ? `
              <div class="purchase-accordion-shell ${isRequestFormOpen ? "open" : ""}">
                <div class="purchase-accordion-card">
                  <div class="purchase-form-header">
                    <div>
                      <h4>${state.purchaseDraft.edit_id ? "Editar Solicitação" : "Nova Solicitação"}</h4>
                      <p class="muted">Accordion controlado, responsivo e preparado para integração com backend.</p>
                    </div>
                  </div>

                  <form id="purchase-form" class="purchase-form-grid">
                    <input type="hidden" name="edit_id" value="${helpers.escapeHtml(state.purchaseDraft.edit_id)}" />

                    <div class="purchase-form-row">
                      ${
                        requesterOptions.length
                          ? `
                            <label>
                              Solicitante *
                              <select name="requester_id" required>
                                <option value="">Selecione um solicitante</option>
                                ${helpers.renderOptions(requesterOptions, state.purchaseDraft.requester_id)}
                              </select>
                            </label>
                          `
                          : `
                            <label>
                              Solicitante *
                              <input name="requester_name" type="text" required value="${helpers.escapeHtml(state.purchaseDraft.requester_name)}" />
                            </label>
                          `
                      }
                      <label>
                        Departamento *
                        <select name="department" required>
                          ${helpers.renderOptions([
                            { value: "", label: "Selecione" },
                            { value: "Usinagem", label: "Usinagem" },
                            { value: "Montagem", label: "Montagem" },
                            { value: "Fabricação", label: "Fabricação" },
                            { value: "Compras", label: "Compras" },
                            { value: "Administrativo", label: "Administrativo" },
                            { value: "Financeiro", label: "Financeiro" },
                          ], state.purchaseDraft.department)}
                        </select>
                      </label>
                      <label>
                        Urgencia
                        <select name="urgency">
                          ${helpers.renderOptions([
                            { value: "baixa", label: "Baixa" },
                            { value: "media", label: "Media" },
                            { value: "alta", label: "Alta" },
                            { value: "urgente", label: "Urgente" },
                          ], state.purchaseDraft.urgency || "media")}
                        </select>
                      </label>
                    </div>

                    <div class="purchase-items-panel">
                      <div class="purchase-items-header">
                        <div>
                          <h5>Itens da solicitação</h5>
                          <p class="muted">Adicione varios itens e acompanhe o subtotal de cada linha.</p>
                        </div>
                        <button class="ghost-button" type="button" data-purchase-add-item>+ Adicionar</button>
                      </div>

                      <div class="purchase-items-list">
                        ${state.purchaseDraft.items.map((item, index) => renderPurchaseItemRow(item, index, helpers)).join("")}
                      </div>
                    </div>

                    <div class="purchase-form-row purchase-form-row-full">
                      <label>
                        Justificativa
                        <textarea name="justification" placeholder="Explique o motivo da compra">${helpers.escapeHtml(state.purchaseDraft.justification)}</textarea>
                      </label>
                    </div>

                    <div class="form-actions-row purchase-form-actions">
                      <button class="ghost-button" type="button" data-purchase-cancel>Cancelar</button>
                      <button class="secondary-button" type="button" data-purchase-open-supplier-quote-draft>Gerar PDF da Cotação</button>
                      <button class="primary-button" type="submit">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            `
            : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
        }

        ${
          canEdit
            ? `
              <div class="purchase-accordion-shell purchase-conclusion-shell ${isConclusionFormOpen ? "open" : ""}">
                <div class="purchase-accordion-card purchase-conclusion-card">
                  <div class="purchase-form-header">
                    <div>
                      <h4>Concluir Compra</h4>
                      <p class="muted">Registre pedido, nota fiscal, pagamento, anexos e a notificação ao solicitante.</p>
                    </div>
                  </div>

                  <form id="purchase-conclusion-form" class="purchase-form-grid">
                    <input type="hidden" name="request_id" value="${helpers.escapeHtml(state.purchaseConclusionDraft.request_id)}" />

                    <div class="purchase-form-row">
                      <label>
                        Número do pedido
                        <input name="order_number" type="text" placeholder="PED-20260407-001" value="${helpers.escapeHtml(state.purchaseConclusionDraft.order_number)}" />
                      </label>
                      <label>
                        Número da nota fiscal
                        <input name="invoice_number" type="text" placeholder="NF-000123" value="${helpers.escapeHtml(state.purchaseConclusionDraft.invoice_number)}" />
                      </label>
                      <label>
                        Valor total da compra *
                        <input
                          name="total_amount"
                          type="text"
                          inputmode="decimal"
                          data-currency-input="true"
                          data-currency-allow-empty="true"
                          value="${helpers.escapeHtml(state.purchaseConclusionDraft.total_amount)}"
                        />
                      </label>
                      <label>
                        Forma de Pagamento *
                        <select name="payment_method" required>
                          ${helpers.renderOptions([
                            { value: "", label: "Selecione" },
                            { value: "Dinheiro", label: "Dinheiro" },
                            { value: "Pix", label: "Pix" },
                            { value: "Cartão", label: "Cartão" },
                            { value: "Boleto", label: "Boleto" },
                            { value: "Notinha", label: "Notinha" },
                          ], state.purchaseConclusionDraft.payment_method)}
                        </select>
                      </label>
                    </div>

                    <div class="purchase-form-row">
                      <label>
                        Data da compra
                        <input name="purchase_date" type="date" value="${helpers.escapeHtml(state.purchaseConclusionDraft.purchase_date)}" />
                      </label>
                      <label>
                        Vencimento principal
                        <input name="due_date" type="date" value="${helpers.escapeHtml(state.purchaseConclusionDraft.due_date)}" />
                      </label>
                      <label>
                        Fornecedor
                        <input name="supplier" type="text" placeholder="Fornecedor" value="${helpers.escapeHtml(state.purchaseConclusionDraft.supplier)}" />
                      </label>
                    </div>

                    <div class="purchase-form-row purchase-form-row-full">
                      <label>
                        Observações da compra
                        <textarea name="purchase_notes" placeholder="Detalhes da compra">${helpers.escapeHtml(state.purchaseConclusionDraft.purchase_notes)}</textarea>
                      </label>
                    </div>

                    ${renderPurchaseStockEntryRows(conclusionRequest, state, helpers)}

                    <div class="purchase-upload-grid">
                      ${renderPurchaseUploadField("Arquivo do pedido", "order_files", state.purchaseConclusionDraft.order_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx", helpers)}
                      ${renderPurchaseUploadField("Arquivo da nota fiscal", "invoice_files", state.purchaseConclusionDraft.invoice_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx", helpers)}
                      ${renderPurchaseUploadField("Comprovantes adicionais", "attachment_files", state.purchaseConclusionDraft.attachment_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx", helpers, true)}
                    </div>

                    ${
                      state.purchaseConclusionDraft.payment_method === "Boleto"
                        ? `
                          <section class="purchase-items-panel">
                            <div class="purchase-items-header">
                              <div>
                                <h5>Parcelamento do boleto</h5>
                                <p class="muted">Cadastre de 1 a 5 parcelas, cada uma com valor, vencimento e upload do boleto.</p>
                              </div>
                              <button class="ghost-button" type="button" data-purchase-add-installment>+ Adicionar parcela</button>
                            </div>
                            <div class="purchase-items-list">
                              ${(state.purchaseConclusionDraft.installments || []).map((installment, index) => renderPurchaseInstallmentRow(installment, index, helpers)).join("")}
                            </div>
                          </section>
                        `
                        : ""
                    }

                    <div class="form-actions-row purchase-form-actions">
                      <button class="ghost-button" type="button" data-purchase-conclusion-cancel>Cancelar</button>
                      <button class="primary-button" type="submit">Salvar</button>
                    </div>
                  </form>
                </div>
              </div>
            `
            : ""
        }

        <div class="purchase-toolbar">
          <div class="purchase-toolbar-head">
            <div>
              <p class="eyebrow muted">Solicitações</p>
              <h4>${requests.length} solicitações</h4>
            </div>
            <div class="purchase-toolbar-actions">
              <button class="topbar-icon-button purchase-alert-button" type="button" data-purchase-inline-alert aria-label="Notificações">
                <span>◔</span>
              </button>
              ${
                canEdit
                  ? `
                    <button class="primary-button purchase-create-button ${isRequestFormOpen ? "is-open" : ""}" type="button" data-purchase-toggle-form>
                      <span>+ Nova Solicitação</span>
                      <span class="production-toggle-icon">${isRequestFormOpen ? "▴" : "▾"}</span>
                    </button>
                  `
                  : ""
              }
            </div>
          </div>

          <div class="table-actions purchases-filters-row">
            <label class="search-input-shell">
              <span class="search-input-icon">⌕</span>
              <input id="purchase-search-input" type="text" placeholder="Buscar..." value="${helpers.escapeHtml(state.purchaseSearch)}" />
            </label>
            <label>
              Status
              <select id="purchase-status-filter">
                ${helpers.renderOptions([
                  { value: "all", label: "Todos" },
                  { value: "pending", label: "Pendente" },
                  { value: "in_analysis", label: "Em analise" },
                  { value: "approved", label: "Aprovada" },
                  { value: "in_purchase", label: "Em compra" },
                  { value: "purchase_completed", label: "Compra efetuada" },
                  { value: "completed", label: "Concluída" },
                  { value: "cancelled", label: "Cancelada" },
                ], state.purchaseStatusFilter)}
              </select>
            </label>
          </div>
        </div>

        <div class="table-card purchase-table-card">
          ${
            filteredRequests.length
              ? `
                <table>
                  <thead>
                    <tr>
                      <th>Solicitante</th>
                      <th>Departamento</th>
                      <th>Urgencia</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredRequests.map(({ id, created_at, metadata }) => renderPurchaseRow({ id, created_at, metadata }, canEdit, helpers)).join("")}
                  </tbody>
                </table>
              `
              : `
                <div class="production-empty-state purchase-empty-state">
                  <div class="production-empty-icon">◧</div>
                  <strong>Nenhuma solicitação encontrada</strong>
                </div>
              `
          }
        </div>

        ${
          state.purchaseSupplierQuoteDraft?.open
            ? renderPurchaseSupplierQuoteModal(state.purchaseSupplierQuoteDraft, state, helpers)
            : ""
        }
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;
    const companyData = getPurchaseCompanyData(state);

    const closePurchaseSupplierQuote = () => {
      state.purchaseSupplierQuoteDraft = { open: false };
      helpers.renderActiveModule();
    };

    const generatePurchaseSupplierQuotePdf = async () => {
      const form = document.querySelector("#purchase-supplier-quote-form");
      syncPurchaseSupplierQuoteDraftFromForm(form, state, helpers);
      const draft = state.purchaseSupplierQuoteDraft;
      if (!draft?.open) return null;

      if (!draft.supplier_company.trim()) {
        helpers.showPurchaseNotification("Informe a empresa do fornecedor para gerar a cotação.", "warning");
        return null;
      }

      const pdfBlob = createPurchaseQuotePdfBlob(draft, companyData);
      const upload = await uploadPurchaseQuotePdf(state, draft, pdfBlob);
      const publicUrl = upload.publicUrl;
      state.purchaseSupplierQuoteDraft = {
        ...draft,
        pdf_file_name: upload.fileName,
        pdf_storage_bucket: upload.bucket,
        pdf_storage_path: upload.path,
        pdf_public_url: publicUrl,
        pdf_generated_at: new Date().toISOString(),
        whatsapp_message: updatePurchaseQuoteMessageLink(draft, companyData, publicUrl),
      };
      await persistPurchaseSupplierQuote(state, helpers, state.purchaseSupplierQuoteDraft);
      await helpers.loadTable("purchase_requests", "purchases");
      helpers.renderActiveModule();
      helpers.showPurchaseNotification("PDF da cotação gerado e publicado com sucesso.", "approved");
      return state.purchaseSupplierQuoteDraft;
    };

    document.querySelectorAll("[data-purchase-toggle-form]").forEach((button) => {
      button.addEventListener("click", () => {
        const shouldOpen = state.openAccordionKey !== "purchase-form";
        state.openAccordionKey = shouldOpen ? "purchase-form" : null;
        state.purchaseDraft = helpers.createEmptyPurchaseDraft();
        if (shouldOpen) {
          state.purchaseDraft.requester_id = state.currentUser?.user_id || "";
          state.purchaseDraft.requester_name = helpers.getLoggedUserName("");
        }
        helpers.renderActiveModule();
        if (shouldOpen) {
          document.querySelector("#purchase-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    helpers.bindDeferredTextFilter("#purchase-search-input", (value) => {
      state.purchaseSearch = value;
    });

    helpers.bindDeferredSelectFilter("#purchase-status-filter", (value) => {
      state.purchaseStatusFilter = value;
    });

    const purchaseForm = document.querySelector("#purchase-form");
    if (purchaseForm) {
      purchaseForm.addEventListener("submit", helpers.handlePurchaseSubmit);
      purchaseForm.addEventListener("input", () => helpers.syncPurchaseDraftFromForm(purchaseForm));
      purchaseForm.addEventListener("change", () => helpers.syncPurchaseDraftFromForm(purchaseForm));
    }

    const requesterField = document.querySelector('#purchase-form select[name="requester_id"]');
    if (requesterField) {
      requesterField.addEventListener("change", helpers.handlePurchaseRequesterSelection);
    }

    const cancelButton = document.querySelector("[data-purchase-cancel]");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        helpers.resetPurchaseFormState();
        helpers.renderActiveModule();
      });
    }

    const addItemButton = document.querySelector("[data-purchase-add-item]");
    if (addItemButton) {
      addItemButton.addEventListener("click", () => {
        state.purchaseDraft.items.push(helpers.createEmptyPurchaseItemDraft());
        helpers.renderActiveModule();
      });
    }

    document.querySelector("[data-purchase-open-supplier-quote-draft]")?.addEventListener("click", () => {
      helpers.syncPurchaseDraftFromForm(document.querySelector("#purchase-form"));
      const draft = createPurchaseSupplierQuoteDraft(state, helpers);
      if (!draft) return;
      state.purchaseSupplierQuoteDraft = draft;
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-purchase-remove-item]").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.purchaseDraft.items.length === 1) {
          state.purchaseDraft.items = [helpers.createEmptyPurchaseItemDraft()];
        } else {
          state.purchaseDraft.items.splice(Number(button.dataset.purchaseRemoveItem), 1);
        }
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-purchase-item-field]").forEach((field) => {
      field.addEventListener("input", helpers.handlePurchaseItemFieldChange);
      field.addEventListener("change", helpers.handlePurchaseItemFieldChange);
    });

    document.querySelectorAll("[data-purchase-view-id], [data-purchase-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const recordId = button.dataset.purchaseViewId || button.dataset.purchaseEditId;
        const request = (state.moduleData.purchases || []).find((item) => item.id === recordId);
        if (!request) return;
        state.purchaseDraft = helpers.hydratePurchaseDraft(request);
        state.openAccordionKey = "purchase-form";
        await helpers.renderActiveModule();
        document.querySelector("#purchase-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-purchase-open-supplier-quote]").forEach((button) => {
      button.addEventListener("click", () => {
        const draft = createPurchaseSupplierQuoteDraft(state, helpers, button.dataset.purchaseOpenSupplierQuote);
        if (!draft) return;
        state.purchaseSupplierQuoteDraft = draft;
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-purchase-open-conclusion]").forEach((button) => {
      button.addEventListener("click", async () => {
        const request = (state.moduleData.purchases || []).find((item) => item.id === button.dataset.purchaseOpenConclusion);
        if (!request) return;
        state.purchaseConclusionDraft = helpers.hydratePurchaseConclusionDraft(request);
        state.openAccordionKey = "purchase-conclusion-form";
        await helpers.renderActiveModule();
        document.querySelector("#purchase-conclusion-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-purchase-status-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const request = (state.moduleData.purchases || []).find((item) => item.id === button.dataset.purchaseStatusAction);
        if (!request) return;
        try {
          await helpers.updatePurchaseRequestStatus(request, button.dataset.purchaseNextStatus);
          await helpers.loadTable("purchase_requests", "purchases");
          await helpers.renderActiveModule();
        } catch (error) {
          helpers.showPurchaseNotification(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-purchase-delete-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          const { error } = await state.supabase.from("purchase_requests").delete().eq("id", button.dataset.purchaseDeleteId);
          if (error) throw error;
          await helpers.loadTable("purchase_requests", "purchases");
          helpers.resetPurchaseFormState();
          helpers.resetPurchaseConclusionState();
          await helpers.renderActiveModule();
          helpers.showPurchaseNotification("Solicitação excluída com sucesso.", "approved");
        } catch (error) {
          helpers.showPurchaseNotification(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-purchase-notify-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const request = (state.moduleData.purchases || []).find((item) => item.id === button.dataset.purchaseNotifyId);
        if (!request) return;
        try {
          await helpers.notifyPurchaseRequester(request, helpers.buildPurchaseRequesterMessage(helpers.getPurchaseRequestMetadata(request)));
          await helpers.loadTable("purchase_requests", "purchases");
          await helpers.renderActiveModule();
        } catch (error) {
          helpers.showPurchaseNotification(helpers.formatError(error), "danger");
        }
      });
    });

    document.querySelectorAll("[data-purchase-notification-center], [data-purchase-inline-alert]").forEach((button) => {
      button.addEventListener("click", () => {
        const latestNotifications = (state.moduleData.purchases || [])
          .flatMap((item) => helpers.getPurchaseRequestMetadata(item).notifications || [])
          .slice(0, 4)
          .map((notification) => notification.message)
          .filter(Boolean);
        helpers.showPurchaseNotification(latestNotifications[0] || "Sem novos avisos de compras.", latestNotifications.length ? "notified" : "approved");
      });
    });

    const purchaseConclusionForm = document.querySelector("#purchase-conclusion-form");
    if (purchaseConclusionForm) {
      purchaseConclusionForm.addEventListener("submit", helpers.handlePurchaseConclusionSubmit);
      purchaseConclusionForm.addEventListener("input", () => helpers.syncPurchaseConclusionDraftFromForm(purchaseConclusionForm));
      purchaseConclusionForm.addEventListener("change", () => helpers.syncPurchaseConclusionDraftFromForm(purchaseConclusionForm));
    }

    document.querySelector('#purchase-conclusion-form select[name="payment_method"]')?.addEventListener("change", async () => {
      helpers.syncPurchaseConclusionDraftFromForm(document.querySelector("#purchase-conclusion-form"));
      await helpers.renderActiveModule();
    });

    const purchaseConclusionCancel = document.querySelector("[data-purchase-conclusion-cancel]");
    if (purchaseConclusionCancel) {
      purchaseConclusionCancel.addEventListener("click", () => {
        helpers.resetPurchaseConclusionState();
        helpers.renderActiveModule();
      });
    }

    document.querySelectorAll("[data-purchase-upload]").forEach((input) => {
      input.addEventListener("change", helpers.handlePurchaseFileSelection);
    });

    document.querySelectorAll("[data-purchase-remove-file]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.removePurchaseFile(button.dataset.purchaseRemoveFile, Number(button.dataset.purchaseFileIndex));
        helpers.renderActiveModule();
      });
    });

    document.querySelector("[data-purchase-add-installment]")?.addEventListener("click", () => {
      helpers.addPurchaseInstallment();
      helpers.renderActiveModule();
    });

    document.querySelectorAll("[data-purchase-installment-field]").forEach((field) => {
      field.addEventListener("input", helpers.handlePurchaseInstallmentFieldChange);
      field.addEventListener("change", helpers.handlePurchaseInstallmentFieldChange);
    });

    document.querySelectorAll("[data-purchase-remove-installment]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.removePurchaseInstallment(Number(button.dataset.purchaseRemoveInstallment));
        helpers.renderActiveModule();
      });
    });

    document.querySelectorAll("[data-purchase-installment-upload-index]").forEach((input) => {
      input.addEventListener("change", helpers.handlePurchaseInstallmentFileSelection);
    });

    document.querySelectorAll("[data-purchase-remove-installment-file]").forEach((button) => {
      button.addEventListener("click", () => {
        helpers.removePurchaseInstallmentFile(
          Number(button.dataset.purchaseRemoveInstallmentFile),
          Number(button.dataset.purchaseInstallmentFileIndex)
        );
        helpers.renderActiveModule();
      });
    });

    document.querySelector("#purchase-supplier-quote-form")?.addEventListener("input", () => {
      syncPurchaseSupplierQuoteDraftFromForm(document.querySelector("#purchase-supplier-quote-form"), state, helpers);
    });

    document.querySelector("#purchase-supplier-quote-form")?.addEventListener("change", () => {
      syncPurchaseSupplierQuoteDraftFromForm(document.querySelector("#purchase-supplier-quote-form"), state, helpers);
    });

    document.querySelector("[data-purchase-supplier-quote-close-button]")?.addEventListener("click", closePurchaseSupplierQuote);

    document.querySelector("[data-purchase-supplier-quote-close]")?.addEventListener("click", (event) => {
      if (event.target.hasAttribute("data-purchase-supplier-quote-close")) {
        closePurchaseSupplierQuote();
      }
    });

    document.querySelector("[data-purchase-supplier-quote-generate]")?.addEventListener("click", async () => {
      try {
        await generatePurchaseSupplierQuotePdf();
      } catch (error) {
        helpers.showPurchaseNotification(helpers.formatError(error), "danger");
      }
    });

    document.querySelector("[data-purchase-supplier-quote-copy-link]")?.addEventListener("click", async () => {
      if (!state.purchaseSupplierQuoteDraft?.pdf_public_url) return;
      try {
        await navigator.clipboard.writeText(state.purchaseSupplierQuoteDraft.pdf_public_url);
        helpers.showPurchaseNotification("Link do PDF copiado com sucesso.", "approved");
      } catch (error) {
        helpers.showPurchaseNotification(helpers.formatError(error), "danger");
      }
    });

    document.querySelector("[data-purchase-supplier-quote-download]")?.addEventListener("click", () => {
      if (!state.purchaseSupplierQuoteDraft?.pdf_public_url) return;
      window.open(state.purchaseSupplierQuoteDraft.pdf_public_url, "_blank", "noopener,noreferrer");
    });

    document.querySelector("[data-purchase-supplier-quote-whatsapp]")?.addEventListener("click", async () => {
      try {
        const form = document.querySelector("#purchase-supplier-quote-form");
        syncPurchaseSupplierQuoteDraftFromForm(form, state, helpers);
        let draft = state.purchaseSupplierQuoteDraft;
        if (!draft?.pdf_public_url) {
          draft = await generatePurchaseSupplierQuotePdf();
        }
        if (!draft) return;
        const phone = normalizePhoneBrForWhatsApp(draft.supplier_phone);
        const text = encodeURIComponent(draft.whatsapp_message || "");
        const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
        window.open(url, "_blank", "noopener,noreferrer");
        helpers.showPurchaseNotification("WhatsApp aberto com a mensagem da cotação.", "approved");
      } catch (error) {
        helpers.showPurchaseNotification(helpers.formatError(error), "danger");
      }
    });
  },
};
