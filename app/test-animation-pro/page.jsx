import { notFound } from "next/navigation";
import TestAnimationPro from "./test-animation-pro-content";

// Page de développement : jamais servie par un build de production
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <TestAnimationPro />;
}
