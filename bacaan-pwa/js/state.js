/* ================================================================
   STATE MANAGEMENT & DATA STORAGE
   ================================================================ */

const STORE_KEY='bacaan_data_v2';
const SR_INTERVALS=[1,3,7,16,35,75,150];

// Global state
let state=load();
let ui={view:'library',filter:'all',sort:'active',search:'',tag:'',openBookId:null,workTab:'setup'};
let revealed={};
let olTimer=null;
let aiCache={}; // transient per-session cache of AI results
let timer={running:false,startTs:0,baseElapsed:0,mode:'free',bookId:''};
let timerInterval=null;
let _undo=null,_undoT=null;
let backupNudgeDismissed=false;

// Defaults
function defaults(){
  return {
    books:[],
    settings:{ theme:'light', dailyGoalPages:20, dailyGoalMode:'pages', aiProvider:'none', aiKey:'', aiModel:'', lastBackup:null },
    log:{} // { 'YYYY-MM-DD': { pages:Number, minutes:Number } }
  };
}

// Load state from localStorage
function load(){
  try{ 
    const raw=localStorage.getItem(STORE_KEY); 
    if(raw){ 
      const d=JSON.parse(raw); 
      return {...defaults(),...d,settings:{...defaults().settings,...(d.settings||{})},log:d.log||{}}; 
    } 
  }
  catch(e){ console.warn('load failed',e); }
  return defaults();
}

// Save state to localStorage
function save(){ 
  try{ 
    localStorage.setItem(STORE_KEY,JSON.stringify(state)); 
  }catch(e){ 
    toast('Gagal menyimpan — penyimpanan penuh.'); 
  } 
}

// Generate unique ID
function uid(){ 
  return Date.now().toString(36)+Math.random().toString(36).slice(2,7); 
}

/* ---------- DATE HELPERS ---------- */
function dayKey(d){ 
  const x=d?new Date(d):new Date(); 
  return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); 
}

function todayISO(){ 
  const d=new Date(); 
  d.setHours(0,0,0,0); 
  return d.toISOString(); 
}

function daysBetween(a,b){ 
  return Math.round((new Date(b)-new Date(a))/86400000); 
}

function fmtDate(iso){ 
  if(!iso) return '—'; 
  return new Date(iso).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); 
}

function fmtShort(iso){ 
  if(!iso) return '—'; 
  return new Date(iso).toLocaleDateString('id-ID',{day:'numeric',month:'short'}); 
}

/* ---------- TOAST ---------- */
let toastTimer;
function toast(msg){ 
  const t=document.getElementById('toast'); 
  t.textContent=msg; 
  t.classList.add('show'); 
  clearTimeout(toastTimer); 
  toastTimer=setTimeout(()=>t.classList.remove('show'),2800); 
}

// toast with an "Urungkan" (undo) action — restore runs if tapped within the window
function undoable(msg,restore){
  const t=document.getElementById('toast'); 
  _undo=restore;
  t.innerHTML=esc(msg)+' <button id="undoBtn" class="toast-undo">Urungkan</button>';
  t.classList.add('show'); 
  clearTimeout(toastTimer); 
  clearTimeout(_undoT);
  _undoT=setTimeout(()=>{ t.classList.remove('show'); _undo=null; },6000);
  const ub=document.getElementById('undoBtn'); 
  if(ub) ub.onclick=()=>{ 
    if(_undo){_undo();_undo=null;} 
    t.classList.remove('show'); 
    clearTimeout(_undoT); 
  };
}

/* ---------- THEME ---------- */
function applyTheme(){
  document.documentElement.setAttribute('data-theme',state.settings.theme);
  const ic=document.getElementById('themeIcon');
  if(state.settings.theme==='dark'){
    ic.innerHTML='<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  } else {
    ic.innerHTML='<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  }
}

function toggleTheme(){ 
  state.settings.theme=state.settings.theme==='dark'?'light':'dark'; 
  save(); 
  applyTheme(); 
}

/* ---------- BOOK MODEL ---------- */
function newBook(data){
  return {
    id:uid(), title:data.title.trim(), author:(data.author||'').trim(),
    purpose:data.purpose||'deep', status:data.status||'want',
    totalPages:parseInt(data.totalPages)||0, currentPage:0,
    coverUrl:data.coverUrl||'', year:data.year||'', rating:0,
    deadline:data.deadline||'', pagesPerDay:parseInt(data.pagesPerDay)||0,
    tags:Array.isArray(data.tags)?data.tags:[],
    createdAt:todayISO(), startedAt:data.status==='reading'?todayISO():null, finishedAt:null,
    questions:[], notes:[], quotes:[], reviews:[], feynman:[]
  };
}

const PURPOSE={
  reference:{label:'Referensi',badge:'badge-ref',desc:'Dibuka saat butuh'},
  deep:{label:'Pemahaman Dalam',badge:'badge-deep',desc:'Dikuasai tuntas'},
  overview:{label:'Wawasan Umum',badge:'badge-overview',desc:'Tahu garis besar'}
};

const STATUS={
  want:{label:'Ingin Dibaca',badge:'badge-want'},
  reading:{label:'Sedang Dibaca',badge:'badge-reading'},
  paused:{label:'Ditunda',badge:'badge-paused'},
  finished:{label:'Selesai',badge:'badge-finished'}
};

/* ---------- SPACED REPETITION ---------- */
function scheduleNext(review,grade){
  const now=todayISO(); 
  review.history=review.history||[]; 
  review.history.push({date:now,grade}); 
  review.lastReviewed=now;
  
  if(grade==='hard') review.srIndex=0;
  else if(grade==='ok') review.srIndex=Math.min(review.srIndex+1,SR_INTERVALS.length-1);
  else review.srIndex=Math.min(review.srIndex+(review.srIndex===0?1:2),SR_INTERVALS.length-1);
  
  const days=SR_INTERVALS[review.srIndex];
  const d=new Date(); 
  d.setHours(0,0,0,0); 
  d.setDate(d.getDate()+days); 
  review.dueDate=d.toISOString();
}

function dueReviews(){
  const today=new Date(); 
  today.setHours(23,59,59,999); 
  const out=[];
  state.books.forEach(b=>(b.reviews||[]).forEach(r=>{ 
    if(new Date(r.dueDate)<=today) out.push({book:b,review:r}); 
  }));
  out.sort((a,b)=>new Date(a.review.dueDate)-new Date(b.review.dueDate));
  return out;
}

function bookDueCount(b){ 
  const t=new Date(); 
  t.setHours(23,59,59,999); 
  return (b.reviews||[]).filter(r=>new Date(r.dueDate)<=t).length; 
}

/* ---------- READING LOG + STREAK ---------- */
function logToday(pages,minutes){
  const k=dayKey(); 
  if(!state.log[k]) state.log[k]={pages:0,minutes:0};
  state.log[k].pages+=pages||0; 
  state.log[k].minutes+=minutes||0; 
  save();
}

function currentStreak(){
  let streak=0; 
  const d=new Date(); 
  d.setHours(0,0,0,0);
  // allow today to be empty without breaking streak (count from yesterday if today empty)
  const todayK=dayKey(d);
  if(!(state.log[todayK] && (state.log[todayK].pages>0||state.log[todayK].minutes>0))){ 
    d.setDate(d.getDate()-1); 
  }
  while(true){ 
    const k=dayKey(d); 
    const e=state.log[k]; 
    if(e && (e.pages>0||e.minutes>0)){ 
      streak++; 
      d.setDate(d.getDate()-1); 
    } else break; 
  }
  return streak;
}

function longestStreak(){
  const keys=Object.keys(state.log).filter(k=>{
    const e=state.log[k];
    return e&&(e.pages>0||e.minutes>0);
  }).sort();
  
  if(keys.length===0) return 0;
  let best=1,cur=1;
  for(let i=1;i<keys.length;i++){ 
    if(daysBetween(keys[i-1],keys[i])===1){
      cur++;
      best=Math.max(best,cur);
    }else cur=1; 
  }
  return best;
}

function pagesToday(){ 
  const e=state.log[dayKey()]; 
  return e?e.pages:0; 
}

function minutesToday(){ 
  const e=state.log[dayKey()]; 
  return e?e.minutes:0; 
}
