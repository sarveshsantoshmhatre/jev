import { describe, expect, it } from "vitest";
import { decideSupportAction } from "../src/policies/support-policy.js";

describe("support policy", () => {
  it("fast-lanes high urgency billing", () => {
    const decision = decideSupportAction({
      department: "billing",
      urgency: 4,
      needsHuman: false,
      departmentConfidence: 0.9,
      urgencyConfidence: 0.8,
    });
    expect(decision.action).toBe("billing-fast-lane");
    expect(decision.mode).toBe("autonomous");
  });

  it("escalates when the semantic gate says human", () => {
    const decision = decideSupportAction({
      department: "technical",
      urgency: 3,
      needsHuman: true,
    });
    expect(decision.action).toBe("human-review");
    expect(decision.mode).toBe("escalate");
  });

  it("reviews uncertain department decisions", () => {
    const decision = decideSupportAction({
      department: "other",
      urgency: 2,
      needsHuman: false,
      departmentConfidence: 0.3,
      urgencyConfidence: 0.8,
    });
    expect(decision.action).toBe("human-review");
    expect(decision.mode).toBe("review");
  });

  it("keeps deterministic policy separate from model probabilities", () => {
    const decision = decideSupportAction({
      department: "technical",
      urgency: 3,
      needsHuman: false,
      departmentConfidence: 0.99,
    });
    expect(decision.action).toBe("technical-agent");
  });
});
