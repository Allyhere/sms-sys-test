import { Injectable } from '@nestjs/common';
import { LogEntry, Metrics, MessageDirection } from '../types/index.js';

@Injectable()
export class StoreService {
  private inboundLogs: LogEntry[] = [];
  private outboundLogs: LogEntry[] = [];
  private metrics: Metrics = {
    inboundTotal: 0,
    outboundTotal: 0,
    failedTotal: 0,
    pendingCallbacks: 0,
  };

  addInbound(entry: LogEntry): void {
    this.inboundLogs.push(entry);
    this.metrics.inboundTotal++;
  }

  addOutbound(entry: LogEntry): void {
    this.outboundLogs.push(entry);
    this.metrics.outboundTotal++;
  }

  incrementFailed(): void {
    this.metrics.failedTotal++;
  }

  incrementPendingCallbacks(): void {
    this.metrics.pendingCallbacks++;
  }

  decrementPendingCallbacks(): void {
    if (this.metrics.pendingCallbacks > 0) {
      this.metrics.pendingCallbacks--;
    }
  }

  getLogs(
    direction?: MessageDirection,
    limit?: number,
    from?: string,
  ): { inbound: LogEntry[]; outbound: LogEntry[] } {
    const filterByFrom = (logs: LogEntry[]): LogEntry[] => {
      if (!from) return logs;
      return logs.filter((l) => l.from === from);
    };

    const applyLimit = (logs: LogEntry[]): LogEntry[] => {
      if (!limit) return logs;
      return logs.slice(-limit);
    };

    if (direction === 'inbound') {
      return {
        inbound: applyLimit(filterByFrom(this.inboundLogs)),
        outbound: [],
      };
    }

    if (direction === 'outbound') {
      return {
        inbound: [],
        outbound: applyLimit(filterByFrom(this.outboundLogs)),
      };
    }

    return {
      inbound: applyLimit(filterByFrom(this.inboundLogs)),
      outbound: applyLimit(filterByFrom(this.outboundLogs)),
    };
  }

  clearLogs(): void {
    this.inboundLogs = [];
    this.outboundLogs = [];
    this.metrics = {
      inboundTotal: 0,
      outboundTotal: 0,
      failedTotal: 0,
      pendingCallbacks: 0,
    };
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }
}
