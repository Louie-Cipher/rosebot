import { SlashCommandBuilder } from "@discordjs/builders";
import { MessageActionRow, MessageButton, MessageEmbed, Role } from "discord.js";
import { buttonRolesDBrepo } from "../../db/repositories";
import { ButtonRolesDBmodel } from "../../db/entities";
import { Command } from "../../structures/Command";
import { consoleError } from "../../utils";

export default new Command({
    data: cmdBuilder(),
    permissions: ['ADMINISTRATOR'],
    execute: async ({ client, interaction }) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const maxUses = interaction.options.getInteger('max-uses') || 1;
            const messageId = interaction.options.getString('message-id');
            const message = await interaction.channel.messages.fetch(messageId);

            if (!message) return interaction.reply({ content: 'mensagem não encontrada' });

            if (message.author.id !== client.user.id) return interaction.editReply({
                embeds: [{
                    color: 'RED',
                    title: 'Mensagem não pertence ao bot',
                    description: 'Você precisa informar uma mensagem enviada por mim, RoseBot :3'
                }]
            });

            let successEmbed = new MessageEmbed()
                .setColor('GREEN')
                .setTitle('✅ | Cargos por botões adicionados com sucesso')
                .setDescription(`Máximo de ${maxUses} cargo(s) por usuário`);

            let rows: MessageActionRow[] = [new MessageActionRow()];
            let rolesId = '';

            for (let i = 0; i < 10; i++) {

                const role = interaction.options.getRole(`cargo-${i + 1}`) as Role;
                if (!role) continue;

                rolesId += `${role.id}`;
                if (i < 9) rolesId += ',';

                if (i === 4) rows.push(new MessageActionRow());

                rows[Math.floor((i + 1) / 5)].addComponents(
                    new MessageButton()
                        .setLabel(role.name)
                        .setCustomId(role.id)
                        .setStyle('PRIMARY')
                );

                successEmbed.addField(`Cargo ${i + 1}`, role.toString(), true);
            }

            const DBdata = new ButtonRolesDBmodel();
            DBdata.messageId = message.id;
            DBdata.rolesId = rolesId;
            DBdata.maxRoles = maxUses;

            await buttonRolesDBrepo.save(DBdata);

            await message.edit({
                components: rows
            });

            interaction.editReply({
                embeds: [successEmbed]
            });

        }
        catch (err) { consoleError('[COMANDO:BUTTON_ROLES] ', err) }
    }
});

function cmdBuilder() {

    let data = new SlashCommandBuilder()
        .setName('button-roles')
        .setDescription('gera uma mensagem de cargos por botões')
        .addIntegerOption(option => option
            .setName('max-uses')
            .setDescription('quantidade máxima de cargos para adicionar')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addStringOption(option => option
            .setName('message-id')
            .setDescription('id da mensagem que terá os cargos por botões')
            .setRequired(true)
        );

    for (let i = 0; i < 10; i++) {
        data.addRoleOption(option => option
            .setName(`cargo-${i + 1}`)
            .setDescription(`cargo ${i + 1}`)
            .setRequired(i === 0)
        );
    }
    return data;
}