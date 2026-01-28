import React, { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import FraudScoreCard from './fraud-score-card';
import { formatDate } from '@/lib/utils';
import type { Application, Listing, ApplicationDocument, Document, HumanReviewDecision } from '@/types';
import WorkflowStatus from './workflow-status';
import { getFraudScoreColor, getFraudScoreIconColor, STATUS_CONFIG, WORKFLOW_STATUS_CONFIG } from './utils';
import { submitReviewDecision } from '@/actions/review-decision';
import { toast } from 'sonner';
import { useApplicationDetails } from '@/hooks/use-applications';
import { ApplicationDocumentWithDocument } from '@/generated/prisma/client';
import { useNewlyCreatedApplicationsPolling } from '@/hooks/use-newly-created-applications';

interface AdminApplicationCardProps {
  application: Application & {
    listing: Listing;
    documents?: (ApplicationDocument & { document: Document })[];
    reviewNotes?: string;
    reviewDecisions?: HumanReviewDecision[];
  };
  onUpdateStatus?: (
    applicationId: number,
    newStatus: string,
  ) => void;
  shouldPoll?: boolean;
}


export default function AdminApplicationCard({
  application,
  onUpdateStatus,
  shouldPoll,
}: AdminApplicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  console.log('AdminApplicationCard - shouldPoll:', shouldPoll);
  const { isLoading, data: applicationDetails } = useApplicationDetails(
    application.id,
    isExpanded && (shouldPoll ?? false)
  );

  const { removeTrackedApplication } = useNewlyCreatedApplicationsPolling();

  const currentApplication = applicationDetails || application;
  const status = STATUS_CONFIG[currentApplication.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const workflowStatus = currentApplication.workflowStatus
    ? WORKFLOW_STATUS_CONFIG[currentApplication.workflowStatus as keyof typeof WORKFLOW_STATUS_CONFIG]
    : null;



  const handleSubmitReviewDecision = async (decision: 'approved' | 'rejected') => {
    setIsSubmittingDecision(true);
    try {
      const result = await submitReviewDecision({
        applicationId: application.id,
        decision,
        reason: reviewNotes || undefined,
      });

      if (result.success) {
        toast.success(`Application ${decision === 'approved' ? 'approved' : 'rejected'} successfully!`);
        setReviewNotes('');
        if (onUpdateStatus) {
          onUpdateStatus(application.id, decision);
        }
      } else {
        toast.error(result.error || 'Failed to submit decision');
      }
    } catch (error) {
      toast.error('An error occurred while submitting the decision');
      console.error(error);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  useEffect(() => {
    if (currentApplication.status === 'completed' || currentApplication.workflowStatus === 'completed' || currentApplication.status === 'rejected' || currentApplication.workflowStatus === 'failed') {
      removeTrackedApplication(currentApplication.id);
    }

  }, [])


  const fraudScore = currentApplication.fraudScore ?? null;
  return (
    <Card className="border border-slate-200 hover:border-slate-300 transition-all">
      <CardContent className="p-5">
        {/* Main Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0">
              {currentApplication.applicantName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate text-lg">
                {currentApplication.applicantName}
              </h3>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <a href={`mailto:${currentApplication.applicantEmail}`} className="text-blue-600 hover:underline">
                  {currentApplication.applicantEmail}
                </a>
              </p>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {currentApplication.listing?.address}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Applied {formatDate(new Date(currentApplication.createdAt))}
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
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''
                  }`}
              />
            </Button>
          </div>
        </div>

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

        {isExpanded && (
          <div className="pt-4 border-t border-slate-200 space-y-5">
            {/* Show loading state while fetching details */}
            {isLoading && !applicationDetails && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            )}

            {currentApplication.documents && currentApplication.documents.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Uploaded Documents
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentApplication.documents.map((doc: ApplicationDocumentWithDocument) => (
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

            {fraudScore !== null && <FraudScoreCard application={currentApplication} />}


            <WorkflowStatus application={currentApplication} />

            {currentApplication.workflowStatus === 'paused_for_review' && currentApplication?.reviewDecisions && currentApplication?.reviewDecisions?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Review Notes (Optional)
                  </label>
                  <Textarea
                    placeholder="Add your review notes here..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSubmitReviewDecision('approved')}
                    disabled={isSubmittingDecision}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    {isSubmittingDecision ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleSubmitReviewDecision('rejected')}
                    disabled={isSubmittingDecision}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50 flex-1"
                  >
                    {isSubmittingDecision ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}
      </CardContent>
    </Card>
  );
}