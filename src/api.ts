import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { loadConfig } from "./config.js";
import { DecisionFabric } from "./decision-fabric.js";
import { auditDecision } from "./audit/audit-log.js";
import { routeSupportTicket, type SupportTicket } from "./workflows/support.js";

const config = loadConfig();
const fabric = new DecisionFabric({
  model: config.model,
  ...(config.apiKey ? { apiKey: config.apiKey } : {}),
});

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

async function parseBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return json(res, 200, {
        ok: true,
        model: config.model,
        inferenceConfigured: Boolean(config.apiKey),
      });
    }

    if (req.method === "POST" && req.url === "/v1/decide/support") {
      if (!config.apiKey) {
        return json(res, 503, {
          error: "TYPESAFE_API_KEY is not configured",
          hint: "Copy .env.example to .env and add your key.",
        });
      }

      const body = await parseBody(req) as Partial<SupportTicket>;
      if (typeof body.message !== "string" || !body.message.trim()) {
        return json(res, 400, { error: "message must be a non-empty string" });
      }

      const decision = await routeSupportTicket(body as SupportTicket, fabric);
      await auditDecision("support-routing", body, decision);
      return json(res, 200, decision);
    }

    return json(res, 404, { error: "not_found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return json(res, 500, { error: message });
  }
});

server.listen(config.port, () => {
  console.log("Jev Decision Fabric listening on http://localhost:" + config.port);
});
