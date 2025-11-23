const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const levelSystem = require("../../systems/levelSystem");
const { createPaginatedEmbed } = require("../../systems/paginationSystem");

module.exports = {
    category: "Niveaux",
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("🏆 Affiche le classement des niveaux")
        .addIntegerOption(option =>
            option.setName("limite")
                .setDescription("Nombre d'utilisateurs à afficher (max 100)")
                .setMinValue(5)
                .setMaxValue(100)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        
        const limit = interaction.options.getInteger("limite") || 50;
        const leaderboard = levelSystem.getLeaderboard(interaction.guild.id, limit);
        
        if (leaderboard.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("🏆 Classement")
                .setDescription("Aucun utilisateur n'a encore gagné d'XP.")
                .setColor(0xFFA500)
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        }

        // Formater les éléments pour la pagination
        const formattedItems = await Promise.all(
            leaderboard.map(async (user, index) => {
                try {
                    const member = await interaction.guild.members.fetch(user.userId).catch(() => null);
                    const username = member ? member.user.tag : `Utilisateur ${user.userId}`;
                    return {
                        user,
                        username,
                        index
                    };
                } catch {
                    return {
                        user,
                        username: `Utilisateur ${user.userId}`,
                        index
                    };
                }
            })
        );

        const formatItem = (item, globalIndex) => {
            const medal = globalIndex === 0 ? "🥇" : globalIndex === 1 ? "🥈" : globalIndex === 2 ? "🥉" : "▫️";
            return `${medal} **${globalIndex + 1}.** ${item.username} - Niveau ${item.user.level} (${item.user.totalXP} XP)`;
        };

        const pagination = createPaginatedEmbed({
            items: formattedItems,
            formatItem,
            title: "🏆 Classement des Niveaux",
            description: "",
            itemsPerPage: 10,
            color: 0xFFD700,
            footer: {
                text: `Utilisez /level pour voir votre niveau`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            },
            thumbnail: interaction.guild.iconURL({ dynamic: true }),
            image: interaction.guild.bannerURL({ size: 1024 }) || null
        });

        // Stocker les données de pagination pour les interactions
        if (!client.paginationData) {
            client.paginationData = {};
        }
        
        const message = await interaction.editReply({
            embeds: [pagination.embed],
            components: pagination.components
        });

        // Stocker les données pour les interactions futures
        client.paginationData[message.id] = {
            items: formattedItems,
            formatItem,
            title: "🏆 Classement des Niveaux",
            description: "",
            itemsPerPage: 10,
            color: 0xFFD700,
            footer: {
                text: `Utilisez /level pour voir votre niveau`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            },
            thumbnail: interaction.guild.iconURL({ dynamic: true }),
            image: interaction.guild.bannerURL({ size: 1024 }) || null,
            currentPage: 0
        };
    }
};

