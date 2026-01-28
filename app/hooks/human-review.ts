import { defineHook } from 'workflow';

interface HumanReviewEvent {
  reviewId: number;
  decision: 'approved' | 'rejected';
  reason?: string;
}

/**
 * Hook for waiting on human review decisions
 * Allows workflows to pause and resume when an approval or rejection is received
 */
export const humanReviewHook = defineHook<HumanReviewEvent>();
