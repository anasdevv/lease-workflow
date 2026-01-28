import { humanReviewHook } from '@/app/hooks/human-review';
import prisma from '@/lib/db';

interface ReviewSubmissionBody {
  reviewId: number;
  decision: 'approved' | 'rejected';
  reason?: string;
}

/**
 * API route to handle human review decisions
 * Called when an admin/reviewer submits their decision in the dashboard
 * This resumes the paused workflow
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewSubmissionBody;
    const { reviewId, decision, reason } = body;

    // Verify the review exists and is pending
    const review = await prisma.humanReviewDecision.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (review.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Review already completed' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Resume the workflow by sending the decision to the hook
    await humanReviewHook.resume(`app-${review.applicationId}`, {
      reviewId,
      decision,
      reason,
    });

    // Update review record (also done in the step, but good to be explicit)
    await prisma.humanReviewDecision.update({
      where: { id: reviewId },
      data: {
        decision,
        reason,
        status: 'completed',
        reviewedAt: new Date(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Review ${decision} and workflow resumed`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Review API] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
