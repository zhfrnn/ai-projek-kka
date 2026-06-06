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
CLASS_LABELS = ["Organik", "Plastik", "Kertas", "Logam"]

# ---- Path Model (letakkan file model di folder /model/) ----
MODEL_DIR = Path(__file__).parent.parent / "model"
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


def predict(model_info: dict, img_array: np.ndarray) -> dict:
    """
    Jalankan prediksi pada gambar.

    Args:
        model_info: dict berisi 'type' dan 'model'
        img_array:  numpy array (224, 224, 3) uint8

    Returns:
        dict: { 'class': str, 'confidence': float, 'all_scores': dict }
    """
    model_type = model_info["type"]
    model      = model_info["model"]

    if model_type == "yolo":
        return _predict_yolo(model, img_array)
    elif model_type == "onnx":
        return _predict_onnx(model, img_array)
    else:
        return _predict_dummy(img_array)


def _predict_yolo(model, img_array: np.ndarray) -> dict:
    """Prediksi menggunakan YOLOv8 (mode klasifikasi)."""
    results = model.predict(img_array, verbose=False)
    # Ambil probabilitas dari hasil klasifikasi YOLOv8
    probs = results[0].probs.data.cpu().numpy()
    idx = int(np.argmax(probs))
    scores = {CLASS_LABELS[i]: float(probs[i]) for i in range(len(CLASS_LABELS))}
    return {
        "class": CLASS_LABELS[idx],
        "confidence": float(probs[idx]),
        "all_scores": scores
    }


def _predict_onnx(session, img_array: np.ndarray) -> dict:
    """Prediksi menggunakan ONNX Runtime."""
    # Normalisasi [0,255] → [0,1] dan reshape ke (1, 3, 224, 224)
    img = img_array.astype(np.float32) / 255.0
    img = np.transpose(img, (2, 0, 1))   # HWC → CHW
    img = np.expand_dims(img, axis=0)    # → (1, 3, 224, 224)

    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: img})
    logits = outputs[0][0]

    # Softmax
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / exp_logits.sum()

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