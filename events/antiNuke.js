const { EmbedBuilder, AuditLogEvent } = require("discord.js");

module.exports = (client) => {
    const track = async (guild, executorId, actionType) => {
        if (!client.security?.antiNuke?.enabled) return;
        if (!executorId || executorId === client.user.id) return;
        if (client.security.whitelist.includes(executorId)) return;

        const cfg = client.security.antiNuke;
        const now = Date.now();

        if (!cfg.actions.has(executorId)) {
            cfg.actions.set(executorId, []);
        }

        let actions = cfg.actions.get(executorId).filter(t => now - t < cfg.timeframe);
        actions.push(now);
        cfg.actions.set(executorId, actions);

        if (actions.length >= cfg.maxActions) {
            cfg.actions.set(executorId, []);

            try {
                const member = await guild.members.fetch(executorId).catch(() => null);
                if (!member) return;

                // Vérifier que le bot peut bannir
                if (!member.bannable) {
                    console.warn(`⚠️ Impossible de bannir ${executorId} (permissions insuffisantes)`);
                    return;
                }

                await guild.members.ban(executorId, { 
                    reason: `Anti-Nuke - ${actions.length} actions en ${cfg.timeframe}ms` 
                });

                const logChannel = guild.channels.cache.get(client.security.log);
                if (logChannel) {
                    await logChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("🚨 ANTI-NUKE ACTIVÉ")
                                .setDescription(`**<@${executorId}>** a été banni pour activité type Nuke.`)
                                .addFields({ name: "Action détectée", value: actionType })
                                .addFields({ name: "Actions", value: `${actions.length}/${cfg.maxActions}` })
                                .setColor("Red")
                                .setTimestamp()
                        ]
                    }).catch(() => {});
                }
            } catch (error) {
                console.error("Erreur antiNuke:", error);
            }
        }
    };

    client.on("channelDelete", async (channel) => {
        if (!channel.guild) return;
        try {
            const audit = await channel.guild.fetchAuditLogs({ 
                type: AuditLogEvent.ChannelDelete, 
                limit: 1 
            });
            const entry = audit.entries.first();
            if (entry && entry.executor) {
                await track(channel.guild, entry.executor.id, "Suppression de salon");
            }
        } catch (error) {
            console.error("Erreur channelDelete:", error);
        }
    });

    client.on("roleDelete", async (role) => {
        if (!role.guild) return;
        try {
            const audit = await role.guild.fetchAuditLogs({ 
                type: AuditLogEvent.RoleDelete, 
                limit: 1 
            });
            const entry = audit.entries.first();
            if (entry && entry.executor) {
                await track(role.guild, entry.executor.id, "Suppression de rôle");
            }
        } catch (error) {
            console.error("Erreur roleDelete:", error);
        }
    });

    client.on("guildBanAdd", async (ban) => {
        if (!ban.guild) return;
        try {
            const audit = await ban.guild.fetchAuditLogs({ 
                type: AuditLogEvent.MemberBanAdd, 
                limit: 1 
            });
            const entry = audit.entries.first();
            if (entry && entry.executor) {
                await track(ban.guild, entry.executor.id, "Ban massif");
            }
        } catch (error) {
            console.error("Erreur guildBanAdd:", error);
        }
    });
};
