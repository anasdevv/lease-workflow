import { getAllListings } from "@/lib/api/listings";
import { useQuery } from "@tanstack/react-query";

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: () => getAllListings().then(res => res.data),
    staleTime: 500 * 1000, 
  });
}
