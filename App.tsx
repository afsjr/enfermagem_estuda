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
import ReactMarkdown from 'react-markdown';

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

  const currentLevel = Math.floor(stats.xp / 100) + 1;
  const xpInCurrentLevel = stats.xp % 100;
  const progressPercent = Math.min(xpInCurrentLevel, 100);

  const getRankName = (level: number) => {
    if (level <= 1) return 'Estudante Calouro 🎓';
    if (level === 2) return 'Técnico em Formação 🏥';
    if (level === 3) return 'Cuidado Humanizado 🩺';
    if (level === 4) return 'Mestre dos Curativos 🩹';
    return 'Líder do Cuidado Clínico 🏆';
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Bem-vindo ao MonicAI! 🎓 Sou seu assistente de estudos aqui no Colégio Santa Mônica, um projeto **100% gratuito** para alunos do técnico em enfermagem. Meu propósito é ajudar **exclusivamente** em temas de saúde e enfermagem. Qual matéria técnica ou procedimento vamos revisar hoje?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [state, setState] = useState<ChatState>({ isGenerating: false });
  const [darkMode, setDarkMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<{id: string, topic: string}[]>([]);
  
  // NotebookLM Workspace States
  const [studioTab, setStudioTab] = useState<'documents' | 'calculator' | 'quiz' | 'notes'>('documents');
  const [generatedDoc, setGeneratedDoc] = useState<{ title: string; content: string; format: StudyFormat } | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [activeMobileView, setActiveMobileView] = useState<'chat' | 'studio'>('chat');
  const [isStudioExpanded, setIsStudioExpanded] = useState<boolean>(true);
  const [hasNewStudioContent, setHasNewStudioContent] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiRef = useRef<GeminiService | null>(null);

  // Load stats and theme from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('monicai_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error(e);
      }
    }
    const savedTheme = localStorage.getItem('monicai_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
    const savedNotes = localStorage.getItem('monicai_notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const updateStats = (updater: (prev: typeof stats) => typeof stats) => {
    setStats(prev => {
      const next = updater(prev);
      localStorage.setItem('monicai_stats', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem('monicai_theme', nextMode ? 'dark' : 'light');
  };

  const handleSaveNotes = (newNotes: string) => {
    setNotes(newNotes);
    localStorage.setItem('monicai_notes', newNotes);
  };

  const handleAddToNotes = (text: string) => {
    // Remove "Para Aprofundar" section to keep notes clean
    const cleanText = text.replace(/🚀 Para Aprofundar[\s\S]*/i, '').trim();
    const timestampStr = new Date().toLocaleString('pt-BR');
    const noteEntry = `\n\n--- [Anotação em ${timestampStr}]\n${cleanText}\n`;
    
    // Append to existing notes or start a new notes text
    setNotes(prev => {
      const nextNotes = prev ? prev + noteEntry : noteEntry.trim();
      localStorage.setItem('monicai_notes', nextNotes);
      return nextNotes;
    });

    // Switch tab to notes so student knows it succeeded
    setStudioTab('notes');
    if (window.innerWidth < 1024) {
      setActiveMobileView('studio');
    } else {
      setIsStudioExpanded(true);
      setHasNewStudioContent(true);
    }
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
      content: `O MonicAI está preparando seu ${format} sobre "${state.topic}"... Quase pronto! 🏥`,
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

      // Save to document workspace
      setGeneratedDoc({
        title: `${format} — ${state.topic}`,
        content: content,
        format: format
      });
      setStudioTab('documents');
      if (window.innerWidth < 1024) {
        setActiveMobileView('studio');
      } else {
        setIsStudioExpanded(true);
        setHasNewStudioContent(true);
      }

      const resultMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `📄 **${format} Gerado!**\n\nPreparei um material pedagógico estruturado sobre **"${state.topic}"** no formato de **${format}**.\n\nO documento completo foi aberto no seu **Estúdio de Estudos** ao lado! Você pode lê-lo, copiá-lo ou salvá-lo diretamente nas suas anotações.`,
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
    downloadAnchor.setAttribute('download', `monicai_progresso_${dateStr}.json`);
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
          localStorage.setItem('monicai_stats', JSON.stringify(parsed.stats));
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
        alert('❌ Arquivo de backup inválido. Certifique-se de carregar um arquivo gerado pelo MonicAI.');
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
            <div className="bg-white px-1.5 py-1 rounded shadow-sm flex items-center justify-center">
              <img src="/logo.png" alt="CSM Logo" className="h-7 object-contain" />
            </div>
            <div className="ml-1">
              <span className="font-bold text-sm tracking-widest uppercase block leading-none">MonicAI</span>
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
            <div className="flex-1 flex items-center justify-center p-4 text-center opacity-50 select-none">
              <div className="flex flex-col items-center">
                <div className="bg-white/50 p-2 rounded-lg mb-3">
                  <img src="/logo.png" alt="CSM Logo" className="h-10 object-contain grayscale opacity-80 mix-blend-multiply dark:mix-blend-screen dark:opacity-100" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider leading-snug">Colégio Santa Mônica<br/>Enfermagem Técnica</p>
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
            <button onClick={() => setIsHistoryOpen(true)} className="hidden p-2 hover:bg-white/10 rounded-lg">
              <i className="fas fa-bars"></i>
            </button>
            <div className="bg-[#FFCC00] p-1.5 rounded-lg text-[#003366] shadow-sm hidden sm:block">
              <i className="fas fa-user-md text-base"></i>
            </div>
            <div>
              <h1 className="font-bold text-xs md:text-sm leading-tight tracking-tight">
                {activeView === 'dashboard' && 'Painel de Estudos'}
                {activeView === 'tutor' && 'MonicAI Tutor'}
                {activeView === 'calculator' && 'Calculadora Farmacológica'}
                {activeView === 'quiz' && 'Simulador de Quiz'}
              </h1>
              <p className="text-[9px] text-[#FFCC00] font-bold uppercase tracking-wider">Estudante de Enfermagem | Santa Mônica</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Persisted Evolution Progress Widget in Header */}
            {/* Mobile compact XP */}
            <div className="flex sm:hidden items-center gap-2 border-r border-white/20 pr-3 shrink-0">
              <span className="text-[9px] font-black uppercase tracking-wider opacity-90">⚡ {stats.xp}</span>
              <div className="w-12 bg-white/20 h-1 rounded-full overflow-hidden">
                <div className="bg-[#FFCC00] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            {/* Desktop full XP widget */}
            <div className="hidden sm:flex gap-3.5 items-center border-r border-white/20 pr-4 shrink-0">
              <div className="text-right">
                <span className="px-2 py-0.5 bg-[#FFCC00] text-[#003366] rounded-full text-[8px] font-black uppercase tracking-wider block leading-none">
                  {getRankName(currentLevel)}
                </span>
                <div className="relative group flex items-center justify-end gap-1 mt-1 leading-none cursor-help select-none">
                  <span className="text-[9px] opacity-75 font-black uppercase tracking-wider">⚡ {stats.xp} XP</span>
                  <span className="w-3 h-3 rounded-full bg-white/10 hover:bg-[#FFCC00] hover:text-[#003366] flex items-center justify-center text-[7px] font-black transition-all">?</span>
                  <span className="absolute hidden group-hover:block bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl w-56 right-0 top-5 z-50 normal-case tracking-normal border border-slate-700/50 leading-relaxed font-semibold">
                    ⚡ Pontos de Experiência acumulados. Ganhe XP tirando dúvidas (+5 XP), gerando guias (+10 XP), usando calculadoras (+15 XP) ou acertando quizzes (+20 XP).
                  </span>
                </div>
              </div>
              
              <div className="w-24 lg:w-32 space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider opacity-85 leading-none">
                  <span>Nível {currentLevel}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="bg-[#FFCC00] h-full rounded-full transition-all duration-500 shadow-md"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
            {activeView === 'tutor' && (
              <button 
                onClick={() => {
                  setIsStudioExpanded(!isStudioExpanded);
                  setHasNewStudioContent(false);
                }}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isStudioExpanded 
                    ? 'bg-white/20 text-[#FFCC00]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                } hidden lg:flex`}
                title={isStudioExpanded ? "Recolher Estúdio de Estudos" : "Expandir Estúdio de Estudos"}
              >
                <i className={`fas ${isStudioExpanded ? 'fa-columns' : 'fa-toolbox'} text-sm`}></i>
                {hasNewStudioContent && !isStudioExpanded && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#b22222] animate-pulse"></span>
                )}
              </button>
            )}
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
            <div className="flex flex-1 flex-col lg:flex-row h-full overflow-hidden min-h-0">
              
              {/* MOBILE ONLY: Tab bar toggle at the top of the tutor view */}
              <div className="lg:hidden flex border-b shrink-0 bg-[#b22222]/5 dark:bg-black/20">
                <button
                  onClick={() => setActiveMobileView('chat')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                    activeMobileView === 'chat'
                      ? 'border-[#b22222] text-[#b22222] dark:text-[#ff8888]'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  <i className="fas fa-comment-medical mr-1.5"></i> Chat
                </button>
                <button
                  onClick={() => setActiveMobileView('studio')}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
                    activeMobileView === 'studio'
                      ? 'border-[#b22222] text-[#b22222] dark:text-[#ff8888]'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  <i className="fas fa-toolbox mr-1.5"></i> Estúdio de Estudos
                </button>
              </div>

              {/* LEFT COLUMN: Chat Panel */}
              <div className={`w-full flex flex-col h-full shrink-0 min-h-0 transition-all duration-300 ease-in-out ${
                isStudioExpanded 
                  ? 'lg:w-[55%] border-r dark:border-[#333]' 
                  : 'lg:w-full border-r-0'
              } ${
                activeMobileView === 'chat' ? 'flex' : 'hidden lg:flex'
              }`}>
                {/* Chat Area */}
                <main className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-4 pb-20 lg:pb-6 transition-colors duration-300 ${darkMode ? 'bg-[#121212]' : 'bg-[#f8fafc]'}`}>
                  {messages.map(msg => (
                    <ChatMessage 
                      key={msg.id} 
                      message={msg} 
                      darkMode={darkMode} 
                      onTopicClick={handleDeepDive} 
                      onAddToNotes={handleAddToNotes}
                    />
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
                  <div className={`border-t transition-colors duration-300 overflow-x-auto ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-slate-200'} shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]`}>
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
                        placeholder="Tire sua dúvida aqui..."
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
                      MONICAI • Ensino de Saúde Baseado em Evidências
                    </p>
                  </div>
                </footer>
              </div>

              {/* RIGHT COLUMN: NotebookLM Tools / Studio Panel */}
              <div className={`w-full flex flex-col h-full bg-slate-50 dark:bg-[#121212] overflow-hidden min-h-0 transition-all duration-300 ease-in-out ${
                isStudioExpanded 
                  ? 'lg:w-[45%] border-l dark:border-[#333]' 
                  : 'lg:w-16 border-l dark:border-[#333]'
              } ${
                activeMobileView === 'studio' ? 'flex' : 'hidden lg:flex'
              }`}>
                
                {/* Collapsed Sidebar View (desktop only) */}
                {!isStudioExpanded && (
                  <div className="hidden lg:flex flex-col items-center justify-between py-6 h-full bg-slate-100 dark:bg-[#1a1a1a] w-full shrink-0">
                    <div className="flex flex-col gap-5 w-full items-center">
                      <button
                        onClick={() => {
                          setStudioTab('documents');
                          setIsStudioExpanded(true);
                          setHasNewStudioContent(false);
                        }}
                        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          studioTab === 'documents'
                            ? 'bg-[#b22222] text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#252525]'
                        }`}
                        title="Documentos Gerados"
                      >
                        <i className="fas fa-file-alt text-sm"></i>
                        {hasNewStudioContent && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1a1a1a] animate-pulse"></span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setStudioTab('calculator');
                          setIsStudioExpanded(true);
                        }}
                        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          studioTab === 'calculator'
                            ? 'bg-[#b22222] text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#252525]'
                        }`}
                        title="Calculadora Farmacológica"
                      >
                        <i className="fas fa-calculator text-sm"></i>
                      </button>

                      <button
                        onClick={() => {
                          setStudioTab('quiz');
                          setIsStudioExpanded(true);
                        }}
                        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          studioTab === 'quiz'
                            ? 'bg-[#b22222] text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#252525]'
                        }`}
                        title="Simulador de Quiz"
                      >
                        <i className="fas fa-check-double text-sm"></i>
                      </button>

                      <button
                        onClick={() => {
                          setStudioTab('notes');
                          setIsStudioExpanded(true);
                        }}
                        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          studioTab === 'notes'
                            ? 'bg-[#b22222] text-white shadow-md'
                            : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#252525]'
                        }`}
                        title="Bloco de Notas"
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsStudioExpanded(true);
                        setHasNewStudioContent(false);
                      }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-[#252525] transition-all bg-[#b22222]/10 hover:text-[#b22222]"
                      title="Expandir Painel"
                    >
                      <i className="fas fa-chevron-left text-sm"></i>
                    </button>
                  </div>
                )}

                {/* Expanded/Full View (Always shown on mobile, shown on desktop ONLY when expanded) */}
                <div className={`flex-1 flex flex-col h-full min-h-0 overflow-hidden ${
                  isStudioExpanded ? 'flex' : 'lg:hidden'
                }`}>
                  
                  {/* Studio Tab bar headers */}
                  <div className={`flex border-b shrink-0 items-center justify-between ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex flex-1">
                      <button
                        onClick={() => setStudioTab('documents')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 text-center transition-all ${
                          studioTab === 'documents'
                            ? 'border-[#b22222] text-[#b22222] dark:text-[#ff8888] bg-white dark:bg-[#1a1a1a]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:bg-[#252525]'
                        }`}
                      >
                        <i className="fas fa-file-alt mr-1"></i> Documentos
                      </button>
                      <button
                        onClick={() => setStudioTab('calculator')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 text-center transition-all ${
                          studioTab === 'calculator'
                            ? 'border-[#b22222] text-[#b22222] dark:text-[#ff8888] bg-white dark:bg-[#1a1a1a]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:bg-[#252525]'
                        }`}
                      >
                        <i className="fas fa-calculator mr-1"></i> Cálculo
                      </button>
                      <button
                        onClick={() => setStudioTab('quiz')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 text-center transition-all ${
                          studioTab === 'quiz'
                            ? 'border-[#b22222] text-[#b22222] dark:text-[#ff8888] bg-white dark:bg-[#1a1a1a]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:bg-[#252525]'
                        }`}
                      >
                        <i className="fas fa-check-double mr-1"></i> Quiz
                      </button>
                      <button
                        onClick={() => setStudioTab('notes')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider border-b-2 text-center transition-all ${
                          studioTab === 'notes'
                            ? 'border-[#b22222] text-[#b22222] dark:text-[#ff8888] bg-white dark:bg-[#1a1a1a]'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:bg-[#252525]'
                        }`}
                      >
                        <i className="fas fa-edit mr-1"></i> Notas
                      </button>
                    </div>

                    <button
                      onClick={() => setIsStudioExpanded(false)}
                      className="p-3 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 dark:hover:bg-[#252525] border-l dark:border-[#333] transition-all hidden lg:block"
                      title="Recolher Painel"
                    >
                      <i className="fas fa-chevron-right text-xs"></i>
                    </button>
                  </div>

                  {/* Tab content wrapper */}
                  <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-[#1a1a1a]">
                    
                    {/* Documents Tab */}
                    {studioTab === 'documents' && (
                      <div className="p-4 md:p-6 space-y-6 h-full flex flex-col min-h-0">
                        {!generatedDoc ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                              <i className="fas fa-file-invoice text-3xl text-slate-400 dark:text-slate-500"></i>
                            </div>
                            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-300">Estúdio de Materiais Pedagógicos</h4>
                            <p className="text-xs max-w-sm mt-3 leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                              Nenhum material de estudo gerado nesta sessão de chat.<br/><br/>
                              Digite sua dúvida, defina um tema e clique em um dos botões de <strong className="text-slate-700 dark:text-slate-300">"Formatos de Apoio Pedagógico"</strong> abaixo do chat para gerar mapas mentais, resumos, estudos de caso e muito mais!
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col h-full">
                            {/* Document Metadata Headers */}
                            <div className="flex justify-between items-center pb-4 border-b dark:border-[#333] mb-4 shrink-0">
                              <div>
                                <span className="px-2 py-0.5 bg-[#b22222]/15 dark:bg-[#b22222]/30 text-[#b22222] dark:text-[#ff8888] rounded-full text-[9px] font-black uppercase tracking-wider">
                                  {generatedDoc.format}
                                </span>
                                <h3 className="font-black text-sm md:text-base mt-1.5 leading-tight">{generatedDoc.title}</h3>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedDoc.content);
                                    alert('Conteúdo copiado!');
                                  }}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] dark:hover:bg-[#333] rounded-lg text-xs"
                                  title="Copiar Documento"
                                >
                                  <i className="fas fa-copy"></i>
                                </button>
                                <button
                                  onClick={() => handleAddToNotes(`[Documento: ${generatedDoc.title}]\n\n${generatedDoc.content}`)}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#252525] dark:hover:bg-[#333] rounded-lg text-xs text-emerald-600 dark:text-emerald-400"
                                  title="Salvar nas Notas"
                                >
                                  <i className="fas fa-file-signature"></i>
                                </button>
                              </div>
                            </div>
                            
                            {/* Sheet of Paper layout for document reading */}
                            <div className={`flex-1 overflow-y-auto p-6 rounded-xl border shadow-inner ${
                              darkMode 
                                ? 'bg-[#222] border-[#333] text-slate-100' 
                                : 'bg-amber-50/10 border-slate-200 text-slate-800'
                            }`}>
                              <div className="prose max-w-none text-xs md:text-sm leading-relaxed font-medium">
                                <ReactMarkdown>{generatedDoc.content}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Calculator Tab */}
                    {studioTab === 'calculator' && (
                      <div className="h-full overflow-y-auto min-h-0 pb-20 lg:pb-0 bg-white dark:bg-[#1a1a1a]">
                        <DoseCalculator
                          onCompleteCalculation={handleCompleteCalculation}
                          darkMode={darkMode}
                        />
                      </div>
                    )}

                    {/* Quiz Tab */}
                    {studioTab === 'quiz' && (
                      <div className="h-full overflow-y-auto min-h-0 pb-20 lg:pb-0 bg-white dark:bg-[#1a1a1a]">
                        <QuizView
                          onGenerateQuiz={handleGenerateQuiz}
                          onAwardXp={handleAwardXp}
                          onIncrementQuizzes={handleIncrementQuizzes}
                          darkMode={darkMode}
                          initialTopic={state.topic}
                        />
                      </div>
                    )}

                    {/* Notes Tab */}
                    {studioTab === 'notes' && (
                      <div className="p-4 md:p-6 space-y-4 h-full flex flex-col min-h-0">
                        <div className="flex justify-between items-center shrink-0 pb-2 border-b dark:border-[#333]">
                          <div>
                            <h4 className="font-bold text-xs uppercase tracking-wider text-[#b22222] dark:text-[#ff8888]">✍️ Meu Bloco de Notas</h4>
                            <p className="text-[10px] text-slate-500 font-semibold leading-tight">Suas anotações locais e trechos salvos do chat</p>
                          </div>
                          {notes && (
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja apagar todas as suas anotações?')) {
                                  handleSaveNotes('');
                                }
                              }}
                              className="px-2.5 py-1 text-[9px] bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 font-black rounded-lg uppercase tracking-wider hover:bg-red-200"
                            >
                              Limpar Tudo
                            </button>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col min-h-0">
                          <textarea
                            value={notes}
                            onChange={(e) => handleSaveNotes(e.target.value)}
                            placeholder="Comece a digitar suas anotações ou clique em 'Salvar nas Notas' nas respostas do chat para reunir seu material pedagógico..."
                            className={`w-full flex-1 p-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#FFCC00] text-xs md:text-sm font-semibold leading-relaxed resize-none ${
                              darkMode 
                                ? 'bg-[#222] border-[#333] text-slate-200 placeholder-slate-600' 
                                : 'bg-yellow-50/15 border-slate-200 text-slate-700 placeholder-slate-400'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="safe-area-bottom lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t backdrop-blur-xl bg-white/80 dark:bg-[#1a1a1a]/90 border-slate-200/60 dark:border-[#333] pb-[env(safe-area-inset-bottom)]">
        {[
          { id: 'dashboard', icon: 'fa-chart-pie', label: 'Painel' },
          { id: 'tutor', icon: 'fa-comment-medical', label: 'Tutor' },
          { id: 'calculator', icon: 'fa-calculator', label: 'Cálculos' },
          { id: 'quiz', icon: 'fa-check-double', label: 'Quiz' },
        ].map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 transition-colors ${
                isActive
                  ? 'text-[#b22222]'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <i className={`fas ${item.icon} text-base`}></i>
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default App;
