import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { AgentSkill } from '../../types/skills';
import {
  CognitiveLoadMetrics,
  CognitiveThoughtPacket,
  RealtimeCognitivePoint,
  SkillCognitiveProfile
} from '../../types/cognitiveLoad';
import {
  CHAMPION_COGNITIVE_PROFILES,
  TRAINING_COGNITIVE_PROFILES,
  generateInitialCognitiveHistory,
  generateNextCognitivePoint,
  generateRandomThoughtPacket
} from '../../data/cognitiveLoadData';
import {
  Brain,
  Cpu,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Trophy,
  FlaskConical,
  Zap,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Download,
  Filter,
  Eye,
  X,
  Gauge,
  Compass,
  Sliders,
  Maximize2
} from 'lucide-react';

export interface CognitiveLoadMonitorProps {
  skills: AgentSkill[];
  isOpenAsOverlay?: boolean;
  onCloseOverlay?: () => void;
  onInspectSkill?: (skill: AgentSkill) => void;
  className?: string;
}

export const CognitiveLoadMonitor: React.FC<CognitiveLoadMonitorProps> = ({
  skills,
  isOpenAsOverlay = false,
  onCloseOverlay,
  onInspectSkill,
  className = ''
}) => {
  // Extract champions and in-training skills
  const championSkills = useMemo(() => skills.filter((s) => s.stage === 'champion'), [skills]);
  const trainingSkills = useMemo(() => skills.filter((s) => s.stage === 'training'), [skills]);

  // Selected skill pairing for deep inspection
  const [selectedChampionId, setSelectedChampionId] = useState<string>(
    championSkills[0]?.id || 'skill-champ-01'
  );
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(
    trainingSkills[0]?.id || 'skill-train-01'
  );

  const selectedChampionSkill = useMemo(
    () => championSkills.find((s) => s.id === selectedChampionId) || championSkills[0],
    [championSkills, selectedChampionId]
  );
  const selectedTrainingSkill = useMemo(
    () => trainingSkills.find((s) => s.id === selectedTrainingId) || trainingSkills[0],
    [trainingSkills, selectedTrainingId]
  );

  // Active visualization tab
  const [activeTab, setActiveTab] = useState<'waveforms' | 'topology' | 'radar'>('waveforms');
  const [selectedMetricView, setSelectedMetricView] = useState<'memory' | 'entropy' | 'latency' | 'backtracks'>('memory');

  // Real-time streaming state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [historyData, setHistoryData] = useState<RealtimeCognitivePoint[]>(generateInitialCognitiveHistory);
  const [thoughtPackets, setThoughtPackets] = useState<CognitiveThoughtPacket[]>(() => [
    generateRandomThoughtPacket('champion', selectedChampionSkill),
    generateRandomThoughtPacket('training', selectedTrainingSkill),
    generateRandomThoughtPacket('champion', selectedChampionSkill)
  ]);

  const stepCounterRef = useRef<number>(25);

  // SVG Refs for D3
  const waveformSvgRef = useRef<SVGSVGElement | null>(null);
  const topologySvgRef = useRef<SVGSVGElement | null>(null);
  const radarSvgRef = useRef<SVGSVGElement | null>(null);

  // Live timer tick
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1100 / streamSpeed);
    const interval = setInterval(() => {
      stepCounterRef.current += 1;
      setHistoryData((prev) => {
        const last = prev[prev.length - 1];
        const next = generateNextCognitivePoint(last, stepCounterRef.current);
        const nextHistory = [...prev.slice(1), next];
        return nextHistory;
      });

      // Periodically inject thought packets
      if (Math.random() > 0.4) {
        const stage = Math.random() > 0.5 ? 'champion' : 'training';
        const targetSkill = stage === 'champion' ? selectedChampionSkill : selectedTrainingSkill;
        const newPacket = generateRandomThoughtPacket(stage, targetSkill);
        setThoughtPackets((prev) => [newPacket, ...prev.slice(0, 7)]);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, streamSpeed, selectedChampionSkill, selectedTrainingSkill]);

  // Current latest telemetry point
  const currentTelemetry = historyData[historyData.length - 1] || historyData[0];

  // ==========================================
  // D3 TAB 1: REAL-TIME NEURAL WAVEFORMS
  // ==========================================
  useEffect(() => {
    if (activeTab !== 'waveforms' || !waveformSvgRef.current) return;

    const svg = d3.select(waveformSvgRef.current);
    svg.selectAll('*').remove();

    const width = 850;
    const height = 310;
    const margin = { top: 25, right: 35, bottom: 35, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradients
    const defs = svg.append('defs');

    // Champion Gradient (Emerald)
    const champGradient = defs
      .append('linearGradient')
      .attr('id', 'champ-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    champGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.35);
    champGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // Training Gradient (Amber/Orange)
    const trainGradient = defs
      .append('linearGradient')
      .attr('id', 'train-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    trainGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.35);
    trainGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.0);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, historyData.length - 1])
      .range([0, innerWidth]);

    let yDomain: [number, number] = [0, 100];
    let yUnit = '%';

    if (selectedMetricView === 'memory') {
      yDomain = [0, 100];
      yUnit = '% Memory';
    } else if (selectedMetricView === 'entropy') {
      yDomain = [0, 6.0];
      yUnit = 'bits';
    } else if (selectedMetricView === 'latency') {
      yDomain = [0, 1000];
      yUnit = 'ms';
    } else if (selectedMetricView === 'backtracks') {
      yDomain = [0, 14];
      yUnit = 'count';
    }

    const yScale = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]).nice();

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#292524')
      .attr('stroke-dasharray', '2,2');

    // Threshold warning line
    if (selectedMetricView === 'memory') {
      const overloadY = yScale(80);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', overloadY)
        .attr('y2', overloadY)
        .attr('stroke', '#f43f5e')
        .attr('stroke-dasharray', '4,3')
        .attr('stroke-width', 1.2);

      g.append('text')
        .attr('x', innerWidth - 6)
        .attr('y', overloadY - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#f43f5e')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text('Cognitive Overload Threshold (80%)');
    }

    // Value extractors
    const getChampVal = (d: RealtimeCognitivePoint) => {
      if (selectedMetricView === 'memory') return d.championMemory;
      if (selectedMetricView === 'entropy') return d.championEntropy;
      if (selectedMetricView === 'latency') return d.championLatency;
      return d.championBacktracks;
    };

    const getTrainVal = (d: RealtimeCognitivePoint) => {
      if (selectedMetricView === 'memory') return d.trainingMemory;
      if (selectedMetricView === 'entropy') return d.trainingEntropy;
      if (selectedMetricView === 'latency') return d.trainingLatency;
      return d.trainingBacktracks;
    };

    // Area and Line Generators
    const champArea = d3
      .area<RealtimeCognitivePoint>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1((d) => yScale(getChampVal(d)))
      .curve(d3.curveMonotoneX);

    const trainArea = d3
      .area<RealtimeCognitivePoint>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1((d) => yScale(getTrainVal(d)))
      .curve(d3.curveMonotoneX);

    const champLine = d3
      .line<RealtimeCognitivePoint>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(getChampVal(d)))
      .curve(d3.curveMonotoneX);

    const trainLine = d3
      .line<RealtimeCognitivePoint>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(getTrainVal(d)))
      .curve(d3.curveMonotoneX);

    // Render Areas
    g.append('path').datum(historyData).attr('fill', 'url(#train-area-grad)').attr('d', trainArea);
    g.append('path').datum(historyData).attr('fill', 'url(#champ-area-grad)').attr('d', champArea);

    // Render Lines
    g.append('path')
      .datum(historyData)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2)
      .attr('d', trainLine);

    g.append('path')
      .datum(historyData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.2)
      .attr('d', champLine);

    // Latest Pulse Points
    const lastIdx = historyData.length - 1;
    const lastPoint = historyData[lastIdx];

    // Training point pulse
    g.append('circle')
      .attr('cx', xScale(lastIdx))
      .attr('cy', yScale(getTrainVal(lastPoint)))
      .attr('r', 4.5)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    // Champion point pulse
    g.append('circle')
      .attr('cx', xScale(lastIdx))
      .attr('cy', yScale(getChampVal(lastPoint)))
      .attr('r', 5)
      .attr('fill', '#10b981')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5);

    // X and Y Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat((i) => historyData[Number(i)]?.timestampStr || '');

    const yAxis = d3.axisLeft(yScale).ticks(5);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#57534e')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    g.append('g')
      .call(yAxis)
      .attr('color', '#57534e')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Axis label
    g.append('text')
      .attr('x', 0)
      .attr('y', -8)
      .attr('fill', '#a8a29e')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text(yUnit);
  }, [activeTab, historyData, selectedMetricView]);

  // ==========================================
  // D3 TAB 2: DYNAMIC COGNITIVE TOPOLOGY
  // ==========================================
  useEffect(() => {
    if (activeTab !== 'topology' || !topologySvgRef.current) return;

    const svg = d3.select(topologySvgRef.current);
    svg.selectAll('*').remove();

    const width = 850;
    const height = 400;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g');

    // Force Simulation Nodes
    interface TopologyNode extends d3.SimulationNodeDatum {
      id: string;
      label: string;
      type: 'CORE' | 'CHAMPION' | 'TRAINING' | 'INVARIANT' | 'EXPLORATORY';
      r: number;
      strain: number;
    }

    interface TopologyLink extends d3.SimulationLinkDatum<TopologyNode> {
      source: string | TopologyNode;
      target: string | TopologyNode;
      activity: number;
    }

    const nodes: TopologyNode[] = [
      { id: 'core', label: 'Agent Thinking Core', type: 'CORE', r: 24, strain: 45 },
      // Champion Cluster
      { id: 'champ-root', label: selectedChampionSkill.code, type: 'CHAMPION', r: 18, strain: currentTelemetry.championStrain },
      { id: 'champ-inv-1', label: 'Zero-GAAP Bypassing', type: 'INVARIANT', r: 12, strain: 15 },
      { id: 'champ-inv-2', label: 'Footnote Cross-Foot', type: 'INVARIANT', r: 12, strain: 20 },
      { id: 'champ-inv-3', label: 'Covenant Verification', type: 'INVARIANT', r: 12, strain: 18 },
      // Training Cluster
      { id: 'train-root', label: selectedTrainingSkill.code, type: 'TRAINING', r: 18, strain: currentTelemetry.trainingStrain },
      { id: 'train-exp-1', label: 'Lévy Intensity Search', type: 'EXPLORATORY', r: 13, strain: 78 },
      { id: 'train-exp-2', label: 'Backtrack Re-weighting', type: 'EXPLORATORY', r: 14, strain: 84 },
      { id: 'train-exp-3', label: 'Fat-Tail Kurtosis Fit', type: 'EXPLORATORY', r: 12, strain: 70 },
      { id: 'train-exp-4', label: 'Tax Conduit Branching', type: 'EXPLORATORY', r: 12, strain: 76 }
    ];

    const links: TopologyLink[] = [
      { source: 'core', target: 'champ-root', activity: 0.9 },
      { source: 'champ-root', target: 'champ-inv-1', activity: 0.95 },
      { source: 'champ-root', target: 'champ-inv-2', activity: 0.92 },
      { source: 'champ-root', target: 'champ-inv-3', activity: 0.88 },
      { source: 'core', target: 'train-root', activity: 0.7 },
      { source: 'train-root', target: 'train-exp-1', activity: 0.65 },
      { source: 'train-root', target: 'train-exp-2', activity: 0.5 },
      { source: 'train-root', target: 'train-exp-3', activity: 0.6 },
      { source: 'train-root', target: 'train-exp-4', activity: 0.55 },
      { source: 'train-exp-1', target: 'train-exp-2', activity: 0.4 }
    ];

    // Background quadrant dividers
    g.append('line')
      .attr('x1', width / 2)
      .attr('x2', width / 2)
      .attr('y1', 20)
      .attr('y2', height - 20)
      .attr('stroke', '#292524')
      .attr('stroke-dasharray', '3,3');

    // Labels for zones
    g.append('text')
      .attr('x', width * 0.25)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#10b981')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('◀ CHAMPION STABLE ORBIT (Low Entropy)');

    g.append('text')
      .attr('x', width * 0.75)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f59e0b')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('IN-TRAINING EXPLORATION (High Strain) ▶');

    // Simulation
    const simulation = d3
      .forceSimulation<TopologyNode>(nodes)
      .force('link', d3.forceLink<TopologyNode, TopologyLink>(links).id((d) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2 + 10))
      .force('x', d3.forceX<TopologyNode>().x((d) => {
        if (d.type === 'CHAMPION' || d.type === 'INVARIANT') return width * 0.28;
        if (d.type === 'TRAINING' || d.type === 'EXPLORATORY') return width * 0.72;
        return width / 2;
      }).strength(0.35))
      .force('y', d3.forceY(height / 2).strength(0.15));

    // Links render
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        const target = d.target as TopologyNode;
        if (target.type === 'CHAMPION' || target.type === 'INVARIANT') return '#10b981';
        return '#f59e0b';
      })
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', (d) => d.activity * 3)
      .attr('stroke-dasharray', (d) => (d.activity < 0.6 ? '3,2' : 'none'));

    // Nodes render
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer');

    // Circles
    node
      .append('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => {
        if (d.type === 'CORE') return '#3b82f6';
        if (d.type === 'CHAMPION') return '#059669';
        if (d.type === 'INVARIANT') return '#047857';
        if (d.type === 'TRAINING') return '#d97706';
        return '#b45309';
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.95);

    // Labels
    node
      .append('text')
      .attr('y', (d) => d.r + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e7e5e4')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text((d) => d.label);

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as TopologyNode).x || 0)
        .attr('y1', (d) => (d.source as TopologyNode).y || 0)
        .attr('x2', (d) => (d.target as TopologyNode).x || 0)
        .attr('y2', (d) => (d.target as TopologyNode).y || 0);

      node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [activeTab, selectedChampionSkill, selectedTrainingSkill, currentTelemetry]);

  // ==========================================
  // D3 TAB 3: COMPARATIVE PHASE-SPACE RADAR
  // ==========================================
  useEffect(() => {
    if (activeTab !== 'radar' || !radarSvgRef.current) return;

    const svg = d3.select(radarSvgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 360;
    const radius = 135;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2 + 10})`);

    const axes = [
      { name: 'Memory Compression', champ: 92, train: 32 },
      { name: 'Inference Agility', champ: 88, train: 28 },
      { name: 'Attention Focus (Low Entropy)', champ: 94, train: 24 },
      { name: 'Backtrack Invariance', champ: 98, train: 36 },
      { name: 'Rule Pruning Precision', champ: 96, train: 44 },
      { name: 'Context Window Headroom', champ: 90, train: 38 }
    ];

    const angleSlice = (Math.PI * 2) / axes.length;
    const rScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

    // Concentric grid circles
    const levels = 4;
    for (let i = 1; i <= levels; i++) {
      const levelFactor = radius * (i / levels);
      g.append('circle')
        .attr('r', levelFactor)
        .attr('fill', '#1c1917')
        .attr('stroke', '#292524')
        .attr('stroke-width', 0.8)
        .attr('fill-opacity', 0.4);

      g.append('text')
        .attr('x', 4)
        .attr('y', -levelFactor + 4)
        .attr('fill', '#78716c')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .text(`${(i / levels) * 100}%`);
    }

    // Radial spokes
    axes.forEach((axis, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = rScale(100) * Math.cos(angle);
      const y = rScale(100) * Math.sin(angle);

      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#44403c')
        .attr('stroke-width', 1);

      const labelX = (radius + 20) * Math.cos(angle);
      const labelY = (radius + 15) * Math.sin(angle);

      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', Math.abs(angle) < 0.1 || Math.abs(angle - Math.PI) < 0.1 ? 'middle' : labelX > 0 ? 'start' : 'end')
        .attr('fill', '#e7e5e4')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('dy', '0.35em')
        .text(axis.name);
    });

    // Radar Polygons
    const champLine = d3
      .lineRadial<{ name: string; champ: number }>()
      .radius((d) => rScale(d.champ))
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    const trainLine = d3
      .lineRadial<{ name: string; train: number }>()
      .radius((d) => rScale(d.train))
      .angle((_, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Render Training Polygon (Amber)
    g.append('path')
      .datum(axes)
      .attr('d', trainLine)
      .attr('fill', '#f59e0b')
      .attr('fill-opacity', 0.25)
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2);

    // Render Champion Polygon (Emerald)
    g.append('path')
      .datum(axes)
      .attr('d', champLine)
      .attr('fill', '#10b981')
      .attr('fill-opacity', 0.35)
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.2);

    // Points on polygon
    axes.forEach((axis, i) => {
      const angle = angleSlice * i - Math.PI / 2;

      // Champ dot
      g.append('circle')
        .attr('cx', rScale(axis.champ) * Math.cos(angle))
        .attr('cy', rScale(axis.champ) * Math.sin(angle))
        .attr('r', 3.5)
        .attr('fill', '#10b981')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1);

      // Train dot
      g.append('circle')
        .attr('cx', rScale(axis.train) * Math.cos(angle))
        .attr('cy', rScale(axis.train) * Math.sin(angle))
        .attr('r', 3.5)
        .attr('fill', '#f59e0b')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1);
    });
  }, [activeTab]);

  // Export cognitive telemetry report
  const handleExportTelemetry = () => {
    const report = {
      timestamp: new Date().toISOString(),
      championSelected: selectedChampionSkill,
      trainingSelected: selectedTrainingSkill,
      currentSnapshot: currentTelemetry,
      historyLength: historyData.length,
      recentThoughts: thoughtPackets,
      comparativeDelta: {
        memoryReductionPercentage: `${(
          ((currentTelemetry.trainingMemory - currentTelemetry.championMemory) / currentTelemetry.trainingMemory) *
          100
        ).toFixed(1)}%`,
        latencyReductionMs: `${currentTelemetry.trainingLatency - currentTelemetry.championLatency}ms`,
        attentionEntropyDelta: `${(currentTelemetry.trainingEntropy - currentTelemetry.championEntropy).toFixed(2)} bits`
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cognitive-Load-Monitor-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const content = (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header Banner */}
      <div className="bg-stone-900/70 border border-stone-800 p-5 relative overflow-hidden backdrop-blur-xs">
        <div className="absolute top-0 right-0 w-96 h-36 bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-28 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <div className="p-1.5 bg-blue-950 border border-blue-500/40 text-blue-400">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
                Real-Time Cognitive Load Monitor
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase bg-blue-950 border border-blue-600 text-blue-300 font-bold flex items-center gap-1.5">
                <Cpu className="w-3 h-3" />
                D3 Active Neural Telemetry
              </span>
              <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold">
                Champion vs In-Training
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans max-w-3xl">
              Real-time D3 visualization measuring working memory utilization, attention entropy (Shannon bits), search depth, and counterfactual backtracking. Demonstrates why hardened Champions operate with crystalline constraint efficiency while In-Training agents experience exploratory cognitive strain.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold transition-all border cursor-pointer ${
                isPlaying
                  ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-600/70'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-600/70'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause Stream' : 'Resume Stream'}</span>
            </button>

            <button
              onClick={handleExportTelemetry}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-mono transition-colors cursor-pointer"
              title="Export Cognitive Telemetry Snapshot JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Snapshot</span>
            </button>

            {isOpenAsOverlay && onCloseOverlay && (
              <button
                onClick={onCloseOverlay}
                className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
                title="Close Cognitive Monitor"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Top-Level Cognitive Quad Comparison */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          {/* Working Memory Load */}
          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1.5">
            <div className="flex items-center justify-between text-stone-500 text-[10px] uppercase">
              <span>Working Memory</span>
              <span className="text-emerald-400 font-bold">-67% Delta</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xl font-bold text-emerald-400">{currentTelemetry.championMemory}%</span>
                <span className="text-[10px] text-stone-400 ml-1">Champ</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-amber-400">{currentTelemetry.trainingMemory}%</span>
                <span className="text-[10px] text-stone-400 ml-1">Training</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-stone-900 flex overflow-hidden rounded-xs">
              <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${currentTelemetry.championMemory}%` }} />
            </div>
          </div>

          {/* Attention Entropy */}
          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1.5">
            <div className="flex items-center justify-between text-stone-500 text-[10px] uppercase">
              <span>Attention Entropy</span>
              <span className="text-emerald-400 font-bold">Crystalline</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xl font-bold text-emerald-400">{currentTelemetry.championEntropy}</span>
                <span className="text-[10px] text-stone-400 ml-1">bits</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-amber-400">{currentTelemetry.trainingEntropy}</span>
                <span className="text-[10px] text-stone-400 ml-1">bits</span>
              </div>
            </div>
            <div className="text-[10px] text-stone-500 truncate">
              Shannon divergence: {(currentTelemetry.trainingEntropy - currentTelemetry.championEntropy).toFixed(2)} bits
            </div>
          </div>

          {/* Inference Latency */}
          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1.5">
            <div className="flex items-center justify-between text-stone-500 text-[10px] uppercase">
              <span>Inference Latency</span>
              <span className="text-emerald-400 font-bold">4.8x Speedup</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xl font-bold text-emerald-400">{currentTelemetry.championLatency}ms</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-amber-400">{currentTelemetry.trainingLatency}ms</span>
              </div>
            </div>
            <div className="text-[10px] text-stone-500 truncate">
              Constraint shortcuts skip brute search
            </div>
          </div>

          {/* Backtracking & Strain */}
          <div className="p-3 bg-stone-950 border border-stone-800 space-y-1.5">
            <div className="flex items-center justify-between text-stone-500 text-[10px] uppercase">
              <span>Counterfactual Backtracks</span>
              <span className="text-emerald-400 font-bold">Zero-Thrash</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xl font-bold text-emerald-400">{currentTelemetry.championBacktracks}</span>
                <span className="text-[10px] text-stone-400 ml-1">re-eval</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-amber-400">{currentTelemetry.trainingBacktracks}</span>
                <span className="text-[10px] text-stone-400 ml-1">re-eval</span>
              </div>
            </div>
            <div className="text-[10px] text-stone-500 truncate">
              Training model actively testing bounds
            </div>
          </div>
        </div>

        {/* Pairing Selector Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-stone-800/80 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold uppercase shrink-0">Champion Focus:</span>
            <select
              value={selectedChampionId}
              onChange={(e) => setSelectedChampionId(e.target.value)}
              className="bg-stone-950 border border-stone-700 text-stone-200 px-2.5 py-1.5 text-xs font-mono w-full focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              {championSkills.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.name} ({c.benchmarkScore}%)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold uppercase shrink-0">In-Training Focus:</span>
            <select
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
              className="bg-stone-950 border border-stone-700 text-stone-200 px-2.5 py-1.5 text-xs font-mono w-full focus:outline-hidden focus:border-amber-500 cursor-pointer"
            >
              {trainingSkills.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} · {t.name} ({t.benchmarkScore}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. D3 Visualizer Module (Multi-Tab) */}
      <div className="bg-stone-950 border border-stone-800 p-5 space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-stone-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-400" />
              D3 Cognitive Visualization Workspace
            </span>
          </div>

          {/* Visualization Tab Switcher */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('waveforms')}
              className={`px-3 py-1.5 transition-all border cursor-pointer ${
                activeTab === 'waveforms'
                  ? 'bg-stone-800 text-white border-stone-600 font-bold shadow-xs'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              Real-Time Waveforms
            </button>

            <button
              onClick={() => setActiveTab('topology')}
              className={`px-3 py-1.5 transition-all border cursor-pointer ${
                activeTab === 'topology'
                  ? 'bg-stone-800 text-white border-stone-600 font-bold shadow-xs'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              Attention Topology (Force Field)
            </button>

            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1.5 transition-all border cursor-pointer ${
                activeTab === 'radar'
                  ? 'bg-stone-800 text-white border-stone-600 font-bold shadow-xs'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              Phase-Space Radar
            </button>
          </div>
        </div>

        {/* Tab 1: Waveforms Controls & SVG */}
        {activeTab === 'waveforms' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-500 uppercase">Stream Metric:</span>
                {(
                  [
                    { id: 'memory', label: 'Working Memory (%)' },
                    { id: 'entropy', label: 'Attention Entropy (bits)' },
                    { id: 'latency', label: 'Inference Latency (ms)' },
                    { id: 'backtracks', label: 'Backtracks (count)' }
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMetricView(m.id)}
                    className={`px-2 py-0.5 text-[11px] border transition-colors cursor-pointer ${
                      selectedMetricView === m.id
                        ? 'bg-blue-950 border-blue-500 text-blue-300 font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-300 font-bold">{selectedChampionSkill.code} (Champion)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-amber-300 font-bold">{selectedTrainingSkill.code} (In-Training)</span>
                </div>
              </div>
            </div>

            {/* D3 Waveform SVG Canvas */}
            <div className="w-full bg-stone-950 border border-stone-800/90 p-2 overflow-hidden shadow-inner">
              <svg ref={waveformSvgRef} className="w-full h-auto" />
            </div>
          </div>
        )}

        {/* Tab 2: Topology D3 Force Simulation */}
        {activeTab === 'topology' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Interactive Force Simulation: Neural Invariant Paths vs Counterfactual Tendrils</span>
              <span className="text-[11px] text-stone-500">Live Simulation Active</span>
            </div>
            <div className="w-full bg-stone-950 border border-stone-800 p-2 overflow-hidden shadow-inner">
              <svg ref={topologySvgRef} className="w-full h-auto min-h-[380px]" />
            </div>
          </div>
        )}

        {/* Tab 3: Comparative Phase-Space Radar */}
        {activeTab === 'radar' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>6-Axis Cognitive Constraint Efficiency Radar</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-400 font-bold">■ Champion Boundary</span>
                <span className="text-amber-400 font-bold">■ In-Training Boundary</span>
              </div>
            </div>
            <div className="w-full bg-stone-950 border border-stone-800 p-4 flex items-center justify-center shadow-inner">
              <svg ref={radarSvgRef} className="w-full max-w-[650px] h-auto" />
            </div>
          </div>
        )}
      </div>

      {/* 4. Live Cognitive Thought Stream & Execution Console */}
      <div className="bg-stone-950 border border-stone-800 p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-stone-300 uppercase font-bold text-xs">
              Live Neural Thought Stream & Backtracking Telemetry ({thoughtPackets.length} Packets)
            </span>
          </div>
          <span className="text-stone-500 text-[11px]">Auto-streaming live evaluations</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {thoughtPackets.map((pkt) => {
            const isChamp = pkt.stage === 'champion';
            return (
              <div
                key={pkt.id}
                className={`p-3 border transition-all ${
                  isChamp
                    ? 'bg-stone-900/50 border-emerald-900/50 text-stone-200'
                    : 'bg-stone-900/50 border-amber-900/50 text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 uppercase font-bold border ${
                        isChamp
                          ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                          : 'bg-amber-950 border-amber-600 text-amber-300'
                      }`}
                    >
                      {isChamp ? 'CHAMPION' : 'IN-TRAINING'}
                    </span>
                    <span className="text-white font-bold">{pkt.skillCode}</span>
                    <span className="text-stone-500 text-[10px]">[{pkt.phase}]</span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-stone-400">
                    <span>Latency: <strong className="text-white">{pkt.metrics.inferenceLatencyMs}ms</strong></span>
                    <span>Entropy: <strong className="text-white">{pkt.metrics.attentionEntropy} bits</strong></span>
                    <span>Backtracks: <strong className={pkt.metrics.backtrackingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>{pkt.metrics.backtrackingCount}</strong></span>
                  </div>
                </div>

                <div className="text-xs text-stone-300 font-sans flex items-start gap-2">
                  <span className={isChamp ? 'text-emerald-400' : 'text-amber-400'}>▶</span>
                  <span>{pkt.thoughtText}</span>
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
