import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { MessagesClient } from "./MessagesClient";

export default function MessagesPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <div className="mb-6">
          <p className="font-display text-3xl text-slate-900">Messages</p>
          <p className="text-sm text-slate-600">Chat history and safety-first questions.</p>
        </div>
        <MessagesClient />
      </Container>
    </div>
  );
}
