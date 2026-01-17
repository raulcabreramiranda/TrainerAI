import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { Disclaimer } from "@/components/Disclaimer";
import { PageHeader } from "@/components/PageHeader";
import { DashboardClient } from "./DashboardClient";

export default function DashboardPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <PageHeader titleKey="dashboardTitle" subtitleKey="dashboardSubtitle" />
        <div className="mb-6">
          <Disclaimer />
        </div>
        <DashboardClient />
      </Container>
    </div>
  );
}
