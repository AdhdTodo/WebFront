import { apiClient } from "./client";
import type { FeedbackResponse, Reaction } from "../types/api";

export async function createFeedback(
  sessionId: number,
  suggestionId: number,
  reaction: Reaction,
  note?: string,
) {
  const response = await apiClient.post<FeedbackResponse>("/feedback", {
    session_id: sessionId,
    suggestion_id: suggestionId,
    reaction,
    note,
  });
  return response.data;
}
