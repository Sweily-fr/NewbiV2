"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { RoleRouteGuard } from "@/src/components/rbac/RBACRouteGuard";
import SignatureEditor from "../_v2/components/SignatureEditor";
import { SignatureEditorV2Skeleton } from "../_v2/components/signature-v2-skeleton";

function EditorContent() {
  const params = useParams();
  return <SignatureEditor id={params.id} />;
}

export default function SignatureV2EditorPage() {
  return (
    <RoleRouteGuard
      roles={["owner", "admin", "member", "viewer"]}
      fallbackUrl="/dashboard"
      toastMessage="Vous n'avez pas accès aux signatures de mail."
      loadingComponent={<SignatureEditorV2Skeleton />}
    >
      <Suspense fallback={<SignatureEditorV2Skeleton />}>
        <EditorContent />
      </Suspense>
    </RoleRouteGuard>
  );
}
