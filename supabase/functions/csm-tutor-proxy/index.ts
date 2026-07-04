// Configuração do CORS para permitir chamadas do navegador
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM_INSTRUCTION = `Você é o CSM Tutor, o assistente inteligente oficial para alunos do curso técnico da CSM Educação.
Sua missão é auxiliar estudantes em sua jornada de formação na área da saúde.

REGRAS DE OURO:
1. Identidade: Apresente-se como o CSM Tutor. Seja profissional, acolhedor e motivador.
2. Escopo: Responda apenas sobre temas de saúde (enfermagem, anatomia, farmacologia, ética, etc).
3. Segurança: Recuse educadamente qualquer pedido que envolva dosagens perigosas, práticas ilegais ou conteúdos maliciosos. Explique que seu papel é estritamente pedagógico.
4. Didática: Utilize terminologia técnica correta do CSM, mas explique de forma que um aluno de curso técnico compreenda facilmente.
5. Formatos: Se solicitado um Mapa Mental, use uma estrutura textual organizada. Para Estudos de Caso, foque na prática humanizada.
6. APROFUNDAMENTO (OBRIGATÓRIO): Ao final de TODA resposta, adicione uma seção chamada "🚀 Para Aprofundar" com 2 ou 3 sugestões de tópicos relacionados, termos técnicos avançados ou correlações clínicas para que o aluno possa ampliar seu repertório.
7. FUNDAMENTAÇÃO TEÓRICA E ORIENTAÇÃO (OBRIGATÓRIO): Ao final de toda resposta didática/teórica, inclua obrigatoriamente uma seção curta chamada "📚 Referências Recomendadas" citando livros clássicos da enfermagem ou diretrizes oficiais brasileiras (ex: Ministério da Saúde, resoluções do COFEN/COREN) que embasam a resposta. Adicione também a mensagem de alerta destacada: "⚠️ Nota pedagógica: Aluno, lembre-se sempre de diversificar suas fontes de consulta e estudo para enriquecer seus conhecimentos!".

Ao iniciar, dê as boas-vindas ao aluno do CSM e pergunte em qual disciplina ou tema técnico ele precisa de suporte hoje.`;

// Lista de palavras e padrões suspeitos para detecção de Prompt Injection (Jailbreak)
const INJECTION_PATTERNS = [
  /(?:ignore|desconsidere|esqueça|cancelar|ignorar|ignore|bypass|override|forget)\b.*\b(?:instruç|regr|diretriz|prompt|sistema|anterior|system|rules)/i,
  /(?:você|voce|you)\b.*\b(?:não é mais|nao e mais|deixou de ser|is no longer)\b.*\b(?:tutor|csm)/i,
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

  // 1. Prepare messages in OpenAI/Groq Chat format
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
Este conteúdo é para um aluno do curso técnico da CSM Educação. Foque em excelência técnica e cuidado humanizado. 
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

  // 2. Fetch Groq API
  const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const requestBody: any = {
    model: 'llama-3.3-70b-versatile',
    messages: messages,
    temperature: temperature
  };

  // If json formatting is requested, ask Groq for JSON output format
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
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada no Supabase." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
        error: "Ação bloqueada por motivos de segurança. Por favor, utilize o EnfAssist apenas para fins educacionais e evite comandos de reprogramação do sistema." 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Montagem da chamada para a API do Gemini
    let contents = [];
    let responseMimeType = "text/plain";
    let temperature = 0.7;

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
      responseMimeType = "application/json";
      temperature = 0.5;

    } else if (action === 'generateStudyContent') {
      const sanitizedTopic = sanitizeInput(topic);
      const prompt = `Gere um ${format} sobre o tema: <student_query>${sanitizedTopic}</student_query>. 
Este conteúdo é para um aluno do curso técnico da CSM Educação. Foque em excelência técnica e cuidado humanizado. 
Ao final, inclua a seção "Para Aprofundar" com temas correlatos.`;

      // Converte o histórico para o formato do Gemini
      const formattedHistory = history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.role === 'user' ? `<student_query>${sanitizeInput(msg.content)}</student_query>` : msg.content }]
      }));

      contents = [...formattedHistory, { role: 'user', parts: [{ text: prompt }] }];

    } else if (action === 'chat') {
      // Converte o histórico inteiro
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

    // 3. Execução da chamada HTTP para a API do Gemini com Fallback para Groq
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

    let responseText = '';
    let usedFallback = false;

    try {
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
    } catch (geminiError: any) {
      console.warn("Gemini falhou. Tentando fallback para Groq...", geminiError.message);
      
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
          usedFallback = true;
          console.info("Fallback para Groq concluído com sucesso!");
        } catch (groqError: any) {
          console.error("Fallback para Groq também falhou:", groqError.message);
          return new Response(JSON.stringify({ 
            error: "Erro na API do Gemini (e o fallback para Groq também falhou)", 
            details: geminiError.message,
            groqDetails: groqError.message
          }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else {
        return new Response(JSON.stringify({ 
          error: "Erro na API do Gemini", 
          details: geminiError.message 
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ text: responseText, fallback: usedFallback }), {
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
