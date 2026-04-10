# CAPSFARMA ERP

ERP web da CAPSFARMA com operacao centralizada para:

- dashboard
- produtos
- BOM
- estoque
- producao
- clientes
- vendas
- compras
- permissoes
- controle da VPS
- ordem de servico
- auditoria
- relatorios

## Estrutura Atual

O projeto foi reorganizado para separar frontend, backend e banco sem quebrar a aplicacao em producao.

```text
capsfarma-erp/
├── backend/
│   ├── api/
│   └── scripts/
├── config/
│   └── database/
├── frontend/
│   ├── pages/
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   ├── sounds/
│   │   └── branding/
│   ├── app.js
│   ├── index.html
│   ├── service-orders.js
│   ├── styles.css
│   └── supabase/
├── database/
│   └── supabase/
│       ├── schema.sql
│       ├── config.toml
│       ├── functions/
│       └── snippets/
├── nginx/
│   └── default.conf
├── package.json
├── README.md
└── README.txt
```

## Responsabilidade De Cada Area

- `frontend/pages/`: entrada HTML e organizacao das paginas do frontend.
- `frontend/assets/css/`: estilos da aplicacao.
- `frontend/assets/js/`: scripts principais e modulos carregados pelo navegador.
- `frontend/assets/sounds/`: reservado para alertas e sons operacionais.
- `backend/api/`: area reservada para futura camada de API.
- `backend/scripts/`: scripts auxiliares do ambiente, como agente de VPS.
- `config/database/`: configuracoes de banco consumidas pelo frontend.
- `database/supabase/`: schema, funcoes SQL, politicas e configuracao do Supabase.
- `nginx/default.conf`: configuracao do servidor web para servir a SPA com URLs limpas.

## Compatibilidade Mantida

Para nao comprometer o sistema atual, estes atalhos continuam existindo:

- `scripts` -> link simbolico para `backend/scripts`
- `supabase` -> link simbolico para `database/supabase`
- `frontend/index.html` -> link simbolico para `frontend/pages/index.html`
- `frontend/app.js` -> link simbolico para `frontend/assets/js/app.js`
- `frontend/service-orders.js` -> link simbolico para `frontend/assets/js/service-orders.js`
- `frontend/styles.css` -> link simbolico para `frontend/assets/css/styles.css`
- `frontend/service-orders.css` -> link simbolico para `frontend/assets/css/service-orders.css`
- `frontend/supabase/config.js` -> link simbolico para `config/database/supabase.browser.js`

Esses links preservam comandos, scripts antigos e referencias operacionais ja existentes.

## Arquivos Principais

- `frontend/pages/index.html`: entrada real da aplicacao web.
- `frontend/assets/js/app.js`: modulo principal do ERP.
- `frontend/assets/css/styles.css`: estilos globais da aplicacao.
- `frontend/assets/js/service-orders.js`: logica da ordem de servico.
- `config/database/supabase.browser.js`: URL e anon key consumidos pelo navegador.
- `database/supabase/schema.sql`: schema principal, funcoes, tabelas e politicas.
- `backend/scripts/vps-agent.js`: automacoes e coleta do painel VPS.

## Como Configurar

1. Crie um projeto no Supabase.
2. Execute `database/supabase/schema.sql` no SQL Editor do projeto, ou use o Supabase local.
3. Edite `config/database/supabase.browser.js` com a URL e a anon key corretas.
4. Sirva `frontend/index.html` por um servidor web.

## Supabase Local

- `npm run supabase -- --version`
- `npm run supabase:start`
- `npm run supabase:status`
- `npm run supabase:stop`
- `npm run supabase:db:push`

Observacao:

- Para subir o Supabase local, este ambiente precisa ter Docker disponivel.

## URLs Da Aplicacao

O sistema continua sendo uma SPA, mas agora suporta URLs limpas, por exemplo:

- `/dashboard`
- `/products`
- `/bom`
- `/vps`
- `/audit`
- `/reports`

O Nginx usa `try_files` para sempre devolver `index.html` e deixar o frontend resolver a tela correta.

## Observacoes Importantes

- O primeiro usuario cadastrado vira `ADMINISTRADOR`.
- A auditoria usa tabela unica centralizada com separacao logica por modulo.
- O modulo `Controle da VPS` inclui card de banco para ver tabelas e detalhes.
- O sistema ainda preserva partes legadas grandes em `frontend/app.js`, por seguranca operacional.
- Antes de novas limpezas estruturais, o ideal e validar os fluxos principais no navegador.
