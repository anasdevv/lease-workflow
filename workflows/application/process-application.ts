import { extractDocumentsStep } from '@/workflows/application/steps/extract-documents';
import { fraudAnalysisStep } from '@/workflows/application/steps/fraud-analysis';
import { routeDecisionStep } from '@/workflows/application/steps/route-decision';
import { finalizeApplicationStep } from '@/workflows/application/steps/finalize-application';
import { getWorkflowMetadata, defineHook } from 'workflow';
import { fetch } from 'workflow';
import { getInternalApiHeaders } from '@/lib/workflow-api';
import { backgroundCheckStep } from './steps/background-check';
import { WORKFLOW_STEPS } from '@/lib/utils';
import { StepError, updateLastCompletedStep } from './steps/utils';

interface HumanReviewEvent {
  reviewId: number;
  decision: 'approved' | 'rejected';
  reason?: string;
}

/**
 * Main workflow for processing rental applications
 * Orchestrates the complete application verification and decision pipeline
 *
 * Flow:
 * 1. Extract documents (AI analysis in parallel)
 * 2. Fraud detection (cross-validation)
 * 3. Route decision (manual review or auto-approve)
 * 4. Human decision (if flagged) or auto-proceed
 * 5. Background check (3rd party verification)
 * 6. Finalize (approve or reject)
 *
 * Uses Vercel Workflow directives for durability and resumability
 */
export async function processApplicationWorkflow(applicationId: number) {
  'use workflow';

  console.log(
    `[Workflow] Starting process-application for application ${applicationId}`
  );

  // Create the human review hook inside the workflow function

  // Get workflow run ID for state management
  const metadata = getWorkflowMetadata();
  const workflowRunId = metadata.workflowRunId;

  // Register the workflow run ID with the application
  await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}`,
    {
      method: 'PATCH',
      headers: getInternalApiHeaders(),
      body: JSON.stringify({
        workflowRunId,
        workflowStatus: 'running',
      }),
    }
  );

  try {
    console.log(`[Workflow] Step ${WORKFLOW_STEPS[0].number}: ${WORKFLOW_STEPS[0].name}...`);
    let extractedResult;
    try {
      extractedResult = await extractDocumentsStep(applicationId);
    } catch (error) {
      console.error(`[Workflow] Step ${WORKFLOW_STEPS[0].number} failed - ${WORKFLOW_STEPS[0].name}`, error);
      throw new StepError(WORKFLOW_STEPS[0].id, error);
    }
    await updateLastCompletedStep(applicationId, WORKFLOW_STEPS[0].id);

    console.log(`[Workflow] Step ${WORKFLOW_STEPS[1].number}: ${WORKFLOW_STEPS[1].name}...`);
    let fraudResult;
    try {
      fraudResult = await fraudAnalysisStep(
        extractedResult.applicationId,
        extractedResult.extractedData
      );
    } catch (error) {
      console.error(`[Workflow] Step ${WORKFLOW_STEPS[1].number} failed - ${WORKFLOW_STEPS[1].name}`, error);
      throw new StepError(WORKFLOW_STEPS[1].id, error);
    }
    await updateLastCompletedStep(applicationId, WORKFLOW_STEPS[1].id);

    console.log(`[Workflow] Step ${WORKFLOW_STEPS[2].number}: ${WORKFLOW_STEPS[2].name}...`);
    let routeResult;
    try {
      routeResult = await routeDecisionStep({
        applicationId: fraudResult.applicationId,
        fraudAnalysis: fraudResult.fraudAnalysis,
        needsReview: fraudResult.needsReview,
      });
    } catch (error) {
      console.error(`[Workflow] Step ${WORKFLOW_STEPS[2].number} failed - ${WORKFLOW_STEPS[2].name}`, error);
      throw new StepError(WORKFLOW_STEPS[2].id, error);
    }
    await updateLastCompletedStep(applicationId, WORKFLOW_STEPS[2].id);

    console.log(`[Workflow] Step ${WORKFLOW_STEPS[3].number}: ${WORKFLOW_STEPS[3].name}...`);
    let decisionResult;
    try {
      if (routeResult.path === 'manual_review') {
        const humanReviewHook = defineHook<HumanReviewEvent>();
        
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${routeResult.applicationId}/review-decision`,
          {
            method: 'POST',
            headers: getInternalApiHeaders(),
            body: JSON.stringify({
              workflowRunId,
              status: 'pending',
            }),
          }
        );

        const reviewEvents = humanReviewHook.create({
          token: `app-${routeResult.applicationId}`,
        });

        let decision: 'approved' | 'rejected' = 'rejected';
        let reason: string | undefined;

        for await (const event of reviewEvents) {
          console.log(`[Workflow] Decision received: ${event.decision}`);
          
          decision = event.decision;
          reason = event.reason;

          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${routeResult.applicationId}/review-decision`,
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

          break; 
        }

        decisionResult = {
          applicationId: routeResult.applicationId,
          decision,
          reason,
        };
      } else {
        console.log(`[Workflow] Auto-approving application ${routeResult.applicationId}`);
        decisionResult = {
          applicationId: routeResult.applicationId,
          decision: 'auto_approved',
        };
      }
    } catch (error) {
      console.error(`[Workflow] Step ${WORKFLOW_STEPS[3].number} failed - ${WORKFLOW_STEPS[3].name}`, error);
      throw new StepError(WORKFLOW_STEPS[3].id, error);
    }
    await updateLastCompletedStep(applicationId, WORKFLOW_STEPS[3].id);

    console.log(`[Workflow] Step ${WORKFLOW_STEPS[4].number}: ${WORKFLOW_STEPS[4].name}...`);
    let bgCheckResult;
    try {
      bgCheckResult = await backgroundCheckStep({
        applicationId: decisionResult.applicationId,
        decision: decisionResult.decision as 'approved' | 'rejected' | 'auto_approved',
      });
    } catch (error) {
      console.error(`[Workflow] Step ${WORKFLOW_STEPS[4].number} failed - ${WORKFLOW_STEPS[4].name}`, error);
      throw new StepError(WORKFLOW_STEPS[4].id, error);
    }
    await updateLastCompletedStep(applicationId, WORKFLOW_STEPS[4].id);

    console.log(`[Workflow] Step ${WORKFLOW_STEPS[5].number}: ${WORKFLOW_STEPS[5].name}...`);
    let finalResult;
    try {
      finalResult = await finalizeApplicationStep({
        applicationId: bgCheckResult.applicationId,
        decision: bgCheckResult.decision,
        backgroundPassed: bgCheckResult.backgroundPassed,
      });
    } catch (error) {
      console.error(`[Workflow] Step ${WORKFLOW_STEPS[5].number} failed - ${WORKFLOW_STEPS[5].name}`, error);
      throw new StepError(WORKFLOW_STEPS[5].id, error);
    }
    await updateLastCompletedStep(applicationId, WORKFLOW_STEPS[5].id);

    console.log(
      `[Workflow] Application ${applicationId} workflow completed with status: ${finalResult.status}`
    );

    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}`,
      {
        method: 'PATCH',
        headers: getInternalApiHeaders(),
        body: JSON.stringify({
          workflowStatus: 'completed',
          lastCompletedStep: WORKFLOW_STEPS[5].id,
        }),
      }
    );

    return {
      applicationId: finalResult.applicationId,
      status: finalResult.status,
      success: true,
    };
  } catch (error) {
    console.error(
      `[Workflow] Error processing application ${applicationId}:`,
      error
    );

    // Determine which step failed and extract error details
    let failedStep = 'unknown';
    let errorMessage = 'Unknown error';
    let errorStack = '';
    
    if (error instanceof StepError) {
      failedStep = error.step;
      errorMessage = error.originalError instanceof Error 
        ? error.originalError.message 
        : String(error.originalError);
      errorStack = error.originalError instanceof Error 
        ? error.originalError.stack || '' 
        : '';
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || '';
    }

    const errorDetails = {
      failedStep,
      errorMessage,
      errorStack,
      timestamp: new Date().toISOString(),
    };

    // Update application with error state
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}`,
      {
        method: 'PATCH',
        headers: getInternalApiHeaders(),
        body: JSON.stringify({
          workflowStatus: 'failed',
          workflowRunId, // Keep the runId for potential recovery
          workflowErrorDetails: errorDetails,
        }),
      }
    ).catch((fetchError) => {
      console.error(
        `[Workflow] Failed to update application status after error:`,
        fetchError
      );
    });

    throw error;
  }
}





