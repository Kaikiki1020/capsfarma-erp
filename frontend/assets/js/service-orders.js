const SERVICE_ORDERS_STORAGE_KEY = "capsfarma_service_orders";
const SERVICE_ORDER_CHECKLISTS_STORAGE_KEY = "capsfarma_service_order_checklists";
const SERVICE_ORDER_NOTIFICATION_SEEN_KEY = "capsfarma_service_order_notification_seen";
const SERVICE_ORDER_MODULE_TABS = [
  { key: "orders", label: "Ordens de Serviço" },
  { key: "checklists", label: "Checklists" },
];
const SERVICE_ORDER_STATUSES = [
  { value: "open", label: "Aberta", chip: "status-open" },
  { value: "analysis", label: "Em analise", chip: "status-pending" },
  { value: "approval", label: "Aguardando aprovacao", chip: "status-pending" },
  { value: "in_progress", label: "Em andamento", chip: "status-planned" },
  { value: "waiting_material", label: "Aguardando material", chip: "status-pending" },
  { value: "waiting_production", label: "Aguardando producao", chip: "status-pending" },
  { value: "paused", label: "Pausada", chip: "status-rejected" },
  { value: "completed", label: "Concluida", chip: "status-completed" },
  { value: "cancelled", label: "Cancelada", chip: "status-cancelled" },
];
const SERVICE_ORDER_PRIORITIES = [
  { value: "low", label: "Baixa", className: "service-order-priority-low" },
  { value: "medium", label: "Media", className: "service-order-priority-medium" },
  { value: "high", label: "Alta", className: "service-order-priority-high" },
  { value: "urgent", label: "Urgente", className: "service-order-priority-urgent" },
];
const SERVICE_ORDER_TYPES = ["Interna", "Externa", "Corretiva", "Preventiva", "Instalacao", "Assistencia tecnica", "Suporte"];
const SERVICE_ORDER_SECTORS = ["Comercial", "Financeiro", "TI", "Usinagem", "Montagem", "Fabricacao", "Logistica", "Pos-venda"];
const SERVICE_ORDER_FORM_TABS = [
  { key: "details", label: "Dados da O.S." },
  { key: "checklist", label: "Checklist" },
];
const SERVICE_ORDER_CHECKLIST_EQUIPMENT_TYPES = ["CAPS 05", "CAPS 10", "CAPS 30"];
const SERVICE_ORDER_CHECKLIST_SERVICE_TYPES = ["Instalacao", "Manutencao"];
const SERVICE_ORDER_CHECKLIST_GROUPS = [
  {
    key: "electrical",
    title: "Funcionamento Eletrico",
    items: ["Abertura", "Envase", "Bomba de Vacuo"],
  },
  {
    key: "mechanical",
    title: "Funcionamento Mecanico",
    items: ["Abertura", "Envase", "Fechamento", "Bomba de Vacuo"],
  },
  {
    key: "training",
    title: "Treinamento",
    items: ["Funcionamento", "Limpeza da Maquina", "Limpeza do Filtro", "Lubrificacao", "Teste com Capsulas"],
  },
];

function createServiceOrderUid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `so-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function createEmptyServiceOrderMaterial() {
  return {
    id: createServiceOrderUid(),
    product_id: "",
    product_name: "",
    product_code: "",
    quantity: "1",
    unit: "un",
    notes: "",
    confirmed: false,
    confirmed_at: "",
    confirmed_by_name: "",
    movement_registered: false,
  };
}

function createEmptyServiceOrderChecklist() {
  return {
    service_date: new Date().toISOString().slice(0, 10),
    customer_location: "",
    equipment_type: "",
    service_type: "",
    machine_serial: "",
    groups: Object.fromEntries(
      SERVICE_ORDER_CHECKLIST_GROUPS.map((group) => [
        group.key,
        group.items.map((label) => ({
          label,
          status: "",
          observation: "",
        })),
      ])
    ),
    general_observations: "",
    caps_responsible_name: "",
    caps_responsible_cpf: "",
    caps_signature: "",
    customer_responsible_name: "",
    customer_responsible_document: "",
    customer_signature: "",
  };
}

function createEmptyServiceOrderChecklistDraft() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  return {
    edit_id: "",
    checklist_number: "",
    service_order_id: "",
    service_order_number: "",
    customer_id: "",
    customer_name: "",
    customer_document: "",
    customer_phone: "",
    customer_email: "",
    customer_location: "",
    service_date: today,
    equipment_type: "",
    service_type: "",
    machine_serial: "",
    checklist_groups: createEmptyServiceOrderChecklist().groups,
    general_observations: "",
    caps_responsible_name: "",
    caps_responsible_cpf: "",
    caps_signature: "",
    customer_responsible_name: "",
    customer_responsible_document: "",
    customer_signature: "",
    status: "draft",
    finalized: false,
    finalized_at: "",
    finalized_by_user_id: "",
    finalized_by_name: "",
    created_by_user_id: "",
    created_by_name: "",
    updated_by_user_id: "",
    updated_by_name: "",
  };
}

function createEmptyServiceOrderChecklistFilters() {
  return {
    search: "",
    customer_id: "all",
    equipment_type: "all",
    status: "all",
    date_from: "",
    date_to: "",
  };
}

function generateServiceOrderChecklistNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + String(now.getSeconds()).padStart(2, "0");
  return `CHK-${stamp}-${suffix}`;
}

function normalizeServiceOrderChecklist(checklist) {
  const base = createEmptyServiceOrderChecklist();
  const normalizedGroups = {};

  SERVICE_ORDER_CHECKLIST_GROUPS.forEach((group) => {
    const sourceItems = Array.isArray(checklist?.groups?.[group.key]) ? checklist.groups[group.key] : [];
    normalizedGroups[group.key] = group.items.map((label, index) => ({
      label,
      status: sourceItems[index]?.status === "nao_ok" ? "nao_ok" : sourceItems[index]?.status === "ok" ? "ok" : "",
      observation: sourceItems[index]?.observation || "",
    }));
  });

  return {
    ...base,
    ...checklist,
    service_date: checklist?.service_date || base.service_date,
    customer_location: checklist?.customer_location || "",
    equipment_type: checklist?.equipment_type || "",
    service_type: checklist?.service_type || "",
    machine_serial: String(checklist?.machine_serial || "")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 10)
      .toUpperCase(),
    groups: normalizedGroups,
    general_observations: checklist?.general_observations || "",
    caps_responsible_name: checklist?.caps_responsible_name || getLoggedUserName(""),
    caps_responsible_cpf: checklist?.caps_responsible_cpf || "",
    caps_signature: checklist?.caps_signature || "",
    customer_responsible_name: checklist?.customer_responsible_name || "",
    customer_responsible_document: checklist?.customer_responsible_document || "",
    customer_signature: checklist?.customer_signature || "",
  };
}

function normalizeServiceOrderChecklistRecord(record) {
  const normalized = {
    ...createEmptyServiceOrderChecklistDraft(),
    ...record,
    id: record?.id || record?.edit_id || createServiceOrderUid(),
    checklist_number: record?.checklist_number || generateServiceOrderChecklistNumber(),
    service_order_id: record?.service_order_id || "",
    service_order_number: record?.service_order_number || "",
    customer_id: record?.customer_id || "",
    customer_name: record?.customer_name || "",
    customer_document: record?.customer_document || "",
    customer_phone: record?.customer_phone || "",
    customer_email: record?.customer_email || "",
    customer_location: record?.customer_location || "",
    service_date: record?.service_date || new Date().toISOString().slice(0, 10),
    equipment_type: record?.equipment_type || "",
    service_type: record?.service_type || "",
    machine_serial: String(record?.machine_serial || "").replace(/[^a-z0-9]/gi, "").slice(0, 10).toUpperCase(),
    checklist_groups: normalizeServiceOrderChecklist({ groups: record?.checklist_groups || record?.groups || {} }).groups,
    general_observations: record?.general_observations || "",
    caps_responsible_name: record?.caps_responsible_name || getLoggedUserName(""),
    caps_responsible_cpf: record?.caps_responsible_cpf || "",
    caps_signature: record?.caps_signature || "",
    customer_responsible_name: record?.customer_responsible_name || "",
    customer_responsible_document: record?.customer_responsible_document || "",
    customer_signature: record?.customer_signature || "",
    status: record?.status === "finalized" ? "finalized" : "draft",
    finalized: Boolean(record?.finalized || record?.status === "finalized"),
    finalized_at: record?.finalized_at || "",
    finalized_by_user_id: record?.finalized_by_user_id || "",
    finalized_by_name: record?.finalized_by_name || "",
    created_by_user_id: record?.created_by_user_id || "",
    created_by_name: record?.created_by_name || "",
    updated_by_user_id: record?.updated_by_user_id || "",
    updated_by_name: record?.updated_by_name || "",
    created_at: record?.created_at || new Date().toISOString(),
    updated_at: record?.updated_at || record?.created_at || new Date().toISOString(),
  };
  return normalized;
}

function getServiceOrderChecklistStoredItems() {
  try {
    return JSON.parse(localStorage.getItem(SERVICE_ORDER_CHECKLISTS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveServiceOrderChecklistStoredItems(items) {
  localStorage.setItem(SERVICE_ORDER_CHECKLISTS_STORAGE_KEY, JSON.stringify(items || []));
}

function getServiceOrderCompanyProfile() {
  const company = state.salesDocumentSettings?.company || {};
  return {
    company_name: company.company_name || "CAPSFARMA LTDA",
    cnpj: company.cnpj || "26.295.701/0001-99",
    state_registration: company.state_registration || "002841750.00-14",
    address: company.address || "",
    phone: company.phone || "",
    email: company.email || "",
    site: company.site || "",
    logo: company.logo || "",
  };
}

function getServiceOrderChecklistStatusLabel(status) {
  if (status === "ok") return "OK";
  if (status === "nao_ok") return "NAO OK";
  return "Pendente";
}

function renderServiceOrderChecklistStatusBadge(status) {
  const className = status === "ok" ? "status-completed" : status === "nao_ok" ? "status-cancelled" : "status-pending";
  return `<span class="status-chip ${className}">${escapeHtml(getServiceOrderChecklistStatusLabel(status))}</span>`;
}

function isServiceOrderChecklistDigitalSignature(value) {
  return String(value || "").startsWith("data:image/");
}

function getServiceOrderChecklistPhysicalSignatureText() {
  return "Assinatura fisica no impresso";
}

function renderServiceOrderChecklistSignatureInput(name, value) {
  const hasDigitalSignature = isServiceOrderChecklistDigitalSignature(value);
  const statusText = hasDigitalSignature
    ? "Assinatura digital capturada"
    : value
      ? value
      : "Assinatura pendente";

  return `
    <input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value || "")}" />
    <div class="service-order-signature-status ${hasDigitalSignature ? "is-digital" : ""}">
      <span>${escapeHtml(statusText)}</span>
    </div>
  `;
}

function renderServiceOrderChecklistSignatureForPrint(value) {
  if (isServiceOrderChecklistDigitalSignature(value)) {
    return `<img class="checklist-print-signature-image" src="${escapeHtml(value)}" alt="Assinatura digital" />`;
  }
  return `<span class="checklist-print-signature-line"></span>`;
}

function getServiceOrderChecklistAdminIds() {
  return getAssignableServiceOrderUsers()
    .filter((item) => ["ADMINISTRADOR", "TI"].includes(String(item.raw.role || "").trim().toUpperCase()))
    .map((item) => item.value);
}

function validateServiceOrderChecklist(checklist) {
  if (!checklist.service_date) return "Informe a data do atendimento no checklist.";
  if (!checklist.customer_location.trim()) return "Informe o local do atendimento no checklist.";
  if (!checklist.equipment_type) return "Selecione o equipamento no checklist.";
  if (!checklist.service_type) return "Selecione o tipo de serviço no checklist.";
  if (!/^[A-Z0-9]{1,10}$/i.test(checklist.machine_serial || "")) {
    return "Informe o N/S da maquina com 1 a 10 letras ou numeros.";
  }

  for (const group of SERVICE_ORDER_CHECKLIST_GROUPS) {
    const items = checklist.groups?.[group.key] || [];
    for (const item of items) {
      if (!item.status) {
        return `Marque todos os itens do bloco ${group.title}.`;
      }
      if (item.status === "nao_ok" && !String(item.observation || "").trim()) {
        return `Preencha a observacao do item ${item.label} em ${group.title}.`;
      }
    }
  }

  if (!String(checklist.caps_responsible_name || "").trim()) return "Responsavel CAPSFARMA nao identificado.";
  if (!String(checklist.caps_responsible_cpf || "").trim()) return "Informe o CPF do responsavel CAPSFARMA.";
  if (!String(checklist.caps_signature || "").trim()) return "Preencha a assinatura do responsavel CAPSFARMA.";
  if (!String(checklist.customer_responsible_name || "").trim()) return "Informe o responsavel do cliente.";
  if (!String(checklist.customer_responsible_document || "").trim()) return "Informe o CPF/CNPJ do responsavel do cliente.";
  if (!String(checklist.customer_signature || "").trim()) return "Preencha a assinatura do responsavel do cliente.";

  return "";
}

function createEmptyServiceOrderDraft() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  return {
    edit_id: "",
    order_number: "",
    opened_at: today,
    created_by_user_id: "",
    created_by_name: "",
    sector: "",
    order_type: "Interna",
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_document: "",
    customer_address: "",
    title: "",
    description: "",
    reported_problem: "",
    planned_solution: "",
    internal_notes: "",
    priority: "medium",
    status: "open",
    started_at: "",
    deadline_at: "",
    expected_completion_at: "",
    completed_at: "",
    estimated_time: "",
    actual_time: "",
    responsible_user_id: "",
    responsible_name: "",
    assistant_user_ids: [],
    assistant_names: [],
    estimated_cost: "",
    final_cost: "",
    financial_notes: "",
    materials: [createEmptyServiceOrderMaterial()],
    linked_production_id: "",
    linked_production_number: "",
    production_demand_requested: false,
    production_demand_notes: "",
    result_summary: "",
    final_notes: "",
    checklist_data: createEmptyServiceOrderChecklist(),
    checklist_finalized: false,
    checklist_finalized_at: "",
    checklist_finalized_by_name: "",
    history_entries: [],
    progress_entries: [],
    notifications: [],
  };
}

function createEmptyServiceOrderFilters() {
  return {
    search: "",
    status: "all",
    priority: "all",
    customer_id: "all",
    responsible_user_id: "all",
    sector: "all",
    order_type: "all",
    has_production_link: "all",
    has_stock_link: "all",
    date_from: "",
    date_to: "",
  };
}

function getServiceOrderStatusConfig(status) {
  return SERVICE_ORDER_STATUSES.find((item) => item.value === status) || SERVICE_ORDER_STATUSES[0];
}

function getServiceOrderPriorityConfig(priority) {
  return SERVICE_ORDER_PRIORITIES.find((item) => item.value === priority) || SERVICE_ORDER_PRIORITIES[1];
}

function renderServiceOrderStatusBadge(status) {
  const config = getServiceOrderStatusConfig(status);
  return `<span class="status-chip ${config.chip}">${escapeHtml(config.label)}</span>`;
}

function renderServiceOrderPriorityBadge(priority) {
  const config = getServiceOrderPriorityConfig(priority);
  return `<span class="service-order-priority ${config.className}">${escapeHtml(config.label)}</span>`;
}

function getServiceOrderStoredItems() {
  try {
    return JSON.parse(localStorage.getItem(SERVICE_ORDERS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveServiceOrderStoredItems(items) {
  localStorage.setItem(SERVICE_ORDERS_STORAGE_KEY, JSON.stringify(items || []));
}

function getServiceOrderSeenNotifications() {
  try {
    return JSON.parse(localStorage.getItem(SERVICE_ORDER_NOTIFICATION_SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistServiceOrderSeenNotifications(payload) {
  localStorage.setItem(SERVICE_ORDER_NOTIFICATION_SEEN_KEY, JSON.stringify(payload || {}));
}

function normalizeServiceOrderMaterial(item) {
  return {
    id: item?.id || createServiceOrderUid(),
    product_id: item?.product_id || "",
    product_name: item?.product_name || "",
    product_code: item?.product_code || "",
    quantity: String(item?.quantity ?? "1"),
    unit: item?.unit || "un",
    notes: item?.notes || "",
    confirmed: Boolean(item?.confirmed),
    confirmed_at: item?.confirmed_at || "",
    confirmed_by_name: item?.confirmed_by_name || "",
    movement_registered: Boolean(item?.movement_registered),
  };
}

function normalizeServiceOrderRecord(order) {
  const normalized = {
    ...createEmptyServiceOrderDraft(),
    ...order,
    id: order?.id || order?.edit_id || createServiceOrderUid(),
    order_number: order?.order_number || generateServiceOrderNumber(),
    opened_at: order?.opened_at || order?.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    customer_id: order?.customer_id || "",
    customer_name: order?.customer_name || "",
    customer_phone: order?.customer_phone || "",
    customer_email: order?.customer_email || "",
    customer_document: order?.customer_document || "",
    customer_address: order?.customer_address || "",
    priority: order?.priority || "medium",
    status: order?.status || "open",
    assistant_user_ids: Array.isArray(order?.assistant_user_ids) ? order.assistant_user_ids : [],
    assistant_names: Array.isArray(order?.assistant_names) ? order.assistant_names : [],
    materials: Array.isArray(order?.materials) ? order.materials.map(normalizeServiceOrderMaterial) : [createEmptyServiceOrderMaterial()],
    history_entries: Array.isArray(order?.history_entries) ? order.history_entries : [],
    progress_entries: Array.isArray(order?.progress_entries) ? order.progress_entries : [],
    notifications: Array.isArray(order?.notifications) ? order.notifications : [],
    production_demand_requested: Boolean(order?.production_demand_requested),
    financial_notes: order?.financial_notes || "",
    result_summary: order?.result_summary || "",
    final_notes: order?.final_notes || "",
    checklist_data: normalizeServiceOrderChecklist(order?.checklist_data),
    checklist_finalized: Boolean(order?.checklist_finalized),
    checklist_finalized_at: order?.checklist_finalized_at || "",
    checklist_finalized_by_name: order?.checklist_finalized_by_name || "",
    created_at: order?.created_at || new Date().toISOString(),
    updated_at: order?.updated_at || order?.created_at || new Date().toISOString(),
  };

  if (!normalized.materials.length) {
    normalized.materials = [createEmptyServiceOrderMaterial()];
  }

  return normalized;
}

function hydrateServiceOrderDraft(order) {
  return normalizeServiceOrderRecord({
    ...order,
    edit_id: order?.id || "",
  });
}

function normalizeNullableTimestamp(value) {
  return String(value || "").trim() || null;
}

function normalizeNullableUuid(value) {
  return String(value || "").trim() || null;
}

function normalizeServiceOrderDbPayload(payload) {
  const dbPayload = { ...payload };
  delete dbPayload.id;
  delete dbPayload.edit_id;
  ["started_at", "completed_at", "checklist_finalized_at"].forEach((field) => {
    dbPayload[field] = normalizeNullableTimestamp(dbPayload[field]);
  });
  [
    "created_by_user_id",
    "customer_id",
    "responsible_user_id",
    "linked_production_id",
  ].forEach((field) => {
    dbPayload[field] = normalizeNullableUuid(dbPayload[field]);
  });
  return dbPayload;
}

function normalizeServiceOrderChecklistDbPayload(payload) {
  const dbPayload = { ...payload };
  delete dbPayload.id;
  delete dbPayload.edit_id;
  dbPayload.finalized_at = normalizeNullableTimestamp(dbPayload.finalized_at);
  [
    "service_order_id",
    "customer_id",
    "finalized_by_user_id",
    "created_by_user_id",
    "updated_by_user_id",
  ].forEach((field) => {
    dbPayload[field] = normalizeNullableUuid(dbPayload[field]);
  });
  return dbPayload;
}

async function loadServiceOrdersTable() {
  if (!state.supabase) {
    state.moduleData.serviceOrders = getServiceOrderStoredItems().map(normalizeServiceOrderRecord);
    return;
  }

  try {
    const { data, error } = await state.supabase.from("service_orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    state.moduleData.serviceOrders = (data || []).map(normalizeServiceOrderRecord);
    saveServiceOrderStoredItems(state.moduleData.serviceOrders);
  } catch (error) {
    state.moduleData.serviceOrders = getServiceOrderStoredItems().map(normalizeServiceOrderRecord);
    if (!loadServiceOrdersTable.warned && isServiceOrderSchemaCompatibilityError(error)) {
      loadServiceOrdersTable.warned = true;
      showToast("Tabela de ordem de serviço ainda nao aplicada no banco. O modulo esta em modo local.", "warning");
      return;
    }
    if (!isServiceOrderSchemaCompatibilityError(error)) {
      throw error;
    }
  }
}

function upsertServiceOrderRecordInState(record) {
  if (!record?.id) return;
  if (typeof upsertModuleRecord === "function") {
    upsertModuleRecord("serviceOrders", record, { normalize: normalizeServiceOrderRecord });
    return;
  }
  const saved = normalizeServiceOrderRecord(record);
  const currentItems = Array.isArray(state.moduleData.serviceOrders) ? state.moduleData.serviceOrders : [];
  state.moduleData.serviceOrders = [saved, ...currentItems.filter((item) => item.id !== saved.id)].sort((left, right) =>
    new Date(right.created_at || 0) - new Date(left.created_at || 0)
  );
}

async function loadServiceOrderChecklistsTable() {
  if (!state.supabase) {
    state.moduleData.serviceOrderChecklists = getServiceOrderChecklistStoredItems().map(normalizeServiceOrderChecklistRecord);
    return;
  }

  try {
    const { data, error } = await state.supabase.from("service_order_checklists").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const dbItems = (data || []).map(normalizeServiceOrderChecklistRecord);
    const dbKeys = new Set(dbItems.flatMap((item) => [item.id, item.checklist_number]).filter(Boolean));
    const localOnlyItems = getServiceOrderChecklistStoredItems()
      .map(normalizeServiceOrderChecklistRecord)
      .filter((item) => !dbKeys.has(item.id) && !dbKeys.has(item.checklist_number));
    state.moduleData.serviceOrderChecklists = [...dbItems, ...localOnlyItems];
    saveServiceOrderChecklistStoredItems(state.moduleData.serviceOrderChecklists);
  } catch (error) {
    state.moduleData.serviceOrderChecklists = getServiceOrderChecklistStoredItems().map(normalizeServiceOrderChecklistRecord);
    if (!loadServiceOrderChecklistsTable.warned && isServiceOrderChecklistSchemaCompatibilityError(error)) {
      loadServiceOrderChecklistsTable.warned = true;
      showToast("Tabela de checklists ainda nao aplicada no banco. O recurso esta em modo local.", "warning");
      return;
    }
    if (!isServiceOrderChecklistSchemaCompatibilityError(error)) {
      throw error;
    }
  }
}

function isServiceOrderSchemaCompatibilityError(error) {
  return /relation .*service_orders.* does not exist|table .*service_orders.* not found|Could not find the table .*service_orders|service_orders.*does not exist|column .*service_orders.* does not exist|schema cache/i.test(
    String(error?.message || "")
  );
}

function isServiceOrderChecklistSchemaCompatibilityError(error) {
  return /relation .*service_order_checklists.* does not exist|table .*service_order_checklists.* not found|Could not find the table .*service_order_checklists|service_order_checklists.*does not exist|column .*service_order_checklists.* does not exist|schema cache/i.test(
    String(error?.message || "")
  );
}

function generateServiceOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0") + String(now.getSeconds()).padStart(2, "0");
  return `OS-${stamp}-${suffix}`;
}

function getAssignableServiceOrderUsers() {
  return (state.moduleData.users || []).map((user) => ({
    value: user.id || user.user_id || "",
    label: `${user.full_name || "Usuario"}${user.role ? ` · ${user.role}` : ""}`,
    raw: user,
  })).filter((item) => item.value);
}

function getMontagemServiceOrderUsers() {
  return getAssignableServiceOrderUsers().filter((item) => {
    const department = String(item.raw.department || item.raw.role || "").trim().toUpperCase();
    return department === "MONTAGEM";
  });
}

function getVisibleServiceOrders() {
  const allOrders = (state.moduleData.serviceOrders || []).map(normalizeServiceOrderRecord);
  if (isPermissionsAdmin() || hasPermission("service_orders", "edit")) {
    return allOrders;
  }

  const currentUserId = state.currentUser?.user_id || "";
  return allOrders.filter((order) => {
    const assignedIds = [order.responsible_user_id, ...(order.assistant_user_ids || [])].filter(Boolean);
    return assignedIds.includes(currentUserId) || order.created_by_user_id === currentUserId;
  });
}

function getCurrentServiceOrderNotifications() {
  const currentUserId = state.currentUser?.user_id || "";
  if (!currentUserId) return [];

  return getVisibleServiceOrders()
    .flatMap((order) => (order.notifications || []).map((notification) => ({ ...notification, order })))
    .filter((notification) => (notification.user_ids || []).includes(currentUserId))
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

function getUnreadServiceOrderNotifications() {
  const currentUserId = state.currentUser?.user_id || "";
  const seen = getServiceOrderSeenNotifications();
  const seenIds = new Set(Array.isArray(seen[currentUserId]) ? seen[currentUserId] : []);
  return getCurrentServiceOrderNotifications().filter((item) => !seenIds.has(item.id));
}

function markServiceOrderNotificationsAsSeen(notifications) {
  const currentUserId = state.currentUser?.user_id || "";
  if (!currentUserId || !notifications.length) return;
  const seen = getServiceOrderSeenNotifications();
  const existing = new Set(Array.isArray(seen[currentUserId]) ? seen[currentUserId] : []);
  notifications.forEach((item) => existing.add(item.id));
  seen[currentUserId] = Array.from(existing).slice(-200);
  persistServiceOrderSeenNotifications(seen);
}

function buildServiceOrderNotification(message, type, userIds) {
  return {
    id: createServiceOrderUid(),
    message,
    type,
    user_ids: userIds,
    created_at: new Date().toISOString(),
  };
}

function createServiceOrderHistoryEntry(message, type = "info") {
  return {
    id: createServiceOrderUid(),
    type,
    message,
    actor_name: getLoggedUserName("Sistema"),
    created_at: new Date().toISOString(),
  };
}

function createServiceOrderProgressEntry(note) {
  return {
    id: createServiceOrderUid(),
    note,
    actor_name: getLoggedUserName("Sistema"),
    created_at: new Date().toISOString(),
  };
}

function detectServiceOrderNotifications(previousOrder, nextOrder) {
  const notifications = [];
  const assignedUsers = Array.from(new Set([nextOrder.responsible_user_id, ...(nextOrder.assistant_user_ids || [])].filter(Boolean)));
  if (!previousOrder) {
    notifications.push(buildServiceOrderNotification(`Nova OS ${nextOrder.order_number} atribuida: ${nextOrder.title || "Sem titulo"}.`, "created", assignedUsers));
    return notifications;
  }

  if (previousOrder.responsible_user_id !== nextOrder.responsible_user_id) {
    notifications.push(buildServiceOrderNotification(`Responsavel alterado na OS ${nextOrder.order_number}.`, "notified", assignedUsers));
  }

  const previousAssistants = JSON.stringify(previousOrder.assistant_user_ids || []);
  const nextAssistants = JSON.stringify(nextOrder.assistant_user_ids || []);
  if (previousAssistants !== nextAssistants) {
    notifications.push(buildServiceOrderNotification(`Equipe auxiliar atualizada na OS ${nextOrder.order_number}.`, "notified", assignedUsers));
  }

  if (previousOrder.priority !== nextOrder.priority && nextOrder.priority === "urgent") {
    notifications.push(buildServiceOrderNotification(`Prioridade da OS ${nextOrder.order_number} alterada para urgente.`, "warning", assignedUsers));
  }

  if (previousOrder.status !== nextOrder.status) {
    notifications.push(buildServiceOrderNotification(`Status da OS ${nextOrder.order_number}: ${getServiceOrderStatusConfig(nextOrder.status).label}.`, nextOrder.status === "completed" ? "completed" : "warning", assignedUsers));
  }

  return notifications;
}

function buildServiceOrderHistory(previousOrder, nextOrder) {
  const history = [...(previousOrder?.history_entries || [])];
  if (!previousOrder) {
    history.unshift(createServiceOrderHistoryEntry(`OS criada por ${getLoggedUserName("Sistema")}.`, "created"));
    return history;
  }

  const trackedFields = [
    ["status", "Status atualizado"],
    ["priority", "Prioridade atualizada"],
    ["responsible_name", "Responsavel principal atualizado"],
    ["deadline_at", "Prazo previsto atualizado"],
    ["linked_production_number", "Vinculo com producao atualizado"],
  ];

  trackedFields.forEach(([field, label]) => {
    if ((previousOrder[field] || "") !== (nextOrder[field] || "")) {
      history.unshift(createServiceOrderHistoryEntry(`${label}: ${previousOrder[field] || "-"} -> ${nextOrder[field] || "-"}.`, "updated"));
    }
  });

  if (JSON.stringify(previousOrder.materials || []) !== JSON.stringify(nextOrder.materials || [])) {
    history.unshift(createServiceOrderHistoryEntry("Materiais e pecas atualizados.", "updated"));
  }

  return history;
}

function getServiceOrderCustomerSnapshot(customerId) {
  const customer = (state.moduleData.customers || []).find((item) => item.id === customerId);
  if (!customer) {
    return {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_document: "",
      customer_address: "",
    };
  }

  const metadata = getCustomerMetadata(customer);
  return {
    customer_name: customer.name || "",
    customer_phone: metadata.phone === "-" ? "" : metadata.phone,
    customer_email: metadata.email === "-" ? "" : metadata.email,
    customer_document: metadata.document === "-" ? "" : metadata.document,
    customer_address: metadata.address === "-" ? "" : metadata.address,
  };
}

function syncServiceOrderDraftFromForm(form) {
  if (!form) return;
  const customerId = form.elements.namedItem("customer_id")?.value || "";
  const customer = (state.moduleData.customers || []).find((item) => item.id === customerId) || null;
  const customerSnapshot = getServiceOrderCustomerSnapshot(customerId);
  const customerMetadata = customer ? getCustomerMetadata(customer) : null;
  const responsibleUserId = form.elements.namedItem("responsible_user_id")?.value || "";
  const responsibleUser = getAssignableServiceOrderUsers().find((item) => item.value === responsibleUserId)?.raw;
  const assistantIds = Array.from(form.querySelectorAll("[data-service-order-assistant]:checked")).map((input) => input.value);
  const montagemUsers = getMontagemServiceOrderUsers();
  const filteredAssistantIds = assistantIds.filter((id) => montagemUsers.some((user) => user.value === id));
  const assistantNames = montagemUsers
    .filter((user) => filteredAssistantIds.includes(user.value))
    .map((user) => user.raw.full_name || user.label);
  const currentChecklist = normalizeServiceOrderChecklist(state.serviceOrderDraft.checklist_data);
  const openedAt = form.elements.namedItem("opened_at")?.value || state.serviceOrderDraft.opened_at || new Date().toISOString().slice(0, 10);

  state.serviceOrderDraft = {
    ...state.serviceOrderDraft,
    edit_id: form.elements.namedItem("edit_id")?.value || "",
    order_number: form.elements.namedItem("order_number")?.value || state.serviceOrderDraft.order_number || generateServiceOrderNumber(),
    opened_at: form.elements.namedItem("opened_at")?.value || "",
    created_by_user_id: form.elements.namedItem("created_by_user_id")?.value || state.currentUser?.user_id || "",
    created_by_name: form.elements.namedItem("created_by_name")?.value || getLoggedUserName(""),
    sector: form.elements.namedItem("sector")?.value || "",
    order_type: form.elements.namedItem("order_type")?.value || "Interna",
    customer_id: customerId,
    customer_name: customerSnapshot.customer_name,
    customer_phone: customerSnapshot.customer_phone,
    customer_email: customerSnapshot.customer_email,
    customer_document: customerSnapshot.customer_document,
    customer_address: customerSnapshot.customer_address,
    title: form.elements.namedItem("title")?.value || "",
    description: form.elements.namedItem("description")?.value || "",
    reported_problem: form.elements.namedItem("reported_problem")?.value || "",
    planned_solution: form.elements.namedItem("planned_solution")?.value || "",
    internal_notes: form.elements.namedItem("internal_notes")?.value || "",
    priority: form.elements.namedItem("priority")?.value || "medium",
    status: form.elements.namedItem("status")?.value || "open",
    started_at: form.elements.namedItem("started_at")?.value || "",
    deadline_at: form.elements.namedItem("deadline_at")?.value || "",
    expected_completion_at: form.elements.namedItem("expected_completion_at")?.value || "",
    completed_at: form.elements.namedItem("completed_at")?.value || "",
    estimated_time: form.elements.namedItem("estimated_time")?.value || "",
    actual_time: form.elements.namedItem("actual_time")?.value || "",
    responsible_user_id: responsibleUserId,
    responsible_name: responsibleUser?.full_name || "",
    assistant_user_ids: filteredAssistantIds,
    assistant_names: assistantNames,
    financial_notes: form.elements.namedItem("financial_notes")?.value || "",
    linked_production_id: form.elements.namedItem("linked_production_id")?.value || "",
    linked_production_number: resolveLinkedProductionNumber(form.elements.namedItem("linked_production_id")?.value || ""),
    production_demand_requested: form.elements.namedItem("production_demand_requested")?.checked || false,
    production_demand_notes: form.elements.namedItem("production_demand_notes")?.value || "",
    result_summary: form.elements.namedItem("result_summary")?.value || "",
    final_notes: form.elements.namedItem("final_notes")?.value || "",
    checklist_data: normalizeServiceOrderChecklist({
      ...currentChecklist,
      service_date: form.elements.namedItem("checklist_service_date")?.value || currentChecklist.service_date || openedAt,
      customer_location: form.elements.namedItem("checklist_customer_location")?.value || currentChecklist.customer_location || customerSnapshot.customer_address,
      equipment_type: form.elements.namedItem("checklist_equipment_type")?.value || "",
      service_type: form.elements.namedItem("checklist_service_type")?.value || "",
      machine_serial: form.elements.namedItem("checklist_machine_serial")?.value || "",
      general_observations: form.elements.namedItem("checklist_general_observations")?.value || "",
      caps_responsible_name: getLoggedUserName(""),
      caps_responsible_cpf: form.elements.namedItem("checklist_caps_responsible_cpf")?.value || "",
      caps_signature: form.elements.namedItem("checklist_caps_signature")?.value || "",
      customer_responsible_name:
        form.elements.namedItem("checklist_customer_responsible_name")?.value
        || currentChecklist.customer_responsible_name
        || customerMetadata?.contact
        || customerSnapshot.customer_name,
      customer_responsible_document:
        form.elements.namedItem("checklist_customer_responsible_document")?.value
        || currentChecklist.customer_responsible_document
        || customerSnapshot.customer_document,
      customer_signature: form.elements.namedItem("checklist_customer_signature")?.value || "",
    }),
  };
}

function resolveLinkedProductionNumber(productionId) {
  const production = (state.moduleData.production || []).find((item) => item.id === productionId);
  return production?.order_number || "";
}

function getServiceOrderChecklistServiceOrderSnapshot(serviceOrderId) {
  const order = (state.moduleData.serviceOrders || []).find((item) => item.id === serviceOrderId);
  if (!order) {
    return {
      service_order_number: "",
      customer_id: "",
      customer_name: "",
      customer_document: "",
      customer_phone: "",
      customer_email: "",
      customer_location: "",
    };
  }

  return {
    service_order_number: order.order_number || "",
    customer_id: order.customer_id || "",
    customer_name: order.customer_name || "",
    customer_document: order.customer_document || "",
    customer_phone: order.customer_phone || "",
    customer_email: order.customer_email || "",
    customer_location: order.customer_address || "",
  };
}

function syncServiceOrderChecklistDraftFromForm(form) {
  if (!form) return;
  const serviceOrderId = form.elements.namedItem("service_order_id")?.value || "";
  const linkedSnapshot = getServiceOrderChecklistServiceOrderSnapshot(serviceOrderId);
  const customerId = form.elements.namedItem("customer_id")?.value || linkedSnapshot.customer_id || "";
  const customerSnapshot = getServiceOrderCustomerSnapshot(customerId);
  const customer = (state.moduleData.customers || []).find((item) => item.id === customerId) || null;
  const customerMetadata = customer ? getCustomerMetadata(customer) : null;
  const currentGroups = normalizeServiceOrderChecklist({ groups: state.serviceOrderChecklistDraft.checklist_groups }).groups;

  state.serviceOrderChecklistDraft = normalizeServiceOrderChecklistRecord({
    ...state.serviceOrderChecklistDraft,
    edit_id: form.elements.namedItem("edit_id")?.value || "",
    checklist_number: form.elements.namedItem("checklist_number")?.value || state.serviceOrderChecklistDraft.checklist_number || generateServiceOrderChecklistNumber(),
    service_order_id: serviceOrderId,
    service_order_number: linkedSnapshot.service_order_number,
    customer_id: customerId,
    customer_name: customerSnapshot.customer_name || linkedSnapshot.customer_name,
    customer_document: customerSnapshot.customer_document || linkedSnapshot.customer_document,
    customer_phone: customerSnapshot.customer_phone || linkedSnapshot.customer_phone,
    customer_email: customerSnapshot.customer_email || linkedSnapshot.customer_email,
    customer_location: form.elements.namedItem("customer_location")?.value || customerSnapshot.customer_address || linkedSnapshot.customer_location,
    service_date: form.elements.namedItem("service_date")?.value || state.serviceOrderChecklistDraft.service_date,
    equipment_type: form.elements.namedItem("equipment_type")?.value || "",
    service_type: form.elements.namedItem("service_type")?.value || "",
    machine_serial: form.elements.namedItem("machine_serial")?.value || "",
    checklist_groups: currentGroups,
    general_observations: form.elements.namedItem("general_observations")?.value || "",
    caps_responsible_name: getLoggedUserName(""),
    caps_responsible_cpf: form.elements.namedItem("caps_responsible_cpf")?.value || "",
    caps_signature: form.elements.namedItem("caps_signature")?.value || "",
    customer_responsible_name:
      form.elements.namedItem("customer_responsible_name")?.value
      || state.serviceOrderChecklistDraft.customer_responsible_name
      || customerMetadata?.contact
      || customerSnapshot.customer_name,
    customer_responsible_document:
      form.elements.namedItem("customer_responsible_document")?.value
      || state.serviceOrderChecklistDraft.customer_responsible_document
      || customerSnapshot.customer_document,
    customer_signature: form.elements.namedItem("customer_signature")?.value || "",
  });
}

function updateServiceOrderMaterialState(index, patch) {
  const nextMaterials = [...(state.serviceOrderDraft.materials || [])];
  const current = nextMaterials[index];
  if (!current) return;
  nextMaterials[index] = {
    ...current,
    ...patch,
  };
  if (patch.product_id) {
    const product = (state.moduleData.products || []).find((item) => item.id === patch.product_id);
    nextMaterials[index].product_name = product?.name || "";
    nextMaterials[index].product_code = product?.code || "";
    nextMaterials[index].unit = product?.unit || current.unit || "un";
  }
  state.serviceOrderDraft.materials = nextMaterials;
}

function getServiceOrderCustomerPickerLabel(customerId) {
  const customer = (state.moduleData.customers || []).find((item) => item.id === customerId);
  if (!customer) return "";
  const metadata = getCustomerMetadata(customer);
  return `${customer.name || ""}${metadata.document && metadata.document !== "-" ? ` · ${metadata.document}` : ""}`;
}

function openServiceOrderCustomerPicker() {
  const customers = state.moduleData.customers || [];
  if (!customers.length) {
    showToast("Cadastre ao menos um cliente antes de selecionar.", "warning");
    return;
  }

  const form = document.querySelector("#service-order-form");
  syncServiceOrderDraftFromForm(form);
  const overlay = createServiceOrderPickerOverlay({
    title: "Selecionar cliente",
    placeholder: "Digite nome, documento, telefone ou e-mail...",
    getItems: (term) => {
      const normalized = String(term || "").trim().toLowerCase();
      return customers
        .filter((customer) => {
          const metadata = getCustomerMetadata(customer);
          const searchable = [
            customer.name,
            metadata.document,
            metadata.phone,
            metadata.email,
            metadata.city,
            metadata.state,
          ].join(" ").toLowerCase();
          return !normalized || searchable.includes(normalized);
        })
        .slice(0, 80)
        .map((customer) => {
          const metadata = getCustomerMetadata(customer);
          return {
            id: customer.id,
            title: customer.name || "Cliente sem nome",
            subtitle: [metadata.document, metadata.phone, metadata.email].filter((value) => value && value !== "-").join(" · ") || "Sem dados de contato",
          };
        });
    },
    onSelect: (customerId) => {
      const nextForm = document.querySelector("#service-order-form");
      syncServiceOrderDraftFromForm(nextForm);
      const snapshot = getServiceOrderCustomerSnapshot(customerId);
      state.serviceOrderDraft = {
        ...state.serviceOrderDraft,
        customer_id: customerId,
        ...snapshot,
      };
      overlay.remove();
      renderActiveModule();
    },
  });
}

function getServiceOrderMaterialPickerLabel(item) {
  if (!item?.product_id) return "";
  return `${item.product_name || ""}${item.product_code ? ` · ${item.product_code}` : ""}`;
}

async function openServiceOrderMaterialPicker(index) {
  if (!(state.moduleData.products || []).length && typeof loadProductsTable === "function") {
    try {
      await loadProductsTable();
    } catch (error) {
      showToast(formatError(error), "danger");
    }
  }
  const products = state.moduleData.products || [];
  if (!products.length) {
    showToast("Cadastre ao menos um produto antes de selecionar materiais.", "warning");
    return;
  }

  const form = document.querySelector("#service-order-form");
  syncServiceOrderDraftFromForm(form);
  const overlay = createServiceOrderPickerOverlay({
    title: "Selecionar material / peça",
    placeholder: "Digite código, nome, categoria ou local...",
    getItems: (term) => {
      const normalized = String(term || "").trim().toLowerCase();
      return products
        .filter((product) => {
          const searchable = [
            product.code,
            product.name,
            product.category,
            product.location,
            product.supplier,
          ].join(" ").toLowerCase();
          return !normalized || searchable.includes(normalized);
        })
        .slice(0, 100)
        .map((product) => ({
          id: product.id,
          title: `${product.name || "Produto sem nome"}${product.code ? ` · ${product.code}` : ""}`,
          subtitle: `Saldo ${formatQuantity(product.current_stock || 0)} ${product.unit || "un"} · ${product.category || "Sem categoria"}`,
        }));
    },
    onSelect: (productId) => {
      const nextForm = document.querySelector("#service-order-form");
      syncServiceOrderDraftFromForm(nextForm);
      updateServiceOrderMaterialState(index, { product_id: productId });
      overlay.remove();
      renderActiveModule();
    },
  });
}

function createServiceOrderPickerOverlay({ title, placeholder, getItems, onSelect }) {
  const existing = document.querySelector("[data-service-order-picker-overlay]");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay sales-document-modal-overlay";
  overlay.setAttribute("data-service-order-picker-overlay", "true");
  overlay.innerHTML = `
    <div class="modal-card sales-document-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="sales-config-header">
        <div>
          <p class="eyebrow muted">Ordem de Serviço</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <div class="sales-config-header-actions">
          <button class="ghost-button" type="button" data-service-order-picker-close>Fechar</button>
        </div>
      </div>
      <div class="table-actions">
        <label class="search-input-shell">
          <span class="search-input-icon">⌕</span>
          <input type="search" placeholder="${escapeHtml(placeholder)}" data-service-order-picker-search />
        </label>
      </div>
      <div class="table-card service-order-picker-results" style="max-height: 55vh; overflow: auto;">
        <div data-service-order-picker-results></div>
      </div>
    </div>
  `;

  const results = overlay.querySelector("[data-service-order-picker-results]");
  const searchInput = overlay.querySelector("[data-service-order-picker-search]");
  const renderResults = () => {
    const items = getItems(searchInput?.value || "");
    results.innerHTML = items.length
      ? items.map((item) => `
        <button class="bom-file-card" type="button" data-service-order-picker-select="${escapeHtml(item.id)}" style="width:100%; text-align:left; cursor:pointer;">
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <div class="table-inline-copy muted">${escapeHtml(item.subtitle || "")}</div>
          </div>
        </button>
      `).join("")
      : `<div class="empty-state">Nenhum resultado encontrado.</div>`;

    results.querySelectorAll("[data-service-order-picker-select]").forEach((button) => {
      button.addEventListener("click", () => onSelect(button.dataset.serviceOrderPickerSelect));
    });
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-service-order-picker-close]")) {
      overlay.remove();
    }
  });
  searchInput?.addEventListener("input", renderResults);
  document.body.appendChild(overlay);
  renderResults();
  searchInput?.focus();
  return overlay;
}

async function saveServiceOrderFromForm(form, options = {}) {
  const shouldFinalizeChecklist = Boolean(options.finalizeChecklist);
  syncServiceOrderDraftFromForm(form);

  const draft = normalizeServiceOrderRecord({
    ...state.serviceOrderDraft,
    created_by_user_id: state.serviceOrderDraft.created_by_user_id || state.currentUser?.user_id || "",
    created_by_name: state.serviceOrderDraft.created_by_name || getLoggedUserName(""),
  });
  const previousOrder = draft.edit_id ? (state.moduleData.serviceOrders || []).find((item) => item.id === draft.edit_id) : null;

  if (!draft.title.trim()) {
    showToast("Informe o titulo da ordem de serviço.", "warning");
    return;
  }
  if (!draft.customer_id) {
    showToast("Selecione um cliente vinculado.", "warning");
    return;
  }
  if (!draft.responsible_user_id) {
    showToast("Selecione um responsavel principal.", "warning");
    return null;
  }
  if (shouldFinalizeChecklist && previousOrder?.checklist_finalized) {
    showToast("O checklist desta OS ja foi finalizado e esta somente leitura.", "warning");
    return null;
  }
  if (shouldFinalizeChecklist) {
    const checklistError = validateServiceOrderChecklist(draft.checklist_data);
    if (checklistError) {
      state.serviceOrderFormTab = "checklist";
      renderActiveModule();
      showToast(checklistError, "warning");
      return null;
    }
  }

  const notifications = [...(previousOrder?.notifications || []), ...detectServiceOrderNotifications(previousOrder, draft)];
  const historyEntries = buildServiceOrderHistory(previousOrder, draft);
  const now = new Date().toISOString();
  if (shouldFinalizeChecklist) {
    notifications.push(
      buildServiceOrderNotification(
        `Checklist tecnico finalizado na OS ${draft.order_number}.`,
        "completed",
        getServiceOrderChecklistAdminIds()
      )
    );
    historyEntries.unshift(createServiceOrderHistoryEntry(`Checklist tecnico finalizado por ${getLoggedUserName("Sistema")}.`, "completed"));
  }
  const payload = {
    ...draft,
    checklist_finalized: shouldFinalizeChecklist ? true : draft.checklist_finalized,
    checklist_finalized_at: shouldFinalizeChecklist ? now : draft.checklist_finalized_at,
    checklist_finalized_by_name: shouldFinalizeChecklist ? getLoggedUserName("") : draft.checklist_finalized_by_name,
    history_entries: historyEntries,
    notifications,
    updated_at: now,
  };

  try {
    const savedOrder = await persistServiceOrder(payload, draft.edit_id);
    const syncedOrder = await syncServiceOrderInventory(savedOrder, previousOrder);
    upsertServiceOrderRecordInState(syncedOrder || savedOrder);
    state.openAccordionKey = null;
    state.serviceOrderDraft = createEmptyServiceOrderDraft();
    state.serviceOrderFormTab = "details";
    state.serviceOrderSelectedId = savedOrder.id;
    renderActiveModule();
    if (typeof queueSystemLog === "function") {
      void queueSystemLog({
        moduleKey: "service_orders",
        action: shouldFinalizeChecklist ? "checklist_finalizacao" : draft.edit_id ? "edicao" : "criacao",
        level: "Informativo",
        itemAffected: savedOrder.order_number,
        description: shouldFinalizeChecklist
          ? `Checklist tecnico finalizado para a OS ${savedOrder.order_number}.`
          : `Ordem de serviço ${draft.edit_id ? "atualizada" : "criada"} para ${savedOrder.customer_name}.`,
        entityType: "service_order",
        entityId: savedOrder.id,
        payload: {
          status: savedOrder.status,
          linked_production_number: savedOrder.linked_production_number,
          customer_id: savedOrder.customer_id,
          checklist_finalized: savedOrder.checklist_finalized,
        },
      });
    }
    showToast(
      shouldFinalizeChecklist
        ? "Checklist finalizado com sucesso."
        : draft.edit_id
          ? "Ordem de serviço atualizada com sucesso."
          : "Ordem de serviço criada com sucesso.",
      "success"
    );
    return savedOrder;
  } catch (error) {
    showToast(formatError(error), "danger");
    return null;
  }
}

async function handleServiceOrderSubmit(event) {
  event.preventDefault();
  await saveServiceOrderFromForm(event.currentTarget, { finalizeChecklist: false });
}

async function saveServiceOrderChecklistFromForm(form, options = {}) {
  const shouldFinalize = Boolean(options.finalizeChecklist);
  syncServiceOrderChecklistDraftFromForm(form);

  if (!state.serviceOrderChecklistDraft.customer_id) {
    showToast("Selecione o cliente do checklist.", "warning");
    return null;
  }

  if ((shouldFinalize || !state.serviceOrderChecklistDraft.edit_id) && !options.signatureMode) {
    if (shouldFinalize) {
      const signaturePlaceholder = getServiceOrderChecklistPhysicalSignatureText();
      const preflightError = validateServiceOrderChecklist({
        service_date: state.serviceOrderChecklistDraft.service_date,
        customer_location: state.serviceOrderChecklistDraft.customer_location,
        equipment_type: state.serviceOrderChecklistDraft.equipment_type,
        service_type: state.serviceOrderChecklistDraft.service_type,
        machine_serial: state.serviceOrderChecklistDraft.machine_serial,
        groups: state.serviceOrderChecklistDraft.checklist_groups,
        general_observations: state.serviceOrderChecklistDraft.general_observations,
        caps_responsible_name: state.serviceOrderChecklistDraft.caps_responsible_name,
        caps_responsible_cpf: state.serviceOrderChecklistDraft.caps_responsible_cpf,
        caps_signature: state.serviceOrderChecklistDraft.caps_signature || signaturePlaceholder,
        customer_responsible_name: state.serviceOrderChecklistDraft.customer_responsible_name,
        customer_responsible_document: state.serviceOrderChecklistDraft.customer_responsible_document,
        customer_signature: state.serviceOrderChecklistDraft.customer_signature || signaturePlaceholder,
      });
      if (preflightError) {
        showToast(preflightError, "warning");
        return null;
      }
    }
    const signatureMode = await requestServiceOrderChecklistSignatureMode(form);
    if (!signatureMode) return null;
    return saveServiceOrderChecklistFromForm(form, {
      ...options,
      signatureMode,
      printAfterSave: signatureMode === "physical",
    });
  }

  if (options.signatureMode === "physical") {
    const physicalSignatureText = getServiceOrderChecklistPhysicalSignatureText();
    const capsSignatureField = form.elements.namedItem("caps_signature");
    const customerSignatureField = form.elements.namedItem("customer_signature");
    if (capsSignatureField && !capsSignatureField.value) capsSignatureField.value = physicalSignatureText;
    if (customerSignatureField && !customerSignatureField.value) customerSignatureField.value = physicalSignatureText;
    syncServiceOrderChecklistDraftFromForm(form);
  }

  const draft = normalizeServiceOrderChecklistRecord({
    ...state.serviceOrderChecklistDraft,
    created_by_user_id: state.serviceOrderChecklistDraft.created_by_user_id || state.currentUser?.user_id || "",
    created_by_name: state.serviceOrderChecklistDraft.created_by_name || getLoggedUserName(""),
    updated_by_user_id: state.currentUser?.user_id || "",
    updated_by_name: getLoggedUserName(""),
  });
  const previousChecklist = draft.edit_id
    ? (state.moduleData.serviceOrderChecklists || []).find((item) => item.id === draft.edit_id)
    : null;

  if (!draft.customer_id) {
    showToast("Selecione o cliente do checklist.", "warning");
    return null;
  }

  const checklistError = validateServiceOrderChecklist({
    service_date: draft.service_date,
    customer_location: draft.customer_location,
    equipment_type: draft.equipment_type,
    service_type: draft.service_type,
    machine_serial: draft.machine_serial,
    groups: draft.checklist_groups,
    general_observations: draft.general_observations,
    caps_responsible_name: draft.caps_responsible_name,
    caps_responsible_cpf: draft.caps_responsible_cpf,
    caps_signature: draft.caps_signature,
    customer_responsible_name: draft.customer_responsible_name,
    customer_responsible_document: draft.customer_responsible_document,
    customer_signature: draft.customer_signature,
  });
  if (checklistError && shouldFinalize) {
    showToast(checklistError, "warning");
    return null;
  }
  if (shouldFinalize && previousChecklist?.finalized) {
    showToast("Este checklist ja foi finalizado e esta bloqueado para edicao.", "warning");
    return null;
  }

  const finalizedAt = shouldFinalize ? new Date().toISOString() : draft.finalized_at;
  const payload = {
    ...draft,
    status: shouldFinalize ? "finalized" : draft.status || "draft",
    finalized: shouldFinalize ? true : draft.finalized,
    finalized_at: finalizedAt,
    finalized_by_user_id: shouldFinalize ? state.currentUser?.user_id || "" : draft.finalized_by_user_id,
    finalized_by_name: shouldFinalize ? getLoggedUserName("") : draft.finalized_by_name,
    updated_at: new Date().toISOString(),
  };

  try {
    const savedChecklist = await persistServiceOrderChecklist(payload, draft.edit_id);
    await loadServiceOrderChecklistsTable();
    state.serviceOrderChecklistDraft = createEmptyServiceOrderChecklistDraft();
    state.serviceOrdersTab = "checklists";
    state.serviceOrderChecklistFilters = createEmptyServiceOrderChecklistFilters();
    state.serviceOrderChecklistSelectedId = savedChecklist.id;
    state.openAccordionKey = null;
    renderActiveModule();
    if (typeof queueSystemLog === "function") {
      void queueSystemLog({
        moduleKey: "service_orders",
        action: shouldFinalize ? "checklist_finalizacao" : draft.edit_id ? "edicao" : "criacao",
        level: "Informativo",
        itemAffected: savedChecklist.checklist_number,
        description: shouldFinalize
          ? `Checklist tecnico finalizado para ${savedChecklist.customer_name}.`
          : `Checklist tecnico ${draft.edit_id ? "atualizado" : "criado"} para ${savedChecklist.customer_name}.`,
        entityType: "service_order_checklist",
        entityId: savedChecklist.id,
        payload: {
          service_order_number: savedChecklist.service_order_number,
          status: savedChecklist.status,
          equipment_type: savedChecklist.equipment_type,
        },
      });
    }
    showToast(
      shouldFinalize
        ? "Checklist finalizado com sucesso."
        : draft.edit_id
          ? "Checklist atualizado com sucesso."
          : "Checklist criado com sucesso.",
      "success"
    );
    if (options.printAfterSave) {
      openPrintWindowForHtml(buildServiceOrderChecklistPrintHtml(normalizeServiceOrderChecklistRecord(savedChecklist)), `Checklist ${savedChecklist.checklist_number}`);
    }
    return savedChecklist;
  } catch (error) {
    showToast(formatError(error), "danger");
    return null;
  }
}

function requestServiceOrderChecklistSignatureMode(form) {
  return new Promise((resolve) => {
    const existingModal = document.querySelector("[data-service-order-signature-modal]");
    existingModal?.remove();

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay service-order-signature-modal";
    overlay.dataset.serviceOrderSignatureModal = "true";
    overlay.innerHTML = `
      <div class="modal-card service-order-signature-card" role="dialog" aria-modal="true" aria-labelledby="service-order-signature-title">
        <div class="module-head service-order-form-head">
          <div>
            <p class="eyebrow muted">Checklist</p>
            <h3 id="service-order-signature-title">Assinaturas serão?</h3>
          </div>
        </div>
        <div class="service-order-signature-choice">
          <button class="primary-button" type="button" data-service-order-signature-mode="digital">Digital</button>
          <button class="ghost-button" type="button" data-service-order-signature-mode="physical">Fisica</button>
        </div>
        <div class="service-order-signature-draw hidden" data-service-order-signature-draw>
          <div class="service-order-detail-columns">
            <article class="service-order-detail-panel">
              <h4>Responsavel CAPSFARMA</h4>
              <canvas width="520" height="180" data-signature-canvas="caps"></canvas>
              <button class="inline-button" type="button" data-signature-clear="caps">Limpar</button>
            </article>
            <article class="service-order-detail-panel">
              <h4>Responsavel do cliente</h4>
              <canvas width="520" height="180" data-signature-canvas="customer"></canvas>
              <button class="inline-button" type="button" data-signature-clear="customer">Limpar</button>
            </article>
          </div>
          <div class="service-order-form-actions">
            <button class="primary-button" type="button" data-service-order-signature-confirm>Confirmar assinaturas</button>
          </div>
        </div>
        <div class="service-order-form-actions">
          <button class="ghost-button" type="button" data-service-order-signature-cancel>Cancelar</button>
        </div>
      </div>
    `;

    const close = (value) => {
      overlay.remove();
      resolve(value);
    };

    document.body.appendChild(overlay);
    const drawPanel = overlay.querySelector("[data-service-order-signature-draw]");
    const pads = {};

    const setupCanvas = (canvas, key) => {
      const context = canvas.getContext("2d");
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = canvas.width;
      const height = canvas.height;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = "100%";
      canvas.style.height = `${height}px`;
      context.scale(ratio, ratio);
      context.lineWidth = 2;
      context.lineCap = "round";
      context.strokeStyle = "#0f172a";
      pads[key] = { canvas, context, drawing: false, signed: false };

      const getPoint = (event) => {
        const source = event.touches?.[0] || event.changedTouches?.[0] || event;
        const rect = canvas.getBoundingClientRect();
        return {
          x: (source.clientX - rect.left) * (width / rect.width),
          y: (source.clientY - rect.top) * (height / rect.height),
        };
      };
      const start = (event) => {
        event.preventDefault();
        const point = getPoint(event);
        pads[key].drawing = true;
        context.beginPath();
        context.moveTo(point.x, point.y);
      };
      const move = (event) => {
        if (!pads[key].drawing) return;
        event.preventDefault();
        const point = getPoint(event);
        context.lineTo(point.x, point.y);
        context.stroke();
        pads[key].signed = true;
      };
      const end = () => {
        pads[key].drawing = false;
      };
      canvas.addEventListener("mousedown", start);
      canvas.addEventListener("mousemove", move);
      canvas.addEventListener("mouseup", end);
      canvas.addEventListener("mouseleave", end);
      canvas.addEventListener("touchstart", start, { passive: false });
      canvas.addEventListener("touchmove", move, { passive: false });
      canvas.addEventListener("touchend", end);
    };

    overlay.querySelectorAll("[data-signature-canvas]").forEach((canvas) => {
      setupCanvas(canvas, canvas.dataset.signatureCanvas);
    });

    overlay.querySelectorAll("[data-signature-clear]").forEach((button) => {
      button.addEventListener("click", () => {
        const pad = pads[button.dataset.signatureClear];
        if (!pad) return;
        pad.context.clearRect(0, 0, pad.canvas.width, pad.canvas.height);
        pad.signed = false;
      });
    });

    overlay.querySelector("[data-service-order-signature-mode='digital']")?.addEventListener("click", () => {
      drawPanel.classList.remove("hidden");
    });

    overlay.querySelector("[data-service-order-signature-mode='physical']")?.addEventListener("click", () => {
      close("physical");
    });

    overlay.querySelector("[data-service-order-signature-confirm]")?.addEventListener("click", () => {
      if (!pads.caps?.signed || !pads.customer?.signed) {
        showToast("Desenhe as duas assinaturas para continuar.", "warning");
        return;
      }
      const capsSignatureField = form.elements.namedItem("caps_signature");
      const customerSignatureField = form.elements.namedItem("customer_signature");
      if (capsSignatureField) capsSignatureField.value = pads.caps.canvas.toDataURL("image/png");
      if (customerSignatureField) customerSignatureField.value = pads.customer.canvas.toDataURL("image/png");
      syncServiceOrderChecklistDraftFromForm(form);
      close("digital");
    });

    overlay.querySelector("[data-service-order-signature-cancel]")?.addEventListener("click", () => close(""));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close("");
    });
  });
}

async function persistServiceOrder(payload, editId) {
  const normalized = normalizeServiceOrderRecord(payload);
  if (state.supabase) {
    try {
      const dbPayload = normalizeServiceOrderDbPayload(normalized);
      const query = editId
        ? state.supabase.from("service_orders").update(dbPayload).eq("id", editId).select().single()
        : state.supabase.from("service_orders").insert(dbPayload).select().single();
      const { data, error } = await query;
      if (error) throw error;
      const saved = normalizeServiceOrderRecord(data);
      const localItems = getServiceOrderStoredItems().filter((item) => item.id !== saved.id);
      saveServiceOrderStoredItems([saved, ...localItems]);
      return saved;
    } catch (error) {
      if (!isServiceOrderSchemaCompatibilityError(error)) throw error;
    }
  }

  const localItems = getServiceOrderStoredItems().map(normalizeServiceOrderRecord);
  const saved = normalizeServiceOrderRecord({
    ...normalized,
    id: editId || normalized.id || createServiceOrderUid(),
    created_at: editId
      ? (localItems.find((item) => item.id === editId)?.created_at || normalized.created_at || new Date().toISOString())
      : new Date().toISOString(),
  });
  const nextItems = [saved, ...localItems.filter((item) => item.id !== saved.id)];
  saveServiceOrderStoredItems(nextItems);
  return saved;
}

async function persistServiceOrderChecklist(payload, editId) {
  const normalized = normalizeServiceOrderChecklistRecord(payload);
  if (state.supabase) {
    try {
      const dbPayload = normalizeServiceOrderChecklistDbPayload(normalized);
      const query = editId
        ? state.supabase.from("service_order_checklists").update(dbPayload).eq("id", editId).select().single()
        : state.supabase.from("service_order_checklists").insert(dbPayload).select().single();
      const { data, error } = await query;
      if (error) throw error;
      const saved = normalizeServiceOrderChecklistRecord(data);
      const localItems = getServiceOrderChecklistStoredItems().filter((item) => item.id !== saved.id);
      saveServiceOrderChecklistStoredItems([saved, ...localItems]);
      return saved;
    } catch (error) {
      if (!isServiceOrderChecklistSchemaCompatibilityError(error)) throw error;
    }
  }

  const localItems = getServiceOrderChecklistStoredItems().map(normalizeServiceOrderChecklistRecord);
  const saved = normalizeServiceOrderChecklistRecord({
    ...normalized,
    id: editId || normalized.id || createServiceOrderUid(),
    created_at: editId
      ? (localItems.find((item) => item.id === editId)?.created_at || normalized.created_at || new Date().toISOString())
      : new Date().toISOString(),
  });
  const nextItems = [saved, ...localItems.filter((item) => item.id !== saved.id)];
  saveServiceOrderChecklistStoredItems(nextItems);
  return saved;
}

async function syncServiceOrderInventory(savedOrder, previousOrder) {
  if (!state.supabase) return savedOrder;

  const previousMaterials = new Map((previousOrder?.materials || []).map((item) => [item.id, item]));
  const nextMaterials = [...(savedOrder.materials || [])];
  let changed = false;

  for (const material of nextMaterials) {
    const previousMaterial = previousMaterials.get(material.id);
    if (!material.confirmed || material.movement_registered) continue;
    const product = (state.moduleData.products || []).find((item) => item.id === material.product_id);
    if (!product) continue;
    const movementQuantity = Number(material.quantity || 0);
    if (!movementQuantity) continue;

    const currentStock = Number(product.current_stock || 0);
    const nextStock = currentStock - movementQuantity;
    if (nextStock < 0) {
      throw new Error(`Estoque insuficiente para o item ${material.product_name || product.name}.`);
    }

    await persistProductMovement({
      product,
      movementPayload: {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        movement_type: "exit",
        quantity: movementQuantity,
        batch: product.batch || null,
        machine_serial: product.machine_serial || null,
        notes: `Consumo da OS ${savedOrder.order_number}`,
        moved_by_user_id: state.currentUser?.user_id || null,
        moved_by_name: getLoggedUserName(null),
      },
      nextStock,
    });

    material.movement_registered = true;
    material.confirmed_at = material.confirmed_at || new Date().toISOString();
    material.confirmed_by_name = material.confirmed_by_name || getLoggedUserName("Sistema");
    changed = true;
  }

  if (changed) {
    const syncedOrder = await persistServiceOrder({
      ...savedOrder,
      materials: nextMaterials,
      history_entries: [
        createServiceOrderHistoryEntry("Baixa de estoque confirmada para materiais da OS.", "updated"),
        ...(savedOrder.history_entries || []),
      ],
    }, savedOrder.id);
    await Promise.all([loadProductsTable(), loadInventoryMovementsTable()]);
    return syncedOrder;
  }
  return savedOrder;
}

async function handleServiceOrderDelete(orderId) {
  const order = (state.moduleData.serviceOrders || []).find((item) => item.id === orderId);
  if (!order) return;
  if (!confirm(`Deseja cancelar/excluir a OS ${order.order_number}?`)) return;

  try {
    if (state.supabase) {
      try {
        const { error } = await state.supabase.from("service_orders").delete().eq("id", orderId);
        if (error && !isServiceOrderSchemaCompatibilityError(error)) throw error;
      } catch (error) {
        if (!isServiceOrderSchemaCompatibilityError(error)) throw error;
      }
    }

    const localItems = getServiceOrderStoredItems().filter((item) => item.id !== orderId);
    saveServiceOrderStoredItems(localItems);
    if (typeof removeModuleRecord === "function") {
      removeModuleRecord("serviceOrders", orderId);
    } else {
      state.moduleData.serviceOrders = (state.moduleData.serviceOrders || []).filter((item) => item.id !== orderId);
    }
    if (state.serviceOrderSelectedId === orderId) {
      state.serviceOrderSelectedId = "";
    }
    renderActiveModule();
    if (typeof queueSystemLog === "function") {
      void queueSystemLog({
        moduleKey: "service_orders",
        action: "exclusao",
        level: "Critico",
        itemAffected: order.order_number,
        description: "Ordem de serviço removida/cancelada.",
        entityType: "service_order",
        entityId: orderId,
      });
    }
    showToast("Ordem de serviço removida.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleServiceOrderQuickConclude(orderId) {
  const order = (state.moduleData.serviceOrders || []).find((item) => item.id === orderId);
  if (!order) return;
  const resultSummary = window.prompt(`Resultado final da OS ${order.order_number}:`, order.result_summary || "Serviço concluido com sucesso.");
  if (resultSummary === null) return;

  const nextOrder = normalizeServiceOrderRecord({
    ...order,
    status: "completed",
    completed_at: new Date().toISOString(),
    result_summary: resultSummary,
    final_notes: order.final_notes || resultSummary,
    history_entries: [
      createServiceOrderHistoryEntry(`OS concluida por ${getLoggedUserName("Sistema")}.`, "completed"),
      ...(order.history_entries || []),
    ],
  });

  try {
    const savedOrder = await persistServiceOrder(nextOrder, order.id);
    upsertServiceOrderRecordInState(savedOrder || nextOrder);
    state.serviceOrderSelectedId = order.id;
    renderActiveModule();
    if (typeof queueSystemLog === "function") {
      void queueSystemLog({
        moduleKey: "service_orders",
        action: "mudanca_status",
        level: "Atenção",
        itemAffected: nextOrder.order_number,
        description: "Ordem de serviço concluida.",
        entityType: "service_order",
        entityId: order.id,
        payload: { status: "completed", result_summary: resultSummary },
      });
    }
    showToast("Ordem de serviço concluida.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleServiceOrderAddProgress(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const orderId = form.elements.namedItem("order_id")?.value || "";
  const note = form.elements.namedItem("progress_note")?.value?.toString().trim();
  if (!note) {
    showToast("Informe um andamento.", "warning");
    return;
  }

  const order = (state.moduleData.serviceOrders || []).find((item) => item.id === orderId);
  if (!order) return;

  try {
    const savedOrder = await persistServiceOrder({
      ...order,
      progress_entries: [createServiceOrderProgressEntry(note), ...(order.progress_entries || [])],
      history_entries: [createServiceOrderHistoryEntry("Novo andamento registrado.", "updated"), ...(order.history_entries || [])],
      updated_at: new Date().toISOString(),
    }, order.id);
    upsertServiceOrderRecordInState(savedOrder);
    renderActiveModule();
    if (typeof queueSystemLog === "function") {
      void queueSystemLog({
        moduleKey: "service_orders",
        action: "edicao",
        level: "Informativo",
        itemAffected: order.order_number,
        description: "Novo andamento registrado na ordem de serviço.",
        entityType: "service_order",
        entityId: order.id,
        payload: { note },
      });
    }
    showToast("Andamento registrado com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function openServiceOrderForEdit(orderId) {
  const order = (state.moduleData.serviceOrders || []).find((item) => item.id === orderId);
  if (!order) return;
  state.serviceOrderDraft = hydrateServiceOrderDraft(order);
  state.serviceOrderFormTab = "details";
  state.openAccordionKey = "service-order-form";
  state.serviceOrderSelectedId = orderId;
  renderActiveModule();
  document.querySelector("#service-order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectServiceOrderDetails(orderId) {
  state.serviceOrderSelectedId = state.serviceOrderSelectedId === orderId ? "" : orderId;
  renderActiveModule();
}

function resetServiceOrderForm() {
  state.serviceOrderDraft = createEmptyServiceOrderDraft();
  state.serviceOrderFormTab = "details";
  state.openAccordionKey = null;
  renderActiveModule();
}

function openServiceOrderChecklistForEdit(checklistId) {
  const checklist = (state.moduleData.serviceOrderChecklists || []).find((item) => item.id === checklistId);
  if (!checklist) return;
  state.serviceOrderChecklistDraft = normalizeServiceOrderChecklistRecord({ ...checklist, edit_id: checklist.id });
  state.serviceOrdersTab = "checklists";
  state.openAccordionKey = "service-order-checklist-form";
  state.serviceOrderChecklistSelectedId = checklistId;
  renderActiveModule();
  document.querySelector("#service-order-checklist-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetServiceOrderChecklistForm() {
  state.serviceOrderChecklistDraft = createEmptyServiceOrderChecklistDraft();
  state.openAccordionKey = null;
  renderActiveModule();
}

function selectServiceOrderChecklistDetails(checklistId) {
  state.serviceOrderChecklistSelectedId = state.serviceOrderChecklistSelectedId === checklistId ? "" : checklistId;
  renderActiveModule();
}

async function handleServiceOrderChecklistDelete(checklistId) {
  const checklist = (state.moduleData.serviceOrderChecklists || []).find((item) => item.id === checklistId);
  if (!checklist) return;
  if (!confirm(`Deseja excluir o checklist ${checklist.checklist_number}?`)) return;

  try {
    if (state.supabase) {
      try {
        const { error } = await state.supabase.from("service_order_checklists").delete().eq("id", checklistId);
        if (error && !isServiceOrderChecklistSchemaCompatibilityError(error)) throw error;
      } catch (error) {
        if (!isServiceOrderChecklistSchemaCompatibilityError(error)) throw error;
      }
    }
    const localItems = getServiceOrderChecklistStoredItems().filter((item) => item.id !== checklistId);
    saveServiceOrderChecklistStoredItems(localItems);
    if (typeof removeModuleRecord === "function") {
      removeModuleRecord("serviceOrderChecklists", checklistId);
    } else {
      state.moduleData.serviceOrderChecklists = (state.moduleData.serviceOrderChecklists || []).filter((item) => item.id !== checklistId);
    }
    if (state.serviceOrderChecklistSelectedId === checklistId) {
      state.serviceOrderChecklistSelectedId = "";
    }
    renderActiveModule();
    showToast("Checklist removido.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function filterServiceOrderChecklists(items) {
  const filters = state.serviceOrderChecklistFilters || createEmptyServiceOrderChecklistFilters();
  return items.filter((item) => {
    const searchable = [
      item.checklist_number,
      item.customer_name,
      item.service_order_number,
      item.machine_serial,
      item.equipment_type,
      item.service_type,
    ].join(" ").toLowerCase();
    const matchesSearch = !filters.search.trim() || searchable.includes(filters.search.trim().toLowerCase());
    const matchesCustomer = filters.customer_id === "all" || item.customer_id === filters.customer_id;
    const matchesEquipment = filters.equipment_type === "all" || item.equipment_type === filters.equipment_type;
    const matchesStatus = filters.status === "all" || item.status === filters.status;
    const matchesFrom = !filters.date_from || item.service_date >= filters.date_from;
    const matchesTo = !filters.date_to || item.service_date <= filters.date_to;
    return matchesSearch && matchesCustomer && matchesEquipment && matchesStatus && matchesFrom && matchesTo;
  });
}

function buildServiceOrderFilters() {
  const customers = (state.moduleData.customers || []).map((item) => ({ value: item.id, label: item.name }));
  const users = getAssignableServiceOrderUsers().map((item) => ({ value: item.value, label: item.raw.full_name || item.label }));
  return { customers, users };
}

function filterServiceOrders(orders) {
  const filters = state.serviceOrderFilters || createEmptyServiceOrderFilters();
  return orders.filter((order) => {
    const searchable = [
      order.order_number,
      order.customer_name,
      order.title,
      order.responsible_name,
      order.linked_production_number,
      order.sector,
      order.order_type,
    ].join(" ").toLowerCase();
    const matchesSearch = !filters.search.trim() || searchable.includes(filters.search.trim().toLowerCase());
    const matchesStatus = filters.status === "all" || order.status === filters.status;
    const matchesPriority = filters.priority === "all" || order.priority === filters.priority;
    const matchesCustomer = filters.customer_id === "all" || order.customer_id === filters.customer_id;
    const matchesResponsible = filters.responsible_user_id === "all" || order.responsible_user_id === filters.responsible_user_id;
    const matchesSector = filters.sector === "all" || order.sector === filters.sector;
    const matchesType = filters.order_type === "all" || order.order_type === filters.order_type;
    const matchesProduction = filters.has_production_link === "all"
      || (filters.has_production_link === "yes" ? Boolean(order.linked_production_id || order.production_demand_requested) : !order.linked_production_id && !order.production_demand_requested);
    const matchesStock = filters.has_stock_link === "all"
      || (filters.has_stock_link === "yes" ? (order.materials || []).some((item) => item.product_id) : !(order.materials || []).some((item) => item.product_id));
    const openedAt = order.opened_at || order.created_at?.slice(0, 10) || "";
    const matchesDateFrom = !filters.date_from || openedAt >= filters.date_from;
    const matchesDateTo = !filters.date_to || openedAt <= filters.date_to;
    return matchesSearch && matchesStatus && matchesPriority && matchesCustomer && matchesResponsible && matchesSector && matchesType && matchesProduction && matchesStock && matchesDateFrom && matchesDateTo;
  });
}

function renderServiceOrderAlertStrip(notifications) {
  if (!notifications.length) {
    return `<div class="empty-state compact-empty">Nenhum alerta pendente para voce.</div>`;
  }

  return `
    <div class="service-order-alert-list">
      ${notifications.slice(0, 4).map((notification) => `
        <article class="service-order-alert-card">
          <strong>${escapeHtml(notification.order.order_number || "OS")}</strong>
          <p>${escapeHtml(notification.message || "-")}</p>
          <small>${formatDateTime(notification.created_at)}</small>
        </article>
      `).join("")}
    </div>
  `;
}

function renderServiceOrderMaterialRow(item, index) {
  return `
    <div class="service-order-material-row">
      <label>
        Item de estoque
        <input type="hidden" data-service-order-material-field="product_id" data-service-order-material-index="${index}" value="${escapeHtml(item.product_id || "")}" />
        <span class="service-order-picker-field">
          <input type="text" readonly value="${escapeHtml(getServiceOrderMaterialPickerLabel(item))}" placeholder="Selecione um item" data-service-order-open-material-picker="${index}" />
        </span>
      </label>
      <label>
        Quantidade
        <input data-service-order-material-field="quantity" data-service-order-material-index="${index}" type="number" min="0.01" step="0.01" value="${escapeHtml(item.quantity)}" />
      </label>
      <label>
        Unidade
        <input data-service-order-material-field="unit" data-service-order-material-index="${index}" type="text" value="${escapeHtml(item.unit)}" />
      </label>
      <label>
        Observacao
        <input data-service-order-material-field="notes" data-service-order-material-index="${index}" type="text" value="${escapeHtml(item.notes)}" />
      </label>
      <label class="service-order-material-toggle">
        <input data-service-order-material-field="confirmed" data-service-order-material-index="${index}" type="checkbox" ${item.confirmed ? "checked" : ""} />
        Confirmar uso e baixa
      </label>
      <button class="inline-button danger-button" type="button" data-service-order-remove-material="${index}">Remover</button>
    </div>
  `;
}

function renderServiceOrderChecklistItem(groupKey, item, index, disabled) {
  return `
    <div class="service-order-checklist-item">
      <div class="service-order-checklist-item-head">
        <strong>${escapeHtml(item.label)}</strong>
        <div class="service-order-checklist-toggle-group">
          <button
            class="inline-button service-order-checklist-ok-button ${item.status === "ok" ? "is-active" : ""}"
            type="button"
            data-service-order-checklist-status="ok"
            data-service-order-checklist-group="${groupKey}"
            data-service-order-checklist-index="${index}"
            ${disabled ? "disabled" : ""}
          >
            OK
          </button>
          <button
            class="inline-button danger-button ${item.status === "nao_ok" ? "is-active" : ""}"
            type="button"
            data-service-order-checklist-status="nao_ok"
            data-service-order-checklist-group="${groupKey}"
            data-service-order-checklist-index="${index}"
            ${disabled ? "disabled" : ""}
          >
            NAO OK
          </button>
        </div>
      </div>
      <label>
        Observacao ${item.status === "nao_ok" ? "*" : ""}
        <textarea
          data-service-order-checklist-observation
          data-service-order-checklist-group="${groupKey}"
          data-service-order-checklist-index="${index}"
          placeholder="Descreva ajustes, falhas ou observacoes tecnicas."
          ${disabled ? "readonly" : ""}
        >${escapeHtml(item.observation || "")}</textarea>
      </label>
    </div>
  `;
}

function renderServiceOrderChecklistStandaloneForm(canEdit) {
  if (!canEdit || state.openAccordionKey !== "service-order-checklist-form") return "";
  const draft = normalizeServiceOrderChecklistRecord(state.serviceOrderChecklistDraft);
  const disabled = draft.finalized;
  const customerOptions = (state.moduleData.customers || []).map((customer) => ({ value: customer.id, label: customer.name }));
  const serviceOrderOptions = (state.moduleData.serviceOrders || []).map((order) => ({
    value: order.id,
    label: `${order.order_number} · ${order.customer_name || "Sem cliente"}`,
  }));

  return `
    <section class="service-order-form-shell">
      <div class="service-order-form-card">
        <div class="module-head service-order-form-head">
          <div>
            <p class="eyebrow muted">Checklist</p>
            <h3>${draft.edit_id ? "Editar Checklist Tecnico" : "Novo Checklist Tecnico"}</h3>
            <p class="muted">Cadastro independente da O.S., com vinculo opcional para rastreabilidade.</p>
          </div>
        </div>

        <form id="service-order-checklist-form" class="service-order-form-grid">
          <input type="hidden" name="edit_id" value="${escapeHtml(draft.edit_id)}" />
          <section class="service-order-form-section">
            <div class="service-order-form-columns service-order-form-columns-3">
              <label>Numero do checklist<input name="checklist_number" type="text" value="${escapeHtml(draft.checklist_number || generateServiceOrderChecklistNumber())}" ${disabled ? "readonly" : ""} /></label>
              <label>Data *<input name="service_date" type="date" value="${escapeHtml(draft.service_date)}" ${disabled ? "readonly" : ""} /></label>
              <label>O.S. vinculada<select name="service_order_id" ${disabled ? "disabled" : ""}><option value="">Nenhuma</option>${renderOptions(serviceOrderOptions, draft.service_order_id)}</select></label>
            </div>
            <div class="service-order-form-columns service-order-form-columns-2">
              <label>Cliente *<select name="customer_id" ${disabled ? "disabled" : ""}><option value="">Selecione</option>${renderOptions(customerOptions, draft.customer_id)}</select></label>
              <label>Local *<input name="customer_location" type="text" value="${escapeHtml(draft.customer_location)}" ${disabled ? "readonly" : ""} /></label>
            </div>
            <div class="service-order-form-columns service-order-form-columns-3">
              <label>Equipamento *<select name="equipment_type" ${disabled ? "disabled" : ""}><option value="">Selecione</option>${renderOptionList(SERVICE_ORDER_CHECKLIST_EQUIPMENT_TYPES, draft.equipment_type)}</select></label>
              <label>Tipo de serviço *<select name="service_type" ${disabled ? "disabled" : ""}><option value="">Selecione</option>${renderOptionList(SERVICE_ORDER_CHECKLIST_SERVICE_TYPES, draft.service_type)}</select></label>
              <label>N/S da maquina *<input name="machine_serial" type="text" maxlength="10" value="${escapeHtml(draft.machine_serial)}" ${disabled ? "readonly" : ""} /></label>
            </div>
          </section>

          <section class="service-order-form-section">
            <div class="service-order-checklist-company">
              <div>
                <strong>${escapeHtml(getServiceOrderCompanyProfile().company_name)}</strong>
                <p>CNPJ: ${escapeHtml(getServiceOrderCompanyProfile().cnpj || "-")}</p>
                <p>IE: ${escapeHtml(getServiceOrderCompanyProfile().state_registration || "-")}</p>
              </div>
              <div>
                <p>${escapeHtml(getServiceOrderCompanyProfile().address || "-")}</p>
                <p>${escapeHtml(getServiceOrderCompanyProfile().phone || "-")}</p>
              </div>
            </div>
          </section>

          <section class="service-order-form-section">
            <h4>Checklist tecnico</h4>
            <div class="service-order-checklist-groups">
              ${SERVICE_ORDER_CHECKLIST_GROUPS.map((group) => `
                <details class="service-order-checklist-group" open>
                  <summary>${escapeHtml(group.title)}</summary>
                  <div class="service-order-checklist-group-body">
                    ${(draft.checklist_groups[group.key] || []).map((item, index) => renderServiceOrderChecklistItem(group.key, item, index, disabled)).join("")}
                  </div>
                </details>
              `).join("")}
            </div>
            <label>Observações gerais<textarea name="general_observations" ${disabled ? "readonly" : ""}>${escapeHtml(draft.general_observations)}</textarea></label>
          </section>

          <section class="service-order-form-section">
            <div class="service-order-detail-columns">
              <article class="service-order-detail-panel">
                <h4>Responsavel CAPSFARMA</h4>
                <div class="service-order-form-columns service-order-form-columns-2">
                  <label>Nome<input type="text" value="${escapeHtml(draft.caps_responsible_name)}" readonly /></label>
                  <label>CPF *<input name="caps_responsible_cpf" type="text" value="${escapeHtml(draft.caps_responsible_cpf)}" ${disabled ? "readonly" : ""} /></label>
                </div>
                <label>Assinatura *${renderServiceOrderChecklistSignatureInput("caps_signature", draft.caps_signature)}</label>
              </article>
              <article class="service-order-detail-panel">
                <h4>Responsavel do cliente</h4>
                <div class="service-order-form-columns service-order-form-columns-2">
                  <label>Nome *<input name="customer_responsible_name" type="text" value="${escapeHtml(draft.customer_responsible_name)}" ${disabled ? "readonly" : ""} /></label>
                  <label>CPF/CNPJ *<input name="customer_responsible_document" type="text" value="${escapeHtml(draft.customer_responsible_document)}" ${disabled ? "readonly" : ""} /></label>
                </div>
                <label>Assinatura *${renderServiceOrderChecklistSignatureInput("customer_signature", draft.customer_signature)}</label>
              </article>
            </div>
          </section>

          <div class="service-order-form-actions">
            <button class="primary-button" type="submit">${draft.edit_id ? "Salvar checklist" : "Criar checklist"}</button>
            <button class="ghost-button" type="button" data-service-order-checklist-finalize ${draft.finalized ? "disabled" : ""}>${draft.finalized ? "Checklist finalizado" : "Finalizar checklist"}</button>
            ${draft.edit_id ? `<button class="ghost-button" type="button" data-service-order-checklist-print="${draft.edit_id}">Imprimir PDF</button>` : ""}
            <button class="ghost-button" type="button" data-service-order-checklist-cancel-form>Cancelar</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderServiceOrderChecklistSection(draft, canEdit) {
  const company = getServiceOrderCompanyProfile();
  const checklist = normalizeServiceOrderChecklist(draft.checklist_data);
  const disabled = !canEdit || draft.checklist_finalized;
  const finalizedMeta = draft.checklist_finalized
    ? `<p class="muted">Checklist finalizado em ${formatDateTime(draft.checklist_finalized_at)} por ${escapeHtml(draft.checklist_finalized_by_name || "-")}.</p>`
    : `<p class="muted">Finalize apenas quando todos os itens e assinaturas estiverem completos.</p>`;

  return `
    <section class="service-order-form-section">
      <div class="service-order-section-header">
        <div>
          <h4>Checklist Tecnico</h4>
          ${finalizedMeta}
        </div>
        <div class="service-order-detail-inline">
          ${draft.checklist_finalized ? `<span class="status-chip status-completed">Finalizado</span>` : `<span class="status-chip status-pending">Em preenchimento</span>`}
        </div>
      </div>

      <div class="service-order-checklist-company">
        <div>
          <strong>${escapeHtml(company.company_name)}</strong>
          <p>CNPJ: ${escapeHtml(company.cnpj || "-")}</p>
          <p>IE: ${escapeHtml(company.state_registration || "-")}</p>
        </div>
        <div>
          <p>${escapeHtml(company.address || "-")}</p>
          <p>${escapeHtml(company.phone || "-")} ${company.email ? `· ${escapeHtml(company.email)}` : ""}</p>
        </div>
      </div>

      <div class="service-order-form-columns service-order-form-columns-3">
        <label>Data do atendimento *<input name="checklist_service_date" type="date" value="${escapeHtml(checklist.service_date)}" ${disabled ? "readonly" : ""} /></label>
        <label>Equipamento *<select name="checklist_equipment_type" ${disabled ? "disabled" : ""}><option value="">Selecione</option>${renderOptionList(SERVICE_ORDER_CHECKLIST_EQUIPMENT_TYPES, checklist.equipment_type)}</select></label>
        <label>Tipo de serviço *<select name="checklist_service_type" ${disabled ? "disabled" : ""}><option value="">Selecione</option>${renderOptionList(SERVICE_ORDER_CHECKLIST_SERVICE_TYPES, checklist.service_type)}</select></label>
      </div>

      <div class="service-order-form-columns service-order-form-columns-2">
        <label>Local do atendimento *<input name="checklist_customer_location" type="text" value="${escapeHtml(checklist.customer_location)}" ${disabled ? "readonly" : ""} /></label>
        <label>N/S da maquina *<input name="checklist_machine_serial" type="text" maxlength="10" pattern="[A-Za-z0-9]{1,10}" value="${escapeHtml(checklist.machine_serial)}" ${disabled ? "readonly" : ""} /></label>
      </div>

      <div class="service-order-checklist-groups">
        ${SERVICE_ORDER_CHECKLIST_GROUPS.map((group) => `
          <details class="service-order-checklist-group" open>
            <summary>${escapeHtml(group.title)}</summary>
            <div class="service-order-checklist-group-body">
              ${(checklist.groups[group.key] || []).map((item, index) => renderServiceOrderChecklistItem(group.key, item, index, disabled)).join("")}
            </div>
          </details>
        `).join("")}
      </div>

      <label>Observações gerais<textarea name="checklist_general_observations" ${disabled ? "readonly" : ""}>${escapeHtml(checklist.general_observations || "")}</textarea></label>

      <div class="service-order-detail-columns">
        <article class="service-order-detail-panel">
          <h4>Responsavel CAPSFARMA</h4>
          <div class="service-order-form-columns service-order-form-columns-2">
            <label>Nome<input name="checklist_caps_responsible_name" type="text" value="${escapeHtml(checklist.caps_responsible_name || getLoggedUserName(""))}" readonly /></label>
            <label>CPF *<input name="checklist_caps_responsible_cpf" type="text" value="${escapeHtml(checklist.caps_responsible_cpf)}" ${disabled ? "readonly" : ""} /></label>
          </div>
          <label>Assinatura *<textarea name="checklist_caps_signature" placeholder="Assinatura digital ou observacao de assinatura no impresso." ${disabled ? "readonly" : ""}>${escapeHtml(checklist.caps_signature || "")}</textarea></label>
        </article>

        <article class="service-order-detail-panel">
          <h4>Responsavel do cliente</h4>
          <div class="service-order-form-columns service-order-form-columns-2">
            <label>Nome *<input name="checklist_customer_responsible_name" type="text" value="${escapeHtml(checklist.customer_responsible_name)}" ${disabled ? "readonly" : ""} /></label>
            <label>CPF/CNPJ *<input name="checklist_customer_responsible_document" type="text" value="${escapeHtml(checklist.customer_responsible_document)}" ${disabled ? "readonly" : ""} /></label>
          </div>
          <label>Assinatura *<textarea name="checklist_customer_signature" placeholder="Assinatura digital ou observacao de assinatura no impresso." ${disabled ? "readonly" : ""}>${escapeHtml(checklist.customer_signature || "")}</textarea></label>
        </article>
      </div>
    </section>
  `;
}

function renderServiceOrderForm(canEdit) {
  if (!canEdit || state.openAccordionKey !== "service-order-form") return "";
  const draft = state.serviceOrderDraft;
  const userOptions = getAssignableServiceOrderUsers();
  const montagemOptions = getMontagemServiceOrderUsers();
  const productionOptions = (state.moduleData.production || []).map((item) => ({ value: item.id, label: `${item.order_number} · ${item.product_name}` }));

  return `
    <section class="service-order-form-shell">
      <div class="service-order-form-card">
        <div class="module-head service-order-form-head">
          <div>
            <p class="eyebrow muted">OS</p>
            <h3>${draft.edit_id ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</h3>
            <p class="muted">Cadastro completo, integrado com cliente, estoque, producao e historico.</p>
          </div>
        </div>

        <form id="service-order-form" class="service-order-form-grid">
          <input type="hidden" name="edit_id" value="${escapeHtml(draft.edit_id)}" />
          <input type="hidden" name="created_by_user_id" value="${escapeHtml(draft.created_by_user_id || state.currentUser?.user_id || "")}" />
          <input type="hidden" name="created_by_name" value="${escapeHtml(draft.created_by_name || getLoggedUserName(""))}" />

          <section class="service-order-form-section">
            <h4>Identificacao</h4>
            <div class="service-order-form-columns service-order-form-columns-4">
              <label>Numero da OS<input name="order_number" type="text" value="${escapeHtml(draft.order_number || generateServiceOrderNumber())}" /></label>
              <label>Data de abertura<input name="opened_at" type="date" value="${escapeHtml(draft.opened_at)}" /></label>
              <label>Setor<select name="sector"><option value="">Selecione</option>${renderOptionList(SERVICE_ORDER_SECTORS, draft.sector)}</select></label>
              <label>Tipo<select name="order_type"><option value="">Selecione</option>${renderOptionList(SERVICE_ORDER_TYPES, draft.order_type)}</select></label>
            </div>
          </section>

          <section class="service-order-form-section">
            <h4>Cliente e dados de contato</h4>
            <div class="service-order-form-columns service-order-form-columns-2">
              <label>
                Cliente vinculado *
                <input name="customer_id" type="hidden" required value="${escapeHtml(draft.customer_id || "")}" />
                <span class="service-order-picker-field">
                  <input type="text" readonly value="${escapeHtml(getServiceOrderCustomerPickerLabel(draft.customer_id))}" placeholder="Selecione um cliente" data-service-order-open-customer-picker />
                </span>
              </label>
              <label>Documento<input name="customer_document" type="text" readonly value="${escapeHtml(draft.customer_document)}" /></label>
              <label>Telefone<input name="customer_phone" type="text" readonly value="${escapeHtml(draft.customer_phone)}" /></label>
              <label>E-mail<input name="customer_email" type="email" readonly value="${escapeHtml(draft.customer_email)}" /></label>
            </div>
            <label>Endereco<textarea name="customer_address" readonly>${escapeHtml(draft.customer_address)}</textarea></label>
          </section>

          <section class="service-order-form-section">
            <h4>Informacoes principais</h4>
            <div class="service-order-form-columns service-order-form-columns-2">
              <label>Titulo da OS *<input name="title" type="text" required value="${escapeHtml(draft.title)}" /></label>
              <label>Prioridade<select name="priority">${renderOptions(SERVICE_ORDER_PRIORITIES.map((item) => ({ value: item.value, label: item.label })), draft.priority)}</select></label>
              <label>Status<select name="status">${renderOptions(SERVICE_ORDER_STATUSES.map((item) => ({ value: item.value, label: item.label })), draft.status)}</select></label>
              <label>Tempo estimado<input name="estimated_time" type="text" placeholder="Ex.: 4h30" value="${escapeHtml(draft.estimated_time)}" /></label>
            </div>
            <label>Descricao detalhada<textarea name="description">${escapeHtml(draft.description)}</textarea></label>
            <label>Problema relatado<textarea name="reported_problem">${escapeHtml(draft.reported_problem)}</textarea></label>
            <label>Solucao prevista<textarea name="planned_solution">${escapeHtml(draft.planned_solution)}</textarea></label>
            <label>Observações internas<textarea name="internal_notes">${escapeHtml(draft.internal_notes)}</textarea></label>
          </section>

          <section class="service-order-form-section">
            <h4>Datas e prazos</h4>
            <div class="service-order-form-columns service-order-form-columns-4">
              <label>Inicio<input name="started_at" type="datetime-local" value="${escapeHtml(draft.started_at)}" /></label>
              <label>Prazo previsto<input name="deadline_at" type="date" value="${escapeHtml(draft.deadline_at)}" /></label>
              <label>Conclusao prevista<input name="expected_completion_at" type="date" value="${escapeHtml(draft.expected_completion_at)}" /></label>
              <label>Conclusao real<input name="completed_at" type="datetime-local" value="${escapeHtml(draft.completed_at)}" /></label>
            </div>
            <div class="service-order-form-columns service-order-form-columns-2">
              <label>Tempo real gasto<input name="actual_time" type="text" placeholder="Ex.: 5h15" value="${escapeHtml(draft.actual_time)}" /></label>
              <label>Observações financeiras<textarea name="financial_notes">${escapeHtml(draft.financial_notes)}</textarea></label>
            </div>
          </section>

          <section class="service-order-form-section">
            <h4>Responsaveis</h4>
            <div class="service-order-form-columns service-order-form-columns-2">
              <label>Responsavel principal *<select name="responsible_user_id" required><option value="">Selecione</option>${renderOptions(userOptions, draft.responsible_user_id)}</select></label>
              <div class="service-order-assistant-shell">
                <span>Equipe auxiliar</span>
                <div class="service-order-assistant-list">
                  ${montagemOptions.map((user) => `
                    <label class="service-order-assistant-item">
                      <input data-service-order-assistant type="checkbox" value="${escapeHtml(user.value)}" ${draft.assistant_user_ids.includes(user.value) ? "checked" : ""} />
                      <span>${escapeHtml(user.raw.full_name || user.label)}</span>
                    </label>
                  `).join("") || `<div class="empty-state compact-empty">Nenhum funcionario do departamento de Montagem disponível.</div>`}
                </div>
              </div>
            </div>
          </section>

          <section class="service-order-form-section">
            <div class="service-order-section-header">
              <div>
                <h4>Materiais e pecas</h4>
                <p class="muted">Selecione itens do estoque e confirme a baixa somente quando aplicavel.</p>
              </div>
              <button class="ghost-button" type="button" data-service-order-add-material>Adicionar item</button>
            </div>
            <div class="service-order-material-list">
              ${(draft.materials || []).map(renderServiceOrderMaterialRow).join("")}
            </div>
          </section>

          <section class="service-order-form-section">
            <h4>Vinculos com producao</h4>
            <div class="service-order-form-columns service-order-form-columns-2">
              <label>Ordem de producao vinculada<select name="linked_production_id"><option value="">Nenhuma</option>${renderOptions(productionOptions, draft.linked_production_id)}</select></label>
              <label class="service-order-material-toggle">
                <input name="production_demand_requested" type="checkbox" ${draft.production_demand_requested ? "checked" : ""} />
                Gerar demanda para producao
              </label>
            </div>
            <label>Observações para producao<textarea name="production_demand_notes">${escapeHtml(draft.production_demand_notes)}</textarea></label>
          </section>

          <section class="service-order-form-section">
            <h4>Finalizacao</h4>
            <label>Resultado final<textarea name="result_summary">${escapeHtml(draft.result_summary)}</textarea></label>
            <label>Observacao final<textarea name="final_notes">${escapeHtml(draft.final_notes)}</textarea></label>
          </section>

          <div class="service-order-form-actions">
            <button class="primary-button" type="submit">${draft.edit_id ? "Salvar alterações" : "Salvar OS"}</button>
            <button class="ghost-button" type="button" data-service-order-cancel-form>Cancelar</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderServiceOrderRow(order, canEdit) {
  return `
    <tr>
      <td><strong>${escapeHtml(order.order_number)}</strong></td>
      <td>
        <strong>${escapeHtml(order.customer_name || "-")}</strong>
        <div class="table-inline-copy muted">${escapeHtml(order.order_type || "-")}</div>
      </td>
      <td>
        <strong>${escapeHtml(order.title || "-")}</strong>
        <div class="table-inline-copy muted">${escapeHtml(order.sector || "Sem setor")}</div>
      </td>
      <td>${renderServiceOrderStatusBadge(order.status)}</td>
      <td>${renderServiceOrderPriorityBadge(order.priority)}</td>
      <td>${escapeHtml(order.responsible_name || "-")}</td>
      <td>${order.deadline_at ? formatDate(order.deadline_at) : "-"}</td>
      <td>${formatDate(order.opened_at)}</td>
      <td>${order.linked_production_number ? `<span class="permission-tag">${escapeHtml(order.linked_production_number)}</span>` : `<span class="muted">Nao</span>`}</td>
      <td>${(order.materials || []).some((item) => item.product_id) ? `<span class="permission-tag">${(order.materials || []).filter((item) => item.product_id).length} item(ns)</span>` : `<span class="muted">Nao</span>`}</td>
      <td>${renderServiceOrderActionCell(order, canEdit)}</td>
    </tr>
  `;
}

function renderServiceOrderActionCell(order, canEdit) {
  return `
    <div class="table-actions service-order-action-cell">
      <button class="inline-button" type="button" data-service-order-view="${order.id}">Visualizar</button>
      ${canEdit ? `<button class="inline-button" type="button" data-service-order-edit="${order.id}">Editar</button>` : ""}
      ${canEdit ? `<button class="inline-button" type="button" data-service-order-conclude="${order.id}">Concluir</button>` : ""}
      <button class="inline-button" type="button" data-service-order-print="${order.id}">PDF</button>
      ${canEdit ? `<button class="inline-button danger-button" type="button" data-service-order-delete="${order.id}">${isPermissionsAdmin() ? "Excluir" : "Cancelar"}</button>` : ""}
    </div>
  `;
}

function renderServiceOrderChecklistDetails(order) {
  const checklist = normalizeServiceOrderChecklist(order.checklist_data);
  const hasChecklistContent = checklist.equipment_type || checklist.service_type || checklist.machine_serial || checklist.general_observations
    || SERVICE_ORDER_CHECKLIST_GROUPS.some((group) => (checklist.groups[group.key] || []).some((item) => item.status));

  if (!hasChecklistContent) {
    return `
      <div class="service-order-detail-panel">
        <h4>Checklist tecnico</h4>
        <div class="empty-state compact-empty">Nenhum checklist preenchido nesta ordem de serviço.</div>
      </div>
    `;
  }

  return `
    <div class="service-order-detail-panel">
      <div class="service-order-section-header">
        <div>
          <h4>Checklist tecnico</h4>
          <p class="muted">Equipamento ${escapeHtml(checklist.equipment_type || "-")} · ${escapeHtml(checklist.service_type || "-")}</p>
        </div>
        <div class="service-order-detail-inline">
          ${order.checklist_finalized ? `<span class="status-chip status-completed">Finalizado</span>` : `<span class="status-chip status-pending">Rascunho</span>`}
        </div>
      </div>
      <div class="service-order-details-grid">
        <article class="service-order-detail-panel">
          <h4>Atendimento</h4>
          <p><strong>Data:</strong> ${checklist.service_date ? formatDate(checklist.service_date) : "-"}</p>
          <p><strong>Local:</strong> ${escapeHtml(checklist.customer_location || "-")}</p>
          <p><strong>N/S:</strong> ${escapeHtml(checklist.machine_serial || "-")}</p>
          <p><strong>Finalizado por:</strong> ${escapeHtml(order.checklist_finalized_by_name || "-")}</p>
        </article>
        <article class="service-order-detail-panel">
          <h4>Assinaturas</h4>
          <p><strong>CAPSFARMA:</strong> ${escapeHtml(checklist.caps_responsible_name || "-")} · ${escapeHtml(checklist.caps_responsible_cpf || "-")}</p>
          <p><strong>Cliente:</strong> ${escapeHtml(checklist.customer_responsible_name || "-")} · ${escapeHtml(checklist.customer_responsible_document || "-")}</p>
        </article>
      </div>
      ${SERVICE_ORDER_CHECKLIST_GROUPS.map((group) => `
        <div class="service-order-checklist-detail-group">
          <h4>${escapeHtml(group.title)}</h4>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Observacao</th>
                </tr>
              </thead>
              <tbody>
                ${(checklist.groups[group.key] || []).map((item) => `
                  <tr>
                    <td>${escapeHtml(item.label)}</td>
                    <td>${renderServiceOrderChecklistStatusBadge(item.status)}</td>
                    <td>${escapeHtml(item.observation || "-")}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `).join("")}
      <p><strong>Observações gerais:</strong> ${escapeHtml(checklist.general_observations || "-")}</p>
    </div>
  `;
}

function renderStandaloneChecklistDetails(checklist) {
  if (!checklist) return "";
  return `
    <section class="table-card service-order-details-card">
      <div class="module-head">
        <div>
          <p class="eyebrow muted">Checklist Tecnico</p>
          <h3>${escapeHtml(checklist.checklist_number)} · ${escapeHtml(checklist.customer_name || "-")}</h3>
          <p class="muted">${escapeHtml(checklist.equipment_type || "-")} · ${escapeHtml(checklist.service_type || "-")} · ${escapeHtml(checklist.service_order_number || "Sem O.S. vinculada")}</p>
        </div>
        <div class="module-head-actions">
          <button class="ghost-button" type="button" data-service-order-checklist-print="${checklist.id}">Imprimir PDF</button>
        </div>
      </div>
      <div class="service-order-details-grid">
        <article class="service-order-detail-panel">
          <h4>Atendimento</h4>
          <p><strong>Data:</strong> ${checklist.service_date ? formatDate(checklist.service_date) : "-"}</p>
          <p><strong>Cliente:</strong> ${escapeHtml(checklist.customer_name || "-")}</p>
          <p><strong>Local:</strong> ${escapeHtml(checklist.customer_location || "-")}</p>
          <p><strong>Documento:</strong> ${escapeHtml(checklist.customer_document || "-")}</p>
        </article>
        <article class="service-order-detail-panel">
          <h4>Equipamento</h4>
          <p><strong>Tipo:</strong> ${escapeHtml(checklist.equipment_type || "-")}</p>
          <p><strong>Serviço:</strong> ${escapeHtml(checklist.service_type || "-")}</p>
          <p><strong>N/S:</strong> ${escapeHtml(checklist.machine_serial || "-")}</p>
          <p><strong>Status:</strong> ${renderServiceOrderChecklistStatusBadge(checklist.finalized ? "ok" : "")}</p>
        </article>
      </div>
      ${SERVICE_ORDER_CHECKLIST_GROUPS.map((group) => `
        <div class="service-order-checklist-detail-group">
          <h4>${escapeHtml(group.title)}</h4>
          <div class="table-responsive">
            <table>
              <thead><tr><th>Item</th><th>Status</th><th>Observacao</th></tr></thead>
              <tbody>
                ${(checklist.checklist_groups[group.key] || []).map((item) => `
                  <tr>
                    <td>${escapeHtml(item.label)}</td>
                    <td>${renderServiceOrderChecklistStatusBadge(item.status)}</td>
                    <td>${escapeHtml(item.observation || "-")}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `).join("")}
      <div class="service-order-detail-columns">
        <article class="service-order-detail-panel">
          <h4>Assinaturas</h4>
          <p><strong>CAPSFARMA:</strong> ${escapeHtml(checklist.caps_responsible_name || "-")} · ${escapeHtml(checklist.caps_responsible_cpf || "-")}</p>
          <p><strong>Cliente:</strong> ${escapeHtml(checklist.customer_responsible_name || "-")} · ${escapeHtml(checklist.customer_responsible_document || "-")}</p>
        </article>
        <article class="service-order-detail-panel">
          <h4>Observações</h4>
          <p>${escapeHtml(checklist.general_observations || "-")}</p>
          <p><strong>Finalizado por:</strong> ${escapeHtml(checklist.finalized_by_name || "-")}</p>
          <p><strong>Quando:</strong> ${checklist.finalized_at ? formatDateTime(checklist.finalized_at) : "-"}</p>
        </article>
      </div>
    </section>
  `;
}

function renderServiceOrderDetails(order) {
  if (!order) return "";
  const production = (state.moduleData.production || []).find((item) => item.id === order.linked_production_id);
  return `
    <section class="table-card service-order-details-card">
      <div class="module-head">
        <div>
          <p class="eyebrow muted">Detalhes da OS</p>
          <h3>${escapeHtml(order.order_number)} · ${escapeHtml(order.title || "-")}</h3>
          <p class="muted">${escapeHtml(order.customer_name || "-")} · ${escapeHtml(order.responsible_name || "Sem responsavel")}</p>
        </div>
        <div class="module-head-actions">
          <button class="ghost-button" type="button" data-service-order-print="${order.id}">Imprimir PDF</button>
          ${order.customer_id ? `<button class="ghost-button" type="button" data-service-order-open-customer="${order.customer_id}">Abrir cliente</button>` : ""}
        </div>
      </div>

      <div class="service-order-details-grid">
        <article class="service-order-detail-panel">
          <h4>Status geral</h4>
          <div class="service-order-detail-inline">${renderServiceOrderStatusBadge(order.status)} ${renderServiceOrderPriorityBadge(order.priority)}</div>
          <p><strong>Descricao:</strong> ${escapeHtml(order.description || "-")}</p>
          <p><strong>Problema:</strong> ${escapeHtml(order.reported_problem || "-")}</p>
          <p><strong>Solucao prevista:</strong> ${escapeHtml(order.planned_solution || "-")}</p>
          <p><strong>Observações internas:</strong> ${escapeHtml(order.internal_notes || "-")}</p>
          <p><strong>Resultado final:</strong> ${escapeHtml(order.result_summary || "-")}</p>
        </article>

        <article class="service-order-detail-panel">
          <h4>Cliente e prazo</h4>
          <p><strong>Cliente:</strong> ${escapeHtml(order.customer_name || "-")}</p>
          <p><strong>Documento:</strong> ${escapeHtml(order.customer_document || "-")}</p>
          <p><strong>Telefone:</strong> ${escapeHtml(order.customer_phone || "-")}</p>
          <p><strong>E-mail:</strong> ${escapeHtml(order.customer_email || "-")}</p>
          <p><strong>Abertura:</strong> ${formatDate(order.opened_at)}</p>
          <p><strong>Prazo:</strong> ${order.deadline_at ? formatDate(order.deadline_at) : "-"}</p>
          <p><strong>Conclusao prevista:</strong> ${order.expected_completion_at ? formatDate(order.expected_completion_at) : "-"}</p>
          <p><strong>Conclusao real:</strong> ${order.completed_at ? formatDateTime(order.completed_at) : "-"}</p>
        </article>

        <article class="service-order-detail-panel">
          <h4>Equipe e custos</h4>
          <p><strong>Responsavel:</strong> ${escapeHtml(order.responsible_name || "-")}</p>
          <p><strong>Auxiliares:</strong> ${escapeHtml((order.assistant_names || []).join(", ") || "-")}</p>
          <p><strong>Tempo estimado:</strong> ${escapeHtml(order.estimated_time || "-")}</p>
          <p><strong>Tempo real:</strong> ${escapeHtml(order.actual_time || "-")}</p>
          <p><strong>Financeiro:</strong> ${escapeHtml(order.financial_notes || "-")}</p>
        </article>

        <article class="service-order-detail-panel">
          <h4>Vinculos</h4>
          <p><strong>Producao vinculada:</strong> ${escapeHtml(order.linked_production_number || "-")}</p>
          <p><strong>Status da producao:</strong> ${production ? escapeHtml(getProductionOrderMetadata(production).notes || production.status || "-") : "-"}</p>
          <p><strong>Demanda para producao:</strong> ${order.production_demand_requested ? "Sim" : "Nao"}</p>
          <p><strong>Observacao de producao:</strong> ${escapeHtml(order.production_demand_notes || "-")}</p>
        </article>
      </div>

      <div class="service-order-detail-panel">
        <h4>Materiais e pecas</h4>
        ${(order.materials || []).filter((item) => item.product_id).length
          ? `
            <div class="service-order-material-summary">
              ${(order.materials || []).filter((item) => item.product_id).map((item) => `
                <div class="permission-tag">
                  ${escapeHtml(item.product_name || item.product_code || "-")} · ${formatQuantity(item.quantity)} ${escapeHtml(item.unit || "un")} ${item.confirmed ? "· baixa confirmada" : ""}
                </div>
              `).join("")}
            </div>
          `
          : `<div class="empty-state compact-empty">Nenhum material vinculado.</div>`
        }
      </div>
      <div class="service-order-detail-columns">
        <article class="service-order-detail-panel">
          <div class="service-order-section-header">
            <div>
              <h4>Andamentos</h4>
              <p class="muted">Registro operacional e comentarios internos.</p>
            </div>
          </div>
          <form class="service-order-progress-form">
            <input type="hidden" name="order_id" value="${escapeHtml(order.id)}" />
            <textarea name="progress_note" placeholder="Ex.: serviço iniciado, aguardando material, cliente informado"></textarea>
            <button class="ghost-button" type="submit">Registrar andamento</button>
          </form>
          <div class="service-order-timeline">
            ${(order.progress_entries || []).length
              ? order.progress_entries.map((item) => `
                  <article class="service-order-timeline-item">
                    <strong>${escapeHtml(item.actor_name || "-")}</strong>
                    <p>${escapeHtml(item.note || "-")}</p>
                    <small>${formatDateTime(item.created_at)}</small>
                  </article>
                `).join("")
              : `<div class="empty-state compact-empty">Nenhum andamento registrado.</div>`
            }
          </div>
        </article>

        <article class="service-order-detail-panel">
          <h4>Historico</h4>
          <div class="service-order-timeline">
            ${(order.history_entries || []).length
              ? order.history_entries.map((item) => `
                  <article class="service-order-timeline-item">
                    <strong>${escapeHtml(item.actor_name || "-")}</strong>
                    <p>${escapeHtml(item.message || "-")}</p>
                    <small>${formatDateTime(item.created_at)}</small>
                  </article>
                `).join("")
              : `<div class="empty-state compact-empty">Nenhum historico disponível.</div>`
            }
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderServiceOrderChecklistsView(canEdit) {
  const checklists = filterServiceOrderChecklists((state.moduleData.serviceOrderChecklists || []).map(normalizeServiceOrderChecklistRecord));
  const selectedChecklist = (state.moduleData.serviceOrderChecklists || [])
    .map(normalizeServiceOrderChecklistRecord)
    .find((item) => item.id === state.serviceOrderChecklistSelectedId) || null;
  const customerOptions = (state.moduleData.customers || []).map((customer) => ({ value: customer.id, label: customer.name }));

  return `
    ${renderServiceOrderChecklistStandaloneForm(canEdit)}

    <section class="table-card service-order-filters-card">
      <div class="service-order-section-header">
        <div>
          <h4>Filtros de checklist</h4>
          <p class="muted">Busque por cliente, equipamento, status e periodo.</p>
        </div>
      </div>
      <div class="service-order-filters-grid">
        <label>Busca<input id="service-order-checklist-search" type="search" value="${escapeHtml(state.serviceOrderChecklistFilters.search)}" placeholder="Numero, cliente, O.S., N/S..." /></label>
        <label>Cliente<select id="service-order-checklist-customer-filter"><option value="all">Todos</option>${renderOptions(customerOptions, state.serviceOrderChecklistFilters.customer_id)}</select></label>
        <label>Equipamento<select id="service-order-checklist-equipment-filter"><option value="all">Todos</option>${renderOptionList(SERVICE_ORDER_CHECKLIST_EQUIPMENT_TYPES, state.serviceOrderChecklistFilters.equipment_type, true)}</select></label>
        <label>Status<select id="service-order-checklist-status-filter">${renderOptions([{ value: "all", label: "Todos" }, { value: "draft", label: "Em preenchimento" }, { value: "finalized", label: "Finalizado" }], state.serviceOrderChecklistFilters.status)}</select></label>
        <label>Data inicial<input id="service-order-checklist-date-from-filter" type="date" value="${escapeHtml(state.serviceOrderChecklistFilters.date_from)}" /></label>
        <label>Data final<input id="service-order-checklist-date-to-filter" type="date" value="${escapeHtml(state.serviceOrderChecklistFilters.date_to)}" /></label>
      </div>
    </section>

    <section class="table-card service-order-table-card">
      <div class="service-order-section-header">
        <div>
          <h4>Listagem de checklists</h4>
          <p class="muted">${checklists.length} checklist(s) encontrado(s).</p>
        </div>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Numero</th>
              <th>Cliente</th>
              <th>Equipamento</th>
              <th>Serviço</th>
              <th>Status</th>
              <th>Data</th>
              <th>O.S.</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            ${
              checklists.length
                ? checklists.map((item) => `
                  <tr>
                    <td><strong>${escapeHtml(item.checklist_number)}</strong></td>
                    <td>${escapeHtml(item.customer_name || "-")}</td>
                    <td>${escapeHtml(item.equipment_type || "-")}</td>
                    <td>${escapeHtml(item.service_type || "-")}</td>
                    <td>${item.finalized ? `<span class="status-chip status-completed">Finalizado</span>` : `<span class="status-chip status-pending">Rascunho</span>`}</td>
                    <td>${item.service_date ? formatDate(item.service_date) : "-"}</td>
                    <td>${escapeHtml(item.service_order_number || "-")}</td>
                    <td>
                      <div class="table-actions service-order-action-cell">
                        <button class="inline-button" type="button" data-service-order-checklist-view="${item.id}">Visualizar</button>
                        ${canEdit ? `<button class="inline-button" type="button" data-service-order-checklist-edit="${item.id}">Editar</button>` : ""}
                        <button class="inline-button" type="button" data-service-order-checklist-print="${item.id}">PDF</button>
                        ${canEdit ? `<button class="inline-button danger-button" type="button" data-service-order-checklist-delete="${item.id}">Excluir</button>` : ""}
                      </div>
                    </td>
                  </tr>
                `).join("")
                : `<tr><td colspan="8"><div class="empty-state compact-empty">Nenhum checklist encontrado.</div></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>

    ${renderStandaloneChecklistDetails(selectedChecklist)}
  `;
}

function renderServiceOrdersModule() {
  if (!hasPermission("service_orders", "view")) {
    return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de ordem de serviço.");
  }

  const canEdit = hasPermission("service_orders", "edit");
  const activeTab = state.serviceOrdersTab || "orders";
  const visibleOrders = getVisibleServiceOrders();
  const filteredOrders = filterServiceOrders(visibleOrders);
  const filters = buildServiceOrderFilters();
  const unreadNotifications = getUnreadServiceOrderNotifications();
  const selectedOrder = visibleOrders.find((item) => item.id === state.serviceOrderSelectedId) || null;
  const counts = {
    open: visibleOrders.filter((item) => ["open", "analysis", "approval"].includes(item.status)).length,
    progress: visibleOrders.filter((item) => item.status === "in_progress").length,
    urgent: visibleOrders.filter((item) => item.priority === "urgent").length,
    waitingMaterial: visibleOrders.filter((item) => item.status === "waiting_material").length,
    waitingProduction: visibleOrders.filter((item) => item.status === "waiting_production").length,
    completed: visibleOrders.filter((item) => item.status === "completed").length,
  };

  return `
    <section class="module-panel service-orders-module">
      <div class="module-head service-orders-head">
        <div>
          <p class="eyebrow muted">Assistencia e operacoes</p>
          <h3>Ordem de Serviço</h3>
          <p class="muted">Ordens de serviço e checklists tecnicos separados, com rastreabilidade entre eles.</p>
        </div>
        <div class="module-head-actions">
          ${canEdit && activeTab === "orders" ? `<button class="primary-button" type="button" data-service-order-create>Nova Ordem de Serviço</button>` : ""}
          ${canEdit && activeTab === "checklists" ? `<button class="primary-button" type="button" data-service-order-checklist-create>Novo Checklist</button>` : ""}
        </div>
      </div>

      <div class="sales-config-tabs service-order-tabs">
        ${SERVICE_ORDER_MODULE_TABS.map((tab) => `
          <button class="sales-config-tab ${activeTab === tab.key ? "active" : ""}" type="button" data-service-orders-tab="${tab.key}">
            ${escapeHtml(tab.label)}
          </button>
        `).join("")}
      </div>

      ${activeTab === "orders" ? `
      <div class="summary-grid service-orders-summary-grid">
        ${renderKpiCard({ label: "OS abertas", value: counts.open, note: "Analise e aprovacao pendentes", icon: "OS", tone: "amber" })}
        ${renderKpiCard({ label: "Em andamento", value: counts.progress, note: "Execucao ativa", icon: "GO", tone: "blue" })}
        ${renderKpiCard({ label: "Urgentes", value: counts.urgent, note: "Prioridade maxima", icon: "!!", tone: "red" })}
        ${renderKpiCard({ label: "Aguardando material", value: counts.waitingMaterial, note: "Dependem de estoque ou compras", icon: "MAT", tone: "amber" })}
        ${renderKpiCard({ label: "Aguardando producao", value: counts.waitingProduction, note: "Com dependencia fabril", icon: "PRD", tone: "blue" })}
        ${renderKpiCard({ label: "Concluidas", value: counts.completed, note: "Historico fechado", icon: "OK", tone: "green" })}
      </div>

      <section class="table-card service-order-alert-panel">
        <div class="service-order-section-header">
          <div>
            <h4>Alertas da equipe</h4>
            <p class="muted">Novas OS, reatribuicoes, urgencias e mudancas relevantes para os seus atendimentos.</p>
          </div>
          ${unreadNotifications.length ? `<span class="notification-pill">${unreadNotifications.length}</span>` : ""}
        </div>
        ${renderServiceOrderAlertStrip(unreadNotifications)}
      </section>

      ${renderServiceOrderForm(canEdit)}

      <section class="table-card service-order-filters-card">
        <div class="service-order-section-header">
          <div>
            <h4>Filtros operacionais</h4>
            <p class="muted">Refine por numero, cliente, status, prioridade, responsavel, setor, tipo e vinculos.</p>
          </div>
        </div>
        <div class="service-order-filters-grid">
          <label>Busca<input id="service-order-search" type="search" value="${escapeHtml(state.serviceOrderFilters.search)}" placeholder="Numero, cliente, titulo..." /></label>
          <label>Status<select id="service-order-status-filter"><option value="all">Todos</option>${renderOptions(SERVICE_ORDER_STATUSES.map((item) => ({ value: item.value, label: item.label })), state.serviceOrderFilters.status)}</select></label>
          <label>Prioridade<select id="service-order-priority-filter"><option value="all">Todas</option>${renderOptions(SERVICE_ORDER_PRIORITIES.map((item) => ({ value: item.value, label: item.label })), state.serviceOrderFilters.priority)}</select></label>
          <label>Cliente<select id="service-order-customer-filter"><option value="all">Todos</option>${renderOptions(filters.customers, state.serviceOrderFilters.customer_id)}</select></label>
          <label>Responsavel<select id="service-order-responsible-filter"><option value="all">Todos</option>${renderOptions(filters.users, state.serviceOrderFilters.responsible_user_id)}</select></label>
          <label>Setor<select id="service-order-sector-filter"><option value="all">Todos</option>${renderOptionList(SERVICE_ORDER_SECTORS, state.serviceOrderFilters.sector, true)}</select></label>
          <label>Tipo<select id="service-order-type-filter"><option value="all">Todos</option>${renderOptionList(SERVICE_ORDER_TYPES, state.serviceOrderFilters.order_type, true)}</select></label>
          <label>Producao<select id="service-order-production-link-filter">${renderOptions([{ value: "all", label: "Todos" }, { value: "yes", label: "Com vinculo" }, { value: "no", label: "Sem vinculo" }], state.serviceOrderFilters.has_production_link)}</select></label>
          <label>Estoque<select id="service-order-stock-link-filter">${renderOptions([{ value: "all", label: "Todos" }, { value: "yes", label: "Com itens" }, { value: "no", label: "Sem itens" }], state.serviceOrderFilters.has_stock_link)}</select></label>
          <label>Data inicial<input id="service-order-date-from-filter" type="date" value="${escapeHtml(state.serviceOrderFilters.date_from)}" /></label>
          <label>Data final<input id="service-order-date-to-filter" type="date" value="${escapeHtml(state.serviceOrderFilters.date_to)}" /></label>
        </div>
      </section>

      <section class="table-card service-order-table-card">
        <div class="service-order-section-header">
          <div>
            <h4>Listagem de OS</h4>
            <p class="muted">${filteredOrders.length} ordem(ns) encontrada(s) para o seu perfil.</p>
          </div>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Numero</th>
                <th>Cliente</th>
                <th>Titulo</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Responsavel</th>
                <th>Prazo</th>
                <th>Abertura</th>
                <th>Producao</th>
                <th>Estoque</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.length ? filteredOrders.map((order) => renderServiceOrderRow(order, canEdit)).join("") : `<tr><td colspan="11"><div class="empty-state compact-empty">Nenhuma ordem de serviço encontrada.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      ${renderServiceOrderDetails(selectedOrder)}
      ` : renderServiceOrderChecklistsView(canEdit)}
    </section>
  `;
}

function renderOptionList(options, selectedValue = "", includeAll = false) {
  return options.map((option) => {
    const value = String(option || "");
    return `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(value)}</option>`;
  }).join("");
}

function bindServiceOrdersModuleEvents() {
  document.querySelectorAll("[data-service-orders-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.serviceOrdersTab = button.dataset.serviceOrdersTab || "orders";
      state.openAccordionKey = null;
      renderActiveModule();
    });
  });

  document.querySelector("[data-service-order-create]")?.addEventListener("click", () => {
    state.serviceOrderDraft = createEmptyServiceOrderDraft();
    state.serviceOrderFormTab = "details";
    state.serviceOrdersTab = "orders";
    state.openAccordionKey = "service-order-form";
    renderActiveModule();
    document.querySelector("#service-order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("[data-service-order-cancel-form]")?.addEventListener("click", resetServiceOrderForm);
  document.querySelector("[data-service-order-open-customer-picker]")?.addEventListener("click", openServiceOrderCustomerPicker);
  document.querySelector("[data-service-order-checklist-create]")?.addEventListener("click", () => {
    state.serviceOrderChecklistDraft = createEmptyServiceOrderChecklistDraft();
    state.serviceOrdersTab = "checklists";
    state.serviceOrderChecklistFilters = createEmptyServiceOrderChecklistFilters();
    state.openAccordionKey = "service-order-checklist-form";
    renderActiveModule();
    document.querySelector("#service-order-checklist-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("[data-service-order-checklist-cancel-form]")?.addEventListener("click", resetServiceOrderChecklistForm);

  const form = document.querySelector("#service-order-form");
  if (form) {
    form.addEventListener("submit", handleServiceOrderSubmit);
    form.addEventListener("input", (event) => {
      const target = event.target;
      if (target.dataset.serviceOrderMaterialField) {
        const index = Number(target.dataset.serviceOrderMaterialIndex);
        const field = target.dataset.serviceOrderMaterialField;
        updateServiceOrderMaterialState(index, {
          [field]: field === "confirmed" ? target.checked : target.value,
        });
        return;
      }
      syncServiceOrderDraftFromForm(form);
    });
    form.addEventListener("change", (event) => {
      const target = event.target;
      if (target.name === "customer_id") {
        syncServiceOrderDraftFromForm(form);
        renderActiveModule();
        return;
      }

      if (target.dataset.serviceOrderMaterialField) {
        const index = Number(target.dataset.serviceOrderMaterialIndex);
        const field = target.dataset.serviceOrderMaterialField;
        updateServiceOrderMaterialState(index, {
          [field]: field === "confirmed" ? target.checked : target.value,
        });
        return;
      }

      syncServiceOrderDraftFromForm(form);
    });
  }

  const checklistForm = document.querySelector("#service-order-checklist-form");
  if (checklistForm) {
    checklistForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveServiceOrderChecklistFromForm(checklistForm, { finalizeChecklist: false });
    });
    checklistForm.addEventListener("input", (event) => {
      const target = event.target;
      if (target.dataset.serviceOrderChecklistObservation) {
        const groupKey = target.dataset.serviceOrderChecklistGroup;
        const index = Number(target.dataset.serviceOrderChecklistIndex);
        const nextChecklist = normalizeServiceOrderChecklist({ groups: state.serviceOrderChecklistDraft.checklist_groups }).groups;
        if (nextChecklist[groupKey]?.[index]) {
          nextChecklist[groupKey][index].observation = target.value;
          state.serviceOrderChecklistDraft.checklist_groups = nextChecklist;
        }
        return;
      }
      syncServiceOrderChecklistDraftFromForm(checklistForm);
    });
    checklistForm.addEventListener("change", (event) => {
      const target = event.target;
      if (target.dataset.serviceOrderChecklistObservation) {
        const groupKey = target.dataset.serviceOrderChecklistGroup;
        const index = Number(target.dataset.serviceOrderChecklistIndex);
        const nextChecklist = normalizeServiceOrderChecklist({ groups: state.serviceOrderChecklistDraft.checklist_groups }).groups;
        if (nextChecklist[groupKey]?.[index]) {
          nextChecklist[groupKey][index].observation = target.value;
          state.serviceOrderChecklistDraft.checklist_groups = nextChecklist;
        }
        return;
      }
      syncServiceOrderChecklistDraftFromForm(checklistForm);
      if (target.name === "customer_id" || target.name === "service_order_id") {
        renderActiveModule();
      }
    });
  }

  document.querySelector("[data-service-order-checklist-finalize]")?.addEventListener("click", async () => {
    const currentForm = document.querySelector("#service-order-checklist-form");
    if (!currentForm) return;
    await saveServiceOrderChecklistFromForm(currentForm, { finalizeChecklist: true });
  });

  document.querySelectorAll("[data-service-order-checklist-status]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupKey = button.dataset.serviceOrderChecklistGroup;
      const index = Number(button.dataset.serviceOrderChecklistIndex);
      const status = button.dataset.serviceOrderChecklistStatus || "";
      const nextChecklist = normalizeServiceOrderChecklist({ groups: state.serviceOrderChecklistDraft.checklist_groups }).groups;
      if (!nextChecklist[groupKey]?.[index]) return;
      nextChecklist[groupKey][index].status = status;
      if (status === "ok") {
        nextChecklist[groupKey][index].observation = "";
      }
      state.serviceOrderChecklistDraft.checklist_groups = nextChecklist;
      renderActiveModule();
    });
  });

  document.querySelector("[data-service-order-add-material]")?.addEventListener("click", () => {
    state.serviceOrderDraft.materials.push(createEmptyServiceOrderMaterial());
    renderActiveModule();
  });

  document.querySelectorAll("[data-service-order-remove-material]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.serviceOrderRemoveMaterial);
      state.serviceOrderDraft.materials = state.serviceOrderDraft.materials.filter((_, itemIndex) => itemIndex !== index);
      if (!state.serviceOrderDraft.materials.length) {
        state.serviceOrderDraft.materials = [createEmptyServiceOrderMaterial()];
      }
      renderActiveModule();
    });
  });
  document.querySelectorAll("[data-service-order-open-material-picker]").forEach((button) => {
    button.addEventListener("click", () => openServiceOrderMaterialPicker(Number(button.dataset.serviceOrderOpenMaterialPicker)));
  });

  [
    ["#service-order-search", "search"],
    ["#service-order-status-filter", "status"],
    ["#service-order-priority-filter", "priority"],
    ["#service-order-customer-filter", "customer_id"],
    ["#service-order-responsible-filter", "responsible_user_id"],
    ["#service-order-sector-filter", "sector"],
    ["#service-order-type-filter", "order_type"],
    ["#service-order-production-link-filter", "has_production_link"],
    ["#service-order-stock-link-filter", "has_stock_link"],
    ["#service-order-date-from-filter", "date_from"],
    ["#service-order-date-to-filter", "date_to"],
  ].forEach(([selector, field]) => {
    document.querySelector(selector)?.addEventListener("input", (event) => {
      state.serviceOrderFilters[field] = event.currentTarget.value;
      renderActiveModule();
    });
    document.querySelector(selector)?.addEventListener("change", (event) => {
      state.serviceOrderFilters[field] = event.currentTarget.value;
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-service-order-view]").forEach((button) => {
    button.addEventListener("click", () => selectServiceOrderDetails(button.dataset.serviceOrderView));
  });
  document.querySelectorAll("[data-service-order-edit]").forEach((button) => {
    button.addEventListener("click", () => openServiceOrderForEdit(button.dataset.serviceOrderEdit));
  });
  document.querySelectorAll("[data-service-order-conclude]").forEach((button) => {
    button.addEventListener("click", () => handleServiceOrderQuickConclude(button.dataset.serviceOrderConclude));
  });
  document.querySelectorAll("[data-service-order-delete]").forEach((button) => {
    button.addEventListener("click", () => handleServiceOrderDelete(button.dataset.serviceOrderDelete));
  });
  document.querySelectorAll("[data-service-order-print]").forEach((button) => {
    button.addEventListener("click", () => openServiceOrderPrint(button.dataset.serviceOrderPrint));
  });
  document.querySelectorAll("[data-service-order-open-customer]").forEach((button) => {
    button.addEventListener("click", () => {
      const customer = (state.moduleData.customers || []).find((item) => item.id === button.dataset.serviceOrderOpenCustomer);
      state.activeModule = "customers";
      state.customerSearch = customer?.name || "";
      renderModuleNav();
      renderActiveModule();
    });
  });
  document.querySelectorAll(".service-order-progress-form").forEach((formElement) => {
    formElement.addEventListener("submit", handleServiceOrderAddProgress);
  });

  [
    ["#service-order-checklist-search", "search"],
    ["#service-order-checklist-customer-filter", "customer_id"],
    ["#service-order-checklist-equipment-filter", "equipment_type"],
    ["#service-order-checklist-status-filter", "status"],
    ["#service-order-checklist-date-from-filter", "date_from"],
    ["#service-order-checklist-date-to-filter", "date_to"],
  ].forEach(([selector, field]) => {
    document.querySelector(selector)?.addEventListener("input", (event) => {
      state.serviceOrderChecklistFilters[field] = event.currentTarget.value;
      renderActiveModule();
    });
    document.querySelector(selector)?.addEventListener("change", (event) => {
      state.serviceOrderChecklistFilters[field] = event.currentTarget.value;
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-service-order-checklist-view]").forEach((button) => {
    button.addEventListener("click", () => selectServiceOrderChecklistDetails(button.dataset.serviceOrderChecklistView));
  });
  document.querySelectorAll("[data-service-order-checklist-edit]").forEach((button) => {
    button.addEventListener("click", () => openServiceOrderChecklistForEdit(button.dataset.serviceOrderChecklistEdit));
  });
  document.querySelectorAll("[data-service-order-checklist-delete]").forEach((button) => {
    button.addEventListener("click", () => handleServiceOrderChecklistDelete(button.dataset.serviceOrderChecklistDelete));
  });
  document.querySelectorAll("[data-service-order-checklist-print]").forEach((button) => {
    button.addEventListener("click", () => openServiceOrderChecklistPrint(button.dataset.serviceOrderChecklistPrint));
  });
}

function buildServiceOrderPrintHtml(order) {
  const production = (state.moduleData.production || []).find((item) => item.id === order.linked_production_id);
  const company = getServiceOrderCompanyProfile();
  const materialsRows = (order.materials || []).filter((item) => item.product_id).map((item) => `
    <tr>
      <td>${escapeHtml(item.product_name || item.product_code || "-")}</td>
      <td>${formatQuantity(item.quantity)}</td>
      <td>${escapeHtml(item.unit || "un")}</td>
      <td>${item.confirmed ? "Confirmado" : "Pendente"}</td>
    </tr>
  `).join("");

  return `
    <article class="sales-document-sheet">
      <header class="sales-document-header">
        <div class="sales-document-brand">
          ${
            company.logo
              ? `<img class="sales-document-logo" src="${company.logo}" alt="Logo ${escapeHtml(company.company_name || "empresa")}" />`
              : `<div class="sales-document-logo-placeholder">${escapeHtml((company.company_name || "CP").slice(0, 2).toUpperCase())}</div>`
          }
          <div>
            <strong>${escapeHtml(company.company_name)}</strong>
            <p>CNPJ: ${escapeHtml(company.cnpj || "-")}</p>
            <p>IE: ${escapeHtml(company.state_registration || "-")}</p>
            <p>${escapeHtml(company.address || "-")}</p>
            <p>${escapeHtml(company.phone || "-")} ${company.email ? `· ${escapeHtml(company.email)}` : ""}</p>
          </div>
        </div>
        <div>
          <strong>Ordem de Serviço</strong>
          <p>${escapeHtml(order.order_number)}</p>
          <p>${formatDate(order.opened_at)}</p>
          ${renderServiceOrderStatusBadge(order.status)}
          ${renderServiceOrderPriorityBadge(order.priority)}
        </div>
      </header>
      <section class="sales-document-banner">
        <p><strong>Cliente:</strong> ${escapeHtml(order.customer_name || "-")}</p>
        <p><strong>Documento:</strong> ${escapeHtml(order.customer_document || "-")}</p>
        <p><strong>Contato:</strong> ${escapeHtml(order.customer_phone || "-")} · ${escapeHtml(order.customer_email || "-")}</p>
      </section>
      <section class="sales-document-body">
        <h3>${escapeHtml(order.title || "-")}</h3>
        <p><strong>Descricao:</strong> ${escapeHtml(order.description || "-")}</p>
        <p><strong>Problema relatado:</strong> ${escapeHtml(order.reported_problem || "-")}</p>
        <p><strong>Solucao prevista:</strong> ${escapeHtml(order.planned_solution || "-")}</p>
        <p><strong>Responsavel principal:</strong> ${escapeHtml(order.responsible_name || "-")}</p>
        <p><strong>Equipe auxiliar:</strong> ${escapeHtml((order.assistant_names || []).join(", ") || "-")}</p>
        <p><strong>Setor / Tipo:</strong> ${escapeHtml(order.sector || "-")} · ${escapeHtml(order.order_type || "-")}</p>
        <p><strong>Prazo:</strong> ${order.deadline_at ? formatDate(order.deadline_at) : "-"}</p>
        <p><strong>Tempo estimado / real:</strong> ${escapeHtml(order.estimated_time || "-")} / ${escapeHtml(order.actual_time || "-")}</p>
        <p><strong>Vinculo com producao:</strong> ${escapeHtml(order.linked_production_number || "-")} ${production ? `· ${escapeHtml(production.status || "-")}` : ""}</p>
        <h4>Materiais e pecas</h4>
        <table class="sales-document-items-table">
          <thead><tr><th>Item</th><th>Qtd</th><th>Un.</th><th>Status</th></tr></thead>
          <tbody>${materialsRows || `<tr><td colspan="4">Nenhum material informado.</td></tr>`}</tbody>
        </table>
        <p><strong>Observações internas:</strong> ${escapeHtml(order.internal_notes || "-")}</p>
        <p><strong>Observações finais:</strong> ${escapeHtml(order.final_notes || "-")}</p>
        <p><strong>Resultado:</strong> ${escapeHtml(order.result_summary || "-")}</p>
      </section>
    </article>
  `;
}

function buildServiceOrderChecklistPrintHtml(checklist) {
  const company = getServiceOrderCompanyProfile();
  const checklistGroupsHtml = SERVICE_ORDER_CHECKLIST_GROUPS.map((group) => `
    <table class="checklist-print-table">
      <thead><tr><th colspan="3">${escapeHtml(group.title)}</th></tr></thead>
      <tbody>
        ${(checklist.checklist_groups[group.key] || []).map((item) => `
          <tr>
            <td>${escapeHtml(item.label)}</td>
            <td>${escapeHtml(getServiceOrderChecklistStatusLabel(item.status))}</td>
            <td>${escapeHtml(item.observation || "-")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `).join("");

  return `
    <style>
      .checklist-print-sheet { width: 100%; min-height: 0; background: #fff; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 1.22; }
      .checklist-print-header { display: grid; grid-template-columns: 1.4fr 0.7fr; gap: 8px; align-items: start; border: 1px solid #111827; }
      .checklist-print-brand { display: grid; grid-template-columns: 86px 1fr; gap: 8px; padding: 7px; border-right: 1px solid #111827; }
      .checklist-print-logo, .checklist-print-logo-placeholder { width: 78px; height: 42px; object-fit: contain; }
      .checklist-print-logo-placeholder { display: grid; place-items: center; border: 1px solid #111827; font-weight: 700; }
      .checklist-print-company strong { display: block; font-size: 12px; margin-bottom: 2px; }
      .checklist-print-company p, .checklist-print-meta p, .checklist-print-info p, .checklist-print-signature-card p { margin: 0 0 2px; }
      .checklist-print-meta { padding: 7px; text-align: center; }
      .checklist-print-meta strong { display: block; font-size: 14px; margin-bottom: 5px; text-transform: uppercase; }
      .checklist-print-info { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid #111827; border-top: 0; }
      .checklist-print-info p { min-height: 25px; padding: 5px 6px; border-right: 1px solid #111827; }
      .checklist-print-info p:nth-child(4n) { border-right: 0; }
      .checklist-print-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 7px; border: 1px solid #111827; }
      .checklist-print-table th { padding: 5px 6px; background: #e5e7eb; border-bottom: 1px solid #111827; font-size: 10px; text-align: left; text-transform: uppercase; }
      .checklist-print-table td { padding: 4px 6px; border-top: 1px solid #111827; border-right: 1px solid #111827; vertical-align: top; }
      .checklist-print-table td:nth-child(1) { width: 38%; }
      .checklist-print-table td:nth-child(2) { width: 16%; text-align: center; font-weight: 700; }
      .checklist-print-table td:nth-child(3) { width: 46%; border-right: 0; }
      .checklist-print-observations { margin: 7px 0 0; padding: 6px; min-height: 34px; border: 1px solid #111827; }
      .checklist-print-signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 8px; }
      .checklist-print-signature-card { min-height: 92px; padding: 7px; border: 1px solid #111827; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; }
      .checklist-print-signature-line { display: block; min-height: 42px; border-bottom: 1px solid #111827; margin-bottom: 5px; }
      .checklist-print-signature-image { display: block; width: 100%; max-height: 48px; object-fit: contain; border-bottom: 1px solid #111827; margin-bottom: 5px; }
      @media print {
        @page { size: A4; margin: 7mm; }
        .checklist-print-sheet { page-break-inside: avoid; break-inside: avoid; }
        .checklist-print-table { margin-top: 5px; }
        .checklist-print-table th { padding: 4px 5px; }
        .checklist-print-table td { padding: 3px 5px; font-size: 9.5px; line-height: 1.12; }
        .checklist-print-observations { min-height: 28px; }
        .checklist-print-signature-card { min-height: 78px; }
      }
    </style>
    <article class="sales-document-sheet checklist-print-sheet">
      <header class="checklist-print-header">
        <div class="checklist-print-brand">
          ${
            company.logo
              ? `<img class="checklist-print-logo" src="${company.logo}" alt="Logo ${escapeHtml(company.company_name || "empresa")}" />`
              : `<div class="checklist-print-logo-placeholder">${escapeHtml((company.company_name || "CP").slice(0, 2).toUpperCase())}</div>`
          }
          <div class="checklist-print-company">
            <strong>${escapeHtml(company.company_name)}</strong>
            <p>CNPJ: ${escapeHtml(company.cnpj || "-")}</p>
            <p>IE: ${escapeHtml(company.state_registration || "-")}</p>
            <p>${escapeHtml(company.address || "-")}</p>
            <p>${escapeHtml(company.phone || "-")} ${company.email ? `· ${escapeHtml(company.email)}` : ""}</p>
          </div>
        </div>
        <div class="checklist-print-meta">
          <strong>Check-list CAPSFARMA</strong>
          <p>${escapeHtml(checklist.checklist_number)}</p>
          <p>${checklist.service_date ? formatDate(checklist.service_date) : "-"}</p>
        </div>
      </header>
      <section class="checklist-print-info">
        <p><strong>Cliente:</strong> ${escapeHtml(checklist.customer_name || "-")}</p>
        <p><strong>Local:</strong> ${escapeHtml(checklist.customer_location || "-")}</p>
        <p><strong>Documento:</strong> ${escapeHtml(checklist.customer_document || "-")}</p>
        <p><strong>O.S. vinculada:</strong> ${escapeHtml(checklist.service_order_number || "-")}</p>
        <p><strong>Equipamento:</strong> ${escapeHtml(checklist.equipment_type || "-")}</p>
        <p><strong>Tipo de serviço:</strong> ${escapeHtml(checklist.service_type || "-")}</p>
        <p><strong>N/S da maquina:</strong> ${escapeHtml(checklist.machine_serial || "-")}</p>
        <p><strong>Data:</strong> ${checklist.service_date ? formatDate(checklist.service_date) : "-"}</p>
      </section>
      <section>
        ${checklistGroupsHtml}
        <p class="checklist-print-observations"><strong>Observações gerais:</strong> ${escapeHtml(checklist.general_observations || "-")}</p>
        <div class="checklist-print-signatures">
          <div class="checklist-print-signature-card">
            ${renderServiceOrderChecklistSignatureForPrint(checklist.caps_signature)}
            <strong>Responsavel CAPSFARMA</strong>
            <p>${escapeHtml(checklist.caps_responsible_name || "-")}</p>
            <p>${escapeHtml(checklist.caps_responsible_cpf || "-")}</p>
          </div>
          <div class="checklist-print-signature-card">
            ${renderServiceOrderChecklistSignatureForPrint(checklist.customer_signature)}
            <strong>Responsavel do cliente</strong>
            <p>${escapeHtml(checklist.customer_responsible_name || "-")}</p>
            <p>${escapeHtml(checklist.customer_responsible_document || "-")}</p>
          </div>
        </div>
      </section>
    </article>
  `;
}

function openServiceOrderPrint(orderId) {
  const order = (state.moduleData.serviceOrders || []).find((item) => item.id === orderId);
  if (!order) return;
  openPrintWindowForHtml(buildServiceOrderPrintHtml(order), `OS ${order.order_number}`);
}

function openServiceOrderChecklistPrint(checklistId) {
  const checklist = (state.moduleData.serviceOrderChecklists || []).map(normalizeServiceOrderChecklistRecord).find((item) => item.id === checklistId);
  if (!checklist) return;
  openPrintWindowForHtml(buildServiceOrderChecklistPrintHtml(checklist), `Checklist ${checklist.checklist_number}`);
}

function watchServiceOrders() {
  const unread = getUnreadServiceOrderNotifications();
  if (!unread.length) return;
  unread.slice(0, 3).forEach((notification) => {
    showToast(notification.message, notification.type === "completed" ? "success" : "warning");
    playNotificationSound(notification.type === "warning" ? "warning" : notification.type);
  });
  markServiceOrderNotificationsAsSeen(unread);
}

function subscribeToServiceOrderNotifications() {
  if (!state.supabase || !hasPermission("service_orders", "view")) return;
  if (state.serviceOrderChannel) return;

  state.serviceOrderChannel = state.supabase
    .channel("service_orders_live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "service_orders" },
      async () => {
        await loadServiceOrdersTable();
        watchServiceOrders();
        if (state.activeModule === "service_orders") {
          renderActiveModule();
        }
      }
    )
    .subscribe();
}

async function maybeGenerateServiceOrderFromCompletedProduction(order, product, previousOrder = null) {
  if (!order || !product || product.category !== "finished_product") return;
  if (order.status !== "completed") return;
  if (previousOrder?.status === "completed") return;

  const shouldGenerate = window.confirm(`A producao ${order.order_number} foi concluida. Deseja gerar uma Ordem de Serviço para esse produto final?`);
  if (!shouldGenerate) return;

  const customers = (state.moduleData.customers || []);
  if (!customers.length) {
    showToast("Cadastre ao menos um cliente antes de gerar a Ordem de Serviço.", "warning");
    return;
  }

  const suggestedCustomer = customers.find((customer) => {
    const metadata = getCustomerMetadata(customer);
    return [customer.name, metadata.document, metadata.email].some((value) =>
      String(value || "").toLowerCase().includes(String(order.customer_name || "").toLowerCase())
    );
  });
  const promptLabel = customers.slice(0, 12).map((customer) => customer.name).join(", ");
  const customerInput = window.prompt(
    `Para qual cliente a OS deve ser gerada?\nInforme o nome completo do cliente.\nSugestoes: ${promptLabel}`,
    suggestedCustomer?.name || ""
  );
  if (customerInput === null) return;

  const selectedCustomer = customers.find((customer) => String(customer.name || "").trim().toLowerCase() === customerInput.trim().toLowerCase());
  if (!selectedCustomer) {
    showToast("Cliente não encontrado para gerar a Ordem de Serviço.", "warning");
    return;
  }

  const customerSnapshot = getServiceOrderCustomerSnapshot(selectedCustomer.id);
  const adminUsers = getAssignableServiceOrderUsers().filter((user) => ["ADMNISTRADOR", "TI"].includes(String(user.raw.role || "").trim().toUpperCase()));
  const adminIds = adminUsers.map((user) => user.value);
  const primaryAdmin = adminUsers[0]?.raw || null;
  const serviceOrder = normalizeServiceOrderRecord({
    order_number: generateServiceOrderNumber(),
    opened_at: new Date().toISOString().slice(0, 10),
    created_by_user_id: state.currentUser?.user_id || "",
    created_by_name: getLoggedUserName(""),
    sector: "Montagem",
    order_type: "Interna",
    customer_id: selectedCustomer.id,
    customer_name: customerSnapshot.customer_name,
    customer_phone: customerSnapshot.customer_phone,
    customer_email: customerSnapshot.customer_email,
    customer_document: customerSnapshot.customer_document,
    customer_address: customerSnapshot.customer_address,
    title: `OS pos-producao - ${product.name}`,
    description: `Gerada automaticamente apos a conclusao da ordem de producao ${order.order_number}.`,
    reported_problem: "Produto final concluido em producao aguardando analise administrativa para liberacao de serviço.",
    planned_solution: "Analisar e liberar a execucao da Ordem de Serviço vinculada ao produto final.",
    internal_notes: `Origem automatica da producao ${order.order_number}.`,
    priority: "medium",
    status: "analysis",
    linked_production_id: order.id,
    linked_production_number: order.order_number,
    responsible_user_id: primaryAdmin?.id || primaryAdmin?.user_id || "",
    responsible_name: primaryAdmin?.full_name || "Aguardando liberacao administrativa",
    assistant_user_ids: [],
    assistant_names: [],
    history_entries: [
      createServiceOrderHistoryEntry(`OS gerada automaticamente a partir da producao ${order.order_number}.`, "created"),
      createServiceOrderHistoryEntry("Aguardando liberacao administrativa.", "warning"),
    ],
    notifications: [
      buildServiceOrderNotification(`Nova OS ${generateServiceOrderNumber()} aguardando liberacao da producao ${order.order_number}.`, "warning", adminIds),
    ],
  });

  serviceOrder.notifications[0].message = `Nova OS ${serviceOrder.order_number} aguardando liberacao da producao ${order.order_number}.`;

  await persistServiceOrder(serviceOrder, null);
  await loadServiceOrdersTable();
  showToast(`OS ${serviceOrder.order_number} criada em analise e enviada para liberacao administrativa.`, "success");
  if (adminIds.length && ["ADMNISTRADOR", "TI"].includes(String(state.currentUser?.role || "").trim().toUpperCase())) {
    watchServiceOrders();
  }
}
