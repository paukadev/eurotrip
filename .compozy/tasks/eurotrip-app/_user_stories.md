# User Stories: Eurotrip — App de Controle da Viagem

Catálogo canônico de comportamento do app de controle da euro trip de fim de ano
(circuito Berlin → Cracóvia → Budapeste → Viena → Bratislava → Viena → Praga → Berlin,
dez/2026–jan/2027, com voo internacional GRU ⇄ Berlin). Companheiro do
`_prd.md`; consumido por `_techspec.md` (mapeamento de componentes) e `_tests.md`
(matriz de cobertura).

## Personas

- **Viajante (consulta)** — o dono da viagem. Usa o app publicado para consultar a
  visão geral, entrar em cada destino, ver hospedagem/translado/roteiro e acompanhar o
  que já comprou e o que ainda falta. Acessa no desktop ao planejar e no celular
  (navegador, online) durante a viagem.
- **Editor dos dados** — a mesma pessoa no papel de manutenção: edita os arquivos JSON à
  mão para adicionar destinos, itens, datas e status, e republica o site. A maior parte
  dos casos de erro (JSON inválido, campos ausentes) vive neste fluxo.
- **Visitante com o link** — alguém a quem o Viajante passa a URL pública (ex.:
  companheiro de viagem, família). Apenas consulta; não edita.

## Story Index

| ID     | Feature Area            | Persona   | Story                                                                 |
|--------|-------------------------|-----------|-----------------------------------------------------------------------|
| US-001 | Home / Visão geral      | Viajante  | Ver a timeline dos destinos na ordem da viagem, com datas             |
| US-002 | Home / Visão geral      | Viajante  | Ver a contagem regressiva para o início da viagem                     |
| US-003 | Home / Visão geral      | Viajante  | Ver o mapa do roteiro entre as cidades                                |
| US-004 | Home / Visão geral      | Viajante  | Ver o consolidado "comprado × falta comprar" da viagem inteira        |
| US-005 | Home / Visão geral      | Viajante  | Navegar da home para a página de um destino                           |
| US-006 | Página de destino       | Viajante  | Ver cabeçalho do destino com datas e duração da estadia               |
| US-007 | Página de destino       | Viajante  | Ver a hospedagem do destino (hotel, endereço, check-in/out, status)   |
| US-008 | Página de destino       | Viajante  | Ver o translado para o próximo destino (modo, horário, status)        |
| US-009 | Página de destino       | Viajante  | Ver o roteiro organizado por dia e horário                            |
| US-010 | Checklist               | Viajante  | Ver, em cada item, se foi comprado ou está pendente, e o valor        |
| US-011 | Checklist               | Viajante  | Ver itens gerais da viagem (não atrelados a um destino)               |
| US-012 | Dados JSON              | Editor    | Adicionar/editar um destino no JSON e vê-lo refletido no app          |
| US-013 | Dados JSON              | Editor    | Receber erro legível quando o JSON está inválido ou incompleto        |
| US-014 | Navegação               | Viajante  | Acessar um destino diretamente por URL/deep link                      |
| US-015 | Publicação / Acesso     | Editor    | Publicar o site atualizado em hospedagem estática gratuita            |

## Home / Visão geral

### US-001: Timeline dos destinos

**As a** Viajante, **I want** ver todos os destinos na ordem da viagem com suas datas,
**so that** eu entenda a sequência e a duração de cada etapa num olhar.

Acceptance criteria:

- AC-1: Dado o JSON com N destinos, quando abro a home, então vejo os N destinos
  ordenados cronologicamente por `inicioData`, cada um com nome, data de início e fim.
- AC-2: Dado um destino selecionado na timeline, quando clico nele, então vou para a
  página daquele destino (ver US-005).
- AC-3: Dado que a viagem tem início e fim, quando vejo a timeline, então a duração
  total (primeira `inicioData` até última `fimData`) é exibida.

Edge cases:

- EC-1: JSON sem nenhum destino → a home mostra estado vazio ("nenhum destino
  cadastrado") em vez de área em branco ou erro.
- EC-2: Dois destinos com `inicioData` iguais → ordem estável e determinística
  (desempate por ordem no arquivo), sem sobreposição visual quebrada.
- EC-3: `fimData` de um destino posterior à `inicioData` do próximo (sobreposição de
  datas) → destinos ainda exibidos; sobreposição sinalizada visualmente sem travar.
- EC-4: 100+ destinos (uso muito além do típico de 4) → a timeline permanece navegável
  (rolagem), sem estourar o layout.

### US-002: Contagem regressiva

**As a** Viajante, **I want** ver quantos dias faltam para a viagem começar, **so that**
eu sinta o progresso e me organize.

Acceptance criteria:

- AC-1: Dado que hoje é anterior à primeira `inicioData`, quando abro a home, então vejo
  "faltam X dias" calculado a partir da data atual.
- AC-2: Dado que hoje está entre início e fim da viagem, quando abro a home, então vejo
  um indicador de "viagem em andamento" (ex.: "Dia N de M").

Edge cases:

- EC-1: Data atual posterior ao fim da viagem → mostra "viagem concluída" em vez de
  contagem negativa.
- EC-2: Início da viagem é hoje → mostra "começa hoje" (X = 0), não "faltam 0 dias"
  ambíguo.
- EC-3: Nenhum destino com data válida → o bloco de contagem é omitido ou mostra "sem
  datas definidas", nunca "NaN dias".
- EC-4: Fuso horário do dispositivo diferente do fuso da viagem → a contagem usa data de
  calendário (sem hora), evitando erro de ±1 dia perto da virada.

### US-003: Mapa do roteiro

**As a** Viajante, **I want** ver as cidades do roteiro em um mapa com a rota entre elas,
**so that** eu visualize geograficamente o trajeto.

Acceptance criteria:

- AC-1: Dado que os destinos têm coordenadas, quando abro a home, então vejo cada cidade
  marcada no mapa e uma linha ligando-as na ordem da viagem.
- AC-2: Dado um marcador no mapa, quando clico nele, então vou para a página do destino
  correspondente.

Edge cases:

- EC-1: Um destino sem coordenadas → os demais aparecem no mapa; o sem coordenada é
  omitido do mapa mas continua na timeline, com aviso discreto.
- EC-2: Nenhum destino com coordenadas → o bloco de mapa mostra estado vazio, sem
  quebrar a home.
- EC-3: Coordenadas fora de faixa válida (lat ∉ [-90,90] / lon ∉ [-180,180]) → item
  tratado como sem coordenada (EC-1), com aviso no console/erro legível.

### US-004: Consolidado comprado × falta comprar

**As a** Viajante, **I want** ver na home o total do que já comprei e do que ainda falta,
**so that** eu saiba o quanto da viagem já está garantido.

Acceptance criteria:

- AC-1: Dado o conjunto de todos os itens (de destinos + gerais), quando abro a home,
  então vejo a contagem de itens `comprado` e a de `pendente`.
- AC-2: Dado que parte dos itens tem `valor`, quando vejo o consolidado, então vejo a
  soma dos valores dos itens comprados e a soma estimada dos pendentes.
- AC-3: Dado que nem todos os itens têm `valor`, quando vejo os totais, então vejo
  quantos itens entraram na soma (ex.: "total considera 7 de 12 itens com valor").

Edge cases:

- EC-1: Nenhum item cadastrado → mostra "0 comprado / 0 pendente" e nenhum total
  monetário, sem divisão por zero nem "NaN".
- EC-2: Itens em moedas diferentes (EUR/HUF/CZK/PLN) → v1 não converte; os totais são
  apresentados por moeda ou o app deixa claro que não soma moedas distintas (ver Open
  Questions). Nunca soma valores de moedas diferentes como se fossem a mesma.
- EC-3: Valor negativo ou não numérico em um item → item ignorado na soma com aviso
  legível, sem contaminar o total.
- EC-4: Todos os itens comprados → mostra 100% garantido / "nada pendente".

### US-005: Navegar para um destino

**As a** Viajante, **I want** clicar em um destino na home e abrir sua página, **so
that** eu veja os detalhes daquela etapa.

Acceptance criteria:

- AC-1: Dado um destino na home (timeline ou mapa), quando clico nele, então a página
  daquele destino é aberta.
- AC-2: Dado que estou em um destino, quando volto, então retorno à home mantendo o
  contexto (posição na timeline).

Edge cases:

- EC-1: Clique em destino cujo identificador não resolve → mensagem "destino não
  encontrado" em vez de página em branco.

## Página de destino

### US-006: Cabeçalho do destino

**As a** Viajante, **I want** ver no topo da página o nome, as datas e a duração da
estadia, **so that** eu me situe imediatamente.

Acceptance criteria:

- AC-1: Dado um destino, quando abro sua página, então vejo `name`, `inicioData`,
  `fimData` e o número de dias/noites de estadia.
- AC-2: Dado que existe um próximo e/ou anterior destino, quando estou na página, então
  há navegação para o destino anterior/seguinte na ordem da viagem.

Edge cases:

- EC-1: `inicioData` > `fimData` (datas invertidas) → aviso legível "datas
  inconsistentes"; a página ainda abre com os dados disponíveis.
- EC-2: Datas ausentes → exibe "datas a definir" em vez de campo vazio ou erro.
- EC-3: Primeiro/último destino → não oferece "anterior"/"próximo" inexistente.

### US-007: Hospedagem do destino

**As a** Viajante, **I want** ver a hospedagem do destino, **so that** eu saiba onde vou
ficar e se já está reservada.

Acceptance criteria:

- AC-1: Dado um destino com hospedagem, quando abro a página, então vejo nome do
  hotel/local, endereço, check-in, check-out e o `status` (comprado/pendente).
- AC-2: Dado que a hospedagem tem `valor`, quando a vejo, então o valor (e moeda) é
  exibido.

Edge cases:

- EC-1: Destino sem hospedagem cadastrada → seção mostra "hospedagem a definir",
  contando como item pendente implícito? Não: sem item, não conta no checklist (ver
  Business Rules). Exibe apenas "a definir".
- EC-2: Múltiplas hospedagens no mesmo destino (troca de hotel) → todas listadas, cada
  uma com seu status.
- EC-3: Check-out anterior ao check-in → aviso de inconsistência, sem travar.

### US-008: Translado para o próximo destino

**As a** Viajante, **I want** ver como saio deste destino para o próximo, **so that** eu
saiba o transporte, o horário e se já está comprado.

Acceptance criteria:

- AC-1: Dado um destino que tem translado de saída, quando abro a página, então vejo
  modo (trem/voo/ônibus), horário/data, destino de chegada e `status`.
- AC-2: Dado que o translado tem `valor`, quando o vejo, então o valor e a moeda
  aparecem.

Edge cases:

- EC-1: Último destino (sem próximo) → sem translado de saída, ou exibe o translado de
  volta (retorno a GRU) se cadastrado.
- EC-2: Translado sem horário → exibe "horário a definir", ainda contando o status.
- EC-3: Translado cujo destino de chegada não corresponde ao próximo destino da timeline
  → exibido como está; inconsistência não trava a página.

### US-009: Roteiro por dia e horário

**As a** Viajante, **I want** ver as atividades/atrações organizadas por dia e horário,
**so that** eu siga o plano diário no destino.

Acceptance criteria:

- AC-1: Dado um destino com roteiro, quando abro a página, então vejo as atividades
  agrupadas por dia (dentro do intervalo início–fim), ordenadas por horário dentro de
  cada dia.
- AC-2: Dado uma atividade que é uma atração reservável, quando a vejo, então vejo seu
  `status` (comprado/pendente) e `valor` opcional.
- AC-3: Dado um dia sem atividades, quando vejo o roteiro, então o dia aparece como
  "livre/sem atividades" em vez de sumir.

Edge cases:

- EC-1: Atividade com data fora do intervalo início–fim do destino → exibida em uma
  seção "fora do período" com aviso, não descartada silenciosamente.
- EC-2: Duas atividades no mesmo horário → ambas listadas (ordem estável), sem
  sobrescrever.
- EC-3: Atividade sem horário → agrupada no dia, em uma faixa "sem horário definido".
- EC-4: Estadia de 1 dia → roteiro de um único dia, sem quebra.

## Checklist

### US-010: Status e valor por item

**As a** Viajante, **I want** ver em cada item reservável se foi comprado ou está
pendente e quanto custa, **so that** eu acompanhe o que falta providenciar.

Acceptance criteria:

- AC-1: Dado qualquer item (hospedagem, translado, atração), quando o vejo, então há
  indicação visual clara de `comprado` vs `pendente`.
- AC-2: Dado um item com `valor`, quando o vejo, então valor e moeda aparecem; sem
  `valor`, o item aparece sem preço, sem placeholder enganoso (ex.: não mostra "R$ 0").

Edge cases:

- EC-1: `status` com valor inesperado (ex.: "talvez") → tratado como `pendente` com
  aviso legível, nunca como comprado.
- EC-2: `status` ausente → default `pendente` (assunção conservadora).

### US-011: Itens gerais da viagem

**As a** Viajante, **I want** ver itens que não pertencem a um destino específico (ex.:
passagem aérea internacional, seguro), **so that** eu não perca de vista compras globais.

Acceptance criteria:

- AC-1: Dado itens gerais no JSON da viagem, quando abro a home, então eles aparecem em
  uma seção "itens gerais da viagem" com status e valor.
- AC-2: Dado o consolidado da home (US-004), quando os totais são calculados, então os
  itens gerais entram na contagem e nas somas junto com os itens dos destinos.

Edge cases:

- EC-1: Nenhum item geral → seção omitida ou "nenhum item geral", sem quebrar totais.
- EC-2: Item geral com um destino também referenciado → é contado uma única vez (evitar
  dupla contagem no consolidado).

## Dados JSON

### US-012: Editar dados no JSON

**As a** Editor, **I want** adicionar ou editar um destino/itens nos arquivos JSON à mão,
**so that** o app reflita minhas mudanças após publicar.

Acceptance criteria:

- AC-1: Dado que adiciono um destino válido no JSON e publico, quando abro o app, então
  o novo destino aparece na home e tem sua página.
- AC-2: Dado que altero o `status` de um item para `comprado`, quando recarrego, então o
  item e o consolidado da home refletem a mudança.

Edge cases:

- EC-1: Campo extra não previsto no JSON → ignorado sem quebrar (tolerância a campos
  desconhecidos).
- EC-2: Ordem dos destinos no arquivo diferente da ordem cronológica → o app ordena por
  data (ver US-001.AC-1), não pela ordem do arquivo.

### US-013: Erro legível para JSON inválido

**As a** Editor, **I want** uma mensagem clara quando o JSON está malformado ou faltam
campos obrigatórios, **so that** eu conserte rápido sem tela branca.

Acceptance criteria:

- AC-1: Dado um JSON com sintaxe inválida, quando o app carrega, então vejo uma mensagem
  indicando que os dados não puderam ser lidos (e, se possível, o arquivo), não uma tela
  branca ou erro cru de runtime.
- AC-2: Dado um destino sem `name`, quando o app carrega, então vejo um aviso apontando o
  campo obrigatório ausente; os destinos válidos ainda são exibidos.

Edge cases:

- EC-1: Arquivo JSON ausente/404 → mensagem "dados não encontrados", com orientação.
- EC-2: JSON válido mas vazio (`[]` / `{}`) → estado vazio (ver US-001.EC-1), não erro.
- EC-3: `inicioData`/`fimData` em formato de data não reconhecido → campo tratado como
  ausente (US-006.EC-2) com aviso, sem propagar "Invalid Date".

## Navegação

### US-014: Deep link para um destino

**As a** Viajante, **I want** abrir um destino diretamente por URL, **so that** eu
compartilhe ou salve o link de uma etapa.

Acceptance criteria:

- AC-1: Dado a URL de um destino existente, quando a acesso diretamente, então a página
  daquele destino carrega sem passar pela home.
- AC-2: Dado uma URL de destino inexistente, quando a acesso, então vejo "destino não
  encontrado" com link para a home.

Edge cases:

- EC-1: Recarregar (F5) numa rota de destino em hospedagem estática → a rota resolve
  corretamente (fallback de SPA/rota configurado), sem 404 do host.
- EC-2: Identificador de destino com acentos/espaços (ex.: "Cracóvia") → resolve por um
  slug estável (ex.: "cracovia"), consistente entre home e deep link.

## Publicação / Acesso

### US-015: Publicar em hospedagem gratuita

**As a** Editor, **I want** publicar a versão atualizada do site em um serviço estático
gratuito, **so that** eu acesse pela URL no desktop e no celular.

Acceptance criteria:

- AC-1: Dado o projeto pronto, quando gero o build estático e publico, então o site fica
  acessível por uma URL pública.
- AC-2: Dado que editei os JSON e republiquei, quando acesso a URL, então vejo os dados
  atualizados.

Edge cases:

- EC-1: Acesso pelo celular (tela estreita) online → layout responsivo, conteúdo legível
  sem rolagem horizontal.
- EC-2: Sem internet no celular durante a viagem → v1 pode não abrir (offline é
  Non-Goal); comportamento esperado e documentado, não considerado defeito.
- EC-3: Conteúdo é público na URL → dados sensíveis (ex.: número completo de reserva)
  não devem ser colocados no JSON; orientação registrada (ver Business Rules / Open
  Questions).
