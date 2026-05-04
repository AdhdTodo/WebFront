import { apiClient } from "./client";

export interface AIStatus {
  enabled: boolean;
  model: string;
  structuredOutput: boolean;
  cacheEnabled: boolean;
  rateLimitEnabled: boolean;
  budgetLimitEnabled: boolean;
  fallback: string;
  promptVersion: string;
}

export interface AIUsageMe {
  todayCalls: number;
  todayEstimatedCost: number;
  monthlyEstimatedCost: number;
  cacheHits: number;
  fallbackCount: number;
  lastUsedAt: string | null;
}

export async function getAIStatus() {
  const response = await apiClient.get<AIStatus>("/ai/status");
  return response.data;
}

export async function getMyAIUsage() {
  const response = await apiClient.get<AIUsageMe>("/ai/usage/me");
  return response.data;
}
