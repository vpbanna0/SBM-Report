/* ═══════════════════════════════════════════════════════
   data-handler.js  —  SBM-G Report
   (100% ORIGINAL LOGIC RESTORED FOR DATA PARSING)
═══════════════════════════════════════════════════════ */
window.S={}; window.Rname={};
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
  parseWorkbook, renderChips, renderDebug, buildDropdown, renderAll, setStatus,
  
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
