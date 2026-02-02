import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  const skeleton = "bg-muted";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className={`h-10 w-3/4 ${skeleton}`} />
              <Skeleton className={`h-5 w-1/2 ${skeleton}`} />
              <div className="flex items-center gap-3">
                <Skeleton className={`h-10 w-10 rounded-full ${skeleton}`} />
                <div className="space-y-2">
                  <Skeleton className={`h-4 w-32 ${skeleton}`} />
                  <Skeleton className={`h-3 w-24 ${skeleton}`} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className={`h-6 w-16 ${skeleton}`} />
                <Skeleton className={`h-6 w-16 ${skeleton}`} />
                <Skeleton className={`h-6 w-16 ${skeleton}`} />
              </div>
            </div>

            <Card className="p-6 space-y-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className={`h-4 w-full ${skeleton}`} />
              ))}
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton
                  key={`wide-${idx}`}
                  className={`h-4 w-11/12 ${skeleton}`}
                />
              ))}
            </Card>
          </div>

          <div className="hidden lg:block space-y-4">
            <Card className="p-4 space-y-3">
              <Skeleton className={`h-4 w-1/2 ${skeleton}`} />
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Skeleton className={`h-8 w-8 rounded-full ${skeleton}`} />
                  <div className="space-y-2 flex-1">
                    <Skeleton className={`h-4 w-24 ${skeleton}`} />
                    <Skeleton className={`h-3 w-20 ${skeleton}`} />
                  </div>
                </div>
              ))}
            </Card>
            <Card className="p-4 space-y-2">
              <Skeleton className={`h-4 w-32 ${skeleton}`} />
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className={`h-3 w-full ${skeleton}`} />
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
