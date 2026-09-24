import { describe, expect, it } from "vitest";
import { DecisionFabric } from "../src/decision-fabric.js";

describe("offline decision fabric", () => {
  it("preserves declared decision values", async () => {
    const fabric = new DecisionFabric();
    const result = await fabric.evaluateOffline(
      { text: "refund" },
      {
        route: { choice: "billing", confidence: 0.91 },
        risk: { score: 2, confidence: 0.86 },
        gate: { noul: false },
      },
    );

    expect(result.answers.route).toEqual({ choice: "billing", confidence: 0.91 });
    expect(result.answers.risk).toEqual({ score: 2, confidence: 0.86 });
    expect(result.answers.gate).toEqual({ noul: false });
    expect(result.latencyMs).toBe(0);
  });
});
