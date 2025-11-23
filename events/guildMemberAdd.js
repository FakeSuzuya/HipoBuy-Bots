const { Events } = require("discord.js");
const welcomeSystem = require("../systems/welcomeSystem");

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        const config = welcomeSystem.getWelcomeConfig(member.guild.id);
        
        if (!config.enabled || !config.channelId) return;

        try {
            const channel = await member.guild.channels.fetch(config.channelId).catch(() => null);
            if (!channel) return;

            const embed = welcomeSystem.createWelcomeEmbed(member.user, member.guild, config);
            await channel.send({ embeds: [embed] });

            // Attribuer les rôles automatiques
            if (config.autoRoles && config.autoRoles.length > 0) {
                for (const roleId of config.autoRoles) {
                    try {
                        const role = member.guild.roles.cache.get(roleId);
                        if (role && member.guild.members.me.roles.highest.position > role.position) {
                            await member.roles.add(role);
                        }
                    } catch (error) {
                        console.error(`Erreur attribution rôle ${roleId}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error("Erreur welcome:", error);
        }
    }
};

