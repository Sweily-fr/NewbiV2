"use client";
import FormAccount from "./formAccount";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { useUser } from "../../../src/lib/auth/hooks";

export default function Account() {
  const { session } = useUser();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <h1 className="text-2xl font-semibold mb-6">Informations personnelles</h1>
      <FormAccount user={session?.user} />
      <div className="flex flex-col py-4 md:py-6 p-6">
        <Separator />
        <h3 className="text-lg font-semibold mt-6">Désactivation du compte</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Si vous souhaitez désactiver votre compte, vous pouvez le faire en
          cliquant sur le bouton "Désactiver mon compte".
        </p>
        <Button
          variant="destructive"
          className="w-1/5 mt-8 cursor-pointer"
          // onClick={() => navigate("/dashboard/account/password")}
        >
          Désactiver mon compte
        </Button>
      </div>
    </div>
  );
}
