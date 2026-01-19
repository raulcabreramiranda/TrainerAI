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

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <WorkoutSessionClient
          planId={String(plan._id)}
          sessionId={searchParams?.sessionId}
          planTitle={plan.title ?? undefined}
          dayIndex={dayIndex}
          dayLabel={planDay.label}
          dayFocus={planDay.focus}
          dayNotes={planDay.notes}
          isRestDay={planDay.isRestDay}
          exercises={planDay.exercises || []}
        />
      </Container>
    </div>
  );
}
