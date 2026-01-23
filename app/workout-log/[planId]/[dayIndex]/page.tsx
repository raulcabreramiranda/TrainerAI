import { requireAuth } from "@/lib/require-auth";
import { connectDb } from "@/lib/db";
import { WorkoutPlanModel } from "@/models/WorkoutPlan";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { WorkoutSessionClient } from "./WorkoutSessionClient";

type PageProps = {
  params: {
    planId: string;
    dayIndex: string;
  };
  searchParams?: {
    sessionId?: string;
  };
};

export default async function WorkoutSessionPage({ params, searchParams }: PageProps) {
  const userId = requireAuth();
  const dayIndex = Number(params.dayIndex);

  if (process.env.E2E_MOCKS === "true") {
    const safeDayIndex = Number.isFinite(dayIndex) ? dayIndex : 1;
    const mockPlanDay = {
      label: `Day ${safeDayIndex}`,
      focus: "Full body",
      notes: "E2E mock session.",
      isRestDay: false,
      exercises: [
        {
          name: "Goblet squat",
          equipment: "Dumbbell",
          order: 1,
          sets: 3,
          reps: "10"
        },
        {
          name: "Push-up",
          equipment: "Bodyweight",
          order: 2,
          sets: 3,
          reps: "8-12"
        }
      ]
    };

    return (
      <div className="min-h-screen">
        <NavBar />
        <Container>
          <WorkoutSessionClient
            sessionId={searchParams?.sessionId}
            planTitle="E2E Workout Plan"
            dayIndex={safeDayIndex}
            dayLabel={mockPlanDay.label}
            dayFocus={mockPlanDay.focus}
            dayNotes={mockPlanDay.notes}
            isRestDay={mockPlanDay.isRestDay}
            exercises={mockPlanDay.exercises}
          />
        </Container>
      </div>
    );
  }

  await connectDb();

  const plan = await WorkoutPlanModel.findOne({ _id: params.planId, userId }).lean();
  if (!plan || !plan.workoutPlan || !Number.isFinite(dayIndex)) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <Container>
          <WorkoutSessionClient errorKey="workoutLogPlanMissing" />
        </Container>
      </div>
    );
  }

  const days = plan.workoutPlan.days || [];
  const planDay =
    days.find((day) => day.dayIndex === dayIndex) ??
    days[Math.max(dayIndex - 1, 0)] ??
    null;

  if (!planDay) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <Container>
          <WorkoutSessionClient errorKey="workoutLogDayMissing" />
        </Container>
      </div>
    );
  }

  const exercises = (planDay.exercises ?? []).map((exercise) => ({
    name: exercise.name,
    equipment: exercise.equipment ?? undefined,
    order: exercise.order,
    sets: exercise.sets,
    reps: exercise.reps,
    imageUrl: exercise.imageUrl ?? undefined
  }));

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <WorkoutSessionClient
          sessionId={searchParams?.sessionId}
          planTitle={plan.title ?? undefined}
          dayIndex={dayIndex}
          dayLabel={planDay.label}
          dayFocus={planDay.focus}
          dayNotes={planDay.notes}
          isRestDay={planDay.isRestDay}
          exercises={exercises}
        />
      </Container>
    </div>
  );
}
