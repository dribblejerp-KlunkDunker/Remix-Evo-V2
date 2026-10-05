/**
 * The lineage graph.
 *
 * Nodes are skills, edges are recorded ancestry: a mutation edge from parent to
 * child, or two crossover edges from both parents. This is a directed acyclic
 * graph — a child's generation is always above its parents' — so it lays out in
 * generation bands rather than needing a force simulation.
 *
 * Everything here comes from `evolutionLineage.parents` and `parentDetails`,
 * which the engine writes at the moment of mutation or crossover. Nothing is
 * inferred from similarity. Two skills that look alike but share no recorded
 * ancestor have no edge, because they have no ancestry.
 *
 * Retired ancestors are included as nodes, marked retired. They are the reason
 * a lineage exists, and dropping them would leave living skills as orphans whose
 * recorded parentage points at nothing.
 */

import type { AgentSkill } from '../../src/types/skills.ts';
import type { SkillRuntime } from './store.ts';

export type LineageEdgeKind = 'mutation' | 'crossover';

export interface LineageNode {
  skillId: string;
  code: string;
  name: string;
  stage: string;
  generation: number;
  benchmarkScore: number;
  vector: string;
  vectors: string[];
  retired: boolean;
  retiredReason?: string;
  /** Number of recorded children. */
  descendantCount: number;
  /** Depth from the earliest ancestor in this component; drives the layout band. */
  depth: number;
}

export interface LineageEdge {
  id: string;
  sourceSkillId: string;
  sourceCode: string;
  targetSkillId: string;
  targetCode: string;
  kind: LineageEdgeKind;
  /** For crossover, this parent's share of the child genome. Null for mutation. */
  contributionWeight: number | null;
  /** Measured textual distance between parent and child genome, if recorded. */
  mutationPercentage: number | null;
  /** Score change attributed to the step that produced the child, if recorded. */
  performanceDelta: number | null;
  mutationType: string;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
  /** Generation bands present, ascending — the layout axis. */
  generations: number[];
  maxDepth: number;
  /** Skills with no recorded parent. Roots of the forest. */
  rootCount: number;
  /** Nodes with no edges at all. A population that has never bred is all orphans. */
  orphanCount: number;
}

export function buildLineageGraph(
  skills: AgentSkill[],
  runtime: Map<string, SkillRuntime>,
): LineageGraph {
  const byCode = new Map<string, AgentSkill>();
  for (const s of skills) byCode.set(s.code, s);

  const nodes = new Map<string, LineageNode>();
  const edges: LineageEdge[] = [];
  const childCount = new Map<string, number>();

  const ensureNode = (skill: AgentSkill): LineageNode => {
    const existing = nodes.get(skill.id);
    if (existing) return existing;
    const rt = runtime.get(skill.id);
    const node: LineageNode = {
      skillId: skill.id,
      code: skill.code,
      name: skill.name,
      stage: skill.stage,
      generation: skill.generation,
      benchmarkScore: skill.benchmarkScore,
      vector: skill.vectors[0] ?? 'Systems Engineering',
      vectors: skill.vectors,
      retired: !!rt?.retiredAt,
      retiredReason: rt?.retiredReason,
      descendantCount: 0,
      depth: 0,
    };
    nodes.set(skill.id, node);
    return node;
  };

  for (const skill of skills) ensureNode(skill);

  for (const child of skills) {
    const lineage = child.evolutionLineage;
    const parentCodes = lineage.parents ?? [];
    if (parentCodes.length === 0) continue;

    const kind: LineageEdgeKind = parentCodes.length > 1 ? 'crossover' : 'mutation';

    // The most recent iteration describes the step that produced this child.
    const lastIteration = (lineage.iterations ?? []).at(-1);

    for (const parentCode of parentCodes) {
      const parent = byCode.get(parentCode);
      // A parent code with no surviving record cannot be drawn. Inventing a
      // placeholder node would put a skill on screen that never existed.
      if (!parent || parent.id === child.id) continue;

      ensureNode(parent);
      const detail = (lineage.parentDetails ?? []).find((p) => p.code === parentCode);

      edges.push({
        id: `${parent.id}->${child.id}`,
        sourceSkillId: parent.id,
        sourceCode: parent.code,
        targetSkillId: child.id,
        targetCode: child.code,
        kind,
        contributionWeight: kind === 'crossover' ? detail?.contributionWeight ?? null : null,
        mutationPercentage: lastIteration?.mutationPercentage ?? null,
        performanceDelta: lastIteration?.performanceDelta ?? null,
        mutationType: lineage.mutationType || (kind === 'crossover' ? 'Crossover' : 'Mutation'),
      });

      childCount.set(parent.id, (childCount.get(parent.id) ?? 0) + 1);
    }
  }

  for (const [parentId, count] of childCount) {
    const node = nodes.get(parentId);
    if (node) node.descendantCount = count;
  }

  const nodeList = [...nodes.values()];
  assignDepths(nodeList, edges);

  const connected = new Set<string>();
  for (const e of edges) {
    connected.add(e.sourceSkillId);
    connected.add(e.targetSkillId);
  }
  const incoming = new Set(edges.map((e) => e.targetSkillId));

  return {
    nodes: nodeList,
    edges,
    generations: [...new Set(nodeList.map((n) => n.generation))].sort((a, b) => a - b),
    maxDepth: nodeList.reduce((m, n) => Math.max(m, n.depth), 0),
    rootCount: nodeList.filter((n) => !incoming.has(n.skillId)).length,
    orphanCount: nodeList.filter((n) => !connected.has(n.skillId)).length,
  };
}

/**
 * Longest-path depth from any root.
 *
 * Generation number alone is not a usable layout axis: a crossover child takes
 * max(parent generations) + 1, so two nodes can share a generation while sitting
 * at different distances from their roots, and edges would render flat or
 * backwards. Depth is computed from the edges themselves.
 *
 * Iterative rather than recursive, with a visit cap, so a malformed cycle in
 * stored data cannot hang the server.
 */
function assignDepths(nodes: LineageNode[], edges: LineageEdge[]): void {
  const childrenOf = new Map<string, string[]>();
  const indegree = new Map<string, number>();
  for (const n of nodes) indegree.set(n.skillId, 0);
  for (const e of edges) {
    childrenOf.set(e.sourceSkillId, [...(childrenOf.get(e.sourceSkillId) ?? []), e.targetSkillId]);
    indegree.set(e.targetSkillId, (indegree.get(e.targetSkillId) ?? 0) + 1);
  }

  const byId = new Map(nodes.map((n) => [n.skillId, n]));
  const queue = nodes.filter((n) => (indegree.get(n.skillId) ?? 0) === 0).map((n) => n.skillId);
  for (const id of queue) byId.get(id)!.depth = 0;

  let processed = 0;
  const cap = nodes.length + edges.length + 1;

  while (queue.length > 0 && processed < cap) {
    const id = queue.shift()!;
    processed++;
    const parentDepth = byId.get(id)!.depth;
    for (const childId of childrenOf.get(id) ?? []) {
      const child = byId.get(childId);
      if (!child) continue;
      child.depth = Math.max(child.depth, parentDepth + 1);
      const remaining = (indegree.get(childId) ?? 1) - 1;
      indegree.set(childId, remaining);
      if (remaining === 0) queue.push(childId);
    }
  }
}
