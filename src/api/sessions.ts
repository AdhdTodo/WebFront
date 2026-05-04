import { apiClient } from "./client";
import type { Action, BrainDump, Feedback, Session } from "../types/api";

export async function getSession(sessionId: number) {
  const response = await apiClient.get<Session>(`/sessions/${sessionId}`);
  return response.data;
}

export async function listSessionBrainDumps(sessionId: number) {
  const response = await apiClient.get<BrainDump[]>(`/sessions/${sessionId}/brain-dumps`);
  return response.data;
}

export async function listSessionActions(sessionId: number) {
  const response = await apiClient.get<Action[]>(`/sessions/${sessionId}/actions`);
  return response.data;
}

export async function listSessionFeedback(sessionId: number) {
  const response = await apiClient.get<Feedback[]>(`/sessions/${sessionId}/feedback`);
  return response.data;
}
