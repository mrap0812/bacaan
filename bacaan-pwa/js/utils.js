/* ================================================================
   UTILITY & HELPER FUNCTIONS
   ================================================================ */

/* ---------- ESCAPING ---------- */
function esc(s){
  if(s==null)return'';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escAttr(s){
  if(s==null)return'';
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ---------- BOOK HELPERS ---------- */
function initials(title){ 
  return (title||'?').split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase(); 
}

function coverHTML(b,cls){
  if(b.coverUrl) return `<div class="${cls}"><img src="${escAttr(b.coverUrl)}" alt="" onerror="this.parentElement.innerHTML='<span class=\\'initials\\'>${esc(initials(b.title))}</span>'"></div>`;
  return `<div class="${cls}"><span class="spine-line"></span><span class="initials">${esc(initials(b.title))}</span></div>`;
}

function getBook(){ 
  return state.books.find(b=>b.id===ui.openBookId); 
}

function allTags(){ 
  const s=new Set(); 
  state.books.forEach(b=>(b.tags||[]).forEach(t=>s.add(t))); 
  return [...s].sort((a,b)=>a.localeCompare(b)); 
}

function filterByTag(t){ 
  ui.tag=t; 
  ui.view='library'; 
  ui.openBookId=null; 
  render(); 
  window.scrollTo(0,0); 
}

/* ---------- TIMER HELPERS ---------- */
const POMO_SECONDS=25*60;

function timerElapsed(){ 
  return Math.floor(timer.baseElapsed + (timer.running ? (Date.now()-timer.startTs)/1000 : 0)); 
}

function fmtClock(sec){ 
  sec=Math.max(0,Math.floor(sec)); 
  const m=Math.floor(sec/60),s=sec%60; 
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); 
}

/* ---------- COMMAND PALETTE / SEARCH ---------- */
function globalSearch(q){
  q=(q||'').trim().toLowerCase(); 
  if(!q) return [];
  const out=[]; 
  const has=(...parts)=>parts.filter(Boolean).join(' ').toLowerCase().includes(q);
  
  state.books.forEach(b=>{
    if(has(b.title,b.author,(b.tags||[]).join(' '))) 
      out.push({type:'Buku',bookId:b.id,workTab:'setup',label:b.title,snippet:b.author||'—'});
    
    b.questions.forEach(x=>{ 
      if(has(x.text,x.answer)) 
        out.push({type:'Pertanyaan',bookId:b.id,workTab:'questions',label:x.text,snippet:b.title}); 
    });
    
    b.notes.forEach(x=>{ 
      if(has(x.summary,x.relation,x.loc)) 
        out.push({type:'Catatan',bookId:b.id,workTab:'notes',label:x.summary,snippet:b.title}); 
    });
    
    b.quotes.forEach(x=>{ 
      if(has(x.text,x.thought,(x.tags||[]).join(' '))) 
        out.push({type:'Kutipan',bookId:b.id,workTab:'quotes',label:x.text,snippet:b.title}); 
    });
    
    b.reviews.forEach(x=>{ 
      if(has(x.prompt,x.answer)) 
        out.push({type:'Kartu',bookId:b.id,workTab:'reviews',label:x.prompt,snippet:b.title}); 
    });
    
    b.feynman.forEach(x=>{ 
      if(has(x.concept,x.explanation,x.gaps)) 
        out.push({type:'Feynman',bookId:b.id,workTab:'feynman',label:x.concept,snippet:b.title}); 
    });
  });
  
  return out.slice(0,40);
}

function openBookAt(id,workTab){ 
  ui.openBookId=id; 
  ui.view='detail'; 
  ui.workTab=workTab||'setup'; 
  render(); 
  window.scrollTo(0,0); 
}

/* ---------- KEYBOARD SHORTCUT HELP ---------- */
function sc(k,d){ 
  return `<div class="sc-row"><kbd>${esc(k)}</kbd><span>${esc(d)}</span></div>`; 
}

function shortcutsHelp(){
  modal('Pintasan keyboard',`
    <div class="shortcut-grid">
      ${sc('⌘ / Ctrl + K','Pencarian global')}
      ${sc('N','Tambah buku')}
      ${sc('/','Fokus kotak cari')}
      ${sc('T','Ganti tema')}
      ${sc('?','Bantuan ini')}
      ${sc('Esc','Tutup dialog')}
    </div>
    <hr class="soft">
    <div style="font-size:12.5px;color:var(--ink-faint);margin-bottom:8px">Saat di "Tinjau Hari Ini":</div>
    <div class="shortcut-grid">
      ${sc('Spasi','Tampilkan jawaban')}
      ${sc('1 / 2 / 3','Sulit / Bisa / Mudah')}
    </div>
  `,[{label:'Tutup',cls:'btn-primary',close:true}]);
}

/* ---------- BACKUP/IMPORT/EXPORT ---------- */
function backupNudgeHTML(){
  if(backupNudgeDismissed||state.books.length===0) return '';
  const lb=state.settings.lastBackup; 
  let show=false,msg='';
  
  if(!lb){ 
    if(state.books.length>=3){ 
      show=true; 
      msg='Anda belum pernah membuat backup.'; 
    } 
  }
  else { 
    const days=daysBetween(lb,new Date().toISOString()); 
    if(days>=14){ 
      show=true; 
      msg=`Sudah ${days} hari sejak backup terakhir.`; 
    } 
  }
  
  if(!show) return '';
  return `<div class="backup-nudge"><div class="bn-txt"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg><span><strong>${esc(msg)}</strong> <span class="muted">Data hanya di browser ini — ekspor agar tidak hilang saat cache dibersihkan.</span></span></div><div class="bn-act"><button class="btn btn-primary btn-sm" onclick="exportData()">Ekspor sekarang</button><button class="icon-btn" onclick="dismissBackupNudge()" title="Tutup" style="width:30px;height:30px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div></div>`;
}

function dismissBackupNudge(){ 
  backupNudgeDismissed=true; 
  if(ui.view==='library') renderLibrary(); 
}

function exportData(){
  state.settings.lastBackup=new Date().toISOString();
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url; 
  a.download=`bacaan-backup-${new Date().toISOString().slice(0,10)}.json`; 
  a.click(); 
  URL.revokeObjectURL(url);
  save(); 
  backupNudgeDismissed=true; 
  if(ui.view==='library') renderLibrary();
  toast('Backup diunduh.');
}

function importData(file){
  const reader=new FileReader();
  reader.onload=e=>{ 
    try{ 
      const data=JSON.parse(e.target.result); 
      if(!data.books||!Array.isArray(data.books)) throw new Error('format');
      
      modal('Impor backup?',`<p style="font-size:14px;line-height:1.6">File ini berisi <strong>${data.books.length} buku</strong>. Impor akan <strong>menimpa</strong> semua data sekarang (${state.books.length} buku). Lanjutkan?</p>`,
        [{label:'Batal',cls:'btn-ghost',close:true},{label:'Timpa & impor',cls:'btn-primary',fn:()=>{
          state={...defaults(),...data,settings:{...defaults().settings,...(data.settings||{})}};
          save();
          applyTheme();
          ui.view='library';
          render();
          toast('Data berhasil diimpor.');
          return true;
        }}]);
    }catch(err){ 
      toast('File tidak valid — bukan backup Bacaan.'); 
    } 
  };
  reader.readAsText(file);
}

function exportBookMarkdown(id){
  const b=state.books.find(x=>x.id===id); 
  if(!b) return;
  
  let md=`# ${b.title}\n\n`;
  if(b.author) md+=`**Penulis:** ${b.author}  \n`;
  md+=`**Tujuan:** ${PURPOSE[b.purpose].label} · **Status:** ${STATUS[b.status].label}  \n`;
  if(b.totalPages) md+=`**Halaman:** ${b.currentPage}/${b.totalPages}  \n`;
  if(b.tags&&b.tags.length) md+=`**Tag:** ${b.tags.join(', ')}  \n`;
  md+=`\n_Diekspor dari Bacaan · ${fmtDate(new Date().toISOString())}_\n\n---\n\n`;
  
  if(b.questions.length){ 
    md+=`## Pertanyaan Pemandu\n\n`; 
    b.questions.forEach(q=>{ 
      md+=`- ${q.answered?'[x]':'[ ]'} **${q.text}**\n`; 
      if(q.answer) md+=`  ${q.answer.replace(/\n/g,'\n  ')}\n`; 
    }); 
    md+=`\n`; 
  }
  
  if(b.notes.length){ 
    md+=`## Catatan\n\n`; 
    b.notes.forEach(n=>{ 
      md+=`### ${n.loc||'Catatan'}\n\n${n.summary}\n\n`; 
      if(n.relation) md+=`> **Hubungan:** ${n.relation}\n\n`; 
    }); 
  }
  
  if(b.quotes.length){ 
    md+=`## Kutipan\n\n`; 
    b.quotes.forEach(q=>{ 
      md+=`> "${q.text}"${q.page?`  \n> — hlm ${q.page}`:''}\n`; 
      if(q.thought) md+=`>\n> _Pikiran: ${q.thought}_\n`; 
      if(q.tags&&q.tags.length) md+=`>\n> Tag: ${q.tags.join(', ')}\n`; 
      md+=`\n`; 
    }); 
  }
  
  if(b.reviews.length){ 
    md+=`## Kartu Ingatan\n\n`; 
    b.reviews.forEach(r=>{ 
      md+=`**T:** ${r.prompt}\n\n**J:** ${r.answer||'_(dinilai dari ingatan)_'}\n\n`; 
    }); 
  }
  
  if(b.feynman.length){ 
    md+=`## Uji Feynman\n\n`; 
    b.feynman.forEach(f=>{ 
      md+=`### ${f.concept} — ${f.verdict==='pass'?'✓ Lolos':'△ Ada celah'}\n\n${f.explanation}\n\n`; 
      if(f.gaps) md+=`> **Lubang:** ${f.gaps}\n\n`; 
    }); 
  }
  
  const blob=new Blob([md],{type:'text/markdown'}); 
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  const slug=(b.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40))||'buku';
  a.href=url; 
  a.download=`${slug}.md`; 
  a.click(); 
  URL.revokeObjectURL(url);
  toast('Catatan diekspor sebagai Markdown.');
}

/* ---------- ONLINE/OFFLINE AWARENESS ---------- */
function updateOnlineState(){
  const off=!navigator.onLine;
  document.querySelectorAll('.offline-chip').forEach(c=>c.remove());
  if(off){
    const brand=document.querySelector('.brand');
    if(brand && !brand.querySelector('.offline-chip')){
      const chip=document.createElement('span'); 
      chip.className='offline-chip';
      chip.innerHTML='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 3-2M2 8.8a15 15 0 0 1 4.2-2.7M22 8.8a15 15 0 0 0-9-3.7M16.7 13a10 10 0 0 0-2.2-1.3M12 20h.01"/></svg>luring';
      brand.appendChild(chip);
    }
  }
}
