import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb } from "./mongodb";
import { resend } from "./resend";

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      await resend.emails.send({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        text: `Clique sur le lien suivant pour réinitialiser votre mot de passe: ${url}`,
        from: "noreply@newbi.sweily.fr",
      });
    },
  },
  user: {
    additionalFields: {
      name: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      lastName: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      // avatar: {
      //   type: "string",
      //   required: false,
      //   defaultValue: "",
      // },
      company: {
        name: {
          type: "string",
          required: false,
          defaultValue: "",
        },
        email: {
          type: "string",
          required: false,
          defaultValue: "",
        },
        phone: {
          type: "string",
          required: false,
          defaultValue: "",
        },
        website: {
          type: "string",
          required: false,
          defaultValue: "",
        },
        logo: {
          type: "string",
          required: false,
          defaultValue: "",
        },
        // siret: {
        //   type: "string",
        //   required: false,
        //   defaultValue: "",
        // },
        // vatNumber: {
        //   type: "string",
        //   required: false,
        //   defaultValue: "",
        // },
        // transactionCategory: {
        //   type: "string",
        //   required: false,
        //   defaultValue: "",
        // },
        // vatPaymentCondition: {
        //   type: "string",
        //   required: false,
        //   defaultValue: "",
        // },
        // companyStatus: {
        //   type: "string",
        //   required: false,
        //   defaultValue: "",
        // },
        // capitalSocial: {
        //   type: "string",
        //   required: false,
        //   defaultValue: "",
        // },
        // rcs: {
        //   type: "string",
        //   required: false,
        //   defaultValue: "",
        // },
        address: {
          street: {
            type: "string",
            required: false,
            defaultValue: "",
          },
          city: {
            type: "string",
            required: false,
            defaultValue: "",
          },
          zipCode: {
            type: "string",
            required: false,
            defaultValue: "",
          },
          country: {
            type: "string",
            required: false,
            defaultValue: "",
          },
        },
        bankDetails: {
          bankName: {
            type: "string",
            required: false,
            defaultValue: "",
          },
          iban: {
            type: "string",
            required: false,
            defaultValue: "",
          },
          bic: {
            type: "string",
            required: false,
            defaultValue: "",
          },
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
});
