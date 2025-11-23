const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/levelRewards.json");

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

// Ajouter une récompense
function addReward(guildId, level, type, value) {
    const data = loadData();
    const key = `${guildId}`;
    
    if (!data[key]) {
        data[key] = [];
    }
    
    // Vérifier si une récompense existe déjà pour ce niveau
    const existingIndex = data[key].findIndex(r => r.level === level);
    
    const reward = {
        level: parseInt(level),
        type, // "role", "money", "item"
        value,
        createdAt: Date.now()
    };
    
    if (existingIndex !== -1) {
        data[key][existingIndex] = reward;
    } else {
        data[key].push(reward);
    }
    
    // Trier par niveau
    data[key].sort((a, b) => a.level - b.level);
    
    saveData(data);
    return reward;
}

// Supprimer une récompense
function removeReward(guildId, level) {
    const data = loadData();
    const key = `${guildId}`;
    
    if (!data[key]) return false;
    
    const index = data[key].findIndex(r => r.level === parseInt(level));
    if (index === -1) return false;
    
    data[key].splice(index, 1);
    saveData(data);
    return true;
}

// Obtenir les récompenses
function getRewards(guildId) {
    const data = loadData();
    return data[guildId] || [];
}

// Obtenir les récompenses pour un niveau
function getRewardsForLevel(guildId, level) {
    const rewards = getRewards(guildId);
    return rewards.filter(r => r.level === parseInt(level));
}

// Obtenir la prochaine récompense
function getNextReward(guildId, currentLevel) {
    const rewards = getRewards(guildId);
    return rewards.find(r => r.level > currentLevel);
}

module.exports = {
    addReward,
    removeReward,
    getRewards,
    getRewardsForLevel,
    getNextReward
};

