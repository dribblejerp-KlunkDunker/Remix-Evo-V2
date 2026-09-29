import React, { useState } from 'react';
import { AgentSkill, VectorCategory } from '../../types/skills';
import { X, Sparkles, GitFork, Loader2, ArrowRight } from 'lucide-react';

interface RemixSkillModalProps {
  initialParentSkill?: AgentSkill | null;
  onClose: () => void;
  onSkillCreated: (newSkill: AgentSkill) => void;
}

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

export const RemixSkillModal: React.FC<RemixSkillModalProps> = ({
  initialParentSkill,
  onClose,
  onSkillCreated
}) => {
  const [name, setName] = useState(
    initialParentSkill ? `Adaptive ${initialParentSkill.name} V2` : ''
  );
  const [selectedVectors, setSelectedVectors] = useState<VectorCategory[]>(
    initialParentSkill ? [...initialParentSkill.vectors] : ['Behavioral Psychology', 'Game Design & Incentives']
  );
  const [hypothesis, setHypothesis] = useState(
    initialParentSkill
      ? `Evolve ${initialParentSkill.name} with stricter boundary constraints and higher adversarial resilience against multi-quarter disclosure restatements.`
      : ''
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const toggleVector = (vector: VectorCategory) => {
    if (selectedVectors.includes(vector)) {
      if (selectedVectors.length > 1) {
        setSelectedVectors(selectedVectors.filter((v) => v !== vector));
      }
    } else {
      setSelectedVectors([...selectedVectors, vector]);
    }
  };

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !hypothesis.trim()) return;

    setIsSynthesizing(true);
    await new Promise((r) => setTimeout(r, 1200));

    const idNum = Math.floor(Math.random() * 900) + 100;
    const initialScore = Number((74 + Math.random() * 8).toFixed(1));

    const newSkill: AgentSkill = {
      id: `skill-idea-${idNum}`,
      code: `SKILL-IDEA-${idNum}`,
      name: name.trim(),
      stage: 'idea',
      tagline: `Autonomous cross-vector remix synthesizing ${selectedVectors.slice(0, 2).join(' & ')}`,
      description: hypothesis.trim(),
      vectors: selectedVectors,
      generation: initialParentSkill ? initialParentSkill.generation + 1 : 1,
      benchmarkScore: initialScore,
      threshold: 95.0,
      winRate: Number((initialScore - 2).toFixed(1)),
      stabilityIndex: 82.5,
      hallucinationRate: 1.0,
      strictRules: [
        'RULE 1: Verify all claims against cross-sector empirical historical baselines.',
        'RULE 2: Output quantitative confidence intervals with explicit degrees of freedom.',
        'RULE 3: Zero speculation—strictly isolate unknown variables.'
      ],
      specialistRole: `Autonomous ${selectedVectors[0]} & ${selectedVectors[1] || 'Systems'} Research Specialist`,
      promptMatrix: {
        systemDirective: `Act as a specialist research agent trained on ${selectedVectors.join(', ')}.`,
        reasoningFramework: 'Cross-vector synthesis deduction and constraint boundary enforcement.',
        adversarialConstraint: 'Do not extrapolate beyond mathematically verified boundaries.'
      },
      autonomousThought: `Initializing seed evolution loop; testing prompt mutation vectors across ${selectedVectors.join(' × ')}...`,
      activeTestBench: {
        name: `${selectedVectors[0]} Stress Lab`,
        currentVector: 'Cross-Domain Seed Testing',
        totalRunsToday: 1,
        consecutivePasses: 1,
        stressVector: 'Adversarial edge condition testing'
      },
      testCases: [
        {
          id: `tc-idea-${idNum}`,
          title: `Initial Seed Benchmark for ${name}`,
          realWorldUseCase: `Validating initial hypothesis under real-world ${selectedVectors[0]} use cases.`,
          inputScenario: hypothesis,
          expectedConstraints: ['Verify empirical bounds', 'Rule adherence'],
          targetThreshold: 95.0,
          lastScore: initialScore,
          status: 'testing',
          testedAt: 'Just now'
        }
      ],
      evolutionLineage: {
        parents: initialParentSkill ? [initialParentSkill.code] : ['SYNTHETIC-GENESIS-SEED'],
        remixVectorCombo: selectedVectors.join(' × '),
        generationEpoch: `Epoch-Seed-${idNum}`,
        survivalIterations: 1,
        mutationType: 'Autonomous Cross-Vector Seed Generation'
      },
      stageHistory: [
        {
          stage: 'idea',
          timestamp: 'Just now',
          score: initialScore,
          notes: 'Remixed and seeded into the Evolution Matrix. Entering Idea stage.'
        }
      ],
      createdAt: new Date().toISOString().split('T')[0],
      lastEvaluatedAt: 'Just now'
    };

    setIsSynthesizing(false);
    onSkillCreated(newSkill);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-2xl flex flex-col shadow-2xl relative">
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white">
                Remix & Evolve New Agent Skill
              </h3>
              <p className="text-xs text-stone-400 font-sans">
                Cross-breed specialist domains to seed a new candidate skill into the 'Idea' state.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSynthesize} className="p-6 space-y-5 text-xs font-mono">
          <div>
            <label className="block uppercase text-stone-400 mb-1">
              Candidate Skill Name:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Asymmetric Hostile Takeover Liquidity Defense"
              required
              className="w-full bg-stone-950 border border-stone-800 p-2.5 text-white placeholder-stone-600 focus:outline-none focus:border-stone-600"
            />
          </div>

          <div>
            <label className="block uppercase text-stone-400 mb-2">
              Select Vector Cross-Pollination (Choose 2 or more):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_VECTORS.map((vec) => {
                const isSelected = selectedVectors.includes(vec);
                return (
                  <button
                    key={vec}
                    type="button"
                    onClick={() => toggleVector(vec)}
                    className={`p-2.5 text-left border text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-stone-800 border-amber-400/80 text-white'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span>{vec}</span>
                    {isSelected && <span className="text-amber-400 font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block uppercase text-stone-400 mb-1">
              Hypothesis & Real-World Use Case Directive:
            </label>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="Describe the real-world challenge, statistical edge, or psychological manipulation vectors this agent skill is designed to solve..."
              rows={3}
              required
              className="w-full bg-stone-950 border border-stone-800 p-2.5 text-white placeholder-stone-600 focus:outline-none focus:border-stone-600"
            />
          </div>

          <div className="p-3 bg-stone-950 border border-stone-800 text-stone-400 text-[11px] leading-relaxed">
            <span className="text-white font-bold">Evolution Rule:</span> Newly synthesized skills enter at the <span className="text-amber-400 font-semibold">'Idea'</span> state. Autonomous agents will train, test, and benchmark the skill continuously until it achieves $\ge 95.0\%$ to become a Champion.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSynthesizing || !name.trim() || !hypothesis.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-white text-stone-950 hover:bg-stone-200 disabled:opacity-50 font-bold transition-colors"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Vectors...</span>
                </>
              ) : (
                <>
                  <GitFork className="w-4 h-4" />
                  <span>Seed Into Idea Stage</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
