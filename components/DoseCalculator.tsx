import React, { useState } from 'react';

interface DoseCalculatorProps {
  onCompleteCalculation: (type: string) => void;
  darkMode?: boolean;
}

const DoseCalculator: React.FC<DoseCalculatorProps> = ({ onCompleteCalculation, darkMode }) => {
  const [activeTab, setActiveTab] = useState<'drip' | 'rule3'>('drip');

  // Drip state
  const [dripVolume, setDripVolume] = useState<string>('500');
  const [dripTime, setDripTime] = useState<string>('6');
  const [dripTimeUnit, setDripTimeUnit] = useState<'hours' | 'minutes'>('hours');
  const [dripType, setDripType] = useState<'macro' | 'micro'>('macro');
  const [dripResult, setDripResult] = useState<{
    rate: number;
    formula: string;
    stepByStep: string[];
  } | null>(null);

  // Rule of 3 state
  const [prescribedDose, setPrescribedDose] = useState<string>('150');
  const [availableDose, setAvailableDose] = useState<string>('500');
  const [diluentVolume, setDiluentVolume] = useState<string>('10');
  const [ruleResult, setRuleResult] = useState<{
    volumeToAdminister: number;
    stepByStep: string[];
  } | null>(null);

  const handleCalculateDrip = () => {
    const vol = parseFloat(dripVolume);
    const time = parseFloat(dripTime);

    if (isNaN(vol) || isNaN(time) || vol <= 0 || time <= 0) {
      alert('Por favor, preencha valores numéricos positivos.');
      return;
    }

    let rate = 0;
    let formula = '';
    const steps: string[] = [];

    if (dripType === 'macro') {
      if (dripTimeUnit === 'hours') {
        // Macrogotas por hora: V / (T * 3)
        rate = vol / (time * 3);
        formula = 'Macrogotas/min = Volume (mL) / [Tempo (h) × 3]';
        steps.push(`1. Identificamos os dados: Volume = ${vol} mL, Tempo = ${time} horas.`);
        steps.push(`2. Aplicamos a fórmula de macrogotas em horas: ${vol} / (${time} × 3).`);
        steps.push(`3. Multiplicamos o tempo por 3: ${time} × 3 = ${time * 3}.`);
        steps.push(`4. Dividimos o volume pelo resultado: ${vol} / ${time * 3} = ${rate.toFixed(2)} macrogotas/min.`);
      } else {
        // Macrogotas por minuto: (V * 20) / T
        rate = (vol * 20) / time;
        formula = 'Macrogotas/min = [Volume (mL) × 20] / Tempo (min)';
        steps.push(`1. Identificamos os dados: Volume = ${vol} mL, Tempo = ${time} minutos.`);
        steps.push(`2. Convertemos o volume em gotas (1 mL = 20 gotas): ${vol} × 20 = ${vol * 20} gotas.`);
        steps.push(`3. Dividimos o total de gotas pelo tempo em minutos: ${vol * 20} / ${time}.`);
        steps.push(`4. Resultado: ${rate.toFixed(2)} macrogotas/min.`);
      }
    } else {
      if (dripTimeUnit === 'hours') {
        // Microgotas por hora: V / T
        rate = vol / time;
        formula = 'Microgotas/min = Volume (mL) / Tempo (h)';
        steps.push(`1. Identificamos os dados: Volume = ${vol} mL, Tempo = ${time} horas.`);
        steps.push(`2. Como 1 gota = 3 microgotas, a constante 3 da fórmula é anulada.`);
        steps.push(`3. Aplicamos a fórmula de microgotas em horas: ${vol} / ${time}.`);
        steps.push(`4. Divisão direta: ${vol} / ${time} = ${rate.toFixed(2)} microgotas/min.`);
      } else {
        // Microgotas por minuto: (V * 60) / T
        rate = (vol * 60) / time;
        formula = 'Microgotas/min = [Volume (mL) × 60] / Tempo (min)';
        steps.push(`1. Identificamos os dados: Volume = ${vol} mL, Tempo = ${time} minutos.`);
        steps.push(`2. Convertemos o volume em microgotas (1 mL = 60 microgotas): ${vol} × 60 = ${vol * 60} microgotas.`);
        steps.push(`3. Dividimos o total de microgotas pelo tempo em minutos: ${vol * 60} / ${time}.`);
        steps.push(`4. Resultado: ${rate.toFixed(2)} microgotas/min.`);
      }
    }

    setDripResult({
      rate: parseFloat(rate.toFixed(1)),
      formula,
      stepByStep: steps
    });
    onCompleteCalculation('Gotejamento de Soro');
  };

  const handleCalculateRule3 = () => {
    const pres = parseFloat(prescribedDose);
    const avail = parseFloat(availableDose);
    const dil = parseFloat(diluentVolume);

    if (isNaN(pres) || isNaN(avail) || isNaN(dil) || pres <= 0 || avail <= 0 || dil <= 0) {
      alert('Por favor, preencha valores numéricos válidos e maiores que zero.');
      return;
    }

    // X = (Prescrito * Diluente) / Disponível
    const result = (pres * dil) / avail;
    const steps: string[] = [
      `1. Montamos a proporção da Regra de Três Simples:`,
      `   ${avail} mg (Disponível) ----------- ${dil} mL (Diluente)`,
      `   ${pres} mg (Prescrito) ------------ X mL (A Administrar)`,
      `2. Multiplicamos cruzado: ${avail} × X = ${pres} × ${dil}.`,
      `3. Resolvemos a multiplicação da dose prescrita pelo diluente: ${pres} × ${dil} = ${pres * dil}.`,
      `4. Dividimos o produto obtido pela concentração disponível: ${pres * dil} / ${avail}.`,
      `5. Resultado: Aspirar e administrar exatamente ${result.toFixed(2)} mL.`
    ];

    setRuleResult({
      volumeToAdminister: parseFloat(result.toFixed(2)),
      stepByStep: steps
    });
    onCompleteCalculation('Regra de Três');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto h-full">
      {/* Tabs Header */}
      <div className="flex border-b dark:border-[#333]">
        <button
          onClick={() => setActiveTab('drip')}
          className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
            activeTab === 'drip'
              ? 'border-[#b22222] text-[#b22222] dark:text-[#ff8888]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          💧 Gotejamento de Soro
        </button>
        <button
          onClick={() => setActiveTab('rule3')}
          className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
            activeTab === 'rule3'
              ? 'border-[#b22222] text-[#b22222] dark:text-[#ff8888]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🧮 Regra de Três (Dosagem)
        </button>
      </div>

      {activeTab === 'drip' ? (
        // Drip calculator
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'} space-y-4`}>
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#b22222] dark:text-[#ff8888] flex items-center gap-2">
              <i className="fas fa-tint"></i> Parâmetros Clínicos
            </h3>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Volume a infundir (mL)</label>
                <div className="relative group cursor-help select-none">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-[#333] hover:bg-[#b22222] hover:text-white flex items-center justify-center text-[8px] font-black transition-all text-slate-600 dark:text-slate-400">?</span>
                  <span className="absolute hidden group-hover:block bg-slate-950 text-white text-[9px] p-2 rounded-md shadow-xl w-48 left-0 bottom-5 z-50 normal-case tracking-normal border border-slate-700/50 leading-normal font-semibold">
                    Insira o volume total da solução prescrita (ex: 500 mL de Soro Fisiológico 0.9%).
                  </span>
                </div>
              </div>
              <input
                type="number"
                value={dripVolume}
                onChange={(e) => setDripVolume(e.target.value)}
                className={`w-full p-2.5 rounded-lg border text-sm font-bold ${
                  darkMode ? 'bg-[#1a1a1a] border-[#444] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
                placeholder="Ex: 500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tempo</label>
                  <div className="relative group cursor-help select-none">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-[#333] hover:bg-[#b22222] hover:text-white flex items-center justify-center text-[8px] font-black transition-all text-slate-600 dark:text-slate-400">?</span>
                    <span className="absolute hidden group-hover:block bg-slate-950 text-white text-[9px] p-2 rounded-md shadow-xl w-44 left-0 bottom-5 z-50 normal-case tracking-normal border border-slate-700/50 leading-normal font-semibold">
                      Insira o tempo de infusão indicado na prescrição médica.
                    </span>
                  </div>
                </div>
                <input
                  type="number"
                  value={dripTime}
                  onChange={(e) => setDripTime(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-sm font-bold ${
                    darkMode ? 'bg-[#1a1a1a] border-[#444] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  placeholder="Ex: 6"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unidade</label>
                <select
                  value={dripTimeUnit}
                  onChange={(e) => setDripTimeUnit(e.target.value as 'hours' | 'minutes')}
                  className={`w-full p-2.5 rounded-lg border text-sm font-bold ${
                    darkMode ? 'bg-[#1a1a1a] border-[#444] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="hours">Horas</option>
                  <option value="minutes">Minutos</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Tipo de Gotejamento</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDripType('macro')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    dripType === 'macro'
                      ? 'border-[#b22222] bg-[#b22222]/10 text-[#b22222] dark:text-[#ff8888]'
                      : darkMode
                        ? 'border-[#444] bg-[#1a1a1a] text-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  💧 Macrogotas (Gotas)
                </button>
                <button
                  onClick={() => setDripType('micro')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    dripType === 'micro'
                      ? 'border-[#b22222] bg-[#b22222]/10 text-[#b22222] dark:text-[#ff8888]'
                      : darkMode
                        ? 'border-[#444] bg-[#1a1a1a] text-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  💦 Microgotas
                </button>
              </div>
            </div>

            <button
              onClick={handleCalculateDrip}
              className="w-full py-3 bg-[#b22222] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8b0000] shadow-md transition-all mt-4"
            >
              Calcular Velocidade
            </button>
          </div>

          <div className="space-y-4">
            {dripResult ? (
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'} space-y-4`}>
                <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">📊 Resultado do Cálculo</h4>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20 text-center">
                  <span className="text-[10px] uppercase font-black text-emerald-800 dark:text-emerald-400 tracking-wider">Velocidade de Infusão</span>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    {dripResult.rate} <span className="text-sm font-bold uppercase">{dripType === 'macro' ? 'gotas/min' : 'microgotas/min'}</span>
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400/80 mt-1">
                    Aproximadamente {Math.round(dripResult.rate)} {dripType === 'macro' ? 'gotas/min' : 'microgotas/min'}
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black uppercase text-slate-400">Fórmula Usada:</h5>
                  <code className="block p-2 bg-slate-100 dark:bg-[#1a1a1a] rounded text-xs font-mono break-all font-bold text-[#b22222] dark:text-[#ff8888]">{dripResult.formula}</code>
                </div>
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black uppercase text-slate-400">Passo a Passo Matemático:</h5>
                  <ul className="text-xs space-y-1.5 list-none font-semibold">
                    {dripResult.stepByStep.map((s, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-[#333] rounded-2xl p-6 text-center opacity-40">
                <div>
                  <i className="fas fa-calculator text-4xl mb-2 text-slate-400"></i>
                  <p className="text-xs font-bold uppercase tracking-wider">Preencha os valores e clique em calcular</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Rule of 3 calculator
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'} space-y-4`}>
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#b22222] dark:text-[#ff8888] flex items-center gap-2">
              <i className="fas fa-pills"></i> Valores de Diluição
            </h3>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Prescrição Médica (mg / UI)</label>
                <div className="relative group cursor-help select-none">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-[#333] hover:bg-[#b22222] hover:text-white flex items-center justify-center text-[8px] font-black transition-all text-slate-600 dark:text-slate-400">?</span>
                  <span className="absolute hidden group-hover:block bg-slate-950 text-white text-[9px] p-2 rounded-md shadow-xl w-48 left-0 bottom-5 z-50 normal-case tracking-normal border border-slate-700/50 leading-normal font-semibold">
                    Dose receitada pelo médico que você deve administrar (ex: 150 mg).
                  </span>
                </div>
              </div>
              <input
                type="number"
                value={prescribedDose}
                onChange={(e) => setPrescribedDose(e.target.value)}
                className={`w-full p-2.5 rounded-lg border text-sm font-bold ${
                  darkMode ? 'bg-[#1a1a1a] border-[#444] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
                placeholder="Ex: 150"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Disponível em Estoque</label>
                  <div className="relative group cursor-help select-none">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-[#333] hover:bg-[#b22222] hover:text-white flex items-center justify-center text-[8px] font-black transition-all text-slate-600 dark:text-slate-400">?</span>
                    <span className="absolute hidden group-hover:block bg-slate-950 text-white text-[9px] p-2 rounded-md shadow-xl w-44 left-0 bottom-5 z-50 normal-case tracking-normal border border-slate-700/50 leading-normal font-semibold">
                      Dose existente no frasco-ampola ou comprimido disponível na farmácia (ex: 500 mg).
                    </span>
                  </div>
                </div>
                <input
                  type="number"
                  value={availableDose}
                  onChange={(e) => setAvailableDose(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-sm font-bold ${
                    darkMode ? 'bg-[#1a1a1a] border-[#444] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  placeholder="Ex: 500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Volume Diluente (mL)</label>
                  <div className="relative group cursor-help select-none">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-[#333] hover:bg-[#b22222] hover:text-white flex items-center justify-center text-[8px] font-black transition-all text-slate-600 dark:text-slate-400">?</span>
                    <span className="absolute hidden group-hover:block bg-slate-950 text-white text-[9px] p-2 rounded-md shadow-xl w-44 left-0 bottom-5 z-50 normal-case tracking-normal border border-slate-700/50 leading-normal font-semibold">
                      Quantidade de líquido usada para dissolver o pó do frasco (ex: 10 mL de água destilada).
                    </span>
                  </div>
                </div>
                <input
                  type="number"
                  value={diluentVolume}
                  onChange={(e) => setDiluentVolume(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-sm font-bold ${
                    darkMode ? 'bg-[#1a1a1a] border-[#444] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  placeholder="Ex: 10"
                />
              </div>
            </div>

            <button
              onClick={handleCalculateRule3}
              className="w-full py-3 bg-[#b22222] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#8b0000] shadow-md transition-all mt-4"
            >
              Calcular Diluição
            </button>
          </div>

          <div className="space-y-4">
            {ruleResult ? (
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'} space-y-4`}>
                <h4 className="font-bold text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400">📊 Resultado do Cálculo</h4>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200/50 dark:border-emerald-500/20 text-center">
                  <span className="text-[10px] uppercase font-black text-emerald-800 dark:text-emerald-400 tracking-wider">Volume a ser Aspirado</span>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    {ruleResult.volumeToAdminister} <span className="text-sm font-bold uppercase">mL</span>
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400/80 mt-1">
                    Utilizar seringa graduada para aspiração precisa
                  </p>
                </div>
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black uppercase text-slate-400">Resolução Passo a Passo:</h5>
                  <ul className="text-xs space-y-1.5 list-none font-semibold">
                    {ruleResult.stepByStep.map((s, idx) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span>
                        <span className="whitespace-pre">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-[#333] rounded-2xl p-6 text-center opacity-40">
                <div>
                  <i className="fas fa-calculator text-4xl mb-2 text-slate-400"></i>
                  <p className="text-xs font-bold uppercase tracking-wider">Preencha os valores e clique em calcular</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theoretical references footer as required */}
      <section className={`p-4 rounded-xl border text-[11px] leading-relaxed font-semibold ${
        darkMode ? 'bg-[#1e1e1e] border-[#333] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <h4 className="font-bold uppercase text-[9px] text-[#b22222] dark:text-[#ff8888] tracking-widest mb-1.5 flex items-center gap-1.5">
          <i className="fas fa-book-reader"></i> Fundamentação Teórica e Diretrizes
        </h4>
        <p className="mb-2">
          <strong>Fórmulas aplicadas:</strong> O gotejamento baseia-se na relação onde 1 mL equivale a 20 gotas (macrogotas) e 60 microgotas. Portanto, 1 gota = 3 microgotas. A regra de três simples fundamenta-se na proporcionalidade direta de massas de soluto/solvente.
        </p>
        <div className="space-y-1">
          <div>📚 <em>Resolução COFEN nº 0564/2017</em> - Código de Ética dos Profissionais de Enfermagem (Segurança na administração de medicamentos).</div>
          <div>📚 <em>Cálculo e Administração de Medicamentos na Enfermagem</em> (Sandra Regina L. P. Silva, 2018).</div>
          <div>📚 <em>Manual de Administração de Medicamentos e Cálculos Clínicos</em> (Marcelo de Almeida, 2021).</div>
        </div>
        <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
          ⚠️ ALUNO: Sempre diversifique suas fontes de estudo, consulte protocolos institucionais locais e valide as dosagens prescritas junto à equipe de saúde!
        </p>
      </section>
    </div>
  );
};

export default DoseCalculator;
