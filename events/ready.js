module.exports = (client) => {
    client.once("clientReady", async () => {
        console.log(`🚀 Connecté en tant que ${client.user.tag}`);
        console.log(`📊 Serveurs: ${client.guilds.cache.size}`);
        console.log(`👥 Utilisateurs: ${client.users.cache.size}`);
        
        // Charger le système de sécurité
        require("../securityCore")(client);
        
        // Déployer les commandes après que le bot soit prêt
        const commandHandler = require("../handlers/commandHandler");
        await commandHandler(client).catch(error => {
            console.error("❌ Erreur lors du chargement des commandes:", error);
        });
        
        // Note: Le statut rotatif est maintenant géré dans index.js via clientReady
        console.log("🔄 Statut rotatif activé");
    });
};
