// Boundary du segment /outils : rend null pour ne pas intercaler un skeleton
// générique de tableau avant le loading.jsx spécifique de chaque sous-route
// (toutes les routes outils utilisées ont le leur ; seules ocr-test et
// optimiseur-seo-blog, pages de dev, n'en ont pas).
export default function OutilsLoading() {
  return null;
}
