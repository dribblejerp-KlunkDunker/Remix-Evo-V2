import React, { useState, useMemo } from 'react';
import type { LineageGraph, LineageNode } from '../../../server/evolution/lineageGraph';
import type { AgentSkill } from '../../types/skills';
import { GitFork, Eye, EyeOff, X, Network, Dna } from 'lucide-react';

export interface LineageGraphViewProps {
  lineageGraph: LineageGraph;
  onInspectSkill?: (skill: AgentSkill) => void;
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  className?: string;
  skills?: AgentSkill[];
}

export const LineageGraphView: React.FC<LineageGraphViewProps> = ({
  lineageGraph,
  onInspectSkill,
  isOpenAsOverlay = false,
  onCloseOverlay,
  className = '',
  skills = [],
}) => {
  const [hideRetired, setHideRetired] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Subtitle dynamically computed from edge data
  const mutationCount = useMemo(
    () => lineageGraph.edges.filter((e) => e.kind === 'mutation').length,
    [lineageGraph.edges],
  );
  const crossoverCount = useMemo(
    () => lineageGraph.edges.filter((e) => e.kind === 'crossover').length,
    [lineageGraph.edges],
  );

  const visibleNodes = useMemo(() => {
    if (!hideRetired) return lineageGraph.nodes;
    return lineageGraph.nodes.filter((n) => !n.retired);
  }, [lineageGraph.nodes, hideRetired]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.skillId)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return lineageGraph.edges.filter(
      (e) => visibleNodeIds.has(e.sourceSkillId) && visibleNodeIds.has(e.targetSkillId),
    );
  }, [lineageGraph.edges, visibleNodeIds]);

  // Connected nodes map for hover dimming
  const connectedMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const n of visibleNodes) map.set(n.skillId, new Set([n.skillId]));
    for (const e of visibleEdges) {
      map.get(e.sourceSkillId)?.add(e.targetSkillId);
      map.get(e.targetSkillId)?.add(e.sourceSkillId);
    }
    return map;
  }, [visibleNodes, visibleEdges]);

  // Deterministic layout: row per depth (130px), columns (150px), margins 90 & 56px
  const layout = useMemo(() => {
    const depthMap = new Map<number, LineageNode[]>();
    for (const n of visibleNodes) {
      const arr = depthMap.get(n.depth) ?? [];
      arr.push(n);
      depthMap.set(n.depth, arr);
    }

    // Sort each row by generation ascending then code
    for (const arr of depthMap.values()) {
      arr.sort((a, b) => {
        if (a.generation !== b.generation) return a.generation - b.generation;
        return a.code.localeCompare(b.code);
      });
    }

    const marginX = 90;
    const marginY = 56;
    const rowGap = 130;
    const colGap = 150;

    let maxColCount = 1;
    let maxDepth = 0;
    const positions = new Map<string, { x: number; y: number }>();

    for (const [depth, rowNodes] of depthMap.entries()) {
      if (depth > maxDepth) maxDepth = depth;
      if (rowNodes.length > maxColCount) maxColCount = rowNodes.length;

      rowNodes.forEach((node, colIdx) => {
        positions.set(node.skillId, {
          x: marginX + colIdx * colGap,
          y: marginY + depth * rowGap,
        });
      });
    }

    const width = Math.max(900, marginX * 2 + (maxColCount - 1) * colGap + 120);
    const height = Math.max(500, marginY * 2 + maxDepth * rowGap + 100);

    return { positions, width, height };
  }, [visibleNodes]);

  const content = (
    <div className={`space-y-4 font-mono ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-stone-900/90 border border-stone-800 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Skill Ancestry & Lineage</h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            {lineageGraph.nodes.length} nodes · {mutationCount} mutation {mutationCount === 1 ? 'edge' : 'edges'} ·{' '}
            {crossoverCount} crossover {crossoverCount === 1 ? 'edge' : 'edges'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHideRetired((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors cursor-pointer ${
              hideRetired
                ? 'bg-amber-950/70 border-amber-600/70 text-amber-200'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
            }`}
          >
            {hideRetired ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{hideRetired ? 'Hiding Retired Ancestors' : 'Show All Ancestors'}</span>
          </button>

          {isOpenAsOverlay && onCloseOverlay && (
            <button
              onClick={onCloseOverlay}
              className="z-50 p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-600 cursor-pointer"
              title="Close overlay"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="overflow-auto border border-stone-800 bg-stone-950/90 p-4 min-h-[460px] max-h-[720px] rounded-xs">
        <svg
          width={layout.width}
          height={layout.height}
          className="select-none"
          style={{ minWidth: `${layout.width}px`, minHeight: `${layout.height}px` }}
        >
          <defs>
            <marker id="arrow-mutation" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" opacity="0.8" />
            </marker>
            <marker id="arrow-crossover" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" opacity="0.8" />
            </marker>
          </defs>

          {/* Edges */}
          <g>
            {visibleEdges.map((edge) => {
              const src = layout.positions.get(edge.sourceSkillId);
              const dst = layout.positions.get(edge.targetSkillId);
              if (!src || !dst) return null;

              const isCrossover = edge.kind === 'crossover';
              const isHighlighted =
                hoveredNodeId !== null &&
                (edge.sourceSkillId === hoveredNodeId || edge.targetSkillId === hoveredNodeId);
              const isDimmed =
                hoveredNodeId !== null &&
                edge.sourceSkillId !== hoveredNodeId &&
                edge.targetSkillId !== hoveredNodeId;

              const midY = (src.y + dst.y) / 2;
              const pathD = `M ${src.x} ${src.y} C ${src.x} ${midY}, ${dst.x} ${midY}, ${dst.x} ${dst.y}`;

              return (
                <g key={edge.id} opacity={isDimmed ? 0.15 : 1} className="transition-opacity duration-200">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isCrossover ? '#c084fc' : '#06b6d4'}
                    strokeWidth={isHighlighted ? 2.5 : isCrossover ? 1.8 : 1.5}
                    strokeDasharray={isCrossover ? '4 3' : undefined}
                    markerEnd={isCrossover ? 'url(#arrow-crossover)' : 'url(#arrow-mutation)'}
                    opacity={isHighlighted ? 1 : 0.65}
                  />
                  {isCrossover && edge.contributionWeight !== null && (
                    <text
                      x={(src.x + dst.x) / 2 + 8}
                      y={midY - 4}
                      fill="#d8b4fe"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {Math.round(edge.contributionWeight * 100)}%
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {visibleNodes.map((node) => {
              const pos = layout.positions.get(node.skillId);
              if (!pos) return null;

              const radius = 9 + Math.min(5, node.descendantCount);
              const isHovered = hoveredNodeId === node.skillId;
              const isConnected =
                hoveredNodeId === null || (connectedMap.get(hoveredNodeId)?.has(node.skillId) ?? false);
              const isDimmed = !isConnected;

              const isChampion = node.stage === 'champion';
              const isTesting = node.stage === 'testing';
              const isTraining = node.stage === 'training';

              const fill = node.retired
                ? '#1c1917'
                : isChampion
                ? '#10b981'
                : isTesting
                ? '#06b6d4'
                : isTraining
                ? '#6366f1'
                : '#a855f7';

              const stroke = node.retired
                ? '#78716c'
                : isChampion
                ? '#34d399'
                : isTesting
                ? '#22d3ee'
                : isTraining
                ? '#818cf8'
                : '#c084fc';

              return (
                <g
                  key={node.skillId}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  opacity={isDimmed ? 0.2 : 1}
                  className="cursor-pointer transition-opacity duration-200"
                  onMouseEnter={() => setHoveredNodeId(node.skillId)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => {
                    const sk = skills.find((s) => s.id === node.skillId);
                    if (sk && onInspectSkill) onInspectSkill(sk);
                  }}
                >
                  <circle
                    r={radius}
                    fill={fill}
                    fillOpacity={node.retired ? 0.3 : 0.85}
                    stroke={stroke}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray={node.retired ? '3 3' : undefined}
                  />
                  <text
                    x={radius + 6}
                    y={-2}
                    fill={node.retired ? '#78716c' : '#f5f5f4'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.code}
                  </text>
                  <text
                    x={radius + 6}
                    y={10}
                    fill={node.retired ? '#57534e' : '#a8a29e'}
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    G{node.generation} · {node.benchmarkScore.toFixed(1)}% {node.retired ? '(retired)' : ''}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Legend footer */}
      <div className="flex items-center gap-6 text-[10px] text-stone-400 font-mono px-2 py-1 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Champion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          <span>Testing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Training</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-dashed border-stone-500 bg-stone-900" />
          <span>Retired Ancestor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-cyan-400" />
          <span>Mutation Edge</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 bg-purple-400 border-b border-dashed border-purple-400" />
          <span>Crossover Edge (with weight)</span>
        </div>
      </div>
    </div>
  );

  if (isOpenAsOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-xs">
        <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-stone-900 border border-stone-700 shadow-2xl p-6 relative">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
