const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

const dataPath = path.join(__dirname, "../data/welcome.json");

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

// Obtenir la configuration de bienvenue
function getWelcomeConfig(guildId) {
    const data = loadData();
    return data[guildId] || {
        enabled: false,
        channelId: null,
        message: "Bienvenue {user} sur {guild} !",
        autoRoles: [],
        imageEnabled: false
    };
}

// Configurer le système de bienvenue
function setWelcomeConfig(guildId, config) {
    const data = loadData();
    data[guildId] = {
        ...getWelcomeConfig(guildId),
        ...config
    };
    saveData(data);
    return data[guildId];
}

// Obtenir la configuration d'au revoir
function getGoodbyeConfig(guildId) {
    const data = loadData();
    const guildData = data[guildId] || {};
    return guildData.goodbye || {
        enabled: false,
        channelId: null,
        message: "{user} a quitté {guild}."
    };
}

// Configurer le système d'au revoir
function setGoodbyeConfig(guildId, config) {
    const data = loadData();
    if (!data[guildId]) {
        data[guildId] = getWelcomeConfig(guildId);
    }
    data[guildId].goodbye = {
        ...getGoodbyeConfig(guildId),
        ...config
    };
    saveData(data);
    return data[guildId].goodbye;
}

// Remplacer les variables dans le message
function replaceVariables(message, user, guild) {
    return message
        .replace(/{user}/g, `<@${user.id}>`)
        .replace(/{username}/g, user.username)
        .replace(/{usertag}/g, user.tag)
        .replace(/{guild}/g, guild.name)
        .replace(/{membercount}/g, guild.memberCount.toString())
        .replace(/{mention}/g, `<@${user.id}>`);
}

// Créer l'embed de bienvenue
function createWelcomeEmbed(user, guild, config) {
    const message = replaceVariables(config.message, user, guild);
    
    const embed = new EmbedBuilder()
        .setTitle("👋 Bienvenue !")
        .setDescription(message)
        .setColor(0x00FF00)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            { name: "👤 Membre", value: `<@${user.id}>`, inline: true },
            { name: "📊 Total", value: `${guild.memberCount} membres`, inline: true }
        )
        .setFooter({ text: `Serveur: ${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    return embed;
}

// Créer l'embed d'au revoir
function createGoodbyeEmbed(user, guild, config) {
    const message = replaceVariables(config.message, user, guild);
    
    const embed = new EmbedBuilder()
        .setTitle("👋 Au revoir")
        .setDescription(message)
        .setColor(0xFF0000)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
            { name: "👤 Membre", value: `<@${user.id}>`, inline: true },
            { name: "📊 Total", value: `${guild.memberCount} membres`, inline: true }
        )
        .setFooter({ text: `Serveur: ${guild.name}`, iconURL: guild.iconURL({ dynamic: true }) })
        .setTimestamp();

    return embed;
}

module.exports = {
    getWelcomeConfig,
    setWelcomeConfig,
    getGoodbyeConfig,
    setGoodbyeConfig,
    replaceVariables,
    createWelcomeEmbed,
    createGoodbyeEmbed
};

