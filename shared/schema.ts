import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const playerRegistrations = sqliteTable("player_registrations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  playerName: text("player_name").notNull(),
  thLevel: text("th_level").notNull(),
  registeredAt: integer("registered_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const clans = sqliteTable("clans", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  participants: integer("participants").notNull(),
  league: text("league").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const cwlMessages = sqliteTable("cwl_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const insertPlayerRegistrationSchema = z.object({
  playerName: z.string()
    .min(1, "Nome player richiesto")
    .refine(val => val.trim().length > 0, "Il nome player non può essere vuoto"),
  thLevel: z.string().min(1, "Livello TH richiesto"),
});

export const insertClanSchema = createInsertSchema(clans).pick({
  name: true,
  participants: true,
  league: true,
});

export const insertCwlMessageSchema = createInsertSchema(cwlMessages).pick({
  content: true,
});

export type InsertPlayerRegistration = z.infer<typeof insertPlayerRegistrationSchema>;
export type PlayerRegistration = typeof playerRegistrations.$inferSelect;
export type Clan = typeof clans.$inferSelect;
export type InsertClan = z.infer<typeof insertClanSchema>;
export type CwlMessage = typeof cwlMessages.$inferSelect;
export type InsertCwlMessage = z.infer<typeof insertCwlMessageSchema>;

// Clan Configuration schema
export const clanConfigurationSchema = z.object({
  clanName: z.string().min(1, "Nome clan richiesto"),
  clanDescription: z.string().min(1, "Descrizione clan richiesta"),
  league: z.string().min(1, "Lega richiesta"),
  activeMembers: z.number().min(1).max(50),
  maxMembers: z.number().min(1).max(50),
  winRate: z.number().min(0).max(100),
  requirements: z.string().min(1, "Requisiti richiesti"),
  nextCwlInfo: z.string().min(1, "Info prossima CWL richiesta"),
});

export type ClanConfiguration = z.infer<typeof clanConfigurationSchema>;

// Clash of Clans API types
export interface ClashPlayer {
  name: string;
  tag: string;
  townHallLevel: number;
  warStars: number;
  trophies: number;
  bestTrophies: number;
  legendStatistics?: any;
}