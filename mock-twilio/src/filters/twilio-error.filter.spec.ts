import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  HttpException,
  HttpStatus,
  Controller,
  Get,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { TwilioErrorFilter } from './twilio-error.filter';

@Controller()
class TestController {
  @Get('http-exception')
  throwHttpException() {
    throw new HttpException('Bad request from controller', HttpStatus.BAD_REQUEST);
  }

  @Get('http-exception-object')
  throwHttpExceptionObject() {
    throw new HttpException(
      { message: 'Validation failed', field: 'to' },
      HttpStatus.BAD_REQUEST,
    );
  }

  @Get('generic-error')
  throwGenericError() {
    throw new Error('Something went wrong internally');
  }

  @Get('unknown-exception')
  throwUnknownException() {
    throw 'string exception';
  }

  @Get('success')
  success() {
    return { ok: true };
  }
}

describe('TwilioErrorFilter', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new TwilioErrorFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Given an HttpException with a string message', () => {
    it('When caught, Then it returns the exception status code and the Twilio error format', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-exception')
        .expect(400);

      expect(res.body.code).toBe(40000);
      expect(res.body.message).toBe('Bad request from controller');
      expect(res.body.moreInfo).toBe('https://www.twilio.com/docs/api/errors');
    });
  });

  describe('Given an HttpException with an object response', () => {
    it('When caught, Then it extracts the message from the object and returns the Twilio error format', async () => {
      const res = await request(app.getHttpServer())
        .get('/http-exception-object')
        .expect(400);

      expect(res.body.code).toBe(40000);
      expect(res.body.moreInfo).toBe('https://www.twilio.com/docs/api/errors');
    });
  });

  describe('Given a generic Error (non-HttpException)', () => {
    it('When caught, Then it defaults to 500 and includes the error message', async () => {
      const res = await request(app.getHttpServer())
        .get('/generic-error')
        .expect(500);

      expect(res.body.code).toBe(50000);
      expect(res.body.message).toBe('Something went wrong internally');
      expect(res.body.moreInfo).toBe('https://www.twilio.com/docs/api/errors');
    });
  });

  describe('Given a non-Error exception (e.g. string)', () => {
    it('When caught, Then it defaults to 500 with the generic internal server error message', async () => {
      const res = await request(app.getHttpServer())
        .get('/unknown-exception')
        .expect(500);

      expect(res.body.code).toBe(50000);
      expect(res.body.message).toBe('Internal server error');
      expect(res.body.moreInfo).toBe('https://www.twilio.com/docs/api/errors');
    });
  });

  describe('Given a successful request (no exception)', () => {
    it('When handled, Then the response passes through the filter unchanged', async () => {
      const res = await request(app.getHttpServer())
        .get('/success')
        .expect(200);

      expect(res.body).toEqual({ ok: true });
    });
  });
});
