const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const pollSystem = require("../../systems/pollSystem");
const embedBuilder = require("../../systems/embedBuilder");

module.exports = {
    category: "Polls",
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("📊 Gère les sondages avec une interface interactive"),

    async execute(interaction, client) {
        const hasManagePerms = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
        await showPollMenu(interaction, client, hasManagePerms);
    }
};

async function showPollMenu(interaction, client, hasManagePerms) {
    const activePolls = pollSystem.getActivePolls(interaction.guild.id);
    
    const embed = embedBuilder.createInfoEmbed(
        "📊 Gestion des Sondages",
        hasManagePerms 
            ? "Choisissez une action dans le menu ci-dessous pour gérer les sondages."
            : "Vous pouvez voir les sondages actifs. Seuls les modérateurs peuvent créer ou gérer des sondages.",
        {
            fields: [
                { name: "📊 Actifs", value: `${activePolls.length} sondage(s)`, inline: true },
                { name: "👤 Permissions", value: hasManagePerms ? "✅ Modérateur" : "❌ Utilisateur", inline: true }
            ],
            thumbnail: interaction.guild.iconURL({ dynamic: true })
        }
    );

    const options = [];
    
    if (hasManagePerms) {
        options.push({
            label: "➕ Créer un sondage",
            description: "Créer un nouveau sondage",
            value: "create",
            emoji: "➕"
        });
    }
    
    if (activePolls.length > 0) {
        options.push({
            label: "📋 Liste des sondages actifs",
            description: `Voir les ${activePolls.length} sondage(s) actif(s)`,
            value: "list",
            emoji: "📋"
        });
        
        if (hasManagePerms) {
            options.push({
                label: "⏹️ Terminer un sondage",
                description: "Terminer un sondage actif",
                value: "end",
                emoji: "⏹️"
            });
        }
    }

    if (options.length === 0) {
        return interaction.reply({
            content: hasManagePerms 
                ? "❌ Aucune action disponible. Créez d'abord un sondage avec `/poll`."
                : "❌ Aucun sondage actif pour le moment.",
            flags: MessageFlags.Ephemeral
        });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("poll_menu")
        .setPlaceholder("🔍 Choisissez une action...")
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
}

// Gérer les interactions du menu poll
async function handlePollInteraction(interaction, client) {
    const value = interaction.values[0];
    const hasManagePerms = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (value === "create") {
        if (!hasManagePerms) {
            return interaction.reply({
                content: "❌ Vous n'avez pas la permission de créer des sondages.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Créer un modal pour la question et les options en une seule fois
        const modal = new ModalBuilder()
            .setCustomId(`poll_create_modal_${Date.now()}`)
            .setTitle("Créer un Sondage");

        const questionInput = new TextInputBuilder()
            .setCustomId("poll_question")
            .setLabel("Question du sondage")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: Quelle est votre couleur préférée ?")
            .setRequired(true)
            .setMaxLength(200);

        const option1Input = new TextInputBuilder()
            .setCustomId("poll_option_1")
            .setLabel("Option 1")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Première option")
            .setRequired(true)
            .setMaxLength(100);

        const option2Input = new TextInputBuilder()
            .setCustomId("poll_option_2")
            .setLabel("Option 2")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Deuxième option")
            .setRequired(true)
            .setMaxLength(100);

        const option3Input = new TextInputBuilder()
            .setCustomId("poll_option_3")
            .setLabel("Option 3 (optionnel)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Troisième option (optionnel)")
            .setRequired(false)
            .setMaxLength(100);

        const durationInput = new TextInputBuilder()
            .setCustomId("poll_duration")
            .setLabel("Durée (minutes, optionnel)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: 60 (laisser vide pour illimité)")
            .setRequired(false)
            .setMaxLength(10);

        const firstRow = new ActionRowBuilder().addComponents(questionInput);
        const secondRow = new ActionRowBuilder().addComponents(option1Input);
        const thirdRow = new ActionRowBuilder().addComponents(option2Input);
        const fourthRow = new ActionRowBuilder().addComponents(option3Input);
        const fifthRow = new ActionRowBuilder().addComponents(durationInput);
        
        modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);
        await interaction.showModal(modal);
        return;
    }

    if (value === "list") {
        const polls = pollSystem.getActivePolls(interaction.guild.id);

        if (polls.length === 0) {
            return interaction.reply({
                content: "❌ Aucun sondage actif.",
                flags: MessageFlags.Ephemeral
            });
        }

        const list = polls.map((p, index) => {
            const timeLeft = p.endsAt ? p.endsAt - Date.now() : null;
            const timeText = timeLeft ? `${Math.floor(timeLeft / (1000 * 60 * 60))}h ${Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))}m` : "Illimité";
            return `${index + 1}. **${p.question}** - ${timeText} restantes`;
        }).join("\n");

        const embed = embedBuilder.createInfoEmbed(
            "📊 Sondages actifs",
            list,
            {
                footer: { text: `Total: ${polls.length} sondage(s)` }
            }
        );

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
    }

    if (value === "end") {
        if (!hasManagePerms) {
            return interaction.reply({
                content: "❌ Vous n'avez pas la permission de terminer des sondages.",
                flags: MessageFlags.Ephemeral
            });
        }

        const polls = pollSystem.getActivePolls(interaction.guild.id);
        
        if (polls.length === 0) {
            return interaction.reply({
                content: "❌ Aucun sondage actif à terminer.",
                flags: MessageFlags.Ephemeral
            });
        }

        const options = polls.map(p => ({
            label: p.question.length > 100 ? p.question.substring(0, 97) + "..." : p.question,
            description: `ID: ${p.id}`,
            value: p.id,
            emoji: "📊"
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("poll_end_select")
            .setPlaceholder("🔍 Choisissez un sondage à terminer...")
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = embedBuilder.createWarningEmbed(
            "Terminer un sondage",
            "Sélectionnez le sondage que vous souhaitez terminer."
        );

        await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
        return;
    }
}

// Gérer les sélections de poll (end)
async function handlePollSelect(interaction, client, action) {
    const pollId = interaction.values[0];
    const hasManagePerms = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!hasManagePerms) {
        return interaction.reply({
            content: "❌ Vous n'avez pas la permission de gérer des sondages.",
            flags: MessageFlags.Ephemeral
        });
    }

    if (action === "end") {
        const poll = pollSystem.endPoll(interaction.guild.id, pollId);

        if (!poll) {
            return interaction.reply({
                content: "❌ Sondage introuvable ou déjà terminé.",
                flags: MessageFlags.Ephemeral
            });
        }

        const creator = await client.users.fetch(poll.creatorId).catch(() => null);
        const embed = pollSystem.createPollEmbed(poll, creator);

        try {
            const channel = await interaction.guild.channels.fetch(poll.channelId);
            if (poll.messageId) {
                const message = await channel.messages.fetch(poll.messageId);
                await message.edit({ embeds: [embed], components: [] });
            }
        } catch (error) {
            console.error("Erreur mise à jour message poll:", error);
        }

        const resultEmbed = embedBuilder.createSuccessEmbed(
            "Sondage terminé",
            `Le sondage **${poll.question}** a été terminé manuellement.`
        );

        await interaction.reply({ embeds: [resultEmbed] });
    }
}

// Gérer les modals de création (question + options en une seule fois)
async function handlePollModal(interaction, client) {
    const question = interaction.fields.getTextInputValue("poll_question");
    const durationText = interaction.fields.getTextInputValue("poll_duration");
    const duration = durationText && !isNaN(parseInt(durationText)) ? parseInt(durationText) * 60 * 1000 : null;

    // Récupérer les options
    const options = [];
    for (let i = 1; i <= 3; i++) {
        const option = interaction.fields.getTextInputValue(`poll_option_${i}`);
        if (option && option.trim()) {
            options.push(option.trim());
        }
    }

    if (options.length < 2) {
        return interaction.reply({
            content: "❌ Vous devez fournir au moins 2 options pour le sondage.",
            flags: MessageFlags.Ephemeral
        });
    }

    // Créer le poll
    const poll = pollSystem.createPoll(
        interaction.guild.id,
        interaction.channel.id,
        interaction.user.id,
        question,
        options,
        false, // anonymous
        duration
    );

    const embed = pollSystem.createPollEmbed(poll, interaction.user);
    const buttons = pollSystem.createPollButtons(poll);

    // Générer le graphique et l'ajouter à l'embed
    const chartGenerator = require("../../systems/chartGenerator");
    const { AttachmentBuilder } = require("discord.js");
    let attachment = null;
    
    try {
        const chartBuffer = await chartGenerator.generatePollChart(poll);
        attachment = new AttachmentBuilder(chartBuffer, { name: `poll-chart-${poll.id}.png` });
        embed.setImage(`attachment://poll-chart-${poll.id}.png`);
    } catch (error) {
        console.error("Erreur génération graphique poll:", error);
    }
    
    const message = await interaction.channel.send({
        embeds: [embed],
        components: buttons,
        files: attachment ? [attachment] : []
    });
    
    pollSystem.updatePollMessageId(interaction.guild.id, poll.id, message.id);

    await interaction.reply({
        content: `✅ Sondage créé dans ${interaction.channel} !`,
        flags: MessageFlags.Ephemeral
    });
}

// Gérer le modal des options (plus utilisé, mais gardé pour compatibilité)
async function handlePollOptionsModal(interaction, client) {
    // Cette fonction n'est plus utilisée car on fait tout en un seul modal
    // Mais on la garde pour éviter les erreurs
    return interaction.reply({
        content: "❌ Cette fonctionnalité n'est plus utilisée. Utilisez `/poll` pour créer un sondage.",
        flags: MessageFlags.Ephemeral
    });
}

// Exporter les fonctions pour interactionCreate.js
module.exports.handlePollInteraction = handlePollInteraction;
module.exports.handlePollSelect = handlePollSelect;
module.exports.handlePollModal = handlePollModal;
module.exports.handlePollOptionsModal = handlePollOptionsModal;
