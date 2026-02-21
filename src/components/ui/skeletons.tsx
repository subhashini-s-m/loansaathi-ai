/**
 * Loading Skeleton Components
 * Better UX with skeleton placeholders during data loading
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ChatMessageSkeleton(): JSX.Element {
  return (
    <div className="space-y-3 mb-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}

export function ChatInputSkeleton(): JSX.Element {
  return (
    <div className="flex gap-2 p-4">
      <Skeleton className="flex-1 h-10 rounded-lg" />
      <Skeleton className="h-10 w-12 rounded-lg" />
    </div>
  );
}

export function ResultsPageSkeleton(): JSX.Element {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2 p-4 border rounded-lg">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Factors section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2 p-3 border rounded-lg">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>

      {/* Roadmap section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-3 p-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>

      {/* Banks section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2 p-4 border rounded-lg">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApprovalMeterSkeleton(): JSX.Element {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function CardSkeleton(): JSX.Element {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-white">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-10 w-full rounded-lg mt-4" />
    </div>
  );
}

export function FormFieldSkeleton(): JSX.Element {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function TableSkeleton(): JSX.Element {
  return (
    <div className="space-y-2 border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex gap-2 p-3 bg-gray-100">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {/* Rows */}
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-2 p-3 border-t">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
