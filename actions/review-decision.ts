'use server';

import { getInternalApiHeaders } from '@/lib/workflow-api';

interface SubmitReviewDecisionInput {
  applicationId: number;
  decision: 'approved' | 'rejected';
  reason?: string;
}

interface SubmitReviewDecisionResponse {
  success: boolean;
  message: string;
  applicationId: number;
  decision: string;
  reason: string | null;
}

/**
 */
export async function submitReviewDecision(
  input: SubmitReviewDecisionInput
): Promise<{ success: boolean; error?: string; data?: SubmitReviewDecisionResponse }> {
  try {
    const { applicationId, decision, reason } = input;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/applications/${applicationId}/decision`,
      {
        method: 'POST',
        headers: getInternalApiHeaders() as Record<string, string>,
        body: JSON.stringify({
          decision,
          reason,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit review decision',
      };
    }

    return {
      success: true,
      data: data as SubmitReviewDecisionResponse,
    };
  } catch (error) {
    console.error('Error submitting review decision:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit review decision',
    };
  }
}
