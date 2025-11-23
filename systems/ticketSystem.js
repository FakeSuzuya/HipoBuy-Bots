const { EmbedBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require("discord.js");

async function handleButton(interaction, client) {
    if (!interaction.isButton()) return;

    // Utiliser la configuration dynamique ou les valeurs par défaut
    const categories = client.config.ticketCategories || {
        ticket_support: { name: "📘・support", emoji: "🛠️", label: "Support" },
        ticket_commercial: { name: "💼・commercial", emoji: "💼", label: "Commercial" },
        ticket_client: { name: "🛒・client", emoji: "🛒", label: "Client" }
    };

    const categoryData = categories[interaction.customId];
    if (!categoryData) return;
    
    const categoryName = typeof categoryData === "string" ? categoryData : categoryData.name;

    try {
        // Vérifier si l'utilisateur a déjà un ticket ouvert
        const categoryKey = categoryName.split("・")[1] || categoryName.toLowerCase();
        const existingTicket = interaction.guild.channels.cache.find(
            ch => ch.name.includes(interaction.user.username.toLowerCase()) && 
                  (ch.name.includes(categoryKey) || ch.name.includes(interaction.customId))
        );

        if (existingTicket) {
            return interaction.reply({ 
                content: `❌ Vous avez déjà un ticket ouvert : ${existingTicket}`, 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Créer un modal pour demander la raison
        const modal = new ModalBuilder()
            .setCustomId(`ticket_modal_${interaction.customId}`)
            .setTitle("Créer un ticket");

        const reasonInput = new TextInputBuilder()
            .setCustomId("ticket_reason")
            .setLabel("Raison du ticket")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Décrivez votre problème ou votre demande en détail...")
            .setRequired(true)
            .setMaxLength(1000)
            .setMinLength(10);

        const firstRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(firstRow);

        await interaction.showModal(modal);
    } catch (error) {
        console.error("Erreur handleButton:", error);
    }
}

// Gérer le modal de création de ticket
async function handleModal(interaction, client) {
    if (!interaction.isModalSubmit()) return;
    
    try {
        const modalId = interaction.customId;
        const categoryId = modalId.replace("ticket_modal_", "");
        const reason = interaction.fields.getTextInputValue("ticket_reason");
        
        // Utiliser la configuration dynamique
        const categories = client.config.ticketCategories || {
            ticket_support: { name: "📘・support", emoji: "🛠️", label: "Support" },
            ticket_commercial: { name: "💼・commercial", emoji: "💼", label: "Commercial" },
            ticket_client: { name: "🛒・client", emoji: "🛒", label: "Client" }
        };
        
        const categoryData = categories[categoryId];
        if (!categoryData) return;
        
        const categoryName = typeof categoryData === "string" ? categoryData : categoryData.name;
        
        // Préparer les permissions
        const permissionOverwrites = [
            { 
                id: interaction.guild.id, 
                deny: [PermissionFlagsBits.ViewChannel] 
            },
            { 
                id: interaction.user.id, 
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ] 
            },
            {
                id: client.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            }
        ];
        
        // Créer le ticket
        const channel = await interaction.guild.channels.create({
            name: `${categoryName}-${interaction.user.username}`.toLowerCase().replace(/\s+/g, '-').substring(0, 100),
            type: 0,
            parent: client.config.ticketCategoryId || null,
            permissionOverwrites: permissionOverwrites
        });

        const embed = new EmbedBuilder()
            .setTitle("🎟️ Ticket ouvert")
            .setDescription(`**Raison:**\n${reason}\n\n💡 Un membre du staff vous répondra dans les plus brefs délais.`)
            .addFields({ 
                name: "📋 Catégorie", 
                value: typeof categoryData === "string" ? categoryData : categoryData.label || categoryName,
                inline: true
            })
            .addFields({
                name: "👤 Créateur",
                value: `<@${interaction.user.id}>`,
                inline: true
            })
            .setColor(0x5865F2)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: "Utilisez /close pour fermer ce ticket" })
            .setTimestamp();

        await channel.send({
            content: `<@${interaction.user.id}>`,
            embeds: [embed]
        });

        // Ajouter un bouton de fermeture
        const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
        const closeButton = new ButtonBuilder()
            .setCustomId("close_ticket")
            .setLabel("Fermer le ticket")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🔒");

        const row = new ActionRowBuilder().addComponents(closeButton);
        await channel.send({ components: [row] });

        await interaction.reply({ 
            content: `🎉 Ticket créé : ${channel}`, 
            flags: MessageFlags.Ephemeral 
        });

        // Logs
        const logChannel = interaction.guild.channels.cache.get(client.config.logsTicket);
        if (logChannel) {
            await logChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🎫 Nouveau ticket créé")
                        .setDescription(`Un nouveau ticket a été créé par un utilisateur.`)
                        .addFields(
                            { name: "👤 Créateur", value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                            { name: "📋 Catégorie", value: typeof categoryData === "string" ? categoryData : categoryData.label || categoryName, inline: true },
                            { name: "📁 Salon", value: `${channel}`, inline: false }
                        )
                        .setColor(0x5865F2)
                        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                ]
            }).catch(() => {});
        }

        // Tracking analytics
        const analyticsSystem = require("../systems/analyticsSystem");
        analyticsSystem.trackEvent(interaction.guild.id, "tickets", {
            userId: interaction.user.id,
            category: categoryId
        });
    } catch (error) {
        console.error("Erreur handleModal:", error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
                content: "❌ Une erreur s'est produite lors de la création du ticket.", 
                flags: MessageFlags.Ephemeral 
            }).catch(() => {});
        } else {
            await interaction.reply({ 
                content: "❌ Une erreur s'est produite lors de la création du ticket.", 
                flags: MessageFlags.Ephemeral 
            }).catch(() => {});
        }
    }
}

module.exports = {
    handleButton,
    handleModal
};
