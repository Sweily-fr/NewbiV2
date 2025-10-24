import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Separator } from '../../components/ui/separator';

export function SuggestionSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>

      <Separator />

      <CardFooter className="pt-3 pb-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </CardFooter>
    </Card>
  );
}
