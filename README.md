# Bot Discord - HipoBuy V0.3

<img width="540" height="461" alt="image" src="https://github.com/user-attachments/assets/fff54149-9d74-414d-baf8-d5ce411b132c" />

Bot Discord complet avec système de sécurité, tickets, rôles réactifs, logs, niveaux, économie, coupons, mots de passe, giveaways, suggestions et bien plus encore !

## 🚀 Fonctionnalités Principales

### 🛡️ Sécurité
- **Anti-Nuke** (détection et bannissement automatique)
- **Anti-Token Grab** (détection de messages suspects)
- **Anti-Fichier** (blocage de fichiers malveillants)

### 🎫 Tickets
- Création de tickets par catégories
- Fermeture avec transcript automatique
- Logs des tickets

### 🎭 Rôles Réactifs
- Menu de sélection de rôles
- Gestion automatique des rôles

### 📊 Logs Complets
- Logs des messages (suppression, modification)
- Logs des membres (arrivée, départ)
- Logs des rôles (ajout, retrait)
- Logs des salons (création, suppression, modification)
- Logs des bannissements

### 🎁 Giveaways
- Création de giveaways avec durée et prix
- Participation automatique via boutons
- Timer automatique
- Tirage au sort et reroll

### 💡 Suggestions
- Création de suggestions avec votes
- Modération (approuver/refuser)
- Statistiques des suggestions

### 📈 Niveaux & XP
- Système de niveaux avec XP
- Leaderboard
- Récompenses automatiques par niveau
- Cartes visuelles générées

### 💰 Économie
- Système de monnaie virtuelle
- Daily rewards avec streaks
- Transfert d'argent entre utilisateurs
- Système de coupons avec codes de réduction
- Cartes visuelles générées

### 🎮 Jeux Mini
- Pile ou face
- Lancer de dés
- Pierre, papier, ciseaux
- Machine à sous

### 👤 Profils
- Carte de profil personnalisée
- Bio personnalisable
- Badges et achievements
- Couleur de profil

### 💾 Backups
- Création de backups automatiques
- Restauration de backups
- Gestion des backups

### 📊 Statistiques Avancées
- Top utilisateurs par catégorie
- Tendances (croissance/décroissance)
- Rapports détaillés

## 📋 Prérequis

- Node.js v16.9.0 ou supérieur
- Un bot Discord avec les permissions nécessaires
- Les intents suivants activés dans le Developer Portal :
  - Server Members Intent
  - Message Content Intent

## ⚙️ Installation

### Méthode Rapide

**Windows :**
```cmd
install.bat
```

**Linux/macOS :**
```bash
chmod +x install.sh
./install.sh
```

### Méthode Manuelle

1. Clonez le repository ou téléchargez les fichiers
2. Installez les dépendances :
```bash
npm install
```

3. Configurez `config.json` avec vos informations :
```json
{
    "token": "VOTRE_TOKEN_BOT",
    "guildId": "ID_DU_SERVEUR",
    "clientId": "ID_DU_BOT",
    "ticketCategoryId": "ID_CATEGORIE_TICKETS",
    "logsMessage": "ID_SALON_LOGS_MESSAGES",
    "logsMember": "ID_SALON_LOGS_MEMBRES",
    "logsRole": "ID_SALON_LOGS_ROLES",
    "logsChannel": "ID_SALON_LOGS_SALONS",
    "logsGuild": "ID_SALON_LOGS_SERVEUR",
    "logsBan": "ID_SALON_LOGS_BANS",
    "logsTicket": "ID_SALON_LOGS_TICKETS",
    "reviewChannelId": "ID_SALON_AVIS",
    "ownerId": "VOTRE_ID_DISCORD"
}
```

4. Configurez les rôles dans `systems/reactionRolesSystem.js` :
```javascript
const roles = {
    notif: "ID_ROLE_NOTIF",
    vip: "ID_ROLE_VIP",
    client: "ID_ROLE_CLIENT"
};
```

5. Lancez le bot :
```bash
npm start
# ou
node index.js
```

## 📦 Dépendances

- **discord.js** ^14.25.1 - Bibliothèque Discord
- **dotenv** ^17.2.3 - Variables d'environnement
- **@napi-rs/canvas** ^0.1.65 - Génération d'images (précompilé, facile à installer)

**Note :** @napi-rs/canvas est précompilé et ne nécessite pas de dépendances système supplémentaires !

## 📝 Commandes Principales

### Configuration
- `/help` - Affiche toutes les commandes disponibles
- `/config` - Configuration générale du bot
- `/config` - Configuration centralisée du bot (tickets, rôles, logs, sécurité, etc.)
- `/security` - Configure le système de sécurité

### Tickets & Rôles
- `/roles` - Envoie le menu de sélection de rôles
- `/ticket-panel` - Envoie le panneau de création de tickets
- `/close` - Ferme le ticket actuel

### Giveaways
- `/giveaway` - Interface interactive pour gérer les giveaways (créer, terminer, relancer, lister)

### Suggestions
- `/suggest` - Interface interactive pour gérer les suggestions (créer, approuver, refuser, statistiques)

### Niveaux
- `/level` - Affiche votre niveau
- `/leaderboard` - Leaderboard des niveaux
- `/level-reward` - Gère les récompenses de niveau

### Économie
- `/balance` - Affiche votre solde
- `/daily` - Réclame votre récompense quotidienne
- `/pay` - Transfère de l'argent
- `/coupon create` - Crée un coupon de réduction
- `/coupon list` - Liste les coupons disponibles
- `/coupon redeem` - Utilise un coupon
- `/coupon delete` - Supprime un coupon

### Jeux
- `/coinflip` - Pile ou face
- `/dice` - Lancer de dés
- `/rps` - Pierre, papier, ciseaux
- `/slots` - Machine à sous

### Profil
- `/profile view` - Affiche un profil
- `/profile set` - Configure votre profil
- `/profile badges` - Affiche vos badges

### Backups
- `/backup create` - Crée un backup
- `/backup restore` - Restaure un backup
- `/backup list` - Liste les backups

### Utilitaires
- `/password add` - Ajoute un mot de passe Yupoo à la liste
- `/password list` - Affiche la liste des mots de passe
- `/password remove` - Supprime un mot de passe
- `/password clear` - Supprime tous les mots de passe

### Statistiques
- `/stats` - Statistiques du serveur
- `/stats-advanced` - Statistiques avancées

**Voir `/help` pour la liste complète !**

## 🛡️ Configuration de sécurité

Utilisez `/config` → **Sécurité** pour configurer :
- **Niveau de protection** : Low, Medium, High, Extreme
- **Salon de logs** : Où envoyer les alertes de sécurité
- **Activation/Désactivation** : Anti-Nuke, Anti-Token, Anti-Fichier

## 📁 Structure du projet

```
├── commands/          # Commandes slash
│   ├── roles/
│   ├── tickets/
│   └── utils/
├── events/            # Événements Discord
├── handlers/          # Gestionnaires
├── systems/           # Systèmes (tickets, rôles, transcripts)
├── transcripts/       # Transcripts des tickets (créé automatiquement)
├── config.json        # Configuration
├── securityCore.js    # Configuration de sécurité
└── index.js          # Point d'entrée
```

## ⚠️ Notes importantes

- Assurez-vous que le bot a les permissions nécessaires dans votre serveur
- Les IDs doivent être des strings (entre guillemets)
- Le dossier `transcripts/` sera créé automatiquement
- Les logs utilisent `logsMessage` comme fallback si les autres salons ne sont pas configurés

## 🔧 Dépannage

**Le bot ne se connecte pas :**
- Vérifiez que le token dans `config.json` est correct
- Vérifiez que les intents sont activés dans le Developer Portal

**Les commandes ne s'enregistrent pas :**
- Vérifiez que `guildId` et `clientId` sont corrects
- Attendez quelques minutes pour la propagation des commandes

**Erreurs de permissions :**
- Vérifiez que le bot a les permissions nécessaires
- Vérifiez que le bot est au-dessus des rôles qu'il doit gérer

## 📄 Licence

apache
