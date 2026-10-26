import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '../../../lib/auth';
import { getGaleriList, getGaleriById, saveGaleriItem, deleteGaleriItem, type GaleriItem } from '../../../lib/data-store';
import { handleImageUpload, deleteUploadedFile } from '../../../lib/upload-handler';

export const prerender = false;

// GET: List all galeri photos
export const GET: APIRoute = async ({ cookies }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const items = getGaleriList();
  return new Response(JSON.stringify({ success: true, data: items }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: Upload and create new galeri photo
export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const judul = (formData.get('judul') as string) || '';
    const kategori = (formData.get('kategori') as string) || 'ppl-2';
    const lokasi = (formData.get('lokasi') as string) || 'SMAN 15 Bandung';
    const tanggal = (formData.get('tanggal') as string) || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const deskripsi = (formData.get('deskripsi') as string) || '';

    if (!judul.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'Judul foto wajib diisi.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!file || file.size === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Berkas foto wajib diunggah.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save image
    const uploadResult = await handleImageUpload(file, 'galeri', judul);
    if (!uploadResult.success || !uploadResult.url) {
      return new Response(JSON.stringify({ success: false, message: uploadResult.error || 'Gagal mengunggah foto.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create item
    const newItem: GaleriItem = {
      id: `galeri-${Date.now()}`,
      url: uploadResult.url,
      judul: judul.trim(),
      kategori: kategori.trim(),
      lokasi: lokasi.trim(),
      tanggal: tanggal.trim(),
      deskripsi: deskripsi.trim(),
    };

    saveGaleriItem(newItem);

    return new Response(JSON.stringify({ success: true, message: 'Foto berhasil ditambahkan.', data: newItem }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error creating galeri item:', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT: Update existing galeri photo
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
    let judul = '';
    let kategori = '';
    let lokasi = '';
    let tanggal = '';
    let deskripsi = '';
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      id = (formData.get('id') as string) || '';
      judul = (formData.get('judul') as string) || '';
      kategori = (formData.get('kategori') as string) || '';
      lokasi = (formData.get('lokasi') as string) || '';
      tanggal = (formData.get('tanggal') as string) || '';
      deskripsi = (formData.get('deskripsi') as string) || '';
      file = formData.get('file') as File | null;
    } else {
      const body = await request.json();
      id = body.id || '';
      judul = body.judul || '';
      kategori = body.kategori || '';
      lokasi = body.lokasi || '';
      tanggal = body.tanggal || '';
      deskripsi = body.deskripsi || '';
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID foto wajib disertakan.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingItem = getGaleriById(id);
    if (!existingItem) {
      return new Response(JSON.stringify({ success: false, message: 'Foto tidak ditemukan.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let photoUrl = existingItem.url;

    // Replace photo if a new file is uploaded
    if (file && file.size > 0) {
      const uploadResult = await handleImageUpload(file, 'galeri', judul || existingItem.judul);
      if (uploadResult.success && uploadResult.url) {
        // Delete old uploaded file if it was in /uploads/
        deleteUploadedFile(existingItem.url);
        photoUrl = uploadResult.url;
      }
    }

    const updatedItem: GaleriItem = {
      ...existingItem,
      judul: judul !== undefined ? judul.trim() : existingItem.judul,
      kategori: kategori !== undefined ? kategori.trim() : existingItem.kategori,
      lokasi: lokasi !== undefined ? lokasi.trim() : existingItem.lokasi,
      tanggal: tanggal !== undefined ? tanggal.trim() : existingItem.tanggal,
      deskripsi: deskripsi !== undefined ? deskripsi.trim() : existingItem.deskripsi,
      url: photoUrl,
    };

    saveGaleriItem(updatedItem);

    return new Response(JSON.stringify({ success: true, message: 'Foto berhasil diperbarui.', data: updatedItem }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error updating galeri item:', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE: Delete a galeri photo
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
      return new Response(JSON.stringify({ success: false, message: 'ID foto wajib disertakan.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = deleteGaleriItem(id);
    if (!result.success) {
      return new Response(JSON.stringify({ success: false, message: 'Foto tidak ditemukan.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clean up physical file if it was uploaded
    if (result.deletedItem?.url) {
      deleteUploadedFile(result.deletedItem.url);
    }

    return new Response(JSON.stringify({ success: true, message: 'Foto berhasil dihapus.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error deleting galeri item:', err);
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
