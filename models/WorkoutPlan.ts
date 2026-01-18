import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

export type WorkoutPlan = {
  location: "home" | "gym" | "outdoor";
  availableEquipment: string[];
  generalNotes: string;
  days: {
    dayIndex: number;
    label: string;
    focus: string;
    isRestDay: boolean;
    notes: string;
    exercises: {
      name: string;
      equipment: string;
      sets: number;
      reps: string;
      restSeconds: number;
      tempo?: string;
      order: number;
      notes?: string;
      imageUrl?: string;
    }[];
  }[];
};

const workoutExerciseSchema = new Schema(
  {
    name: { type: String, required: true },
    equipment: { type: String, required: true },
    sets: { type: Number, required: true },
    reps: { type: String, required: true },
    restSeconds: { type: Number, required: true },
    tempo: { type: String },
    order: { type: Number, required: true },
    notes: { type: String },
    imageUrl: { type: String }
  },
  { _id: false }
);

const workoutDaySchema = new Schema(
  {
    dayIndex: { type: Number, required: true },
    label: { type: String, required: true },
    focus: { type: String, required: true },
    isRestDay: { type: Boolean, required: true },
    notes: { type: String, required: true },
    exercises: { type: [workoutExerciseSchema], default: [] }
  },
  { _id: false }
);

const workoutPlanSchema = new Schema(
  {
    location: { type: String, enum: ["home", "gym", "outdoor"], required: true },
    availableEquipment: { type: [String], default: [] },
    generalNotes: { type: String, required: true },
    days: { type: [workoutDaySchema], default: [] }
  },
  { _id: false }
);

const workoutPlanRecordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String },
    description: { type: String },
    workoutPlanText: { type: String },
    workoutPlan: { type: workoutPlanSchema },
    model: { type: String },
    promptVersion: { type: String },
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true, collection: "workout_plans" }
);

export type WorkoutPlanDocument = InferSchemaType<typeof workoutPlanRecordSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const WorkoutPlanModel: Model<WorkoutPlanDocument> =
  mongoose.models.WorkoutPlan ||
  mongoose.model<WorkoutPlanDocument>("WorkoutPlan", workoutPlanRecordSchema);
