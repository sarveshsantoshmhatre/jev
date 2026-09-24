import type { DecisionMode, FabricDecision } from "../types/decisions.js";

export type SupportAction =
  | "billing-fast-lane"
  | "technical-agent"
  | "account-specialist"
  | "general-triage"
  | "human-review";

export interface SupportPolicyInput {
  department: "billing" | "technical" | "account" | "other";
  urgency: number;
  needsHuman: boolean;
  departmentConfidence?: number;
  urgencyConfidence?: number;
}

export function decideSupportAction(input: SupportPolicyInput): FabricDecision<SupportAction> {
  const traces = [
    {
      questionId: "department",
      kind: "choice" as const,
      value: input.department,
      ...(input.departmentConfidence === undefined ? {} : { confidence: input.departmentConfidence }),
    },
    {
      questionId: "urgency",
      kind: "score" as const,
      value: input.urgency,
      ...(input.urgencyConfidence === undefined ? {} : { confidence: input.urgencyConfidence }),
    },
    { questionId: "needsHuman", kind: "noul" as const, value: input.needsHuman },
  ];

  const result = (
    action: SupportAction,
    mode: DecisionMode,
    reason: string,
  ): FabricDecision<SupportAction> => ({ action, mode, reason, traces, latencyMs: 0 });

  if (input.needsHuman) return result(
    "human-review",
    "escalate",
    "The semantic review gate indicates that automation should not own the case.",
  );

  if (input.departmentConfidence !== undefined && input.departmentConfidence < 0.62) {
    return result(
      "human-review",
      "review",
      "Department uncertainty is below the configured autonomous threshold.",
    );
  }

  if (input.urgency >= 4 && input.urgencyConfidence !== undefined && input.urgencyConfidence < 0.60) {
    return result(
      "human-review",
      "review",
      "High-impact urgency classification is not sufficiently concentrated.",
    );
  }

  switch (input.department) {
    case "billing":
      return result(
        input.urgency >= 4 ? "billing-fast-lane" : "general-triage",
        "autonomous",
        input.urgency >= 4
          ? "Billing case crossed the configured fast-lane urgency threshold."
          : "Billing case can use the normal support queue.",
      );
    case "technical":
      return result("technical-agent", "autonomous", "Technical issue routed to the specialist workflow.");
    case "account":
      return result("account-specialist", "autonomous", "Account issue routed to the account workflow.");
    default:
      return result("general-triage", "autonomous", "No specialist queue was selected.");
  }
}
