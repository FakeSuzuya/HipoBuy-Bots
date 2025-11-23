const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const embedBuilder = require("../../systems/embedBuilder");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../../data/passwords.json");

function initDataFile() {
    const dataDir = path.join(__dirname, "../../data");
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
    } catch (error) {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}

module.exports = {
    category: "Utilitaires",
    data: new SlashCommandBuilder()
        .setName("password")
        .setDescription("🔐 Gère les mots de passe Yupoo")
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Ajoute un mot de passe à la liste")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Nom du vendeur/site")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("password")
                        .setDescription("Mot de passe")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("Affiche la liste des mots de passe")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Supprime un mot de passe de la liste")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Nom du vendeur/site à supprimer")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("clear")
                .setDescription("Supprime tous les mots de passe")
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const data = loadData();
        const guildId = interaction.guild.id;

        if (!data[guildId]) {
            data[guildId] = { passwords: [] };
        }

        if (subcommand === "add") {
            // Vérifier les permissions pour ajouter
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: "❌ Vous devez avoir la permission de gérer les messages pour ajouter des mots de passe.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const name = interaction.options.getString("name");
            const password = interaction.options.getString("password");

            // Vérifier si le nom existe déjà
            const existingIndex = data[guildId].passwords.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
            
            if (existingIndex !== -1) {
                // Mettre à jour le mot de passe existant
                data[guildId].passwords[existingIndex].password = password;
                data[guildId].passwords[existingIndex].updatedAt = Date.now();
                data[guildId].passwords[existingIndex].updatedBy = interaction.user.id;
                
                saveData(data);
                
                return interaction.reply({
                    content: `✅ Le mot de passe pour **${name}** a été mis à jour.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Ajouter un nouveau mot de passe
            const passwordEntry = {
                id: Date.now().toString(),
                name,
                password,
                createdAt: Date.now(),
                createdBy: interaction.user.id
            };

            data[guildId].passwords.push(passwordEntry);
            saveData(data);

            await interaction.reply({
                content: `✅ Le mot de passe pour **${name}** a été ajouté à la liste.`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (subcommand === "list") {
            const passwords = data[guildId].passwords;

            if (passwords.length === 0) {
                return interaction.reply({
                    content: "❌ Aucun mot de passe dans la liste.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Créer la liste formatée comme dans l'image
            const passwordList = passwords.map(p => 
                `**${p.name}** password [${p.password}]`
            ).join("\n");

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: "Hipo King",
                    iconURL: interaction.guild.iconURL({ dynamic: true }) || interaction.client.user.displayAvatarURL()
                })
                .setDescription("This content is user-organized and only for viewing Yupoo passwords. Not a Hipobuy recommendation")
                .addFields({
                    name: "🔐 Liste des mots de passe",
                    value: passwordList.length > 1024 
                        ? passwordList.substring(0, 1020) + "..." 
                        : passwordList,
                    inline: false
                })
                .setColor(0x5865F2)
                .setFooter({ 
                    text: `Total: ${passwords.length} mot(s) de passe`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        if (subcommand === "remove") {
            // Vérifier les permissions pour supprimer
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    content: "❌ Vous devez avoir la permission de gérer les messages pour supprimer des mots de passe.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const name = interaction.options.getString("name");
            const passwordIndex = data[guildId].passwords.findIndex(p => p.name.toLowerCase() === name.toLowerCase());

            if (passwordIndex === -1) {
                return interaction.reply({
                    content: "❌ Mot de passe introuvable.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const removed = data[guildId].passwords.splice(passwordIndex, 1)[0];
            saveData(data);

            await interaction.reply({
                content: `✅ Le mot de passe pour **${removed.name}** a été supprimé.`,
                flags: MessageFlags.Ephemeral
            });
        }

        if (subcommand === "clear") {
            // Vérifier les permissions pour supprimer tout
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: "❌ Vous devez être administrateur pour supprimer tous les mots de passe.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const count = data[guildId].passwords.length;
            data[guildId].passwords = [];
            saveData(data);

            await interaction.reply({
                content: `✅ ${count} mot(s) de passe ont été supprimés.`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

