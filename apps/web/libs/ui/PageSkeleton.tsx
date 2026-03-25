import { SkeletonLine } from './Skeletons';

export function PageSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-3 py-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine
          key={i}
          className={i === 0 ? 'h-8 w-48' : 'h-4 w-full max-w-md'}
        />
      ))}
    </div>
  );
}
