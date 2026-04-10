-- Seed operacional minimo para resets locais do Supabase.
-- Mantem papeis de permissao do sistema sincronizados sem criar usuarios padrao.

select public.seed_system_permission_roles();
