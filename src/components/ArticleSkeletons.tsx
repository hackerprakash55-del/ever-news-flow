// Shimmer skeleton cards shown while articles are loading

export function HeroSkeleton() {
  return (
    <div className="md:col-span-2 rounded-xl overflow-hidden shimmer-bg" style={{ minHeight: 480 }} />
  );
}

export function CardSkeleton() {
  return (
    <div className="card-glass rounded-xl overflow-hidden">
      <div className="shimmer-bg h-44 w-full" />
      <div className="p-4 space-y-3">
        {/* Category badge */}
        <div className="shimmer-bg h-4 w-16 rounded-full" />
        {/* Title */}
        <div className="space-y-2">
          <div className="shimmer-bg h-4 w-full rounded" />
          <div className="shimmer-bg h-4 w-4/5 rounded" />
        </div>
        {/* Meta */}
        <div className="flex gap-3 pt-1">
          <div className="shimmer-bg h-3 w-12 rounded" />
          <div className="shimmer-bg h-3 w-16 rounded" />
          <div className="shimmer-bg h-3 w-10 rounded ml-auto" />
        </div>
        {/* Author */}
        <div className="flex items-center gap-2 pt-1">
          <div className="shimmer-bg w-6 h-6 rounded-full flex-shrink-0" />
          <div className="shimmer-bg h-3 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex gap-3 px-3 py-2.5">
      <div className="shimmer-bg w-5 h-5 rounded flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="shimmer-bg h-3 w-full rounded" />
        <div className="shimmer-bg h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}

export function HeroGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HeroSkeleton />
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function SmallGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
