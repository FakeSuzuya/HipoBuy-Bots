const fs = require("fs");
const path = require("path");
const economySystem = require("./economySystem");

const dataPath = path.join(__dirname, "../data/games.json");

function initDataFile() {
    const dataDir = path.join(__dirname, "../data");
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({}), "utf-8");
    }
}

function loadData() {
    initDataFile();
    try {
        return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } catch {
        return {};
    }
}

function saveData(data) {
    initDataFile();
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}

// Pile ou face
function coinflip(guildId, userId, bet, choice) {
    const account = economySystem.getAccount(guildId, userId);
    
    if (account.balance < bet) {
        return { success: false, error: "Solde insuffisant" };
    }
    
    // Retirer la mise
    economySystem.removeMoney(guildId, userId, bet);
    
    // Lancer la pièce
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = result === choice;
    
    if (won) {
        const winnings = bet * 2; // Double la mise
        economySystem.addMoney(guildId, userId, winnings, "coinflip_win");
        return { success: true, won: true, result, winnings };
    } else {
        return { success: true, won: false, result, winnings: 0 };
    }
}

// Lancer de dés
function dice(guildId, userId, bet, target) {
    const account = economySystem.getAccount(guildId, userId);
    
    if (account.balance < bet) {
        return { success: false, error: "Solde insuffisant" };
    }
    
    if (target < 1 || target > 6) {
        return { success: false, error: "Le nombre doit être entre 1 et 6" };
    }
    
    // Retirer la mise
    economySystem.removeMoney(guildId, userId, bet);
    
    // Lancer le dé
    const result = Math.floor(Math.random() * 6) + 1;
    const won = result === target;
    
    if (won) {
        const winnings = bet * 6; // 6x la mise
        economySystem.addMoney(guildId, userId, winnings, "dice_win");
        return { success: true, won: true, result, winnings };
    } else {
        return { success: true, won: false, result, winnings: 0 };
    }
}

// Pierre, papier, ciseaux
function rps(guildId, userId, bet, choice) {
    const account = economySystem.getAccount(guildId, userId);
    
    if (account.balance < bet) {
        return { success: false, error: "Solde insuffisant" };
    }
    
    const choices = ["rock", "paper", "scissors"];
    if (!choices.includes(choice)) {
        return { success: false, error: "Choix invalide (rock, paper, scissors)" };
    }
    
    // Retirer la mise
    economySystem.removeMoney(guildId, userId, bet);
    
    // Choix du bot
    const botChoice = choices[Math.floor(Math.random() * 3)];
    
    let won = false;
    if (choice === "rock" && botChoice === "scissors") won = true;
    if (choice === "paper" && botChoice === "rock") won = true;
    if (choice === "scissors" && botChoice === "paper") won = true;
    
    if (won) {
        const winnings = bet * 2;
        economySystem.addMoney(guildId, userId, winnings, "rps_win");
        return { success: true, won: true, userChoice: choice, botChoice, winnings };
    } else if (choice === botChoice) {
        // Égalité, rembourser
        economySystem.addMoney(guildId, userId, bet, "rps_tie");
        return { success: true, won: false, tie: true, userChoice: choice, botChoice, winnings: 0 };
    } else {
        return { success: true, won: false, userChoice: choice, botChoice, winnings: 0 };
    }
}

// Machine à sous
function slots(guildId, userId, bet) {
    const account = economySystem.getAccount(guildId, userId);
    
    if (account.balance < bet) {
        return { success: false, error: "Solde insuffisant" };
    }
    
    // Retirer la mise
    economySystem.removeMoney(guildId, userId, bet);
    
    // Symboles
    const symbols = ["🍒", "🍋", "🍊", "🍇", "🍉", "⭐", "💎"];
    
    // Générer 3 symboles
    const reels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
    ];
    
    // Calculer les gains
    let multiplier = 0;
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
        // 3 identiques
        if (reels[0] === "💎") multiplier = 10;
        else if (reels[0] === "⭐") multiplier = 5;
        else multiplier = 3;
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        // 2 identiques
        multiplier = 1.5;
    }
    
    const winnings = Math.floor(bet * multiplier);
    
    if (winnings > 0) {
        economySystem.addMoney(guildId, userId, winnings, "slots_win");
    }
    
    return {
        success: true,
        reels,
        won: winnings > 0,
        winnings,
        multiplier
    };
}

// Obtenir les statistiques de jeux
function getGameStats(guildId, userId) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        return {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            totalWinnings: 0,
            totalLosses: 0
        };
    }
    
    return data[key];
}

// Enregistrer une partie
function recordGame(guildId, userId, gameType, won, amount) {
    const data = loadData();
    const key = `${guildId}-${userId}`;
    
    if (!data[key]) {
        data[key] = {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            totalWinnings: 0,
            totalBet: 0
        };
    }
    
    data[key].totalGames++;
    if (won) {
        data[key].totalWins++;
        data[key].totalWinnings += amount;
    } else {
        data[key].totalLosses++;
    }
    data[key].totalBet += amount;
    
    saveData(data);
}

// Blackjack
function createBlackjackGame(guildId, userId, bet) {
    const account = economySystem.getAccount(guildId, userId);
    
    if (account.balance < bet) {
        return null;
    }

    const gameId = Date.now().toString();
    const suits = ["♠", "♥", "♦", "♣"];
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    
    // Créer un jeu de 52 cartes
    const deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push(value + suit);
        }
    }
    
    // Mélanger le jeu
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    // Distribuer les cartes
    const playerCards = [deck.pop(), deck.pop()];
    const dealerCards = [deck.pop(), deck.pop()];
    
    const game = {
        id: gameId,
        guildId,
        userId,
        bet,
        deck,
        playerCards,
        dealerCards,
        playerValue: calculateBlackjackValue(playerCards),
        dealerValue: calculateBlackjackValue([dealerCards[0]]), // Seulement la première carte visible
        dealerRevealed: false,
        status: "playing" // playing, won, lost, blackjack, bust
    };
    
    // Vérifier blackjack
    if (game.playerValue === 21) {
        game.status = "blackjack";
        const winnings = Math.floor(bet * 2.5);
        economySystem.addMoney(guildId, userId, winnings, "blackjack_win");
    }
    
    // Sauvegarder le jeu
    const data = loadData();
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId].blackjack) data[guildId].blackjack = {};
    data[guildId].blackjack[gameId] = game;
    saveData(data);
    
    return game;
}

function hitBlackjack(guildId, gameId, userId) {
    const data = loadData();
    const game = data[guildId]?.blackjack?.[gameId];
    
    if (!game || game.userId !== userId || game.status !== "playing") {
        return null;
    }
    
    // Tirer une carte
    if (game.deck.length === 0) {
        return null; // Plus de cartes
    }
    
    game.playerCards.push(game.deck.pop());
    game.playerValue = calculateBlackjackValue(game.playerCards);
    
    // Vérifier si dépassé
    if (game.playerValue > 21) {
        game.status = "bust";
    }
    
    saveData(data);
    return game;
}

function standBlackjack(guildId, gameId, userId) {
    const data = loadData();
    const game = data[guildId]?.blackjack?.[gameId];
    
    if (!game || game.userId !== userId || game.status !== "playing") {
        return null;
    }
    
    // Révéler les cartes du croupier
    game.dealerRevealed = true;
    game.dealerValue = calculateBlackjackValue(game.dealerCards);
    
    // Le croupier tire jusqu'à 17
    while (game.dealerValue < 17 && game.deck.length > 0) {
        game.dealerCards.push(game.deck.pop());
        game.dealerValue = calculateBlackjackValue(game.dealerCards);
    }
    
    // Déterminer le gagnant
    if (game.dealerValue > 21) {
        game.status = "won";
        const winnings = game.bet * 2;
        economySystem.addMoney(guildId, userId, winnings, "blackjack_win");
    } else if (game.dealerValue > game.playerValue) {
        game.status = "lost";
    } else if (game.dealerValue < game.playerValue) {
        game.status = "won";
        const winnings = game.bet * 2;
        economySystem.addMoney(guildId, userId, winnings, "blackjack_win");
    } else {
        // Égalité, rembourser
        game.status = "tie";
        economySystem.addMoney(guildId, userId, game.bet, "blackjack_tie");
    }
    
    saveData(data);
    return game;
}

function getBlackjackGame(guildId, gameId) {
    const data = loadData();
    return data[guildId]?.blackjack?.[gameId] || null;
}

function calculateBlackjackValue(cards) {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
        const rank = card.substring(0, card.length - 1);
        if (rank === "A") {
            aces++;
            value += 11;
        } else if (["J", "Q", "K"].includes(rank)) {
            value += 10;
        } else {
            value += parseInt(rank) || 0;
        }
    }
    
    // Ajuster les as
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    
    return value;
}

// Roulette
function spinRoulette(guildId, userId, bet, betType, betValue) {
    const account = economySystem.getAccount(guildId, userId);
    
    if (account.balance < bet) {
        return { success: false, error: "Solde insuffisant" };
    }
    
    economySystem.removeMoney(guildId, userId, bet);
    
    // Roulette européenne (0-36)
    const result = Math.floor(Math.random() * 37);
    const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(result);
    const isBlack = result !== 0 && !isRed;
    const isEven = result !== 0 && result % 2 === 0;
    const isOdd = result !== 0 && result % 2 === 1;
    
    let won = false;
    let multiplier = 0;
    
    switch (betType) {
        case "number":
            won = result === betValue;
            multiplier = won ? 36 : 0;
            break;
        case "red":
            won = isRed;
            multiplier = won ? 2 : 0;
            break;
        case "black":
            won = isBlack;
            multiplier = won ? 2 : 0;
            break;
        case "even":
            won = isEven;
            multiplier = won ? 2 : 0;
            break;
        case "odd":
            won = isOdd;
            multiplier = won ? 2 : 0;
            break;
        case "low": // 1-18
            won = result >= 1 && result <= 18;
            multiplier = won ? 2 : 0;
            break;
        case "high": // 19-36
            won = result >= 19 && result <= 36;
            multiplier = won ? 2 : 0;
            break;
    }
    
    const winnings = Math.floor(bet * multiplier);
    
    if (winnings > 0) {
        economySystem.addMoney(guildId, userId, winnings, "roulette_win");
    }
    
    return {
        success: true,
        result,
        won,
        winnings,
        isRed,
        isBlack,
        isEven,
        isOdd
    };
}

module.exports = {
    coinflip,
    dice,
    rps,
    slots,
    createBlackjackGame,
    hitBlackjack,
    standBlackjack,
    getBlackjackGame,
    calculateBlackjackValue,
    spinRoulette,
    getGameStats,
    recordGame
};

