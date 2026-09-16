# Changeset GADS — desligar o canal de telefone

**Data:** 2026-09-02 · **Conta:** 290-113-2891 · **Campanha:** JUL26 (id 24072699595)
**Motivo:** o Owner não atende ligações em inglês. Toda ligação paga é verba gasta **e** cliente quente perdido.
**Execução:** manual pelo Owner. Nenhuma alteração foi aplicada por automação.

---

## Evidência (26/ago – 01/set/2026, leitura de 02/set)

| Item | Número |
|---|---|
| Impressões do recurso de chamada | **135** |
| **Ligações telefônicas geradas** | **3** |
| Custo atribuído ao recurso de chamada | **R$ 51,88** |
| Conversões geradas | **0,00** |
| Gasto total da campanha no período | R$ 351,89 |
| **Fatia do gasto indo para chamadas** | **14,7%** |

Três pessoas ligaram na semana passada. Ninguém atendeu. Pagamos R$ 51,88 por isso.

### Ações de conversão de ligação — todas "Principal", todas sem conversão recente

| Ação | Origem | Status de acompanhamento | Nas metas da conta |
|---|---|---|---|
| `Calls from ads` | Chamadas a partir de anúncios | Não há conversões recentes | **Sim** |
| `A7 - Website call 60s` | Site | Não há conversões recentes | **Sim** |
| `Business profile - Call` | Outro | Não há conversões recentes | Não |
| `Business profile - Tracked call` | Outro | Não há conversões recentes | Não |

As duas primeiras estão incluídas nas metas e podem influenciar o lance de uma campanha que já
sofre por falta de sinal ([[project_google_ads_virada_purchase_led]]).

### Achado colateral
Um recurso de **imagem foi reprovado em 01/set às 22:14** — motivo "Sobreposições de texto ou imagem".
Está pausado e sem entrega. Precisa de substituição ou remoção.

---

## Passos (executar no painel)

### 1. Desligar o recurso de chamada
O recurso **não aparece listado** em `Recursos → Associações`, nem no nível da campanha nem no da
conta, apesar de registrar métricas. Isso indica que ele vem do **nível da conta ou do vínculo com o
Perfil da Empresa do Google** (chamadas automáticas), não de um asset criado na campanha.

Verificar nesta ordem:
1. `Campanhas → Recursos → Recursos` (não a aba Associações), filtro tipo **Chamada**, no nível conta.
2. `Adm. → Configurações da conta → Recursos automatizados` — procurar recursos de chamada automáticos.
3. `Campanhas → Configurações da campanha JUL26 → Recursos automatizados` — desativar chamada.
4. Se persistir: `Ferramentas → Contas vinculadas → Perfil da Empresa do Google` — o vínculo injeta
   o botão de ligar. Desvincular é a última opção, porque o vínculo também traz sitelinks de local.

**Antes de desvincular o Perfil da Empresa**, ativar as **Mensagens/chat** no próprio Perfil, para não
ficar sem canal de contato ali.

### 2. Rebaixar as ações de conversão de ligação
`Metas → Conversões → Resumo → Ver todas as ações de conversão`:
- `Calls from ads` → **Ação secundária (apenas observação)**, "Incluir em Conversões" = **Não**
- `A7 - Website call 60s` → **Ação secundária**, "Incluir em Conversões" = **Não**

Deixar as duas do Perfil da Empresa como estão — já não entram nas metas.

### 3. Substituir os links de telefone do site
109 links `href="tel:+14076708839"` no site. A money page dos anúncios já está correta
(1 telefone contra 4 links de WhatsApp). O passivo está nas páginas de campanhas hoje pausadas:

| Página | Links `tel:` |
|---|---|
| `carpet-cleaning.html` | 14 |
| `vacation-rental.html` | 10 |
| `upholstery-cleaning.html` | 10 |
| `shoe-cleaning.html` | 10 |

Trocar por `wa.me/14076708839` **antes** de reativar essas campanhas.

---

## O que este changeset NÃO resolve

Quem quiser ligar continuará ligando — pelo orgânico, pelo Perfil da Empresa, por indicação. A peça
seguinte é um **número virtual com recado em inglês** que devolve a pessoa para o WhatsApp
(Twilio: US$ 1,15/mês + US$ 0,0085/min; sem SMS não há custo de registro A2P 10DLC).
Ver [[project_orlando_sazonalidade]] para a janela: há cinco semanas de baixa para construir isso
antes da retomada de outubro.
