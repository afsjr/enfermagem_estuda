import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MindMapNode } from '../types';

interface MindMapViewProps {
  data: MindMapNode;
  darkMode?: boolean;
}

interface HierarchyNode extends d3.HierarchyNode<MindMapNode> {
  _children?: HierarchyNode[] | null;
  x0?: number;
  y0?: number;
  id?: string;
}

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

const MindMapView: React.FC<MindMapViewProps> = ({ data, darkMode }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Dimensions
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;
    
    // SVG Setup
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    // Enable Zoom and Pan
    const zoomGroup = svg.append('g');
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
      });
      
    svg.call(zoom);

    // Hierarchy setup
    let root = d3.hierarchy<MindMapNode>(data) as d3.HierarchyPointNode<MindMapNode> & HierarchyNode;
    
    // Initialize identifiers and states
    let i = 0;
    root.descendants().forEach((d: any) => {
      d.id = d.id || String(++i);
      d._children = d.children; // Save full tree initially
    });

    // Layout config
    const nodeWidth = 220;
    const nodeHeight = 60;
    
    // Configura o espaçamento entre os nós (horizontal tree)
    // nodeSize inverts x/y for horizontal trees. [ySize, xSize]
    const treeMap = d3.tree<MindMapNode>()
      .nodeSize([nodeHeight + 30, nodeWidth + 60]);

    // Initial position for animation origin
    root.x0 = height / 2;
    root.y0 = 0;

    // Groups for drawing
    const gLink = zoomGroup.append("g")
        .attr("fill", "none")
        .attr("stroke", darkMode ? "#475569" : "#cbd5e1")
        .attr("stroke-width", 2.5);

    const gNode = zoomGroup.append("g")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all");

    // Creates a curved (diagonal) path from parent to child
    function diagonal(s: any, d: any) {
      // Offset by nodeWidth/2 so lines connect to the edges of the foreignObject (which is centered)
      const sourceY = s.y + (nodeWidth / 2);
      const targetY = d.y - (nodeWidth / 2);
      
      return `M ${sourceY} ${s.x}
              C ${(sourceY + targetY) / 2} ${s.x},
                ${(sourceY + targetY) / 2} ${d.x},
                ${targetY} ${d.x}`;
    }

    // Main update cycle
    function update(source: any) {
      const treeData = treeMap(root);
      const nodes = treeData.descendants();
      const links = treeData.descendants().slice(1);

      const transition = svg.transition()
          .duration(500)
          .ease(d3.easeCubicOut) as any;

      // ----------------------------------------------------
      // UPDATING NODES
      // ----------------------------------------------------
      const node = gNode.selectAll<SVGGElement, any>('g.node')
          .data(nodes, (d: any) => d.id);

      // Enter any new nodes at the parent's previous position.
      const nodeEnter = node.enter().append('g')
          .attr('class', 'node')
          .attr('transform', d => `translate(${source.y0},${source.x0})`)
          .attr('fill-opacity', 0)
          .attr('stroke-opacity', 0)
          .on('click', (event, d) => {
            // Toggle children on click
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
          });

      // Embed HTML nodes via foreignObject to preserve glassmorphism CSS
      nodeEnter.append('foreignObject')
          .attr('width', nodeWidth + 40)
          .attr('height', nodeHeight + 40)
          .attr('x', -(nodeWidth / 2) - 20)
          .attr('y', -(nodeHeight / 2) - 20)
          .append('xhtml:div')
          .style('width', '100%')
          .style('height', '100%')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .html((d) => {
            const colors = getColorsForLevel(d.depth, darkMode);
            const hasChildren = d._children || d.children;
            const isCollapsed = !d.children;
            const icon = hasChildren ? (isCollapsed ? '▸' : '▾') : '';
            return `
              <div class="mindmap-node" style="
                  background: ${colors.bg};
                  border-color: ${colors.border};
                  color: ${colors.text};
                  width: ${nodeWidth}px;
                  pointer-events: none; /* Let SVG handle clicks */
              ">
                ${d.data.label}
                ${hasChildren ? `<span style="opacity: 0.7; margin-left: 8px;">${icon}</span>` : ''}
              </div>
            `;
          });

      // This is the selection BEFORE transition
      const nodeMerged = node.merge(nodeEnter);

      // Transition nodes to their new position.
      nodeMerged.transition(transition)
          .attr('transform', d => `translate(${d.y},${d.x})`)
          .attr('fill-opacity', 1)
          .attr('stroke-opacity', 1);
          
      // Update icon dynamically on the Selection, NOT the Transition!
      nodeMerged.select('foreignObject div.mindmap-node')
        .html((d: any) => {
            const colors = getColorsForLevel(d.depth, darkMode);
            const hasChildren = d._children || d.children;
            const isCollapsed = !d.children;
            const icon = hasChildren ? (isCollapsed ? '▸' : '▾') : '';
            return `
                ${d.data.label}
                ${hasChildren ? `<span style="opacity: 0.7; margin-left: 8px;">${icon}</span>` : ''}
            `;
        });

      // Transition exiting nodes to the parent's new position.
      node.exit().transition(transition).remove()
          .attr('transform', d => `translate(${source.y},${source.x})`)
          .attr('fill-opacity', 0)
          .attr('stroke-opacity', 0);

      // ----------------------------------------------------
      // UPDATING LINKS
      // ----------------------------------------------------
      const link = gLink.selectAll<SVGPathElement, any>('path.link')
          .data(links, (d: any) => d.id);

      // Enter any new links at the parent's previous position.
      const linkEnter = link.enter().append('path')
          .attr('class', 'link')
          .attr('d', d => {
            const o = {x: source.x0, y: source.y0};
            return diagonal(o, o);
          });

      // Transition links to their new position.
      link.merge(linkEnter).transition(transition)
          .attr('d', d => diagonal(d, d.parent));

      // Transition exiting nodes to the parent's new position.
      link.exit().transition(transition).remove()
          .attr('d', d => {
            const o = {x: source.x, y: source.y};
            return diagonal(o, o);
          });

      // Stash the old positions for transition.
      nodes.forEach((d: any) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    // Initial centering of the tree
    // We position the root node at x=100 so there's some margin on the left
    const initialTransform = d3.zoomIdentity.translate(100, height / 2);
    svg.call(zoom.transform as any, initialTransform);

    update(root);
    
    // Optional resize listener
    const handleResize = () => {};
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    
  }, [JSON.stringify(data), darkMode]); // Usar stringify previne re-render loops se a referência de data mudar

  // Using the outer div to pass "dark" class to the foreignObject CSS scope
  return (
    <div ref={containerRef} className={`w-full h-full min-h-[500px] overflow-hidden rounded-xl cursor-grab active:cursor-grabbing ${darkMode ? 'dark bg-[#1a1a1a]' : 'bg-slate-50'}`}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default MindMapView;
