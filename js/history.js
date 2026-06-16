// ── Records & History ──
function renderRecords() {
  const q = document.getElementById('searchRec').value.toLowerCase();
  const filtered = records.filter(r =>
    (r.docno || '').toLowerCase().includes(q) ||
    (r.from || '').toLowerCase().includes(q) ||
    (r.to || '').toLowerCase().includes(q)
  );
  
  const tbody = document.getElementById('recordsBody');
  if (!filtered.length) { 
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#718096;">ไม่มีข้อมูล</td></tr>'; 
    return; 
  }
  
  // Render รายการประวัติ โดยจัดคอลัมน์และหัวตารางให้ตรงระเบียบ
  tbody.innerHTML = filtered.map((r, i) => `
    <tr>
      <td style="text-align:center;">${i + 1}</td>
      <td style="text-align:center;">${formatThaiDate(r.date)}</td>
      <td style="text-align:left;">${r.docno || '-'}</td>
      <td style="text-align:left;">${r.from || '-'}</td>
      <td style="text-align:left;">${r.to || '-'}</td>
      <td style="text-align:left;">${(r.rows || []).length} รายการ</td>
      <td style="text-align:center;">
        <div style="display:flex; gap:6px; justify-content:center;">
            <button class="btn btn-outline btn-sm" onclick="updateDocNo(${r.id})" title="ระบุเลขที่เอกสาร">📝 เลขที่</button>
            <button class="btn btn-outline btn-sm" onclick="loadRecord(${r.id})" title="โหลดข้อมูลกลับไปแก้ไข">📋 โหลด</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRecord(${r.id})" title="ลบเอกสาร">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── ฟังก์ชันอัปเดตเลขที่เอกสารด่วน (เปิด Custom Modal แทน Prompt) ──
function updateDocNo(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  
  // นำข้อมูล Record เดิมเข้าไปหยอดในกล่องและ Input ซ่อน
  document.getElementById('m_docno_input').value = r.docno || '';
  document.getElementById('m_docno_id').value = id;
  
  // เปิดแสดงผลหน้าต่าง Modal
  document.getElementById('docNoModal').classList.add('open');
  
  // ตั้งค่า Focus อัตโนมัติเพื่อให้พิมพ์ต่อได้ทันที
  setTimeout(() => document.getElementById('m_docno_input').focus(), 100);
}

// ── ฟังก์ชันปิด Modal เลขที่หนังสือ ──
function closeDocNoModal() {
  document.getElementById('docNoModal').classList.remove('open');
  document.getElementById('m_docno_input').value = '';
}

// ── ฟังก์ชันบันทึกข้อมูลเลขที่หนังสือจาก Modal ──
function saveDocNo() {
  const id = Number(document.getElementById('m_docno_id').value);
  const newDocNo = document.getElementById('m_docno_input').value.trim();
  
  const r = records.find(x => x.id === id);
  if (r) {
      r.docno = newDocNo;
      saveStorage();   // บันทึกลงฐานข้อมูลเบราว์เซอร์
      renderRecords(); // วาดตารางใหม่ให้เป็นปัจจุบัน
  }
  closeDocNoModal();   // ปิดตู้ Modal หน้าต่างควบคุม
}

// ── โหลดเอกสารกลับไปแก้ไขที่หน้า Form หลัก ──
function loadRecord(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  document.getElementById('f_from').value = r.from || '';
  document.getElementById('f_to').value = r.to || '';
  document.getElementById('f_docno').value = r.docno || '';
  document.getElementById('f_date').value = r.date || '';
  document.getElementById('f_body').value = r.body || '';
  document.getElementById('f_body').dataset.userEdited = '1';
  document.getElementById('f_signer').value = r.signer || '';
  document.getElementById('f_subposition').value = r.subposition || '';
  document.getElementById('f_mainposition').value = r.mainposition || '';
  
  document.getElementById('itemBody').innerHTML = '';
  rowCount = 0;
  
  (r.rows || []).forEach(row => {
    addRow();
    document.getElementById('code-' + rowCount).value = row.code || '';
    document.getElementById('desc-' + rowCount).value = row.desc || '';
    document.getElementById('batch-' + rowCount).value = row.batch || 'N';
    document.getElementById('qty-' + rowCount).value = row.qty || '';
    document.getElementById('donor-' + rowCount).value = row.donor || '';
    document.getElementById('location-' + rowCount).value = row.location || '';
  });
  showPage('form'); // ส่งกลับไปหน้าจอแรก
}

// ── ลบเอกสารออกจากระบบประวัติ ──
function deleteRecord(id) {
  if (!confirm('ยืนยันการลบเอกสารนี้? ไม่สามารถกู้คืนได้')) return;
  records = records.filter(r => r.id !== id);
  saveStorage();
  renderRecords();
}