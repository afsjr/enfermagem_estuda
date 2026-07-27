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
      if (lvl === 0) return { bg: 'linear-gradient(135deg, rgba(225, 29, 72, 0.3), rgba(159, 18, 57, 0.4))', border: 'rgba(244, 63, 94, 0.4)', text: '#fff1f2' };
      if (lvl === 1) return { bg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(30, 64, 175, 0.35))', border: 'rgba(96, 165, 250, 0.3)', text: '#eff6ff' };
      if (lvl === 2) return { bg: 'linear-gradient(135deg, rgba(82, 82, 91, 0.25), rgba(39, 39, 42, 0.4))', border: 'rgba(161, 161, 170, 0.2)', text: '#f4f4f5' };
      return { bg: 'linear-gradient(135deg, rgba(217, 119, 6, 0.2), rgba(180, 83, 9, 0.3))', border: 'rgba(251, 191, 36, 0.3)', text: '#fffbeb' };
    } else {
      // Light mode glassmorphism gradients
      if (lvl === 0) return { bg: 'linear-gradient(135deg, rgba(225, 29, 72, 0.9), rgba(159, 18, 57, 0.95))', border: 'rgba(225, 29, 72, 0.2)', text: '#ffffff' };
      if (lvl === 1) return { bg: 'linear-gradient(135deg, rgba(37, 99, 235, 0.85), rgba(30, 64, 175, 0.95))', border: 'rgba(37, 99, 235, 0.2)', text: '#ffffff' };
      if (lvl === 2) return { bg: 'linear-gradient(135deg, rgba(244, 244, 245, 0.8), rgba(228, 228, 231, 0.9))', border: 'rgba(212, 212, 216, 0.5)', text: '#3f3f46' };
      return { bg: 'linear-gradient(135deg, rgba(254, 252, 232, 0.9), rgba(254, 249, 195, 0.95))', border: 'rgba(253, 224, 71, 0.6)', text: '#854d0e' };
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
