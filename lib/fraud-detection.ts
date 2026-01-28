interface DocumentExtraction {
  documentId: number;
  documentType: string;
  data: unknown;
  confidence: number;
}

interface Signal {
  type: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
}

export interface FraudAnalysisResult {
  score: number;
  confidence: number;
  signals: Signal[];
}

/**
 * Performs comprehensive fraud detection analysis on extracted documents
 * using multiple cross-validation signals
 */
export function performFraudCheck(
  documents: DocumentExtraction[]
): FraudAnalysisResult {
  const signals: Signal[] = [];
  let score = 0;

  const payStub = documents.find((d) => d.documentType === 'pay_stub');
  const taxReturn = documents.find((d) => d.documentType === 'tax_return');
  const idVerification = documents.find((d) => d.documentType === 'id_verification');

  // Check 1: Income consistency between pay stub and tax return
  if (
    payStub?.data &&
    typeof payStub.data === 'object' &&
    'monthlyIncome' in payStub.data &&
    taxReturn?.data &&
    typeof taxReturn.data === 'object' &&
    'annualIncome' in taxReturn.data
  ) {
    const monthlyFromPayStub = (payStub.data as { monthlyIncome: number })
      .monthlyIncome;
    const annualFromTaxReturn = (taxReturn.data as { annualIncome: number })
      .annualIncome;
    const monthlyFromTaxReturn = annualFromTaxReturn / 12;
    const difference = Math.abs(monthlyFromPayStub - monthlyFromTaxReturn);

    if (difference > 1000) {
      signals.push({
        type: 'income_mismatch',
        severity: 'high',
        details: `Pay stub shows $${monthlyFromPayStub}/month, but tax return shows $${monthlyFromTaxReturn.toFixed(0)}/month`,
      });
      score += 60; // Major red flag
    }
  }

  // Check 2: Low confidence scores
  const avgConfidence =
    documents.reduce((sum, d) => sum + (d.confidence || 0), 0) /
    (documents.length || 1);

  if (avgConfidence < 0.7) {
    signals.push({
      type: 'low_extraction_confidence',
      severity: 'medium',
      details: `Average document extraction confidence is only ${(avgConfidence * 100).toFixed(0)}%`,
    });
    score += 30;
  }

  // Check 3: Missing critical data
  if (
    !payStub?.data ||
    typeof payStub.data !== 'object' ||
    !('employerName' in payStub.data)
  ) {
    signals.push({
      type: 'missing_employer_info',
      severity: 'medium',
      details: 'Could not extract employer name from pay stub',
    });
    score += 20;
  }

  // Check 4: Suspicious income (too high or too low)
  if (
    payStub?.data &&
    typeof payStub.data === 'object' &&
    'monthlyIncome' in payStub.data
  ) {
    const monthlyIncome = (payStub.data as { monthlyIncome: number })
      .monthlyIncome;
    if (monthlyIncome > 50000) {
      signals.push({
        type: 'unusually_high_income',
        severity: 'medium',
        details: `Monthly income of $${monthlyIncome} is unusually high`,
      });
      score += 25;
    } else if (monthlyIncome < 2000) {
      signals.push({
        type: 'unusually_low_income',
        severity: 'low',
        details: `Monthly income of $${monthlyIncome} may not meet rental requirements`,
      });
      score += 15;
    }
  }

  // Check 5: ID verification present
  if (!idVerification) {
    signals.push({
      type: 'missing_id_verification',
      severity: 'medium',
      details: 'No ID verification document found',
    });
    score += 20;
  }

  return {
    score: Math.min(score, 100),
    confidence: avgConfidence,
    signals,
  };
}
