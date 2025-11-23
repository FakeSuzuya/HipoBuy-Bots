const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require("discord.js");
const economySystem = require("../../systems/economySystem");
const gameSystem = require("../../systems/gameSystem");

module.exports = {
    category: "Jeux",
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("🃏 Joue au Blackjack")
        .addIntegerOption(option =>
            option.setName("mise")
                .setDescription("Montant à miser")
                .setRequired(true)
                .setMinValue(10)
        ),

    async execute(interaction, client) {
        const bet = interaction.options.getInteger("mise");
        const account = economySystem.getAccount(interaction.guild.id, interaction.user.id);

        if (account.balance < bet) {
            return interaction.reply({
                content: "❌ Vous n'avez pas assez d'argent.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Créer une partie de blackjack
        const game = gameSystem.createBlackjackGame(interaction.guild.id, interaction.user.id, bet);

        if (!game) {
            return interaction.reply({
                content: "❌ Impossible de créer la partie.",
                flags: MessageFlags.Ephemeral
            });
        }

        const embed = createGameEmbed(game, interaction.user);
        const buttons = createGameButtons(game);

        await interaction.reply({ embeds: [embed], components: buttons });
    }
};

function createGameEmbed(game, user) {
    const dealerCards = game.dealerCards.map((card, index) => 
        index === 0 && !game.dealerRevealed ? "🂠" : getCardEmoji(card)
    ).join(" ");
    
    const playerCards = game.playerCards.map(card => getCardEmoji(card)).join(" ");

    const embed = new EmbedBuilder()
        .setTitle("🃏 Blackjack")
        .setDescription(`**Mise:** ${game.bet} 💰`)
        .addFields(
            {
                name: "🃏 Croupier",
                value: `${dealerCards}\n**Total:** ${game.dealerRevealed ? game.dealerValue : "?"}`,
                inline: true
            },
            {
                name: "👤 Vous",
                value: `${playerCards}\n**Total:** ${game.playerValue}`,
                inline: true
            }
        )
        .setColor(0x5865F2)
        .setFooter({ text: `Joueur: ${user.tag}` })
        .setTimestamp();

    if (game.status === "won") {
        embed.setDescription(`**🎉 Vous avez gagné ${game.bet * 2} 💰 !**`);
        embed.setColor(0x00FF00);
    } else if (game.status === "lost") {
        embed.setDescription(`**❌ Vous avez perdu ${game.bet} 💰.**`);
        embed.setColor(0xFF0000);
    } else if (game.status === "blackjack") {
        embed.setDescription(`**🎉 BLACKJACK ! Vous avez gagné ${Math.floor(game.bet * 2.5)} 💰 !**`);
        embed.setColor(0xFFD700);
    } else if (game.status === "bust") {
        embed.setDescription(`**💥 Vous avez dépassé 21 ! Vous avez perdu ${game.bet} 💰.**`);
        embed.setColor(0xFF0000);
    }

    return embed;
}

function createGameButtons(game) {
    if (game.status !== "playing") {
        return [];
    }

    const hitButton = new ButtonBuilder()
        .setCustomId(`blackjack_hit_${game.id}`)
        .setLabel("Tirer")
        .setStyle(ButtonStyle.Success)
        .setEmoji("➕");

    const standButton = new ButtonBuilder()
        .setCustomId(`blackjack_stand_${game.id}`)
        .setLabel("Rester")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✋");

    return [new ActionRowBuilder().addComponents(hitButton, standButton)];
}

function getCardEmoji(card) {
    const suits = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
    const values = { "A": "ace", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10", "J": "jack", "Q": "queen", "K": "king" };
    
    // Utiliser des emojis Unicode pour les cartes
    const cardEmojis = {
        "A♠": "🂡", "A♥": "🂱", "A♦": "🃁", "A♣": "🃑",
        "2♠": "🂢", "2♥": "🂲", "2♦": "🃂", "2♣": "🃒",
        "3♠": "🂣", "3♥": "🂳", "3♦": "🃃", "3♣": "🃓",
        "4♠": "🂤", "4♥": "🂴", "4♦": "🃄", "4♣": "🃔",
        "5♠": "🂥", "5♥": "🂵", "5♦": "🃅", "5♣": "🃕",
        "6♠": "🂦", "6♥": "🂶", "6♦": "🃆", "6♣": "🃖",
        "7♠": "🂧", "7♥": "🂷", "7♦": "🃇", "7♣": "🃗",
        "8♠": "🂨", "8♥": "🂸", "8♦": "🃈", "8♣": "🃘",
        "9♠": "🂩", "9♥": "🂹", "9♦": "🃉", "9♣": "🃙",
        "10♠": "🂪", "10♥": "🂺", "10♦": "🃊", "10♣": "🃚",
        "J♠": "🂫", "J♥": "🂻", "J♦": "🃋", "J♣": "🃛",
        "Q♠": "🂭", "Q♥": "🂽", "Q♦": "🃍", "Q♣": "🃝",
        "K♠": "🂮", "K♥": "🂾", "K♦": "🃎", "K♣": "🃞"
    };

    return cardEmojis[card] || "🂠";
}

module.exports.createGameEmbed = createGameEmbed;
module.exports.createGameButtons = createGameButtons;

