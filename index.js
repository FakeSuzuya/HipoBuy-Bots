const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
const config = require("./config.json");
const fs = require("fs");

// Vérification de la configuration
if (!config.token || config.token === "TON_TOKEN_DE_BOT_ICI") {
    console.error("❌ ERREUR: Veuillez configurer votre token dans config.json");
    process.exit(1);
}

// Configuration des Intents (Permissions) et Partials (Cache)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildModeration
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.config = config; // Accessible partout via client.config
client.commands = new Collection();

// Chargement du système de sécurité
require("./securityCore")(client);

// Charger les timers et systèmes après connexion
client.once("clientReady", () => {
    require("./events/giveawayTimer")(client);
    require("./events/pollTimer")(client);
    require("./systems/statusRotator")(client);
});

// Chargement des handlers
const handlers = fs.readdirSync("./handlers").filter(file => file.endsWith(".js"));
for (const handler of handlers) {
    try {
        require(`./handlers/${handler}`)(client);
    } catch (error) {
        console.error(`❌ Erreur lors du chargement du handler ${handler}:`, error);
    }
}

// Gestion anti-crash
process.on('unhandledRejection', error => {
    console.error('❌ Erreur non gérée :', error);
});

process.on('uncaughtException', error => {
    console.error('❌ Exception critique :', error);
    process.exit(1);
});

// Connexion
client.login(config.token).catch(error => {
    console.error("❌ Erreur de connexion:", error);
    process.exit(1);
});
