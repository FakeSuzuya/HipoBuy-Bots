const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const backupsDir = path.join(__dirname, "../backups");

function initBackupsDir() {
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }
}

// Créer un backup
function createBackup(guildId, description = null) {
    initBackupsDir();
    
    const timestamp = Date.now();
    const backupId = crypto.randomBytes(8).toString("hex");
    const backupDir = path.join(backupsDir, `${guildId}`, backupId);
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const dataDir = path.join(__dirname, "../data");
    const filesToBackup = [
        "levels.json",
        "economy.json",
        "moderation.json",
        "analytics.json",
        "giveaways.json",
        "suggestions.json",
        "levelRewards.json",
        "profiles.json",
        "games.json"
    ];
    
    const backup = {
        id: backupId,
        guildId,
        timestamp,
        description,
        files: [],
        size: 0
    };
    
    filesToBackup.forEach(file => {
        const sourcePath = path.join(dataDir, file);
        if (fs.existsSync(sourcePath)) {
            const destPath = path.join(backupDir, file);
            fs.copyFileSync(sourcePath, destPath);
            backup.files.push(file);
            backup.size += fs.statSync(sourcePath).size;
        }
    });
    
    // Sauvegarder aussi config.json
    const configPath = path.join(__dirname, "../config.json");
    if (fs.existsSync(configPath)) {
        const destPath = path.join(backupDir, "config.json");
        fs.copyFileSync(configPath, destPath);
        backup.files.push("config.json");
        backup.size += fs.statSync(configPath).size;
    }
    
    // Sauvegarder les métadonnées
    const metadataPath = path.join(backupDir, "metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(backup, null, 2), "utf-8");
    
    return backup;
}

// Restaurer un backup
function restoreBackup(guildId, backupId) {
    const backupDir = path.join(backupsDir, `${guildId}`, backupId);
    
    if (!fs.existsSync(backupDir)) {
        return { success: false, error: "Backup introuvable" };
    }
    
    const metadataPath = path.join(backupDir, "metadata.json");
    if (!fs.existsSync(metadataPath)) {
        return { success: false, error: "Métadonnées introuvables" };
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    const dataDir = path.join(__dirname, "../data");
    
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    metadata.files.forEach(file => {
        const sourcePath = path.join(backupDir, file);
        if (fs.existsSync(sourcePath)) {
            if (file === "config.json") {
                // Ne pas restaurer config.json automatiquement
                return;
            }
            const destPath = path.join(dataDir, file);
            fs.copyFileSync(sourcePath, destPath);
        }
    });
    
    return { success: true, backup: metadata };
}

// Lister les backups
function listBackups(guildId) {
    const guildBackupsDir = path.join(backupsDir, `${guildId}`);
    
    if (!fs.existsSync(guildBackupsDir)) {
        return [];
    }
    
    const backups = [];
    const dirs = fs.readdirSync(guildBackupsDir);
    
    dirs.forEach(dir => {
        const metadataPath = path.join(guildBackupsDir, dir, "metadata.json");
        if (fs.existsSync(metadataPath)) {
            try {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
                backups.push(metadata);
            } catch (error) {
                console.error(`Erreur lecture backup ${dir}:`, error);
            }
        }
    });
    
    return backups.sort((a, b) => b.timestamp - a.timestamp);
}

// Supprimer un backup
function deleteBackup(guildId, backupId) {
    const backupDir = path.join(backupsDir, `${guildId}`, backupId);
    
    if (!fs.existsSync(backupDir)) {
        return { success: false, error: "Backup introuvable" };
    }
    
    fs.rmSync(backupDir, { recursive: true, force: true });
    
    return { success: true };
}

// Exporter un backup
function exportBackup(guildId, backupId) {
    const backupDir = path.join(backupsDir, `${guildId}`, backupId);
    
    if (!fs.existsSync(backupDir)) {
        return { success: false, error: "Backup introuvable" };
    }
    
    // Créer une archive ZIP (nécessiterait une lib comme archiver)
    // Pour l'instant, on retourne juste le chemin
    return { success: true, path: backupDir };
}

// Importer un backup
function importBackup(guildId, backupPath) {
    if (!fs.existsSync(backupPath)) {
        return { success: false, error: "Fichier introuvable" };
    }
    
    const metadataPath = path.join(backupPath, "metadata.json");
    if (!fs.existsSync(metadataPath)) {
        return { success: false, error: "Backup invalide" };
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    return restoreBackup(guildId, metadata.id);
}

module.exports = {
    createBackup,
    restoreBackup,
    listBackups,
    deleteBackup,
    exportBackup,
    importBackup
};

