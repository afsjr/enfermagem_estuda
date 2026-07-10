import React, { useState, useEffect } from 'react';
import { GeminiService } from '../geminiService';

interface PepSimulatorProps {
  onAwardXp: (xpEarned: number) => void;
  darkMode?: boolean;
}

type PepStage = 'identificacao' | 'avaliacao' | 'diagnostico' | 'planejamento' | 'evolucao';

interface Scenario {
  id: string;
  title: string;
  description: string;
  prefill?: Partial<PepData>;
}

interface PepData {
  // Identificação
  nome: string;
  idade: string;
  leito: string;
  comorbidades: string;
  alergias: string;
  // Avaliação
  sinaisVitais: string;
  exameFisico: string;
  queixaPrincipal: string;
  // Diagnóstico
  diagnosticos: string;
  // Planejamento
  intervencoes: string;
  // Evolução
  evolucaoText: string;
  assinatura: string;
}

const defaultScenarios: Scenario[] = [
  {
    id: 's1',
    title: 'Pós-operatório',
    description: 'Maria, 45 anos, PO imediato de colecistectomia.',
    prefill: {
      nome: 'Maria da Silva',
      idade: '45',
      leito: '102-A',
      comorbidades: 'Hipertensão',
      alergias: 'Dipirona',
      sinaisVitais: 'PA: 130x80 mmHg, FC: 88 bpm, FR: 18 irpm, Tax: 36.5°C, SpO2: 98% aa',
      queixaPrincipal: 'Dor na região abdominal, avaliada como 6/10 na escala visual.'
    }
  },
  {
    id: 's2',
    title: 'Idoso c/ Fratura',
    description: 'João, 78 anos, fratura de colo de fêmur, aguardando cirurgia.',
    prefill: {
      nome: 'João de Souza',
      idade: '78',
      leito: '205-B',
      comorbidades: 'Diabetes tipo 2, Alzheimer inicial',
      alergias: 'Nega alergias conhecidas',
      queixaPrincipal: 'Dor intensa no quadril direito (8/10), impotência funcional.'
    }
  }
];

const emptyPep: PepData = {
  nome: '', idade: '', leito: '', comorbidades: '', alergias: '',
  sinaisVitais: '', exameFisico: '', queixaPrincipal: '',
  diagnosticos: '', intervencoes: '', evolucaoText: '', assinatura: ''
};

export const PepSimulator: React.FC<PepSimulatorProps> = ({ onAwardXp, darkMode }) => {
  const [activeStage, setActiveStage] = useState<PepStage>('identificacao');
  const [data, setData] = useState<PepData>(emptyPep);
  const [scenarios, setScenarios] = useState<Scenario[]>(defaultScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  
  // Feedback from Gemini
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);
  
  // Teacher mode
  const [teacherMode, setTeacherMode] = useState(false);
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);

  const gemini = new GeminiService();

  const handleInputChange = (field: keyof PepData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const loadScenario = (s: Scenario) => {
    setActiveScenarioId(s.id);
    setData({ ...emptyPep, ...(s.prefill || {}) });
    setEvaluationFeedback(null);
    setActiveStage('identificacao');
  };

  const calcCompleteness = () => {
    let filled = 0;
    const keys = Object.keys(data) as Array<keyof PepData>;
    keys.forEach(k => {
      if (data[k].trim().length > 0) filled++;
    });
    return Math.round((filled / keys.length) * 100);
  };

  const evaluatePep = async () => {
    setIsEvaluating(true);
    setEvaluationFeedback(null);
    try {
      const prompt = `O aluno preencheu o seguinte Prontuário Eletrônico (PEP):\n
Identificação: ${data.nome}, ${data.idade} anos. Alergias: ${data.alergias}
Avaliação: ${data.sinaisVitais} | Exame: ${data.exameFisico} | Queixa: ${data.queixaPrincipal}
Diagnóstico Enfermagem: ${data.diagnosticos}
Intervenções: ${data.intervencoes}
Evolução: ${data.evolucaoText}

Forneça um feedback construtivo e educacional (máximo 4 parágrafos) apontando erros, omissões ou elogiando o preenchimento, baseado nas normas do COFEN (Res. 736/2024). Fale diretamente com o aluno.`;

      const response = await gemini.chat([{ role: 'user', content: prompt }]);
      setEvaluationFeedback(response);
      onAwardXp(20);
    } catch (e: any) {
      setEvaluationFeedback("Erro ao validar com a IA: " + e.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  const generateNewScenario = async () => {
    if (!newScenarioDesc.trim()) return;
    setIsGeneratingScenario(true);
    try {
      const prompt = `Crie um cenário clínico para estudantes de enfermagem praticarem no PEP. Tema: ${newScenarioDesc}.
      Retorne APENAS um JSON válido no formato:
      {
        "title": "título curto",
        "description": "descrição breve do caso",
        "prefill": {
          "nome": "nome fictício", "idade": "idade", "leito": "leito", "comorbidades": "...", "alergias": "...", "queixaPrincipal": "...", "sinaisVitais": "..."
        }
      }`;
      const response = await gemini.chat([{ role: 'user', content: prompt }]);
      
      // Attempt to parse JSON from markdown code block if present
      let jsonStr = response;
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0];
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0];
      }

      const parsed = JSON.parse(jsonStr.trim());
      const newScenario: Scenario = {
        id: 's' + Date.now(),
        title: parsed.title || 'Novo Cenário',
        description: parsed.description || newScenarioDesc,
        prefill: parsed.prefill || {}
      };
      
      setScenarios(prev => [...prev, newScenario]);
      setTeacherMode(false);
      setNewScenarioDesc('');
      alert("Cenário criado com sucesso!");
    } catch (e: any) {
      alert("Falha ao gerar cenário. Tente ser mais específico na descrição. Erro: " + e.message);
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const completeness = calcCompleteness();

  return (
    <div className={`p-4 md:p-6 max-w-5xl mx-auto overflow-y-auto h-full pb-24 lg:pb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      
      {/* HEADER E CENÁRIOS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-teal-900/10 p-4 rounded-xl border border-teal-600/20 mb-6 gap-4">
        <div>
          <h2 className="font-bold text-teal-600 dark:text-teal-400 text-xl flex items-center gap-2">
            <i className="fas fa-file-medical"></i> Simulador PEP (Processo de Enfermagem)
          </h2>
          <p className="text-sm opacity-70">Baseado nas Resoluções COFEN 736/2024 e 754/2024</p>
        </div>
        
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <select 
            className="p-3 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-600 text-base min-h-[44px]"
            value={activeScenarioId || ''}
            onChange={(e) => {
              const s = scenarios.find(x => x.id === e.target.value);
              if (s) loadScenario(s);
              else if (e.target.value === 'empty') { setActiveScenarioId(null); setData(emptyPep); setEvaluationFeedback(null); }
            }}
          >
            <option value="empty">Novo Prontuário Vazio</option>
            {scenarios.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <button onClick={() => setTeacherMode(!teacherMode)} className="text-xs text-teal-600 underline text-right">
            {teacherMode ? 'Sair do Modo Professor' : 'Modo Professor: Adicionar Cenário IA'}
          </button>
        </div>
      </div>

      {teacherMode && (
        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-200 dark:border-teal-800 mb-6 flex flex-col gap-3">
          <h4 className="font-bold text-sm text-teal-700 dark:text-teal-400"><i className="fas fa-magic"></i> Gerar Novo Cenário Fictício com IA</h4>
          <textarea 
            className="w-full p-3 text-base rounded-lg border bg-white dark:bg-slate-800 min-h-[44px]"
            rows={2}
            placeholder="Ex: Paciente pediátrico com asma exacerbada..."
            value={newScenarioDesc}
            onChange={e => setNewScenarioDesc(e.target.value)}
          />
          <button 
            disabled={isGeneratingScenario || !newScenarioDesc.trim()} 
            onClick={generateNewScenario}
            className="self-end px-4 py-2 bg-teal-600 text-white rounded shadow disabled:opacity-50 text-sm font-bold"
          >
            {isGeneratingScenario ? 'Gerando...' : 'Criar Cenário'}
          </button>
        </div>
      )}

      {/* PROGRESSO */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold mb-1 opacity-70">
          <span>Completude do PEP</span>
          <span>{completeness}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div className="bg-teal-500 h-full transition-all duration-300" style={{ width: `${completeness}%` }}></div>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex overflow-x-auto border-b dark:border-slate-700 mb-6 no-scrollbar pb-1">
        <button onClick={() => setActiveStage('identificacao')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeStage === 'identificacao' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent opacity-60'}`}>1. Identificação</button>
        <button onClick={() => setActiveStage('avaliacao')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeStage === 'avaliacao' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent opacity-60'}`}>2. Avaliação</button>
        <button onClick={() => setActiveStage('diagnostico')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeStage === 'diagnostico' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent opacity-60'}`}>3. Diagnóstico</button>
        <button onClick={() => setActiveStage('planejamento')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeStage === 'planejamento' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent opacity-60'}`}>4. Planejamento</button>
        <button onClick={() => setActiveStage('evolucao')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeStage === 'evolucao' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent opacity-60'}`}>5. Evolução</button>
      </div>

      {/* FORMULÁRIOS POR ETAPA */}
      <div className="bg-white dark:bg-[#1a1a1a] border dark:border-slate-800 rounded-xl p-6 shadow-sm mb-6">
        
        {activeStage === 'identificacao' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-300">Coleta de Dados / Histórico</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase opacity-70">Nome do Paciente</label>
                <input type="text" value={data.nome} onChange={e => handleInputChange('nome', e.target.value)} className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" />
                <p className="text-[10px] mt-1 text-teal-600 dark:text-teal-400"><i className="fas fa-info-circle"></i> Regra de Ouro: Confirme com pulseira e documento.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase opacity-70">Idade</label>
                  <input type="text" value={data.idade} onChange={e => handleInputChange('idade', e.target.value)} className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase opacity-70">Leito</label>
                  <input type="text" value={data.leito} onChange={e => handleInputChange('leito', e.target.value)} className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70">Alergias</label>
                <input type="text" value={data.alergias} onChange={e => handleInputChange('alergias', e.target.value)} placeholder="Ex: Nega alergias, alergia a penicilina" className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70">Comorbidades (Antecedentes)</label>
                <input type="text" value={data.comorbidades} onChange={e => handleInputChange('comorbidades', e.target.value)} className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setActiveStage('avaliacao')} className="bg-teal-600 text-white px-4 py-3 rounded-xl shadow font-bold text-sm min-h-[44px] active:scale-95 transition-all">Próxima Etapa <i className="fas fa-arrow-right ml-1"></i></button>
            </div>
          </div>
        )}

        {activeStage === 'avaliacao' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-300">Avaliação de Enfermagem (SOAP)</h3>
            <div>
              <label className="text-xs font-bold uppercase opacity-70">Subjetivo (Queixa Principal)</label>
              <textarea value={data.queixaPrincipal} onChange={e => handleInputChange('queixaPrincipal', e.target.value)} rows={2} className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" placeholder="O que o paciente relata..." />
              <p className="text-[10px] mt-1 text-teal-600 dark:text-teal-400"><i className="fas fa-info-circle"></i> Use aspas para citações diretas do paciente.</p>
            </div>
            <div>
              <label className="text-xs font-bold uppercase opacity-70">Objetivo (Sinais Vitais)</label>
              <input type="text" value={data.sinaisVitais} onChange={e => handleInputChange('sinaisVitais', e.target.value)} placeholder="PA: __x__ | FC: __ | FR: __ | Tax: __ | SpO2: __" className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 font-mono text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase opacity-70">Objetivo (Exame Físico / Cefalocaudal)</label>
              <textarea value={data.exameFisico} onChange={e => handleInputChange('exameFisico', e.target.value)} rows={4} className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" placeholder="Descreva neurológico, respiratório, cardiovascular, abdome, pele, acessos, sondas..." />
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setActiveStage('identificacao')} className="text-slate-500 font-bold text-sm"><i className="fas fa-arrow-left mr-1"></i> Voltar</button>
              <button onClick={() => setActiveStage('diagnostico')} className="bg-teal-600 text-white px-4 py-3 rounded-xl shadow font-bold text-sm min-h-[44px] active:scale-95 transition-all">Próxima Etapa <i className="fas fa-arrow-right ml-1"></i></button>
            </div>
          </div>
        )}

        {activeStage === 'diagnostico' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-300">Diagnóstico de Enfermagem (NANDA-I)</h3>
            <div>
              <label className="text-xs font-bold uppercase opacity-70">Problema + Fator Relacionado + Característica Definidora</label>
              <textarea value={data.diagnosticos} onChange={e => handleInputChange('diagnosticos', e.target.value)} rows={4} className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" placeholder="Ex: Risco de infecção evidenciado por incisão cirúrgica..." />
              <div className="bg-teal-50 dark:bg-teal-900/20 p-3 mt-2 rounded border border-teal-100 dark:border-teal-800">
                <p className="text-[11px] text-teal-800 dark:text-teal-300 font-semibold"><i className="fas fa-lightbulb text-amber-500"></i> Dica de Estrutura:</p>
                <p className="text-[10px] text-teal-700 dark:text-teal-400 mt-1">Título do Diagnóstico + "relacionado a" (Causa) + "evidenciado por" (Sinal/Sintoma). No caso de diagnósticos de "Risco", não há "evidenciado por".</p>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setActiveStage('avaliacao')} className="text-slate-500 font-bold text-sm"><i className="fas fa-arrow-left mr-1"></i> Voltar</button>
              <button onClick={() => setActiveStage('planejamento')} className="bg-teal-600 text-white px-4 py-3 rounded-xl shadow font-bold text-sm min-h-[44px] active:scale-95 transition-all">Próxima Etapa <i className="fas fa-arrow-right ml-1"></i></button>
            </div>
          </div>
        )}

        {activeStage === 'planejamento' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-300">Planejamento e Implementação (NIC)</h3>
            <div>
              <label className="text-xs font-bold uppercase opacity-70">Prescrição de Enfermagem e Cuidados</label>
              <textarea value={data.intervencoes} onChange={e => handleInputChange('intervencoes', e.target.value)} rows={5} className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" placeholder="1. Verificar SSVV a cada 4h (14h, 18h)&#10;2. Avaliar aspecto do curativo na incisão operatória...&#10;3. Realizar mudança de decúbito a cada 2h..." />
              <p className="text-[10px] mt-1 text-teal-600 dark:text-teal-400"><i className="fas fa-info-circle"></i> Para cada diagnóstico levantado, deve haver pelo menos uma intervenção planejada. (Art. 5º da Res. COFEN 736/2024)</p>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={() => setActiveStage('diagnostico')} className="text-slate-500 font-bold text-sm"><i className="fas fa-arrow-left mr-1"></i> Voltar</button>
              <button onClick={() => setActiveStage('evolucao')} className="bg-teal-600 text-white px-4 py-3 rounded-xl shadow font-bold text-sm min-h-[44px] active:scale-95 transition-all">Próxima Etapa <i className="fas fa-arrow-right ml-1"></i></button>
            </div>
          </div>
        )}

        {activeStage === 'evolucao' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-300">Evolução e Registro Diário</h3>
            <div>
              <label className="text-xs font-bold uppercase opacity-70">Evolução de Enfermagem</label>
              <textarea value={data.evolucaoText} onChange={e => handleInputChange('evolucaoText', e.target.value)} rows={6} className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" placeholder="08:00 - Paciente segue no leito, consciente, verbalizando... Relata melhora da dor. Aceitou dieta parcial..." />
            </div>
            <div>
              <label className="text-xs font-bold uppercase opacity-70">Assinatura Profissional</label>
              <input type="text" value={data.assinatura} onChange={e => handleInputChange('assinatura', e.target.value)} placeholder="Nome completo, Categoria (TE) e nº COREN" className="w-full mt-1.5 p-3.5 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-base focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" />
            </div>
            <div className="flex justify-between mt-6 pt-4 border-t dark:border-slate-800">
              <button onClick={() => setActiveStage('planejamento')} className="text-slate-500 font-bold text-sm"><i className="fas fa-arrow-left mr-1"></i> Voltar</button>
              <button 
                onClick={evaluatePep}
                disabled={isEvaluating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl shadow-lg font-black text-sm uppercase tracking-wide flex items-center gap-2 transition-all min-h-[48px] active:scale-95"
              >
                {isEvaluating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-double"></i>}
                {isEvaluating ? 'Validando...' : 'Validar Prontuário com IA'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FEEDBACK DA IA */}
      {evaluationFeedback && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-6 rounded-xl shadow-lg mb-8 animate-fadeIn">
          <div className="flex items-center gap-3 mb-4 text-indigo-700 dark:text-indigo-400">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-xl shadow">
              <i className="fas fa-robot"></i>
            </div>
            <h3 className="font-bold text-lg">Feedback do Tutor MonicAI</h3>
          </div>
          <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: evaluationFeedback.replace(/\\n/g, '<br/>') }} />
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-[10px] text-center opacity-50 mt-8 border-t dark:border-slate-800 pt-4 flex flex-col items-center gap-1">
        <p>📋 Simulador Educacional PEP v1.0.0</p>
        <p>Base Normativa: Res. COFEN 736/2024 e Res. COFEN 754/2024</p>
        <p>Não substitui sistemas hospitalares reais ou prontuários oficiais.</p>
      </footer>
    </div>
  );
};

export default PepSimulator;
