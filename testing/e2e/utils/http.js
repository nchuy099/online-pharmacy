import { randomUUID } from 'node:crypto';

const jsonHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}.${randomUUID()}@example.com`;
}

export function normalizeBaseUrl(value, fallback) {
  return (value || fallback).replace(/\/+$/, '');
}

export async function requestJson({
  baseUrl,
  path,
  method = 'GET',
  token,
  body,
  headers = {},
}) {
  const response = await fetch(new URL(path, normalizeBaseUrl(baseUrl, '') + '/'), {
    method,
    headers: {
      ...jsonHeaders,
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  let rawBody = null;

  if (response.status !== 204) {
    if (contentType.includes('application/json')) {
      rawBody = await response.json();
    } else {
      rawBody = await response.text();
    }
  }

  const bodyData = rawBody && typeof rawBody === 'object' && 'data' in rawBody ? rawBody.data : rawBody;

  return {
    ok: response.ok,
    status: response.status,
    rawBody,
    body: bodyData,
    headers: response.headers,
  };
}
