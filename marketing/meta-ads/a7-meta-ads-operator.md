# Skill: `a7-meta-ads-operator` v1

Operar a conta Meta Ads da **A7 Laundry USA** pelo Claude Code de forma **segura, auditável e versionada** — do pré-flight ao relatório. Humano **sempre** no gate de publicação.

- **Conta:** `650201661142284` (ver [`account.yaml`](./account.yaml))
- **Motor:** MCP oficial da Meta (`mcp__meta-ads__*`)
- **Auditoria visual:** Claude in Chrome (read-only) para o que a API não expõe
- **Fontes:** [`pricing-rules.md`](./pricing-rules.md), `MANIFESTO.md` (raiz), specs em `campaigns/`

---

## 🔒 Regras de segurança (OBRIGATÓRIAS — precedem qualquer comando)

1. **Nunca publicar** (`status:ACTIVE`) sem autorização explícita do dono **na sessão**.
2. **Nunca alterar budget** sem autorização explícita.
3. **Nunca pausar** campanha/ad set/anúncio sem autorização explícita.
4. **Nunca deletar nada.** Só `PAUSED`/`ARCHIVED`.
5. **Todo objeto criado no futuro nasce `PAUSED`.**
6. **Nunca salvar token em arquivo.** Token vive no MCP (OAuth).
7. **Nunca usar MCP de terceiro / SDK / scraper** sem aprovação prévia.
8. **Nunca aplicar recomendação automática do Meta** (opportunity score etc.) sem aprovação.
9. **Sempre gerar pré-flight** antes de qualquer publicação.
10. **Sempre registrar relatório em arquivo** (`performance-reports/`).

> Se um comando exigiria violar uma regra, a skill **para e pede autorização** — não executa.

---

## Comandos

### `*preflight <campaign_name_or_id>`
Auditoria pré-publicação (somente leitura). Verifica:
- status da campanha / ad sets / anúncios
- erros de entrega (`ads_get_errors`)
- opportunity score (`ads_get_opportunity_score`) — lista, **não aplica**
- previews dos anúncios (`ads_get_ad_preview`)
- **prévia individual obrigatória** de Instagram/Facebook Feed, Stories e Reels; qualquer corte de headline, preço, logo ou CTA produz veredito **NO-GO**
- **pricing por público** vs `pricing-rules.md` (local $2.90 / turista $3.25 / express $3.95 / comforter por tamanho)
- **WhatsApp**: destino `WHATSAPP_MESSAGE` + número (`+1 407-670-8839`, não o teste `+1 555…`)
- **Marca e GEO**: usar `@a7laundry` e a área atendida de Orlando; nunca misturar `@a7lavanderia`, Jacareí, Miami ou mercados não comprovados
- **Advantage+ OFF** (público/posicionamento manual quando exigido)
- **tradução automática OFF**
- destino/CTA correto
- **Veredito: GO / GO com observações / NO-GO**

**Output:** `campaigns/<slug>/preflight-report.md`.

### `*report daily <campaign_name_or_id>`
Relatório de performance (via `ads_insights_*`). Métricas:
- gasto, impressões, alcance, CPM, CTR
- conversas iniciadas, **custo por conversa** (`onsite_conversion.messaging_conversation_started_7d` / `cost_per_action_type`)
- performance por **ad set** e por **anúncio**
- **semáforo 🟢🟡🔴** por linha
- recomendações (sem aplicar nada)

**Output:** `campaigns/<slug>/performance-reports/YYYY-MM-DD.md`.

### `*alerts <campaign_name_or_id>`
Só o que exige atenção + ação sugerida:
- gasto sem resultado (gastou > limite, 0 conversa)
- CTR baixo · CPM alto · frequência alta
- criativo cansado (frequência↑ + CTR↓)
- **Comforter consumindo verba demais** dentro da campanha de conversas → sugerir separar em campanha própria
- anúncio sem conversa após limite de gasto

### `*winners <campaign_name_or_id>`
- ranking de **criativos** por custo por conversa
- ranking de **públicos** (ad sets)
- sugestão de **pausar** (perdedores) / **escalar** (vencedores) — proposta, **requer aprovação**

### `*validate <campaign-spec.yaml>`
Valida uma spec **antes** de qualquer build:
- pricing por público (vs `pricing-rules.md`)
- copy (headline/primary/description)
- criativos (existência do asset/creative)
- CTA (`WHATSAPP_MESSAGE`)
- WhatsApp (número correto)
- **status `PAUSED`/draft** (nunca ACTIVE numa spec de build)
- confirma que **não há ação de publicação** embutida

---

## Comandos futuros (v2+ — só após aprovação)
- `*spec-from-lp <url-LP>` — lê LP + MANIFESTO → gera `campaign-spec.yaml` (rascunho)
- `*build <spec.yaml>` — cria campaign/adset/ad **PAUSADOS** via MCP; **não publica**

---

## Inputs esperados
`ad_account_id`, nome/ID da campanha, `campaign-spec.yaml`, pasta `assets/`, `pricing-rules.md`, `account.yaml`, `MANIFESTO.md`, URLs de LP.

## Outputs gerados
`preflight-report.md`, `performance-reports/YYYY-MM-DD.md`, `campaign-spec.yaml` (rascunho), listas de alertas/rankings.

## Arquivos que a skill LÊ
`account.yaml`, `pricing-rules.md`, `campaigns/*/campaign-spec.yaml`, `campaigns/*/audiences.yaml`, `campaigns/*/creatives-map.csv`, `MANIFESTO.md`.

## Arquivos que a skill GERA
Dentro de `campaigns/<slug>/`: `preflight-report.md`, `performance-reports/*.md`. Em `reports/`: consolidados.

## Versionamento de campaign specs
- 1 pasta por campanha: `campaigns/<YYYY-MM-slug>/`.
- Após build, preencher `deployed.campaign_id` / `adset_id` / `ad_id` na spec.
- Pré-flight e performance-reports commitados junto (⚠️ ver nota de dados sensíveis no README).
- Mudança de campanha = novo commit da spec (histórico auditável).

## Como a skill evita publicar sem autorização
- Nenhum comando v1 faz escrita no Meta Ads (todos read-only).
- `*build` (futuro) cria **pausado** e para; publicação (`ACTIVE`) é passo manual separado, nunca no mesmo run.
- Qualquer ação de escrita exige "sim" explícito do dono na sessão.
