# Operacao Basica

Arquivos principais para operacao:

- `.env`: variaveis de ambiente locais da VPS.
- `backend/scripts/backup-supabase.sh`: gera dump SQL do banco local.
- `backend/scripts/restore-supabase.sh`: restaura um dump SQL.
- `backend/scripts/smoke-test.sh`: valida web, Supabase e objetos criticos.
- `backend/scripts/provision-secondary-admin.sh`: garante um segundo usuario TI.

Comandos:

```bash
npm run ops:backup
npm run ops:smoke
bash backend/scripts/provision-secondary-admin.sh
bash backend/scripts/restore-supabase.sh /root/capsfarma-erp/backups/latest.sql
```

Checklist antes de liberar uso:

1. `npm run supabase:status`
2. `npm run ops:smoke`
3. Validar login com os dois usuarios administrativos
4. Gerar um backup manual
5. Confirmar que `/healthz` responde `ok`
