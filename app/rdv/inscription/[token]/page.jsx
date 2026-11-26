import { ManageRegistrationView } from "../../_components/manage-registration-view";

// Lien des e-mails du participant à un événement : billets et annulation
export const metadata = {
  title: "Votre inscription",
  robots: { index: false, follow: false },
};

export default async function RdvRegistrationPage({ params, searchParams }) {
  const { token } = await params;
  const { embed } = await searchParams;
  return <ManageRegistrationView token={token} embed={embed === "1"} />;
}
