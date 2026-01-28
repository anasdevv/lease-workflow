'use client';

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'newly_created_applications_tracked_ids';

/**
 * Hook to track which application IDs should be polled
 * Only manages the list of IDs - each application card will handle its own polling
 * Stores tracked app IDs in localStorage
 */
export function useNewlyCreatedApplicationsPolling() {
  const [trackedAppIds, setTrackedAppIds] = useState<number[]>([]);
    console.log('Before removal, trackedAppIds:', trackedAppIds);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as number[];
        setTrackedAppIds(ids);
      }
    } catch (error) {
      console.error('Error loading tracked application IDs:', error);
    }
  }, []);

  // Save tracked app IDs to localStorage whenever they change
  useEffect(() => {
    try {
      if (trackedAppIds.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trackedAppIds));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving tracked application IDs:', error);
    }
  }, [trackedAppIds]);

  // Add a new application ID to tracking
  const trackApplication = useCallback((applicationId: number) => {
    setTrackedAppIds(prev => {
      if (prev.includes(applicationId)) return prev;
      return [...prev, applicationId];
    });
  }, []);

  // Remove an application ID from tracking
  const removeTrackedApplication = useCallback((applicationId: number) => {
    console.log('Removing tracked application ID:', applicationId);
    console.log('Before removal, trackedAppIds:', trackedAppIds);
    setTrackedAppIds(prev => prev.filter(id => id !== applicationId));
  }, []);

  // Clear all tracked application IDs
  const clearTrackedApplications = useCallback(() => {
    setTrackedAppIds([]);
  }, []);

  return {
    trackedAppIds,
    isPolling: trackedAppIds.length > 0,
    trackApplication,
    removeTrackedApplication,
    clearTrackedApplications,
  };
}
