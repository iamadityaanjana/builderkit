// src/utils/session.ts
// Utility functions for storing and restoring Abstraxion login sessions

export const SESSION_KEY = 'xion_abstraxion_session';

export function saveSession(session: any) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): any | null {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
