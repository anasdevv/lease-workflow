import { performFraudCheck } from '@/lib/fraud-detection';
import { fetch } from 'workflow';
import { getInternalApiHeaders } from '@/lib/workflow-api';

interface DocumentExtraction {
  documentId: number;
  documentType: string;
  data: unknown;
  confidence: number;
}

interface FraudAnalysisOutput {
  applicationId: number;
  fraudAnalysis: {
    score: number;
    confidence: number;
    signals: unknown[];
  };
  needsReview: boolean;
}

export async function fraudAnalysisStep(
  applicationId: number,
  extractedData: DocumentExtraction[]
): Promise<FraudAnalysisOutput> {
  'use step';

  console.log(`[Fraud Analysis] Starting for application ${applicationId}`);

  const fraudAnalysis = performFraudCheck(extractedData);

  // Update application via API (outside workflow bundle)
  await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/applications/${applicationId}`,
    {
      method: 'PATCH',
      headers: getInternalApiHeaders(),
      body: JSON.stringify({
        fraudScore: fraudAnalysis.score,
        fraudSignals: fraudAnalysis.signals,
      }),
    }
  );

  const needsReview = fraudAnalysis.score > 50 || fraudAnalysis.confidence < 0.7;

  console.log(`[Fraud Analysis] Complete for ${applicationId}:`, {
    score: fraudAnalysis.score,
    confidence: fraudAnalysis.confidence,
    signalCount: fraudAnalysis.signals.length,
    needsReview,
  });

  return {
    applicationId,
    fraudAnalysis,
    needsReview,
  };
}
