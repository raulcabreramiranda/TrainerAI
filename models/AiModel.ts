import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const aiModelSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ["GEMINI"], default: "GEMINI" },
    enabled: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 }
  },
  { timestamps: true, collection: "ai_models" }
);

export type AiModelDocument = InferSchemaType<typeof aiModelSchema> & {
  _id: mongoose.Types.ObjectId;
};

const MODEL_NAME = "AiModel";
const existingModel = mongoose.models[MODEL_NAME] as Model<AiModelDocument> | undefined;

if (existingModel) {
  const hasType = Boolean(existingModel.schema.path("type"));
  const hasEnabled = Boolean(existingModel.schema.path("enabled"));
  if (!hasType || !hasEnabled) {
    delete mongoose.models[MODEL_NAME];
  }
}

export const AiModel: Model<AiModelDocument> =
  mongoose.models[MODEL_NAME] || mongoose.model<AiModelDocument>(MODEL_NAME, aiModelSchema);
