(function(){
  if(window.pdTarifa)return;
  const RUTA='config/tarifas.json',BUCKET='restaurantes';
  /* Valores por defecto = la tarifa que ya usaba la tienda */
  const BASE={
    version:1,
    base:6, km_incluidos:3, por_km:2, redondeo:0.1, minimo:6, maximo:0,
    zonas:[],          // {nombre, lat, lng, radio_km, precio, activo}
    recargos:{
      nocturno:{activo:false,desde:'21:00',hasta:'06:00',monto:2},
      lluvia:{activo:false,monto:2},
      pedido_grande:{activo:false,desde_subtotal:150,monto:2}
    },
    actualizado:null
  };
  const cli=()=>{try{return sb}catch(e){}try{return db}catch(e){}return window.db||window.sb||null};
  const clonar=o=>JSON.parse(JSON.stringify(o));
  const mezclar=(a,b)=>{const r=clonar(a);if(!b||typeof b!=='object')return r;Object.keys(b).forEach(k=>{if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&r[k]&&typeof r[k]==='object')r[k]=mezclar(r[k],b[k]);else r[k]=b[k]});return r};
  let cfg=clonar(BASE),cargadoEn=0,promesa=null;
  try{const c=JSON.parse(localStorage.getItem('pd_tarifa_cfg')||'null');if(c)cfg=mezclar(BASE,c)}catch(e){}
  function urlPublica(){const c=cli();if(!c||!c.storage)return '';try{return c.storage.from(BUCKET).getPublicUrl(RUTA).data.publicUrl}catch(e){return ''}}
  async function cargar(forzar){
    if(!forzar&&Date.now()-cargadoEn<5*60*1000)return cfg;
    if(promesa)return promesa;
    promesa=(async()=>{
      const u=urlPublica();
      if(u){try{const r=await fetch(u+'?t='+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();cfg=mezclar(BASE,j);try{localStorage.setItem('pd_tarifa_cfg',JSON.stringify(cfg))}catch(e){}}}catch(e){}}
      cargadoEn=Date.now();promesa=null;return cfg;
    })();
    return promesa;
  }
  async function guardar(nuevo){
    const c=cli();if(!c||!c.storage)throw new Error('No hay conexión con Supabase.');
    const datos=mezclar(BASE,nuevo);datos.actualizado=new Date().toISOString();
    const blob=new Blob([JSON.stringify(datos,null,2)],{type:'application/json'});
    const {error}=await c.storage.from(BUCKET).upload(RUTA,blob,{upsert:true,contentType:'application/json',cacheControl:'0'});
    if(error)throw error;
    cfg=datos;cargadoEn=Date.now();try{localStorage.setItem('pd_tarifa_cfg',JSON.stringify(cfg))}catch(e){}
    return cfg;
  }
  /* Utilidades */
  const red=(v,p)=>{p=Number(p)||0.1;return Math.round((Number(v)+Number.EPSILON)/p)*p};
  const n2=v=>Math.round((Number(v)+Number.EPSILON)*100)/100;
  function recta(a,b){const R=6371,t=x=>x*Math.PI/180;const dLa=t(b.lat-a.lat),dLo=t(b.lng-a.lng);const h=Math.sin(dLa/2)**2+Math.cos(t(a.lat))*Math.cos(t(b.lat))*Math.sin(dLo/2)**2;return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
  function coords(v){
    if(!v)return null;if(typeof v==='object'){const la=Number(v.lat??v.latitude),ln=Number(v.lng??v.longitude);return Number.isFinite(la)&&Number.isFinite(ln)?{lat:la,lng:ln}:null}
    const s=decodeURIComponent(String(v));
    for(const re of [/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/]){const m=s.match(re);if(m){const la=Number(m[1]),ln=Number(m[2]);if(Number.isFinite(la)&&Number.isFinite(ln))return {lat:la,lng:ln}}}
    return null;
  }
  async function distanciaRuta(a,b){
    a=coords(a);b=coords(b);if(!a||!b)throw new Error('Faltan las ubicaciones para calcular la distancia.');
    try{const r=await fetch('https://router.project-osrm.org/route/v1/driving/'+a.lng+','+a.lat+';'+b.lng+','+b.lat+'?overview=false&alternatives=true');const j=await r.json();const d=(j.routes||[]).map(x=>Number(x.distance)/1000).filter(Number.isFinite);if(r.ok&&j.code==='Ok'&&d.length)return {km:Math.min(...d),aproximado:false}}catch(e){}
    try{const r=await fetch('https://valhalla1.openstreetmap.de/route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locations:[{lat:a.lat,lon:a.lng},{lat:b.lat,lon:b.lng}],costing:'motorcycle',units:'kilometers'})});const j=await r.json();const km=Number(j?.trip?.summary?.length);if(r.ok&&Number.isFinite(km))return {km,aproximado:false}}catch(e){}
    return {km:n2(recta(a,b)*1.3),aproximado:true};
  }
  function horaLima(fecha){try{return new Date(fecha||Date.now()).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Lima'})}catch(e){return '12:00'}}
  const aMin=h=>{const m=String(h||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null};
  function enFranja(h,desde,hasta){const x=aMin(h),a=aMin(desde),b=aMin(hasta);if(x==null||a==null||b==null)return false;return a<=b?(x>=a&&x<b):(x>=a||x<b)}
  /*
   * calcular({km, destino, subtotal, fecha}) → {total, km, zona, detalle:[{concepto,monto}], aproximado}
   * Mismo resultado en todos los paneles.
   */
  function calcular(o){return calcularCon(cfg,o)}
  function calcularCon(c,o){
    o=o||{};c=mezclar(BASE,c);const km=Math.max(0,Number(o.km)||0);const det=[];let total=0,zona=null;
    const dest=coords(o.destino);
    if(dest&&Array.isArray(c.zonas)){
      zona=c.zonas.filter(z=>z&&z.activo!==false&&Number.isFinite(Number(z.lat))&&Number.isFinite(Number(z.lng))&&Number(z.radio_km)>0&&Number(z.precio)>=0)
        .map(z=>({z,d:recta({lat:Number(z.lat),lng:Number(z.lng)},dest)})).filter(x=>x.d<=Number(x.z.radio_km)).sort((a,b)=>a.d-b.d)[0]?.z||null;
    }
    if(zona){total=Number(zona.precio);det.push({concepto:'Zona '+(zona.nombre||''),monto:n2(total)})}
    else{
      const base=Number(c.base)||0,inc=Number(c.km_incluidos)||0,pk=Number(c.por_km)||0;
      total=base;det.push({concepto:'Tarifa base (hasta '+inc+' km)',monto:n2(base)});
      if(km>inc){const extra=(km-inc)*pk;total+=extra;det.push({concepto:(km-inc).toFixed(1)+' km adicionales × S/ '+pk.toFixed(2),monto:n2(extra)})}
    }
    const R=c.recargos||{};
    if(R.nocturno&&R.nocturno.activo&&enFranja(horaLima(o.fecha),R.nocturno.desde,R.nocturno.hasta)){total+=Number(R.nocturno.monto)||0;det.push({concepto:'Recargo nocturno',monto:n2(R.nocturno.monto)})}
    if(R.lluvia&&R.lluvia.activo){total+=Number(R.lluvia.monto)||0;det.push({concepto:'Recargo por lluvia',monto:n2(R.lluvia.monto)})}
    if(R.pedido_grande&&R.pedido_grande.activo&&Number(o.subtotal)>=Number(R.pedido_grande.desde_subtotal)){total+=Number(R.pedido_grande.monto)||0;det.push({concepto:'Pedido grande',monto:n2(R.pedido_grande.monto)})}
    let fin=red(total,c.redondeo);
    if(Number(c.minimo)>0&&fin<Number(c.minimo)){det.push({concepto:'Ajuste a tarifa mínima',monto:n2(Number(c.minimo)-fin)});fin=Number(c.minimo)}
    if(Number(c.maximo)>0&&fin>Number(c.maximo)){det.push({concepto:'Tope de tarifa máxima',monto:n2(Number(c.maximo)-fin)});fin=Number(c.maximo)}
    return {total:n2(fin),km:n2(km),zona:zona?zona.nombre:null,detalle:det,aproximado:!!o.aproximado};
  }
  /* Lee el desglose guardado en un pedido (observaciones: __PIDEMAS_DELIVERY__{...}) */
  function desgloseDePedido(obs){
    const s=String(obs||'');const i=s.indexOf('__PIDEMAS_DELIVERY__');if(i<0)return null;
    let j=i+'__PIDEMAS_DELIVERY__'.length,prof=0,k=j;for(;k<s.length;k++){if(s[k]==='{')prof++;else if(s[k]==='}'){prof--;if(!prof){k++;break}}}
    try{const d=JSON.parse(s.slice(j,k));if(d&&typeof d.detalle==='string')d.detalle=d.detalle.split(';').filter(Boolean).map(x=>{const i=x.lastIndexOf('=');return {concepto:x.slice(0,i),monto:Number(x.slice(i+1))}});return d}catch(e){return null}
  }
  /* Desglose en texto plano (sin llaves anidadas) para la marca del pedido */
  window.pdDetalleTxt=function(){const t=window.__pdTarifaUltima;if(!t||!Array.isArray(t.detalle)||!t.detalle.length)return null;return t.detalle.map(d=>String(d.concepto).replace(/[;=|·{}\[\]"]/g,' ')+'='+d.monto).join(';')};
  window.pdTarifa={cargar,guardar,calcular,calcularCon,distanciaRuta,coords,desgloseDePedido,get config(){return clonar(cfg)},porDefecto:()=>clonar(BASE)};
  setTimeout(()=>{cargar().catch(()=>{})},300);
})();
