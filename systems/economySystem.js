const fs = require("fs");
const path = require("path");

// Chemin vers le fichier de données
const dataPath = path.join(__dirname, "../data/economy.json");

// Initialiser le fichier de données
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

// Obtenir ou créer un compte
function getAccount(guildId, userId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        data[key] = {
            userId,
            guildId,
            balance: 0,
            bank: 0,
            dailyStreak: 0,
            lastDaily: 0,
            totalEarned: 0,
            totalSpent: 0
        };
        saveData(data);
    }
    
    return data[key];
}

// Ajouter de l'argent
function addMoney(guildId, userId, amount, source = "unknown") {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        data[key] = {
            userId,
            guildId,
            balance: 0,
            bank: 0,
            dailyStreak: 0,
            lastDaily: 0,
            totalEarned: 0,
            totalSpent: 0
        };
    }
    
    data[key].balance += amount;
    data[key].totalEarned += amount;
    saveData(data);
    return data[key].balance;
}

// Retirer de l'argent
function removeMoney(guildId, userId, amount) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key] || data[key].balance < amount) {
        return false;
    }
    
    data[key].balance -= amount;
    data[key].totalSpent += amount;
    saveData(data);
    return data[key].balance;
}

// Transférer de l'argent
function transferMoney(guildId, fromUserId, toUserId, amount) {
    const data = loadData();
    const fromKey = `${guildId}-${fromUserId}`;
    const toKey = `${guildId}-${toUserId}`;
    
    if (!data[fromKey] || data[fromKey].balance < amount) {
        return false;
    }
    
    if (!data[toKey]) {
        data[toKey] = {
            userId: toUserId,
            guildId,
            balance: 0,
            bank: 0,
            dailyStreak: 0,
            lastDaily: 0,
            totalEarned: 0,
            totalSpent: 0
        };
    }
    
    data[fromKey].balance -= amount;
    data[fromKey].totalSpent += amount;
    data[toKey].balance += amount;
    data[toKey].totalEarned += amount;
    
    saveData(data);
    return true;
}

// Récompense quotidienne
function claimDaily(guildId, userId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (!data[key]) {
        data[key] = {
            userId,
            guildId,
            balance: 0,
            bank: 0,
            dailyStreak: 0,
            lastDaily: 0,
            totalEarned: 0,
            totalSpent: 0
        };
    }
    
    const account = data[key];
    
    // Vérifier si déjà réclamé aujourd'hui
    if (now - account.lastDaily < oneDay && account.lastDaily > 0) {
        const nextClaim = account.lastDaily + oneDay;
        return {
            success: false,
            nextClaim,
            timeLeft: nextClaim - now
        };
    }
    
    // Réinitialiser le streak si plus de 2 jours
    if (now - account.lastDaily >= oneDay * 2 && account.lastDaily > 0) {
        account.dailyStreak = 0;
    }
    
    // Calculer la récompense (base + bonus de streak)
    const baseReward = 100;
    const streakBonus = Math.min(account.dailyStreak * 10, 500); // Max 500 de bonus
    const reward = baseReward + streakBonus;
    
    account.balance += reward;
    account.totalEarned += reward;
    account.dailyStreak++;
    account.lastDaily = now;
    
    saveData(data);
    
    return {
        success: true,
        reward,
        streak: account.dailyStreak
    };
}

// Déposer dans la banque
function deposit(guildId, userId, amount) {
    const account = getAccount(guildId, userId);
    if (account.balance < amount) {
        return false;
    }
    account.balance -= amount;
    account.bank += amount;
    saveData(loadData());
    return { balance: account.balance, bank: account.bank };
}

// Retirer de la banque
function withdraw(guildId, userId, amount) {
    const account = getAccount(guildId, userId);
    if (account.bank < amount) {
        return false;
    }
    account.bank -= amount;
    account.balance += amount;
    saveData(loadData());
    return { balance: account.balance, bank: account.bank };
}

// Obtenir le classement
function getLeaderboard(guildId, limit = 10) {
    const data = loadData();
    const guildData = Object.entries(data)
        .filter(([key]) => key.startsWith(`${guildId}-`))
        .map(([key, value]) => ({
            userId: value.userId,
            total: value.balance + value.bank,
            ...value
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
    
    return guildData;
}

// Obtenir les stats
function getStats(guildId, userId) {
    return getAccount(guildId, userId);
}

module.exports = {
    getAccount,
    addMoney,
    removeMoney,
    transferMoney,
    claimDaily,
    deposit,
    withdraw,
    getLeaderboard,
    getStats
};

