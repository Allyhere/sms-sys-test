import type { MessageStatus } from "../../api";

export interface StatusBadgeProps {
  status: MessageStatus;
  light?: boolean;
}

export interface StatusConfig {
  label: string;
  color: string;
  dot: string;
}
