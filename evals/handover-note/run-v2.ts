import { readFile, writeFile } from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { renderHandoverInput } from "./render-handover-input.js";
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Count words for our Zod word limit
const maxWords = (text: string, max: number) =>
  text.trim().split(/\s+/).filter(Boolean).length <= max;

// Typed output contract
const HandoverNote = z.object({
  status: z.enum(["note", "insufficient_context"]),

  what_happened: z.string().refine(
    (text) => maxWords(text, 40),
    "what_happened must be 40 words or fewer",
  ),

  customer_needs: z.string(),
  blocked_by: z.string(),
  next_step: z.string(),
});

const systemPrompt = await readFile(
  "evals/handover-note/prompts/v2.txt",
  "utf-8",
);

async function main() {
  const raw = await readFile(
    "evals/handover-note.cases.json",
    "utf-8",
  );

  const cases = JSON.parse(raw);

  console.log(`Loaded ${cases.length} cases`);

  const results = [];


for (const testCase of cases) {
  try {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,

      messages: [
        {
          role: "user",
          content: renderHandoverInput(testCase.input),
        },
      ],

      output_config: {
        format: zodOutputFormat(HandoverNote),
      },
    });

    const output = response.parsed_output;

    if (!output) {
      throw new Error("No parsed output");
    }

    results.push({
      id: testCase.id,
      kind: testCase.kind,
      output,
    });

    console.log(`Completed ${testCase.id}`);
  } catch (error) {
    results.push({
      id: testCase.id,
      kind: testCase.kind,
      output: null,
      error: error instanceof Error ? error.message : String(error),
    });

    console.log(`Failed ${testCase.id}`);
  }
}

await writeFile(
  "evals/handover-note/v2.results.json",
  JSON.stringify(results, null, 2),
  "utf-8",
);

console.log("Saved v2.results.json");

  await writeFile(
    "evals/handover-note/v2.results.json",
    JSON.stringify(results, null, 2),
    "utf-8",
  );

  console.log("Saved v2.results.json");
}

main();