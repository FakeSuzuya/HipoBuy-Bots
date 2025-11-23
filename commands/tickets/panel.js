const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    category: "Tickets",
    data: new SlashCommandBuilder()
        .setName("ticket-panel")
        .setDescription("Envoie le panneau des tickets."),

    async execute(interaction, client) {
        // Utiliser la configuration dynamique ou les valeurs par défaut
        const categories = client.config.ticketCategories || {
            ticket_support: { name: "📘・support", emoji: "🛠️", label: "Support" },
            ticket_commercial: { name: "💼・commercial", emoji: "💼", label: "Commercial" },
            ticket_client: { name: "🛒・client", emoji: "🛒", label: "Client" }
        };

        const buttons = Object.entries(categories).map(([id, data]) => {
            const style = id.includes("support") ? ButtonStyle.Primary :
                          id.includes("commercial") ? ButtonStyle.Success :
                          id.includes("client") ? ButtonStyle.Secondary : ButtonStyle.Primary;
            
            return new ButtonBuilder()
                .setCustomId(id)
                .setLabel(typeof data === "string" ? id.replace("ticket_", "") : data.label)
                .setEmoji(typeof data === "string" ? "🎫" : data.emoji)
                .setStyle(style);
        });

        // Diviser en groupes de 5 (limite Discord)
        const rows = [];
        for (let i = 0; i < buttons.length; i += 5) {
            rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
        }

        const embed = new EmbedBuilder()
            .setTitle("🎫 Centre d'Assistance")
            .setDescription("Choisissez une catégorie ci-dessous pour créer un ticket.\n\nUn membre du staff vous répondra dans les plus brefs délais.\n\n💡 **Astuce:** Sélectionnez la catégorie qui correspond le mieux à votre demande.")
            .setColor(0x5865F2)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: "Cliquez sur un bouton pour créer un ticket" })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], components: rows });
    }
};
