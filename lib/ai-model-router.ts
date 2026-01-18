import { connectDb } from "@/lib/db";
import { AiModel } from "@/models/AiModel";
import { askGemini, GEMINI_MODEL, type GeminiMessage, type GeminiOptions } from "@/lib/gemini";
import { askOpenRouter } from "@/lib/openrouter";
import { askMistral } from "@/lib/mistral";
import { askGroq } from "@/lib/groq";
import { askCerebras } from "@/lib/cerebras";

type AiModelChoice = {
  id?: string;
  name: string;
  type: string;
};

async function getLeastUsedModel(): Promise<AiModelChoice> {
  await connectDb();
  const record = await AiModel.findOne({
    $or: [{ enabled: true }, { enabled: { $exists: false } }]
  }).sort({
    usageCount: 1,
    updatedAt: 1
  });
  if (!record) {
    throw new Error("No enabled AI models available");
  }
  return {
    id: String(record._id),
    name: record.name,
    type: record.type || "GEMINI"
  };
}

async function incrementModelUsage(model: AiModelChoice) {
  await connectDb();
  if (model.id) {
    await AiModel.updateOne(
      { _id: model.id },
      { $inc: { usageCount: 1 } }
    );
    return;
  }
  await AiModel.updateOne(
    { name: model.name, type: model.type },
    {
      $inc: { usageCount: 1 },
      $setOnInsert: { name: model.name, type: model.type, enabled: true }
    },
    { upsert: true }
  );
}

export async function askAiModel(
  messages: GeminiMessage[],
  options: GeminiOptions = {}
): Promise<{ text: string; model: string; type: string }> {
  const model = await getLeastUsedModel();
  console.info("model", model);
  let text = "";
  if (model.type === "GEMINI") {
    text = await askGemini(messages, options, model.name || GEMINI_MODEL);
  } else if (model.type === "OPENROUTER") {
    text = await askOpenRouter(messages, options, model.name);
  } else if (model.type === "MISTRAL") {
    text = await askMistral(messages, options, model.name);
  } else if (model.type === "GROQ") {
    text = await askGroq(messages, options, model.name);
  } else if (model.type === "CEREBRAS") {
    text = await askCerebras(messages, options, model.name);
  } else {
    throw new Error(`Unsupported model type: ${model.type}`);
  }
  await incrementModelUsage(model);
  return { text, model: model.name, type: model.type };
}
