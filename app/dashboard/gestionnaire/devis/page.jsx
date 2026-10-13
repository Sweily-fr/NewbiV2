import ManagedDocumentsPage from "@/src/components/gestionnaire/managed-documents-page";

export const dynamic = "force-dynamic";

export default function Page({ searchParams }) {
  return <ManagedDocumentsPage kind="quotes" searchParams={searchParams} />;
}
