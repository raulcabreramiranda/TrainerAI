import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { PageHeader } from "@/components/PageHeader";
import { DashboardClient } from "./DashboardClient";

export default function DashboardPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <PageHeader titleKey="dashboardTitle" subtitleKey="dashboardSubtitle" />
        <DashboardClient />
      </Container>
    </div>
  );
}
//  , create a prompt to tell codex  that build for me 