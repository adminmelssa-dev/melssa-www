const units = ["B", "KB", "MB", "GB"] satisfies string[];

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const unit = units[exponent] ?? "B";

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${unit}`;
}
