import * as React from "react";
import { useForm } from "react-hook-form";

// import { loginUser } from "../../api/userApi";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm();

  const onSubmit = async (formData: any) => {
    try {
      console.log(formData, "formData");
      //   await loginUser(formData);
    } catch (err: any) {
      setFormError("root", {
        type: "manual",
        message: err.message || "Erreur de connexion",
      });
      console.error(err);
    }
  };

  return (
    <form
      action="#"
      method="post"
      className="mt-6 space-y-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <Label
          htmlFor="email-login-04"
          className="text-sm font-medium text-foreground dark:text-foreground"
        >
          Email
        </Label>
        <Input
          type="email"
          id="email-login-04"
          name="email-login-04"
          autoComplete="email"
          placeholder="ephraim@blocks.so"
          className="mt-2"
          {...register("email", {
            required: "Email est requis",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email invalide",
            },
          })}
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <div>
        <Label
          htmlFor="password-login-04"
          className="text-sm font-medium text-foreground dark:text-foreground"
        >
          Mot de passe
        </Label>
        <Input
          type="password"
          id="password-login-04"
          name="password-login-04"
          autoComplete="password"
          placeholder="********"
          className="mt-2"
          {...register("password", {
            required: "Mot de passe est requis",
            minLength: {
              value: 6,
              message: "Le mot de passe doit contenir au moins 8 caractères",
            },
          })}
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" className="mt-4 w-full py-2 font-medium">
        Se connecter
      </Button>
    </form>
  );
};

export default LoginForm;
