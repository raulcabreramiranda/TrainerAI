import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { GenerateDietClient } from "./GenerateDietClient";
import { PageHeader } from "@/components/PageHeader";

export default function GenerateDietPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <PageHeader titleKey="dietTitle" subtitleKey="dietSubtitle" />
        <GenerateDietClient />
      </Container>
    </div>
  );
}
