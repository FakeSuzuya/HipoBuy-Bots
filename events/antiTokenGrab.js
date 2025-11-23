const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = (client) => {
    client.on("messageCreate", async (msg) => {
        if (!client.security?.antiToken?.enabled) return;
        if (!msg.guild || msg.author.bot) return;
        
        // Ignore les admins et les membres whitelistés
        if (msg.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
        if (client.security.whitelist.includes(msg.author.id)) return;

        const exp = client.security.antiToken.regex;

        if (exp.test(msg.content)) {
            try {
                await msg.delete().catch(() => {});

                // Timeout de 10 secondes
                await msg.member.timeout(10_000, "Anti Token Grab").catch(() => {});

                const logChannel = msg.guild.channels.cache.get(client.security.log);

                if (logChannel) {
                    await logChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("⚠️ TOKEN-GRAB DÉTECTÉ")
                                .setDescription(`Message suspect supprimé.\n**Auteur:** <@${msg.author.id}>`)
                                .addFields({ 
                                    name: "Contenu", 
                                    value: msg.content.length > 1024 
                                        ? msg.content.substring(0, 1021) + "..." 
                                        : msg.content || "Aucun contenu"
                                })
                                .setColor("Orange")
                                .setTimestamp()
                        ]
                    }).catch(() => {});
                }
            } catch (error) {
                console.error("Erreur antiTokenGrab:", error);
            }
        }
    });
};
