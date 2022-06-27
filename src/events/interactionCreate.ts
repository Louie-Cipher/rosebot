import { SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction, PermissionResolvable, SnowflakeUtil } from "discord.js";
import client from "../client";
import { getMember } from "../db/getFromDB";
import { buttonRolesDBrepo, membersDBrepo } from "../db/repositories";
import { consoleError } from "../utils";
import slashCommands from '../utils/loadCommands';

client.on('interactionCreate', async (interaction): Promise<any> => {
    try {
        if (interaction.isCommand()) commandHandler(interaction);
        else if (interaction.isButton()) buttonInteraction(interaction);
    }
    catch (err) { consoleError('[EVENT:INTERACTION_CREATE] ', err) }
});

async function commandHandler(interaction: CommandInteraction): Promise<any> {
    try {
        const user = interaction.user;

        const cmdName = interaction.commandName;
        const command = slashCommands.get(cmdName);

        if (!command) return interaction.reply({ content: `❌ | Comando não encontrado`, ephemeral: true });

        const memberDB = await getMember(user);
        memberDB.lastCommand = new Date();
        await membersDBrepo.save(memberDB);

        const permissions = (command.data as SlashCommandBuilder).default_member_permissions;

        if (permissions != undefined && !interaction.channel.permissionsFor(user).has(permissions as PermissionResolvable))
            return interaction.reply({
                embeds: [{
                    color: 'RED',
                    title: '❌',
                    description: 'Você é fraco. Lhe falta permissão para executar esse comando',
                    image: { url: 'https://i.kym-cdn.com/photos/images/newsfeed/001/449/812/41a.jpg' }
                }]
            });

        command.execute({ client, interaction, memberDB });

    } catch (err) { consoleError('[INTERACTION:COMMAND]', err) }
}

async function buttonInteraction(interaction: ButtonInteraction): Promise<any> {
    try {
        const roleId = interaction.customId;
        if (isNaN(parseInt(roleId))) return;
        const roleSnowflake = SnowflakeUtil.deconstruct(roleId);
        if (!roleSnowflake || !roleSnowflake.timestamp) return;

        const buttonRolesDB = await buttonRolesDBrepo.findOneBy({ messageId: interaction.message.id });

        if (!buttonRolesDB) return;

        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return;

        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member) return;

        const rolesId = buttonRolesDB.rolesId.split(',');

        if (member.roles.cache.has(roleId)) {
            await member.roles.remove(roleId);
            return interaction.reply({ content: `🗑 | Cargo ${role.name} removido com sucesso`, ephemeral: true });
        }

        const rolesAlreadyHas = member.roles.cache.filter(role => rolesId.includes(role.id));

        if (rolesAlreadyHas.size >= buttonRolesDB.maxRoles)
            return interaction.reply({ content: `❌ | Você já possui o número máximo de cargos dessa mensagem`, ephemeral: true });

        await member.roles.add(roleId);
        return interaction.reply({ content: `✅ | Cargo ${role.name} adicionado com sucesso`, ephemeral: true });

    }
    catch (err) { consoleError('[INTERACTION:BUTTON_ROLES]', err) }
}