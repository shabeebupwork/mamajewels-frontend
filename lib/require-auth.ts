import { getCurrentUser, hasRole } from "@/lib/session";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();

  if (!hasRole(user.role, allowedRoles)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}