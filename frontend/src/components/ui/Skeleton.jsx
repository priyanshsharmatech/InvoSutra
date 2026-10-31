// Reusable shimmer placeholder.
export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200/70 dark:bg-slate-700/60 rounded ${className}`} />
);

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-5 ${className}`}
  >
    {children}
  </div>
);

// Dashboard loading placeholder matching the bento layout.
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-64 mt-2" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="h-11 w-11 rounded-xl mb-3" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-24 mt-2" />
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <Card className="lg:col-span-3 h-64">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-40 w-full" />
      </Card>
      <Card className="h-64">
        <Skeleton className="h-5 w-24 mb-4" />
        <Skeleton className="h-32 w-32 rounded-full mx-auto" />
      </Card>
    </div>
  </div>
);

// Generic table loading placeholder.
export const TableSkeleton = ({ rows = 6 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

export default Skeleton;
