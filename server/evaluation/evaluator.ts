import { BenchmarkCase, CaseEvaluation, EvidenceExpectation } from './types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function expectationMatched(output: string, expectation: EvidenceExpectation): boolean {
  const normalized = normalize(output);
  const matchedAnchors = expectation.anchors.filter((anchor) => normalized.includes(normalize(anchor)));
  const ratio = matchedAnchors.length / Math.max(1, expectation.anchors.length);
  return ratio >= 0.5;
}

function constraintMatched(output: string, constraint: string): boolean {
  const n = normalize(output);

  if (constraint.includes('Do not invent an adjustment amount')) {
    return !/\$\s?[0-9]+(?:\.[0-9]+)?\s?(?:b|bn|million|billion)\b/.test(n) || /(?:disclosed|reported|stated|document)/.test(n);
  }

  if (constraint.includes('Do not convert a potential earnings-quality concern')) {
    return !/(?:fraud|illegal|violation confirmed|restatement confirmed)/i.test(output);
  }

  if (constraint.includes('Preserve the disclosed numbers')) {
    return /310%/.test(output) && /186/.test(output);
  }

  if (constraint.includes('Clearly mark unsupported conclusions')) {
    return /(?:does not establish|not established|unproven|not quantified|cannot conclude)/i.test(output);
  }

  if (constraint.includes('Reconcile the figures')) {
    return /142/.test(output) && /138/.test(output) && /4/.test(output) && /(?:restricted cash|escrow)/i.test(output);
  }

  if (constraint.includes('Preserve the $4 million')) {
    return /4/.test(output) && /restricted cash/i.test(output) && /escrow/i.test(output);
  }

  if (constraint.includes('Do not manufacture a missing cash balance')) {
    return !/(?:missing cash balance|unknown cash amount|unreported cash)/i.test(output);
  }

  if (constraint.includes('Use the source document')) {
    return /(?:source|document|filing|footnote|fixture):\/\//i.test(output) || /(?:footnote|filing)/i.test(output);
  }

  if (constraint.includes('Separate disclosed facts')) {
    return /(?:the disclosure|the document|the filing|reported|states|does not establish|unproven)/i.test(output);
  }

  if (constraint.includes('Preserve disclosed dates')) {
    return /2026/.test(output);
  }

  if (constraint.includes('Distinguish facts, analytical interpretation')) {
    return /(?:reported|disclosed|analysis|interpretation|does not establish|unproven)/i.test(output);
  }

  if (constraint.includes('Require source-level evidence')) {
    return /(?:source|footnote|filing|document)/i.test(output);
  }

  if (constraint.includes('Treat ambiguity')) {
    return /(?:ambigu|unreconciled|cannot conclude|does not establish)/i.test(output);
  }

  return true;
}

function citationAccuracy(output: string, sourceUrl?: string): number {
  if (!sourceUrl) return 100;
  const normalized = normalize(output);
  return normalized.includes(normalize(sourceUrl)) ? 100 : 0;
}

export function evaluateCase(
  benchmarkCase: BenchmarkCase,
  outputText: string,
): CaseEvaluation {
  const matchedEvidence = benchmarkCase.expectations
    .filter((expectation) => expectationMatched(outputText, expectation))
    .map((expectation) => expectation.id);

  const missingEvidence = benchmarkCase.expectations
    .filter((expectation) => !expectationMatched(outputText, expectation))
    .map((expectation) => expectation.id);

  const evidenceCoverage = Math.round(
    benchmarkCase.expectations.reduce(
      (total, expectation) =>
        total + (expectationMatched(outputText, expectation) ? expectation.weight * 100 : 0),
      0,
    ),
  );

  const matchedConstraints = benchmarkCase.requiredConstraints.filter((constraint) =>
    constraintMatched(outputText, constraint),
  );
  const missingConstraints = benchmarkCase.requiredConstraints.filter(
    (constraint) => !constraintMatched(outputText, constraint),
  );

  const constraintCompliance =
    benchmarkCase.requiredConstraints.length === 0
      ? 100
      : Math.round((matchedConstraints.length / benchmarkCase.requiredConstraints.length) * 100);

  const hasForbiddenPattern = (benchmarkCase.forbiddenPatterns ?? []).some((pattern) =>
    normalize(outputText).includes(normalize(pattern)),
  );

  const numericAccuracy =
    benchmarkCase.expectations.some((e) => e.id.includes('620') || e.id.includes('balance-'))
      ? /(?:620|186|310|142|138|4)/.test(outputText)
        ? 100
        : 0
      : 100;

  const citationScore = citationAccuracy(outputText, benchmarkCase.document.sourceUrl);

  const score = Number(
    (
      evidenceCoverage * 0.4 +
      constraintCompliance * 0.3 +
      numericAccuracy * 0.2 +
      citationScore * 0.1
    ).toFixed(1),
  );

  const failures: string[] = [];
  if (missingEvidence.length) failures.push(`Missing evidence: ${missingEvidence.join(', ')}`);
  if (missingConstraints.length) failures.push(`Constraint failures: ${missingConstraints.join(' | ')}`);
  if (hasForbiddenPattern) failures.push('Forbidden unsupported claim detected.');
  if (citationScore < 100) failures.push('Source citation missing or incorrect.');

  return {
    caseId: benchmarkCase.id,
    score,
    passed: score >= 95 && !hasForbiddenPattern,
    evidenceCoverage,
    constraintCompliance,
    numericAccuracy,
    citationAccuracy: citationScore,
    failures,
    matchedEvidence,
    missingEvidence,
    matchedConstraints,
    missingConstraints,
    citationIssues: citationScore < 100 ? [benchmarkCase.document.sourceUrl ?? 'missing-source-url'] : [],
  };
}

export function evaluateBenchmark(
  benchmarkId: string,
  skillId: string,
  skillVersion: string,
  model: string,
  outputs: Record<string, string>,
): import('./types').BenchmarkReport {
  const cases = Object.values(outputs).map((outputText) => {
    const benchmarkCase = argumentsBenchmarkCaseById(outputText, benchmarkId);
    return benchmarkCase;
  });

  return {
    benchmarkId,
    skillId,
    skillVersion,
    model,
    executedAt: new Date().toISOString(),
    caseCount: cases.length,
    passedCount: cases.filter((c) => c.passed).length,
    meanScore: Number(
      (cases.reduce((sum, c) => sum + c.score, 0) / Math.max(1, cases.length)).toFixed(1),
    ),
    criticalFailures: cases.filter((c) => c.failures.some((f) => f.includes('Forbidden'))).length,
    cases,
  };
}

function argumentsBenchmarkCaseById(outputText: string, benchmarkId: string): CaseEvaluation {
  // Reserved for a future persisted-run store. Kept out of the scoring path so
  // evaluators stay deterministic and side-effect free.
  throw new Error(
    `evaluateBenchmark requires a case-id keyed result set; call evaluateCase directly for ${benchmarkId} (output length ${outputText.length}).`,
  );
}
