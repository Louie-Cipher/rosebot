import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { membersDBrepo } from "./repositories"

@Entity({ name: 'buttonRoles' })
export class ButtonRolesDBmodel {
    @PrimaryColumn({ type: "varchar", length: 32 })
    messageId: string

    @Column({ type: 'varchar', length: 255 })
    rolesId: string

    @Column({ type: 'smallint', default: 1 })
    maxRoles: number
}

@Entity({ name: 'members' })
export class MembersDBmodel {
    @PrimaryColumn({ type: "varchar", length: 32 })
    id: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    usertag: string

    @Column({ type: 'integer' })
    chatXP: number

    @Column({ type: 'integer' })
    voiceXP: number

    @Column({ type: 'integer' })
    wallet: number

    @Column({ type: 'integer' })
    bank: number

    @Column({ type: 'integer', nullable: true })
    emojiGameRecord: number

    @Column({ type: 'boolean', default: false })
    doNotDisturb: boolean

    @Column({ type: 'datetime', nullable: true })
    lastMessage: Date

    @Column({ type: 'datetime', nullable: true })
    lastCommand: Date

    @Column({ type: 'datetime', nullable: true })
    lastDaily: Date

    @Column({ type: 'integer', default: 0 })
    dailyCombo: number

    @Column({ type: 'datetime' })
    createdAt: Date

    @Column({ type: 'datetime' })
    updatedAt: Date
}

@Entity({ name: 'global' })
export class GlobalDB {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 32 })
    welcomeChannel: string

    @Column({ type: 'varchar', length: 32 })
    logChannel: string
}

@Entity({ name: 'bans' })
export class BansDB {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 32 })
    userId: string

    @Column({ type: 'varchar', length: 32, nullable: true })
    banModId?: string

    @Column({ type: 'varchar', length: 32, nullable: true })
    unbanModId?: string

    @Column({ type: 'boolean', default: true })
    active: boolean

    @Column({ type: 'varchar', length: 255, default: 'não informado' })
    banReason: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    unbanReason?: string

    @Column({ type: 'datetime' })
    bannedAt: Date

    @Column({ type: 'datetime', nullable: true })
    unbannedAt?: Date
}