import React, { useState, useEffect } from 'react';
import { telemetry } from '../telemetryService';
import { supabase } from '../supabaseClient';

interface InstitutionSurveyProps {
  darkMode?: boolean;
  onNavigate: (view: string) => void;
}

interface Ratings {
  ensino: number | null;
  professores: number | null;
  secretaria: number | null;
  coordenacao: number | null;
  estrutura: number | null;
  limpeza: number | null;
  tecnologia: number | null;
  comunicacao: number | null;
  seguranca: number | null;
  necessidades: number | null;
}

const criteriaList = [
  { id: 'ensino', label: 'Qualidade do ensino' },
  { id: 'professores', label: 'Didática dos professores' },
  { id: 'secretaria', label: 'Atendimento da secretaria' },
  { id: 'coordenacao', label: 'Coordenação do curso' },
  { id: 'estrutura', label: 'Estrutura física (salas, labs, biblioteca)' },
  { id: 'limpeza', label: 'Limpeza e organização' },
  { id: 'tecnologia', label: 'Recursos tecnológicos' },
  { id: 'comunicacao', label: 'Comunicação da instituição' },
  { id: 'seguranca', label: 'Segurança nas dependências' },
  { id: 'necessidades', label: 'Atendimento às necessidades dos estudantes' },
];

const InstitutionSurvey: React.FC<InstitutionSurveyProps> = ({ darkMode, onNavigate }) => {
  const [step, setStep] = useState<'intro' | 'form' | 'thanks'>('intro');
  const [ano, setAno] = useState<'1º ano' | '2º ano' | null>(null);
  const [turno, setTurno] = useState<'Manhã e tarde' | 'Noite' | null>(null);
  const [ratings, setRatings] = useState<Ratings>({
    ensino: null,
    professores: null,
    secretaria: null,
    coordenacao: null,
    estrutura: null,
    limpeza: null,
    tecnologia: null,
    comunicacao: null,
    seguranca: null,
    necessidades: null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  useEffect(() => {
    const voted = localStorage.getItem('monicai_inst_survey_voted');
    if (voted === 'true') {
      setAlreadyVoted(true);
      setStep('thanks');
    }
  }, []);

  const handleRating = (id: keyof Ratings, value: number) => {
    setRatings(prev => ({ ...prev, [id]: value }));
  };

  const isFormComplete = () => {
    if (!ano || !turno) return false;
    return Object.values(ratings).every(r => r !== null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Local backup
    localStorage.setItem('monicai_inst_survey_voted', 'true');
    setAlreadyVoted(true);

    // Enviar para Supabase
    try {
      await supabase.from('institution_survey').insert([
        {
          curso: 'Técnico em Enfermagem',
          ano: ano,
          turno: turno,
          q_ensino: ratings.ensino,
          q_professores: ratings.professores,
          q_secretaria: ratings.secretaria,
          q_coordenacao: ratings.coordenacao,
          q_estrutura: ratings.estrutura,
          q_limpeza: ratings.limpeza,
          q_tecnologia: ratings.tecnologia,
          q_comunicacao: ratings.comunicacao,
          q_seguranca: ratings.seguranca,
          q_necessidades: ratings.necessidades,
        }
      ]);
    } catch (err) {
      console.error('Falha ao salvar no Supabase:', err);
    }

    // Telemetry
    telemetry.logEvent({
      actionType: 'inst_survey_completed',
      screenName: 'institution_survey',
      actionDetail: `Ano: ${ano} | Turno: ${turno}`,
    });

    setStep('thanks');
    setIsSubmitting(false);
  };

  const cardClass = `rounded-2xl border transition-all shadow-sm p-5 md:p-6 mb-6 ${
    darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-slate-200'
  }`;

  return (
    <div className={`h-full overflow-y-auto ${darkMode ? 'bg-[#121212] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-[#003366]'}`}>
              Pesquisa de Satisfação
            </h1>
            <p className="text-sm opacity-70">Avaliação Institucional</p>
          </div>
        </div>

        {/* --- STEP 1: INTRO --- */}
        {step === 'intro' && (
          <div className={`${cardClass} text-center space-y-6 py-12`}>
            <div className="w-20 h-20 bg-gradient-to-br from-[#003366] to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 transform rotate-3">
              <i className="fas fa-clipboard-list text-3xl text-white -rotate-3"></i>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>Sua opinião é importante!</h2>
              <p className="text-sm opacity-80 leading-relaxed">
                Prezado(a) estudante, queremos ouvir você para melhorarmos continuamente nossos serviços. 
                Esta pesquisa é <strong>confidencial</strong> e levará menos de 5 minutos.
              </p>
            </div>

            <button
              onClick={() => setStep('form')}
              className="mt-8 px-8 py-3 bg-[#003366] text-white rounded-xl font-bold uppercase tracking-wide hover:bg-[#002244] transition-colors shadow-md hover:shadow-lg active:scale-95"
            >
              Começar Avaliação
            </button>
          </div>
        )}

        {/* --- STEP 2: FORM --- */}
        {step === 'form' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className={cardClass}>
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                <i className="fas fa-user-graduate text-[#003366] dark:text-blue-400"></i> Informações Gerais
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Curso</label>
                  <div className={`p-3 rounded-lg border ${darkMode ? 'bg-black/20 border-[#333] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'} font-medium cursor-not-allowed opacity-80`}>
                    Técnico em Enfermagem
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Ano de Formação</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['1º ano', '2º ano'].map((a) => (
                      <button
                        key={a}
                        onClick={() => setAno(a as any)}
                        className={`py-3 rounded-xl border-2 transition-all font-semibold ${
                          ano === a 
                            ? 'border-[#003366] bg-[#003366]/10 text-[#003366] dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-400' 
                            : darkMode ? 'border-[#333] hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Turno</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Manhã e tarde', 'Noite'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTurno(t as any)}
                        className={`py-3 rounded-xl border-2 transition-all font-semibold ${
                          turno === t 
                            ? 'border-[#003366] bg-[#003366]/10 text-[#003366] dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-400' 
                            : darkMode ? 'border-[#333] hover:border-slate-500' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <i className="fas fa-star text-amber-400"></i> Avaliação Geral
                </h3>
                <p className="text-xs opacity-70 mt-1">Avalie de 1 (Muito insatisfeito) a 5 (Muito satisfeito)</p>
              </div>

              <div className="space-y-8">
                {criteriaList.map((crit, index) => (
                  <div key={crit.id} className={`pb-6 ${index !== criteriaList.length - 1 ? (darkMode ? 'border-b border-[#333]' : 'border-b border-slate-100') : ''}`}>
                    <p className="font-semibold mb-3">{index + 1}. {crit.label}</p>
                    <div className="flex justify-between md:justify-start md:gap-4">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const isSelected = ratings[crit.id as keyof Ratings] === num;
                        let colorClass = '';
                        if (isSelected) {
                          if (num <= 2) colorClass = 'bg-red-500 text-white border-red-500';
                          else if (num === 3) colorClass = 'bg-amber-500 text-white border-amber-500';
                          else colorClass = 'bg-green-500 text-white border-green-500';
                        } else {
                          colorClass = darkMode ? 'border-[#444] text-slate-400 hover:border-slate-300' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300';
                        }
                        
                        return (
                          <button
                            key={num}
                            onClick={() => handleRating(crit.id as keyof Ratings, num)}
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 text-lg font-bold flex items-center justify-center transition-all shadow-sm ${colorClass} ${isSelected ? 'scale-110 shadow-md' : 'active:scale-95'}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={handleSubmit}
                disabled={!isFormComplete() || isSubmitting}
                className="w-full md:w-auto px-12 py-4 bg-[#003366] text-white rounded-xl font-black uppercase tracking-wider hover:bg-[#002244] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                {isSubmitting ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i> Enviando...</>
                ) : (
                  <><i className="fas fa-paper-plane mr-2"></i> Concluir Pesquisa</>
                )}
              </button>
              <p className="text-xs font-bold uppercase tracking-wider mt-3 opacity-50">
                {!isFormComplete() ? 'Preencha todos os campos para enviar' : 'Pronto para enviar!'}
              </p>
            </div>
          </div>
        )}

        {/* --- STEP 3: THANKS --- */}
        {step === 'thanks' && (
          <div className={`${cardClass} text-center space-y-6 py-12 animate-fadeIn`}>
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-500/20 mb-6">
              <i className="fas fa-check text-4xl text-white"></i>
            </div>
            
            <h2 className="text-3xl font-black text-green-500">Muito Obrigado!</h2>
            <p className="text-base opacity-80 max-w-md mx-auto">
              Sua opinião foi registrada com sucesso. Ela é fundamental para o aprimoramento contínuo da nossa instituição.
            </p>

            <button
              onClick={() => onNavigate('dashboard')}
              className="mt-8 px-8 py-3 bg-slate-200 text-slate-800 dark:bg-[#333] dark:text-white rounded-xl font-bold uppercase tracking-wide hover:opacity-80 transition-opacity"
            >
              Voltar ao Início
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default InstitutionSurvey;
