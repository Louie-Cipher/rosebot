import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageAttachment, } from "discord.js";
import { Command } from "../../structures/Command";
import { Image, createCanvas, loadImage } from 'canvas';

export default new Command({
    data: new SlashCommandBuilder()
        .setName('anya-i-like-this')
        .setDescription('anya mostrando o que ela gosta na tv')
        .addUserOption(option => option
            .setName('user')
            .setDescription('user para ser usado como imagem na TV')
            .setRequired(false)
        )
        .addAttachmentOption(option => option
            .setName('image')
            .setDescription('imagem para ser usada como imagem na TV')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('image-link')
            .setDescription('link da imagem para ser usada como imagem na TV')
            .setRequired(false)
        ),

    execute: async ({ interaction }) => {

        await interaction.deferReply({ ephemeral: false });

        const attachment = interaction.options.getAttachment('image', false);
        const link = interaction.options.getString('image-link', false);
        const user = interaction.options.getUser('user', false) || interaction.user;

        let image: Image;

        if (attachment) {

            if (attachment.width > 2048 || attachment.height > 2048) return interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: '❌ Imagem muito grande, não pode ser usada como imagem na TV',
                    description: 'A altura e a largura da imagem devem ser menores que 2048 px',
                    footer: { text: 'Para melhor enquadramento, recomendado usar imagens quadradas,\nou em paisagem (retangular na horizontal)' }
                }]
            });
            image = await loadImage(attachment.url);
        }
        else if (link) {
            try { image = await loadImage(link); }
            catch (e) {
                return interaction.editReply({
                    embeds: [{
                        color: 'RED',
                        title: '❌ Erro ao carregar imagem',
                        description: 'Verifique se o link está correto, e se ele é uma imagem PNG ou JPG'
                    }]
                });
            }
        }
        else image = await loadImage(user.displayAvatarURL({ format: 'png', dynamic: true, size: 512 }));

        const canvas = createCanvas(1707, 960);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 540, 120, 575, 490);

        const template = await loadImage('https://i.kym-cdn.com/photos/images/original/002/350/347/6fa.png');
        ctx.drawImage(template, 0, 0, 1707, 960);

        interaction.editReply({
            files: [new MessageAttachment(canvas.toBuffer(), 'anya-i-like-this-show.png')],
        });
    }
});