const {SlashCommandBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const gameSystem = require("../../systems/gameSystem");

module.exports = {
    category: "Jeux",
    data: new SlashCommandBuilder()
        .setName("dice")
        .setDescription("🎲 Lancer de dés")
        .addIntegerOption(option =>
            option.setName("mise")
                .setDescription("Montant à miser")
                .setRequired(true)
                .setMinValue(1)
        )
        .addIntegerOption(option =>
            option.setName("nombre")
                .setDescription("Nombre sur lequel miser (1-6)")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(6)
        ),

    async execute(interaction, client) {
        const bet = interaction.options.getInteger("mise");
        const target = interaction.options.getInteger("nombre");

        const result = gameSystem.dice(interaction.guild.id, interaction.user.id, bet, target);

        if (!result.success) {
            return interaction.reply({
                content: `❌ ${result.error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = new EmbedBuilder()
            .setTitle("🎲 Lancer de Dés")
            .setDescription(result.won 
                ? `🎉 **Vous avez gagné ${result.winnings} 💰 !**\n\nVous avez misé sur **${target}** et le dé a fait **${result.result}** !`
                : `❌ **Vous avez perdu ${bet} 💰**\n\nVous avez misé sur **${target}** mais le dé a fait **${result.result}**...`)
            .setColor(result.won ? 0x00FF00 : 0xFF0000)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        gameSystem.recordGame(interaction.guild.id, interaction.user.id, "dice", result.won, bet);

        await interaction.reply({ embeds: [embed] });
    }
};

