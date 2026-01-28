import { analyzeDocument } from '@/lib/ai';
import { fetch } from 'workflow';
import { getInternalApiHeaders } from '@/lib/workflow-api';

interface DocumentExtraction {
  documentId: number;
  documentType: string;
  data: unknown;
  confidence: number;
}

interface ExtractDocumentsOutput {
  applicationId: number;
  extractedData: DocumentExtraction[];
}

export async function extractDocumentsStep(
  applicationId: number
): Promise<ExtractDocumentsOutput> {
  'use step';

  console.log(`[Extract Documents] Starting for application ${applicationId}`);

  // Fetch documents via API (outside workflow bundle)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/documents?applicationId=${applicationId}`,
    {
      headers: getInternalApiHeaders(),
    }
  );
  const appDocs = await response.json();
  console.log(
    `[Extract Documents] Fetched ${appDocs.length} documents for application ${applicationId}` , JSON.stringify(appDocs,null,4)
  );

  // Process all documents in parallel
  const extractions = await Promise.all(
    appDocs.map(async (appDoc: any) => {
      try {
        // Call AI to extract structured data
        const extracted = await analyzeDocument(
          appDoc.document.blobUrl,
          appDoc.documentType
        );

        // Update document via API (outside workflow bundle)
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/documents/${appDoc.id}`,
          {
            method: 'PATCH',
            headers: getInternalApiHeaders(),
            body: JSON.stringify({
              verificationStatus: 'extracted',
              aiExtractedData: extracted.data,
              confidenceScore: extracted.confidence,
            }),
          }
        );

        return {
          documentId: appDoc.documentId,
          documentType: appDoc.documentType,
          data: extracted.data,
          confidence: extracted.confidence,
        };
      } catch (error) {
        console.error(
          `[Extract Documents] Failed to extract document ${appDoc.id}:`,
          error
        );

        // Mark as failed via API
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/internal/documents/${appDoc.id}`,
          {
            method: 'PATCH',
            headers: getInternalApiHeaders(),
            body: JSON.stringify({ verificationStatus: 'failed' }),
          }
        );

        throw error;
      }
    })
  );

  console.log(
    `[Extract Documents] Extracted ${extractions.length} documents for application ${applicationId}`
  );

  return { applicationId, extractedData: extractions };
}
