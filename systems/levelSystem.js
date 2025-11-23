const fs = require("fs");
const path = require("path");

// Chemin vers le fichier de données
const dataPath = path.join(__dirname, "../data/levels.json");

// Initialiser le fichier de données s'il n'existe pas
function initDataFile() {
    const dataDir = path.join(__dirname, "../data");
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({}), "utf-8");
    }
}

// Charger les données
function loadData() {
    initDataFile();
    try {
        return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch {
        return {};
    }
}

// Sauvegarder les données
function saveData(data) {
    initDataFile();
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}

// Calculer l'XP nécessaire pour un niveau
function getXPForLevel(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}

// Calculer le niveau total à partir de l'XP
function getLevelFromXP(totalXP) {
    let level = 0;
    let xp = 0;
    while (xp <= totalXP) {
        level++;
        xp += getXPForLevel(level);
    }
    return level - 1;
}

// Ajouter de l'XP à un utilisateur
function addXP(guildId, userId, amount = 1) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        data[key] = {
            userId: userId,
            guildId: guildId,
            xp: 0,
            totalXP: 0,
            level: 1,
            messages: 0,
            lastMessage: Date.now()
        };
    }
    
    // Cooldown de 60 secondes entre les gains d'XP
    const cooldown = 60000;
    if (Date.now() - data[key].lastMessage < cooldown) {
        return { leveledUp: false, level: data[key].level };
    }
    
    data[key].xp += amount;
    data[key].totalXP += amount;
    data[key].messages++;
    data[key].lastMessage = Date.now();
    
    const oldLevel = data[key].level;
    const newLevel = getLevelFromXP(data[key].totalXP);
    data[key].level = newLevel;
    
    const leveledUp = newLevel > oldLevel;
    
    saveData(data);
    
    return {
        leveledUp,
        level: newLevel,
        oldLevel,
        xp: data[key].xp,
        totalXP: data[key].totalXP,
        xpNeeded: getXPForLevel(newLevel + 1)
    };
}

// Obtenir les stats d'un utilisateur
function getUserStats(guildId, userId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        return {
            userId,
            guildId,
            xp: 0,
            totalXP: 0,
            level: 1,
            messages: 0
        };
    }
    
    return {
        ...data[key],
        xpNeeded: getXPForLevel(data[key].level + 1)
    };
}

// Obtenir le classement
function getLeaderboard(guildId, limit = 10) {
    const data = loadData();
    const guildData = Object.entries(data)
        .filter(([key]) => key.startsWith(`${guildId}-`))
        .map(([key, value]) => ({
            userId: value.userId,
            ...value
        }))
        .sort((a, b) => b.totalXP - a.totalXP)
        .slice(0, limit);
    
    return guildData;
}

// Réinitialiser les stats d'un utilisateur
function resetUser(guildId, userId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    delete data[key];
    saveData(data);
}

// Réinitialiser tout le serveur
function resetGuild(guildId) {
    const data = loadData();
    Object.keys(data).forEach(key => {
        if (key.startsWith(`${guildId}-`)) {
            delete data[key];
        }
    });
    saveData(data);
}

module.exports = {
    addXP,
    getUserStats,
    getLeaderboard,
    getXPForLevel,
    getLevelFromXP,
    resetUser,
    resetGuild
};

