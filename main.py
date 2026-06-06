# =============================================
#   EduSampah AI — Backend FastAPI
#   SMA Muhammadiyah 1 Yogyakarta — 2026
#
#   Endpoint utama:
#     POST /classify  → klasifikasi gambar sampah
#     GET  /health    → cek status server
#     GET  /stats     → statistik server
# =============================================

import base64
import io
import time
import logging
from pathlib import Path

import numpy as np
from PIL import Image
from fastapi import FastAPI, HTTPException
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

# ---- CORS (izinkan frontend mengakses backend) ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Ganti dengan domain kamu saat deploy produksi
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---- Load Model saat startup ----
model = None
server_stats = {"total_requests": 0, "successful": 0, "failed": 0}

@app.on_event("startup")
async def startup_event():
    global model
    logger.info("Memuat model AI...")
    model = load_model()
    logger.info("Model berhasil dimuat! Server siap.")


# ---- Schema Request ----
class ClassifyRequest(BaseModel):
    image: str   # Base64 encoded JPEG/PNG


# ---- Schema Response ----
class ClassifyResponse(BaseModel):
    success: bool
    class_name: str          # "Organik" | "Plastik" | "Kertas" | "Logam"
    confidence: float        # 0.0 – 1.0
    processing_time_ms: int
    all_scores: dict         # probabilitas semua kelas


# =============================================
#   ENDPOINT: Health Check
# =============================================
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "server": "EduSampah AI v1.0"
    }


# =============================================
#   ENDPOINT: Statistik Server
# =============================================
@app.get("/stats")
def get_stats():
    return server_stats


# =============================================
#   ENDPOINT: Klasifikasi Gambar
# =============================================
@app.post("/classify", response_model=ClassifyResponse)
async def classify_image(req: ClassifyRequest):
    server_stats["total_requests"] += 1
    start = time.time()

    # 1. Decode Base64 → PIL Image
    try:
        img_bytes = base64.b64decode(req.image)
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        # Resize ke ukuran input model (640x640 untuk YOLOv8, 224x224 untuk MobileNet)
        image_resized = image.resize((224, 224))
        img_array = np.array(image_resized)
    except Exception as e:
        server_stats["failed"] += 1
        logger.error(f"Gagal decode gambar: {e}")
        raise HTTPException(status_code=400, detail=f"Gambar tidak valid: {str(e)}")

    # 2. Prediksi dengan model
    try:
        result = predict(model, img_array)
    except Exception as e:
        server_stats["failed"] += 1
        logger.error(f"Gagal prediksi: {e}")
        raise HTTPException(status_code=500, detail=f"Error prediksi: {str(e)}")

    elapsed_ms = int((time.time() - start) * 1000)
    server_stats["successful"] += 1

    logger.info(f"Prediksi: {result['class']} ({result['confidence']:.2%}) | {elapsed_ms}ms")

    return ClassifyResponse(
        success=True,
        class_name=result["class"],
        confidence=result["confidence"],
        processing_time_ms=elapsed_ms,
        all_scores=result["all_scores"]
    )