const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, PermissionFlagsBits, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const moderationSystem = require("../../systems/moderationSystem");
const notificationSystem = require("../../systems/notificationSystem");

module.exports = {
    category: "Context",
    data: new ContextMenuCommandBuilder()
        .setName("Bannir")
        .setType(ApplicationCommandType.User),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
                flags: MessageFlags.Ephemeral
            });
        }

        const target = interaction.targetUser;
        const member = interaction.targetMember;

        if (!member) {
            return interaction.reply({
                content: "❌ Cet utilisateur n'est pas sur le serveur.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Vous ne pouvez pas vous bannir vous-même.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: "❌ Vous ne pouvez pas bannir cet utilisateur (rôle trop élevé).",
                flags: MessageFlags.Ephemeral
            });
        }

        // Créer un modal pour la raison
        const modal = new ModalBuilder()
            .setCustomId(`context_ban_${target.id}_${Date.now()}`)
            .setTitle("Bannir un utilisateur");

        const reasonInput = new TextInputBuilder()
            .setCustomId("ban_reason")
            .setLabel("Raison du bannissement")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Décrivez la raison du bannissement...")
            .setRequired(true)
            .setMaxLength(500)
            .setMinLength(5);

        const row = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
};

