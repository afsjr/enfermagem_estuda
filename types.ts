
export enum StudyFormat {
  GUIDE = 'Guia de Estudo',
  CASE = 'Estudo de Caso',
  MINDMAP = 'Mapa Mental (Texto)',
  SUMMARY = 'Resumo Detalhado',
  QUIZ = 'Quiz de Revisão'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  format?: StudyFormat;
  timestamp: Date;
}

export interface ChatState {
  topic?: string;
  format?: StudyFormat;
  isGenerating: boolean;
}
