(function(){
  if(window.__pdAtras)return;window.__pdAtras=true;
  const CIERRES='.pdCerrarX,[data-a="x"],[data-a="cerrar"],[data-close],.m-x,.h-x,.phX,.pdtX,.x,.close,.pcX,[aria-label^="Cerrar"],[aria-label^="Volver"]';
  const IGNORAR='header,nav,#nav,.bottom,#horarioAlert,#pdAvisoMoto,#toast,.toast,#pdxAlerts,.x-alert,#pdHorarioBar,#pcaBar,#pdCartaCartBar';
  const visible=el=>{if(!el||!el.isConnected)return false;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0};
  /* Ventanas abiertas: elementos fijos que tapan buena parte de la pantalla */
  function abiertas(){
    const W=innerWidth,H=innerHeight,out=[];
    document.querySelectorAll('body *').forEach(el=>{
      if(el.closest(IGNORAR))return;
      const cs=getComputedStyle(el);if(cs.position!=='fixed')return;
      if(!visible(el))return;const r=el.getBoundingClientRect();
      const area=Math.max(0,Math.min(r.right,W)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,H)-Math.max(r.top,0));
      if(area<W*H*0.45)return;
      if(out.some(o=>o.contains(el)))return;
      for(let i=out.length-1;i>=0;i--)if(el.contains(out[i]))out.splice(i,1);
      out.push(el);
    });
    /* niveles extra que define cada panel (por ejemplo, una pestaña que no es la principal) */
    const extra=typeof window.pdAtrasExtra==='function'?(window.pdAtrasExtra()||0):0;
    return {lista:out,nivel:out.length+extra,extra};
  }
  const z=el=>{let n=0,x=el;while(x&&x!==document.body){const v=parseInt(getComputedStyle(x).zIndex,10);if(!isNaN(v))n=Math.max(n,v);x=x.parentElement}return n};
  function cerrarArriba(){
    const {lista,extra}=abiertas();
    if(!lista.length){if(extra&&typeof window.pdAtrasVolver==='function'){window.pdAtrasVolver();return true}return false}
    /* se cierra la ventana que se abrió de último; si no se sabe, la que está más arriba */
    const ultima=pila.slice().reverse().find(el=>lista.includes(el));
    const orden=lista.slice().sort((a,b)=>z(b)-z(a)||(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?1:-1));
    const top=ultima||orden[0];
    const btn=[...top.querySelectorAll(CIERRES)].find(b=>visible(b)&&!b.disabled)||[...top.querySelectorAll('button')].find(b=>visible(b)&&/^[×✕✖]$/.test(b.textContent.trim()));
    if(btn){btn.click();return true}
    if(top.tagName==='BUTTON'){top.click();return true}
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    setTimeout(()=>{if(top.isConnected&&visible(top)){if('hidden' in top)top.hidden=true}},120);
    return true;
  }
  let puestos=0,ignorar=0,pila=[];
  try{history.replaceState(Object.assign({},history.state||{},{pdBase:true}),'')}catch(e){}
  function sync(ya){
    const ab=abiertas(),n=ab.nivel;
    pila=pila.filter(el=>ab.lista.includes(el));ab.lista.forEach(el=>{if(!pila.includes(el))pila.push(el)});
    if(n>puestos){for(let i=puestos;i<n;i++){try{history.pushState({pdNivel:i+1},'')}catch(e){}}puestos=n}
    else if(n<puestos){
      /* solo se retrocede si la ventana sigue cerrada un momento después (evita saltos cuando la lista se vuelve a dibujar) */
      clearTimeout(sync.t);const bajar=()=>{const m=abiertas().nivel;if(m<puestos){const d=puestos-m;puestos=m;ignorar++;try{history.go(-d)}catch(e){ignorar--}}};if(ya)bajar();else sync.t=setTimeout(bajar,600);
    }
  }
  addEventListener('popstate',()=>{
    if(ignorar>0){ignorar--;return}
    if(puestos>0){puestos--;const antes=abiertas().nivel;cerrarArriba();
      setTimeout(()=>{const ahora=abiertas().nivel;if(ahora>=antes&&ahora>0){try{history.pushState({pdNivel:puestos+1},'')}catch(e){}puestos++}else sync(true)},350)}
  });
  let t=null;const prog=()=>{clearTimeout(t);t=setTimeout(sync,150)};
  new MutationObserver(prog).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style','open']});
  setInterval(sync,1500);
  window.pdAtrasDebug=()=>({puestos,nivel:abiertas().nivel,lista:abiertas().lista.map(e=>e.id||e.className)});
})();
