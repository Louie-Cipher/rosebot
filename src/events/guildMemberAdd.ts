import { BaseGuildTextChannel, MessageEmbed } from "discord.js";
import client from "../client";
import { consoleError } from "../utils";

client.on('guildMemberAdd', async (member) => {
    try {
        const welcomeChannel = member.guild.channels.cache.get(process.env.welcomeChannel) as BaseGuildTextChannel;

        if (!welcomeChannel) return;

        let embed = new MessageEmbed()
            .setColor('AQUA')
            .setTitle('Boas vindas ao servidor!')
            .setDescription(`Olá ${member.user.username}! Você está agora no servidor mais poroimpoimpoim do Discord!\nAgora já somos ${member.guild.memberCount} membros!`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))

        welcomeChannel.send({
            content: member.toString(),
            embeds: [embed]
        });
    }
    catch (err) { consoleError('[EVENT:GUILD_MEMBER_ADD] ', err) }
});