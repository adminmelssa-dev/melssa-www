/** Compact empty state for a homepage section that has no published content yet. */
export function SectionEmpty({ message }: { message: string }) {
  return (
    <div className="mt-6 border-t border-hairline py-16 text-center sm:py-20">
      <p className="text-sm text-foreground/45">{message}</p>
    </div>
  );
}
