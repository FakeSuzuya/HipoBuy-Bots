const { EmbedBuilder } = require("discord.js");

// Envoyer une notification en MP
async function sendDM(user, title, description, color = 0x5865F2, fields = []) {
    try {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        await user.send({ embeds: [embed] });
        return true;
    } catch (error) {
        // L'utilisateur a probablement désactivé les MPs
        console.error(`Impossible d'envoyer un MP à ${user.tag}:`, error.message);
        return false;
    }
}

// Notification de giveaway
async function notifyGiveawayJoin(user, giveaway) {
    return await sendDM(
        user,
        "🎉 Vous participez au giveaway !",
        `Vous avez rejoint le giveaway pour **${giveaway.prize}** !\n\nBonne chance ! 🍀`,
        0x00FF00,
        [
            { name: "🎁 Prix", value: giveaway.prize, inline: true },
            { name: "👥 Participants", value: `${giveaway.participants.length}`, inline: true }
        ]
    );
}

// Notification de gain de giveaway
async function notifyGiveawayWin(user, giveaway) {
    return await sendDM(
        user,
        "🎉 Félicitations ! Vous avez gagné !",
        `Vous avez gagné le giveaway pour **${giveaway.prize}** !\n\n🎊 Félicitations !`,
        0xFFD700,
        [
            { name: "🎁 Prix", value: giveaway.prize, inline: true },
            { name: "👥 Participants", value: `${giveaway.participants.length}`, inline: true }
        ]
    );
}

// Notification de warn
async function notifyWarn(user, warn, moderator) {
    return await sendDM(
        user,
        "⚠️ Vous avez reçu un avertissement",
        `Vous avez reçu un avertissement sur le serveur **${warn.guildName || "Discord"}**.`,
        0xFFA500,
        [
            { name: "🛡️ Modérateur", value: `<@${warn.moderatorId}>`, inline: true },
            { name: "📝 Raison", value: warn.reason || "Aucune raison spécifiée", inline: false },
            { name: "📊 Total d'avertissements", value: `${warn.totalWarns}`, inline: true }
        ]
    );
}

// Notification de mute
async function notifyMute(user, mute, moderator) {
    const duration = mute.duration 
        ? `${Math.floor(mute.duration / (1000 * 60))} minutes`
        : "Permanent";
    
    return await sendDM(
        user,
        "🔇 Vous avez été réduit au silence",
        `Vous avez été réduit au silence (mute) sur le serveur.`,
        0xFF0000,
        [
            { name: "🛡️ Modérateur", value: `<@${mute.moderatorId}>`, inline: true },
            { name: "⏱️ Durée", value: duration, inline: true },
            { name: "📝 Raison", value: mute.reason || "Aucune raison spécifiée", inline: false }
        ]
    );
}

// Notification de suggestion approuvée
async function notifySuggestionApproved(user, suggestion) {
    return await sendDM(
        user,
        "✅ Votre suggestion a été approuvée !",
        `Votre suggestion a été approuvée par un modérateur !`,
        0x00FF00,
        [
            { name: "💡 Suggestion", value: suggestion.content.substring(0, 200), inline: false },
            { name: "👍 Votes", value: `${suggestion.upvotes.length}`, inline: true },
            { name: "👎 Votes", value: `${suggestion.downvotes.length}`, inline: true }
        ]
    );
}

// Notification de suggestion refusée
async function notifySuggestionDenied(user, suggestion) {
    return await sendDM(
        user,
        "❌ Votre suggestion a été refusée",
        `Votre suggestion a été refusée par un modérateur.`,
        0xFF0000,
        [
            { name: "💡 Suggestion", value: suggestion.content.substring(0, 200), inline: false },
            { name: "📝 Raison", value: suggestion.denyReason || "Aucune raison spécifiée", inline: false }
        ]
    );
}

// Notification de niveau
async function notifyLevelUp(user, level, rewards = []) {
    let description = `Félicitations ! Vous êtes passé au **niveau ${level}** ! 🎉`;
    
    if (rewards.length > 0) {
        description += `\n\n**Récompenses obtenues :**\n${rewards.map(r => `- ${r}`).join("\n")}`;
    }
    
    return await sendDM(
        user,
        "🎉 Nouveau niveau atteint !",
        description,
        0x00FF00
    );
}

module.exports = {
    sendDM,
    notifyGiveawayJoin,
    notifyGiveawayWin,
    notifyWarn,
    notifyMute,
    notifySuggestionApproved,
    notifySuggestionDenied,
    notifyLevelUp
};

