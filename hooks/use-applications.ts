import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplicationStats, searchApplications, updateApplicationStatus, type SearchApplicationsParams } from '@/lib/api/applications';

export enum ApplicationQueryTag{
    APPLICATIONS = 'applications',
    APPLICATION_STATS = 'applicationStats',
}

export function useApplications(params: SearchApplicationsParams) {
  return useQuery({
    queryKey: [ApplicationQueryTag.APPLICATIONS, params],
    queryFn: () => searchApplications(params),
    staleTime: 30 * 1000, 
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