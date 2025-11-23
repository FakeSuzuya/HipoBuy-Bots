const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require("discord.js");

/**
 * Système de pagination réutilisable pour les listes longues
 * @param {Object} options - Options de pagination
 * @param {Array} options.items - Liste des éléments à paginer
 * @param {Function} options.formatItem - Fonction pour formater chaque élément (item, index) => string
 * @param {String} options.title - Titre de l'embed
 * @param {String} options.description - Description de l'embed
 * @param {Number} options.itemsPerPage - Nombre d'éléments par page (défaut: 10)
 * @param {Number} options.color - Couleur de l'embed (défaut: 0x5865F2)
 * @param {Object} options.footer - Footer personnalisé
 * @param {Object} options.thumbnail - URL de la miniature
 * @param {Object} options.image - URL de l'image
 * @returns {Object} - Embed et composants de pagination
 */
function createPaginatedEmbed(options) {
    const {
        items = [],
        formatItem = (item, index) => `${index + 1}. ${item}`,
        title = "Liste",
        description = "",
        itemsPerPage = 10,
        color = 0x5865F2,
        footer = null,
        thumbnail = null,
        image = null
    } = options;

    const totalPages = Math.ceil(items.length / itemsPerPage);
    let currentPage = 0;

    function getPageContent(page) {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = items.slice(start, end);
        
        return pageItems.map((item, index) => formatItem(item, start + index)).join("\n") || "Aucun élément";
    }

    function createEmbed(page) {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description ? `${description}\n\n${getPageContent(page)}` : getPageContent(page))
            .setColor(color)
            .setFooter({
                text: footer || `Page ${page + 1}/${totalPages} • ${items.length} élément(s)`,
                iconURL: footer?.iconURL
            })
            .setTimestamp();

        if (thumbnail) embed.setThumbnail(thumbnail);
        if (image) embed.setImage(image);

        return embed;
    }

    function createComponents(page) {
        const row = new ActionRowBuilder();
        
        const firstButton = new ButtonBuilder()
            .setCustomId("pagination_first")
            .setLabel("⏮️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0);

        const prevButton = new ButtonBuilder()
            .setCustomId("pagination_prev")
            .setLabel("◀️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0);

        const nextButton = new ButtonBuilder()
            .setCustomId("pagination_next")
            .setLabel("▶️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1);

        const lastButton = new ButtonBuilder()
            .setCustomId("pagination_last")
            .setLabel("⏭️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1);

        const pageButton = new ButtonBuilder()
            .setCustomId("pagination_page")
            .setLabel(`${page + 1}/${totalPages}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        row.addComponents(firstButton, prevButton, pageButton, nextButton, lastButton);
        return [row];
    }

    return {
        embed: createEmbed(currentPage),
        components: createComponents(currentPage),
        totalPages,
        currentPage,
        updatePage: (newPage) => {
            currentPage = Math.max(0, Math.min(newPage, totalPages - 1));
            return {
                embed: createEmbed(currentPage),
                components: createComponents(currentPage)
            };
        }
    };
}

/**
 * Gérer les interactions de pagination
 * @param {Interaction} interaction - Interaction Discord
 * @param {Object} paginationData - Données de pagination (stockées par messageId)
 * @returns {Boolean} - True si l'interaction a été gérée
 */
async function handlePaginationInteraction(interaction, paginationData) {
    if (!interaction.isButton() || !interaction.customId.startsWith("pagination_")) {
        return false;
    }

    const messageId = interaction.message.id;
    const data = paginationData[messageId];
    
    if (!data) {
        return false;
    }

    const { items, formatItem, title, description, itemsPerPage, color, footer, thumbnail, image } = data;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    let currentPage = data.currentPage || 0;

    const action = interaction.customId.replace("pagination_", "");
    
    switch (action) {
        case "first":
            currentPage = 0;
            break;
        case "prev":
            currentPage = Math.max(0, currentPage - 1);
            break;
        case "next":
            currentPage = Math.min(totalPages - 1, currentPage + 1);
            break;
        case "last":
            currentPage = totalPages - 1;
            break;
        default:
            return false;
    }

    // Mettre à jour les données
    data.currentPage = currentPage;

    // Créer le nouvel embed et les composants
    const pagination = createPaginatedEmbed({
        items,
        formatItem,
        title,
        description,
        itemsPerPage,
        color,
        footer,
        thumbnail,
        image
    });

    // Forcer la page actuelle
    const updated = pagination.updatePage(currentPage);

    await interaction.update({
        embeds: [updated.embed],
        components: updated.components
    });

    return true;
}

module.exports = {
    createPaginatedEmbed,
    handlePaginationInteraction
};

