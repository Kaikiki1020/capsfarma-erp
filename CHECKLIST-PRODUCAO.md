# Checklist de Liberacao para Uso 100%

Data da validacao tecnica: 2026-04-10

## Validado no servidor

- Web na porta 8080 respondendo com healthcheck e HTML principal.
- Stack local do Supabase ativa e saudavel em Docker.
- Agente VPS ativo em systemd.
- Backup SQL portavel do schema `public` gerado com sucesso em `backups/latest.sql`.
- Restore de teste agora pode ser validado em banco temporario isolado com `npm run ops:verify-restore`.
- Funcoes criticas do banco presentes:
  - `login_user`
  - `get_my_permissions`
  - `create_staff_user`
  - `get_vps_control_snapshot`
- Tabelas operacionais criticas presentes:
  - `app_users`
  - `products`
  - `sales`
  - `service_orders`
  - `purchase_requests`
  - `customers`
- Painel VPS ajustado para mostrar apenas servicos reais deste servidor:
  - `Docker`
  - `Nginx`
  - `Node.js`
  - `PostgreSQL`

## Estado atual dos dados

- Usuarios ativos: 2
- Perfis de permissao: 3
- Itens de permissao por perfil: 38
- Produtos cadastrados: 1
- Clientes cadastrados: 0
- Vendas cadastradas: 0
- Solicitacoes de compra cadastradas: 0
- Ordens de servico cadastradas: 0
- Ordens de producao cadastradas: 0

## Bloqueios tecnicos removidos nesta validacao

- Monitoramento de banco do modulo VPS corrigido para PostgreSQL/Supabase local.
- Lista de servicos do modulo VPS reduzida aos servicos reais do servidor.
- Script de provisionamento de admin endurecido contra entrada invalida.
- Fallback indevido de ordem de servico para `localStorage` restringido.

## Ainda obrigatorio antes de operar 100%

- Homologar login real com os usuarios administrativos.
- Cadastrar e validar pelo menos:
  - 1 cliente real
  - 1 venda real de teste
  - 1 solicitacao de compra de teste
  - 1 ordem de servico de teste
  - 1 ordem de producao de teste
- Validar permissoes reais por setor com usuarios nao administradores.
- Validar impressao e documentos comerciais no fluxo real da empresa.
- Validar concorrencia basica com pelo menos 2 usuarios simultaneos.
- Executar `npm run ops:verify-restore` com o backup mais recente antes de confiar 100% no backup.

## Decisao tecnica

Status: pronto com restricoes.

Interpretacao:

- Pronto para iniciar uso real controlado.
- Nao validado o suficiente para prometer operacao 100% sem incidentes.
- Para liberar 100% com responsabilidade, a homologacao humana dos fluxos acima ainda e obrigatoria.
