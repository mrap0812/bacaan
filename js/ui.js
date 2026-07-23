/* ================================================================
   RENDERING & UI FUNCTIONS
   ================================================================ */

/* ---------- MAIN DISPATCHER ---------- */
function render(){
  const el=document.getElementById('view');
  let html='';
  
  if(ui.view==='library') renderLibrary();
  else if(ui.view==='planner') renderPlanner();
  else if(ui.view==='review') renderReview();
  else if(ui.view==='stats') renderStats();
  else if(ui.view==='method') renderMethod();
  else if(ui.view==='detail') renderDetail();
}

/* ---------- LIBRARY view ---------- */
function renderLibrary(){
  const el=document.getElementById('view');
  let list=state.books.filter(b=>{
    const q=(ui.search||'').toLowerCase();
    const matchSearch=!q||b.title.toLowerCase().includes(q)||b.author.toLowerCase().includes(q)||(b.tags||[]).some(t=>t.toLowerCase().includes(q));
    const matchFilter=ui.filter==='all'||b.status===ui.filter;
    const matchTag=!ui.tag||b.tags.includes(ui.tag);
    return matchSearch&&matchFilter&&matchTag;
  });
  
  const sorters={
    active:(a,b)=>{const o={reading:0,want:1,paused:2,finished:3};return o[a.status]-o[b.status]||new Date(b.createdAt)-new Date(a.createdAt);},
    recent:(a,b)=>new Date(b.createdAt)-new Date(a.createdAt),
    title:(a,b)=>a.title.localeCompare(b.title),
    progress:(a,b)=>((b.totalPages?b.currentPage/b.totalPages:0)-(a.totalPages?a.currentPage/a.totalPages:0))
  };
  list.sort(sorters[ui.sort]||sorters.active);

  let html=`
    <div class="section-head">
      <div><h2>Perpustakaan <span class="pill-count">${state.books.length} buku</span></h2>
      <p class="sub">Riwayat bacaan Anda — dari yang diminati hingga yang sudah dikuasai tuntas.</p></div>
    </div>
    ${backupNudgeHTML()}
    <div class="lib-controls">
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="searchInput" placeholder="Cari judul atau penulis…" value="${escAttr(ui.search)}">
      </div>
      <button class="filter-pill ${ui.filter==='all'?'active':''}" data-filter="all">Semua</button>
      <button class="filter-pill ${ui.filter==='reading'?'active':''}" data-filter="reading">Dibaca</button>
      <button class="filter-pill ${ui.filter==='want'?'active':''}" data-filter="want">Ingin</button>
      <button class="filter-pill ${ui.filter==='finished'?'active':''}" data-filter="finished">Selesai</button>
      <select class="sort-select" id="sortSel">
        <option value="active" ${ui.sort==='active'?'selected':''}>Urut: Aktif dulu</option>
        <option value="recent" ${ui.sort==='recent'?'selected':''}>Urut: Terbaru</option>
        <option value="title" ${ui.sort==='title'?'selected':''}>Urut: Judul A–Z</option>
        <option value="progress" ${ui.sort==='progress'?'selected':''}>Urut: Kemajuan</option>
      </select>
    </div>
    ${(()=>{const tags=allTags();return tags.length?`<div class="tag-row"><span class="tag-row-lab">Tag:</span>${ui.tag?`<button class="tag-chip active" data-tag="">✕ ${esc(ui.tag)}</button>`:''}${tags.filter(t=>t!==ui.tag).map(t=>`<button class="tag-chip" data-tag="${escAttr(t)}">${esc(t)}</button>`).join('')}</div>`:'';})()}`;

  if(state.books.length===0){
    html+=`<div class="empty-state">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
      <div class="big">Rak Anda masih kosong</div>
      <p>Tambahkan buku pertama — cari otomatis lewat Open Library, atau isi manual.</p>
      <div style="margin-top:18px"><button class="btn btn-primary" onclick="openBookForm()">Tambah Buku Pertama</button></div>
    </div>`;
  } else if(list.length===0){
    html+=`<div class="empty-state"><div class="big">Tidak ada yang cocok</div><p>Coba ubah pencarian atau filter.</p></div>`;
  } else {
    html+=`<div class="book-grid">`;
    list.forEach(b=>{
      const p=PURPOSE[b.purpose],s=STATUS[b.status];
      const pct=b.totalPages>0?Math.min(100,Math.round(b.currentPage/b.totalPages*100)):(b.status==='finished'?100:0);
      const due=bookDueCount(b);
      html+=`<div class="book-card" onclick="openBook('${b.id}')">
        <div class="card-top">
          ${coverHTML(b,'book-cover')}
          <div class="card-info">
            <div class="meta-row"><span class="badge ${s.badge}">${s.label}</span>${due>0?`<span class="badge badge-due">${due}★</span>`:''}</div>
            <h3>${esc(b.title)}</h3>
            <div class="author">${b.author?esc(b.author):'<span class="muted">Tanpa penulis</span>'}</div>
            <span class="badge ${p.badge}">${p.label}</span>
          </div>
        </div>
        <div class="card-body">
          ${b.totalPages>0?`
            <div class="prog-label"><span>${b.currentPage}/${b.totalPages} hlm</span><span>${pct}%</span></div>
            <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
          `:`<div class="prog-label"><span class="muted">tanpa hitungan halaman</span></div>`}
          <div class="card-stats">
            <span title="catatan">✎ ${b.notes.length}</span>
            <span title="kartu ingatan">★ ${b.reviews.length}</span>
            <span title="kutipan">❝ ${b.quotes.length}</span>
          </div>
          ${b.tags&&b.tags.length?`<div class="card-tags">${b.tags.slice(0,3).map(t=>`<span class="card-tag">${esc(t)}</span>`).join('')}</div>`:''}
        </div>
      </div>`;
    });
    html+=`</div>`;
  }
  el.innerHTML=html;
  const si=document.getElementById('searchInput');
  if(si) si.oninput=e=>{ui.search=e.target.value;renderLibrary();const n=document.getElementById('searchInput');if(n){n.focus();const v=n.value;n.setSelectionRange(v.length,v.length);}};
  const ss=document.getElementById('sortSel'); if(ss) ss.onchange=e=>{ui.sort=e.target.value;renderLibrary();};
  el.querySelectorAll('.filter-pill').forEach(p=>p.onclick=()=>{ui.filter=p.dataset.filter;renderLibrary();});
  el.querySelectorAll('.tag-chip').forEach(c=>c.onclick=()=>{ui.tag=c.dataset.tag;renderLibrary();});
}

/* ---------- PLANNER ---------- */
function renderPlanner(){
  const el=document.getElementById('view');
  const goalMode=state.settings.dailyGoalMode;
  const goal=goalMode==='pages'?state.settings.dailyGoalPages:state.settings.dailyGoalMinutes||30;
  const done=goalMode==='pages'?pagesToday():minutesToday();
  const unit=goalMode==='pages'?'halaman':'menit';
  const pct=goal>0?Math.min(100,Math.round(done/goal*100)):0;
  const streak=currentStreak();
  const active=state.books.filter(b=>b.status==='reading');

  // week totals
  let weekPages=0,weekMin=0;
  for(let i=0;i<7;i++){ const d=new Date(); d.setDate(d.getDate()-i); const e=state.log[dayKey(d)]; if(e){weekPages+=e.pages;weekMin+=e.minutes;} }

  let html=`
    <div class="section-head">
      <div><h2>Planner</h2>
      <p class="sub">Target harian yang konsisten mengalahkan ledakan sesekali. Membaca lambat tapi rutin memindahkan pemahaman ke ingatan jangka panjang.</p></div>
      <button class="btn btn-ghost btn-sm" onclick="openGoalSettings()">Atur target</button>
    </div>

    <div class="today-goal">
      <div class="tg-lab">Target hari ini</div>
      <div class="tg-main">${done} / ${goal} ${unit}</div>
      <div style="font-size:13px;opacity:.9">${pct>=100?'✓ Target tercapai. Momentum terjaga.':`${goal-done} ${unit} lagi menuju target`}</div>
      <div class="tg-bar"><div class="tg-fill" style="width:${pct}%"></div></div>
      <div class="log-session">
        <span style="font-size:13px;opacity:.9">Catat sesi:</span>
        <input type="number" id="logPages" placeholder="halaman" min="0">
        <input type="number" id="logMin" placeholder="menit" min="0">
        <select id="logBook">
          <option value="">— tanpa buku —</option>
          ${active.map(b=>`<option value="${b.id}">${esc(b.title)}</option>`).join('')}
        </select>
        <button class="btn" style="background:#fff;color:var(--indigo)" onclick="submitLog()">Simpan</button>
      </div>
    </div>

    ${timerCardHTML(active)}

    <div class="plan-hero">
      ${planRing(pct, done, unit, 'Hari ini')}
      ${planRing(streak>0?Math.min(100,streak/7*100):0, streak, 'hari', 'Streak', '🔥')}
      ${planStat(weekPages,'halaman minggu ini')}
      ${planStat(weekMin,'menit minggu ini')}
    </div>
  `;

  // per-book pacing
  if(active.length>0){
    html+=`<div class="chart-panel"><h3>Buku aktif & laju</h3><p class="csub">Perkiraan berdasarkan target dan sisa halaman.</p>`;
    active.forEach(b=>{
      const remain=b.totalPages>0?Math.max(0,b.totalPages-b.currentPage):0;
      const pct2=b.totalPages>0?Math.round(b.currentPage/b.totalPages*100):0;
      let pace='';
      if(b.deadline && b.totalPages>0){
        const daysLeft=Math.max(1,daysBetween(todayISO(),b.deadline));
        const needPerDay=Math.ceil(remain/daysLeft);
        const overdue=new Date(b.deadline)<new Date(todayISO());
        pace=overdue?`<span style="color:var(--red)">lewat tenggat ${fmtShort(b.deadline)}</span>`
             :`perlu <strong>${needPerDay} hlm/hari</strong> · sisa ${daysLeft} hari (${fmtShort(b.deadline)})`;
      } else if(b.pagesPerDay>0 && b.totalPages>0){
        const daysNeed=Math.ceil(remain/b.pagesPerDay);
        pace=`~${daysNeed} hari lagi @ ${b.pagesPerDay} hlm/hari`;
      } else if(b.totalPages>0){
        pace=`<span class="muted">sisa ${remain} hlm · belum ada target laju</span>`;
      } else {
        pace=`<span class="muted">tanpa hitungan halaman</span>`;
      }
      html+=`<div class="goal-book-row">
        ${coverHTML(b,'book-cover')}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(b.title)}</div>
          <div style="font-size:12.5px;color:var(--ink-soft);margin-top:2px">${pace}</div>
          ${b.totalPages>0?`<div class="prog-bar" style="margin-top:6px"><div class="prog-fill" style="width:${pct2}%"></div></div>`:''}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="openBook('${b.id}')">Buka</button>
      </div>`;
    });
    html+=`</div>`;
  } else {
    html+=`<div class="empty-state" style="padding:40px 20px"><p>Belum ada buku berstatus "sedang dibaca". Tandai sebuah buku sebagai sedang dibaca untuk melihat laju & targetnya di sini.</p></div>`;
  }

  el.innerHTML=html;
  wireTimer(active); ensureTimerTicking();
}

function planRing(pct,val,unit,label,emoji){
  const r=48,c=2*Math.PI*r,off=c-(pct/100)*c;
  return `<div class="plan-card"><div class="plan-ring">
    <svg width="110" height="110"><circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--paper-sunk)" stroke-width="9"/>
    <circle cx="55" cy="55" r="${r}" fill="none" stroke="var(--indigo)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .6s var(--ease)"/></svg>
    <div class="rt"><div class="rn">${emoji?emoji+' ':''}${val}</div><div class="rl">${unit}</div></div>
  </div><div class="plan-title">${label}</div></div>`;
}

function planStat(val,label){
  return `<div class="plan-card" style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center"><div style="font-family:var(--serif);font-size:38px;font-weight:600;color:var(--indigo)">${val}</div><div class="plan-title" style="margin-top:6px">${label}</div></div>`;
}

function submitLog(){
  const p=parseInt(document.getElementById('logPages').value)||0;
  const m=parseInt(document.getElementById('logMin').value)||0;
  const bookId=document.getElementById('logBook').value;
  if(p===0&&m===0){ toast('Isi halaman atau menit dulu.'); return; }
  logToday(p,m);
  if(bookId&&p>0){ const b=state.books.find(x=>x.id===bookId); if(b&&b.totalPages>0){ b.currentPage=Math.min(b.totalPages,b.currentPage+p); if(b.currentPage>=b.totalPages){b.status='finished';b.finishedAt=todayISO();toast('Selesai! Buku ditandai tuntas.');} save(); } }
  toast('Sesi tercatat. '+(currentStreak()>1?`Streak ${currentStreak()} hari 🔥`:'Streak dimulai!'));
  renderPlanner();
}

function openGoalSettings(){
  const s=state.settings;
  modal(`Atur target harian`,`
    <div class="field"><label>Mode target</label>
      <div class="choose-grid" style="grid-template-columns:1fr 1fr" id="gMode">
        <div class="choose-opt ${s.dailyGoalMode==='pages'?'sel':''}" data-m="pages"><div class="t">Halaman</div><div class="d">mis. 20 hlm/hari</div></div>
        <div class="choose-opt ${s.dailyGoalMode==='minutes'?'sel':''}" data-m="minutes"><div class="t">Waktu</div><div class="d">mis. 30 menit/hari</div></div>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Target halaman / hari</label><input type="number" id="gPages" min="1" value="${s.dailyGoalPages||20}"></div>
      <div class="field"><label>Target menit / hari</label><input type="number" id="gMin" min="1" value="${s.dailyGoalMinutes||30}"></div>
    </div>
    <p style="font-size:12.5px;color:var(--ink-faint);line-height:1.5">Saran: mulai dari target kecil yang pasti bisa Anda penuhi setiap hari. Konsistensi membangun kebiasaan; target ambisius yang sering gagal justru mengikis motivasi.</p>
  `,[
    {label:'Batal',cls:'btn-ghost',close:true},
    {label:'Simpan',cls:'btn-primary',fn:(bd)=>{
      const m=bd.querySelector('#gMode .sel'); s.dailyGoalMode=m?m.dataset.m:'pages';
      s.dailyGoalPages=parseInt(bd.querySelector('#gPages').value)||20;
      s.dailyGoalMinutes=parseInt(bd.querySelector('#gMin').value)||30;
      save(); toast('Target disimpan.'); render(); return true;
    }}
  ],(bd)=>{ bd.querySelectorAll('#gMode .choose-opt').forEach(o=>o.onclick=()=>{bd.querySelectorAll('#gMode .choose-opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');}); });
}

/* ---------- REVIEW ---------- */
function renderReview(){
  const el=document.getElementById('view'); const due=dueReviews();
  let html=`
    <div class="section-head"><div><h2>Tinjau Hari Ini</h2>
    <p class="sub">Mengingat aktif dengan jeda melebar — teknik terkuat memindahkan pemahaman ke ingatan jangka panjang.</p></div></div>
    <div class="review-hero"><div class="count">${due.length}</div>
    <div class="clab">${due.length===0?'Tidak ada yang jatuh tempo. Ingatan Anda sedang beristirahat.':'kartu menunggu untuk diingat kembali'}</div></div>`;
  if(due.length===0){
    const up=[]; state.books.forEach(b=>(b.reviews||[]).forEach(r=>up.push({book:b,review:r})));
    up.sort((a,b)=>new Date(a.review.dueDate)-new Date(b.review.dueDate));
    if(up.length>0){
      html+=`<h3 style="font-family:var(--serif);font-size:16px;margin:24px 0 12px;color:var(--ink-soft)">Akan datang</h3>`;
      up.slice(0,6).forEach(({book,review})=>{ const d=daysBetween(todayISO(),review.dueDate);
        html+=`<div class="review-card" style="box-shadow:none;opacity:.72"><div class="rq">${esc(review.prompt)}</div><div class="rbook">${esc(book.title)} · dalam ${d} hari (${fmtShort(review.dueDate)})</div></div>`; });
    } else html+=`<div class="empty-state" style="padding:40px 20px"><p>Belum ada kartu tinjauan. Buka buku, lalu buat kartu tanya-jawab di tab <strong>Tinjauan Berjeda</strong>.</p></div>`;
    el.innerHTML=html; return;
  }
  due.forEach(({book,review})=>{
    const isRev=revealed[review.id],streak=(review.history||[]).length;
    html+=`<div class="review-card"><div class="rq">${esc(review.prompt)}</div>
      <div class="rbook">${esc(book.title)} · ditinjau ${streak}× · interval ${SR_INTERVALS[review.srIndex]} hari</div>
      ${!isRev?`<button class="btn btn-ghost" style="width:100%;justify-content:center;padding:13px" onclick="revealCard('${review.id}')">Tampilkan jawaban — coba ingat dulu tanpa melihat</button>`
      :`<div class="reveal-area"><div class="reveal-answer">${esc(review.answer)||'<span class="muted">(tanpa jawaban tertulis — nilai dari ingatan Anda)</span>'}</div>
        <p style="font-size:12.5px;color:var(--ink-faint);margin-bottom:10px">Seberapa lancar Anda mengingatnya?</p>
        <div class="recall-actions">
          <button class="recall-btn recall-hard" onclick="gradeCard('${book.id}','${review.id}','hard')">Sulit<span class="recall-sub">ulang besok</span></button>
          <button class="recall-btn recall-ok" onclick="gradeCard('${book.id}','${review.id}','ok')">Bisa<span class="recall-sub">+${SR_INTERVALS[Math.min(review.srIndex+1,SR_INTERVALS.length-1)]} hari</span></button>
          <button class="recall-btn recall-easy" onclick="gradeCard('${book.id}','${review.id}','easy')">Mudah<span class="recall-sub">jeda jauh</span></button>
        </div></div>`}</div>`;
  });
  el.innerHTML=html;
}

function revealCard(id){ revealed[id]=true; renderReview(); }
function gradeCard(bookId,reviewId,grade){
  const b=state.books.find(x=>x.id===bookId),r=b.reviews.find(x=>x.id===reviewId);
  scheduleNext(r,grade); delete revealed[reviewId]; save();
  toast(grade==='hard'?'Ditandai sulit — muncul lagi besok.':`Bagus. Kembali dalam ${SR_INTERVALS[r.srIndex]} hari.`);
  render();
}

/* ---------- STATS ---------- */
function renderStats(){
  const el=document.getElementById('view');
  const total=state.books.length;
  const finished=state.books.filter(b=>b.status==='finished').length;
  const reading=state.books.filter(b=>b.status==='reading').length;
  const totalNotes=state.books.reduce((s,b)=>s+b.notes.length,0);
  const totalCards=state.books.reduce((s,b)=>s+b.reviews.length,0);
  const totalReviews=state.books.reduce((s,b)=>s+b.reviews.reduce((a,r)=>a+(r.history?r.history.length:0),0),0);
  const totalQuotes=state.books.reduce((s,b)=>s+b.quotes.length,0);
  const feynPass=state.books.reduce((s,b)=>s+b.feynman.filter(f=>f.verdict==='pass').length,0);
  const feynTotal=state.books.reduce((s,b)=>s+b.feynman.length,0);
  const streak=currentStreak(),longest=longestStreak();
  const pagesRead=Object.values(state.log).reduce((s,e)=>s+(e.pages||0),0);

  let html=`<div class="section-head"><div><h2>Wawasan</h2>
    <p class="sub">Bukan sekadar angka — pola dan sinyal dari kebiasaan membaca Anda.</p></div></div>`;

  // insights
  const insights=buildInsights();
  if(insights.length){
    html+=`<div style="margin-bottom:24px">`;
    insights.forEach(i=>html+=`<div class="insight-card"><span class="ii">${i.icon}</span><div class="it">${i.text}</div></div>`);
    html+=`</div>`;
  }

  html+=`<div class="stat-grid">
    <div class="stat-box"><div class="num accent">${finished}</div><div class="lab">Buku selesai</div></div>
    <div class="stat-box"><div class="num">${reading}</div><div class="lab">Sedang dibaca</div></div>
    <div class="stat-box"><div class="streak-flame">🔥</div><div class="num accent">${streak}</div><div class="lab">Streak hari ini</div></div>
    <div class="stat-box"><div class="num">${longest}</div><div class="lab">Streak terpanjang</div></div>
    <div class="stat-box"><div class="num">${pagesRead}</div><div class="lab">Total halaman tercatat</div></div>
    <div class="stat-box"><div class="num">${totalNotes}</div><div class="lab">Catatan (bahasa sendiri)</div></div>
    <div class="stat-box"><div class="num">${totalCards}</div><div class="lab">Kartu ingatan</div></div>
    <div class="stat-box"><div class="num accent">${totalReviews}</div><div class="lab">Tinjauan dilakukan</div></div>
    <div class="stat-box"><div class="num">${totalQuotes}</div><div class="lab">Kutipan tersimpan</div></div>
    <div class="stat-box"><div class="num">${feynTotal>0?Math.round(feynPass/feynTotal*100):0}%</div><div class="lab">Uji Feynman lolos</div></div>
  </div>`;

  // heatmap
  html+=`<div class="chart-panel"><h3>Kalender membaca</h3><p class="csub">Setiap kotak satu hari. Semakin gelap, semakin banyak dibaca — 12 minggu terakhir.</p>${buildHeatmap()}</div>`;

  // bar chart
  html+=`<div class="chart-panel"><h3>Halaman per hari</h3><p class="csub">14 hari terakhir.</p>${buildBarChart()}</div>`;

  // donut
  html+=`<div class="chart-panel"><h3>Komposisi rak</h3><p class="csub">Berdasarkan tujuan membaca.</p>${buildDonut()}</div>`;

  el.innerHTML=html;
}

function buildInsights(){
  const out=[]; const books=state.books;
  const finished=books.filter(b=>b.status==='finished');
  const streak=currentStreak();
  if(streak>=3) out.push({icon:'🔥',text:`Anda membaca <strong>${streak} hari beruntun</strong>. Konsistensi inilah yang membangun kebiasaan — pertahankan momentumnya.`});
  else if(streak===0 && Object.keys(state.log).length>0) out.push({icon:'🌱',text:`Streak Anda putus. Tidak apa — baca sedikit saja hari ini untuk memulainya lagi. Rutin kecil mengalahkan ambisi yang jarang.`});
  const stalled=books.filter(b=>b.status==='reading'&&b.startedAt&&daysBetween(b.startedAt,todayISO())>21&&(b.totalPages===0||b.currentPage/b.totalPages<0.9));
  if(stalled.length) out.push({icon:'⏳',text:`<strong>${stalled.length} buku</strong> sudah lama berstatus "sedang dibaca" (${stalled.map(b=>esc(b.title)).slice(0,2).join(', ')}${stalled.length>2?', …':''}). Selesaikan atau tunda dengan sadar — buku menggantung menguras fokus.`});
  const finishedNoCards=finished.filter(b=>b.reviews.length===0&&b.purpose==='deep');
  if(finishedNoCards.length) out.push({icon:'🧠',text:`<strong>${finishedNoCards.length} buku "pemahaman dalam"</strong> selesai tanpa satu pun kartu ingatan. Tanpa active recall, pemahaman itu akan memudar. Buat beberapa kartu untuk menguncinya.`});
  const gaps=books.reduce((s,b)=>s+b.feynman.filter(f=>f.verdict==='gap').length,0);
  if(gaps>0) out.push({icon:'🔍',text:`Anda menemukan <strong>${gaps} lubang pemahaman</strong> lewat uji Feynman. Itu bukan kegagalan — itu peta persis bagian yang perlu Anda baca ulang.`});
  const want=books.filter(b=>b.status==='want').length;
  if(want>=5 && want>finished*2) out.push({icon:'📚',text:`Rak "ingin dibaca" (${want}) jauh lebih besar dari yang selesai (${finished}). Wajar — tapi menimbun buku bukan membaca. Pilih satu, selesaikan, baru tambah.`});
  const due=dueReviews().length;
  if(due>=5) out.push({icon:'⚡',text:`<strong>${due} kartu</strong> jatuh tempo untuk ditinjau. Menundanya membuat interval jeda kehilangan efeknya — tinjau hari ini selagi segar.`});
  return out.slice(0,4);
}

function buildHeatmap(){
  const weeks=12,days=weeks*7; const cells=[];
  const end=new Date(); end.setHours(0,0,0,0);
  let max=1; for(let i=0;i<days;i++){ const d=new Date(end); d.setDate(d.getDate()-i); const e=state.log[dayKey(d)]; if(e&&e.pages>max)max=e.pages; }
  const start=new Date(end); start.setDate(start.getDate()-(days-1));
  const html=[];
  let cur=new Date(start);
  const cols=[];
  for(let w=0;w<weeks+1;w++){
    let col='<div class="heat-week">';
    for(let dOfW=0;dOfW<7;dOfW++){
      if(cur>end){ col+='<div class="heat-day" style="visibility:hidden"></div>'; }
      else{
        const k=dayKey(cur); const e=state.log[k]; const pg=e?e.pages:0;
        let lvl=''; if(pg>0){ const r=pg/max; lvl=r>0.75?'heat-l4':r>0.5?'heat-l3':r>0.25?'heat-l2':'heat-l1'; }
        col+=`<div class="heat-day ${lvl}" title="${fmtShort(cur.toISOString())}: ${pg} hlm${e&&e.minutes?', '+e.minutes+' mnt':''}"></div>`;
      }
      cur.setDate(cur.getDate()+1);
    }
    col+='</div>'; cols.push(col);
  }
  return `<div class="heatmap">${cols.join('')}</div>
    <div class="heat-legend"><span>sedikit</span><div class="heat-day"></div><div class="heat-day heat-l1"></div><div class="heat-day heat-l2"></div><div class="heat-day heat-l3"></div><div class="heat-day heat-l4"></div><span>banyak</span></div>`;
}

function buildBarChart(){
  const days=14; const vals=[];
  for(let i=days-1;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); const e=state.log[dayKey(d)]; vals.push({d,pages:e?e.pages:0}); }
  const max=Math.max(1,...vals.map(v=>v.pages));
  if(vals.every(v=>v.pages===0)) return `<p class="empty-inline">Belum ada data. Catat sesi membaca di tab Planner untuk mengisi grafik ini.</p>`;
  return `<div class="bar-chart">${vals.map(v=>{
    const h=v.pages>0?Math.max(4,v.pages/max*130):2;
    return `<div class="bar-col"><div class="bar-val">${v.pages||''}</div><div class="bar" style="height:${h}px" title="${fmtShort(v.d.toISOString())}: ${v.pages} hlm"></div><div class="bar-lab">${v.d.getDate()}</div></div>`;
  }).join('')}</div>`;
}

function buildDonut(){
  const counts={reference:0,deep:0,overview:0};
  state.books.forEach(b=>counts[b.purpose]++);
  const total=state.books.length;
  if(total===0) return `<p class="empty-inline">Belum ada buku.</p>`;
  const colors={reference:'var(--plum)',deep:'var(--ochre)',overview:'var(--green)'};
  let acc=0; const segs=[]; const C=2*Math.PI*60;
  Object.keys(counts).forEach(k=>{ if(counts[k]>0){ const frac=counts[k]/total; const dash=frac*C; segs.push({k,dash,off:acc*C,color:colors[k]}); acc+=frac; } });
  return `<div class="donut-wrap">
    <svg width="150" height="150" viewBox="0 0 150 150">
      <circle cx="75" cy="75" r="60" fill="none" stroke="var(--paper-sunk)" stroke-width="20"/>
      ${segs.map(s=>`<circle cx="75" cy="75" r="60" fill="none" stroke="${s.color}" stroke-width="20" stroke-dasharray="${s.dash} ${C-s.dash}" stroke-dashoffset="${-s.off}" transform="rotate(-90 75 75)"/>`).join('')}
      <text x="75" y="72" text-anchor="middle" font-family="var(--serif)" font-size="28" font-weight="600" fill="var(--ink)">${total}</text>
      <text x="75" y="90" text-anchor="middle" font-size="11" fill="var(--ink-faint)">buku</text>
    </svg>
    <div class="donut-legend">${Object.keys(counts).map(k=>`<div class="dl"><span class="dl-swatch" style="background:${colors[k]}"></span>${PURPOSE[k].label} <span class="muted">· ${counts[k]}</span></div>`).join('')}</div>
  </div>`;
}

/* ---------- METHOD ---------- */
function renderMethod(){
  const el=document.getElementById('view');
  el.innerHTML=`<div class="section-head"><div><h2>Metode yang diterapkan</h2>
    <p class="sub">Setiap fitur punya dasar riset kognitif — bukan tips motivasi. Ini yang membedakan membaca aktif dari sekadar melewati halaman.</p></div></div>
    <div class="method-card"><h4><span class="mnum">1</span> Kalibrasi tujuan sebelum membaca</h4><p>Setiap buku diberi label <strong>tujuan</strong>: referensi, pemahaman dalam, atau wawasan umum. Usaha harus sebanding — menghabiskan energi penuh untuk buku yang hanya perlu diketahui garis besarnya adalah inefisiensi.</p></div>
    <div class="method-card"><h4><span class="mnum">2</span> SQ3R — Survey, Question, Read, Recite, Review</h4><p>Anda menyusun <strong>pertanyaan pemandu</strong> sebelum membaca detail. Otak yang mencari jawaban memproses aktif, bukan pasif menerima. Membaca pasif menghasilkan <em>illusion of competence</em> — merasa paham padahal tidak.</p></div>
    <div class="method-card"><h4><span class="mnum">3</span> Catat dengan bahasa sendiri, catat hubungan</h4><p>Catatan memaksa <strong>ringkasan kata-kata sendiri</strong> plus <strong>hubungan antar-ide</strong>. Menyalin kalimat penulis adalah aktivitas tangan, bukan otak. Pemahaman adalah koneksi antar-ide, bukan tumpukan fakta.</p></div>
    <div class="method-card"><h4><span class="mnum">4</span> Active recall + spaced repetition</h4><p>Kartu memaksa Anda <strong>menarik informasi dari ingatan</strong> sebelum melihat jawaban — jauh lebih kuat dari membaca ulang. Jadwal melebar (${SR_INTERVALS.slice(0,6).join(', ')} hari) melawan <em>forgetting curve</em>. Dua teknik ini (Dunlosky dkk., 2013) paling ampuh dari puluhan yang diteliti.</p></div>
    <div class="method-card"><h4><span class="mnum">5</span> Uji Feynman</h4><p>Jelaskan konsep seolah kepada orang awam, tanpa jargon. Kalau tersendat atau tergoda pakai istilah rumit untuk menutupi — di situ letak lubang pemahaman. Alat ini mencatat percobaan dan lubang yang ditemukan, agar bisa ditambal.</p></div>
    <div class="method-card"><h4><span class="mnum">6</span> Konsistensi &gt; intensitas</h4><p>Planner menekankan <strong>target harian kecil</strong>, bukan maraton sesekali. Membaca lambat tapi rutin, dengan tinjauan berjeda, memindahkan pemahaman ke ingatan jangka panjang jauh lebih efektif — dan lebih efisien per unit usaha.</p></div>
    <hr class="soft">
    <div class="panel" style="padding:20px"><div class="row-between" style="flex-wrap:wrap;gap:12px">
      <div><div style="font-weight:600;font-size:14px">Data &amp; penyimpanan</div>
      <p style="font-size:13px;color:var(--ink-soft);margin-top:4px;max-width:480px;line-height:1.5">Semua data di browser ini (localStorage) — tidak terkirim ke mana pun, tapi tidak tersinkron antar-perangkat dan bisa hilang jika Anda bersihkan data browser. Backup berkala ke file.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" onclick="exportData()">Ekspor backup</button><button class="btn btn-ghost btn-sm" onclick="document.getElementById('fileInput').click()">Impor backup</button></div>
    </div></div>`;
}
