import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb, ensureConnection } from "./mongodb";
import { resend } from "./resend";
import { admin } from "better-auth/plugins";
// import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb, {
    // Ajouter des options pour gérer les erreurs de connexion
    onError: async (error) => {
      console.error("❌ Database adapter error:", error);
      try {
        await ensureConnection();
      } catch (reconnectError) {
        console.error("❌ Failed to reconnect to database:", reconnectError);
      }
    }
  }),
  plugins: [
    admin({
      adminUserIds: ["685ff0250e083b9a2987a0b9"],
    }),
  ],
  // plugins: [bearer()],
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        text: `Clique sur le lien suivant pour réinitialiser votre mot de passe: ${url}`,
        from: "noreply@newbi.sweily.fr",
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        to: user.email,
        subject: "Veuillez vérifier votre adresse e-mail",
        text: `Clique sur le lien suivant pour vérifier votre adresse e-mail: ${url}`,
        from: "noreply@newbi.sweily.fr",
      });
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600,
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
      createdBy: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      // data: {
      //   type: "object",
      //   required: false,
      //   defaultValue: {
      //     createdBy: "",
      //   },
      // },
      avatar: {
        type: "string",
        required: false,
        defaultValue: "",
      },
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
