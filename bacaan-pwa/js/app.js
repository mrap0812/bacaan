/* ================================================================
   BOOK DETAIL & WORK TAB MANAGEMENT
   ================================================================ */

function openBook(id){ ui.openBookId=id; ui.view='detail'; ui.workTab='setup'; render(); window.scrollTo(0,0); }
function backToLibrary(){ ui.view='library'; ui.openBookId=null; render(); }
function setWorkTab(k){ ui.workTab=k; renderDetail(); }

function renderDetail(){
  const b=getBook(); if(!b){ ui.view='library'; render(); return; }
  const p=PURPOSE[b.purpose],s=STATUS[b.status]; const el=document.getElementById('view');
  const tabs=[
    {k:'setup',label:'Ikhtisar'},
    {k:'questions',label:'Pertanyaan',n:b.questions.length},
    {k:'notes',label:'Catatan',n:b.notes.length},
    {k:'quotes',label:'Kutipan',n:b.quotes.length},
    {k:'reviews',label:'Tinjauan',n:b.reviews.length},
    {k:'feynman',label:'Feynman',n:b.feynman.length}
  ];
  el.innerHTML=`
    <button class="btn btn-ghost btn-sm" onclick="backToLibrary()" style="margin-bottom:20px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Kembali ke rak</button>
    <div class="detail-header">
      ${coverHTML(b,'detail-cover')}
      <div class="detail-main">
        <div class="detail-title">${esc(b.title)}</div>
        <div class="detail-author">${b.author?esc(b.author):'<span class="muted">Tanpa penulis</span>'}${b.year?` · ${esc(String(b.year))}`:''}</div>
        <div class="detail-meta"><span class="badge ${s.badge}">${s.label}</span><span class="badge ${p.badge}">${p.label}</span>
        ${b.totalPages>0?`<span class="muted" style="font-size:12.5px">${b.currentPage}/${b.totalPages} hlm</span>`:''}</div>
        ${b.tags&&b.tags.length?`<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:5px">${b.tags.map(t=>`<span class="book-tag" onclick="filterByTag('${escAttr(t)}')">${esc(t)}</span>`).join('')}</div>`:''}
        <div class="detail-actions">
          <button class="btn btn-ghost btn-sm" onclick="editBook('${b.id}')">Edit</button>
          <button class="btn btn-ghost btn-sm" onclick="exportBookMarkdown('${b.id}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Ekspor .md</button>
          <button class="btn btn-ghost btn-sm btn-danger" onclick="deleteBook('${b.id}')">Hapus</button>
        </div>
      </div>
    </div>
    <nav class="work-tabs">${tabs.map(t=>`<button class="${ui.workTab===t.k?'active':''}" onclick="setWorkTab('${t.k}')">${t.label}${t.n!==undefined?` <span class="pill-count">${t.n}</span>`:''}</button>`).join('')}</nav>
    <div class="work-panel" id="workPanel"></div>`;
  renderWorkTab();
}

function renderWorkTab(){
  const b=getBook(); if(!b) return; const panel=document.getElementById('workPanel'); if(!panel) return;
  const fns={
    setup:(b)=>tabSetup(b),
    questions:(b)=>tabQuestions(b),
    notes:(b)=>tabNotes(b),
    quotes:(b)=>tabQuotes(b),
    reviews:(b)=>tabReviews(b),
    feynman:(b)=>tabFeynman(b)
  };
  panel.innerHTML=fns[ui.workTab](b); wireWorkTab(b);
}

// --- TAB: Setup/Ikhtisar ---
function tabSetup(b){
  const pct=b.totalPages>0?Math.min(100,Math.round(b.currentPage/b.totalPages*100)):(b.status==='finished'?100:0);
  return `
    <div class="step-intro"><strong>Sebelum menyelam:</strong> tentukan buku ini untuk apa. Bobot usaha mengikuti tujuannya.</div>
    <div class="field"><label>Status bacaan</label><select id="statusSel">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${b.status===k?'selected':''}>${v.label}</option>`).join('')}</select></div>
    <div class="field"><label>Tujuan membaca <span class="hint">menentukan seberapa dalam Anda menggarapnya</span></label>
      <div class="choose-grid" id="purposeChoose">${Object.entries(PURPOSE).map(([k,v])=>`<div class="choose-opt ${b.purpose===k?'sel':''}" data-purpose="${k}"><div class="t">${v.label}</div><div class="d">${v.desc}</div></div>`).join('')}</div>
    </div>
    <hr class="soft">
    <div class="field"><label>Kemajuan halaman</label>
      <div class="field-row"><div><label style="font-weight:400;color:var(--ink-faint);font-size:12px">Halaman sekarang</label><input type="number" id="curPage" min="0" value="${b.currentPage}"></div>
      <div><label style="font-weight:400;color:var(--ink-faint);font-size:12px">Total halaman</label><input type="number" id="totPage" min="0" value="${b.totalPages||''}" placeholder="opsional"></div></div>
    </div>
    ${b.totalPages>0?`<div class="prog-label" style="margin-top:4px"><span>${b.currentPage}/${b.totalPages}</span><span>${pct}%</span></div><div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>`:''}
    <hr class="soft">
    <div class="field"><label>Target penyelesaian <span class="hint">untuk perhitungan laju di Planner</span></label>
      <div class="field-row">
        <div><label style="font-weight:400;color:var(--ink-faint);font-size:12px">Tenggat (opsional)</label><input type="date" id="deadline" value="${b.deadline||''}"></div>
        <div><label style="font-weight:400;color:var(--ink-faint);font-size:12px">Atau: halaman/hari</label><input type="number" id="ppd" min="0" value="${b.pagesPerDay||''}" placeholder="mis. 20"></div>
      </div>
    </div>
    <div style="margin-top:20px"><button class="btn btn-primary btn-sm" id="saveSetup">Simpan perubahan</button></div>`;
}

// --- TAB: Questions ---
function tabQuestions(b){
  const aiOn=state.settings.aiProvider!=='none'&&state.settings.aiKey;
  return `
    <div class="step-intro"><strong>Langkah Question (SQ3R):</strong> ubah judul & subjudul jadi pertanyaan sebelum membaca detail. Membaca untuk <em>menjawab</em> membuat otak berburu.</div>
    ${aiOn?`<button class="btn ai-btn btn-sm" id="aiQBtn" style="margin-bottom:16px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21l2.3-7.4-6-4.6h7.6z"/></svg> Saran pertanyaan dari AI</button><div id="aiQArea"></div>`:''}
    ${b.questions.length===0?`<p class="empty-inline">Belum ada pertanyaan. Mulai dari daftar isi: "Fungsi Enzim" → "Apa fungsi enzim & bagaimana ia bekerja?"</p>`:''}
    <div id="qList">${b.questions.map(q=>`
      <div class="q-item"><div class="q-check ${q.answered?'done':''}" onclick="toggleQ('${q.id}')">${q.answered?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>':''}</div>
      <div class="q-body"><div class="q-text ${q.answered?'answered':''}">${esc(q.text)}</div>
      ${q.answered?(q.answer?`<div class="q-answer">${esc(q.answer)}</div>`:`<div class="q-answer empty" onclick="answerQ('${q.id}')">+ Tulis jawaban dengan kata-kata sendiri</div>`):`<button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="answerQ('${q.id}')">Tulis jawaban</button>`}</div>
      <button class="q-del" onclick="delQ('${q.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>`).join('')}</div>
    <div class="add-inline"><input type="text" id="newQ" placeholder="Tulis pertanyaan pemandu, lalu Enter…"><button class="btn btn-primary btn-sm" id="addQ">Tambah</button></div>`;
}

// --- TAB: Notes ---
function tabNotes(b){
  return `
    <div class="step-intro"><strong>Langkah Recite:</strong> tutup buku, tulis ulang <em>dengan kata-kata sendiri</em> — jangan menyalin. Catat <strong>hubungannya</strong> dengan ide lain. Tak bisa menjelaskan = belum paham.</div>
    <div style="margin-bottom:16px"><button class="btn btn-primary btn-sm" id="newNoteBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg> Catatan baru</button></div>
    <div id="noteFormArea"></div>
    <div id="noteList">${b.notes.length===0?`<p class="empty-inline">Belum ada catatan.</p>`:''}
    ${b.notes.slice().reverse().map(n=>`<div class="note-card"><div class="nhead"><span class="nloc">${n.loc?esc(n.loc):'—'}</span><button class="q-del" onclick="delNote('${n.id}')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="nlabel">Inti (bahasa sendiri)</div><div class="ncontent">${esc(n.summary)}</div>
    ${n.relation?`<div class="nrel"><div class="nlabel">Hubungan antar-ide</div><div class="ncontent">${esc(n.relation)}</div></div>`:''}
    <div style="margin-top:12px"><button class="btn btn-ghost btn-sm" onclick="noteToCard('${n.id}')">↳ Jadikan kartu ingatan</button></div></div>`).join('')}</div>`;
}

// --- TAB: Quotes ---
function tabQuotes(b){
  return `
    <div class="step-intro"><strong>Kutipan &amp; cuplikan:</strong> simpan kalimat yang menohok atau ingin Anda ingat persis. Beri tag agar mudah ditemukan. Kutipan penting bisa diubah jadi kartu ingatan.</div>
    <div style="margin-bottom:16px"><button class="btn btn-primary btn-sm" id="newQuoteBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg> Tambah kutipan</button></div>
    <div id="quoteFormArea"></div>
    <div id="quoteList">${b.quotes.length===0?`<p class="empty-inline">Belum ada kutipan tersimpan.</p>`:''}
    ${b.quotes.slice().reverse().map(q=>`<div class="note-card quote-card"><div class="nhead"><span class="nloc" style="background:var(--plum-bg);color:var(--plum)">${q.page?'hlm '+esc(q.page):'❝'}</span><button class="q-del" onclick="delQuote('${q.id}')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="qtext">"${esc(q.text)}"</div>
    ${q.thought?`<div class="nrel"><div class="nlabel">Pikiran Anda</div><div class="ncontent">${esc(q.thought)}</div></div>`:''}
    ${q.tags&&q.tags.length?`<div style="margin-top:10px">${q.tags.map(t=>`<span class="quote-tag">${esc(t)}</span>`).join('')}</div>`:''}</div>`).join('')}</div>`;
}

// --- TAB: Reviews (Spaced Repetition) ---
function tabReviews(b){
  return `
    <div class="step-intro"><strong>Active recall + jeda melebar:</strong> buat pasangan tanya–jawab. Kartu muncul di "Tinjau Hari Ini" sesuai jadwal membesar. Menarik jawaban dari ingatan memperkuat memori jauh lebih dari membaca ulang.</div>
    <div style="margin-bottom:16px"><button class="btn btn-primary btn-sm" id="newCardBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg> Kartu baru</button></div>
    <div id="cardFormArea"></div>
    <div id="cardList">${b.reviews.length===0?`<p class="empty-inline">Belum ada kartu ingatan untuk buku ini.</p>`:''}
    ${b.reviews.slice().reverse().map(r=>{const due=new Date(r.dueDate)<=new Date(new Date().setHours(23,59,59,999));const reps=(r.history||[]).length;
    return `<div class="note-card"><div class="nhead"><span class="nloc" style="background:${due?'var(--ochre-bg)':'var(--indigo-wash)'};color:${due?'var(--ochre)':'var(--indigo)'}">${due?'jatuh tempo':'jeda '+SR_INTERVALS[r.srIndex]+'h'}</span><button class="q-del" onclick="delCard('${r.id}')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="nlabel">Pertanyaan</div><div class="ncontent" style="font-weight:500">${esc(r.prompt)}</div>
    <div class="nrel"><div class="nlabel">Jawaban</div><div class="ncontent" style="color:var(--ink-soft)">${esc(r.answer)||'<span class="muted">(dinilai dari ingatan)</span>'}</div></div>
    <div class="prog-label" style="margin-top:10px"><span>ditinjau ${reps}×</span><span>berikutnya: ${fmtShort(r.dueDate)}</span></div></div>`;}).join('')}</div>`;
}

// --- TAB: Feynman ---
function tabFeynman(b){
  const aiOn=state.settings.aiProvider!=='none'&&state.settings.aiKey;
  return `
    <div class="step-intro"><strong>Standar Feynman:</strong> jelaskan konsep seolah kepada orang awam, tanpa jargon. Tersendat atau bersembunyi di balik istilah rumit = lubang pemahaman. Tandai lolos atau temukan celahnya.</div>
    <div style="margin-bottom:16px"><button class="btn btn-primary btn-sm" id="newFeynBtn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg> Uji sebuah konsep</button>
    ${aiOn?`<span style="font-size:12px;color:var(--ink-faint);margin-left:10px">AI bisa menilai penjelasan Anda saat menyimpan</span>`:''}</div>
    <div id="feynFormArea"></div>
    <div id="feynList">${b.feynman.length===0?`<p class="empty-inline">Belum ada uji Feynman.</p>`:''}
    ${b.feynman.slice().reverse().map(f=>`<div class="feynman-attempt"><div class="fh"><div style="font-weight:600;font-size:14.5px">${esc(f.concept)}</div><span class="verdict ${f.verdict==='pass'?'verdict-pass':'verdict-gap'}">${f.verdict==='pass'?'✓ Lolos':'△ Ada celah'}</span></div>
    <div class="nlabel">Penjelasan awam Anda</div><div class="ncontent" style="font-size:13.5px">${esc(f.explanation)}</div>
    ${f.gaps?`<div class="nrel"><div class="nlabel" style="color:var(--ochre)">Lubang yang ditemukan</div><div class="ncontent" style="font-size:13.5px;color:var(--ink-soft)">${esc(f.gaps)}</div></div>`:''}
    ${f.aiFeedback?`<div class="nrel"><div class="nlabel" style="color:var(--plum)">Umpan balik AI</div><div class="ncontent" style="font-size:13.5px;color:var(--ink-soft)">${esc(f.aiFeedback)}</div></div>`:''}
    <div class="fdate" style="margin-top:10px">${fmtDate(f.date)}</div><div style="margin-top:8px"><button class="q-del" onclick="delFeyn('${f.id}')" style="font-size:12px">Hapus</button></div></div>`).join('')}</div>`;
}

/* ---------- WORK TAB WIRING ---------- */
function wireWorkTab(b){
  const saveSetup=document.getElementById('saveSetup');
  if(saveSetup){
    document.querySelectorAll('#purposeChoose .choose-opt').forEach(o=>o.onclick=()=>{document.querySelectorAll('#purposeChoose .choose-opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');});
    saveSetup.onclick=()=>{
      const sel=document.querySelector('#purposeChoose .choose-opt.sel'); b.purpose=sel?sel.dataset.purpose:b.purpose;
      const ns=document.getElementById('statusSel').value;
      if(ns==='reading'&&!b.startedAt) b.startedAt=todayISO();
      if(ns==='finished'&&b.status!=='finished') b.finishedAt=todayISO();
      b.status=ns; b.currentPage=parseInt(document.getElementById('curPage').value)||0; b.totalPages=parseInt(document.getElementById('totPage').value)||0;
      if(b.totalPages>0&&b.currentPage>b.totalPages) b.currentPage=b.totalPages;
      b.deadline=document.getElementById('deadline').value||''; b.pagesPerDay=parseInt(document.getElementById('ppd').value)||0;
      save(); toast('Perubahan tersimpan.'); renderDetail();
    };
  }
  const addQ=document.getElementById('addQ'),newQ=document.getElementById('newQ');
  if(addQ){ const doAdd=()=>{const v=newQ.value.trim();if(!v)return;b.questions.push({id:uid(),text:v,answered:false,answer:''});save();renderDetail();setTimeout(()=>{const n=document.getElementById('newQ');if(n)n.focus();},0);}; addQ.onclick=doAdd; newQ.onkeydown=e=>{if(e.key==='Enter')doAdd();}; }
  const nb=document.getElementById('newNoteBtn'); if(nb) nb.onclick=()=>showNoteForm(b);
  const qb=document.getElementById('newQuoteBtn'); if(qb) qb.onclick=()=>showQuoteForm(b);
  const cb=document.getElementById('newCardBtn'); if(cb) cb.onclick=()=>showCardForm(b);
  const fb=document.getElementById('newFeynBtn'); if(fb) fb.onclick=()=>showFeynForm(b);
  const aiQBtn=document.getElementById('aiQBtn'); if(aiQBtn) aiQBtn.onclick=()=>aiSuggestQuestions(b);
}

/* ---------- QUESTION ACTIONS ---------- */
function toggleQ(qid){const b=getBook();const q=b.questions.find(x=>x.id===qid);q.answered=!q.answered;save();renderDetail();}
function delQ(qid){const b=getBook();const i=b.questions.findIndex(x=>x.id===qid);if(i<0)return;const item=b.questions[i];b.questions.splice(i,1);save();renderDetail();undoable('Pertanyaan dihapus.',()=>{b.questions.splice(i,0,item);save();renderDetail();});}
function answerQ(qid){const b=getBook();const q=b.questions.find(x=>x.id===qid);const v=prompt('Jawab dengan kata-kata Anda sendiri (bukan menyalin penulis):',q.answer||'');if(v===null)return;q.answer=v.trim();q.answered=true;save();renderDetail();}

/* ---------- NOTE FORM ---------- */
function showNoteForm(b){
  const area=document.getElementById('noteFormArea');
  area.innerHTML=`<div class="panel" style="padding:18px;margin-bottom:16px">
    <div class="field" style="margin-bottom:12px"><label>Lokasi <span class="hint">bab / halaman — opsional</span></label><input type="text" id="nfLoc" placeholder="mis. Bab 3, hlm 47"></div>
    <div class="field" style="margin-bottom:12px"><label>Inti — dengan kata-kata sendiri</label><textarea id="nfSummary" rows="3" placeholder="Rangkum bagian ini seolah menjelaskan ke teman. Jangan menyalin kalimat penulis."></textarea></div>
    <div class="field" style="margin-bottom:12px"><label>Hubungan antar-ide <span class="hint">opsional tapi berharga</span></label><textarea id="nfRel" rows="2" placeholder="mis. 'Ini menyebabkan…', 'Bertentangan dengan bab 2 karena…'"></textarea></div>
    <div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" id="nfSave">Simpan catatan</button><button class="btn btn-ghost btn-sm" id="nfCancel">Batal</button></div></div>`;
  document.getElementById('nfSummary').focus();
  document.getElementById('nfSave').onclick=()=>{const summary=document.getElementById('nfSummary').value.trim();if(!summary){toast('Isi bagian "inti" dulu.');return;}b.notes.push({id:uid(),loc:document.getElementById('nfLoc').value.trim(),summary,relation:document.getElementById('nfRel').value.trim(),createdAt:todayISO()});save();renderDetail();toast('Catatan tersimpan.');};
  document.getElementById('nfCancel').onclick=()=>area.innerHTML='';
}
function delNote(id){const b=getBook();const i=b.notes.findIndex(x=>x.id===id);if(i<0)return;const item=b.notes[i];b.notes.splice(i,1);save();renderDetail();undoable('Catatan dihapus.',()=>{b.notes.splice(i,0,item);save();renderDetail();});}
function noteToCard(id){const b=getBook();const n=b.notes.find(x=>x.id===id);ui.workTab='reviews';renderDetail();setTimeout(()=>showCardForm(b,{prompt:'',answer:n.summary}),0);}

/* ---------- QUOTE FORM ---------- */
function showQuoteForm(b){
  const area=document.getElementById('quoteFormArea');
  area.innerHTML=`<div class="panel" style="padding:18px;margin-bottom:16px">
    <div class="field" style="margin-bottom:12px"><label>Kutipan <span class="hint">salin persis kalimatnya</span></label><textarea id="qfText" rows="3" placeholder="Tulis atau tempel kutipannya…"></textarea></div>
    <div class="field-row" style="margin-bottom:12px"><div class="field" style="margin:0"><label>Halaman</label><input type="text" id="qfPage" placeholder="opsional"></div><div class="field" style="margin:0"><label>Tag <span class="hint">pisah koma</span></label><input type="text" id="qfTags" placeholder="mis. motivasi, kunci"></div></div>
    <div class="field" style="margin-bottom:12px"><label>Pikiran Anda <span class="hint">kenapa ini penting? — opsional</span></label><textarea id="qfThought" rows="2" placeholder="Reaksi atau kaitannya dengan hidup Anda…"></textarea></div>
    <div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" id="qfSave">Simpan kutipan</button><button class="btn btn-ghost btn-sm" id="qfCancel">Batal</button></div></div>`;
  document.getElementById('qfText').focus();
  document.getElementById('qfSave').onclick=()=>{const text=document.getElementById('qfText').value.trim();if(!text){toast('Tulis kutipannya dulu.');return;}const tags=document.getElementById('qfTags').value.split(',').map(t=>t.trim()).filter(Boolean);b.quotes.push({id:uid(),text,page:document.getElementById('qfPage').value.trim(),tags,thought:document.getElementById('qfThought').value.trim(),createdAt:todayISO()});save();renderDetail();toast('Kutipan tersimpan.');};
  document.getElementById('qfCancel').onclick=()=>area.innerHTML='';
}
function delQuote(id){const b=getBook();const i=b.quotes.findIndex(x=>x.id===id);if(i<0)return;const item=b.quotes[i];b.quotes.splice(i,1);save();renderDetail();undoable('Kutipan dihapus.',()=>{b.quotes.splice(i,0,item);save();renderDetail();});}

/* ---------- CARD FORM ---------- */
function showCardForm(b,prefill){
  const area=document.getElementById('cardFormArea');
  area.innerHTML=`<div class="panel" style="padding:18px;margin-bottom:16px">
    <div class="field" style="margin-bottom:12px"><label>Pertanyaan <span class="hint">yang memaksa Anda mengingat, bukan mengenali</span></label><textarea id="cfQ" rows="2" placeholder="mis. 'Mengapa membaca pasif menipu?'">${prefill?escAttr(prefill.prompt||''):''}</textarea></div>
    <div class="field" style="margin-bottom:12px"><label>Jawaban <span class="hint">boleh kosong untuk menilai murni dari ingatan</span></label><textarea id="cfA" rows="3" placeholder="Jawaban ringkas dengan bahasa sendiri.">${prefill?escAttr(prefill.answer||''):''}</textarea></div>
    <div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" id="cfSave">Buat kartu</button><button class="btn btn-ghost btn-sm" id="cfCancel">Batal</button></div></div>`;
  document.getElementById('cfQ').focus();
  document.getElementById('cfSave').onclick=()=>{const q=document.getElementById('cfQ').value.trim();if(!q){toast('Tulis pertanyaannya dulu.');return;}b.reviews.push({id:uid(),prompt:q,answer:document.getElementById('cfA').value.trim(),srIndex:0,dueDate:todayISO(),lastReviewed:null,history:[]});save();renderDetail();toast('Kartu dibuat — jatuh tempo hari ini.');};
  document.getElementById('cfCancel').onclick=()=>area.innerHTML='';
}
function delCard(id){const b=getBook();const i=b.reviews.findIndex(x=>x.id===id);if(i<0)return;const item=b.reviews[i];b.reviews.splice(i,1);save();renderDetail();undoable('Kartu dihapus.',()=>{b.reviews.splice(i,0,item);save();renderDetail();});}

/* ---------- FEYNMAN FORM ---------- */
function showFeynForm(b){
  const area=document.getElementById('feynFormArea');
  const aiOn=state.settings.aiProvider!=='none'&&state.settings.aiKey;
  area.innerHTML=`<div class="panel" style="padding:18px;margin-bottom:16px">
    <div class="field" style="margin-bottom:12px"><label>Konsep yang diuji</label><input type="text" id="ffConcept" placeholder="mis. Enzim sebagai katalis"></div>
    <div class="field" style="margin-bottom:12px"><label>Jelaskan untuk orang awam <span class="hint">tanpa jargon, seolah ke anak SMP</span></label><textarea id="ffExp" rows="4" placeholder="Kalau tergoda pakai istilah rumit, itu petunjuk ada yang belum dipahami."></textarea></div>
    <div class="field" style="margin-bottom:12px"><label>Hasil</label><div style="display:flex;gap:8px"><button class="btn btn-ghost btn-sm" id="ffPass" style="flex:1;justify-content:center">✓ Lancar — lolos</button><button class="btn btn-ghost btn-sm" id="ffGap" style="flex:1;justify-content:center">△ Ada yang tersendat</button></div><input type="hidden" id="ffVerdict" value=""></div>
    <div class="field hide" id="ffGapArea" style="margin-bottom:12px"><label style="color:var(--ochre)">Di mana Anda tersendat? <span class="hint">lubang untuk ditambal</span></label><textarea id="ffGaps" rows="2" placeholder="mis. 'Tidak bisa jelaskan kenapa suhu memengaruhi laju reaksi.'"></textarea></div>
    ${aiOn?`<div class="field" style="margin-bottom:12px"><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="ffAI" style="width:auto"> Minta AI menilai kejelasan penjelasan saya</label></div>`:''}
    <div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" id="ffSave">Simpan uji</button><button class="btn btn-ghost btn-sm" id="ffCancel">Batal</button></div></div>`;
  const setV=v=>{document.getElementById('ffVerdict').value=v;document.getElementById('ffPass').style.background=v==='pass'?'var(--green-bg)':'';document.getElementById('ffPass').style.borderColor=v==='pass'?'var(--green)':'';document.getElementById('ffGap').style.background=v==='gap'?'var(--ochre-bg)':'';document.getElementById('ffGap').style.borderColor=v==='gap'?'var(--ochre)':'';document.getElementById('ffGapArea').classList.toggle('hide',v!=='gap');};
  document.getElementById('ffPass').onclick=()=>setV('pass'); document.getElementById('ffGap').onclick=()=>setV('gap');
  document.getElementById('ffConcept').focus();
  document.getElementById('ffSave').onclick=async()=>{
    const concept=document.getElementById('ffConcept').value.trim(),exp=document.getElementById('ffExp').value.trim(),verdict=document.getElementById('ffVerdict').value;
    if(!concept||!exp){toast('Isi konsep dan penjelasannya.');return;}
    if(!verdict){toast('Pilih hasil: lolos atau ada celah.');return;}
    const entry={id:uid(),concept,explanation:exp,verdict,gaps:verdict==='gap'?document.getElementById('ffGaps').value.trim():'',aiFeedback:'',date:todayISO()};
    const wantAI=aiOn&&document.getElementById('ffAI')&&document.getElementById('ffAI').checked;
    if(wantAI){ document.getElementById('ffSave').innerHTML='<span class="spinner"></span>Menilai…'; try{ entry.aiFeedback=await aiFeynmanFeedback(concept,exp); }catch(e){ toast('AI gagal: '+e.message); } }
    b.feynman.push(entry); save(); renderDetail(); toast('Uji Feynman tersimpan.');
  };
  document.getElementById('ffCancel').onclick=()=>area.innerHTML='';
}
function delFeyn(id){const b=getBook();const i=b.feynman.findIndex(x=>x.id===id);if(i<0)return;const item=b.feynman[i];b.feynman.splice(i,1);save();renderDetail();undoable('Uji Feynman dihapus.',()=>{b.feynman.splice(i,0,item);save();renderDetail();});}

/* ================================================================
   BOOK MANAGEMENT: Add / Edit / Delete
   ================================================================ */

let editingBookId=null,pickedCover='',pickedYear='';
function openBookForm(){editingBookId=null;pickedCover='';pickedYear='';showBookModal();}
function editBook(id){editingBookId=id;const b=state.books.find(x=>x.id===id);pickedCover=b.coverUrl||'';pickedYear=b.year||'';showBookModal();}

function showBookModal(){
  const b=editingBookId?state.books.find(x=>x.id===editingBookId):null;
  const bd=document.createElement('div'); bd.className='modal-backdrop';
  bd.innerHTML=`<div class="modal"><div class="modal-head"><h2>${b?'Edit Buku':'Tambah Buku'}</h2><button class="icon-btn" id="mClose"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="modal-body">
      ${!b?`<div class="field ol-search-wrap"><label>Cari buku <span class="hint">otomatis isi via Open Library — atau isi manual di bawah</span></label>
        <div class="search-box"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input type="text" id="olSearch" placeholder="Ketik judul buku…"></div>
        <div id="olResults"></div></div><hr class="soft">`:''}
      <div class="field"><label>Judul buku *</label><input type="text" id="fTitle" value="${b?escAttr(b.title):''}" placeholder="Judul lengkap"></div>
      <div class="field"><label>Penulis</label><input type="text" id="fAuthor" value="${b?escAttr(b.author):''}" placeholder="Nama penulis"></div>
      <div class="field"><label>Tujuan membaca <span class="hint">menentukan seberapa dalam Anda menggarapnya</span></label>
        <div class="choose-grid" id="fPurpose">${Object.entries(PURPOSE).map(([k,v])=>`<div class="choose-opt ${(b?b.purpose:'deep')===k?'sel':''}" data-purpose="${k}"><div class="t">${v.label}</div><div class="d">${v.desc}</div></div>`).join('')}</div></div>
      <div class="field-row"><div class="field"><label>Status</label><select id="fStatus">${Object.entries(STATUS).map(([k,v])=>`<option value="${k}" ${(b?b.status:'want')===k?'selected':''}>${v.label}</option>`).join('')}</select></div>
      <div class="field"><label>Total halaman <span class="hint">opsional</span></label><input type="number" id="fPages" min="0" value="${b&&b.totalPages?b.totalPages:''}" placeholder="mis. 320"></div></div>
      <div class="field"><label>Tag / rak <span class="hint">pisah koma — mis. tauhid, sirah, produktivitas</span></label><input type="text" id="fTags" value="${b&&b.tags?escAttr(b.tags.join(', ')):''}" placeholder="opsional"></div>
    </div>
    <div class="modal-foot"><button class="btn btn-ghost" id="mCancel">Batal</button><button class="btn btn-primary" id="mSave">${b?'Simpan':'Tambah ke rak'}</button></div></div>`;
  document.body.appendChild(bd);
  const close=()=>bd.remove();
  bd.querySelector('#mClose').onclick=close; bd.querySelector('#mCancel').onclick=close; bd.onclick=e=>{if(e.target===bd)close();};
  bd.querySelectorAll('#fPurpose .choose-opt').forEach(o=>o.onclick=()=>{bd.querySelectorAll('#fPurpose .choose-opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');});
  const titleInput=bd.querySelector('#fTitle');
  // OL search
  const ols=bd.querySelector('#olSearch');
  if(ols){ ols.focus(); ols.oninput=()=>{clearTimeout(olTimer);const q=ols.value.trim();const res=bd.querySelector('#olResults');if(q.length<3){res.innerHTML='';return;}olTimer=setTimeout(()=>searchOpenLibrary(q,bd),450);}; }
  else titleInput.focus();
  bd.querySelector('#mSave').onclick=()=>{
    const title=titleInput.value.trim(); if(!title){toast('Judul wajib diisi.');titleInput.focus();return;}
    const purpose=bd.querySelector('#fPurpose .choose-opt.sel').dataset.purpose;
    const tags=bd.querySelector('#fTags').value.split(',').map(t=>t.trim()).filter(Boolean);
    const data={title,author:bd.querySelector('#fAuthor').value,purpose,status:bd.querySelector('#fStatus').value,totalPages:bd.querySelector('#fPages').value,coverUrl:pickedCover,year:pickedYear,tags};
    if(b){b.title=title;b.author=data.author.trim();b.purpose=purpose;if(data.status==='reading'&&!b.startedAt)b.startedAt=todayISO();if(data.status==='finished'&&b.status!=='finished')b.finishedAt=todayISO();b.status=data.status;b.totalPages=parseInt(data.totalPages)||0;b.coverUrl=pickedCover;b.year=pickedYear;b.tags=tags;toast('Buku diperbarui.');}
    else{state.books.push(newBook(data));toast('Buku ditambahkan ke rak.');}
    save();close();render();
  };
  titleInput.onkeydown=e=>{if(e.key==='Enter')bd.querySelector('#mSave').click();};
}

async function searchOpenLibrary(query,bd){
  const res=bd.querySelector('#olResults');
  res.innerHTML=`<div class="ol-results"><div class="ol-loading"><span class="spinner"></span>Mencari di Open Library…</div></div>`;
  try{
    const url=`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=title,author_name,number_of_pages_median,first_publish_year,cover_i`;
    const r=await fetch(url); if(!r.ok) throw new Error('gagal');
    const data=await r.json();
    if(!data.docs||!data.docs.length){ res.innerHTML=`<div class="ol-results"><div class="ol-loading">Tak ada hasil. Isi manual saja.</div></div>`; return; }
    res.innerHTML=`<div class="ol-results">${data.docs.map((d,i)=>{
      const cover=d.cover_i?`https://covers.openlibrary.org/b/id/${d.cover_i}-S.jpg`:'';
      const author=(d.author_name||[]).slice(0,2).join(', ');
      return `<div class="ol-result" data-i="${i}">${cover?`<img class="olc" src="${cover}">`:'<div class="olc"></div>'}<div class="oli"><div class="olt">${esc(d.title||'')}</div><div class="ola">${esc(author||'—')}${d.first_publish_year?' · '+d.first_publish_year:''}${d.number_of_pages_median?' · '+d.number_of_pages_median+' hlm':''}</div></div></div>`;
    }).join('')}</div>`;
    res.querySelectorAll('.ol-result').forEach(r2=>r2.onclick=()=>{
      const d=data.docs[parseInt(r2.dataset.i)];
      bd.querySelector('#fTitle').value=d.title||'';
      bd.querySelector('#fAuthor').value=(d.author_name||[]).slice(0,2).join(', ')||'';
      if(d.number_of_pages_median) bd.querySelector('#fPages').value=d.number_of_pages_median;
      pickedCover=d.cover_i?`https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`:'';
      pickedYear=d.first_publish_year||'';
      res.innerHTML=''; bd.querySelector('#olSearch').value=''; toast('Data terisi otomatis.');
    });
  }catch(e){ res.innerHTML=`<div class="ol-results"><div class="ol-loading">Gagal terhubung ke Open Library. Isi manual saja.</div></div>`; }
}

function deleteBook(id){
  const b=state.books.find(x=>x.id===id);
  modal('Hapus buku?',`<p style="font-size:14px;line-height:1.6">Menghapus <strong>"${esc(b.title)}"</strong> akan menghapus permanen semua pertanyaan, catatan, kutipan, kartu ingatan, dan uji Feynman-nya. Tindakan ini tidak bisa dibatalkan.</p>`,
    [{label:'Batal',cls:'btn-ghost',close:true},{label:'Hapus permanen',cls:'btn-primary',style:'background:var(--red)',fn:()=>{state.books=state.books.filter(x=>x.id!==id);save();ui.view='library';ui.openBookId=null;render();toast('Buku dihapus.');return true;}}]);
}

/* ================================================================
   AI FEATURES (bring-your-own API key)
   ================================================================ */

async function aiCall(systemPrompt,userPrompt){
  const s=state.settings;
  if(s.aiProvider==='none'||!s.aiKey) throw new Error('AI belum diatur');
  if(s.aiProvider==='anthropic'){
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':s.aiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:s.aiModel||'claude-sonnet-4-6',max_tokens:1024,system:systemPrompt,messages:[{role:'user',content:userPrompt}]})});
    if(!r.ok){const t=await r.text();throw new Error('API '+r.status+' — '+t.slice(0,120));}
    const d=await r.json(); return (d.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');
  } else { // openai
    const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+s.aiKey},body:JSON.stringify({model:s.aiModel||'gpt-4o-mini',max_tokens:1024,messages:[{role:'system',content:systemPrompt},{role:'user',content:userPrompt}]})});
    if(!r.ok){const t=await r.text();throw new Error('API '+r.status+' — '+t.slice(0,120));}
    const d=await r.json(); return d.choices[0].message.content;
  }
}

async function aiSuggestQuestions(b){
  const area=document.getElementById('aiQArea');
  area.innerHTML=`<div class="ai-panel"><div class="ail"><span class="spinner"></span>AI menyusun pertanyaan pemandu…</div></div>`;
  try{
    const sys='Anda asisten belajar. Berdasarkan judul & penulis buku, buat 5 pertanyaan pemandu (guiding questions) gaya SQ3R yang membantu pembaca membaca aktif — pertanyaan yang mengarahkan pencarian, bukan trivia. Jawab HANYA daftar, satu pertanyaan per baris, tanpa nomor, tanpa basa-basi.';
    const usr=`Judul: ${b.title}\nPenulis: ${b.author||'tidak diketahui'}\nBahasa jawaban: Indonesia.`;
    const out=await aiCall(sys,usr);
    const qs=out.split('\n').map(l=>l.replace(/^[\d.\-•*)\s]+/,'').trim()).filter(l=>l.length>8).slice(0,6);
    if(!qs.length){area.innerHTML='';toast('AI tak memberi hasil.');return;}
    area.innerHTML=`<div class="ai-panel"><div class="ail"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21l2.3-7.4-6-4.6h7.6z"/></svg>Saran AI — tap + untuk menambahkan</div>
      ${qs.map((q,i)=>`<div class="ai-suggestion"><div class="ai-add" data-q="${escAttr(q)}" data-i="${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg></div><div style="flex:1;font-size:13.5px;line-height:1.45">${esc(q)}</div></div>`).join('')}
      <div style="margin-top:10px"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('aiQArea').innerHTML=''">Tutup</button></div></div>`;
    area.querySelectorAll('.ai-add').forEach(btn=>btn.onclick=()=>{const q=btn.dataset.q;b.questions.push({id:uid(),text:q,answered:false,answer:''});save();btn.classList.add('added');btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>';toast('Pertanyaan ditambahkan.');});
  }catch(e){ area.innerHTML=`<div class="ai-panel"><div class="it" style="color:var(--red)">AI gagal: ${esc(e.message)}</div><div style="margin-top:8px"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('aiQArea').innerHTML=''">Tutup</button></div></div>`; }
}

async function aiFeynmanFeedback(concept,explanation){
  const sys='Anda penguji pemahaman metode Feynman. Nilai apakah penjelasan ini benar-benar jelas untuk orang awam & akurat. Tunjukkan secara spesifik & singkat: bagian mana yang masih kabur/pakai jargon/keliru, dan satu saran perbaikan. Maksimal 4 kalimat. Jujur, tanpa sugarcoating. Bahasa Indonesia.';
  const usr=`Konsep: ${concept}\nPenjelasan awam pengguna:\n${explanation}`;
  return await aiCall(sys,usr);
}

/* ================================================================
   SETTINGS
   ================================================================ */
function openSettings(){
  const s=state.settings;
  modal('Pengaturan',`
    <div class="field"><label>Tema</label><div class="choose-grid" style="grid-template-columns:1fr 1fr" id="setTheme">
      <div class="choose-opt ${s.theme==='light'?'sel':''}" data-t="light"><div class="t">☀ Terang</div></div>
      <div class="choose-opt ${s.theme==='dark'?'sel':''}" data-t="dark"><div class="t">☾ Gelap</div></div></div></div>
    <hr class="soft">
    <div class="field"><label>Integrasi AI <span class="hint">opsional — pakai API key Anda sendiri</span></label>
      <p style="font-size:12.5px;color:var(--ink-faint);line-height:1.5;margin-bottom:10px">Fitur AI (saran pertanyaan pemandu, penilaian Feynman) memerlukan API key Anda. Key disimpan <strong>hanya di browser ini</strong>, tidak dikirim ke mana pun selain penyedia yang Anda pilih. Kosongkan untuk menonaktifkan.</p>
      <select id="setProvider" style="margin-bottom:10px">
        <option value="none" ${s.aiProvider==='none'?'selected':''}>Nonaktif</option>
        <option value="anthropic" ${s.aiProvider==='anthropic'?'selected':''}>Anthropic (Claude)</option>
        <option value="openai" ${s.aiProvider==='openai'?'selected':''}>OpenAI (GPT)</option>
      </select>
      <input type="password" id="setKey" placeholder="API key" value="${escAttr(s.aiKey||'')}" style="margin-bottom:10px">
      <input type="text" id="setModel" placeholder="Model (opsional, mis. claude-sonnet-4-6 / gpt-4o-mini)" value="${escAttr(s.aiModel||'')}">
      <p style="font-size:12px;color:var(--ochre);line-height:1.5;margin-top:10px">⚠ Panggilan AI dari browser bisa memunculkan peringatan CORS pada beberapa penyedia. Anthropic memerlukan header akses-langsung (sudah ditangani). Ada biaya per panggilan sesuai tarif penyedia Anda.</p>
    </div>
    <hr class="soft">
    <div class="field"><label>Data</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" onclick="exportData()">Ekspor backup</button><button class="btn btn-ghost btn-sm" onclick="document.getElementById('fileInput').click()">Impor backup</button></div></div>
  `,[{label:'Tutup',cls:'btn-ghost',close:true},{label:'Simpan',cls:'btn-primary',fn:(bd)=>{
      const t=bd.querySelector('#setTheme .sel'); s.theme=t?t.dataset.t:'light';
      s.aiProvider=bd.querySelector('#setProvider').value; s.aiKey=bd.querySelector('#setKey').value.trim(); s.aiModel=bd.querySelector('#setModel').value.trim();
      save(); applyTheme(); toast('Pengaturan disimpan.'); render(); return true;
    }}],(bd)=>{ bd.querySelectorAll('#setTheme .choose-opt').forEach(o=>o.onclick=()=>{bd.querySelectorAll('#setTheme .choose-opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');}); });
}

/* ================================================================
   GENERIC MODAL HELPER
   ================================================================ */
function modal(title,bodyHTML,buttons,afterMount){
  const bd=document.createElement('div'); bd.className='modal-backdrop';
  bd.innerHTML=`<div class="modal" style="max-width:520px"><div class="modal-head"><h2>${title}</h2><button class="icon-btn" id="mx"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
    <div class="modal-body">${bodyHTML}</div>
    <div class="modal-foot">${buttons.map((b,i)=>`<button class="btn ${b.cls}" data-i="${i}" ${b.style?`style="${b.style}"`:''}>${b.label}</button>`).join('')}</div></div>`;
  document.body.appendChild(bd);
  const close=()=>bd.remove();
  bd.querySelector('#mx').onclick=close; bd.onclick=e=>{if(e.target===bd)close();};
  buttons.forEach((b,i)=>{ bd.querySelector(`[data-i="${i}"]`).onclick=()=>{ if(b.close){close();return;} if(b.fn){const r=b.fn(bd);if(r)close();} }; });
  if(afterMount) afterMount(bd);
}

/* ================================================================
   TIMER & READING SESSION
   ================================================================ */

function timerCardHTML(active){
  const el=timerElapsed(); const isPomo=timer.mode==='pomo';
  const display=isPomo?Math.max(0,POMO_SECONDS-el):el; const pomodone=isPomo&&el>=POMO_SECONDS;
  const mins=Math.max(1,Math.round(el/60));
  return `<div class="chart-panel timer-card">
    <div class="row-between" style="flex-wrap:wrap;gap:10px;margin-bottom:16px">
      <div><h3 style="margin:0">Timer fokus</h3><p class="csub" style="margin:2px 0 0">Baca tanpa distraksi — menit terisi otomatis saat Anda berhenti.</p></div>
      <div class="timer-mode"><button class="tm-opt ${!isPomo?'sel':''}" data-mode="free">Bebas</button><button class="tm-opt ${isPomo?'sel':''}" data-mode="pomo">Pomodoro 25′</button></div>
    </div>
    <div class="timer-display ${pomodone?'done':''}" id="timerDisplay">${fmtClock(display)}</div>
    <div class="timer-controls">
      ${timer.running?`<button class="btn btn-primary" id="tPause">❚❚ Jeda</button>`:`<button class="btn btn-primary" id="tStart">▶ ${el>0?'Lanjut':'Mulai'}</button>`}
      <button class="btn btn-ghost" id="tReset" ${(el===0&&!timer.running)?'disabled style="opacity:.5"':''}>Reset</button>
      ${(el>0&&!timer.running)?`<div class="timer-log"><span class="muted" style="font-size:13px">Catat ${mins} menit ke hari ini?</span><button class="btn btn-ghost btn-sm" id="tLog">Simpan sesi</button></div>`:''}
    </div>
  </div>`;
}

function wireTimer(active){
  const g=id=>document.getElementById(id);
  const st=g('tStart'); if(st) st.onclick=startTimer;
  const pa=g('tPause'); if(pa) pa.onclick=pauseTimer;
  const rs=g('tReset'); if(rs) rs.onclick=resetTimer;
  const lg=g('tLog'); if(lg) lg.onclick=logTimerSession;
  document.querySelectorAll('.tm-opt').forEach(o=>o.onclick=()=>setTimerMode(o.dataset.mode));
}

function startTimer(){ timer.running=true; timer.startTs=Date.now(); renderPlanner(); }
function pauseTimer(){ timer.baseElapsed=timerElapsed(); timer.running=false; timer.startTs=0; renderPlanner(); }
function resetTimer(){ timer.running=false; timer.baseElapsed=0; timer.startTs=0; renderPlanner(); }
function setTimerMode(m){ if(m===timer.mode) return; timer.mode=m; timer.running=false; timer.baseElapsed=0; timer.startTs=0; renderPlanner(); }
function ensureTimerTicking(){ clearInterval(timerInterval); if(timer.running) timerInterval=setInterval(updateTimerDisplay,250); }
function updateTimerDisplay(){
  const disp=document.getElementById('timerDisplay'); if(!disp) return;
  const el=timerElapsed();
  if(timer.mode==='pomo'){ disp.textContent=fmtClock(Math.max(0,POMO_SECONDS-el));
    if(el>=POMO_SECONDS){ disp.classList.add('done'); pauseTimer(); toast('Pomodoro selesai — 25 menit fokus. Catat sesinya di bawah.'); } }
  else disp.textContent=fmtClock(el);
}
function logTimerSession(){
  const el=timerElapsed(); const mins=Math.max(1,Math.round(el/60));
  logToday(0,mins); timer.running=false; timer.baseElapsed=0; timer.startTs=0;
  renderPlanner(); toast(`Sesi ${mins} menit tercatat.`);
}

/* ================================================================
   SEARCH & KEYBOARD SHORTCUTS
   ================================================================ */

let paletteOpen=false;

function openCommandPalette(){
  if(paletteOpen) return; paletteOpen=true;
  const bd=document.createElement('div'); bd.className='modal-backdrop'; bd.id='cmdPalette'; bd.style.paddingTop='56px';
  bd.innerHTML=`<div class="modal" style="max-width:600px">
    <div class="cmd-input-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg><input type="text" id="cmdInput" placeholder="Cari buku, catatan, kutipan, kartu, konsep…" autocomplete="off"></div>
    <div id="cmdResults" class="cmd-results"></div>
    <div class="cmd-hint"><span><kbd>↵</kbd> buka</span><span><kbd>Esc</kbd> tutup</span></div>
  </div>`;
  document.body.appendChild(bd);
  const close=()=>{ bd.remove(); paletteOpen=false; };
  bd.onclick=e=>{ if(e.target===bd) close(); };
  const input=bd.querySelector('#cmdInput'), res=bd.querySelector('#cmdResults');
  const draw=()=>{ const q=input.value; if(!q.trim()){ res.innerHTML=`<div class="cmd-empty">Ketik untuk mencari di seluruh isi — termasuk catatan, kutipan, kartu ingatan, dan uji Feynman.</div>`; return; }
    const r=globalSearch(q);
    if(!r.length){ res.innerHTML=`<div class="cmd-empty">Tak ada hasil untuk "${esc(q)}".</div>`; return; }
    res.innerHTML=r.map((x,i)=>`<div class="cmd-item ${i===0?'active':''}" data-i="${i}"><span class="cmd-type">${x.type}</span><div class="cmd-main"><div class="cmd-label">${esc(x.label)}</div><div class="cmd-snip">${esc(x.snippet)}</div></div></div>`).join('');
    res.querySelectorAll('.cmd-item').forEach(it=>it.onclick=()=>{ const x=r[parseInt(it.dataset.i)]; close(); openBookAt(x.bookId,x.workTab); }); };
  input.oninput=draw; draw(); setTimeout(()=>input.focus(),30);
  input.onkeydown=e=>{ if(e.key==='Enter'){ const r=globalSearch(input.value); if(r.length){ close(); openBookAt(r[0].bookId,r[0].workTab); } } };
}

function handleKeydown(e){
  if(e.key==='Escape'){ const modals=[...document.querySelectorAll('.modal-backdrop')]; if(modals.length){ const top=modals[modals.length-1]; if(top.id==='cmdPalette') paletteOpen=false; top.remove(); e.preventDefault(); } return; }
  if((e.metaKey||e.ctrlKey)&&(e.key==='k'||e.key==='K')){ e.preventDefault(); openCommandPalette(); return; }
  const inField=/^(INPUT|TEXTAREA|SELECT)$/.test((e.target&&e.target.tagName)||'');
  if(inField||e.metaKey||e.ctrlKey||e.altKey) return;
  const k=e.key;
  if(ui.view==='review'){
    const card=document.querySelector('#view .review-card');
    if(card){
      const revealBtn=card.querySelector('button[onclick^="revealCard"]');
      if((k===' '||k==='Enter')&&revealBtn){ e.preventDefault(); revealBtn.click(); return; }
      if(!revealBtn){ const map={'1':'.recall-hard','2':'.recall-ok','3':'.recall-easy'}; if(map[k]){ const btn=card.querySelector(map[k]); if(btn){ e.preventDefault(); btn.click(); return; } } }
    }
  }
  if(k==='n'||k==='N'){ e.preventDefault(); openBookForm(); }
  else if(k==='/'){ e.preventDefault(); ui.view='library'; ui.openBookId=null; render(); const si=document.getElementById('searchInput'); if(si) si.focus(); }
  else if(k==='t'||k==='T'){ toggleTheme(); }
  else if(k==='?'){ shortcutsHelp(); }
}

/* ================================================================
   PWA RUNTIME & INITIALIZATION
   ================================================================ */

// Deep-links from launcher shortcuts
(function handleDeepLink(){
  try{
    const p=new URLSearchParams(location.search).get('view');
    if(p && ['library','planner','review','stats','method'].includes(p)){
      ui.view=p; ui.openBookId=null;
      history.replaceState({},'',location.pathname);
    }
  }catch(e){ }
})();

// Service worker registration
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      reg.addEventListener('updatefound',()=>{
        const nw=reg.installing; if(!nw) return;
        nw.addEventListener('statechange',()=>{
          if(nw.state==='installed' && navigator.serviceWorker.controller){
            showUpdateBar(reg);
          }
        });
      });
    }).catch(err=>console.warn('[pwa] SW registration failed:',err));

    let refreshing=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing) return; refreshing=true; location.reload();
    });
  });
}

function showUpdateBar(reg){
  if(document.getElementById('updateBar')) return;
  const bar=document.createElement('div'); bar.className='update-bar'; bar.id='updateBar';
  bar.innerHTML=`<span>Versi baru tersedia.</span><button id="updateNow">Muat ulang</button>`;
  document.body.appendChild(bar);
  document.getElementById('updateNow').onclick=()=>{
    if(reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
    bar.remove();
  };
  setTimeout(()=>{ if(document.getElementById('updateBar')) bar.remove(); },15000);
}

// Install prompt (Android/Chrome)
let deferredPrompt=null;
const installBtn=document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault(); deferredPrompt=e;
  if(installBtn) installBtn.classList.remove('hide');
});
if(installBtn){
  installBtn.onclick=async()=>{
    if(!deferredPrompt){
      modal('Pasang ke layar utama',`
        <p style="font-size:13.5px;line-height:1.6;margin-bottom:14px">Browser Anda tidak menyediakan tombol pasang otomatis. Lakukan manual:</p>
        <div style="font-size:13.5px;line-height:1.7">
          <strong>Android (Chrome):</strong> menu ⋮ → <em>Tambahkan ke layar utama</em><br>
          <strong>iOS (Safari):</strong> tombol Bagikan → <em>Add to Home Screen</em><br>
          <strong>Desktop (Chrome/Edge):</strong> ikon pasang di ujung kanan address bar
        </div>`,[{label:'Mengerti',cls:'btn-primary',close:true}]);
      return;
    }
    deferredPrompt.prompt();
    const {outcome}=await deferredPrompt.userChoice;
    deferredPrompt=null;
    if(outcome==='accepted'){ installBtn.classList.add('hide'); toast('Aplikasi dipasang ke layar utama.'); }
  };
}
window.addEventListener('appinstalled',()=>{
  deferredPrompt=null;
  if(installBtn) installBtn.classList.add('hide');
  toast('Terpasang. Buka dari layar utama — berjalan offline.');
});
try{
  const standalone=(typeof window.matchMedia==='function' && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone===true;
  if(standalone && installBtn) installBtn.classList.add('hide');
}catch(e){ }

// Offline awareness
window.addEventListener('online',()=>{ updateOnlineState(); toast('Kembali daring.'); });
window.addEventListener('offline',()=>{ updateOnlineState(); toast('Mode luring — aplikasi tetap jalan penuh.'); });
updateOnlineState();

// Top-level wiring
document.querySelectorAll('nav.tabs button').forEach(btn=>btn.onclick=()=>{ui.view=btn.dataset.view;if(ui.view!=='detail')ui.openBookId=null;render();});
document.getElementById('addBookBtn').onclick=openBookForm;
document.getElementById('themeBtn').onclick=toggleTheme;
document.getElementById('settingsBtn').onclick=openSettings;
const _sb=document.getElementById('searchBtn'); if(_sb) _sb.onclick=openCommandPalette;
document.getElementById('fileInput').onchange=e=>{if(e.target.files[0]){importData(e.target.files[0]);e.target.value='';}};
document.addEventListener('keydown',handleKeydown);

// Expose for inline handlers
Object.assign(window,{openBook,openBookForm,editBook,deleteBook,setWorkTab,backToLibrary,toggleQ,delQ,answerQ,delNote,noteToCard,delQuote,delCard,delFeyn,revealCard,gradeCard,exportData,submitLog,openGoalSettings,filterByTag,exportBookMarkdown,dismissBackupNudge,openCommandPalette});

applyTheme(); render();
