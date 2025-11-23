const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder, MessageFlags} = require("discord.js");
const analyticsSystem = require("../../systems/analyticsSystem");
const imageGenerator = require("../../systems/imageGenerator");
const embedBuilder = require("../../systems/embedBuilder");

module.exports = {
    category: "Analytics",
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("📊 Affiche les statistiques du serveur")
        .addIntegerOption(option =>
            option.setName("jours")
                .setDescription("Nombre de jours à analyser (max 30)")
                .setMinValue(1)
                .setMaxValue(30)
        )
        .addBooleanOption(option =>
            option.setName("image")
                .setDescription("Afficher sous forme d'image (défaut: true)")
        )
        .addStringOption(option =>
            option.setName("graphique")
                .setDescription("Type de graphique à afficher")
                .addChoices(
                    { name: "Barres", value: "bar" },
                    { name: "Ligne", value: "line" },
                    { name: "Circulaire", value: "pie" }
                )
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "❌ Vous devez être administrateur pour utiliser cette commande.",
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const days = interaction.options.getInteger("jours") || 7;
        const useImage = interaction.options.getBoolean("image") !== false;
        const graphType = interaction.options.getString("graphique") || "bar";
        const stats = analyticsSystem.getStats(interaction.guild.id, days);
        
        const totalMessages = stats.total.messages || 0;
        const totalCommands = stats.total.commands || 0;
        const totalTickets = stats.total.tickets || 0;
        const totalModeration = stats.total.moderation || 0;
        
        const avgMessages = stats.daily.reduce((sum, day) => sum + day.messages, 0) / days;
        const avgCommands = stats.daily.reduce((sum, day) => sum + day.commands, 0) / days;

        if (useImage) {
            try {
                // Générer l'image
                const imageBuffer = await imageGenerator.generateServerStatsCard(interaction.guild, stats, days, graphType);
                const attachment = new AttachmentBuilder(imageBuffer, { name: "stats.png" });
                
                const embed = embedBuilder.createStatsEmbed(
                    interaction.guild,
                    {
                        messages: totalMessages,
                        commands: totalCommands,
                        tickets: totalTickets,
                        moderation: totalModeration,
                        joins: stats.total.joins || 0,
                        leaves: stats.total.leaves || 0
                    }
                )
                .setDescription(`Statistiques sur les **${days} derniers jours**`)
                .setImage("attachment://stats.png")
                .setFooter({ text: `Période: ${days} jour(s)` });
                
                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (error) {
                console.error("Erreur génération image stats:", error);
                // Fallback sur l'embed classique
                const embed = embedBuilder.createStatsEmbed(
                    interaction.guild,
                    {
                        messages: totalMessages,
                        commands: totalCommands,
                        tickets: totalTickets,
                        moderation: totalModeration,
                        joins: stats.total.joins || 0,
                        leaves: stats.total.leaves || 0
                    }
                )
                .setDescription(`Statistiques sur les **${days} derniers jours**`)
                .addFields({
                    name: "📊 Moyennes quotidiennes",
                    value: [
                        `**Messages/jour:** ${Math.round(avgMessages)}`,
                        `**Commandes/jour:** ${Math.round(avgCommands)}`
                    ].join("\n"),
                    inline: true
                })
                .setFooter({ text: `Période: ${days} jour(s)` });
                
                await interaction.editReply({ embeds: [embed] });
            }
        } else {
            const embed = embedBuilder.createStatsEmbed(
                interaction.guild,
                {
                    messages: totalMessages,
                    commands: totalCommands,
                    tickets: totalTickets,
                    moderation: totalModeration,
                    joins: stats.total.joins || 0,
                    leaves: stats.total.leaves || 0
                }
            )
            .setDescription(`Statistiques sur les **${days} derniers jours**`)
            .addFields({
                name: "📊 Moyennes quotidiennes",
                value: [
                    `**Messages/jour:** ${Math.round(avgMessages)}`,
                    `**Commandes/jour:** ${Math.round(avgCommands)}`
                ].join("\n"),
                inline: true
            })
            .setFooter({ text: `Période: ${days} jour(s)` });

            await interaction.editReply({ embeds: [embed] });
        }
    }
};

