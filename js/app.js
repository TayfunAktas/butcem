// --- INIT & STATE ---
let data = JSON.parse(localStorage.getItem('butcemData')) || {
    islemler: [], kasa: [], taksitler: [], sabitler: [],
    kategoriler: {
        Gelir: ['Maaş', 'Prim', 'Kira'],
        Gider: ['Market', 'Fatura', 'Akaryakıt'],
        Yatırım: ['Altın', 'Borsa', 'Döviz']
    },
    ayarlar: { hedef: 100000, tema: 'dark', renk: 'green', portfoy: 0 }
};

let state = {
    ay: new Date().getMonth() + 1,
    yil: new Date().getFullYear(),
    aktifSayfa: 'analiz',
    aktifIslemTab: 'gelirler',
    aktifSabitTab: 'giderler'
};

const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

// Formatlayıcı (1.000.000,00 TL)
const formatMoney = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

// --- CORE APP ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    buildDateSelectors();
    switchPage('analiz');
});

function saveData() { localStorage.setItem('butcemData', JSON.stringify(data)); }

function applyTheme() {
    document.body.className = `theme-${data.ayarlar.tema} color-${data.ayarlar.renk}`;
}

// --- UI HELPERS ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    const overlay = document.getElementById('sidebar-overlay');
    if (document.getElementById('sidebar').classList.contains('open')) {
        overlay.classList.add('open');
    } else {
        overlay.classList.remove('open');
    }
}

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`page-${pageId}`).classList.add('active');
    const nav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if(nav) nav.classList.add('active');
    
    state.aktifSayfa = pageId;
    renderCurrentPage();
}

function switchTab(page, tab) {
    if(page === 'islemler') state.aktifIslemTab = tab;
    if(page === 'sabitler') state.aktifSabitTab = tab;
    
    const tabs = document.querySelector(`#page-${page} .tabs`).children;
    for(let i=0; i<tabs.length; i++) {
        tabs[i].classList.remove('active');
        if(tabs[i].innerText.toLowerCase() === tab) tabs[i].classList.add('active');
    }
    renderCurrentPage();
}

function toggleSelect(id) {
    const el = document.getElementById(id);
    const isVisible = el.style.display === 'block';
    document.querySelectorAll('.select-dropdown').forEach(d => d.style.display = 'none');
    el.style.display = isVisible ? 'none' : 'block';
}

function buildDateSelectors() {
    // Ay seçici
    let monthHtml = '';
    aylar.forEach((ay, idx) => {
        monthHtml += `<div onclick="setDate(${idx+1}, null)">${ay}</div>`;
    });
    document.getElementById('month-dropdown').innerHTML = monthHtml;
    
    // Yıl seçici
    let yearHtml = '';
    for(let y = 2026; y <= 2050; y++) {
        yearHtml += `<div onclick="setDate(null, ${y})">${y}</div>`;
    }
    document.getElementById('year-dropdown').innerHTML = yearHtml;
    
    updateDateDisplay();
}

function setDate(m, y) {
    if(m) state.ay = m;
    if(y) state.yil = y;
    updateDateDisplay();
    renderCurrentPage();
}

function updateDateDisplay() {
    document.getElementById('selected-month').innerText = aylar[state.ay - 1];
    document.getElementById('selected-year').innerText = state.yil;
}

// --- MODAL & FORM ---
function openModal(modalId, extraParam = null) {
    document.getElementById(modalId).classList.add('open');
    if (modalId === 'islemEkleModal') {
        const turDropdown = document.getElementById('tur-dropdown');
        turDropdown.innerHTML = '';
        let list = [];
        if (state.aktifIslemTab === 'gelirler') list = data.kategoriler.Gelir;
        if (state.aktifIslemTab === 'giderler') list = data.kategoriler.Gider;
        if (state.aktifIslemTab === 'yatirimlar') list = data.kategoriler.Yatırım;
        
        list.forEach(k => {
            turDropdown.innerHTML += `<div onclick="setKategori('${k}')">${k}</div>`;
        });
        document.getElementById('islem-turu-secim').innerText = 'Kategori Seçin';
        document.getElementById('islem-tutar').value = '';
        document.getElementById('islem-not').value = '';
        document.getElementById('islem-tarih').value = new Date().toISOString().split('T')[0];
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

function setKategori(ad) {
    document.getElementById('islem-turu-secim').innerText = ad;
}

// --- VERİ EKLEME ---
function saveIslem() {
    const kat = document.getElementById('islem-turu-secim').innerText;
    const tutar = parseFloat(document.getElementById('islem-tutar').value);
    const tarih = document.getElementById('islem-tarih').value;
    const not = document.getElementById('islem-not').value;

    if(kat === 'Kategori Seçin' || isNaN(tutar) || !tarih) {
        alert("Lütfen tüm zorunlu alanları doldurun."); return;
    }

    let turStr = state.aktifIslemTab === 'gelirler' ? 'Gelir' : (state.aktifIslemTab === 'giderler' ? 'Gider' : 'Yatırım');
    
    data.islemler.push({
        id: Date.now(), tur: turStr, kategori: kat, tutar: tutar, tarih: tarih, not: not
    });
    
    saveData();
    closeModal('islemEkleModal');
    renderCurrentPage();
}

// --- RENDER LOGIC ---
function renderCurrentPage() {
    if(state.aktifSayfa === 'analiz') renderAnaliz();
    if(state.aktifSayfa === 'islemler') renderIslemler();
    if(state.aktifSayfa === 'kasa') renderKasa();
    if(state.aktifSayfa === 'taksitler') renderTaksitler();
    if(state.aktifSayfa === 'sabitler') renderSabitler();
    if(state.aktifSayfa === 'ayarlar') renderAyarlar();
}

function getAylikIslemler() {
    return data.islemler.filter(i => {
        let d = new Date(i.tarih);
        return (d.getMonth() + 1) === state.ay && d.getFullYear() === state.yil;
    });
}

function renderIslemler() {
    const islemler = getAylikIslemler();
    let aylikGelir = islemler.filter(i=>i.tur==='Gelir').reduce((a,b)=>a+b.tutar, 0);
    let aylikGider = islemler.filter(i=>i.tur==='Gider').reduce((a,b)=>a+b.tutar, 0);
    let aylikYatirim = islemler.filter(i=>i.tur==='Yatırım').reduce((a,b)=>a+b.tutar, 0);
    
    let net = aylikGelir - (aylikGider + aylikYatirim);
    let netEl = document.getElementById('islemler-net-bakiye');
    netEl.innerText = formatMoney(net);
    netEl.className = net >= 0 ? 'positive' : 'negative';

    let turStr = state.aktifIslemTab === 'gelirler' ? 'Gelir' : (state.aktifIslemTab === 'giderler' ? 'Gider' : 'Yatırım');
    let liste = islemler.filter(i=>i.tur === turStr);
    
    let html = '';
    liste.forEach(i => {
        let renkClass = i.tur === 'Gelir' ? 'positive' : 'negative';
        let isaret = i.tur === 'Gelir' ? '+' : '-';
        html += `<div class="item-card">
            <div class="item-info">
                <h4>${i.kategori}</h4>
                <p>${i.tarih} ${i.not ? ' - '+i.not : ''}</p>
            </div>
            <div class="item-amount ${renkClass}">${isaret}${formatMoney(i.tutar)}</div>
        </div>`;
    });
    
    if(liste.length === 0) html = '<p class="text-center mt-15" style="color:var(--text-muted)">İşlem bulunamadı.</p>';
    document.getElementById('islemler-liste').innerHTML = html;
}

function renderAnaliz() {
    const islemler = getAylikIslemler();
    let gelir = islemler.filter(i=>i.tur==='Gelir').reduce((a,b)=>a+b.tutar, 0);
    let gider = islemler.filter(i=>i.tur==='Gider').reduce((a,b)=>a+b.tutar, 0);
    
    document.getElementById('analiz-aylik-gelir').innerText = formatMoney(gelir);
    document.getElementById('analiz-aylik-gider').innerText = formatMoney(gider);
    
    // Yıllık Ortalama
    let buYilIslemler = data.islemler.filter(i => new Date(i.tarih).getFullYear() === state.yil);
    let yGelir = buYilIslemler.filter(i=>i.tur==='Gelir').reduce((a,b)=>a+b.tutar, 0);
    let yGider = buYilIslemler.filter(i=>i.tur==='Gider').reduce((a,b)=>a+b.tutar, 0);
    let ayBolen = new Date().getMonth() + 1; // mevcut ay
    
    document.getElementById('analiz-ort-gelir').innerText = formatMoney(yGelir / ayBolen);
    document.getElementById('analiz-ort-gider').innerText = formatMoney(yGider / ayBolen);

    // Kasa
    let hedef = data.ayarlar.hedef || 1;
    let portfoy = data.ayarlar.portfoy || 0;
    let yuzde = Math.min((portfoy / hedef) * 100, 100);
    document.getElementById('hedef-progress').style.width = `${yuzde}%`;
    document.getElementById('analiz-hedef-kalan').innerText = `Kalan: ${formatMoney(Math.max(hedef - portfoy, 0))} ( %${yuzde.toFixed(2)} )`;
    
    // Aylık detaylar listesi
    document.getElementById('analiz-detay-liste').innerHTML = `
        <li><span>En Fazla Gelir</span> <strong>${formatMoney(Math.max(...islemler.filter(i=>i.tur==='Gelir').map(i=>i.tutar), 0))}</strong></li>
        <li><span>En Fazla Gider</span> <strong>${formatMoney(Math.max(...islemler.filter(i=>i.tur==='Gider').map(i=>i.tutar), 0))}</strong></li>
        <li><span>Kasada Kalan</span> <strong>${formatMoney(gelir - gider)}</strong></li>
    `;
    
    // Grafikleri Güncelle (Örnek Data)
    drawChart('gelirChart', ['Maaş', 'Diğer'], [gelir * 0.8, gelir * 0.2], ['#10b981', '#34d399']);
    drawChart('giderChart', ['Market', 'Fatura'], [gider * 0.6, gider * 0.4], ['#ef4444', '#f87171']);
}

// Chart.js render helper
let charts = {};
function drawChart(canvasId, labels, dataArr, colors) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if(charts[canvasId]) charts[canvasId].destroy();
    
    charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: dataArr, backgroundColor: colors, borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#f8fafc', font:{size:10} } } } }
    });
}

function renderAyarlar() {
    document.getElementById('ayar-hedef').value = data.ayarlar.hedef;
    
    let html = '';
    Object.keys(data.kategoriler).forEach(tur => {
        data.kategoriler[tur].forEach((k, idx) => {
            html += `<li><span><strong style="color:var(--text-muted); font-size:11px">[${tur}]</strong> ${k}</span> 
            <i class="fas fa-trash cat-del" onclick="delCategory('${tur}', ${idx})"></i></li>`;
        });
    });
    document.getElementById('kategori-listesi').innerHTML = html;
}

// --- AYARLAR EYLEMLER ---
function toggleTheme() {
    data.ayarlar.tema = data.ayarlar.tema === 'dark' ? 'light' : 'dark';
    saveData(); applyTheme();
}
function setAccent(color) {
    data.ayarlar.renk = color;
    saveData(); applyTheme();
}
function saveTarget() {
    data.ayarlar.hedef = parseFloat(document.getElementById('ayar-hedef').value) || 0;
    saveData(); renderCurrentPage();
}
function selectKategoriTur(tur) {
    document.getElementById('secili-kategori-tur').innerText = tur;
}
function addCategory() {
    const tur = document.getElementById('secili-kategori-tur').innerText;
    const ad = document.getElementById('yeni-kategori-ad').value.trim();
    if(ad) {
        data.kategoriler[tur].push(ad);
        document.getElementById('yeni-kategori-ad').value = '';
        saveData(); renderAyarlar();
    }
}
function delCategory(tur, idx) {
    data.kategoriler[tur].splice(idx, 1);
    saveData(); renderAyarlar();
}

// Mock kasa portfoy güncelleme
function updatePortfolio() {
    let val = parseFloat(document.getElementById('kasa-portfoy').value);
    if(!isNaN(val)) { data.ayarlar.portfoy = val; saveData(); alert('Portföy Güncellendi!'); }
}
