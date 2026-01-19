import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { PageHeader } from "@/components/PageHeader";
import { ChangePasswordClient } from "./ChangePasswordClient";

export default function ChangePasswordPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <PageHeader titleKey="changePasswordTitle" subtitleKey="changePasswordSubtitle" />
        <ChangePasswordClient />
      </Container>
    </div>
  );
}
