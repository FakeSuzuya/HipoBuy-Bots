const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = (client) => {
    client.on("messageCreate", async (message) => {
        if (!client.security?.antiFile?.enabled) return;
        if (!message.guild || message.author.bot) return;
        
        // Ignore les admins et les membres whitelistés
        if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;
        if (client.security.whitelist.includes(message.author.id)) return;

        if (message.attachments.size > 0) {
            const cfg = client.security.antiFile;
            const dangerousFile = message.attachments.find(file => {
                const fileName = file.name.toLowerCase();
                return cfg.bannedExtensions.some(ext => fileName.endsWith(`.${ext}`)) ||
                       cfg.bannedNames.some(bad => fileName.includes(bad));
            });

            if (dangerousFile) {
                try {
                    await message.delete();
                    
                    // Timeout (Mute) le membre 1 minute
                    await message.member.timeout(60_000, "Auto-Mod: Fichier malveillant détecté").catch(() => {});

                    const warningEmbed = new EmbedBuilder()
                        .setTitle("🛡️ Sécurité Automatique")
                        .setDescription(`**<@${message.author.id}>** a envoyé un fichier suspect.`)
                        .addFields({ name: "Fichier", value: dangerousFile.name })
                        .setColor("Red")
                        .setTimestamp();

                    // Envoi dans le salon actuel (supprimé après 10s)
                    message.channel.send({ embeds: [warningEmbed] })
                        .then(m => setTimeout(() => m.delete().catch(() => {}), 10000))
                        .catch(() => {});

                    // Logs
                    const logChannel = message.guild.channels.cache.get(client.config.logsMessage);
                    if (logChannel) {
                        logChannel.send({ embeds: [warningEmbed] }).catch(() => {});
                    }
                } catch (error) {
                    console.error("Erreur antiFile:", error);
                }
            }
        }
    });
};
