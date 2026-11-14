import { useState } from 'react';
import type { DecisionContext, DecisionRecordObject } from '../../shared/schemas';
import {
  renderDecisionRecordMarkdown,
  renderFutureSelfEmailDraft,
} from '../../shared/recordMarkdown';

interface Props {
  context: DecisionContext;
  record?: {
    generatedForVersion: number;
    model: string;
    data: DecisionRecordObject;
  };
  isStale: boolean;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
  onUpdateRecord: (updated: DecisionRecordObject) => void;
  onBack: () => void;
}

export function ReflectStage({
  context,
  record,
  isStale,
  loading,
  error,
  onGenerate,
  onUpdateRecord,
  onBack,
}: Props) {
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);

  const markdown = record
    ? renderDecisionRecordMarkdown(context, record.data)
    : '';
  const emailDraft = record
    ? renderFutureSelfEmailDraft(context, record.data)
    : '';

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsg(`${label} copied to clipboard.`);
      setTimeout(() => setCopiedMsg(null), 3000);
    } catch {
      setCopiedMsg('Clipboard access blocked — select and copy from the preview below.');
    }
  }

  function downloadMarkdown() {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system3-decision-record-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card">
      <h2>Your Decision Record</h2>
      <p className="helper">
        Bring together everything you&apos;ve shared, challenged, and explored into one Decision
        Record—capturing your thinking, open questions, and next steps.
      </p>

      {isStale && (
        <div className="stale-banner">
          <span>Your upstream inputs changed since this Decision Record was composed.</span>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={loading}
            onClick={onGenerate}
          >
            Regenerate record
          </button>
        </div>
      )}

      {!record && !loading && (
        <button type="button" className="btn btn-primary" onClick={onGenerate}>
          Create My Decision Record
        </button>
      )}

      {loading && <p className="helper">Composing your Decision Record with Gemini…</p>}

      {error && (
        <div className="error-box" role="alert">
          <strong>Could not compose Decision Record:</strong> {error}
          <div style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-sm" onClick={onGenerate}>
              Retry
            </button>
          </div>
        </div>
      )}

      {record && (
        <div className="stack">
          <div className="field">
            <label htmlFor="rec-inclination">Current inclination (optional)</label>
            <input
              id="rec-inclination"
              type="text"
              placeholder="Leave blank if undecided"
              value={record.data.current_inclination ?? ''}
              onChange={(e) =>
                onUpdateRecord({
                  ...record.data,
                  current_inclination: e.target.value || null,
                })
              }
            />
          </div>

          <div className="field">
            <label htmlFor="rec-mind-change">What evidence would change my mind?</label>
            <textarea
              id="rec-mind-change"
              rows={2}
              value={record.data.mind_changing_evidence}
              onChange={(e) =>
                onUpdateRecord({
                  ...record.data,
                  mind_changing_evidence: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label htmlFor="rec-worthwhile">
              What would make this decision worthwhile, even if it doesn&apos;t go according to plan?
            </label>
            <textarea
              id="rec-worthwhile"
              rows={2}
              value={record.data.worthwhile_even_if}
              onChange={(e) =>
                onUpdateRecord({
                  ...record.data,
                  worthwhile_even_if: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label htmlFor="rec-letter">Letter to Future Me</label>
            <textarea
              id="rec-letter"
              rows={4}
              value={record.data.letter_to_future_me}
              onChange={(e) =>
                onUpdateRecord({
                  ...record.data,
                  letter_to_future_me: e.target.value,
                })
              }
            />
          </div>

          <div className="field">
            <label htmlFor="rec-review-date">Desired review date (optional)</label>
            <input
              id="rec-review-date"
              type="text"
              placeholder="e.g., 2027-02-01 or 3 months from today"
              value={record.data.review_date ?? ''}
              onChange={(e) =>
                onUpdateRecord({
                  ...record.data,
                  review_date: e.target.value || null,
                })
              }
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => copyText(markdown, 'Markdown Decision Record')}
            >
              Copy Markdown
            </button>
            <button type="button" className="btn" onClick={downloadMarkdown}>
              Download .md
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => copyText(emailDraft, 'Future-self email draft')}
            >
              Copy email to future self (draft)
            </button>
          </div>

          <p className="agency-note">
            Future-self email is a <strong>local draft only</strong>—System 3 does not schedule or
            send emails automatically.
          </p>

          {copiedMsg && (
            <div className="acknowledgment-box" style={{ marginBottom: 0 }}>
              {copiedMsg}
            </div>
          )}

          <div>
            <h3>Markdown Preview</h3>
            <pre className="markdown-preview">{markdown}</pre>
          </div>
        </div>
      )}

      <div className="actions-row">
        <button type="button" className="btn" onClick={onBack}>
          Back to Explore
        </button>
        {record && (
          <button type="button" className="btn" disabled={loading} onClick={onGenerate}>
            Regenerate Record
          </button>
        )}
      </div>
    </section>
  );
}
