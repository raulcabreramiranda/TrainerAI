import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const aiModelSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    usageCount: { type: Number, default: 0 }
  },
  { timestamps: true, collection: "ai_models" }
);

export type AiModelDocument = InferSchemaType<typeof aiModelSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AiModel: Model<AiModelDocument> =
  mongoose.models.AiModel || mongoose.model<AiModelDocument>("AiModel", aiModelSchema);
