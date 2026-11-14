import { z } from 'zod';

export const StageSchema = z.enum([
  'share',
  'understand',
  'challenge',
  'explore',
  'reflect',
]);
export type Stage = z.infer<typeof StageSchema>;

export const ChecklistStatusSchema = z.enum([
  'not_checked',
  'to_investigate',
  'answered',
  'not_relevant',
]);
export type ChecklistStatus = z.infer<typeof ChecklistStatusSchema>;

export const DecisionContextSchema = z.object({
  decisionStatement: z.string(),
  deadline: z.string().nullable().optional(),
  options: z.array(z.string()),
  currentLeaning: z.string().nullable().optional(),
  goals: z.array(z.string()),
  fears: z.array(z.string()),
  successDefinition: z.string().nullable().optional(),
  failureDefinition: z.string().nullable().optional(),
  userProvidedFacts: z.array(z.string()),
  userAssumptions: z.array(z.string()),
  unknowns: z.array(z.string()),
});
export type DecisionContext = z.infer<typeof DecisionContextSchema>;

export const MAX_SHARE_WORDS = 300;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// 1. structureDecision
export const StructureDecisionInputSchema = z.object({
  rawDescription: z
    .string()
    .trim()
    .min(1, 'Please describe your decision.')
    .max(6000)
    .refine((val) => countWords(val) <= MAX_SHARE_WORDS, {
      message: `Please keep your situation under ${MAX_SHARE_WORDS} words.`,
    }),
  deadline: z.string().trim().max(200).nullable().optional(),
  clarifications: z
    .object({
      options: z.string().trim().max(2000).optional(),
      gains: z.string().trim().max(2000).optional(),
      worries: z.string().trim().max(2000).optional(),
      successAndFailure: z.string().trim().max(2000).optional(),
    })
    .optional(),
});
export type StructureDecisionInput = z.infer<typeof StructureDecisionInputSchema>;

export const StructureDecisionOutputSchema = z.object({
  acknowledgment: z.string().min(1),
  decision_statement: z.string().min(1),
  options: z.array(z.string()),
  current_leaning: z.string().nullable().optional(),
  goals: z.array(z.string()),
  fears: z.array(z.string()),
  success_definition: z.string().nullable().optional(),
  failure_definition: z.string().nullable().optional(),
  user_provided_facts: z.array(z.string()),
  user_assumptions: z.array(z.string()),
  unknowns: z.array(z.string()),
  missing_information: z.array(z.string()),
});
export type StructureDecisionOutput = z.infer<typeof StructureDecisionOutputSchema>;

// 2. analyzeChallenge
export const BlindSpotSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  evidence_quote: z.string().nullable(),
  evidence_status: z.enum(['quoted_user_text', 'exploratory_question']),
  confidence_qualifier: z.string().min(1),
  hypothesis: z.string().min(1),
  challenge_question: z.string().min(1),
  verification_action: z.string().min(1),
});

export const InteractionSchema = z.object({
  id: z.string().min(1),
  forces: z.array(z.string().min(1)).min(2).max(3),
  evidence_quotes: z.array(z.string()),
  hypothesis: z.string().min(1),
  interrupting_question: z.string().min(1),
});

export const ChallengeResultSchema = z.object({
  blind_spots: z.array(BlindSpotSchema).min(2).max(4),
  interactions: z.array(InteractionSchema).max(2),
  no_interaction_reason: z.string().nullable().optional(),
  caveat: z.string().min(1),
});
export type ChallengeResult = z.infer<typeof ChallengeResultSchema>;

// 3. generateLenses
export const LensQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  why_it_matters: z.string().min(1),
  next_step: z.string().min(1),
});

export const LensSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  recommended: z.boolean(),
  recommendation_reason: z.string().min(1),
  questions: z.array(LensQuestionSchema).min(3).max(5),
});

export const LensesResultSchema = z.object({
  lenses: z.array(LensSchema).length(5),
});
export type LensesResult = z.infer<typeof LensesResultSchema>;

// 4. generateRehearsal
export const ScenarioSchema = z.object({
  kind: z.enum(['positive', 'premortem', 'mixed']),
  title: z.string().min(1),
  vignette: z.string().min(1),
  drivers: z.array(z.string().min(1)).min(1),
  surprise_question: z.string().min(1),
  action_now: z.string().min(1),
});

export const RehearsalPathSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  is_hypothetical_alternative: z.boolean().optional(),
  scenarios: z.array(ScenarioSchema).length(3),
});

export const RehearsalResultSchema = z.object({
  paths: z.array(RehearsalPathSchema).min(2),
  disclaimer: z.string().min(1),
});
export type RehearsalResult = z.infer<typeof RehearsalResultSchema>;

// 5. composeDecisionRecord
export const DecisionRecordObjectSchema = z.object({
  decision_summary: z.string().min(1),
  current_inclination: z.string().nullable(),
  knowns: z.array(z.string()),
  assumptions: z.array(z.string()),
  verify: z.array(z.string()),
  potential_blind_spots: z.array(z.string()),
  lens_questions: z.array(z.string()),
  rehearsal_takeaways: z.array(z.string()),
  top_three_actions: z.array(z.string()).min(1).max(3),
  mind_changing_evidence: z.string().min(1),
  worthwhile_even_if: z.string().min(1),
  letter_to_future_me: z.string().min(1),
  review_date: z.string().nullable(),
});
export type DecisionRecordObject = z.infer<typeof DecisionRecordObjectSchema>;

// Input schemas for stage 2-5 API calls
export const ContextPayloadSchema = z.object({
  rawDescription: z.string().max(6000),
  context: DecisionContextSchema,
});

export const RecordPayloadSchema = z.object({
  context: DecisionContextSchema,
  challenge: ChallengeResultSchema.optional(),
  selectedLenses: z
    .array(
      z.object({
        name: z.string(),
        unresolvedQuestions: z.array(z.string()),
      }),
    )
    .optional(),
  savedInsights: z.array(z.string()).optional(),
});
