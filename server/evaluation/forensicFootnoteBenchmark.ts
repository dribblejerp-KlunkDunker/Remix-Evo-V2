import { BenchmarkCase } from './types';

export const FORENSIC_FOOTNOTE_BENCHMARK_ID = 'forensic-footnote-v1';

export const FORENSIC_FOOTNOTE_CASES: BenchmarkCase[] = [
  {
    id: 'ff-001',
    title: 'Supplier-finance cash-flow reclassification',
    task:
      'Identify the supplier-finance arrangement, quantify the disclosed balance, and state the correct cash-flow treatment. Cite the source document.',
    document: {
      sourceType: 'fixture',
      title: 'Synthetic 10-K Footnote 8 — Supplier Finance Programs',
      filingDate: '2026-02-14',
      sourceUrl: 'fixture://forensic-footnote/ff-001',
      text: [
        'Footnote 8 — Supplier Finance Programs.',
        'As of December 31, 2025, obligations confirmed by participating financial institutions under our supplier finance programs were $620 million.',
        'The programs permit suppliers to receive payment from financial institutions earlier than the standard contractual due date.',
        'We classify the related obligations within accounts payable when the underlying obligation to the supplier remains outstanding.',
        'For analytical purposes, the financing component should be distinguished from ordinary trade-payable activity when assessing operating cash flow.'
      ].join(' '),
    },
    expectations: [
      {
        id: 'supplier-finance',
        description: 'Recognize the disclosed supplier-finance program.',
        anchors: ['supplier finance programs', 'financial institutions'],
        weight: 0.35,
      },
      {
        id: 'balance-620',
        description: 'Report the disclosed balance as $620 million.',
        anchors: ['$620 million', '620 million'],
        weight: 0.35,
      },
      {
        id: 'cashflow-treatment',
        description: 'Distinguish financing activity from ordinary operating activity when analyzing cash flow.',
        anchors: ['operating cash flow', 'financing', 'trade-payable'],
        weight: 0.30,
      },
    ],
    requiredConstraints: [
      'Do not invent an adjustment amount that is not supported by the document.',
      'Use the source document as the authority for the finding.',
      'Separate disclosed facts from analytical interpretation.'
    ],
    forbiddenPatterns: [
      'reclassified $1.1 billion',
      'the filing proves fraud',
    ],
  },
  {
    id: 'ff-002',
    title: 'Capitalized software and useful-life extension',
    task:
      'Determine whether capitalization and amortization disclosures create a potential earnings-quality issue. State only what is supported by the document and identify the relevant figures.',
    document: {
      sourceType: 'fixture',
      title: 'Synthetic 10-Q Footnote 4 — Internal-Use Software',
      filingDate: '2026-05-03',
      sourceUrl: 'fixture://forensic-footnote/ff-002',
      text: [
        'Footnote 4 — Internal-Use Software Costs.',
        'Capitalized internal-use software additions increased 310% year over year to $186 million.',
        'Management extended the weighted-average estimated useful life for certain software from 3 years to 7 years.',
        'The company states that the change reflects longer expected economic utility of the affected platforms.',
        'The disclosure does not quantify a restatement, accounting violation, or normalized operating-margin adjustment.'
      ].join(' '),
    },
    expectations: [
      {
        id: 'capitalization-growth',
        description: 'Identify the 310% year-over-year increase to $186 million.',
        anchors: ['310%', '$186 million', '186 million'],
        weight: 0.40,
      },
      {
        id: 'useful-life',
        description: 'Identify the change from 3 years to 7 years.',
        anchors: ['3 years', '7 years'],
        weight: 0.30,
      },
      {
        id: 'epistemic-boundary',
        description: 'State that the disclosure itself does not establish a restatement, violation, or quantified margin adjustment.',
        anchors: ['does not quantify', 'not establish', 'does not establish'],
        weight: 0.30,
      },
    ],
    requiredConstraints: [
      'Do not convert a potential earnings-quality concern into a proven accounting violation.',
      'Preserve the disclosed numbers exactly.',
      'Clearly mark unsupported conclusions as unknown or unproven.'
    ],
    forbiddenPatterns: [
      'accounting fraud',
      'illegal capitalization',
      'restatement confirmed',
    ],
  },
  {
    id: 'ff-003',
    title: 'Restricted cash reconciliation',
    task:
      'Reconcile the apparent cash discrepancy between the summary and the balance sheet using the footnote disclosure.',
    document: {
      sourceType: 'fixture',
      title: 'Synthetic 10-K Footnote 12 — Cash and Restricted Cash',
      filingDate: '2026-01-29',
      sourceUrl: 'fixture://forensic-footnote/ff-003',
      text: [
        'Footnote 12 — Cash and Restricted Cash.',
        'The earnings release summary reports total cash and cash equivalents of $142 million.',
        'The consolidated balance sheet reports cash and cash equivalents of $138 million.',
        'Of the difference, $4 million is restricted cash held in escrow and is excluded from cash and cash equivalents on the consolidated balance sheet.',
        'Accordingly, the $142 million summary figure includes restricted cash while the $138 million balance-sheet figure does not.'
      ].join(' '),
    },
    expectations: [
      {
        id: 'gross-cash',
        description: 'Identify the $142 million summary figure.',
        anchors: ['$142 million', '142 million'],
        weight: 0.25,
      },
      {
        id: 'unrestricted-cash',
        description: 'Identify the $138 million balance-sheet figure.',
        anchors: ['$138 million', '138 million'],
        weight: 0.25,
      },
      {
        id: 'restricted-cash',
        description: 'Identify $4 million of restricted cash held in escrow.',
        anchors: ['$4 million', '4 million', 'restricted cash', 'escrow'],
        weight: 0.30,
      },
      {
        id: 'reconciliation',
        description: 'Explain that the figures differ because the summary includes restricted cash while the balance sheet excludes it.',
        anchors: ['includes restricted cash', 'does not', 'excluded'],
        weight: 0.20,
      },
    ],
    requiredConstraints: [
      'Reconcile the figures rather than treating them as contradictory facts.',
      'Preserve the $4 million restricted-cash explanation.',
      'Do not manufacture a missing cash balance.'
    ],
    forbiddenPatterns: [
      'cash is missing',
      'the company misstated cash',
    ],
  },
];

export const FORENSIC_FOOTNOTE_SKILL = {
  id: 'skill-champ-01',
  version: 'seed-14',
  name: 'Forensic Footnote Deconstructor',
  systemDirective:
    'Operate as an adversarial forensic accountant. Separate disclosed facts from inference and refuse unsupported conclusions.',
  reasoningFramework:
    'Extract the disclosure, reconcile reported figures, identify the accounting treatment, and state the narrowest defensible conclusion.',
  adversarialConstraint:
    'Treat ambiguity as an unreconciled variance until the source resolves it.',
  strictRules: [
    'Require source-level evidence for every material assertion.',
    'Do not invent adjustment amounts.',
    'Distinguish facts, analytical interpretation, and unproven allegations.',
    'Preserve disclosed dates and numerical figures exactly.'
  ],
};
