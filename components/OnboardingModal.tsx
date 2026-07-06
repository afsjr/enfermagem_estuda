import React, { useState } from 'react';
import { StudentProfile } from '../telemetryService';

interface OnboardingModalProps {
  onComplete: (profile: StudentProfile) => void;
  darkMode: boolean;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, darkMode }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [semester, setSemester] = useState<string>('');
  const [interest, setInterest] = useState<string>('');

  const semesters = [
    '1º Módulo (Iniciante)',
    '2º Módulo (Fundamentos)',
    '3º Módulo (Prática Clínica)',
    '4º Módulo (Estágio/Conclusão)'
  ];

  const interests = [
    'Fundamentos & Procedimentos',
    'Farmacologia & Administração',
    'Anatomia & Fisiologia',
    'Saúde da Mulher & Pediatria',
    'Urgência, Emergência & UTI',
    'Ética & Legislação'
  ];

  const handleNext = () => {
    if (step === 1 && semester) {
      setStep(2);
    }
  };

  const handleSubmit = () => {
    if (semester && interest) {
      onComplete({
        courseSemester: semester,
        moduleInterest: interest
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Modal Container */}
      <div 
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl border-2 border-[#FFCC00] overflow-hidden transition-all duration-300 transform scale-100 ${
          darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-slate-800'
        }`}
      >
        {/* Header com a identidade MonicAI */}
        <div className="bg-[#b22222] text-white p-5 border-b border-[#FFCC00]/30 text-center relative">
          <div className="w-12 h-12 bg-[#FFCC00] text-[#003366] rounded-full flex items-center justify-center mx-auto mb-2 text-xl shadow-md">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h2 className="font-black text-sm uppercase tracking-wider">Boas-vindas ao MonicAI! 🩺</h2>
          <p className="text-[10px] text-[#FFCC00] uppercase font-bold tracking-widest mt-1">Excelência no Ensino de Saúde</p>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <div className="text-center space-y-1.5">
                <h3 className="font-bold text-sm uppercase tracking-wide">Qual é o seu Módulo/Semestre atual?</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Para ajustarmos o nível didático das respostas do tutor.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {semesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSemester(sem)}
                    className={`w-full p-3.5 rounded-xl border-2 text-left text-xs font-bold transition-all flex items-center justify-between ${
                      semester === sem
                        ? 'border-[#b22222] bg-[#b22222]/10 text-[#b22222] dark:text-[#ff8888]'
                        : darkMode
                          ? 'border-[#333] bg-[#252525] hover:border-[#FFCC00] text-slate-300'
                          : 'border-slate-200 bg-slate-50 hover:border-[#b22222] text-slate-700'
                    }`}
                  >
                    <span>{sem}</span>
                    {semester === sem && <i className="fas fa-check text-xs"></i>}
                  </button>
                ))}
              </div>

              <button
                disabled={!semester}
                onClick={handleNext}
                className="w-full py-3 bg-[#b22222] hover:bg-[#8b0000] text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md mt-6 flex items-center justify-center gap-2"
              >
                <span>Próximo Passo</span>
                <i className="fas fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <div className="text-center space-y-1.5">
                <h3 className="font-bold text-sm uppercase tracking-wide">Qual sua maior área de interesse?</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Mapeia seus estudos para que possamos sugerir e focar os melhores materiais.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {interests.map((int) => (
                  <button
                    key={int}
                    onClick={() => setInterest(int)}
                    className={`p-3 rounded-xl border-2 text-center text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1.5 min-h-[70px] ${
                      interest === int
                        ? 'border-[#b22222] bg-[#b22222]/10 text-[#b22222] dark:text-[#ff8888]'
                        : darkMode
                          ? 'border-[#333] bg-[#252525] hover:border-[#FFCC00] text-slate-300'
                          : 'border-slate-200 bg-slate-50 hover:border-[#b22222] text-slate-700'
                    }`}
                  >
                    <span className="leading-snug">{int}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 border-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    darkMode ? 'border-[#333] hover:bg-[#252525] text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Voltar
                </button>
                <button
                  disabled={!interest}
                  onClick={handleSubmit}
                  className="flex-[2] py-3 bg-[#FFCC00] text-[#003366] hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Iniciar Estudos!</span>
                  <i className="fas fa-stethoscope text-xs"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Informativo sobre LGPD */}
        <div className={`p-4 border-t text-[9px] text-center font-bold tracking-tight opacity-50 ${
          darkMode ? 'border-[#333] bg-[#121212]' : 'border-slate-100 bg-slate-50'
        }`}>
          🔒 Seus dados são 100% anônimos e confidenciais. Não coletamos nome, e-mail ou matrícula, respeitando a LGPD.
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
