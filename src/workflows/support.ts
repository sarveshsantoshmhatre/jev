import { choice, noul, score } from "@typesafe-ai/sdk";
import { DecisionFabric } from "../decision-fabric.js";
import { decideSupportAction } from "../policies/support-policy.js";
import type { FabricDecision } from "../types/decisions.js";

export interface SupportTicket {
  message: string;
  customerTier?: "free" | "pro" | "enterprise";
  previousEvents?: string[];
}

export async function routeSupportTicket(
  ticket: SupportTicket,
  fabric: DecisionFabric,
): Promise<FabricDecision> {
  const result = await fabric.evaluate(ticket, {
    department: choice(
      "Which support department should own this message?",
      {
        billing: "Payments, invoices, refunds, charges, subscriptions, or pricing.",
        technical: "Bugs, integrations, API failures, outages, or product malfunction.",
        account: "Login, identity, permissions, profile, or account access.",
        other: "No specialist category clearly applies.",
      },
    ),
    urgency: score(
      "How urgent is this request for the support operation?",
      {
        1: "Routine; no meaningful time pressure.",
        2: "Some inconvenience, but normal handling is acceptable.",
        3: "Material user impact; prioritize within the normal queue.",
        4: "High impact, time-sensitive, or material business interruption.",
        5: "Critical; severe active impact or a strong need for immediate intervention.",
      },
    ),
    needsHuman: noul(
      "Should a human own the next decision because automation would be inappropriate or unsafe?",
    ),
  });

  const answers = result.answers as Record<string, Record<string, unknown>>;
  const department = String(answers.department?.choice ?? "other") as SupportTicketDepartment;
  const urgency = Number(answers.urgency?.score ?? 1);
  const needsHuman = Boolean(answers.needsHuman?.noul);
  const decision = decideSupportAction({
    department,
    urgency,
    needsHuman,
    departmentConfidence: Number(answers.department?.confidence ?? 1),
    urgencyConfidence: Number(answers.urgency?.confidence ?? 1),
  });

  return {
    ...decision,
    latencyMs: result.latencyMs,
    ...(result.usage ? { usage: result.usage } : {}),
  };
}

type SupportTicketDepartment = "billing" | "technical" | "account" | "other";
