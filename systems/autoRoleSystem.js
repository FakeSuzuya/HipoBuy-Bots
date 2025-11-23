const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "../data/autoRoles.json");

function initDataFile() {
    const dataDir = path.join(__dirname, "../data");
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
    } catch {
        return {};
    }
}

function saveData(data) {
    initDataFile();
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}

// Obtenir la configuration des auto-roles
function getAutoRoleConfig(guildId) {
    const data = loadData();
    return data[guildId] || {
        timeBased: [], // { roleId, days }
        levelBased: [], // { roleId, level }
        activityBased: [], // { roleId, messages }
        boostBased: false, // { roleId }
        boostRoleId: null
    };
}

// Configurer les auto-roles
function setAutoRoleConfig(guildId, config) {
    const data = loadData();
    data[guildId] = {
        ...getAutoRoleConfig(guildId),
        ...config
    };
    saveData(data);
    return data[guildId];
}

// Ajouter un rôle basé sur le temps
function addTimeBasedRole(guildId, roleId, days) {
    const config = getAutoRoleConfig(guildId);
    if (!config.timeBased) config.timeBased = [];
    
    // Vérifier si le rôle existe déjà
    if (config.timeBased.find(r => r.roleId === roleId)) {
        return false;
    }

    config.timeBased.push({ roleId, days });
    setAutoRoleConfig(guildId, config);
    return true;
}

// Ajouter un rôle basé sur le niveau
function addLevelBasedRole(guildId, roleId, level) {
    const config = getAutoRoleConfig(guildId);
    if (!config.levelBased) config.levelBased = [];
    
    if (config.levelBased.find(r => r.roleId === roleId)) {
        return false;
    }

    config.levelBased.push({ roleId, level });
    setAutoRoleConfig(guildId, config);
    return true;
}

// Ajouter un rôle basé sur l'activité
function addActivityBasedRole(guildId, roleId, messages) {
    const config = getAutoRoleConfig(guildId);
    if (!config.activityBased) config.activityBased = [];
    
    if (config.activityBased.find(r => r.roleId === roleId)) {
        return false;
    }

    config.activityBased.push({ roleId, messages });
    setAutoRoleConfig(guildId, config);
    return true;
}

// Retirer un auto-role
function removeAutoRole(guildId, type, roleId) {
    const config = getAutoRoleConfig(guildId);
    
    switch (type) {
        case "time":
            if (!config.timeBased) return false;
            const timeIndex = config.timeBased.findIndex(r => r.roleId === roleId);
            if (timeIndex === -1) return false;
            config.timeBased.splice(timeIndex, 1);
            break;
        case "level":
            if (!config.levelBased) return false;
            const levelIndex = config.levelBased.findIndex(r => r.roleId === roleId);
            if (levelIndex === -1) return false;
            config.levelBased.splice(levelIndex, 1);
            break;
        case "activity":
            if (!config.activityBased) return false;
            const activityIndex = config.activityBased.findIndex(r => r.roleId === roleId);
            if (activityIndex === -1) return false;
            config.activityBased.splice(activityIndex, 1);
            break;
        default:
            return false;
    }

    setAutoRoleConfig(guildId, config);
    return true;
}

// Vérifier et attribuer les auto-roles
async function checkAutoRoles(member, client) {
    const config = getAutoRoleConfig(member.guild.id);
    const levelSystem = require("./levelSystem");
    const analyticsSystem = require("./analyticsSystem");
    
    try {
        // Rôles basés sur le temps
        if (config.timeBased && config.timeBased.length > 0) {
            const joinDate = member.joinedTimestamp;
            const daysSinceJoin = Math.floor((Date.now() - joinDate) / (1000 * 60 * 60 * 24));
            
            for (const roleConfig of config.timeBased) {
                if (daysSinceJoin >= roleConfig.days) {
                    const role = member.guild.roles.cache.get(roleConfig.roleId);
                    if (role && !member.roles.cache.has(role.id)) {
                        if (member.guild.members.me.roles.highest.position > role.position) {
                            await member.roles.add(role);
                        }
                    }
                }
            }
        }

        // Rôles basés sur le niveau
        if (config.levelBased && config.levelBased.length > 0) {
            const userStats = levelSystem.getUserStats(member.guild.id, member.id);
            
            for (const roleConfig of config.levelBased) {
                if (userStats.level >= roleConfig.level) {
                    const role = member.guild.roles.cache.get(roleConfig.roleId);
                    if (role && !member.roles.cache.has(role.id)) {
                        if (member.guild.members.me.roles.highest.position > role.position) {
                            await member.roles.add(role);
                        }
                    }
                }
            }
        }

        // Rôles basés sur l'activité (messages)
        if (config.activityBased && config.activityBased.length > 0) {
            const stats = analyticsSystem.getStats(member.guild.id, member.id);
            const messageCount = stats?.messages || 0;
            
            for (const roleConfig of config.activityBased) {
                if (messageCount >= roleConfig.messages) {
                    const role = member.guild.roles.cache.get(roleConfig.roleId);
                    if (role && !member.roles.cache.has(role.id)) {
                        if (member.guild.members.me.roles.highest.position > role.position) {
                            await member.roles.add(role);
                        }
                    }
                }
            }
        }

        // Rôle basé sur le boost
        if (config.boostBased && config.boostRoleId) {
            if (member.premiumSince) {
                const role = member.guild.roles.cache.get(config.boostRoleId);
                if (role && !member.roles.cache.has(role.id)) {
                    if (member.guild.members.me.roles.highest.position > role.position) {
                        await member.roles.add(role);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Erreur vérification auto-roles:", error);
    }
}

module.exports = {
    getAutoRoleConfig,
    setAutoRoleConfig,
    addTimeBasedRole,
    addLevelBasedRole,
    addActivityBasedRole,
    removeAutoRole,
    checkAutoRoles
};

