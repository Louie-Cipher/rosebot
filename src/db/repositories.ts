import { DB } from ".";
import { MembersDBmodel, ButtonRolesDBmodel, GlobalDB, BansDB } from "./entities";

export const membersDBrepo = DB.getRepository(MembersDBmodel);
export const buttonRolesDBrepo = DB.getRepository(ButtonRolesDBmodel);
export const globalDBrepo = DB.getRepository(GlobalDB);
export const bansDBrepo = DB.getRepository(BansDB);