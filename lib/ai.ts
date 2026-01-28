export async function analyzeDocument(
  blobUrl: string,
  documentType: string
) {
  // Simplified - in production, fetch actual document and process
  // For demo, return mock data based on type
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
  
  if (documentType === 'pay_stub') {
    return {
      data: {
        employerName: 'Acme Corp',
        monthlyIncome: 5000,
        payPeriod: '2024-01-01 to 2024-01-15',
      },
      confidence: 0.85,
    };
  }
  
  if (documentType === 'tax_return') {
    return {
      data: {
        annualIncome: 60000,
        taxYear: 2023,
      },
      confidence: 0.90,
    };
  }
  
  if (documentType === 'id_verification') {
    return {
      data: {
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        address: '123 Main St',
      },
      confidence: 0.95,
    };
  }
  
  return { data: {}, confidence: 0.5 };
}