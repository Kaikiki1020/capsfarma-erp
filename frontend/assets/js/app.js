const DEFAULT_SUPABASE_CONFIG = {
  url: `${window.location.protocol === "https:" ? "https:" : "http:"}//${window.location.hostname || "127.0.0.1"}:54321`,
  anonKey: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
};
const SUPABASE_CONFIG = {
  ...DEFAULT_SUPABASE_CONFIG,
  ...(window.CAPSFARMA_SUPABASE_CONFIG || {}),
};
const MACHINING_STORAGE_KEY = "capsfarma_machining_data";
const SALES_DOCUMENT_SETTINGS_STORAGE_KEY = "capsfarma_sales_document_settings";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "capsfarma_sidebar_collapsed";
const CLIENT_IP_STORAGE_KEY = "capsfarma_client_ip";
const LOGIN_MAX_ATTEMPTS = 5;
const SIDEBAR_MOBILE_BREAKPOINT = 1180;
const DEFAULT_BRAND_LOGO_PATH = "./assets/branding/logo-empresa.png";
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
const MODULES = [
  { key: "dashboard", label: "Dashboard", tooltip: "Dashboard", icon: "◫" },
  { key: "products", label: "Produtos", tooltip: "Produtos", icon: "◪" },
  { key: "bom", label: "Estrutura (BOM)", tooltip: "BOM", icon: "⊞" },
  { key: "inventory", label: "Estoque", tooltip: "Estoque", icon: "◬" },
  { key: "production", label: "Producao", tooltip: "Producao", icon: "◭" },
  { key: "service_orders", label: "Ordem de Servico", tooltip: "Ordem de Servico", icon: "▣" },
  { key: "machining", label: "Usinagem", tooltip: "Usinagem", icon: "◈" },
  { key: "customers", label: "Clientes", tooltip: "Clientes", icon: "◎" },
  { key: "sales", label: "Vendas", tooltip: "Vendas", icon: "◨" },
  { key: "purchases", label: "Compras", tooltip: "Compras", icon: "◧" },
  { key: "reports", label: "Relatorios", tooltip: "Relatorios", icon: "◲" },
  { key: "permissions", label: "Permissoes", tooltip: "Permissoes", icon: "◩" },
  { key: "vps", label: "Controle da VPS", tooltip: "Controle VPS", icon: "▤" },
  { key: "audit", label: "Auditoria", tooltip: "Central de Logs", icon: "◰" },
];
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
    machiningPieces: [],
    customers: [],
    sales: [],
    purchases: [],
    users: [],
    auditLogs: [],
  },
  activeModule: "dashboard",
  bomTab: "materials",
  bomMaterialSearch: "",
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
  machiningSearch: "",
  machiningStatusFilter: "all",
  openAccordionKey: null,
  productionDraft: createEmptyProductionDraft(),
  serviceOrderDraft: createEmptyServiceOrderDraft(),
  serviceOrderFilters: createEmptyServiceOrderFilters(),
  serviceOrderSelectedId: "",
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
  notifications: [],
  auditFilters: createEmptyAuditFilters(),
  auditSelectedLogId: "",
  reportsFilters: createEmptyReportsFilters(),
  inventoryFormVisible: false,
  lastPurchaseNotificationId: null,
  purchaseChannel: null,
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
};

const elements = {
  body: document.body,
  pageShell: document.querySelector(".page-shell"),
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
};

let activeModuleRenderFrame = 0;

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

function init() {
  loadSalesDocumentSettings();
  renderAuthBranding();
  attachEvents();
  primeNotificationAudio();
  syncSidebarState();
  renderModuleNav();
  syncAppMode();

  if (!hasSupabaseConfig()) {
    showToast("Configure o arquivo supabase/config.js para conectar o sistema.", "warning");
    renderLandingConnectionState(false);
    void restoreSession();
    return;
  }

  try {
    state.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    renderLandingConnectionState(true);
  } catch {
    renderLandingConnectionState(false);
    showToast("Nao foi possivel iniciar a conexao com o Supabase.", "danger");
  }

  void restoreSession();
}

function attachEvents() {
  elements.loginForm?.addEventListener("submit", handleLogin);
  elements.registerForm?.addEventListener("submit", handleRegister);
  elements.sidebarLogoutButton.addEventListener("click", logout);
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
}

function renderLandingConnectionState(isConnected) {
  elements.authConnectionStatus.textContent = isConnected ? "Ambiente conectado" : "Ambiente aguardando configuracao";
  elements.authStatusDot.classList.toggle("online", isConnected);
}

function syncAppMode() {
  elements.body.classList.toggle("auth-mode", elements.authScreen.classList.contains("active"));
  if (elements.authScreen.classList.contains("active")) {
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
  const loginReadyMessage = `Gerencie a operacao da ${companyName} com seguranca, agilidade e controle em tempo real.`;
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
    "Para redefinir sua senha, solicite a alteracao ao ADMINISTRADOR ou ao time de TI no cadastro de funcionarios.",
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
    showToast("Acesso nao autorizado", "danger");
    return;
  }
  state.activeModule = requested;
}

function handleHashChange() {
  if (!state.currentUser) return;
  applyRequestedModuleFromHash();
  renderModuleNav();
  renderActiveModule();
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

async function restoreSession() {
  const rawSession = localStorage.getItem("capsfarma_session");
  if (!rawSession) {
    return;
  }

  try {
    const session = JSON.parse(rawSession);
    if (!session?.accessToken) {
      localStorage.removeItem("capsfarma_session");
      return;
    }
    state.currentUser = session.user;
    state.accessToken = session.accessToken || "";
    state.permissions = session.permissions || [];

    if (state.supabase) {
      await loadPermissions();
      persistSession();
    }

    showApp();
    await renderApp();
  } catch {
    state.currentUser = null;
    state.accessToken = "";
    state.permissions = [];
    localStorage.removeItem("capsfarma_session");
    showToast("Sua sessao expirou ou nao e mais valida. Faca login novamente.", "warning");
  }
}

async function handleRegister(event) {
  event.preventDefault();

  if (!state.supabase) {
    showToast("Supabase ainda nao foi configurado.", "danger");
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
    if (!user) throw new Error("Nao foi possivel concluir o cadastro.");

    showToast(
      ["ADMNISTRADOR", "ADMINISTRADOR"].includes(user.role)
        ? "Primeiro usuario criado como ADMINISTRADOR."
        : "Usuario cadastrado com sucesso.",
      "success"
    );
    event.currentTarget?.reset();
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleLogin(event) {
  event.preventDefault();

  if (!state.supabase) {
    showToast("Supabase ainda nao foi configurado.", "danger");
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
    if (!user) throw new Error("Credenciais invalidas.");

    state.currentUser = user;
    state.accessToken = user.access_token || "";
    await loadPermissions();
    await loadSalesDocumentSettingsFromServer();
    persistSession();
    showApp();
    renderApp();
    showToast("Login realizado com sucesso.", "success");
    event.currentTarget?.reset();
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function loadPermissions() {
  const { data, error } = await state.supabase.rpc("get_my_permissions", {
    p_access_token: state.accessToken,
  });

  if (error) throw error;
  state.permissions = data || [];
}

function persistSession() {
  localStorage.setItem(
    "capsfarma_session",
    JSON.stringify({
      user: state.currentUser,
      accessToken: state.accessToken,
      permissions: state.permissions,
    })
  );
}

function logout() {
  stopDashboardAutoRefresh();
  if (state.purchaseChannel && state.supabase) {
    state.supabase.removeChannel(state.purchaseChannel);
    state.purchaseChannel = null;
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
    machiningPieces: [],
    customers: [],
    sales: [],
    purchases: [],
    users: [],
    auditLogs: [],
  };
  state.bomTab = "materials";
  state.bomMaterialSearch = "";
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
  state.serviceOrderDraft = createEmptyServiceOrderDraft();
  state.serviceOrderFilters = createEmptyServiceOrderFilters();
  state.serviceOrderSelectedId = "";
  state.machiningSearch = "";
  state.machiningStatusFilter = "all";
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
  state.notifications = [];
  state.auditFilters = createEmptyAuditFilters();
  state.auditSelectedLogId = "";
  state.reportsFilters = createEmptyReportsFilters();
  state.inventoryFormVisible = false;
  state.vpsControl = createEmptyVpsControlState();
  state.dashboardRange = "30d";
  state.dashboardCustomRange = {
    from: "",
    to: "",
  };
  state.dashboardLastUpdatedAt = "";
  state.dashboardRefreshInFlight = false;
  state.lastAuditedModule = "";
  localStorage.removeItem("capsfarma_session");
  elements.appScreen.classList.remove("active");
  elements.authScreen.classList.add("active");
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
  try {
    elements.userNameLabel.textContent = getLoggedUserName("-");
    elements.userRoleLabel.textContent = formatStaffRole(state.currentUser.role);
    elements.userAvatarLabel.textContent = getUserInitials(getLoggedUserName(""));
    void resolveClientIp();

    applyRequestedModuleFromHash();
    renderModuleNav();
    await loadAllVisibleData();
    renderActiveModule();
    startDashboardAutoRefresh();
    watchPurchaseRequests();
    subscribeToPurchaseNotifications();
    watchServiceOrders();
    subscribeToServiceOrderNotifications();
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function renderModuleNav() {
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
            ? "Ordens de Producao"
            : state.activeModule === "service_orders"
              ? "Ordem de Servico"
            : state.activeModule === "machining"
              ? "Usinagem"
          : state.activeModule === "customers"
            ? "Cadastro de Clientes"
            : state.activeModule === "sales"
              ? "Vendas"
              : state.activeModule === "purchases"
                ? "Solicitacao de Compras"
                : state.activeModule === "vps"
                  ? "Controle da VPS"
                  : state.activeModule === "reports"
                    ? "Relatorios"
                  : state.activeModule === "audit"
                    ? "Central de Logs"
                : state.activeModule === "permissions"
                  ? "Gerenciamento de Permissoes"
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
    });
  });
}

async function loadAllVisibleData() {
  if (!state.supabase) {
    if (hasPermission("service_orders", "view")) {
      await loadServiceOrdersTable();
    }
    loadMachiningData();
    return;
  }

  const loaders = [];

  if (hasPermission("permissions", "view")) {
    loaders.push(loadPermissionsAdminData());
  } else if (hasPermission("purchases", "view") || hasPermission("service_orders", "view") || hasPermission("production", "view")) {
    loaders.push(loadAssignableUsers());
  }
  if (hasPermission("products", "view")) loaders.push(loadProductsTable());
  if (hasPermission("bom", "view")) loaders.push(loadBomData());
  if (hasPermission("inventory", "view")) loaders.push(loadInventoryMovementsTable());
  if (hasPermission("production", "view")) loaders.push(loadTable("production_orders", "production"));
  if (hasPermission("service_orders", "view")) loaders.push(loadServiceOrdersTable());
  if (hasPermission("customers", "view")) loaders.push(loadTable("customers", "customers"));
  if (hasPermission("sales", "view")) loaders.push(loadTable("sales", "sales"));
  if (hasPermission("purchases", "view")) loaders.push(loadTable("purchase_requests", "purchases"));
  if (hasPermission("reports", "view")) {
    if (!hasPermission("products", "view")) loaders.push(loadProductsTable());
    if (!hasPermission("inventory", "view")) loaders.push(loadInventoryMovementsTable());
    if (!hasPermission("production", "view")) loaders.push(loadTable("production_orders", "production"));
    if (!hasPermission("service_orders", "view")) loaders.push(loadServiceOrdersTable());
    if (!hasPermission("customers", "view")) loaders.push(loadTable("customers", "customers"));
    if (!hasPermission("sales", "view")) loaders.push(loadTable("sales", "sales"));
    if (!hasPermission("purchases", "view")) loaders.push(loadTable("purchase_requests", "purchases"));
  }
  if (hasPermission("vps", "view")) loaders.push(loadVpsControlData());
  if (hasPermission("audit", "view")) loaders.push(loadAuditLogs());

  await Promise.all(loaders);
  loadMachiningData();
  state.dashboardLastUpdatedAt = new Date().toISOString();
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
    throw new Error("Conexao com Supabase indisponivel.");
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

  throw new Error("Operacao do modulo VPS nao suportada.");
}

async function loadVpsControlData() {
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
  const { data, error } = await state.supabase.rpc("get_permissions_admin_snapshot", {
    p_access_token: state.accessToken,
  });
  if (error) throw error;

  state.permissionRoles = data?.roles || [];
  state.moduleData.users = data?.users || [];
}

async function loadTable(tableName, stateKey) {
  const { data, error } = await state.supabase.from(tableName).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  state.moduleData[stateKey] = data || [];
  state.dashboardLastUpdatedAt = new Date().toISOString();
  if (stateKey === "production" || stateKey === "inventory") {
    syncMachiningDerivedData();
  }
}

async function loadProductsTable() {
  try {
    await loadTable("products", "products");
  } catch (error) {
    state.moduleData.products = [];
    if (!loadProductsTable.warned && String(error?.message || "").toLowerCase().includes("products")) {
      loadProductsTable.warned = true;
      showToast("Tabela de produtos ainda nao aplicada no banco. Execute o schema do Supabase.", "warning");
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
      showToast("Tabela de movimentacoes de estoque ainda nao aplicada no banco.", "warning");
      return;
    }

    throw error;
  }
}

async function loadBomData() {
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
  } catch (error) {
    state.moduleData.bomMaterials = [];
    state.moduleData.bomStructures = [];
    if (!loadBomData.warned && /bom_materials|bom_structures/i.test(String(error?.message || ""))) {
      loadBomData.warned = true;
      showToast("Estruturas do BOM ainda nao aplicadas no banco.", "warning");
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
      showToast("Tabela de auditoria ainda nao aplicada no banco.", "warning");
      return;
    }
    throw error;
  }
}

function renderActiveModule() {
  switch (state.activeModule) {
    case "dashboard":
      elements.moduleContainer.innerHTML = renderDashboard();
      bindDashboardEvents();
      break;
    case "products":
      elements.moduleContainer.innerHTML = renderProductsModule();
      bindProductsModuleEvents();
      break;
    case "permissions":
      elements.moduleContainer.innerHTML = renderPermissionsModule();
      bindPermissionEvents();
      break;
    case "vps":
      elements.moduleContainer.innerHTML = renderVpsControlModule();
      bindVpsControlEvents();
      break;
    case "audit":
      elements.moduleContainer.innerHTML = renderAuditModule();
      bindAuditModuleEvents();
      break;
    case "bom":
      elements.moduleContainer.innerHTML = renderBomModule();
      bindBomModuleEvents();
      break;
    case "inventory":
      elements.moduleContainer.innerHTML = renderInventoryModule();
      bindInventoryModuleEvents();
      break;
    case "production":
      elements.moduleContainer.innerHTML = renderProductionModule();
      bindProductionModuleEvents();
      break;
    case "service_orders":
      elements.moduleContainer.innerHTML = renderServiceOrdersModule();
      bindServiceOrdersModuleEvents();
      break;
    case "machining":
      elements.moduleContainer.innerHTML = renderMachiningModule();
      bindMachiningModuleEvents();
      break;
    case "customers":
      elements.moduleContainer.innerHTML = renderCustomersModule();
      bindCustomersModuleEvents();
      break;
    case "sales":
      elements.moduleContainer.innerHTML = renderSalesModule();
      bindSalesModuleEvents();
      break;
    case "purchases":
      elements.moduleContainer.innerHTML = renderPurchasesModule();
      bindPurchasesModuleEvents();
      break;
    case "reports":
      elements.moduleContainer.innerHTML = renderReportsModule();
      bindReportsModuleEvents();
      break;
    default:
      elements.moduleContainer.innerHTML = renderDashboard();
      bindDashboardEvents();
  }

  bindCurrencyInputs(elements.moduleContainer);
  bindEditActions();
  bindDeleteActions();
  trackModuleAccessIfNeeded();
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
    await loadAllVisibleData();
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
}

function renderDashboard() {
  const snapshot = buildDashboardSnapshot();

  return `
    <section class="module-panel admin-dashboard">
      <div class="module-head dashboard-head">
        <div>
          <p class="eyebrow muted">Visao estrategica do negocio</p>
          <h3>Dashboard do Administrador</h3>
          <p class="muted">Leitura rapida de lucro, operacao, riscos e desempenho geral em um unico painel.</p>
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
            <p class="muted">Problemas que exigem acao imediata ou acompanhamento de perto.</p>
          </div>
          <span class="status-chip ${snapshot.alerts.length ? "status-pending" : "status-completed"}">
            ${snapshot.alerts.length ? `${snapshot.alerts.length} alerta(s)` : "Operacao estavel"}
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
                <h4>Producao</h4>
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
                <span class="muted">Tempo medio de producao</span>
                <strong>${snapshot.productionAverageTimeLabel}</strong>
              </article>
              <article class="dashboard-stat-card">
                <span class="muted">Ordens concluidas</span>
                <strong>${snapshot.productionCompletedCount}</strong>
              </article>
            </div>
          </section>

          <section class="dashboard-block">
            <div class="dashboard-block-header">
              <div>
                <h4>Pedidos Recentes</h4>
                <p class="muted">Pedidos mais relevantes com status, prioridade e atalhos de acao.</p>
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
                <p class="muted">Pedidos por periodo com leitura rapida de volume e ticket medio.</p>
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
                <h4>Pipeline da Producao</h4>
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
                <p class="muted">Itens baixos ou zerados que podem afetar a operacao.</p>
              </div>
              <button class="ghost-button" type="button" data-dashboard-module="inventory">Ir para modulo</button>
            </div>
            <div class="dashboard-list">
              ${
                snapshot.criticalStock.length
                  ? snapshot.criticalStock.map((item) => `
                    <article class="dashboard-list-item dashboard-stock-alert ${item.level}">
                      <div>
                        <strong>${escapeHtml(item.name)}</strong>
                        <span class="muted">Saldo ${formatQuantity(item.currentStock)} ${escapeHtml(item.unit)} | Minimo ${formatQuantity(item.minimumStock)} ${escapeHtml(item.unit)}</span>
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
  const completedProduction = production.filter((item) => item.status === "completed");
  const inProgressProduction = production.filter((item) => item.status === "in_progress");
  const openServiceOrders = serviceOrders.filter((item) => !["completed", "cancelled"].includes(item.status));

  return {
    totalSales,
    finalizedSalesCount: finalizedSales.length,
    totalPurchases,
    openPurchasesCount: openPurchases.length,
    completedProductionCount: completedProduction.length,
    inProgressProductionCount: inProgressProduction.length,
    criticalStockCount: criticalStock.length,
    openServiceOrdersCount: openServiceOrders.length,
    recentSales: finalizedSales.slice(0, 8),
    production,
    criticalStock,
    purchases,
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

  return `
    <article class="sales-document-sheet">
      <header class="sales-document-header">
        <div>
          <h2>Relatorios Gerenciais</h2>
          <p>Periodo de ${escapeHtml(formatDate(state.reportsFilters.from))} ate ${escapeHtml(formatDate(state.reportsFilters.to))}</p>
        </div>
        <div class="sales-document-meta">
          <strong>${formatDateTime(new Date().toISOString())}</strong>
        </div>
      </header>
      <section class="sales-document-banner">
        <p>Vendas finalizadas: ${formatCurrency(snapshot.totalSales)} • Compras registradas: ${formatCurrency(snapshot.totalPurchases)} • Producao concluida: ${snapshot.completedProductionCount}</p>
      </section>
      <h3>Vendas recentes</h3>
      <table class="sales-document-items-table">
        <thead><tr><th>Numero</th><th>Cliente</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>${salesRows || `<tr><td colspan="4">Sem vendas no periodo.</td></tr>`}</tbody>
      </table>
      <h3>Producao</h3>
      <table class="sales-document-items-table">
        <thead><tr><th>Ordem</th><th>Produto</th><th>Quantidade</th><th>Status</th></tr></thead>
        <tbody>${productionRows || `<tr><td colspan="4">Sem ordens no periodo.</td></tr>`}</tbody>
      </table>
    </article>
  `;
}

function renderReportsModule() {
  if (!hasPermission("reports", "view")) {
    return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de relatorios.");
  }

  const snapshot = buildReportsSnapshot();

  return `
    <section class="module-panel">
      <div class="module-head">
        <div>
          <p class="eyebrow muted">Analise gerencial</p>
          <h3>Relatorios</h3>
          <p class="muted">Consolidado operacional de vendas, producao, compras, estoque e ordens de servico.</p>
        </div>
        <div class="module-head-actions">
          <button class="ghost-button" type="button" data-reports-refresh>Atualizar</button>
          <button class="primary-button" type="button" data-reports-export>Exportar PDF</button>
        </div>
      </div>

      <form id="reports-filter-form" class="table-actions reports-filter-grid">
        <label>De<input type="date" name="from" value="${escapeHtml(state.reportsFilters.from)}" /></label>
        <label>Ate<input type="date" name="to" value="${escapeHtml(state.reportsFilters.to)}" /></label>
        <div class="form-actions-row">
          <button class="primary-button" type="submit">Aplicar periodo</button>
        </div>
      </form>

      <div class="summary-grid">
        ${renderKpiCard({ label: "Vendas Finalizadas", value: formatCurrency(snapshot.totalSales), note: `${snapshot.finalizedSalesCount} venda(s) no periodo`, icon: "◨", tone: "green" })}
        ${renderKpiCard({ label: "Compras", value: formatCurrency(snapshot.totalPurchases), note: `${snapshot.openPurchasesCount} solicitacao(oes) em aberto`, icon: "◧", tone: "amber" })}
        ${renderKpiCard({ label: "Producao Concluida", value: snapshot.completedProductionCount, note: `${snapshot.inProgressProductionCount} ordem(ns) em andamento`, icon: "◭", tone: "blue" })}
        ${renderKpiCard({ label: "Estoque Critico", value: snapshot.criticalStockCount, note: `${snapshot.openServiceOrdersCount} OS abertas`, icon: "◬", tone: "red" })}
      </div>

      <div class="reports-grid">
        <section class="table-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Vendas recentes</h4>
              <p class="muted">Ultimas vendas finalizadas dentro do periodo.</p>
            </div>
          </div>
          ${renderTable(
            ["Numero", "Cliente", "Total", "Status"],
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
              <h4>Producao</h4>
              <p class="muted">Ordens planejadas, em andamento e concluidas.</p>
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
              <p class="muted">Itens abaixo do minimo para acompanhamento imediato.</p>
            </div>
          </div>
          ${renderTable(
            ["Produto", "Atual", "Minimo", "Unidade"],
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
              <h4>Ordens de servico abertas</h4>
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
    button.addEventListener("click", () => {
      state.dashboardRange = button.dataset.dashboardRange || "30d";
      if (state.dashboardRange !== "custom") {
        renderActiveModule();
      } else {
        if (!state.dashboardCustomRange.to) {
          state.dashboardCustomRange.to = new Date().toISOString().slice(0, 10);
        }
        if (!state.dashboardCustomRange.from) {
          state.dashboardCustomRange.from = getDateShiftedIso(state.dashboardCustomRange.to, -29);
        }
        renderActiveModule();
      }
    });
  });

  document.querySelector("#dashboard-range-from")?.addEventListener("change", (event) => {
    state.dashboardRange = "custom";
    state.dashboardCustomRange.from = event.currentTarget.value;
    renderActiveModule();
  });

  document.querySelector("#dashboard-range-to")?.addEventListener("change", (event) => {
    state.dashboardRange = "custom";
    state.dashboardCustomRange.to = event.currentTarget.value;
    renderActiveModule();
  });

  document.querySelector("[data-dashboard-refresh]")?.addEventListener("click", async () => {
    await refreshDashboardData();
  });

  document.querySelectorAll("[data-dashboard-module]").forEach((button) => {
    button.addEventListener("click", () => {
      const moduleKey = button.dataset.dashboardModule;
      if (!moduleKey || !hasPermission(moduleKey, "view")) return;
      state.activeModule = moduleKey;
      renderModuleNav();
      renderActiveModule();
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

function openSaleFromDashboard(saleId) {
  const sale = (state.moduleData.sales || []).find((item) => item.id === saleId);
  if (!sale || !hasPermission("sales", "view")) return;

  state.salesDraft = hydrateSalesDraft(sale);
  state.openAccordionKey = "sales-form";
  state.activeModule = "sales";
  renderModuleNav();
  renderActiveModule();
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
  const estimatedCosts = filteredPurchases
    .filter(({ metadata }) => ["purchase_completed", "completed"].includes(metadata.status))
    .reduce((total, entry) => total + Number(entry.metadata.purchaseDetails.total_amount || 0), 0);
  const pendingPayables = filteredPurchases
    .filter(({ metadata }) => ["pending", "in_analysis", "approved", "in_purchase", "purchase_completed"].includes(metadata.status))
    .reduce((total, entry) => total + Number(entry.metadata.purchaseDetails.total_amount || 0), 0);
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
        title: "Producao atrasada",
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
        description: `${lowStockItems.length} item(ns) estao abaixo do minimo configurado.`,
        actionLabel: "Ir para modulo",
        module: "inventory",
      }
      : null,
    machineStoppedCount
      ? {
        tone: "danger",
        title: "Maquina ou etapa parada",
        description: `${machineStoppedCount} item(ns) de usinagem possuem etapa bloqueada.`,
        actionLabel: "Resolver",
        module: "machining",
      }
      : null,
    pendingPayables
      ? {
        tone: "warning",
        title: "Pagamentos pendentes",
        description: `${formatCurrency(pendingPayables)} em compras aguardando fechamento.`,
        actionLabel: "Ir para modulo",
        module: "purchases",
      }
      : null,
  ].filter(Boolean);
  const financeBuckets = buildDashboardBucketSeries(filteredSales, filteredPurchases, range);
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
        variation: openOrdersCount ? `↓ ${openOrdersCount} requer acao` : "↑ Operacao sob controle",
        note: "Pedidos ainda nao encerrados",
        icon: "PD",
        tone: openOrdersCount ? "amber" : "green",
      },
      {
        label: "Producao em andamento",
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
        { name: "Pecas produzidas", color: "#0f766e", values: productionBuckets.quantities },
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
      purchases,
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
  if (dayCount === 7) return "Ultimos 7 dias";
  if (dayCount === 30) return "Ultimos 30 dias";
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
  if (["completed", "concluida"].includes(normalized)) return "completed";
  if (["in_progress", "em producao", "qualidade"].includes(normalized)) return "in_progress";
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

function buildDashboardBucketSeries(filteredSales, filteredPurchases, range) {
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

  filteredPurchases.forEach(({ purchase, metadata }) => {
    const index = findDashboardBucketIndex(metadata.purchaseDetails.purchase_date || purchase.created_at, buckets);
    if (index >= 0) {
      costs[index] += Number(metadata.purchaseDetails.total_amount || 0);
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
    { key: "corte", label: "Corte", count: 0, tone: "amber", note: "Entrada e preparacao" },
    { key: "usinagem", label: "Usinagem", count: 0, tone: "blue", note: "Execucao em maquina" },
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
  const liveIndex = steps.findIndex((step) => ["Pendente", "Em Producao", "Qualidade"].includes(step.status));
  if (liveIndex === 0) return "corte";
  if (liveIndex >= 2) return "montagem";
  if (liveIndex === 1) return "usinagem";
  return normalizedStatus === "in_progress" ? "usinagem" : "corte";
}

function buildDashboardFinancialSummary({ pendingPayables, pendingReceivables, revenue, estimatedCosts, sales, purchases }) {
  const forecast7 = buildDashboardForecast(sales, purchases, 7);
  const forecast30 = buildDashboardForecast(sales, purchases, 30);
  return [
    {
      label: "Contas a pagar",
      value: pendingPayables,
      note: "Compras e solicitacoes em aberto",
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

function buildDashboardForecast(sales, purchases, daysAhead) {
  const now = new Date();
  const end = endOfDashboardDay(addDashboardDays(now, daysAhead));
  const projectedRevenue = sales.reduce((total, { sale, metadata }) => {
    if (metadata.status !== "finalized") return total;
    const date = parseDashboardDate(sale.delivery_date || sale.sale_date || sale.created_at);
    if (!date || date.getTime() < now.getTime() || date.getTime() > end.getTime()) return total;
    return total + Number(metadata.total || 0);
  }, 0);
  const projectedCosts = purchases.reduce((total, { purchase, metadata }) => {
    if (metadata.status === "cancelled") return total;
    const date = parseDashboardDate(metadata.purchaseDetails.purchase_date || purchase.created_at);
    if (!date || date.getTime() < now.getTime() || date.getTime() > end.getTime()) return total;
    return total + Number(metadata.purchaseDetails.total_amount || 0);
  }, 0);
  return projectedRevenue - projectedCosts;
}

function renderVpsControlModule() {
  if (!isTiUser()) {
    return noPermissionTemplate("Acesso nao autorizado");
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
          <p class="muted">Monitoramento, acoes operacionais, logs, seguranca, backup, banco e auditoria em uma unica tela.</p>
        </div>
        <div class="module-head-actions">
          <button class="ghost-button secondary-surface-button" type="button" data-vps-refresh>Atualizar painel</button>
          <button class="primary-button" type="button" data-vps-action="generate_backup" data-vps-target-type="backup" data-vps-target-name="manual" data-vps-confirm="Gerar backup manual agora?">Gerar Backup Manual</button>
        </div>
      </div>

      <div class="summary-grid vps-summary-grid">
        ${renderKpiCard({ label: "Supabase", value: supabaseConfigured ? "Conectado" : "Nao configurado", note: supabaseConfigured ? "Conexao principal do sistema ativa" : "Verifique supabase/config.js", icon: "SB", tone: supabaseConfigured ? "green" : "red" })}
        ${renderKpiCard({ label: "Status Geral", value: formatVpsStatusLabel(summary.server_status), note: "Saude consolidada da VPS", icon: "▣", tone: summary.server_status === "healthy" ? "green" : "red" })}
        ${renderKpiCard({ label: "CPU", value: `${formatPercent(summary.cpu_usage)}%`, note: "Uso atual do processador", icon: "CPU", tone: getMetricTone(summary.cpu_usage, 75, 90) })}
        ${renderKpiCard({ label: "Memoria", value: `${formatPercent(summary.memory_usage)}%`, note: "Consumo de RAM", icon: "RAM", tone: getMetricTone(summary.memory_usage, 75, 90) })}
        ${renderKpiCard({ label: "Disco", value: `${formatPercent(summary.disk_usage)}%`, note: "Ocupacao do disco raiz", icon: "SSD", tone: getMetricTone(summary.disk_usage, 80, 92) })}
        ${renderKpiCard({ label: "Uptime", value: escapeHtml(summary.uptime_label || "-"), note: "Tempo em operacao", icon: "UP", tone: "blue" })}
        ${renderKpiCard({ label: "IP", value: escapeHtml(summary.server_ip || "-"), note: "Endereco principal", icon: "IP", tone: "blue" })}
        ${renderKpiCard({ label: "Sistema", value: escapeHtml(summary.operating_system || "-"), note: "Sistema operacional da VPS", icon: "OS", tone: "blue" })}
        ${renderKpiCard({ label: "Ultima Atualizacao", value: formatDateTime(summary.updated_at), note: "Ultimo snapshot recebido", icon: "CLK", tone: "blue" })}
      </div>

      <div class="vps-layout">
        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Status dos Servicos</h4>
              <p class="muted">${onlineServices}/${services.length || 0} servicos principais online.</p>
            </div>
          </div>
          <div class="vps-service-grid">
            ${services.length ? services.map(renderVpsServiceCard).join("") : `<div class="empty-state">Nenhum servico monitorado.</div>`}
          </div>
        </section>

        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Logs do Servidor e da Aplicacao</h4>
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
              <h4>Aplicacoes Hospedadas</h4>
              <p class="muted">ERP, API e outros projetos mapeados na VPS.</p>
            </div>
          </div>
          <div class="vps-application-grid">
            ${applications.length ? applications.map(renderVpsApplicationCard).join("") : `<div class="empty-state">Nenhuma aplicacao cadastrada.</div>`}
          </div>
        </section>

        <section class="table-card vps-card">
          <div class="dashboard-block-header">
            <div>
              <h4>Seguranca da VPS</h4>
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
              <strong>Usuarios SSH</strong>
              <div class="permission-tag-list">${(security.ssh_users || []).length ? security.ssh_users.map((item) => `<span class="permission-tag">${escapeHtml(item.user || "-")}</span>`).join("") : `<span class="muted">Sem usuarios listados.</span>`}</div>
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
              <p class="muted">Historico, status atual e operacoes manuais com confirmacao.</p>
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
              <p class="muted">Status operacional, ultimas referencias de backup, acoes do banco e inventario das tabelas.</p>
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
                              <td>${column.is_nullable ? "Sim" : "Nao"}</td>
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
              <p class="muted">Historico de acoes executadas pelo TI nesta area.</p>
            </div>
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Acao</th>
                  <th>Servico</th>
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
                `).join("") : `<tr><td colspan="5">Nenhuma acao auditada.</td></tr>`}
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
      <p class="muted">Ultima atualizacao: ${formatDateTime(app.last_updated_at)}</p>
      <div class="form-actions-row">
        <button class="inline-button" type="button" data-vps-action="restart_application" data-vps-target-type="application" data-vps-target-name="${escapeHtml(app.app_name || "")}">Reiniciar Aplicacao</button>
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
    return noPermissionTemplate("Voce nao tem permissao para acessar esta area.");
  }

  const users = state.moduleData.users || [];
  const roles = state.permissionRoles || [];
  const isRoleFormOpen = state.openAccordionKey === "permission-role-form";
  const activeUsers = users.filter((user) => user.is_active).length;
  const inactiveUsers = users.filter((user) => !user.is_active).length;
  const criticalUsers = users.filter((user) => ["TI", "ADMNISTRADOR", "ADMINISTRADOR"].includes(user.role)).length;

  return `
    <section class="module-panel permissions-module">
      <div class="module-head permissions-hero-head">
        <div>
          <p class="eyebrow muted">Seguranca e governanca</p>
          <h3>Gerenciamento de Permissoes</h3>
          <p class="muted">Configure papeis, permissoes e funcionarios</p>
        </div>
        <div class="module-head-actions">
          <button class="secondary-button" type="button" data-open-employee-modal>Cadastrar Funcionario</button>
          <button class="primary-button" type="button" data-new-permission-role>+ Novo Papel</button>
        </div>
      </div>

      <div class="summary-grid permissions-summary-grid">
        ${renderKpiCard({ label: "Papeis de Permissao", value: roles.length, note: "Perfis ativos no ERP", icon: "◩", tone: "blue" })}
        ${renderKpiCard({ label: "Funcionarios Ativos", value: activeUsers, note: "Usuarios habilitados para operar", icon: "◎", tone: "green" })}
        ${renderKpiCard({ label: "Acessos Criticos", value: criticalUsers, note: "TI e ADMINISTRADOR", icon: "◪", tone: "amber" })}
        ${renderKpiCard({ label: "Funcionarios Inativos", value: inactiveUsers, note: inactiveUsers ? "Usuarios desativados no cadastro" : "Nenhum registro inativo", icon: "◫", tone: "red" })}
      </div>

      <div class="permissions-layout">
        ${
          isRoleFormOpen
            ? `
              <section class="module-subpanel permission-role-form-panel">
                <div class="module-head compact-head">
                  <div>
                    <p class="eyebrow muted">Cadastro de papel</p>
                    <h3>${state.permissionRoleDraft.id ? "Editar Papel de Permissao" : "Novo Papel de Permissao"}</h3>
                  </div>
                </div>
                <form id="permission-role-form" class="permissions-role-form">
                  <input type="hidden" name="role_id" value="${escapeHtml(state.permissionRoleDraft.id)}" />
                  <label>
                    Nome do Papel *
                    <input type="text" name="name" value="${escapeHtml(state.permissionRoleDraft.name)}" placeholder="Ex.: VENDEDOR" required />
                  </label>
                  <label>
                    Descricao
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
            <h3>Funcionarios Cadastrados</h3>
          </div>
        </div>
        ${
          users.length
            ? `
              <div class="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Funcionario</th>
                      <th>Codigo</th>
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
            : `<div class="empty-state">Nenhum funcionario cadastrado. Clique em "Cadastrar Funcionario" para comecar.</div>`
        }
      </section>

      <section class="module-subpanel">
        <div class="module-head compact-head">
          <div>
            <p class="eyebrow muted">Vinculos de acesso</p>
            <h3>Atribuir Permissoes a Usuarios</h3>
          </div>
        </div>
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Departamento</th>
                <th>Papel de Permissao</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              ${
                users.length
                  ? users.map(renderPermissionAssignmentRow).join("")
                  : `<tr><td colspan="5"><div class="empty-state">Nenhum usuario disponivel.</div></td></tr>`
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
    const normalizedRoleName = String(roleDraft.name || "").trim().toUpperCase();
    const lockedPermissions = permission.module_key === "permissions"
      && !["TI", "ADMNISTRADOR", "ADMINISTRADOR"].includes(normalizedRoleName);
    const lockedVpsModule = permission.module_key === "vps"
      && normalizedRoleName !== "TI";
    const lockedDashboardEdit = permission.module_key === "dashboard"
      && !["TI", "ADMNISTRADOR", "ADMINISTRADOR"].includes(normalizedRoleName);
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
                ? "Perfis operacionais podem visualizar, mas nao editar o dashboard"
                : "Controle de leitura e alteracao"
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
          <p class="muted">${escapeHtml(role.description || "Sem descricao cadastrada.")}</p>
        </div>
        ${role.is_system ? `<span class="status-chip chip-blue">Sistema</span>` : ""}
      </div>
      <div class="permission-tag-list">
        ${activeTags || `<span class="muted">Nenhuma permissao marcada.</span>`}
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
        <div class="table-inline-copy muted">${escapeHtml(user.permission_role_name || "Sem papel de permissao")}</div>
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
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Cadastrar funcionario" data-modal-card>
        <div class="module-head compact-head">
          <div>
            <p class="eyebrow muted">Cadastro de funcionario</p>
            <h3>${state.employeeFormMode === "edit" ? "Editar Funcionario" : "Cadastrar Funcionario"}</h3>
          </div>
        </div>
        <form id="employee-form" class="permissions-employee-form">
          <input type="hidden" name="user_id" value="${escapeHtml(state.employeeDraft.id)}" />
          <div class="product-form-row">
            <label>Codigo de Acesso *<input type="text" name="login_code" maxlength="3" pattern="[0-9]{3}" value="${escapeHtml(state.employeeDraft.login_code)}" required /></label>
            <label>Nome Completo *<input type="text" name="full_name" value="${escapeHtml(state.employeeDraft.full_name)}" required /></label>
          </div>
          <div class="product-form-row">
            <label>Email<input type="email" name="email" value="${escapeHtml(state.employeeDraft.email)}" placeholder="email@empresa.com" /></label>
            <label>Senha ${state.employeeFormMode === "edit" ? "" : "*"}<input type="password" name="password" placeholder="${state.employeeFormMode === "edit" ? "Nova senha do funcionario" : "Minimo 6 caracteres"}" ${state.employeeFormMode === "edit" ? "" : "required"} /></label>
          </div>
          ${state.employeeFormMode === "edit" ? `<p class="hint">ADMINISTRADOR e TI podem redefinir a senha do funcionario por este formulario. Deixe em branco para manter a senha atual.</p>` : ""}
          <div class="product-form-row">
            <label>Departamento<select name="department" required>${departmentOptions}</select></label>
            <label>Papel de Permissao<select name="permission_role_id" required><option value="">Selecione</option>${permissionRoleOptions}</select></label>
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
    return [item.code, item.name, item.description, item.supplier].some((value) =>
      String(value || "").toLowerCase().includes(term)
    );
  });
  const totalStructureCost = calculateBomDraftTotal();

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
        ${renderKpiCard({
          label: "Pecas e Materiais",
          value: materials.length,
          note: materials.length ? "Base tecnica cadastrada" : "Nenhum item cadastrado",
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
                  ? renderBomMaterialsForm()
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
                  <input id="bom-material-search" type="text" placeholder="Buscar pecas..." value="${escapeHtml(state.bomMaterialSearch)}" />
                </label>
              </div>
              ${renderTable(
                ["Codigo", "Nome", "Descricao", "Categoria", "Unidade", "Custo", "Fornecedor", "Estoque", "Minimo", "Status", "Acao"],
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
                : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
            }
            <section class="module-subpanel">
              <div class="module-head compact-head">
                <div>
                  <p class="eyebrow muted">Estruturas ativas e rascunhos</p>
                  <h3>Conjuntos BOM</h3>
                </div>
              </div>
              ${renderTable(
                ["Codigo", "Nome", "Versao", "Lote", "Status", "Custo Total", "Itens", "Instrucoes", "Acao"],
                structures.map((item) => [
                  item.code,
                  item.name,
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
        ${renderKpiCard({
          label: "Movimentacoes",
          value: movements.length,
          note: movements.length ? "Historico total registrado" : "Nenhuma movimentacao registrada",
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
          label: "Saidas",
          value: exitCount,
          note: exitCount ? "Baixas de estoque realizadas" : "Sem saidas registradas",
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
                          <td>${formatShortId(item.id)}</td>
                          <td>
                            <strong>${item.product_name}</strong>
                            <div class="table-inline-copy muted">${item.product_code || "-"}</div>
                          </td>
                          <td>${inventoryMovementTypeCell(item.movement_type)}</td>
                          <td>${formatQuantity(item.quantity)}</td>
                          <td>
                            ${item.notes || "-"}
                            <div class="table-inline-copy muted">Serie ${item.machine_serial || "-"} | Lote ${item.batch || "-"}</div>
                          </td>
                          <td>${item.moved_by_name ? escapeHtml(item.moved_by_name) : "-"}</td>
                          <td>${formatDateTime(item.created_at)}</td>
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
}

function renderAuditModule() {
  if (!hasPermission("audit", "view")) {
    return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de auditoria.");
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
          <p class="muted">Registros unificados por modulo com filtros operacionais e rastreabilidade completa.</p>
        </div>
        <div class="module-head-actions">
          <button class="ghost-button" type="button" data-audit-refresh>Atualizar</button>
          <button class="primary-button" type="button" data-audit-export-pdf>Exportar PDF</button>
        </div>
      </div>

      <div class="summary-grid">
        ${renderKpiCard({ label: "Logs carregados", value: logs.length, note: logs.length ? "Ultimos 500 registros filtrados" : "Nenhum registro encontrado", icon: "◰", tone: "blue" })}
        ${renderKpiCard({ label: "Criticos", value: logs.filter((item) => item.nivel === "Critico").length, note: "Eventos de alto impacto", icon: "!", tone: "red" })}
        ${renderKpiCard({ label: "Atencao", value: logs.filter((item) => item.nivel === "Atencao").length, note: "Eventos com alerta operacional", icon: "•", tone: "amber" })}
        ${renderKpiCard({ label: "Modulos ativos", value: new Set(logs.map((item) => item.modulo).filter(Boolean)).size, note: "Categorias presentes no filtro atual", icon: "⊞", tone: "green" })}
      </div>

      <form id="audit-filter-form" class="table-actions audit-filter-grid">
        <label>Modulo<select name="module"><option value="all">Todos</option>${renderOptions(moduleOptions, state.auditFilters.module)}</select></label>
        <label>Usuario<select name="user"><option value="all">Todos</option>${renderOptions(userOptions, state.auditFilters.user)}</select></label>
        <label>Acao<select name="action"><option value="all">Todas</option>${renderOptions(actionOptions, state.auditFilters.action)}</select></label>
        <label>Nivel<select name="level">${renderOptions([
          { value: "all", label: "Todos" },
          { value: "Informativo", label: "Informativo" },
          { value: "Atencao", label: "Atencao" },
          { value: "Critico", label: "Critico" },
        ], state.auditFilters.level)}</select></label>
        <label>Data inicial<input name="date_from" type="date" value="${escapeHtml(state.auditFilters.date_from)}" /></label>
        <label>Data final<input name="date_to" type="date" value="${escapeHtml(state.auditFilters.date_to)}" /></label>
        <label class="audit-filter-search">Busca textual<input name="search" type="text" placeholder="Buscar por item, descricao, usuario ou acao..." value="${escapeHtml(state.auditFilters.search)}" /></label>
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
                <th>Modulo</th>
                <th>Acao</th>
                <th>Usuario</th>
                <th>Item</th>
                <th>Nivel</th>
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
                  <div><span>Modulo</span><strong>${escapeHtml(getModuleLabel(selectedLog.modulo))}</strong></div>
                  <div><span>Usuario</span><strong>${escapeHtml(selectedLog.usuario_nome || "-")}</strong></div>
                  <div><span>Perfil</span><strong>${escapeHtml(selectedLog.usuario_perfil || "-")}</strong></div>
                  <div><span>Data/Hora</span><strong>${escapeHtml(formatDateTime(selectedLog.created_at))}</strong></div>
                  <div><span>IP</span><strong>${escapeHtml(selectedLog.ip || "-")}</strong></div>
                  <div><span>Nivel</span><strong>${escapeHtml(selectedLog.nivel || "-")}</strong></div>
                  <div><span>Item afetado</span><strong>${escapeHtml(selectedLog.item_afetado || "-")}</strong></div>
                  <div><span>Entidade</span><strong>${escapeHtml(selectedLog.entidade_tipo || "-")} ${escapeHtml(selectedLog.entidade_id || "")}</strong></div>
                </div>
                <section class="form-section">
                  <h4>Descricao</h4>
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
    return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de usinagem.");
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
  const inProduction = pieces.filter((piece) => piece.status === "Em Producao").length;
  const finished = pieces.filter((piece) => piece.status === "Finalizada").length;

  return `
    <section class="module-panel machining-module">
      <div class="module-head machining-head">
        <div>
          <p class="eyebrow muted">Usinagem</p>
          <h3>Pecas &amp; Processos de Usinagem</h3>
          <p class="muted">${pieces.length} peca(s) cadastrada(s)</p>
        </div>
        <div class="module-head-actions">
          ${canEdit ? `
            <button
              class="primary-button machining-create-button ${isFormOpen ? "is-open" : ""}"
              type="button"
              data-machining-toggle-form
            >
              <span>+ Nova Peca</span>
              <span class="production-toggle-icon">${isFormOpen ? "▴" : "▾"}</span>
            </button>
          ` : ""}
        </div>
      </div>

      <div class="summary-grid">
        ${renderKpiCard({
          label: "Pecas Cadastradas",
          value: pieces.length,
          note: pieces.length ? "Cadastro tecnico pronto para producao" : "Nenhuma peca cadastrada",
          icon: "◈",
          tone: "blue",
        })}
        ${renderKpiCard({
          label: "Em Cadastro",
          value: inRegistration,
          note: inRegistration ? "Pecas aguardando envio para producao" : "Sem cadastro pendente",
          icon: "⊞",
          tone: "amber",
        })}
        ${renderKpiCard({
          label: "Em Producao",
          value: inProduction,
          note: inProduction ? "Ordens em execucao por etapas" : "Nenhuma ordem ativa",
          icon: "◭",
          tone: "green",
        })}
        ${renderKpiCard({
          label: "Finalizadas",
          value: finished,
          note: finished ? "Pecas ja integradas ao estoque" : "Sem pecas concluidas",
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
          : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
      }

      <div class="table-actions machining-filters-row">
        <label class="search-input-shell">
          <span class="search-input-icon">⌕</span>
          <input
            id="machining-search-input"
            type="text"
            placeholder="Buscar por codigo, nome ou material..."
            value="${escapeHtml(state.machiningSearch)}"
          />
        </label>

        <label>
          Filtro
          <select id="machining-status-filter">
            ${renderOptions([
              { value: "all", label: "Todas" },
              { value: "Cadastro", label: "Cadastro" },
              { value: "Em Producao", label: "Em Producao" },
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
                  <strong>Nenhuma peca encontrada</strong>
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
        <p class="eyebrow muted">Nova Peca</p>
        <h4>${state.machiningDraft.edit_id ? "Editar Peca" : "Nova Peca"}</h4>
        <p class="muted">Dados da peca e processos de fabricacao em sequencia controlada.</p>
      </div>
      <div class="machining-form-summary">
        <span>${processCount} processo(s)</span>
        <strong>${formatMinutesLabel(totalMinutes)}</strong>
      </div>
    </div>

    <form id="machining-form" class="machining-form-grid">
      <input type="hidden" name="edit_id" value="${escapeHtml(state.machiningDraft.edit_id)}" />

      <div class="form-section">
        <h4>Dados da peca</h4>
        <div class="machining-form-row">
          <label>
            Codigo *
            <input name="code" type="text" required value="${escapeHtml(state.machiningDraft.code)}" />
          </label>
          <label>
            Nome da Peca *
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
            Descricao
            <textarea name="description" placeholder="Detalhes tecnicos da peca">${escapeHtml(state.machiningDraft.description)}</textarea>
          </label>
        </div>
      </div>

      <div class="form-section">
        <div class="machining-process-header">
          <div>
            <h4>Processos de Fabricacao</h4>
            <p class="muted">Cadastre ate 8 etapas na ordem em que a producao deve acontecer.</p>
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
          Maquina
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
          Observacoes
          <textarea data-machining-process-field="notes" data-machining-process-index="${index}" placeholder="Informacoes operacionais">${escapeHtml(process.notes)}</textarea>
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
            <span>${escapeHtml(piece.material || "Material nao informado")}</span>
            <span>${processCount} processo(s)</span>
            <span>${formatMinutesLabel(piece.total_minutes)}</span>
          </div>

          <div class="machining-piece-kpis">
            <div>
              <span>Codigo</span>
              <strong>${escapeHtml(piece.code)}</strong>
            </div>
            <div>
              <span>Material</span>
              <strong>${escapeHtml(piece.material || "-")}</strong>
            </div>
            <div>
              <span>Ultima producao</span>
              <strong>${latestOrder ? escapeHtml(latestOrder.lot) : "Nao iniciada"}</strong>
            </div>
            <div>
              <span>Etapa atual</span>
              <strong>${latestOrder ? escapeHtml(getMachiningCurrentStageLabel(latestOrder)) : "Cadastro"}</strong>
            </div>
          </div>
        </div>

        <div class="machining-piece-actions">
          ${canEdit ? `<button class="primary-button" type="button" data-machining-start-production="${piece.id}">Enviar para Producao</button>` : ""}
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
        <h4>Iniciar producao por etapas</h4>
        <p class="muted">Toda nova producao exige quantidade e lote obrigatorios.</p>
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
        <button class="primary-button" type="submit">Iniciar Producao</button>
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
        <h4>Detalhes da peca</h4>
        <p class="muted">${escapeHtml(piece.description || "Sem descricao cadastrada.")}</p>
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
        <h4>Producao atual</h4>
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
            : `<div class="empty-state">Nenhuma producao iniciada para esta peca.</div>`
        }
      </section>
    </div>

    <section class="form-section">
      <h4>Historico de estoque</h4>
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
          : `<div class="empty-state">A peca entra no estoque somente apos concluir todas as etapas.</div>`
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
          ${escapeHtml(process.machine || "Maquina nao informada")} •
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
          ${escapeHtml(step.machine || "Maquina nao informada")} •
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
    return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de producao.");
  }

  const canEdit = hasPermission("production", "edit");
  const isFormOpen = state.openAccordionKey === "production-order-form";
  const products = state.moduleData.products || [];
  const machiningOrders = getProductionMachiningOrders();
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
          <p class="eyebrow muted">Producao</p>
          <h3>Ordens de producao</h3>
          <p class="muted">Gerencie ordens de producao.</p>
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
                    <h4>${state.productionDraft.edit_id ? "Editar Ordem de Producao" : "Nova Ordem de Producao"}</h4>
                    <p class="muted">Fluxo em accordion com integracao aos produtos cadastrados.</p>
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
                      Codigo
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
                      Observacoes
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
            : `<div class="empty-state">Cadastre ao menos um produto no modulo Produtos para abrir novas ordens de producao.</div>`
          : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
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
              { value: "completed", label: "Concluida" },
              { value: "cancelled", label: "Cancelada" },
            ], state.productionStatusFilter)}
          </select>
        </label>
      </div>

      ${renderProductionMachiningSection(machiningOrders)}

      <div class="table-card production-table-card">
        ${
          filteredOrders.length
            ? `
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Codigo</th>
                    <th>Quantidade</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Responsavel</th>
                    <th>Datas</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredOrders.map((item) => renderProductionRow(item, canEdit)).join("")}
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

function renderProductionRow(item, canEdit) {
  const metadata = getProductionOrderMetadata(item);

  return `
    <tr>
      <td>
        <strong>${escapeHtml(item.product_name || "-")}</strong>
        <div class="table-inline-copy muted">${escapeHtml(metadata.lotNumber || "Sem lote")}</div>
      </td>
      <td>
        <strong>${escapeHtml(item.order_number || "-")}</strong>
        <div class="table-inline-copy muted">${escapeHtml(item.product_code || "Sem codigo do produto")}</div>
      </td>
      <td>${formatQuantity(item.batch_size)}</td>
      <td>${productionPriorityCell(metadata.priority)}</td>
      <td>${statusCell(item.status || "planned")}</td>
      <td>${escapeHtml(metadata.responsibleName || "-")}</td>
      <td>
        <strong>${formatDate(item.planned_start)}</strong>
        <div class="table-inline-copy muted">Ate ${formatDate(item.planned_end)}</div>
      </td>
      <td>${renderProductionActionCell(item, canEdit)}</td>
    </tr>
  `;
}

function renderProductionActionCell(item, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  return `
    <div class="action-button-group">
      ${
        item.status === "planned"
          ? `<button class="primary-button" type="button" data-production-start-id="${item.id}">Iniciar</button>`
          : ""
      }
      <button class="inline-button" type="button" data-production-edit-id="${item.id}">Editar</button>
      <button class="inline-button danger-button" type="button" data-production-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderProductionMachiningSection(machiningOrders) {
  return `
    <section class="production-machining-section">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">USINAGEM POR ETAPAS</p>
          <h3>Ordens agrupadas por peca</h3>
          <p class="muted">Fluxo sequencial com liberacao automatica da proxima etapa e entrada no estoque ao concluir.</p>
        </div>
      </div>

      <div class="production-machining-list">
        ${
          machiningOrders.length
            ? machiningOrders.map((entry) => renderProductionMachiningCard(entry)).join("")
            : `<div class="empty-state">Nenhuma ordem de usinagem enviada para producao.</div>`
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
          <p class="muted">${entry.order.steps.length} etapa(s) • ${completedSteps} concluida(s)</p>
        </div>
        <div class="production-machining-progress">
          <strong>${progress}%</strong>
          <span>${completedSteps}/${entry.order.steps.length} concluidas</span>
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
          <div><span>Codigo da Ordem</span><strong>${escapeHtml(order.order_number)}</strong></div>
          <div><span>Status</span><strong>${escapeHtml(step.status === "Bloqueada" ? "Pendente" : step.status)}</strong></div>
          <div><span>Nome da Etapa</span><strong>${escapeHtml(step.name)}</strong></div>
          <div><span>Operador</span><strong>${escapeHtml(step.completed_by || step.operator || order.operator || "-")}</strong></div>
          <div><span>Data de Inicio</span><strong>${escapeHtml(step.started_at ? formatDateTime(step.started_at) : "-")}</strong></div>
          <div><span>Peca</span><strong>${escapeHtml(piece.name)}</strong></div>
          <div><span>Processo</span><strong>${escapeHtml(step.name)}</strong></div>
          <div><span>Maquina</span><strong>${escapeHtml(step.machine || "-")}</strong></div>
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
    return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de clientes.");
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
                    <p class="muted">Cadastro comercial no mesmo padrao visual do ERP.</p>
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
                      Endereco
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
                      Observacoes
                      <textarea name="notes" placeholder="Anotacoes sobre o cliente">${escapeHtml(state.customerDraft.notes)}</textarea>
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
          : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
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
    return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de vendas.");
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
              <span>Novo Orcamento</span>
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
                    <h4>${state.salesDraft.edit_id ? "Editar Venda" : state.salesDraft.status === "quote" ? "Novo Orcamento" : "Nova Venda"}</h4>
                    <p class="muted">Fluxo comercial com integracao entre clientes, produtos e producao.</p>
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
                      Endereco
                      <input name="address" type="text" readonly value="${escapeHtml(state.salesDraft.address)}" />
                    </label>
                  </div>

                  <div class="sales-form-row">
                    <label>
                      No Nota Fiscal
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
                          { value: "transferencia", label: "Transferencia" },
                          { value: "cartao", label: "Cartao" },
                          { value: "dinheiro", label: "Dinheiro" },
                          { value: "cheque", label: "Cheque" },
                          { value: "negociado_com_o_dono", label: "Negociado com o dono" },
                        ], state.salesDraft.payment_method)}
                      </select>
                    </label>
                  </div>

                  <div class="sales-form-row">
                    <label>
                      Status da venda *
                      <select name="status" required>
                        ${renderOptions([
                          { value: "quote", label: "Orcamento" },
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
                      Observacoes
                      <textarea name="contract_notes" placeholder="Observacoes da venda">${escapeHtml(state.salesDraft.contract_notes)}</textarea>
                    </label>
                  </div>

                  <div class="form-actions-row sales-form-actions">
                    <button class="ghost-button" type="button" data-sales-cancel>Cancelar</button>
                    <button class="secondary-button" type="button" data-sales-draft-preview="${state.salesDraft.status}">Gerar previa</button>
                    <button class="primary-button" type="submit">Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          `
          : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
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
                      Endereco
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
                      <input name="status_label" type="text" readonly value="${escapeHtml(state.salesContractDraft.status === "finalized" ? "Venda Finalizada" : "Orcamento")}" />
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
                      Observacoes do contrato
                      <textarea name="contract_notes" placeholder="Clausulas, observacoes e detalhes do contrato">${escapeHtml(state.salesContractDraft.contract_notes)}</textarea>
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
              { value: "quote", label: "Orcamento" },
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
                    <th>Acoes</th>
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
    ? metadata.items.map((saleItem) => `${saleItem.product_name || "-"} x ${formatQuantity(saleItem.quantity || 0)}`).join(" • ")
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
        ${metadata.status === "quote" ? "Orcamento" : "Venda PDF"}
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
      <button class="inline-button danger-button" type="button" data-sales-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderSalesConfigModal(canManageConfig) {
  const activeTab = state.salesConfigTab || "quote";
  const settings = state.salesDocumentSettings;
  const template = getSalesTemplate(activeTab === "company" ? "quote" : activeTab);
  const preview = resolveSalesTemplateContent(activeTab === "company" ? "quote" : activeTab, null);
  const tabs = [
    { key: "quote", label: "Orcamento" },
    { key: "sale", label: "Venda" },
    { key: "contract", label: "Contrato" },
    { key: "company", label: "Dados da Empresa" },
  ];

  return `
    <div class="modal-overlay sales-config-overlay" data-sales-config-close>
      <div class="modal-card sales-config-modal" role="dialog" aria-modal="true" aria-label="Configuracao de modelos comerciais" data-sales-config-card>
        <div class="sales-config-header">
          <div>
            <p class="eyebrow muted">Modelos Comerciais</p>
            <h3>Config</h3>
            <p class="muted">Configure os modelos de orcamento, venda, contrato e os dados fixos da empresa.</p>
          </div>
          <div class="sales-config-header-actions">
            ${canManageConfig ? `<span class="status-chip chip-green">Edicao liberada</span>` : `<span class="status-chip chip-blue">Somente leitura</span>`}
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
                <span class="eyebrow muted">Pre-visualizacao</span>
                <h4>${activeTab === "company" ? "Orcamento Padrao" : template.title}</h4>
              </div>
              <div class="sales-config-preview-actions">
                <button class="ghost-button" type="button" data-sales-template-preview="${activeTab === "company" ? "quote" : activeTab}">Visualizar modelo</button>
                <button class="secondary-button" type="button" data-sales-template-generate="${activeTab === "company" ? "quote" : activeTab}">Gerar previa</button>
              </div>
            </div>
            <div class="sales-config-placeholders">
              ${getSalesTemplatePlaceholderList(activeTab === "company" ? "quote" : activeTab).map((item) => `<code>${item}</code>`).join("")}
            </div>
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

  return `
    <form id="sales-config-template-form" class="sales-config-form" data-sales-config-form="${type}">
      <input type="hidden" name="template_type" value="${type}" />
      <div class="sales-config-grid">
        <label>
          Nome do modelo
          <input name="name" type="text" value="${escapeHtml(template.name)}" ${disabled} />
        </label>
        <label>
          Titulo do documento
          <input name="title" type="text" value="${escapeHtml(template.title)}" ${disabled} />
        </label>
        <label>
          Validade do orcamento
          <input name="validity_days" type="number" min="0" step="1" value="${escapeHtml(template.validity_days)}" ${disabled} />
        </label>
      </div>

      <label>
        Cabecalho
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
              Texto de apresentacao
              <textarea name="presentation_text" ${disabled}>${escapeHtml(template.presentation_text)}</textarea>
            </label>
          `
      }
      <div class="sales-config-grid">
        <label>
          Condicoes de pagamento
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
        Observacoes
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
        Rodape
        <textarea name="footer" ${disabled}>${escapeHtml(template.footer)}</textarea>
      </label>
      <label>
        ${isContract ? "Texto completo do contrato" : "Editor do modelo (HTML com placeholders)"}
        <textarea name="body_html" class="sales-config-html-editor ${isContract ? "sales-config-contract-editor" : ""}" ${disabled}>${escapeHtml(template.body_html)}</textarea>
      </label>
      ${
        isContract
          ? `
            <p class="muted">
              Escreva aqui o contrato completo. Use os placeholders para preencher automaticamente dados do cliente,
              empresa, valores, itens e condicoes negociadas. O cabecalho e o rodape permanecem em campos separados.
            </p>
          `
          : ""
      }

      <div class="form-actions-row sales-config-actions">
        ${
          canManageConfig
            ? `
              <button class="ghost-button" type="button" data-sales-template-restore="${type}">Restaurar padrao</button>
              <button class="secondary-button" type="button" data-sales-template-save="${type}">Salvar modelo</button>
              <button class="primary-button" type="button" data-sales-template-default="${type}">Definir como padrao</button>
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
          Endereco
          <input name="address" type="text" value="${escapeHtml(company.address)}" ${disabled} />
        </label>
      </div>
      <div class="sales-config-grid">
        <label>
          Responsavel
          <input name="responsible_name" type="text" value="${escapeHtml(company.responsible_name)}" ${disabled} />
        </label>
        <label>
          Cargo do responsavel
          <input name="responsible_role" type="text" value="${escapeHtml(company.responsible_role)}" ${disabled} />
        </label>
      </div>
      <label>
        Assinatura do responsavel
        <textarea name="signature" ${disabled}>${escapeHtml(company.signature)}</textarea>
      </label>
      <div class="sales-config-numbering-card">
        <h4>Numeracao automatica</h4>
        <p class="muted">A numeracao agora eh gerada automaticamente no backend, por tipo e por ano, sem edicao manual.</p>
        <div class="sales-config-numbering-grid">
          <div><strong>Orcamento</strong><span>ORC-01${yearSuffix}</span></div>
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
      <div class="modal-card sales-document-modal" role="dialog" aria-modal="true" aria-label="Visualizacao do documento comercial" data-sales-preview-card>
        <div class="sales-config-header">
          <div>
            <p class="eyebrow muted">Documento Comercial</p>
            <h3>${escapeHtml(state.salesDocumentPreview.title || "Previa")}</h3>
            <p class="muted">Documento pronto para impressao, exportacao em PDF e envio ao cliente.</p>
          </div>
          <div class="sales-config-header-actions">
            <button class="secondary-button" type="button" data-sales-preview-export>Baixar PDF</button>
            <button class="ghost-button" type="button" data-sales-preview-print>Imprimir</button>
            <button class="primary-button" type="button" data-sales-preview-send>Enviar ao cliente</button>
            <button class="ghost-button" type="button" data-sales-preview-close-button>Fechar</button>
          </div>
        </div>
        <div class="sales-document-preview-frame sales-document-preview-modal-frame">${state.salesDocumentPreview.html}</div>
      </div>
    </div>
  `;
}

function renderSalesItemRow(item, index) {
  const productOptions = (state.moduleData.products || []).map((product) => ({
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
        Codigo
        <input data-sales-item-field="product_code" data-sales-item-index="${index}" type="text" readonly value="${escapeHtml(item.product_code)}" />
      </label>
      <label>
        Quantidade
        <input data-sales-item-field="quantity" data-sales-item-index="${index}" type="number" min="0.01" step="0.01" value="${escapeHtml(item.quantity)}" />
      </label>
      <label>
        Valor unitario
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
        Descricao
        <input data-purchase-item-field="description" data-purchase-item-index="${index}" type="text" value="${escapeHtml(item.description)}" />
      </label>
      <label>
        Quantidade
        <input data-purchase-item-field="quantity" data-purchase-item-index="${index}" type="number" min="0.01" step="0.01" value="${escapeHtml(item.quantity)}" />
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
    return noPermissionTemplate("Seu perfil nao possui acesso ao modulo de compras.");
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
  const requestSummaryLabel = `${requests.length} ${requests.length === 1 ? "solicitacao" : "solicitacoes"}`;

  return `
    <section class="module-panel purchases-module">
      <div class="module-head purchases-head">
        <div>
          <p class="eyebrow muted">Compras</p>
          <h3>Solicitacao de Compras</h3>
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
          label: "Solicitacoes",
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
          label: "Concluidas",
          value: completedCount,
          note: completedCount ? "Compras finalizadas" : "Nenhuma compra concluida",
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
                    <h4>${state.purchaseDraft.edit_id ? "Editar Solicitacao" : "Nova Solicitacao"}</h4>
                    <p class="muted">Accordion controlado, responsivo e preparado para integracao com backend.</p>
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
                          { value: "Fabricacao", label: "Fabricacao" },
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
                        <h5>Itens da solicitacao</h5>
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
          : `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`
      }

      ${
        canEdit
          ? `
            <div class="purchase-accordion-shell purchase-conclusion-shell ${isConclusionFormOpen ? "open" : ""}">
              <div class="purchase-accordion-card purchase-conclusion-card">
                <div class="purchase-form-header">
                  <div>
                    <h4>Concluir Compra</h4>
                    <p class="muted">Registre pedido, nota fiscal, pagamento, anexos e a notificacao ao solicitante.</p>
                  </div>
                </div>

                <form id="purchase-conclusion-form" class="purchase-form-grid">
                  <input type="hidden" name="request_id" value="${escapeHtml(state.purchaseConclusionDraft.request_id)}" />

                  <div class="purchase-form-row">
                    <label>
                      Numero do pedido
                      <input name="order_number" type="text" placeholder="PED-20260407-001" value="${escapeHtml(state.purchaseConclusionDraft.order_number)}" />
                    </label>
                    <label>
                      Numero da nota fiscal
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
                          { value: "Cartao", label: "Cartao" },
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
                      Observacoes da compra
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
            <p class="eyebrow muted">Solicitacoes</p>
            <h4>${requests.length} solicitacoes</h4>
          </div>
          <div class="purchase-toolbar-actions">
            <button class="topbar-icon-button purchase-alert-button" type="button" data-purchase-inline-alert aria-label="Notificacoes">
              <span>◔</span>
            </button>
            ${
              canEdit
                ? `
                  <button class="primary-button purchase-create-button ${isRequestFormOpen ? "is-open" : ""}" type="button" data-purchase-toggle-form>
                    <span>+ Nova Solicitacao</span>
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
                { value: "completed", label: "Concluida" },
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
                <strong>Nenhuma solicitacao encontrada</strong>
              </div>
            `
        }
      </div>
    </section>
  `;
}

function renderCrudForm(formId, fields, canEdit) {
  if (!canEdit) {
    return `<div class="empty-state">Seu perfil pode visualizar este modulo, mas nao pode editar.</div>`;
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
      <input name="${name}" type="${type}" placeholder="${placeholder}" required />
    </label>
  `;
}

function optionalInputField(name, label, type = "text", placeholder = "") {
  return `
    <label>
      ${label}
      <input name="${name}" type="${type}" placeholder="${placeholder}" />
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
      <input data-bom-structure-field="${name}" name="${name}" type="${type}" placeholder="${placeholder}" value="${escapeHtml(value)}" ${readonly ? "readonly" : ""} ${required ? "required" : ""} />
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
      <button class="inline-button danger-button" type="button" data-product-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderLastMovementUserCell(item) {
  if (!item.last_moved_by_name) {
    return `<span class="muted">Sem movimentacao</span>`;
  }

  return `
    <strong>${escapeHtml(item.last_moved_by_name)}</strong>
    <div class="table-inline-copy muted">${item.last_movement_at ? formatDateTime(item.last_movement_at) : "Data nao informada"}</div>
  `;
}

function bomStructureActionCell(item, canEdit) {
  if (!canEdit) {
    return `<span class="muted">Somente leitura</span>`;
  }

  return `
    <div class="action-button-group">
      <button class="inline-button" type="button" data-bom-structure-edit-id="${item.id}">Editar</button>
      <button class="inline-button danger-button" type="button" data-delete-table="bom_structures" data-delete-id="${item.id}">Excluir</button>
    </div>
  `;
}

function renderProductForm() {
  const isEditing = state.productFormMode === "edit";

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
          <h4>Informacoes Basicas</h4>
          <div class="product-form-row">
            ${inputField("code", "Codigo")}
            ${inputField("name", "Nome")}
            ${selectField("status", "Status", [
              { value: "active", label: "Ativo" },
              { value: "inactive", label: "Inativo" },
            ])}
            ${selectField("category", "Categoria", [
              { value: "raw_material", label: "Materia-prima" },
              { value: "finished_product", label: "Produto acabado" },
            ])}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Estoque</h4>
          <div class="product-form-row">
            ${inputField("unit", "Unidade", "text", "kg")}
            ${inputField("minimum_stock", "Estoque Minimo", "number", "0")}
            ${inputField("current_stock", "Estoque Atual", "number", "0")}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Valores</h4>
          <div class="product-form-row">
            ${currencyInputField("cost_price", "Preco de Custo")}
            ${currencyInputField("sale_price", "Preco de Venda")}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Logistica</h4>
          <div class="product-form-row">
            ${optionalInputField("supplier", "Fornecedor")}
            ${optionalInputField("batch", "Lote")}
            ${optionalInputField("expiration_date", "Validade", "date")}
            ${optionalInputField("location", "Localizacao", "text", "Almox A1")}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Descricao</h4>
          ${textAreaField("description", "Descricao")}
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
  return `
    <section class="module-subpanel movement-panel">
      <div class="module-head compact-head">
        <div>
          <p class="eyebrow muted">Movimentacao de estoque</p>
          <h3>${product.name}</h3>
          <p class="muted">Saldo atual ${formatQuantity(product.current_stock)} ${product.unit} | Lote ${product.batch || "-"}</p>
        </div>
      </div>

      <form id="product-movement-form" class="movement-form-grid">
        <input type="hidden" name="product_id" value="${product.id}" />
        ${selectField("movement_type", "Tipo", [
          { value: "entry", label: "Entrada" },
          { value: "exit", label: "Saida" },
        ])}
        ${inputField("movement_quantity", "Quantidade", "number", "0")}
        <div class="form-actions-row">
          <button class="secondary-button" type="submit">Confirmar Movimentacao</button>
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
          ${selectField("product_id", "Produto", productOptions)}
          ${selectField("movement_type", "Tipo", [
            { value: "entry", label: "Entrada" },
            { value: "exit", label: "Saida" },
            { value: "adjustment", label: "Ajuste" },
          ])}
          ${inputField("quantity", "Quantidade", "number", "0")}
          ${optionalInputField("machine_serial", "Numero de Serie")}
        </div>

        <div class="form-section form-section-full">
          <h4>Observacao</h4>
          ${textAreaField("notes", "Observacao")}
        </div>

        <div class="form-actions-row form-section-full">
          <button class="ghost-button" type="button" data-inventory-cancel>Voltar</button>
          <button class="primary-button" type="submit">Salvar Movimentacao</button>
        </div>
      </form>
    </section>
  `;
}

function renderBomMaterialsForm() {
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
            ${inputField("code", "Codigo")}
            ${inputField("name", "Nome")}
            ${selectField("category", "Categoria", [
              { value: "raw_material", label: "Materia-prima" },
              { value: "component", label: "Componente" },
              { value: "subassembly", label: "Subconjunto" },
              { value: "packaging", label: "Embalagem" },
            ])}
            ${inputField("unit", "Unidade", "text", "un")}
          </div>
          ${optionalTextAreaField("description", "Descricao")}
        </div>

        <div class="form-section form-section-full">
          <h4>Custos e estoque</h4>
          <div class="product-form-row">
            ${currencyInputField("unit_cost", "Custo Unitario")}
            ${optionalInputField("supplier", "Fornecedor")}
            ${inputField("current_stock", "Estoque Atual", "number", "0")}
            ${inputField("minimum_stock", "Estoque Minimo", "number", "0")}
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
        <input type="hidden" name="edit_id" value="${escapeHtml(draft.edit_id)}" />
        <div class="form-section form-section-full">
          <h4>Dados principais</h4>
          <div class="product-form-row">
            ${draftSelectField("product_id", "Produto final", draft.product_id, productOptions, true)}
            ${draftInputField("version", "Versao", draft.version, "text", "1.0", false, true)}
          </div>
        </div>

        <div class="form-section form-section-full">
          <h4>Producao</h4>
          <div class="product-form-row">
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
            <button class="secondary-button" type="button" data-bom-add-item>+ Adicionar peca</button>
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
          <h4>Instrucoes de Producao</h4>
          ${draftTextAreaField("instructions", "Instrucoes de producao", draft.instructions)}
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
          ${draftTextAreaField("notes", "Observacoes", draft.notes)}
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
  const details = getBomDraftItemComputed(item);

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
        <input type="text" value="${formatCurrency(details.unitCost)}" readonly />
      </label>
      <label>
        Custo total
        <input type="text" value="${formatCurrency(details.totalCost)}" readonly />
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
  const config = category === "finished_product"
    ? { label: "Produto acabado", className: "product-category-finished" }
    : { label: "Materia-prima", className: "product-category-raw" };
  return `<span class="status-chip ${config.className}">${config.label}</span>`;
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
    exit: { label: "Saida", className: "movement-exit" },
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
    raw_material: "Materia prima",
    finished_product: "Produto acabado",
    packaging: "Embalagem",
    consumable: "Insumo",
  };

  return labels[category] || category || "-";
}

function formatBomCategory(category) {
  const labels = {
    raw_material: "Materia-prima",
    component: "Componente",
    subassembly: "Subconjunto",
    packaging: "Embalagem",
  };

  return labels[category] || category || "-";
}

function formatQuantity(value) {
  return Number(value || 0).toFixed(2);
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
    inventory: "Movimentacoes e controle de saldo",
    production: "Gerencie ordens de producao",
    service_orders: "Servicos internos e externos com rastreabilidade completa",
    machining: "Pecas, processos e workflow por etapas",
    customers: "Relacionamento comercial",
    sales: "Pedidos e faturamento",
    purchases: "Fluxo de solicitacoes, compra e conclusao",
    reports: "Consolidado gerencial e analitico da operacao",
    vps: "Painel tecnico exclusivo para o setor de TI",
    audit: "Central unica de logs, rastreabilidade e auditoria",
    permissions: "Configure papeis, permissoes e funcionarios",
  };

  return subtitles[moduleKey] || "Painel operacional";
}

function getAuditKnownModules() {
  const base = MODULES.map((module) => ({ value: module.key, label: module.label }));
  if (!base.some((module) => module.value === "reports")) {
    base.push({ value: "reports", label: "Relatorios" });
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
    state.clientIp = String(data?.ip || "").trim() || "Nao identificado";
  } catch {
    state.clientIp = readCachedClientIp() || "Nao identificado";
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
    ip: state.clientIp || readCachedClientIp() || "Nao identificado",
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
    description: `Acesso ao modulo ${getModuleLabel(state.activeModule)}.`,
    entityType: "module",
    entityId: state.activeModule,
  });
}

function renderAuditLevelBadge(level) {
  const normalized = String(level || "Informativo");
  const classMap = {
    Informativo: "status-completed",
    Atencao: "status-planned",
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
          <p>Exportacao consolidada dos registros filtrados.</p>
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
            <th>Modulo</th>
            <th>Acao</th>
            <th>Usuario</th>
            <th>Item</th>
            <th>Descricao</th>
            <th>Nivel</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="7">Nenhum log encontrado.</td></tr>`}</tbody>
      </table>
    </article>
  `;
}

function formatStaffRole(role) {
  const normalizedRole = String(role || "").trim();
  if (normalizedRole === "ADMNISTRADOR" || normalizedRole === "ADMINISTRADOR") {
    return "ADMINISTRADOR";
  }
  return normalizedRole || "Usuario";
}

function isTiUser() {
  return String(state.currentUser?.role || "").trim() === "TI";
}

function isPermissionsAdmin() {
  return ["TI", "ADMNISTRADOR", "ADMINISTRADOR"].includes(String(state.currentUser?.role || "").trim());
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
  const canAccessPermissionsModule = ["TI", "ADMNISTRADOR", "ADMINISTRADOR"].includes(String(roleName || "").trim().toUpperCase());
  const canAccessVpsModule = String(roleName || "").trim().toUpperCase() === "TI";
  const canEditDashboard = ["TI", "ADMNISTRADOR", "ADMINISTRADOR"].includes(String(roleName || "").trim().toUpperCase());
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
    quantity: "1",
    unit_price: 0,
    discount: 0,
  };
}

function createEmptySalesDraft(status = "quote") {
  return {
    edit_id: "",
    customer_id: "",
    customer_name: "",
    cnpj: "",
    address: "",
    invoice_number: "",
    sale_date: "",
    delivery_date: "",
    payment_method: "",
    status,
    contract_number: "",
    contract_notes: "",
    items: [createEmptySalesItemDraft()],
    production_generated: false,
    production_order_ids: [],
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
    payment_method: "",
    total_amount: "",
    purchase_notes: "",
    order_files: [],
    invoice_files: [],
    attachment_files: [],
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
      name: "Modelo Padrao de Orcamento",
      title: "Orcamento Comercial",
      header: "Proposta comercial elaborada para {{cliente_nome}}.",
      footer: "Agradecemos a oportunidade e ficamos a disposicao para alinhar os proximos passos.",
      presentation_text: "Apresentamos abaixo a proposta comercial conforme escopo solicitado.",
      validity_days: "7",
      notes: "Valores sujeitos a confirmacao de estoque e aprovacao comercial.",
      payment_terms: "50% no pedido e 50% na entrega.",
      delivery_terms: "Entrega em ate 15 dias uteis apos aprovacao.",
      warranty: "Garantia de 12 meses contra defeitos de fabricacao.",
      signature: "{{empresa_responsavel}}\n{{empresa_responsavel_cargo}}",
      contact_details: "{{empresa_telefone}} | {{empresa_email}} | {{empresa_site}}",
      final_message: "Se desejar, podemos revisar quantidades, prazos e condicoes comerciais.",
      body_html: `
        <section>
          <h2>{{documento_titulo}}</h2>
          <p>{{texto_apresentacao}}</p>
          <p><strong>Cliente:</strong> {{cliente_nome}}</p>
          <p><strong>Data:</strong> {{data}}</p>
          <p><strong>Numero:</strong> {{numero_documento}}</p>
          {{itens}}
          <p><strong>Subtotal:</strong> {{valor_subtotal}}</p>
          <p><strong>Desconto:</strong> {{valor_desconto}}</p>
          <p><strong>Total:</strong> {{valor_total}}</p>
          <p><strong>Pagamento:</strong> {{forma_pagamento}}</p>
          <p><strong>Prazo de entrega:</strong> {{prazo_entrega}}</p>
          <p><strong>Validade:</strong> {{validade_orcamento}}</p>
          <p><strong>Garantia:</strong> {{garantia}}</p>
          <p><strong>Observacoes:</strong> {{observacoes}}</p>
          <p><strong>Mensagem final:</strong> {{mensagem_final}}</p>
        </section>
      `.trim(),
    },
    sale: {
      type: "sale",
      name: "Modelo Padrao de Venda",
      title: "Confirmacao de Venda",
      header: "Documento comercial referente a venda formalizada com {{cliente_nome}}.",
      footer: "Documento emitido automaticamente pelo modulo comercial.",
      presentation_text: "Registramos abaixo as condicoes comerciais da venda fechada.",
      validity_days: "0",
      notes: "Venda sujeita as condicoes comerciais aprovadas.",
      payment_terms: "Conforme negociado no pedido.",
      delivery_terms: "Prazo conforme cronograma informado ao cliente.",
      warranty: "Garantia conforme politica comercial vigente.",
      signature: "{{empresa_responsavel}}\n{{empresa_responsavel_cargo}}",
      contact_details: "{{empresa_telefone}} | {{empresa_email}}",
      final_message: "Em caso de duvidas, nossa equipe comercial esta a disposicao.",
      body_html: `
        <section>
          <h2>{{documento_titulo}}</h2>
          <p>{{texto_apresentacao}}</p>
          <p><strong>Cliente:</strong> {{cliente_nome}}</p>
          <p><strong>Documento:</strong> {{cliente_documento}}</p>
          <p><strong>Endereco:</strong> {{cliente_endereco}}</p>
          <p><strong>Numero da venda:</strong> {{numero_documento}}</p>
          {{itens}}
          <p><strong>Condicoes comerciais:</strong> {{condicoes_pagamento}}</p>
          <p><strong>Total:</strong> {{valor_total}}</p>
          <p><strong>Observacoes:</strong> {{observacoes}}</p>
        </section>
      `.trim(),
    },
    contract: {
      type: "contract",
      name: "Modelo Padrao de Contrato",
      title: "Contrato Comercial",
      header: "As partes abaixo identificadas firmam o presente instrumento comercial.",
      footer: "Contrato emitido com base nas condicoes registradas no ERP.",
      presentation_text: "Instrumento padrao para formalizacao contratual com o cliente.",
      validity_days: "0",
      notes: "As clausulas podem ser ajustadas conforme a negociacao.",
      payment_terms: "Pagamento conforme cronograma aprovado.",
      delivery_terms: "Entrega conforme pedido e cronograma comercial.",
      warranty: "Garantia conforme condicoes negociadas.",
      signature: "{{empresa_responsavel}}\n{{empresa_responsavel_cargo}}",
      contact_details: "{{empresa_email}}",
      final_message: "Ambas as partes declaram estar de acordo com as clausulas acima.",
      body_html: `
        <section>
          <h2>{{documento_titulo}}</h2>
          <p>{{texto_apresentacao}}</p>
          <p><strong>Contratante:</strong> {{empresa_nome}}</p>
          <p><strong>Contratado:</strong> {{cliente_nome}}</p>
          <p><strong>Documento do cliente:</strong> {{cliente_documento}}</p>
          <p><strong>Endereco do cliente:</strong> {{cliente_endereco}}</p>
          <p><strong>Valor do contrato:</strong> {{valor_total}}</p>
          <p><strong>Produtos/servicos:</strong></p>
          {{itens}}
          <p><strong>Condicoes de pagamento:</strong> {{condicoes_pagamento}}</p>
          <p><strong>Prazo:</strong> {{prazo_entrega}}</p>
          <p><strong>Clausulas adicionais:</strong> {{observacoes}}</p>
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

function saveSalesDocumentSettings() {
  state.salesDocumentSettings.activeTab = state.salesConfigTab;
  localStorage.setItem(SALES_DOCUMENT_SETTINGS_STORAGE_KEY, JSON.stringify(state.salesDocumentSettings));
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
      renderApp();
    }
  } catch (error) {
    console.error("sales settings load", error);
  }
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
  return {
    activeTab: source.activeTab || defaults.activeTab,
    company: {
      ...defaults.company,
      ...(source.company || {}),
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
}

function canManageSalesTemplates() {
  return ["TI", "ADMNISTRADOR", "ADMINISTRADOR"].includes(String(state.currentUser?.role || "").trim());
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
    "{{cliente_documento}}",
    "{{cliente_endereco}}",
    "{{cliente_email}}",
    "{{cliente_telefone}}",
    "{{data}}",
    "{{numero_documento}}",
    "{{documento_titulo}}",
    "{{texto_apresentacao}}",
    "{{itens}}",
    "{{valor_subtotal}}",
    "{{valor_desconto}}",
    "{{valor_total}}",
    "{{forma_pagamento}}",
    "{{condicoes_pagamento}}",
    "{{prazo_entrega}}",
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
  const documentNumber = type === "contract"
    ? (sale?.contract_number || nextSalesDocumentNumber("contract"))
    : type === "sale"
      ? (sale?.sale_number || nextSalesDocumentNumber("sale"))
      : (sale?.sale_number || nextSalesDocumentNumber("quote"));
  const validityDays = Number(template.validity_days || 0);
  const baseDate = sale?.sale_date || new Date().toISOString().slice(0, 10);
  const validityDate = validityDays > 0 ? getDateShiftedIso(baseDate, validityDays) : "";
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
  const totals = items.length ? calculateSalesTotals(items) : { subtotal: 1500, discount: 0, total: 1500 };
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
      "{{cliente_documento}}": sale?.cnpj || customer?.cnpj || customer?.cpf || "Documento nao informado",
      "{{cliente_endereco}}": sale?.address || customer?.address || "Endereco nao informado",
      "{{cliente_email}}": customer?.email || "cliente@empresa.com",
      "{{cliente_telefone}}": customer?.phone || "(00) 00000-0000",
      "{{data}}": formatDate(baseDate),
      "{{numero_documento}}": documentNumber,
      "{{numero_contrato}}": sale?.contract_number || nextSalesDocumentNumber("contract"),
      "{{documento_titulo}}": template.title || "",
      "{{texto_apresentacao}}": template.presentation_text || "",
      "{{valor_subtotal}}": formatCurrency(totals.subtotal),
      "{{valor_desconto}}": formatCurrency(totals.discount),
      "{{valor_total}}": formatCurrency(totals.total),
      "{{forma_pagamento}}": getPaymentMethodLabel(metadata.paymentMethod || sale?.payment_method || ""),
      "{{condicoes_pagamento}}": template.payment_terms || "",
      "{{prazo_entrega}}": template.delivery_terms || "",
      "{{garantia}}": template.warranty || "",
      "{{observacoes}}": (sale?.contract_notes || template.notes || "").trim(),
      "{{mensagem_final}}": template.final_message || "",
      "{{validade_orcamento}}": validityDate ? `${template.validity_days} dias (${formatDate(validityDate)})` : "Conforme politica comercial",
      "{{vendedor_nome}}": sellerName,
    },
  };
}

function renderSalesDocumentItemsTable(items) {
  const rows = items.map((item) => `
    <tr>
      <td>${escapeHtml(item.product_name || "-")}</td>
      <td>${escapeHtml(item.product_code || "-")}</td>
      <td>${formatQuantity(item.quantity || 0)}</td>
      <td>${formatCurrency(item.unit_price || 0)}</td>
      <td>${formatCurrency(item.discount || 0)}</td>
      <td>${formatCurrency(item.subtotal || 0)}</td>
    </tr>
  `).join("");

  return `
    <table class="sales-document-items-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Codigo</th>
          <th>Quantidade</th>
          <th>Unitario</th>
          <th>Desconto</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function resolveSalesTemplateContent(type, sale) {
  const context = getSalesDocumentContext(type, sale);
  const template = context.template;
  const values = {
    ...context.values,
    "{{itens}}": renderSalesDocumentItemsTable(context.items),
  };

  const interpolate = (content) => Object.entries(values).reduce((result, [key, value]) => {
    return result.split(key).join(String(value ?? ""));
  }, String(content || ""));

  const logoHtml = context.company.logo
    ? `<img class="sales-document-logo" src="${context.company.logo}" alt="Logo ${escapeHtml(context.company.company_name || "empresa")}" />`
    : `<div class="sales-document-logo-placeholder">${escapeHtml((context.company.company_name || "Empresa").slice(0, 2).toUpperCase())}</div>`;

  const html = `
    <article class="sales-document-sheet sales-document-sheet-${type}">
      <header class="sales-document-header">
        <div class="sales-document-brand">
          ${logoHtml}
          <div>
            <strong>${escapeHtml(context.company.company_name || "Empresa")}</strong>
            <p>${escapeHtml(context.company.cnpj || "")}</p>
            <p>${escapeHtml(context.company.address || "")}</p>
          </div>
        </div>
        <div class="sales-document-meta">
          <span>${escapeHtml(template.title || "")}</span>
          <strong>${escapeHtml(context.values["{{numero_documento}}"])}</strong>
          <p>${escapeHtml(context.values["{{data}}"])}</p>
        </div>
      </header>
      <section class="sales-document-banner">
        <p>${interpolate(template.header)}</p>
      </section>
      <section class="sales-document-body">
        ${interpolate(template.body_html)}
      </section>
      <section class="sales-document-closing">
        <div>
          <h4>Contato</h4>
          <p>${interpolate(template.contact_details)}</p>
        </div>
        <div>
          <h4>Assinatura</h4>
          <p>${interpolate(template.signature).replace(/\n/g, "<br />")}</p>
        </div>
      </section>
      <footer class="sales-document-footer">
        <p>${interpolate(template.footer)}</p>
      </footer>
    </article>
  `.trim();

  return {
    html,
    customerName: context.values["{{cliente_nome}}"],
    customerEmail: context.values["{{cliente_email}}"],
    customerPhone: context.values["{{cliente_telefone}}"],
    title: template.title || "",
    documentNumber: context.values["{{numero_documento}}"],
  };
}

function openSalesDocumentPreview(type, saleId = "") {
  const sale = saleId ? (state.moduleData.sales || []).find((item) => item.id === saleId) : null;
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
  };
  void queueSystemLog({
    moduleKey: "sales",
    action: "geracao_pdf",
    level: "Informativo",
    itemAffected: sale?.sale_number || sale?.id || type,
    description: `Pre-visualizacao de documento comercial do tipo ${type}.`,
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
    showToast("Nao foi possivel abrir a visualizacao de impressao.", "warning");
    return;
  }

  printWindow.document.write(`
    <html lang="pt-BR">
      <head>
        <title>${escapeHtml(title || "Documento Comercial")}</title>
        <meta charset="utf-8" />
        <style>
          body { margin: 0; padding: 24px; background: #eef2f7; font-family: "Segoe UI", sans-serif; }
          .sales-document-sheet { max-width: 960px; margin: 0 auto; background: #fff; padding: 32px; color: #0f172a; }
          .sales-document-header, .sales-document-closing { display: flex; justify-content: space-between; gap: 24px; }
          .sales-document-brand { display: flex; gap: 16px; align-items: center; }
          .sales-document-logo { width: 72px; height: 72px; object-fit: cover; border-radius: 18px; }
          .sales-document-logo-placeholder { width: 72px; height: 72px; border-radius: 18px; display: grid; place-items: center; background: #dbeafe; font-weight: 700; }
          .sales-document-banner { margin: 24px 0; padding: 16px 18px; border-radius: 16px; background: #f8fafc; }
          .sales-document-items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .sales-document-items-table th, .sales-document-items-table td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; }
          .sales-document-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #cbd5e1; color: #475569; }
          @media print { body { background: #fff; padding: 0; } .sales-document-sheet { padding: 0; } }
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
    description: `Geracao de PDF/impressao no modulo ${getModuleLabel(state.activeModule)}.`,
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
  const materialOptions = (state.moduleData.bomMaterials || []).map((item) => ({
    value: `material:${item.id}`,
    label: `Material • ${item.name} (${item.code})`,
  }));
  const structureOptions = (state.moduleData.bomStructures || [])
    .filter((item) => item.status === "active")
    .map((item) => ({
      value: `structure:${item.id}`,
      label: `Conjunto • ${item.name} v${item.version}`,
    }));

  return [...materialOptions, ...structureOptions];
}

function buildProductOptions() {
  return (state.moduleData.products || []).map((item) => ({
    value: item.id,
    label: `${item.name} (${item.code})`,
  }));
}

function getBomComponentByKey(sourceKey) {
  const [type, id] = String(sourceKey || "").split(":");
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
  const component = getBomComponentByKey(item.sourceKey);
  const unitCost = Number(component?.unitCost || 0);
  const quantity = Number(item.quantity || 0);
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

function renderBomStructureItemsSummary(structure) {
  const items = Array.isArray(structure.structure_items) ? structure.structure_items : [];
  if (!items.length) {
    return `<span class="muted">Sem itens</span>`;
  }

  return items
    .map((item) => `${escapeHtml(item.name || "-")} x ${formatQuantity(item.quantity)}`)
    .join("<br />");
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

  state.bomDraftItems = (Array.isArray(structure.structure_items) ? structure.structure_items : []).map((item) => ({
    sourceKey: item.source_key || `${item.source_type}:${item.component_id}`,
    quantity: String(item.quantity ?? "1"),
  }));
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
  const machiningOrders = [];
  const machiningStockEntries = [];

  (state.moduleData.machiningPieces || []).forEach((piece) => {
    (piece.productions || []).forEach((order) => {
      machiningOrders.push({
        id: order.id,
        order_number: order.order_number,
        product_name: piece.name,
        product_code: piece.code,
        batch_size: order.quantity_planned,
        status: order.status === "Concluida" ? "completed" : "in_progress",
        planned_start: String(order.created_at || "").slice(0, 10),
        planned_end: String(order.completed_at || order.created_at || "").slice(0, 10),
        notes: buildLegacyProductionNotes({
          priority: "media",
          lot_number: order.lot,
          responsible_name: order.operator,
          notes: `Usinagem por etapas • ${getMachiningCurrentStageLabel(order)}`,
          origin: "machining",
        }),
      });
    });

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

  state.moduleData.production = [...machiningOrders, ...remoteProduction];
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
    origin: entry.origin || "usinagem/producao",
    notes: entry.notes || "Entrada automatica via usinagem",
    operator: entry.operator || "",
    product_name: String(entry.product_name || piece.finished_name || piece.name || "").trim(),
  }));
  const latestOrder = productions[0] || null;

  return {
    id: piece.id || `mach-piece-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    code: String(piece.code || "").trim(),
    name: String(piece.name || "").trim(),
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
    status: order.status || "Em Producao",
    current_step_index: Number.isFinite(Number(order.current_step_index)) ? Number(order.current_step_index) : 0,
    steps,
    created_at: order.created_at || new Date().toISOString(),
    completed_at: order.completed_at || null,
  };

  normalized.status = normalized.status === "Concluida" || normalized.steps.every((step) => step.status === "Finalizada")
    ? "Concluida"
    : "Em Producao";
  normalized.current_step_index = getCurrentMachiningStepIndex(normalized);
  return normalized;
}

function deriveMachiningPieceStatus(latestOrder, stockEntries) {
  if (latestOrder && latestOrder.status !== "Concluida") return "Em Producao";
  if (stockEntries.length || (latestOrder && latestOrder.status === "Concluida")) return "Finalizada";
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
  const finishedName = state.machiningDraft.finished_name.trim() || name;
  const material = state.machiningDraft.material.trim();
  const description = state.machiningDraft.description.trim();
  const processes = resequenceMachiningProcesses(state.machiningDraft.processes);
  const editId = state.machiningDraft.edit_id || "";

  if (!code) {
    showToast("O codigo da peca e obrigatorio.", "warning");
    return;
  }

  if (!name) {
    showToast("O nome da peca e obrigatorio.", "warning");
    return;
  }

  if (!processes.length) {
    showToast("Adicione ao menos um processo de fabricacao.", "warning");
    return;
  }

  if (processes.some((process) => !process.name)) {
    showToast("O nome do processo e obrigatorio em todas as etapas.", "warning");
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
    description: `Cadastro de peca de usinagem ${editId ? "atualizado" : "criado"}.`,
    entityType: "machining_piece",
    entityId: nextPiece.id,
    payload: nextPiece,
  });
  showToast("Peca cadastrada com sucesso.", "success");
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
  const quantity = Number(state.machiningStartDraft.quantity || 0);
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
    status: "Em Producao",
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
    description: `Usinagem enviada para producao com lote ${lot}.`,
    entityType: "machining_order",
    entityId: nextOrder.id,
    payload: { piece_id: piece.id, quantity, lot, operator },
  });
  showToast("Producao iniciada com sucesso.", "success");
}

function getLatestMachiningOrder(piece) {
  return (piece.productions || [])[0] || null;
}

function getCurrentMachiningStepIndex(order) {
  const liveIndex = (order.steps || []).findIndex((step) => ["Pendente", "Em Producao", "Qualidade"].includes(step.status));
  if (liveIndex >= 0) return liveIndex;
  const firstBlocked = (order.steps || []).findIndex((step) => step.status !== "Finalizada");
  return firstBlocked >= 0 ? firstBlocked : Math.max((order.steps || []).length - 1, 0);
}

function getVisibleMachiningSteps(order) {
  const steps = order.steps || [];
  if (order.status === "Concluida") {
    return steps.map((step, index) => ({ step, index }));
  }

  return steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => step.status !== "Bloqueada");
}

function getMachiningCurrentStageLabel(order) {
  const currentIndex = getCurrentMachiningStepIndex(order);
  const currentStep = order.steps?.[currentIndex];
  if (!currentStep) return order.status === "Concluida" ? "Concluida" : "Aguardando";
  return `Etapa ${currentIndex + 1} • ${currentStep.name}`;
}

function renderMachiningStatusBadge(status) {
  const config = {
    Cadastro: "status-machining-draft",
    "Em Producao": "status-machining-live",
    Finalizada: "status-machining-finished",
  };
  return `<span class="status-chip ${config[status] || "status-planned"}">${escapeHtml(status)}</span>`;
}

function renderMachiningStepStatusBadge(status) {
  const classMap = {
    Pendente: "status-planned",
    "Em Producao": "status-in_progress",
    Qualidade: "status-machining-quality",
    Finalizada: "status-completed",
    Bloqueada: "status-cancelled",
  };
  const label = status === "Bloqueada" ? "Pendente" : status.replace("Em Producao", "Em Produção");
  return `<span class="status-chip ${classMap[status] || "status-planned"}">${escapeHtml(label)}</span>`;
}

function renderProductionStageStatusBadge(status) {
  return renderMachiningStepStatusBadge(status);
}

function getProductionStepActionLabel(status) {
  if (status === "Pendente") return "Iniciar";
  if (status === "Em Producao") return "Enviar p/ Qualidade";
  if (status === "Qualidade") return "Finalizar";
  if (status === "Finalizada") return "Concluida";
  return "Aguardando";
}

function isProductionStepAdvanceDisabled(order, step) {
  const currentIndex = getCurrentMachiningStepIndex(order);
  const stepIndex = Number(step.sequence || 1) - 1;
  return step.status === "Bloqueada" || step.status === "Finalizada" || order.status === "Concluida" || stepIndex !== currentIndex;
}

function canStepAction(order, step) {
  return {
    disableStart: step.status === "Finalizada" || order.status === "Concluida",
    disableComplete: step.status === "Finalizada" || order.status === "Concluida",
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
      showToast("Nao e possivel iniciar a proxima etapa antes de finalizar a anterior.", "warning");
      return false;
    }

    if (step.status === "Pendente" && !forceComplete) {
      step.status = "Em Producao";
      step.started_at = step.started_at || new Date().toISOString();
      step.operator = step.operator || getLoggedUserName(order.operator || "");
      order.status = "Em Producao";
      auditSnapshot = {
        level: "Informativo",
        description: `Etapa ${step.sequence} iniciada na usinagem.`,
        stepName: step.name,
        orderNumber: order.order_number,
        pieceName: piece.name,
      };
      return true;
    }

    if (step.status === "Em Producao" && !forceComplete) {
      step.status = "Qualidade";
      order.status = "Em Producao";
      auditSnapshot = {
        level: "Atencao",
        description: `Etapa ${step.sequence} enviada para qualidade.`,
        stepName: step.name,
        orderNumber: order.order_number,
        pieceName: piece.name,
      };
      return true;
    }

    if (!["Qualidade", "Em Producao", "Pendente"].includes(step.status)) {
      return false;
    }

    step.status = "Finalizada";
    step.started_at = step.started_at || new Date().toISOString();
    step.completed_at = new Date().toISOString();
    step.operator = step.operator || getLoggedUserName(order.operator || "");
    step.completed_by = step.operator || getLoggedUserName(order.operator || "");

    const nextStep = order.steps[stepIndex + 1];
    if (nextStep) {
      nextStep.status = "Pendente";
      order.current_step_index = stepIndex + 1;
      order.status = "Em Producao";
      auditSnapshot = {
        level: "Informativo",
        description: `Etapa ${step.sequence} finalizada e proxima etapa liberada.`,
        stepName: step.name,
        orderNumber: order.order_number,
        pieceName: piece.name,
      };
      showToast("Etapa finalizada com sucesso.", "success");
      showToast("Proxima etapa liberada.", "success");
    } else {
      order.status = "Concluida";
      order.completed_at = new Date().toISOString();
      order.current_step_index = stepIndex;
      piece.stock_entries = [
        {
          id: `mach-stock-${Date.now()}`,
          quantity: order.quantity_planned,
          lot: order.lot,
          created_at: new Date().toISOString(),
          origin: "usinagem/producao",
          notes: `Entrada automatica apos concluir todas as etapas${order.finished_name ? ` • ${order.finished_name}` : ""}`,
          operator: step.completed_by || getLoggedUserName(order.operator || ""),
          product_name: order.finished_name || piece.finished_name || piece.name,
        },
        ...(piece.stock_entries || []),
      ];
      auditSnapshot = {
        level: "Informativo",
        description: "Usinagem concluida e peca enviada ao estoque.",
        stepName: step.name,
        orderNumber: order.order_number,
        pieceName: piece.name,
      };
      showToast("Etapa finalizada com sucesso.", "success");
      showToast("Producao concluida.", "success");
      showToast("Peca enviada para estoque.", "success");
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
        showPurchaseNotification("Nova solicitacao de compra registrada.");
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
        showToast("A peca pode ter no maximo 8 processos.", "warning");
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
      showToast("Peca excluida com sucesso.", "success");
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
          description: "Ordem de producao excluida.",
          entityType: "production_order",
          entityId: button.dataset.productionDeleteId,
        });
        showToast("Ordem excluida com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-production-start-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleProductionStart(button.dataset.productionStartId);
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
        showToast("Venda excluida com sucesso.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
    });
  });

  document.querySelectorAll("[data-sales-finalize-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const sale = state.moduleData.sales.find((item) => item.id === button.dataset.salesFinalizeId);
      if (!sale) return;

      try {
        await finalizeSaleRecord(sale);
        await loadTable("sales", "sales");
        await loadTable("production_orders", "production");
        renderActiveModule();
        showToast("Venda finalizada e enviada para producao.", "success");
      } catch (error) {
        showToast(formatError(error), "danger");
      }
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
    showToast("Somente TI e ADMINISTRADOR podem alterar a configuracao de vendas.", "warning");
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
        showToast("Modelo definido como padrao.", "success");
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
        showToast("Modelo restaurado para o padrao.", "success");
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
        level: "Atencao",
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
    itemAffected: "Configuracoes de documentos",
    description: "Configuracoes dos modelos comerciais atualizadas.",
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
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo."));
    reader.readAsDataURL(file);
  });
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
        await updatePurchaseRequestStatus(request, button.dataset.purchaseNextStatus);
        await loadTable("purchase_requests", "purchases");
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
        await loadTable("purchase_requests", "purchases");
        resetPurchaseFormState();
        resetPurchaseConclusionState();
        renderActiveModule();
        showPurchaseNotification("Solicitacao excluida com sucesso.", "approved");
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
  state.purchaseConclusionDraft = {
    ...state.purchaseConclusionDraft,
    request_id: form.elements.namedItem("request_id")?.value || "",
    order_number: form.elements.namedItem("order_number")?.value || "",
    invoice_number: form.elements.namedItem("invoice_number")?.value || "",
    supplier: form.elements.namedItem("supplier")?.value || "",
    purchase_date: form.elements.namedItem("purchase_date")?.value || "",
    payment_method: form.elements.namedItem("payment_method")?.value || "",
    total_amount: (() => {
      const field = form.elements.namedItem("total_amount");
      return String(field?.value || "").trim() ? getCurrencyInputNumber(form, "total_amount") : "";
    })(),
    purchase_notes: form.elements.namedItem("purchase_notes")?.value || "",
  };
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
      quantity: Number(item.quantity || 0),
      unit: String(item.unit || "un").trim() || "un",
      measures: String(item.measures || "").trim(),
    }))
    .filter((item) => item.product_name && item.quantity > 0);
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
  return {
    request_id: request.id || "",
    order_number: metadata.purchaseDetails.order_number || "",
    invoice_number: metadata.purchaseDetails.invoice_number || "",
    supplier: metadata.purchaseDetails.supplier || "",
    purchase_date: metadata.purchaseDetails.purchase_date || "",
    payment_method: metadata.purchaseDetails.payment_method || "",
    total_amount: metadata.purchaseDetails.total_amount ? Number(metadata.purchaseDetails.total_amount) : "",
    purchase_notes: metadata.purchaseDetails.purchase_notes || "",
    order_files: metadata.purchaseDetails.order_files || [],
    invoice_files: metadata.purchaseDetails.invoice_files || [],
    attachment_files: metadata.purchaseDetails.attachment_files || [],
    boleto_files: metadata.purchaseDetails.boleto_files || [],
  };
}

async function handlePurchaseSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  syncPurchaseDraftFromForm(form);

  const normalizedItems = normalizePurchaseItems(state.purchaseDraft.items);
  if (!state.purchaseDraft.requester_id && !state.purchaseDraft.requester_name.trim()) {
    showPurchaseNotification("Preencha os campos obrigatorios.", "warning");
    return;
  }

  if (!state.purchaseDraft.department.trim()) {
    showPurchaseNotification("Preencha os campos obrigatorios.", "warning");
    return;
  }

  if (!normalizedItems.length) {
    showPurchaseNotification("Adicione ao menos um item na solicitacao.", "warning");
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
    await persistPurchaseRequest(payload, state.purchaseDraft.edit_id);
    await loadTable("purchase_requests", "purchases");
    resetPurchaseFormState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "purchases",
      action: isEditing ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: payload.request_number,
      description: `Solicitacao de compra ${isEditing ? "atualizada" : "criada"} para ${payload.department}.`,
      entityType: "purchase_request",
      entityId: payload.request_number,
      payload,
    });
    showPurchaseNotification(isEditing ? "Solicitacao atualizada com sucesso." : "Solicitacao criada com sucesso.", isEditing ? "approved" : "created");
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
    showPurchaseNotification("Solicitacao nao encontrada.", "warning");
    return;
  }

  if (!state.purchaseConclusionDraft.payment_method) {
    showPurchaseNotification("Nao permitir concluir sem forma de pagamento.", "warning");
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
  const nextDetails = {
    order_number: state.purchaseConclusionDraft.order_number.trim(),
    invoice_number: state.purchaseConclusionDraft.invoice_number.trim(),
    supplier: state.purchaseConclusionDraft.supplier.trim(),
    purchase_date: state.purchaseConclusionDraft.purchase_date || null,
    payment_method: state.purchaseConclusionDraft.payment_method,
    total_amount: totalAmount,
    purchase_notes: state.purchaseConclusionDraft.purchase_notes.trim(),
    order_files: state.purchaseConclusionDraft.order_files,
    invoice_files: state.purchaseConclusionDraft.invoice_files,
    attachment_files: state.purchaseConclusionDraft.attachment_files,
    boleto_files: state.purchaseConclusionDraft.payment_method === "Boleto" ? state.purchaseConclusionDraft.boleto_files : [],
  };

  const notificationMessage = `Sua solicitacao foi concluida. Pedido ${nextDetails.order_number} registrado.`;
  const payload = {
    ...metadata,
    purchase_details: nextDetails,
    notifications: metadata.notifications,
    status: "completed",
  };

  try {
    await persistPurchaseRequest(payload, request.id);
    await loadTable("purchase_requests", "purchases");
    resetPurchaseConclusionState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "purchases",
      action: "mudanca_status",
      level: "Atencao",
      itemAffected: metadata.request_number || request.id,
      description: `Compra concluida com pedido ${nextDetails.order_number}.`,
      entityType: "purchase_request",
      entityId: request.id,
      payload: { status: "completed", purchase_details: nextDetails },
    });
    showPurchaseNotification("Compra efetuada com sucesso.", "purchase_completed");
    await notifyPurchaseRequester(request, notificationMessage, "completed");
  } catch (error) {
    showPurchaseNotification(formatError(error), "danger");
  }
}

function resolvePurchaseRequesterName(requesterId) {
  return (state.moduleData.users || []).find((user) => user.id === requesterId)?.full_name || "";
}

function buildPurchaseRequesterMessage(metadata) {
  if (metadata.status === "purchase_completed") {
    return "Sua solicitacao de compra foi efetuada";
  }
  if (metadata.status === "completed") {
    return "Sua solicitacao foi concluida";
  }
  return `Atualizacao da solicitacao ${metadata.request_number || ""}`.trim();
}

async function notifyPurchaseRequester(request, message, soundType = "notified") {
  const metadata = getPurchaseRequestMetadata(request);
  const payload = {
    ...metadata,
    notifications: appendPurchaseNotification(metadata.notifications, message, soundType),
  };
  await persistPurchaseRequest(payload, request.id);
  showPurchaseNotification("Solicitante notificado com sucesso.", soundType);
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
    approved: "Solicitacao aprovada com sucesso.",
    purchase_completed: "Compra efetuada com sucesso.",
    cancelled: "Solicitacao atualizada com sucesso.",
    in_analysis: "Solicitacao atualizada com sucesso.",
    in_purchase: "Solicitacao atualizada com sucesso.",
  };
  const payload = {
    ...metadata,
    status: normalizedStatus,
    notifications: metadata.notifications,
  };

  await persistPurchaseRequest(payload, request.id);
  void queueSystemLog({
    moduleKey: "purchases",
    action: "mudanca_status",
    level: ["cancelled"].includes(normalizedStatus) ? "Critico" : "Atencao",
    itemAffected: metadata.request_number || request.id,
    description: `Status da solicitacao alterado para ${normalizedStatus}.`,
    entityType: "purchase_request",
    entityId: request.id,
    payload: { status: normalizedStatus },
  });

  if (normalizedStatus === "purchase_completed" || normalizedStatus === "completed") {
    const refreshedRequest = { ...request, status: normalizedStatus };
    await notifyPurchaseRequester(refreshedRequest, buildPurchaseRequesterMessage({ ...metadata, status: normalizedStatus }), normalizedStatus);
  } else {
    showPurchaseNotification(messages[normalizedStatus] || "Solicitacao atualizada com sucesso.", normalizedStatus);
  }
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
  return {
    order_number: source.order_number || "",
    invoice_number: source.invoice_number || "",
    supplier: source.supplier || "",
    purchase_date: source.purchase_date || "",
    payment_method: source.payment_method || "",
    total_amount: Number(source.total_amount || 0),
    purchase_notes: source.purchase_notes || "",
    order_files: Array.isArray(source.order_files) ? source.order_files : [],
    invoice_files: Array.isArray(source.invoice_files) ? source.invoice_files : [],
    attachment_files: Array.isArray(source.attachment_files) ? source.attachment_files : [],
    boleto_files: Array.isArray(source.boleto_files) ? source.boleto_files : [],
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
    item_name: items[0]?.product_name || "Solicitacao de compra",
    quantity: items[0]?.quantity || 1,
    justification: payload.justification || null,
    status: payload.status || "pending",
    request_items: items,
    estimated_total: 0,
    purchase_details: normalizePurchaseDetails(payload.purchase_details || payload.purchaseDetails),
    notifications: Array.isArray(payload.notifications) ? payload.notifications : [],
  };

  const query = editId
    ? state.supabase.from("purchase_requests").update(dbPayload).eq("id", editId)
    : state.supabase.from("purchase_requests").insert(dbPayload);
  const { error } = await query;
  if (!error) return;
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
    ? state.supabase.from("purchase_requests").update(legacyPayload).eq("id", editId)
    : state.supabase.from("purchase_requests").insert(legacyPayload);
  const { error: legacyError } = await legacyQuery;
  if (legacyError) throw legacyError;
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
    completed: "Concluida",
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

function handleSalesItemFieldChange(event) {
  const index = Number(event.currentTarget.dataset.salesItemIndex);
  const field = event.currentTarget.dataset.salesItemField;
  const item = state.salesDraft.items[index];
  if (!item) return;

  if (field === "product_id") {
    const product = (state.moduleData.products || []).find((productItem) => productItem.id === event.currentTarget.value);
    item[field] = event.currentTarget.value;
    item.product_name = product?.name || "";
    item.product_code = product?.code || "";
    item.unit_price = product ? parseCurrencyInput(product.sale_price || 0) : 0;
    renderActiveModule();
    return;
  }

  if (field === "unit_price" || field === "discount") {
    item[field] = parseCurrencyInput(event.currentTarget.value);
    updateSalesDraftAmountDisplays();
    return;
  }

  item[field] = event.currentTarget.value;
  updateSalesDraftAmountDisplays();
}

function syncSalesDraftFromForm(form) {
  if (!form) return;

  state.salesDraft = {
    ...state.salesDraft,
    edit_id: form.elements.namedItem("edit_id")?.value || "",
    customer_id: form.elements.namedItem("customer_id")?.value || "",
    cnpj: form.elements.namedItem("cnpj")?.value || "",
    address: form.elements.namedItem("address")?.value || "",
    invoice_number: form.elements.namedItem("invoice_number")?.value || "",
    sale_date: form.elements.namedItem("sale_date")?.value || "",
    delivery_date: form.elements.namedItem("delivery_date")?.value || "",
    payment_method: form.elements.namedItem("payment_method")?.value || "",
    status: form.elements.namedItem("status")?.value || "quote",
    contract_number: form.elements.namedItem("contract_number")?.value || "",
    contract_notes: form.elements.namedItem("contract_notes")?.value || "",
    production_generated: form.elements.namedItem("production_generated")?.value === "true",
  };

  const customer = (state.moduleData.customers || []).find((item) => item.id === state.salesDraft.customer_id);
  state.salesDraft.customer_name = customer?.name || state.salesDraft.customer_name || "";
}

function hydrateSalesContractDraft(sale) {
  const metadata = getSaleMetadata(sale);
  const itemsLabel = (metadata.items || []).length
    ? metadata.items.map((item) => `${item.product_name || "-"} | Codigo ${item.product_code || "-"} | Qtd ${formatQuantity(item.quantity || 0)} | ${formatCurrency(item.subtotal || ((Number(item.quantity || 0) * Number(item.unit_price || 0)) - Number(item.discount || 0)))}`).join("\n")
    : "Sem itens vinculados.";

  return {
    sale_id: sale.id || "",
    customer_name: sale.customer_name || "",
    cnpj: sale.cnpj || "",
    address: sale.address || "",
    invoice_number: sale.invoice_number || "",
    sale_date: sale.sale_date || "",
    delivery_date: sale.delivery_date || "",
    payment_method: metadata.paymentMethod || "",
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
    showToast("Venda nao encontrada.", "warning");
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

  return {
    edit_id: sale.id || "",
    customer_id: sale.customer_id || customer?.id || "",
    customer_name: sale.customer_name || customer?.name || "",
    cnpj: sale.cnpj || "",
    address: sale.address || "",
    invoice_number: sale.invoice_number || "",
    sale_date: sale.sale_date || "",
    delivery_date: sale.delivery_date || "",
    payment_method: metadata.paymentMethod || "",
    status: metadata.status || "quote",
    contract_number: sale.contract_number || metadata.contractNumber || "",
    contract_notes: metadata.notes || "",
    items: metadata.items.length ? metadata.items.map((item) => ({
      product_id: item.product_id || "",
      product_name: item.product_name || "",
      product_code: item.product_code || "",
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

  if (!state.salesDraft.sale_date || !state.salesDraft.delivery_date) {
    showToast("Informe data da venda e entrega.", "warning");
    return;
  }

  if (new Date(`${state.salesDraft.delivery_date}T00:00:00`) < new Date(`${state.salesDraft.sale_date}T00:00:00`)) {
    showToast("A entrega nao pode ser anterior a data da venda.", "warning");
    return;
  }

  const normalizedItems = normalizeSalesItems(state.salesDraft.items);
  if (!normalizedItems.length) {
    showToast("Adicione ao menos um item na venda.", "warning");
    return;
  }

  if (state.salesDraft.status === "finalized" && !state.salesDraft.invoice_number.trim()) {
    showToast("Numero da nota fiscal obrigatorio para venda finalizada.", "warning");
    return;
  }

  const totals = calculateSalesTotals(normalizedItems);
  const payload = {
    customer_id: customer.id,
    customer_name: customer.name,
    cnpj: state.salesDraft.cnpj || getCustomerMetadata(customer).document || "",
    address: state.salesDraft.address || getCustomerMetadata(customer).address || "",
    invoice_number: state.salesDraft.status === "quote" ? state.salesDraft.invoice_number.trim() : state.salesDraft.invoice_number.trim(),
    contract_number: (
      state.salesDraft.contract_number.trim()
      || null
    ) || null,
    contract_notes: state.salesDraft.contract_notes.trim() || null,
    sale_date: state.salesDraft.sale_date,
    delivery_date: state.salesDraft.delivery_date,
    payment_method: state.salesDraft.payment_method || null,
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
    const saleWithProduction = await ensureProductionForSale(savedSale, payload);
    await loadTable("sales", "sales");
    await loadTable("production_orders", "production");
    resetSalesFormState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "sales",
      action: isEditing ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: saleWithProduction.sale_number || savedSale.id,
      description: `Venda/orcamento ${isEditing ? "atualizado" : "cadastrado"} para ${payload.customer_name}.`,
      entityType: "sale",
      entityId: savedSale.id,
      payload: {
        status: payload.status,
        total_amount: payload.total_amount,
        customer_name: payload.customer_name,
        production_generated: saleWithProduction.generatedNow || payload.production_generated,
      },
    });
    showToast(saleWithProduction.generatedNow ? "Venda salva e enviada para producao." : "Venda salva com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function normalizeSalesItems(items) {
  return (items || [])
    .map((item) => {
      const product = (state.moduleData.products || []).find((productItem) => productItem.id === item.product_id)
        || (state.moduleData.products || []).find((productItem) => productItem.code === item.product_code);
      return {
        product_id: item.product_id || product?.id || null,
        product_name: item.product_name || product?.name || "",
        product_code: item.product_code || product?.code || "",
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        discount: Number(item.discount || 0),
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

function getSalesDraftTotals() {
  return calculateSalesTotals(normalizeSalesItems(state.salesDraft.items || []));
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
}

async function persistSale(payload, editId) {
  const dbPayload = {
    customer_id: payload.customer_id,
    customer_name: payload.customer_name,
    cnpj: payload.cnpj,
    address: payload.address,
    invoice_number: payload.invoice_number,
    contract_notes: payload.contract_notes,
    sale_date: payload.sale_date,
    delivery_date: payload.delivery_date,
    payment_method: payload.payment_method,
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
    payload.contract_number && payload.contract_number !== "AUTO" ? `[meta:contract_number]${payload.contract_number}` : "",
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
    paymentMethod: sale.payment_method || "",
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
    const totals = calculateSalesTotals(metadata.items);
    metadata.subtotal = totals.subtotal;
    metadata.discount = totals.discount;
    metadata.total = totals.total;
  }
  metadata.statusLabel = metadata.status === "finalized" ? "Venda Finalizada" : "Orcamento";
  return metadata;
}

function isSalesSchemaCompatibilityError(error) {
  return /column|schema cache|Could not find the .* column/i.test(String(error?.message || ""));
}

function saleStatusCell(status) {
  return `<span class="status-chip ${status === "finalized" ? "status-completed" : "status-quote"}">${status === "finalized" ? "Venda Finalizada" : "Orcamento"}</span>`;
}

function getPaymentMethodLabel(value) {
  const labels = {
    boleto: "Boleto",
    pix: "Pix",
    transferencia: "Transferencia",
    cartao: "Cartao",
    dinheiro: "Dinheiro",
    cheque: "Cheque",
    negociado_com_o_dono: "Negociado com o dono",
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

async function ensureProductionForSale(savedSale, payload) {
  const saleMetadata = getSaleMetadata(savedSale);
  if (payload.status !== "finalized" && saleMetadata.status !== "finalized") {
    return { generatedNow: false };
  }
  if (saleMetadata.productionGenerated || (saleMetadata.productionOrderIds || []).length) {
    return { generatedNow: false };
  }

  const orderIds = [];
  for (const item of payload.sale_items || []) {
    const linkedProduct = (state.moduleData.products || []).find((product) =>
      product.id === item.product_id || product.code === item.product_code
    );
    const productionPayload = {
      order_number: generateProductionOrderNumber({ code: item.product_code || "VENDA" }),
      product_id: item.product_id || null,
      product_code: item.product_code || null,
      product_name: item.product_name,
      batch_size: item.quantity,
      priority: "media",
      status: "planned",
      planned_start: payload.sale_date,
      planned_end: payload.delivery_date,
      lot_number: linkedProduct?.batch || null,
      responsible_name: payload.customer_name,
      notes: [
        `Gerada pela Venda ${savedSale.sale_number || savedSale.id}`,
        payload.contract_number ? `Contrato ${payload.contract_number}` : "",
        payload.contract_notes || "",
      ].filter(Boolean).join(" | "),
      sale_id: savedSale.id,
      sale_number: savedSale.sale_number || null,
      customer_name: payload.customer_name,
      origin: "sale_finalized",
    };
    const productionOrder = await persistProductionOrder(productionPayload, null);
    if (productionOrder?.id) {
      orderIds.push(productionOrder.id);
    }
  }

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
    level: "Atencao",
    itemAffected: savedSale.sale_number || savedSale.id,
    description: `Venda finalizada vinculada a ${orderIds.length} ordem(ns) de producao.`,
    entityType: "sale",
    entityId: savedSale.id,
    payload: { order_ids: orderIds },
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
    email: formData.get("email")?.toString().trim(),
    phone: formatPhoneBr(formData.get("phone")?.toString() || ""),
    contact: formData.get("contact")?.toString().trim(),
    address: formData.get("address")?.toString().trim(),
    city: formData.get("city")?.toString().trim(),
    state: formData.get("state")?.toString().trim().toUpperCase(),
    notes: formData.get("notes")?.toString().trim(),
  };

  if (!payload.name) {
    showToast("O nome do cliente e obrigatorio.", "warning");
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
    await persistCustomer(payload, editId);
    await loadTable("customers", "customers");
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
    ? state.supabase.from("customers").update(payload).eq("id", editId)
    : state.supabase.from("customers").insert(payload);
  const { error } = await query;

  if (!error) return;
  if (!isCustomerSchemaCompatibilityError(error)) {
    throw error;
  }

  const legacyPayload = {
    name: payload.name,
    cnpj: payload.cnpj || payload.cpf,
    address: buildLegacyCustomerAddress(payload),
  };
  const legacyQuery = editId
    ? state.supabase.from("customers").update(legacyPayload).eq("id", editId)
    : state.supabase.from("customers").insert(legacyPayload);
  const { error: legacyError } = await legacyQuery;
  if (legacyError) throw legacyError;
}

function buildLegacyCustomerAddress(payload) {
  const metadataLines = [
    payload.cnpj ? `[meta:cnpj]${payload.cnpj}` : "",
    payload.cpf ? `[meta:cpf]${payload.cpf}` : "",
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
    showToast("O fim previsto nao pode ser anterior ao inicio.", "warning");
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
    const savedOrder = await persistProductionOrder(payload, editId);
    await loadTable("production_orders", "production");
    if (typeof maybeGenerateServiceOrderFromCompletedProduction === "function") {
      await maybeGenerateServiceOrderFromCompletedProduction(savedOrder, product, previousOrder);
    }
    resetProductionFormState();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "production",
      action: editId ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: payload.order_number,
      description: `Ordem de producao ${editId ? "atualizada" : "criada"} para ${payload.product_name}.`,
      entityType: "production_order",
      entityId: savedOrder?.id || editId || payload.order_number,
      payload,
    });
    showToast(editId ? "Ordem atualizada com sucesso." : "Ordem salva com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function persistProductionOrder(payload, editId) {
  const query = editId
    ? state.supabase.from("production_orders").update(payload).eq("id", editId).select().single()
    : state.supabase.from("production_orders").insert(payload).select().single();
  const { data, error } = await query;

  if (!error) return data;
  if (!isProductionSchemaCompatibilityError(error)) {
    throw error;
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
  ].filter(Boolean);

  return [...metaLines, payload.notes || ""].filter(Boolean).join("\n");
}

function findActiveBomStructureForProduct(product) {
  if (!product) return null;

  return (state.moduleData.bomStructures || []).find((structure) =>
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
    (requirement.code && piece.code === requirement.code)
    || (requirement.name && piece.name === requirement.name)
    || (requirement.name && piece.finished_name === requirement.name)
  ) || null;
}

function createAutomatedMachiningOrder(piece, requirement, sourceOrder) {
  if (!piece || !requirement || Number(requirement.missingQuantity || 0) <= 0) {
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
  const nextOrder = normalizeMachiningOrderRecord({
    id: `mach-order-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    order_number: `OP-USI-${String(Date.now()).slice(-8)}`,
    quantity_planned: requirement.missingQuantity,
    lot: `${lotBase}-${String(requirement.code || piece.code || "PEC").replace(/[^A-Za-z0-9]/g, "").slice(0, 10)}`,
    operator,
    finished_name: piece.finished_name || piece.name,
    status: "Em Producao",
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
  const structure = findActiveBomStructureForProduct(product);
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

    if (item.source_type === "structure") {
      const linkedProduct = findProductForBomStructureItem(item);
      if (!linkedProduct) return;
      const existing = productRequirements.get(linkedProduct.id) || {
        product: linkedProduct,
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
    const availableQuantity = Number(requirement.product.current_stock || 0);
    const consumedQuantity = Math.min(availableQuantity, requirement.requiredQuantity);
    const missingQuantity = Math.max(requirement.requiredQuantity - consumedQuantity, 0);

    if (consumedQuantity > 0) {
      await persistProductMovement({
        product: requirement.product,
        movementPayload: {
          product_id: requirement.product.id,
          product_name: requirement.product.name,
          product_code: requirement.product.code,
          movement_type: "exit",
          quantity: consumedQuantity,
          batch: order.lot_number || requirement.product.batch || null,
          machine_serial: requirement.product.machine_serial || null,
          notes: `Baixa automatica pela producao ${order.order_number}`,
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
    return "Producao iniciada sem BOM ativa vinculada.";
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
  return parts.length ? `${parts.join(" • ")}.` : "Producao iniciada. Nenhum consumo foi necessario.";
}

async function handleProductionStart(orderId) {
  const order = (state.moduleData.production || []).find((item) => item.id === orderId);
  if (!order || order.status !== "planned") return;

  const product = (state.moduleData.products || []).find((item) =>
    item.id === order.product_id
      || (order.product_code && item.code === order.product_code)
      || item.name === order.product_name
  );

  if (!product) {
    showToast("Produto da ordem nao encontrado.", "danger");
    return;
  }

  try {
    const result = await applyBomConsumptionOnProductionStart(order, product);
    const { error } = await state.supabase
      .from("production_orders")
      .update({ status: "in_progress" })
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
      level: result.missingRequirements.length ? "Atencao" : "Informativo",
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
    showToast(buildProductionStartSummary(result), result.missingRequirements.length ? "warning" : "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

function getProductionOrderMetadata(order) {
  const rawNotes = String(order.notes || "");
  const metadata = {
    priority: order.priority || "media",
    lotNumber: order.lot_number || "",
    responsibleName: order.responsible_name || "",
    notes: rawNotes,
  };

  rawNotes.split("\n").forEach((line) => {
    if (line.startsWith("[meta:priority]") && !order.priority) {
      metadata.priority = line.replace("[meta:priority]", "").trim() || "media";
    } else if (line.startsWith("[meta:lot]") && !order.lot_number) {
      metadata.lotNumber = line.replace("[meta:lot]", "").trim();
    } else if (line.startsWith("[meta:responsible]") && !order.responsible_name) {
      metadata.responsibleName = line.replace("[meta:responsible]", "").trim();
    }
  });

  metadata.notes = rawNotes
    .split("\n")
    .filter((line) => !line.startsWith("[meta:"))
    .join("\n")
    .trim();

  return metadata;
}

function isProductionSchemaCompatibilityError(error) {
  const message = String(error?.message || "");
  return /column|schema cache|Could not find the .* column/i.test(message);
}

function generateProductionOrderNumber(product) {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  const code = String(product?.code || "ERP").replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "ERP";
  return `OP-${code}-${stamp}`;
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
      renderActiveModule();
    });
  }

  const form = document.querySelector("#inventory-movement-form");
  if (form) {
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
    showToast("Relatorios atualizados.", "success");
  });

  document.querySelector("[data-reports-export]")?.addEventListener("click", () => {
    const snapshot = buildReportsSnapshot();
    openPrintWindowForHtml(buildReportsExportHtml(snapshot), "Relatorios Gerenciais");
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
  state.bomDraftItems[index][field] = event.currentTarget.value;
  renderActiveModule();
}

function handleBomStructureDraftFieldChange(event) {
  const field = event.currentTarget.dataset.bomStructureField;
  state.bomStructureDraft[field] = event.currentTarget.value;
  if (field === "product_id") {
    const product = state.moduleData.products.find((item) => item.id === event.currentTarget.value);
    state.bomStructureDraft.product_code = product?.code || "";
    state.bomStructureDraft.product_name = product?.name || "";
    state.bomStructureDraft.name = product?.name || "";
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
  payload.current_stock = Number(payload.current_stock || 0);
  payload.minimum_stock = Number(payload.minimum_stock || 0);
  payload.description = payload.description || null;
  payload.supplier = payload.supplier || null;

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
      description: `Peca/material ${editId ? "atualizado" : "cadastrado"} no BOM.`,
      entityType: "bom_material",
      entityId: editId || payload.code,
      payload,
    });
    showToast(editId ? "Peca/material atualizado com sucesso." : "Peca/material salvo com sucesso.", "success");
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
  const normalizedItems = state.bomDraftItems
    .map((item) => {
      const computed = getBomDraftItemComputed(item);
      if (!computed.component) return null;
      return {
        source_key: item.sourceKey,
        source_type: computed.component.type,
        component_id: computed.component.id,
        code: computed.component.code,
        name: computed.component.name,
        unit: computed.component.unit,
        quantity: computed.quantity,
        unit_cost: computed.unitCost,
        total_cost: computed.totalCost,
      };
    })
    .filter(Boolean)
    .filter((item) => item.quantity > 0);

  if (!normalizedItems.length) {
    showToast("Adicione ao menos uma peca ao conjunto.", "warning");
    return;
  }

  if (!payload.product_id) {
    showToast("Selecione um produto final.", "warning");
    return;
  }

  if (!selectedProduct) {
    showToast("Produto final nao encontrado.", "danger");
    return;
  }

  const editId = payload.edit_id;
  delete payload.edit_id;
  payload.code = selectedProduct.code || "";
  payload.name = selectedProduct.name || "";
  payload.product_code = selectedProduct.code || "";
  payload.product_name = selectedProduct.name || "";
  payload.batch_size = Number(payload.batch_size || 0);
  payload.height = Number(payload.height || 0);
  payload.width = Number(payload.width || 0);
  payload.length = Number(payload.length || 0);
  payload.weight = Number(payload.weight || 0);
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
  const movementType = formData.get("movement_type")?.toString();
  const quantity = Number(formData.get("quantity") || 0);
  const machineSerial = formData.get("machine_serial")?.toString().trim();
  const notes = formData.get("notes")?.toString().trim();

  if (!productId) {
    showToast("Selecione um produto.", "warning");
    return;
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    showToast("Informe uma quantidade valida.", "warning");
    return;
  }

  if ((movementType === "entry" || movementType === "exit") && quantity === 0) {
    showToast("Entrada e saida exigem quantidade maior que zero.", "warning");
    return;
  }

  const product = state.moduleData.products.find((item) => item.id === productId);
  if (!product) {
    showToast("Produto nao encontrado.", "danger");
    return;
  }

  if (product.category === "finished_product" && !machineSerial) {
    showToast("Numero de serie e obrigatorio para produtos acabados.", "warning");
    return;
  }

  const currentStock = Number(product.current_stock || 0);
  let nextStock = currentStock;

  if (movementType === "entry") {
    nextStock = currentStock + quantity;
  } else if (movementType === "exit") {
    nextStock = currentStock - quantity;
  } else if (movementType === "adjustment") {
    nextStock = quantity;
  }

  if (nextStock < 0) {
    showToast("Nao e permitido deixar o estoque negativo.", "warning");
    return;
  }

  const movementPayload = {
    product_id: product.id,
    product_name: product.name,
    product_code: product.code,
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
    form?.reset();
    await Promise.all([loadInventoryMovementsTable(), loadProductsTable()]);
    renderActiveModule();
    showToast("Movimentacao registrada com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleProductSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  const editId = payload.edit_id;
  delete payload.edit_id;

  payload.minimum_stock = Number(payload.minimum_stock || 0);
  payload.current_stock = Number(payload.current_stock || 0);
  payload.cost_price = getCurrencyInputNumber(form, "cost_price");
  payload.sale_price = getCurrencyInputNumber(form, "sale_price");

  ["supplier", "batch", "machine_serial", "expiration_date", "location", "description"].forEach((key) => {
    if (!payload[key]) {
      payload[key] = null;
    }
  });

  try {
    const query = editId
      ? state.supabase.from("products").update(payload).eq("id", editId)
      : state.supabase.from("products").insert(payload);
    const { error } = await query;
    if (error) throw error;

    resetProductModuleState();
    await loadTable("products", "products");
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "products",
      action: editId ? "edicao" : "criacao",
      level: "Informativo",
      itemAffected: payload.name,
      description: `Produto ${editId ? "atualizado" : "cadastrado"} com codigo ${payload.code}.`,
      entityType: "product",
      entityId: editId || payload.code,
      payload,
    });
    showToast(editId ? "Produto atualizado com sucesso." : "Produto salvo com sucesso.", "success");
  } catch (error) {
    showToast(formatError(error), "danger");
  }
}

async function handleProductMovementSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const productId = formData.get("product_id")?.toString();
  const movementType = formData.get("movement_type")?.toString();
  const movementQuantity = Number(formData.get("movement_quantity") || 0);

  if (!movementQuantity || movementQuantity <= 0) {
    showToast("Informe uma quantidade valida para movimentar.", "warning");
    return;
  }

  const product = state.moduleData.products.find((item) => item.id === productId);
  if (!product) {
    showToast("Produto nao encontrado.", "danger");
    return;
  }

  const currentStock = Number(product.current_stock || 0);
  const nextStock = movementType === "entry" ? currentStock + movementQuantity : currentStock - movementQuantity;

  if (nextStock < 0) {
    showToast("A saida nao pode deixar o estoque negativo.", "warning");
    return;
  }

  try {
    await persistProductMovement({
      product,
      movementPayload: {
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
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
  Object.entries(record).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value ?? "";
    }
  });
}

async function persistProductMovement({ product, movementPayload, nextStock }) {
  const { error: movementError } = await state.supabase.from("inventory_movements").insert(movementPayload);
  if (movementError) throw movementError;

  const { error: productError } = await state.supabase
    .from("products")
    .update({
      current_stock: nextStock,
      last_moved_by_user_id: state.currentUser?.user_id || null,
      last_moved_by_name: getLoggedUserName(null),
      last_movement_at: new Date().toISOString(),
    })
    .eq("id", product.id);
  if (productError) throw productError;

  void queueSystemLog({
    moduleKey: "inventory",
    action: "movimentacao_estoque",
    level: movementPayload.movement_type === "exit" ? "Atencao" : "Informativo",
    itemAffected: product.name,
    description: `Movimentacao ${movementPayload.movement_type} de ${formatQuantity(movementPayload.quantity)} para ${product.name}.`,
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
          level: "Atencao",
          itemAffected: button.dataset.purchaseId,
          description: `Status da solicitacao alterado para ${button.dataset.purchaseStatus}.`,
          entityType: "purchase_request",
          entityId: button.dataset.purchaseId,
        });
        showToast("Status da solicitacao atualizado.", "success");
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

  const roleNameInput = document.querySelector('#permission-role-form input[name="name"]');
  if (roleNameInput) {
    roleNameInput.addEventListener("change", (event) => {
      state.permissionRoleDraft.name = event.currentTarget.value.toUpperCase();
      state.permissionRoleDraft.permissions = normalizeRolePermissions(
        state.permissionRoleDraft.permissions,
        getPermissionRoleNormalizationName(state.permissionRoleDraft.name)
      );
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
          description: "Papel de permissao excluido.",
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
          description: "Funcionario desativado.",
          entityType: "staff_user",
          entityId: button.dataset.deactivateStaffUser,
        });
        showToast("Funcionario desativado.", "success");
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
          description: "Funcionario inativo excluido.",
          entityType: "staff_user",
          entityId: button.dataset.deleteStaffUser,
        });
        showToast("Funcionario inativo excluido com sucesso.", "success");
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
      showToast("Atualizacao da VPS solicitada.", "success");
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
        showToast("Acao enviada para a fila segura da VPS.", "success");
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
    description: `Acao VPS enfileirada: ${actionType}.`,
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
  const payload = {
    p_access_token: state.accessToken,
    p_role_id: formData.get("role_id") || null,
    p_name: formData.get("name")?.toString().trim(),
    p_description: formData.get("description")?.toString().trim() || null,
    p_permissions: normalizeRolePermissions(
      state.permissionRoleDraft.permissions,
      getPermissionRoleNormalizationName(formData.get("name")?.toString())
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
      description: `Papel de permissao salvo/atualizado: ${payload.p_name}.`,
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
  const payload = {
    p_access_token: state.accessToken,
    p_login_code: sanitizeLoginCode(formData.get("login_code")),
    p_full_name: formData.get("full_name")?.toString().trim(),
    p_email: formData.get("email")?.toString().trim() || null,
    p_password: formData.get("password")?.toString() || null,
    p_department: formData.get("department")?.toString().trim() || null,
    p_role: formData.get("department")?.toString().trim() || null,
    p_permission_role_id: formData.get("permission_role_id")?.toString() || null,
    p_is_active: formData.get("status")?.toString() === "active",
  };

  try {
    const { error } = userId
      ? await state.supabase.rpc("update_staff_user", {
        ...payload,
        p_user_id: userId,
      })
      : await state.supabase.rpc("create_staff_user", payload);
    if (error) throw error;

    closeEmployeeModal();
    await loadPermissionsAdminData();
    renderActiveModule();
    void queueSystemLog({
      moduleKey: "permissions",
      action: "alteracao_permissao",
      level: "Critico",
      itemAffected: payload.p_full_name,
      description: `Cadastro de funcionario ${userId ? "atualizado" : "criado"} com papel de permissao.`,
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
    showToast(userId ? "Funcionario atualizado com sucesso." : "Funcionario cadastrado com sucesso.", "success");
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
    showPurchaseNotification(`Nova solicitacao: ${metadata.primaryItemLabel || "item"} para ${metadata.department || "-"}.`, "created");
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
        showPurchaseNotification(`Nova solicitacao: ${metadata.primaryItemLabel || "item"} para ${metadata.department || "-"}.`, "created");
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
    normalizedMessage.toLowerCase().includes("codigo ou senha invalidos")
    || normalizedMessage.toLowerCase().includes("credenciais invalidas")
  ) {
    return `Usuario ou senha invalidos. Apos ${LOGIN_MAX_ATTEMPTS} tentativas, o acesso e bloqueado temporariamente.`;
  }

  return normalizedMessage || "Nao foi possivel concluir a autenticacao.";
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
  return error?.message || "Ocorreu um erro inesperado.";
}

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
