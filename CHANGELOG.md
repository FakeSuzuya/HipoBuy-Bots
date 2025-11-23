# 📝 Changelog

## Version 3.1.0 - Mise à jour complète

### ✨ Nouvelles Fonctionnalités

#### 🎁 Système de Giveaways
- Création de giveaways avec durée et prix
- Participation automatique via boutons
- Timer automatique (vérification toutes les 30s)
- Tirage au sort et reroll
- Liste des giveaways actifs

#### 💡 Système de Suggestions
- Création de suggestions avec votes
- Modération (approuver/refuser)
- Statistiques des suggestions
- Top suggestions

#### 🎁 Récompenses de Niveau
- Configuration de récompenses par niveau
- Types : Rôle, Argent, Item
- Attribution automatique lors de la montée de niveau

#### 👤 Profil Utilisateur
- Carte de profil personnalisée (image générée)
- Bio personnalisable (200 caractères max)
- Badges et achievements
- Couleur de profil personnalisable

#### 🎮 Jeux Mini
- Pile ou face (2x la mise)
- Lancer de dés (6x la mise)
- Pierre, papier, ciseaux (2x la mise)
- Machine à sous (multiplicateurs variables)

#### 💾 Système de Backups
- Création de backups automatiques
- Restauration de backups
- Liste et suppression de backups

#### 📊 Statistiques Avancées
- Top utilisateurs par catégorie
- Tendances (croissance/décroissance)
- Rapports détaillés
- Heures de pointe

#### 💸 Transfert d'Argent
- Transfert entre utilisateurs
- Vérifications de solde
- Logs automatiques

### 🔧 Améliorations Techniques

#### Canvas → @napi-rs/canvas
- Remplacement de `canvas` par `@napi-rs/canvas`
- Plus performant et plus facile à installer
- Précompilé (pas de dépendances système)
- Scripts d'installation mis à jour

#### Packages
- Mise à jour de `discord.js` vers ^14.25.1
- Mise à jour de `dotenv` vers ^17.2.3
- Ajout de `@napi-rs/canvas` ^0.1.65
- Scripts npm améliorés (`npm start`)

### 📁 Nouveaux Fichiers

**Systèmes :**
- `systems/giveawaySystem.js`
- `systems/suggestionSystem.js`
- `systems/levelRewardSystem.js`
- `systems/profileSystem.js`
- `systems/gameSystem.js`
- `systems/backupSystem.js`
- `systems/advancedStatsSystem.js`

**Commandes :**
- `commands/giveaways/giveaway.js`
- `commands/suggestions/suggest.js`
- `commands/levels/level-reward.js`
- `commands/profile/profile.js`
- `commands/fun/coinflip.js`
- `commands/fun/dice.js`
- `commands/fun/rps.js`
- `commands/fun/slots.js`
- `commands/economy/pay.js`
- `commands/utils/backup.js`
- `commands/analytics/stats-advanced.js`

**Événements :**
- `events/giveawayTimer.js`

### 🐛 Corrections

- Intégration du timer des giveaways dans `index.js`
- Correction des imports Canvas
- Amélioration de la gestion des erreurs

### 📚 Documentation

- `FONCTIONNALITES_IMPLÉMENTÉES.md` - Liste complète des fonctionnalités
- `ROADMAP.md` - Roadmap des améliorations
- `CHANGELOG.md` - Ce fichier
- Mise à jour de `INSTALLATION.md`
- Mise à jour des scripts d'installation

---

## Version 3.0.0 - Version Initiale

### Fonctionnalités de Base

- Système de sécurité (Anti-Nuke, Anti-Token, Anti-File)
- Système de tickets
- Rôles réactifs
- Système de logs complet
- Système de niveaux
- Système d'économie
- Système de modération
- Système d'analytics
- Génération d'images (cartes de niveau, économie, stats)

