const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags} = require("discord.js");
const moderationSystem = require("../../systems/moderationSystem");
const analyticsSystem = require("../../systems/analyticsSystem");

module.exports = {
    category: "Modération",
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("🔇 Mute un utilisateur temporairement")
        .addUserOption(option =>
            option.setName("utilisateur")
                .setDescription("Utilisateur à mute")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("duree")
                .setDescription("Durée en minutes")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)
        )
        .addStringOption(option =>
            option.setName("raison")
                .setDescription("Raison du mute")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                content: "❌ Vous n'avez pas la permission d'utiliser cette commande.",
                flags: MessageFlags.Ephemeral
            });
        }

        const target = interaction.options.getUser("utilisateur");
        const duration = interaction.options.getInteger("duree") * 60 * 1000; // Convertir en ms
        const reason = interaction.options.getString("raison") || "Aucune raison spécifiée";

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) {
            return interaction.reply({
                content: "❌ Utilisateur introuvable sur ce serveur.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Vous ne pouvez pas vous mute vous-même.",
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await member.timeout(duration, reason);
            
            moderationSystem.addMute(
                interaction.guild.id,
                target.id,
                interaction.user.id,
                duration,
                reason
            );

            const embed = moderationSystem.createMuteEmbed(
                target,
                interaction.user,
                duration,
                reason
            );

            // Envoyer dans les logs
            const logChannel = interaction.guild.channels.cache.get(client.config.logsMessage);
            if (logChannel) {
                await logChannel.send({ embeds: [embed] }).catch(() => {});
            }

            // Envoyer une notification en MP
            const notificationSystem = require("../../systems/notificationSystem");
            await notificationSystem.notifyMute(target, {
                moderatorId: interaction.user.id,
                duration: duration,
                reason: reason
            }, interaction.user).catch(() => {});

            analyticsSystem.trackEvent(interaction.guild.id, "moderation", {
                type: "mute",
                userId: target.id,
                moderatorId: interaction.user.id,
                duration
            });

            await interaction.reply({
                content: `✅ **${target.tag}** a été muté pour ${moderationSystem.formatDuration(duration)}.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error("Erreur mute:", error);
            await interaction.reply({
                content: "❌ Une erreur s'est produite lors du mute. Vérifiez que le bot a les permissions nécessaires.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

