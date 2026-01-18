import type { GeminiMessage, GeminiOptions } from "@/lib/gemini";

type MistralResponse = {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
};

export async function askMistral(
  messages: GeminiMessage[],
  options: GeminiOptions = {},
  modelName: string
): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not set");
  }

  const payload: {
    model: string;
    messages: { role: string; content: string }[];
    response_format?: { type: string };
  } = {
    model: modelName,
    messages: messages.map((message) => ({ role: message.role, content: message.content }))
  };

  if (options.responseMimeType === "application/json") {
    payload.response_format = { type: "json_object" };
  }
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.info("apiKey, payload,", apiKey, payload);
    console.info("responseText",  response);
    let errorPayload: MistralResponse = {};
    try {
      errorPayload = (await response.json()) as MistralResponse;
    } catch {
      const text = await response.text();
      console.error("Mistral API error:", text);
      throw new Error("Failed to generate content");
    }
    console.error("Mistral API error:", errorPayload);
    throw new Error(errorPayload.error?.message ?? "Failed to generate content");
  }

  const data = (await response.json()) as MistralResponse;
  const output = data.choices?.[0]?.message?.content;
  console.info("output",  output);
  if (!output) {
    throw new Error("Mistral returned empty response");
  }

  return output;
}
