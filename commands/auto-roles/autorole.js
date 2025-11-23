const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const autoRoleSystem = require("../../systems/autoRoleSystem");

module.exports = {
    category: "Configuration",
    data: new SlashCommandBuilder()
        .setName("autorole")
        .setDescription("🤖 Gère les rôles automatiques")
        .addSubcommand(subcommand =>
            subcommand
                .setName("time")
                .setDescription("Ajoute un rôle basé sur le temps passé")
                .addRoleOption(option =>
                    option.setName("role")
                        .setDescription("Rôle à attribuer")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("jours")
                        .setDescription("Nombre de jours requis")
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("level")
                .setDescription("Ajoute un rôle basé sur le niveau")
                .addRoleOption(option =>
                    option.setName("role")
                        .setDescription("Rôle à attribuer")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("niveau")
                        .setDescription("Niveau requis")
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("activity")
                .setDescription("Ajoute un rôle basé sur l'activité")
                .addRoleOption(option =>
                    option.setName("role")
                        .setDescription("Rôle à attribuer")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("messages")
                        .setDescription("Nombre de messages requis")
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("boost")
                .setDescription("Configure le rôle pour les boosters")
                .addRoleOption(option =>
                    option.setName("role")
                        .setDescription("Rôle à attribuer aux boosters")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Retire un auto-role")
                .addStringOption(option =>
                    option.setName("type")
                        .setDescription("Type d'auto-role")
                        .setRequired(true)
                        .addChoices(
                            { name: "Temps", value: "time" },
                            { name: "Niveau", value: "level" },
                            { name: "Activité", value: "activity" },
                            { name: "Boost", value: "boost" }
                        )
                )
                .addRoleOption(option =>
                    option.setName("role")
                        .setDescription("Rôle à retirer")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("Affiche la configuration actuelle")
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: "❌ Vous devez avoir la permission de gérer les rôles.",
                flags: MessageFlags.Ephemeral
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "time") {
            const role = interaction.options.getRole("role");
            const days = interaction.options.getInteger("jours");

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    content: "❌ Le rôle est trop élevé. Le bot doit être au-dessus de ce rôle.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const added = autoRoleSystem.addTimeBasedRole(interaction.guild.id, role.id, days);
            
            if (!added) {
                return interaction.reply({
                    content: "❌ Ce rôle est déjà configuré pour les auto-roles basés sur le temps.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("✅ Auto-role ajouté")
                .setDescription(`Le rôle ${role} sera attribué automatiquement après **${days} jour(s)** sur le serveur.`)
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "level") {
            const role = interaction.options.getRole("role");
            const level = interaction.options.getInteger("niveau");

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    content: "❌ Le rôle est trop élevé. Le bot doit être au-dessus de ce rôle.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const added = autoRoleSystem.addLevelBasedRole(interaction.guild.id, role.id, level);
            
            if (!added) {
                return interaction.reply({
                    content: "❌ Ce rôle est déjà configuré pour les auto-roles basés sur le niveau.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("✅ Auto-role ajouté")
                .setDescription(`Le rôle ${role} sera attribué automatiquement au **niveau ${level}**.`)
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "activity") {
            const role = interaction.options.getRole("role");
            const messages = interaction.options.getInteger("messages");

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    content: "❌ Le rôle est trop élevé. Le bot doit être au-dessus de ce rôle.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const added = autoRoleSystem.addActivityBasedRole(interaction.guild.id, role.id, messages);
            
            if (!added) {
                return interaction.reply({
                    content: "❌ Ce rôle est déjà configuré pour les auto-roles basés sur l'activité.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("✅ Auto-role ajouté")
                .setDescription(`Le rôle ${role} sera attribué automatiquement après **${messages} messages**.`)
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "boost") {
            const role = interaction.options.getRole("role");

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    content: "❌ Le rôle est trop élevé. Le bot doit être au-dessus de ce rôle.",
                    flags: MessageFlags.Ephemeral
                });
            }

            autoRoleSystem.setAutoRoleConfig(interaction.guild.id, {
                boostBased: true,
                boostRoleId: role.id
            });

            const embed = new EmbedBuilder()
                .setTitle("✅ Rôle booster configuré")
                .setDescription(`Le rôle ${role} sera attribué automatiquement aux membres qui boostent le serveur.`)
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "remove") {
            const type = interaction.options.getString("type");
            const role = interaction.options.getRole("role");

            const removed = autoRoleSystem.removeAutoRole(interaction.guild.id, type, role.id);
            
            if (!removed) {
                return interaction.reply({
                    content: "❌ Ce rôle n'est pas configuré pour ce type d'auto-role.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("✅ Auto-role retiré")
                .setDescription(`Le rôle ${role} ne sera plus attribué automatiquement.`)
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "view") {
            const config = autoRoleSystem.getAutoRoleConfig(interaction.guild.id);

            const embed = new EmbedBuilder()
                .setTitle("🤖 Configuration des Auto-Rôles")
                .setColor(0x5865F2)
                .addFields(
                    {
                        name: "⏰ Basés sur le temps",
                        value: config.timeBased && config.timeBased.length > 0
                            ? config.timeBased.map(r => {
                                const role = interaction.guild.roles.cache.get(r.roleId);
                                return `${role ? role : "Rôle introuvable"} - ${r.days} jour(s)`;
                            }).join("\n")
                            : "Aucun",
                        inline: false
                    },
                    {
                        name: "📊 Basés sur le niveau",
                        value: config.levelBased && config.levelBased.length > 0
                            ? config.levelBased.map(r => {
                                const role = interaction.guild.roles.cache.get(r.roleId);
                                return `${role ? role : "Rôle introuvable"} - Niveau ${r.level}`;
                            }).join("\n")
                            : "Aucun",
                        inline: false
                    },
                    {
                        name: "💬 Basés sur l'activité",
                        value: config.activityBased && config.activityBased.length > 0
                            ? config.activityBased.map(r => {
                                const role = interaction.guild.roles.cache.get(r.roleId);
                                return `${role ? role : "Rôle introuvable"} - ${r.messages} messages`;
                            }).join("\n")
                            : "Aucun",
                        inline: false
                    },
                    {
                        name: "💎 Boosters",
                        value: config.boostBased && config.boostRoleId
                            ? `${interaction.guild.roles.cache.get(config.boostRoleId) || "Rôle introuvable"}`
                            : "Non configuré",
                        inline: false
                    }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};

