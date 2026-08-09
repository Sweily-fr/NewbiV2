/**
 * Les pages /pdf-generator/* sont des rendus de document : elles sont affichées
 * dans une iframe d'aperçu (web) ou dans la WebView de l'app mobile, jamais
 * comme une page de navigation.
 *
 * On y neutralise donc le Smart App Banner natif iOS déclaré par le layout
 * racine (metadata.other) : `null` écrase la valeur parente et Next n'émet pas
 * la balise. Le pendant custom est géré côté <AppInstallBanner />.
 */
export const metadata = {
  other: {
    "apple-itunes-app": null,
  },
};

export default function PdfGeneratorLayout({ children }) {
  return children;
}
