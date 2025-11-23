const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const economySystem = require("../../systems/economySystem");
const imageGenerator = require("../../systems/imageGenerator");
const embedBuilder = require("../../systems/embedBuilder");

module.exports = {
    category: "Économie",
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("💰 Affiche votre solde")
        .addUserOption(option =>
            option.setName("utilisateur")
                .setDescription("Utilisateur dont vous voulez voir le solde")
        )
        .addBooleanOption(option =>
            option.setName("image")
                .setDescription("Afficher sous forme d'image (défaut: true)")
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        
        const target = interaction.options.getUser("utilisateur") || interaction.user;
        const useImage = interaction.options.getBoolean("image") !== false;
        const stats = economySystem.getStats(interaction.guild.id, target.id);
        
        // Obtenir le rang
        const leaderboard = economySystem.getLeaderboard(interaction.guild.id, 100);
        const rank = leaderboard.findIndex(u => u.userId === target.id) + 1;
        
        if (useImage) {
            try {
                // Générer l'image
                const imageBuffer = await imageGenerator.generateEconomyCard(target, stats, rank || null);
                const attachment = new AttachmentBuilder(imageBuffer, { name: "balance.png" });
                
                const embed = embedBuilder.createEconomyEmbed(
                    target,
                    stats,
                    { rank: rank || null }
                )
                .setImage("attachment://balance.png")
                .setFooter({ text: "Utilisez /daily pour réclamer votre récompense quotidienne !" });
                
                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (error) {
                console.error("Erreur génération image balance:", error);
                // Fallback sur l'embed classique
                const embed = embedBuilder.createEconomyEmbed(
                    target,
                    stats,
                    { rank: rank || null }
                )
                .addFields({
                    name: "📊 Statistiques",
                    value: [
                        `**Gagné:** ${stats.totalEarned || 0} 💰`,
                        `**Dépensé:** ${stats.totalSpent || 0} 💰`,
                        `**Streak quotidien:** ${stats.dailyStreak || 0} jour(s)`
                    ].join("\n"),
                    inline: false
                })
                .setFooter({ text: "Utilisez /daily pour réclamer votre récompense quotidienne !" });
                
                await interaction.editReply({ embeds: [embed] });
            }
        } else {
            const embed = embedBuilder.createEconomyEmbed(
                target,
                stats,
                { rank: rank || null }
            )
            .addFields({
                name: "📊 Statistiques",
                value: [
                    `**Gagné:** ${stats.totalEarned || 0} 💰`,
                    `**Dépensé:** ${stats.totalSpent || 0} 💰`,
                    `**Streak quotidien:** ${stats.dailyStreak || 0} jour(s)`
                ].join("\n"),
                inline: false
            })
            .setFooter({ text: "Utilisez /daily pour réclamer votre récompense quotidienne !" });
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};

