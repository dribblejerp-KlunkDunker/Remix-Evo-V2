import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  AgentSkill,
  SkillEvolutionStage,
  VectorCategory
} from '../../types/skills';
import {
  Network,
  Trophy,
  FlaskConical,
  Wrench,
  Lightbulb,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Flame,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sliders,
  ExternalLink,
  ChevronRight,
  Pin,
  X,
  Compass,
  Zap,
  Info,
  GitFork
} from 'lucide-react';

export interface AgentSkillForceGraphProps {
  skills: AgentSkill[];
  onInspectSkill: (skill: AgentSkill) => void;
  onRemixSkill?: (skill: AgentSkill) => void;
  onSimulateMutation?: (skill: AgentSkill) => void;
  onUpdateSkill?: (updatedSkill: AgentSkill) => void;
  onPromoteSkill?: (skill: AgentSkill) => void;
  onSwitchToLab?: () => void;
  onOpenEvolutionHistory?: (skill: AgentSkill) => void;
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  code: string;
  name: string;
  stage: SkillEvolutionStage;
  benchmarkScore: number;
  threshold: number;
  generation: number;
  vectors: VectorCategory[];
  winRate: number;
  stabilityIndex: number;
  hallucinationRate: number;
  specialistRole: string;
  skill: AgentSkill;
  radius: number;
  isChampion: boolean;
  isHighlighted?: boolean;
  isTestingNow?: boolean;
  justPromoted?: boolean;
  isPinned?: boolean;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'lineage' | 'migration' | 'synergy';
  label?: string;
  value?: number;
}

type LayoutMode = 'stream' | 'phylogeny' | 'orbit' | 'synergy';

const STAGE_CONFIG: Record<
  SkillEvolutionStage,
  {
    name: string;
    sublabel: string;
    color: string;
    glowColor: string;
    badgeBg: string;
    border: string;
    icon: typeof Lightbulb;
    targetXRatio: number;
  }
> = {
  idea: {
    name: 'Idea Genesis',
    sublabel: 'Vector Hypothesis',
    color: '#fbbf24', // amber-400
    glowColor: 'rgba(251, 191, 36, 0.35)',
    badgeBg: 'bg-amber-950/40 text-amber-300 border-amber-500/40',
    border: '#d97706',
    icon: Lightbulb,
    targetXRatio: 0.14
  },
  training: {
    name: 'Training Alignment',
    sublabel: 'Constraint Hardening',
    color: '#60a5fa', // blue-400
    glowColor: 'rgba(96, 165, 250, 0.35)',
    badgeBg: 'bg-blue-950/40 text-blue-300 border-blue-500/40',
    border: '#2563eb',
    icon: Wrench,
    targetXRatio: 0.38
  },
  testing: {
    name: 'Adversarial Testing',
    sublabel: 'Stress Benchmarks',
    color: '#c084fc', // purple-400
    glowColor: 'rgba(192, 132, 252, 0.35)',
    badgeBg: 'bg-purple-950/40 text-purple-300 border-purple-500/40',
    border: '#9333ea',
    icon: FlaskConical,
    targetXRatio: 0.63
  },
  champion: {
    name: 'Champion Tier',
    sublabel: 'Active Deployment',
    color: '#34d399', // emerald-400
    glowColor: 'rgba(52, 211, 153, 0.45)',
    badgeBg: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40',
    border: '#059669',
    icon: Trophy,
    targetXRatio: 0.88
  }
};

export const AgentSkillForceGraph: React.FC<AgentSkillForceGraphProps> = ({
  skills,
  onInspectSkill,
  onRemixSkill,
  onSimulateMutation,
  onUpdateSkill,
  onPromoteSkill,
  onSwitchToLab,
  onOpenEvolutionHistory
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // States
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('stream');
  const [selectedStageFilter, setSelectedStageFilter] = useState<SkillEvolutionStage | 'all'>('all');
  const [selectedVectorFilter, setSelectedVectorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSimulatingPhysics, setIsSimulatingPhysics] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isTestingWaveActive, setIsTestingWaveActive] = useState<boolean>(false);
  const [activePromotingNodeId, setActivePromotingNodeId] = useState<string | null>(null);
  const [waveFeedback, setWaveFeedback] = useState<string | null>(null);

  // Canvas dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1100,
    height: 640
  });

  // Extract unique vectors
  const allVectors = useMemo(() => {
    const set = new Set<string>();
    skills.forEach((s) => s.vectors.forEach((v) => set.add(v)));
    return Array.from(set);
  }, [skills]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const targetWidth = Math.max(900, clientWidth);
        const targetHeight = Math.max(580, Math.min(760, window.innerHeight - 280));
        setDimensions({ width: targetWidth, height: targetHeight });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Build Graph Nodes & Links
  const { graphNodes, graphLinks } = useMemo(() => {
    // 1. Build Nodes
    const nodes: GraphNode[] = skills.map((skill) => {
      const isChamp = skill.stage === 'champion';
      // Sized by score and stage
      const baseRadius = isChamp ? 34 : skill.stage === 'testing' ? 28 : skill.stage === 'training' ? 25 : 22;
      const scoreBonus = Math.max(0, (skill.benchmarkScore - 70) / 10);
      const radius = Math.min(42, Math.round(baseRadius + scoreBonus));

      return {
        id: skill.id,
        code: skill.code,
        name: skill.name,
        stage: skill.stage,
        benchmarkScore: skill.benchmarkScore,
        threshold: skill.threshold || 95.0,
        generation: skill.generation,
        vectors: skill.vectors,
        winRate: skill.winRate,
        stabilityIndex: skill.stabilityIndex,
        hallucinationRate: skill.hallucinationRate,
        specialistRole: skill.specialistRole,
        skill: skill,
        radius,
        isChampion: isChamp
      };
    });

    // Node lookup map
    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach((n) => {
      nodeMap.set(n.id, n);
      nodeMap.set(n.code, n);
    });

    // 2. Build Links
    const links: GraphLink[] = [];
    const linkSet = new Set<string>();

    // A) Lineage & Parent Links (from evolutionLineage.parents)
    skills.forEach((skill) => {
      const targetNode = nodeMap.get(skill.id);
      if (!targetNode) return;

      if (skill.evolutionLineage?.parents) {
        skill.evolutionLineage.parents.forEach((parentIdOrCode) => {
          const sourceNode = nodeMap.get(parentIdOrCode);
          if (sourceNode && sourceNode.id !== targetNode.id) {
            const linkKey = `lineage-${sourceNode.id}-${targetNode.id}`;
            if (!linkSet.has(linkKey)) {
              linkSet.add(linkKey);
              links.push({
                id: linkKey,
                source: sourceNode.id,
                target: targetNode.id,
                type: 'lineage',
                label: skill.evolutionLineage.mutationType || 'Evolved from',
                value: 3
              });
            }
          }
        });
      }

      // Also check iterations parentSkillIds
      if (skill.evolutionLineage?.iterations) {
        skill.evolutionLineage.iterations.forEach((iter) => {
          iter.parentSkillIds?.forEach((parentId) => {
            const sourceNode = nodeMap.get(parentId);
            if (sourceNode && sourceNode.id !== targetNode.id) {
              const linkKey = `lineage-iter-${sourceNode.id}-${targetNode.id}`;
              if (!linkSet.has(linkKey)) {
                linkSet.add(linkKey);
                links.push({
                  id: linkKey,
                  source: sourceNode.id,
                  target: targetNode.id,
                  type: 'lineage',
                  label: iter.recombinationStrategy || `Iteration #${iter.iterationNumber}`,
                  value: 2
                });
              }
            }
          });
        });
      }

      // B) Stage Migration Links: connect chronological stages if multiple skills form an evolutionary cohort
      // Connect each Testing skill to nearest Champion or Training to show migration conduit
      if (skill.stage === 'champion') {
        const testingPeers = skills.filter((s) => s.stage === 'testing' && s.vectors.some((v) => skill.vectors.includes(v)));
        testingPeers.slice(0, 1).forEach((peer) => {
          const linkKey = `migration-${peer.id}-${skill.id}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              id: linkKey,
              source: peer.id,
              target: skill.id,
              type: 'migration',
              label: 'Champion Gate Promotion Pathway (≥95%)',
              value: 4
            });
          }
        });
      }

      if (skill.stage === 'testing') {
        const trainingPeers = skills.filter((s) => s.stage === 'training' && s.vectors.some((v) => skill.vectors.includes(v)));
        trainingPeers.slice(0, 1).forEach((peer) => {
          const linkKey = `migration-${peer.id}-${skill.id}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              id: linkKey,
              source: peer.id,
              target: skill.id,
              type: 'migration',
              label: 'Benchmark Graduation',
              value: 3
            });
          }
        });
      }

      if (skill.stage === 'training') {
        const ideaPeers = skills.filter((s) => s.stage === 'idea' && s.vectors.some((v) => skill.vectors.includes(v)));
        ideaPeers.slice(0, 1).forEach((peer) => {
          const linkKey = `migration-${peer.id}-${skill.id}`;
          if (!linkSet.has(linkKey)) {
            linkSet.add(linkKey);
            links.push({
              id: linkKey,
              source: peer.id,
              target: skill.id,
              type: 'migration',
              label: 'Hypothesis Formulation',
              value: 2
            });
          }
        });
      }
    });

    // C) Synergy links: if nodes share ≥2 vector categories and no direct link exists
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const sharedVectors = n1.vectors.filter((v) => n2.vectors.includes(v));
        if (sharedVectors.length >= 2) {
          const linkKey = `synergy-${n1.id}-${n2.id}`;
          if (!linkSet.has(linkKey) && !linkSet.has(`lineage-${n1.id}-${n2.id}`) && !linkSet.has(`migration-${n1.id}-${n2.id}`)) {
            linkSet.add(linkKey);
            links.push({
              id: linkKey,
              source: n1.id,
              target: n2.id,
              type: 'synergy',
              label: `Cross-Domain: ${sharedVectors.join(' × ')}`,
              value: 1
            });
          }
        }
      }
    }

    return { graphNodes: nodes, graphLinks: links };
  }, [skills]);

  // Connected nodes & links for hover highlight
  const highlightedEntityIds = useMemo(() => {
    if (!hoveredNode) return null;
    const nodeIds = new Set<string>([hoveredNode.id]);
    const linkIds = new Set<string>();

    graphLinks.forEach((link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      if (sourceId === hoveredNode.id || targetId === hoveredNode.id) {
        nodeIds.add(sourceId);
        nodeIds.add(targetId);
        linkIds.add(link.id);
      }
    });

    return { nodeIds, linkIds };
  }, [hoveredNode, graphLinks]);

  // Filtered nodes based on UI controls
  const visibleNodes = useMemo(() => {
    return graphNodes.filter((node) => {
      const matchesStage = selectedStageFilter === 'all' || node.stage === selectedStageFilter;
      const matchesVector = selectedVectorFilter === 'all' || node.vectors.includes(selectedVectorFilter as VectorCategory);
      const matchesSearch =
        searchQuery.trim() === '' ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.specialistRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.vectors.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStage && matchesVector && matchesSearch;
    });
  }, [graphNodes, selectedStageFilter, selectedVectorFilter, searchQuery]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  // Main D3 Force Simulation Setup
  useEffect(() => {
    if (!svgRef.current) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);

    // Deep clone data for D3 mutation
    const simNodes: GraphNode[] = graphNodes.map((d) => ({
      ...d,
      // preserve previous positions if already simulated
      x: d.x ?? width * STAGE_CONFIG[d.stage].targetXRatio + (Math.random() - 0.5) * 80,
      y: d.y ?? height / 2 + (Math.random() - 0.5) * 200
    }));

    const nodeLookup = new Map<string, GraphNode>();
    simNodes.forEach((n) => nodeLookup.set(n.id, n));

    const simLinks: GraphLink[] = graphLinks
      .filter((l) => {
        const sId = typeof l.source === 'object' ? l.source.id : l.source;
        const tId = typeof l.target === 'object' ? l.target.id : l.target;
        return nodeLookup.has(sId) && nodeLookup.has(tId);
      })
      .map((l) => ({
        ...l,
        source: nodeLookup.get(typeof l.source === 'object' ? l.source.id : l.source)!,
        target: nodeLookup.get(typeof l.target === 'object' ? l.target.id : l.target)!
      }));

    // Setup Simulation Forces based on Layout Mode
    const simulation = d3.forceSimulation<GraphNode>(simNodes);

    // Common collision force
    simulation.force(
      'collide',
      d3.forceCollide<GraphNode>().radius((d) => d.radius + 16).iterations(3)
    );

    // Link force
    simulation.force(
      'link',
      d3
        .forceLink<GraphNode, GraphLink>(simLinks)
        .id((d) => d.id)
        .distance((d) => (d.type === 'migration' ? 140 : d.type === 'lineage' ? 110 : 160))
        .strength((d) => (d.type === 'migration' ? 0.35 : d.type === 'lineage' ? 0.45 : 0.15))
    );

    // Layout-specific forces
    if (layoutMode === 'stream') {
      // Horizontal Stage Migration Swimlanes (Idea -> Training -> Testing -> Champion)
      simulation
        .force(
          'x',
          d3
            .forceX<GraphNode>((d) => width * STAGE_CONFIG[d.stage].targetXRatio)
            .strength(0.42)
        )
        .force('y', d3.forceY<GraphNode>(height / 2).strength(0.12))
        .force('charge', d3.forceManyBody<GraphNode>().strength(-260));
    } else if (layoutMode === 'orbit') {
      // Performance Orbit: distance from center based on benchmark score
      const centerX = width / 2;
      const centerY = height / 2;
      simulation
        .force('charge', d3.forceManyBody<GraphNode>().strength(-350))
        .force('radial', d3.forceRadial<GraphNode>((d) => {
          // 95-100% Champion at inner core (radius ~100-160px), ideas at outer rim (radius ~320px)
          const norm = Math.max(0, 100 - d.benchmarkScore);
          return 90 + norm * 8;
        }, centerX, centerY).strength(0.7));
    } else if (layoutMode === 'synergy') {
      // Clustered by primary vector category
      const vectorCenters: Record<string, { x: number; y: number }> = {};
      allVectors.forEach((v, idx) => {
        const angle = (idx / allVectors.length) * 2 * Math.PI;
        const radius = Math.min(width, height) * 0.35;
        vectorCenters[v] = {
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius
        };
      });

      simulation
        .force(
          'x',
          d3.forceX<GraphNode>((d) => {
            const primary = d.vectors[0] || '';
            return vectorCenters[primary]?.x ?? width / 2;
          }).strength(0.3)
        )
        .force(
          'y',
          d3.forceY<GraphNode>((d) => {
            const primary = d.vectors[0] || '';
            return vectorCenters[primary]?.y ?? height / 2;
          }).strength(0.3)
        )
        .force('charge', d3.forceManyBody<GraphNode>().strength(-280));
    } else {
      // Phylogeny Tree Layout: Idea seeds top-left spreading to Champions
      simulation
        .force('charge', d3.forceManyBody<GraphNode>().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
        .force(
          'x',
          d3.forceX<GraphNode>((d) => {
            const stageRank = d.stage === 'idea' ? 0.18 : d.stage === 'training' ? 0.40 : d.stage === 'testing' ? 0.65 : 0.88;
            return width * stageRank;
          }).strength(0.25)
        );
    }

    // Zoom setup
    const container = svg.select<SVGGElement>('g.main-graph-layer');
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 3.0])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    // Simulation Tick Handler
    simulation.on('tick', () => {
      // Keep nodes inside bounds
      simNodes.forEach((node) => {
        const pad = node.radius + 10;
        node.x = Math.max(pad, Math.min(width - pad, node.x ?? width / 2));
        node.y = Math.max(pad, Math.min(height - pad, node.y ?? height / 2));
      });

      // Update Links (Curved Paths)
      svg
        .selectAll<SVGPathElement, GraphLink>('path.graph-link')
        .data(simLinks, (d) => d.id)
        .attr('d', (d) => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          if (!s.x || !s.y || !t.x || !t.y) return '';

          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dr = Math.sqrt(dx * dx + dy * dy) * 1.25;

          // Gentle curve
          return `M${s.x},${s.y}A${dr},${dr} 0 0,1 ${t.x},${t.y}`;
        });

      // Update Node Groups
      svg
        .selectAll<SVGGElement, GraphNode>('g.graph-node')
        .data(simNodes, (d) => d.id)
        .attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    simulationRef.current = simulation;

    // Trigger simulation
    simulation.alpha(0.8).restart();

    return () => {
      simulation.stop();
    };
  }, [dimensions, graphNodes, graphLinks, layoutMode, allVectors]);

  // Drag and Pin implementation
  const handleDrag = useCallback(
    (simulation: d3.Simulation<GraphNode, GraphLink>) => {
      function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
        if (!event.active) simulation.alphaTarget(0);
        // If not explicitly pinned, release fx/fy
        if (!d.isPinned) {
          d.fx = null;
          d.fy = null;
        }
      }

      return d3
        .drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    },
    []
  );

  // Bind Drag to Nodes
  useEffect(() => {
    if (!svgRef.current || !simulationRef.current) return;
    const svg = d3.select(svgRef.current);
    const nodesSelection = svg.selectAll<SVGGElement, GraphNode>('g.graph-node');
    nodesSelection.call(handleDrag(simulationRef.current));
  }, [handleDrag, graphNodes, dimensions]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(450)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  const handleFocusStage = (stage: SkillEvolutionStage) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const stageNodes = graphNodes.filter((n) => n.stage === stage);
    if (stageNodes.length === 0) return;

    const targetX = dimensions.width * STAGE_CONFIG[stage].targetXRatio;
    const targetY = dimensions.height / 2;
    const scale = 1.45;
    const x = dimensions.width / 2 - targetX * scale;
    const y = dimensions.height / 2 - targetY * scale;

    d3.select(svgRef.current)
      .transition()
      .duration(650)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(x, y).scale(scale));
  };

  // Toggle Physics Play/Pause
  const togglePhysics = () => {
    if (!simulationRef.current) return;
    if (isSimulatingPhysics) {
      simulationRef.current.stop();
      setIsSimulatingPhysics(false);
    } else {
      simulationRef.current.alpha(0.5).restart();
      setIsSimulatingPhysics(true);
    }
  };

  // Run a real-time Test Bench on a specific skill
  const handleRunTestOnNode = async (node: GraphNode) => {
    setActivePromotingNodeId(node.id);

    // Simulate adversarial test evaluation delay
    await new Promise((r) => setTimeout(r, 900));

    const currentScore = node.benchmarkScore;
    const delta = Number((Math.random() * 1.4 + 0.4).toFixed(1));
    const newScore = Math.min(99.6, Number((currentScore + delta).toFixed(1)));
    const crossedThreshold = newScore >= node.threshold && node.stage !== 'champion';

    const newStage: SkillEvolutionStage = crossedThreshold
      ? 'champion'
      : node.stage === 'idea' && newScore >= 85
      ? 'training'
      : node.stage === 'training' && newScore >= 90
      ? 'testing'
      : node.stage;

    const updatedSkill: AgentSkill = {
      ...node.skill,
      benchmarkScore: newScore,
      stage: newStage,
      stageHistory: [
        ...node.skill.stageHistory,
        {
          stage: newStage,
          timestamp: 'Just now',
          score: newScore,
          notes: crossedThreshold
            ? `🔥 Broke the 95.0% threshold (${newScore}%)! Promoted to active Champion status.`
            : `Adversarial test run passed. Score elevated +${delta}% to ${newScore}%.`
        }
      ]
    };

    if (onUpdateSkill) {
      onUpdateSkill(updatedSkill);
    }

    // Update selectedNode state
    setSelectedNode((prev) =>
      prev && prev.id === node.id
        ? {
            ...prev,
            benchmarkScore: newScore,
            stage: newStage,
            isChampion: newStage === 'champion',
            skill: updatedSkill
          }
        : prev
    );

    setActivePromotingNodeId(null);

    if (crossedThreshold) {
      setWaveFeedback(`🎉 CHAMPION PROMOTION! "${node.name}" crossed the 95% threshold (${newScore}%)!`);
    } else {
      setWaveFeedback(`⚡ Test passed! "${node.name}" gained +${delta}% (Score: ${newScore}%).`);
    }
    setTimeout(() => setWaveFeedback(null), 4500);

    // Re-heat simulation
    simulationRef.current?.alpha(0.4).restart();
  };

  // Simulate a Global Migration Wave (tests all candidate skills and migrates them)
  const handleSimulateMigrationWave = async () => {
    setIsTestingWaveActive(true);
    setWaveFeedback('🌊 Running adversarial stress wave across all Idea, Training, and Testing candidates...');

    await new Promise((r) => setTimeout(r, 1200));

    // Find highest candidate in testing to promote
    const testingCandidates = skills.filter((s) => s.stage === 'testing');
    const trainingCandidates = skills.filter((s) => s.stage === 'training');

    let promotedCandidate: AgentSkill | null = null;

    if (testingCandidates.length > 0) {
      // Pick highest scoring testing candidate to cross the threshold
      const topCandidate = [...testingCandidates].sort((a, b) => b.benchmarkScore - a.benchmarkScore)[0];
      const newScore = Math.max(95.2, Number((topCandidate.benchmarkScore + 0.8).toFixed(1)));

      promotedCandidate = {
        ...topCandidate,
        stage: 'champion',
        benchmarkScore: newScore,
        stageHistory: [
          ...topCandidate.stageHistory,
          {
            stage: 'champion',
            timestamp: 'Just now',
            score: newScore,
            notes: '🔥 Promoted to active Champion status during Global Migration Wave!'
          }
        ]
      };

      if (onUpdateSkill) {
        onUpdateSkill(promotedCandidate);
      }
    } else if (trainingCandidates.length > 0) {
      // Advance training to testing
      const topTraining = trainingCandidates[0];
      const newScore = Math.max(90.5, Number((topTraining.benchmarkScore + 1.8).toFixed(1)));
      const advanced = {
        ...topTraining,
        stage: 'testing' as SkillEvolutionStage,
        benchmarkScore: newScore,
        stageHistory: [
          ...topTraining.stageHistory,
          {
            stage: 'testing' as SkillEvolutionStage,
            timestamp: 'Just now',
            score: newScore,
            notes: 'Graduated from Training to Testing benchmark phase.'
          }
        ]
      };
      if (onUpdateSkill) {
        onUpdateSkill(advanced);
      }
    }

    setIsTestingWaveActive(false);

    if (promotedCandidate) {
      setWaveFeedback(`🏆 MIGRATION SUCCESS: "${promotedCandidate.name}" broke 95% gate and migrated into Champion Citadel!`);
    } else {
      setWaveFeedback('⚡ Global test wave completed. All candidate weights refined.');
    }
    setTimeout(() => setWaveFeedback(null), 5000);

    // Re-heat simulation
    simulationRef.current?.alpha(0.7).restart();
  };

  // Toggle Node Pin
  const togglePinNode = (node: GraphNode) => {
    const isNowPinned = !node.isPinned;
    node.isPinned = isNowPinned;
    if (isNowPinned) {
      node.fx = node.x;
      node.fy = node.y;
    } else {
      node.fx = null;
      node.fy = null;
      simulationRef.current?.alpha(0.2).restart();
    }
    setSelectedNode((prev) => (prev?.id === node.id ? { ...prev, isPinned: isNowPinned } : prev));
  };

  const { width, height } = dimensions;
  const championThresholdX = width * 0.77;

  return (
    <div
      ref={containerRef}
      className="bg-stone-900 border border-stone-800 rounded-none shadow-2xl relative overflow-hidden flex flex-col select-none"
    >
      {/* 1. TOP HEADER & HUD BAR */}
      <div className="p-4 bg-stone-950/80 border-b border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-semibold">
              Evolutionary Lineage & Migration Physics · D3.js Engine
            </span>
            <span className="text-stone-600 font-mono text-xs">/</span>
            <span className="font-mono text-xs text-stone-400">Force Simulation Active</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
            <span>Agent Skill Evolution Force Graph</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 bg-stone-800 text-stone-300 border border-stone-700">
              {graphNodes.length} Nodes · {graphLinks.length} Evolutionary Vectors
            </span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5 font-sans">
            Force-directed visualization tracking autonomous agent skills migrating from Idea genesis, through constraint training and adversarial testing, to the 95.0% Champion gate.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleSimulateMigrationWave}
            disabled={isTestingWaveActive}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold text-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:opacity-50"
            title="Run adversarial test wave across candidate skills to push them across the Champion Gate"
          >
            <Zap className={`w-3.5 h-3.5 ${isTestingWaveActive ? 'animate-spin' : ''}`} />
            <span>{isTestingWaveActive ? 'Simulating Migration Wave...' : 'Simulate Migration Wave'}</span>
          </button>

          <button
            onClick={togglePhysics}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border transition-all ${
              isSimulatingPhysics
                ? 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700'
                : 'bg-amber-950/40 text-amber-300 border-amber-600/50'
            }`}
            title="Toggle physics simulation ticks"
          >
            {isSimulatingPhysics ? <Pause className="w-3.5 h-3.5 text-stone-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isSimulatingPhysics ? 'Freeze' : 'Unfreeze'}</span>
          </button>

          <div className="flex items-center border border-stone-800 bg-stone-900">
            <button
              onClick={handleZoomIn}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors border-l border-stone-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors border-l border-stone-800"
              title="Reset View to Center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY CONTROLS: LAYOUT SELECTOR & STAGE FILTER CHIPS */}
      <div className="px-4 py-2.5 bg-stone-950/50 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono relative z-20">
        {/* Layout Modes */}
        <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 p-0.5">
          <span className="text-stone-500 text-[11px] px-2 uppercase font-semibold">Layout:</span>
          {(
            [
              { id: 'stream', label: 'Stage Migration Stream' },
              { id: 'phylogeny', label: 'Phylogeny Tree' },
              { id: 'orbit', label: 'Score Orbit (95% Gate)' },
              { id: 'synergy', label: 'Vector Mesh' }
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setLayoutMode(m.id)}
              className={`px-2.5 py-1 transition-all ${
                layoutMode === m.id
                  ? 'bg-stone-800 text-white font-bold border border-stone-600 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 border border-transparent'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Stage Filter Buttons & Focus jump */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-stone-500 text-[11px] uppercase font-semibold">Filter:</span>
          <button
            onClick={() => setSelectedStageFilter('all')}
            className={`px-2 py-1 transition-colors border ${
              selectedStageFilter === 'all'
                ? 'bg-stone-800 text-white border-stone-600'
                : 'text-stone-400 border-stone-800/80 hover:border-stone-700'
            }`}
          >
            All ({graphNodes.length})
          </button>
          {(['idea', 'training', 'testing', 'champion'] as SkillEvolutionStage[]).map((stage) => {
            const count = graphNodes.filter((n) => n.stage === stage).length;
            const cfg = STAGE_CONFIG[stage];
            return (
              <button
                key={stage}
                onClick={() => {
                  setSelectedStageFilter(stage);
                  handleFocusStage(stage);
                }}
                className={`px-2 py-1 transition-all border flex items-center gap-1.5 ${
                  selectedStageFilter === stage
                    ? `${cfg.badgeBg} font-bold`
                    : 'text-stone-400 border-stone-800/80 hover:border-stone-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="capitalize">{stage}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Highlight skill code, role..."
            className="w-full bg-stone-900 border border-stone-800 px-8 py-1 text-xs font-mono text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-600"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Migration Wave Feedback Toast */}
      {waveFeedback && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-stone-900/95 border border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.3)] text-emerald-300 text-xs font-mono flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>{waveFeedback}</span>
        </div>
      )}

      {/* 3. D3 SVG CANVAS */}
      <div className="relative flex-1 w-full overflow-hidden bg-stone-950">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
          style={{ minHeight: `${height}px` }}
        >
          {/* SVG Definitions: Gradients, Filters, Markers */}
          <defs>
            {/* Neon Glow Filters */}
            <filter id="glow-champion" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-testing" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-gate" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Stage Gradients */}
            <linearGradient id="grad-idea" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="grad-training" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="grad-testing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6b21a8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="grad-champion" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.95" />
            </linearGradient>

            {/* Link Gradients */}
            <linearGradient id="grad-migration-link" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.95" />
            </linearGradient>

            {/* Arrow Markers for Directed Evolution */}
            <marker
              id="arrow-lineage"
              viewBox="0 0 10 10"
              refX="22"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#71717a" opacity="0.8" />
            </marker>
            <marker
              id="arrow-migration"
              viewBox="0 0 10 10"
              refX="24"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#34d399" />
            </marker>

            {/* Grid Pattern */}
            <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.75" fill="#3f3f46" opacity="0.35" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width={width} height={height} fill="url(#grid-pattern)" pointerEvents="none" />

          {/* MAIN GRAPH LAYER (Zoomable) */}
          <g className="main-graph-layer">
            {/* STAGE SWIMLANE BACKGROUNDS (Only in 'stream' mode) */}
            {layoutMode === 'stream' && (
              <g className="stage-swimlanes" pointerEvents="none">
                {/* Zone 1: Idea Genesis */}
                <rect
                  x={0}
                  y={0}
                  width={width * 0.26}
                  height={height}
                  fill="rgba(245, 158, 11, 0.02)"
                  stroke="rgba(245, 158, 11, 0.12)"
                  strokeDasharray="4 4"
                />
                <text
                  x={width * 0.02}
                  y={30}
                  className="font-mono text-[11px] fill-amber-400/70 uppercase tracking-widest font-semibold"
                >
                  Stage 01 · Idea Genesis (Seed Vectors)
                </text>

                {/* Zone 2: Training Alignment */}
                <rect
                  x={width * 0.26}
                  y={0}
                  width={width * 0.24}
                  height={height}
                  fill="rgba(59, 130, 246, 0.02)"
                  stroke="rgba(59, 130, 246, 0.12)"
                  strokeDasharray="4 4"
                />
                <text
                  x={width * 0.28}
                  y={30}
                  className="font-mono text-[11px] fill-blue-400/70 uppercase tracking-widest font-semibold"
                >
                  Stage 02 · Training Alignment (Rule Rigor)
                </text>

                {/* Zone 3: Adversarial Testing */}
                <rect
                  x={width * 0.50}
                  y={0}
                  width={width * 0.27}
                  height={height}
                  fill="rgba(168, 85, 247, 0.025)"
                  stroke="rgba(168, 85, 247, 0.14)"
                  strokeDasharray="4 4"
                />
                <text
                  x={width * 0.52}
                  y={30}
                  className="font-mono text-[11px] fill-purple-400/70 uppercase tracking-widest font-semibold"
                >
                  Stage 03 · Adversarial Testing (Stress Benchmarks)
                </text>

                {/* CHAMPION THRESHOLD GATE (Vertical Glowing Boundary at 95.0%) */}
                <g className="champion-gate">
                  <line
                    x1={championThresholdX}
                    y1={10}
                    x2={championThresholdX}
                    y2={height - 10}
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    filter="url(#glow-gate)"
                    opacity="0.85"
                  />
                  {/* Gate Badge */}
                  <rect
                    x={championThresholdX - 85}
                    y={16}
                    width={170}
                    height={24}
                    fill="#064e3b"
                    stroke="#34d399"
                    strokeWidth="1"
                    rx={2}
                  />
                  <text
                    x={championThresholdX}
                    y={32}
                    textAnchor="middle"
                    className="font-mono text-[10px] fill-emerald-200 font-bold uppercase tracking-wider"
                  >
                    CHAMPION GATE ≥ 95.0%
                  </text>
                </g>

                {/* Zone 4: Champion Citadel */}
                <rect
                  x={championThresholdX}
                  y={0}
                  width={width - championThresholdX}
                  height={height}
                  fill="rgba(16, 185, 129, 0.04)"
                  stroke="rgba(16, 185, 129, 0.2)"
                />
                <text
                  x={championThresholdX + 18}
                  y={30}
                  className="font-mono text-[11px] fill-emerald-400 uppercase tracking-widest font-bold"
                >
                  Stage 04 · Champion Tier (Field Active)
                </text>
              </g>
            )}

            {/* LINKS LAYER */}
            <g className="links-layer">
              {graphLinks.map((link) => {
                const s = typeof link.source === 'object' ? link.source : graphNodes.find((n) => n.id === link.source);
                const t = typeof link.target === 'object' ? link.target : graphNodes.find((n) => n.id === link.target);
                if (!s || !t) return null;

                const isLinkHighlighted = highlightedEntityIds?.linkIds.has(link.id);
                const isDimmed = highlightedEntityIds && !isLinkHighlighted;

                // Color based on link type
                let strokeColor = '#52525b';
                let strokeWidth = 1.5;
                let strokeDash = undefined;
                let markerEnd = 'url(#arrow-lineage)';

                if (link.type === 'migration') {
                  strokeColor = 'url(#grad-migration-link)';
                  strokeWidth = isLinkHighlighted ? 3.5 : 2.5;
                  strokeDash = '6 3';
                  markerEnd = 'url(#arrow-migration)';
                } else if (link.type === 'lineage') {
                  strokeColor = '#a855f7';
                  strokeWidth = isLinkHighlighted ? 2.5 : 1.8;
                } else if (link.type === 'synergy') {
                  strokeColor = '#3b82f6';
                  strokeWidth = 1.0;
                  strokeDash = '3 3';
                  markerEnd = undefined;
                }

                return (
                  <path
                    key={link.id}
                    id={link.id}
                    className="graph-link transition-opacity duration-200"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    markerEnd={markerEnd}
                    fill="none"
                    opacity={isDimmed ? 0.08 : isLinkHighlighted ? 1 : 0.45}
                    style={{
                      animation: link.type === 'migration' ? 'dash-flow 20s linear infinite' : undefined
                    }}
                  />
                );
              })}
            </g>

            {/* NODES LAYER */}
            <g className="nodes-layer">
              {graphNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const isNodeHighlighted = highlightedEntityIds?.nodeIds.has(node.id) ?? false;
                const isDimmed = highlightedEntityIds && !isNodeHighlighted;
                const isFilterHidden = !visibleNodeIds.has(node.id);
                const isTestingNow = activePromotingNodeId === node.id;

                const cfg = STAGE_CONFIG[node.stage];
                const circumference = 2 * Math.PI * (node.radius + 3);
                const progressRatio = Math.min(1, Math.max(0, node.benchmarkScore / 100));
                const strokeDashoffset = circumference * (1 - progressRatio);

                return (
                  <g
                    key={node.id}
                    id={`node-${node.id}`}
                    className={`graph-node transition-opacity duration-200 cursor-pointer ${
                      isDimmed || isFilterHidden ? 'opacity-20' : 'opacity-100'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    onMouseEnter={(e) => {
                      setHoveredNode(node);
                      const rect = svgRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltipPos({
                          x: e.clientX - rect.left + 15,
                          y: e.clientY - rect.top + 15
                        });
                      }
                    }}
                    onMouseMove={(e) => {
                      const rect = svgRef.current?.getBoundingClientRect();
                      if (rect) {
                        setTooltipPos({
                          x: e.clientX - rect.left + 15,
                          y: e.clientY - rect.top + 15
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredNode(null);
                      setTooltipPos(null);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      togglePinNode(node);
                    }}
                  >
                    {/* Pulsing Aura for Champions and Currently Testing Nodes */}
                    {(node.isChampion || isTestingNow) && (
                      <circle
                        r={node.radius + 14}
                        fill="none"
                        stroke={cfg.color}
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity={node.isChampion ? 0.45 : 0.8}
                        className={isTestingNow ? 'animate-spin' : 'animate-pulse'}
                        filter={node.isChampion ? 'url(#glow-champion)' : undefined}
                      />
                    )}

                    {/* Active Selection Ring */}
                    {isSelected && (
                      <circle
                        r={node.radius + 9}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Progress Donut Ring (Score gauge) */}
                    <circle
                      r={node.radius + 3}
                      fill="none"
                      stroke="#27272a"
                      strokeWidth="3.5"
                    />
                    <circle
                      r={node.radius + 3}
                      fill="none"
                      stroke={cfg.color}
                      strokeWidth="3.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform={`rotate(-90)`}
                    />

                    {/* Node Interior Disc */}
                    <circle
                      r={node.radius}
                      fill="#18181b"
                      stroke={isSelected ? '#ffffff' : cfg.border}
                      strokeWidth={isSelected ? 2.5 : 2}
                      filter={node.isChampion ? 'url(#glow-champion)' : undefined}
                    />

                    {/* Center Glyphs / Visual Identity */}
                    {node.stage === 'champion' ? (
                      <g transform="translate(-10, -10)">
                        <Trophy className="w-5 h-5 text-emerald-400 drop-shadow" />
                      </g>
                    ) : node.stage === 'testing' ? (
                      <g transform="translate(-8, -8)">
                        <FlaskConical className="w-4 h-4 text-purple-400" />
                      </g>
                    ) : node.stage === 'training' ? (
                      <g transform="translate(-8, -8)">
                        <Wrench className="w-4 h-4 text-blue-400" />
                      </g>
                    ) : (
                      <g transform="translate(-8, -8)">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                      </g>
                    )}

                    {/* Node Code Label */}
                    <text
                      y={node.radius + 15}
                      textAnchor="middle"
                      className="font-mono text-[10px] font-bold fill-white select-none pointer-events-none drop-shadow-md"
                    >
                      {node.code}
                    </text>

                    {/* Score Badge Pill */}
                    <rect
                      x={-24}
                      y={node.radius + 20}
                      width={48}
                      height={14}
                      fill="#09090b"
                      stroke={cfg.color}
                      strokeWidth="1"
                      rx={2}
                      className="pointer-events-none"
                    />
                    <text
                      y={node.radius + 30}
                      textAnchor="middle"
                      className="font-mono text-[9px] font-bold fill-stone-200 select-none pointer-events-none"
                    >
                      {node.benchmarkScore.toFixed(1)}%
                    </text>

                    {/* Generation Pip */}
                    <g transform={`translate(${node.radius - 6}, ${-node.radius + 4})`}>
                      <rect
                        width={18}
                        height={12}
                        rx={2}
                        fill="#09090b"
                        stroke="#52525b"
                        strokeWidth="0.75"
                      />
                      <text
                        x={9}
                        y={9}
                        textAnchor="middle"
                        className="font-mono text-[8px] fill-stone-300 font-bold select-none"
                      >
                        G{node.generation}
                      </text>
                    </g>

                    {/* Pin Indicator */}
                    {node.isPinned && (
                      <g transform={`translate(${-node.radius - 2}, ${-node.radius + 4})`}>
                        <Pin className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* 4. HOVER TOOLTIP */}
        {hoveredNode && tooltipPos && (
          <div
            className="absolute z-50 pointer-events-none bg-stone-900/95 border border-stone-700 p-3.5 shadow-2xl backdrop-blur-md max-w-xs animate-fade-in"
            style={{
              left: Math.min(tooltipPos.x, width - 260),
              top: Math.min(tooltipPos.y, height - 180)
            }}
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-800">
              <span className="font-mono text-[10px] text-stone-400 font-bold">
                {hoveredNode.code}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 border uppercase font-bold ${
                  STAGE_CONFIG[hoveredNode.stage].badgeBg
                }`}
              >
                {hoveredNode.stage}
              </span>
            </div>

            <div className="mt-2">
              <h4 className="text-xs font-serif font-bold text-white leading-tight">
                {hoveredNode.name}
              </h4>
              <p className="text-[10px] text-stone-400 mt-1 line-clamp-2">
                {hoveredNode.specialistRole}
              </p>
            </div>

            {/* Score & Threshold Progress */}
            <div className="mt-3 pt-2 border-t border-stone-800/80 space-y-1 font-mono text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Benchmark Score:</span>
                <span
                  className={`font-bold ${
                    hoveredNode.benchmarkScore >= 95 ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {hoveredNode.benchmarkScore.toFixed(1)}% / 95.0%
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Generation: G{hoveredNode.generation}</span>
                <span>Win Rate: {hoveredNode.winRate}%</span>
              </div>
              <div className="flex items-center justify-between text-stone-400">
                <span>Hallucination: {hoveredNode.hallucinationRate}%</span>
                <span>Stability: {hoveredNode.stabilityIndex}%</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[9px] font-mono text-cyan-400">
              <span>Click to inspect & test</span>
              <span>Double-click to pin</span>
            </div>
          </div>
        )}

        {/* 5. SLIDE-OVER INSPECTION & ACTION DRAWER (When a Node is clicked) */}
        {selectedNode && (
          <div className="absolute top-0 right-0 bottom-0 w-80 md:w-96 bg-stone-950/95 border-l border-stone-800 shadow-2xl z-40 flex flex-col backdrop-blur-md animate-slide-left overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-800 flex items-start justify-between bg-stone-900/60 sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 border uppercase font-bold ${
                      STAGE_CONFIG[selectedNode.stage].badgeBg
                    }`}
                  >
                    {selectedNode.stage} Stage
                  </span>
                  <span className="font-mono text-xs text-stone-400 font-bold">
                    {selectedNode.code}
                  </span>
                </div>
                <h3 className="text-base font-serif font-bold text-white leading-tight">
                  {selectedNode.name}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePinNode(selectedNode)}
                  className={`p-1.5 border transition-colors ${
                    selectedNode.isPinned
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-600/50'
                      : 'text-stone-400 hover:text-white border-stone-800'
                  }`}
                  title={selectedNode.isPinned ? 'Unpin node position' : 'Pin node position in force graph'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-5 flex-1 text-xs">
              {/* Specialist Role & Vectors */}
              <div>
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider block mb-1">
                  Specialist Vector Profile
                </span>
                <p className="text-stone-300 font-sans leading-relaxed">
                  {selectedNode.specialistRole}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedNode.vectors.map((vec) => (
                    <span
                      key={vec}
                      className="px-2 py-0.5 bg-stone-900 border border-stone-800 font-mono text-[10px] text-stone-400"
                    >
                      {vec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benchmark Score Progress Meter */}
              <div className="p-3 bg-stone-900/80 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-stone-400 text-[11px]">Benchmark Score</span>
                  <span
                    className={`text-sm font-bold ${
                      selectedNode.benchmarkScore >= 95 ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {selectedNode.benchmarkScore.toFixed(1)}%
                  </span>
                </div>
                {/* Visual bar */}
                <div className="w-full h-2 bg-stone-800 rounded-none overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedNode.benchmarkScore >= 95
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    }`}
                    style={{ width: `${Math.min(100, selectedNode.benchmarkScore)}%` }}
                  />
                  {/* Threshold marker at 95% */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                    style={{ left: '95%' }}
                    title="Champion Gate Threshold: 95%"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                  <span>Base: 70.0%</span>
                  <span className="text-red-400">Gate: 95.0%</span>
                  <span>100.0%</span>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-stone-300 font-mono text-[11px]">
                <div className="p-2 bg-stone-900 border border-stone-800/80">
                  <span className="text-stone-500 text-[10px] block">Generation</span>
                  <span className="text-white font-bold">Gen {selectedNode.generation}</span>
                </div>
                <div className="p-2 bg-stone-900 border border-stone-800/80">
                  <span className="text-stone-500 text-[10px] block">Win Rate</span>
                  <span className="text-emerald-400 font-bold">{selectedNode.winRate}%</span>
                </div>
                <div className="p-2 bg-stone-900 border border-stone-800/80">
                  <span className="text-stone-500 text-[10px] block">Hallucination</span>
                  <span className="text-amber-400 font-bold">{selectedNode.hallucinationRate}%</span>
                </div>
                <div className="p-2 bg-stone-900 border border-stone-800/80">
                  <span className="text-stone-500 text-[10px] block">Stability</span>
                  <span className="text-cyan-400 font-bold">{selectedNode.stabilityIndex}%</span>
                </div>
              </div>

              {/* Stage Migration History */}
              <div>
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-wider block mb-2">
                  Evolutionary Stage Path
                </span>
                <div className="space-y-2 border-l border-stone-800 pl-3 ml-1 font-mono text-[11px]">
                  {selectedNode.skill.stageHistory?.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full border border-stone-950"
                        style={{ backgroundColor: STAGE_CONFIG[step.stage]?.color ?? '#fff' }}
                      />
                      <div className="flex items-center justify-between text-stone-400">
                        <span className="capitalize font-bold text-white">{step.stage}</span>
                        <span className="text-[10px]">{step.timestamp}</span>
                      </div>
                      <div className="text-[10px] text-stone-400 font-sans mt-0.5">{step.notes}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Actions Deck */}
              <div className="pt-3 border-t border-stone-800 space-y-2 font-mono">
                {/* 1. Run Adversarial Benchmark Test */}
                <button
                  onClick={() => handleRunTestOnNode(selectedNode)}
                  disabled={activePromotingNodeId === selectedNode.id}
                  className="w-full py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold border border-stone-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Flame
                    className={`w-3.5 h-3.5 text-amber-400 ${
                      activePromotingNodeId === selectedNode.id ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {activePromotingNodeId === selectedNode.id
                      ? 'Executing Test Bench...'
                      : 'Run Adversarial Test Bench (+Score)'}
                  </span>
                </button>

                {/* 2. Direct Stage Promotion if eligible */}
                {selectedNode.stage !== 'champion' && onPromoteSkill && (
                  <button
                    onClick={() => {
                      onPromoteSkill(selectedNode.skill);
                      setSelectedNode((prev) =>
                        prev ? { ...prev, stage: 'champion', isChampion: true, benchmarkScore: Math.max(95.0, prev.benchmarkScore) } : null
                      );
                      simulationRef.current?.alpha(0.5).restart();
                    }}
                    className="w-full py-2 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-600/60 flex items-center justify-center gap-2 transition-all"
                  >
                    <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Promote Direct to Champion Gate</span>
                  </button>
                )}

                {/* 3. Launch Agent Mutation Simulator */}
                {onSimulateMutation && (
                  <button
                    onClick={() => onSimulateMutation(selectedNode.skill)}
                    className="w-full py-2 px-3 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 font-bold border border-purple-600/50 flex items-center justify-center gap-2 transition-all"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Calibrate Trajectory in Simulator</span>
                  </button>
                )}

                {/* 4. Open Evolution History Side Panel */}
                {onOpenEvolutionHistory && (
                  <button
                    onClick={() => onOpenEvolutionHistory(selectedNode.skill)}
                    className="w-full py-2 px-3 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 font-bold border border-purple-600/70 flex items-center justify-center gap-2 transition-all shadow-xs"
                    title="Track mutation epochs & merged parent seeds in side panel"
                  >
                    <GitFork className="w-3.5 h-3.5 text-purple-400" />
                    <span>Evolution History Side Panel</span>
                  </button>
                )}

                {/* 5. Remix / Evolve Skill */}
                {onRemixSkill && (
                  <button
                    onClick={() => onRemixSkill(selectedNode.skill)}
                    className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-stone-400" />
                    <span>Remix Vectors with Parent Seed</span>
                  </button>
                )}

                {/* 6. View Complete Skill Dossier */}
                <button
                  onClick={() => onInspectSkill(selectedNode.skill)}
                  className="w-full py-2 px-3 bg-white text-stone-950 hover:bg-stone-200 font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Skill Dossier Modal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. BOTTOM HUD LEGEND */}
        <div className="absolute bottom-3 left-3 z-30 p-2.5 bg-stone-950/90 border border-stone-800 text-[11px] font-mono text-stone-400 flex flex-wrap items-center gap-4 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-bold text-white">
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Graph Legend:</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Idea (01)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span>Training (02)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Testing (03)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/40" />
              <span className="text-emerald-300 font-bold">Champion (04)</span>
            </div>
          </div>

          <span className="text-stone-700">|</span>

          <div className="flex items-center gap-3 text-stone-500 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-emerald-400" /> Migration Path
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-purple-400" /> Lineage Parentage
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 border-t border-dashed border-blue-400" /> Synergy Mesh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
