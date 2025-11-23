const {SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, MessageFlags} = require("discord.js");

module.exports = {
    category: "Roles",
    data: new SlashCommandBuilder()
        .setName("roles")
        .setDescription("Envoie le menu des rôles."),

    async execute(interaction, client) {
        // Utiliser la configuration dynamique ou les valeurs par défaut
        const roles = client.config.reactionRoles || {};

        if (Object.keys(roles).length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Aucun rôle configuré")
                .setDescription("Aucun rôle n'est actuellement configuré.\n\nUtilisez `/config` pour ajouter des rôles au menu.")
                .setColor(0xFF0000)
                .setTimestamp();

            return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
        }

        const options = Object.entries(roles).map(([id, data]) => {
            const role = interaction.guild.roles.cache.get(typeof data === "string" ? data : data.roleId);
            return {
                label: typeof data === "string" ? id : data.label,
                value: id,
                emoji: typeof data === "string" ? "🎭" : data.emoji,
                description: role ? `Rôle: ${role.name}` : "Rôle introuvable"
            };
        }).slice(0, 25); // Limite Discord

        const menu = new StringSelectMenuBuilder()
            .setCustomId("role_menu")
            .setPlaceholder("Choisissez vos rôles...")
            .addOptions(options);

        const embed = new EmbedBuilder()
            .setTitle("🎭 Rôles Réactifs")
            .setDescription("Sélectionnez les rôles que vous souhaitez obtenir en utilisant le menu ci-dessous.\n\nVous pouvez sélectionner plusieurs rôles à la fois.\n\n💡 **Astuce:** Les rôles peuvent être ajoutés ou retirés à tout moment.")
            .setColor(0x5865F2)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: "Utilisez le menu pour sélectionner vos rôles" })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
