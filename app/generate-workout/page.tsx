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
        <div className="mb-6">
          <p className="font-display text-3xl text-slate-900">Workout plan</p>
          <p className="text-sm text-slate-600">Generate a safe, beginner-friendly routine.</p>
        </div>
        <GenerateWorkoutClient />
      </Container>
    </div>
  );
}
