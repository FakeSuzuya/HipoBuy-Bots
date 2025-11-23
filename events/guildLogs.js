module.exports = (client) => {

    /////////////////////////////////////////////////
    // 📌 MESSAGE DELETE
    /////////////////////////////////////////////////
    client.on("messageDelete", (msg) => {
        if (!msg.guild || msg.author?.bot) return;
        const log = msg.guild.channels.cache.get(client.config.logsMessage);
        if (!log) return;

        const content = msg.content || "Aucun texte";
        const truncatedContent = content.length > 1024 ? content.substring(0, 1021) + "..." : content;

        log.send({
            embeds: [{
                title: "🗑️ Message supprimé",
                description: `👤 Auteur : <@${msg.author.id}>\n📍 Salon : <#${msg.channel.id}>`,
                fields: [
                    { name: "Contenu", value: truncatedContent }
                ],
                color: 0xff3333,
                timestamp: new Date()
            }]
        }).catch(() => {});
    });

    /////////////////////////////////////////////////
    // ✏️ MESSAGE UPDATE
    /////////////////////////////////////////////////
    client.on("messageUpdate", (oldMsg, newMsg) => {
        if (!newMsg.guild || newMsg.author?.bot) return;
        if (oldMsg.content === newMsg.content) return;

        const log = newMsg.guild.channels.cache.get(client.config.logsMessage);
        if (!log) return;

        const oldContent = oldMsg.content || "Vide";
        const newContent = newMsg.content || "Vide";
        const truncatedOld = oldContent.length > 512 ? oldContent.substring(0, 509) + "..." : oldContent;
        const truncatedNew = newContent.length > 512 ? newContent.substring(0, 509) + "..." : newContent;

        log.send({
            embeds: [{
                title: "✏️ Message modifié",
                description: `👤 Auteur : <@${newMsg.author.id}>\n📍 Salon : <#${newMsg.channel.id}>`,
                fields: [
                    { name: "Avant", value: truncatedOld },
                    { name: "Après", value: truncatedNew }
                ],
                color: 0xffcc00,
                timestamp: new Date()
            }]
        }).catch(() => {});
    });

    /////////////////////////////////////////////////
    // 👋 MEMBER JOIN
    /////////////////////////////////////////////////
    client.on("guildMemberAdd", (member) => {
        const log = member.guild.channels.cache.get(client.config.logsMember || client.config.logsMessage);
        if (!log) return;

        log.send({
            embeds: [{
                title: "👋 Nouveau membre",
                description: `<@${member.id}> a rejoint le serveur.`,
                thumbnail: { url: member.user.displayAvatarURL() },
                color: 0x33ff33,
                timestamp: new Date()
            }]
        }).catch(() => {});

        // Tracking analytics
        const analyticsSystem = require("../systems/analyticsSystem");
        analyticsSystem.trackEvent(member.guild.id, "joins", {
            userId: member.id
        });
    });

    /////////////////////////////////////////////////
    // 🚪 MEMBER LEAVE
    /////////////////////////////////////////////////
    client.on("guildMemberRemove", (member) => {
        const log = member.guild.channels.cache.get(client.config.logsMember || client.config.logsMessage);
        if (!log) return;

        log.send({
            embeds: [{
                title: "🚪 Membre parti",
                description: `<@${member.id}> a quitté le serveur.`,
                color: 0xff9900,
                timestamp: new Date()
            }]
        }).catch(() => {});

        // Tracking analytics
        const analyticsSystem = require("../systems/analyticsSystem");
        analyticsSystem.trackEvent(member.guild.id, "leaves", {
            userId: member.id
        });
    });

    /////////////////////////////////////////////////
    // 🎭 ROLE ADD / REMOVE
    /////////////////////////////////////////////////
    client.on("guildMemberUpdate", (oldMember, newMember) => {
        const log = newMember.guild.channels.cache.get(client.config.logsRole || client.config.logsMessage);
        if (!log) return;

        // Role ajouté
        const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
        // Role retiré
        const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

        added.forEach(role => {
            log.send({
                embeds: [{
                    title: "➕ Rôle ajouté",
                    description: `👤 <@${newMember.id}>\n🎭 Rôle : <@&${role.id}>`,
                    color: 0x33ccff,
                    timestamp: new Date()
                }]
            }).catch(() => {});
        });

        removed.forEach(role => {
            log.send({
                embeds: [{
                    title: "➖ Rôle retiré",
                    description: `👤 <@${newMember.id}>\n🎭 Rôle : <@&${role.id}>`,
                    color: 0xff3333,
                    timestamp: new Date()
                }]
            }).catch(() => {});
        });
    });

    /////////////////////////////////////////////////
    // 📁 CHANNEL CREATE
    /////////////////////////////////////////////////
    client.on("channelCreate", (channel) => {
        const log = channel.guild.channels.cache.get(client.config.logsChannel || client.config.logsMessage);
        if (!log) return;

        log.send({
            embeds: [{
                title: "📁 Salon créé",
                description: `📌 Nom : **${channel.name}**\n🆔 ID : ${channel.id}`,
                color: 0x66ff66,
                timestamp: new Date()
            }]
        }).catch(() => {});
    });

    /////////////////////////////////////////////////
    // 🗑️ CHANNEL DELETE
    /////////////////////////////////////////////////
    client.on("channelDelete", (channel) => {
        const log = channel.guild.channels.cache.get(client.config.logsChannel || client.config.logsMessage);
        if (!log) return;

        log.send({
            embeds: [{
                title: "🗑️ Salon supprimé",
                description: `📌 Nom : **${channel.name}**\n🆔 ID : ${channel.id}`,
                color: 0xff3333,
                timestamp: new Date()
            }]
        }).catch(() => {});
    });

    /////////////////////////////////////////////////
    // ✏️ CHANNEL UPDATE (nom modifié)
    /////////////////////////////////////////////////
    client.on("channelUpdate", (oldCh, newCh) => {
        const log = newCh.guild.channels.cache.get(client.config.logsChannel || client.config.logsMessage);
        if (!log) return;

        if (oldCh.name !== newCh.name) {
            log.send({
                embeds: [{
                    title: "✏️ Salon renommé",
                    fields: [
                        { name: "Avant", value: oldCh.name },
                        { name: "Après", value: newCh.name }
                    ],
                    color: 0xffeb3b,
                    timestamp: new Date()
                }]
            }).catch(() => {});
        }
    });

    /////////////////////////////////////////////////
    // 🏰 GUILD UPDATE (nom du serveur)
    /////////////////////////////////////////////////
    client.on("guildUpdate", (oldGuild, newGuild) => {
        const log = newGuild.channels.cache.get(client.config.logsGuild || client.config.logsMessage);
        if (!log) return;

        if (oldGuild.name !== newGuild.name) {
            log.send({
                embeds: [{
                    title: "🏰 Nom du serveur modifié",
                    fields: [
                        { name: "Avant", value: oldGuild.name },
                        { name: "Après", value: newGuild.name }
                    ],
                    color: 0x03a9f4,
                    timestamp: new Date()
                }]
            }).catch(() => {});
        }
    });

    /////////////////////////////////////////////////
    // 🔨 BAN
    /////////////////////////////////////////////////
    client.on("guildBanAdd", (ban) => {
        const log = ban.guild.channels.cache.get(client.config.logsBan || client.config.logsMessage);
        if (!log) return;

        log.send({
            embeds: [{
                title: "🔨 Membre banni",
                description: `👤 ${ban.user.tag} (${ban.user.id})`,
                color: 0xff0000,
                timestamp: new Date()
            }]
        }).catch(() => {});
    });

    /////////////////////////////////////////////////
    // 🕊️ UNBAN
    /////////////////////////////////////////////////
    client.on("guildBanRemove", (ban) => {
        const log = ban.guild.channels.cache.get(client.config.logsBan || client.config.logsMessage);
        if (!log) return;

        log.send({
            embeds: [{
                title: "🕊️ Membre débanni",
                description: `👤 ${ban.user.tag} (${ban.user.id})`,
                color: 0x66bb6a,
                timestamp: new Date()
            }]
        }).catch(() => {});
    });

};
