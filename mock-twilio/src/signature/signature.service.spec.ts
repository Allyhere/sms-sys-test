import { SignatureService } from './signature.service';

describe('SignatureService', () => {
  let service: SignatureService;

  beforeEach(() => {
    service = new SignatureService();
  });

  it('should generate a base64 HMAC-SHA1 signature', () => {
    const url = 'http://example.com/webhook';
    const params = { From: '+15551234567', Body: 'Hello' };
    const authToken = 'test-token';

    const signature = service.generateSignature(url, params, authToken);

    expect(signature).toBeTruthy();
    expect(typeof signature).toBe('string');
    // Base64 encoded HMAC-SHA1 is 28 characters
    expect(signature).toHaveLength(28);
  });

  it('should generate different signatures for different params', () => {
    const url = 'http://example.com/webhook';
    const authToken = 'test-token';

    const sig1 = service.generateSignature(url, { Body: 'Hello' }, authToken);
    const sig2 = service.generateSignature(url, { Body: 'World' }, authToken);

    expect(sig1).not.toBe(sig2);
  });

  it('should generate same signature for same inputs', () => {
    const url = 'http://example.com/webhook';
    const params = { From: '+15551234567', Body: 'Hello' };
    const authToken = 'test-token';

    const sig1 = service.generateSignature(url, params, authToken);
    const sig2 = service.generateSignature(url, params, authToken);

    expect(sig1).toBe(sig2);
  });

  it('should sort params alphabetically before signing', () => {
    const url = 'http://example.com/webhook';
    const authToken = 'test-token';

    const sig1 = service.generateSignature(
      url,
      { Body: 'Hello', From: '+15551234567' },
      authToken,
    );
    const sig2 = service.generateSignature(
      url,
      { From: '+15551234567', Body: 'Hello' },
      authToken,
    );

    expect(sig1).toBe(sig2);
  });
});
