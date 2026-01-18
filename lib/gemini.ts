import { connectDb } from "@/lib/db";
import { AiModel } from "@/models/AiModel";

export type GeminiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

type GeminiErrorPayload = {
  error?: {
    message?: string;
    details?: { retryDelay?: string }[];
  };
};

function getRetryDelayMs(payload: GeminiErrorPayload) {
  const retry = payload.error?.details?.find((detail) => detail.retryDelay);
  if (!retry?.retryDelay) return 0;
  const match = retry.retryDelay.match(/^(\d+)(s|ms)?$/);
  if (!match) return 0;
  const value = Number(match[1]);
  return match[2] === "ms" ? value : value * 1000;
}

type GeminiOptions = {
  responseMimeType?: string;
};

type AskGeminiResult = {
  text: string;
  model: string;
};

async function getLeastUsedModel(): Promise<{ name: string; id?: string }> {
  try {
    await connectDb();
    const record = await AiModel.findOne().sort({ usageCount: 1, updatedAt: 1 });
    if (record?.name) {
      return { name: record.name, id: String(record._id) };
    }
  } catch (error) {
    console.error("Failed to load AI models", error);
  }
  return { name: GEMINI_MODEL };
}

async function incrementModelUsage(modelName: string) {
  try {
    await connectDb();
    await AiModel.updateOne(
      { name: modelName },
      { $inc: { usageCount: 1 }, $setOnInsert: { name: modelName } },
      { upsert: true }
    );
  } catch (error) {
    console.error("Failed to update AI model usage", error);
  }
}

export async function askGemini(
  messages: GeminiMessage[],
  options: GeminiOptions = {}
): Promise<AskGeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const systemMessages = messages.filter((message) => message.role === "system");
  const nonSystemMessages = messages.filter((message) => message.role !== "system");

  const systemInstruction = systemMessages.length
    ? {
        parts: systemMessages.map((message) => ({ text: message.content }))
      }
    : undefined;

  const contents = nonSystemMessages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }]
  }));

  const { name: selectedModel } = await getLeastUsedModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
  const payload: {
    systemInstruction?: { parts: { text: string }[] };
    contents: { role: string; parts: { text: string }[] }[];
    generationConfig?: { responseMimeType?: string };
  } = {
    systemInstruction,
    contents
  };
  if (options.responseMimeType) {
    payload.generationConfig = { responseMimeType: options.responseMimeType };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  console.info("responseText", response);


  if (!response.ok) {
    let errorPayload: GeminiErrorPayload = {};
    try {
      errorPayload = (await response.json()) as GeminiErrorPayload;
    } catch {
      const text = await response.text();
      console.error("Gemini API error:", text);
      throw new Error("Failed to generate content");
    }

    if (response.status === 429) {
      const retryDelayMs = getRetryDelayMs(errorPayload);
      console.error("Gemini API rate limited:", errorPayload);
      throw new Error(
        retryDelayMs
          ? `Rate limited. Retry in ${Math.ceil(retryDelayMs / 1000)}s.`
          : "Rate limited. Please retry shortly."
      );
    }

    console.error("Gemini API error:", errorPayload);
    throw new Error(errorPayload.error?.message ?? "Failed to generate content");
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!output) {
    throw new Error("Gemini returned empty response");
  }

  await incrementModelUsage(selectedModel);

  return { text: output, model: selectedModel };
}
