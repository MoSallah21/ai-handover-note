import { readFile, writeFile } from "fs/promises";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const systemPrompt = await readFile(
  "evals/handover-note/prompts/v0.txt",
  "utf-8",
);
async function main() {
  // Read all evaluation cases
  const raw = await readFile(
    "evals/handover-note.cases.json",
    "utf-8",
  );

  const cases = JSON.parse(raw);

  console.log(`Loaded ${cases.length} cases`);

  const results = [];

  // Run every case through the v0 prompt
  for (const testCase of cases) {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}

${JSON.stringify(testCase.input, null, 2)}`,
        },
      ],
    });

    // Collect text blocks from Claude's response
    let output = "";

    for (const block of response.content) {
      if (block.type === "text") {
        output += block.text;
      }
    }

    // Save one result for this case
    results.push({
      id: testCase.id,
      kind: testCase.kind,
      output: output,
    });

    console.log(`Completed ${testCase.id}`);
  }

  // Save all 20 outputs
  await writeFile(
    "evals/handover-note/v0.results.json",
    JSON.stringify(results, null, 2),
    "utf-8",
  );

  console.log("Saved v0.results.json");
}

main();