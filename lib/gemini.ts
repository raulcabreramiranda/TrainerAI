export type GeminiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const DEFAULT_MODEL = "gemini-2.0-flash";

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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction,
        contents
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("Gemini API error:", text);
    throw new Error("Failed to generate content");
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
