const API_BASE = import.meta.env.PROD
  ? 'https://cup-predict.onrender.com/api'
  : '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function register(body: {
  username: string; fullName: string; email: string; studentId: string;
  password: string; classYear: string; department: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function getFixtures() {
  const res = await fetch(`${API_BASE}/fixtures`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function submitPrediction(fixtureId: string, scoreA: number, scoreB: number) {
  const res = await fetch(`${API_BASE}/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ fixtureId, scoreA, scoreB }),
  });
  return handleResponse(res);
}

export async function getPredictionHistory() {
  const res = await fetch(`${API_BASE}/predictions/history`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function saveBracket(bracket: {
  m1: string; m2: string; m3: string; m4: string;
  q1: string; q2: string; s1?: string; champion: string;
}) {
  const res = await fetch(`${API_BASE}/brackets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(bracket),
  });
  return handleResponse(res);
}

export async function lockBracket() {
  const res = await fetch(`${API_BASE}/brackets/lock`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getBracket(username: string) {
  const res = await fetch(`${API_BASE}/brackets/${username}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getNextFixture() {
  const res = await fetch(`${API_BASE}/fixtures/next`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getFixtureStats(fixtureId: string) {
  const res = await fetch(`${API_BASE}/fixtures/${fixtureId}/stats`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getLeaderboard() {
  const res = await fetch(`${API_BASE}/leaderboard?exclude=testuser`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}


