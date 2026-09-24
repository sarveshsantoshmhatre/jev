import { TypeSafeClient, type Questions } from "@typesafe-ai/sdk";
import type { DecisionTrace } from "./types/decisions.js";

export interface FabricResult<TQuestions extends Questions> {
  answers: Awaited<ReturnType<TypeSafeClient["systemOne"]>>["answers"];
  traces: DecisionTrace[];
  latencyMs: number;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export interface DecisionFabricOptions {
  model?: string;
  apiKey?: string;
}

export class DecisionFabric {
  private readonly client: TypeSafeClient;
  private readonly model?: string;

  constructor(options: DecisionFabricOptions = {}) {
    this.client = new TypeSafeClient(options.apiKey ? { apiKey: options.apiKey } : {});
    this.model = options.model;
  }

  async evaluate<TQuestions extends Questions>(
    state: unknown,
    questions: TQuestions,
  ): Promise<FabricResult<TQuestions>> {
    const started = performance.now();
    const response = await this.client.systemOne({
      ...(this.model ? { model: this.model } : {}),
      state,
      questions,
    });
    const traces: DecisionTrace[] = [];

    for (const [questionId, answer] of Object.entries(response.answers)) {
      const a = answer as Record<string, unknown>;
      if ("choice" in a) {
        traces.push({
          questionId, kind: "choice", value: String(a.choice),
          ...(typeof a.confidence === "number" ? { confidence: a.confidence } : {}),
        });
      } else if ("score" in a) {
        traces.push({
          questionId, kind: "score", value: Number(a.score),
          ...(typeof a.confidence === "number" ? { confidence: a.confidence } : {}),
        });
      } else if ("noul" in a) {
        traces.push({
          questionId, kind: "noul", value: Boolean(a.noul),
          ...(typeof a.confidence === "number" ? { confidence: a.confidence } : {}),
        });
      }
    }

    const rawUsage = response.usage as Record<string, unknown> | undefined;
    return {
      answers: response.answers,
      traces,
      latencyMs: Math.round(performance.now() - started),
      ...(rawUsage ? {
        usage: {
          ...(typeof rawUsage.input_tokens === "number" ? { inputTokens: rawUsage.input_tokens } : {}),
          ...(typeof rawUsage.output_tokens === "number" ? { outputTokens: rawUsage.output_tokens } : {}),
        }
      } : {}),
    };
  }

  async evaluateOffline<TQuestions extends Questions>(
    state: unknown,
    answers: FabricResult<TQuestions>["answers"],
  ): Promise<FabricResult<TQuestions>> {
    return {
      answers,
      traces: Object.entries(answers).map(([questionId, answer]) => {
        const a = answer as Record<string, unknown>;
        if ("choice" in a) return { questionId, kind: "choice" as const, value: String(a.choice) };
        if ("score" in a) return { questionId, kind: "score" as const, value: Number(a.score) };
        return { questionId, kind: "noul" as const, value: Boolean(a.noul) };
      }),
      latencyMs: 0,
      usage: { inputTokens: JSON.stringify(state).length },
    };
  }
}
