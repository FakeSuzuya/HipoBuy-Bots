const {SlashCommandBuilder, EmbedBuilder, MessageFlags} = require("discord.js");
const gameSystem = require("../../systems/gameSystem");

module.exports = {
    category: "Jeux",
    data: new SlashCommandBuilder()
        .setName("rps")
        .setDescription("✂️ Pierre, papier, ciseaux")
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
                    { name: "Pierre", value: "rock" },
                    { name: "Papier", value: "paper" },
                    { name: "Ciseaux", value: "scissors" }
                )
        ),

    async execute(interaction, client) {
        const bet = interaction.options.getInteger("mise");
        const choice = interaction.options.getString("choix");

        const result = gameSystem.rps(interaction.guild.id, interaction.user.id, bet, choice);

        if (!result.success) {
            return interaction.reply({
                content: `❌ ${result.error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        const choiceEmoji = {
            rock: "🪨",
            paper: "📄",
            scissors: "✂️"
        };

        const choiceText = {
            rock: "Pierre",
            paper: "Papier",
            scissors: "Ciseaux"
        };

        let description;
        if (result.tie) {
            description = `🤝 **Égalité !**\n\nVous avez choisi **${choiceText[result.userChoice]}** ${choiceEmoji[result.userChoice]} et le bot aussi !\nVotre mise vous a été remboursée.`;
        } else if (result.won) {
            description = `🎉 **Vous avez gagné ${result.winnings} 💰 !**\n\nVous: **${choiceText[result.userChoice]}** ${choiceEmoji[result.userChoice]}\nBot: **${choiceText[result.botChoice]}** ${choiceEmoji[result.botChoice]}`;
        } else {
            description = `❌ **Vous avez perdu ${bet} 💰**\n\nVous: **${choiceText[result.userChoice]}** ${choiceEmoji[result.userChoice]}\nBot: **${choiceText[result.botChoice]}** ${choiceEmoji[result.botChoice]}`;
        }

        const embed = new EmbedBuilder()
            .setTitle("✂️ Pierre, Papier, Ciseaux")
            .setDescription(description)
            .setColor(result.won ? 0x00FF00 : result.tie ? 0xFFA500 : 0xFF0000)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        gameSystem.recordGame(interaction.guild.id, interaction.user.id, "rps", result.won, bet);

        await interaction.reply({ embeds: [embed] });
    }
};

