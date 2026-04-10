# Onboarding de Usuarios

Data: 2026-04-10

## Ordem recomendada de cadastro

1. `ADMINISTRADOR`: dono, gerente geral ou responsavel pela operacao.
2. `VENDAS`: um usuario comercial.
3. `COMPRAS`: um usuario de compras.
4. `MONTAGEM`: um usuario de montagem.
5. `USINAGEM`: um usuario de usinagem.
6. `FABRICACAO`: um usuario de fabrica.
7. `FINANCEIRO`: um usuario financeiro.

## Dados minimos por usuario

- `full_name`
- `login_code` com 3 digitos unicos
- `phone`
- `email`
- `role`
- `department`
- `permission_role`

## Mapeamento recomendado

- dono/gerente: `role=ADMINISTRADOR`, `department=ADMINISTRADOR`, `permission_role=ADMINISTRADOR`
- comercial: `role=VENDEDOR`, `department=VENDAS`, `permission_role=VENDAS`
- compras: `role=COMPRAS`, `department=COMPRAS`, `permission_role=COMPRAS`
- montagem: `role=MONTAGEM`, `department=MONTAGEM`, `permission_role=MONTAGEM`
- usinagem: `role=USINAGEM`, `department=USINAGEM`, `permission_role=USINAGEM`
- fabrica: `role=FABRICACAO`, `department=FABRICACAO`, `permission_role=FABRICACAO`
- financeiro: `role=FINANCEIRO`, `department=FINANCEIRO`, `permission_role=FINANCEIRO`

## Regras de codigo de login

- usar apenas 3 digitos
- nao repetir codigo
- reservar:
  - `365` TI principal atual
  - `900` TI secundario atual

## Senha inicial recomendada

- definir uma senha temporaria forte
- obrigar troca no primeiro acesso por procedimento interno
- nao reutilizar senha entre usuarios

## Teste minimo apos cada cadastro

1. fazer login com o usuario
2. confirmar se o menu exibido bate com o setor
3. abrir o modulo principal do setor
4. criar ou editar um registro de teste
5. fazer logout

## Planilha modelo

Use esta estrutura:

| Nome | Codigo | Telefone | Email | Role | Department | Perfil |
|------|--------|----------|-------|------|------------|--------|
| Nome Exemplo | 101 | 11999990001 | exemplo@empresa.com | VENDEDOR | VENDAS | VENDAS |
| Nome Exemplo | 102 | 11999990002 | exemplo2@empresa.com | COMPRAS | COMPRAS | COMPRAS |

## Observacao

Se quiser automatizar o cadastro em lote, me passe os usuarios nessa tabela e eu posso gerar os inserts ou executar o cadastro com seguranca.
