// ── Dashboard Overview ──
function renderDashboard() {
    // 1. ดึงค่า Filter ปัจจุบัน
    const sd = document.getElementById('d_startDate').value;
    const ed = document.getElementById('d_endDate').value;
    const fromSelect = document.getElementById('d_fromFilter');
    const fFrom = fromSelect.value;
    const q = document.getElementById('d_search').value.toLowerCase();

    // 2. สร้างตัวเลือก Dropdown "จาก" แบบ Dynamic
    const uniqueFroms = [...new Set(records.map(r => r.from).filter(Boolean))].sort();
    let fromHtml = '<option value="">-- ทั้งหมด --</option>';
    uniqueFroms.forEach(f => {
        fromHtml += `<option value="${f}">${f}</option>`;
    });
    // ป้องกันการกระพริบของ Dropdown หากตัวเลือกไม่เปลี่ยน
    if (fromSelect.innerHTML !== fromHtml) {
        fromSelect.innerHTML = fromHtml;
        fromSelect.value = fFrom; // เก็บค่าที่เคยเลือกไว้
    }

    // 3. กรองเอกสาร (Records) ตามวันที่ และ จาก
    let filteredRecords = records;
    if (sd) filteredRecords = filteredRecords.filter(r => r.date >= sd);
    if (ed) filteredRecords = filteredRecords.filter(r => r.date <= ed);
    if (fFrom) filteredRecords = filteredRecords.filter(r => r.from === fFrom);

    // 4. ดึงรายการพัสดุ (Rows) แล้วกรองตาม Text ค้นหา
    let allRows = filteredRecords.flatMap(r => (r.rows || []).map(row => ({ ...row, from: r.from, to: r.to, date: r.date })));
    if (q) {
        allRows = allRows.filter(r =>
            (r.code || '').toLowerCase().includes(q) ||
            (r.desc || '').toLowerCase().includes(q)
        );
    }
    const totalItems = allRows.reduce((s, r) => s + Number(r.qty || 0), 0);

    // Stats
    const byDest = {};
    filteredRecords.forEach(r => {
        const k = r.to || 'ไม่ระบุ';
        byDest[k] = (byDest[k] || 0) + 1;
    });

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card"><div class="stat-icon blue">📄</div><div class="stat-info"><div class="num">${filteredRecords.length}</div><div class="lbl">เอกสารทั้งหมด</div></div></div>
      <div class="stat-card"><div class="stat-icon green">📦</div><div class="stat-info"><div class="num">${allRows.length}</div><div class="lbl">รายการพัสดุ</div></div></div>
      <div class="stat-card"><div class="stat-icon orange">🔢</div><div class="stat-info"><div class="num">${totalItems}</div><div class="lbl">จำนวนรวมทั้งหมด</div></div></div>
      <div class="stat-card"><div class="stat-icon purple">🏢</div><div class="stat-info"><div class="num">${Object.keys(byDest).length}</div><div class="lbl">หน่วยงานที่รับโอน</div></div></div>
    `;

    // Aggregate Data for Charts
    const byFrom = {}; const byDonor = {}; const byDate = {};
    allRows.forEach(r => {
        const f = r.from || 'ไม่ระบุ'; byFrom[f] = (byFrom[f] || 0) + 1;
        const d = r.donor || 'ไม่ระบุ'; byDonor[d] = (byDonor[d] || 0) + 1;
        const dt = r.date || 'ไม่ระบุ'; byDate[dt] = (byDate[dt] || 0) + 1;
    });

    // Helper Function for Bar Chart Rendering
    function renderBarChart(dataObj, elId) {
        const entries = Object.entries(dataObj).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const max = entries.reduce((m, e) => Math.max(m, e[1]), 1);
        document.getElementById(elId).innerHTML = entries.map(([k, v]) => `
        <div class="bar-col">
          <div class="bar-val">${v}</div>
          <div class="bar" style="height:${Math.round((v / max) * 90)}px;" title="${k}: ${v}"></div>
          <div class="bar-label" title="${k}">${k.length > 8 ? k.substring(0, 8) + '…' : k}</div>
        </div>`).join('') || '<div style="width:100%;text-align:center;color:#718096;font-size:12px;align-self:center;">ไม่มีข้อมูล</div>';
    }

    // Helper Function for SVG Line Chart (แนวโน้มรายวัน)
    function renderLineChart(dataObj, elId) {
        const entries = Object.entries(dataObj).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        const container = document.getElementById(elId);
        
        if (entries.length === 0) {
            container.innerHTML = '<div style="width:100%; height:90px; display:flex; align-items:center; justify-content:center; color:#718096; font-size:12px;">ไม่มีข้อมูล</div>';
            return;
        }

        const w = container.clientWidth || 250;
        const h = 90;
        const maxVal = Math.max(...entries.map(e => e[1]), 1);

        // คำนวณพิกัดจุดสำหรับเส้นกราฟ
        let points = entries.map((e, i) => {
            const x = entries.length > 1 ? (i / (entries.length - 1)) * (w - 20) + 10 : w / 2;
            const y = h - (e[1] / maxVal) * (h - 20) - 10;
            return `${x},${y}`;
        }).join(' ');

        // วันที่ด้านล่างกราฟ
        let labels = entries.map((e, i) => {
            if (entries.length > 5 && i % Math.ceil(entries.length / 5) !== 0 && i !== entries.length - 1) return ''; // ซ่อนป้ายชื่อถ้าเยอะเกินไป
            const x = entries.length > 1 ? (i / (entries.length - 1)) * 100 : 50;
            const d = new Date(e[0]);
            const label = !isNaN(d) ? `${d.getDate()}/${d.getMonth() + 1}` : e[0];
            return `<div style="position:absolute; left:calc(${x}%); transform:translateX(-50%); bottom:-18px; font-size:10px; color:#718096; white-space:nowrap;">${label}</div>`;
        }).join('');

        const svg = `
        <div style="position:relative; width:100%; height:${h}px; margin-bottom:20px;">
            <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%; height:100%; overflow:visible;">
                <polyline points="${points}" fill="none" stroke="#3182ce" stroke-width="2" />
                ${entries.map((e, i) => {
                    const x = entries.length > 1 ? (i / (entries.length - 1)) * (w - 20) + 10 : w / 2;
                    const y = h - (e[1] / maxVal) * (h - 20) - 10;
                    return `<circle cx="${x}" cy="${y}" r="4" fill="#3182ce"><title>วันที่ ${e[0]}: ${e[1]} รายการ</title></circle>`;
                }).join('')}
            </svg>
            ${labels}
        </div>`;
        container.innerHTML = svg;
    }

    // Render Charts
    renderBarChart(byFrom, 'chartBarFrom');
    renderLineChart(byDate, 'chartLineTrend');
    renderBarChart(byDonor, 'chartBarDonor');

    // Top items
    const itemCount = {}; const itemQty = {};
    allRows.forEach(r => {
        const k = r.desc || r.code || 'ไม่ระบุ';
        itemCount[k] = (itemCount[k] || 0) + 1;
        itemQty[k] = (itemQty[k] || 0) + Number(r.qty || 0);
    });
    const topItems = Object.entries(itemCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
    document.getElementById('topItemsBody').innerHTML = topItems.map(([k, v]) => `
      <tr><td>${k.length > 60 ? k.substring(0, 60) + '…' : k}</td><td style="text-align:center;">${v}</td><td style="text-align:center;">${itemQty[k] || 0}</td></tr>`).join('') || '<tr><td colspan="3" style="text-align:center;color:#718096;">ไม่มีข้อมูล</td></tr>';

    // Detail table (Aligned td tags)
    document.getElementById('dashDetailBody').innerHTML = allRows.map(r => `
      <tr>
        <td style="text-align:center;">${formatThaiDate(r.date)}</td>
        <td>${r.from || '-'}</td>
        <td>${r.to || '-'}</td>
        <td style="text-align:center;">${r.code || '-'}</td>
        <td>${r.desc || '-'}</td>
        <td style="text-align:center;">${r.qty || '-'}</td>
        <td>${r.donor || '-'}</td>
        <td>${r.location || '-'}</td>
      </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#718096;">ไม่มีข้อมูล</td></tr>';
}

// ผูก Event รีเฟรชขนาดกราฟเวลาผู้ใช้ย่อ/ขยายขนาดหน้าต่างเบราว์เซอร์
window.addEventListener('resize', () => {
    if (document.getElementById('page-dashboard').style.display !== 'none') {
        renderDashboard();
    }
});