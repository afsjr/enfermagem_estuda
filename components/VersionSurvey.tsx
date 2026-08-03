import React, { useState, useEffect } from 'react';
import { telemetry } from '../telemetryService';
import { supabase } from '../supabaseClient';

interface VersionSurveyProps {
  darkMode?: boolean;
  onNavigate: (view: string) => void;
}

interface SurveyResponse {
  id: string;
  timestamp: string;
  preferredVersion: 'A' | 'B' | null;
  answers: {
    findContent: 'A' | 'B' | 'equal' | null;
    confidence: 'A' | 'B' | 'equal' | null;
    motivation: 'A' | 'B' | 'equal' | null;
  };
  freeText: string;
  studentModule: string;
}

const VersionSurvey: React.FC<VersionSurveyProps> = ({ darkMode, onNavigate }) => {
  const [step, setStep] = useState<'intro' | 'compare' | 'questions' | 'thanks'>('intro');
  const [preferredVersion, setPreferredVersion] = useState<'A' | 'B' | null>(null);
  const [answers, setAnswers] = useState<SurveyResponse['answers']>({
    findContent: null,
    confidence: null,
    motivation: null,
  });
  const [freeText, setFreeText] = useState('');
  const [studentModule, setStudentModule] = useState('');
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [allResponses, setAllResponses] = useState<SurveyResponse[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbVotesA, setDbVotesA] = useState(0);
  const [dbVotesB, setDbVotesB] = useState(0);
  const [dbTotalVotes, setDbTotalVotes] = useState(0);

  useEffect(() => {
    const voted = localStorage.getItem('monicai_survey_voted');
    if (voted === 'true') {
      setAlreadyVoted(true);
    }
    const saved = localStorage.getItem('monicai_survey_responses');
    if (saved) {
      try {
        setAllResponses(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    
    fetchSupabaseStats();
  }, []);

  const fetchSupabaseStats = async () => {
    try {
      // We do a simple count for each version to avoid downloading all rows if it gets large
      const { count: countA } = await supabase
        .from('version_survey')
        .select('*', { count: 'exact', head: true })
        .eq('preferred_version', 'A');
        
      const { count: countB } = await supabase
        .from('version_survey')
        .select('*', { count: 'exact', head: true })
        .eq('preferred_version', 'B');

      if (countA !== null && countB !== null) {
        setDbVotesA(countA);
        setDbVotesB(countB);
        setDbTotalVotes(countA + countB);
      }
    } catch (err) {
      console.error('Failed to fetch survey stats from Supabase', err);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const response: SurveyResponse = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      preferredVersion,
      answers,
      freeText,
      studentModule,
    };

    // Save to local storage for backup and local state
    const updated = [...allResponses, response];
    setAllResponses(updated);
    localStorage.setItem('monicai_survey_responses', JSON.stringify(updated));
    localStorage.setItem('monicai_survey_voted', 'true');
    setAlreadyVoted(true);

    // Send to Supabase
    try {
      await supabase.from('version_survey').insert([
        {
          preferred_version: preferredVersion,
          find_content: answers.findContent,
          confidence: answers.confidence,
          motivation: answers.motivation,
          free_text: freeText,
          student_module: studentModule
        }
      ]);
      // Update local counters for immediate feedback
      if (preferredVersion === 'A') setDbVotesA(prev => prev + 1);
      if (preferredVersion === 'B') setDbVotesB(prev => prev + 1);
      setDbTotalVotes(prev => prev + 1);
    } catch (err) {
      console.error('Failed to save to Supabase:', err);
    }

    setStep('thanks');
    setIsSubmitting(false);

    // Log survey event via telemetry
    telemetry.logEvent({
      actionType: 'survey_completed',
      screenName: 'version_survey',
      actionDetail: `Preferred: ${preferredVersion} | Module: ${studentModule}`,
    });
  };

  const handleExportResults = () => {
    const blob = new Blob([JSON.stringify(allResponses, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `monicai_pesquisa_versoes_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetVote = () => {
    localStorage.removeItem('monicai_survey_voted');
    setAlreadyVoted(false);
    setStep('intro');
    setPreferredVersion(null);
    setAnswers({ findContent: null, confidence: null, motivation: null });
    setFreeText('');
    setStudentModule('');
  };

  const cardClass = `rounded-2xl border transition-all shadow-sm ${
    darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-slate-200'
  }`;

  const optionBtnClass = (selected: boolean) =>
    `px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 ${
      selected
        ? 'bg-[#b22222] text-white border-[#b22222] shadow-md scale-105'
        : darkMode
          ? 'bg-[#252525] text-slate-300 border-[#444] hover:border-[#b22222] hover:bg-[#2d2d2d]'
          : 'bg-white text-slate-600 border-slate-200 hover:border-[#b22222] hover:bg-slate-50'
    }`;

  // Aggregated results - Use DB values if available, fallback to local responses
  const totalVotes = dbTotalVotes > 0 ? dbTotalVotes : allResponses.length;
  const votesA = dbTotalVotes > 0 ? dbVotesA : allResponses.filter(r => r.preferredVersion === 'A').length;
  const votesB = dbTotalVotes > 0 ? dbVotesB : allResponses.filter(r => r.preferredVersion === 'B').length;
  const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 0;
  const percentB = totalVotes > 0 ? Math.round((votesB / totalVotes) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 w-full max-w-full overflow-y-auto h-full pb-20 lg:pb-6">
      
      {/* Header */}
      <section className={`relative overflow-hidden bg-gradient-to-br from-[#b22222] via-[#d44444] to-[#ff6b6b] p-6 md:p-8 rounded-3xl shadow-xl text-white`}>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-yellow-400 opacity-15 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center space-y-3">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border border-white/30 shadow-lg">
            <i className="fas fa-poll text-3xl"></i>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Pesquisa de Preferência de Interface
          </h2>
          <p className="text-sm md:text-base font-medium opacity-90 max-w-xl mx-auto leading-relaxed">
            Sua opinião é essencial! Estamos testando duas versões da tela inicial do MonicAI e queremos saber qual você prefere.
          </p>
          {totalVotes > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/20">
                <i className="fas fa-users mr-1"></i> {totalVotes} {totalVotes === 1 ? 'resposta' : 'respostas'} coletada{totalVotes === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Already voted state */}
      {alreadyVoted && step !== 'thanks' ? (
        <section className={`${cardClass} p-6 md:p-8 text-center space-y-5`}>
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <i className="fas fa-check-circle text-4xl text-emerald-500"></i>
          </div>
          <h3 className="text-xl font-black">Você já respondeu! 🎉</h3>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Obrigado pela sua participação. Seu voto já foi registrado neste dispositivo.
          </p>

          {/* Show Results */}
          <button 
            onClick={() => setShowResults(!showResults)}
            className="px-6 py-3 bg-[#b22222] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8b0000] transition-all shadow-md"
          >
            <i className={`fas ${showResults ? 'fa-eye-slash' : 'fa-chart-bar'} mr-2`}></i>
            {showResults ? 'Ocultar Resultados' : 'Ver Resultados Parciais'}
          </button>

          {showResults && totalVotes > 0 && (
            <div className="space-y-4 pt-4 border-t dark:border-[#333]">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-600 dark:text-blue-400">Versão A (Chat Direto)</span>
                    <span>{percentA}% ({votesA})</span>
                  </div>
                  <div className={`w-full h-4 rounded-full overflow-hidden ${darkMode ? 'bg-[#333]' : 'bg-slate-200'}`}>
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700" style={{ width: `${percentA}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-purple-600 dark:text-purple-400">Versão B (Painel Inicial)</span>
                    <span>{percentB}% ({votesB})</span>
                  </div>
                  <div className={`w-full h-4 rounded-full overflow-hidden ${darkMode ? 'bg-[#333]' : 'bg-slate-200'}`}>
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700" style={{ width: `${percentB}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <button
              onClick={handleResetVote}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                darkMode ? 'border-[#444] text-slate-400 hover:bg-[#252525]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <i className="fas fa-redo mr-1.5"></i> Votar Novamente
            </button>
            {allResponses.length > 0 && (
              <button
                onClick={handleExportResults}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  darkMode ? 'border-[#444] text-slate-400 hover:bg-[#252525]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <i className="fas fa-download mr-1.5"></i> Exportar Respostas (JSON)
              </button>
            )}
          </div>
        </section>
      ) : step === 'intro' ? (
        /* STEP 1: Introduction */
        <section className={`${cardClass} p-6 md:p-8 text-center space-y-6`}>
          <div className="space-y-3">
            <h3 className="text-lg font-black">Como funciona?</h3>
            <p className={`text-sm font-medium leading-relaxed max-w-lg mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Vamos te mostrar as <strong>duas versões</strong> da tela inicial do MonicAI. Depois, faremos <strong>3 perguntas rápidas</strong> sobre sua experiência. Leva menos de <strong>2 minutos</strong>!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-[#252525]' : 'bg-slate-50'}`}>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2 text-lg">
                <i className="fas fa-eye"></i>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Passo 1</span>
              <p className="text-xs font-semibold mt-1">Visualize as 2 versões</p>
            </div>
            <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-[#252525]' : 'bg-slate-50'}`}>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 text-lg">
                <i className="fas fa-hand-pointer"></i>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Passo 2</span>
              <p className="text-xs font-semibold mt-1">Escolha a preferida</p>
            </div>
            <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-[#252525]' : 'bg-slate-50'}`}>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 text-lg">
                <i className="fas fa-comment-dots"></i>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Passo 3</span>
              <p className="text-xs font-semibold mt-1">Responda 3 perguntas</p>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Qual módulo/semestre você está cursando?
            </label>
            <input
              type="text"
              value={studentModule}
              onChange={(e) => setStudentModule(e.target.value)}
              placeholder="Ex: 1º módulo, 3º semestre..."
              className={`w-full max-w-sm mx-auto block px-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none focus:border-[#b22222] focus:ring-1 focus:ring-[#b22222] transition-all ${
                darkMode
                  ? 'bg-[#252525] border-[#444] text-white placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <button
            onClick={() => setStep('compare')}
            className="px-8 py-3.5 bg-[#b22222] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#8b0000] transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            Começar Avaliação <i className="fas fa-arrow-right ml-2"></i>
          </button>
        </section>
      ) : step === 'compare' ? (
        /* STEP 2: Compare versions side by side */
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-black">Compare as duas versões</h3>
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Toque em cada versão para experimentá-la. Depois, escolha a sua favorita abaixo.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Version A: Chat-first */}
            <div 
              className={`${cardClass} overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl ${
                preferredVersion === 'A' ? 'ring-4 ring-[#b22222] ring-offset-2 dark:ring-offset-[#121212]' : ''
              }`}
              onClick={() => setPreferredVersion('A')}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-black text-lg">A</div>
                  <div>
                    <h4 className="font-bold text-sm">Versão A — Chat Direto</h4>
                    <p className="text-[10px] opacity-80">Abre direto no chat com sugestões de temas</p>
                  </div>
                </div>
                {preferredVersion === 'A' && (
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-blue-600"></i>
                  </div>
                )}
              </div>
              <div className={`p-5 space-y-4 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-slate-50'}`}>
                {/* Mock of the Chat-first view */}
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#b22222] to-[#ff4d4d] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <i className="fas fa-stethoscope text-2xl text-white"></i>
                  </div>
                  <h4 className={`text-lg font-black mb-1 ${darkMode ? 'text-white' : 'text-[#b22222]'}`}>Como posso ajudar hoje?</h4>
                  <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Sou o MonicAI. Escolha um tema ou digite sua dúvida.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                    {['Sinais Vitais', 'Medicamentos', 'Anotação de Enf.', 'Primeiros Socorros'].map((t, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-xl border text-left text-[10px] font-bold ${
                          darkMode ? 'bg-[#252525] border-[#333] text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <i className={`fas ${['fa-heartbeat','fa-syringe','fa-file-medical','fa-hands-helping'][i]} text-[#b22222] dark:text-[#ff8888] mb-1 block text-sm`}></i>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 py-2.5 px-4 rounded-full border text-xs ${darkMode ? 'bg-[#252525] border-[#333] text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
                    Pergunte ao MonicAI...
                  </div>
                  <div className="w-8 h-8 bg-[#b22222] rounded-full flex items-center justify-center">
                    <i className="fas fa-arrow-up text-white text-xs"></i>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t dark:border-[#333] flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <i className="fas fa-info-circle mr-1"></i> Você vai direto para o chat
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onNavigate('tutor'); }}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-all"
                >
                  <i className="fas fa-external-link-alt mr-1"></i> Experimentar
                </button>
              </div>
            </div>

            {/* Version B: Dashboard */}
            <div 
              className={`${cardClass} overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl ${
                preferredVersion === 'B' ? 'ring-4 ring-[#b22222] ring-offset-2 dark:ring-offset-[#121212]' : ''
              }`}
              onClick={() => setPreferredVersion('B')}
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-black text-lg">B</div>
                  <div>
                    <h4 className="font-bold text-sm">Versão B — Painel Inicial</h4>
                    <p className="text-[10px] opacity-80">Painel completo com disciplinas e ferramentas</p>
                  </div>
                </div>
                {preferredVersion === 'B' && (
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <i className="fas fa-check text-purple-600"></i>
                  </div>
                )}
              </div>
              <div className={`p-5 space-y-3 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-slate-50'}`}>
                {/* Mock of the Dashboard view */}
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 rounded-xl p-4 text-white">
                  <h4 className="font-black text-sm">Bem-vindo ao MonicAI</h4>
                  <p className="text-[10px] opacity-80 mt-0.5">Sua preceptoria digital interativa</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-white/15 rounded-full text-[8px] font-bold">🏆 Nível 1</span>
                    <span className="px-2 py-0.5 bg-white/15 rounded-full text-[8px] font-bold">⚡ XP</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: 'fa-clipboard-list', label: 'Protocolos', color: 'text-blue-500' },
                    { icon: 'fa-calculator', label: 'Cálculos', color: 'text-emerald-500' },
                    { icon: 'fa-check-double', label: 'Quiz', color: 'text-purple-500' },
                    { icon: 'fa-heartbeat', label: 'Escalas', color: 'text-red-500' },
                  ].map((t, i) => (
                    <div key={i} className={`p-2 rounded-lg border text-center ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'}`}>
                      <i className={`fas ${t.icon} ${t.color} text-sm block mb-1`}></i>
                      <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">{t.label}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['Fundamentos', 'Farmacologia'].map((d, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'}`}>
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${i === 0 ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600'} text-white flex items-center justify-center mb-1`}>
                        <i className={`fas ${i === 0 ? 'fa-user-nurse' : 'fa-pills'} text-[9px]`}></i>
                      </div>
                      <span className="text-[10px] font-bold block">{d}</span>
                      <span className="text-[8px] opacity-50">Estudar Tópico →</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t dark:border-[#333] flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <i className="fas fa-info-circle mr-1"></i> Visão geral antes do chat
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onNavigate('dashboard'); }}
                  className="px-3 py-1.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-purple-200 dark:hover:bg-purple-500/20 transition-all"
                >
                  <i className="fas fa-external-link-alt mr-1"></i> Experimentar
                </button>
              </div>
            </div>
          </div>

          {/* Selection confirmation */}
          <div className="text-center space-y-4">
            {preferredVersion && (
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full ${
                darkMode ? 'bg-[#252525] border border-[#444]' : 'bg-slate-100 border border-slate-200'
              }`}>
                <i className="fas fa-check-circle text-emerald-500"></i>
                <span className="text-xs font-bold">
                  Você escolheu a <strong>Versão {preferredVersion}</strong> — {preferredVersion === 'A' ? 'Chat Direto' : 'Painel Inicial'}
                </span>
              </div>
            )}

            <div>
              <button
                onClick={() => setStep('questions')}
                disabled={!preferredVersion}
                className="px-8 py-3.5 bg-[#b22222] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#8b0000] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                Continuar para as Perguntas <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        </section>
      ) : step === 'questions' ? (
        /* STEP 3: Qualitative questions */
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-black">Perguntas Qualitativas</h3>
            <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Responda com base na sua experiência ao explorar as duas versões.
            </p>
          </div>

          {/* Question 1: Find Content */}
          <div className={`${cardClass} p-5 md:p-6 space-y-4`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-black shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-sm">Em qual versão você encontrou mais rápido o conteúdo que queria?</h4>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pense em quando precisou achar uma disciplina ou ferramenta.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-11">
              <button className={optionBtnClass(answers.findContent === 'A')} onClick={() => setAnswers(p => ({ ...p, findContent: 'A' }))}>
                <i className="fas fa-comment-medical mr-1.5"></i> Versão A (Chat)
              </button>
              <button className={optionBtnClass(answers.findContent === 'B')} onClick={() => setAnswers(p => ({ ...p, findContent: 'B' }))}>
                <i className="fas fa-th-large mr-1.5"></i> Versão B (Painel)
              </button>
              <button className={optionBtnClass(answers.findContent === 'equal')} onClick={() => setAnswers(p => ({ ...p, findContent: 'equal' }))}>
                <i className="fas fa-equals mr-1.5"></i> Igual
              </button>
            </div>
          </div>

          {/* Question 2: Confidence */}
          <div className={`${cardClass} p-5 md:p-6 space-y-4`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-black shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-sm">Qual versão te passou mais confiança e profissionalismo?</h4>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Qual pareceu mais "completa" e adequada para um app de enfermagem?
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-11">
              <button className={optionBtnClass(answers.confidence === 'A')} onClick={() => setAnswers(p => ({ ...p, confidence: 'A' }))}>
                <i className="fas fa-comment-medical mr-1.5"></i> Versão A (Chat)
              </button>
              <button className={optionBtnClass(answers.confidence === 'B')} onClick={() => setAnswers(p => ({ ...p, confidence: 'B' }))}>
                <i className="fas fa-th-large mr-1.5"></i> Versão B (Painel)
              </button>
              <button className={optionBtnClass(answers.confidence === 'equal')} onClick={() => setAnswers(p => ({ ...p, confidence: 'equal' }))}>
                <i className="fas fa-equals mr-1.5"></i> Igual
              </button>
            </div>
          </div>

          {/* Question 3: Motivation */}
          <div className={`${cardClass} p-5 md:p-6 space-y-4`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-black shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-sm">Qual versão te motivou mais a continuar estudando?</h4>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Qual fez você sentir mais vontade de explorar o app?
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-11">
              <button className={optionBtnClass(answers.motivation === 'A')} onClick={() => setAnswers(p => ({ ...p, motivation: 'A' }))}>
                <i className="fas fa-comment-medical mr-1.5"></i> Versão A (Chat)
              </button>
              <button className={optionBtnClass(answers.motivation === 'B')} onClick={() => setAnswers(p => ({ ...p, motivation: 'B' }))}>
                <i className="fas fa-th-large mr-1.5"></i> Versão B (Painel)
              </button>
              <button className={optionBtnClass(answers.motivation === 'equal')} onClick={() => setAnswers(p => ({ ...p, motivation: 'equal' }))}>
                <i className="fas fa-equals mr-1.5"></i> Igual
              </button>
            </div>
          </div>

          {/* Free text feedback */}
          <div className={`${cardClass} p-5 md:p-6 space-y-4`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-pen-fancy"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">Quer deixar algum comentário? (opcional)</h4>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Pode ser uma sugestão, elogio ou crítica construtiva.
                </p>
              </div>
            </div>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Escreva aqui o que achou..."
              rows={3}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 text-sm font-medium focus:outline-none focus:border-[#b22222] focus:ring-1 focus:ring-[#b22222] transition-all resize-none ${
                darkMode
                  ? 'bg-[#252525] border-[#444] text-white placeholder-slate-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Submit */}
          <div className="text-center space-y-3">
            <button
              onClick={handleSubmit}
              disabled={!answers.findContent || !answers.confidence || !answers.motivation || isSubmitting}
              className="px-10 py-4 bg-[#b22222] text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-[#8b0000] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i> Enviando...</>
              ) : (
                <><i className="fas fa-paper-plane mr-2"></i> Enviar Minha Avaliação</>
              )}
            </button>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              {(!answers.findContent || !answers.confidence || !answers.motivation) 
                ? 'Responda todas as 3 perguntas para enviar' 
                : '✓ Pronto para enviar!'}
            </p>
          </div>
        </section>
      ) : step === 'thanks' ? (
        /* STEP 4: Thank you */
        <section className={`${cardClass} p-8 md:p-12 text-center space-y-6`}>
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl animate-[bounceIn_0.5s_ease-out]">
            <i className="fas fa-heart text-5xl text-white"></i>
          </div>
          <h3 className="text-2xl font-black">Obrigado pela sua opinião! 💚</h3>
          <p className={`text-sm font-medium max-w-md mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Sua avaliação é muito importante para melhorar o MonicAI. Vamos usar o feedback de todos os estudantes para decidir qual versão fica como padrão.
          </p>

          {/* Show aggregated results */}
          {totalVotes > 0 && (
            <div className={`max-w-sm mx-auto p-5 rounded-2xl ${darkMode ? 'bg-[#252525]' : 'bg-slate-50'} space-y-3`}>
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">Resultado parcial</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-600 dark:text-blue-400">Versão A (Chat)</span>
                    <span>{percentA}%</span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-[#333]' : 'bg-slate-200'}`}>
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${percentA}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-purple-600 dark:text-purple-400">Versão B (Painel)</span>
                    <span>{percentB}%</span>
                  </div>
                  <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-[#333]' : 'bg-slate-200'}`}>
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000" style={{ width: `${percentB}%` }}></div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] opacity-50 font-semibold">{totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} registrado{totalVotes === 1 ? '' : 's'} no total</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <button 
              onClick={() => onNavigate('tutor')}
              className="px-6 py-3 bg-[#b22222] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8b0000] transition-all shadow-md"
            >
              <i className="fas fa-stethoscope mr-2"></i> Ir para o Chat
            </button>
            <button 
              onClick={() => onNavigate('dashboard')}
              className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md border-2 ${
                darkMode ? 'border-[#444] text-slate-300 hover:bg-[#252525]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <i className="fas fa-th-large mr-2"></i> Ir para o Painel
            </button>
          </div>

          {allResponses.length > 0 && (
            <button
              onClick={handleExportResults}
              className={`text-[10px] font-bold uppercase tracking-wider transition-all ${
                darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className="fas fa-download mr-1"></i> Exportar todas as respostas (professor)
            </button>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default VersionSurvey;
