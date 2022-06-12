import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageAttachment } from "discord.js";
import { Command } from "../../structures/Command";
import Jimp from 'jimp';

export default new Command({
    data: new SlashCommandBuilder()
        .setName('noot-noot')
        .setDescription('Pingu noot-noot estarrecido, com a imagem escolhida de fundo')
        .addUserOption(option => option
            .setName('user')
            .setDescription('user para ser usado como imagem de fundo')
            .setRequired(false)
        )
        .addAttachmentOption(option => option
            .setName('image')
            .setDescription('imagem para ser usada como imagem de fundo')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('image-link')
            .setDescription('link da imagem para ser usada como imagem de fundo')
            .setRequired(false)
        ),

    execute: async ({ interaction }) => {

        await interaction.deferReply({ ephemeral: false });

        const attachment = interaction.options.getAttachment('image', false);
        const link = interaction.options.getString('image-link', false);
        const user = interaction.options.getUser('user', false) || interaction.user;

        let image: Jimp;

        const aaa = await Jimp.read(attachment.url);

        if (attachment) {
            if (attachment.width > 1920 || attachment.height > 1080) return interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: '❌ Imagem muito grande, não pode ser usada como imagem de fundo',
                    description: 'O tamanho da imagem deve ser igual ou menor que 1920x1080 px'
                }]
            });
            try { image = await Jimp.read(attachment.url); }
            catch (e) {
                return interaction.editReply({
                    embeds: [{
                        color: 'RED',
                        title: '❌ Erro ao carregar imagem'
                    }]
                });
            }
        }
        else if (link) {
            try { image = await Jimp.read(link); }
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
        else image = await Jimp.read(user.displayAvatarURL({ format: 'png', dynamic: false, size: 512 }));

        const pinguImage = await Jimp.read(`${__dirname}/../../../assets/images/nootnoot.png`);

        

    }
});