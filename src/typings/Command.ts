import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { Client, CommandInteraction, PermissionResolvable } from "discord.js";
import { MembersDBmodel } from "../db/entities";

interface ExecuteOptions {
    client: Client;
    interaction: CommandInteraction;
    memberDB: MembersDBmodel;
}

type ExecuteFunction = (options: ExecuteOptions) => any;

export type CommandType = {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder;
    permissions?: PermissionResolvable[];
    execute: ExecuteFunction;
}