import { getApiBaseUrl } from './api';

describe('mobile api base url', () => {
  const origin = process.env.REACT_APP_API_URL;

  afterEach(() => {
    if (origin === undefined) {
      delete process.env.REACT_APP_API_URL;
    } else {
      process.env.REACT_APP_API_URL = origin;
    }
  });

  test('uses env value when provided', () => {
    process.env.REACT_APP_API_URL = 'https://example.com/api';
    expect(getApiBaseUrl()).toBe('https://example.com/api');
  });

  test('falls back to same-origin /api', () => {
    delete process.env.REACT_APP_API_URL;
    expect(getApiBaseUrl()).toBe('/api');
  });
});
