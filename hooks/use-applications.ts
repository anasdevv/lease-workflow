import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplicationDetails, getApplicationStats, searchApplications, updateApplicationStatus, type SearchApplicationsParams } from '@/lib/api/applications';

export enum ApplicationQueryTag{
    APPLICATIONS = 'applications',
    APPLICATION_STATS = 'applicationStats',
    APPLICATION_DETAILS = 'applicationDetails',
}

/**
 * Fetch applications list with search/filters
 * Does NOT poll - newly created applications are polled separately via useNewlyCreatedApplicationsPolling
 */
export function useApplications(params: SearchApplicationsParams) {
  return useQuery({
    queryKey: [ApplicationQueryTag.APPLICATIONS, params],
    queryFn: () => searchApplications(params),
    staleTime: 60 * 1000, // Keep data fresh for 1 minute
  });
}

/**
 * Hook for fetching individual application details
 * Used when viewing a specific application and needing full details
 * Does NOT poll - use useNewlyCreatedApplicationsPolling for polling
 */
export function useApplicationDetails(applicationId: number | null,  enabled : boolean,shouldPoll: boolean ,) {
  return useQuery({
    queryKey: [ApplicationQueryTag.APPLICATION_DETAILS, applicationId],
    queryFn: () => getApplicationDetails(applicationId!),
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: (data) => shouldPoll ? 1000 : false,
  });
}


export function useApplicationStats() {
  return useQuery({
    queryKey: [ApplicationQueryTag.APPLICATION_STATS,ApplicationQueryTag.APPLICATIONS],
    queryFn: () => getApplicationStats(),
    staleTime: 10 * 1000, 
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appId, status, notes }: { appId: number; status: string; notes: string }) =>
      updateApplicationStatus(appId, status, notes),
    onMutate: async ({ appId, status }) => {
      await queryClient.cancelQueries({ queryKey: [ApplicationQueryTag.APPLICATIONS] });

      const previousData = queryClient.getQueriesData({ queryKey: [ApplicationQueryTag.APPLICATIONS] });

      queryClient.setQueriesData(
        { queryKey: [ApplicationQueryTag.APPLICATIONS] },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((app: any) =>
              app.id === appId ? { ...app, status } : app
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ApplicationQueryTag.APPLICATIONS] });
    },
  });
}