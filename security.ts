/**
 * Utilitário de segurança para prevenção de Prompt Injection e sanitização de dados no EnfAssist.
 */

// Lista de palavras e padrões suspeitos para detecção de Prompt Injection (Jailbreak)
const INJECTION_PATTERNS = [
  // Tentativas comuns de ignorar instruções
  /(?:ignore|desconsidere|esqueça|cancelar|ignorar|ignore|bypass|override|forget)\b.*\b(?:instruç|regr|diretriz|prompt|sistema|anterior|system|rules)/i,
  
  // Tentativas de mudar o papel do bot
  /(?:você|voce|you)\b.*\b(?:não é mais|nao e mais|deixou de ser|is no longer)\b.*\b(?:tutor|csm)/i,
  /(?:você|voce|you)\b.*\b(?:agora é|agora e|seja|aja como|act as|are now)\b.*\b(?:hacker|desenvolvedor|prompt|outro|outra|assistente virtual genérico|terminal|shell|linux)/i,
  
  // Tentativas de simular tags do sistema ou logs de conversas
  /\[(?:system|instruction|prompt|user|assistant|assistant_instruction|admin)\]/i,
  /<(?:system|instruction|prompt|user|assistant)>/i,
  
  // Acessos suspeitos a parâmetros do sistema
  /(?:instrução do sistema|system instruction|prompt de sistema|revelar seu prompt|me diga seu prompt)/i
];

/**
 * Sanitiza o texto de entrada do usuário para remover caracteres estruturais suspeitos
 * e prevenir que o modelo interprete o input como tags ou comandos de formatação do prompt.
 */
export function sanitizeInput(text: string): string {
  if (!text) return '';
  
  let sanitized = text;
  
  // 1. Remove colchetes de tags de sistema conhecidas para evitar injeções baseadas em formato (ex: [SYSTEM])
  sanitized = sanitized.replace(/\[\s*(system|instruction|prompt|user|assistant|admin)\s*\]/gi, '');
  
  // 2. Remove tags HTML/XML simuladas que podem confundir o parser de prompt
  sanitized = sanitized.replace(/<\/?\s*(system|instruction|prompt|user|assistant|student_query)\s*>/gi, '');
  
  // 3. Limita o tamanho do texto para evitar ataques de buffer/excesso de contexto no prompt (máx. 1000 caracteres)
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  return sanitized.trim();
}

/**
 * Analisa o texto e retorna verdadeiro se for detectada uma tentativa clara de Prompt Injection.
 */
export function detectPromptInjection(text: string): boolean {
  if (!text) return false;
  
  const normalizedText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos para comparação
  
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalizedText) || pattern.test(text)) {
      return true;
    }
  }
  
  return false;
}
