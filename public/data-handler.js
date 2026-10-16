/* ═══════════════════════════════════════════════════════
   data-handler.js  —  SBM-G Report
   Data source: public/data/workbook.json (Google Drive se
   GitHub Actions / server.js dwara generate hota hai)
═══════════════════════════════════════════════════════ */
window.S={}; window.Rname={};

/**
 * public/data/workbook.json ko cache-busting ke saath fetch karta hai,
 * taaki browser hamesha purana cached data dikhane ki jagah taza data laye.
 */
async function loadWorkbookData(){
  const url = `data/workbook.json?t=${Date.now()}`;
  const response = await fetch(url, { cache: 'no-store' });
  let result = null;
  try { result = await response.json(); } catch (err) { /* neeche handle hoga */ }
  if(!response.ok || !result || result.success !== true){
    throw new Error((result && result.error) || `workbook.json load nahi ho saka (HTTP ${response.status}).`);
  }
  return result;
}

const ACCEPT={
  census:['census','census data'],
  ration:['ration hh','ration','ration hh data','ration card'],
  imis  :['all ihhl data','all ihhl','ihhl data','imis data','ihhl'],
  csc   :['csc status','csc','iec csc','adarsh shauchalay','samudayik']
};

function parseWorkbook(arrayBuffer){
  const wb=XLSX.read(new Uint8Array(arrayBuffer),{type:'array',cellDates:false});
  S={}; Rname={};
  const exactImis=wb.SheetNames.find(n=>n.trim().toLowerCase()==='all ihhl data');
  if(exactImis){ Rname.imis=exactImis; S.imis=XLSX.utils.sheet_to_json(wb.Sheets[exactImis],{header:1,defval:''}); }
  else{
    const f=wb.SheetNames.find(n=>ACCEPT.imis.includes(n.trim().toLowerCase()));
    if(f){Rname.imis=f; S.imis=XLSX.utils.sheet_to_json(wb.Sheets[f],{header:1,defval:''});}
  }
  ['census','ration','csc'].forEach(key=>{
    const f=wb.SheetNames.find(n=>ACCEPT[key].includes(n.trim().toLowerCase()));
    if(f){Rname[key]=f; S[key]=XLSX.utils.sheet_to_json(wb.Sheets[f],{header:1,defval:''});}
  });
}

function setStatus(msg,type=''){
  const el=document.getElementById('file-status');
  if(!el) return;
  el.textContent=msg; el.className='file-status-pill'+(type?' '+type:'');
}

function renderChips(){
  const chipsEl = document.getElementById('chips');
  if(!chipsEl) return;
  const L={census:'census',ration:'Ration HH',imis:'All IHHL Data',csc:'CSC Status'};
  chipsEl.innerHTML='&nbsp;Sheets:&nbsp;'+
    Object.keys(L).map(k=>`<span class="chip ${S[k]?'ok':'bad'}">${S[k]?'✓ '+Rname[k]:'✗ '+L[k]}</span>`).join('');
}

function renderDebug(){
  const cfg={
    census:{title:'census — GP col C (idx 2)',hilite:[2]},
    ration:{title:'Ration HH — GP col I (idx 8)',hilite:[8]},
    imis:{title:'All IHHL Data — GP col B (idx 1)',hilite:[1]},
    csc:{title:'CSC Status — GP auto-detect',hilite:[]}
  };
  let html='';
  Object.keys(cfg).forEach(k=>{
    const rows=S[k];
    if(!rows){html+=`<div class="dbg-sec"><h4>❌ ${cfg[k].title} — sheet नहीं मिली</h4></div>`;return;}
    const maxC=Math.min((rows[0]||[]).length,27);
    html+=`<div class="dbg-sec"><h4>✅ ${cfg[k].title} (${rows.length} rows)</h4><table class="dtbl-sm"><tbody>`;
    rows.slice(0,5).forEach((row,ri)=>{
      html+='<tr>';
      for(let c=0;c<maxC;c++){
        const tag=ri===0?'th':'td';
        html+=`<${tag} class="${cfg[k].hilite.includes(c)?'hl':''}">${esc(String(row[c]??''))}</${tag}>`;
      }
      html+='</tr>';
    });
    html+=`</tbody></table></div>`;
  });
  const dbgBody = document.getElementById('dbg-body');
  if(dbgBody) {
    dbgBody.innerHTML=html;
  }
}

function buildDropdown(){
  const sel=document.getElementById('gpsel');
  if(!sel) return;
  sel.innerHTML='<option value="">-- GP चुनें --</option>';
  const gpSet=new Set();
  const SKIP=['gp','gram panchayat','gp name','village','population','s.no','sno'];
  const addFrom=(rows,col)=>{
    (rows||[]).forEach((row,i)=>{
      if(i===0)return;
      const v=String(row[col]||'').trim();
      if(v&&!SKIP.includes(v.toLowerCase())) gpSet.add(v);
    });
  };
  addFrom(S.census,2); if(gpSet.size===0) addFrom(S.imis,1);
  [...gpSet].sort().forEach(gp=>{
    const o=document.createElement('option'); o.value=gp; o.textContent=gp; sel.appendChild(o);
  });
  const cEl=document.getElementById('gp-count');
  if(cEl) cEl.textContent=gpSet.size>0?`${gpSet.size} GP`:'';
  if(gpSet.size===0){
    document.getElementById('dbg-body').style.display='block';
    console.warn('GP नहीं मिले! Debug Panel देखें।');
  }
}

function renderAll(){
  const gp=document.getElementById('gpsel').value; if(!gp) return;
  const printGp = document.querySelector('.print-gp-name');
  const printTs = document.querySelector('.print-timestamp');
  if (printGp) printGp.innerText = gp;
  if (printTs) {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    printTs.innerText = now.toLocaleString('en-IN', options).replace(',', '');
  }
  const mc=document.getElementById('mc');
  const ph=mc.querySelector('#placeholder-msg')||mc.querySelector('.placeholder');
  if(ph) ph.remove();
  ['s1','s2','s3','s4'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});
  sec1(gp); sec2(gp); sec3(gp); sec4(gp);
}

function addSec(html){
  const d=document.createElement('div'); d.innerHTML=html;
  document.getElementById('mc').appendChild(d.firstElementChild);
}

function cardGrid(cnt){
  const minW = cnt<=4?'150px': cnt<=6?'130px': cnt<=8?'115px': cnt<=12?'95px':'80px';
  return `repeat(auto-fit, minmax(${minW}, 1fr))`;
}

function sec1(gp){
  let vills=[];
  (S.census||[]).forEach((row,i)=>{
    if(i===0)return;
    if(String(row[2]||'').trim()===gp&&String(row[3]||'').trim())
      vills.push({name:String(row[3]).trim(),pop:num(row[4])});
  });
  const totP=vills.reduce((s,v)=>s+v.pop,0);
  let h=`<div id="s1">
  <div class="sec-title">🏘️ राजस्व ग्राम एवं जनसंख्या विवरण</div>
  <div class="sum-row">
    <div class="sum-box"><div class="lbl">कुल ग्राम</div><div class="val">${vills.length}</div></div>
    <div class="sum-box"><div class="lbl">कुल जनसंख्या</div><div class="val">${totP.toLocaleString('hi-IN')}</div></div>
  </div>
  <div class="cards" style="--card-grid:${cardGrid(vills.length)}">`;
  if(!vills.length) h+=`<p class="no-data">⚠️ census sheet में "${esc(gp)}" नहीं मिला</p>`;
  else vills.forEach(v=>{
    h+=`<div class="card"><div class="nm">${esc(v.name)}</div>
        <div class="cnt">${v.pop.toLocaleString('hi-IN')}</div>
        <div class="sub">जनसंख्या</div></div>`;
  });
  h+=`</div></div>`;
  addSec(h);
}

function sec2(gp){
  let vills=[];
  (S.ration||[]).forEach((row,i)=>{
    if(i===0)return;
    if(String(row[8]||'').trim()===gp&&String(row[9]||'').trim())
      vills.push({name:String(row[9]).trim(),hh:num(row[7])});
  });
  const totHH=vills.reduce((s,v)=>s+v.hh,0);
  let h=`<div id="s2">
  <div class="sec-title">📋 राजस्व ग्राम एवं परिवार (राशन कार्ड डेटा अनुसार)</div>
  <div class="hh-bar"><span>कुल परिवार (HH) :</span><span class="big">${totHH.toLocaleString('hi-IN')}</span></div>
  <div class="cards" style="--card-grid:${cardGrid(vills.length)}">`;
  if(!vills.length) h+=`<p class="no-data">⚠️ Ration HH sheet में "${esc(gp)}" नहीं मिला</p>`;
  else vills.forEach(v=>{
    h+=`<div class="card gr"><div class="nm">${esc(v.name)}</div>
        <div class="cnt">${v.hh.toLocaleString('hi-IN')}</div>
        <div class="sub">परिवार (HH)</div></div>`;
  });
  h+=`</div></div>`;
  addSec(h);
}

// YOUR ORIGINAL EXACT SEC3 LOGIC
function sec3(gp){
  let h=`<div id="s3">`;
  if(!S.imis){
    h+=`<div class="sec-title">📊 All IHHL Data शीट अनुसार कुल लाभार्थी</div>
        <p class="no-data">⚠️ "All IHHL Data" sheet नहीं मिली।</p></div>`;
    addSec(h); return;
  }
  const rows=S.imis, gpIdx=1;
  const gpL=gp.trim().toLowerCase();
  let dataRow=null;
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][gpIdx]||'').trim().toLowerCase()===gpL){dataRow=rows[i];break;}
  }
  if(!dataRow){
    const sample=[];
    for(let i=1;i<Math.min(rows.length,6);i++){const g=String(rows[i][1]||'').trim();if(g)sample.push(g);}
    h+=`<div class="sec-title">📊 All IHHL Data शीट अनुसार कुल लाभार्थी</div>
        <p class="no-data">⚠️ "${esc(gp)}" Col B में नहीं मिला।<br>
        <small>उपलब्ध GP: ${sample.map(esc).join(' | ')||'कोई नहीं'}</small></p></div>`;
    addSec(h); return;
  }
  const v=idx=>esc((dataRow[idx]!==undefined&&dataRow[idx]!=='')?String(dataRow[idx]):'-');

  h+=`
  <div class="ihhl-pdf-block" id="s3p1">
  <div class="sec-title">📊 All IHHL Data शीट अनुसार कुल लाभार्थी (भाग 1: क्र.सं. से कुल परिवार)</div>
  <div class="tbl-wrap"><table class="dtbl ihhl-tbl ihhl-tbl-part1">
  <colgroup>
    <col style="width:42px"><col style="min-width:120px">
    <col style="min-width:52px"><col style="min-width:52px"><col style="min-width:52px">
    <col style="min-width:55px"><col style="min-width:55px"><col style="min-width:55px"><col style="min-width:55px">
    <col style="min-width:57px"><col style="min-width:57px"><col style="min-width:68px">
  </colgroup>
  <thead>
    <tr class="tr-dark">
      <th rowspan="2">क्र.सं.</th>
      <th rowspan="2" style="text-align:left;padding-left:8px">ग्राम पंचायत</th>
      <th colspan="9">वर्ष वार नए IHHL</th>
      <th rowspan="2" class="th-green">कुल परिवार</th>
     </tr>
    <tr class="tr-mid">
      <th>BLS</th><th>LOB</th><th>NLB</th>
      <th>21-22</th><th>22-23</th><th>23-24</th><th>24-25</th>
      <th class="th-yellow">25-26</th><th class="th-yellow">26-27</th>
     </tr>
    <tr class="tr-colnum">
      <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
      <th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th>
     </tr>
  </thead>
  <tbody>
    <tr>
      <td class="td-sno">1</td>
      <td style="text-align:left;padding-left:8px;font-weight:700">${v(gpIdx)}</td>
      <td>${v(2)}</td><td>${v(3)}</td><td>${v(4)}</td>
      <td>${v(5)}</td><td>${v(6)}</td><td>${v(7)}</td><td>${v(8)}</td>
      <td class="hy">${v(9)}</td><td class="hy">${v(10)}</td>
      <td class="hg"><strong>${v(11)}</strong></td>
     </tr>
  </tbody>
  </table></div></div>

  <div class="ihhl-pdf-block" id="s3p2">
  <div class="sec-title">📊 All IHHL Data शीट अनुसार कुल लाभार्थी (भाग 2: शौचालय युक्त एवं लाभान्वित)</div>
  <div class="tbl-wrap"><table class="dtbl ihhl-tbl ihhl-tbl-part2">
  <colgroup>
    <col style="min-width:76px"><col style="min-width:86px"><col style="min-width:66px"><col style="min-width:72px">
    <col style="min-width:65px"><col style="min-width:52px">
    <col style="min-width:52px"><col style="min-width:52px"><col style="min-width:52px"><col style="min-width:52px">
    <col style="min-width:56px"><col style="min-width:56px"><col style="min-width:72px">
    <col style="min-width:80px"><col style="min-width:54px">
  </colgroup>
  <thead>
    <tr class="tr-dark">
      <th colspan="4">शौचालय युक्त परिवार</th>
      <th colspan="9">लाभान्वित परिवार</th>
      <th rowspan="2" class="th-purple">अपात्र<br><small style="font-weight:400;font-size:.65rem">(5+6+7+8+9+10+11) में से</small></th>
      <th rowspan="2" class="th-red">शेष</th>
     </tr>
    <tr class="tr-mid">
      <th>स्वयं के संसाधन</th><th>एनबीए/पीएमएवी/नरेगा</th><th>एसबीएम से</th>
      <th class="th-orange">⭐ कुल स्वीकृत</th>
      <th>SBM &amp; LOB</th><th>NLB</th>
      <th>21-22</th><th>22-23</th><th>23-24</th><th>24-25</th>
      <th class="th-yellow">25-26</th><th class="th-yellow">26-27</th>
      <th class="th-green">कुल लाभान्वित</th>
     </tr>
    <tr class="tr-colnum">
      <th>13</th><th>14</th><th>15</th><th>16</th>
      <th>17</th><th>18</th><th>19</th><th>20</th><th>21</th><th>22</th><th>23</th><th>24</th><th>25</th>
      <th>26</th><th>27</th>
     </tr>
  </thead>
  <tbody>
    <tr>
      <td>${v(12)}</td><td>${v(13)}</td><td>${v(14)}</td>
      <td class="ho"><strong>${v(15)}</strong></td>
      <td>${v(16)}</td><td>${v(17)}</td>
      <td>${v(18)}</td><td>${v(19)}</td><td>${v(20)}</td><td>${v(21)}</td>
      <td class="hy">${v(22)}</td><td class="hy">${v(23)}</td>
      <td class="ho"><strong>${v(24)}</strong></td>
      <td>${v(25)}</td>
      <td class="ho"><strong>${v(26)}</strong></td>
     </tr>
  </tbody>
  </table></div></div></div>`;
  addSec(h);
}

// YOUR ORIGINAL EXACT SEC4 LOGIC
const CSC_COLS=[
  {
    label:'Financial Year',
    aliases:['financial year','fin year','financial yr','fy','वित्तीय वर्ष'],
    tokenSets:[['financial','year'],['fin','year'],['वित्तीय','वर्ष']],
    width:'88px',
    cls:''
  },
  {
    label:'Name of GP',
    aliases:['name of gp','gp name','gram panchayat','name of gram panchayat','ग्राम पंचायत'],
    tokenSets:[['name','gp'],['gram','panchayat'],['ग्राम','पंचायत']],
    width:'110px',
    cls:''
  },
  {
    label:'Name of Village',
    aliases:['name of village','village name','revenue village','ग्राम का नाम','गांव का नाम'],
    tokenSets:[['name','village'],['revenue','village'],['village'],['गांव'],['ग्राम']],
    width:'110px',
    cls:''
  },
  {
    label:'Work Name',
    aliases:['work name','name of work','कार्य का नाम','कार्य नाम'],
    tokenSets:[['work','name'],['name','work'],['कार्य','नाम']],
    width:'200px',
    cls:'hindi-unicode'
  },
  {
    label:'Work Status',
    aliases:['work status','status of work','कार्य स्थिति','कार्य की स्थिति'],
    tokenSets:[['work','status'],['status','work'],['कार्य','स्थिति']],
    width:'95px',
    cls:'hindi-unicode csc-status'
  },
  {
    label:'Geo Tag Status',
    aliases:['geo tag status','geo tagging status','geotag status','geo tag','geo tagging','जियो टैग स्थिति','जियो टैग'],
    tokenSets:[['geo','tag'],['geo','tagging'],['जियो','टैग']],
    width:'92px',
    cls:'hindi-unicode csc-geo'
  },
  {
    label:'SBM Amount',
    aliases:['sbm amount','sanctioned amount','sbm amt','grant amount','sbm grant','राशि'],
    tokenSets:[['sbm','amount'],['sanctioned','amount'],['grant','amount']],
    width:'90px',
    cls:'csc-amt'
  },
  {
    label:'Pending Since',
    aliases:['pending since','pending since date','pending date','लंबित दिनांक','लंबित से'],
    tokenSets:[['pending','since'],['pending','date'],['लंबित','दिनांक'],['लंबित','से']],
    width:'96px',
    cls:'csc-date'
  }
];

function normalizeCSCText(value){
  return String(value??'')
    .toLowerCase()
    .replace(/[\r\n]+/g,' ')
    .replace(/[^a-z0-9\u0900-\u097f]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function scoreCSCHeader(header,col){
  const norm=normalizeCSCText(header);
  if(!norm) return 0;
  let best=0;
  (col.aliases||[]).forEach(alias=>{
    const aliasNorm=normalizeCSCText(alias);
    if(!aliasNorm) return;
    if(norm===aliasNorm) best=Math.max(best,100);
    else if(norm.startsWith(aliasNorm)||norm.endsWith(aliasNorm)) best=Math.max(best,92);
    else if(norm.includes(aliasNorm)) best=Math.max(best,84);
  });
  (col.tokenSets||[]).forEach(tokens=>{
    const tokenMatch=tokens.every(token=>norm.includes(normalizeCSCText(token)));
    if(tokenMatch) best=Math.max(best,68+tokens.length);
  });
  return best;
}

function detectCSCHeaderMap(rows){
  const scanLimit=Math.min(rows.length,5);
  let best={headerRow:0,headers:rows[0]||[],colMap:CSC_COLS.map(()=>-1),score:-1};
  for(let r=0;r<scanLimit;r++){
    const headers=rows[r]||[];
    const candidates=[];
    headers.forEach((header,srcIdx)=>{
      CSC_COLS.forEach((col,ci)=>{
        const score=scoreCSCHeader(header,col);
        if(score>0) candidates.push({ci,srcIdx,score});
      });
    });
    candidates.sort((a,b)=>b.score-a.score||a.srcIdx-b.srcIdx||a.ci-b.ci);
    const rowMap=CSC_COLS.map(()=>-1);
    const usedSrc=new Set();
    let rowScore=0;
    candidates.forEach(candidate=>{
      if(rowMap[candidate.ci]!==-1||usedSrc.has(candidate.srcIdx)) return;
      rowMap[candidate.ci]=candidate.srcIdx;
      usedSrc.add(candidate.srcIdx);
      rowScore+=candidate.score;
    });
    rowScore+=rowMap.filter(idx=>idx!==-1).length*10;
    if(rowScore>best.score) best={headerRow:r,headers,colMap:rowMap,score:rowScore};
  }
  return best;
}

function findCSCColumn(headers,col){
  let bestIdx=-1,bestScore=0;
  headers.forEach((header,idx)=>{
    const score=scoreCSCHeader(header,col);
    if(score>bestScore){bestScore=score;bestIdx=idx;}
  });
  return bestScore>0?bestIdx:-1;
}

function sec4(gp){
  let h=`<div id="s4"><div class="sec-title">🚻 आदर्श / सामुदायिक शौचालय विवरण (CSC Status)</div>`;
  if(!S.csc){ h+=`<p class="no-data">⚠️ CSC Status sheet नहीं मिली।</p></div>`; addSec(h); return; }
  const rows=S.csc;
  const {headerRow,headers:hdrs,colMap}=detectCSCHeaderMap(rows);
  let gpCol=colMap[1];
  if(gpCol===-1){
    gpCol=findCSCColumn(hdrs,CSC_COLS[1]);
  }
  if(gpCol===-1){
    outer: for(let i=headerRow+1;i<Math.min(rows.length,headerRow+21);i++)
      for(let c=0;c<rows[i].length;c++)
        if(normalizeCSCText(rows[i][c])===normalizeCSCText(gp)){gpCol=c;break outer;}
  }
  const gpL=normalizeCSCText(gp);
  const matched=gpCol>-1?rows.filter((r,i)=>i>headerRow&&normalizeCSCText(r[gpCol])===gpL):[];

  h+=`<div class="csc-count-bar">
    <span class="csc-count-pill" style="font-weight:bold; border: 1px solid #000; padding: 5px;">कुल कार्य : <strong>${matched.length}</strong></span>
  </div>
  <div class="tbl-wrap"><table class="dtbl csc-tbl"><thead>
  <tr class="tr-dark">
    <th style="width:44px;min-width:44px">क्र.सं.</th>`;
  CSC_COLS.forEach(col=>{
    h+=`<th style="min-width:${col.width}">${col.label}</th>`;
  });
  h+=`</tr></thead><tbody>`;

  if(gpCol===-1){
    h+=`<tr><td colspan="${CSC_COLS.length+1}" class="no-data">⚠️ CSC sheet में GP column नहीं मिला</td></tr>`;
  } else if(matched.length===0){
    h+=`<tr><td colspan="${CSC_COLS.length+1}" class="no-data">⚠️ "${esc(gp)}" के लिए CSC data नहीं</td></tr>`;
  } else {
    matched.forEach((row,idx)=>{
      h+=`<tr><td class="td-sno">${idx+1}</td>`;
      CSC_COLS.forEach((col,ci)=>{
        const srcIdx=colMap[ci];
        let val=(srcIdx!==-1&&row[srcIdx]!==undefined&&row[srcIdx]!=='')?String(row[srcIdx]):'-';
        h+=`<td class="${col.cls}">${esc(val)}</td>`;
      });
      h+=`</tr>`;
    });
  }
  h+=`</tbody></table></div></div>`;
  addSec(h);
}

function esc(s){
  if(s==null)return'';
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function num(v){const n=parseFloat(String(v||'').replace(/,/g,''));return isNaN(n)?0:Math.round(n);}

window.DataHandler={
  parseWorkbook, renderChips, renderDebug, buildDropdown, renderAll, setStatus, loadWorkbookData,
  
  // 🔥 THE ORIGINAL ACCEPT MATCHING LOGIC
  setWorkbookData: function(sheets, sheetNames) {
    window.S = {}; 
    window.Rname = {};
    
    const exactImis = sheetNames.find(n => n.trim().toLowerCase() === 'all ihhl data');
    if (exactImis) { Rname.imis = exactImis; S.imis = sheets[exactImis]; }
    else {
      const f = sheetNames.find(n => ACCEPT.imis.includes(n.trim().toLowerCase()));
      if (f) { Rname.imis = f; S.imis = sheets[f]; }
    }
    
    ['census','ration','csc'].forEach(key => {
      const f = sheetNames.find(n => ACCEPT[key].includes(n.trim().toLowerCase()));
      if (f) { Rname[key] = f; S[key] = sheets[f]; }
    });

    this.renderChips();
    this.renderDebug();
    this.buildDropdown();
  }
};


;(function (root) {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════════════
     PART 1: Kruti Dev (010/011/016) & DevLys (010/020) → Unicode Converter
     (Built directly into block-report.js so it works even standalone!)
  ═══════════════════════════════════════════════════════════════════════════ */
  const ARRAY_ONE = [
    'ñ', 'Q+Z', 'sas', 'aa', ')Z', 'ZZ', '‘', '’', '“', '”',
    'å', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹',
    '¶+', 'd+', '[+k', '[+', 'x+', 'T+', 't+', 'M+', '<+', 'Q+', ';+', 'j+', 'u+',
    'Ùk', 'Ù', 'ä', '–', '—', 'é', '™', '=kk', 'f=k',
    'à', 'á', 'â', 'ã', 'ºz', 'º', 'í', '{k', '{', '=', '«',
    'Nî', 'Vî', 'Bî', 'Mî', '<î', '|', 'K', '}',
    'J', 'Vª', 'Mª', '<ªª', 'Nª', 'Ø', 'Ý', 'nzZ', 'æ', 'ç', 'Á', 'xz', '#', ':',
    'v‚', 'vkW', 'vks', 'vkS', 'vk', 'v', 'b±', 'Ã', 'bZ', 'b', 'm', 'Å', ',s', ',', '_',
    'ô', 'd', 'Dk', 'D', '[k', '[', 'x', 'Xk', 'X', '?k', '?', '³',
    'pkS', 'p', 'Pk', 'P', 'N', 't', 'Tk', 'T', '>', '÷', '¥',
    'ê', 'ë', 'V', 'B', 'ì', 'ï', 'M+', '<+', 'M', '<', '.k', '.',
    'r', 'Rk', 'R', 'Fk', 'F', ')', 'n', '/k', 'धk', '/', 'Ë', 'è', 'u', 'Uk', 'U',
    'i', 'Ik', 'I', 'Q', '¶', 'c', 'Ck', 'C', 'Hk', 'H', 'e', 'Ek', 'E',
    ';', '¸', 'j', 'y', 'Yk', 'Y', 'G', 'o', 'Ok', 'O',
    "'k", "'", '"k', '"', 'l', 'Lk', 'L', 'g',
    'È', 'z',
    'Ì', 'Í', 'Î', 'Ï', 'Ñ', 'Ò', 'Ó', 'Ô', 'Ö', 'Ø', 'Ù', 'Ük', 'Ü',
    '‚', 'kW', 'ks', 'kS', 'k', 'h', 'q', 'w', '`', 's', 'S',
    'a', '¡', '%', 'W', '•', '·', '∙', '·', '~j', '~', '\\', '+', ' ः',
    '^', '*', 'Þ', 'ß', '(', '¼', '½', '¿', 'À', '¾', 'A', '-', '&', '&', 'Œ', ']', '~ ', '@'
  ];

  const ARRAY_TWO = [
    '॰', 'QZ+', 'sa', 'a', 'र्द्ध', 'Z', '"', '"', "'", "'",
    '०', '१', '२', '३', '४', '५', '६', '७', '८', '९',
    'फ़्', 'क़', 'ख़', 'ख़्', 'ग़', 'ज़्', 'ज़', 'ड़', 'ढ़', 'फ़', 'य़', 'ऱ', 'ऩ',
    'त्त', 'त्त्', 'क्त', 'दृ', 'कृ', 'न्न', 'न्न्', '=k', 'f=',
    'ह्न', 'ह्य', 'हृ', 'ह्म', 'ह्र', 'ह्', 'द्द', 'क्ष', 'क्ष्', 'त्र', 'त्र्',
    'छ्य', 'ट्य', 'ठ्य', 'ड्य', 'ढ्य', 'द्य', 'ज्ञ', 'द्व',
    'श्र', 'ट्र', 'ड्र', 'ढ्र', 'छ्र', 'क्र', 'फ्र', 'र्द्र', 'द्र', 'प्र', 'प्र', 'ग्र', 'रु', 'रू',
    'ऑ', 'ऑ', 'ओ', 'औ', 'आ', 'अ', 'ईं', 'ई', 'ई', 'इ', 'उ', 'ऊ', 'ऐ', 'ए', 'ऋ',
    'क्क', 'क', 'क', 'क्', 'ख', 'ख्', 'ग', 'ग', 'ग्', 'घ', 'घ्', 'ङ',
    'चौ', 'च', 'च', 'च्', 'छ', 'ज', 'ज', 'ज्', 'झ', 'झ्', 'ञ',
    'ट्ट', 'ट्ठ', 'ट', 'ठ', 'ड्ड', 'ड्ढ', 'ड़', 'ढ़', 'ड', 'ढ', 'ण', 'ण्',
    'त', 'त', 'त्', 'थ', 'थ्', 'द्ध', 'द', 'ध', 'ध', 'ध्', 'ध्', 'ध्', 'न', 'न', 'न्',
    'प', 'प', 'प्', 'फ', 'फ्', 'ब', 'ब', 'ब्', 'भ', 'भ्', 'म', 'म', 'म्',
    'य', 'य्', 'र', 'ल', 'ल', 'ल्', 'ळ', 'व', 'व', 'व्',
    'श', 'श्', 'ष', 'ष्', 'स', 'स', 'स्', 'ह',
    'ीं', '्र',
    'द्द', 'ट्ट', 'ट्ठ', 'ड्ड', 'कृ', 'भ', '्य', 'ड्ढ', 'झ्', 'क्र', 'त्त्', 'श', 'श्',
    'ॉ', 'ॉ', 'ो', 'ौ', 'ा', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै',
    'ं', 'ँ', 'ः', 'ॅ', 'ऽ', 'ऽ', 'ऽ', 'ऽ', '्र', '्', '?', '़', ':',
    '‘', '’', '“', '”', ';', '(', ')', '{', '}', '=', '।', '.', '-', 'µ', '॰', ',', '् ', '/'
  ];

  const KNOWN_ENGLISH_WORDS = new Set([
    'nlb', 'ihhl', 'to', 'new', 'consolidate', 'consolidated', 'report', 'success',
    'pending', 'at', 'jta', 'as', 'due', 'vdo', 'land', 'allotment', 'work', 'ts', 'fs',
    'sbm', 'odf', 'plus', 'csc', 'rrc', 'aip', 'gp', 'ps', 'uc', 'bpl', 'apl', 'lwm', 'swm',
    'ffc', 'nrega', 'green', 'yello', 'yellow', 'red', 'zone', 'zones', 'total', 'sr', 'no',
    'sno', 'target', 'sanctioned', 'geo', 'tagged', 'tag', 'paid', 'payment', 'percantage',
    'percentage', 'aspiring', 'rising', 'model', 'village', 'door', 'collection', 'year',
    'complete', 'completed', 'geotagged', 'sanction', 'issued', 'cancelled', 'not', 'start',
    'in', 'progress', 'plinth', 'level', 'lintle', 'lintel', 'roof', 'final', 'form',
    'propsal', 'proposal', 'sent', 'sdm', 'office', 'allotted', 'under', 'construction',
    'head', 'name', 'of', 'physical', 'status', 'financial', 'expenditure', 'from', 'average',
    'block', 'overall', 'achievement', 'date', 'tendor', 'tender', 'open', 'firm', 'rate',
    'owner', 'mobile', 'order', 'timeline', 'amount', 'yes', 'soak', 'pit', 'compost',
    'individual', 'assest', 'asset', 'combine', 'category', 'done', 'offline', 'online',
    'bsr', 'cancel', 'deogarh', 'rajsamand',
    'april', 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ]);

  function looksLikeKrutiDev(text) {
    if (text == null) return false;
    const s = String(text).trim();
    if (!s) return false;
    const hasDevanagari = /[\u0900-\u097F]/.test(s);
    if (/[Øç¼½±ÆÇÉÊÙ]/.test(s)) return true;
    if (/fnukad|iapk;r|xzke|'kkSpky;|fuekZ\.k|LoPN|fjiksVZ|lfefr|nsox<\+|jktleUn|;ksx|Hkqxrku|fcykuke|vkaxuokM|lkeqnkf;d|ekWfuVfjax|dkWih|vkWuykbZu/.test(s)) {
      return true;
    }
    if (hasDevanagari) return false;
    const krutiTokens = [
      /\b(ds|dk|dh|esa|ls|ij|gS|gSa|ugha|rFkk|,oa|Jh|xzke|iapk;r|dk;Z|lfefr|ftyk|fodkl|LoPN|Hkkjr|fe'ku|çxfr|fjiksVZ|fnukad|;ksx|dqy|y{;|Loh—r|Hkqxrku|fcykuke|dkWih|vkWuykbZu|odZ|vkWMZj|Vs\.Mj)\b/,
      /[a-zA-Z]\+[a-zA-Z]?/,
      /[a-zA-Z];[a-zA-Z]/,
      /'kk|"kk|ksM\+|kSM\+|pkS|fd;k|x;k|tkjh|orZeku/
    ];
    return krutiTokens.some((re) => re.test(s));
  }

  function rawKrutiToUnicode(input) {
    if (input == null || input === '') return '';
    let modified = String(input);

    for (let i = 0; i < ARRAY_ONE.length; i++) {
      const from = ARRAY_ONE[i];
      const to = ARRAY_TWO[i];
      let idx = modified.indexOf(from);
      while (idx !== -1) {
        modified = modified.replace(from, to);
        idx = modified.indexOf(from);
      }
    }

    modified = modified.replace(/±/g, 'Zं');
    modified = modified.replace(/Æ/g, 'र्f');

    let posI = modified.indexOf('f');
    while (posI !== -1) {
      const nextChar = modified.charAt(posI + 1);
      if (!nextChar) break;
      modified = modified.replace('f' + nextChar, nextChar + 'ि');
      posI = modified.indexOf('f', posI + 1);
    }

    modified = modified.replace(/Ç/g, 'fa');
    modified = modified.replace(/É/g, 'र्fa');

    posI = modified.indexOf('fa');
    while (posI !== -1) {
      const nextChar = modified.charAt(posI + 2);
      if (!nextChar) break;
      modified = modified.replace('fa' + nextChar, nextChar + 'िं');
      posI = modified.indexOf('fa', posI + 2);
    }

    modified = modified.replace(/Ê/g, 'ीZ');

    let posWrongEe = modified.indexOf('ि्');
    while (posWrongEe !== -1) {
      const consNext = modified.charAt(posWrongEe + 2);
      if (!consNext) break;
      modified = modified.replace('ि्' + consNext, '्' + consNext + 'ि');
      posWrongEe = modified.indexOf('ि्', posWrongEe + 2);
    }

    const matras = 'अ आ इ ई उ ऊ ए ऐ ओ औ ऑ ा ि ी ु ू ृ े ै ो ौ ॉ ं : ँ ॅ';
    let posR = modified.indexOf('Z');
    let safety = 0;
    while (posR > 0 && safety < 500) {
      safety++;
      let probPos = posR - 1;
      let ch = modified.charAt(probPos);
      while (probPos > 0 && matras.indexOf(ch) !== -1) {
        probPos -= 1;
        ch = modified.charAt(probPos);
      }
      while (probPos >= 2 && modified.charAt(probPos - 1) === '्') {
        probPos -= 2;
      }
      const target = modified.substring(probPos, posR);
      modified =
        modified.substring(0, probPos) +
        'र्' +
        target +
        modified.substring(posR + 1);
      posR = modified.indexOf('Z');
    }

    modified = modified.replace(/आॅ/g, 'ऑ').replace(/ाॅ/g, 'ॉ').replace(/अा/g, 'आ');
    modified = modified.replace(/दिनांक:-/g, 'दिनांक :-');
    return modified;
  }

  function isPureEnglishOrCodeToken(token) {
    const t = token.trim();
    if (!t) return true;
    if (/^[₹$0-9.,%+\-*/()=\s:]+$/.test(t)) return true;
    if (/^(Work|AS|TS|FS|SPL|Spl)\s*[/\-]\s*[0-9]/i.test(t)) return true;
    const clean = t.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
    if (clean && KNOWN_ENGLISH_WORDS.has(clean) && !/[;+Øç¼½]/.test(t)) {
      return true;
    }
    return false;
  }

  function convertTextSmart(text, forceKruti = false) {
    if (text == null || text === '') return '';
    if (typeof text === 'number' || typeof text === 'boolean') return String(text);

    const str = String(text).replace(/आॅ/g, 'ऑ').replace(/ाॅ/g, 'ॉ').replace(/अा/g, 'आ');
    if (/^[\d\s.,%+\-*/():₹]+$/.test(str.trim())) return str;
    if (/^(Work|AS|TS|FS|SPL|Spl)\s*[/\-]\s*\d/i.test(str.trim())) return str;
    if (/^(Pending At JTA|Pending At VDO|AS Due at VDO|Land Allotment Due|Complete|Work In Progress|Cancelled|Not Start|Plinth Level|Lintle Level|Roof Level|Done|Due|Yes|No|Total|TOTAL|Green Zone|Yello Zone|Yellow Zone|Red Zone|BSR|AS Due|TS Due|No Target)$/i.test(str.trim())) {
      return str;
    }

    const shouldConvert = forceKruti || looksLikeKrutiDev(str);
    if (!shouldConvert) return str;

    return str
      .split(/\r?\n/)
      .map((line) => {
        if (!line.trim()) return line;
        const parts = line.match(/\S+|\s+/g) || [line];
        const segments = [];
        for (const part of parts) {
          if (/^\s+$/.test(part)) {
            if (segments.length > 0) {
              segments[segments.length - 1].text += part;
            } else {
              segments.push({ isEng: true, text: part });
            }
            continue;
          }
          const isEng = isPureEnglishOrCodeToken(part);
          if (segments.length > 0 && segments[segments.length - 1].isEng === isEng) {
            segments[segments.length - 1].text += part;
          } else {
            segments.push({ isEng, text: part });
          }
        }
        return segments
          .map((seg) => (seg.isEng ? seg.text : rawKrutiToUnicode(seg.text)))
          .join('');
      })
      .join('\n');
  }

  if (!root.KrutiDevConverter) {
    root.KrutiDevConverter = {
      looksLikeKrutiDev,
      rawKrutiToUnicode,
      convertTextSmart
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PART 2: 14-Sheet / 19-Page Block Report Renderer & PDF Exporter
  ═══════════════════════════════════════════════════════════════════════════ */
  const BLOCK_REPORT_SHEETS = [
    'Summary',
    'ODF Plus',
    'CSC 23-24',
    'CSC 24-25',
    'CSC 25-26',
    'CSC 26-27',
    'RRC Updated (4)',
    'All IHHL Data Combine',
    'Tender Report 26-27',
    'Target AIP 26-27',
    'AIP 26-27 Financial',
    'Soak Pit 26-27',
    'Compost Pit 26-27',
    'Individual assest 26-27'
  ];

  let blockPayload = null;
  let activeSheetFilter = 'ALL';
  let isExportingPdf = false;

  function ensureBlockPrintStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('block-report-container') && !document.getElementById('gpsel')) {
      document.querySelectorAll('link[rel="stylesheet"]').forEach((lnk) => {
        const href = lnk.getAttribute('href') || '';
        if (href.includes('style.css')) {
          lnk.disabled = true;
          if (lnk.parentNode) lnk.parentNode.removeChild(lnk);
        }
      });
    }
    let style = document.getElementById('block-report-auto-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'block-report-auto-styles';
      document.head.appendChild(style);
    }
    style.textContent = `
  @page {
    size: A4 landscape;
    margin: 6mm 8mm;
  }
  @page block-portrait {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
  @page block-landscape {
    size: A4 landscape;
    margin: 6mm 8mm;
  }

  .excel-print-page {
    background: #ffffff;
    color: #000000;
    font-family: 'Noto Sans Devanagari', 'Calibri', 'Arial', sans-serif;
    width: 100%;
  }
  .excel-sheet-tbl {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
    background: #ffffff;
    color: #000000;
    border: none !important;
  }
  .excel-sheet-tbl td, .excel-sheet-tbl th {
    padding: 4px 6px;
    line-height: 1.25;
    word-break: normal;
    overflow-wrap: break-word;
    color: #000000;
    font-family: 'Noto Sans Devanagari', 'Calibri', 'Arial', sans-serif;
  }
  .excel-sheet-tbl.compact-7col td {
    padding: 5px 8px;
    line-height: 1.28;
  }
  .excel-sheet-tbl.wide-13col td {
    padding: 3.5px 5px;
    line-height: 1.2;
  }
  .excel-sheet-tbl.dense-sheet td {
    padding: 3px 4px;
    line-height: 1.15;
  }
  .excel-sheet-tbl td.nowrap-cell {
    white-space: nowrap !important;
    word-break: keep-all !important;
    overflow-wrap: normal !important;
  }
  .excel-acct-cell {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 4px;
    white-space: nowrap;
  }
  .excel-acct-cell .rupee-sym { font-weight: 500; }
  .excel-acct-cell .rupee-val { text-align: right; margin-left: auto; }

  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: auto !important;
      zoom: 1 !important;
    }
    .no-print, .header, .upload-bar, .status-bar, .gp-bar, .action-buttons, .sheet-tabs-bar, .block-sheet-bar, .pdf-modal, .print-header, #debug-panel {
      display: none !important;
    }
    .container, .content, #block-report-container, .block-sheet-section {
      max-width: none !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #ffffff !important;
      overflow: visible !important;
    }
    .excel-page-card {
      border: none !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 auto !important;
      width: 100% !important;
      max-width: 100% !important;
      background: #ffffff !important;
      overflow: visible !important;
      page-break-inside: avoid !important;
      break-inside: avoid-page !important;
      page-break-after: always !important;
      break-after: page !important;
    }
    .excel-page-card.portrait {
      page: block-portrait !important;
      max-width: 190mm !important;
    }
    .excel-page-card.landscape {
      page: block-landscape !important;
      max-width: 281mm !important;
    }
    .block-sheet-section:last-of-type .excel-page-card:last-of-type {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .excel-print-page {
      width: 100% !important;
      margin: 0 auto !important;
      overflow: visible !important;
    }
    .excel-sheet-tbl {
      width: 100% !important;
      margin: 0 auto !important;
      border-collapse: collapse !important;
      border: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .excel-sheet-tbl.compact-7col {
      max-width: 244mm !important;
    }
    .excel-sheet-tbl tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      min-height: 0 !important;
      height: auto !important;
    }
    .excel-sheet-tbl tr.excel-spacer-row,
    .excel-sheet-tbl tr.excel-spacer-row td {
      height: 5px !important;
      max-height: 5px !important;
      min-height: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: transparent !important;
    }
    /* Portrait Summary print typography */
    .excel-print-page.portrait .excel-sheet-tbl td.cell-sz-body {
      font-size: 8pt !important;
      padding: 1.8px 3.5px !important;
      line-height: 1.1 !important;
    }
    .excel-print-page.portrait .excel-sheet-tbl td.cell-sz-sec {
      font-size: 9.5pt !important;
      padding: 2px 3.5px !important;
      line-height: 1.12 !important;
    }
    .excel-print-page.portrait .excel-sheet-tbl td.cell-sz-sub {
      font-size: 11.5pt !important;
      padding: 3px 4px !important;
      line-height: 1.18 !important;
    }
    .excel-print-page.portrait .excel-sheet-tbl td.cell-sz-title {
      font-size: 16pt !important;
      padding: 2px 4px !important;
      line-height: 1.15 !important;
    }
    /* Landscape 7-col compact print typography */
    .excel-sheet-tbl.compact-7col td.cell-sz-body {
      font-size: 8.5pt !important;
      padding: 2.2px 5px !important;
      line-height: 1.14 !important;
    }
    .excel-sheet-tbl.compact-7col td.cell-sz-sec {
      font-size: 9.5pt !important;
      padding: 2.5px 5px !important;
      line-height: 1.15 !important;
    }
    .excel-sheet-tbl.compact-7col td.cell-sz-sub {
      font-size: 11pt !important;
      padding: 2.5px 5px !important;
      line-height: 1.15 !important;
    }
    .excel-sheet-tbl.compact-7col td.cell-sz-title {
      font-size: 15pt !important;
      padding: 3px 5px !important;
      line-height: 1.15 !important;
    }
    /* Landscape 8-11 col medium print typography */
    .excel-sheet-tbl.med-sheet td.cell-sz-body {
      font-size: 8pt !important;
      padding: 2px 3.5px !important;
      line-height: 1.12 !important;
    }
    .excel-sheet-tbl.med-sheet td.cell-sz-sec {
      font-size: 9pt !important;
      padding: 2px 4px !important;
      line-height: 1.14 !important;
    }
    .excel-sheet-tbl.med-sheet td.cell-sz-sub {
      font-size: 11pt !important;
      padding: 2.5px 4px !important;
      line-height: 1.15 !important;
    }
    .excel-sheet-tbl.med-sheet td.cell-sz-title {
      font-size: 15pt !important;
      padding: 3px 4px !important;
      line-height: 1.15 !important;
    }
    /* Landscape 12-14 col (RRC Updated 4) print typography */
    .excel-sheet-tbl.wide-13col td.cell-sz-body {
      font-size: 6.8pt !important;
      padding: 1.5px 2.5px !important;
      line-height: 1.08 !important;
    }
    .excel-sheet-tbl.wide-13col td.cell-sz-sec {
      font-size: 8pt !important;
      padding: 1.8px 3px !important;
      line-height: 1.1 !important;
    }
    .excel-sheet-tbl.wide-13col td.cell-sz-sub {
      font-size: 10pt !important;
      padding: 2px 3px !important;
      line-height: 1.12 !important;
    }
    .excel-sheet-tbl.wide-13col td.cell-sz-title {
      font-size: 14pt !important;
      padding: 2.5px 3px !important;
      line-height: 1.12 !important;
    }
    /* Landscape 15-21 col dense (All IHHL Combine, Target AIP, Financial) print typography */
    .excel-sheet-tbl.dense-sheet td.cell-sz-body,
    .excel-sheet-tbl.dense-sheet td.cell-sz-sm {
      font-size: 5.8pt !important;
      padding: 1.2px 1.8px !important;
      line-height: 1.04 !important;
    }
    .excel-sheet-tbl.dense-sheet td.cell-sz-sec {
      font-size: 7.2pt !important;
      padding: 1.5px 2px !important;
      line-height: 1.08 !important;
    }
    .excel-sheet-tbl.dense-sheet td.cell-sz-sub {
      font-size: 9.5pt !important;
      padding: 2px 2.5px !important;
      line-height: 1.1 !important;
    }
    .excel-sheet-tbl.dense-sheet td.cell-sz-title {
      font-size: 13pt !important;
      padding: 2px 3px !important;
      line-height: 1.12 !important;
    }
  }
`;
  }

  function escHtml(val) {
    if (val === null || val === undefined) return '';
    return String(val).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function ensureUnicodeText(text, forceKruti = false) {
    if (text === null || text === undefined || text === '') return '';
    let s = String(text).replace(/आॅ/g, 'ऑ').replace(/ाॅ/g, 'ॉ').replace(/अा/g, 'आ');
    return convertTextSmart(s, forceKruti).replace(/आॅ/g, 'ऑ').replace(/ाॅ/g, 'ॉ').replace(/अा/g, 'आ');
  }


  const EMBEDDED_BLOCK_REPORT_GZ_B64 = "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";

  async function decodeEmbeddedBlockReport() {
    if (!EMBEDDED_BLOCK_REPORT_GZ_B64 || typeof DecompressionStream === "undefined") return null;
    try {
      const binStr = atob(EMBEDDED_BLOCK_REPORT_GZ_B64);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      const ds = new DecompressionStream("gzip");
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const text = await new Response(ds.readable).text();
      return JSON.parse(text);
    } catch (e) {
      console.warn("Embedded fallback decode warning:", e);
      return null;
    }
  }

  async function loadBlockReportData(forceServerRefresh = false) {
    if (forceServerRefresh) {
      try {
        await fetch('/api/refresh', { method: 'POST' });
      } catch (_) {}
    }
    const candidateUrls = [
      `data/block-report.json?t=${Date.now()}`,
      `./data/block-report.json?t=${Date.now()}`,
      `/SBM-Report/data/block-report.json?t=${Date.now()}`
    ];
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success === true && Array.isArray(data.sheets)) {
            blockPayload = data;
            return data;
          }
        }
      } catch (_) {}
    }
    const embedded = await decodeEmbeddedBlockReport();
    if (embedded && embedded.success === true) {
      blockPayload = embedded;
      return embedded;
    }
    throw new Error('block-report.json लोड नहीं हो सका');
  }

  function isTotalRow(row) {
    if (!row || !Array.isArray(row.cells)) return false;
    for (let i = 0; i < Math.min(row.cells.length, 4); i++) {
      const txt = ensureUnicodeText(row.cells[i].v || '').trim();
      if (/^(total|योग|कुल योग)$/i.test(txt)) {
        return true;
      }
    }
    return false;
  }

  function isRowEmpty(row) {
    if (!row || !Array.isArray(row.cells)) return true;
    return row.cells.every((c) => (!c.v || String(c.v).trim() === '') && !c.bd && !c.bg);
  }

  function splitSheetIntoPrintPages(sheet) {
    const rows = sheet.rows || [];
    if (rows.length === 0) return [];

    const nameNorm = sheet.name.trim().toLowerCase();

    if (nameNorm === 'summary') {
      let splitIdx = rows.findIndex((r) =>
        (r.cells || []).some((c) => String(c.v || '').includes('2025-26') && String(c.v || '').includes('CSC'))
      );
      if (splitIdx === -1) {
        splitIdx = rows.findIndex((r) => r.r > 34);
      }
      if (splitIdx > 0) {
        let p1End = splitIdx;
        while (p1End > 1 && isRowEmpty(rows[p1End - 1])) {
          p1End--;
        }
        const page1Rows = rows.slice(0, p1End);
        const page2Rows = rows.slice(splitIdx);
        return [
          {
            sheetName: sheet.name,
            pagePart: 1,
            totalParts: 2,
            orientation: 'portrait',
            cols: sheet.cols,
            rows: page1Rows
          },
          {
            sheetName: sheet.name,
            pagePart: 2,
            totalParts: 2,
            orientation: 'portrait',
            cols: sheet.cols,
            rows: page2Rows
          }
        ];
      }
      return [
        {
          sheetName: sheet.name,
          pagePart: 1,
          totalParts: 1,
          orientation: 'portrait',
          cols: sheet.cols,
          rows
        }
      ];
    }

    const orientation = sheet.orientation === 'portrait' ? 'portrait' : 'landscape';

    const tableBlocks = [];
    let blockStart = 0;

    for (let i = 0; i < rows.length; i++) {
      if (i - blockStart >= 8 && isTotalRow(rows[i])) {
        const remainingNonEmpty = rows.slice(i + 1).filter((r) => !isRowEmpty(r)).length;
        if (remainingNonEmpty >= 5) {
          tableBlocks.push(rows.slice(blockStart, i + 1));
          let nextStart = i + 1;
          while (nextStart < rows.length && isRowEmpty(rows[nextStart])) {
            nextStart++;
          }
          blockStart = nextStart;
          i = nextStart - 1;
        }
      }
    }

    if (tableBlocks.length > 0) {
      if (blockStart < rows.length) {
        const tail = rows.slice(blockStart).filter((r, idx, arr) => !(idx === arr.length - 1 && isRowEmpty(r)));
        if (tail.length > 0) tableBlocks.push(tail);
      }
      return tableBlocks.map((blockRows, idx) => ({
        sheetName: sheet.name,
        pagePart: idx + 1,
        totalParts: tableBlocks.length,
        orientation,
        cols: sheet.cols,
        rows: blockRows
      }));
    }

    return [
      {
        sheetName: sheet.name,
        pagePart: 1,
        totalParts: 1,
        orientation,
        cols: sheet.cols,
        rows
      }
    ];
  }

  function getPageRenderMetrics(page) {
    const colCount = (page.cols || []).length;
    const sheetLower = (page.sheetName || '').trim().toLowerCase();

    if (page.orientation === 'portrait') {
      return {
        captureWidthPx: 780,
        paddingCss: '10px 14px',
        baseFontPx: 12,
        maxPdfWidthMm: 190
      };
    }

    if (colCount <= 7) {
      return {
        captureWidthPx: 940,
        paddingCss: '8px 12px',
        baseFontPx: 13.5,
        maxPdfWidthMm: 244
      };
    }

    if (colCount === 8) {
      return {
        captureWidthPx: 1000,
        paddingCss: '8px 12px',
        baseFontPx: 13,
        maxPdfWidthMm: 248
      };
    }

    if (colCount <= 11) {
      return {
        captureWidthPx: 1140,
        paddingCss: '8px 12px',
        baseFontPx: 12,
        maxPdfWidthMm: 268
      };
    }

    if (colCount <= 14) {
      return {
        captureWidthPx: 1320,
        paddingCss: '8px 10px',
        baseFontPx: 11.5,
        maxPdfWidthMm: 277
      };
    }

    return {
      captureWidthPx: sheetLower.includes('financial') ? 1760 : 1680,
      paddingCss: '6px 8px',
      baseFontPx: 11,
      maxPdfWidthMm: 281
    };
  }

  function buildPrintPageHtml(page, forPdfCapture = false) {
    const cols = page.cols || [];
    const colCount = cols.length || 1;
    const totalExcelWidth = cols.reduce((acc, c) => acc + Math.max(c.width || 10, 4), 0) || 100;
    const metrics = getPageRenderMetrics(page);
    const baseFontPx = metrics.baseFontPx;
    const isDenseSheet = colCount >= 15;
    const isWide13Col = colCount >= 12 && colCount < 15;
    const isCompact7Col = colCount <= 7 && page.orientation === 'landscape';
    const isMedSheet = !isDenseSheet && !isWide13Col && !isCompact7Col && page.orientation === 'landscape';
    const sheetLower = (page.sheetName || '').trim().toLowerCase();
    const isIhhlCombine = sheetLower.includes('ihhl data combine');

    const tblClasses = ['excel-sheet-tbl'];
    if (isDenseSheet) tblClasses.push('dense-sheet');
    else if (isWide13Col) tblClasses.push('wide-13col');
    else if (isCompact7Col) tblClasses.push('compact-7col');
    else if (isMedSheet) tblClasses.push('med-sheet');

    let html = `<div class="excel-print-page ${page.orientation} ${forPdfCapture ? 'pdf-capture-mode' : ''}" data-sheet="${escHtml(page.sheetName)}" data-orientation="${page.orientation}">`;
    html += `<table class="${tblClasses.join(' ')}" style="border:none !important">`;
    html += `<colgroup>`;
    for (const col of cols) {
      const pct = ((Math.max(col.width || 10, 4) / totalExcelWidth) * 100).toFixed(2);
      html += `<col style="width:${pct}%">`;
    }
    html += `</colgroup><tbody>`;

    const rows = page.rows || [];
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      const rawCells = row.cells || [];

      if (isRowEmpty(row)) {
        const spacerHt = row.ht ? Math.min(Math.round(row.ht * 0.65), 12) : 8;
        html += `<tr class="excel-spacer-row" style="height:${spacerHt}px"><td colspan="${colCount}" style="border:none !important;padding:0 !important;background:transparent !important;height:${spacerHt}px"></td></tr>`;
        continue;
      }

      const processedCells = [];
      for (let cIdx = 0; cIdx < rawCells.length; cIdx++) {
        const cell = { ...rawCells[cIdx] };
        const maxRemainingRows = rows.length - rIdx;
        if (cell.rs && cell.rs > maxRemainingRows) {
          cell.rs = maxRemainingRows;
        }

        const hasText = cell.v !== null && cell.v !== undefined && String(cell.v).trim() !== '';
        const isBorderless = !cell.bd && !cell.bg;

        if (isBorderless && (!cell.cs || cell.cs === 1) && (!cell.rs || cell.rs === 1)) {
          let extraSpan = 0;
          while (cIdx + 1 < rawCells.length) {
            const nextC = rawCells[cIdx + 1];
            const nextEmpty = !nextC.v || String(nextC.v).trim() === '';
            const nextBorderless = !nextC.bd && !nextC.bg && (!nextC.rs || nextC.rs === 1) && (!nextC.cs || nextC.cs === 1);
            const expectedNextCol = cell.c + extraSpan + 1;
            if (nextEmpty && nextBorderless && nextC.c === expectedNextCol) {
              extraSpan++;
              cIdx++;
            } else {
              break;
            }
          }
          if (extraSpan > 0) {
            cell.cs = 1 + extraSpan;
          }
        }

        processedCells.push(cell);
      }

      const rowIsTotal = isTotalRow(row);
      const rowStyle = '';
      html += `<tr ${rowStyle}>`;

      for (const cell of processedCells) {
        const attrs = [];
        if (cell.rs && cell.rs > 1) attrs.push(`rowspan="${cell.rs}"`);
        if (cell.cs && cell.cs > 1) attrs.push(`colspan="${cell.cs}"`);

        const rawText = ensureUnicodeText(cell.v ?? '');
        const trimmedText = rawText.trim();

        const styles = [];
        if (cell.bd) {
          const [bt, br, bb, bl] = cell.bd;
          styles.push(`border-top:${bt ? '1px solid #000' : 'none'} !important`);
          styles.push(`border-right:${br ? '1px solid #000' : 'none'} !important`);
          styles.push(`border-bottom:${bb ? '1px solid #000' : 'none'} !important`);
          styles.push(`border-left:${bl ? '1px solid #000' : 'none'} !important`);
        } else {
          styles.push('border:none !important');
        }

        let bg = cell.bg || null;
        if (isIhhlCombine && rIdx >= 5 && !rowIsTotal) {
          if (cell.c === 12 && trimmedText === '0') {
            bg = bg || '#00B050';
          } else if ((cell.c === 17 || cell.c === 16) && /^-\d/.test(trimmedText)) {
            bg = bg || '#ED7D31';
          }
        }

        if (bg) {
          styles.push(`background-color:${bg} !important`);
        } else {
          styles.push('background-color:transparent !important');
        }
        styles.push(`color:${cell.fg || '#000000'} !important`);

        let szClass = 'cell-sz-body';
        if (cell.sz) {
          if (cell.sz >= 28) {
            szClass = 'cell-sz-title';
            styles.push('font-size:26px;line-height:1.2;padding:4px 4px');
          } else if (cell.sz >= 17) {
            szClass = 'cell-sz-sub';
            styles.push('font-size:18px;line-height:1.2;padding:4px 4px');
          } else if (cell.sz >= 15) {
            szClass = 'cell-sz-sec';
            styles.push('font-size:15px;line-height:1.2');
          } else if (cell.sz >= 13.5) {
            szClass = 'cell-sz-sec';
            styles.push(`font-size:${isDenseSheet ? 11.5 : 13.5}px;line-height:1.2`);
          } else if (cell.sz <= 9) {
            szClass = 'cell-sz-sm';
            styles.push('font-size:9.5px');
          } else {
            styles.push(`font-size:${baseFontPx}px`);
          }
        } else {
          styles.push(`font-size:${baseFontPx}px`);
        }

        if (cell.b || rowIsTotal) styles.push('font-weight:700 !important');
        if (cell.i) styles.push('font-style:italic');
        if (cell.st) styles.push('text-decoration:line-through');

        const hAlign = cell.al || 'left';
        styles.push(`text-align:${hAlign} !important`);
        const vAlign = cell.val || 'middle';
        styles.push(`vertical-align:${vAlign === 'center' ? 'middle' : vAlign} !important`);

        const isNumberOrPct = /^-?[\d,]+(\.\d+)?%?$/.test(trimmedText);
        const isSingleWordOrShortName =
          trimmedText.length > 0 &&
          trimmedText.length <= 20 &&
          !trimmedText.includes('\n') &&
          (isNumberOrPct ||
            cell.cur ||
            /^(Green Zone|Yello Zone|Yellow Zone|Red Zone|Complete|Done|Due|AS Due|TS Due|No Target|TOTAL|Total|योग|DEOGARH)$/i.test(trimmedText) ||
            (isDenseSheet && rIdx >= 4 && cell.c <= 2));

        const cellClasses = [szClass];
        if (isSingleWordOrShortName) {
          cellClasses.push('nowrap-cell');
        }
        attrs.push(`class="${cellClasses.join(' ')}"`);

        let innerHtml = '';
        if (cell.cur && rawText !== '') {
          const cleanVal = rawText.replace(/^₹\s*/, '').trim();
          innerHtml = `<div class="excel-acct-cell"><span class="rupee-sym">₹</span><span class="rupee-val">${escHtml(cleanVal)}</span></div>`;
        } else {
          innerHtml = escHtml(rawText).replace(/\r?\n/g, '<br>');
        }

        html += `<td ${attrs.join(' ')} style="${styles.join(';')}">${innerHtml}</td>`;
      }

      html += `</tr>`;
    }

    html += `</tbody></table></div>`;
    return html;
  }

  function renderBlockDashboard() {
    ensureBlockPrintStyles();
    const container = document.getElementById('block-report-container');
    if (!container || !blockPayload) return;

    const pdfNameEl = document.getElementById('block-pdf-name');
    if (pdfNameEl) {
      pdfNameEl.textContent = `${blockPayload.pdfName || 'SBM Report'}.pdf`;
    }

    const metaEl = document.getElementById('block-cloud-meta');
    if (metaEl && blockPayload.meta) {
      metaEl.textContent = `अंतिम अपडेट: ${blockPayload.meta.lastUpdatedDisplay || 'अभी'} • Sheets: ${blockPayload.sheets.length}/${BLOCK_REPORT_SHEETS.length} • v${blockPayload.meta.version || '--'}`;
    }

    const tabsEl = document.getElementById('block-sheet-tabs');
    if (tabsEl) {
      let tabsHtml = `<button class="sheet-tab ${activeSheetFilter === 'ALL' ? 'active' : ''}" onclick="BlockReport.selectSheetTab('ALL')">📑 सभी 14 शीट्स (${blockPayload.sheets.length})</button>`;
      blockPayload.sheets.forEach((s, idx) => {
        const isAct = activeSheetFilter === s.name;
        const badge = s.orientation === 'portrait' ? 'Portrait' : 'Landscape';
        tabsHtml += `<button class="sheet-tab ${isAct ? 'active' : ''}" onclick="BlockReport.selectSheetTab('${escHtml(s.name)}')">${idx + 1}. ${escHtml(s.name)} <small>(${badge})</small></button>`;
      });
      tabsEl.innerHTML = tabsHtml;
    }

    const sheetsToRender =
      activeSheetFilter === 'ALL'
        ? blockPayload.sheets
        : blockPayload.sheets.filter((s) => s.name === activeSheetFilter);

    let outHtml = '';
    sheetsToRender.forEach((sheet) => {
      const pages = splitSheetIntoPrintPages(sheet);
      outHtml += `<div class="block-sheet-section">`;
      outHtml += `<div class="block-sheet-bar no-print">
        <div class="block-sheet-title">
          <span class="sheet-num-badge">Sheet ${blockPayload.sheets.indexOf(sheet) + 1}</span>
          <strong>${escHtml(sheet.name)}</strong>
          <span class="sheet-orient-pill">${sheet.orientation === 'portrait' ? '📄 A4 Portrait' : '📐 A4 Landscape'} (${pages.length} ${pages.length > 1 ? 'Pages' : 'Page'})</span>
        </div>
        <button class="btn-sheet-pdf" onclick="BlockReport.exportSingleSheetPDF('${escHtml(sheet.name)}')">⬇ केवल यह शीट PDF</button>
      </div>`;

      pages.forEach((p) => {
        outHtml += `<div class="excel-page-card ${p.orientation}">`;
        outHtml += buildPrintPageHtml(p, false);
        outHtml += `</div>`;
      });
      outHtml += `</div>`;
    });

    container.innerHTML = outHtml;
  }

  function showPdfModal(show, progress = 0, title = 'ब्लॉक रिपोर्ट PDF तैयार हो रही है…', subtitle = 'कृपया प्रतीक्षा करें…') {
    const modal = document.getElementById('pdfModal');
    if (!modal) return;
    if (show) {
      modal.style.display = 'flex';
      const tEl = document.getElementById('pdfModalTitle');
      const sEl = document.getElementById('pdfModalSub');
      const bEl = document.getElementById('pdfProgressBar');
      if (tEl) tEl.innerText = title;
      if (sEl) sEl.innerText = subtitle;
      if (bEl) bEl.style.width = Math.min(100, Math.max(0, progress)) + '%';
    } else {
      modal.style.display = 'none';
    }
  }

  async function capturePrintPageToCanvas(page, scale = 2) {
    ensureBlockPrintStyles();
    const metrics = getPageRenderMetrics(page);
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '-14000px';
    wrapper.style.width = metrics.captureWidthPx + 'px';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = metrics.paddingCss;
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.zIndex = '-1';
    wrapper.innerHTML = buildPrintPageHtml(page, true);

    document.body.appendChild(wrapper);
    await new Promise((r) => setTimeout(r, 80));
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    let canvas = null;
    try {
      canvas = await html2canvas(wrapper, {
        scale,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
    } finally {
      document.body.removeChild(wrapper);
    }
    return canvas;
  }

  async function exportSheetsToPdf(sheetsList, customFileName = null) {
    if (isExportingPdf) return;
    if (!sheetsList || sheetsList.length === 0) {
      alert('PDF बनाने के लिए कोई शीट उपलब्ध नहीं है।');
      return;
    }

    isExportingPdf = true;
    showPdfModal(true, 5, 'ब्लॉक रिपोर्ट PDF तैयार हो रही है…', 'सभी 14 शीट्स के पेज तैयार किए जा रहे हैं…');

    try {
      const allPrintPages = [];
      for (const sheet of sheetsList) {
        const pages = splitSheetIntoPrintPages(sheet);
        allPrintPages.push(...pages);
      }

      if (allPrintPages.length === 0) {
        throw new Error('कोई प्रिंट पेज नहीं मिला।');
      }

      const { jsPDF } = root.jspdf;
      const firstPage = allPrintPages[0];
      const doc = new jsPDF({
        orientation: firstPage.orientation === 'portrait' ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      for (let i = 0; i < allPrintPages.length; i++) {
        const page = allPrintPages[i];
        const pct = Math.round(((i + 0.5) / allPrintPages.length) * 95);
        showPdfModal(
          true,
          pct,
          `PDF तैयार हो रही है… (${i + 1}/${allPrintPages.length})`,
          `शीट: ${page.sheetName}${page.totalParts > 1 ? ` (पेज ${page.pagePart}/${page.totalParts})` : ''}`
        );

        if (i > 0) {
          doc.addPage('a4', page.orientation === 'portrait' ? 'portrait' : 'landscape');
        }

        const canvas = await capturePrintPageToCanvas(page, 2);
        if (!canvas) continue;

        const metrics = getPageRenderMetrics(page);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = page.orientation === 'portrait' ? 10 : 8;
        const marginY = page.orientation === 'portrait' ? 10 : 9;
        const availW = Math.min(pageWidth - marginX * 2, metrics.maxPdfWidthMm || pageWidth - marginX * 2);
        const availH = pageHeight - marginY * 2;

        let renderW = availW;
        let renderH = (canvas.height * renderW) / canvas.width;
        if (renderH > availH) {
          renderH = availH;
          renderW = (canvas.width * renderH) / canvas.height;
        }

        const xOffset = (pageWidth - renderW) / 2;
        const yOffset = marginY;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', xOffset, yOffset, renderW, renderH, undefined, 'FAST');

        await new Promise((r) => setTimeout(r, 50));
      }

      const baseName = (customFileName || (blockPayload && blockPayload.pdfName) || 'SBM Report').replace(/\.pdf$/i, '');
      showPdfModal(true, 100, 'PDF डाउनलोड हो रही है…', `${baseName}.pdf`);
      doc.save(`${baseName}.pdf`);
    } catch (err) {
      console.error('Block PDF export error:', err);
      alert('PDF बनाने में त्रुटि: ' + err.message);
    } finally {
      isExportingPdf = false;
      showPdfModal(false);
    }
  }

  async function exportBlockReportPDF(forceReload = false) {
    try {
      if (!blockPayload || forceReload) {
        showPdfModal(true, 5, 'ब्लॉक रिपोर्ट डेटा लोड हो रहा है…', 'कृपया प्रतीक्षा करें…');
        await loadBlockReportData(false);
      }
      await exportSheetsToPdf(blockPayload.sheets, blockPayload.pdfName);
    } catch (err) {
      showPdfModal(false);
      alert('ब्लॉक रिपोर्ट लोड करने में त्रुटि: ' + err.message);
    }
  }

  async function exportSingleSheetPDF(sheetName) {
    if (!blockPayload) {
      await loadBlockReportData(false);
    }
    const target = (blockPayload.sheets || []).find((s) => s.name === sheetName);
    if (!target) {
      alert(`शीट "${sheetName}" नहीं मिली।`);
      return;
    }
    const fileName = `${blockPayload.pdfName || 'SBM Report'} - ${sheetName}`;
    await exportSheetsToPdf([target], fileName);
  }

  async function handleLocalWorkbookUpload(file) {
    if (!file) return;
    const statusEl = document.getElementById('block-file-status');
    if (statusEl) {
      statusEl.textContent = `⏳ "${file.name}" पढ़ी जा रही है…`;
      statusEl.className = 'file-status-pill loading';
    }
    try {
      const arrayBuf = await file.arrayBuffer();
      const wb = root.XLSX.read(new Uint8Array(arrayBuf), {
        type: 'array',
        cellNF: true,
        cellStyles: true,
        cellDates: false
      });

      let pdfName = '';
      const idxSheetName = wb.SheetNames.find((n) => n.trim().toLowerCase() === 'sheet_index');
      if (idxSheetName && wb.Sheets[idxSheetName]) {
        const i2 = wb.Sheets[idxSheetName]['I2'];
        if (i2 && (i2.w || i2.v)) {
          pdfName = ensureUnicodeText(String(i2.w || i2.v).trim());
        }
      }
      if (!pdfName) {
        pdfName = file.name.replace(/\.(xlsm|xlsx|xls)$/i, '');
      }

      const extractedSheets = [];
      for (const reqName of BLOCK_REPORT_SHEETS) {
        const reqNorm = reqName.trim().toLowerCase();
        const actualName = wb.SheetNames.find((n) => n.trim().toLowerCase() === reqNorm);
        if (!actualName) continue;
        const ws = wb.Sheets[actualName];
        const ref = ws['!ref'] || 'A1:I25';
        const range = root.XLSX.utils.decode_range(ref);
        const merges = (ws['!merges'] || []).map((m) => ({
          r1: m.s.r + 1,
          c1: m.s.c + 1,
          r2: m.e.r + 1,
          c2: m.e.c + 1
        }));

        const mergeMap = new Map();
        for (const m of merges) {
          for (let rr = m.r1; rr <= m.r2; rr++) {
            for (let cc = m.c1; cc <= m.c2; cc++) {
              mergeMap.set(`${rr},${cc}`, { ...m, isOrigin: rr === m.r1 && cc === m.c1 });
            }
          }
        }

        let maxR = 1;
        let maxC = 1;
        for (let R = range.s.r; R <= Math.min(range.e.r, 120); R++) {
          for (let C = range.s.c; C <= Math.min(range.e.c, 30); C++) {
            const addr = root.XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[addr];
            if (cell && cell.v !== undefined && cell.v !== '') {
              if (R + 1 > maxR) maxR = R + 1;
              if (C + 1 > maxC) maxC = C + 1;
            }
          }
        }

        const cols = [];
        const wsCols = ws['!cols'] || [];
        for (let c = 1; c <= maxC; c++) {
          const wObj = wsCols[c - 1];
          cols.push({ col: c, width: (wObj && wObj.wch) || 11 });
        }

        const rows = [];
        for (let r = 1; r <= maxR; r++) {
          const rowCells = [];
          for (let c = 1; c <= maxC; c++) {
            const mInfo = mergeMap.get(`${r},${c}`);
            if (mInfo && !mInfo.isOrigin) continue;
            const addr = root.XLSX.utils.encode_cell({ r: r - 1, c: c - 1 });
            const cell = ws[addr];
            const rawStr = cell ? String(cell.w !== undefined ? cell.w : cell.v ?? '') : '';
            const text = ensureUnicodeText(rawStr);
            const cellObj = {
              c,
              v: text,
              bd: r >= 2 ? [1, 1, 1, 1] : undefined,
              al: typeof (cell && cell.v) === 'number' ? 'center' : 'left'
            };
            if (mInfo) {
              if (mInfo.r2 > mInfo.r1) cellObj.rs = mInfo.r2 - mInfo.r1 + 1;
              if (mInfo.c2 > mInfo.c1) {
                cellObj.cs = mInfo.c2 - mInfo.c1 + 1;
                cellObj.al = 'center';
              }
            }
            rowCells.push(cellObj);
          }
          rows.push({ r, cells: rowCells });
        }

        extractedSheets.push({
          name: actualName,
          orientation: actualName.trim().toLowerCase() === 'summary' ? 'portrait' : 'landscape',
          colCount: cols.length,
          rowCount: rows.length,
          cols,
          rows
        });
      }

      blockPayload = {
        success: true,
        pdfName,
        requestedSheets: BLOCK_REPORT_SHEETS,
        foundSheetNames: extractedSheets.map((s) => s.name),
        missingSheets: [],
        sheets: extractedSheets,
        meta: {
          version: 'local-upload',
          lastUpdatedDisplay: `लोकल फ़ाइल: ${file.name}`
        }
      };

      activeSheetFilter = 'ALL';
      renderBlockDashboard();
      if (statusEl) {
        statusEl.textContent = `✓ "${file.name}" सफलतापूर्वक लोड हो गई (${extractedSheets.length} शीट्स)`;
        statusEl.className = 'file-status-pill ok';
      }
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent = `❌ फ़ाइल पढ़ने में त्रुटि: ${err.message}`;
        statusEl.className = 'file-status-pill err';
      }
    }
  }

  async function initBlockPage(forceRefresh = false) {
    const statusEl = document.getElementById('block-file-status');
    const metaEl = document.getElementById('block-cloud-meta');
    if (statusEl) {
      statusEl.textContent = forceRefresh ? '☁️ ताज़ा ब्लॉक रिपोर्ट सिंक हो रही है…' : '☁️ ब्लॉक रिपोर्ट लोड हो रही है…';
      statusEl.className = 'file-status-pill loading';
    }
    try {
      await loadBlockReportData(forceRefresh);
      renderBlockDashboard();
      if (statusEl) {
        statusEl.textContent = `☁️ ब्लॉक रिपोर्ट तैयार ✓ (${blockPayload.sheets.length} Sheets)`;
        statusEl.className = 'file-status-pill ok';
      }
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent = '❌ ब्लॉक रिपोर्ट लोड नहीं हो सकी';
        statusEl.className = 'file-status-pill err';
      }
      if (metaEl) {
        metaEl.textContent = err.message + ' (या ऊपर "📂 लोकल .xlsm चुनें" बटन से अपनी .xlsm फ़ाइल चुनें)';
      }
    }
  }

  function selectSheetTab(sheetName) {
    activeSheetFilter = sheetName;
    renderBlockDashboard();
  }

  function printBlockReport() {
    ensureBlockPrintStyles();
    window.print();
  }

  root.BlockReport = {
    printBlockReport,
    BLOCK_REPORT_SHEETS,
    loadBlockReportData,
    initBlockPage,
    selectSheetTab,
    exportBlockReportPDF,
    exportSingleSheetPDF,
    handleLocalWorkbookUpload
  };
})(typeof window !== 'undefined' ? window : this);
