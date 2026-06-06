// =============================================
//   EduSampah AI — Frontend App Logic
//   SMA Muhammadiyah 1 Yogyakarta — 2026
// =============================================

// Ganti dengan URL backend kamu saat deploy
// Contoh: "https://edusampah-ai.onrender.com"
// Untuk localhost gunakan: "http://localhost:8000"
const API_BASE = "http://localhost:8000";

// ---- DATA JENIS SAMPAH ----
const WASTE_DATA = {
  organik: {
    label: "Organik",
    icon: "🌿",
    color: "#E1F5EE",
    iconColor: "#1D9E75",
    info: "Sampah organik berasal dari bahan-bahan alami seperti sisa makanan, daun kering, ranting, dan limbah pertanian. Mudah terurai secara alami.",
    tips: [
      "Masukkan ke tempat sampah hijau (organik)",
      "Bisa diolah menjadi pupuk kompos berkualitas",
      "Jangan campur dengan plastik atau logam",
      "Proses dekomposisi alami hanya 2–4 minggu"
    ],
    detail: `
      <h3 style="font-size:18px;font-weight:800;margin-bottom:8px">♻️ Sampah Organik</h3>
      <p style="font-size:13px;color:#6b7280;margin-bottom:14px">Sampah yang berasal dari makhluk hidup dan mudah terurai.</p>
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Contoh</strong>
      <p style="font-size:13px;margin:6px 0 14px">Sisa nasi, kulit buah, daun kering, ranting pohon, ampas kopi/teh, cangkang telur.</p>
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Cara Pengelolaan</strong>
      <ul style="font-size:13px;margin:8px 0 0 16px;line-height:2">
        <li>Buat lubang biopori di halaman sekolah</li>
        <li>Olah menjadi kompos dengan metode aerobik</li>
        <li>Gunakan komposter sederhana dari drum bekas</li>
        <li>Hasilnya bisa dipakai untuk pupuk tanaman sekolah</li>
      </ul>
    `
  },
  plastik: {
    label: "Plastik",
    icon: "♻️",
    color: "#FAEEDA",
    iconColor: "#EF9F27",
    info: "Sampah plastik butuh ratusan tahun untuk terurai. Pilah berdasarkan kode daur ulang (angka 1–7) yang tertera di kemasan plastik.",
    tips: [
      "Bersihkan sisa makanan sebelum dibuang",
      "Pisahkan berdasarkan jenis kode plastik (1-7)",
      "Bawa ke bank sampah atau pengepul plastik",
      "Kurangi penggunaan plastik sekali pakai"
    ],
    detail: `
      <h3 style="font-size:18px;font-weight:800;margin-bottom:8px">🧴 Sampah Plastik</h3>
      <p style="font-size:13px;color:#6b7280;margin-bottom:14px">Membutuhkan 400–1000 tahun untuk terurai di alam.</p>
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Contoh</strong>
      <p style="font-size:13px;margin:6px 0 14px">Botol minuman, kantong kresek, sedotan, styrofoam, bungkus makanan, wadah sampo.</p>
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Kode Plastik yang Bisa Didaur Ulang</strong>
      <ul style="font-size:13px;margin:8px 0 0 16px;line-height:2">
        <li><b>#1 PET</b> — Botol minuman, mudah didaur ulang</li>
        <li><b>#2 HDPE</b> — Botol susu, wadah deterjen</li>
        <li><b>#5 PP</b> — Sedotan, wadah yoghurt</li>
        <li><b>#4 LDPE</b> — Kantong plastik tipis</li>
      </ul>
    `
  },
  kertas: {
    label: "Kertas",
    icon: "📄",
    color: "#E6F1FB",
    iconColor: "#378ADD",
    info: "Kertas yang tidak terkontaminasi minyak atau makanan bisa didaur ulang menjadi produk kertas baru, menghemat pohon dan sumber daya air.",
    tips: [
      "Jaga agar kertas tetap kering dan bersih",
      "Singkirkan selotip, staples, atau plastik",
      "Jual ke bank sampah atau pengepul kertas",
      "Bisa dijadikan bahan kerajinan tangan kreatif"
    ],
    detail: `
      <h3 style="font-size:18px;font-weight:800;margin-bottom:8px">📰 Sampah Kertas</h3>
      <p style="font-size:13px;color:#6b7280;margin-bottom:14px">Setiap ton kertas daur ulang menyelamatkan 17 pohon.</p>
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Contoh</strong>
      <p style="font-size:13px;margin:6px 0 14px">Kertas HVS, kardus, koran, buku bekas, karton, tissue kering.</p>
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Tips Pengelolaan</strong>
      <ul style="font-size:13px;margin:8px 0 0 16px;line-height:2">
        <li>Pisahkan dari sampah basah agar tidak lembap</li>
        <li>Lepas bagian non-kertas (plastik, logam)</li>
        <li>Tumpuk rapi dan ikat sebelum dijual/disetor</li>
        <li>Kertas kotor/berminyak tidak bisa didaur ulang</li>
      </ul>
    `
  },
  logam: {
    label: "Logam",
    icon: "⚙️",
    color: "#FAECE7",
    iconColor: "#D85A30",
    info: "Logam memiliki nilai ekonomi tinggi dan bisa didaur ulang hampir tanpa batas kehilangan kualitas. Kaleng aluminium adalah yang paling berharga.",
    tips: [
      "Pisahkan jenis logam (aluminium, besi, tembaga)",
      "Cuci dan keringkan sebelum dikumpulkan",
      "Jual ke bank sampah untuk nilai terbaik",
      "Jangan membakar logam — berbahaya!"
    ],
    detail: `
      <h3 style="font-size:18px;font-weight:800;margin-bottom:8px">🔩 Sampah Logam</h3>
      <p style="font-size:13px;color:#6b7280;margin-bottom:14px">Logam dapat didaur ulang tanpa batas dan memiliki nilai jual tinggi.</p>
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Contoh</strong>
      <p style="font-size:13px;margin:6px 0 14px">Kaleng aluminium, kaleng sarden/susu, kawat, paku bekas, peralatan dapur rusak.</p>
      <strong style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Nilai Ekonomi</strong>
      <ul style="font-size:13px;margin:8px 0 0 16px;line-height:2">
        <li>Aluminium: Rp 10.000–15.000/kg</li>
        <li>Besi/baja: Rp 2.000–4.000/kg</li>
        <li>Tembaga: Rp 60.000–80.000/kg</li>
        <li>Setorkan ke bank sampah terdekat</li>
      </ul>
    `
  }
};

// ---- STATE ----
let currentImageBase64 = null;
let stream = null;
let scanHistory = JSON.parse(localStorage.getItem("edusampah_history") || '{"total":0,"organik":0,"plastik":0,"kertas":0,"logam":0}');

// =============================================
//   NAVIGATION
// =============================================
function switchTab(t) {
  document.querySelectorAll(".tab").forEach((el, i) => {
    el.classList.toggle("active", ["scan","stats","edu","about"][i] === t);
  });
  document.querySelectorAll(".panel").forEach(el => el.classList.remove("active"));
  document.getElementById("panel-" + t).classList.add("active");
  if (t === "stats") updateStats();
}

// =============================================
//   KAMERA & FILE
// =============================================
function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Browser ini tidak mendukung akses kamera. Silakan gunakan Chrome atau Firefox terbaru.");
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(s => {
      stream = s;
      const v = document.getElementById("video-el");
      v.srcObject = s;
      v.style.display = "block";
      document.getElementById("cam-overlay").style.display = "none";
      document.getElementById("preview-img").style.display = "none";
      document.getElementById("btn-scan-now").style.display = "flex";
      currentImageBase64 = null;
    })
    .catch(() => {
      alert("Akses kamera ditolak atau tidak tersedia.\nSilakan unggah foto sebagai gantinya.");
    });
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  stopCamera();
  const reader = new FileReader();
  reader.onload = ev => {
    const img = document.getElementById("preview-img");
    img.src = ev.target.result;
    img.style.display = "block";
    document.getElementById("video-el").style.display = "none";
    document.getElementById("cam-overlay").style.display = "none";
    document.getElementById("btn-scan-now").style.display = "flex";
    currentImageBase64 = ev.target.result.split(",")[1];
  };
  reader.readAsDataURL(file);
}

function captureFromVideo() {
  const v = document.getElementById("video-el");
  const c = document.createElement("canvas");
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0);
  const dataUrl = c.toDataURL("image/jpeg", 0.85);
  // Tampilkan hasil capture
  const img = document.getElementById("preview-img");
  img.src = dataUrl;
  img.style.display = "block";
  v.style.display = "none";
  stopCamera();
  return dataUrl.split(",")[1];
}

// =============================================
//   KLASIFIKASI / SCAN
// =============================================
async function doScan() {
  let imgB64 = currentImageBase64;

  const v = document.getElementById("video-el");
  if (!imgB64 && v.style.display !== "none") {
    imgB64 = captureFromVideo();
    currentImageBase64 = imgB64;
  }

  if (!imgB64) {
    alert("Aktifkan kamera atau unggah foto terlebih dahulu.");
    return;
  }

  // Tampilkan loading
  document.getElementById("result-box").classList.remove("show");
  document.getElementById("thinking").classList.add("show");
  document.getElementById("btn-scan-now").disabled = true;

  try {
    // Kirim ke backend Python (YOLOv8)
    const response = await fetch(`${API_BASE}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imgB64 })
    });

    if (!response.ok) throw new Error("Server error: " + response.status);

    const data = await response.json();
    // Backend mengembalikan: { class: "Plastik", confidence: 0.92, processing_time_ms: 45 }
    showResult(data.class, Math.round(data.confidence * 100), data.processing_time_ms);
    updateHistory(data.class.toLowerCase());

  } catch (err) {
    console.error("Backend tidak tersedia:", err);
    // Fallback ke Claude API jika backend tidak aktif
    await classifyWithClaude(imgB64);
  }

  document.getElementById("thinking").classList.remove("show");
  document.getElementById("btn-scan-now").disabled = false;
}

// Fallback: klasifikasi pakai Claude API langsung dari browser
async function classifyWithClaude(imgB64) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imgB64 } },
            { type: "text", text: `Klasifikasikan sampah dalam gambar ini ke salah satu dari 4 kelas: Organik, Plastik, Kertas, atau Logam. Jawab HANYA JSON tanpa backtick: {"class":"Organik|Plastik|Kertas|Logam","confidence":0.0-1.0,"reason":"alasan singkat dalam bahasa Indonesia"}` }
          ]
        }]
      })
    });
    const data = await res.json();
    const text = data.content.map(c => c.text || "").join("");
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    showResult(parsed.class, Math.round(parsed.confidence * 100), null, parsed.reason);
    updateHistory(parsed.class.toLowerCase());
  } catch (e) {
    showError();
  }
}

function showResult(jenisRaw, pct, processingMs = null, reason = null) {
  const key = jenisRaw.toLowerCase();
  const d = WASTE_DATA[key] || WASTE_DATA["organik"];

  document.getElementById("result-icon").innerHTML = `<span style="font-size:24px">${d.icon}</span>`;
  document.getElementById("result-icon").style.background = d.color;
  document.getElementById("result-type").textContent = d.label;
  document.getElementById("conf-text").textContent = pct + "%";
  document.getElementById("conf-bar").style.width = pct + "%";

  let infoText = reason ? `${reason} — ${d.info}` : d.info;
  if (processingMs) infoText += ` (Diproses dalam ${processingMs}ms)`;
  document.getElementById("result-info").textContent = infoText;

  document.getElementById("result-tips").innerHTML = `
    <div class="tips-title">Cara Pengelolaan</div>
    ${d.tips.map(t => `<div class="tip-item"><i class="ti ti-circle-check"></i><span>${t}</span></div>`).join("")}
  `;

  document.getElementById("result-box").classList.add("show");
}

function showError() {
  document.getElementById("result-box").innerHTML = `
    <div style="text-align:center;padding:20px;color:#6b7280">
      <i class="ti ti-alert-circle" style="font-size:32px;color:#EF9F27;display:block;margin-bottom:8px"></i>
      <strong>Gagal menghubungi server</strong>
      <p style="font-size:13px;margin-top:6px">Pastikan backend Python sudah berjalan di <code>localhost:8000</code></p>
    </div>
  `;
  document.getElementById("result-box").classList.add("show");
}

function resetScan() {
  document.getElementById("result-box").classList.remove("show");
  document.getElementById("preview-img").style.display = "none";
  document.getElementById("cam-overlay").style.display = "block";
  document.getElementById("btn-scan-now").style.display = "none";
  document.getElementById("file-input").value = "";
  currentImageBase64 = null;
}

// =============================================
//   STATISTIK
// =============================================
function updateHistory(key) {
  scanHistory.total++;
  if (scanHistory[key] !== undefined) scanHistory[key]++;
  localStorage.setItem("edusampah_history", JSON.stringify(scanHistory));
}

function updateStats() {
  const h = scanHistory;
  document.getElementById("total-scan").textContent = h.total;
  const org = h.organik || 0, pl = h.plastik || 0, ker = h.kertas || 0, log = h.logam || 0;
  document.getElementById("ct-organik").textContent = org;
  document.getElementById("ct-anorganik").textContent = pl + ker + log;
  const total = org + pl + ker + log || 1;
  const setBar = (id, val) => {
    const pct = Math.round(val / total * 100);
    document.getElementById("bar-" + id).style.width = pct + "%";
    document.getElementById("pct-" + id).textContent = pct + "%";
  };
  setBar("organik", org); setBar("plastik", pl); setBar("kertas", ker); setBar("logam", log);
}

function resetStats() {
  if (confirm("Reset semua data statistik?")) {
    scanHistory = { total: 0, organik: 0, plastik: 0, kertas: 0, logam: 0 };
    localStorage.removeItem("edusampah_history");
    updateStats();
  }
}

// =============================================
//   EDUKASI MODAL
// =============================================
function showEduDetail(key) {
  const d = WASTE_DATA[key];
  if (!d) return;
  document.getElementById("modal-content").innerHTML = `
    <div style="background:${d.color};border-radius:10px;padding:16px;margin-bottom:16px">
      ${d.detail}
    </div>
  `;
  document.getElementById("edu-modal").classList.add("open");
}

function closeModal() {
  document.getElementById("edu-modal").classList.remove("open");
}

// Tutup modal dengan tombol Escape
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});