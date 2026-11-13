import { useEffect, useMemo, useState } from 'react';
import type {
  ChallengeResult,
  ChecklistStatus,
  DecisionContext,
  DecisionRecordObject,
  LensesResult,
  RehearsalResult,
  Stage,
  StructureDecisionOutput,
} from '../shared/schemas';
import { callAnalyze } from './api';
import { ChallengeStage } from './components/ChallengeStage';
import { ExploreStage } from './components/ExploreStage';
import { ReflectStage } from './components/ReflectStage';

const STAGES: { id: Stage; label: string; number: number }[] = [
  { id: 'share', label: 'Share', number: 1 },
  { id: 'understand', label: 'Understand', number: 2 },
  { id: 'challenge', label: 'Challenge', number: 3 },
  { id: 'explore', label: 'Explore', number: 4 },
  { id: 'reflect', label: 'Reflect', number: 5 },
];

const EXAMPLE_DESCRIPTION =
  "I have one week to decide whether to move to Singapore for work. It feels like a once-in-a-lifetime opportunity, but I'm stressed and worried about what I haven't considered.";

const STORAGE_KEY = 'system3.decision.v1';

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
  record?: Versioned<DecisionRecordObject>;
}

export default function App() {
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
    record,
  ]);

  const decisionContext: DecisionContext | null = useMemo(() => {
    if (!structured) return null;
    return {
      decisionStatement: structured.data.decision_statement,
      deadline: deadline.trim() || null,
      options: structured.data.options,
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
      // Auto-expand recommended lenses on first generation
      setSelectedLensIds((prev) =>
        prev.length > 0
          ? prev
          : result.data.lenses.filter((l) => l.recommended).map((l) => l.id),
      );
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
        .filter((l) => selectedLensIds.includes(l.id))
        .map((l) => ({
          name: l.name,
          unresolvedQuestions: l.questions
            .filter((q) => checklistStatuses[q.id] !== 'answered')
            .map((q) => q.question),
        }));

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

  function goToStage(nextStage: Stage) {
    setStage(nextStage);
    if (nextStage === 'challenge' && decisionContext && !challenge && !loadingChallenge) {
      void handleGenerateChallenge();
    }
    if (nextStage === 'explore' && decisionContext && !lenses && !loadingLenses) {
      void handleGenerateLenses();
    }
    if (nextStage === 'reflect' && decisionContext && !record && !loadingRecord) {
      void handleGenerateRecord();
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1 className="brand-title">System 3</h1>
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
          <button type="button" className="btn btn-sm" onClick={handleClearDecision}>
            Clear this decision
          </button>
        </div>
      </header>

      <div className="privacy-note">
        <strong>Privacy &amp; agency:</strong> Analysis inputs are sent to the Gemini API to generate
        questions and structured context. Nothing is stored in a database, and local browser saving
        is off unless you enable <em>Save on this device</em>.
      </div>

      <nav aria-label="Decision workflow progress" className="progress-tracker">
        {STAGES.map((item) => {
          const isCurrent = stage === item.id;
          const isDone = completedStages.includes(item.id);
          const canNavigate =
            item.id === 'share' ||
            (item.id === 'understand' && Boolean(rawDescription.trim())) ||
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
              disabled={!rawDescription.trim()}
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
            <label htmlFor="clarify-options">1. What are the options you&apos;re considering?</label>
            <input
              id="clarify-options"
              type="text"
              placeholder='e.g., Accept the transfer, negotiate remote/delay, or "I am not sure"'
              value={clarifications.options}
              onChange={(e) => {
                setClarifications((c) => ({ ...c, options: e.target.value }));
                setInputVersion((v) => v + 1);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="clarify-gains">2. What matters most to you / what are you hoping to gain?</label>
            <input
              id="clarify-gains"
              type="text"
              placeholder="e.g., Career growth, financial stability, adventure"
              value={clarifications.gains}
              onChange={(e) => {
                setClarifications((c) => ({ ...c, gains: e.target.value }));
                setInputVersion((v) => v + 1);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="clarify-worries">3. What worries you most / what might you lose?</label>
            <input
              id="clarify-worries"
              type="text"
              placeholder="e.g., Visa/healthcare contingencies, leaving family, job security"
              value={clarifications.worries}
              onChange={(e) => {
                setClarifications((c) => ({ ...c, worries: e.target.value }));
                setInputVersion((v) => v + 1);
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="clarify-outcome">4. What would success and failure look like?</label>
            <input
              id="clarify-outcome"
              type="text"
              placeholder="e.g., Success = thriving in a year; Failure = feeling trapped with few options"
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
                <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Model: {structured.model} · Validated structured JSON
                </p>
              </div>

              <div className="epistemic-grid">
                <div className="epistemic-card">
                  <h3>Options</h3>
                  <ul>
                    {structured.data.options.length ? (
                      structured.data.options.map((o, i) => <li key={i}>{o}</li>)
                    ) : (
                      <li>No explicit options confirmed yet</li>
                    )}
                  </ul>
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

                <div className="epistemic-card">
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
