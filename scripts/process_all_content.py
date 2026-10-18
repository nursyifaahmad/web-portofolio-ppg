"""
process_all_content.py
1. Ekstraksi 12 refleksi otentik LK 2 dari file .docx di:
   - public/REFLEKSI SEMESTER 1/
   - public/REFLEKSI SEMESTER 2/
2. Pemetaan 1.000 file artefak perkuliahan di public/Artefak PPG/ ke rute lokal:
   /Artefak PPG/...
3. Sinkronisasi data ke src/data/courses.json dan src/data/course-details.json
4. Kurasi foto galeri PPL dan projek ke src/data/galeri.json
"""

import os
import json
import zipfile
import xml.etree.ElementTree as ET
import shutil

BASE_DIR = r"D:\Antigravity Project\Web Portofolio PPG"
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
DATA_DIR = os.path.join(BASE_DIR, "src", "data")

def read_docx_paragraphs(file_path):
    """Membaca paragraf dari file docx tanpa library eksternal"""
    try:
        with zipfile.ZipFile(file_path) as z:
            xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            paragraphs = []
            for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                texts = [node.text for node in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if node.text]
                full_text = "".join(texts).strip()
                if full_text:
                    paragraphs.append(full_text)
            return paragraphs
    except Exception as e:
        print(f"Error reading docx {file_path}: {e}")
        return []

def parse_reflection_docx(file_path):
    """Mengekstrak Connection, Challenge, Concept, Change, Analisis Artefak, dan Rumusan"""
    paragraphs = read_docx_paragraphs(file_path)
    text_block = "\n".join(paragraphs)

    ref = {
        "raw": text_block,
        "connection": "",
        "challenge": "",
        "concept": "",
        "change": "",
        "artefak_terpilih": "",
        "alasan_artefak": "",
        "bagian_pendukung": "",
        "rumusan_refleksi": ""
    }

    # Penanda indikator refleksi LK 2 resmi PPG
    current_key = None
    accumulated = {
        "connection": [],
        "challenge": [],
        "concept": [],
        "change": [],
        "artefak_terpilih": [],
        "alasan_artefak": [],
        "bagian_pendukung": [],
        "rumusan_refleksi": []
    }

    for p in paragraphs:
        p_clean = p.strip()
        lower = p_clean.lower()

        # Deteksi Header / Indikator
        if p_clean == "Connection" or "keterkaitan materi perkuliahan dengan peran saya" in lower:
            current_key = "connection"
            continue
        elif p_clean == "Challenge" or "materi atau pandangan baru yang menantang pemikiran" in lower or "menantang pemikiran saya" in lower:
            current_key = "challenge"
            continue
        elif p_clean == "Concept" or "konsep utama dan penting yang telah saya pelajari" in lower:
            current_key = "concept"
            continue
        elif p_clean == "Change" or "perubahan yang ingin saya lakukan setelah" in lower:
            current_key = "change"
            continue
        elif "mana saja artefak pembelajaran yang dapat saya jadikan bukti dukung" in lower or "artefak yang saya pilih adalah" in lower:
            current_key = "artefak_terpilih"
            if "artefak yang saya pilih adalah" in lower:
                accumulated[current_key].append(p_clean)
            continue
        elif "mengapa artefak tersebut yang saya pilih" in lower:
            current_key = "alasan_artefak"
            continue
        elif "bagian mana dari artefak ini yang mendukung hasil refleksi" in lower:
            current_key = "bagian_pendukung"
            continue
        elif "rumusan hasil refleksi" in lower:
            current_key = "rumusan_refleksi"
            continue
        
        # Abaikan baris template tabel formal
        if p_clean in ["Indikator", "Pertanyaan", "Uraian Jawaban", "Analisis Artefak Pembelajaran"]:
            continue
        if lower.startswith("nama mata kuliah:") or lower.startswith("diajukan untuk memenuhi") or lower.startswith("disusun oleh:"):
            continue

        if current_key and current_key in accumulated:
            accumulated[current_key].append(p_clean)

    for k in accumulated:
        ref[k] = "\n\n".join(accumulated[k]).strip()

    return ref

def extract_all_reflections():
    """Ekstrak seluruh refleksi dari semester 1 dan semester 2"""
    ref_map = {}

    # Pemetaan file ke ID mata kuliah
    mapping = {
        "LK 2 - 1. Filosofi Pendidikan dan Pendidikan Nilai.docx": "filosofi-pendidikan",
        "LK 2 - 2. Pemahaman Peserta Didik dan Pembelajaran.docx": "pemahaman-peserta-didik",
        "LK 2 - 3. Pembelajaran Mendalam dan Asesmen Dasar.docx": "pma-1",
        "LK 2 - 4. Praktik Pengalaman Lapangan (PPL) Terbimbing.docx": "ppl-1",
        "LK 2 - 5. Pola Pikir Bertumbuh (Growth Mindset).docx": "growth-mindset",
        "LK 2 - 6. Pembelajaran Berdiferensiasi.docx": "pembelajaran-berdiferensiasi",
        
        "LK 2 - 1. Pembelajaran Sosial Emosional.docx": "sosial-emosional",
        "LK 2 - 2. Pembelajaran Mendalam dan Asesmen Lanjut.docx": "pma-2",
        "LK 2 - 3. Praktik Pengalaman Lapangan (PPL) Mandiri.docx": "ppl-2",
        "LK 2 - 4. Projek Kepemimpinan.docx": "projek-kepemimpinan",
        "LK 2 - 5. Seminar Pendidikan Profesi Guru.docx": "seminar-ppg",
        "LK 2 - 6. Pengembangan Profesionalitas Guru dan Wawasan Keberlanjutan.docx": "ppg-wk"
    }

    folders = [
        os.path.join(PUBLIC_DIR, "REFLEKSI SEMESTER 1"),
        os.path.join(PUBLIC_DIR, "REFLEKSI SEMESTER 2")
    ]

    for fld in folders:
        if not os.path.exists(fld):
            continue
        for fname in os.listdir(fld):
            if fname in mapping:
                course_id = mapping[fname]
                fpath = os.path.join(fld, fname)
                parsed = parse_reflection_docx(fpath)
                parsed["source_file"] = fname
                ref_map[course_id] = parsed
                print(f"Refleksi diekstrak: {course_id} dari {fname}")

    return ref_map

def format_file_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def get_safe_path(p):
    """Mendukung Windows Long Path > 260 karakter"""
    abs_p = os.path.abspath(p)
    if os.name == 'nt' and not abs_p.startswith('\\\\?\\'):
        return '\\\\?\\' + abs_p
    return abs_p

def scan_course_artifacts():
    """Memindai seluruh isi folder public/Artefak PPG/"""
    artefak_dir = os.path.join(PUBLIC_DIR, "Artefak PPG")
    course_artifacts = {}

    course_folder_map = {
        "matrikulasi": "01_Matrikulasi",
        "kesehatan-mental": "02_Literasi_Kesehatan_Mental",
        "p2m": "03_P2M",
        "filosofi-pendidikan": os.path.join("04_Semester_1", "01_Filosofi_Pendidikan_dan_Pendidikan_Nilai"),
        "growth-mindset": os.path.join("04_Semester_1", "02_Growth_Mindset_dalam_Pembelajaran"),
        "pemahaman-peserta-didik": os.path.join("04_Semester_1", "03_Pemahaman_Peserta_Didik_dan_Pembelajarannya"),
        "pembelajaran-berdiferensiasi": os.path.join("04_Semester_1", "04_Pembelajaran_Berdiferensiasi"),
        "pma-1": os.path.join("04_Semester_1", "05_PMA_1_dan_Microteaching"),
        "ppl-1": os.path.join("04_Semester_1", "06_PPL_1_SMAN_15_Bandung"),
        
        "sosial-emosional": os.path.join("05_Semester_2", "01_Pembelajaran_Sosial_Emosional_PSE"),
        "pendidikan-inklusif": os.path.join("05_Semester_2", "02_Pendidikan_Inklusif"),
        "pma-2": os.path.join("05_Semester_2", "03_PMA_Lanjut"),
        "ppg-wk": os.path.join("05_Semester_2", "04_PPG_Wawasan_Kebangsaan_dan_SDGs"),
        "ppl-2": os.path.join("05_Semester_2", "05_PPL_2_Mandiri_SMAN_15_Bandung"),
        "projek-kepemimpinan": os.path.join("05_Semester_2", "06_Projek_Kepemimpinan_SIDAKAN"),
        "seminar-ppg": os.path.join("05_Semester_2", "07_Seminar_PPG"),
    }

    for course_id, rel_sub in course_folder_map.items():
        course_path = os.path.join(artefak_dir, rel_sub)
        if not os.path.exists(get_safe_path(course_path)):
            print(f"Path tidak ditemukan: {course_path}")
            continue

        topics = []
        safe_course_path = get_safe_path(course_path)
        sub_items = sorted(os.listdir(safe_course_path))
        sub_dirs = [d for d in sub_items if os.path.isdir(os.path.join(safe_course_path, d))]

        if sub_dirs:
            for sdir in sub_dirs:
                topic_path = os.path.join(course_path, sdir)
                topic_name = sdir.replace("_", " ")
                topic_artifacts = []
                safe_topic_path = get_safe_path(topic_path)
                for root, dirs, files in os.walk(safe_topic_path):
                    for f in sorted(files):
                        full_p = os.path.join(root, f)
                        # Normalisasi path untuk URL web
                        clean_rel_p = full_p.replace('\\\\?\\', '')
                        rel_p = os.path.relpath(clean_rel_p, PUBLIC_DIR).replace("\\", "/")
                        ext = os.path.splitext(f)[1].lower()
                        try:
                            sz = format_file_size(os.path.getsize(full_p))
                        except Exception:
                            sz = "Dokumen"
                        topic_artifacts.append({
                            "name": f,
                            "ext": ext,
                            "size": sz,
                            "url": f"/{rel_p}",
                            "featured": False,
                            "mediaType": "image" if ext in [".png", ".jpg", ".jpeg"] else "document"
                        })
                if topic_artifacts:
                    topics.append({
                        "nama": topic_name,
                        "artefak": topic_artifacts
                    })
        else:
            # File langsung di root folder mata kuliah
            direct_artifacts = []
            for f in sub_items:
                full_p = os.path.join(safe_course_path, f)
                if os.path.isfile(full_p):
                    clean_rel_p = full_p.replace('\\\\?\\', '')
                    rel_p = os.path.relpath(clean_rel_p, PUBLIC_DIR).replace("\\", "/")
                    ext = os.path.splitext(f)[1].lower()
                    try:
                        sz = format_file_size(os.path.getsize(full_p))
                    except Exception:
                        sz = "Dokumen"
                    direct_artifacts.append({
                        "name": f,
                        "ext": ext,
                        "size": sz,
                        "url": f"/{rel_p}",
                        "featured": False,
                        "mediaType": "image" if ext in [".png", ".jpg", ".jpeg"] else "document"
                    })
            if direct_artifacts:
                topics.append({
                    "nama": "Dokumen Utama & Bukti Karya",
                    "artefak": direct_artifacts
                })

        course_artifacts[course_id] = topics

    return course_artifacts

def update_courses_data():
    reflections = extract_all_reflections()
    scanned_artifacts = scan_course_artifacts()

    course_details_file = os.path.join(DATA_DIR, "course-details.json")
    with open(course_details_file, "r", encoding="utf-8") as f:
        course_details = json.load(f)

    courses_summary_file = os.path.join(DATA_DIR, "courses.json")
    with open(courses_summary_file, "r", encoding="utf-8") as f:
        courses_summary = json.load(f)

    for c in course_details:
        cid = c["id"]
        # Update refleksi otentik jika ada
        if cid in reflections:
            r = reflections[cid]
            c["refleksi4C"] = {
                "connection": r["connection"],
                "challenge": r["challenge"],
                "concept": r["concept"],
                "change": r["change"],
                "artefak_terpilih": r["artefak_terpilih"],
                "alasan_artefak": r["alasan_artefak"],
                "bagian_pendukung": r["bagian_pendukung"],
                "rumusan_refleksi": r["rumusan_refleksi"]
            }
            # Sinkronisasi ke refleksi standar
            c["refleksi"] = {
                "facts": r["connection"] or c.get("refleksi", {}).get("facts", ""),
                "feelings": r["challenge"] or c.get("refleksi", {}).get("feelings", ""),
                "findings": r["concept"] or c.get("refleksi", {}).get("findings", ""),
                "future": r["change"] or c.get("refleksi", {}).get("future", "")
            }
            if r["artefak_terpilih"]:
                c["featuredArtifact"] = r["artefak_terpilih"]

        # Update artefak hasil pemindaian
        if cid in scanned_artifacts and scanned_artifacts[cid]:
            c["topikList"] = scanned_artifacts[cid]
            c["topikCount"] = len(scanned_artifacts[cid])
            total_docs = sum(len(t["artefak"]) for t in scanned_artifacts[cid])
            c["totalArtefakCount"] = total_docs

            # Cari artefak unggulan lokal URL
            featured_url = None
            for t in scanned_artifacts[cid]:
                for a in t["artefak"]:
                    if a["ext"] == ".pdf" and not featured_url:
                        featured_url = a["url"]
            if not featured_url and scanned_artifacts[cid][0]["artefak"]:
                featured_url = scanned_artifacts[cid][0]["artefak"][0]["url"]
            c["featuredArtifactUrl"] = featured_url or "/Artefak PPG"

    # Simpan kembali course-details.json
    with open(course_details_file, "w", encoding="utf-8") as f:
        json.dump(course_details, f, indent=2, ensure_ascii=False)
    print(f"Berhasil memperbarui {course_details_file}")

    # Perbarui ringkasan di courses.json
    details_map = {c["id"]: c for c in course_details}
    for cs in courses_summary:
        cid = cs["id"]
        if cid in details_map:
            det = details_map[cid]
            cs["artefakCount"] = det.get("totalArtefakCount", cs.get("artefakCount", 0))
            cs["topikCount"] = det.get("topikCount", cs.get("topikCount", 0))
            cs["featuredArtifact"] = det.get("featuredArtifact", cs.get("featuredArtifact", ""))
            cs["featuredArtifactUrl"] = det.get("featuredArtifactUrl", "")

    with open(courses_summary_file, "w", encoding="utf-8") as f:
        json.dump(courses_summary, f, indent=2, ensure_ascii=False)
    print(f"Berhasil memperbarui {courses_summary_file}")

def curate_gallery_photos():
    """Kurasi foto nyata dari folder public/Artefak PPG/.../05_Galeri_Foto_PPL_2 ke public/img/galeri"""
    src_photos_dir = os.path.join(PUBLIC_DIR, "Artefak PPG", "05_Semester_2", "05_PPL_2_Mandiri_SMAN_15_Bandung", "05_Galeri_Foto_PPL_2")
    dest_galeri_dir = os.path.join(PUBLIC_DIR, "img", "galeri")
    os.makedirs(dest_galeri_dir, exist_ok=True)

    galeri_items = []

    # Salin 18 foto dokumentasi PPL terbaik
    if os.path.exists(src_photos_dir):
        all_pics = [f for f in sorted(os.listdir(src_photos_dir)) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        # Ambil sampel foto
        step = max(1, len(all_pics) // 18)
        selected = all_pics[::step][:18]
        for idx, pic_name in enumerate(selected):
            src_file = os.path.join(src_photos_dir, pic_name)
            dest_name = f"ppl2-sman15-{idx+1:02d}.jpg"
            dest_file = os.path.join(dest_galeri_dir, dest_name)
            try:
                shutil.copy2(src_file, dest_file)
                galeri_items.append({
                    "id": f"ppl2-{idx+1}",
                    "url": f"/img/galeri/{dest_name}",
                    "judul": f"Praktik Mengajar PPL II Kelas X-5 (#{idx+1})",
                    "kategori": "ppl-2",
                    "lokasi": "SMAN 15 Bandung",
                    "tanggal": "Juli – Oktober 2026",
                    "deskripsi": "Dokumentasi pembelajaran mandiri Informatika di SMAN 15 Bandung, bimbingan murid, asesmen diagnostik, dan penerapan model PBL berkolaborasi."
                })
            except Exception as e:
                print(f"Gagal menyalin {pic_name}: {e}")

    # Tambahkan foto projek SIDAKAN jika ada
    sidakan_photos_dir = os.path.join(PUBLIC_DIR, "Artefak PPG", "05_Semester_2", "06_Projek_Kepemimpinan_SIDAKAN", "05_Dokumentasi_Foto_dan_Poster")
    if os.path.exists(sidakan_photos_dir):
        for pic in sorted(os.listdir(sidakan_photos_dir)):
            if pic.lower().endswith(('.jpg', '.jpeg', '.png')) and not pic.startswith("Y_Chart"):
                s_src = os.path.join(sidakan_photos_dir, pic)
                s_dest_name = f"sidakan-{pic}"
                s_dest = os.path.join(dest_galeri_dir, s_dest_name)
                try:
                    shutil.copy2(s_src, s_dest)
                    galeri_items.append({
                        "id": f"sidakan-{pic}",
                        "url": f"/img/galeri/{s_dest_name}",
                        "judul": "Perakitan & Pengujian IoT SIDAKAN",
                        "kategori": "sidakan",
                        "lokasi": "Laboratorium & Lapangan",
                        "tanggal": "Semester 2 - 2026",
                        "deskripsi": "Dokumentasi perakitan perangkat IoT pendeteksi kualitas air kolam dan otomatisasi pakan ikan pada Projek Kepemimpinan."
                    })
                except Exception as e:
                    print(f"Gagal menyalin {pic}: {e}")

    # Simpan ke galeri.json jika berhasil
    if galeri_items:
        galeri_file = os.path.join(DATA_DIR, "galeri.json")
        with open(galeri_file, "w", encoding="utf-8") as f:
            json.dump(galeri_items, f, indent=2, ensure_ascii=False)
        print(f"Berhasil memperbarui {galeri_file} dengan {len(galeri_items)} foto.")

if __name__ == "__main__":
    print("=== MEMULAI PEMROSESAN KONTEN OTENTIK ===")
    update_courses_data()
    curate_gallery_photos()
    print("=== SELESAI PEMROSESAN KONTEN ===")
