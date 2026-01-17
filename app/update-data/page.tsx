import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { UpdateDataClient } from "./UpdateDataClient";
import { PageHeader } from "@/components/PageHeader";

export default function UpdateDataPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <PageHeader titleKey="updateDataTitle" subtitleKey="updateDataSubtitle" />
        <UpdateDataClient />
      </Container>
    </div>
  );
}
