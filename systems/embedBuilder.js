const { EmbedBuilder } = require("discord.js");

/**
 * Système d'embeds améliorés avec design moderne
 */

// Couleurs par catégorie
const colors = {
    success: 0x00FF88,
    error: 0xFF4444,
    warning: 0xFFAA00,
    info: 0x5865F2,
    primary: 0x5865F2,
    secondary: 0x2F3136,
    level: 0xFFD700,
    economy: 0x00D4AA,
    moderation: 0xFF6B6B,
    fun: 0xFF6B9D,
    default: 0x5865F2
};

// Emojis par catégorie
const emojis = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
    level: "📊",
    economy: "💰",
    moderation: "🛡️",
    fun: "🎮",
    stats: "📈",
    config: "⚙️",
    ticket: "🎫",
    giveaway: "🎁",
    poll: "📊",
    suggestion: "💡"
};

/**
 * Crée un embed moderne avec design amélioré
 */
function createModernEmbed(options = {}) {
    const {
        title,
        description,
        color = colors.default,
        thumbnail,
        image,
        fields = [],
        footer,
        timestamp = true,
        author,
        url
    } = options;

    const embed = new EmbedBuilder()
        .setColor(color);

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);
    if (url) embed.setURL(url);
    if (author) {
        if (typeof author === "string") {
            embed.setAuthor({ name: author });
        } else {
            embed.setAuthor(author);
        }
    }
    if (footer) {
        if (typeof footer === "string") {
            embed.setFooter({ text: footer });
        } else {
            embed.setFooter(footer);
        }
    }
    if (timestamp) embed.setTimestamp();

    // Ajouter les champs
    fields.forEach(field => {
        if (field.inline === undefined) field.inline = false;
        embed.addFields(field);
    });

    return embed;
}

/**
 * Crée un embed de succès
 */
function createSuccessEmbed(title, description, options = {}) {
    return createModernEmbed({
        title: `${emojis.success} ${title}`,
        description,
        color: colors.success,
        ...options
    });
}

/**
 * Crée un embed d'erreur
 */
function createErrorEmbed(title, description, options = {}) {
    return createModernEmbed({
        title: `${emojis.error} ${title}`,
        description,
        color: colors.error,
        ...options
    });
}

/**
 * Crée un embed d'avertissement
 */
function createWarningEmbed(title, description, options = {}) {
    return createModernEmbed({
        title: `${emojis.warning} ${title}`,
        description,
        color: colors.warning,
        ...options
    });
}

/**
 * Crée un embed d'information
 */
function createInfoEmbed(title, description, options = {}) {
    return createModernEmbed({
        title: `${emojis.info} ${title}`,
        description,
        color: colors.info,
        ...options
    });
}

/**
 * Crée une barre de progression visuelle
 */
function createProgressBar(current, max, length = 20, filled = "█", empty = "░") {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    const filledLength = Math.round((percentage / 100) * length);
    const emptyLength = length - filledLength;
    
    return `${filled.repeat(filledLength)}${empty.repeat(emptyLength)} ${Math.round(percentage)}%`;
}

/**
 * Crée un embed de niveau amélioré
 */
function createLevelEmbed(user, levelStats, options = {}) {
    const { level, totalXP, currentXP, xpNeeded } = levelStats;
    const progressBar = createProgressBar(currentXP, xpNeeded, 20);
    
    return createModernEmbed({
        title: `${emojis.level} Niveau de ${user.tag}`,
        description: `**Niveau ${level}**\n\`${progressBar}\`\n${currentXP}/${xpNeeded} XP`,
        color: colors.level,
        thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
        fields: [
            { name: "📊 Total XP", value: `${totalXP.toLocaleString()} XP`, inline: true },
            { name: "🎯 XP restant", value: `${xpNeeded - currentXP} XP`, inline: true },
            { name: "📈 Rang", value: `#${options.rank || "?"}`, inline: true }
        ],
        footer: { text: `ID: ${user.id}` },
        ...options
    });
}

/**
 * Crée un embed d'économie amélioré
 */
function createEconomyEmbed(user, economyStats, options = {}) {
    return createModernEmbed({
        title: `${emojis.economy} Économie de ${user.tag}`,
        description: `**Portefeuille:** ${economyStats.balance.toLocaleString()} 💰\n**Banque:** ${economyStats.bank.toLocaleString()} 💰\n**Total:** ${(economyStats.balance + economyStats.bank).toLocaleString()} 💰`,
        color: colors.economy,
        thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
        fields: [
            { name: "💵 Solde", value: `${economyStats.balance.toLocaleString()} 💰`, inline: true },
            { name: "🏦 Banque", value: `${economyStats.bank.toLocaleString()} 💰`, inline: true },
            { name: "📊 Rang", value: `#${options.rank || "?"}`, inline: true }
        ],
        footer: { text: `ID: ${user.id}` },
        ...options
    });
}

/**
 * Crée un embed de modération amélioré
 */
function createModerationEmbed(type, user, moderator, reason, options = {}) {
    const types = {
        warn: { title: "⚠️ Avertissement", emoji: "⚠️", color: colors.warning },
        mute: { title: "🔇 Mute", emoji: "🔇", color: colors.warning },
        ban: { title: "🔨 Bannissement", emoji: "🔨", color: colors.error },
        kick: { title: "👢 Expulsion", emoji: "👢", color: colors.warning }
    };

    const typeData = types[type] || types.warn;

    return createModernEmbed({
        title: `${typeData.emoji} ${typeData.title}`,
        description: `**${user.tag}** a été ${type === "warn" ? "averti" : type === "mute" ? "mis en sourdine" : type === "ban" ? "banni" : "expulsé"}.`,
        color: typeData.color,
        thumbnail: user.displayAvatarURL({ dynamic: true }),
        fields: [
            { name: "👤 Utilisateur", value: `${user} (${user.id})`, inline: true },
            { name: "🛡️ Modérateur", value: `${moderator}`, inline: true },
            { name: "📝 Raison", value: reason || "Aucune raison spécifiée", inline: false }
        ],
        ...options
    });
}

/**
 * Crée un embed de statistiques amélioré
 */
function createStatsEmbed(guild, stats, options = {}) {
    return createModernEmbed({
        title: `${emojis.stats} Statistiques du serveur`,
        description: `Statistiques complètes de **${guild.name}**`,
        color: colors.info,
        thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
        fields: [
            { name: "👥 Membres", value: `${guild.memberCount}`, inline: true },
            { name: "💬 Messages", value: `${stats.messages || 0}`, inline: true },
            { name: "📊 Commandes", value: `${stats.commands || 0}`, inline: true },
            { name: "🎫 Tickets", value: `${stats.tickets || 0}`, inline: true },
            { name: "🛡️ Modérations", value: `${stats.moderation || 0}`, inline: true },
            { name: "📈 Croissance", value: `+${stats.joins || 0} / -${stats.leaves || 0}`, inline: true }
        ],
        footer: { text: `ID: ${guild.id}` },
        ...options
    });
}

/**
 * Crée un embed de configuration amélioré
 */
function createConfigEmbed(title, description, configData, options = {}) {
    const fields = Object.entries(configData).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value ? "✅ Activé" : "❌ Désactivé",
        inline: true
    }));

    return createModernEmbed({
        title: `${emojis.config} ${title}`,
        description,
        color: colors.info,
        fields,
        ...options
    });
}

/**
 * Crée un embed de giveaway amélioré
 */
function createGiveawayEmbed(giveaway, host, options = {}) {
    const timeLeft = giveaway.endsAt - Date.now();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const participants = giveaway.participants?.length || 0;

    return createModernEmbed({
        title: `${emojis.giveaway} Giveaway`,
        description: `**${giveaway.prize}**\n\n🎁 **${participants}** participant(s)\n⏱️ **${hours}h ${minutes}m** restantes`,
        color: colors.fun,
        fields: [
            { name: "🎁 Prix", value: giveaway.prize, inline: true },
            { name: "👤 Organisateur", value: host ? `${host}` : `<@${giveaway.hostId}>`, inline: true },
            { name: "⏱️ Temps restant", value: `${hours}h ${minutes}m`, inline: true }
        ],
        footer: { text: `ID: ${giveaway.id}` },
        timestamp: new Date(giveaway.endsAt),
        ...options
    });
}

/**
 * Crée un embed de poll amélioré
 */
function createPollEmbed(poll, creator, options = {}) {
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    
    const optionsText = poll.options.map((opt, index) => {
        const votes = opt.votes.length;
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        
        return `**${String.fromCharCode(65 + index)}.** ${opt.text} - ${votes} vote(s) (${percentage}%)`;
    }).join("\n\n");

    return createModernEmbed({
        title: `${emojis.poll} Sondage`,
        description: `**${poll.question}**\n\n${optionsText}`,
        color: poll.ended ? colors.error : colors.info,
        fields: [
            { name: "👤 Créateur", value: creator ? `${creator}` : `<@${poll.creatorId}>`, inline: true },
            { name: "📊 Total de votes", value: `${totalVotes}`, inline: true },
            { name: "🔒 Type", value: poll.anonymous ? "Anonyme" : "Public", inline: true }
        ],
        footer: { text: poll.ended ? "Sondage terminé" : "Cliquez sur les boutons pour voter" },
        timestamp: poll.endsAt ? new Date(poll.endsAt) : new Date(poll.createdAt),
        ...options
    });
}

module.exports = {
    createModernEmbed,
    createSuccessEmbed,
    createErrorEmbed,
    createWarningEmbed,
    createInfoEmbed,
    createProgressBar,
    createLevelEmbed,
    createEconomyEmbed,
    createModerationEmbed,
    createStatsEmbed,
    createConfigEmbed,
    createGiveawayEmbed,
    createPollEmbed,
    colors,
    emojis
};

