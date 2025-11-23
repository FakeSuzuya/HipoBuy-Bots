const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags} = require("discord.js");
const advancedStatsSystem = require("../../systems/advancedStatsSystem");

module.exports = {
    category: "Analytics",
    data: new SlashCommandBuilder()
        .setName("stats-advanced")
        .setDescription("📊 Statistiques avancées")
        .addSubcommand(subcommand =>
            subcommand
                .setName("top")
                .setDescription("Top utilisateurs")
                .addStringOption(option =>
                    option.setName("categorie")
                        .setDescription("Catégorie")
                        .setRequired(true)
                        .addChoices(
                            { name: "Messages", value: "messages" },
                            { name: "Commandes", value: "commands" },
                            { name: "Niveaux", value: "levels" },
                            { name: "Économie", value: "economy" }
                        )
                )
                .addIntegerOption(option =>
                    option.setName("limite")
                        .setDescription("Nombre d'utilisateurs (max 20)")
                        .setMinValue(5)
                        .setMaxValue(20)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("trends")
                .setDescription("Affiche les tendances")
                .addIntegerOption(option =>
                    option.setName("jours")
                        .setDescription("Nombre de jours (max 30)")
                        .setMinValue(1)
                        .setMaxValue(30)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("report")
                .setDescription("Génère un rapport détaillé")
                .addIntegerOption(option =>
                    option.setName("jours")
                        .setDescription("Nombre de jours (max 30)")
                        .setMinValue(1)
                        .setMaxValue(30)
                )
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "❌ Vous devez être administrateur pour utiliser cette commande.",
                flags: MessageFlags.Ephemeral
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "top") {
            const category = interaction.options.getString("categorie");
            const limit = interaction.options.getInteger("limite") || 10;
            
            const topUsers = await Promise.all(
                advancedStatsSystem.getTopUsers(interaction.guild.id, category, limit).map(async (user, index) => {
                    try {
                        const member = await interaction.guild.members.fetch(user.userId || user.id).catch(() => null);
                        const username = member ? member.user.tag : `Utilisateur ${user.userId || user.id}`;
                        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "▫️";
                        
                        let value;
                        if (category === "messages" || category === "commands") {
                            value = `${user.count}`;
                        } else if (category === "levels") {
                            value = `Niveau ${user.level} (${user.totalXP} XP)`;
                        } else if (category === "economy") {
                            value = `${user.total} 💰`;
                        }
                        
                        return `${medal} **${index + 1}.** ${username} - ${value}`;
                    } catch {
                        return `${index + 1}. Utilisateur ${user.userId || user.id}`;
                    }
                })
            );

            const embed = new EmbedBuilder()
                .setTitle(`🏆 Top ${category}`)
                .setDescription(topUsers.join("\n"))
                .setColor(0xFFD700)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Top ${limit} utilisateurs` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "trends") {
            const days = interaction.options.getInteger("jours") || 7;
            const trends = advancedStatsSystem.getTrends(interaction.guild.id, days);

            const trendEmoji = {
                up: "📈",
                down: "📉",
                stable: "➡️"
            };

            const embed = new EmbedBuilder()
                .setTitle("📊 Tendances")
                .setDescription(`Tendances sur les **${days} derniers jours**`)
                .addFields(
                    {
                        name: "💬 Messages",
                        value: `${trendEmoji[trends.messages.trend]} ${trends.messages.percentage > 0 ? '+' : ''}${trends.messages.percentage}%`,
                        inline: true
                    },
                    {
                        name: "⚡ Commandes",
                        value: `${trendEmoji[trends.commands.trend]} ${trends.commands.percentage > 0 ? '+' : ''}${trends.commands.percentage}%`,
                        inline: true
                    },
                    {
                        name: "🎫 Tickets",
                        value: `${trendEmoji[trends.tickets.trend]} ${trends.tickets.percentage > 0 ? '+' : ''}${trends.tickets.percentage}%`,
                        inline: true
                    },
                    {
                        name: "🛡️ Modération",
                        value: `${trendEmoji[trends.moderation.trend]} ${trends.moderation.percentage > 0 ? '+' : ''}${trends.moderation.percentage}%`,
                        inline: true
                    }
                )
                .setColor(0x5865F2)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "report") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const days = interaction.options.getInteger("jours") || 7;
            const report = advancedStatsSystem.generateDetailedReport(interaction.guild.id, days);

            const embed = new EmbedBuilder()
                .setTitle("📊 Rapport Détaillé")
                .setDescription(`Rapport sur les **${days} derniers jours**`)
                .addFields(
                    {
                        name: "📈 Totaux",
                        value: [
                            `**Messages:** ${report.totals.messages.toLocaleString()}`,
                            `**Commandes:** ${report.totals.commands.toLocaleString()}`,
                            `**Tickets:** ${report.totals.tickets}`,
                            `**Modération:** ${report.totals.moderation}`
                        ].join("\n"),
                        inline: true
                    },
                    {
                        name: "📊 Moyennes",
                        value: [
                            `**Messages/jour:** ${Math.round(report.averages.messages)}`,
                            `**Commandes/jour:** ${Math.round(report.averages.commands)}`
                        ].join("\n"),
                        inline: true
                    }
                )
                .setColor(0x5865F2)
                .setTimestamp();

            // Top utilisateurs
            if (report.topUsers.messages.length > 0) {
                const topMessages = report.topUsers.messages.slice(0, 3).map((u, i) => {
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
                    return `${medal} <@${u.userId}> - ${u.count}`;
                }).join("\n");

                embed.addFields({
                    name: "🏆 Top Messages",
                    value: topMessages,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });
        }
    }
};

