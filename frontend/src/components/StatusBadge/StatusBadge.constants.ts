import type { StatusConfig } from './StatusBadge.types';

export const statusConfig: Record<string, StatusConfig> = {
  received: {
    label: 'Received',
    color: 'bg-yellow-100 text-yellow-800',
    dot: 'bg-yellow-400',
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-400',
  },
  sent: {
    label: 'Sent',
    color: 'bg-green-100 text-green-800',
    dot: 'bg-green-400',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    dot: 'bg-green-400',
  },
  undelivered: {
    label: 'Undelivered',
    color: 'bg-orange-100 text-orange-800',
    dot: 'bg-orange-400',
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800',
    dot: 'bg-red-400',
  },
};

export const fallbackStatusConfig: StatusConfig = {
  label: 'Unknown',
  color: 'bg-gray-100 text-gray-800',
  dot: 'bg-gray-400',
};
