import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { MockService } from "./mock.service";
import { StoreService } from "../store/store.service";
import { SignatureService } from "../signature/signature.service";
import type { AddressInfo } from "net";
import { WebhookService } from "../webhook/webhook.service";
import * as http from "http";

describe("MockService", () => {
  let service: MockService;
  let storeService: StoreService;
  let webhookService: WebhookService;
  let server: http.Server;
  let serverPort: number;
  let receivedRequests: Array<{
    headers: http.IncomingHttpHeaders;
    body: string;
  }>;
  let statusCodeOverride: number;

  const mockConfig: Record<string, string | number> = {
    port: 4000,
    webhookUrl: "http://localhost:0/api/webhooks/twilio",
    webhookStatusUrl: "http://localhost:0/api/webhooks/twilio/status",
    defaultToNumber: "+15550000000",
    mockDelayMs: 10,
    twilioAuthToken: "test-auth-token",
  };

  beforeEach((done) => {
    receivedRequests = [];
    statusCodeOverride = 200;

    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        receivedRequests.push({ headers: req.headers, body });
        res.writeHead(statusCodeOverride, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ success: true }));
      });
    });

    server.listen(0, () => {
      serverPort = (server.address() as AddressInfo).port;
      mockConfig.webhookUrl = `http://localhost:${serverPort}/api/webhooks/twilio`;
      mockConfig.webhookStatusUrl = `http://localhost:${serverPort}/api/webhooks/twilio/status`;
      done();
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockService,
        StoreService,
        SignatureService,
        WebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<MockService>(MockService);
    storeService = module.get<StoreService>(StoreService);
    webhookService = module.get<WebhookService>(WebhookService);
  });

  describe("generateSid — use cases", () => {
    it("Given generateSid is called, When it returns, Then the SID starts with SM and is 34 chars long", () => {
      const sid = service.generateSid();
      expect(sid).toMatch(/^SM[0-9a-f]{32}$/);
    });

    it("Given generateSid is called twice, When comparing results, Then each SID is unique", () => {
      const sid1 = service.generateSid();
      const sid2 = service.generateSid();
      expect(sid1).not.toBe(sid2);
    });
  });

  describe("handleSendSms — use cases", () => {
    it("Given a valid outbound SMS, When handled, Then it returns a queued status and logs the outbound entry", async () => {
      const result = await service.handleSendSms({
        to: "+15551234567",
        from: "+15550000000",
        body: "Test message",
      });

      expect(result.sid).toMatch(/^SM/);
      expect(result.status).toBe("queued");
      expect(result.to).toBe("+15551234567");
      expect(result.from).toBe("+15550000000");
      expect(result.body).toBe("Test message");

      const logs = storeService.getLogs("outbound");
      expect(logs.outbound).toHaveLength(1);
      expect(logs.outbound[0].sid).toBe(result.sid);
      expect(logs.outbound[0].status).toBe("queued");
    });

    it("Given a custom SID in the DTO, When handled, Then the provided SID is used instead of generating one", async () => {
      const result = await service.handleSendSms({
        to: "+15551234567",
        from: "+15550000000",
        body: "Test",
        sid: "SMcustomsid123",
      });

      expect(result.sid).toBe("SMcustomsid123");
    });

    it("Given a statusCallback URL, When handled, Then status callbacks are delivered in sequence [queued, sent, delivered]", async () => {
      await service.handleSendSms({
        to: "+15551234567",
        from: "+15550000000",
        body: "Test",
        statusCallback: `http://localhost:${serverPort}/status`,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedRequests.length).toBeGreaterThanOrEqual(3);
      expect(receivedRequests[0].body).toContain("MessageStatus=queued");
      expect(receivedRequests[1].body).toContain("MessageStatus=sent");
      expect(receivedRequests[2].body).toContain("MessageStatus=delivered");
    });
  });

  describe("handleSendSms — simulateFailure path", () => {
    it("Given simulateFailure is true and a statusCallback, When handled, Then status callbacks follow [queued, sent, failed]", async () => {
      await service.handleSendSms({
        to: "+15551234567",
        from: "+15550000000",
        body: "This will fail",
        statusCallback: `http://localhost:${serverPort}/status`,
        simulateFailure: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedRequests.length).toBeGreaterThanOrEqual(3);
      expect(receivedRequests[0].body).toContain("MessageStatus=queued");
      expect(receivedRequests[1].body).toContain("MessageStatus=sent");
      expect(receivedRequests[2].body).toContain("MessageStatus=failed");
    });

    it("Given simulateFailure is true, When the callback chain completes, Then failedTotal is incremented", async () => {
      await service.handleSendSms({
        to: "+15551234567",
        from: "+15550000000",
        body: "Fail",
        statusCallback: `http://localhost:${serverPort}/status`,
        simulateFailure: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(storeService.getMetrics().failedTotal).toBe(1);
    });

    it("Given simulateFailure is true, When the callback chain starts, Then pendingCallbacks is incremented and then decremented", async () => {
      await service.handleSendSms({
        to: "+15551234567",
        from: "+15550000000",
        body: "Fail",
        statusCallback: `http://localhost:${serverPort}/status`,
        simulateFailure: true,
      });

      expect(storeService.getMetrics().pendingCallbacks).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(storeService.getMetrics().pendingCallbacks).toBe(0);
    });

    it("Given simulateFailure is false, When callbacks complete, Then failedTotal remains 0", async () => {
      await service.handleSendSms({
        to: "+15551234567",
        from: "+15550000000",
        body: "OK",
        statusCallback: `http://localhost:${serverPort}/status`,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(storeService.getMetrics().failedTotal).toBe(0);
    });
  });

  describe("handleSimulateInbound — use cases", () => {
    it("Given a valid inbound simulation, When handled, Then it builds a Twilio-compatible payload and logs the inbound entry", async () => {
      const result = await service.handleSimulateInbound({
        from: "+15551234567",
        body: "Hello world",
      });

      expect(result.sid).toMatch(/^SM/);
      expect(result.webhookStatus).toBe(200);

      const logs = storeService.getLogs("inbound");
      expect(logs.inbound).toHaveLength(1);
      expect(logs.inbound[0].from).toBe("+15551234567");
      expect(logs.inbound[0].body).toBe("Hello world");
    });

    it('Given no "to" field in the DTO, When handled, Then the defaultToNumber from config is used', async () => {
      await service.handleSimulateInbound({
        from: "+15551234567",
        body: "Hello",
      });

      expect(receivedRequests).toHaveLength(1);
      expect(receivedRequests[0].body).toContain("To=%2B15550000000");
    });

    it('Given a custom "to" field in the DTO, When handled, Then the provided number is used instead of the default', async () => {
      await service.handleSimulateInbound({
        from: "+15551234567",
        body: "Hello",
        to: "+15559999999",
      });

      expect(receivedRequests[0].body).toContain("To=%2B15559999999");
    });

    it('Given a webhook that returns 200, When handled, Then the result status is "delivered"', async () => {
      const result = await service.handleSimulateInbound({
        from: "+15551234567",
        body: "Hello",
      });

      expect(result.status).toBe("delivered");
    });

    it('Given a webhook that returns 500, When handled, Then the result status is "failed" but the inbound is still logged', async () => {
      statusCodeOverride = 500;

      const result = await service.handleSimulateInbound({
        from: "+15551234567",
        body: "Hello",
      });

      expect(result.status).toBe("failed");
      expect(result.webhookStatus).toBe(500);

      const logs = storeService.getLogs("inbound");
      expect(logs.inbound).toHaveLength(1);
    });
  });

  describe("handleSimulateInbound — signature path", () => {
    it("Given signature: true and an auth token, When handled, Then an X-Twilio-Signature header is included in the webhook request", async () => {
      await service.handleSimulateInbound({
        from: "+15551234567",
        body: "Signed message",
        signature: true,
      });

      expect(receivedRequests).toHaveLength(1);
      expect(receivedRequests[0].headers["x-twilio-signature"]).toBeDefined();
      expect(typeof receivedRequests[0].headers["x-twilio-signature"]).toBe(
        "string",
      );
    });

    it("Given signature: true, When the signature is generated, Then it is a valid base64 HMAC-SHA1 (28 chars)", async () => {
      await service.handleSimulateInbound({
        from: "+15551234567",
        body: "Signed message",
        signature: true,
      });

      const sig = receivedRequests[0].headers["x-twilio-signature"] as string;
      expect(sig).toHaveLength(28);
    });

    it("Given signature is not set (false/undefined), When handled, Then no X-Twilio-Signature header is sent", async () => {
      await service.handleSimulateInbound({
        from: "+15551234567",
        body: "Unsigned message",
      });

      expect(receivedRequests[0].headers["x-twilio-signature"]).toBeUndefined();
    });

    it("Given signature: true but no auth token configured, When handled, Then no X-Twilio-Signature header is sent", async () => {
      mockConfig.twilioAuthToken = "";

      await service.handleSimulateInbound({
        from: "+15551234567",
        body: "No token",
        signature: true,
      });

      expect(receivedRequests[0].headers["x-twilio-signature"]).toBeUndefined();
      mockConfig.twilioAuthToken = "test-auth-token";
    });
  });

  describe("handleSimulateStatus — use cases", () => {
    it("Given a valid status callback, When handled, Then it delivers the webhook and returns the result", async () => {
      const result = await service.handleSimulateStatus({
        MessageSid: "SMtest123",
        MessageStatus: "delivered",
      });

      expect(result.sid).toBe("SMtest123");
      expect(result.status).toBe("delivered");
      expect(result.delivered).toBe(true);
    });

    it("Given a custom callbackUrl, When handled, Then the status callback is sent to the custom URL", async () => {
      await service.handleSimulateStatus({
        MessageSid: "SMcustom",
        MessageStatus: "sent",
        callbackUrl: `http://localhost:${serverPort}/custom-status`,
      });

      expect(receivedRequests).toHaveLength(1);
      expect(receivedRequests[0].body).toContain("MessageSid=SMcustom");
      expect(receivedRequests[0].body).toContain("MessageStatus=sent");
    });

    it("Given a webhook that returns 500, When handled, Then delivered is false", async () => {
      statusCodeOverride = 500;

      const result = await service.handleSimulateStatus({
        MessageSid: "SMfail",
        MessageStatus: "failed",
      });

      expect(result.delivered).toBe(false);
    });
  });
});
