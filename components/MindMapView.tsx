import React, { useState, useEffect } from 'react';
import { MindMapNode } from '../types';

interface MindMapViewProps {
  data: MindMapNode;
  darkMode?: boolean;
}

const MindMapNodeComponent: React.FC<{ node: MindMapNode; level: number; darkMode?: boolean }> = ({ node, level, darkMode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  const getColorsForLevel = (lvl: number, isDark?: boolean) => {
    if (isDark) {
      if (lvl === 0) return { bg: '#b22222', border: '#ff4444', text: '#ffffff' };
      if (lvl === 1) return { bg: '#1e3a5f', border: '#3b82f6', text: '#e2e8f0' };
      if (lvl === 2) return { bg: '#252525', border: '#444444', text: '#e2e8f0' };
      return { bg: '#333300', border: '#FFCC00', text: '#fef08a' };
    } else {
      if (lvl === 0) return { bg: '#b22222', border: '#8b0000', text: '#ffffff' };
      if (lvl === 1) return { bg: '#003366', border: '#002244', text: '#ffffff' };
      if (lvl === 2) return { bg: '#f0f4f8', border: '#cbd5e1', text: '#334155' };
      return { bg: '#fefce8', border: '#FFCC00', text: '#713f12' };
    }
  };

  const colors = getColorsForLevel(level, darkMode);

  return (
    <div className="mindmap-branch">
      <div 
        className="mindmap-node" 
        style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {node.label}
        {hasChildren && <span className="ml-2 opacity-70">{isExpanded ? '▾' : '▸'}</span>}
      </div>
      
      {hasChildren && (
        <div className={`mindmap-children-wrapper ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="mindmap-connector-line"></div>
          <div className="mindmap-children">
            {node.children!.map((child, i) => (
              <MindMapNodeComponent key={i} node={child} level={level + 1} darkMode={darkMode} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MindMapView: React.FC<MindMapViewProps> = ({ data, darkMode }) => {
  return (
    <div className={`mindmap-container ${darkMode ? 'dark' : ''}`}>
      <MindMapNodeComponent node={data} level={0} darkMode={darkMode} />
    </div>
  );
};

export default MindMapView;
