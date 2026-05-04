import { apiClient } from "./client";

export interface Routine {
  id: number;
  user_id?: number;
  title: string;
  micro_step: string;
  effort_level: "quiet" | "gentle" | "neutral";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoutineInput {
  title: string;
  micro_step: string;
  effort_level: "quiet" | "gentle" | "neutral";
  is_active: boolean;
}

export async function listRoutines() {
  const response = await apiClient.get<Routine[]>("/routines");
  return response.data;
}

export async function createRoutine(payload: RoutineInput) {
  const response = await apiClient.post<Routine>("/routines", payload);
  return response.data;
}

export async function updateRoutine(id: number, payload: Partial<RoutineInput>) {
  const response = await apiClient.patch<Routine>(`/routines/${id}`, payload);
  return response.data;
}

export async function deleteRoutine(id: number) {
  await apiClient.delete(`/routines/${id}`);
}
