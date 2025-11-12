/**
 * Configuration centralisée des URLs Cloudflare R2
 * Toutes les images et icônes sont stockées sur Cloudflare R2
 */

export const CLOUDFLARE_URLS = {
  // Base URLs
  logoRs: "https://pub-4ab56834c87d44b9a4fee1c84196b095.r2.dev",
  icons: "https://157ce0fed50fe542bc92a07317a09205.r2.cloudflarestorage.com/icons",
  info: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info",
  social: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social",

  // Social network icons
  socialIcons: {
    linkedin: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/linkedin/linkedin.png",
    facebook: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/facebook/facebook.png",
    instagram: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/instagram/instagram.png",
    x: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/twitter/twitter.png",
    youtube: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/youtube/youtube.png",
    github: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social/github/github.png",
  },

  // Contact info icons
  contactIcons: {
    phone: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png",
    mobile: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png",
    email: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png",
    website: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png",
    address: "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png",
  },
};

export default CLOUDFLARE_URLS;
