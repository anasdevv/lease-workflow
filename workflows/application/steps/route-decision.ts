import { fetch } from 'workflow';
import { getInternalApiHeaders } from '@/lib/workflow-api';

interface RouteDecisionInput {
  applicationId: number;
  fraudAnalysis: {
    score: number;
    confidence: number;
    signals: unknown[];
  };
  needsReview: boolean;
}

interface RouteDecisionOutput {
  applicationId: number;
  path: 'manual_review' | 'auto_approve';
  fraudAnalysis: {
    score: number;
    confidence: number;
    signals: unknown[];
  };
}

export async function routeDecisionStep(
  input: RouteDecisionInput
): Promise<RouteDecisionOutput> {
  'use step';

  const { applicationId, fraudAnalysis, needsReview } = input;

  console.log(
    `[Route Decision] Determining path for application ${applicationId}`
  );

  if (needsReview) {
    // HIGH RISK - Create review task
    console.log(`[Route Decision] Application ${applicationId} flagged for manual review`);

    // Update application via API (outside workflow bundle)
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}`,
      {
        method: 'PATCH',
        headers: getInternalApiHeaders(),
        body: JSON.stringify({
          status: 'processing',
          workflowStatus: 'paused_for_review',
        }),
      }
    );

    return {
      applicationId,
      path: 'manual_review',
      fraudAnalysis,
    };
  } else {
    // LOW RISK - Auto-approve path
    console.log(
      `[Route Decision] Application ${applicationId} proceeding to auto-approval`
    );

    return {
      applicationId,
      path: 'auto_approve',
      fraudAnalysis,
    };
  }
}
