import { getInternalApiHeaders } from "@/lib/workflow-api";
import { fetch } from "workflow";

export async function createReviewDecisionStep(input: {
  applicationId: number;
  workflowRunId: string;
}) {
  'use step';
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/applications/${input.applicationId}/review-decision`,
    {
      method: 'POST',
      headers: getInternalApiHeaders(),
      body: JSON.stringify({
        workflowRunId: input.workflowRunId,
        status: 'pending',
      }),
    }
  );
  
  return response.json();
}
