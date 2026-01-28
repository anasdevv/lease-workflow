import { getInternalApiHeaders } from "@/lib/workflow-api";
import { fetch } from "workflow";

export async function updateReviewDecisionStep(input: {
  applicationId: number;
  decision: string;
  reason?: string;
}) {
  'use step';
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/applications/${input.applicationId}/review-decision`,
    {
      method: 'PATCH',
      headers: getInternalApiHeaders(),
      body: JSON.stringify({
        decision: input.decision,
        reason: input.reason,
        status: 'completed',
      }),
    }
  );
  
  return response.json();
}
