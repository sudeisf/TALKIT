import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-md bg-muted relative overflow-hidden',
        'after:absolute after:inset-0 after:-translate-x-full',
        'after:bg-gradient-to-r after:from-transparent',
        'after:via-white/20 after:to-transparent',
        'after:animate-[shimmer_1.5s_infinite]',
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-24 items-center gap-3 rounded-md border border-border bg-card p-4', className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-7 w-2/3" />
      </div>
    </div>
  );
}

function SkeletonChatMessage({
  className,
  sent = false,
}: {
  className?: string;
  sent?: boolean;
}) {
  return (
    <div className={cn('flex w-full gap-3', sent && 'flex-row-reverse', className)}>
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className={cn('max-w-[70%] flex-1 space-y-2', sent && 'items-end')}>
        <Skeleton className={cn('h-4 w-[70%]', sent && 'ml-auto')} />
        <Skeleton className={cn('h-4 w-[90%]', sent && 'ml-auto')} />
        <Skeleton className={cn('h-4 w-1/2', sent && 'ml-auto')} />
      </div>
    </div>
  );
}

function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-md border border-border bg-card p-4', className)}>
      <Skeleton className="h-8 w-8 shrink-0 rounded-full md:h-10 md:w-10" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

function SkeletonForm({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-5', className)}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

function SkeletonDashboard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-lg lg:col-span-2" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonListItem key={index} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-36 rounded-md" />
        <Skeleton className="h-36 rounded-md" />
      </div>
    </div>
  );
}

function SkeletonProfileHeader({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-6', className)}>
      <Skeleton className="h-16 w-16 rounded-full sm:h-20 sm:w-20" />
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonNav({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 p-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonChatMessage,
  SkeletonDashboard,
  SkeletonForm,
  SkeletonListItem,
  SkeletonNav,
  SkeletonProfileHeader,
};
