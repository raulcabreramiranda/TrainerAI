import { requireAuth } from "@/lib/require-auth";
import { Container } from "@/components/Container";
import { NavBar } from "@/components/NavBar";
import { UpdateDataClient } from "./UpdateDataClient";

export default function UpdateDataPage() {
  requireAuth();

  return (
    <div className="min-h-screen">
      <NavBar />
      <Container>
        <div className="mb-6">
          <p className="font-display text-3xl text-slate-900">Update data</p>
          <p className="text-sm text-slate-600">
            Keep your profile fresh so plans stay safe and relevant.
          </p>
        </div>
        <UpdateDataClient />
      </Container>
    </div>
  );
}
