# A7 Laundry USA — Meta Ads Operations

Operação de Meta Ads **versionada, auditável e repetível** no GitHub. Toda campanha vira spec YAML; todo pré-flight e relatório vira arquivo datado.

> Conta: **A7 LAUNDRY USA** · ad account `650201661142284` · ver [`account.yaml`](./account.yaml).

## Estrutura

```
marketing/meta-ads/
├── README.md                    # este arquivo
├── RESEARCH-2026-07.md          # pesquisa de ferramentas/MCPs/SDKs (jul/2026)
├── account.yaml                 # IDs da conta/página/WhatsApp (SEM tokens)
├── pricing-rules.md             # preços por público — fonte: MANIFESTO.md
├── a7-meta-ads-operator.md      # doc da skill custom (comandos + regras)
├── campaigns/<YYYY-MM-slug>/     # 1 pasta por campanha
│   ├── campaign-spec.yaml
│   ├── audiences.yaml
│   ├── creatives-map.csv
│   ├── copy.md
│   ├── preflight-report.md
│   ├── performance-reports/      # relatórios datados (DADOS SENSÍVEIS DE GASTO)
│   └── assets/                   # imagens usadas
├── templates/                    # modelos YAML p/ novas campanhas
├── reports/                      # consolidados semanais/mensais
├── competitors/                  # inteligência via Meta Ad Library
└── swipe-files/                  # criativos de referência
```

## Regras de ouro (segurança)

1. **Nada é publicado, editado, pausado ou tem budget alterado sem autorização explícita do dono na sessão.**
2. **Todo objeto criado via API/MCP no futuro nasce `PAUSED`.**
3. **Nunca `DELETE`** — só `PAUSED`/`ARCHIVED`.
4. **Token nunca entra em arquivo** — fica no MCP oficial da Meta (OAuth). `account.yaml` guarda só IDs públicos.
5. **Pré-flight obrigatório** antes de qualquer publicação (ver skill).
6. **Relatórios sempre viram arquivo** em `performance-reports/`.
7. **MCP de terceiro / SDK / scraper** só com aprovação prévia.

## ⚠️ Dados sensíveis

`performance-reports/` e relatórios em `reports/` contêm **gasto real ($)**. Se este repositório for/ficar **público**, esses arquivos devem ser adicionados ao `.gitignore` ou o repo mantido privado. Hoje as pastas estão vazias (`.gitkeep`) — nenhum dado de custo foi commitado.

## Motor atual

- **Escrita/criação:** MCP **oficial** da Meta (`mcp__meta-ads__*`), já autenticado. Objetos nascem pausados.
- **Auditoria visual** (o que a API não expõe, ex: número WhatsApp): Claude in Chrome, somente leitura.
- **Análise/relatórios:** skill `a7-meta-ads-operator` chamando `ads_insights_*`.

## Status

| Campanha | Pasta | Status |
|---|---|---|
| A7 \| WhatsApp Conversas \| Laundry+Comforter \| JUL26 | `campaigns/2026-07-laundry-comforter/` | Programada — início 2026-07-03 05:00 PDT · pré-flight GO |
