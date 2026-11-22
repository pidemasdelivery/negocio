/* Las confirmaciones del navegador pasan a una ventana de la app.
   Se cancela la acción, se pregunta en la ventana y, si acepta, se repite el mismo toque. */
(function(){
  if(window.__pdConfirmApp)return;window.__pdConfirmApp=true;
  const nativo=window.confirm.bind(window);let ultimo=null,cuando=0,pasar=false;
  document.addEventListener('click',e=>{if(pasar||e.target.closest&&e.target.closest('#pdcfBg'))return;ultimo=e.target;cuando=Date.now()},true);
  function ventana(msg,ok){
    document.getElementById('pdcfBg')?.remove();
    const bg=document.createElement('div');bg.id='pdcfBg';
    const peligro=/cerrar sesi|eliminar|borrar|quedar[aá]n/i.test(msg);
    bg.innerHTML='<section role="alertdialog" aria-modal="true"><header><span>'+(peligro?'!':'?')+'</span><b>'+(peligro?'¿Estás seguro?':'Confirmar')+'</b></header><p></p><footer><button type="button" class="no">Cancelar</button><button type="button" class="si">'+(peligro?'Sí, continuar':'Sí, confirmar')+'</button></footer></section>';
    bg.querySelector('p').textContent=String(msg||'').replace(/^¿Confirmas? /,'¿Confirmas ');
    const cerrar=()=>bg.remove();
    bg.querySelector('.no').onclick=cerrar;bg.onclick=e=>{if(e.target===bg)cerrar()};
    bg.querySelector('.si').onclick=()=>{cerrar();ok()};
    document.body.appendChild(bg);
  }
  window.confirm=function(msg){
    if(pasar){pasar=false;return true}
    const el=ultimo;if(!el||Date.now()-cuando>1500||!document.contains(el))return nativo(msg);
    ultimo=null;
    ventana(msg,()=>{pasar=true;try{el.click()}finally{setTimeout(()=>{pasar=false},0)}});
    return false;
  };
})();
