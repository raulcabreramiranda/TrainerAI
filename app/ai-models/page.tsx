import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { PageHeader } from "@/components/PageHeader";
import { AiModelsClient } from "./AiModelsClient";

export default async function AiModelsPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <PageHeader titleKey="aiModelsTitle" subtitleKey="aiModelsSubtitle" />
        <AiModelsClient />
      </Container>
    </div>
  );
}
