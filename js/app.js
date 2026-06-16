// ── Supabase Configuration ──
const SUPABASE_URL = 'https://ffiejosogbzamjdxwwfr.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmaWVqb3NvZ2J6YW1qZHh3d2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTUwNjIsImV4cCI6MjA5NzEzMTA2Mn0.jL8lix3C6npQBQw487wnoOr-KqaKF7f1GgF6Hxt_vNg';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── State (Global Variables) ──
let records = []; 
let mb52Data = []; 
let settings = {
  orgTh: 'การไฟฟ้าส่วนภูมิภาค',
  orgEn: 'PROVINCIAL ELECTRICITY AUTHORITY',
  defaultFrom: '',
  defaultTo: 'กบพ.ฉ.1',
  logo: '',
  mb52LastUpdate: '', 
};

// ── Init ──
async function init() {
  loadLocalSettings();
  applySettings();
  if(typeof addRow === 'function') addRow();
  
  const dateEl = document.getElementById('f_date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
  
  if (settings.defaultFrom) {
      const fromEl = document.getElementById('f_from');
      if (fromEl) fromEl.value = settings.defaultFrom;
  }
  if (settings.defaultTo) {
      const toEl = document.getElementById('f_to');
      if (toEl) toEl.value = settings.defaultTo;
  }
  if(typeof syncFromField === 'function') syncFromField();
  updateMB52Badge();
  
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn && window.innerWidth < 768) menuBtn.style.display = 'block';

  await Promise.all([
      fetchRecordsFromDB(),
      fetchMB52FromDB()
  ]);
}

// ── Database Operations (Supabase) ──
async function fetchRecordsFromDB() {
    const badge = document.getElementById('syncStatusBadge');
    if (badge) {
        badge.style.display = 'inline-block';
        badge.textContent = '🔄 กำลังดึงข้อมูลเอกสาร...';
        badge.className = 'badge badge-blue';
    }

    try {
        const { data: docs, error } = await supabaseClient
            .from('documents')
            .select(`
                id, doc_no, from_unit, to_unit, attention_to, doc_date, body_text, signer_name, sub_position, main_position,
                document_items ( item_code, item_desc, batch, qty, donor_unit, storage_location )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        records = docs.map(d => ({
            id: d.id,
            docno: d.doc_no,
            from: d.from_unit,
            to: d.to_unit,
            attention: d.attention_to || 'อก.บพ.ฉ.1',
            date: d.doc_date,
            body: d.body_text,
            signer: d.signer_name,
            subposition: d.sub_position,
            mainposition: d.main_position,
            rows: d.document_items.map(item => ({
                code: item.item_code,
                desc: item.item_desc,
                batch: item.batch,
                qty: item.qty,
                donor: item.donor_unit,
                location: item.storage_location
            }))
        }));

        if (badge) {
            badge.textContent = '✅ ข้อมูลเอกสารพร้อม';
            badge.className = 'badge badge-green';
            setTimeout(() => badge.style.display = 'none', 3000);
        }

        const pageRecords = document.getElementById('page-records');
        if(pageRecords && pageRecords.style.display !== 'none' && typeof renderRecords === 'function') renderRecords();
        
        const pageDashboard = document.getElementById('page-dashboard');
        if(pageDashboard && pageDashboard.style.display !== 'none' && typeof renderDashboard === 'function') renderDashboard();

    } catch (err) {
        console.error("Supabase Fetch Error:", err);
        if (badge) {
            badge.textContent = '❌ โหลดเอกสารผิดพลาด';
            badge.className = 'badge badge-danger';
        }
    }
}

async function fetchMB52FromDB() {
    try {
        const { data, error } = await supabaseClient
            .from('mb52_materials')
            .select('material_code, material_desc');
            
        if (error) throw error;

        mb52Data = data.map(item => ({
            code: item.material_code,
            desc: item.material_desc
        }));

        const countEl = document.getElementById('mb52Count');
        if (countEl) countEl.textContent = mb52Data.length;
        
        updateMB52Badge();
    } catch (err) {
        console.error("Error fetching MB52 from DB:", err);
    }
}

// ── Local Storage ──
function loadLocalSettings() {
  try {
    const s = localStorage.getItem('pea_settings');
    if (s) settings = { ...settings, ...JSON.parse(s) };
  } catch (e) { console.error("Error loading local storage", e); }
}

function saveLocalSettings() {
  localStorage.setItem('pea_settings', JSON.stringify(settings));
}

// ── Settings Application ──
function applySettings() {
  const orgNameEl = document.getElementById('sidebarOrgName');
  if (orgNameEl) orgNameEl.textContent = settings.orgTh;
  
  const sOrgTh = document.getElementById('s_orgTh');
  if (sOrgTh) sOrgTh.value = settings.orgTh;
  
  const sOrgEn = document.getElementById('s_orgEn');
  if (sOrgEn) sOrgEn.value = settings.orgEn;
  
  const sDefaultFrom = document.getElementById('s_defaultFrom');
  if (sDefaultFrom) sDefaultFrom.value = settings.defaultFrom;
  
  const sDefaultTo = document.getElementById('s_defaultTo');
  if (sDefaultTo) sDefaultTo.value = settings.defaultTo;

  if (settings.logo) {
    const sidebarLogo = document.getElementById('sidebarLogo');
    if (sidebarLogo) { sidebarLogo.src = settings.logo; sidebarLogo.style.display = 'block'; }
    
    const previewImg = document.getElementById('logoPreviewImg');
    if (previewImg) { previewImg.src = settings.logo; previewImg.style.display = 'block'; }
    
    const placeholder = document.getElementById('logoPlaceholder');
    if (placeholder) placeholder.style.display = 'none';
  }
  
  if (settings.mb52LastUpdate) {
    const updateEl = document.getElementById('mb52LastUpdate');
    if (updateEl) updateEl.textContent = 'อัพโหลดล่าสุด: ' + settings.mb52LastUpdate;
  }
}

// ── Navigation ──
function showPage(page) {
  ['form', 'records', 'dashboard', 'settings'].forEach(p => {
    const pageEl = document.getElementById('page-' + p);
    if (pageEl) pageEl.style.display = p === page ? '' : 'none';
    
    const navEl = document.getElementById('nav-' + p);
    if (navEl) navEl.classList.toggle('active', p === page);
  });
  
  const titles = { form: 'กรอกแบบฟอร์มขออนุมัติโอนพัสดุ', records: 'ประวัติเอกสาร', dashboard: 'Dashboard สรุปภาพรวม', settings: 'ตั้งค่าระบบ' };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[page];
  
  if (page === 'records' && typeof renderRecords === 'function') renderRecords();
  if (page === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
  
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth < 768 && sidebar) sidebar.classList.remove('open');
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// ── Utility ──
function formatThaiDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

// ── Settings Page Functions ──
function saveSettings() {
  settings.orgTh = document.getElementById('s_orgTh')?.value || settings.orgTh;
  settings.orgEn = document.getElementById('s_orgEn')?.value || settings.orgEn;
  settings.defaultFrom = document.getElementById('s_defaultFrom')?.value || '';
  settings.defaultTo = document.getElementById('s_defaultTo')?.value || '';
  
  const orgNameEl = document.getElementById('sidebarOrgName');
  if (orgNameEl) orgNameEl.textContent = settings.orgTh;
  
  saveLocalSettings();
}

function uploadLogo(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    settings.logo = ev.target.result;
    saveLocalSettings();
    applySettings(); // Re-apply to update images
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  settings.logo = '';
  const sidebarLogo = document.getElementById('sidebarLogo');
  if (sidebarLogo) { sidebarLogo.src = ''; sidebarLogo.style.display = 'none'; }
  
  const previewImg = document.getElementById('logoPreviewImg');
  if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
  
  const placeholder = document.getElementById('logoPlaceholder');
  if (placeholder) placeholder.style.display = 'block';
  
  saveLocalSettings();
}

// 🌟 แก้ไขระบบอัปโหลดให้ปลอดภัย ไม่เด้ง และกรองข้อมูลครบ
async function importMB52(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const uploadBtn = e.target.previousElementSibling;
  const originalHtml = uploadBtn ? uploadBtn.innerHTML : '📂 อัพโหลด MB52';
  
  if (uploadBtn) {
      uploadBtn.innerHTML = '⏳ กำลังอัปโหลดขึ้น Database...';
      uploadBtn.disabled = true;
  }

  const reader = new FileReader();
  reader.onload = async ev => {
    const lines = ev.target.result.split('\n');
    let dbPayload = [];
    let uniqueCodes = new Set(); // ตัวแปรป้องกันรหัสซ้ำ
    
    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        let code = parts[0].trim();
        const desc = parts[1].replace(/^"|"$/g, '').trim();
        
        // ลบช่องว่างหรืออักขระแปลกปลอมออกจากรหัส
        code = code.replace(/[^0-9A-Za-z-]/g, '');
        
        // ถ้ามีรหัส มีชื่อ และยังไม่เคยเจอในไฟล์นี้ ให้บันทึก
        if (code && desc) {
            if (!uniqueCodes.has(code)) {
                uniqueCodes.add(code);
                dbPayload.push({ material_code: code, material_desc: desc });
            }
        }
      }
    });

    if(dbPayload.length === 0) {
        alert("ไม่พบข้อมูลพัสดุ หรือรูปแบบไฟล์ไม่ถูกต้อง");
        if (uploadBtn) {
            uploadBtn.innerHTML = originalHtml;
            uploadBtn.disabled = false;
        }
        return;
    }

    try {
        // ลดขนาดส่งลงเหลือ 500 ป้องกัน Timeout
        const chunkSize = 500;
        for (let i = 0; i < dbPayload.length; i += chunkSize) {
            const chunk = dbPayload.slice(i, i + chunkSize);
            const { error } = await supabaseClient
                .from('mb52_materials')
                .upsert(chunk, { onConflict: 'material_code' });
                
            if (error) throw error;
        }

        mb52Data = dbPayload.map(item => ({ code: item.material_code, desc: item.material_desc }));

        settings.mb52LastUpdate = new Date().toLocaleDateString('th-TH');
        saveLocalSettings();

        // เช็คก่อนอัปเดตหน้าจอ ป้องกัน Error เด้ง
        const countEl = document.getElementById('mb52Count');
        if (countEl) countEl.textContent = mb52Data.length;
        
        const updateEl = document.getElementById('mb52LastUpdate');
        if (updateEl) updateEl.textContent = 'อัพโหลดล่าสุด: ' + settings.mb52LastUpdate;
        
        updateMB52Badge();
        
        alert(`อัปโหลดข้อมูล MB52 สำเร็จ: ${mb52Data.length} รายการ (บันทึกบนคลาวด์แล้ว)`);

    } catch (err) {
        console.error("Upload MB52 Error:", err);
        alert("เกิดข้อผิดพลาดในการอัปโหลด: " + err.message);
    } finally {
        if (uploadBtn) {
            uploadBtn.innerHTML = originalHtml;
            uploadBtn.disabled = false;
        }
        // ล้างค่า input ให้เลือกไฟล์เดิมซ้ำได้
        if (e.target) e.target.value = '';
    }
  };
  reader.readAsText(file, 'TIS-620');
}

function updateMB52Badge() {
  const badge = document.getElementById('mb52StatusBadge');
  if (!badge) return; // ป้องกันพังถ้าไม่มีแท็กนี้
  
  if (mb52Data.length > 0) {
    badge.className = 'badge badge-green';
    badge.textContent = `MB52: ${mb52Data.length} รายการ`;
  } else {
    badge.className = 'badge badge-orange';
    badge.textContent = 'MB52 ยังไม่ได้โหลด';
  }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', init);
