import { extractDocumentsStep } from '@/workflows/application/steps/extract-documents';
import { fraudAnalysisStep } from '@/workflows/application/steps/fraud-analysis';
import { routeDecisionStep } from '@/workflows/application/steps/route-decision';
import { awaitHumanDecisionStep } from '@/workflows/application/steps/await-human-decision';
import { finalizeApplicationStep } from '@/workflows/application/steps/finalize-application';
import { getWorkflowMetadata } from 'workflow';
import { fetch } from 'workflow';
import { getInternalApiHeaders } from '@/lib/workflow-api';
import { backgroundCheckStep } from './steps/background-check';

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

  // Get workflow run ID for state management
  const metadata = getWorkflowMetadata();
  const workflowRunId = metadata.workflowRunId;

  try {
    // STEP 1: Extract document data in parallel
    console.log(`[Workflow] Step 1: Extracting documents...`);
    const extractedResult = await extractDocumentsStep(applicationId);

    // STEP 2: Cross-validate and run fraud detection
    console.log(`[Workflow] Step 2: Running fraud analysis...`);
    const fraudResult = await fraudAnalysisStep(
      extractedResult.applicationId,
      extractedResult.extractedData
    );

    // STEP 3: Route based on fraud analysis
    console.log(`[Workflow] Step 3: Routing decision...`);
    const routeResult = await routeDecisionStep({
      applicationId: fraudResult.applicationId,
      fraudAnalysis: fraudResult.fraudAnalysis,
      needsReview: fraudResult.needsReview,
    });

    // STEP 4: Await human decision if needed or proceed with auto-approval
    console.log(`[Workflow] Step 4: Awaiting human decision (if needed)...`);
    const decisionResult = await awaitHumanDecisionStep({
      applicationId: routeResult.applicationId,
      path: routeResult.path,
      workflowRunId,
    });

    // STEP 5: Background check
    console.log(`[Workflow] Step 5: Running background check...`);
    const bgCheckResult = await backgroundCheckStep({
      applicationId: decisionResult.applicationId,
      decision: decisionResult.decision,
    });

    // STEP 6: Finalize application
    console.log(`[Workflow] Step 6: Finalizing application...`);
    const finalResult = await finalizeApplicationStep({
      applicationId: bgCheckResult.applicationId,
      decision: bgCheckResult.decision,
      backgroundPassed: bgCheckResult.backgroundPassed,
    });

    console.log(
      `[Workflow] Application ${applicationId} workflow completed with status: ${finalResult.status}`
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

    // Update application status to failed via API (outside workflow bundle)
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}`,
      {
        method: 'PATCH',
        headers: getInternalApiHeaders(),
        body: JSON.stringify({
          status: 'processing',
          workflowStatus: 'failed',
        }),
      }
    );

    throw error;
  }
}


