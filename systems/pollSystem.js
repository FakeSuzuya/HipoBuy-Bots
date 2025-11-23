const fs = require("fs");
const path = require("path");
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const embedBuilder = require("./embedBuilder");

const dataPath = path.join(__dirname, "../data/polls.json");

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

// Créer un poll
function createPoll(guildId, channelId, creatorId, question, options, anonymous = false, duration = null) {
    const data = loadData();
    if (!data[guildId]) data[guildId] = [];

    const poll = {
        id: Date.now().toString(),
        guildId,
        channelId,
        messageId: null,
        creatorId,
        question,
        options: options.map((opt, index) => ({
            id: index.toString(),
            text: opt,
            votes: []
        })),
        anonymous,
        createdAt: Date.now(),
        endsAt: duration ? Date.now() + duration : null,
        ended: false
    };

    data[guildId].push(poll);
    saveData(data);
    return poll;
}

// Voter pour une option
function votePoll(guildId, pollId, userId, optionId) {
    const data = loadData();
    const guildPolls = data[guildId] || [];
    const poll = guildPolls.find(p => p.id === pollId && !p.ended);

    if (!poll) return null;

    // Retirer le vote précédent de l'utilisateur
    poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(v => v !== userId);
    });

    // Ajouter le nouveau vote
    const option = poll.options.find(opt => opt.id === optionId);
    if (option) {
        option.votes.push(userId);
    }

    saveData(data);
    return poll;
}

// Terminer un poll
function endPoll(guildId, pollId) {
    const data = loadData();
    const guildPolls = data[guildId] || [];
    const poll = guildPolls.find(p => p.id === pollId);

    if (!poll) return null;

    poll.ended = true;
    saveData(data);
    return poll;
}

// Obtenir un poll
function getPoll(guildId, pollId) {
    const data = loadData();
    const guildPolls = data[guildId] || [];
    return guildPolls.find(p => p.id === pollId);
}

// Obtenir tous les polls actifs
function getActivePolls(guildId) {
    const data = loadData();
    const guildPolls = data[guildId] || [];
    return guildPolls.filter(p => !p.ended && (!p.endsAt || p.endsAt > Date.now()));
}

// Créer l'embed du poll
function createPollEmbed(poll, creator) {
    const embed = embedBuilder.createPollEmbed(poll, creator, {
        footer: { text: poll.ended ? "Sondage terminé" : "Cliquez sur les boutons pour voter" }
    });

    if (poll.endsAt && !poll.ended) {
        const timeLeft = poll.endsAt - Date.now();
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        embed.addFields({ name: "⏱️ Temps restant", value: `${hours}h ${minutes}m`, inline: false });
    }

    return embed;
}

// Créer les boutons du poll
function createPollButtons(poll) {
    if (poll.ended) {
        return [];
    }

    // Emojis numériques valides
    const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
    const letterLabels = ["A", "B", "C", "D", "E"];

    const buttons = poll.options.map((opt, index) => {
        const button = new ButtonBuilder()
            .setCustomId(`poll_vote_${poll.id}_${opt.id}`)
            .setStyle(ButtonStyle.Primary);
        
        // Utiliser un emoji numérique si disponible
        if (index < numberEmojis.length) {
            button.setEmoji(numberEmojis[index]);
        }
        
        // Label court et clair (max 80 caractères pour Discord)
        const shortText = opt.text.length > 70 ? opt.text.substring(0, 67) + "..." : opt.text;
        button.setLabel(`${letterLabels[index]}. ${shortText}`);
        
        return button;
    });

    // Limite de 5 boutons par ligne
    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
        rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    return rows;
}

// Mettre à jour le messageId d'un poll
function updatePollMessageId(guildId, pollId, messageId) {
    const data = loadData();
    const guildPolls = data[guildId] || [];
    const poll = guildPolls.find(p => p.id === pollId);
    
    if (poll) {
        poll.messageId = messageId;
        saveData(data);
    }
}

module.exports = {
    createPoll,
    votePoll,
    endPoll,
    getPoll,
    getActivePolls,
    createPollEmbed,
    createPollButtons,
    updatePollMessageId
};

