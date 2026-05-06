function getBridge() {
  const bridge = window.CAPSFARMA_MODULE_BRIDGE;
  if (!bridge) {
    throw new Error("Bridge modular do ERP indisponível.");
  }
  return bridge;
}

function renderOptionList(options, selectedValue, helpers) {
  return options
    .map((option) => `<option value="${option}" ${option === selectedValue ? "selected" : ""}>${option === "all" ? "Todos" : helpers.escapeHtml(option)}</option>`)
    .join("");
}

function renderVpsServiceCard(service, helpers) {
  return `
    <article class="permission-role-card vps-service-card">
      <div class="permission-role-card-head">
        <div>
          <h4>${helpers.escapeHtml(service.service_name || "-")}</h4>
          <p class="muted">Tempo em execucao: ${helpers.escapeHtml(service.uptime_label || "-")}</p>
        </div>
        ${helpers.renderVpsHealthBadge(service.status)}
      </div>
      <div class="form-actions-row">
        <button class="inline-button" type="button" data-vps-action="start" data-vps-target-type="service" data-vps-target-name="${helpers.escapeHtml(service.service_name || "")}">Iniciar</button>
        <button class="inline-button danger-button" type="button" data-vps-action="stop" data-vps-target-type="service" data-vps-target-name="${helpers.escapeHtml(service.service_name || "")}">Parar</button>
        <button class="inline-button" type="button" data-vps-action="restart" data-vps-target-type="service" data-vps-target-name="${helpers.escapeHtml(service.service_name || "")}">Reiniciar</button>
      </div>
    </article>
  `;
}

function renderVpsApplicationCard(app, helpers) {
  return `
    <article class="permission-role-card vps-application-card">
      <div class="permission-role-card-head">
        <div>
          <h4>${helpers.escapeHtml(app.app_name || "-")}</h4>
          <p class="muted">${helpers.escapeHtml(app.domain || "Sem dominio")} · Porta ${helpers.escapeHtml(app.port || "-")}</p>
        </div>
        ${helpers.renderVpsHealthBadge(app.status)}
      </div>
      <p class="muted">Pasta: ${helpers.escapeHtml(app.project_path || "-")}</p>
      <p class="muted">Última atualização: ${helpers.formatDateTime(app.last_updated_at)}</p>
      <div class="form-actions-row">
        <button class="inline-button" type="button" data-vps-action="restart_application" data-vps-target-type="application" data-vps-target-name="${helpers.escapeHtml(app.app_name || "")}">Reiniciar Aplicação</button>
      </div>
    </article>
  `;
}

function renderVpsLogItem(log, helpers) {
  return `
    <article class="vps-log-item ${log.is_critical ? "is-critical" : ""}">
      <div class="vps-log-item-head">
        <strong>${helpers.escapeHtml(log.summary || "-")}</strong>
        ${helpers.renderVpsHealthBadge(log.is_critical ? "critical" : log.log_level)}
      </div>
      <p class="muted">${helpers.escapeHtml(log.source || "-")} · ${helpers.formatDateTime(log.occurred_at)}</p>
      <pre>${helpers.escapeHtml(log.message || "-")}</pre>
    </article>
  `;
}

function renderVpsAlertTag(alert, helpers) {
  const className = alert.level === "danger" ? "permission-tag danger-tag" : "permission-tag warning-tag";
  return `<span class="${className}">${helpers.escapeHtml(alert.message || "-")}</span>`;
}

export default {
  render() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    if (!helpers.isTiUser()) {
      return helpers.noPermissionTemplate("Acesso não autorizado");
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
    const supabaseConfigured = helpers.hasSupabaseConfig();

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
          ${helpers.renderKpiCard({ label: "Supabase", value: supabaseConfigured ? "Conectado" : "Não configurado", note: supabaseConfigured ? "Conexão principal do sistema ativa" : "Verifique supabase/config.js", icon: "SB", tone: supabaseConfigured ? "green" : "red" })}
          ${helpers.renderKpiCard({ label: "Status Geral", value: helpers.formatVpsStatusLabel(summary.server_status), note: "Saude consolidada da VPS", icon: "▣", tone: summary.server_status === "healthy" ? "green" : "red" })}
          ${helpers.renderKpiCard({ label: "CPU", value: `${helpers.formatPercent(summary.cpu_usage)}%`, note: "Uso atual do processador", icon: "CPU", tone: helpers.getMetricTone(summary.cpu_usage, 75, 90) })}
          ${helpers.renderKpiCard({ label: "Memoria", value: `${helpers.formatPercent(summary.memory_usage)}%`, note: "Consumo de RAM", icon: "RAM", tone: helpers.getMetricTone(summary.memory_usage, 75, 90) })}
          ${helpers.renderKpiCard({ label: "Disco", value: `${helpers.formatPercent(summary.disk_usage)}%`, note: "Ocupação do disco raiz", icon: "SSD", tone: helpers.getMetricTone(summary.disk_usage, 80, 92) })}
          ${helpers.renderKpiCard({ label: "Uptime", value: helpers.escapeHtml(summary.uptime_label || "-"), note: "Tempo em operação", icon: "UP", tone: "blue" })}
          ${helpers.renderKpiCard({ label: "IP", value: helpers.escapeHtml(summary.server_ip || "-"), note: "Endereço principal", icon: "IP", tone: "blue" })}
          ${helpers.renderKpiCard({ label: "Sistema", value: helpers.escapeHtml(summary.operating_system || "-"), note: "Sistema operacional da VPS", icon: "OS", tone: "blue" })}
          ${helpers.renderKpiCard({ label: "Última Atualização", value: helpers.formatDateTime(summary.updated_at), note: "Último snapshot recebido", icon: "CLK", tone: "blue" })}
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
              ${services.length ? services.map((service) => renderVpsServiceCard(service, helpers)).join("") : `<div class="empty-state">Nenhum serviço monitorado.</div>`}
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
              <input type="search" name="search" placeholder="Pesquisar log" value="${helpers.escapeHtml(state.vpsControl.logFilters.search)}" />
              <select name="source">
                ${renderOptionList(["all", "system", "nginx", "backend", "pm2", "database", "agent"], state.vpsControl.logFilters.source, helpers)}
              </select>
              <select name="level">
                ${renderOptionList(["all", "info", "warning", "error", "critical"], state.vpsControl.logFilters.level, helpers)}
              </select>
              <input type="date" name="date_from" value="${helpers.escapeHtml(state.vpsControl.logFilters.dateFrom)}" />
              <input type="date" name="date_to" value="${helpers.escapeHtml(state.vpsControl.logFilters.dateTo)}" />
              <button class="secondary-button" type="submit">Filtrar</button>
            </form>
            <div class="vps-log-list">
              ${logs.length ? logs.map((log) => renderVpsLogItem(log, helpers)).join("") : `<div class="empty-state">Nenhum log encontrado.</div>`}
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
              ${applications.length ? applications.map((app) => renderVpsApplicationCard(app, helpers)).join("") : `<div class="empty-state">Nenhuma aplicação cadastrada.</div>`}
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
                <div class="permission-tag-list">${(security.alerts || []).length ? security.alerts.map((alert) => renderVpsAlertTag(alert, helpers)).join("") : `<span class="permission-tag">Sem alertas imediatos</span>`}</div>
              </article>
              <article class="card">
                <strong>Portas Abertas</strong>
                <div class="permission-tag-list">${(security.open_ports || []).length ? security.open_ports.map((item) => `<span class="permission-tag">${helpers.escapeHtml(item.port || item.socket || "-")}</span>`).join("") : `<span class="muted">Nenhuma porta registrada.</span>`}</div>
              </article>
              <article class="card">
                <strong>IPs Suspeitos</strong>
                <div class="permission-tag-list">${(security.suspicious_ips || []).length ? security.suspicious_ips.map((item) => `<span class="permission-tag danger-tag">${helpers.escapeHtml(item.ip || "-")}</span>`).join("") : `<span class="muted">Nenhum IP suspeito no snapshot.</span>`}</div>
              </article>
              <article class="card">
                <strong>Usuários SSH</strong>
                <div class="permission-tag-list">${(security.ssh_users || []).length ? security.ssh_users.map((item) => `<span class="permission-tag">${helpers.escapeHtml(item.user || "-")}</span>`).join("") : `<span class="muted">Sem usuários listados.</span>`}</div>
              </article>
            </div>
            <div class="vps-list-block">
              <h5>Tentativas recentes de acesso</h5>
              ${(security.recent_access_attempts || []).length ? `<ul class="vps-inline-list">${security.recent_access_attempts.map((item) => `<li>${helpers.escapeHtml(item.entry || "-")}</li>`).join("")}</ul>` : `<div class="empty-state compact-empty">Nenhuma tentativa recente registrada.</div>`}
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
                      <td>${helpers.escapeHtml(item.backup_type || "-")}</td>
                      <td>${helpers.renderVpsHealthBadge(item.status)}</td>
                      <td>${helpers.escapeHtml(item.artifact_name || "-")}</td>
                      <td>${helpers.formatDateTime(item.started_at)}</td>
                      <td>${helpers.formatDateTime(item.finished_at)}</td>
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
                <button class="ghost-button" type="button" data-vps-action="restart_database" data-vps-target-type="database" data-vps-target-name="${helpers.escapeHtml(database.engine || "database")}">Reiniciar Banco</button>
                <button class="secondary-button" type="button" data-vps-action="generate_backup" data-vps-target-type="backup" data-vps-target-name="database" data-vps-payload='{"scope":"database"}' data-vps-confirm="Gerar backup manual do banco agora?">Backup Manual</button>
              </div>
            </div>
            <div class="summary-grid vps-mini-grid">
              ${helpers.renderKpiCard({ label: "Engine", value: helpers.escapeHtml(database.engine || "-"), note: "Motor em uso", icon: "DB", tone: "blue" })}
              ${helpers.renderKpiCard({ label: "Status", value: helpers.formatVpsStatusLabel(database.status), note: "Disponibilidade atual", icon: "SQL", tone: database.status === "online" ? "green" : "red" })}
              ${helpers.renderKpiCard({ label: "Banco", value: helpers.escapeHtml(database.database_name || "-"), note: "Base principal", icon: "NAM", tone: "blue" })}
              ${helpers.renderKpiCard({ label: "Conexoes", value: helpers.escapeHtml(database.connection_count ?? "-"), note: "Conexoes abertas", icon: "CON", tone: "blue" })}
            </div>
            <div class="vps-list-block">
              <h5>Tabelas do banco</h5>
              <p class="muted">${databaseTables.length} tabela(s) monitorada(s) no schema public.</p>
              <div class="table-actions single-search-row">
                <label>
                  Buscar tabela...
                  <input type="search" id="vps-database-table-filter" placeholder="Ex.: products" value="${helpers.escapeHtml(state.vpsControl.databaseTableFilter)}" />
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
                            <td>${helpers.escapeHtml(table.schema_name || "-")}</td>
                            <td><button class="inline-button" type="button" data-vps-database-table="${helpers.escapeHtml(table.table_name || "")}">${helpers.escapeHtml(table.table_name || "-")}</button></td>
                            <td>${helpers.escapeHtml(String(table.live_rows_estimate ?? "-"))}</td>
                            <td>${helpers.escapeHtml(String(table.dead_rows_estimate ?? "-"))}</td>
                            <td>${helpers.escapeHtml(table.total_size || "-")}</td>
                            <td>${helpers.renderVpsHealthBadge(table.health_status)}</td>
                            <td>${helpers.formatDateTime(table.last_autoanalyze || table.last_analyze)}</td>
                          </tr>
                        `).join("")
                        : `<tr><td colspan="7">Nenhuma tabela monitorada.</td></tr>`
                    }
                  </tbody>
                </table>
              </div>
            </div>
            <div class="vps-list-block">
              <h5>Detalhes da tabela ${helpers.escapeHtml(state.vpsControl.databaseSelectedTable || "-")}</h5>
              ${
                databaseDetail?.table_name
                  ? `
                    <div class="summary-grid vps-mini-grid">
                      ${helpers.renderKpiCard({ label: "Schema", value: helpers.escapeHtml(databaseDetail.schema_name || "-"), note: "Origem da tabela", icon: "SCH", tone: "blue" })}
                      ${helpers.renderKpiCard({ label: "Colunas", value: databaseDetail.columns?.length || 0, note: "Estrutura atual", icon: "COL", tone: "blue" })}
                      ${helpers.renderKpiCard({ label: "Indices", value: databaseDetail.indexes?.length || 0, note: "Indices detectados", icon: "IDX", tone: "green" })}
                      ${helpers.renderKpiCard({ label: "Tamanho", value: helpers.escapeHtml(databaseDetail.total_size || "-"), note: "Tamanho total", icon: "SIZ", tone: "amber" })}
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
                                <td>${helpers.escapeHtml(column.column_name || "-")}</td>
                                <td>${helpers.escapeHtml(column.data_type || "-")}</td>
                                <td>${column.is_nullable ? "Sim" : "Não"}</td>
                                <td>${helpers.escapeHtml(column.column_default || "-")}</td>
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
                          ? `<ul class="vps-inline-list">${databaseDetail.indexes.map((index) => `<li>${helpers.escapeHtml(index.index_name || "-")} • ${helpers.escapeHtml(index.index_definition || "-")}</li>`).join("")}</ul>`
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
                      <td>${helpers.escapeHtml(item.domain || "-")}</td>
                      <td>${helpers.escapeHtml(item.domain_type || "-")}</td>
                      <td>${helpers.renderVpsHealthBadge(item.ssl_status)}</td>
                      <td>${helpers.formatDateTime(item.ssl_valid_until)}</td>
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
                      <td>${helpers.escapeHtml(item.actor_name || "-")}</td>
                      <td>${helpers.escapeHtml(item.action || "-")}</td>
                      <td>${helpers.escapeHtml(item.service_affected || item.target_name || "-")}</td>
                      <td>${helpers.escapeHtml(item.origin_ip || "-")}</td>
                      <td>${helpers.formatDateTime(item.created_at)}</td>
                    </tr>
                  `).join("") : `<tr><td colspan="5">Nenhuma ação auditada.</td></tr>`}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    `;
  },

  bind() {
    const bridge = getBridge();
    const state = bridge.getState();
    const helpers = bridge.helpers;

    document.querySelector("[data-vps-refresh]")?.addEventListener("click", async () => {
      try {
        await helpers.enqueueVpsAction("refresh_snapshot", "server", "primary");
        await helpers.loadVpsControlData();
        helpers.renderActiveModule();
        helpers.showToast("Atualização da VPS solicitada.", "success");
      } catch (error) {
        helpers.showToast(helpers.formatError(error), "danger");
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
        const logs = await helpers.callVpsControlApi("logs", {
          query: {
            source: state.vpsControl.logFilters.source,
            level: state.vpsControl.logFilters.level,
            search: state.vpsControl.logFilters.search,
            date_from: state.vpsControl.logFilters.dateFrom,
            date_to: state.vpsControl.logFilters.dateTo,
          },
        });
        state.vpsControl.logs = logs || [];
        helpers.renderActiveModule();
      } catch (error) {
        helpers.showToast(helpers.formatError(error), "danger");
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
          await helpers.enqueueVpsAction(actionType, targetType, targetName, payload);
          await helpers.loadVpsControlData();
          helpers.renderActiveModule();
          helpers.showToast("Ação enviada para a fila segura da VPS.", "success");
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });

    helpers.bindDeferredTextFilter("#vps-database-table-filter", (value) => {
      state.vpsControl.databaseTableFilter = value;
    });

    document.querySelectorAll("[data-vps-database-table]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await helpers.loadVpsDatabaseTableDetail(button.dataset.vpsDatabaseTable);
          helpers.renderActiveModule();
        } catch (error) {
          helpers.showToast(helpers.formatError(error), "danger");
        }
      });
    });
  },
};
