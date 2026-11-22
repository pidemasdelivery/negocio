/* Cuando el contenido de una ventana abierta cambia de alto (carga datos), la ventana se desliza suave en vez de brincar */
(function(){
if(window.__pdHojaSuave||!window.ResizeObserver)return;window.__pdHojaSuave=1;
var SEL='[data-pdm-hoja],.pdnSh,.pdsmHoja,.pdxSheetCard,.pdpm-sheet,.pdoSheet,.pdmSheet';
var prev=new WeakMap(),vistos=new WeakSet();
var ro=new ResizeObserver(function(L){L.forEach(function(en){var e=en.target;if(!e.isConnected)return;var r=e.getBoundingClientRect();var p=prev.get(e);prev.set(e,{top:r.top,h:r.height,t:Date.now()});
  if(!p||r.height<40||p.h<40)return;if(Math.abs(r.bottom-(p.top+p.h))>2)return;/* solo ventanas pegadas abajo */
  var d=r.top-p.top;if(Math.abs(d)<3||Math.abs(d)>500)return;
  if(e.classList.contains('pdmuArrastre')||e.__pdmT)return;
  e.style.setProperty('transition','none','important');e.style.setProperty('translate','0 '+(-d)+'px','important');e.getBoundingClientRect();
  e.style.setProperty('transition','translate .2s ease','important');e.style.setProperty('translate','0 0','important');
  clearTimeout(e.__pdSuT);e.__pdSuT=setTimeout(function(){e.style.removeProperty('transition');e.style.removeProperty('translate')},240);
})});
function buscar(){document.querySelectorAll(SEL).forEach(function(e){if(!vistos.has(e)){vistos.add(e);ro.observe(e)}})}
var pend=0;new MutationObserver(function(){if(pend)return;pend=1;requestAnimationFrame(function(){pend=0;buscar()})}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-pdm-hoja','class']});
buscar();
})();
