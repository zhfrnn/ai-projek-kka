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
CLASS_LABELS = ["Organik", "Kertas", "Plastik", "Logam"]

# ---- Path Model (letakkan file model di folder /model/) ----
MODEL_DIR = Path(__file__).parent / "model"
YOLO_MODEL_PATH  = MODEL_DIR / "edusampah_yolov8.pt"
ONNX_MODEL_PATH  = MODEL_DIR / "edusampah_model.onnx"


def load_model():
    """
    Coba load model dalam urutan:
    1. YOLOv8 (.pt)
    2. ONNX Runtime (.onnx)
    3. Dummy model (untuk testing tanpa model terlatih)
    """

    # --- Coba YOLOv8 ---
    if YOLO_MODEL_PATH.exists():
        try:
            from ultralytics import YOLO
            model = YOLO(str(YOLO_MODEL_PATH))
            logger.info(f"✅ YOLOv8 dimuat dari: {YOLO_MODEL_PATH}")
            return {"type": "yolo", "model": model}
        except ImportError:
            logger.warning("ultralytics tidak terinstall. Coba ONNX...")
        except Exception as e:
            logger.warning(f"Gagal load YOLOv8: {e}")

    # --- Coba ONNX Runtime ---
    if ONNX_MODEL_PATH.exists():
        try:
            import onnxruntime as ort
            session = ort.InferenceSession(
                str(ONNX_MODEL_PATH),
                providers=["CPUExecutionProvider"]
            )
            logger.info(f"✅ ONNX model dimuat dari: {ONNX_MODEL_PATH}")
            return {"type": "onnx", "model": session}
        except ImportError:
            logger.warning("onnxruntime tidak terinstall. Gunakan dummy model...")
        except Exception as e:
            logger.warning(f"Gagal load ONNX: {e}")

    # --- Fallback: Dummy Model ---
    logger.warning("⚠️  Model belum tersedia. Menggunakan DUMMY MODEL untuk testing.")
    logger.warning("⚠️  Letakkan file model di folder /model/ sebelum produksi!")
    return {"type": "dummy", "model": None}


def predict(model_dict, img_array: np.ndarray) -> dict:
    """
    Melakukan prediksi menggunakan model yang sesuai (YOLOv8 Deteksi/Klasifikasi atau ONNX).
    """
    if model_dict["type"] == "dummy":
        return _predict_dummy(img_array)

    if model_dict["type"] == "yolo":
        model = model_dict["model"]
        # Jalankan prediksi pada gambar
        results = model(img_array, verbose=False)
        result = results[0]
        
        # OPSI 1: JIKA MODELNYA ADALAH KLASIFIKASI (.probs)
        if hasattr(result, 'probs') and result.probs is not None:
            probs = result.probs.data.cpu().numpy()
            idx = int(np.argmax(probs))
            scores = {CLASS_LABELS[i]: float(probs[i]) for i in range(len(CLASS_LABELS)) if i < len(probs)}
            return {
                "class": CLASS_LABELS[idx],
                "confidence": float(probs[idx]),
                "all_scores": scores
            }
            
        # OPSI 2: JIKA MODELNYA ADALAH DETEKSI OBJEK (.boxes) -> Sesuai model unduhanmu
        elif hasattr(result, 'boxes') and result.boxes is not None and len(result.boxes) > 0:
            # Ambil deteksi dengan score/confidence tertinggi
            best_box_idx = int(np.argmax(result.boxes.conf.cpu().numpy()))
            cls_idx = int(result.boxes.cls[best_box_idx].cpu().numpy())
            confidence = float(result.boxes.conf[best_box_idx].cpu().numpy())
            
            # Ambil nama kelas dari model asli untuk dicocokkan
            model_names = model.names
            detected_name = model_names.get(cls_idx, "").lower()
            
            # Petakan ke CLASS_LABELS proyekmu ["Organik", "Plastik", "Kertas", "Logam"]
            final_class = "Organik" # Default
            if "paper" in detected_name or "kertas" in detected_name:
                final_class = "Kertas"
            elif "plastic" in detected_name or "plastik" in detected_name:
                final_class = "Plastik"
            elif "metal" in detected_name or "logam" in detected_name or "can" in detected_name:
                final_class = "Logam"
            elif "organic" in detected_name or "trash" in detected_name or "daun" in detected_name:
                final_class = "Organik"
                
            # Buat all_scores tiruan agar frontend tidak eror saat merender grafik
            scores = {label: 0.0 for label in CLASS_LABELS}
            scores[final_class] = confidence
            
            return {
                "class": final_class,
                "confidence": confidence,
                "all_scores": scores
            }
        else:
            # Fallback jika model deteksi tidak menemukan objek sama sekali di gambar
            # Kita arahkan ke kelas default dengan confidence rendah daripada eror
            return {
                "class": "Organik",
                "confidence": 0.30,
                "all_scores": {label: 0.25 for label in CLASS_LABELS}
            }
            
    elif model_dict["type"] == "onnx":
        session = model_dict["session"]
        input_name = session.get_inputs()[0].name
        img_input = np.expand_dims(img_array, axis=0).astype(np.float32) / 255.0
        outputs = session.run(None, {input_name: img_input})
        probs = outputs[0][0]
        idx = int(np.argmax(probs))
        scores = {CLASS_LABELS[i]: float(probs[i]) for i in range(len(CLASS_LABELS))}
        return {
            "class": CLASS_LABELS[idx],
            "confidence": float(probs[idx]),
            "all_scores": scores
        }

def _predict_dummy(img_array: np.ndarray) -> dict:
    """
    Dummy predictor untuk testing (tanpa model asli).
    Menggunakan heuristik sederhana berdasarkan warna dominan gambar.
    GANTI dengan model asli sebelum presentasi/produksi!
    """
    # Heuristik warna sederhana sebagai placeholder
    mean_color = img_array.mean(axis=(0, 1))  # [R, G, B] rata-rata
    r, g, b = mean_color

    # Logika sederhana berdasarkan warna dominan
    if g > r and g > b:
        predicted = "Organik"     # Hijau → organik (daun, dll)
    elif b > r and b > g:
        predicted = "Plastik"     # Biru → plastik (biru sering di kemasan)
    elif r > 180 and g > 160:
        predicted = "Kertas"      # Kuning-putih → kertas
    else:
        predicted = "Logam"       # Default → logam

    # Buat skor random yang masuk akal untuk tampilan
    np.random.seed(int(r + g + b))
    raw = np.random.dirichlet(np.ones(4) * 2)
    # Naikkan nilai kelas yang diprediksi
    idx = CLASS_LABELS.index(predicted)
    raw[idx] += 1.5
    raw = raw / raw.sum()

    scores = {CLASS_LABELS[i]: float(raw[i]) for i in range(4)}
    return {
        "class": predicted,
        "confidence": float(raw[idx]),
        "all_scores": scores
    }