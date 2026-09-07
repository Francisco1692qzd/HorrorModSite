// Simple JSON file DB - no external DB needed for free tier. Replace with SQLite/Postgres later if needed.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'mods.json');

const DEFAULT_DATA = {
  mods: [
    {
      id: "example-horror",
      slug: "the-whispering-void",
      name: "The Whispering Void",
      summary: "Example horror mod - replace with your first entity. Free download, optional donation.",
      description: "An example entry. Paranormal entity that whispers when you are alone underground. This is placeholder - you will replace the jar and description when your real mod is ready.",
      author: "Your Studio",
      icon: "/placeholder-icon.png",
      versions: [
        {
          version: "1.0.0",
          mcVersion: "1.21.1",
          loader: "neoforge",
          filename: "the-whispering-void-1.0.0.jar",
          size: 0,
          uploadedAt: new Date().toISOString(),
          changelog: "Initial example release"
        }
      ],
      downloads: 0
    }
  ]
};

export function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
    return DEFAULT_DATA;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
