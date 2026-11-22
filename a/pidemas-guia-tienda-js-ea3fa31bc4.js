/* Guía de la Tienda: reconoce botones, campos, tarjetas, pastillas, títulos, etiquetas e íconos por su forma
   y les pone las medidas de la Tienda. No cambia colores de fondo. */
(function(){
if(window.__pdGuiaTienda)return;window.__pdGuiaTienda=1;
const NO='#pdMenu, .leaflet-container, .maplibregl-map, nav, #nav, [class*="Slide"], [class*="slide"], [class*="swipe"], [class*="Swipe"], [class*="navbtn"], [class*="Nav"], [class*="gqzNo"], #pdMenuShade';
const TR=v=>!v||v==='transparent'||/rgba\([^)]*,\s*0\)$/.test(v);
const NEUTRO=v=>TR(v)||/^rgba?\((255, 255, 255|255, 249, 245|255, 251, 248|253, 240, 234|250, 247, 244|255, 250, 247)(, 1)?\)$/.test(v);
const NAR=/^rgb\((196, 65, 12|166, 53, 8|194, 65, 12|197, 66, 13)\)$/;
const CS=e=>getComputedStyle(e);
const vis=e=>{const r=e.getBoundingClientRect();return r.width>1&&r.height>1?r:null};
let CAT='gqz';const mark=(e,v)=>{e.dataset[CAT]=v};
const colorAnc=e=>{let x=e.parentElement,n=0;while(x&&x!==document.body&&n<12){const c=CS(x);if(!NEUTRO(c.backgroundColor)&&parseFloat(c.borderTopLeftRadius)>=8)return true;x=x.parentElement;n++}return false};
const fixedTop=e=>{let x=e.parentElement,n=0;while(x&&x!==document.body&&n<14){const c=CS(x);if(c.position==='fixed'){return e.getBoundingClientRect().top-x.getBoundingClientRect().top<130}x=x.parentElement;n++}return false};
function boton(b){
  const r=vis(b);if(!r)return;if(b.closest(NO))return mark(b,'x');
  const c=CS(b),txt=(b.textContent||'').trim(),ico=b.querySelector('svg,i,img');
  if(r.height>70||(ico&&txt&&/flex/.test(c.display)&&c.flexDirection==='column')||(r.height>=50&&b.childElementCount>=2)||(!txt&&!ico)||(r.width<=64&&r.height<=36&&!txt&&!ico))return mark(b,'x');
  const rad=parseFloat(c.borderTopLeftRadius)||0,sq=Math.abs(r.width-r.height)<=8&&r.width>=28&&r.width<=56;
  if(sq&&txt.length<=2){b.classList.add('gqzB-ico');if(/^[×✕x]$/i.test(txt))b.classList.add('gqzX');return mark(b,'ico')}
  if(TR(c.backgroundColor)&&parseFloat(c.borderTopWidth)===0)return mark(b,'x');
  {const p0=b.parentElement;if(p0){const pc=CS(p0),hs=[...p0.children].filter(x=>x.matches('button'));if(hs.length>=2&&hs.length===p0.children.length&&(!TR(pc.backgroundColor)||parseFloat(pc.borderTopWidth)>0)&&parseFloat(pc.borderTopLeftRadius)>=8)return mark(b,'x')}}
  if(rad>=r.height/2-2&&r.height<=46){b.classList.add(r.height<=40?'gqzB-chip':'gqzB-opt');return mark(b,'p')}
  const p=b.parentElement,pw=p?p.getBoundingClientRect().width:0,or=NAR.test(c.backgroundColor);
  if(r.width>=pw*.6||or){b.classList.add('gqzB-main');if(or)b.classList.add('gqzOr');return mark(b,'m')}
  b.classList.add('gqzB-sec');
  if(p&&[...p.querySelectorAll('button')].some(x=>x!==b&&(x.getBoundingClientRect().height>=46||x.classList.contains('gqzB-main'))))b.classList.add('gqzPar');
  mark(b,'s');
}
function campo(i){
  const r=vis(i);if(!r)return;if(i.closest(NO))return mark(i,'x');
  const t=(i.type||'').toLowerCase();
  if(['checkbox','radio','range','file','hidden','color','button','submit','image','reset'].includes(t))return mark(i,'x');
  const c=CS(i);if(TR(c.backgroundColor)&&parseFloat(c.borderTopWidth)===0)return mark(i,'x');
  i.classList.add('gqzF');mark(i,'f');
  const l=i.closest('label')||(i.id&&document.querySelector('label[for="'+CSS.escape(i.id)+'"]'))||(i.closest('.field,.f,[class*="Field"],[class*="field"]')||{}).querySelector?.call(i.closest('.field,.f,[class*="Field"],[class*="field"]')||document.createElement('i'),'label');
  if(l&&!l.dataset.gqzl&&!l.closest(NO)&&(l.textContent||'').trim().length<60){l.classList.add('gqzL');l.dataset.gqzl='1'}
}
function tarjeta(e){
  const r=vis(e);if(!r)return;
  if(r.height<44||r.width<120)return mark(e,'x');
  const c=CS(e),rad=parseFloat(c.borderTopLeftRadius)||0,bw=parseFloat(c.borderTopWidth)||0;
  if(rad<10||(bw===0&&TR(c.backgroundColor))||c.position==='fixed'||c.position==='sticky'||e.closest(NO))return mark(e,'x');
  if(!NEUTRO(c.backgroundColor))return mark(e,'x');
  if(e.parentElement&&e.parentElement.closest('.gqzC,.gqzCi')){e.classList.add('gqzCi');return mark(e,'ci')}
  e.classList.add('gqzC');
  const m=(c.borderTopColor||'').match(/\d+/g)||[];const fuerte=bw>0&&m.length>=3&&(+m[0]-+m[2]>70);
  if(bw===0)e.classList.add('gqzBl','gqzSinBorde');mark(e,'c');
}
function pastilla(e){
  const r=vis(e);if(!r)return;
  if(e.matches('button,input,select,textarea')||e.classList.contains('gqzT-hoja')||e.classList.contains('gqzT-sec'))return mark(e,'x');
  const t=(e.textContent||'').trim();
  if(r.height<=14||r.height>34||r.width>240||!t||t.length>30||e.childElementCount>2||Math.abs(r.width-r.height)<=6&&!/^\d{1,3}\+?$/.test(t)||e.closest(NO))return mark(e,'x');
  const c=CS(e);if(TR(c.backgroundColor)||(parseFloat(c.borderTopLeftRadius)||0)<8)return mark(e,'x');
  if(/^\d{1,3}\+?$/.test(t)&&r.width<=28){e.classList.add('gqzN');return mark(e,'n')}
  e.classList.add('gqzP');if(c.display==='inline'||c.display==='inline-block')e.classList.add('gqzIn');mark(e,'p');
}
function titulo(e){
  const r=vis(e);if(!r)return;if(e.closest(NO)||e.closest('button'))return mark(e,'x');
  const c=CS(e),fs=parseFloat(c.fontSize),fw=parseInt(c.fontWeight)||400,t=(e.textContent||'').trim();
  if(!t||t.length>70||/S\/\s?\d|^\d|%$/.test(t))return mark(e,'x');
  const h12=/^H[12]$/.test(e.tagName),h34=/^H[34]$/.test(e.tagName),nar=NAR.test(c.color),col=colorAnc(e);
  if(h12||(fs>=18.5&&fw>=700&&nar)){e.classList.add(fixedTop(e)?'gqzT-hoja':'gqzT-sec');if(!col)e.classList.add('gqzNar');return mark(e,'t')}
  if(h34||(fs>=15&&fs<=18&&fw>=800&&/^rgb\(166, 53, 8\)$/.test(c.color))){e.classList.add('gqzT-tarj');if(!col&&(nar||/^rgb\(166, 53, 8\)$/.test(c.color)))e.classList.add('gqzNar');return mark(e,'t')}
  if(c.textTransform==='uppercase'&&fs<=12.5&&t.length<=40&&e.childElementCount===0){e.classList.add('gqzK');if(!col)e.classList.add('gqzNar');return mark(e,'k')}
  mark(e,'x');
}
function icono(e){
  const r=vis(e);if(!r)return;if(e.closest('#pdMenu, .leaflet-container, .maplibregl-map, nav, #nav, [class*="Slide"], [class*="slide"], [class*="navbtn"], [class*="Nav"]'))return mark(e,'x');
  const isSvg=e.tagName.toLowerCase()==='svg';
  if(r.width>30||r.width<12)return mark(e,'x');
  const b=e.closest('button,a,[role=button]');let k='gqzI20';
  if(b&&b.classList.contains('gqzB-ico'))k='gqzI20';
  else if(b&&(b.classList.contains('gqzB-main')||b.classList.contains('gqzB-sec')||b.classList.contains('gqzB-opt')))k='gqzI18';
  else if(b&&b.classList.contains('gqzB-chip'))k='gqzI16';
  else if(r.width<=15)return mark(e,'x');
  else if(r.width<=17)k='gqzI16';
  e.classList.add(k);
  if(isSvg){const c=CS(e),p=e.querySelector('path,circle,rect,line,polyline,polygon');const st=c.stroke!=='none'||(p&&CS(p).stroke!=='none');if(st)e.classList.add('gqzI')}
  mark(e,'i');
}
const Q=[['button,a.btn,[role="button"],input[type="button"],input[type="submit"]',boton,'gqzb'],['input,select,textarea',campo,'gqzf'],['div,section,article,li,aside,form,fieldset,details,a',tarjeta,'gqzc'],['h1,h2,h3,h4,strong,b,span,div,p,small',titulo,'gqzt'],['span,small,b,em,i,strong,time,label,div',pastilla,'gqzp'],['svg,i[class*="ti-"]',icono,'gqzi']];
/* Se aplica en el mismo instante en que algo aparece (antes de pintarse), así nada salta de tamaño */
function escanear(root){
  for(const [sel,fn,k] of Q){
    CAT=k;
    const els=root===document.body?root.querySelectorAll(sel):[...(root.matches&&root.matches(sel)?[root]:[]),...root.querySelectorAll(sel)];
    for(const e of els){if(e.dataset[k])continue;
      if(k==='gqzt'&&!/^H[1-4]$/.test(e.tagName)&&e.childElementCount>1){e.dataset[k]='x';continue}
      if(k==='gqzp'||k==='gqzc'){const r=e.getBoundingClientRect();if(r.height<=1)continue;if(k==='gqzp'&&(r.height>34||r.height<=14)){e.dataset[k]='x';continue}if(k==='gqzc'&&(r.height<44||r.width<120)){e.dataset[k]='x';continue}}
      if(k!=='gqzc'&&k!=='gqzp'&&(e.classList.contains('gqzC')||e.classList.contains('gqzCi'))){e.dataset[k]='x';continue}
      try{fn(e)}catch(err){}
    }
  }
}
let enCurso=false;
function alCambiar(recs){
  if(enCurso)return;enCurso=true;
  try{
    const roots=new Set();
    for(const r of recs){
      if(r.type==='childList'){for(const n of r.addedNodes)if(n.nodeType===1)roots.add(n)}
      else if(r.target&&r.target.nodeType===1){if(r.attributeName==='class'){const sin=v=>String(v||'').split(/\s+/).filter(x=>x&&!/^gqz/.test(x)).sort().join(' ');if(sin(r.oldValue)===sin(r.target.getAttribute('class')))continue}roots.add(r.target)}
    }
    const lista=[...roots].filter(n=>n.isConnected&&![...roots].some(o=>o!==n&&o.contains(n)));
    if(lista.length>40){escanear(document.body)}else for(const n of lista){if(n.querySelectorAll)escanear(n)}
  }finally{enCurso=false}
}
let tm=null;const repaso=()=>{if(tm)clearTimeout(tm);tm=setTimeout(()=>{tm=null;escanear(document.body)},700)};
new MutationObserver(recs=>{alCambiar(recs);repaso()}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class','hidden','open','aria-hidden','style']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>escanear(document.body));else escanear(document.body);
window.addEventListener('load',()=>escanear(document.body));
})();
