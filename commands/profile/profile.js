const {SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags} = require("discord.js");
const profileSystem = require("../../systems/profileSystem");
const levelSystem = require("../../systems/levelSystem");
const economySystem = require("../../systems/economySystem");
const imageGenerator = require("../../systems/imageGenerator");

module.exports = {
    category: "Profil",
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("👤 Gère votre profil")
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("Affiche un profil")
                .addUserOption(option =>
                    option.setName("utilisateur")
                        .setDescription("Utilisateur dont vous voulez voir le profil")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Configure votre profil")
                .addStringOption(option =>
                    option.setName("bio")
                        .setDescription("Votre bio (max 200 caractères)")
                )
                .addStringOption(option =>
                    option.setName("couleur")
                        .setDescription("Couleur hexadécimale (ex: #5865F2)")
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("badges")
                .setDescription("Affiche vos badges")
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "view") {
            await interaction.deferReply();
            
            const target = interaction.options.getUser("utilisateur") || interaction.user;
            const profile = profileSystem.getProfile(interaction.guild.id, target.id);
            const levelStats = levelSystem.getUserStats(interaction.guild.id, target.id);
            const economyStats = economySystem.getStats(interaction.guild.id, target.id);

            try {
                // Générer une carte de profil
                const imageBuffer = await imageGenerator.generateProfileCard(
                    target,
                    profile,
                    levelStats,
                    economyStats
                );
                const attachment = new AttachmentBuilder(imageBuffer, { name: "profile.png" });

                const embed = new EmbedBuilder()
                    .setTitle(`👤 Profil de ${target.username}`)
                    .setColor(profile.color ? parseInt(profile.color.replace("#", ""), 16) : 0x5865F2)
                    .setImage("attachment://profile.png")
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } catch (error) {
                console.error("Erreur génération profil:", error);
                
                const embed = new EmbedBuilder()
                    .setTitle(`👤 Profil de ${target.username}`)
                    .setDescription(profile.bio || "Aucune bio")
                    .addFields(
                        { name: "📊 Niveau", value: `${levelStats.level}`, inline: true },
                        { name: "💰 Argent", value: `${economyStats.balance || 0} 💰`, inline: true },
                        { name: "🏆 Badges", value: profile.badges.length > 0 ? profile.badges.join(" ") : "Aucun", inline: false }
                    )
                    .setColor(profile.color ? parseInt(profile.color.replace("#", ""), 16) : 0x5865F2)
                    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }
        }

        if (subcommand === "set") {
            const bio = interaction.options.getString("bio");
            const color = interaction.options.getString("couleur");

            if (!bio && !color) {
                return interaction.reply({
                    content: "❌ Vous devez spécifier au moins une option (bio ou couleur).",
                    flags: MessageFlags.Ephemeral
                });
            }

            if (bio) {
                profileSystem.setBio(interaction.guild.id, interaction.user.id, bio);
            }

            if (color) {
                if (!/^#[0-9A-F]{6}$/i.test(color)) {
                    return interaction.reply({
                        content: "❌ Format de couleur invalide. Utilisez le format hexadécimal (ex: #5865F2).",
                        flags: MessageFlags.Ephemeral
                    });
                }
                profileSystem.setColor(interaction.guild.id, interaction.user.id, color);
            }

            await interaction.reply({
                content: "✅ Profil mis à jour.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (subcommand === "badges") {
            const profile = profileSystem.getProfile(interaction.guild.id, interaction.user.id);
            const availableBadges = profileSystem.getAvailableBadges();

            const userBadges = availableBadges.filter(b => profile.badges.includes(b.id));

            const embed = new EmbedBuilder()
                .setTitle("🏆 Vos Badges")
                .setDescription(userBadges.length > 0 
                    ? userBadges.map(b => `${b.emoji} **${b.name}**`).join("\n")
                    : "Vous n'avez aucun badge pour le moment.")
                .setColor(0xFFD700)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};

