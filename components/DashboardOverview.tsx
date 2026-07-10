import React, { useState } from 'react';

interface DashboardOverviewProps {
  stats: {
    xp: number;
    quizzesCompleted: number;
    calculationsCompleted: number;
    studyMaterialsGenerated: number;
  };
  onNavigate: (view: 'dashboard' | 'tutor' | 'calculator' | 'quiz' | 'pep' | 'infusion' | 'emergency' | 'presentation') => void;
  onSelectTopic: (topic: string) => void;
  onExportBackup: () => void;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  darkMode?: boolean;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  onNavigate,
  onSelectTopic,
  onExportBackup,
  onImportBackup,
  darkMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSelectTopic(searchQuery.trim());
      onNavigate('tutor');
    }
  };
  const disciplines = [
    {
      name: 'Fundamentos de Enfermagem',
      icon: 'fa-user-nurse',
      color: 'from-blue-500 to-indigo-600',
      desc: 'Procedimentos básicos, sinais vitais, higiene, conforto e segurança do paciente.',
      topic: 'Fundamentos de Enfermagem (sinais vitais, banho de leito, curativos, etc.)'
    },
    {
      name: 'Farmacologia e Cálculo Clínico',
      icon: 'fa-pills',
      color: 'from-emerald-500 to-teal-600',
      desc: 'Vias de administração, interações medicamentosas e cálculos de dosagens complexas.',
      topic: 'Farmacologia aplicada e cálculo de dosagem de medicamentos'
    },
    {
      name: 'Anatomia e Fisiologia Humana',
      icon: 'fa-heartbeat',
      color: 'from-red-500 to-pink-600',
      desc: 'Estrutura e funcionamento dos sistemas do corpo humano voltados à prática clínica.',
      topic: 'Anatomia e Fisiologia Humana para técnicos de enfermagem'
    },
    {
      name: 'Saúde da Mulher e da Criança',
      icon: 'fa-baby',
      color: 'from-purple-500 to-pink-500',
      desc: 'Cuidado pré-natal, parto, puerpério, pediatria e desenvolvimento infantil.',
      topic: 'Saúde da Mulher, Pediatria e Assistência ao Parto/Puerpério'
    },
    {
      name: 'Urgência, Emergência e UTI',
      icon: 'fa-ambulance',
      color: 'from-amber-500 to-orange-600',
      desc: 'Atendimento pré-hospitalar, parada cardiorrespiratória e suporte básico de vida.',
      topic: 'Urgência, Emergência, PCR e Suporte Básico de Vida'
    },
    {
      name: 'Ética e Exercício Profissional',
      icon: 'fa-balance-scale',
      color: 'from-slate-600 to-slate-800',
      desc: 'Legislação de enfermagem, resoluções do COFEN/COREN e bioética.',
      topic: 'Ética profissional na enfermagem e código do COFEN'
    }
  ];

  // Calculate student level based on XP (each level is 100 XP)
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto overflow-y-auto h-full pb-24 lg:pb-6">
      {/* Welcome & Gamification Header */}
      <section className={`p-6 rounded-2xl border transition-all shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between ${
        darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="space-y-2 text-center md:text-left flex-1">
          <h2 className="text-lg md:text-2xl font-bold tracking-tight">Bem-vindo ao MonicAI! 👋</h2>
          <p className={`text-xs md:text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Desenvolva suas habilidades práticas e teóricas de enfermagem com ajuda de IA e simuladores clínicos.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-4 mt-2">
            <span className="px-2.5 py-1 bg-red-100 dark:bg-[#b22222]/20 text-[#b22222] dark:text-[#ff8888] rounded-full text-[10px] font-bold uppercase tracking-wider">
              {getRankName(currentLevel)}
            </span>
            <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
              🏆 Nível {currentLevel}
            </span>
            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
              ⚡ {stats.xp} Total XP
            </span>
          </div>
          <div className="mt-4 flex justify-center md:justify-start">
            <button 
              onClick={() => onNavigate('presentation')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all hover:scale-105"
            >
              <i className="fas fa-play-circle text-lg"></i> Como usar o MonicAI?
            </button>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="w-full md:w-64 space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-[#333] pt-4 md:pt-0 md:pl-6">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-70">
            <span>Progresso do Nível</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#333] h-3 rounded-full overflow-hidden shadow-inner">
            <div 
              className="bg-[#FFCC00] h-full rounded-full transition-all duration-500 shadow-md"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] opacity-50 font-semibold text-right">
            {100 - xpInCurrentLevel} XP para o próximo nível
          </p>
        </div>
      </section>

      {/* Search Input for quick start */}
      <section className={`p-5 rounded-2xl border transition-all shadow-sm ${
        darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'
      }`}>
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="text-center md:text-left space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#b22222] dark:text-[#ff8888] flex items-center gap-2">
              <i className="fas fa-search text-sm"></i> O que você quer estudar hoje?
            </h3>
            <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Digite qualquer assunto clínico ou procedimento técnico para iniciar seu tutor inteligente de IA imediatamente.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 max-w-3xl">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Sondagem nasogástrica, RCP..."
                className={`w-full pl-10 pr-4 py-3.5 rounded-xl border-2 font-semibold text-base focus:outline-none focus:border-[#b22222] focus:ring-1 focus:ring-[#b22222] transition-all ${
                  darkMode
                    ? 'bg-[#1a1a1a] border-[#444] text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="fas fa-search"></i>
              </div>
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#b22222] hover:bg-[#8b0000] disabled:opacity-40 disabled:hover:bg-[#b22222] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
            >
              <span>Estudar</span>
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
          <p className="text-[10px] opacity-60 font-semibold italic text-center md:text-left">
            💡 Ou escolha uma das disciplinas ou ferramentas sugeridas abaixo para guiar seus estudos.
          </p>
        </form>
      </section>

      {/* Summary Statistics Grid */}
      <section className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 sm:grid sm:grid-cols-2 md:grid-cols-4 sm:gap-4 sm:overflow-visible sm:pb-0 hide-scrollbar">
        <div className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all hover:scale-102 snap-center shrink-0 w-[45%] sm:w-auto ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-slate-200'}`}>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-indigo-500">XP Acumulado</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black">{stats.xp}</span>
            <span className="text-[10px] text-green-500 font-bold">⚡ +15xp/quiz</span>
          </div>
        </div>
        <div className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all hover:scale-102 snap-center shrink-0 w-[45%] sm:w-auto ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-slate-200'}`}>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-[#b22222]">Quizzes Feitos</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black">{stats.quizzesCompleted}</span>
            <span className="text-[10px] opacity-40 font-semibold">Testes práticos</span>
          </div>
        </div>
        <div className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all hover:scale-102 snap-center shrink-0 w-[45%] sm:w-auto ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-slate-200'}`}>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-emerald-500">Cálculos Realizados</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black">{stats.calculationsCompleted}</span>
            <span className="text-[10px] opacity-40 font-semibold">Simulações farmacológicas</span>
          </div>
        </div>
        <div className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-all hover:scale-102 snap-center shrink-0 w-[45%] sm:w-auto ${darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-slate-200'}`}>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-amber-500">Materiais de Estudo</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black">{stats.studyMaterialsGenerated}</span>
            <span className="text-[10px] opacity-40 font-semibold">Guias gerados por IA</span>
          </div>
        </div>
      </section>

      {/* LGPD Local-First Privacy Warning & Backup Controls */}
      <section className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${
        darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-inner">
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">🔒 Seus Dados, Seu Controle (Privacidade Garantida)</h4>
            <p className={`text-[11px] leading-relaxed font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Para garantir sua privacidade, todo o seu progresso de estudos, XP acumulado e histórico de chats são salvos <strong>exclusivamente no seu próprio aparelho</strong>. Não guardamos seus dados em nenhum servidor externo, cumprindo os preceitos da LGPD. Você tem controle absoluto sobre sua evolução individual! Use os botões ao lado para fazer backup do seu progresso se for trocar de dispositivo.
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end shrink-0">
          <button
            onClick={onExportBackup}
            className="px-3.5 py-2 bg-[#b22222]/15 dark:bg-[#b22222]/30 hover:bg-[#b22222]/25 dark:hover:bg-[#b22222]/40 text-[#b22222] dark:text-[#ff8888] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            title="Baixar arquivo de backup do seu progresso"
          >
            <i className="fas fa-download mr-1.5"></i> Exportar
          </button>
          <label
            className="px-3.5 py-2 bg-slate-200 dark:bg-[#333] hover:bg-slate-300 dark:hover:bg-[#444] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer text-center text-slate-700 dark:text-slate-300"
            title="Carregar arquivo de backup anterior"
          >
            <i className="fas fa-upload mr-1.5"></i> Importar
            <input
              type="file"
              accept=".json"
              onChange={onImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* Quick Access Tools */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => onNavigate('calculator')}
          className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all shadow-sm hover:shadow-md hover:border-[#b22222] ${
            darkMode ? 'bg-[#252525] border-[#333] hover:bg-[#2d2d2d]' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner">
            <i className="fas fa-calculator"></i>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Calculadora de Medicamentos 🧮</h3>
            <p className={`text-xs mt-1 leading-normal ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Calcule taxas de infusão (gotas/min, microgotas/min) e diluição de doses via Regra de Três, com explicação matemática e a fundamentação teórica segundo o COFEN.
            </p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('quiz')}
          className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all shadow-sm hover:shadow-md hover:border-[#b22222] ${
            darkMode ? 'bg-[#252525] border-[#333] hover:bg-[#2d2d2d]' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner">
            <i className="fas fa-check-double"></i>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-purple-600 dark:text-purple-400">Simulador de Quiz por IA 📝</h3>
            <p className={`text-xs mt-1 leading-normal ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Gere simulados dinâmicos e testes rápidos sobre qualquer tópico clínico. Responda interativamente e aprenda com o gabarito comentado fundamentado na literatura científica.
            </p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('emergency')}
          className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all shadow-sm hover:shadow-md hover:border-[#b22222] ${
            darkMode ? 'bg-[#252525] border-[#333] hover:bg-[#2d2d2d]' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner">
            <i className="fas fa-heartbeat"></i>
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-red-600 dark:text-red-400">Escalas de Emergência 🚨</h3>
            <p className={`text-xs mt-1 leading-normal ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Glasgow, NEWS, Dor, IMC e doses de emergência. Avalie rapidamente a gravidade do paciente com suporte de IA.
            </p>
          </div>
        </button>
      </section>

      {/* Pedagogical Profile Disciplines Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <i className="fas fa-graduation-cap text-[#b22222] text-lg"></i>
          <h3 className="font-bold text-sm uppercase tracking-widest text-[#b22222] dark:text-[#ff8888]">Disciplinas do Perfil Pedagógico</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {disciplines.map((d) => (
            <div 
              key={d.name}
              className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all hover:-translate-y-1 shadow-sm hover:shadow-md ${
                darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="p-5 space-y-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${d.color} text-white flex items-center justify-center shadow-md`}>
                  <i className={`fas ${d.icon} text-lg`}></i>
                </div>
                <h4 className="font-bold text-sm leading-snug">{d.name}</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {d.desc}
                </p>
              </div>
              <div className={`p-4 border-t flex justify-end ${darkMode ? 'border-slate-200/10' : 'border-slate-100'}`}>
                <button
                  onClick={() => {
                    onNavigate('tutor');
                    onSelectTopic(d.topic);
                  }}
                  className="px-4 py-3 sm:py-2.5 bg-[#b22222] text-white text-[11px] md:text-[12px] font-bold rounded-xl uppercase tracking-wider hover:bg-[#8b0000] active:scale-95 transition-all shadow-sm min-h-[44px] flex items-center justify-center w-full"
                >
                  Estudar Tópico <i className="fas fa-chevron-right ml-1"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardOverview;
