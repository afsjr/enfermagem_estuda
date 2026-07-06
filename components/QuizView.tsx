import React, { useState } from 'react';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number; // Index of correct option (0 to 3)
  explanation: string;
}

interface QuizViewProps {
  onGenerateQuiz: (topic: string) => Promise<QuizQuestion[]>;
  onAwardXp: (xp: number) => void;
  onIncrementQuizzes: (topic: string, score: string) => void;
  darkMode?: boolean;
  initialTopic?: string;
}

const QuizView: React.FC<QuizViewProps> = ({
  onGenerateQuiz,
  onAwardXp,
  onIncrementQuizzes,
  darkMode,
  initialTopic
}) => {
  const [topicInput, setTopicInput] = useState<string>(initialTopic || 'Sinais Vitais e Monitorização');
  
  React.useEffect(() => {
    if (initialTopic) {
      setTopicInput(initialTopic);
    }
  }, [initialTopic]);
  const [loading, setLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const startTopics = [
    'Administração de Medicamentos',
    'Cálculo de Seringas e Gotejamento',
    'Assistência de Enfermagem em PCR',
    'Curativos e Feridas',
    'Sinais Vitais e Valores de Referência',
    'Código de Ética do COFEN'
  ];

  const handleGenerate = async (topic: string) => {
    if (!topic.trim()) return;
    setLoading(true);
    setQuestions([]);
    setShowSummary(false);
    setCurrentIdx(0);
    setCorrectAnswers(0);
    setIsAnswered(false);
    setSelectedOption(null);

    try {
      const generated = await onGenerateQuiz(topic);
      if (generated && generated.length > 0) {
        setQuestions(generated);
      } else {
        alert('Não foi possível carregar as perguntas do quiz. Tente novamente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar o quiz pela Inteligência Artificial. Verifique sua conexão e chave API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    setIsAnswered(true);

    const isCorrect = selectedOption === questions[currentIdx].answer;
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Finished
      setShowSummary(true);
      onIncrementQuizzes(topicInput, `${correctAnswers}/${questions.length}`);
      // Award XP: 20 XP per correct answer
      const xpEarned = correctAnswers * 20;
      onAwardXp(xpEarned);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setShowSummary(false);
    setCurrentIdx(0);
    setCorrectAnswers(0);
    setIsAnswered(false);
    setSelectedOption(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto overflow-y-auto h-full flex flex-col pb-24 lg:pb-6">
      {questions.length === 0 && !loading && (
        // Setup State
        <div className={`p-6 rounded-2xl border text-center space-y-6 ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'}`}>
          <div className="space-y-2">
            <h3 className="font-bold text-lg md:text-xl text-[#b22222] dark:text-[#ff8888] uppercase tracking-wider">Simulador de Quiz com IA</h3>
            <p className={`text-xs md:text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Escolha ou digite um tema clínico de enfermagem e nossa inteligência artificial criará um simulado com 5 questões de múltipla escolha.
            </p>
          </div>

          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Digite um assunto técnico..."
              className={`flex-1 p-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#FFCC00] ${
                darkMode ? 'bg-[#1a1a1a] border-[#444] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
            <button
              onClick={() => handleGenerate(topicInput)}
              className="px-5 py-3 bg-[#b22222] hover:bg-[#8b0000] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0"
            >
              Criar Quiz
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t dark:border-slate-200/10">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Sugestões de Estudos:</h4>
            <div className="flex flex-wrap gap-2 justify-start">
              {startTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    setTopicInput(topic);
                    handleGenerate(topic);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    darkMode
                      ? 'bg-[#1e1e1e] border-[#444] text-slate-300 hover:border-[#FFCC00]'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#b22222]'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        // Loading State
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <span className="absolute w-full h-full border-4 border-[#b22222]/20 border-t-[#b22222] rounded-full animate-spin"></span>
            <i className="fas fa-stethoscope text-2xl text-[#b22222] animate-pulse"></i>
          </div>
          <div className="text-center space-y-1">
            <h4 className="font-bold text-sm uppercase tracking-widest text-[#b22222] dark:text-[#ff8888]">O MonicAI está preparando seu simulado...</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Aguarde a estruturação clínica das questões</p>
          </div>
        </div>
      )}

      {questions.length > 0 && !showSummary && (
        // Play State
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header / Progress Bar */}
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider opacity-60">
              <span>Questão {currentIdx + 1} de {questions.length}</span>
              <span className="text-[#b22222] dark:text-[#ff8888]"><i className="fas fa-heartbeat animate-pulse mr-1"></i> Simulação Clínica</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-[#333] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#b22222] h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <div className={`p-5 rounded-2xl border text-sm md:text-base font-bold leading-relaxed ${
              darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'
            }`}>
              {questions[currentIdx].question}
            </div>

            {/* Option Buttons */}
            <div className="space-y-2">
              {questions[currentIdx].options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrectAnswer = questions[currentIdx].answer === idx;
                
                let buttonStyle = darkMode
                  ? 'bg-[#1e1e1e] border-[#333] hover:border-[#FFCC00] text-slate-300'
                  : 'bg-white border-slate-200 hover:border-[#b22222] text-slate-700';

                if (isSelected && !isAnswered) {
                  buttonStyle = 'border-[#FFCC00] bg-[#fffdf0] dark:bg-amber-500/10 text-amber-800 dark:text-amber-300';
                }

                if (isAnswered) {
                  if (isCorrectAnswer) {
                    buttonStyle = 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400';
                  } else if (isSelected) {
                    buttonStyle = 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400';
                  } else {
                    buttonStyle = 'opacity-40 border-transparent bg-slate-100 dark:bg-[#1a1a1a]';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 sm:p-4 min-h-[52px] rounded-xl border text-left text-xs md:text-sm font-semibold flex items-center gap-3 transition-all ${buttonStyle}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] border shrink-0 ${
                      isAnswered && isCorrectAnswer
                        ? 'bg-green-500 border-green-500 text-white'
                        : isAnswered && isSelected && !isCorrectAnswer
                          ? 'bg-red-500 border-red-500 text-white'
                          : isSelected
                            ? 'bg-[#FFCC00] border-[#FFCC00] text-[#003366]'
                            : 'bg-slate-100 dark:bg-[#252525] border-slate-300 dark:border-[#444]'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback / Explanation */}
            {isAnswered && (
              <div className={`p-5 rounded-2xl border space-y-2 animate-[fadeIn_0.3s_ease-out] ${
                selectedOption === questions[currentIdx].answer
                  ? 'bg-green-50/50 dark:bg-green-500/5 border-green-200 dark:border-green-500/10'
                  : 'bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/10'
              }`}>
                <h5 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  selectedOption === questions[currentIdx].answer ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                }`}>
                  <i className={`fas ${selectedOption === questions[currentIdx].answer ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                  {selectedOption === questions[currentIdx].answer ? 'Resposta Correta!' : 'Resposta Incorreta!'}
                </h5>
                <p className={`text-xs leading-relaxed font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <strong>Explicação Clínica:</strong> {questions[currentIdx].explanation}
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2">
            {!isAnswered ? (
              <button
                disabled={selectedOption === null}
                onClick={handleSubmitAnswer}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#FFCC00] text-[#003366] rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 hover:scale-105 transition-all shadow-md"
              >
                Confirmar Resposta <i className="fas fa-check ml-1.5"></i>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#b22222] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8b0000] hover:scale-105 transition-all shadow-md"
              >
                {currentIdx < questions.length - 1 ? 'Próxima Questão' : 'Ver Resultado'} <i className="fas fa-arrow-right ml-1.5"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {showSummary && (
        // Completed State
        <div className={`p-6 rounded-2xl border text-center space-y-6 ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'}`}>
          <div className="space-y-2">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner border border-amber-200 dark:border-amber-500/20">
              🏆
            </div>
            <h3 className="font-bold text-xl uppercase tracking-wider text-[#b22222] dark:text-[#ff8888]">Simulado Concluído!</h3>
            <p className="text-sm font-semibold opacity-70">Parabéns por testar seus conhecimentos e investir na segurança do seu paciente.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[9px] font-black uppercase tracking-wider opacity-60">Acertos</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{correctAnswers} / {questions.length}</p>
            </div>
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#1a1a1a] border-[#333]' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[9px] font-black uppercase tracking-wider opacity-60">Recompensa</span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">+{correctAnswers * 20} XP</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={resetQuiz}
              className="px-5 py-3 border border-[#b22222] text-[#b22222] dark:text-[#ff8888] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#b22222]/10 transition-all"
            >
              Criar Novo Quiz
            </button>
            <button
              onClick={() => handleGenerate(topicInput)}
              className="px-5 py-3 bg-[#b22222] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8b0000] hover:scale-105 transition-all shadow-md"
            >
              Refazer Este Quiz
            </button>
          </div>
        </div>
      )}

      {/* Mandatory citation footer as required */}
      <section className={`p-4 rounded-xl border text-[11px] leading-relaxed font-semibold mt-auto ${
        darkMode ? 'bg-[#1e1e1e] border-[#333] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <p className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
          <i className="fas fa-exclamation-triangle"></i> Atenção Estudante
        </p>
        <p className="mb-2">
          As perguntas e gabaritos deste simulador são gerados em tempo real pela IA com base em diretrizes científicas consolidadas na literatura técnica de enfermagem.
        </p>
        <p className="text-[10px]">
          <strong>Importante:</strong> Sempre diversifique suas fontes de consulta e estudo. Não utilize este simulador como única fonte de aprendizado. Consulte livros de farmacologia, os manuais técnicos do Ministério da Saúde e as resoluções vigentes do Conselho Federal de Enfermagem (COFEN) para enriquecer e aprofundar seus conhecimentos profissionais.
        </p>
      </section>
    </div>
  );
};

export default QuizView;
