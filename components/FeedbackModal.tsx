import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface FeedbackModalProps {
  onClose: () => void;
  darkMode: boolean;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose, darkMode }) => {
  const [type, setType] = useState<'sugestao' | 'bug'>('sugestao');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sanitizeInput = (str: string) => {
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const safeMessage = sanitizeInput(message.trim());

    try {
      const { error: dbError } = await supabase
        .from('feedbacks')
        .insert([{ type, message: safeMessage }]);

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3500);
    } catch (err: any) {
      console.error('Erro ao enviar feedback:', err);
      setError('Ocorreu um erro ao enviar. Verifique se configurou o banco corretamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl overflow-hidden border ${
        darkMode ? 'bg-[#1a1a1a] border-[#333] text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Enfeites visuais / Glassmorphism */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-[#b22222] opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 bg-[#FFCC00] opacity-10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-3xl mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            💡
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider mb-2 text-center">Deixe sua Sugestão</h2>
          <p className={`text-center text-sm font-medium mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Encontrou um erro ou tem uma ideia para melhorar o app? Conta pra gente!
          </p>

          {success ? (
            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-6 rounded-2xl text-center w-full animate-in zoom-in duration-500 shadow-sm border border-emerald-200 dark:border-emerald-800/50">
              <i className="fas fa-check-circle text-4xl mb-4 block"></i>
              <p className="font-black uppercase tracking-wide text-lg mb-2">Muito Obrigado!</p>
              <p className="text-sm font-medium">Sua sugestão foi enviada com sucesso e nos ajudará a melhorar o app.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('sugestao')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold uppercase tracking-wider border-2 transition-all ${
                    type === 'sugestao'
                      ? 'border-[#b22222] bg-[#b22222]/10 text-[#b22222] dark:text-[#ff8888]'
                      : 'border-slate-200 dark:border-[#333] text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252525]'
                  }`}
                >
                  <i className="fas fa-lightbulb mr-2"></i>Sugestão
                </button>
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold uppercase tracking-wider border-2 transition-all ${
                    type === 'bug'
                      ? 'border-[#b22222] bg-[#b22222]/10 text-[#b22222] dark:text-[#ff8888]'
                      : 'border-slate-200 dark:border-[#333] text-slate-400 hover:bg-slate-50 dark:hover:bg-[#252525]'
                  }`}
                >
                  <i className="fas fa-bug mr-2"></i>Erro/Bug
                </button>
              </div>

              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Descreva aqui sua sugestão ou o problema que encontrou..."
                  className={`w-full h-32 p-4 rounded-xl border-2 focus:outline-none focus:border-[#b22222] resize-none transition-all ${
                    darkMode 
                      ? 'bg-[#252525] border-[#444] text-white placeholder-slate-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                  }`}
                  required
                ></textarea>
              </div>

              {error && (
                <div className="text-red-500 text-xs font-bold text-center bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                  <i className="fas fa-exclamation-triangle mr-1"></i> {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all ${
                    darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="flex-1 py-3 bg-[#b22222] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg hover:bg-[#8b0000] disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <span className="animate-spin mr-2"><i className="fas fa-spinner"></i></span>
                  ) : (
                    <i className="fas fa-paper-plane mr-2"></i>
                  )}
                  Enviar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
