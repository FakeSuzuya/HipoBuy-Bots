const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const levelSystem = require("../../systems/levelSystem");
const imageGenerator = require("../../systems/imageGenerator");
const embedBuilder = require("../../systems/embedBuilder");

module.exports = {
    category: "Niveaux",
    data: new SlashCommandBuilder()
        .setName("level")
        .setDescription("📊 Affiche votre niveau et votre XP")
        .addUserOption(option =>
            option.setName("utilisateur")
                .setDescription("Utilisateur dont vous voulez voir le niveau")
        )
        .addBooleanOption(option =>
            option.setName("image")
                .setDescription("Afficher sous forme d'image (défaut: true)")
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        
        const target = interaction.options.getUser("utilisateur") || interaction.user;
        const useImage = interaction.options.getBoolean("image") !== false;
        const stats = levelSystem.getUserStats(interaction.guild.id, target.id);
        
        // Obtenir le rang
        const leaderboard = levelSystem.getLeaderboard(interaction.guild.id, 100);
        const rank = leaderboard.findIndex(u => u.userId === target.id) + 1;
        
        if (useImage) {
            try {
                // Générer l'image
                const imageBuffer = await imageGenerator.generateLevelCard(target, stats, rank || null);
                const attachment = new AttachmentBuilder(imageBuffer, { name: "level.png" });
                
                const embed = embedBuilder.createLevelEmbed(
                    target,
                    { level: stats.level, totalXP: stats.totalXP || 0, currentXP: stats.xp || 0, xpNeeded: stats.xpNeeded || 100 },
                    { rank: rank || null }
                )
                .setImage("attachment://level.png");
                
                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (error) {
                console.error("Erreur génération image level:", error);
                // Fallback sur l'embed classique
                const progress = Math.round((stats.xp / stats.xpNeeded) * 100);
                const progressBar = "█".repeat(Math.floor(progress / 10)) + "░".repeat(10 - Math.floor(progress / 10));
                
                const embed = embedBuilder.createLevelEmbed(
                    target,
                    { level: stats.level, totalXP: stats.totalXP || 0, currentXP: stats.xp || 0, xpNeeded: stats.xpNeeded || 100 },
                    { rank: rank || null }
                )
                .addFields({ name: "💬 Messages", value: `${stats.messages || 0}`, inline: true });
                
                await interaction.editReply({ embeds: [embed] });
            }
        } else {
            const progress = Math.round((stats.xp / stats.xpNeeded) * 100);
            const progressBar = "█".repeat(Math.floor(progress / 10)) + "░".repeat(10 - Math.floor(progress / 10));
            
            const embed = embedBuilder.createLevelEmbed(
                target,
                { level: stats.level, totalXP: stats.totalXP || 0, currentXP: stats.xp || 0, xpNeeded: stats.xpNeeded || 100 },
                { rank: rank || null }
            )
            .addFields({ name: "💬 Messages", value: `${stats.messages || 0}`, inline: true });
            
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
