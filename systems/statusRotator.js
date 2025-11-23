const { ActivityType } = require("discord.js");

module.exports = (client) => {
    // Statuts rotatifs
    const statuses = [
        { name: "avec {servers} serveurs", type: ActivityType.Watching },
        { name: "{users} utilisateurs", type: ActivityType.Watching },
        { name: "/help pour voir les commandes", type: ActivityType.Playing },
        { name: "les giveaways", type: ActivityType.Watching },
        { name: "les tickets", type: ActivityType.Watching },
        { name: "les niveaux", type: ActivityType.Watching },
        { name: "l'économie", type: ActivityType.Watching },
        { name: "les suggestions", type: ActivityType.Watching }
    ];

    let currentIndex = 0;

    // Mettre à jour le statut
    function updateStatus() {
        if (!client.user) return;
        
        const status = statuses[currentIndex];
        let statusText = status.name
            .replace("{servers}", client.guilds.cache.size.toString())
            .replace("{users}", client.users.cache.size.toString());
        
        client.user.setActivity(statusText, { type: status.type });
        
        currentIndex = (currentIndex + 1) % statuses.length;
    }

    // Mettre à jour immédiatement
    updateStatus();
    
    // Puis toutes les 30 secondes
    setInterval(() => {
        updateStatus();
    }, 30000); // 30 secondes
};

