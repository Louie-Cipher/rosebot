import { User } from "discord.js";
import { DB } from ".";
import { consoleError } from "../utils";
import { MembersDBmodel } from "./entities";

export async function getMember(user: User) {
    try {
        const memberDB = await DB.manager.findOneBy(MembersDBmodel, { id: user.id });

        if (!memberDB) {
            const newMemberDB = new MembersDBmodel();
            newMemberDB.id = user.id;
            newMemberDB.chatXP = 0;
            newMemberDB.voiceXP = 0;
            newMemberDB.wallet = 0;
            newMemberDB.bank = 0;
            newMemberDB.createdAt = new Date();
            newMemberDB.updatedAt = new Date();
            return await DB.manager.save(newMemberDB);
        }
        return memberDB;
    }
    catch (err) { consoleError('[DATABASE] ', err) }
}