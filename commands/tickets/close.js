const {SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags} = require("discord.js");

module.exports = {
    category: "Tickets",
    data: new SlashCommandBuilder()
        .setName("close")
        .setDescription("Fermer le ticket actuel."),

    async execute(interaction, client) {
        // Vérifier que c'est bien un ticket
        if (!interaction.channel.name.includes("support") && 
            !interaction.channel.name.includes("commercial") && 
            !interaction.channel.name.includes("client")) {
            return interaction.reply({ 
                content: "❌ Cette commande ne peut être utilisée que dans un ticket.", 
                flags: MessageFlags.Ephemeral 
            });
        }

        try {
            const { EmbedBuilder } = require("discord.js");
            
            const closingEmbed = new EmbedBuilder()
                .setTitle("⏳ Fermeture du ticket")
                .setDescription("Le ticket est en cours de fermeture...\n\n📄 Le transcript sera généré et envoyé dans les logs.")
                .setColor(0xFFA500)
                .setTimestamp();

            await interaction.reply({ embeds: [closingEmbed], flags: MessageFlags.Ephemeral });

            // Générer le transcript
            const transcriptSystem = require("../../systems/transcriptSystem");
            await transcriptSystem(interaction.channel, client);

            // Attendre un peu pour que le transcript soit envoyé
            setTimeout(async () => {
                try {
                    const finalEmbed = new EmbedBuilder()
                        .setTitle("✅ Ticket fermé")
                        .setDescription("Ce ticket a été fermé et archivé.")
                        .setColor(0x00FF00)
                        .setTimestamp();
                    
                    await interaction.channel.send({ embeds: [finalEmbed] }).catch(() => {});
                    
                    setTimeout(async () => {
                        await interaction.channel.delete().catch(() => {});
                    }, 2000);
                } catch (error) {
                    console.error("Erreur lors de la suppression du ticket:", error);
                }
            }, 3000);
        } catch (error) {
            console.error("Erreur lors de la fermeture du ticket:", error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: "❌ Une erreur s'est produite lors de la fermeture du ticket.", 
                    flags: MessageFlags.Ephemeral 
                }).catch(() => {});
            } else {
                await interaction.reply({ 
                    content: "❌ Une erreur s'est produite lors de la fermeture du ticket.", 
                    flags: MessageFlags.Ephemeral 
                }).catch(() => {});
            }
        }
    }
};
