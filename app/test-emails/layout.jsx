import { notFound } from "next/navigation";

export const metadata = {
  title: "Test Email Templates - Newbi",
  description: "Page de test pour visualiser les templates d'emails",
};

// Outil de dev uniquement : la route API associée (/api/test-email) envoie de
// vrais emails sans authentification, elle ne doit jamais être joignable en prod.
export default function TestEmailsLayout({ children }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return children;
}
