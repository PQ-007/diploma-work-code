import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function ArticleItemSkeleton() {
  return (
    <Card className="border-border/40 p-3.5 h-[190px] flex flex-col justify-between space-y-3">
      {/* Author row */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-36 rounded" />
        </div>
      </div>

      {/* Title + description */}
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-4/5 rounded" />
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-4/5 rounded" />
      </div>

      {/* Tags + stats/actions */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
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
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function ArticlePageSkeleton() {
  return (
    <div className="flex gap-8 xl:gap-12 justify-center">
      <div className="flex-1 max-w-3xl space-y-6">
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
