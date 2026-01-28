import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  ExternalLink,
} from 'lucide-react';
import FraudScoreCard from './fraud-score-card';
import { formatDate } from '@/lib/utils';
import type { Application, Listing, ApplicationDocument, Document } from '@/types';
import WorkflowStatus from './workflow-status';

interface AdminApplicationCardProps {
  application: Application & {
    listing: Listing;
    documents?: (ApplicationDocument & { document: Document })[];
    reviewNotes?: string;
  };
  onUpdateStatus?: (
    applicationId: number,
    newStatus: string,
    notes: string
  ) => void;
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
} as const;

const WORKFLOW_STATUS_CONFIG = {
  running: { label: 'Running', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  paused_for_review: {
    label: 'Paused for Review',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  completed: { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200' },
} as const;

export default function AdminApplicationCard({
  application,
  onUpdateStatus,
}: AdminApplicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reviewNotes, setReviewNotes] = useState(application.reviewNotes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const status = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const workflowStatus = application.workflowStatus
    ? WORKFLOW_STATUS_CONFIG[application.workflowStatus as keyof typeof WORKFLOW_STATUS_CONFIG]
    : null;

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    // Simulate API call
    setTimeout(() => {
      if (onUpdateStatus) {
        onUpdateStatus(application.id, newStatus, reviewNotes);
      }
      setIsUpdating(false);
    }, 500);
  };

  const getFraudScoreColor = (score: number) => {
    if (score >= 80) return 'bg-red-50 border border-red-200';
    if (score >= 50) return 'bg-amber-50 border border-amber-200';
    return 'bg-green-50 border border-green-200';
  };

  const getFraudScoreIconColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-green-600';
  };

  const fraudScore = application.fraudScore ?? null;
  return (
    <Card className="border border-slate-200 hover:border-slate-300 transition-all">
      <CardContent className="p-5">
        {/* Main Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0">
              {application.applicantName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate text-lg">
                {application.applicantName}
              </h3>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <a href={`mailto:${application.applicantEmail}`} className="text-blue-600 hover:underline">
                  {application.applicantEmail}
                </a>
              </p>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {application.listing?.address}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Applied {formatDate(new Date(application.createdAt))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Badge className={`${status.color} border-0 font-medium px-3 py-1`}>
              {status.label}
            </Badge>
            {workflowStatus && (
              <Badge className={`${workflowStatus.color} border font-medium px-3 py-1`}>
                {workflowStatus.label}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Fraud Score Preview */}
        {fraudScore !== null && (
          <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${getFraudScoreColor(fraudScore)}`}>
            <Shield className={`w-4 h-4 ${getFraudScoreIconColor(fraudScore)}`} />
            <span className="text-sm font-medium text-slate-700">
              Fraud Score: {fraudScore}/100
            </span>
            {fraudScore >= 50 && (
              <Badge variant="outline" className="ml-auto text-xs">
                Review Required
              </Badge>
            )}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="pt-4 border-t border-slate-200 space-y-5">
            {/* Documents */}
            {application.documents && application.documents.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Uploaded Documents
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {application.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.document.blobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors group"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {doc.documentType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {doc.document.filename}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Fraud Score Detail */}
            {fraudScore !== null && <FraudScoreCard application={application} />}

            {/* Review Notes */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Review Notes
              </p>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about this application..."
                rows={3}
                className="text-sm"
              />
            </div>
            <WorkflowStatus application={application} />
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              {/* Approve button - only show if not already approved or rejected */}
              {application.status !== 'approved' && application.status !== 'rejected' && (
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Application
                </Button>
              )}
              
              {/* Reject button - show for stuck workflows (paused_for_review, failed) or submitted status */}
              {application.status !== 'rejected' &&
                (application.workflowStatus === 'paused_for_review' ||
                  application.workflowStatus === 'failed' ||
                  application.status === 'submitted') && (
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={isUpdating}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Application
                </Button>
              )}
              
              {/* Mark as Processing button - only for submitted applications without workflow issues */}
              {application.status === 'submitted' &&
                !application.workflowStatus && (
                  <Button
                    onClick={() => handleStatusUpdate('processing')}
                    disabled={isUpdating}
                    variant="outline"
                    className="border-amber-600 text-amber-600 hover:bg-amber-50"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Mark as Processing
                  </Button>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}