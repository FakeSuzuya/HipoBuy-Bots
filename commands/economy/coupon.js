const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const embedBuilder = require("../../systems/embedBuilder");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("@napi-rs/canvas");

const dataPath = path.join(__dirname, "../../data/coupons.json");

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

// Générer une image de coupon
async function generateCouponImage(coupon) {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond avec dégradé
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#FF6B6B");
    gradient.addColorStop(1, "#FF8E8E");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(20, 20, width - 40, height - 40);

    // Fond principal
    ctx.fillStyle = "#FFF5F5";
    ctx.fillRect(25, 25, width - 50, height - 50);

    // Titre "COUPON"
    ctx.fillStyle = "#FF6B6B";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("COUPON", width / 2, 100);

    // Code du coupon
    ctx.fillStyle = "#2C2F33";
    ctx.font = "bold 48px Arial";
    ctx.fillText(coupon.code, width / 2, 180);

    // Description
    ctx.fillStyle = "#7289DA";
    ctx.font = "32px Arial";
    const description = coupon.description || `${coupon.discount}${coupon.type === "percentage" ? "% OFF" : " OFF"}`;
    ctx.fillText(description, width / 2, 240);

    // Conditions
    if (coupon.minAmount) {
        ctx.fillStyle = "#B9BBBE";
        ctx.font = "24px Arial";
        ctx.fillText(`Min. Amount: $${coupon.minAmount}`, width / 2, 290);
    }

    // Date d'expiration
    if (coupon.expiresAt) {
        const expiryDate = new Date(coupon.expiresAt).toLocaleDateString("fr-FR");
        ctx.fillStyle = "#FF6B6B";
        ctx.font = "20px Arial";
        ctx.fillText(`Expires: ${expiryDate}`, width / 2, 340);
    }

    // Bordure décorative
    ctx.strokeStyle = "#FF6B6B";
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(25, 25, width - 50, height - 50);

    return canvas.toBuffer("image/png");
}

module.exports = {
    category: "Économie",
    data: new SlashCommandBuilder()
        .setName("coupon")
        .setDescription("🎫 Gère les coupons")
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription("Crée un nouveau coupon")
                .addStringOption(option =>
                    option.setName("code")
                        .setDescription("Code du coupon")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("type")
                        .setDescription("Type de réduction")
                        .setRequired(true)
                        .addChoices(
                            { name: "Pourcentage", value: "percentage" },
                            { name: "Montant fixe", value: "fixed" }
                        )
                )
                .addNumberOption(option =>
                    option.setName("discount")
                        .setDescription("Valeur de la réduction")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("description")
                        .setDescription("Description du coupon")
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName("min_amount")
                        .setDescription("Montant minimum requis")
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName("uses")
                        .setDescription("Nombre d'utilisations (0 = illimité)")
                        .setRequired(false)
                        .setMinValue(0)
                )
                .addStringOption(option =>
                    option.setName("expires")
                        .setDescription("Date d'expiration (JJ/MM/AAAA)")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("Liste tous les coupons disponibles")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("redeem")
                .setDescription("Utilise un coupon")
                .addStringOption(option =>
                    option.setName("code")
                        .setDescription("Code du coupon à utiliser")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("delete")
                .setDescription("Supprime un coupon")
                .addStringOption(option =>
                    option.setName("code")
                        .setDescription("Code du coupon à supprimer")
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const data = loadData();
        const guildId = interaction.guild.id;

        if (!data[guildId]) {
            data[guildId] = { coupons: [], redemptions: {} };
        }

        if (subcommand === "create") {
            const { PermissionFlagsBits } = require("discord.js");
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({
                    content: "❌ Vous devez avoir la permission de gérer le serveur pour créer des coupons.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const code = interaction.options.getString("code").toUpperCase();
            const type = interaction.options.getString("type");
            const discount = interaction.options.getNumber("discount");
            const description = interaction.options.getString("description");
            const minAmount = interaction.options.getNumber("min_amount");
            const uses = interaction.options.getInteger("uses") || 0;
            const expiresText = interaction.options.getString("expires");

            // Vérifier si le code existe déjà
            if (data[guildId].coupons.find(c => c.code === code)) {
                return interaction.reply({
                    content: "❌ Ce code de coupon existe déjà.",
                    flags: MessageFlags.Ephemeral
                });
            }

            let expiresAt = null;
            if (expiresText) {
                const [day, month, year] = expiresText.split("/");
                expiresAt = new Date(year, month - 1, day).getTime();
                if (isNaN(expiresAt) || expiresAt < Date.now()) {
                    return interaction.reply({
                        content: "❌ Date d'expiration invalide.",
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            const coupon = {
                id: Date.now().toString(),
                code,
                type,
                discount,
                description: description || `${discount}${type === "percentage" ? "% OFF" : " OFF"}`,
                minAmount: minAmount || 0,
                maxUses: uses,
                currentUses: 0,
                expiresAt,
                createdAt: Date.now(),
                createdBy: interaction.user.id
            };

            data[guildId].coupons.push(coupon);
            saveData(data);

            // Générer l'image du coupon
            try {
                const imageBuffer = await generateCouponImage(coupon);
                const attachment = new AttachmentBuilder(imageBuffer, { name: `coupon-${code}.png` });

                const embed = embedBuilder.createSuccessEmbed(
                    "✅ Coupon créé",
                    `Le coupon **${code}** a été créé avec succès !`,
                    {
                        fields: [
                            { name: "🎫 Code", value: `\`${code}\``, inline: true },
                            { name: "💰 Réduction", value: `${discount}${type === "percentage" ? "%" : "$"}`, inline: true },
                            { name: "📝 Description", value: coupon.description, inline: false },
                            { name: "💵 Montant minimum", value: minAmount ? `$${minAmount}` : "Aucun", inline: true },
                            { name: "🔢 Utilisations", value: uses === 0 ? "Illimité" : `${uses} fois`, inline: true },
                            { name: "⏰ Expiration", value: expiresAt ? new Date(expiresAt).toLocaleDateString("fr-FR") : "Aucune", inline: true }
                        ],
                        image: `attachment://coupon-${code}.png`
                    }
                );

                await interaction.reply({
                    embeds: [embed],
                    files: [attachment],
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error("Erreur génération image coupon:", error);
                const embed = embedBuilder.createSuccessEmbed(
                    "✅ Coupon créé",
                    `Le coupon **${code}** a été créé avec succès !`,
                    {
                        fields: [
                            { name: "🎫 Code", value: `\`${code}\``, inline: true },
                            { name: "💰 Réduction", value: `${discount}${type === "percentage" ? "%" : "$"}`, inline: true }
                        ]
                    }
                );
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === "list") {
            const coupons = data[guildId].coupons.filter(c => {
                if (c.expiresAt && c.expiresAt < Date.now()) return false;
                if (c.maxUses > 0 && c.currentUses >= c.maxUses) return false;
                return true;
            });

            if (coupons.length === 0) {
                return interaction.reply({
                    content: "❌ Aucun coupon disponible.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const couponsList = coupons.map(c => {
                const status = c.expiresAt && c.expiresAt < Date.now() ? "❌ Expiré" :
                              c.maxUses > 0 && c.currentUses >= c.maxUses ? "❌ Épuisé" : "✅ Actif";
                return `**${c.code}** - ${c.discount}${c.type === "percentage" ? "%" : "$"} OFF - ${status}`;
            }).join("\n");

            const embed = embedBuilder.createInfoEmbed(
                "🎫 Coupons disponibles",
                couponsList,
                {
                    footer: { text: `Total: ${coupons.length} coupon(s) actif(s)` }
                }
            );

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (subcommand === "redeem") {
            const code = interaction.options.getString("code").toUpperCase();
            const coupon = data[guildId].coupons.find(c => c.code === code);

            if (!coupon) {
                return interaction.reply({
                    content: "❌ Coupon introuvable.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Vérifier l'expiration
            if (coupon.expiresAt && coupon.expiresAt < Date.now()) {
                return interaction.reply({
                    content: "❌ Ce coupon a expiré.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Vérifier les utilisations
            if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
                return interaction.reply({
                    content: "❌ Ce coupon a atteint sa limite d'utilisations.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Vérifier si l'utilisateur a déjà utilisé ce coupon
            if (!data[guildId].redemptions[interaction.user.id]) {
                data[guildId].redemptions[interaction.user.id] = [];
            }

            if (data[guildId].redemptions[interaction.user.id].includes(coupon.id)) {
                return interaction.reply({
                    content: "❌ Vous avez déjà utilisé ce coupon.",
                    flags: MessageFlags.Ephemeral
                });
            }

            // Utiliser le coupon
            coupon.currentUses++;
            data[guildId].redemptions[interaction.user.id].push(coupon.id);
            saveData(data);

            // Générer l'image du coupon utilisé
            try {
                const imageBuffer = await generateCouponImage(coupon);
                const attachment = new AttachmentBuilder(imageBuffer, { name: `coupon-${code}.png` });

                const embed = embedBuilder.createSuccessEmbed(
                    "✅ Coupon utilisé",
                    `Vous avez utilisé le coupon **${code}** avec succès !`,
                    {
                        fields: [
                            { name: "🎫 Code", value: `\`${code}\``, inline: true },
                            { name: "💰 Réduction", value: `${coupon.discount}${coupon.type === "percentage" ? "%" : "$"}`, inline: true },
                            { name: "📝 Description", value: coupon.description, inline: false }
                        ],
                        image: `attachment://coupon-${code}.png`
                    }
                );

                await interaction.reply({
                    embeds: [embed],
                    files: [attachment],
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                console.error("Erreur génération image coupon:", error);
                const embed = embedBuilder.createSuccessEmbed(
                    "✅ Coupon utilisé",
                    `Vous avez utilisé le coupon **${code}** avec succès !`,
                    {
                        fields: [
                            { name: "🎫 Code", value: `\`${code}\``, inline: true },
                            { name: "💰 Réduction", value: `${coupon.discount}${coupon.type === "percentage" ? "%" : "$"}`, inline: true }
                        ]
                    }
                );
                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === "delete") {
            const { PermissionFlagsBits } = require("discord.js");
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({
                    content: "❌ Vous devez avoir la permission de gérer le serveur pour supprimer des coupons.",
                    flags: MessageFlags.Ephemeral
                });
            }

            const code = interaction.options.getString("code").toUpperCase();
            const couponIndex = data[guildId].coupons.findIndex(c => c.code === code);

            if (couponIndex === -1) {
                return interaction.reply({
                    content: "❌ Coupon introuvable.",
                    flags: MessageFlags.Ephemeral
                });
            }

            data[guildId].coupons.splice(couponIndex, 1);
            saveData(data);

            await interaction.reply({
                content: `✅ Le coupon **${code}** a été supprimé.`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
};

