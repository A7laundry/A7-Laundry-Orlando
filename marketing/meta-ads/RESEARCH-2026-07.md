# Meta Ads — Pesquisa de Ferramentas, MCPs, SDKs & Workflow (jul/2026)

> Varredura GitHub + web (research-only, sem instalar/conectar/tokenizar). Contexto: A7 Laundry USA, Orlando, CTWA local, ~$15/dia.

## A. Resumo executivo
No porte da A7, quase todo SaaS pago é overkill (feito para gasto $5k–100k/mês). Caminho certo:
1. **Escrita/criação** → MCP **oficial da Meta** (já instalado). Nasce pausado, preview+anomaly nativos, token não sai da Meta.
2. **Análise/relatórios** → **skill Claude Code** agendada chamando `ads_insights_*` — replica "morning briefing" a custo zero.
3. **Concorrência** → **Meta Ad Library oficial (grátis)**.
4. **Inspiração criativo** → Foreplay ($49) ou BigSpy (free).
5. **Campanhas versionadas** → specs YAML no git.

Custo incremental para começar: **$0**.

## D. Melhores MCPs
| Opção | Nota | Veredito |
|---|---|---|
| **Meta Ads MCP oficial** (`mcp.facebook.com/ads`) — já instalado | 9/10 | **USAR** — token user↔Meta, nasce pausado, grátis |
| pipeboard-co/meta-ads-mcp (OSS ⭐1k Python) | 9/10 | Fallback se precisar upload de imagem nativo |
| gomarble-ai/facebook-ads-mcp-server (read-only ⭐334) | 7.5/10 | TESTAR — relatório sem risco de escrita |
| byadsco/meta-ads-mcp (97 tools ⭐8) | 5/10 | Imaturo p/ dinheiro real |
| irinabuht12 GA4-combo (⭐1k / 3 commits) | 3/10 | **EVITAR** — estrelas infladas |

**Gap do oficial:** sem upload de imagem e sem bulk edit (irrelevante hoje — criativos vêm do Lovart).

## E. SDKs / bibliotecas
- **facebook-business (Python SDK)** — oficial, v25.x (API **v25.0**). Base p/ automação custom. ⭐1.6k.
- **facebook-nodejs-business-sdk** se Node.
- **Graph API direto** fallback.
- **attainmentlabs/meta-ads-cli** (⭐29) — campanha em 1 YAML, nasce pausada, dry-run, audit log. Modelo p/ specs versionadas.

Hierarquia CTWA (tudo `status:PAUSED`): Campaign `OUTCOME_ENGAGEMENT` CBO → Ad Set `destination_type:WHATSAPP` `optimization_goal:CONVERSATIONS` `promoted_object.page_id` → Ad Creative `object_story_spec.link_data` + `call_to_action.type:WHATSAPP_MESSAGE` → Ad. Imagem: `POST /adimages`→`image_hash`. Métrica-chave: `onsite_conversion.messaging_conversation_started_7d`.

## F. Ferramentas de análise
| Ferramenta | Custo | Uso |
|---|---|---|
| **Skill própria + `ads_insights_*`** | Grátis | **Recomendado** |
| mathiaschu/meta-ads-analyzer (Claude skill+MCP ⭐382) | Grátis | Diagnóstico (Learning Phase, Breakdown Effect); roda em CSV |
| Motion | Free plan | Análise elemento→performance |
| Porter Metrics | Free/$15 | Dashboard Looker/Sheets p/ humano |

## G. Concorrência / Ad Library
| Ferramenta | Custo | Veredito |
|---|---|---|
| **Meta Ad Library oficial** | Grátis | **USAR** — keyword+país, tem API grátis |
| BigSpy | Free(5/dia)/$9 | Testar free |
| Foreplay | $49 | Swipe file |
| PowerAdSpy | Free+ext | Espionagem leve |
| ⚠️ MagicBrief | — | **EVITAR — encerra 31/jul/2026** |
| AdSpy/Semrush/Similarweb/Minea | $34–220 | Overkill/e-com |

## Overkill claro (NÃO comprar)
Smartly.io (~$4–5k/mo), Northbeam (precisa ~$50k/mo spend), Triple Whale (Shopify), Hunch (~€2.5k/mo), Madgicx & Revealbot ($99+ p/ grandes), Whatagraph (agências), Semrush AdClarity ($220), Similarweb ($125).

## H/I/J. Caminho 0 / 30 / 90 dias
- **Agora ($0):** MCP oficial + skill `a7-meta-ads-operator` (preflight+report) + Ad Library grátis + JUL26 versionada em YAML.
- **30 dias:** skill madura (alertas+semáforo), rotina agendada 09:00 ET, estrutura git, 2–3 specs YAML, swipe file inicial.
- **90 dias:** geração assistida de campanha via API (pausada→aprovação→publish), upload de imagem (pipeboard/SDK), scoring de criativos, playbook por vertical, retargeting.

## N. Riscos de segurança
- 🔴 `status:ACTIVE` gasta dinheiro na hora (CBO) → gate manual.
- 🔴 `DELETE` irreversível → só PAUSED/ARCHIVED.
- 🟡 Token só no MCP oficial. Se SDK: System User token, `appsecret_proof`, rotação, escopo mínimo.
- 🟡 MCPs de terceiro não vetados (byadsco, irinabuht12) → evitar.
- 🟡 Scrapers de Ad Library não-oficiais → usar só API oficial.

## O. Próxima ação
Skill `a7-meta-ads-operator` v1 (`*preflight`+`*report`) + estrutura `/marketing/meta-ads/` + JUL26 como primeira spec YAML. Custo $0.

---
*Fontes: pipeboard-co/meta-ads-mcp, gomarble-ai/facebook-ads-mcp-server, mathiaschu/meta-ads-analyzer, attainmentlabs/meta-ads-cli, facebook/facebook-python-business-sdk, developers.facebook.com/docs/marketing-api (v25.0), Meta Ad Library. Pesquisa consolidada 2026-07-02.*
