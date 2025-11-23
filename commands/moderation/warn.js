const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags} = require("discord.js");
const moderationSystem = require("../../systems/moderationSystem");
const analyticsSystem = require("../../systems/analyticsSystem");

module.exports = {
    category: "Modération",
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("⚠️ Avertit un utilisateur")
        .addUserOption(option =>
            option.setName("utilisateur")
                .setDescription("Utilisateur à avertir")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("raison")
                .setDescription("Raison de l'avertissement")
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
        const reason = interaction.options.getString("raison") || "Aucune raison spécifiée";

        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Vous ne pouvez pas vous avertir vous-même.",
                flags: MessageFlags.Ephemeral
            });
        }

        const result = moderationSystem.addWarn(
            interaction.guild.id,
            target.id,
            interaction.user.id,
            reason
        );

        const embed = moderationSystem.createWarnEmbed(
            target,
            interaction.user,
            reason,
            result.warnCount
        );

        // Envoyer dans les logs
        const logChannel = interaction.guild.channels.cache.get(client.config.logsMessage);
        if (logChannel) {
            await logChannel.send({ embeds: [embed] }).catch(() => {});
        }

        // Envoyer une notification en MP
        const notificationSystem = require("../../systems/notificationSystem");
        await notificationSystem.notifyWarn(target, {
            moderatorId: interaction.user.id,
            reason: reason,
            totalWarns: result.warnCount,
            guildName: interaction.guild.name
        }, interaction.user).catch(() => {});

        analyticsSystem.trackEvent(interaction.guild.id, "moderation", {
            type: "warn",
            userId: target.id,
            moderatorId: interaction.user.id
        });

        await interaction.reply({
            content: `✅ **${target.tag}** a été averti. (Total: ${result.warnCount} avertissement(s))`,
            flags: MessageFlags.Ephemeral
        });
    }
};

