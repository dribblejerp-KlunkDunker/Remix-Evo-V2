import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { AgentSkill } from '../../types/skills';
import {
  SynapseLink,
  NeuralSkillNode,
  ComplexFinancialQuery,
  SynapseNetworkMetrics
} from '../../types/neuralSynapse';
import {
  INITIAL_COMPLEX_QUERIES,
  INITIAL_SYNAPSE_LINKS,
  calculateSynapseMetrics
} from '../../data/neuralSynapseData';
import {
  Network,
  Zap,
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Cpu,
  Brain,
  Filter,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Download,
  Info,
  Maximize2,
  X,
  Sliders,
  Flame,
  Layers,
  Send
} from 'lucide-react';
import { LineageGraphView } from './LineageGraphView';
import type { LineageGraph } from '../../../server/evolution/lineageGraph';

export interface NeuralSynapseViewProps {
  skills: AgentSkill[];
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  onInspectSkill?: (skill: AgentSkill) => void;
  className?: string;
  lineageGraph?: LineageGraph | null;
}

export const NeuralSynapseView: React.FC<NeuralSynapseViewProps> = (props) => {
  if (props.lineageGraph) {
    return (
      <LineageGraphView
        lineageGraph={props.lineageGraph}
        skills={props.skills}
        isOpenAsOverlay={props.isOpenAsOverlay}
        onCloseOverlay={props.onCloseOverlay}
        onInspectSkill={props.onInspectSkill}
        className={props.className}
      />
    );
  }
  return <SimulatedNeuralSynapseView {...props} />;
};

const SimulatedNeuralSynapseView: React.FC<NeuralSynapseViewProps> = ({
  skills,
  isOpenAsOverlay = false,
  onCloseOverlay,
  onInspectSkill,
  className = ''
}) => {
  // State
  const [synapseLinks, setSynapseLinks] = useState<SynapseLink[]>(INITIAL_SYNAPSE_LINKS);
  const [queries, setQueries] = useState<ComplexFinancialQuery[]>(INITIAL_COMPLEX_QUERIES);
  const [selectedQueryId, setSelectedQueryId] = useState<string>(INITIAL_COMPLEX_QUERIES[0].id);
  const [customQueryText, setCustomQueryText] = useState<string>('');
  const [isFiringSimulation, setIsFiringSimulation] = useState<boolean>(false);
  const [firingStep, setFiringStep] = useState<number>(0);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'network' | 'matrix' | 'plasticity'>('network');
  const [lastVerdict, setLastVerdict] = useState<string | null>(INITIAL_COMPLEX_QUERIES[0].coActivationVerdict);

  // SVG ref for D3
  const svgRef = useRef<SVGSVGElement | null>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);

  // Currently active query
  const activeQuery = useMemo(
    () => queries.find((q) => q.id === selectedQueryId) || queries[0],
    [queries, selectedQueryId]
  );

  // Network metrics
  const metrics: SynapseNetworkMetrics = useMemo(
    () => calculateSynapseMetrics(synapseLinks),
    [synapseLinks]
  );

  // Derive neural nodes from skills
  const nodes: NeuralSkillNode[] = useMemo(() => {
    return skills.map((skill) => {
      // Check if node is part of the currently firing query
      const isFiring = activeQuery.primaryFiringSkillIds.includes(skill.id);
      const connectedLinks = synapseLinks.filter(
        (l) => l.sourceSkillId === skill.id || l.targetSkillId === skill.id
      );

      // Strongest partner code
      let strongestPartner = 'None';
      let maxWeight = 0;
      connectedLinks.forEach((l) => {
        if (l.weight > maxWeight) {
          maxWeight = l.weight;
          strongestPartner = l.sourceSkillId === skill.id ? l.targetCode : l.sourceCode;
        }
      });

      return {
        skillId: skill.id,
        skillCode: skill.code,
        skillName: skill.name,
        stage: skill.stage,
        generation: skill.generation,
        vector: skill.vectors[0] || 'General Intelligence',
        membranePotentialMv: isFiring ? 28 : -70,
        isFiring,
        firingRateHz: isFiring ? Math.round(140 + Math.random() * 60) : 0,
        totalSynapses: connectedLinks.length,
        strongestPartnerCode: strongestPartner
      };
    });
  }, [skills, activeQuery, synapseLinks]);

  // Execute query co-activation firing simulation
  const handleFireQuery = async (queryToFire: ComplexFinancialQuery) => {
    setIsFiringSimulation(true);
    setFiringStep(1);

    // Step 1: Depolarize participating nodes & activate synapses
    setSynapseLinks((prev) =>
      prev.map((link) => {
        const isPath =
          queryToFire.primaryFiringSkillIds.includes(link.sourceSkillId) &&
          queryToFire.primaryFiringSkillIds.includes(link.targetSkillId);

        return {
          ...link,
          status: isPath ? 'ACTIVE_FIRING' : 'IDLE',
          lastFiredTimestamp: isPath ? Date.now() : link.lastFiredTimestamp,
          firingFrequencyHz: isPath ? Math.round(160 + Math.random() * 50) : 0
        };
      })
    );

    await new Promise((r) => setTimeout(r, 650));
    setFiringStep(2);

    await new Promise((r) => setTimeout(r, 650));
    setFiringStep(3);

    // Step 2: Apply Hebbian Plasticity (reinforce connection weight)
    setSynapseLinks((prev) =>
      prev.map((link) => {
        const isPath =
          queryToFire.primaryFiringSkillIds.includes(link.sourceSkillId) &&
          queryToFire.primaryFiringSkillIds.includes(link.targetSkillId);

        if (isPath) {
          const newWeight = Math.min(0.99, Number((link.weight + queryToFire.plasticityGain).toFixed(3)));
          return {
            ...link,
            weight: newWeight,
            coActivationCount: link.coActivationCount + 1,
            plasticityHistory: [...link.plasticityHistory, newWeight]
          };
        }
        return link;
      })
    );

    setLastVerdict(queryToFire.coActivationVerdict);
    await new Promise((r) => setTimeout(r, 500));
    setIsFiringSimulation(false);
    setFiringStep(0);
  };

  // Submit custom financial query
  const handleCustomQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQueryText.trim()) return;

    // Detect keywords to pick skills
    const promptLower = customQueryText.toLowerCase();
    const primaryIds: string[] = [];

    if (promptLower.includes('cash') || promptLower.includes('debt') || promptLower.includes('footnote')) {
      primaryIds.push('skill-champ-01');
    }
    if (promptLower.includes('ceo') || promptLower.includes('hedg') || promptLower.includes('transcript')) {
      primaryIds.push('skill-champ-02');
    }
    if (promptLower.includes('liquidity') || promptLower.includes('repo') || promptLower.includes('margin')) {
      primaryIds.push('skill-champ-03');
    }
    if (promptLower.includes('supplier') || promptLower.includes('taiwan') || promptLower.includes('chain')) {
      primaryIds.push('skill-champ-04');
    }
    if (primaryIds.length < 2) {
      primaryIds.push('skill-champ-01', 'skill-champ-03', 'skill-train-01');
    }

    const newQuery: ComplexFinancialQuery = {
      id: `custom-query-${Date.now()}`,
      title: customQueryText.slice(0, 48) + (customQueryText.length > 48 ? '...' : ''),
      queryPrompt: customQueryText,
      financialDomain: 'Dynamic User-Prompted Multi-Agent Inquiry',
      difficulty: 'COMPLEX',
      primaryFiringSkillIds: Array.from(new Set(primaryIds)),
      expectedSynapsePath: ['Custom Inferred Neural Pathway'],
      coActivationVerdict: `COGNITIVE CONSENSUS: Co-activated ${primaryIds.length} specialist mutation nodes. Synthesized cross-vector audit verification with 0% invariant drift.`,
      synthesisLatencyMs: 154,
      plasticityGain: 0.03
    };

    setQueries((prev) => [newQuery, ...prev]);
    setSelectedQueryId(newQuery.id);
    handleFireQuery(newQuery);
    setCustomQueryText('');
  };

  // ==========================================
  // D3 NEURAL SYNAPSE NETWORK RENDERER
  // ==========================================
  useEffect(() => {
    if (activeTab !== 'network' || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 850;
    const height = 480;

    // Defs for filters and gradients
    const defs = svg.append('defs');

    // Glow filter for active firing synapses
    const filter = defs.append('filter').attr('id', 'synapse-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const container = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Prepare links referencing nodes
    const graphLinks = synapseLinks.map((link) => ({
      ...link,
      source: link.sourceSkillId,
      target: link.targetSkillId
    }));

    // Clone nodes for D3 simulation
    const graphNodes = nodes.map((node) => ({ ...node }));

    // Force Simulation
    const simulation = d3
      .forceSimulation(graphNodes)
      .force(
        'link',
        d3
          .forceLink(graphLinks)
          .id((d: any) => d.skillId)
          .distance((d: any) => 130 - d.weight * 50)
      )
      .force('charge', d3.forceManyBody().strength(-380))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(36));

    simulationRef.current = simulation;

    // Draw Synaptic Links
    const linkGroup = container.append('g').attr('class', 'synapse-links');

    const linksSelection = linkGroup
      .selectAll('line')
      .data(graphLinks)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => {
        if (d.status === 'ACTIVE_FIRING') return '#38bdf8'; // Electric Cyan
        return '#44403c'; // Dim slate
      })
      .attr('stroke-width', (d: any) => Math.max(1.8, d.weight * 6))
      .attr('stroke-opacity', (d: any) => (d.status === 'ACTIVE_FIRING' ? 0.95 : 0.45))
      .attr('stroke-dasharray', (d: any) => (d.status === 'ACTIVE_FIRING' ? 'none' : '4,3'))
      .attr('filter', (d: any) => (d.status === 'ACTIVE_FIRING' ? 'url(#synapse-glow)' : 'none'));

    // Animated Electrical Signal Particles along active links
    const particleGroup = container.append('g').attr('class', 'synaptic-particles');

    const activeFiringLinks = graphLinks.filter((l) => l.status === 'ACTIVE_FIRING');
    const particles = particleGroup
      .selectAll('circle')
      .data(activeFiringLinks)
      .enter()
      .append('circle')
      .attr('r', 4)
      .attr('fill', '#38bdf8')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#synapse-glow)');

    // Draw Nodes
    const nodeGroup = container.append('g').attr('class', 'neural-nodes');

    const nodesSelection = nodeGroup
      .selectAll('g')
      .data(graphNodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (_, d) => {
        setSelectedNodeId(d.skillId === selectedNodeId ? null : d.skillId);
      });

    // Depolarization Halo (when node is firing)
    nodesSelection
      .filter((d) => d.isFiring)
      .append('circle')
      .attr('r', 28)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', '3,3');

    // Soma Circle
    nodesSelection
      .append('circle')
      .attr('r', (d) => (d.stage === 'champion' ? 22 : 18))
      .attr('fill', (d) => {
        if (d.stage === 'champion') return '#065f46'; // Emerald
        if (d.stage === 'training') return '#b45309'; // Amber
        return '#4c1d95'; // Purple
      })
      .attr('stroke', (d) => {
        if (d.isFiring) return '#38bdf8';
        if (d.stage === 'champion') return '#10b981';
        return '#f59e0b';
      })
      .attr('stroke-width', (d) => (d.isFiring ? 3 : 1.5))
      .attr('filter', (d) => (d.isFiring ? 'url(#synapse-glow)' : 'none'));

    // Inner nucleus
    nodesSelection
      .append('circle')
      .attr('r', (d) => (d.stage === 'champion' ? 7 : 5))
      .attr('fill', (d) => (d.isFiring ? '#ffffff' : '#e7e5e4'));

    // Label: Skill Code
    nodesSelection
      .append('text')
      .attr('y', 33)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f5f5f4')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d) => d.skillCode);

    // Label: Membrane Potential / Firing Tag
    nodesSelection
      .append('text')
      .attr('y', 44)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.isFiring ? '#38bdf8' : '#78716c'))
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .text((d) => (d.isFiring ? `+${d.membranePotentialMv}mV · ${d.firingRateHz}Hz` : `${d.membranePotentialMv}mV`));

    // Simulation Tick Loop
    let particleT = 0;
    simulation.on('tick', () => {
      linksSelection
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodesSelection.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      // Animate electrical particles along active links
      particleT = (particleT + 0.02) % 1;
      particles
        .attr('cx', (d: any) => d.source.x + (d.target.x - d.source.x) * particleT)
        .attr('cy', (d: any) => d.source.y + (d.target.y - d.source.y) * particleT);
    });

    return () => {
      simulation.stop();
    };
  }, [activeTab, synapseLinks, nodes, selectedNodeId]);

  const content = (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Banner & Synaptic Telemetry Scorecard */}
      <div className="bg-stone-900/70 border border-stone-800 p-5 relative overflow-hidden backdrop-blur-xs">
        <div className="absolute top-0 right-0 w-96 h-36 bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-28 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="p-1.5 bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <Network className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                Neural Synapse & Co-Firing View
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                Hebbian Synaptic Plasticity
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold">
                {metrics.activeFiringSynapses} Synapses Firing
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans max-w-3xl">
              Visualizes the synaptic connection strength (weight W_ij from 0.1 to 1.0) between specialized agent skill nodes. Demonstrates which skill mutations fire synchronously to deconstruct complex, multi-vector financial queries and how connection weights strengthen through Hebbian reinforcement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFireQuery(activeQuery)}
              disabled={isFiringSimulation}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold text-xs font-mono transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isFiringSimulation ? 'animate-bounce' : 'fill-current'}`} />
              <span>{isFiringSimulation ? `Co-Firing Step ${firingStep}/3...` : 'Fire Active Synapses'}</span>
            </button>

            {isOpenAsOverlay && onCloseOverlay && (
              <button
                onClick={onCloseOverlay}
                className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
                title="Close Synapse View"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Synaptic Metrics Scorecard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-stone-500 text-[10px] uppercase">Mean Synaptic Weight</div>
            <div className="text-2xl font-bold text-cyan-400">
              {metrics.averageSynapticWeight.toFixed(2)}
            </div>
            <div className="text-[10px] text-stone-400">Connection Strength (W_ij)</div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-stone-500 text-[10px] uppercase">Active Co-Firing</div>
            <div className="text-2xl font-bold text-emerald-400">
              {metrics.activeFiringSynapses} / {metrics.totalSynapses}
            </div>
            <div className="text-[10px] text-stone-400">Pathways Firing Synchronously</div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-stone-500 text-[10px] uppercase">Plasticity Delta (Today)</div>
            <div className="text-2xl font-bold text-purple-400">
              +{metrics.hebbianPlasticityGainToday}
            </div>
            <div className="text-[10px] text-stone-400">Hebbian Weight Gain</div>
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1">
            <div className="text-stone-500 text-[10px] uppercase">Signal Transmission</div>
            <div className="text-2xl font-bold text-white">
              {metrics.corticalTransmissionVelocity}
            </div>
            <div className="text-[10px] text-stone-400">Signals / sec Transmission</div>
          </div>
        </div>
      </div>

      {/* 2. Complex Financial Query Triggers & Firing Arena */}
      <div className="bg-stone-950 border border-stone-800 p-4 space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <div className="text-xs uppercase font-bold text-stone-200 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Complex Financial Query Co-Activation Triggers
            </div>
            <p className="text-[11px] text-stone-400 font-sans mt-0.5">
              Select a multi-vector query to observe which skill nodes depolarize and fire together along axonal pathways.
            </p>
          </div>

          {/* Visualization Tab Switcher */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('network')}
              className={`px-3 py-1.5 transition-all border cursor-pointer ${
                activeTab === 'network'
                  ? 'bg-stone-800 text-white border-stone-600 font-bold'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              Synaptic Network
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 transition-all border cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-stone-800 text-white border-stone-600 font-bold'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              Synapse Weight Matrix
            </button>
          </div>
        </div>

        {/* Query Selector Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {queries.map((q) => {
            const isSelected = q.id === activeQuery.id;
            return (
              <div
                key={q.id}
                onClick={() => {
                  setSelectedQueryId(q.id);
                  handleFireQuery(q);
                }}
                className={`p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 uppercase font-bold border ${
                      q.difficulty === 'SYSTEMIC_CASCADE'
                        ? 'bg-purple-950 border-purple-600 text-purple-300'
                        : q.difficulty === 'EXTREME'
                        ? 'bg-amber-950 border-amber-600 text-amber-300'
                        : 'bg-blue-950 border-blue-600 text-blue-300'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  <span className="text-[10px] text-stone-500">{q.synthesisLatencyMs}ms</span>
                </div>
                <div className="text-xs font-bold text-white line-clamp-1 mb-1">{q.title}</div>
                <div className="text-[10px] text-stone-400 font-sans line-clamp-2">{q.queryPrompt}</div>
                <div className="mt-2 text-[10px] text-cyan-400 font-mono flex items-center justify-between pt-1 border-t border-stone-800/80">
                  <span>{q.primaryFiringSkillIds.length} Nodes Firing</span>
                  <span className="font-bold underline">Trigger →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Query Input */}
        <form onSubmit={handleCustomQuerySubmit} className="flex gap-2 pt-2">
          <input
            type="text"
            value={customQueryText}
            onChange={(e) => setCustomQueryText(e.target.value)}
            placeholder="Type custom financial query to trigger custom synapse firing (e.g., 'Audit Dell supplier finance vs margin guidance')..."
            className="flex-1 bg-stone-900 border border-stone-700 text-stone-100 px-3 py-2 text-xs font-mono focus:border-cyan-400 focus:outline-hidden"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Query</span>
          </button>
        </form>

        {/* Active Query Verdict Readout */}
        {lastVerdict && (
          <div className="p-3.5 bg-stone-900 border border-cyan-900/60 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="text-cyan-400 font-bold uppercase block text-[10px]">
                Active Neural Co-Activation Consensus Output:
              </span>
              <span className="text-stone-200 font-sans leading-relaxed">{lastVerdict}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. D3 SVG Network or Weight Matrix */}
      {activeTab === 'network' ? (
        <div className="bg-stone-950 border border-stone-800 p-4 space-y-2 font-mono">
          <div className="flex items-center justify-between text-xs text-stone-400 pb-2 border-b border-stone-800">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Interactive Synaptic Arborization Network (Drag to reposition · Scroll to zoom)</span>
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-400">● Champion Nodes</span>
              <span className="text-amber-400">● In-Training Nodes</span>
              <span className="text-cyan-400">― Firing Synapse (Electrical Signal Flow)</span>
            </div>
          </div>

          <div className="w-full bg-stone-950 border border-stone-800/90 overflow-hidden shadow-inner relative">
            <svg ref={svgRef} className="w-full h-auto min-h-[460px]" />
          </div>
        </div>
      ) : (
        /* Synapse Weight Matrix */
        <div className="bg-stone-950 border border-stone-800 p-5 space-y-4 font-mono text-xs">
          <div className="text-xs font-bold text-white border-b border-stone-800 pb-2">
            Pairwise Synaptic Connection Weight Matrix (W_ij)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-stone-800 text-[10px] text-stone-500">
                  <th className="p-2 text-left">SKILL / CORTEX</th>
                  {nodes.slice(0, 8).map((n) => (
                    <th key={n.skillId} className="p-2">
                      {n.skillCode}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodes.slice(0, 8).map((rowNode) => (
                  <tr key={rowNode.skillId} className="border-b border-stone-900 hover:bg-stone-900/50">
                    <td className="p-2 text-left font-bold text-stone-300">
                      {rowNode.skillCode}
                    </td>
                    {nodes.slice(0, 8).map((colNode) => {
                      if (rowNode.skillId === colNode.skillId) {
                        return (
                          <td key={colNode.skillId} className="p-2 text-stone-700 bg-stone-900/40">
                            1.00
                          </td>
                        );
                      }

                      const link = synapseLinks.find(
                        (l) =>
                          (l.sourceSkillId === rowNode.skillId && l.targetSkillId === colNode.skillId) ||
                          (l.sourceSkillId === colNode.skillId && l.targetSkillId === rowNode.skillId)
                      );

                      if (!link) {
                        return <td key={colNode.skillId} className="p-2 text-stone-700">0.00</td>;
                      }

                      const isFiring = link.status === 'ACTIVE_FIRING';
                      return (
                        <td
                          key={colNode.skillId}
                          className={`p-2 font-bold ${
                            isFiring
                              ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-800/40'
                              : link.weight >= 0.85
                              ? 'text-emerald-400'
                              : 'text-stone-400'
                          }`}
                        >
                          {link.weight.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Active Synaptic Links Breakdown Table */}
      <div className="bg-stone-950 border border-stone-800 p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <span className="font-bold text-white uppercase text-xs">
            Axonal Pathway Telemetry & Synergy Breakdown ({synapseLinks.length} Connections)
          </span>
          <span className="text-[11px] text-stone-500">Sorted by synaptic weight</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {synapseLinks
            .sort((a, b) => b.weight - a.weight)
            .map((link) => {
              const isFiring = link.status === 'ACTIVE_FIRING';
              return (
                <div
                  key={link.id}
                  className={`p-3 border flex flex-col justify-between ${
                    isFiring
                      ? 'bg-cyan-950/30 border-cyan-500/70 text-cyan-200'
                      : 'bg-stone-900/40 border-stone-800 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-white">{link.sourceCode}</span>
                      <span className={isFiring ? 'text-cyan-400' : 'text-stone-500'}>⟷</span>
                      <span className="text-white">{link.targetCode}</span>
                    </div>

                    <span
                      className={`text-[9px] px-1.5 py-0.2 uppercase font-bold border ${
                        isFiring
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300 animate-pulse'
                          : 'bg-stone-900 border-stone-700 text-stone-400'
                      }`}
                    >
                      {isFiring ? `${link.firingFrequencyHz} Hz FIRING` : 'Dormant'}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-400 font-sans mb-2">
                    {link.synergyDomain}
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-stone-800/80">
                    <span className="text-stone-500">Co-Activations: {link.coActivationCount}</span>
                    <span className="font-bold text-cyan-300">
                      Weight: {link.weight.toFixed(3)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );

  if (isOpenAsOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="bg-stone-950 border border-stone-700 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-stone-200 font-sans relative">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};
