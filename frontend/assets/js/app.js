const DEFAULT_SUPABASE_CONFIG = {
  url: `${window.location.origin || "http://127.0.0.1"}/supabase`,
  anonKey: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
};
const SUPABASE_CONFIG = {
  ...DEFAULT_SUPABASE_CONFIG,
  ...(window.CAPSFARMA_SUPABASE_CONFIG || {}),
};
const MACHINING_STORAGE_KEY = "capsfarma_machining_data";
const SALES_DOCUMENT_SETTINGS_STORAGE_KEY = "capsfarma_sales_document_settings";
const SALES_TEMPLATE_PDF_MAX_SIZE = 2 * 1024 * 1024;
const PRODUCT_PHOTO_MAX_SOURCE_SIZE = 8 * 1024 * 1024;
const PRODUCT_PHOTO_MAX_STORED_SIZE = 700 * 1024;
const PRODUCT_PHOTO_MAX_DIMENSION = 720;
const PRODUCT_SALE_OPTION_SEPARATOR = ";";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "capsfarma_sidebar_collapsed";
const CLIENT_IP_STORAGE_KEY = "capsfarma_client_ip";
const SESSION_STORAGE_KEY = "capsfarma_session";
const PRODUCTION_OPERATION_CONFIG_STORAGE_KEY = "capsfarma_production_operation_steps";
const LOGIN_MAX_ATTEMPTS = 5;
const SIDEBAR_MOBILE_BREAKPOINT = 1180;
const PRODUCTION_ORDER_NUMBER_RETRY_LIMIT = 5;
const DEFAULT_PRODUCTION_OPERATION_STEPS = [
  { name: "Projeto técnico", estimated_minutes: 240 },
  { name: "Corte / Usinagem", estimated_minutes: 480 },
  { name: "Solda", estimated_minutes: 360 },
  { name: "Montagem estrutural", estimated_minutes: 420 },
  { name: "Elétrica / Painel", estimated_minutes: 360 },
  { name: "Testes", estimated_minutes: 240 },
  { name: "Acabamento", estimated_minutes: 180 },
  { name: "Embalagem", estimated_minutes: 120 },
  { name: "Expedição", estimated_minutes: 90 },
];
const DEFAULT_BRAND_LOGO_PATH = "./assets/branding/logo-empresa.png";
const AUTH_SESSION_INVALID_MESSAGE = "Sua sessão expirou ou não é mais válida. Faça login novamente.";
const NOTIFICATION_SOUND_PATHS = {
  created: "./assets/sounds/notification-created.wav",
  approved: "./assets/sounds/notification-approved.wav",
  purchase_completed: "./assets/sounds/notification-purchase-completed.wav",
  completed: "./assets/sounds/notification-completed.wav",
  notified: "./assets/sounds/notification-notified.wav",
  warning: "./assets/sounds/notification-warning.wav",
  danger: "./assets/sounds/notification-danger.wav",
};
const notificationAudio = {
  context: null,
  enabled: false,
  filePlayers: {},
  unlockBound: false,
};
let productionOrderNumberCounter = 0;
const MODULES = [
  { key: "dashboard", label: "Dashboard", tooltip: "Dashboard", icon: "◫" },
  { key: "products", label: "Produtos", tooltip: "Produtos", icon: "◪" },
  { key: "bom", label: "Estrutura (BOM)", tooltip: "BOM", icon: "⊞" },
  { key: "inventory", label: "Estoque", tooltip: "Estoque", icon: "◬" },
  { key: "production", label: "Produção", tooltip: "Produção", icon: "◭" },
  { key: "service_orders", label: "Ordem de Serviço", tooltip: "Ordem de Serviço", icon: "▣" },
  { key: "machining", label: "Usinagem", tooltip: "Usinagem", icon: "◈" },
  { key: "customers", label: "Clientes", tooltip: "Clientes", icon: "◎" },
  { key: "sales", label: "Vendas", tooltip: "Vendas", icon: "◨" },
  { key: "purchases", label: "Compras", tooltip: "Compras", icon: "◧" },
  { key: "payables", label: "Contas a Pagar", tooltip: "Contas a Pagar", icon: "◫" },
  { key: "reports", label: "Relatórios", tooltip: "Relatórios", icon: "◲" },
  { key: "permissions", label: "Permissões", tooltip: "Permissões", icon: "◩" },
  { key: "vps", label: "Controle da VPS", tooltip: "Controle VPS", icon: "▤" },
  { key: "audit", label: "Auditoria", tooltip: "Central de Logs", icon: "◰" },
];
const MODULE_IMPORT_PATHS = {
  dashboard: "../../modules/dashboard/index.js",
  products: "../../modules/produtos/index.js?v=20260430-one-click-picker",
  bom: "../../modules/bom/index.js?v=20260430-final-product-picker",
  inventory: "../../modules/estoque/index.js?v=20260505-inventory-product-picker",
  production: "../../modules/producao/index.js?v=20260429-3",
  service_orders: "../../modules/ordem-servico/index.js",
  machining: "../../modules/usinagem/index.js?v=20260505-machining-machines",
  customers: "../../modules/clientes/index.js?v=20260424-2",
  sales: "../../modules/vendas/index.js?v=20260430-one-click-picker",
  purchases: "../../modules/compras/index.js?v=20260504-purchase-stock-entry",
  payables: "../../modules/contas-pagar/index.js",
  reports: "../../modules/relatorios/index.js",
  permissions: "../../modules/permissoes/index.js",
  vps: "../../modules/controle-vps/index.js",
  audit: "../../modules/auditoria/index.js",
};
const STAFF_TYPES = ["TI", "ADMINISTRADOR", "USINAGEM", "MONTAGEM", "FABRICACAO", "VENDEDOR", "COMPRAS", "FINANCEIRO"];

const state = {
  supabase: null,
  currentUser: null,
  accessToken: "",
  permissions: [],
  permissionRoles: [],
  permissionRoleDraft: createEmptyPermissionRoleDraft(),
  employeeDraft: createEmptyEmployeeDraft(),
  employeeModalOpen: false,
  employeeFormMode: "create",
  employeeEditId: "",
  moduleData: {
    products: [],
    bomMaterials: [],
    bomStructures: [],
    inventory: [],
    production: [],
    serviceOrders: [],
    serviceOrderChecklists: [],
    machiningPieces: [],
    customers: [],
    sales: [],
    purchases: [],
    payables: [],
    users: [],
    auditLogs: [],
  },
  activeModule: "dashboard",
  bomTab: "materials",
  bomMaterialSearch: "",
  bomStructureSearch: "",
  bomMaterialFormVisible: false,
  bomStructureFormVisible: false,
  bomStructureDraft: createEmptyBomStructureDraft(),
  bomDraftItems: [createEmptyBomDraftItem()],
  bomAttachmentDrafts: [],
  productSearch: "",
  productCategoryFilter: "all",
  productFormVisible: false,
  productFormMode: "create",
  productMovementId: null,
  productionSearch: "",
  productionStatusFilter: "all",
  productionSelectedOrderId: "",
  productionDashboardTab: "operations",
  productionFocusOrderId: "",
  productionOperationConfigDraft: createProductionOperationConfigDraft(),
  machiningSearch: "",
  machiningStatusFilter: "all",
  machiningTab: "production",
  openAccordionKey: null,
  productionDraft: createEmptyProductionDraft(),
  serviceOrdersTab: "orders",
  serviceOrderDraft: createEmptyServiceOrderDraft(),
  serviceOrderFormTab: "details",
  serviceOrderFilters: createEmptyServiceOrderFilters(),
  serviceOrderSelectedId: "",
  serviceOrderChecklistDraft: createEmptyServiceOrderChecklistDraft(),
  serviceOrderChecklistFilters: createEmptyServiceOrderChecklistFilters(),
  serviceOrderChecklistSelectedId: "",
  machiningDraft: createEmptyMachiningDraft(),
  machiningStartDraft: createEmptyMachiningStartDraft(),
  customerSearch: "",
  customerDraft: createEmptyCustomerDraft(),
  salesSearch: "",
  salesStatusFilter: "all",
  salesDraft: createEmptySalesDraft(),
  salesContractDraft: createEmptySalesContractDraft(),
  salesConfigModalOpen: false,
  salesConfigTab: "quote",
  salesDocumentSettings: createDefaultSalesDocumentSettings(),
  salesDocumentPreview: createEmptySalesDocumentPreview(),
  purchaseSearch: "",
  purchaseStatusFilter: "all",
  purchaseDraft: createEmptyPurchaseDraft(),
  purchaseConclusionDraft: createEmptyPurchaseConclusionDraft(),
  payablesFilters: createEmptyPayablesFilters(),
  payablesDraft: createEmptyPayableDraft(),
  payablesPaymentDraft: createEmptyPayablePaymentDraft(),
  payablesAlertState: createEmptyPayablesAlertState(),
  payablesSelectedId: "",
  payablesExpandedGroups: {},
  notifications: [],
  auditFilters: createEmptyAuditFilters(),
  auditSelectedLogId: "",
  reportsFilters: createEmptyReportsFilters(),
  inventoryFormVisible: false,
  inventoryMovementProductId: "",
  inventoryMovementSaleOptionId: "",
  lastPurchaseNotificationId: null,
  purchaseChannel: null,
  productionChannel: null,
  payableChannel: null,
  serviceOrderChannel: null,
  vpsControl: createEmptyVpsControlState(),
  dashboardRange: "30d",
  dashboardCustomRange: {
    from: "",
    to: "",
  },
  dashboardLastUpdatedAt: "",
  dashboardAutoRefreshTimer: null,
  dashboardRefreshInFlight: false,
  sidebarCollapsed: readSidebarCollapsedPreference(),
  sidebarOpen: false,
  clientIp: readCachedClientIp(),
  lastAuditedModule: "",
  authBootstrapPending: true,
  authRedirectInFlight: false,
};

const elements = {
  body: document.body,
  pageShell: document.querySelector(".page-shell"),
  authBootstrapOverlay: document.querySelector("#auth-bootstrap-overlay"),
  authBootstrapMessage: document.querySelector("#auth-bootstrap-message"),
  authScreen: document.querySelector("#auth-screen"),
  appScreen: document.querySelector("#app-screen"),
  loginForm: document.querySelector("#login-form"),
  registerForm: document.querySelector("#register-form"),
  forgotPasswordButton: document.querySelector("#forgot-password-button"),
  sidebar: document.querySelector("#app-sidebar"),
  sidebarBackdrop: document.querySelector("#sidebar-backdrop"),
  sidebarCollapseButton: document.querySelector("#sidebar-collapse-button"),
  sidebarCollapseIcon: document.querySelector("#sidebar-collapse-icon"),
  sidebarMobileToggle: document.querySelector("#sidebar-mobile-toggle"),
  sidebarLogoutButton: document.querySelector("#sidebar-logout-button"),
  moduleNav: document.querySelector("#module-nav"),
  moduleContainer: document.querySelector("#module-container"),
  pageTitle: document.querySelector("#page-title"),
  topbarSubtitle: document.querySelector("#topbar-subtitle"),
  userNameLabel: document.querySelector("#user-name-label"),
  userRoleLabel: document.querySelector("#user-role-label"),
  userAvatarLabel: document.querySelector("#user-avatar-label"),
  notificationBanner: document.querySelector("#notification-banner"),
  authConnectionStatus: document.querySelector("#auth-connection-status"),
  authStatusDot: document.querySelector(".auth-status-dot"),
  authBrandLogo: document.querySelector("#auth-brand-logo"),
  authBrandMonogram: document.querySelector("#auth-brand-monogram"),
  authBrandTitle: document.querySelector("#auth-brand-title"),
  authBrandSubtitle: document.querySelector("#auth-brand-subtitle"),
  authFormEyebrow: document.querySelector("#auth-form-eyebrow"),
  authCopyright: document.querySelector("#auth-copyright"),
  authFeedbackModal: document.querySelector("#auth-feedback-modal"),
  authFeedbackIcon: document.querySelector("#auth-feedback-icon"),
  authFeedbackTitle: document.querySelector("#auth-feedback-title"),
  authFeedbackMessage: document.querySelector("#auth-feedback-message"),
  authFeedbackClose: document.querySelector("#auth-feedback-close"),
  appFeedbackModal: document.querySelector("#app-feedback-modal"),
  appFeedbackIcon: document.querySelector("#app-feedback-icon"),
  appFeedbackTitle: document.querySelector("#app-feedback-title"),
  appFeedbackMessage: document.querySelector("#app-feedback-message"),
  appFeedbackClose: document.querySelector("#app-feedback-close"),
};

let activeModuleRenderFrame = 0;
let activeModuleRenderRequestId = 0;
const lazyModuleRegistry = new Map();
let lastActiveModuleRenderPromise = Promise.resolve();
const PERF_LOG_MIN_MS = 120;

function startPerfMeasure(label) {
  return {
    label,
    startedAt: performance.now(),
  };
}

function endPerfMeasure(measure, details = "") {
  if (!measure) return 0;
  const duration = performance.now() - measure.startedAt;
  if (duration >= PERF_LOG_MIN_MS) {
    console.info(`[perf] ${measure.label}: ${duration.toFixed(1)}ms${details ? ` | ${details}` : ""}`);
  }
  return duration;
}

function debounce(fn, wait = 120) {
  let timerId = 0;
  return (...args) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => fn(...args), wait);
  };
}

function requestActiveModuleRender() {
  if (activeModuleRenderFrame) return;
  activeModuleRenderFrame = window.requestAnimationFrame(() => {
    activeModuleRenderFrame = 0;
    renderActiveModule();
  });
}

function bindDeferredTextFilter(selector, assignValue, wait = 120) {
  const input = document.querySelector(selector);
  if (!input) return;
  const handleInput = debounce((value) => {
    assignValue(value);
    requestActiveModuleRender();
  }, wait);
  input.addEventListener("input", (event) => {
    handleInput(event.currentTarget.value);
  });
}

function bindDeferredSelectFilter(selector, assignValue) {
  const input = document.querySelector(selector);
  if (!input) return;
  input.addEventListener("change", (event) => {
    assignValue(event.currentTarget.value);
    requestActiveModuleRender();
  });
}

function getModuleFocusSnapshot() {
  const activeElement = document.activeElement;
  if (!activeElement || !elements.moduleContainer?.contains(activeElement)) {
    return null;
  }

  const selector = activeElement.id ? `#${CSS.escape(activeElement.id)}` : "";
  if (!selector || !/^(INPUT|TEXTAREA|SELECT)$/.test(activeElement.tagName)) {
    return null;
  }

  return {
    selector,
    selectionStart: typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null,
    selectionEnd: typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null,
  };
}

function restoreModuleFocusSnapshot(snapshot) {
  if (!snapshot?.selector) return;

  const nextElement = elements.moduleContainer.querySelector(snapshot.selector);
  if (!nextElement) return;

  nextElement.focus({ preventScroll: true });
  if (
    typeof nextElement.setSelectionRange === "function"
    && typeof snapshot.selectionStart === "number"
    && typeof snapshot.selectionEnd === "number"
  ) {
    nextElement.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
  }
}

function init() {
  loadSalesDocumentSettings();
  renderAuthBranding();
  attachEvents();
  attachGlobalErrorHandlers();
  primeNotificationAudio();
  syncSidebarState();
  syncAppMode();
  void bootstrapApplication();
}

function attachEvents() {
  elements.loginForm?.addEventListener("submit", handleLogin);
  elements.registerForm?.addEventListener("submit", handleRegister);
  elements.sidebarLogoutButton?.addEventListener("click", () => logout());
  elements.sidebarCollapseButton?.addEventListener("click", toggleSidebarCollapse);
  elements.sidebarMobileToggle?.addEventListener("click", toggleSidebarOpen);
  elements.sidebarBackdrop?.addEventListener("click", () => {
    setSidebarOpen(false);
  });
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("popstate", handleHashChange);
  window.addEventListener("resize", handleViewportResize);
  elements.forgotPasswordButton?.addEventListener("click", handleForgotPassword);
  elements.authFeedbackClose?.addEventListener("click", closeAuthFeedbackModal);
  elements.authFeedbackModal?.addEventListener("click", (event) => {
    if (event.target === elements.authFeedbackModal) {
      closeAuthFeedbackModal();
    }
  });
  elements.appFeedbackClose?.addEventListener("click", closeAppFeedbackModal);
  elements.appFeedbackModal?.addEventListener("click", (event) => {
    if (event.target === elements.appFeedbackModal) {
      closeAppFeedbackModal();
    }
  });
  document.addEventListener("invalid", handleInvalidFormField, true);
}

function attachGlobalErrorHandlers() {
  window.addEventListener("unhandledrejection", (event) => {
    if (handleAuthenticationFailure(event.reason, { showMessage: true })) {
      event.preventDefault();
    }
  });

  window.addEventListener("error", (event) => {
    handleAuthenticationFailure(event.error || event.message, { showMessage: true });
  });
}

function renderLandingConnectionState(isConnected) {
  elements.authConnectionStatus.textContent = isConnected ? "Ambiente conectado" : "Ambiente aguardando configuração";
  elements.authStatusDot.classList.toggle("online", isConnected);
}

function syncAppMode() {
  const isAuthActive = elements.authScreen.classList.contains("active");
  elements.body.classList.toggle("auth-mode", isAuthActive);
  elements.body.classList.toggle("app-mode", elements.appScreen.classList.contains("active"));
  if (isAuthActive) {
    setSidebarOpen(false);
  }
}

function readSidebarCollapsedPreference() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
}

function readCachedClientIp() {
  return localStorage.getItem(CLIENT_IP_STORAGE_KEY) || "";
}

function isMobileSidebarViewport() {
  return window.innerWidth <= SIDEBAR_MOBILE_BREAKPOINT;
}

function handleViewportResize() {
  if (!isMobileSidebarViewport()) {
    state.sidebarOpen = false;
  }
  syncSidebarState();
}

function setSidebarCollapsed(nextValue) {
  state.sidebarCollapsed = Boolean(nextValue);
  localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(state.sidebarCollapsed));
  syncSidebarState();
}

function setSidebarOpen(nextValue) {
  state.sidebarOpen = Boolean(nextValue);
  syncSidebarState();
}

function toggleSidebarCollapse() {
  if (isMobileSidebarViewport()) {
    setSidebarOpen(!state.sidebarOpen);
    return;
  }

  setSidebarCollapsed(!state.sidebarCollapsed);
}

function toggleSidebarOpen() {
  setSidebarOpen(!state.sidebarOpen);
}

function syncSidebarState() {
  const isMobile = isMobileSidebarViewport();
  const isCollapsed = state.sidebarCollapsed && !isMobile;
  const isOpen = state.sidebarOpen && isMobile;

  elements.body.classList.toggle("sidebar-compact", isMobile);
  elements.body.classList.toggle("sidebar-collapsed", isCollapsed);
  elements.body.classList.toggle("sidebar-open", isOpen);
  elements.sidebarBackdrop?.classList.toggle("hidden", !isOpen);

  if (elements.sidebarCollapseButton) {
    const label = isMobile
      ? isOpen
        ? "Fechar menu lateral"
        : "Abrir menu lateral"
      : isCollapsed
        ? "Expandir menu lateral"
        : "Recolher menu lateral";
    elements.sidebarCollapseButton.setAttribute("aria-label", label);
    elements.sidebarCollapseButton.setAttribute("title", label);
  }

  if (elements.sidebarMobileToggle) {
    const mobileLabel = isOpen ? "Fechar menu lateral" : "Abrir menu lateral";
    elements.sidebarMobileToggle.setAttribute("aria-label", mobileLabel);
    elements.sidebarMobileToggle.setAttribute("title", mobileLabel);
  }

  if (elements.sidebarLogoutButton) {
    elements.sidebarLogoutButton.setAttribute("title", "Sair");
    elements.sidebarLogoutButton.setAttribute("aria-label", "Sair");
  }

  if (elements.sidebarCollapseIcon) {
    elements.sidebarCollapseIcon.textContent = isMobile ? (isOpen ? "✕" : "☰") : isCollapsed ? "▶" : "◀";
  }
}

function renderAuthBranding() {
  const company = state.salesDocumentSettings?.company || {};
  const companyName = String(company.company_name || "CAPSFARMA").trim() || "CAPSFARMA";
  const monogram = getCompanyMonogram(companyName);
  const loginReadyMessage = `Gerencie a operação da ${companyName} com segurança, agilidade e controle em tempo real.`;
  const resolvedLogo = String(company.logo || "").trim() || DEFAULT_BRAND_LOGO_PATH;

  elements.authBrandTitle.textContent = `Bem-vindo ao ERP ${companyName}`;
  elements.authBrandSubtitle.textContent = loginReadyMessage;
  elements.authFormEyebrow.textContent = `ERP ${companyName}`;
  elements.authCopyright.textContent = `© ${new Date().getFullYear()} ${companyName}. Todos os direitos reservados.`;
  elements.authBrandMonogram.textContent = monogram;
  elements.authBrandLogo.onerror = () => {
    elements.authBrandLogo.removeAttribute("src");
    elements.authBrandLogo.classList.add("hidden");
    elements.authBrandMonogram.classList.remove("hidden");
  };
  elements.authBrandLogo.onload = () => {
    elements.authBrandLogo.classList.remove("hidden");
    elements.authBrandMonogram.classList.add("hidden");
  };
  elements.authBrandLogo.src = resolvedLogo;
}

function getCompanyMonogram(companyName) {
  const parts = String(companyName || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "CA";
  return parts.map((part) => part[0]).join("").toUpperCase();
}

function handleForgotPassword() {
  showToast(
    "Para redefinir sua senha, solicite a alteração ao ADMINISTRADOR ou ao time de TI no cadastro de funcionários.",
    "warning"
  );
}

function hasSupabaseConfig() {
  return Boolean(
    SUPABASE_CONFIG.url
    && SUPABASE_CONFIG.anonKey
    && !String(SUPABASE_CONFIG.url).includes("SEU-PROJETO")
  );
}

function getRequestedModuleFromLocation() {
  const pathname = String(window.location.pathname || "/")
    .replace(/^\/+|\/+$/g, "")
    .trim();
  if (pathname && MODULES.some((module) => module.key === pathname)) {
    return pathname;
  }

  const hash = String(window.location.hash || "").replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return params.get("module");
}

function syncModuleLocation() {
  if (!state.currentUser) return;
  const nextPath = state.activeModule === "dashboard" ? "/" : `/${state.activeModule}`;
  const currentPath = String(window.location.pathname || "/");
  const currentHash = String(window.location.hash || "");
  if (currentPath !== nextPath || currentHash) {
    window.history.replaceState({}, "", nextPath);
  }
}

function applyRequestedModuleFromHash() {
  const requested = getRequestedModuleFromLocation();
  if (!requested) return;
  if (!MODULES.some((module) => module.key === requested)) return;
  if (requested === "vps" && !isTiUser()) {
    state.activeModule = "dashboard";
    showToast("Acesso não autorizado", "danger");
    return;
  }
  state.activeModule = requested;
}

async function handleHashChange() {
  if (!state.currentUser) return;
  applyRequestedModuleFromHash();
  renderModuleNav();
  try {
    await loadDataForModule(state.activeModule);
    renderActiveModule();
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function formatShortId(value) {
  const raw = String(value || "");
  if (!raw) return "00000";

  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 5) {
    return digits.slice(-5).padStart(5, "0");
  }

  let hash = 0;
  for (const char of raw) {
    hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  }

  return String(hash).padStart(5, "0");
}

function setAuthBootstrapLoading(isLoading, message = "Validando sessão...") {
  state.authBootstrapPending = Boolean(isLoading);
  elements.body.classList.toggle("bootstrap-loading", state.authBootstrapPending);
  elements.authBootstrapOverlay?.classList.toggle("hidden", !state.authBootstrapPending);
  if (elements.authBootstrapMessage) {
    elements.authBootstrapMessage.textContent = message;
  }
}

function readPersistedSession() {
  try {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) return null;

    const session = JSON.parse(rawSession);
    return session && typeof session === "object" ? session : null;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function decodeJwtPayloadSegment(segment) {
  const normalized = String(segment || "").replace(/-/g, "+").replace(/_/g, "/");
  if (!normalized) return null;

  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function hasUsableAccessToken(token) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return false;

  const parts = normalizedToken.split(".");
  if (parts.length !== 3) return false;

  const payload = decodeJwtPayloadSegment(parts[1]);
  if (!payload || typeof payload !== "object") return false;

  const expiresAt = Number(payload.exp || 0);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return false;

  return expiresAt > Math.floor(Date.now() / 1000);
}

function isAuthenticationError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return [
    "token jwt ausente",
    "token jwt invalido",
    "token jwt expirado",
    "sessão inválida",
    "sessão expirada",
    "usuário inativo",
    "não autenticado",
    "unauthorized",
    "401",
  ].some((fragment) => message.includes(fragment));
}

function handleAuthenticationFailure(error, { showMessage = false } = {}) {
  if (!isAuthenticationError(error) || state.authRedirectInFlight) {
    return false;
  }

  state.authRedirectInFlight = true;
  setAuthBootstrapLoading(false);
  logout({ resetRoute: true });
  if (showMessage) {
    showToast(AUTH_SESSION_INVALID_MESSAGE, "warning");
  }
  state.authRedirectInFlight = false;
  return true;
}

async function bootstrapApplication() {
  const perf = startPerfMeasure("bootstrapApplication");
  setAuthBootstrapLoading(true, "Validando sessão...");

  if (!hasSupabaseConfig()) {
    renderLandingConnectionState(false);
    logout({ resetRoute: true });
    setAuthBootstrapLoading(false);
    showToast("Configure o arquivo supabase/config.js para conectar o sistema.", "warning");
    return;
  }

  try {
    state.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    renderLandingConnectionState(true);
  } catch (error) {
    renderLandingConnectionState(false);
    logout({ resetRoute: true });
    setAuthBootstrapLoading(false);
    showToast(formatError(error), "danger");
    return;
  }

  const session = readPersistedSession();
  if (!session?.accessToken || !session?.user) {
    logout({ resetRoute: true });
    setAuthBootstrapLoading(false);
    return;
  }

  if (!hasUsableAccessToken(session.accessToken)) {
    handleAuthenticationFailure(new Error("Sessão inválida ou expirada"), { showMessage: false });
    setAuthBootstrapLoading(false);
    return;
  }

  try {
    state.currentUser = session.user;
    state.accessToken = session.accessToken || "";
    state.permissions = session.permissions || [];
    await loadPermissions();
    persistSession();
    setAuthBootstrapLoading(true, "Carregando sistema...");
    showApp();
    await renderApp();
    void loadRuntimeSettingsFromServer()
      .then(() => {
        persistSession();
        if (["sales", "production"].includes(state.activeModule)) {
          requestActiveModuleRender();
        }
      })
      .catch((error) => {
        if (!handleAuthenticationFailure(error, { showMessage: true })) {
          console.error("runtime settings bootstrap", error);
        }
      });
  } catch (error) {
    if (!handleAuthenticationFailure(error, { showMessage: true })) {
      logout({ resetRoute: true });
      showToast(formatError(error), "danger");
    }
  } finally {
    endPerfMeasure(perf, `module=${state.activeModule}`);
    setAuthBootstrapLoading(false);
  }
}

async function handleRegister(event) {
  event.preventDefault();

  if (!state.supabase) {
    showToast("Supabase ainda não foi configurado.", "danger");
    return;
  }

  const formData = new FormData(event.currentTarget);
  const payload = {
    p_full_name: formData.get("full_name")?.toString().trim(),
    p_phone: formData.get("phone")?.toString().trim(),
    p_login_code: sanitizeLoginCode(formData.get("login_code")),
    p_password: formData.get("password")?.toString(),
  };

  try {
    const { data, error } = await state.supabase.rpc("register_user", payload);
    if (error) throw error;

    const user = data?.[0];
    if (!user) throw new Error("Não foi possível concluir o cadastro.");

    showToast(
      isAdministratorRole(user.role)
        ? "Primeiro usuário criado como ADMINISTRADOR."
        : "Usuário cadastrado com sucesso.",
      "success"
    );
    event.currentTarget?.reset();
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleLogin(event) {
  const perf = startPerfMeasure("handleLogin");
  event.preventDefault();

  if (!state.supabase) {
    showToast("Supabase ainda não foi configurado.", "danger");
    return;
  }

  const formData = new FormData(event.currentTarget);
  const payload = {
    p_login_code: sanitizeLoginCode(formData.get("login_code")),
    p_password: formData.get("password")?.toString(),
  };

  try {
    const { data, error } = await state.supabase.rpc("login_user", payload);
    if (error) throw error;

    const user = data?.[0];
    if (!user) throw new Error("Credenciais inválidas.");

    state.currentUser = user;
    state.accessToken = user.access_token || "";
    await loadPermissions();
    persistSession();
    showApp();
    await renderApp();
    void loadRuntimeSettingsFromServer()
      .then(() => {
        persistSession();
        if (["sales", "production"].includes(state.activeModule)) {
          requestActiveModuleRender();
        }
      })
      .catch((error) => {
        if (!handleAuthenticationFailure(error, { showMessage: true })) {
          console.error("runtime settings login", error);
        }
      });
    showToast("Login realizado com sucesso.", "success");
    event.currentTarget?.reset();
  } catch (error) {
    showToast(formatError(error), "danger");
  } finally {
    endPerfMeasure(perf);
  }
}

async function loadPermissions() {
  const perf = startPerfMeasure("loadPermissions");
  if (!hasUsableAccessToken(state.accessToken)) {
    throw new Error("Sessão inválida ou expirada");
  }

  const { data, error } = await state.supabase.rpc("get_my_permissions", {
    p_access_token: state.accessToken,
  });

  if (error) throw error;
  state.permissions = data || [];
  endPerfMeasure(perf, `permissions=${state.permissions.length}`);
}

function persistSession() {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      user: state.currentUser,
      accessToken: state.accessToken,
      permissions: state.permissions,
    })
  );
}

function logout({ resetRoute = true } = {}) {
  stopDashboardAutoRefresh();
  if (state.purchaseChannel && state.supabase) {
    state.supabase.removeChannel(state.purchaseChannel);
    state.purchaseChannel = null;
  }
  if (state.payableChannel && state.supabase) {
    state.supabase.removeChannel(state.payableChannel);
    state.payableChannel = null;
  }
  if (state.serviceOrderChannel && state.supabase) {
    state.supabase.removeChannel(state.serviceOrderChannel);
    state.serviceOrderChannel = null;
  }
  state.currentUser = null;
  state.accessToken = "";
  state.permissions = [];
  state.permissionRoles = [];
  state.permissionRoleDraft = createEmptyPermissionRoleDraft();
  state.employeeDraft = createEmptyEmployeeDraft();
  state.employeeModalOpen = false;
  state.employeeFormMode = "create";
  state.employeeEditId = "";
  state.moduleData = {
    products: [],
    bomMaterials: [],
    bomStructures: [],
    inventory: [],
    production: [],
    serviceOrders: [],
    serviceOrderChecklists: [],
    machiningPieces: [],
    customers: [],
    sales: [],
    purchases: [],
    payables: [],
    users: [],
    auditLogs: [],
  };
  state.bomTab = "materials";
  state.bomMaterialSearch = "";
  state.bomStructureSearch = "";
  state.bomMaterialFormVisible = false;
  state.bomStructureFormVisible = false;
  state.bomStructureDraft = createEmptyBomStructureDraft();
  state.bomDraftItems = [createEmptyBomDraftItem()];
  state.bomAttachmentDrafts = [];
  state.productSearch = "";
  state.productCategoryFilter = "all";
  state.productFormVisible = false;
  state.productionSearch = "";
  state.productionStatusFilter = "all";
  state.productionSelectedOrderId = "";
  state.productionDashboardTab = "operations";
  state.productionFocusOrderId = "";
  state.productionOperationConfigDraft = createProductionOperationConfigDraft();
  state.serviceOrdersTab = "orders";
  state.serviceOrderDraft = createEmptyServiceOrderDraft();
  state.serviceOrderFormTab = "details";
  state.serviceOrderFilters = createEmptyServiceOrderFilters();
  state.serviceOrderSelectedId = "";
  state.serviceOrderChecklistDraft = createEmptyServiceOrderChecklistDraft();
  state.serviceOrderChecklistFilters = createEmptyServiceOrderChecklistFilters();
  state.serviceOrderChecklistSelectedId = "";
  state.machiningSearch = "";
  state.machiningStatusFilter = "all";
  state.machiningTab = "production";
  state.openAccordionKey = null;
  state.productionDraft = createEmptyProductionDraft();
  state.machiningDraft = createEmptyMachiningDraft();
  state.machiningStartDraft = createEmptyMachiningStartDraft();
  state.customerSearch = "";
  state.customerDraft = createEmptyCustomerDraft();
  state.salesSearch = "";
  state.salesStatusFilter = "all";
  state.salesDraft = createEmptySalesDraft();
  state.salesContractDraft = createEmptySalesContractDraft();
  state.purchaseSearch = "";
  state.purchaseStatusFilter = "all";
  state.purchaseDraft = createEmptyPurchaseDraft();
  state.purchaseConclusionDraft = createEmptyPurchaseConclusionDraft();
  state.payablesFilters = createEmptyPayablesFilters();
  state.payablesDraft = createEmptyPayableDraft();
  state.payablesPaymentDraft = createEmptyPayablePaymentDraft();
  state.payablesAlertState = createEmptyPayablesAlertState();
  state.payablesSelectedId = "";
  state.payablesExpandedGroups = {};
  state.notifications = [];
  state.auditFilters = createEmptyAuditFilters();
  state.auditSelectedLogId = "";
  state.reportsFilters = createEmptyReportsFilters();
  state.inventoryFormVisible = false;
  state.inventoryMovementProductId = "";
  state.inventoryMovementSaleOptionId = "";
  state.vpsControl = createEmptyVpsControlState();
  state.dashboardRange = "30d";
  state.dashboardCustomRange = {
    from: "",
    to: "",
  };
  state.dashboardLastUpdatedAt = "";
  state.dashboardRefreshInFlight = false;
  state.lastAuditedModule = "";
  elements.moduleNav.innerHTML = "";
  elements.moduleContainer.innerHTML = "";
  elements.notificationBanner.classList.add("hidden");
  elements.pageTitle.textContent = "Dashboard";
  elements.topbarSubtitle.textContent = "Painel operacional";
  elements.userNameLabel.textContent = "-";
  elements.userRoleLabel.textContent = "Usuário";
  elements.userAvatarLabel.textContent = "U";
  state.activeModule = "dashboard";
  localStorage.removeItem(SESSION_STORAGE_KEY);
  elements.appScreen.classList.remove("active");
  elements.authScreen.classList.add("active");
  if (resetRoute && (window.location.pathname !== "/" || window.location.hash)) {
    window.history.replaceState({}, "", "/");
  }
  syncAppMode();
  renderAuthBranding();
}

function showApp() {
  elements.authScreen.classList.remove("active");
  elements.appScreen.classList.add("active");
  closeAuthFeedbackModal();
  syncSidebarState();
  syncAppMode();
}

async function renderApp() {
  const perf = startPerfMeasure("renderApp");
  try {
    if (!state.currentUser || !state.accessToken) {
      logout({ resetRoute: true });
      return;
    }

    elements.userNameLabel.textContent = getLoggedUserName("-");
    elements.userRoleLabel.textContent = formatStaffRole(state.currentUser.role);
    elements.userAvatarLabel.textContent = getUserInitials(getLoggedUserName(""));
    void resolveClientIp();

    applyRequestedModuleFromHash();
    renderModuleNav();
    renderActiveModule();
    void loadDataForModule(state.activeModule)
      .then(() => {
        requestActiveModuleRender();
      })
      .catch((error) => {
        if (handleAuthenticationFailure(error, { showMessage: true })) {
          return;
        }
        showToast(formatError(error), "danger");
      });
    startDashboardAutoRefresh();
    watchPurchaseRequests();
    subscribeToPurchaseNotifications();
    subscribeToProductionNotifications();
    watchPayablesAlerts();
    subscribeToPayableNotifications();
    watchServiceOrders();
    subscribeToServiceOrderNotifications();
  } catch (error) {
    if (handleAuthenticationFailure(error, { showMessage: true })) {
      return;
    }
    showToast(formatError(error), "danger");
  } finally {
    endPerfMeasure(perf, `module=${state.activeModule}`);
  }
}

function renderModuleNav() {
  if (!state.currentUser) {
    elements.moduleNav.innerHTML = "";
    return;
  }

  const allowedModules = MODULES.filter((module) => hasPermission(module.key, "view"));
  if (!allowedModules.some((module) => module.key === state.activeModule)) {
    state.activeModule = allowedModules[0]?.key || "dashboard";
  }

  const activeModule = MODULES.find((module) => module.key === state.activeModule);
  elements.pageTitle.textContent =
    state.activeModule === "bom"
      ? "BOM - Estrutura de Produtos"
      : state.activeModule === "products"
        ? "Cadastro de Produtos"
          : state.activeModule === "production"
            ? "Ordens de Produção"
            : state.activeModule === "service_orders"
              ? "Ordem de Serviço"
            : state.activeModule === "machining"
              ? "Usinagem"
          : state.activeModule === "customers"
            ? "Cadastro de Clientes"
            : state.activeModule === "sales"
              ? "Vendas"
              : state.activeModule === "purchases"
                ? "Solicitação de Compras"
                : state.activeModule === "vps"
                  ? "Controle da VPS"
                  : state.activeModule === "reports"
                    ? "Relatórios"
                  : state.activeModule === "audit"
                    ? "Central de Logs"
                : state.activeModule === "permissions"
                  ? "Gerenciamento de Permissões"
        : activeModule?.label || "Dashboard";
  elements.topbarSubtitle.textContent = getModuleSubtitle(state.activeModule);
  syncModuleLocation();

  elements.moduleNav.innerHTML = allowedModules
    .map(
      (module) => `
        <button
          class="nav-button ${module.key === state.activeModule ? "active" : ""}"
          data-module="${module.key}"
          data-tooltip="${module.tooltip || module.label}"
          type="button"
          title="${module.tooltip || module.label}"
          aria-label="${module.tooltip || module.label}"
        >
          <span class="nav-icon">${module.icon}</span>
          <span class="nav-label">${module.label}</span>
        </button>
      `
    )
    .join("");

  elements.moduleNav.querySelectorAll("[data-module]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeModule = button.dataset.module;
      if (isMobileSidebarViewport()) {
        state.sidebarOpen = false;
      }
      renderModuleNav();
      renderActiveModule();
      void loadDataForModule(state.activeModule)
        .then(() => {
          requestActiveModuleRender();
        })
        .catch((error) => {
          if (handleAuthenticationFailure(error, { showMessage: true })) {
            return;
          }
          showToast(formatError(error), "danger");
        });
    });
  });
}

async function loadAllVisibleData() {
  const perf = startPerfMeasure("loadAllVisibleData");
  if (!state.supabase) {
    if (hasPermission("service_orders", "view")) {
      await Promise.all([loadServiceOrdersTable(), loadServiceOrderChecklistsTable()]);
    }
    loadMachiningData();
    endPerfMeasure(perf, "mode=offline");
    return;
  }

  const loaders = [];

  if (hasPermission("permissions", "view")) {
    loaders.push(loadPermissionsAdminData());
  } else if (hasPermission("purchases", "view") || hasPermission("service_orders", "view") || hasPermission("production", "view")) {
    loaders.push(loadAssignableUsers());
  }
  if (hasPermission("products", "view")) loaders.push(loadProductsTable());
  if (hasPermission("bom", "view")) {
    loaders.push(loadBomData());
    if (!hasPermission("products", "view")) loaders.push(loadProductsTable());
  }
  if (hasPermission("inventory", "view")) loaders.push(loadInventoryMovementsTable());
  if (hasPermission("production", "view")) {
    loaders.push(loadTable("production_orders", "production"));
    if (!hasPermission("products", "view")) loaders.push(loadProductsTable());
  }
  if (hasPermission("service_orders", "view")) {
    loaders.push(loadServiceOrdersTable());
    loaders.push(loadServiceOrderChecklistsTable());
    if (!hasPermission("products", "view")) loaders.push(loadProductsTable());
    if (!hasPermission("customers", "view")) loaders.push(loadTable("customers", "customers"));
  }
  if (hasPermission("customers", "view")) loaders.push(loadTable("customers", "customers"));
  if (hasPermission("sales", "view")) loaders.push(loadTable("sales", "sales"));
  if (hasPermission("purchases", "view")) loaders.push(loadTable("purchase_requests", "purchases"));
  if (hasPermission("payables", "view")) loaders.push(loadPayablesTable());
  if (hasPermission("reports", "view")) {
    if (!hasPermission("products", "view")) loaders.push(loadProductsTable());
    if (!hasPermission("inventory", "view")) loaders.push(loadInventoryMovementsTable());
    if (!hasPermission("production", "view")) loaders.push(loadTable("production_orders", "production"));
    if (!hasPermission("service_orders", "view")) {
      loaders.push(loadServiceOrdersTable());
      loaders.push(loadServiceOrderChecklistsTable());
    }
    if (!hasPermission("customers", "view")) loaders.push(loadTable("customers", "customers"));
    if (!hasPermission("sales", "view")) loaders.push(loadTable("sales", "sales"));
    if (!hasPermission("purchases", "view")) loaders.push(loadTable("purchase_requests", "purchases"));
    if (!hasPermission("payables", "view")) loaders.push(loadPayablesTable());
  }
  if (hasPermission("vps", "view")) loaders.push(loadVpsControlData());
  if (hasPermission("audit", "view")) loaders.push(loadAuditLogs());

  await Promise.all(loaders);
  loadMachiningData();
  state.dashboardLastUpdatedAt = new Date().toISOString();
  endPerfMeasure(perf, `loaders=${loaders.length}`);
}

async function loadDashboardData() {
  const perf = startPerfMeasure("loadDashboardData");
  if (!state.supabase) {
    if (hasPermission("service_orders", "view")) {
      await Promise.all([loadServiceOrdersTable(), loadServiceOrderChecklistsTable()]);
    }
    loadMachiningData();
    endPerfMeasure(perf, "mode=offline");
    return;
  }

  const range = getDashboardDateRange();
  const previousRange = getPreviousDashboardDateRange(range);
  const dashboardFrom = previousRange.from || range.from;
  const dashboardTo = range.to;
  const loaders = [];

  if (hasPermission("products", "view")) loaders.push(loadDashboardProductsData());
  if (hasPermission("production", "view")) loaders.push(loadDashboardProductionData(dashboardFrom, dashboardTo));
  if (hasPermission("service_orders", "view")) loaders.push(loadDashboardServiceOrdersData(dashboardFrom, dashboardTo));
  if (hasPermission("sales", "view")) loaders.push(loadDashboardSalesData(dashboardFrom, dashboardTo));
  if (hasPermission("purchases", "view")) loaders.push(loadDashboardPurchasesData(dashboardFrom, dashboardTo));
  if (hasPermission("payables", "view")) loaders.push(loadDashboardPayablesData(dashboardFrom, dashboardTo));

  await Promise.all(loaders);
  loadMachiningData();
  state.dashboardLastUpdatedAt = new Date().toISOString();
  endPerfMeasure(perf, `loaders=${loaders.length}`);
}

async function loadDashboardProductsData() {
  const perf = startPerfMeasure("loadDashboardProductsData");
  const { data, error } = await state.supabase
    .from("products")
    .select("id,name,unit,current_stock,minimum_stock")
    .order("created_at", { ascending: false });
  if (error) throw error;
  state.moduleData.products = data || [];
  endPerfMeasure(perf, `rows=${state.moduleData.products.length}`);
}

async function loadDashboardProductionData(fromDate, toDate) {
  const perf = startPerfMeasure("loadDashboardProductionData");
  let query = state.supabase
    .from("production_orders")
    .select("id,order_number,product_id,product_code,product_name,batch_size,priority,status,planned_start,planned_end,created_at,notes,sale_id,sale_number,customer_name,delivery_days,bom_structure_id,production_items,operation_steps,timeline_entries,attachments,material_plan,quality_logs,alerts,current_step_index,produced_quantity,defective_quantity,rework_quantity,estimated_minutes,active_operator,started_at,paused_at,completed_at");
  if (fromDate) {
    query = query.gte("planned_start", fromDate);
  }
  if (toDate) {
    query = query.lte("planned_start", toDate);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  state.moduleData.production = data || [];
  syncMachiningDerivedData();
  endPerfMeasure(perf, `rows=${state.moduleData.production.length}`);
}

async function loadDashboardServiceOrdersData(fromDate, toDate) {
  const perf = startPerfMeasure("loadDashboardServiceOrdersData");
  let query = state.supabase
    .from("service_orders")
    .select("id,order_number,customer_name,responsible_name,status,opened_at,created_at");
  if (fromDate) {
    query = query.gte("opened_at", fromDate);
  }
  if (toDate) {
    query = query.lte("opened_at", toDate);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  state.moduleData.serviceOrders = data || [];
  endPerfMeasure(perf, `rows=${state.moduleData.serviceOrders.length}`);
}

async function loadDashboardSalesData(fromDate, toDate) {
  const perf = startPerfMeasure("loadDashboardSalesData");
  const buildQuery = (columns) => {
    let query = state.supabase.from("sales").select(columns);
    if (fromDate) {
      query = query.gte("sale_date", fromDate);
    }
    if (toDate) {
      query = query.lte("sale_date", toDate);
    }
    return query.order("created_at", { ascending: false });
  };
  const { data, error } = await buildQuery("id,sale_date,created_at,delivery_date,delivery_days,customer_name,sale_number,status,priority,payment_method,subtotal_amount,discount_amount,total_amount,sale_items,production_generated,production_order_ids,contract_notes");
  if (error && isSalesSchemaCompatibilityError(error)) {
    const fallback = await buildQuery("id,sale_date,created_at,delivery_date,customer_name,sale_number,status,payment_method,subtotal_amount,discount_amount,total_amount,sale_items,production_generated,production_order_ids,contract_notes");
    if (fallback.error) throw fallback.error;
    state.moduleData.sales = fallback.data || [];
    endPerfMeasure(perf, `rows=${state.moduleData.sales.length}`);
    return;
  }
  if (error) throw error;
  state.moduleData.sales = data || [];
  endPerfMeasure(perf, `rows=${state.moduleData.sales.length}`);
}

async function loadDashboardPurchasesData(fromDate, toDate) {
  const perf = startPerfMeasure("loadDashboardPurchasesData");
  let query = state.supabase
    .from("purchase_requests")
    .select("id,created_at,requester_name,requester_id,department,urgency,status,request_items,purchase_details,notifications");
  if (fromDate) {
    query = query.gte("created_at", `${fromDate}T00:00:00`);
  }
  if (toDate) {
    query = query.lte("created_at", `${toDate}T23:59:59`);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  state.moduleData.purchases = data || [];
  endPerfMeasure(perf, `rows=${state.moduleData.purchases.length}`);
}

async function loadDashboardPayablesData(fromDate, toDate) {
  const perf = startPerfMeasure("loadDashboardPayablesData");
  let query = state.supabase
    .from("accounts_payable")
    .select("*");
  if (fromDate) {
    query = query.gte("due_date", fromDate);
  }
  if (toDate) {
    query = query.lte("due_date", toDate);
  }
  const { data, error } = await query.order("due_date", { ascending: true });
  if (error) throw error;
  state.moduleData.payables = data || [];
  watchPayablesAlerts();
  endPerfMeasure(perf, `rows=${state.moduleData.payables.length}`);
}

async function loadDataForModule(moduleKey) {
  const perf = startPerfMeasure(`loadDataForModule:${moduleKey}`);
  if (moduleKey === "dashboard") {
    await loadDashboardData();
    endPerfMeasure(perf);
    return;
  }

  if (moduleKey === "reports") {
    await loadAllVisibleData();
    endPerfMeasure(perf);
    return;
  }

  if (!state.supabase) {
    if (moduleKey === "service_orders") {
      await Promise.all([loadServiceOrdersTable(), loadServiceOrderChecklistsTable()]);
    }
    loadMachiningData();
    endPerfMeasure(perf, "mode=offline");
    return;
  }

  const loaders = [];

  if (moduleKey === "permissions" && hasPermission("permissions", "view")) {
    loaders.push(loadPermissionsAdminData());
  }
  if (moduleKey === "products" && hasPermission("products", "view")) {
    loaders.push(loadProductsTable());
    if (hasPermission("bom", "view")) {
      loaders.push(loadBomData());
    }
  }
  if (moduleKey === "bom" && hasPermission("bom", "view")) {
    loaders.push(loadBomData());
    loaders.push(loadProductsTable());
  }
  if (moduleKey === "inventory" && hasPermission("inventory", "view")) {
    loaders.push(loadInventoryMovementsTable());
    loaders.push(loadProductsTable());
    if (hasPermission("bom", "view")) {
      loaders.push(loadBomData());
    }
  }
  if (moduleKey === "production" && hasPermission("production", "view")) {
    loaders.push(loadTable("production_orders", "production"));
    loaders.push(loadProductsTable());
    loaders.push(loadBomData());
    if (!hasPermission("permissions", "view")) {
      loaders.push(loadAssignableUsers());
    }
  }
  if (moduleKey === "machining" && hasPermission("products", "view")) {
    loaders.push(loadProductsTable());
  }
  if (moduleKey === "service_orders" && hasPermission("service_orders", "view")) {
    loaders.push(loadServiceOrdersTable());
    loaders.push(loadServiceOrderChecklistsTable());
    loaders.push(loadProductsTable());
    loaders.push(loadTable("customers", "customers"));
    if (!hasPermission("permissions", "view")) {
      loaders.push(loadAssignableUsers());
    }
  }
  if (moduleKey === "customers" && hasPermission("customers", "view")) {
    loaders.push(loadTable("customers", "customers"));
  }
  if (moduleKey === "sales" && hasPermission("sales", "view")) {
    loaders.push(loadProductsTable());
    loaders.push(loadBomData());
    loaders.push(loadTable("customers", "customers"));
    loaders.push(loadTable("sales", "sales"));
  }
  if (moduleKey === "purchases" && hasPermission("purchases", "view")) {
    loaders.push(loadTable("purchase_requests", "purchases"));
    loaders.push(loadProductsTable());
    if (!hasPermission("permissions", "view")) {
      loaders.push(loadAssignableUsers());
    }
  }
  if (moduleKey === "payables" && hasPermission("payables", "view")) {
    loaders.push(loadPayablesTable());
    if (hasPermission("sales", "view")) {
      loaders.push(loadTable("sales", "sales"));
    }
  }
  if (moduleKey === "vps" && hasPermission("vps", "view")) {
    loaders.push(loadVpsControlData());
  }
  if (moduleKey === "audit" && hasPermission("audit", "view")) {
    loaders.push(loadAuditLogs());
  }

  await Promise.all(loaders);
  loadMachiningData();
  state.dashboardLastUpdatedAt = new Date().toISOString();
  endPerfMeasure(perf, `loaders=${loaders.length}`);
}

async function loadAssignableUsers() {
  const { data, error } = await state.supabase.rpc("list_active_app_users", {
    p_access_token: state.accessToken,
  });
  if (error) throw error;
  state.moduleData.users = data || [];
}

async function callVpsControlApi(view, options = {}) {
  if (!state.supabase) {
    throw new Error("Conexão com Supabase indisponível.");
  }

  if (view === "snapshot") {
    const { data, error } = await state.supabase.rpc("get_vps_control_snapshot", {
      p_access_token: state.accessToken,
    });
    if (error) throw error;
    return data || {};
  }

  if (view === "logs") {
    const query = options.query || {};
    const { data, error } = await state.supabase.rpc("get_vps_logs", {
      p_access_token: state.accessToken,
      p_source: query.source || "all",
      p_level: query.level || "all",
      p_search: query.search || null,
      p_date_from: query.date_from || null,
      p_date_to: query.date_to || null,
    });
    if (error) throw error;
    return data || [];
  }

  if (view === "actions") {
    const body = options.body || {};
    const { data, error } = await state.supabase.rpc("enqueue_vps_action", {
      p_access_token: state.accessToken,
      p_action_type: body.action_type,
      p_target_type: body.target_type,
      p_target_name: body.target_name,
      p_payload: body.payload || {},
    });
    if (error) throw error;
    return data || {};
  }

  if (view === "database_table") {
    const { data, error } = await state.supabase.rpc("get_vps_database_table_details", {
      p_access_token: state.accessToken,
      p_table_name: options.table_name,
    });
    if (error) throw error;
    return data || {};
  }

  throw new Error("Operação do módulo VPS não suportada.");
}

async function loadVpsControlData() {
  const perf = startPerfMeasure("loadVpsControlData");
  const [snapshot, logs] = await Promise.all([
    callVpsControlApi("snapshot"),
    callVpsControlApi("logs", {
      query: {
        source: state.vpsControl.logFilters.source,
        level: state.vpsControl.logFilters.level,
        search: state.vpsControl.logFilters.search,
        date_from: state.vpsControl.logFilters.dateFrom,
        date_to: state.vpsControl.logFilters.dateTo,
      },
    }),
  ]);

  state.vpsControl.summary = snapshot.summary || null;
  state.vpsControl.services = snapshot.services || [];
  state.vpsControl.applications = snapshot.applications || [];
  state.vpsControl.security = snapshot.security || null;
  state.vpsControl.backups = snapshot.backups || [];
  state.vpsControl.database = snapshot.database || null;
  state.vpsControl.domains = snapshot.domains || [];
  state.vpsControl.audit = snapshot.audit || [];
  state.vpsControl.logs = logs || [];

  const tables = Array.isArray(state.vpsControl.database?.tables) ? state.vpsControl.database.tables : [];
  if (tables.length && !state.vpsControl.databaseSelectedTable) {
    state.vpsControl.databaseSelectedTable = tables[0].table_name || "";
  }
  if (state.vpsControl.databaseSelectedTable) {
    await loadVpsDatabaseTableDetail(state.vpsControl.databaseSelectedTable);
  }
  endPerfMeasure(perf, `logs=${state.vpsControl.logs.length}`);
}

async function loadVpsDatabaseTableDetail(tableName) {
  if (!tableName) {
    state.vpsControl.databaseSelectedTableDetail = null;
    return;
  }

  const detail = await callVpsControlApi("database_table", { table_name: tableName });
  state.vpsControl.databaseSelectedTable = tableName;
  state.vpsControl.databaseSelectedTableDetail = detail || null;
}

async function loadPermissionsAdminData() {
  const perf = startPerfMeasure("loadPermissionsAdminData");
  const { data, error } = await state.supabase.rpc("get_permissions_admin_snapshot", {
    p_access_token: state.accessToken,
  });
  if (error) throw error;

  state.permissionRoles = data?.roles || [];
  state.moduleData.users = data?.users || [];
  endPerfMeasure(perf, `roles=${state.permissionRoles.length} users=${state.moduleData.users.length}`);
}

async function loadTable(tableName, stateKey) {
  const perf = startPerfMeasure(`loadTable:${tableName}`);
  const { data, error } = await state.supabase.from(tableName).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  state.moduleData[stateKey] = data || [];
  state.dashboardLastUpdatedAt = new Date().toISOString();
  if (stateKey === "production" || stateKey === "inventory") {
    syncMachiningDerivedData();
  }
  endPerfMeasure(perf, `rows=${state.moduleData[stateKey].length}`);
}

function upsertModuleRecord(stateKey, record, options = {}) {
  if (!record?.id) return;
  const normalize = typeof options.normalize === "function" ? options.normalize : (item) => item;
  const nextRecord = normalize(record);
  const currentItems = Array.isArray(state.moduleData[stateKey]) ? state.moduleData[stateKey] : [];
  const nextItems = currentItems.filter((item) => item.id !== nextRecord.id);
  state.moduleData[stateKey] = [nextRecord, ...nextItems].sort((left, right) =>
    new Date(right.created_at || 0) - new Date(left.created_at || 0)
  );
  state.dashboardLastUpdatedAt = new Date().toISOString();
  if (stateKey === "production" || stateKey === "inventory") {
    syncMachiningDerivedData();
  }
}

function removeModuleRecord(stateKey, recordId) {
  if (!recordId) return;
  const currentItems = Array.isArray(state.moduleData[stateKey]) ? state.moduleData[stateKey] : [];
  state.moduleData[stateKey] = currentItems.filter((item) => item.id !== recordId);
  state.dashboardLastUpdatedAt = new Date().toISOString();
  if (stateKey === "production" || stateKey === "inventory") {
    syncMachiningDerivedData();
  }
}

async function loadPayablesTable() {
  try {
    await loadTable("accounts_payable", "payables");
    watchPayablesAlerts();
  } catch (error) {
    state.moduleData.payables = [];
    if (!loadPayablesTable.warned && /accounts_payable|column|schema cache|relation .* does not exist/i.test(String(error?.message || ""))) {
      loadPayablesTable.warned = true;
      showToast("Tabela de contas a pagar ainda não aplicada no banco.", "warning");
      return;
    }
    throw error;
  }
}

async function loadProductsTable() {
  try {
    await loadTable("products", "products");
  } catch (error) {
    state.moduleData.products = [];
    if (!loadProductsTable.warned && String(error?.message || "").toLowerCase().includes("products")) {
      loadProductsTable.warned = true;
      showToast("Tabela de produtos ainda não aplicada no banco. Execute o schema do Supabase.", "warning");
      return;
    }

    throw error;
  }
}

async function loadInventoryMovementsTable() {
  try {
    await loadTable("inventory_movements", "inventory");
  } catch (error) {
    state.moduleData.inventory = [];
    if (!loadInventoryMovementsTable.warned && String(error?.message || "").toLowerCase().includes("inventory_movements")) {
      loadInventoryMovementsTable.warned = true;
      showToast("Tabela de movimentações de estoque ainda não aplicada no banco.", "warning");
      return;
    }

    throw error;
  }
}

async function loadBomData() {
  const perf = startPerfMeasure("loadBomData");
  try {
    const [{ data: materials, error: materialsError }, { data: structures, error: structuresError }] = await Promise.all([
      state.supabase.from("bom_materials").select("*").order("created_at", { ascending: false }),
      state.supabase.from("bom_structures").select("*").order("created_at", { ascending: false }),
    ]);

    if (materialsError) throw materialsError;
    if (structuresError) throw structuresError;

    state.moduleData.bomMaterials = materials || [];
    state.moduleData.bomStructures = structures || [];
    state.dashboardLastUpdatedAt = new Date().toISOString();
    endPerfMeasure(perf, `materials=${state.moduleData.bomMaterials.length} structures=${state.moduleData.bomStructures.length}`);
  } catch (error) {
    state.moduleData.bomMaterials = [];
    state.moduleData.bomStructures = [];
    if (!loadBomData.warned && /bom_materials|bom_structures/i.test(String(error?.message || ""))) {
      loadBomData.warned = true;
      showToast("Estruturas do BOM ainda não aplicadas no banco.", "warning");
      return;
    }

    throw error;
  }
}

async function loadAuditLogs() {
  if (!state.supabase) {
    state.moduleData.auditLogs = [];
    return;
  }

  try {
    let query = state.supabase
      .from("logs_sistema")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    const filters = state.auditFilters || createEmptyAuditFilters();
    if (filters.module !== "all") query = query.eq("modulo", filters.module);
    if (filters.user !== "all") query = query.eq("usuario_nome", filters.user);
    if (filters.action !== "all") query = query.eq("acao", filters.action);
    if (filters.level !== "all") query = query.eq("nivel", filters.level);
    if (filters.date_from) query = query.gte("created_at", `${filters.date_from}T00:00:00`);
    if (filters.date_to) query = query.lte("created_at", `${filters.date_to}T23:59:59`);
    if (filters.search) query = query.or([
      `descricao.ilike.%${filters.search}%`,
      `item_afetado.ilike.%${filters.search}%`,
      `acao.ilike.%${filters.search}%`,
      `usuario_nome.ilike.%${filters.search}%`,
    ].join(","));

    const { data, error } = await query;
    if (error) throw error;
    state.moduleData.auditLogs = data || [];
    if (!state.auditSelectedLogId && state.moduleData.auditLogs[0]?.id) {
      state.auditSelectedLogId = state.moduleData.auditLogs[0].id;
    }
  } catch (error) {
    state.moduleData.auditLogs = [];
    if (!loadAuditLogs.warned && /logs_sistema|column|schema cache|relation .* does not exist/i.test(String(error?.message || ""))) {
      loadAuditLogs.warned = true;
      showToast("Tabela de auditoria ainda não aplicada no banco.", "warning");
      return;
    }
    throw error;
  }
}

function renderActiveModule() {
  const moduleKey = MODULES.some((module) => module.key === state.activeModule) ? state.activeModule : "dashboard";
  const requestId = ++activeModuleRenderRequestId;
  const focusSnapshot = getModuleFocusSnapshot();
  elements.moduleContainer.innerHTML = renderModuleLoadingState(moduleKey);
  lastActiveModuleRenderPromise = renderActiveModuleAsync(moduleKey, requestId, focusSnapshot);
  return lastActiveModuleRenderPromise;
}

async function renderActiveModuleAsync(moduleKey, requestId, focusSnapshot = null) {
  try {
    const moduleController = await importModuleController(moduleKey);
    if (requestId !== activeModuleRenderRequestId) return;

    const html = typeof moduleController.render === "function"
      ? moduleController.render()
      : `<div class="empty-state">Módulo ${escapeHtml(moduleKey)} indisponível.</div>`;

    elements.moduleContainer.innerHTML = html;

    if (typeof moduleController.bind === "function") {
      moduleController.bind();
    }

    bindCurrencyInputs(elements.moduleContainer);
    bindEditActions();
    bindDeleteActions();
    restoreModuleFocusSnapshot(focusSnapshot);
    trackModuleAccessIfNeeded();
  } catch (error) {
    if (requestId !== activeModuleRenderRequestId) return;
    elements.moduleContainer.innerHTML = `
      <section class="module-panel">
        <div class="empty-state">${escapeHtml(formatError(error))}</div>
      </section>
    `;
  }
}

function renderModuleLoadingState(moduleKey) {
  const moduleLabel = MODULES.find((module) => module.key === moduleKey)?.label || "Módulo";
  return `
    <section class="module-panel">
      <div class="empty-state">Carregando ${escapeHtml(moduleLabel)}...</div>
    </section>
  `;
}

async function importModuleController(moduleKey) {
  const normalizedModuleKey = MODULE_IMPORT_PATHS[moduleKey] ? moduleKey : "dashboard";
  if (lazyModuleRegistry.has(normalizedModuleKey)) {
    return lazyModuleRegistry.get(normalizedModuleKey);
  }

  const modulePath = MODULE_IMPORT_PATHS[normalizedModuleKey];
  const importedModule = await import(modulePath);
  const moduleController = importedModule.default || importedModule;
  lazyModuleRegistry.set(normalizedModuleKey, moduleController);
  return moduleController;
}

function startDashboardAutoRefresh() {
  if (state.dashboardAutoRefreshTimer || !state.supabase) return;

  state.dashboardAutoRefreshTimer = window.setInterval(() => {
    if (!state.currentUser || state.activeModule !== "dashboard" || document.hidden) return;
    refreshDashboardData({ silent: true });
  }, 60000);
}

function stopDashboardAutoRefresh() {
  if (!state.dashboardAutoRefreshTimer) return;
  window.clearInterval(state.dashboardAutoRefreshTimer);
  state.dashboardAutoRefreshTimer = null;
}

async function refreshDashboardData({ silent = false } = {}) {
  if (!state.currentUser || !state.supabase || state.dashboardRefreshInFlight) return;

  state.dashboardRefreshInFlight = true;
  try {
    await loadDashboardData();
    if (state.activeModule === "dashboard") {
      renderActiveModule();
    }
    if (!silent) {
      void queueSystemLog({
        moduleKey: "dashboard",
        action: "acesso_tela",
        level: "Informativo",
        itemAffected: "Dashboard",
        description: "Dashboard atualizada manualmente.",
        entityType: "module",
        entityId: "dashboard",
      });
      showToast("Dashboard atualizada com sucesso.", "success");
    }
  } catch (error) {
    if (!silent) {
      showToast(formatError(error), "danger");
    }
  } finally {
    state.dashboardRefreshInFlight = false;
  }
}

function renderProductsModule() {
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
    const matchesCategory = state.productCategoryFilter === "all" || getProductCategory(item) === state.productCategoryFilter;
    return matchesSearch && matchesCategory;
  });
  const activeProducts = products.filter((item) => item.status === "active").length;
  const lowStockItems = products.filter((item) => Number(item.current_stock) <= Number(item.minimum_stock));
  const finishedProducts = products.filter((item) => getProductType(item) === "finished_product").length;
  const movementProduct = products.find((item) => item.id === state.productMovementId);
  const categoryOptions = buildProductCategoryOptions();

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
              <th>Código</th>
              <th>Nome</th>
              <th>Status</th>
              <th>Categoria</th>
              <th>Tipo</th>
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
                          <td>${item.code}</td>
                          <td>
                            <strong>${item.name}</strong>
                            <div class="table-inline-copy muted">${item.location || "Sem localização"}</div>
                          </td>
                          <td>${productStatusCell(item.status)}</td>
                          <td>${productCategoryCell(item.category)}</td>
                          <td>${productTypeCell(getProductType(item))}</td>
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
                : `<tr><td colspan="12"><div class="empty-state">Nenhum produto encontrado</div></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDashboard() {
  const snapshot = buildDashboardSnapshot();

  return `
    <section class="module-panel admin-dashboard">
      <div class="module-head dashboard-head">
        <div>
          <p class="eyebrow muted">Visao estrategica do negocio</p>
          <h3>Dashboard do Administrador</h3>
          <p class="muted">Leitura rápida de lucro, operação, riscos e desempenho geral em um único painel.</p>
        </div>
        <div class="module-head-actions dashboard-head-actions">
          <div class="dashboard-updated-badge">
            <span class="muted">Atualizado</span>
            <strong>${formatDateTime(state.dashboardLastUpdatedAt)}</strong>
          </div>
          <button class="ghost-button secondary-surface-button" type="button" data-dashboard-refresh>Atualizar agora</button>
        </div>
      </div>

      <section class="dashboard-block dashboard-filter-block">
        <div class="dashboard-block-header">
          <div>
            <h4>Filtro Global</h4>
            <p class="muted">Todos os indicadores, graficos e listas respondem ao mesmo periodo.</p>
          </div>
          <span class="status-chip chip-blue">${escapeHtml(snapshot.rangeLabel)}</span>
        </div>
        <div class="dashboard-filter-toolbar">
          ${[
            { value: "today", label: "Hoje" },
            { value: "7d", label: "7 dias" },
            { value: "30d", label: "30 dias" },
            { value: "custom", label: "Personalizado" },
          ].map((option) => `
            <button
              class="dashboard-filter-chip ${state.dashboardRange === option.value ? "active" : ""}"
              type="button"
              data-dashboard-range="${option.value}"
            >
              ${option.label}
            </button>
          `).join("")}
          <div class="dashboard-custom-range ${state.dashboardRange === "custom" ? "visible" : ""}">
            <label>
              De
              <input type="date" id="dashboard-range-from" value="${escapeHtml(state.dashboardCustomRange.from)}" />
            </label>
            <label>
              Ate
              <input type="date" id="dashboard-range-to" value="${escapeHtml(state.dashboardCustomRange.to)}" />
            </label>
          </div>
        </div>
      </section>

      <div class="summary-grid dashboard-kpi-grid">
        ${snapshot.kpis.map(renderStrategicKpiCard).join("")}
      </div>

      <section class="dashboard-block dashboard-alerts-block">
        <div class="dashboard-block-header">
          <div>
            <h4>Alertas Prioritarios</h4>
            <p class="muted">Problemas que exigem ação imediata ou acompanhamento de perto.</p>
          </div>
          <span class="status-chip ${snapshot.alerts.length ? "status-pending" : "status-completed"}">
            ${snapshot.alerts.length ? `${snapshot.alerts.length} alerta(s)` : "Operação estável"}
          </span>
        </div>
        <div class="dashboard-alert-list">
          ${
            snapshot.alerts.length
              ? snapshot.alerts.map(renderDashboardAlert).join("")
              : `<div class="empty-state">Nenhum alerta urgente para o periodo selecionado.</div>`
          }
        </div>
      </section>

      <div class="dashboard-grid dashboard-strategic-grid">
        <div class="dashboard-stack">
          <section class="dashboard-block">
            <div class="dashboard-block-header">
              <div>
                <h4>Financeiro</h4>
                <p class="muted">Faturamento por periodo com comparativo entre custo e lucro estimado.</p>
              </div>
            </div>
            ${renderDashboardBarChart({
              labels: snapshot.financeChart.labels,
              series: snapshot.financeChart.series,
              emptyLabel: "Sem dados financeiros para o periodo selecionado.",
            })}
          </section>

          <section class="dashboard-block">
            <div class="dashboard-block-header">
              <div>
                <h4>Produção</h4>
                <p class="muted">Volume produzido por periodo e tempo medio para concluir ordens.</p>
              </div>
            </div>
            ${renderDashboardBarChart({
              labels: snapshot.productionChart.labels,
              series: snapshot.productionChart.series,
              emptyLabel: "Sem ordens produtivas dentro do filtro atual.",
            })}
            <div class="dashboard-chart-metrics">
              <article class="dashboard-stat-card">
                <span class="muted">Tempo medio de produção</span>
                <strong>${snapshot.productionAverageTimeLabel}</strong>
              </article>
              <article class="dashboard-stat-card">
                <span class="muted">Ordens concluídas</span>
                <strong>${snapshot.productionCompletedCount}</strong>
              </article>
            </div>
          </section>

          <section class="dashboard-block">
            <div class="dashboard-block-header">
              <div>
                <h4>Pedidos Recentes</h4>
                <p class="muted">Pedidos mais relevantes com status, prioridade e atalhos de ação.</p>
              </div>
            </div>
            <div class="table-wrapper dashboard-orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Prioridade</th>
                    <th>Data</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    snapshot.recentOrders.length
                      ? snapshot.recentOrders.map((item) => `
                        <tr>
                          <td>
                            <strong>${escapeHtml(item.customerName)}</strong>
                            <div class="table-inline-copy muted">${escapeHtml(item.saleNumber)}</div>
                          </td>
                          <td>${formatCurrency(item.total)}</td>
                          <td>${item.statusBadge}</td>
                          <td>${productionPriorityCell(item.priority)}</td>
                          <td>${formatDate(item.date)}</td>
                          <td>
                            <div class="dashboard-inline-actions">
                              <button class="inline-button" type="button" data-dashboard-sales-view-id="${item.id}">Visualizar</button>
                              <button class="inline-button" type="button" data-dashboard-sales-edit-id="${item.id}">Editar</button>
                            </div>
                          </td>
                        </tr>
                      `).join("")
                      : `<tr><td colspan="6"><div class="empty-state">Nenhum pedido encontrado no periodo selecionado.</div></td></tr>`
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div class="dashboard-stack">
          <section class="dashboard-block">
            <div class="dashboard-block-header">
              <div>
                <h4>Comercial</h4>
                <p class="muted">Pedidos por periodo com leitura rápida de volume e ticket medio.</p>
              </div>
            </div>
            ${renderDashboardBarChart({
              labels: snapshot.commercialChart.labels,
              series: snapshot.commercialChart.series,
              emptyLabel: "Sem pedidos comerciais para o periodo selecionado.",
            })}
            <div class="dashboard-chart-metrics">
              <article class="dashboard-stat-card">
                <span class="muted">Ticket medio</span>
                <strong>${formatCurrency(snapshot.averageTicket)}</strong>
              </article>
              <article class="dashboard-stat-card">
                <span class="muted">Pedidos em aberto</span>
                <strong>${snapshot.openOrdersCount}</strong>
              </article>
            </div>
          </section>

          <section class="dashboard-block">
            <div class="dashboard-block-header">
              <div>
                <h4>Pipeline da Produção</h4>
                <p class="muted">Fluxo resumido por etapa com destaque para gargalos.</p>
              </div>
            </div>
            <div class="dashboard-pipeline">
              ${snapshot.pipeline.map(renderDashboardPipelineStage).join("")}
            </div>
          </section>

          <section class="dashboard-block">
            <div class="dashboard-block-header">
              <div>
                <h4>Resumo Financeiro</h4>
                <p class="muted">Contas previstas e saldo operacional a partir dos registros atuais.</p>
              </div>
            </div>
            <div class="dashboard-financial-summary">
              ${snapshot.financialSummary.map((item) => `
                <article class="dashboard-financial-card">
                  <span class="muted">${item.label}</span>
                  <strong>${item.isCurrency ? formatCurrency(item.value) : escapeHtml(String(item.value))}</strong>
                  <small class="${item.tone ? `metric-${item.tone}` : "muted"}">${escapeHtml(item.note)}</small>
                </article>
              `).join("")}
            </div>
          </section>

          <section class="dashboard-block">
            <div class="dashboard-block-header">
              <div>
                <h4>Estoque Critico</h4>
                <p class="muted">Itens baixos ou zerados que podem afetar a operação.</p>
              </div>
              <button class="ghost-button" type="button" data-dashboard-module="inventory">Ir para módulo</button>
            </div>
            <div class="dashboard-list">
              ${
                snapshot.criticalStock.length
                  ? snapshot.criticalStock.map((item) => `
                    <article class="dashboard-list-item dashboard-stock-alert ${item.level}">
                      <div>
                        <strong>${escapeHtml(item.name)}</strong>
                        <span class="muted">Saldo ${formatQuantity(item.currentStock)} ${escapeHtml(item.unit)} | Mínimo ${formatQuantity(item.minimumStock)} ${escapeHtml(item.unit)}</span>
                      </div>
                      <span class="status-chip ${item.level === "danger" ? "status-cancelled" : "status-pending"}">
                        ${item.level === "danger" ? "Zerado" : "Baixo"}
                      </span>
                    </article>
                  `).join("")
                  : `<div class="empty-state">Nenhum item com estoque critico no momento.</div>`
              }
            </div>
          </section>
        </div>
      </div>
    </section>
  `;
}

function getReportsDateRangeBounds() {
  const from = state.reportsFilters?.from ? new Date(`${state.reportsFilters.from}T00:00:00`) : null;
  const to = state.reportsFilters?.to ? new Date(`${state.reportsFilters.to}T23:59:59`) : null;
  return { from, to };
}

function isDateWithinReportsRange(value) {
  if (!value) return false;
  const { from, to } = getReportsDateRangeBounds();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (from && date.getTime() < from.getTime()) return false;
  if (to && date.getTime() > to.getTime()) return false;
  return true;
}

function buildReportsSnapshot() {
  const sales = (state.moduleData.sales || []).map((sale) => ({ sale, metadata: getSaleMetadata(sale) }))
    .filter(({ sale }) => isDateWithinReportsRange(sale.created_at || `${sale.sale_date || ""}T00:00:00`));
  const purchases = (state.moduleData.purchases || []).map((request) => ({ request, metadata: getPurchaseRequestMetadata(request) }))
    .filter(({ request }) => isDateWithinReportsRange(request.created_at || `${new Date().toISOString().slice(0, 10)}T00:00:00`));
  const payables = (state.moduleData.payables || []).map((payable) => ({ payable, metadata: getPayableMetadata(payable) }))
    .filter(({ metadata }) => isDateWithinReportsRange(`${metadata.due_date || new Date().toISOString().slice(0, 10)}T00:00:00`));
  const production = (state.moduleData.production || []).filter((order) =>
    isDateWithinReportsRange(`${order.planned_start || String(order.created_at || "").slice(0, 10)}T00:00:00`)
  );
  const serviceOrders = (state.moduleData.serviceOrders || []).filter((order) =>
    isDateWithinReportsRange(`${order.opened_at || String(order.created_at || "").slice(0, 10)}T00:00:00`)
  );
  const criticalStock = (state.moduleData.products || []).filter((item) => Number(item.current_stock || 0) <= Number(item.minimum_stock || 0));

  const finalizedSales = sales.filter(({ metadata }) => metadata.status === "finalized");
  const totalSales = finalizedSales.reduce((sum, { metadata }) => sum + Number(metadata.total || 0), 0);
  const openPurchases = purchases.filter(({ metadata }) => ["pending", "in_analysis", "approved", "in_purchase"].includes(metadata.status));
  const totalPurchases = purchases.reduce((sum, { metadata }) => sum + Number(metadata.purchaseDetails.total_amount || 0), 0);
  const pendingPayables = payables.filter(({ metadata }) => ["pending", "overdue"].includes(metadata.status));
  const totalPayables = payables.reduce((sum, { metadata }) => sum + Number(metadata.amount || 0), 0);
  const paidPayablesTotal = payables
    .filter(({ metadata }) => metadata.status === "paid")
    .reduce((sum, { metadata }) => sum + Number(metadata.amount || 0), 0);
  const completedProduction = production.filter((item) => item.status === "completed");
  const inProgressProduction = production.filter((item) => item.status === "in_progress");
  const openServiceOrders = serviceOrders.filter((item) => !["completed", "cancelled"].includes(item.status));

  return {
    totalSales,
    finalizedSalesCount: finalizedSales.length,
    totalPurchases,
    openPurchasesCount: openPurchases.length,
    totalPayables,
    pendingPayablesCount: pendingPayables.length,
    paidPayablesTotal,
    completedProductionCount: completedProduction.length,
    inProgressProductionCount: inProgressProduction.length,
    criticalStockCount: criticalStock.length,
    openServiceOrdersCount: openServiceOrders.length,
    recentSales: finalizedSales.slice(0, 8),
    production,
    criticalStock,
    purchases,
    payables,
    serviceOrders: openServiceOrders.slice(0, 8),
  };
}

function buildReportsExportHtml(snapshot) {
  const salesRows = snapshot.recentSales.map(({ sale, metadata }) => `
    <tr>
      <td>${escapeHtml(sale.sale_number || sale.id || "-")}</td>
      <td>${escapeHtml(sale.customer_name || "-")}</td>
      <td>${formatCurrency(metadata.total || 0)}</td>
      <td>${escapeHtml(metadata.statusLabel || "-")}</td>
    </tr>
  `).join("");
  const productionRows = snapshot.production.slice(0, 10).map((order) => `
    <tr>
      <td>${escapeHtml(order.order_number || "-")}</td>
      <td>${escapeHtml(order.product_name || "-")}</td>
      <td>${formatQuantity(order.batch_size)}</td>
      <td>${escapeHtml(order.status || "-")}</td>
    </tr>
  `).join("");
  const payableRows = snapshot.payables.slice(0, 12).map(({ payable, metadata }) => `
    <tr>
      <td>${escapeHtml(metadata.payable_number || payable.id || "-")}</td>
      <td>${escapeHtml(metadata.supplier || "-")}</td>
      <td>${escapeHtml(metadata.category || "-")}</td>
      <td>${formatCurrency(metadata.amount || 0)}</td>
      <td>${escapeHtml(formatDate(metadata.due_date))}</td>
      <td>${escapeHtml(metadata.status === "paid" ? "Pago" : metadata.status === "overdue" ? "Atrasado" : "Pendente")}</td>
    </tr>
  `).join("");

  return `
    <article class="sales-document-sheet">
      <header class="sales-document-header">
        <div>
          <h2>Relatórios Gerenciais</h2>
          <p>Periodo de ${escapeHtml(formatDate(state.reportsFilters.from))} ate ${escapeHtml(formatDate(state.reportsFilters.to))}</p>
        </div>
        <div class="sales-document-meta">
          <strong>${formatDateTime(new Date().toISOString())}</strong>
        </div>
      </header>
      <section class="sales-document-banner">
        <p>Vendas finalizadas: ${formatCurrency(snapshot.totalSales)} • Compras registradas: ${formatCurrency(snapshot.totalPurchases)} • Contas a pagar: ${formatCurrency(snapshot.totalPayables)} • Produção concluída: ${snapshot.completedProductionCount}</p>
      </section>
      <h3>Vendas recentes</h3>
      <table class="sales-document-items-table">
        <thead><tr><th>Número</th><th>Cliente</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${salesRows || `<tr><td colspan="4">Sem vendas no periodo.</td></tr>`}</tbody>
      </table>
      <h3>Produção</h3>
      <table class="sales-document-items-table">
        <thead><tr><th>Ordem</th><th>Produto</th><th>Quantidade</th><th>Status</th></tr></thead>
        <tbody>${productionRows || `<tr><td colspan="4">Sem ordens no periodo.</td></tr>`}</tbody>
      </table>
      <h3>Contas a pagar</h3>
      <table class="sales-document-items-table">
        <thead><tr><th>Número</th><th>Fornecedor</th><th>Categoria</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
        <tbody>${payableRows || `<tr><td colspan="6">Sem contas a pagar no periodo.</td></tr>`}</tbody>
      </table>
    </article>
  `;
}

function renderReportsModule() {
  if (!hasPermission("reports", "view")) {
    return noPermissionTemplate("Seu perfil não possui acesso ao módulo de relatórios.");
  }

  const snapshot = buildReportsSnapshot();

  return `
    <section class="module-panel">
      <div class="module-head">
        <div>
          <p class="eyebrow muted">Analise gerencial</p>
          <h3>Relatórios</h3>
          <p class="muted">Consolidado operacional de vendas, produção, compras, estoque e ordens de serviço.</p>
        </div>
        <div class="module-head-actions">
          <button class="ghost-button" type="button" data-reports-refresh>Atualizar</button>
          <button class="primary-button" type="button" data-reports-export>Exportar PDF</button>
        </div>
      </div>

      <form id="reports-filter-form" class="table-actions reports-filter-grid">
        <label>De<input type="date" name="from" value="${escapeHtml(state.reportsFilters.from)}" /></label>
        <label>Até<input type="date" name="to" value="${escapeHtml(state.reportsFilters.to)}" /></label>
        <div class="form-actions-row">
          <button class="primary-button" type="submit">Aplicar periodo</button>
        </div>
      </form>

      <div class="summary-grid">
        ${renderKpiCard({ label: "Vendas Finalizadas", value: formatCurrency(snapshot.totalSales), note: `${snapshot.finalizedSalesCount} venda(s) no periodo`, icon: "◨", tone: "green" })}
        ${renderKpiCard({ label: "Compras", value: formatCurrency(snapshot.totalPurchases), note: `${snapshot.openPurchasesCount} solicitação(oes) em aberto`, icon: "◧", tone: "amber" })}
        ${renderKpiCard({ label: "Produção Concluída", value: snapshot.completedProductionCount, note: `${snapshot.inProgressProductionCount} ordem(ns) em andamento`, icon: "◭", tone: "blue" })}
        ${renderKpiCard({ label: "Estoque Critico", value: snapshot.criticalStockCount, note: `${snapshot.openServiceOrdersCount} OS abertas`, icon: "◬", tone: "red" })}
      </div>

      <div class="reports-grid">
        <section class="table-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Vendas recentes</h4>
              <p class="muted">Últimas vendas finalizadas dentro do período.</p>
            </div>
          </div>
          ${renderTable(
            ["Número", "Cliente", "Total", "Status"],
            snapshot.recentSales.map(({ sale, metadata }) => [
              sale.sale_number || sale.id || "-",
              sale.customer_name || "-",
              formatCurrency(metadata.total || 0),
              salesStatusCell(metadata.status || "quote"),
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
          ${renderTable(
            ["Ordem", "Produto", "Quantidade", "Status"],
            snapshot.production.slice(0, 10).map((order) => [
              order.order_number || "-",
              order.product_name || "-",
              formatQuantity(order.batch_size),
              statusCell(order.status || "planned"),
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
          ${renderTable(
            ["Produto", "Atual", "Mínimo", "Unidade"],
            snapshot.criticalStock.slice(0, 10).map((item) => [
              item.name,
              formatQuantity(item.current_stock),
              formatQuantity(item.minimum_stock),
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
          ${renderTable(
            ["OS", "Cliente", "Responsavel", "Status"],
            snapshot.serviceOrders.map((order) => [
              order.order_number || "-",
              order.customer_name || "-",
              order.responsible_name || "-",
              renderServiceOrderStatusBadge(order.status),
            ])
          )}
        </section>
      </div>
    </section>
  `;
}

function renderKpiCard(card) {
  return `
    <article class="summary-card">
      <div class="kpi-head">
        <span>${card.label}</span>
        <span class="kpi-icon kpi-${card.tone}">${card.icon}</span>
      </div>
      <strong>${card.value}</strong>
      <span>${card.note}</span>
    </article>
  `;
}

function bindDashboardEvents() {
  document.querySelectorAll("[data-dashboard-range]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.dashboardRange = button.dataset.dashboardRange || "30d";
      if (state.dashboardRange !== "custom") {
        await refreshDashboardData();
      } else {
        if (!state.dashboardCustomRange.to) {
          state.dashboardCustomRange.to = new Date().toISOString().slice(0, 10);
        }
        if (!state.dashboardCustomRange.from) {
          state.dashboardCustomRange.from = getDateShiftedIso(state.dashboardCustomRange.to, -29);
        }
        await refreshDashboardData();
      }
    });
  });

  document.querySelector("#dashboard-range-from")?.addEventListener("change", async (event) => {
    state.dashboardRange = "custom";
    state.dashboardCustomRange.from = event.currentTarget.value;
    await refreshDashboardData();
  });

  document.querySelector("#dashboard-range-to")?.addEventListener("change", async (event) => {
    state.dashboardRange = "custom";
    state.dashboardCustomRange.to = event.currentTarget.value;
    await refreshDashboardData();
  });

  document.querySelector("[data-dashboard-refresh]")?.addEventListener("click", async () => {
    await refreshDashboardData();
  });

  document.querySelectorAll("[data-dashboard-module]").forEach((button) => {
    button.addEventListener("click", async () => {
      const moduleKey = button.dataset.dashboardModule;
      if (!moduleKey || !hasPermission(moduleKey, "view")) return;
      try {
        state.activeModule = moduleKey;
        renderModuleNav();
        await loadDataForModule(moduleKey);
        renderActiveModule();
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-dashboard-sales-view-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openSaleFromDashboard(button.dataset.dashboardSalesViewId);
    });
  });

  document.querySelectorAll("[data-dashboard-sales-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openSaleFromDashboard(button.dataset.dashboardSalesEditId);
    });
  });
}

async function openSaleFromDashboard(saleId) {
  const sale = (state.moduleData.sales || []).find((item) => item.id === saleId);
  if (!sale || !hasPermission("sales", "view")) return;

  state.salesDraft = hydrateSalesDraft(sale);
  state.openAccordionKey = "sales-form";
  state.activeModule = "sales";
  renderModuleNav();
  await renderActiveModule();
  document.querySelector("#sales-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildDashboardSnapshot() {
  const range = getDashboardDateRange();
  const previousRange = getPreviousDashboardDateRange(range);
  const sales = (state.moduleData.sales || []).map((sale) => ({
    sale,
    metadata: getSaleMetadata(sale),
  }));
  const purchases = (state.moduleData.purchases || []).map((purchase) => ({
    purchase,
    metadata: getPurchaseRequestMetadata(purchase),
  }));
  const payables = (state.moduleData.payables || []).map((payable) => ({
    payable,
    metadata: getPayableMetadata(payable),
  }));
  const production = (state.moduleData.production || []).map((order) => ({
    order,
    metadata: getProductionOrderMetadata(order),
    normalizedStatus: normalizeDashboardProductionStatus(order.status),
  }));
  const filteredSales = sales.filter(({ sale }) =>
    isDashboardRecordInRange(sale.sale_date || sale.created_at || sale.delivery_date, range)
  );
  const filteredPurchases = purchases.filter(({ purchase, metadata }) =>
    isDashboardRecordInRange(metadata.purchaseDetails.purchase_date || purchase.created_at, range)
  );
  const filteredPayables = payables.filter(({ payable, metadata }) =>
    isDashboardRecordInRange(metadata.due_date || payable.created_at, range)
  );
  const filteredProduction = production.filter(({ order }) =>
    isDashboardRecordInRange(order.planned_start || order.created_at || order.planned_end, range)
  );
  const previousRevenue = sales
    .filter(({ sale, metadata }) =>
      metadata.status === "finalized"
      && isDashboardRecordInRange(sale.sale_date || sale.created_at || sale.delivery_date, previousRange)
    )
    .reduce((total, entry) => total + Number(entry.metadata.total || 0), 0);
  const revenue = filteredSales
    .filter(({ metadata }) => metadata.status === "finalized")
    .reduce((total, entry) => total + Number(entry.metadata.total || 0), 0);
  const estimatedCosts = (filteredPayables.length ? filteredPayables : filteredPurchases)
    .filter(({ metadata }) => ["paid", "purchase_completed", "completed"].includes(metadata.status))
    .reduce((total, entry) => total + Number(entry.metadata.amount || entry.metadata.purchaseDetails?.total_amount || 0), 0);
  const pendingPayables = (filteredPayables.length ? filteredPayables : filteredPurchases)
    .filter(({ metadata }) => ["pending", "overdue", "in_analysis", "approved", "in_purchase", "purchase_completed"].includes(metadata.status))
    .reduce((total, entry) => total + Number(entry.metadata.amount || entry.metadata.purchaseDetails?.total_amount || 0), 0);
  const pendingReceivables = filteredSales
    .filter(({ metadata }) => metadata.status === "finalized")
    .reduce((total, entry) => total + Number(entry.metadata.total || 0), 0);
  const netProfit = revenue - estimatedCosts;
  const openOrdersCount = filteredSales.filter(({ sale, metadata }) => isDashboardSaleOpen(sale, metadata, production)).length;
  const activeProductionCount = filteredProduction.filter(({ normalizedStatus }) => normalizedStatus === "in_progress").length;
  const completedProduction = filteredProduction.filter(({ normalizedStatus }) => normalizedStatus === "completed");
  const growth = calculateDashboardGrowth(revenue, previousRevenue);
  const lowStockItems = (state.moduleData.products || [])
    .filter((item) => Number(item.current_stock || 0) <= Number(item.minimum_stock || 0))
    .map((item) => ({
      id: item.id,
      name: item.name || "-",
      unit: item.unit || "un",
      currentStock: Number(item.current_stock || 0),
      minimumStock: Number(item.minimum_stock || 0),
      level: Number(item.current_stock || 0) <= 0 ? "danger" : "warning",
    }))
    .sort((left, right) => left.currentStock - right.currentStock);
  const machineStoppedCount = (state.moduleData.machiningPieces || []).reduce((total, piece) => {
    const order = piece.latest_order || piece;
    const currentIndex = getCurrentMachiningStepIndex(order);
    const currentStep = order.steps?.[currentIndex];
    return total + (currentStep?.status === "Bloqueada" ? 1 : 0);
  }, 0);
  const delayedProduction = filteredProduction.filter(({ order, normalizedStatus }) =>
    normalizedStatus !== "completed"
    && order.planned_end
    && new Date(`${order.planned_end}T23:59:59`).getTime() < Date.now()
  );
  const stalledOrders = filteredProduction.filter(({ order, normalizedStatus }) =>
    normalizedStatus === "planned"
    && order.planned_start
    && new Date(`${order.planned_start}T00:00:00`).getTime() < Date.now() - (2 * 24 * 60 * 60 * 1000)
  );
  const alerts = [
    delayedProduction.length
      ? {
        tone: "danger",
        title: "Produção atrasada",
        description: `${delayedProduction.length} ordem(ns) estao fora do prazo previsto.`,
        actionLabel: "Resolver",
        module: "production",
      }
      : null,
    stalledOrders.length
      ? {
        tone: "warning",
        title: "Pedidos parados",
        description: `${stalledOrders.length} ordem(ns) seguem planejadas sem avancar.`,
        actionLabel: "Resolver",
        module: "production",
      }
      : null,
    lowStockItems.length
      ? {
        tone: lowStockItems.some((item) => item.level === "danger") ? "danger" : "warning",
        title: "Estoque critico",
        description: `${lowStockItems.length} item(ns) estao abaixo do mínimo configurado.`,
        actionLabel: "Ir para módulo",
        module: "inventory",
      }
      : null,
    machineStoppedCount
      ? {
        tone: "danger",
        title: "Máquina ou etapa parada",
        description: `${machineStoppedCount} item(ns) de usinagem possuem etapa bloqueada.`,
        actionLabel: "Resolver",
        module: "machining",
      }
      : null,
    pendingPayables
      ? {
        tone: "warning",
        title: "Pagamentos pendentes",
        description: filteredPayables.length
          ? `${formatCurrency(pendingPayables)} em contas a pagar aguardando baixa.`
          : `${formatCurrency(pendingPayables)} em compras aguardando fechamento.`,
        actionLabel: "Ir para módulo",
        module: filteredPayables.length ? "payables" : "purchases",
      }
      : null,
  ].filter(Boolean);
  const financeBuckets = buildDashboardBucketSeries(filteredSales, filteredPayables.length ? filteredPayables : filteredPurchases, range);
  const productionBuckets = buildDashboardProductionSeries(filteredProduction, range);
  const commercialBuckets = buildDashboardCommercialSeries(filteredSales, range);
  const averageProductionTime = completedProduction.length
    ? completedProduction.reduce((total, entry) => total + getDashboardProductionLeadTimeDays(entry.order), 0) / completedProduction.length
    : 0;

  return {
    rangeLabel: getDashboardRangeLabel(range),
    kpis: [
      {
        label: "Faturamento",
        value: formatCurrency(revenue),
        variation: `${growth >= 0 ? "↑" : "↓"} ${formatPercentMagnitude(growth)}`,
        note: `Periodo selecionado: ${getDashboardRangeLabel(range)}`,
        icon: "R$",
        tone: getMetricToneFromValue(growth),
      },
      {
        label: "Lucro liquido",
        value: formatCurrency(netProfit),
        variation: `${netProfit >= 0 ? "↑" : "↓"} ${formatCurrency(Math.abs(netProfit))}`,
        note: "Receita final menos custos registrados",
        icon: "LL",
        tone: netProfit >= 0 ? "green" : "red",
      },
      {
        label: "Pedidos em aberto",
        value: String(openOrdersCount),
        variation: openOrdersCount ? `↓ ${openOrdersCount} requer ação` : "↑ Operação sob controle",
        note: "Pedidos ainda não encerrados",
        icon: "PD",
        tone: openOrdersCount ? "amber" : "green",
      },
      {
        label: "Produção em andamento",
        value: String(activeProductionCount),
        variation: activeProductionCount ? `↑ ${activeProductionCount} ordem(ns) ativas` : "↓ Sem ordem em execucao",
        note: "Ordens rodando agora",
        icon: "PR",
        tone: activeProductionCount ? "blue" : "amber",
      },
      {
        label: "Crescimento",
        value: `${growth >= 0 ? "+" : "-"}${formatPercentMagnitude(growth)}`,
        variation: previousRevenue ? `${formatCurrency(previousRevenue)} no periodo anterior` : "Sem base anterior",
        note: "Evolucao do faturamento",
        icon: "GR",
        tone: getMetricToneFromValue(growth),
      },
    ],
    alerts,
    financeChart: {
      labels: financeBuckets.labels,
      series: [
        { name: "Faturamento", color: "#15803d", values: financeBuckets.revenue },
        { name: "Custo", color: "#b45309", values: financeBuckets.costs },
      ],
    },
    productionChart: {
      labels: productionBuckets.labels,
      series: [
        { name: "Peças produzidas", color: "#0f766e", values: productionBuckets.quantities },
      ],
    },
    commercialChart: {
      labels: commercialBuckets.labels,
      series: [
        { name: "Pedidos", color: "#1d4ed8", values: commercialBuckets.counts },
      ],
    },
    productionAverageTimeLabel: averageProductionTime ? `${averageProductionTime.toFixed(1)} dias` : "Sem base",
    productionCompletedCount: completedProduction.length,
    averageTicket: filteredSales.length
      ? filteredSales.reduce((total, entry) => total + Number(entry.metadata.total || 0), 0) / filteredSales.length
      : 0,
    openOrdersCount,
    pipeline: buildDashboardPipeline(filteredProduction),
    financialSummary: buildDashboardFinancialSummary({
      pendingPayables,
      pendingReceivables,
      revenue,
      estimatedCosts,
      sales,
      payables: filteredPayables.length ? filteredPayables : filteredPurchases,
    }),
    criticalStock: lowStockItems.slice(0, 6),
    recentOrders: filteredSales
      .sort((left, right) => new Date(right.sale.sale_date || right.sale.created_at || 0) - new Date(left.sale.sale_date || left.sale.created_at || 0))
      .slice(0, 6)
      .map(({ sale, metadata }) => ({
        id: sale.id,
        saleNumber: metadata.saleNumber || sale.sale_number || formatShortId(sale.id),
        customerName: sale.customer_name || "-",
        total: Number(metadata.total || 0),
        statusBadge: saleStatusCell(metadata.status),
        priority: getDashboardSalePriority(sale, production),
        date: sale.sale_date || String(sale.created_at || "").slice(0, 10),
      })),
  };
}

function renderStrategicKpiCard(card) {
  return `
    <article class="summary-card dashboard-kpi-card metric-${card.tone}">
      <div class="kpi-head">
        <span>${escapeHtml(card.label)}</span>
        <span class="kpi-icon kpi-${card.tone}">${escapeHtml(card.icon)}</span>
      </div>
      <strong>${card.value}</strong>
      <span class="dashboard-kpi-variation">${escapeHtml(card.variation)}</span>
      <small>${escapeHtml(card.note)}</small>
    </article>
  `;
}

function renderDashboardAlert(alert) {
  return `
    <article class="dashboard-alert-card ${alert.tone}">
      <div>
        <strong>${escapeHtml(alert.title)}</strong>
        <p class="muted">${escapeHtml(alert.description)}</p>
      </div>
      <button class="inline-button ${alert.tone === "danger" ? "danger-button" : ""}" type="button" data-dashboard-module="${alert.module}">
        ${escapeHtml(alert.actionLabel)}
      </button>
    </article>
  `;
}

function renderDashboardPipelineStage(stage) {
  return `
    <article class="dashboard-pipeline-stage ${stage.tone} ${stage.isBottleneck ? "is-bottleneck" : ""}">
      <div class="dashboard-pipeline-stage-top">
        <span>${escapeHtml(stage.label)}</span>
        ${stage.isBottleneck ? `<span class="status-chip status-pending">Gargalo</span>` : ""}
      </div>
      <strong>${stage.count}</strong>
      <small class="muted">${escapeHtml(stage.note)}</small>
    </article>
  `;
}

function renderDashboardBarChart({ labels = [], series = [], emptyLabel = "Sem dados." }) {
  const safeSeries = series.filter((item) => Array.isArray(item.values));
  const values = safeSeries.flatMap((item) => item.values);
  const maxValue = Math.max(...values, 0);

  if (!labels.length || !safeSeries.length || maxValue <= 0) {
    return `<div class="empty-state">${emptyLabel}</div>`;
  }

  const chartHeight = 108;
  const chartWidth = 100;
  const groupWidth = chartWidth / labels.length;
  const innerGap = safeSeries.length > 1 ? 1.2 : 0;
  const barWidth = Math.max(4, (groupWidth - 1.6 - innerGap) / safeSeries.length);

  const bars = labels.map((label, labelIndex) => {
    const baseX = labelIndex * groupWidth + 0.8;
    return safeSeries.map((serie, seriesIndex) => {
      const value = Number(serie.values[labelIndex] || 0);
      const height = maxValue ? (value / maxValue) * 82 : 0;
      const x = baseX + seriesIndex * (barWidth + innerGap);
      const y = 88 - height;
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}" rx="2.8" fill="${serie.color}" opacity="${seriesIndex === 0 ? "0.9" : "0.72"}"></rect>`;
    }).join("");
  }).join("");

  return `
    <div class="dashboard-chart-card">
      <div class="dashboard-chart-legend">
        ${safeSeries.map((serie) => `
          <span><i style="background:${serie.color}"></i>${escapeHtml(serie.name)}</span>
        `).join("")}
      </div>
      <svg class="dashboard-chart-svg" viewBox="0 0 ${chartWidth} ${chartHeight}" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="88.5" x2="${chartWidth}" y2="88.5" stroke="rgba(15,23,42,0.14)" stroke-width="0.7"></line>
        ${bars}
      </svg>
      <div class="dashboard-chart-labels">
        ${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}
      </div>
    </div>
  `;
}

function getDashboardDateRange() {
  const today = new Date();
  const end = endOfDashboardDay(today);

  if (state.dashboardRange === "today") {
    return {
      start: startOfDashboardDay(today),
      end,
    };
  }

  if (state.dashboardRange === "7d") {
    return {
      start: startOfDashboardDay(addDashboardDays(today, -6)),
      end,
    };
  }

  if (state.dashboardRange === "custom") {
    const from = state.dashboardCustomRange.from ? parseDashboardDate(state.dashboardCustomRange.from) : null;
    const to = state.dashboardCustomRange.to ? parseDashboardDate(state.dashboardCustomRange.to) : null;
    if (from && to) {
      return {
        start: startOfDashboardDay(from),
        end: endOfDashboardDay(to < from ? from : to),
      };
    }
  }

  return {
    start: startOfDashboardDay(addDashboardDays(today, -29)),
    end,
  };
}

function getPreviousDashboardDateRange(range) {
  const duration = Math.max(1, getDashboardDayDiff(range.start, range.end) + 1);
  const previousEnd = endOfDashboardDay(addDashboardDays(range.start, -1));
  return {
    start: startOfDashboardDay(addDashboardDays(previousEnd, -(duration - 1))),
    end: previousEnd,
  };
}

function getDashboardRangeLabel(range) {
  const dayCount = getDashboardDayDiff(range.start, range.end) + 1;
  if (dayCount <= 1) return "Hoje";
  if (dayCount === 7) return "Últimos 7 dias";
  if (dayCount === 30) return "Últimos 30 dias";
  return `${formatDate(range.start.toISOString().slice(0, 10))} ate ${formatDate(range.end.toISOString().slice(0, 10))}`;
}

function isDashboardRecordInRange(value, range) {
  if (!value) return false;
  const date = parseDashboardDate(value);
  if (!date) return false;
  return date.getTime() >= range.start.getTime() && date.getTime() <= range.end.getTime();
}

function parseDashboardDate(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return new Date(`${value}T12:00:00`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDashboardDay(value) {
  const date = parseDashboardDate(value) || new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDashboardDay(value) {
  const date = parseDashboardDate(value) || new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function addDashboardDays(value, days) {
  const date = parseDashboardDate(value) || new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function getDashboardDayDiff(start, end) {
  const diff = endOfDashboardDay(end).getTime() - startOfDashboardDay(start).getTime();
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

function getDateShiftedIso(isoDate, offsetDays) {
  return addDashboardDays(parseDashboardDate(isoDate), offsetDays).toISOString().slice(0, 10);
}

function calculateDashboardGrowth(currentValue, previousValue) {
  if (!previousValue) {
    return currentValue > 0 ? 100 : 0;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
}

function formatPercentMagnitude(value) {
  return `${Math.abs(Number(value || 0)).toFixed(1)}%`;
}

function getMetricToneFromValue(value) {
  if (value > 0) return "green";
  if (value < 0) return "red";
  return "amber";
}

function normalizeDashboardProductionStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (["completed", "concluída"].includes(normalized)) return "completed";
  if (["in_progress", "em produção", "qualidade"].includes(normalized)) return "in_progress";
  return "planned";
}

function isDashboardSaleOpen(sale, metadata, productionEntries) {
  if (metadata.status !== "finalized") return true;
  const linkedOrders = getDashboardLinkedProductionOrders(sale, productionEntries);
  return linkedOrders.some((entry) => entry.normalizedStatus !== "completed");
}

function getDashboardLinkedProductionOrders(sale, productionEntries) {
  const metadata = getSaleMetadata(sale);
  return productionEntries.filter(({ order }) =>
    order.sale_id === sale.id
    || (metadata.productionOrderIds || []).includes(order.id)
  );
}

function getDashboardSalePriority(sale, productionEntries) {
  const linkedOrders = getDashboardLinkedProductionOrders(sale, productionEntries);
  const priorities = linkedOrders.map(({ metadata }) => metadata.priority || "media");
  if (priorities.includes("urgente")) return "urgente";
  if (priorities.includes("alta")) return "alta";
  if (priorities.includes("media")) return "media";
  return priorities[0] || "baixa";
}

function buildDashboardBucketDefinitions(range, maxBuckets = 7) {
  const totalDays = Math.max(1, getDashboardDayDiff(range.start, range.end) + 1);
  const bucketCount = Math.min(maxBuckets, totalDays);
  const bucketSize = Math.ceil(totalDays / bucketCount);
  const buckets = [];

  for (let index = 0; index < bucketCount; index += 1) {
    const start = startOfDashboardDay(addDashboardDays(range.start, index * bucketSize));
    const tentativeEnd = endOfDashboardDay(addDashboardDays(start, bucketSize - 1));
    const end = tentativeEnd.getTime() > range.end.getTime() ? range.end : tentativeEnd;
    if (start.getTime() > range.end.getTime()) break;
    buckets.push({
      start,
      end,
      label: bucketSize === 1
        ? formatDate(start.toISOString().slice(0, 10))
        : `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`,
    });
  }

  return buckets;
}

function findDashboardBucketIndex(dateValue, buckets) {
  const date = parseDashboardDate(dateValue);
  if (!date) return -1;
  return buckets.findIndex((bucket) => date.getTime() >= bucket.start.getTime() && date.getTime() <= bucket.end.getTime());
}

function buildDashboardBucketSeries(filteredSales, filteredPayables, range) {
  const buckets = buildDashboardBucketDefinitions(range);
  const revenue = buckets.map(() => 0);
  const costs = buckets.map(() => 0);

  filteredSales.forEach(({ sale, metadata }) => {
    if (metadata.status !== "finalized") return;
    const index = findDashboardBucketIndex(sale.sale_date || sale.created_at || sale.delivery_date, buckets);
    if (index >= 0) {
      revenue[index] += Number(metadata.total || 0);
    }
  });

  filteredPayables.forEach(({ purchase, payable, metadata }) => {
    const index = findDashboardBucketIndex(metadata.due_date || metadata.purchaseDetails?.purchase_date || payable?.created_at || purchase?.created_at, buckets);
    if (index >= 0) {
      costs[index] += Number(metadata.amount || metadata.purchaseDetails?.total_amount || 0);
    }
  });

  return {
    labels: buckets.map((bucket) => bucket.label),
    revenue,
    costs,
  };
}

function buildDashboardProductionSeries(filteredProduction, range) {
  const buckets = buildDashboardBucketDefinitions(range);
  const quantities = buckets.map(() => 0);

  filteredProduction.forEach(({ order, normalizedStatus }) => {
    if (normalizedStatus !== "completed") return;
    const index = findDashboardBucketIndex(order.planned_end || order.created_at || order.planned_start, buckets);
    if (index >= 0) {
      quantities[index] += Number(order.batch_size || 0);
    }
  });

  return {
    labels: buckets.map((bucket) => bucket.label),
    quantities,
  };
}

function buildDashboardCommercialSeries(filteredSales, range) {
  const buckets = buildDashboardBucketDefinitions(range);
  const counts = buckets.map(() => 0);

  filteredSales.forEach(({ sale }) => {
    const index = findDashboardBucketIndex(sale.sale_date || sale.created_at || sale.delivery_date, buckets);
    if (index >= 0) {
      counts[index] += 1;
    }
  });

  return {
    labels: buckets.map((bucket) => bucket.label),
    counts,
  };
}

function getDashboardProductionLeadTimeDays(order) {
  const start = parseDashboardDate(order.planned_start || order.created_at);
  const end = parseDashboardDate(order.planned_end || order.completed_at || order.created_at);
  if (!start || !end) return 0;
  return Math.max(1, getDashboardDayDiff(start, end) + 1);
}

function buildDashboardPipeline(filteredProduction) {
  const stages = [
    { key: "corte", label: "Corte", count: 0, tone: "amber", note: "Entrada e preparação" },
    { key: "usinagem", label: "Usinagem", count: 0, tone: "blue", note: "Execucao em máquina" },
    { key: "montagem", label: "Montagem", count: 0, tone: "green", note: "Acabamento e montagem" },
    { key: "finalizado", label: "Finalizado", count: 0, tone: "green", note: "Entregue internamente" },
  ];

  filteredProduction.forEach(({ order, normalizedStatus }) => {
    const currentStage = getDashboardProductionStage(order, normalizedStatus);
    const stage = stages.find((item) => item.key === currentStage);
    if (stage) {
      stage.count += Number(order.batch_size || 0);
    }
  });

  const activeStages = stages.filter((item) => item.key !== "finalizado");
  const bottleneck = activeStages.reduce((selected, current) => {
    if (!selected) return current;
    return current.count > selected.count ? current : selected;
  }, null);

  return stages.map((stage) => ({
    ...stage,
    isBottleneck: Boolean(bottleneck && stage.key === bottleneck.key && stage.count > 0),
  }));
}

function getDashboardProductionStage(order, normalizedStatus) {
  if (normalizedStatus === "completed") return "finalizado";
  const steps = Array.isArray(order.steps) ? order.steps : [];
  const liveIndex = steps.findIndex((step) => ["Pendente", "Em Produção", "Qualidade"].includes(step.status));
  if (liveIndex === 0) return "corte";
  if (liveIndex >= 2) return "montagem";
  if (liveIndex === 1) return "usinagem";
  return normalizedStatus === "in_progress" ? "usinagem" : "corte";
}

function buildDashboardFinancialSummary({ pendingPayables, pendingReceivables, revenue, estimatedCosts, sales, payables }) {
  const forecast7 = buildDashboardForecast(sales, payables, 7);
  const forecast30 = buildDashboardForecast(sales, payables, 30);
  return [
    {
      label: "Contas a pagar",
      value: pendingPayables,
      note: "Títulos financeiros pendentes no período",
      tone: pendingPayables ? "amber" : "green",
      isCurrency: true,
    },
    {
      label: "Contas a receber",
      value: pendingReceivables,
      note: "Vendas finalizadas no periodo",
      tone: pendingReceivables ? "green" : "amber",
      isCurrency: true,
    },
    {
      label: "Saldo atual",
      value: revenue - estimatedCosts,
      note: "Resultado operacional registrado",
      tone: revenue - estimatedCosts >= 0 ? "green" : "red",
      isCurrency: true,
    },
    {
      label: "Previsao 7 dias",
      value: forecast7,
      note: `Previsao 30 dias: ${formatCurrency(forecast30)}`,
      tone: forecast7 >= 0 ? "green" : "red",
      isCurrency: true,
    },
  ];
}

function buildDashboardForecast(sales, payables, daysAhead) {
  const now = new Date();
  const end = endOfDashboardDay(addDashboardDays(now, daysAhead));
  const projectedRevenue = sales.reduce((total, { sale, metadata }) => {
    if (metadata.status !== "finalized") return total;
    const date = parseDashboardDate(sale.delivery_date || sale.sale_date || sale.created_at);
    if (!date || date.getTime() < now.getTime() || date.getTime() > end.getTime()) return total;
    return total + Number(metadata.total || 0);
  }, 0);
  const projectedCosts = payables.reduce((total, { purchase, payable, metadata }) => {
    if (metadata.status === "cancelled" || metadata.status === "paid") return total;
    const date = parseDashboardDate(metadata.due_date || metadata.purchaseDetails?.purchase_date || payable?.created_at || purchase?.created_at);
    if (!date || date.getTime() < now.getTime() || date.getTime() > end.getTime()) return total;
    return total + Number(metadata.amount || metadata.purchaseDetails?.total_amount || 0);
  }, 0);
  return projectedRevenue - projectedCosts;
}

function renderVpsControlModule() {
  if (!isTiUser()) {
    return noPermissionTemplate("Acesso não autorizado");
  }

  const summary = state.vpsControl.summary || {};
  const services = state.vpsControl.services || [];
  const logs = state.vpsControl.logs || [];
  const applications = state.vpsControl.applications || [];
  const security = state.vpsControl.security || {};
  const backups = state.vpsControl.backups || [];
  const database = state.vpsControl.database || {};
  const databaseTables = Array.isArray(database.tables) ? database.tables : [];
  const filteredDatabaseTables = databaseTables.filter((table) =>
    !state.vpsControl.databaseTableFilter
    || String(table.table_name || "").toLowerCase().includes(state.vpsControl.databaseTableFilter.toLowerCase())
    || String(table.schema_name || "").toLowerCase().includes(state.vpsControl.databaseTableFilter.toLowerCase())
  );
  const databaseDetail = state.vpsControl.databaseSelectedTableDetail || {};
  const domains = state.vpsControl.domains || [];
  const audit = state.vpsControl.audit || [];
  const criticalLogs = logs.filter((item) => item.is_critical).length;
  const onlineServices = services.filter((item) => item.status === "online").length;
  const healthyDomains = domains.filter((item) => item.ssl_status === "valid" || item.ssl_status === "healthy").length;
  const supabaseConfigured = hasSupabaseConfig();

  return `
    <section class="module-panel vps-module">
      <div class="module-head vps-module-head">
        <div>
          <p class="eyebrow muted">Infraestrutura restrita ao TI</p>
          <h3>Controle da VPS</h3>
          <p class="muted">Monitoramento, ações operacionais, logs, segurança, backup, banco e auditoria em uma única tela.</p>
        </div>
        <div class="module-head-actions">
          <button class="ghost-button secondary-surface-button" type="button" data-vps-refresh>Atualizar painel</button>
          <button class="primary-button" type="button" data-vps-action="generate_backup" data-vps-target-type="backup" data-vps-target-name="manual" data-vps-confirm="Gerar backup manual agora?">Gerar Backup Manual</button>
        </div>
      </div>

      <div class="summary-grid vps-summary-grid">
        ${renderKpiCard({ label: "Supabase", value: supabaseConfigured ? "Conectado" : "Não configurado", note: supabaseConfigured ? "Conexão principal do sistema ativa" : "Verifique supabase/config.js", icon: "SB", tone: supabaseConfigured ? "green" : "red" })}
        ${renderKpiCard({ label: "Status Geral", value: formatVpsStatusLabel(summary.server_status), note: "Saude consolidada da VPS", icon: "▣", tone: summary.server_status === "healthy" ? "green" : "red" })}
        ${renderKpiCard({ label: "CPU", value: `${formatPercent(summary.cpu_usage)}%`, note: "Uso atual do processador", icon: "CPU", tone: getMetricTone(summary.cpu_usage, 75, 90) })}
        ${renderKpiCard({ label: "Memoria", value: `${formatPercent(summary.memory_usage)}%`, note: "Consumo de RAM", icon: "RAM", tone: getMetricTone(summary.memory_usage, 75, 90) })}
        ${renderKpiCard({ label: "Disco", value: `${formatPercent(summary.disk_usage)}%`, note: "Ocupação do disco raiz", icon: "SSD", tone: getMetricTone(summary.disk_usage, 80, 92) })}
        ${renderKpiCard({ label: "Uptime", value: escapeHtml(summary.uptime_label || "-"), note: "Tempo em operação", icon: "UP", tone: "blue" })}
        ${renderKpiCard({ label: "IP", value: escapeHtml(summary.server_ip || "-"), note: "Endereço principal", icon: "IP", tone: "blue" })}
        ${renderKpiCard({ label: "Sistema", value: escapeHtml(summary.operating_system || "-"), note: "Sistema operacional da VPS", icon: "OS", tone: "blue" })}
        ${renderKpiCard({ label: "Última Atualização", value: formatDateTime(summary.updated_at), note: "Último snapshot recebido", icon: "CLK", tone: "blue" })}
      </div>

      <div class="vps-layout">
        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Status dos Serviços</h4>
              <p class="muted">${onlineServices}/${services.length || 0} serviços principais online.</p>
            </div>
          </div>
          <div class="vps-service-grid">
            ${services.length ? services.map(renderVpsServiceCard).join("") : `<div class="empty-state">Nenhum serviço monitorado.</div>`}
          </div>
        </section>

        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Logs do Servidor e da Aplicação</h4>
              <p class="muted">${criticalLogs} ocorrencia(s) critica(s) na consulta atual.</p>
            </div>
          </div>
          <form class="vps-log-filters" id="vps-log-filters-form">
            <input type="search" name="search" placeholder="Pesquisar log" value="${escapeHtml(state.vpsControl.logFilters.search)}" />
            <select name="source">
              ${renderOptionList(["all", "system", "nginx", "backend", "pm2", "database", "agent"], state.vpsControl.logFilters.source)}
            </select>
            <select name="level">
              ${renderOptionList(["all", "info", "warning", "error", "critical"], state.vpsControl.logFilters.level)}
            </select>
            <input type="date" name="date_from" value="${escapeHtml(state.vpsControl.logFilters.dateFrom)}" />
            <input type="date" name="date_to" value="${escapeHtml(state.vpsControl.logFilters.dateTo)}" />
            <button class="secondary-button" type="submit">Filtrar</button>
          </form>
          <div class="vps-log-list">
            ${logs.length ? logs.map(renderVpsLogItem).join("") : `<div class="empty-state">Nenhum log encontrado.</div>`}
          </div>
        </section>

        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Aplicações Hospedadas</h4>
              <p class="muted">ERP, API e outros projetos mapeados na VPS.</p>
            </div>
          </div>
          <div class="vps-application-grid">
            ${applications.length ? applications.map(renderVpsApplicationCard).join("") : `<div class="empty-state">Nenhuma aplicação cadastrada.</div>`}
          </div>
        </section>

        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Segurança da VPS</h4>
              <p class="muted">Firewall, portas, acessos recentes, IPs suspeitos e protecao SSH.</p>
            </div>
          </div>
          <div class="vps-security-grid">
            <article class="card">
              <strong>Firewall</strong>
              <p class="muted">${security.firewall_active ? "Ativo" : "Inativo"}</p>
              <div class="permission-tag-list">${(security.alerts || []).length ? security.alerts.map(renderVpsAlertTag).join("") : `<span class="permission-tag">Sem alertas imediatos</span>`}</div>
            </article>
            <article class="card">
              <strong>Portas Abertas</strong>
              <div class="permission-tag-list">${(security.open_ports || []).length ? security.open_ports.map((item) => `<span class="permission-tag">${escapeHtml(item.port || item.socket || "-")}</span>`).join("") : `<span class="muted">Nenhuma porta registrada.</span>`}</div>
            </article>
            <article class="card">
              <strong>IPs Suspeitos</strong>
              <div class="permission-tag-list">${(security.suspicious_ips || []).length ? security.suspicious_ips.map((item) => `<span class="permission-tag danger-tag">${escapeHtml(item.ip || "-")}</span>`).join("") : `<span class="muted">Nenhum IP suspeito no snapshot.</span>`}</div>
            </article>
            <article class="card">
              <strong>Usuários SSH</strong>
              <div class="permission-tag-list">${(security.ssh_users || []).length ? security.ssh_users.map((item) => `<span class="permission-tag">${escapeHtml(item.user || "-")}</span>`).join("") : `<span class="muted">Sem usuários listados.</span>`}</div>
            </article>
          </div>
          <div class="vps-list-block">
            <h5>Tentativas recentes de acesso</h5>
            ${(security.recent_access_attempts || []).length ? `<ul class="vps-inline-list">${security.recent_access_attempts.map((item) => `<li>${escapeHtml(item.entry || "-")}</li>`).join("")}</ul>` : `<div class="empty-state compact-empty">Nenhuma tentativa recente registrada.</div>`}
          </div>
        </section>

        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Backups</h4>
              <p class="muted">Histórico, status atual e operações manuais com confirmação.</p>
            </div>
            <div class="module-head-actions">
              <button class="ghost-button" type="button" data-vps-action="generate_backup" data-vps-target-type="backup" data-vps-target-name="database" data-vps-payload='{"scope":"database"}' data-vps-confirm="Gerar backup manual do banco agora?">Backup do Banco</button>
              <button class="ghost-button danger-button" type="button" data-vps-action="restore_backup" data-vps-target-type="backup" data-vps-target-name="restore" data-vps-confirm="Restaurar backup manualmente? Confirme somente se souber o impacto.">Restaurar Backup</button>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Arquivo</th>
                  <th>Inicio</th>
                  <th>Fim</th>
                </tr>
              </thead>
              <tbody>
                ${backups.length ? backups.map((item) => `
                  <tr>
                    <td>${escapeHtml(item.backup_type || "-")}</td>
                    <td>${renderVpsHealthBadge(item.status)}</td>
                    <td>${escapeHtml(item.artifact_name || "-")}</td>
                    <td>${formatDateTime(item.started_at)}</td>
                    <td>${formatDateTime(item.finished_at)}</td>
                  </tr>
                `).join("") : `<tr><td colspan="5">Nenhum backup registrado.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>

        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Banco de Dados</h4>
              <p class="muted">Status operacional, últimas referências de backup, ações do banco e inventário das tabelas.</p>
            </div>
            <div class="module-head-actions">
              <button class="ghost-button" type="button" data-vps-action="restart_database" data-vps-target-type="database" data-vps-target-name="${escapeHtml(database.engine || "database")}">Reiniciar Banco</button>
              <button class="secondary-button" type="button" data-vps-action="generate_backup" data-vps-target-type="backup" data-vps-target-name="database" data-vps-payload='{"scope":"database"}' data-vps-confirm="Gerar backup manual do banco agora?">Backup Manual</button>
            </div>
          </div>
          <div class="summary-grid vps-mini-grid">
            ${renderKpiCard({ label: "Engine", value: escapeHtml(database.engine || "-"), note: "Motor em uso", icon: "DB", tone: "blue" })}
            ${renderKpiCard({ label: "Status", value: formatVpsStatusLabel(database.status), note: "Disponibilidade atual", icon: "SQL", tone: database.status === "online" ? "green" : "red" })}
            ${renderKpiCard({ label: "Banco", value: escapeHtml(database.database_name || "-"), note: "Base principal", icon: "NAM", tone: "blue" })}
            ${renderKpiCard({ label: "Conexoes", value: escapeHtml(database.connection_count ?? "-"), note: "Conexoes abertas", icon: "CON", tone: "blue" })}
          </div>
          <div class="vps-list-block">
            <h5>Tabelas do banco</h5>
            <p class="muted">${databaseTables.length} tabela(s) monitorada(s) no schema public.</p>
            <div class="table-actions single-search-row">
              <label>
                Buscar tabela...
                <input type="search" id="vps-database-table-filter" placeholder="Ex.: products" value="${escapeHtml(state.vpsControl.databaseTableFilter)}" />
              </label>
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Schema</th>
                    <th>Tabela</th>
                    <th>Linhas</th>
                    <th>Mortas</th>
                    <th>Tamanho</th>
                    <th>Saude</th>
                    <th>Ult. Analise</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    databaseTables.length
                      ? filteredDatabaseTables.map((table) => `
                        <tr class="${state.vpsControl.databaseSelectedTable === table.table_name ? "audit-log-row-selected" : ""}">
                          <td>${escapeHtml(table.schema_name || "-")}</td>
                          <td><button class="inline-button" type="button" data-vps-database-table="${escapeHtml(table.table_name || "")}">${escapeHtml(table.table_name || "-")}</button></td>
                          <td>${escapeHtml(String(table.live_rows_estimate ?? "-"))}</td>
                          <td>${escapeHtml(String(table.dead_rows_estimate ?? "-"))}</td>
                          <td>${escapeHtml(table.total_size || "-")}</td>
                          <td>${renderVpsHealthBadge(table.health_status)}</td>
                          <td>${formatDateTime(table.last_autoanalyze || table.last_analyze)}</td>
                        </tr>
                      `).join("")
                      : `<tr><td colspan="7">Nenhuma tabela monitorada.</td></tr>`
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div class="vps-list-block">
            <h5>Detalhes da tabela ${escapeHtml(state.vpsControl.databaseSelectedTable || "-")}</h5>
            ${
              databaseDetail?.table_name
                ? `
                  <div class="summary-grid vps-mini-grid">
                    ${renderKpiCard({ label: "Schema", value: escapeHtml(databaseDetail.schema_name || "-"), note: "Origem da tabela", icon: "SCH", tone: "blue" })}
                    ${renderKpiCard({ label: "Colunas", value: databaseDetail.columns?.length || 0, note: "Estrutura atual", icon: "COL", tone: "blue" })}
                    ${renderKpiCard({ label: "Indices", value: databaseDetail.indexes?.length || 0, note: "Indices detectados", icon: "IDX", tone: "green" })}
                    ${renderKpiCard({ label: "Tamanho", value: escapeHtml(databaseDetail.total_size || "-"), note: "Tamanho total", icon: "SIZ", tone: "amber" })}
                  </div>
                  <div class="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Coluna</th>
                          <th>Tipo</th>
                          <th>Nulo</th>
                          <th>Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${
                          (databaseDetail.columns || []).map((column) => `
                            <tr>
                              <td>${escapeHtml(column.column_name || "-")}</td>
                              <td>${escapeHtml(column.data_type || "-")}</td>
                              <td>${column.is_nullable ? "Sim" : "Não"}</td>
                              <td>${escapeHtml(column.column_default || "-")}</td>
                            </tr>
                          `).join("") || `<tr><td colspan="4">Nenhuma coluna encontrada.</td></tr>`
                        }
                      </tbody>
                    </table>
                  </div>
                  <div class="vps-list-block">
                    <h5>Indices</h5>
                    ${
                      (databaseDetail.indexes || []).length
                        ? `<ul class="vps-inline-list">${databaseDetail.indexes.map((index) => `<li>${escapeHtml(index.index_name || "-")} • ${escapeHtml(index.index_definition || "-")}</li>`).join("")}</ul>`
                        : `<div class="empty-state compact-empty">Nenhum indice listado.</div>`
                    }
                  </div>
                `
                : `<div class="empty-state compact-empty">Selecione uma tabela para ver colunas e indices.</div>`
            }
          </div>
        </section>

        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Dominio, SSL e Acesso Web</h4>
              <p class="muted">${healthyDomains}/${domains.length || 0} dominios com SSL saudavel.</p>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Dominio</th>
                  <th>Tipo</th>
                  <th>SSL</th>
                  <th>Validade</th>
                  <th>Proxy</th>
                </tr>
              </thead>
              <tbody>
                ${domains.length ? domains.map((item) => `
                  <tr>
                    <td>${escapeHtml(item.domain || "-")}</td>
                    <td>${escapeHtml(item.domain_type || "-")}</td>
                    <td>${renderVpsHealthBadge(item.ssl_status)}</td>
                    <td>${formatDateTime(item.ssl_valid_until)}</td>
                    <td>${item.reverse_proxy_active ? "Ativo" : "Inativo"}</td>
                  </tr>
                `).join("") : `<tr><td colspan="5">Nenhum dominio monitorado.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>

        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Auditoria</h4>
              <p class="muted">Histórico de ações executadas pelo TI nesta área.</p>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Serviço</th>
                  <th>IP</th>
                  <th>Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                ${audit.length ? audit.map((item) => `
                  <tr>
                    <td>${escapeHtml(item.actor_name || "-")}</td>
                    <td>${escapeHtml(item.action || "-")}</td>
                    <td>${escapeHtml(item.service_affected || item.target_name || "-")}</td>
                    <td>${escapeHtml(item.origin_ip || "-")}</td>
                    <td>${formatDateTime(item.created_at)}</td>
                  </tr>
                `).join("") : `<tr><td colspan="5">Nenhuma ação auditada.</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderVpsServiceCard(service) {
  return `
    <article class="permission-role-card vps-service-card">
      <div class="permission-role-card-head">
        <div>
          <h4>${escapeHtml(service.service_name || "-")}</h4>
          <p class="muted">Tempo em execucao: ${escapeHtml(service.uptime_label || "-")}</p>
        </div>
        ${renderVpsHealthBadge(service.status)}
      </div>
      <div class="form-actions-row">
        <button class="inline-button" type="button" data-vps-action="start" data-vps-target-type="service" data-vps-target-name="${escapeHtml(service.service_name || "")}">Iniciar</button>
        <button class="inline-button danger-button" type="button" data-vps-action="stop" data-vps-target-type="service" data-vps-target-name="${escapeHtml(service.service_name || "")}">Parar</button>
        <button class="inline-button" type="button" data-vps-action="restart" data-vps-target-type="service" data-vps-target-name="${escapeHtml(service.service_name || "")}">Reiniciar</button>
      </div>
    </article>
  `;
}

function renderVpsApplicationCard(app) {
  return `
    <article class="permission-role-card vps-application-card">
      <div class="permission-role-card-head">
        <div>
          <h4>${escapeHtml(app.app_name || "-")}</h4>
          <p class="muted">${escapeHtml(app.domain || "Sem dominio")} · Porta ${escapeHtml(app.port || "-")}</p>
        </div>
        ${renderVpsHealthBadge(app.status)}
      </div>
      <p class="muted">Pasta: ${escapeHtml(app.project_path || "-")}</p>
      <p class="muted">Última atualização: ${formatDateTime(app.last_updated_at)}</p>
      <div class="form-actions-row">
        <button class="inline-button" type="button" data-vps-action="restart_application" data-vps-target-type="application" data-vps-target-name="${escapeHtml(app.app_name || "")}">Reiniciar Aplicação</button>
      </div>
    </article>
  `;
}

function renderVpsLogItem(log) {
  return `
    <article class="vps-log-item ${log.is_critical ? "is-critical" : ""}">
      <div class="vps-log-item-head">
        <strong>${escapeHtml(log.summary || "-")}</strong>
        ${renderVpsHealthBadge(log.is_critical ? "critical" : log.log_level)}
      </div>
      <p class="muted">${escapeHtml(log.source || "-")} · ${formatDateTime(log.occurred_at)}</p>
      <pre>${escapeHtml(log.message || "-")}</pre>
    </article>
  `;
}

function renderVpsAlertTag(alert) {
  const className = alert.level === "danger" ? "permission-tag danger-tag" : "permission-tag warning-tag";
  return `<span class="${className}">${escapeHtml(alert.message || "-")}</span>`;
}

function renderVpsHealthBadge(status) {
  const normalized = String(status || "unknown").toLowerCase();
  const className = normalized === "online" || normalized === "healthy" || normalized === "valid" || normalized === "completed"
    ? "status-completed"
    : normalized === "warning" || normalized === "alert" || normalized === "pending"
      ? "status-planned"
      : "status-cancelled";
  return `<span class="status-chip ${className}">${formatVpsStatusLabel(normalized)}</span>`;
}

function renderOptionList(options, selectedValue) {
  return options
    .map((option) => `<option value="${option}" ${option === selectedValue ? "selected" : ""}>${option === "all" ? "Todos" : escapeHtml(option)}</option>`)
    .join("");
}

function formatVpsStatusLabel(status) {
  const mapping = {
    healthy: "Saudavel",
    online: "Online",
    offline: "Offline",
    alert: "Alerta",
    valid: "Valido",
    critical: "Critico",
    warning: "Alerta",
    error: "Erro",
    pending: "Pendente",
    completed: "Concluido",
    unknown: "Indefinido",
  };
  return mapping[String(status || "unknown").toLowerCase()] || escapeHtml(String(status || "-"));
}

function getMetricTone(value, warningThreshold, dangerThreshold) {
  const numeric = Number(value || 0);
  if (numeric >= dangerThreshold) return "red";
  if (numeric >= warningThreshold) return "amber";
  return "green";
}

function formatPercent(value) {
  return Number(value || 0).toFixed(1);
}

function renderPermissionsModule() {
  if (!isPermissionsAdmin()) {
    return noPermissionTemplate("Você não tem permissão para acessar esta área.");
  }

  const users = state.moduleData.users || [];
  const roles = state.permissionRoles || [];
  const isRoleFormOpen = state.openAccordionKey === "permission-role-form";
  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = users.filter((user) => !user.is_active).length;
  const criticalUsers = users.filter((user) => isPermissionsAdminRole(user.role)).length;

  return `
    <section class="module-panel permissions-module">
      <div class="module-head permissions-hero-head">
        <div>
          <p class="eyebrow muted">Segurança e governanca</p>
          <h3>Gerenciamento de Permissões</h3>
          <p class="muted">Configure papeis, permissões e funcionários</p>
        </div>
        <div class="module-head-actions">
          <button class="secondary-button" type="button" data-open-employee-modal>Cadastrar Funcionário</button>
          <button class="primary-button" type="button" data-new-permission-role>+ Novo Papel</button>
        </div>
      </div>

      <div class="summary-grid permissions-summary-grid">
        ${renderKpiCard({ label: "Papeis de Permissão", value: roles.length, note: "Perfis ativos no ERP", icon: "◩", tone: "blue" })}
        ${renderKpiCard({ label: "Funcionários Ativos", value: activeUsers, note: "Usuários habilitados para operar", icon: "◎", tone: "green" })}
        ${renderKpiCard({ label: "Acessos Críticos", value: criticalUsers, note: "TI e ADMINISTRADOR", icon: "◪", tone: "amber" })}
        ${renderKpiCard({ label: "Funcionários Inativos", value: inactiveUsers, note: inactiveUsers ? "Usuários desativados no cadastro" : "Nenhum registro inativo", icon: "◫", tone: "red" })}
      </div>

      <div class="permissions-layout">
        ${
          isRoleFormOpen
            ? `
              <section class="module-subpanel permission-role-form-panel">
                <div class="module-head compact-head">
                  <div>
                    <p class="eyebrow muted">Cadastro de papel</p>
                    <h3>${state.permissionRoleDraft.id ? "Editar Papel de Permissão" : "Novo Papel de Permissão"}</h3>
                  </div>
                </div>
                <form id="permission-role-form" class="permissions-role-form">
                  <input type="hidden" name="role_id" value="${escapeHtml(state.permissionRoleDraft.id)}" />
                  <label>
                    Nome do Papel *
                    <input type="text" name="name" value="${escapeHtml(state.permissionRoleDraft.name)}" placeholder="Ex.: VENDEDOR" required />
                  </label>
                  <label>
                    Descrição
                    <textarea name="description" placeholder="Resumo do papel e do escopo operacional.">${escapeHtml(state.permissionRoleDraft.description || "")}</textarea>
                  </label>
                  <div class="permission-module-grid">
                    ${renderPermissionRolePermissionGrid(state.permissionRoleDraft)}
                  </div>
                  <div class="form-actions-row">
                    <button class="ghost-button" type="button" data-cancel-permission-role>Cancelar</button>
                    <button class="primary-button" type="submit">Salvar</button>
                  </div>
                </form>
              </section>
            `
            : ""
        }

        <section class="module-subpanel">
          <div class="module-head compact-head">
            <div>
              <p class="eyebrow muted">Papeis existentes</p>
              <h3>Lista de Papeis</h3>
            </div>
          </div>
          <div class="permission-role-card-list">
            ${roles.length ? roles.map(renderPermissionRoleCard).join("") : `<div class="empty-state compact-empty">Nenhum papel cadastrado.</div>`}
          </div>
        </section>
      </div>

      <section class="module-subpanel">
        <div class="module-head compact-head">
          <div>
            <p class="eyebrow muted">Equipe</p>
            <h3>Funcionários Cadastrados</h3>
          </div>
        </div>
        ${
          users.length
            ? `
              <div class="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Funcionário</th>
                      <th>Código</th>
                      <th>Email</th>
                      <th>Departamento</th>
                      <th>Status</th>
                      <th>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${users.map(renderPermissionUserRow).join("")}
                  </tbody>
                </table>
              </div>
            `
            : `<div class="empty-state">Nenhum funcionário cadastrado. Clique em "Cadastrar Funcionário" para começar.</div>`
        }
      </section>

      <section class="module-subpanel">
        <div class="module-head compact-head">
          <div>
            <p class="eyebrow muted">Vinculos de acesso</p>
            <h3>Atribuir Permissões a Usuários</h3>
          </div>
        </div>
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Email</th>
                <th>Departamento</th>
                <th>Papel de Permissão</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              ${
                users.length
                  ? users.map(renderPermissionAssignmentRow).join("")
                  : `<tr><td colspan="5"><div class="empty-state">Nenhum usuário disponível.</div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>

      ${state.employeeModalOpen ? renderEmployeeModal() : ""}
    </section>
  `;
}

function renderPermissionRolePermissionGrid(roleDraft) {
  const normalizedPermissions = normalizeRolePermissions(roleDraft.permissions, roleDraft.name);
  return normalizedPermissions.map((permission) => {
    const module = MODULES.find((item) => item.key === permission.module_key);
    const normalizedRoleName = normalizePermissionRoleName(roleDraft.name);
    const lockedPermissions = permission.module_key === "permissions"
      && !["TI", "ADMINISTRADOR"].includes(normalizedRoleName);
    const lockedVpsModule = permission.module_key === "vps"
      && normalizedRoleName !== "TI";
    const lockedDashboardEdit = permission.module_key === "dashboard"
      && !["TI", "ADMINISTRADOR"].includes(normalizedRoleName);
    return `
      <article class="permission-toggle-card ${(lockedPermissions || lockedVpsModule) ? "is-locked" : ""}">
        <div>
          <strong>${module?.label || permission.module_key}</strong>
          <p class="muted">${
            permission.module_key === "permissions"
              ? "Restrito a TI e ADMINISTRADOR"
              : permission.module_key === "vps"
                ? "Restrito exclusivamente ao perfil TI"
              : permission.module_key === "dashboard" && lockedDashboardEdit
                ? "Perfis operacionais podem visualizar, mas não editar o dashboard"
                : "Controle de leitura e alteração"
          }</p>
        </div>
        <label class="permission-switch">
          <span>Ver</span>
          <input type="checkbox" data-role-module="${permission.module_key}" data-role-permission-type="view" ${permission.can_view ? "checked" : ""} ${(lockedPermissions || lockedVpsModule) ? "disabled" : ""} />
        </label>
        <label class="permission-switch">
          <span>Editar</span>
          <input type="checkbox" data-role-module="${permission.module_key}" data-role-permission-type="edit" ${permission.can_edit ? "checked" : ""} ${(lockedPermissions || lockedVpsModule || lockedDashboardEdit) ? "disabled" : ""} />
        </label>
      </article>
    `;
  }).join("");
}

function renderPermissionRoleCard(role) {
  const activeTags = normalizeRolePermissions(role.permissions, role.name)
    .filter((permission) => permission.can_view || permission.can_edit)
    .map((permission) => {
      const module = MODULES.find((item) => item.key === permission.module_key);
      return `<span class="permission-tag">${module?.label || permission.module_key} (${permission.can_edit ? "editar" : "ver"})</span>`;
    })
    .join("");

  return `
    <article class="permission-role-card">
      <div class="permission-role-card-head">
        <div>
          <h4>${escapeHtml(role.name)}</h4>
          <p class="muted">${escapeHtml(role.description || "Sem descrição cadastrada.")}</p>
        </div>
        ${role.is_system ? `<span class="status-chip chip-blue">Sistema</span>` : ""}
      </div>
      <div class="permission-tag-list">
        ${activeTags || `<span class="muted">Nenhuma permissão marcada.</span>`}
      </div>
      <div class="form-actions-row">
        <button class="inline-button" type="button" data-edit-permission-role="${role.id}">Editar</button>
        <button class="inline-button danger-button" type="button" data-delete-permission-role="${role.id}">Excluir</button>
      </div>
    </article>
  `;
}

function renderPermissionUserRow(user) {
  return `
    <tr>
      <td>
        <strong>${escapeHtml(user.full_name)}</strong>
        <div class="table-inline-copy muted">${escapeHtml(user.permission_role_name || "Sem papel de permissão")}</div>
      </td>
      <td>${escapeHtml(user.login_code || "-")}</td>
      <td>${escapeHtml(user.email || "-")}</td>
      <td>${escapeHtml(formatStaffRole(user.department || "-"))}</td>
      <td>${user.is_active ? `<span class="status-chip chip-green">Ativo</span>` : `<span class="status-chip chip-red">Inativo</span>`}</td>
      <td>
        <div class="action-button-group">
          <button class="inline-button" type="button" data-edit-staff-user="${user.id}">Editar</button>
          ${
            user.is_active
              ? `<button class="inline-button danger-button" type="button" data-deactivate-staff-user="${user.id}">Desativar</button>`
              : `<button class="inline-button danger-button" type="button" data-delete-staff-user="${user.id}">Excluir</button>`
          }
        </div>
      </td>
    </tr>
  `;
}

function renderPermissionAssignmentRow(user) {
  return `
    <tr>
      <td>${escapeHtml(user.full_name)}</td>
      <td>${escapeHtml(user.email || "-")}</td>
      <td>${escapeHtml(formatStaffRole(user.department || "-"))}</td>
      <td>${escapeHtml(user.permission_role_name || "-")}</td>
      <td><button class="inline-button" type="button" data-edit-staff-user="${user.id}">Alterar</button></td>
    </tr>
  `;
}

function renderEmployeeModal() {
  const departmentOptions = STAFF_TYPES
    .map((role) => `<option value="${role}" ${role === state.employeeDraft.department ? "selected" : ""}>${escapeHtml(formatStaffRole(role))}</option>`)
    .join("");
  const permissionRoleOptions = (state.permissionRoles || [])
    .map((role) => `<option value="${role.id}" ${role.id === state.employeeDraft.permission_role_id ? "selected" : ""}>${escapeHtml(role.name)}</option>`)
    .join("");

  return `
    <div class="modal-overlay" data-close-employee-modal>
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Cadastrar funcionário" data-modal-card>
        <div class="module-head compact-head">
          <div>
            <p class="eyebrow muted">Cadastro de funcionário</p>
            <h3>${state.employeeFormMode === "edit" ? "Editar Funcionário" : "Cadastrar Funcionário"}</h3>
          </div>
        </div>
        <form id="employee-form" class="permissions-employee-form">
          <input type="hidden" name="user_id" value="${escapeHtml(state.employeeDraft.id)}" />
          <div class="product-form-row">
            <label>Código de Acesso *<input type="text" name="login_code" maxlength="3" pattern="[0-9]{3}" value="${escapeHtml(state.employeeDraft.login_code)}" required /></label>
            <label>Nome Completo *<input type="text" name="full_name" value="${escapeHtml(state.employeeDraft.full_name)}" required /></label>
          </div>
          <div class="product-form-row">
            <label>Email<input type="email" name="email" value="${escapeHtml(state.employeeDraft.email)}" placeholder="email@empresa.com" /></label>
            <label>Senha ${state.employeeFormMode === "edit" ? "" : "*"}<input type="password" name="password" placeholder="${state.employeeFormMode === "edit" ? "Nova senha do funcionário" : "Mínimo 6 caracteres"}" ${state.employeeFormMode === "edit" ? "" : "required"} /></label>
          </div>
          ${state.employeeFormMode === "edit" ? `<p class="hint">TI pode redefinir a senha de qualquer funcionário por este formulario. ADMINISTRADOR tambem pode alterar a senha durante a edicao. Deixe em branco para manter a senha atual.</p>` : ""}
          <div class="product-form-row">
            <label>Departamento<select name="department" required>${departmentOptions}</select></label>
            <label>Papel de Permissão<select name="permission_role_id" required><option value="">Selecione</option>${permissionRoleOptions}</select></label>
          </div>
          <div class="product-form-row">
            <label>Status<select name="status"><option value="active" ${state.employeeDraft.status === "active" ? "selected" : ""}>Ativo</option><option value="inactive" ${state.employeeDraft.status === "inactive" ? "selected" : ""}>Inativo</option></select></label>
          </div>
          <div class="form-actions-row">
            <button class="ghost-button" type="button" data-close-employee-modal-button>Cancelar</button>
            <button class="primary-button" type="submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderBomModule() {
  const canEdit = hasPermission("bom", "edit");
  const materials = state.moduleData.bomMaterials || [];
  const structures = state.moduleData.bomStructures || [];
  const filteredMaterials = materials.filter((item) => {
    const term = state.bomMaterialSearch.trim().toLowerCase();
    if (!term) return true;
    return [item.code, item.name, item.description, item.category, item.supplier].some((value) =>
      String(value || "").toLowerCase().includes(term)
    );
  });
  const structureTerm = String(state.bomStructureSearch || "").trim().toLowerCase();
  const filteredStructures = structures.filter((item) => {
    if (!structureTerm) return true;
    return [item.code, item.name, item.category, item.version, item.product_name, item.product_code, item.instructions].some((value) =>
      String(value || "").toLowerCase().includes(structureTerm)
    );
  });
  const totalStructureCost = calculateBomDraftTotal();

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
        ${renderKpiCard({
          label: "Peças e Materiais",
          value: materials.length,
          note: materials.length ? "Base técnica cadastrada" : "Nenhum item cadastrado",
          icon: "⊞",
          tone: "blue",
        })}
        ${renderKpiCard({
          label: "Conjuntos BOM",
          value: structures.length,
          note: structures.length ? "Estruturas de produto final" : "Nenhum conjunto cadastrado",
          icon: "◫",
          tone: "green",
        })}
        ${renderKpiCard({
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
                  ? renderBomMaterialsForm()
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
                  <input id="bom-material-search" type="text" placeholder="Buscar peças..." value="${escapeHtml(state.bomMaterialSearch)}" />
                </label>
              </div>
              ${renderTable(
                ["Código", "Nome", "Descrição", "Categoria", "Unidade", "Custo", "Fornecedor", "Estoque", "Mínimo", "Status", "Ação"],
                filteredMaterials.map((item) => [
                  item.code,
                  item.name,
                  item.description || "-",
                  formatBomCategory(item.category),
                  item.unit,
                  formatCurrency(item.unit_cost),
                  item.supplier || "-",
                  formatQuantity(item.current_stock),
                  formatQuantity(item.minimum_stock),
                  materialStatusCell(item.status),
                  deleteButtonCell("bom_materials", item.id, canEdit),
                ])
              )}
            </section>
          `
          : `
            ${
              canEdit
                ? state.bomStructureFormVisible
                  ? renderBomStructuresForm(totalStructureCost)
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
                  <input id="bom-structure-search" type="text" placeholder="Buscar conjunto..." value="${escapeHtml(state.bomStructureSearch || "")}" />
                </label>
              </div>
              ${renderTable(
                ["Código", "Nome", "Categoria", "Versao", "Lote", "Status", "Custo Total", "Itens", "Instruções", "Ação"],
                filteredStructures.map((item) => [
                  item.code,
                  item.name,
                  formatBomCategory(item.category),
                  item.version,
                  `${formatQuantity(item.batch_size)} ${item.batch_unit}`,
                  bomStructureStatusCell(item.status),
                  formatCurrency(item.total_cost),
                  renderBomStructureItemsSummary(item),
                  item.instructions || "-",
                  bomStructureActionCell(item, canEdit),
                ])
              )}
            </section>
          `
      }
    </section>
  `;
}

function renderInventoryModule() {
  const canEdit = hasPermission("inventory", "edit");
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
        ${renderKpiCard({
          label: "Movimentações",
          value: movements.length,
          note: movements.length ? "Histórico total registrado" : "Nenhuma movimentação registrada",
          icon: "◬",
          tone: "blue",
        })}
        ${renderKpiCard({
          label: "Entradas",
          value: entryCount,
          note: entryCount ? "Reposicoes e recebimentos" : "Sem entradas registradas",
          icon: "↗",
          tone: "green",
        })}
        ${renderKpiCard({
          label: "Saídas",
          value: exitCount,
          note: exitCount ? "Baixas de estoque realizadas" : "Sem saídas registradas",
          icon: "↘",
          tone: "red",
        })}
        ${renderKpiCard({
          label: "Ajustes",
          value: adjustmentCount,
          note: adjustmentCount ? "Correcoes manuais aplicadas" : "Sem ajustes realizados",
          icon: "≋",
          tone: "amber",
        })}
      </div>

      ${
        state.inventoryFormVisible && canEdit
          ? renderInventoryMovementForm()
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
                          <td>${formatShortId(item.id)}</td>
                          <td>
                            <strong>${item.product_name}</strong>
                            ${item.sale_option_label ? `<div class="table-inline-copy">${escapeHtml(item.sale_option_label)}</div>` : ""}
                            ${renderInventoryMovementBomDescription(item) || ""}
                            <div class="table-inline-copy muted">${item.sale_option_code || item.product_code || "-"}</div>
                          </td>
                          <td>${inventoryMovementTypeCell(item.movement_type)}</td>
                          <td>${formatQuantity(item.quantity)}</td>
                          <td>
                            ${item.notes || "-"}
                            <div class="table-inline-copy muted">Série ${item.machine_serial || "-"} | Lote ${item.batch || "-"}</div>
                          </td>
                          <td>${item.moved_by_name ? escapeHtml(item.moved_by_name) : "-"}</td>
                          <td>${formatDateTime(item.created_at)}</td>
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
  `;
}

function renderAuditModule() {
  if (!hasPermission("audit", "view")) {
    return noPermissionTemplate("Seu perfil não possui acesso ao módulo de auditoria.");
  }

  const logs = state.moduleData.auditLogs || [];
  const selectedLog = logs.find((item) => item.id === state.auditSelectedLogId) || logs[0] || null;
  const userOptions = Array.from(new Set(logs.map((item) => item.usuario_nome).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((name) => ({ value: name, label: name }));
  const moduleOptions = getAuditKnownModules();
  const actionOptions = getAuditLogActionOptions(logs);

  return `
    <section class="module-panel">
      <div class="module-head">
        <div>
          <p class="eyebrow muted">Auditoria centralizada</p>
          <h3>Central de Logs</h3>
          <p class="muted">Registros unificados por módulo com filtros operacionais e rastreabilidade completa.</p>
        </div>
        <div class="module-head-actions">
          <button class="ghost-button" type="button" data-audit-refresh>Atualizar</button>
          <button class="primary-button" type="button" data-audit-export-pdf>Exportar PDF</button>
        </div>
      </div>

      <div class="summary-grid">
        ${renderKpiCard({ label: "Logs carregados", value: logs.length, note: logs.length ? "Últimos 500 registros filtrados" : "Nenhum registro encontrado", icon: "◰", tone: "blue" })}
        ${renderKpiCard({ label: "Críticos", value: logs.filter((item) => item.nivel === "Critico").length, note: "Eventos de alto impacto", icon: "!", tone: "red" })}
        ${renderKpiCard({ label: "Atenção", value: logs.filter((item) => item.nivel === "Atenção").length, note: "Eventos com alerta operacional", icon: "•", tone: "amber" })}
        ${renderKpiCard({ label: "Módulos ativos", value: new Set(logs.map((item) => item.modulo).filter(Boolean)).size, note: "Categorias presentes no filtro atual", icon: "⊞", tone: "green" })}
      </div>

      <form id="audit-filter-form" class="table-actions audit-filter-grid">
        <label>Módulo<select name="module"><option value="all">Todos</option>${renderOptions(moduleOptions, state.auditFilters.module)}</select></label>
        <label>Usuário<select name="user"><option value="all">Todos</option>${renderOptions(userOptions, state.auditFilters.user)}</select></label>
        <label>Ação<select name="action"><option value="all">Todas</option>${renderOptions(actionOptions, state.auditFilters.action)}</select></label>
        <label>Nível<select name="level">${renderOptions([
          { value: "all", label: "Todos" },
          { value: "Informativo", label: "Informativo" },
          { value: "Atenção", label: "Atenção" },
          { value: "Critico", label: "Critico" },
        ], state.auditFilters.level)}</select></label>
        <label>Data inicial<input name="date_from" type="date" value="${escapeHtml(state.auditFilters.date_from)}" /></label>
        <label>Data final<input name="date_to" type="date" value="${escapeHtml(state.auditFilters.date_to)}" /></label>
        <label class="audit-filter-search">Busca textual<input name="search" type="text" placeholder="Buscar por item, descrição, usuário ou ação..." value="${escapeHtml(state.auditFilters.search)}" /></label>
        <div class="form-actions-row">
          <button class="ghost-button" type="button" data-audit-reset>Limpar</button>
          <button class="primary-button" type="submit">Filtrar</button>
        </div>
      </form>

      <div class="audit-layout">
        <div class="table-card audit-table-card">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Módulo</th>
                <th>Ação</th>
                <th>Usuário</th>
                <th>Item</th>
                <th>Nível</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                logs.length
                  ? logs.map((log) => `
                    <tr class="${selectedLog?.id === log.id ? "audit-log-row-selected" : ""}">
                      <td>${formatDateTime(log.created_at)}</td>
                      <td>${escapeHtml(getModuleLabel(log.modulo))}</td>
                      <td>${escapeHtml(log.acao || "-")}</td>
                      <td>${escapeHtml(log.usuario_nome || "-")}</td>
                      <td>${escapeHtml(log.item_afetado || "-")}</td>
                      <td>${renderAuditLevelBadge(log.nivel)}</td>
                      <td><button class="inline-button" type="button" data-audit-select-log="${log.id}">Detalhes</button></td>
                    </tr>
                  `).join("")
                  : `<tr><td colspan="7"><div class="empty-state">Nenhum log encontrado para os filtros aplicados.</div></td></tr>`
              }
            </tbody>
          </table>
        </div>

        <aside class="table-card audit-detail-card">
          ${
            selectedLog
              ? `
                <div class="module-head compact-head">
                  <div>
                    <p class="eyebrow muted">Detalhamento do evento</p>
                    <h3>${escapeHtml(selectedLog.acao || "Log")}</h3>
                  </div>
                </div>
                <div class="audit-detail-grid">
                  <div><span>Módulo</span><strong>${escapeHtml(getModuleLabel(selectedLog.modulo))}</strong></div>
                  <div><span>Usuário</span><strong>${escapeHtml(selectedLog.usuario_nome || "-")}</strong></div>
                  <div><span>Perfil</span><strong>${escapeHtml(selectedLog.usuario_perfil || "-")}</strong></div>
                  <div><span>Data/Hora</span><strong>${escapeHtml(formatDateTime(selectedLog.created_at))}</strong></div>
                  <div><span>IP</span><strong>${escapeHtml(selectedLog.ip || "-")}</strong></div>
                  <div><span>Nível</span><strong>${escapeHtml(selectedLog.nivel || "-")}</strong></div>
                  <div><span>Item afetado</span><strong>${escapeHtml(selectedLog.item_afetado || "-")}</strong></div>
                  <div><span>Entidade</span><strong>${escapeHtml(selectedLog.entidade_tipo || "-")} ${escapeHtml(selectedLog.entidade_id || "")}</strong></div>
                </div>
                <section class="form-section">
                  <h4>Descrição</h4>
                  <p class="audit-detail-description">${escapeHtml(selectedLog.descricao || "-")}</p>
                </section>
                <section class="form-section">
                  <h4>Payload</h4>
                  <pre class="audit-payload">${escapeHtml(JSON.stringify(selectedLog.payload || {}, null, 2))}</pre>
                </section>
              `
              : `<div class="empty-state">Selecione um log para visualizar o detalhamento.</div>`
          }
        </aside>
      </div>
    </section>
  `;
}

function renderMachiningModule() {
  if (!hasPermission("machining", "view")) {
    return noPermissionTemplate("Seu perfil não possui acesso ao módulo de usinagem.");
  }

  const canEdit = hasPermission("machining", "edit");
  const pieces = state.moduleData.machiningPieces || [];
  const isFormOpen = state.openAccordionKey === "machining-form";
  const searchTerm = state.machiningSearch.trim().toLowerCase();
  const filteredPieces = pieces.filter((piece) => {
    const matchesSearch = !searchTerm
      || [piece.code, piece.name, piece.material].some((value) => String(value || "").toLowerCase().includes(searchTerm));
    const matchesStatus = state.machiningStatusFilter === "all" || piece.status === state.machiningStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const inRegistration = pieces.filter((piece) => piece.status === "Cadastro").length;
  const inProduction = pieces.filter((piece) => piece.status === "Em Produção").length;
  const finished = pieces.filter((piece) => piece.status === "Finalizada").length;

  return `
    <section class="module-panel machining-module">
      <div class="module-head machining-head">
        <div>
          <p class="eyebrow muted">Usinagem</p>
          <h3>Peças &amp; Processos de Usinagem</h3>
          <p class="muted">${pieces.length} peça(s) cadastrada(s)</p>
        </div>
        <div class="module-head-actions">
          ${canEdit ? `
            <button
              class="primary-button machining-create-button ${isFormOpen ? "is-open" : ""}"
              type="button"
              data-machining-toggle-form
            >
              <span>+ Nova Peça</span>
              <span class="production-toggle-icon">${isFormOpen ? "▴" : "▾"}</span>
            </button>
          ` : ""}
        </div>
      </div>

      <div class="summary-grid">
        ${renderKpiCard({
          label: "Peças Cadastradas",
          value: pieces.length,
          note: pieces.length ? "Cadastro técnico pronto para produção" : "Nenhuma peça cadastrada",
          icon: "◈",
          tone: "blue",
        })}
        ${renderKpiCard({
          label: "Em Cadastro",
          value: inRegistration,
          note: inRegistration ? "Peças aguardando envio para produção" : "Sem cadastro pendente",
          icon: "⊞",
          tone: "amber",
        })}
        ${renderKpiCard({
          label: "Em Produção",
          value: inProduction,
          note: inProduction ? "Ordens em execucao por etapas" : "Nenhuma ordem ativa",
          icon: "◭",
          tone: "green",
        })}
        ${renderKpiCard({
          label: "Finalizadas",
          value: finished,
          note: finished ? "Peças já integradas ao estoque" : "Sem peças concluídas",
          icon: "◬",
          tone: "red",
        })}
      </div>

      ${
        canEdit
          ? `
            <div class="machining-accordion-shell ${isFormOpen ? "open" : ""}">
              <div class="machining-accordion-card">
                ${renderMachiningForm()}
              </div>
            </div>
          `
          : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
      }

      <div class="table-actions machining-filters-row">
        <label class="search-input-shell">
          <span class="search-input-icon">⌕</span>
          <input
            id="machining-search-input"
            type="text"
            placeholder="Buscar por código, nome ou material..."
            value="${escapeHtml(state.machiningSearch)}"
          />
        </label>

        <label>
          Filtro
          <select id="machining-status-filter">
            ${renderOptions([
              { value: "all", label: "Todas" },
              { value: "Cadastro", label: "Cadastro" },
              { value: "Em Produção", label: "Em Produção" },
              { value: "Finalizada", label: "Finalizada" },
            ], state.machiningStatusFilter)}
          </select>
        </label>
      </div>

      <div class="machining-list">
        ${
          filteredPieces.length
            ? filteredPieces.map((piece) => renderMachiningPieceCard(piece, canEdit)).join("")
            : `
              <div class="table-card machining-empty-card">
                <div class="production-empty-state">
                  <div class="production-empty-icon">◈</div>
                  <strong>Nenhuma peça encontrada</strong>
                </div>
              </div>
            `
        }
      </div>
    </section>
  `;
}

function renderMachiningForm() {
  const totalMinutes = getMachiningDraftTotalMinutes();
  const processCount = state.machiningDraft.processes.length;

  return `
    <div class="machining-form-header">
      <div>
        <p class="eyebrow muted">Nova Peça</p>
        <h4>${state.machiningDraft.edit_id ? "Editar Peça" : "Nova Peça"}</h4>
        <p class="muted">Dados da peça e processos de fabricação em sequência controlada.</p>
      </div>
      <div class="machining-form-summary">
        <span>${processCount} processo(s)</span>
        <strong>${formatMinutesLabel(totalMinutes)}</strong>
      </div>
    </div>

    <form id="machining-form" class="machining-form-grid">
      <input type="hidden" name="edit_id" value="${escapeHtml(state.machiningDraft.edit_id)}" />

      <div class="form-section">
        <h4>Dados da peça</h4>
        <div class="machining-form-row">
          <label>
            Código *
            <input name="code" type="text" required value="${escapeHtml(state.machiningDraft.code)}" />
          </label>
          <label>
            Nome da Peça *
            <input name="name" type="text" required value="${escapeHtml(state.machiningDraft.name)}" />
          </label>
          <label>
            Nome no Estoque Terminado
            <input name="finished_name" type="text" value="${escapeHtml(state.machiningDraft.finished_name || state.machiningDraft.name)}" />
          </label>
        </div>
        <div class="machining-form-row">
          <label>
            Material
            <input name="material" type="text" value="${escapeHtml(state.machiningDraft.material)}" />
          </label>
        </div>
        <div class="machining-form-row machining-form-row-full">
          <label>
            Descrição
            <textarea name="description" placeholder="Detalhes técnicos da peça">${escapeHtml(state.machiningDraft.description)}</textarea>
          </label>
        </div>
      </div>

      <div class="form-section">
        <div class="machining-process-header">
          <div>
            <h4>Processos de Fabricação</h4>
            <p class="muted">Cadastre ate 8 etapas na ordem em que a produção deve acontecer.</p>
          </div>
          <button
            class="inline-button"
            type="button"
            data-machining-add-process
            ${processCount >= 8 ? "disabled" : ""}
          >
            + Adicionar Processo
          </button>
        </div>

        <div class="machining-process-list">
          ${state.machiningDraft.processes.map((process, index) => renderMachiningProcessDraftRow(process, index)).join("")}
        </div>
      </div>

      <div class="form-actions-row machining-form-actions">
        <button class="ghost-button" type="button" data-machining-cancel>Cancelar</button>
        <button class="primary-button" type="submit">Salvar Cadastro</button>
      </div>
    </form>
  `;
}

function renderMachiningProcessDraftRow(process, index) {
  return `
    <article class="machining-process-card">
      <div class="machining-process-card-head">
        <div>
          <span class="machining-stage-tag">Etapa ${index + 1}</span>
          <strong>${escapeHtml(process.name || `Processo ${index + 1}`)}</strong>
        </div>
        <div class="machining-process-actions">
          <button class="inline-button" type="button" data-machining-move-process="${index}" data-direction="-1" ${index === 0 ? "disabled" : ""}>Subir</button>
          <button class="inline-button" type="button" data-machining-move-process="${index}" data-direction="1" ${index === state.machiningDraft.processes.length - 1 ? "disabled" : ""}>Descer</button>
          <button class="inline-button danger-button" type="button" data-machining-remove-process="${index}" ${state.machiningDraft.processes.length === 1 ? "disabled" : ""}>Remover</button>
        </div>
      </div>

      <div class="machining-process-grid">
        <label>
          Nome do Processo *
          <input data-machining-process-field="name" data-machining-process-index="${index}" type="text" value="${escapeHtml(process.name)}" placeholder="Ex.: Corte" />
        </label>
        <label>
          Máquina
          <input data-machining-process-field="machine" data-machining-process-index="${index}" type="text" value="${escapeHtml(process.machine)}" />
        </label>
        <label>
          Operador
          <input data-machining-process-field="operator" data-machining-process-index="${index}" type="text" value="${escapeHtml(process.operator)}" />
        </label>
        <label>
          Tempo Estimado (min)
          <input data-machining-process-field="estimated_minutes" data-machining-process-index="${index}" type="number" min="0" step="1" value="${escapeHtml(process.estimated_minutes)}" />
        </label>
      </div>

      <div class="machining-process-grid machining-process-grid-notes">
        <label>
          Observações
          <textarea data-machining-process-field="notes" data-machining-process-index="${index}" placeholder="Informações operacionais">${escapeHtml(process.notes)}</textarea>
        </label>
      </div>
    </article>
  `;
}

function renderMachiningPieceCard(piece, canEdit) {
  const processCount = piece.processes.length;
  const latestOrder = getLatestMachiningOrder(piece);
  const isDetailOpen = state.openAccordionKey === `machining-detail-${piece.id}`;
  const isStartOpen = state.openAccordionKey === `machining-start-${piece.id}`;

  return `
    <article class="table-card machining-piece-card">
      <div class="machining-piece-top">
        <div class="machining-piece-main">
          <div class="machining-piece-title-row">
            <div>
              <span class="machining-piece-code">${escapeHtml(piece.code)}</span>
              <h4>${escapeHtml(piece.name)}</h4>
            </div>
            ${renderMachiningStatusBadge(piece.status)}
          </div>

          <div class="machining-piece-meta">
            <span>${escapeHtml(piece.material || "Material não informado")}</span>
            <span>${processCount} processo(s)</span>
            <span>${formatMinutesLabel(piece.total_minutes)}</span>
          </div>

          <div class="machining-piece-kpis">
            <div>
              <span>Código</span>
              <strong>${escapeHtml(piece.code)}</strong>
            </div>
            <div>
              <span>Material</span>
              <strong>${escapeHtml(piece.material || "-")}</strong>
            </div>
            <div>
              <span>Última produção</span>
              <strong>${latestOrder ? escapeHtml(latestOrder.lot) : "Não iniciada"}</strong>
            </div>
            <div>
              <span>Etapa atual</span>
              <strong>${latestOrder ? escapeHtml(getMachiningCurrentStageLabel(latestOrder)) : "Cadastro"}</strong>
            </div>
          </div>
        </div>

        <div class="machining-piece-actions">
          ${canEdit ? `<button class="primary-button" type="button" data-machining-start-production="${piece.id}">Enviar para Produção da Usinagem</button>` : ""}
          ${canEdit ? `<button class="inline-button" type="button" data-machining-edit-id="${piece.id}">Editar</button>` : ""}
          ${canEdit ? `<button class="inline-button danger-button" type="button" data-machining-delete-id="${piece.id}">Excluir</button>` : ""}
          <button class="ghost-button" type="button" data-machining-toggle-details="${piece.id}">
            ${isDetailOpen ? "Recolher detalhes" : "Expandir detalhes"}
          </button>
        </div>
      </div>

      <div class="machining-accordion-shell ${isStartOpen ? "open" : ""}">
        <div class="machining-accordion-card machining-inline-card">
          ${renderMachiningStartProductionForm(piece)}
        </div>
      </div>

      <div class="machining-accordion-shell ${isDetailOpen ? "open" : ""}">
        <div class="machining-accordion-card machining-inline-card">
          ${renderMachiningPieceDetails(piece)}
        </div>
      </div>
    </article>
  `;
}

function renderMachiningStartProductionForm(piece) {
  const draft = state.machiningStartDraft.piece_id === piece.id
    ? state.machiningStartDraft
    : createEmptyMachiningStartDraft(piece.id);

  return `
    <div class="machining-inline-head">
      <div>
        <h4>Iniciar produção por etapas</h4>
        <p class="muted">Toda nova produção exige quantidade e lote obrigatórios.</p>
      </div>
    </div>

    <form class="machining-start-form" data-machining-start-form="${piece.id}">
      <input type="hidden" name="piece_id" value="${escapeHtml(piece.id)}" />
      <label>
        Quantidade a produzir *
        <input name="quantity" type="number" min="1" step="1" required value="${escapeHtml(draft.quantity)}" />
      </label>
      <label>
        Lote *
        <input name="lot" type="text" required value="${escapeHtml(draft.lot)}" />
      </label>
      <label>
        Operador
        <input name="operator" type="text" value="${escapeHtml(draft.operator)}" />
      </label>
      <label>
        Nome no estoque terminado
        <input name="finished_name" type="text" value="${escapeHtml(draft.finished_name || piece.finished_name || piece.name)}" />
      </label>
      <div class="form-actions-row machining-form-actions">
        <button class="ghost-button" type="button" data-machining-close-inline>Cancelar</button>
        <button class="primary-button" type="submit">Iniciar Produção</button>
      </div>
    </form>
  `;
}

function renderMachiningPieceDetails(piece) {
  const latestOrder = getLatestMachiningOrder(piece);
  const stockEntries = piece.stock_entries || [];
  const visibleSteps = latestOrder ? getVisibleMachiningSteps(latestOrder) : [];

  return `
    <div class="machining-inline-head">
      <div>
        <h4>Detalhes da peça</h4>
        <p class="muted">${escapeHtml(piece.description || "Sem descrição cadastrada.")}</p>
      </div>
    </div>

    <div class="machining-detail-grid">
      <section class="form-section">
        <h4>Sequencia de processos</h4>
        <div class="machining-stage-list">
          ${piece.processes.map((process, index) => renderMachiningProcessTimelineItem(process, index)).join("")}
        </div>
      </section>

      <section class="form-section">
        <h4>Produção atual</h4>
        ${
          latestOrder
            ? `
              <div class="machining-production-summary">
                <div>
                  <span>Lote</span>
                  <strong>${escapeHtml(latestOrder.lot)}</strong>
                </div>
                <div>
                  <span>Quantidade</span>
                  <strong>${formatQuantity(latestOrder.quantity_planned)}</strong>
                </div>
                <div>
                  <span>Status geral</span>
                  <strong>${escapeHtml(latestOrder.status)}</strong>
                </div>
                <div>
                  <span>Etapa atual</span>
                  <strong>${escapeHtml(getMachiningCurrentStageLabel(latestOrder))}</strong>
                </div>
                <div>
                  <span>Nome no estoque</span>
                  <strong>${escapeHtml(latestOrder.finished_name || piece.finished_name || piece.name)}</strong>
                </div>
              </div>
              <div class="machining-stage-list">
                ${visibleSteps.map(({ step, index }) => renderMachiningOrderStepItem(piece.id, latestOrder.id, step, index, canStepAction(latestOrder, step))).join("")}
              </div>
            `
            : `<div class="empty-state">Nenhuma produção iniciada para esta peça.</div>`
        }
      </section>
    </div>

    <section class="form-section">
      <h4>Histórico de estoque</h4>
      ${
        stockEntries.length
          ? `
            <div class="machining-stock-list">
              ${stockEntries.map((entry) => `
                <article class="machining-stock-item">
                  <strong>${escapeHtml(entry.product_name || piece.finished_name || piece.name)} • ${formatQuantity(entry.quantity)} un • Lote ${escapeHtml(entry.lot)}</strong>
                  <span class="muted">${formatDateTime(entry.created_at)} • ${escapeHtml(entry.origin)}</span>
                </article>
              `).join("")}
            </div>
          `
          : `<div class="empty-state">A peça entra no estoque somente após concluir todas as etapas.</div>`
      }
    </section>
  `;
}

function renderMachiningProcessTimelineItem(process, index) {
  return `
    <article class="machining-stage-item">
      <div class="machining-stage-index">Etapa ${index + 1}</div>
      <div class="machining-stage-copy">
        <strong>${escapeHtml(process.name)}</strong>
        <span class="muted">
          ${escapeHtml(process.machine || "Máquina não informada")} •
          ${formatMinutesLabel(process.estimated_minutes)}
        </span>
      </div>
    </article>
  `;
}

function renderMachiningOrderStepItem(pieceId, orderId, step, index, actionState) {
  return `
    <article class="machining-stage-item machining-stage-item-live">
      <div class="machining-stage-index">Etapa ${index + 1}</div>
      <div class="machining-stage-copy">
        <strong>${escapeHtml(step.name)}</strong>
        <span class="muted">
          ${escapeHtml(step.machine || "Máquina não informada")} •
          ${formatMinutesLabel(step.estimated_minutes)}
          ${step.completed_at ? ` • Finalizada em ${formatDateTime(step.completed_at)}` : ""}
        </span>
      </div>
      <label class="machining-step-operator-field">
        <span>Operador da etapa</span>
        <input
          type="text"
          value="${escapeHtml(step.operator || "")}"
          data-machining-step-operator="${pieceId}|${orderId}|${index}"
        />
      </label>
      <div class="machining-stage-actions">
        ${renderMachiningStepStatusBadge(step.status)}
        <button class="inline-button" type="button" data-machining-step-start="${pieceId}|${orderId}|${index}" ${actionState.disableStart ? "disabled" : ""}>
          Iniciar
        </button>
        <button class="primary-button" type="button" data-machining-step-complete="${pieceId}|${orderId}|${index}" ${actionState.disableComplete ? "disabled" : ""}>
          Finalizar
        </button>
      </div>
    </article>
  `;
}

function renderProductionModule() {
  if (!hasPermission("production", "view")) {
    return noPermissionTemplate("Seu perfil não possui acesso ao módulo de produção.");
  }

  const canEdit = hasPermission("production", "edit");
  const isFormOpen = state.openAccordionKey === "production-order-form";
  const products = state.moduleData.products || [];
  const searchTerm = state.productionSearch.trim().toLowerCase();
  const filteredOrders = (state.moduleData.production || []).filter((item) => {
    const metadata = getProductionOrderMetadata(item);
    const matchesSearch = !searchTerm
      || [
        item.order_number,
        item.product_name,
        item.product_code,
        metadata.responsibleName,
        metadata.lotNumber,
      ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
    const matchesStatus = state.productionStatusFilter === "all" || item.status === state.productionStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return `
    <section class="module-panel production-module">
      <div class="module-head production-head">
        <div>
          <p class="eyebrow muted">Produção</p>
          <h3>Ordens de produção</h3>
          <p class="muted">Gerencie ordens de produção.</p>
        </div>
        <div class="module-head-actions">
          ${canEdit ? `
            <button
              class="primary-button production-create-button ${isFormOpen ? "is-open" : ""}"
              type="button"
              data-production-toggle-form
              ${products.length ? "" : "disabled"}
            >
              <span>+ Nova Ordem</span>
              <span class="production-toggle-icon">${isFormOpen ? "▴" : "▾"}</span>
            </button>
          ` : ""}
        </div>
      </div>

      ${
        canEdit
          ? products.length
            ? `
            <div class="production-accordion-shell ${isFormOpen ? "open" : ""}">
              <div class="production-accordion-card">
                <div class="production-form-header">
                  <div>
                    <h4>${state.productionDraft.edit_id ? "Editar Ordem de Produção" : "Nova Ordem de Produção"}</h4>
                    <p class="muted">Fluxo em accordion com integração aos produtos cadastrados.</p>
                  </div>
                </div>
                <form id="production-form" class="production-form-grid">
                  <input type="hidden" name="edit_id" value="${escapeHtml(state.productionDraft.edit_id)}" />
                  <input type="hidden" name="status" value="${escapeHtml(state.productionDraft.status || "planned")}" />

                  <div class="production-form-row production-form-row-primary">
                    <label>
                      Produto *
                      <select name="product_id" required>
                        <option value="">Selecione um produto</option>
                        ${products
                          .map(
                            (product) => `
                              <option value="${product.id}" ${product.id === state.productionDraft.product_id ? "selected" : ""}>
                                ${escapeHtml(product.name)}${product.code ? ` (${escapeHtml(product.code)})` : ""}
                              </option>
                            `
                          )
                          .join("")}
                      </select>
                    </label>

                    <label>
                      Código
                      <input
                        name="order_number"
                        type="text"
                        placeholder="OP-PRD-20260407-001"
                        value="${escapeHtml(state.productionDraft.order_number)}"
                      />
                    </label>

                    <label>
                      Quantidade *
                      <input
                        name="batch_size"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value="${escapeHtml(state.productionDraft.batch_size)}"
                      />
                    </label>

                    <label>
                      Prioridade
                      <select name="priority">
                        ${renderOptions([
                          { value: "baixa", label: "Baixa" },
                          { value: "media", label: "Media" },
                          { value: "alta", label: "Alta" },
                          { value: "urgente", label: "Urgente" },
                        ], state.productionDraft.priority || "media")}
                      </select>
                    </label>
                  </div>

                  <div class="production-form-row">
                    <label>
                      Inicio Previsto
                      <input name="planned_start" type="date" value="${escapeHtml(state.productionDraft.planned_start)}" />
                    </label>

                    <label>
                      Fim Previsto
                      <input name="planned_end" type="date" value="${escapeHtml(state.productionDraft.planned_end)}" />
                    </label>

                    <label>
                      No Lote
                      <input name="lot_number" type="text" placeholder="Lote" value="${escapeHtml(state.productionDraft.lot_number)}" />
                    </label>

                    <label>
                      Responsavel
                      <input
                        name="responsible_name"
                        type="text"
                        placeholder="Responsavel pela ordem"
                        value="${escapeHtml(state.productionDraft.responsible_name)}"
                      />
                    </label>
                  </div>

                  <div class="production-form-row production-form-row-full">
                    <label>
                      Observações
                      <textarea name="notes" placeholder="Detalhes adicionais da ordem">${escapeHtml(state.productionDraft.notes)}</textarea>
                    </label>
                  </div>

                  <div class="form-actions-row production-form-actions">
                    <button class="ghost-button" type="button" data-production-cancel>Cancelar</button>
                    <button class="primary-button" type="submit">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          `
            : `<div class="empty-state">Cadastre ao menos um produto no módulo Produtos para abrir novas ordens de produção.</div>`
          : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
      }

      <div class="table-actions production-filters-row">
        <label>
          Buscar...
          <input
            id="production-search-input"
            type="text"
            placeholder="Buscar..."
            value="${escapeHtml(state.productionSearch)}"
          />
        </label>
        <label>
          Status
          <select id="production-status-filter">
            ${renderOptions([
              { value: "all", label: "Todos" },
              { value: "planned", label: "Planejada" },
              { value: "in_progress", label: "Em andamento" },
              { value: "completed", label: "Concluída" },
              { value: "cancelled", label: "Cancelada" },
            ], state.productionStatusFilter)}
          </select>
        </label>
      </div>

      <div class="table-card production-table-card">
        ${
          filteredOrders.length
            ? `
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Quantidade</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Responsavel</th>
                    <th>Datas</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredOrders.map((item) => renderProductionRow(item, canEdit, isPermissionsAdmin())).join("")}
                </tbody>
              </table>
            `
            : `
              <div class="production-empty-state">
                <div class="production-empty-icon">◭</div>
                <strong>Nenhuma ordem encontrada</strong>
              </div>
            `
        }
      </div>
    </section>
  `;
}

function renderProductionRow(item, canEdit, canDelete = false) {
  const metadata = getProductionOrderMetadata(item);

  return `
    <tr>
      <td>
        <strong>${escapeHtml(item.product_name || "-")}</strong>
        <div class="table-inline-copy muted">${escapeHtml(metadata.lotNumber || "Sem lote")}</div>
      </td>
      <td>
        <strong>${escapeHtml(item.order_number || "-")}</strong>
        <div class="table-inline-copy muted">${escapeHtml(item.product_code || "Sem código do produto")}</div>
      </td>
      <td>${formatQuantity(item.batch_size)}</td>
      <td>${productionPriorityCell(metadata.priority)}</td>
      <td>${statusCell(item.status || "planned")}</td>
      <td>${escapeHtml(metadata.responsibleName || "-")}</td>
      <td>
        <strong>${formatDate(item.planned_start)}</strong>
        <div class="table-inline-copy muted">Ate ${formatDate(item.planned_end)}</div>
      </td>
      <td>${renderProductionActionCell(item, canEdit, canDelete)}</td>
    </tr>
  `;
}

function renderProductionActionCell(item, canEdit, canDelete = false) {
  return `
    <div class="action-button-group">
      ${
        canEdit && item.status === "planned"
          ? `<button class="primary-button" type="button" data-production-start-id="${item.id}">Iniciar</button>`
          : ""
      }
      <button class="inline-button" type="button" data-production-print-id="${item.id}">Imprimir</button>
      ${canEdit ? `<button class="inline-button" type="button" data-production-edit-id="${item.id}">Editar</button>` : ""}
      ${canDelete ? `<button class="inline-button danger-button" type="button" data-production-delete-id="${item.id}">Excluir</button>` : ""}
    </div>
  `;
}

function renderProductionMachiningSection(machiningOrders) {
  return `
    <section class="production-machining-section">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">USINAGEM POR ETAPAS</p>
          <h3>Ordens agrupadas por peça</h3>
          <p class="muted">Fluxo sequencial com liberação automática da próxima etapa e entrada no estoque ao concluir.</p>
        </div>
      </div>

      <div class="production-machining-list">
        ${
          machiningOrders.length
            ? machiningOrders.map((entry) => renderProductionMachiningCard(entry)).join("")
            : `<div class="empty-state">Nenhuma ordem de usinagem enviada para produção.</div>`
        }
      </div>
    </section>
  `;
}

function renderProductionMachiningCard(entry) {
  const completedSteps = entry.order.steps.filter((step) => step.status === "Finalizada").length;
  const progress = entry.order.steps.length ? Math.round((completedSteps / entry.order.steps.length) * 100) : 0;
  const visibleSteps = getVisibleMachiningSteps(entry.order);

  return `
    <article class="table-card production-machining-card">
      <div class="production-machining-top">
        <div>
          <span class="machining-piece-code">${escapeHtml(entry.piece.code)}</span>
          <h4>${escapeHtml(entry.piece.name)}</h4>
          <p class="muted">${entry.order.steps.length} etapa(s) • ${completedSteps} concluída(s)</p>
        </div>
        <div class="production-machining-progress">
          <strong>${progress}%</strong>
          <span>${completedSteps}/${entry.order.steps.length} concluídas</span>
          <div class="production-machining-progressbar">
            <span style="width: ${progress}%"></span>
          </div>
        </div>
      </div>

      <div class="production-machining-steps">
        ${visibleSteps.map(({ step, index }) => renderProductionMachiningStep(entry.piece, entry.order, step, index)).join("")}
      </div>
    </article>
  `;
}

function renderProductionMachiningStep(piece, order, step, index) {
  const action = getProductionStepActionLabel(step.status);
  const disabled = isProductionStepAdvanceDisabled(order, step);

  return `
    <article class="production-machining-step">
      <div class="production-machining-step-main">
        <div class="production-machining-step-index">Etapa ${index + 1}</div>
        <div class="production-machining-step-grid">
          <div><span>Código da Ordem</span><strong>${escapeHtml(order.order_number)}</strong></div>
          <div><span>Status</span><strong>${escapeHtml(step.status === "Bloqueada" ? "Pendente" : step.status)}</strong></div>
          <div><span>Nome da Etapa</span><strong>${escapeHtml(step.name)}</strong></div>
          <div><span>Operador</span><strong>${escapeHtml(step.completed_by || step.operator || order.operator || "-")}</strong></div>
          <div><span>Data de Inicio</span><strong>${escapeHtml(step.started_at ? formatDateTime(step.started_at) : "-")}</strong></div>
          <div><span>Peça</span><strong>${escapeHtml(piece.name)}</strong></div>
          <div><span>Processo</span><strong>${escapeHtml(step.name)}</strong></div>
          <div><span>Máquina</span><strong>${escapeHtml(step.machine || "-")}</strong></div>
          <div><span>Tempo Estimado</span><strong>${formatProcessMinutes(step.estimated_minutes)}</strong></div>
        </div>
        <label class="production-machining-step-operator-field">
          <span>Trocar operador da etapa</span>
          <input
            type="text"
            value="${escapeHtml(step.operator || order.operator || "")}"
            data-machining-step-operator="${piece.id}|${order.id}|${index}"
          />
        </label>
      </div>
      <div class="production-machining-step-action">
        ${renderProductionStageStatusBadge(step.status)}
        <button
          class="${step.status === "Qualidade" ? "primary-button" : "inline-button"}"
          type="button"
          data-production-machining-advance="${piece.id}|${order.id}|${index}"
          ${disabled ? "disabled" : ""}
        >
          ${escapeHtml(action)}
        </button>
      </div>
    </article>
  `;
}

function productionPriorityCell(priority) {
  const normalized = String(priority || "media").toLowerCase();
  const config = {
    baixa: { label: "Baixa", className: "priority-chip priority-low" },
    media: { label: "Media", className: "priority-chip priority-medium" },
    alta: { label: "Alta", className: "priority-chip priority-high" },
    urgente: { label: "Urgente", className: "priority-chip priority-urgent" },
  }[normalized] || { label: "Media", className: "priority-chip priority-medium" };

  return `<span class="${config.className}">${config.label}</span>`;
}

function renderOptions(options, selectedValue = "") {
  return options
    .map((option) => `<option value="${option.value}" ${option.value === selectedValue ? "selected" : ""}>${option.label}</option>`)
    .join("");
}

function renderCustomersModule() {
  if (!hasPermission("customers", "view")) {
    return noPermissionTemplate("Seu perfil não possui acesso ao módulo de clientes.");
  }

  const canEdit = hasPermission("customers", "edit");
  const isFormOpen = state.openAccordionKey === "customer-form";
  const customers = state.moduleData.customers || [];
  const searchTerm = state.customerSearch.trim().toLowerCase();
  const filteredCustomers = customers.filter((item) => {
    const metadata = getCustomerMetadata(item);
    return [
      item.name,
      metadata.document,
      metadata.email,
      metadata.city,
    ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
  });

  return `
    <section class="module-panel customers-module">
      <div class="module-head customers-head">
        <div>
          <p class="eyebrow muted">Clientes</p>
          <h3>Cadastro de clientes</h3>
          <p class="muted">${customers.length} cliente(s) cadastrado(s)</p>
        </div>
        <div class="module-head-actions">
          ${canEdit ? `
            <button
              class="primary-button customer-create-button ${isFormOpen ? "is-open" : ""}"
              type="button"
              data-customer-toggle-form
            >
              <span>+ Novo Cliente</span>
              <span class="production-toggle-icon">${isFormOpen ? "▴" : "▾"}</span>
            </button>
          ` : ""}
        </div>
      </div>

      ${
        canEdit
          ? `
            <div class="customer-accordion-shell ${isFormOpen ? "open" : ""}">
              <div class="customer-accordion-card">
                <div class="customer-form-header">
                  <div>
                    <h4>${state.customerDraft.edit_id ? "Editar Cliente" : "Novo Cliente"}</h4>
                    <p class="muted">Cadastro comercial no mesmo padrão visual do ERP.</p>
                  </div>
                </div>

                <form id="customers-form" class="customer-form-grid">
                  <input type="hidden" name="edit_id" value="${escapeHtml(state.customerDraft.edit_id)}" />

                  <div class="customer-form-row">
                    <label>
                      Nome *
                      <input name="name" type="text" required value="${escapeHtml(state.customerDraft.name)}" />
                    </label>
                    <label>
                      CNPJ
                      <input name="cnpj" type="text" inputmode="numeric" placeholder="00.000.000/0000-00" value="${escapeHtml(state.customerDraft.cnpj)}" />
                    </label>
                    <label>
                      CPF
                      <input name="cpf" type="text" inputmode="numeric" placeholder="000.000.000-00" value="${escapeHtml(state.customerDraft.cpf)}" />
                    </label>
                  </div>

                  <div class="customer-form-row">
                    <label>
                      Email
                      <input name="email" type="email" placeholder="cliente@empresa.com" value="${escapeHtml(state.customerDraft.email)}" />
                    </label>
                    <label>
                      Telefone
                      <input name="phone" type="text" inputmode="numeric" placeholder="(11) 99999-9999" value="${escapeHtml(state.customerDraft.phone)}" />
                    </label>
                    <label>
                      Contato
                      <input name="contact" type="text" placeholder="Pessoa de contato" value="${escapeHtml(state.customerDraft.contact)}" />
                    </label>
                  </div>

                  <div class="customer-form-row">
                    <label>
                      Endereço
                      <input name="address" type="text" value="${escapeHtml(state.customerDraft.address)}" />
                    </label>
                    <label>
                      Cidade
                      <input name="city" type="text" value="${escapeHtml(state.customerDraft.city)}" />
                    </label>
                    <label>
                      Estado
                      <input name="state" type="text" maxlength="2" placeholder="SP" value="${escapeHtml(state.customerDraft.state)}" />
                    </label>
                  </div>

                  <div class="customer-form-row customer-form-row-full">
                    <label>
                      Observações
                      <textarea name="notes" placeholder="Anotações sobre o cliente">${escapeHtml(state.customerDraft.notes)}</textarea>
                    </label>
                  </div>

                  <div class="form-actions-row customer-form-actions">
                    <button class="ghost-button" type="button" data-customer-cancel>Cancelar</button>
                    <button class="primary-button" type="submit">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          `
          : `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`
      }

      <div class="table-actions single-search-row">
        <label class="search-input-shell">
          <span class="search-input-icon">⌕</span>
          <input id="customer-search-input" type="text" placeholder="Buscar cliente..." value="${escapeHtml(state.customerSearch)}" />
        </label>
      </div>

      <div class="table-card customer-table-card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CNPJ/CPF</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Cidade</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            ${
              filteredCustomers.length
                ? filteredCustomers.map((item) => renderCustomerRow(item, canEdit)).join("")
                : `<tr><td colspan="6"><div class="empty-state">Nenhum cliente encontrado.</div></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSalesModule() {
  if (!hasPermission("sales", "view")) {
    return noPermissionTemplate("Seu perfil não possui acesso ao módulo de vendas.");
  }

  const canEdit = hasPermission("sales", "edit");
  const canManageConfig = canManageSalesTemplates();
  const isFormOpen = state.openAccordionKey === "sales-form";
  const isContractOpen = state.openAccordionKey === "sales-contract-form";
  const sales = state.moduleData.sales || [];
  const searchTerm = state.salesSearch.trim().toLowerCase();
  const filteredSales = sales.filter((item) => {
    const metadata = getSaleMetadata(item);
    const itemNames = (metadata.items || []).map((saleItem) => saleItem.product_name).join(" ");
    const matchesSearch = !searchTerm || [
      item.customer_name,
      item.invoice_number,
      metadata.statusLabel,
      itemNames,
    ].some((value) => String(value || "").toLowerCase().includes(searchTerm));
    const matchesStatus = state.salesStatusFilter === "all" || metadata.status === state.salesStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const customerOptions = (state.moduleData.customers || []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));
  const salesSummaryLabel = `${sales.length} ${sales.length === 1 ? "venda registrada" : "vendas registradas"}`;

  return `
    <section class="module-panel sales-module">
      <div class="module-head sales-head">
        <div>
          <p class="eyebrow muted">Comercial</p>
          <h3>Vendas</h3>
          <p class="muted">${salesSummaryLabel}</p>
        </div>
        <div class="module-head-actions">
          ${
            canManageConfig
              ? `
                <button class="topbar-icon-button sales-config-button" type="button" data-sales-open-config aria-label="Configurações" title="Configurações">
                  <span aria-hidden="true">⚙</span>
                </button>
              `
              : ""
          }
          ${canEdit ? `
            <button class="primary-button sales-create-button ${isFormOpen && state.salesDraft.status === "finalized" ? "is-open" : ""}" type="button" data-sales-open-mode="finalized">
              <span>+ Nova Venda</span>
              <span class="production-toggle-icon">${isFormOpen && state.salesDraft.status === "finalized" ? "▴" : "▾"}</span>
            </button>
            <button class="ghost-button sales-create-button ${isFormOpen && state.salesDraft.status === "quote" ? "is-open" : ""}" type="button" data-sales-open-mode="quote">
              <span>Novo Orçamento</span>
              <span class="production-toggle-icon">${isFormOpen && state.salesDraft.status === "quote" ? "▴" : "▾"}</span>
            </button>
          ` : ""}
        </div>
      </div>

      ${
        canEdit
          ? `
            <div class="sales-accordion-shell ${isFormOpen ? "open" : ""}">
              <div class="sales-accordion-card">
                <div class="sales-form-header">
                  <div>
                    <h4>${state.salesDraft.edit_id ? "Editar Venda" : state.salesDraft.status === "quote" ? "Novo Orçamento" : "Nova Venda"}</h4>
                    <p class="muted">Fluxo comercial com integração entre clientes, produtos e produção.</p>
                  </div>
                </div>

                <form id="sales-form" class="sales-form-grid">
                  <input type="hidden" name="edit_id" value="${escapeHtml(state.salesDraft.edit_id)}" />
                  <input type="hidden" name="production_generated" value="${state.salesDraft.production_generated ? "true" : "false"}" />

                  <div class="sales-form-row">
                    <label>
                      Cliente *
                      <select name="customer_id" required>
                        <option value="">Selecione um cliente</option>
                        ${renderOptions(customerOptions, state.salesDraft.customer_id)}
                      </select>
                    </label>
                    <label>
                      CNPJ
                      <input name="cnpj" type="text" readonly value="${escapeHtml(state.salesDraft.cnpj)}" />
                    </label>
                    <label>
                      Endereço
                      <input name="address" type="text" readonly value="${escapeHtml(state.salesDraft.address)}" />
                    </label>
                  </div>

                  <div class="sales-form-row">
                    <label>
                      Nº da nota fiscal
                      <input name="invoice_number" type="text" placeholder="NF-0001" value="${escapeHtml(state.salesDraft.invoice_number)}" />
                    </label>
                    <label>
                      Data da Venda *
                      <input name="sale_date" type="date" required value="${escapeHtml(state.salesDraft.sale_date)}" />
                    </label>
                    <label>
                      Data de Entrega *
                      <input name="delivery_date" type="date" required value="${escapeHtml(state.salesDraft.delivery_date)}" />
                    </label>
                    <label>
                      Pagamento
                      <select name="payment_method">
                        ${renderOptions([
                          { value: "", label: "Selecione" },
                          { value: "boleto", label: "Boleto" },
                          { value: "pix", label: "Pix" },
                          { value: "transferencia", label: "Transferência" },
                          { value: "cartao", label: "Cartão" },
                          { value: "dinheiro", label: "Dinheiro" },
                          { value: "cheque", label: "Cheque" },
                          { value: "negociado_com_o_dono", label: "Negociado" },
                        ], state.salesDraft.payment_method)}
                      </select>
                    </label>
                  </div>

                  <div class="sales-form-row">
                    <label>
                      Status da venda *
                      <select name="status" required>
                        ${renderOptions([
                          { value: "quote", label: "Orçamento" },
                          { value: "finalized", label: "Venda Finalizada" },
                        ], state.salesDraft.status)}
                      </select>
                    </label>
                    <label>
                      Contrato de venda
                      <input name="contract_number" type="text" readonly placeholder="Gerado automaticamente" value="${escapeHtml(state.salesDraft.contract_number)}" />
                    </label>
                  </div>

                  <div class="sales-items-panel">
                    <div class="sales-items-header">
                      <h5>Itens da Venda</h5>
                      <button class="ghost-button" type="button" data-sales-add-item>+ Adicionar</button>
                    </div>

                    <div class="sales-items-list">
                      ${state.salesDraft.items.map((item, index) => renderSalesItemRow(item, index)).join("")}
                    </div>

                    <div class="sales-totals-grid">
                      <article class="sales-total-card">
                        <span>Subtotal</span>
                        <strong data-sales-total="subtotal">${formatCurrency(getSalesDraftTotals().subtotal)}</strong>
                      </article>
                      <article class="sales-total-card">
                        <span>Desconto</span>
                        <strong data-sales-total="discount">${formatCurrency(getSalesDraftTotals().discount)}</strong>
                      </article>
                      <article class="sales-total-card sales-total-card-primary">
                        <span>Total final</span>
                        <strong data-sales-total="total">${formatCurrency(getSalesDraftTotals().total)}</strong>
                      </article>
                    </div>
                  </div>

                  <div class="sales-form-row sales-form-row-full">
                    <label>
                      Observações
                      <textarea name="contract_notes" placeholder="Observações da venda">${escapeHtml(state.salesDraft.contract_notes)}</textarea>
                    </label>
                  </div>

                  <div class="form-actions-row sales-form-actions">
                    <button class="ghost-button" type="button" data-sales-cancel>Cancelar</button>
                    <button class="secondary-button" type="button" data-sales-draft-preview="${state.salesDraft.status}">Gerar prévia</button>
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
            <div class="sales-accordion-shell sales-contract-shell ${isContractOpen ? "open" : ""}">
              <div class="sales-accordion-card sales-contract-card">
                <div class="sales-form-header">
                  <div>
                    <h4>Cadastrar Contrato</h4>
                    <p class="muted">Contrato preenchido automaticamente a partir da venda selecionada.</p>
                  </div>
                </div>

                <form id="sales-contract-form" class="sales-form-grid">
                  <input type="hidden" name="sale_id" value="${escapeHtml(state.salesContractDraft.sale_id)}" />

                  <div class="sales-form-row">
                    <label>
                      Cliente
                      <input name="customer_name" type="text" readonly value="${escapeHtml(state.salesContractDraft.customer_name)}" />
                    </label>
                    <label>
                      CNPJ
                      <input name="cnpj" type="text" readonly value="${escapeHtml(state.salesContractDraft.cnpj)}" />
                    </label>
                    <label>
                      Endereço
                      <input name="address" type="text" readonly value="${escapeHtml(state.salesContractDraft.address)}" />
                    </label>
                    <label>
                      Nota Fiscal
                      <input name="invoice_number" type="text" readonly value="${escapeHtml(state.salesContractDraft.invoice_number)}" />
                    </label>
                  </div>

                  <div class="sales-form-row">
                    <label>
                      Data da Venda
                      <input name="sale_date" type="date" readonly value="${escapeHtml(state.salesContractDraft.sale_date)}" />
                    </label>
                    <label>
                      Data de Entrega
                      <input name="delivery_date" type="date" readonly value="${escapeHtml(state.salesContractDraft.delivery_date)}" />
                    </label>
                    <label>
                      Pagamento
                      <input name="payment_method" type="text" readonly value="${escapeHtml(getPaymentMethodLabel(state.salesContractDraft.payment_method))}" />
                    </label>
                    <label>
                      Status
                      <input name="status_label" type="text" readonly value="${escapeHtml(state.salesContractDraft.status === "finalized" ? "Venda Finalizada" : "Orçamento")}" />
                    </label>
                  </div>

                  <div class="sales-form-row">
                    <label>
                      Contrato de venda
                      <input name="contract_number" type="text" readonly value="${escapeHtml(state.salesContractDraft.contract_number)}" placeholder="Gerado automaticamente" />
                    </label>
                    <label class="sales-contract-total">
                      Total da venda
                      <input name="total_amount_label" type="text" readonly value="${escapeHtml(formatCurrency(state.salesContractDraft.total_amount))}" />
                    </label>
                  </div>

                  <div class="sales-form-row sales-form-row-full">
                    <label>
                      Itens da venda
                      <textarea name="items_label" readonly>${escapeHtml(state.salesContractDraft.items_label)}</textarea>
                    </label>
                  </div>

                  <div class="sales-form-row sales-form-row-full">
                    <label>
                      Observações do contrato
                      <textarea name="contract_notes" placeholder="Cláusulas, observações e detalhes do contrato">${escapeHtml(state.salesContractDraft.contract_notes)}</textarea>
                    </label>
                  </div>

                  <div class="form-actions-row sales-form-actions">
                    <button class="ghost-button" type="button" data-sales-contract-cancel>Cancelar</button>
                    <button class="secondary-button" type="button" data-sales-contract-preview="${escapeHtml(state.salesContractDraft.sale_id)}">Visualizar contrato</button>
                    <button class="primary-button" type="submit">Salvar contrato</button>
                  </div>
                </form>
              </div>
            </div>
          `
          : ""
      }

      <div class="table-actions sales-filters-row">
        <label class="search-input-shell">
          <span class="search-input-icon">⌕</span>
          <input id="sales-search-input" type="text" placeholder="Buscar venda..." value="${escapeHtml(state.salesSearch)}" />
        </label>
        <label>
          Status
          <select id="sales-status-filter">
            ${renderOptions([
              { value: "all", label: "Todos" },
              { value: "quote", label: "Orçamento" },
              { value: "finalized", label: "Venda Finalizada" },
            ], state.salesStatusFilter)}
          </select>
        </label>
      </div>

      <div class="table-card sales-table-card">
        ${
          filteredSales.length
            ? `
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Data da venda</th>
                    <th>Entrega</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredSales.map((item) => renderSaleRow(item, canEdit)).join("")}
                </tbody>
              </table>
            `
            : `
              <div class="production-empty-state">
                <div class="production-empty-icon">◨</div>
                <strong>Nenhuma venda encontrada</strong>
              </div>
            `
        }
      </div>
      ${state.salesConfigModalOpen ? renderSalesConfigModal(canManageConfig) : ""}
      ${state.salesDocumentPreview.open ? renderSalesDocumentPreviewModal() : ""}
    </section>
  `;
}

function renderCustomerRow(item, canEdit) {
  const metadata = getCustomerMetadata(item);

  return `
    <tr>
      <td>
        <strong>${escapeHtml(item.name || "-")}</strong>
        <div class="table-inline-copy muted">${escapeHtml(metadata.contact || "Sem contato definido")}</div>
      </td>
      <td>${escapeHtml(metadata.document || "-")}</td>
      <td>${escapeHtml(metadata.email || "-")}</td>
      <td>${escapeHtml(metadata.phone || "-")}</td>
      <td>${escapeHtml(metadata.city || "-")}</td>
      <td>${renderCustomerActionCell(item, canEdit)}</td>
    </tr>
  `;
}

function renderCustomerActionCell(item, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  return `
    <div class="customer-action-group">
      <button class="inline-button icon-inline-button" type="button" data-customer-edit-id="${item.id}" aria-label="Editar cliente">✎</button>
      <button class="inline-button danger-button icon-inline-button" type="button" data-customer-delete-id="${item.id}" aria-label="Excluir cliente">⌫</button>
    </div>
  `;
}

function renderSaleRow(item, canEdit) {
  const metadata = getSaleMetadata(item);
  const itemSummary = metadata.items.length
    ? metadata.items.map((saleItem) => `${saleItem.product_name || "-"} x ${formatWholeQuantity(saleItem.quantity || 0)}`).join(" • ")
    : "Sem itens";
  return `
    <tr>
      <td>
        <strong>${escapeHtml(item.customer_name || "-")}</strong>
        <div class="table-inline-copy muted">${escapeHtml(item.sale_number || metadata.contractNumber || "-")}</div>
        <div class="table-inline-copy muted">${escapeHtml(itemSummary)}</div>
      </td>
      <td>${formatDate(item.sale_date)}</td>
      <td>${formatDate(item.delivery_date)}</td>
      <td>${escapeHtml(getPaymentMethodLabel(metadata.paymentMethod))}</td>
      <td>${saleStatusCell(metadata.status)}</td>
      <td>${formatCurrency(metadata.total)}</td>
      <td>${renderSaleActionCell(item, metadata, canEdit)}</td>
    </tr>
  `;
}

function renderSaleActionCell(item, metadata, canEdit) {
  const canSendToProduction = metadata.status === "finalized"
    && !metadata.productionGenerated
    && !(metadata.productionOrderIds || []).length;

  if (!canEdit) {
    return `
      <div class="action-button-group">
        <button class="inline-button" type="button" data-sales-generate-document="quote" data-sales-document-id="${item.id}">Visualizar</button>
      </div>
    `;
  }

  return `
    <div class="action-button-group">
      <button class="inline-button" type="button" data-sales-generate-document="${metadata.status === "quote" ? "quote" : "sale"}" data-sales-document-id="${item.id}">
        ${metadata.status === "quote" ? "Orçamento" : "Venda PDF"}
      </button>
      ${
        metadata.status === "quote"
          ? `<button class="inline-button" type="button" data-sales-send-document="${item.id}">Enviar cliente</button>`
          : ""
      }
      <button class="inline-button" type="button" data-sales-contract-id="${item.id}">Contrato</button>
      <button class="inline-button" type="button" data-sales-view-id="${item.id}">Visualizar</button>
      <button class="inline-button" type="button" data-sales-edit-id="${item.id}">Editar</button>
      ${
        metadata.status === "quote"
          ? `<button class="inline-button movement-button" type="button" data-sales-finalize-id="${item.id}">Finalizar venda</button>`
          : ""
      }
      ${
        canSendToProduction
          ? `<button class="inline-button movement-button" type="button" data-sales-send-production-id="${item.id}">Enviar para produção</button>`
          : ""
      }
      <button class="inline-button danger-button" type="button" data-sales-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderSalesConfigModal(canManageConfig) {
  const activeTab = state.salesConfigTab || "quote";
  const settings = state.salesDocumentSettings;
  const previewType = activeTab === "company" ? "quote" : activeTab;
  const template = getSalesTemplate(previewType);
  const preview = resolveSalesTemplateContent(previewType, null);
  const hasTemplatePdf = Boolean(template.pdf_template_data_url);
  const templatePdfSize = getSalesTemplatePdfSize(template.pdf_template_data_url);
  const tabs = [
    { key: "quote", label: "Orçamento" },
    { key: "sale", label: "Venda" },
    { key: "contract", label: "Contrato" },
    { key: "company", label: "Dados da Empresa" },
  ];

  return `
    <div class="modal-overlay sales-config-overlay" data-sales-config-close>
      <div class="modal-card sales-config-modal" role="dialog" aria-modal="true" aria-label="Configuração de modelos comerciais" data-sales-config-card>
        <div class="sales-config-header">
          <div>
            <p class="eyebrow muted">Modelos Comerciais</p>
            <h3>Config</h3>
            <p class="muted">Configure os modelos de orçamento, venda, contrato e os dados fixos da empresa.</p>
          </div>
          <div class="sales-config-header-actions">
            ${canManageConfig ? `<span class="status-chip chip-green">Edição liberada</span>` : `<span class="status-chip chip-blue">Somente leitura</span>`}
            <button class="ghost-button" type="button" data-sales-config-close-button>Fechar</button>
          </div>
        </div>

        <div class="sales-config-tabs">
          ${tabs.map((tab) => `
            <button class="sales-config-tab ${tab.key === activeTab ? "active" : ""}" type="button" data-sales-config-tab="${tab.key}">
              ${tab.label}
            </button>
          `).join("")}
        </div>

        <div class="sales-config-layout">
          <section class="sales-config-editor">
            ${
              activeTab === "company"
                ? renderSalesCompanySettingsForm(settings.company, settings.numbering, canManageConfig)
                : renderSalesTemplateSettingsForm(activeTab, template, canManageConfig)
            }
          </section>

          <aside class="sales-config-preview-panel">
            <div class="sales-config-preview-head">
              <div>
                <span class="eyebrow muted">Pré-visualização</span>
                <h4>${activeTab === "company" ? "Orçamento Padrão" : template.title}</h4>
              </div>
              <div class="sales-config-preview-actions">
                ${
                  hasTemplatePdf
                    ? `<button class="ghost-button" type="button" data-sales-template-open-pdf="${previewType}">Abrir PDF base</button>`
                    : ""
                }
                <button class="ghost-button" type="button" data-sales-template-preview="${previewType}">Visualizar modelo</button>
                <button class="secondary-button" type="button" data-sales-template-generate="${previewType}">Gerar prévia</button>
              </div>
            </div>
            <div class="sales-config-placeholders">
              ${getSalesTemplatePlaceholderList(previewType).map((item) => `<code>${item}</code>`).join("")}
            </div>
            ${
              hasTemplatePdf
                ? `
                  <section class="sales-config-pdf-preview-card">
                    <div class="sales-config-pdf-preview-head">
                      <div>
                        <strong>PDF base carregado</strong>
                        <p class="muted">${escapeHtml(template.pdf_template_name || "modelo.pdf")} • ${formatFileSize(templatePdfSize)}</p>
                      </div>
                      <span class="status-chip chip-blue">Referência visual</span>
                    </div>
                    <iframe
                      class="sales-config-pdf-frame"
                      title="PDF base do modelo ${escapeHtml(template.title || previewType)}"
                      src="${template.pdf_template_data_url}"
                    ></iframe>
                    <p class="muted">
                      O PDF serve como base visual do documento. As variáveis e ajustes continuam no editor do modelo abaixo.
                    </p>
                  </section>
                `
                : ""
            }
            <div class="sales-document-preview-frame">${preview.html}</div>
          </aside>
        </div>
      </div>
    </div>
  `;
}

function renderSalesTemplateSettingsForm(type, template, canManageConfig) {
  const disabled = canManageConfig ? "" : "disabled";
  const isContract = type === "contract";
  const pdfSize = getSalesTemplatePdfSize(template.pdf_template_data_url);

  return `
    <form id="sales-config-template-form" class="sales-config-form" data-sales-config-form="${type}">
      <input type="hidden" name="template_type" value="${type}" />
      <div class="sales-config-grid">
        <label>
          Nome do modelo
          <input name="name" type="text" value="${escapeHtml(template.name)}" ${disabled} />
        </label>
        <label>
          Título do documento
          <input name="title" type="text" value="${escapeHtml(template.title)}" ${disabled} />
        </label>
        <label>
          Validade do orçamento
          <input name="validity_days" type="number" min="0" step="1" value="${escapeHtml(template.validity_days)}" ${disabled} />
        </label>
      </div>

      <label>
        Cabeçalho
        <textarea name="header" ${disabled}>${escapeHtml(template.header)}</textarea>
      </label>
      ${
        isContract
          ? `
            <label>
              Resumo inicial do contrato
              <textarea name="presentation_text" ${disabled}>${escapeHtml(template.presentation_text)}</textarea>
            </label>
          `
          : `
            <label>
              Texto de apresentação
              <textarea name="presentation_text" ${disabled}>${escapeHtml(template.presentation_text)}</textarea>
            </label>
          `
      }
      <div class="sales-config-grid">
        <label>
          Condições de pagamento
          <textarea name="payment_terms" ${disabled}>${escapeHtml(template.payment_terms)}</textarea>
        </label>
        <label>
          Prazo de entrega
          <textarea name="delivery_terms" ${disabled}>${escapeHtml(template.delivery_terms)}</textarea>
        </label>
      </div>
      <div class="sales-config-grid">
        <label>
          Garantia
          <textarea name="warranty" ${disabled}>${escapeHtml(template.warranty)}</textarea>
        </label>
        <label>
          Dados de contato
          <textarea name="contact_details" ${disabled}>${escapeHtml(template.contact_details)}</textarea>
        </label>
      </div>
      <label>
        Observações
        <textarea name="notes" ${disabled}>${escapeHtml(template.notes)}</textarea>
      </label>
      <label>
        Assinatura
        <textarea name="signature" ${disabled}>${escapeHtml(template.signature)}</textarea>
      </label>
      <label>
        Mensagem final
        <textarea name="final_message" ${disabled}>${escapeHtml(template.final_message)}</textarea>
      </label>
      <label>
        Rodapé
        <textarea name="footer" ${disabled}>${escapeHtml(template.footer)}</textarea>
      </label>
      <div class="sales-config-pdf-card">
        <div class="sales-config-pdf-copy">
          <strong>PDF base do modelo</strong>
          <p class="muted">
            Envie o PDF padrão usado pela sua equipe para orçamento, venda ou contrato. Limite de ${formatFileSize(SALES_TEMPLATE_PDF_MAX_SIZE)}.
          </p>
        </div>
        <div class="sales-config-grid">
          <label>
            Arquivo PDF
            <input name="pdf_template_file" type="file" accept="application/pdf,.pdf" ${disabled} />
          </label>
          <label>
            Última atualização
            <input
              name="pdf_template_updated_at"
              type="text"
              value="${escapeHtml(template.pdf_template_updated_at ? formatDateTime(template.pdf_template_updated_at) : "Nenhum PDF carregado")}"
              readonly
            />
          </label>
        </div>
        ${
          template.pdf_template_data_url
            ? `
              <div class="sales-config-file-pill">
                <div>
                  <strong>${escapeHtml(template.pdf_template_name || "modelo.pdf")}</strong>
                  <div class="table-inline-copy muted">${formatFileSize(pdfSize)} • PDF pronto para consulta</div>
                </div>
                <div class="sales-config-file-actions">
                  <button class="ghost-button" type="button" data-sales-template-open-pdf="${type}">Abrir PDF</button>
                  ${
                    canManageConfig
                      ? `<button class="ghost-button danger-button" type="button" data-sales-template-remove-pdf="${type}">Remover PDF</button>`
                      : ""
                  }
                </div>
              </div>
            `
            : `
              <p class="muted">
                Nenhum PDF carregado ainda. O sistema continuará usando somente o modelo editável com placeholders.
              </p>
            `
        }
      </div>
      <label>
        ${isContract ? "Texto completo do contrato" : "Editor do modelo (HTML com placeholders)"}
        <textarea name="body_html" class="sales-config-html-editor ${isContract ? "sales-config-contract-editor" : ""}" ${disabled}>${escapeHtml(template.body_html)}</textarea>
      </label>
      ${
        isContract
          ? `
            <p class="muted">
              Escreva aqui o contrato completo. Use os placeholders para preencher automaticamente dados do cliente,
              empresa, valores, itens e condições negociadas. O cabeçalho e o rodapé permanecem em campos separados.
            </p>
          `
          : ""
      }

      <div class="form-actions-row sales-config-actions">
        ${
          canManageConfig
            ? `
              <button class="ghost-button" type="button" data-sales-template-restore="${type}">Restaurar padrão</button>
              <button class="secondary-button" type="button" data-sales-template-save="${type}">Salvar modelo</button>
              <button class="primary-button" type="button" data-sales-template-default="${type}">Definir como padrão</button>
            `
            : ""
        }
      </div>
    </form>
  `;
}

function renderSalesCompanySettingsForm(company, numbering, canManageConfig) {
  const disabled = canManageConfig ? "" : "disabled";
  const yearSuffix = String(new Date().getFullYear()).slice(-2);
  return `
    <form id="sales-company-settings-form" class="sales-config-form" data-sales-config-form="company">
      <div class="sales-config-grid">
        <label>
          Nome da empresa
          <input name="company_name" type="text" value="${escapeHtml(company.company_name)}" ${disabled} />
        </label>
        <label>
          CNPJ
          <input name="cnpj" type="text" value="${escapeHtml(company.cnpj)}" ${disabled} />
        </label>
      </div>
      <div class="sales-config-grid">
        <label>
          Telefone
          <input name="phone" type="text" value="${escapeHtml(company.phone)}" ${disabled} />
        </label>
        <label>
          E-mail
          <input name="email" type="email" value="${escapeHtml(company.email)}" ${disabled} />
        </label>
      </div>
      <div class="sales-config-grid">
        <label>
          Site
          <input name="site" type="text" value="${escapeHtml(company.site)}" ${disabled} />
        </label>
        <label>
          Endereço
          <input name="address" type="text" value="${escapeHtml(company.address)}" ${disabled} />
        </label>
      </div>
      <div class="sales-config-grid">
        <label>
          Responsável
          <input name="responsible_name" type="text" value="${escapeHtml(company.responsible_name)}" ${disabled} />
        </label>
        <label>
          Cargo do responsável
          <input name="responsible_role" type="text" value="${escapeHtml(company.responsible_role)}" ${disabled} />
        </label>
      </div>
      <label>
        Assinatura do responsável
        <textarea name="signature" ${disabled}>${escapeHtml(company.signature)}</textarea>
      </label>
      <div class="sales-config-numbering-card">
        <h4>Numeração automática</h4>
        <p class="muted">A numeração agora é gerada automaticamente no backend, por tipo e por ano, sem edição manual.</p>
        <div class="sales-config-numbering-grid">
          <div><strong>Orçamento</strong><span>ORC-01${yearSuffix}</span></div>
          <div><strong>Venda</strong><span>VEN-01${yearSuffix}</span></div>
          <div><strong>Contrato</strong><span>CONT-01${yearSuffix}</span></div>
        </div>
      </div>
      <div class="sales-config-grid">
        <label>
          Logo
          <input name="logo_file" type="file" accept="image/*" ${disabled} />
        </label>
      </div>
      ${
        company.logo
          ? `
            <div class="sales-company-logo-preview">
              <img src="${company.logo}" alt="Logo da empresa" />
              ${canManageConfig ? `<button class="ghost-button" type="button" data-sales-company-remove-logo>Remover logo</button>` : ""}
            </div>
          `
          : ""
      }
      <div class="form-actions-row sales-config-actions">
        ${
          canManageConfig
            ? `<button class="primary-button" type="button" data-sales-company-save>Salvar dados da empresa</button>`
            : ""
        }
      </div>
    </form>
  `;
}

function renderSalesDocumentPreviewModal() {
  return `
    <div class="modal-overlay sales-document-modal-overlay" data-sales-preview-close>
      <div class="modal-card sales-document-modal" role="dialog" aria-modal="true" aria-label="Visualização do documento comercial" data-sales-preview-card>
        <div class="sales-config-header">
          <div>
            <p class="eyebrow muted">Documento Comercial</p>
            <h3>${escapeHtml(state.salesDocumentPreview.title || "Previa")}</h3>
            <p class="muted">Documento pronto para impressão, exportação em PDF e envio ao cliente.</p>
          </div>
          <div class="sales-config-header-actions">
            ${
              state.salesDocumentPreview.templatePdfDataUrl
                ? `<button class="ghost-button" type="button" data-sales-preview-open-template-pdf>PDF base</button>`
                : ""
            }
            <button class="secondary-button" type="button" data-sales-preview-export>Baixar PDF</button>
            <button class="ghost-button" type="button" data-sales-preview-print>Imprimir</button>
            <button class="primary-button" type="button" data-sales-preview-send>Enviar ao cliente</button>
            <button class="ghost-button" type="button" data-sales-preview-close-button>Fechar</button>
          </div>
        </div>
        ${
          state.salesDocumentPreview.templatePdfDataUrl
            ? `
              <div class="sales-config-pdf-preview-card sales-config-pdf-preview-inline">
                <div class="sales-config-pdf-preview-head">
                  <div>
                    <strong>PDF base vinculado</strong>
                    <p class="muted">${escapeHtml(state.salesDocumentPreview.templatePdfName || "modelo.pdf")}</p>
                  </div>
                  <span class="status-chip chip-blue">Modelo original</span>
                </div>
              </div>
            `
            : ""
        }
        <div class="sales-document-preview-frame sales-document-preview-modal-frame">${state.salesDocumentPreview.html}</div>
      </div>
    </div>
  `;
}

function renderSalesItemRow(item, index) {
  const productOptions = (state.moduleData.products || [])
    .filter((product) => isProductVisibleInCommercialDocuments(product) || product.id === item.product_id)
    .map((product) => ({
      value: product.id,
      label: `${product.name} (${product.code})`,
    }));
  const subtotal = Number(item.quantity || 0) * Number(item.unit_price || 0) - Number(item.discount || 0);

  return `
    <article class="sales-item-row" data-sales-item-index="${index}">
      <label>
        Produto
        <select data-sales-item-field="product_id" data-sales-item-index="${index}">
          <option value="">Selecione um produto</option>
          ${renderOptions(productOptions, item.product_id)}
        </select>
      </label>
      <label>
        Código
        <input data-sales-item-field="product_code" data-sales-item-index="${index}" type="text" readonly value="${escapeHtml(item.product_code)}" />
      </label>
      <label>
        Quantidade
        <input data-sales-item-field="quantity" data-sales-item-index="${index}" type="number" min="1" step="1" value="${escapeHtml(item.quantity)}" />
      </label>
      <label>
        Valor unitário
        <input
          data-sales-item-field="unit_price"
          data-sales-item-index="${index}"
          data-currency-input="true"
          data-currency-allow-empty="true"
          type="text"
          inputmode="decimal"
          value="${escapeHtml(item.unit_price)}"
        />
      </label>
      <label>
        Desconto
        <input
          data-sales-item-field="discount"
          data-sales-item-index="${index}"
          data-currency-input="true"
          data-currency-allow-empty="true"
          type="text"
          inputmode="decimal"
          value="${escapeHtml(item.discount)}"
        />
      </label>
      <div class="sales-item-subtotal">
        <span>Subtotal</span>
        <strong data-sales-item-subtotal="${index}">${formatCurrency(subtotal)}</strong>
      </div>
      <button class="inline-button danger-button sales-item-remove" type="button" data-sales-remove-item="${index}">Remover</button>
    </article>
  `;
}

function buildPurchaseRequesterOptions() {
  return (state.moduleData.users || []).map((user) => ({
    value: user.id,
    label: user.full_name,
  }));
}

function renderPurchaseItemRow(item, index) {
  return `
    <article class="purchase-item-row" data-purchase-item-index="${index}">
      <label>
        Produto / Item solicitado
        <input data-purchase-item-field="product_name" data-purchase-item-index="${index}" type="text" value="${escapeHtml(item.product_name)}" />
      </label>
      <label>
        Descrição
        <input data-purchase-item-field="description" data-purchase-item-index="${index}" type="text" value="${escapeHtml(item.description)}" />
      </label>
      <label>
        Quantidade
        <input data-purchase-item-field="quantity" data-purchase-item-index="${index}" type="number" min="1" step="1" inputmode="numeric" value="${escapeHtml(item.quantity)}" />
      </label>
      <label>
        Unidade
        <input data-purchase-item-field="unit" data-purchase-item-index="${index}" type="text" value="${escapeHtml(item.unit)}" />
      </label>
      <label>
        Medidas
        <input data-purchase-item-field="measures" data-purchase-item-index="${index}" type="text" placeholder="Ex.: 1200 x 800 x 3 mm" value="${escapeHtml(item.measures)}" />
      </label>
      <button class="inline-button danger-button sales-item-remove" type="button" data-purchase-remove-item="${index}">Remover</button>
    </article>
  `;
}

function renderPurchaseUploadField(label, key, files, accept, multiple = false) {
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
        ${renderPurchaseFileList(files, key)}
      </div>
    </section>
  `;
}

function renderPurchaseFileList(files, key) {
  if (!files.length) {
    return `<div class="empty-state compact-empty">Nenhum arquivo enviado.</div>`;
  }

  return files
    .map((file, index) => `
      <article class="bom-file-card">
        <div>
          <strong>${escapeHtml(file.name)}</strong>
          <div class="table-inline-copy muted">${formatFileSize(file.size)} • ${escapeHtml(file.type || "arquivo")}</div>
        </div>
        <button class="inline-button danger-button" type="button" data-purchase-remove-file="${key}" data-purchase-file-index="${index}">Remover</button>
      </article>
    `)
    .join("");
}

function renderPurchaseRow(item, canEdit) {
  return `
    <tr>
      <td>
        <strong>${escapeHtml(item.metadata.requester_name || "-")}</strong>
        <div class="table-inline-copy muted">${escapeHtml(item.metadata.primaryItemLabel || "Sem itens")}</div>
        <div class="table-inline-copy muted">${escapeHtml(item.metadata.primaryMeasuresLabel || "Sem medidas")}</div>
      </td>
      <td>${escapeHtml(item.metadata.department || "-")}</td>
      <td>${purchaseUrgencyCell(item.metadata.urgency)}</td>
      <td>${purchaseStatusCell(item.metadata.status)}</td>
      <td>${formatDateTime(item.created_at)}</td>
      <td>${purchaseActionCell(item, canEdit)}</td>
    </tr>
  `;
}

function renderPurchasesModule() {
  if (!hasPermission("purchases", "view")) {
    return noPermissionTemplate("Seu perfil não possui acesso ao módulo de compras.");
  }

  const canEdit = hasPermission("purchases", "edit");
  const isRequestFormOpen = state.openAccordionKey === "purchase-form";
  const isConclusionFormOpen = state.openAccordionKey === "purchase-conclusion-form";
  const requests = (state.moduleData.purchases || []).map((item) => ({
    ...item,
    metadata: getPurchaseRequestMetadata(item),
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
        ${renderKpiCard({
          label: "Solicitações",
          value: requests.length,
          note: `${pendingCount} pendente(s) para analise`,
          icon: "◧",
          tone: "blue",
        })}
        ${renderKpiCard({
          label: "Em Compra",
          value: inPurchaseCount,
          note: inPurchaseCount ? "Pedidos em andamento" : "Nenhuma compra em andamento",
          icon: "◎",
          tone: "amber",
        })}
        ${renderKpiCard({
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
                  <input type="hidden" name="edit_id" value="${escapeHtml(state.purchaseDraft.edit_id)}" />

                  <div class="purchase-form-row">
                    ${
                      buildPurchaseRequesterOptions().length
                        ? `
                          <label>
                            Solicitante *
                            <select name="requester_id" required>
                              <option value="">Selecione um solicitante</option>
                              ${renderOptions(buildPurchaseRequesterOptions(), state.purchaseDraft.requester_id)}
                            </select>
                          </label>
                        `
                        : `
                          <label>
                            Solicitante *
                            <input name="requester_name" type="text" required value="${escapeHtml(state.purchaseDraft.requester_name)}" />
                          </label>
                        `
                    }
                    <label>
                      Departamento *
                      <select name="department" required>
                        ${renderOptions([
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
                        ${renderOptions([
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
                      ${state.purchaseDraft.items.map((item, index) => renderPurchaseItemRow(item, index)).join("")}
                    </div>

                  </div>

                  <div class="purchase-form-row purchase-form-row-full">
                    <label>
                      Justificativa
                      <textarea name="justification" placeholder="Explique o motivo da compra">${escapeHtml(state.purchaseDraft.justification)}</textarea>
                    </label>
                  </div>

                  <div class="form-actions-row purchase-form-actions">
                    <button class="ghost-button" type="button" data-purchase-cancel>Cancelar</button>
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
                  <input type="hidden" name="request_id" value="${escapeHtml(state.purchaseConclusionDraft.request_id)}" />

                  <div class="purchase-form-row">
                    <label>
                      Número do pedido
                      <input name="order_number" type="text" placeholder="PED-20260407-001" value="${escapeHtml(state.purchaseConclusionDraft.order_number)}" />
                    </label>
                    <label>
                      Número da nota fiscal
                      <input name="invoice_number" type="text" placeholder="NF-000123" value="${escapeHtml(state.purchaseConclusionDraft.invoice_number)}" />
                    </label>
                    <label>
                      Valor total da compra *
                      <input
                        name="total_amount"
                        type="text"
                        inputmode="decimal"
                        data-currency-input="true"
                        data-currency-allow-empty="true"
                        value="${escapeHtml(state.purchaseConclusionDraft.total_amount)}"
                      />
                    </label>
                    <label>
                      Forma de Pagamento *
                      <select name="payment_method" required>
                        ${renderOptions([
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
                      <input name="purchase_date" type="date" value="${escapeHtml(state.purchaseConclusionDraft.purchase_date)}" />
                    </label>
                    <label>
                      Fornecedor
                      <input name="supplier" type="text" placeholder="Fornecedor" value="${escapeHtml(state.purchaseConclusionDraft.supplier)}" />
                    </label>
                  </div>

                  <div class="purchase-form-row purchase-form-row-full">
                    <label>
                      Observações da compra
                      <textarea name="purchase_notes" placeholder="Detalhes da compra">${escapeHtml(state.purchaseConclusionDraft.purchase_notes)}</textarea>
                    </label>
                  </div>

                  <div class="purchase-upload-grid">
                    ${renderPurchaseUploadField("Arquivo do pedido", "order_files", state.purchaseConclusionDraft.order_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx")}
                    ${renderPurchaseUploadField("Arquivo da nota fiscal", "invoice_files", state.purchaseConclusionDraft.invoice_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx")}
                    ${renderPurchaseUploadField("Comprovantes adicionais", "attachment_files", state.purchaseConclusionDraft.attachment_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx", true)}
                    ${
                      state.purchaseConclusionDraft.payment_method === "Boleto"
                        ? renderPurchaseUploadField("Boletos", "boleto_files", state.purchaseConclusionDraft.boleto_files, ".pdf,.jpg,.jpeg,.png,.doc,.docx", true)
                        : ""
                    }
                  </div>

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
            <input id="purchase-search-input" type="text" placeholder="Buscar..." value="${escapeHtml(state.purchaseSearch)}" />
          </label>
          <label>
            Status
            <select id="purchase-status-filter">
              ${renderOptions([
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
                  ${filteredRequests.map(({ id, created_at, metadata }) => renderPurchaseRow({ id, created_at, metadata }, canEdit)).join("")}
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
    </section>
  `;
}

function renderCrudForm(formId, fields, canEdit) {
  if (!canEdit) {
    return `<div class="empty-state">Seu perfil pode visualizar este módulo, mas não pode editar.</div>`;
  }

  return `
    <form id="${formId}" class="table-actions">
      <input type="hidden" name="edit_id" />
      ${fields.join("")}
      <button class="primary-button" type="submit">Salvar</button>
      <button class="ghost-button" type="button" data-cancel-form="${formId}">Cancelar edicao</button>
    </form>
  `;
}

function renderTable(headers, rows) {
  return `
    <div class="table-card">
      <table>
        <thead>
          <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (columns) => `
                      <tr>
                        ${columns.map((column) => `<td>${column}</td>`).join("")}
                      </tr>
                    `
                  )
                  .join("")
              : `<tr><td colspan="${headers.length}"><div class="empty-state">Nenhum registro encontrado.</div></td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function inputField(name, label, type = "text", placeholder = "") {
  return `
    <label>
      ${label}
      <input name="${name}" type="${type}" placeholder="${placeholder}" ${getWholeNumberInputAttributes(name, type)} required />
    </label>
  `;
}

function optionalInputField(name, label, type = "text", placeholder = "") {
  return `
    <label>
      ${label}
      <input name="${name}" type="${type}" placeholder="${placeholder}" ${getWholeNumberInputAttributes(name, type)} />
    </label>
  `;
}

function currencyInputField(name, label, { required = true, placeholder = "R$ 0,00" } = {}) {
  return `
    <label>
      ${label}
      <input
        name="${name}"
        type="text"
        inputmode="decimal"
        placeholder="${placeholder}"
        data-currency-input="true"
        data-currency-allow-empty="true"
        autocomplete="off"
        ${required ? "required" : ""}
      />
    </label>
  `;
}

function textAreaField(name, label) {
  return `
    <label>
      ${label}
      <textarea name="${name}" placeholder="${label}"></textarea>
    </label>
  `;
}

function optionalTextAreaField(name, label) {
  return `
    <label>
      ${label}
      <textarea name="${name}" placeholder="${label}"></textarea>
    </label>
  `;
}

function draftInputField(name, label, value = "", type = "text", placeholder = "", readonly = false, required = false) {
  return `
    <label>
      ${label}${required ? " *" : ""}
      <input data-bom-structure-field="${name}" name="${name}" type="${type}" placeholder="${placeholder}" value="${escapeHtml(value)}" ${getWholeNumberInputAttributes(name, type)} ${readonly ? "readonly" : ""} ${required ? "required" : ""} />
    </label>
  `;
}

function draftTextAreaField(name, label, value = "") {
  return `
    <label>
      ${label}
      <textarea data-bom-structure-field="${name}" name="${name}" placeholder="${label}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function selectField(name, label, options) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );

  return `
    <label>
      ${label}
      <select name="${name}" required>
        ${normalizedOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
      </select>
    </label>
  `;
}

function draftSelectField(name, label, selectedValue, options, required = false) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );

  return `
    <label>
      ${label}${required ? " *" : ""}
      <select data-bom-structure-field="${name}" name="${name}" ${required ? "required" : ""}>
        ${normalizedOptions
          .map(
            (option) =>
              `<option value="${option.value}" ${option.value === selectedValue ? "selected" : ""}>${option.label}</option>`
          )
          .join("")}
      </select>
    </label>
  `;
}

function deleteButtonCell(tableName, id, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  return `
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <button
        class="inline-button"
        type="button"
        data-edit-table="${tableName}"
        data-edit-id="${id}"
      >
        Editar
      </button>
      <button
        class="inline-button danger-button"
        type="button"
        data-delete-table="${tableName}"
        data-delete-id="${id}"
      >
        Excluir
      </button>
    </div>
  `;
}

function purchaseActionCell(item, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  const metadata = item.metadata || getPurchaseRequestMetadata(item);
  const canConclude = metadata.status === "approved" || metadata.status === "in_purchase" || metadata.status === "purchase_completed";

  return `
    <div class="action-button-group">
      <button class="inline-button" type="button" data-purchase-view-id="${item.id}">Visualizar</button>
      <button class="inline-button" type="button" data-purchase-edit-id="${item.id}">Editar</button>
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

function productActionCell(item, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  return `
    <div class="action-button-group">
      <button class="inline-button movement-button" type="button" data-product-move-id="${item.id}">Movimentar</button>
      <button class="inline-button" type="button" data-product-edit-id="${item.id}">Editar</button>
      <button class="inline-button" type="button" data-product-duplicate-id="${item.id}">Duplicar</button>
      <button class="inline-button danger-button" type="button" data-product-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderLastMovementUserCell(item) {
  if (!item.last_moved_by_name) {
    return `<span class="muted">Sem movimentação</span>`;
  }

  return `
    <strong>${escapeHtml(item.last_moved_by_name)}</strong>
    <div class="table-inline-copy muted">${item.last_movement_at ? formatDateTime(item.last_movement_at) : "Data não informada"}</div>
  `;
}

function parseProductSaleOptionsText(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawCode, rawLabel, rawPrice, rawProductionQuantity] = line.split(PRODUCT_SALE_OPTION_SEPARATOR).map((part) => String(part || "").trim());
      const code = rawCode || "";
      const label = rawLabel || "";
      const price = parseCurrencyInput(rawPrice || 0);
      const productionQuantity = Number(rawProductionQuantity || 1);
      return {
        id: code || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `opcao-${Date.now()}`,
        code,
        label,
        price,
        production_quantity: productionQuantity,
        kit_structure_id: "",
        current_stock: 0,
        minimum_stock: 0,
      };
    })
    .filter((option) => option.label && Number.isFinite(option.price) && option.price >= 0);
}

function normalizeProductSaleOptions(product) {
  if (Array.isArray(product?.sale_options)) {
    return product.sale_options
      .map((option) => ({
        id: String(option.id || option.code || option.label || "").trim(),
        code: String(option.code || option.id || "").trim(),
        label: String(option.label || "").trim(),
        price: typeof option.price === "number" ? Number(option.price || 0) : parseCurrencyInput(option.price || 0),
        production_quantity: normalizeWholeNumber(option.production_quantity || 1, { min: 0, fallback: 1 }),
        kit_structure_id: String(option.kit_structure_id || option.bom_structure_id || "").trim(),
        current_stock: Number(option.current_stock || 0),
        minimum_stock: Number(option.minimum_stock || 0),
      }))
      .filter((option) => option.label);
  }

  if (typeof product?.sale_options === "string" && product.sale_options.trim()) {
    try {
      return normalizeProductSaleOptions({ sale_options: JSON.parse(product.sale_options) });
    } catch {
      return parseProductSaleOptionsText(product.sale_options);
    }
  }

  return [];
}

function formatProductSaleOptionsText(options) {
  return normalizeProductSaleOptions({ sale_options: options })
    .map((option) => [
      option.code || option.id || "",
      option.label,
      formatCurrency(option.price).replace(/^R\$\s?/, ""),
      option.production_quantity || "",
      option.kit_structure_id || "",
      option.current_stock || "",
      option.minimum_stock || "",
    ].filter((value, index) => index < 3 || value).join(PRODUCT_SALE_OPTION_SEPARATOR))
    .join("\n");
}

function renderProductSaleVariationRows(options = [], product = null) {
  const sourceRows = Array.isArray(options) && options.length
    ? options
    : [{ id: "", code: "", label: "", price: "", production_quantity: 1, kit_structure_id: "", current_stock: 0, minimum_stock: 0 }];
  const visibleRows = sourceRows.map((option) => ({
    id: String(option.id || option.code || option.label || "").trim(),
    code: String(option.code || option.id || "").trim(),
    label: String(option.label || "").trim(),
    price: option.price ?? "",
    production_quantity: option.production_quantity ?? 1,
    kit_structure_id: option.kit_structure_id || option.bom_structure_id || "",
    current_stock: option.current_stock ?? 0,
    minimum_stock: option.minimum_stock ?? 0,
  }));
  const kitOptions = (state.moduleData.bomStructures || [])
    .filter((structure) => structure.status === "active")
    .map((structure) => ({
      value: structure.id,
      label: `${structure.name || structure.product_name || "Kit"} (${structure.code || structure.version || "sem código"})`,
    }));

  return visibleRows.map((option, index) => `
    <div class="product-variation-row" data-product-variation-row="${index}">
      <label>
        Código da variação
        <input name="sale_option_code" type="text" value="${escapeHtml(option.code || option.id || "")}" placeholder="MVC00-10" />
      </label>
      <label>
        Variação / kit
        <input name="sale_option_label" type="text" value="${escapeHtml(option.label || "")}" placeholder="Ex.: 1 un, Kit 12 peças, 10L" />
      </label>
      <label>
        Preco
        <input name="sale_option_price" type="text" inputmode="decimal" data-currency-input="true" data-currency-allow-empty="true" value="${escapeHtml(option.price || "")}" />
      </label>
      <label>
        Qtd. para produzir
        <input name="sale_option_production_quantity" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(option.production_quantity || 1)}" placeholder="1" />
      </label>
      <label>
        Estoque atual
        <input name="sale_option_current_stock" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(option.current_stock || 0)}" />
      </label>
      <label>
        Estoque mínimo
        <input name="sale_option_minimum_stock" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(option.minimum_stock || 0)}" />
      </label>
      <label>
        Kit vinculado
        <input name="sale_option_kit_structure_id" type="hidden" value="${escapeHtml(option.kit_structure_id || "")}" />
        <span class="customer-cnpj-field">
          <input
            type="text"
            readonly
            value="${escapeHtml(kitOptions.find((kit) => kit.value === option.kit_structure_id)?.label || "")}"
            placeholder="Usar BOM ativo do produto"
            data-product-open-kit-picker="${index}"
          />
        </span>
      </label>
      <button class="inline-button danger-button" type="button" data-product-remove-variation="${index}">Remover</button>
    </div>
  `).join("");
}

function normalizeProductionSections(input) {
  const rows = Array.isArray(input) ? input : [];
  return rows
    .map((section, index) => {
      const label = String(section?.label || section?.name || "").trim();
      const id = String(section?.id || label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `secao-${index + 1}`).trim();
      return { id, label };
    })
    .filter((section) => section.id && section.label);
}

function getProductProductionSections(product) {
  if (!product?.has_production_sections) return [];
  if (Array.isArray(product.production_sections)) {
    return normalizeProductionSections(product.production_sections);
  }
  if (typeof product.production_sections === "string" && product.production_sections.trim()) {
    try {
      return normalizeProductionSections(JSON.parse(product.production_sections));
    } catch {
      return normalizeProductionSections(product.production_sections.split(/\r?\n/).map((label) => ({ label })));
    }
  }
  return [];
}

function renderProductProductionSectionRows(sections = []) {
  const rows = normalizeProductionSections(sections);
  const visibleRows = rows.length ? rows : [{ id: "", label: "" }];
  return visibleRows.map((section, index) => `
    <div class="product-section-row" data-product-section-row="${index}">
      <input name="production_section_id" type="hidden" value="${escapeHtml(section.id || "")}" />
      <label>
        Nome da sessão
        <input name="production_section_label" type="text" value="${escapeHtml(section.label || "")}" placeholder="Ex.: Abertura" />
      </label>
      <button class="inline-button danger-button" type="button" data-product-remove-section="${index}">Excluir</button>
    </div>
  `).join("");
}

function readProductProductionSectionsFromForm(form) {
  return Array.from(form.querySelectorAll("[data-product-section-row]"))
    .map((row, index) => {
      const label = row.querySelector('[name="production_section_label"]')?.value.trim() || "";
      const storedId = row.querySelector('[name="production_section_id"]')?.value.trim() || "";
      const id = storedId || label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `secao-${index + 1}`;
      return { id, label };
    })
    .filter((section) => section.label);
}

function readProductSaleOptionsFromForm(form) {
  return Array.from(form.querySelectorAll("[data-product-variation-row]"))
    .map((row) => {
      const code = row.querySelector('[name="sale_option_code"]')?.value.trim() || "";
      const label = row.querySelector('[name="sale_option_label"]')?.value.trim() || "";
      const price = parseCurrencyInput(row.querySelector('[name="sale_option_price"]')?.value || 0);
      const productionQuantity = normalizeWholeNumber(row.querySelector('[name="sale_option_production_quantity"]')?.value || 1, { min: 0, fallback: 1 });
      const currentStock = normalizeWholeNumber(row.querySelector('[name="sale_option_current_stock"]')?.value || 0, { min: 0, fallback: 0 });
      const minimumStock = normalizeWholeNumber(row.querySelector('[name="sale_option_minimum_stock"]')?.value || 0, { min: 0, fallback: 0 });
      const kitStructureId = row.querySelector('[name="sale_option_kit_structure_id"]')?.value || "";
      return {
        id: code || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        code,
        label,
        price,
        production_quantity: productionQuantity,
        current_stock: currentStock,
        minimum_stock: minimumStock,
        kit_structure_id: kitStructureId,
      };
    })
    .filter((option) => option.code || option.label || option.price > 0 || option.production_quantity > 0)
    .filter((option) => option.code && option.label);
}

function findProductSaleOption(product, optionId) {
  return normalizeProductSaleOptions(product).find((option) =>
    option.id === optionId || option.code === optionId || option.label === optionId
  ) || null;
}

function updateProductSaleOptionStock(product, optionId, nextStock) {
  let matched = false;
  const saleOptions = normalizeProductSaleOptions(product).map((option) => {
    if (option.id !== optionId && option.code !== optionId && option.label !== optionId) {
      return option;
    }
    matched = true;
    return {
      ...option,
      current_stock: nextStock,
    };
  });

  return matched ? saleOptions : null;
}

function bomStructureActionCell(item, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  return `
    <div class="action-button-group">
      <button class="inline-button" type="button" data-bom-structure-edit-id="${item.id}">Editar</button>
      <button class="inline-button" type="button" data-bom-structure-duplicate-id="${item.id}">Duplicar</button>
      <button class="inline-button danger-button" type="button" data-delete-table="bom_structures" data-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderProductForm() {
  const isEditing = state.productFormMode === "edit";
  const categoryOptions = buildProductCategoryOptions().filter((option) => option.value !== "all");

  return `
    <section class="module-subpanel">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">Cadastro de produto</p>
          <h3>${isEditing ? "Editar Produto" : "Novo Produto"}</h3>
        </div>
      </div>

      <form id="products-form" class="products-form-grid">
        <input type="hidden" name="edit_id" />

        <div class="form-section form-section-full">
          <h4>Informações Básicas</h4>
          <div class="product-form-row">
            ${inputField("code", "Código")}
            ${inputField("name", "Nome")}
            ${selectField("status", "Status", [
              { value: "active", label: "Ativo" },
              { value: "inactive", label: "Inativo" },
            ])}
            ${selectField("available_for_sale", "Aparece em Vendas", [
              { value: "true", label: "Sim" },
              { value: "false", label: "Não" },
            ])}
            <label>
              Categoria
              <input name="category" list="product-category-suggestions" value="Produtos em geral" placeholder="Digite ou selecione uma categoria" required />
              <datalist id="product-category-suggestions">
                ${categoryOptions
                  .map((option) => `<option value="${escapeHtml(option.label)}"></option>`)
                  .join("")}
              </datalist>
            </label>
            ${selectField("product_type", "Tipo do produto", [
              { value: "raw_material", label: "Matéria-prima" },
              { value: "finished_product", label: "Produto acabado" },
            ])}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Estoque</h4>
          <div class="product-form-row">
            ${inputField("unit", "Unidade", "text", "kg")}
            ${inputField("minimum_stock", "Estoque Mínimo", "number", "0")}
            ${inputField("current_stock", "Estoque Atual", "number", "0")}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Valores</h4>
          <div class="product-form-row">
            ${currencyInputField("cost_price", "Preco de Custo")}
            ${currencyInputField("sale_price", "Preco de Venda")}
          </div>
          <div class="product-variations-panel">
            <div class="product-variations-head">
              <strong>Variações de venda</strong>
              <button class="inline-button" type="button" data-product-add-variation>Adicionar variação</button>
            </div>
            <div class="product-variations-list" data-product-variations-list>
              ${renderProductSaleVariationRows([])}
            </div>
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Sessões internas de produção</h4>
          <div class="product-form-row">
            ${selectField("has_production_sections", "Produto tem sessões?", [
              { value: "false", label: "Não" },
              { value: "true", label: "Sim" },
            ])}
          </div>
          <div class="product-sections-panel hidden" data-product-sections-panel>
            <div class="product-variations-head">
              <strong>Sessões do produto</strong>
              <button class="inline-button" type="button" data-product-add-section>Adicionar sessão</button>
            </div>
            <div class="product-sections-list" data-product-sections-list>
              ${renderProductProductionSectionRows([])}
            </div>
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Logistica</h4>
          <div class="product-form-row">
            ${optionalInputField("supplier", "Fornecedor")}
            ${optionalInputField("batch", "Lote")}
            ${optionalInputField("machine_serial", "Série da Máquina")}
            ${optionalInputField("expiration_date", "Validade", "date")}
            ${optionalInputField("location", "Localização", "text", "Almox A1")}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Foto</h4>
          <div class="product-photo-form-grid">
            <label>
              Imagem do produto
              <input name="product_photo_file" type="file" accept="image/*" />
            </label>
            <label>
              Foto atual
              <input name="photo_data_url" type="hidden" />
              <div class="product-photo-preview" data-product-photo-preview>
                <span class="muted">Nenhuma foto cadastrada</span>
              </div>
            </label>
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Descrição</h4>
          ${textAreaField("description", "Descrição")}
        </div>

        <div class="form-actions-row form-section-full">
          <button class="ghost-button secondary-surface-button" type="button" data-product-cancel>Cancelar</button>
          <button class="primary-button" type="submit">Salvar</button>
        </div>
      </form>
    </section>
  `;
}

function renderProductMovementPanel(product) {
  const saleOptions = normalizeProductSaleOptions(product);
  const saleOptionField = saleOptions.length
    ? `
      <label>
        Variação
        <select name="sale_option_id">
          <option value="">Produto base</option>
          ${saleOptions.map((option) => `
            <option value="${escapeHtml(option.id)}">
              ${escapeHtml(`${option.code ? `${option.code} - ` : ""}${option.label} | saldo ${formatQuantity(option.current_stock)}`)}
            </option>
          `).join("")}
        </select>
      </label>
    `
    : "";
  return `
    <section class="module-subpanel movement-panel">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">Movimentação de estoque</p>
          <h3>${product.name}</h3>
          <p class="muted">Saldo atual ${formatQuantity(product.current_stock)} ${product.unit} | Lote ${product.batch || "-"}</p>
        </div>
      </div>

      <form id="product-movement-form" class="movement-form-grid">
        <input type="hidden" name="product_id" value="${product.id}" />
        ${saleOptionField}
        ${selectField("movement_type", "Tipo", [
          { value: "entry", label: "Entrada" },
          { value: "exit", label: "Saída" },
        ])}
        ${inputField("movement_quantity", "Quantidade", "number", "0")}
        <div class="form-actions-row">
          <button class="secondary-button" type="submit">Confirmar Movimentação</button>
          <button class="ghost-button" type="button" data-product-movement-cancel>Fechar</button>
        </div>
      </form>
    </section>
  `;
}

function renderInventoryMovementForm() {
  const productOptions = (state.moduleData.products || []).map((product) => ({
    value: product.id,
    label: `${product.name} (${product.code})`,
  }));
  const selectedProductId = state.inventoryMovementProductId || "";
  const selectedProduct = (state.moduleData.products || []).find((product) => product.id === selectedProductId);
  const saleOptions = normalizeProductSaleOptions(selectedProduct);
  const saleOptionField = saleOptions.length
    ? `
      <label>
        Variação
        <select name="sale_option_id" data-inventory-sale-option-field>
          <option value="">Produto base</option>
          ${saleOptions.map((option) => `
            <option value="${escapeHtml(option.id)}" ${option.id === state.inventoryMovementSaleOptionId ? "selected" : ""}>
              ${escapeHtml(`${option.code ? `${option.code} - ` : ""}${option.label} | saldo ${formatQuantity(option.current_stock)}`)}
            </option>
          `).join("")}
        </select>
      </label>
    `
    : "";

  if (!productOptions.length) {
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
            <select name="product_id" data-inventory-product-field required>
              <option value="">Selecione...</option>
              ${productOptions.map((option) => `<option value="${option.value}" ${option.value === selectedProductId ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
            </select>
          </label>
          ${saleOptionField}
          ${selectField("movement_type", "Tipo", [
            { value: "entry", label: "Entrada" },
            { value: "exit", label: "Saída" },
            { value: "adjustment", label: "Ajuste" },
          ])}
          ${inputField("quantity", "Quantidade", "number", "0")}
          ${optionalInputField("machine_serial", "Número de Série")}
        </div>

        <div class="form-section form-section-full">
          <h4>Observação</h4>
          ${textAreaField("notes", "Observação")}
        </div>

        <div class="form-actions-row form-section-full">
          <button class="ghost-button" type="button" data-inventory-cancel>Voltar</button>
          <button class="primary-button" type="submit">Salvar Movimentação</button>
        </div>
      </form>
    </section>
  `;
}

function renderBomMaterialsForm() {
  const bomCategorySuggestions = buildBomMaterialCategoryOptions()
    .filter((option) => option.value !== "all")
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
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
            ${inputField("code", "Código")}
            ${inputField("name", "Nome")}
            <label>
              Categoria
              <input name="category" list="bom-material-category-suggestions" placeholder="Ex.: Componente" required />
              <datalist id="bom-material-category-suggestions">${bomCategorySuggestions}</datalist>
            </label>
            ${inputField("unit", "Unidade", "text", "un")}
          </div>
          ${optionalTextAreaField("description", "Descrição")}
        </div>

        <div class="form-section form-section-full">
          <h4>Custos e estoque</h4>
          <div class="product-form-row">
            ${currencyInputField("unit_cost", "Custo Unitário")}
            ${optionalInputField("supplier", "Fornecedor")}
            ${inputField("current_stock", "Estoque Atual", "number", "0")}
            ${inputField("minimum_stock", "Estoque Mínimo", "number", "0")}
          </div>
          <div class="product-form-row">
            ${selectField("status", "Status", [
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

function renderBomStructuresForm(totalStructureCost) {
  const draft = state.bomStructureDraft;
  const productOptions = (state.moduleData.products || []).map((product) => ({
    value: product.id,
    label: `${product.name} (${product.code})`,
  }));
  const finalProductVariationOptions = getBomFinalProductVariationOptions();
  const finalProductVariationField = finalProductVariationOptions.length
    ? `
      <label>
        Variação do produto final
        <select data-bom-structure-field="sale_option_id" name="sale_option_id">
          <option value="">Sem variação</option>
          ${finalProductVariationOptions.map((option) => `
            <option value="${escapeHtml(option.value)}" ${option.value === draft.sale_option_id ? "selected" : ""}>
              ${escapeHtml(option.label)}
            </option>
          `).join("")}
        </select>
      </label>
    `
    : "";
  const componentOptions = buildBomComponentOptions();

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
        <input type="hidden" name="edit_id" value="${escapeHtml(draft.edit_id)}" />
        <div class="form-section form-section-full">
          <h4>Dados principais</h4>
          <div class="product-form-row">
            ${draftSelectField("product_id", "Produto final", draft.product_id, productOptions, true)}
            ${finalProductVariationField}
            ${draftInputField("version", "Versao", draft.version, "text", "1.0", false, true)}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Produção</h4>
          <div class="product-form-row">
            ${draftInputField("category", "Categoria do BOM", draft.category, "text", "Ex.: Linha, Família, Cliente")}
            ${draftInputField("batch_size", "Tamanho do lote", draft.batch_size, "number", "1", false, true)}
            ${draftInputField("batch_unit", "Unidade do lote", draft.batch_unit, "text", "un", false, true)}
            ${draftSelectField("status", "Status", draft.status, [
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
            ${state.bomDraftItems.map((item, index) => renderBomDraftItemRow(item, index)).join("")}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Custos</h4>
          <div class="cost-display-card">
            <span class="muted">Custo Total do Conjunto</span>
            <strong>${formatCurrency(totalStructureCost)}</strong>
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Instruções de Produção</h4>
          ${draftTextAreaField("instructions", "Instruções de produção", draft.instructions)}
          <div class="product-form-row">
            ${draftInputField("height", "Altura", draft.height, "number", "0")}
            ${draftInputField("width", "Largura", draft.width, "number", "0")}
            ${draftInputField("length", "Comprimento", draft.length, "number", "0")}
            ${draftInputField("weight", "Peso", draft.weight, "number", "0")}
          </div>
          <div class="bom-upload-panel">
            <label>
              Upload de arquivos
              <input id="bom-file-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
            </label>
            <div class="bom-upload-list">
              ${renderBomAttachmentPreviews()}
            </div>
          </div>
          ${draftTextAreaField("notes", "Observações", draft.notes)}
        </div>

        <div class="form-actions-row form-section-full bom-form-actions">
          <button class="ghost-button secondary-surface-button" type="button" data-bom-structure-cancel>Cancelar</button>
          <button class="primary-button" type="submit">Salvar</button>
        </div>
      </form>
    </section>
  `;
}

function renderBomDraftItemRow(item, index) {
  const options = buildBomComponentOptions()
    .map(
      (option) => `
        <option value="${option.value}" ${option.value === item.sourceKey ? "selected" : ""}>
          ${option.label}
        </option>
      `
    )
    .join("");
  const variationOptions = getBomDraftItemVariationOptions(item);
  const variationField = variationOptions.length
    ? `
      <label>
        Variação
        <select id="bom-item-${index}-sale-option" data-bom-item-field="saleOptionId" data-bom-item-index="${index}">
          <option value="">Sem variação</option>
          ${variationOptions.map((option) => `
            <option value="${escapeHtml(option.value)}" ${option.value === item.saleOptionId ? "selected" : ""}>
              ${escapeHtml(option.label)}
            </option>
          `).join("")}
        </select>
      </label>
    `
    : "";
  const productionSections = getBomFinalProductProductionSections();
  const sectionField = productionSections.length
    ? `
      <label>
        Sessão interna
        <select id="bom-item-${index}-section" data-bom-item-field="productionSectionId" data-bom-item-index="${index}">
          <option value="">Sem sessão</option>
          ${productionSections.map((section) => `
            <option value="${escapeHtml(section.id)}" ${section.id === item.productionSectionId ? "selected" : ""}>
              ${escapeHtml(section.label)}
            </option>
          `).join("")}
        </select>
      </label>
    `
    : "";
  const details = getBomDraftItemComputed(item);

  return `
    <div class="bom-item-row">
      <label>
        Item selecionado
        <select id="bom-item-${index}-source" data-bom-item-field="sourceKey" data-bom-item-index="${index}">
          <option value="">Selecione...</option>
          ${options}
        </select>
      </label>
      ${variationField}
      ${sectionField}
      <label>
        Quantidade
        <input id="bom-item-${index}-quantity" data-bom-item-field="quantity" data-bom-item-index="${index}" type="number" min="1" step="1" value="${item.quantity}" />
      </label>
      <label>
        Custo unitário
        <input id="bom-item-${index}-unit-cost" data-bom-item-field="unitCost" data-bom-item-index="${index}" type="number" min="0" step="0.01" value="${escapeHtml(details.unitCost)}" />
      </label>
      <label>
        Custo total
        <input type="text" data-bom-item-total="${index}" value="${formatCurrency(details.totalCost)}" readonly />
      </label>
      <button class="inline-button danger-button" type="button" data-bom-remove-item="${index}">Remover</button>
    </div>
  `;
}

function renderBomAttachmentPreviews() {
  if (!state.bomAttachmentDrafts.length) {
    return `<div class="empty-state compact-empty">Nenhum arquivo selecionado.</div>`;
  }

  return state.bomAttachmentDrafts
    .map(
      (file, index) => `
        <article class="bom-file-card">
          <div>
            <strong>${escapeHtml(file.name)}</strong>
            <div class="table-inline-copy muted">${formatFileSize(file.size)} • ${file.type || "arquivo"}</div>
          </div>
          ${
            file.previewUrl && file.type.startsWith("image/")
              ? `<img class="bom-file-preview" src="${file.previewUrl}" alt="${escapeHtml(file.name)}" />`
              : `<div class="bom-file-placeholder">${getFileExtensionLabel(file.name)}</div>`
          }
          <button class="inline-button danger-button" type="button" data-bom-remove-file="${index}">Remover</button>
        </article>
      `
    )
    .join("");
}

function noPermissionTemplate(message) {
  return `<section class="module-panel"><div class="empty-state">${message}</div></section>`;
}

function statusCell(status) {
  const label = status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return `<span class="status-chip status-${status}">${label}</span>`;
}

function productStatusCell(status) {
  return `<span class="status-chip ${status === "active" ? "status-completed" : "status-cancelled"}">${status === "active" ? "Ativo" : "Inativo"}</span>`;
}

function productCategoryCell(category) {
  const value = normalizeCategoryInput(category, "general_products");
  return `<span class="status-chip product-category-custom">${escapeHtml(formatCategoryLabel(value))}</span>`;
}

function productTypeCell(productType) {
  const value = normalizeProductTypeInput(productType);
  const className = value === "finished_product" ? "product-category-finished" : "product-category-raw";
  return `<span class="status-chip ${className}">${escapeHtml(formatProductTypeLabel(value))}</span>`;
}

function productStockCell(item) {
  const isLow = Number(item.current_stock) <= Number(item.minimum_stock);
  return `
    <span class="${isLow ? "product-stock-low" : "product-stock-normal"}">
      ${formatQuantity(item.current_stock)} ${item.unit}
    </span>
  `;
}

function inventoryMovementTypeCell(type) {
  const mapping = {
    entry: { label: "Entrada", className: "movement-entry" },
    exit: { label: "Saída", className: "movement-exit" },
    adjustment: { label: "Ajuste", className: "movement-adjustment" },
  };

  const config = mapping[type] || { label: type, className: "" };
  return `<span class="status-chip ${config.className}">${config.label}</span>`;
}

function materialStatusCell(status) {
  return `<span class="status-chip ${status === "active" ? "status-completed" : "status-cancelled"}">${status === "active" ? "Ativo" : "Inativo"}</span>`;
}

function bomStructureStatusCell(status) {
  return `<span class="status-chip ${status === "active" ? "status-completed" : "status-planned"}">${status === "active" ? "Ativo" : "Rascunho"}</span>`;
}

function formatCategoryLabel(category) {
  const labels = {
    general_products: "Produtos em geral",
    raw_material: "Produtos em geral",
    finished_product: "Produtos em geral",
    packaging: "Embalagem",
    consumable: "Insumo",
  };

  return labels[category] || formatFreeTextCategory(category);
}

function formatProductTypeLabel(productType) {
  const labels = {
    raw_material: "Matéria-prima",
    finished_product: "Produto acabado",
  };

  return labels[normalizeProductTypeInput(productType)] || formatFreeTextCategory(productType);
}

function formatBomCategory(category) {
  const labels = {
    raw_material: "Matéria-prima",
    component: "Componente",
    subassembly: "Subconjunto",
    packaging: "Embalagem",
  };

  return labels[category] || formatFreeTextCategory(category);
}

function formatFreeTextCategory(category) {
  const value = String(category || "").trim();
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .replace(/\b\p{L}/gu, (char) => char.toLocaleUpperCase("pt-BR"));
}

function normalizeCategoryInput(value, fallback = "geral") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const aliases = {
    "materia prima": "general_products",
    "matéria prima": "general_products",
    "produto acabado": "general_products",
    acabado: "general_products",
    "produtos em geral": "general_products",
    embalagem: "packaging",
    insumo: "consumable",
    componente: "component",
    subconjunto: "subassembly",
    geral: "geral",
    general: "general",
  };
  return aliases[normalized] || raw;
}

function normalizeProductTypeInput(value, fallback = "raw_material") {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const aliases = {
    "materia prima": "raw_material",
    raw_material: "raw_material",
    "raw material": "raw_material",
    "produto acabado": "finished_product",
    finished_product: "finished_product",
    "finished product": "finished_product",
    acabado: "finished_product",
  };
  return aliases[normalized] || fallback;
}

function getProductType(product) {
  if (!product) return "raw_material";
  if (product.product_type) return normalizeProductTypeInput(product.product_type);
  const normalizedValues = [product.category, product.code, product.name].map((value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
  return normalizedValues.some((value) =>
    value === "produto acabado"
    || value === "finished product"
    || value === "finished_product"
    || value === "acabado"
    || value.startsWith("kit")
    || value.startsWith("caps05")
    || value.startsWith("caps10")
    || ["bombas", "misturadores", "polidoras", "encapsuladoras"].includes(value)
  )
    ? "finished_product"
    : "raw_material";
}

function getProductCategory(product) {
  const category = normalizeCategoryInput(product?.category, "general_products");
  return category === "geral" || category === "general" ? "general_products" : category;
}

function buildCategoryOptions(items, formatter, baseOptions = []) {
  const seen = new Set();
  const options = [];
  const addOption = (value, label = "") => {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized.toLowerCase())) return;
    seen.add(normalized.toLowerCase());
    options.push({ value: normalized, label: label || formatter(normalized) });
  };

  baseOptions.forEach((option) => addOption(option.value, option.label));
  (items || []).forEach((item) => addOption(item.category));
  return options;
}

function buildProductCategoryOptions() {
  const normalizedProducts = (state.moduleData.products || []).map((item) => ({
    ...item,
    category: normalizeCategoryInput(item.category, "general_products"),
  }));
  return [
    { value: "all", label: "Todas categorias" },
    ...buildCategoryOptions(normalizedProducts, formatCategoryLabel, [
      { value: "general_products", label: "Produtos em geral" },
      { value: "packaging", label: "Embalagem" },
      { value: "consumable", label: "Insumo" },
    ]),
  ];
}

function buildBomMaterialCategoryOptions() {
  return [
    { value: "all", label: "Todas categorias" },
    ...buildCategoryOptions(state.moduleData.bomMaterials || [], formatBomCategory, [
      { value: "raw_material", label: "Matéria-prima" },
      { value: "component", label: "Componente" },
      { value: "subassembly", label: "Subconjunto" },
      { value: "packaging", label: "Embalagem" },
    ]),
  ];
}

function formatQuantity(value) {
  return formatWholeQuantity(value);
}

function formatWholeQuantity(value) {
  return String(Math.max(0, Math.round(Number(value || 0))));
}

function normalizeWholeNumber(value, { min = 0, fallback = 0 } = {}) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.max(min, Math.round(numericValue));
}

const WHOLE_NUMBER_FIELD_NAMES = new Set([
  "quantity",
  "movement_quantity",
  "minimum_stock",
  "current_stock",
  "batch_size",
  "height",
  "width",
  "length",
  "weight",
  "sale_option_production_quantity",
  "sale_option_current_stock",
  "sale_option_minimum_stock",
  "delivery_days",
  "validity_days",
]);

function getWholeNumberInputAttributes(name, type) {
  if (type !== "number" || !WHOLE_NUMBER_FIELD_NAMES.has(name)) {
    return "";
  }
  const min = name === "quantity" || name === "movement_quantity" || name === "batch_size" ? 1 : 0;
  return ` min="${min}" step="1" inputmode="numeric"`;
}

function parseCurrencyInput(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  let sanitized = raw.replace(/[^\d,.-]/g, "");
  const negative = sanitized.includes("-");
  sanitized = sanitized.replace(/-/g, "");

  const lastComma = sanitized.lastIndexOf(",");
  const lastDot = sanitized.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : "";

  if (decimalSeparator) {
    const decimalIndex = sanitized.lastIndexOf(decimalSeparator);
    const integerPart = sanitized.slice(0, decimalIndex).replace(/[.,]/g, "");
    const decimalPart = sanitized.slice(decimalIndex + 1).replace(/[.,]/g, "");
    sanitized = `${integerPart}.${decimalPart}`;
  } else {
    sanitized = sanitized.replace(/[.,]/g, "");
  }

  const parsed = Number(`${negative ? "-" : ""}${sanitized}`);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

function normalizePercentInput(value, fallback = 0) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const normalized = raw.replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(0, parsed));
}

function serializeCurrencyNumber(value) {
  const amount = parseCurrencyInput(value);
  return amount.toLocaleString("en-US", {
    useGrouping: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatEditableCurrency(value) {
  return serializeCurrencyNumber(value).replace(".", ",");
}

function formatCurrency(value) {
  return parseCurrencyInput(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function syncCurrencyInputValue(input) {
  if (!input) return;

  const rawValue = String(input.value ?? "").trim();
  const allowEmpty = input.dataset.currencyAllowEmpty === "true";
  if (!rawValue) {
    input.dataset.currencyValue = "";
    input.value = allowEmpty ? "" : formatCurrency(0);
    return;
  }

  const numericValue = parseCurrencyInput(rawValue);
  input.dataset.currencyValue = serializeCurrencyNumber(numericValue);
  input.value = formatCurrency(numericValue);
}

function bindCurrencyInputs(scope = document) {
  scope.querySelectorAll('input[data-currency-input="true"]').forEach((input) => {
    if (!input.dataset.currencyBound) {
      input.addEventListener("focus", () => {
        const rawValue = input.dataset.currencyValue;
        if (!rawValue) return;
        input.value = formatEditableCurrency(rawValue);
      });

      input.addEventListener("input", () => {
        const rawValue = String(input.value ?? "").trim();
        input.dataset.currencyValue = rawValue ? serializeCurrencyNumber(rawValue) : "";
      });

      input.addEventListener("blur", () => {
        syncCurrencyInputValue(input);
      });

      input.dataset.currencyBound = "true";
    }

    syncCurrencyInputValue(input);
  });
}

function getCurrencyInputNumber(form, fieldName) {
  const field = form?.elements?.namedItem(fieldName);
  return parseCurrencyInput(field?.value || 0);
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function getModuleSubtitle(moduleKey) {
  const subtitles = {
    dashboard: "Painel estrategico do administrador",
    products: "Cadastro mestre e controle de estoque",
    bom: "Estrutura de materiais",
    inventory: "Movimentações e controle de saldo",
    production: "Gerencie ordens de produção",
    service_orders: "Serviços internos e externos com rastreabilidade completa",
    machining: "Peças, processos e workflow por etapas",
    customers: "Relacionamento comercial",
    sales: "Pedidos e faturamento",
    purchases: "Fluxo de solicitações, compra e conclusao",
    reports: "Consolidado gerencial e analítico da operação",
    vps: "Painel técnico exclusivo para o setor de TI",
    audit: "Central unica de logs, rastreabilidade e auditoria",
    permissions: "Configure papeis, permissões e funcionários",
  };

  return subtitles[moduleKey] || "Painel operacional";
}

function getAuditKnownModules() {
  const base = MODULES.map((module) => ({ value: module.key, label: module.label }));
  if (!base.some((module) => module.value === "reports")) {
    base.push({ value: "reports", label: "Relatórios" });
  }
  return base;
}

function getModuleLabel(moduleKey) {
  return getAuditKnownModules().find((module) => module.value === moduleKey)?.label || moduleKey || "-";
}

function createEmptyAuditFilters() {
  return {
    module: "all",
    user: "all",
    action: "all",
    level: "all",
    date_from: "",
    date_to: "",
    search: "",
  };
}

function getCurrentUserAuditProfile() {
  return String(state.currentUser?.permission_role_name || state.currentUser?.department || state.currentUser?.role || "").trim() || "-";
}

async function resolveClientIp() {
  if (state.clientIp) {
    return state.clientIp;
  }

  try {
    const response = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    const data = await response.json();
    state.clientIp = String(data?.ip || "").trim() || "Não identificado";
  } catch {
    state.clientIp = readCachedClientIp() || "Não identificado";
  }

  localStorage.setItem(CLIENT_IP_STORAGE_KEY, state.clientIp);
  return state.clientIp;
}

function buildAuditLogPayload({
  moduleKey,
  action,
  level = "Informativo",
  itemAffected = "",
  description = "",
  entityId = null,
  entityType = null,
  payload = {},
}) {
  return {
    modulo: moduleKey || state.activeModule || "dashboard",
    acao: action || "acao_nao_informada",
    usuario_id: state.currentUser?.user_id || state.currentUser?.id || null,
    usuario_nome: getLoggedUserName("-"),
    usuario_perfil: getCurrentUserAuditProfile(),
    ip: state.clientIp || readCachedClientIp() || "Não identificado",
    item_afetado: itemAffected || null,
    descricao: description || null,
    nivel: level,
    entidade_id: entityId || null,
    entidade_tipo: entityType || null,
    payload: payload || {},
  };
}

async function queueSystemLog(entry) {
  if (!state.supabase || !state.currentUser) return;

  try {
    if (!state.clientIp) {
      await resolveClientIp();
    }
    const { error } = await state.supabase.from("logs_sistema").insert(buildAuditLogPayload(entry));
    if (error) throw error;
  } catch (error) {
    if (!queueSystemLog.warned && /logs_sistema|relation .* does not exist|schema cache|column/i.test(String(error?.message || ""))) {
      queueSystemLog.warned = true;
    }
  }
}

function trackModuleAccessIfNeeded() {
  if (!state.currentUser) return;
  if (state.lastAuditedModule === state.activeModule) return;
  state.lastAuditedModule = state.activeModule;
  void queueSystemLog({
    moduleKey: state.activeModule,
    action: "acesso_tela",
    level: "Informativo",
    itemAffected: getModuleLabel(state.activeModule),
    description: `Acesso ao módulo ${getModuleLabel(state.activeModule)}.`,
    entityType: "module",
    entityId: state.activeModule,
  });
}

function renderAuditLevelBadge(level) {
  const normalized = String(level || "Informativo");
  const classMap = {
    Informativo: "status-completed",
    Atenção: "status-planned",
    Critico: "status-cancelled",
  };
  return `<span class="status-chip ${classMap[normalized] || "status-planned"}">${escapeHtml(normalized)}</span>`;
}

function getAuditLogActionOptions(logs = []) {
  return Array.from(new Set((logs || []).map((item) => item.acao).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((action) => ({ value: action, label: action.replaceAll("_", " ") }));
}

function buildAuditExportHtml(logs) {
  const rows = (logs || []).map((log) => `
    <tr>
      <td>${escapeHtml(formatDateTime(log.created_at))}</td>
      <td>${escapeHtml(getModuleLabel(log.modulo))}</td>
      <td>${escapeHtml(log.acao || "-")}</td>
      <td>${escapeHtml(log.usuario_nome || "-")}</td>
      <td>${escapeHtml(log.item_afetado || "-")}</td>
      <td>${escapeHtml(log.descricao || "-")}</td>
      <td>${escapeHtml(log.nivel || "-")}</td>
    </tr>
  `).join("");

  return `
    <article class="sales-document-sheet">
      <header class="sales-document-header">
        <div>
          <h2>Central de Logs / Auditoria</h2>
          <p>Exportação consolidada dos registros filtrados.</p>
        </div>
        <div class="sales-document-meta">
          <strong>${formatDateTime(new Date().toISOString())}</strong>
          <span>${logs.length} registro(s)</span>
        </div>
      </header>
      <table class="sales-document-items-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Módulo</th>
            <th>Ação</th>
            <th>Usuário</th>
            <th>Item</th>
            <th>Descrição</th>
            <th>Nível</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="7">Nenhum log encontrado.</td></tr>`}</tbody>
      </table>
    </article>
  `;
}

function formatStaffRole(role) {
  const normalizedRole = normalizePermissionRoleName(role);
  if (normalizedRole === "ADMINISTRADOR") {
    return "ADMINISTRADOR";
  }
  return normalizedRole || "Usuário";
}

function normalizePermissionRoleName(role) {
  const normalizedRole = String(role || "").trim().toUpperCase();
  if (normalizedRole === "ADMNISTRADOR") {
    return "ADMINISTRADOR";
  }
  return normalizedRole;
}

function isAdministratorRole(role) {
  return normalizePermissionRoleName(role) === "ADMINISTRADOR";
}

function isPermissionsAdminRole(role) {
  const normalizedRole = normalizePermissionRoleName(role);
  return normalizedRole === "TI" || normalizedRole === "ADMINISTRADOR";
}

function isTiUser() {
  return normalizePermissionRoleName(
    state.currentUser?.permission_role_name || state.currentUser?.role || state.currentUser?.department
  ) === "TI";
}

function isPermissionsAdmin() {
  return isPermissionsAdminRole(
    state.currentUser?.permission_role_name || state.currentUser?.role || state.currentUser?.department
  );
}

function getDefaultRolePermissions() {
  return MODULES.map((module) => ({
    module_key: module.key,
    can_view: false,
    can_edit: false,
  }));
}

function normalizeRolePermissions(permissions, roleName = "") {
  const permissionMap = new Map((permissions || []).map((item) => [item.module_key, item]));
  const normalizedRoleName = normalizePermissionRoleName(roleName);
  const canAccessPermissionsModule = ["TI", "ADMINISTRADOR"].includes(normalizedRoleName);
  const canAccessVpsModule = normalizedRoleName === "TI";
  const canEditDashboard = ["TI", "ADMINISTRADOR"].includes(normalizedRoleName);
  return MODULES.map((module) => {
    const current = permissionMap.get(module.key) || {};
    const canEdit = module.key === "dashboard"
      ? canEditDashboard && Boolean(current.can_edit)
      : module.key === "permissions" && !canAccessPermissionsModule
        ? false
        : module.key === "vps" && !canAccessVpsModule
          ? false
        : Boolean(current.can_edit);
    const canView = module.key === "dashboard"
      ? canEdit || Boolean(current.can_view)
      : module.key === "permissions" && !canAccessPermissionsModule
        ? false
        : module.key === "vps" && !canAccessVpsModule
          ? false
        : canEdit || Boolean(current.can_view);
    return {
      module_key: module.key,
      can_view: canView,
      can_edit: canEdit,
    };
  });
}

function createEmptyPermissionRoleDraft() {
  return {
    id: "",
    name: "",
    originalName: "",
    description: "",
    permissions: getDefaultRolePermissions(),
  };
}

function getPermissionRoleNormalizationName(roleName = "") {
  if (state.permissionRoleDraft.id && isTiUser()) {
    return state.permissionRoleDraft.originalName || roleName;
  }
  return roleName;
}

function createEmptyVpsControlState() {
  return {
    summary: null,
    services: [],
    logs: [],
    applications: [],
    security: null,
    backups: [],
    database: null,
    domains: [],
    audit: [],
    logFilters: {
      search: "",
      source: "all",
      level: "all",
      dateFrom: "",
      dateTo: "",
    },
    databaseTableFilter: "",
    databaseSelectedTable: "",
    databaseSelectedTableDetail: null,
  };
}

function createEmptyReportsFilters() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    from: getDateShiftedIso(today, -29),
    to: today,
  };
}

function createEmptyPayablesFilters() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    search: "",
    from: getDateShiftedIso(today, -30),
    to: getDateShiftedIso(today, 30),
    status: "all",
    category: "all",
    type: "all",
  };
}

function createEmptyPayableDraft() {
  return {
    edit_id: "",
    payable_number: "",
    description: "",
    supplier: "",
    category: "Serviços",
    amount: "",
    due_date: new Date().toISOString().slice(0, 10),
    payment_method: "",
    status: "pending",
    account_type: "variable",
    frequency: "monthly",
    auto_generate: false,
    purchase_request_id: "",
    purchase_request_number: "",
    source_module: "",
    generated_from_payable_id: "",
    notes: "",
    attachments: [],
  };
}

function createEmptyPayablePaymentDraft() {
  return {
    payable_id: "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: "",
    payment_notes: "",
  };
}

function createEmptyPayablesAlertState() {
  return {
    upcomingSignature: "",
    todaySignature: "",
    overdueSignature: "",
    lastOverdueAt: 0,
  };
}

function createEmptyEmployeeDraft() {
  return {
    id: "",
    login_code: "",
    full_name: "",
    email: "",
    password: "",
    department: "USINAGEM",
    permission_role_id: "",
    status: "active",
  };
}

function createEmptyBomDraftItem() {
  return {
    sourceKey: "",
    saleOptionId: "",
    productionSectionId: "",
    unitCost: "",
    quantity: "1",
  };
}

function createEmptyProductionDraft() {
  return {
    edit_id: "",
    product_id: "",
    order_number: "",
    batch_size: "",
    priority: "media",
    planned_start: "",
    planned_end: "",
    lot_number: "",
    responsible_name: "",
    notes: "",
    status: "planned",
  };
}

function createEmptyMachiningProcessDraft() {
  return {
    id: `proc-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: "",
    machine: "",
    operator: "",
    estimated_minutes: "",
    notes: "",
    sequence: 1,
  };
}

function createEmptyMachiningDraft() {
  return {
    edit_id: "",
    code: "",
    name: "",
    finished_product_id: "",
    finished_name: "",
    material: "",
    description: "",
    processes: [createEmptyMachiningProcessDraft()],
  };
}

function createEmptyMachiningStartDraft(pieceId = "") {
  return {
    piece_id: pieceId,
    quantity: "",
    lot: "",
    operator: "",
    finished_name: "",
  };
}

function createEmptyCustomerDraft() {
  return {
    edit_id: "",
    name: "",
    cnpj: "",
    cpf: "",
    state_registration: "",
    email: "",
    phone: "",
    contact: "",
    address: "",
    city: "",
    state: "",
    notes: "",
  };
}

function createEmptySalesItemDraft() {
  return {
    product_id: "",
    product_name: "",
    product_code: "",
    sale_option_id: "",
    sale_option_label: "",
    kit_structure_id: "",
    production_quantity: "",
    quantity: "1",
    unit_price: 0,
    discount: 0,
  };
}

function createEmptySalesDraft(status = "quote") {
  const today = new Date().toISOString().slice(0, 10);
  const defaultValidityDate = addFrequency(today, "weekly");

  return {
    edit_id: "",
    customer_id: "",
    customer_name: "",
    cnpj: "",
    address: "",
    invoice_number: "",
    sale_date: status === "quote" ? today : "",
    delivery_date: status === "quote" ? defaultValidityDate : "",
    delivery_days: "",
    priority: "media",
    payment_method: "",
    payment_conditions: [createEmptySalesPaymentCondition()],
    status,
    contract_number: "",
    contract_notes: "",
    items: [createEmptySalesItemDraft()],
    production_generated: false,
    production_order_ids: [],
  };
}

function createEmptySalesPaymentCondition(overrides = {}) {
  return {
    id: overrides.id || `payment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    method: overrides.method || "",
    amount: overrides.amount ?? "",
    percentage: overrides.percentage ?? "",
    installments: overrides.installments || 1,
    notes: overrides.notes || "",
  };
}

function createEmptyPurchaseItemDraft() {
  return {
    product_name: "",
    description: "",
    quantity: "1",
    unit: "un",
    measures: "",
  };
}

function createEmptyPurchaseDraft() {
  return {
    edit_id: "",
    request_number: "",
    requester_id: "",
    requester_name: "",
    department: "",
    urgency: "media",
    justification: "",
    status: "pending",
    requested_at: "",
    items: [createEmptyPurchaseItemDraft()],
  };
}

function createEmptyPurchaseConclusionDraft() {
  return {
    request_id: "",
    order_number: "",
    invoice_number: "",
    supplier: "",
    purchase_date: "",
    due_date: "",
    payment_method: "",
    total_amount: "",
    purchase_notes: "",
    order_files: [],
    invoice_files: [],
    attachment_files: [],
    boleto_files: [],
    installments: [createEmptyPurchaseInstallmentDraft(1)],
    stock_entries: [],
  };
}

function createEmptyPurchaseInstallmentDraft(number = 1) {
  return {
    id: `purchase-installment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    installment_number: number,
    due_date: "",
    amount: "",
    boleto_files: [],
  };
}

function createEmptySalesContractDraft() {
  return {
    sale_id: "",
    customer_name: "",
    cnpj: "",
    address: "",
    invoice_number: "",
    sale_date: "",
    delivery_date: "",
    payment_method: "",
    status: "quote",
    total_amount: 0,
    items_label: "",
    contract_number: "",
    contract_notes: "",
  };
}

function createDefaultSalesDocumentSettings() {
  const currentYear = new Date().getFullYear();
  return {
    activeTab: "quote",
    company: {
      company_name: "CAPSFARMA",
      cnpj: "",
      address: "",
      phone: "",
      email: "",
      site: "",
      logo: "",
      responsible_name: "",
      responsible_role: "Comercial",
      signature: "",
    },
    commercial: {
      pix_discount_percent: 0,
    },
    numbering: {
      quote_prefix: "ORC",
      sale_prefix: "VEN",
      contract_prefix: "CONT",
      next_quote_number: 1,
      next_sale_number: 1,
      next_contract_number: 1,
      quote_year: currentYear,
      sale_year: currentYear,
      contract_year: currentYear,
      number_padding: 2,
    },
    templates: {
      quote: createDefaultSalesTemplate("quote"),
      sale: createDefaultSalesTemplate("sale"),
      contract: createDefaultSalesTemplate("contract"),
    },
  };
}

function createDefaultSalesTemplate(type) {
  const defaults = {
    quote: {
      type: "quote",
      name: "Modelo Padrão de Orçamento",
      title: "Orçamento Comercial",
      header: "Proposta comercial elaborada para {{cliente_nome}}.",
      footer: "Agradecemos a oportunidade e ficamos à disposição para alinhar os próximos passos.",
      presentation_text: "Apresentamos abaixo a proposta comercial conforme escopo solicitado.",
      validity_days: "7",
      notes: "Valores sujeitos a confirmação de estoque e aprovação comercial.",
      payment_terms: "50% no pedido e 50% na entrega.",
      delivery_terms: "Entrega em até 15 dias úteis após aprovação.",
      warranty: "Garantia de 12 meses contra defeitos de fabricação.",
      signature: "{{empresa_nome}}\nCNPJ: {{empresa_cnpj}}\nRepresentante: {{empresa_responsavel}}\n{{empresa_responsavel_cargo}}\n\nCliente: {{cliente_nome}}\nCNPJ: {{cliente_cnpj}}",
      contact_details: "{{empresa_telefone}} | {{empresa_email}} | {{empresa_site}}",
      final_message: "Se desejar, podemos revisar quantidades, prazos e condições comerciais.",
      pdf_template_name: "",
      pdf_template_data_url: "",
      pdf_template_updated_at: "",
      body_html: `
        <section>
          <h2>{{documento_titulo}}</h2>
          <p>{{texto_apresentacao}}</p>
          <p><strong>Cliente:</strong> {{cliente_nome}}</p>
          <p><strong>Data:</strong> {{data}}</p>
          <p><strong>Número:</strong> {{numero_documento}}</p>
          {{itens}}
          <p><strong>Subtotal:</strong> {{valor_subtotal}}</p>
          <p><strong>Desconto:</strong> {{valor_desconto}}</p>
          <p><strong>Total:</strong> {{valor_total}}</p>
          <p><strong>Pagamento:</strong> {{condicoes_pagamento}}</p>
          <p><strong>Prazo de entrega:</strong> {{prazo_entrega}}</p>
          <p><strong>Validade do orçamento:</strong> {{validade_orcamento}}</p>
          <p><strong>Garantia:</strong> {{garantia}}</p>
          <p><strong>Observações:</strong> {{observacoes}}</p>
          <p><strong>Mensagem final:</strong> {{mensagem_final}}</p>
        </section>
      `.trim(),
    },
    sale: {
      type: "sale",
      name: "Modelo Padrão de Venda",
      title: "Confirmação de Venda",
      header: "Documento comercial referente à venda formalizada com {{cliente_nome}}.",
      footer: "Documento emitido automaticamente pelo módulo comercial.",
      presentation_text: "Registramos abaixo as condições comerciais da venda fechada.",
      validity_days: "0",
      notes: "Venda sujeita às condições comerciais aprovadas.",
      payment_terms: "Conforme negociado no pedido.",
      delivery_terms: "Prazo conforme cronograma informado ao cliente.",
      warranty: "Garantia conforme política comercial vigente.",
      signature: "Representante: {{empresa_responsavel}}\n{{empresa_responsavel_cargo}}",
      contact_details: "{{empresa_telefone}} | {{empresa_email}}",
      final_message: "Em caso de dúvidas, nossa equipe comercial está à disposição.",
      pdf_template_name: "",
      pdf_template_data_url: "",
      pdf_template_updated_at: "",
      body_html: `
        <section>
          <h2>{{documento_titulo}}</h2>
          <p>{{texto_apresentacao}}</p>
          <p><strong>Cliente:</strong> {{cliente_nome}}</p>
          <p><strong>Documento:</strong> {{cliente_documento}}</p>
          <p><strong>Endereço:</strong> {{cliente_endereco}}</p>
          <p><strong>Número da venda:</strong> {{numero_documento}}</p>
          {{itens}}
          <p><strong>Condições comerciais:</strong> {{condicoes_pagamento}}</p>
          <p><strong>Data de entrega:</strong> {{data_entrega}}</p>
          <p><strong>Total:</strong> {{valor_total}}</p>
          <p><strong>Observações:</strong> {{observacoes}}</p>
        </section>
      `.trim(),
    },
    contract: {
      type: "contract",
      name: "Modelo Padrão de Contrato",
      title: "Contrato Comercial",
      header: "As partes abaixo identificadas firmam o presente instrumento comercial.",
      footer: "Contrato emitido com base nas condições registradas no ERP.",
      presentation_text: "Instrumento padrão para formalização contratual com o cliente.",
      validity_days: "0",
      notes: "As cláusulas podem ser ajustadas conforme a negociação.",
      payment_terms: "Pagamento conforme cronograma aprovado.",
      delivery_terms: "Entrega conforme pedido e cronograma comercial.",
      warranty: "Garantia conforme condições negociadas.",
      signature: "{{empresa_responsavel}}\n{{empresa_responsavel_cargo}}",
      contact_details: "{{empresa_email}}",
      final_message: "Ambas as partes declaram estar de acordo com as cláusulas acima.",
      pdf_template_name: "",
      pdf_template_data_url: "",
      pdf_template_updated_at: "",
      body_html: `
        <section>
          <h2>{{documento_titulo}}</h2>
          <p>{{texto_apresentacao}}</p>
          <p><strong>Contratante:</strong> {{empresa_nome}}</p>
          <p><strong>CNPJ da contratante:</strong> {{empresa_cnpj}}</p>
          <p><strong>Contratado:</strong> {{cliente_nome}}</p>
          <p><strong>CNPJ do cliente:</strong> {{cliente_cnpj}}</p>
          <p><strong>Endereço do cliente:</strong> {{cliente_endereco}}</p>
          <p><strong>Valor do contrato:</strong> {{valor_total}}</p>
          <p><strong>Produtos/serviços:</strong></p>
          {{itens}}
          <p><strong>Condições de pagamento:</strong> {{condicoes_pagamento}}</p>
          <p><strong>Prazo:</strong> {{prazo_entrega}}</p>
          <p><strong>Data de entrega:</strong> {{data_entrega}}</p>
          <p><strong>Cláusulas adicionais:</strong> {{observacoes}}</p>
        </section>
      `.trim(),
    },
  };

  return defaults[type];
}

function createEmptySalesDocumentPreview() {
  return {
    open: false,
    type: "quote",
    saleId: "",
    title: "",
    html: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    templatePdfDataUrl: "",
    templatePdfName: "",
  };
}

function loadSalesDocumentSettings() {
  try {
    const raw = localStorage.getItem(SALES_DOCUMENT_SETTINGS_STORAGE_KEY);
    if (!raw) {
      state.salesDocumentSettings = createDefaultSalesDocumentSettings();
      return;
    }

    const parsed = JSON.parse(raw);
    state.salesDocumentSettings = normalizeSalesDocumentSettings(parsed);
    state.salesConfigTab = state.salesDocumentSettings.activeTab || "quote";
  } catch {
    state.salesDocumentSettings = createDefaultSalesDocumentSettings();
  }
}

function buildSalesDocumentSettingsCache(settings) {
  const normalized = normalizeSalesDocumentSettings(settings);

  return {
    ...normalized,
    templates: {
      quote: {
        ...normalized.templates.quote,
        pdf_template_data_url: "",
      },
      sale: {
        ...normalized.templates.sale,
        pdf_template_data_url: "",
      },
      contract: {
        ...normalized.templates.contract,
        pdf_template_data_url: "",
      },
    },
  };
}

function saveSalesDocumentSettings() {
  state.salesDocumentSettings.activeTab = state.salesConfigTab;
  localStorage.setItem(
    SALES_DOCUMENT_SETTINGS_STORAGE_KEY,
    JSON.stringify(buildSalesDocumentSettingsCache(state.salesDocumentSettings)),
  );
  renderAuthBranding();
}

async function loadSalesDocumentSettingsFromServer() {
  if (!state.supabase || !state.accessToken) return;

  try {
    const { data, error } = await state.supabase.rpc("get_sales_document_settings", {
      p_access_token: state.accessToken,
    });
    if (error) throw error;
    if (data && typeof data === "object") {
      state.salesDocumentSettings = normalizeSalesDocumentSettings(data);
      state.salesConfigTab = state.salesDocumentSettings.activeTab || state.salesConfigTab || "quote";
      saveSalesDocumentSettings();
    }
  } catch (error) {
    if (isAuthenticationError(error)) {
      throw error;
    }
    console.error("sales settings load", error);
  }
}

async function loadRuntimeSettingsFromServer() {
  await Promise.all([
    loadSalesDocumentSettingsFromServer(),
    loadProductionOperationSettingsFromServer(),
  ]);
}

async function persistSalesDocumentSettings() {
  saveSalesDocumentSettings();

  if (!state.supabase || !state.accessToken) return;

  const { error } = await state.supabase.rpc("save_sales_document_settings", {
    p_access_token: state.accessToken,
    p_settings: state.salesDocumentSettings,
  });
  if (error) throw error;
}

function normalizeSalesDocumentSettings(settings) {
  const defaults = createDefaultSalesDocumentSettings();
  const source = typeof settings === "object" && settings !== null ? settings : {};
  const normalized = {
    activeTab: source.activeTab || defaults.activeTab,
    company: {
      ...defaults.company,
      ...(source.company || {}),
    },
    commercial: {
      ...defaults.commercial,
      ...(source.commercial || {}),
      pix_discount_percent: normalizePercentInput((source.commercial || {}).pix_discount_percent ?? defaults.commercial.pix_discount_percent),
    },
    numbering: {
      ...defaults.numbering,
      ...(source.numbering || {}),
    },
    templates: {
      quote: {
        ...defaults.templates.quote,
        ...((source.templates || {}).quote || {}),
      },
      sale: {
        ...defaults.templates.sale,
        ...((source.templates || {}).sale || {}),
      },
      contract: {
        ...defaults.templates.contract,
        ...((source.templates || {}).contract || {}),
      },
    },
  };

  const legacyContractSignature = "{{empresa_responsavel}}\n{{empresa_responsavel_cargo}}";
  const legacyContractBody = `
        <section>
          <h2>{{documento_titulo}}</h2>
          <p>{{texto_apresentacao}}</p>
          <p><strong>Contratante:</strong> {{empresa_nome}}</p>
          <p><strong>Contratado:</strong> {{cliente_nome}}</p>
          <p><strong>Documento do cliente:</strong> {{cliente_documento}}</p>
          <p><strong>Endereço do cliente:</strong> {{cliente_endereco}}</p>
          <p><strong>Valor do contrato:</strong> {{valor_total}}</p>
          <p><strong>Produtos/serviços:</strong></p>
          {{itens}}
          <p><strong>Condições de pagamento:</strong> {{condicoes_pagamento}}</p>
          <p><strong>Prazo:</strong> {{prazo_entrega}}</p>
          <p><strong>Cláusulas adicionais:</strong> {{observacoes}}</p>
        </section>
      `.trim();

  const previousContractSignature = "{{empresa_nome}}\nCNPJ: {{empresa_cnpj}}\nRepresentante: {{empresa_responsavel}}\n{{empresa_responsavel_cargo}}\n\nCliente: {{cliente_nome}}\nCNPJ: {{cliente_cnpj}}";

  if (
    normalized.templates.contract.signature === legacyContractSignature
    || normalized.templates.contract.signature === previousContractSignature
  ) {
    normalized.templates.contract.signature = defaults.templates.contract.signature;
  }

  if (String(normalized.templates.contract.body_html || "").trim() === legacyContractBody) {
    normalized.templates.contract.body_html = defaults.templates.contract.body_html;
  }

  return normalized;
}

function stripMetadataLines(value) {
  return String(value || "")
    .split("\n")
    .filter((line) => !line.startsWith("[meta:"))
    .join("\n")
    .trim();
}

function addDaysToIsoDate(date, days) {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setDate(parsed.getDate() + Number(days || 0));
  return parsed.toISOString().slice(0, 10);
}

function canManageSalesTemplates() {
  return isPermissionsAdminRole(state.currentUser?.role);
}

function getSalesTemplate(type) {
  return state.salesDocumentSettings.templates[type] || createDefaultSalesTemplate(type);
}

function getSalesTemplatePlaceholderList(type) {
  const base = [
    "{{empresa_nome}}",
    "{{empresa_logo}}",
    "{{empresa_cnpj}}",
    "{{empresa_endereco}}",
    "{{empresa_telefone}}",
    "{{empresa_email}}",
    "{{empresa_site}}",
    "{{empresa_responsavel}}",
    "{{empresa_responsavel_cargo}}",
    "{{cliente_nome}}",
    "{{cliente_cnpj}}",
    "{{cliente_documento}}",
    "{{cliente_ie}}",
    "{{cliente_endereco}}",
    "{{cliente_email}}",
    "{{cliente_telefone}}",
    "{{cliente_contato}}",
    "{{data}}",
    "{{numero_documento}}",
    "{{documento_titulo}}",
    "{{texto_apresentacao}}",
    "{{itens}}",
    "{{valor_subtotal}}",
    "{{valor_desconto}}",
    "{{desconto_pix}}",
    "{{valor_total}}",
    "{{forma_pagamento}}",
    "{{condicoes_pagamento}}",
    "{{prazo_entrega}}",
    "{{data_entrega}}",
    "{{data_de_entrega}}",
    "{{garantia}}",
    "{{observacoes}}",
    "{{mensagem_final}}",
    "{{validade_orcamento}}",
    "{{vendedor_nome}}",
  ];

  if (type === "contract") {
    base.push("{{numero_contrato}}");
  }

  return base;
}

function getSalesTemplatePdfSize(dataUrl) {
  const source = String(dataUrl || "");
  const marker = ";base64,";
  const base64Index = source.indexOf(marker);
  if (base64Index === -1) return 0;
  const base64 = source.slice(base64Index + marker.length);
  if (!base64) return 0;
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function openSalesTemplatePdf(dataUrl) {
  const pdfUrl = String(dataUrl || "").trim();
  if (!pdfUrl) {
    showToast("Nenhum PDF foi carregado para este modelo.", "warning");
    return;
  }

  const pdfWindow = window.open(pdfUrl, "_blank", "noopener,noreferrer");
  if (!pdfWindow) {
    showToast("Não foi possível abrir o PDF do modelo.", "warning");
  }
}

function nextSalesDocumentNumber(type, consume = false) {
  const numbering = state.salesDocumentSettings.numbering;
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearSuffix = String(currentYear).slice(-2);
  const prefixKey = `${type}_prefix`;
  const nextKey = `next_${type}_number`;
  const yearKey = `${type}_year`;
  const prefix = numbering[prefixKey] || createDefaultSalesDocumentSettings().numbering[prefixKey];
  const storedYear = Number(numbering[yearKey] || currentYear);
  const nextValue = storedYear === currentYear ? Number(numbering[nextKey] || 1) : 1;
  const number = `${prefix}-${String(nextValue).padStart(2, "0")}${yearSuffix}`;

  if (consume) {
    numbering[yearKey] = currentYear;
    numbering[nextKey] = nextValue + 1;
    saveSalesDocumentSettings();
  }

  return number;
}

function getSalesDocumentContext(type, sale) {
  const company = state.salesDocumentSettings.company;
  const template = getSalesTemplate(type);
  const metadata = sale ? getSaleMetadata(sale) : getSaleMetadata({});
  const customer = sale && sale.customer_id
    ? (state.moduleData.customers || []).find((item) => item.id === sale.customer_id)
    : null;
  const customerMetadata = customer ? getCustomerMetadata(customer) : {};
  const documentNumber = type === "contract"
    ? (sale?.contract_number || nextSalesDocumentNumber("contract"))
    : type === "sale"
      ? (sale?.sale_number || nextSalesDocumentNumber("sale"))
      : (sale?.sale_number || nextSalesDocumentNumber("quote"));
  const validityDays = Number(template.validity_days || 0);
  const baseDate = sale?.sale_date || new Date().toISOString().slice(0, 10);
  const deliveryDate = sale?.delivery_date || "";
  const deliveryDateLabel = deliveryDate ? formatDate(deliveryDate) : "Data não informada";
  const quoteValidityDate = type === "quote" && sale?.delivery_date ? sale.delivery_date : "";
  const validityDate = quoteValidityDate || (validityDays > 0 ? getDateShiftedIso(baseDate, validityDays) : "");
  const validityDaysLabel = quoteValidityDate
    ? Math.max(0, Math.round((new Date(`${quoteValidityDate}T00:00:00`) - new Date(`${baseDate}T00:00:00`)) / 86400000))
    : validityDays;
  const items = metadata.items?.length ? metadata.items : [
    {
      product_name: "Produto demonstrativo",
      product_code: "DEMO-001",
      quantity: 1,
      unit_price: 1500,
      discount: 0,
      subtotal: 1500,
    },
  ];
  const paymentConditions = metadata.paymentConditions?.length
    ? metadata.paymentConditions
    : normalizeSalesPaymentConditions([{ method: metadata.paymentMethod || sale?.payment_method || "", amount: metadata.total || metadata.subtotal || 0 }], metadata.total || metadata.subtotal || 0);
  const totals = items.length
    ? calculateSalesGrandTotals(items, paymentConditions)
    : { subtotal: 1500, discount: 0, total: 1500, paymentDiscount: 0, itemDiscount: 0 };
  const paymentConditionsLabel = getSalesPaymentConditionsLabel(paymentConditions, Math.max(0, totals.subtotal - totals.itemDiscount));
  const sellerName = getLoggedUserName("Equipe Comercial");

  return {
    company,
    template,
    sale,
    metadata,
    items,
    values: {
      "{{empresa_nome}}": company.company_name || "",
      "{{empresa_logo}}": company.logo ? `<img class="sales-document-inline-logo" src="${company.logo}" alt="Logo ${escapeHtml(company.company_name || "empresa")}" />` : "",
      "{{empresa_cnpj}}": company.cnpj || "",
      "{{empresa_endereco}}": company.address || "",
      "{{empresa_telefone}}": company.phone || "",
      "{{empresa_email}}": company.email || "",
      "{{empresa_site}}": company.site || "",
      "{{empresa_responsavel}}": company.responsible_name || sellerName,
      "{{empresa_responsavel_cargo}}": company.responsible_role || "Comercial",
      "{{cliente_nome}}": sale?.customer_name || customer?.name || "Cliente Exemplo",
      "{{cliente_cnpj}}": sale?.cnpj || customerMetadata.cnpj || "",
      "{{cliente_documento}}": sale?.cnpj || customerMetadata.document || "Documento não informado",
      "{{cliente_ie}}": customerMetadata.state_registration || "",
      "{{cliente_endereco}}": sale?.address || customerMetadata.address || "Endereço não informado",
      "{{cliente_email}}": customerMetadata.email || "cliente@empresa.com",
      "{{cliente_telefone}}": customerMetadata.phone || "(00) 00000-0000",
      "{{cliente_contato}}": customerMetadata.contact || "",
      "{{data}}": formatDate(baseDate),
      "{{numero_documento}}": documentNumber,
      "{{numero_contrato}}": sale?.contract_number || nextSalesDocumentNumber("contract"),
      "{{documento_titulo}}": template.title || "",
      "{{texto_apresentacao}}": template.presentation_text || "",
      "{{valor_subtotal}}": formatCurrency(totals.subtotal),
      "{{valor_desconto}}": formatCurrency(totals.discount),
      "{{desconto_pix}}": formatCurrency(totals.paymentDiscount || 0),
      "{{valor_total}}": formatCurrency(totals.total),
      "{{forma_pagamento}}": paymentConditionsLabel,
      "{{condicoes_pagamento}}": paymentConditionsLabel || template.payment_terms || "",
      "{{prazo_entrega}}": template.delivery_terms || "",
      "{{data_entrega}}": deliveryDateLabel,
      "{{data_de_entrega}}": deliveryDateLabel,
      "{{data_da_entrega}}": deliveryDateLabel,
      "{{garantia}}": template.warranty || "",
      "{{observacoes}}": (metadata.notes || template.notes || "").trim(),
      "{{mensagem_final}}": template.final_message || "",
      "{{validade_orcamento}}": validityDate ? `Orçamento válido por ${validityDaysLabel} dias, até ${formatDate(validityDate)}.` : "Validade do orçamento conforme política comercial.",
      "{{vendedor_nome}}": sellerName,
    },
  };
}

function getSalesDocumentItemProductName(item) {
  const product = (state.moduleData.products || []).find((productItem) =>
    productItem.id === item.product_id
    || productItem.code === item.product_code
    || productItem.name === item.product_name
  );
  return product?.name || item.product_name || "-";
}

function isProductVisibleInCommercialDocuments(product) {
  return Boolean(product)
    && product.status !== "inactive"
    && product.available_for_sale !== false;
}

function renderSalesDocumentItemsTable(items) {
  const rows = items.map((item) => {
    return `
      <tr>
        <td>
          <strong>${escapeHtml(getSalesDocumentItemProductName(item))}</strong>
          ${item.sale_option_label ? `<div class="table-inline-copy">${escapeHtml(item.sale_option_label)}</div>` : ""}
        </td>
        <td>${escapeHtml(item.product_code || "-")}</td>
        <td class="is-centered">${formatWholeQuantity(item.quantity || 0)}</td>
        <td class="is-right">${formatCurrency(item.unit_price || 0)}</td>
        <td class="is-right">${formatCurrency(item.discount || 0)}</td>
        <td class="is-right">${formatCurrency(item.subtotal || 0)}</td>
      </tr>
    `;
  }).join("");

  return `
    <table class="sales-document-items-table">
      <thead>
        <tr>
          <th>Discriminação</th>
          <th>Código</th>
          <th>Quantidade</th>
          <th>Unitário</th>
          <th>Desconto</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderSalesDocumentHeaderBlock(context) {
  const logoHtml = context.company.logo
    ? `<img class="sales-print-logo" src="${context.company.logo}" alt="Logo ${escapeHtml(context.company.company_name || "empresa")}" />`
    : `<div class="sales-print-logo-placeholder">${escapeHtml((context.company.company_name || "Empresa").slice(0, 2).toUpperCase())}</div>`;

  return `
    <header class="sales-print-header">
      <div class="sales-print-logo-box">
        ${logoHtml}
      </div>
      <div class="sales-print-company">
        <span class="sales-print-company-name">${escapeHtml(context.company.company_name || "Empresa")}</span>
        <span>${escapeHtml(context.company.cnpj || "")}</span>
        <span>${escapeHtml(context.company.address || "")}</span>
        <span>${escapeHtml(context.company.phone || "")}</span>
        <span>${escapeHtml(context.company.email || "")}</span>
      </div>
    </header>
  `;
}

function renderSalesDocumentMetaBlock(type, context) {
  const numberLabel = type === "contract"
    ? "Número do contrato"
    : type === "sale"
      ? "Número da venda"
      : "Número do orçamento";

  return `
    <section class="sales-print-meta">
      <div class="sales-print-meta-item">
        <span class="sales-print-meta-label">Cliente</span>
        <strong>${escapeHtml(context.values["{{cliente_nome}}"])}</strong>
      </div>
      <div class="sales-print-meta-item">
        <span class="sales-print-meta-label">CNPJ do cliente</span>
        <strong>${escapeHtml(context.values["{{cliente_cnpj}}"] || "-")}</strong>
      </div>
      <div class="sales-print-meta-item">
        <span class="sales-print-meta-label">Data</span>
        <strong>${escapeHtml(context.values["{{data}}"])}</strong>
      </div>
      <div class="sales-print-meta-item">
        <span class="sales-print-meta-label">${numberLabel}</span>
        <strong>${escapeHtml(context.values["{{numero_documento}}"])}</strong>
      </div>
    </section>
  `;
}

function renderSalesDocumentSummaryBlock(context) {
  return `
    <aside class="sales-print-summary">
      <div class="sales-print-summary-row">
        <span>Subtotal</span>
        <strong>${escapeHtml(context.values["{{valor_subtotal}}"])}</strong>
      </div>
      <div class="sales-print-summary-row">
        <span>Desconto</span>
        <strong>${escapeHtml(context.values["{{valor_desconto}}"])}</strong>
      </div>
      <div class="sales-print-summary-row sales-print-summary-total">
        <span>Total</span>
        <strong>${escapeHtml(context.values["{{valor_total}}"])}</strong>
      </div>
    </aside>
  `;
}

function renderSalesDocumentContactBlock(context, template) {
  const contactText = [
    context.company.phone ? `WhatsApp: ${context.company.phone}` : "",
    context.company.email ? `Email: ${context.company.email}` : "",
    context.company.site ? `Site: ${context.company.site}` : "",
  ].filter(Boolean).join(" | ");

  return `
    <section class="sales-print-contact">
      <strong>Contato</strong>
      <div>${escapeHtml(interpolateSalesDocumentTemplate(template.contact_details || contactText, context))}</div>
    </section>
  `;
}

function renderSalesDocumentFooterBlock(context, template) {
  return `
    <footer class="sales-print-footer">
      <p>${escapeHtml(interpolateSalesDocumentTemplate(template.footer, context))}</p>
    </footer>
  `;
}

function normalizeSalesPlaceholderKey(value) {
  return String(value || "")
    .replace(/[{}]/g, "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function interpolateSalesDocumentTemplate(content, context, extraValues = {}) {
  const values = {
    ...context.values,
    ...extraValues,
  };
  const normalizedValues = new Map(
    Object.entries(values).map(([key, value]) => [normalizeSalesPlaceholderKey(key), value])
  );

  return String(content || "").replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
    const normalizedKey = normalizeSalesPlaceholderKey(key);
    if (!normalizedValues.has(normalizedKey)) {
      return match;
    }
    return String(normalizedValues.get(normalizedKey) ?? "");
  });
}

function renderSalesContractDocument(context, template, itemsTableHtml, interpolate) {
  const companyName = escapeHtml(context.values["{{empresa_nome}}"]);
  const companyDocument = escapeHtml(context.values["{{empresa_cnpj}}"] || "-");
  const companyAddress = escapeHtml(context.values["{{empresa_endereco}}"] || "Endereço não informado");
  const customerName = escapeHtml(context.values["{{cliente_nome}}"]);
  const customerDocument = escapeHtml(context.values["{{cliente_cnpj}}"] || context.values["{{cliente_documento}}"] || "-");
  const customerAddress = escapeHtml(context.values["{{cliente_endereco}}"] || "Endereço não informado");
  const contractDateLocation = `São Gonçalo do Sapucaí - MG, ${context.values["{{data}}"]}`;
  const introHtml = `
    <p>
      Pelo presente instrumento particular de contratação para fabricação, venda e compra de máquinas e equipamentos, de um lado
      <strong>${companyName}</strong>, pessoa jurídica de direito privado, constituída como sociedade empresária limitada,
      inscrita no CNPJ sob o nº <strong>${companyDocument}</strong>, com endereço em
      <strong>${companyAddress}</strong>, neste ato representada por seu administrador, doravante denominada <strong>FABRICANTE</strong>;
      e, de outro lado, <strong>${customerName}</strong>, pessoa jurídica inscrita no CNPJ sob o nº <strong>${customerDocument}</strong>,
      estabelecida em <strong>${customerAddress}</strong>, doravante denominada <strong>CLIENTE</strong>, tem entre si justo e contratado o que segue.
    </p>
    <p><strong>Objeto:</strong></p>
  `.trim();
  const financialDetailsHtml = [
    context.values["{{condicoes_pagamento}}"] ? `<p><strong>Preço e Pagamento:</strong><br>${escapeHtml(context.values["{{condicoes_pagamento}}"])}</p>` : "",
    `<p><strong>Total:</strong> ${escapeHtml(context.values["{{valor_total}}"])}</p>`,
    context.values["{{prazo_entrega}}"] ? `<p><strong>Prazo de entrega:</strong> ${escapeHtml(context.values["{{prazo_entrega}}"])}</p>` : "",
    context.values["{{data_entrega}}"] ? `<p><strong>Data de entrega:</strong> ${escapeHtml(context.values["{{data_entrega}}"])}</p>` : "",
    context.values["{{observacoes}}"] ? `<p><strong>Outras informações:</strong><br>${escapeHtml(context.values["{{observacoes}}"])}</p>` : "",
  ].filter(Boolean).join("");
  const summaryHtml = `
    <aside class="summary">
      <div class="summary-row">
        <span>Subtotal</span>
        <strong>${escapeHtml(context.values["{{valor_subtotal}}"])}</strong>
      </div>
      <div class="summary-row">
        <span>Desconto</span>
        <strong>${escapeHtml(context.values["{{valor_desconto}}"])}</strong>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <strong>${escapeHtml(context.values["{{valor_total}}"])}</strong>
      </div>
    </aside>
  `;
  const pageOneLegalHtml = [
    context.values["{{garantia}}"] ? `<p><strong>Garantias:</strong><br>${escapeHtmlWithLineBreaks(context.values["{{garantia}}"])}</p>` : "",
  ].filter(Boolean).join("");
  const declarationsHtml = `<p><strong>Declarações:</strong><br>${companyName} declara conhecer plenamente os requisitos de qualidade necessários para a confecção de equipamentos destinados à indústria farmacêutica, bem como as normas nacionais e internas aplicáveis.</p>`;
  const rescissionHtml = `<p><strong>Rescisão contratual com multa:</strong><br>Em caso de rescisão sem justa causa por parte do CLIENTE, este pagará à FABRICANTE a quantia correspondente a 20% do valor total do contrato.</p>`;
  const approvalHtml = context.values["{{mensagem_final}}"]
    ? `<p><strong>Aprovação:</strong><br>${escapeHtml(context.values["{{mensagem_final}}"])}</p>`
    : "";
  const contractDateHtml = `<p><strong>${escapeHtml(contractDateLocation)}</strong></p>`;

  return `
    <article class="sales-document-sheet sales-document-sheet-contract sales-contract-document">
      <div class="document">
        <section class="print-page page-1">
          <header class="header">
            <div class="header-logo">
            ${context.company.logo
              ? `<img src="${context.company.logo}" alt="Logo ${escapeHtml(context.company.company_name || "empresa")}" />`
              : `<div class="header-logo-placeholder">${escapeHtml((context.company.company_name || "Empresa").slice(0, 2).toUpperCase())}</div>`}
            </div>
            <div class="header-company">
              <h1>${escapeHtml(context.company.company_name || "Empresa")}</h1>
              <p>${escapeHtml(context.company.cnpj || "")}</p>
              <p>${escapeHtml(context.company.address || "")}</p>
              <p>${escapeHtml(context.company.phone || "")}</p>
              <p>${escapeHtml(context.company.email || "")}</p>
            </div>
          </header>

          <section class="contract-meta">
            <div class="meta-col">
              <div class="meta-group">
                <span class="meta-label">Cliente</span>
                <strong>${customerName}</strong>
              </div>
              <div class="meta-group">
                <span class="meta-label">Data</span>
                <strong>${escapeHtml(context.values["{{data}}"])}</strong>
              </div>
            </div>

            <div class="meta-col">
              <div class="meta-group">
                <span class="meta-label">CNPJ do cliente</span>
                <strong>${customerDocument}</strong>
              </div>
              <div class="meta-group">
                <span class="meta-label">Número do contrato</span>
                <strong>${escapeHtml(context.values["{{numero_documento}}"])}</strong>
              </div>
            </div>
          </section>

          <section class="title-band">
            ${escapeHtml(interpolate(template.header || template.title || "CONTRATO"))}
          </section>

          <section class="contract-intro">
            ${introHtml}
          </section>

          <section class="contract-items">
            <div class="table-wrap">
              ${itemsTableHtml}
            </div>
          </section>

          <section class="financial-block">
            <div class="financial-text">
              ${financialDetailsHtml}
            </div>
            ${summaryHtml}
          </section>

          ${pageOneLegalHtml
            ? `<section class="contract-legal contract-legal-page-1">
            ${pageOneLegalHtml}
          </section>`
            : ""}

        </section>

        <section class="print-page page-2">
          <section class="contract-legal">
            ${declarationsHtml}
          </section>

          <section class="contract-legal">
            ${rescissionHtml}
          </section>

          <section class="contract-approval">
            ${approvalHtml}
          </section>

          <section class="contract-approval">
            ${contractDateHtml}
          </section>

          <section class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-name">${companyName}</div>
              <div class="signature-doc">CNPJ: ${companyDocument}</div>
            </div>

            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-name">${customerName}</div>
              <div class="signature-doc">CNPJ: ${customerDocument}</div>
            </div>
          </section>

          <footer class="contact">
            <strong>Contato</strong>
            <p>${escapeHtml(interpolate(template.contact_details || `${context.company.phone || ""} | ${context.company.email || ""} | ${context.company.site || ""}`))}</p>
          </footer>
        </section>
      </div>
    </article>
  `.trim();
}

function resolveSalesTemplateContent(type, sale) {
  const context = getSalesDocumentContext(type, sale);
  const template = context.template;
  const itemsTableHtml = renderSalesDocumentItemsTable(context.items);
  const interpolate = (content, extraValues = {}) => interpolateSalesDocumentTemplate(content, context, {
    "{{itens}}": itemsTableHtml,
    ...extraValues,
  });

  const blockSections = [
    context.values["{{texto_apresentacao}}"] ? `<section class="sales-print-block"><p>${escapeHtml(context.values["{{texto_apresentacao}}"])}</p></section>` : "",
    `<section class="sales-print-table-wrap">${itemsTableHtml}</section>`,
    renderSalesDocumentSummaryBlock(context),
    context.values["{{condicoes_pagamento}}"] ? `<section class="sales-print-block"><p><strong>Pagamento:</strong><br>${escapeHtmlWithLineBreaks(context.values["{{condicoes_pagamento}}"])}</p></section>` : "",
    context.values["{{prazo_entrega}}"] ? `<section class="sales-print-block"><p><strong>Prazo de entrega:</strong> ${escapeHtml(context.values["{{prazo_entrega}}"])}</p></section>` : "",
    type !== "quote" && context.values["{{data_entrega}}"] ? `<section class="sales-print-block"><p><strong>Data de entrega:</strong> ${escapeHtml(context.values["{{data_entrega}}"])}</p></section>` : "",
    type === "quote" && context.values["{{validade_orcamento}}"] ? `<section class="sales-print-block"><p><strong>Validade do orçamento:</strong> ${escapeHtml(context.values["{{validade_orcamento}}"])}</p></section>` : "",
    context.values["{{garantia}}"] ? `<section class="sales-print-block"><p><strong>Garantia:</strong><br>${escapeHtmlWithLineBreaks(context.values["{{garantia}}"])}</p></section>` : "",
    context.values["{{observacoes}}"] ? `<section class="sales-print-block"><p><strong>Observações:</strong> ${escapeHtml(context.values["{{observacoes}}"])}</p></section>` : "",
  ].filter(Boolean).join("");

  if (type !== "contract") {
    const html = `
      <article class="sales-document-sheet sales-document-sheet-${type}">
        <div class="sales-print-shell">
          ${renderSalesDocumentHeaderBlock(context)}
          ${renderSalesDocumentMetaBlock(type, context)}
          <section class="sales-print-band">
            ${escapeHtml(interpolate(template.header))}
          </section>
          ${blockSections}
          ${renderSalesDocumentContactBlock(context, template)}
          ${renderSalesDocumentFooterBlock(context, template)}
        </div>
      </article>
    `.trim();

    return {
      html,
      customerName: context.values["{{cliente_nome}}"],
      customerEmail: context.values["{{cliente_email}}"],
      customerPhone: context.values["{{cliente_telefone}}"],
      title: template.title || "",
      documentNumber: context.values["{{numero_documento}}"],
      templatePdfDataUrl: template.pdf_template_data_url || "",
      templatePdfName: template.pdf_template_name || "",
    };
  }

  const html = renderSalesContractDocument(context, template, itemsTableHtml, interpolate);

  return {
    html,
    customerName: context.values["{{cliente_nome}}"],
    customerEmail: context.values["{{cliente_email}}"],
    customerPhone: context.values["{{cliente_telefone}}"],
    title: template.title || "",
    documentNumber: context.values["{{numero_documento}}"],
    templatePdfDataUrl: template.pdf_template_data_url || "",
    templatePdfName: template.pdf_template_name || "",
  };
}

function buildSalesDraftPreviewRecord(type) {
  if (state.openAccordionKey !== "sales-form") {
    return null;
  }

  const items = normalizeSalesItems(state.salesDraft.items || []);
  const itemTotals = calculateSalesTotals(items);
  const paymentConditions = normalizeSalesPaymentConditions(state.salesDraft.payment_conditions || [], itemTotals.total);
  const totals = calculateSalesGrandTotals(items, paymentConditions);
  return {
    id: "",
    customer_id: state.salesDraft.customer_id || null,
    customer_name: state.salesDraft.customer_name || "",
    cnpj: state.salesDraft.cnpj || "",
    address: state.salesDraft.address || "",
    invoice_number: state.salesDraft.invoice_number || "",
    contract_number: state.salesDraft.contract_number || "",
    contract_notes: [
      state.salesDraft.contract_notes || "",
      paymentConditions.length ? `[meta:payment_conditions]${JSON.stringify(paymentConditions)}` : "",
    ].filter(Boolean).join("\n"),
    sale_date: state.salesDraft.sale_date || new Date().toISOString().slice(0, 10),
    delivery_date: state.salesDraft.delivery_date || "",
    payment_method: paymentConditions[0]?.method || state.salesDraft.payment_method || "",
    status: type === "sale" ? "finalized" : "quote",
    sale_items: items,
    subtotal_amount: totals.subtotal,
    discount_amount: totals.discount,
    total_amount: totals.total,
  };
}

function openSalesDocumentPreview(type, saleId = "") {
  const sale = saleId
    ? (state.moduleData.sales || []).find((item) => item.id === saleId)
    : buildSalesDraftPreviewRecord(type);
  const preview = resolveSalesTemplateContent(type, sale);
  state.salesDocumentPreview = {
    open: true,
    type,
    saleId: sale?.id || "",
    title: preview.title,
    html: preview.html,
    customerName: preview.customerName,
    customerEmail: preview.customerEmail,
    customerPhone: preview.customerPhone,
    templatePdfDataUrl: preview.templatePdfDataUrl,
    templatePdfName: preview.templatePdfName,
  };
  void queueSystemLog({
    moduleKey: "sales",
    action: "geracao_pdf",
    level: "Informativo",
    itemAffected: sale?.sale_number || sale?.id || type,
    description: `Pré-visualização de documento comercial do tipo ${type}.`,
    entityType: "sales_document",
    entityId: sale?.id || null,
    payload: { type, sale_id: sale?.id || null },
  });
  renderActiveModule();
}

function closeSalesDocumentPreview() {
  state.salesDocumentPreview = createEmptySalesDocumentPreview();
}

function openPrintWindowForHtml(html, title) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) {
    showToast("Não foi possível abrir a visualização de impressão.", "warning");
    return;
  }

  printWindow.document.write(`
    <html lang="pt-BR">
      <head>
        <title>${escapeHtml(title || "Documento Comercial")}</title>
        <meta charset="utf-8" />
        <style>
          :root { --brand-blue: #003c96; --line: #dbe5f0; --ink: #0f172a; --muted: #64748b; --bg: #eef2f7; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: var(--ink); background: var(--bg); }
          body { padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sales-document-sheet { width: 210mm; max-width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 12mm; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); overflow: hidden; }
          .sales-print-shell { width: 100%; }
          .sales-print-header { display: flex; align-items: flex-start; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap; gap: 18px; margin-bottom: 12px; }
          .sales-print-logo-box { flex: 0 0 220px; min-width: 220px; display: flex; align-items: flex-start; justify-content: flex-start; }
          .sales-print-logo, .sales-print-logo-placeholder { width: 100%; max-width: 220px; height: 74px; display: block; }
          .sales-print-logo { object-fit: contain; background: #fff; border: 1px solid #dbe5f0; border-radius: 18px; padding: 8px 12px; }
          .sales-print-logo-placeholder { display: grid; place-items: center; background: #e2e8f0; color: #1e293b; font-size: 24px; font-weight: 700; }
          .sales-print-company { flex: 1; display: flex; flex-direction: column; gap: 4px; }
          .sales-print-company-name { font-size: 19px; font-weight: 700; line-height: 1.2; color: #111827; }
          .sales-print-company span { font-size: 12px; line-height: 1.35; }
          .sales-print-meta { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(2, auto); grid-auto-flow: column; gap: 12px 40px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; }
          .sales-print-meta-item { padding: 2px 0; }
          .sales-print-meta-label { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .sales-print-meta-item strong { font-size: 13px; color: #111827; }
          .sales-print-band { margin-top: 14px; padding: 10px 14px; border-radius: 10px; background: var(--brand-blue); color: #fff; text-align: center; font-size: 13px; font-weight: 700; line-height: 1.4; }
          .sales-print-block { margin-top: 10px; font-size: 12px; line-height: 1.5; color: #1f2937; }
          .sales-print-block p, .sales-print-footer p { margin: 0; }
          .sales-print-table-wrap { margin-top: 12px; }
          .sales-document-items-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; margin-top: 12px; }
          .sales-document-items-table thead th { background: var(--brand-blue); color: #fff; font-size: 11px; text-align: left; padding: 9px 10px; line-height: 1.2; }
          .sales-document-items-table tbody td { font-size: 11px; padding: 9px 10px; border-bottom: 1px solid #e5edf6; line-height: 1.3; }
          .sales-document-items-table tbody tr:nth-child(even) td { background: #f8fbff; }
          .sales-document-items-table tbody tr:last-child td { border-bottom: none; }
          .sales-document-items-table .is-centered { text-align: center; }
          .sales-document-items-table .is-right { text-align: right; }
          .sales-print-summary { width: 280px; margin: 10px 0 0 auto; display: flex; flex-direction: column; gap: 6px; }
          .sales-print-summary-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; font-size: 11px; background: #fff; }
          .sales-print-summary-total { color: var(--brand-blue); font-weight: 700; font-size: 13px; }
          .sales-print-contact { margin-top: 14px; text-align: center; }
          .sales-print-contact strong { display: block; font-size: 13px; margin-bottom: 5px; }
          .sales-print-contact div { font-size: 11px; line-height: 1.5; }
          .sales-print-signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 36px; margin-top: 24px; align-items: start; }
          .sales-print-signature-card { display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 11px; line-height: 1.5; }
          .sales-print-signature-line { display: block; width: 100%; margin: 0 0 8px; border-top: 1px solid #0f172a; }
          .sales-print-contract-body { white-space: normal; }
          .sales-print-contract-body h1, .sales-print-contract-body h2, .sales-print-contract-body h3, .sales-print-contract-body h4 { margin: 0 0 8px; color: #111827; }
          .sales-print-contract-body p, .sales-print-contract-body li { font-size: 12px; line-height: 1.55; }
          .sales-print-footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid var(--line); color: #94a3b8; text-align: center; font-size: 10px; line-height: 1.4; }
          .document { width: 100%; margin: 0; padding: 0; background: #fff; display: grid; gap: 22px; }
          .print-page { width: 100%; min-height: 0; background: #fff; padding: 12mm; }
          .header { display: flex; align-items: flex-start; gap: 18px; padding-bottom: 10px; border-bottom: 1px solid #d9e1ea; }
          .header-logo { width: 220px; flex-shrink: 0; display: flex; justify-content: flex-start; }
          .header-logo img, .header-logo-placeholder { width: 100%; max-width: 220px; height: 74px; display: block; }
          .header-logo img { object-fit: contain; background: #fff; border: 1px solid #dbe5f0; border-radius: 18px; padding: 8px 12px; }
          .header-logo-placeholder { display: grid; place-items: center; background: #e2e8f0; color: #1e293b; font-size: 24px; font-weight: 700; }
          .header-company { flex: 1; }
          .header-company h1 { margin: 0 0 6px; font-size: 16px; line-height: 1.2; }
          .header-company p { margin: 0 0 4px; font-size: 12px; line-height: 1.35; }
          .contract-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 40px; margin-top: 12px; }
          .meta-col { display: grid; gap: 10px; }
          .meta-group { display: grid; gap: 4px; }
          .meta-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; }
          .meta-group strong { font-size: 13px; line-height: 1.3; }
          .title-band { margin-top: 14px; background: #0b4aa8; color: #fff; text-align: center; padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 700; line-height: 1.35; }
          .contract-intro, .contract-legal, .contract-approval, .financial-text { margin-top: 12px; font-size: 11px; line-height: 1.6; }
          .contract-intro p, .contract-legal p, .contract-approval p, .financial-text p { margin: 0 0 8px; }
          .contract-items { margin-top: 12px; }
          .table-wrap { margin-top: 6px; }
          .financial-block { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-top: 14px; break-inside: avoid; page-break-inside: avoid; }
          .summary { width: 280px; display: flex; flex-direction: column; gap: 8px; break-inside: avoid; page-break-inside: avoid; }
          .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border: 1px solid #d9e1ea; border-radius: 8px; font-size: 11px; }
          .summary-row.total { color: #0b4aa8; font-size: 13px; font-weight: 700; }
          .signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 48px; margin-top: 28px; break-inside: avoid; page-break-inside: avoid; }
          .signature-box { width: 100%; text-align: center; break-inside: avoid; page-break-inside: avoid; min-height: 132px; display: flex; flex-direction: column; justify-content: flex-end; }
          .signature-line { border-top: 1px solid #1f2937; margin-bottom: 12px; min-height: 72px; }
          .signature-name { font-size: 12px; font-weight: 700; }
          .signature-doc { margin-top: 3px; font-size: 11px; }
          .contact { margin-top: 22px; padding-top: 10px; border-top: 1px solid #d9e1ea; text-align: center; }
          .contact strong { display: block; font-size: 13px; margin-bottom: 4px; }
          .contact p { margin: 0; font-size: 11px; line-height: 1.5; }
          @page { size: A4; margin: 10mm; }
          @media print {
            html, body { width: 100%; min-height: 100%; margin: 0; padding: 0; background: #fff; }
            body { padding: 0; }
            .sales-document-sheet { width: 100%; max-width: none; min-height: auto; margin: 0; padding: 0; box-shadow: none; overflow: visible; }
            .document { display: block; gap: 0; }
            .print-page { box-sizing: border-box; width: 100%; min-height: 0; break-after: page; page-break-after: always; }
            .print-page { background: #fff; padding: 6mm 7mm; box-shadow: none; }
            .print-page:last-child { break-after: auto; page-break-after: auto; }
            .contract-meta,
            .contract-items,
            .financial-block,
            .summary,
            .signatures,
            .signature-box,
            table,
            tr,
            td,
            th { break-inside: avoid; page-break-inside: avoid; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            .contract-meta { grid-template-columns: 1fr 1fr !important; }
            .signatures { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .header { gap: 12px; padding-bottom: 6px; }
            .header-logo { width: 168px; }
            .header-logo img, .header-logo-placeholder { max-width: 168px; height: 58px; }
            .header-company h1 { margin: 0 0 3px; font-size: 14px; }
            .header-company p { margin: 0 0 2px; font-size: 10px; line-height: 1.2; }
            .contract-meta { gap: 8px 20px; margin-top: 8px; }
            .meta-col { gap: 6px; }
            .meta-label { font-size: 9px; }
            .meta-group strong { font-size: 11px; line-height: 1.15; }
            .title-band { margin-top: 8px; padding: 8px 11px; font-size: 12.5px; line-height: 1.2; }
            .contract-intro, .contract-legal, .contract-approval, .financial-text { margin-top: 8px; font-size: 10.5px; line-height: 1.38; }
            .contract-intro p, .contract-legal p, .contract-approval p, .financial-text p { margin: 0 0 5px; }
            .contract-approval { margin-top: 4px; }
            .contract-approval p { margin: 0 0 2px; }
            .contract-items { margin-top: 8px; }
            .table-wrap { margin-top: 2px; }
            .sales-document-items-table { margin-top: 4px; }
            .sales-document-items-table thead th, .sales-document-items-table tbody td { padding: 6px 7px; font-size: 10.5px; line-height: 1.15; }
            .financial-block { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(180px, 0.9fr); gap: 12px; margin-top: 8px; }
            .summary { width: auto; gap: 5px; }
            .summary-row { padding: 6px 8px; font-size: 10.5px; }
            .summary-row.total { font-size: 11.5px; }
            .signatures { gap: 24px; margin-top: 2px; }
            .signature-box { min-height: 96px; }
            .signature-line { min-height: 44px; margin-bottom: 6px; }
            .signature-name { font-size: 11px; }
            .signature-doc { font-size: 10px; }
            .contact { margin-top: 10px; padding-top: 6px; }
            .contact strong { font-size: 12px; }
            .contact p { font-size: 10px; line-height: 1.25; }
          }
          @media (max-width: 720px) { body { padding: 12px; } .sales-document-sheet { width: 100%; min-height: auto; padding: 16px; } .sales-print-header { flex-direction: row; align-items: flex-start; } .sales-print-meta { display: grid; grid-template-columns: 1fr; } .sales-print-summary { width: 100%; } .sales-print-signatures { grid-template-columns: 1fr; } .financial-block { flex-direction: column; } }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  void queueSystemLog({
    moduleKey: state.activeModule,
    action: "geracao_pdf",
    level: "Informativo",
    itemAffected: title || "Documento",
    description: `Geração de PDF/impressão no módulo ${getModuleLabel(state.activeModule)}.`,
    entityType: "document",
  });
}

function createEmptyBomStructureDraft() {
  return {
    edit_id: "",
    code: "",
    product_id: "",
    product_code: "",
    product_name: "",
    category: "",
    sale_option_id: "",
    sale_option_code: "",
    sale_option_label: "",
    name: "",
    version: "1.0",
    batch_size: "1",
    batch_unit: "un",
    status: "draft",
    instructions: "",
    height: "",
    width: "",
    length: "",
    weight: "",
    notes: "",
  };
}

function buildBomComponentOptions() {
  const selectedProductId = state.bomStructureDraft?.product_id || "";
  const availableProducts = (state.moduleData.products || []).filter((item) => item.id !== selectedProductId);
  const productOptions = availableProducts.map((item) => ({
    value: `product:${item.id}`,
    label: `Produto • ${item.name} (${item.code})`,
  }));
  const materialOptions = (state.moduleData.bomMaterials || []).map((item) => ({
    value: `material:${item.id}`,
    label: `Material • ${item.name} (${item.code})`,
  }));
  const structureOptions = (state.moduleData.bomStructures || [])
    .filter((item) => item.status === "active" && item.id !== state.bomStructureDraft?.edit_id)
    .map((item) => ({
      value: `structure:${item.id}`,
      label: `Conjunto • ${item.name} v${item.version}`,
    }));

  return [...productOptions, ...materialOptions, ...structureOptions];
}

function getBomDraftItemVariationOptions(item) {
  const [type, productId] = String(item?.sourceKey || "").split(":");
  if (type !== "product" || !productId) return [];

  const product = (state.moduleData.products || []).find((productItem) => productItem.id === productId);
  return normalizeProductSaleOptions(product).map((option) => ({
    value: option.id || option.code || option.label,
    label: `${option.code ? `${option.code} - ` : ""}${option.label}`,
  }));
}

function getBomFinalProductVariationOptions() {
  const product = (state.moduleData.products || []).find((productItem) => productItem.id === state.bomStructureDraft?.product_id);
  return normalizeProductSaleOptions(product).map((option) => ({
    value: option.id || option.code || option.label,
    label: `${option.code ? `${option.code} - ` : ""}${option.label}`,
  }));
}

function getBomFinalProductProductionSections() {
  const product = (state.moduleData.products || []).find((productItem) => productItem.id === state.bomStructureDraft?.product_id);
  return getProductProductionSections(product);
}

function findProductionSectionForProduct(product, sectionIdOrLabel) {
  const value = String(sectionIdOrLabel || "").trim();
  if (!value) return null;
  return getProductProductionSections(product).find((section) => section.id === value || section.label === value) || null;
}

function buildProductOptions() {
  return (state.moduleData.products || []).map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})`,
  }));
}

function getBomComponentByKey(sourceKey, saleOptionId = "") {
  const [type, id, ...detailParts] = String(sourceKey || "").split(":");
  if (!type || !id) return null;

  if (type === "material") {
    const material = (state.moduleData.bomMaterials || []).find((item) => item.id === id);
    if (!material) return null;
    return {
      type,
      id,
      code: material.code,
      name: material.name,
      unit: material.unit,
      unitCost: Number(material.unit_cost || 0),
    };
  }

  if (type === "product") {
    if (id === state.bomStructureDraft?.product_id) return null;
    const product = (state.moduleData.products || []).find((item) => item.id === id);
    if (!product) return null;
    const option = saleOptionId ? findProductSaleOption(product, saleOptionId) : null;
    if (option) {
      return {
        type,
        id,
        code: option.code || product.code,
        name: `${product.name} - ${option.label}`,
        unit: product.unit,
        unitCost: Number(option.price || 0),
        saleOption: option,
      };
    }
    return {
      type,
      id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      unitCost: getProductBomUnitCost(product),
    };
  }

  if (type === "product_option") {
    if (id === state.bomStructureDraft?.product_id) return null;
    const product = (state.moduleData.products || []).find((item) => item.id === id);
    if (!product) return null;

    let optionId = "";
    try {
      optionId = decodeURIComponent(detailParts.join(":"));
    } catch {
      optionId = detailParts.join(":");
    }
    const option = normalizeProductSaleOptions(product).find((item) =>
      item.id === optionId || item.code === optionId || item.label === optionId
    );
    if (!option) return null;

    return {
      type: "product",
      id,
      code: option.code || product.code,
      name: `${product.name} - ${option.label}`,
      unit: product.unit,
      unitCost: Number(option.price || 0),
      saleOption: option,
    };
  }

  if (type === "structure") {
    const structure = (state.moduleData.bomStructures || []).find((item) => item.id === id);
    if (!structure) return null;
    return {
      type,
      id,
      code: structure.code,
      name: structure.name,
      unit: structure.batch_unit,
      unitCost: Number(structure.total_cost || 0),
    };
  }

  return null;
}

function getBomDraftItemComputed(item) {
  const component = getBomComponentByKey(item.sourceKey, item.saleOptionId);
  const hasManualUnitCost = item.unitCost !== "" && item.unitCost !== null && item.unitCost !== undefined;
  const unitCost = hasManualUnitCost ? parseCurrencyInput(item.unitCost) : Number(component?.unitCost || 0);
  const quantity = Math.round(Number(item.quantity || 0));
  return {
    component,
    unitCost,
    quantity,
    totalCost: unitCost * quantity,
  };
}

function calculateBomDraftTotal() {
  return state.bomDraftItems.reduce((total, item) => total + getBomDraftItemComputed(item).totalCost, 0);
}

function getProductBomUnitCost(product) {
  if (!product) return 0;
  const costPrice = Number(product.cost_price || 0);
  return costPrice;
}

function resolveBomComponentForStructureRecalc(sourceKey, saleOptionId = "", context = {}) {
  const { products = [], materials = [], structures = [], currentStructure = null } = context;
  const [type, id, ...detailParts] = String(sourceKey || "").split(":");
  if (!type || !id) return null;

  if (type === "material") {
    const material = materials.find((item) => item.id === id);
    if (!material) return null;
    return {
      type,
      id,
      code: material.code,
      name: material.name,
      unit: material.unit,
      unitCost: Number(material.unit_cost || 0),
    };
  }

  if (type === "product" || type === "product_option") {
    if (id === currentStructure?.product_id) return null;
    const product = products.find((item) => item.id === id);
    if (!product) return null;

    let resolvedSaleOptionId = saleOptionId || "";
    if (type === "product_option" && !resolvedSaleOptionId) {
      try {
        resolvedSaleOptionId = decodeURIComponent(detailParts.join(":"));
      } catch {
        resolvedSaleOptionId = detailParts.join(":");
      }
    }

    const option = resolvedSaleOptionId ? findProductSaleOption(product, resolvedSaleOptionId) : null;
    if (option) {
      return {
        type: "product",
        id,
        code: option.code || product.code,
        name: `${product.name} - ${option.label}`,
        unit: product.unit,
        unitCost: Number(option.price || 0),
        saleOption: option,
      };
    }

    return {
      type: "product",
      id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      unitCost: getProductBomUnitCost(product),
    };
  }

  if (type === "structure") {
    const structure = structures.find((item) => item.id === id);
    if (!structure) return null;
    return {
      type,
      id,
      code: structure.code,
      name: structure.name,
      unit: structure.batch_unit,
      unitCost: Number(structure.total_cost || 0),
    };
  }

  return null;
}

function buildBomStructurePayloadFromRecord(structure, context = {}) {
  const { products = [] } = context;
  const selectedProduct = products.find((item) => item.id === structure.product_id);
  const selectedSaleOption = selectedProduct
    ? findProductSaleOption(
      selectedProduct,
      structure.sale_option_id || structure.sale_option_code || structure.sale_option_label || ""
    )
    : null;
  const normalizedItems = (Array.isArray(structure.structure_items) ? structure.structure_items : [])
    .map((item) => {
      const sourceKey = item.source_key || `${item.source_type}:${item.component_id}`;
      const component = resolveBomComponentForStructureRecalc(
        sourceKey,
        item.sale_option_id || item.sale_option_code || item.sale_option_label || "",
        {
        ...context,
        currentStructure: structure,
        }
      );
      const quantity = normalizeWholeNumber(item.quantity || 0, { min: 1, fallback: 1 });
      const unitCost = component ? Number(component.unitCost || 0) : Number(item.unit_cost || 0);
      return {
        source_key: sourceKey,
        source_type: component?.type || item.source_type || "",
        component_id: component?.id || item.component_id || "",
        code: component?.code || item.code || "",
        name: component?.name || item.name || "",
        unit: component?.unit || item.unit || "un",
        sale_option_id: component?.saleOption?.id || "",
        sale_option_code: component?.saleOption?.code || "",
        sale_option_label: component?.saleOption?.label || "",
        production_quantity: normalizeWholeNumber(component?.saleOption?.production_quantity || item.production_quantity || 0, { min: 0, fallback: 0 }),
        kit_structure_id: component?.saleOption?.kit_structure_id || item.kit_structure_id || "",
        production_section_id: item.production_section_id || "",
        production_section_label: item.production_section_label || "",
        quantity,
        unit_cost: unitCost,
        total_cost: unitCost * quantity,
      };
    })
    .filter((item) => item.component_id && item.quantity > 0);

  return {
    code: selectedSaleOption?.code || selectedProduct?.code || structure.code || "",
    product_id: structure.product_id || "",
    product_code: selectedProduct?.code || structure.product_code || "",
    product_name: selectedProduct?.name || structure.product_name || "",
    category: normalizeCategoryInput(structure.category, "geral"),
    sale_option_id: selectedSaleOption?.id || "",
    sale_option_code: selectedSaleOption?.code || "",
    sale_option_label: selectedSaleOption?.label || "",
    name: selectedSaleOption ? `${selectedProduct?.name || ""} - ${selectedSaleOption.label}` : (selectedProduct?.name || structure.name || ""),
    version: structure.version || "1.0",
    batch_size: normalizeWholeNumber(structure.batch_size || 0, { min: 1, fallback: 1 }),
    batch_unit: structure.batch_unit || "un",
    status: structure.status || "draft",
    total_cost: normalizedItems.reduce((sum, item) => sum + Number(item.total_cost || 0), 0),
    instructions: structure.instructions || null,
    height: normalizeWholeNumber(structure.height || 0, { min: 0, fallback: 0 }),
    width: normalizeWholeNumber(structure.width || 0, { min: 0, fallback: 0 }),
    length: normalizeWholeNumber(structure.length || 0, { min: 0, fallback: 0 }),
    weight: normalizeWholeNumber(structure.weight || 0, { min: 0, fallback: 0 }),
    notes: structure.notes || null,
    attachments: Array.isArray(structure.attachments) ? structure.attachments : [],
    structure_items: normalizedItems,
  };
}

function getBomStructureComparableSnapshot(structure) {
  return JSON.stringify({
    code: structure.code || "",
    product_code: structure.product_code || "",
    product_name: structure.product_name || "",
    category: structure.category || "",
    sale_option_id: structure.sale_option_id || "",
    sale_option_code: structure.sale_option_code || "",
    sale_option_label: structure.sale_option_label || "",
    name: structure.name || "",
    batch_size: normalizeWholeNumber(structure.batch_size || 0, { min: 1, fallback: 1 }),
    batch_unit: structure.batch_unit || "un",
    total_cost: Number(structure.total_cost || 0),
    height: normalizeWholeNumber(structure.height || 0, { min: 0, fallback: 0 }),
    width: normalizeWholeNumber(structure.width || 0, { min: 0, fallback: 0 }),
    length: normalizeWholeNumber(structure.length || 0, { min: 0, fallback: 0 }),
    weight: normalizeWholeNumber(structure.weight || 0, { min: 0, fallback: 0 }),
    structure_items: (Array.isArray(structure.structure_items) ? structure.structure_items : []).map((item) => ({
      source_key: item.source_key || "",
      source_type: item.source_type || "",
      component_id: item.component_id || "",
      code: item.code || "",
      name: item.name || "",
      unit: item.unit || "",
      sale_option_id: item.sale_option_id || "",
      sale_option_code: item.sale_option_code || "",
      sale_option_label: item.sale_option_label || "",
      production_quantity: normalizeWholeNumber(item.production_quantity || 0, { min: 0, fallback: 0 }),
      kit_structure_id: item.kit_structure_id || "",
      production_section_id: item.production_section_id || "",
      production_section_label: item.production_section_label || "",
      quantity: normalizeWholeNumber(item.quantity || 0, { min: 1, fallback: 1 }),
      unit_cost: Number(item.unit_cost || 0),
      total_cost: Number(item.total_cost || 0),
    })),
  });
}

async function syncBomStructuresForProductChange(productId) {
  if (!productId) return { updatedCount: 0 };

  const products = state.moduleData.products || [];
  const materials = state.moduleData.bomMaterials || [];
  const originalStructures = Array.isArray(state.moduleData.bomStructures) ? state.moduleData.bomStructures : [];
  if (!originalStructures.length) {
    return { updatedCount: 0 };
  }

  let workingStructures = originalStructures.map((structure) => ({
    ...structure,
    structure_items: Array.isArray(structure.structure_items) ? structure.structure_items.map((item) => ({ ...item })) : [],
    attachments: Array.isArray(structure.attachments) ? structure.attachments.map((item) => ({ ...item })) : [],
  }));

  for (let pass = 0; pass < workingStructures.length + 2; pass += 1) {
    let changedInPass = false;
    workingStructures = workingStructures.map((structure) => {
      const nextPayload = buildBomStructurePayloadFromRecord(structure, {
        products,
        materials,
        structures: workingStructures,
      });
      const nextStructure = { ...structure, ...nextPayload };
      if (getBomStructureComparableSnapshot(nextStructure) !== getBomStructureComparableSnapshot(structure)) {
        changedInPass = true;
      }
      return nextStructure;
    });
    if (!changedInPass) break;
  }

  const changedStructures = workingStructures.filter((structure) => {
    const original = originalStructures.find((item) => item.id === structure.id);
    return original && getBomStructureComparableSnapshot(structure) !== getBomStructureComparableSnapshot(original);
  });

  if (!changedStructures.length) {
    return { updatedCount: 0 };
  }

  for (const structure of changedStructures) {
    const payload = buildBomStructurePayloadFromRecord(structure, {
      products,
      materials,
      structures: workingStructures,
    });
    const { error } = await state.supabase.from("bom_structures").update(payload).eq("id", structure.id);
    if (error) throw error;
  }

  state.moduleData.bomStructures = workingStructures;
  return { updatedCount: changedStructures.length };
}

function renderBomStructureItemsSummary(structure) {
  const items = Array.isArray(structure.structure_items) ? structure.structure_items : [];
  if (!items.length) {
    return `<span class="muted">Sem itens</span>`;
  }

  return items
    .map((item) => `${escapeHtml(item.name || "-")} x ${formatWholeQuantity(item.quantity)}`)
    .join("<br />");
}

function findBomStructureForSalesItem(item) {
  const structures = state.moduleData.bomStructures || [];
  if (item?.kit_structure_id) {
    const linkedStructure = structures.find((structure) => structure.id === item.kit_structure_id);
    if (linkedStructure) return linkedStructure;
  }

  const product = (state.moduleData.products || []).find((productItem) =>
    productItem.id === item?.product_id
    || productItem.code === item?.product_code
    || productItem.name === item?.product_name
  );
  if (!product) return null;

  const saleOptionId = String(item?.sale_option_id || "").trim();
  const saleOptionLabel = String(item?.sale_option_label || "").trim();
  const activeStructures = structures.filter((structure) =>
    structure.status === "active"
    && (
      structure.product_id === product.id
      || (structure.product_code && structure.product_code === product.code)
      || (structure.product_name && structure.product_name === product.name)
    )
  );

  if (saleOptionId || saleOptionLabel) {
    const variationStructure = activeStructures.find((structure) =>
      (saleOptionId && structure.sale_option_id === saleOptionId)
      || (saleOptionLabel && structure.sale_option_label === saleOptionLabel)
    );
    if (variationStructure) return variationStructure;
  }

  return activeStructures.find((structure) => !structure.sale_option_id && !structure.sale_option_label) || activeStructures[0] || null;
}

function getBomStructureUnitValue(structure) {
  const totalCost = Number(structure?.total_cost || 0);
  const batchSize = Number(structure?.batch_size || 1);
  if (!totalCost || totalCost <= 0) return 0;
  return batchSize > 0 ? totalCost / batchSize : totalCost;
}

function getBomStructureComponentsText(structure) {
  const items = Array.isArray(structure?.structure_items) ? structure.structure_items : [];
  return normalizeBomComponentItems(items)
    .map((item) => `${formatWholeQuantity(item.quantity || 0)}${item.unit ? ` ${item.unit}` : ""} - ${item.name || "-"}`)
    .join("\n");
}

function normalizeBomComponentItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      name: item.name || item.component_name || item.product_name || "-",
      unit: item.unit || item.component_unit || "",
      quantity: normalizeWholeNumber(item.quantity || item.qty || 0, { min: 0, fallback: 0 }),
    }))
    .filter((item) => item.name && item.quantity > 0);
}

function getSalesItemBomComponents(item) {
  const structure = findBomStructureForSalesItem(item);
  const structureItems = normalizeBomComponentItems(structure?.structure_items);
  if (structureItems.length) return structureItems;
  return normalizeBomComponentItems(item?.bom_components || item?.kit_components || item?.structure_items);
}

function renderBomComponentsList(items) {
  if (!items.length) return "";

  return `
    <div class="bom-components-list">
      <strong>Composição do conjunto:</strong>
      ${items.map((item) => `
        <div class="bom-components-line">
          <strong>${escapeHtml(formatWholeQuantity(item.quantity || 0))}${item.unit ? ` ${escapeHtml(item.unit)}` : ""}</strong>
          <span>${escapeHtml(item.name || "-")}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderBomStructureComponentsList(structure) {
  return renderBomComponentsList(normalizeBomComponentItems(structure?.structure_items));
}

function getSalesItemBomDescription(item) {
  const components = getSalesItemBomComponents(item)
    .map((component) => `${formatWholeQuantity(component.quantity || 0)}${component.unit ? ` ${component.unit}` : ""} - ${component.name || "-"}`)
    .join("\n");
  return components ? `Composição do conjunto:\n${components}` : "";
}

function renderSalesItemBomDescription(item) {
  return renderBomComponentsList(getSalesItemBomComponents(item));
}

function getInventoryMovementBomDescription(item) {
  return getSalesItemBomDescription({
    product_id: item?.product_id,
    product_code: item?.product_code,
    product_name: item?.product_name,
    sale_option_id: item?.sale_option_id,
    sale_option_label: item?.sale_option_label,
  });
}

function renderInventoryMovementBomDescription(item) {
  return renderSalesItemBomDescription({
    product_id: item?.product_id,
    product_code: item?.product_code,
    product_name: item?.product_name,
    sale_option_id: item?.sale_option_id,
    sale_option_label: item?.sale_option_label,
  });
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function getFileExtensionLabel(name) {
  const extension = String(name || "").split(".").pop()?.toUpperCase() || "FILE";
  return extension.slice(0, 6);
}

function resetBomStructureDraft() {
  state.bomStructureDraft = createEmptyBomStructureDraft();
  state.bomDraftItems = [createEmptyBomDraftItem()];
  state.bomAttachmentDrafts = [];
}

function normalizeBomAttachmentsForSave() {
  return state.bomAttachmentDrafts.map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size,
  }));
}

function hydrateBomDraftFromStructure(structure) {
  state.bomStructureDraft = {
    edit_id: structure.id,
    code: structure.code || "",
    product_id: structure.product_id || "",
    product_code: structure.product_code || "",
    product_name: structure.product_name || "",
    sale_option_id: structure.sale_option_id || "",
    sale_option_code: structure.sale_option_code || "",
    sale_option_label: structure.sale_option_label || "",
    name: structure.name || "",
    version: structure.version || "1.0",
    batch_size: String(structure.batch_size ?? "1"),
    batch_unit: structure.batch_unit || "un",
    status: structure.status || "draft",
    instructions: structure.instructions || "",
    height: String(structure.height ?? ""),
    width: String(structure.width ?? ""),
    length: String(structure.length ?? ""),
    weight: String(structure.weight ?? ""),
    notes: structure.notes || "",
  };

  state.bomDraftItems = (Array.isArray(structure.structure_items) ? structure.structure_items : []).map((item) => {
    const sourceKey = item.source_key || `${item.source_type}:${item.component_id}`;
    const [type, productId, ...detailParts] = String(sourceKey || "").split(":");
    let legacySaleOptionId = "";
    if (type === "product_option") {
      try {
        legacySaleOptionId = decodeURIComponent(detailParts.join(":"));
      } catch {
        legacySaleOptionId = detailParts.join(":");
      }
    }
    return {
      sourceKey: type === "product_option" ? `product:${productId}` : sourceKey,
      saleOptionId: item.sale_option_id || legacySaleOptionId || "",
      productionSectionId: item.production_section_id || "",
      unitCost: item.unit_cost ?? "",
      quantity: String(item.quantity ?? "1"),
    };
  });
  if (!state.bomDraftItems.length) {
    state.bomDraftItems = [createEmptyBomDraftItem()];
  }

  state.bomAttachmentDrafts = (Array.isArray(structure.attachments) ? structure.attachments : []).map((file) => ({
    name: file.name,
    type: file.type || "",
    size: file.size || 0,
    previewUrl: "",
    persisted: true,
  }));
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlWithLineBreaks(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function loadMachiningData() {
  const pieces = readMachiningStorage();
  state.moduleData.machiningPieces = pieces;
  syncMachiningDerivedData();
}

function readMachiningStorage() {
  try {
    const raw = localStorage.getItem(MACHINING_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeMachiningPieceRecord) : [];
  } catch {
    return [];
  }
}

function persistMachiningPieces(pieces) {
  const normalizedPieces = (pieces || []).map(normalizeMachiningPieceRecord);
  localStorage.setItem(MACHINING_STORAGE_KEY, JSON.stringify(normalizedPieces));
  state.moduleData.machiningPieces = normalizedPieces;
  syncMachiningDerivedData();
}

function syncMachiningDerivedData() {
  const remoteProduction = (state.moduleData.production || []).filter((item) => !String(item.id || "").startsWith("mach-order-"));
  const remoteInventory = (state.moduleData.inventory || []).filter((item) => !String(item.id || "").startsWith("mach-stock-"));
  const machiningStockEntries = [];

  (state.moduleData.machiningPieces || []).forEach((piece) => {
    (piece.stock_entries || []).forEach((entry) => {
      machiningStockEntries.push({
        id: entry.id,
        product_name: entry.product_name || piece.finished_name || piece.name,
        product_code: piece.code,
        movement_type: "entry",
        quantity: entry.quantity,
        notes: entry.notes,
        machine_serial: "-",
        batch: entry.lot,
        moved_by_name: entry.operator || getLoggedUserName(""),
        created_at: entry.created_at,
      });
    });
  });

  state.moduleData.production = remoteProduction;
  state.moduleData.inventory = [...machiningStockEntries, ...remoteInventory];
}

function normalizeMachiningPieceRecord(piece) {
  const processes = resequenceMachiningProcesses(piece.processes || []);
  const productions = (piece.productions || []).map((order) => normalizeMachiningOrderRecord(order, processes));
  const stockEntries = (piece.stock_entries || []).map((entry) => ({
    id: entry.id || `mach-stock-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    quantity: Number(entry.quantity || 0),
    lot: String(entry.lot || ""),
    created_at: entry.created_at || new Date().toISOString(),
    origin: entry.origin || "usinagem/produção",
    notes: entry.notes || "Entrada automática via usinagem",
    operator: entry.operator || "",
    product_name: String(entry.product_name || piece.finished_name || piece.name || "").trim(),
    product_id: String(entry.product_id || piece.finished_product_id || "").trim(),
  }));
  const latestOrder = productions[0] || null;

  return {
    id: piece.id || `mach-piece-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    code: String(piece.code || "").trim(),
    name: String(piece.name || "").trim(),
    finished_product_id: String(piece.finished_product_id || "").trim(),
    finished_name: String(piece.finished_name || piece.name || "").trim(),
    material: String(piece.material || "").trim(),
    description: String(piece.description || "").trim(),
    processes,
    total_minutes: calculateMachiningTotalMinutes(processes),
    status: deriveMachiningPieceStatus(latestOrder, stockEntries),
    productions,
    stock_entries: stockEntries,
    created_at: piece.created_at || new Date().toISOString(),
    updated_at: piece.updated_at || piece.created_at || new Date().toISOString(),
  };
}

function normalizeMachiningOrderRecord(order, fallbackProcesses = []) {
  const baseProcesses = fallbackProcesses.length ? fallbackProcesses : order.steps || [];
  const steps = (order.steps || baseProcesses).map((step, index) => ({
    id: step.id || `mach-step-${index + 1}`,
    name: String(step.name || baseProcesses[index]?.name || `Etapa ${index + 1}`),
    machine: String(step.machine || baseProcesses[index]?.machine || ""),
    operator: String(step.operator || baseProcesses[index]?.operator || ""),
    estimated_minutes: Number(step.estimated_minutes ?? baseProcesses[index]?.estimated_minutes ?? 0),
    notes: String(step.notes || baseProcesses[index]?.notes || ""),
    sequence: index + 1,
    status: step.status || (index === 0 ? "Pendente" : "Bloqueada"),
    started_at: step.started_at || null,
    completed_at: step.completed_at || null,
    completed_by: step.completed_by || "",
  }));

  const normalized = {
    id: order.id || `mach-order-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    order_number: order.order_number || `OP-USI-${formatShortId(Date.now())}`,
    quantity_planned: Number(order.quantity_planned || 0),
    lot: String(order.lot || ""),
    operator: String(order.operator || ""),
    finished_name: String(order.finished_name || "").trim(),
    status: order.status || "Em Produção",
    current_step_index: Number.isFinite(Number(order.current_step_index)) ? Number(order.current_step_index) : 0,
    steps,
    created_at: order.created_at || new Date().toISOString(),
    completed_at: order.completed_at || null,
  };

  normalized.status = normalized.status === "Concluída" || normalized.steps.every((step) => step.status === "Finalizada")
    ? "Concluída"
    : "Em Produção";
  normalized.current_step_index = getCurrentMachiningStepIndex(normalized);
  return normalized;
}

function deriveMachiningPieceStatus(latestOrder, stockEntries) {
  if (latestOrder && latestOrder.status !== "Concluída") return "Em Produção";
  if (stockEntries.length || (latestOrder && latestOrder.status === "Concluída")) return "Finalizada";
  return "Cadastro";
}

function resequenceMachiningProcesses(processes) {
  return (processes || []).map((process, index) => ({
    id: process.id || `proc-${Date.now()}-${index}`,
    name: String(process.name || "").trim(),
    machine: String(process.machine || "").trim(),
    operator: String(process.operator || "").trim(),
    estimated_minutes: String(process.estimated_minutes ?? "").trim(),
    notes: String(process.notes || "").trim(),
    sequence: index + 1,
  }));
}

function calculateMachiningTotalMinutes(processes) {
  return (processes || []).reduce((sum, process) => sum + Number(process.estimated_minutes || 0), 0);
}

function getMachiningDraftTotalMinutes() {
  return calculateMachiningTotalMinutes(state.machiningDraft.processes || []);
}

function formatMinutesLabel(value) {
  return `${Number(value || 0)} min total`;
}

function formatProcessMinutes(value) {
  return `${Number(value || 0)} min`;
}

function getProductionMachiningOrders() {
  return (state.moduleData.machiningPieces || [])
    .flatMap((piece) => (piece.productions || []).map((order) => ({ piece, order })))
    .sort((left, right) => new Date(right.order.created_at || 0).getTime() - new Date(left.order.created_at || 0).getTime());
}

function findMachiningPiece(pieceId) {
  return (state.moduleData.machiningPieces || []).find((piece) => piece.id === pieceId);
}

function hydrateMachiningDraft(piece) {
  return {
    edit_id: piece.id,
    code: piece.code || "",
    name: piece.name || "",
    finished_product_id: piece.finished_product_id || "",
    finished_name: piece.finished_name || piece.name || "",
    material: piece.material || "",
    description: piece.description || "",
    processes: resequenceMachiningProcesses(piece.processes || []),
  };
}

function syncMachiningDraftFromForm(form) {
  if (!form) return;

  state.machiningDraft = {
    edit_id: form.elements.namedItem("edit_id")?.value || "",
    code: form.elements.namedItem("code")?.value || "",
    name: form.elements.namedItem("name")?.value || "",
    finished_product_id: form.elements.namedItem("finished_product_id")?.value || "",
    finished_name: form.elements.namedItem("finished_name")?.value || "",
    material: form.elements.namedItem("material")?.value || "",
    description: form.elements.namedItem("description")?.value || "",
    processes: resequenceMachiningProcesses(state.machiningDraft.processes || []),
  };
}

function handleMachiningProcessFieldChange(event) {
  const index = Number(event.currentTarget.dataset.machiningProcessIndex);
  const field = event.currentTarget.dataset.machiningProcessField;
  const process = state.machiningDraft.processes[index];
  if (!process) return;
  process[field] = event.currentTarget.value;
}

function resetMachiningFormState() {
  state.openAccordionKey = null;
  state.machiningDraft = createEmptyMachiningDraft();
}

async function handleMachiningSubmit(event) {
  event.preventDefault();
  syncMachiningDraftFromForm(event.currentTarget);

  const code = state.machiningDraft.code.trim();
  const name = state.machiningDraft.name.trim();
  const finishedProduct = (state.moduleData.products || []).find((product) => product.id === state.machiningDraft.finished_product_id);
  const finishedName = (finishedProduct?.name || state.machiningDraft.finished_name || name).trim();
  const material = state.machiningDraft.material.trim();
  const description = state.machiningDraft.description.trim();
  const processes = resequenceMachiningProcesses(state.machiningDraft.processes);
  const editId = state.machiningDraft.edit_id || "";

  if (!code) {
    showToast("O código da peça e obrigatório.", "warning");
    return;
  }

  if (!name) {
    showToast("O nome da peça e obrigatório.", "warning");
    return;
  }

  if (!processes.length) {
    showToast("Adicione ao menos um processo de fabricação.", "warning");
    return;
  }

  if (processes.some((process) => !process.name)) {
    showToast("O nome do processo e obrigatório em todas as etapas.", "warning");
    return;
  }

  if (processes.some((process) => process.estimated_minutes && Number.isNaN(Number(process.estimated_minutes)))) {
    showToast("O tempo estimado de cada processo deve ser numerico.", "warning");
    return;
  }

  const currentPieces = [...(state.moduleData.machiningPieces || [])];
  const nextPiece = normalizeMachiningPieceRecord({
    id: editId || `mach-piece-${Date.now()}`,
    code,
    name,
    finished_product_id: finishedProduct?.id || state.machiningDraft.finished_product_id || "",
    finished_name: finishedName,
    material,
    description,
    processes,
    productions: editId ? findMachiningPiece(editId)?.productions || [] : [],
    stock_entries: editId ? findMachiningPiece(editId)?.stock_entries || [] : [],
    created_at: editId ? findMachiningPiece(editId)?.created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const existingIndex = currentPieces.findIndex((piece) => piece.id === nextPiece.id);

  if (existingIndex >= 0) currentPieces.splice(existingIndex, 1, nextPiece);
  else currentPieces.unshift(nextPiece);

  persistMachiningPieces(currentPieces);
  resetMachiningFormState();
  renderActiveModule();
  void queueSystemLog({
    moduleKey: "production",
    action: editId ? "edicao" : "criacao",
    level: "Informativo",
    itemAffected: nextPiece.name,
    description: `Cadastro de peça de usinagem ${editId ? "atualizado" : "criado"}.`,
    entityType: "machining_piece",
    entityId: nextPiece.id,
    payload: nextPiece,
  });
  showToast("Peça cadastrada com sucesso.", "success");
}

function syncMachiningStartDraftFromForm(form) {
  if (!form) return;
  state.machiningStartDraft = {
    piece_id: form.elements.namedItem("piece_id")?.value || "",
    quantity: form.elements.namedItem("quantity")?.value || "",
    lot: form.elements.namedItem("lot")?.value || "",
    operator: form.elements.namedItem("operator")?.value || "",
    finished_name: form.elements.namedItem("finished_name")?.value || "",
  };
}

async function handleMachiningStartProductionSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  syncMachiningStartDraftFromForm(form);

  const pieceId = state.machiningStartDraft.piece_id;
  const quantity = normalizeWholeNumber(state.machiningStartDraft.quantity || 0, { min: 1, fallback: 0 });
  const lot = state.machiningStartDraft.lot.trim();
  const operator = state.machiningStartDraft.operator.trim() || getLoggedUserName("");
  const piece = findMachiningPiece(pieceId);
  if (!piece) return;
  const finishedName = state.machiningStartDraft.finished_name.trim() || piece.finished_name || piece.name || "";

  if (!quantity || quantity <= 0) {
    showToast("Preencha a quantidade.", "warning");
    return;
  }

  if (!lot) {
    showToast("Preencha o lote.", "warning");
    return;
  }

  const steps = piece.processes.map((process, index) => ({
    id: `mach-step-${Date.now()}-${index + 1}`,
    name: process.name,
    machine: process.machine,
    operator: process.operator,
    estimated_minutes: Number(process.estimated_minutes || 0),
    notes: process.notes,
    sequence: index + 1,
    status: index === 0 ? "Pendente" : "Bloqueada",
    started_at: null,
    completed_at: null,
    completed_by: "",
  }));

  const nextOrder = normalizeMachiningOrderRecord({
    id: `mach-order-${Date.now()}`,
    order_number: `OP-USI-${String(Date.now()).slice(-8)}`,
    quantity_planned: quantity,
    lot,
    operator,
    finished_name: finishedName,
    status: "Em Produção",
    current_step_index: 0,
    steps,
    created_at: new Date().toISOString(),
  }, piece.processes);

  const nextPieces = (state.moduleData.machiningPieces || []).map((item) => {
    if (item.id !== piece.id) return item;
    return normalizeMachiningPieceRecord({
      ...item,
      productions: [nextOrder, ...(item.productions || [])],
      updated_at: new Date().toISOString(),
    });
  });

  persistMachiningPieces(nextPieces);
  state.openAccordionKey = `machining-detail-${piece.id}`;
  state.machiningStartDraft = createEmptyMachiningStartDraft();
  renderActiveModule();
  void queueSystemLog({
    moduleKey: "production",
    action: "vinculo_producao",
    level: "Informativo",
    itemAffected: piece.name,
    description: `Usinagem enviada para produção com lote ${lot}.`,
    entityType: "machining_order",
    entityId: nextOrder.id,
    payload: { piece_id: piece.id, quantity, lot, operator },
  });
  showToast("Usinagem iniciada com sucesso.", "success");
}

function getLatestMachiningOrder(piece) {
  return (piece.productions || [])[0] || null;
}

function getCurrentMachiningStepIndex(order) {
  const liveIndex = (order.steps || []).findIndex((step) => ["Pendente", "Em Produção", "Qualidade"].includes(step.status));
  if (liveIndex >= 0) return liveIndex;
  const firstBlocked = (order.steps || []).findIndex((step) => step.status !== "Finalizada");
  return firstBlocked >= 0 ? firstBlocked : Math.max((order.steps || []).length - 1, 0);
}

function getVisibleMachiningSteps(order) {
  const steps = order.steps || [];
  if (order.status === "Concluída") {
    return steps.map((step, index) => ({ step, index }));
  }

  return steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => step.status !== "Bloqueada");
}

function getMachiningCurrentStageLabel(order) {
  const currentIndex = getCurrentMachiningStepIndex(order);
  const currentStep = order.steps?.[currentIndex];
  if (!currentStep) return order.status === "Concluída" ? "Concluída" : "Aguardando";
  return `Etapa ${currentIndex + 1} • ${currentStep.name}`;
}

function renderMachiningStatusBadge(status) {
  const config = {
    Cadastro: "status-machining-draft",
    "Em Produção": "status-machining-live",
    Finalizada: "status-machining-finished",
  };
  return `<span class="status-chip ${config[status] || "status-planned"}">${escapeHtml(status)}</span>`;
}

function renderMachiningStepStatusBadge(status) {
  const classMap = {
    Pendente: "status-planned",
    "Em Produção": "status-in_progress",
    Qualidade: "status-machining-quality",
    Finalizada: "status-completed",
    Bloqueada: "status-cancelled",
  };
  const label = status === "Bloqueada" ? "Pendente" : status.replace("Em Produção", "Em Produção");
  return `<span class="status-chip ${classMap[status] || "status-planned"}">${escapeHtml(label)}</span>`;
}

function renderProductionStageStatusBadge(status) {
  return renderMachiningStepStatusBadge(status);
}

function getProductionStepActionLabel(status) {
  if (status === "Pendente") return "Iniciar";
  if (status === "Em Produção") return "Enviar p/ Qualidade";
  if (status === "Qualidade") return "Finalizar";
  if (status === "Finalizada") return "Concluída";
  return "Aguardando";
}

function isProductionStepAdvanceDisabled(order, step) {
  const currentIndex = getCurrentMachiningStepIndex(order);
  const stepIndex = Number(step.sequence || 1) - 1;
  return step.status === "Bloqueada" || step.status === "Finalizada" || order.status === "Concluída" || stepIndex !== currentIndex;
}

function canStepAction(order, step) {
  return {
    disableStart: step.status === "Finalizada" || order.status === "Concluída",
    disableComplete: step.status === "Finalizada" || order.status === "Concluída",
    isCurrentStep: Number(step.sequence || 1) - 1 === getCurrentMachiningStepIndex(order),
  };
}

function handleMachiningStepStart(rawValue) {
  handleMachiningStepAdvance(rawValue);
}

function handleMachiningStepComplete(rawValue) {
  handleMachiningStepAdvance(rawValue, true);
}

function handleMachiningStepOperatorChange(rawValue, operatorName) {
  const [pieceId, orderId, stepIndexValue] = String(rawValue || "").split("|");
  const stepIndex = Number(stepIndexValue);
  updateMachiningOrder(pieceId, orderId, (order) => {
    const step = order.steps?.[stepIndex];
    if (!step) return false;
    step.operator = String(operatorName || "").trim();
    return true;
  });
}

function handleMachiningStepAdvance(rawValue, forceComplete = false) {
  const [pieceId, orderId, stepIndexValue] = String(rawValue || "").split("|");
  const stepIndex = Number(stepIndexValue);
  let auditSnapshot = null;
  updateMachiningOrder(pieceId, orderId, (order, piece) => {
    const currentIndex = getCurrentMachiningStepIndex(order);
    const step = order.steps?.[stepIndex];
    if (!step) return false;
    if (stepIndex !== currentIndex || step.status === "Bloqueada") {
      showToast("Não é possível iniciar a próxima etapa antes de finalizar a anterior.", "warning");
      return false;
    }

    if (step.status === "Pendente" && !forceComplete) {
      step.status = "Em Produção";
      step.started_at = step.started_at || new Date().toISOString();
      step.operator = getLoggedUserName(order.operator || "");
      order.status = "Em Produção";
      auditSnapshot = {
        level: "Informativo",
        description: `Etapa ${step.sequence} iniciada na usinagem.`,
        stepName: step.name,
        orderNumber: order.order_number,
        pieceName: piece.name,
      };
      return true;
    }

    if (step.status === "Em Produção" && !forceComplete) {
      step.status = "Qualidade";
      order.status = "Em Produção";
      auditSnapshot = {
        level: "Atenção",
        description: `Etapa ${step.sequence} enviada para qualidade.`,
        stepName: step.name,
        orderNumber: order.order_number,
        pieceName: piece.name,
      };
      return true;
    }

    if (!["Qualidade", "Em Produção", "Pendente"].includes(step.status)) {
      return false;
    }

    step.status = "Finalizada";
    step.started_at = step.started_at || new Date().toISOString();
    step.completed_at = new Date().toISOString();
    step.operator = step.operator || getLoggedUserName(order.operator || "");
    step.completed_by = getLoggedUserName(step.operator || order.operator || "");

    const nextStep = order.steps[stepIndex + 1];
    if (nextStep) {
      nextStep.status = "Pendente";
      order.current_step_index = stepIndex + 1;
      order.status = "Em Produção";
      auditSnapshot = {
        level: "Informativo",
        description: `Etapa ${step.sequence} finalizada e próxima etapa liberada.`,
        stepName: step.name,
        orderNumber: order.order_number,
        pieceName: piece.name,
      };
      showToast("Etapa finalizada com sucesso.", "success");
      showToast("Proxima etapa liberada.", "success");
    } else {
      order.status = "Concluída";
      order.completed_at = new Date().toISOString();
      order.current_step_index = stepIndex;
      piece.stock_entries = [
        {
          id: `mach-stock-${Date.now()}`,
          product_id: piece.finished_product_id || "",
          quantity: order.quantity_planned,
          lot: order.lot,
          created_at: new Date().toISOString(),
          origin: "usinagem/produção",
          notes: `Entrada automática após concluir todas as etapas${order.finished_name ? ` • ${order.finished_name}` : ""}`,
          operator: step.completed_by || getLoggedUserName(order.operator || ""),
          product_name: order.finished_name || piece.finished_name || piece.name,
        },
        ...(piece.stock_entries || []),
      ];
      auditSnapshot = {
        level: "Informativo",
        description: "Usinagem concluída e peça enviada ao estoque.",
        stepName: step.name,
        orderNumber: order.order_number,
        pieceName: piece.name,
      };
      showToast("Etapa finalizada com sucesso.", "success");
      showToast("Produção concluída.", "success");
      showToast("Peça enviada para estoque.", "success");
      void persistMachiningFinishedProductStockEntry(piece, order, step);
    }
    return true;
  });
}

function updateMachiningOrder(pieceId, orderId, updater) {
  let changed = false;
  const nextPieces = (state.moduleData.machiningPieces || []).map((piece) => {
    if (piece.id !== pieceId) return piece;

    const nextProductions = (piece.productions || []).map((order) => {
      if (order.id !== orderId) return order;
      const clonedOrder = normalizeMachiningOrderRecord({
        ...order,
        steps: order.steps.map((step) => ({ ...step })),
      }, piece.processes);
      const mutablePiece = {
        ...piece,
        stock_entries: [...(piece.stock_entries || [])],
      };
      const result = updater(clonedOrder, mutablePiece);
      if (!result) return order;
      changed = true;
      piece = mutablePiece;
      return normalizeMachiningOrderRecord(clonedOrder, piece.processes);
    });

    return changed
      ? normalizeMachiningPieceRecord({
        ...piece,
        productions: nextProductions,
        stock_entries: piece.stock_entries,
        updated_at: new Date().toISOString(),
      })
      : piece;
  });

  if (!changed) return;
  persistMachiningPieces(nextPieces);
  if (auditSnapshot) {
    void queueSystemLog({
      moduleKey: "production",
      action: "mudanca_status",
      level: auditSnapshot.level,
      itemAffected: auditSnapshot.pieceName,
      description: `${auditSnapshot.description} Ordem ${auditSnapshot.orderNumber} • Etapa ${auditSnapshot.stepName}.`,
      entityType: "machining_order",
      entityId: orderId,
      payload: { piece_id: pieceId, step_index: stepIndex, force_complete: forceComplete },
    });
  }
  renderActiveModule();
}

async function persistMachiningFinishedProductStockEntry(piece, order, step) {
  if (!state.supabase || !piece?.finished_product_id) {
    return;
  }

  const product = (state.moduleData.products || []).find((item) => item.id === piece.finished_product_id);
  if (!product) {
    showToast("Produto acabado vinculado não encontrado no estoque.", "warning");
    return;
  }

  const quantity = Number(order.quantity_planned || 0);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return;
  }

  try {
    await persistProductMovement({
      product,
      movementPayload: {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        movement_type: "entry",
        quantity,
        batch: order.lot || product.batch || null,
        machine_serial: product.machine_serial || null,
        notes: `Entrada automática pela usinagem ${order.order_number}`,
        moved_by_user_id: state.currentUser?.user_id || null,
        moved_by_name: step.completed_by || getLoggedUserName(null),
      },
      nextStock: Number(product.current_stock || 0) + quantity,
    });
    await Promise.all([loadProductsTable(), loadInventoryMovementsTable()]);
  } catch (error) {
    showToast(`Usinagem concluída, mas a entrada no estoque real falhou: ${formatError(error)}`, "danger");
  }
}

function getUserInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
}

function getLoggedUserName(fallback = "") {
  return String(state.currentUser?.full_name || "").trim() || fallback;
}

function hasPermission(moduleKey, type) {
  if (!state.currentUser) return false;
  if (moduleKey === "dashboard") return true;
  if (moduleKey === "permissions") return isPermissionsAdmin();
  if (moduleKey === "vps") return isTiUser();

  const permission = state.permissions.find((item) => item.module_key === moduleKey);
  if (!permission) return moduleKey === "dashboard";
  return type === "edit" ? permission.can_edit : permission.can_view;
}

function bindGenericForm(formId, tableName, stateKey) {
  const form = document.querySelector(`#${formId}`);
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const editId = payload.edit_id;
    delete payload.edit_id;

    try {
      const query = editId
        ? state.supabase.from(tableName).update(payload).eq("id", editId)
        : state.supabase.from(tableName).insert(payload);
      const { error } = await query;
      if (error) throw error;
      form?.reset();
      await loadTable(tableName, stateKey);
      renderActiveModule();
      if (tableName === "purchase_requests") {
        showPurchaseNotification("Nova solicitação de compra registrada.");
      } else {
        showToast(editId ? "Registro atualizado com sucesso." : "Registro salvo com sucesso.", "success");
      }
    } catch (error) {
      showToast(formatError(error), "danger");
    }
  });

  const cancelButton = document.querySelector(`[data-cancel-form="${formId}"]`);
  if (cancelButton) {
    cancelButton.addEventListener("click", () => form?.reset());
  }
}

function bindMachiningModuleEvents() {
  const toggleButton = document.querySelector("[data-machining-toggle-form]");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      const shouldOpen = state.openAccordionKey !== "machining-form";
      state.openAccordionKey = shouldOpen ? "machining-form" : null;
      state.machiningDraft = createEmptyMachiningDraft();
      renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#machining-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  bindDeferredTextFilter("#machining-search-input", (value) => {
    state.machiningSearch = value;
  });

  bindDeferredSelectFilter("#machining-status-filter", (value) => {
    state.machiningStatusFilter = value;
  });

  const machiningForm = document.querySelector("#machining-form");
  if (machiningForm) {
    machiningForm.addEventListener("submit", handleMachiningSubmit);
    machiningForm.addEventListener("input", () => syncMachiningDraftFromForm(machiningForm));
    machiningForm.addEventListener("change", () => syncMachiningDraftFromForm(machiningForm));
  }

  const addProcessButton = document.querySelector("[data-machining-add-process]");
  if (addProcessButton) {
    addProcessButton.addEventListener("click", () => {
      syncMachiningDraftFromForm(document.querySelector("#machining-form"));
      if (state.machiningDraft.processes.length >= 8) {
        showToast("A peça pode ter no máximo 8 processos.", "warning");
        return;
      }
      state.machiningDraft.processes.push({
        ...createEmptyMachiningProcessDraft(),
        sequence: state.machiningDraft.processes.length + 1,
      });
      renderActiveModule();
      showToast("Processo adicionado com sucesso.", "success");
    });
  }

  document.querySelectorAll("[data-machining-remove-process]").forEach((button) => {
    button.addEventListener("click", () => {
      syncMachiningDraftFromForm(document.querySelector("#machining-form"));
      if (state.machiningDraft.processes.length === 1) {
        return;
      }
      state.machiningDraft.processes.splice(Number(button.dataset.machiningRemoveProcess), 1);
      state.machiningDraft.processes = resequenceMachiningProcesses(state.machiningDraft.processes);
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-machining-move-process]").forEach((button) => {
    button.addEventListener("click", () => {
      syncMachiningDraftFromForm(document.querySelector("#machining-form"));
      const index = Number(button.dataset.machiningMoveProcess);
      const direction = Number(button.dataset.direction);
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= state.machiningDraft.processes.length) return;
      const [movedItem] = state.machiningDraft.processes.splice(index, 1);
      state.machiningDraft.processes.splice(nextIndex, 0, movedItem);
      state.machiningDraft.processes = resequenceMachiningProcesses(state.machiningDraft.processes);
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-machining-process-field]").forEach((field) => {
    field.addEventListener("input", handleMachiningProcessFieldChange);
    field.addEventListener("change", handleMachiningProcessFieldChange);
  });

  const cancelButton = document.querySelector("[data-machining-cancel]");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      resetMachiningFormState();
      renderActiveModule();
    });
  }

  document.querySelectorAll("[data-machining-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const piece = findMachiningPiece(button.dataset.machiningEditId);
      if (!piece) return;
      state.machiningDraft = hydrateMachiningDraft(piece);
      state.openAccordionKey = "machining-form";
      renderActiveModule();
      document.querySelector("#machining-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-machining-delete-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const pieces = (state.moduleData.machiningPieces || []).filter((piece) => piece.id !== button.dataset.machiningDeleteId);
      persistMachiningPieces(pieces);
      renderActiveModule();
      showToast("Peça excluída com sucesso.", "success");
    });
  });

  document.querySelectorAll("[data-machining-toggle-details]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = `machining-detail-${button.dataset.machiningToggleDetails}`;
      state.openAccordionKey = state.openAccordionKey === key ? null : key;
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-machining-start-production]").forEach((button) => {
    button.addEventListener("click", () => {
      const pieceId = button.dataset.machiningStartProduction;
      const key = `machining-start-${pieceId}`;
      const shouldOpen = state.openAccordionKey !== key;
      state.openAccordionKey = shouldOpen ? key : null;
      state.machiningStartDraft = createEmptyMachiningStartDraft(pieceId);
      renderActiveModule();
      if (shouldOpen) {
        document.querySelector(`[data-machining-start-form="${pieceId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  document.querySelectorAll("[data-machining-close-inline]").forEach((button) => {
    button.addEventListener("click", () => {
      state.openAccordionKey = null;
      state.machiningStartDraft = createEmptyMachiningStartDraft();
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-machining-start-form]").forEach((form) => {
    form.addEventListener("submit", handleMachiningStartProductionSubmit);
    form.addEventListener("input", () => syncMachiningStartDraftFromForm(form));
    form.addEventListener("change", () => syncMachiningStartDraftFromForm(form));
  });

  document.querySelectorAll("[data-machining-step-start]").forEach((button) => {
    button.addEventListener("click", () => handleMachiningStepStart(button.dataset.machiningStepStart));
  });

  document.querySelectorAll("[data-machining-step-complete]").forEach((button) => {
    button.addEventListener("click", () => handleMachiningStepComplete(button.dataset.machiningStepComplete));
  });

  document.querySelectorAll("[data-machining-step-operator]").forEach((field) => {
    field.addEventListener("change", () => {
      handleMachiningStepOperatorChange(field.dataset.machiningStepOperator, field.value);
    });
  });
}

function bindProductionModuleEvents() {
  const toggleButton = document.querySelector("[data-production-toggle-form]");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      const shouldOpen = state.openAccordionKey !== "production-order-form";
      state.openAccordionKey = shouldOpen ? "production-order-form" : null;
      state.productionDraft = createEmptyProductionDraft();
      renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#production-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  bindDeferredTextFilter("#production-search-input", (value) => {
    state.productionSearch = value;
  });

  bindDeferredSelectFilter("#production-status-filter", (value) => {
    state.productionStatusFilter = value;
  });

  const productionForm = document.querySelector("#production-form");
  if (productionForm) {
    productionForm.addEventListener("submit", handleProductionSubmit);
    productionForm.addEventListener("input", () => syncProductionDraftFromForm(productionForm));
    productionForm.addEventListener("change", () => syncProductionDraftFromForm(productionForm));
  }

  const cancelButton = document.querySelector("[data-production-cancel]");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      resetProductionFormState();
      renderActiveModule();
    });
  }

  const productField = document.querySelector('#production-form select[name="product_id"]');
  if (productField) {
    productField.addEventListener("change", handleProductionProductSelection);
  }

  document.querySelectorAll("[data-production-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const order = state.moduleData.production.find((item) => item.id === button.dataset.productionEditId);
      if (!order) return;

      state.productionDraft = hydrateProductionDraft(order);
      state.openAccordionKey = "production-order-form";
      renderActiveModule();
      document.querySelector("#production-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-production-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!isPermissionsAdmin()) {
        showToast("Somente TI e ADMINISTRADOR podem excluir ordem de produção.", "warning");
        return;
      }
      try {
        const { error } = await state.supabase.from("production_orders").delete().eq("id", button.dataset.productionDeleteId);
        if (error) throw error;
        await loadTable("production_orders", "production");
        renderActiveModule();
        void queueSystemLog({
          moduleKey: "production",
          action: "exclusao",
          level: "Critico",
          itemAffected: button.dataset.productionDeleteId,
          description: "Ordem de produção excluída.",
          entityType: "production_order",
          entityId: button.dataset.productionDeleteId,
        });
        showToast("Ordem excluída com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-production-start-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      enterProductionFocusMode(button.dataset.productionStartId);
      await handleProductionStart(button.dataset.productionStartId);
    });
  });

  document.querySelector("[data-production-exit-focus]")?.addEventListener("click", () => {
    exitProductionFocusMode();
  });

  document.querySelectorAll("[data-production-print-id]").forEach((button) => {
    button.addEventListener("click", () => {
      handleProductionPrint(button.dataset.productionPrintId);
    });
  });

  document.querySelectorAll("[data-production-machining-advance]").forEach((button) => {
    button.addEventListener("click", () => {
      handleMachiningStepAdvance(button.dataset.productionMachiningAdvance);
    });
  });

  document.querySelectorAll("[data-machining-step-operator]").forEach((field) => {
    field.addEventListener("change", () => {
      handleMachiningStepOperatorChange(field.dataset.machiningStepOperator, field.value);
    });
  });
}

function bindCustomersModuleEvents() {
  const toggleButton = document.querySelector("[data-customer-toggle-form]");
  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      const shouldOpen = state.openAccordionKey !== "customer-form";
      state.openAccordionKey = shouldOpen ? "customer-form" : null;
      state.customerDraft = createEmptyCustomerDraft();
      renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#customers-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  bindDeferredTextFilter("#customer-search-input", (value) => {
    state.customerSearch = value;
  });

  const customerForm = document.querySelector("#customers-form");
  if (customerForm) {
    customerForm.addEventListener("submit", handleCustomerSubmit);
    customerForm.addEventListener("input", () => syncCustomerDraftFromForm(customerForm));
    customerForm.addEventListener("change", () => syncCustomerDraftFromForm(customerForm));
  }

  const cancelButton = document.querySelector("[data-customer-cancel]");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      resetCustomerFormState();
      renderActiveModule();
    });
  }

  const cnpjField = document.querySelector('#customers-form input[name="cnpj"]');
  if (cnpjField) {
    cnpjField.addEventListener("input", () => {
      cnpjField.value = formatCnpj(cnpjField.value);
      syncCustomerDraftFromForm(customerForm);
    });
  }

  const cpfField = document.querySelector('#customers-form input[name="cpf"]');
  if (cpfField) {
    cpfField.addEventListener("input", () => {
      cpfField.value = formatCpf(cpfField.value);
      syncCustomerDraftFromForm(customerForm);
    });
  }

  const phoneField = document.querySelector('#customers-form input[name="phone"]');
  if (phoneField) {
    phoneField.addEventListener("input", () => {
      phoneField.value = formatPhoneBr(phoneField.value);
      syncCustomerDraftFromForm(customerForm);
    });
  }

  const stateField = document.querySelector('#customers-form input[name="state"]');
  if (stateField) {
    stateField.addEventListener("input", () => {
      stateField.value = String(stateField.value || "").replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
      syncCustomerDraftFromForm(customerForm);
    });
  }

  document.querySelectorAll("[data-customer-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const customer = state.moduleData.customers.find((item) => item.id === button.dataset.customerEditId);
      if (!customer) return;

      state.customerDraft = hydrateCustomerDraft(customer);
      state.openAccordionKey = "customer-form";
      renderActiveModule();
      document.querySelector("#customers-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-customer-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const { error } = await state.supabase.from("customers").delete().eq("id", button.dataset.customerDeleteId);
        if (error) throw error;
        await loadTable("customers", "customers");
        renderActiveModule();
        showToast("Cliente excluido com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });
}

function bindSalesModuleEvents() {
  document.querySelector("[data-sales-open-config]")?.addEventListener("click", () => {
    state.salesConfigModalOpen = true;
    state.salesConfigTab = state.salesDocumentSettings.activeTab || state.salesConfigTab || "quote";
    renderActiveModule();
  });

  document.querySelectorAll("[data-sales-open-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.salesOpenMode || "quote";
      const shouldOpen = !(state.openAccordionKey === "sales-form" && state.salesDraft.status === mode && !state.salesDraft.edit_id);
      state.openAccordionKey = shouldOpen ? "sales-form" : null;
      state.salesDraft = shouldOpen ? createEmptySalesDraft(mode) : createEmptySalesDraft();
      renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#sales-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  bindDeferredTextFilter("#sales-search-input", (value) => {
    state.salesSearch = value;
  });

  bindDeferredSelectFilter("#sales-status-filter", (value) => {
    state.salesStatusFilter = value;
  });

  const salesForm = document.querySelector("#sales-form");
  if (salesForm) {
    salesForm.addEventListener("submit", handleSalesSubmit);
    salesForm.addEventListener("input", () => syncSalesDraftFromForm(salesForm));
    salesForm.addEventListener("change", () => syncSalesDraftFromForm(salesForm));
  }

  const cancelButton = document.querySelector("[data-sales-cancel]");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      resetSalesFormState();
      renderActiveModule();
    });
  }

  document.querySelector("[data-sales-draft-preview]")?.addEventListener("click", () => {
    const type = state.salesDraft.status === "finalized" ? "sale" : "quote";
    openSalesDocumentPreview(type, state.salesDraft.edit_id);
  });

  const customerField = document.querySelector('#sales-form select[name="customer_id"]');
  if (customerField) {
    customerField.addEventListener("change", handleSalesCustomerSelection);
  }

  const statusField = document.querySelector('#sales-form select[name="status"]');
  if (statusField) {
    statusField.addEventListener("change", () => {
      syncSalesDraftFromForm(salesForm);
      renderActiveModule();
    });
  }

  const addItemButton = document.querySelector("[data-sales-add-item]");
  if (addItemButton) {
    addItemButton.addEventListener("click", () => {
      state.salesDraft.items.push(createEmptySalesItemDraft());
      renderActiveModule();
    });
  }

  document.querySelectorAll("[data-sales-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.salesDraft.items.length === 1) {
        state.salesDraft.items = [createEmptySalesItemDraft()];
      } else {
        state.salesDraft.items.splice(Number(button.dataset.salesRemoveItem), 1);
      }
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-sales-item-field]").forEach((field) => {
    field.addEventListener("change", handleSalesItemFieldChange);
    field.addEventListener("input", handleSalesItemFieldChange);
  });

  document.querySelectorAll("[data-sales-edit-id], [data-sales-view-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const sale = state.moduleData.sales.find((item) => item.id === (button.dataset.salesEditId || button.dataset.salesViewId));
      if (!sale) return;

      state.salesDraft = hydrateSalesDraft(sale);
      state.openAccordionKey = "sales-form";
      renderActiveModule();
      document.querySelector("#sales-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-sales-contract-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const sale = state.moduleData.sales.find((item) => item.id === button.dataset.salesContractId);
      if (!sale) return;

      state.salesContractDraft = hydrateSalesContractDraft(sale);
      state.openAccordionKey = "sales-contract-form";
      renderActiveModule();
      document.querySelector("#sales-contract-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-sales-generate-document]").forEach((button) => {
    button.addEventListener("click", () => {
      openSalesDocumentPreview(button.dataset.salesGenerateDocument, button.dataset.salesDocumentId);
    });
  });

  document.querySelectorAll("[data-sales-send-document]").forEach((button) => {
    button.addEventListener("click", () => {
      openSalesDocumentPreview("quote", button.dataset.salesSendDocument);
    });
  });

  document.querySelectorAll("[data-sales-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const { error } = await state.supabase.from("sales").delete().eq("id", button.dataset.salesDeleteId);
        if (error) throw error;
        await loadTable("sales", "sales");
        renderActiveModule();
        showToast("Venda excluída com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-sales-finalize-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const sale = state.moduleData.sales.find((item) => item.id === button.dataset.salesFinalizeId);
      if (!sale) return;

      state.salesDraft = hydrateSalesDraft(sale);
      state.salesDraft.status = "finalized";
      state.salesDraft.sale_date = new Date().toISOString().slice(0, 10);
      state.salesDraft.delivery_days = "";
      state.salesDraft.delivery_date = "";
      state.openAccordionKey = "sales-form";
      renderActiveModule();
      document.querySelector("#sales-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      showToast("Informe o prazo de entrega para finalizar a venda.", "warning");
    });
  });

  document.querySelectorAll("[data-sales-send-production-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const sale = state.moduleData.sales.find((item) => item.id === button.dataset.salesSendProductionId);
      if (!sale) return;
      await sendSaleToProduction(sale);
    });
  });

  const salesContractForm = document.querySelector("#sales-contract-form");
  if (salesContractForm) {
    salesContractForm.addEventListener("submit", handleSalesContractSubmit);
    salesContractForm.addEventListener("input", () => syncSalesContractDraftFromForm(salesContractForm));
    salesContractForm.addEventListener("change", () => syncSalesContractDraftFromForm(salesContractForm));
  }

  const contractCancelButton = document.querySelector("[data-sales-contract-cancel]");
  if (contractCancelButton) {
    contractCancelButton.addEventListener("click", () => {
      resetSalesContractFormState();
      renderActiveModule();
    });
  }

  document.querySelector("[data-sales-contract-preview]")?.addEventListener("click", () => {
    if (!state.salesContractDraft.sale_id) {
      showToast("Salve ou selecione uma venda para visualizar o contrato.", "warning");
      return;
    }
    openSalesDocumentPreview("contract", state.salesContractDraft.sale_id);
  });

  bindSalesConfigEvents();
  bindSalesDocumentPreviewEvents();
}

function bindSalesConfigEvents() {
  const ensureSalesConfigAccess = () => {
    if (canManageSalesTemplates()) return true;
    showToast("Somente TI e ADMINISTRADOR podem alterar a configuração de vendas.", "warning");
    return false;
  };

  document.querySelector("[data-sales-config-close-button]")?.addEventListener("click", closeSalesConfigModal);
  document.querySelector("[data-sales-config-close]")?.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-sales-config-close")) {
      closeSalesConfigModal();
    }
  });

  document.querySelectorAll("[data-sales-config-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.salesConfigTab = button.dataset.salesConfigTab;
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-sales-template-preview], [data-sales-template-generate]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.salesConfigTab === "company") {
        syncSalesCompanySettingsFromForm();
      } else {
        syncSalesTemplateFromForm(state.salesConfigTab);
      }
      openSalesDocumentPreview(button.dataset.salesTemplatePreview || button.dataset.salesTemplateGenerate);
    });
  });

  document.querySelectorAll("[data-sales-template-open-pdf]").forEach((button) => {
    button.addEventListener("click", () => {
      const template = getSalesTemplate(button.dataset.salesTemplateOpenPdf);
      openSalesTemplatePdf(template.pdf_template_data_url);
    });
  });

  document.querySelectorAll("[data-sales-template-save]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!ensureSalesConfigAccess()) return;
      try {
        syncSalesTemplateFromForm(button.dataset.salesTemplateSave);
        await persistSalesDocumentSettings();
        showToast("Modelo salvo com sucesso.", "success");
        renderActiveModule();
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-sales-template-default]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!ensureSalesConfigAccess()) return;
      try {
        syncSalesTemplateFromForm(button.dataset.salesTemplateDefault);
        await persistSalesDocumentSettings();
        showToast("Modelo definido como padrão.", "success");
        renderActiveModule();
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-sales-template-restore]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!ensureSalesConfigAccess()) return;
      try {
        state.salesDocumentSettings.templates[button.dataset.salesTemplateRestore] = createDefaultSalesTemplate(button.dataset.salesTemplateRestore);
        await persistSalesDocumentSettings();
        renderActiveModule();
        showToast("Modelo restaurado para o padrão.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelector("[data-sales-company-save]")?.addEventListener("click", async () => {
    if (!ensureSalesConfigAccess()) return;
    try {
      syncSalesCompanySettingsFromForm();
      await persistSalesDocumentSettings();
      void queueSystemLog({
        moduleKey: "sales",
        action: "edicao",
        level: "Informativo",
        itemAffected: "Dados da empresa",
        description: "Dados fixos da empresa atualizados nos modelos comerciais.",
        entityType: "sales_company_settings",
      });
      showToast("Dados fixos da empresa salvos.", "success");
      renderActiveModule();
    } catch (error) {
      showToast(formatError(error), "danger");
    }
  });

  document.querySelector("[data-sales-company-remove-logo]")?.addEventListener("click", async () => {
    if (!ensureSalesConfigAccess()) return;
    try {
      state.salesDocumentSettings.company.logo = "";
      await persistSalesDocumentSettings();
      void queueSystemLog({
        moduleKey: "sales",
        action: "edicao",
        level: "Atenção",
        itemAffected: "Logo da empresa",
        description: "Logo removida dos modelos comerciais.",
        entityType: "sales_company_settings",
      });
      renderActiveModule();
    } catch (error) {
      showToast(formatError(error), "danger");
    }
  });

  const logoInput = document.querySelector('#sales-company-settings-form input[name="logo_file"]');
  if (logoInput) {
    logoInput.addEventListener("change", async (event) => {
      if (!ensureSalesConfigAccess()) return;
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      try {
        state.salesDocumentSettings.company.logo = await readFileAsDataUrl(file);
        await persistSalesDocumentSettings();
        renderActiveModule();
        void queueSystemLog({
          moduleKey: "sales",
          action: "edicao",
          level: "Informativo",
          itemAffected: "Logo da empresa",
          description: "Logo atualizada nos modelos comerciais.",
          entityType: "sales_company_settings",
        });
        showToast("Logo atualizada com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  }

  document.querySelectorAll("[data-sales-template-remove-pdf]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!ensureSalesConfigAccess()) return;
      try {
        syncSalesTemplateFromForm(button.dataset.salesTemplateRemovePdf);
        state.salesDocumentSettings.templates[button.dataset.salesTemplateRemovePdf] = {
          ...state.salesDocumentSettings.templates[button.dataset.salesTemplateRemovePdf],
          pdf_template_name: "",
          pdf_template_data_url: "",
          pdf_template_updated_at: "",
        };
        await persistSalesDocumentSettings();
        void queueSystemLog({
          moduleKey: "sales",
          action: "edicao",
          level: "Atenção",
          itemAffected: `PDF ${button.dataset.salesTemplateRemovePdf}`,
          description: "PDF base removido do modelo comercial.",
          entityType: "sales_template_settings",
        });
        renderActiveModule();
        showToast("PDF base removido com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  const templatePdfInput = document.querySelector('#sales-config-template-form input[name="pdf_template_file"]');
  if (templatePdfInput) {
    templatePdfInput.addEventListener("change", async (event) => {
      if (!ensureSalesConfigAccess()) return;
      const templateType = state.salesConfigTab;
      const file = event.currentTarget.files?.[0];
      if (!file || !templateType || templateType === "company") return;

      if (!state.supabase || !state.accessToken) {
        showToast("Conecte o sistema ao Supabase antes de enviar PDFs dos modelos.", "warning");
        event.currentTarget.value = "";
        return;
      }

      if (file.type !== "application/pdf" && !String(file.name || "").toLowerCase().endsWith(".pdf")) {
        showToast("Selecione um arquivo PDF válido.", "warning");
        event.currentTarget.value = "";
        return;
      }

      if (file.size > SALES_TEMPLATE_PDF_MAX_SIZE) {
        showToast(`O PDF precisa ter no máximo ${formatFileSize(SALES_TEMPLATE_PDF_MAX_SIZE)}.`, "warning");
        event.currentTarget.value = "";
        return;
      }

      try {
        syncSalesTemplateFromForm(templateType);
        state.salesDocumentSettings.templates[templateType] = {
          ...state.salesDocumentSettings.templates[templateType],
          pdf_template_name: file.name || `${templateType}.pdf`,
          pdf_template_data_url: await readFileAsDataUrl(file),
          pdf_template_updated_at: new Date().toISOString(),
        };
        await persistSalesDocumentSettings();
        void queueSystemLog({
          moduleKey: "sales",
          action: "edicao",
          level: "Informativo",
          itemAffected: `PDF ${templateType}`,
          description: "PDF base atualizado no modelo comercial.",
          entityType: "sales_template_settings",
        });
        renderActiveModule();
        showToast("PDF base carregado com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      } finally {
        event.currentTarget.value = "";
      }
    });
  }
}

function bindSalesDocumentPreviewEvents() {
  document.querySelector("[data-sales-preview-close-button]")?.addEventListener("click", () => {
    closeSalesDocumentPreview();
    renderActiveModule();
  });
  document.querySelector("[data-sales-preview-close]")?.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-sales-preview-close")) {
      closeSalesDocumentPreview();
      renderActiveModule();
    }
  });

  document.querySelector("[data-sales-preview-export]")?.addEventListener("click", () => {
    openPrintWindowForHtml(state.salesDocumentPreview.html, state.salesDocumentPreview.title);
  });
  document.querySelector("[data-sales-preview-print]")?.addEventListener("click", () => {
    openPrintWindowForHtml(state.salesDocumentPreview.html, state.salesDocumentPreview.title);
  });
  document.querySelector("[data-sales-preview-open-template-pdf]")?.addEventListener("click", () => {
    openSalesTemplatePdf(state.salesDocumentPreview.templatePdfDataUrl);
  });
  document.querySelector("[data-sales-preview-send]")?.addEventListener("click", () => {
    openPreparedSalesDocumentShare();
  });
}

function closeSalesConfigModal() {
  state.salesConfigModalOpen = false;
  state.salesDocumentSettings.activeTab = state.salesConfigTab;
  saveSalesDocumentSettings();
  void queueSystemLog({
    moduleKey: "sales",
    action: "edicao",
    level: "Informativo",
    itemAffected: "Configurações de documentos",
    description: "Configurações dos modelos comerciais atualizadas.",
    entityType: "sales_template_settings",
  });
  renderActiveModule();
}

function syncSalesTemplateFromForm(type) {
  if (!canManageSalesTemplates()) return;
  const form = document.querySelector('#sales-config-template-form');
  if (!form) return;

  state.salesDocumentSettings.templates[type] = {
    ...state.salesDocumentSettings.templates[type],
    name: form.elements.namedItem("name")?.value || "",
    title: form.elements.namedItem("title")?.value || "",
    validity_days: form.elements.namedItem("validity_days")?.value || "0",
    header: form.elements.namedItem("header")?.value || "",
    footer: form.elements.namedItem("footer")?.value || "",
    presentation_text: form.elements.namedItem("presentation_text")?.value || "",
    notes: form.elements.namedItem("notes")?.value || "",
    payment_terms: form.elements.namedItem("payment_terms")?.value || "",
    delivery_terms: form.elements.namedItem("delivery_terms")?.value || "",
    warranty: form.elements.namedItem("warranty")?.value || "",
    signature: form.elements.namedItem("signature")?.value || "",
    contact_details: form.elements.namedItem("contact_details")?.value || "",
    final_message: form.elements.namedItem("final_message")?.value || "",
    body_html: form.elements.namedItem("body_html")?.value || "",
  };
}

function syncSalesCompanySettingsFromForm() {
  if (!canManageSalesTemplates()) return;
  const form = document.querySelector('#sales-company-settings-form');
  if (!form) return;

  state.salesDocumentSettings.company = {
    ...state.salesDocumentSettings.company,
    company_name: form.elements.namedItem("company_name")?.value || "",
    cnpj: form.elements.namedItem("cnpj")?.value || "",
    address: form.elements.namedItem("address")?.value || "",
    phone: form.elements.namedItem("phone")?.value || "",
    email: form.elements.namedItem("email")?.value || "",
    site: form.elements.namedItem("site")?.value || "",
    responsible_name: form.elements.namedItem("responsible_name")?.value || "",
    responsible_role: form.elements.namedItem("responsible_role")?.value || "",
    signature: form.elements.namedItem("signature")?.value || "",
  };
  state.salesDocumentSettings.commercial = {
    ...(state.salesDocumentSettings.commercial || {}),
    pix_discount_percent: normalizePercentInput(form.elements.namedItem("pix_discount_percent")?.value || 0),
  };
}

function openPreparedSalesDocumentShare() {
  const { customerEmail, customerPhone, title } = state.salesDocumentPreview;
  const subject = encodeURIComponent(`${title} - ${state.salesDocumentPreview.customerName || "Cliente"}`);
  const body = encodeURIComponent("O documento comercial foi gerado no ERP e esta pronto para envio em PDF.");

  if (customerEmail) {
    void queueSystemLog({
      moduleKey: "sales",
      action: "vinculo_cliente",
      level: "Informativo",
      itemAffected: state.salesDocumentPreview.customerName || "Cliente",
      description: "Documento comercial preparado para envio por e-mail.",
      entityType: "sales_document_share",
      payload: { channel: "email" },
    });
    window.open(`mailto:${customerEmail}?subject=${subject}&body=${body}`, "_blank");
    return;
  }

  if (customerPhone) {
    const digits = String(customerPhone).replace(/\D/g, "");
    void queueSystemLog({
      moduleKey: "sales",
      action: "vinculo_cliente",
      level: "Informativo",
      itemAffected: state.salesDocumentPreview.customerName || "Cliente",
      description: "Documento comercial preparado para envio por WhatsApp.",
      entityType: "sales_document_share",
      payload: { channel: "whatsapp" },
    });
    window.open(`https://wa.me/${digits}?text=${body}`, "_blank");
    return;
  }

  showToast("Documento pronto. Gere o PDF e envie pelo canal desejado.", "warning");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function getDataUrlApproxSize(dataUrl) {
  const base64 = String(dataUrl || "").split(",", 2)[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível processar a imagem."));
    image.src = dataUrl;
  });
}

async function resizeProductImageFile(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Envie uma imagem válida para a foto do produto.");
  }

  if (file.size > PRODUCT_PHOTO_MAX_SOURCE_SIZE) {
    throw new Error("A foto original deve ter no máximo 8 MB.");
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  if (file.size <= PRODUCT_PHOTO_MAX_STORED_SIZE) {
    return {
      dataUrl: originalDataUrl,
      size: getDataUrlApproxSize(originalDataUrl),
      resized: false,
    };
  }

  const image = await loadImageFromDataUrl(originalDataUrl);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) {
    throw new Error("Não foi possível identificar o tamanho da imagem.");
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Seu navegador não conseguiu compactar a imagem.");
  }

  const scale = Math.min(1, PRODUCT_PHOTO_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const firstPassDataUrl = canvas.toDataURL("image/jpeg", 0.74);
  const firstPassSize = getDataUrlApproxSize(firstPassDataUrl);
  if (firstPassSize <= PRODUCT_PHOTO_MAX_STORED_SIZE) {
    return { dataUrl: firstPassDataUrl, size: firstPassSize, resized: true };
  }

  const fallbackDataUrl = canvas.toDataURL("image/jpeg", 0.56);
  return {
    dataUrl: fallbackDataUrl,
    size: getDataUrlApproxSize(fallbackDataUrl),
    resized: true,
  };
}

function bindPurchasesModuleEvents() {
  document.querySelectorAll("[data-purchase-toggle-form]").forEach((button) => {
    button.addEventListener("click", () => {
      const shouldOpen = state.openAccordionKey !== "purchase-form";
      state.openAccordionKey = shouldOpen ? "purchase-form" : null;
      state.purchaseDraft = shouldOpen ? createEmptyPurchaseDraft() : createEmptyPurchaseDraft();
      if (shouldOpen) {
        state.purchaseDraft.requester_id = state.currentUser?.user_id || "";
        state.purchaseDraft.requester_name = getLoggedUserName("");
      }
      renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#purchase-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  bindDeferredTextFilter("#purchase-search-input", (value) => {
    state.purchaseSearch = value;
  });

  bindDeferredSelectFilter("#purchase-status-filter", (value) => {
    state.purchaseStatusFilter = value;
  });

  const purchaseForm = document.querySelector("#purchase-form");
  if (purchaseForm) {
    purchaseForm.addEventListener("submit", handlePurchaseSubmit);
    purchaseForm.addEventListener("input", () => syncPurchaseDraftFromForm(purchaseForm));
    purchaseForm.addEventListener("change", () => syncPurchaseDraftFromForm(purchaseForm));
  }

  const requesterField = document.querySelector('#purchase-form select[name="requester_id"]');
  if (requesterField) {
    requesterField.addEventListener("change", handlePurchaseRequesterSelection);
  }

  const cancelButton = document.querySelector("[data-purchase-cancel]");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      resetPurchaseFormState();
      renderActiveModule();
    });
  }

  const addItemButton = document.querySelector("[data-purchase-add-item]");
  if (addItemButton) {
    addItemButton.addEventListener("click", () => {
      state.purchaseDraft.items.push(createEmptyPurchaseItemDraft());
      renderActiveModule();
    });
  }

  document.querySelectorAll("[data-purchase-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.purchaseDraft.items.length === 1) {
        state.purchaseDraft.items = [createEmptyPurchaseItemDraft()];
      } else {
        state.purchaseDraft.items.splice(Number(button.dataset.purchaseRemoveItem), 1);
      }
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-purchase-item-field]").forEach((field) => {
    field.addEventListener("input", handlePurchaseItemFieldChange);
    field.addEventListener("change", handlePurchaseItemFieldChange);
  });

  document.querySelectorAll("[data-purchase-view-id], [data-purchase-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const recordId = button.dataset.purchaseViewId || button.dataset.purchaseEditId;
      const request = (state.moduleData.purchases || []).find((item) => item.id === recordId);
      if (!request) return;
      state.purchaseDraft = hydratePurchaseDraft(request);
      state.openAccordionKey = "purchase-form";
      renderActiveModule();
      document.querySelector("#purchase-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-purchase-open-conclusion]").forEach((button) => {
    button.addEventListener("click", () => {
      const request = (state.moduleData.purchases || []).find((item) => item.id === button.dataset.purchaseOpenConclusion);
      if (!request) return;
      state.purchaseConclusionDraft = hydratePurchaseConclusionDraft(request);
      state.openAccordionKey = "purchase-conclusion-form";
      renderActiveModule();
      document.querySelector("#purchase-conclusion-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-purchase-status-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const request = (state.moduleData.purchases || []).find((item) => item.id === button.dataset.purchaseStatusAction);
      if (!request) return;
      try {
        const updatedRequest = await updatePurchaseRequestStatus(request, button.dataset.purchaseNextStatus);
        upsertModuleRecord("purchases", updatedRequest || { ...request, status: button.dataset.purchaseNextStatus });
        renderActiveModule();
      } catch (error) {
        showPurchaseNotification(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-purchase-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const { error } = await state.supabase.from("purchase_requests").delete().eq("id", button.dataset.purchaseDeleteId);
        if (error) throw error;
        removeModuleRecord("purchases", button.dataset.purchaseDeleteId);
        resetPurchaseFormState();
        resetPurchaseConclusionState();
        renderActiveModule();
        showPurchaseNotification("Solicitação excluída com sucesso.", "approved");
      } catch (error) {
        showPurchaseNotification(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-purchase-notify-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const request = (state.moduleData.purchases || []).find((item) => item.id === button.dataset.purchaseNotifyId);
      if (!request) return;
      try {
        await notifyPurchaseRequester(request, buildPurchaseRequesterMessage(getPurchaseRequestMetadata(request)));
        await loadTable("purchase_requests", "purchases");
        renderActiveModule();
      } catch (error) {
        showPurchaseNotification(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-purchase-notification-center], [data-purchase-inline-alert]").forEach((button) => {
    button.addEventListener("click", () => {
      const latestNotifications = (state.moduleData.purchases || [])
        .flatMap((item) => getPurchaseRequestMetadata(item).notifications || [])
        .slice(0, 4)
        .map((notification) => notification.message)
        .filter(Boolean);
      showPurchaseNotification(latestNotifications[0] || "Sem novos avisos de compras.", latestNotifications.length ? "notified" : "approved");
    });
  });

  const purchaseConclusionForm = document.querySelector("#purchase-conclusion-form");
  if (purchaseConclusionForm) {
    purchaseConclusionForm.addEventListener("submit", handlePurchaseConclusionSubmit);
    purchaseConclusionForm.addEventListener("input", () => syncPurchaseConclusionDraftFromForm(purchaseConclusionForm));
    purchaseConclusionForm.addEventListener("change", () => syncPurchaseConclusionDraftFromForm(purchaseConclusionForm));
  }

  const purchaseConclusionCancel = document.querySelector("[data-purchase-conclusion-cancel]");
  if (purchaseConclusionCancel) {
    purchaseConclusionCancel.addEventListener("click", () => {
      resetPurchaseConclusionState();
      renderActiveModule();
    });
  }

  document.querySelectorAll("[data-purchase-upload]").forEach((input) => {
    input.addEventListener("change", handlePurchaseFileSelection);
  });

  document.querySelectorAll("[data-purchase-remove-file]").forEach((button) => {
    button.addEventListener("click", () => {
      removePurchaseFile(button.dataset.purchaseRemoveFile, Number(button.dataset.purchaseFileIndex));
      renderActiveModule();
    });
  });
}

function handlePurchaseRequesterSelection(event) {
  const requester = (state.moduleData.users || []).find((item) => item.id === event.currentTarget.value);
  state.purchaseDraft.requester_id = requester?.id || "";
  state.purchaseDraft.requester_name = requester?.full_name || "";
}

function handlePurchaseItemFieldChange(event) {
  const index = Number(event.currentTarget.dataset.purchaseItemIndex);
  const field = event.currentTarget.dataset.purchaseItemField;
  const item = state.purchaseDraft.items[index];
  if (!item) return;
  item[field] = event.currentTarget.value;
}

function syncPurchaseDraftFromForm(form) {
  if (!form) return;
  const requester = (state.moduleData.users || []).find((item) => item.id === form.elements.namedItem("requester_id")?.value);
  const requesterNameField = form.elements.namedItem("requester_name");
  state.purchaseDraft = {
    ...state.purchaseDraft,
    edit_id: form.elements.namedItem("edit_id")?.value || "",
    requester_id: form.elements.namedItem("requester_id")?.value || "",
    requester_name: requester?.full_name || requesterNameField?.value || state.purchaseDraft.requester_name || "",
    department: form.elements.namedItem("department")?.value || "",
    urgency: form.elements.namedItem("urgency")?.value || "media",
    justification: form.elements.namedItem("justification")?.value || "",
  };
}

function syncPurchaseConclusionDraftFromForm(form) {
  if (!form) return;
  const stockEntries = Array.from(form.querySelectorAll("[data-purchase-stock-entry-index]")).map((row) => ({
    id: row.dataset.purchaseStockEntryId || "",
    source_index: Number(row.dataset.purchaseStockEntryIndex || 0),
    requested_product_name: row.dataset.purchaseStockRequestedName || "",
    requested_description: row.dataset.purchaseStockRequestedDescription || "",
    requested_unit: row.dataset.purchaseStockRequestedUnit || "",
    product_id: row.querySelector("[data-purchase-stock-product]")?.value || "",
    quantity: normalizeWholeNumber(row.querySelector("[data-purchase-stock-quantity]")?.value || 0, { min: 0, fallback: 0 }),
    unit_cost: parseCurrencyInput(row.querySelector("[data-purchase-stock-cost]")?.value || 0),
    stock_registered: row.dataset.purchaseStockRegistered === "true",
    stock_registered_at: row.dataset.purchaseStockRegisteredAt || "",
  }));
  state.purchaseConclusionDraft = {
    ...state.purchaseConclusionDraft,
    request_id: form.elements.namedItem("request_id")?.value || "",
    order_number: form.elements.namedItem("order_number")?.value || "",
    invoice_number: form.elements.namedItem("invoice_number")?.value || "",
    supplier: form.elements.namedItem("supplier")?.value || "",
    purchase_date: form.elements.namedItem("purchase_date")?.value || "",
    due_date: form.elements.namedItem("due_date")?.value || "",
    payment_method: form.elements.namedItem("payment_method")?.value || "",
    total_amount: (() => {
      const field = form.elements.namedItem("total_amount");
      return String(field?.value || "").trim() ? getCurrencyInputNumber(form, "total_amount") : "";
    })(),
    purchase_notes: form.elements.namedItem("purchase_notes")?.value || "",
    stock_entries: stockEntries,
  };
  if (state.purchaseConclusionDraft.payment_method !== "Boleto") {
    state.purchaseConclusionDraft.installments = [createEmptyPurchaseInstallmentDraft(1)];
  } else if (!Array.isArray(state.purchaseConclusionDraft.installments) || !state.purchaseConclusionDraft.installments.length) {
    state.purchaseConclusionDraft.installments = [createEmptyPurchaseInstallmentDraft(1)];
  }
}

function resetPurchaseFormState() {
  state.openAccordionKey = null;
  state.purchaseDraft = createEmptyPurchaseDraft();
}

function resetPurchaseConclusionState() {
  state.openAccordionKey = null;
  state.purchaseConclusionDraft = createEmptyPurchaseConclusionDraft();
}

function normalizePurchaseItems(items) {
  return (items || [])
    .map((item) => ({
      product_name: String(item.product_name || "").trim(),
      description: String(item.description || "").trim(),
      quantity: normalizeWholeNumber(item.quantity || 0, { min: 1, fallback: 0 }),
      unit: String(item.unit || "un").trim() || "un",
      measures: String(item.measures || "").trim(),
    }))
    .filter((item) => item.product_name && item.quantity > 0);
}

function createPurchaseStockEntryDraft(item, index, existing = {}) {
  return {
    id: existing.id || `purchase-stock-${index + 1}`,
    source_index: Number(existing.source_index ?? index),
    requested_product_name: existing.requested_product_name || item.product_name || "",
    requested_description: existing.requested_description || item.description || "",
    requested_unit: existing.requested_unit || item.unit || "un",
    product_id: existing.product_id || "",
    quantity: normalizeWholeNumber(existing.quantity ?? item.quantity ?? 0, { min: 0, fallback: 0 }),
    unit_cost: parseCurrencyInput(existing.unit_cost || 0),
    stock_registered: Boolean(existing.stock_registered),
    stock_registered_at: existing.stock_registered_at || "",
  };
}

function normalizePurchaseStockEntries(entries, requestItems = []) {
  const normalizedItems = normalizePurchaseItems(requestItems);
  const sourceEntries = Array.isArray(entries) ? entries : [];
  const entriesBySource = new Map(sourceEntries.map((entry, index) => [Number(entry.source_index ?? index), entry]));
  const baseEntries = normalizedItems.length
    ? normalizedItems.map((item, index) => createPurchaseStockEntryDraft(item, index, entriesBySource.get(index) || {}))
    : sourceEntries.map((entry, index) => createPurchaseStockEntryDraft({}, index, entry));

  return baseEntries.filter((entry) => entry.requested_product_name || entry.product_id || entry.quantity > 0);
}

function getPurchaseConclusionStockEntries(request) {
  const metadata = getPurchaseRequestMetadata(request || {});
  return normalizePurchaseStockEntries(state.purchaseConclusionDraft.stock_entries, metadata.items);
}

function hydratePurchaseDraft(request) {
  const metadata = getPurchaseRequestMetadata(request);
  return {
    edit_id: request.id || "",
    request_number: metadata.request_number || "",
    requester_id: metadata.requester_id || "",
    requester_name: metadata.requester_name || "",
    department: metadata.department || "",
    urgency: metadata.urgency || "media",
    justification: metadata.justification || "",
    status: metadata.status || "pending",
    requested_at: request.created_at || "",
    items: metadata.items.length
      ? metadata.items.map((item) => ({
        product_name: item.product_name || "",
        description: item.description || "",
        quantity: String(item.quantity ?? "1"),
        unit: item.unit || "un",
        measures: item.measures || "",
      }))
      : [createEmptyPurchaseItemDraft()],
  };
}

function hydratePurchaseConclusionDraft(request) {
  const metadata = getPurchaseRequestMetadata(request);
  const stockEntries = normalizePurchaseStockEntries(metadata.purchaseDetails.stock_entries, metadata.items);
  return {
    request_id: request.id || "",
    order_number: metadata.purchaseDetails.order_number || "",
    invoice_number: metadata.purchaseDetails.invoice_number || "",
    supplier: metadata.purchaseDetails.supplier || "",
    purchase_date: metadata.purchaseDetails.purchase_date || "",
    due_date: metadata.purchaseDetails.due_date || "",
    payment_method: metadata.purchaseDetails.payment_method || "",
    total_amount: metadata.purchaseDetails.total_amount ? Number(metadata.purchaseDetails.total_amount) : "",
    purchase_notes: metadata.purchaseDetails.purchase_notes || "",
    order_files: metadata.purchaseDetails.order_files || [],
    invoice_files: metadata.purchaseDetails.invoice_files || [],
    attachment_files: metadata.purchaseDetails.attachment_files || [],
    boleto_files: metadata.purchaseDetails.boleto_files || [],
    installments: metadata.purchaseDetails.installments?.length
      ? metadata.purchaseDetails.installments.map((installment, index) => ({
        id: installment.id || `purchase-installment-${index + 1}`,
        installment_number: Number(installment.installment_number || index + 1),
        due_date: installment.due_date || "",
        amount: installment.amount ? Number(installment.amount) : "",
        boleto_files: Array.isArray(installment.boleto_files) ? installment.boleto_files : [],
      }))
      : [createEmptyPurchaseInstallmentDraft(1)],
    stock_entries: stockEntries,
  };
}

async function handlePurchaseSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  syncPurchaseDraftFromForm(form);

  const normalizedItems = normalizePurchaseItems(state.purchaseDraft.items);
  if (!state.purchaseDraft.requester_id && !state.purchaseDraft.requester_name.trim()) {
    showPurchaseNotification("Preencha os campos obrigatórios.", "warning");
    return;
  }

  if (!state.purchaseDraft.department.trim()) {
    showPurchaseNotification("Preencha os campos obrigatórios.", "warning");
    return;
  }

  if (!normalizedItems.length) {
    showPurchaseNotification("Adicione ao menos um item na solicitação.", "warning");
    return;
  }

  const payload = {
    request_number: state.purchaseDraft.request_number || generatePurchaseRequestNumber(),
    requester_id: state.purchaseDraft.requester_id || null,
    requester_name: state.purchaseDraft.requester_name || resolvePurchaseRequesterName(state.purchaseDraft.requester_id),
    department: state.purchaseDraft.department,
    urgency: state.purchaseDraft.urgency || "media",
    justification: state.purchaseDraft.justification.trim(),
    status: state.purchaseDraft.status || "pending",
    request_items: normalizedItems,
    purchase_details: getPurchaseRequestMetadata({}).purchaseDetails,
    notifications: [],
  };

  try {
    const isEditing = Boolean(state.purchaseDraft.edit_id);
    const savedRequest = await persistPurchaseRequest(payload, state.purchaseDraft.edit_id);
    upsertModuleRecord("purchases", savedRequest || { ...payload, id: state.purchaseDraft.edit_id || payload.request_number });
    resetPurchaseFormState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "purchases",
      action: isEditing ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: payload.request_number,
      description: `Solicitação de compra ${isEditing ? "atualizada" : "criada"} para ${payload.department}.`,
      entityType: "purchase_request",
      entityId: payload.request_number,
      payload,
    });
    showPurchaseNotification(isEditing ? "Solicitação atualizada com sucesso." : "Solicitação criada com sucesso.", isEditing ? "approved" : "created");
  } catch (error) {
    showPurchaseNotification(formatError(error), "danger");
  }
}

async function handlePurchaseConclusionSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  syncPurchaseConclusionDraftFromForm(form);

  const request = (state.moduleData.purchases || []).find((item) => item.id === state.purchaseConclusionDraft.request_id);
  if (!request) {
    showPurchaseNotification("Solicitação não encontrada.", "warning");
    return;
  }

  if (!state.purchaseConclusionDraft.payment_method) {
    showPurchaseNotification("Não permitir concluir sem forma de pagamento.", "warning");
    return;
  }

  const totalAmount = Number(state.purchaseConclusionDraft.total_amount || 0);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    showPurchaseNotification("Valor total deve ser numerico e maior que zero.", "warning");
    return;
  }

  if (!state.purchaseConclusionDraft.order_number.trim()) {
    showPurchaseNotification("Anexe o pedido.", "warning");
    return;
  }

  if (!state.purchaseConclusionDraft.invoice_number.trim()) {
    showPurchaseNotification("Anexe a nota fiscal.", "warning");
    return;
  }

  const metadata = getPurchaseRequestMetadata(request);
  const normalizedInstallments = state.purchaseConclusionDraft.payment_method === "Boleto"
    ? normalizePurchaseInstallments(state.purchaseConclusionDraft.installments)
    : [];
  const nextDetails = {
    order_number: state.purchaseConclusionDraft.order_number.trim(),
    invoice_number: state.purchaseConclusionDraft.invoice_number.trim(),
    supplier: state.purchaseConclusionDraft.supplier.trim(),
    purchase_date: state.purchaseConclusionDraft.purchase_date || null,
    due_date: state.purchaseConclusionDraft.due_date || null,
    payment_method: state.purchaseConclusionDraft.payment_method,
    total_amount: totalAmount,
    purchase_notes: state.purchaseConclusionDraft.purchase_notes.trim(),
    order_files: state.purchaseConclusionDraft.order_files,
    invoice_files: state.purchaseConclusionDraft.invoice_files,
    attachment_files: state.purchaseConclusionDraft.attachment_files,
    boleto_files: state.purchaseConclusionDraft.payment_method === "Boleto" ? state.purchaseConclusionDraft.boleto_files : [],
    installments: normalizedInstallments,
    stock_entries: normalizePurchaseStockEntries(state.purchaseConclusionDraft.stock_entries, metadata.items),
  };

  const invalidStockEntry = nextDetails.stock_entries.find((entry) =>
    entry.product_id
    && (!Number.isFinite(Number(entry.quantity || 0)) || Number(entry.quantity || 0) <= 0)
  );
  if (invalidStockEntry) {
    showPurchaseNotification("Informe uma quantidade valida para dar entrada no estoque.", "warning");
    return;
  }

  if (state.purchaseConclusionDraft.payment_method === "Boleto") {
    if (!normalizedInstallments.length) {
      showPurchaseNotification("Informe pelo menos uma parcela para o boleto.", "warning");
      return;
    }
    const invalidInstallment = normalizedInstallments.find((installment) =>
      !installment.due_date
      || !Number.isFinite(Number(installment.amount || 0))
      || Number(installment.amount || 0) <= 0
      || !(installment.boleto_files || []).length
    );
    if (invalidInstallment) {
      showPurchaseNotification("Cada parcela do boleto precisa de valor, vencimento e arquivo do boleto.", "warning");
      return;
    }
    const installmentsTotal = normalizedInstallments.reduce((sum, installment) => sum + Number(installment.amount || 0), 0);
    if (Math.abs(installmentsTotal - totalAmount) > 0.009) {
      showPurchaseNotification("A soma das parcelas do boleto deve ser igual ao valor total da compra.", "warning");
      return;
    }
    if (normalizedInstallments.length > 5) {
      showPurchaseNotification("Limite de 5 parcelas por boleto.", "warning");
      return;
    }
  }

  const notificationMessage = `Sua solicitação foi concluída. Pedido ${nextDetails.order_number} registrado.`;
  const payload = {
    ...metadata,
    purchase_details: nextDetails,
    notifications: metadata.notifications,
    status: "completed",
  };

  try {
    const savedRequest = await persistPurchaseRequest(payload, request.id);
    const stockResult = await processPurchaseStockEntries(request, nextDetails);
    const persistedDetails = stockResult.details || nextDetails;
    let finalSavedRequest = savedRequest || { ...request, ...payload };
    if (stockResult.updated) {
      finalSavedRequest = await persistPurchaseRequest({
        ...payload,
        purchase_details: persistedDetails,
      }, request.id) || finalSavedRequest;
    }
    await ensurePayableFromPurchase(request, persistedDetails);
    upsertModuleRecord("purchases", finalSavedRequest || { ...request, ...payload, purchase_details: persistedDetails });
    if (hasPermission("payables", "view")) {
      await loadPayablesTable();
    }
    resetPurchaseConclusionState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "purchases",
      action: "mudanca_status",
      level: "Atenção",
      itemAffected: metadata.request_number || request.id,
      description: `Compra concluída com pedido ${nextDetails.order_number}.`,
      entityType: "purchase_request",
      entityId: request.id,
      payload: { status: "completed", purchase_details: persistedDetails },
    });
    showPurchaseNotification("Compra efetuada com sucesso.", "purchase_completed");
    await notifyPurchaseRequester(request, notificationMessage, "completed");
  } catch (error) {
    showPurchaseNotification(formatError(error), "danger");
  }
}

async function processPurchaseStockEntries(request, details) {
  const entries = normalizePurchaseStockEntries(details.stock_entries, getPurchaseRequestMetadata(request).items);
  if (!entries.some((entry) => entry.product_id && !entry.stock_registered)) {
    return { details: { ...details, stock_entries: entries }, updated: false };
  }

  const nextEntries = [];
  let updated = false;

  for (const entry of entries) {
    if (!entry.product_id || entry.stock_registered) {
      nextEntries.push(entry);
      continue;
    }

    const product = (state.moduleData.products || []).find((item) => item.id === entry.product_id);
    if (!product) {
      throw new Error(`Produto cadastrado nao encontrado para ${entry.requested_product_name || "item comprado"}.`);
    }

    const quantity = Number(entry.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Quantidade invalida para ${entry.requested_product_name || product.name}.`);
    }

    const unitCost = parseCurrencyInput(entry.unit_cost || 0);
    const nextStock = Number(product.current_stock || 0) + quantity;
    await persistProductMovement({
      product,
      movementPayload: {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        movement_type: "entry",
        quantity,
        unit_cost: unitCost,
        batch: product.batch || null,
        machine_serial: product.machine_serial || null,
        notes: `Entrada pela compra ${details.order_number || getPurchaseRequestMetadata(request).request_number || request.id}`,
        moved_by_user_id: state.currentUser?.user_id || null,
        moved_by_name: getLoggedUserName(null),
      },
      nextStock,
    });

    upsertModuleRecord("products", {
      ...product,
      current_stock: nextStock,
      cost_price: unitCost > 0 ? unitCost : product.cost_price,
    });

    nextEntries.push({
      ...entry,
      unit_cost: unitCost,
      stock_registered: true,
      stock_registered_at: new Date().toISOString(),
    });
    updated = true;
  }

  if (updated && hasPermission("inventory", "view")) {
    await loadInventoryMovementsTable();
  }

  return {
    details: {
      ...details,
      stock_entries: nextEntries,
    },
    updated,
  };
}

function resolvePurchaseRequesterName(requesterId) {
  return (state.moduleData.users || []).find((user) => user.id === requesterId)?.full_name || "";
}

function buildPurchaseRequesterMessage(metadata) {
  if (metadata.status === "purchase_completed") {
    return "Sua solicitação de compra foi efetuada";
  }
  if (metadata.status === "completed") {
    return "Sua solicitação foi concluída";
  }
  return `Atualização da solicitação ${metadata.request_number || ""}`.trim();
}

async function notifyPurchaseRequester(request, message, soundType = "notified") {
  const metadata = getPurchaseRequestMetadata(request);
  const payload = {
    ...metadata,
    notifications: appendPurchaseNotification(metadata.notifications, message, soundType),
  };
  const savedRequest = await persistPurchaseRequest(payload, request.id);
  showPurchaseNotification("Solicitante notificado com sucesso.", soundType);
  return savedRequest;
}

function appendPurchaseNotification(currentNotifications, message, type) {
  return [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      message,
      type,
      created_at: new Date().toISOString(),
    },
    ...(Array.isArray(currentNotifications) ? currentNotifications : []),
  ].slice(0, 20);
}

async function updatePurchaseRequestStatus(request, nextStatus) {
  const metadata = getPurchaseRequestMetadata(request);
  const normalizedStatus = nextStatus === "purchase_completed" ? "purchase_completed" : nextStatus;
  const messages = {
    approved: "Solicitação aprovada com sucesso.",
    purchase_completed: "Compra efetuada com sucesso.",
    cancelled: "Solicitação atualizada com sucesso.",
    in_analysis: "Solicitação atualizada com sucesso.",
    in_purchase: "Solicitação atualizada com sucesso.",
  };
  const payload = {
    ...metadata,
    status: normalizedStatus,
    notifications: metadata.notifications,
  };

  const savedRequest = await persistPurchaseRequest(payload, request.id);
  void queueSystemLog({
    moduleKey: "purchases",
    action: "mudanca_status",
    level: ["cancelled"].includes(normalizedStatus) ? "Critico" : "Atenção",
    itemAffected: metadata.request_number || request.id,
    description: `Status da solicitação alterado para ${normalizedStatus}.`,
    entityType: "purchase_request",
    entityId: request.id,
    payload: { status: normalizedStatus },
  });

  if (normalizedStatus === "purchase_completed" || normalizedStatus === "completed") {
    const refreshedRequest = { ...request, status: normalizedStatus };
    return notifyPurchaseRequester(refreshedRequest, buildPurchaseRequesterMessage({ ...metadata, status: normalizedStatus }), normalizedStatus);
  } else {
    showPurchaseNotification(messages[normalizedStatus] || "Solicitação atualizada com sucesso.", normalizedStatus);
  }
  return savedRequest;
}

function handlePurchaseFileSelection(event) {
  const key = event.currentTarget.dataset.purchaseUpload;
  const files = Array.from(event.currentTarget.files || []).map((file) => ({
    name: file.name,
    type: file.type || "",
    size: file.size || 0,
  }));
  if (!key) return;
  state.purchaseConclusionDraft[key] = event.currentTarget.multiple
    ? [...(state.purchaseConclusionDraft[key] || []), ...files]
    : files.slice(0, 1);
  event.currentTarget.value = "";
  renderActiveModule();
}

function removePurchaseFile(key, index) {
  if (!key || !Array.isArray(state.purchaseConclusionDraft[key])) return;
  state.purchaseConclusionDraft[key].splice(index, 1);
}

function normalizePurchaseInstallments(installments) {
  return (Array.isArray(installments) ? installments : [])
    .map((installment, index) => ({
      id: installment.id || `purchase-installment-${index + 1}`,
      installment_number: Number(installment.installment_number || index + 1),
      due_date: String(installment.due_date || "").trim(),
      amount: Number(installment.amount || 0),
      boleto_files: Array.isArray(installment.boleto_files) ? installment.boleto_files : [],
    }))
    .filter((installment) => installment.installment_number > 0);
}

function addPurchaseInstallment() {
  const current = normalizePurchaseInstallments(state.purchaseConclusionDraft.installments);
  if (current.length >= 5) {
    showPurchaseNotification("Limite de 5 parcelas por boleto.", "warning");
    return;
  }
  state.purchaseConclusionDraft.installments = [...current, createEmptyPurchaseInstallmentDraft(current.length + 1)];
}

function removePurchaseInstallment(index) {
  const current = normalizePurchaseInstallments(state.purchaseConclusionDraft.installments);
  if (current.length <= 1) {
    state.purchaseConclusionDraft.installments = [createEmptyPurchaseInstallmentDraft(1)];
    return;
  }
  current.splice(index, 1);
  state.purchaseConclusionDraft.installments = current.map((item, itemIndex) => ({
    ...item,
    installment_number: itemIndex + 1,
  }));
}

function handlePurchaseInstallmentFieldChange(event) {
  const index = Number(event.currentTarget.dataset.purchaseInstallmentIndex);
  const field = event.currentTarget.dataset.purchaseInstallmentField;
  const installments = normalizePurchaseInstallments(state.purchaseConclusionDraft.installments);
  const installment = installments[index];
  if (!installment) return;
  installment[field] = field === "amount"
    ? String(event.currentTarget.value || "").trim() ? Number(event.currentTarget.value) : ""
    : event.currentTarget.value || "";
  state.purchaseConclusionDraft.installments = installments;
}

function handlePurchaseInstallmentFileSelection(event) {
  const index = Number(event.currentTarget.dataset.purchaseInstallmentUploadIndex);
  const installments = normalizePurchaseInstallments(state.purchaseConclusionDraft.installments);
  const installment = installments[index];
  if (!installment) return;
  const files = Array.from(event.currentTarget.files || []).map((file) => ({
    name: file.name,
    type: file.type || "",
    size: file.size || 0,
  }));
  installment.boleto_files = [...(installment.boleto_files || []), ...files];
  state.purchaseConclusionDraft.installments = installments;
  event.currentTarget.value = "";
  renderActiveModule();
}

function removePurchaseInstallmentFile(index, fileIndex) {
  const installments = normalizePurchaseInstallments(state.purchaseConclusionDraft.installments);
  const installment = installments[index];
  if (!installment || !Array.isArray(installment.boleto_files)) return;
  installment.boleto_files.splice(fileIndex, 1);
}

function getPurchaseRequestMetadata(request) {
  const rawJustification = String(request.justification || "");
  const metadata = {
    request_number: request.request_number || "",
    requester_id: request.requester_id || "",
    requester_name: request.requester_name || "",
    department: request.department || request.sector || "",
    urgency: request.urgency || request.priority || "media",
    justification: rawJustification,
    status: request.status || "pending",
    items: Array.isArray(request.request_items) ? request.request_items : [],
    purchaseDetails: normalizePurchaseDetails(request.purchase_details),
    notifications: Array.isArray(request.notifications) ? request.notifications : [],
  };

  rawJustification.split("\n").forEach((line) => {
    if (line.startsWith("[meta:request_number]") && !request.request_number) metadata.request_number = line.replace("[meta:request_number]", "").trim();
    else if (line.startsWith("[meta:requester_id]") && !request.requester_id) metadata.requester_id = line.replace("[meta:requester_id]", "").trim();
    else if (line.startsWith("[meta:requester_name]") && !request.requester_name) metadata.requester_name = line.replace("[meta:requester_name]", "").trim();
    else if (line.startsWith("[meta:department]") && !request.department) metadata.department = line.replace("[meta:department]", "").trim();
    else if (line.startsWith("[meta:urgency]") && !request.urgency) metadata.urgency = line.replace("[meta:urgency]", "").trim();
    else if (line.startsWith("[meta:status]")) metadata.status = line.replace("[meta:status]", "").trim() || metadata.status;
    else if (line.startsWith("[meta:request_items]") && !(request.request_items?.length)) {
      try { metadata.items = JSON.parse(line.replace("[meta:request_items]", "").trim()); } catch {}
    } else if (line.startsWith("[meta:purchase_details]") && !request.purchase_details) {
      try { metadata.purchaseDetails = normalizePurchaseDetails(JSON.parse(line.replace("[meta:purchase_details]", "").trim())); } catch {}
    } else if (line.startsWith("[meta:notifications]") && !(request.notifications?.length)) {
      try { metadata.notifications = JSON.parse(line.replace("[meta:notifications]", "").trim()); } catch {}
    }
  });

  metadata.justification = rawJustification
    .split("\n")
    .filter((line) => !line.startsWith("[meta:"))
    .join("\n")
    .trim();

  if (!metadata.items.length && request.item_name) {
      metadata.items = [{
        product_name: request.item_name,
        description: "",
        quantity: Number(request.quantity || 0),
        unit: "un",
        measures: "",
      }];
  }

  metadata.items = normalizePurchaseItems(metadata.items);
  metadata.primaryItemLabel = metadata.items.length
    ? `${metadata.items[0].product_name || "-"}${metadata.items.length > 1 ? ` +${metadata.items.length - 1}` : ""}`
    : "";
  metadata.primaryMeasuresLabel = metadata.items.find((item) => item.measures)?.measures || "";

  return metadata;
}

function normalizePurchaseDetails(details) {
  const source = typeof details === "object" && details !== null ? details : {};
  const installments = normalizePurchaseInstallments(source.installments || []);
  return {
    order_number: source.order_number || "",
    invoice_number: source.invoice_number || "",
    supplier: source.supplier || "",
    purchase_date: source.purchase_date || "",
    due_date: source.due_date || "",
    payment_method: source.payment_method || "",
    total_amount: Number(source.total_amount || 0),
    purchase_notes: source.purchase_notes || "",
    order_files: Array.isArray(source.order_files) ? source.order_files : [],
    invoice_files: Array.isArray(source.invoice_files) ? source.invoice_files : [],
    attachment_files: Array.isArray(source.attachment_files) ? source.attachment_files : [],
    boleto_files: Array.isArray(source.boleto_files) ? source.boleto_files : [],
    stock_entries: normalizePurchaseStockEntries(source.stock_entries || [], source.request_items || source.items || []),
    quotation_details: typeof source.quotation_details === "object" && source.quotation_details !== null
      ? {
        quote_number: source.quotation_details.quote_number || "",
        supplier_company: source.quotation_details.supplier_company || "",
        supplier_contact: source.quotation_details.supplier_contact || "",
        supplier_phone: source.quotation_details.supplier_phone || "",
        general_notes: source.quotation_details.general_notes || "",
        whatsapp_message: source.quotation_details.whatsapp_message || "",
        pdf_file_name: source.quotation_details.pdf_file_name || "",
        pdf_storage_bucket: source.quotation_details.pdf_storage_bucket || "",
        pdf_storage_path: source.quotation_details.pdf_storage_path || "",
        pdf_public_url: source.quotation_details.pdf_public_url || "",
        pdf_generated_at: source.quotation_details.pdf_generated_at || "",
      }
      : {
        quote_number: "",
        supplier_company: "",
        supplier_contact: "",
        supplier_phone: "",
        general_notes: "",
        whatsapp_message: "",
        pdf_file_name: "",
        pdf_storage_bucket: "",
        pdf_storage_path: "",
        pdf_public_url: "",
        pdf_generated_at: "",
      },
    installments,
  };
}

async function persistPurchaseRequest(payload, editId) {
  const items = normalizePurchaseItems(payload.request_items || payload.items || []);
  const dbPayload = {
    request_number: payload.request_number || generatePurchaseRequestNumber(),
    requester_id: payload.requester_id || null,
    requester_name: payload.requester_name || null,
    department: payload.department || null,
    sector: payload.department || null,
    urgency: payload.urgency || "media",
    priority: payload.urgency || "media",
    item_name: items[0]?.product_name || "Solicitação de compra",
    quantity: items[0]?.quantity || 1,
    justification: payload.justification || null,
    status: payload.status || "pending",
    request_items: items,
    estimated_total: 0,
    purchase_details: normalizePurchaseDetails(payload.purchase_details || payload.purchaseDetails),
    notifications: Array.isArray(payload.notifications) ? payload.notifications : [],
  };

  const query = editId
    ? state.supabase.from("purchase_requests").update(dbPayload).eq("id", editId).select().single()
    : state.supabase.from("purchase_requests").insert(dbPayload).select().single();
  const { data, error } = await query;
  if (!error) return data;
  if (!isPurchaseSchemaCompatibilityError(error)) {
    throw error;
  }

  const legacyPayload = {
    requester_name: dbPayload.requester_name,
    sector: dbPayload.department,
    item_name: dbPayload.item_name,
    quantity: dbPayload.quantity,
    priority: ["baixa", "media", "alta"].includes(dbPayload.urgency) ? dbPayload.urgency : "alta",
    status: mapPurchaseStatusToLegacy(dbPayload.status),
    justification: buildLegacyPurchaseJustification(dbPayload),
  };
  const legacyQuery = editId
    ? state.supabase.from("purchase_requests").update(legacyPayload).eq("id", editId).select().single()
    : state.supabase.from("purchase_requests").insert(legacyPayload).select().single();
  const { data: legacyData, error: legacyError } = await legacyQuery;
  if (legacyError) throw legacyError;
  return legacyData;
}

function buildLegacyPurchaseJustification(payload) {
  return [
    payload.request_number ? `[meta:request_number]${payload.request_number}` : "",
    payload.requester_id ? `[meta:requester_id]${payload.requester_id}` : "",
    payload.requester_name ? `[meta:requester_name]${payload.requester_name}` : "",
    payload.department ? `[meta:department]${payload.department}` : "",
    payload.urgency ? `[meta:urgency]${payload.urgency}` : "",
    payload.status ? `[meta:status]${payload.status}` : "",
    `[meta:request_items]${JSON.stringify(payload.request_items || [])}`,
    `[meta:purchase_details]${JSON.stringify(payload.purchase_details || normalizePurchaseDetails())}`,
    `[meta:notifications]${JSON.stringify(payload.notifications || [])}`,
    payload.justification || "",
  ].filter(Boolean).join("\n");
}

function isPurchaseSchemaCompatibilityError(error) {
  return /column|schema cache|Could not find the .* column|violates check constraint/i.test(String(error?.message || ""));
}

function mapPurchaseStatusToLegacy(status) {
  const mapping = {
    pending: "pending",
    in_analysis: "pending",
    approved: "approved",
    in_purchase: "approved",
    purchase_completed: "approved",
    completed: "approved",
    cancelled: "rejected",
  };
  return mapping[status] || "pending";
}

function generatePurchaseRequestNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = formatShortId(now.toISOString());
  return `SC-${stamp}-${suffix}`;
}

function purchaseUrgencyCell(urgency) {
  return productionPriorityCell(urgency);
}

function purchaseStatusCell(status) {
  const mapping = {
    pending: "Pendente",
    in_analysis: "Em analise",
    approved: "Aprovada",
    in_purchase: "Em compra",
    purchase_completed: "Compra efetuada",
    completed: "Concluída",
    cancelled: "Cancelada",
  };
  const classMap = {
    purchase_completed: "status-completed",
    completed: "status-completed",
    approved: "status-approved",
    in_purchase: "status-planned",
    in_analysis: "status-pending",
    pending: "status-pending",
    cancelled: "status-cancelled",
  };
  return `<span class="status-chip ${classMap[status] || "status-pending"}">${mapping[status] || status}</span>`;
}

function getPayableCategoryOptions() {
  return [
    { value: "Energia", label: "Energia" },
    { value: "Matéria-prima", label: "Matéria-prima" },
    { value: "Manutencao", label: "Manutencao" },
    { value: "Impostos", label: "Impostos" },
    { value: "Serviços", label: "Serviços" },
    { value: "Internet", label: "Internet" },
    { value: "Aluguel", label: "Aluguel" },
    { value: "Compras", label: "Compras" },
    { value: "Produção", label: "Produção" },
    { value: "Outros", label: "Outros" },
  ];
}

function getPayableFrequencyOptions() {
  return [
    { value: "weekly", label: "Semanal" },
    { value: "monthly", label: "Mensal" },
    { value: "quarterly", label: "Trimestral" },
    { value: "semiannual", label: "Semestral" },
    { value: "annual", label: "Anual" },
  ];
}

function getPayableTypeLabel(value) {
  return value === "fixed" ? "Fixa" : "Variavel";
}

function normalizePayablePaymentMethod(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("pix")) return "pix";
  if (normalized.includes("boleto")) return "boleto";
  if (normalized.includes("cart")) return "cartao";
  if (normalized.includes("transf")) return "transferencia";
  if (normalized.includes("notinha") || normalized.includes("nota")) return "boleto";
  return normalized;
}

function normalizePayableAttachments(files) {
  return (Array.isArray(files) ? files : []).map((file) => ({
    id: file.id || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: file.name || "arquivo",
    type: file.type || "",
    size: Number(file.size || 0),
    category: file.category || "anexo",
    data_url: file.data_url || "",
    created_at: file.created_at || new Date().toISOString(),
  }));
}

function getPayableMetadata(payable) {
  const dueDate = payable?.due_date ? new Date(`${payable.due_date}T12:00:00`) : null;
  const now = new Date();
  const todayStart = new Date(`${now.toISOString().slice(0, 10)}T00:00:00`);
  const normalizedStatus = payable?.status === "paid"
    ? "paid"
    : payable?.status === "cancelled"
      ? "cancelled"
      : dueDate && dueDate.getTime() < todayStart.getTime()
        ? "overdue"
        : "pending";
  const daysUntilDue = dueDate
    ? Math.ceil((dueDate.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const paymentMethod = normalizePayablePaymentMethod(payable?.payment_method);
  const attachments = normalizePayableAttachments(payable?.attachments);
  const paymentLog = Array.isArray(payable?.payment_log) ? payable.payment_log : [];

  return {
    payable_number: payable?.payable_number || "",
    description: payable?.description || "",
    supplier: payable?.supplier || "",
    category: payable?.category || "Outros",
    amount: Number(payable?.amount || 0),
    due_date: payable?.due_date || "",
    paid_at: payable?.paid_at || "",
    payment_method: paymentMethod,
    payment_method_label: paymentMethod ? getPaymentMethodLabel(paymentMethod) : "-",
    status: normalizedStatus,
    account_type: payable?.account_type || "variable",
    frequency: payable?.frequency || "",
    auto_generate: Boolean(payable?.auto_generate),
    purchase_request_id: payable?.purchase_request_id || "",
    purchase_request_number: payable?.purchase_request_number || "",
    purchase_installment_number: Number(payable?.purchase_installment_number || 0),
    purchase_installment_label: payable?.purchase_installment_label || "",
    source_module: payable?.source_module || "",
    generated_from_payable_id: payable?.generated_from_payable_id || "",
    notes: payable?.notes || "",
    attachments,
    paymentLog,
    daysUntilDue,
    isDueToday: normalizedStatus === "pending" && daysUntilDue === 0,
    isUpcoming: normalizedStatus === "pending" && daysUntilDue !== null && daysUntilDue > 0 && daysUntilDue <= 3,
    isOverdue: normalizedStatus === "overdue",
    priorityRank: normalizedStatus === "overdue" ? 0 : normalizedStatus === "pending" && daysUntilDue === 0 ? 1 : normalizedStatus === "pending" && daysUntilDue !== null && daysUntilDue <= 3 ? 2 : normalizedStatus === "pending" ? 3 : normalizedStatus === "paid" ? 4 : 5,
  };
}

function payableStatusCell(status) {
  const mapping = {
    pending: "Pendente",
    paid: "Pago",
    overdue: "Atrasado",
    cancelled: "Cancelado",
  };
  const classMap = {
    pending: "status-pending",
    paid: "status-completed",
    overdue: "status-cancelled",
    cancelled: "status-cancelled",
  };
  return `<span class="status-chip ${classMap[status] || "status-pending"}">${mapping[status] || status}</span>`;
}

function getPayablesSnapshot(payables = state.moduleData.payables || []) {
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = getDateShiftedIso(today, 6);
  const monthPrefix = today.slice(0, 7);
  const normalized = payables
    .map((item) => ({ payable: item, metadata: getPayableMetadata(item) }))
    .sort((left, right) => {
      if (left.metadata.priorityRank !== right.metadata.priorityRank) {
        return left.metadata.priorityRank - right.metadata.priorityRank;
      }
      return String(left.metadata.due_date || "").localeCompare(String(right.metadata.due_date || ""));
    });
  const pendingLike = normalized.filter(({ metadata }) => ["pending", "overdue"].includes(metadata.status));
  const totalDueToday = pendingLike
    .filter(({ metadata }) => metadata.due_date === today)
    .reduce((sum, entry) => sum + entry.metadata.amount, 0);
  const totalWeek = pendingLike
    .filter(({ metadata }) => metadata.due_date >= today && metadata.due_date <= weekEnd)
    .reduce((sum, entry) => sum + entry.metadata.amount, 0);
  const totalMonth = pendingLike
    .filter(({ metadata }) => String(metadata.due_date || "").startsWith(monthPrefix))
    .reduce((sum, entry) => sum + entry.metadata.amount, 0);
  const overdue = normalized.filter(({ metadata }) => metadata.status === "overdue");
  const totalOverdue = overdue.reduce((sum, entry) => sum + entry.metadata.amount, 0);
  const totalPaid = normalized
    .filter(({ metadata }) => metadata.status === "paid")
    .reduce((sum, entry) => sum + entry.metadata.amount, 0);
  const receivables = (state.moduleData.sales || [])
    .map((sale) => getSaleMetadata(sale))
    .filter((metadata) => metadata.status === "finalized")
    .reduce((sum, metadata) => sum + Number(metadata.total || 0), 0);

  return {
    entries: normalized,
    pending: pendingLike,
    overdue,
    totalDueToday,
    totalWeek,
    totalMonth,
    totalOverdue,
    totalPaid,
    cashFlow: receivables - (totalWeek || 0),
  };
}

function generatePayableNumber() {
  const now = new Date();
  return `CP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${formatShortId(now.toISOString())}`;
}

function resetPayableDraftState() {
  state.payablesDraft = createEmptyPayableDraft();
}

function resetPayablePaymentDraftState() {
  state.payablesPaymentDraft = createEmptyPayablePaymentDraft();
}

function hydratePayableDraft(payable) {
  const metadata = getPayableMetadata(payable);
  state.payablesDraft = {
    edit_id: payable.id || "",
    payable_number: metadata.payable_number || "",
    description: metadata.description || "",
    supplier: metadata.supplier || "",
    category: metadata.category || "Outros",
    amount: metadata.amount ? String(metadata.amount) : "",
    due_date: metadata.due_date || new Date().toISOString().slice(0, 10),
    payment_method: metadata.payment_method || "",
    status: metadata.status === "overdue" ? "pending" : metadata.status,
    account_type: metadata.account_type || "variable",
    frequency: metadata.frequency || "monthly",
    auto_generate: metadata.auto_generate,
    purchase_request_id: metadata.purchase_request_id || "",
    purchase_request_number: metadata.purchase_request_number || "",
    source_module: metadata.source_module || "",
    generated_from_payable_id: metadata.generated_from_payable_id || "",
    notes: metadata.notes || "",
    attachments: metadata.attachments || [],
  };
}

function hydratePayablePaymentDraft(payable) {
  const metadata = getPayableMetadata(payable);
  state.payablesPaymentDraft = {
    payable_id: payable.id || "",
    payment_date: new Date().toISOString().slice(0, 10),
    payment_method: metadata.payment_method || "",
    payment_notes: "",
  };
}

async function handlePayableAttachmentSelection(event) {
  const files = Array.from(event.currentTarget.files || []);
  if (!files.length) return;
  const category = event.currentTarget.dataset.payableAttachmentCategory || "anexo";
  const nextFiles = await Promise.all(files.map(async (file) => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: file.name,
    type: file.type || "",
    size: file.size || 0,
    category,
    data_url: await readFileAsDataUrl(file),
    created_at: new Date().toISOString(),
  })));
  state.payablesDraft.attachments = [...(state.payablesDraft.attachments || []), ...nextFiles];
  event.currentTarget.value = "";
  renderActiveModule();
}

function removePayableAttachment(index) {
  if (!Array.isArray(state.payablesDraft.attachments)) return;
  state.payablesDraft.attachments.splice(index, 1);
}

async function persistPayableRecord(payload, editId) {
  const amount = Number(payload.amount || 0);
  const dbPayload = {
    payable_number: payload.payable_number || generatePayableNumber(),
    description: payload.description?.trim() || "",
    supplier: payload.supplier?.trim() || "",
    category: payload.category || "Outros",
    amount: Number.isFinite(amount) ? amount : 0,
    due_date: payload.due_date || new Date().toISOString().slice(0, 10),
    paid_at: payload.paid_at || null,
    payment_method: normalizePayablePaymentMethod(payload.payment_method) || null,
    status: payload.status || "pending",
    account_type: payload.account_type || "variable",
    frequency: payload.account_type === "fixed" ? (payload.frequency || "monthly") : null,
    auto_generate: payload.account_type === "fixed" ? Boolean(payload.auto_generate) : false,
    purchase_request_id: payload.purchase_request_id || null,
    purchase_request_number: payload.purchase_request_number || null,
    purchase_installment_number: payload.purchase_installment_number || null,
    purchase_installment_label: payload.purchase_installment_label || null,
    source_module: payload.source_module || null,
    generated_from_payable_id: payload.generated_from_payable_id || null,
    attachments: normalizePayableAttachments(payload.attachments),
    payment_log: Array.isArray(payload.payment_log) ? payload.payment_log : [],
    notes: payload.notes?.trim() || null,
    updated_by_user_id: state.currentUser?.user_id || state.currentUser?.id || null,
    updated_by_name: getLoggedUserName("-"),
    updated_at: new Date().toISOString(),
  };

  if (!editId) {
    dbPayload.created_by_user_id = state.currentUser?.user_id || state.currentUser?.id || null;
    dbPayload.created_by_name = getLoggedUserName("-");
  }
  if (dbPayload.status === "paid") {
    dbPayload.paid_by_user_id = payload.paid_by_user_id || state.currentUser?.user_id || state.currentUser?.id || null;
    dbPayload.paid_by_name = payload.paid_by_name || getLoggedUserName("-");
  }

  const query = editId
    ? state.supabase.from("accounts_payable").update(dbPayload).eq("id", editId).select().single()
    : state.supabase.from("accounts_payable").insert(dbPayload).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data || dbPayload;
}

function addFrequency(dateValue, frequency) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  if (frequency === "weekly") date.setDate(date.getDate() + 7);
  else if (frequency === "quarterly") date.setMonth(date.getMonth() + 3);
  else if (frequency === "semiannual") date.setMonth(date.getMonth() + 6);
  else if (frequency === "annual") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

async function ensureRecurringPayable(payable) {
  const metadata = getPayableMetadata(payable);
  if (metadata.account_type !== "fixed" || !metadata.auto_generate || !metadata.frequency) return;

  const { data: existing, error: existingError } = await state.supabase
    .from("accounts_payable")
    .select("id")
    .eq("generated_from_payable_id", payable.id)
    .limit(1);
  if (existingError) throw existingError;
  if (existing?.length) return;

  await persistPayableRecord({
    payable_number: generatePayableNumber(),
    description: metadata.description,
    supplier: metadata.supplier,
    category: metadata.category,
    amount: metadata.amount,
    due_date: addFrequency(metadata.due_date, metadata.frequency),
    payment_method: metadata.payment_method,
    status: "pending",
    account_type: metadata.account_type,
    frequency: metadata.frequency,
    auto_generate: metadata.auto_generate,
    source_module: metadata.source_module || "payables",
    generated_from_payable_id: payable.id,
    attachments: metadata.attachments,
    notes: metadata.notes,
  });
}

async function handlePayableSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  state.payablesDraft = {
    ...state.payablesDraft,
    edit_id: formData.get("edit_id")?.toString() || "",
    payable_number: formData.get("payable_number")?.toString() || "",
    description: formData.get("description")?.toString().trim() || "",
    supplier: formData.get("supplier")?.toString().trim() || "",
    category: formData.get("category")?.toString() || "Outros",
    amount: formData.get("amount")?.toString() || "",
    due_date: formData.get("due_date")?.toString() || "",
    payment_method: formData.get("payment_method")?.toString() || "",
    account_type: formData.get("account_type")?.toString() || "variable",
    frequency: formData.get("frequency")?.toString() || "monthly",
    auto_generate: formData.get("auto_generate") === "on",
    notes: formData.get("notes")?.toString() || "",
    attachments: state.payablesDraft.attachments || [],
    purchase_request_id: state.payablesDraft.purchase_request_id || "",
    purchase_request_number: state.payablesDraft.purchase_request_number || "",
    source_module: state.payablesDraft.source_module || "",
    generated_from_payable_id: state.payablesDraft.generated_from_payable_id || "",
  };

  if (!state.payablesDraft.description || !state.payablesDraft.supplier || !state.payablesDraft.due_date) {
    showPayableNotification("Preencha descrição, fornecedor e vencimento.", "warning");
    return;
  }

  const amount = Number(state.payablesDraft.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    showPayableNotification("Informe um valor valido para a conta.", "warning");
    return;
  }

  try {
    const isEditing = Boolean(state.payablesDraft.edit_id);
    const persisted = await persistPayableRecord({
      ...state.payablesDraft,
      amount,
      status: "pending",
    }, state.payablesDraft.edit_id);
    upsertModuleRecord("payables", persisted);
    resetPayableDraftState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "payables",
      action: isEditing ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: persisted.payable_number,
      description: `Conta a pagar ${isEditing ? "atualizada" : "criada"} para ${persisted.supplier}.`,
      entityType: "accounts_payable",
      entityId: persisted.payable_number,
      payload: persisted,
    });
    showPayableNotification(isEditing ? "Conta atualizada com sucesso." : "Conta criada com sucesso.", isEditing ? "approved" : "created");
  } catch (error) {
    showPayableNotification(formatError(error), "danger");
  }
}

async function handlePayablePaymentSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payableId = formData.get("payable_id")?.toString() || state.payablesPaymentDraft.payable_id;
  const payable = (state.moduleData.payables || []).find((item) => item.id === payableId);
  if (!payable) {
    showPayableNotification("Conta a pagar não encontrada.", "warning");
    return;
  }

  const metadata = getPayableMetadata(payable);
  if (metadata.status === "paid") {
    showPayableNotification("Pagamento duplicado bloqueado: esta conta já foi paga.", "danger");
    return;
  }

  const paymentDate = formData.get("payment_date")?.toString() || "";
  const paymentMethod = normalizePayablePaymentMethod(formData.get("payment_method")?.toString() || "");
  const paymentNotes = formData.get("payment_notes")?.toString().trim() || "";

  if (!paymentDate || !paymentMethod) {
    showPayableNotification("Informe data e forma de pagamento.", "warning");
    return;
  }

  const paymentLog = [
    {
      action: "paid",
      paid_at: `${paymentDate}T12:00:00`,
      payment_method: paymentMethod,
      notes: paymentNotes,
      user_id: state.currentUser?.user_id || state.currentUser?.id || null,
      user_name: getLoggedUserName("-"),
    },
    ...(Array.isArray(payable.payment_log) ? payable.payment_log : []),
  ];

  try {
    const persisted = await persistPayableRecord({
      ...payable,
      ...metadata,
      paid_at: `${paymentDate}T12:00:00`,
      payment_method: paymentMethod,
      payment_log: paymentLog,
      paid_by_user_id: state.currentUser?.user_id || state.currentUser?.id || null,
      paid_by_name: getLoggedUserName("-"),
      status: "paid",
      notes: paymentNotes || metadata.notes,
    }, payable.id);
    await ensureRecurringPayable(payable);
    upsertModuleRecord("payables", persisted);
    resetPayablePaymentDraftState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "payables",
      action: "pagamento",
      level: "Atenção",
      itemAffected: metadata.payable_number || payable.id,
      description: `Conta paga via ${getPaymentMethodLabel(paymentMethod)}.`,
      entityType: "accounts_payable",
      entityId: payable.id,
      payload: persisted,
    });
    showPayableNotification("Pagamento registrado com sucesso.", "completed");
  } catch (error) {
    showPayableNotification(formatError(error), "danger");
  }
}

async function cancelPayableRecord(payableId) {
  const payable = (state.moduleData.payables || []).find((item) => item.id === payableId);
  if (!payable) return;
  const metadata = getPayableMetadata(payable);
  if (metadata.status === "paid") {
    showPayableNotification("Uma conta paga não pode ser cancelada.", "warning");
    return;
  }

  try {
    const persisted = await persistPayableRecord({
      ...payable,
      ...metadata,
      status: "cancelled",
    }, payable.id);
    upsertModuleRecord("payables", persisted);
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "payables",
      action: "cancelamento",
      level: "Critico",
      itemAffected: metadata.payable_number || payable.id,
      description: "Conta a pagar cancelada.",
      entityType: "accounts_payable",
      entityId: payable.id,
      payload: persisted,
    });
    showPayableNotification("Conta cancelada.", "warning");
  } catch (error) {
    showPayableNotification(formatError(error), "danger");
  }
}

function inferPayableCategoryFromPurchase(metadata) {
  const department = String(metadata.department || "").toLowerCase();
  if (department.includes("manut")) return "Manutencao";
  if (department.includes("produc")) return "Produção";
  return "Compras";
}

function buildPurchasePayableInstallments(details) {
  const normalizedMethod = normalizePayablePaymentMethod(details.payment_method);
  if (normalizedMethod !== "boleto") {
    return [{
      installment_number: 1,
      due_date: details.due_date || details.purchase_date || new Date().toISOString().slice(0, 10),
      amount: Number(details.total_amount || 0),
      boleto_files: Array.isArray(details.boleto_files) ? details.boleto_files : [],
    }];
  }

  const installments = normalizePurchaseInstallments(details.installments || []);
  if (installments.length) {
    return installments;
  }

  return [{
    installment_number: 1,
    due_date: details.due_date || details.purchase_date || new Date().toISOString().slice(0, 10),
    amount: Number(details.total_amount || 0),
    boleto_files: Array.isArray(details.boleto_files) ? details.boleto_files : [],
  }];
}

function shouldCreatePayableFromPurchase(paymentMethod) {
  const normalized = normalizePayablePaymentMethod(paymentMethod);
  return normalized === "boleto";
}

async function ensurePayableFromPurchase(request, details) {
  if (!shouldCreatePayableFromPurchase(details.payment_method)) return;

  const requestId = request.id || null;
  const metadata = getPurchaseRequestMetadata(request);
  const installments = buildPurchasePayableInstallments(details);
  const { data: existing, error } = await state.supabase
    .from("accounts_payable")
    .select("*")
    .eq("purchase_request_id", requestId)
    .order("purchase_installment_number", { ascending: true });
  if (error) throw error;
  const existingMap = new Map((existing || []).map((record) => [Number(record.purchase_installment_number || 1), record]));
  const seen = new Set();

  for (const installment of installments) {
    const installmentNumber = Number(installment.installment_number || 1);
    const existingRecord = existingMap.get(installmentNumber) || null;
    const attachments = normalizePayableAttachments([
      ...(details.invoice_files || []).map((file) => ({ ...file, category: "nota_fiscal" })),
      ...(installment.boleto_files || []).map((file) => ({ ...file, category: "boleto" })),
      ...(details.order_files || []).map((file) => ({ ...file, category: "pedido" })),
      ...(details.attachment_files || []).map((file) => ({ ...file, category: "anexo" })),
    ]);
    const baseDescription = metadata.primaryItemLabel
      ? `Compra ${metadata.primaryItemLabel}`
      : `Compra ${metadata.request_number || request.id}`;
    const payload = {
      payable_number: existingRecord?.payable_number || `${generatePayableNumber()}-P${String(installmentNumber).padStart(2, "0")}`,
      description: installments.length > 1 ? `${baseDescription} - Parcela ${installmentNumber}` : baseDescription,
      supplier: details.supplier || metadata.requester_name || "Fornecedor não informado",
      category: inferPayableCategoryFromPurchase(metadata),
      amount: Number(installment.amount || 0),
      due_date: installment.due_date || details.due_date || details.purchase_date || new Date().toISOString().slice(0, 10),
      payment_method: normalizePayablePaymentMethod(details.payment_method),
      status: "pending",
      account_type: "variable",
      purchase_request_id: requestId,
      purchase_request_number: metadata.request_number || "",
      purchase_installment_number: installmentNumber,
      purchase_installment_label: installments.length > 1 ? `Parcela ${installmentNumber}/${installments.length}` : "Parcela unica",
      source_module: "purchases",
      attachments,
      notes: details.purchase_notes || "",
    };

    await persistPayableRecord(payload, existingRecord?.id || "");
    seen.add(installmentNumber);
    void queueSystemLog({
      moduleKey: "payables",
      action: existingRecord ? "edicao_automatica" : "criacao_automatica",
      level: "Atenção",
      itemAffected: payload.payable_number,
      description: `Conta a pagar ${existingRecord ? "atualizada" : "criada"} automaticamente a partir de compras (${payload.purchase_installment_label}).`,
      entityType: "accounts_payable",
      entityId: existingRecord?.id || payload.payable_number,
      payload,
    });
  }

  const obsolete = (existing || []).filter((record) => !seen.has(Number(record.purchase_installment_number || 1)));
  if (obsolete.length) {
    const { error: deleteError } = await state.supabase
      .from("accounts_payable")
      .delete()
      .in("id", obsolete.map((record) => record.id));
    if (deleteError) throw deleteError;
  }
}

function showPayableNotification(message, type = "warning") {
  const toastType = type === "danger"
    ? "danger"
    : type === "warning" || type === "created"
      ? "warning"
      : "success";
  showToast(message, toastType);
  playNotificationSound(type === "completed" ? "completed" : type);
}

function watchPayablesAlerts() {
  if (!hasPermission("payables", "view")) return;
  const snapshot = getPayablesSnapshot();
  const upcoming = snapshot.entries.filter(({ metadata }) => metadata.isUpcoming);
  const dueToday = snapshot.entries.filter(({ metadata }) => metadata.isDueToday);
  const overdue = snapshot.entries.filter(({ metadata }) => metadata.isOverdue);
  const now = Date.now();

  const upcomingSignature = upcoming.map((entry) => entry.payable.id).join(",");
  if (upcoming.length && upcomingSignature !== state.payablesAlertState.upcomingSignature) {
    state.payablesAlertState.upcomingSignature = upcomingSignature;
    showPayableNotification(`${upcoming.length} conta(s) vencem nos proximos 3 dias.`, "warning");
  }

  const todaySignature = dueToday.map((entry) => entry.payable.id).join(",");
  if (dueToday.length && todaySignature !== state.payablesAlertState.todaySignature) {
    state.payablesAlertState.todaySignature = todaySignature;
    showPayableNotification(`${dueToday.length} conta(s) vencem hoje. Priorize o pagamento.`, "danger");
  }

  const overdueSignature = overdue.map((entry) => entry.payable.id).join(",");
  if (overdue.length && (
    overdueSignature !== state.payablesAlertState.overdueSignature
    || now - state.payablesAlertState.lastOverdueAt >= 300000
  )) {
    state.payablesAlertState.overdueSignature = overdueSignature;
    state.payablesAlertState.lastOverdueAt = now;
    showPayableNotification(`${overdue.length} conta(s) estao atrasadas. Alerta continuo ativo.`, "danger");
  }
}

function subscribeToPayableNotifications() {
  if (!state.supabase || !hasPermission("payables", "view")) return;
  if (state.payableChannel) return;

  state.payableChannel = state.supabase
    .channel("accounts_payable_live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "accounts_payable" },
      async () => {
        await loadPayablesTable();
        if (["payables", "dashboard", "reports"].includes(state.activeModule)) {
          renderActiveModule();
        }
      }
    )
    .subscribe();
}

function subscribeToProductionNotifications() {
  if (!state.supabase || !hasPermission("production", "view")) return;
  if (state.productionChannel) return;

  state.productionChannel = state.supabase
    .channel("production_orders_live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "production_orders" },
      async (payload) => {
        const nextOrder = payload.new || {};
        const previousOrder = payload.old || {};
        await loadTable("production_orders", "production");
        if (["production", "dashboard", "reports"].includes(state.activeModule)) {
          renderActiveModule();
        }
        if (payload.eventType === "INSERT") {
          showProductionNotification(`Nova OP criada: ${nextOrder.order_number || "ordem de produção"}.`, "created");
        } else if (previousOrder.status !== nextOrder.status && nextOrder.status === "completed") {
          showProductionNotification(`OP ${nextOrder.order_number || ""} finalizada.`, "completed");
        } else if (previousOrder.current_step_index !== nextOrder.current_step_index) {
          showProductionNotification(`OP ${nextOrder.order_number || ""}: próxima etapa liberada.`, "notified");
        }
      }
    )
    .subscribe();
}

function handleSalesCustomerSelection(event) {
  const customer = (state.moduleData.customers || []).find((item) => item.id === event.currentTarget.value);
  if (!customer) return;
  const metadata = getCustomerMetadata(customer);
  state.salesDraft.customer_id = customer.id;
  state.salesDraft.customer_name = customer.name || "";
  state.salesDraft.cnpj = metadata.document === "-" ? "" : metadata.document;
  state.salesDraft.address = metadata.address || "";
  renderActiveModule();
}

function getAppScrollElement() {
  return document.querySelector(".main-content") || document.scrollingElement || document.documentElement;
}

async function renderSalesModulePreservingScroll(itemIndex = null) {
  const scrollElement = getAppScrollElement();
  const previousScrollY = window.scrollY;
  const previousScrollTop = scrollElement?.scrollTop || 0;
  await renderActiveModule();
  if (itemIndex !== null && itemIndex !== undefined) {
    const row = document.querySelector(`[data-sales-item-index="${CSS.escape(String(itemIndex))}"]`);
    if (row) {
      row.scrollIntoView({ behavior: "auto", block: "center" });
      return;
    }
  }
  if (scrollElement) {
    scrollElement.scrollTop = previousScrollTop;
  }
  window.scrollTo({ top: previousScrollY, left: 0, behavior: "auto" });
}

function handleSalesItemFieldChange(event) {
  const index = Number(event.currentTarget.dataset.salesItemIndex);
  const field = event.currentTarget.dataset.salesItemField;
  const item = state.salesDraft.items[index];
  if (!item) return;

  if (field === "product_id") {
    const product = (state.moduleData.products || []).find((productItem) => productItem.id === event.currentTarget.value);
    const saleOptions = normalizeProductSaleOptions(product);
    const firstOption = saleOptions[0] || null;
    const draftItem = {
      product_id: event.currentTarget.value,
      product_name: product?.name || "",
      product_code: firstOption?.code || product?.code || "",
      sale_option_id: firstOption?.id || "",
      sale_option_label: firstOption?.label || "",
      kit_structure_id: firstOption?.kit_structure_id || "",
    };
    const linkedStructure = findBomStructureForSalesItem(draftItem);
    const bomUnitValue = getBomStructureUnitValue(linkedStructure);
    const productSalePrice = product ? parseCurrencyInput(product.sale_price || 0) : 0;
    item[field] = event.currentTarget.value;
    item.product_name = product?.name || "";
    item.product_code = firstOption?.code || product?.code || "";
    item.sale_option_id = firstOption?.id || "";
    item.sale_option_label = firstOption?.label || "";
    item.kit_structure_id = firstOption?.kit_structure_id || linkedStructure?.id || "";
    item.production_quantity = firstOption?.production_quantity || "";
    item.unit_price = firstOption?.price || bomUnitValue || productSalePrice || 0;
    void renderSalesModulePreservingScroll(index);
    return;
  }

  if (field === "sale_option_id") {
    const product = (state.moduleData.products || []).find((productItem) => productItem.id === item.product_id);
    const option = findProductSaleOption(product, event.currentTarget.value);
    const draftItem = {
      ...item,
      product_code: option?.code || product?.code || "",
      sale_option_id: option?.id || "",
      sale_option_label: option?.label || "",
      kit_structure_id: option?.kit_structure_id || "",
    };
    const linkedStructure = findBomStructureForSalesItem(draftItem);
    const bomUnitValue = getBomStructureUnitValue(linkedStructure);
    const productSalePrice = product ? parseCurrencyInput(product.sale_price || 0) : 0;
    item.sale_option_id = option?.id || "";
    item.sale_option_label = option?.label || "";
    item.kit_structure_id = option?.kit_structure_id || linkedStructure?.id || "";
    item.production_quantity = option?.production_quantity || "";
    item.product_code = option?.code || product?.code || "";
    item.unit_price = option?.price || bomUnitValue || productSalePrice || 0;
    void renderSalesModulePreservingScroll(index);
    return;
  }

  if (field === "unit_price" || field === "discount") {
    item[field] = parseCurrencyInput(event.currentTarget.value);
    updateSalesDraftAmountDisplays();
    return;
  }

  if (field === "quantity") {
    const wholeQuantity = Math.max(1, Math.round(Number(event.currentTarget.value || 1)));
    item.quantity = String(wholeQuantity);
    event.currentTarget.value = String(wholeQuantity);
    updateSalesDraftAmountDisplays();
    return;
  }

  item[field] = event.currentTarget.value;
  updateSalesDraftAmountDisplays();
}

function syncSalesDraftFromForm(form) {
  if (!form) return;
  const paymentConditions = readSalesPaymentConditionsFromForm(form);

  state.salesDraft = {
    ...state.salesDraft,
    edit_id: form.elements.namedItem("edit_id")?.value || "",
    customer_id: form.elements.namedItem("customer_id")?.value || "",
    cnpj: form.elements.namedItem("cnpj")?.value || "",
    address: form.elements.namedItem("address")?.value || "",
    invoice_number: form.elements.namedItem("invoice_number")?.value || "",
    sale_date: form.elements.namedItem("sale_date")?.value || "",
    delivery_date: form.elements.namedItem("delivery_date")?.value || "",
    delivery_days: form.elements.namedItem("delivery_days")?.value || "",
    priority: form.elements.namedItem("priority")?.value || "media",
    payment_method: paymentConditions.find((condition) => condition.method)?.method || form.elements.namedItem("payment_method")?.value || "",
    payment_conditions: paymentConditions,
    status: form.elements.namedItem("status")?.value || "quote",
    contract_number: form.elements.namedItem("contract_number")?.value || "",
    contract_notes: form.elements.namedItem("contract_notes")?.value || "",
    production_generated: form.elements.namedItem("production_generated")?.value === "true",
  };

  const customer = (state.moduleData.customers || []).find((item) => item.id === state.salesDraft.customer_id);
  state.salesDraft.customer_name = customer?.name || state.salesDraft.customer_name || "";
  if (state.salesDraft.status === "finalized" && state.salesDraft.sale_date && state.salesDraft.delivery_days) {
    state.salesDraft.delivery_date = addDaysToIsoDate(state.salesDraft.sale_date, state.salesDraft.delivery_days);
  }
}

function readSalesPaymentConditionsFromForm(form) {
  const rows = Array.from(form.querySelectorAll("[data-sales-payment-row]"));
  if (!rows.length) return state.salesDraft.payment_conditions || [createEmptySalesPaymentCondition()];
  return rows.map((row) => createEmptySalesPaymentCondition({
    id: row.dataset.salesPaymentId || "",
    method: row.querySelector('[name="sales_payment_method"]')?.value || "",
    amount: parseCurrencyInput(row.querySelector('[name="sales_payment_amount"]')?.value || 0),
    percentage: normalizePercentInput(row.querySelector('[name="sales_payment_percentage"]')?.value || 0),
    installments: Math.max(1, Math.round(Number(row.querySelector('[name="sales_payment_installments"]')?.value || 1))),
    notes: row.querySelector('[name="sales_payment_notes"]')?.value || "",
  }));
}

function hydrateSalesContractDraft(sale) {
  const metadata = getSaleMetadata(sale);
  const paymentLabel = metadata.paymentConditions?.length
    ? getSalesPaymentConditionsLabel(metadata.paymentConditions, Math.max(0, Number(metadata.subtotal || 0) - Number(metadata.discount || 0)))
    : getPaymentMethodLabel(metadata.paymentMethod || "");
  const itemsLabel = (metadata.items || []).length
    ? metadata.items.map((item) => `${item.product_name || "-"} | Código ${item.product_code || "-"} | Qtd ${formatWholeQuantity(item.quantity || 0)} | ${formatCurrency(item.subtotal || ((Number(item.quantity || 0) * Number(item.unit_price || 0)) - Number(item.discount || 0)))}`).join("\n")
    : "Sem itens vinculados.";

  return {
    sale_id: sale.id || "",
    customer_name: sale.customer_name || "",
    cnpj: sale.cnpj || "",
    address: sale.address || "",
    invoice_number: sale.invoice_number || "",
    sale_date: sale.sale_date || "",
    delivery_date: sale.delivery_date || "",
    payment_method: paymentLabel,
    status: metadata.status || "quote",
    total_amount: metadata.total || 0,
    items_label: itemsLabel,
    contract_number: sale.contract_number || metadata.contractNumber || nextSalesDocumentNumber("contract"),
    contract_notes: metadata.notes || "",
  };
}

function resetSalesContractFormState() {
  state.openAccordionKey = null;
  state.salesContractDraft = createEmptySalesContractDraft();
}

function syncSalesContractDraftFromForm(form) {
  if (!form) return;

  state.salesContractDraft = {
    ...state.salesContractDraft,
    sale_id: form.elements.namedItem("sale_id")?.value || "",
    contract_number: form.elements.namedItem("contract_number")?.value || "",
    contract_notes: form.elements.namedItem("contract_notes")?.value || "",
  };
}

async function handleSalesContractSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  syncSalesContractDraftFromForm(form);

  if (!state.salesContractDraft.sale_id) {
    showToast("Selecione uma venda para cadastrar o contrato.", "warning");
    return;
  }

  const sale = (state.moduleData.sales || []).find((item) => item.id === state.salesContractDraft.sale_id);
  if (!sale) {
    showToast("Venda não encontrada.", "warning");
    return;
  }

  const metadata = getSaleMetadata(sale);
  const payload = {
    customer_id: sale.customer_id || null,
    customer_name: sale.customer_name,
    cnpj: sale.cnpj,
    address: sale.address,
    invoice_number: sale.invoice_number || null,
    contract_number: state.salesContractDraft.contract_number.trim() || "AUTO",
    contract_notes: state.salesContractDraft.contract_notes.trim() || metadata.notes || null,
    sale_date: sale.sale_date,
    delivery_date: sale.delivery_date,
    payment_method: metadata.paymentMethod || null,
    status: metadata.status,
    sale_items: metadata.items,
    subtotal_amount: metadata.subtotal,
    discount_amount: metadata.discount,
    total_amount: metadata.total,
    production_generated: metadata.productionGenerated,
    production_order_ids: metadata.productionOrderIds,
  };

  try {
    await persistSale(payload, sale.id);
    await loadTable("sales", "sales");
    resetSalesContractFormState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "sales",
      action: "vinculo_cliente",
      level: "Informativo",
      itemAffected: payload.contract_number || sale.id,
      description: `Contrato vinculado a venda de ${payload.customer_name}.`,
      entityType: "sale_contract",
      entityId: sale.id,
      payload,
    });
    showToast("Contrato vinculado a venda com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function hydrateSalesDraft(sale) {
  const metadata = getSaleMetadata(sale);
  const customer = (state.moduleData.customers || []).find((item) =>
    item.id === sale.customer_id || item.name === sale.customer_name
  );
  const status = metadata.status || "quote";
  const defaultQuoteDate = new Date().toISOString().slice(0, 10);
  const saleDate = sale.sale_date || (status === "quote" ? defaultQuoteDate : "");
  const deliveryDate = sale.delivery_date || (status === "quote" && saleDate ? addFrequency(saleDate, "weekly") : "");

  return {
    edit_id: sale.id || "",
    customer_id: sale.customer_id || customer?.id || "",
    customer_name: sale.customer_name || customer?.name || "",
    cnpj: sale.cnpj || "",
    address: sale.address || "",
    invoice_number: sale.invoice_number || "",
    sale_date: saleDate,
    delivery_date: deliveryDate,
    delivery_days: metadata.deliveryDays || "",
    priority: metadata.priority || "media",
    payment_method: metadata.paymentMethod || "",
    payment_conditions: metadata.paymentConditions.length
      ? metadata.paymentConditions
      : [createEmptySalesPaymentCondition({ method: metadata.paymentMethod || "", amount: metadata.total || metadata.subtotal || "" })],
    status,
    contract_number: sale.contract_number || metadata.contractNumber || "",
    contract_notes: metadata.notes || "",
    items: metadata.items.length ? metadata.items.map((item) => ({
      product_id: item.product_id || "",
      product_name: item.product_name || "",
      product_code: item.product_code || "",
      sale_option_id: item.sale_option_id || "",
      sale_option_label: item.sale_option_label || "",
      kit_structure_id: item.kit_structure_id || "",
      production_quantity: item.production_quantity || "",
      quantity: String(item.quantity ?? "1"),
      unit_price: parseCurrencyInput(item.unit_price || 0),
      discount: parseCurrencyInput(item.discount || 0),
    })) : [createEmptySalesItemDraft()],
    production_generated: metadata.productionGenerated,
    production_order_ids: metadata.productionOrderIds,
  };
}

function resetSalesFormState() {
  state.openAccordionKey = null;
  state.salesDraft = createEmptySalesDraft();
}

async function handleSalesSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  syncSalesDraftFromForm(form);

  const customer = (state.moduleData.customers || []).find((item) => item.id === state.salesDraft.customer_id);
  if (!customer) {
    showToast("Selecione um cliente valido.", "warning");
    return;
  }

  if (state.salesDraft.status === "finalized" && (!Number(state.salesDraft.delivery_days) || Number(state.salesDraft.delivery_days) <= 0)) {
    showToast("Informe o prazo de entrega em dias.", "warning");
    return;
  }

  if (!state.salesDraft.sale_date || !state.salesDraft.delivery_date) {
    showToast(state.salesDraft.status === "quote" ? "Informe data do orçamento e validade." : "Informe data da venda e entrega.", "warning");
    return;
  }

  if (new Date(`${state.salesDraft.delivery_date}T00:00:00`) < new Date(`${state.salesDraft.sale_date}T00:00:00`)) {
    showToast(state.salesDraft.status === "quote" ? "A validade não pode ser anterior à data do orçamento." : "A entrega não pode ser anterior à data da venda.", "warning");
    return;
  }

  const normalizedItems = normalizeSalesItems(state.salesDraft.items);
  if (!normalizedItems.length) {
    showToast("Adicione ao menos um item na venda.", "warning");
    return;
  }

  const baseTotals = calculateSalesTotals(normalizedItems);
  const paymentConditions = normalizeSalesPaymentConditions(state.salesDraft.payment_conditions, baseTotals.total);
  const totals = calculateSalesGrandTotals(normalizedItems, paymentConditions);
  const operationalNotes = [
    state.salesDraft.status === "finalized" && state.salesDraft.delivery_days ? `[meta:delivery_days]${state.salesDraft.delivery_days}` : "",
    `[meta:payment_conditions]${JSON.stringify(paymentConditions)}`,
    state.salesDraft.contract_notes.trim() || "",
  ].filter(Boolean).join("\n");
  const payload = {
    customer_id: customer.id,
    customer_name: customer.name,
    cnpj: state.salesDraft.cnpj || getCustomerMetadata(customer).document || "",
    address: state.salesDraft.address || getCustomerMetadata(customer).address || "",
    invoice_number: state.salesDraft.invoice_number.trim(),
    contract_number: (
      state.salesDraft.contract_number.trim()
      || null
    ) || null,
    contract_notes: operationalNotes || null,
    sale_date: state.salesDraft.sale_date,
    delivery_date: state.salesDraft.delivery_date,
    delivery_days: state.salesDraft.status === "finalized" ? state.salesDraft.delivery_days : "",
    priority: state.salesDraft.priority || "media",
    payment_method: paymentConditions[0]?.method || state.salesDraft.payment_method || null,
    status: state.salesDraft.status,
    sale_items: normalizedItems,
    subtotal_amount: totals.subtotal,
    discount_amount: totals.discount,
    total_amount: totals.total,
    production_generated: state.salesDraft.production_generated,
    production_order_ids: state.salesDraft.production_order_ids || [],
  };

  try {
    const isEditing = Boolean(state.salesDraft.edit_id);
    const savedSale = await persistSale(payload, state.salesDraft.edit_id);
    let productionResult = { generatedNow: false };
    if (shouldAskToSendSaleToProduction(savedSale, payload)) {
      const shouldSendToProduction = await confirmSendSaleToProduction();
      if (shouldSendToProduction) {
        productionResult = await ensureProductionForSale(savedSale, payload);
      }
    }
    if (productionResult.generatedNow) {
      savedSale.production_generated = true;
      savedSale.production_order_ids = productionResult.orderIds || [];
    }
    upsertModuleRecord("sales", savedSale);
    if (productionResult.generatedNow) {
      await loadTable("production_orders", "production");
    }
    resetSalesFormState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "sales",
      action: isEditing ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: savedSale.sale_number || savedSale.id,
      description: `Venda/orçamento ${isEditing ? "atualizado" : "cadastrado"} para ${payload.customer_name}.`,
      entityType: "sale",
      entityId: savedSale.id,
      payload: {
        status: payload.status,
        total_amount: payload.total_amount,
        customer_name: payload.customer_name,
        production_generated: productionResult.generatedNow || payload.production_generated,
      },
    });
    showToast(
      payload.status === "quote"
        ? "Orçamento salvo com sucesso."
        : productionResult.generatedNow
          ? "Venda salva e enviada para produção."
          : "Venda salva com sucesso.",
      "success"
    );
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function shouldAskToSendSaleToProduction(savedSale, payload) {
  const metadata = getSaleMetadata(savedSale || {});
  return (payload.status === "finalized" || metadata.status === "finalized")
    && !payload.production_generated
    && !metadata.productionGenerated
    && !(payload.production_order_ids || []).length
    && !(metadata.productionOrderIds || []).length;
}

function confirmSendSaleToProduction() {
  const existing = document.querySelector("[data-sales-production-confirm-overlay]");
  if (existing) existing.remove();

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay sales-document-modal-overlay";
    overlay.setAttribute("data-sales-production-confirm-overlay", "true");
    overlay.innerHTML = `
      <div class="modal-card sales-document-modal" role="dialog" aria-modal="true" aria-label="Enviar venda para produção">
        <div class="sales-config-header">
          <div>
            <p class="eyebrow muted">Vendas</p>
            <h3>Enviar para a Produção?</h3>
            <p class="muted">A venda foi salva como aprovada. Você pode gerar a ordem de produção agora ou deixar para enviar depois pelas ações da venda.</p>
          </div>
        </div>
        <div class="form-actions-row sales-form-actions">
          <button class="ghost-button" type="button" data-sales-production-confirm="no">Não no momento</button>
          <button class="primary-button" type="button" data-sales-production-confirm="yes">Sim</button>
        </div>
      </div>
    `;

    const close = (value) => {
      overlay.remove();
      resolve(value);
    };

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(false);
      const action = event.target?.dataset?.salesProductionConfirm;
      if (action === "yes") close(true);
      if (action === "no") close(false);
    });

    document.body.appendChild(overlay);
    overlay.querySelector('[data-sales-production-confirm="yes"]')?.focus();
  });
}

function normalizeSalesItems(items) {
  return (items || [])
    .map((item) => {
      const product = (state.moduleData.products || []).find((productItem) => productItem.id === item.product_id)
        || (state.moduleData.products || []).find((productItem) =>
          productItem.code === item.product_code
          || normalizeProductSaleOptions(productItem).some((option) => option.code === item.product_code)
        );
      const option = item.sale_option_id ? findProductSaleOption(product, item.sale_option_id) : null;
      const linkedStructure = findBomStructureForSalesItem({
        ...item,
        product_id: item.product_id || product?.id || "",
        product_name: item.product_name || product?.name || "",
        product_code: item.product_code || option?.code || product?.code || "",
        sale_option_id: item.sale_option_id || option?.id || "",
        sale_option_label: item.sale_option_label || option?.label || "",
        kit_structure_id: item.kit_structure_id || option?.kit_structure_id || "",
      });
      const bomComponents = getSalesItemBomComponents({
        ...item,
        product_id: item.product_id || product?.id || "",
        product_name: item.product_name || product?.name || "",
        product_code: item.product_code || option?.code || product?.code || "",
        sale_option_id: item.sale_option_id || option?.id || "",
        sale_option_label: item.sale_option_label || option?.label || "",
        kit_structure_id: item.kit_structure_id || option?.kit_structure_id || linkedStructure?.id || "",
      });
      const bomUnitValue = getBomStructureUnitValue(linkedStructure);
      const hasUnitPrice = item.unit_price !== "" && item.unit_price !== null && item.unit_price !== undefined;
      return {
        product_id: item.product_id || product?.id || null,
        product_name: item.product_name || product?.name || "",
        product_code: item.product_code || option?.code || product?.code || "",
        sale_option_id: item.sale_option_id || "",
        sale_option_label: item.sale_option_label || option?.label || "",
        kit_structure_id: item.kit_structure_id || option?.kit_structure_id || linkedStructure?.id || "",
        production_quantity: normalizeWholeNumber(item.production_quantity || option?.production_quantity || 0, { min: 0, fallback: 0 }),
        quantity: normalizeWholeNumber(item.quantity || 0, { min: 0, fallback: 0 }),
        unit_price: hasUnitPrice ? Number(item.unit_price || 0) : Number(option?.price || bomUnitValue || parseCurrencyInput(product?.sale_price || 0) || 0),
        discount: Number(item.discount || 0),
        bom_components: bomComponents,
      };
    })
    .filter((item) => item.product_name && item.quantity > 0)
    .map((item) => ({
      ...item,
      subtotal: item.quantity * item.unit_price - item.discount,
    }));
}

function calculateSalesTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
  const discount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  return {
    subtotal,
    discount,
    total: subtotal - discount,
  };
}

function getSalesPixDiscountPercent() {
  return normalizePercentInput(state.salesDocumentSettings?.commercial?.pix_discount_percent || 0);
}

function normalizeSalesPaymentConditions(conditions, totalBeforePaymentDiscount = 0) {
  const source = Array.isArray(conditions) && conditions.length
    ? conditions
    : [createEmptySalesPaymentCondition()];
  const prepared = source.map((condition) => {
    const method = String(condition.method || "").trim();
    const explicitAmount = parseCurrencyInput(condition.amount);
    const legacyPercentage = normalizePercentInput(condition.percentage, 0);
    const amount = explicitAmount > 0
      ? explicitAmount
      : totalBeforePaymentDiscount * (legacyPercentage / 100);
    const percentage = totalBeforePaymentDiscount > 0
      ? (amount / totalBeforePaymentDiscount) * 100
      : legacyPercentage;
    const installments = Math.max(1, Math.round(Number(condition.installments || 1)));
    return {
      id: condition.id || `payment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      method,
      percentage: Math.max(0, percentage),
      installments,
      notes: String(condition.notes || "").trim(),
      amount,
      hasManualAmount: explicitAmount > 0 || legacyPercentage > 0,
    };
  });
  const filtered = prepared.filter((condition) => condition.method || condition.amount > 0 || condition.notes);
  const automaticConditions = filtered.filter((condition) => !condition.hasManualAmount && condition.method);
  if (automaticConditions.length && totalBeforePaymentDiscount > 0) {
    const manualTotal = filtered
      .filter((condition) => condition.hasManualAmount)
      .reduce((sum, condition) => sum + Number(condition.amount || 0), 0);
    const automaticAmount = Math.max(0, totalBeforePaymentDiscount - manualTotal) / automaticConditions.length;
    automaticConditions.forEach((condition) => {
      condition.amount = automaticAmount;
      condition.percentage = totalBeforePaymentDiscount > 0
        ? (automaticAmount / totalBeforePaymentDiscount) * 100
        : 0;
    });
  }
  return filtered
    .map((condition) => {
      const method = String(condition.method || "").trim();
      const amount = parseCurrencyInput(condition.amount);
      const percentage = totalBeforePaymentDiscount > 0
        ? (amount / totalBeforePaymentDiscount) * 100
        : normalizePercentInput(condition.percentage, 0);
      const installments = Math.max(1, Math.round(Number(condition.installments || 1)));
      return {
        id: condition.id,
        method,
        percentage: Math.max(0, percentage),
        installments,
        notes: String(condition.notes || "").trim(),
        amount,
      };
    });
}

function getSalesPaymentConditionsForDisplay(conditions, totalBeforePaymentDiscount = 0) {
  const source = Array.isArray(conditions) && conditions.length
    ? conditions
    : [createEmptySalesPaymentCondition()];
  const prepared = source.map((condition) => {
    const explicitAmount = parseCurrencyInput(condition.amount);
    const legacyPercentage = normalizePercentInput(condition.percentage, 0);
    const amount = explicitAmount > 0
      ? explicitAmount
      : totalBeforePaymentDiscount * (legacyPercentage / 100);
    return {
      id: condition.id || `payment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      method: String(condition.method || "").trim(),
      percentage: totalBeforePaymentDiscount > 0 ? (amount / totalBeforePaymentDiscount) * 100 : legacyPercentage,
      installments: Math.max(1, Math.round(Number(condition.installments || 1))),
      notes: String(condition.notes || "").trim(),
      amount,
      hasManualAmount: explicitAmount > 0 || legacyPercentage > 0,
    };
  });
  const automaticConditions = prepared.filter((condition) => !condition.hasManualAmount && condition.method);
  if (automaticConditions.length && totalBeforePaymentDiscount > 0) {
    const manualTotal = prepared
      .filter((condition) => condition.hasManualAmount)
      .reduce((sum, condition) => sum + Number(condition.amount || 0), 0);
    const automaticAmount = Math.max(0, totalBeforePaymentDiscount - manualTotal) / automaticConditions.length;
    automaticConditions.forEach((condition) => {
      condition.amount = automaticAmount;
      condition.percentage = totalBeforePaymentDiscount > 0 ? (automaticAmount / totalBeforePaymentDiscount) * 100 : 0;
    });
  } else if (prepared.length === 1 && !prepared[0].hasManualAmount && totalBeforePaymentDiscount > 0) {
    prepared[0].amount = totalBeforePaymentDiscount;
    prepared[0].percentage = 100;
  }
  return prepared.map(({ hasManualAmount, ...condition }) => condition);
}

function calculateSalesPaymentAdjustment(conditions, totalBeforePaymentDiscount) {
  const pixPercent = getSalesPixDiscountPercent();
  if (!pixPercent || !totalBeforePaymentDiscount) return 0;
  return normalizeSalesPaymentConditions(conditions, totalBeforePaymentDiscount)
    .filter((condition) => condition.method === "pix")
    .reduce((sum, condition) => sum + (condition.amount * pixPercent / 100), 0);
}

function calculateSalesGrandTotals(items, conditions = []) {
  const totals = calculateSalesTotals(items);
  const paymentDiscount = calculateSalesPaymentAdjustment(conditions, totals.total);
  return {
    ...totals,
    paymentDiscount,
    discount: totals.discount + paymentDiscount,
    total: totals.total - paymentDiscount,
    itemDiscount: totals.discount,
  };
}

function getSalesPaymentConditionsLabel(conditions, totalBeforePaymentDiscount = 0) {
  const normalized = normalizeSalesPaymentConditions(conditions, totalBeforePaymentDiscount);
  if (!normalized.length) return "Conforme negociado.";
  const pixPercent = getSalesPixDiscountPercent();
  const lines = normalized.map((condition) => {
    const methodLabel = getPaymentMethodLabel(condition.method) || "Forma não informada";
    const installmentValue = condition.installments > 1 ? condition.amount / condition.installments : 0;
    const installmentLabel = condition.installments > 1
      ? ` em ${condition.installments}x de ${formatCurrency(installmentValue)}`
      : "";
    return `${formatCurrency(condition.amount)} via ${methodLabel}${installmentLabel}${condition.notes ? ` - ${condition.notes}` : ""}`;
  });
  const hasPix = normalized.some((condition) => condition.method === "pix");
  if (hasPix && pixPercent) {
    lines.push("Desconto automático Pix aplicado sobre a parte paga via Pix.");
  }
  return lines.join("\n");
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(value || 0))}%`;
}

function getSalesDraftTotals() {
  return calculateSalesGrandTotals(normalizeSalesItems(state.salesDraft.items || []), state.salesDraft.payment_conditions || []);
}

function updateSalesDraftAmountDisplays() {
  const totals = getSalesDraftTotals();

  document.querySelectorAll("[data-sales-item-subtotal]").forEach((element) => {
    const index = Number(element.dataset.salesItemSubtotal);
    const item = state.salesDraft.items[index];
    const subtotal = Number(item?.quantity || 0) * Number(item?.unit_price || 0) - Number(item?.discount || 0);
    element.textContent = formatCurrency(subtotal);
  });

  document.querySelectorAll("[data-sales-total]").forEach((element) => {
    const totalType = element.dataset.salesTotal;
    element.textContent = formatCurrency(totals[totalType] || 0);
  });

  const baseTotal = Math.max(0, Number(totals.subtotal || 0) - Number(totals.itemDiscount || 0));
  const paymentConditions = getSalesPaymentConditionsForDisplay(state.salesDraft.payment_conditions || [], baseTotal);
  document.querySelectorAll("[data-sales-payment-subtotal]").forEach((element) => {
    const condition = paymentConditions[Number(element.dataset.salesPaymentSubtotal)] || {};
    element.textContent = formatCurrency(condition.amount || 0);
  });
  document.querySelectorAll("[data-sales-payment-installment-value]").forEach((element) => {
    const condition = paymentConditions[Number(element.dataset.salesPaymentInstallmentValue)] || {};
    element.textContent = condition.installments > 1
      ? `${condition.installments}x de ${formatCurrency((condition.amount || 0) / condition.installments)}`
      : "Parcela única";
  });
}

async function persistSale(payload, editId) {
  const dbPayload = {
    customer_id: payload.customer_id || null,
    customer_name: payload.customer_name,
    cnpj: payload.cnpj,
    address: payload.address,
    invoice_number: payload.invoice_number || null,
    contract_notes: payload.contract_notes,
    sale_date: payload.sale_date,
    delivery_date: payload.delivery_date,
    priority: payload.priority || "media",
    delivery_days: payload.delivery_days || null,
    payment_method: payload.payment_method || null,
    status: payload.status,
    sale_items: payload.sale_items,
    subtotal_amount: payload.subtotal_amount,
    discount_amount: payload.discount_amount,
    total_amount: payload.total_amount,
    production_generated: payload.production_generated,
    production_order_ids: payload.production_order_ids,
  };
  if (payload.contract_number) {
    dbPayload.contract_number = payload.contract_number;
  }

  const query = editId
    ? state.supabase.from("sales").update(dbPayload).eq("id", editId).select().single()
    : state.supabase.from("sales").insert(dbPayload).select().single();
  const { data, error } = await query;

  if (!error) return data;
  if (!isSalesSchemaCompatibilityError(error)) {
    throw error;
  }

  const compatiblePayload = { ...dbPayload };
  delete compatiblePayload.priority;
  delete compatiblePayload.delivery_days;
  const compatibleQuery = editId
    ? state.supabase.from("sales").update(compatiblePayload).eq("id", editId).select().single()
    : state.supabase.from("sales").insert(compatiblePayload).select().single();
  const { data: compatibleData, error: compatibleError } = await compatibleQuery;
  if (!compatibleError) return compatibleData;
  if (!isSalesSchemaCompatibilityError(compatibleError)) {
    throw compatibleError;
  }

  const legacyPayload = {
    customer_name: payload.customer_name,
    cnpj: payload.cnpj,
    address: payload.address,
    invoice_number: payload.invoice_number || (payload.status === "quote" ? "ORCAMENTO" : ""),
    contract_notes: buildLegacySaleNotes(payload),
    sale_date: payload.sale_date,
    delivery_date: payload.delivery_date,
  };
  if (payload.contract_number && payload.contract_number !== "AUTO") {
    legacyPayload.contract_number = payload.contract_number;
  }
  const legacyQuery = editId
    ? state.supabase.from("sales").update(legacyPayload).eq("id", editId).select().single()
    : state.supabase.from("sales").insert(legacyPayload).select().single();
  const { data: legacyData, error: legacyError } = await legacyQuery;
  if (legacyError) throw legacyError;
  return legacyData;
}

function buildLegacySaleNotes(payload) {
  return [
    `[meta:status]${payload.status}`,
    payload.payment_method ? `[meta:payment]${payload.payment_method}` : "",
    payload.priority ? `[meta:priority]${payload.priority}` : "",
    payload.contract_number && payload.contract_number !== "AUTO" ? `[meta:contract_number]${payload.contract_number}` : "",
    payload.delivery_days ? `[meta:delivery_days]${payload.delivery_days}` : "",
    `[meta:subtotal]${payload.subtotal_amount}`,
    `[meta:discount]${payload.discount_amount}`,
    `[meta:total]${payload.total_amount}`,
    payload.production_generated ? `[meta:production_generated]true` : "",
    payload.production_order_ids?.length ? `[meta:production_order_ids]${JSON.stringify(payload.production_order_ids)}` : "",
    `[meta:sale_items]${JSON.stringify(payload.sale_items)}`,
    payload.contract_notes || "",
  ].filter(Boolean).join("\n");
}

function getSaleMetadata(sale) {
  const rawNotes = String(sale.contract_notes || "");
  const metadata = {
    status: sale.status || "quote",
    saleDocumentType: sale.sale_document_type || (sale.status === "finalized" ? "sale" : "quote"),
    saleSequence: Number(sale.sale_sequence || 0),
    saleYear: Number(sale.sale_year || 0),
    saleNumber: sale.sale_number || "",
    priority: sale.priority || "media",
    paymentMethod: sale.payment_method || "",
    paymentConditions: [],
    deliveryDays: sale.delivery_days || "",
    subtotal: Number(sale.subtotal_amount || 0),
    discount: Number(sale.discount_amount || 0),
    total: Number(sale.total_amount || 0),
    items: Array.isArray(sale.sale_items) ? sale.sale_items : [],
    productionGenerated: Boolean(sale.production_generated),
    productionOrderIds: Array.isArray(sale.production_order_ids) ? sale.production_order_ids : [],
    notes: rawNotes,
    contractDocumentType: sale.contract_document_type || "",
    contractSequence: Number(sale.contract_sequence || 0),
    contractYear: Number(sale.contract_year || 0),
    contractNumber: sale.contract_number || "",
  };

  rawNotes.split("\n").forEach((line) => {
    if (line.startsWith("[meta:status]") && !sale.status) metadata.status = line.replace("[meta:status]", "").trim();
    else if (line.startsWith("[meta:payment]") && !sale.payment_method) metadata.paymentMethod = line.replace("[meta:payment]", "").trim();
    else if (line.startsWith("[meta:payment_conditions]")) {
      try { metadata.paymentConditions = normalizeSalesPaymentConditions(JSON.parse(line.replace("[meta:payment_conditions]", "").trim()), metadata.total || metadata.subtotal || 0); } catch {}
    }
    else if (line.startsWith("[meta:priority]") && !sale.priority) metadata.priority = line.replace("[meta:priority]", "").trim() || "media";
    else if (line.startsWith("[meta:delivery_days]")) metadata.deliveryDays = line.replace("[meta:delivery_days]", "").trim();
    else if (line.startsWith("[meta:contract_number]") && !sale.contract_number) metadata.contractNumber = line.replace("[meta:contract_number]", "").trim();
    else if (line.startsWith("[meta:subtotal]") && !sale.subtotal_amount) metadata.subtotal = Number(line.replace("[meta:subtotal]", "").trim() || 0);
    else if (line.startsWith("[meta:discount]") && !sale.discount_amount) metadata.discount = Number(line.replace("[meta:discount]", "").trim() || 0);
    else if (line.startsWith("[meta:total]") && !sale.total_amount) metadata.total = Number(line.replace("[meta:total]", "").trim() || 0);
    else if (line.startsWith("[meta:production_generated]") && !sale.production_generated) metadata.productionGenerated = line.includes("true");
    else if (line.startsWith("[meta:production_order_ids]") && !(sale.production_order_ids?.length)) {
      try { metadata.productionOrderIds = JSON.parse(line.replace("[meta:production_order_ids]", "").trim()); } catch {}
    } else if (line.startsWith("[meta:sale_items]") && !(sale.sale_items?.length)) {
      try { metadata.items = JSON.parse(line.replace("[meta:sale_items]", "").trim()); } catch {}
    }
  });

  metadata.notes = rawNotes
    .split("\n")
    .filter((line) => !line.startsWith("[meta:"))
    .join("\n")
    .trim();

  if (!metadata.total && metadata.items.length) {
    const totals = metadata.paymentConditions.length
      ? calculateSalesGrandTotals(metadata.items, metadata.paymentConditions)
      : calculateSalesTotals(metadata.items);
    metadata.subtotal = totals.subtotal;
    metadata.discount = totals.discount;
    metadata.total = totals.total;
  }
  metadata.statusLabel = metadata.status === "finalized" ? "Venda Finalizada" : "Orçamento";
  return metadata;
}

function buildDefaultProductionOperationSteps() {
  const now = Date.now();
  return getProductionOperationStepTemplate().map((step, index) => ({
    id: `op-step-${now}-${index + 1}`,
    name: step.name,
    sequence: index + 1,
    status: index === 0 ? "pending" : "locked",
    operator: "",
    started_at: "",
    completed_at: "",
    elapsed_minutes: 0,
    estimated_minutes: step.estimated_minutes,
    notes: "",
    defects: 0,
    rework: 0,
  }));
}

function normalizeProductionOperationStepTemplate(input = []) {
  const rows = Array.isArray(input) ? input : [];
  return rows
    .map((step, index) => ({
      name: String(step?.name || "").trim() || `Etapa ${index + 1}`,
      estimated_minutes: Math.max(0, Math.round(Number(step?.estimated_minutes || 0))),
      sequence: Math.max(1, Math.round(Number(step?.sequence || index + 1))),
    }))
    .filter((step) => step.name)
    .sort((a, b) => a.sequence - b.sequence)
    .map((step, index) => ({
      name: step.name,
      estimated_minutes: step.estimated_minutes,
      sequence: index + 1,
    }));
}

function getProductionOperationStepTemplate() {
  try {
    const stored = JSON.parse(localStorage.getItem(PRODUCTION_OPERATION_CONFIG_STORAGE_KEY) || "[]");
    const normalized = normalizeProductionOperationStepTemplate(stored);
    if (normalized.length) return normalized;
  } catch {}

  return normalizeProductionOperationStepTemplate(DEFAULT_PRODUCTION_OPERATION_STEPS);
}

function saveProductionOperationSettingsCache(settings) {
  const normalized = normalizeProductionOperationStepTemplate(settings);
  if (normalized.length) {
    localStorage.setItem(PRODUCTION_OPERATION_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
  } else {
    localStorage.removeItem(PRODUCTION_OPERATION_CONFIG_STORAGE_KEY);
  }
  state.productionOperationConfigDraft = createProductionOperationConfigDraft();
}

async function loadProductionOperationSettingsFromServer() {
  if (!state.supabase || !state.accessToken) return;

  try {
    const { data, error } = await state.supabase.rpc("get_production_operation_settings", {
      p_access_token: state.accessToken,
    });
    if (error) throw error;
    if (Array.isArray(data)) {
      saveProductionOperationSettingsCache(data);
    }
  } catch (error) {
    if (isAuthenticationError(error)) {
      throw error;
    }
    console.error("production operation settings load", error);
  }
}

async function persistProductionOperationSettings(settings) {
  const normalized = normalizeProductionOperationStepTemplate(settings);
  saveProductionOperationSettingsCache(normalized);

  if (!state.supabase || !state.accessToken) return normalized;

  const { error } = await state.supabase.rpc("save_production_operation_settings", {
    p_access_token: state.accessToken,
    p_settings: normalized,
  });
  if (error) throw error;
  return normalized;
}

function createProductionOperationConfigDraft() {
  return {
    steps: getProductionOperationStepTemplate().map((step, index) => ({
      id: `config-step-${Date.now()}-${index + 1}`,
      name: step.name,
      estimated_minutes: String(step.estimated_minutes || 0),
      sequence: String(index + 1),
    })),
  };
}

function resetProductionOperationConfigDraft() {
  state.productionOperationConfigDraft = createProductionOperationConfigDraft();
}

function syncProductionOperationConfigDraftFromForm(form) {
  if (!form) return;

  state.productionOperationConfigDraft = {
    steps: Array.from(form.querySelectorAll("[data-production-config-step-row]")).map((row, index) => ({
      id: row.dataset.productionConfigStepRow || `config-step-${Date.now()}-${index + 1}`,
      name: row.querySelector('[name="operation_name"]')?.value || "",
      estimated_minutes: row.querySelector('[name="operation_minutes"]')?.value || "",
      sequence: row.querySelector('[name="operation_sequence"]')?.value || String(index + 1),
    })),
  };
}

function addProductionOperationConfigStep() {
  state.productionOperationConfigDraft.steps.push({
    id: `config-step-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: "",
    estimated_minutes: "0",
    sequence: String(state.productionOperationConfigDraft.steps.length + 1),
  });
}

function removeProductionOperationConfigStep(stepId) {
  const nextSteps = state.productionOperationConfigDraft.steps.filter((step) => step.id !== stepId);
  state.productionOperationConfigDraft.steps = (nextSteps.length ? nextSteps : [{
    id: `config-step-${Date.now()}`,
    name: "",
    estimated_minutes: "0",
    sequence: "1",
  }]).map((step, index) => ({ ...step, sequence: String(index + 1) }));
}

function restoreDefaultProductionOperationConfig() {
  localStorage.removeItem(PRODUCTION_OPERATION_CONFIG_STORAGE_KEY);
  state.productionOperationConfigDraft = createProductionOperationConfigDraft();
}

async function handleProductionOperationConfigSubmit(event) {
  event.preventDefault();

  if (!isPermissionsAdmin()) {
    showToast("Somente TI e ADMINISTRADOR podem alterar a configuração da produção.", "warning");
    return;
  }

  const form = event.currentTarget;
  syncProductionOperationConfigDraftFromForm(form);
  const normalized = normalizeProductionOperationStepTemplate(state.productionOperationConfigDraft.steps);

  if (!normalized.length) {
    showToast("Cadastre ao menos uma etapa da produção.", "warning");
    return;
  }
  if (normalized.some((step) => !step.name)) {
    showToast("Informe o nome de todas as etapas.", "warning");
    return;
  }
  if (normalized.some((step) => Number.isNaN(Number(step.estimated_minutes)))) {
    showToast("O tempo de cada etapa deve ser numérico.", "warning");
    return;
  }

  try {
    await persistProductionOperationSettings(normalized);
    state.productionOperationConfigDraft = createProductionOperationConfigDraft();
    state.openAccordionKey = null;
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "production",
      action: "configuracao_etapas",
      level: "Atenção",
      itemAffected: "Resumo da operação",
      description: "Configuração padrão das etapas da produção alterada.",
      entityType: "production_operation_config",
      entityId: "default",
      payload: { steps: normalized },
    });
    showToast("Configuração das etapas salva.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function buildProductionTimelineEntry({ type = "event", title, description = "", tone = "notified", operator = "" }) {
  return {
    id: `op-log-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    title,
    description,
    tone,
    operator: operator || getLoggedUserName("Sistema"),
    created_at: new Date().toISOString(),
  };
}

function buildProductionInitialAttachments(payload, savedSale) {
  return [
    payload.contract_number || savedSale.contract_number
      ? {
        id: `op-att-contract-${savedSale.id || Date.now()}`,
        type: "contract",
        name: `Contrato ${payload.contract_number || savedSale.contract_number}`,
        status: "Vinculado",
        created_at: new Date().toISOString(),
      }
      : null,
    {
      id: `op-att-sale-${savedSale.id || Date.now()}`,
      type: "sale",
      name: `Venda ${savedSale.sale_number || savedSale.id || "-"}`,
      status: "Vinculada",
      created_at: new Date().toISOString(),
    },
  ].filter(Boolean);
}

function buildProductionMaterialPlan(productionItems = []) {
  return productionItems.flatMap((item) => {
    const components = Array.isArray(item.bom_components) ? item.bom_components : [];
    if (!components.length) {
      return [{
        id: `plan-${item.product_id || item.product_code || item.product_name || Date.now()}`,
        code: item.product_code || "",
        name: item.productionLabel || item.product_name || "Produto",
        type: "produto",
        required_quantity: Number(item.batchSize || item.quantity || 0),
        available_quantity: 0,
        missing_quantity: 0,
        unit: "un",
        status: "planejado",
      }];
    }
    return components.map((component, index) => ({
      id: `plan-${item.product_id || item.product_code || "item"}-${component.id || component.code || index}`,
      code: component.code || "",
      name: component.name || component.component_name || "Componente",
      type: component.type || "bom",
      required_quantity: Number(component.quantity || component.quantity_required || 0) * Number(item.quantity || 1),
      available_quantity: Number(component.current_stock || 0),
      missing_quantity: Math.max((Number(component.quantity || component.quantity_required || 0) * Number(item.quantity || 1)) - Number(component.current_stock || 0), 0),
      unit: component.unit || "un",
      status: Number(component.current_stock || 0) > 0 ? "disponivel" : "verificar",
    }));
  });
}

function buildProductionInitialAlerts(productionItems = []) {
  const materialPlan = buildProductionMaterialPlan(productionItems);
  return materialPlan
    .filter((item) => Number(item.missing_quantity || 0) > 0)
    .slice(0, 8)
    .map((item) => ({
      id: `op-alert-${item.id}`,
      type: "material_shortage",
      level: "warning",
      title: "Falta de material",
      description: `${item.name}: faltam ${formatQuantity(item.missing_quantity)} ${item.unit || ""}`.trim(),
      created_at: new Date().toISOString(),
    }));
}

function showProductionNotification(message, type = "notified") {
  const toastType = type === "danger" ? "danger" : type === "warning" ? "warning" : "success";
  showToast(message, toastType);
  playNotificationSound(type);
}

function isSalesSchemaCompatibilityError(error) {
  return /column|schema cache|Could not find the .* column/i.test(String(error?.message || ""));
}

function saleStatusCell(status) {
  return `<span class="status-chip ${status === "finalized" ? "status-completed" : "status-quote"}">${status === "finalized" ? "Venda Finalizada" : "Orçamento"}</span>`;
}

function getPaymentMethodLabel(value) {
  const labels = {
    boleto: "Boleto",
    pix: "Pix",
    transferencia: "Transferência",
    cartao: "Cartão",
    dinheiro: "Dinheiro",
    cheque: "Cheque",
    negociado_com_o_dono: "Negociado",
  };
  return labels[value] || "-";
}

async function finalizeSaleRecord(sale) {
  const metadata = getSaleMetadata(sale);
  const payload = {
    customer_id: sale.customer_id || null,
    customer_name: sale.customer_name,
    cnpj: sale.cnpj,
    address: sale.address,
    invoice_number: sale.invoice_number || null,
    contract_number: sale.contract_number || metadata.contractNumber || null,
    contract_notes: metadata.notes || null,
    sale_date: sale.sale_date,
    delivery_date: sale.delivery_date,
    delivery_days: metadata.deliveryDays || sale.delivery_days || "",
    priority: metadata.priority || "media",
    payment_method: metadata.paymentMethod || null,
    status: "finalized",
    sale_items: metadata.items,
    subtotal_amount: metadata.subtotal,
    discount_amount: metadata.discount,
    total_amount: metadata.total,
    production_generated: metadata.productionGenerated,
    production_order_ids: metadata.productionOrderIds,
  };
  const saved = await persistSale(payload, sale.id);
  return ensureProductionForSale(saved, payload);
}

function buildSaleProductionPayload(sale) {
  const metadata = getSaleMetadata(sale);
  return {
    customer_id: sale.customer_id || null,
    customer_name: sale.customer_name,
    cnpj: sale.cnpj,
    address: sale.address,
    invoice_number: sale.invoice_number || null,
    contract_number: sale.contract_number || metadata.contractNumber || null,
    contract_notes: metadata.notes || null,
    sale_date: sale.sale_date,
    delivery_date: sale.delivery_date,
    delivery_days: metadata.deliveryDays || sale.delivery_days || "",
    priority: metadata.priority || "media",
    payment_method: metadata.paymentMethod || null,
    status: metadata.status || "finalized",
    sale_items: metadata.items,
    subtotal_amount: metadata.subtotal,
    discount_amount: metadata.discount,
    total_amount: metadata.total,
    production_generated: metadata.productionGenerated,
    production_order_ids: metadata.productionOrderIds,
  };
}

async function sendSaleToProduction(sale) {
  const metadata = getSaleMetadata(sale);
  if (metadata.status !== "finalized") {
    showToast("Apenas vendas aprovadas podem ser enviadas para produção.", "warning");
    return { generatedNow: false };
  }
  if (metadata.productionGenerated || (metadata.productionOrderIds || []).length) {
    showToast("Esta venda já foi enviada para produção.", "warning");
    return { generatedNow: false };
  }

  try {
    const result = await ensureProductionForSale(sale, buildSaleProductionPayload(sale));
    if (result.generatedNow) {
      upsertModuleRecord("sales", {
        ...sale,
        production_generated: true,
        production_order_ids: result.orderIds || [],
      });
    }
    if (result.generatedNow) {
      await loadTable("production_orders", "production");
    }
    renderActiveModule();
    showToast(
      result.generatedNow
        ? "Venda enviada para produção."
        : "Não foi possível gerar produção para esta venda.",
      result.generatedNow ? "success" : "warning"
    );
    return result;
  } catch (error) {
    showToast(formatError(error), "danger");
    return { generatedNow: false };
  }
}

async function ensureProductionForSale(savedSale, payload) {
  const saleMetadata = getSaleMetadata(savedSale);
  if (payload.status !== "finalized" && saleMetadata.status !== "finalized") {
    return { generatedNow: false };
  }
  if (saleMetadata.productionGenerated || (saleMetadata.productionOrderIds || []).length) {
    return { generatedNow: false };
  }

  const productionItems = (payload.sale_items || []).map((item) => {
    const linkedProduct = (state.moduleData.products || []).find((product) =>
      product.id === item.product_id || product.code === item.product_code
    );
    const optionLabel = item.sale_option_label || "";
    const productionQuantity = Number(item.production_quantity || 0);
    const batchSize = productionQuantity > 0 ? Number(item.quantity || 0) * productionQuantity : item.quantity;
    return {
      ...item,
      linkedProduct,
      optionLabel,
      productionQuantity,
      batchSize: Number(batchSize || 0),
      productionLabel: optionLabel ? `${item.product_name} - ${optionLabel}` : item.product_name,
    };
  }).filter((item) => item.product_name && item.batchSize > 0);

  if (!productionItems.length) {
    return { generatedNow: false };
  }

  const totalBatchSize = productionItems.reduce((total, item) => total + Number(item.batchSize || 0), 0);
  const primaryItem = productionItems[0] || {};
  const productSummary = productionItems
    .map((item) => `${item.productionLabel || item.product_name} (${formatWholeQuantity(item.batchSize || item.quantity || 0)})`)
    .join(" • ");
  const productionPayload = {
    order_number: generateProductionOrderNumber({ code: savedSale.sale_number || "VENDA" }),
    product_id: primaryItem.product_id || primaryItem.linkedProduct?.id || null,
    product_code: primaryItem.product_code || primaryItem.linkedProduct?.code || null,
    product_name: productionItems.length === 1 ? primaryItem.productionLabel : `Lote ${savedSale.sale_number || "Venda"} - ${productionItems.length} itens`,
    batch_size: totalBatchSize,
    priority: payload.priority || "media",
    status: "planned",
    planned_start: payload.sale_date,
    planned_end: payload.delivery_date,
    lot_number: `LOTE-${savedSale.sale_number || String(savedSale.id || Date.now()).slice(0, 8)}`,
    responsible_name: "PCP",
    delivery_days: payload.delivery_days || null,
    bom_structure_id: productionItems.length === 1 ? primaryItem.kit_structure_id || null : null,
    production_items: productionItems,
    operation_steps: buildDefaultProductionOperationSteps(),
    timeline_entries: [
      buildProductionTimelineEntry({
        type: "created",
        title: "OP gerada automaticamente",
        description: `Venda ${savedSale.sale_number || savedSale.id} agrupada em lote único com ${productionItems.length} item(ns).`,
        tone: "created",
      }),
    ],
    attachments: buildProductionInitialAttachments(payload, savedSale),
    material_plan: buildProductionMaterialPlan(productionItems),
    quality_logs: [],
    alerts: buildProductionInitialAlerts(productionItems),
    current_step_index: 0,
    produced_quantity: 0,
    defective_quantity: 0,
    rework_quantity: 0,
    estimated_minutes: getProductionOperationStepTemplate().reduce((total, step) => total + Number(step.estimated_minutes || 0), 0),
    active_operator: null,
    notes: [
      `Gerada pela Venda ${savedSale.sale_number || savedSale.id}`,
      `Itens agrupados: ${productSummary}`,
      payload.delivery_days ? `Entrega em ${payload.delivery_days} dia(s) - ${formatDate(payload.delivery_date)}` : "",
      payload.contract_number ? `Contrato ${payload.contract_number}` : "",
      stripMetadataLines(payload.contract_notes) || "",
    ].filter(Boolean).join(" | "),
    sale_id: savedSale.id,
    sale_number: savedSale.sale_number || null,
    customer_name: payload.customer_name,
    origin: "sale_finalized",
  };
  const productionOrder = await persistProductionOrder(productionPayload, null, { regenerateOrderNumberOnDuplicate: true });
  const orderIds = productionOrder?.id ? [productionOrder.id] : [];

  if (!orderIds.length) {
    return { generatedNow: false };
  }

  const updatePayload = {
    production_generated: true,
    production_order_ids: orderIds,
  };
  const { error } = await state.supabase.from("sales").update(updatePayload).eq("id", savedSale.id);
  if (error && !isSalesSchemaCompatibilityError(error)) {
    throw error;
  }
  if (error) {
    const metadataPayload = {
      customer_id: payload.customer_id,
      customer_name: payload.customer_name,
      cnpj: payload.cnpj,
      address: payload.address,
      invoice_number: payload.invoice_number,
      contract_number: savedSale.contract_number || payload.contract_number,
      contract_notes: payload.contract_notes,
      sale_date: payload.sale_date,
      delivery_date: payload.delivery_date,
      delivery_days: payload.delivery_days,
      priority: payload.priority || "media",
      payment_method: payload.payment_method,
      status: "finalized",
      sale_items: payload.sale_items,
      subtotal_amount: payload.subtotal_amount,
      discount_amount: payload.discount_amount,
      total_amount: payload.total_amount,
      production_generated: true,
      production_order_ids: orderIds,
    };
    await persistSale(metadataPayload, savedSale.id);
  }

  void queueSystemLog({
    moduleKey: "sales",
    action: "vinculo_producao",
    level: "Atenção",
    itemAffected: savedSale.sale_number || savedSale.id,
    description: `Venda finalizada vinculada a ${orderIds.length} ordem(ns) de produção.`,
    entityType: "sale",
    entityId: savedSale.id,
    payload: { order_ids: orderIds, grouped_items: productionItems.length },
  });

  return { generatedNow: true, orderIds };
}

function hydrateCustomerDraft(customer) {
  const metadata = getCustomerMetadata(customer);
  return {
    edit_id: customer.id || "",
    name: customer.name || "",
    cnpj: metadata.cnpj || "",
    cpf: metadata.cpf || "",
    state_registration: metadata.state_registration || "",
    email: metadata.email || "",
    phone: metadata.phone || "",
    contact: metadata.contact || "",
    address: metadata.address || "",
    city: metadata.city || "",
    state: metadata.state || "",
    notes: metadata.notes || "",
  };
}

function resetCustomerFormState() {
  state.openAccordionKey = null;
  state.customerDraft = createEmptyCustomerDraft();
}

function syncCustomerDraftFromForm(form) {
  if (!form) return;

  state.customerDraft = {
    edit_id: form.elements.namedItem("edit_id")?.value || "",
    name: form.elements.namedItem("name")?.value || "",
    cnpj: form.elements.namedItem("cnpj")?.value || "",
    cpf: form.elements.namedItem("cpf")?.value || "",
    state_registration: form.elements.namedItem("state_registration")?.value || "",
    email: form.elements.namedItem("email")?.value || "",
    phone: form.elements.namedItem("phone")?.value || "",
    contact: form.elements.namedItem("contact")?.value || "",
    address: form.elements.namedItem("address")?.value || "",
    city: form.elements.namedItem("city")?.value || "",
    state: form.elements.namedItem("state")?.value || "",
    notes: form.elements.namedItem("notes")?.value || "",
  };
}

async function handleCustomerSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const editId = formData.get("edit_id")?.toString();
  const submittedCnpj = formatCnpj(formData.get("cnpj")?.toString() || "");
  const submittedCpf = formatCpf(formData.get("cpf")?.toString() || "");
  const payload = {
    name: formData.get("name")?.toString().trim(),
    cnpj: submittedCnpj || submittedCpf,
    cpf: submittedCpf,
    state_registration: formData.get("state_registration")?.toString().trim(),
    email: formData.get("email")?.toString().trim(),
    phone: formatPhoneBr(formData.get("phone")?.toString() || ""),
    contact: formData.get("contact")?.toString().trim(),
    address: formData.get("address")?.toString().trim(),
    city: formData.get("city")?.toString().trim(),
    state: formData.get("state")?.toString().trim().toUpperCase(),
    notes: formData.get("notes")?.toString().trim(),
  };

  if (!payload.name) {
    showToast("O nome do cliente e obrigatório.", "warning");
    return;
  }

  if (!payload.cnpj && !payload.cpf) {
    showToast("Informe CNPJ ou CPF.", "warning");
    return;
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    showToast("Informe um email valido.", "warning");
    return;
  }

  try {
    const savedCustomer = await persistCustomer(payload, editId);
    upsertModuleRecord("customers", savedCustomer || { ...payload, id: editId || payload.cnpj || payload.cpf || payload.name });
    resetCustomerFormState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "customers",
      action: editId ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: payload.name,
      description: `Cliente ${editId ? "atualizado" : "cadastrado"} no CRM.`,
      entityType: "customer",
      entityId: editId || payload.cnpj || payload.cpf || payload.name,
      payload,
    });
    showToast(editId ? "Cliente atualizado com sucesso." : "Cliente salvo com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function persistCustomer(payload, editId) {
  const query = editId
    ? state.supabase.from("customers").update(payload).eq("id", editId).select().single()
    : state.supabase.from("customers").insert(payload).select().single();
  const { data, error } = await query;

  if (!error) return data;
  if (!isCustomerSchemaCompatibilityError(error)) {
    throw error;
  }

  const legacyPayload = {
    name: payload.name,
    cnpj: payload.cnpj || payload.cpf,
    address: buildLegacyCustomerAddress(payload),
  };
  const legacyQuery = editId
    ? state.supabase.from("customers").update(legacyPayload).eq("id", editId).select().single()
    : state.supabase.from("customers").insert(legacyPayload).select().single();
  const { data: legacyData, error: legacyError } = await legacyQuery;
  if (legacyError) throw legacyError;
  return legacyData;
}

function buildLegacyCustomerAddress(payload) {
  const metadataLines = [
    payload.cnpj ? `[meta:cnpj]${payload.cnpj}` : "",
    payload.cpf ? `[meta:cpf]${payload.cpf}` : "",
    payload.state_registration ? `[meta:state_registration]${payload.state_registration}` : "",
    payload.email ? `[meta:email]${payload.email}` : "",
    payload.phone ? `[meta:phone]${payload.phone}` : "",
    payload.contact ? `[meta:contact]${payload.contact}` : "",
    payload.city ? `[meta:city]${payload.city}` : "",
    payload.state ? `[meta:state]${payload.state}` : "",
    payload.notes ? `[meta:notes]${payload.notes}` : "",
    payload.address || "",
  ].filter(Boolean);

  return metadataLines.join("\n");
}

function getCustomerMetadata(customer) {
  const rawAddress = String(customer.address || "");
  const metadata = {
    cnpj: customer.cnpj || "",
    cpf: customer.cpf || "",
    state_registration: customer.state_registration || "",
    email: customer.email || "",
    phone: customer.phone || "",
    contact: customer.contact || "",
    address: rawAddress,
    city: customer.city || "",
    state: customer.state || "",
    notes: customer.notes || "",
  };

  const cnpjDigits = String(metadata.cnpj || "").replace(/\D/g, "");
  const cpfDigits = String(metadata.cpf || "").replace(/\D/g, "");
  if (cnpjDigits.length === 11 && !cpfDigits.length) {
    metadata.cpf = metadata.cnpj;
    metadata.cnpj = "";
  } else if (metadata.cpf && metadata.cnpj === metadata.cpf) {
    metadata.cnpj = "";
  }

  rawAddress.split("\n").forEach((line) => {
    if (line.startsWith("[meta:cnpj]") && !customer.cnpj) metadata.cnpj = line.replace("[meta:cnpj]", "").trim();
    else if (line.startsWith("[meta:cpf]") && !customer.cpf) metadata.cpf = line.replace("[meta:cpf]", "").trim();
    else if (line.startsWith("[meta:state_registration]") && !customer.state_registration) metadata.state_registration = line.replace("[meta:state_registration]", "").trim();
    else if (line.startsWith("[meta:email]") && !customer.email) metadata.email = line.replace("[meta:email]", "").trim();
    else if (line.startsWith("[meta:phone]") && !customer.phone) metadata.phone = line.replace("[meta:phone]", "").trim();
    else if (line.startsWith("[meta:contact]") && !customer.contact) metadata.contact = line.replace("[meta:contact]", "").trim();
    else if (line.startsWith("[meta:city]") && !customer.city) metadata.city = line.replace("[meta:city]", "").trim();
    else if (line.startsWith("[meta:state]") && !customer.state) metadata.state = line.replace("[meta:state]", "").trim();
    else if (line.startsWith("[meta:notes]") && !customer.notes) metadata.notes = line.replace("[meta:notes]", "").trim();
  });

  metadata.address = rawAddress
    .split("\n")
    .filter((line) => !line.startsWith("[meta:"))
    .join("\n")
    .trim();
  metadata.document = metadata.cnpj || metadata.cpf || "-";

  return metadata;
}

function isCustomerSchemaCompatibilityError(error) {
  return /column|schema cache|Could not find the .* column/i.test(String(error?.message || ""));
}

function formatCpf(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhoneBr(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function handleProductionProductSelection(event) {
  const form = document.querySelector("#production-form");
  if (!form) return;

  const product = (state.moduleData.products || []).find((item) => item.id === event.currentTarget.value);
  if (!product) return;

  const codeField = form.elements.namedItem("order_number");
  if (codeField && (!codeField.value || !state.productionDraft.edit_id)) {
    codeField.value = generateProductionOrderNumber(product);
  }

  syncProductionDraftFromForm(form);
}

function hydrateProductionDraft(order) {
  const metadata = getProductionOrderMetadata(order);
  const linkedProduct = (state.moduleData.products || []).find((item) =>
    item.id === order.product_id
      || (order.product_code && item.code === order.product_code)
      || item.name === order.product_name
  );

  return {
    edit_id: order.id || "",
    product_id: order.product_id || linkedProduct?.id || "",
    order_number: order.order_number || "",
    batch_size: String(order.batch_size ?? ""),
    priority: metadata.priority || "media",
    planned_start: order.planned_start || "",
    planned_end: order.planned_end || "",
    lot_number: metadata.lotNumber || "",
    responsible_name: metadata.responsibleName || "",
    notes: metadata.notes || "",
    status: order.status || "planned",
  };
}

function resetProductionFormState() {
  state.openAccordionKey = null;
  state.productionDraft = createEmptyProductionDraft();
}

function syncProductionDraftFromForm(form) {
  if (!form) return;

  state.productionDraft = {
    edit_id: form.elements.namedItem("edit_id")?.value || "",
    product_id: form.elements.namedItem("product_id")?.value || "",
    order_number: form.elements.namedItem("order_number")?.value || "",
    batch_size: form.elements.namedItem("batch_size")?.value || "",
    priority: form.elements.namedItem("priority")?.value || "media",
    planned_start: form.elements.namedItem("planned_start")?.value || "",
    planned_end: form.elements.namedItem("planned_end")?.value || "",
    lot_number: form.elements.namedItem("lot_number")?.value || "",
    responsible_name: form.elements.namedItem("responsible_name")?.value || "",
    notes: form.elements.namedItem("notes")?.value || "",
    status: form.elements.namedItem("status")?.value || "planned",
  };
}

async function handleProductionSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const editId = formData.get("edit_id")?.toString();
  const previousOrder = editId ? (state.moduleData.production || []).find((item) => item.id === editId) : null;
  const productId = formData.get("product_id")?.toString();
  const orderNumber = formData.get("order_number")?.toString().trim();
  const batchSize = Number(formData.get("batch_size") || 0);
  const priority = formData.get("priority")?.toString() || "media";
  const plannedStart = formData.get("planned_start")?.toString();
  const plannedEnd = formData.get("planned_end")?.toString();
  const lotNumber = formData.get("lot_number")?.toString().trim();
  const responsibleName = formData.get("responsible_name")?.toString().trim();
  const notes = formData.get("notes")?.toString().trim();
  const status = formData.get("status")?.toString() || "planned";

  const product = (state.moduleData.products || []).find((item) => item.id === productId);
  if (!product) {
    showToast("Selecione um produto valido.", "warning");
    return;
  }

  if (!batchSize || batchSize <= 0) {
    showToast("A quantidade deve ser maior que zero.", "warning");
    return;
  }

  if (!plannedStart || !plannedEnd) {
    showToast("Informe inicio e fim previstos.", "warning");
    return;
  }

  if (new Date(`${plannedEnd}T00:00:00`) < new Date(`${plannedStart}T00:00:00`)) {
    showToast("O fim previsto não pode ser anterior ao inicio.", "warning");
    return;
  }

  const payload = {
    order_number: orderNumber || generateProductionOrderNumber(product),
    product_id: product.id,
    product_code: product.code || null,
    product_name: product.name,
    batch_size: batchSize,
    priority,
    status,
    planned_start: plannedStart,
    planned_end: plannedEnd,
    lot_number: lotNumber || null,
    responsible_name: responsibleName || null,
    notes: notes || null,
  };

  try {
    const savedOrder = await persistProductionOrder(payload, editId, { regenerateOrderNumberOnDuplicate: !editId });
    upsertModuleRecord("production", savedOrder);
    if (typeof maybeGenerateServiceOrderFromCompletedProduction === "function") {
      await maybeGenerateServiceOrderFromCompletedProduction(savedOrder, product, previousOrder);
    }
    resetProductionFormState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "production",
      action: editId ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: savedOrder?.order_number || payload.order_number,
      description: `Ordem de produção ${editId ? "atualizada" : "criada"} para ${payload.product_name}.`,
      entityType: "production_order",
      entityId: savedOrder?.id || editId || savedOrder?.order_number || payload.order_number,
      payload: { ...payload, order_number: savedOrder?.order_number || payload.order_number },
    });
    showToast(editId ? "Ordem atualizada com sucesso." : "Ordem salva com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function persistProductionOrder(payload, editId, options = {}) {
  let nextPayload = { ...payload };
  const shouldRegenerateOrderNumber = !editId && options.regenerateOrderNumberOnDuplicate;

  for (let attempt = 0; attempt < PRODUCTION_ORDER_NUMBER_RETRY_LIMIT; attempt += 1) {
    try {
      return await persistProductionOrderAttempt(nextPayload, editId);
    } catch (error) {
      if (!shouldRegenerateOrderNumber || !isProductionOrderNumberDuplicateError(error) || attempt === PRODUCTION_ORDER_NUMBER_RETRY_LIMIT - 1) {
        throw error;
      }
      nextPayload = {
        ...nextPayload,
        order_number: generateProductionOrderNumber({
          code: nextPayload.product_code || nextPayload.product_name || "ERP",
        }),
      };
    }
  }

  return persistProductionOrderAttempt(nextPayload, editId);
}

async function persistProductionOrderAttempt(payload, editId) {
  const query = editId
    ? state.supabase.from("production_orders").update(payload).eq("id", editId).select().single()
    : state.supabase.from("production_orders").insert(payload).select().single();
  const { data, error } = await query;

  if (!error) return data;
  if (!isProductionSchemaCompatibilityError(error)) {
    throw error;
  }

  const compatiblePayload = { ...payload };
  delete compatiblePayload.delivery_days;
  delete compatiblePayload.production_items;
  delete compatiblePayload.operation_steps;
  delete compatiblePayload.timeline_entries;
  delete compatiblePayload.attachments;
  delete compatiblePayload.material_plan;
  delete compatiblePayload.quality_logs;
  delete compatiblePayload.alerts;
  delete compatiblePayload.current_step_index;
  delete compatiblePayload.produced_quantity;
  delete compatiblePayload.defective_quantity;
  delete compatiblePayload.rework_quantity;
  delete compatiblePayload.estimated_minutes;
  delete compatiblePayload.active_operator;
  delete compatiblePayload.started_at;
  delete compatiblePayload.paused_at;
  delete compatiblePayload.completed_at;
  const compatibleQuery = editId
    ? state.supabase.from("production_orders").update(compatiblePayload).eq("id", editId).select().single()
    : state.supabase.from("production_orders").insert(compatiblePayload).select().single();
  const { data: compatibleData, error: compatibleError } = await compatibleQuery;
  if (!compatibleError) return compatibleData;
  if (!isProductionSchemaCompatibilityError(compatibleError)) {
    throw compatibleError;
  }

  const legacyPayload = {
    order_number: payload.order_number,
    product_name: payload.product_name,
    batch_size: payload.batch_size,
    status: payload.status,
    planned_start: payload.planned_start,
    planned_end: payload.planned_end,
    notes: buildLegacyProductionNotes(payload),
  };
  const legacyQuery = editId
    ? state.supabase.from("production_orders").update(legacyPayload).eq("id", editId).select().single()
    : state.supabase.from("production_orders").insert(legacyPayload).select().single();
  const { data: legacyData, error: legacyError } = await legacyQuery;
  if (legacyError) throw legacyError;
  return legacyData;
}

function buildLegacyProductionNotes(payload) {
  const metaLines = [
    payload.priority ? `[meta:priority]${payload.priority}` : "",
    payload.lot_number ? `[meta:lot]${payload.lot_number}` : "",
    payload.responsible_name ? `[meta:responsible]${payload.responsible_name}` : "",
    payload.origin ? `[meta:origin]${payload.origin}` : "",
    payload.sale_id ? `[meta:sale_id]${payload.sale_id}` : "",
    payload.sale_number ? `[meta:sale_number]${payload.sale_number}` : "",
    payload.customer_name ? `[meta:customer_name]${payload.customer_name}` : "",
    payload.product_id ? `[meta:product_id]${payload.product_id}` : "",
    payload.product_code ? `[meta:product_code]${payload.product_code}` : "",
    payload.delivery_days ? `[meta:delivery_days]${payload.delivery_days}` : "",
    payload.bom_structure_id ? `[meta:bom_structure_id]${payload.bom_structure_id}` : "",
    payload.production_items?.length ? `[meta:production_items]${JSON.stringify(payload.production_items)}` : "",
    payload.operation_steps?.length ? `[meta:operation_steps]${JSON.stringify(payload.operation_steps)}` : "",
    payload.timeline_entries?.length ? `[meta:timeline_entries]${JSON.stringify(payload.timeline_entries)}` : "",
    payload.attachments?.length ? `[meta:attachments]${JSON.stringify(payload.attachments)}` : "",
    payload.material_plan?.length ? `[meta:material_plan]${JSON.stringify(payload.material_plan)}` : "",
    payload.quality_logs?.length ? `[meta:quality_logs]${JSON.stringify(payload.quality_logs)}` : "",
    payload.alerts?.length ? `[meta:alerts]${JSON.stringify(payload.alerts)}` : "",
    payload.current_step_index ? `[meta:current_step_index]${payload.current_step_index}` : "",
    payload.produced_quantity ? `[meta:produced_quantity]${payload.produced_quantity}` : "",
    payload.defective_quantity ? `[meta:defective_quantity]${payload.defective_quantity}` : "",
    payload.rework_quantity ? `[meta:rework_quantity]${payload.rework_quantity}` : "",
    payload.estimated_minutes ? `[meta:estimated_minutes]${payload.estimated_minutes}` : "",
    payload.active_operator ? `[meta:active_operator]${payload.active_operator}` : "",
    payload.started_at ? `[meta:started_at]${payload.started_at}` : "",
    payload.paused_at ? `[meta:paused_at]${payload.paused_at}` : "",
    payload.completed_at ? `[meta:completed_at]${payload.completed_at}` : "",
  ].filter(Boolean);

  return [...metaLines, payload.notes || ""].filter(Boolean).join("\n");
}

function findActiveBomStructureForProduct(product, preferredStructureId = "") {
  if (!product) return null;

  const activeStructures = state.moduleData.bomStructures || [];
  const preferredStructure = preferredStructureId
    ? activeStructures.find((structure) =>
      structure.id === preferredStructureId
      && structure.status === "active"
      && (
        structure.product_id === product.id
        || (structure.product_code && structure.product_code === product.code)
        || (structure.product_name && structure.product_name === product.name)
      )
    )
    : null;
  if (preferredStructure) return preferredStructure;

  return activeStructures.find((structure) =>
    structure.status === "active"
    && (
      structure.product_id === product.id
      || (structure.product_code && structure.product_code === product.code)
      || (structure.product_name && structure.product_name === product.name)
    )
  ) || null;
}

function calculateProductionBomItemQuantity(item, structure, plannedBatchSize) {
  const itemQuantity = Number(item?.quantity || 0);
  const structureBatchSize = Number(structure?.batch_size || 1);
  const normalizedStructureBatchSize = structureBatchSize > 0 ? structureBatchSize : 1;
  const multiplier = Number(plannedBatchSize || 0) / normalizedStructureBatchSize;
  return itemQuantity * multiplier;
}

function findProductForBomStructureItem(item) {
  return (state.moduleData.products || []).find((product) =>
    product.id === item.component_id
      || (item.code && product.code === item.code)
      || (item.name && product.name === item.name)
  ) || null;
}

function findMachiningPieceForRequirement(requirement) {
  return (state.moduleData.machiningPieces || []).find((piece) =>
    (requirement.product?.id && piece.finished_product_id === requirement.product.id)
    || (requirement.product_id && piece.finished_product_id === requirement.product_id)
    || (requirement.id && piece.finished_product_id === requirement.id)
    || (requirement.code && piece.code === requirement.code)
    || (requirement.name && piece.name === requirement.name)
    || (requirement.name && piece.finished_name === requirement.name)
  ) || null;
}

function createAutomatedMachiningOrder(piece, requirement, sourceOrder) {
  if (!piece || !requirement || Number(requirement.missingQuantity || 0) <= 0) {
    return false;
  }

  if ((piece.productions || []).some((order) => order.status !== "Concluída")) {
    return false;
  }

  const steps = (piece.processes || []).map((process, index) => ({
    id: `mach-step-${Date.now()}-${index + 1}`,
    name: process.name,
    machine: process.machine,
    operator: process.operator,
    estimated_minutes: Number(process.estimated_minutes || 0),
    notes: process.notes,
    sequence: index + 1,
    status: index === 0 ? "Pendente" : "Bloqueada",
    started_at: null,
    completed_at: null,
    completed_by: "",
  }));

  const operator = getLoggedUserName(sourceOrder?.responsible_name || "");
  const lotBase = sourceOrder?.lot_number || sourceOrder?.order_number || `LOT-${String(Date.now()).slice(-6)}`;
  const finishedProduct = (state.moduleData.products || []).find((product) => product.id === piece.finished_product_id);
  const nextOrder = normalizeMachiningOrderRecord({
    id: `mach-order-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    order_number: `OP-USI-${String(Date.now()).slice(-8)}`,
    quantity_planned: requirement.missingQuantity,
    lot: `${lotBase}-${String(requirement.code || piece.code || "PEC").replace(/[^A-Za-z0-9]/g, "").slice(0, 10)}`,
    operator,
    finished_name: finishedProduct?.name || piece.finished_name || piece.name,
    status: "Em Produção",
    current_step_index: 0,
    steps,
    created_at: new Date().toISOString(),
  }, piece.processes);

  const nextPieces = (state.moduleData.machiningPieces || []).map((item) => {
    if (item.id !== piece.id) return item;
    return normalizeMachiningPieceRecord({
      ...item,
      productions: [nextOrder, ...(item.productions || [])],
      updated_at: new Date().toISOString(),
    });
  });

  persistMachiningPieces(nextPieces);
  return true;
}

async function applyBomConsumptionOnProductionStart(order, product) {
  const metadata = getProductionOrderMetadata(order);
  const structure = findActiveBomStructureForProduct(product, metadata.bomStructureId);
  if (!structure) {
    return {
      structure: null,
      consumedMaterials: [],
      consumedProducts: [],
      machiningRequests: [],
      missingRequirements: [],
    };
  }

  const items = Array.isArray(structure.structure_items) ? structure.structure_items : [];
  const materialRequirements = new Map();
  const productRequirements = new Map();

  items.forEach((item) => {
    const requiredQuantity = calculateProductionBomItemQuantity(item, structure, order.batch_size);
    if (!requiredQuantity || requiredQuantity <= 0) return;

    if (item.source_type === "material") {
      const material = (state.moduleData.bomMaterials || []).find((entry) => entry.id === item.component_id);
      if (!material) return;
      const existing = materialRequirements.get(material.id) || {
        material,
        requiredQuantity: 0,
        code: material.code,
        name: material.name,
      };
      existing.requiredQuantity += requiredQuantity;
      materialRequirements.set(material.id, existing);
      return;
    }

    if (item.source_type === "product" || item.source_type === "product_option") {
      const productId = item.source_type === "product_option" ? item.source_key?.split(":")?.[1] : item.component_id;
      const linkedProduct = (state.moduleData.products || []).find((entry) => entry.id === productId);
      if (!linkedProduct) return;
      let legacySaleOptionId = "";
      if (item.source_type === "product_option") {
        const detail = String(item.source_key || "").split(":").slice(2).join(":");
        try {
          legacySaleOptionId = decodeURIComponent(detail);
        } catch {
          legacySaleOptionId = detail;
        }
      }
      const saleOptionKey = item.sale_option_id || legacySaleOptionId;
      const saleOption = saleOptionKey ? findProductSaleOption(linkedProduct, saleOptionKey) : null;
      const requirementKey = `${linkedProduct.id}:${saleOption?.id || ""}`;
      const existing = productRequirements.get(requirementKey) || {
        product: linkedProduct,
        saleOption,
        requiredQuantity: 0,
        code: saleOption?.code || linkedProduct.code,
        name: saleOption ? `${linkedProduct.name} - ${saleOption.label}` : linkedProduct.name,
      };
      existing.requiredQuantity += requiredQuantity;
      productRequirements.set(requirementKey, existing);
      return;
    }

    if (item.source_type === "structure") {
      const linkedProduct = findProductForBomStructureItem(item);
      if (!linkedProduct) return;
      const existing = productRequirements.get(linkedProduct.id) || {
        product: linkedProduct,
        saleOption: null,
        requiredQuantity: 0,
        code: linkedProduct.code,
        name: linkedProduct.name,
      };
      existing.requiredQuantity += requiredQuantity;
      productRequirements.set(linkedProduct.id, existing);
    }
  });

  const consumedMaterials = [];
  const consumedProducts = [];
  const machiningRequests = [];
  const missingRequirements = [];

  for (const requirement of materialRequirements.values()) {
    const availableQuantity = Number(requirement.material.current_stock || 0);
    const consumedQuantity = Math.min(availableQuantity, requirement.requiredQuantity);
    const missingQuantity = Math.max(requirement.requiredQuantity - consumedQuantity, 0);

    if (consumedQuantity > 0) {
      const { error } = await state.supabase
        .from("bom_materials")
        .update({
          current_stock: availableQuantity - consumedQuantity,
        })
        .eq("id", requirement.material.id);
      if (error) throw error;
      consumedMaterials.push({
        ...requirement,
        consumedQuantity,
      });
    }

    if (missingQuantity > 0) {
      const shortage = {
        ...requirement,
        missingQuantity,
      };
      missingRequirements.push(shortage);
      const piece = findMachiningPieceForRequirement(shortage);
      if (piece && createAutomatedMachiningOrder(piece, shortage, order)) {
        machiningRequests.push(shortage);
      }
    }
  }

  for (const requirement of productRequirements.values()) {
    const availableQuantity = requirement.saleOption
      ? Number(requirement.saleOption.current_stock || 0)
      : Number(requirement.product.current_stock || 0);
    const consumedQuantity = Math.min(availableQuantity, requirement.requiredQuantity);
    const missingQuantity = Math.max(requirement.requiredQuantity - consumedQuantity, 0);

    if (consumedQuantity > 0) {
      await persistProductMovement({
        product: requirement.product,
        movementPayload: {
          product_id: requirement.product.id,
          product_name: requirement.product.name,
          product_code: requirement.product.code,
          sale_option_id: requirement.saleOption?.id || null,
          sale_option_code: requirement.saleOption?.code || null,
          sale_option_label: requirement.saleOption?.label || null,
          movement_type: "exit",
          quantity: consumedQuantity,
          batch: order.lot_number || requirement.product.batch || null,
          machine_serial: requirement.product.machine_serial || null,
          notes: `Baixa automática pela produção ${order.order_number}`,
          moved_by_user_id: state.currentUser?.user_id || null,
          moved_by_name: getLoggedUserName(null),
        },
        nextStock: availableQuantity - consumedQuantity,
      });
      consumedProducts.push({
        ...requirement,
        consumedQuantity,
      });
    }

    if (missingQuantity > 0) {
      const shortage = {
        ...requirement,
        missingQuantity,
      };
      missingRequirements.push(shortage);
      const piece = findMachiningPieceForRequirement(shortage);
      if (piece && createAutomatedMachiningOrder(piece, shortage, order)) {
        machiningRequests.push(shortage);
      }
    }
  }

  return {
    structure,
    consumedMaterials,
    consumedProducts,
    machiningRequests,
    missingRequirements,
  };
}

function buildProductionStartSummary(result) {
  if (!result?.structure) {
    return "Produção iniciada sem BOM ativa vinculada.";
  }

  const parts = [];
  const consumedCount = result.consumedMaterials.length + result.consumedProducts.length;
  if (consumedCount) {
    parts.push(`${consumedCount} item(ns) baixado(s) do estoque`);
  }
  if (result.machiningRequests.length) {
    parts.push(`${result.machiningRequests.length} item(ns) enviado(s) para usinagem`);
  }
  if (result.missingRequirements.length > result.machiningRequests.length) {
    parts.push(`${result.missingRequirements.length - result.machiningRequests.length} item(ns) sem cadastro na usinagem`);
  }
  return parts.length ? `${parts.join(" • ")}.` : "Produção iniciada. Nenhum consumo foi necessario.";
}

async function applyGroupedBomConsumptionOnProductionStart(order) {
  const metadata = getProductionOrderMetadata(order);
  const items = metadata.productionItems?.length ? metadata.productionItems : [];
  if (!items.length) {
    const product = await findProductionOrderProduct(order);
    return product
      ? applyBomConsumptionOnProductionStart(order, product)
      : {
        structure: null,
        consumedMaterials: [],
        consumedProducts: [],
        machiningRequests: [],
        missingRequirements: [],
        productMissing: true,
      };
  }

  const aggregate = {
    structure: null,
    consumedMaterials: [],
    consumedProducts: [],
    machiningRequests: [],
    missingRequirements: [],
    productMissing: false,
  };

  for (const item of items) {
    const product = (state.moduleData.products || []).find((entry) =>
      entry.id === item.product_id
      || (item.product_code && entry.code === item.product_code)
      || entry.name === item.product_name
    );
    if (!product) {
      aggregate.productMissing = true;
      continue;
    }
    const result = await applyBomConsumptionOnProductionStart({
      ...order,
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      batch_size: Number(item.batchSize || item.batch_size || item.quantity || 0),
      bom_structure_id: item.kit_structure_id || metadata.bomStructureId || null,
    }, product);
    aggregate.structure = aggregate.structure || result.structure;
    aggregate.consumedMaterials.push(...result.consumedMaterials);
    aggregate.consumedProducts.push(...result.consumedProducts);
    aggregate.machiningRequests.push(...result.machiningRequests);
    aggregate.missingRequirements.push(...result.missingRequirements);
  }

  return aggregate;
}

async function handleProductionStart(orderId) {
  const order = (state.moduleData.production || []).find((item) => item.id === orderId);
  if (!order || order.status !== "planned") return;

  try {
    const metadata = getProductionOrderMetadata(order);
    const operationSteps = metadata.operationSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? "in_progress" : step.status === "locked" ? "locked" : step.status,
      started_at: index === 0 ? step.started_at || new Date().toISOString() : step.started_at || "",
      operator: index === 0 ? step.operator || getLoggedUserName(order.responsible_name || "") : step.operator || "",
    }));
    const result = await applyGroupedBomConsumptionOnProductionStart(order);
    const timelineEntries = [
      buildProductionTimelineEntry({
        type: "started",
        title: "OP iniciada",
        description: buildProductionStartSummary(result),
        tone: result.missingRequirements.length || result.productMissing ? "warning" : "approved",
      }),
      ...metadata.timelineEntries,
    ];
    const { error } = await state.supabase
      .from("production_orders")
      .update({
        status: "in_progress",
        operation_steps: operationSteps,
        timeline_entries: timelineEntries,
        started_at: order.started_at || new Date().toISOString(),
        active_operator: operationSteps[0]?.operator || getLoggedUserName(order.responsible_name || ""),
        current_step_index: 0,
      })
      .eq("id", order.id);
    if (error) throw error;

    await Promise.all([
      loadTable("production_orders", "production"),
      loadProductsTable(),
      loadInventoryMovementsTable(),
      loadBomData(),
    ]);
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "production",
      action: "mudanca_status",
      level: result.missingRequirements.length ? "Atenção" : "Informativo",
      itemAffected: order.order_number,
      description: `Ordem iniciada e alterada para em andamento.`,
      entityType: "production_order",
      entityId: order.id,
      payload: {
        status: "in_progress",
        structure_id: result.structure?.id || null,
        consumed_materials: result.consumedMaterials.length,
        consumed_products: result.consumedProducts.length,
        machining_requests: result.machiningRequests.length,
        missing_requirements: result.missingRequirements.length,
      },
    });
    showToast(
      result.productMissing ? "Produção iniciada sem produto vinculado para baixa de BOM." : buildProductionStartSummary(result),
      result.missingRequirements.length || result.productMissing ? "warning" : "success"
    );
    showProductionNotification("Nova OP iniciada no painel de produção.", result.missingRequirements.length ? "warning" : "created");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function enterProductionFocusMode(orderId) {
  if (!orderId) return;

  state.activeModule = "production";
  state.productionSelectedOrderId = orderId;
  state.productionDashboardTab = "operations";
  state.productionFocusOrderId = orderId;
  document.body.classList.add("production-focus-active");

  const fullscreenTarget = elements.moduleContainer || elements.appScreen || document.documentElement;
  if (!document.fullscreenElement && fullscreenTarget?.requestFullscreen) {
    fullscreenTarget.requestFullscreen().catch(() => {});
  }
}

function exitProductionFocusMode() {
  state.productionFocusOrderId = "";
  document.body.classList.remove("production-focus-active");
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  renderActiveModule();
}

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && state.productionFocusOrderId) {
    state.productionFocusOrderId = "";
    document.body.classList.remove("production-focus-active");
    renderActiveModule();
  }
});

function buildProductionOrderPrintHtml(order) {
  const metadata = getProductionOrderMetadata(order);
  const items = metadata.productionItems?.length
    ? metadata.productionItems
    : [{
      product_name: order.product_name,
      product_code: order.product_code || metadata.productCode,
      quantity: order.batch_size,
      batchSize: order.batch_size,
      sale_option_label: "",
    }];
  const itemRows = items.map((item) => `
    <tr>
      <td>
        <strong>${escapeHtml(item.productionLabel || item.product_name || order.product_name || "-")}</strong>
        ${item.sale_option_label ? `<div class="table-inline-copy">${escapeHtml(item.sale_option_label)}</div>` : ""}
      </td>
      <td>${escapeHtml(item.product_code || order.product_code || metadata.productCode || "-")}</td>
      <td class="is-centered">${formatWholeQuantity(item.quantity || order.batch_size || 0)}</td>
      <td class="is-centered">${formatWholeQuantity(item.batchSize || item.batch_size || order.batch_size || 0)}</td>
    </tr>
  `).join("");

  return `
    <article class="sales-document-sheet">
      <div class="sales-print-shell">
        <header class="sales-print-header">
          <div class="sales-print-company">
            <span class="sales-print-company-name">Ordem de Produção</span>
            <span>${escapeHtml(order.order_number || "-")}</span>
            <span>${escapeHtml(metadata.customerName || order.customer_name || "")}</span>
          </div>
        </header>
        <section class="sales-print-meta">
          <div class="sales-print-meta-item"><span class="sales-print-meta-label">Produto</span><strong>${escapeHtml(order.product_name || "-")}</strong></div>
          <div class="sales-print-meta-item"><span class="sales-print-meta-label">Status</span><strong>${escapeHtml(getProductionStatusLabel(order.status || "planned"))}</strong></div>
          <div class="sales-print-meta-item"><span class="sales-print-meta-label">Prioridade</span><strong>${escapeHtml(getProductionPriorityLabel(metadata.priority))}</strong></div>
          <div class="sales-print-meta-item"><span class="sales-print-meta-label">Entrega</span><strong>${escapeHtml(formatDate(order.planned_end))}</strong></div>
          <div class="sales-print-meta-item"><span class="sales-print-meta-label">Lote</span><strong>${escapeHtml(metadata.lotNumber || "-")}</strong></div>
          <div class="sales-print-meta-item"><span class="sales-print-meta-label">Responsável</span><strong>${escapeHtml(metadata.responsibleName || "-")}</strong></div>
        </section>
        <section class="sales-print-table-wrap">
          <table class="sales-document-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Código</th>
                <th>Qtd venda</th>
                <th>Qtd produção</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </section>
        ${metadata.notes ? `<section class="sales-print-block"><p><strong>Observações:</strong><br>${escapeHtmlWithLineBreaks(metadata.notes)}</p></section>` : ""}
        ${metadata.saleNumber ? `<section class="sales-print-block"><p><strong>Venda vinculada:</strong> ${escapeHtml(metadata.saleNumber)}</p></section>` : ""}
      </div>
    </article>
  `;
}

function getProductionPriorityLabel(priority) {
  return {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  }[String(priority || "media").toLowerCase()] || "Média";
}

function getProductionStatusLabel(status) {
  return {
    planned: "Planejada",
    in_progress: "Em andamento",
    paused: "Pausada",
    completed: "Concluída",
    cancelled: "Cancelada",
  }[String(status || "planned").toLowerCase()] || String(status || "-");
}

function getProductionOperationStepLabel(status) {
  return {
    locked: "Aguardando",
    pending: "Liberada",
    in_progress: "Em andamento",
    quality: "Qualidade",
    completed: "Concluída",
  }[String(status || "locked")] || "Aguardando";
}

function getProductionOperationActionLabel(status) {
  if (status === "pending") return "Iniciar";
  if (status === "in_progress") return "Enviar p/ qualidade";
  if (status === "quality") return "Concluir etapa";
  if (status === "completed") return "Concluída";
  return "Bloqueada";
}

async function handleProductionOperationAdvance(rawValue) {
  const [orderId, stepIndexValue] = String(rawValue || "").split("|");
  const stepIndex = Number(stepIndexValue);
  const order = (state.moduleData.production || []).find((item) => item.id === orderId);
  if (!order) return;

  const metadata = getProductionOrderMetadata(order);
  const steps = metadata.operationSteps.map((step) => ({ ...step }));
  const step = steps[stepIndex];
  const activeIndex = Math.max(0, steps.findIndex((entry) => ["pending", "in_progress", "quality"].includes(entry.status)));
  if (!step || stepIndex !== activeIndex || ["locked", "completed"].includes(step.status)) {
    showToast("Finalize a etapa atual antes de liberar a próxima.", "warning");
    return;
  }

  const operator = step.operator || getLoggedUserName(metadata.activeOperator || metadata.responsibleName || "");
  let notificationType = "notified";
  let timelineTitle = "";
  let timelineDescription = "";

  if (step.status === "pending") {
    step.status = "in_progress";
    step.started_at = step.started_at || new Date().toISOString();
    step.operator = operator;
    timelineTitle = "Etapa iniciada";
    timelineDescription = `${step.name} em execução por ${operator || "operador não informado"}.`;
    notificationType = "approved";
  } else if (step.status === "in_progress") {
    step.status = "quality";
    step.operator = operator;
    timelineTitle = "Etapa enviada para qualidade";
    timelineDescription = `${step.name} aguardando inspeção/validação.`;
    notificationType = "warning";
  } else if (step.status === "quality") {
    step.status = "completed";
    step.completed_at = new Date().toISOString();
    step.operator = operator;
    step.elapsed_minutes = calculateElapsedMinutes(step.started_at, step.completed_at);
    const nextStep = steps[stepIndex + 1];
    if (nextStep) {
      nextStep.status = "pending";
    }
    timelineTitle = "Etapa concluída";
    timelineDescription = nextStep ? `${step.name} concluída. Próxima etapa liberada: ${nextStep.name}.` : `${step.name} concluída. OP finalizada.`;
    notificationType = nextStep ? "completed" : "purchase_completed";
  }

  const completedSteps = steps.filter((entry) => entry.status === "completed").length;
  const isCompleted = completedSteps === steps.length;
  const nextActiveIndex = Math.max(0, steps.findIndex((entry) => ["pending", "in_progress", "quality"].includes(entry.status)));
  const productionItems = metadata.productionItems?.length ? metadata.productionItems : [];
  const producedQuantity = isCompleted
    ? Number(order.batch_size || 0)
    : Math.round((Number(order.batch_size || 0) * completedSteps) / Math.max(steps.length, 1));
  const timelineEntries = [
    buildProductionTimelineEntry({
      type: "operation",
      title: timelineTitle,
      description: timelineDescription,
      tone: notificationType,
      operator,
    }),
    ...metadata.timelineEntries,
  ].slice(0, 80);

  try {
    const updatePayload = {
      operation_steps: steps,
      timeline_entries: timelineEntries,
      current_step_index: isCompleted ? steps.length - 1 : nextActiveIndex,
      active_operator: isCompleted ? "" : (steps[nextActiveIndex]?.operator || operator || ""),
      produced_quantity: producedQuantity,
      status: isCompleted ? "completed" : "in_progress",
      completed_at: isCompleted ? new Date().toISOString() : metadata.completedAt || null,
      quality_logs: [
        ...metadata.qualityLogs,
        step.status === "completed" ? {
          id: `ql-${Date.now()}`,
          step: step.name,
          operator,
          defects: Number(step.defects || 0),
          rework: Number(step.rework || 0),
          created_at: new Date().toISOString(),
        } : null,
      ].filter(Boolean),
      production_items: productionItems,
    };
    const { error } = await state.supabase.from("production_orders").update(updatePayload).eq("id", order.id);
    if (error) throw error;
    upsertModuleRecord("production", {
      ...order,
      ...updatePayload,
    });
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "production",
      action: "mudanca_etapa",
      level: isCompleted ? "Informativo" : "Atenção",
      itemAffected: order.order_number,
      description: timelineDescription,
      entityType: "production_order",
      entityId: order.id,
      payload: { step: step.name, status: step.status },
    });
    showProductionNotification(isCompleted ? "OP finalizada com sucesso." : timelineDescription, notificationType);
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function calculateElapsedMinutes(startedAt, completedAt) {
  const started = startedAt ? new Date(startedAt) : null;
  const completed = completedAt ? new Date(completedAt) : new Date();
  if (!started || Number.isNaN(started.getTime()) || Number.isNaN(completed.getTime())) return 0;
  return Math.max(0, Math.round((completed - started) / 60000));
}

function handleProductionPrint(orderId) {
  const order = (state.moduleData.production || []).find((item) => item.id === orderId);
  if (!order) {
    showToast("Ordem de produção não encontrada.", "warning");
    return;
  }
  openPrintWindowForHtml(buildProductionOrderPrintHtml(order), `Ordem de Produção ${order.order_number || ""}`.trim());
}

function findProductionOrderProductInState(order) {
  const metadata = getProductionOrderMetadata(order);
  const productionItem = metadata.productionItems?.[0] || null;
  return (state.moduleData.products || []).find((item) =>
    item.id === (order.product_id || metadata.productId || productionItem?.product_id)
      || ((order.product_code || metadata.productCode || productionItem?.product_code) && item.code === (order.product_code || metadata.productCode || productionItem?.product_code))
      || item.name === order.product_name
      || (productionItem?.product_name && item.name === productionItem.product_name)
  ) || null;
}

async function findProductionOrderProduct(order) {
  const metadata = getProductionOrderMetadata(order);
  const productionItem = metadata.productionItems?.[0] || null;
  const localProduct = findProductionOrderProductInState(order);
  if (localProduct || !state.supabase) return localProduct;

  await loadProductsTable();
  const reloadedProduct = findProductionOrderProductInState(order);
  if (reloadedProduct) return reloadedProduct;

  let query = state.supabase.from("products").select("*").limit(1);
  const productId = order.product_id || metadata.productId || productionItem?.product_id || "";
  const productCode = order.product_code || metadata.productCode || productionItem?.product_code || "";
  if (productId) {
    query = query.eq("id", productId);
  } else if (productCode) {
    query = query.eq("code", productCode);
  } else if (order.product_name) {
    query = query.eq("name", order.product_name);
  } else {
    return findProductionOrderProductFromSale(metadata);
  }

  const { data, error } = await query;
  if (error) throw error;
  const fetchedProduct = data?.[0] || null;
  if (fetchedProduct) {
    state.moduleData.products = [fetchedProduct, ...(state.moduleData.products || []).filter((item) => item.id !== fetchedProduct.id)];
  }
  return fetchedProduct || findProductionOrderProductFromSale(metadata);
}

async function findProductionOrderProductFromSale(metadata) {
  const saleId = metadata.saleId || "";
  if (!saleId || !state.supabase) return null;

  let sale = (state.moduleData.sales || []).find((item) => item.id === saleId) || null;
  if (!sale) {
    const { data, error } = await state.supabase
      .from("sales")
      .select("id,sale_items")
      .eq("id", saleId)
      .limit(1);
    if (error) throw error;
    sale = data?.[0] || null;
  }
  const saleMetadata = sale ? getSaleMetadata(sale) : null;
  const saleItem = saleMetadata?.items?.find((item) =>
    item.product_id || item.product_code || item.product_name
  );
  if (!saleItem) return null;

  return (state.moduleData.products || []).find((product) =>
    product.id === saleItem.product_id
      || (saleItem.product_code && product.code === saleItem.product_code)
      || product.name === saleItem.product_name
  ) || null;
}

function getProductionOrderMetadata(order) {
  const rawNotes = String(order.notes || "");
  const metadata = {
    priority: order.priority || "media",
    lotNumber: order.lot_number || "",
    responsibleName: order.responsible_name || "",
    deliveryDays: order.delivery_days || "",
    bomStructureId: order.bom_structure_id || "",
    productId: order.product_id || "",
    productCode: order.product_code || "",
    saleId: order.sale_id || "",
    saleNumber: order.sale_number || "",
    customerName: order.customer_name || "",
    productionItems: Array.isArray(order.production_items) ? order.production_items : [],
    operationSteps: Array.isArray(order.operation_steps) ? order.operation_steps : [],
    timelineEntries: Array.isArray(order.timeline_entries) ? order.timeline_entries : [],
    attachments: Array.isArray(order.attachments) ? order.attachments : [],
    materialPlan: Array.isArray(order.material_plan) ? order.material_plan : [],
    qualityLogs: Array.isArray(order.quality_logs) ? order.quality_logs : [],
    alerts: Array.isArray(order.alerts) ? order.alerts : [],
    currentStepIndex: Number(order.current_step_index || 0),
    producedQuantity: Number(order.produced_quantity || 0),
    defectiveQuantity: Number(order.defective_quantity || 0),
    reworkQuantity: Number(order.rework_quantity || 0),
    estimatedMinutes: Number(order.estimated_minutes || 0),
    activeOperator: order.active_operator || "",
    startedAt: order.started_at || "",
    pausedAt: order.paused_at || "",
    completedAt: order.completed_at || "",
    notes: rawNotes,
  };

  rawNotes.split("\n").forEach((line) => {
    if (line.startsWith("[meta:priority]") && !order.priority) {
      metadata.priority = line.replace("[meta:priority]", "").trim() || "media";
    } else if (line.startsWith("[meta:lot]") && !order.lot_number) {
      metadata.lotNumber = line.replace("[meta:lot]", "").trim();
    } else if (line.startsWith("[meta:responsible]") && !order.responsible_name) {
      metadata.responsibleName = line.replace("[meta:responsible]", "").trim();
    } else if (line.startsWith("[meta:delivery_days]") && !order.delivery_days) {
      metadata.deliveryDays = line.replace("[meta:delivery_days]", "").trim();
    } else if (line.startsWith("[meta:bom_structure_id]") && !order.bom_structure_id) {
      metadata.bomStructureId = line.replace("[meta:bom_structure_id]", "").trim();
    } else if (line.startsWith("[meta:product_id]") && !metadata.productId) {
      metadata.productId = line.replace("[meta:product_id]", "").trim();
    } else if (line.startsWith("[meta:product_code]") && !metadata.productCode) {
      metadata.productCode = line.replace("[meta:product_code]", "").trim();
    } else if (line.startsWith("[meta:sale_id]") && !metadata.saleId) {
      metadata.saleId = line.replace("[meta:sale_id]", "").trim();
    } else if (line.startsWith("[meta:sale_number]") && !metadata.saleNumber) {
      metadata.saleNumber = line.replace("[meta:sale_number]", "").trim();
    } else if (line.startsWith("[meta:customer_name]") && !metadata.customerName) {
      metadata.customerName = line.replace("[meta:customer_name]", "").trim();
    } else if (line.startsWith("[meta:production_items]") && !metadata.productionItems.length) {
      try { metadata.productionItems = JSON.parse(line.replace("[meta:production_items]", "").trim()); } catch {}
    } else if (line.startsWith("[meta:operation_steps]") && !metadata.operationSteps.length) {
      try { metadata.operationSteps = JSON.parse(line.replace("[meta:operation_steps]", "").trim()); } catch {}
    } else if (line.startsWith("[meta:timeline_entries]") && !metadata.timelineEntries.length) {
      try { metadata.timelineEntries = JSON.parse(line.replace("[meta:timeline_entries]", "").trim()); } catch {}
    } else if (line.startsWith("[meta:attachments]") && !metadata.attachments.length) {
      try { metadata.attachments = JSON.parse(line.replace("[meta:attachments]", "").trim()); } catch {}
    } else if (line.startsWith("[meta:material_plan]") && !metadata.materialPlan.length) {
      try { metadata.materialPlan = JSON.parse(line.replace("[meta:material_plan]", "").trim()); } catch {}
    } else if (line.startsWith("[meta:quality_logs]") && !metadata.qualityLogs.length) {
      try { metadata.qualityLogs = JSON.parse(line.replace("[meta:quality_logs]", "").trim()); } catch {}
    } else if (line.startsWith("[meta:alerts]") && !metadata.alerts.length) {
      try { metadata.alerts = JSON.parse(line.replace("[meta:alerts]", "").trim()); } catch {}
    } else if (line.startsWith("[meta:current_step_index]") && !order.current_step_index) {
      metadata.currentStepIndex = Number(line.replace("[meta:current_step_index]", "").trim() || 0);
    } else if (line.startsWith("[meta:produced_quantity]") && !order.produced_quantity) {
      metadata.producedQuantity = Number(line.replace("[meta:produced_quantity]", "").trim() || 0);
    } else if (line.startsWith("[meta:defective_quantity]") && !order.defective_quantity) {
      metadata.defectiveQuantity = Number(line.replace("[meta:defective_quantity]", "").trim() || 0);
    } else if (line.startsWith("[meta:rework_quantity]") && !order.rework_quantity) {
      metadata.reworkQuantity = Number(line.replace("[meta:rework_quantity]", "").trim() || 0);
    } else if (line.startsWith("[meta:estimated_minutes]") && !order.estimated_minutes) {
      metadata.estimatedMinutes = Number(line.replace("[meta:estimated_minutes]", "").trim() || 0);
    } else if (line.startsWith("[meta:active_operator]") && !order.active_operator) {
      metadata.activeOperator = line.replace("[meta:active_operator]", "").trim();
    } else if (line.startsWith("[meta:started_at]") && !order.started_at) {
      metadata.startedAt = line.replace("[meta:started_at]", "").trim();
    } else if (line.startsWith("[meta:paused_at]") && !order.paused_at) {
      metadata.pausedAt = line.replace("[meta:paused_at]", "").trim();
    } else if (line.startsWith("[meta:completed_at]") && !order.completed_at) {
      metadata.completedAt = line.replace("[meta:completed_at]", "").trim();
    }
  });

  metadata.notes = rawNotes
    .split("\n")
    .filter((line) => !line.startsWith("[meta:"))
    .join("\n")
    .trim();

  if (!metadata.operationSteps.length) {
    metadata.operationSteps = buildDefaultProductionOperationSteps();
  }
  if (!metadata.estimatedMinutes) {
    metadata.estimatedMinutes = metadata.operationSteps.reduce((total, step) => total + Number(step.estimated_minutes || 0), 0);
  }
  if (!metadata.materialPlan.length && metadata.productionItems.length) {
    metadata.materialPlan = buildProductionMaterialPlan(metadata.productionItems);
  }

  return metadata;
}

function isProductionSchemaCompatibilityError(error) {
  const message = String(error?.message || "");
  return /column|schema cache|Could not find the .* column/i.test(message);
}

function isProductionOrderNumberDuplicateError(error) {
  const message = String(error?.message || "");
  const details = String(error?.details || "");
  return error?.code === "23505"
    && (
      message.includes("production_orders_order_number_key")
      || details.includes("order_number")
      || /duplicate key value violates unique constraint/i.test(message)
    );
}

function generateProductionOrderNumber(product) {
  const now = new Date();
  productionOrderNumberCounter = (productionOrderNumberCounter + 1) % 1000;
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
    String(now.getMilliseconds()).padStart(3, "0"),
  ].join("");
  const sequence = String(productionOrderNumberCounter).padStart(3, "0");
  const entropy = generateProductionOrderEntropy();
  const code = String(product?.code || "ERP").replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "ERP";
  return `OP-${code}-${stamp}-${sequence}${entropy}`;
}

function generateProductionOrderEntropy() {
  if (window.crypto?.getRandomValues) {
    const values = new Uint16Array(1);
    window.crypto.getRandomValues(values);
    return values[0].toString(36).toUpperCase().padStart(4, "0").slice(-4);
  }
  return Math.floor(Math.random() * 1679616).toString(36).toUpperCase().padStart(4, "0").slice(-4);
}

function bindProductsModuleEvents() {
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
    inventoryButton.addEventListener("click", () => {
      state.activeModule = "inventory";
      renderModuleNav();
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
    productForm.elements.namedItem("has_production_sections")?.addEventListener("change", () => {
      syncProductSectionsPanel(productForm);
    });
    productForm.querySelector("[data-product-add-section]")?.addEventListener("click", () => {
      const list = productForm.querySelector("[data-product-sections-list]");
      if (!list) return;
      list.insertAdjacentHTML("beforeend", renderProductProductionSectionRows([{ id: "", label: "" }]));
    });
    productForm.addEventListener("click", (event) => {
      const button = event.target.closest("[data-product-remove-section]");
      if (!button || !productForm.contains(button)) return;
      const row = button.closest("[data-product-section-row]");
      row?.remove();
      const list = productForm.querySelector("[data-product-sections-list]");
      if (list && !list.querySelector("[data-product-section-row]")) {
        list.innerHTML = renderProductProductionSectionRows([]);
      }
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
    button.addEventListener("click", () => {
      const product = state.moduleData.products.find((item) => item.id === button.dataset.productEditId);
      if (!product) return;

      state.productFormMode = "edit";
      state.productFormVisible = true;
      state.productMovementId = null;
      renderActiveModule();

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
          renderActiveModule();
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
        renderActiveModule();
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
    button.addEventListener("click", () => {
      state.productMovementId = state.productMovementId === button.dataset.productMoveId ? null : button.dataset.productMoveId;
      renderActiveModule();
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
}

function bindInventoryModuleEvents() {
  const createButton = document.querySelector("[data-inventory-create]");
  if (createButton) {
    createButton.addEventListener("click", () => {
      state.inventoryFormVisible = true;
      renderActiveModule();
      document.querySelector("#inventory-movement-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const cancelButton = document.querySelector("[data-inventory-cancel]");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      state.inventoryFormVisible = false;
      state.inventoryMovementProductId = "";
      state.inventoryMovementSaleOptionId = "";
      renderActiveModule();
    });
  }

  const form = document.querySelector("#inventory-movement-form");
  if (form) {
    form.querySelector("[data-inventory-product-field]")?.addEventListener("change", (event) => {
      state.inventoryMovementProductId = event.currentTarget.value;
      state.inventoryMovementSaleOptionId = "";
      renderActiveModule();
    });
    form.querySelector("[data-inventory-sale-option-field]")?.addEventListener("change", (event) => {
      state.inventoryMovementSaleOptionId = event.currentTarget.value;
    });
    form.addEventListener("submit", handleInventoryMovementSubmit);
  }
}

function bindAuditModuleEvents() {
  const form = document.querySelector("#audit-filter-form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      state.auditFilters = {
        module: formData.get("module")?.toString() || "all",
        user: formData.get("user")?.toString() || "all",
        action: formData.get("action")?.toString() || "all",
        level: formData.get("level")?.toString() || "all",
        date_from: formData.get("date_from")?.toString() || "",
        date_to: formData.get("date_to")?.toString() || "",
        search: formData.get("search")?.toString().trim() || "",
      };
      await loadAuditLogs();
      renderActiveModule();
    });
  }

  document.querySelector("[data-audit-reset]")?.addEventListener("click", async () => {
    state.auditFilters = createEmptyAuditFilters();
    await loadAuditLogs();
    renderActiveModule();
  });

  document.querySelector("[data-audit-refresh]")?.addEventListener("click", async () => {
    await loadAuditLogs();
    renderActiveModule();
    showToast("Central de logs atualizada.", "success");
  });

  document.querySelector("[data-audit-export-pdf]")?.addEventListener("click", () => {
    openPrintWindowForHtml(buildAuditExportHtml(state.moduleData.auditLogs || []), "Central de Logs");
  });

  document.querySelectorAll("[data-audit-select-log]").forEach((button) => {
    button.addEventListener("click", () => {
      state.auditSelectedLogId = button.dataset.auditSelectLog;
      renderActiveModule();
    });
  });
}

function bindReportsModuleEvents() {
  document.querySelector("#reports-filter-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.reportsFilters = {
      from: formData.get("from")?.toString() || state.reportsFilters.from,
      to: formData.get("to")?.toString() || state.reportsFilters.to,
    };
    renderActiveModule();
  });

  document.querySelector("[data-reports-refresh]")?.addEventListener("click", async () => {
    await loadAllVisibleData();
    renderActiveModule();
    showToast("Relatórios atualizados.", "success");
  });

  document.querySelector("[data-reports-export]")?.addEventListener("click", () => {
    const snapshot = buildReportsSnapshot();
    openPrintWindowForHtml(buildReportsExportHtml(snapshot), "Relatórios Gerenciais");
  });
}

function bindBomModuleEvents() {
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
      renderActiveModule();
    });
  });

  const materialCreateButton = document.querySelector("[data-bom-material-create]");
  if (materialCreateButton) {
    materialCreateButton.addEventListener("click", () => {
      const shouldOpen = !state.bomMaterialFormVisible;
      state.bomTab = "materials";
      state.bomStructureFormVisible = false;
      state.bomMaterialFormVisible = shouldOpen;
      renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#bom-material-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  const structureCreateButton = document.querySelector("[data-bom-structure-create]");
  if (structureCreateButton) {
    structureCreateButton.addEventListener("click", () => {
      const shouldOpen = !state.bomStructureFormVisible;
      state.bomTab = "structures";
      state.bomMaterialFormVisible = false;
      if (shouldOpen) {
        resetBomStructureDraft();
      }
      state.bomStructureFormVisible = shouldOpen;
      renderActiveModule();
      if (shouldOpen) {
        document.querySelector("#bom-structure-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  bindDeferredTextFilter("#bom-material-search", (value) => {
    state.bomMaterialSearch = value;
  });
  bindDeferredTextFilter("#bom-structure-search", (value) => {
    state.bomStructureSearch = value;
  });

  const materialForm = document.querySelector("#bom-material-form");
  if (materialForm) {
    materialForm.addEventListener("submit", handleBomMaterialSubmit);
  }

  const materialCancel = document.querySelector("[data-bom-material-cancel]");
  if (materialCancel && materialForm) {
    materialCancel.addEventListener("click", () => {
      materialForm?.reset();
      const editField = materialForm.elements.namedItem("edit_id");
      if (editField) editField.value = "";
      state.bomMaterialFormVisible = false;
      renderActiveModule();
    });
  }

  const structureForm = document.querySelector("#bom-structure-form");
  if (structureForm) {
    structureForm.addEventListener("submit", handleBomStructureSubmit);
  }

  document.querySelectorAll("[data-bom-structure-field]").forEach((field) => {
    field.addEventListener("input", handleBomStructureDraftFieldChange);
    field.addEventListener("change", handleBomStructureDraftFieldChange);
  });

  const structureCancel = document.querySelector("[data-bom-structure-cancel]");
  if (structureCancel && structureForm) {
    structureCancel.addEventListener("click", () => {
      structureForm?.reset();
      resetBomStructureDraft();
      state.bomStructureFormVisible = false;
      renderActiveModule();
    });
  }

  const addItemButton = document.querySelector("[data-bom-add-item]");
  if (addItemButton) {
    addItemButton.addEventListener("click", () => {
      state.bomDraftItems.push(createEmptyBomDraftItem());
      renderActiveModule();
    });
  }

  document.querySelectorAll("[data-bom-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      state.bomDraftItems.splice(Number(button.dataset.bomRemoveItem), 1);
      if (!state.bomDraftItems.length) {
        resetBomDraftItems();
      }
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-bom-item-field]").forEach((field) => {
    field.addEventListener("input", handleBomDraftItemFieldChange);
    field.addEventListener("change", handleBomDraftItemFieldChange);
  });

  const fileInput = document.querySelector("#bom-file-upload");
  if (fileInput) {
    fileInput.addEventListener("change", handleBomFileSelection);
  }

  document.querySelectorAll("[data-bom-remove-file]").forEach((button) => {
    button.addEventListener("click", () => {
      removeBomAttachmentAt(Number(button.dataset.bomRemoveFile));
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-bom-structure-edit-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const structure = state.moduleData.bomStructures.find((item) => item.id === button.dataset.bomStructureEditId);
      if (!structure) return;
      hydrateBomDraftFromStructure(structure);
      state.bomTab = "structures";
      state.bomMaterialFormVisible = false;
      state.bomStructureFormVisible = true;
      renderActiveModule();
      document.querySelector("#bom-structure-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function handleBomDraftItemFieldChange(event) {
  const index = Number(event.currentTarget.dataset.bomItemIndex);
  const field = event.currentTarget.dataset.bomItemField;
  if (!state.bomDraftItems[index]) return;

  const refreshBomDraftItemTotal = () => {
    const totalField = document.querySelector(`[data-bom-item-total="${index}"]`);
    if (!totalField) return;
    totalField.value = formatCurrency(getBomDraftItemComputed(state.bomDraftItems[index]).totalCost);
  };

  if (field === "quantity") {
    if (event.type === "input") {
      state.bomDraftItems[index].quantity = event.currentTarget.value;
      refreshBomDraftItemTotal();
      return;
    }
    const wholeQuantity = Math.max(1, Math.round(Number(event.currentTarget.value || 1)));
    state.bomDraftItems[index].quantity = String(wholeQuantity);
    event.currentTarget.value = String(wholeQuantity);
    refreshBomDraftItemTotal();
    return;
  }

  if (field === "unitCost") {
    state.bomDraftItems[index].unitCost = event.currentTarget.value;
    refreshBomDraftItemTotal();
    return;
  }

  state.bomDraftItems[index][field] = event.currentTarget.value;
  if (field === "sourceKey") {
    state.bomDraftItems[index].saleOptionId = "";
    const component = getBomComponentByKey(state.bomDraftItems[index].sourceKey, "");
    state.bomDraftItems[index].unitCost = component ? String(Number(component.unitCost || 0)) : "";
  }
  if (field === "saleOptionId") {
    const component = getBomComponentByKey(state.bomDraftItems[index].sourceKey, state.bomDraftItems[index].saleOptionId);
    state.bomDraftItems[index].unitCost = component ? String(Number(component.unitCost || 0)) : "";
  }
  renderActiveModule();
}

function handleBomStructureDraftFieldChange(event) {
  const field = event.currentTarget.dataset.bomStructureField;
  state.bomStructureDraft[field] = event.currentTarget.value;
  if (field === "product_id") {
    const product = state.moduleData.products.find((item) => item.id === event.currentTarget.value);
    state.bomStructureDraft.product_code = product?.code || "";
    state.bomStructureDraft.product_name = product?.name || "";
    state.bomStructureDraft.sale_option_id = "";
    state.bomStructureDraft.sale_option_code = "";
    state.bomStructureDraft.sale_option_label = "";
    state.bomStructureDraft.name = product?.name || "";
    state.bomDraftItems = state.bomDraftItems.map((item) => ({ ...item, productionSectionId: "" }));
    renderActiveModule();
  }
  if (field === "sale_option_id") {
    const product = state.moduleData.products.find((item) => item.id === state.bomStructureDraft.product_id);
    const option = findProductSaleOption(product, event.currentTarget.value);
    state.bomStructureDraft.sale_option_code = option?.code || "";
    state.bomStructureDraft.sale_option_label = option?.label || "";
    state.bomStructureDraft.name = option ? `${product?.name || ""} - ${option.label}` : product?.name || "";
    renderActiveModule();
  }
}

async function handleBomMaterialSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const editId = payload.edit_id;
  delete payload.edit_id;
  payload.unit_cost = getCurrencyInputNumber(form, "unit_cost");
  payload.current_stock = normalizeWholeNumber(payload.current_stock || 0, { min: 0, fallback: 0 });
  payload.minimum_stock = normalizeWholeNumber(payload.minimum_stock || 0, { min: 0, fallback: 0 });
  payload.description = payload.description || null;
  payload.supplier = payload.supplier || null;
  payload.category = normalizeCategoryInput(payload.category, "geral");

  try {
    const query = editId
      ? state.supabase.from("bom_materials").update(payload).eq("id", editId)
      : state.supabase.from("bom_materials").insert(payload);
    const { error } = await query;
    if (error) throw error;
    form?.reset();
    const editField = form.elements.namedItem("edit_id");
    if (editField) editField.value = "";
    await loadBomData();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "bom",
      action: editId ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: payload.name,
      description: `Peça/material ${editId ? "atualizado" : "cadastrado"} no BOM.`,
      entityType: "bom_material",
      entityId: editId || payload.code,
      payload,
    });
    showToast(editId ? "Peça/material atualizado com sucesso." : "Peça/material salvo com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleBomStructureSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = {
    ...state.bomStructureDraft,
    ...Object.fromEntries(formData.entries()),
  };
  const selectedProduct = state.moduleData.products.find((item) => item.id === payload.product_id);
  const productionSections = getProductProductionSections(selectedProduct);
  const normalizedItems = state.bomDraftItems
    .map((item) => {
      const computed = getBomDraftItemComputed(item);
      if (!computed.component) return null;
      const selectedSection = productionSections.find((section) => section.id === item.productionSectionId) || null;
      return {
        source_key: item.sourceKey,
        source_type: computed.component.type,
        component_id: computed.component.id,
        code: computed.component.code,
        name: computed.component.name,
        unit: computed.component.unit,
        sale_option_id: computed.component.saleOption?.id || "",
        sale_option_code: computed.component.saleOption?.code || "",
        sale_option_label: computed.component.saleOption?.label || "",
        production_quantity: computed.component.saleOption?.production_quantity || "",
        kit_structure_id: computed.component.saleOption?.kit_structure_id || "",
        production_section_id: selectedSection?.id || "",
        production_section_label: selectedSection?.label || "",
        quantity: computed.quantity,
        unit_cost: computed.unitCost,
        total_cost: computed.totalCost,
      };
    })
    .filter(Boolean)
    .filter((item) => item.quantity > 0);

  if (!normalizedItems.length) {
    showToast("Adicione ao menos uma peça ao conjunto.", "warning");
    return;
  }

  if (!payload.product_id) {
    showToast("Selecione um produto final.", "warning");
    return;
  }

  if (!selectedProduct) {
    showToast("Produto final não encontrado.", "danger");
    return;
  }
  const selectedSaleOption = payload.sale_option_id ? findProductSaleOption(selectedProduct, payload.sale_option_id) : null;
  if (payload.sale_option_id && !selectedSaleOption) {
    showToast("Variação do produto final não encontrada.", "danger");
    return;
  }

  const editId = payload.edit_id;
  delete payload.edit_id;
  payload.code = selectedSaleOption?.code || selectedProduct.code || "";
  payload.name = selectedSaleOption ? `${selectedProduct.name} - ${selectedSaleOption.label}` : selectedProduct.name || "";
  payload.product_code = selectedProduct.code || "";
  payload.product_name = selectedProduct.name || "";
  payload.category = normalizeCategoryInput(payload.category, "geral");
  payload.sale_option_id = selectedSaleOption?.id || "";
  payload.sale_option_code = selectedSaleOption?.code || "";
  payload.sale_option_label = selectedSaleOption?.label || "";
  payload.batch_size = normalizeWholeNumber(payload.batch_size || 0, { min: 1, fallback: 1 });
  payload.height = normalizeWholeNumber(payload.height || 0, { min: 0, fallback: 0 });
  payload.width = normalizeWholeNumber(payload.width || 0, { min: 0, fallback: 0 });
  payload.length = normalizeWholeNumber(payload.length || 0, { min: 0, fallback: 0 });
  payload.weight = normalizeWholeNumber(payload.weight || 0, { min: 0, fallback: 0 });
  payload.total_cost = calculateBomDraftTotal();
  payload.instructions = payload.instructions || null;
  payload.notes = payload.notes || null;
  payload.attachments = normalizeBomAttachmentsForSave();
  payload.structure_items = normalizedItems;
  state.bomStructureDraft = {
    ...state.bomStructureDraft,
    ...payload,
    edit_id: editId || "",
  };

  try {
    const query = editId
      ? state.supabase.from("bom_structures").update(payload).eq("id", editId)
      : state.supabase.from("bom_structures").insert(payload);
    const { error } = await query;
    if (error) throw error;
    form?.reset();
    resetBomStructureDraft();
    await loadBomData();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "bom",
      action: editId ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: payload.name,
      description: `Conjunto BOM ${editId ? "atualizado" : "criado"} para o produto ${payload.product_name}.`,
      entityType: "bom_structure",
      entityId: editId || payload.code,
      payload: { ...payload, item_count: normalizedItems.length },
    });
    showToast(editId ? "Conjunto BOM atualizado com sucesso." : "Conjunto BOM salvo com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function resetBomDraftItems() {
  state.bomDraftItems = [createEmptyBomDraftItem()];
}

function handleBomFileSelection(event) {
  const files = Array.from(event.currentTarget.files || []);
  const nextFiles = files.map((file) => ({
    name: file.name,
    type: file.type || "",
    size: file.size || 0,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    persisted: false,
  }));
  state.bomAttachmentDrafts = [...state.bomAttachmentDrafts, ...nextFiles];
  event.currentTarget.value = "";
  renderActiveModule();
}

function removeBomAttachmentAt(index) {
  const file = state.bomAttachmentDrafts[index];
  if (file?.previewUrl) {
    URL.revokeObjectURL(file.previewUrl);
  }
  state.bomAttachmentDrafts.splice(index, 1);
}

async function handleInventoryMovementSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const productId = formData.get("product_id")?.toString();
  const saleOptionId = formData.get("sale_option_id")?.toString() || "";
  const movementType = formData.get("movement_type")?.toString();
  const quantity = normalizeWholeNumber(formData.get("quantity") || 0, { min: 0, fallback: 0 });
  const machineSerial = formData.get("machine_serial")?.toString().trim();
  const notes = formData.get("notes")?.toString().trim();

  if (!productId) {
    showToast("Selecione um produto.", "warning");
    return;
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    showToast("Informe uma quantidade válida.", "warning");
    return;
  }

  if ((movementType === "entry" || movementType === "exit") && quantity === 0) {
    showToast("Entrada e saída exigem quantidade maior que zero.", "warning");
    return;
  }

  const product = state.moduleData.products.find((item) => item.id === productId);
  if (!product) {
    showToast("Produto não encontrado.", "danger");
    return;
  }

  if (getProductType(product) === "finished_product" && !machineSerial) {
    showToast("Número de serie e obrigatório para produtos acabados.", "warning");
    return;
  }

  const saleOption = saleOptionId ? findProductSaleOption(product, saleOptionId) : null;
  if (saleOptionId && !saleOption) {
    showToast("Variação do produto não encontrada.", "danger");
    return;
  }

  const currentStock = saleOption ? Number(saleOption.current_stock || 0) : Number(product.current_stock || 0);
  let nextStock = currentStock;

  if (movementType === "entry") {
    nextStock = currentStock + quantity;
  } else if (movementType === "exit") {
    nextStock = currentStock - quantity;
  } else if (movementType === "adjustment") {
    nextStock = quantity;
  }

  if (nextStock < 0) {
    showToast("Não e permitido deixar o estoque negativo.", "warning");
    return;
  }

  const movementPayload = {
    product_id: product.id,
    product_name: product.name,
    product_code: product.code,
    sale_option_id: saleOption?.id || null,
    sale_option_code: saleOption?.code || null,
    sale_option_label: saleOption?.label || null,
    movement_type: movementType,
    quantity,
    batch: product.batch || null,
    machine_serial: machineSerial || product.machine_serial || null,
    notes: notes || null,
    moved_by_user_id: state.currentUser?.user_id || null,
    moved_by_name: getLoggedUserName(null),
  };

  try {
    await persistProductMovement({ product, movementPayload, nextStock });

    state.inventoryFormVisible = false;
    state.inventoryMovementProductId = "";
    state.inventoryMovementSaleOptionId = "";
    form?.reset();
    await Promise.all([loadInventoryMovementsTable(), loadProductsTable()]);
    renderActiveModule();
    showToast("Movimentação registrada com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleProductSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.submitting === "true") {
    return;
  }
  form.dataset.submitting = "true";
  const submitButton = form.querySelector('button[type="submit"]');
  const previousSubmitLabel = submitButton?.textContent || "";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Salvando...";
  }
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const editId = payload.edit_id;
  const photoFile = form.elements.namedItem("product_photo_file")?.files?.[0] || null;
  delete payload.edit_id;
  delete payload.product_photo_file;
  payload.sale_options = readProductSaleOptionsFromForm(form);
  payload.has_production_sections = payload.has_production_sections === "true";
  payload.production_sections = payload.has_production_sections ? readProductProductionSectionsFromForm(form) : [];
  [
    "sale_option_code",
    "sale_option_label",
    "sale_option_price",
    "sale_option_production_quantity",
    "sale_option_current_stock",
    "sale_option_minimum_stock",
    "sale_option_kit_structure_id",
    "sale_options_text",
    "production_section_id",
    "production_section_label",
  ].forEach((key) => delete payload[key]);

  payload.minimum_stock = normalizeWholeNumber(payload.minimum_stock || 0, { min: 0, fallback: 0 });
  payload.current_stock = normalizeWholeNumber(payload.current_stock || 0, { min: 0, fallback: 0 });
  payload.cost_price = getCurrencyInputNumber(form, "cost_price");
  payload.sale_price = getCurrencyInputNumber(form, "sale_price");
  payload.available_for_sale = payload.available_for_sale !== "false";
  payload.category = normalizeCategoryInput(payload.category, "general_products");
  payload.product_type = normalizeProductTypeInput(payload.product_type || payload.category);

  if (photoFile) {
    const preparedPhoto = form.elements.namedItem("photo_data_url")?.value || "";
    if (preparedPhoto) {
      payload.photo_data_url = preparedPhoto;
    } else {
      try {
        const processedPhoto = await resizeProductImageFile(photoFile);
        payload.photo_data_url = processedPhoto.dataUrl;
      } catch (error) {
        showToast(formatError(error), "warning");
        form.dataset.submitting = "false";
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = previousSubmitLabel || "Salvar";
        }
        return;
      }
    }
  }

  ["supplier", "batch", "machine_serial", "expiration_date", "location", "description", "photo_data_url"].forEach((key) => {
    if (!payload[key]) {
      payload[key] = null;
    }
  });

  try {
    const { error } = await persistProductPayload(payload, editId);
    if (error) throw error;

    resetProductModuleState();
    await loadTable("products", "products");
    const bomSyncResult = editId ? await syncBomStructuresForProductChange(editId) : { updatedCount: 0 };
    if (bomSyncResult.updatedCount) {
      await loadBomData();
    }
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "products",
      action: editId ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: payload.name,
      description: `Produto ${editId ? "atualizado" : "cadastrado"} com código ${payload.code}.`,
      entityType: "product",
      entityId: editId || payload.code,
      payload: {
        ...payload,
        affected_bom_structures: bomSyncResult.updatedCount,
      },
    });
    showToast(
      editId
        ? bomSyncResult.updatedCount
          ? `Produto atualizado e ${bomSyncResult.updatedCount} conjunto(s) recalculado(s).`
          : "Produto atualizado com sucesso."
        : "Produto salvo com sucesso.",
      "success"
    );
  } catch (error) {
    showToast(formatError(error), "danger");
  } finally {
    form.dataset.submitting = "false";
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = previousSubmitLabel || "Salvar";
    }
  }
}

async function persistProductPayload(payload, editId) {
  const query = editId
    ? state.supabase.from("products").update(payload).eq("id", editId)
    : state.supabase.from("products").insert(payload);
  const result = await query;
  if (!result.error || !isProductSchemaCompatibilityError(result.error)) {
    return result;
  }

  const legacyPayload = { ...payload };
  delete legacyPayload.available_for_sale;
  delete legacyPayload.has_production_sections;
  delete legacyPayload.production_sections;
  delete legacyPayload.product_type;
  const legacyQuery = editId
    ? state.supabase.from("products").update(legacyPayload).eq("id", editId)
    : state.supabase.from("products").insert(legacyPayload);
  return legacyQuery;
}

function isProductSchemaCompatibilityError(error) {
  return /column|schema cache|Could not find the .* column/i.test(String(error?.message || ""));
}

async function handleProductMovementSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const productId = formData.get("product_id")?.toString();
  const saleOptionId = formData.get("sale_option_id")?.toString() || "";
  const movementType = formData.get("movement_type")?.toString();
  const movementQuantity = normalizeWholeNumber(formData.get("movement_quantity") || 0, { min: 1, fallback: 0 });

  if (!movementQuantity || movementQuantity <= 0) {
    showToast("Informe uma quantidade válida para movimentar.", "warning");
    return;
  }

  const product = state.moduleData.products.find((item) => item.id === productId);
  if (!product) {
    showToast("Produto não encontrado.", "danger");
    return;
  }

  const saleOption = saleOptionId ? findProductSaleOption(product, saleOptionId) : null;
  if (saleOptionId && !saleOption) {
    showToast("Variação do produto não encontrada.", "danger");
    return;
  }

  const currentStock = saleOption ? Number(saleOption.current_stock || 0) : Number(product.current_stock || 0);
  const nextStock = movementType === "entry" ? currentStock + movementQuantity : currentStock - movementQuantity;

  if (nextStock < 0) {
    showToast("A saída não pode deixar o estoque negativo.", "warning");
    return;
  }

  try {
    await persistProductMovement({
      product,
      movementPayload: {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        sale_option_id: saleOption?.id || null,
        sale_option_code: saleOption?.code || null,
        sale_option_label: saleOption?.label || null,
        movement_type: movementType,
        quantity: movementQuantity,
        batch: product.batch || null,
        machine_serial: product.machine_serial || null,
        notes: null,
        moved_by_user_id: state.currentUser?.user_id || null,
        moved_by_name: getLoggedUserName(null),
      },
      nextStock,
    });

    state.productMovementId = null;
    form?.reset();
    await Promise.all([loadProductsTable(), loadInventoryMovementsTable()]);
    renderActiveModule();
    showToast("Estoque atualizado com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function populateForm(form, record) {
  const normalizedRecord = form?.id === "products-form"
    ? {
        ...record,
        category: formatCategoryLabel(getProductCategory(record)),
        product_type: getProductType(record),
      }
    : record;

  Object.entries(normalizedRecord).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value ?? "";
    }
  });

  const variationsList = form.querySelector("[data-product-variations-list]");
  if (variationsList) {
    variationsList.innerHTML = renderProductSaleVariationRows(normalizedRecord.sale_options || [], normalizedRecord);
    bindCurrencyInputs(variationsList);
  }

  const hasSectionsField = form.elements.namedItem("has_production_sections");
  if (hasSectionsField) {
    hasSectionsField.value = normalizedRecord.has_production_sections ? "true" : "false";
  }
  syncProductSectionsPanel(form, normalizedRecord.production_sections || []);

  const photoPreview = form.querySelector("[data-product-photo-preview]");
  if (photoPreview) {
    photoPreview.innerHTML = normalizedRecord.photo_data_url
      ? `<img src="${normalizedRecord.photo_data_url}" alt="Foto do produto" />`
      : `<span class="muted">Nenhuma foto cadastrada</span>`;
  }
}

function syncProductSectionsPanel(form, sections = null) {
  if (!form) return;
  const hasSections = form.elements.namedItem("has_production_sections")?.value === "true";
  const panel = form.querySelector("[data-product-sections-panel]");
  const list = form.querySelector("[data-product-sections-list]");
  panel?.classList.toggle("hidden", !hasSections);
  if (!list) return;
  if (sections !== null) {
    list.innerHTML = renderProductProductionSectionRows(hasSections ? sections : []);
  } else if (hasSections && !list.querySelector("[data-product-section-row]")) {
    list.innerHTML = renderProductProductionSectionRows([]);
  }
}

async function persistProductMovement({ product, movementPayload, nextStock }) {
  const movementUnitCost = parseCurrencyInput(movementPayload.unit_cost || 0);
  const dbMovementPayload = { ...movementPayload };
  delete dbMovementPayload.unit_cost;
  const { error: movementError } = await state.supabase.from("inventory_movements").insert(dbMovementPayload);
  if (movementError) throw movementError;

  const saleOptionId = movementPayload.sale_option_id || "";
  const nextSaleOptions = saleOptionId ? updateProductSaleOptionStock(product, saleOptionId, nextStock) : null;
  const productUpdate = {
    last_moved_by_user_id: state.currentUser?.user_id || null,
    last_moved_by_name: getLoggedUserName(null),
    last_movement_at: new Date().toISOString(),
  };
  if (movementPayload.movement_type === "entry" && movementUnitCost > 0) {
    productUpdate.cost_price = movementUnitCost;
  }
  if (nextSaleOptions) {
    productUpdate.sale_options = nextSaleOptions;
  } else {
    productUpdate.current_stock = nextStock;
  }

  const { error: productError } = await state.supabase
    .from("products")
    .update(productUpdate)
    .eq("id", product.id);
  if (productError) throw productError;

  const itemLabel = movementPayload.sale_option_label ? `${product.name} - ${movementPayload.sale_option_label}` : product.name;
  void queueSystemLog({
    moduleKey: "inventory",
    action: "movimentacao_estoque",
    level: movementPayload.movement_type === "exit" ? "Atenção" : "Informativo",
    itemAffected: itemLabel,
    description: `Movimentação ${movementPayload.movement_type} de ${formatQuantity(movementPayload.quantity)} para ${itemLabel}.`,
    entityType: "product",
    entityId: product.id,
    payload: { movement: movementPayload, next_stock: nextStock },
  });
}

function resetProductForm(form) {
  if (!form) return;
  form?.reset();
  const editField = form.elements.namedItem("edit_id");
  if (editField) {
    editField.value = "";
  }
  const photoPreview = form.querySelector("[data-product-photo-preview]");
  if (photoPreview) {
    photoPreview.innerHTML = `<span class="muted">Nenhuma foto cadastrada</span>`;
  }
  const hasSectionsField = form.elements.namedItem("has_production_sections");
  if (hasSectionsField) {
    hasSectionsField.value = "false";
  }
  syncProductSectionsPanel(form, []);
}

function resetProductModuleState() {
  state.productSearch = "";
  state.productCategoryFilter = "all";
  state.productFormVisible = false;
  state.productFormMode = "create";
  state.productMovementId = null;
}

function bindDeleteActions() {
  document.querySelectorAll("[data-delete-table]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const tableName = button.dataset.deleteTable;
        const recordId = button.dataset.deleteId;
        const { error } = await state.supabase.from(tableName).delete().eq("id", recordId);
        if (error) throw error;
        await loadAllVisibleData();
        renderActiveModule();
        void queueSystemLog({
          moduleKey: tableName === "bom_materials" || tableName === "bom_structures" ? "bom" : state.activeModule,
          action: "exclusao",
          level: "Critico",
          itemAffected: `${tableName}:${recordId}`,
          description: `Registro removido da tabela ${tableName}.`,
          entityType: tableName,
          entityId: recordId,
        });
        showToast("Registro excluido.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });
}

function bindEditActions() {
  document.querySelectorAll("[data-edit-table]").forEach((button) => {
    button.addEventListener("click", () => {
      const tableName = button.dataset.editTable;
      const recordId = button.dataset.editId;
      const formId = TABLE_TO_FORM[tableName];
      const stateKey = TABLE_TO_STATE[tableName];
      const record = state.moduleData[stateKey]?.find((item) => item.id === recordId);
      if (!record) return;

      if (tableName === "bom_materials") {
        state.bomTab = "materials";
        state.bomStructureFormVisible = false;
        state.bomMaterialFormVisible = true;
        renderActiveModule();
      }

      const form = document.querySelector(`#${formId}`);
      if (!form) return;

      populateForm(form, record);
      bindCurrencyInputs(form);

      const editField = form.elements.namedItem("edit_id");
      if (editField) {
        editField.value = record.id;
      }
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function bindPurchaseStatusActions() {
  document.querySelectorAll("[data-purchase-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const { error } = await state.supabase
          .from("purchase_requests")
          .update({ status: button.dataset.purchaseStatus })
          .eq("id", button.dataset.purchaseId);
        if (error) throw error;

        await loadTable("purchase_requests", "purchases");
        renderActiveModule();
        void queueSystemLog({
          moduleKey: "purchases",
          action: "mudanca_status",
          level: "Atenção",
          itemAffected: button.dataset.purchaseId,
          description: `Status da solicitação alterado para ${button.dataset.purchaseStatus}.`,
          entityType: "purchase_request",
          entityId: button.dataset.purchaseId,
        });
        showToast("Status da solicitação atualizado.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });
}

function bindPermissionEvents() {
  const roleForm = document.querySelector("#permission-role-form");
  if (roleForm) {
    roleForm.addEventListener("submit", handlePermissionRoleSubmit);
  }

  const syncPermissionRoleNameDraft = (value) => {
    state.permissionRoleDraft.name = normalizePermissionRoleName(value);
    state.permissionRoleDraft.permissions = normalizeRolePermissions(
      state.permissionRoleDraft.permissions,
      getPermissionRoleNormalizationName(state.permissionRoleDraft.name)
    );
  };

  const roleNameInput = document.querySelector('#permission-role-form input[name="name"]');
  if (roleNameInput) {
    roleNameInput.addEventListener("input", (event) => {
      const previousRoleName = state.permissionRoleDraft.name;
      syncPermissionRoleNameDraft(event.currentTarget.value);
      if (event.currentTarget.value !== state.permissionRoleDraft.name) {
        event.currentTarget.value = state.permissionRoleDraft.name;
      }
      const previousPermissionsAdmin = ["TI", "ADMINISTRADOR"].includes(normalizePermissionRoleName(previousRoleName));
      const nextPermissionsAdmin = ["TI", "ADMINISTRADOR"].includes(state.permissionRoleDraft.name);
      const previousVpsAccess = normalizePermissionRoleName(previousRoleName) === "TI";
      const nextVpsAccess = state.permissionRoleDraft.name === "TI";
      if (previousPermissionsAdmin !== nextPermissionsAdmin || previousVpsAccess !== nextVpsAccess) {
        renderActiveModule();
      }
    });
    roleNameInput.addEventListener("change", (event) => {
      syncPermissionRoleNameDraft(event.currentTarget.value);
      renderActiveModule();
    });
  }

  const roleDescriptionInput = document.querySelector('#permission-role-form textarea[name="description"]');
  if (roleDescriptionInput) {
    roleDescriptionInput.addEventListener("input", (event) => {
      state.permissionRoleDraft.description = event.currentTarget.value;
    });
  }

  document.querySelectorAll("[data-role-permission-type]").forEach((input) => {
    input.addEventListener("change", () => {
      const moduleKey = input.dataset.roleModule;
      const type = input.dataset.rolePermissionType;
      state.permissionRoleDraft.permissions = normalizeRolePermissions(
        state.permissionRoleDraft.permissions,
        getPermissionRoleNormalizationName(state.permissionRoleDraft.name)
      ).map((permission) => {
        if (permission.module_key !== moduleKey) return permission;
        const next = {
          ...permission,
          can_view: type === "view" ? input.checked : permission.can_view,
          can_edit: type === "edit" ? input.checked : permission.can_edit,
        };
        if (next.can_edit) next.can_view = true;
        return next;
      });
      state.permissionRoleDraft.permissions = normalizeRolePermissions(
        state.permissionRoleDraft.permissions,
        getPermissionRoleNormalizationName(state.permissionRoleDraft.name)
      );
      renderActiveModule();
    });
  });

  document.querySelector("[data-new-permission-role]")?.addEventListener("click", () => {
    const shouldOpen = state.openAccordionKey !== "permission-role-form" || Boolean(state.permissionRoleDraft.id);
    state.permissionRoleDraft = createEmptyPermissionRoleDraft();
    state.openAccordionKey = shouldOpen ? "permission-role-form" : null;
    renderActiveModule();
    if (shouldOpen) {
      document.querySelector("#permission-role-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  document.querySelector("[data-cancel-permission-role]")?.addEventListener("click", () => {
    state.permissionRoleDraft = createEmptyPermissionRoleDraft();
    state.openAccordionKey = null;
    renderActiveModule();
  });

  document.querySelectorAll("[data-edit-permission-role]").forEach((button) => {
    button.addEventListener("click", () => {
      const role = state.permissionRoles.find((item) => item.id === button.dataset.editPermissionRole);
      if (!role) return;
      state.permissionRoleDraft = {
        id: role.id,
        name: role.name,
        originalName: role.name,
        description: role.description || "",
        permissions: normalizeRolePermissions(role.permissions, role.name),
      };
      state.openAccordionKey = "permission-role-form";
      renderActiveModule();
      document.querySelector("#permission-role-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-delete-permission-role]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const { error } = await state.supabase.rpc("delete_permission_role", {
          p_access_token: state.accessToken,
          p_role_id: button.dataset.deletePermissionRole,
        });
        if (error) throw error;
        state.permissionRoleDraft = createEmptyPermissionRoleDraft();
        await loadPermissionsAdminData();
        renderActiveModule();
        void queueSystemLog({
          moduleKey: "permissions",
          action: "exclusao",
          level: "Critico",
          itemAffected: button.dataset.deletePermissionRole,
          description: "Papel de permissão excluido.",
          entityType: "permission_role",
          entityId: button.dataset.deletePermissionRole,
        });
        showToast("Papel excluido com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-open-employee-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.employeeModalOpen = true;
      state.employeeFormMode = "create";
      state.employeeEditId = "";
      state.employeeDraft = createEmptyEmployeeDraft();
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-edit-staff-user]").forEach((button) => {
    button.addEventListener("click", () => {
      const user = state.moduleData.users.find((item) => item.id === button.dataset.editStaffUser);
      if (!user) return;
      state.employeeModalOpen = true;
      state.employeeFormMode = "edit";
      state.employeeEditId = user.id;
      state.employeeDraft = {
        id: user.id,
        login_code: user.login_code || "",
        full_name: user.full_name || "",
        email: user.email || "",
        password: "",
        department: user.department || user.role || "USINAGEM",
        permission_role_id: user.permission_role_id || "",
        status: user.is_active ? "active" : "inactive",
      };
      renderActiveModule();
    });
  });

  document.querySelectorAll("[data-deactivate-staff-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const { error } = await state.supabase.rpc("deactivate_staff_user", {
          p_access_token: state.accessToken,
          p_user_id: button.dataset.deactivateStaffUser,
        });
        if (error) throw error;
        await loadPermissionsAdminData();
        renderActiveModule();
        void queueSystemLog({
          moduleKey: "permissions",
          action: "mudanca_status",
          level: "Critico",
          itemAffected: button.dataset.deactivateStaffUser,
          description: "Funcionário desativado.",
          entityType: "staff_user",
          entityId: button.dataset.deactivateStaffUser,
        });
        showToast("Funcionário desativado.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-delete-staff-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const { error } = await state.supabase.rpc("delete_inactive_staff_user", {
          p_access_token: state.accessToken,
          p_user_id: button.dataset.deleteStaffUser,
        });
        if (error) throw error;
        await loadPermissionsAdminData();
        renderActiveModule();
        void queueSystemLog({
          moduleKey: "permissions",
          action: "exclusao",
          level: "Critico",
          itemAffected: button.dataset.deleteStaffUser,
          description: "Funcionário inativo excluido.",
          entityType: "staff_user",
          entityId: button.dataset.deleteStaffUser,
        });
        showToast("Funcionário inativo excluido com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelector("[data-close-employee-modal-button]")?.addEventListener("click", closeEmployeeModal);
  document.querySelector("[data-close-employee-modal]")?.addEventListener("click", (event) => {
    if (event.target.hasAttribute("data-close-employee-modal")) {
      closeEmployeeModal();
    }
  });

  document.querySelector("#employee-form")?.addEventListener("submit", handleEmployeeSubmit);
}

function bindVpsControlEvents() {
  document.querySelector("[data-vps-refresh]")?.addEventListener("click", async () => {
    try {
      await enqueueVpsAction("refresh_snapshot", "server", "primary");
      await loadVpsControlData();
      renderActiveModule();
      showToast("Atualização da VPS solicitada.", "success");
    } catch (error) {
      showToast(formatError(error), "danger");
    }
  });

  document.querySelector("#vps-log-filters-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.vpsControl.logFilters = {
      search: formData.get("search")?.toString().trim() || "",
      source: formData.get("source")?.toString() || "all",
      level: formData.get("level")?.toString() || "all",
      dateFrom: formData.get("date_from")?.toString() || "",
      dateTo: formData.get("date_to")?.toString() || "",
    };

    try {
      const logs = await callVpsControlApi("logs", {
        query: {
          source: state.vpsControl.logFilters.source,
          level: state.vpsControl.logFilters.level,
          search: state.vpsControl.logFilters.search,
          date_from: state.vpsControl.logFilters.dateFrom,
          date_to: state.vpsControl.logFilters.dateTo,
        },
      });
      state.vpsControl.logs = logs || [];
      renderActiveModule();
    } catch (error) {
      showToast(formatError(error), "danger");
    }
  });

  document.querySelectorAll("[data-vps-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const actionType = button.dataset.vpsAction;
      const targetType = button.dataset.vpsTargetType;
      const targetName = button.dataset.vpsTargetName;
      const confirmMessage = button.dataset.vpsConfirm;
      const payload = button.dataset.vpsPayload ? JSON.parse(button.dataset.vpsPayload) : {};

      if (confirmMessage && !window.confirm(confirmMessage)) {
        return;
      }

      try {
        await enqueueVpsAction(actionType, targetType, targetName, payload);
        await loadVpsControlData();
        renderActiveModule();
        showToast("Ação enviada para a fila segura da VPS.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  bindDeferredTextFilter("#vps-database-table-filter", (value) => {
    state.vpsControl.databaseTableFilter = value;
  });

  document.querySelectorAll("[data-vps-database-table]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await loadVpsDatabaseTableDetail(button.dataset.vpsDatabaseTable);
        renderActiveModule();
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });
}

async function enqueueVpsAction(actionType, targetType, targetName, payload = {}) {
  const result = await callVpsControlApi("actions", {
    method: "POST",
    body: {
      action_type: actionType,
      target_type: targetType,
      target_name: targetName,
      payload,
    },
  });
  void queueSystemLog({
    moduleKey: "vps",
    action: "acao_critica_sistema",
    level: "Critico",
    itemAffected: `${targetType}:${targetName}`,
    description: `Ação VPS enfileirada: ${actionType}.`,
    entityType: targetType,
    entityId: targetName,
    payload: { actionType, targetType, targetName, payload },
  });
  return result;
}

function closeEmployeeModal() {
  state.employeeModalOpen = false;
  state.employeeFormMode = "create";
  state.employeeEditId = "";
  state.employeeDraft = createEmptyEmployeeDraft();
  renderActiveModule();
}

async function handlePermissionRoleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const normalizedRoleName = normalizePermissionRoleName(formData.get("name")?.toString());
  const payload = {
    p_access_token: state.accessToken,
    p_role_id: formData.get("role_id") || null,
    p_name: normalizedRoleName,
    p_description: formData.get("description")?.toString().trim() || null,
    p_permissions: normalizeRolePermissions(
      state.permissionRoleDraft.permissions,
      getPermissionRoleNormalizationName(normalizedRoleName)
    ),
  };

  try {
    const { error } = await state.supabase.rpc("save_permission_role", payload);
    if (error) throw error;
    state.permissionRoleDraft = createEmptyPermissionRoleDraft();
    state.openAccordionKey = null;
    await loadPermissionsAdminData();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "permissions",
      action: "alteracao_permissao",
      level: "Critico",
      itemAffected: payload.p_name,
      description: `Papel de permissão salvo/atualizado: ${payload.p_name}.`,
      entityType: "permission_role",
      entityId: payload.p_role_id || payload.p_name,
      payload,
    });
    showToast("Papel salvo com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleEmployeeSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const userId = formData.get("user_id")?.toString();
  const passwordValue = formData.get("password")?.toString() || null;
  const payload = {
    p_access_token: state.accessToken,
    p_login_code: sanitizeLoginCode(formData.get("login_code")),
    p_full_name: formData.get("full_name")?.toString().trim(),
    p_email: formData.get("email")?.toString().trim() || null,
    p_password: passwordValue,
    p_department: formData.get("department")?.toString().trim() || null,
    p_role: formData.get("department")?.toString().trim() || null,
    p_permission_role_id: formData.get("permission_role_id")?.toString() || null,
    p_is_active: formData.get("status")?.toString() === "active",
  };

  try {
    if (userId) {
      const updatePayload = {
        ...payload,
        p_user_id: userId,
        p_password: isTiUser() ? null : payload.p_password,
      };
      const { error } = await state.supabase.rpc("update_staff_user", updatePayload);
      if (error) throw error;

      if (isTiUser() && passwordValue) {
        const { error: resetError } = await state.supabase.rpc("reset_staff_user_password", {
          p_access_token: state.accessToken,
          p_user_id: userId,
          p_password: passwordValue,
        });
        if (resetError) throw resetError;
      }
    } else {
      const { error } = await state.supabase.rpc("create_staff_user", payload);
      if (error) throw error;
    }

    closeEmployeeModal();
    await loadPermissionsAdminData();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "permissions",
      action: "alteracao_permissao",
      level: "Critico",
      itemAffected: payload.p_full_name,
      description: `Cadastro de funcionário ${userId ? "atualizado" : "criado"} com papel de permissão.`,
      entityType: "staff_user",
      entityId: userId || payload.p_login_code,
      payload: {
        login_code: payload.p_login_code,
        full_name: payload.p_full_name,
        department: payload.p_department,
        permission_role_id: payload.p_permission_role_id,
        is_active: payload.p_is_active,
      },
    });
    showToast(userId ? "Funcionário atualizado com sucesso." : "Funcionário cadastrado com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function watchPurchaseRequests() {
  if (!hasPermission("purchases", "view")) return;

  const latestPending = state.moduleData.purchases.find((item) => getPurchaseRequestMetadata(item).status === "pending");
  if (latestPending && latestPending.id !== state.lastPurchaseNotificationId) {
    state.lastPurchaseNotificationId = latestPending.id;
    const metadata = getPurchaseRequestMetadata(latestPending);
    showPurchaseNotification(`Nova solicitação: ${metadata.primaryItemLabel || "item"} para ${metadata.department || "-"}.`, "created");
  }
}

function subscribeToPurchaseNotifications() {
  if (!state.supabase || !hasPermission("purchases", "view")) return;
  if (state.purchaseChannel) return;

  state.purchaseChannel = state.supabase
    .channel("purchase_requests_live")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "purchase_requests" },
      async (payload) => {
        const metadata = getPurchaseRequestMetadata(payload.new);
        showPurchaseNotification(`Nova solicitação: ${metadata.primaryItemLabel || "item"} para ${metadata.department || "-"}.`, "created");
        await loadTable("purchase_requests", "purchases");
        if (state.activeModule === "purchases" || state.activeModule === "dashboard") {
          renderActiveModule();
        }
      }
    )
    .subscribe();
}

function showPurchaseNotification(message, type = "created") {
  const toastType = type === "danger"
    ? "danger"
    : type === "warning" || type === "created" || type === "notified"
      ? "warning"
      : "success";
  showToast(message, toastType);
  playNotificationSound(type);
}

function showToast(message, type = "success") {
  if (shouldUseAuthFeedbackModal()) {
    openAuthFeedbackModal(message, type);
    return;
  }

  if (type === "warning" || type === "danger") {
    openAppFeedbackModal(message, type);
    return;
  }

  elements.notificationBanner.textContent = message;
  elements.notificationBanner.classList.remove("hidden");
  elements.notificationBanner.classList.remove("success", "warning", "danger");
  elements.notificationBanner.classList.add(type === "danger" ? "danger" : type === "warning" ? "warning" : "success");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    elements.notificationBanner.classList.add("hidden");
  }, 3800);
}

function shouldUseAuthFeedbackModal() {
  return elements.authScreen.classList.contains("active");
}

function openAppFeedbackModal(message, type = "warning", focusTarget = null) {
  const isDanger = type === "danger";
  const isWarning = type === "warning";
  elements.appFeedbackIcon.textContent = isDanger ? "!" : "•";
  elements.appFeedbackIcon.classList.toggle("success", false);
  elements.appFeedbackIcon.classList.toggle("warning", isWarning);
  elements.appFeedbackTitle.textContent = isDanger ? "Erro" : "Aviso";
  elements.appFeedbackMessage.textContent = String(message || "Preencha os campos obrigatórios.");
  elements.appFeedbackModal.classList.remove("hidden");
  elements.appFeedbackModal.setAttribute("aria-hidden", "false");
  openAppFeedbackModal.focusTarget = focusTarget || null;
  window.setTimeout(() => elements.appFeedbackClose?.focus(), 0);
}

function closeAppFeedbackModal() {
  elements.appFeedbackModal.classList.add("hidden");
  elements.appFeedbackModal.setAttribute("aria-hidden", "true");
  const focusTarget = openAppFeedbackModal.focusTarget;
  openAppFeedbackModal.focusTarget = null;
  if (focusTarget && typeof focusTarget.focus === "function") {
    window.setTimeout(() => focusTarget.focus(), 0);
  }
}

function handleInvalidFormField(event) {
  const field = event.target;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
    return;
  }

  event.preventDefault();
  openAppFeedbackModal(buildRequiredFieldMessage(field), "warning", field);
}

function buildRequiredFieldMessage(field) {
  const label = getFieldLabelText(field);
  if (field.validity?.valueMissing) {
    if (field instanceof HTMLSelectElement) {
      return label ? `Selecione ${label}.` : "Selecione uma opção.";
    }
    if (field.type === "checkbox" || field.type === "radio") {
      return label ? `Marque ${label}.` : "Marque a opção obrigatória.";
    }
    return label ? `Preencha ${label}.` : "Preencha o campo obrigatório.";
  }
  return field.validationMessage || "Verifique o campo informado.";
}

function getFieldLabelText(field) {
  const explicitLabel = field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`) : null;
  const wrappingLabel = field.closest("label");
  const label = explicitLabel || wrappingLabel;
  if (!label) return field.getAttribute("placeholder") || field.name || "";

  const clone = label.cloneNode(true);
  clone.querySelectorAll("input, select, textarea, button").forEach((item) => item.remove());
  return clone.textContent
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function openAuthFeedbackModal(message, type = "success") {
  const isSuccess = type === "success";
  const isWarning = type === "warning";
  elements.authFeedbackIcon.textContent = isSuccess ? "✓" : isWarning ? "•" : "!";
  elements.authFeedbackIcon.classList.toggle("success", isSuccess);
  elements.authFeedbackTitle.textContent = isSuccess ? "Sucesso" : isWarning ? "Aviso" : "Erro";
  elements.authFeedbackMessage.textContent = normalizeAuthFeedbackMessage(message, type);
  elements.authFeedbackModal.classList.remove("hidden");
  elements.authFeedbackModal.setAttribute("aria-hidden", "false");
}

function closeAuthFeedbackModal() {
  elements.authFeedbackModal.classList.add("hidden");
  elements.authFeedbackModal.setAttribute("aria-hidden", "true");
}

function normalizeAuthFeedbackMessage(message, type) {
  if (type === "success") {
    return "Login realizado com sucesso.";
  }

  const normalizedMessage = String(message || "");
  if (
    normalizedMessage.toLowerCase().includes("código ou senha invalidos")
    || normalizedMessage.toLowerCase().includes("credenciais inválidas")
  ) {
    return `Usuário ou senha invalidos. Apos ${LOGIN_MAX_ATTEMPTS} tentativas, o acesso e bloqueado temporariamente.`;
  }

  return normalizedMessage || "Não foi possível concluir a autenticação.";
}

function getNotificationAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!notificationAudio.context || notificationAudio.context.state === "closed") {
    notificationAudio.context = new AudioContextClass();
  }

  return notificationAudio.context;
}

function primeNotificationAudio() {
  if (notificationAudio.unlockBound) return;
  notificationAudio.unlockBound = true;

  Object.entries(NOTIFICATION_SOUND_PATHS).forEach(([type, src]) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    notificationAudio.filePlayers[type] = audio;
  });

  const unlockAudio = async () => {
    const audioContext = getNotificationAudioContext();
    try {
      if (audioContext?.state === "suspended") {
        await audioContext.resume();
      }
    } catch {
      // Ignore AudioContext resume failures and keep file playback enabled.
    }

    notificationAudio.enabled = true;

    window.removeEventListener("pointerdown", unlockAudio, true);
    window.removeEventListener("keydown", unlockAudio, true);
    window.removeEventListener("touchstart", unlockAudio, true);
  };

  window.addEventListener("pointerdown", unlockAudio, true);
  window.addEventListener("keydown", unlockAudio, true);
  window.addEventListener("touchstart", unlockAudio, true);
}

function playNotificationSound(type = "created") {
  const soundType = NOTIFICATION_SOUND_PATHS[type] ? type : "created";
  const filePlayer = notificationAudio.filePlayers[soundType];

  if (notificationAudio.enabled && filePlayer) {
    try {
      const playback = filePlayer.cloneNode();
      playback.volume = soundType === "danger" ? 0.7 : soundType === "warning" ? 0.62 : 0.58;
      const playPromise = playback.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          playSynthNotificationSound(soundType);
        });
      }
      return;
    } catch {
      // Fall back to the synth player below.
    }
  }

  playSynthNotificationSound(soundType);
}

function playSynthNotificationSound(type = "created") {
  const audioContext = getNotificationAudioContext();
  if (!audioContext) return;

  const soundMap = {
    created: { frequency: 880, duration: 0.35, gain: 0.09, wave: "triangle" },
    approved: { frequency: 740, duration: 0.28, gain: 0.07, wave: "sine" },
    purchase_completed: { frequency: 660, duration: 0.34, gain: 0.08, wave: "triangle" },
    completed: { frequency: 520, duration: 0.42, gain: 0.08, wave: "sine" },
    notified: { frequency: 960, duration: 0.24, gain: 0.06, wave: "triangle" },
    warning: { frequency: 700, duration: 0.22, gain: 0.05, wave: "square" },
    danger: { frequency: 430, duration: 0.3, gain: 0.06, wave: "sawtooth" },
  };
  const config = soundMap[type] || soundMap.created;

  const playTone = () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = config.wave;
    oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(config.gain, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + config.duration);
  };

  if (audioContext.state === "running") {
    playTone();
    return;
  }

  audioContext.resume().then(playTone).catch(() => {});
}

function sanitizeLoginCode(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 3);
}

function formatError(error) {
  if (handleAuthenticationFailure(error, { showMessage: false })) {
    return AUTH_SESSION_INVALID_MESSAGE;
  }
  return error?.message || "Ocorreu um erro inesperado.";
}

async function loadModuleData(moduleKey) {
  return loadDataForModule(moduleKey);
}

function renderModuleFromLegacyBridge(moduleKey) {
  switch (moduleKey) {
    case "dashboard":
      return renderDashboard();
    case "products":
      return renderProductsModule();
    case "permissions":
      return renderPermissionsModule();
    case "vps":
      return renderVpsControlModule();
    case "audit":
      return renderAuditModule();
    case "bom":
      return renderBomModule();
    case "inventory":
      return renderInventoryModule();
    case "production":
      return renderProductionModule();
    case "service_orders":
      return renderServiceOrdersModule();
    case "machining":
      return renderMachiningModule();
    case "customers":
      return renderCustomersModule();
    case "sales":
      return renderSalesModule();
    case "purchases":
      return renderPurchasesModule();
    case "reports":
      return renderReportsModule();
    default:
      return renderDashboard();
  }
}

function bindModuleFromLegacyBridge(moduleKey) {
  switch (moduleKey) {
    case "dashboard":
      bindDashboardEvents();
      break;
    case "products":
      bindProductsModuleEvents();
      break;
    case "permissions":
      bindPermissionEvents();
      break;
    case "vps":
      bindVpsControlEvents();
      break;
    case "audit":
      bindAuditModuleEvents();
      break;
    case "bom":
      bindBomModuleEvents();
      break;
    case "inventory":
      bindInventoryModuleEvents();
      break;
    case "production":
      bindProductionModuleEvents();
      break;
    case "service_orders":
      bindServiceOrdersModuleEvents();
      break;
    case "machining":
      bindMachiningModuleEvents();
      break;
    case "customers":
      bindCustomersModuleEvents();
      break;
    case "sales":
      bindSalesModuleEvents();
      break;
    case "purchases":
      bindPurchasesModuleEvents();
      break;
    case "reports":
      bindReportsModuleEvents();
      break;
    default:
      bindDashboardEvents();
  }
}

window.CAPSFARMA_MODULE_BRIDGE = {
  renderModule: renderModuleFromLegacyBridge,
  bindModule: bindModuleFromLegacyBridge,
  loadModuleData,
  hasPermission: (moduleKey, permissionType) => hasPermission(moduleKey, permissionType),
  getState: () => state,
  helpers: {
    // Core/shared formatting and shell helpers
    escapeHtml,
    formatShortId,
    formatDate,
    formatDateTime,
    formatCurrency,
    formatQuantity,
    formatWholeQuantity,
    formatFileSize,
    formatError,
    noPermissionTemplate,
    renderKpiCard,
    renderStrategicKpiCard,
    renderDashboardAlert,
    renderDashboardPipelineStage,
    renderDashboardBarChart,
    buildDashboardSnapshot,
    refreshDashboardData,
    openSaleFromDashboard,
    getDateShiftedIso,

    // Products and inventory
    productionPriorityCell,
    renderProductForm,
    renderProductMovementPanel,
    productStatusCell,
    productCategoryCell,
    productTypeCell,
    productStockCell,
    getProductType,
    getProductCategory,
    formatProductTypeLabel,
    normalizeProductSaleOptions,
    renderLastMovementUserCell,
    productActionCell,
    getProductionMachiningOrders,
    getProductionOrderMetadata,
    getVisibleMachiningSteps,
    getProductionStepActionLabel,
    isProductionStepAdvanceDisabled,
    renderProductionStageStatusBadge,
    formatProcessMinutes,
    renderOptions,
    statusCell,
    createEmptyProductionDraft,
    createProductionOperationConfigDraft,
    resetProductionOperationConfigDraft,
    syncProductionOperationConfigDraftFromForm,
    addProductionOperationConfigStep,
    removeProductionOperationConfigStep,
    restoreDefaultProductionOperationConfig,
    handleProductionOperationConfigSubmit,
    handleProductionSubmit,
    syncProductionDraftFromForm,
    resetProductionFormState,
    renderProductSaleVariationRows,
    buildProductCategoryOptions,
    getSalesItemBomDescription,
    renderSalesItemBomDescription,
    isProductVisibleInCommercialDocuments,
    getInventoryMovementBomDescription,
    renderInventoryMovementBomDescription,
    handleProductionProductSelection,
    hydrateProductionDraft,
    handleProductionStart,
    enterProductionFocusMode,
    exitProductionFocusMode,
    handleProductionPrint,
    handleProductionOperationAdvance,
    getProductionOperationStepLabel,
    getProductionOperationActionLabel,
    getProductionStatusLabel,
    buildProductionMaterialPlan,
    showProductionNotification,
    handleMachiningStepAdvance,
    handleMachiningStepOperatorChange,
    getPurchaseRequestMetadata,
    getLoggedUserName,
    createEmptyPurchaseDraft,
    createEmptyPurchaseItemDraft,
    handlePurchaseSubmit,
    handlePurchaseRequesterSelection,
    syncPurchaseDraftFromForm,
    resetPurchaseFormState,
    hydratePurchaseDraft,
    hydratePurchaseConclusionDraft,
    updatePurchaseRequestStatus,
    getPurchaseConclusionStockEntries,
    showPurchaseNotification,
    resetPurchaseConclusionState,
    notifyPurchaseRequester,
    buildPurchaseRequesterMessage,
    handlePurchaseConclusionSubmit,
    syncPurchaseConclusionDraftFromForm,
    processPurchaseStockEntries,
    handlePurchaseFileSelection,
    removePurchaseFile,
    addPurchaseInstallment,
    removePurchaseInstallment,
    handlePurchaseInstallmentFieldChange,
    handlePurchaseInstallmentFileSelection,
    removePurchaseInstallmentFile,
    handlePurchaseItemFieldChange,
    purchaseUrgencyCell,
    purchaseStatusCell,
    createEmptyPayablesFilters,
    createEmptyPayableDraft,
    createEmptyPayablePaymentDraft,
    getPayableCategoryOptions,
    getPayableFrequencyOptions,
    getPayableTypeLabel,
    getPayableMetadata,
    getPayablesSnapshot,
    hydratePayableDraft,
    hydratePayablePaymentDraft,
    resetPayableDraftState,
    resetPayablePaymentDraftState,
    handlePayableAttachmentSelection,
    removePayableAttachment,
    handlePayableSubmit,
    handlePayablePaymentSubmit,
    cancelPayableRecord,
    payableStatusCell,
    showPayableNotification,
    renderInventoryMovementForm,
    inventoryMovementTypeCell,
    handleInventoryMovementSubmit,

    // BOM
    renderTable,
    draftInputField,
    draftTextAreaField,
    draftSelectField,
    deleteButtonCell,
    bomStructureActionCell,
    formatBomCategory,
    buildBomMaterialCategoryOptions,
    materialStatusCell,
    bomStructureStatusCell,
    createEmptyBomDraftItem,
    createEmptyBomStructureDraft,
    buildBomComponentOptions,
    getBomDraftItemVariationOptions,
    getBomFinalProductVariationOptions,
    getBomFinalProductProductionSections,
    getBomDraftItemComputed,
    calculateBomDraftTotal,
    getFileExtensionLabel,
    resetBomStructureDraft,
    hydrateBomDraftFromStructure,
    renderBomStructureItemsSummary,
    resetBomDraftItems,
    removeBomAttachmentAt,
    handleBomDraftItemFieldChange,
    handleBomStructureDraftFieldChange,
    handleBomMaterialSubmit,
    handleBomStructureSubmit,
    handleBomFileSelection,
    loadBomData,

    // Machining and production
    createEmptyMachiningProcessDraft,
    createEmptyMachiningDraft,
    createEmptyMachiningStartDraft,
    resequenceMachiningProcesses,
    getMachiningDraftTotalMinutes,
    formatMinutesLabel,
    findMachiningPiece,
    hydrateMachiningDraft,
    syncMachiningDraftFromForm,
    handleMachiningProcessFieldChange,
    resetMachiningFormState,
    handleMachiningSubmit,
    syncMachiningStartDraftFromForm,
    handleMachiningStartProductionSubmit,
    getLatestMachiningOrder,
    getMachiningCurrentStageLabel,
    renderMachiningStatusBadge,
    renderMachiningStepStatusBadge,
    canStepAction,
    handleMachiningStepStart,
    handleMachiningStepComplete,
    persistMachiningPieces,

    // Audit and reports
    loadAuditLogs,
    getAuditKnownModules,
    getModuleLabel,
    createEmptyAuditFilters,
    renderAuditLevelBadge,
    getAuditLogActionOptions,
    buildAuditExportHtml,
    buildReportsSnapshot,
    buildReportsExportHtml,
    createEmptyReportsFilters,
    loadAllVisibleData,

    // Permissions and staff
    createEmptyPermissionRoleDraft,
    createEmptyEmployeeDraft,
    isPermissionsAdmin,
    isPermissionsAdminRole,
    isTiUser,
    formatStaffRole,
    normalizePermissionRoleName,
    normalizeRolePermissions,
    getPermissionRoleNormalizationName,
    renderEmployeeModal,
    loadPermissionsAdminData,
    closeEmployeeModal,
    handlePermissionRoleSubmit,
    handleEmployeeSubmit,
    getModules: () => MODULES,

    // VPS control
    hasSupabaseConfig,
    renderVpsHealthBadge,
    formatVpsStatusLabel,
    getMetricTone,
    formatPercent,
    loadVpsControlData,
    loadVpsDatabaseTableDetail,
    callVpsControlApi,
    enqueueVpsAction,

    // Shared form primitives
    selectField,
    inputField,
    optionalInputField,
    textAreaField,
    optionalTextAreaField,
    currencyInputField,

    // Customers
    createEmptyCustomerDraft,
    handleCustomerSubmit,
    syncCustomerDraftFromForm,
    resetCustomerFormState,
    hydrateCustomerDraft,
    getCustomerMetadata,
    formatCpf,
    formatCnpj,
    formatPhoneBr,

    // Sales
    canManageSalesTemplates,
    createDefaultSalesTemplate,
    createEmptySalesDraft,
    createEmptySalesItemDraft,
    createEmptySalesPaymentCondition,
    createEmptySalesContractDraft,
    getPaymentMethodLabel,
    getSaleMetadata,
    getSalesDraftTotals,
    getSalesPixDiscountPercent,
    getSalesPaymentConditionsForDisplay,
    getSalesPaymentConditionsLabel,
    formatPercent,
    updateSalesDraftAmountDisplays,
    normalizeProductSaleOptions,
    renderSalesItemBomDescription,
    formatWholeQuantity,
    getSalesTemplate,
    addDaysToIsoDate,
    getSalesTemplatePlaceholderList,
    getSalesTemplatePdfSize,
    resolveSalesTemplateContent,
    openSalesTemplatePdf,
    openSalesDocumentPreview,
    closeSalesDocumentPreview,
    openPrintWindowForHtml,
    openPreparedSalesDocumentShare,
    handleSalesSubmit,
    syncSalesDraftFromForm,
    resetSalesFormState,
    handleSalesCustomerSelection,
    handleSalesItemFieldChange,
    hydrateSalesDraft,
    hydrateSalesContractDraft,
    finalizeSaleRecord,
    sendSaleToProduction,
    handleSalesContractSubmit,
    syncSalesContractDraftFromForm,
    resetSalesContractFormState,
    syncSalesTemplateFromForm,
    syncSalesCompanySettingsFromForm,
    persistSalesDocumentSettings,
    closeSalesConfigModal,
    readFileAsDataUrl,
    saleStatusCell,

    // Runtime bridge/back-compat helpers
    resetProductModuleState,
    renderActiveModule,
    renderModuleNav,
    bindDeferredTextFilter,
    bindDeferredSelectFilter,
    resizeProductImageFile,
    handleProductSubmit,
    resetProductForm,
    populateForm,
    renderProductProductionSectionRows,
    syncProductSectionsPanel,
    bindCurrencyInputs,
    isProductLinkedDeleteError,
    loadTable,
    upsertModuleRecord,
    removeModuleRecord,
    queueSystemLog,
    showToast,
    handleProductMovementSubmit,
  },
};

function isProductLinkedDeleteError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes('violates foreign key constraint')
    && (
      message.includes('inventory_movements_product_id_fkey')
      || message.includes('production_orders_product_id_fkey')
      || message.includes('bom_structures_product_id_fkey')
    );
}

const TABLE_TO_FORM = {
  products: "products-form",
  bom_materials: "bom-material-form",
  production_orders: "production-form",
  customers: "customers-form",
  sales: "sales-form",
  purchase_requests: "purchase-form",
};

const TABLE_TO_STATE = {
  products: "products",
  bom_materials: "bomMaterials",
  production_orders: "production",
  customers: "customers",
  sales: "sales",
  purchase_requests: "purchases",
};

init();
