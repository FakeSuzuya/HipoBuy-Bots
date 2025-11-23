const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

module.exports = async (channel, client) => {
    try {
        // Créer le dossier transcripts s'il n'existe pas
        const transcriptsDir = path.join(__dirname, "../transcripts");
        if (!fs.existsSync(transcriptsDir)) {
            fs.mkdirSync(transcriptsDir, { recursive: true });
        }

        // Récupérer tous les messages (par lots de 100)
        let allMessages = [];
        let lastId = null;
        let hasMore = true;

        while (hasMore) {
            const options = { limit: 100 };
            if (lastId) options.before = lastId;

            const messages = await channel.messages.fetch(options);
            if (messages.size === 0) {
                hasMore = false;
            } else {
                allMessages = allMessages.concat(Array.from(messages.values()));
                lastId = messages.last().id;
                if (messages.size < 100) hasMore = false;
            }
        }

        // Inverser pour avoir l'ordre chronologique
        allMessages.reverse();

        // Générer le contenu du transcript
        let content = `═══════════════════════════════════════\n`;
        content += `TRANSCRIPT DU TICKET\n`;
        content += `═══════════════════════════════════════\n\n`;
        content += `Salon: ${channel.name}\n`;
        content += `ID: ${channel.id}\n`;
        content += `Créé le: ${channel.createdAt.toLocaleString('fr-FR')}\n`;
        content += `Fermé le: ${new Date().toLocaleString('fr-FR')}\n`;
        content += `═══════════════════════════════════════\n\n`;

        allMessages.forEach(m => {
            const date = m.createdAt.toLocaleString('fr-FR');
            const author = m.author.tag;
            const contentMsg = m.content || "[Aucun contenu]";
            const attachments = m.attachments.size > 0 
                ? `\n[Pièces jointes: ${Array.from(m.attachments.values()).map(a => a.url).join(", ")}]` 
                : "";

            content += `[${date}] ${author}: ${contentMsg}${attachments}\n`;
        });

        // Sauvegarder le fichier
        const filePath = path.join(transcriptsDir, `${channel.id}.txt`);
        fs.writeFileSync(filePath, content, "utf-8");

        // Envoyer dans les logs
        const logChannel = channel.guild.channels.cache.get(client.config.logsTicket);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle("📄 Transcript du ticket")
                .setDescription(`**Salon:** ${channel.name}\n**ID:** ${channel.id}`)
                .setColor(0x5865F2)
                .setTimestamp();

            await logChannel.send({
                embeds: [embed],
                files: [filePath]
            }).catch(() => {});

            // Supprimer le fichier après envoi (optionnel)
            setTimeout(() => {
                fs.unlinkSync(filePath).catch(() => {});
            }, 5000);
        }
    } catch (error) {
        console.error("Erreur transcriptSystem:", error);
    }
};
