# Jev Decision Fabric

A production-oriented reference application for building software around TypeSafe AI's Jev/System One decision model.

Jev is used here as a bounded judgment layer: application state goes in, typed probabilistic decisions come back, and deterministic application code owns thresholds, routing, persistence, and execution.

## What this project demonstrates

- Typed Choice, Score, and Noul decisions through `@typesafe-ai/sdk`
- Confidence-aware routing with explicit autonomous/review/escalation policies
- Parallel multi-question evaluation in one System One request
- A composable decision pipeline with audit records
- Dry-run mode for development without API calls
- HTTP API and CLI
- Deterministic tests and CI
- Structured observability for latency and usage

## Architecture

```
State / Evidence
      |
      v
Choice + Score + Noul questions
      |
      v
Jev / System One
      |
      v
Explicit code policy
   |        |
  act     review
```

## Quick start

Requirements: Node.js 20+.

```bash
npm install
cp .env.example .env
# add TYPESAFE_API_KEY

npm run dev
```

No-network demo:

```bash
npm run demo
npm test
```

## API

```bash
curl -X POST http://localhost:3000/v1/decide/support \
  -H 'content-type: application/json' \
  -d '{"message":"I was charged twice and need a refund urgently.","customerTier":"pro"}'
```

The final action is decided by TypeScript policy code. Jev supplies semantic judgments; it does not own application permissions or execution.

## Structure

```
src/
  api.ts
  cli.ts
  config.ts
  decision-fabric.ts
  workflows/support.ts
  policies/support-policy.ts
  audit/audit-log.ts
  types/decisions.ts
tests/
examples/
```

This project integrates with the hosted Jev API; it does not contain Jev model weights.

Keep API credentials server-side and calibrate thresholds using your own domain data.
