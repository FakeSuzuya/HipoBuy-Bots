const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags} = require("discord.js");
const suggestionSystem = require("../../systems/suggestionSystem");

module.exports = {
    category: "Suggestions",
    data: new SlashCommandBuilder()
        .setName("suggest")
        .setDescription("💡 Gère les suggestions")
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription("Crée une suggestion")
                .addStringOption(option =>
                    option.setName("idee")
                        .setDescription("Votre idée")
                        .setRequired(true)
                        .setMaxLength(1000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("approve")
                .setDescription("Approuve une suggestion")
                .addStringOption(option =>
                    option.setName("id")
                        .setDescription("ID de la suggestion")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("deny")
                .setDescription("Refuse une suggestion")
                .addStringOption(option =>
                    option.setName("id")
                        .setDescription("ID de la suggestion")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("raison")
                        .setDescription("Raison du refus")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("stats")
                .setDescription("Affiche les statistiques des suggestions")
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "create") {
            const idea = interaction.options.getString("idee");
            const suggestion = suggestionSystem.createSuggestion(
                interaction.guild.id,
                interaction.user.id,
                idea
            );

            const embed = suggestionSystem.createSuggestionEmbed(suggestion, interaction.user);
            
            const upvoteButton = new ButtonBuilder()
                .setCustomId(`suggest_upvote_${suggestion.id}`)
                .setLabel("👍")
                .setStyle(ButtonStyle.Success);
            
            const downvoteButton = new ButtonBuilder()
                .setCustomId(`suggest_downvote_${suggestion.id}`)
                .setLabel("👎")
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(upvoteButton, downvoteButton);

            const channel = interaction.guild.channels.cache.get(client.config.logsMessage) || interaction.channel;
            const message = await channel.send({
                embeds: [embed],
                components: [row]
            });

            // Mettre à jour le messageId
            const fs = require("fs");
            const path = require("path");
            const dataPath = path.join(__dirname, "../../data/suggestions.json");
            const allData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
            const guildSuggestions = allData[interaction.guild.id] || [];
            const suggestionIndex = guildSuggestions.findIndex(s => s.id === suggestion.id);
            if (suggestionIndex !== -1) {
                guildSuggestions[suggestionIndex].messageId = message.id;
                allData[interaction.guild.id] = guildSuggestions;
                fs.writeFileSync(dataPath, JSON.stringify(allData, null, 2), "utf-8");
            }

            await interaction.reply({
                content: `✅ Suggestion créée dans ${channel}`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (subcommand === "approve") {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: "❌ Vous devez avoir la permission de gérer les messages.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const suggestionId = interaction.options.getString("id");
            const suggestion = suggestionSystem.approveSuggestion(
                interaction.guild.id,
                suggestionId,
                interaction.user.id
            );

            if (!suggestion) {
                return interaction.reply({
                    content: "❌ Suggestion introuvable.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Mettre à jour le message
            try {
                const channel = await interaction.guild.channels.fetch(suggestion.channelId || client.config.logsMessage);
                if (suggestion.messageId) {
                    const message = await channel.messages.fetch(suggestion.messageId);
                    const user = await interaction.client.users.fetch(suggestion.userId).catch(() => null);
                    const embed = suggestionSystem.createSuggestionEmbed(suggestion, user);
                    await message.edit({ embeds: [embed] });
                }
            } catch (error) {
                console.error("Erreur mise à jour suggestion:", error);
            }

            // Envoyer une notification en MP
            const notificationSystem = require("../../systems/notificationSystem");
            const suggestionUser = await interaction.client.users.fetch(suggestion.userId).catch(() => null);
            if (suggestionUser) {
                await notificationSystem.notifySuggestionApproved(suggestionUser, suggestion).catch(() => {});
            }

            await interaction.reply({
                content: "✅ Suggestion approuvée.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (subcommand === "deny") {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: "❌ Vous devez avoir la permission de gérer les messages.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const suggestionId = interaction.options.getString("id");
            const reason = interaction.options.getString("raison");
            const suggestion = suggestionSystem.denySuggestion(
                interaction.guild.id,
                suggestionId,
                interaction.user.id,
                reason
            );

            if (!suggestion) {
                return interaction.reply({
                    content: "❌ Suggestion introuvable.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Mettre à jour le message
            try {
                const channel = await interaction.guild.channels.fetch(suggestion.channelId || client.config.logsMessage);
                if (suggestion.messageId) {
                    const message = await channel.messages.fetch(suggestion.messageId);
                    const user = await interaction.client.users.fetch(suggestion.userId).catch(() => null);
                    const embed = suggestionSystem.createSuggestionEmbed(suggestion, user);
                    await message.edit({ embeds: [embed] });
                }
            } catch (error) {
                console.error("Erreur mise à jour suggestion:", error);
            }

            // Envoyer une notification en MP
            const notificationSystem = require("../../systems/notificationSystem");
            const suggestionUser = await interaction.client.users.fetch(suggestion.userId).catch(() => null);
            if (suggestionUser) {
                await notificationSystem.notifySuggestionDenied(suggestionUser, suggestion).catch(() => {});
            }

            await interaction.reply({
                content: "❌ Suggestion refusée.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (subcommand === "stats") {
            const stats = suggestionSystem.getStats(interaction.guild.id);

            const embed = new EmbedBuilder()
                .setTitle("📊 Statistiques des Suggestions")
                .addFields(
                    { name: "📝 Total", value: `${stats.total}`, inline: true },
                    { name: "⏳ En attente", value: `${stats.pending}`, inline: true },
                    { name: "✅ Approuvées", value: `${stats.approved}`, inline: true },
                    { name: "❌ Refusées", value: `${stats.denied}`, inline: true }
                )
                .setColor(0x5865F2)
                .setTimestamp();

            if (stats.topSuggestion) {
                embed.addFields({
                    name: "🏆 Suggestion la plus votée",
                    value: `${stats.topSuggestion.content.substring(0, 100)}...\n👍 ${stats.topSuggestion.upvotes.length} | 👎 ${stats.topSuggestion.downvotes.length}`,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};

