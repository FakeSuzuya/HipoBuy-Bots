const levelSystem = require("../systems/levelSystem");
const economySystem = require("../systems/economySystem");
const analyticsSystem = require("../systems/analyticsSystem");

module.exports = (client) => {
    client.on("messageCreate", async (message) => {
        // Ignorer les bots et les messages sans serveur
        if (message.author.bot || !message.guild) return;
        
        // Ignorer les commandes
        if (message.content.startsWith("/")) return;

        try {
            // Ajouter de l'XP (avec cooldown intégré)
            const xpResult = levelSystem.addXP(message.guild.id, message.author.id, 1);
            
            // Récompense d'argent pour les messages (1-5 pièces aléatoires)
            const moneyReward = Math.floor(Math.random() * 5) + 1;
            economySystem.addMoney(message.guild.id, message.author.id, moneyReward, "message");
            
            // Tracking analytics
            analyticsSystem.trackEvent(message.guild.id, "messages", {
                userId: message.author.id,
                channelId: message.channel.id
            });

            // Vérifier le badge "premier message"
            const badgeSystem = require("../systems/badgeSystem");
            badgeSystem.checkAutoBadges(message.guild.id, message.author.id, "first_message", true);

            // Notification de montée de niveau et attribution de récompenses
            if (xpResult.leveledUp) {
                const { EmbedBuilder } = require("discord.js");
                const levelRewardSystem = require("../systems/levelRewardSystem");
                const economySystem = require("../systems/economySystem");
                const notificationSystem = require("../systems/notificationSystem");
                
                // Vérifier les récompenses pour ce niveau
                const rewards = levelRewardSystem.getRewardsForLevel(message.guild.id, xpResult.level);
                
                let rewardText = "";
                const rewardList = [];
                for (const reward of rewards) {
                    if (reward.type === "role") {
                        try {
                            const member = await message.guild.members.fetch(message.author.id);
                            const role = message.guild.roles.cache.get(reward.value);
                            if (role && !member.roles.cache.has(role.id)) {
                                await member.roles.add(role);
                                rewardText += `\n🎁 Rôle obtenu : ${role}`;
                                rewardList.push(`🎁 Rôle : ${role.name}`);
                            }
                        } catch (error) {
                            console.error("Erreur attribution rôle:", error);
                        }
                    } else if (reward.type === "money") {
                        economySystem.addMoney(message.guild.id, message.author.id, parseInt(reward.value), "level_reward");
                        rewardText += `\n💰 ${reward.value} 💰 obtenus !`;
                        rewardList.push(`💰 ${reward.value} 💰`);
                    }
                }

                // Vérifier les badges automatiques
                const newBadges = badgeSystem.checkAutoBadges(message.guild.id, message.author.id, "level", xpResult.level);
                if (newBadges.length > 0) {
                    rewardText += `\n🏅 Badge(s) obtenu(s) : ${newBadges.map(b => `${b.emoji} ${b.name}`).join(", ")}`;
                    rewardList.push(...newBadges.map(b => `🏅 ${b.name}`));
                }

                // Vérifier les auto-roles basés sur le niveau
                const autoRoleSystem = require("../systems/autoRoleSystem");
                try {
                    const member = await message.guild.members.fetch(message.author.id);
                    await autoRoleSystem.checkAutoRoles(member, message.client);
                } catch (error) {
                    console.error("Erreur vérification auto-roles:", error);
                }
                
                // Envoyer une notification en MP
                await notificationSystem.notifyLevelUp(message.author, xpResult.level, rewardList).catch(() => {});
                
                const embed = new EmbedBuilder()
                    .setTitle("🎉 Félicitations !")
                    .setDescription(`**${message.author}** a atteint le **niveau ${xpResult.level}** !${rewardText}`)
                    .setColor(0x00FF00)
                    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();

                // Envoyer dans le salon actuel (optionnel, peut être désactivé)
                // await message.channel.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (error) {
            console.error("Erreur messageXP:", error);
        }
    });
};

