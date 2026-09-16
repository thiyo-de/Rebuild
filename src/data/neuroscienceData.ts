import { FailureReason } from '../types';

export type HubermanLawName = 'The Rhythm' | 'The Off Switch' | 'The Arc' | 'The Fighter';

export interface BiologicalRootCause {
  reason: FailureReason;
  biologicalPattern: string;
  neuroscienceProtocol: string;
  sourceLaw: HubermanLawName;
}

export interface HubermanLawProtocol {
  title: string;
  description: string;
  timing?: string;
  impact: string;
}

export interface HubermanLaw {
  id: 'the_rhythm' | 'the_off_switch' | 'the_arc' | 'the_fighter';
  number: 1 | 2 | 3 | 4;
  name: HubermanLawName;
  title: string;
  tagline: string;
  icon: string;
  coreSummary: string;
  neuroscienceMechanism: string;
  keyPrinciples: string[];
  protocols: HubermanLawProtocol[];
  actionableTakeaway: string;
  quote: string;
}

export const HUBERMAN_EXECUTION_LAWS: HubermanLaw[] = [
  {
    id: 'the_rhythm',
    number: 1,
    name: 'The Rhythm',
    title: 'LAW 1: THE RHYTHM — Control Cortisol, Control Everything',
    tagline: 'Cortisol deploys energy. Master your circadian cortisol curve to master mental clarity and sleep architecture.',
    icon: 'ri-sun-line',
    coreSummary:
      'Cortisol is an energy-deploying hormone. A sharp morning spike followed by a steady decline enables high evening focus and deep restorative sleep.',
    neuroscienceMechanism:
      'Morning bright light exposure triggers a ~50% cortisol spike that sets the daily biological clock, accelerates adenosine clearance, and suppresses nighttime cortisol surges.',
    keyPrinciples: [
      'Morning Cortisol Spike sets daytime energy and cognitive readiness',
      'Adenosine clearance through immediate hydration and delayed caffeine',
      'Circadian light gating: high photon density in morning, near-zero after 9:00 PM',
      'Temperature minimum anchors circadian wake-up timing',
    ],
    protocols: [
      {
        title: 'Morning Light Anchor',
        description: 'Get bright natural outdoor light in your eyes for 5 to 10 minutes within the first hour of waking.',
        timing: 'Before 8:00 AM',
        impact: 'Triggers sharp cortisol spike and sets biological clock',
      },
      {
        title: 'Hydration Anchor',
        description: 'Drink 500 ml of water immediately upon waking to accelerate adenosine clearance and blood volume.',
        timing: 'Immediately upon waking',
        impact: 'Restores cognitive readiness and fluid balance',
      },
      {
        title: 'Delayed Caffeine Protocol',
        description: 'Delay first caffeine intake until 90 minutes post-waking to permit natural adenosine clearance first.',
        timing: '90 min post-waking',
        impact: 'Prevents afternoon energy crash and doubles caffeine efficacy',
      },
      {
        title: 'Caffeine Cutoff',
        description: 'Zero caffeine intake after 2:00 PM due to its 5-to-6-hour metabolic half-life.',
        timing: 'After 2:00 PM',
        impact: 'Prevents adenosine receptor blockade during deep sleep',
      },
      {
        title: 'Evening Light Dimming',
        description: 'Dim overhead indoor lighting aggressively after 9:00 PM to protect melatonin onset.',
        timing: 'After 9:00 PM',
        impact: 'Suppresses nocturnal cortisol spikes',
      },
      {
        title: 'Physiological Sigh',
        description: 'Execute double inhale through nose followed by a prolonged, unforced mouth exhale before sleep.',
        timing: 'Pre-bedtime',
        impact: 'Rapidly shifts autonomic state to parasympathetic rest',
      },
    ],
    actionableTakeaway:
      'Get outside for 5 minutes with eyes toward the sky within the first hour of waking. This one act sets your entire biological clock for the day.',
    quote:
      'Get outside for 5 minutes with your eyes toward the sky within the first hour of waking. This one act sets your entire biological clock for the day.',
  },
  {
    id: 'the_off_switch',
    number: 2,
    name: 'The Off Switch',
    title: 'LAW 2: THE OFF SWITCH — Learning to Stop Is a Rare Skill',
    tagline: 'Deep cognitive consolidation happens during restorative sleep and non-sleep deep rest, not during active study.',
    icon: 'ri-moon-clear-line',
    coreSummary:
      'Unresolved anxiety and elevated nighttime cortisol truncate REM and Stage 3 sleep, destroying memory consolidation and physical recovery.',
    neuroscienceMechanism:
      'REM sleep is where the brain consolidates maths formulas, vocabulary, and motor patterns. Down-regulating sympathetic tone restores dopamine receptors and enables neurological consolidation.',
    keyPrinciples: [
      'Studying with impaired sleep is neurologically inferior to less study with deep sleep',
      'Growth Hormone release peaks during Stage 3 slow-wave sleep for tissue repair',
      'Dopamine baseline restoration occurs during Non-Sleep Deep Rest (NSDR)',
      'Completing the stress cycle terminates autonomic threat signaling',
    ],
    protocols: [
      {
        title: 'Tool 1: Yoga Nidra / NSDR',
        description: 'Engage in 10 to 20 minutes of guided Non-Sleep Deep Rest with progressive body scanning and stillness.',
        timing: 'Post-workout or between work and study',
        impact: 'Restores baseline dopamine levels faster than caffeine',
      },
      {
        title: 'Tool 2: The Eye Trick',
        description: 'Close eyes, gently move them side-to-side and in circles toward nose, then take one prolonged exhale.',
        timing: 'Bedtime rumination',
        impact: 'Body position sense detaches within 30 to 60 seconds',
      },
      {
        title: 'Tool 3: Two-Column Control Exercise',
        description: 'Write out uncontrollable external factors in column 1, and immediate controllable actions in column 2.',
        timing: 'When experiencing task anxiety',
        impact: 'Redirects prefrontal focus to high-agency domains in 5 minutes',
      },
      {
        title: 'Hard Sleep Boundary',
        description: 'Enforce non-negotiable 11:00 PM sleep target with zero screens from 10:30 PM onward.',
        timing: '10:30 PM - 11:00 PM',
        impact: 'Protects full 90-minute REM and Stage 3 slow-wave cycles',
      },
    ],
    actionableTakeaway:
      'Two people, equal work, equal resources. The one who can turn their mind off in the last hour and sleep deeper will compound massive advantages.',
    quote:
      'Two people, equal work, equal resources. The one who can turn their mind off in the last hour and sleep deeper — I bet on them within ten years. Every time.',
  },
  {
    id: 'the_arc',
    number: 3,
    name: 'The Arc',
    title: 'LAW 3: THE ARC — You Are in the Most Important Phase Right Now',
    tagline: 'Years 0-3 require maximum gas pedal execution within a strict 24-hour horizon: Win today. Not your whole life.',
    icon: 'ri-compass-3-line',
    coreSummary:
      'Long-term mastery spans three phases: Years 0-3 Gas Pedal, Years 4-6 Regulate, Years 7+ Refine and Play. You are in the Gas Pedal phase right now.',
    neuroscienceMechanism:
      'Reward Prediction Error (RPE) maintains dopamine tone when rewards are contingent on challenging 90% standards. Narrowing the horizon to 24 hours prevents prefrontal overload.',
    keyPrinciples: [
      'Years 0-3 Gas Pedal: Push to your absolute edge without permanent physiological damage',
      'The 24-Hour Horizon: What can I execute today, knowing I come back tomorrow?',
      'Reward Prediction Error: 90% threshold requirement fuels dopamine anticipation',
      'Strict monotasking: Multitasking levies a 2.4x time and cognitive switching tax',
    ],
    protocols: [
      {
        title: 'Gas Pedal Phase Commitment',
        description: 'Commit to full execution across your core transformation pillars without premature regulation.',
        timing: 'Current 18-month window',
        impact: 'Establishes foundational neuro-muscular and cognitive capacity',
      },
      {
        title: 'The 24-Hour Unit Rule',
        description: 'Never plan or recover multi-day deficits simultaneously. Treat each day as a discrete self-contained unit.',
        timing: 'Daily execution',
        impact: 'Releases prefrontal freeze and avoids overwhelm cascades',
      },
      {
        title: '90% Non-Negotiable Threshold',
        description: 'Never unlock milestone rewards below the 90% execution standard; maintain neurological integrity.',
        timing: 'Weekly and monthly reviews',
        impact: 'Preserves prefrontal respect for self-imposed boundaries',
      },
      {
        title: 'Monotasked Deep Work Blocks',
        description: 'Execute 60 to 75-minute study sessions with phone physically placed in another room.',
        timing: 'Evening study blocks',
        impact: 'Maximizes fluid intelligence and eliminates attentional residue',
      },
    ],
    actionableTakeaway:
      'The unit of time is one day. Not tomorrow. What can I do today, knowing I come back tomorrow? Win today. Not your whole life.',
    quote:
      'The unit of time is one day. Not tomorrow. What can I do today, knowing I come back tomorrow? Win today. Not your whole life.',
  },
  {
    id: 'the_fighter',
    number: 4,
    name: 'The Fighter',
    title: 'LAW 4: THE FIGHTER — Winner Is a Verb, Not a Personality',
    tagline: 'The Anterior Midcingulate Cortex physically grows when executing against limbic friction. Tenacity is a biological circuit.',
    icon: 'ri-sword-line',
    coreSummary:
      'Winners and losers experience identical internal friction, fatigue, and hesitation. The difference is the deliberate decision to execute through limbic friction.',
    neuroscienceMechanism:
      'The Anterior Midcingulate Cortex (aMCC) expands structurally when individuals do things they do not want to do. Engaging friction directly strengthens willpower hardware.',
    keyPrinciples: [
      'Anterior Midcingulate Cortex growth requires leaning into acute limbic friction',
      'Attention calibration: 10 breaths before external devices or narrative runaway',
      'Horizon contraction: Reduce the temporal frame to release executive freeze',
      'Empirical neural evidence: Recall past survival events to prime persistence',
    ],
    protocols: [
      {
        title: 'Ten Breaths Attention Anchor',
        description: 'Hold steady attention for 10 deliberate deep breaths before touching your phone or starting the day.',
        timing: 'Upon waking before getting out of bed',
        impact: 'Calibrates prefrontal attentional control circuits',
      },
      {
        title: 'Horizon Contraction Protocol',
        description: 'When overwhelmed or frozen, contract your focus to just the immediate 5-minute task chunk.',
        timing: 'When experiencing task paralysis',
        impact: 'Bypasses amygdala threat detection and initiates motor momentum',
      },
      {
        title: 'Deliberate Survival Recall',
        description: 'Consciously retrieve one vivid memory of surviving an intensely difficult circumstance.',
        timing: 'When motivation drops or urges arise',
        impact: 'Provides empirical evidence to the prefrontal cortex of persistence',
      },
      {
        title: 'Limbic Friction Override',
        description: 'Acknowledge resistance as pure biological friction, not identity; execute the first mechanical step.',
        timing: 'At point of initial friction',
        impact: 'Directly stimulates neuroplastic remodeling of the aMCC',
      },
    ],
    actionableTakeaway:
      'Losers and winners both have hard thoughts, despair, and unexpected friction. The difference is what they do next.',
    quote:
      'Losers and winners both have hard thoughts, despair, losses they could not control. The difference is what they do next.',
  },
];

export const METACOGNITIVE_MIRROR_MAPPINGS: Record<string, BiologicalRootCause> = {
  'Procrastination': {
    reason: 'Procrastination',
    biologicalPattern: 'Amygdala threat response to perceived task friction, activating acute prefrontal avoidance.',
    neuroscienceProtocol: '5-minute threshold rule: commit strictly to the first 5 minutes. Anterior mid-cingulate cortex engages once mechanical motion begins.',
    sourceLaw: 'The Fighter',
  },
  'Phone / social media': {
    reason: 'Phone / social media',
    biologicalPattern: 'High-frequency variable-ratio dopamine reward loops hijacking prefrontal executive attentional networks.',
    neuroscienceProtocol: 'Environmental friction protocol: physically place phone in another room during focus bouts. Location beats willpower.',
    sourceLaw: 'The Arc',
  },
  'Mental fog': {
    reason: 'Mental fog',
    biologicalPattern: 'Residual adenosine accumulation, blunted morning cortisol spike, or unmanaged sleep architecture debt.',
    neuroscienceProtocol: 'Anchor morning circadian clock with 5-10 minutes of direct sunlight and 500ml hydration; delay caffeine 90 minutes.',
    sourceLaw: 'The Rhythm',
  },
  'Too tired': {
    reason: 'Too tired',
    biologicalPattern: 'Systemic autonomic exhaustion, depleted prefrontal glucose bandwidth, and elevated night cortisol.',
    neuroscienceProtocol: 'Deploy 10-20 minutes of Non-Sleep Deep Rest (NSDR); enforce non-negotiable 11:00 PM sleep boundary.',
    sourceLaw: 'The Off Switch',
  },
  'Lazy / low energy': {
    reason: 'Lazy / low energy',
    biologicalPattern: 'Tonic baseline dopamine depletion accompanied by elevated limbic friction before task initiation.',
    neuroscienceProtocol: 'Execute 10 deep attention-calibrating breaths; engage 5 minutes of low-friction physical movement to jumpstart dopamine.',
    sourceLaw: 'The Fighter',
  },
  'Porn / distraction': {
    reason: 'Porn / distraction',
    biologicalPattern: 'Supranormal dopamine spikes down-regulating striatal D2 receptors and eroding prefrontal inhibitory control.',
    neuroscienceProtocol: 'Strict digital perimeter defense; execute physiological sigh (double inhale nose, long exhale mouth) to rapidly down-regulate sympathetic drive.',
    sourceLaw: 'The Off Switch',
  },
  'Work': {
    reason: 'Work',
    biologicalPattern: 'External cognitive decision load exhausting finite prefrontal cortex bandwidth prior to personal execution.',
    neuroscienceProtocol: 'Execute a 5-minute transition ritual (outdoor walk, screen disconnect) upon arriving home to cleanly close the workday stress cycle.',
    sourceLaw: 'The Off Switch',
  },
  'Unexpected situation': {
    reason: 'Unexpected situation',
    biologicalPattern: 'Acute sympathetic nervous system arousal and amygdala alert signaling disrupting structured execution routines.',
    neuroscienceProtocol: 'Narrow the time horizon: execute a single 5-minute micro-rep today. Preserve identity continuity without attempting past recovery.',
    sourceLaw: 'The Arc',
  },
  'Poor planning': {
    reason: 'Poor planning',
    biologicalPattern: 'Excessive cognitive friction and decision fatigue at execution time due to undefined target parameters.',
    neuroscienceProtocol: 'Execute the Two-Column exercise before sleep: pre-decide single-task targets for tomorrow so zero decisions occur in the evening.',
    sourceLaw: 'The Rhythm',
  },
  'Forgot': {
    reason: 'Forgot',
    biologicalPattern: 'Attentional fragmentation and Default Mode Network wandering in the absence of salient environmental cues.',
    neuroscienceProtocol: 'Anchor habit triggers directly to fixed circadian events (e.g. post-cardio or arrival home) to bypass working memory load.',
    sourceLaw: 'The Rhythm',
  },
  'Goal was too difficult': {
    reason: 'Goal was too difficult',
    biologicalPattern: 'Excessive limbic friction exceeding current anterior mid-cingulate cortex capacity, triggering task freeze.',
    neuroscienceProtocol: 'Shorten the horizon: break the target into a single 15-minute ultradian micro-block to reset reward prediction error.',
    sourceLaw: 'The Fighter',
  },
  'Goal was unrealistic': {
    reason: 'Goal was unrealistic',
    biologicalPattern: 'Misalignment between prefrontal ambition and available neurobiological energy capacity.',
    neuroscienceProtocol: 'Calibrate target volume to baseline execution threshold; consistency overrides peak intensity during Year 0-3.',
    sourceLaw: 'The Arc',
  },
  'Illness': {
    reason: 'Illness',
    biologicalPattern: 'Systemic immune activation, elevated cytokine signaling, and biological prioritization of cellular repair over motor execution.',
    neuroscienceProtocol: 'Complete physiological down-regulation: prioritize sleep, aggressive hydration, and active rest until cytokine cascade subsides.',
    sourceLaw: 'The Off Switch',
  },
  'No specific reason': {
    reason: 'No specific reason',
    biologicalPattern: 'Subconscious micro-friction accumulation and open stress cycles dampening execution drive.',
    neuroscienceProtocol: 'Perform 10 focused breaths; complete the 60-second binary stress-cycle closure log to reset executive clarity.',
    sourceLaw: 'The Fighter',
  },
  'Other': {
    reason: 'Other',
    biologicalPattern: 'Unclassified external friction or attentional switching tax compromising monotasking prefrontal focus.',
    neuroscienceProtocol: 'Recall one memory of surviving something hard to reinforce tenacity circuits; execute one small win today.',
    sourceLaw: 'The Fighter',
  },
};

export const getMetacognitiveMirrorForReason = (reason: string): BiologicalRootCause => {
  if (METACOGNITIVE_MIRROR_MAPPINGS[reason]) {
    return METACOGNITIVE_MIRROR_MAPPINGS[reason];
  }
  return {
    reason: (reason as FailureReason) || 'Other',
    biologicalPattern: 'Unclassified external friction or attentional switching tax compromising monotasking prefrontal focus.',
    neuroscienceProtocol: 'Recall one memory of surviving something hard to reinforce tenacity circuits; execute one small win today.',
    sourceLaw: 'The Fighter',
  };
};

export const ZERO_FRICTION_MESSAGE =
  'Pattern observed: Zero friction logged in this period. Baseline dopamine and prefrontal regulation sustained.';
