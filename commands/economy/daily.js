const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const economySystem = require("../../systems/economySystem");
const embedBuilder = require("../../systems/embedBuilder");

module.exports = {
    category: "Économie",
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("🎁 Réclame votre récompense quotidienne"),

    async execute(interaction, client) {
        const result = economySystem.claimDaily(interaction.guild.id, interaction.user.id);
        
        if (!result.success) {
            const hours = Math.floor(result.timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((result.timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            const embed = embedBuilder.createWarningEmbed(
                "Déjà réclamé",
                `Vous avez déjà réclamé votre récompense quotidienne aujourd'hui.\n\n⏱️ Prochaine récompense dans **${hours}h ${minutes}m**`
            );

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        const embed = embedBuilder.createSuccessEmbed(
            "Récompense quotidienne réclamée !",
            `Vous avez reçu **${result.reward} 💰** !`,
            {
                thumbnail: interaction.user.displayAvatarURL({ dynamic: true, size: 256 }),
                fields: [
                    { 
                        name: "🔥 Streak", 
                        value: `**${result.streak}** jour(s) consécutif(s)`, 
                        inline: true 
                    },
                    { 
                        name: "💰 Récompense", 
                        value: `**${result.reward}** 💰`, 
                        inline: true 
                    },
                    {
                        name: "💡 Astuce",
                        value: "Plus votre streak est élevé, plus vous gagnez !",
                        inline: false
                    }
                ],
                footer: { 
                    text: "Revenez demain pour continuer votre streak !",
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                }
            }
        );

        await interaction.reply({ embeds: [embed] });
    }
};

