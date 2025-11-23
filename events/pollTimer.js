const pollSystem = require("../systems/pollSystem");
const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
    // Vérifier les polls toutes les 30 secondes
    setInterval(async () => {
        try {
            const allGuilds = client.guilds.cache;
            
            for (const [guildId, guild] of allGuilds) {
                const activePolls = pollSystem.getActivePolls(guildId);
                
                for (const poll of activePolls) {
                    if (poll.endsAt && poll.endsAt <= Date.now()) {
                        // Le poll est terminé
                        const endedPoll = pollSystem.endPoll(guildId, poll.id);
                        
                        if (endedPoll) {
                            try {
                                const channel = await guild.channels.fetch(poll.channelId).catch(() => null);
                                if (channel && poll.messageId) {
                                    const message = await channel.messages.fetch(poll.messageId).catch(() => null);
                                    if (message) {
                                        const creator = await client.users.fetch(poll.creatorId).catch(() => null);
                                        const embed = pollSystem.createPollEmbed(endedPoll, creator);
                                        await message.edit({ embeds: [embed], components: [] });
                                        
                                        // Annoncer la fin du poll
                                        const endEmbed = new EmbedBuilder()
                                            .setTitle("⏰ Sondage terminé")
                                            .setDescription(`Le sondage **${poll.question}** est maintenant terminé.`)
                                            .setColor(0xFFA500)
                                            .setTimestamp();
                                        
                                        await channel.send({ embeds: [endEmbed] });
                                    }
                                }
                            } catch (error) {
                                console.error("Erreur fin poll:", error);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Erreur pollTimer:", error);
        }
    }, 30000); // Vérifier toutes les 30 secondes
};

