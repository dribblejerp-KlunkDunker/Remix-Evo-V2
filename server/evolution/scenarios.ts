/**
 * The scenario bank a skill is evaluated against.
 *
 * The UI's SCENARIO_DEFINITIONS carry names and difficulty but no actual test
 * input, so this file supplies the executable half: a concrete adversarial
 * prompt plus the constraints a correct answer has to satisfy.
 *
 * The train/holdout split matters more than anything else here. A skill is
 * refined against training scenarios and promoted on held-out ones it has never
 * been tuned against. Without that separation, "95% benchmark score" just means
 * the skill memorised its own test set.
 */

import type { ScenarioDefinition, VectorCategory } from '../../src/types/skills.ts';

export interface ExecutableScenario extends ScenarioDefinition {
  /** The adversarial input handed to the skill under test. */
  inputScenario: string;
  /** Real-world grounding, surfaced in the UI. */
  realWorldUseCase: string;
  /** What a correct response must do. The judge scores against these. */
  expectedConstraints: string[];
  /** Traps a weak skill will fall into. Hitting one is a hallucination flag. */
  knownFailureModes: string[];
  /** Vectors this scenario exercises, used for niche-aware scenario selection. */
  vectors: VectorCategory[];
}

export const SCENARIO_BANK: ExecutableScenario[] = [
  {
    id: 'scen-01',
    name: 'Reverse Factoring & Disguised Working Capital Debt',
    shortName: 'Reverse Factoring',
    category: 'Financial Forensics',
    description:
      'Third-party bank supplier financing concealed inside trade payables to artificially inflate operating cash flow before earnings.',
    adversarialDifficulty: 'Extreme',
    vectors: ['Forensic Accounting', 'Manipulation & Deception', 'Statistics & Stochastic'],
    realWorldUseCase:
      'Spotting Carillion / Greensill-style supplier finance facilities disguised as standard trade payables.',
    inputScenario:
      'A distribution company reports operating cash flow of $4.2B, up 28% year over year, while COGS is flat. ' +
      'Days payable outstanding moved from 48 to 91. Footnote 8 reads: "The Company participates in certain bank ' +
      'financing programs for qualifying trade vendors. Amounts under these programs are classified within accounts ' +
      'payable." No quantification is given and the recourse terms are not described. Accounts payable rose $840M. ' +
      'Free cash flow is presented as +$1.1B. Assess.',
    expectedConstraints: [
      'Identify the footnote 8 program as supplier finance / reverse factoring rather than ordinary trade credit',
      'Flag the absence of quantification and recourse terms as a disclosure deficiency, not as evidence of size',
      'Argue that some portion of the AP increase should be reclassified from operating to financing cash flow',
      'State explicitly that the exact reclassification amount cannot be determined from the disclosure given',
      'Connect the DPO expansion to the cash flow increase rather than treating them as independent facts',
    ],
    knownFailureModes: [
      'Inventing a specific reclassification figure that the input does not support',
      'Treating the DPO expansion as ordinary working capital efficiency',
      'Asserting the company has committed fraud rather than identifying a disclosure and classification risk',
    ],
  },
  {
    id: 'scen-02',
    name: 'Q&A Guidance Cut Deflection & Linguistic Hedging',
    shortName: 'Q&A Deflection',
    category: 'Behavioral & Linguistic',
    description:
      'Evasive responses to direct margin compression queries, redirected into multi-year narrative.',
    adversarialDifficulty: 'High',
    vectors: ['Behavioral Psychology', 'Manipulation & Deception'],
    realWorldUseCase:
      'Earnings call transcript analysis where the answer given is not the answer to the question asked.',
    inputScenario:
      'Analyst: "Gross margin guidance came down 340 basis points. Can you break down how much of that is pricing ' +
      'versus input cost?" CEO: "What I would say is, we feel really good about where we are in this journey. The ' +
      'team has done phenomenal work and when you look at the multi-year opportunity in front of us — and Sarah can ' +
      'add to this — the investments we are making today are exactly the right investments. We are not going to ' +
      'manage this business quarter to quarter." CFO Sarah does not add anything. The next analyst is called. ' +
      'Classify what happened.',
    expectedConstraints: [
      'State that the specific pricing-versus-input-cost split was not answered',
      'Identify the redirection pattern: specific near-term metric reframed as long-term narrative',
      'Note the deferral to the CFO that was not taken up as a distinct signal',
      'Distinguish evasion as an observable conversational fact from intent, which is not observable here',
      'Avoid claiming the margin decline is necessarily worse than disclosed',
    ],
    knownFailureModes: [
      'Scoring the answer as responsive because it was fluent and confident',
      'Asserting the CEO is concealing a specific known number',
      'Producing a sentiment label with no reference to the unanswered question',
    ],
  },
  {
    id: 'scen-03',
    name: 'Prime Brokerage Margin Sweeps & Liquidity Spiral',
    shortName: 'Margin Sweeps',
    category: 'Game Theory & Liquidity',
    description:
      'Cascading collateral haircut shocks producing non-cooperative unilateral fire-sale exits.',
    adversarialDifficulty: 'Extreme',
    vectors: ['Game Design & Incentives', 'Advanced Math', 'Systems Engineering'],
    realWorldUseCase: 'Archegos-style concentrated swap unwind across multiple prime brokers.',
    inputScenario:
      'A family office holds concentrated total return swaps across five prime brokers. No broker can see the others\' ' +
      'exposure. Collateral is 15% initial margin. The underlying drops 11% in one session. Broker A privately offers ' +
      'the client 48 hours to post; Broker B calls immediately and begins block-selling at the close. Model the ' +
      'equilibrium and state what Broker A should do, given it cannot observe B\'s action until after the tape prints.',
    expectedConstraints: [
      'Frame this as a prisoner\'s-dilemma / first-mover problem under incomplete information',
      'Conclude that unilateral immediate liquidation dominates for each broker individually',
      'Note that the collectively optimal outcome (coordinated orderly unwind) is unreachable without a coordination mechanism',
      'Identify that the 15% margin is sized for idiosyncratic not correlated-unwind risk',
      'Acknowledge that Broker A\'s optimal action depends on an unobservable, and reason about it as a probability rather than asserting certainty',
    ],
    knownFailureModes: [
      'Recommending coordination without addressing that brokers cannot legally or practically share positions in time',
      'Treating this as a pure credit-risk question and ignoring the strategic interaction',
      'Producing a numerical equilibrium with invented payoff values presented as derived',
    ],
  },
  {
    id: 'scen-04',
    name: 'Sub-Tier Packaging Substrate Supply Chokepoint',
    shortName: 'Supply Chokepoints',
    category: 'Network Topology',
    description:
      'Single-source tier-3 facility shutdown in a seismic belt propagating through a semiconductor supply graph.',
    adversarialDifficulty: 'High',
    vectors: ['Systems Engineering', 'Engineering', 'Statistics & Stochastic'],
    realWorldUseCase: 'ABF substrate concentration risk in advanced packaging supply chains.',
    inputScenario:
      'A fabless designer lists three qualified assembly partners in its 10-K and describes its supply chain as ' +
      '"diversified across multiple vendors". All three assembly partners source build-up film substrate from two ' +
      'chemical suppliers, both with primary production in the same seismic zone. Qualification of a new substrate ' +
      'source takes 9-14 months. Assess the concentration risk and explain why the 10-K language is not wrong but is ' +
      'not informative.',
    expectedConstraints: [
      'Identify that diversification at tier 1 does not imply diversification at tier 3',
      'Locate the true chokepoint at the substrate supplier layer, not the assembly layer',
      'Incorporate the qualification lead time as the thing that converts a disruption into a revenue impact',
      'Explain the geographic correlation between the two nominally independent suppliers',
      'Distinguish a technically accurate disclosure from an informative one without alleging misstatement',
    ],
    knownFailureModes: [
      'Accepting "three qualified partners" as evidence of resilience',
      'Asserting a specific revenue-at-risk dollar figure not derivable from the input',
      'Claiming the 10-K statement is false',
    ],
  },
  {
    id: 'scen-05',
    name: 'Fat-Tailed Jump Diffusion Sudden FX Depeg',
    shortName: 'FX Jump-Diffusion',
    category: 'Stochastic Calculus',
    description: 'Non-Gaussian devaluation in a three-hour window invalidating normal-VaR parameters.',
    adversarialDifficulty: 'Extreme',
    vectors: ['Advanced Math', 'Statistics & Stochastic'],
    realWorldUseCase: 'CHF depeg 2015; risk models calibrated on a managed-float regime.',
    inputScenario:
      'A book is hedged using 99% one-day VaR of $40M, calibrated on five years of daily returns of a managed-float ' +
      'currency whose realised daily volatility has been 0.3%. The peg is abandoned and the currency moves 25% in ' +
      'three hours. Explain precisely why the VaR number failed, what it was and was not claiming, and what a ' +
      'replacement framework needs. Do not simply say "fat tails".',
    expectedConstraints: [
      'State that VaR is a quantile, not a bound, and says nothing about loss magnitude beyond the quantile',
      'Identify that the calibration window contains no regime change, so the estimated distribution excludes the event class',
      'Name the regime-switching or jump component as structurally absent rather than merely underweighted',
      'Propose expected shortfall, jump-diffusion, or scenario-based stress as a replacement and state its limitation too',
      'Note that a peg makes historical volatility an actively misleading estimator, not just a noisy one',
    ],
    knownFailureModes: [
      'Answering "fat tails" or "black swan" without mechanism',
      'Claiming VaR was miscalculated rather than correctly calculated and wrongly interpreted',
      'Recommending a longer lookback window, which would not have contained the event either',
    ],
  },
  {
    id: 'scen-06',
    name: 'Investor Deck Truncated Y-Axis Graphic Deception',
    shortName: 'Visual Chart Scaling',
    category: 'Multi-Modal Vision',
    description: 'Non-zero origins and truncated axes flattening a material margin contraction.',
    adversarialDifficulty: 'Moderate',
    vectors: ['Manipulation & Deception', 'Behavioral Psychology', 'Statistics & Stochastic'],
    realWorldUseCase: 'Investor presentation review where the chart and the footnote disagree.',
    inputScenario:
      'A slide titled "Stable Margin Profile" shows four bars of near-identical height. The y-axis runs from 61.5% ' +
      'to 63.0% with no axis break indicated. The underlying values are 62.8%, 62.4%, 61.9%, 61.6%. A footnote in ' +
      '6pt type reads "Non-GAAP; excludes stock-based compensation and restructuring." Evaluate the slide.',
    expectedConstraints: [
      'Compute the actual decline (120 basis points) and characterise it against the visual impression',
      'Identify the truncated axis and absent axis break as the specific mechanism',
      'Separately flag the non-GAAP exclusions as a second, independent issue from the axis scaling',
      'Avoid asserting that the underlying numbers are wrong — they are disclosed and accurate',
      'State what the slide would look like on a zero-based axis',
    ],
    knownFailureModes: [
      'Calling the chart fraudulent rather than misleading in presentation',
      'Missing the non-GAAP footnote entirely by focusing only on the axis',
      'Reporting the decline in percent rather than basis points and garbling the magnitude',
    ],
  },
  {
    id: 'scen-07',
    name: 'Selective Reporting & P-Hacking Replication Audit',
    shortName: 'P-Hacking Audit',
    category: 'Empirical Science',
    description: 'Supplementary tables where one of many permutations reached significance.',
    adversarialDifficulty: 'High',
    vectors: ['Empirical Science', 'Statistics & Stochastic', 'Advanced Math'],
    realWorldUseCase: 'Pre-registration auditing of a published quantitative finding.',
    inputScenario:
      'A paper reports a primary finding at p = 0.043. Supplementary Table S4 lists 15 outcome-metric permutations ' +
      'tested; the reported one is the only one below 0.05. The pre-registration lists a different primary outcome. ' +
      'The authors state the change was made "to better capture the construct of interest". Sample size is 84. ' +
      'Evaluate the strength of the evidence.',
    expectedConstraints: [
      'Apply a multiple-comparisons correction and show that p = 0.043 does not survive it',
      'Identify the outcome switch relative to pre-registration as the more serious issue than the p-value itself',
      'Note that the stated justification is unfalsifiable as written',
      'Comment on n = 84 in terms of power for the effect size implied, rather than calling it simply "small"',
      'Conclude the finding is unsupported as presented without asserting the underlying effect is absent',
    ],
    knownFailureModes: [
      'Rejecting the paper on p-value grounds alone while missing the outcome switch',
      'Applying Bonferroni without stating what family of tests is being corrected over',
      'Concluding the effect does not exist, which the evidence does not establish',
    ],
  },
  {
    id: 'scen-08',
    name: 'Insider Rule 10b5-1 Plan Timing Anomaly',
    shortName: '10b5-1 Timing',
    category: 'Financial Forensics',
    description: 'Trading plan adoption and modification clustered around undisclosed material events.',
    adversarialDifficulty: 'High',
    vectors: ['Forensic Accounting', 'Statistics & Stochastic', 'Manipulation & Deception'],
    realWorldUseCase: 'Form 4 pattern analysis against 8-K timing.',
    inputScenario:
      'Three officers adopt 10b5-1 plans within a nine-day window. The cooling-off period elapses and sales begin. ' +
      'Nineteen days after the first sale, an 8-K discloses the loss of a customer representing 14% of revenue. The ' +
      'plans were adopted 104 days before that 8-K. Company policy requires plans be adopted only in open windows, ' +
      'and the adoption window was open. Assess.',
    expectedConstraints: [
      'Acknowledge that adoption occurred in a permitted window and the cooling-off period was observed',
      'Identify the clustering of three officers in nine days as the anomaly, not any single adoption',
      'State that the relevant unknown is when the customer loss became known internally, which the input does not provide',
      'Frame the conclusion as a pattern warranting inquiry rather than a violation',
      'Avoid inferring possession of material non-public information purely from subsequent price movement',
    ],
    knownFailureModes: [
      'Declaring insider trading based on timing alone',
      'Dismissing the pattern because the plans were technically compliant',
      'Ignoring the nine-day clustering and analysing each officer in isolation',
    ],
  },
  {
    id: 'scen-09',
    name: 'Incentive Misalignment in Vesting Cliff Design',
    shortName: 'Vesting Cliff Gaming',
    category: 'Game Theory & Incentives',
    description: 'Compensation structure producing predictable behaviour at period boundaries.',
    adversarialDifficulty: 'Moderate',
    vectors: ['Game Design & Incentives', 'Behavioral Psychology', 'Advanced Math'],
    realWorldUseCase: 'Proxy statement analysis of PSU targets against reported results.',
    inputScenario:
      'Performance share units vest fully at 3.0% organic revenue growth and pay zero below it. Reported organic ' +
      'growth for the measurement year is 3.04%. Q4 saw an unusual $180M of revenue recognised from a change in ' +
      'distributor shipping terms, disclosed in the 10-K. Absent that change, growth would have been 2.6%. The ' +
      'accounting for the change is not disputed. Evaluate the design and the outcome.',
    expectedConstraints: [
      'Identify the cliff (binary payoff at a threshold) as the structural problem, independent of this year\'s outcome',
      'Compute the counterfactual growth rate and place it relative to the threshold',
      'State that correct accounting and incentive-driven timing are not mutually exclusive',
      'Recommend a graduated payoff curve and explain why it removes the boundary incentive',
      'Refrain from asserting the shipping-terms change was made in order to hit the target',
    ],
    knownFailureModes: [
      'Concluding manipulation occurred because the number landed just above the threshold',
      'Defending the outcome on the grounds that the accounting was proper, which is a separate question',
      'Missing that the design flaw exists regardless of whether it was exploited this year',
    ],
  },
  {
    id: 'scen-10',
    name: 'Sensor Fusion Failure Under Correlated Degradation',
    shortName: 'Sensor Fusion',
    category: 'Systems Engineering',
    description: 'Redundant subsystems failing together due to a shared environmental cause.',
    adversarialDifficulty: 'High',
    vectors: ['Systems Engineering', 'Engineering', 'Statistics & Stochastic'],
    realWorldUseCase: 'Reliability analysis where redundancy calculations assume independence.',
    inputScenario:
      'A system fuses three independent sensor channels. Each has a measured failure rate of 1e-4 per hour. The ' +
      'design document computes system failure probability as 1e-12 per hour. All three channels are mounted on the ' +
      'same bulkhead and share a thermal path from a single heat exchanger. Field data shows two-channel simultaneous ' +
      'degradation events at roughly 3e-6 per hour. Explain the gap and give the corrected model.',
    expectedConstraints: [
      'Identify that 1e-12 assumes statistical independence which the shared thermal path violates',
      'Name the common-cause failure mode explicitly',
      'Show that the observed 3e-6 two-channel rate is six orders of magnitude above the independence prediction',
      'Propose a beta-factor or explicit common-cause term rather than just "add margin"',
      'State that physical separation, not additional channels, is the fix implied by the mechanism',
    ],
    knownFailureModes: [
      'Recommending a fourth redundant channel on the same bulkhead',
      'Attributing the gap to a miscalculated per-channel failure rate',
      'Accepting the 1e-12 figure and treating the field data as anomalous',
    ],
  },
  {
    id: 'scen-11',
    name: 'Survivorship & Backfill Bias in a Fund Performance Study',
    shortName: 'Survivorship Bias',
    category: 'Empirical Science',
    description: 'A database of live funds reports alpha that the dead funds would have erased.',
    adversarialDifficulty: 'High',
    vectors: ['Empirical Science', 'Statistics & Stochastic'],
    realWorldUseCase: 'Evaluating manager-performance research built on commercial hedge fund databases.',
    inputScenario:
      'A study reports that hedge funds generated 9.1% annual alpha over 2010-2024. Data come from a commercial ' +
      'database of funds that currently report. Funds enter the database voluntarily and may add their prior ' +
      'history when they join. The methods section notes that 41% of funds in the database joined after 2018. ' +
      'Funds that closed are removed. Assess the alpha estimate.',
    expectedConstraints: [
      'Identify survivorship bias from removing closed funds, which biases returns upward',
      'Identify backfill bias from funds adding prior history at entry, a separate upward bias',
      'Note that voluntary reporting adds selection: funds report when results are good',
      'State that the size of the corrected alpha cannot be determined without dead-fund data',
      'Avoid concluding that true alpha is zero or negative',
    ],
    knownFailureModes: [
      'Treating survivorship and backfill bias as the same effect',
      'Inventing a corrected alpha figure the input does not support',
      'Accepting the 9.1% because the sample is large',
    ],
  },
  {
    id: 'scen-12',
    name: 'Regression to the Mean in a Management Intervention',
    shortName: 'Regression to Mean',
    category: 'Empirical Science',
    description: 'Bottom-decile performers improve after coaching, with no control group.',
    adversarialDifficulty: 'Moderate',
    vectors: ['Empirical Science', 'Behavioral Psychology'],
    realWorldUseCase: 'Evaluating internal programme results selected on extreme prior performance.',
    inputScenario:
      'A company identifies the bottom 10% of regional managers by Q1 sales and enrolls them in a coaching ' +
      'programme. In Q2 their sales rise 18% on average while company-wide sales rise 3%. HR proposes rolling ' +
      'coaching out to everyone, citing a 15-point improvement attributable to the programme. No manager was ' +
      'selected and left uncoached. Evaluate the claim.',
    expectedConstraints: [
      'Identify regression to the mean from selecting on an extreme single-period measurement',
      'Note the absence of a control group of comparably selected, uncoached managers',
      'State that the 15-point attribution to coaching is not supported by this design',
      'Propose a design that separates the effect, such as randomising coaching within the bottom decile',
      'Avoid concluding that coaching has no effect',
    ],
    knownFailureModes: [
      'Accepting the comparison against the company-wide average as a valid control',
      'Concluding the programme is worthless',
      'Estimating a corrected effect size from the given numbers',
    ],
  },
  {
    id: 'scen-13',
    name: 'Fatigue Failure Under a Static Safety Factor',
    shortName: 'Fatigue vs Static',
    category: 'Engineering Failure Analysis',
    description: 'A bracket rated at 3x static load fails at 40% of rated load after cyclic service.',
    adversarialDifficulty: 'High',
    vectors: ['Engineering', 'Systems Engineering'],
    realWorldUseCase: 'Failure investigation where the design margin targeted the wrong failure mode.',
    inputScenario:
      'A welded steel mounting bracket was designed with a safety factor of 3.0 against static yield. In service it ' +
      'supports a vibrating pump at roughly 25 Hz. After 14 months it cracked at the weld toe while carrying a ' +
      'load measured at 40% of its rated static capacity. The fracture surface shows beach marks. The supplier ' +
      'proposes a thicker bracket. Assess the failure and the proposed fix.',
    expectedConstraints: [
      'Identify fatigue as the failure mode, supported by beach marks and cyclic loading',
      'Explain that a static safety factor does not bound fatigue life',
      'Estimate the cycle count from 25 Hz over 14 months as on the order of 10^9 cycles if running continuously',
      'Identify the weld toe as a stress concentration that dominates fatigue strength',
      'Argue that weld detail and stress concentration matter more than section thickness',
    ],
    knownFailureModes: [
      'Attributing the failure to a material defect without evidence',
      'Endorsing the thicker bracket without addressing the weld detail',
      'Treating the failure as an anomaly because the load was below rating',
    ],
  },
  {
    id: 'scen-14',
    name: 'Tolerance Stack-Up: Worst-Case versus Statistical',
    shortName: 'Tolerance Stack-Up',
    category: 'Engineering Design',
    description: 'Five toleranced parts and a clearance that passes one method and fails the other.',
    adversarialDifficulty: 'Moderate',
    vectors: ['Engineering', 'Statistics & Stochastic'],
    realWorldUseCase: 'Mechanical design review deciding between worst-case and RSS tolerance analysis.',
    inputScenario:
      'Five parts stack in series, each toleranced at ±0.10 mm. The assembly needs the stack to stay within a ' +
      '±0.30 mm window. Worst-case analysis gives ±0.50 mm and fails. Root-sum-square analysis gives about ' +
      '±0.22 mm and passes. Two of the five parts come from one supplier whose process mean drifts toward the ' +
      'upper limit. Should the design be accepted?',
    expectedConstraints: [
      'Correctly state the worst-case sum as ±0.50 mm and RSS as approximately ±0.22 mm',
      'State that RSS assumes independent, centred, normally distributed variation',
      'Identify the drifting supplier as violating the centred assumption and correlating two parts',
      'Explain that the accept decision depends on which assumption holds, not on choosing a method',
      'Recommend a specific mitigation such as process control on the drifting supplier',
    ],
    knownFailureModes: [
      'Picking RSS because it passes, without stating its assumptions',
      'Treating the RSS result as a guarantee rather than a probability',
      'Making an arithmetic error in either stack figure',
    ],
  },
  {
    id: 'scen-15',
    name: "Winner's Curse in a Common-Value Auction",
    shortName: "Winner's Curse",
    category: 'Game Theory & Incentives',
    description: 'The winning bid in a lease auction lands well above the median estimate.',
    adversarialDifficulty: 'High',
    vectors: ['Game Design & Incentives', 'Behavioral Psychology'],
    realWorldUseCase: 'Assessing an acquisition or resource lease won at auction.',
    inputScenario:
      'Twelve firms bid for an offshore oil lease. All face the same unknown reserves; each commissions its own ' +
      'geological estimate. The winning bid is $410M. The median bid is $290M and the lowest $180M. The winner ' +
      'states its bid reflects its proprietary survey and calls the lease a bargain. Assess the winner\'s position.',
    expectedConstraints: [
      'Identify this as a common-value auction, not a private-value one',
      "Explain the winner's curse: the winner is selected for having the most optimistic estimate",
      'Note that more bidders worsens the curse absent bid shading',
      'State that the true value cannot be determined from the bid distribution alone',
      'Avoid concluding the winner overpaid by a specific amount',
    ],
    knownFailureModes: [
      'Treating the auction as private value, where the winner simply values it most',
      'Concluding the winner was irrational',
      'Estimating the true lease value from the median bid',
    ],
  },
  {
    id: 'scen-16',
    name: "Goodhart's Law in a Sales Incentive Plan",
    shortName: 'Metric Gaming',
    category: 'Game Theory & Incentives',
    description: 'Paying on account count produces more accounts and less revenue.',
    adversarialDifficulty: 'Moderate',
    vectors: ['Game Design & Incentives', 'Manipulation & Deception'],
    realWorldUseCase: 'Reviewing sales compensation after a metric change.',
    inputScenario:
      'A software company moved sales bonuses from revenue to new accounts opened. Over two quarters new accounts ' +
      'rose 60%, average revenue per new account fell 70%, and 45% of new accounts showed no activity after 30 ' +
      'days. Several large customers now appear as multiple separate accounts. The sales VP presents the account ' +
      'growth as a record result. Assess.',
    expectedConstraints: [
      "Identify Goodhart's law: the measure stopped tracking value once it became the target",
      'Connect the falling revenue per account and dormant accounts to the incentive change',
      'Identify customer splitting into multiple accounts as a specific gaming behaviour',
      'Recommend redesigning the incentive around activity or revenue, not adding metrics on top',
      'Avoid alleging fraud; splitting accounts may comply with the plan as written',
    ],
    knownFailureModes: [
      'Accepting the account growth as success',
      'Alleging fraud without evidence of rule violation',
      'Recommending layering more metrics onto the same structure',
    ],
  },
  {
    id: 'scen-17',
    name: 'Channel Stuffing Ahead of Year End',
    shortName: 'Channel Stuffing',
    category: 'Financial Forensics',
    description: 'Q4 revenue jumps while receivables and distributor inventory balloon.',
    adversarialDifficulty: 'High',
    vectors: ['Forensic Accounting', 'Manipulation & Deception'],
    realWorldUseCase: 'Revenue quality review of a manufacturer selling through distributors.',
    inputScenario:
      'A consumer electronics maker reports Q4 revenue up 22% year over year. Days sales outstanding rose from 41 ' +
      'to 68. The 10-K notes extended payment terms offered to distributors in December and a new bill-and-hold ' +
      'arrangement with one distributor. The Q1 returns provision was raised from 3% to 7% of revenue. Retail ' +
      'sell-through data are not disclosed. Assess revenue quality.',
    expectedConstraints: [
      'Identify the pattern as consistent with pulling future revenue forward into Q4',
      'Treat the DSO jump, extended terms and raised returns provision as connected signals',
      'Flag the bill-and-hold arrangement as requiring scrutiny of revenue recognition criteria',
      'State that distributor inventory or sell-through data are needed to confirm the pattern',
      'Avoid asserting fraud; the arrangements may be disclosed and permissible',
    ],
    knownFailureModes: [
      'Concluding fraud from the pattern alone',
      'Ignoring the raised returns provision',
      'Treating the DSO increase as normal seasonal variation',
    ],
  },
  {
    id: 'scen-18',
    name: "Benford's Law Applied to Threshold-Bounded Data",
    shortName: 'Benford Misuse',
    category: 'Financial Forensics',
    description: 'A first-digit test flags anomalies that a receipt policy explains.',
    adversarialDifficulty: 'High',
    vectors: ['Forensic Accounting', 'Statistics & Stochastic'],
    realWorldUseCase: 'Audit analytics on expense claims.',
    inputScenario:
      "An internal auditor runs Benford's first-digit test on 30,000 employee expense claims and finds a large " +
      'excess of claims beginning with 7, with a chi-square p-value below 0.001. Company policy requires a ' +
      'receipt for any claim of $75 or more. Most claims fall between $10 and $200. The auditor recommends a fraud ' +
      'investigation into all employees with 7-leading claims. Assess.',
    expectedConstraints: [
      "Explain that Benford's law requires data spanning several orders of magnitude",
      'Identify the $75 receipt threshold as a plausible cause of clustering just below it',
      'Note that clustering below a threshold is itself a legitimate audit signal, distinct from a Benford failure',
      "State that Benford's test is a screening tool and does not establish fraud",
      'Recommend a more targeted test, such as examining claims between $70 and $74.99',
    ],
    knownFailureModes: [
      'Concluding widespread fraud from the p-value',
      'Ignoring the receipt threshold entirely',
      'Dismissing the result as meaningless rather than redirecting it',
    ],
  },
  {
    id: 'scen-19',
    name: "Simpson's Paradox in a Hospital Comparison",
    shortName: "Simpson's Paradox",
    category: 'Empirical Science',
    description: 'One hospital wins in every subgroup and loses in aggregate.',
    adversarialDifficulty: 'Moderate',
    vectors: ['Advanced Math', 'Empirical Science'],
    realWorldUseCase: 'Comparing provider outcomes with differing case mix.',
    inputScenario:
      'Hospital A: mild cases 100 treated, 98 survived; severe cases 900 treated, 540 survived. Hospital B: mild ' +
      'cases 900 treated, 864 survived; severe cases 100 treated, 55 survived. A regional report ranks Hospital B ' +
      'first on overall survival. A patient with a severe case asks which hospital to choose. Answer and explain.',
    expectedConstraints: [
      'Compute overall survival as 63.8% for A and 91.9% for B',
      'Compute subgroup survival: mild 98.0% A vs 96.0% B; severe 60.0% A vs 55.0% B',
      "Identify Simpson's paradox: A is better in both subgroups but worse overall, because A treats far more severe cases",
      'Advise that A is better for the severe patient, using the subgroup comparison rather than the ranking',
      "Note that B's severe estimate rests on only 100 cases and carries wide uncertainty",
    ],
    knownFailureModes: [
      'Recommending based on aggregate survival',
      'Claiming the data must contain an error',
      'Ignoring the small severe-case sample at Hospital A',
    ],
  },
  {
    id: 'scen-20',
    name: 'Alarm Flooding and the Blamed Operator',
    shortName: 'Alarm Fatigue',
    category: 'Systems Engineering',
    description: 'An investigation blames an operator who was shown 1,200 alarms a shift.',
    adversarialDifficulty: 'Moderate',
    vectors: ['Behavioral Psychology', 'Systems Engineering'],
    realWorldUseCase: 'Incident review in process control, aviation or clinical monitoring.',
    inputScenario:
      'A process plant control room averages 1,200 alarms per 12-hour shift. A review found 94% required no ' +
      'action. During an incident a critical high-pressure alarm sounded among 40 other alarms in two minutes. ' +
      'The operator acknowledged it without acting. The investigation report concludes operator inattention and ' +
      'recommends retraining and disciplinary review. Assess the conclusion.',
    expectedConstraints: [
      'Identify the alarm load as a system design failure, not primarily an individual one',
      'Explain that a 94% non-actionable rate trains operators to dismiss alarms',
      'Note that 1,200 alarms in 12 hours far exceeds what an operator can meaningfully process',
      'Recommend alarm rationalisation and prioritisation of critical alarms',
      'Avoid absolving the operator entirely; retraining may be part of the fix but not the cause',
    ],
    knownFailureModes: [
      'Endorsing operator error as the root cause',
      'Recommending additional alarms',
      'Ignoring the base rate of non-actionable alarms',
    ],
  },
  {
    id: 'scen-21',
    name: 'Kelly Sizing Under Uncertain Edge',
    shortName: 'Kelly Overbetting',
    category: 'Game Theory & Liquidity',
    description: 'A trader bets three times the Kelly fraction on an estimated edge.',
    adversarialDifficulty: 'Extreme',
    vectors: ['Advanced Math', 'Game Design & Incentives'],
    realWorldUseCase: 'Position sizing review for a systematic strategy.',
    inputScenario:
      'A trader estimates a 55% win probability on repeated even-money bets and sizes each at 30% of current ' +
      'bankroll. The 55% estimate comes from 200 historical trades. The trader argues that a positive edge means ' +
      'larger bets compound faster. Evaluate the sizing.',
    expectedConstraints: [
      'Compute the Kelly fraction as 2p - 1 = 0.10, i.e. 10% of bankroll',
      'Explain that betting beyond roughly twice the Kelly fraction gives negative long-run growth despite a positive edge',
      'Identify 30% as three times Kelly and therefore in the negative-growth region',
      'Note that 200 trades leave substantial uncertainty in the 55% estimate',
      'Recommend fractional Kelly to account for estimation error',
    ],
    knownFailureModes: [
      'Miscomputing the Kelly fraction',
      'Agreeing that a positive edge justifies larger bets',
      'Recommending full Kelly without addressing estimation error',
    ],
  },
  {
    id: 'scen-22',
    name: 'Review Manipulation Signals on a New Product',
    shortName: 'Review Manipulation',
    category: 'Behavioral & Linguistic',
    description: 'A 4.7-star rating with launch-week clustering and single-review accounts.',
    adversarialDifficulty: 'Moderate',
    vectors: ['Manipulation & Deception', 'Behavioral Psychology', 'Empirical Science'],
    realWorldUseCase: 'Vendor due diligence or consumer protection review of online ratings.',
    inputScenario:
      'A product has a 4.7-star average across 2,000 reviews. 60% were posted in the first 10 days after launch. ' +
      '38% of reviewers have posted no other review. The rating distribution is heavily concentrated at 5 stars ' +
      'with a secondary cluster at 1 star and few in between. Reviews from the last 90 days average 3.4 stars. ' +
      'Assess how much weight the 4.7 rating deserves.',
    expectedConstraints: [
      'Identify launch-week clustering and single-review accounts as manipulation signals',
      'Treat the recent 3.4 average as more informative than the lifetime 4.7',
      'Note that a bimodal distribution is common in genuine reviews and is weak evidence alone',
      'State that platform-side data would be needed to confirm inauthentic reviews',
      'Avoid declaring all early reviews fake or inventing a corrected rating',
    ],
    knownFailureModes: [
      'Declaring all launch-period reviews fraudulent',
      'Taking the 4.7 rating at face value',
      'Producing a specific "true" rating',
    ],
  },
  {
    id: 'scen-23',
    name: 'Flat Warranty Reserve Against Rising Field Failures',
    shortName: 'Warranty Reserve',
    category: 'Financial Forensics',
    description: 'Field failure rates double while the warranty reserve stays flat.',
    adversarialDifficulty: 'High',
    vectors: ['Forensic Accounting', 'Engineering', 'Statistics & Stochastic'],
    realWorldUseCase: 'Reserve adequacy review for a hardware manufacturer.',
    inputScenario:
      'An appliance maker kept its warranty reserve at 2.0% of revenue for three years. Service records for a new ' +
      'compressor design show 12-month failure rates of 1.1% for units sold in year one and 2.4% for units sold in ' +
      'year two. The compressor has a 5-year warranty. Management states the reserve is adequate based on ' +
      'historical claims experience. Assess.',
    expectedConstraints: [
      'Identify that historical claims experience lags field failure data for a new design',
      'Note the 5-year warranty means most claims for recent units have not yet occurred',
      'Treat rising early failure rates as a leading indicator that the reserve may be understated',
      'Recognise that early failures may reflect infant mortality rather than lifetime rate',
      'State that a failure-rate curve over time is needed to estimate the shortfall',
    ],
    knownFailureModes: [
      'Accepting historical claims as adequate for a new design',
      'Extrapolating 12-month failure rates linearly to 5 years',
      'Quantifying a specific reserve shortfall',
    ],
  },
  {
    id: 'scen-24',
    name: 'Underpowered Pilot of a Firmware Reliability Fix',
    shortName: 'Underpowered Pilot',
    category: 'Engineering Design',
    description: 'A three-week pilot claims a reliability improvement from small counts.',
    adversarialDifficulty: 'Moderate',
    vectors: ['Engineering', 'Empirical Science', 'Statistics & Stochastic'],
    realWorldUseCase: 'Deciding whether to ship a fix on the evidence of a field pilot.',
    inputScenario:
      'A firmware update was installed on 400 field units for three weeks. Failure rate fell from 2.1% in the ' +
      'previous three weeks to 1.6% during the pilot: about 8 failures versus 6. The pilot units were chosen from ' +
      'sites with responsive maintenance teams. Most historical failures occur after 6 months in service. ' +
      'Engineering proposes shipping the update fleet-wide as a proven fix. Assess.',
    expectedConstraints: [
      'Note that 8 versus 6 failures is far too few events to distinguish the rates',
      'Identify that a 3-week window cannot observe failures that mostly occur after 6 months',
      'Identify site selection by maintenance responsiveness as a confounder',
      'Conclude the pilot does not show the update works, while not showing it fails',
      'Recommend a design with comparable control units and adequate duration',
    ],
    knownFailureModes: [
      'Accepting the 2.1% to 1.6% change as evidence of improvement',
      'Concluding the update is ineffective',
      'Ignoring the mismatch between pilot duration and failure timing',
    ],
  },
];

/** Minimum scenarios per vector on each side of the split. */
export const MIN_PER_VECTOR_PER_SIDE = 2;

/**
 * Deterministic, vector-stratified train/holdout split.
 *
 * The previous split took every Nth scenario by id. That gave a correct overall
 * ratio and no guarantee per vector — on the original bank, Engineering had zero
 * held-out scenarios, so an Engineering specialist could only ever be promoted
 * on work outside its field.
 *
 * This guarantees every vector at least MIN_PER_VECTOR_PER_SIDE scenarios on
 * BOTH sides, then tops the held-out set up toward the target fraction.
 * Deterministic on purpose: the split must be stable across restarts, or a skill
 * promoted yesterday would be measured on a different set today.
 */
export function splitScenarios(
  bank: ExecutableScenario[],
  holdoutFraction: number,
): { training: ExecutableScenario[]; holdout: ExecutableScenario[] } {
  const sorted = [...bank].sort((a, b) => a.id.localeCompare(b.id));
  const holdout = new Set<string>();

  const count = (side: 'holdout' | 'training', v: VectorCategory) =>
    sorted.filter((s) => s.vectors.includes(v) && (side === 'holdout') === holdout.has(s.id)).length;

  // Moving a scenario to held-out must not starve any of its vectors on the
  // training side.
  const canMove = (s: ExecutableScenario) =>
    !holdout.has(s.id) && s.vectors.every((v) => count('training', v) - 1 >= MIN_PER_VECTOR_PER_SIDE);

  const vectors = [...new Set(sorted.flatMap((s) => s.vectors))];
  // Scarcest vectors first: they have the fewest scenarios to choose from.
  vectors.sort(
    (a, b) =>
      sorted.filter((s) => s.vectors.includes(a)).length - sorted.filter((s) => s.vectors.includes(b)).length ||
      a.localeCompare(b),
  );

  for (const v of vectors) {
    while (count('holdout', v) < MIN_PER_VECTOR_PER_SIDE) {
      // Prefer scenarios that also serve other under-covered vectors.
      const candidate = sorted
        .filter((s) => s.vectors.includes(v) && canMove(s))
        .sort(
          (a, b) =>
            b.vectors.filter((x) => count('holdout', x) < MIN_PER_VECTOR_PER_SIDE).length -
              a.vectors.filter((x) => count('holdout', x) < MIN_PER_VECTOR_PER_SIDE).length ||
            a.id.localeCompare(b.id),
        )[0];
      if (!candidate) break; // bank too thin for this vector; validateBank reports it
      holdout.add(candidate.id);
    }
  }

  // Top up toward the target fraction without breaking training coverage.
  const target = Math.max(2, Math.round(sorted.length * holdoutFraction));
  const stride = Math.max(1, Math.floor(sorted.length / target));
  for (let i = 0; holdout.size < target && i < sorted.length * 2; i += stride) {
    const s = sorted[i % sorted.length];
    if (canMove(s)) holdout.add(s.id);
  }

  return {
    training: sorted.filter((s) => !holdout.has(s.id)),
    holdout: sorted.filter((s) => holdout.has(s.id)),
  };
}

/**
 * Coverage report for a split. Returned rather than thrown so the server can
 * boot and surface the gap in the dashboard; an engine that refuses to start
 * because one vector is thin is worse than one that says so.
 */
export function validateSplit(
  training: ExecutableScenario[],
  holdout: ExecutableScenario[],
  vectors: VectorCategory[],
): { vector: VectorCategory; training: number; holdout: number; ok: boolean }[] {
  return vectors.map((v) => {
    const t = training.filter((s) => s.vectors.includes(v)).length;
    const h = holdout.filter((s) => s.vectors.includes(v)).length;
    return { vector: v, training: t, holdout: h, ok: t >= MIN_PER_VECTOR_PER_SIDE && h >= MIN_PER_VECTOR_PER_SIDE };
  });
}

/**
 * Scenarios that exercise at least one of a skill's vectors, best match first.
 *
 * Zero-overlap scenarios are EXCLUDED. This used to return the whole pool ranked
 * by overlap, so a specialist with nothing relevant left was silently scored on
 * work outside its field — and that score fed promotion. A skill with no
 * relevant scenario now gets none, which surfaces as a coverage gap instead of
 * a misleading number.
 */
export function scenariosForVectors(
  pool: ExecutableScenario[],
  vectors: VectorCategory[],
): ExecutableScenario[] {
  return pool
    .map((s) => ({ scenario: s, overlap: s.vectors.filter((v) => vectors.includes(v)).length }))
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.scenario.id.localeCompare(b.scenario.id))
    .map((x) => x.scenario);
}

export function toDefinition(s: ExecutableScenario): ScenarioDefinition {
  const { id, name, shortName, category, description, adversarialDifficulty } = s;
  return { id, name, shortName, category, description, adversarialDifficulty };
}
