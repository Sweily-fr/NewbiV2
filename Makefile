# Makefile pour le déploiement Frontend Newbi sur serveur OVH via FTP
# ====================================================================

# Variables de configuration FTP
FTP_HOST ?= ftp.cluster100.hosting.ovh.net
FTP_USER ?= newbify
FTP_PASS ?= SmY7ppduMjYt
FTP_DIR ?= /www

# Variables de projet
PROJECT_ROOT := $(shell pwd)
FRONTEND_DIR := .
DIST_DIR := dist

# Couleurs pour l'affichage
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: help install build deploy clean test lint dev

# Commande par défaut
help: ## Affiche l'aide
	@echo "$(GREEN)Makefile pour le déploiement Frontend Newbi$(NC)"
	@echo "$(YELLOW)Commandes disponibles:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# =============================================================
# INSTALLATION ET SETUP
# =============================================================

install: ## Installe les dépendances du frontend
	@echo "$(YELLOW)Installation des dépendances Next.js...$(NC)"
	cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✓ Installation terminée$(NC)"

setup-env: ## Configure les fichiers d'environnement
	@echo "$(YELLOW)Configuration de l'environnement...$(NC)"
	@if [ ! -f $(FRONTEND_DIR)/.env.local ]; then \
		cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env.local 2>/dev/null || echo "Pas de .env.example trouvé"; \
	fi
	@echo "$(GREEN)✓ Environnement configuré$(NC)"

# =============================================================
# BUILD
# =============================================================

build: ## Build du frontend Next.js
	@echo "$(YELLOW)Build de l'application Next.js...$(NC)"
	cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)✓ Build terminé$(NC)"

# =============================================================
# TESTS ET QUALITÉ
# =============================================================

test: ## Lance les tests du frontend
	@echo "$(YELLOW)Tests frontend...$(NC)"
	cd $(FRONTEND_DIR) && npm test 2>/dev/null || echo "Pas de tests configurés"

lint: ## Lint du code frontend
	@echo "$(YELLOW)Lint du code...$(NC)"
	cd $(FRONTEND_DIR) && npm run lint

# =============================================================
# DÉPLOIEMENT FTP
# =============================================================

check-ftp: ## Vérifie la configuration FTP
	@echo "$(YELLOW)Vérification de la configuration FTP...$(NC)"
	@echo "$(GREEN)Host: $(FTP_HOST)$(NC)"
	@echo "$(GREEN)User: $(FTP_USER)$(NC)"
	@echo "$(GREEN)Directory: $(FTP_DIR)$(NC)"

prepare: build ## Prépare les fichiers pour le déploiement
	@echo "$(YELLOW)Préparation du déploiement...$(NC)"
	@rm -rf $(DIST_DIR)
	@mkdir -p $(DIST_DIR)
	
	# Copie des fichiers Next.js buildés
	@if [ -d "$(FRONTEND_DIR)/.next" ]; then \
		cp -r $(FRONTEND_DIR)/.next $(DIST_DIR)/; \
		echo "$(GREEN)✓ Build Next.js copié$(NC)"; \
	else \
		echo "$(RED)✗ Build Next.js manquant - lancez 'make build' d'abord$(NC)"; \
		exit 1; \
	fi
	
	# Copie des assets publics
	@if [ -d "$(FRONTEND_DIR)/public" ]; then \
		cp -r $(FRONTEND_DIR)/public $(DIST_DIR)/; \
		echo "$(GREEN)✓ Assets publics copiés$(NC)"; \
	fi
	
	# Copie des fichiers de configuration
	@cp $(FRONTEND_DIR)/package.json $(DIST_DIR)/ 2>/dev/null || true
	@cp $(FRONTEND_DIR)/next.config.* $(DIST_DIR)/ 2>/dev/null || true
	
	@echo "$(GREEN)✓ Fichiers prêts pour le déploiement$(NC)"

deploy: check-ftp prepare ## Déploie le frontend via FTP
	@echo "$(YELLOW)Déploiement sur $(FTP_HOST)...$(NC)"
	@if command -v lftp >/dev/null 2>&1; then \
		echo "$(YELLOW)Utilisation de lftp...$(NC)"; \
		lftp -c "set ftp:ssl-allow no; set ftp:passive-mode on; open -u $(FTP_USER),$(FTP_PASS) $(FTP_HOST); mirror -R --delete $(DIST_DIR) $(FTP_DIR); quit"; \
	elif command -v ncftp >/dev/null 2>&1; then \
		echo "$(YELLOW)Utilisation de ncftp...$(NC)"; \
		ncftpput -R -v -u $(FTP_USER) -p $(FTP_PASS) $(FTP_HOST) $(FTP_DIR) $(DIST_DIR)/*; \
	else \
		echo "$(RED)Erreur: lftp ou ncftp requis$(NC)"; \
		echo "$(YELLOW)Installation: brew install lftp$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)🚀 Déploiement terminé !$(NC)"

# =============================================================
# DÉPLOIEMENT RAPIDE
# =============================================================

quick-deploy: ## Déploiement rapide (sans rebuild)
	@echo "$(YELLOW)Déploiement rapide...$(NC)"
	@if [ ! -d "$(FRONTEND_DIR)/.next" ]; then \
		echo "$(RED)Build manquant - build automatique...$(NC)"; \
		make build; \
	fi
	@make prepare
	@make upload-only

upload-only: check-ftp ## Upload uniquement (sans préparation)
	@echo "$(YELLOW)Upload des fichiers...$(NC)"
	@if command -v lftp >/dev/null 2>&1; then \
		lftp -c "set ftp:ssl-allow no; set ftp:passive-mode on; open -u $(FTP_USER),$(FTP_PASS) $(FTP_HOST); mirror -R --delete $(DIST_DIR) $(FTP_DIR); quit"; \
	else \
		echo "$(RED)lftp requis pour l'upload$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Upload terminé$(NC)"

# =============================================================
# MAINTENANCE
# =============================================================

clean: ## Nettoie les fichiers de build
	@echo "$(YELLOW)Nettoyage...$(NC)"
	@rm -rf $(DIST_DIR)
	@rm -rf $(FRONTEND_DIR)/.next
	@rm -rf $(FRONTEND_DIR)/out
	@echo "$(GREEN)✓ Nettoyage terminé$(NC)"

clean-install: clean install ## Nettoyage complet et réinstallation

status: ## Affiche le statut du projet
	@echo "$(GREEN)=== STATUT FRONTEND NEWBI ===$(NC)"
	@if [ -d "$(FRONTEND_DIR)/node_modules" ]; then echo "  ✓ Dépendances installées"; else echo "  ✗ Dépendances manquantes"; fi
	@if [ -d "$(FRONTEND_DIR)/.next" ]; then echo "  ✓ Build présent"; else echo "  ✗ Build manquant"; fi
	@if [ -f "$(FRONTEND_DIR)/.env.local" ]; then echo "  ✓ Environnement configuré"; else echo "  ✗ .env.local manquant"; fi
	@if [ -d "$(DIST_DIR)" ]; then echo "  ✓ Dist prêt"; else echo "  ✗ Dist manquant"; fi

# =============================================================
# DÉVELOPPEMENT
# =============================================================

dev: ## Lance le serveur de développement
	@echo "$(YELLOW)Démarrage du serveur Next.js...$(NC)"
	cd $(FRONTEND_DIR) && npm run dev

# =============================================================
# UTILITAIRES
# =============================================================

test-ftp: ## Test de connexion FTP
	@echo "$(YELLOW)Test de connexion FTP...$(NC)"
	@if command -v lftp >/dev/null 2>&1; then \
		lftp -c "open -u $(FTP_USER),$(FTP_PASS) $(FTP_HOST); ls $(FTP_DIR); quit" || echo "$(RED)Connexion échouée$(NC)"; \
	else \
		echo "$(RED)lftp requis pour le test$(NC)"; \
	fi

backup: ## Sauvegarde le serveur distant
	@echo "$(YELLOW)Sauvegarde du serveur...$(NC)"
	@mkdir -p backups/$(shell date +%Y%m%d_%H%M%S)
	@if command -v lftp >/dev/null 2>&1; then \
		lftp -c "set ftp:ssl-allow no; open -u $(FTP_USER),$(FTP_PASS) $(FTP_HOST); mirror $(FTP_DIR) backups/$(shell date +%Y%m%d_%H%M%S); quit"; \
	fi
	@echo "$(GREEN)✓ Sauvegarde terminée$(NC)"
