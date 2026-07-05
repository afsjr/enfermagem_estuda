
import React from 'react';
import { StudyFormat } from '../types';

interface FormatSelectorProps {
  onSelect: (format: StudyFormat) => void;
  selected?: StudyFormat;
  compact?: boolean;
  darkMode?: boolean;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ onSelect, selected, compact, darkMode }) => {
  const formats = [
    { type: StudyFormat.GUIDE, icon: 'fa-book-open', color: 'bg-blue-50 text-blue-800' },
    { type: StudyFormat.CASE, icon: 'fa-hospital-user', color: 'bg-indigo-50 text-indigo-800' },
    { type: StudyFormat.MINDMAP, icon: 'fa-network-wired', color: 'bg-amber-50 text-amber-800' },
    { type: StudyFormat.SUMMARY, icon: 'fa-file-alt', color: 'bg-slate-50 text-slate-800' },
    { type: StudyFormat.QUIZ, icon: 'fa-check-double', color: 'bg-emerald-50 text-emerald-800' },
  ];

  return (
    <div className={`flex overflow-x-auto gap-2 snap-x snap-mandatory lg:grid lg:grid-cols-5 lg:overflow-visible hide-scrollbar px-4 ${compact ? 'py-1.5' : 'py-2.5'} ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      {formats.map((f) => (
        <button
          key={f.type}
          onClick={() => onSelect(f.type)}
          className={`snap-center shrink-0 min-w-[72px] flex flex-col items-center ${compact ? 'p-1.5' : 'p-2'} rounded-lg transition-all border ${
            selected === f.type 
            ? (darkMode ? 'border-yellow-500 bg-yellow-900/30 scale-105 shadow-sm' : 'border-red-500 bg-red-50 scale-105 shadow-sm')
            : (darkMode 
              ? 'border-transparent bg-neutral-800 hover:border-yellow-500/50'
              : 'border-transparent bg-slate-100 hover:border-red-500/50')
          }`}
        >
          <div className={`w-11 h-11 lg:w-10 lg:h-10 ${darkMode ? (selected === f.type ? 'bg-yellow-500 text-neutral-900' : 'bg-neutral-700 text-yellow-500') : (selected === f.type ? 'bg-red-600 text-white' : f.color)} rounded-lg flex items-center justify-center mb-1 shadow-sm transition-transform hover:scale-110`}>
            <i className={`fas ${f.icon} ${compact ? 'text-lg' : 'text-xl'}`}></i>
          </div>
          <span className={`text-[9px] lg:text-[7px] font-black text-center leading-tight uppercase w-full ${
            selected === f.type 
              ? (darkMode ? 'text-yellow-500' : 'text-red-700') 
              : (darkMode ? 'text-slate-400' : 'text-slate-500')
          }`}>
            {f.type}
          </span>
        </button>
      ))}
    </div>
  );
};

export default FormatSelector;
