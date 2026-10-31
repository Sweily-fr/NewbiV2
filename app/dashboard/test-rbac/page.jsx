import { notFound } from "next/navigation";
import TestRBACPage from "./test-rbac-content";

// Page de développement : jamais servie par un build de production
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <TestRBACPage />;
}
