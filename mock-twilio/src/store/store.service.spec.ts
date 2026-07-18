import { StoreService } from './store.service';

describe('StoreService', () => {
  let service: StoreService;

  beforeEach(() => {
    service = new StoreService();
  });

  it('should start with empty logs and zero metrics', () => {
    const logs = service.getLogs();
    expect(logs.inbound).toEqual([]);
    expect(logs.outbound).toEqual([]);

    const metrics = service.getMetrics();
    expect(metrics.inboundTotal).toBe(0);
    expect(metrics.outboundTotal).toBe(0);
    expect(metrics.failedTotal).toBe(0);
    expect(metrics.pendingCallbacks).toBe(0);
  });

  it('should add inbound logs and increment counter', () => {
    service.addInbound({
      sid: 'SM1',
      direction: 'inbound',
      from: '+15551234567',
      to: '+15550000000',
      body: 'Hello',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    });

    const logs = service.getLogs('inbound');
    expect(logs.inbound).toHaveLength(1);
    expect(logs.outbound).toEqual([]);

    expect(service.getMetrics().inboundTotal).toBe(1);
  });

  it('should add outbound logs and increment counter', () => {
    service.addOutbound({
      sid: 'SM2',
      direction: 'outbound',
      from: '+15550000000',
      to: '+15551234567',
      body: 'Reply',
      status: 'queued',
      timestamp: new Date().toISOString(),
    });

    const logs = service.getLogs('outbound');
    expect(logs.outbound).toHaveLength(1);
    expect(logs.inbound).toEqual([]);

    expect(service.getMetrics().outboundTotal).toBe(1);
  });

  it('should filter logs by from number', () => {
    service.addInbound({
      sid: 'SM1',
      direction: 'inbound',
      from: '+15551234567',
      to: '+15550000000',
      body: 'Hello',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    });
    service.addInbound({
      sid: 'SM2',
      direction: 'inbound',
      from: '+15557654321',
      to: '+15550000000',
      body: 'Hi',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    });

    const logs = service.getLogs('inbound', undefined, '+15551234567');
    expect(logs.inbound).toHaveLength(1);
    expect(logs.inbound[0].from).toBe('+15551234567');
  });

  it('should limit logs', () => {
    for (let i = 0; i < 5; i++) {
      service.addOutbound({
        sid: `SM${i}`,
        direction: 'outbound',
        from: '+15550000000',
        to: '+15551234567',
        body: `Message ${i}`,
        status: 'queued',
        timestamp: new Date().toISOString(),
      });
    }

    const logs = service.getLogs('outbound', 2);
    expect(logs.outbound).toHaveLength(2);
  });

  it('should clear logs and reset metrics', () => {
    service.addInbound({
      sid: 'SM1',
      direction: 'inbound',
      from: '+15551234567',
      to: '+15550000000',
      body: 'Hello',
      status: 'delivered',
      timestamp: new Date().toISOString(),
    });
    service.incrementFailed();

    service.clearLogs();

    expect(service.getLogs().inbound).toEqual([]);
    expect(service.getMetrics().inboundTotal).toBe(0);
    expect(service.getMetrics().failedTotal).toBe(0);
  });

  it('should track pending callbacks', () => {
    service.incrementPendingCallbacks();
    expect(service.getMetrics().pendingCallbacks).toBe(1);

    service.decrementPendingCallbacks();
    expect(service.getMetrics().pendingCallbacks).toBe(0);
  });

  it('should not go below zero pending callbacks', () => {
    service.decrementPendingCallbacks();
    expect(service.getMetrics().pendingCallbacks).toBe(0);
  });
});
