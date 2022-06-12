import { BaseGuildTextChannel, MessageEmbed } from "discord.js";
import client from "../client";
import { consoleError } from "../utils";

client.on('guildMemberRemove', async (member) => {
    try {
        const welcomeChannel = member.guild.channels.cache.get(process.env.leaveChannel) as BaseGuildTextChannel;

        if (!welcomeChannel) return;

        welcomeChannel.send({
            content: member.toString(),
            embeds: [{
                color: 'YELLOW',
                title: 'Membro saiu do servidor 😭',
                description: `${member.user.toString()} saiu do servidor!\n` +
                    `Agora temos ${member.guild.memberCount} membros`,
                fields: [
                    { name: 'ID', value: member.id, inline: true },
                    { name: 'Nome', value: member.user.username, inline: true },
                ]
            }]
        });
    }
    catch (err) { consoleError('[EVENT:GUILD_MEMBER_REMOVE] ', err) }
});