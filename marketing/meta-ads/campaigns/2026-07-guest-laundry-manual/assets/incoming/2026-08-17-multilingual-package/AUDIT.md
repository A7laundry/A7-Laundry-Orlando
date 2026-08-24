# Auditoria do pacote multilíngue — 2026-08-17

> Destino: biblioteca de entrada da campanha `2026-07-guest-laundry-manual`.
> Status de publicação: **BLOQUEADO**. Os arquivos foram preservados como originais recebidos; nenhum foi promovido para `approved/`.

## Resultado executivo

| Classificação | Quantidade | Decisão |
|---|---:|---|
| `REWORK_GUEST` | 16 | Conceito compatível com hóspedes, sem preço incorporado, mas exige correção antes do teste pago. |
| `ARCHIVED_OLD_PRICE` | 8 | Retirado do lote: exibe US$3,00/lb e está arquivado como material antigo. |
| `HOLD_LOCAL_CAMPAIGN` | 8 | Direcionamento de morador/casa; não misturar na campanha atual de hóspedes. |
| `REJECT` | 7 | Não reutilizar a arte: referência a mercado não atendido, empresa/parque ou ambientação de marca reconhecível. |
| `APPROVED` | 0 | Nenhuma peça passou todos os gates de preço, marca, idioma, formato e placement. |

Os 39 PNGs abrem corretamente e correspondem às dimensões declaradas no pacote: 16 quadrados `1088x1088`, 8 verticais `1088x1920` e 15 horizontais `1920x1088`. A imagem de referência e o `LEIA-ME.txt` também foram preservados. O inventário individual está em `creative-audit.csv`.

## Bloqueios comuns

1. **Marca própria inconsistente:** as artes incorporam várias reconstruções do símbolo/nome A7, inclusive versões que não correspondem ao master oficial. O padrão do projeto exige arte logo-free e composição posterior de `marketing/meta-ads/brand/a7-logo-05.png` ou `a7-logo-06.png`.
2. **Sem atestação de placements:** não existem as seis prévias obrigatórias de Instagram/Facebook Feed, Stories e Reels. Nenhum ativo pode ir para mídia paga sem esse gate.
3. **Preço incorreto em 8 peças — arquivado:** os quatro criativos “tempo valioso” quadrados e os quatro verticais mostram **US$3,00/lb**. Eles foram movidos para `marketing/meta-ads/archive/material-antigo/2026-08-17-valores-desatualizados/` e não fazem mais parte do lote utilizável.
4. **Safe zone vertical:** os 8 arquivos 9:16 têm headline e/ou preço, URL e benefícios fora de `y=420–1500`. Eles podem ser cobertos pela interface ou cortados em placements.
5. **Horizontal fora do master 16:9:** os 15 arquivos têm `1920x1088`, não `1920x1080`. Antes de qualquer uso, devem ser reexportados e receber prévia específica do placement.
6. **Promessas não autorizadas:** “same-day delivery/entrega no mesmo dia” aparece sem “subject to availability”; “Orlando's #1” não possui comprovação arquivada. “Free pickup/delivery” deve ser normalizado para “pickup & delivery included”.
7. **Idioma/nome divergente em 5 arquivos:** há peças nomeadas como hebraico, português, espanhol ou inglês cujo texto incorporado está em outro idioma. Todo texto em hebraico também requer revisão humana fluente antes de publicação.

## Marcas, empresas e geografia

Foram rejeitadas as peças que exibem ou evocam propriedade de terceiros:

- quatro artes “dia mágico” usam um castelo imediatamente associável a parque temático;
- `a7_es_landscape-16x9_roupa-suja-nos-lavamos.png` mostra “Universal Studios Florida”;
- `a7_pt_landscape-16x9_chegou-em-orlando.png` mostra “Universal Orlando Resort” e ainda inclui um selo “Miami to Orlando”;
- `a7_en_landscape-16x9_miami-orlando-travel-light.png` promove Miami, mercado explicitamente bloqueado nos guardrails.

O próximo lote deve usar somente A7 Laundry e descrições genéricas como “hotel”, “resort”, “vacation rental”, “Orlando attractions” e “theme parks”, sem nome, logotipo, fachada reconhecível ou identidade visual de outra empresa.

## Direção recomendada

- Refazer primeiro os 16 conceitos `REWORK_GUEST` como challengers da campanha atual, mantendo o foco em hóspedes e sem alterar o conjunto/campanha já em aprendizado.
- Produzir o master em `1080x1920`, logo-free, com toda informação crítica no centro seguro; aplicar apenas o logo oficial depois.
- Produzir os novos criativos **sem preço incorporado na imagem**. A oferta e o mínimo permanecem na copy do anúncio e na landing page.
- Se houver autorização futura para exibir preço na arte, usar apenas US$3,25/lb Normal ou US$3,95/lb Express 8h, ambos com mínimo de US$50; Express sempre sujeito à disponibilidade.
- Manter os 8 conceitos de “recupere sua semana/pare de lavar” fora desta campanha. Eles podem virar um lote separado para moradores depois que público, oferta e página de destino forem definidos.
- Não corrigir nem recortar os 7 `REJECT`; recriar o conceito com cenário genérico é mais seguro do que tentar apagar marcas embutidas.

## Limite desta auditoria

Esta revisão valida os arquivos recebidos e os compara às regras documentadas do projeto. Ela não autoriza publicação, não altera a campanha ativa e não substitui revisão linguística humana para hebraico nem as prévias reais no Ads Manager.
