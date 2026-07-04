
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
    <div className={`grid grid-cols-5 gap-1.5 px-4 ${compact ? 'py-1.5' : 'py-2.5'} ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      {formats.map((f) => (
        <button
          key={f.type}
          onClick={() => onSelect(f.type)}
          className={`flex flex-col items-center ${compact ? 'p-1.5' : 'p-2'} rounded-lg transition-all border ${
            selected === f.type 
            ? 'border-[#FFCC00] bg-[#fffdf0] scale-105 shadow-sm' 
            : darkMode 
              ? 'border-transparent bg-[#252525] hover:border-[#FFCC00]'
              : 'border-transparent bg-slate-50 hover:border-[#b22222]'
          }`}
        >
          <div className={`w-10 h-10 ${darkMode ? 'bg-[#333] text-[#FFCC00]' : f.color} rounded-lg flex items-center justify-center mb-1 shadow-sm transition-transform hover:scale-110`}>
            <i className={`fas ${f.icon} ${compact ? 'text-lg' : 'text-xl'}`}></i>
          </div>
          <span className={`text-[7px] font-black text-center leading-tight uppercase w-full ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {f.type}
          </span>
        </button>
      ))}
    </div>
  );
};

export default FormatSelector;
