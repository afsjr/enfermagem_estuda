import React, { useState } from 'react';
import { GeminiService } from '../geminiService';

interface EmergencyCalculatorProps {
  onCompleteCalculation: (type: string) => void;
  darkMode?: boolean;
}

type TabType = 'glasgow' | 'news' | 'pain' | 'imc' | 'drugs';

const EmergencyCalculator: React.FC<EmergencyCalculatorProps> = ({ onCompleteCalculation, darkMode }) => {
  const [activeTab, setActiveTab] = useState<TabType>('glasgow');

  // --- GLASGOW STATE ---
  const [eyeOpening, setEyeOpening] = useState<number>(0);
  const [verbalResponse, setVerbalResponse] = useState<number>(0);
  const [motorResponse, setMotorResponse] = useState<number>(0);
  const [pupilReactivity, setPupilReactivity] = useState<number>(-1);
  
  // --- NEWS STATE ---
  const [respRate, setRespRate] = useState<string>('');
  const [spo2, setSpo2] = useState<string>('');
  const [o2Supp, setO2Supp] = useState<string>('no');
  const [sysBP, setSysBP] = useState<string>('');
  const [heartRate, setHeartRate] = useState<string>('');
  const [consciousness, setConsciousness] = useState<string>('A');
  const [temperature, setTemperature] = useState<string>('');

  // --- PAIN STATE ---
  const [painLevel, setPainLevel] = useState<number>(0);

  // --- IMC STATE ---
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [gender, setGender] = useState<'M' | 'F'>('M');

  // --- DRUGS STATE ---
  const [patientWeight, setPatientWeight] = useState<string>('');
  const [selectedDrug, setSelectedDrug] = useState<string>('epinefrina');
  
  // AI Explanation State
  const [isExplaining, setIsExplaining] = useState(false);
  const [drugExplanation, setDrugExplanation] = useState<string | null>(null);

  const gemini = new GeminiService();

  // --- HANDLERS ---
  
  const calculateGlasgow = () => {
    if (!eyeOpening || !verbalResponse || !motorResponse || pupilReactivity === -1) return null;
    const baseScore = eyeOpening + verbalResponse + motorResponse;
    const score = baseScore - pupilReactivity;
    let severity = '';
    if (score <= 8) severity = 'Trauma Cranioencefálico Grave';
    else if (score <= 12) severity = 'Trauma Cranioencefálico Moderado';
    else severity = 'Trauma Cranioencefálico Leve';
    return { score, severity, baseScore, pupilReactivity };
  };

  const getNewsScore = (value: number, type: string) => {
    if (type === 'rr') {
      if (value <= 8 || value >= 25) return 3;
      if (value >= 21) return 2;
      if (value >= 9 && value <= 11) return 1;
      return 0;
    }
    if (type === 'spo2') {
      if (value <= 91) return 3;
      if (value >= 92 && value <= 93) return 2;
      if (value >= 94 && value <= 95) return 1;
      return 0;
    }
    if (type === 'sbp') {
      if (value <= 90 || value >= 220) return 3;
      if (value >= 91 && value <= 100) return 2;
      if (value >= 101 && value <= 110) return 1;
      return 0;
    }
    if (type === 'hr') {
      if (value <= 40 || value >= 131) return 3;
      if (value >= 111 && value <= 130) return 2;
      if (value >= 41 && value <= 50) return 1;
      if (value >= 91 && value <= 110) return 1;
      return 0;
    }
    if (type === 'temp') {
      if (value <= 35.0) return 3;
      if (value >= 39.1) return 2;
      if (value >= 35.1 && value <= 36.0) return 1;
      if (value >= 38.1 && value <= 39.0) return 1;
      return 0;
    }
    return 0;
  };

  const calculateNews = () => {
    if (!respRate || !spo2 || !sysBP || !heartRate || !temperature) return null;
    
    let score = 0;
    score += getNewsScore(Number(respRate), 'rr');
    score += getNewsScore(Number(spo2), 'spo2');
    score += getNewsScore(Number(sysBP), 'sbp');
    score += getNewsScore(Number(heartRate), 'hr');
    score += getNewsScore(Number(temperature), 'temp');
    score += o2Supp === 'yes' ? 2 : 0;
    score += consciousness !== 'A' ? 3 : 0;
    
    let risk = '';
    let color = '';
    if (score >= 7) { risk = 'ALTO RISCO - Avaliação de emergência'; color = 'text-red-600 dark:text-red-400'; }
    else if (score >= 5) { risk = 'MÉDIO RISCO - Requer resposta médica urgente'; color = 'text-amber-600 dark:text-amber-400'; }
    else { risk = 'BAIXO RISCO - Monitoramento clínico normal'; color = 'text-emerald-600 dark:text-emerald-400'; }
    
    return { score, risk, color };
  };

  const calculateIMC = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return null;
    
    const imc = w / (h * h);
    let category = '';
    if (imc < 18.5) category = 'Baixo peso';
    else if (imc < 25) category = 'Eutrofia (Peso normal)';
    else if (imc < 30) category = 'Sobrepeso';
    else if (imc < 35) category = 'Obesidade grau I';
    else if (imc < 40) category = 'Obesidade grau II';
    else category = 'Obesidade grau III (Mórbida)';

    // Peso Ideal (Fórmula de Hamwi)
    // h in cm for Hamwi
    const hCm = h * 100;
    const baseHeight = 152.4;
    const heightDiff = hCm - baseHeight;
    let idealWeight = 0;
    if (gender === 'M') {
      idealWeight = 48.0 + (1.1 * heightDiff);
    } else {
      idealWeight = 45.5 + (0.9 * heightDiff);
    }
    
    return { imc: imc.toFixed(1), category, idealWeight: idealWeight.toFixed(1) };
  };

  const drugs = [
    { id: 'epinefrina_ped', name: 'Epinefrina Pediátrica', desc: 'PCR / Anafilaxia (0,01 mg/kg)', doseFormula: (w: number) => (w * 0.01).toFixed(2) + ' mg (Máx 1mg)' },
    { id: 'epinefrina_adulto_pcr', name: 'Epinefrina Adulto (PCR)', desc: 'Parada Cardiorrespiratória', doseFormula: (w: number) => '1 mg a cada 3-5 min' },
    { id: 'epinefrina_adulto_ana', name: 'Epinefrina Adulto (Anafilaxia)', desc: 'Anafilaxia (IM no vasto lateral)', doseFormula: (w: number) => '0.3 a 0.5 mg IM' },
    { id: 'atropina', name: 'Atropina', desc: 'Bradicardia (0,02 mg/kg ped)', doseFormula: (w: number) => (w * 0.02).toFixed(2) + ' mg' },
    { id: 'amiodarona', name: 'Amiodarona', desc: 'Arritmias (5 mg/kg ped)', doseFormula: (w: number) => (w * 5).toFixed(2) + ' mg' },
    { id: 'diazepam', name: 'Diazepam', desc: 'Convulsão (0,1 a 0,3 mg/kg)', doseFormula: (w: number) => (w * 0.2).toFixed(2) + ' mg' },
    { id: 'midazolam', name: 'Midazolam', desc: 'Convulsão (0,1 a 0,2 mg/kg IM/IV)', doseFormula: (w: number) => (w * 0.15).toFixed(2) + ' mg' },
    { id: 'glicose', name: 'Glicose 50%', desc: 'Hipoglicemia grave (1 a 2 g/kg)', doseFormula: (w: number) => (w * 1).toFixed(2) + ' a ' + (w * 2).toFixed(2) + ' g' }
  ];

  const calculateDrugDose = () => {
    const w = parseFloat(patientWeight);
    if (!w) return null;
    const drug = drugs.find(d => d.id === selectedDrug);
    return drug ? { name: drug.name, dose: drug.doseFormula(w) } : null;
  };

  const handleAskAI = async () => {
    const calc = calculateDrugDose();
    if (!calc) return;
    setIsExplaining(true);
    setDrugExplanation(null);
    try {
      const prompt = `Como professor de enfermagem, explique brevemente a indicação clínica, mecanismo de ação básico e os cuidados de enfermagem ao administrar ${calc.name} na dose de ${calc.dose} para um paciente de ${patientWeight} kg em contexto de emergência. Responda em até 3 parágrafos curtos.`;
      const response = await gemini.chat([{ role: 'user', content: prompt }]);
      setDrugExplanation(response);
      onCompleteCalculation('Explicação AI de Dose');
    } catch (e: any) {
      setDrugExplanation('Falha ao obter explicação. Tente novamente.');
    } finally {
      setIsExplaining(false);
    }
  };

  const getPainFace = (val: number) => {
    if (val === 0) return { emoji: '😃', text: 'Sem Dor (0)', color: 'text-emerald-500' };
    if (val <= 2) return { emoji: '🙂', text: 'Dor Leve (1-2)', color: 'text-emerald-400' };
    if (val <= 4) return { emoji: '😐', text: 'Dor Moderada (3-4)', color: 'text-yellow-500' };
    if (val <= 6) return { emoji: '🙁', text: 'Dor Intensa (5-6)', color: 'text-orange-500' };
    if (val <= 8) return { emoji: '😫', text: 'Dor Muito Intensa (7-8)', color: 'text-red-500' };
    return { emoji: '😭', text: 'Dor Insuportável (9-10)', color: 'text-red-700 dark:text-red-600' };
  };

  const triggerCompletion = (type: string) => {
    onCompleteCalculation(type);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto h-full pb-32 lg:pb-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-red-900/10 p-4 rounded-xl border border-red-600/20 mb-6 gap-4">
        <div>
          <h2 className="font-bold text-red-600 dark:text-red-400 text-xl flex items-center gap-2">
            <i className="fas fa-heartbeat"></i> Escalas e Cálculos de Emergência
          </h2>
          <p className="text-sm opacity-70">Avaliações rápidas para triagem e atendimento de urgência</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto border-b dark:border-slate-700 mb-6 no-scrollbar pb-1">
        <button onClick={() => setActiveTab('glasgow')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeTab === 'glasgow' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent opacity-60'}`}>🧠 Glasgow</button>
        <button onClick={() => setActiveTab('news')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeTab === 'news' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent opacity-60'}`}>📊 NEWS2</button>
        <button onClick={() => setActiveTab('pain')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeTab === 'pain' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent opacity-60'}`}>😣 Dor</button>
        <button onClick={() => setActiveTab('imc')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeTab === 'imc' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent opacity-60'}`}>⚖️ IMC</button>
        <button onClick={() => setActiveTab('drugs')} className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${activeTab === 'drugs' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent opacity-60'}`}>💊 Doses</button>
      </div>

      {/* CONTENT */}
      <div className="bg-white dark:bg-[#1a1a1a] border dark:border-slate-800 rounded-xl p-6 shadow-sm mb-6">
        
        {/* GLASGOW */}
        {activeTab === 'glasgow' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Escala de Coma de Glasgow (ECG)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-xs font-bold uppercase opacity-70 mb-2 block">Abertura Ocular (1-4)</label>
                <select value={eyeOpening} onChange={e => setEyeOpening(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm">
                  <option value={0}>Selecione...</option>
                  <option value={4}>Espontânea (4)</option>
                  <option value={3}>À voz (3)</option>
                  <option value={2}>À dor (2)</option>
                  <option value={1}>Nenhuma (1)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70 mb-2 block">Resposta Verbal (1-5)</label>
                <select value={verbalResponse} onChange={e => setVerbalResponse(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm">
                  <option value={0}>Selecione...</option>
                  <option value={5}>Orientada (5)</option>
                  <option value={4}>Confusa (4)</option>
                  <option value={3}>Palavras inapropriadas (3)</option>
                  <option value={2}>Sons incompressíveis (2)</option>
                  <option value={1}>Nenhuma (1)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70 mb-2 block">Resposta Motora (1-6)</label>
                <select value={motorResponse} onChange={e => setMotorResponse(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm">
                  <option value={0}>Selecione...</option>
                  <option value={6}>Obedece a comandos (6)</option>
                  <option value={5}>Localiza a dor (5)</option>
                  <option value={4}>Movimento de retirada (4)</option>
                  <option value={3}>Flexão anormal (Decorticação) (3)</option>
                  <option value={2}>Extensão anormal (Descerebração) (2)</option>
                  <option value={1}>Nenhuma (1)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70 mb-2 block">Reatividade Pupilar</label>
                <select value={pupilReactivity} onChange={e => setPupilReactivity(Number(e.target.value))} className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm">
                  <option value={-1}>Selecione...</option>
                  <option value={0}>Ambas reagem (-0)</option>
                  <option value={1}>Apenas uma reage (-1)</option>
                  <option value={2}>Nenhuma reage (-2)</option>
                </select>
              </div>
            </div>
            
            <button onClick={() => triggerCompletion('Glasgow')} disabled={!eyeOpening || !verbalResponse || !motorResponse || pupilReactivity === -1} className="bg-red-600 text-white px-4 py-3 rounded-xl shadow font-bold text-sm w-full md:w-auto disabled:opacity-50">Calcular Glasgow</button>
            
            {calculateGlasgow() && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                  <div className="text-3xl font-black text-slate-800 dark:text-white">Score: {calculateGlasgow()?.score} / 15</div>
                  <div className="text-sm font-bold mt-1 text-red-600 dark:text-red-400">{calculateGlasgow()?.severity}</div>
                  <div className="text-xs opacity-70 mt-1">GCS Base: {calculateGlasgow()?.baseScore} | Pupilas: -{calculateGlasgow()?.pupilReactivity}</div>
                </div>
                
                {/* Dica Pedagógica do Tutor */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                  <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1 text-sm flex items-center gap-2">
                    <i className="fas fa-lightbulb"></i> Interpretação Clínica (Dica do Tutor)
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
                    A Escala de Coma de Glasgow com Reatividade Pupilar (GCS-P) reflete com maior precisão o prognóstico. 
                    {calculateGlasgow()?.score! <= 8 
                      ? " Score ≤ 8 indica trauma grave. Cuidado de Enfermagem crítico: Preparar material para intubação orotraqueal (proteção de via aérea) e notificar equipe médica imediatamente." 
                      : calculateGlasgow()?.score! <= 12 
                        ? " Score entre 9 e 12 indica trauma moderado. Monitorar nível de consciência frequentemente. Risco de deterioração neurológica rápida." 
                        : " Score 13-15 indica trauma leve. Manter monitorização neurológica de rotina."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEWS */}
        {activeTab === 'news' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">NEWS 2 (National Early Warning Score)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="text-xs font-bold uppercase opacity-70">Frequência Respiratória</label><input type="number" value={respRate} onChange={e => setRespRate(e.target.value)} placeholder="irpm" className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm" /></div>
              <div><label className="text-xs font-bold uppercase opacity-70">Saturação O₂ (%)</label><input type="number" value={spo2} onChange={e => setSpo2(e.target.value)} placeholder="%" className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm" /></div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70">O₂ Suplementar?</label>
                <select value={o2Supp} onChange={e => setO2Supp(e.target.value)} className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm">
                  <option value="no">Não (Ar Ambiente)</option>
                  <option value="yes">Sim</option>
                </select>
              </div>
              <div><label className="text-xs font-bold uppercase opacity-70">Pressão Sistólica</label><input type="number" value={sysBP} onChange={e => setSysBP(e.target.value)} placeholder="mmHg" className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm" /></div>
              <div><label className="text-xs font-bold uppercase opacity-70">Frequência Cardíaca</label><input type="number" value={heartRate} onChange={e => setHeartRate(e.target.value)} placeholder="bpm" className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm" /></div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70">Nível de Consciência</label>
                <select value={consciousness} onChange={e => setConsciousness(e.target.value)} className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm">
                  <option value="A">Alerta</option>
                  <option value="CVPU">V / P / U (Responde a voz/dor ou Irresponsivo)</option>
                </select>
              </div>
              <div><label className="text-xs font-bold uppercase opacity-70">Temperatura (°C)</label><input type="number" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)} placeholder="°C" className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm" /></div>
            </div>
            
            <button onClick={() => triggerCompletion('NEWS')} className="bg-red-600 text-white px-4 py-3 rounded-xl shadow font-bold text-sm w-full md:w-auto mt-4">Calcular NEWS2</button>
            
            {calculateNews() && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                  <div className="text-3xl font-black text-slate-800 dark:text-white">Score: {calculateNews()?.score}</div>
                  <div className={`text-sm font-bold mt-1 ${calculateNews()?.color}`}>{calculateNews()?.risk}</div>
                </div>

                {/* Dica Pedagógica do Tutor */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                  <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1 text-sm flex items-center gap-2">
                    <i className="fas fa-lightbulb"></i> Interpretação Clínica (Dica do Tutor)
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
                    {calculateNews()?.score! >= 7 
                      ? "Score ≥ 7 indica alto risco clínico crônico. Acione o time de resposta rápida/equipe de emergência e inicie monitorização contínua dos sinais vitais." 
                      : calculateNews()?.score! >= 5 
                        ? "Score 5-6 indica médio risco. Aumentar a frequência de verificação dos sinais vitais (ex: a cada 1 hora) e notificar o enfermeiro/médico." 
                        : "Score 0-4 indica baixo risco. Manter cuidados de rotina com avaliação a cada 12 horas ou conforme prescrição."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAIN */}
        {activeTab === 'pain' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto text-center">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-6">Escala Visual Analógica e Numérica da Dor</h3>
            
            <div className="text-6xl mb-4">{getPainFace(painLevel).emoji}</div>
            <div className={`text-xl font-bold mb-8 ${getPainFace(painLevel).color}`}>{getPainFace(painLevel).text}</div>
            
            <input 
              type="range" 
              min="0" max="10" 
              value={painLevel} 
              onChange={e => {setPainLevel(Number(e.target.value)); triggerCompletion('PainScale');}} 
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between mt-2 text-xs font-bold opacity-50 px-1">
              <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
            </div>
          </div>
        )}

        {/* IMC */}
        {activeTab === 'imc' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Índice de Massa Corporal (IMC)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase opacity-70">Peso (kg)</label>
                <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ex: 70" className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70">Altura (m)</label>
                <input type="number" step="0.01" value={height} onChange={e => setHeight(e.target.value)} placeholder="Ex: 1.75" className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70">Sexo (Para Peso Ideal)</label>
                <select value={gender} onChange={e => setGender(e.target.value as 'M' | 'F')} className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm">
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>
            
            <button onClick={() => triggerCompletion('IMC')} className="bg-red-600 text-white px-4 py-3 rounded-xl shadow font-bold text-sm w-full md:w-auto mt-4">Calcular IMC</button>
            
            {calculateIMC() && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-3">
                    <div className="text-xs font-bold uppercase opacity-70">IMC Atual</div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white my-1">{calculateIMC()?.imc}</div>
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">{calculateIMC()?.category}</div>
                  </div>
                  <div className="text-center p-3 border-t md:border-t-0 md:border-l border-slate-300 dark:border-slate-600">
                    <div className="text-xs font-bold uppercase opacity-70">Peso Ideal Estimado (Hamwi)</div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white my-1">{calculateIMC()?.idealWeight} kg</div>
                  </div>
                </div>

                {/* Dica Pedagógica do Tutor */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                  <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1 text-sm flex items-center gap-2">
                    <i className="fas fa-lightbulb"></i> Interpretação Clínica (Dica do Tutor)
                  </h4>
                  <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
                    Em situações de emergência (como ressuscitação), o cálculo de medicamentos para pacientes com obesidade (IMC &gt; 30) frequentemente exige o uso do <strong>Peso Ideal</strong> ou Peso Ajustado em vez do Peso Real, para evitar toxicidade e subdosagem dependendo da lipossolubilidade do fármaco.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DRUGS */}
        {activeTab === 'drugs' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Doses de Emergência (Pediátrico / Adulto)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="text-xs font-bold uppercase opacity-70">Peso do Paciente (kg)</label>
                <input type="number" step="0.1" value={patientWeight} onChange={e => setPatientWeight(e.target.value)} placeholder="Ex: 25" className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase opacity-70">Droga</label>
                <select value={selectedDrug} onChange={e => setSelectedDrug(e.target.value)} className="w-full mt-1 p-3 border rounded-xl bg-slate-50 dark:bg-[#252525] dark:border-slate-700 text-sm">
                  {drugs.map(d => <option key={d.id} value={d.id}>{d.name} - {d.desc}</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => triggerCompletion('DrugDose')} className="bg-red-600 text-white px-4 py-3 rounded-xl shadow font-bold text-sm w-full md:w-auto mt-4">Calcular Dose Base</button>

            {calculateDrugDose() && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                  <div className="text-xs font-bold uppercase opacity-70 text-red-800 dark:text-red-300">Dose Estimada</div>
                  <div className="text-3xl font-black text-red-700 dark:text-red-400 my-1">{calculateDrugDose()?.dose}</div>
                  <div className="text-sm font-bold text-red-800 dark:text-red-300">de {calculateDrugDose()?.name}</div>
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={handleAskAI}
                    disabled={isExplaining}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isExplaining ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-robot"></i>}
                    {isExplaining ? 'Tutor IA analisando...' : 'Explicar Farmacologia e Cuidados com IA'}
                  </button>
                </div>
              </div>
            )}

            {drugExplanation && (
              <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl shadow-inner mt-4 animate-fadeIn">
                <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                  <i className="fas fa-chalkboard-teacher"></i> Explicação do Tutor MonicAI
                </h4>
                <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: drugExplanation.replace(/\\n/g, '<br/>') }} />
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default EmergencyCalculator;
