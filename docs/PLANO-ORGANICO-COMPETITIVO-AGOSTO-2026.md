# Plano Orgânico Competitivo — Agosto de 2026

**Status:** APROVADO — Bloco 1 implementado localmente
**Data da pesquisa:** 6 de agosto de 2026
**Regra:** este documento autoriza planejamento, não autoriza alteração nem publicação.

## 1. Decisão proposta

Não publicar novos artigos agora. A A7 já tem páginas suficientes e algumas já aparecem na primeira página, mas não transformam impressão em clique na proporção esperada. O primeiro ciclo deve recuperar demanda já conquistada, eliminar competição entre páginas da própria A7 e acrescentar prova operacional que concorrentes não conseguem copiar.

Ordem recomendada:

1. corrigir medição, preço e promessas;
2. definir uma página vencedora por intenção;
3. melhorar a página comercial e os três artigos com demanda comprovada;
4. fortalecer Google Business Profile, avaliações e menções locais;
5. criar um único ativo editorial original, baseado em experiência real;
6. somente depois decidir se novos artigos são necessários.

## 2. O que o mercado está fazendo melhor

| Operador | Oferta observada | Vantagem apresentada | Fraqueza explorável pela A7 |
|---|---|---|---|
| The Laundry Room | a partir de US$ 2,25/lb, mínimo US$ 45, next-day, coleta grátis | unidades físicas, processamento interno, equipe própria, mensagens de status, avaliações | exige criação de conta; comunicação menos centrada no visitante internacional |
| WashFold Orlando | US$ 2,55/lb, mínimo de 20 lb, comforter a partir de US$ 33 | preço claro, agendamento direto, assinatura e página simples | assinatura não combina com turista; foco amplo e pouco específico para hotéis |
| Express Wash and Fold | US$ 2,50/lb next-day ou US$ 3,50/lb same-day, mínimo de 15 lb | preço, prazo, garantia, 32 avaliações declaradas, muitas páginas de serviço e região | arquitetura excessivamente ampla e replicável; oportunidade para a A7 vencer com experiência real e foco turístico |
| Orchid Cleaners | US$ 3,85/lb | 40+ anos, 4,9/5 em 100+ avaliações declaradas, processo orgânico, rastreamento | posicionamento de garment care/dry cleaning; A7 pode ser mais simples e rápida para wash-and-fold de hóspedes |
| WashAway Orlando | US$ 1,70–1,90/lb e next-day para hotéis e vacation homes | proposta diretamente voltada ao turista e explicação do peso da sacola | preço publicado de forma inconsistente e pouca prova operacional visível |
| BayHill Cleaners | a partir de US$ 2,66/lb | preço, aplicativo e foco em bairros premium | foco em dry cleaning e cobertura geográfica menor |

### Leitura de preço

US$ 3,25/lb não está 50% acima de todo o mercado. Está aproximadamente:

- 44% acima de US$ 2,25;
- 30% acima de US$ 2,50;
- 27% acima de US$ 2,55;
- 22% acima de US$ 2,66;
- 16% abaixo de US$ 3,85;
- 19% abaixo de US$ 4,00.

A A7 está na faixa média-alta, não fora do mercado. Não deve disputar menor preço. Deve justificar o adicional com atendimento por WhatsApp sem conta, confirmação rápida, conhecimento de hotel/resort, atendimento multilíngue, handoff seguro e Express quando confirmado.

## 3. Evidência própria que determina a prioridade

### Search Console — 30 de junho a 4 de agosto

- 36 cliques, 2.276 impressões, CTR 1,6%, posição média 16,7.
- A homepage concentrou 1.292 impressões e 28 cliques.
- Três páginas com posição de primeira página somaram 429 impressões e apenas 2 cliques, CTR combinado de 0,47%:
  - `/blog/same-day-laundry-tourists-orlando`: 142 impressões, 1 clique, posição 8,1;
  - `/blog/orlando-laundromat-vs-delivery`: 141 impressões, 1 clique, posição 8,0;
  - `/blog/laundry-service-orlando`: 146 impressões, 0 cliques, posição 7,7.

### GA4 — 30 de julho a 5 de agosto

- aproximadamente 18 sessões orgânicas;
- 5 sessões orgânicas com clique no WhatsApp;
- a taxa observada de sessão orgânica com clique foi 27,8%, mas a base é pequena;
- o evento `whatsapp_click` ainda não prova conversa, orçamento ou venda.

### Diagnóstico técnico/editorial

- o sitemap público contém 62 URLs;
- 35 páginas locais/de resort já estão corretamente em quarentena por similaridade textual acima de 0,90;
- existem várias páginas para a mesma intenção de hotel e same-day/express;
- há duas URLs públicas de comforter, embora uma canonize para a outra;
- páginas antigas ainda contêm `aggregateRating` que precisa ser conciliado com a prova real;
- cliques orgânicos e de assistentes de IA podem chegar ao WhatsApp como `direct`, sem referência de origem;
- há mais de um nome de evento associado ao mesmo CTA, então evento-chave não pode ser lido como venda.

## 4. Correções obrigatórias antes de tentar crescer

### Preço e promessa

1. Corrigir exemplos matemáticos:
   - 15 lb × US$ 3,25 = US$ 48,75, mas o mínimo torna o pedido **US$ 50**;
   - 20 lb × US$ 3,25 = **US$ 65**, não US$ 58;
   - Express: 15 lb = US$ 59,25 e 20 lb = US$ 79.
2. Substituir “entrega no quarto/na porta” por “front desk, bell desk ou ponto de encontro aprovado pelo hotel”, salvo quando o hotel confirmar outra regra.
3. Manter Express sempre como “sujeito à confirmação de capacidade”.
4. Usar uma única fonte de preço compartilhada entre landing pages, artigos e dados estruturados.

### Medição

1. Adicionar referência persistente ao WhatsApp para página, campanha, idioma e origem orgânica/IA.
2. Unificar o clique de WhatsApp em um evento canônico; eventos de interface podem existir, mas não podem duplicar conversão.
3. Conciliar pedido pago e receita com a referência da conversa.
4. Verificar se GTM e GA4 direto estão inicializando a mesma propriedade duas vezes.

### Indexação e canibalização

1. Exportar consulta × página no Search Console antes de redirecionar qualquer URL.
2. Eleger uma página principal para cada intenção: geral, hotel, same-day/express, preço, Disney, aeroporto e comparação.
3. Fundir ou redirecionar páginas que respondem à mesma intenção e não têm demanda própria.
4. Transformar a URL antiga de comforter em 301 para a vencedora; canonical sozinho não é a limpeza final.
5. Não liberar as 35 páginas em quarentena sem evidência local única.

## 5. Páginas que entram no primeiro ciclo

### Página comercial principal

`/laundry-pickup-delivery-orlando`

Deve responder acima da dobra, sem rolagem:

- o que fazemos;
- para quem: hotel, resort, Airbnb e vacation rental;
- US$ 3,25/lb, mínimo US$ 50;
- Normal 24h e Express 6h quando confirmado;
- coleta e entrega incluídas;
- áreas atendidas e protocolo de handoff;
- botão de WhatsApp com referência de origem.

Adicionar prova que não seja texto genérico: fotos reais do processo, responsável identificado, unidade que processa o pedido, avaliação verificável, política de separação das cargas, exemplo de embalagem e linha do tempo de um pedido real anonimizado.

### Três páginas com demanda comprovada

1. `/blog/laundry-service-orlando`
   - virar guia de escolha com resposta direta e tabela de custo real;
   - encaminhar intenção transacional para a página comercial;
   - testar título orientado à decisão: `Laundry Service Orlando: Pickup, Prices & 24h Options`.
2. `/blog/same-day-laundry-tourists-orlando`
   - manter como candidata vencedora até análise consulta × página;
   - explicar cutoff, disponibilidade, prazo e protocolo de hotel;
   - título candidato: `Same-Day Laundry Orlando for Hotel Guests | Express 6h`.
3. `/blog/orlando-laundromat-vs-delivery`
   - corrigir os cálculos;
   - comparar custo de máquina, Uber/transporte e 2–3 horas do visitante sem declarar que delivery é sempre mais barato;
   - título candidato: `Orlando Laundromat vs Pickup Laundry: Cost & Time (2026)`.

Não alterar os três títulos simultaneamente sem registrar a data. A unidade de avaliação será a página por 28 dias, não mudanças semanais sucessivas.

## 6. Ativo editorial que pode criar vantagem real

Depois das correções, produzir apenas um ativo novo:

**“Orlando Hotel Laundry Pickup Guide — regras de handoff verificadas por hotel/resort”**

Ele só será publicado se contiver pesquisa própria:

- hotel/resort contatado;
- front desk, bell desk ou encontro presencial;
- restrição conhecida para fornecedor externo;
- data da verificação;
- área e janela operacional da A7;
- aviso para o hóspede confirmar a política na recepção.

Esse ativo é melhor que mais um artigo genérico porque resolve uma objeção de compra e acumula informação local difícil de copiar. Pode gerar versões curta em inglês, português e espanhol sem criar dezenas de páginas quase iguais.

Próximos ativos, condicionados a dados: calculadora de peso/preço baseada em pedidos reais; estudo de tempo e custo com recibos locais; caso real anonimizado do WhatsApp à entrega; guia de viagem “pack less” com dados próprios.

## 7. Google Business Profile e autoridade local

O site sozinho não vence toda busca “near me”. A busca local combina relevância, distância e proeminência.

1. Confirmar categoria principal, serviços, horário, telefone, link de WhatsApp/site e área atendida.
2. Publicar fotos reais de coleta, processamento e entrega, não apenas criativos.
3. Pedir avaliação após pedido concluído, sem incentivo e sem roteiro artificial.
4. Responder a todas as avaliações com informação útil e natural.
5. Buscar menções e links legítimos de property managers, hotéis independentes, blogs de viagem locais, hosts e parceiros de Orlando.
6. Não criar localização fictícia nem encher o nome do perfil com palavras-chave.

## 8. Métricas e gates

### Gate de 7 dias — integridade

- todos os preços e exemplos consistentes;
- promessas operacionais corrigidas;
- referência de origem presente em pelo menos 90% dos novos cliques de WhatsApp testados;
- decisão documentada sobre duplicidade GTM/GA4 e URLs concorrentes.

### Gate de 28 dias — descoberta e clique

Para as três páginas prioritárias, avaliar somente quando o conjunto tiver ao menos 400 impressões novas:

- piso: CTR combinado de 1,5% — cerca de 6 cliques a cada 400 impressões;
- bom resultado: CTR de 2,0% ou mais — 8+ cliques a cada 400 impressões;
- referência anterior: 0,47% — 2 cliques em 429 impressões.

Posição média será lida por consulta e página, nunca como média geral isolada.

### Gate de negócio

Registrar separadamente:

`sessão orgânica → clique WhatsApp → conversa útil → cotação → pedido pago → receita → margem de contribuição`

Nenhuma expansão editorial será aprovada por impressão, evento-chave ou clique sozinho. O primeiro objetivo é obter uma coorte mínima de 20 conversas orgânicas identificadas e pedidos conciliados; até lá, a taxa de venda será apenas descritiva.

## 9. Sequência de execução proposta

### Semana 1 — verdade e limpeza

- medição e referência no WhatsApp;
- auditoria GTM/GA4;
- correções de preço, promessa e schema;
- mapa consulta × página;
- plano de redirects, sem executá-los antes da checagem.

### Semana 2 — conversão da demanda existente

- melhorar a página comercial principal;
- atualizar os três artigos prioritários;
- ligar artigos à página comercial;
- solicitar nova indexação somente das URLs alteradas.

### Semana 3 — prova e local

- fotos e processo reais;
- rotina de avaliações;
- Google Business Profile;
- primeiros contatos com parceiros locais.

### Semana 4 — ativo original e revisão

- publicar o guia de handoff somente se houver pesquisa própria suficiente;
- comparar os primeiros sinais com a linha de base;
- decidir manter, iterar ou criar o próximo ativo.

## 10. Aprovação solicitada

Aprovar ou rejeitar estes cinco pontos antes da aplicação:

1. pausa de novos artigos genéricos durante o primeiro ciclo;
2. prioridade para medição, correções e consolidação;
3. página comercial focada em hóspedes como destino principal;
4. Google Business Profile, avaliações e prova real como trabalho paralelo ao conteúdo;
5. um único artigo novo, condicionado a pesquisa própria sobre handoff em hotéis.

## Fontes externas consultadas

- The Laundry Room: https://orlandolaundryroom.com/laundry-delivery/
- WashFold Orlando: https://www.comforterwash.com/
- Express Wash and Fold Laundry: https://expresswashandfoldlaundry.com/
- Orchid Cleaners: https://orchidcleaners.com/wash-fold
- WashAway Orlando: https://www.washawayorlando.com/
- BayHill Cleaners: https://bayhillcleaners.com/
- Google Business Profile — ranking local: https://support.google.com/business/answer/7091
- Google Search — conteúdo com IA: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Google Search — otimização para recursos generativos: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Google Search — FAQ rich results: https://developers.google.com/search/blog/2023/08/howto-faq-changes
