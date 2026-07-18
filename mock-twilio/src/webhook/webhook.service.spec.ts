import { WebhookService } from "./webhook.service";
import * as http from "http";
import type { AddressInfo } from "net";

describe("WebhookService", () => {
  let service: WebhookService;
  let server: http.Server;
  let serverPort: number;
  let receivedRequests: Array<{
    method: string;
    url: string;
    headers: http.IncomingHttpHeaders;
    body: string;
  }>;
  let statusCodeOverride: number;

  beforeEach((done) => {
    service = new WebhookService();
    receivedRequests = [];
    statusCodeOverride = 200;

    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        receivedRequests.push({
          method: req.method || "POST",
          url: req.url || "/",
          headers: req.headers,
          body,
        });
        res.writeHead(statusCodeOverride, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ ok: true }));
      });
    });

    server.listen(0, () => {
      serverPort = (server.address() as AddressInfo).port;
      done();
    });
  });

  afterEach((done) => {
    server.close(done);
  });

  describe("deliverWebhook — use cases", () => {
    it("Given a reachable endpoint returning 200, When delivering a webhook, Then it succeeds on the first attempt", async () => {
      const result = await service.deliverWebhook(
        `http://localhost:${serverPort}/webhook`,
        { MessageSid: "SM123", Body: "test" },
        "SM123",
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.attempts).toBe(1);
    });

    it("Given a webhook payload, When delivered, Then it is sent as application/x-www-form-urlencoded", async () => {
      await service.deliverWebhook(
        `http://localhost:${serverPort}/webhook`,
        { MessageSid: "SM123", Body: "hello world" },
        "SM123",
      );

      expect(receivedRequests).toHaveLength(1);
      expect(receivedRequests[0].headers["content-type"]).toBe(
        "application/x-www-form-urlencoded",
      );
      expect(receivedRequests[0].body).toBe(
        "MessageSid=SM123&Body=hello+world",
      );
    });

    it("Given custom headers, When delivering a webhook, Then the headers are passed through to the request", async () => {
      await service.deliverWebhook(
        `http://localhost:${serverPort}/webhook`,
        { MessageSid: "SM123" },
        "SM123",
        { "X-Twilio-Signature": "abc123=" },
      );

      expect(receivedRequests[0].headers["x-twilio-signature"]).toBe("abc123=");
    });

    it("Given multiple sequential webhook deliveries, When each completes, Then the order of received requests matches the call order", async () => {
      await service.deliverWebhook(
        `http://localhost:${serverPort}/webhook`,
        { MessageSid: "SM001" },
        "SM001",
      );
      await service.deliverWebhook(
        `http://localhost:${serverPort}/webhook`,
        { MessageSid: "SM002" },
        "SM002",
      );
      await service.deliverWebhook(
        `http://localhost:${serverPort}/webhook`,
        { MessageSid: "SM003" },
        "SM003",
      );

      expect(receivedRequests).toHaveLength(3);
      expect(receivedRequests[0].body).toContain("SM001");
      expect(receivedRequests[1].body).toContain("SM002");
      expect(receivedRequests[2].body).toContain("SM003");
    });
  });

  describe("deliverWebhook — error cases", () => {
    it("Given an endpoint returning 500, When delivering a webhook, Then it retries 3 times and reports failure", async () => {
      statusCodeOverride = 500;

      const result = await service.deliverWebhook(
        `http://localhost:${serverPort}/webhook`,
        { MessageSid: "SM123" },
        "SM123",
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.attempts).toBe(3);
      expect(receivedRequests).toHaveLength(3);
    });

    it("Given an unreachable endpoint, When delivering a webhook, Then it retries 3 times and reports failure with statusCode 0", async () => {
      const result = await service.deliverWebhook(
        "http://localhost:9999/webhook",
        { MessageSid: "SM123" },
        "SM123",
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(0);
      expect(result.attempts).toBe(3);
    });

    it("Given an endpoint that returns 200 then 500, When delivering twice, Then the first succeeds and the second retries", async () => {
      let callCount = 0;
      server.removeAllListeners("request");
      server.on("request", (req, res) => {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          callCount++;
          res.writeHead(callCount === 1 ? 200 : 500, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify({ ok: true }));
        });
      });

      const first = await service.deliverWebhook(
        `http://localhost:${serverPort}/webhook`,
        { MessageSid: "SM001" },
        "SM001",
      );
      const second = await service.deliverWebhook(
        `http://localhost:${serverPort}/webhook`,
        { MessageSid: "SM002" },
        "SM002",
      );

      expect(first.success).toBe(true);
      expect(first.attempts).toBe(1);
      expect(second.success).toBe(false);
      expect(second.attempts).toBe(3);
    });
  });

  describe("deliverStatusCallbacks — use cases", () => {
    it("Given a list of statuses [queued, sent, delivered], When delivering callbacks, Then each status is delivered in order with the correct payload", async () => {
      const statuses = ["queued", "sent", "delivered"];

      await service.deliverStatusCallbacks(
        `http://localhost:${serverPort}/status`,
        "SM999",
        statuses,
        10,
      );

      expect(receivedRequests).toHaveLength(3);
      expect(receivedRequests[0].body).toContain("MessageStatus=queued");
      expect(receivedRequests[1].body).toContain("MessageStatus=sent");
      expect(receivedRequests[2].body).toContain("MessageStatus=delivered");
      expect(receivedRequests[0].body).toContain("MessageSid=SM999");
      expect(receivedRequests[2].body).toContain("MessageSid=SM999");
    });

    it("Given a failure status list [queued, sent, failed], When delivering callbacks, Then all three are delivered in sequence", async () => {
      const statuses = ["queued", "sent", "failed"];

      await service.deliverStatusCallbacks(
        `http://localhost:${serverPort}/status`,
        "SMFAIL",
        statuses,
        10,
      );

      expect(receivedRequests).toHaveLength(3);
      expect(receivedRequests[2].body).toContain("MessageStatus=failed");
    });

    it("Given custom headers, When delivering status callbacks, Then headers are passed through on every delivery", async () => {
      await service.deliverStatusCallbacks(
        `http://localhost:${serverPort}/status`,
        "SMHDR",
        ["queued", "delivered"],
        10,
        { "X-Twilio-Signature": "sig=" },
      );

      expect(receivedRequests).toHaveLength(2);
      expect(receivedRequests[0].headers["x-twilio-signature"]).toBe("sig=");
      expect(receivedRequests[1].headers["x-twilio-signature"]).toBe("sig=");
    });
  });
});
