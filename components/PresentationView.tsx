import React from 'react';

interface PresentationViewProps {
  onBack: () => void;
  darkMode?: boolean;
}

export const PresentationView: React.FC<PresentationViewProps> = ({ onBack, darkMode }) => {
  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto overflow-y-auto h-full pb-24 lg:pb-8 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      
      {/* HEADER HERO NOVO */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-[#b22222] to-orange-500 p-8 md:p-12 rounded-3xl shadow-2xl mb-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 animate-fadeIn">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-20 rounded-full blur-3xl mix-blend-screen"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-yellow-300 opacity-20 rounded-full blur-3xl mix-blend-screen"></div>
        
        <div className="relative z-10 max-w-2xl text-center md:text-left">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest mb-5 shadow-sm">
            Descubra as Funcionalidades
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-5 tracking-tight drop-shadow-md">A Evolução do Ensino Clínico</h1>
          <p className="text-lg md:text-xl font-medium opacity-95 mb-8 leading-relaxed">
            Explore um ecossistema completo de ferramentas interativas que transformarão sua maneira de estudar, diagnosticar e aplicar o processo de enfermagem com segurança e confiança.
          </p>
          <button 
            onClick={onBack}
            className="bg-white text-[#b22222] hover:bg-slate-50 hover:scale-105 transition-all duration-300 font-black py-4 px-8 rounded-full shadow-xl flex items-center justify-center gap-3 w-full md:w-auto active:scale-95"
          >
            <i className="fas fa-arrow-left text-lg"></i>
            Voltar para o Dashboard
          </button>
        </div>
        
        <div className="relative z-10 w-40 h-40 md:w-64 md:h-64 flex-shrink-0 animate-pulse-slow hidden sm:flex">
          <div className="w-full h-full bg-white/10 backdrop-blur-lg rounded-full shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center border border-white/20 relative">
            <i className="fas fa-microscope text-6xl md:text-8xl text-white drop-shadow-2xl z-20"></i>
            <div className="absolute inset-2 rounded-full border-2 border-white/30 border-dashed animate-[spin_10s_linear_infinite]"></div>
          </div>
        </div>
      </div>

      {/* FERRAMENTAS SECTION */}
      <div className="mb-12">
        <h2 className="text-3xl font-black mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-500">
          Experiência Completa de Aprendizado
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Card 1: Preceptoria */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center text-white text-2xl mb-5 shadow-lg shadow-rose-500/30">
              <i className="fas fa-robot"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">MonicAI Preceptoria</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4 flex-grow">
              Tire dúvidas clínicas a qualquer hora. Nosso motor de IA está configurado para não alucinar e basear-se estritamente na literatura de enfermagem.
            </p>
            <ul className="text-xs space-y-2 opacity-80 font-medium">
              <li className="flex items-center"><i className="fas fa-check text-rose-500 mr-2 w-4"></i>Evidências Científicas</li>
              <li className="flex items-center"><i className="fas fa-check text-rose-500 mr-2 w-4"></i>Respostas Seguras</li>
            </ul>
          </div>

          {/* Card 2: PEP */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-2xl mb-5 shadow-lg shadow-teal-500/30">
              <i className="fas fa-file-medical"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Simulador PEP</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4 flex-grow">
              Pratique o preenchimento do Prontuário Eletrônico seguindo as etapas do Processo de Enfermagem (COFEN).
            </p>
            <ul className="text-xs space-y-2 opacity-80 font-medium">
              <li className="flex items-center"><i className="fas fa-check text-teal-500 mr-2 w-4"></i>Cenários Guiados</li>
              <li className="flex items-center"><i className="fas fa-check text-teal-500 mr-2 w-4"></i>Validação Automática</li>
            </ul>
          </div>

          {/* Card 3: Bomba de Infusão */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white text-2xl mb-5 shadow-lg shadow-indigo-500/30">
              <i className="fas fa-syringe"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Bomba de Infusão</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4 flex-grow">
              Opere bombas volumétricas e de seringa com simulação de tempo real, alarmes sonoros visuais e bloqueios (Lockout).
            </p>
            <ul className="text-xs space-y-2 opacity-80 font-medium">
              <li className="flex items-center"><i className="fas fa-check text-indigo-500 mr-2 w-4"></i>Controle de Vazão/VTBI</li>
              <li className="flex items-center"><i className="fas fa-check text-indigo-500 mr-2 w-4"></i>Simulação de Alarmes</li>
            </ul>
          </div>

          {/* Card 4: Protocolos Clínicos */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-sky-600 flex items-center justify-center text-white text-2xl mb-5 shadow-lg shadow-blue-500/30">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Protocolos Clínicos</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4 flex-grow">
              Checklists iterativos e algoritmos de emergência para PCR, Sepse, AVC e Queimaduras baseados em diretrizes globais.
            </p>
            <ul className="text-xs space-y-2 opacity-80 font-medium">
              <li className="flex items-center"><i className="fas fa-check text-blue-500 mr-2 w-4"></i>Acesso Rápido</li>
              <li className="flex items-center"><i className="fas fa-check text-blue-500 mr-2 w-4"></i>Passo a Passo</li>
            </ul>
          </div>

          {/* Card 5: Escalas de Emergência */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-2xl mb-5 shadow-lg shadow-red-500/30">
              <i className="fas fa-heartbeat"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Escalas Clínicas</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4 flex-grow">
              Avalie o paciente agudamente com calculadoras de Glasgow, NEWS2, Dor e IMC para uma triagem rápida.
            </p>
            <ul className="text-xs space-y-2 opacity-80 font-medium">
              <li className="flex items-center"><i className="fas fa-check text-red-500 mr-2 w-4"></i>Interpretação IA</li>
              <li className="flex items-center"><i className="fas fa-check text-red-500 mr-2 w-4"></i>Triagem Objetiva</li>
            </ul>
          </div>

          {/* Card 6: Cálculos Clínicos */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-2xl mb-5 shadow-lg shadow-cyan-500/30">
              <i className="fas fa-calculator"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Doses & Cálculos</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4 flex-grow">
              Gotejamento de soro, conversões complexas e doses de emergência (adulto/pediátrico). Veja a lógica matemática por trás.
            </p>
            <ul className="text-xs space-y-2 opacity-80 font-medium">
              <li className="flex items-center"><i className="fas fa-check text-cyan-500 mr-2 w-4"></i>Gotas/Microgotas</li>
              <li className="flex items-center"><i className="fas fa-check text-cyan-500 mr-2 w-4"></i>Regra de Três</li>
            </ul>
          </div>

          {/* Card 7: Simulador de Quiz */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-400 to-purple-600 flex items-center justify-center text-white text-2xl mb-5 shadow-lg shadow-fuchsia-500/30">
              <i className="fas fa-check-double"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Quizzes Inteligentes</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4 flex-grow">
              A IA gera simulados inéditos baseados no que você quer estudar, avaliando seu conhecimento em tempo real.
            </p>
            <ul className="text-xs space-y-2 opacity-80 font-medium">
              <li className="flex items-center"><i className="fas fa-check text-fuchsia-500 mr-2 w-4"></i>Gabarito Comentado</li>
              <li className="flex items-center"><i className="fas fa-check text-fuchsia-500 mr-2 w-4"></i>Infinitos Tópicos</li>
            </ul>
          </div>

          {/* Card 8: Gamificação */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-2xl mb-5 shadow-lg shadow-orange-500/30">
              <i className="fas fa-star"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Gamificação</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4 flex-grow">
              Estudar pode ser divertido! Ganhe XP por seus acertos, suba no ranking de títulos e destrave seu conhecimento clínico.
            </p>
            <ul className="text-xs space-y-2 opacity-80 font-medium">
              <li className="flex items-center"><i className="fas fa-check text-amber-500 mr-2 w-4"></i>Evolução Contínua</li>
              <li className="flex items-center"><i className="fas fa-check text-amber-500 mr-2 w-4"></i>Níveis de Perícia</li>
            </ul>
          </div>

        </div>
      </div>

      {/* RESPONSIVO WARNING */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center gap-6 ${darkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl flex-shrink-0 shadow-lg">
          <i className="fas fa-mobile-alt"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">100% Mobile-First e Offline Ready</h3>
          <p className="opacity-80 text-sm leading-relaxed">
            Sabemos que o ambiente hospitalar e de estudos nem sempre tem a melhor conexão ou tempo livre. O MonicAI se adapta a qualquer tela, cabe no seu bolso e garante sua privacidade total de dados salvando localmente as informações.
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default PresentationView;
