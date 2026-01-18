import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

export type DietPlan = {
  dietType: string;
  mealsPerDay: number;
  calorieTargetApprox?: number;
  allergies: string[];
  dislikedFoods: string[];
  generalNotes: string;
  days: {
    dayIndex: number;
    label: string;
    notes: string;
    meals: {
      mealType: string;
      time?: string;
      title: string;
      description: string;
      items: {
        name: string;
        portion: string;
        notes?: string;
      }[];
      approxCalories?: number;
      prepNotes?: string;
      dayPartNotes?: string;
      imageUrl?: string;
    }[];
  }[];
};

const dietItemSchema = new Schema(
  {
    name: { type: String, required: true },
    portion: { type: String, required: true },
    notes: { type: String }
  },
  { _id: false }
);

const dietMealSchema = new Schema(
  {
    mealType: { type: String, required: true },
    time: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    items: { type: [dietItemSchema], default: [] },
    approxCalories: { type: Number },
    prepNotes: { type: String },
    dayPartNotes: { type: String },
    imageUrl: { type: String }
  },
  { _id: false }
);

const dietDaySchema = new Schema(
  {
    dayIndex: { type: Number, required: true },
    label: { type: String, required: true },
    notes: { type: String, required: true },
    meals: { type: [dietMealSchema], default: [] }
  },
  { _id: false }
);

const dietPlanSchema = new Schema(
  {
    dietType: { type: String, required: true },
    mealsPerDay: { type: Number, required: true },
    calorieTargetApprox: { type: Number },
    allergies: { type: [String], default: [] },
    dislikedFoods: { type: [String], default: [] },
    generalNotes: { type: String, required: true },
    days: { type: [dietDaySchema], default: [] }
  },
  { _id: false }
);

const dietPlanRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String },
    description: { type: String },
    dietPlanText: { type: String },
    dietPlan: { type: dietPlanSchema },
    model: { type: String },
    promptVersion: { type: String },
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true, collection: "diet_plans" }
);

export type DietPlanDocument = InferSchemaType<typeof dietPlanRecordSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DietPlanModel: Model<DietPlanDocument> =
  mongoose.models.DietPlan ||
  mongoose.model<DietPlanDocument>("DietPlan", dietPlanRecordSchema);
