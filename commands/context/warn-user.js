const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, PermissionFlagsBits, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const moderationSystem = require("../../systems/moderationSystem");
const notificationSystem = require("../../systems/notificationSystem");

module.exports = {
    category: "Context",
    data: new ContextMenuCommandBuilder()
        .setName("Avertir")
        .setType(ApplicationCommandType.User),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
                flags: MessageFlags.Ephemeral
            });
        }

        const target = interaction.targetUser;

        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Vous ne pouvez pas vous avertir vous-même.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Créer un modal pour la raison
        const modal = new ModalBuilder()
            .setCustomId(`context_warn_${target.id}_${Date.now()}`)
            .setTitle("Avertir un utilisateur");

        const reasonInput = new TextInputBuilder()
            .setCustomId("warn_reason")
            .setLabel("Raison de l'avertissement")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Décrivez la raison de l'avertissement...")
            .setRequired(true)
            .setMaxLength(500)
            .setMinLength(5);

        const row = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
};

