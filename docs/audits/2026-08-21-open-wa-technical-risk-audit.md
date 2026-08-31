# Auditoria técnica — open-wa / wa-automate

**Data:** 2026-08-21
**Alvo:** [`open-wa/wa-automate-nodejs`](https://github.com/open-wa/wa-automate-nodejs)
**Método:** clone do repositório (`--depth 50`, 320 MB) + leitura do código v5 + extração do pacote npm estável `4.76.0` + issues, discussions e changelog via API do GitHub
**Motivo:** sustentar com evidência o **ADR-1** do blueprint `docs/blueprints/A7-BLUEPRINT-WHATSAPP-CRM-24-7-2026-08-21.md`, que rejeita bibliotecas não-oficiais de WhatsApp
**Veredito:** **NÃO ADOTAR** no número `+1 407-670-8839`

---

## 1. Sumário executivo

O open-wa é um projeto real, tecnicamente ambicioso e ainda ativo. Não é abandonware nem golpe. Mas a auditoria encontrou **cinco fatos verificados no código** que, somados, o tornam inadequado para o canal de vendas da A7:

| # | Achado | Gravidade |
|---|---|---|
| 1 | Baixa e executa **JavaScript remoto ofuscado** dentro da sessão autenticada do WhatsApp, **sem verificação de assinatura** | **Crítico** |
| 2 | O servidor de licença recebe **o número de telefone** do usuário e responde com **JavaScript executável** | **Crítico** |
| 3 | A versão estável recomendada para produção está **parada desde dez/2024** | Alto |
| 4 | Bugs de usuário que quebram a função central ficam **abertos e sem resposta**, incluindo um relato de **bloqueio imediato por ToS** | Alto |
| 5 | A própria documentação admite **zero conteúdo sobre risco de ban e rate limit** | Médio |

Nenhum desses achados é acusação de má-fé. O mecanismo de patch remoto é justamente **o que permite ao projeto sobreviver** quando o WhatsApp Web muda sem aviso. O problema não é intenção — é **superfície de confiança**: para usar o open-wa você confia sua conta inteira de WhatsApp, e todas as conversas dos seus clientes, a um único mantenedor e a um CDN.

---

## 2. Como funciona

### 2.1 Mecânica da conexão

Não há protocolo reimplementado. O open-wa **pilota um navegador**:

```
1. Puppeteer (ou Playwright / Lightpanda) abre um Chromium
2. Carrega https://web.whatsapp.com
3. Imprime QR code no terminal (ou usa link-code)
4. Você escaneia com o celular → o WhatsApp registra um "dispositivo vinculado"
5. Injeta uma camada JS na página (o "WAPI bridge") que expõe as funções internas do WhatsApp Web
6. A biblioteca chama essas funções via page.evaluate()
7. A sessão fica em disco para sobreviver a restarts
```

Consequência estrutural: **o WhatsApp Web é a API.** Quando a Meta muda o app — o que acontece sem aviso — a ponte quebra. Daí nasce o mecanismo do §3.1.

### 2.2 Arquitetura v5 (monorepo)

O repositório atual é um monorepo pnpm/turbo com **29 pacotes**:

```
packages/
  core/               ← Transport: browser, patches, licença, sessão
  driver-puppeteer/   ← drivers intercambiáveis
  driver-playwright/
  driver-lightpanda/
  api/ client/ cli/ schema/ domain/ mcp/ plugin-sdk/
  runtime-node/ runtime-bun/ runtime-edge/ runtime-browser/
  socket-client/ session-sync/ screencaster/ cf-proxy/ ...

apps/         cli · dashboard-neo · docker · docs · orchestrator-cli · registry
integrations/ chatwoot · cloudflare · node-red · s3 · webhook
```

A engenharia é séria. O problema não é competência.

### 2.3 Superfícies de integração

| Superfície | Uso |
|---|---|
| **Easy API** | `npx @open-wa/wa-automate --port 8080` — API HTTP local + Swagger/Postman gerados |
| **SocketClient** | Outro app Node conecta a uma instância rodando |
| **Runtime embutido** | `createClient` dentro da sua aplicação |
| **Webhooks** | Empurra eventos para o seu serviço |
| **Chatwoot** | Ponte para inbox de atendimento |
| **MCP** | Expõe os métodos como ferramentas para agentes de IA |
| **Cloudflare proxy** | Acesso remoto à sessão local sem abrir porta |

Para o caso da A7, a integração seria trivial: Easy API + webhook para o CRM. **A facilidade de integrar não é o problema.**

---

## 3. Achados de risco

### 3.1 CRÍTICO — Execução de código remoto na sessão do WhatsApp

**Evidência.** `packages/core/src/transport/Transport.ts`:

```
DEFAULT_LIVE_PATCHES_URL      = 'https://cdn.openwa.dev/patches.json'
GH_LIVE_PATCHES_FALLBACK_URL  = 'https://raw.githubusercontent.com/open-wa/
                                 wa-automate-nodejs/master/patches.json'
LIVE_PATCH_CACHE_FILENAME     = 'patches.cache.json'
```

O comentário do próprio código, em `packages/core/src/transport/httpClient.ts:37-45`:

> *"Fetch patches from a remote endpoint. Mirrors legacy `getPatch()`: GET `patchesUrl?wv=X&wav=Y` — Response: **JSON array of evaluatable JS strings** — If no `etag` header, compute MD5 short hash"*

E a aplicação, em `applyPatchArtifactSequence`:

```ts
const applyResult = await this.page.evaluateScript<unknown>(artifact.script);
```

O arquivo `patches.json` versionado na raiz do repositório é **JavaScript ofuscado**:

```
["(function(_0x313847,_0x444a4c){const _0x3a61c7=_0x44e9,_0x512666=_0x313847();
while(!![]){try{const _0x16f386=-parseInt(_0x3a61c7(0x2eaf,']jDT'))/0x1*...
```

**Verificação de integridade:** busca por `signature`, `checksum`, `sha256`, `verifySig` em `packages/core/src/transport/` retorna apenas `RuntimeMethodIntegrityResult` — que checa se o *bridge* interno quebrou, **não** se o patch é autêntico. O MD5 mencionado serve para **cache-busting**, não para validação criptográfica.

**O que isso significa na prática.** Em toda inicialização, o open-wa busca código de um CDN e o executa **dentro da página autenticada do seu WhatsApp**. Esse código tem, por construção, acesso a tudo que a sessão tem: ler qualquer conversa, enviar em seu nome, exportar contatos, vincular outro dispositivo.

Quem controlar `cdn.openwa.dev` — o mantenedor, alguém que comprometa o CDN, ou alguém que comprometa a conta GitHub que serve o fallback — executa código arbitrário na conta de **todos os usuários simultaneamente**, sem publicar versão nova no npm e sem deixar rastro em auditoria de dependências.

> **Por que existe:** é o único jeito de consertar a biblioteca quando a Meta muda o WhatsApp Web, sem esperar release. É uma solução racional para um problema real. Mas transfere ao usuário um risco que ele geralmente não sabe que aceitou.

### 3.2 CRÍTICO — Servidor de licença recebe o telefone e devolve código

**Evidência.** `packages/core/src/transport/httpClient.ts:23-27`:

```ts
export interface LicenseValidationBody {
  key: string;
  number: string;          // ← o número de WhatsApp em uso
  [debugField: string]: unknown;
}
```

Comentário da função `validateLicense`:

> *"Mirrors legacy `getLicense()`: POST `licenseCheckUrl` with `{ key, number, ...debugInfo }` — Response: **executable JS string payload**, or empty/false if invalid"*

Duas propriedades ruins numa só chamada:

1. **Telemetria de identidade** — o servidor sabe qual número de WhatsApp roda a biblioteca, com campos de debug abertos (`[debugField: string]: unknown`)
2. **Resposta executável** — a validação de licença não retorna um booleano; retorna **JavaScript que é executado**

Confirmado também no estável v4 (`package/dist/api/Client.js`):

```js
_c.licenseKey) ? yield (0, patch_manager_1.getLicense)(this._createConfig, me, this
```

### 3.3 ALTO — A versão de produção está congelada

O README manda usar `4.76.0` em produção e avisa que a v5 é alpha instável. Mas o `CHANGELOG.md` mostra:

| Versão | Data |
|---|---|
| **4.76.0** (estável atual) | sem data no changelog; publicada no npm em **2026-07-08** |
| 4.75.0 | **2024-12-22** |
| 4.74.2 | 2024-11-21 |
| 4.74.0 | 2024-10-17 |

Ou seja: **entre dez/2024 e meados de 2026 houve essencialmente uma release estável.** Todo o esforço foi para o v5 alpha — uma reescrita completa em monorepo.

Numa biblioteca cuja premissa é *acompanhar mudanças não anunciadas de uma plataforma de terceiros*, ~18 meses de quase-congelamento no ramo de produção é o risco operacional central. O que sustenta o v4 hoje não são releases: são os patches remotos do §3.1.

### 3.4 ALTO — O v5 tem lacunas admitidas pelo próprio projeto

O repositório contém `v5-pseudo-audit.md`, **2.361 linhas** em que o próprio projeto audita o v5 contra o comportamento do legado. Extratos da tabela de conclusões:

| Item | Veredito do próprio projeto |
|---|---|
| Implementação da injeção WAPI | *"currently stub-like in inspected transport — **probable major gap**"* |
| Paridade de webhook/integrações | *"explicitly warned as missing — **confirmed missing parity**"* |
| Paridade de patch/licença/integridade no startup | *"likely missing"* |
| Diferenciação de estado de autenticação | *"likely missing"* |
| Riqueza de estado de sessão no core | *"directly inspected and currently minimal — **likely regression**"* |
| Contrato `create()` no pacote principal | *"major regression in ergonomics"* se acidental |

Crédito onde é devido: **poucos projetos publicam uma autoauditoria dessas.** É sinal de honestidade. Mas descreve um v5 que não está pronto e um v4 que está sendo deixado para trás.

### 3.5 MÉDIO — A documentação admite não cobrir risco de ban

`apps/docs/ISSUE-3337.md`, escrito pelo próprio projeto:

> *"**The docs have zero rate limit content.** The only mention of 'limit' is `maxQr` for QR emission count."*

E na lista de páginas a escrever (`apps/docs/TODO-PAGES.md`):

```
guides/rate-limits.mdx — Rate Limits and Ban Risk
- What happens when you exceed (blocks, warnings, ban risk)
- Ban risk profile
```

Ainda não existe. A pergunta mais importante para quem opera um número comercial — *quantas mensagens por minuto antes de ser sinalizado?* — não tem resposta na documentação oficial.

### 3.6 Risco de conta (contexto externo)

Fora do repositório, o quadro é o já registrado em `memory/project_whatsapp_api_avaliacao.md`: clientes não-oficiais violam o ToS do WhatsApp, e a detecção é automática. O README do próprio projeto abre com:

> *"This project is unofficial and is not affiliated with WhatsApp or Meta. **Use it at your own risk.**"*

`[NÃO CONFIRMADO]` Resultados de busca mencionam que a Meta teria enviado um *cease-and-desist* ao projeto, com acusação de "bulk messaging". **Não foi possível confirmar em fonte primária** nesta auditoria — não há menção no repositório atual (clone raso, pode estar em histórico anterior). Registrado como não verificado; não deve ser usado como argumento.

---

## 4. O que a comunidade está dizendo

Aqui o sinal é mais claro do que qualquer análise de código.

### 4.1 As issues são do mantenedor falando sozinho

Das **81 issues abertas** (excluindo PRs):

| Autor | Issues abertas |
|---|---|
| **smashah** (mantenedor) | **24** |
| Rishav0123 | 3 |
| MrShadow50 | 2 |
| Outros 6 usuários | 1 cada |

As 24 do mantenedor são RFCs e meta-issues de arquitetura: *"RFC: Explore Cordis / Spatiotemporal Composability for v5 Plugin & Session Lifecycle"*, *"[META] v5 RC execution plan"*, *"Rewrite orchestrator from the ground up"*.

### 4.2 As issues de usuários morrem sem resposta

Reportes de usuários reais, com a contagem de comentários:

| Data | Comentários | Título |
|---|---|---|
| 2026-06-04 | **0** | **[BUG] `onMessage` returns res: false and silently drops all incoming messages (MD)** |
| 2026-06-04 | **0** | **[BUG] Fallback WA version 2.2147.16 triggers immediate TOS block on headless login** |
| 2026-08-08 | 0 | `deleteMessage` remove a mensagem mas rejeita com TypeError |
| 2026-04-18 | 0 | ProtocolError — Promise was collected |
| 2026-04-01 | 0 | Mensagem não vai para contato existente |
| 2026-01-24 | 0 | Trava em "Authenticating" e dá timeout |
| 2025-10-19 | 4 | Recebe mensagem mas não consegue enviar |
| 2025-08-29 | 3 | `Attempted to use detached Frame` |
| 2025-07-17 | **0** | **"This feature requires insider license" mesmo sem usar recursos insider** |

Dois merecem destaque:

- **"onMessage silently drops all incoming messages"** — é *a* função central da biblioteca. Aberto em junho/2026, **zero respostas**.
- **"triggers immediate TOS block on headless login"** — um usuário relata **bloqueio imediato por violação de termos** ao logar. Zero respostas. Este é exatamente o cenário que custaria o número da A7.

### 4.3 As discussions estão praticamente mortas

Últimas atividades reais:

| Data | Título |
|---|---|
| 2026-05-13 | WhatsApp Web falha ao conectar e reporta Chrome como desatualizado |
| 2025-09-08 | `ht400 callback error - licenced api` |
| 2024-04-13 | *"please.. fix the docs website https://docs.openwa.dev/ 🙏"* |
| 2024-01-04 | *"the documentation pages are 404 not found"* |
| 2023-07-06 | *"The docs page is down!!!"* |
| 2023-05-13 | *"I had an ERROR even though I have a license key, what should I do?"* |

Padrão: **usuários pagantes travados por erro de licença**, e documentação fora do ar por períodos longos.

### 4.4 Adoção comparada

Downloads semanais no npm (medidos em 2026-08-21):

| Pacote | Downloads/semana | Proporção |
|---|---|---|
| `@whiskeysockets/baileys` | **385.546** | 158× |
| `whatsapp-web.js` | **91.160** | 37× |
| `@wppconnect-team/wppconnect` | 5.644 | 2,3× |
| **`@open-wa/wa-automate`** | **2.444** | — |
| `venom-bot` | 1.011 | 0,4× |

3.647 estrelas acumuladas em 7 anos, mas **2.444 downloads/semana**. É o menos usado entre as opções relevantes — o que também significa menos gente encontrando bugs antes de você.

### 4.5 Contexto de supply chain do ecossistema

Em dezembro/2025 o pacote `lotusbail` — clone funcional do Baileys — passou 7 meses no npm com **56 mil downloads**, roubando tokens de sessão, histórico de mensagens e contatos, e vinculando o dispositivo do atacante à conta da vítima. Análise estática não pegou: *"static analysis sees working WhatsApp code and approves it."*

Não é sobre o open-wa. É sobre a categoria: **bibliotecas de WhatsApp não-oficial são alvo preferencial de ataque de cadeia de suprimentos**, porque um comprometimento entrega conversas privadas em escala.

---

## 5. Detalhes de licenciamento

| Item | Situação |
|---|---|
| Licença | **Hippocratic + Do Not Harm (H-DNH) 1.1** — não é OSI-approved |
| Restrições de uso | Proíbe uso por organizações ligadas a jogos de azar, tabaco, armas, energia nuclear, desinformação climática, entre outros |
| Cláusula de rescisão | O licenciante pode notificar violação de princípios de direitos humanos e **encerrar a licença** com 90+90 dias |
| Chaves pagas | ~US$5/mês ou US$50/ano; recursos como enviar para números fora dos contatos exigem chave |
| ToS do projeto | [Documento semi-satírico](https://github.com/open-wa/wa-automate-nodejs/blob/master/tos.md): *"'wa' significa 'walrus'"*, *"vinculante até a morte térmica do universo"*, e a cláusula 7 declara que o uso implica apoio político a uma causa específica |

Para uma empresa, dois pontos práticos: a licença **não é padrão de mercado** (revisão jurídica antes de uso comercial não é paranoia), e o ToS sinaliza que este não é um fornecedor com postura corporativa.

---

## 6. Conclusão

### 6.1 O que o open-wa faz bem

- Arquitetura v5 séria: drivers intercambiáveis, schema tipado, MCP nativo, integrações prontas
- Integração fácil: Easy API sobe em um comando
- Autoauditoria pública e honesta (`v5-pseudo-audit.md`)
- Sete anos de projeto, ainda com commits

### 6.2 Por que não serve à A7

O que decide não é uma falha isolada — é o empilhamento:

1. Executa código remoto não assinado dentro da sua sessão de WhatsApp
2. O servidor de licença conhece seu número e devolve código executável
3. O ramo estável está congelado há ~18 meses
4. Bugs que quebram a função central ficam sem resposta, incluindo **bloqueio por ToS**
5. A doc oficial não cobre risco de ban
6. O uso viola o ToS do WhatsApp, com detecção automática

E do outro lado da balança: o `+1 407-670-8839` é o **único canal de fechamento** da A7 e o destino de todos os anúncios Click-to-WhatsApp. Um bloqueio derruba vendas e mídia paga no mesmo dia.

O ganho que o open-wa ofereceria — evitar o onboarding com a Meta — a Cloud API entrega de graça no caso de uso da A7, via janela FEP de 72h para leads de CTWA.

### 6.3 Veredito

**ADR-1 do blueprint está sustentado: NÃO ADOTAR.**

Se em algum momento houver motivo para testar automação não-oficial, as condições mínimas são: **número descartável**, host isolado sem acesso a dado de cliente, e nenhuma expectativa de continuidade. Nunca no número comercial.

---

## 7. Reprodução

```bash
git clone --depth 50 https://github.com/open-wa/wa-automate-nodejs.git
cd wa-automate-nodejs

# Achado 1 — patches remotos e execução
grep -n "LIVE_PATCHES_URL\|evaluateScript" packages/core/src/transport/Transport.ts
sed -n '37,60p' packages/core/src/transport/httpClient.ts
head -c 400 patches.json                    # JS ofuscado versionado

# Achado 1b — ausência de verificação de assinatura
grep -rn -i "signature\|checksum\|sha256" packages/core/src/transport/

# Achado 2 — licença
sed -n '23,27p' packages/core/src/transport/httpClient.ts

# Achado 3 — congelamento do estável
grep -oE "^#+ \[?v?4\.[0-9]+\.[0-9]+.*" CHANGELOG.md | head

# Achado 4 — autoauditoria
grep -n "probable major gap\|confirmed missing parity\|likely regression" v5-pseudo-audit.md

# Achado 5 — doc admite lacuna
grep -n "zero rate limit content" apps/docs/ISSUE-3337.md

# Comunidade
gh api "repos/open-wa/wa-automate-nodejs/issues?state=open&per_page=100" \
  --jq '[.[] | select(.pull_request == null)] | group_by(.user.login)
        | map({user: .[0].user.login, n: length}) | sort_by(-.n)'
```

---

## 8. Referências

**Código auditado:** `packages/core/src/transport/Transport.ts` · `packages/core/src/transport/httpClient.ts` · `patches.json` · `v5-pseudo-audit.md` · `apps/docs/ISSUE-3337.md` · `apps/docs/TODO-PAGES.md` · `CHANGELOG.md` · `LICENSE.md` · `tos.md` · `package/dist/api/Client.js` (npm 4.76.0)

**Externas:**
- [open-wa/wa-automate-nodejs](https://github.com/open-wa/wa-automate-nodejs) · [ToS do projeto](https://github.com/open-wa/wa-automate-nodejs/blob/master/tos.md) · [LICENSE H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md)
- [Fake WhatsApp API Package on npm Steals Messages, Contacts, and Login Tokens — The Hacker News](https://thehackernews.com/2025/12/fake-whatsapp-api-package-on-npm-steals.html)
- [Unauthorized use of automated or bulk messaging on WhatsApp — WhatsApp Help Center](https://faq.whatsapp.com/5957850900902049)

**Internas:** `docs/blueprints/A7-BLUEPRINT-WHATSAPP-CRM-24-7-2026-08-21.md` (ADR-1) · `memory/project_whatsapp_api_avaliacao.md`
