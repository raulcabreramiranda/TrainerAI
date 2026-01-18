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
        <GenerateDietClient />
      </Container>
    </div>
  );
}
