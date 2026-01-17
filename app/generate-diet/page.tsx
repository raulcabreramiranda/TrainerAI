import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { GenerateDietClient } from "./GenerateDietClient";

export default function GenerateDietPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <div className="mb-6">
          <p className="font-display text-3xl text-slate-900">Diet plan</p>
          <p className="text-sm text-slate-600">Simple, balanced nutrition guidance.</p>
        </div>
        <GenerateDietClient />
      </Container>
    </div>
  );
}
