import { apiClient } from "./client";
import type { CalendarEvent } from "../types/api";

export interface CalendarEventInput {
  title?: string;
  description?: string;
  start_at: string;
  end_at: string;
  timezone?: string;
  location?: string;
  session_id?: number;
  action_id?: number;
  source?: string;
}

export async function listCalendarEvents(startAt?: string, endAt?: string) {
  const response = await apiClient.get<CalendarEvent[]>("/calendar/events", {
    params: {
      start_at: startAt,
      end_at: endAt,
      limit: 200,
    },
  });
  return response.data;
}

export async function createCalendarEvent(payload: CalendarEventInput) {
  const response = await apiClient.post<CalendarEvent>("/calendar/events", payload);
  return response.data;
}

export async function deleteCalendarEvent(eventId: number) {
  await apiClient.delete(`/calendar/events/${eventId}`);
}

export async function downloadCalendarIcs() {
  const response = await apiClient.get<string>("/calendar/events.ics", {
    responseType: "text",
  });
  return response.data;
}
