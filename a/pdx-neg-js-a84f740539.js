(function(){
  if(window.__pdxNeg)return;window.__pdxNeg=true;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const code=id=>'#'+String(id||'').slice(0,8).toUpperCase();
  const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const SVG={ref:'<svg viewBox="0 0 24 24" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>',up:'<svg viewBox="0 0 24 24" stroke-width="2.2"><path d="M6 15l6-6 6 6"/></svg>',down:'<svg viewBox="0 0 24 24" stroke-width="2.2"><path d="M6 9l6 6 6-6"/></svg>',edit:'<svg viewBox="0 0 24 24" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',del:'<svg viewBox="0 0 24 24" stroke-width="2"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>'};
  function keep(n){if(!n)return;let k=document.getElementById('pdxKeep');if(!k){k=document.createElement('div');k.id='pdxKeep';k.hidden=true;k.style.display='none';document.body.appendChild(k)}k.appendChild(n)}
  const R=()=>(typeof restaurant!=='undefined'&&restaurant)?restaurant:null;

  /* ============ Hora de Lima y horario ============ */
  const DAYS=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
  const DNAME={lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo'};
  const KEYS=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  function lima(){const p={};new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()).forEach(x=>{if(x.type!=='literal')p[x.type]=x.value});return new Date(+p.year,+p.month-1,+p.day,(+p.hour)%24,+p.minute)}
  function parseH(raw){const o={};String(raw||'').split('|').forEach(part=>{const [d,h]=part.split('=');if(!d||!h)return;const L=h.split(',');const a=(L[0]||'').split('-')[0],c=(L[L.length-1]||'').split('-')[1];if(/^\d{1,2}:\d{2}$/.test(a||'')&&/^\d{1,2}:\d{2}$/.test(c||''))o[d.trim()]=[a,c]});return o}
  const toMin=t=>{const m=String(t).match(/^(\d{1,2}):(\d{2})/);return m?+m[1]*60+ +m[2]:null};
  const fmtT=t=>{const m=toMin(t);if(m===null)return '';const h=Math.floor(m/60),mm=m%60;return (h%12||12)+(mm?':'+String(mm).padStart(2,'0'):'')+' '+(h>=12?'p. m.':'a. m.')};
  const horarioRaw=()=>{const r=R()||{};return r.horario??r.horarios??r.horario_atencion??''};
  function status(){
    const h=parseH(horarioRaw()),now=lima(),cur=now.getHours()*60+now.getMinutes(),today=KEYS[now.getDay()];
    const t=h[today];
    if(t){const a=toMin(t[0]),c=toMin(t[1]);const open=a<c?(cur>=a&&cur<c):(cur>=a||cur<c);if(open)return {open:true,text:'Cierra a las '+fmtT(t[1])}}
    for(let i=0;i<8;i++){const d=new Date(now);d.setDate(d.getDate()+i);const k=KEYS[d.getDay()],v=h[k];if(!v)continue;const a=toMin(v[0]);if(i===0&&a<=cur)continue;return {open:false,text:'Abre '+(i===0?'hoy':i===1?'mañana':'el '+DNAME[k].toLowerCase())+' a las '+fmtT(v[0])}}
    return {open:false,text:'Sin horario configurado'};
  }
  // Corrige el estado «Abierto/Cerrado» para usar siempre la hora de Lima.
  window.estaAbiertoAhora=function(abre,cierra,dia){const now=lima();if(dia!==KEYS[now.getDay()])return false;const a=toMin(abre),c=toMin(cierra);if(a===null||c===null)return false;const cur=now.getHours()*60+now.getMinutes();return a<=c?(cur>=a&&cur<c):(cur>=a||cur<c)};

  /* ============ Sonido y avisos ============ */
  const Snd={ctx:null,on:LS.get('pd_sound','on')!=='off',
    async ready(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;if(!this.ctx)this.ctx=new C();if(this.ctx.state==='suspended')await this.ctx.resume();return this.ctx.state==='running'}catch(e){return false}},
    seq(n,v){const c=this.ctx;if(!c)return;const t0=c.currentTime+0.02;n.forEach(([f,at,d,t])=>{const o=c.createOscillator(),g=c.createGain();o.type=t||'sine';o.frequency.setValueAtTime(f,t0+at);g.gain.setValueAtTime(0.0001,t0+at);g.gain.exponentialRampToValueAtTime(v||.35,t0+at+.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+at+d);o.connect(g);g.connect(c.destination);o.start(t0+at);o.stop(t0+at+d+.05)})},
    PAT:{nuevo:{n:[[784,0,.16,'square'],[1047,.16,.16,'square'],[1319,.32,.26,'square'],[784,.75,.16,'square'],[1047,.91,.16,'square'],[1319,1.07,.32,'square']],v:.22,vib:[400,150,400,150,600]},cancel:{n:[[988,0,.22,'triangle'],[740,.24,.22,'triangle'],[494,.48,.45,'triangle']],v:.4,vib:[600,200,600]},cambio:{n:[[880,0,.14],[1175,.16,.24]],v:.35,vib:[200,100,200]},ok:{n:[[1047,0,.16],[1319,.17,.16],[1568,.34,.3]],v:.3,vib:[150,80,150]},info:{n:[[988,0,.25]],v:.3,vib:[150]}},
    async play(k){const p=this.PAT[k]||this.PAT.info;try{navigator.vibrate&&navigator.vibrate(p.vib)}catch(e){}if(!this.on)return true;const ok=await this.ready();if(ok)this.seq(p.n,p.v);return ok}};
  window.PdSound=Snd;
  let bannerOff=LS.get('pd_banner_off','')==='1';const setBannerOff=()=>{bannerOff=true;LS.set('pd_banner_off','1');const b=$('pdxBanner');if(b){b.hidden=true;b.style.setProperty('display','none','important')}};
  ['click','touchend','keydown'].forEach(ev=>document.addEventListener(ev,()=>{Snd.ready().then(ok=>{if(ok)setBannerOff()})},{passive:true}));
  let swReg=null;
  if('serviceWorker' in navigator&&window.isSecureContext){navigator.serviceWorker.register('sw.js').then(r=>swReg=r).catch(()=>{});navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='pd-open'&&e.data.pedidoId)openOrder(e.data.pedidoId)})}
  async function osNotify(title,body,o){if(!('Notification' in window)||Notification.permission!=='granted')return;if(document.visibilityState==='visible'&&document.hasFocus())return;const opt={body,tag:'pidemas-'+(o.tag||Date.now()),renotify:true,vibrate:o.vib,requireInteraction:!!o.sticky,data:{pedidoId:o.pedidoId||null}};try{const r=swReg||(await navigator.serviceWorker?.getRegistration?.());if(r&&r.showNotification){await r.showNotification(title,opt);return}}catch(e){}try{const n=new Notification(title,opt);n.onclick=()=>{window.focus();if(o.pedidoId)openOrder(o.pedidoId);n.close()}}catch(e){}}
  const ICON={nuevo:'🛎',cancel:'✕',cambio:'✎',ok:'✓',info:'🔔'};
  const ringing=new Map();const baseTitle=document.title;let titleT=null;
  function flash(on,t){clearInterval(titleT);if(!on){document.title=baseTitle;return}let f=false;titleT=setInterval(()=>{f=!f;document.title=f?'🔴 '+t:baseTitle},1000)}
  function stopRing(k){const r=ringing.get(k);if(r){clearInterval(r);ringing.delete(k)}if(!ringing.size)flash(false)}
  function dismiss(c){if(!c)return;stopRing(c.dataset.key);c.remove()}
  const DFB={PASOS:['Recibido','Preparando','Recogiendo','En camino','Entregado'],fase:o=>({n:1,txt:o.negocio_id?'Por aceptar':'Recibido',k:'new'}),money:n=>'S/ '+(Number(n)||0).toFixed(2),
    hace:d=>{const t=new Date(d).getTime();if(!t)return '';const m=Math.max(0,Math.round((Date.now()-t)/60000));if(m<1)return 'Ahora';if(m<60)return 'Hace '+m+' min';const h=Math.floor(m/60);return h<24?'Hace '+h+' h':'Hace '+Math.floor(h/24)+' d'},
    codigo:(o,id)=>'#'+String(o.codigo||String(id).replace(/-/g,'').slice(0,8)).toUpperCase()};
  async function alertUser({kind,title,text,pedidoId,sticky,key,actions,orden}){
    const box=$('pdxAlerts');if(!box)return;key=key||kind+':'+(pedidoId||Date.now());
    box.querySelector(`[data-key="${CSS.escape(key)}"]`)?.remove();
    const c=document.createElement('div');c.className='pdA'+(kind==='nuevo'?' urgent':kind==='cancel'?' cancel':'');c.dataset.key=key;c.setAttribute('role','alert');
    const acts=actions||(pedidoId?[{label:'Ver pedido',main:true,run:()=>openOrder(pedidoId)}]:[]);
    const tarjeta=kind==='nuevo'&&pedidoId&&/^(Nuevo pedido|Tienes)/i.test(String(title||''));
    if(tarjeta){
      c.classList.add('pdAC');
      const pintarT=()=>{const o=(typeof businessOrders!=='undefined'&&Array.isArray(businessOrders)?businessOrders:[]).find(x=>String(x.id)===String(pedidoId))||(window.pdUDatos&&window.pdUDatos.ped&&window.pdUDatos.ped(pedidoId))||orden;if(!o)return false;
        const D=window.pdUDatos||DFB,id=String(pedidoId),f=D.fase(o),r=R()||{},lg=r.logo_url||r.logo||r.imagen_logo_url||r.imagen_logo||'';
        const bars=D.PASOS.map((_,i)=>'<s class="'+(f.n===0?'no':i<f.n?'on':'')+'"></s>').join('');
        const nm=String(o.nombre_cliente||o.cliente_nombre||'Cliente').trim().split(/\s+/);const cli=nm.length>1?nm[0]+' '+nm[1][0]+'.':nm[0];
        const tipo=/recojo|recoger|tienda/i.test(String(o.tipo_entrega||''))?'Recojo en tienda':'Delivery';
        const it=Array.isArray(o.detalle_pedidos)?o.detalle_pedidos:[];
        const det=it.length?it.map(d=>'<b>'+E(Number(d.cantidad)||1)+'×</b> '+E(d.nombre_producto||d.producto_nombre||d.nombre||'Producto')).join(' · '):'<span class="pdUMut">Cargando productos…</span>';
        const h=(lg?'<span class="pdACbg" aria-hidden="true" style="background-image:url(&quot;'+E(lg)+'&quot;)"></span>':'')
          +'<div class="pdACtop"><span><i></i>'+E((String(title).match(/(\d+) pedidos/)||[])[1]?String(title).match(/(\d+) pedidos/)[1]+' pedidos nuevos':'Nuevo pedido')+'</span><button type="button" class="pdAClose" aria-label="Cerrar">×</button></div>'
          +'<div class="pdU"><div class="pdUR1"><b>'+E(D.codigo(o,id))+'</b><span>'+E(D.hace(o.creado_en||o.created_at))+'</span><i>'+E(D.money(o.total))+'</i></div>'
          +'<div class="pdUR2"><span class="pdUPill '+f.k+'"><i></i>'+E(f.txt)+'</span>'+(r.nombre?'<span class="pdNegB pdUNeg"><em'+(lg?' style="background-image:url(&quot;'+E(lg)+'&quot;)"':'')+'>'+(lg?'':E(String(r.nombre).trim().charAt(0).toUpperCase()))+'</em><span>'+E(r.nombre)+'</span></span>':'')+'</div>'
          +'<div class="pdUBars">'+bars+'</div>'
          +'<div class="pdUFase"><span>'+(f.n?'Paso '+f.n+' de 5 · '+E(D.PASOS[f.n-1]):E(f.txt))+'</span><span>'+(f.n===1?'Sigue: aceptar pedido':'')+'</span></div>'
          +'<div class="pdUCli"><strong>'+E(cli)+'</strong><small>· '+E(tipo)+'</small></div>'
          +'<div class="pdUDet">'+det+'</div></div>'
          +'<div class="pdUAct"><button type="button" class="pdUBtn" data-t="seg">Seguimiento</button><button type="button" class="pdUBtn pri" data-t="acc">Aceptar pedido</button></div>'
          +'<span class="pdASound" hidden>Toca aquí para activar el sonido de los avisos.</span>';
        if(c.__h===h)return true;const snd=c.querySelector('.pdASound');const oculto=!snd||snd.hidden;c.innerHTML=h;c.__h=h;c.querySelector('.pdASound').hidden=oculto;
        c.querySelector('.pdAClose').onclick=e=>{e.stopPropagation();dismiss(c)};
        c.querySelector('[data-t="seg"]').onclick=e=>{e.stopPropagation();dismiss(c);try{window.pdxTrack&&window.pdxTrack(id)}catch(_){}};
        c.querySelector('[data-t="acc"]').onclick=e=>{e.stopPropagation();dismiss(c);try{if(window.pdoAbrir&&((typeof businessOrders!=='undefined'?businessOrders:[]).some(x=>String(x.id)===id)))window.pdoAbrir(id);else openOrder(id)}catch(_){openOrder(id)}};
        return true};
      if(pintarT()){c.addEventListener('click',()=>{Snd.ready();const x=c.querySelector('.pdASound');if(x)x.hidden=true});
        box.prepend(c);while(box.children.length>4)dismiss(box.lastElementChild);
        let k=0;const tt=setInterval(()=>{if(!document.body.contains(c)||++k>30){clearInterval(tt);return}pintarT()},2000);
        const ok=await Snd.play(kind);if(!ok&&Snd.on){const x=c.querySelector('.pdASound');if(x)x.hidden=false}
        osNotify(title,text,{tag:key,pedidoId,sticky,vib:(Snd.PAT[kind]||Snd.PAT.info).vib});
        if(sticky){flash(true,title);let n=0;ringing.set(key,setInterval(()=>{if(!document.body.contains(c)||++n>15){stopRing(key);return}Snd.play(kind)},12000))}
        else setTimeout(()=>{if(document.body.contains(c))dismiss(c)},9000);
        return;
      }
      c.classList.remove('pdAC');
    }
    c.innerHTML=`<span class="pdAIcon">${ICON[kind]||'🔔'}</span><span class="pdATitle">${E(title)}</span><button type="button" class="pdAClose" aria-label="Cerrar">×</button><span class="pdAText">${E(text||'')}</span>${acts.length?`<div class="pdAActs">${acts.map((a,i)=>`<button type="button" data-i="${i}" class="${a.main?'main':''}">${E(a.label)}</button>`).join('')}</div>`:''}<span class="pdASound" hidden>Toca aquí para activar el sonido de los avisos.</span>`;
    c.querySelector('.pdAClose').onclick=e=>{e.stopPropagation();dismiss(c)};
    c.querySelectorAll('.pdAActs button').forEach(b=>b.onclick=async e=>{e.stopPropagation();const a=acts[+b.dataset.i];dismiss(c);try{await a.run()}catch(err){}});
    c.addEventListener('click',()=>{Snd.ready();c.querySelector('.pdASound').hidden=true});
    box.prepend(c);while(box.children.length>4)dismiss(box.lastElementChild);
    const ok=await Snd.play(kind);if(!ok&&Snd.on)c.querySelector('.pdASound').hidden=false;
    osNotify(title,text,{tag:key,pedidoId,sticky,vib:(Snd.PAT[kind]||Snd.PAT.info).vib});
    if(sticky){flash(true,title);let n=0;ringing.set(key,setInterval(()=>{if(!document.body.contains(c)||++n>15){stopRing(key);return}Snd.play(kind)},12000))}
    else setTimeout(()=>{if(document.body.contains(c))dismiss(c)},9000);
  }
  window.pdAlert=alertUser;
  function ack(id){document.querySelectorAll('#pdxAlerts .pdA').forEach(c=>{if(c.dataset.key==='nuevo:'+id)dismiss(c)});stopRing('nuevo:'+id)}

  /* ============ Cabecera ============ */
  function buildHead(){
    const card=document.querySelector('#appView>.card');if(!card||$('pdxHead'))return;
    const msg=$('appMsg');
    card.innerHTML='';card.classList.add('pdxHeadCard');
    const h=document.createElement('div');h.id='pdxHead';
    h.innerHTML=`<div class="x-h"><span><span class="x-kick" id="pdxDate"></span><span class="x-title" id="pdxWelcome">${E(R()?'Hola, '+(R().nombre||'Negocio'):'Mi negocio')}</span></span><span class="x-pill" id="pdxOpen">—</span></div><div class="x-muted" id="pdxOpenTxt"></div><div id="pdxBanner" class="x-card dark" hidden style="margin:10px 0 0;padding:12px 14px;flex-direction:row;align-items:center"><span style="flex:1;font-size:13px;font-weight:600"></span><button type="button" class="x-btn light sm" style="width:auto!important"></button></div>`;
    card.appendChild(h);if(msg)card.appendChild(msg);const w0=document.createElement('h1');w0.id='welcome';keep(w0);
    $('pdxBanner').querySelector('button').addEventListener('pointerdown',setBannerOff);$('pdxBanner').querySelector('button').onclick=async()=>{setBannerOff();await Snd.ready();if('Notification' in window&&Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}Snd.play('info');paintBanner()};
  }
  function paintHead(){
    const d=$('pdxDate');if(d)d.textContent=lima().toLocaleDateString('es-PE',{weekday:'long',day:'2-digit',month:'short'});
    const s=status(),p=$('pdxOpen');if(p){p.textContent=s.open?'● Abierto':'Cerrado';p.className='x-pill'+(s.open?'':' off')}
    const t=$('pdxOpenTxt');if(t)t.textContent=s.text+(R()&&R().activo===false?' · Tu negocio está oculto en la tienda':'');
    paintBanner();
  }
  function paintBanner(){
    const b=$('pdxBanner');if(!b)return;
    b.style.display='';
    if(bannerOff){b.hidden=true;return}
    const perm='Notification' in window&&Notification.permission==='default';
    const locked=Snd.on&&(!Snd.ctx||Snd.ctx.state!=='running');
    if(perm){b.hidden=false;b.querySelector('span').textContent='Activa los avisos para enterarte de cada pedido nuevo al instante.';b.querySelector('button').textContent='Activar avisos'}
    else if(locked){b.hidden=false;b.querySelector('span').textContent='Toca para activar el sonido de los pedidos nuevos.';b.querySelector('button').textContent='Activar sonido'}
    else b.hidden=true;
    if(b.hidden)b.style.setProperty('display','none','important');
  }

  /* ============ Pedidos ============ */
  const STEPS=['Recibido','Confirmado','Preparando','Listo','Entregado'];
  function stage(o){
    const s=String(o.estado||'pendiente').toLowerCase();
    if(s==='cancelado')return {k:'cancel',i:-1,txt:'Cancelado'};
    if(s==='entregado')return {k:'done',i:4,txt:'Entregado al cliente'};
    const confirmed=s==='confirmado'||['asignado','aceptado','en_camino','en_entrega','pedido_aceptado','camino_recojo','camino_entrega'].includes(s);
    const paid=o.pago_negocio_confirmado===true,ready=o.listo_para_recojo===true;
    if(!confirmed)return {k:'nuevo',i:0,txt:'Nuevo · coordina el pago y confirma'};
    if(!paid)return {k:'cobrar',i:1,txt:'Coordina el pago con el cliente'};
    if(!ready){const t=o.negocio_aceptado_en&&Number(o.tiempo_preparacion_min)>0?Math.round((new Date(o.negocio_aceptado_en).getTime()+Number(o.tiempo_preparacion_min)*60000-Date.now())/60000):null;return {k:'preparar',i:2,txt:t===null?'Prepara el pedido':t>0?'Prepara el pedido · listo en '+t+' min':'Prepara el pedido · ya pasó el tiempo que indicaste'}}
    if(['en_camino','en_entrega','camino_entrega'].includes(s))return {k:'camino',i:3,txt:'El motorizado lo lleva al cliente'};
    if(['asignado','aceptado','pedido_aceptado','camino_recojo'].includes(s))return {k:'listo',i:3,txt:'Motorizado en camino a recoger'};
    return {k:'listo',i:3,txt:'Listo · esperando motorizado'};
  }
  const ago=d=>{const t=new Date(d).getTime();if(!t)return '';const m=Math.round((Date.now()-t)/60000);if(m<1)return 'ahora';if(m<60)return 'hace '+m+' min';const h=Math.floor(m/60);if(h<24)return 'hace '+h+' h';return new Date(t).toLocaleDateString('es-PE',{day:'2-digit',month:'short'})};
  function orderCard(o){
    const st=stage(o),id=String(o.id),A=`data-business-order="${E(id)}"`;
    const items=Array.isArray(o.detalle_pedidos)?o.detalle_pedidos:[];
    const lines=items.map(x=>{const q=Math.max(1,Number(x.cantidad)||1),sub=Number(x.subtotal??x.total_linea),u=Number(x.precio_unitario??x.precio);const v=Number.isFinite(sub)?sub:Number.isFinite(u)?u*q:null;return `<div><span><b>${q}×</b> ${E(x.nombre_producto||x.nombre||'Producto')}</span><span>${v!==null?money(v):''}</span></div>`}).join('')||'<div><span class="x-muted">Detalle no disponible</span></div>';
    const total=Number(o.total),del=Number(o.costo_delivery),sub=Number.isFinite(Number(o.subtotal))?Number(o.subtotal):(Number.isFinite(total)&&Number.isFinite(del)?total-del:NaN);
    const bars=STEPS.map((_,i)=>`<span class="${st.i>=i?'on':''}"></span>`).join('');
    const wa=`<button type="button" class="x-btn light sm" ${A} onclick="businessWhatsApp('${E(id)}')">WhatsApp</button>`;
    const trk=`<button type="button" class="x-btn light sm x-trkBtn" onclick="pdxTrack('${E(id)}')">${ICO.trk}Seguimiento</button>`;
    const pair=`<div class="x-grid2">${wa}${trk}</div>`;
    const mi=motoInfo(o),mn=mi.nombre;
    const motoTxt=st.k==='camino'?(mn||'El motorizado')+' lleva el pedido al cliente':o.motorizado_id&&o.en_local_en?(mn||'El motorizado')+' está en tu local':o.motorizado_id?(mn||'El motorizado')+' va a recoger el pedido':'Listo · esperando que Pidemás asigne motorizado';
    let acts='';
    if(st.k==='nuevo'){const sel=(window.__pdxT||{})[id]||15;const ob=String(o.observaciones||'');if(!(window.__pdxP||{})[id]&&/pagará al motorizado con QR/i.test(ob)){window.__pdxP=window.__pdxP||{};window.__pdxP[id]='yape'}const pg=(window.__pdxP||{})[id]||'';const pref=/prefiere coordinar con el negocio/i.test(ob)?'El cliente quiere yapearte a ti: escríbele por WhatsApp.':/pagará al motorizado con QR/i.test(ob)?'El cliente prefiere pagar con Yape al motorizado (QR).':'';acts=(window.pdxNuevoActs?window.pdxNuevoActs(o,{id,A,sel,pg,trk:ICO.trk}):'')}
    else if(st.k==='cobrar')acts=`<div class="x-note">Escribe al cliente por WhatsApp con el total y confirma cuando hayas recibido el pago.</div><button type="button" class="x-btn" ${A} onclick="businessConfirmPayment('${E(id)}')">Pago recibido</button>${pair}`;
    else if(st.k==='preparar')acts=`<button type="button" class="x-btn" ${A} onclick="businessMarkReady('${E(id)}')">Pedido listo para recojo</button>${pair}`;
    else if(st.k==='listo'||st.k==='camino')acts=pair;
    else acts=trk;
    return `<article class="x-order ${st.k==='nuevo'?'new':''}" data-order="${E(id)}">
      <div class="x-oTop"><div class="x-oRow"><span class="x-kick">${E(ago(o.creado_en))}${o.metodo_pago?' · '+E(o.metodo_pago):''}</span><span class="x-pill ${st.k==='nuevo'?'red':st.k==='cancel'?'off':st.k==='done'?'soft':''}">${E(STEPS[Math.max(0,st.i)]&&st.k!=='cancel'?(st.k==='nuevo'?'Nuevo':STEPS[st.i]):'Cancelado')}</span></div>
      <div class="x-oRow"><span class="x-code">${E(code(id))}</span><b style="font-size:17px">${Number.isFinite(total)?money(total):''}</b></div>
      <div class="x-client">${E(o.nombre_cliente||'Cliente')}${o.telefono_cliente?' · '+E(o.telefono_cliente):''}</div>${/__PIDEMAS_DESCARTABLES__/.test(String(o.observaciones||''))?'<div class="x-descTag">Con descartables'+(/"cubiertos":true/.test(String(o.observaciones||''))?' · con cubiertos':'')+'</div>':''}${o.motorizado_id&&st.k!=='cancel'?`<div class="x-motoTag">${ICO.moto}<span>Motorizado: <b>${E(mn||'asignado')}</b></span></div>`:''}
      ${o.en_local_en&&['asignado','aceptado','pedido_aceptado','camino_recojo'].includes(String(o.estado||'').toLowerCase())?`<div class="x-arrive"><span><b>${E(mn||'El motorizado')} llegó a tu local</b><small>Pídele el código y compáralo</small></span><span class="x-arriveCode">${E(o.codigo_recojo||'—')}</span></div>`:''}
      ${st.k!=='cancel'?`<div class="x-bars">${bars}</div>`:''}<div class="x-stepTxt">${E(st.k==='cancel'?'Pedido cancelado':(st.k==='listo'||st.k==='camino')?motoTxt:st.txt)}</div></div>
      <div class="x-items">${lines}</div>
      <div class="x-pay"><div><span>Productos</span><span>${Number.isFinite(sub)?money(sub):'—'}</span></div><div><span>Delivery</span><span>${Number.isFinite(del)?money(del):'Por confirmar'}</span></div><div class="t"><span>Total</span><strong>${Number.isFinite(total)?money(total):'—'}</strong></div></div>
      ${acts?`<div class="x-acts">${acts}</div>`:''}
    </article>`;
  }
  window.pdxToggleItems=id=>{const el=document.querySelector(`[data-order="${CSS.escape(id)}"] .x-items`);if(el)el.scrollIntoView({behavior:'smooth',block:'center'})};
  function renderOrders(){
    const box=$('businessOrdersList');if(!box)return;
    const list=(typeof businessOrders!=='undefined'&&Array.isArray(businessOrders))?businessOrders:[];
    const todayKey=lima().toLocaleDateString('en-CA');
    const isToday=d=>d&&new Date(d).toLocaleDateString('en-CA',{timeZone:'America/Lima'})===todayKey;
    const g={nuevo:[],cobrar:[],preparar:[],listo:[],done:[],old:[],cancel:[]};
    list.forEach(o=>{const s=stage(o);if(s.k==='camino')g.listo.push(o);else if(s.k==='done'){(isToday(o.entregado_en||o.creado_en)?g.done:g.old).push(o)}else g[s.k].push(o)});
    const today=list.filter(o=>isToday(o.creado_en)&&String(o.estado).toLowerCase()!=='cancelado');
    const sold=list.filter(o=>String(o.estado).toLowerCase()==='entregado'&&isToday(o.entregado_en||o.creado_en)).reduce((s,o)=>{const t=Number(o.total),d=Number(o.costo_delivery);return s+(Number.isFinite(Number(o.subtotal))?Number(o.subtotal):(Number.isFinite(t)?t-(Number.isFinite(d)?d:0):0))},0);
    const st=$('pdxStats');if(st)st.innerHTML=`<div><span>Pedidos hoy</span><strong>${today.length}</strong></div><div><span>Vendido hoy</span><strong>${money(sold)}</strong></div><div><span>Por atender</span><strong>${g.nuevo.length+g.cobrar.length+g.preparar.length}</strong></div>`;
    const sec=(t,arr,red)=>arr.length?`<div class="x-group ${red?'red':''}">${E(t)} <b>${arr.length}</b></div><div class="x-ordersGrid">${arr.map(orderCard).join('')}</div>`:'';
    const fold=(t,arr)=>arr.length?`<details class="x-fold" data-k="${E(t)}" ${openFolds.has(t)?'open':''}><summary>${E(t)} (${arr.length})</summary><div class="x-ordersGrid" style="padding-bottom:10px">${arr.map(orderCard).join('')}</div></details>`:'';
    let html=sec('Nuevos por confirmar',g.nuevo,true)+sec('Por cobrar',g.cobrar)+sec('En preparación',g.preparar)+sec('Listos y en camino',g.listo);
    if(!html)html=`<div class="x-empty"><b>Sin pedidos por ahora</b>Cuando un cliente te pida, sonará y aparecerá aquí.</div>`;
    html+=fold('Entregados hoy',g.done)+fold('Anteriores',g.old)+fold('Cancelados',g.cancel);
    box.innerHTML=html;
    try{paintBadge();paintTrk(false);needMotoNames(list)}catch(e){}
  }
  const openFolds=new Set();
  document.addEventListener('toggle',e=>{const d=e.target;if(d.classList&&d.classList.contains('x-fold')){d.open?openFolds.add(d.dataset.k):openFolds.delete(d.dataset.k)}},true);
  async function openOrder(id){try{if(!document.body.classList.contains('pdpm-open')&&document.querySelector('[data-pd-pedidos]'))document.querySelector('[data-pd-pedidos]').click();else switchPanelTab('pedidos')}catch(e){}ack(id);let n=0;const q=CSS.escape(String(id));const t=setInterval(()=>{n++;const el=document.querySelector(`#businessOrdersList article.x-order[data-order="${q}"]`)||document.querySelector(`[data-order="${q}"]`);if(el){clearInterval(t);const f=el.closest('details');if(f)f.open=true;if(!el.classList.contains('pd-abierto')){const h=el.querySelector(':scope > .x-oTop')||el;h.click()}if(!el.classList.contains('pd-abierto')){el.scrollIntoView({behavior:'smooth',block:'start'})}}else if(n>40)clearInterval(t)},150)}
  // Avisos precisos de pedidos.
  let prev=null;
  function diff(list){
    const cur=new Map((list||[]).map(o=>[String(o.id),o]));
    const sn=o=>({estado:String(o.estado||'').toLowerCase(),total:String(o.total),paid:!!o.pago_negocio_confirmado,ready:!!o.listo_para_recojo,local:!!o.en_local_en});
    if(prev===null){prev=new Map([...cur].map(([k,o])=>[k,sn(o)]));const n=(list||[]).filter(o=>stage(o).k==='nuevo');if(n.length)alertUser({kind:'nuevo',sticky:true,key:'nuevo:'+n[0].id,pedidoId:n[0].id,title:n.length>1?`Tienes ${n.length} pedidos nuevos por confirmar`:'Tienes un pedido nuevo por confirmar',text:describe(n[0]),actions:acts(n[0]),orden:n[0]});return}
    for(const [id,o] of cur){
      const now=sn(o),b=prev.get(id);
      if(!b){if(now.estado!=='cancelado')alertUser({kind:'nuevo',sticky:stage(o).k==='nuevo',key:'nuevo:'+id,pedidoId:id,title:'Nuevo pedido '+code(id),text:describe(o),actions:acts(o),orden:o});continue}
      if(now.estado!==b.estado){
        if(now.estado==='cancelado'){ack(id);alertUser({kind:'cancel',pedidoId:id,title:'Pedido '+code(id)+' cancelado',text:String(o.cancelado_por||'')==='negocio'?'Anulaste este pedido. Pidemás ya fue avisado.':'Pidemás canceló este pedido. No lo prepares.'})}
        else if(stage(o).k!=='nuevo')ack(id);
        if(['asignado'].includes(now.estado)&&b.estado!=='asignado')alertUser({kind:'info',pedidoId:id,title:'Motorizado asignado a '+code(id),text:'Ten el pedido listo para cuando llegue.'});
        if(['en_camino','en_entrega','camino_entrega'].includes(now.estado)&&!['en_camino','en_entrega','camino_entrega'].includes(b.estado))alertUser({kind:'ok',pedidoId:id,title:'El motorizado recogió '+code(id),text:'Va camino al cliente.'});
        if(now.estado==='entregado')alertUser({kind:'ok',pedidoId:id,title:'Pedido '+code(id)+' entregado',text:'El cliente ya recibió su pedido.'});
      }
      if(now.local&&!b.local&&now.estado!=='cancelado')alertUser({kind:'nuevo',pedidoId:id,title:'El motorizado llegó por '+code(id),text:'Código de recojo: '+(o.codigo_recojo||'—')+'. Compáralo antes de entregar.'});
      if(now.total!==b.total&&b.total!=='undefined'&&now.estado!=='cancelado')alertUser({kind:'cambio',pedidoId:id,title:'Pedido '+code(id)+' modificado',text:'Total: '+money(b.total)+' → '+money(now.total)});
    }
    for(const [id,b] of prev){if(!cur.has(id)&&!['entregado','cancelado'].includes(b.estado)){ack(id);alertUser({kind:'cancel',title:'Pedido '+code(id)+' retirado',text:'Pidemás eliminó este pedido.'})}}
    prev=new Map([...cur].map(([k,o])=>[k,sn(o)]));
  }
  function describe(o){const items=(o.detalle_pedidos||[]).map(x=>(x.cantidad||1)+'× '+(x.nombre_producto||x.nombre||'Producto')).slice(0,3).join(', ');return [o.nombre_cliente,items,Number.isFinite(Number(o.total))?money(o.total):''].filter(Boolean).join(' · ')}
  function acts(o){return [{label:'Ver pedido',main:true,run:()=>openOrder(o.id)}]}
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[onclick*="businessConfirmOrder"]');if(b){const m=String(b.getAttribute('onclick')).match(/'([^']+)'/);if(m)ack(m[1])}},true);
  function buildPedidos(){
    const tab=$('pedidosTab');if(!tab||$('pdxPed'))return;
    const msg=$('businessOrdersMsg'),list=$('businessOrdersList');
    [...tab.children].forEach(keep);
    const root=document.createElement('div');root.id='pdxPed';
    root.innerHTML=`<div class="x-h" style="margin:0 0 12px"><span><span class="x-kick">Pedidos</span><span class="x-title">Pedidos recibidos</span></span><button type="button" class="x-icon" id="refreshBusinessOrders" aria-label="Actualizar">${SVG.ref}</button></div><div class="x-net" id="pdxNet" hidden><i></i>Sin conexión. Reintentando… tus pedidos siguen aquí.</div><div class="x-stats" id="pdxStats" style="margin:0 0 4px"></div>`;
    tab.appendChild(root);if(msg)root.appendChild(msg);if(list){list.className='';root.appendChild(list)}root.insertAdjacentHTML('beforeend','<div class="pdxSpacer"></div>');
    $('refreshBusinessOrders').onclick=async()=>{const b=$('refreshBusinessOrders');b.classList.add('spin');try{await loadBusinessOrders()}finally{b.classList.remove('spin')}};
  }
  // Pedidos con reintento: un corte de internet ya no borra la lista.
  let netFails=0,netRetry=null,loading=null;
  function netNote(on){const n=$('pdxNet');if(n)n.hidden=!on}
  if(typeof window.loadBusinessOrders==='function'){
    const _l=window.loadBusinessOrders;
    window.loadBusinessOrders=function(){
      if(loading)return loading;
      loading=(async()=>{
        const before=businessOrders;let failed=false;
        try{await _l.apply(this,arguments)}catch(e){failed=true}
        const m=$('businessOrdersMsg');
        if(m&&!m.classList.contains('hidden')&&/no se pudieron cargar/i.test(m.textContent)){failed=true;m.classList.add('hidden');m.textContent=''}
        if(failed){businessOrders=before;netFails++;netNote(netFails>=2||!navigator.onLine);clearTimeout(netRetry);netRetry=setTimeout(()=>window.loadBusinessOrders(),Math.min(30000,3000*netFails));try{renderOrders()}catch(e){}return}
        netFails=0;netNote(false);
        try{renderOrders();diff(businessOrders)}catch(e){console.warn('Pedidos',e)}
      })().finally(()=>{loading=null});
      return loading;
    };
  }
  window.addEventListener('online',()=>{netNote(false);window.loadBusinessOrders&&window.loadBusinessOrders()});
  window.addEventListener('offline',()=>netNote(true));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&R())window.loadBusinessOrders&&window.loadBusinessOrders()});
  // Enlace de la tienda: abre solo la carta de este negocio.
  const TIENDA_URL='https://pidemas.pe/';
  window.getEnlaceIndividualCarta=function(){const r=R();if(!r||!r.id)return '';return TIENDA_URL+'?negocio='+encodeURIComponent(String(r.id))};
  setInterval(()=>{try{const i=$('miEnlaceCartaUrl'),u=window.getEnlaceIndividualCarta();if(i&&u&&i.value!==u)i.value=u}catch(e){}},1500);

  /* ============ Seguimiento de cada pedido ============ */
  const TRK=[
    ['Pedido recibido','El cliente hizo el pedido',['creado_en']],
    ['Confirmado','Confirmaste el pedido',['confirmado_en','negocio_confirmado_en']],
    ['Pago recibido','Confirmaste el pago del cliente',['pago_negocio_confirmado_en','pago_confirmado_en']],
    ['Listo para recojo','Pedido preparado y empacado',['listo_en','listo_para_recojo_en']],
    ['Motorizado asignado','Pidemás asignó un motorizado',['asignado_en','aceptado_en']],
    ['Recogido · en camino','El motorizado lo lleva al cliente',['en_camino_en','recogido_en','en_entrega_en']],
    ['Entregado','El cliente recibió su pedido',['entregado_en']]];
  function trkDone(o){
    const s=String(o.estado||'pendiente').toLowerCase(),st=stage(o);
    const moto=['asignado','aceptado','pedido_aceptado','camino_recojo','en_camino','en_entrega','camino_entrega','entregado'].includes(s)||!!o.motorizado_id;
    const road=['en_camino','en_entrega','camino_entrega','entregado'].includes(s);
    return [true,st.k!=='nuevo',o.pago_negocio_confirmado===true||s==='entregado',o.listo_para_recojo===true||road,moto,road,s==='entregado'];
  }
  const tfmt=v=>{if(!v)return '';const d=new Date(v);return isNaN(d)?'':d.toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'numeric',minute:'2-digit'})};
  const motoCache=new Map(),gpsCache=new Map();let trkOpen=null,trkTimer=null;
  function motoInfo(o){const c=motoCache.get(String(o.motorizado_id||''))||{};return {nombre:o.motorizado_nombre||o.nombre_motorizado||c.nombre||''}}
  async function loadMoto(mid){
    mid=String(mid||'');if(!mid)return null;if(motoCache.has(mid))return motoCache.get(mid);motoCache.set(mid,{});
    try{let {data}=await db.from('motorizados').select('id,nombre_completo,usuario_id').eq('id',mid).maybeSingle();if(!data){const r2=await db.from('motorizados').select('id,nombre_completo,usuario_id').eq('usuario_id',mid).maybeSingle();data=r2.data}if(data)motoCache.set(mid,{nombre:data.nombre_completo||'',ids:[data.id,data.usuario_id].filter(Boolean)})}catch(e){}
    return motoCache.get(mid);
  }
  function needMotoNames(list){
    const miss=[...new Set((list||[]).filter(o=>o.motorizado_id&&!o.motorizado_nombre&&!motoCache.has(String(o.motorizado_id))).map(o=>String(o.motorizado_id)))];
    if(miss.length)Promise.all(miss.map(loadMoto)).then(()=>{if(miss.some(m=>(motoCache.get(m)||{}).nombre))renderOrders()});
  }
  async function loadGps(mid){
    try{const m=motoCache.get(String(mid))||{};const ids=[...new Set([mid,...(m.ids||[])].map(String))];const {data,error}=await db.from('ubicaciones_motorizados').select('*').in('motorizado_id',ids);if(error||!data)return null;
      let best=null;data.forEach(r=>{const lat=Number(r.latitud??r.lat??r.latitude??r.latitud_actual),lng=Number(r.longitud??r.lng??r.longitude??r.longitud_actual);const t=new Date(r.actualizado_en||r.updated_at||r.creado_en||r.created_at||r.fecha||r.timestamp||0).getTime()||0;if(Number.isFinite(lat)&&Number.isFinite(lng)&&lat&&lng&&(!best||t>best.t))best={lat,lng,t}});
      if(best)gpsCache.set(String(mid),best);return best}catch(e){return null}
  }
  const ICO={phone:'<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',wa:'<svg viewBox="0 0 24 24"><path d="M3.5 20.5l1.3-4.6A8.5 8.5 0 1 1 8.2 19.3z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a5 5 0 0 1-2.8-2.8l.8-1-1-2z"/></svg>',moto:'<svg viewBox="0 0 24 24"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17h6l3-6h3M9 11h4M15 7h2l1 4"/></svg>',pin:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',trk:'<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/></svg>'};
  function trkHtml(o){
    const st=stage(o),done=trkDone(o),cur=done.lastIndexOf(true),cancel=st.k==='cancel',fin=cur===6;
    const mi=motoInfo(o),mname=mi.nombre;
    const desc=i=>i===4&&mname?'Pidemás asignó a '+mname:i===5&&mname?mname+' lleva el pedido al cliente':TRK[i][1];
    const headLabel=cancel?'Pedido cancelado':fin?'Pedido entregado':TRK[cur][0];
    const headDesc=cancel?'Pidemás canceló este pedido. No lo prepares.':fin?'El cliente ya recibió su pedido.':(cur===3&&!o.motorizado_id?'Esperando que Pidemás asigne un motorizado.':desc(cur));
    let h=`<div class="x-trkHero ${cancel?'cancel':fin?'fin':''}">
      <div class="x-oRow"><span class="x-kick">${E(code(o.id))} · ${E(o.nombre_cliente||'Cliente')}</span>${cancel||fin?'':'<span class="x-live"><i></i>En vivo</span>'}</div>
      <span class="x-trkState">${E(headLabel)}</span><span class="x-trkDesc">${E(headDesc)}</span>
      ${cancel?'':`<div class="x-trkBar"><span style="width:${Math.round((cur+1)/7*100)}%"></span></div><span class="x-trkStep">Paso ${cur+1} de 7</span>`}</div>`;
    if(!cancel&&o.motorizado_id){
      const g=gpsCache.get(String(o.motorizado_id));
      h+=`<section class="x-trkSec"><div class="x-motoRow"><span class="x-motoAv">${mname?E(mname.trim().charAt(0).toUpperCase()):ICO.moto}</span><span class="x-motoTxt"><span class="x-kick">Motorizado asignado</span><strong>${E(mname||'Motorizado de Pidemás')}</strong><small>Asignado por Pidemás</small></span></div>
      ${!fin?(g?`<div class="x-map"><iframe title="Ubicación del motorizado" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${g.lng-0.006},${g.lat-0.004},${g.lng+0.006},${g.lat+0.004}&layer=mapnik&marker=${g.lat},${g.lng}"></iframe></div><div class="x-oRow"><small class="x-muted">${ICO.pin} Ubicación ${g.t?E(ago(g.t)):'reciente'}</small><a class="x-link" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${g.lat},${g.lng}">Abrir en Google Maps</a></div>`:''):''}</section>`;
    }
    if(!cancel)h+=`<section class="x-trkSec"><span class="x-kick">Línea de tiempo</span><div class="x-tl">${TRK.map((t,i)=>{const tm=tfmt(t[2].map(k=>o[k]).find(Boolean));const c=i===cur;return `<div class="x-tlStep ${done[i]&&!c?'done':''} ${c?'cur':''} ${c&&fin?'fin':''}"><span class="x-tlDot"></span><div><div class="x-tlName"><span>${E(t[0])}</span>${c&&!fin?'<b class="x-now">Ahora</b>':(done[i]&&tm?`<small>${E(tm)}</small>`:'')}</div>${c||(done[i]&&i>=4)?`<small>${E(desc(i))}${c&&tm?' · '+E(tm):''}</small>`:''}</div></div>`}).join('')}</div></section>`;
    const items=(o.detalle_pedidos||[]).map(x=>{const q=Math.max(1,Number(x.cantidad)||1),sub=Number(x.subtotal??x.total_linea),u=Number(x.precio_unitario??x.precio);const v=Number.isFinite(sub)?sub:Number.isFinite(u)?u*q:null;return `<div><span><b>${q}×</b> ${E(x.nombre_producto||x.nombre||'Producto')}</span><span>${v!==null?money(v):''}</span></div>`}).join('');
    h+=`<section class="x-trkSec"><span class="x-kick">Detalle del pedido</span><div class="x-items" style="padding:0;border:0">${items||'<div><span class="x-muted">Detalle no disponible</span></div>'}</div><div class="x-oRow x-trkTot"><span>Total${o.metodo_pago?' · '+E(o.metodo_pago):''}</span><strong>${Number.isFinite(Number(o.total))?money(o.total):'—'}</strong></div></section>`;
    return h;
  }
  async function paintTrk(fetchGps){
    if(!trkOpen)return;const o=(businessOrders||[]).find(x=>String(x.id)===trkOpen);const body=$('pdxTrkBody');if(!body)return;
    if(!o){body.innerHTML='<div class="x-empty"><b>Pedido no disponible</b>Es posible que Pidemás lo haya eliminado.</div>';return}
    const sc=body.parentElement.scrollTop;body.innerHTML=trkHtml(o);body.parentElement.scrollTop=sc;
    const mid=String(o.motorizado_id||'');
    if(mid&&(fetchGps||!motoCache.has(mid))){const had=JSON.stringify([motoCache.get(mid),gpsCache.get(mid)]);await loadMoto(mid);if(!trkDone(o)[6])await loadGps(mid);if(trkOpen===String(o.id)&&JSON.stringify([motoCache.get(mid),gpsCache.get(mid)])!==had){const s2=body.parentElement.scrollTop;body.innerHTML=trkHtml(o);body.parentElement.scrollTop=s2}}
  }
  function openSheet(title){
    let sh=$('pdxSheet');
    if(!sh){sh=document.createElement('div');sh.id='pdxSheet';sh.innerHTML=`<div class="pdxSheetBg" data-close="1"></div><div class="pdxSheetCard" role="dialog" aria-modal="true"><div class="pdxSheetTop"><span class="pdxGrab"></span><div class="x-oRow"><strong id="pdxSheetTitle"></strong><button type="button" class="x-icon sm" data-close="1" aria-label="Cerrar">×</button></div></div><div id="pdxTrkBody"></div></div>`;document.body.appendChild(sh);sh.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeSheet()})}
    trkOpen=null;editId=null;clearInterval(trkTimer);
    $('pdxSheetTitle').textContent=title;sh.classList.toggle('pdxEdit',title==='Editar producto');sh.querySelector('.pdxSheetCard').setAttribute('aria-label',title);
    sh.classList.add('open');document.documentElement.style.overflow='hidden';document.documentElement.classList.add('pdxSheetOpen');sh.querySelector('.pdxSheetCard').scrollTop=0;
    return $('pdxTrkBody');
  }
  window.pdxTrack=function(id){
    openSheet('Seguimiento del pedido');trkOpen=String(id);paintTrk(true);
    trkTimer=setInterval(()=>paintTrk(true),15000);
  };
  function closeSheet(){trkOpen=null;editId=null;clearInterval(trkTimer);$('pdxSheet')?.classList.remove('open');document.documentElement.style.overflow='';document.documentElement.classList.remove('pdxSheetOpen')}
  window.pdxOpenSheet=openSheet;window.pdxCloseSheet=closeSheet;
  const closeTrk=closeSheet;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&trkOpen)closeTrk()});

  /* ============ Productos (carta + categorías) ============ */
  const byOrd=(a,b)=>((Number(a.orden)>0?+a.orden:9999)-(Number(b.orden)>0?+b.orden:9999))||String(a.nombre||'').localeCompare(String(b.nombre||''),'es');
  const stockOf=p=>{const k=typeof stockCol==='function'?stockCol(p):null;return k?Number(p[k]??0):null};
  let cartaQ='';const catMore=new Set();
  function buildCarta(){
    const tab=$('cartaTab');if(!tab||$('pdxCarta'))return;
    const list=$('productList');
    const root=document.createElement('div');root.id='pdxCarta';
    root.innerHTML=`<div class="x-h" style="margin:0 0 12px"><span><span class="x-kick">Mi negocio</span><span class="x-title">Productos</span></span></div>
      <div class="x-stats" id="pdxCartaStats" style="margin:0 0 12px"></div>
      <input type="search" id="pdxCartaQ" class="x-in" placeholder="Buscar producto" autocomplete="off" style="margin:0 0 8px">
      <div class="x-grid2" style="margin:0 0 12px"><button type="button" class="x-btn" id="pdxAddProd">+ Producto</button><button type="button" class="x-btn light" id="pdxAddCat">+ Categoría</button></div>
      <div class="x-panel" id="pdxCatPanel" hidden><div class="x-panelHead"><strong>Nueva categoría</strong><button type="button" class="x-icon sm" id="pdxCatClose" aria-label="Cerrar">×</button></div><div id="pdxCatSlot" style="display:flex;flex-direction:column;gap:8px"></div></div>
      <div class="x-panel" id="pdxProdPanel" hidden><div class="x-panelHead"><strong>Nuevo producto</strong><button type="button" class="x-icon sm" id="pdxProdClose" aria-label="Cerrar">×</button></div><div id="pdxProdSlot"></div></div>
      <div id="pdxCartaList"></div><div class="pdxSpacer"></div>`;
    const form=[...tab.children];tab.appendChild(root);
    const slot=$('pdxProdSlot');
    form.forEach(k=>{if(k.tagName==='H2'||k.matches('p.muted'))keep(k);else slot.appendChild(k)});
    slot.querySelectorAll('hr,.catalogoSectionHead').forEach(keep);
    if(list){list.style.display='none';keep(list)}
    // Formulario de categoría dentro de Productos.
    const cn=$('cNombre'),cd=$('cDescripcion'),cs=$('saveCategory'),cl=$('categoryList'),cslot=$('pdxCatSlot');
    [cn,cd].forEach(x=>{if(x){x.classList.add('x-in');cslot.appendChild(x)}});if(cn)cn.placeholder='Nombre (ej. Ceviches, Bebidas)';if(cd)cd.placeholder='Descripción (opcional)';
    if(cs){cs.className='x-btn';cs.removeAttribute('style');cs.textContent='Guardar categoría';cslot.appendChild(cs)}
    if(cl){cl.style.display='none';keep(cl)}
    const ct=$('categoriasTab');if(ct)[...ct.children].forEach(keep);
    cn?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();cs?.click()}});
    cs?.addEventListener('click',()=>{const t0=Date.now();const t=setInterval(()=>{if(Date.now()-t0>8000){clearInterval(t);return}if(cn&&!cn.value){clearInterval(t);$('pdxCatPanel').hidden=true}},300)},true);
    $('pdxAddProd').onclick=()=>openProd('');
    $('pdxAddCat').onclick=()=>{$('pdxProdPanel').hidden=true;$('pdxCatPanel').hidden=false;setTimeout(()=>{$('pdxCatPanel').scrollIntoView({behavior:'smooth',block:'center'});cn?.focus({preventScroll:true})},30)};
    $('pdxProdClose').onclick=()=>{$('pdxProdPanel').hidden=true;try{clearForm()}catch(e){}};
    $('pdxCatClose').onclick=()=>{$('pdxCatPanel').hidden=true};
    $('pdxCartaQ').addEventListener('input',e=>{cartaQ=e.target.value.trim().toLowerCase();paintCarta()});
    $('pdxCartaList').addEventListener('click',onCartaClick);
  }
  function openProd(cid){try{clearForm()}catch(e){}$('pdxCatPanel').hidden=true;$('pdxProdPanel').hidden=false;if(cid&&$('pCategoria'))$('pCategoria').value=cid;setTimeout(()=>{$('pdxProdPanel').scrollIntoView({behavior:'smooth',block:'start'});$('pNombre')?.focus({preventScroll:true})},30)}
  const openCats=new Set((()=>{try{return JSON.parse(LS.get('pdx_open_cats','[]'))}catch(e){return []}})());
  const saveOpen=()=>LS.set('pdx_open_cats',JSON.stringify([...openCats]));
  const CHEV='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function prodRow(p,cid){
    const stk=stockOf(p),on=p.disponible!==false,img=p.imagen_url||'';
    return `<div class="x-pRow ${on?'':'off'}" data-pid="${E(p.id)}" data-cid="${E(cid)}"><button type="button" class="x-pMain" data-a="open" aria-label="Editar ${E(p.nombre||'producto')}">${img?`<img class="x-pImg" src="${E(img)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;x-pImg x-pIni&quot;>${E(String(p.nombre||'P').charAt(0).toUpperCase())}</span>'">`:`<span class="x-pImg x-pIni">${E(String(p.nombre||'P').charAt(0).toUpperCase())}</span>`}<span class="x-pTxt"><strong>${E(p.nombre||'Producto')}</strong><small><b>${money(p.precio)}</b>${stk===null?'':stk===0?' · <em>Sin stock</em>':' · Stock '+stk}</small></span></button><button type="button" class="x-switch ${on?'on':''}" data-a="vis" aria-label="${on?'Ocultar':'Mostrar'} en la tienda"><i></i></button></div>`;
  }
  function paintCarta(){
    const box=$('pdxCartaList');if(!box)return;
    const P=(typeof products!=='undefined'&&Array.isArray(products))?products:[],C=(typeof categories!=='undefined'&&Array.isArray(categories))?categories:[];
    const zero=P.filter(p=>stockOf(p)===0).length;
    const s=$('pdxCartaStats');if(s)s.innerHTML=`<div><span>Productos</span><strong>${P.length}</strong></div><div><span>Categorías</span><strong>${C.length}</strong></div><div><span>Sin stock</span><strong>${zero}</strong></div>`;
    const cats=[...C].sort(byOrd);const ids=new Set(cats.map(c=>String(c.id)));
    const groups=cats.map(c=>({c,list:P.filter(p=>String(p.categoria_id||'')===String(c.id)).sort(byOrd)}));
    const loose=P.filter(p=>!p.categoria_id||!ids.has(String(p.categoria_id))).sort(byOrd);if(loose.length)groups.push({c:null,list:loose});
    if(!P.length&&!C.length){box.innerHTML='<div class="x-empty"><b>Aún no tienes productos</b>Crea una categoría (por ejemplo «Platos») y luego agrega tus productos.</div>';return}
    const html=groups.map(g=>{
      const shown=cartaQ?g.list.filter(p=>String(p.nombre||'').toLowerCase().includes(cartaQ)):g.list;
      if(cartaQ&&!shown.length)return '';
      const c=g.c,on=!c||c.activo!==false,cid=c?String(c.id):'_none',ci=c?cats.indexOf(c):-1;
      const open=!!cartaQ||openCats.has(cid);
      const z=g.list.filter(p=>stockOf(p)===0).length,hid=g.list.filter(p=>p.disponible===false).length;
      const sub=[`${g.list.length} producto${g.list.length===1?'':'s'}`,z?`${z} sin stock`:'',hid?`${hid} oculto${hid===1?'':'s'}`:'',c&&!on?'Oculta en la tienda':''].filter(Boolean).join(' · ');
      const more=c&&catMore.has(cid)?`<div class="x-catMore" data-cat="${E(cid)}"><button type="button" data-a="cvis">${on?'Ocultar en la tienda':'Mostrar en la tienda'}</button><button type="button" data-a="cedit">Renombrar</button><button type="button" data-a="cup" ${ci===0?'disabled':''}>↑ Subir</button><button type="button" data-a="cdown" ${ci===cats.length-1?'disabled':''}>↓ Bajar</button><button type="button" data-a="cdel" class="red">Eliminar</button></div>`:'';
      return `<section class="x-cat ${open?'open':''} ${on?'':'off'}" data-cat="${E(cid)}"><button type="button" class="x-catBtn" data-a="ctoggle" aria-expanded="${open}"><span><strong>${c?E(c.nombre):'Sin categoría'}</strong><small>${E(sub)}</small></span>${CHEV}</button>${open?`<div class="x-catBody">${shown.map(p=>prodRow(p,c?cid:'')).join('')||'<p class="x-catEmpty">Sin productos todavía.</p>'}<div class="x-catFoot"><button type="button" class="x-addIn" data-a="cadd">+ Producto${c?' en '+E(c.nombre):''}</button>${c?`<button type="button" class="x-icon sm ${catMore.has(cid)?'act':''}" data-a="cmore" aria-label="Opciones de la categoría">⋯</button>`:''}</div>${more}</div>`:''}</section>`;
    }).join('');
    box.innerHTML=html||'<div class="x-empty">No hay productos con ese nombre.</div>';
  }
  async function saveOrder(table,list){
    const ups=list.map((x,i)=>({x,o:i+1})).filter(({x,o})=>Number(x.orden)!==o);
    for(const {x,o} of ups){const {error}=await db.from(table).update({orden:o}).eq('id',x.id).eq('negocio_id',R().id);if(error){pdAviso('No se pudo guardar el orden: '+error.message+(table==='categorias_negocio'?'\n\nEjecuta el SQL que agrega la columna «orden» a categorias_negocio.':''));return false}x.orden=o}
    return true;
  }
  async function moveProduct(p,dir){
    const cid=p.categoria_id&&(categories||[]).some(c=>String(c.id)===String(p.categoria_id))?String(p.categoria_id):'';const ids=new Set((categories||[]).map(c=>String(c.id)));
    const list=products.filter(x=>cid?String(x.categoria_id||'')===cid:(!x.categoria_id||!ids.has(String(x.categoria_id)))).sort(byOrd);
    const i=list.indexOf(p),j=i+dir;if(j<0||j>=list.length)return false;[list[i],list[j]]=[list[j],list[i]];
    const ok=await saveOrder('productos_negocio',list);if(ok)paintCarta();return ok;
  }
  async function onCartaClick(e){
    const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
    const sec=b.closest('.x-cat');const cid=(b.closest('[data-cat]')||sec)?.dataset.cat||'';
    if(a==='ctoggle'){if(cartaQ)return;openCats.has(cid)?openCats.delete(cid):openCats.add(cid);saveOpen();paintCarta();return}
    if(a==='cmore'){catMore.has(cid)?catMore.delete(cid):catMore.add(cid);paintCarta();return}
    if(a==='cadd')return openProd(cid==='_none'?'':cid);
    if(a==='cvis')return window.toggleCategory(cid);
    if(a==='cedit')return window.editCategory(cid);
    if(a==='cdel'){const n=(products||[]).filter(p=>String(p.categoria_id)===cid).length;if(n&&!(await pdConfirmar(`Esta categoría tiene ${n} producto${n===1?'':'s'}. Quedarán en «Sin categoría». ¿Continuar?`)))return;catMore.delete(cid);return window.deleteCategory(cid)}
    if(a==='cup'||a==='cdown'){const list=[...categories].sort(byOrd);const i=list.findIndex(c=>String(c.id)===cid),j=i+(a==='cup'?-1:1);if(i<0||j<0||j>=list.length)return;[list[i],list[j]]=[list[j],list[i]];if(await saveOrder('categorias_negocio',list)){categories=list;paintCarta()}return}
    const row=b.closest('.x-pRow');const id=row?.dataset.pid;
    const p=(products||[]).find(x=>String(x.id)===String(id));if(!p)return;
    if(a==='open')return openEdit(p.id);
    if(a==='vis'){
      const next=p.disponible===false;const stk=stockOf(p);
      if(next&&stk===0){pdAviso('Este producto no tiene stock. Tócalo y súmale stock para mostrarlo en la tienda.');return}
      b.disabled=true;const {error}=await db.from('productos_negocio').update({disponible:next}).eq('id',id).eq('negocio_id',R().id);b.disabled=false;
      if(error){pdAviso('No se pudo cambiar la visibilidad: '+error.message);return}p.disponible=next;paintCarta();return;
    }
  }
  // Ventana rápida para editar un producto.
  let editId=null;
  function openEdit(id){
    const p=(products||[]).find(x=>String(x.id)===String(id));if(!p)return;editId=String(id);
    const body=openSheet('Editar producto');
    const stk=stockOf(p),sc=typeof stockCol==='function'?stockCol(p):null,on=p.disponible!==false,img=p.imagen_url||'';
    const cat=(categories||[]).find(c=>String(c.id)===String(p.categoria_id));
    body.innerHTML=`<div class="x-eHead">${img?`<img class="x-pImg lg" src="${E(img)}" alt="">`:`<span class="x-pImg x-pIni lg">${E(String(p.nombre||'P').charAt(0).toUpperCase())}</span>`}<span><span class="x-kick">${E(cat?cat.nombre:'Sin categoría')}</span><strong>${E(p.nombre||'Producto')}</strong></span></div>
      <div class="x-swRow"><span><strong>Visible en la tienda</strong><small>Apágalo si hoy no lo vendes.</small></span><button type="button" class="x-tog ${on?'on':''}" id="pdxEVis" aria-label="Visible en la tienda"></button></div>
      <div class="x-grid2"><label class="x-eLbl">Precio (S/)<input class="x-in" id="pdxEPrecio" type="number" inputmode="decimal" min="0" step="0.10" value="${E(Number(p.precio||0).toFixed(2))}"></label>${sc?`<div class="x-eLbl">Stock<div class="x-step"><button type="button" data-s="-1" aria-label="Restar stock">−</button><input id="pdxEStock" type="number" inputmode="numeric" min="0" step="1" value="${E(stk??0)}" aria-label="Stock"><button type="button" data-s="1" aria-label="Sumar stock">+</button></div></div>`:''}</div>
      <div class="x-grid2"><button type="button" class="x-btn light sm" id="pdxEUp">↑ Subir</button><button type="button" class="x-btn light sm" id="pdxEDown">↓ Bajar</button></div>
      <button type="button" class="x-btn light" id="pdxEFull">Editar foto, descripción y categoría</button>
      <button type="button" class="x-btn" id="pdxESave">Guardar cambios</button>
      <div class="x-muted" id="pdxEMsg" role="status" style="text-align:center;min-height:16px"></div>
      <button type="button" class="x-eDel" id="pdxEDel">Eliminar producto</button>`;
    body.querySelectorAll('.x-step [data-s]').forEach(x=>x.onclick=()=>{const i=$('pdxEStock');i.value=Math.max(0,Math.floor(Number(i.value||0))+Number(x.dataset.s))});
    try{window.pdTipoEditHook&&window.pdTipoEditHook(p,body)}catch(e){console.warn('Variantes',e)}
    try{window.pdDescProdHook&&window.pdDescProdHook(p,body)}catch(e){console.warn('Descartables',e)}
    $('pdxEVis').onclick=()=>$('pdxEVis').classList.toggle('on');
    $('pdxEUp').onclick=async()=>{if(await moveProduct(p,-1))$('pdxEMsg').textContent='✓ Subió un lugar en la carta.';else $('pdxEMsg').textContent='Ya está primero en su categoría.'};
    $('pdxEDown').onclick=async()=>{if(await moveProduct(p,1))$('pdxEMsg').textContent='✓ Bajó un lugar en la carta.';else $('pdxEMsg').textContent='Ya está último en su categoría.'};
    $('pdxEFull').onclick=()=>{closeSheet();window.editProduct(p.id)};
    $('pdxEDel').onclick=async()=>{const n=products.length;await window.deleteProduct(p.id);if(!(products||[]).some(x=>String(x.id)===String(p.id))||products.length<n)closeSheet()};
    $('pdxESave').onclick=async()=>{
      const precio=Number($('pdxEPrecio').value);if(!Number.isFinite(precio)||precio<0){$('pdxEMsg').textContent='Escribe un precio válido.';return}
      const payload={precio:Math.round(precio*100)/100,disponible:$('pdxEVis').classList.contains('on')};
      const extraT=window.pdTipoPayload?window.pdTipoPayload(p):null;if(extraT&&extraT.error){$('pdxEMsg').textContent=extraT.error;return}
      if(sc){const st=Math.max(0,Math.floor(Number($('pdxEStock').value||0)));payload[sc]=st;if(st===0&&payload.disponible){$('pdxEMsg').textContent='Sin stock no puede estar visible. Súmale stock o apágalo.';return}}
      if(extraT&&extraT.patch)Object.assign(payload,extraT.patch);
      const btn=$('pdxESave');btn.disabled=true;$('pdxEMsg').textContent='Guardando…';
      if(window.pdDescProdGuardar){const erD=await window.pdDescProdGuardar(p);if(erD){btn.disabled=false;$('pdxEMsg').textContent=erD;return}}
      const {error}=await db.from('productos_negocio').update(payload).eq('id',p.id).eq('negocio_id',R().id);btn.disabled=false;
      if(error){$('pdxEMsg').textContent='No se pudo guardar: '+error.message;return}
      Object.assign(p,payload);paintCarta();closeSheet();
    };
  }
  if(typeof window.renderProducts==='function'){
    const _rp=window.renderProducts;
    window.renderProducts=function(){const out=_rp.apply(this,arguments);try{paintCarta()}catch(e){console.warn('Productos',e)}return out};
  }
  if(typeof window.renderCategories==='function'){
    const _rc=window.renderCategories;
    window.renderCategories=function(){const out=_rc.apply(this,arguments);try{paintCarta()}catch(e){}return out};
  }
  // Las categorías por defecto ya no vuelven a crearse si el negocio las eliminó.
  if(typeof window.ensureDefaultCategories==='function'){
    const _ed=window.ensureDefaultCategories;
    window.ensureDefaultCategories=async function(){try{const {data,error}=await db.from('categorias_negocio').select('id').eq('negocio_id',R().id);if(!error&&data&&data.length)return}catch(e){}return _ed.apply(this,arguments)};
  }
  document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#saveProduct')){const t0=Date.now();const t=setInterval(()=>{if(Date.now()-t0>10000){clearInterval(t);return}const m=$('productMsg');if(m&&!m.classList.contains('hidden')&&/correctamente/i.test(m.textContent)){clearInterval(t);$('pdxProdPanel').hidden=true}},300)}},true);
  // Ocultar ya no borra el stock: solo cambia la visibilidad.
  window.hideProduct=async id=>{const b=document.querySelector(`.x-pRow[data-pid="${CSS.escape(String(id))}"] [data-a="vis"]`);if(b)b.click()};

  /* ============ Horario (dentro de Perfil) ============ */
  let dirty=false;
  const SHORT={lunes:'Lun',martes:'Mar',miercoles:'Mié',jueves:'Jue',viernes:'Vie',sabado:'Sáb',domingo:'Dom'};
  function horCard(){
    return `<section class="x-card" id="pdxHorCard"><div class="x-h"><span><span class="x-kick">Paso 4</span><strong>Horario de atención</strong></span><span class="x-pill" id="pdxHorPill">—</span></div>
      <div class="x-muted" id="pdxHorNow" style="margin-top:-6px"></div>
      <div id="pdxHorRows"></div>
      <div class="x-grid2"><button type="button" class="x-btn light sm" id="pdxHorCopy">Igual todos los días</button><button type="button" class="x-btn light sm" id="pdxHorAll">Abrir toda la semana</button></div>
      <p class="x-muted" style="margin:0">Toca un día para abrirlo o cerrarlo. Los cambios se guardan con «Guardar cambios».</p><div class="x-muted" id="pdxHorMsg" role="status"></div></section>`;
  }
  function wireHor(){
    const rows=$('pdxHorRows');if(!rows)return;
    rows.addEventListener('click',e=>{const t=e.target.closest('.x-dayTog');if(!t)return;const r=t.closest('[data-day]');const on=!r.classList.contains('on');r.classList.toggle('on',on);t.setAttribute('aria-pressed',on);dirty=true;horMsg('Cambios sin guardar.')});
    rows.addEventListener('input',()=>{dirty=true;horMsg('Cambios sin guardar.')});
    $('pdxHorCopy').onclick=()=>{const all=[...rows.querySelectorAll('[data-day]')];const src=all.find(r=>r.classList.contains('on'));if(!src){horMsg('Primero abre al menos un día.');return}const a=src.querySelector('.ha').value,c=src.querySelector('.hc').value;all.forEach(r=>{if(r.classList.contains('on')){r.querySelector('.ha').value=a;r.querySelector('.hc').value=c}});dirty=true;horMsg(`Usamos ${fmtT(a)} – ${fmtT(c)} para todos los días abiertos. Cambios sin guardar.`)};
    $('pdxHorAll').onclick=()=>{rows.querySelectorAll('[data-day]').forEach(r=>{r.classList.add('on');r.querySelector('.x-dayTog').setAttribute('aria-pressed','true')});dirty=true;horMsg('Toda la semana abierta. Cambios sin guardar.')};
  }
  const horMsg=t=>{const m=$('pdxHorMsg');if(m)m.textContent=t};
  function paintHor(force){
    const s=status(),p=$('pdxHorPill');if(p){p.textContent=s.open?'● Abierto':'Cerrado';p.className='x-pill'+(s.open?'':' off')}const nw=$('pdxHorNow');if(nw)nw.textContent=s.text;
    const rows=$('pdxHorRows');if(!rows||(dirty&&!force))return;
    const h=parseH(horarioRaw()),today=KEYS[lima().getDay()];
    rows.innerHTML=DAYS.map(d=>{const v=h[d],on=!!v;return `<div class="x-hr ${on?'on':''} ${d===today?'today':''}" data-day="${d}"><button type="button" class="x-dayTog" aria-pressed="${on}" aria-label="${DNAME[d]}">${SHORT[d]}</button><input type="time" class="ha" aria-label="Abre el ${DNAME[d]}" value="${on?E(v[0].padStart(5,'0')):'09:00'}"><span class="x-hrSep">a</span><input type="time" class="hc" aria-label="Cierra el ${DNAME[d]}" value="${on?E(v[1].padStart(5,'0')):'22:00'}"><span class="x-hrOff">Cerrado</span></div>`}).join('');
  }
  async function saveHor(){
    const rows=[...document.querySelectorAll('#pdxHorRows [data-day]')];
    const parts=[];for(const r of rows){if(!r.classList.contains('on'))continue;const a=r.querySelector('.ha').value,c=r.querySelector('.hc').value;if(!a||!c){horMsg('Completa las horas del '+DNAME[r.dataset.day]+'.');return false}if(a===c){horMsg('El '+DNAME[r.dataset.day]+' la hora de apertura y la de cierre no pueden ser iguales.');return false}parts.push(r.dataset.day+'='+a+'-'+c)}
    for(const r of rows){if(!r.classList.contains('on'))continue;const err=typeof window.pdValidarHorarioDia==='function'?window.pdValidarHorarioDia(r.querySelector('.ha').value,r.querySelector('.hc').value):'';if(err){horMsg(DNAME[r.dataset.day]+': '+err);return false}}
    horMsg('Guardando horario…');
    try{const {data,error}=await db.from('negocios').update({horario:parts.join('|')||null}).eq('id',R().id).select('id,horario').maybeSingle();if(error)throw error;if(!data)throw new Error('Supabase no actualizó el negocio (revisa permisos).');R().horario=data.horario;dirty=false;paintHor(true);paintHead();horMsg('✓ Horario guardado.');return true}
    catch(e){horMsg('No se pudo guardar el horario: '+(e.message||e));return false}
  }

  /* ============ Perfil ============ */
  const CATS=['Restaurantes','Comida criolla','Pizzerías','Pollerías','Hamburgueserías','Comida rápida','Sangucherías','Paviferías','Cevicherías','Chifas','Sushi y comida japonesa','Parrillas y anticuchos','Heladerías','Cafeterías','Juguerías','Dulcerías y pastelerías','Panaderías','Bodegas y minimarkets','Fruterías y verdulerías','Carnicerías','Licorerías','Farmacias y boticas','Ropa y moda','Calzado y zapatillas','Accesorios y bisutería','Tecnología','Celulares y accesorios','Belleza y cuidado personal','Hogar y decoración','Ferreterías','Deportes','Bebés y maternidad','Florerías y regalos','Mascotas','Librerías y útiles escolares','Jugueterías','Lavanderías'];
  function buildPerf(){
    const tab=$('perfilTab');if(!tab||$('pdxPerf'))return;
    const item=id=>$(id)?.closest('.profileItem');
    const it={nom:item('perfilNombre'),desc:item('perfilDescripcion'),cat:item('perfilCategoriaNegocio'),ruc:item('perfilRuc'),num:item('perfilNumero'),dir:item('perfilDireccion'),lat:item('perfilLatitud'),lng:item('perfilLongitud'),maps:item('perfilMaps')};
    const act=$('perfilActivo'),save=$('editarPerfil'),msg=$('perfilMsg'),share=$('miEnlaceCartaCard'),overlay=$('horarioEdicion');
    const root=document.createElement('div');root.id='pdxPerf';
    root.innerHTML=`<section class="x-card dark" style="flex-direction:row;align-items:center;gap:14px"><span class="x-logo" id="pdxLogo"></span><span style="display:flex;flex-direction:column;gap:3px;min-width:0;flex:1"><span class="x-kick">Mi perfil</span><span class="x-title" id="pdxPerfName" style="font-size:20px;color:#fff"></span><span style="font-size:13px;color:#FBE6DD" id="pdxPerfSub"></span></span></section>
      <section class="x-card"><div class="x-h"><span><strong>Datos del negocio</strong></span></div><div class="x-sec" id="pdxS1"></div></section>
      <section class="x-card"><div class="x-h"><span><strong>Ubicación</strong></span></div><div class="x-sec" id="pdxS2"></div></section>
      <section class="x-card"><div class="x-h"><span><strong>En la tienda</strong></span></div><div class="x-sec" id="pdxS3"></div></section>
      ${horCard()}
      <section class="x-card" style="margin-top:12px"><div class="x-h"><span><span class="x-kick">Comparte</span><strong>Mi enlace de carta</strong></span></div><div id="pdxShare"></div></section>
      <section class="x-card"><div class="x-h"><span><strong>Seguridad</strong></span></div><div>
        <div class="x-setRow"><span><strong>Contraseña</strong><small>Cambia la clave con la que entras a tu panel.</small></span><button type="button" class="x-btn light" id="pdxPass">Cambiar</button></div></div></section>
      <section class="x-card"><div class="x-h"><span><strong>Avisos de pedidos</strong></span></div><div>
        <div class="x-setRow"><span><strong>Sonido de avisos</strong><small>Suena cuando llega un pedido nuevo.</small></span><button type="button" class="x-tog" id="pdxSnd" aria-label="Sonido"></button></div>
        <div class="x-setRow"><span><strong>Probar sonido</strong><small>Escucha la alarma de pedido nuevo.</small></span><button type="button" class="x-btn light" id="pdxTest">Probar</button></div>
        <div class="x-setRow"><span><strong>Avisos del teléfono</strong><small id="pdxPermTxt"></small></span><button type="button" class="x-btn light" id="pdxPerm">Activar</button></div></div></section>
      <div class="x-sticky" id="pdxSaveBar"></div>
      <button type="button" class="x-btn light" id="pdxLogout" style="color:var(--fr-red)!important;border-color:#f1c4bf!important">Cerrar sesión</button><div class="pdxSpacer"></div>`;
    [...tab.children].forEach(c=>{if(c!==overlay)keep(c)});
    tab.appendChild(root);if(overlay)tab.appendChild(overlay);
    const ht=$('horarioTab');if(ht)[...ht.children].forEach(keep);
    wireHor();
    const S1=$('pdxS1'),S2=$('pdxS2'),S3=$('pdxS3');
    const g2=(a,b)=>{const w=document.createElement('div');w.className='x-grid2';[a,b].forEach(x=>x&&w.appendChild(x));return w};
    [it.nom,it.cat,it.desc].forEach(x=>x&&S1.appendChild(x));S1.appendChild(g2(it.num,it.ruc));
    [it.dir,it.maps].forEach(x=>x&&S2.appendChild(x));S2.appendChild(g2(it.lat,it.lng));
    const sel=$('perfilCategoriaNegocio');if(sel){const cur=sel.value;sel.innerHTML='<option value="">Selecciona una categoría</option>'+CATS.map(c=>`<option>${E(c)}</option>`).join('');if(cur)sel.value=cur}
    S3.insertAdjacentHTML('beforeend',`<div class="profileItem"><span>Tiempo estimado de entrega</span><input id="pdxTiempo" maxlength="20" placeholder="Ej. 25–35 min"></div><div class="x-swRow"><span><strong>Negocio visible en la tienda</strong><small>Si lo apagas, los clientes no verán tu negocio.</small></span><button type="button" class="x-tog" id="pdxActTog" aria-label="Negocio visible"></button></div><div class="x-swRow" id="pdxDescRow"><span><strong>Descartables en los pedidos</strong><small>Si lo enciendes, pones aquí el precio de cada descartable. El taper y el vaso los eliges en cada producto (se suman a su precio). La bolsa se agrega a cada pedido y el cliente puede sumar cubiertos.</small></span><button type="button" class="x-tog" id="pdxDescTog" aria-label="Activar descartables"></button></div><div class="profileItem" id="pdxDescPrecioBox" hidden><span>Precio de cada descartable (S/). Déjalo vacío si no lo ofreces, o pon 0 si lo das gratis.</span><div class="pdxDcGrid"><label class="pdxDcF"><span>Taper pequeño</span><input id="pdxDc_taper_p" inputmode="decimal" maxlength="6" placeholder="Ej. 0.30" autocomplete="off"></label><label class="pdxDcF"><span>Taper grande</span><input id="pdxDc_taper_g" inputmode="decimal" maxlength="6" placeholder="Ej. 0.50" autocomplete="off"></label><label class="pdxDcF"><span>Vaso pequeño</span><input id="pdxDc_vaso_p" inputmode="decimal" maxlength="6" placeholder="Ej. 0.20" autocomplete="off"></label><label class="pdxDcF"><span>Vaso grande</span><input id="pdxDc_vaso_g" inputmode="decimal" maxlength="6" placeholder="Ej. 0.30" autocomplete="off"></label><label class="pdxDcF"><span>Bolsa</span><input id="pdxDc_bolsa" inputmode="decimal" maxlength="6" placeholder="Ej. 0.20" autocomplete="off"></label><label class="pdxDcF"><span>Cubiertos (opcional para el cliente)</span><input id="pdxDc_cubiertos" inputmode="decimal" maxlength="6" placeholder="Ej. 0.30" autocomplete="off"></label></div><div id="pdxDescMsg" role="status" style="font-size:12.5px;margin-top:6px"></div></div>`);
    if(act){act.style.display='none';S3.appendChild(act)}
    $('pdxActTog').onclick=()=>{if(!act)return;act.checked=!act.checked;act.dataset.touched='1';$('pdxActTog').classList.toggle('on',act.checked)};
    if(save){save.className='x-btn';save.textContent='Guardar cambios';$('pdxSaveBar').appendChild(save)}if(msg)$('pdxSaveBar').appendChild(msg);
    if(share){const url=$('miEnlaceCartaUrl'),cp=$('copiarEnlaceCarta'),wa=$('compartirEnlaceCarta'),ver=$('verMiCarta'),sm=$('miEnlaceCartaMsg');const box=$('pdxShare');box.style.cssText='display:flex;flex-direction:column;gap:8px';const row=document.createElement('div');row.className='x-share';if(url){url.classList.add('x-in');row.appendChild(url)}if(cp){cp.className='x-btn light';cp.style.width='auto';row.appendChild(cp)}box.appendChild(row);const r2=document.createElement('div');r2.className='x-grid2';if(wa){wa.className='x-btn sm';r2.appendChild(wa)}if(ver){ver.className='x-btn light sm';ver.textContent='Ver mi tienda';r2.appendChild(ver)}box.appendChild(r2);if(sm)box.appendChild(sm);keep(share)}
    $('perfilMaps')?.addEventListener('input',()=>{const u=$('perfilMaps').value;const m=u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||u.match(/[?&](?:q|query|ll)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i)||u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);if(m){$('perfilLatitud').value=m[1];$('perfilLongitud').value=m[2]}});
    $('pdxSnd').onclick=()=>{Snd.on=!Snd.on;LS.set('pd_sound',Snd.on?'on':'off');if(Snd.on)Snd.play('info');paintPerf();paintBanner()};
    $('pdxTest').onclick=async()=>{await Snd.ready();setBannerOff();Snd.play('nuevo')};
    $('pdxPerm').onclick=async()=>{if('Notification' in window&&Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}else{let ok=false;try{const c=(()=>{try{return db}catch(e){return window.db}})();const t=(await c.auth.getSession()).data.session.access_token;
      const r=await fetch('https://escxesvzndmyfuteawey.supabase.co/functions/v1/enviar-push',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({type:'PRUEBA_MIA'})});const j=await r.json().catch(()=>({}));
      if(r.ok){ok=true;alertUser(j.enviados>0?{kind:'info',title:'Aviso de prueba enviado',text:'Apaga la pantalla: debe llegar en unos segundos.'}:{kind:'info',title:'Este teléfono no está registrado',text:'Toca «Activar avisos» otra vez.'})}}catch(_){}
      if(!ok)alertUser({kind:'info',title:'Así se verán tus avisos',text:'Te avisaremos de cada pedido nuevo.'})}paintPerf();paintBanner()};
    $('pdxPass').onclick=()=>pdxCambiarClave();
    $('pdxLogout').onclick=async ()=>{if((await pdConfirmar('¿Cerrar sesión? Dejarás de recibir avisos de pedidos en este teléfono.')))$('logout')?.click()};
  }
  function pdxCambiarClave(){
    const body=openSheet('Cambiar contraseña');
    const campo=(id,lbl,ac)=>`<label class="x-eLbl">${lbl}<span class="pdxPwWrap"><input class="x-in" id="${id}" type="password" autocomplete="${ac}" minlength="6" maxlength="72"><button type="button" class="pdxPwEye" data-ver="${id}" aria-label="Mostrar contraseña">Ver</button></span></label>`;
    body.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px">
            ${campo('pdxPwNew','Nueva contraseña','new-password')}
      ${campo('pdxPwRep','Repite la nueva contraseña','new-password')}
      <small class="x-muted">Usa al menos 6 caracteres. Al cambiarla, entrarás con la nueva clave en todos tus teléfonos.</small>
      <div id="pdxPwMsg" class="pdxPwMsg" role="status"></div>
      <button type="button" class="x-btn" id="pdxPwSave">Guardar contraseña</button></div>`;
    body.querySelectorAll('[data-ver]').forEach(b=>b.onclick=()=>{const i=$(b.dataset.ver);const v=i.type==='password';i.type=v?'text':'password';b.textContent=v?'Ocultar':'Ver'});
    const msg=(t,ok)=>{const m=$('pdxPwMsg');m.textContent=t||'';m.className='pdxPwMsg'+(t?(ok?' ok':' err'):'')};
    const btn=$('pdxPwSave');
    btn.onclick=async()=>{
      const nw=$('pdxPwNew').value,rep=$('pdxPwRep').value;
      if(nw.length<6)return msg('La nueva contraseña debe tener al menos 6 caracteres.');
      if(nw!==rep)return msg('Las contraseñas nuevas no coinciden.');
      btn.disabled=true;btn.textContent='Guardando…';msg('');
      try{
        const __pdClaveNueva=async(cli,pw)=>{const {data,error}=await cli.functions.invoke('cambiar-mi-password',{body:{password:pw}});if(error){let m='';try{const j=await error.context.clone().json();m=j&&j.error||''}catch(_){}throw new Error(m||'No se pudo cambiar la contraseña. Revisa tu internet.')}if(data&&data.error)throw new Error(data.error)};await __pdClaveNueva(db,nw);
        closeSheet();
        alertUser({kind:'ok',title:'Contraseña actualizada',text:'Desde ahora entra con tu nueva contraseña.'});
      }catch(e){msg(e.message||String(e))}
      finally{btn.disabled=false;btn.textContent='Guardar contraseña'}
    };
    setTimeout(()=>$('pdxPwNew')?.focus(),250);
  }
  function paintPerf(){
    if(!$('pdxPerf')||!R())return;const r=R();
    const logo=r.logo_url||r.logo||r.imagen_logo_url||'';const L=$('pdxLogo');if(L)L.innerHTML=logo?`<img src="${E(logo)}" alt="" onerror="this.parentElement.textContent='${E(String(r.nombre||'N').charAt(0).toUpperCase())}'">`:E(String(r.nombre||'N').charAt(0).toUpperCase());
    $('pdxPerfName').textContent=r.nombre||'Mi negocio';$('pdxPerfSub').textContent=[r.categoria_negocio,(r.activo===false||r.visible_admin===false)?'Oculto en la tienda':'Visible en la tienda'].filter(Boolean).join(' · ');
    const t=$('pdxTiempo');if(t&&document.activeElement!==t&&!t.dataset.touched)t.value=r.tiempo_estimado||'';
    const act=$('perfilActivo');if(act&&!act.dataset.touched)act.checked=r.activo!==false;if(act)$('pdxActTog').classList.toggle('on',act.checked&&r.visible_admin!==false);
    $('pdxSnd').classList.toggle('on',Snd.on);
    const sv=$('editarPerfil');if(sv&&sv.textContent!=='Guardar cambios'&&!sv.disabled)sv.textContent='Guardar cambios';
    const p=$('pdxPerm'),pt=$('pdxPermTxt');if(!('Notification' in window)){pt.textContent='Este navegador no permite avisos.';p.hidden=true}else if(Notification.permission==='granted'){pt.textContent='Activados.';p.textContent='Probar'}else if(Notification.permission==='denied'){pt.textContent='Bloqueados. Actívalos en los ajustes del sitio en Chrome.';p.hidden=true}else{pt.textContent='Desactivados.';p.textContent='Activar'}
  }
  if(typeof window.renderPerfilVista==='function'){
    const _rpv=window.renderPerfilVista;
    window.renderPerfilVista=function(){const out=_rpv.apply(this,arguments);try{paintPerf();paintHor();paintHead()}catch(e){}return out};
  }
  if(typeof window.guardarPerfilAhora==='function'){
    const _g=window.guardarPerfilAhora;
    window.guardarPerfilAhora=async function(){
      if(dirty)await saveHor();
      const out=await _g.apply(this,arguments);
      const t=$('pdxTiempo');const val=(t?.value||'').trim();
      const okSave=/correctamente/i.test($('perfilMsg')?.textContent||'');if(okSave&&R()&&(val!==(R().tiempo_estimado||''))){const {error}=await db.from('negocios').update({tiempo_estimado:val||null}).eq('id',R().id);if(error){const m=$('perfilMsg');if(m){m.textContent='Perfil guardado, pero el tiempo estimado no: '+error.message+' (ejecuta el SQL que agrega la columna tiempo_estimado).';m.classList.remove('hidden')}}else{R().tiempo_estimado=val||null;if(t)delete t.dataset.touched}}
      const ac=$('perfilActivo');if(okSave&&ac&&R()){R().activo=ac.checked;delete ac.dataset.touched}
      paintPerf();paintHor();paintHead();return out;
    };
  }
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='pdxTiempo')e.target.dataset.touched='1'});

  /* ============ Menú inferior ============ */
  const NAVI={pedidos:'<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/></svg>',carta:'<svg viewBox="0 0 24 24"><path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/></svg>',tienda:'<svg viewBox="0 0 24 24"><path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 11v9h14v-9M10 20v-5h4v5"/></svg>',perfil:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.5-4 3.2-6 7.5-6s7 2 7.5 6"/></svg>'};
  function buildNav(){
    const nav=$('nav');if(!nav||nav.dataset.pdx)return;nav.dataset.pdx='1';
    nav.style.setProperty('margin-left','auto','important');nav.style.setProperty('margin-right','auto','important');
    const set=(k,label,ic)=>{const b=nav.querySelector(`[data-tab="${k}"]`);if(!b)return null;b.innerHTML=`<span class="pdxNi">${ic}</span><span class="pdxNl">${label}</span>`;nav.appendChild(b);return b};
    const bp=set('pedidos','Inicio',NAVI.pedidos);if(bp)bp.insertAdjacentHTML('beforeend','<i class="pdxBadge" id="pdxBadge" hidden></i>');
    set('carta','Productos',NAVI.carta);
    set('perfil','Mi perfil',NAVI.perfil);
    ['categorias','horario'].forEach(k=>{const b=nav.querySelector(`[data-tab="${k}"]`);if(b){b.hidden=true;b.classList.add('pdxGone');nav.appendChild(b)}});
  }
  function paintBadge(){const b=$('pdxBadge');if(!b)return;const n=(businessOrders||[]).filter(o=>stage(o).k==='nuevo').length;b.hidden=!n;b.textContent=n>9?'9+':String(n)}
  if(typeof window.switchPanelTab==='function'){
    const _sp=window.switchPanelTab;
    window.switchPanelTab=function(tab){if(tab==='categorias')tab='carta';if(tab==='horario')tab='perfil';const out=_sp.call(this,tab);try{if(tab==='carta')paintCarta();if(tab==='perfil'){dirty=false;paintHor(true);paintPerf()}}catch(e){}return out};
  }

  function boot(){buildHead();buildPedidos();buildCarta();buildPerf();buildNav();paintHead();try{renderOrders()}catch(e){}try{paintCarta();paintHor(true);paintPerf()}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setInterval(()=>{paintHead();paintHor()},30000);
  setInterval(()=>{const w=$('pdxWelcome');if(w&&R()&&R().nombre&&w.textContent!=='Hola, '+R().nombre)w.textContent='Hola, '+R().nombre},3000);
})();
