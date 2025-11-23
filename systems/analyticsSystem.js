const fs = require("fs");
const path = require("path");

// Chemin vers le fichier de données
const dataPath = path.join(__dirname, "../data/analytics.json");

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

// Enregistrer un événement
function trackEvent(guildId, eventType, data = {}) {
    const analytics = loadData();
    const key = `${guildId}`;
    
    if (!analytics[key]) {
        analytics[key] = {
            guildId,
            events: [],
            stats: {
                messages: 0,
                commands: 0,
                tickets: 0,
                moderation: 0,
                joins: 0,
                leaves: 0
            },
            dailyStats: {}
        };
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (!analytics[key].dailyStats[today]) {
        analytics[key].dailyStats[today] = {
            messages: 0,
            commands: 0,
            tickets: 0,
            moderation: 0,
            joins: 0,
            leaves: 0
        };
    }
    
    // Enregistrer l'événement
    analytics[key].events.push({
        type: eventType,
        data,
        timestamp: Date.now()
    });
    
    // Mettre à jour les stats
    if (analytics[key].stats.hasOwnProperty(eventType)) {
        analytics[key].stats[eventType]++;
        analytics[key].dailyStats[today][eventType]++;
    }
    
    // Garder seulement les 1000 derniers événements
    if (analytics[key].events.length > 1000) {
        analytics[key].events = analytics[key].events.slice(-1000);
    }
    
    saveData(analytics);
}

// Obtenir les statistiques
function getStats(guildId, days = 7) {
    const analytics = loadData();
    const key = `${guildId}`;
    
    if (!analytics[key]) {
        return {
            total: { messages: 0, commands: 0, tickets: 0, moderation: 0, joins: 0, leaves: 0 },
            daily: []
        };
    }
    
    const stats = analytics[key].stats;
    const dailyStats = analytics[key].dailyStats;
    
    // Obtenir les stats des X derniers jours
    const daily = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        daily.push({
            date: dateStr,
            ...(dailyStats[dateStr] || {
                messages: 0,
                commands: 0,
                tickets: 0,
                moderation: 0,
                joins: 0,
                leaves: 0
            })
        });
    }
    
    return {
        total: stats,
        daily
    };
}

// Obtenir les événements récents
function getRecentEvents(guildId, limit = 50) {
    const analytics = loadData();
    const key = `${guildId}`;
    
    if (!analytics[key]) {
        return [];
    }
    
    return analytics[key].events.slice(-limit).reverse();
}

// Obtenir les top utilisateurs
function getTopUsers(guildId, eventType, limit = 10) {
    const analytics = loadData();
    const key = `${guildId}`;
    
    if (!analytics[key]) {
        return [];
    }
    
    const userCounts = {};
    
    analytics[key].events
        .filter(e => e.type === eventType && e.data.userId)
        .forEach(event => {
            const userId = event.data.userId;
            userCounts[userId] = (userCounts[userId] || 0) + 1;
        });
    
    return Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

// Générer un rapport
function generateReport(guildId, days = 7) {
    const stats = getStats(guildId, days);
    const recentEvents = getRecentEvents(guildId, 20);
    
    // Calculer les moyennes
    const avgMessages = stats.daily.reduce((sum, day) => sum + day.messages, 0) / days;
    const avgCommands = stats.daily.reduce((sum, day) => sum + day.commands, 0) / days;
    
    // Top utilisateurs
    const topMessages = getTopUsers(guildId, "messages", 5);
    const topCommands = getTopUsers(guildId, "commands", 5);
    
    return {
        period: `${days} jours`,
        totals: stats.total,
        averages: {
            messages: Math.round(avgMessages),
            commands: Math.round(avgCommands)
        },
        topUsers: {
            messages: topMessages,
            commands: topCommands
        },
        recentEvents: recentEvents.slice(0, 10)
    };
}

module.exports = {
    trackEvent,
    getStats,
    getRecentEvents,
    getTopUsers,
    generateReport
};

