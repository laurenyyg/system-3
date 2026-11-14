import { useState } from 'react';
import type {
  ChecklistStatus,
  LensesResult,
  RehearsalResult,
} from '../../shared/schemas';

interface Props {
  activeMode: 'lenses' | 'rehearse' | null;
  onSelectMode: (mode: 'lenses' | 'rehearse') => void;
  lenses?: { generatedForVersion: number; model: string; data: LensesResult };
  rehearsal?: { generatedForVersion: number; model: string; data: RehearsalResult };
  lensesStale: boolean;
  rehearsalStale: boolean;
  loadingLenses: boolean;
  loadingRehearsal: boolean;
  lensesError: string | null;
  rehearsalError: string | null;
  selectedLensIds: string[];
  checklistStatuses: Record<string, ChecklistStatus>;
  savedInsights: string[];
  onGenerateLenses: () => void;
  onGenerateRehearsal: () => void;
  onToggleLens: (lensId: string) => void;
  onChangeChecklistStatus: (questionId: string, status: ChecklistStatus) => void;
  onToggleInsight: (insight: string) => void;
  onBack: () => void;
  onEditOptions: () => void;
  onNext: () => void;
}

const SCENARIO_LABELS: Record<'positive' | 'premortem' | 'mixed', string> = {
  positive: 'Better than expected',
  premortem: 'Premortem (imagine an adverse outcome)',
  mixed: 'Mixed / unexpected tradeoffs',
};

export function ExploreStage({
  activeMode,
  onSelectMode,
  lenses,
  rehearsal,
  lensesStale,
  rehearsalStale,
  loadingLenses,
  loadingRehearsal,
  lensesError,
  rehearsalError,
  selectedLensIds,
  checklistStatuses,
  savedInsights,
  onGenerateLenses,
  onGenerateRehearsal,
  onToggleLens,
  onChangeChecklistStatus,
  onToggleInsight,
  onBack,
  onEditOptions,
  onNext,
}: Props) {
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);

  const activePath =
    rehearsal?.data.paths[selectedPathIndex] ?? rehearsal?.data.paths[0];

  return (
    <section className="card">
      <h2>Explore Unknowns &amp; Possible Futures</h2>
      <p className="helper">
        Choose how you want to explore next. You can use either mode in any order, and your
        selections and checklist progress are preserved as you switch.
      </p>

      {activeMode === null ? (
        <div className="epistemic-grid" style={{ marginTop: 12, marginBottom: 8 }}>
          <article className="subcard" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3>Choose Your Lenses</h3>
              <p className="helper" style={{ marginBottom: 0 }}>
                Explore your decision from different perspectives and generate actionable
                checklists.
              </p>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onSelectMode('lenses')}
              >
                Choose Your Lenses
              </button>
            </div>
          </article>

          <article className="subcard" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3>Rehearse the Future</h3>
              <p className="helper" style={{ marginBottom: 0 }}>
                Explore plausible future scenarios, including positive, premortem, and mixed
                outcomes.
              </p>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onSelectMode('rehearse')}
              >
                Rehearse the Future
              </button>
            </div>
          </article>
        </div>
      ) : (
        <>
          <div className="tabs" role="tablist" aria-label="Explore modes">
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'lenses'}
              className="tab-btn"
              onClick={() => onSelectMode('lenses')}
            >
              1. Choose Your Lenses
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'rehearse'}
              className="tab-btn"
              onClick={() => onSelectMode('rehearse')}
            >
              2. Rehearse the Future
            </button>
          </div>

          {activeMode === 'lenses' && (
        <div>
          {lensesStale && (
            <div className="stale-banner">
              <span>Inputs changed since these lenses were generated.</span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={loadingLenses}
                onClick={onGenerateLenses}
              >
                Regenerate lenses
              </button>
            </div>
          )}

          {!lenses && !loadingLenses && (
            <button type="button" className="btn btn-primary" onClick={onGenerateLenses}>
              Generate 5 Personalized Lenses
            </button>
          )}

          {loadingLenses && (
            <p className="helper">Generating five tailored lenses and verification checklists…</p>
          )}

          {lensesError && (
            <div className="error-box" role="alert">
              <strong>Could not generate lenses:</strong> {lensesError}
              <div style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-sm" onClick={onGenerateLenses}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {lenses && (
            <div className="stack">
              <p className="agency-note">
                Five perspectives tailored to your decision (3 recommended). Click a lens to expand
                its checklist and track what you need to verify.
              </p>
              {lenses.data.lenses.map((lens) => {
                const isSelected = selectedLensIds.includes(lens.id);
                return (
                  <article
                    key={lens.id}
                    className={`subcard ${lens.recommended ? 'recommended' : ''}`}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <strong>{lens.name}</strong>{' '}
                        {lens.recommended && (
                          <span className="badge badge-accent">Recommended</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => onToggleLens(lens.id)}
                      >
                        {isSelected ? 'Hide checklist' : `Open checklist (${lens.questions.length})`}
                      </button>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {lens.recommendation_reason}
                    </p>

                    {isSelected && (
                      <div style={{ marginTop: 12 }}>
                        {lens.questions.map((q) => {
                          const status = checklistStatuses[q.id] || 'not_checked';
                          return (
                            <div key={q.id} className="checklist-item">
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  gap: 10,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <strong style={{ flex: '1 1 280px' }}>{q.question}</strong>
                                <select
                                  aria-label={`Status for ${q.question}`}
                                  style={{ width: 'auto', minWidth: 150, padding: '6px 8px' }}
                                  value={status}
                                  onChange={(e) =>
                                    onChangeChecklistStatus(
                                      q.id,
                                      e.target.value as ChecklistStatus,
                                    )
                                  }
                                >
                                  <option value="not_checked">Not checked</option>
                                  <option value="to_investigate">To investigate</option>
                                  <option value="answered">Answered</option>
                                </select>
                              </div>
                              <p style={{ margin: '6px 0 2px', fontSize: '0.88rem' }}>
                                <strong>Why it matters:</strong> {q.why_it_matters}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '0.88rem',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                <strong>Next step:</strong> {q.next_step}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeMode === 'rehearse' && (
        <div>
          {rehearsalStale && (
            <div className="stale-banner">
              <span>Inputs changed since these scenarios were generated.</span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={loadingRehearsal}
                onClick={onGenerateRehearsal}
              >
                Regenerate rehearsal
              </button>
            </div>
          )}

          {!rehearsal && !loadingRehearsal && (
            <button type="button" className="btn btn-primary" onClick={onGenerateRehearsal}>
              Rehearse Possible Futures with Gemini
            </button>
          )}

          {loadingRehearsal && (
            <p className="helper">
              Generating positive, premortem, and mixed hypothetical scenarios…
            </p>
          )}

          {rehearsalError && (
            <div className="error-box" role="alert">
              <strong>Could not generate rehearsal:</strong> {rehearsalError}
              <div style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-sm" onClick={onGenerateRehearsal}>
                  Retry
                </button>
              </div>
            </div>
          )}

          {rehearsal && activePath && (
            <div className="stack">
              <div className="badge" style={{ alignSelf: 'flex-start' }}>
                {rehearsal.data.disclaimer} · Model: {rehearsal.model}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {rehearsal.data.paths.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`btn btn-sm ${idx === selectedPathIndex ? 'btn-primary' : ''}`}
                    onClick={() => setSelectedPathIndex(idx)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {activePath.is_hypothetical_alternative && (
                <div className="stale-banner" style={{ marginBottom: 0 }}>
                  <span>
                    <span className="badge badge-warn">Hypothetical &amp; unverified alternative</span>{' '}
                    You have not confirmed this second option. You can clarify your real alternative
                    in Understand.
                  </span>
                  <button type="button" className="btn btn-sm" onClick={onEditOptions}>
                    Clarify alternative
                  </button>
                </div>
              )}

              <div className="stack">
                {activePath.scenarios.map((sc) => {
                  const insightText = `[${activePath.label} — ${sc.kind}] ${sc.title}: ${sc.surprise_question}`;
                  const isSaved = savedInsights.includes(insightText);
                  return (
                    <article key={sc.kind} className="subcard">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <strong>
                          {SCENARIO_LABELS[sc.kind]}: {sc.title}
                        </strong>
                        <button
                          type="button"
                          className={`btn btn-sm ${isSaved ? 'btn-primary' : ''}`}
                          onClick={() => onToggleInsight(insightText)}
                        >
                          {isSaved ? 'Added to Record ✓' : 'Add to Decision Record'}
                        </button>
                      </div>
                      <p style={{ margin: '8px 0' }}>{sc.vignette}</p>
                      <p style={{ margin: '6px 0', fontSize: '0.88rem' }}>
                        <strong>Drivers / assumptions:</strong> {sc.drivers.join('; ')}
                      </p>
                      <p style={{ margin: '6px 0', fontSize: '0.9rem' }}>
                        <strong>Surprise question:</strong> {sc.surprise_question}
                      </p>
                      <p
                        style={{
                          margin: '6px 0 0',
                          fontSize: '0.88rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <strong>Action now:</strong> {sc.action_now}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}

      <div className="actions-row">
        <button type="button" className="btn" onClick={onBack}>
          Back to Challenge
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Continue to Reflect
        </button>
      </div>
    </section>
  );
}
