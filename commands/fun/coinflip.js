const {SlashCommandBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const gameSystem = require("../../systems/gameSystem");

module.exports = {
    category: "Jeux",
    data: new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("🪙 Pile ou face")
        .addIntegerOption(option =>
            option.setName("mise")
                .setDescription("Montant à miser")
                .setRequired(true)
                .setMinValue(1)
        )
        .addStringOption(option =>
            option.setName("choix")
                .setDescription("Votre choix")
                .setRequired(true)
                .addChoices(
                    { name: "Pile", value: "heads" },
                    { name: "Face", value: "tails" }
                )
        ),

    async execute(interaction, client) {
        const bet = interaction.options.getInteger("mise");
        const choice = interaction.options.getString("choix");

        const result = gameSystem.coinflip(interaction.guild.id, interaction.user.id, bet, choice);

        if (!result.success) {
            return interaction.reply({
                content: `❌ ${result.error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        const choiceText = choice === "heads" ? "Pile" : "Face";
        const resultText = result.result === "heads" ? "Pile" : "Face";

        const embed = new EmbedBuilder()
            .setTitle("🪙 Pile ou Face")
            .setDescription(result.won 
                ? `🎉 **Vous avez gagné ${result.winnings} 💰 !**\n\nVous avez choisi **${choiceText}** et c'était **${resultText}** !`
                : `❌ **Vous avez perdu ${bet} 💰**\n\nVous avez choisi **${choiceText}** mais c'était **${resultText}**...`)
            .setColor(result.won ? 0x00FF00 : 0xFF0000)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        gameSystem.recordGame(interaction.guild.id, interaction.user.id, "coinflip", result.won, bet);

        await interaction.reply({ embeds: [embed] });
    }
};

