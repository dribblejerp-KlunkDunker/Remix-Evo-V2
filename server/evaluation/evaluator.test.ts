import test from 'node:test';
import assert from 'node:assert/strict';
import { FORENSIC_FOOTNOTE_CASES } from './forensicFootnoteBenchmark';
import { evaluateBenchmark, evaluateCase } from './evaluator';

test('forensic benchmark weights sum to 100%', () => {
  for (const benchmarkCase of FORENSIC_FOOTNOTE_CASES) {
    const total = benchmarkCase.expectations.reduce((sum, e) => sum + e.weight, 0);
    assert.equal(Number(total.toFixed(6)), 1);
  }
});

test('perfect fixture output passes at the Champion gate', () => {
  const benchmarkCase = FORENSIC_FOOTNOTE_CASES[0];
  const output = [
    'The document discloses a supplier finance program involving financial institutions.',
    'The disclosed balance is $620 million.',
    'The filing distinguishes financing activity from ordinary trade-payable activity when assessing operating cash flow.',
    'These are disclosed facts; no unsupported adjustment amount is asserted.',
    'Source: fixture://forensic-footnote/ff-001',
  ].join(' ');

  const result = evaluateCase(benchmarkCase, output);
  assert.equal(result.passed, true);
  assert.equal(result.score, 100);
});

test('unsupported conclusion fails the benchmark', () => {
  const benchmarkCase = FORENSIC_FOOTNOTE_CASES[1];
  const output = [
    'Capitalized internal-use software increased 310% to $186 million.',
    'Useful life changed from 3 years to 7 years.',
    'This proves accounting fraud and an illegal capitalization practice.',
    'Source: fixture://forensic-footnote/ff-002',
  ].join(' ');

  const result = evaluateCase(benchmarkCase, output);
  assert.equal(result.passed, false);
  assert.ok(result.failures.some((failure) => failure.includes('Forbidden')));
});

test('benchmark aggregates one output per case', () => {
  const outputs = Object.fromEntries(
    FORENSIC_FOOTNOTE_CASES.map((benchmarkCase) => [
      benchmarkCase.id,
      `Document: ${benchmarkCase.document.title}. Source: ${benchmarkCase.document.sourceUrl}. ${benchmarkCase.task}`,
    ]),
  );

  const report = evaluateBenchmark(
    'forensic-footnote-v1',
    'skill-champ-01',
    'seed-14',
    'unit-test',
    FORENSIC_FOOTNOTE_CASES,
    outputs,
  );

  assert.equal(report.caseCount, 3);
  assert.equal(report.cases.length, 3);
  assert.ok(report.meanScore >= 0 && report.meanScore <= 100);
});
