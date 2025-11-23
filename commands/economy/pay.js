const {SlashCommandBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const economySystem = require("../../systems/economySystem");

module.exports = {
    category: "Économie",
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("💸 Transfère de l'argent à un utilisateur")
        .addUserOption(option =>
            option.setName("utilisateur")
                .setDescription("Utilisateur à qui donner de l'argent")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("montant")
                .setDescription("Montant à transférer")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction, client) {
        const target = interaction.options.getUser("utilisateur");
        const amount = interaction.options.getInteger("montant");

        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: "❌ Vous ne pouvez pas vous donner de l'argent à vous-même.",
                flags: MessageFlags.Ephemeral
            });
        }

        if (target.bot) {
            return interaction.reply({
                content: "❌ Vous ne pouvez pas donner de l'argent à un bot.",
                flags: MessageFlags.Ephemeral
            });
        }

        const success = economySystem.transferMoney(
            interaction.guild.id,
            interaction.user.id,
            target.id,
            amount
        );

        if (!success) {
            return interaction.reply({
                content: "❌ Solde insuffisant.",
                flags: MessageFlags.Ephemeral
            });
        }

        const senderStats = economySystem.getStats(interaction.guild.id, interaction.user.id);
        const receiverStats = economySystem.getStats(interaction.guild.id, target.id);

        const embed = new EmbedBuilder()
            .setTitle("💸 Transfert effectué")
            .setDescription(`**${interaction.user}** a transféré **${amount} 💰** à **${target}**`)
            .addFields(
                { name: "👤 Expéditeur", value: `${interaction.user.tag}\nSolde: ${senderStats.balance} 💰`, inline: true },
                { name: "👤 Destinataire", value: `${target.tag}\nSolde: ${receiverStats.balance} 💰`, inline: true }
            )
            .setColor(0x00FF00)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

