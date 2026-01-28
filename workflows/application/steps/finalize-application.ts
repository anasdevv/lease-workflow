import { fetch } from 'workflow';
import { getInternalApiHeaders } from '@/lib/workflow-api';

interface FinalizeApplicationInput {
  applicationId: number;
  decision: 'approved' | 'rejected' | 'auto_approved';
  backgroundPassed: boolean;
}

interface FinalizeApplicationOutput {
  applicationId: number;
  status: 'approved' | 'rejected';
}

export async function finalizeApplicationStep(
  input: FinalizeApplicationInput
): Promise<FinalizeApplicationOutput> {
  'use step';

  const { applicationId, decision, backgroundPassed } = input;

  console.log(`[Finalize Application] Processing final decision for ${applicationId}`);

  if (decision === 'rejected' || !backgroundPassed) {
    // REJECTED
    console.log(`[Finalize Application] Application ${applicationId} REJECTED`);

    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}`,
      {
        method: 'PATCH',
        headers: getInternalApiHeaders(),
        body: JSON.stringify({
          status: 'rejected',
          workflowStatus: 'completed',
        }),
      }
    );

    // Update documents via API
    await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/documents/bulk?applicationId=${applicationId}`,
      {
        method: 'PATCH',
        headers: getInternalApiHeaders(),
        body: JSON.stringify({
          where: { verificationStatus: 'extracted' },
          data: { verificationStatus: 'verified' },
        }),
      }
    );

    return { applicationId, status: 'rejected' };
  }

  // APPROVED - Generate lease
  console.log(`[Finalize Application] Application ${applicationId} APPROVED`);

  // Update application via API
  await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}`,
    {
      method: 'PATCH',
      headers: getInternalApiHeaders(),
      body: JSON.stringify({
        status: 'approved',
        workflowStatus: 'completed',
      }),
    }
  );

  // Mark all documents as verified via API
  await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/documents/bulk?applicationId=${applicationId}`,
    {
      method: 'PATCH',
      headers: getInternalApiHeaders(),
      body: JSON.stringify({
        where: { verificationStatus: 'extracted' },
        data: { verificationStatus: 'verified' },
      }),
    }
  );

  // TODO: Trigger lease generation workflow if needed
  // await generateLeaseWorkflow({ applicationId });

  return { applicationId, status: 'approved' };
}
