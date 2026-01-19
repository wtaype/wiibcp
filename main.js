// ========== INICIALIZACIÓN ==========
$(() => {
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
}
// ========== LOCALSTORAGE HELPERS ==========
function savels(key,value,hours){localStorage.setItem(key,JSON.stringify({value:value,expiry:Date.now()+hours*3600000}))};function getls(key){var item=JSON.parse(localStorage.getItem(key));if(!item||Date.now()>item.expiry){localStorage.removeItem(key);return null}return item.value};function removels(key){localStorage.removeItem(key)};
function gosave(nm,vl){$(window).on('beforeunload',()=> savels(nm,vl,168))} //gosave('fondo', $('html').attr('style')) 
function getsave(sv,fn){const mvl=getls(sv);if (mvl) fn(mvl)}//getsave('stema',(v)=> $('body').addClass(v));
function gosaves(se,attr,fn){$(window).on('beforeunload',function(){$(se).each(function(){savels($(this).attr(attr),fn($(this)),168);})})}//gosaves('input','id',($e)=> $e.val());
function getsaves(se,attr,fn){$(se).each(function(){const val=getls($(this).attr(attr));if(val)fn($(this),val);})}//getsaves('input','id',($e,v)=> $e.val(v));
 
// ========== UTILIDADES ==========
$('.wty').text(new Date().getFullYear()); //Obtener el año 
$('.wtu').text(new Date().toLocaleString()); //Tiempo de actulización 
$('.abw,.abwok').click(function(){navigator.clipboard.writeText(this.id);$('.abwc').toggleClass('dpn')});//AcercaWeb

const adrm=(s,c)=>$(s).addClass(c).siblings().removeClass(c),
adtc=(s,c,t=3e3)=>{$(s).addClass(c);setTimeout(()=>$(s).removeClass(c),t)},
adtx=(s,t)=>{const o=$(s).text();$(s).text(t).delay(1800).queue(q=>$(s).text(o).dequeue())},
notif=(m,t='success',d=3e3)=>{const i={'success':'fa-check-circle','error':'fa-times-circle','warning':'fa-exclamation-triangle','info':'fa-info-circle'}[t]||'fa-bell';$('body').append(`<div class="toast toast_${t}"><i class="fas ${i}"></i><span>${m}</span></div>`);const n=$('.toast').last();setTimeout(()=>n.addClass('activo'),100);setTimeout(()=>n.removeClass('activo').delay(300).queue(()=>n.remove()),d)},
copy=async t=>{try{await navigator.clipboard.writeText(t);notif('&#9989; Copiado al portapapeles','success');return true}catch(e){notif('&#10060; Error al copiar','error');return false}};


// ========== HEADER DINÁMICO ==========
$('.hd_izq').html(`<h1><i class="fas fa-toolbox"></i>Mis Herramientas Web</h1>`);
$('.hd_moti').html(`<i class="fas fa-lightbulb"></i><span>&#161;Construyendo el futuro!</span>`);

// ========== HERRAMIENTA 1: TABLA PARSER (NIVEL PRO) ==========
$('#hr1').html(`
<div class="hr_hd">
  <div class="hr_tit"><i class="fas fa-table"></i><h2>Copiar desde PDF para Excel</h2></div>
  <p class="hr_desc">Copia texto de PDF y conviértelo en tabla estructurada para Excel</p>
</div>
<div class="hr_body">
  <div class="hr_col hr_entrada">
    <div class="col_hd">
      <h3><i class="fas fa-file-import"></i> Entrada</h3>
      <button class="btn btn_limpiar" data-target="tb_entrada"><i class="fas fa-eraser"></i> Limpiar</button>
    </div>
    <textarea id="tb_entrada" class="txt_area"
      placeholder="Pega aquí el texto del PDF...&#10;&#10;Ejemplo:&#10;País    2024    2025    2026&#10;USA     1000    1200    1500&#10;China   800     900     1100"></textarea>
    <div class="col_info">
      <span class="info_item"><i class="fas fa-align-left"></i> <span id="tb_lineas">0</span> líneas</span>
      <span class="info_item"><i class="fas fa-font"></i> <span id="tb_chars">0</span> caracteres</span>
      <span class="info_item"><i class="fas fa-columns"></i> <span id="tb_cols">0</span> cols</span>
    </div>
  </div>
  <div class="hr_col hr_resultado">
    <div class="col_hd">
      <h3><i class="fas fa-table-cells"></i> Resultado</h3>
      <button class="btn btn_copiar" data-target="tb_resultado"><i class="fas fa-copy"></i> Copiar tabla</button>
    </div>
    <div id="tb_resultado" class="resultado_tabla">
      <div class="placeholder"><i class="fas fa-table"></i><p>La tabla aparecerá aquí</p></div>
    </div>
  </div>
</div>
`);

// ---------- Helpers internos solo para herramienta 1 ----------
// Solo detecta números, NO redondea, NO cambia el texto original
const wi_parseNumber = raw => {
  if (!raw) return { num: null, text: '' };
  const txt = String(raw).trim();
  const cleaned = txt.replace(/\s/g, '').replace(/\*/g, '');
  const reEuro = /^-?\d{1,3}(\.\d{3})*(,\d+)?$/;      // 29.184,9
  const reGeneric = /^-?\d+([.,]\d+)?$/;              // 29184,9 o 29184.9

  if (reEuro.test(cleaned)) {
    const n = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? { num: null, text: txt } : { num: n, text: txt };
  }
  if (reGeneric.test(cleaned)) {
    const n = parseFloat(cleaned.replace(',', '.'));
    return isNaN(n) ? { num: null, text: txt } : { num: n, text: txt };
  }
  return { num: null, text: txt };
};

const wi_isNumericCol = (rows, colIdx) =>
  rows.every(r => {
    const cell = (r[colIdx] || '').trim();
    if (!cell) return true;
    const { num } = wi_parseNumber(cell);
    return num !== null;
  });

const parseTb = t => {
  const ln = t.trim().split('\n').filter(l => l.trim());
  if (!ln.length) {
    $('#tb_resultado').html('<div class="placeholder"><i class="fas fa-table"></i><p>La tabla aparecerá aquí</p></div>');
    $('#tb_cols,#tb_lineas').text('0');
    return;
  }

  // 1) Separador: tabs | pipes | espacios múltiples
  const detectSep = l => {
    if (l.includes('\t')) return '\t';
    if (l.includes('|')) return '|';
    const multi = (l.match(/\s{2,}/g) || []).length;
    return multi >= 1 ? /\s{2,}/ : /\s+/;
  };

  const sep = detectSep(ln[0]);
  let rows = ln.map(l => l.split(sep).map(c => c.trim()).filter(c => c));

  // 2) Unir TODAS las palabras iniciales hasta antes del primer número
  rows = rows.map(r => {
    if (!r.length) return r;
    // encontrar índice de la primera celda que sea claramente numérica
    let firstNumIdx = r.findIndex(c => wi_parseNumber(c).num !== null);
    if (firstNumIdx === -1) firstNumIdx = 1; // fila solo texto
    const name = r.slice(0, firstNumIdx).join(' ');
    const rest = r.slice(firstNumIdx);
    return [name, ...rest];
  });

  const maxCols = Math.max(...rows.map(r => r.length));
  $('#tb_cols').text(maxCols);
  $('#tb_lineas').text(ln.length);

  // 3) Header: primera fila si tiene texto no numérico
  const isHeader = rows[0] && rows[0].some(c => {
    const cleaned = c.replace(/\*/g, '').trim();
    const { num } = wi_parseNumber(cleaned);
    return num === null;
  });

  const headers = isHeader ? rows[0] : Array.from({ length: maxCols }, (_, i) => `Col${i + 1}`);
  const dataRows = isHeader ? rows.slice(1) : rows;

  // 4) Detectar columnas numéricas (solo para clase de estilo)
  const numCols = [];
  for (let i = 0; i < maxCols; i++) {
    numCols.push(wi_isNumericCol(dataRows, i));
  }

  // 5) Construir tabla SIN totales, respetando exactamente el texto
  let html = '<table><thead><tr>' +
    headers.map(h => `<th>${h}</th>`).join('') +
    '</tr></thead><tbody>';

  dataRows.forEach(row => {
    html += '<tr>';
    for (let i = 0; i < maxCols; i++) {
      const cell = (row[i] || '').trim();
      if (!cell) {
        html += '<td>-</td>';
        continue;
      }
      if (numCols[i]) {
        html += `<td class="vlx">${cell}</td>`;
      } else {
        html += `<td>${cell}</td>`;
      }
    }
    html += '</tr>';
  });

  html += '</tbody></table>';
  $('#tb_resultado').html(html);
};

// eventos
$('#tb_entrada').on('input paste', function () {
  const v = this.value;
  parseTb(v);
  $('#tb_chars').text(v.length);
  savels('tb_entrada', v, 168);
});
getsaves('#tb_entrada', 'id', ($e, v) => { $e.val(v); parseTb(v); });

$(document).on('click', '.btn_limpiar[data-target="tb_entrada"]', () => {
  $('#tb_entrada').val('');
  parseTb('');
  $('#tb_chars,#tb_lineas,#tb_cols').text('0');
});

$(document).on('click', '.btn_copiar[data-target="tb_resultado"]', async () => {
  const t = $('#tb_resultado table');
  if (!t.length) return notif('&#9888;&#65039; No hay tabla para copiar', 'warning');

  // construir TSV
  let tsv = '';
  t.find('tr').each(function () {
    const cells = [];
    $(this).find('th,td').each(function () {
      const txt = $(this).text().trim(); // EXACTO, sin tocar puntos/comas
      cells.push(txt);
    });
    tsv += cells.join('\t') + '\n';
  });

  // 1) Intentar API moderna si existe
  if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(tsv);
      return notif('&#9989; Tabla copiada - pega en Excel', 'success');
    } catch (e) {
      // sigue al fallback
    }
  }

  // 2) Fallback clásico con textarea oculto
  try {
    const temp = $('<textarea>')
      .val(tsv)
      .css({ position: 'fixed', top: 0, left: 0, opacity: 0, width: '1px', height: '1px' })
      .appendTo('body');
    temp[0].focus();
    temp[0].select();
    document.execCommand('copy');
    temp.remove();
    notif('&#9989; Tabla copiada', 'success');
  } catch (e) {
    notif('&#10060; No se pudo copiar automáticamente. Selecciona y copia manualmente.', 'error');
  }
});

// ========== HERRAMIENTA 2: OCR IMÁGENES (MEJORADA) ==========
$('#hr2').html(`
<div class="hr_hd">
  <div class="hr_tit"><i class="fas fa-image"></i><h2>Reconocimiento de Texto</h2></div>
  <p class="hr_desc">Extrae texto de imágenes con precisión profesional</p>
</div>
<div class="hr_body">
  <div class="hr_col hr_entrada">
    <div class="col_hd">
      <h3><i class="fas fa-file-image"></i> Imagen</h3>
      <div class="btn_group">
        <button class="btn btn_cargar" id="ocr_cargar"><i class="fas fa-upload"></i> Cargar</button>
        <button class="btn btn_limpiar" id="ocr_limpiar"><i class="fas fa-trash"></i></button>
      </div>
      <input type="file" id="ocr_file" accept="image/*" style="display:none">
    </div>
    <div id="ocr_zona" class="zona_drop">
      <div class="drop_content">
        <i class="fas fa-cloud-arrow-up"></i>
        <p>Arrastra una imagen aquí</p>
        <p class="drop_sub">o pega con <kbd>Ctrl</kbd> + <kbd>V</kbd></p>
        <button class="btn btn_primary" id="ocr_seleccionar"><i class="fas fa-folder-open"></i> Seleccionar archivo</button>
      </div>
      <div id="ocr_preview" class="img_preview"></div>
      <div class="ocr_progress">
        <div class="progress_bar"><div class="progress_fill"></div></div>
        <span class="progress_text">0%</span>
      </div>
    </div>
  </div>
  <div class="hr_col hr_resultado">
    <div class="col_hd">
      <h3><i class="fas fa-file-alt"></i> Texto Extraído</h3>
      <div class="btn_group">
        <select id="ocr_lang" class="sel_lang">
          <option value="spa+eng">Español + Inglés</option>
          <option value="spa">Solo Español</option>
          <option value="eng">Solo Inglés</option>
        </select>
        <button class="btn btn_copiar" data-target="ocr_resultado"><i class="fas fa-copy"></i> Copiar</button>
        <button class="btn btn_descargar" id="ocr_descargar"><i class="fas fa-download"></i> Descargar</button>
      </div>
    </div>
    <textarea id="ocr_resultado" class="txt_area" placeholder="El texto extraído aparecerá aquí..."></textarea>
    <div class="col_info">
      <span class="info_item"><i class="fas fa-language"></i> <span id="ocr_lang_txt">Español/Inglés</span></span>
      <span class="info_item"><i class="fas fa-clock"></i> <span id="ocr_tiempo">--</span></span>
      <span class="info_item"><i class="fas fa-bullseye"></i> <span id="ocr_conf">--</span> confianza</span>
    </div>
  </div>
</div>
`);

const processOCR = file => {
  if (!file || !file.type.startsWith('image/')) return notif('&#9888;&#65039; Archivo no válido','warning');

  const url = URL.createObjectURL(file);
  const start = Date.now();
  const lang = $('#ocr_lang').val();

  $('#ocr_preview').html(`<img src="${url}" alt="Preview"/>`).addClass('active');
  $('.drop_content').hide();
  $('.ocr_progress').addClass('active');
  $('.progress_fill').css('width','0%');
  $('.progress_text').text('0%');
  $('#ocr_resultado').val('');
  $('#ocr_tiempo').text('--');
  $('#ocr_conf').text('--');

  // Precisión mejorada: OEM LSTM + PSM automático para bloques de texto
  Tesseract.recognize(url, lang, {
    logger: m => {
      if (m.status === 'recognizing text') {
        const p = Math.round(m.progress * 100);
        $('.progress_fill').css('width', `${p}%`);
        $('.progress_text').text(`${p}%`);
      }
    },
    tessedit_ocr_engine_mode: 1, // LSTM only
    tessedit_pageseg_mode: 3     // Fully automatic page segmentation
  })
  .then(({ data }) => {
    const secs = (Date.now() - start) / 1000;

    // Limpiar resultado: quitar muchos espacios, normalizar saltos de línea
    const cleanText = data.text
      .replace(/\r/g,'')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const avgConf = data.confidence || 0;

    $('#ocr_resultado').val(cleanText);
    $('#ocr_tiempo').text(`${secs.toFixed(1)}s`);
    $('#ocr_conf').text(`${avgConf.toFixed(1)}%`);
    $('.ocr_progress').removeClass('active');
    notif('&#9989; Texto extraído correctamente','success');

    URL.revokeObjectURL(url);
  })
  .catch(e => {
    $('#ocr_resultado').val(`Error: ${e.message}`);
    $('#ocr_tiempo').text('--');
    $('#ocr_conf').text('--');
    $('.ocr_progress').removeClass('active');
    notif('&#10060; Error al procesar imagen','error');
    URL.revokeObjectURL(url);
  });
};

// eventos OCR
$('#ocr_cargar,#ocr_seleccionar').click(() => $('#ocr_file').click());
$('#ocr_file').change(function(){ this.files[0] && processOCR(this.files[0]) });

$('#ocr_limpiar').click(() => {
  $('#ocr_preview').removeClass('active').empty();
  $('.drop_content').show();
  $('#ocr_resultado').val('');
  $('#ocr_tiempo').text('--');
  $('#ocr_conf').text('--');
  $('.ocr_progress').removeClass('active');
});

$('#ocr_zona')
  .on('dragover', e => { e.preventDefault(); $('#ocr_zona').addClass('drag_over'); })
  .on('dragleave', () => $('#ocr_zona').removeClass('drag_over'))
  .on('drop', e => {
    e.preventDefault();
    $('#ocr_zona').removeClass('drag_over');
    const f = e.originalEvent.dataTransfer.files[0];
    f && processOCR(f);
  });

// Pegar imagen desde portapapeles
$(document).on('paste', e => {
  const items = Array.from(e.originalEvent.clipboardData.items);
  const it = items.find(i => i.type.startsWith('image/'));
  it && processOCR(it.getAsFile());
});

// copiar texto OCR
$(document).on('click','.btn_copiar[data-target="ocr_resultado"]', () => {
  const txt = $('#ocr_resultado').val();
  txt ? copy(txt) : notif('&#9888;&#65039; No hay texto para copiar','warning');
});

// descargar texto OCR
$('#ocr_descargar').click(() => {
  const txt = $('#ocr_resultado').val();
  if (!txt) return notif('&#9888;&#65039; No hay texto para descargar','warning');
  const blob = new Blob([txt],{type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = $('<a>').attr({href:url,download:`texto_${Date.now()}.txt`}).appendTo('body');
  a[0].click();
  a.remove();
  URL.revokeObjectURL(url);
  notif('&#9989; Texto descargado','success');
});

// actualizar texto de idioma
$('#ocr_lang').on('change', function(){
  const v = $(this).val();
  $('#ocr_lang_txt').text(
    v === 'spa' ? 'Español' :
    v === 'eng' ? 'Inglés' :
    'Español/Inglés'
  );
});

// ========== HERRAMIENTA 3: PDF &#8594; EXCEL (NIVEL PRO) ==========
$('#hr3').html(`
<div class="hr_hd">
  <div class="hr_tit"><i class="fas fa-file-excel"></i><h2>Conversor PDF a Excel</h2></div>
  <p class="hr_desc">Convierte tablas de PDF a Excel con detección inteligente de columnas</p>
</div>
<div class="hr_body">
  <div class="hr_col hr_entrada">
    <div class="col_hd">
      <h3><i class="fas fa-file-pdf"></i> Archivo PDF</h3>
      <button class="btn btn_limpiar" id="pdf_limpiar"><i class="fas fa-times"></i> Cancelar</button>
    </div>
    <div id="pdf_zona" class="zona_drop">
      <div class="drop_content">
        <i class="fas fa-file-pdf"></i>
        <p>Arrastra un archivo PDF aquí</p>
        <p class="drop_sub">Máximo 10 MB</p>
        <button class="btn btn_primary" id="pdf_seleccionar"><i class="fas fa-folder-open"></i> Seleccionar PDF</button>
      </div>
      <input type="file" id="pdf_file" accept=".pdf" style="display:none">
      <div id="pdf_info" class="file_info">
        <div class="file_icon"><i class="fas fa-file-pdf"></i></div>
        <div class="file_details">
          <span class="file_name">--</span>
          <span class="file_size">--</span>
          <span class="file_pages">--</span>
        </div>
      </div>
    </div>
    <button class="btn btn_primary btn_procesar" id="pdf_procesar"><i class="fas fa-cog"></i> Procesar PDF</button>
  </div>
  <div class="hr_col hr_resultado">
    <div class="col_hd">
      <h3><i class="fas fa-file-excel"></i> Resultado</h3>
      <button class="btn btn_descargar" id="pdf_descargar" disabled><i class="fas fa-download"></i> Descargar Excel</button>
    </div>
    <div class="pdf_progress">
      <div class="progress_circle">
        <svg viewBox="0 0 100 100">
          <defs><linearGradient id="grad"><stop offset="0%" style="stop-color:var(--mco)"/><stop offset="100%" style="stop-color:var(--hv)"/></linearGradient></defs>
          <circle cx="50" cy="50" r="45" class="progress_bg"></circle>
          <circle cx="50" cy="50" r="45" class="progress_ring" stroke="url(#grad)"></circle>
        </svg>
        <div class="progress_percent">0%</div>
      </div>
      <p class="progress_status">Esperando archivo...</p>
    </div>
    <div id="pdf_preview" class="excel_preview">
      <div class="preview_tabs"></div>
      <div class="preview_content"></div>
    </div>
  </div>
</div>
`);

let pdfData=null,excelData=null;

// helpers internos solo para herramienta 3
const wi_pdfDetectSep = line => {
  if (line.includes('\t')) return '\t';
  if (line.includes('|')) return '|';
  const multi=(line.match(/\s{2,}/g)||[]).length;
  return multi>=1?/\s{2,}/:/\s+/;
};

const wi_pdfSplitRow = raw => {
  const line = raw.trim();
  if (!line) return [];
  const sep = wi_pdfDetectSep(line);
  let parts = line.split(sep).map(c=>c.trim()).filter(Boolean);
  // unir texto inicial hasta primer número (similar a herramienta 1)
  let firstNumIdx = parts.findIndex(c => wi_parseNumber(c).num !== null);
  if (firstNumIdx === -1) return [parts.join(' ')];
  const name = parts.slice(0, firstNumIdx).join(' ');
  const rest = parts.slice(firstNumIdx);
  return [name, ...rest];
};

// eventos de carga
$('#pdf_seleccionar').click(()=>$('#pdf_file').click());

$('#pdf_file').change(function(){
  const f=this.files[0];
  if(!f)return;
  if(f.size>1e7)return notif('&#9888;&#65039; Archivo muy grande (máx 10MB)','warning');
  $('#pdf_info').addClass('active');
  $('.file_name').text(f.name);
  $('.file_size').text(`${(f.size/1024).toFixed(2)} KB`);
  $('.drop_content').hide();
  const r=new FileReader();
  r.onload=e=>{
    pdfData=new Uint8Array(e.target.result);
    notif('&#9989; PDF cargado correctamente','success');
  };
  r.readAsArrayBuffer(f);
});

$('#pdf_limpiar').click(()=>{
  pdfData=null;excelData=null;
  $('#pdf_info').removeClass('active');
  $('.drop_content').show();
  $('#pdf_file').val('');
  $('.progress_percent').text('0%');
  $('.progress_status').text('Esperando archivo...');
  $('#pdf_descargar').prop('disabled',true);
  $('#pdf_preview').removeClass('active');
  $('.progress_ring').css('stroke-dashoffset',283);
});

// drag & drop
$('#pdf_zona')
  .on('dragover',e=>{e.preventDefault();$('#pdf_zona').addClass('drag_over')})
  .on('dragleave',()=>$('#pdf_zona').removeClass('drag_over'))
  .on('drop',e=>{
    e.preventDefault();
    $('#pdf_zona').removeClass('drag_over');
    const f=e.originalEvent.dataTransfer.files[0];
    if(f&&f.type==='application/pdf'){
      $('#pdf_file')[0].files=e.originalEvent.dataTransfer.files;
      $('#pdf_file').trigger('change');
    }
  });

// procesar PDF con detección de filas/columnas mejorada
$('#pdf_procesar').click(async()=>{
  if(!pdfData)return notif('&#9888;&#65039; Selecciona un PDF primero','warning');
  $('.progress_status').text('Procesando PDF...');
  try{
    const pdf=await pdfjsLib.getDocument({data:pdfData}).promise;
    $('.file_pages').text(`${pdf.numPages} páginas`);
    const allRows=[];
    for(let i=1;i<=pdf.numPages;i++){
      const p=await pdf.getPage(i);
      const t=await p.getTextContent();
      // ordenar por posición vertical y horizontal para aproximar filas
      const items=t.items.map(it=>({
        str:it.str,
        x:it.transform[4],
        y:it.transform[5]
      })).sort((a,b)=>a.y===b.y?a.x-b.x:b.y-a.y);
      // agrupar por y (mismo renglón)
      const lines=[];
      let currentY=null,currentLine=[];
      const yThreshold=3; // tolerancia vertical
      items.forEach(it=>{
        if(currentY===null||Math.abs(it.y-currentY)<=yThreshold){
          currentY=currentY===null?it.y:currentY;
          currentLine.push(it.str);
        }else{
          lines.push(currentLine.join(' '));
          currentLine=[it.str];
          currentY=it.y;
        }
      });
      if(currentLine.length)lines.push(currentLine.join(' '));
      // convertir cada línea en array de columnas
      lines
        .map(l=>l.trim())
        .filter(l=>l)
        .forEach(l=>allRows.push(wi_pdfSplitRow(l)));

      const pr=Math.round((i/pdf.numPages)*100);
      $('.progress_percent').text(`${pr}%`);
      $('.progress_ring').css('stroke-dashoffset',283-(283*pr/100));
    }

    if(!allRows.length)throw new Error('No se pudo extraer texto estructurado');

    // normalizar a mismo número de columnas
    const maxCols=Math.max(...allRows.map(r=>r.length));
    const normalized=allRows.map(r=>{
      const row=[...r];
      while(row.length<maxCols)row.push('');
      return row;
    });

    excelData=normalized;

    const header=normalized[0]||[];
    const body=normalized.slice(1);
    const html=
      '<table><thead><tr>'+
      header.map(c=>`<th>${c||'-'}</th>`).join('')+
      '</tr></thead><tbody>'+
      body.map(r=>'<tr>'+r.map(c=>`<td>${c||''}</td>`).join('')+'</tr>').join('')+
      '</tbody></table>';

    $('.preview_content').html(html);
    $('#pdf_preview').addClass('active');
    $('.preview_tabs').html('<button class="tab_btn active" data-tab="hoja1">Hoja 1</button>');
    $('#pdf_descargar').prop('disabled',false);
    $('.progress_status').text('&#9989; PDF procesado correctamente');
    notif('&#9989; PDF convertido a tabla Excel','success');
  }catch(e){
    notif(`&#10060; Error: ${e.message}`,'error');
    $('.progress_status').text('&#10060; Error al procesar PDF');
  }
});

// descargar Excel
$('#pdf_descargar').click(()=>{
  if(!excelData)return notif('&#9888;&#65039; Procesa un PDF primero','warning');
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet(excelData);
  XLSX.utils.book_append_sheet(wb,ws,'Hoja1');
  XLSX.writeFile(wb,`excel_${Date.now()}.xlsx`);
  notif('&#9989; Excel descargado','success');
});

$(document).on('click', '.nav_btn', function() {
  const targetId = $(this).data('hr');
  
  // Actualizar botones
  $('.nav_btn').removeClass('active');
  $(this).addClass('active');
  
  // Mostrar herramienta
  $('.hr').removeClass('active');
  $(`#${targetId}`).addClass('active');
});

// ========== TOASTS CSS ==========
$('head').append(`<style>
.toast{position:fixed;top:2vh;right:2vw;padding:1.5vh 2vw;background:rgba(255,255,255,.95);backdrop-filter:blur(20px);border:1px solid var(--bg1);border-radius:var(--br_m);box-shadow:var(--bs_glass);display:flex;align-items:center;gap:1vh;font-size:var(--fz_c2);font-weight:600;transform:translateX(150%);opacity:0;transition:all var(--tr_m);z-index:9999}
.toast.activo{transform:translateX(0);opacity:1}
.toast_success{border-left:4px solid var(--success);color:var(--success)}
.toast_success i{color:var(--success)}
.toast_error{border-left:4px solid var(--error);color:var(--error)}
.toast_error i{color:var(--error)}
.toast_warning{border-left:4px solid var(--warning);color:var(--warning)}
.toast_warning i{color:var(--warning)}
.toast_info{border-left:4px solid var(--info);color:var(--info)}
.toast_info i{color:var(--info)}
.toast i{font-size:var(--fz_c5)}
.vlx{text-align:right;font-weight:600;color:var(--mco)}
</style>`);


// ========== FIN INICIALIZACIÓN ==========
console.log('🚀 Mis Herramientas Web v2.0 - Inicializado correctamente');
});