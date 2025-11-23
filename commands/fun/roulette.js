const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const economySystem = require("../../systems/economySystem");
const gameSystem = require("../../systems/gameSystem");

module.exports = {
    category: "Jeux",
    data: new SlashCommandBuilder()
        .setName("roulette")
        .setDescription("🎰 Joue à la Roulette")
        .addIntegerOption(option =>
            option.setName("mise")
                .setDescription("Montant à miser")
                .setRequired(true)
                .setMinValue(10)
        )
        .addStringOption(option =>
            option.setName("type")
                .setDescription("Type de pari")
                .setRequired(true)
                .addChoices(
                    { name: "Numéro (0-36)", value: "number" },
                    { name: "Rouge", value: "red" },
                    { name: "Noir", value: "black" },
                    { name: "Pair", value: "even" },
                    { name: "Impair", value: "odd" },
                    { name: "Bas (1-18)", value: "low" },
                    { name: "Haut (19-36)", value: "high" }
                )
        )
        .addIntegerOption(option =>
            option.setName("valeur")
                .setDescription("Valeur du pari (pour type=number, 0-36)")
                .setMinValue(0)
                .setMaxValue(36)
        ),

    async execute(interaction, client) {
        const bet = interaction.options.getInteger("mise");
        const betType = interaction.options.getString("type");
        const betValue = interaction.options.getInteger("valeur");

        if (betType === "number" && betValue === null) {
            return interaction.reply({
                content: "❌ Vous devez spécifier une valeur (0-36) pour parier sur un numéro.",
                flags: MessageFlags.Ephemeral
            });
        }

        const account = economySystem.getAccount(interaction.guild.id, interaction.user.id);

        if (account.balance < bet) {
            return interaction.reply({
                content: "❌ Vous n'avez pas assez d'argent.",
                flags: MessageFlags.Ephemeral
            });
        }

        const result = gameSystem.spinRoulette(
            interaction.guild.id,
            interaction.user.id,
            bet,
            betType,
            betValue || 0
        );

        if (!result.success) {
            return interaction.reply({
                content: `❌ ${result.error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        const colorEmoji = result.isRed ? "🔴" : result.isBlack ? "⚫" : "🟢";
        const colorText = result.isRed ? "Rouge" : result.isBlack ? "Noir" : "Vert (0)";
        
        const embed = new EmbedBuilder()
            .setTitle("🎰 Roulette")
            .setDescription(`**Résultat:** ${colorEmoji} **${result.result}** (${colorText})`)
            .addFields(
                {
                    name: "🎲 Votre pari",
                    value: betType === "number" 
                        ? `Numéro **${betValue}**`
                        : betType === "red" ? "🔴 Rouge"
                        : betType === "black" ? "⚫ Noir"
                        : betType === "even" ? "Pair"
                        : betType === "odd" ? "Impair"
                        : betType === "low" ? "Bas (1-18)"
                        : "Haut (19-36)",
                    inline: true
                },
                {
                    name: "💰 Mise",
                    value: `${bet} 💰`,
                    inline: true
                },
                {
                    name: result.won ? "✅ Résultat" : "❌ Résultat",
                    value: result.won 
                        ? `**Gagné !** +${result.winnings} 💰`
                        : `**Perdu** -${bet} 💰`,
                    inline: true
                }
            )
            .setColor(result.won ? 0x00FF00 : 0xFF0000)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Joueur: ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

