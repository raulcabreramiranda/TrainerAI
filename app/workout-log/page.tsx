import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { PageHeader } from "@/components/PageHeader";
import { WorkoutLogClient } from "./WorkoutLogClient";

export default function WorkoutLogPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <PageHeader titleKey="workoutLogTitle" subtitleKey="workoutLogSubtitle" />
        <WorkoutLogClient />
      </Container>
    </div>
  );
}
