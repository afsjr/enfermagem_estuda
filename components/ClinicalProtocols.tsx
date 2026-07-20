import React, { useState } from 'react';

interface ClinicalProtocolsProps {
  darkMode?: boolean;
}

type ProtocolTab = 'pcr' | 'iam' | 'avc' | 'sepse' | 'trauma' | 'queimaduras';

const ClinicalProtocols: React.FC<ClinicalProtocolsProps> = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState<ProtocolTab>('pcr');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // States for Burn Calculator
  const [weight, setWeight] = useState<string>('');
  const [burnHead, setBurnHead] = useState<number>(0);
  const [burnTrunkFront, setBurnTrunkFront] = useState<number>(0);
  const [burnTrunkBack, setBurnTrunkBack] = useState<number>(0);
  const [burnArmRight, setBurnArmRight] = useState<number>(0);
  const [burnArmLeft, setBurnArmLeft] = useState<number>(0);
  const [burnLegRight, setBurnLegRight] = useState<number>(0);
  const [burnLegLeft, setBurnLegLeft] = useState<number>(0);
  const [burnGenitals, setBurnGenitals] = useState<number>(0);

  const handleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getTbsa = () => {
    return burnHead + burnTrunkFront + burnTrunkBack + burnArmRight + burnArmLeft + burnLegRight + burnLegLeft + burnGenitals;
  };

  const calculateParkland = () => {
    const w = parseFloat(weight);
    if (!w || getTbsa() === 0) return null;
    // ATLS 10th Ed: 2ml * kg * TBSA for adults with thermal burns
    const totalVolume = 2 * w * getTbsa();
    const first8h = totalVolume / 2;
    const next16h = totalVolume / 2;
    return { total: totalVolume, first8h, next16h };
  };

  const renderChecklistItem = (id: string, text: string, detail?: string) => (
    <div 
      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
        checkedItems[id] 
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
          : 'bg-white border-slate-200 dark:bg-[#252525] dark:border-slate-700 hover:border-red-300'
      }`}
      onClick={() => handleCheck(id)}
    >
      <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
        checkedItems[id] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
      }`}>
        {checkedItems[id] && <i className="fas fa-check text-xs"></i>}
      </div>
      <div>
        <p className={`font-bold text-sm ${checkedItems[id] ? 'text-emerald-800 dark:text-emerald-400 line-through opacity-70' : 'text-slate-700 dark:text-slate-300'}`}>
          {text}
        </p>
        {detail && <p className="text-xs text-slate-500 mt-1">{detail}</p>}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto h-full pb-32 lg:pb-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-blue-900/10 p-4 rounded-xl border border-blue-600/20 mb-6 gap-4">
        <div>
          <h2 className="font-bold text-blue-600 dark:text-blue-400 text-xl flex items-center gap-2">
            <i className="fas fa-clipboard-list"></i> Protocolos Clínicos (Checklists)
          </h2>
          <p className="text-sm opacity-70">Passo a passo das principais emergências para triagem e conduta.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto border-b dark:border-slate-700 mb-6 no-scrollbar pb-1">
        {[
          { id: 'pcr', label: '💓 PCR' },
          { id: 'iam', label: '🫀 IAM' },
          { id: 'avc', label: '🧠 AVC' },
          { id: 'sepse', label: '🦠 Sepse' },
          { id: 'trauma', label: '🚑 Trauma' },
          { id: 'queimaduras', label: '🔥 Queimaduras' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ProtocolTab)} 
            className={`whitespace-nowrap px-4 py-3 font-bold text-sm border-b-2 min-h-[44px] transition-all ${
              activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent opacity-60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="bg-white dark:bg-[#1a1a1a] border dark:border-slate-800 rounded-xl p-6 shadow-sm mb-6">
        
        {/* PCR */}
        {activeTab === 'pcr' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-4">Algoritmo de Parada Cardiorrespiratória (Adulto)</h3>
            <div className="space-y-2">
              {renderChecklistItem('pcr_1', 'Reconhecer PCR e Pedir Ajuda', 'Verificar responsividade, respiração (ausente ou gasping) e pulso central (máx 10 seg). Chamar equipe e solicitar desfibrilador/carrinho de emergência.')}
              {renderChecklistItem('pcr_2', 'Iniciar RCP de Alta Qualidade', '30 compressões : 2 ventilações. Frequência 100-120/min. Profundidade de 5cm. Permitir retorno total do tórax.')}
              {renderChecklistItem('pcr_3', 'Analisar o Ritmo (Chegada do DEA/Monitor)', 'Se ritmo chocável (FV/TV sem pulso): Aplicar choque. Se não chocável (Assistolia/AESP): Retomar RCP imediatamente.')}
              {renderChecklistItem('pcr_4', 'Obter Acesso IV/IO e Administrar Epinefrina', 'Epinefrina 1 mg a cada 3 a 5 minutos.')}
              {renderChecklistItem('pcr_5', 'Considerar Via Aérea Avançada', 'Após via aérea avançada, 1 ventilação a cada 6 segundos (10/min) sem pausar compressões.')}
              {renderChecklistItem('pcr_6', 'Identificar Causas Reversíveis (5Hs e 5Ts)', 'Hipovolemia, Hipóxia, H+ (acidose), Hipo/Hipercalemia, Hipotermia. Tensão no tórax (pneumotórax), Tamponamento, Toxinas, Trombose pulmonar, Trombose coronária.')}
            </div>
          </div>
        )}

        {/* IAM */}
        {activeTab === 'iam' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-4">Infarto Agudo do Miocárdio (Triagem e MONAC)</h3>
            <div className="space-y-2">
              {renderChecklistItem('iam_1', 'Realizar ECG em até 10 minutos', 'Tempo porta-ECG ideal é < 10 minutos. Procurar por supradesnivelamento do segmento ST.')}
              {renderChecklistItem('iam_2', 'M - Morfina', 'Se dor não for aliviada com nitrato. Cuidado com hipotensão.')}
              {renderChecklistItem('iam_3', 'O - Oxigênio', 'Apenas se saturação < 90% ou desconforto respiratório.')}
              {renderChecklistItem('iam_4', 'N - Nitrato', 'Vasodilatador sublingual. Contraindicado se uso recente de inibidores da fosfodiesterase (Sildenafil) ou infarto de VD.')}
              {renderChecklistItem('iam_5', 'A - Aspirina (AAS)', '160 a 325 mg mastigados.')}
              {renderChecklistItem('iam_6', 'C - Clopidogrel', 'Dose de ataque (geralmente 300 a 600 mg) conforme protocolo institucional.')}
              {renderChecklistItem('iam_7', 'Atenção ao Tempo Porta-Balão', 'Meta < 90 minutos para Intervenção Coronária Percutânea (Cateterismo) em hospital com hemodinâmica.')}
            </div>
          </div>
        )}

        {/* AVC */}
        {activeTab === 'avc' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-4">Acidente Vascular Cerebral (Triagem FAST)</h3>
            <div className="space-y-2">
              {renderChecklistItem('avc_1', 'F - Face (Rosto)', 'Pedir para o paciente sorrir. Avaliar assimetria (boca torta).')}
              {renderChecklistItem('avc_2', 'A - Arms (Braços)', 'Pedir para elevar os dois braços. Avaliar se um braço cai ou não tem força.')}
              {renderChecklistItem('avc_3', 'S - Speech (Fala)', 'Pedir para repetir uma frase simples. Avaliar fala arrastada, incompreensível ou afasia.')}
              {renderChecklistItem('avc_4', 'T - Time (Tempo)', 'Identificar a hora exata do início dos sintomas. Janela para trombólise é de até 4,5 horas.')}
              {renderChecklistItem('avc_5', 'Glicemia Capilar', 'Descartar hipoglicemia, que pode simular sintomas de AVC.')}
              {renderChecklistItem('avc_6', 'Encaminhar para TC de Crânio', 'Tempo porta-TC ideal é < 25 minutos.')}
            </div>
            
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl mt-6">
              <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1 text-sm flex items-center gap-2">
                <i className="fas fa-lightbulb"></i> Interpretação Clínica (Dica da Preceptoria)
              </h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
                Se 1 de 3 sinais do FAST estiver presente, a probabilidade de AVC é de 72%. Não atrase o atendimento. A Escala NIHSS será usada pela equipe médica no hospital para quantificar a gravidade do déficit neurológico antes da trombólise.
              </p>
            </div>
          </div>
        )}

        {/* Sepse */}
        {activeTab === 'sepse' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-4">Triagem qSOFA e Bundle da Sepse (1 Hora)</h3>
            
            <h4 className="font-bold text-sm text-slate-600 dark:text-slate-400 mt-2 mb-2">Avaliação qSOFA (Triagem)</h4>
            <div className="space-y-2">
              {renderChecklistItem('sep_q1', 'Frequência Respiratória ≥ 22 irpm', '')}
              {renderChecklistItem('sep_q2', 'Pressão Arterial Sistólica ≤ 100 mmHg', '')}
              {renderChecklistItem('sep_q3', 'Alteração do Nível de Consciência (Glasgow < 15)', '')}
            </div>

            <h4 className="font-bold text-sm text-slate-600 dark:text-slate-400 mt-6 mb-2">Bundle de 1 Hora (Ações Imediatas)</h4>
            <div className="space-y-2">
              {renderChecklistItem('sep_b1', 'Medir Nível de Lactato', 'Se lactato inicial > 2 mmol/L, remensurar em 2 a 4 horas.')}
              {renderChecklistItem('sep_b2', 'Coletar Hemoculturas', 'Sempre coletar ANTES da administração do antibiótico, se não atrasar significativamente (>45min).')}
              {renderChecklistItem('sep_b3', 'Administrar Antibiótico de Amplo Espectro', 'Iniciar na primeira hora do reconhecimento.')}
              {renderChecklistItem('sep_b4', 'Administrar Cristaloides (30 mL/kg)', 'Indicado para hipotensão ou lactato ≥ 4 mmol/L.')}
              {renderChecklistItem('sep_b5', 'Aplicar Vasopressores', 'Se paciente continuar hipotenso após reposição volêmica, visando PAM ≥ 65 mmHg.')}
            </div>
            
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl mt-6">
              <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1 text-sm flex items-center gap-2">
                <i className="fas fa-lightbulb"></i> Interpretação Clínica (Dica da Preceptoria)
              </h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
                Um qSOFA ≥ 2 indica alto risco de desfecho ruim. Lembre-se: O tempo é crítico na Sepse. A cada hora de atraso no antibiótico, a mortalidade aumenta significativamente.
              </p>
            </div>
          </div>
        )}

        {/* Trauma */}
        {activeTab === 'trauma' && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-4">Abordagem ao Trauma (ABCDE)</h3>
            <div className="space-y-2">
              {renderChecklistItem('trauma_a', 'A - Airway (Vias Aéreas)', 'Garantir permeabilidade das vias aéreas com controle cervical (colar cervical).')}
              {renderChecklistItem('trauma_b', 'B - Breathing (Respiração)', 'Avaliar expansibilidade, ausculta e administrar O2 se necessário. Identificar pneumotórax.')}
              {renderChecklistItem('trauma_c', 'C - Circulation (Circulação)', 'Controlar hemorragias compressíveis. Obter 2 acessos venosos calibrosos. Avaliar pulso e perfusão.')}
              {renderChecklistItem('trauma_d', 'D - Disability (Disfunção Neurológica)', 'Avaliar Escala de Coma de Glasgow (ECG) e reação pupilar.')}
              {renderChecklistItem('trauma_e', 'E - Exposure (Exposição)', 'Despir o paciente completamente para procurar lesões ocultas. Prevenir hipotermia com mantas térmicas.')}
            </div>
          </div>
        )}

        {/* Queimaduras */}
        {activeTab === 'queimaduras' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">Regra dos Nove e Fórmula de Parkland</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calculadora Regra dos 9 */}
              <div className="p-4 bg-slate-50 dark:bg-[#252525] rounded-xl border dark:border-slate-700">
                <h4 className="font-bold text-sm mb-3">Regra dos Nove (% SCQ)</h4>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="font-bold opacity-70">Cabeça (9%)</label>
                    <select value={burnHead} onChange={e => setBurnHead(Number(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-[#1a1a1a] dark:border-slate-600">
                      <option value={0}>0%</option><option value={4.5}>4.5% (Frente ou Costas)</option><option value={9}>9% (Total)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold opacity-70">Tronco Ant. (18%)</label>
                    <select value={burnTrunkFront} onChange={e => setBurnTrunkFront(Number(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-[#1a1a1a] dark:border-slate-600">
                      <option value={0}>0%</option><option value={9}>9% (Metade)</option><option value={18}>18% (Total)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold opacity-70">Tronco Post. (18%)</label>
                    <select value={burnTrunkBack} onChange={e => setBurnTrunkBack(Number(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-[#1a1a1a] dark:border-slate-600">
                      <option value={0}>0%</option><option value={9}>9% (Metade)</option><option value={18}>18% (Total)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold opacity-70">Braço Dir. (9%)</label>
                    <select value={burnArmRight} onChange={e => setBurnArmRight(Number(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-[#1a1a1a] dark:border-slate-600">
                      <option value={0}>0%</option><option value={4.5}>4.5% (Metade)</option><option value={9}>9% (Total)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold opacity-70">Braço Esq. (9%)</label>
                    <select value={burnArmLeft} onChange={e => setBurnArmLeft(Number(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-[#1a1a1a] dark:border-slate-600">
                      <option value={0}>0%</option><option value={4.5}>4.5% (Metade)</option><option value={9}>9% (Total)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold opacity-70">Perna Dir. (18%)</label>
                    <select value={burnLegRight} onChange={e => setBurnLegRight(Number(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-[#1a1a1a] dark:border-slate-600">
                      <option value={0}>0%</option><option value={9}>9% (Metade)</option><option value={18}>18% (Total)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold opacity-70">Perna Esq. (18%)</label>
                    <select value={burnLegLeft} onChange={e => setBurnLegLeft(Number(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-[#1a1a1a] dark:border-slate-600">
                      <option value={0}>0%</option><option value={9}>9% (Metade)</option><option value={18}>18% (Total)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold opacity-70">Genitália (1%)</label>
                    <select value={burnGenitals} onChange={e => setBurnGenitals(Number(e.target.value))} className="w-full p-2 border rounded mt-1 dark:bg-[#1a1a1a] dark:border-slate-600">
                      <option value={0}>0%</option><option value={1}>1% (Total)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg text-center font-black text-xl">
                  Total: {getTbsa()}% SCQ
                </div>
              </div>

              {/* Calculadora Parkland */}
              <div className="p-4 bg-slate-50 dark:bg-[#252525] rounded-xl border dark:border-slate-700 flex flex-col">
                <h4 className="font-bold text-sm mb-3">Fórmula de Parkland (ATLS 10ª Ed.)</h4>
                <div>
                  <label className="text-xs font-bold uppercase opacity-70">Peso do Paciente (kg)</label>
                  <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ex: 70" className="w-full mt-1 p-3 min-h-[44px] border rounded-xl bg-white dark:bg-[#1a1a1a] dark:border-slate-600 text-sm" />
                </div>

                {calculateParkland() && (
                  <div className="mt-4 flex-1 flex flex-col justify-center space-y-2 text-sm">
                    <div className="flex justify-between p-2 border-b dark:border-slate-600">
                      <span>Volume Total (24h):</span>
                      <span className="font-bold">{calculateParkland()?.total} mL</span>
                    </div>
                    <div className="flex justify-between p-2 border-b dark:border-slate-600 text-blue-600 dark:text-blue-400">
                      <span>Primeiras 8 horas (50%):</span>
                      <span className="font-bold">{calculateParkland()?.first8h} mL</span>
                    </div>
                    <div className="flex justify-between p-2 text-emerald-600 dark:text-emerald-400">
                      <span>Próximas 16 horas (50%):</span>
                      <span className="font-bold">{calculateParkland()?.next16h} mL</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
              <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-1 text-sm flex items-center gap-2">
                <i className="fas fa-lightbulb"></i> Interpretação Clínica (Dica da Preceptoria)
              </h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
                <strong>ATENÇÃO:</strong> A 10ª edição do ATLS recomenda agora o uso de <strong>2 mL/kg/%SCQ</strong> de Ringer Lactato para queimaduras térmicas em adultos (antigamente usava-se 4 mL). O tempo de infusão é calculado a partir do <strong>momento da queimadura</strong>, e não da chegada ao hospital. A meta é manter o débito urinário em 0,5 mL/kg/h.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ClinicalProtocols;
