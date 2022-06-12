import { SlashCommandBuilder } from "@discordjs/builders";
import { Message, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('Beija a pessoa mencionada')
        .addUserOption(option => option
            .setName('user')
            .setDescription('Usuário para beijar')
            .setRequired(true)
        ),

    execute: async ({ client, interaction }) => {

        await interaction.deferReply({ ephemeral: false });

        const targetUser = interaction.options.getUser('user');

        if (targetUser.id === interaction.user.id) return interaction.editReply({
            embeds: [{
                color: 'AQUA',
                title: '😘 | Beijo',
                description: `${interaction.user.toString()} se beijou`,
                footer: { text: 'Amor próprio é tudo :3' }
            }]
        });

        if (targetUser.id === client.user.id) return interaction.editReply({
            embeds: [{
                color: 'AQUA',
                title: '😘 | Beijo',
                description: `v... você quer me beijar? Estou envergonhada 👉👈`,
            }]
        });

        if (targetUser.bot) return interaction.editReply({
            embeds: [{
                color: 'YELLOW',
                title: '😘 | Beijo',
                description: `Ei, vc não pode beijar bots, I.As e outros seres não sencientes`,
                footer: { text: 'E nada de se apaixonar por personagem ein' }
            }]
        });

        const embed = new MessageEmbed()
            .setColor('AQUA')
            .setTitle('😘 | Beijo')
            .setDescription('Clique no botão abaixo para aceitar\nOwO');

        const message = await interaction.editReply({
            content: `Olá ${targetUser.toString()}, ${interaction.user.toString()} quer beijar vc :3`,
            embeds: [embed],
            components: [acceptButton]
        }) as Message;

        const collector = message.createMessageComponentCollector({
            filter: (int) => int.isButton() && int.user.id === targetUser.id,
            max: 1,
            time: 20 * 60_000 // 20 min
        });

        collector.on('collect', async (buttonInt) => {
            if (!buttonInt.isButton()) return;
            await buttonInt.deferReply({ ephemeral: false });

            const image = images[Math.floor(Math.random() * images.length)];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];

            const embed = new MessageEmbed()
                .setColor('AQUA')
                .setTitle(`${emoji} | Beijo`)
                .setDescription(`${interaction.user.toString()} e ${targetUser.toString()} se beijaram :3`)
                .setImage(image[0])
                .setFooter({ text: `® ${image[1]}` });

            interaction.editReply({
                embeds: [embed],
                components: [],
            });
            collector.stop();
            buttonInt.deleteReply().catch(() => { });
        });

    }
});

const acceptButton = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setLabel('Corresponder')
            .setCustomId('accept')
            .setStyle('PRIMARY')
            .setEmoji('😚')
    )

const emojis = [
    '<:g_emoji_uwu:866481897479733268>',
    '😘',
    '💕',
]

const images = [
    ['', ''],
    ['', ''],
]