import React from 'react';

interface PresentationViewProps {
  onBack: () => void;
  darkMode?: boolean;
}

export const PresentationView: React.FC<PresentationViewProps> = ({ onBack, darkMode }) => {
  return (
    <div className={`p-4 md:p-8 max-w-6xl mx-auto overflow-y-auto h-full pb-24 lg:pb-8 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      
      {/* HEADER HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 md:p-12 rounded-3xl shadow-2xl mb-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 animate-fadeIn">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-md">Bem-vindo ao MonicAI</h1>
          <p className="text-lg md:text-xl font-medium opacity-90 mb-8 leading-relaxed">
            Seu tutor digital interativo e clínica simulada de bolso. Projetado para revolucionar o ensino técnico em enfermagem através da Inteligência Artificial.
          </p>
          <button 
            onClick={onBack}
            className="bg-white text-indigo-700 hover:bg-slate-100 hover:scale-105 transition-all duration-300 font-black py-4 px-8 rounded-full shadow-xl flex items-center justify-center gap-3 w-full md:w-auto"
          >
            <i className="fas fa-arrow-left text-lg"></i>
            Acessar a Plataforma
          </button>
        </div>
        
        <div className="relative z-10 w-40 h-40 md:w-64 md:h-64 flex-shrink-0 animate-pulse">
          <div className="w-full h-full bg-white/20 backdrop-blur-md rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center border border-white/30">
            <i className="fas fa-heartbeat text-7xl md:text-9xl text-white drop-shadow-lg"></i>
          </div>
        </div>
      </div>

      {/* FERRAMENTAS SECTION */}
      <div className="mb-12">
        <h2 className="text-3xl font-black mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          Nossas Ferramentas Interativas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: PEP */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-teal-500/30">
              <i className="fas fa-file-medical"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Simulador PEP</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4">
              Pratique o preenchimento do Prontuário Eletrônico seguindo as 5 etapas do Processo de Enfermagem (COFEN).
            </p>
            <ul className="text-sm space-y-2 opacity-80 font-medium">
              <li><i className="fas fa-check text-teal-500 mr-2"></i>Cenários Guiados</li>
              <li><i className="fas fa-check text-teal-500 mr-2"></i>Modo Professor com IA</li>
              <li><i className="fas fa-check text-teal-500 mr-2"></i>Validação Automática</li>
            </ul>
          </div>

          {/* Card 2: Bomba de Infusão */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-indigo-500/30">
              <i className="fas fa-syringe"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Bomba de Infusão</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4">
              Aprenda a operar bombas volumétricas, de seringa e módulos PCA com simulação de tempo real (1s = 30s) e alertas sonoros visuais.
            </p>
            <ul className="text-sm space-y-2 opacity-80 font-medium">
              <li><i className="fas fa-check text-indigo-500 mr-2"></i>Controle de Vazão/VTBI</li>
              <li><i className="fas fa-check text-indigo-500 mr-2"></i>Simulação de Alarmes</li>
              <li><i className="fas fa-check text-indigo-500 mr-2"></i>Modo PCA com Lockout</li>
            </ul>
          </div>

          {/* Card 3: Tutor IA */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-rose-500/30">
              <i className="fas fa-robot"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">MonicAI Tutor</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4">
              Tire dúvidas clínicas a qualquer hora. Nosso motor Gemini está configurado para não alucinar e basear-se estritamente na literatura de enfermagem.
            </p>
            <ul className="text-sm space-y-2 opacity-80 font-medium">
              <li><i className="fas fa-check text-rose-500 mr-2"></i>Respostas Baseadas em Evidências</li>
              <li><i className="fas fa-check text-rose-500 mr-2"></i>Geração de Quizzes</li>
              <li><i className="fas fa-check text-rose-500 mr-2"></i>Feedback Educacional</li>
            </ul>
          </div>

          {/* Card 4: Calculadora */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-cyan-500/30">
              <i className="fas fa-calculator"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Cálculos Clínicos</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4">
              Gotejamento de soro (gotas/microgotas), conversão de penicilina, heparina e regra de três. Calcule com segurança e verifique os passos lógicos.
            </p>
          </div>

          {/* Card 5: Gamificação */}
          <div className={`p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-100 shadow-lg'}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-orange-500/30">
              <i className="fas fa-star"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Gamificação & Progresso</h3>
            <p className="opacity-70 text-sm leading-relaxed mb-4">
              Cada acerto nos simuladores e quizzes rende XP (Pontos de Experiência). Suba de nível (Estagiário, Técnico, Enfermeiro) e mantenha seu Streak!
            </p>
          </div>
        </div>
      </div>

      {/* RESPONSIVO WARNING */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center gap-6 ${darkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
        <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0">
          <i className="fas fa-mobile-alt"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">100% Mobile-First</h3>
          <p className="opacity-80 text-sm leading-relaxed">
            Sabemos que a maioria dos estudantes e profissionais utiliza celulares. O MonicAI foi desenhado para caber perfeitamente no seu bolso. A navegação, os formulários e os simuladores de bomba de infusão se adaptam a qualquer tela.
          </p>
        </div>
      </div>
      
    </div>
  );
};

export default PresentationView;
