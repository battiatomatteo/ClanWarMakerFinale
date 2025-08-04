import { type PlayerRegistration, type InsertPlayerRegistration, type Clan, type InsertClan, type CwlMessage, type InsertCwlMessage, type ClanConfiguration } from "@shared/schema";
import { playerRegistrations, clans, cwlMessages } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { promises as fs } from "fs";
import path from "path";

export interface IStorage {
  // Player registrations
  getPlayerRegistrations(): Promise<PlayerRegistration[]>;
  addPlayerRegistration(registration: InsertPlayerRegistration): Promise<PlayerRegistration>;
  clearPlayerRegistrations(): Promise<void>;

  // Clans
  getClans(): Promise<Clan[]>;
  addClan(clan: InsertClan): Promise<Clan>;

  // CWL Messages
  saveCwlMessage(message: InsertCwlMessage): Promise<CwlMessage>;

  // File operations
  saveToFile(filename: string, content: string): Promise<void>;
  readFromFile(filename: string): Promise<string>;
  clearFile(filename: string): Promise<void>;

  // Clan configuration
  getClanConfiguration(): Promise<ClanConfiguration>;
  saveClanConfiguration(config: ClanConfiguration): Promise<ClanConfiguration>;
}

export class SQLiteStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.ensureDataDir();

    const dbPath = path.join(this.dataDir, 'database.db');
    const sqlite = new Database(dbPath);
    this.db = drizzle(sqlite);

    this.initializeDatabase();
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private initializeDatabase(): void {
    // Create tables if they don't exist
    this.db.run(`
      CREATE TABLE IF NOT EXISTS player_registrations (
        id TEXT PRIMARY KEY,
        player_name TEXT NOT NULL,
        th_level TEXT NOT NULL,
        registered_at INTEGER
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS clans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        participants INTEGER NOT NULL,
        league TEXT NOT NULL,
        created_at INTEGER
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS cwl_messages (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at INTEGER
      )
    `);

    console.log('Database SQLite inizializzato');
  }

  async getPlayerRegistrations(): Promise<PlayerRegistration[]> {
    return this.db.select().from(playerRegistrations);
  }

  async addPlayerRegistration(insertRegistration: InsertPlayerRegistration): Promise<PlayerRegistration> {
    const registration: PlayerRegistration = {
      id: crypto.randomUUID(),
      playerName: insertRegistration.playerName,
      thLevel: insertRegistration.thLevel,
      registeredAt: new Date(),
    };

    await this.db.insert(playerRegistrations).values(registration);

    // Salva anche nel file di testo per compatibilità
    const fileContent = `${registration.playerName} ${registration.thLevel}\n`;
    await this.appendToFile('listaIscrizioni.txt', fileContent);

    console.log(`Registrazione salvata nel database: ${registration.playerName}`);
    return registration;
  }

  async clearPlayerRegistrations(): Promise<void> {
    await this.db.delete(playerRegistrations);

    // Cancella anche il file di testo
    await this.clearFile('listaIscrizioni.txt');

    console.log('Tutte le registrazioni sono state cancellate dal database');
  }

  async getClans(): Promise<Clan[]> {
    return this.db.select().from(clans);
  }

  async addClan(insertClan: InsertClan): Promise<Clan> {
    const clan: Clan = {
      id: crypto.randomUUID(),
      name: insertClan.name,
      participants: insertClan.participants,
      league: insertClan.league,
      createdAt: new Date(),
    };

    await this.db.insert(clans).values(clan);
    return clan;
  }

  async saveCwlMessage(insertMessage: InsertCwlMessage): Promise<CwlMessage> {
    const message: CwlMessage = {
      id: crypto.randomUUID(),
      content: insertMessage.content,
      createdAt: new Date(),
    };

    await this.db.insert(cwlMessages).values(message);
    return message;
  }

  async saveToFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readFromFile(filename: string): Promise<string> {
    const filePath = path.join(this.dataDir, filename);
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  async clearFile(filename: string): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    await fs.writeFile(filePath, '', 'utf-8');
  }

  private async appendToFile(filename: string, content: string): Promise<void> {
    const filePath = path.join(this.dataDir, filename);
    await fs.appendFile(filePath, content, 'utf-8');
  }

  // Clan Configuration methods
  async getClanConfiguration(): Promise<ClanConfiguration> {
    const configPath = path.join(process.cwd(), 'data', 'clan-config.json');

    const defaultConfig: ClanConfiguration = {
      clanName: "Eclipse Clan",
      clanDescription: "Clan competitivo italiano specializzato in Clan War League. Cerchiamo sempre nuovi membri attivi e determinati a migliorare.",
      league: "Crystal League I",
      activeMembers: 45,
      maxMembers: 50,
      winRate: 85,
      requirements: "Town Hall 12+ preferito, attacco consistente nelle war",
      nextCwlInfo: "Registrazioni aperte fino al 28 del mese"
    };

    try {
      const data = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Se il file non esiste, crea con configurazione di default
      await this.saveClanConfiguration(defaultConfig);
      return defaultConfig;
    }
  }

  async saveClanConfiguration(config: ClanConfiguration): Promise<ClanConfiguration> {
    const configPath = path.join(process.cwd(), 'data', 'clan-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return config;
  }
}

export const storage = new SQLiteStorage();