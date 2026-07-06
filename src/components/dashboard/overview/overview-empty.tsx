/** Compact empty state for a dashboard overview widget. */
export function OverviewEmpty({ message }: { message: string }) {
  return (
    <div className="mt-5 border-t border-hairline py-10 text-sm text-foreground/45">
      {message}
    </div>
  );
}
