import { useEffect, useMemo, useRef, useState } from 'react';
import {
  countWords,
  MAX_SHARE_WORDS,
  type ChallengeResult,
  type ChecklistStatus,
  type DecisionContext,
  type DecisionRecordObject,
  type LensesResult,
  type RehearsalResult,
  type Stage,
  type StructureDecisionOutput,
} from '../shared/schemas';
import { callAnalyze, fetchDecisionStartsCount, recordDecisionStart } from './api';
import { ChallengeStage } from './components/ChallengeStage';
import { ExploreStage } from './components/ExploreStage';
import { LandingPage } from './components/LandingPage';
import { ReflectStage } from './components/ReflectStage';

const STAGES: { id: Stage; label: string; number: number }[] = [
  { id: 'share', label: 'Share', number: 1 },
  { id: 'understand', label: 'Understand', number: 2 },
  { id: 'challenge', label: 'Challenge', number: 3 },
  { id: 'explore', label: 'Explore', number: 4 },
  { id: 'reflect', label: 'Your Decision Record', number: 5 },
];

const EXAMPLE_DESCRIPTION =
  "I have one week to decide whether to move to Singapore for work. It feels like a once-in-a-lifetime opportunity, but I'm stressed and worried about what I haven't considered.";

const CAREER_EXAMPLE_DESCRIPTION =
  "I've been offered a leadership role at an early-stage company, which would mean leaving a stable, well-compensated position where I'm respected. The upside is exciting, but I'm unsure how much of my hesitation is healthy caution versus fear of change.";

const ENTREPRENEURSHIP_EXAMPLE_DESCRIPTION =
  "I'm considering leaving my job to start a company with a former colleague. We have strong early conviction in the problem, but limited runway and unanswered questions about our partnership, customer demand, and personal financial tolerance.";

const UNDERSTAND_PLACEHOLDERS = {
  default: {
    options:
      "I could stay in my current role in the US or transfer to Singapore. I'm leaning toward Singapore because I'm excited about the change, but I'm worried about the risks.",
    gains:
      '1. Long-term career growth\n2. Better quality of life\n3. Financial stability\n4. New experiences and personal growth\n5. Stronger social connections',
    worries:
      '1. Financial stability\n2. Career opportunities in the US\n3. Relationships with friends and family\n4. Access to familiar healthcare services\n5. The flexibility to change my mind or move back',
    outcome:
      "Six months from now, I've settled into life in Singapore. I'm doing meaningful work, building friendships, and feeling more connected than I did in the US. I have enough financial security to feel comfortable, and I can see opportunities for my career to grow. Even though some things have been difficult, I feel that taking the risk was worthwhile.",
  },
  career: {
    options:
      'I could stay in my stable, well-compensated current role or accept the leadership role at the early-stage company. I’m excited by the opportunity, but unsure whether my hesitation is healthy caution or fear of change.',
    gains:
      '1. Broader leadership experience\n2. More ownership and impact\n3. The chance to help shape an early-stage company\n4. New skills and professional growth\n5. A role that remains financially sustainable for me',
    worries:
      '1. Financial stability and predictable compensation\n2. The security of an established role\n3. The respect and trust I’ve built in my current position\n4. A sustainable workload and work-life balance\n5. Future options if the new role doesn’t work out',
    outcome:
      'Six months from now, I’ve settled into the leadership role and have clear priorities, support, and room to make a meaningful contribution. I’m learning, building trust with the team, and seeing progress on work that matters. The role is challenging but sustainable, and I feel the growth has been worth the uncertainty.',
  },
  entrepreneurship: {
    options:
      'I could stay in my current job or leave to start a company with my former colleague. I’m excited about the problem we want to solve, but I’m unsure whether our conviction is supported by enough evidence about customer demand, our partnership, and the financial risk.',
    gains:
      '1. The chance to solve a problem I care about\n2. More ownership over what I build\n3. The opportunity to create something with my former colleague\n4. Faster learning and professional growth\n5. The possibility of building a sustainable business',
    worries:
      '1. A stable income and financial security\n2. The savings or runway I would invest in the company\n3. A positive working relationship with my former colleague\n4. Time and energy for other parts of my life\n5. The ability to return to a comparable role if the company doesn’t work out',
    outcome:
      'Six months from now, we’ve tested whether customers genuinely need what we’re building and have a clearer view of the business’s costs and runway. My former colleague and I have agreed on our roles, decision-making, and how we’ll handle disagreements. I understand the personal financial risk, and I feel that continuing is a deliberate choice based on what we’ve learned.',
  },
} as const;

const STORAGE_KEY = 'system3.decision.v1';
const THEME_STORAGE_KEY = 'system3.theme';

const INITIAL_CLARIFICATIONS = {
  options: '',
  gains: '',
  worries: '',
  successAndFailure: '',
};

interface Versioned<T> {
  generatedForVersion: number;
  model: string;
  data: T;
}

interface LocalSnapshot {
  stage: Stage;
  completedStages: Stage[];
  inputVersion: number;
  rawDescription: string;
  deadline: string;
  clarifications: typeof INITIAL_CLARIFICATIONS;
  structured?: Versioned<StructureDecisionOutput>;
  challenge?: Versioned<ChallengeResult>;
  lenses?: Versioned<LensesResult>;
  rehearsal?: Versioned<RehearsalResult>;
  selectedLensIds: string[];
  checklistStatuses: Record<string, ChecklistStatus>;
  savedInsights: string[];
  activeExploreMode?: 'lenses' | 'rehearse' | null;
  record?: Versioned<DecisionRecordObject>;
}

function createStartId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `start-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch {
      // Ignore storage errors
    }
    return 'light';
  });
  const [view, setView] = useState<'landing' | 'workspace'>('landing');
  const [decisionStartsCount, setDecisionStartsCount] = useState<number | null>(null);
  const recordingStartRef = useRef(false);
  const [saveLocally, setSaveLocally] = useState(false);
  const [stage, setStage] = useState<Stage>('share');
  const [completedStages, setCompletedStages] = useState<Stage[]>([]);
  const [inputVersion, setInputVersion] = useState(1);

  const [rawDescription, setRawDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [clarifications, setClarifications] = useState(INITIAL_CLARIFICATIONS);

  const [structured, setStructured] = useState<Versioned<StructureDecisionOutput>>();
  const [challenge, setChallenge] = useState<Versioned<ChallengeResult>>();
  const [lenses, setLenses] = useState<Versioned<LensesResult>>();
  const [rehearsal, setRehearsal] = useState<Versioned<RehearsalResult>>();
  const [record, setRecord] = useState<Versioned<DecisionRecordObject>>();

  const [selectedLensIds, setSelectedLensIds] = useState<string[]>([]);
  const [checklistStatuses, setChecklistStatuses] = useState<Record<string, ChecklistStatus>>({});
  const [savedInsights, setSavedInsights] = useState<string[]>([]);
  const [activeExploreMode, setActiveExploreMode] = useState<'lenses' | 'rehearse' | null>(null);

  const [loadingUnderstand, setLoadingUnderstand] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [loadingLenses, setLoadingLenses] = useState(false);
  const [loadingRehearsal, setLoadingRehearsal] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);

  const [understandError, setUnderstandError] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [lensesError, setLensesError] = useState<string | null>(null);
  const [rehearsalError, setRehearsalError] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    let active = true;
    fetchDecisionStartsCount().then((count) => {
      if (active && count !== null) {
        setDecisionStartsCount(count);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (view === 'landing') {
      recordingStartRef.current = false;
    }
  }, [view]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as LocalSnapshot;
      setSaveLocally(true);
      setStage(parsed.stage || 'share');
      setCompletedStages(parsed.completedStages || []);
      setInputVersion(parsed.inputVersion || 1);
      setRawDescription(parsed.rawDescription || '');
      setDeadline(parsed.deadline || '');
      setClarifications(parsed.clarifications || INITIAL_CLARIFICATIONS);
      setStructured(parsed.structured);
      setChallenge(parsed.challenge);
      setLenses(parsed.lenses);
      setRehearsal(parsed.rehearsal);
      setSelectedLensIds(parsed.selectedLensIds || []);
      setChecklistStatuses(parsed.checklistStatuses || {});
      setSavedInsights(parsed.savedInsights || []);
      setActiveExploreMode(parsed.activeExploreMode ?? null);
      setRecord(parsed.record);
    } catch {
      // Ignore corrupt local snapshot
    }
  }, []);

  useEffect(() => {
    if (!saveLocally) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const snapshot: LocalSnapshot = {
      stage,
      completedStages,
      inputVersion,
      rawDescription,
      deadline,
      clarifications,
      structured,
      challenge,
      lenses,
      rehearsal,
      selectedLensIds,
      checklistStatuses,
      savedInsights,
      activeExploreMode,
      record,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [
    saveLocally,
    stage,
    completedStages,
    inputVersion,
    rawDescription,
    deadline,
    clarifications,
    structured,
    challenge,
    lenses,
    rehearsal,
    selectedLensIds,
    checklistStatuses,
    savedInsights,
    activeExploreMode,
    record,
  ]);

  const shareWordCount = useMemo(() => countWords(rawDescription), [rawDescription]);
  const shareOverLimit = shareWordCount > MAX_SHARE_WORDS;

  const decisionContext: DecisionContext | null = useMemo(() => {
    if (!structured) return null;
    return {
      decisionStatement: structured.data.decision_statement,
      deadline: deadline.trim() || null,
      options: structured.data.options,
      currentLeaning: structured.data.current_leaning ?? null,
      goals: structured.data.goals,
      fears: structured.data.fears,
      successDefinition: structured.data.success_definition ?? null,
      failureDefinition: structured.data.failure_definition ?? null,
      userProvidedFacts: structured.data.user_provided_facts,
      userAssumptions: structured.data.user_assumptions,
      unknowns: structured.data.unknowns,
    };
  }, [structured, deadline]);

  function markCompleted(s: Stage) {
    setCompletedStages((prev) => (prev.includes(s) ? prev : [...prev, s]));
  }

  function handleClearDecision() {
    localStorage.removeItem(STORAGE_KEY);
    setSaveLocally(false);
    setStage('share');
    setCompletedStages([]);
    setInputVersion(1);
    setRawDescription('');
    setDeadline('');
    setClarifications(INITIAL_CLARIFICATIONS);
    setStructured(undefined);
    setChallenge(undefined);
    setLenses(undefined);
    setRehearsal(undefined);
    setRecord(undefined);
    setSelectedLensIds([]);
    setChecklistStatuses({});
    setSavedInsights([]);
    setActiveExploreMode(null);
    setUnderstandError(null);
    setChallengeError(null);
    setLensesError(null);
    setRehearsalError(null);
    setRecordError(null);
  }

  async function handleAnalyzeUnderstand() {
    setLoadingUnderstand(true);
    setUnderstandError(null);
    try {
      const result = await callAnalyze<StructureDecisionOutput>('structureDecision', {
        rawDescription: rawDescription.trim(),
        deadline: deadline.trim() || null,
        clarifications,
      });
      setStructured({
        generatedForVersion: inputVersion,
        model: result.model,
        data: result.data,
      });
      markCompleted('understand');
    } catch (err) {
      setUnderstandError(
        err instanceof Error ? err.message : 'Analysis is temporarily unavailable.',
      );
    } finally {
      setLoadingUnderstand(false);
    }
  }

  async function handleGenerateChallenge() {
    if (!decisionContext) return;
    setLoadingChallenge(true);
    setChallengeError(null);
    try {
      const result = await callAnalyze<ChallengeResult>('analyzeChallenge', {
        rawDescription: rawDescription.trim(),
        context: decisionContext,
      });
      setChallenge({
        generatedForVersion: inputVersion,
        model: result.model,
        data: result.data,
      });
      markCompleted('challenge');
    } catch (err) {
      setChallengeError(
        err instanceof Error ? err.message : 'Analysis is temporarily unavailable.',
      );
    } finally {
      setLoadingChallenge(false);
    }
  }

  async function handleGenerateLenses() {
    if (!decisionContext) return;
    setLoadingLenses(true);
    setLensesError(null);
    try {
      const result = await callAnalyze<LensesResult>('generateLenses', {
        rawDescription: rawDescription.trim(),
        context: decisionContext,
      });
      setLenses({
        generatedForVersion: inputVersion,
        model: result.model,
        data: result.data,
      });
      // Auto-expand only the first recommended lens on first generation
      setSelectedLensIds((prev) => {
        if (prev.length > 0) return prev;
        const firstRec = result.data.lenses.find((l) => l.recommended);
        return firstRec ? [firstRec.id] : [];
      });
      markCompleted('explore');
    } catch (err) {
      setLensesError(
        err instanceof Error ? err.message : 'Analysis is temporarily unavailable.',
      );
    } finally {
      setLoadingLenses(false);
    }
  }

  async function handleGenerateRehearsal() {
    if (!decisionContext) return;
    setLoadingRehearsal(true);
    setRehearsalError(null);
    try {
      const result = await callAnalyze<RehearsalResult>('generateRehearsal', {
        rawDescription: rawDescription.trim(),
        context: decisionContext,
      });
      setRehearsal({
        generatedForVersion: inputVersion,
        model: result.model,
        data: result.data,
      });
      markCompleted('explore');
    } catch (err) {
      setRehearsalError(
        err instanceof Error ? err.message : 'Analysis is temporarily unavailable.',
      );
    } finally {
      setLoadingRehearsal(false);
    }
  }

  async function handleGenerateRecord() {
    if (!decisionContext) return;
    setLoadingRecord(true);
    setRecordError(null);
    try {
      const selectedLensesPayload = lenses?.data.lenses
        .filter(
          (l) =>
            selectedLensIds.includes(l.id) ||
            l.questions.some((q) => checklistStatuses[q.id] === 'to_investigate'),
        )
        .map((l) => {
          const toExplore = l.questions
            .filter((q) => checklistStatuses[q.id] === 'to_investigate')
            .map((q) => q.question);
          const remainingOpen = l.questions
            .filter((q) => {
              const s = checklistStatuses[q.id] || 'not_checked';
              return s === 'not_checked';
            })
            .map((q) => q.question);
          return {
            name: l.name,
            unresolvedQuestions:
              toExplore.length > 0 ? toExplore : remainingOpen,
          };
        })
        .filter((l) => l.unresolvedQuestions.length > 0);

      const result = await callAnalyze<DecisionRecordObject>('composeDecisionRecord', {
        context: decisionContext,
        challenge: challenge?.data,
        selectedLenses: selectedLensesPayload,
        savedInsights,
      });
      setRecord({
        generatedForVersion: inputVersion,
        model: result.model,
        data: result.data,
      });
      markCompleted('reflect');
    } catch (err) {
      setRecordError(
        err instanceof Error ? err.message : 'Analysis is temporarily unavailable.',
      );
    } finally {
      setLoadingRecord(false);
    }
  }

  function handleSelectExploreMode(mode: 'lenses' | 'rehearse') {
    setActiveExploreMode(mode);
    if (mode === 'lenses' && decisionContext && !lenses && !loadingLenses) {
      void handleGenerateLenses();
    }
    if (mode === 'rehearse' && decisionContext && !rehearsal && !loadingRehearsal) {
      void handleGenerateRehearsal();
    }
  }

  function goToStage(nextStage: Stage) {
    setStage(nextStage);
    if (nextStage === 'challenge' && decisionContext && !challenge && !loadingChallenge) {
      void handleGenerateChallenge();
    }
    if (nextStage === 'reflect' && decisionContext && !record && !loadingRecord) {
      void handleGenerateRecord();
    }
  }

  const hasInProgressDecision = Boolean(
    rawDescription.trim() ||
      deadline.trim() ||
      clarifications.options.trim() ||
      clarifications.gains.trim() ||
      clarifications.worries.trim() ||
      clarifications.successAndFailure.trim() ||
      structured ||
      completedStages.length > 0,
  );

  function trackNewDecisionStart() {
    if (recordingStartRef.current) return;
    recordingStartRef.current = true;
    recordDecisionStart(createStartId()).then((nextCount) => {
      if (nextCount !== null) {
        setDecisionStartsCount(nextCount);
      }
    });
  }

  function handleEnterFromLanding() {
    if (!hasInProgressDecision) {
      trackNewDecisionStart();
    }
    setView('workspace');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function handleStartExample(description: string, exampleDeadline: string) {
    if (
      hasInProgressDecision &&
      !window.confirm('You already have a decision in progress. Replace it with this example scenario?')
    ) {
      return;
    }
    trackNewDecisionStart();
    const trimmed = description.trim();
    const matchedClarifications =
      trimmed === CAREER_EXAMPLE_DESCRIPTION
        ? UNDERSTAND_PLACEHOLDERS.career
        : trimmed === ENTREPRENEURSHIP_EXAMPLE_DESCRIPTION
          ? UNDERSTAND_PLACEHOLDERS.entrepreneurship
          : UNDERSTAND_PLACEHOLDERS.default;

    setStage('share');
    setCompletedStages([]);
    setInputVersion((v) => v + 1);
    setRawDescription(description);
    setDeadline(exampleDeadline);
    setClarifications({
      options: matchedClarifications.options,
      gains: matchedClarifications.gains,
      worries: matchedClarifications.worries,
      successAndFailure: matchedClarifications.outcome,
    });
    setStructured(undefined);
    setChallenge(undefined);
    setLenses(undefined);
    setRehearsal(undefined);
    setRecord(undefined);
    setSelectedLensIds([]);
    setChecklistStatuses({});
    setSavedInsights([]);
    setActiveExploreMode(null);
    setUnderstandError(null);
    setChallengeError(null);
    setLensesError(null);
    setRehearsalError(null);
    setRecordError(null);
    setView('workspace');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  const currentStageMeta = STAGES.find((s) => s.id === stage) ?? STAGES[0];

  if (view === 'landing') {
    return (
      <LandingPage
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        hasInProgressDecision={hasInProgressDecision}
        decisionStartsCount={decisionStartsCount}
        onEnterWorkspace={handleEnterFromLanding}
        onStartExample={handleStartExample}
      />
    );
  }

  const trimmedDescription = rawDescription.trim();
  const understandPlaceholders =
    trimmedDescription === CAREER_EXAMPLE_DESCRIPTION
      ? UNDERSTAND_PLACEHOLDERS.career
      : trimmedDescription === ENTREPRENEURSHIP_EXAMPLE_DESCRIPTION
        ? UNDERSTAND_PLACEHOLDERS.entrepreneurship
        : UNDERSTAND_PLACEHOLDERS.default;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <button
            type="button"
            className="workspace-overview-link"
            onClick={() => {
              setView('landing');
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
          >
            ← Overview
          </button>
          <button
            type="button"
            className="brand-home-btn"
            aria-label="Return to System 3 overview"
            onClick={() => {
              setView('landing');
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
          >
            <span className="wordmark" aria-label="System 3">
              <span aria-hidden="true">S</span>
              <span className="wordmark-y" aria-hidden="true">
                y
              </span>
              <span aria-hidden="true">stem</span>
              <span className="wordmark-three" aria-hidden="true">
                3
              </span>
            </span>
          </button>
          <p className="brand-tagline">
            System 1 thinks fast. System 2 thinks slow. System 3 challenges how you think.
          </p>
        </div>
        <div className="header-controls">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={saveLocally}
              onChange={(e) => setSaveLocally(e.target.checked)}
            />
            Save on this device
          </label>
          <button
            type="button"
            className="btn btn-sm"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <button type="button" className="btn btn-sm" onClick={handleClearDecision}>
            Clear this decision
          </button>
        </div>
      </header>

      <div className="privacy-note">
        <strong>Privacy &amp; agency:</strong> Analysis inputs are sent to the Gemini API to generate
        questions and structured context. Decision content is never stored in a database (only an
        anonymous aggregate start count is recorded), and local browser saving is off unless you
        enable <em>Save on this device</em>.
      </div>

      <nav aria-label="Decision workflow progress" className="progress-tracker">
        {STAGES.map((item) => {
          const isCurrent = stage === item.id;
          const isDone = completedStages.includes(item.id);
          const canNavigate =
            item.id === 'share' ||
            (item.id === 'understand' && Boolean(rawDescription.trim()) && !shareOverLimit) ||
            isDone ||
            Boolean(structured);

          const stateAttr = isCurrent ? 'current' : isDone ? 'completed' : 'upcoming';

          return (
            <button
              key={item.id}
              type="button"
              className="stage-step"
              data-state={stateAttr}
              aria-current={isCurrent ? 'step' : undefined}
              disabled={!canNavigate}
              onClick={() => goToStage(item.id)}
            >
              <span className="stage-badge">{isDone && !isCurrent ? '✓' : item.number}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <nav aria-label="Mobile workflow progress" className="mobile-progress">
        <div className="mobile-progress-header">
          <span>
            Step {currentStageMeta.number} of 5 — {currentStageMeta.label}
          </span>
        </div>
        <div className="mobile-progress-segments">
          {STAGES.map((item) => {
            const isCurrent = stage === item.id;
            const isDone = completedStages.includes(item.id);
            const canNavigate =
              item.id === 'share' ||
              (item.id === 'understand' && Boolean(rawDescription.trim()) && !shareOverLimit) ||
              isDone ||
              Boolean(structured);
            const stateAttr = isCurrent ? 'current' : isDone ? 'completed' : 'upcoming';

            return (
              <button
                key={item.id}
                type="button"
                className="mobile-segment"
                data-state={stateAttr}
                aria-label={`Step ${item.number}: ${item.label}`}
                aria-current={isCurrent ? 'step' : undefined}
                disabled={!canNavigate}
                onClick={() => goToStage(item.id)}
              />
            );
          })}
        </div>
      </nav>

      {stage === 'share' && (
        <section className="card">
          <h2>What decision is weighing on you?</h2>
          <p className="helper">
            You don&apos;t need to have it figured out. Tell us what&apos;s happening in your own words.
          </p>

          <div className="field">
            <label htmlFor="decision-raw">Your situation</label>
            <textarea
              id="decision-raw"
              rows={5}
              placeholder={EXAMPLE_DESCRIPTION}
              value={rawDescription}
              onChange={(e) => {
                setRawDescription(e.target.value);
                setInputVersion((v) => v + 1);
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                marginTop: 6,
                fontSize: '0.82rem',
              }}
            >
              <span
                style={{
                  color: shareOverLimit ? 'var(--color-error-text)' : 'var(--color-text-muted)',
                }}
              >
                {shareOverLimit
                  ? `Please keep this under ${MAX_SHARE_WORDS} words so we can focus on the core decision.`
                  : ''}
              </span>
              <span
                style={{
                  fontWeight: shareWordCount >= 250 ? 600 : 400,
                  color: shareOverLimit
                    ? 'var(--color-error-text)'
                    : shareWordCount >= 250
                      ? 'var(--color-warning)'
                      : 'var(--color-text-muted)',
                }}
              >
                {shareWordCount} / {MAX_SHARE_WORDS} words
              </span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="decision-deadline">Decision deadline (optional)</label>
            <input
              id="decision-deadline"
              type="text"
              placeholder="e.g., Next Friday, 1 week, end of month"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value);
                setInputVersion((v) => v + 1);
              }}
            />
          </div>

          <div className="actions-row">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setRawDescription(EXAMPLE_DESCRIPTION);
                  setDeadline('1 week');
                  setInputVersion((v) => v + 1);
                }}
              >
                Use example
              </button>
              <p className="agency-note">System 3 helps you think; it doesn&apos;t decide for you.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!rawDescription.trim() || shareOverLimit}
              onClick={() => {
                markCompleted('share');
                setStage('understand');
                setUnderstandError(null);
              }}
            >
            Continue
            </button>
          </div>
        </section>
      )}

      {stage === 'understand' && (
        <section className="card">
          <h2>Clarify what matters (optional)</h2>
          <p className="helper">
            Answer any of these four prompts—or skip straight to structuring your decision with Gemini.
          </p>

          <div className="field">
            <label htmlFor="clarify-options">
              1. What options are available to you, and which way are you currently leaning (if any)?
            </label>
            <textarea
              id="clarify-options"
              rows={3}
              placeholder={understandPlaceholders.options}
              value={clarifications.options}
              onChange={(e) => {
                setClarifications((c) => ({ ...c, options: e.target.value }));
                setInputVersion((v) => v + 1);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="clarify-gains">2. What are up to 5 things you&apos;re hoping to gain?</label>
            <textarea
              id="clarify-gains"
              rows={6}
              placeholder={understandPlaceholders.gains}
              value={clarifications.gains}
              onChange={(e) => {
                setClarifications((c) => ({ ...c, gains: e.target.value }));
                setInputVersion((v) => v + 1);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="clarify-worries">
              3. What are up to 5 things you&apos;re most worried about losing?
            </label>
            <textarea
              id="clarify-worries"
              rows={6}
              placeholder={understandPlaceholders.worries}
              value={clarifications.worries}
              onChange={(e) => {
                setClarifications((c) => ({ ...c, worries: e.target.value }));
                setInputVersion((v) => v + 1);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="clarify-outcome">
              4. Imagine it&apos;s six months after you&apos;ve made your decision, and things have
              turned out well. What does your life look like? What are you doing, how are you
              feeling, and what makes you believe you made the right choice?
            </label>
            <textarea
              id="clarify-outcome"
              rows={6}
              placeholder={understandPlaceholders.outcome}
              value={clarifications.successAndFailure}
              onChange={(e) => {
                setClarifications((c) => ({ ...c, successAndFailure: e.target.value }));
                setInputVersion((v) => v + 1);
              }}
            />
          </div>

          <div className="actions-row">
            <button type="button" className="btn" onClick={() => setStage('share')}>
              Back to Share
            </button>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={loadingUnderstand || !rawDescription.trim()}
                onClick={handleAnalyzeUnderstand}
              >
                {loadingUnderstand
                  ? 'Analyzing with Gemini…'
                  : structured
                    ? 'Regenerate context'
                    : 'Structure with Gemini'}
              </button>
              {structured && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => goToStage('challenge')}
                >
                  Continue to Challenge
                </button>
              )}
            </div>
          </div>

          {understandError && (
            <div className="error-box" role="alert">
              <strong>Could not complete analysis:</strong> {understandError}
            </div>
          )}

          {structured && (
            <div style={{ marginTop: 24 }}>
              {structured.generatedForVersion !== inputVersion && (
                <div className="stale-banner">
                  <span>
                    You edited your inputs. Click <strong>Regenerate context</strong> to refresh.
                  </span>
                </div>
              )}

              <div className="acknowledgment-box">
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>
                  Decision statement: {structured.data.decision_statement}
                </p>
                <p style={{ margin: 0 }}>{structured.data.acknowledgment}</p>
                <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Model: {structured.model} · Validated structured JSON
                </p>
              </div>

              <div className="epistemic-grid epistemic-grid-understand">
                <div className="epistemic-card">
                  <h3>Options</h3>
                  <ul>
                    {structured.data.options.length ? (
                      structured.data.options.map((o, i) => <li key={i}>{o}</li>)
                    ) : (
                      <li>No explicit options confirmed yet</li>
                    )}
                  </ul>
                  {structured.data.current_leaning && (
                    <p style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>
                      <strong>Tentative leaning:</strong> {structured.data.current_leaning}
                    </p>
                  )}
                </div>

                <div className="epistemic-card">
                  <h3>User-provided facts</h3>
                  <ul>
                    {structured.data.user_provided_facts.length ? (
                      structured.data.user_provided_facts.map((f, i) => <li key={i}>{f}</li>)
                    ) : (
                      <li>None stated yet</li>
                    )}
                  </ul>
                </div>

                <div className="epistemic-card">
                  <h3>Assumptions</h3>
                  <ul>
                    {structured.data.user_assumptions.length ? (
                      structured.data.user_assumptions.map((a, i) => <li key={i}>{a}</li>)
                    ) : (
                      <li>None identified yet</li>
                    )}
                  </ul>
                </div>

                <div className="epistemic-card epistemic-card-full">
                  <h3>Unknowns &amp; missing info</h3>
                  <ul>
                    {[...structured.data.unknowns, ...structured.data.missing_information].map(
                      (u, i) => (
                        <li key={i}>{u}</li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {stage === 'challenge' && (
        <ChallengeStage
          challenge={challenge}
          isStale={Boolean(challenge && challenge.generatedForVersion !== inputVersion)}
          loading={loadingChallenge}
          error={challengeError}
          onGenerate={handleGenerateChallenge}
          onBack={() => setStage('understand')}
          onNext={() => goToStage('explore')}
        />
      )}

      {stage === 'explore' && (
        <ExploreStage
          activeMode={activeExploreMode}
          onSelectMode={handleSelectExploreMode}
          lenses={lenses}
          rehearsal={rehearsal}
          lensesStale={Boolean(lenses && lenses.generatedForVersion !== inputVersion)}
          rehearsalStale={Boolean(rehearsal && rehearsal.generatedForVersion !== inputVersion)}
          loadingLenses={loadingLenses}
          loadingRehearsal={loadingRehearsal}
          lensesError={lensesError}
          rehearsalError={rehearsalError}
          selectedLensIds={selectedLensIds}
          checklistStatuses={checklistStatuses}
          savedInsights={savedInsights}
          onGenerateLenses={handleGenerateLenses}
          onGenerateRehearsal={handleGenerateRehearsal}
          onToggleLens={(lensId) =>
            setSelectedLensIds((prev) =>
              prev.includes(lensId) ? prev.filter((id) => id !== lensId) : [...prev, lensId],
            )
          }
          onChangeChecklistStatus={(qId, status) =>
            setChecklistStatuses((prev) => ({ ...prev, [qId]: status }))
          }
          onToggleInsight={(insight) =>
            setSavedInsights((prev) =>
              prev.includes(insight) ? prev.filter((x) => x !== insight) : [...prev, insight],
            )
          }
          onBack={() => setStage('challenge')}
          onEditOptions={() => setStage('understand')}
          onNext={() => goToStage('reflect')}
        />
      )}

      {stage === 'reflect' && decisionContext && (
        <ReflectStage
          context={decisionContext}
          record={record}
          isStale={Boolean(record && record.generatedForVersion !== inputVersion)}
          loading={loadingRecord}
          error={recordError}
          onGenerate={handleGenerateRecord}
          onUpdateRecord={(updated) =>
            setRecord((prev) => (prev ? { ...prev, data: updated } : prev))
          }
          onBack={() => setStage('explore')}
        />
      )}
    </div>
  );
}
