import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface GaleriItem {
  id: string;
  url: string;
  judul: string;
  kategori: string;
  lokasi: string;
  tanggal: string;
  deskripsi: string;
}

export interface InovasiItem {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  categoryEn?: string;
  url: string | null;
  status: string;
  highlight: string;
  highlightEn?: string;
  deskripsi: string;
  deskripsiEn?: string;
  techStack: string[];
  stats: { label: string; value: string }[];
  statsEn?: { label: string; value: string }[];
  featuredArtifacts?: { name: string; url: string }[];
  image: string;
  badgeColor?: string;
}

// Find existing seed file
function findSeedPath(filename: string): string | null {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), 'src', 'data', filename),
    path.resolve(currentDir, '..', 'data', filename),
    path.resolve(currentDir, '..', '..', 'src', 'data', filename),
    path.resolve(currentDir, '..', '..', 'data', filename),
    path.join('D:/Antigravity Project/Web Portofolio PPG/src/data', filename),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

// Determine data directory (Docker /app/data or local project /data)
function getDataDir(): string {
  const customDataDir = process.env.DATA_DIR;
  if (customDataDir) {
    if (!fs.existsSync(customDataDir)) {
      fs.mkdirSync(customDataDir, { recursive: true });
    }
    return customDataDir;
  }

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), 'data'),
    path.resolve(currentDir, '..', '..', 'data'),
    path.resolve(currentDir, '..', 'data'),
    'D:/Antigravity Project/Web Portofolio PPG/data',
  ];

  for (const c of candidates) {
    // If parent directory exists, we can create/use this data directory
    const parent = path.dirname(c);
    if (fs.existsSync(parent)) {
      if (!fs.existsSync(c)) {
        fs.mkdirSync(c, { recursive: true });
      }
      return c;
    }
  }

  const fallback = path.join(process.cwd(), 'data');
  if (!fs.existsSync(fallback)) {
    fs.mkdirSync(fallback, { recursive: true });
  }
  return fallback;
}

function getGaleriFilePath(): string {
  return path.join(getDataDir(), 'galeri.json');
}

function getInovasiFilePath(): string {
  return path.join(getDataDir(), 'inovasi.json');
}

// Seed initial data if target doesn't exist
function ensureGaleriSeeded(): void {
  const target = getGaleriFilePath();
  if (!fs.existsSync(target) || fs.statSync(target).size < 5) {
    const seedPath = findSeedPath('galeri.json');
    if (seedPath && fs.existsSync(seedPath)) {
      const initialData = fs.readFileSync(seedPath, 'utf-8');
      fs.writeFileSync(target, initialData, 'utf-8');
    } else {
      fs.writeFileSync(target, JSON.stringify([], null, 2), 'utf-8');
    }
  }
}

// Seed initial data if target doesn't exist
function ensureInovasiSeeded(): void {
  const target = getInovasiFilePath();
  if (!fs.existsSync(target) || fs.statSync(target).size < 5) {
    const seedPath = findSeedPath('inovasi.json');
    if (seedPath && fs.existsSync(seedPath)) {
      const initialData = fs.readFileSync(seedPath, 'utf-8');
      fs.writeFileSync(target, initialData, 'utf-8');
    } else {
      fs.writeFileSync(target, JSON.stringify([], null, 2), 'utf-8');
    }
  }
}

/* ==========================================================================
   GALERI CRUD
   ========================================================================== */

export function getGaleriList(): GaleriItem[] {
  ensureGaleriSeeded();
  try {
    const data = fs.readFileSync(getGaleriFilePath(), 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.error('Failed to read galeri.json:', err);
  }

  // Fallback directly to seed file if present
  const seed = findSeedPath('galeri.json');
  if (seed) {
    try {
      return JSON.parse(fs.readFileSync(seed, 'utf-8'));
    } catch {}
  }
  return [];
}

export function getGaleriById(id: string): GaleriItem | undefined {
  const list = getGaleriList();
  return list.find(item => item.id === id);
}

export function saveGaleriItem(item: GaleriItem): GaleriItem {
  ensureGaleriSeeded();
  const list = getGaleriList();
  const index = list.findIndex(i => i.id === item.id);

  if (index >= 0) {
    list[index] = { ...list[index], ...item };
  } else {
    list.unshift(item);
  }

  fs.writeFileSync(getGaleriFilePath(), JSON.stringify(list, null, 2), 'utf-8');
  return item;
}

export function deleteGaleriItem(id: string): { success: boolean; deletedItem?: GaleriItem } {
  ensureGaleriSeeded();
  const list = getGaleriList();
  const index = list.findIndex(i => i.id === id);
  if (index === -1) {
    return { success: false };
  }

  const [deletedItem] = list.splice(index, 1);
  fs.writeFileSync(getGaleriFilePath(), JSON.stringify(list, null, 2), 'utf-8');
  return { success: true, deletedItem };
}

/* ==========================================================================
   INOVASI CRUD
   ========================================================================== */

export function getInovasiList(): InovasiItem[] {
  ensureInovasiSeeded();
  try {
    const data = fs.readFileSync(getInovasiFilePath(), 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    console.error('Failed to read inovasi.json:', err);
  }

  const seed = findSeedPath('inovasi.json');
  if (seed) {
    try {
      return JSON.parse(fs.readFileSync(seed, 'utf-8'));
    } catch {}
  }
  return [];
}

export function getInovasiById(id: string): InovasiItem | undefined {
  const list = getInovasiList();
  return list.find(item => item.id === id);
}

export function saveInovasiItem(item: InovasiItem): InovasiItem {
  ensureInovasiSeeded();
  const list = getInovasiList();
  const index = list.findIndex(i => i.id === item.id);

  if (index >= 0) {
    list[index] = { ...list[index], ...item };
  } else {
    list.push(item);
  }

  fs.writeFileSync(getInovasiFilePath(), JSON.stringify(list, null, 2), 'utf-8');
  return item;
}

export function deleteInovasiItem(id: string): { success: boolean; deletedItem?: InovasiItem } {
  ensureInovasiSeeded();
  const list = getInovasiList();
  const index = list.findIndex(i => i.id === id);
  if (index === -1) {
    return { success: false };
  }

  const [deletedItem] = list.splice(index, 1);
  fs.writeFileSync(getInovasiFilePath(), JSON.stringify(list, null, 2), 'utf-8');
  return { success: true, deletedItem };
}

/* ==========================================================================
   STATS & BACKUP
   ========================================================================== */

export function getAdminStats() {
  const galeri = getGaleriList();
  const inovasi = getInovasiList();

  const categoriesCount = galeri.reduce((acc, item) => {
    acc[item.kategori] = (acc[item.kategori] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalGaleri: galeri.length,
    totalInovasi: inovasi.length,
    categoriesCount,
  };
}
