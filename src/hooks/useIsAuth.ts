import { useSession } from "next-auth/react";

export function useIsAuth() {
  const session = useSession();

  if (session.status !== "authenticated") {
    return false;
  }

  return true;
}
