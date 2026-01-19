import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const workoutSetSchema = new Schema(
  {
    setIndex: { type: Number, required: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    targetReps: { type: String },
    weightKg: { type: Number, required: true, default: 0 },
    reps: { type: Number, required: true, default: 0 },
    completed: { type: Boolean, default: false },
    notes: { type: String }
  },
  { _id: false }
);

const workoutExerciseLogSchema = new Schema(
  {
    exerciseId: { type: String },
    name: { type: String, required: true },
    equipment: { type: String },
    order: { type: Number, required: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    status: { type: String, enum: ["done", "skipped", "partial"], default: "partial" },
    totalSetsPlanned: { type: Number },
    totalSetsCompleted: { type: Number },
    sets: { type: [workoutSetSchema], default: [] }
  },
  { _id: false }
);

const painSchema = new Schema(
  {
    hadPain: { type: Boolean, default: false, required: true },
    description: { type: String }
  },
  { _id: false }
);

const workoutSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "WorkoutPlan", required: true },
    planDayIndex: { type: Number, required: true },
    planDayLabel: { type: String, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    totalDurationSeconds: { type: Number },
    status: { type: String, enum: ["completed", "partial", "aborted"], default: "partial" },
    perceivedIntensity: { type: Number, min: 1, max: 10 },
    energyLevel: { type: Number, min: 1, max: 5 },
    painOrDiscomfort: { type: painSchema },
    notes: { type: String },
    exercises: { type: [workoutExerciseLogSchema], default: [] }
  },
  { timestamps: true, collection: "workout_sessions" }
);

export type WorkoutSessionDocument = InferSchemaType<typeof workoutSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

const MODEL_NAME = "WorkoutSession";
const existingModel = mongoose.models[MODEL_NAME] as Model<WorkoutSessionDocument> | undefined;

export const WorkoutSession: Model<WorkoutSessionDocument> =
  existingModel || mongoose.model<WorkoutSessionDocument>(MODEL_NAME, workoutSessionSchema);
