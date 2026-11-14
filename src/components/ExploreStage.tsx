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
  positive: '🌟 Things Go Better Than Expected',
  premortem: "⚠️ Things Don't Go as Planned",
  mixed: '⚖️ Some Wins, Some Tradeoffs',
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
        selections are preserved as you switch.
      </p>

      {activeMode === null ? (
        <div className="explore-choice-grid">
          <article className="explore-choice-card">
            <div>
              <div className="explore-choice-icon" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 12 12 17 22 12" />
                  <polyline points="2 17 12 22 22 17" />
                </svg>
              </div>
              <h3>Choose Your Lenses</h3>
              <p className="helper" style={{ marginBottom: 0 }}>
                Explore your decision from different perspectives and uncover questions worth
                exploring.
              </p>
            </div>
            <div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onSelectMode('lenses')}
              >
                Explore Lenses
              </button>
            </div>
          </article>

          <article className="explore-choice-card">
            <div>
              <div className="explore-choice-icon" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="6" cy="18" r="2.5" />
                  <circle cx="18" cy="6" r="2.5" />
                  <circle cx="18" cy="18" r="2.5" />
                  <path d="M8.5 18H15.5" />
                  <path d="M8.5 16.8C11.5 15 12 9 15.5 6.8" />
                </svg>
              </div>
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
                Explore Scenarios
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
            <p className="helper">Generating five tailored lenses and questions to explore…</p>
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
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 600 }}>
                  Explore questions you might not have considered. You don&apos;t need to have the
                  answers yet.
                </p>
                <p className="agency-note">
                  Questions you want to explore will be saved to your Decision Record.
                </p>
              </div>
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
                        {isSelected
                          ? 'Hide questions'
                          : `Questions to consider (${lens.questions.length})`}
                      </button>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                      {lens.recommendation_reason}
                    </p>

                    {isSelected && (
                      <div>
                        <div className="lens-questions-header">
                          <strong style={{ fontSize: '0.95rem' }}>Questions to Consider</strong>
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: '0.84rem',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            You don&apos;t need to know the answer now.
                          </p>
                        </div>

                        {lens.questions.map((q) => {
                          const status = checklistStatuses[q.id] || 'not_checked';
                          const toggleStatus = (next: ChecklistStatus) =>
                            onChangeChecklistStatus(q.id, status === next ? 'not_checked' : next);

                          return (
                            <div key={q.id} className="checklist-item">
                              <strong>{q.question}</strong>
                              <p style={{ margin: '6px 0 2px', fontSize: '0.88rem' }}>
                                <strong>Why it matters:</strong> {q.why_it_matters}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '0.88rem',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                <strong>Next step:</strong> {q.next_step}
                              </p>
                              <div
                                className="choice-chips"
                                role="group"
                                aria-label={`Response for ${q.question}`}
                              >
                                <button
                                  type="button"
                                  className="choice-chip"
                                  data-choice="to_investigate"
                                  aria-pressed={status === 'to_investigate'}
                                  onClick={() => toggleStatus('to_investigate')}
                                >
                                  I want to explore this
                                </button>
                                <button
                                  type="button"
                                  className="choice-chip"
                                  data-choice="answered"
                                  aria-pressed={status === 'answered'}
                                  onClick={() => toggleStatus('answered')}
                                >
                                  I&apos;ve already considered this
                                </button>
                                <button
                                  type="button"
                                  className="choice-chip"
                                  data-choice="not_relevant"
                                  aria-pressed={status === 'not_relevant'}
                                  onClick={() => toggleStatus('not_relevant')}
                                >
                                  Not relevant
                                </button>
                              </div>
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
                  const insightText = `[Hypothetical — ${SCENARIO_LABELS[sc.kind]} | ${activePath.label}] ${sc.title}: ${sc.vignette} (Surprise question: ${sc.surprise_question})`;
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
                          color: 'var(--color-text-muted)',
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
          Continue to Your Decision Record
        </button>
      </div>
    </section>
  );
}
