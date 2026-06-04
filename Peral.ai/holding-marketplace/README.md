<div align="center">

# Pearl.AI

**Plataforma de gestão e análise inteligente de holdings**

*IA em tempo real para decisões estratégicas — powered by Claude Sonnet*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748?logo=prisma)](https://prisma.io)
[![Anthropic](https://img.shields.io/badge/Claude-Sonnet-d97706?logo=anthropic)](https://anthropic.com)

</div>

---

## O que é o Pearl.AI?

Pearl.AI é uma plataforma web completa para gestores de holdings e family offices que precisam de visibilidade total sobre suas empresas, ativos e receitas. A plataforma integra inteligência artificial (Claude Sonnet) para gerar análises automáticas, calcular scores de risco, prever receitas com forecasting e conduzir sessões de inteligência estratégica conversacional.

Tudo em um único painel, com design escuro premium e interface fluída.

---

## Interface

### Landing Page — Hero

> Vídeos de fundo em crossfade com parallax no cursor, partículas animadas e entrada hero animada.

![Home Hero](../pritns/home-hero.png)

---

### Landing Page — Funcionalidades

> Grade responsiva de cards com as 6 principais funcionalidades da plataforma, com animações de scroll.

![Home Features](../pritns/home-features.png)

---

### Landing Page — Planos

> Cards de precificação com destaque para o plano Business, lista de features e botões de conversão.

![Home Plans](../pritns/home-plans.png)

---

### Login

> Autenticação segura com email e senha. Background com vídeo e logo animado.

![Login](../pritns/login-final.png)

---

### Cadastro

> Criação de conta com nome, email, senha e confirmação. Integrado ao NextAuth com hash bcrypt.

![Register](../pritns/register-final.png)

---

### Dashboard — Visão Geral

> Painel principal com KPIs consolidados, gráfico de receita do portfólio e feed de alertas de IA.

![Dashboard](../pritns/dashboard-new.png)

---

## Funcionalidades em Detalhe

### 1. Dashboard Consolidado

O painel principal agrega dados de todas as empresas da holding em tempo real:

- **Patrimônio Líquido Total** — soma de todos os ativos cadastrados nas empresas
- **Liquidez** — razão entre receita mensal e anual, em percentual
- **Empresas Monitoradas** — contagem total do portfólio
- **Risco Atual** — derivado dos insights de IA mais recentes (`bearish` = risco alto)
- **Gráfico de tendência consolidada** — receita mensal agregada de todo o portfólio via `RevenueChart`
- **Feed de alertas de IA** — últimas análises geradas pelo Claude, com empresa e horário
- **Relatórios rápidos** — status de Compliance AI e Visão de Risco

---

### 2. Portfólio de Empresas

Página `/dashboard/companies` com:

- **Grid de 3 colunas** de cards por empresa (`CompanyCard`)
- **Filtros combinados**: busca textual (nome, descrição, receita), setor e país
- Integração com `CompanyFilters` para filtros via URL (`searchParams`)
- Dados incluídos: ativos, histórico de receita (últimos 12 meses)

---

### 3. Página de Empresa (Detalhe)

Acessível via `/dashboard/companies/[slug]`. Apresenta:

- **Header da empresa** — logo inicial, nome, país, setor, site externo e status (ativo/inativo)
- **6 campos de info** — país, setor, moeda, fundação, funcionários, status
- **3 KPIs financeiros** — receita anual, receita mensal, total de ativos
- **Painel de IA completo** (`AIInsightPanel`) — análise Claude, score gauge, forecast chart, tudo expansível
- **Histórico mensal de receita** — gráfico de barras com todos os registros mensais
- **Lista de ativos** — nome, tipo, descrição e valor de cada ativo cadastrado

---

### 4. IA Intelligence

Página `/dashboard/ai` com visão consolidada de scores e insights por empresa:

| KPI | Descrição |
|-----|-----------|
| Portfolio Avg Score | Média dos scores calculados de todas as empresas |
| Companies Analyzed | Quantas já têm análise de IA gerada |
| High Risk Companies | Empresas com nível `high` ou `critical` |
| Growing Revenue | Empresas com tendência crescente de receita |

Cada empresa é listada via `AICompanyRow` com:
- Score geral (0–100) com barra de progresso
- Nível de risco colorido (`low` verde · `medium` amarelo · `high` vermelho · `critical` bordô)
- Outlook da IA (↑ bullish · → neutral · ↓ bearish · ⚠ cautious)
- Sub-scores: Revenue, Growth, Assets, Efficiency
- Resumo da última análise gerada

---

### 5. Sistema de Score Proprietário

O módulo `lib/scoring.ts` calcula um score de 0 a 100 para cada empresa com base em 4 dimensões:

| Dimensão | Como é calculada |
|----------|-----------------|
| **Revenue Health** | Pontuação baseada no valor absoluto da receita anual |
| **Growth Score** | Tendência de crescimento com base no histórico de registros mensais |
| **Asset Coverage** | Razão entre ativos totais e receita anual |
| **Efficiency** | Razão entre receita mensal e anual (proxy de liquidez operacional) |

O nível de risco (`low`, `medium`, `high`, `critical`) é derivado do score geral.

---

### 6. Forecasting de Receita (Método de Holt)

O módulo `lib/forecasting.ts` aplica suavização exponencial dupla (Holt) sobre o histórico mensal:

- Projeta os **próximos 12 meses** de receita
- Retorna **limite inferior** e **superior** (intervalo de confiança)
- O `ForecastChart` exibe a projeção visualmente, diferenciando histórico real de projeção
- A função `trendSummary` retorna uma label textual (`growing fast`, `stable`, `declining`, etc.)

---

### 7. Análise de IA com Claude Sonnet

A rota `POST /api/ai/analyze/[companyId]` envia os dados da empresa para o Claude Sonnet e recebe:

| Campo | Descrição |
|-------|-----------|
| `summary` | Resumo executivo da empresa |
| `strengths` | Array de pontos fortes identificados |
| `risks` | Array de riscos detectados |
| `perspective` | Perspectiva de médio/longo prazo |
| `recommendation` | Recomendação estratégica |
| `outlook` | `bullish` / `neutral` / `bearish` / `cautious` |
| `confidence` | Nível de confiança da análise (0–100) |

O resultado é salvo no banco de dados e exibido no `AIInsightPanel` em tempo real.

---

### 8. Intel Estratégica (Assistente Conversacional)

Página `/dashboard/intel` — o diferencial conversacional do Pearl.AI:

**Funcionamento:**

1. O gestor cria uma **sessão de intel** com um título
2. O assistente conduz uma entrevista estruturada sobre a holding
3. A cada resposta, o Claude extrai automaticamente **keywords categorizadas**:
   - `setor`, `mercado`, `ativo`, `risco`, `oportunidade`, `empresa`, `financeiro`, `estrategia`, `pessoa`
4. Ao final, o Claude gera um **briefing executivo** completo da holding

**Interface:**
- Painel esquerdo: lista de sessões (ativas / concluídas) com contagem de keywords
- Centro: chat conversacional com histórico de mensagens
- Painel direito: keywords capturadas em tempo real com filtros por categoria e contagem de menções

---

### 9. Setup Wizard

Onboarding guiado em `/dashboard/setup` para novos usuários configurarem:

- Perfil do administrador
- Primeira empresa do portfólio
- Dados financeiros iniciais

---

### 10. Painel Admin

Área `/dashboard/admin` para operações administrativas:

- Criar e gerenciar empresas
- Upload de logo das empresas via `POST /api/upload/company-logo`
- Gerenciar usuários e permissões

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router + Turbopack) | 16 |
| Linguagem | TypeScript | 5 |
| Estilo | Tailwind CSS | v4 |
| Banco de Dados | SQLite | via Prisma ORM |
| Autenticação | NextAuth | v5 (JWT + Credentials) |
| Inteligência Artificial | Anthropic Claude Sonnet | `@anthropic-ai/sdk` |
| Segurança | bcryptjs | hash de senhas |
| Ícones | Lucide React | — |

---

## Estrutura do Projeto

```
holding-marketplace/
├── app/
│   ├── page.tsx                        # Landing page (hero, features, planos)
│   ├── login/page.tsx                  # Autenticação
│   ├── register/page.tsx               # Cadastro
│   ├── dashboard/
│   │   ├── page.tsx                    # Visão geral consolidada
│   │   ├── layout.tsx                  # Layout com Sidebar
│   │   ├── companies/
│   │   │   ├── page.tsx                # Grid de empresas com filtros
│   │   │   └── [slug]/page.tsx         # Detalhe de empresa + IA
│   │   ├── ai/page.tsx                 # Intelligence hub de scores
│   │   ├── intel/page.tsx              # Assistente conversacional
│   │   ├── admin/page.tsx              # Painel administrativo
│   │   └── setup/page.tsx             # Setup wizard
│   └── api/
│       ├── auth/[...nextauth]/         # NextAuth handler
│       ├── auth/register/             # Registro de usuário
│       ├── companies/                 # CRUD de empresas
│       ├── ai/
│       │   ├── analyze/[companyId]/   # Análise Claude
│       │   ├── score/[companyId]/     # Cálculo de score
│       │   └── forecast/[companyId]/  # Previsão de receita
│       ├── intel/
│       │   ├── chat/                  # Chat do assistente Intel
│       │   └── sessions/              # Sessões de Intel
│       ├── profile/                   # Perfil do usuário
│       ├── upload/company-logo/       # Upload de logos
│       └── seed/                      # Dados de exemplo
├── components/
│   ├── AIInsightPanel.tsx             # Painel de IA na página da empresa
│   ├── AICompanyRow.tsx               # Linha de empresa na página de IA
│   ├── CompanyCard.tsx                # Card de empresa no grid
│   ├── CompanyFilters.tsx             # Filtros de busca/setor/país
│   ├── CompanyLogoUpload.tsx          # Upload de logo
│   ├── ForecastChart.tsx              # Gráfico de previsão de receita
│   ├── RevenueChart.tsx               # Gráfico de histórico de receita
│   ├── ScoreGauge.tsx                 # Gauge visual do score
│   ├── Navbar.tsx                     # Barra superior do dashboard
│   ├── Sidebar.tsx                    # Menu lateral do dashboard
│   ├── SetupWizard.tsx                # Wizard de onboarding
│   ├── AdminPanel.tsx                 # Painel de administração
│   ├── ParallaxBg.tsx                 # Fundo com efeito parallax
│   └── SessionProvider.tsx            # Provider de sessão NextAuth
├── lib/
│   ├── claude.ts                      # Integração com Anthropic SDK
│   ├── scoring.ts                     # Sistema de score proprietário
│   ├── forecasting.ts                 # Forecasting com método de Holt
│   ├── prisma.ts                      # Cliente Prisma singleton
│   └── utils.ts                       # Formatação de moeda e números
├── prisma/
│   ├── schema.prisma                  # Modelos do banco de dados
│   └── migrations/                    # Histórico de migrations
├── public/
│   ├── logo/pearl-logo.png            # Logo da plataforma
│   └── videos/                        # Vídeos de background (hero/login)
└── types/
    └── index.ts                        # Types globais (setores, países, etc.)
```

---

## Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Chave de API da Anthropic (obter em [console.anthropic.com](https://console.anthropic.com))

### Passo a Passo

```bash
# Clone o repositório
git clone git@github.com:leosan123456/Pearl.git
cd Pearl/Peral.ai/holding-marketplace

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env e preencha os valores abaixo

# Rode as migrations do banco
npx prisma migrate deploy

# (Opcional) Gere o cliente Prisma se necessário
npx prisma generate

# (Opcional) Popule com dados de exemplo
curl -X POST http://localhost:3000/api/seed

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz de `holding-marketplace/` com:

```env
# Banco de dados (SQLite local)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth — gere um secret seguro com: openssl rand -base64 32
NEXTAUTH_SECRET="sua-chave-secreta-aleatoria"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic Claude — obtenha em console.anthropic.com
ANTHROPIC_API_KEY="sk-ant-..."
```

> **Atenção:** sem `ANTHROPIC_API_KEY`, as rotas de IA retornam erro. O sistema de score e forecasting funciona sem IA.

---

## Rotas da API

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/register` | Registro de novo usuário (nome, email, senha) |
| `GET/POST` | `/api/auth/[...nextauth]` | Handler NextAuth (login, sessão, logout) |

### Empresas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/companies` | Listar todas as empresas do usuário |
| `POST` | `/api/companies` | Criar nova empresa |
| `GET` | `/api/companies/[id]` | Detalhes de uma empresa |
| `PUT` | `/api/companies/[id]` | Atualizar dados de uma empresa |
| `DELETE` | `/api/companies/[id]` | Remover empresa |

### Inteligência Artificial

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/ai/analyze/[companyId]` | Gerar análise completa com Claude Sonnet |
| `POST` | `/api/ai/score/[companyId]` | Calcular e salvar score proprietário |
| `POST` | `/api/ai/forecast/[companyId]` | Gerar previsão de receita (Holt, 12 meses) |

### Intel Estratégica

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/intel/sessions` | Listar sessões do usuário |
| `POST` | `/api/intel/sessions` | Criar nova sessão |
| `DELETE` | `/api/intel/sessions` | Excluir sessão |
| `GET` | `/api/intel/chat?sessionId=` | Carregar histórico e keywords de uma sessão |
| `POST` | `/api/intel/chat` | Enviar mensagem e receber resposta da IA |

### Perfil e Outros

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/profile` | Dados do perfil do usuário |
| `PUT` | `/api/profile` | Atualizar perfil |
| `POST` | `/api/profile/complete` | Marcar perfil como completo |
| `POST` | `/api/upload/company-logo` | Upload de logo (multipart/form-data) |
| `POST` | `/api/seed` | Popular banco com dados de exemplo |

---

## Modelos do Banco de Dados

```
User          — usuários autenticados
Company       — empresas do portfólio
Asset         — ativos por empresa (imóvel, ação, etc.)
RevenueRecord — histórico de receita mensal/anual
AIInsight     — análises geradas pelo Claude (summary, outlook, risks...)
CompanyScore  — scores calculados (overall, revenueHealth, growthScore...)
ForecastRecord— projeções futuras de receita (mês a mês)
IntelSession  — sessões do assistente conversacional
IntelEntry    — mensagens do chat (user/assistant)
IntelKeyword  — keywords extraídas com categoria e peso
```

---

## Planos Disponíveis

| | Personal | Business |
|--|----------|----------|
| **Preço** | R$ 197/mês | R$ 697/mês |
| Usuários | 1 admin | Até 10 |
| Empresas | Até 5 | Ilimitadas |
| Análises de IA | 20/mês | Ilimitadas |
| Forecasting | — | 12 meses |
| Suporte | E-mail | Prioritário 24h |
| API | — | Incluso |
| Período de teste | 14 dias | 14 dias |

---

## Licença

Proprietário — Pearl.AI © 2026  
Todos os direitos reservados.
