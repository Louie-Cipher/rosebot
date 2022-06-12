import { ApplicationCommandDataResolvable, Collection, Guild } from 'discord.js';
import { readdirSync } from 'fs';
import { consoleError, consoleLog } from '.';
import { CommandType } from '../typings/Command';

const commands = new Collection<string, CommandType>();
const commandsToAPI: ApplicationCommandDataResolvable[] = [];

const importFile = async (filePath: string) => (await import(filePath))?.default;

export async function loadCommands() {

    const commandsPath = readdirSync(`${__dirname}/../commands/`);

    for (const category of commandsPath) {

        console.log(`┌${category}`);

        const categoryFiles = readdirSync(`${__dirname}/../commands/${category}`);

        if (categoryFiles.length === 0) continue;

        for (const file of categoryFiles) {

            console.log(`├--${file}`);

            const command: CommandType = await importFile(`${__dirname}/../commands/${category}/${file}`);
            if (!command || !command.data) continue;

            commands.set(command.data.name, command);
            commandsToAPI.push(command.data.toJSON());
        }
    }
}

export default commands;

export async function registerCommands(guild: Guild) {
    try {
        await guild.commands.set(commandsToAPI);
        consoleLog(`Comandos registrados na API do Discord`);
    }
    catch (err) { consoleError(err) }
}