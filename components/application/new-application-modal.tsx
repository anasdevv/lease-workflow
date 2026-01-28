'use client';

import React, { Suspense } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import ApplicationForm from '@/components/forms/new-application-form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Listing } from '@/types';

interface NewApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: Listing[];
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export function NewApplicationModal({
  open,
  onOpenChange,
  listings,
}: NewApplicationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">New Lease Application</DialogTitle>
          <DialogDescription>
            Fill out the form below to submit a new lease application. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <Suspense fallback={<FormSkeleton />}>
          <ApplicationForm listings={listings} onSuccess={() => onOpenChange(false)}/>
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
