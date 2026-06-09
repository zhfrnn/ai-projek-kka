# =============================================================
#   EduSampah AI — Backend FastAPI (Production & CORS Allowed)
#   SMA Muhammadiyah 1 Yogyakarta — 2026
# =============================================================

import io
import time
import logging
from pathlib import Path

import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model_loader import load_model, predict

# ---- Logging ----
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("edusampah")

# ---- Inisialisasi App ----
app = FastAPI(
    title="EduSampah AI API",
    description="Backend klasifikasi sampah berbasis YOLOv8 untuk program Adiwiyata",
    version="1.0.0"
)

# ---- KODE INTEGRASI CORS HUGGING FACE (MENGIZINKAN LIVE SERVER 127.0.0.1) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Mengizinkan localhost, live server, atau domain web mana pun
    allow_credentials=False,  # Harus bernilai False jika menggunakan allow_origins=["*"] di internet publik
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Load Model saat startup ----
model = None
server_stats = {"total_requests": 0, "successful": 0, "failed": 0}

@app.on_event("startup")
async def startup_event():
    global model
    logger.info("Memuat model AI...")
    try:
        model = load_model()
        logger.info("Model berhasil dimuat! Server siap.")
    except Exception as e:
        logger.error(f"Gagal memuat model pada startup: {e}")


# ---- Schema Response ----
class ClassifyResponse(BaseModel):
    success: bool
    class_name: str          # "Organik" | "Plastik" | "Kertas" | "Logam"
    confidence: float        # 0.0 – 1.0
    processing_time_ms: int
    all_scores: dict         # probabilitas semua kelas


# =============================================
#   ENDPOINT: Health Check & Stats
# =============================================
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "server": "EduSampah AI v1.0"
    }

@app.get("/stats")
def get_stats():
    return server_stats


# =========================================================================
#   ENDPOINT UTAMA: Menerima File Gambar Langsung dari app.js (SINKRON)
# =========================================================================

@app.post("/predict", response_model=ClassifyResponse)
async def classify_image(file: UploadFile = File(...)):
    server_stats["total_requests"] += 1
    start = time.time()

    if model is None:
        server_stats["failed"] += 1
        raise HTTPException(status_code=503, detail="Model AI belum siap di server.")

    # 1. Membaca File Gambar dari Frontend (Format RGB)
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        image_resized = image.resize((640, 640))
        img_array = np.array(image_resized)
    except Exception as e:
        server_stats["failed"] += 1
        logger.error(f"Gagal memproses file gambar: {e}")
        raise HTTPException(status_code=400, detail=f"File gambar rusak: {str(e)}")

    # 2. Melakukan Prediksi melalui model_loader.py
    try:
        result = predict(model, img_array)
    except Exception as e:
        server_stats["failed"] += 1
        logger.error(f"Gagal melakukan prediksi: {e}")
        raise HTTPException(status_code=500, detail=f"Error internal model AI: {str(e)}")

    elapsed_ms = int((time.time() - start) * 1000)
    server_stats["successful"] += 1

    logger.info(f"Prediksi Berhasil: {result['class_name']} ({result['confidence']:.2%}) | {elapsed_ms}ms")

    # Mengembalikan data struktur yang sudah pasti sesuai dengan ClassifyResponse di atas
    return ClassifyResponse(
        success=True,
        class_name=result["class_name"],  
        confidence=result["confidence"],  
        processing_time_ms=elapsed_ms,
        all_scores={}
    )
    