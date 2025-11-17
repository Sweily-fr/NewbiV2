#!/bin/bash

# Script de vérification SEO pour NewbiV2
# Usage: ./scripts/check-seo.sh

echo "🔍 Vérification SEO - NewbiV2"
echo "=============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASS=0
FAIL=0
WARN=0

# Fonction de test
check() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
    ((PASS++))
  else
    echo -e "${RED}❌ $2${NC}"
    ((FAIL++))
  fi
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARN++))
}

echo "📁 Vérification des fichiers..."
echo ""

# Vérifier sitemap.js
if [ -f "app/sitemap.js" ]; then
  check 0 "Sitemap existe (app/sitemap.js)"
  
  # Vérifier les URLs correctes
  if grep -q "/produits/signatures" app/sitemap.js && grep -q "/produits/transfers" app/sitemap.js; then
    check 0 "URLs produits correctes dans sitemap"
  else
    check 1 "URLs produits incorrectes dans sitemap"
  fi
else
  check 1 "Sitemap manquant"
fi

# Vérifier robots.txt
if [ -f "public/robots.txt" ]; then
  check 0 "Robots.txt existe"
  
  # Vérifier les exclusions
  if grep -q "Disallow: /dashboard/" public/robots.txt && grep -q "Disallow: /auth/" public/robots.txt; then
    check 0 "Exclusions dashboard/auth dans robots.txt"
  else
    check 1 "Exclusions manquantes dans robots.txt"
  fi
else
  check 1 "Robots.txt manquant"
fi

# Vérifier images OG
echo ""
echo "🖼️  Vérification des images..."
echo ""

if [ -f "app/opengraph-image.png" ]; then
  check 0 "Image Open Graph existe"
else
  check 1 "Image Open Graph manquante"
fi

if [ -f "app/twitter-image.png" ]; then
  check 0 "Image Twitter existe"
else
  check 1 "Image Twitter manquante"
fi

if [ -f "app/icon.svg" ]; then
  check 0 "Icône SVG existe"
else
  check 1 "Icône SVG manquante"
fi

# Vérifier noindex sur pages privées
echo ""
echo "🔒 Vérification noindex..."
echo ""

if grep -q "noindex" app/dashboard/page.jsx; then
  check 0 "Dashboard a noindex"
else
  check 1 "Dashboard n'a pas noindex"
fi

if grep -q "noindex" app/auth/login/page.jsx; then
  check 0 "Login a noindex"
else
  check 1 "Login n'a pas noindex"
fi

if grep -q "noindex" app/auth/signup/page.jsx; then
  check 0 "Signup a noindex"
else
  check 1 "Signup n'a pas noindex"
fi

# Vérifier SEO des pages produits
echo ""
echo "📄 Vérification SEO pages produits..."
echo ""

if grep -q "useProductSEO" app/produits/devis/page.jsx; then
  check 0 "Page Devis a SEO"
else
  warn "Page Devis n'a pas de SEO"
fi

if grep -q "useProductSEO" app/produits/factures/page.jsx; then
  check 0 "Page Factures a SEO"
else
  warn "Page Factures n'a pas de SEO"
fi

# Vérifier les autres pages auth
echo ""
echo "🔐 Vérification autres pages auth..."
echo ""

AUTH_PAGES=("forget-password" "reset-password" "verify" "verify-2fa" "verify-email" "manage-devices")
for page in "${AUTH_PAGES[@]}"; do
  if [ -f "app/auth/$page/page.jsx" ]; then
    if grep -q "noindex" "app/auth/$page/page.jsx"; then
      check 0 "Auth/$page a noindex"
    else
      warn "Auth/$page n'a pas noindex"
    fi
  fi
done

# Résumé
echo ""
echo "=============================="
echo "📊 Résumé"
echo "=============================="
echo -e "${GREEN}✅ Tests réussis: $PASS${NC}"
echo -e "${RED}❌ Tests échoués: $FAIL${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARN${NC}"
echo ""

# Score
TOTAL=$((PASS + FAIL))
if [ $TOTAL -gt 0 ]; then
  SCORE=$((PASS * 100 / TOTAL))
  echo "Score SEO: $SCORE%"
  
  if [ $SCORE -ge 90 ]; then
    echo -e "${GREEN}🎉 Excellent ! Prêt pour le déploiement${NC}"
  elif [ $SCORE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Bon mais des améliorations sont nécessaires${NC}"
  else
    echo -e "${RED}❌ Des corrections critiques sont requises${NC}"
  fi
fi

echo ""
echo "📚 Consulter SEO_FINAL_CHECKLIST.md pour les actions restantes"
echo ""
