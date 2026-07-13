# EnfAssist - Tutor digital para estudantes do técnico em Enfermagem CSM

Aplicação web de apoio aos estudos com chat orientado por IA para estudantes da área da saúde.

## Visão geral

O EnfAssist foi pensado para ajudar alunos a tirar dúvidas, revisar conteúdos e gerar materiais de estudo em diferentes formatos. O foco principal é enfermagem, mas o sistema pode servir como apoio para temas correlatos da formação técnica em saúde.

## Funcionalidades

- Chat com resposta gerada por IA.
- Histórico lateral com perguntas recentes.
- Alternância entre modo claro e escuro.
- Geração de materiais em formatos como:
  - Guia de estudo
  - Estudo de caso
  - Mapa mental em texto
  - Resumo detalhado
  - Quiz de revisão
- Bloco de aprofundamento com tópicos relacionados.
- Ações rápidas para copiar ou compartilhar mensagens.

## Tecnologias

- React 19
- TypeScript
- Vite
- Google GenAI
- Tailwind via CDN
- Font Awesome via CDN

## Como executar localmente

1. Instale as dependências:
   `npm install`
2. Crie o arquivo `.env` com base em [.env.example](.env.example).
3. Defina a variável `VITE_GEMINI_API_KEY` com sua chave do Gemini.
4. Inicie o projeto:
   `npm run dev`

## Variáveis de ambiente

Exemplo:

```bash
VITE_GEMINI_API_KEY=sua_chave_aqui
```

## Estrutura principal

- [`App.tsx`](./App.tsx): fluxo principal do chat, histórico e seleção de formatos.
- [`geminiService.ts`](./geminiService.ts): integração com a API do Gemini.
- [`components/ChatMessage.tsx`](./components/ChatMessage.tsx): renderização das mensagens.
- [`components/FormatSelector.tsx`](./components/FormatSelector.tsx): seleção de materiais de apoio.
- [`types.ts`](./types.ts): tipos compartilhados da aplicação.

## Observações importantes

- A chave da API agora é lida por variável de ambiente local.
- Como a chamada ainda acontece no front-end, uma proteção absoluta da chave exige um backend/proxy.
- O arquivo [.env.example](./.env.example) deve ficar no repositório, mas o `.env` real não deve ser versionado.
