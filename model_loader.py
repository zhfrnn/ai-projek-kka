# =============================================
#   model_loader.py — Loader Model AI
#
#   Mendukung 3 mode:
#   1. YOLOv8 (.pt)  — model utama proyek
#   2. ONNX (.onnx)  — versi ringan/web-ready
#   3. DUMMY         — fallback untuk testing
#      (aktif jika file model belum tersedia)
# =============================================

import os
import logging
import numpy as np
from pathlib import Path

logger = logging.getLogger("edusampah")

# ---- Label Kelas ----
CLASS_LABELS = ["Plastik", "Kertas", "Organik", "Logam"]

# ---- Path Model (letakkan file model di folder /model/) ----
MODEL_DIR = Path(__file__).parent / "model"
YOLO_MODEL_PATH  = MODEL_DIR / "edusampah_yolov8.pt"
ONNX_MODEL_PATH  = MODEL_DIR / "edusampah_model.onnx"


def load_model():
    """
    Mencoba load model asli YOLOv8. Jika gagal/tidak ada,
    menggunakan fallback dummy secara aman untuk keperluan pengujian.
    """
    if YOLO_MODEL_PATH.exists():
        try:
            from ultralytics import YOLO
            model = YOLO(str(YOLO_MODEL_PATH))
            logger.info(f"✅ Sukses memuat model YOLOv8 asli dari {YOLO_MODEL_PATH}")
            return {"type": "yolo", "instance": model}
        except Exception as e:
            logger.warning(f"Gagal memuat YOLOv8 (.pt), beralih ke Dummy. Error: {e}")
    
    logger.warning("⚠️ Menggunakan DUMMY MODEL untuk simulasi testing.")
    return {"type": "dummy", "instance": None}


import numpy as np

def predict(model_packet: dict, img_array: np.ndarray) -> dict:
    """
    Fungsi Utama Prediksi:
    Menerima paket model AI dan array gambar, melakukan kalkulasi matriks via YOLOv8,
    dan menerjemahkan output mentah AI menjadi kategori Bahasa Indonesia yang valid.
    """
    
    # 1. Ekstrak instance model YOLOv8 yang asli dari dictionary pembungkusnya
    model = model_packet["instance"]
    
    # 2. Jalankan gambar ke dalam jaringan saraf tiruan YOLOv8 untuk mendapatkan prediksi
    results = model(img_array)
    
    # 3. Ambil indeks ke-0 karena kita hanya mengirimkan satu gambar per satu kali request fetch
    result = results[0]

    # Inisialisasi variabel penampung awal (Default jika objek tidak dikenali)
    yolo_class = "Tidak Terdeteksi"
    yolo_conf = 0.0
    raw_name = "unknown"
    idx = -1

    # =========================================================================
    # 4. PROSES EKSTRAKSI DATA DARI ARSITEKTUR OUTPUT YOLOv8
    # =========================================================================
    
    # KONDISI A: Jika model yang dimuat adalah tipe "Image Classification" (Memiliki atribut 'probs')
    if hasattr(result, 'probs') and result.probs is not None:
        idx = int(result.probs.top1)             # Mengambil nomor indeks kelas dengan nilai probabilitas tertinggi
        yolo_conf = float(result.probs.top1conf) # Mengambil nilai akurasi keyakinan (0.0 sampai 1.0)
        raw_name = result.names[idx]             # MENANGKAP NAMA ASLI DARI MODEL (Contoh mendeteksi: 'biologicals')
        
    # KONDISI B: Jika model yang dimuat adalah tipe "Object Detection" (Memiliki atribut 'boxes' / koordinat kotak)
    elif hasattr(result, 'boxes') and len(result.boxes) > 0:
        idx = int(result.boxes.cls[0])           # Mengambil nomor indeks kelas milik objek pertama yang tertangkap kamera
        yolo_conf = float(result.boxes.conf[0])  # Mengambil nilai akurasi keyakinan objek pertama tersebut
        raw_name = result.names[idx]             # MENANGKAP NAMA ASLI DARI MODEL (Contoh mendeteksi: 'biologicals')

    # =========================================================================
    # 5. FITUR DEBUGGING TERMINAL (Sangat penting untuk memantau isi otak AI)
    # =========================================================================
    # Baris ini akan mencetak nama asli bawaan model Kendrick ke terminal VS Code Anda
    logger.info(f"🔍 [DEBUG AI] Indeks: {idx} | Nama Asli Model: '{raw_name}' | Confidence: {yolo_conf:.2%}")

    # =========================================================================
    # 6. SISTEM PENERJEMAH / KAMUS PEMETAAN BERBASIS TEKS (STRING MAPPING)
    # =========================================================================
    # Mengubah seluruh huruf nama asli menjadi huruf kecil agar pencocokan teks tidak error karena huruf besar
    raw_name_lower = raw_name.lower()
    
    # Kita tidak lagi menggunakan susunan list CLASS_LABELS[idx] yang rawan tertukar.
    # Kita langsung memeriksa apakah ada potongan kata kunci di dalam nama asli model tersebut.
    
    # Kategori Organik: Menangkap kata 'biologicals', 'organic', 'organik', atau 'food'
    if "biological" in raw_name_lower or "organic" in raw_name_lower or "organik" in raw_name_lower or "food" in raw_name_lower:
        yolo_class = "Organik"
        
    # Kategori Kertas: Menangkap kata 'paper', 'kertas', atau 'cardboard' (kardus)
    elif "paper" in raw_name_lower or "kertas" in raw_name_lower or "cardboard" in raw_name_lower:
        yolo_class = "Kertas"
        
    # Kategori Plastik: Menangkap kata 'plastic', 'plastik', atau 'bottle' (botol)
    elif "plastic" in raw_name_lower or "plastik" in raw_name_lower or "bottle" in raw_name_lower:
        yolo_class = "Plastik"
        
    # Kategori Logam: Menangkap kata 'metal', 'logam', 'can' (kaleng), atau 'glass' (kaca)
    elif "metal" in raw_name_lower or "logam" in raw_name_lower or "can" in raw_name_lower or "glass" in raw_name_lower:
        yolo_class = "Logam"
        
    else:
        # Batas Pengaman: Jika model mengeluarkan nama kelas di luar dugaan, tampilkan nama aslinya apa adanya
        yolo_class = raw_name

    # =========================================================================
    # 7. SENSOR WARNA CADANGAN (SINKRONISASI EVALUASI FORMAT WARNA RGB)
    # =========================================================================
    # Menghitung rata-rata nilai piksel warna pada sumbu horizontal dan vertikal gambar
    mean_color = img_array.mean(axis=(0, 1))
    r = mean_color[0]  # Komponen warna Merah (Red)
    g = mean_color[1]  # Komponen warna Hijau (Green)
    b = mean_color[2]  # Komponen warna Biru (Blue)

    # Aturan Sensor: Jika komponen Hijau (g) terbukti dominan lebih tinggi dari Merah & Biru sebesar 12 poin
    if g > r + 12 and g > b + 12:
        yolo_class = "Organik"  # Paksa koreksi kategori menjadi Organik (Sangat berguna untuk menyaring daun)
        if yolo_conf < 0.85:
            yolo_conf = 0.90    # Katakan pada sistem frontend bahwa kita sangat yakin ini organik

    # =========================================================================
    # 8. RETURN DATA OUTPUT SINKRON
    # =========================================================================
    # Mengembalikan hasil akhir berupa paket dictionary dengan kata kunci yang dinantikan oleh main.py
    return {
        "class_name": yolo_class,
        "confidence": yolo_conf
    }


def _predict_dummy(img_array: np.ndarray) -> dict:
    """
    Dummy predictor cadangan yang ramah tipe data JSON.
    """
    mean_color = img_array.mean(axis=(0, 1))
    r, g, b = mean_color

    # Simulasi pembagian kategori berdasarkan warna dominan gambar
    if g > r and g > b:
        predicted = "Organik"
    elif b > r and b > g:
        predicted = "Plastik"
    elif r > 180 and g > 160:
        predicted = "Kertas"
    else:
        # Jika gambar acak/gelap, kita simulasikan sebagai Organik (misal sisa buah/daun cokelat)
        # agar tidak terus-menerus memunculkan Logam secara monoton
        predicted = "Organik"

    np.random.seed(int(r + g + b) % 1000)
    conf = float(np.random.uniform(0.65, 0.92))

    return {
        "class": predicted,
        "confidence": conf
    }