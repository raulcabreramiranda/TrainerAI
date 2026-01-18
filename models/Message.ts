import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: Schema.Types.ObjectId, refPath: "planType" },
    planType: { type: String, enum: ["WorkoutPlan", "DietPlan"] },
    systemContent: { type: String },
    userContent: { type: String },
    assistantContent: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    model: { type: String }
  },
  { timestamps: true, collection: "messages" }
);

export type MessageDocument = InferSchemaType<typeof messageSchema> & {
  _id: mongoose.Types.ObjectId;
};

const MODEL_NAME = "Message";
const existingModel = mongoose.models[MODEL_NAME] as Model<MessageDocument> | undefined;

if (existingModel) {
  const hasRating = Boolean(existingModel.schema.path("rating"));
  if (!hasRating) {
    delete mongoose.models[MODEL_NAME];
  }
}

export const Message: Model<MessageDocument> =
  mongoose.models[MODEL_NAME] || mongoose.model<MessageDocument>(MODEL_NAME, messageSchema);
