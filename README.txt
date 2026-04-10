CAPSFARMA ERP

Estrutura principal do projeto:

capsfarma-erp/
├── backend/
│   ├── api/
│   └── scripts/
│       └── vps-agent.js
├── config/
│   └── database/
│       └── supabase.browser.js
├── frontend/
│   ├── pages/
│   │   └── index.html
│   ├── assets/
│   │   ├── css/
│   │   │   ├── styles.css
│   │   │   └── service-orders.css
│   │   ├── js/
│   │   │   ├── app.js
│   │   │   └── service-orders.js
│   │   ├── sounds/
│   │   └── branding/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── service-orders.js
│   └── supabase/
│       └── config.js
├── database/
│   └── supabase/
│       ├── schema.sql
│       ├── config.toml
│       ├── functions/
│       └── snippets/
├── nginx/
│   └── default.conf
├── package.json
├── package-lock.json
├── README.md
└── README.txt

Compatibilidade mantida:
- /scripts -> link simbolico para backend/scripts
- /supabase -> link simbolico para database/supabase
- /frontend/index.html -> link simbolico para frontend/pages/index.html
- /frontend/app.js -> link simbolico para frontend/assets/js/app.js
- /frontend/styles.css -> link simbolico para frontend/assets/css/styles.css
- /frontend/service-orders.js -> link simbolico para frontend/assets/js/service-orders.js
- /frontend/service-orders.css -> link simbolico para frontend/assets/css/service-orders.css
- /frontend/supabase/config.js -> link simbolico para config/database/supabase.browser.js

Observacoes:
- O frontend agora e servido a partir de /frontend.
- A entrada real da aplicacao fica em /frontend/pages/index.html.
- O banco/schema principal fica em /database/supabase/schema.sql.
- O config.js usado pelo navegador fica em /config/database/supabase.browser.js.
