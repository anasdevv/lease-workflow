import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Pause,
  LucideIcon,
} from 'lucide-react';
import type { Application, ApplicationStatus, WorkflowStatus as WorkflowStatusType } from '@/types';

interface WorkflowStatusProps {
  application: Application;
}

interface WorkflowStep {
  id: string;
  label: string;
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

const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'submitted', label: 'Application Submitted' },
  { id: 'document_verification', label: 'Document Verification' },
  { id: 'fraud_check', label: 'Fraud Detection' },
  { id: 'income_verification', label: 'Income Verification' },
  { id: 'background_check', label: 'Background Check' },
  { id: 'final_review', label: 'Final Review' },
];

const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: Circle },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-amber-100 text-amber-700', icon: Loader2 },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const WORKFLOW_STATUS_CONFIG: Record<WorkflowStatusType, WorkflowStatusConfig> = {
  running: { label: 'Running', icon: Loader2, spin: true, color: 'text-blue-600' },
  paused_for_review: { label: 'Paused for Review', icon: Pause, color: 'text-amber-600' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-600' },
};

export default function WorkflowStatus({ application }: WorkflowStatusProps) {
  const status = STATUS_CONFIG[application.status] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;

  const workflowConfig = application.workflowStatus
    ? WORKFLOW_STATUS_CONFIG[application.workflowStatus]
    : null;
  const WorkflowIcon = workflowConfig?.icon;

  // Map current step based on status and workflow status
  const getCurrentStep = (): number => {
    // If workflow is running or paused, determine step based on application status
    if (application.status === 'approved') return 6;
    if (application.status === 'rejected') return 6;
    if (application.status === 'processing') {
      // If stuck, stay at current position
      if (application.workflowStatus === 'paused_for_review' || application.workflowStatus === 'failed') {
        return 3;
      }
      return 3;
    }
    if (application.status === 'submitted') return 1;
    return 0;
  };

  const currentStep = getCurrentStep();

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
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500 animate-pulse'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
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
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && <p className="text-xs text-blue-600 mt-0.5">In progress...</p>}
                  {isCompleted && <p className="text-xs text-green-600 mt-0.5">Completed</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}