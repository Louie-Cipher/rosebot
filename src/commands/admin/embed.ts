import { SlashCommandBuilder } from "@discordjs/builders";
import { ColorResolvable, MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";
import { consoleError } from "../../utils";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('envia uma mensagem embed no chat')
        .addStringOption(option => option
            .setName('color')
            .setDescription('cor da embed')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('title')
            .setDescription('título da embed')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('description')
            .setDescription('descrição da embed')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('thumbnail')
            .setDescription('url da thumbnail da embed')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('image')
            .setDescription('url da imagem da embed')
            .setRequired(false)
        )
        .addStringOption(option => option
            .setName('footer')
            .setDescription('texto do rodapé da embed')
            .setRequired(false)
        ),

    permissions: ['MANAGE_MESSAGES'],

    execute: async ({ interaction }) => {
        try {

            await interaction.deferReply({ ephemeral: true });

            const color: ColorResolvable = interaction.options.getString('color') as ColorResolvable || 'AQUA';
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const thumbnail = interaction.options.getString('thumbnail');
            const image = interaction.options.getString('image');
            const footer = interaction.options.getString('footer');

            let embed = new MessageEmbed().setColor(color);

            if (title) embed.setTitle(title.replaceAll('\\n', '\n'));
            if (description) embed.setDescription(description.replaceAll('\\n', '\n'));
            if (thumbnail) embed.setThumbnail(thumbnail);
            if (image) embed.setImage(image);
            if (footer) embed.setFooter({ text: footer.replaceAll('\\n', '\n') });

            const message = await interaction.channel.send({ embeds: [embed] });

            interaction.editReply({
                embeds: [{
                    color: 'GREEN',
                    title: '✅ | mensagem embed enviada com sucesso',
                    description: `**ID da mensagem:** \`${message.id}\``
                }]
            });

        }
        catch (err) {
            consoleError('[COMMAND:EMBED] ', err);

            interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: '❌ | erro ao enviar a mensagem embed',
                    description: `${err}`
                }]
            }).catch(() => { });
        }

    }
});