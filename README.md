# Eurotrip 2026/2027

App pessoal, somente-leitura, para acompanhar o roteiro da viagem (Berlin →
Cracóvia → Budapeste → Viena → Bratislava → Viena → Praga → Berlin). Site
estático, sem backend: os dados vêm de um único arquivo `public/viagem.json`
lido em tempo de execução.

## Rodando localmente

```bash
npm install
npm run dev
```

## Testes

```bash
npm run test        # Vitest (unit/integration)
npm run test:e2e    # Playwright (builda + serve a produção e testa por cima)
```

## Build de produção

```bash
npm run build
```

Gera `dist/` — HTML/CSS/JS/`viagem.json` estáticos, publicáveis em qualquer
host estático (sem servidor/API).

## Editando os dados da viagem

Edite `public/viagem.json` à mão. O formato é validado por
`src/data/schema.ts`/`src/data/trip.ts` ao carregar a página:

- Campos de topo (`title`, `origin`, `generalItems`) em inglês.
- Cada estadia vive em `destinos[]`; campos de estadia (`name`, `inicioData`,
  `fimData`, `coordenadas`, `hospedagens`, `translados`, `roteiro`) em
  português.
- `name` é obrigatório por estadia; o `slug` da URL é derivado do nome
  automaticamente (cidades repetidas — ex. "Viena", "Berlin" — recebem sufixo
  cronológico: `viena-1`/`viena-2`, `berlin-1`/`berlin-2`).
- **Não inclua dados sensíveis** (número completo de reserva, documentos) —
  o conteúdo publicado é público na URL.
- Dados malformados não derrubam o app: campos inválidos são descartados com
  avisos visíveis na interface, e o restante do roteiro continua navegável.

## Publicando (deploy)

O app é 100% estático — qualquer host de arquivos estáticos funciona. Duas
opções já configuradas neste repositório:

### GitHub Pages

Workflow em `.github/workflows/deploy.yml`: a cada push em `main`, builda e
publica `dist/` em GitHub Pages automaticamente, configurando o `base` path
do Vite (`VITE_BASE_PATH=/<repo>/`) para que os assets e o `viagem.json`
resolvam corretamente sob o subcaminho do projeto. Ative "GitHub Pages" nas
configurações do repositório (Settings → Pages → Source: GitHub Actions).

### Netlify / Vercel

`netlify.toml` já define o build (`npm run build`) e a pasta de publicação
(`dist`). Basta conectar o repositório — esses hosts servem na raiz do
domínio, então nenhum `base` path adicional é necessário. O mesmo comando
(`npm run build` → publicar `dist/`) funciona em Vercel sem configuração
extra (framework preset "Vite").

Em qualquer host, o roteamento usa hash routes (`/#/destino/:slug`) — isso
evita qualquer configuração de rewrite no servidor para deep link/refresh
funcionarem (ADR-004).

## Funcionamento offline (Não-Objetivo da v1)

**A v1 não funciona offline.** O app depende de acesso online para buscar
`viagem.json` e os assets estáticos na primeira carga (e em qualquer reload)
— não há service worker/cache/PWA nesta versão. Isso é uma decisão de
escopo documentada (ADR-002, PRD "Non-Goals"), não um defeito: o app foi
publicado propositalmente em um host gratuito assumindo acesso online
durante a viagem. Um cache offline (PWA) fica em aberto para uma fase
futura.
