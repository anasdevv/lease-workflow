import { ApiResponse, Listing } from "@/types";

export async function getAllListings(
): Promise<ApiResponse<Listing[]>> {
  
  const response = await fetch(`/api/listings`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  const parsedResponse = await response.json();
  console.log('response', parsedResponse,JSON.stringify(parsedResponse,null,4));
  return parsedResponse;
}
