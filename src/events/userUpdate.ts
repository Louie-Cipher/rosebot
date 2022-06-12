import client from "../client";
import { consoleError } from "../utils";
import { getMember } from "../db/getFromDB";
import { membersDBrepo } from "../db/repositories";

client.on('userUpdate', async (oldUser, newUser) => {
    try {
        if (oldUser.tag !== newUser.tag) {
            const memberDB = await getMember(newUser);
            memberDB.usertag = newUser.tag;
            await membersDBrepo.save(memberDB);
        }
    } catch (err) { consoleError('[EVENT:USER_UPDATE] ',err) }
});