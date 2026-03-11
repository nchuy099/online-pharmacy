import http from 'k6/http';

export function baseUrl() {
  return __ENV.BASE_URL || 'http://localhost:8080';
}

export function jsonHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export function pickRandom(values, fallback = null) {
  if (!values || values.length === 0) {
    return fallback;
  }
  return values[Math.floor(Math.random() * values.length)];
}

export function loadJson(path, fallback = []) {
  try {
    return JSON.parse(open(path));
  } catch (_) {
    return fallback;
  }
}

export function login(identifierOverride = null, passwordOverride = null) {
  const accessToken = __ENV.ACCESS_TOKEN;
  if (accessToken) {
    return accessToken;
  }

  const identifier = identifierOverride || __ENV.CUSTOMER_IDENTIFIER || __ENV.CUSTOMER_EMAIL || 'customer@example.com';
  const password = passwordOverride || __ENV.CUSTOMER_PASSWORD || 'password';
  const res = http.post(
    `${baseUrl()}/auth/login`,
    JSON.stringify({ identifier, password }),
    { headers: jsonHeaders() }
  );

  if (res.status >= 400) {
    throw new Error(`Login failed with status ${res.status}: ${res.body}`);
  }

  const payload = res.json();
  return payload.data?.accessToken || payload.accessToken;
}

export function sampleTraffic(weightedActions) {
  const total = weightedActions.reduce((sum, item) => sum + item.weight, 0);
  const threshold = Math.random() * total;
  let cursor = 0;

  for (const item of weightedActions) {
    cursor += item.weight;
    if (threshold <= cursor) {
      return item.run;
    }
  }

  return weightedActions[weightedActions.length - 1]?.run;
}
