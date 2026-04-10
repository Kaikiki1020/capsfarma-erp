const SERVICE_ORDERS_STORAGE_KEY = "capsfarma_service_orders";
const SERVICE_ORDER_NOTIFICATION_SEEN_KEY = "capsfarma_service_order_notification_seen";
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
      showToast("Tabela de ordem de servico ainda nao aplicada no banco. O modulo esta em modo local.", "warning");
      return;
    }
    if (!isServiceOrderSchemaCompatibilityError(error)) {
      throw error;
    }
  }
}

function isServiceOrderSchemaCompatibilityError(error) {
  return /relation .*service_orders.* does not exist|table .*service_orders.* not found|Could not find the table .*service_orders|service_orders.*does not exist/i.test(
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
  const customerSnapshot = getServiceOrderCustomerSnapshot(customerId);
  const responsibleUserId = form.elements.namedItem("responsible_user_id")?.value || "";
  const responsibleUser = getAssignableServiceOrderUsers().find((item) => item.value === responsibleUserId)?.raw;
  const assistantIds = Array.from(form.querySelectorAll("[data-service-order-assistant]:checked")).map((input) => input.value);
  const montagemUsers = getMontagemServiceOrderUsers();
  const filteredAssistantIds = assistantIds.filter((id) => montagemUsers.some((user) => user.value === id));
  const assistantNames = montagemUsers
    .filter((user) => filteredAssistantIds.includes(user.value))
    .map((user) => user.raw.full_name || user.label);

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
  };
}

function resolveLinkedProductionNumber(productionId) {
  const production = (state.moduleData.production || []).find((item) => item.id === productionId);
  return production?.order_number || "";
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

async function handleServiceOrderSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  syncServiceOrderDraftFromForm(form);

  const draft = normalizeServiceOrderRecord({
    ...state.serviceOrderDraft,
    created_by_user_id: state.serviceOrderDraft.created_by_user_id || state.currentUser?.user_id || "",
    created_by_name: state.serviceOrderDraft.created_by_name || getLoggedUserName(""),
  });
  const previousOrder = draft.edit_id ? (state.moduleData.serviceOrders || []).find((item) => item.id === draft.edit_id) : null;

  if (!draft.title.trim()) {
    showToast("Informe o titulo da ordem de servico.", "warning");
    return;
  }
  if (!draft.customer_id) {
    showToast("Selecione um cliente vinculado.", "warning");
    return;
  }
  if (!draft.responsible_user_id) {
    showToast("Selecione um responsavel principal.", "warning");
    return;
  }

  const notifications = [...(previousOrder?.notifications || []), ...detectServiceOrderNotifications(previousOrder, draft)];
  const payload = {
    ...draft,
    history_entries: buildServiceOrderHistory(previousOrder, draft),
    notifications,
    updated_at: new Date().toISOString(),
  };

  try {
    const savedOrder = await persistServiceOrder(payload, draft.edit_id);
    await syncServiceOrderInventory(savedOrder, previousOrder);
    await loadServiceOrdersTable();
    state.openAccordionKey = null;
    state.serviceOrderDraft = createEmptyServiceOrderDraft();
    state.serviceOrderSelectedId = savedOrder.id;
    renderActiveModule();
    if (typeof queueSystemLog === "function") {
      void queueSystemLog({
        moduleKey: "service_orders",
        action: draft.edit_id ? "edicao" : "criacao",
        level: "Informativo",
        itemAffected: savedOrder.order_number,
        description: `Ordem de servico ${draft.edit_id ? "atualizada" : "criada"} para ${savedOrder.customer_name}.`,
        entityType: "service_order",
        entityId: savedOrder.id,
        payload: {
          status: savedOrder.status,
          linked_production_number: savedOrder.linked_production_number,
          customer_id: savedOrder.customer_id,
        },
      });
    }
    showToast(draft.edit_id ? "Ordem de servico atualizada com sucesso." : "Ordem de servico criada com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function persistServiceOrder(payload, editId) {
  const normalized = normalizeServiceOrderRecord(payload);
  if (state.supabase) {
    try {
      const query = editId
        ? state.supabase.from("service_orders").update(normalized).eq("id", editId).select().single()
        : state.supabase.from("service_orders").insert(normalized).select().single();
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

async function syncServiceOrderInventory(savedOrder, previousOrder) {
  if (!state.supabase) return;

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
    await persistServiceOrder({
      ...savedOrder,
      materials: nextMaterials,
      history_entries: [
        createServiceOrderHistoryEntry("Baixa de estoque confirmada para materiais da OS.", "updated"),
        ...(savedOrder.history_entries || []),
      ],
    }, savedOrder.id);
    await Promise.all([loadProductsTable(), loadInventoryMovementsTable()]);
  }
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
    await loadServiceOrdersTable();
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
        description: "Ordem de servico removida/cancelada.",
        entityType: "service_order",
        entityId: orderId,
      });
    }
    showToast("Ordem de servico removida.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleServiceOrderQuickConclude(orderId) {
  const order = (state.moduleData.serviceOrders || []).find((item) => item.id === orderId);
  if (!order) return;
  const resultSummary = window.prompt(`Resultado final da OS ${order.order_number}:`, order.result_summary || "Servico concluido com sucesso.");
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
    await persistServiceOrder(nextOrder, order.id);
    await loadServiceOrdersTable();
    state.serviceOrderSelectedId = order.id;
    renderActiveModule();
    if (typeof queueSystemLog === "function") {
      void queueSystemLog({
        moduleKey: "service_orders",
        action: "mudanca_status",
        level: "Atencao",
        itemAffected: nextOrder.order_number,
        description: "Ordem de servico concluida.",
        entityType: "service_order",
        entityId: order.id,
        payload: { status: "completed", result_summary: resultSummary },
      });
    }
    showToast("Ordem de servico concluida.", "success");
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
    await persistServiceOrder({
      ...order,
      progress_entries: [createServiceOrderProgressEntry(note), ...(order.progress_entries || [])],
      history_entries: [createServiceOrderHistoryEntry("Novo andamento registrado.", "updated"), ...(order.history_entries || [])],
      updated_at: new Date().toISOString(),
    }, order.id);
    await loadServiceOrdersTable();
    renderActiveModule();
    if (typeof queueSystemLog === "function") {
      void queueSystemLog({
        moduleKey: "service_orders",
        action: "edicao",
        level: "Informativo",
        itemAffected: order.order_number,
        description: "Novo andamento registrado na ordem de servico.",
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
  state.openAccordionKey = null;
  renderActiveModule();
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
        <select data-service-order-material-field="product_id" data-service-order-material-index="${index}">
          <option value="">Selecione um item</option>
          ${renderOptions((state.moduleData.products || []).map((product) => ({ value: product.id, label: `${product.name} · ${product.code || "sem codigo"}` })), item.product_id)}
        </select>
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

function renderServiceOrderForm(canEdit) {
  if (!canEdit || state.openAccordionKey !== "service-order-form") return "";
  const draft = state.serviceOrderDraft;
  const customerOptions = (state.moduleData.customers || []).map((customer) => ({ value: customer.id, label: customer.name }));
  const userOptions = getAssignableServiceOrderUsers();
  const montagemOptions = getMontagemServiceOrderUsers();
  const productionOptions = (state.moduleData.production || []).map((item) => ({ value: item.id, label: `${item.order_number} · ${item.product_name}` }));

  return `
    <section class="service-order-form-shell">
      <div class="service-order-form-card">
        <div class="module-head service-order-form-head">
          <div>
            <p class="eyebrow muted">OS</p>
            <h3>${draft.edit_id ? "Editar Ordem de Servico" : "Nova Ordem de Servico"}</h3>
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
              <label>Cliente vinculado *<select name="customer_id" required><option value="">Selecione um cliente</option>${renderOptions(customerOptions, draft.customer_id)}</select></label>
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
            <label>Observacoes internas<textarea name="internal_notes">${escapeHtml(draft.internal_notes)}</textarea></label>
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
              <label>Observacoes financeiras<textarea name="financial_notes">${escapeHtml(draft.financial_notes)}</textarea></label>
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
                  `).join("") || `<div class="empty-state compact-empty">Nenhum funcionario do departamento de Montagem disponivel.</div>`}
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
            <label>Observacoes para producao<textarea name="production_demand_notes">${escapeHtml(draft.production_demand_notes)}</textarea></label>
          </section>

          <section class="service-order-form-section">
            <h4>Finalizacao</h4>
            <label>Resultado final<textarea name="result_summary">${escapeHtml(draft.result_summary)}</textarea></label>
            <label>Observacao final<textarea name="final_notes">${escapeHtml(draft.final_notes)}</textarea></label>
          </section>

          <div class="service-order-form-actions">
            <button class="primary-button" type="submit">${draft.edit_id ? "Salvar alteracoes" : "Salvar OS"}</button>
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
          <p><strong>Observacoes internas:</strong> ${escapeHtml(order.internal_notes || "-")}</p>
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
            <textarea name="progress_note" placeholder="Ex.: servico iniciado, aguardando material, cliente informado"></textarea>
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
              : `<div class="empty-state compact-empty">Nenhum historico disponivel.</div>`
            }
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderServiceOrdersModule() {
  if (!hasPermission("service_orders", "view")) {
    return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de ordem de servico.");
  }

  const canEdit = hasPermission("service_orders", "edit");
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
          <h3>Ordem de Servico</h3>
          <p class="muted">Controle de ordens internas e externas com historico, responsaveis, estoque e producao.</p>
        </div>
        <div class="module-head-actions">
          ${canEdit ? `<button class="primary-button" type="button" data-service-order-create>Nova Ordem de Servico</button>` : ""}
        </div>
      </div>

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
              ${filteredOrders.length ? filteredOrders.map((order) => renderServiceOrderRow(order, canEdit)).join("") : `<tr><td colspan="11"><div class="empty-state compact-empty">Nenhuma ordem de servico encontrada.</div></td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      ${renderServiceOrderDetails(selectedOrder)}
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
  document.querySelector("[data-service-order-create]")?.addEventListener("click", () => {
    state.serviceOrderDraft = createEmptyServiceOrderDraft();
    state.openAccordionKey = "service-order-form";
    renderActiveModule();
    document.querySelector("#service-order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelector("[data-service-order-cancel-form]")?.addEventListener("click", resetServiceOrderForm);

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
}

function buildServiceOrderPrintHtml(order) {
  const production = (state.moduleData.production || []).find((item) => item.id === order.linked_production_id);
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
        <div>
          <strong>Ordem de Servico</strong>
          <p>${escapeHtml(order.order_number)}</p>
          <p>${formatDate(order.opened_at)}</p>
        </div>
        <div>
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
        <p><strong>Observacoes internas:</strong> ${escapeHtml(order.internal_notes || "-")}</p>
        <p><strong>Observacoes finais:</strong> ${escapeHtml(order.final_notes || "-")}</p>
        <p><strong>Resultado:</strong> ${escapeHtml(order.result_summary || "-")}</p>
      </section>
    </article>
  `;
}

function openServiceOrderPrint(orderId) {
  const order = (state.moduleData.serviceOrders || []).find((item) => item.id === orderId);
  if (!order) return;
  openPrintWindowForHtml(buildServiceOrderPrintHtml(order), `OS ${order.order_number}`);
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

  const shouldGenerate = window.confirm(`A producao ${order.order_number} foi concluida. Deseja gerar uma Ordem de Servico para esse produto final?`);
  if (!shouldGenerate) return;

  const customers = (state.moduleData.customers || []);
  if (!customers.length) {
    showToast("Cadastre ao menos um cliente antes de gerar a Ordem de Servico.", "warning");
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
    showToast("Cliente nao encontrado para gerar a Ordem de Servico.", "warning");
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
    reported_problem: "Produto final concluido em producao aguardando analise administrativa para liberacao de servico.",
    planned_solution: "Analisar e liberar a execucao da Ordem de Servico vinculada ao produto final.",
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
