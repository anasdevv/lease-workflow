export const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
} as const;

export const WORKFLOW_STATUS_CONFIG = {
  running: { label: 'Running', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  paused_for_review: {
    label: 'Paused for Review',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  completed: { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200' },
} as const;


 export const getFraudScoreColor = (score: number) => {
    if (score >= 80) return 'bg-red-50 border border-red-200';
    if (score >= 50) return 'bg-amber-50 border border-amber-200';
    return 'bg-green-50 border border-green-200';
  };

  export const getFraudScoreIconColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-green-600';
  };

