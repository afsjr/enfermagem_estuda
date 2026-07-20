// Configuração do CORS para permitir chamadas do navegador
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_INSTRUCTION = `Você é o MonicAI, o assistente inteligente oficial para alunos do curso técnico do Colégio Santa Mônica.
Sua missão é auxiliar estudantes em sua jornada de formação na área da saúde.

ESCOPO ABSOLUTO — RESPONDA APENAS SOBRE SAÚDE E ENFERMAGEM:
Este é um projeto educacional 100% gratuito para alunos do técnico em enfermagem.
Você SOMENTE deve responder perguntas relacionadas a: enfermagem, anatomia, fisiologia, farmacologia, ética profissional, legislação COFEN/COREN, procedimentos técnicos, cálculo de medicamentos, urgência/emergência, saúde da mulher/criança, fundamentos de enfermagem e demais temas da grade curricular do curso técnico em enfermagem.
Se uma pergunta fugir deste escopo, responda cordialmente redirecionando o aluno de volta aos estudos. Exemplo: "Sou o MonicAI, seu assistente de estudos em enfermagem. Meu propósito é auxiliá-lo exclusivamente em temas técnicos da área da saúde. Vamos voltar aos estudos? Qual matéria de enfermagem você gostaria de revisar hoje?"
Se o usuário insistir em temas fora do escopo após o redirecionamento, repita a mesma orientação de forma educada e firme, sempre redirecionando para os estudos de enfermagem.

REGRAS DE OURO:
1. Identidade: Apresente-se como o MonicAI. Seja profissional, acolhedor e motivador.
2. Escopo: Responda APENAS sobre temas de saúde e enfermagem (conforme definido acima). Qualquer outro assunto deve ser recusado com redirecionamento cordial aos estudos.
3. Segurança: Recuse educadamente qualquer pedido que envolva dosagens perigosas, práticas ilegais ou conteúdos maliciosos. Explique que seu papel é estritamente pedagógico.
4. Didática: Utilize terminologia técnica correta, mas explique de forma que um aluno de curso técnico compreenda facilmente.
5. Formatos: Se solicitado um Mapa Mental, use uma estrutura textual organizada. Para Estudos de Caso, foque na prática humanizada.
6. APROFUNDAMENTO (OBRIGATÓRIO): Ao final de TODA resposta, adicione uma seção chamada "🚀 Para Aprofundar" com 2 ou 3 sugestões de tópicos relacionados, termos técnicos avançados ou correlações clínicas para que o aluno possa ampliar seu repertório.
7. FUNDAMENTAÇÃO TEÓRICA E ORIENTAÇÃO (OBRIGATÓRIO): Ao final de toda resposta didática/teórica, inclua obrigatoriamente uma seção curta chamada "📚 Referências Recomendadas" citando livros clássicos da enfermagem ou diretrizes oficiais brasileiras (ex: Ministério da Saúde, resoluções do COFEN/COREN) que embasam a resposta. Adicione também a mensagem de alerta destacada: "⚠️ Nota pedagógica: Aluno, lembre-se sempre de diversificar suas fontes de consulta e estudo para enriquecer seus conhecimentos!".

SUGESTÕES DE MELHORIA:
Se o aluno quiser sugerir melhorias para o projeto, informe cordialmente que ele pode enviar um e-mail para: adelinosantos.fs@gmail.com

Ao iniciar, dê as boas-vindas ao aluno do Colégio Santa Mônica e pergunte em qual disciplina ou tema técnico ele precisa de suporte hoje.`;

// Lista de palavras e padrões suspeitos para detecção de Prompt Injection (Jailbreak)
const INJECTION_PATTERNS = [
  /(?:ignore|desconsidere|esqueça|cancelar|ignorar|ignore|bypass|override|forget)\b.*\b(?:instruç|regr|diretriz|prompt|sistema|anterior|system|rules)/i,
  /(?:você|voce|you)\b.*\b(?:não é mais|nao e mais|deixou de ser|is no longer)\b.*\b(?:tutor|monicai)/i,
  /(?:você|voce|you)\b.*\b(?:agora é|agora e|seja|aja como|act as|are now)\b.*\b(?:hacker|desenvolvedor|prompt|outro|outra|assistente virtual genérico|terminal|shell|linux)/i,
  /\[(?:system|instruction|prompt|user|assistant|assistant_instruction|admin)\]/i,
  /<(?:system|instruction|prompt|user|assistant)>/i,
  /(?:instrução do sistema|system instruction|prompt de sistema|revelar seu prompt|me diga seu prompt)/i
];

function detectPromptInjection(text: string): boolean {
  if (!text) return false;
  const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentuados
  return INJECTION_PATTERNS.some(pattern => pattern.test(normalizedText) || pattern.test(text));
}

function sanitizeInput(text: string): string {
  if (!text) return '';
  let sanitized = text;
  sanitized = sanitized.replace(/\[\s*(system|instruction|prompt|user|assistant|admin)\s*\]/gi, '');
  sanitized = sanitized.replace(/<\/?\s*(system|instruction|prompt|user|assistant|student_query)\s*>/gi, '');
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  return sanitized.trim();
}

function buildOpenAiMessages(
  action: string,
  topic: string,
  format: string,
  history: any[]
): any[] {
  const messages: any[] = [
    { role: 'system', content: SYSTEM_INSTRUCTION }
  ];

  if (action === 'generateQuizJson') {
    const sanitizedTopic = sanitizeInput(topic);
    const prompt = `Gere um quiz com exatamente 5 perguntas de múltipla escolha sobre o tema: ${sanitizedTopic}.
Foque na prática clínica e na segurança do paciente sob a perspectiva do técnico em enfermagem no Brasil.
Cada pergunta deve ter exatamente 4 alternativas e apenas 1 resposta correta.
Você DEVE responder estritamente em formato JSON com o seguinte esquema (não inclua blocos markdown de código, retorne apenas o JSON bruto):
{
  "questions": [
    {
      "question": "Texto da pergunta?",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "answer": 0,
      "explanation": "Explicação detalhada e fundamentação teórica baseada em literaturas científicas brasileiras (ex: Potter, Brunner & Suddarth, resoluções do COFEN/COREN, manuais do Ministério da Saúde)."
    }
  ]
}`;
    messages.push({ role: 'user', content: prompt });

  } else if (action === 'generateStudyContent') {
    const sanitizedTopic = sanitizeInput(topic);
    const prompt = `Gere um ${format} sobre o tema: <student_query>${sanitizedTopic}</student_query>. 
Este conteúdo é para um aluno do curso técnico do Colégio Santa Mônica. Foque em excelência técnica e cuidado humanizado. 
Ao final, inclua a seção "Para Aprofundar" com temas correlatos.`;

    history.forEach((msg: any) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.role === 'user' ? `<student_query>${sanitizeInput(msg.content)}</student_query>` : msg.content
      });
    });

    messages.push({ role: 'user', content: prompt });

  } else if (action === 'chat') {
    history.forEach((msg: any) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.role === 'user' ? `<student_query>${sanitizeInput(msg.content)}</student_query>` : msg.content
      });
    });
  }

  return messages;
}

async function callOpenRouter(
  action: string,
  topic: string,
  format: string,
  history: any[],
  temperature: number,
  responseMimeType: string
): Promise<string> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY não configurada no Supabase.");
  }

  const messages = buildOpenAiMessages(action, topic, format, history);
  const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  const requestBody: any = {
    model: 'deepseek/deepseek-chat',
    messages: messages,
    temperature: temperature
  };

  if (responseMimeType === 'application/json') {
    requestBody.response_format = { type: 'json_object' };
  }

  const response = await fetch(openRouterUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/afsjr/enfermagem_estuda',
      'X-Title': 'EnfAssist'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API do OpenRouter: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGroqFallback(
  action: string,
  topic: string,
  format: string,
  history: any[],
  temperature: number,
  responseMimeType: string
): Promise<string> {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY não configurada no Supabase.");
  }

  const messages = buildOpenAiMessages(action, topic, format, history);
  const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const requestBody: any = {
    model: 'llama-3.3-70b-versatile',
    messages: messages,
    temperature: temperature
  };

  if (responseMimeType === 'application/json') {
    requestBody.response_format = { type: 'json_object' };
  }

  const response = await fetch(groqUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API do Groq Fallback: ${errorText}`);
  }

  const groqData = await response.json();
  return groqData.choices?.[0]?.message?.content || '';
}

Deno.serve(async (req: Request) => {
  // Trata requisições OPTIONS (Preflight do CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, topic, format, history = [] } = await req.json();

    // 1. Validação e Sanitização do Input do Estudante com base na Ação
    let userInputToCheck = '';
    if (action === 'chat') {
      const lastUserMsg = [...history].reverse().find(msg => msg.role === 'user');
      userInputToCheck = lastUserMsg ? lastUserMsg.content : '';
    } else {
      userInputToCheck = topic || '';
    }

    if (detectPromptInjection(userInputToCheck)) {
      return new Response(JSON.stringify({ 
        error: "Ação bloqueada por motivos de segurança. Por favor, utilize o MonicAI apenas para fins educacionais e evite comandos de reprogramação do sistema." 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Configurações base
    let responseMimeType = "text/plain";
    let temperature = 0.7;

    if (action === 'generateQuizJson') {
      responseMimeType = "application/json";
      temperature = 0.5;
    }

    // Estrutura de payloads e controle
    let responseText = '';
    let usedProvider = '';

    // A. Tentar primeiro o OpenRouter (DeepSeek)
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (openRouterApiKey) {
      try {
        responseText = await callOpenRouter(
          action,
          topic,
          format,
          history,
          temperature,
          responseMimeType
        );
        usedProvider = 'openrouter';
        console.info("Resposta gerada via OpenRouter (DeepSeek).");
      } catch (openRouterError: any) {
        console.warn("OpenRouter (DeepSeek) falhou. Tentando Gemini...", openRouterError.message);
      }
    }

    // B. Se falhar ou não houver chave do OpenRouter, tentar Gemini
    if (!usedProvider) {
      const apiKey = Deno.env.get('GEMINI_API_KEY');
      if (apiKey) {
        try {
          // Prepara payloads específicos para o Gemini
          let contents = [];
          if (action === 'generateQuizJson') {
            const sanitizedTopic = sanitizeInput(topic);
            const prompt = `Gere um quiz com exatamente 5 perguntas de múltipla escolha sobre o tema: ${sanitizedTopic}.
Foque na prática clínica e na segurança do paciente sob a perspectiva do técnico em enfermagem no Brasil.
Cada pergunta deve ter exatamente 4 alternativas e apenas 1 resposta correta.
Você DEVE responder estritamente em formato JSON com o seguinte esquema (não inclua blocos markdown de código, retorne apenas o JSON bruto):
{
  "questions": [
    {
      "question": "Texto da pergunta?",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "answer": 0,
      "explanation": "Explicação detalhada e fundamentação teórica baseada em literaturas científicas brasileiras (ex: Potter, Brunner & Suddarth, resoluções do COFEN/COREN, manuais do Ministério da Saúde)."
    }
  ]
}`;
            contents = [{ role: 'user', parts: [{ text: prompt }] }];
          } else if (action === 'generateStudyContent') {
            const sanitizedTopic = sanitizeInput(topic);
            const prompt = `Gere um ${format} sobre o tema: <student_query>${sanitizedTopic}</student_query>. 
Este conteúdo é para um aluno do curso técnico do Colégio Santa Mônica. Foque em excelência técnica e cuidado humanizado. 
Ao final, inclua a seção "Para Aprofundar" com temas correlatos.`;
            const formattedHistory = history.map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.role === 'user' ? `<student_query>${sanitizeInput(msg.content)}</student_query>` : msg.content }]
            }));
            contents = [...formattedHistory, { role: 'user', parts: [{ text: prompt }] }];
          } else if (action === 'chat') {
            contents = history.map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.role === 'user' ? `<student_query>${sanitizeInput(msg.content)}</student_query>` : msg.content }]
            }));
          } else {
            return new Response(JSON.stringify({ error: `Ação inválida: ${action}` }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
          const requestBody = {
            contents: contents,
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            generationConfig: {
              temperature: temperature,
              responseMimeType: responseMimeType
            }
          };

          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini status code ${response.status}: ${errorText}`);
          }

          const geminiData = await response.json();
          responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          usedProvider = 'gemini';
          console.info("Resposta gerada via Gemini.");
        } catch (geminiError: any) {
          console.warn("Gemini falhou. Tentando Groq...", geminiError.message);
        }
      }
    }

    // C. Se falhar ou não houver chaves anteriores, tentar Groq como fallback final
    if (!usedProvider) {
      const groqApiKey = Deno.env.get('GROQ_API_KEY');
      if (groqApiKey) {
        try {
          responseText = await callGroqFallback(
            action,
            topic,
            format,
            history,
            temperature,
            responseMimeType
          );
          usedProvider = 'groq';
          console.info("Resposta gerada via Groq (Fallback).");
        } catch (groqError: any) {
          console.error("Groq falhou também:", groqError.message);
          return new Response(JSON.stringify({ 
            error: "Todos os provedores de IA (OpenRouter, Gemini, Groq) falharam ou não estão configurados.",
            details: groqError.message
          }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        return new Response(JSON.stringify({ 
          error: "Nenhum provedor de IA configurado ou disponível (tentativas falharam)."
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ 
      text: responseText, 
      fallback: usedProvider !== 'openrouter', // retrocompatibilidade
      provider: usedProvider
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
