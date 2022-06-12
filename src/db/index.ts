import { DataSource } from "typeorm";
import { consoleError, consoleLog } from "../utils";
import { ButtonRolesDBmodel, GlobalDB, MembersDBmodel } from "./entities";

export const DB = new DataSource({
    type: 'sqlite',
    database: "database.sqlite",
    synchronize: true,
    entities: [ButtonRolesDBmodel, MembersDBmodel, GlobalDB],
    subscribers: [],
    migrations: [],
});

export const initDB = async () => {
    await DB.initialize()
        .then(() => consoleLog('[DATABASE] Conectado ao 🏧 de 🎲'))
        .catch(err => consoleError('[DATABASE] ❌ 🏧 | ', err));
}