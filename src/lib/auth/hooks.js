import { authClient } from "../auth-client";

export function useUser() {
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();
  return { session: session ? session : null, isPending, error, refetch };
}
