const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder, MessageFlags} = require("discord.js");
const backupSystem = require("../../systems/backupSystem");
const fs = require("fs");
const path = require("path");

module.exports = {
    category: "Configuration",
    data: new SlashCommandBuilder()
        .setName("backup")
        .setDescription("💾 Gère les backups")
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription("Crée un backup")
                .addStringOption(option =>
                    option.setName("description")
                        .setDescription("Description du backup")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("restore")
                .setDescription("Restaure un backup")
                .addStringOption(option =>
                    option.setName("id")
                        .setDescription("ID du backup")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("Liste les backups")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("delete")
                .setDescription("Supprime un backup")
                .addStringOption(option =>
                    option.setName("id")
                        .setDescription("ID du backup")
                        .setRequired(true)
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

        if (subcommand === "create") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const description = interaction.options.getString("description");
            const backup = backupSystem.createBackup(interaction.guild.id, description);

            const embed = new EmbedBuilder()
                .setTitle("✅ Backup créé")
                .setDescription(`Backup créé avec succès !`)
                .addFields(
                    { name: "🆔 ID", value: backup.id, inline: true },
                    { name: "📁 Fichiers", value: `${backup.files.length}`, inline: true },
                    { name: "💾 Taille", value: `${(backup.size / 1024).toFixed(2)} KB`, inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            if (description) {
                embed.addFields({ name: "📝 Description", value: description, inline: false });
            }

            await interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === "restore") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const backupId = interaction.options.getString("id");
            const result = backupSystem.restoreBackup(interaction.guild.id, backupId);

            if (!result.success) {
                return interaction.editReply({
                    content: `❌ ${result.error}`
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("✅ Backup restauré")
                .setDescription(`Le backup a été restauré avec succès !`)
                .addFields(
                    { name: "🆔 ID", value: result.backup.id, inline: true },
                    { name: "📁 Fichiers", value: `${result.backup.files.length}`, inline: true }
                )
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === "list") {
            const backups = backupSystem.listBackups(interaction.guild.id);

            if (backups.length === 0) {
                return interaction.reply({
                    content: "❌ Aucun backup trouvé.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const backupsList = backups.map(b => {
                const date = new Date(b.timestamp).toLocaleString('fr-FR');
                return `**${b.id.slice(0, 8)}** - ${date} - ${b.files.length} fichiers${b.description ? ` - ${b.description}` : ""}`;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("💾 Backups")
                .setDescription(backupsList)
                .setColor(0x5865F2)
                .setFooter({ text: `Total: ${backups.length} backup(s)` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "delete") {
            const backupId = interaction.options.getString("id");
            const result = backupSystem.deleteBackup(interaction.guild.id, backupId);

            if (!result.success) {
                return interaction.reply({
                    content: `❌ ${result.error}`,
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.reply({
                content: "✅ Backup supprimé.",
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

