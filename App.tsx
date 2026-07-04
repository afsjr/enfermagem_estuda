import React, { useState, useRef, useEffect } from 'react';
import { StudyFormat, Message, ChatState } from './types';
import { GeminiService } from './geminiService';
import ChatMessage from './components/ChatMessage';
import FormatSelector from './components/FormatSelector';
import DashboardOverview from './components/DashboardOverview';
import DoseCalculator from './components/DoseCalculator';
import QuizView from './components/QuizView';
import OnboardingModal from './components/OnboardingModal';
import { telemetry, StudentProfile } from './telemetryService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'tutor' | 'calculator' | 'quiz'>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const prevViewRef = useRef(activeView);
  const viewStartRef = useRef(Date.now());

  // Verifica se o aluno já preencheu o perfil (módulo/interesse)
  useEffect(() => {
    const profile = telemetry.getProfile();
    if (!profile) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = (profile: StudentProfile) => {
    telemetry.saveProfile(profile);
    setShowOnboarding(false);
  };

  // Rastreamento de Page Views e Transição de telas
  useEffect(() => {
    telemetry.logEvent({
      actionType: 'page_view',
      screenName: activeView
    });

    if (prevViewRef.current !== activeView) {
      const duration = Math.round((Date.now() - viewStartRef.current) / 1000);
      if (duration > 0) {
        telemetry.logEvent({
          actionType: 'time_spent',
          screenName: prevViewRef.current,
          durationSeconds: duration
        });
      }
      prevViewRef.current = activeView;
      viewStartRef.current = Date.now();
    }
  }, [activeView]);

  // Rastreamento de time_spent antes de fechar a aba do navegador
  useEffect(() => {
    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - viewStartRef.current) / 1000);
      if (duration > 0) {
        telemetry.logEvent({
          actionType: 'time_spent',
          screenName: activeView,
          durationSeconds: duration
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeView]);
  
  // Gamification stats, persistent in localStorage
  const [stats, setStats] = useState({
    xp: 0,
    quizzesCompleted: 0,
    calculationsCompleted: 0,
    studyMaterialsGenerated: 0
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bem-vindo ao CSM Tutor! 🎓 Sou seu assistente de estudos aqui no CSM Educação. Qual matéria técnica ou procedimento de saúde vamos revisar hoje?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [state, setState] = useState<ChatState>({ isGenerating: false });
  const [darkMode, setDarkMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<{id: string, topic: string}[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiRef = useRef<GeminiService | null>(null);

  // Load stats and theme from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('enfassist_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error(e);
      }
    }
    const savedTheme = localStorage.getItem('enfassist_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const updateStats = (updater: (prev: typeof stats) => typeof stats) => {
    setStats(prev => {
      const next = updater(prev);
      localStorage.setItem('enfassist_stats', JSON.stringify(next));
      return next;
    });
  };

  const toggleTheme = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('enfassist_theme', nextMode ? 'dark' : 'light');
  };

  const getGeminiService = () => {
    if (!geminiRef.current) {
      geminiRef.current = new GeminiService();
    }
    return geminiRef.current;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeView === 'tutor') {
      scrollToBottom();
    }
  }, [messages, activeView]);

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || state.isGenerating) return;

    // Registra envio de mensagem
    telemetry.logEvent({
      actionType: 'chat_message_sent',
      screenName: 'tutor',
      actionDetail: textToSend.substring(0, 100)
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    // Adiciona ao histórico se for uma nova dúvida principal (não vinda de botões de aprofundar)
    if (!customMessage) {
      setHistory(prev => [{id: userMessage.id, topic: textToSend}, ...prev.slice(0, 19)]);
    }

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    if (!customMessage) setInput('');
    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const assistantResponse = await getGeminiService().chat(updatedMessages);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      };

      setMessages([...updatedMessages, botMessage]);
      setState(prev => ({ ...prev, topic: textToSend, isGenerating: false }));
      
      // Award XP for chat interactions
      updateStats(prev => ({
        ...prev,
        xp: prev.xp + 5
      }));
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Não foi possível gerar a resposta. Tente novamente mais tarde.');
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleDeepDive = (topic: string) => {
    handleSend(`Gostaria de me aprofundar sobre: ${topic}`);
  };

  const handleFormatSelect = async (format: StudyFormat) => {
    if (state.isGenerating || !state.topic) {
      if (!state.topic) {
        alert("Por favor, informe primeiro o assunto que você está estudando!");
      }
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, format }));

    const waitMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `O CSM Tutor está preparando seu ${format} sobre "${state.topic}"... Quase pronto! 🏥`,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, waitMessage];
    setMessages(updatedMessages);

    try {
      const content = await getGeminiService().generateStudyContent(state.topic, format, messages);
      
      // Registra geração de material pedagógico por IA
      telemetry.logEvent({
        actionType: 'material_generated',
        screenName: 'tutor',
        actionDetail: `Formato: ${format} | Tema: ${state.topic?.substring(0, 100)}`
      });

      const resultMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
      };
      setMessages([...updatedMessages, resultMessage]);
      
      // Award XP for creating materials
      updateStats(prev => ({
        ...prev,
        xp: prev.xp + 10,
        studyMaterialsGenerated: prev.studyMaterialsGenerated + 1
      }));
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Não foi possível gerar o material de estudo. Tente novamente mais tarde.');
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleGenerateQuiz = async (topic: string) => {
    try {
      const responseText = await getGeminiService().generateQuizJson(topic);
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      }
      const data = JSON.parse(cleanJson);
      return data.questions || [];
    } catch (err) {
      console.error('Error generating quiz:', err);
      return [];
    }
  };

  const handleAwardXp = (xpEarned: number) => {
    updateStats(prev => ({
      ...prev,
      xp: prev.xp + xpEarned
    }));
  };

  const handleIncrementQuizzes = (topic: string, score: string) => {
    updateStats(prev => ({
      ...prev,
      quizzesCompleted: prev.quizzesCompleted + 1
    }));
    telemetry.logEvent({
      actionType: 'quiz_completed',
      screenName: 'quiz',
      actionDetail: `Tema: ${topic?.substring(0, 100)} | Acertos: ${score}`
    });
  };

  const handleCompleteCalculation = (calculationType: string) => {
    updateStats(prev => ({
      ...prev,
      xp: prev.xp + 15,
      calculationsCompleted: prev.calculationsCompleted + 1
    }));
    telemetry.logEvent({
      actionType: 'calculation_completed',
      screenName: 'calculator',
      actionDetail: calculationType
    });
  };

  const handleSelectTopicFromDashboard = (topicText: string) => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Olá! Vamos estudar o tema **"${topicText}"**. O que você gostaria de revisar sobre esse assunto?`,
        timestamp: new Date(),
      }
    ]);
    setState({ topic: topicText, isGenerating: false });
  };

  // Export current student progress as JSON file
  const handleExportBackup = () => {
    const backupData = {
      stats: stats,
      history: history,
      messages: messages
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `enfassist_progresso_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  };

  // Import student progress from JSON file
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.stats) {
          setStats(parsed.stats);
          localStorage.setItem('enfassist_stats', JSON.stringify(parsed.stats));
        }
        if (parsed.history) {
          setHistory(parsed.history);
        }
        if (parsed.messages) {
          setMessages(parsed.messages);
        }
        alert('🎉 Progresso importado com sucesso!');
      } catch (err) {
        console.error(err);
        alert('❌ Arquivo de backup inválido. Certifique-se de carregar um arquivo gerado pelo EnfAssist.');
      }
    };
    reader.readAsText(file);
  };

  const navigationItems = [
    { id: 'dashboard', name: 'Painel Inicial', icon: 'fa-chart-pie' },
    { id: 'tutor', name: 'Tutor de IA', icon: 'fa-comment-medical' },
    { id: 'calculator', name: 'Cálculos Clínicos', icon: 'fa-calculator' },
    { id: 'quiz', name: 'Simulador de Quiz', icon: 'fa-check-double' }
  ];

  return (
    <div className={`flex h-screen max-w-full mx-auto transition-colors duration-300 ${darkMode ? 'bg-[#121212] text-white' : 'bg-slate-100 text-slate-800'}`}>
      
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} darkMode={darkMode} />
      )}

      {/* Sidebar de Navegação & Histórico */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out border-r shadow-xl ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-slate-200'} flex flex-col`}>
        {/* Brand Header (Aligned h-16) */}
        <div className="h-16 px-4 border-b-2 border-[#FFCC00] flex items-center justify-between bg-[#b22222] text-white shrink-0">
          <div className="flex items-center gap-2">
            <i className="fas fa-graduation-cap text-lg text-[#FFCC00]"></i>
            <div>
              <span className="font-bold text-sm tracking-widest uppercase block leading-none">CSM Tutor</span>
              <span className="text-[8px] text-[#FFCC00] font-bold uppercase tracking-wider">Excelência no Cuidado</span>
            </div>
          </div>
          <button onClick={() => setIsHistoryOpen(false)} className="lg:hidden text-white hover:text-[#FFCC00]">
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="p-3 space-y-1 border-b dark:border-[#333]">
          <span className="text-[8px] font-black tracking-widest uppercase opacity-40 px-3 block mb-1">Navegação</span>
          {navigationItems.map(item => {
            const isSelected = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as any);
                  if (window.innerWidth < 1024) setIsHistoryOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[#b22222] text-white shadow-md'
                    : darkMode
                      ? 'text-slate-300 hover:bg-[#252525]'
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <i className={`fas ${item.icon} text-sm ${isSelected ? 'text-[#FFCC00]' : 'opacity-65'}`}></i>
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Context-aware Chat History in Sidebar */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeView === 'tutor' ? (
            <>
              <div className="p-3 pt-4 flex items-center justify-between opacity-40">
                <span className="text-[8px] font-black tracking-widest uppercase px-3">Histórico de Chat</span>
                {history.length > 0 && (
                  <button onClick={() => setHistory([])} className="text-[8px] font-black uppercase hover:underline text-[#b22222] dark:text-[#ff8888] px-3">Limpar</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
                {history.length === 0 ? (
                  <p className="text-[10px] text-center mt-8 opacity-45 font-bold uppercase tracking-wider">Sem conversas</p>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { handleSend(item.topic); if(window.innerWidth < 1024) setIsHistoryOpen(false); }}
                      className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${darkMode ? 'hover:bg-[#252525] border-transparent text-slate-300' : 'hover:bg-slate-50 border-transparent text-slate-600'} flex items-start gap-2 group`}
                    >
                      <i className="fas fa-comment-dots mt-0.5 opacity-40 group-hover:text-[#b22222]"></i>
                      <span className="truncate">{item.topic}</span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-center opacity-30 select-none">
              <div>
                <i className="fas fa-stethoscope text-3xl mb-2"></i>
                <p className="text-[9px] font-bold uppercase tracking-wider leading-snug">CSM Educação<br/>Enfermagem Técnica</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Container Principal */}
      <div className={`flex flex-col flex-1 h-screen relative shadow-2xl transition-colors duration-300 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        
        {/* Header Superior (Aligned h-16 with continuous borders) */}
        <header className="h-16 px-4 bg-[#b22222] text-white flex items-center justify-between shadow-md z-10 border-b-2 border-[#FFCC00] shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsHistoryOpen(true)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
              <i className="fas fa-bars"></i>
            </button>
            <div className="bg-[#FFCC00] p-1.5 rounded-lg text-[#003366] shadow-sm hidden sm:block">
              <i className="fas fa-user-md text-base"></i>
            </div>
            <div>
              <h1 className="font-bold text-xs md:text-sm leading-tight tracking-tight">
                {activeView === 'dashboard' && 'Painel de Estudos'}
                {activeView === 'tutor' && 'CSM Tutor IA'}
                {activeView === 'calculator' && 'Calculadora Farmacológica'}
                {activeView === 'quiz' && 'Simulador de Quiz'}
              </h1>
              <p className="text-[9px] text-[#FFCC00] font-bold uppercase tracking-wider">Estudante de Enfermagem CSM</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-4 text-[9px] font-black uppercase border-r border-white/20 pr-4 items-center">
              
              {/* XP Tooltip */}
              <div className="relative group flex items-center gap-1.5 cursor-help">
                <span>⚡ {stats.xp} XP</span>
                <span className="w-3.5 h-3.5 rounded-full bg-white/20 hover:bg-[#FFCC00] hover:text-[#003366] flex items-center justify-center text-[8px] font-black transition-all">?</span>
                <span className="absolute hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl w-56 right-0 top-6 z-50 normal-case tracking-normal border border-slate-700/50 leading-relaxed font-semibold">
                  ⚡ Pontos de Experiência acumulados. Ganhe XP tirando dúvidas (+5 XP), gerando guias (+10 XP), usando calculadoras (+15 XP) ou acertando quizzes (+20 XP).
                </span>
              </div>

              {/* Nível Tooltip */}
              <div className="relative group flex items-center gap-1.5 cursor-help">
                <span className="flex items-center gap-1"><i className="fas fa-trophy text-[#FFCC00]"></i> Nível {Math.floor(stats.xp / 100) + 1}</span>
                <span className="w-3.5 h-3.5 rounded-full bg-white/20 hover:bg-[#FFCC00] hover:text-[#003366] flex items-center justify-center text-[8px] font-black transition-all">?</span>
                <span className="absolute hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl w-56 right-0 top-6 z-50 normal-case tracking-normal border border-slate-700/50 leading-relaxed font-semibold">
                  🏆 Seu nível acadêmico de enfermagem. Cada 100 XP você avança de nível e evolui seu título pedagógico.
                </span>
              </div>

            </div>
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              title="Alternar Tema"
            >
              <i className={`fas ${darkMode ? 'fa-sun text-[#FFCC00]' : 'fa-moon text-white'} text-sm`}></i>
            </button>
          </div>
        </header>

        {/* Conteúdo Dinâmico com base na View Ativa */}
        <div className="flex-1 min-h-0">
          {activeView === 'dashboard' && (
            <DashboardOverview
              stats={stats}
              onNavigate={setActiveView}
              onSelectTopic={handleSelectTopicFromDashboard}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              darkMode={darkMode}
            />
          )}

          {activeView === 'tutor' && (
            <div className="flex flex-col h-full">
              {/* Chat Area */}
              <main className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-4 transition-colors duration-300 ${darkMode ? 'bg-[#121212]' : 'bg-[#f8fafc]'}`}>
                {messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} darkMode={darkMode} onTopicClick={handleDeepDive} />
                ))}
                {state.isGenerating && (
                  <div className="flex flex-col gap-1 ml-4">
                    <div className={`flex items-center gap-1.5 p-3 rounded-2xl border shadow-sm w-20 justify-center ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'}`}>
                      <span className="w-1.5 h-1.5 bg-[#003366] rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                      <span className="w-1.5 h-1.5 bg-[#b22222] rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                      <span className="w-1.5 h-1.5 bg-[#FFCC00] rounded-full animate-[bounce_1s_infinite_400ms]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </main>

              {/* Action Bar (Format Selector) */}
              {state.topic && !state.isGenerating && (
                <div className={`border-t transition-colors duration-300 ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-slate-200'} shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]`}>
                  <div className={`px-4 pt-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-center ${darkMode ? 'text-[#FFCC00]' : 'text-[#b22222]'}`}>
                    Formatos de Apoio Pedagógico
                  </div>
                  <FormatSelector onSelect={handleFormatSelect} selected={state.format} compact darkMode={darkMode} />
                </div>
              )}

              {/* Input Area */}
              <footer className={`p-4 border-t transition-colors duration-300 ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-slate-200'} sticky bottom-0`}>
                <div className="flex items-center gap-2 max-w-4xl mx-auto font-semibold">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Tire suas dúvidas clínicas (ex: como fazer sondagem nasogástrica)..."
                      className={`w-full pl-4 pr-12 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] transition-all shadow-sm text-sm ${
                        darkMode 
                        ? 'bg-[#252525] border-[#333] text-white placeholder-slate-500' 
                        : 'bg-[#b22222]/10 border-[#b22222]/20 text-[#b22222] placeholder-[#b22222]/60'
                      }`}
                    />
                    <style>{`
                      input { 
                        color: ${darkMode ? 'white' : '#b22222'} !important; 
                      }
                    `}</style>
                    
                    <button
                      onClick={() => handleSend()}
                      disabled={state.isGenerating || !input.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#FFCC00] text-[#003366] rounded-lg flex items-center justify-center hover:bg-[#b22222] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                      <i className="fas fa-paper-plane text-xs"></i>
                    </button>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">
                    CSM EDUCAÇÃO • Ensino de Saúde Baseado em Evidências
                  </p>
                </div>
              </footer>
            </div>
          )}

          {activeView === 'calculator' && (
            <DoseCalculator
              onCompleteCalculation={handleCompleteCalculation}
              darkMode={darkMode}
            />
          )}

          {activeView === 'quiz' && (
            <QuizView
              onGenerateQuiz={handleGenerateQuiz}
              onAwardXp={handleAwardXp}
              onIncrementQuizzes={handleIncrementQuizzes}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
