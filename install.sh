#!/bin/bash

echo "========================================"
echo "  Installation des dépendances du bot"
echo "========================================"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "[ERREUR] Node.js n'est pas installé!"
    echo "Veuillez installer Node.js depuis https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js détecté"
node --version
echo ""

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "[ERREUR] npm n'est pas installé!"
    exit 1
fi

echo "[OK] npm détecté"
npm --version
echo ""

# @napi-rs/canvas est précompilé et ne nécessite pas de dépendances système
echo "[INFO] @napi-rs/canvas est précompilé - aucune dépendance système requise"

echo ""
echo "[INFO] Installation des dépendances npm..."
echo ""

# Installer les dépendances npm
npm install

if [ $? -ne 0 ]; then
    echo "[ERREUR] Échec de l'installation des dépendances npm"
    exit 1
fi

echo ""
echo "[OK] Dépendances npm installées avec succès!"
echo ""

# Vérifier si Canvas est installé
echo "[INFO] Vérification de Canvas..."
node -e "require('@napi-rs/canvas')" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "[ATTENTION] @napi-rs/canvas n'est pas installé correctement"
    echo ""
    echo "Essayez de réinstaller:"
    echo "  npm install @napi-rs/canvas"
    echo ""
else
    echo "[OK] @napi-rs/canvas est installé correctement"
fi

echo ""
echo "========================================"
echo "  Installation terminée!"
echo "========================================"
echo ""
echo "Prochaines étapes:"
echo "1. Configurez config.json avec vos informations"
echo "2. Lancez le bot avec: node index.js"
echo ""

