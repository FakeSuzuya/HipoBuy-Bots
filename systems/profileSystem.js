const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/profiles.json");

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

// Obtenir ou créer un profil
function getProfile(guildId, userId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        data[key] = {
            userId,
            guildId,
            bio: "",
            badges: [],
            color: null,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        saveData(data);
    }
    
    return data[key];
}

// Mettre à jour la bio
function setBio(guildId, userId, bio) {
    const profile = getProfile(guildId, userId);
    profile.bio = bio.substring(0, 200); // Limite à 200 caractères
    profile.updatedAt = Date.now();
    
    const data = loadData();
    data[`${guildId}-${userId}`] = profile;
    saveData(data);
    
    return profile;
}

// Ajouter un badge
function addBadge(guildId, userId, badge) {
    const profile = getProfile(guildId, userId);
    
    if (!profile.badges.includes(badge)) {
        profile.badges.push(badge);
        profile.updatedAt = Date.now();
        
        const data = loadData();
        data[`${guildId}-${userId}`] = profile;
        saveData(data);
    }
    
    return profile;
}

// Définir la couleur
function setColor(guildId, userId, color) {
    const profile = getProfile(guildId, userId);
    profile.color = color;
    profile.updatedAt = Date.now();
    
    const data = loadData();
    data[`${guildId}-${userId}`] = profile;
    saveData(data);
    
    return profile;
}

// Obtenir les badges disponibles
function getAvailableBadges() {
    return [
        { id: "early", name: "Early Supporter", emoji: "⭐" },
        { id: "vip", name: "VIP", emoji: "💎" },
        { id: "donator", name: "Donateur", emoji: "❤️" },
        { id: "helper", name: "Helper", emoji: "🛠️" },
        { id: "moderator", name: "Modérateur", emoji: "🛡️" },
        { id: "level10", name: "Niveau 10", emoji: "🎯" },
        { id: "level25", name: "Niveau 25", emoji: "🏆" },
        { id: "level50", name: "Niveau 50", emoji: "👑" },
        { id: "rich", name: "Riche", emoji: "💰" },
        { id: "active", name: "Actif", emoji: "🔥" }
    ];
}

module.exports = {
    getProfile,
    setBio,
    addBadge,
    setColor,
    getAvailableBadges
};

