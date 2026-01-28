import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  XCircle,
  Loader2,
  LucideIcon,
} from 'lucide-react';
import { WORKFLOW_STEPS, getStepNumber, getCompletedSteps } from '@/lib/utils';
import type { Application, ApplicationStatus, WorkflowStatus as WorkflowStatusType } from '@/types';

interface WorkflowStatusProps {
  application: Application;
}

interface StatusConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

interface WorkflowStatusConfig {
  label: string;
  icon: LucideIcon;
  spin?: boolean;
  color: string;
}

const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: Circle },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const WORKFLOW_STATUS_CONFIG: Record<WorkflowStatusType, WorkflowStatusConfig> = {
  running: { label: 'Running', icon: Loader2, spin: true, color: 'text-blue-600' },
  paused_for_review: { label: 'Paused for Review', icon: AlertCircle, color: 'text-amber-600' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-600' },
};

type StepStatus = 'completed' | 'failed' | 'pending' | 'current';

/**
 * Determines the current step status based on database lastCompletedStep
 */
function getStepStatus(
  stepNumber: number,
  lastCompletedStepNumber: number,
  workflowStatus: WorkflowStatusType | null,
  isLastStep: boolean
): StepStatus {
  if(workflowStatus === 'completed') {
    return 'completed';
  }
  // If this step is completed
  if (stepNumber <= lastCompletedStepNumber) {
    return 'completed';
  }

  // If workflow failed and this is next step after last completed
  if (workflowStatus === 'failed' && stepNumber === lastCompletedStepNumber + 1) {
    return 'failed';
  }

  // If this is the next step to be executed (current)
  if (stepNumber === lastCompletedStepNumber + 1) {
    return 'current';
  }

  // Otherwise pending
  return 'pending';
}

export default function WorkflowStatus({ application }: WorkflowStatusProps) {
  const status = STATUS_CONFIG[application.status] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;

  const workflowConfig = application.workflowStatus
    ? WORKFLOW_STATUS_CONFIG[application.workflowStatus]
    : null;
  const WorkflowIcon = workflowConfig?.icon;

  // Get last completed step number from database
  const lastCompletedStepNumber = getStepNumber(application.lastCompletedStep || '');
  console.log('application.lastCompletedStep', application.lastCompletedStep,lastCompletedStepNumber);
  const completedSteps = getCompletedSteps(application.lastCompletedStep);

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-slate-800 text-lg mb-1">Application Status</h3>
            <p className="text-sm text-slate-500">Track your application progress</p>
          </div>
          <Badge className={`${status.color} border-0 font-medium px-4 py-2 text-sm`}>
            <StatusIcon
              className={`w-4 h-4 mr-1.5 ${status.icon === Loader2 ? 'animate-spin' : ''}`}
            />
            {status.label}
          </Badge>
        </div>

        {/* Workflow Status */}
        {application.workflowStatus && workflowConfig && WorkflowIcon && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <WorkflowIcon
                className={`w-5 h-5 ${workflowConfig.color} ${
                  workflowConfig.spin ? 'animate-spin' : ''
                }`}
              />
              <div>
                <p className="text-sm font-medium text-slate-700">Workflow Status</p>
                <p className="text-xs text-slate-500">{workflowConfig.label}</p>
              </div>
            </div>
            {application.workflowRunId && (
              <p className="text-xs text-slate-400 mt-2 font-mono">
                Run ID: {application.workflowRunId}
              </p>
            )}
          </div>
        )}

        {/* Progress Steps */}
        <div className="space-y-4">
          {WORKFLOW_STEPS.map((step, index) => {
            const stepStatus = getStepStatus(
              step.number,
              lastCompletedStepNumber,
              application.workflowStatus,
              index === WORKFLOW_STEPS.length - 1
            );

            const isCompleted = stepStatus === 'completed';
            const isCurrent = stepStatus === 'current';
            const isFailed = stepStatus === 'failed';
            const isPending = stepStatus === 'pending';

            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500 animate-pulse'
                        : isFailed
                        ? 'bg-red-500 border-red-500'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : isFailed ? (
                      <XCircle className="w-5 h-5 text-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-12 mt-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <p
                    className={`font-medium ${
                      isCompleted
                        ? 'text-green-700'
                        : isCurrent
                        ? 'text-blue-700'
                        : isFailed
                        ? 'text-red-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  <div className="text-xs mt-0.5">
                    {isCompleted && <p className="text-green-600">✓ Completed</p>}
                    {isCurrent && <p className="text-blue-600">● In progress...</p>}
                    {isFailed && <p className="text-red-600">✕ Failed</p>}
                    {isPending && <p className="text-slate-400">○ Pending</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}