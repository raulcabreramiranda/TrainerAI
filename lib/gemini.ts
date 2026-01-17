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

export async function askGemini(messages: GeminiMessage[]) {
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const payload = {
    systemInstruction,
    contents
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

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

  return output;
}
