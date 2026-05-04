import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as aiApi from "../../api/ai";
import { AiSettingsPanel } from "./AiSettingsPanel";

vi.mock("../../api/ai");

describe("AiSettingsPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders backend usage metrics", async () => {
    vi.mocked(aiApi.getAIStatus).mockResolvedValue({
      enabled: true,
      model: "gpt-4.1-mini",
      structuredOutput: true,
      cacheEnabled: true,
      rateLimitEnabled: true,
      budgetLimitEnabled: true,
      fallback: "rule_based",
      promptVersion: "v1",
    });
    vi.mocked(aiApi.getMyAIUsage).mockResolvedValue({
      todayCalls: 2,
      todayEstimatedCost: 0.001,
      monthlyEstimatedCost: 0.01,
      cacheHits: 1,
      fallbackCount: 1,
      fallbackReasons: { AI_SERVICE_ERROR: 1 },
      lastUsedAt: null,
    });

    render(<AiSettingsPanel />);

    expect(await screen.findByText("recent 24h actual calls")).toBeInTheDocument();
    expect(screen.getByText("AI_SERVICE_ERROR: 1")).toBeInTheDocument();
  });

  it("hides usage metrics when status api fails", async () => {
    vi.mocked(aiApi.getAIStatus).mockRejectedValue(new Error("offline"));
    vi.mocked(aiApi.getMyAIUsage).mockRejectedValue(new Error("offline"));

    render(<AiSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText("AI 상태를 불러오지 못했습니다.")).toBeInTheDocument();
    });
    expect(screen.queryByText("recent 24h actual calls")).not.toBeInTheDocument();
  });
});
