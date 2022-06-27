import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageEmbed } from "discord.js";
import { Command } from "../../structures/Command";
import { consoleError } from "../../utils";

export default new Command({
    data: new SlashCommandBuilder()
        .setName('castigo')
        .setDescription('coloca um membro de castigo')
        .addUserOption(option => option
            .setName('user')
            .setDescription('usuário para aplicar o castigo')
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName('time')
            .setDescription('tempo de castigo em segundos')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(1099511627776), // MODERATE_MEMBERS

    execute: async ({ interaction }) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const user = interaction.options.getUser('user');
            const time = interaction.options.getInteger('time');

            const member = interaction.guild.members.cache.get(user.id);

            if (!member) return interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: '❌ | Membro não encontrado',
                    description: 'Usuário informado não foi encontrado no servidor'
                }]
            }).catch(() => { });

            if (!member.manageable) return interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: '❌ | Não é possível aplicar castigo',
                    description: 'Eu não tenho permissão para aplicar castigo a este membro.\n' +
                        'Só posso aplicar castigo a membros com cargos abaixo do meu'
                }]
            }).catch(() => { });

            try { await member.timeout(time * 1000, `Timeout por: ${interaction.user.tag}`) }
            catch (err) {
                return interaction.editReply({
                    embeds: [{
                        color: 'RED',
                        title: '❌ | Erro ao aplicar castigo',
                        description: `\`\`\`\n${err}\n\`\`\`\``
                    }]
                }).catch(() => { });
            }

            let embed = new MessageEmbed()
                .setColor('GREEN')

            if (time === 0) embed
                .setTitle('✅ | Castigo removido')
                .setDescription(`${user.toString()} não está mais de castigo`)

            else embed
                .setTitle('✅ | Castigo aplicado')
                .setDescription(`${user.toString()} foi colocado em castigo por ${time} segundos`)

            return interaction.editReply({
                embeds: [embed]
            }).catch(() => { });
        }
        catch (err) { consoleError('[COMANDO:CASTIGO] ', err) }

    }
});