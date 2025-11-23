module.exports = async (interaction, client) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== "role_menu") return;

    // Utiliser la configuration dynamique ou les valeurs par défaut
    const roles = client.config.reactionRoles || {};

    try {
        let changes = [];

        for (const v of interaction.values) {
            const roleData = roles[v];
            if (!roleData) {
                changes.push(`⚠️ Rôle "${v}" non configuré`);
                continue;
            }

            const roleId = typeof roleData === "string" ? roleData : roleData.roleId;
            if (!roleId || roleId.startsWith("ID_")) {
                changes.push(`⚠️ Rôle "${v}" non configuré`);
                continue;
            }

            const role = interaction.guild.roles.cache.get(roleId);
            if (!role) {
                changes.push(`❌ Rôle "${v}" introuvable`);
                continue;
            }

            // Vérifier que le bot peut gérer ce rôle
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                changes.push(`⚠️ Impossible de gérer <@&${roleId}> (rôle trop élevé)`);
                continue;
            }

            if (interaction.member.roles.cache.has(roleId)) {
                await interaction.member.roles.remove(roleId);
                changes.push(`➖ Retiré : <@&${roleId}>`);
            } else {
                await interaction.member.roles.add(roleId);
                changes.push(`➕ Ajouté : <@&${roleId}>`);
            }
        }

        const {EmbedBuilder, MessageFlags} = require("discord.js");
        
        if (changes.length > 0) {
            const added = changes.filter(c => c.includes("➕")).length;
            const removed = changes.filter(c => c.includes("➖")).length;
            
            const embed = new EmbedBuilder()
                .setTitle("✅ Rôles mis à jour")
                .setDescription("Vos rôles ont été modifiés avec succès.")
                .addFields({
                    name: "📝 Modifications",
                    value: changes.join("\n"),
                    inline: false
                })
                .setColor(0x00FF00)
                .setFooter({ 
                    text: `Total: ${added} ajouté(s), ${removed} retiré(s)` 
                })
                .setTimestamp();

            await interaction.reply({ 
                embeds: [embed], 
                flags: MessageFlags.Ephemeral 
            });
        } else {
            const embed = new EmbedBuilder()
                .setTitle("ℹ️ Aucun changement")
                .setDescription("Aucun changement n'a été effectué.")
                .setColor(0xFFA500)
                .setTimestamp();

            await interaction.reply({ 
                embeds: [embed], 
                flags: MessageFlags.Ephemeral 
            });
        }
    } catch (error) {
        console.error("Erreur reactionRolesSystem:", error);
        await interaction.reply({ 
            content: "❌ Une erreur s'est produite lors de la gestion des rôles.", 
            flags: MessageFlags.Ephemeral 
        }).catch(() => {});
    }
};
