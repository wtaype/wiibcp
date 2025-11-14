// === IMPORTS ===
import $ from 'jquery';
import { adrm } from './widev.js';

// === EXPORTS ===
export { footer };

let lanzamiento = 2024;
let autor = '@wilder.taype';
let link = 'https://wtaype.github.io/';
let version = 'v10'; 
/** ACTUALIZACION TAG version dia hora   [START]  

git add . ; git commit -m "Actualizacion Principal v10.10.39"
git push origin main

// Actualizar main + crear tag [funciona] 
git add . ; git commit -m "Actualizacion Principal v10" ; git push origin main
git tag v10 -m "Version v10" ; git push origin v10

 ACTUALIZACION TAG[END] */ 

// === HTML ===
function footer() {
  const ahora = new Date();
  return `
<footer class="foo wb txc psa">
  <span>Creado con <i class="fas fa-heart"></i> by <a class="ftx lkme" href="${link}" target="_blank">${autor}</a> </span>
  <span> ${lanzamiento} - <span class="wty">${ahora.getFullYear()}</span><span>
  <span class="abw"> | Acerca del app ${version} | actualizado:
  <span class="wtu" id="7209768286404563606">${ahora.toLocaleString()}</span>
</footer>
  `;
}


// === ESTILOS ===
$('style').append(`.foo{width:100%;text-align:center;padding-block:1.5vh 1vh;background:var(--wb);border-radius:1vh 1vh 0 0;}.foo *{font-size:var(--fz_s2);margin-inline:.3vh;}.foo a{color:var(--bg2);}.foo i{color:var(--mco);}.abwc{background:var(--bg);top:0;width:99%;height:100%;padding:2vh 2vw;overflow:scroll;line-height:1.80;}.abwok{background:var(--mco);color:var(--txa);}`);
