import { getInternalApiHeaders } from "@/lib/workflow-api";
import { fetch } from "workflow";

/**
 * Helper function to update the last completed step for an application
 * This allows UI to show progress and enables resuming from the last completed step
 */
export async function updateLastCompletedStep(
  applicationId: number,
  stepId: string
): Promise<void> {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}`,
      {
        method: 'PATCH',
        headers: getInternalApiHeaders(),
        body: JSON.stringify({
          lastCompletedStep: stepId,
        }),
      }
    );
  } catch (error) {
    console.error(
      `[Workflow] Failed to update lastCompletedStep for application ${applicationId}:`,
      error
    );
    // Don't throw - we don't want to fail the workflow because of a tracking update failure
  }
}

export class StepError extends Error {
  constructor(
    public step: string,
    public originalError: unknown
  ) {
    super(`Step failed: ${step}`);
    this.name = 'StepError';
  }
}


