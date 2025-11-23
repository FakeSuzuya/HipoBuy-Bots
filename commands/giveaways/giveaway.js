const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const giveawaySystem = require("../../systems/giveawaySystem");
const embedBuilder = require("../../systems/embedBuilder");

module.exports = {
    category: "Giveaways",
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("🎁 Gère les giveaways avec une interface interactive"),

    async execute(interaction, client) {
        // Vérifier les permissions pour les actions de modération
        const hasManagePerms = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
        
        // Afficher le menu principal
        await showGiveawayMenu(interaction, client, hasManagePerms);
    }
};

async function showGiveawayMenu(interaction, client, hasManagePerms) {
    const activeGiveaways = giveawaySystem.getActiveGiveaways(interaction.guild.id);
    const allGiveaways = giveawaySystem.getAllGiveaways(interaction.guild.id);
    
    const embed = embedBuilder.createInfoEmbed(
        "🎁 Gestion des Giveaways",
        hasManagePerms 
            ? "Choisissez une action dans le menu ci-dessous pour gérer les giveaways."
            : "Vous pouvez voir les giveaways actifs. Seuls les modérateurs peuvent créer ou gérer des giveaways.",
        {
            fields: [
                { name: "🎁 Actifs", value: `${activeGiveaways.length} giveaway(s)`, inline: true },
                { name: "📊 Total", value: `${allGiveaways.length} giveaway(s)`, inline: true },
                { name: "👤 Permissions", value: hasManagePerms ? "✅ Modérateur" : "❌ Utilisateur", inline: true }
            ],
            thumbnail: interaction.guild.iconURL({ dynamic: true })
        }
    );

    const options = [];
    
    if (hasManagePerms) {
        options.push({
            label: "➕ Créer un giveaway",
            description: "Créer un nouveau giveaway",
            value: "create",
            emoji: "➕"
        });
    }
    
    if (activeGiveaways.length > 0) {
        options.push({
            label: "📋 Liste des giveaways actifs",
            description: `Voir les ${activeGiveaways.length} giveaway(s) actif(s)`,
            value: "list",
            emoji: "📋"
        });
    }
    
    if (hasManagePerms && activeGiveaways.length > 0) {
        options.push({
            label: "⏹️ Terminer un giveaway",
            description: "Terminer un giveaway actif",
            value: "end",
            emoji: "⏹️"
        });
    }
    
    if (hasManagePerms && allGiveaways.filter(g => g.ended).length > 0) {
        options.push({
            label: "🎲 Relancer un giveaway",
            description: "Relancer le tirage au sort",
            value: "reroll",
            emoji: "🎲"
        });
    }

    if (options.length === 0) {
        return interaction.reply({
            content: hasManagePerms 
                ? "❌ Aucune action disponible. Créez d'abord un giveaway avec `/giveaway`."
                : "❌ Aucun giveaway actif pour le moment.",
            flags: MessageFlags.Ephemeral
        });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("giveaway_menu")
        .setPlaceholder("🔍 Choisissez une action...")
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
}

// Gérer les interactions du menu giveaway
async function handleGiveawayInteraction(interaction, client) {
    const value = interaction.values[0];
    const hasManagePerms = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (value === "create") {
        if (!hasManagePerms) {
            return interaction.reply({
                content: "❌ Vous n'avez pas la permission de créer des giveaways.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Créer un modal pour les détails du giveaway
        const modal = new ModalBuilder()
            .setCustomId(`giveaway_create_modal_${Date.now()}`)
            .setTitle("Créer un Giveaway");

        const prizeInput = new TextInputBuilder()
            .setCustomId("giveaway_prize")
            .setLabel("Prix du giveaway")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: Nitro Discord, 1000€, etc.")
            .setRequired(true)
            .setMaxLength(100);

        const durationInput = new TextInputBuilder()
            .setCustomId("giveaway_duration")
            .setLabel("Durée (en minutes)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: 60 (pour 1 heure)")
            .setRequired(true)
            .setMaxLength(10);

        const firstRow = new ActionRowBuilder().addComponents(prizeInput);
        const secondRow = new ActionRowBuilder().addComponents(durationInput);
        
        modal.addComponents(firstRow, secondRow);
        await interaction.showModal(modal);
        return;
    }

    if (value === "list") {
        const giveaways = giveawaySystem.getActiveGiveaways(interaction.guild.id);

        if (giveaways.length === 0) {
            return interaction.reply({
                content: "❌ Aucun giveaway actif.",
                flags: MessageFlags.Ephemeral
            });
        }

        const list = giveaways.map((g, index) => {
            const timeLeft = g.endsAt - Date.now();
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            return `${index + 1}. **${g.prize}** - ${hours}h ${minutes}m - ${g.participants?.length || 0} participant(s)`;
        }).join("\n");

        const embed = embedBuilder.createInfoEmbed(
            "🎁 Giveaways actifs",
            list,
            {
                footer: { text: `Total: ${giveaways.length} giveaway(s)` }
            }
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
    }

    if (value === "end") {
        if (!hasManagePerms) {
            return interaction.reply({
                content: "❌ Vous n'avez pas la permission de terminer des giveaways.",
                flags: MessageFlags.Ephemeral
            });
        }

        const giveaways = giveawaySystem.getActiveGiveaways(interaction.guild.id);
        
        if (giveaways.length === 0) {
            return interaction.reply({
                content: "❌ Aucun giveaway actif à terminer.",
                flags: MessageFlags.Ephemeral
            });
        }

        const options = giveaways.map(g => ({
            label: g.prize.length > 100 ? g.prize.substring(0, 97) + "..." : g.prize,
            description: `ID: ${g.id}`,
            value: g.id,
            emoji: "🎁"
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("giveaway_end_select")
            .setPlaceholder("🔍 Choisissez un giveaway à terminer...")
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = embedBuilder.createWarningEmbed(
            "Terminer un giveaway",
            "Sélectionnez le giveaway que vous souhaitez terminer."
        );

        await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
        return;
    }

    if (value === "reroll") {
        if (!hasManagePerms) {
            return interaction.reply({
                content: "❌ Vous n'avez pas la permission de relancer des giveaways.",
                flags: MessageFlags.Ephemeral
            });
        }

        const endedGiveaways = giveawaySystem.getAllGiveaways(interaction.guild.id).filter(g => g.ended && g.winnerId);
        
        if (endedGiveaways.length === 0) {
            return interaction.reply({
                content: "❌ Aucun giveaway terminé à relancer.",
                flags: MessageFlags.Ephemeral
            });
        }

        const options = endedGiveaways.map(g => ({
            label: g.prize.length > 100 ? g.prize.substring(0, 97) + "..." : g.prize,
            description: `Gagnant actuel: ${g.winnerId}`,
            value: g.id,
            emoji: "🎲"
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("giveaway_reroll_select")
            .setPlaceholder("🔍 Choisissez un giveaway à relancer...")
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = embedBuilder.createInfoEmbed(
            "Relancer un giveaway",
            "Sélectionnez le giveaway pour lequel vous souhaitez relancer le tirage au sort."
        );

        await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
        return;
    }
}

// Gérer les sélections de giveaway (end, reroll)
async function handleGiveawaySelect(interaction, client, action) {
    const giveawayId = interaction.values[0];
    const hasManagePerms = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!hasManagePerms) {
        return interaction.reply({
            content: "❌ Vous n'avez pas la permission de gérer des giveaways.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (action === "end") {
        const giveaway = giveawaySystem.endGiveaway(interaction.guild.id, giveawayId);

        if (!giveaway) {
            return interaction.reply({
                content: "❌ Giveaway introuvable ou déjà terminé.",
                flags: MessageFlags.Ephemeral
            });
        }

        const host = await client.users.fetch(giveaway.hostId).catch(() => null);
        const embed = giveawaySystem.createGiveawayEmbed(giveaway, host);

        // Mettre à jour le message
        try {
            const channel = await interaction.guild.channels.fetch(giveaway.channelId);
            if (giveaway.messageId) {
                const message = await channel.messages.fetch(giveaway.messageId);
                await message.edit({ embeds: [embed], components: [] });
            }
        } catch (error) {
            console.error("Erreur mise à jour message:", error);
        }

        const resultEmbed = embedBuilder.createSuccessEmbed(
            "Giveaway terminé",
            giveaway.winnerId 
                ? `Le gagnant est <@${giveaway.winnerId}> !` 
                : "Aucun participant."
        );

        await interaction.reply({ embeds: [resultEmbed] });
    }

    if (action === "reroll") {
        const giveaway = giveawaySystem.rerollGiveaway(interaction.guild.id, giveawayId);

        if (!giveaway) {
            return interaction.reply({
                content: "❌ Giveaway introuvable ou pas encore terminé.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = embedBuilder.createSuccessEmbed(
            "Nouveau gagnant",
            giveaway.winnerId 
                ? `Le nouveau gagnant est <@${giveaway.winnerId}> !` 
                : "Aucun participant."
        );

        await interaction.reply({ embeds: [embed] });
    }
}

// Gérer les modals de création
async function handleGiveawayModal(interaction, client) {
    const prize = interaction.fields.getTextInputValue("giveaway_prize");
    const durationMinutes = parseInt(interaction.fields.getTextInputValue("giveaway_duration"));

    if (isNaN(durationMinutes) || durationMinutes < 1) {
        return interaction.reply({
            content: "❌ La durée doit être un nombre positif (en minutes).",
            flags: MessageFlags.Ephemeral
        });
    }

    const duration = durationMinutes * 60 * 1000;
    const channel = interaction.channel;

    const giveaway = giveawaySystem.createGiveaway(
        interaction.guild.id,
        channel.id,
        interaction.user.id,
        prize,
        duration
    );

    const embed = giveawaySystem.createGiveawayEmbed(giveaway, interaction.user);
    const buttons = giveawaySystem.createGiveawayButtons(giveaway);

    // Générer le graphique et l'ajouter à l'embed
    const chartGenerator = require("../../systems/chartGenerator");
    const { AttachmentBuilder } = require("discord.js");
    try {
        const chartBuffer = await chartGenerator.generateGiveawayChart(giveaway);
        const attachment = new AttachmentBuilder(chartBuffer, { name: `giveaway-chart-${giveaway.id}.png` });
        embed.setImage(`attachment://giveaway-chart-${giveaway.id}.png`);
        
        const message = await channel.send({
            embeds: [embed],
            components: buttons && buttons.components && buttons.components.length > 0 ? [buttons] : [],
            files: [attachment]
        });
        
        // Mettre à jour le messageId
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../data/giveaways.json");
        const allData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        const guildGiveaways = allData[interaction.guild.id] || [];
        const giveawayIndex = guildGiveaways.findIndex(g => g.id === giveaway.id);
        if (giveawayIndex !== -1) {
            guildGiveaways[giveawayIndex].messageId = message.id;
            allData[interaction.guild.id] = guildGiveaways;
            fs.writeFileSync(dataPath, JSON.stringify(allData, null, 2), "utf-8");
        }
    } catch (error) {
        console.error("Erreur génération graphique giveaway:", error);
        const message = await channel.send({
            embeds: [embed],
            components: buttons && buttons.components && buttons.components.length > 0 ? [buttons] : []
        });
        
        // Mettre à jour le messageId même en cas d'erreur
        const fs = require("fs");
        const path = require("path");
        const dataPath = path.join(__dirname, "../../data/giveaways.json");
        const allData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        const guildGiveaways = allData[interaction.guild.id] || [];
        const giveawayIndex = guildGiveaways.findIndex(g => g.id === giveaway.id);
        if (giveawayIndex !== -1) {
            guildGiveaways[giveawayIndex].messageId = message.id;
            allData[interaction.guild.id] = guildGiveaways;
            fs.writeFileSync(dataPath, JSON.stringify(allData, null, 2), "utf-8");
        }
    }

    await interaction.reply({
        content: `✅ Giveaway créé dans ${channel}`,
        flags: MessageFlags.Ephemeral
    });
}

// Exporter les fonctions pour interactionCreate.js
module.exports.handleGiveawayInteraction = handleGiveawayInteraction;
module.exports.handleGiveawaySelect = handleGiveawaySelect;
module.exports.handleGiveawayModal = handleGiveawayModal;
