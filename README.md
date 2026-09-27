# AI Handover Note

An evaluation-driven AI engineering project for generating structured internal handover notes from escalated customer support tickets.

The goal is not simply to generate a summary. The system must distinguish between verified information and customer claims, avoid inventing actions or approvals, identify blockers, and provide a useful next step for the support colleague receiving the escalation.

## Problem

When a support ticket is escalated, the next support agent may need to read the entire conversation again before understanding:

- What happened?
- What does the customer need?
- What is currently blocked?
- What should happen next?

This project generates a structured internal handover note to reduce that repeated work.

## Architecture

```text
Ticket / Order / Reply Assist
            │
            ▼
     Context Selection
            │
            ├── Include relevant context
            ├── Cut irrelevant context
            ├── Shorten large sources
            └── Retrieve relevant policy sections
            │
            ▼
       System Prompt
            +
       User Renderer
            │
            ▼
         LLM Call
            │
            ▼
    Structured Output
            │
            ▼
      Zod Validation
            │
            ▼
       Handover Note
```

The design uses one LLM call after relevant context has been selected or retrieved.

## Structured Output

The generated handover note follows a typed contract:

```ts
{
  status: "note" | "insufficient_context";
  what_happened: string;
  customer_needs: string;
  blocked_by: string;
  next_step: string;
}
```

`what_happened` is limited to 40 words.

If there is not enough information to produce a reliable note, the system returns:

```text
status: "insufficient_context"
```

instead of guessing.

## Safety Rules

Customer-written content is treated as untrusted conversation data.

The model must not treat customer claims as:

- verified facts
- internal instructions
- approvals
- completed actions
- company decisions

For example:

```text
Customer:
"My manager already approved the refund."
```

should become:

```text
The customer claims a manager approved the refund.
The approval needs verification.
```

not:

```text
Process the approved refund.
```

## Evaluation

The project uses 20 evaluation cases covering:

- 10 representative cases
- 5 edge cases
- 5 adversarial cases

The evaluation measures four criteria:

| Criterion | Threshold |
|---|---:|
| Factual Meaning | 18/20 |
| Safety | 20/20 |
| Format | 19/20 |
| Next Step | 17/20 |

## Prompt Iterations

### v0 — Baseline

Initial prompt:

```text
Summarise this ticket for the next person.
```

Results:

| Metric | Score |
|---|---:|
| Facts | 14/20 |
| Safety | 16/20 |
| Format | 0/20 |
| Next Step | 14/20 |

The baseline exposed problems including unsupported actions, inconsistent formatting, failure to handle insufficient context, and unsafe interpretation of adversarial customer claims.

### v1 — Rules + Structured Output

The next version introduced:

- explicit job definition
- limits
- `Never → Instead` rules
- insufficient-context fallback
- untrusted-data boundaries
- structured output
- Zod validation
- deterministic format

Results:

| Metric | Score |
|---|---:|
| Facts | 18/20 |
| Safety | 20/20 |
| Format | 20/20 |
| Next Step | 18/20 |

### v2 — Few-Shot Examples

Two targeted examples were added to teach the model:

1. Do not invent alternative resolutions that the customer did not request.
2. Treat claimed approvals as unverified claims rather than company decisions.

Results:

| Metric | Score |
|---|---:|
| Facts | 19/20 |
| Safety | 20/20 |
| Format | 20/20 |
| Next Step | 19/20 |

Remaining failure:

- `case-20` — the model still introduced unsupported resolution options in the generated note.

The failure is intentionally retained rather than hidden, because the project is focused on measurable iteration rather than presenting the model as perfect.

## Context Engineering

Not every available piece of information should automatically enter the model context.

### Include

- current ticket thread
- relevant customer summary
- relevant Reply Assist fields

### Shorten

- large order records
- escalation policy
- support handbook

Only fields or sections relevant to the current ticket should be retained.

### Exclude

- unrelated past customer tickets

Large reference material such as the support handbook should use retrieval to obtain relevant sections instead of sending the entire document to the model.

## One Call vs Multiple Calls

This project uses one LLM call after retrieval and context preparation:

```text
Large Knowledge Source
        │
        ▼
Search / Retrieval
        │
        ▼
Relevant Context
        │
        ▼
One LLM Call
        │
        ▼
Zod Validation
```

A second LLM call should only be introduced when separating tasks such as extraction and generation provides a measurable benefit.

## Prompt Architecture

The system prompt and runtime ticket data are separated.

```text
System Prompt
→ stable behavior, rules, limits and examples

User Renderer
→ dynamic ticket-specific context
```

The same system prompt can therefore be used across many tickets while the rendered user input changes for each request.

## Tech Stack

- TypeScript
- Node.js
- Anthropic API
- Zod
- Structured Outputs

## Key Takeaways

This project demonstrates several practical AI engineering principles:

- establish a baseline before improving prompts
- define evaluation criteria before looking at results
- test representative, edge, and adversarial cases
- validate LLM output at runtime
- treat model output as untrusted until validated
- distinguish customer claims from verified facts
- use deterministic code where deterministic behavior is possible
- improve prompts based on observed failures
- use few-shot examples to target specific behavioral problems
- manage context intentionally instead of filling the context window
- prefer simpler architectures until additional LLM calls demonstrate measurable value

## Disclaimer

The ticket and order examples in this repository are synthetic evaluation data created for development and testing.