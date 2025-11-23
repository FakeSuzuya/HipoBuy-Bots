const { Events } = require("discord.js");
const welcomeSystem = require("../systems/welcomeSystem");

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        const config = welcomeSystem.getGoodbyeConfig(member.guild.id);
        
        if (!config.enabled || !config.channelId) return;

        try {
            const channel = await member.guild.channels.fetch(config.channelId).catch(() => null);
            if (!channel) return;

            const embed = welcomeSystem.createGoodbyeEmbed(member.user, member.guild, config);
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Erreur goodbye:", error);
        }
    }
};

