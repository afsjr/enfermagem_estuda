import React, { useState, useEffect, useRef } from 'react';

interface InfusionPumpSimulatorProps {
  onAwardXp: (xpEarned: number) => void;
  darkMode?: boolean;
}

type PumpType = 'volumetric' | 'syringe' | 'pca';

export const InfusionPumpSimulator: React.FC<InfusionPumpSimulatorProps> = ({ onAwardXp, darkMode }) => {
  const [activeTab, setActiveTab] = useState<PumpType>('volumetric');
  
  // State for volumetric
  const [rate, setRate] = useState<string>('125');
  const [vtbi, setVtbi] = useState<string>('1000');
  const [infused, setInfused] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeAlarm, setActiveAlarm] = useState<string | null>(null);

  // State for PCA
  const [pcaBolus, setPcaBolus] = useState<string>('2');
  const [pcaLockout, setPcaLockout] = useState<string>('10'); // minutes
  const [pcaDemands, setPcaDemands] = useState<number>(0);
  const [pcaGiven, setPcaGiven] = useState<number>(0);
  const [pcaLastGivenTime, setPcaLastGivenTime] = useState<number>(0); // in simulated seconds

  // Global simulation
  const [simTimeSeconds, setSimTimeSeconds] = useState<number>(0);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Guided exercise
  const [exerciseMode, setExerciseMode] = useState<boolean>(false);
  const [exerciseCompleted, setExerciseCompleted] = useState<boolean>(false);

  // 1 real second = 30 simulated seconds (1 minute simulated = 2 real seconds)
  const SIMULATION_SPEED = 30; 

  const handleStart = () => {
    if (activeAlarm) return;
    const rateNum = parseFloat(rate);
    const vtbiNum = parseFloat(vtbi);
    if (isNaN(rateNum) || isNaN(vtbiNum) || rateNum <= 0 || vtbiNum <= 0) {
      alert("Configuração inválida. Verifique a vazão e VTBI.");
      return;
    }
    if (infused >= vtbiNum) {
      triggerAlarm("Fim de Infusão");
      return;
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setInfused(0);
    setSimTimeSeconds(0);
    setActiveAlarm(null);
  };

  const triggerAlarm = (alarmName: string) => {
    setIsRunning(false);
    setActiveAlarm(alarmName);
  };

  const clearAlarm = () => {
    setActiveAlarm(null);
  };

  const handlePcaDemand = () => {
    setPcaDemands(prev => prev + 1);
    if (!isRunning || activeAlarm) return;
    
    const lockoutSecs = parseFloat(pcaLockout) * 60;
    if (isNaN(lockoutSecs)) return;

    if (simTimeSeconds - pcaLastGivenTime >= lockoutSecs || pcaGiven === 0) {
      const bolusVol = parseFloat(pcaBolus);
      if (!isNaN(bolusVol)) {
        setInfused(prev => Math.min(prev + bolusVol, parseFloat(vtbi)));
        setPcaGiven(prev => prev + 1);
        setPcaLastGivenTime(simTimeSeconds);
      }
    }
  };

  useEffect(() => {
    if (isRunning) {
      simIntervalRef.current = setInterval(() => {
        setSimTimeSeconds(prev => prev + SIMULATION_SPEED);
        
        // Infusion logic
        setInfused(prev => {
          const rateNum = parseFloat(rate);
          const vtbiNum = parseFloat(vtbi);
          // rate is mL/h. in SIMULATION_SPEED seconds, volume = rate * (SIMULATION_SPEED / 3600)
          const addedVol = rateNum * (SIMULATION_SPEED / 3600);
          const newTotal = prev + addedVol;
          
          if (newTotal >= vtbiNum) {
            triggerAlarm("Fim de Infusão");
            return vtbiNum;
          }
          return newTotal;
        });

      }, 1000);
    } else {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    }
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isRunning, rate, vtbi]);

  // Exercise validation
  useEffect(() => {
    if (exerciseMode && !exerciseCompleted) {
      if (activeTab === 'volumetric' && rate === '125' && vtbi === '1000') {
        setExerciseCompleted(true);
        onAwardXp(15);
        alert("🎉 Parabéns! Você configurou corretamente a vazão (125 mL/h) para 1000 mL em 8h. +15 XP");
      }
    }
  }, [rate, vtbi, exerciseMode, activeTab]);

  const progressPercent = Math.min((infused / parseFloat(vtbi || '1')) * 100, 100) || 0;
  const remainingVol = Math.max(parseFloat(vtbi || '0') - infused, 0);
  const remainingTimeHours = parseFloat(rate) > 0 ? remainingVol / parseFloat(rate) : 0;
  const rh = Math.floor(remainingTimeHours);
  const rm = Math.floor((remainingTimeHours - rh) * 60);

  return (
    <div className={`p-4 md:p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto h-full pb-24 lg:pb-6 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      
      <div className="flex border-b dark:border-[#333]">
        <button onClick={() => {setActiveTab('volumetric'); handleStop();}} className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'volumetric' ? 'border-[#7c3aed] text-[#7c3aed]' : 'border-transparent text-slate-500'}`}>💧 Volumétrica</button>
        <button onClick={() => {setActiveTab('syringe'); handleStop();}} className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'syringe' ? 'border-[#7c3aed] text-[#7c3aed]' : 'border-transparent text-slate-500'}`}>💉 Seringa</button>
        <button onClick={() => {setActiveTab('pca'); handleStop();}} className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'pca' ? 'border-[#7c3aed] text-[#7c3aed]' : 'border-transparent text-slate-500'}`}>🎮 PCA</button>
      </div>

      <div className="flex justify-between items-center bg-[#7c3aed]/10 p-4 rounded-xl border border-[#7c3aed]/20">
        <div>
          <h3 className="font-bold text-[#7c3aed] text-sm uppercase">Simulador de Bomba de Infusão</h3>
          <p className="text-xs opacity-70">1 segundo real = 30 segundos simulados</p>
        </div>
        <button 
          onClick={() => { setExerciseMode(!exerciseMode); setExerciseCompleted(false); handleStop(); }}
          className="text-xs bg-[#7c3aed] text-white px-3 py-1.5 rounded-lg font-bold"
        >
          {exerciseMode ? "Sair do Exercício" : "Modo Exercício"}
        </button>
      </div>

      {exerciseMode && !exerciseCompleted && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 p-4 rounded-xl text-amber-800 dark:text-amber-200 text-sm font-medium">
          <strong>Exercício Prático:</strong> O médico prescreveu 1000 mL de Soro Fisiológico 0.9% para correr em 8 horas. Configure a vazão correta (mL/h) e o VTBI na bomba volumétrica.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Painel da Bomba (Display) */}
        <div className={`p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center border-4 ${activeAlarm ? 'border-red-500 animate-pulse' : 'border-[#333] dark:border-[#555]'} bg-slate-900 text-white relative`}>
          <div className="w-full bg-[#0a192f] p-4 rounded-xl border-2 border-[#1e293b] shadow-inner mb-6 font-mono text-cyan-400">
            <div className="flex justify-between text-xs mb-2 opacity-80 uppercase font-bold tracking-widest">
              <span>{activeTab === 'pca' ? 'MODO PCA' : 'INFUSÃO CONTÍNUA'}</span>
              {isRunning && <span className="text-emerald-400 animate-pulse">● INFUNDINDO</span>}
              {!isRunning && !activeAlarm && <span className="text-amber-400">PAUSADO</span>}
              {activeAlarm && <span className="text-red-500">ALERTA</span>}
            </div>
            
            <div className="grid grid-cols-2 gap-4 my-4">
              <div>
                <span className="text-[10px] opacity-60">VAZÃO (mL/h)</span>
                <div className="text-4xl font-black">{parseFloat(rate).toFixed(1)}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] opacity-60">VTBI (mL)</span>
                <div className="text-4xl font-black">{parseFloat(vtbi).toFixed(1)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 border-t border-cyan-900 pt-4">
              <div>
                <span className="text-[10px] opacity-60">VOLUME INFUNDIDO</span>
                <div className="text-xl font-bold">{infused.toFixed(1)} mL</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] opacity-60">TEMPO RESTANTE</span>
                <div className="text-xl font-bold">{rh}h {rm}m</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full transition-all duration-300" style={{width: `${progressPercent}%`}}></div>
              </div>
            </div>

            {activeAlarm && (
              <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center rounded-2xl z-10 backdrop-blur-sm">
                <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4 animate-bounce"></i>
                <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">{activeAlarm}</h2>
                <button onClick={clearAlarm} className="mt-4 px-6 py-2 bg-white text-red-900 font-bold rounded-lg hover:bg-slate-200">SILENCIAR ALARME</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            <button onClick={handleStart} disabled={isRunning || activeAlarm !== null} className="bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-lg font-bold shadow-md hover:bg-emerald-500 transition-colors"><i className="fas fa-play mr-2"></i> START</button>
            <button onClick={handlePause} disabled={!isRunning} className="bg-amber-500 disabled:opacity-50 text-white py-3 rounded-lg font-bold shadow-md hover:bg-amber-400 transition-colors"><i className="fas fa-pause mr-2"></i> PAUSE</button>
            <button onClick={handleStop} className="bg-slate-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-slate-500 transition-colors"><i className="fas fa-stop mr-2"></i> STOP</button>
          </div>
        </div>

        {/* Painel de Configuração */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-white border-slate-200'} space-y-4`}>
          <h3 className="font-bold text-sm uppercase tracking-wider text-[#7c3aed] border-b border-slate-200 dark:border-[#333] pb-2 mb-4">
            <i className="fas fa-sliders-h mr-2"></i> Parâmetros da Infusão
          </h3>
          
          <div className="space-y-4">
            <div className="group relative">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Vazão (mL/h)</label>
              <input type="number" value={rate} onChange={e => setRate(e.target.value)} disabled={isRunning} className="w-full p-3 mt-1 rounded-lg border text-sm font-bold bg-slate-50 dark:bg-[#1a1a1a] dark:border-[#444] dark:text-white" />
              <div className="absolute hidden group-hover:block bg-slate-800 text-white text-[10px] p-2 rounded-lg -top-8 right-0 w-48 shadow-lg z-20">Velocidade da infusão (mL por hora).</div>
            </div>

            <div className="group relative">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">VTBI (mL) - Volume Total</label>
              <input type="number" value={vtbi} onChange={e => setVtbi(e.target.value)} disabled={isRunning} className="w-full p-3 mt-1 rounded-lg border text-sm font-bold bg-slate-50 dark:bg-[#1a1a1a] dark:border-[#444] dark:text-white" />
              <div className="absolute hidden group-hover:block bg-slate-800 text-white text-[10px] p-2 rounded-lg -top-8 right-0 w-48 shadow-lg z-20">Volume Total a ser Infundido.</div>
            </div>

            {activeTab === 'pca' && (
              <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-[#333] pt-4 mt-4">
                <div className="group relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Bolus (mL)</label>
                  <input type="number" value={pcaBolus} onChange={e => setPcaBolus(e.target.value)} disabled={isRunning} className="w-full p-2 mt-1 rounded-lg border text-sm font-bold bg-slate-50 dark:bg-[#1a1a1a] dark:border-[#444] dark:text-white" />
                </div>
                <div className="group relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Lockout (min)</label>
                  <input type="number" value={pcaLockout} onChange={e => setPcaLockout(e.target.value)} disabled={isRunning} className="w-full p-2 mt-1 rounded-lg border text-sm font-bold bg-slate-50 dark:bg-[#1a1a1a] dark:border-[#444] dark:text-white" />
                </div>
                
                <div className="col-span-2 bg-[#7c3aed]/10 p-3 rounded-lg border border-[#7c3aed]/20 mt-2">
                  <div className="flex justify-between text-xs font-bold text-[#7c3aed]">
                    <span>Demandas: {pcaDemands}</span>
                    <span>Entregues: {pcaGiven}</span>
                  </div>
                  <button onClick={handlePcaDemand} className="w-full mt-2 py-3 bg-[#7c3aed] text-white rounded-lg font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg"><i className="fas fa-hand-pointer mr-2"></i> Botão do Paciente</button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-[#333] pt-4 mt-4">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 mb-2">Simular Intercorrências</h4>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => triggerAlarm('Oclusão')} className="p-2 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-900/50 hover:bg-red-100">Simular Oclusão</button>
              <button onClick={() => triggerAlarm('Ar no Equipo')} className="p-2 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-900/50 hover:bg-red-100">Simular Ar</button>
            </div>
          </div>

        </div>
      </div>
      
      <section className={`p-4 rounded-xl border text-[11px] leading-relaxed font-semibold ${darkMode ? 'bg-[#1e1e1e] border-[#333] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        <h4 className="font-bold uppercase text-[9px] text-[#7c3aed] tracking-widest mb-1.5 flex items-center gap-1.5">
          <i className="fas fa-book-reader"></i> Fundamentação Teórica e Prática Segura
        </h4>
        <p className="mb-1"><strong>VTBI (Volume To Be Infused)</strong>: Volume total que deve ser infundido no paciente.</p>
        <p className="mb-1"><strong>KVO (Keep Vein Open)</strong>: Ritmo mínimo para manter o acesso venoso permeável ao fim da infusão (geralmente 1-5 mL/h).</p>
        <p className="mb-1"><strong>Oclusão</strong>: Alarme ativado por aumento da resistência/pressão. Causas comuns: equipo dobrado, acesso flebítico ou torneirinha fechada.</p>
        <p className="mt-3 text-[9px] opacity-70">📋 Ferramenta Educacional v1.0.0. Simulação apenas ilustrativa (1s real = 30s simulados).</p>
      </section>
    </div>
  );
};

export default InfusionPumpSimulator;
