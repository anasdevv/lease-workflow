import { ApplicationDocumentWithDocument } from '@/generated/prisma/client';
import type { ApiPaginatedResponse, ApiResponse, Application, ApplicationDocument, ApplicationStats, HumanReviewDecision, Listing } from '@/types';




export interface SearchApplicationsParams {
  searchQuery?: string;
  status?: string;
  riskLevel?: string;
  page?: number;
}

export interface SearchApplicationsResponse  extends ApiPaginatedResponse<Array<Application & { listing: Listing }>> {}





export async function getApplicationStats(
): Promise<ApiResponse<ApplicationStats>> {
  
  const response = await fetch(`/api/applications/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  
  return response.json();
}


export async function searchApplications(
  params: SearchApplicationsParams
): Promise<SearchApplicationsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.searchQuery) searchParams.set('q', params.searchQuery);
  if (params.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params.riskLevel && params.riskLevel !== 'all') searchParams.set('risk', params.riskLevel);
  if (params.page) searchParams.set('page', params.page.toString());

  const response = await fetch(`/api/applications?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }
  
  return response.json();
}

export async function updateApplicationStatus(
  appId: number,
  status: string,
  notes: string
) {
  const response = await fetch(`/api/applications/${appId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes })
  });

  if (!response.ok) {
    throw new Error('Failed to update application status');
  }

  return response.json();
}



export async function getApplicationDetails(
  applicationId: number
): Promise<Application & { documents : ApplicationDocumentWithDocument[], listing: Listing  , reviewDecisions : HumanReviewDecision[]}> {
  const response = await fetch(`/api/applications/${applicationId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch application details');
  }
  
  return response.json().then((pd) => pd.data);
}