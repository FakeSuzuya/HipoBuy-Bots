const { REST, Routes } = require("discord.js");
const fs = require("fs");

module.exports = async (client) => {
    const commandsArr = [];
    const commandsDir = "./commands";
    const items = fs.readdirSync(commandsDir);

    // Traiter les fichiers directement dans commands/
    const rootFiles = items.filter(item => {
        const itemPath = `${commandsDir}/${item}`;
        return fs.statSync(itemPath).isFile() && item.endsWith(".js");
    });

    const loadedCommands = new Set(); // Éviter les doublons
    
    for (const file of rootFiles) {
        try {
            const cmd = require(`../commands/${file}`);
            if (cmd.data && cmd.execute) {
                if (!loadedCommands.has(cmd.data.name)) {
                    client.commands.set(cmd.data.name, cmd);
                    commandsArr.push(cmd.data.toJSON());
                    loadedCommands.add(cmd.data.name);
                    const type = cmd.data.type ? `[${cmd.data.type === 2 ? "User" : cmd.data.type === 3 ? "Message" : "Slash"}]` : "";
                    console.log(`✅ Commande chargée: ${cmd.data.name} ${type}`);
                } else {
                    console.warn(`⚠️ Commande ${cmd.data.name} déjà chargée, ignorée`);
                }
            } else {
                console.warn(`⚠️ Commande ${file} invalide (manque data ou execute)`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors du chargement de ${file}:`, error);
        }
    }

    // Traiter les dossiers dans commands/
    const folders = items.filter(item => {
        const itemPath = `${commandsDir}/${item}`;
        return fs.statSync(itemPath).isDirectory();
    });

    for (const folder of folders) {
        const files = fs.readdirSync(`./commands/${folder}`).filter(f => f.endsWith(".js"));
        for (const file of files) {
            try {
                const cmd = require(`../commands/${folder}/${file}`);
                if (cmd.data && cmd.execute) {
                    if (!loadedCommands.has(cmd.data.name)) {
                        client.commands.set(cmd.data.name, cmd);
                        commandsArr.push(cmd.data.toJSON());
                        loadedCommands.add(cmd.data.name);
                        const type = cmd.data.type ? `[${cmd.data.type === 2 ? "User" : cmd.data.type === 3 ? "Message" : "Slash"}]` : "";
                        console.log(`✅ Commande chargée (${folder}): ${cmd.data.name} ${type}`);
                    } else {
                        console.warn(`⚠️ Commande ${cmd.data.name} déjà chargée, ignorée`);
                    }
                } else {
                    console.warn(`⚠️ Commande ${folder}/${file} invalide (manque data ou execute)`);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de ${folder}/${file}:`, error);
            }
        }
    }

    if (commandsArr.length === 0) {
        console.warn("⚠️ Aucune commande trouvée !");
        return;
    }

    const rest = new REST({ version: "10" }).setToken(client.config.token);

    try {
        console.log("🔄 Déploiement des (/) commandes...");
        console.log(`📊 ${commandsArr.length} commande(s) à déployer`);
        
        // Attendre que le client soit prêt
        if (!client.user) {
            console.log("⏳ Attente de la connexion du bot...");
            await new Promise(resolve => client.once("clientReady", resolve));
        }
        
        console.log(`🤖 Bot ID: ${client.user.id}`);
        console.log(`🏠 Guild ID: ${client.config.guildId}`);
        
        // Déploiement par guilde pour update instantané
        const data = await rest.put(
            Routes.applicationGuildCommands(client.user.id, client.config.guildId),
            { body: commandsArr }
        );

        console.log(`✅ ${data.length} commande(s) déployée(s) avec succès !`);
        console.log("📝 Commandes déployées:");
        data.forEach(cmd => {
            console.log(`   - /${cmd.name}`);
        });
        
        console.log("\n💡 Les commandes devraient apparaître dans Discord dans quelques secondes.");
        console.log("💡 Si elles n'apparaissent pas, essayez de redémarrer Discord ou attendez quelques minutes.");
    } catch (error) {
        console.error("❌ Erreur lors du déploiement des commandes:", error);
        if (error.code === 50035) {
            console.error("⚠️ Erreur 50035: Vérifiez que vos IDs dans config.json sont corrects.");
            console.error(`   Bot ID: ${client.user?.id || "N/A"}`);
            console.error(`   Guild ID: ${client.config.guildId || "N/A"}`);
        } else if (error.code === 50001) {
            console.error("⚠️ Erreur 50001: Le bot n'a pas accès à cette guilde.");
        } else if (error.code === 10004) {
            console.error("⚠️ Erreur 10004: Guilde introuvable. Vérifiez le guildId dans config.json.");
        } else {
            console.error("⚠️ Code d'erreur:", error.code);
            console.error("⚠️ Message:", error.message);
        }
    }
};
