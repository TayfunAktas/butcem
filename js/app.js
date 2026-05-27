let data = JSON.parse(localStorage.getItem('butcemData_v2')) || {
    islemler: [], 
    kasa: [], 
    taksitler: [], 
    sabitler: [],
    kategoriler: {
        Gelir: ['Maaş', 'Prim', 'Kira Geliri', 'Yatırım Getirisi'],
        Gider: ['Market Gideri', 'Faturalar', 'Kira Ödemesi', 'Giyim / Eğlence'],
        Yatırım: ['Altın Birikimi', 'Borsa Hissesi', 'Kripto Para', 'Döviz Alımı']
    },
    ayarlar: { hedef: 150000, tema: 'dark', renk: 'green', portfoy: 0 }
};

let state = {
    ay: new Date().getMonth() + 1,
    yil: new Date().getFullYear(),
    aktifSayfa: 'analiz',
    aktifIslemTab: 'gelirler',
    aktifSabitTab: 'giderler',
    kasaModu: 'Giriş'
};

const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function formatMoney(amount) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    buildDateSelectors();
    switchPage('analiz');
});

function saveData() { localStorage.setItem('butcemData_v2', JSON.stringify(data)); }
function applyTheme() { document.body.className = `theme-${data.ayarlar.tema} color-${data.ayarlar.renk}`; }

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
}

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    const targetNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if(targetNav) targetNav.classList.add('active');
    state.aktifSayfa = pageId;
    renderCurrentPage();
}

function switchTab(page, tabName, event) {
    if(page === 'islemler') state.aktifIslemTab = tabName;
    if(page === 'sabitler') state.aktifSabitTab = tabName;
    const parent = event.currentTarget.parentElement;
    Array.from(parent.children).forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');
    renderCurrentPage();
}

function toggleSelect(id) {
    const el = document.getElementById(id);
    const wasOpen = el.style.display === 'block';
    document.querySelectorAll('.select-dropdown').forEach(d => d.style.display = 'none');
    if (!wasOpen) el.style.display = 'block';
}

function buildDateSelectors() {
    let mHtml = ''; aylar.forEach((m, i) => { mHtml += `<div onclick="setDate(${i+1}, null)">${m}</div>`; });
    document.getElementById('month-dropdown').innerHTML = mHtml;
    let yHtml = ''; for(let y = 2026; y <= 2050; y++) { yHtml += `<div onclick="setDate(null, ${y})">${y}</div>`; }
    document.getElementById('year-dropdown').innerHTML = yHtml;
    updateDateDisplay();
}

function setDate(m, y) {
    if(m) state.ay = m; if(y) state.yil = y;
    updateDateDisplay(); renderCurrentPage();
}

function updateDateDisplay() {
    document.getElementById('selected-month').innerText = aylar[state.ay - 1];
    document.getElementById('selected-year').innerText = state.yil;
}

function openModal(id) {
    document.getElementById(id).classList.add('open');
    if (id === 'islemEkleModal') {
        let list = [];
        if (state.aktifIslemTab === 'gelirler') { list = data.kategoriler.Gelir; document.getElementById('islem-modal-baslik').innerText = "Gelir İşlemi Ekle"; }
        if (state.aktifIslemTab === 'giderler') { list = data.kategoriler.Gider; document.getElementById('islem-modal-baslik').innerText = "Gider İşlemi Ekle"; }
        if (state.aktifIslemTab === 'yatirimlar') { list = data.kategoriler.Yatırım; document.getElementById('islem-modal-baslik').innerText = "Yatırım İşlemi Ekle"; }
        let drop = document.getElementById('tur-dropdown'); drop.innerHTML = '';
        list.forEach(k => { drop.innerHTML += `<div onclick="document.getElementById('islem-turu-secim').innerText='${k}'">${k}</div>`; });
        document.getElementById('islem-turu-secim').innerText = 'Kategori Seçin';
    }
    if (id === 'sabitEkleModal') {
        let list = state.aktifSabitTab === 'giderler' ? data.kategoriler.Gider : data.kategoriler.Yatırım;
        document.getElementById('sabit-modal-baslik').innerText = state.aktifSabitTab === 'giderler' ? "Sabit Gider Ekle" : "Sabit Yatırım Ekle";
        let drop = document.getElementById('sabit-kat-dropdown'); drop.innerHTML = '';
        list.forEach(k => { drop.innerHTML += `<div onclick="document.getElementById('sabit-tur-secim').innerText='${k}'">${k}</div>`; });
        document.getElementById('sabit-tur-secim').innerText = 'Kategori Seçin';
    }
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openKasaModal(mod) { state.kasaModu = mod; document.getElementById('kasa-modal-baslik').innerText = `Kasaya Nakit ${mod} İşlemi`; openModal('kasaIslemModal'); }

// KAYDETME
function saveIslem() {
    const kat = document.getElementById('islem-turu-secim').innerText;
    const tutar = parseFloat(document.getElementById('islem-tutar').value);
    const tarih = document.getElementById('islem-tarih').value;
    const not = document.getElementById('islem-not').value;
    if(kat === 'Kategori Seçin' || isNaN(tutar) || !tarih) { alert('Lütfen zorunlu alanları eksiksiz doldurun!'); return; }
    let turStr = state.aktifIslemTab === 'gelirler' ? 'Gelir' : (state.aktifIslemTab === 'giderler' ? 'Gider' : 'Yatırım');
    data.islemler.push({ id: Date.now(), tur: turStr, kategori: kat, tutar: tutar, tarih: tarih, not: not });
    saveData(); closeModal('islemEkleModal'); renderCurrentPage();
}

function saveKasaIslem() {
    const tutar = parseFloat(document.getElementById('kasa-tutar').value);
    const tarih = document.getElementById('kasa-tarih').value;
    const not = document.getElementById('kasa-not').value;
    if(isNaN(tutar) || !tarih || !not) { alert('Lütfen tüm alanları doldurun!'); return; }
    data.kasa.push({ id: Date.now(), mod: state.kasaModu, tutar: tutar, tarih: tarih, aciklama: not });
    saveData(); closeModal('kasaIslemModal'); renderCurrentPage();
}

function saveTaksitIslem() {
    const tur = document.getElementById('taksit-tur-secim').innerText;
    const ad = document.getElementById('taksit-ad').value;
    const tutar = parseFloat(document.getElementById('taksit-tutar').value);
    const adet = parseInt(document.getElementById('taksit-sayisi').value);
    const tarih = document.getElementById('taksit-tarih').value;
    if(!ad || isNaN(tutar) || isNaN(adet) || !tarih) { alert('Lütfen zorunlu alanları doldurun!'); return; }
    data.taksitler.push({ id: Date.now(), tur: 'Gider', ad: ad, tutar: tutar, adet: adet, tarih: tarih, not: document.getElementById('taksit-not').value });
    saveData(); closeModal('taksitEkleModal'); renderCurrentPage();
}

function saveSabitIslem() {
    const kat = document.getElementById('sabit-tur-secim').innerText;
    const tutar = parseFloat(document.getElementById('sabit-tutar').value);
    const m = parseInt(document.getElementById('sabit-baslangic-ay').value);
    const y = parseInt(document.getElementById('sabit-baslangic-yil').value);
    const sure = parseInt(document.getElementById('sabit-sure').value);
    if(kat === 'Kategori Seçin' || isNaN(tutar) || isNaN(m) || isNaN(y) || isNaN(sure)) { alert('Eksik bilgi girdiniz!'); return; }
    data.sabitler.push({ id: Date.now(), tur: state.aktifSabitTab === 'giderler' ? 'Gider' : 'Yatırım', kategori: kat, tutar: tutar, basAy: m, basYil: y, sure: sure });
    saveData(); closeModal('sabitEkleModal'); renderCurrentPage();
}

// --- YENİ BİRLEŞTİRİCİ VERİ MOTORU ---
function getCombinedData(m, y) {
    let currentAbs = y * 12 + m;
    let normal = data.islemler.filter(i => {
        let d = new Date(i.tarih);
        return (d.getMonth()+1) === m && d.getFullYear() === y;
    });

    let activeTaksitler = data.taksitler.filter(t => {
        let d = new Date(t.tarih);
        let startAbs = d.getFullYear() * 12 + d.getMonth() + 1;
        return currentAbs >= startAbs && currentAbs < startAbs + t.adet;
    }).map(t => ({
        id: t.id, tur: 'Gider', kategori: t.ad + ' (Taksit)', tutar: t.tutar / t.adet, tarih: t.tarih, not: t.adet + ' Ay Taksit'
    }));

    let activeSabitler = data.sabitler.filter(s => {
        let startAbs = s.basYil * 12 + s.basAy;
        return currentAbs >= startAbs && currentAbs < startAbs + s.sure;
    }).map(s => ({
        id: s.id, tur: s.tur, kategori: s.kategori + ' (Sabit)', tutar: s.tutar, tarih: `${s.basYil}-${String(s.basAy).padStart(2,'0')}-01`, not: s.sure + ' Ay Sabit'
    }));

    return [...normal, ...activeTaksitler, ...activeSabitler];
}

// YENİ KÜMÜLATİF KASA HESAPLAMASI (Geçmiş Tüm Net İşlemler + Kasa Giriş/Çıkışları)
function getCumulativeBalance(currentM, currentY) {
    let currentAbs = currentY * 12 + currentM;
    let total = 0;

    data.islemler.forEach(i => {
        let d = new Date(i.tarih); let abs = d.getFullYear() * 12 + d.getMonth() + 1;
        if (abs <= currentAbs) { if(i.tur === 'Gelir') total += i.tutar; else total -= i.tutar; }
    });

    data.taksitler.forEach(t => {
        let d = new Date(t.tarih); let startAbs = d.getFullYear() * 12 + d.getMonth() + 1;
        let endAbs = Math.min(startAbs + t.adet - 1, currentAbs);
        if(startAbs <= currentAbs) { let monthsActive = (endAbs - startAbs) + 1; total -= (t.tutar / t.adet) * monthsActive; }
    });

    data.sabitler.forEach(s => {
        let startAbs = s.basYil * 12 + s.basAy;
        let endAbs = Math.min(startAbs + s.sure - 1, currentAbs);
        if(startAbs <= currentAbs) { let monthsActive = (endAbs - startAbs) + 1; total -= s.tutar * monthsActive; }
    });

    data.kasa.forEach(k => {
        let d = new Date(k.tarih); let abs = d.getFullYear() * 12 + d.getMonth() + 1;
        if (abs <= currentAbs) { if(k.mod === 'Giriş') total += k.tutar; else total -= k.tutar; }
    });
    return total;
}

function renderCurrentPage() {
    if(state.aktifSayfa === 'analiz') renderAnaliz();
    if(state.aktifSayfa === 'islemler') renderIslemler();
    if(state.aktifSayfa === 'kasa') renderKasa();
    if(state.aktifSayfa === 'taksitler') renderTaksitler();
    if(state.aktifSayfa === 'sabitler') renderSabitler();
    if(state.aktifSayfa === 'ayarlar') renderAyarlar();
}

function renderAnaliz() {
    let mData = getCombinedData(state.ay, state.yil);
    let gelirler = mData.filter(i=>i.tur==='Gelir');
    let giderler = mData.filter(i=>i.tur==='Gider' || i.tur==='Yatırım');
    
    let totalGelir = gelirler.reduce((a,b)=>a+b.tutar,0);
    let totalGider = giderler.reduce((a,b)=>a+b.tutar,0);
    
    document.getElementById('analiz-aylik-gelir').innerText = formatMoney(totalGelir);
    document.getElementById('analiz-aylik-gider').innerText = formatMoney(totalGider);

    // Kümülatif Kasa Güncellemesi
    let currentBalance = getCumulativeBalance(state.ay, state.yil);
    let prevM = state.ay === 1 ? 12 : state.ay - 1;
    let prevY = state.ay === 1 ? state.yil - 1 : state.yil;
    let prevBalance = getCumulativeBalance(prevM, prevY);
    let diff = currentBalance - prevBalance;

    document.getElementById('analiz-kasa-bakiye').innerText = formatMoney(currentBalance);
    let diffEl = document.getElementById('analiz-kasa-fark');
    if(diff >= 0) diffEl.innerHTML = `Geçen aya göre: <span class="positive">+${formatMoney(diff)}</span>`;
    else diffEl.innerHTML = `Geçen aya göre: <span class="negative">${formatMoney(diff)}</span>`;

    let hedef = data.ayarlar.hedef || 1;
    let portfoy = data.ayarlar.portfoy || 0;
    let yuzde = Math.min((portfoy / hedef) * 100, 100);
    document.getElementById('hedef-progress').style.width = `${yuzde}%`;
    document.getElementById('analiz-hedef-kalan').innerText = `Hedefe Kalan: ${formatMoney(Math.max(hedef - portfoy, 0))} ( %${yuzde.toFixed(1)} )`;

    // Dinamik Grafikler (Sorun 1 Çözüldü)
    let gMap = {}; gelirler.forEach(g => { gMap[g.kategori] = (gMap[g.kategori] || 0) + g.tutar; });
    let gidMap = {}; giderler.forEach(g => { gidMap[g.kategori] = (gidMap[g.kategori] || 0) + g.tutar; });

    let gLabels = Object.keys(gMap); let gVals = Object.values(gMap);
    let gidLabels = Object.keys(gidMap); let gidVals = Object.values(gidMap);

    if(gLabels.length===0) { gLabels=['Gelir Yok']; gVals=[1]; }
    if(gidLabels.length===0) { gidLabels=['Gider Yok']; gidVals=[1]; }

    let colors = ['#ef4444', '#3b82f6', '#f97316', '#10b981', '#eab308', '#a855f7', '#ec4899', '#06b6d4'];
    drawChart('gelirChart', gLabels, gVals, colors);
    drawChart('giderChart', gidLabels, gidVals, colors);
}

function renderIslemler() {
    let mData = getCombinedData(state.ay, state.yil);
    let gelir = mData.filter(i=>i.tur==='Gelir').reduce((a,b)=>a+b.tutar,0);
    let gider = mData.filter(i=>i.tur==='Gider').reduce((a,b)=>a+b.tutar,0);
    let yatirim = mData.filter(i=>i.tur==='Yatırım').reduce((a,b)=>a+b.tutar,0);
    
    let net = gelir - (gider + yatirim);
    document.getElementById('islemler-net-bakiye').innerText = formatMoney(net);
    document.getElementById('islemler-net-bakiye').className = net >= 0 ? 'positive' : 'negative';

    let aktifTur = state.aktifIslemTab === 'gelirler' ? 'Gelir' : (state.aktifIslemTab === 'giderler' ? 'Gider' : 'Yatırım');
    let listHtml = '';
    
    mData.filter(i=>i.tur === aktifTur).forEach(i => {
        listHtml += `<div class="item-card">
            <div class="item-info"><h4>${i.kategori}</h4><p>${i.tarih} ${i.not ? ' - '+i.not : ''}</p></div>
            <div class="item-amount ${i.tur==='Gelir'?'positive':'negative'}">${i.tur==='Gelir'?'+':'-'}${formatMoney(i.tutar)}</div>
        </div>`;
    });
    document.getElementById('islemler-liste').innerHTML = listHtml || '<p class="text-center mt-10">Bu aya ait kayıtlı işlem yok.</p>';
}

function renderKasa() {
    // Kasa ekranındaki toplam artık tüm net bakiye olarak hesaplanır
    document.getElementById('kasa-toplam').innerText = formatMoney(getCumulativeBalance(state.ay, state.yil));
    document.getElementById('kasa-portfoy').value = data.ayarlar.portfoy;

    let sAyKasa = data.kasa.filter(k => {
        let d = new Date(k.tarih); return (d.getMonth()+1) === state.ay && d.getFullYear() === state.yil;
    });
    let html = '';
    sAyKasa.forEach(k => {
        html += `<div class="item-card">
            <div class="item-info"><h4>${k.aciklama}</h4><p>${k.tarih}</p></div>
            <div class="item-amount ${k.mod==='Giriş'?'positive':'negative'}">${k.mod==='Giriş'?'+':'-'}${formatMoney(k.tutar)}</div>
        </div>`;
    });
    document.getElementById('kasa-liste').innerHTML = html || '<p class="text-center mt-10" style="font-size:12px; color:var(--text-muted);">Bu aya ait manuel kasa işlemi bulunamadı. (Sadece manuel girdiler listelenir, ana bakiye yukarıda özetlenir.)</p>';
}

function toggleCard(id) { let el = document.getElementById(id); el.style.display = el.style.display === 'block' ? 'none' : 'block'; }

function renderTaksitler() {
    let currentAbs = state.yil * 12 + state.ay;
    let active = data.taksitler.filter(t => {
        let d = new Date(t.tarih); let startAbs = d.getFullYear() * 12 + d.getMonth() + 1;
        return currentAbs >= startAbs && currentAbs < startAbs + t.adet;
    });

    let html = '';
    active.forEach((t, idx) => {
        let uniqueId = `taksit-detay-${idx}`;
        html += `<div class="glass-card mb-10" onclick="toggleCard('${uniqueId}')" style="cursor:pointer;">
            <div class="flex-between">
                <div><strong>${t.ad}</strong><p style="font-size:11px; color:var(--text-muted);">${t.tur} - ${t.adet} Taksit</p></div>
                <div class="negative" style="font-weight:700;">${formatMoney(t.tutar / t.adet)} <span style="font-size:10px; font-weight:normal">/ay</span></div>
            </div>
            <div class="expandable-content" id="${uniqueId}">
                <div class="sub-row"><span>İşlem Tarihi:</span> <span>${t.tarih}</span></div>
                <div class="sub-row"><span>Toplam Borç:</span> <span>${formatMoney(t.tutar)}</span></div>
            </div>
        </div>`;
    });
    document.getElementById('taksitler-liste').innerHTML = html || `<p class="text-center mt-10">Seçili ay (${aylar[state.ay-1]} ${state.yil}) için aktif taksit bulunmuyor.</p>`;
}

function renderSabitler() {
    let currentAbs = state.yil * 12 + state.ay;
    let aktifTur = state.aktifSabitTab === 'giderler' ? 'Gider' : 'Yatırım';
    let active = data.sabitler.filter(s => {
        let startAbs = s.basYil * 12 + s.basAy;
        return s.tur === aktifTur && (currentAbs >= startAbs && currentAbs < startAbs + s.sure);
    });

    let html = '';
    active.forEach((s, idx) => {
        let uniqueId = `sabit-detay-${idx}`;
        html += `<div class="glass-card mb-10" onclick="toggleCard('${uniqueId}')" style="cursor:pointer;">
            <div class="flex-between">
                <div><strong>${s.kategori}</strong><p style="font-size:11px; color:var(--text-muted);">Başlangıç: ${s.basAy}/${s.basYil}</p></div>
                <div class="negative" style="font-weight:700;">${formatMoney(s.tutar)} <span style="font-size:10px; font-weight:normal">/ay</span></div>
            </div>
            <div class="expandable-content" id="${uniqueId}">
                <div class="sub-row"><span>Toplam Süre:</span> <span>${s.sure} Ay</span></div>
            </div>
        </div>`;
    });
    document.getElementById('sabitler-liste').innerHTML = html || `<p class="text-center mt-10">Seçili ay (${aylar[state.ay-1]} ${state.yil}) için aktif sabit ödeme bulunmuyor.</p>`;
}

function renderAyarlar() {
    document.getElementById('ayar-hedef').value = data.ayarlar.hedef;
    let html = '';
    Object.keys(data.kategoriler).forEach(tur => {
        data.kategoriler[tur].forEach((k, idx) => {
            html += `<li><span><strong>[${tur}]</strong> ${k}</span> <i class="fas fa-trash cat-del" onclick="delCategory('${tur}', ${idx})"></i></li>`;
        });
    });
    document.getElementById('kategori-listesi').innerHTML = html;
}

function updatePortfolio() { let val = parseFloat(document.getElementById('kasa-portfoy').value); if(!isNaN(val)) { data.ayarlar.portfoy = val; saveData(); renderCurrentPage(); alert('Portföy güncellendi.'); } }
function saveTarget() { data.ayarlar.hedef = parseFloat(document.getElementById('ayar-hedef').value) || 0; saveData(); renderCurrentPage(); alert('Hedef güncellendi.'); }
function selectKategoriTur(tur, e) { document.getElementById('secili-kategori-tur').innerText = tur; e.stopPropagation(); document.getElementById('kat-dropdown').style.display = 'none'; }
function addCategory() { let tur = document.getElementById('secili-kategori-tur').innerText; let ad = document.getElementById('yeni-kategori-ad').value.trim(); if(ad) { data.kategoriler[tur].push(ad); document.getElementById('yeni-kategori-ad').value = ''; saveData(); renderAyarlar(); } }
function delCategory(tur, idx) { data.kategoriler[tur].splice(idx, 1); saveData(); renderAyarlar(); }
function toggleTheme() { data.ayarlar.tema = data.ayarlar.tema === 'dark' ? 'light' : 'dark'; saveData(); applyTheme(); }
function setAccent(color) { data.ayarlar.renk = color; saveData(); applyTheme(); }
function toggleTaksitFields(isKK) { document.getElementById('kk-ozel-alanlar').style.display = isKK ? 'block' : 'none'; document.getElementById('kredi-ozel-alanlar').style.display = isKK ? 'none' : 'block'; }

let charts = {};
function drawChart(canvasId, labels, dataArr, colors) {
    const el = document.getElementById(canvasId);
    if(!el) return;
    const ctx = el.getContext('2d');
    if(charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: dataArr, backgroundColor: colors, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: data.ayarlar.tema==='dark'?'#f8fafc':'#0f172a', font:{size:10} } } } }
    });
}
