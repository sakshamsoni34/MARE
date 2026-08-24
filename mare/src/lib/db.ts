import { open } from 'sqlite';
import path from 'path';

let dbInstance: any = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  
  // Lazy import sqlite3 to prevent crash on route initialization
  const sqlite3 = require('sqlite3');
  
  // Connect to the shared mare.db file inside the backend directory
  const dbPath = path.join(process.cwd(), 'backend/mare.db');
  
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  return dbInstance;
}

