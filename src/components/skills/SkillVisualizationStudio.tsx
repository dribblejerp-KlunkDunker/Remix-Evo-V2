import React, { useState, useMemo } from 'react';
import type { AgentSkill, VectorCategory } from '../../types/skills';
import type { LineageGraph } from '../../../server/evolution/lineageGraph';
import { AgentSkillForceGraph } from './AgentSkillForceGraph';
import { LineageGraphView } from './LineageGraphView';
import { NeuralSynapseView } from './NeuralSynapseView';
import {
  Network,
  GitFork,
  Dna,
  Layers,
  Sparkles,
  Search,
  Filter,
  Eye,
  Trophy,
  Brain,
  Compass,
  Zap,
  ArrowRight,
  Maximize2
} from 'lucide-react';

interface SkillVisualizationStudioProps {
  skills: AgentSkill[];
  onInspectSkill: (skill: AgentSkill) => void;
  onSwitchToBreeding?: () => void;
  lineageGraph?: LineageGraph | null;
  onRemixSkill?: (skill: AgentSkill) => void;
}

export type VisualizationViewMode =
  | 'force-graph'
  | 'lineage-tree'
  | 'synapse-network'
  | 'vector-radar';

const ALL_VECTORS: VectorCategory[] = [
  'Statistics & Stochastic',
  'Behavioral Psychology',
  'Manipulation & Deception',
  'Forensic Accounting',
  'Advanced Math',
  'Game Design & Incentives',
  'Empirical Science',
  'Systems Engineering'
];

export const SkillVisualizationStudio: React.FC<SkillVisualizationStudioProps> = ({
  skills,
  onInspectSkill,
  onSwitchToBreeding,
  lineageGraph,
  onRemixSkill
}) => {
  const [viewMode, setViewMode] = useState<VisualizationViewMode>('force-graph');
  const [selectedRadarSkillId, setSelectedRadarSkillId] = useState<string>(skills[0]?.id || '');
  const [radarSearch, setRadarSearch] = useState('');

  // Selected skill for radar
  const selectedRadarSkill = useMemo(
    () => skills.find((s) => s.id === selectedRadarSkillId) || skills[0] || null,
    [skills, selectedRadarSkillId]
  );

  // Compute vector coverage distribution across population
  const vectorDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_VECTORS.forEach((v) => (counts[v] = 0));
    skills.forEach((s) => {
      s.vectors.forEach((v) => {
        if (counts[v] !== undefined) counts[v]++;
      });
    });
    return counts;
  }, [skills]);

  // Champions count and average fitness
  const stats = useMemo(() => {
    const champs = skills.filter((s) => s.stage === 'champion').length;
    const avgScore = skills.length ? skills.reduce((acc, s) => acc + s.benchmarkScore, 0) / skills.length : 0;
    return {
      total: skills.length,
      champions: champs,
      avgScore: avgScore.toFixed(1)
    };
  }, [skills]);

  // Synthetic lineage graph fallback if not provided by server
  const fallbackLineageGraph: LineageGraph = useMemo(() => {
    if (lineageGraph && lineageGraph.nodes.length > 0) return lineageGraph;

    const nodes = skills.map((s) => ({
      skillId: s.id,
      code: s.code,
      name: s.name,
      stage: s.stage,
      benchmarkScore: s.benchmarkScore,
      vector: s.vectors[0] || 'Empirical Science',
      vectors: s.vectors,
      retired: false,
      generation: s.generation,
      depth: Math.min(4, s.generation - 1),
      descendantCount: 0
    }));

    const edges: LineageGraph['edges'] = [];

    // Link higher generations to earlier generations
    skills.forEach((s) => {
      if (s.generation > 1) {
        const potentialParents = skills.filter((p) => p.generation < s.generation);
        if (potentialParents.length >= 2) {
          edges.push({
            id: `edge-${potentialParents[0].id}-${s.id}`,
            sourceSkillId: potentialParents[0].id,
            sourceCode: potentialParents[0].code,
            targetSkillId: s.id,
            targetCode: s.code,
            kind: 'crossover',
            contributionWeight: 0.6,
            mutationPercentage: 12,
            performanceDelta: Number((s.benchmarkScore - potentialParents[0].benchmarkScore).toFixed(1)),
            mutationType: 'Genetic Crossover'
          });
          edges.push({
            id: `edge-${potentialParents[1].id}-${s.id}`,
            sourceSkillId: potentialParents[1].id,
            sourceCode: potentialParents[1].code,
            targetSkillId: s.id,
            targetCode: s.code,
            kind: 'crossover',
            contributionWeight: 0.4,
            mutationPercentage: 12,
            performanceDelta: Number((s.benchmarkScore - potentialParents[1].benchmarkScore).toFixed(1)),
            mutationType: 'Genetic Crossover'
          });
        } else if (potentialParents.length === 1) {
          edges.push({
            id: `edge-${potentialParents[0].id}-${s.id}`,
            sourceSkillId: potentialParents[0].id,
            sourceCode: potentialParents[0].code,
            targetSkillId: s.id,
            targetCode: s.code,
            kind: 'mutation',
            contributionWeight: null,
            mutationPercentage: 8,
            performanceDelta: Number((s.benchmarkScore - potentialParents[0].benchmarkScore).toFixed(1)),
            mutationType: 'Stochastic Mutation'
          });
        }
      }
    });

    const generations = Array.from(new Set(skills.map((s) => s.generation))).sort((a, b) => a - b);
    const maxDepth = Math.max(1, ...nodes.map((n) => n.depth));
    const rootCount = nodes.filter((n) => n.generation === 1).length;
    const connectedIds = new Set([...edges.map((e) => e.sourceSkillId), ...edges.map((e) => e.targetSkillId)]);
    const orphanCount = nodes.filter((n) => !connectedIds.has(n.skillId)).length;

    return {
      nodes,
      edges,
      generations,
      maxDepth,
      rootCount,
      orphanCount
    };
  }, [skills, lineageGraph]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Visualizer Header Cockpit */}
      <div className="bg-stone-950/80 border border-stone-800 p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Network className="w-4 h-4 animate-pulse" />
              <span className="font-bold uppercase tracking-wider">Multi-Dimensional Skill Visualization Studio</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-400">Force Physics & Lineage DAG</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
              Interactive Agent Skill Visualizer
            </h2>
            <p className="text-xs text-stone-400 font-sans mt-0.5 max-w-2xl">
              Inspect how skills cluster by domain vectors, trace evolutionary cross-breeding genealogies,
              and monitor real-time synaptic signal transmission between specialist models.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSwitchToBreeding && (
              <button
                onClick={onSwitchToBreeding}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Dna className="w-4 h-4" />
                <span>Open Skill Breeding Lab</span>
              </button>
            )}
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-4 border-t border-stone-800/80">
          <div className="flex items-center p-1 bg-stone-900 border border-stone-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('force-graph')}
              className={`flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer ${
                viewMode === 'force-graph'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 border border-transparent'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span>Force-Directed Graph (D3)</span>
            </button>

            <button
              onClick={() => setViewMode('lineage-tree')}
              className={`flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer ${
                viewMode === 'lineage-tree'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/50 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 border border-transparent'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 text-purple-400" />
              <span>Genetic Lineage Tree (DAG)</span>
            </button>

            <button
              onClick={() => setViewMode('synapse-network')}
              className={`flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer ${
                viewMode === 'synapse-network'
                  ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/50 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 border border-transparent'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-blue-400" />
              <span>Neural Synapse Topology</span>
            </button>

            <button
              onClick={() => setViewMode('vector-radar')}
              className={`flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer ${
                viewMode === 'vector-radar'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 border border-transparent'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Vector Radar Space</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-stone-400">
            <span>Total: <strong className="text-white">{stats.total}</strong></span>
            <span>·</span>
            <span>Champions: <strong className="text-emerald-400">{stats.champions}</strong></span>
            <span>·</span>
            <span>Mean Fitness: <strong className="text-cyan-300">{stats.avgScore}%</strong></span>
          </div>
        </div>
      </div>

      {/* Main Visualization Render Body */}
      <div className="bg-stone-950 border border-stone-800 relative min-h-[620px] overflow-hidden shadow-2xl">
        {viewMode === 'force-graph' && (
          <div className="w-full h-full min-h-[620px]">
            <AgentSkillForceGraph
              skills={skills}
              onInspectSkill={onInspectSkill}
              onRemixSkill={onRemixSkill}
            />
          </div>
        )}

        {viewMode === 'lineage-tree' && (
          <div className="p-4 overflow-auto min-h-[620px]">
            <LineageGraphView
              lineageGraph={fallbackLineageGraph}
              skills={skills}
              onInspectSkill={onInspectSkill}
            />
          </div>
        )}

        {viewMode === 'synapse-network' && (
          <div className="p-4 overflow-auto min-h-[620px]">
            <NeuralSynapseView
              skills={skills}
              onInspectSkill={onInspectSkill}
              lineageGraph={fallbackLineageGraph}
            />
          </div>
        )}

        {viewMode === 'vector-radar' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-h-[620px]">
            {/* Left: Interactive Vector Radar Chart */}
            <div className="lg:col-span-7 bg-stone-900/60 border border-stone-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">
                    8-Axis Reasoning Vector Space
                  </span>
                </div>
                {selectedRadarSkill && (
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    Target: {selectedRadarSkill.code}
                  </span>
                )}
              </div>

              {/* Custom SVG Radar Chart */}
              <div className="w-full flex items-center justify-center p-4">
                <svg viewBox="0 0 400 400" className="w-full max-w-[380px] h-auto overflow-visible">
                  {/* Concentric Polygons */}
                  {[0.25, 0.5, 0.75, 1.0].map((level, lvlIdx) => {
                    const r = 150 * level;
                    const points = ALL_VECTORS.map((_, i) => {
                      const angle = (i * 2 * Math.PI) / ALL_VECTORS.length - Math.PI / 2;
                      return `${200 + r * Math.cos(angle)},${200 + r * Math.sin(angle)}`;
                    }).join(' ');

                    return (
                      <polygon
                        key={lvlIdx}
                        points={points}
                        fill="none"
                        stroke="#292524"
                        strokeWidth="1"
                        strokeDasharray={level < 1 ? '3 3' : 'none'}
                      />
                    );
                  })}

                  {/* Axes */}
                  {ALL_VECTORS.map((v, i) => {
                    const angle = (i * 2 * Math.PI) / ALL_VECTORS.length - Math.PI / 2;
                    const x = 200 + 150 * Math.cos(angle);
                    const y = 200 + 150 * Math.sin(angle);
                    const labelX = 200 + 175 * Math.cos(angle);
                    const labelY = 200 + 175 * Math.sin(angle);

                    return (
                      <g key={i}>
                        <line x1="200" y1="200" x2={x} y2={y} stroke="#3f3f46" strokeWidth="1" />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#a1a1aa"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {v.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}

                  {/* Selected Skill Vector Polygon */}
                  {selectedRadarSkill && (() => {
                    const points = ALL_VECTORS.map((v, i) => {
                      const hasVector = selectedRadarSkill.vectors.includes(v);
                      const magnitude = hasVector ? 0.95 : 0.25;
                      const r = 150 * magnitude;
                      const angle = (i * 2 * Math.PI) / ALL_VECTORS.length - Math.PI / 2;
                      return `${200 + r * Math.cos(angle)},${200 + r * Math.sin(angle)}`;
                    }).join(' ');

                    return (
                      <polygon
                        points={points}
                        fill="rgba(245, 158, 11, 0.25)"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                      />
                    );
                  })()}
                </svg>
              </div>

              {/* Vector Coverage Distribution Bars */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <div className="text-[11px] font-mono text-stone-400 font-bold uppercase">
                  Global Population Density per Vector:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  {ALL_VECTORS.map((v) => {
                    const count = vectorDistribution[v] || 0;
                    const pct = Math.round((count / (skills.length || 1)) * 100);
                    const isSelectedHas = selectedRadarSkill?.vectors.includes(v);

                    return (
                      <div
                        key={v}
                        className={`p-2 border transition-colors ${
                          isSelectedHas
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                            : 'bg-stone-950 border-stone-800 text-stone-400'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="truncate">{v}</span>
                          <span className="font-bold text-white">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1 bg-stone-800">
                          <div
                            className={`h-full ${isSelectedHas ? 'bg-amber-400' : 'bg-stone-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Skill Inspector for Vector Footprint */}
            <div className="lg:col-span-5 bg-stone-900/60 border border-stone-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <span className="text-xs font-mono font-bold text-stone-200 uppercase tracking-wider">
                  Select Target Skill to Plot
                </span>
                <span className="text-xs font-mono text-stone-500">{skills.length} available</span>
              </div>

              {/* Search skills */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                <input
                  type="text"
                  placeholder="Filter skills..."
                  value={radarSearch}
                  onChange={(e) => setRadarSearch(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Skills list selector */}
              <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                {skills
                  .filter((s) => s.name.toLowerCase().includes(radarSearch.toLowerCase()) || s.code.toLowerCase().includes(radarSearch.toLowerCase()))
                  .map((s) => {
                    const isSelected = s.id === selectedRadarSkillId;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedRadarSkillId(s.id)}
                        className={`p-2.5 border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-950/70 border-amber-500 text-white shadow-xs'
                            : 'bg-stone-950/80 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <span className={isSelected ? 'text-amber-400 font-bold' : 'text-stone-300 font-bold'}>
                              {s.code}
                            </span>
                            <span className="text-[10px] text-stone-500 uppercase">({s.stage})</span>
                          </div>
                          <div className="text-[11px] truncate max-w-[200px] text-stone-300 font-sans mt-0.5">
                            {s.name}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            {s.benchmarkScore.toFixed(1)}%
                          </div>
                          <div className="text-[9px] font-mono text-stone-500">
                            {s.vectors.length} vectors
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Selected Skill Details */}
              {selectedRadarSkill && (
                <div className="p-3 bg-stone-950 border border-stone-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold">{selectedRadarSkill.name}</span>
                    <span className="text-stone-400">Gen {selectedRadarSkill.generation}</span>
                  </div>
                  <div className="text-stone-400 text-[11px] font-sans line-clamp-2">
                    {selectedRadarSkill.description}
                  </div>
                  <button
                    onClick={() => onInspectSkill(selectedRadarSkill)}
                    className="w-full py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-mono flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open Skill Dossier</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
