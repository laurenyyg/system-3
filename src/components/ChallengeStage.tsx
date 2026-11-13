import type { ChallengeResult } from '../../shared/schemas';

interface Props {
  challenge?: { generatedForVersion: number; model: string; data: ChallengeResult };
  isStale: boolean;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function ChallengeStage({
  challenge,
  isStale,
  loading,
  error,
  onGenerate,
  onBack,
  onNext,
}: Props) {
  return (
    <section className="card">
      <h2>Challenge Your Thinking</h2>
      <p className="helper">
        Possible blind spots and interacting pressures grounded in your own words. These are{' '}
        <strong>hypotheses to test, not diagnoses</strong>.
      </p>

      {isStale && (
        <div className="stale-banner">
          <span>Your decision inputs changed since this analysis was generated.</span>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={loading}
            onClick={onGenerate}
          >
            {loading ? 'Regenerating…' : 'Regenerate analysis'}
          </button>
        </div>
      )}

      {!challenge && !loading && (
        <div style={{ marginBottom: 16 }}>
          <button type="button" className="btn btn-primary" onClick={onGenerate}>
            Run Challenge Analysis with Gemini
          </button>
        </div>
      )}

      {loading && <p className="helper">Analyzing potential blind spots and interactions with Gemini…</p>}

      {error && (
        <div className="error-box" role="alert">
          <strong>Could not complete Challenge analysis:</strong> {error}
          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-sm" onClick={onGenerate}>
              Retry
            </button>
          </div>
        </div>
      )}

      {challenge && (
        <div className="stack">
          <div className="badge" style={{ alignSelf: 'flex-start' }}>
            {challenge.data.caveat} · Model: {challenge.model}
          </div>

          <div>
            <h3>A. Potential Blind Spots</h3>
            <div className="stack">
              {challenge.data.blind_spots.map((spot) => (
                <article key={spot.id} className="subcard">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <strong>{spot.label}</strong>
                    <span className="badge badge-accent">{spot.confidence_qualifier}</span>
                  </div>

                  {spot.evidence_status === 'quoted_user_text' && spot.evidence_quote ? (
                    <div className="quote-box">
                      Evidence from your input: &ldquo;{spot.evidence_quote}&rdquo;
                    </div>
                  ) : (
                    <p style={{ margin: '6px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <em>Not evidenced in your text — an exploratory question worth asking.</em>
                    </p>
                  )}

                  <p style={{ margin: '6px 0' }}>{spot.hypothesis}</p>
                  <p style={{ margin: '6px 0' }}>
                    <strong>Challenge question:</strong> {spot.challenge_question}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <strong>Practical check:</strong> {spot.verification_action}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <h3>B. Lollapalooza / Interacting Pressures</h3>
            {challenge.data.interactions.length > 0 ? (
              <div className="stack">
                {challenge.data.interactions.map((inter) => (
                  <article key={inter.id} className="subcard recommended">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {inter.forces.map((f, i) => (
                        <span key={i} className="badge badge-warn">
                          {f}
                        </span>
                      ))}
                    </div>
                    {inter.evidence_quotes.length > 0 && (
                      <div className="quote-box">
                        Grounded in: {inter.evidence_quotes.map((q) => `“${q}”`).join(' + ')}
                      </div>
                    )}
                    <p style={{ margin: '6px 0' }}>{inter.hypothesis}</p>
                    <p style={{ margin: '6px 0 0' }}>
                      <strong>How to interrupt the loop:</strong> {inter.interrupting_question}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="subcard">
                <p style={{ margin: 0 }}>
                  {challenge.data.no_interaction_reason ||
                    'No clear interaction supported yet from your current inputs.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="actions-row">
        <button type="button" className="btn" onClick={onBack}>
          Back to Understand
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {challenge && (
            <button type="button" className="btn" disabled={loading} onClick={onGenerate}>
              Regenerate
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onNext}>
            Continue to Explore
          </button>
        </div>
      </div>
    </section>
  );
}
