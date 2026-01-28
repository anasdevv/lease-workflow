import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Mail,
  FileWarning,
  DollarSign,
  Copy,
  LucideIcon,
} from 'lucide-react';
import type { Application } from '@/types';

interface FraudScoreCardProps {
  application: Application;
}

type FraudSignalKey =
  | 'suspiciousEmail'
  | 'documentMismatch'
  | 'incomeVerificationFailed'
  | 'multipleApplications';

interface ScoreConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
}

export default function FraudScoreCard({ application }: FraudScoreCardProps) {
  const { fraudScore, fraudSignals } = application;

  if (fraudScore === null || fraudScore === undefined) {
    return null;
  }

  const getScoreConfig = (score: number): ScoreConfig => {
    if (score >= 80)
      return {
        label: 'High Risk',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: ShieldAlert,
      };
    if (score >= 50)
      return {
        label: 'Medium Risk',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: AlertTriangle,
      };
    return {
      label: 'Low Risk',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: ShieldCheck,
    };
  };

  const scoreConfig = getScoreConfig(fraudScore);
  const ScoreIcon = scoreConfig.icon;

  const signalIcons: Record<FraudSignalKey, LucideIcon> = {
    suspiciousEmail: Mail,
    documentMismatch: FileWarning,
    incomeVerificationFailed: DollarSign,
    multipleApplications: Copy,
  };

  const signalLabels: Record<FraudSignalKey, string> = {
    suspiciousEmail: 'Suspicious Email Pattern',
    documentMismatch: 'Document Mismatch Detected',
    incomeVerificationFailed: 'Income Verification Failed',
    multipleApplications: 'Multiple Applications Detected',
  };

  const activeSignals = fraudSignals
    ? (Object.entries(fraudSignals).filter(
        ([_, value]) => value === true
      ) as [FraudSignalKey, boolean][])
    : [];

  return (
    <Card className={`border-2 ${scoreConfig.borderColor}`}>
      <CardHeader className={`${scoreConfig.bgColor} border-b ${scoreConfig.borderColor}`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <ScoreIcon className={`w-5 h-5 ${scoreConfig.color}`} />
            Fraud Detection Score
          </CardTitle>
          <Badge
            className={`${scoreConfig.bgColor} ${scoreConfig.color} border-0 font-bold text-base px-4 py-1`}
          >
            {fraudScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1">
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  fraudScore >= 80
                    ? 'bg-red-500'
                    : fraudScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${fraudScore}%` }}
              />
            </div>
          </div>
          <span className={`text-sm font-semibold ${scoreConfig.color}`}>
            {scoreConfig.label}
          </span>
        </div>

        {activeSignals.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Detected Signals ({activeSignals.length})
            </p>
            <div className="space-y-2">
              {activeSignals.map(([key]) => {
                const Icon = signalIcons[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <Icon className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="text-sm text-red-700 font-medium">
                      {signalLabels[key]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
            <p className="text-sm text-green-700 font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              No fraud signals detected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}