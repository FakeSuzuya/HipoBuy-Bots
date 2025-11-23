const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const welcomeSystem = require("../../systems/welcomeSystem");

module.exports = {
    category: "Configuration",
    data: new SlashCommandBuilder()
        .setName("welcome")
        .setDescription("👋 Configure les messages de bienvenue et d'au revoir")
        .addSubcommand(subcommand =>
            subcommand
                .setName("enable")
                .setDescription("Active le système de bienvenue")
                .addChannelOption(option =>
                    option.setName("salon")
                        .setDescription("Salon où envoyer les messages")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("message")
                        .setDescription("Message de bienvenue (variables: {user}, {guild}, {membercount})")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("disable")
                .setDescription("Désactive le système de bienvenue")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("goodbye")
                .setDescription("Configure les messages d'au revoir")
                .addChannelOption(option =>
                    option.setName("salon")
                        .setDescription("Salon où envoyer les messages")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName("message")
                        .setDescription("Message d'au revoir")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("autorole")
                .setDescription("Gère les rôles automatiques")
                .addRoleOption(option =>
                    option.setName("role")
                        .setDescription("Rôle à ajouter/retirer")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("Affiche la configuration actuelle")
        ),

    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: "❌ Vous devez avoir la permission de gérer le serveur.",
                flags: MessageFlags.Ephemeral
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "enable") {
            const channel = interaction.options.getChannel("salon");
            const message = interaction.options.getString("message") || "Bienvenue {user} sur {guild} !";

            welcomeSystem.setWelcomeConfig(interaction.guild.id, {
                enabled: true,
                channelId: channel.id,
                message: message
            });

            const embed = new EmbedBuilder()
                .setTitle("✅ Système de bienvenue activé")
                .setDescription(`Les messages de bienvenue seront envoyés dans ${channel}.\n\n**Message:** ${message}`)
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "disable") {
            welcomeSystem.setWelcomeConfig(interaction.guild.id, {
                enabled: false
            });

            const embed = new EmbedBuilder()
                .setTitle("✅ Système de bienvenue désactivé")
                .setDescription("Les messages de bienvenue ne seront plus envoyés.")
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "goodbye") {
            const channel = interaction.options.getChannel("salon");
            const message = interaction.options.getString("message");

            const config = {};
            if (channel) config.channelId = channel.id;
            if (message) config.message = message;
            config.enabled = channel ? true : false;

            welcomeSystem.setGoodbyeConfig(interaction.guild.id, config);

            const embed = new EmbedBuilder()
                .setTitle("✅ Configuration d'au revoir mise à jour")
                .setDescription(channel 
                    ? `Les messages d'au revoir seront envoyés dans ${channel}.`
                    : "Les messages d'au revoir ont été désactivés.")
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "autorole") {
            const role = interaction.options.getRole("role");
            const config = welcomeSystem.getWelcomeConfig(interaction.guild.id);
            const autoRoles = config.autoRoles || [];

            if (autoRoles.includes(role.id)) {
                autoRoles.splice(autoRoles.indexOf(role.id), 1);
                welcomeSystem.setWelcomeConfig(interaction.guild.id, { autoRoles });
                
                const embed = new EmbedBuilder()
                    .setTitle("✅ Rôle retiré")
                    .setDescription(`Le rôle ${role} ne sera plus attribué automatiquement.`)
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } else {
                autoRoles.push(role.id);
                welcomeSystem.setWelcomeConfig(interaction.guild.id, { autoRoles });
                
                const embed = new EmbedBuilder()
                    .setTitle("✅ Rôle ajouté")
                    .setDescription(`Le rôle ${role} sera attribué automatiquement aux nouveaux membres.`)
                    .setColor(0x00FF00)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === "view") {
            const welcomeConfig = welcomeSystem.getWelcomeConfig(interaction.guild.id);
            const goodbyeConfig = welcomeSystem.getGoodbyeConfig(interaction.guild.id);

            const embed = new EmbedBuilder()
                .setTitle("👋 Configuration Welcome/Goodbye")
                .setColor(0x5865F2)
                .addFields(
                    {
                        name: "👋 Bienvenue",
                        value: welcomeConfig.enabled 
                            ? `✅ Activé\n**Salon:** ${welcomeConfig.channelId ? `<#${welcomeConfig.channelId}>` : "❌"}\n**Message:** ${welcomeConfig.message}\n**Rôles auto:** ${welcomeConfig.autoRoles?.length || 0}`
                            : "❌ Désactivé",
                        inline: false
                    },
                    {
                        name: "👋 Au revoir",
                        value: goodbyeConfig.enabled
                            ? `✅ Activé\n**Salon:** ${goodbyeConfig.channelId ? `<#${goodbyeConfig.channelId}>` : "❌"}\n**Message:** ${goodbyeConfig.message}`
                            : "❌ Désactivé",
                        inline: false
                    }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
};

