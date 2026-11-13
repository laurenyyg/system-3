import type { DecisionContext, DecisionRecordObject } from './schemas.js';

function bullets(items: string[], fallback = 'None specified'): string {
  if (!items.length) return `- ${fallback}`;
  return items.map((item) => `- ${item}`).join('\n');
}

export function renderDecisionRecordMarkdown(
  context: DecisionContext,
  record: DecisionRecordObject,
  dateStr = new Date().toISOString().slice(0, 10),
): string {
  const deadlineLine = context.deadline ? `**Deadline:** ${context.deadline}` : '**Deadline:** Not specified';
  const inclinationLine = record.current_inclination?.trim()
    ? record.current_inclination.trim()
    : 'Not specified';
  const reviewDateLine = record.review_date?.trim() ? record.review_date.trim() : 'Not specified';

  return `# System 3 — Decision Record

**Date:** ${dateStr}  
${deadlineLine}

> *Note: System 3 does not decide for you. Potential blind spots are **hypotheses**, and future rehearsals are **hypothetical scenarios**—not predictions or verified external facts.*

---

## 1. Decision Summary
${record.decision_summary}

## 2. Options Under Consideration & Current Inclination
${bullets(context.options, 'No explicit options confirmed')}

**Current inclination (optional):** ${inclinationLine}

## 3. Values, Desired Outcome & Feared Outcomes
**Goals / what matters most:**
${bullets(context.goals)}

**Feared outcomes:**
${bullets(context.fears)}

**Success definition:** ${context.successDefinition || 'Not specified'}  
**Failure definition:** ${context.failureDefinition || 'Not specified'}

## 4. Epistemic Audit: Knowns vs. Assumptions vs. To Verify
**Known information (user-provided facts):**
${bullets(record.knowns)}

**Assumptions:**
${bullets(record.assumptions)}

**Things to verify:**
${bullets(record.verify)}

## 5. Potential Blind Spots & Interacting Pressures *(Hypotheses, not diagnoses)*
${bullets(record.potential_blind_spots, 'None recorded')}

## 6. Selected Lenses & Unresolved Questions
${bullets(record.lens_questions, 'None recorded')}

## 7. Key Takeaways from Future Rehearsals *(Hypothetical scenarios)*
${bullets(record.rehearsal_takeaways, 'None recorded')}

## 8. Top Three Next Actions Before the Deadline
${record.top_three_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

## 9. What Evidence Would Change My Mind?
${record.mind_changing_evidence}

## 10. What Would Make This Worthwhile, Even If It Doesn't Go According to Plan?
${record.worthwhile_even_if}

## 11. Letter to Future Me
**Target review date:** ${reviewDateLine}

${record.letter_to_future_me}
`;
}

export function renderFutureSelfEmailDraft(
  context: DecisionContext,
  record: DecisionRecordObject,
): string {
  const reviewDate = record.review_date?.trim() || '[Choose a review date]';
  return `Subject: Decision check-in — ${context.decisionStatement}

[DRAFT — Not automatically scheduled or sent. Save this in your calendar or email drafts for ${reviewDate}.]

Dear Future Me,

${record.letter_to_future_me}

What I was weighing:
${record.decision_summary}

What evidence I said would change my mind:
${record.mind_changing_evidence}

What would make this worthwhile regardless:
${record.worthwhile_even_if}

Top actions I planned before my deadline (${context.deadline || 'unspecified'}):
${record.top_three_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}
`;
}
