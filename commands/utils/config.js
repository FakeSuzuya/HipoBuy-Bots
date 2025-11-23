const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    category: "Configuration",
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("⚙️ Configuration centralisée du bot - Interface avancée"),

    async execute(interaction, client) {
        // Vérifier les permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Permission refusée")
                .setDescription("Vous devez être **administrateur** pour utiliser cette commande.")
                .setColor(0xFF0000)
                .setThumbnail("https://i.imgur.com/4M34hi2.png")
                .setTimestamp();

            return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }

        // Afficher le menu principal
        await showMainMenu(interaction, client);
    }
};

// Menu principal
async function showMainMenu(interaction, client) {
    const config = client.config;
    
    // Calculer le pourcentage de configuration
    const totalSettings = 12;
    let configuredSettings = 0;
    
    if (config.logsMessage) configuredSettings++;
    if (config.logsMember) configuredSettings++;
    if (config.logsRole) configuredSettings++;
    if (config.logsChannel) configuredSettings++;
    if (config.logsBan) configuredSettings++;
    if (config.logsTicket) configuredSettings++;
    if (config.ticketCategoryId) configuredSettings++;
    if (config.ticketCategories && Object.keys(config.ticketCategories).length > 0) configuredSettings++;
    if (config.reactionRoles && Object.keys(config.reactionRoles).length > 0) configuredSettings++;
    if (client.security?.antiNuke?.enabled) configuredSettings++;
    if (client.security?.antiToken?.enabled) configuredSettings++;
    if (client.security?.antiFile?.enabled) configuredSettings++;
    
    const configPercentage = Math.round((configuredSettings / totalSettings) * 100);
    const progressBar = createProgressBar(configPercentage);

    const embed = new EmbedBuilder()
        .setTitle("⚙️ Configuration Centralisée")
        .setDescription(`**Bienvenue dans le panneau de configuration du bot !**\n\n${progressBar}\n**Configuration:** ${configPercentage}% (${configuredSettings}/${totalSettings})\n\nSélectionnez une section ci-dessous pour commencer à configurer.`)
        .setColor(0x5865F2)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
        .addFields(
            {
                name: "📝 Logs",
                value: `${getStatusIcon(config.logsMessage || config.logsMember || config.logsRole)} Salons de logs`,
                inline: true
            },
            {
                name: "🎫 Tickets",
                value: `${getStatusIcon(config.ticketCategoryId)} Système de tickets`,
                inline: true
            },
            {
                name: "🎭 Rôles",
                value: `${getStatusIcon(config.reactionRoles && Object.keys(config.reactionRoles).length > 0)} Rôles réactifs`,
                inline: true
            },
            {
                name: "🛡️ Sécurité",
                value: `${getStatusIcon(client.security?.antiNuke?.enabled || client.security?.antiToken?.enabled)} Système de sécurité`,
                inline: true
            },
            {
                name: "🎨 Apparence",
                value: `${getStatusIcon(config.imageTheme)} Thèmes d'images`,
                inline: true
            },
            {
                name: "📊 Statistiques",
                value: `${getStatusIcon(true)} Système d'analytics`,
                inline: true
            }
        )
        .setFooter({ 
            text: `Serveur: ${interaction.guild.name} • Utilisez le menu pour naviguer`,
            iconURL: interaction.guild.iconURL({ dynamic: true })
        })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("config_main_menu")
        .setPlaceholder("🔍 Sélectionnez une section à configurer...")
        .addOptions([
            {
                label: "📝 Logs",
                description: "Configurer les salons de logs",
                value: "logs",
                emoji: "📝"
            },
            {
                label: "🎫 Tickets",
                description: "Configurer le système de tickets",
                value: "tickets",
                emoji: "🎫"
            },
            {
                label: "🎭 Rôles Réactifs",
                description: "Gérer les rôles réactifs",
                value: "roles",
                emoji: "🎭"
            },
            {
                label: "🛡️ Sécurité",
                description: "Configurer la sécurité",
                value: "security",
                emoji: "🛡️"
            },
            {
                label: "🎨 Apparence",
                description: "Thèmes et couleurs",
                value: "appearance",
                emoji: "🎨"
            },
            {
                label: "📊 Vue d'ensemble",
                description: "Voir toute la configuration",
                value: "overview",
                emoji: "📊"
            },
            {
                label: "🔄 Réinitialiser",
                description: "Réinitialiser la configuration",
                value: "reset",
                emoji: "🔄"
            }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
        await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
    }
}

// Gérer les interactions du menu
async function handleConfigInteraction(interaction, client) {
    const value = interaction.values[0];

    // Menu principal
    if (value === "logs") {
        await showLogsMenu(interaction, client);
    } else if (value === "tickets") {
        await showTicketsMenu(interaction, client);
    } else if (value === "roles") {
        await showRolesMenu(interaction, client);
    } else if (value === "security") {
        await showSecurityMenu(interaction, client);
    } else if (value === "appearance") {
        await showAppearanceMenu(interaction, client);
    } else if (value === "overview") {
        await showOverview(interaction, client);
    } else if (value === "reset") {
        await showResetConfirmation(interaction, client);
    }
    // Sous-menus Logs
    else if (value.startsWith("logs_")) {
        await handleLogsAction(interaction, client, value);
    }
    // Sous-menus Tickets
    else if (value.startsWith("tickets_")) {
        await handleTicketsAction(interaction, client, value);
    }
    // Sous-menus Rôles
    else if (value.startsWith("roles_")) {
        await handleRolesAction(interaction, client, value);
    }
    // Sous-menus Sécurité
    else if (value.startsWith("security_")) {
        await handleSecurityAction(interaction, client, value);
    }
    // Sous-menus Apparence
    else if (value.startsWith("appearance_")) {
        await handleAppearanceAction(interaction, client, value);
    }
}

// Menu Logs
async function showLogsMenu(interaction, client) {
    const config = client.config;
    
    const embed = new EmbedBuilder()
        .setTitle("📝 Configuration des Logs")
        .setDescription("Configurez les salons où les différents événements seront enregistrés.\n\n**Sélectionnez un type de log à configurer :**")
        .setColor(0x5865F2)
        .addFields(
            {
                name: "📨 Messages",
                value: config.logsMessage ? `<#${config.logsMessage}>` : "❌ Non configuré",
                inline: true
            },
            {
                name: "👥 Membres",
                value: config.logsMember ? `<#${config.logsMember}>` : "❌ Non configuré",
                inline: true
            },
            {
                name: "🎭 Rôles",
                value: config.logsRole ? `<#${config.logsRole}>` : "❌ Non configuré",
                inline: true
            },
            {
                name: "📁 Salons",
                value: config.logsChannel ? `<#${config.logsChannel}>` : "❌ Non configuré",
                inline: true
            },
            {
                name: "🔨 Bannissements",
                value: config.logsBan ? `<#${config.logsBan}>` : "❌ Non configuré",
                inline: true
            },
            {
                name: "🎫 Tickets",
                value: config.logsTicket ? `<#${config.logsTicket}>` : "❌ Non configuré",
                inline: true
            }
        )
        .setFooter({ text: "Utilisez le menu pour sélectionner un type de log" })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("config_logs_menu")
        .setPlaceholder("🔍 Sélectionnez un type de log...")
        .addOptions([
            { label: "📨 Messages", value: "logs_messages", emoji: "📨" },
            { label: "👥 Membres", value: "logs_members", emoji: "👥" },
            { label: "🎭 Rôles", value: "logs_roles", emoji: "🎭" },
            { label: "📁 Salons", value: "logs_channels", emoji: "📁" },
            { label: "🔨 Bannissements", value: "logs_bans", emoji: "🔨" },
            { label: "🎫 Tickets", value: "logs_tickets", emoji: "🎫" },
            { label: "🔙 Retour", value: "back_main", emoji: "🔙" }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.update({ embeds: [embed], components: [row] });
}

// Menu Tickets
async function showTicketsMenu(interaction, client) {
    const config = client.config;
    const ticketCategories = config.ticketCategories || {};
    const categoriesList = Object.entries(ticketCategories)
        .map(([id, data]) => `**${typeof data === "string" ? data : data.label}** ${typeof data === "object" && data.emoji ? data.emoji : ""}\n\`${id}\``)
        .join("\n\n") || "Aucune catégorie configurée";

    const embed = new EmbedBuilder()
        .setTitle("🎫 Configuration des Tickets")
        .setDescription("Gérez le système de tickets de votre serveur.\n\n**Sélectionnez une action :**")
        .setColor(0x5865F2)
        .addFields(
            {
                name: "📁 Catégorie",
                value: config.ticketCategoryId ? `<#${config.ticketCategoryId}>` : "❌ Non configuré",
                inline: true
            },
            {
                name: "📋 Catégories",
                value: `${Object.keys(ticketCategories).length} catégorie(s)`,
                inline: true
            },
            {
                name: "📝 Liste des catégories",
                value: categoriesList.substring(0, 1024) || "Aucune",
                inline: false
            }
        )
        .setFooter({ text: "Utilisez le menu pour gérer les tickets" })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("config_tickets_menu")
        .setPlaceholder("🔍 Sélectionnez une action...")
        .addOptions([
            { label: "📁 Définir la catégorie", value: "tickets_category", emoji: "📁" },
            { label: "➕ Ajouter une catégorie", value: "tickets_add", emoji: "➕" },
            { label: "➖ Supprimer une catégorie", value: "tickets_remove", emoji: "➖" },
            { label: "👁️ Voir les catégories", value: "tickets_view", emoji: "👁️" },
            { label: "📤 Envoyer le panneau", value: "tickets_panel", emoji: "📤" },
            { label: "🔙 Retour", value: "back_main", emoji: "🔙" }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.update({ embeds: [embed], components: [row] });
}

// Menu Rôles
async function showRolesMenu(interaction, client) {
    const config = client.config;
    const reactionRoles = config.reactionRoles || {};
    const rolesList = Object.entries(reactionRoles)
        .map(([id, data]) => {
            const role = interaction.guild.roles.cache.get(data.roleId);
            return `**${data.label}** ${data.emoji}\n\`${id}\` → ${role ? role : "❌ Rôle introuvable"}`;
        })
        .join("\n\n") || "Aucun rôle configuré";

    const embed = new EmbedBuilder()
        .setTitle("🎭 Configuration des Rôles Réactifs")
        .setDescription("Gérez les rôles que les membres peuvent obtenir via le menu.\n\n**Sélectionnez une action :**")
        .setColor(0x5865F2)
        .addFields({
            name: "📝 Rôles configurés",
            value: rolesList.substring(0, 1024) || "Aucun",
            inline: false
        })
        .setFooter({ text: `Total: ${Object.keys(reactionRoles).length} rôle(s)` })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("config_roles_menu")
        .setPlaceholder("🔍 Sélectionnez une action...")
        .addOptions([
            { label: "➕ Ajouter un rôle", value: "roles_add", emoji: "➕" },
            { label: "➖ Supprimer un rôle", value: "roles_remove", emoji: "➖" },
            { label: "👁️ Voir les rôles", value: "roles_view", emoji: "👁️" },
            { label: "📤 Envoyer le menu", value: "roles_panel", emoji: "📤" },
            { label: "🔙 Retour", value: "back_main", emoji: "🔙" }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.update({ embeds: [embed], components: [row] });
}

// Menu Sécurité
async function showSecurityMenu(interaction, client) {
    const security = client.security || {};
    
    const embed = new EmbedBuilder()
        .setTitle("🛡️ Configuration de la Sécurité")
        .setDescription("Configurez les systèmes de protection de votre serveur.\n\n**Sélectionnez une option :**")
        .setColor(0x5865F2)
        .addFields(
            {
                name: "🛡️ Niveau de protection",
                value: security.level ? `**${security.level.toUpperCase()}**` : "Medium",
                inline: true
            },
            {
                name: "🚫 Anti-Nuke",
                value: security.antiNuke?.enabled ? "✅ Activé" : "❌ Désactivé",
                inline: true
            },
            {
                name: "🔑 Anti-Token",
                value: security.antiToken?.enabled ? "✅ Activé" : "❌ Désactivé",
                inline: true
            },
            {
                name: "📎 Anti-Fichier",
                value: security.antiFile?.enabled ? "✅ Activé" : "❌ Désactivé",
                inline: true
            },
            {
                name: "📝 Salon de logs",
                value: security.logChannelId ? `<#${security.logChannelId}>` : "❌ Non configuré",
                inline: true
            }
        )
        .setFooter({ text: "Utilisez le menu pour configurer la sécurité" })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("config_security_menu")
        .setPlaceholder("🔍 Sélectionnez une option...")
        .addOptions([
            { label: "🛡️ Niveau de protection", value: "security_level", emoji: "🛡️" },
            { label: "🚫 Anti-Nuke", value: "security_antinuke", emoji: "🚫" },
            { label: "🔑 Anti-Token", value: "security_antitoken", emoji: "🔑" },
            { label: "📎 Anti-Fichier", value: "security_antifile", emoji: "📎" },
            { label: "📝 Salon de logs", value: "security_logs", emoji: "📝" },
            { label: "🔙 Retour", value: "back_main", emoji: "🔙" }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.update({ embeds: [embed], components: [row] });
}

// Menu Apparence
async function showAppearanceMenu(interaction, client) {
    const config = client.config;
    const imageTheme = config.imageTheme || {};
    
    const embed = new EmbedBuilder()
        .setTitle("🎨 Configuration de l'Apparence")
        .setDescription("Personnalisez les thèmes et couleurs des images générées.\n\n**Thèmes disponibles :**")
        .setColor(0x5865F2)
        .addFields(
            {
                name: "📊 Niveaux",
                value: imageTheme.level ? "✅ Configuré" : "❌ Par défaut",
                inline: true
            },
            {
                name: "💰 Économie",
                value: imageTheme.economy ? "✅ Configuré" : "❌ Par défaut",
                inline: true
            },
            {
                name: "📈 Statistiques",
                value: imageTheme.stats ? "✅ Configuré" : "❌ Par défaut",
                inline: true
            }
        )
        .setFooter({ text: "Les thèmes personnalisés seront appliqués aux images générées" })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("config_appearance_menu")
        .setPlaceholder("🔍 Sélectionnez un thème...")
        .addOptions([
            { label: "📊 Thème Niveaux", value: "appearance_level", emoji: "📊" },
            { label: "💰 Thème Économie", value: "appearance_economy", emoji: "💰" },
            { label: "📈 Thème Statistiques", value: "appearance_stats", emoji: "📈" },
            { label: "🔙 Retour", value: "back_main", emoji: "🔙" }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.update({ embeds: [embed], components: [row] });
}

// Vue d'ensemble
async function showOverview(interaction, client) {
    const config = client.config;
    const security = client.security || {};
    
    const embed = new EmbedBuilder()
        .setTitle("📊 Vue d'Ensemble de la Configuration")
        .setDescription("**Configuration complète de votre serveur**\n\n" + "=".repeat(50))
        .setColor(0x5865F2)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 256 }))
        .addFields(
            {
                name: "📝 Logs",
                value: [
                    `**Messages:** ${config.logsMessage ? `<#${config.logsMessage}>` : "❌"}`,
                    `**Membres:** ${config.logsMember ? `<#${config.logsMember}>` : "❌"}`,
                    `**Rôles:** ${config.logsRole ? `<#${config.logsRole}>` : "❌"}`,
                    `**Salons:** ${config.logsChannel ? `<#${config.logsChannel}>` : "❌"}`,
                    `**Bans:** ${config.logsBan ? `<#${config.logsBan}>` : "❌"}`,
                    `**Tickets:** ${config.logsTicket ? `<#${config.logsTicket}>` : "❌"}`
                ].join("\n"),
                inline: true
            },
            {
                name: "🎫 Tickets",
                value: [
                    `**Catégorie:** ${config.ticketCategoryId ? `<#${config.ticketCategoryId}>` : "❌"}`,
                    `**Catégories:** ${Object.keys(config.ticketCategories || {}).length}`
                ].join("\n"),
                inline: true
            },
            {
                name: "🎭 Rôles",
                value: `**Rôles réactifs:** ${Object.keys(config.reactionRoles || {}).length}`,
                inline: true
            },
            {
                name: "🛡️ Sécurité",
                value: [
                    `**Niveau:** ${security.level || "Medium"}`,
                    `**Anti-Nuke:** ${security.antiNuke?.enabled ? "✅" : "❌"}`,
                    `**Anti-Token:** ${security.antiToken?.enabled ? "✅" : "❌"}`,
                    `**Anti-Fichier:** ${security.antiFile?.enabled ? "✅" : "❌"}`
                ].join("\n"),
                inline: true
            }
        )
        .setFooter({ text: `Serveur: ${interaction.guild.name}` })
        .setTimestamp();

    const backButton = new ButtonBuilder()
        .setCustomId("config_back_main")
        .setLabel("🔙 Retour")
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(backButton);

    await interaction.update({ embeds: [embed], components: [row] });
}

// Confirmation de réinitialisation
async function showResetConfirmation(interaction, client) {
    const embed = new EmbedBuilder()
        .setTitle("⚠️ Réinitialisation de la Configuration")
        .setDescription("**Êtes-vous sûr de vouloir réinitialiser la configuration ?**\n\nCette action est **irréversible** et remettra tous les paramètres à leurs valeurs par défaut.\n\n⚠️ **Attention:** Cette action ne peut pas être annulée !")
        .setColor(0xFF0000)
        .setThumbnail("https://i.imgur.com/4M34hi2.png")
        .setTimestamp();

    const confirmButton = new ButtonBuilder()
        .setCustomId("config_reset_confirm")
        .setLabel("Confirmer")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⚠️");

    const cancelButton = new ButtonBuilder()
        .setCustomId("config_back_main")
        .setLabel("Annuler")
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    await interaction.update({ embeds: [embed], components: [row] });
}

// Fonctions utilitaires
function getStatusIcon(condition) {
    return condition ? "✅" : "❌";
}

function createProgressBar(percentage) {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${percentage}%`;
}

// Gérer les actions des logs
async function handleLogsAction(interaction, client, value) {
    const logType = value.replace("logs_", "");
    const logTypes = {
        "messages": { name: "Messages", emoji: "📨", key: "logsMessage" },
        "members": { name: "Membres", emoji: "👥", key: "logsMember" },
        "roles": { name: "Rôles", emoji: "🎭", key: "logsRole" },
        "channels": { name: "Salons", emoji: "📁", key: "logsChannel" },
        "bans": { name: "Bannissements", emoji: "🔨", key: "logsBan" },
        "tickets": { name: "Tickets", emoji: "🎫", key: "logsTicket" }
    };

    const logData = logTypes[logType];
    if (!logData) {
        await showLogsMenu(interaction, client);
        return;
    }

    const config = client.config;
    const currentChannel = config[logData.key];

    const embed = new EmbedBuilder()
        .setTitle(`${logData.emoji} Configuration des Logs - ${logData.name}`)
        .setDescription(`Configurez le salon pour les logs de **${logData.name.toLowerCase()}**.\n\n**Salon actuel:** ${currentChannel ? `<#${currentChannel}>` : "❌ Non configuré"}\n\n**Sélectionnez un salon ci-dessous :**`)
        .setColor(0x5865F2)
        .setFooter({ text: "Sélectionnez un salon de texte" })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`config_logs_set_${logType}`)
        .setPlaceholder("🔍 Sélectionnez un salon...")
        .setMinValues(0)
        .setMaxValues(1);

    // Ajouter les salons de texte du serveur
    const textChannels = interaction.guild.channels.cache
        .filter(ch => ch.type === 0) // ChannelType.GuildText
        .map(ch => ({
            label: ch.name.length > 100 ? ch.name.substring(0, 97) + "..." : ch.name,
            value: ch.id,
            description: `Salon: #${ch.name}`,
            emoji: "📝"
        }))
        .slice(0, 25); // Limite Discord

    if (textChannels.length === 0) {
        embed.setDescription(`Aucun salon de texte disponible sur ce serveur.`);
        const backButton = new ButtonBuilder()
            .setCustomId("config_back_logs")
            .setLabel("🔙 Retour")
            .setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(backButton);
        await interaction.update({ embeds: [embed], components: [row] });
        return;
    }

    selectMenu.addOptions(textChannels);
    selectMenu.addOptions([{ label: "❌ Désactiver", value: "disable", emoji: "❌", description: "Désactiver ce type de log" }]);
    selectMenu.addOptions([{ label: "🔙 Retour", value: "back_logs", emoji: "🔙" }]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.update({ embeds: [embed], components: [row] });
}

// Gérer les actions des tickets
async function handleTicketsAction(interaction, client, value) {
    const action = value.replace("tickets_", "");
    const configPath = path.join(__dirname, "../../config.json");
    let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    if (action === "category") {
        const embed = new EmbedBuilder()
            .setTitle("📁 Configuration de la Catégorie de Tickets")
            .setDescription(`Définissez la catégorie où les tickets seront créés.\n\n**Catégorie actuelle:** ${config.ticketCategoryId ? `<#${config.ticketCategoryId}>` : "❌ Non configurée"}\n\n**Sélectionnez une catégorie :**`)
            .setColor(0x5865F2)
            .setFooter({ text: "Sélectionnez une catégorie" })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("config_tickets_set_category")
            .setPlaceholder("🔍 Sélectionnez une catégorie...")
            .setMinValues(0)
            .setMaxValues(1);

        const categories = interaction.guild.channels.cache
            .filter(ch => ch.type === 4) // ChannelType.GuildCategory
            .map(ch => ({
                label: ch.name.length > 100 ? ch.name.substring(0, 97) + "..." : ch.name,
                value: ch.id,
                description: `Catégorie: ${ch.name}`,
                emoji: "📁"
            }))
            .slice(0, 24);

        if (categories.length > 0) {
            selectMenu.addOptions(categories);
        }
        selectMenu.addOptions([{ label: "❌ Désactiver", value: "disable", emoji: "❌", description: "Ne pas utiliser de catégorie" }]);
        selectMenu.addOptions([{ label: "🔙 Retour", value: "back_tickets", emoji: "🔙" }]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    } else if (action === "add") {
        // Créer un modal pour ajouter une catégorie
        const modal = new ModalBuilder()
            .setCustomId("config_tickets_add_modal")
            .setTitle("Ajouter une Catégorie de Ticket");

        const idInput = new TextInputBuilder()
            .setCustomId("ticket_category_id")
            .setLabel("ID du bouton")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("ex: ticket_support")
            .setRequired(true)
            .setMaxLength(50)
            .setMinLength(3);

        const labelInput = new TextInputBuilder()
            .setCustomId("ticket_category_label")
            .setLabel("Nom affiché")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("ex: Support")
            .setRequired(true)
            .setMaxLength(50)
            .setMinLength(1);

        const emojiInput = new TextInputBuilder()
            .setCustomId("ticket_category_emoji")
            .setLabel("Emoji (optionnel)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("ex: 🛠️")
            .setRequired(false)
            .setMaxLength(10);

        const firstRow = new ActionRowBuilder().addComponents(idInput);
        const secondRow = new ActionRowBuilder().addComponents(labelInput);
        const thirdRow = new ActionRowBuilder().addComponents(emojiInput);
        
        modal.addComponents(firstRow, secondRow, thirdRow);
        await interaction.showModal(modal);
    } else if (action === "remove") {
        const ticketCategories = config.ticketCategories || {};
        const categories = Object.keys(ticketCategories);

        if (categories.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Aucune catégorie")
                .setDescription("Aucune catégorie de ticket n'est configurée.")
                .setColor(0xFF0000)
                .setTimestamp();

            const backButton = new ButtonBuilder()
                .setCustomId("config_back_tickets")
                .setLabel("🔙 Retour")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(backButton);
            await interaction.update({ embeds: [embed], components: [row] });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("➖ Supprimer une Catégorie de Ticket")
            .setDescription("Sélectionnez la catégorie à supprimer :")
            .setColor(0x5865F2)
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("config_tickets_remove_select")
            .setPlaceholder("🔍 Sélectionnez une catégorie...")
            .addOptions(
                categories.map(id => {
                    const data = ticketCategories[id];
                    return {
                        label: typeof data === "string" ? data : (data.label || id),
                        value: id,
                        description: `ID: ${id}`,
                        emoji: typeof data === "object" && data.emoji ? data.emoji : "🎫"
                    };
                }).slice(0, 25)
            )
            .addOptions([{ label: "🔙 Retour", value: "back_tickets", emoji: "🔙" }]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    } else if (action === "view") {
        await showTicketsMenu(interaction, client);
    } else if (action === "panel") {
        const ticketSystem = require("../../systems/ticketSystem");
        const channel = interaction.channel;

        const categories = config.ticketCategories || {};
        if (Object.keys(categories).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Erreur")
                .setDescription("Aucune catégorie de ticket n'est configurée. Ajoutez d'abord des catégories.")
                .setColor(0xFF0000)
                .setTimestamp();

            const backButton = new ButtonBuilder()
                .setCustomId("config_back_tickets")
                .setLabel("🔙 Retour")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(backButton);
            await interaction.update({ embeds: [embed], components: [row] });
            return;
        }

        // Créer le panneau de tickets
        const { ButtonBuilder: TicketButtonBuilder, ButtonStyle: TicketButtonStyle } = require("discord.js");
        const buttons = Object.entries(categories).map(([id, data]) => {
            const button = new TicketButtonBuilder()
                .setCustomId(id)
                .setLabel(typeof data === "string" ? data : data.label || id)
                .setStyle(TicketButtonStyle.Primary);
            
            if (typeof data === "object" && data.emoji) {
                button.setEmoji(data.emoji);
            }
            
            return button;
        });

        const rows = [];
        for (let i = 0; i < buttons.length; i += 5) {
            rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
        }

        const embed = new EmbedBuilder()
            .setTitle("🎫 Créer un Ticket")
            .setDescription("Sélectionnez le type de ticket que vous souhaitez créer en cliquant sur l'un des boutons ci-dessous.")
            .setColor(0x5865F2)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: "Un membre du staff vous répondra dans les plus brefs délais" })
            .setTimestamp();

        await channel.send({ embeds: [embed], components: rows });

        const successEmbed = new EmbedBuilder()
            .setTitle("✅ Panneau envoyé")
            .setDescription(`Le panneau de tickets a été envoyé dans ${channel}.`)
            .setColor(0x00FF00)
            .setTimestamp();

        await interaction.update({ embeds: [successEmbed], components: [] });
    }
}

// Gérer les actions des rôles
async function handleRolesAction(interaction, client, value) {
    const action = value.replace("roles_", "");
    const configPath = path.join(__dirname, "../../config.json");
    let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    if (!config.reactionRoles) {
        config.reactionRoles = {};
    }

    if (action === "add") {
        // Créer un modal pour ajouter un rôle
        const modal = new ModalBuilder()
            .setCustomId("config_roles_add_modal")
            .setTitle("Ajouter un Rôle Réactif");

        const idInput = new TextInputBuilder()
            .setCustomId("role_id")
            .setLabel("ID unique")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("ex: notif")
            .setRequired(true)
            .setMaxLength(50)
            .setMinLength(1);

        const labelInput = new TextInputBuilder()
            .setCustomId("role_label")
            .setLabel("Nom affiché")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("ex: Notifications")
            .setRequired(true)
            .setMaxLength(100)
            .setMinLength(1);

        const emojiInput = new TextInputBuilder()
            .setCustomId("role_emoji")
            .setLabel("Emoji (optionnel)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("ex: 🔔")
            .setRequired(false)
            .setMaxLength(10);

        const roleIdInput = new TextInputBuilder()
            .setCustomId("role_discord_id")
            .setLabel("ID du rôle Discord")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("ID du rôle à attribuer")
            .setRequired(true)
            .setMaxLength(20)
            .setMinLength(17);

        const firstRow = new ActionRowBuilder().addComponents(idInput);
        const secondRow = new ActionRowBuilder().addComponents(labelInput);
        const thirdRow = new ActionRowBuilder().addComponents(emojiInput);
        const fourthRow = new ActionRowBuilder().addComponents(roleIdInput);
        
        modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);
        await interaction.showModal(modal);
    } else if (action === "remove") {
        const reactionRoles = config.reactionRoles || {};
        const roles = Object.keys(reactionRoles);

        if (roles.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Aucun rôle")
                .setDescription("Aucun rôle réactif n'est configuré.")
                .setColor(0xFF0000)
                .setTimestamp();

            const backButton = new ButtonBuilder()
                .setCustomId("config_back_roles")
                .setLabel("🔙 Retour")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(backButton);
            await interaction.update({ embeds: [embed], components: [row] });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("➖ Supprimer un Rôle Réactif")
            .setDescription("Sélectionnez le rôle à supprimer :")
            .setColor(0x5865F2)
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("config_roles_remove_select")
            .setPlaceholder("🔍 Sélectionnez un rôle...")
            .addOptions(
                roles.map(id => {
                    const data = reactionRoles[id];
                    const role = interaction.guild.roles.cache.get(data.roleId);
                    return {
                        label: data.label || id,
                        value: id,
                        description: role ? `Rôle: ${role.name}` : "Rôle introuvable",
                        emoji: data.emoji || "🎭"
                    };
                }).slice(0, 25)
            )
            .addOptions([{ label: "🔙 Retour", value: "back_roles", emoji: "🔙" }]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    } else if (action === "view") {
        await showRolesMenu(interaction, client);
    } else if (action === "panel") {
        const channel = interaction.channel;
        const reactionRoles = config.reactionRoles || {};

        if (Object.keys(reactionRoles).length === 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ Erreur")
                .setDescription("Aucun rôle réactif n'est configuré. Ajoutez d'abord des rôles.")
                .setColor(0xFF0000)
                .setTimestamp();

            const backButton = new ButtonBuilder()
                .setCustomId("config_back_roles")
                .setLabel("🔙 Retour")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(backButton);
            await interaction.update({ embeds: [embed], components: [row] });
            return;
        }

        const { StringSelectMenuBuilder: RoleMenuBuilder } = require("discord.js");
        const options = Object.entries(reactionRoles).map(([id, data]) => {
            const role = interaction.guild.roles.cache.get(data.roleId);
            return {
                label: data.label,
                value: id,
                emoji: data.emoji,
                description: role ? `Rôle: ${role.name}` : "Rôle introuvable"
            };
        }).slice(0, 25);

        const menu = new RoleMenuBuilder()
            .setCustomId("role_menu")
            .setPlaceholder("Choisissez vos rôles...")
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);

        const embed = new EmbedBuilder()
            .setTitle("🎭 Rôles Réactifs")
            .setDescription("Sélectionnez les rôles que vous souhaitez obtenir en utilisant le menu ci-dessous.\n\nVous pouvez sélectionner plusieurs rôles à la fois.")
            .setColor(0x5865F2)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: "Utilisez le menu pour sélectionner vos rôles" })
            .setTimestamp();

        await channel.send({ embeds: [embed], components: [row] });

        const successEmbed = new EmbedBuilder()
            .setTitle("✅ Menu envoyé")
            .setDescription(`Le menu de rôles a été envoyé dans ${channel}.`)
            .setColor(0x00FF00)
            .setTimestamp();

        await interaction.update({ embeds: [successEmbed], components: [] });
    }
}

// Gérer les actions de sécurité
async function handleSecurityAction(interaction, client, value) {
    const action = value.replace("security_", "");
    const securityCore = require("../../securityCore");
    
    if (action === "level") {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ Niveau de Protection")
            .setDescription("Sélectionnez le niveau de protection pour votre serveur.\n\n**Niveaux disponibles:**\n- **Low** - Protection minimale\n- **Medium** - Protection standard (recommandé)\n- **High** - Protection élevée\n- **Extreme** - Protection maximale")
            .setColor(0x5865F2)
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("config_security_set_level")
            .setPlaceholder("🔍 Sélectionnez un niveau...")
            .addOptions([
                { label: "Low", value: "low", emoji: "🟢", description: "Protection minimale" },
                { label: "Medium", value: "medium", emoji: "🟡", description: "Protection standard" },
                { label: "High", value: "high", emoji: "🟠", description: "Protection élevée" },
                { label: "Extreme", value: "extreme", emoji: "🔴", description: "Protection maximale" },
                { label: "🔙 Retour", value: "back_security", emoji: "🔙" }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    } else if (action === "antinuke" || action === "antitoken" || action === "antifile") {
        const security = client.security || {};
        const featureName = action === "antinuke" ? "Anti-Nuke" : action === "antitoken" ? "Anti-Token" : "Anti-Fichier";
        const featureKey = action === "antinuke" ? "antiNuke" : action === "antitoken" ? "antiToken" : "antiFile";
        const isEnabled = security[featureKey]?.enabled || false;

        const embed = new EmbedBuilder()
            .setTitle(`🛡️ ${featureName}`)
            .setDescription(`**Statut actuel:** ${isEnabled ? "✅ Activé" : "❌ Désactivé"}\n\nSouhaitez-vous ${isEnabled ? "désactiver" : "activer"} ${featureName} ?`)
            .setColor(isEnabled ? 0x00FF00 : 0xFF0000)
            .setTimestamp();

        const enableButton = new ButtonBuilder()
            .setCustomId(`config_security_toggle_${action}`)
            .setLabel(isEnabled ? "Désactiver" : "Activer")
            .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success)
            .setEmoji(isEnabled ? "❌" : "✅");

        const backButton = new ButtonBuilder()
            .setCustomId("config_back_security")
            .setLabel("🔙 Retour")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(enableButton, backButton);
        await interaction.update({ embeds: [embed], components: [row] });
    } else if (action === "logs") {
        const security = client.security || {};
        const currentChannel = security.logChannelId;

        const embed = new EmbedBuilder()
            .setTitle("📝 Salon de Logs de Sécurité")
            .setDescription(`Configurez le salon où les alertes de sécurité seront envoyées.\n\n**Salon actuel:** ${currentChannel ? `<#${currentChannel}>` : "❌ Non configuré"}\n\n**Sélectionnez un salon :**`)
            .setColor(0x5865F2)
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("config_security_set_logs")
            .setPlaceholder("🔍 Sélectionnez un salon...")
            .setMinValues(0)
            .setMaxValues(1);

        const textChannels = interaction.guild.channels.cache
            .filter(ch => ch.type === 0)
            .map(ch => ({
                label: ch.name.length > 100 ? ch.name.substring(0, 97) + "..." : ch.name,
                value: ch.id,
                description: `Salon: #${ch.name}`,
                emoji: "📝"
            }))
            .slice(0, 24);

        if (textChannels.length > 0) {
            selectMenu.addOptions(textChannels);
        }
        selectMenu.addOptions([{ label: "❌ Désactiver", value: "disable", emoji: "❌", description: "Désactiver les logs de sécurité" }]);
        selectMenu.addOptions([{ label: "🔙 Retour", value: "back_security", emoji: "🔙" }]);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({ embeds: [embed], components: [row] });
    }
}

// Gérer les actions d'apparence
async function handleAppearanceAction(interaction, client, value) {
    const embed = new EmbedBuilder()
        .setTitle("🎨 Configuration de l'Apparence")
        .setDescription("La configuration des thèmes se fait directement dans le fichier `config.json`.\n\n**Pour modifier les thèmes:**\n1. Ouvrez le fichier `config.json`\n2. Modifiez la section `imageTheme`\n3. Redémarrez le bot\n\n**Couleurs configurables:**\n- `primaryColor` - Couleur principale\n- `secondaryColor` - Couleur secondaire\n- `backgroundColor` - Couleur de fond\n- `textColor` - Couleur du texte\n- `progressColor` - Couleur de la barre de progression")
        .setColor(0x5865F2)
        .addFields({
            name: "💡 Exemple",
            value: "```json\n\"imageTheme\": {\n  \"level\": {\n    \"primaryColor\": \"#5865F2\",\n    \"secondaryColor\": \"#7289DA\",\n    \"backgroundColor\": \"#2C2F33\",\n    \"textColor\": \"#FFFFFF\",\n    \"progressColor\": \"#5865F2\"\n  }\n}\n```",
            inline: false
        })
        .setFooter({ text: "Modifiez config.json pour personnaliser" })
        .setTimestamp();

    const backButton = new ButtonBuilder()
        .setCustomId("config_back_appearance")
        .setLabel("🔙 Retour")
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(backButton);
    await interaction.update({ embeds: [embed], components: [row] });
}

// Exporter les fonctions pour les utiliser dans interactionCreate.js
module.exports.handleConfigInteraction = handleConfigInteraction;
module.exports.showMainMenu = showMainMenu;
