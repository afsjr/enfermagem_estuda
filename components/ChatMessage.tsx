
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  darkMode?: boolean;
  onTopicClick?: (topic: string) => void;
  onAddToNotes?: (content: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, darkMode, onTopicClick, onAddToNotes }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MonicAI - Dica de Estudo',
          text: message.content,
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      copyToClipboard();
      alert('Texto copiado para a área de transferência!');
    }
  };

  // Function to parse content and make depth suggestions clickable
  const renderContent = (text: string) => {
    if (!isAssistant || !text.includes('🚀 Para Aprofundar')) {
      return <ReactMarkdown>{text}</ReactMarkdown>;
    }

    const parts = text.split('🚀 Para Aprofundar');
    const mainText = parts[0];
    const deepDiveText = parts[1];

    // Simple regex to find lines starting with number or dash that look like topics
    const topics = deepDiveText.split('\n').filter(line => line.trim().length > 0);

    return (
      <>
        <ReactMarkdown>{mainText}</ReactMarkdown>
        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
          <div className="flex items-center gap-2 mb-2 font-bold text-[#b22222]">
            <span>🚀 Para Aprofundar</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic, idx) => {
              // Clean common list markers
              const cleanTopic = topic.replace(/^[0-9.\-\s*]+/, '').trim();
              if (cleanTopic.length < 3) return null;
              
              return (
                <button
                  key={idx}
                  onClick={() => onTopicClick?.(cleanTopic)}
                  className={`text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    darkMode 
                    ? 'bg-[#333] border-[#444] text-[#FFCC00] hover:bg-[#444]' 
                    : 'bg-white border-[#b22222]/20 text-[#b22222] hover:bg-[#b22222]/5 hover:border-[#b22222]'
                  }`}
                >
                  <i className="fas fa-search mr-2 opacity-60"></i>
                  {cleanTopic}
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`flex w-full mb-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div className={`relative group max-w-[95%] sm:max-w-[85%] rounded-2xl p-4 shadow-sm border transition-all duration-300 ${
        isAssistant 
        ? darkMode 
          ? 'bg-[#252525] border-[#333] text-slate-200' 
          : 'bg-white border-slate-200 text-slate-800' 
        : 'bg-[#b22222] text-white border-[#8b0000]'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${isAssistant ? (darkMode ? 'bg-[#333]' : 'bg-[#f0f4f8]') : 'bg-[#FFCC00]'}`}>
              <i className={`fas ${isAssistant ? 'fa-robot text-[#b22222]' : 'fa-user-graduate text-[#003366]'} text-[10px]`}></i>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${isAssistant && darkMode ? 'text-[#FFCC00]' : ''}`}>
              {isAssistant ? 'MonicAI' : 'Aluno SM'}
            </span>
          </div>
          
          <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            {isAssistant && onAddToNotes && (
              <button 
                onClick={() => onAddToNotes(message.content)}
                className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded hover:bg-black/10 text-[10px] gap-1 ${isAssistant ? 'text-slate-455 hover:text-emerald-500' : 'text-white/60'}`}
                title="Salvar nas Notas"
              >
                <i className="fas fa-file-signature"></i>
              </button>
            )}
            <button 
              onClick={handleShare}
              className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded hover:bg-black/10 text-[10px] gap-1 ${isAssistant ? 'text-slate-400' : 'text-white/60'}`}
              title="Compartilhar"
            >
              <i className="fas fa-share-alt"></i>
            </button>
            <button 
              onClick={copyToClipboard}
              className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded hover:bg-black/10 text-[10px] gap-1 ${isAssistant ? 'text-slate-400' : 'text-white/60'}`}
              title="Copiar"
            >
              <i className={`fas ${copied ? 'fa-check text-green-500' : 'fa-copy'}`}></i>
            </button>
          </div>
        </div>

        <div className={`chat-prose max-w-none text-[0.875rem] sm:text-base leading-relaxed font-medium ${darkMode && isAssistant ? 'chat-prose-dark' : ''}`}>
          {renderContent(message.content)}
        </div>
        
        <div className="mt-3 text-[10px] sm:text-[9px] opacity-40 text-right font-bold tracking-tighter">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
