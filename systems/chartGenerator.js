const { createCanvas } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

// Chemin vers le dossier des images générées
const imagesDir = path.join(__dirname, "../data/images");

// Initialiser le dossier
function initImagesDir() {
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }
}

// Générer un graphique en barres pour les polls
async function generatePollChart(poll) {
    initImagesDir();
    
    const width = 700;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond sombre pour le graphique
    ctx.fillStyle = "#2C2F33";
    ctx.fillRect(0, 0, width, height);
    
    // Bordure arrondie
    ctx.fillStyle = "#23272A";
    ctx.fillRect(5, 5, width - 10, height - 10);
    
    // Fond principal
    ctx.fillStyle = "#2C2F33";
    ctx.fillRect(10, 10, width - 20, height - 20);

    // Calculer les votes
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    const maxVotes = Math.max(...poll.options.map(opt => opt.votes.length), 1);

    // Zone du graphique
    const chartX = 50;
    const chartY = 80;
    const chartWidth = width - 100;
    const chartHeight = height - 160;
    const barSpacing = 15;
    const barWidth = (chartWidth - (barSpacing * (poll.options.length - 1))) / poll.options.length;

    // Couleurs pour chaque barre
    const colors = ["#5865F2", "#00D4AA", "#FFD700", "#FF6B6B", "#FF6B9D"];

    // Dessiner les barres
    poll.options.forEach((option, index) => {
        const votes = option.votes.length;
        const barHeight = maxVotes > 0 ? (votes / maxVotes) * chartHeight : 0;
        const x = chartX + (index * (barWidth + barSpacing));
        const y = chartY + chartHeight - barHeight;

        // Barre avec dégradé
        const barGradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        barGradient.addColorStop(0, colors[index % colors.length]);
        barGradient.addColorStop(1, colors[index % colors.length] + "CC");
        ctx.fillStyle = barGradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Pourcentage au-dessus de la barre
        if (votes > 0 && totalVotes > 0) {
            const percentage = Math.round((votes / totalVotes) * 100);
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 18px Arial";
            const percentText = `${percentage}%`;
            const percentWidth = ctx.measureText(percentText).width;
            ctx.fillText(percentText, x + (barWidth / 2) - (percentWidth / 2), y - 15);
        }

        // Label de l'option en bas
        ctx.fillStyle = "#B9BBBE";
        ctx.font = "16px Arial";
        const label = String.fromCharCode(65 + index);
        const labelWidth = ctx.measureText(label).width;
        ctx.fillText(label, x + (barWidth / 2) - (labelWidth / 2), chartY + chartHeight + 25);
    });

    const buffer = canvas.toBuffer("image/png");
    return buffer;
}

// Générer un graphique pour les giveaways
async function generateGiveawayChart(giveaway) {
    initImagesDir();
    
    const width = 400;
    const height = 200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fond sombre pour le graphique
    ctx.fillStyle = "#2C2F33";
    ctx.fillRect(0, 0, width, height);
    
    // Bordure arrondie
    ctx.fillStyle = "#23272A";
    ctx.fillRect(5, 5, width - 10, height - 10);
    
    // Fond principal
    ctx.fillStyle = "#2C2F33";
    ctx.fillRect(10, 10, width - 20, height - 20);

    // Graphique circulaire (camembert) pour la participation
    const participants = giveaway.participants?.length || 0;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 70;

    // Cercle de fond
    ctx.fillStyle = "#1E2124";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Cercle de participation (si des participants)
    if (participants > 0) {
        const maxParticipants = 100; // Pour la visualisation
        const participationAngle = Math.min((participants / maxParticipants) * 2 * Math.PI, Math.PI * 2);
        const participationGradient = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
        participationGradient.addColorStop(0, "#00FF88");
        participationGradient.addColorStop(1, "#00D4AA");
        ctx.fillStyle = participationGradient;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + participationAngle);
        ctx.closePath();
        ctx.fill();
    }

    // Texte au centre
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 32px Arial";
    const participantsText = participants.toString();
    const participantsWidth = ctx.measureText(participantsText).width;
    ctx.fillText(participantsText, centerX - (participantsWidth / 2), centerY - 5);

    ctx.fillStyle = "#B9BBBE";
    ctx.font = "14px Arial";
    const labelText = "participants";
    const labelWidth = ctx.measureText(labelText).width;
    ctx.fillText(labelText, centerX - (labelWidth / 2), centerY + 18);

    const buffer = canvas.toBuffer("image/png");
    return buffer;
}



module.exports = {
    generatePollChart,
    generateGiveawayChart
};

