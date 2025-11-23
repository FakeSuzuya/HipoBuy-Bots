const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const moderationSystem = require("../../systems/moderationSystem");
const levelSystem = require("../../systems/levelSystem");
const economySystem = require("../../systems/economySystem");
const badgeSystem = require("../../systems/badgeSystem");
const notificationSystem = require("../../systems/notificationSystem");

module.exports = {
    category: "Context",
    data: new ContextMenuCommandBuilder()
        .setName("Info Utilisateur")
        .setType(ApplicationCommandType.User),

    async execute(interaction, client) {
        const target = interaction.targetUser;
        const member = interaction.targetMember;

        if (!member) {
            return interaction.reply({
                content: "❌ Cet utilisateur n'est pas sur le serveur.",
                flags: MessageFlags.Ephemeral
            });
        }

        const levelStats = levelSystem.getUserStats(interaction.guild.id, target.id);
        const economyStats = economySystem.getStats(interaction.guild.id, target.id);
        const badges = badgeSystem.getUserBadges(interaction.guild.id, target.id);
        const moderationHistory = moderationSystem.getHistory(interaction.guild.id, target.id);

        const embed = new EmbedBuilder()
            .setTitle(`📊 Informations sur ${target.tag}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
            .setColor(0x5865F2)
            .addFields(
                {
                    name: "👤 Utilisateur",
                    value: `${target} (${target.id})`,
                    inline: true
                },
                {
                    name: "📅 Compte créé",
                    value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`,
                    inline: true
                },
                {
                    name: "📥 A rejoint",
                    value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Inconnu",
                    inline: true
                },
                {
                    name: "📊 Niveau",
                    value: `Niveau **${levelStats.level}** (${levelStats.totalXP} XP)`,
                    inline: true
                },
                {
                    name: "💰 Économie",
                    value: `**${economyStats.balance}** 💰 (Banque: ${economyStats.bank} 💰)`,
                    inline: true
                },
                {
                    name: "🏅 Badges",
                    value: badges.length > 0 ? `${badges.length} badge(s)` : "Aucun badge",
                    inline: true
                },
                {
                    name: "🛡️ Modération",
                    value: `**${moderationHistory.warns.length}** avertissement(s)\n**${moderationHistory.mutes.length}** mute(s)\n**${moderationHistory.bans.length}** ban(s)`,
                    inline: false
                }
            )
            .setFooter({ text: `ID: ${target.id}` })
            .setTimestamp();

        if (badges.length > 0) {
            const badgesList = badges.slice(0, 10).map(b => `${b.emoji} ${b.name}`).join(", ");
            embed.addFields({
                name: "🏅 Badges obtenus",
                value: badgesList + (badges.length > 10 ? ` +${badges.length - 10} autres` : ""),
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};

