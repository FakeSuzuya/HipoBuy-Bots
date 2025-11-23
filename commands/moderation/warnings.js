const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const moderationSystem = require("../../systems/moderationSystem");

module.exports = {
    category: "Modération",
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription("📋 Affiche les avertissements d'un utilisateur")
        .addUserOption(option =>
            option.setName("utilisateur")
                .setDescription("Utilisateur dont vous voulez voir les avertissements")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const target = interaction.options.getUser("utilisateur");
        const warns = moderationSystem.getWarns(interaction.guild.id, target.id);

        if (warns.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("📋 Avertissements")
                .setDescription(`**${target.tag}** n'a aucun avertissement.`)
                .setColor(0x00FF00)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        const warnsList = warns.map((warn, index) => {
            const date = new Date(warn.timestamp).toLocaleString('fr-FR');
            return `**${index + 1}.** ${warn.reason}\n└─ Par <@${warn.moderatorId}> le ${date}`;
        }).join("\n\n");

        const embed = new EmbedBuilder()
            .setTitle(`📋 Avertissements de ${target.username}`)
            .setDescription(warnsList)
            .addFields({ name: "📊 Total", value: `${warns.length} avertissement(s)`, inline: true })
            .setColor(0xFFA500)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `ID: ${target.id}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

