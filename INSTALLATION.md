# 📦 Guide d'Installation

## 🚀 Installation Rapide

### Windows

1. **Double-cliquez sur `install.bat`**
   - Le script installera automatiquement toutes les dépendances
   - Vérifiera que Node.js et npm sont installés
   - Installera Canvas et toutes les dépendances npm

2. **Ou manuellement :**
   ```cmd
   npm install
   ```

### Linux / macOS

1. **Rendez le script exécutable (si nécessaire) :**
   ```bash
   chmod +x install.sh
   ```

2. **Exécutez le script :**
   ```bash
   ./install.sh
   ```

3. **Ou manuellement :**
   ```bash
   npm install
   ```
   
   **Note :** @napi-rs/canvas est précompilé et ne nécessite pas de dépendances système supplémentaires !

## 📋 Prérequis

- **Node.js** v16.9.0 ou supérieur
- **npm** (inclus avec Node.js)

### Vérification

```bash
node --version
npm --version
```

## 🔧 Dépendances Installées

### Dépendances npm
- `discord.js` - Bibliothèque Discord
- `dotenv` - Gestion des variables d'environnement
- `@napi-rs/canvas` - Génération d'images (plus performant et facile à installer)

### Dépendances Système

**Aucune !** @napi-rs/canvas est précompilé et fonctionne sur toutes les plateformes sans dépendances système supplémentaires.

## ⚙️ Configuration

Après l'installation :

1. **Configurez `config.json`** avec vos informations :
   - Token du bot
   - IDs du serveur et du bot
   - IDs des salons de logs

2. **Lancez le bot :**
   ```bash
   node index.js
   ```

## 🐛 Dépannage

### Canvas ne s'installe pas

**@napi-rs/canvas** est beaucoup plus facile à installer que canvas classique et ne nécessite généralement pas de dépendances système supplémentaires.

**Si vous rencontrez des problèmes :**
```bash
npm install @napi-rs/canvas
```

**Note :** @napi-rs/canvas est précompilé et devrait fonctionner sans dépendances système sur la plupart des plateformes.

### Erreurs de permissions

**Linux/macOS :**
```bash
sudo npm install
```

### Node.js non trouvé

Installez Node.js depuis https://nodejs.org/
- Version LTS recommandée

## ✅ Vérification

Après l'installation, vérifiez que tout fonctionne :

```bash
node -e "require('discord.js')"
node -e "require('@napi-rs/canvas')"
```

Si aucune erreur n'apparaît, tout est installé correctement !

---

**Les scripts d'installation gèrent automatiquement toutes les dépendances !** 🎉

