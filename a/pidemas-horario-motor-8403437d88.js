(function(){
  if(window.pdHorario)return;
  const RUTA='config/horario.json',BUCKET='restaurantes';
  const DIAS=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  const NOM={lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo'};
  const BASE={dias:{},cerrados:[],aviso_min:30,actualizado:null};
  DIAS.forEach(d=>{BASE.dias[d]={activo:d!=='domingo',abre:'09:00',ultimo:'21:30'}});
  const clon=o=>JSON.parse(JSON.stringify(o));
  const mezclar=c=>{const r=clon(BASE);if(!c||typeof c!=='object')return r;DIAS.forEach(d=>{if(c.dias&&c.dias[d])r.dias[d]=Object.assign(r.dias[d],c.dias[d])});if(Array.isArray(c.cerrados))r.cerrados=c.cerrados.filter(Boolean);if(Number(c.aviso_min)>=0)r.aviso_min=Number(c.aviso_min);r.actualizado=c.actualizado||null;return r};
  let cfg=clon(BASE);try{const c=JSON.parse(localStorage.getItem('pd_horario_cfg')||'null');if(c)cfg=mezclar(c)}catch(e){}
  const cli=()=>{try{return sb}catch(e){}try{return db}catch(e){}return window.db||window.sb||null};
  const aMin=h=>{const m=String(h||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null};
  const hora=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mi=m%60,ap=h>=12?'p. m.':'a. m.',h12=h%12||12;return h12+':'+String(mi).padStart(2,'0')+' '+ap};
  function limaHoy(){try{return getLimaNow()}catch(e){}const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());const v={};p.forEach(x=>v[x.type]=x.value);return new Date(+v.year,+v.month-1,+v.day,+v.hour%24,+v.minute)}
  const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  /* Horario de un día: {abre, ultimo} en minutos, o false si Pidemás no atiende */
  function delDia(fecha){
    const d=fecha||limaHoy();const k=DIAS[d.getDay()];const c=cfg.dias[k];
    if(!c||c.activo===false)return false;
    if((cfg.cerrados||[]).includes(iso(d)))return false;
    const a=aMin(c.abre),u=aMin(c.ultimo);if(a==null||u==null||u<=a)return false;
    return {abre:a,ultimo:u};
  }
  /* Próxima apertura desde ahora */
  function proxima(){
    const n=limaHoy(),cur=n.getHours()*60+n.getMinutes();
    for(let i=0;i<=14;i++){const f=new Date(n);f.setDate(n.getDate()+i);const h=delDia(f);if(!h)continue;if(i===0&&cur>=h.abre)continue;
      const cuando=i===0?'hoy':i===1?'mañana':'el '+['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][f.getDay()];return {cuando,hora:hora(h.abre)}}
    return null;
  }
  /* PD_HORARIO (objeto del horario general de la tienda) pasa a leer este horario.
     Durante getDailySchedule(fecha) se usa el día consultado; en el resto, el de hoy. */
  let ctx=null;
  function instalar(){
    const H=window.PD_HORARIO;if(!H||H.__pd||typeof window.showRestaurant!=='function')return;
    const val=k=>{const h=delDia(ctx||limaHoy());if(!h)return 0;if(k==='abre')return h.abre;if(k==='ultimo')return h.ultimo;if(k==='cierra')return h.ultimo+30;if(k==='aviso')return Math.max(h.abre,h.ultimo-(Number(cfg.aviso_min)||30));return 0};
    Object.defineProperty(H,'abre',{get:()=>val('abre'),configurable:true});
    Object.defineProperty(H,'ultimoPedido',{get:()=>val('ultimo'),configurable:true});
    Object.defineProperty(H,'cierra',{get:()=>val('cierra'),configurable:true});
    Object.defineProperty(H,'aviso',{get:()=>val('aviso'),configurable:true});
    Object.defineProperty(H,'__pd',{value:true});
    const g=window.getDailySchedule;
    if(typeof g==='function'){
      window.getDailySchedule=function(h,date){const f=date||limaHoy();if(!delDia(f))return null;const prev=ctx;ctx=f;try{return g.apply(this,arguments)}finally{ctx=prev}};
    }
  }
  window.pdHoraTxt=hora;
  window.pdHorarioDia=delDia;
  window.pdHorarioMsgCerrado=function(){
    const h=delDia(),p=proxima();
    if(!h)return 'Hoy Pidemás no atiende.'+(p?' Vuelve '+p.cuando+' desde las '+p.hora:'');
    return 'Pidemás recibe pedidos hoy de '+hora(h.abre)+' a '+hora(h.ultimo)+(p&&p.cuando!=='hoy'?' Vuelve '+p.cuando+' desde las '+p.hora:p?' Abrimos a las '+p.hora:'');
  };
  window.pdHorarioBarraCerrado=function(){
    const h=delDia(),p=proxima();
    if(!h)return 'Hoy no atendemos'+(p?' · abrimos '+p.cuando+' '+p.hora:'');
    return 'Cerrado · pedidos de '+hora(h.abre)+' a '+hora(h.ultimo)+(p&&p.cuando!=='hoy'?' · abrimos '+p.cuando+' '+p.hora:'');
  };
  window.pdHorarioSemana=function(){return ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].map(k=>{const c=cfg.dias[k];return {dia:NOM[k],activo:c.activo!==false,abre:c.abre,ultimo:c.ultimo}})};
  async function cargar(){
    const c=cli();if(!c||!c.storage)return cfg;
    try{const u=c.storage.from(BUCKET).getPublicUrl(RUTA).data.publicUrl;const r=await fetch(u+'?t='+Date.now(),{cache:'no-store'});if(r.ok){cfg=mezclar(await r.json());try{localStorage.setItem('pd_horario_cfg',JSON.stringify(cfg))}catch(e){}}}catch(e){}
    try{if(typeof refreshRestaurantStatuses==='function')refreshRestaurantStatuses()}catch(e){}
    try{if(typeof renderRestaurants==='function')renderRestaurants()}catch(e){}
    return cfg;
  }
  async function guardar(nuevo){
    const c=cli();if(!c||!c.storage)throw new Error('No hay conexión con Supabase.');
    const datos=mezclar(nuevo);datos.actualizado=new Date().toISOString();
    const {error}=await c.storage.from(BUCKET).upload(RUTA,new Blob([JSON.stringify(datos,null,2)],{type:'application/json'}),{upsert:true,contentType:'application/json',cacheControl:'0'});
    if(error)throw error;cfg=datos;try{localStorage.setItem('pd_horario_cfg',JSON.stringify(cfg))}catch(e){}return cfg;
  }
  window.pdHorario={cargar,guardar,delDia,proxima,DIAS,NOM,get config(){return clon(cfg)},porDefecto:()=>clon(BASE)};
  instalar();
  setTimeout(()=>{instalar();cargar()},200);
})();
