import { redirect } from "next/navigation";
import { getUserIdFromCookies } from "./auth";

export function requireAuth() {
  const userId = getUserIdFromCookies();
  if (!userId) {
    redirect("/login");
  }
  return userId;
}
