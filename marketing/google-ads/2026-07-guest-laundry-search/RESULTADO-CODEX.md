# Resultado da coleta forense — Google Ads

Data da coleta: 2026-08-18  
Conta: A7 Laundry - 01 (`290-113-2891`)  
Campanha: A7 | Search | Guest Laundry | Orlando | EN | JUL26 (`24072699595`)  
Janela do Google Ads: 19 jul. a 17 ago. de 2026 (últimos 30 dias)  
Moeda e fuso: BRL · GMT-03:00

## Caminho utilizado

Foi utilizado o **Plano B — exports do painel do Google Ads**.

O caminho pela API não iniciou consultas porque `mos-app/.env.local` contém as chaves `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID` e `GOOGLE_ADS_API_VERSION` com valores vazios. O script encerrou antes de obter token OAuth ou chamar `googleAds:searchStream`.

## Developer token

Nível: **não confirmado**.

A Central de API aberta no contexto da conta `290-113-2891` informou que está disponível apenas para contas de administrador. Portanto, não foi possível verificar com segurança se o token é Test, Basic ou Standard. Nenhum valor sensível foi exibido ou gravado.

## Saldo e veiculação

- Fundos disponíveis no momento da coleta: **R$ 30,39**.
- Alerta exibido: **“Os fundos estão acabando”**.
- Último pagamento: **R$ 500,00 em 16 de agosto de 2026**, pagamento manual via Pix.
- Status da campanha: **Ativada**.
- Diagnóstico: **Qualificada (limitada)** / **Limitada pelo volume de pesquisas**.
- A veiculação estava **ativa**, com atividade em 18 de agosto de 2026: **4 cliques**, custo de **R$ 98,76** e saldo atual de **R$ 30,39**.

## Arquivos entregues

Os arquivos brutos estão em `exports/`:

- `campanha-panorama-ultimos-30-dias.csv`
- `campanha-por-hora-ultimos-30-dias.csv`
- `campanha-por-dia-da-semana-ultimos-30-dias.csv`
- `palavras-chave-com-quality-score-ultimos-30-dias.csv`
- `termos-de-pesquisa-ultimos-30-dias.csv`
- `recomendacoes-2026-08-18.xlsx`
- `recomendacoes-2026-08-18.png`
- `faturamento-atividade-2026-08-18.csv`
- `faturamento-2026-08-18.png`

## Travas novas encontradas

1. As variáveis sensíveis do Google Ads puxadas para `mos-app/.env.local` estão vazias; por isso a auditoria pela API não pôde começar.
2. A Central de API não está acessível no contexto da conta cliente; é necessário entrar na conta de administrador que possui o developer token para confirmar o nível.
3. O painel exibe um aviso de bloqueador de anúncios, mas isso não impediu as consultas visuais nem os exports.
4. A página de termos de pesquisa tinha um filtro de visualização preexistente (`Termo de pesquisa contém disney`) e segmentação por ação de conversão. O filtro e a segmentação foram removidos somente da visualização para exportar o conjunto completo; nenhum objeto da conta foi alterado.

## Confirmação de somente leitura

**Nada foi alterado na conta Google Ads.** Não houve mudança de lance, orçamento, status, palavra-chave, anúncio, segmentação, ação de conversão ou recomendação. Nenhuma recomendação foi aplicada. As únicas interações foram navegação, ajuste temporário de colunas/segmentos da tabela e downloads/exports.

## Complemento — Insights de leilão

Coleta adicional executada em 2026-08-18, mantendo a janela de 19 jul. a 17 ago. de 2026.

- `exports/auction-insights-campanha-ultimos-30-dias.csv`: export nativo no nível da campanha.
- `exports/auction-insights-por-palavra-chave-ultimos-30-dias.csv`: consolidado com uma coluna de palavra-chave e as linhas brutas exibidas pelo Google Ads para cada keyword elegível.

A keyword `"hotel laundry service"` não disponibilizou o botão de Informações do leilão quando selecionada individualmente e foi registrada como `SEM DADOS DE LEILÃO`. O download nativo iniciado a partir de uma keyword não preservou o filtro oculto da seleção e repetiu os valores da campanha; esse arquivo foi descartado para não entregar dados com escopo incorreto. Por isso, a versão segmentada por keyword foi consolidada diretamente das linhas visíveis de cada relatório individual. O relatório não ofereceu segmentação por hora do dia; as dimensões temporais disponíveis eram semana, mês, trimestre, ano e dia da semana. Nenhuma configuração da conta foi alterada.
