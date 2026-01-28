/**
 * Background check step that runs a 3rd party background verification
 * Calls external services like Checkr or similar
 */

interface BackgroundCheckInput {
  applicationId: number;
  decision: 'approved' | 'rejected' | 'auto_approved';
}

interface BackgroundCheckOutput {
  applicationId: number;
  backgroundPassed: boolean;
  decision: 'approved' | 'rejected' | 'auto_approved';
}

export async function backgroundCheckStep(
  input: BackgroundCheckInput
): Promise<BackgroundCheckOutput> {
  'use step';

  const { applicationId, decision } = input;

  if (decision === 'rejected') {
    // Skip background check if already rejected
    console.log(
      `[Background Check] Skipping for rejected application ${applicationId}`
    );
    return {
      applicationId,
      backgroundPassed: false,
      decision: 'rejected',
    };
  }

  console.log(`[Background Check] Running for application ${applicationId}`);

  try {
    // Call 3rd party background check API (e.g., Checkr)
    // This is a placeholder for the actual implementation
    const backgroundPassed = await runBackgroundCheck(applicationId);

    console.log(
      `[Background Check] ${backgroundPassed ? 'passed' : 'failed'} for ${applicationId}`
    );

    return {
      applicationId,
      backgroundPassed,
      decision: backgroundPassed ? decision : 'rejected',
    };
  } catch (error) {
    console.error(
      `[Background Check] Error checking application ${applicationId}:`,
      error
    );
    throw error;
  }
}

/**
 * Placeholder for actual background check API call
 * Replace with real integration (Checkr, Clearview, etc.)
 */
async function runBackgroundCheck(applicationId: number): Promise<boolean> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // TODO: Replace with actual background check service call
  // const result = await checkrClient.check({
  //   applicationId,
  //   type: 'rental_background'
  // });
  // return result.status === 'passed';

  // For now, simulate with 90% pass rate
  return Math.random() > 0.1;
}
