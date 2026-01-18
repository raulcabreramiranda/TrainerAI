import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { GenerateWorkoutClient } from "./GenerateWorkoutClient";

export default function GenerateWorkoutPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <GenerateWorkoutClient />
      </Container>
    </div>
  );
}
