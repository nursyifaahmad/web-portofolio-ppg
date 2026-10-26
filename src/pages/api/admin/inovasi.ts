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

// Internal update logic
async function handleUpdateInovasi(request: Request): Promise<Response> {
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
      const body = await request.json().catch(() => ({}));
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
    if (file && file instanceof File && file.size > 0 && file.name) {
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

    return new Response(JSON.stringify({ success: true, message: 'Inovasi berhasil diperbarui.', data: updatedItem }), {
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
}

// Internal delete logic
async function handleDeleteInovasi(id: string): Promise<Response> {
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

  deleteUploadedFile(existing.image);

  const result = deleteInovasiItem(id);
  if (!result.success) {
    return new Response(JSON.stringify({ success: false, message: 'Gagal menghapus inovasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, message: 'Inovasi berhasil dihapus.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST: Create, Update (if existing id), or Delete
export const POST: APIRoute = async ({ request, cookies, url }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const queryAction = url.searchParams.get('action');
  const queryId = url.searchParams.get('id');

  if (queryAction === 'delete') {
    return handleDeleteInovasi(queryId || '');
  }

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const id = (formData.get('id') as string) || '';
    const action = (formData.get('action') as string) || (formData.get('_method') as string) || '';

    if (action === 'delete') {
      return handleDeleteInovasi(id);
    }

    // If ID belongs to an existing item, UPDATE it
    if (id && getInovasiById(id)) {
      const existing = getInovasiById(id)!;
      const title = (formData.get('title') as string) || '';
      const titleEn = (formData.get('titleEn') as string) || '';
      const category = (formData.get('category') as string) || '';
      const categoryEn = (formData.get('categoryEn') as string) || '';
      const urlVal = (formData.get('url') as string) || null;
      const status = (formData.get('status') as string) || '';
      const highlight = (formData.get('highlight') as string) || '';
      const highlightEn = (formData.get('highlightEn') as string) || '';
      const deskripsi = (formData.get('deskripsi') as string) || '';
      const deskripsiEn = (formData.get('deskripsiEn') as string) || '';
      const file = formData.get('file') as File | null;

      let imageUrl = existing.image;
      if (file && file instanceof File && file.size > 0 && file.name) {
        const uploadResult = await handleImageUpload(file, 'inovasi', id);
        if (uploadResult.success && uploadResult.url) {
          deleteUploadedFile(existing.image);
          imageUrl = uploadResult.url;
        }
      }

      const updatedItem: InovasiItem = {
        ...existing,
        title: title.trim() ? title.trim() : existing.title,
        titleEn: titleEn.trim() ? titleEn.trim() : existing.titleEn,
        category: category.trim() ? category.trim() : existing.category,
        categoryEn: categoryEn.trim() ? categoryEn.trim() : existing.categoryEn,
        url: urlVal !== null ? (urlVal.trim() ? urlVal.trim() : null) : existing.url,
        status: status.trim() ? status.trim() : existing.status,
        highlight: highlight.trim() ? highlight.trim() : existing.highlight,
        highlightEn: highlightEn.trim() ? highlightEn.trim() : existing.highlightEn,
        deskripsi: deskripsi.trim() ? deskripsi.trim() : existing.deskripsi,
        deskripsiEn: deskripsiEn.trim() ? deskripsiEn.trim() : existing.deskripsiEn,
        image: imageUrl,
      };

      saveInovasiItem(updatedItem);
      return new Response(JSON.stringify({ success: true, message: 'Inovasi berhasil diperbarui.', data: updatedItem }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Otherwise CREATE new inovasi
    const newId = (id || `inovasi-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const title = (formData.get('title') as string) || '';
    const titleEn = (formData.get('titleEn') as string) || '';
    const category = (formData.get('category') as string) || 'Karya Inovasi';
    const categoryEn = (formData.get('categoryEn') as string) || 'Innovative Work';
    const urlVal = (formData.get('url') as string) || null;
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

    let imageUrl = '/img/galeri/ppl2-sman15-05.jpg';
    if (file && file instanceof File && file.size > 0 && file.name) {
      const uploadResult = await handleImageUpload(file, 'inovasi', newId);
      if (uploadResult.success && uploadResult.url) {
        imageUrl = uploadResult.url;
      }
    }

    const newItem: InovasiItem = {
      id: newId,
      title: title.trim(),
      titleEn: titleEn.trim() || title.trim(),
      category: category.trim(),
      categoryEn: categoryEn.trim() || category.trim(),
      url: urlVal ? urlVal.trim() : null,
      status: status.trim(),
      highlight: highlight.trim(),
      highlightEn: highlightEn.trim() || highlight.trim(),
      deskripsi: deskripsi.trim(),
      deskripsiEn: deskripsiEn.trim() || deskripsi.trim(),
      image: imageUrl,
      badgeColor: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10',
    };

    saveInovasiItem(newItem);
    return new Response(JSON.stringify({ success: true, message: 'Inovasi baru berhasil ditambahkan.', data: newItem }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // JSON Body fallback
  const body = await request.json().catch(() => ({}));
  if (body.action === 'delete' || body._method === 'DELETE') {
    return handleDeleteInovasi(body.id || '');
  }
  if (body.id) {
    return handleUpdateInovasi(request);
  }

  return new Response(JSON.stringify({ success: false, message: 'Format data tidak valid.' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT: Update existing inovasi item
export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return handleUpdateInovasi(request);
};

// DELETE: Remove inovasi item
export const DELETE: APIRoute = async ({ request, cookies, url }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let id = url.searchParams.get('id') || '';
  if (!id) {
    try {
      const body = await request.json();
      id = body.id || '';
    } catch {}
  }

  return handleDeleteInovasi(id);
};
