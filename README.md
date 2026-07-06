<div align="center">

# 🩺 MonicAI — Tutor Digital de Enfermagem

**Tutor com Inteligência Artificial para estudantes do curso técnico em enfermagem do Colégio Santa Mônica.**

</div>

---

## ✨ Funcionalidades

- **Tutor de IA** — Chat inteligente com o Gemini para tirar dúvidas de enfermagem, anatomia, farmacologia e ética profissional.
- **Simulador de Quiz** — Gera simulados de 5 questões com gabarito comentado e referências bibliográficas.
- **Calculadora Farmacológica** — Cálculos de gotejamento (macro/microgotas) e diluição por Regra de Três com explicação passo a passo.
- **Materiais de Estudo** — Geração de Guias de Estudo, Estudos de Caso, Mapas Mentais e Resumos Detalhados.
- **Gamificação** — Sistema de XP e Níveis para motivar o progresso do aluno.
- **Telemetria Anônima** — Coleta de métricas de uso (sem dados pessoais) via Supabase para análise pedagógica.

---

## 🚀 Como Rodar Localmente

**Pré-requisitos:** Node.js 18+

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com a URL e Anon Key do seu projeto Supabase

# 3. Rode o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:3000`.

---

## ⚙️ Configuração do Supabase

### Tabela de Telemetria
Execute no **SQL Editor** do painel do Supabase:

```sql
create table csm_telemetry (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  anonymous_id uuid not null,
  course_semester text,
  module_interest text,
  screen_name text,
  action_type text not null,
  action_detail text,
  duration_seconds integer
);

alter table csm_telemetry enable row level security;
create policy "Permitir inserções públicas para telemetria" on csm_telemetry
  for insert with check (true);
```

### Edge Function (Proxy Seguro do Gemini)
```bash
# Registre a chave do Gemini como secret no Supabase
npx supabase secrets set GEMINI_API_KEY=SUA_CHAVE --project-ref SEU_PROJECT_REF

# Faça o deploy da função
npx supabase functions deploy csm-tutor-proxy --no-verify-jwt --project-ref SEU_PROJECT_REF
```

---

## 🔐 Variáveis de Ambiente

| Variável | Onde Fica | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (frontend) | URL pública do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `.env` (frontend) | Chave anon pública do Supabase |
| `GEMINI_API_KEY` | Supabase Secrets (servidor) | Chave secreta da API do Gemini — **nunca exposta no frontend** |

---

## 🛡️ Segurança

- **API Key oculta** — A chave do Gemini reside exclusivamente no servidor (Supabase Edge Function). O frontend nunca a acessa.
- **Sanitização de Input** — Todas as entradas do usuário passam por limpeza de tags e detecção de Prompt Injection em duas camadas (frontend + servidor).
- **Dados Anônimos** — A telemetria usa UUIDs gerados no navegador. Não são coletados nome, e-mail, matrícula ou quaisquer dados pessoais (LGPD).

---

## 📄 Licença

Projeto educacional desenvolvido para o Colégio Santa Mônica (CSM Educação).
