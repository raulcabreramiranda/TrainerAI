import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { Disclaimer } from "@/components/Disclaimer";
import { DashboardClient } from "./DashboardClient";

export default function DashboardPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <div className="mb-6">
          <p className="font-display text-3xl text-slate-900">Dashboard</p>
          <p className="text-sm text-slate-600">
            Your profile summary and active plan live here.
          </p>
        </div>
        <div className="mb-6">
          <Disclaimer />
        </div>
        <DashboardClient />
      </Container>
    </div>
  );
}
