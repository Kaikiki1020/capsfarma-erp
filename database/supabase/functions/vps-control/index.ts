import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type TiUser = {
  id: string;
  full_name: string;
  role: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function getAccessToken(request: Request) {
  const authorization = request.headers.get("authorization") || request.headers.get("Authorization") || "";
  return authorization.replace(/^Bearer\s+/i, "").trim();
}

function getOriginIp(request: Request) {
  const raw = request.headers.get("x-forwarded-for")
    || request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || "";
  return raw.split(",")[0]?.trim() || null;
}

async function requireTiUser(request: Request): Promise<TiUser> {
  const token = getAccessToken(request);
  if (!token) {
    throw new Response(JSON.stringify({ error: "Acesso nao autorizado" }), { status: 401, headers: corsHeaders });
  }

  const { data, error } = await supabase.rpc("require_ti_user", { p_access_token: token });
  if (error || !data) {
    throw new Response(JSON.stringify({ error: "Acesso nao autorizado" }), { status: 403, headers: corsHeaders });
  }

  return data as TiUser;
}

async function writeAuditLog(user: TiUser, action: string, request: Request, details: Record<string, unknown> = {}) {
  await supabase.from("vps_audit_log").insert({
    actor_user_id: user.id,
    actor_name: user.full_name,
    actor_role: user.role,
    action,
    service_affected: details.service_affected ?? null,
    target_name: details.target_name ?? null,
    origin_ip: getOriginIp(request),
    details,
  });
}

async function getSnapshot() {
  const [
    snapshotResult,
    servicesResult,
    applicationsResult,
    securityResult,
    backupsResult,
    databaseResult,
    domainsResult,
    auditResult,
  ] = await Promise.all([
    supabase.from("vps_snapshots").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("vps_service_status").select("*").order("service_name", { ascending: true }),
    supabase.from("vps_hosted_applications").select("*").order("app_name", { ascending: true }),
    supabase.from("vps_security_snapshots").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("vps_backups").select("*").order("finished_at", { ascending: false, nullsFirst: false }).limit(12),
    supabase.from("vps_database_status").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("vps_domain_status").select("*").order("domain", { ascending: true }),
    supabase.from("vps_audit_log").select("*").order("created_at", { ascending: false }).limit(25),
  ]);

  const firstError = [
    snapshotResult.error,
    servicesResult.error,
    applicationsResult.error,
    securityResult.error,
    backupsResult.error,
    databaseResult.error,
    domainsResult.error,
    auditResult.error,
  ].find(Boolean);

  if (firstError) throw firstError;

  return {
    summary: snapshotResult.data,
    services: servicesResult.data || [],
    applications: applicationsResult.data || [],
    security: securityResult.data,
    backups: backupsResult.data || [],
    database: databaseResult.data,
    domains: domainsResult.data || [],
    audit: auditResult.data || [],
  };
}

async function getLogs(url: URL) {
  let query = supabase.from("vps_logs").select("*").order("occurred_at", { ascending: false }).limit(200);

  const source = url.searchParams.get("source");
  const level = url.searchParams.get("level");
  const search = url.searchParams.get("search");
  const dateFrom = url.searchParams.get("date_from");
  const dateTo = url.searchParams.get("date_to");

  if (source && source !== "all") query = query.eq("source", source);
  if (level && level !== "all") {
    if (level === "critical") {
      query = query.eq("is_critical", true);
    } else {
      query = query.eq("log_level", level);
    }
  }
  if (search) query = query.or(`summary.ilike.%${search}%,message.ilike.%${search}%`);
  if (dateFrom) query = query.gte("occurred_at", dateFrom);
  if (dateTo) query = query.lte("occurred_at", dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function enqueueAction(user: TiUser, request: Request) {
  const payload = await request.json();
  const actionType = String(payload?.action_type || "").trim();
  const targetType = String(payload?.target_type || "").trim();
  const targetName = String(payload?.target_name || "").trim();
  const actionPayload = payload?.payload && typeof payload.payload === "object" ? payload.payload : {};
  const allowedActions = new Set([
    "start",
    "stop",
    "restart",
    "restart_application",
    "generate_backup",
    "restore_backup",
    "restart_database",
    "refresh_snapshot",
  ]);

  if (!allowedActions.has(actionType) || !targetType || !targetName) {
    return jsonResponse({ error: "Acao de VPS invalida." }, 400);
  }

  const { data, error } = await supabase
    .from("vps_action_queue")
    .insert({
      action_type: actionType,
      target_type: targetType,
      target_name: targetName,
      payload: actionPayload,
      requested_by_user_id: user.id,
      requested_by_name: user.full_name,
      origin_ip: getOriginIp(request),
    })
    .select("*")
    .single();

  if (error) throw error;

  await writeAuditLog(user, `VPS_${actionType.toUpperCase()}`, request, {
    service_affected: targetType,
    target_name: targetName,
    payload: actionPayload,
  });

  return jsonResponse({ ok: true, action: data });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const view = url.searchParams.get("view") || "snapshot";
    const user = await requireTiUser(request);

    if (request.method === "GET" && view === "snapshot") {
      return jsonResponse(await getSnapshot());
    }

    if (request.method === "GET" && view === "logs") {
      await writeAuditLog(user, "VPS_VIEW_LOGS", request, {
        filters: Object.fromEntries(url.searchParams.entries()),
      });
      return jsonResponse(await getLogs(url));
    }

    if (request.method === "POST" && view === "actions") {
      return await enqueueAction(user, request);
    }

    return jsonResponse({ error: "Operacao nao suportada." }, 405);
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ error: error instanceof Error ? error.message : "Falha interna no modulo VPS." }, 500);
  }
});
