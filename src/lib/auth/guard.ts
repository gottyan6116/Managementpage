import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "./session";

export const SESSION_COOKIE = "promanage_session";

export async function hasValidSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, process.env.AUTH_SESSION_SECRET);
}

export async function requireSession(): Promise<void> {
  if (!(await hasValidSession())) redirect("/login");
}
