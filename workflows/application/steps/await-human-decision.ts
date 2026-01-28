import { fetch } from 'workflow';
import { getInternalApiHeaders } from '@/lib/workflow-api';

interface HumanReviewEvent {
  reviewId: number;
  decision: 'approved' | 'rejected';
  reason?: string;
}

interface AwaitHumanDecisionInput {
  applicationId: number;
  path: 'manual_review' | 'auto_approve';
  workflowRunId: string;
  humanReviewHook: any; // Hook type from workflow
}

interface AwaitHumanDecisionOutput {
  applicationId: number;
  decision: 'approved' | 'rejected' | 'auto_approved';
  reason?: string;
}

export async function awaitHumanDecisionStep(
  input: AwaitHumanDecisionInput
): Promise<AwaitHumanDecisionOutput> {
  'use step';
  const { applicationId, path, workflowRunId, humanReviewHook } = input;

  if (path !== 'manual_review') {
    console.log(
      `[Await Human Decision] Skipping for auto-approve path (application ${applicationId})`
    );
    return {
      applicationId,
      decision: 'auto_approved',
    };
  }

  console.log(
    `[Await Human Decision] Waiting for human decision on application ${applicationId}`
  );

  const existingResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}/review-decision`,
    {
      headers: getInternalApiHeaders(),
    }
  );
  const existingReview = await existingResponse.json();

  if (!existingReview) {
    // Create review decision record via API
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}/review-decision`,
      {
        method: 'POST',
        headers: getInternalApiHeaders(),
        body: JSON.stringify({
          workflowRunId,
          status: 'pending',
        }),
      }
    );
  }

  // Wait for human review decision via hook events
  const reviewEvents = humanReviewHook.create({
    token: `app-${applicationId}`,
  });

  for await (const event of reviewEvents) {
    console.log(
      `[Await Human Decision] Decision received for ${applicationId}: ${event.decision}`
    );

    // Update the review record via API
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}/review-decision`,
      {
        method: 'PATCH',
        headers: getInternalApiHeaders(),
        body: JSON.stringify({
          decision: event.decision,
          reason: event.reason,
          status: 'completed',
        }),
      }
    );

    return {
      applicationId,
      decision: event.decision as 'approved' | 'rejected',
      reason: event.reason,
    };
  }

  throw new Error(
    `Failed to receive human decision for application ${applicationId}`
  );
}
