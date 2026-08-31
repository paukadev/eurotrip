# PRD: Eurotrip — App de Controle da Viagem de Fim de Ano

## Overview

App pessoal para o Viajante controlar sua euro trip de fim de ano — roteiro em **circuito**
partindo e voltando a Berlin: **Berlin → Cracóvia → Budapeste → Viena → Bratislava →
Viena → Praga → Berlin**, entre dezembro/2026 e janeiro/2027, com voo internacional de ida e volta
por São Paulo (GRU ⇄ Berlin). O app reúne em um só lugar a visão geral da viagem e os
detalhes de cada destino
(hospedagem, translado entre cidades e roteiro diário), e serve como painel do que **já
foi comprado** e do que **ainda falta comprar**.

- **Problema que resolve**: os dados da viagem estão espalhados (datas, reservas,
  translados, ingressos, pendências). O Viajante quer uma visão única, navegável por
  destino, e um controle claro de compras/pendências.
- **Para quem**: o próprio Viajante (uso pessoal), com consulta eventual por um Visitante
  que receba o link (companheiro de viagem/família).
- **Por que é valioso**: consolida planejamento e acompanhamento em uma página simples,
  publicável de graça, que evolui "aos poucos" a partir de arquivos JSON editados à mão.

O escopo desta v1 é intencionalmente enxuto, com um modelo de dados que já suporta o
crescimento incremental desejado.

## Goals

Depois que esta v1 existir, o Viajante pode:

- Abrir uma **home** e ver, num olhar: a timeline dos destinos na ordem da viagem com
  datas, a contagem regressiva para o início, o mapa do roteiro entre as cidades e o
  consolidado "comprado × falta comprar".
- Abrir a **página de cada destino** e ver datas/duração, hospedagem, translado para o
  próximo destino e o roteiro organizado **por dia e horário**.
- Ver, em cada item reservável (hospedagem, translado, atração) e nos itens gerais da
  viagem, se está **comprado** ou **pendente**, com **valor opcional**.
- Controlar todos os dados **editando arquivos JSON à mão**, com o app refletindo as
  mudanças após publicar.
- **Publicar** o app em hospedagem estática gratuita e acessá-lo por URL no desktop e no
  celular (online).

O sistema garante que:

- Dados são somente-leitura na interface (nenhuma edição pela tela na v1).
- JSON inválido/incompleto produz mensagem legível, nunca tela branca.
- Os totais da home derivam dos mesmos itens exibidos nos destinos (fonte única).

## User Stories

Catálogo canônico em [_user_stories.md](_user_stories.md). Áreas cobertas:

- **US-001–US-005 — Home / Visão geral**: timeline, contagem regressiva, mapa do
  roteiro, consolidado comprado×pendente, navegação para destino.
- **US-006–US-009 — Página de destino**: cabeçalho/datas, hospedagem, translado,
  roteiro por dia e horário.
- **US-010–US-011 — Checklist**: status e valor por item; itens gerais da viagem.
- **US-012–US-013 — Dados JSON**: edição manual refletida no app; erros legíveis.
- **US-014 — Navegação**: deep link por destino.
- **US-015 — Publicação / Acesso**: publicar em hospedagem estática gratuita.

[Full user stories](_user_stories.md)

## Core Features

### 1. Home / Visão geral

Página inicial que consolida a viagem. Comportamento:

- **Timeline de destinos** ordenada por `inicioData`, cada um com nome, datas e link
  para a página do destino; exibe a duração total da viagem.
- **Contagem regressiva** para o início da viagem; muda para "em andamento" durante a
  viagem e "concluída" após o fim.
- **Mapa do roteiro** com marcadores por cidade (a partir de coordenadas no JSON) e linha
  ligando-as na ordem; marcadores levam à página do destino.
- **Consolidado comprado × falta comprar**: contagens de itens comprados/pendentes e
  somas de valores (quando informados), incluindo itens gerais da viagem, com indicação
  de quantos itens entraram na soma.

### 2. Página de destino

Uma página por destino (roteável por slug). Exibe:

- **Cabeçalho**: nome, `inicioData`, `fimData`, duração; navegação anterior/próximo.
- **Hospedagem**: local, endereço, check-in/out, `status`, `valor` opcional (uma ou
  mais).
- **Translado para o próximo destino**: modo, horário, chegada, `status`, `valor`
  opcional.
- **Roteiro por dia e horário**: atividades/atrações agrupadas por dia (dentro do
  intervalo início–fim) e ordenadas por horário; atrações reserváveis mostram
  `status`/`valor`.

### 3. Checklist "comprado × falta comprar"

Modelo transversal (ver ADR-003): hospedagens, translados e atrações **são** os itens do
checklist. Cada item tem `status` ∈ {comprado, pendente} e `valor` opcional. Existem
também **itens gerais da viagem** (passagem aérea internacional, seguro etc.). A home
deriva o consolidado; as páginas de destino mostram o status item a item.

### 4. Camada de dados JSON (somente-leitura)

O app carrega os arquivos JSON, valida-os e renderiza. Tolera campos desconhecidos,
ordena destinos por data, e reporta erros de forma legível (arquivo/campo). Nenhuma
escrita pela interface.

### Interação entre features

- A camada de dados (4) alimenta home (1), destinos (2) e checklist (3) a partir da mesma
  fonte — o consolidado da home é sempre derivado, nunca digitado à parte.
- Timeline e mapa (1) navegam para destinos (2); destinos navegam entre si e de volta à
  home.

## Business Rules

### Modelo de dados (schema conceitual, editado à mão)

Nível **viagem**:

- `viagem`: `{ titulo, origem (ex.: "GRU"), destinos: [...], itensGerais: [...] }`.
- `itensGerais`: lista de itens reserváveis não atrelados a um destino.

Nível **destino** (parte de `{ name, inicioData, fimData }` e expande):

- `name` (**obrigatório**), `inicioData`, `fimData` (datas de calendário).
- `slug` (opcional; se ausente, derivado de `name` — ver regra de slug).
- `coordenadas` (opcional): `{ lat, lon }` para o mapa.
- `hospedagens`: lista de itens reserváveis do tipo `hospedagem` (`{ nome, endereco,
  checkin, checkout, status, valor?, moeda? }`).
- `translados`: lista de itens do tipo `translado` (`{ modo, partida, chegada, horario,
  status, valor?, moeda? }`); translado que liga ao próximo destino pertence ao destino
  de origem.
- `roteiro`: lista de atividades (`{ dia/data, horario?, titulo, tipo, status?, valor?,
  moeda? }`); atividades do tipo `atracao` são itens reserváveis.

**Item reservável** (invariante): possui `tipo` ∈ {`translado`, `hospedagem`, `atracao`},
`status` ∈ {`comprado`, `pendente`} e `valor`/`moeda` opcionais.

### Invariantes

- Cada destino tem um `name`. Destino sem `name` é inválido e não é exibido (com aviso).
- Cada item reservável pertence a exatamente um contexto: um destino **ou** o nível da
  viagem (itens gerais) — nunca contado duas vezes no consolidado.
- O consolidado da home é **derivado** dos itens; não existe fonte de totais separada.

### Validação e resultado ao usuário

- JSON com sintaxe inválida → mensagem legível "não foi possível ler os dados"
  (idealmente com o arquivo), sem tela branca (US-013.AC-1).
- Campo obrigatório ausente (`name`) → aviso apontando o campo; itens válidos continuam
  exibidos (US-013.AC-2).
- Data em formato não reconhecido → tratada como ausente ("a definir"), sem "Invalid
  Date" (US-013.EC-3).
- `status` ausente → default `pendente`. `status` desconhecido → tratado como `pendente`
  com aviso (US-010.EC-1/EC-2).
- `valor` não numérico ou negativo → ignorado na soma, com aviso (US-004.EC-3).
- Coordenadas fora de faixa → destino tratado como sem coordenada no mapa (US-003.EC-3).
- Campos desconhecidos no JSON → ignorados sem quebrar (US-012.EC-1).

### Ordenação e derivação

- Destinos exibidos em ordem cronológica por `inicioData`; empate desfeito pela ordem no
  arquivo (US-001.EC-2).
- Roteiro agrupado por dia dentro de `inicioData..fimData`; dias sem atividade aparecem
  como "livre" (US-009.AC-3); atividades fora do intervalo vão para "fora do período"
  (US-009.EC-1).
- Contagem regressiva usa **data de calendário** (sem hora) para evitar erro de ±1 dia
  por fuso (US-002.EC-4).

### Regra de slug (rotas de destino)

- O slug é estável e normalizado (minúsculas, sem acentos, espaços → hífen): "Cracóvia" →
  "cracovia" (US-014.EC-2). Home e deep link usam o mesmo slug.

### Moeda

- v1 **não converte moedas**. Valores em moedas diferentes (EUR/HUF/CZK/PLN/BRL) não são
  somados como uma só; a home apresenta os totais sem misturar moedas ou deixa explícita
  a limitação (US-004.EC-2). Ver Open Questions.

### Visibilidade / dados sensíveis

- O conteúdo publicado é público na URL (hospedagem estática). Regra: não colocar dados
  sensíveis (ex.: número completo de reserva, documento) nos JSON (US-015.EC-3).

## User Experience

### Personas e objetivos

- **Viajante (consulta)**: quer visão geral rápida e detalhe por destino; acompanha o que
  falta comprar. Usa desktop (planejando) e celular (online, na viagem).
- **Editor dos dados**: a mesma pessoa mantendo os JSON à mão e republicando.
- **Visitante com o link**: consulta pontual via URL.

### Fluxos principais

1. **Visão geral → destino**: abre a home → vê timeline/countdown/mapa/consolidado →
   clica num destino → vê datas, hospedagem, translado e roteiro por dia → navega para o
   próximo destino ou volta à home.
2. **Acompanhar compras**: na home, lê "comprado × pendente" e o total considerado → entra
   nos destinos com itens pendentes para conferir o que falta.
3. **Atualizar dados** (Editor): edita o JSON (novo destino/item, muda `status` para
   `comprado`) → publica → recarrega e vê refletido.

### UI/UX e acessibilidade

- Layout **responsivo**: legível no celular sem rolagem horizontal (US-015.EC-1).
- Estados vazios sempre tratados (sem destinos, sem itens, sem coordenadas) em vez de área
  em branco.
- Indicação visual clara de `comprado` vs `pendente` que não dependa só de cor
  (rótulo/ícone), por acessibilidade.
- Mensagens de erro de dados são legíveis para o Editor (apontam arquivo/campo).

### Onboarding e descoberta

- Primeiro acesso com JSON vazio mostra estado inicial orientando o cadastro
  (US-001.EC-1), não erro.

## High-Level Technical Constraints

- **Dados**: arquivos JSON versionados, editados à mão, somente-leitura na interface
  (ADR-001). Sem banco de dados; sem escrita pela UI.
- **Hospedagem**: web app **estático** publicável em serviço gratuito (GitHub Pages,
  Vercel, Netlify, Cloudflare Pages), sem backend (ADR-002).
- **Roteamento client-side** por destino com fallback que resolve deep links e refresh
  em host estático (US-014.EC-1).
- **Performance/UX**: carga leve; escala esperada pequena (poucos destinos), mas timeline
  deve permanecer navegável com muitos itens (US-001.EC-4).
- **Idioma**: interface e dados em português.
- A escolha de framework/stack específico é da TechSpec (não decidida aqui).

## Non-Goals (Out of Scope)

- **Edição de dados pela interface** (CRUD/formulários): decisão do usuário por editar
  JSON à mão (ADR-001). Não descartado para o futuro.
- **Funcionamento offline no celular** (PWA/cache): não é requisito da v1; o usuário optou
  por publicar em serviço gratuito com acesso online. Porta aberta para fase futura
  (ADR-002).
- **Orçamento financeiro completo e conversão de moedas**: `valor` é opcional e não há
  câmbio; totais não misturam moedas (ADR-003).
- **Autenticação / múltiplos usuários / colaboração em tempo real**: uso pessoal; link
  público.
- **Import automático de reservas (e-mail/booking)**: não previsto.
- **Backend / API / banco de dados**: excluídos por ADR-002.

## Architecture Decision Records

- [ADR-001: Dados da viagem em arquivos JSON versionados, editados à mão](adrs/adr-001.md)
  — app somente-leitura sobre JSON, sem escrita pela UI.
- [ADR-002: Aplicação web estática publicada em hospedagem gratuita, sem backend](adrs/adr-002.md)
  — site client-side em tier gratuito, offline como Non-Goal da v1.
- [ADR-003: Modelo unificado de "item reservável" com status e valor opcional](adrs/adr-003.md)
  — hospedagem/translado/atração são os itens do checklist; home deriva o consolidado.

## Open Questions

- **Moedas**: como apresentar os totais quando há EUR/HUF/CZK/PLN/BRL? Manter separado por
  moeda, escolher uma moeda-base sem conversão, ou permitir conversão manual num campo?
  (v1 não converte.)
- **Visibilidade**: a URL pública é aceitável, ou o usuário quer alguma proteção leve
  (ex.: link não indexado, senha simples)? Define se dados como reservas podem entrar no
  JSON.
- **Mapa**: fonte das coordenadas e nível de detalhe do mapa (marcadores + linha simples
  vs. rota real) — detalhe para a TechSpec, mas depende do apetite do usuário.
- **Cidades repetidas (Berlin e Viena)**: Berlin é início e fim, e Viena aparece duas
  vezes (ida e retorno via Bratislava). Modelar cada cidade repetida como um único
  destino com múltiplas estadias, ou como cards distintos na timeline (ex.: "Viena (1)"
  e "Viena (2)")? Isso também define a regra de slug para repetições (slug único por
  estadia). O translado final (Praga → Berlin) e o voo internacional de volta
  (Berlin → GRU) entram como translado do destino ou como itens gerais da viagem?
- **Offline futuro**: se/quando promover para PWA com cache para uso na viagem sem
  internet.
