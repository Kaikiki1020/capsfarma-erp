const fs = require("fs");
const os = require("os");
const path = require("path");
const { promisify } = require("util");
const { exec } = require("child_process");

const execAsync = promisify(exec);
loadDotEnv();

const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  snapshotIntervalMs: Number(process.env.VPS_AGENT_INTERVAL_MS || 60000),
  actionPollMs: Number(process.env.VPS_ACTION_POLL_MS || 15000),
  projects: parseJsonEnv("VPS_PROJECTS_JSON", []),
  domains: parseJsonEnv("VPS_DOMAINS_JSON", []),
  backupPaths: parseJsonEnv("VPS_BACKUP_PATHS_JSON", []),
  database: {
    engine: process.env.VPS_DB_ENGINE || "MySQL",
    name: process.env.VPS_DB_NAME || null,
    container: process.env.SUPABASE_DB_CONTAINER || "supabase_db_capsfarma-erp",
  },
};

if (!config.supabaseUrl || !config.serviceRoleKey) {
  console.error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.");
  process.exit(1);
}

function loadDotEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../.env"),
  ];
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function parseJsonEnv(key, fallback) {
  try {
    return JSON.parse(process.env[key] || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function getDatabaseServiceConfig() {
  const normalizedEngine = String(config.database.engine || "").trim().toLowerCase();
  if (normalizedEngine.includes("postgre")) {
    return { label: "PostgreSQL", systemdName: "postgresql", containerName: config.database.container };
  }
  if (normalizedEngine.includes("maria")) {
    return { label: "MariaDB", systemdName: "mariadb", containerName: null };
  }
  return { label: "MySQL", systemdName: "mysql", containerName: null };
}

function getMonitoredServiceNames() {
  const databaseService = getDatabaseServiceConfig();
  return ["Nginx", "Node.js", databaseService.label, "Docker"];
}

function getServiceRuntimeConfig(serviceName) {
  const databaseService = getDatabaseServiceConfig();
  if (serviceName === "Nginx") {
    return { runtime: "docker", target: "capsfarma-erp-web-8080" };
  }
  if (serviceName === "Node.js") {
    return { runtime: "systemd", target: "capsfarma-vps-agent.service" };
  }
  if (serviceName === databaseService.label) {
    if (databaseService.containerName) {
      return { runtime: "docker", target: databaseService.containerName };
    }
    return { runtime: "systemd", target: databaseService.systemdName };
  }
  if (serviceName === "Docker") {
    return { runtime: "systemd", target: "docker" };
  }
  return null;
}

async function request(pathname, options = {}) {
  const response = await fetch(`${config.supabaseUrl}${pathname}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Falha em ${pathname}`);
  }
  return data;
}

async function safeCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command, { shell: "/bin/bash", maxBuffer: 1024 * 1024 * 4 });
    return { ok: true, stdout: String(stdout || ""), stderr: String(stderr || "") };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || ""),
      stderr: String(error.stderr || error.message || ""),
    };
  }
}

function formatUptime(seconds) {
  const total = Math.max(Number(seconds || 0), 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days) return `${days}d ${hours}h ${minutes}m`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function getCpuUsage() {
  const read = () => {
    const line = fs.readFileSync("/proc/stat", "utf8").split("\n")[0].trim().split(/\s+/).slice(1).map(Number);
    const idle = line[3] + line[4];
    const total = line.reduce((sum, value) => sum + value, 0);
    return { idle, total };
  };
  const first = read();
  await new Promise((resolve) => setTimeout(resolve, 250));
  const second = read();
  const idle = second.idle - first.idle;
  const total = second.total - first.total || 1;
  return Number((((total - idle) / total) * 100).toFixed(2));
}

async function getDiskUsage() {
  const result = await safeCommand("df -P / | tail -1");
  if (!result.ok) return 0;
  const parts = result.stdout.trim().split(/\s+/);
  return Number(String(parts[4] || "0").replace("%", "")) || 0;
}

async function getServerIp() {
  const result = await safeCommand("hostname -I");
  return result.ok ? result.stdout.trim().split(/\s+/)[0] || null : null;
}

function getOperatingSystem() {
  try {
    const content = fs.readFileSync("/etc/os-release", "utf8");
    const pretty = content.split("\n").find((line) => line.startsWith("PRETTY_NAME="));
    return pretty ? pretty.split("=")[1].replaceAll('"', "") : `${os.type()} ${os.release()}`;
  } catch {
    return `${os.type()} ${os.release()}`;
  }
}

async function getServiceStatus(serviceName) {
  const databaseService = getDatabaseServiceConfig();

  if (serviceName === "PM2") {
    const pm2 = await safeCommand("pm2 jlist");
    if (!pm2.ok) return { service_name: "PM2", status: "offline", uptime_label: "-", details: {} };
    const apps = JSON.parse(pm2.stdout || "[]");
    const online = apps.some((item) => item.pm2_env?.status === "online");
    const started = apps
      .map((item) => item.pm2_env?.pm_uptime || 0)
      .filter(Boolean)
      .sort()[0];
    return {
      service_name: "PM2",
      status: online ? "online" : "offline",
      uptime_label: started ? formatUptime((Date.now() - started) / 1000) : "-",
      details: { managed_apps: apps.map((item) => item.name) },
      updated_at: new Date().toISOString(),
    };
  }

  if (serviceName === "Nginx") {
    const webContainer = await safeCommand("docker inspect -f '{{.State.Running}} {{.State.StartedAt}}' capsfarma-erp-web-8080");
    if (webContainer.ok) {
      const [running, startedAt] = webContainer.stdout.trim().split(/\s+/, 2);
      if (running === "true") {
        return {
          service_name: "Nginx",
          status: "online",
          uptime_label: startedAt || "-",
          details: { runtime: "docker", container_name: "capsfarma-erp-web-8080" },
          updated_at: new Date().toISOString(),
        };
      }
    }
  }

  if (serviceName === "Node.js") {
    const nodeProcess = await safeCommand("ps -C node -o pid=,args=");
    if (nodeProcess.ok) {
      const lines = nodeProcess.stdout
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const runningAgent = lines.find((line) => line.includes("backend/scripts/vps-agent.js"));
      if (runningAgent) {
        const [pid] = runningAgent.split(/\s+/, 1);
        return {
          service_name: "Node.js",
          status: "online",
          uptime_label: `pid ${pid}`,
          details: { runtime: "process", process_match: "backend/scripts/vps-agent.js" },
          updated_at: new Date().toISOString(),
        };
      }
    }
  }

  if (serviceName === databaseService.label && databaseService.containerName) {
    const databaseContainer = await safeCommand(`docker inspect -f '{{.State.Running}} {{.State.StartedAt}}' ${databaseService.containerName}`);
    if (databaseContainer.ok) {
      const [running, startedAt] = databaseContainer.stdout.trim().split(/\s+/, 2);
      if (running === "true") {
        return {
          service_name: serviceName,
          status: "online",
          uptime_label: startedAt || "-",
          details: { runtime: "docker", container_name: databaseService.containerName },
          updated_at: new Date().toISOString(),
        };
      }
    }
  }

  const systemdName = {
    Nginx: "nginx",
    "Node.js": "node",
    [databaseService.label]: databaseService.systemdName,
    Docker: "docker",
    Redis: "redis-server",
  }[serviceName];

  const result = await safeCommand(`systemctl is-active ${systemdName}`);
  const uptime = await safeCommand(`systemctl show ${systemdName} --property=ActiveEnterTimestamp --value`);
  return {
    service_name: serviceName,
    status: result.ok && result.stdout.trim() === "active" ? "online" : "offline",
    uptime_label: uptime.ok && uptime.stdout.trim() ? uptime.stdout.trim() : "-",
    details: {},
    updated_at: new Date().toISOString(),
  };
}

async function collectSecuritySnapshot() {
  const portsResult = await safeCommand("ss -ltn");
  const ufwResult = await safeCommand("ufw status");
  const authLogPath = fs.existsSync("/var/log/auth.log") ? "/var/log/auth.log" : null;
  const authTail = authLogPath ? await safeCommand(`tail -n 80 ${authLogPath}`) : await safeCommand("journalctl -n 80 -u ssh");
  const sshConfigResult = await safeCommand("sshd -T");
  const sshConfig = sshConfigResult.ok
    ? sshConfigResult.stdout || ""
    : fs.existsSync("/etc/ssh/sshd_config")
      ? fs.readFileSync("/etc/ssh/sshd_config", "utf8")
      : "";
  const passwd = fs.readFileSync("/etc/passwd", "utf8");

  const openPorts = (portsResult.stdout || "")
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/).pop())
    .filter(Boolean)
    .map((value) => ({ socket: value, port: String(value).split(":").pop() }));

  const accessAttempts = (authTail.stdout || "")
    .split("\n")
    .filter(Boolean)
    .slice(-20)
    .map((line) => ({ entry: line }));

  const suspiciousIps = [...new Set((authTail.stdout || "").match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) || [])]
    .slice(0, 10)
    .map((ip) => ({ ip }));

  const sshUsers = passwd
    .split("\n")
    .filter((line) => /\/(bash|sh|zsh)$/.test(line))
    .map((line) => {
      const [user] = line.split(":");
      return { user };
    })
    .slice(0, 20);

  const alerts = [];
  const firewallActive = /Status:\s+active/i.test(ufwResult.stdout || "");
  if (!firewallActive) alerts.push({ level: "warning", message: "Firewall inativo." });
  if (/PasswordAuthentication\s+yes/i.test(sshConfig)) alerts.push({ level: "warning", message: "SSH com autenticacao por senha habilitada." });
  if (/PermitRootLogin\s+yes/i.test(sshConfig)) alerts.push({ level: "danger", message: "Login SSH do root habilitado." });

  return {
    firewall_active: firewallActive,
    open_ports: openPorts,
    recent_access_attempts: accessAttempts,
    suspicious_ips: suspiciousIps,
    ssh_users: sshUsers,
    auth_status: {
      password_authentication: !/PasswordAuthentication\s+no/i.test(sshConfig),
      root_login_enabled: /PermitRootLogin\s+yes/i.test(sshConfig),
    },
    alerts,
    updated_at: new Date().toISOString(),
  };
}

async function collectApplications(pm2Services = []) {
  const appMap = new Map(pm2Services.map((item) => [item.name, item]));
  const projectConfigs = config.projects.length
    ? config.projects
    : Array.from(appMap.keys()).map((name) => ({ app_name: name, pm2_name: name }));

  return projectConfigs.map((project) => {
    const pm2App = project.pm2_name ? appMap.get(project.pm2_name) : null;
    return {
      app_name: project.app_name,
      domain: project.domain || null,
      port: project.port ? String(project.port) : null,
      project_path: project.project_path || null,
      status: pm2App?.pm2_env?.status === "online" ? "online" : "offline",
      last_updated_at: new Date().toISOString(),
      metadata: {
        pm2_name: project.pm2_name || null,
        last_restart_at: pm2App?.pm2_env?.pm_uptime || null,
      },
    };
  });
}

async function collectDomains() {
  return config.domains.map((domain) => ({
    domain: domain.domain,
    domain_type: domain.type || "primary",
    ssl_status: domain.ssl_status || "unknown",
    ssl_valid_until: domain.ssl_valid_until || null,
    redirect_target: domain.redirect_target || null,
    reverse_proxy_active: Boolean(domain.reverse_proxy_active),
    updated_at: new Date().toISOString(),
    metadata: domain,
  }));
}

async function collectDatabaseStatus() {
  const databaseService = getDatabaseServiceConfig();
  let status = "offline";

  if (databaseService.containerName) {
    const containerStatus = await safeCommand(`docker inspect -f '{{.State.Running}}' ${databaseService.containerName}`);
    if (containerStatus.ok && containerStatus.stdout.trim() === "true") {
      status = "online";
    }
  }

  if (status !== "online") {
    const serviceStatus = await safeCommand(`systemctl is-active ${databaseService.systemdName}`);
    if (serviceStatus.ok && serviceStatus.stdout.trim() === "active") {
      status = "online";
    }
  }

  return {
    engine: databaseService.label,
    database_name: config.database.name,
    status,
    size_mb: null,
    connection_count: null,
    last_backup_at: null,
    updated_at: new Date().toISOString(),
    metadata: {
      container_name: databaseService.containerName,
      systemd_service: databaseService.systemdName,
    },
  };
}

async function syncSnapshot() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpuUsage = await getCpuUsage();
  const diskUsage = await getDiskUsage();
  const memoryUsage = Number((((totalMem - freeMem) / totalMem) * 100).toFixed(2));
  const serverStatus = cpuUsage < 85 && memoryUsage < 90 && diskUsage < 90 ? "healthy" : "alert";
  const uptimeSeconds = Math.floor(os.uptime());
  const ipAddress = await getServerIp();
  const operatingSystem = getOperatingSystem();
  const databaseService = getDatabaseServiceConfig();
  const services = await Promise.all(getMonitoredServiceNames().map(getServiceStatus));
  const serviceNames = services.map((service) => service.service_name);
  const pm2List = (() => {
    const service = services.find((item) => item.service_name === "PM2");
    return service?.details?.managed_apps || [];
  })();
  const applications = await collectApplications(pm2List.map((name) => ({ name, pm2_env: { status: "online" } })));
  const securitySnapshot = await collectSecuritySnapshot();
  const databaseStatus = await collectDatabaseStatus();
  const domains = await collectDomains();

  await request("/rest/v1/vps_snapshots", {
    method: "POST",
    body: JSON.stringify({
      server_status: serverStatus,
      cpu_usage: cpuUsage,
      memory_usage: memoryUsage,
      disk_usage: diskUsage,
      uptime_seconds: uptimeSeconds,
      uptime_label: formatUptime(uptimeSeconds),
      server_ip: ipAddress,
      operating_system: operatingSystem,
      updated_at: new Date().toISOString(),
      raw_payload: {},
    }),
  });

  await request(`/rest/v1/vps_service_status?service_name=not.in.(${serviceNames.map((name) => `"${name}"`).join(",")})`, {
    method: "DELETE",
  });

  for (const service of services) {
    await request("/rest/v1/vps_service_status?on_conflict=service_name", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(service),
    });
  }

  await request("/rest/v1/vps_security_snapshots", {
    method: "POST",
    body: JSON.stringify(securitySnapshot),
  });

  await request("/rest/v1/vps_database_status?id=not.is.null", {
    method: "DELETE",
  });
  await request("/rest/v1/vps_database_status", {
    method: "POST",
    body: JSON.stringify(databaseStatus),
  });

  for (const app of applications) {
    await request("/rest/v1/vps_hosted_applications?on_conflict=app_name", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(app),
    });
  }

  for (const domain of domains) {
    await request("/rest/v1/vps_domain_status?on_conflict=domain", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(domain),
    });
  }
}

async function runAction(item) {
  const action = `${item.action_type}:${item.target_type}:${item.target_name}`;
  if (action === "refresh_snapshot:server:primary") {
    await syncSnapshot();
    return "Snapshot atualizado.";
  }

  const monitoredServices = Object.fromEntries(
    getMonitoredServiceNames().map((serviceName) => [serviceName.toLowerCase(), serviceName])
  );

  if (item.target_type === "service") {
    const normalizedTargetName = monitoredServices[String(item.target_name || "").toLowerCase()];
    if (!normalizedTargetName) throw new Error("Servico nao suportado.");
    const runtimeConfig = getServiceRuntimeConfig(normalizedTargetName);
    if (!runtimeConfig) throw new Error("Servico nao suportado.");

    const command = runtimeConfig.runtime === "docker"
      ? `docker ${item.action_type} ${runtimeConfig.target}`
      : `systemctl ${item.action_type} ${runtimeConfig.target}`;
    const result = await safeCommand(command);
    if (!result.ok) throw new Error(result.stderr || "Falha ao acionar servico.");
    return `${normalizedTargetName} ${item.action_type} executado.`;
  }

  if (item.action_type === "restart_application") {
    const app = config.projects.find((project) => project.app_name === item.target_name);
    if (!app?.pm2_name) throw new Error("Aplicacao sem mapeamento PM2.");
    const result = await safeCommand(`pm2 restart ${app.pm2_name}`);
    if (!result.ok) throw new Error(result.stderr || "Falha ao reiniciar aplicacao.");
    return `Aplicacao ${item.target_name} reiniciada.`;
  }

  if (item.action_type === "generate_backup") {
    const command = item.payload?.scope === "database"
      ? process.env.VPS_DB_BACKUP_COMMAND
      : process.env.VPS_FILES_BACKUP_COMMAND;
    if (!command) throw new Error("Comando de backup nao configurado.");
    const result = await safeCommand(command);
    if (!result.ok) throw new Error(result.stderr || "Falha ao executar backup.");
    return "Backup manual executado.";
  }

  if (item.action_type === "restore_backup") {
    const command = process.env.VPS_RESTORE_BACKUP_COMMAND;
    if (!command) throw new Error("Comando de restauracao nao configurado.");
    const result = await safeCommand(command);
    if (!result.ok) throw new Error(result.stderr || "Falha ao restaurar backup.");
    return "Restauracao iniciada.";
  }

  if (item.action_type === "restart_database") {
    const command = process.env.VPS_DB_RESTART_COMMAND || "systemctl restart mysql";
    const result = await safeCommand(command);
    if (!result.ok) throw new Error(result.stderr || "Falha ao reiniciar banco.");
    return "Banco reiniciado.";
  }

  throw new Error("Acao nao suportada.");
}

async function processActionQueue() {
  const items = await request("/rest/v1/vps_action_queue?status=eq.pending&order=requested_at.asc&limit=20");
  for (const item of items) {
    try {
      const message = await runAction(item);
      await request(`/rest/v1/vps_action_queue?id=eq.${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "completed",
          result_message: message,
          processed_at: new Date().toISOString(),
        }),
      });
      await syncSnapshot();
    } catch (error) {
      await request(`/rest/v1/vps_action_queue?id=eq.${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "failed",
          result_message: error.message,
          processed_at: new Date().toISOString(),
        }),
      });
      await request("/rest/v1/vps_logs", {
        method: "POST",
        body: JSON.stringify({
          source: "agent",
          log_level: "error",
          summary: "Falha em acao da VPS",
          message: `${item.action_type} ${item.target_name}: ${error.message}`,
          occurred_at: new Date().toISOString(),
          is_critical: true,
          metadata: { queue_id: item.id },
        }),
      });
    }
  }
}

async function main() {
  console.log("Agente VPS iniciado.");
  await syncSnapshot();
  setInterval(() => syncSnapshot().catch((error) => console.error("snapshot", error.message)), config.snapshotIntervalMs);
  setInterval(() => processActionQueue().catch((error) => console.error("queue", error.message)), config.actionPollMs);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
