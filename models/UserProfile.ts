import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const userProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    age: { type: Number },
    gender: { type: String },
    heightCm: { type: Number },
    weightKg: { type: Number },
    goal: { type: String, required: true },
    experienceLevel: { type: String, required: true },
    daysPerWeek: { type: Number, required: true },
    preferredLocation: { type: String },
    availableEquipment: [{ type: String }],
    injuriesOrLimitations: { type: String },
    dietType: { type: String },
    allergies: [{ type: String }],
    dislikedFoods: [{ type: String }],
    mealsPerDay: { type: Number },
    calorieTarget: { type: Number },
    notes: { type: String },
    avatarBase64: { type: String },
    avatarContentType: { type: String }
  },
  { timestamps: true, collection: "userprofiles" }
);

export type UserProfileDocument = InferSchemaType<typeof userProfileSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserProfile: Model<UserProfileDocument> =
  mongoose.models.UserProfile ||
  mongoose.model<UserProfileDocument>("UserProfile", userProfileSchema);
