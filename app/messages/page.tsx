import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { MessagesClient } from "./MessagesClient";
import { PageHeader } from "@/components/PageHeader";

export default function MessagesPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <PageHeader titleKey="messagesTitle" subtitleKey="messagesSubtitle" />
        <MessagesClient />
      </Container>
    </div>
  );
}
