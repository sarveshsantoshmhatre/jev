import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { FabricDecision } from "../types/decisions.js";

export interface AuditEvent {
  id: string;
  at: string;
  workflow: string;
  inputHash: string;
  decision: FabricDecision;
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex");
}

export async function auditDecision(
  workflow: string,
  input: unknown,
  decision: FabricDecision,
  path = "./var/audit/decisions.jsonl",
): Promise<AuditEvent> {
  await mkdir(dirname(path), { recursive: true });
  const event: AuditEvent = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    workflow,
    inputHash: await sha256(JSON.stringify(input)),
    decision,
  };
  await appendFile(path, JSON.stringify(event) + "\n", "utf8");
  return event;
}
