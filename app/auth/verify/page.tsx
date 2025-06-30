import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export default async function AuthPage(props: {
  searchParams: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const email = searchParams.email;
  return (
    <main>
      <div className="flex h-screen">
        <div className="w-1/2 p-5 flex items-center min-h-screen justify-center">
          <div
            className="flex p-6 items-center justify-center w-full h-full rounded-lg bg-cover bg-center"
            style={{ backgroundImage: "url('/backgroundLogin.png')" }}
          ></div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-32">
          <div className="sm:mx-auto sm:max-w-3xl w-full px-4">
            <Card>
              <CardHeader className="">
                <CardTitle>Important, verifiez votre email</CardTitle>
                {email ? (
                  <CardDescription>
                    Un email vous a été envoyé à {email}, cliquez sur le lien
                    dans l'email pour modifier votre mot de passe.
                  </CardDescription>
                ) : null}
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
