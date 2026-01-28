'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, Shield, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

interface ApplicationStatsProps {
  stats: {
    total: number;
    pendingReview: number;
    highRisk: number;
    approved: number;
  } | undefined;
  isLoading?: boolean;
}

export default function ApplicationStats({ stats, isLoading }: ApplicationStatsProps) {
  const statItems: StatItem[] = [
    {
      label: 'Total Applications',
      value: stats?.total || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Pending Review',
      value: stats?.pendingReview || 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      label: 'High Risk',
      value: stats?.highRisk || 0,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      label: 'Approved',
      value: stats?.approved || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <Card 
          key={stat.label} 
          className="border-0 shadow-md hover:shadow-lg transition-shadow"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {stat.label}
                </p>
                <div className="text-3xl font-bold text-slate-800 mt-2">
                  {isLoading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    stat.value
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}