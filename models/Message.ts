import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: Schema.Types.ObjectId, refPath: "planType" },
    planType: { type: String, enum: ["WorkoutPlan", "DietPlan"] },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    model: { type: String }
  },
  { timestamps: true, collection: "messages" }
);

export type MessageDocument = InferSchemaType<typeof messageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Message: Model<MessageDocument> =
  mongoose.models.Message || mongoose.model<MessageDocument>("Message", messageSchema);
