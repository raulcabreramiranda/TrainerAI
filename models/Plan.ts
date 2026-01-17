import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const planSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String },
    description: { type: String },
    workoutPlanText: { type: String },
    dietPlanText: { type: String },
    model: { type: String },
    promptVersion: { type: String },
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true, collection: "plans" }
);

export type PlanDocument = InferSchemaType<typeof planSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Plan: Model<PlanDocument> =
  mongoose.models.Plan || mongoose.model<PlanDocument>("Plan", planSchema);
