const giveawaySystem = require("../systems/giveawaySystem");

module.exports = (client) => {
    // Vérifier les giveaways toutes les 30 secondes
    setInterval(async () => {
        try {
            const allGuilds = client.guilds.cache;
            
            for (const [guildId, guild] of allGuilds) {
                const activeGiveaways = giveawaySystem.getActiveGiveaways(guildId);
                
                for (const giveaway of activeGiveaways) {
                    if (giveaway.endsAt <= Date.now()) {
                        // Le giveaway est terminé
                        const endedGiveaway = giveawaySystem.endGiveaway(guildId, giveaway.id);
                        
                        if (endedGiveaway) {
                            try {
                                const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
                                if (channel && giveaway.messageId) {
                                    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
                                    if (message) {
                                        const embed = giveawaySystem.createGiveawayEmbed(endedGiveaway, null);
                                        await message.edit({ embeds: [embed], components: [] });
                                        
                                        // Annoncer le gagnant
                                        const { EmbedBuilder } = require("discord.js");
                                        const notificationSystem = require("../systems/notificationSystem");
                                        
                                        if (endedGiveaway.winnerId) {
                                            const winnerEmbed = new EmbedBuilder()
                                                .setTitle("🎉 Giveaway terminé !")
                                                .setDescription(`**Prix:** ${endedGiveaway.prize}\n\n🏆 **Gagnant:** <@${endedGiveaway.winnerId}>`)
                                                .setColor(0x00FF00)
                                                .setTimestamp();
                                            
                                            await channel.send({ embeds: [winnerEmbed] });
                                            
                                            // Envoyer une notification en MP au gagnant
                                            try {
                                                const winner = await guild.members.fetch(endedGiveaway.winnerId).catch(() => null);
                                                if (winner) {
                                                    await notificationSystem.notifyGiveawayWin(winner.user, endedGiveaway).catch(() => {});
                                                }
                                            } catch (error) {
                                                console.error("Erreur notification gagnant:", error);
                                            }
                                        } else {
                                            const noWinnerEmbed = new EmbedBuilder()
                                                .setTitle("🎁 Giveaway terminé")
                                                .setDescription(`**Prix:** ${endedGiveaway.prize}\n\n❌ Aucun participant.`)
                                                .setColor(0xFFA500)
                                                .setTimestamp();
                                            
                                            await channel.send({ embeds: [noWinnerEmbed] });
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error("Erreur fin giveaway:", error);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Erreur giveawayTimer:", error);
        }
    }, 30000); // Vérifier toutes les 30 secondes
};

