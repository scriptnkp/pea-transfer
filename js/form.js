let rowCount = 0;
const acResults = {}; 
const acSel = {};

// ── Form Sync ──
function syncFromField() {
  const val = document.getElementById('f_from').value;
  const body = document.getElementById('f_body');
  if (!body.dataset.userEdited) {
    body.value = `ด้วย ${val} ขออนุมัติโอนพัสดุ-อุปกรณ์ เพื่อใช้งานผู้ใช้ไฟและงบโครงการ ของ ${val}\nเนื่องจากพัสดุคงคลังขาดแคลน เพื่อให้งานแล้วเสร็จทันตามเป้าหมายแผนงานและเป็นการบริการผู้ใช้ไฟตามมาตรฐานคุณภาพบริการ ของ ${val}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('f_body').addEventListener('input', function () { this.dataset.userEdited = '1'; });
});

// ── Table Management ──
function addRow() {
  rowCount++;
  const tbody = document.getElementById('itemBody');
  const tr = document.createElement('tr');
  tr.id = 'row-' + rowCount;
  tr.innerHTML = `
    <td style="text-align:center;">${tbody.children.length + 1}</td>
    <td>
      <div class="ac-wrap">
        <input type="text" placeholder="รหัสพัสดุ" id="code-${rowCount}" oninput="acCode(${rowCount},this.value)" onkeydown="acNavKey(event,${rowCount},'code')" autocomplete="off" style="min-width:130px;">
        <div class="ac-list" id="acCode-${rowCount}" style="display:none;"></div>
      </div>
    </td>
    <td>
      <div class="ac-wrap">
        <input type="text" placeholder="รายการพัสดุ" id="desc-${rowCount}" oninput="acDesc(${rowCount},this.value)" onkeydown="acNavKey(event,${rowCount},'desc')" autocomplete="off" style="min-width:200px;">
        <div class="ac-list" id="acDesc-${rowCount}" style="display:none;"></div>
      </div>
    </td>
    <td><input type="text" id="batch-${rowCount}" value="N" style="width:50px;text-align:center;"></td>
    <td><input type="number" id="qty-${rowCount}" value="1" min="1" style="width:70px;text-align:center;"></td>
    <td><input type="text" id="donor-${rowCount}" placeholder="กฟจ.นครพนม (D060)0021" style="min-width:160px;"></td>
    <td><input type="text" id="location-${rowCount}" placeholder="คลังกลาง / ชั้น 2" style="min-width:130px;"></td>
    <td><button class="btn-icon" onclick="removeRow(${rowCount})" title="ลบ">🗑</button></td>
  `;
  tbody.appendChild(tr);
  renumberRows();
}

function removeRow(id) {
  const el = document.getElementById('row-' + id);
  if (el) el.remove();
  renumberRows();
}

function renumberRows() {
  document.querySelectorAll('#itemBody tr').forEach((tr, i) => {
    tr.cells[0].textContent = i + 1;
  });
}

// ── Autocomplete ──
function renderAcList(listEl, results, id, type) {
  acResults[id + type] = results;
  acSel[id + type] = 0;
  listEl.innerHTML = results.map((x, i) => `
    <div class="ac-item${i === 0 ? ' selected' : ''}" data-idx="${i}" data-type="${type}" data-id="${id}">
      <div>${type === 'code' ? x.code : x.desc.substring(0, 70)}</div>
      <div class="ac-code">${type === 'code' ? x.desc.substring(0, 60) : x.code}</div>
    </div>`).join('');
  listEl.style.display = 'block';
}

function acCode(id, val) {
  const list = document.getElementById('acCode-' + id);
  if (!val || val.length < 2) { list.style.display = 'none'; return; }
  const v = val.toLowerCase();
  const results = mb52Data.filter(x => x.code.toLowerCase().includes(v)).slice(0, 10);
  if (!results.length) { list.style.display = 'none'; return; }
  renderAcList(list, results, id, 'code');
}

function acDesc(id, val) {
  const list = document.getElementById('acDesc-' + id);
  if (!val || val.length < 2) { list.style.display = 'none'; return; }
  const v = val.toLowerCase();
  const results = mb52Data.filter(x => x.desc.toLowerCase().includes(v)).slice(0, 10);
  if (!results.length) { list.style.display = 'none'; return; }
  renderAcList(list, results, id, 'desc');
}

function selectCode(id, code, desc) {
  document.getElementById('code-' + id).value = code;
  document.getElementById('desc-' + id).value = desc;
  document.getElementById('acCode-' + id).style.display = 'none';
  document.getElementById('acDesc-' + id).style.display = 'none';
  const b = document.getElementById('batch-' + id);
  if (b) b.focus();
}

function acNavKey(e, id, type) {
  const key = e.key;
  const listEl = document.getElementById('ac' + type.charAt(0).toUpperCase() + type.slice(1) + '-' + id);
  const results = acResults[id + type];
  if (!results || !results.length || listEl.style.display === 'none') return;
  let sel = acSel[id + type] || 0;
  if (key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); }
  else if (key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); }
  else if (key === 'Enter' || key === 'Tab') {
    e.preventDefault();
    selectCode(id, results[sel].code, results[sel].desc);
    return;
  } else if (key === 'Escape') { listEl.style.display = 'none'; return; }
  else return;
  
  acSel[id + type] = sel;
  listEl.querySelectorAll('.ac-item').forEach((el, i) => el.classList.toggle('selected', i === sel));
  listEl.querySelectorAll('.ac-item')[sel]?.scrollIntoView({ block: 'nearest' });
}

document.addEventListener('mousedown', e => {
  const item = e.target.closest('.ac-item');
  if (item) {
    e.preventDefault();
    const id = item.dataset.id;
    const idx = parseInt(item.dataset.idx);
    const type = item.dataset.type;
    const results = acResults[id + type];
    if (results && results[idx]) selectCode(id, results[idx].code, results[idx].desc);
    return;
  }
  document.querySelectorAll('.ac-list').forEach(l => {
    if (!l.contains(e.target)) l.style.display = 'none';
  });
});

// ── Get Data ──
function getFormData() {
  const rows = [];
  document.querySelectorAll('#itemBody tr').forEach(tr => {
    const inputs = tr.querySelectorAll('input');
    if(inputs[0]?.value || inputs[1]?.value) {
        rows.push({
            code: inputs[0]?.value || '',
            desc: inputs[1]?.value || '',
            batch: inputs[2]?.value || 'N',
            qty: inputs[3]?.value || 1,
            donor: inputs[4]?.value || '',
            location: inputs[5]?.value || '',
        });
    }
  });
  return {
    from: document.getElementById('f_from').value,
    to: document.getElementById('f_to').value,
    attention: document.getElementById('f_attention').value, // ดึงค่าช่องเรียน
    docno: document.getElementById('f_docno').value || '-', 
    date: document.getElementById('f_date').value,
    body: document.getElementById('f_body').value,
    signer: document.getElementById('f_signer').value,
    subposition: document.getElementById('f_subposition').value,
    mainposition: document.getElementById('f_mainposition').value,
    rows,
  };
}

// ── Save Record to Database (Supabase) ──
async function saveRecordToDB() {
  const data = getFormData();
  if (!data.from) { alert('กรุณากรอกหน่วยงานต้นทาง "จาก"'); return; }
  
  const btn = document.getElementById('btnSave');
  const originalText = btn.textContent;
  btn.textContent = '⏳ กำลังบันทึก...';
  btn.disabled = true;

  try {
      const { data: insertedDoc, error: docError } = await supabaseClient
          .from('documents')
          .insert([{
              doc_no: data.docno,
              from_unit: data.from,
              to_unit: data.to,
              attention_to: data.attention, // เก็บค่าเรียนลงฐานข้อมูล
              doc_date: data.date,
              body_text: data.body,
              signer_name: data.signer,
              sub_position: data.subposition,
              main_position: data.mainposition
          }])
          .select('id')
          .single();

      if (docError) throw docError;

      if (data.rows.length > 0) {
          const itemsToInsert = data.rows.map(item => ({
              document_id: insertedDoc.id,
              item_code: item.code,
              item_desc: item.desc,
              batch: item.batch,
              qty: parseInt(item.qty) || 1,
              donor_unit: item.donor,
              storage_location: item.location
          }));

          const { error: itemError } = await supabaseClient.from('document_items').insert(itemsToInsert);
          if (itemError) throw itemError;
      }

      alert('บันทึกข้อมูลลงระบบเรียบร้อยแล้ว!');
      clearForm();
      
      await fetchRecordsFromDB();

  } catch (err) {
      console.error("Save Error:", err);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
  } finally {
      btn.textContent = originalText;
      btn.disabled = false;
  }
}

function clearForm() {
  document.getElementById('f_from').value = settings.defaultFrom || '';
  document.getElementById('f_to').value = settings.defaultTo || 'กบพ.ฉ.1';
  document.getElementById('f_attention').value = 'อก.บพ.ฉ.1'; // คืนค่าเริ่มต้นช่องเรียน
  document.getElementById('f_docno').value = '';
  document.getElementById('f_date').value = new Date().toISOString().split('T')[0];
  document.getElementById('f_body').value = '';
  document.getElementById('f_body').dataset.userEdited = '';
  document.getElementById('f_signer').value = '';
  document.getElementById('f_subposition').value = '';
  document.getElementById('f_mainposition').value = '';
  document.getElementById('itemBody').innerHTML = '';
  rowCount = 0;
  addRow();
}

// ── PDF Creation ──
function buildPDFHtml(data) {
  const logo = settings.logo ? `<img src="${settings.logo}" class="pdf-logo" alt="logo">` : '';
  const rows = data.rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.code}</td>
      <td class="col-desc">${r.desc}</td>
      <td>${r.batch}</td>
      <td>${r.qty}</td>
      <td>${r.donor}</td>
      <td>${r.location}</td>
    </tr>`).join('');

  const bodyParagraphs = `<div class="pdf-body">${data.body.replace(/\n/g, '<br>')}</div>`;
  const subPosHtml = data.subposition ? `<div>${data.subposition}</div>` : '';

  return `
  <div class="pdf-page" id="pdfPageEl">
    <div class="pdf-header">
      ${logo}
    </div>
    <div class="pdf-meta">
      <span>จาก</span><span class="val">${data.from}</span>
      <span>ถึง</span><span class="val">${data.to}</span>
      <span>เลขที่</span><span class="val">${data.docno === '-' ? '' : data.docno}</span>
      <span>วันที่</span><span class="val">${formatThaiDate(data.date)}</span>
      <span>เรื่อง</span><span class="val" style="grid-column:2/5;">ขออนุมัติโอนพัสดุ-อุปกรณ์</span>
      <span>เรียน</span><span class="val" style="grid-column:2/5;">${data.attention}</span>
    </div>
    ${bodyParagraphs}
    <div class="pdf-body">ดังนั้น ผคพ. ${data.from} จึงขอโอนพัสดุ-อุปกรณ์ และได้ติดต่อประสานงาน กับ คลังปลายทาง เรียบร้อย โดย ${data.from} จะเป็นผู้ดำเนิน การขนส่งเอง ดังรายการต่อไปนี้</div>
    <table class="pdf-table">
      <thead>
        <tr>
          <th>ที่</th><th>รหัสพัสดุ</th><th>รายการ</th><th>แบทช์</th><th>จำนวน</th><th>ผู้ให้โอน</th><th>ที่จัดเก็บ</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="pdf-body">จึงเรียนมาเพื่อโปรดพิจารณาแจ้งส่วนเกี่ยวข้องดำเนินการต่อไป</div>
    <div class="pdf-sig">
      <div style="margin-bottom:40px;"></div>
      <div class="sig-name">(${data.signer})</div>
      ${subPosHtml}
      <div>${data.mainposition}</div>
    </div>
  </div>`;
}

function previewPDF() {
  const data = getFormData();
  const html = buildPDFHtml(data);
  document.getElementById('pdfPreviewWrap').innerHTML = html;
  document.getElementById('pdfModal').classList.add('open');
}

function closePdfModal() {
  document.getElementById('pdfModal').classList.remove('open');
}

async function exportPDF() {
  const data = getFormData();
  const html = buildPDFHtml(data);
  
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
  container.innerHTML = `
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    
    .pdf-page{width:794px;min-height:1123px;background:#fff;padding:60px 72px;font-family:'Sarabun',sans-serif;font-size:14px;color:#000;position:relative;margin:0 auto;}
    .pdf-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}
    .pdf-logo{height:90px;object-fit:contain;}
    .pdf-meta{display:grid;grid-template-columns:45px 300px 45px 1fr;gap:4px 12px;margin-bottom:16px;align-items:baseline;}
    .pdf-meta span{font-size:13px;}.pdf-meta .val{min-width:120px;padding-bottom:1px;}
    .pdf-body{font-size:14px;line-height:2;margin-top: 8px; margin-bottom: 0; text-indent: 40px;}
    .pdf-table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px;}
    .pdf-table th,.pdf-table td{border:1px solid #000;padding:6px 8px;text-align:center;}
    .pdf-table th{background:#fff; color:#000;}
    
    .pdf-table td:nth-child(2) { white-space: nowrap; width: 1%; padding-left: 10px; padding-right: 10px;}
    .pdf-table td.col-desc { text-align: left; word-break: break-word; white-space: normal; }
    
    .pdf-sig{margin-top:50px;text-align:center;}
    .pdf-sig .sig-name { margin-bottom: 5px; }
    </style>
    ${html}
  `;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.querySelector('.pdf-page'), { scale: 2, useCORS: true, backgroundColor: '#fff' });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h);
    pdf.save(`โอนพัสดุ_${data.docno === '-' ? 'เอกสาร' : data.docno}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}