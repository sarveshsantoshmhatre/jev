export type DecisionMode = "autonomous" | "review" | "escalate";

export interface DecisionTrace {
  questionId: string;
  kind: "choice" | "score" | "noul";
  value: string | number | boolean;
  confidence?: number;
}

export interface FabricDecision<TAction extends string = string> {
  action: TAction;
  mode: DecisionMode;
  reason: string;
  traces: DecisionTrace[];
  latencyMs: number;
  usage?: { inputTokens?: number; outputTokens?: number };
}
