import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { GenerateWorkoutClient } from "./GenerateWorkoutClient";
import { PageHeader } from "@/components/PageHeader";

export default function GenerateWorkoutPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <PageHeader titleKey="workoutTitle" subtitleKey="workoutSubtitle" />
        <GenerateWorkoutClient />
      </Container>
    </div>
  );
}
