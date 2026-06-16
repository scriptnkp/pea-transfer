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
  
  tbody.innerHTML = filtered.map((r, i) => `
    <tr>
      <td style="text-align:center;">${i + 1}</td>
      <td style="text-align:center;">${formatThaiDate(r.date)}</td>
      <td style="text-align:left;">${r.docno === '-' ? '' : r.docno}</td>
      <td style="text-align:left;">${r.from || '-'}</td>
      <td style="text-align:left;">${r.to || '-'}</td>
      <td style="text-align:left;">${(r.rows || []).length} รายการ</td>
      <td style="text-align:center;">
        <div style="display:flex; gap:6px; justify-content:center;">
            <button class="btn btn-outline btn-sm" onclick="updateDocNo(${r.id})" title="ระบุเลขที่เอกสาร">📝 เลขที่</button>
            <button class="btn btn-outline btn-sm" onclick="loadRecord(${r.id})" title="ดูข้อมูล">📋 ดู</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRecordFromDB(${r.id})" title="ลบเอกสาร">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

function updateDocNo(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  
  document.getElementById('m_docno_input').value = r.docno === '-' ? '' : r.docno;
  document.getElementById('m_docno_id').value = id;
  
  document.getElementById('docNoModal').classList.add('open');
  setTimeout(() => document.getElementById('m_docno_input').focus(), 100);
}

function closeDocNoModal() {
  document.getElementById('docNoModal').classList.remove('open');
  document.getElementById('m_docno_input').value = '';
}

async function saveDocNoDB() {
  const id = Number(document.getElementById('m_docno_id').value);
  const newDocNo = document.getElementById('m_docno_input').value.trim() || '-';
  
  const r = records.find(x => x.id === id);
  if (!r) return;

  try {
      // ใช้ supabaseClient
      const { error } = await supabaseClient
          .from('documents')
          .update({ doc_no: newDocNo })
          .eq('id', id);

      if (error) throw error;

      r.docno = newDocNo;
      renderRecords();
      closeDocNoModal();

  } catch (err) {
      console.error("Update Error:", err);
      alert('แก้ไขเลขที่ไม่สำเร็จ: ' + err.message);
  }
}

function loadRecord(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  document.getElementById('f_from').value = r.from || '';
  document.getElementById('f_to').value = r.to || '';
  document.getElementById('f_docno').value = r.docno === '-' ? '' : r.docno;
  document.getElementById('f_date').value = r.date || '';
  document.getElementById('f_body').value = r.body || '';
  document.getElementById('f_body').dataset.userEdited = '1';
  document.getElementById('f_signer').value = r.signer || '';
  document.getElementById('f_subposition').value = r.subposition || '';
  document.getElementById('f_mainposition').value = r.mainposition || '';
  
  document.getElementById('itemBody').innerHTML = '';
  rowCount = 0;
  
  if(r.rows && r.rows.length > 0) {
      r.rows.forEach(row => {
        addRow();
        document.getElementById('code-' + rowCount).value = row.code || '';
        document.getElementById('desc-' + rowCount).value = row.desc || '';
        document.getElementById('batch-' + rowCount).value = row.batch || 'N';
        document.getElementById('qty-' + rowCount).value = row.qty || '';
        document.getElementById('donor-' + rowCount).value = row.donor || '';
        document.getElementById('location-' + rowCount).value = row.location || '';
      });
  } else {
      addRow();
  }
  showPage('form');
}

async function deleteRecordFromDB(id) {
  if (!confirm('ยืนยันการลบเอกสารนี้ออกจากระบบ? ไม่สามารถกู้คืนได้')) return;
  
  try {
      // ใช้ supabaseClient
      const { error } = await supabaseClient
          .from('documents')
          .delete()
          .eq('id', id);

      if (error) throw error;

      records = records.filter(r => r.id !== id);
      renderRecords();

  } catch (err) {
      console.error("Delete Error:", err);
      alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
  }
}