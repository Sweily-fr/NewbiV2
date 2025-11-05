import { cn } from "@/src/lib/utils";
import {
  Mail,
  Shield,
  CheckCircle,
  Send,
  Lock,
  Key,
} from "lucide-react";

export default async function AuthPage(props) {
  const searchParams = await props.searchParams;
  const email = searchParams.email;

  const VerifyCard = ({ children, className, borderClassName }) => {
    return (
      <div
        className={cn(
          "bg-background relative flex size-20 rounded-xl dark:bg-transparent",
          className
        )}
      >
        <div
          role="presentation"
          className={cn(
            "absolute inset-0 rounded-xl border border-black/5 dark:border-white/10",
            borderClassName
          )}
        />
        <div className="relative z-20 m-auto size-fit *:size-6">{children}</div>
      </div>
    );
  };

  return (
    <section>
      <div className="bg-white dark:bg-background min-h-screen flex items-center justify-center py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative mx-auto w-fit">
            <div
              role="presentation"
              className="absolute inset-0 z-10 bg-gradient-radial from-transparent via-transparent to-white dark:to-background"
              style={{
                background:
                  "radial-gradient(circle, transparent 0%, transparent 40%, white 75%, white 100%)",
              }}
            ></div>
            <div className="mx-auto mb-2 flex w-fit justify-center gap-2">
              <VerifyCard>
                <Mail className="text-gray-200 w-6 h-6" />
              </VerifyCard>
              <VerifyCard>
                <Send className="text-gray-200 w-6 h-6" />
              </VerifyCard>
            </div>
            <div className="mx-auto my-2 flex w-fit justify-center gap-2">
              <VerifyCard>
                <Shield className="text-gray-200 w-6 h-6" />
              </VerifyCard>

              <VerifyCard
                borderClassName="shadow-black-950/10 shadow-xl border-black/5 dark:border-white/10"
                className="dark:bg-white/10"
              >
                <img src="/ni2.svg" alt="Newbi" className="w-6 h-6" />
              </VerifyCard>
              <VerifyCard>
                <CheckCircle className="text-gray-200 w-6 h-6" />
              </VerifyCard>
            </div>

            <div className="mx-auto flex w-fit justify-center gap-2">
              <VerifyCard>
                <Lock className="text-gray-200 w-6 h-6" />
              </VerifyCard>

              <VerifyCard>
                <Key className="text-gray-200 w-6 h-6" />
              </VerifyCard>
            </div>
          </div>
          <div className="mx-auto mt-6 max-w-lg space-y-6 text-center">
            <div className="space-y-3">
              <h2 className="text-balance text-3xl font-medium md:text-4xl">
                Vérifiez votre email
              </h2>
            </div>

            {email ? (
              <p className="text-muted-foreground text-sm">
                Un email de vérification a été envoyé à{" "}
                <strong>{email}</strong>. Cliquez sur le lien dans l'email pour
                vérifier votre compte et continuer.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Un email de vérification vous a été envoyé. Veuillez vérifier
                votre boîte de réception et cliquer sur le lien pour continuer.
              </p>
            )}

            <div className="pt-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Vérifiez également vos spams</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
