import { DecisionFabric } from "./decision-fabric.js";
import { decideSupportAction } from "./policies/support-policy.js";
import { routeSupportTicket } from "./workflows/support.js";

const demoTicket = {
  message: "I was charged twice for the same subscription and need the duplicate payment reversed today.",
  customerTier: "pro" as const,
};

async function main(): Promise<void> {
  if (process.argv.includes("--demo") || !process.env.TYPESAFE_API_KEY) {
    const fabric = new DecisionFabric({ model: "jev-latest" });
    const result = await fabric.evaluateOffline(demoTicket, {
      department: { choice: "billing", confidence: 0.89 },
      urgency: { score: 4, confidence: 0.82 },
      needsHuman: { noul: false },
    });
    const decision = decideSupportAction({
      department: "billing",
      urgency: 4,
      needsHuman: false,
      departmentConfidence: 0.89,
      urgencyConfidence: 0.82,
    });
    console.log(JSON.stringify({ offline: true, result, decision }, null, 2));
    return;
  }

  const fabric = new DecisionFabric({
    model: process.env.TYPESAFE_MODEL ?? "jev-latest",
    apiKey: process.env.TYPESAFE_API_KEY,
  });
  console.log(JSON.stringify(await routeSupportTicket(demoTicket, fabric), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
