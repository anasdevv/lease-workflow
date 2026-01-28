import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | number) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

// ============================================================================
// Workflow Steps Configuration
// ============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  number: number;
  label: string; // UI-friendly label
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'extract_documents', name: 'Extract Documents', number: 1, label: 'Document Extraction' },
  { id: 'fraud_analysis', name: 'Fraud Analysis', number: 2, label: 'Fraud Detection' },
  { id: 'route_decision', name: 'Route Decision', number: 3, label: 'Route Decision' },
  { id: 'await_human_decision', name: 'Await Human Decision', number: 4, label: 'Review' },
  { id: 'background_check', name: 'Background Check', number: 5, label: 'Background Check' },
  { id: 'finalize_application', name: 'Finalize Application', number: 6, label: 'Final Review' },
];

/**
 * Get step number by step ID
 * @param stepId The step ID to look up
 * @returns The step number or 0 if not found
 */
export function getStepNumber(stepId: string): number {
  const step = WORKFLOW_STEPS.find(s => s.id === stepId);
  return step?.number || 0;
}

/**
 * Get workflow step by ID
 * @param stepId The step ID to look up
 * @returns The step object or undefined if not found
 */
export function getWorkflowStep(stepId: string): WorkflowStep | undefined {
  return WORKFLOW_STEPS.find(s => s.id === stepId);
}

/**
 * Calculate progress percentage based on last completed step
 * @param lastCompletedStepId The ID of the last completed step
 * @returns Progress percentage (0-100)
 */
export function calculateProgressPercentage(lastCompletedStepId: string | null): number {
  if (!lastCompletedStepId) return 0;
  const stepNumber = getStepNumber(lastCompletedStepId);
  return Math.round((stepNumber / WORKFLOW_STEPS.length) * 100);
}

/**
 * Get all steps that should be marked as completed
 * @param lastCompletedStepId The ID of the last completed step
 * @returns Array of completed step IDs
 */
export function getCompletedSteps(lastCompletedStepId: string | null): string[] {
  if (!lastCompletedStepId) return [];
  const stepNumber = getStepNumber(lastCompletedStepId);
  return WORKFLOW_STEPS.filter(s => s.number <= stepNumber).map(s => s.id);
}

// For backwards compatibility
export const steps = WORKFLOW_STEPS;