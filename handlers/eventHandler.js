const fs = require("fs");

module.exports = (client) => {
    const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));

    for (const file of eventFiles) {
        try {
            const event = require(`../events/${file}`);
            
            // Gérer les événements avec structure standard (name + execute)
            if (event.name && event.execute) {
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
            } 
            // Gérer les événements qui exportent directement une fonction
            else if (typeof event === "function") {
                event(client);
            }
        } catch (error) {
            console.error(`❌ Erreur lors du chargement de l'événement ${file}:`, error);
        }
    }
    console.log(`✅ ${eventFiles.length} Événement(s) chargé(s) !`);
};
