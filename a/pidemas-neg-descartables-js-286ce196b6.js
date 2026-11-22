(function(){
  const $=id=>document.getElementById(id);
  const neg=()=>{try{return restaurant}catch(e){return null}};
  const KEYS=['taper_p','taper_g','vaso_p','vaso_g','bolsa','cubiertos'];
  let tGuardar=null;
  const aviso=(t,mal)=>{const m=$('pdxDescMsg');if(m){m.textContent='';m.className=''}
    if(!t||/^Guardando/.test(t))return;
    if(mal){if(window.pdInfo)window.pdInfo(t);else if(window.pdAviso)window.pdAviso(t);return}
    if(window.pdExito)window.pdExito('Cambios guardados');else if(window.pdAviso)window.pdAviso(t)};
  function msgError(e){
    const m=String((e&&e.message)||e||'');
    return /descartables|column|schema/i.test(m)?'Falta crear las columnas de descartables en Supabase. Avisa al administrador.':'No se pudo guardar: '+m;
  }
  async function guardar(campos,ok){
    const r=neg();if(!r||!r.id){aviso('No se encontró tu negocio.',true);return false}
    aviso('Guardando…');
    try{
      const {data,error}=await db.from('negocios').update(campos).eq('id',r.id).select('id').maybeSingle();
      if(error)throw error;
      if(!data)throw new Error('Supabase no actualizó el negocio (revisa permisos).');
      Object.assign(r,campos);aviso(ok||'Guardado.');return true;
    }catch(e){aviso(msgError(e),true);return false}
  }
  function cfgActual(){const r=neg();let c=r&&r.descartables_config;if(typeof c==='string'){try{c=JSON.parse(c)}catch(e){c=null}}return c&&typeof c==='object'?c:{}}
  const txt=v=>{const n=Number(v);return v===null||v===undefined||v===''||!Number.isFinite(n)?'':(n===0?'0':n.toFixed(2))};
  /* vacío = no lo ofrece (null); 0 = gratis; inválido = undefined */
  function leer(k){
    const raw=String($('pdxDc_'+k)?.value||'').trim().replace(',','.');
    if(raw==='')return null;
    const n=Number(raw);
    if(!Number.isFinite(n)||n<0||n>50)return undefined;
    return Math.round(n*100)/100;
  }
  function conectar(){
    const tog=$('pdxDescTog'),box=$('pdxDescPrecioBox'),r=neg();
    if(!tog||!box||!r||!r.id||!$('pdxDc_bolsa'))return;
    if(tog.dataset.rid!==String(r.id)){
      tog.dataset.rid=String(r.id);
      const on=r.descartables_activo===true,c=cfgActual();
      tog.classList.toggle('on',on);box.hidden=!on;
      KEYS.forEach(k=>{$('pdxDc_'+k).value=txt(c[k])});
    }
    if(tog.dataset.cx)return;tog.dataset.cx='1';
    tog.addEventListener('click',async()=>{
      const nuevo=!tog.classList.contains('on');
      tog.disabled=true;
      const ok=await guardar({descartables_activo:nuevo},'Cambios guardados');
      tog.disabled=false;
      if(ok){tog.classList.toggle('on',nuevo);box.hidden=!nuevo}
    });
    if(!$('pdxDescSave')){const sv=document.createElement('button');sv.type='button';sv.id='pdxDescSave';sv.className='x-btn';sv.textContent='Guardar precios';box.appendChild(sv)}
    const enviar=async()=>{
      clearTimeout(tGuardar);
      const cfg={};
      const r0=neg()||{},PF=window.pdDescPerfil?window.pdDescPerfil(r0.categoria_negocio||r0.categoria||r0.tipo_negocio):null;
      for(const k of KEYS){if(PF&&!PF.keys.includes(k)){cfg[k]=null;continue}const v=leer(k);if(v===undefined){aviso('Escribe precios válidos, por ejemplo 0.50.',true);return}cfg[k]=v}
      if(JSON.stringify(cfg)===JSON.stringify(Object.assign({},...KEYS.map(k=>({[k]:cfgActual()[k]===undefined?null:cfgActual()[k]})))))return aviso('Cambios guardados');
      const prodActual=cfgActual().prod;if(prodActual&&typeof prodActual==='object')cfg.prod=prodActual;if(Array.isArray(cfgActual().extras))cfg.extras=cfgActual().extras;
      await guardar({descartables_config:cfg},'Precios guardados.');
    };
    $('pdxDescSave').addEventListener('click',async()=>{const b=$('pdxDescSave');const t0=b.textContent;b.disabled=true;b.textContent='Guardando…';try{await enviar()}finally{b.disabled=false;b.textContent=t0}});
  }
  setInterval(()=>{try{conectar()}catch(e){}},700);

  /* ===== Taper y vaso por producto (hoja «Editar producto») ===== */
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const P=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null};
  let selP=null;
  window.pdDescProdHook=function(p,body){
    selP=null;const r=neg();
    if(!r||r.descartables_activo!==true||!body)return;
    const c=cfgActual(),cur=(c.prod&&c.prod[String(p.id)])||{};
    const EX=(Array.isArray(c.extras)?c.extras:[]).filter(x=>x&&x.id&&x.n);
    const comida=!(window.pdDescPerfil&&window.pdDescPerfil(r.categoria_negocio||r.categoria||r.tipo_negocio).tipo!=='comida');
    if(!comida&&!EX.length)return;
    selP={id:String(p.id),taper:cur.taper==='p'||cur.taper==='g'?cur.taper:'',vaso:cur.vaso==='p'||cur.vaso==='g'?cur.vaso:'',ex:new Set((Array.isArray(cur.ex)?cur.ex:[]).map(String))};
    const hay=['taper_p','taper_g','vaso_p','vaso_g'].some(k=>P(c[k])!==null);
    const fila=(t,nom)=>{
      const op=(k,lab)=>{const pr=k?P(c[t+'_'+k]):0;const off=k&&pr===null;
        return `<button type="button" data-dt="${t}" data-dk="${k}" ${off?'disabled':''} aria-pressed="${selP[t]===k}">${lab}${k?(off?' · sin precio':' · '+money(pr)):''}</button>`};
      return `<div class="pdpRow"><b>${nom}</b><div class="pdpSeg">${op('','No lleva')}${op('p','Pequeño')}${op('g','Grande')}</div></div>`;
    };
    const box=document.createElement('div');box.className='pdpBox';box.id='pdpBox';
    box.innerHTML=`<div class="pdpHead"><strong>Descartables de este producto</strong></div>
      <p class="pdpHint">${hay?'Lo que elijas se agrega solo cuando el cliente pide este producto, y su precio se suma al del producto.':'Primero escribe los precios de taper y vaso en Mi negocio → Descartables.'}</p>
      ${comida?fila('taper','Taper')+fila('vaso','Vaso'):''}${EX.map(x=>`<div class="pdpRow"><b>${String(x.n).replace(/[&<>"]/g,'')}</b><div class="pdpSeg"><button type="button" data-dx="${x.id}" data-v="0" aria-pressed="${!selP.ex.has(String(x.id))}">No lleva</button><button type="button" data-dx="${x.id}" data-v="1" aria-pressed="${selP.ex.has(String(x.id))}">Lleva · ${money(x.p)}</button></div></div>`).join('')}`;
    const anchor=body.querySelector('#pdxEFull');anchor?anchor.before(box):body.appendChild(box);
    box.addEventListener('click',e=>{
      const bx=e.target.closest('button[data-dx]');if(bx){const id=bx.dataset.dx;if(bx.dataset.v==='1')selP.ex.add(id);else selP.ex.delete(id);box.querySelectorAll(`button[data-dx="${id}"]`).forEach(x=>x.setAttribute('aria-pressed',String((x.dataset.v==='1')===selP.ex.has(id))));return}
      const b=e.target.closest('button[data-dt]');if(!b||b.disabled)return;
      selP[b.dataset.dt]=b.dataset.dk;
      box.querySelectorAll(`button[data-dt="${b.dataset.dt}"]`).forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.dk===selP[b.dataset.dt])));
    });
  };
  /* Devuelve un texto de error, o null si todo bien */
  window.pdDescProdGuardar=async function(p){
    if(!selP||selP.id!==String(p.id)||!document.getElementById('pdpBox'))return null;
    const r=neg();if(!r||!r.id)return null;
    const c=Object.assign({},cfgActual()),prod=Object.assign({},c.prod||{}),id=String(p.id);
    const nuevo={};if(selP.taper)nuevo.taper=selP.taper;if(selP.vaso)nuevo.vaso=selP.vaso;if(selP.ex&&selP.ex.size)nuevo.ex=[...selP.ex];
    const antes=JSON.stringify(prod[id]||{});
    if(JSON.stringify(nuevo)===antes)return null;
    if(Object.keys(nuevo).length)prod[id]=nuevo;else delete prod[id];
    c.prod=prod;
    try{
      const {data,error}=await db.from('negocios').update({descartables_config:c}).eq('id',r.id).select('id').maybeSingle();
      if(error)throw error;
      if(!data)throw new Error('No se actualizó el negocio (revisa permisos).');
      r.descartables_config=c;return null;
    }catch(e){return 'No se pudieron guardar los descartables: '+((e&&e.message)||e)}
  };
})();
