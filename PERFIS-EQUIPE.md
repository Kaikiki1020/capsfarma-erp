# Perfis de Equipe

Data da configuracao: 2026-04-10

## Perfis disponiveis

- `TI`: acesso tecnico total, incluindo `Permissoes`, `VPS`, `Reports` e `Audit`.
- `ADMINISTRADOR`: acesso gerencial total ao ERP, sem `VPS`.
- `VENDAS`: foco em `Customers`, `Sales`, consulta de `Products`, `Inventory`, `Production`, `Service Orders` e `Reports`.
- `COMPRAS`: foco em `Purchases`, consulta de `Products`, `Inventory`, `Customers`, `Sales`, `Production`, `Service Orders` e `Reports`.
- `USINAGEM`: foco em `Machining`, `Production`, `Inventory`, consulta de `BOM`, `Products`, `Service Orders` e `Reports`.
- `MONTAGEM`: foco em `Service Orders`, `Production`, `Inventory`, consulta de `Products`, `BOM`, `Customers`, `Sales` e `Reports`.
- `FABRICACAO`: foco em `BOM`, `Production`, `Inventory`, consulta de `Products`, `Purchases`, `Service Orders` e `Reports`.
- `FINANCEIRO`: foco em `Sales`, `Purchases`, consulta de `Customers`, `Inventory`, `Production`, `Service Orders`, `Products` e `Reports`.
- `OPERACIONAL PADRAO`: perfil amplo legado sem `Permissoes` e sem `VPS`.

## Regras importantes

- Apenas `TI` pode acessar `VPS`.
- Apenas `TI` e `ADMINISTRADOR` podem acessar `Permissoes`.
- Apenas `TI` e `ADMINISTRADOR` devem editar o `Dashboard`.

## Recomendacao de atribuicao

- Diretoria ou dono da operacao: `ADMINISTRADOR`
- Suporte tecnico interno: `TI`
- Comercial: `VENDAS`
- Comprador: `COMPRAS`
- Operador de usinagem: `USINAGEM`
- Operador de montagem: `MONTAGEM`
- Lider de fabrica: `FABRICACAO`
- Financeiro: `FINANCEIRO`

## Como aplicar aos usuarios

Criar os usuarios reais pelo modulo de permissoes do ERP e atribuir:

- `role` e `department` de acordo com o setor real
- `permission_role_id` correspondente ao perfil acima

Antes de liberar a equipe inteira:

- testar login de pelo menos um usuario por setor
- validar menu visivel por setor
- validar um fluxo real por setor
