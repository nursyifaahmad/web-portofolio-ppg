import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function getUploadsDir(): string {
  const customDir = process.env.UPLOADS_DIR;
  if (customDir && fs.existsSync(customDir)) {
    return customDir;
  }
  const defaultDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }
  return defaultDir;
}

function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 30);
}

export async function handleImageUpload(
  file: File,
  subfolder: 'galeri' | 'inovasi',
  titleName: string = 'image'
): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
  if (!file || !(file instanceof File) || file.size === 0) {
    return { success: false, error: 'Tidak ada berkas yang dipilih.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'Ukuran berkas melebihi batas maksimal 10 MB.' };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { success: false, error: `Format berkas (${file.type}) tidak didukung. Harap gunakan JPG, PNG, WebP, atau GIF.` };
  }

  const targetDir = path.join(getUploadsDir(), subfolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Determine file extension
  let ext = path.extname(file.name).toLowerCase();
  if (!ext) {
    if (file.type === 'image/jpeg') ext = '.jpg';
    else if (file.type === 'image/png') ext = '.png';
    else if (file.type === 'image/webp') ext = '.webp';
    else if (file.type === 'image/gif') ext = '.gif';
    else ext = '.jpg';
  }

  const slug = sanitizeSlug(titleName) || 'foto';
  const filename = `${subfolder}-${Date.now()}-${slug}${ext}`;
  const filepath = path.join(targetDir, filename);

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filepath, buffer);

    const publicUrl = `/uploads/${subfolder}/${filename}`;
    return { success: true, url: publicUrl, filename };
  } catch (err: any) {
    console.error('Failed to save uploaded file:', err);
    return { success: false, error: `Gagal menyimpan berkas: ${err?.message || err}` };
  }
}

export function deleteUploadedFile(publicUrl: string): boolean {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) {
    // Only delete files in /uploads/ directory to protect original assets
    return false;
  }

  try {
    const relativePath = publicUrl.replace('/uploads/', '');
    const filepath = path.join(getUploadsDir(), relativePath);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to delete file:', publicUrl, err);
    return false;
  }
}
