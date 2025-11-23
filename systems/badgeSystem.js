const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/badges.json");

function initDataFile() {
    const dataDir = path.join(__dirname, "../data");
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({}), "utf-8");
    }
}

function loadData() {
    initDataFile();
    try {
        return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    initDataFile();
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}

// Obtenir les badges d'un utilisateur
function getUserBadges(guildId, userId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    return data[key]?.badges || [];
}

// Ajouter un badge à un utilisateur
function addBadge(guildId, userId, badgeId, badgeName, badgeEmoji, rarity = "common") {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        data[key] = {
            userId,
            guildId,
            badges: []
        };
    }

    // Vérifier si le badge existe déjà
    if (data[key].badges.find(b => b.id === badgeId)) {
        return false;
    }

    data[key].badges.push({
        id: badgeId,
        name: badgeName,
        emoji: badgeEmoji,
        rarity: rarity, // common, rare, epic, legendary
        earnedAt: Date.now()
    });

    saveData(data);
    return true;
}

// Retirer un badge
function removeBadge(guildId, userId, badgeId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) return false;

    const index = data[key].badges.findIndex(b => b.id === badgeId);
    if (index === -1) return false;

    data[key].badges.splice(index, 1);
    saveData(data);
    return true;
}

// Obtenir tous les badges d'un serveur
function getAllBadges(guildId) {
    const data = loadData();
    const guildData = Object.entries(data)
        .filter(([key]) => key.startsWith(`${guildId}-`))
        .map(([key, value]) => value.badges || [])
        .flat();
    
    // Compter les occurrences de chaque badge
    const badgeCounts = {};
    guildData.forEach(badge => {
        if (!badgeCounts[badge.id]) {
            badgeCounts[badge.id] = {
                ...badge,
                count: 0
            };
        }
        badgeCounts[badge.id].count++;
    });

    return Object.values(badgeCounts);
}

// Badges automatiques basés sur des accomplissements
const AUTO_BADGES = {
    "first_message": { name: "Premier Message", emoji: "💬", rarity: "common" },
    "level_10": { name: "Niveau 10", emoji: "🎯", rarity: "common" },
    "level_25": { name: "Niveau 25", emoji: "⭐", rarity: "rare" },
    "level_50": { name: "Niveau 50", emoji: "🌟", rarity: "epic" },
    "level_100": { name: "Niveau 100", emoji: "💎", rarity: "legendary" },
    "rich": { name: "Millionnaire", emoji: "💰", rarity: "epic" },
    "daily_streak_7": { name: "Streak 7 jours", emoji: "🔥", rarity: "rare" },
    "daily_streak_30": { name: "Streak 30 jours", emoji: "💯", rarity: "epic" }
};

// Vérifier et attribuer des badges automatiques
function checkAutoBadges(guildId, userId, type, value) {
    const badges = getUserBadges(guildId, userId);
    const newBadges = [];

    switch (type) {
        case "level":
            if (value >= 100 && !badges.find(b => b.id === "level_100")) {
                addBadge(guildId, userId, "level_100", AUTO_BADGES.level_100.name, AUTO_BADGES.level_100.emoji, AUTO_BADGES.level_100.rarity);
                newBadges.push(AUTO_BADGES.level_100);
            } else if (value >= 50 && !badges.find(b => b.id === "level_50")) {
                addBadge(guildId, userId, "level_50", AUTO_BADGES.level_50.name, AUTO_BADGES.level_50.emoji, AUTO_BADGES.level_50.rarity);
                newBadges.push(AUTO_BADGES.level_50);
            } else if (value >= 25 && !badges.find(b => b.id === "level_25")) {
                addBadge(guildId, userId, "level_25", AUTO_BADGES.level_25.name, AUTO_BADGES.level_25.emoji, AUTO_BADGES.level_25.rarity);
                newBadges.push(AUTO_BADGES.level_25);
            } else if (value >= 10 && !badges.find(b => b.id === "level_10")) {
                addBadge(guildId, userId, "level_10", AUTO_BADGES.level_10.name, AUTO_BADGES.level_10.emoji, AUTO_BADGES.level_10.rarity);
                newBadges.push(AUTO_BADGES.level_10);
            }
            break;
        case "money":
            if (value >= 1000000 && !badges.find(b => b.id === "rich")) {
                addBadge(guildId, userId, "rich", AUTO_BADGES.rich.name, AUTO_BADGES.rich.emoji, AUTO_BADGES.rich.rarity);
                newBadges.push(AUTO_BADGES.rich);
            }
            break;
        case "daily_streak":
            if (value >= 30 && !badges.find(b => b.id === "daily_streak_30")) {
                addBadge(guildId, userId, "daily_streak_30", AUTO_BADGES.daily_streak_30.name, AUTO_BADGES.daily_streak_30.emoji, AUTO_BADGES.daily_streak_30.rarity);
                newBadges.push(AUTO_BADGES.daily_streak_30);
            } else if (value >= 7 && !badges.find(b => b.id === "daily_streak_7")) {
                addBadge(guildId, userId, "daily_streak_7", AUTO_BADGES.daily_streak_7.name, AUTO_BADGES.daily_streak_7.emoji, AUTO_BADGES.daily_streak_7.rarity);
                newBadges.push(AUTO_BADGES.daily_streak_7);
            }
            break;
        case "first_message":
            if (!badges.find(b => b.id === "first_message")) {
                addBadge(guildId, userId, "first_message", AUTO_BADGES.first_message.name, AUTO_BADGES.first_message.emoji, AUTO_BADGES.first_message.rarity);
                newBadges.push(AUTO_BADGES.first_message);
            }
            break;
    }

    return newBadges;
}

module.exports = {
    getUserBadges,
    addBadge,
    removeBadge,
    getAllBadges,
    checkAutoBadges,
    AUTO_BADGES
};

