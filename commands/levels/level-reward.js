const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags} = require("discord.js");
const levelRewardSystem = require("../../systems/levelRewardSystem");

module.exports = {
    category: "Niveaux",
    data: new SlashCommandBuilder()
        .setName("level-reward")
        .setDescription("🎁 Gère les récompenses de niveau")
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Ajoute une récompense pour un niveau")
                .addIntegerOption(option =>
                    option.setName("niveau")
                        .setDescription("Niveau requis")
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addStringOption(option =>
                    option.setName("type")
                        .setDescription("Type de récompense")
                        .setRequired(true)
                        .addChoices(
                            { name: "Rôle", value: "role" },
                            { name: "Argent", value: "money" },
                            { name: "Item", value: "item" }
                        )
                )
                .addStringOption(option =>
                    option.setName("valeur")
                        .setDescription("ID du rôle, montant d'argent, ou nom de l'item")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Supprime une récompense")
                .addIntegerOption(option =>
                    option.setName("niveau")
                        .setDescription("Niveau de la récompense à supprimer")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("Liste toutes les récompenses")
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "❌ Vous devez être administrateur pour utiliser cette commande.",
                flags: MessageFlags.Ephemeral
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "add") {
            const level = interaction.options.getInteger("niveau");
            const type = interaction.options.getString("type");
            const value = interaction.options.getString("valeur");

            // Vérifier le type
            if (type === "role") {
                const role = interaction.guild.roles.cache.get(value);
                if (!role) {
                    return interaction.reply({
                        content: "❌ Rôle introuvable.",
                        flags: MessageFlags.Ephemeral
                    });
                }
            } else if (type === "money") {
                if (isNaN(value) || parseInt(value) <= 0) {
                    return interaction.reply({
                        content: "❌ Montant invalide.",
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            const reward = levelRewardSystem.addReward(interaction.guild.id, level, type, value);

            const embed = new EmbedBuilder()
                .setTitle("✅ Récompense ajoutée")
                .setDescription(`Récompense configurée pour le niveau **${level}**`)
                .addFields(
                    { name: "Type", value: type, inline: true },
                    { name: "Valeur", value: value, inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "remove") {
            const level = interaction.options.getInteger("niveau");
            const success = levelRewardSystem.removeReward(interaction.guild.id, level);

            if (!success) {
                return interaction.reply({
                    content: "❌ Aucune récompense trouvée pour ce niveau.",
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.reply({
                content: `✅ Récompense du niveau ${level} supprimée.`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (subcommand === "list") {
            const rewards = levelRewardSystem.getRewards(interaction.guild.id);

            if (rewards.length === 0) {
                return interaction.reply({
                    content: "❌ Aucune récompense configurée.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const rewardsList = rewards.map(r => {
                let valueText = r.value;
                if (r.type === "role") {
                    const role = interaction.guild.roles.cache.get(r.value);
                    valueText = role ? role.toString() : r.value;
                } else if (r.type === "money") {
                    valueText = `${r.value} 💰`;
                }
                return `**Niveau ${r.level}:** ${r.type} - ${valueText}`;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("🎁 Récompenses de Niveau")
                .setDescription(rewardsList)
                .setColor(0x5865F2)
                .setFooter({ text: `Total: ${rewards.length} récompense(s)` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};

