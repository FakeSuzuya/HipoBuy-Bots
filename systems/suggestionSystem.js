const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const dataPath = path.join(__dirname, "../data/suggestions.json");

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

// Créer une suggestion
function createSuggestion(guildId, userId, content, messageId = null) {
    const data = loadData();
    const suggestionId = Date.now().toString();
    
    const suggestion = {
        id: suggestionId,
        guildId,
        userId,
        content,
        messageId,
        upvotes: [],
        downvotes: [],
        status: "pending", // pending, approved, denied
        createdAt: Date.now(),
        reviewedBy: null,
        reviewedAt: null
    };
    
    if (!data[guildId]) {
        data[guildId] = [];
    }
    
    data[guildId].push(suggestion);
    saveData(data);
    
    return suggestion;
}

// Voter sur une suggestion
function voteSuggestion(guildId, suggestionId, userId, voteType) {
    const data = loadData();
    const guildSuggestions = data[guildId] || [];
    const suggestion = guildSuggestions.find(s => s.id === suggestionId);
    
    if (!suggestion) return null;
    
    // Retirer le vote précédent s'il existe
    suggestion.upvotes = suggestion.upvotes.filter(id => id !== userId);
    suggestion.downvotes = suggestion.downvotes.filter(id => id !== userId);
    
    // Ajouter le nouveau vote
    if (voteType === "upvote") {
        suggestion.upvotes.push(userId);
    } else if (voteType === "downvote") {
        suggestion.downvotes.push(userId);
    }
    
    saveData(data);
    return suggestion;
}

// Approuver une suggestion
function approveSuggestion(guildId, suggestionId, moderatorId) {
    const data = loadData();
    const guildSuggestions = data[guildId] || [];
    const suggestion = guildSuggestions.find(s => s.id === suggestionId);
    
    if (!suggestion) return null;
    
    suggestion.status = "approved";
    suggestion.reviewedBy = moderatorId;
    suggestion.reviewedAt = Date.now();
    
    saveData(data);
    return suggestion;
}

// Refuser une suggestion
function denySuggestion(guildId, suggestionId, moderatorId, reason = null) {
    const data = loadData();
    const guildSuggestions = data[guildId] || [];
    const suggestion = guildSuggestions.find(s => s.id === suggestionId);
    
    if (!suggestion) return null;
    
    suggestion.status = "denied";
    suggestion.reviewedBy = moderatorId;
    suggestion.reviewedAt = Date.now();
    suggestion.denyReason = reason;
    
    saveData(data);
    return suggestion;
}

// Obtenir les suggestions
function getSuggestions(guildId, status = null) {
    const data = loadData();
    const guildSuggestions = data[guildId] || [];
    
    if (status) {
        return guildSuggestions.filter(s => s.status === status);
    }
    
    return guildSuggestions;
}

// Obtenir une suggestion
function getSuggestion(guildId, suggestionId) {
    const data = loadData();
    const guildSuggestions = data[guildId] || [];
    return guildSuggestions.find(s => s.id === suggestionId);
}

// Obtenir les statistiques
function getStats(guildId) {
    const suggestions = getSuggestions(guildId);
    
    return {
        total: suggestions.length,
        pending: suggestions.filter(s => s.status === "pending").length,
        approved: suggestions.filter(s => s.status === "approved").length,
        denied: suggestions.filter(s => s.status === "denied").length,
        topSuggestion: suggestions
            .sort((a, b) => (b.upvotes.length - b.downvotes.length) - (a.upvotes.length - a.downvotes.length))[0]
    };
}

// Créer un embed de suggestion
function createSuggestionEmbed(suggestion, user) {
    const netVotes = suggestion.upvotes.length - suggestion.downvotes.length;
    const statusEmoji = {
        pending: "⏳",
        approved: "✅",
        denied: "❌"
    };
    
    const embed = new EmbedBuilder()
        .setTitle(`${statusEmoji[suggestion.status]} Suggestion #${suggestion.id.slice(-6)}`)
        .setDescription(suggestion.content)
        .addFields(
            { name: "👤 Auteur", value: `<@${suggestion.userId}>`, inline: true },
            { name: "📊 Votes", value: `👍 ${suggestion.upvotes.length} | 👎 ${suggestion.downvotes.length}\n**Net:** ${netVotes > 0 ? '+' : ''}${netVotes}`, inline: true },
            { name: "📝 Statut", value: suggestion.status, inline: true }
        )
        .setColor(
            suggestion.status === "approved" ? 0x00FF00 :
            suggestion.status === "denied" ? 0xFF0000 : 0xFFA500
        )
        .setThumbnail(user?.displayAvatarURL({ dynamic: true }))
        .setTimestamp(new Date(suggestion.createdAt));
    
    if (suggestion.reviewedBy) {
        embed.addFields({ 
            name: "🛡️ Modérateur", 
            value: `<@${suggestion.reviewedBy}>`, 
            inline: true 
        });
    }
    
    if (suggestion.denyReason) {
        embed.addFields({ 
            name: "❌ Raison", 
            value: suggestion.denyReason, 
            inline: false 
        });
    }
    
    return embed;
}

module.exports = {
    createSuggestion,
    voteSuggestion,
    approveSuggestion,
    denySuggestion,
    getSuggestions,
    getSuggestion,
    getStats,
    createSuggestionEmbed
};

