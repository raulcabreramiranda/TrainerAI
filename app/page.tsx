import { redirect } from "next/navigation";
import { getUserIdFromCookies } from "@/lib/auth";

export default function HomePage() {
  const userId = getUserIdFromCookies();
  if (userId) {
    redirect("/dashboard");
  }
  redirect("/login");
}
