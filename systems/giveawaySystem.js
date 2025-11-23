const fs = require("fs");
const path = require("path");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const embedBuilder = require("./embedBuilder");

const dataPath = path.join(__dirname, "../data/giveaways.json");

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

// Créer un giveaway
function createGiveaway(guildId, channelId, hostId, prize, duration, messageId = null) {
    const data = loadData();
    const giveawayId = Date.now().toString();
    const endsAt = Date.now() + duration;
    
    const giveaway = {
        id: giveawayId,
        guildId,
        channelId,
        hostId,
        prize,
        duration,
        endsAt,
        messageId,
        participants: [],
        ended: false,
        winnerId: null,
        createdAt: Date.now()
    };
    
    if (!data[guildId]) {
        data[guildId] = [];
    }
    
    data[guildId].push(giveaway);
    saveData(data);
    
    return giveaway;
}

// Rejoindre un giveaway
function joinGiveaway(guildId, giveawayId, userId) {
    const data = loadData();
    const guildGiveaways = data[guildId] || [];
    const giveaway = guildGiveaways.find(g => g.id === giveawayId);
    
    if (!giveaway || giveaway.ended) return false;
    if (giveaway.participants.includes(userId)) return false;
    
    giveaway.participants.push(userId);
    saveData(data);
    return true;
}

// Quitter un giveaway
function leaveGiveaway(guildId, giveawayId, userId) {
    const data = loadData();
    const guildGiveaways = data[guildId] || [];
    const giveaway = guildGiveaways.find(g => g.id === giveawayId);
    
    if (!giveaway || giveaway.ended) return false;
    
    const index = giveaway.participants.indexOf(userId);
    if (index === -1) return false;
    
    giveaway.participants.splice(index, 1);
    saveData(data);
    return true;
}

// Terminer un giveaway
function endGiveaway(guildId, giveawayId) {
    const data = loadData();
    const guildGiveaways = data[guildId] || [];
    const giveaway = guildGiveaways.find(g => g.id === giveawayId);
    
    if (!giveaway || giveaway.ended) return null;
    
    giveaway.ended = true;
    
    if (giveaway.participants.length > 0) {
        const randomIndex = Math.floor(Math.random() * giveaway.participants.length);
        giveaway.winnerId = giveaway.participants[randomIndex];
    }
    
    saveData(data);
    return giveaway;
}

// Reroll un giveaway
function rerollGiveaway(guildId, giveawayId) {
    const data = loadData();
    const guildGiveaways = data[guildId] || [];
    const giveaway = guildGiveaways.find(g => g.id === giveawayId);
    
    if (!giveaway || !giveaway.ended) return null;
    if (giveaway.participants.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * giveaway.participants.length);
    giveaway.winnerId = giveaway.participants[randomIndex];
    
    saveData(data);
    return giveaway;
}

// Obtenir les giveaways actifs
function getActiveGiveaways(guildId) {
    const data = loadData();
    const guildGiveaways = data[guildId] || [];
    return guildGiveaways.filter(g => !g.ended && g.endsAt > Date.now());
}

// Obtenir tous les giveaways
function getAllGiveaways(guildId) {
    const data = loadData();
    return data[guildId] || [];
}

// Obtenir un giveaway
function getGiveaway(guildId, giveawayId) {
    const data = loadData();
    const guildGiveaways = data[guildId] || [];
    return guildGiveaways.find(g => g.id === giveawayId);
}

// Créer un embed de giveaway
function createGiveawayEmbed(giveaway, host) {
    const timeLeft = giveaway.endsAt - Date.now();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const participants = giveaway.participants?.length || 0;
    
    const embed = embedBuilder.createGiveawayEmbed(giveaway, host, {
        footer: { text: giveaway.ended ? "Giveaway terminé" : "Cliquez sur le bouton pour participer" }
    });
    
    if (giveaway.ended && giveaway.winnerId) {
        embed.addFields({ name: "🏆 Gagnant", value: `<@${giveaway.winnerId}>`, inline: false });
    }
    
    return embed;
}

// Créer les boutons de giveaway
function createGiveawayButtons(giveaway) {
    if (giveaway.ended) {
        return [];
    }
    
    const joinButton = new ButtonBuilder()
        .setCustomId(`giveaway_join_${giveaway.id}`)
        .setLabel("Participer")
        .setEmoji("🎉")
        .setStyle(ButtonStyle.Success);
    
    const leaveButton = new ButtonBuilder()
        .setCustomId(`giveaway_leave_${giveaway.id}`)
        .setLabel("Quitter")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger);
    
    return new ActionRowBuilder().addComponents(joinButton, leaveButton);
}

module.exports = {
    createGiveaway,
    joinGiveaway,
    leaveGiveaway,
    endGiveaway,
    rerollGiveaway,
    getActiveGiveaways,
    getAllGiveaways,
    getGiveaway,
    createGiveawayEmbed,
    createGiveawayButtons
};

