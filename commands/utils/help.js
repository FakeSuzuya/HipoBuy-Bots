const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const embedBuilder = require("../../systems/embedBuilder");

module.exports = {
    category: "Utilitaires",
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Affiche toutes les commandes du bot."),

    async execute(interaction, client) {
        const categories = {};

        client.commands.forEach(cmd => {
            const cat = cmd.category || "Autres";
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.data.name);
        });

        const embed = embedBuilder.createInfoEmbed(
            "Centre d'Aide",
            "Voici toutes les commandes disponibles sur ce serveur.\n\n💡 **Astuce:** Utilisez `/config` pour configurer le bot facilement depuis Discord.",
            {
                thumbnail: interaction.guild.iconURL({ dynamic: true }),
                footer: { text: `Total: ${client.commands.size} commande(s) disponible(s)` }
            }
        );

        Object.keys(categories).sort().forEach(c => {
            const commands = categories[c].map(x => `\`/${x}\``).join(", ");
            embed.addFields({
                name: `📂 ${c}`,
                value: commands || "Aucune commande",
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
};
