# Seção de câmbio na home — design

**Data:** 2026-09-11
**Status:** aprovado em brainstorming, pronto para plano de implementação

## Problema

O usuário vai comprar euro (e usar zloty, coroa tcheca e florim húngaro durante o
roteiro) e quer escolher um bom dia para comprar. Hoje o site mostra valores em BRL e
EUR lado a lado, sem nenhuma cotação, e não há como saber se o preço de hoje está bom
ou caro em relação aos últimos meses.

## Objetivo

Uma seção na home que mostre, para cada moeda do roteiro, a cotação oficial mais
recente em reais, o histórico recente em gráfico e um indicador dizendo se o preço de
hoje está barato, na média ou caro dentro do período escolhido.

## Fora de escopo

- Registro das compras de euro já feitas (preço médio, quanto falta).
- Meta ou preço-alvo com destaque quando atingido.
- IOF e spread de banco/corretora. São percentuais fixos sobre a cotação: mudam o valor
  final, não qual é o melhor dia.
- Cotação intradiária (minuto a minuto) e alertas/notificações.
- Conversão dos totais do checklist para uma moeda única.

Os dois primeiros são extensões naturais desta seção e podem virar trabalho futuro sem
retrabalho, desde que `exchangeStats.ts` continue puro.

## Fonte de dados

**Frankfurter** (`https://api.frankfurter.dev/v1`), dados do Banco Central Europeu.
Escolhida por: não exigir chave, responder com `access-control-allow-origin: *` (chamada
direta do navegador, compatível com ADR-002: site estático sem backend), cobrir as
quatro moedas e oferecer série histórica em uma única requisição.

Uma chamada cobre tudo que a seção precisa:

```
GET https://api.frankfurter.dev/v1/{inicio}..?base=BRL&symbols=EUR,PLN,HUF,CZK
```

com `inicio` = hoje menos 180 dias. Resposta verificada em 11/09/2026 (~9 KB, 130 dias
úteis):

```json
{
  "amount": 1.0,
  "base": "BRL",
  "start_date": "2026-03-11",
  "end_date": "2026-09-11",
  "rates": {
    "2026-09-10": { "CZK": 4.0739, "EUR": 0.16799, "HUF": 61.274, "PLN": 0.72604 },
    "2026-09-11": { "CZK": 4.0956, "EUR": 0.16879, "HUF": 61.517, "PLN": 0.730 }
  }
}
```

Os valores vêm como "quantas unidades da moeda estrangeira por 1 real". A seção exibe o
inverso (reais por unidade), calculado em `exchangeStats.ts`.

O BCE publica uma cotação por dia útil, por volta das 16h de Frankfurt (11h em
Brasília). Não há dado de fim de semana, feriado do BCE nem intradiário: a cotação "de
hoje" é a última publicada, e a data dela é sempre exibida.

### Cache

`localStorage`, chave `eurotrip:rates:v1`, validade de 12h. O valor guardado contém a
série normalizada, a data do último dia e o instante da busca.

- Cache válido: usa sem chamar a rede.
- Cache vencido ou ausente: busca; se a busca der certo, grava.
- Busca falha e existe cache (mesmo vencido): usa o cache e mostra aviso de desatualizado.
- `localStorage` indisponível (modo privativo, cota cheia): leitura e escrita em
  `try/catch`, a seção funciona sem cache.

O sufixo `v1` na chave permite invalidar tudo se o formato guardado mudar.

## Cálculo do indicador

Em `exchangeStats.ts`, funções puras sobre a série já convertida para reais por unidade.

Para a moeda e o período (30, 90 ou 180 dias) selecionados:

- `atual`: valor do último dia da série.
- `min`, `max`, `media`: sobre os dias do período, incluindo o atual.
- `diffMedia`: `(atual - media) / media`, exibido em porcentagem com uma casa.
- `maisBaratoQue`: proporção dos dias do período cujo valor é **maior** que o atual,
  exibida como porcentagem inteira. Dia com valor exatamente igual não conta.

Selo, a partir de `maisBaratoQue`:

| Condição | Selo | Cor |
|---|---|---|
| `>= 0.75` | Bom momento | `--accent` (âmbar) |
| `> 0.25` e `< 0.75` | Na média | `--text-3` (cinza) |
| `<= 0.25` | Caro | `--warn` (terracota) |

O site não usa verde nem vermelho; âmbar é a cor de "aceso/garantido" do design system e
terracota é a de alerta.

Casos de borda:

- Período com **um único dia**: sem média nem percentil comparáveis. Mostra o valor e
  omite selo e comparações.
- Período **maior que a série disponível**: usa os dias que existirem e informa o
  intervalo real ("últimos 92 dias úteis").
- Série vazia: tratada como falha de dados (ver Falhas).

## Interface

Entra na home logo **depois de `ConsolidatedChecklist`** e antes de `GeneralItems`, como
mais uma `section` — o CSS global já dá a aparência de cartão a `main section`.

```
── CÂMBIO ─────────────────────────────────────────────
 [ € 5,92 ]  [ zł 1,37 ]  [ Kč 0,244 ]  [ 100 Ft 1,63 ]
   ▔▔▔▔▔▔
 R$ 5,92 por euro                          ● BOM MOMENTO
 1,8% abaixo da média de 90 dias · mais barato que 78% dos dias
                                    [30d] [90d•] [180d]
 6,11 ┤        ▲máx 6,11 (14/07)
      │    ╭──╮╭╮
 6,03 ┤┄┄┄╱┄┄┄┄╰╯╲┄┄┄┄┄┄┄┄┄┄┄┄┄  média
      │──╯         ╰──╮  ╭╮
 5,84 ┤               ▼mín 5,84 (06/08) ╰─●  hoje
      jun           jul           ago        set
 Cotação oficial BCE de 11/09 · atualiza 1x por dia útil
```

### Moedas e unidade de exibição

| Moeda | Unidade exibida | Rótulo da aba |
|---|---|---|
| EUR | 1 | `€` |
| PLN | 1 | `zł` |
| CZK | 1 | `Kč` |
| HUF | 100 | `100 Ft` |

O florim é exibido por 100 unidades porque 1 Ft custa cerca de R$ 0,016. A unidade de
exibição multiplica apenas a apresentação; as estatísticas usam o valor por unidade.

Valores em reais com duas casas decimais (`Intl.NumberFormat("pt-BR")`, como
`MoneyAmount` já faz). A coroa tcheca é a única exceção: custa cerca de R$ 0,24, então
usa três casas para não perder precisão na comparação entre dias.

### Controles

- **Abas de moeda**: euro selecionado por padrão. Cada aba mostra o rótulo e o valor de
  hoje, funcionando também como resumo das quatro moedas. Implementadas como `button`
  com `role="tab"`, navegáveis por teclado.
- **Período**: 30d, 90d (padrão), 180d. Trocar o período recalcula selo, comparações e
  gráfico.
- Seleções vivem em estado local do componente. Não são persistidas.

### Gráfico

SVG inline, sem biblioteca, coerente com ADR-005 (o mapa da rota já é SVG puro).

- `viewBox` de proporção fixa e largura 100%; os pontos são projetados do domínio de
  valores para o `viewBox`, com 4% de folga acima e abaixo.
- Linha do período, linha tracejada da média, marcadores de mínima e máxima com valor e
  data, ponto de hoje destacado em âmbar.
- Eixo x com rótulos de mês; eixo y com mínima, média e máxima.
- Passar o mouse ou o dedo mostra linha vertical e o valor daquele dia.
- `role="img"` com `aria-label` descrevendo período, mínima, máxima e valor atual, para
  quem não enxerga o gráfico. Os mesmos números já aparecem em texto acima dele.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/data/exchange.ts` | Busca, validação com zod, cache. Sem React. |
| `src/data/exchangeStats.ts` | Funções puras de estatística e formatação de domínio. Sem rede, sem React. |
| `src/components/home/ExchangeSection.tsx` | Estado de moeda/período, textos, selo, estados de carregando e erro. |
| `src/components/home/RateChart.tsx` | Só o SVG, recebendo pontos já calculados. |
| `src/components/home/*.module.css` | Estilos das duas, em CSS Modules como o resto. |

Alterado: `src/pages/HomePage.tsx` (inclui a seção) e o helper de `fetch` dos testes
existentes (ver Testes).

A seção é independente do `viagem.json` e do `TripProvider`: não recebe nada do contexto
da viagem e falha sozinha.

## Testes

Vitest, no padrão dos testes atuais.

**`exchangeStats.test.ts`** — série fixa conhecida:
- inversão para reais por unidade e aplicação da unidade de exibição (100 Ft);
- mínima, máxima, média e percentil corretos;
- selo em cada uma das três faixas, incluindo exatamente nos limites 0,25 e 0,75;
- série de um único dia: sem selo, sem comparações;
- período maior que a série: usa o que existe e informa o intervalo real.

**`exchange.test.ts`** — `fetch` e `localStorage` mockados:
- cache dentro de 12h não chama a rede;
- cache vencido dispara nova busca e regrava;
- HTTP 500, JSON inválido e resposta fora do schema retornam falha tratada, sem exceção;
- falha com cache vencido presente devolve o cache marcado como desatualizado;
- `localStorage` que lança exceção não quebra a busca.

**`ExchangeSection.test.tsx`** — `fetch` mockado:
- renderiza valor de hoje, selo e data da cotação;
- troca de moeda muda o valor exibido e o rótulo da unidade;
- troca de período recalcula as comparações;
- falha sem cache mostra "Cotação indisponível" e não derruba a home.

**Ajuste nos testes existentes:** `HomePage.test.tsx` e `DestinationPage.test.tsx`
substituem o `fetch` global por uma única resposta, a do `viagem.json`. Com a nova
chamada, o helper `stubFetch` passa a responder conforme a URL: `viagem.json` devolve a
fixture da viagem, a URL da Frankfurter devolve uma fixture de cotações, e qualquer
outra URL falha explicitamente.

## Falhas

| Situação | Comportamento |
|---|---|
| Carregando | Esqueleto com a altura final da seção, para o layout não deslocar |
| API fora do ar, com cache | Mostra o cache com aviso "cotação de dd/mm, não foi possível atualizar" |
| API fora do ar, sem cache | "Cotação indisponível no momento"; o resto da home segue normal |
| Resposta fora do schema | Igual a API fora do ar; nada de dado parcial silencioso |
| Sem internet | Igual a API fora do ar |

Nenhuma falha de câmbio pode impedir a renderização da home.

## Decisões e alternativas descartadas

- **Frankfurter em vez da AwesomeAPI**: a AwesomeAPI
  (`economia.awesomeapi.com.br/json/last/EUR-BRL`) também funciona sem chave e com CORS
  aberto, e atualiza durante o dia. Ficou de fora porque o histórico exigiria uma
  segunda integração e o limite do plano grátis é mais apertado; a granularidade diária
  basta para escolher o dia da compra. Se um dia o valor intradiário fizer falta, ela é
  o complemento natural.
- **PTAX do Banco Central**: é a taxa oficial brasileira, mas a API da Olinda é mais
  pesada de consultar e a cotação comercial já serve para acompanhar a tendência.
- **Biblioteca de gráfico**: descartada pelo mesmo motivo do ADR-005 — o site é leve e
  já desenha SVG à mão.
- **Persistir moeda e período escolhidos**: descartado por YAGNI. O padrão (euro, 90
  dias) atende o caso principal.
