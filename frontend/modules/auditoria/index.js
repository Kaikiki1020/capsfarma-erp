function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!bridge.hasPermission("audit", "view")) {
      return helpers.noPermissionTemplate("Seu perfil não possui acesso ao módulo de auditoria.");
    }

    const logs = state.moduleData.auditLogs || [];
    const selectedLog = logs.find((item) => item.id === state.auditSelectedLogId) || logs[0] || null;
    const userOptions = Array.from(new Set(logs.map((item) => item.usuario_nome).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .map((name) => ({ value: name, label: name }));
    const moduleOptions = helpers.getAuditKnownModules();
    const actionOptions = helpers.getAuditLogActionOptions(logs);

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
          ${helpers.renderKpiCard({ label: "Logs carregados", value: logs.length, note: logs.length ? "Últimos 500 registros filtrados" : "Nenhum registro encontrado", icon: "◰", tone: "blue" })}
          ${helpers.renderKpiCard({ label: "Críticos", value: logs.filter((item) => item.nivel === "Critico").length, note: "Eventos de alto impacto", icon: "!", tone: "red" })}
          ${helpers.renderKpiCard({ label: "Atenção", value: logs.filter((item) => item.nivel === "Atenção").length, note: "Eventos com alerta operacional", icon: "•", tone: "amber" })}
          ${helpers.renderKpiCard({ label: "Módulos ativos", value: new Set(logs.map((item) => item.modulo).filter(Boolean)).size, note: "Categorias presentes no filtro atual", icon: "⊞", tone: "green" })}
        </div>

        <form id="audit-filter-form" class="table-actions audit-filter-grid">
          <label>Módulo<select name="module"><option value="all">Todos</option>${helpers.renderOptions(moduleOptions, state.auditFilters.module)}</select></label>
          <label>Usuário<select name="user"><option value="all">Todos</option>${helpers.renderOptions(userOptions, state.auditFilters.user)}</select></label>
          <label>Ação<select name="action"><option value="all">Todas</option>${helpers.renderOptions(actionOptions, state.auditFilters.action)}</select></label>
          <label>Nível<select name="level">${helpers.renderOptions([
            { value: "all", label: "Todos" },
            { value: "Informativo", label: "Informativo" },
            { value: "Atenção", label: "Atenção" },
            { value: "Critico", label: "Critico" },
          ], state.auditFilters.level)}</select></label>
          <label>Data inicial<input name="date_from" type="date" value="${helpers.escapeHtml(state.auditFilters.date_from)}" /></label>
          <label>Data final<input name="date_to" type="date" value="${helpers.escapeHtml(state.auditFilters.date_to)}" /></label>
          <label class="audit-filter-search">Busca textual<input name="search" type="text" placeholder="Buscar por item, descrição, usuário ou ação..." value="${helpers.escapeHtml(state.auditFilters.search)}" /></label>
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
                        <td>${helpers.formatDateTime(log.created_at)}</td>
                        <td>${helpers.escapeHtml(helpers.getModuleLabel(log.modulo))}</td>
                        <td>${helpers.escapeHtml(log.acao || "-")}</td>
                        <td>${helpers.escapeHtml(log.usuario_nome || "-")}</td>
                        <td>${helpers.escapeHtml(log.item_afetado || "-")}</td>
                        <td>${helpers.renderAuditLevelBadge(log.nivel)}</td>
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
                      <h3>${helpers.escapeHtml(selectedLog.acao || "Log")}</h3>
                    </div>
                  </div>
                  <div class="audit-detail-grid">
                    <div><span>Módulo</span><strong>${helpers.escapeHtml(helpers.getModuleLabel(selectedLog.modulo))}</strong></div>
                    <div><span>Usuário</span><strong>${helpers.escapeHtml(selectedLog.usuario_nome || "-")}</strong></div>
                    <div><span>Perfil</span><strong>${helpers.escapeHtml(selectedLog.usuario_perfil || "-")}</strong></div>
                    <div><span>Data/Hora</span><strong>${helpers.escapeHtml(helpers.formatDateTime(selectedLog.created_at))}</strong></div>
                    <div><span>IP</span><strong>${helpers.escapeHtml(selectedLog.ip || "-")}</strong></div>
                    <div><span>Nível</span><strong>${helpers.escapeHtml(selectedLog.nivel || "-")}</strong></div>
                    <div><span>Item afetado</span><strong>${helpers.escapeHtml(selectedLog.item_afetado || "-")}</strong></div>
                    <div><span>Entidade</span><strong>${helpers.escapeHtml(selectedLog.entidade_tipo || "-")} ${helpers.escapeHtml(selectedLog.entidade_id || "")}</strong></div>
                  </div>
                  <section class="form-section">
                    <h4>Descrição</h4>
                    <p class="audit-detail-description">${helpers.escapeHtml(selectedLog.descricao || "-")}</p>
                  </section>
                  <section class="form-section">
                    <h4>Payload</h4>
                    <pre class="audit-payload">${helpers.escapeHtml(JSON.stringify(selectedLog.payload || {}, null, 2))}</pre>
                  </section>
                `
                : `<div class="empty-state">Selecione um log para visualizar o detalhamento.</div>`
            }
          </aside>
        </div>
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

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
        await helpers.loadAuditLogs();
        helpers.renderActiveModule();
      });
    }

    document.querySelector("[data-audit-reset]")?.addEventListener("click", async () => {
      state.auditFilters = helpers.createEmptyAuditFilters();
      await helpers.loadAuditLogs();
      helpers.renderActiveModule();
    });

    document.querySelector("[data-audit-refresh]")?.addEventListener("click", async () => {
      await helpers.loadAuditLogs();
      helpers.renderActiveModule();
      helpers.showToast("Central de logs atualizada.", "success");
    });

    document.querySelector("[data-audit-export-pdf]")?.addEventListener("click", () => {
      helpers.openPrintWindowForHtml(helpers.buildAuditExportHtml(state.moduleData.auditLogs || []), "Central de Logs");
    });

    document.querySelectorAll("[data-audit-select-log]").forEach((button) => {
      button.addEventListener("click", () => {
        state.auditSelectedLogId = button.dataset.auditSelectLog;
        helpers.renderActiveModule();
      });
    });
  },
};
