import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb } from "./mongodb";
import { resend } from "./resend";
import { admin, organization } from "better-auth/plugins";
// import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
  database: mongodbAdapter(mongoDb),
  plugins: [
    admin({
      adminUserIds: ["685ff0250e083b9a2987a0b9"],
      defaultRole: "owner", // Rôle par défaut pour les nouveaux utilisateurs
    }),
    organization({
      async sendInvitationEmail(data) {
        console.log('Envoi d\'email d\'invitation:', data);
        
        // Construire le lien d'invitation avec les informations de base
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation/${data.id}?org=${encodeURIComponent(data.organization.name)}&email=${encodeURIComponent(data.email)}&role=${encodeURIComponent(data.role)}`;
        
        try {
          // Envoyer l'email d'invitation via Resend
          await resend.emails.send({
            to: data.email,
            subject: `Invitation à rejoindre ${data.organization.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Vous êtes invité(e) à rejoindre ${data.organization.name}</h2>
                <p>Bonjour,</p>
                <p><strong>${data.inviter.user.name || data.inviter.user.email}</strong> vous invite à rejoindre l'organisation <strong>${data.organization.name}</strong>.</p>
                <p>Cliquez sur le lien ci-dessous pour accepter l'invitation :</p>
                <a href="${inviteLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Accepter l'invitation</a>
                <p>Si vous ne souhaitez pas rejoindre cette organisation, vous pouvez ignorer cet email.</p>
                <p>Cordialement,<br>L'équipe Newbi</p>
              </div>
            `,
            from: "noreply@newbi.sweily.fr",
          });
          
          console.log('Email d\'invitation envoyé avec succès à:', data.email);
        } catch (error) {
          console.error('Erreur lors de l\'envoi de l\'email d\'invitation:', error);
          throw error;
        }
      },
    }),
  ],
  // plugins: [bearer()],
  
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

  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
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
