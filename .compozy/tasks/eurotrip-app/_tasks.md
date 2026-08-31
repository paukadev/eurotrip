---
schema_version: "compozy.tasks/v2"
workflow: eurotrip-app
graph:
  nodes:
    - id: task_01
      file: task_01.md
    - id: task_02
      file: task_02.md
    - id: task_03
      file: task_03.md
    - id: task_04
      file: task_04.md
  edges:
    - from: task_01
      to: task_02
    - from: task_02
      to: task_03
    - from: task_03
      to: task_04
---

# Eurotrip — App de Controle da Viagem: Task List

Canonical task graph for the euro trip control app. Derived from
[_prd.md](_prd.md), [_techspec.md](_techspec.md), [_user_stories.md](_user_stories.md),
and [_tests.md](_tests.md).

Linear dependency chain: `task_01 → task_02 → task_03 → task_04`.

| Task | Title | Type | Complexity | Tests |
|------|-------|------|------------|-------|
| task_01 | Fundação: scaffold + camada de dados/lógica | frontend | high | 57 UT |
| task_02 | App shell + componentes compartilhados | frontend | medium | 4 IT |
| task_03 | Páginas: Home + Destino | frontend | high | 6 IT + 9 E2E |
| task_04 | Dados semente + deploy + responsivo | infra | low | 2 E2E |

Every `UT-`/`IT-`/`E2E-` ID in `_tests.md` is assigned to exactly one task (57 UT + 10 IT
+ 11 E2E = 78).
