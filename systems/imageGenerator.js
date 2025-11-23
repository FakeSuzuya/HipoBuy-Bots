const { createCanvas, loadImage, registerFont } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

// Chemin vers le dossier des images générées
const imagesDir = path.join(__dirname, "../data/images");
const fontsDir = path.join(__dirname, "../assets/fonts");

// Charger la configuration
function getConfig() {
    try {
        return require("../config.json");
    } catch {
        return {};
    }
}

// Initialiser le dossier
function initImagesDir() {
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }
    if (!fs.existsSync(fontsDir)) {
        fs.mkdirSync(fontsDir, { recursive: true });
    }
}

// Charger les polices personnalisées
function loadCustomFonts() {
    initImagesDir();
    const config = getConfig();
    const fontPath = config.imageSettings?.fontPath;
    
    if (fontPath && fs.existsSync(fontPath)) {
        try {
            registerFont(fontPath, { family: "Custom" });
            return "Custom";
        } catch (error) {
            console.error("Erreur chargement police personnalisée:", error);
        }
    }
    
    // Chercher des polices dans le dossier fonts
    if (fs.existsSync(fontsDir)) {
        const fontFiles = fs.readdirSync(fontsDir).filter(f => f.endsWith(".ttf") || f.endsWith(".otf"));
        if (fontFiles.length > 0) {
            try {
                const fontFile = path.join(fontsDir, fontFiles[0]);
                registerFont(fontFile, { family: "Custom" });
                return "Custom";
            } catch (error) {
                console.error("Erreur chargement police:", error);
            }
        }
    }
    
    return "Arial"; // Police par défaut
}

// Obtenir les couleurs du thème
function getThemeColors(type) {
    const config = getConfig();
    const theme = config.imageTheme?.[type] || {};
    
    // Thèmes par défaut
    const defaults = {
        level: {
            primaryColor: "#5865F2",
            secondaryColor: "#7289DA",
            backgroundColor: "#2C2F33",
            textColor: "#FFFFFF",
            progressColor: "#5865F2"
        },
        economy: {
            primaryColor: "#FFD700",
            secondaryColor: "#FFA500",
            backgroundColor: "#2C2F33",
            textColor: "#FFFFFF",
            balanceColor: "#00FF00",
            bankColor: "#00BFFF"
        },
        stats: {
            primaryColor: "#5865F2",
            secondaryColor: "#7289DA",
            backgroundColor: "#2C2F33",
            textColor: "#FFFFFF",
            graphColor: "#5865F2"
        }
    };
    
    return { ...defaults[type], ...theme };
}

// Générer une carte de niveau avec thème
async function generateLevelCard(user, stats, rank = null, theme = null) {
    initImagesDir();
    const fontFamily = loadCustomFonts();
    const colors = theme || getThemeColors("level");
    
    const width = 800;
    const height = 250;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond avec dégradé
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors.primaryColor);
    gradient.addColorStop(1, colors.secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure
    ctx.fillStyle = "#23272A";
    ctx.fillRect(10, 10, width - 20, height - 20);

    // Fond principal
    const mainGradient = ctx.createLinearGradient(0, 0, width, height);
    mainGradient.addColorStop(0, colors.backgroundColor);
    mainGradient.addColorStop(1, "#23272A");
    ctx.fillStyle = mainGradient;
    ctx.fillRect(15, 15, width - 30, height - 30);

    // Avatar
    try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(140, 125, 60, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 80, 65, 120, 120);
        ctx.restore();
        
        // Bordure de l'avatar
        ctx.strokeStyle = colors.primaryColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(140, 125, 60, 0, Math.PI * 2);
        ctx.stroke();
    } catch (error) {
        console.error("Erreur chargement avatar:", error);
    }

    // Nom d'utilisateur
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold 32px ${fontFamily}`;
    ctx.fillText(user.username, 220, 80);

    // Tag
    ctx.fillStyle = "#B9BBBE";
    ctx.font = `24px ${fontFamily}`;
    ctx.fillText(`#${user.discriminator}`, 220, 110);

    // Niveau
    ctx.fillStyle = colors.primaryColor;
    ctx.font = `bold 28px ${fontFamily}`;
    ctx.fillText(`Niveau ${stats.level}`, 220, 150);

    // XP
    ctx.fillStyle = "#B9BBBE";
    ctx.font = `20px ${fontFamily}`;
    ctx.fillText(`${stats.xp || 0} / ${stats.xpNeeded || 100} XP`, 220, 180);

    // Barre de progression
    const progressWidth = 500;
    const progressHeight = 30;
    const progressX = 220;
    const progressY = 200;
    const progress = (stats.xp || 0) / (stats.xpNeeded || 100);

    // Fond de la barre
    ctx.fillStyle = "#1E2124";
    ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

    // Barre de progression
    const progressGradient = ctx.createLinearGradient(progressX, 0, progressX + progressWidth, 0);
    progressGradient.addColorStop(0, colors.progressColor);
    progressGradient.addColorStop(1, colors.secondaryColor);
    ctx.fillStyle = progressGradient;
    ctx.fillRect(progressX, progressY, progressWidth * Math.min(progress, 1), progressHeight);

    // Pourcentage
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold 18px ${fontFamily}`;
    const percentText = `${Math.round(progress * 100)}%`;
    const percentWidth = ctx.measureText(percentText).width;
    ctx.fillText(percentText, progressX + (progressWidth / 2) - (percentWidth / 2), progressY + 22);

    // Rank
    if (rank !== null) {
        ctx.fillStyle = "#FFD700";
        ctx.font = `bold 24px ${fontFamily}`;
        ctx.fillText(`#${rank}`, 680, 80);
    }

    // Messages
    ctx.fillStyle = "#B9BBBE";
    ctx.font = `18px ${fontFamily}`;
    ctx.fillText(`💬 ${stats.messages || 0} messages`, 680, 150);

    return exportImage(canvas, `level-${user.id}`);
}

// Générer une carte d'économie avec thème
async function generateEconomyCard(user, stats, rank = null, theme = null) {
    initImagesDir();
    const fontFamily = loadCustomFonts();
    const colors = theme || getThemeColors("economy");
    
    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond avec dégradé
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors.primaryColor);
    gradient.addColorStop(1, colors.secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure
    ctx.fillStyle = "#23272A";
    ctx.fillRect(10, 10, width - 20, height - 20);

    // Fond principal
    const mainGradient = ctx.createLinearGradient(0, 0, width, height);
    mainGradient.addColorStop(0, colors.backgroundColor);
    mainGradient.addColorStop(1, "#23272A");
    ctx.fillStyle = mainGradient;
    ctx.fillRect(15, 15, width - 30, height - 30);

    // Avatar
    try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(140, 150, 70, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 70, 80, 140, 140);
        ctx.restore();
        
        // Bordure
        ctx.strokeStyle = colors.primaryColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(140, 150, 70, 0, Math.PI * 2);
        ctx.stroke();
    } catch (error) {
        console.error("Erreur chargement avatar:", error);
    }

    // Nom d'utilisateur
    ctx.fillStyle = colors.primaryColor;
    ctx.font = `bold 36px ${fontFamily}`;
    ctx.fillText(user.username, 240, 100);

    // Portefeuille
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold 28px ${fontFamily}`;
    ctx.fillText("💵 Portefeuille", 240, 140);
    ctx.fillStyle = colors.balanceColor;
    ctx.font = `32px ${fontFamily}`;
    ctx.fillText(`${stats.balance || 0} 💰`, 240, 175);

    // Banque
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold 28px ${fontFamily}`;
    ctx.fillText("🏦 Banque", 240, 210);
    ctx.fillStyle = colors.bankColor;
    ctx.font = `32px ${fontFamily}`;
    ctx.fillText(`${stats.bank || 0} 💰`, 240, 245);

    // Total
    const total = (stats.balance || 0) + (stats.bank || 0);
    ctx.fillStyle = colors.primaryColor;
    ctx.font = `bold 24px ${fontFamily}`;
    ctx.fillText(`Total: ${total} 💰`, 550, 140);

    // Streak
    if (stats.dailyStreak) {
        ctx.fillStyle = "#FF6B6B";
        ctx.font = `bold 22px ${fontFamily}`;
        ctx.fillText(`🔥 Streak: ${stats.dailyStreak} jours`, 550, 180);
    }

    // Rank
    if (rank !== null) {
        ctx.fillStyle = colors.primaryColor;
        ctx.font = `bold 28px ${fontFamily}`;
        ctx.fillText(`#${rank}`, 680, 100);
    }

    // Statistiques
    ctx.fillStyle = "#B9BBBE";
    ctx.font = `18px ${fontFamily}`;
    ctx.fillText(`Gagné: ${stats.totalEarned || 0} 💰`, 550, 220);
    ctx.fillText(`Dépensé: ${stats.totalSpent || 0} 💰`, 550, 245);

    return exportImage(canvas, `economy-${user.id}`);
}

// Générer différents types de graphiques
function drawGraph(ctx, data, type, x, y, width, height, color) {
    const maxValue = Math.max(...data.map(d => d.value));
    
    if (type === "bar") {
        // Graphique en barres
        const barWidth = width / data.length;
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * height;
            ctx.fillStyle = color;
            ctx.fillRect(x + (index * barWidth), y + height - barHeight, barWidth - 5, barHeight);
        });
    } else if (type === "line") {
        // Graphique en ligne
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const pointWidth = width / (data.length - 1);
        data.forEach((item, index) => {
            const pointY = y + height - ((item.value / maxValue) * height);
            if (index === 0) {
                ctx.moveTo(x + (index * pointWidth), pointY);
            } else {
                ctx.lineTo(x + (index * pointWidth), pointY);
            }
        });
        ctx.stroke();
        
        // Points
        data.forEach((item, index) => {
            const pointY = y + height - ((item.value / maxValue) * height);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + (index * (width / (data.length - 1))), pointY, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (type === "pie") {
        // Graphique circulaire
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = -Math.PI / 2;
        const radius = Math.min(width, height) / 2 - 10;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            ctx.fillStyle = color + (index % 2 === 0 ? "80" : "FF");
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            currentAngle += sliceAngle;
        });
    }
}

// Générer une carte de stats serveur avec graphiques améliorés
async function generateServerStatsCard(guild, stats, days, graphType = "bar") {
    initImagesDir();
    const fontFamily = loadCustomFonts();
    const colors = getThemeColors("stats");
    const config = getConfig();
    const allowedGraphTypes = config.imageSettings?.graphTypes || ["bar", "line", "pie"];
    
    if (!allowedGraphTypes.includes(graphType)) {
        graphType = "bar";
    }
    
    const width = 900;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors.primaryColor);
    gradient.addColorStop(1, colors.secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure
    ctx.fillStyle = "#23272A";
    ctx.fillRect(10, 10, width - 20, height - 20);

    // Fond principal
    ctx.fillStyle = colors.backgroundColor;
    ctx.fillRect(15, 15, width - 30, height - 30);

    // Titre
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold 40px ${fontFamily}`;
    const title = `Statistiques - ${guild.name}`;
    const titleWidth = ctx.measureText(title).width;
    ctx.fillText(title, (width / 2) - (titleWidth / 2), 60);

    // Période
    ctx.fillStyle = "#B9BBBE";
    ctx.font = `24px ${fontFamily}`;
    const periodText = `${days} derniers jours`;
    const periodWidth = ctx.measureText(periodText).width;
    ctx.fillText(periodText, (width / 2) - (periodWidth / 2), 95);

    // Icône du serveur
    try {
        if (guild.iconURL()) {
            const icon = await loadImage(guild.iconURL({ extension: "png", size: 128 }));
            ctx.drawImage(icon, 50, 50, 80, 80);
        }
    } catch (error) {
        console.error("Erreur chargement icône:", error);
    }

    // Stats - Colonne gauche
    const leftX = 100;
    const rightX = 500;
    let y = 150;

    ctx.fillStyle = colors.textColor;
    ctx.font = `bold 28px ${fontFamily}`;
    ctx.fillText("📊 Totaux", leftX, y);
    y += 40;

    ctx.fillStyle = "#B9BBBE";
    ctx.font = `22px ${fontFamily}`;
    ctx.fillText(`Messages: ${(stats.total.messages || 0).toLocaleString()}`, leftX, y);
    y += 35;
    ctx.fillText(`Commandes: ${(stats.total.commands || 0).toLocaleString()}`, leftX, y);
    y += 35;
    ctx.fillText(`Tickets: ${stats.total.tickets || 0}`, leftX, y);
    y += 35;
    ctx.fillText(`Modération: ${stats.total.moderation || 0}`, leftX, y);
    y += 35;
    ctx.fillText(`Joins: ${stats.total.joins || 0}`, leftX, y);
    y += 35;
    ctx.fillText(`Leaves: ${stats.total.leaves || 0}`, leftX, y);

    // Moyennes - Colonne droite
    y = 150;
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold 28px ${fontFamily}`;
    ctx.fillText("📈 Moyennes/jour", rightX, y);
    y += 40;

    const avgMessages = stats.daily.reduce((sum, day) => sum + day.messages, 0) / days;
    const avgCommands = stats.daily.reduce((sum, day) => sum + day.commands, 0) / days;

    ctx.fillStyle = "#B9BBBE";
    ctx.font = `22px ${fontFamily}`;
    ctx.fillText(`Messages: ${Math.round(avgMessages)}`, rightX, y);
    y += 35;
    ctx.fillText(`Commandes: ${Math.round(avgCommands)}`, rightX, y);

    // Graphique amélioré
    const graphData = stats.daily.slice(-7).map(day => ({
        value: day.messages,
        label: new Date(day.date).getDate().toString()
    }));
    
    drawGraph(ctx, graphData, graphType, 100, 380, 700, 80, colors.graphColor);

    return exportImage(canvas, `stats-${guild.id}`, graphType);
}

// Exporter l'image dans différents formats
function exportImage(canvas, filename, suffix = "") {
    const config = getConfig();
    const format = config.imageSettings?.exportFormat || "png";
    const fullFilename = suffix ? `${filename}-${suffix}` : filename;
    
    let buffer;
    let extension;
    
    switch (format.toLowerCase()) {
        case "jpg":
        case "jpeg":
            buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });
            extension = "jpg";
            break;
        case "webp":
            buffer = canvas.toBuffer("image/webp", { quality: 0.9 });
            extension = "webp";
            break;
        default:
            buffer = canvas.toBuffer("image/png");
            extension = "png";
    }
    
    const filePath = path.join(imagesDir, `${fullFilename}.${extension}`);
    fs.writeFileSync(filePath, buffer);
    
    return buffer;
}

// Générer une animation GIF (simple avec plusieurs frames)
async function generateAnimatedCard(user, stats, type = "level") {
    const config = getConfig();
    if (!config.imageSettings?.enableAnimations) {
        // Retourner une image statique si les animations sont désactivées
        if (type === "level") {
            return await generateLevelCard(user, stats);
        } else {
            return await generateEconomyCard(user, stats);
        }
    }
    
    // Pour une vraie animation GIF, il faudrait utiliser une bibliothèque comme gifencoder
    // Pour l'instant, on génère juste une image statique améliorée
    // TODO: Implémenter avec gifencoder si nécessaire
    
    if (type === "level") {
        return await generateLevelCard(user, stats);
    } else {
        return await generateEconomyCard(user, stats);
    }
}

// Générer une carte de profil
async function generateProfileCard(user, profile, levelStats, economyStats) {
    initImagesDir();
    const fontFamily = loadCustomFonts();
    const colors = getThemeColors("level");
    
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, profile.color || colors.primaryColor);
    gradient.addColorStop(1, colors.secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Bordure
    ctx.fillStyle = "#23272A";
    ctx.fillRect(10, 10, width - 20, height - 20);

    // Fond principal
    ctx.fillStyle = colors.backgroundColor;
    ctx.fillRect(15, 15, width - 30, height - 30);

    // Avatar
    try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 256 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(140, 200, 80, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatar, 60, 120, 160, 160);
        ctx.restore();
        
        // Bordure
        ctx.strokeStyle = profile.color || colors.primaryColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(140, 200, 80, 0, Math.PI * 2);
        ctx.stroke();
    } catch (error) {
        console.error("Erreur chargement avatar:", error);
    }

    // Nom d'utilisateur
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold 36px ${fontFamily}`;
    ctx.fillText(user.username, 260, 150);

    // Bio
    if (profile.bio) {
        ctx.fillStyle = "#B9BBBE";
        ctx.font = `20px ${fontFamily}`;
        const bioLines = wrapText(ctx, profile.bio, 500);
        bioLines.forEach((line, index) => {
            ctx.fillText(line, 260, 190 + (index * 25));
        });
    }

    // Statistiques
    let y = 280;
    ctx.fillStyle = colors.textColor;
    ctx.font = `bold 24px ${fontFamily}`;
    ctx.fillText("📊 Statistiques", 260, y);
    y += 35;

    ctx.fillStyle = "#B9BBBE";
    ctx.font = `18px ${fontFamily}`;
    ctx.fillText(`Niveau: ${levelStats.level}`, 260, y);
    y += 25;
    ctx.fillText(`XP: ${levelStats.totalXP || 0}`, 260, y);
    y += 25;
    ctx.fillText(`Argent: ${economyStats.balance || 0} 💰`, 260, y);

    // Badges
    if (profile.badges.length > 0) {
        y = 280;
        ctx.fillStyle = colors.textColor;
        ctx.font = `bold 24px ${fontFamily}`;
        ctx.fillText("🏆 Badges", 500, y);
        y += 35;
        
        ctx.fillStyle = "#B9BBBE";
        ctx.font = `18px ${fontFamily}`;
        profile.badges.slice(0, 5).forEach((badge, index) => {
            ctx.fillText(badge, 500, y + (index * 25));
        });
    }

    return exportImage(canvas, `profile-${user.id}`);
}

// Fonction pour wrapper le texte
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines.slice(0, 3); // Max 3 lignes
}

module.exports = {
    generateLevelCard,
    generateEconomyCard,
    generateServerStatsCard,
    generateAnimatedCard,
    generateProfileCard,
    getThemeColors,
    drawGraph
};
