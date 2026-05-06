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
npm run ops:verify-restore
npm run test:syntax
npm run ops:smoke
npm run ops:release-check
bash backend/scripts/provision-secondary-admin.sh
bash backend/scripts/restore-supabase.sh backups/latest.sql --confirm-live-restore
```

Checklist antes de liberar uso:

1. `npm run supabase:status`
2. `npm run ops:smoke`
3. Validar login com os dois usuarios administrativos
4. Gerar um backup manual
5. Executar `npm run ops:verify-restore`
6. Confirmar que `/healthz` responde `ok`

Observacoes:

- Se `BACKUP_DIR` do ambiente apontar para um caminho nao gravavel, o backup cai automaticamente para `backups/` dentro do projeto.
- O backup operacional exporta o schema `public` do ERP com tabelas, funcoes e dados da aplicacao, sem owners/ACLs do Supabase, para permitir restore portavel e validacao isolada.
- `npm run ops:verify-restore` cria um banco temporario no PostgreSQL local, restaura o dump nele e valida funcoes/tabelas criticas sem tocar no banco principal.
- `npm run ops:release-check` valida sintaxe, executa backup operacional, verifica restore isolado e roda o smoke test. O comando falha com worktree sujo, exceto se chamado manualmente com `bash backend/scripts/release-check.sh --allow-dirty`.
- `ops:restore` agora exige `--confirm-live-restore` para evitar restore acidental no banco em uso.
