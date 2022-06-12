import { Client } from "discord.js";
import { consoleError } from ".";
import { initDB } from "../db";
import { loadCommands } from "../utils/loadCommands";
import { loadEvents } from "../utils/loadEvents";

export async function init(client: Client) {
    try {
        await loadCommands();
        await initDB();
        await loadEvents();
        await client.login(process.env.botToken);
    }
    catch (err) { consoleError(err) }
}