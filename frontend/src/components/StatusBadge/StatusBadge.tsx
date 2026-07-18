import { fallbackStatusConfig, statusConfig } from './StatusBadge.constants';
import type { StatusBadgeProps } from './StatusBadge.types';

export default function StatusBadge({ status, light = false }: StatusBadgeProps) {
  const config = statusConfig[status] ?? fallbackStatusConfig;

  if (light) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70">
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
