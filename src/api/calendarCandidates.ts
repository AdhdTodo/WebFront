import { apiClient } from "./client";
import type { CalendarCandidate, CalendarCandidateScheduleResponse } from "../types/api";

export interface CalendarCandidateScheduleInput {
  start_at: string;
  end_at: string;
  timezone?: string;
  location?: string;
  placement_source?: string;
  is_locked?: boolean;
  user_note?: string;
}

export async function listCalendarCandidates(sessionId: number) {
  const response = await apiClient.get<CalendarCandidate[]>("/calendar/candidates", {
    params: { session_id: sessionId, limit: 100 },
  });
  return response.data;
}

export async function createCalendarCandidatesFromSuggestions(
  sessionId: number,
  suggestionIds?: number[],
) {
  const response = await apiClient.post<CalendarCandidate[]>(
    "/calendar/candidates/from-suggestions",
    {
      session_id: sessionId,
      suggestion_ids: suggestionIds,
    },
  );
  return response.data;
}

export async function scheduleCalendarCandidate(
  candidateId: number,
  payload: CalendarCandidateScheduleInput,
) {
  const response = await apiClient.post<CalendarCandidateScheduleResponse>(
    `/calendar/candidates/${candidateId}/schedule`,
    payload,
  );
  return response.data;
}

export async function scheduleSuggestionAsCalendarCandidate(
  sessionId: number,
  suggestionId: number,
  payload: CalendarCandidateScheduleInput,
) {
  const response = await apiClient.post<CalendarCandidateScheduleResponse>(
    "/calendar/candidates/from-suggestion/schedule",
    {
      session_id: sessionId,
      suggestion_id: suggestionId,
      ...payload,
    },
  );
  return response.data;
}
