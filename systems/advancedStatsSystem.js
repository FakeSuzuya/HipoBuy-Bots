const analyticsSystem = require("./analyticsSystem");
const levelSystem = require("./levelSystem");
const economySystem = require("./economySystem");

// Obtenir le top utilisateurs par catégorie
function getTopUsers(guildId, category, limit = 10) {
    switch (category) {
        case "messages":
            return analyticsSystem.getTopUsers(guildId, "messages", limit);
        case "commands":
            return analyticsSystem.getTopUsers(guildId, "commands", limit);
        case "levels":
            return levelSystem.getLeaderboard(guildId, limit);
        case "economy":
            return economySystem.getLeaderboard(guildId, limit);
        default:
            return [];
    }
}

// Obtenir les tendances
function getTrends(guildId, days = 7) {
    const stats = analyticsSystem.getStats(guildId, days);
    
    const trends = {
        messages: calculateTrend(stats.daily.map(d => d.messages)),
        commands: calculateTrend(stats.daily.map(d => d.commands)),
        tickets: calculateTrend(stats.daily.map(d => d.tickets)),
        moderation: calculateTrend(stats.daily.map(d => d.moderation))
    };
    
    return trends;
}

// Calculer la tendance (croissance/décroissance)
function calculateTrend(values) {
    if (values.length < 2) return { trend: "stable", percentage: 0 };
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (firstAvg === 0) return { trend: "stable", percentage: 0 };
    
    const percentage = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    let trend = "stable";
    if (percentage > 10) trend = "up";
    else if (percentage < -10) trend = "down";
    
    return { trend, percentage: Math.round(percentage) };
}

// Générer un rapport détaillé
function generateDetailedReport(guildId, days = 7) {
    const stats = analyticsSystem.getStats(guildId, days);
    const trends = getTrends(guildId, days);
    const topMessages = getTopUsers(guildId, "messages", 5);
    const topCommands = getTopUsers(guildId, "commands", 5);
    const topLevels = getTopUsers(guildId, "levels", 5);
    const topEconomy = getTopUsers(guildId, "economy", 5);
    
    return {
        period: `${days} jours`,
        totals: stats.total,
        trends,
        topUsers: {
            messages: topMessages,
            commands: topCommands,
            levels: topLevels,
            economy: topEconomy
        },
        averages: {
            messages: stats.daily.reduce((sum, day) => sum + day.messages, 0) / days,
            commands: stats.daily.reduce((sum, day) => sum + day.commands, 0) / days
        }
    };
}

// Obtenir les heures de pointe
function getPeakHours(guildId, days = 7) {
    const events = analyticsSystem.getRecentEvents(guildId, 1000);
    const hourCounts = {};
    
    events.forEach(event => {
        const hour = new Date(event.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const sorted = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count);
    
    return sorted.slice(0, 5);
}

// Obtenir les jours les plus actifs
function getPeakDays(guildId, days = 30) {
    const stats = analyticsSystem.getStats(guildId, days);
    
    return stats.daily
        .map(day => ({
            date: day.date,
            messages: day.messages,
            commands: day.commands,
            total: day.messages + day.commands
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
}

module.exports = {
    getTopUsers,
    getTrends,
    generateDetailedReport,
    getPeakHours,
    getPeakDays
};

