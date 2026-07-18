import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "../app.module";
import { TwilioErrorFilter } from "../filters/twilio-error.filter";
import { StoreService } from "../store/store.service";

describe("MockController (e2e)", () => {
  let app: INestApplication<App>;
  let storeService: StoreService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.useGlobalFilters(new TwilioErrorFilter());
    await app.init();

    storeService = app.get(StoreService);
    storeService.clearLogs();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /api/send-sms — use cases", () => {
    it("Given a valid outbound SMS, When sent, Then it returns 201 with a queued status and SID", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/send-sms")
        .send({
          to: "+15551234567",
          from: "+15550000000",
          body: "Test outbound",
        })
        .expect(201);

      expect(res.body.sid).toMatch(/^SM/);
      expect(res.body.status).toBe("queued");
    });
  });

  describe("POST /api/send-sms — error cases", () => {
    it('Given a request missing the "body" field, When sent, Then it returns 400', async () => {
      await request(app.getHttpServer())
        .post("/api/send-sms")
        .send({ to: "+15551234567", from: "+15550000000" })
        .expect(400);
    });

    it('Given a request missing the "to" field, When sent, Then it returns 400', async () => {
      await request(app.getHttpServer())
        .post("/api/send-sms")
        .send({ from: "+15550000000", body: "Test" })
        .expect(400);
    });

    it('Given a request missing the "from" field, When sent, Then it returns 400', async () => {
      await request(app.getHttpServer())
        .post("/api/send-sms")
        .send({ to: "+15551234567", body: "Test" })
        .expect(400);
    });

    it("Given an empty body, When sent, Then it returns 400", async () => {
      await request(app.getHttpServer())
        .post("/api/send-sms")
        .send({})
        .expect(400);
    });
  });

  describe("POST /simulate-inbound — use cases", () => {
    it("Given a valid inbound simulation, When sent, Then it returns 201 with a SID and status", async () => {
      const res = await request(app.getHttpServer())
        .post("/simulate-inbound")
        .send({
          from: "+15551234567",
          body: "Hello",
        })
        .expect(201);

      expect(res.body.sid).toMatch(/^SM/);
      expect(res.body.status).toBeDefined();
    });
  });

  describe("POST /simulate-inbound — error cases", () => {
    it('Given a request missing the "from" field, When sent, Then it returns 400', async () => {
      await request(app.getHttpServer())
        .post("/simulate-inbound")
        .send({ body: "Hello" })
        .expect(400);
    });

    it('Given a request missing the "body" field, When sent, Then it returns 400', async () => {
      await request(app.getHttpServer())
        .post("/simulate-inbound")
        .send({ from: "+15551234567" })
        .expect(400);
    });

    it("Given an empty body, When sent, Then it returns 400", async () => {
      await request(app.getHttpServer())
        .post("/simulate-inbound")
        .send({})
        .expect(400);
    });
  });

  describe("POST /simulate-status — use cases", () => {
    it("Given a valid status callback, When sent, Then it returns 201 with the SID and delivered flag", async () => {
      const res = await request(app.getHttpServer())
        .post("/simulate-status")
        .send({
          MessageSid: "SMtest123",
          MessageStatus: "delivered",
        })
        .expect(201);

      expect(res.body.sid).toBe("SMtest123");
      expect(res.body.delivered).toBeDefined();
    });
  });

  describe("POST /simulate-status — error cases", () => {
    it('Given a request missing "MessageSid", When sent, Then it returns 400', async () => {
      await request(app.getHttpServer())
        .post("/simulate-status")
        .send({ MessageStatus: "delivered" })
        .expect(400);
    });

    it('Given a request missing "MessageStatus", When sent, Then it returns 400', async () => {
      await request(app.getHttpServer())
        .post("/simulate-status")
        .send({ MessageSid: "SMtest123" })
        .expect(400);
    });

    it("Given an empty body, When sent, Then it returns 400", async () => {
      await request(app.getHttpServer())
        .post("/simulate-status")
        .send({})
        .expect(400);
    });
  });

  describe("GET /api/logs — use cases", () => {
    it("Given no activity, When fetching logs, Then both inbound and outbound are empty arrays", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/logs")
        .expect(200);

      expect(res.body.inbound).toEqual([]);
      expect(res.body.outbound).toEqual([]);
    });

    it("Given an outbound SMS was sent, When fetching logs with direction=outbound, Then only outbound logs are returned", async () => {
      await request(app.getHttpServer()).post("/api/send-sms").send({
        to: "+15551234567",
        from: "+15550000000",
        body: "Test",
      });

      const res = await request(app.getHttpServer())
        .get("/api/logs?direction=outbound")
        .expect(200);

      expect(res.body.outbound).toHaveLength(1);
      expect(res.body.inbound).toEqual([]);
    });

    it("Given multiple outbound SMS from different numbers, When fetching logs with from filter, Then only matching entries are returned", async () => {
      await request(app.getHttpServer()).post("/api/send-sms").send({
        to: "+15551234567",
        from: "+15550000000",
        body: "First",
      });
      await request(app.getHttpServer()).post("/api/send-sms").send({
        to: "+15557654321",
        from: "+15550000000",
        body: "Second",
      });

      const res = await request(app.getHttpServer())
        .get("/api/logs?direction=outbound&from=%2B15550000000")
        .expect(200);

      expect(res.body.outbound).toHaveLength(2);
      expect(res.body.inbound).toEqual([]);
    });

    it("Given 3 outbound SMS, When fetching logs with direction=outbound&limit=2, Then only the last 2 entries are returned", async () => {
      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post("/api/send-sms")
          .send({
            to: "+15551234567",
            from: "+15550000000",
            body: `Message ${i}`,
          });
      }

      const res = await request(app.getHttpServer())
        .get("/api/logs?direction=outbound&limit=2")
        .expect(200);

      expect(res.body.outbound).toHaveLength(2);
    });

    it("Given logs with direction, limit, and from filters combined, When fetching, Then all filters are applied together", async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post("/api/send-sms")
          .send({
            to: "+15551234567",
            from: "+15550000000",
            body: `From A ${i}`,
          });
      }
      await request(app.getHttpServer()).post("/api/send-sms").send({
        to: "+15551234567",
        from: "+15551111111",
        body: "From B",
      });

      const res = await request(app.getHttpServer())
        .get("/api/logs?direction=outbound&limit=2&from=%2B15550000000")
        .expect(200);

      expect(res.body.outbound).toHaveLength(2);
      expect(res.body.inbound).toEqual([]);
      expect(
        res.body.outbound.every(
          (e: { from: string }) => e.from === "+15550000000",
        ),
      ).toBe(true);
    });
  });

  describe("DELETE /api/logs — use cases", () => {
    it("Given logs exist, When DELETE is called, Then all logs are cleared and metrics reset", async () => {
      await request(app.getHttpServer()).post("/api/send-sms").send({
        to: "+15551234567",
        from: "+15550000000",
        body: "Test",
      });

      await request(app.getHttpServer()).delete("/api/logs").expect(200);

      const res = await request(app.getHttpServer())
        .get("/api/logs")
        .expect(200);

      expect(res.body.inbound).toEqual([]);
      expect(res.body.outbound).toEqual([]);
    });
  });

  describe("GET /health — use cases", () => {
    it("Given the service is running, When fetching health, Then it returns status ok and uptime", async () => {
      const res = await request(app.getHttpServer()).get("/health").expect(200);

      expect(res.body.status).toBe("ok");
      expect(res.body.uptime).toBeDefined();
    });
  });

  describe("GET /metrics — use cases", () => {
    it("Given no activity, When fetching metrics, Then all counters are 0", async () => {
      const res = await request(app.getHttpServer())
        .get("/metrics")
        .expect(200);

      expect(res.body.inboundTotal).toBe(0);
      expect(res.body.outboundTotal).toBe(0);
      expect(res.body.failedTotal).toBe(0);
      expect(res.body.pendingCallbacks).toBe(0);
    });

    it("Given 2 outbound SMS and 1 inbound simulation, When fetching metrics, Then outboundTotal is 2 and inboundTotal is 1", async () => {
      await request(app.getHttpServer()).post("/api/send-sms").send({
        to: "+15551234567",
        from: "+15550000000",
        body: "First",
      });
      await request(app.getHttpServer()).post("/api/send-sms").send({
        to: "+15551234567",
        from: "+15550000000",
        body: "Second",
      });
      await request(app.getHttpServer()).post("/simulate-inbound").send({
        from: "+15551234567",
        body: "Inbound",
      });

      const res = await request(app.getHttpServer())
        .get("/metrics")
        .expect(200);

      expect(res.body.outboundTotal).toBe(2);
      expect(res.body.inboundTotal).toBe(1);
      expect(res.body.failedTotal).toBe(0);
    });

    it("Given logs are cleared after activity, When fetching metrics, Then all counters are reset to 0", async () => {
      await request(app.getHttpServer()).post("/api/send-sms").send({
        to: "+15551234567",
        from: "+15550000000",
        body: "Test",
      });

      await request(app.getHttpServer()).delete("/api/logs");

      const res = await request(app.getHttpServer())
        .get("/metrics")
        .expect(200);

      expect(res.body.outboundTotal).toBe(0);
      expect(res.body.inboundTotal).toBe(0);
    });
  });
});
