const { Events, MessageFlags } = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        // Gestion des commandes contextuelles (menu clic droit)
        if (interaction.isUserContextMenuCommand()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command) {
                return interaction.reply({ 
                    content: "❌ Commande introuvable.", 
                    flags: MessageFlags.Ephemeral 
                }).catch(() => {});
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`Erreur lors de l'exécution de la commande contextuelle ${interaction.commandName}:`, error);
                const errorMessage = { 
                    content: "❌ Une erreur s'est produite lors de l'exécution de cette commande.", 
                    flags: MessageFlags.Ephemeral 
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage).catch(() => {});
                } else {
                    await interaction.reply(errorMessage).catch(() => {});
                }
            }
            return;
        }

        // Gestion des commandes slash
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            
            if (!command) {
                return interaction.reply({ 
                    content: "❌ Commande introuvable.", 
                    flags: MessageFlags.Ephemeral 
                }).catch(() => {});
            }

            // Tracking analytics pour les commandes
            const analyticsSystem = require("../systems/analyticsSystem");
            analyticsSystem.trackEvent(interaction.guild.id, "commands", {
                userId: interaction.user.id,
                commandName: interaction.commandName
            });

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, error);
                const errorMessage = { 
                    content: "❌ Une erreur s'est produite lors de l'exécution de cette commande.", 
                    flags: MessageFlags.Ephemeral 
                };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage).catch(() => {});
                } else {
                    await interaction.reply(errorMessage).catch(() => {});
                }
            }
            return;
        }

        // Gestion des modals (TICKETS)
        if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_modal_")) {
            const ticketSystem = require("../systems/ticketSystem");
            try {
                await ticketSystem.handleModal(interaction, client);
            } catch (error) {
                console.error("Erreur gestion modal ticket:", error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: "❌ Une erreur s'est produite lors de la création du ticket.", 
                        flags: MessageFlags.Ephemeral 
                    }).catch(() => {});
                }
            }
            return;
        }

        // Gestion des modals de commandes contextuelles
        if (interaction.isModalSubmit() && interaction.customId.startsWith("context_")) {
            const moderationSystem = require("../systems/moderationSystem");
            const notificationSystem = require("../systems/notificationSystem");
            const { EmbedBuilder } = require("discord.js");
            
            try {
                const [action, type, userId] = interaction.customId.split("_").slice(1);
                const target = await interaction.client.users.fetch(userId).catch(() => null);
                
                if (!target) {
                    return interaction.reply({
                        content: "❌ Utilisateur introuvable.",
                        flags: MessageFlags.Ephemeral
                    });
                }

                const reason = interaction.fields.getTextInputValue(`${type}_reason`);

                if (type === "warn") {
                    const result = moderationSystem.addWarn(
                        interaction.guild.id,
                        target.id,
                        interaction.user.id,
                        reason
                    );

                    const embed = moderationSystem.createWarnEmbed(
                        target,
                        interaction.user,
                        reason,
                        result.warnCount
                    );

                    // Envoyer dans les logs
                    const logChannel = interaction.guild.channels.cache.get(client.config.logsMessage);
                    if (logChannel) {
                        await logChannel.send({ embeds: [embed] }).catch(() => {});
                    }

                    // Notification en MP
                    await notificationSystem.notifyWarn(target, {
                        moderatorId: interaction.user.id,
                        reason: reason,
                        totalWarns: result.warnCount,
                        guildName: interaction.guild.name
                    }, interaction.user).catch(() => {});

                    await interaction.reply({
                        content: `✅ **${target.tag}** a été averti. (Total: ${result.warnCount} avertissement(s))`,
                        flags: MessageFlags.Ephemeral
                    });
                } else if (type === "ban") {
                    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
                    if (!member) {
                        return interaction.reply({
                            content: "❌ Cet utilisateur n'est pas sur le serveur.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    try {
                        await member.ban({ reason: reason, deleteMessageDays: 7 });
                        
                        moderationSystem.addBan(interaction.guild.id, target.id, interaction.user.id, reason);
                        
                        const embed = moderationSystem.createBanEmbed(target, interaction.user, reason);

                        // Envoyer dans les logs
                        const logChannel = interaction.guild.channels.cache.get(client.config.logsBan || client.config.logsMessage);
                        if (logChannel) {
                            await logChannel.send({ embeds: [embed] }).catch(() => {});
                        }

                        await interaction.reply({
                            content: `✅ **${target.tag}** a été banni.`,
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        console.error("Erreur ban:", error);
                        await interaction.reply({
                            content: "❌ Une erreur s'est produite lors du bannissement.",
                            flags: MessageFlags.Ephemeral
                        });
                    }
                } else if (type === "kick") {
                    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
                    if (!member) {
                        return interaction.reply({
                            content: "❌ Cet utilisateur n'est pas sur le serveur.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    try {
                        await member.kick(reason);
                        
                        const embed = new EmbedBuilder()
                            .setTitle("👢 Expulsion")
                            .setDescription(`**${target.tag}** a été expulsé.`)
                            .addFields(
                                { name: "👤 Utilisateur", value: `${target} (${target.id})`, inline: true },
                                { name: "🛡️ Modérateur", value: `${interaction.user}`, inline: true },
                                { name: "📝 Raison", value: reason, inline: false }
                            )
                            .setColor(0xFFA500)
                            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                            .setTimestamp();

                        // Envoyer dans les logs
                        const logChannel = interaction.guild.channels.cache.get(client.config.logsMember || client.config.logsMessage);
                        if (logChannel) {
                            await logChannel.send({ embeds: [embed] }).catch(() => {});
                        }

                        await interaction.reply({
                            content: `✅ **${target.tag}** a été expulsé.`,
                            flags: MessageFlags.Ephemeral
                        });
                    } catch (error) {
                        console.error("Erreur kick:", error);
                        await interaction.reply({
                            content: "❌ Une erreur s'est produite lors de l'expulsion.",
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }
            } catch (error) {
                console.error("Erreur modal context:", error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: "❌ Une erreur s'est produite.",
                        flags: MessageFlags.Ephemeral
                    }).catch(() => {});
                }
            }
            return;
        }

        // Gestion des modals de configuration
        if (interaction.isModalSubmit() && interaction.customId.startsWith("config_")) {
            const configCommand = require("../commands/utils/config");
            const fs = require("fs");
            const path = require("path");
            const configPath = path.join(__dirname, "../config.json");
            let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            const { EmbedBuilder } = require("discord.js");

            try {
                if (interaction.customId === "config_tickets_add_modal") {
                    const id = interaction.fields.getTextInputValue("ticket_category_id");
                    const label = interaction.fields.getTextInputValue("ticket_category_label");
                    const emoji = interaction.fields.getTextInputValue("ticket_category_emoji") || "";

                    if (!config.ticketCategories) {
                        config.ticketCategories = {};
                    }

                    if (config.ticketCategories[id]) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle("❌ Erreur")
                            .setDescription(`L'ID **${id}** est déjà utilisé.`)
                            .setColor(0xFF0000)
                            .setTimestamp();
                        return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                    }

                    config.ticketCategories[id] = {
                        name: `📘・${label.toLowerCase()}`,
                        emoji: emoji,
                        label: label
                    };

                    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
                    client.config = config;

                    const successEmbed = new EmbedBuilder()
                        .setTitle("✅ Catégorie ajoutée")
                        .setDescription(`La catégorie **${label}** a été ajoutée avec succès.`)
                        .addFields(
                            { name: "ID", value: `\`${id}\``, inline: true },
                            { name: "Label", value: label, inline: true },
                            { name: "Emoji", value: emoji || "Aucun", inline: true }
                        )
                        .setColor(0x00FF00)
                        .setTimestamp();

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                } else if (interaction.customId === "config_roles_add_modal") {
                    const id = interaction.fields.getTextInputValue("role_id");
                    const label = interaction.fields.getTextInputValue("role_label");
                    const emoji = interaction.fields.getTextInputValue("role_emoji") || "";
                    const roleId = interaction.fields.getTextInputValue("role_discord_id");

                    if (!config.reactionRoles) {
                        config.reactionRoles = {};
                    }

                    if (config.reactionRoles[id]) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle("❌ Erreur")
                            .setDescription(`L'ID **${id}** est déjà utilisé.`)
                            .setColor(0xFF0000)
                            .setTimestamp();
                        return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                    }

                    const role = interaction.guild.roles.cache.get(roleId);
                    if (!role) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle("❌ Erreur")
                            .setDescription(`Le rôle avec l'ID **${roleId}** n'existe pas.`)
                            .setColor(0xFF0000)
                            .setTimestamp();
                        return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                    }

                    config.reactionRoles[id] = {
                        roleId: roleId,
                        label: label,
                        emoji: emoji
                    };

                    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
                    client.config = config;

                    const successEmbed = new EmbedBuilder()
                        .setTitle("✅ Rôle ajouté")
                        .setDescription(`Le rôle **${label}** a été ajouté avec succès.`)
                        .addFields(
                            { name: "ID", value: `\`${id}\``, inline: true },
                            { name: "Rôle", value: `${role}`, inline: true },
                            { name: "Emoji", value: emoji || "Aucun", inline: true }
                        )
                        .setColor(0x00FF00)
                        .setTimestamp();

                    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
                }
            } catch (error) {
                console.error("Erreur modal config:", error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: "❌ Une erreur s'est produite.", 
                        flags: MessageFlags.Ephemeral 
                    }).catch(() => {});
                }
            }
            return;
        }

        // Gestion des menus de sélection (FAQ)
        if (interaction.isStringSelectMenu() && interaction.customId === "faq_select") {
            const value = interaction.values[0];
            let responseText = "";

            switch (value) {
                case "buy":
                    responseText = "**Pour acheter :**\n1. Allez sur Hipobuy.com\n2. Choisissez votre article\n3. Payez via PayPal/CB\n4. Recevez votre produit instantanément !";
                    break;
                case "time":
                    responseText = "**Délais :**\nLa plupart de nos produits sont livrés **automatiquement** (moins de 1 minute).";
                    break;
                case "refund":
                    responseText = "**Remboursement :**\nNous remboursons si le produit est défectueux et que le support n'a pas pu aider sous 24h.";
                    break;
                default:
                    responseText = "❌ Option non reconnue.";
            }

            try {
                await interaction.reply({ content: responseText, flags: MessageFlags.Ephemeral });
            } catch (error) {
                console.error("Erreur FAQ:", error);
            }
            return;
        }

        // Gestion des boutons
        if (interaction.isButton()) {
            // Boutons de poll (AVANT les autres pour éviter les conflits)
            if (interaction.customId.startsWith("poll_vote_")) {
                const pollSystem = require("../systems/pollSystem");
                const parts = interaction.customId.split("_");
                const pollId = parts[2];
                const optionId = parts[3];
                
                try {
                    const poll = pollSystem.votePoll(interaction.guild.id, pollId, interaction.user.id, optionId);
                    
                    if (!poll) {
                        return interaction.reply({
                            content: "❌ Sondage introuvable ou terminé.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                // Mettre à jour le message avec le graphique
                const creator = await interaction.client.users.fetch(poll.creatorId).catch(() => null);
                const embed = pollSystem.createPollEmbed(poll, creator);
                const buttons = pollSystem.createPollButtons(poll);

                // Générer le graphique mis à jour et l'ajouter à l'embed
                const chartGenerator = require("../systems/chartGenerator");
                const { AttachmentBuilder } = require("discord.js");
                let attachment = null;
                
                try {
                    const chartBuffer = await chartGenerator.generatePollChart(poll);
                    attachment = new AttachmentBuilder(chartBuffer, { name: `poll-chart-${poll.id}.png` });
                    embed.setImage(`attachment://poll-chart-${poll.id}.png`);
                } catch (error) {
                    console.error("Erreur génération graphique poll:", error);
                }
                
                await interaction.message.edit({ 
                    embeds: [embed], 
                    components: buttons,
                    files: attachment ? [attachment] : []
                });
                await interaction.reply({
                    content: "✅ Vote enregistré !",
                    flags: MessageFlags.Ephemeral
                });
                } catch (error) {
                    console.error("Erreur vote poll:", error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: "❌ Une erreur s'est produite lors du vote.",
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                }
                return;
            }

            // Bouton de fermeture de ticket
            if (interaction.customId === "close_ticket") {
                const transcriptSystem = require("../systems/transcriptSystem");
                try {
                    await interaction.reply({ 
                        content: "⏳ Fermeture du ticket en cours…", 
                        flags: MessageFlags.Ephemeral 
                    });
                    
                    await transcriptSystem(interaction.channel, client);
                    
                    setTimeout(async () => {
                        try {
                            await interaction.channel.delete();
                        } catch (error) {
                            console.error("Erreur lors de la suppression du ticket:", error);
                        }
                    }, 3000);
                } catch (error) {
                    console.error("Erreur fermeture ticket:", error);
                }
                return;
            }

            // Boutons de blackjack
            if (interaction.customId.startsWith("blackjack_")) {
                const gameSystem = require("../systems/gameSystem");
                const { EmbedBuilder } = require("discord.js");
                const [action, type, gameId] = interaction.customId.split("_");
                
                try {
                    const game = gameSystem.getBlackjackGame(interaction.guild.id, gameId);
                    
                    if (!game || game.userId !== interaction.user.id) {
                        return interaction.reply({
                            content: "❌ Cette partie ne vous appartient pas ou n'existe plus.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    let updatedGame = null;
                    
                    if (type === "hit") {
                        updatedGame = gameSystem.hitBlackjack(interaction.guild.id, gameId, interaction.user.id);
                    } else if (type === "stand") {
                        updatedGame = gameSystem.standBlackjack(interaction.guild.id, gameId, interaction.user.id);
                    }

                    if (!updatedGame) {
                        return interaction.reply({
                            content: "❌ Erreur lors de la mise à jour de la partie.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    // Importer les fonctions du fichier blackjack.js
                    const blackjackCommand = require("../commands/fun/blackjack");
                    const embed = blackjackCommand.createGameEmbed(updatedGame, interaction.user);
                    const buttons = blackjackCommand.createGameButtons(updatedGame);

                    await interaction.update({ embeds: [embed], components: buttons });
                } catch (error) {
                    console.error("Erreur blackjack:", error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: "❌ Une erreur s'est produite.",
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                }
                return;
            }

            // Boutons de giveaway (AVANT la gestion générale des boutons)
            if (interaction.customId.startsWith("giveaway_")) {
                const giveawaySystem = require("../systems/giveawaySystem");
                const notificationSystem = require("../systems/notificationSystem");
                const [action, type, giveawayId] = interaction.customId.split("_");
                
                try {
                    if (type === "join") {
                        const joined = giveawaySystem.joinGiveaway(interaction.guild.id, giveawayId, interaction.user.id);
                        if (joined) {
                            await interaction.reply({ content: "✅ Vous participez au giveaway !", flags: MessageFlags.Ephemeral });
                            
                            // Envoyer une notification en MP
                            const giveaway = giveawaySystem.getGiveaway(interaction.guild.id, giveawayId);
                            if (giveaway) {
                                await notificationSystem.notifyGiveawayJoin(interaction.user, giveaway).catch(() => {});
                                
                                // Mettre à jour le message avec le nouveau nombre de participants
                                try {
                                    const channel = await interaction.guild.channels.fetch(giveaway.channelId).catch(() => null);
                                    if (channel && giveaway.messageId) {
                                        const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
                                        if (message) {
                                            const host = await interaction.client.users.fetch(giveaway.hostId).catch(() => null);
                                            const embed = giveawaySystem.createGiveawayEmbed(giveaway, host);
                                            const buttons = giveawaySystem.createGiveawayButtons(giveaway);
                                            
                                            // Générer le graphique mis à jour et l'ajouter à l'embed
                                            const chartGenerator = require("../systems/chartGenerator");
                                            const { AttachmentBuilder } = require("discord.js");
                                            try {
                                                const chartBuffer = await chartGenerator.generateGiveawayChart(giveaway);
                                                const attachment = new AttachmentBuilder(chartBuffer, { name: `giveaway-chart-${giveaway.id}.png` });
                                                embed.setImage(`attachment://giveaway-chart-${giveaway.id}.png`);
                                                
                                                await message.edit({ 
                                                    embeds: [embed], 
                                                    components: buttons ? [buttons] : [],
                                                    files: [attachment]
                                                });
                                            } catch (error) {
                                                console.error("Erreur génération graphique giveaway:", error);
                                                await message.edit({ 
                                                    embeds: [embed], 
                                                    components: buttons ? [buttons] : []
                                                });
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error("Erreur mise à jour message giveaway:", error);
                                }
                            }
                        } else {
                            await interaction.reply({ content: "❌ Impossible de participer (déjà inscrit ou giveaway terminé).", flags: MessageFlags.Ephemeral });
                        }
                    } else if (type === "leave") {
                        const left = giveawaySystem.leaveGiveaway(interaction.guild.id, giveawayId, interaction.user.id);
                        if (left) {
                            await interaction.reply({ content: "✅ Vous avez quitté le giveaway.", flags: MessageFlags.Ephemeral });
                            
                            // Mettre à jour le message avec le nouveau nombre de participants
                            const giveaway = giveawaySystem.getGiveaway(interaction.guild.id, giveawayId);
                            if (giveaway) {
                                try {
                                    const channel = await interaction.guild.channels.fetch(giveaway.channelId).catch(() => null);
                                    if (channel && giveaway.messageId) {
                                        const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
                                        if (message) {
                                            const host = await interaction.client.users.fetch(giveaway.hostId).catch(() => null);
                                            const embed = giveawaySystem.createGiveawayEmbed(giveaway, host);
                                            const buttons = giveawaySystem.createGiveawayButtons(giveaway);
                                            
                                            // Générer le graphique mis à jour et l'ajouter à l'embed
                                            const chartGenerator = require("../systems/chartGenerator");
                                            const { AttachmentBuilder } = require("discord.js");
                                            try {
                                                const chartBuffer = await chartGenerator.generateGiveawayChart(giveaway);
                                                const attachment = new AttachmentBuilder(chartBuffer, { name: `giveaway-chart-${giveaway.id}.png` });
                                                embed.setImage(`attachment://giveaway-chart-${giveaway.id}.png`);
                                                
                                                await message.edit({ 
                                                    embeds: [embed], 
                                                    components: buttons ? [buttons] : [],
                                                    files: [attachment]
                                                });
                                            } catch (error) {
                                                console.error("Erreur génération graphique giveaway:", error);
                                                await message.edit({ 
                                                    embeds: [embed], 
                                                    components: buttons ? [buttons] : []
                                                });
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error("Erreur mise à jour message giveaway:", error);
                                }
                            }
                        } else {
                            await interaction.reply({ content: "❌ Vous ne participez pas à ce giveaway.", flags: MessageFlags.Ephemeral });
                        }
                    }
                } catch (error) {
                    console.error("Erreur interaction giveaway:", error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: "❌ Une erreur s'est produite.", 
                            flags: MessageFlags.Ephemeral 
                        }).catch(() => {});
                    }
                }
                return;
            }

            // Boutons de suggestions
            if (interaction.customId.startsWith("suggest_")) {
                const suggestionSystem = require("../systems/suggestionSystem");
                const [action, type, suggestionId] = interaction.customId.split("_");
                
                try {
                    if (type === "upvote" || type === "downvote") {
                        const suggestion = suggestionSystem.voteSuggestion(
                            interaction.guild.id,
                            suggestionId,
                            interaction.user.id,
                            type
                        );
                        
                        if (suggestion) {
                            // Mettre à jour le message
                            try {
                                const user = await interaction.client.users.fetch(suggestion.userId).catch(() => null);
                                const embed = suggestionSystem.createSuggestionEmbed(suggestion, user);
                                await interaction.message.edit({ embeds: [embed] });
                                await interaction.reply({ content: `✅ Vote ${type === "upvote" ? "positif" : "négatif"} enregistré !`, flags: MessageFlags.Ephemeral });
                            } catch (error) {
                                console.error("Erreur vote suggestion:", error);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Erreur interaction suggestion:", error);
                }
                return;
            }

            // Bouton de confirmation pour reset config
            if (interaction.customId === "config_reset_confirm") {
                const fs = require("fs");
                const path = require("path");
                const { EmbedBuilder } = require("discord.js");
                
                try {
                    const configPath = path.join(__dirname, "../config.json");
                    const defaultConfig = {
                        token: client.config.token,
                        guildId: client.config.guildId,
                        clientId: client.config.clientId,
                        ticketCategoryId: "",
                        logsMessage: "",
                        logsMember: "",
                        logsRole: "",
                        logsChannel: "",
                        logsGuild: "",
                        logsBan: "",
                        logsTicket: "",
                        reviewChannelId: client.config.reviewChannelId || "",
                        ownerId: client.config.ownerId || ""
                    };
                    
                    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 4), "utf-8");
                    client.config = defaultConfig;
                    
                    const successEmbed = new EmbedBuilder()
                        .setTitle("✅ Configuration réinitialisée")
                        .setDescription("La configuration a été réinitialisée avec succès.")
                        .setColor(0x00FF00)
                        .setTimestamp();
                    
                    await interaction.update({ embeds: [successEmbed], components: [] });
                } catch (error) {
                    console.error("Erreur reset config:", error);
                    await interaction.reply({ 
                        content: "❌ Une erreur s'est produite lors de la réinitialisation.", 
                        flags: MessageFlags.Ephemeral 
                    }).catch(() => {});
                }
                return;
            }

            if (interaction.customId === "config_reset_cancel") {
                const { EmbedBuilder } = require("discord.js");
                const cancelEmbed = new EmbedBuilder()
                    .setTitle("❌ Opération annulée")
                    .setDescription("La réinitialisation a été annulée.")
                    .setColor(0xFFA500)
                    .setTimestamp();
                
                await interaction.update({ embeds: [cancelEmbed], components: [] });
                return;
            }
            
            // Autres boutons (création de ticket)
            const ticketSystem = require("../systems/ticketSystem");
            try {
                await ticketSystem.handleButton(interaction, client);
            } catch (error) {
                console.error("Erreur système de tickets:", error);
            }
            return;
        }

        // Gestion des menus de sélection (rôles)
        if (interaction.isStringSelectMenu() && interaction.customId === "role_menu") {
            const reactionRolesSystem = require("../systems/reactionRolesSystem");
            try {
                await reactionRolesSystem(interaction, client);
            } catch (error) {
                console.error("Erreur système de rôles:", error);
            }
            return;
        }

        // Gestion de la commande config centralisée
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith("config_")) {
            const configCommand = require("../commands/utils/config");
            const fs = require("fs");
            const path = require("path");
            const configPath = path.join(__dirname, "../config.json");
            const { EmbedBuilder } = require("discord.js");
            
            try {
                const value = interaction.values[0];
                
                // Gérer le retour au menu principal
                if (value === "back_main") {
                    await configCommand.showMainMenu(interaction, client);
                    return;
                }
                
                // Gérer les retours aux sous-menus
                if (value === "back_logs") {
                    const config = client.config;
                    const embed = new EmbedBuilder()
                        .setTitle("📝 Configuration des Logs")
                        .setDescription("Configurez les salons où les différents événements seront enregistrés.\n\n**Sélectionnez un type de log à configurer :**")
                        .setColor(0x5865F2)
                        .addFields(
                            { name: "📨 Messages", value: config.logsMessage ? `<#${config.logsMessage}>` : "❌ Non configuré", inline: true },
                            { name: "👥 Membres", value: config.logsMember ? `<#${config.logsMember}>` : "❌ Non configuré", inline: true },
                            { name: "🎭 Rôles", value: config.logsRole ? `<#${config.logsRole}>` : "❌ Non configuré", inline: true },
                            { name: "📁 Salons", value: config.logsChannel ? `<#${config.logsChannel}>` : "❌ Non configuré", inline: true },
                            { name: "🔨 Bannissements", value: config.logsBan ? `<#${config.logsBan}>` : "❌ Non configuré", inline: true },
                            { name: "🎫 Tickets", value: config.logsTicket ? `<#${config.logsTicket}>` : "❌ Non configuré", inline: true }
                        )
                        .setFooter({ text: "Utilisez le menu pour sélectionner un type de log" })
                        .setTimestamp();
                    const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
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
                    return;
                }
                
                // Gérer la configuration des logs
                if (interaction.customId.startsWith("config_logs_set_")) {
                    let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
                    const logType = interaction.customId.replace("config_logs_set_", "");
                    const logTypes = {
                        "messages": "logsMessage",
                        "members": "logsMember",
                        "roles": "logsRole",
                        "channels": "logsChannel",
                        "bans": "logsBan",
                        "tickets": "logsTicket"
                    };
                    
                    if (value === "disable") {
                        config[logTypes[logType]] = "";
                    } else if (value === "back_logs") {
                        // Retour géré plus haut
                        return;
                    } else {
                        config[logTypes[logType]] = value;
                    }
                    
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
                    client.config = config;
                    
                    const successEmbed = new EmbedBuilder()
                        .setTitle("✅ Configuration mise à jour")
                        .setDescription(value === "disable" 
                            ? `Les logs de **${logType}** ont été désactivés.`
                            : `Le salon <#${value}> a été configuré pour les logs de **${logType}**.`)
                        .setColor(0x00FF00)
                        .setTimestamp();
                    
                    await interaction.update({ embeds: [successEmbed], components: [] });
                    return;
                }
                
                // Gérer la configuration des tickets
                if (interaction.customId === "config_tickets_set_category") {
                    let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
                    
                    if (value === "disable") {
                        config.ticketCategoryId = "";
                    } else if (value === "back_tickets") {
                        // Retour géré ailleurs
                        return;
                    } else {
                        config.ticketCategoryId = value;
                    }
                    
                    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
                    client.config = config;
                    
                    const successEmbed = new EmbedBuilder()
                        .setTitle("✅ Catégorie configurée")
                        .setDescription(value === "disable"
                            ? "La catégorie de tickets a été désactivée."
                            : `La catégorie <#${value}> a été configurée pour les tickets.`)
                        .setColor(0x00FF00)
                        .setTimestamp();
                    
                    await interaction.update({ embeds: [successEmbed], components: [] });
                    return;
                }
                
                if (interaction.customId === "config_tickets_remove_select") {
                    let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
                    
                    if (value === "back_tickets") {
                        // Retour géré ailleurs
                        return;
                    }
                    
                    if (config.ticketCategories && config.ticketCategories[value]) {
                        const categoryData = config.ticketCategories[value];
                        delete config.ticketCategories[value];
                        fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
                        client.config = config;
                        
                        const successEmbed = new EmbedBuilder()
                            .setTitle("✅ Catégorie supprimée")
                            .setDescription(`La catégorie **${typeof categoryData === "string" ? categoryData : categoryData.label}** a été supprimée.`)
                            .setColor(0x00FF00)
                            .setTimestamp();
                        
                        await interaction.update({ embeds: [successEmbed], components: [] });
                    }
                    return;
                }
                
                // Gérer la configuration des rôles
                if (interaction.customId === "config_roles_remove_select") {
                    let config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
                    
                    if (value === "back_roles") {
                        // Retour géré ailleurs
                        return;
                    }
                    
                    if (config.reactionRoles && config.reactionRoles[value]) {
                        const roleData = config.reactionRoles[value];
                        delete config.reactionRoles[value];
                        fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8");
                        client.config = config;
                        
                        const successEmbed = new EmbedBuilder()
                            .setTitle("✅ Rôle supprimé")
                            .setDescription(`Le rôle **${roleData.label}** a été supprimé.`)
                            .setColor(0x00FF00)
                            .setTimestamp();
                        
                        await interaction.update({ embeds: [successEmbed], components: [] });
                    }
                    return;
                }
                
                // Gérer la configuration de la sécurité
                if (interaction.customId === "config_security_set_level") {
                    const securityCore = require("../securityCore");
                    if (value === "back_security") {
                        // Retour géré ailleurs
                        return;
                    }
                    
                    if (client.security) {
                        client.security.level = value;
                    }
                    
                    const successEmbed = new EmbedBuilder()
                        .setTitle("✅ Niveau de protection mis à jour")
                        .setDescription(`Le niveau de protection a été défini sur **${value.toUpperCase()}**.`)
                        .setColor(0x00FF00)
                        .setTimestamp();
                    
                    await interaction.update({ embeds: [successEmbed], components: [] });
                    return;
                }
                
                if (interaction.customId === "config_security_set_logs") {
                    if (value === "disable") {
                        if (client.security) {
                            client.security.logChannelId = "";
                        }
                    } else if (value === "back_security") {
                        // Retour géré ailleurs
                        return;
                    } else {
                        if (client.security) {
                            client.security.logChannelId = value;
                        }
                    }
                    
                    const successEmbed = new EmbedBuilder()
                        .setTitle("✅ Salon de logs configuré")
                        .setDescription(value === "disable"
                            ? "Les logs de sécurité ont été désactivés."
                            : `Le salon <#${value}> a été configuré pour les logs de sécurité.`)
                        .setColor(0x00FF00)
                        .setTimestamp();
                    
                    await interaction.update({ embeds: [successEmbed], components: [] });
                    return;
                }
                
                // Gérer les autres interactions
                await configCommand.handleConfigInteraction(interaction, client);
            } catch (error) {
                console.error("Erreur interaction config:", error);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: "❌ Une erreur s'est produite.", 
                        flags: MessageFlags.Ephemeral 
                    }).catch(() => {});
                }
            }
            return;
        }

        // Gestion des menus giveaway
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith("giveaway_")) {
            const giveawayCommand = require("../commands/giveaways/giveaway");
            
            if (interaction.customId === "giveaway_menu") {
                await giveawayCommand.handleGiveawayInteraction(interaction, client);
            } else if (interaction.customId === "giveaway_end_select") {
                await giveawayCommand.handleGiveawaySelect(interaction, client, "end");
            } else if (interaction.customId === "giveaway_reroll_select") {
                await giveawayCommand.handleGiveawaySelect(interaction, client, "reroll");
            }
            return;
        }

        // Gestion des modals giveaway
        if (interaction.isModalSubmit() && interaction.customId.startsWith("giveaway_create_modal_")) {
            const giveawayCommand = require("../commands/giveaways/giveaway");
            await giveawayCommand.handleGiveawayModal(interaction, client);
            return;
        }

        // Gestion de la pagination
        if (interaction.isButton() && interaction.customId.startsWith("pagination_")) {
            const { handlePaginationInteraction } = require("../systems/paginationSystem");
            try {
                const handled = await handlePaginationInteraction(interaction, client.paginationData || {});
                if (handled) return;
            } catch (error) {
                console.error("Erreur pagination:", error);
            }
        }

        // Gestion des menus poll
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith("poll_")) {
            const pollCommand = require("../commands/polls/poll");
            
            if (interaction.customId === "poll_menu") {
                await pollCommand.handlePollInteraction(interaction, client);
            } else if (interaction.customId === "poll_end_select") {
                await pollCommand.handlePollSelect(interaction, client, "end");
            }
            return;
        }

        // Gestion des modals de polls
        if (interaction.isModalSubmit() && interaction.customId.startsWith("poll_")) {
            const pollCommand = require("../commands/polls/poll");
            
            if (interaction.customId.startsWith("poll_create_modal_")) {
                await pollCommand.handlePollModal(interaction, client);
                return;
            }
            
            if (interaction.customId.startsWith("poll_options_modal_")) {
                await pollCommand.handlePollOptionsModal(interaction, client);
                return;
            }
            return;
        }


        // Gestion des boutons de config
        if (interaction.isButton() && interaction.customId.startsWith("config_")) {
            const configCommand = require("../commands/utils/config");
            const { EmbedBuilder } = require("discord.js");
            
            try {
                if (interaction.customId === "config_back_main") {
                    await configCommand.showMainMenu(interaction, client);
                    return;
                }
                
                // Gérer les toggles de sécurité
                if (interaction.customId.startsWith("config_security_toggle_")) {
                    const feature = interaction.customId.replace("config_security_toggle_", "");
                    const featureKey = feature === "antinuke" ? "antiNuke" : feature === "antitoken" ? "antiToken" : "antiFile";
                    
                    if (!client.security) {
                        client.security = {};
                    }
                    if (!client.security[featureKey]) {
                        client.security[featureKey] = {};
                    }
                    
                    client.security[featureKey].enabled = !client.security[featureKey].enabled;
                    
                    const featureName = feature === "antinuke" ? "Anti-Nuke" : feature === "antitoken" ? "Anti-Token" : "Anti-Fichier";
                    const successEmbed = new EmbedBuilder()
                        .setTitle("✅ Configuration mise à jour")
                        .setDescription(`${featureName} a été ${client.security[featureKey].enabled ? "activé" : "désactivé"}.`)
                        .setColor(client.security[featureKey].enabled ? 0x00FF00 : 0xFF0000)
                        .setTimestamp();
                    
                    await interaction.update({ embeds: [successEmbed], components: [] });
                    return;
                }
                
                // Les autres boutons (reset_confirm, reset_cancel) sont déjà gérés plus haut
            } catch (error) {
                console.error("Erreur bouton config:", error);
            }
            return;
        }

        // Fonctions helper pour les retours (définies localement)
        async function showLogsMenu(interaction, client) {
            const configCommand = require("../commands/utils/config");
            // Utiliser la fonction du module config
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

            const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
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

        async function showTicketsMenu(interaction, client) {
            const configCommand = require("../commands/utils/config");
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

            const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
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

        async function showRolesMenu(interaction, client) {
            const configCommand = require("../commands/utils/config");
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

            const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
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

        async function showSecurityMenu(interaction, client) {
            const configCommand = require("../commands/utils/config");
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

            const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
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

        async function showAppearanceMenu(interaction, client) {
            const configCommand = require("../commands/utils/config");
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

            const { StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
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
    }
};
