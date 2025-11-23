const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

// Chemin vers le fichier de données
const dataPath = path.join(__dirname, "../data/moderation.json");

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

// Ajouter un avertissement
function addWarn(guildId, userId, moderatorId, reason = "Aucune raison spécifiée") {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        data[key] = {
            userId,
            guildId,
            warns: [],
            mutes: [],
            bans: []
        };
    }
    
    const warn = {
        id: Date.now().toString(),
        moderatorId,
        reason,
        timestamp: Date.now()
    };
    
    data[key].warns.push(warn);
    saveData(data);
    
    return {
        warnCount: data[key].warns.length,
        warn
    };
}

// Obtenir les avertissements
function getWarns(guildId, userId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    return data[key]?.warns || [];
}

// Supprimer un avertissement
function removeWarn(guildId, userId, warnId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) return false;
    
    const index = data[key].warns.findIndex(w => w.id === warnId);
    if (index === -1) return false;
    
    data[key].warns.splice(index, 1);
    saveData(data);
    return true;
}

// Ajouter un mute
function addMute(guildId, userId, moderatorId, duration, reason = "Aucune raison spécifiée") {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        data[key] = {
            userId,
            guildId,
            warns: [],
            mutes: [],
            bans: []
        };
    }
    
    const mute = {
        id: Date.now().toString(),
        moderatorId,
        reason,
        duration,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration
    };
    
    data[key].mutes.push(mute);
    saveData(data);
    
    return mute;
}

// Ajouter un ban
function addBan(guildId, userId, moderatorId, reason = "Aucune raison spécifiée") {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        data[key] = {
            userId,
            guildId,
            warns: [],
            mutes: [],
            bans: []
        };
    }
    
    const ban = {
        id: Date.now().toString(),
        moderatorId,
        reason,
        timestamp: Date.now()
    };
    
    data[key].bans.push(ban);
    saveData(data);
    
    return ban;
}

// Obtenir l'historique de modération
function getHistory(guildId, userId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    return data[key] || {
        userId,
        guildId,
        warns: [],
        mutes: [],
        bans: []
    };
}

// Créer un embed d'avertissement
function createWarnEmbed(user, moderator, reason, warnCount) {
    return new EmbedBuilder()
        .setTitle("⚠️ Avertissement")
        .setDescription(`**${user.tag}** a reçu un avertissement.`)
        .addFields(
            { name: "👤 Utilisateur", value: `${user} (${user.id})`, inline: true },
            { name: "🛡️ Modérateur", value: `${moderator}`, inline: true },
            { name: "📝 Raison", value: reason, inline: false },
            { name: "📊 Total d'avertissements", value: `${warnCount}`, inline: true }
        )
        .setColor(0xFFA500)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
}

// Créer un embed de mute
function createMuteEmbed(user, moderator, duration, reason) {
    const durationText = formatDuration(duration);
    return new EmbedBuilder()
        .setTitle("🔇 Mute")
        .setDescription(`**${user.tag}** a été muté.`)
        .addFields(
            { name: "👤 Utilisateur", value: `${user} (${user.id})`, inline: true },
            { name: "🛡️ Modérateur", value: `${moderator}`, inline: true },
            { name: "⏱️ Durée", value: durationText, inline: true },
            { name: "📝 Raison", value: reason, inline: false }
        )
        .setColor(0xFF0000)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
}

// Créer un embed de ban
function createBanEmbed(user, moderator, reason) {
    return new EmbedBuilder()
        .setTitle("🔨 Ban")
        .setDescription(`**${user.tag}** a été banni.`)
        .addFields(
            { name: "👤 Utilisateur", value: `${user} (${user.id})`, inline: true },
            { name: "🛡️ Modérateur", value: `${moderator}`, inline: true },
            { name: "📝 Raison", value: reason, inline: false }
        )
        .setColor(0xFF0000)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
}

// Formater la durée
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} jour(s)`;
    if (hours > 0) return `${hours} heure(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return `${seconds} seconde(s)`;
}

module.exports = {
    addWarn,
    getWarns,
    removeWarn,
    addMute,
    addBan,
    getHistory,
    createWarnEmbed,
    createMuteEmbed,
    createBanEmbed,
    formatDuration
};

