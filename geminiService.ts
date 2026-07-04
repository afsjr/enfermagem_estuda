import { StudyFormat, Message } from "./types";
import { sanitizeInput, detectPromptInjection } from "./security";

export class GeminiService {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn('VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas. Certifique-se de configurar as variáveis no arquivo .env local.');
    }
  }

  private async invokeProxy(body: object): Promise<string> {
    const isPlaceholder = 
      !this.supabaseUrl || 
      !this.supabaseAnonKey || 
      this.supabaseUrl.includes('seu-projeto') || 
      this.supabaseAnonKey.includes('sua_chave_anon_publica');

    if (isPlaceholder) {
      throw new Error('Supabase não configurado. Por favor, acesse o arquivo .env e substitua os valores fictícios (URL e Chave Anon) pelos dados reais do seu projeto Supabase.');
    }

    let response: Response;
    try {
      response = await fetch(`${this.supabaseUrl}/functions/v1/csm-tutor-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseAnonKey}`
        },
        body: JSON.stringify(body)
      });
    } catch (netErr) {
      console.error(netErr);
      throw new Error('Falha na conexão de rede. Verifique se o seu computador está conectado à internet ou se a URL do Supabase está correta.');
    }

    let data: any = {};
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        data = { error: rawText };
      }
    } catch (parseErr) {
      console.error(parseErr);
      data = { error: 'Não foi possível ler os dados retornados pelo servidor.' };
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Função "csm-tutor-proxy" não encontrada no Supabase. Certifique-se de que fez o deploy da Edge Function rodando no terminal: "supabase functions deploy csm-tutor-proxy --no-verify-jwt".');
      }
      throw new Error(data.error || `Erro do servidor (Código de Status: ${response.status}).`);
    }

    return data.text || '';
  }

  async generateStudyContent(topic: string, format: StudyFormat, history: Message[] = []): Promise<string> {
    const sanitizedTopic = sanitizeInput(topic);
    
    if (detectPromptInjection(sanitizedTopic)) {
      throw new Error('Detecção de segurança: Prompt Injection identificado no tema de estudo.');
    }

    const sanitizedHistory = history.map(msg => {
      if (msg.role === 'user' && detectPromptInjection(msg.content)) {
        throw new Error('Detecção de segurança: Prompt Injection identificado no histórico.');
      }
      return {
        ...msg,
        content: msg.role === 'user' ? sanitizeInput(msg.content) : msg.content
      };
    });

    return this.invokeProxy({
      action: 'generateStudyContent',
      topic: sanitizedTopic,
      format,
      history: sanitizedHistory
    });
  }

  async chat(history: Message[]): Promise<string> {
    const sanitizedHistory = history.map(msg => {
      if (msg.role === 'user' && detectPromptInjection(msg.content)) {
        throw new Error('Detecção de segurança: Prompt Injection identificado na sua mensagem.');
      }
      return {
        ...msg,
        content: msg.role === 'user' ? sanitizeInput(msg.content) : msg.content
      };
    });

    return this.invokeProxy({
      action: 'chat',
      history: sanitizedHistory
    });
  }

  async generateQuizJson(topic: string): Promise<string> {
    const sanitizedTopic = sanitizeInput(topic);

    if (detectPromptInjection(sanitizedTopic)) {
      throw new Error('Detecção de segurança: Prompt Injection identificado no tema do quiz.');
    }

    return this.invokeProxy({
      action: 'generateQuizJson',
      topic: sanitizedTopic
    });
  }
}
