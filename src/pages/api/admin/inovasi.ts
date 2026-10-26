import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '../../../lib/auth';
import { getInovasiList, getInovasiById, saveInovasiItem, deleteInovasiItem, type InovasiItem } from '../../../lib/data-store';
import { handleImageUpload, deleteUploadedFile } from '../../../lib/upload-handler';

export const prerender = false;

// GET: List all inovasi items
export const GET: APIRoute = async ({ cookies }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const items = getInovasiList();
  return new Response(JSON.stringify({ success: true, data: items }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: Create new inovasi item
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const id = ((formData.get('id') as string) || `inovasi-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const title = (formData.get('title') as string) || '';
    const titleEn = (formData.get('titleEn') as string) || '';
    const category = (formData.get('category') as string) || 'Karya Inovasi';
    const categoryEn = (formData.get('categoryEn') as string) || 'Innovative Work';
    const url = (formData.get('url') as string) || null;
    const status = (formData.get('status') as string) || 'Implemented';
    const highlight = (formData.get('highlight') as string) || '';
    const highlightEn = (formData.get('highlightEn') as string) || '';
    const deskripsi = (formData.get('deskripsi') as string) || '';
    const deskripsiEn = (formData.get('deskripsiEn') as string) || '';
    const file = formData.get('file') as File | null;

    if (!title.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'Judul inovasi wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let imageUrl = '/img/galeri/ppl2-sman15-05.jpg'; // default placeholder
    if (file && file.size > 0) {
      const uploadResult = await handleImageUpload(file, 'inovasi', id);
      if (uploadResult.success && uploadResult.url) {
        imageUrl = uploadResult.url;
      }
    }

    const newItem: InovasiItem = {
      id,
      title: title.trim(),
      titleEn: titleEn.trim() || undefined,
      category: category.trim(),
      categoryEn: categoryEn.trim() || undefined,
      url: url ? url.trim() : null,
      status: status.trim(),
      highlight: highlight.trim(),
      highlightEn: highlightEn.trim() || undefined,
      deskripsi: deskripsi.trim(),
      deskripsiEn: deskripsiEn.trim() || undefined,
      techStack: ['Inovasi Pembelajaran', 'Problem-Based Learning'],
      stats: [],
      image: imageUrl,
      badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/60',
    };

    saveInovasiItem(newItem);

    return new Response(JSON.stringify({ success: true, message: 'Karya inovasi berhasil ditambahkan.', data: newItem }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error creating inovasi item:', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT: Update existing inovasi item or change its image
export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let id = '';
    let title = '';
    let titleEn = '';
    let category = '';
    let categoryEn = '';
    let url: string | null = null;
    let status = '';
    let highlight = '';
    let highlightEn = '';
    let deskripsi = '';
    let deskripsiEn = '';
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      id = (formData.get('id') as string) || '';
      title = (formData.get('title') as string) || '';
      titleEn = (formData.get('titleEn') as string) || '';
      category = (formData.get('category') as string) || '';
      categoryEn = (formData.get('categoryEn') as string) || '';
      url = (formData.get('url') as string) || null;
      status = (formData.get('status') as string) || '';
      highlight = (formData.get('highlight') as string) || '';
      highlightEn = (formData.get('highlightEn') as string) || '';
      deskripsi = (formData.get('deskripsi') as string) || '';
      deskripsiEn = (formData.get('deskripsiEn') as string) || '';
      file = formData.get('file') as File | null;
    } else {
      const body = await request.json();
      id = body.id || '';
      title = body.title || '';
      titleEn = body.titleEn || '';
      category = body.category || '';
      categoryEn = body.categoryEn || '';
      url = body.url || null;
      status = body.status || '';
      highlight = body.highlight || '';
      highlightEn = body.highlightEn || '';
      deskripsi = body.deskripsi || '';
      deskripsiEn = body.deskripsiEn || '';
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID inovasi wajib disertakan.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = getInovasiById(id);
    if (!existing) {
      return new Response(JSON.stringify({ success: false, message: 'Inovasi tidak ditemukan.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let imageUrl = existing.image;
    if (file && file.size > 0) {
      const uploadResult = await handleImageUpload(file, 'inovasi', id);
      if (uploadResult.success && uploadResult.url) {
        deleteUploadedFile(existing.image);
        imageUrl = uploadResult.url;
      }
    }

    const updatedItem: InovasiItem = {
      ...existing,
      title: title ? title.trim() : existing.title,
      titleEn: titleEn ? titleEn.trim() : existing.titleEn,
      category: category ? category.trim() : existing.category,
      categoryEn: categoryEn ? categoryEn.trim() : existing.categoryEn,
      url: url !== undefined ? (url ? url.trim() : null) : existing.url,
      status: status ? status.trim() : existing.status,
      highlight: highlight ? highlight.trim() : existing.highlight,
      highlightEn: highlightEn ? highlightEn.trim() : existing.highlightEn,
      deskripsi: deskripsi ? deskripsi.trim() : existing.deskripsi,
      deskripsiEn: deskripsiEn ? deskripsiEn.trim() : existing.deskripsiEn,
      image: imageUrl,
    };

    saveInovasiItem(updatedItem);

    return new Response(JSON.stringify({ success: true, message: 'Karya inovasi berhasil diperbarui.', data: updatedItem }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error updating inovasi item:', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: Delete an inovasi item
export const DELETE: APIRoute = async ({ request, url, cookies }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let id = url.searchParams.get('id');
    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // ignore
      }
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID inovasi wajib disertakan.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = deleteInovasiItem(id);
    if (!result.success) {
      return new Response(JSON.stringify({ success: false, message: 'Inovasi tidak ditemukan.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (result.deletedItem?.image) {
      deleteUploadedFile(result.deletedItem.image);
    }

    return new Response(JSON.stringify({ success: true, message: 'Karya inovasi berhasil dihapus.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error deleting inovasi item:', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
