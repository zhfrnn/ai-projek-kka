// ========================================================
//   EduSampah AI — JavaScript Frontend Logic (Production)
// ========================================================

// Tautan API Backend yang mengarah ke Hugging Face Spaces Anda
const API_BASE = "https://zhafrannn-edusampah-backend.hf.space";

let stream = null;
let currentFile = null;

// Mengatur Data Statistik Default di LocalStorage
if (!localStorage.getItem('edu_stats')) {
    localStorage.setItem('edu_stats', JSON.stringify({
        total: 0,
        organik: 0,
        plastik: 0,
        kertas: 0,
        logam: 0
    }));
}

// 1. FUNGSI NAVIGASI TAB MENU
function switchTab(tabName) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    const targetPanel = document.getElementById(`panel-${tabName}`);
    if (targetPanel) targetPanel.classList.add('active');
    
    // Cari tombol navigasi yang sesuai
    const tabs = document.querySelectorAll('.tab');
    if (tabName === 'scan') tabs[0].classList.add('active');
    if (tabName === 'stats') {
        tabs[1].classList.add('active');
        updateStats();
    }
    if (tabName === 'edu') tabs[2].classList.add('active');
    if (tabName === 'about') tabs[3].classList.add('active');

    // Matikan kamera jika pindah dari tab scan
    if (tabName !== 'scan') stopCamera();
}

// 2. FUNGSI LOGIKA KAMERA HP/LAPTOP
async function startCamera() {
    const video = document.getElementById('video-el');
    const preview = document.getElementById('preview-img');
    const overlay = document.getElementById('cam-overlay');
    const btnScan = document.getElementById('btn-scan-now');

    preview.classList.add('hidden');
    currentFile = null;

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        video.srcObject = stream;
        video.classList.remove('hidden');
        overlay.classList.add('hidden');
        btnScan.classList.remove('hidden');
    } catch (err) {
        alert("Gagal membuka kamera. Pastikan memberikan izin akses kamera.");
        console.error(err);
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// 3. FUNGSI HANDLER UNGGAH FOTO (FILE INPUT)
function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    currentFile = file;
    stopCamera();

    const video = document.getElementById('video-el');
    const preview = document.getElementById('preview-img');
    const overlay = document.getElementById('cam-overlay');
    const btnScan = document.getElementById('btn-scan-now');

    video.classList.add('hidden');
    overlay.classList.add('hidden');
    
    // Tampilkan gambar pratinjau
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        btnScan.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// 4. FUNGSI UTAMA SCAN DAN KIRIM KE BACKEND HUGGING FACE
async function doScan() {
    const btnScan = document.getElementById('btn-scan-now');
    const thinking = document.getElementById('thinking');
    const resultBox = document.getElementById('result-box');

    btnScan.classList.add('hidden');
    thinking.classList.add('show');
    resultBox.classList.remove('show');

    let formData = new FormData();

    if (currentFile) {
        // Kasus: Menggunakan file foto yang diunggah
        formData.append("file", currentFile);
    } else if (stream) {
        // Kasus: Mengambil jepretan langsung dari kamera aktif
        const video = document.getElementById('video-el');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        formData.append("file", blob, "capture.jpg");
    } else {
        alert("Silakan pilih foto atau buka kamera terlebih dahulu!");
        resetScan();
        return;
    }

    try {
        // Proses Pengiriman Data Menggunakan Fetch API ke Hugging Face
        const response = await fetch(`${API_BASE}/predict`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Server memberikan respon error.");

        const data = await response.json();
        
        // Tampilkan Hasil Analisis AI ke Tampilan Layar
        showResult(data);
    } catch (error) {
        alert("Gagal menghubungi server AI di Hugging Face. Pastikan server berstatus 'Running'.");
        console.error(error);
        resetScan();
    } finally {
        thinking.classList.remove('show');
    }
}

// 5. FUNGSI MENAMPILKAN HASIL PREDIKSI & UPDATE LOCAL STORAGE
function showResult(data) {
    const resultBox = document.getElementById('result-box');
    const typeTitle = document.getElementById('result-type');
    const confText = document.getElementById('conf-text');
    const confBar = document.getElementById('conf-bar');
    const infoText = document.getElementById('result-info');
    const tipsContainer = document.getElementById('result-tips');
    const iconEl = document.getElementById('result-icon');

    // Mengambil data dari JSON response FastAPI
    const label = data.class_name || "Tidak Diketahui";
    const confidence = Math.round((data.confidence || 0) * 100);

    typeTitle.textContent = label;
    confText.textContent = `${confidence}%`;
    confBar.style.width = `${confidence}%`;

    // Ambil Data Statistik Lokal
    let stats = JSON.parse(localStorage.getItem('edu_stats'));
    stats.total += 1;

    // Normalisasi Klasifikasi untuk Edukasi Adiwiyata Moehi
    const lowerLabel = label.toLowerCase();
    tipsContainer.innerHTML = "";

    if (lowerLabel.includes('organic') || lowerLabel.includes('organik')) {
        iconEl.innerHTML = "🌿";
        iconEl.className = "w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-xl";
        infoText.textContent = "Sampah Organik terdeteksi. Jenis sampah ini berasal dari sisa makhluk hidup yang mudah membusuk secara alami.";
        tipsContainer.innerHTML = `
            <div class="flex items-center gap-2 text-xs text-emerald-700 font-semibold"><i class="ti ti-check"></i> Buang ke Tempat Sampah Hijau</div>
            <div class="flex items-center gap-2 text-xs text-gray-600"><i class="ti ti-arrow-right"></i> Manfaatkan untuk pembuatan pupuk kompos sekolah atau masukkan ke lubang biopori Moehi.</div>
        `;
        stats.organik += 1;
    } else if (lowerLabel.includes('paper') || lowerLabel.includes('kertas')) {
        iconEl.innerHTML = "📄";
        iconEl.className = "w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-xl";
        infoText.textContent = "Sampah Kertas terdeteksi. Merupakan bahan selulosa kering yang dapat didaur ulang menjadi kerajinan tangan bernilai guna.";
        tipsContainer.innerHTML = `
            <div class="flex items-center gap-2 text-xs text-blue-700 font-semibold"><i class="ti ti-check"></i> Masukkan ke Dropbox Pilah Kertas</div>
            <div class="flex items-center gap-2 text-xs text-gray-600"><i class="ti ti-arrow-right"></i> Pisahkan dari material basah dan kumpulkan ke Bank Sampah sekolah.</div>
        `;
        stats.kertas += 1;
    } else if (lowerLabel.includes('metal') || lowerLabel.includes('logam') || lowerLabel.includes('glass') || lowerLabel.includes('kaca')) {
        iconEl.innerHTML = "⚙️";
        iconEl.className = "w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 text-xl";
        infoText.textContent = "Sampah Anorganik Berharga (Logam/Kaca) terdeteksi. Memiliki waktu urai hingga ratusan tahun namun bernilai ekonomis tinggi.";
        tipsContainer.innerHTML = `
            <div class="flex items-center gap-2 text-xs text-red-700 font-semibold"><i class="ti ti-check"></i> Buang ke Tong Sampah Kuning</div>
            <div class="flex items-center gap-2 text-xs text-gray-600"><i class="ti ti-arrow-right"></i> Bersihkan sisa cairan lalu donasikan ke kader Adiwiyata untuk ditabung.</div>
        `;
        stats.logam += 1;
    } else {
        // Kategori Plastik / Anorganik Lainnya
        iconEl.innerHTML = "♻️";
        iconEl.className = "w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 text-xl";
        infoText.textContent = "Sampah Plastik/Anorganik Umum terdeteksi. Jenis material sintetis yang sulit terurai secara alami di lingkungan sekolah.";
        tipsContainer.innerHTML = `
            <div class="flex items-center gap-2 text-xs text-amber-700 font-semibold"><i class="ti ti-check"></i> Buang ke Tong Sampah Kuning</div>
            <div class="flex items-center gap-2 text-xs text-gray-600"><i class="ti ti-arrow-right"></i> Kurangi penggunaan sedotan/kantong plastik kresek di area kantin Moehi.</div>
        `;
        stats.plastik += 1;
    }

    // Simpan Kembali Update Statistik
    localStorage.setItem('edu_stats', JSON.stringify(stats));
    resultBox.classList.add('show');
    stopCamera();
}

function resetScan() {
    stopCamera();
    currentFile = null;
    document.getElementById('video-el').classList.add('hidden');
    document.getElementById('preview-img').classList.add('hidden');
    document.getElementById('cam-overlay').classList.remove('hidden');
    document.getElementById('btn-scan-now').classList.add('hidden');
    document.getElementById('result-box').classList.remove('show');
    document.getElementById('thinking').classList.remove('show');
}

// 6. FUNGSI ME-RENDER PANEL STATISTIK KEPADA PENGGUNA
function updateStats() {
    const stats = JSON.parse(localStorage.getItem('edu_stats'));
    
    document.getElementById('total-scan').textContent = stats.total;
    document.getElementById('ct-organik').textContent = stats.organik;
    document.getElementById('ct-anorganik').textContent = (stats.plastik + stats.kertas + stats.logam);

    const total = stats.total || 1; // Mencegah pembagian angka nol (NaN)

    setBar('organik', stats.organik, total);
    setBar('plastic', stats.plastik, total);
    setBar('kertas', stats.kertas, total);
    setBar('logam', stats.logam, total);
}

function setBar(id, nilai, total) {
    const pct = Math.round((nilai / total) * 100);
    const pctTxt = document.getElementById(`pct-${id}`);
    const barEl = document.getElementById(`bar-${id}`);
    
    if (pctTxt) pctTxt.textContent = `${pct}%`;
    if (barEl) barEl.style.width = `${pct}%`;
}

function resetStats() {
    if(confirm("Apakah Anda yakin ingin menghapus semua data statistik Adiwiyata?")) {
        localStorage.removeItem('edu_stats');
        location.reload();
    }
}

// FUNGSI MODAL DI TAB EDUKASI
function showEduDetail(type) {
    const modal = document.getElementById('edu-modal');
    const content = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (type === 'organik') {
        content.innerHTML = `
            <h3 class="text-base font-bold text-emerald-700">🌿 Pengolahan Sampah Organik Moehi</h3>
            <p class="text-xs text-gray-600 mt-2 leading-relaxed">Di SMA Muhammadiyah 1 Yogyakarta, sampah organik dari sisa guguran daun diolah menjadi kompos menggunakan komposter sekolah atau dimanfaatkan langsung melalui lubang biopori resapan air guna menyuburkan tanah sekitar halaman sekolah.</p>
        `;
    } else if (type === 'plastik') {
        content.innerHTML = `
            <h3 class="text-base font-bold text-amber-700">♻️ Memahami Kode & Bahaya Plastik</h3>
            <p class="text-xs text-gray-600 mt-2 leading-relaxed">Siswa diimbau untuk selalu melihat kode logo segitiga daur ulang di bawah botol plastik (PETE 1, HDPE 2, dsb). Mari sukseskan gerakan bebas plastik sekali pakai dengan membawa botol minum (Tumbler) sendiri dari rumah!</p>
        `;
    } else if (type === 'kertas') {
        content.innerHTML = `
            <h3 class="text-base font-bold text-blue-700">📄 Dropbox Kertas & Penyelamatan Pohon</h3>
            <p class="text-xs text-gray-600 mt-2 leading-relaxed">Setiap ruang kelas difasilitasi kotak khusus pilah kertas bekas tugas atau kertas ujian. Kertas yang terkumpul secara berkala didaur ulang menjadi lembaran kreatif atau disalurkan ke pengepul mitra Adiwiyata Moehi.</p>
        `;
    } else if (type === 'logam') {
        content.innerHTML = `
            <h3 class="text-base font-bold text-red-700">⚙️ Tabungan Logam Ekonomis</h3>
            <p class="text-xs text-gray-600 mt-2 leading-relaxed">Sampah berupa kaleng minuman ringan atau kemasan aluminium memiliki harga jual stabil yang tinggi. Melalui program Bank Sampah sekolah, siswa dapat mengumpulkan kaleng ini untuk dikonversi menjadi tabungan kelas.</p>
        `;
    }
}

function closeModal() {
    const modal = document.getElementById('edu-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}