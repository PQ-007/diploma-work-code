import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ArticleItemSkeleton() {
  return (
    <Card className="border-border/40 p-4">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Author row */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
          {/* Title */}
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-[85%]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
          {/* Tags + actions row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        </div>
        {/* Image placeholder (shown on ~40% of skeletons) */}
        <Skeleton className="hidden sm:block flex-shrink-0 w-48 h-32 rounded-md" />
      </div>
    </Card>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Trending Topics skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Card className="border-border/40">
          <div className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2.5 border-b border-border/20 last:border-b-0"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton className="h-3 w-4" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
                <Skeleton className="h-3 w-3" />
              </div>
            ))}
          </div>
        </Card>
      </div>
      {/* Reading list skeleton */}
      <Card className="border-border/40">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-6 rounded-md" />
          </div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </Card>
    </div>
  );
}

export function ArticleFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function ArticlePageSkeleton() {
  return (
    <div className="flex gap-8 xl:gap-12 justify-center">
      <div className="flex-1 max-w-7xl space-y-6">
        {/* Tabs skeleton */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-md" />
          ))}
        </div>
        <ArticleFeedSkeleton count={5} />
      </div>
      <aside className="hidden xl:block w-[320px]">
        <SidebarSkeleton />
      </aside>
    </div>
  );
}
