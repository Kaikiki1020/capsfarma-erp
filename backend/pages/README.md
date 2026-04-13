# Backend Pages

Estrutura modular preparada para evolucao segura do backend.

Contexto atual:

- o ERP ainda opera principalmente como SPA com persistencia no Supabase
- nao existe uma API HTTP tradicional completa para todos os modulos
- esta pasta organiza os dominios para futuras rotas, controllers, servicos e validacoes

Diretriz:

- migrar modulo por modulo
- evitar reescrever todos os fluxos de uma vez
- manter compatibilidade com o ERP atual enquanto a migracao acontece
