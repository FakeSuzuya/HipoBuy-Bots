const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, PermissionFlagsBits, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const notificationSystem = require("../../systems/notificationSystem");

module.exports = {
    category: "Context",
    data: new ContextMenuCommandBuilder()
        .setName("Expulser")
        .setType(ApplicationCommandType.User),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
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
                content: "❌ Vous ne pouvez pas vous expulser vous-même.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: "❌ Vous ne pouvez pas expulser cet utilisateur (rôle trop élevé).",
                flags: MessageFlags.Ephemeral
            });
        }

        // Créer un modal pour la raison
        const modal = new ModalBuilder()
            .setCustomId(`context_kick_${target.id}_${Date.now()}`)
            .setTitle("Expulser un utilisateur");

        const reasonInput = new TextInputBuilder()
            .setCustomId("kick_reason")
            .setLabel("Raison de l'expulsion")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Décrivez la raison de l'expulsion...")
            .setRequired(true)
            .setMaxLength(500)
            .setMinLength(5);

        const row = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
};

