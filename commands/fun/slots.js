const {SlashCommandBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const gameSystem = require("../../systems/gameSystem");

module.exports = {
    category: "Jeux",
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("🎰 Machine à sous")
        .addIntegerOption(option =>
            option.setName("mise")
                .setDescription("Montant à miser")
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction, client) {
        const bet = interaction.options.getInteger("mise");

        const result = gameSystem.slots(interaction.guild.id, interaction.user.id, bet);

        if (!result.success) {
            return interaction.reply({
                content: `❌ ${result.error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        const slotsDisplay = `[ ${result.reels.join(" | ")} ]`;

        let description;
        if (result.won) {
            description = `🎉 **JACKPOT ! Vous avez gagné ${result.winnings} 💰 !**\n\n${slotsDisplay}\n\n**Multiplicateur:** x${result.multiplier}`;
        } else {
            description = `❌ **Vous avez perdu ${bet} 💰**\n\n${slotsDisplay}\n\nEssayez encore !`;
        }

        const embed = new EmbedBuilder()
            .setTitle("🎰 Machine à Sous")
            .setDescription(description)
            .setColor(result.won ? 0x00FF00 : 0xFF0000)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        gameSystem.recordGame(interaction.guild.id, interaction.user.id, "slots", result.won, bet);

        await interaction.reply({ embeds: [embed] });
    }
};

