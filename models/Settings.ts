import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const settingsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    language: { type: String },
    units: { type: String, enum: ["metric", "imperial"] },
    notificationsEnabled: { type: Boolean }
  },
  { timestamps: true, collection: "settings" }
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Settings: Model<SettingsDocument> =
  mongoose.models.Settings ||
  mongoose.model<SettingsDocument>("Settings", settingsSchema);
