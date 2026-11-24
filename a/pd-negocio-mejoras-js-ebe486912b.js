/* Mis pagos · Calificaciones · Aviso por demora en aceptar · Anular con motivo · Pausar pedidos
   · Agotados rápido · Reportes · Programados · Tiempo real de preparación */
(function(){
  if(window.__pdNegMej)return;window.__pdNegMej=1;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=n=>'S/ '+(Number(n)||0).toFixed(2);
  const D=()=>{try{return db}catch(e){return window.db}};
  const R=()=>{try{return restaurant}catch(e){return null}};
  const OR=()=>{try{return Array.isArray(businessOrders)?businessOrders:[]}catch(e){return []}};
  const PR=()=>{try{return Array.isArray(products)?products:[]}catch(e){return []}};
  const T=v=>{const t=new Date(v).getTime();return Number.isFinite(t)?t:0};
  const ref=id=>'#'+String(id||'').replace(/-/g,'').slice(0,8).toUpperCase();
  const est=o=>String(o&&o.estado||'').toLowerCase();
  const hora=t=>new Date(t).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'numeric',minute:'2-digit'});
  const fH=v=>{try{return new Date(v).toLocaleString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'})}catch(e){return ''}};
  const sub=o=>{const s=Number(o.subtotal);if(Number.isFinite(s))return s;const t=Number(o.total),d=Number(o.costo_delivery);return Number.isFinite(t)?t-(Number.isFinite(d)?d:0):0};
  const alerta=a=>{try{window.pdAlert&&window.pdAlert(a)}catch(e){}};
  let ovCerrar=null;
  function hoja(t){
    cerrar();
    const ov=document.createElement('div');ov.id='pdnOv';ov.className='pdnOv';
    ov.innerHTML='<div class="pdnSh" role="dialog" aria-modal="true" aria-label="'+E(t)+'"><div class="pdnHd"><h2>'+E(t)+'</h2><button type="button" class="pdnX" aria-label="Cerrar">&times;</button></div><div class="pdnBody"><p class="pdnMut">Cargando…</p></div></div>';
    (function(){const st=(el,o)=>{for(const k in o)el.style.setProperty(k,o[k],'important')};
      st(ov.querySelector('.pdnSh'),{'border-radius':'24px 24px 0 0','border':'1px solid #EFE3DA','border-bottom':'0','box-shadow':'none','padding':'0','margin':'0','background':'#fff'});
      st(ov.querySelector('.pdnHd'),{'border-radius':'24px 24px 0 0','border':'0','border-bottom':'1px solid #EFE3DA','box-shadow':'none','margin':'0','background':'#fff'});
      st(ov.querySelector('.pdnBody'),{'border-radius':'0','border':'0','box-shadow':'none','margin':'0','background':'#FFF9F5'});})();
    document.body.appendChild(ov);document.documentElement.classList.add('pdnOvOpen');
    requestAnimationFrame(()=>ov.classList.add('open'));
    const fin=()=>{if(!ov.isConnected)return;ov.classList.remove('open');document.documentElement.classList.remove('pdnOvOpen');setTimeout(()=>ov.remove(),180);if(ovCerrar===fin)ovCerrar=null};
    ovCerrar=fin;ov.querySelector('.pdnX').onclick=fin;ov.addEventListener('click',e=>{if(e.target===ov)fin()});
    /* arrastrar hacia abajo para cerrar */
    const sh=ov.querySelector('.pdnSh'),hd=ov.querySelector('.pdnHd');let y0=null,dy=0;
    hd.addEventListener('touchstart',e=>{y0=e.touches[0].clientY;dy=0;sh.style.transition='none'},{passive:true});
    hd.addEventListener('touchmove',e=>{if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);sh.style.transform='translateY('+dy+'px)'},{passive:true});
    hd.addEventListener('touchend',()=>{sh.style.transition='';if(dy>90)fin();else sh.style.transform='';y0=null});
    return ov.querySelector('.pdnBody');
  }
  function cerrar(){try{ovCerrar&&ovCerrar()}catch(e){}}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrar()});
  const ok=t=>(window.pdExito||window.pdAviso||alert)(t);
  const err=t=>(window.pdAviso||alert)(t);
  function programado(o){try{if(o.programado_para)return T(o.programado_para);const s=String(o.observaciones||''),i=s.indexOf('__PIDEMAS_DELIVERY__');if(i<0)return 0;const m=s.slice(i).match(/"programado":"([^"]+)"/);return m?T(m[1]):0}catch(e){return 0}}
  const pausaHasta=()=>{const r=R();const t=r&&r.pausado_hasta?T(r.pausado_hasta):0;return t>Date.now()?t:0};

  /* ---------- Tarjeta de herramientas en Inicio ---------- */
  const IC={
    pausa:'<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    play:'<path d="M7 5l12 7-12 7z"/>',
    ago:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    pago:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    rep:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    cal:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    qr:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>'};
  const svg=p=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';
  function tools(){
    const home=$('pdHomeCard');if(!home||!home.parentNode)return;
    let c=$('pdnTools');
    if(!c){c=document.createElement('section');c.id='pdnTools';c.addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return;({pausa,agotados,pagos,reportes,calificaciones,yape})[b.dataset.n]()})}
    if(c.previousElementSibling!==home)home.after(c);
    const pz=pausaHasta();
    const ag=PR().filter(p=>p.disponible===false).length;
    const prox=OR().filter(o=>!['entregado','cancelado'].includes(est(o))).map(o=>({o,t:programado(o)})).filter(x=>x.t>Date.now()).sort((a,b)=>a.t-b.t)[0];
    const h=(prox?'<div class="pdnProg">🗓 Pedido programado '+E(ref(prox.o.id))+' para las <b>'+E(hora(prox.t))+'</b></div>':'')
      +'<button type="button" data-n="pausa" class="pdnT '+(pz?'on':'')+'">'+svg(pz?IC.play:IC.pausa)+'<span><b>'+(pz?'En pausa':'Pausar pedidos')+'</b><small>'+(pz?'Hasta las '+E(hora(pz))+' · reanudar':'Si estás saturado')+'</small></span></button>'
      +'<button type="button" data-n="agotados" class="pdnT">'+svg(IC.ago)+'<span><b>Agotados</b><small>'+(ag?ag+' producto'+(ag===1?'':'s')+' agotado'+(ag===1?'':'s'):'Apaga un producto rápido')+'</small></span></button>'
      +'<button type="button" data-n="pagos" class="pdnT">'+svg(IC.pago)+'<span><b>Mis pagos</b><small>Lo que te paga Pidemás</small></span></button>'
      +'<button type="button" data-n="reportes" class="pdnT">'+svg(IC.rep)+'<span><b>Reportes</b><small>Ventas y tiempos</small></span></button>'
      +'<button type="button" data-n="calificaciones" class="pdnT">'+svg(IC.cal)+'<span><b>Calificaciones</b><small>'+(calProm?'★ '+calProm.toFixed(1)+' de 5 · '+calN+' '+(calN===1?'opinión':'opiniones'):'Lo que opinan tus clientes')+'</small></span></button>'
      +'<button type="button" data-n="yape" class="pdnT'+(yapeListo()?'':' falta')+'">'+svg(IC.qr)+'<span><b>Mi Yape (QR)</b><small>'+(yapeListo()?'Listo para cobrar':'Súbelo para cobrar')+'</small></span></button>';
    if(c.__h!==h){c.__h=h;c.innerHTML=h}
  }
  let calProm=0,calN=0;

  /* ---------- Mi Yape (QR del negocio) ---------- */
  function yapeListo(){const r=R();return !!(r&&r.yape_qr_url)}
  function yape(){
    const b=hoja('Mi Yape (QR)');if(!b)return;const r=R();if(!r)return;
    let file=null,prev='';
    b.innerHTML='<div class="pdnYNota"><b>Sube solo el QR, recortado</b><span>Recorta la captura para que se vea únicamente el cuadro del QR, sin el resto de la pantalla. Así el cliente lo puede escanear sin problema.</span></div>'
      +'<div class="pdnYQr" id="pdnYQr"></div>'
      +'<label class="pdnYLb" for="pdnYNum">Número de Yape</label><input class="x-in" id="pdnYNum" type="tel" inputmode="numeric" maxlength="9" autocomplete="off" placeholder="9 dígitos">'
      +'<label class="pdnYLb" for="pdnYTit">Titular (como sale en tu Yape)</label><input class="x-in" id="pdnYTit" type="text" maxlength="60" autocomplete="off" placeholder="Nombre del titular">'
      +'<input type="file" id="pdnYFile" accept="image/png,image/jpeg,image/webp" hidden>'
      +'<div class="pdnYBtns"><button type="button" class="x-btn ghost" id="pdnYPick">'+(r.yape_qr_url?'Cambiar QR':'Elegir QR')+'</button><button type="button" class="x-btn" id="pdnYSave">Guardar</button></div>'
      +(r.yape_qr_url?'<button type="button" class="pdnYQuitar" id="pdnYDel">Quitar mi QR</button>':'')
      +'<p class="pdnErr" id="pdnYMsg" hidden></p>'
      +'<p class="pdnMut">Va en el WhatsApp para coordinar el pago. Y si eliges «Paga todo al recibir con mi Yape», el motorizado se lo muestra al cliente para que te pague directo a ti.</p>';
    $('pdnYNum').value=r.yape_numero||'';$('pdnYTit').value=r.yape_titular||'';
    const msg=t=>{const m=$('pdnYMsg');m.textContent=t||'';m.hidden=!t};
    const pint=()=>{const box=$('pdnYQr');const u=prev||r.yape_qr_url;box.innerHTML=u?'<img src="'+E(u)+'" alt="QR de Yape">':'<span>Aún no subes tu QR</span>';box.classList.toggle('vacio',!u)};
    pint();
    $('pdnYPick').onclick=()=>$('pdnYFile').click();
    $('pdnYFile').onchange=()=>{const f=$('pdnYFile').files[0];$('pdnYFile').value='';if(!f)return;msg('');
      if(!/^image\//.test(f.type)){msg('Elige una imagen (PNG o JPG).');return}
      if(f.size>5*1024*1024){msg('La imagen pesa más de 5 MB.');return}
      const u=URL.createObjectURL(f),im=new Image();
      im.onload=()=>{const k=Math.max(im.width,im.height)/Math.max(1,Math.min(im.width,im.height));
        if(k>1.3){URL.revokeObjectURL(u);msg('Esta imagen no es solo el QR (es muy alargada). Recórtala para que quede únicamente el cuadro del QR y vuelve a elegirla.');return}
        if(Math.min(im.width,im.height)<250){URL.revokeObjectURL(u);msg('La imagen es muy pequeña y el QR no se podría leer. Usa una captura más nítida.');return}
        file=f;prev=u;pint()};
      im.onerror=()=>{URL.revokeObjectURL(u);msg('No se pudo abrir esa imagen.')};im.src=u};
    $('pdnYSave').onclick=async()=>{
      const num=$('pdnYNum').value.replace(/\D/g,''),tit=$('pdnYTit').value.trim();msg('');
      if(!file&&!r.yape_qr_url){msg('Elige la imagen de tu QR.');return}
      if(num.length!==9){msg('El número de Yape debe tener 9 dígitos.');return}
      if(!tit){msg('Escribe el nombre del titular, tal como sale en tu Yape.');return}
      const bt=$('pdnYSave');bt.disabled=true;
      try{
        let url=r.yape_qr_url||null;const old=url;
        if(file){const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path='yape/'+r.id+'/qr-'+Date.now()+'.'+ext;const st=D().storage.from('restaurantes');
          const up=await st.upload(path,file,{upsert:true,contentType:file.type,cacheControl:'31536000'});if(up.error)throw up.error;url=st.getPublicUrl(path).data.publicUrl}
        const {error}=await D().from('negocios').update({yape_qr_url:url,yape_numero:num,yape_titular:tit}).eq('id',r.id);if(error)throw error;
        r.yape_qr_url=url;r.yape_numero=num;r.yape_titular=tit;
        if(file&&old&&old!==url){const mk='/storage/v1/object/public/restaurantes/',i=old.indexOf(mk);if(i>=0)D().storage.from('restaurantes').remove([decodeURIComponent(old.slice(i+mk.length).split('?')[0])]).catch(()=>{})}
        tools();cerrar();ok('Tu Yape quedó guardado');
      }catch(x){msg('No se pudo guardar: '+(x.message||x));bt.disabled=false}
    };
    const del=$('pdnYDel');if(del)del.onclick=async()=>{
      if(!(await (window.pdConfirmar?window.pdConfirmar('¿Quitar tu QR de Yape? Ya no se enviará en el mensaje de pago.'):Promise.resolve(true))))return;
      const old=r.yape_qr_url;const {error}=await D().from('negocios').update({yape_qr_url:null}).eq('id',r.id);if(error){msg('No se pudo quitar: '+error.message);return}
      r.yape_qr_url=null;const mk='/storage/v1/object/public/restaurantes/',i=String(old).indexOf(mk);if(i>=0)D().storage.from('restaurantes').remove([decodeURIComponent(old.slice(i+mk.length).split('?')[0])]).catch(()=>{});
      tools();cerrar();ok('Quitaste tu QR de Yape');};
  }
  window.pdNegYape=yape;
  async function leerCal(){const r=R();if(!r||!D())return [];const q=await D().from('calificaciones').select('pedido_id,estrellas_negocio,comentario,creado_en').eq('negocio_id',r.id).order('creado_en',{ascending:false}).limit(300);
    const L=(q.data||[]).filter(c=>Number(c.estrellas_negocio)>0);calN=L.length;calProm=L.length?L.reduce((s,c)=>s+Number(c.estrellas_negocio),0)/L.length:0;return L}

  /* ---------- 5. Pausar pedidos ---------- */
  async function guardarPausa(hasta){
    const r=R();if(!r)return;
    const {error}=await D().from('negocios').update({pausado_hasta:hasta}).eq('id',r.id);
    if(error){err('No se pudo guardar: '+error.message);return false}
    r.pausado_hasta=hasta;tools();return true;
  }
  function pausa(){
    const b=hoja('Pausar pedidos');if(!b)return;const pz=pausaHasta();
    b.innerHTML=(pz?'<div class="pdnStat warn"><span>Estás en pausa hasta</span><b>'+E(hora(pz))+'</b></div><button type="button" class="x-btn" data-p="0">Reanudar ahora</button><p class="pdnMut">O alarga la pausa:</p>':'<p class="pdnMut">Mientras estés en pausa, tu negocio aparece como cerrado en la tienda y nadie podrá pedirte. Los pedidos que ya tienes siguen igual.</p>')
      +'<div class="pdnChips">'+[[15,'15 min'],[30,'30 min'],[60,'1 hora'],[120,'2 horas']].map(x=>'<button type="button" data-p="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
    b.onclick=async e=>{const x=e.target.closest('[data-p]');if(!x)return;const m=+x.dataset.p;x.disabled=true;
      const hasta=m?new Date(Date.now()+m*60000).toISOString():null;
      if(await guardarPausa(hasta)){cerrar();ok(m?'Pedidos en pausa hasta las '+hora(T(hasta))+'.':'Listo, ya recibes pedidos otra vez.')}else x.disabled=false};
  }
  setInterval(()=>{const r=R();if(r&&r.pausado_hasta&&!pausaHasta()&&T(r.pausado_hasta)>0&&!r.__pzAvisado){r.__pzAvisado=1;alerta({kind:'info',title:'Terminó la pausa',text:'Tu negocio ya vuelve a recibir pedidos.'})}},30000);

  /* ---------- 6. Agotados rápido ---------- */
  async function setDisp(id,v){const {error}=await D().from('productos_negocio').update({disponible:v}).eq('id',id).eq('negocio_id',R().id);if(error)throw error;const p=PR().find(x=>String(x.id)===String(id));if(p)p.disponible=v}
  function agotados(){
    const b=hoja('Agotados');if(!b)return;let q='';
    const pint=()=>{const L=PR().filter(p=>!q||String(p.nombre||'').toLowerCase().includes(q)).sort((a,c)=>(a.disponible===false?0:1)-(c.disponible===false?0:1)||String(a.nombre).localeCompare(String(c.nombre)));
      $('pdnAgL').innerHTML=L.length?L.map(p=>'<div class="pdnRow"><span><b>'+E(p.nombre||'Producto')+'</b><small>'+(p.disponible===false?'Agotado · no aparece para pedir':M(p.precio))+'</small></span><button type="button" class="pdnSw '+(p.disponible===false?'':'on')+'" data-id="'+E(p.id)+'" aria-label="'+(p.disponible===false?'Activar':'Agotar')+'"><i></i></button></div>').join(''):'<p class="pdnMut">No hay productos.</p>'};
    b.innerHTML='<p class="pdnMut">Apaga lo que se terminó. Vuelve a prenderlo cuando tengas otra vez.</p><input class="x-in" id="pdnAgQ" placeholder="Buscar producto" autocomplete="off"><div id="pdnAgL"></div>';
    pint();$('pdnAgQ').oninput=e=>{q=e.target.value.trim().toLowerCase();pint()};
    b.onclick=async e=>{const s=e.target.closest('.pdnSw');if(!s)return;const p=PR().find(x=>String(x.id)===s.dataset.id);if(!p)return;const v=p.disponible===false;s.disabled=true;
      try{await setDisp(p.id,v);pint();tools()}catch(x){err('No se pudo cambiar: '+(x.message||x));s.disabled=false}};
  }

  /* ---------- 1. Mis pagos ---------- */
  async function pagos(){
    const b=hoja('Mis pagos');if(!b)return;const r=R();
    const desde=new Date(Date.now()-60*864e5).toISOString();
    const q=await D().from('pedidos').select('id,estado,subtotal,total,costo_delivery,pago_acordado,metodo_pago,creado_en,entregado_en,negocio_pagado_en,negocio_pagado_metodo,negocio_pagado_monto,delivery_negocio_cobrado_en').eq('negocio_id',r.id).eq('estado','entregado').gte('creado_en',desde).order('creado_en',{ascending:false}).limit(1000);
    if(q.error){b.innerHTML='<p class="pdnErr">No se pudo leer: '+E(q.error.message)+'</p>';return}
    const P=q.data||[];
    const ynE=p=>String(p.pago_acordado||'')==='yape_negocio'&&String(p.metodo_pago||'').toLowerCase()==='efectivo',cobra=P.filter(p=>(ynE(p)||!['solo_delivery','pagado','yape_negocio'].includes(String(p.pago_acordado||'')))&&sub(p)>0);
    const pend=cobra.filter(p=>!p.negocio_pagado_en),pag=cobra.filter(p=>p.negocio_pagado_en);
    const deb=P.filter(p=>['pagado','yape_negocio'].includes(String(p.pago_acordado||''))&&!ynE(p)&&!p.delivery_negocio_cobrado_en&&Number(p.costo_delivery)>0);
    const tP=pend.reduce((s,p)=>s+sub(p),0),tD=deb.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0);
    const fila=(p,v,x)=>'<div class="pdnRow"><span><b>'+E(ref(p.id))+'</b><small>'+E(fH(p.entregado_en||p.creado_en))+(x?' · '+E(x):'')+'</small></span><b>'+M(v)+'</b></div>';
    b.innerHTML='<div class="pdnStat"><span>Pidemás te debe</span><b>'+M(tP)+'</b></div>'
      +'<p class="pdnMut">Son los pedidos que el cliente le pagó a Pidemás (al motorizado o por Yape). Te corresponde el valor de los productos.</p>'
      +(pend.length?'<div class="pdnLbl">Por pagarte ('+pend.length+')</div>'+pend.map(p=>fila(p,sub(p))).join(''):'<p class="pdnOk">✓ Estás al día: Pidemás no te debe nada.</p>')
      +(deb.length?'<div class="pdnStat warn"><span>Tú le debes a Pidemás (delivery)</span><b>'+M(tD)+'</b></div>'+deb.map(p=>fila(p,p.costo_delivery,'delivery')).join(''):'')
      +(pag.length?'<div class="pdnLbl">Ya te pagamos (últimos 60 días)</div>'+pag.slice(0,40).map(p=>fila(p,p.negocio_pagado_monto??sub(p),'pagado el '+fH(p.negocio_pagado_en)+(p.negocio_pagado_metodo?' · '+p.negocio_pagado_metodo:''))).join(''):'');
  }

  /* ---------- 2. Calificaciones ---------- */
  async function calificaciones(){
    const b=hoja('Calificaciones');if(!b)return;
    let L;try{L=await leerCal()}catch(e){L=[]}
    if(!L.length){b.innerHTML='<p class="pdnMut">Todavía no tienes calificaciones. Cuando tus clientes califiquen sus pedidos, las verás aquí.</p>';return}
    const dist=[5,4,3,2,1].map(n=>[n,L.filter(c=>Math.round(c.estrellas_negocio)===n).length]);
    const st=v=>'★'.repeat(Math.round(v))+'☆'.repeat(5-Math.round(v));
    b.innerHTML='<div class="pdnCal"><b>'+calProm.toFixed(1)+'</b><span class="pdnStars">'+st(calProm)+'</span><small>'+L.length+' calificación'+(L.length===1?'':'es')+'</small></div>'
      +'<div class="pdnDist">'+dist.map(([n,c])=>'<div><span>'+n+'★</span><i><s style="width:'+(L.length?Math.round(c*100/L.length):0)+'%"></s></i><b>'+c+'</b></div>').join('')+'</div>'
      +'<div class="pdnLbl">Comentarios recientes</div>'+(L.filter(c=>c.comentario).slice(0,25).map(c=>'<div class="pdnRow"><span><b class="pdnStars">'+st(c.estrellas_negocio)+'</b><small>'+E(c.comentario)+' · '+E(fH(c.creado_en))+'</small></span></div>').join('')||'<p class="pdnMut">Sin comentarios todavía.</p>');
    tools();
  }

  /* ---------- 7 y 9. Reportes (incluye tiempo real de preparación) ---------- */
  async function reportes(dias){
    dias=dias||7;const b=hoja('Reportes');if(!b)return;const r=R();
    const desde=new Date(Date.now()-(dias===1?(Date.now()-new Date(new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'})+'T00:00:00-05:00').getTime()):dias*864e5)).toISOString();
    const q=await D().from('pedidos').select('id,estado,subtotal,total,costo_delivery,creado_en,negocio_aceptado_en,listo_para_recojo_en,tiempo_preparacion_min,entregado_en,cancelado_por,motivo_cancelacion').eq('negocio_id',r.id).gte('creado_en',desde).limit(3000);
    if(q.error){b.innerHTML='<p class="pdnErr">'+E(q.error.message)+'</p>';return}
    const P=q.data||[],ent=P.filter(p=>est(p)==='entregado'),can=P.filter(p=>est(p)==='cancelado');
    const venta=ent.reduce((s,p)=>s+sub(p),0);
    const prep=P.map(p=>p.negocio_aceptado_en&&p.listo_para_recojo_en?{real:(T(p.listo_para_recojo_en)-T(p.negocio_aceptado_en))/60000,dijo:Number(p.tiempo_preparacion_min)||0}:null).filter(x=>x&&x.real>=0&&x.real<300);
    const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
    const real=avg(prep.map(x=>x.real)),dijo=avg(prep.filter(x=>x.dijo).map(x=>x.dijo)),aTiempo=prep.filter(x=>x.dijo&&x.real<=x.dijo+2).length,conDijo=prep.filter(x=>x.dijo).length;
    const horas=new Array(24).fill(0);P.filter(p=>est(p)!=='cancelado').forEach(p=>{horas[+new Date(p.creado_en).toLocaleString('en-US',{timeZone:'America/Lima',hour:'numeric',hour12:false})%24]++});const mx=Math.max(1,...horas);
    let top=[];
    try{const ids=ent.map(p=>p.id);const items=[];for(let i=0;i<ids.length;i+=80){const d=await D().from('detalle_pedidos').select('*').in('pedido_id',ids.slice(i,i+80));if(!d.error&&d.data)items.push(...d.data)}
      const g=new Map();items.forEach(x=>{const k=String(x.nombre_producto||x.producto_nombre||x.nombre||'Producto');const c=g.get(k)||{n:0,v:0};const q2=Number(x.cantidad)||1;c.n+=q2;const s2=Number(x.subtotal??x.total_linea);c.v+=Number.isFinite(s2)?s2:(Number(x.precio_unitario??x.precio)||0)*q2;g.set(k,c)});top=[...g].sort((a,c)=>c[1].n-a[1].n).slice(0,8)}catch(e){}
    const mot=new Map();can.forEach(p=>{const k=(p.motivo_cancelacion||'Sin motivo')+(p.cancelado_por?' ('+p.cancelado_por+')':'');mot.set(k,(mot.get(k)||0)+1)});
    const csv=['Pedido;Estado;Productos;Total;Creado;Aceptado;Listo;Min. prometidos;Entregado;Motivo anulación',...P.map(p=>[ref(p.id),p.estado,sub(p).toFixed(2),Number(p.total||0).toFixed(2),fH(p.creado_en),p.negocio_aceptado_en?fH(p.negocio_aceptado_en):'',p.listo_para_recojo_en?fH(p.listo_para_recojo_en):'',p.tiempo_preparacion_min||'',p.entregado_en?fH(p.entregado_en):'',p.motivo_cancelacion||''].join(';'))].join('\n');
    b.innerHTML='<div class="pdnChips">'+[[1,'Hoy'],[7,'7 días'],[30,'30 días']].map(x=>'<button type="button" data-d="'+x[0]+'" class="'+(x[0]===dias?'on':'')+'">'+x[1]+'</button>').join('')+'</div>'
      +'<div class="pdnGrid"><div><span>Pedidos</span><b>'+P.length+'</b></div><div><span>Entregados</span><b>'+ent.length+'</b></div><div><span>Vendido</span><b>'+M(venta)+'</b></div><div><span>Ticket promedio</span><b>'+M(ent.length?venta/ent.length:0)+'</b></div><div><span>Anulados</span><b>'+can.length+'</b></div><div><span>Tasa de anulación</span><b>'+(P.length?Math.round(can.length*100/P.length):0)+'%</b></div></div>'
      +'<div class="pdnLbl">Tiempo de preparación</div>'+(prep.length?'<div class="pdnGrid"><div><span>Tardas en promedio</span><b>'+Math.round(real)+' min</b></div><div><span>Prometes en promedio</span><b>'+(dijo?Math.round(dijo)+' min':'—')+'</b></div></div><p class="pdnMut">'+(conDijo?'Cumpliste a tiempo '+aTiempo+' de '+conDijo+' pedidos ('+Math.round(aTiempo*100/conDijo)+'%). ':'')+(dijo&&real>dijo+3?'Sueles tardar más de lo que prometes: elige un tiempo un poco mayor al aceptar.':dijo&&real<dijo-5?'Sueles terminar antes: puedes prometer menos tiempo y vender más.':'Tus tiempos van bien.')+'</p>':'<p class="pdnMut">Aún no hay pedidos marcados como listos en este periodo.</p>')
      +'<div class="pdnLbl">Lo más vendido</div>'+(top.length?top.map(([k,x])=>'<div class="pdnRow"><span><b>'+E(k)+'</b><small>'+M(x.v)+'</small></span><b>'+x.n+'</b></div>').join(''):'<p class="pdnMut">Sin ventas en este periodo.</p>')
      +'<div class="pdnLbl">Tus horas fuertes</div><div class="pdnHoras">'+horas.map((n,h)=>n?'<div><span>'+(h%12||12)+(h<12?' am':' pm')+'</span><i><s style="width:'+Math.max(4,Math.round(n*100/mx))+'%"></s></i><b>'+n+'</b></div>':'').join('')+'</div>'
      +(mot.size?'<div class="pdnLbl">Motivos de anulación</div>'+[...mot].sort((a,c)=>c[1]-a[1]).map(([k,n])=>'<div class="pdnRow"><span><b>'+E(k)+'</b></span><b>'+n+'</b></div>').join(''):'')
      +'<a class="x-btn light pdnCsv" download="reporte-'+dias+'d.csv" href="data:text/csv;charset=utf-8,'+encodeURIComponent('﻿'+csv)+'">Descargar Excel (CSV)</a>';
    b.onclick=e=>{const d=e.target.closest('[data-d]');if(d)reportes(+d.dataset.d)};
  }

  /* ---------- 4. Anular con motivo ---------- */
  const ANULABLE=['pendiente','confirmado','aceptado','asignado','pedido_aceptado','camino_recojo'];
  function idModal(m){const b=m.querySelector('.pdoFoot [onclick*="pdxTrack("]')||m.querySelector('[onclick*="pdoAccion("]')||m.querySelector('[onclick*="pdoTiempo("]')||m.querySelector('[onclick*="pdxTrack("]');const t=b&&b.getAttribute('onclick')||'';const r=t.match(/\('([^']+)'/);return r?r[1]:''}
  function pedido(id){return OR().find(x=>String(x.id)===String(id))||(window.pdUDatos&&pdUDatos.ped&&pdUDatos.ped(id))||null}
  function botonAnular(){
    const m=$('pdoModal');if(!m)return;const foot=m.querySelector('.pdoFoot');if(!foot||!foot.getClientRects().length)return;
    const id=idModal(m),o=pedido(id);let b=foot.querySelector(':scope > .pdnAnular');
    const puede=o&&ANULABLE.includes(est(o))&&!o.en_camino_en;
    if(!puede){if(b)b.remove();return}
    if(!b){b=document.createElement('button');b.type='button';b.className='pdnAnular';b.textContent='No puedo atender este pedido';b.onclick=e=>{e.preventDefault();e.stopPropagation();anular(b.dataset.id)}}
    b.dataset.id=id;if(b!==foot.lastElementChild)foot.appendChild(b);
  }
  function itemsDe(o){return Array.isArray(o.detalle_pedidos)&&o.detalle_pedidos.length?o.detalle_pedidos:(window.pdUDatos&&pdUDatos.items?pdUDatos.items(o.id)||[]:[])}
  function prodDe(it){const pid=it.producto_id||it.product_id||it.producto_negocio_id;const n=String(it.nombre_producto||it.producto_nombre||it.nombre||'').trim().toLowerCase();return PR().find(p=>pid&&String(p.id)===String(pid))||PR().find(p=>String(p.nombre||'').trim().toLowerCase()===n)||null}
  async function devolverStock(o){
    for(const it of itemsDe(o)){const p=prodDe(it);if(!p)continue;const q=Math.max(1,Math.floor(Number(it.cantidad)||1));
      try{const r=await D().rpc('increment_product_negocio_stock',{p_product_id:p.id,p_quantity:q});
        if(r.error&&p.stock!=null&&p.stock!==undefined){await D().from('productos_negocio').update({stock:Math.max(0,Number(p.stock)||0)+q}).eq('id',p.id);p.stock=(Number(p.stock)||0)+q}}catch(e){}}
  }
  window.pdnAnular=id=>anular(id);window.pdnAnulable=o=>!!o&&ANULABLE.includes(est(o))&&!o.en_camino_en;
  function anular(id){
    const o=pedido(id);if(!o)return;const b=hoja('¿Por qué no puedes atenderlo?');if(!b)return;
    const MOT=['Sin stock','Negocio cerrado o sin personal','No llego a tiempo','El cliente no pagó o no responde','Otro'];let m='';
    const its=itemsDe(o);
    b.innerHTML='<p class="pdnMut">Pedido '+E(ref(o.id))+' · '+E(o.nombre_cliente||'Cliente')+'. Pidemás será avisado al instante para hablar con el cliente.</p><div class="pdnChips col">'+MOT.map(x=>'<button type="button" data-m="'+E(x)+'">'+E(x)+'</button>').join('')+'</div>'
      +'<div id="pdnAgo" hidden><div class="pdnLbl">¿Qué productos se agotaron?</div>'+(its.map((it,i)=>{const p=prodDe(it);return p?'<label class="pdnChk"><input type="checkbox" value="'+E(p.id)+'" checked><span>'+E(p.nombre)+'</span></label>':''}).join('')||'<p class="pdnMut">No se identificaron los productos.</p>')+'<p class="pdnMut">Los marcaremos como agotados para que no te los vuelvan a pedir.</p></div>'
      +'<input class="x-in" id="pdnAnDet" maxlength="120" placeholder="Detalle (opcional)"><p class="pdnErr" id="pdnAnMsg"></p><button type="button" class="x-btn pdnRojo" id="pdnAnOk" style="background:#B42318!important;border-color:#B42318!important;color:#fff!important">Anular pedido</button><button type="button" class="x-btn light" id="pdnAnNo">Volver</button>';
    b.onclick=async e=>{
      const x=e.target.closest('[data-m]');if(x){m=x.dataset.m;b.querySelectorAll('[data-m]').forEach(z=>z.classList.toggle('on',z===x));$('pdnAgo').hidden=m!=='Sin stock';return}
      if(e.target.closest('#pdnAnNo'))return cerrar();
      if(!e.target.closest('#pdnAnOk'))return;
      const det=($('pdnAnDet').value||'').trim();if(!m){$('pdnAnMsg').textContent='Elige un motivo.';return}if(m==='Otro'&&!det){$('pdnAnMsg').textContent='Escribe el motivo.';return}
      const motivo=[m!=='Otro'?m:'',det].filter(Boolean).join(' · ');
      if(!(await pdConfirmar('¿Anular el pedido '+ref(o.id)+'?\nMotivo: '+motivo)))return;
      const btn=$('pdnAnOk');btn.disabled=true;btn.textContent='Anulando…';
      try{
        const fresh=await D().from('pedidos').select('estado,en_camino_en').eq('id',o.id).maybeSingle();
        if(fresh.data&&(!ANULABLE.includes(est(fresh.data))||fresh.data.en_camino_en))throw new Error('El pedido ya avanzó y no se puede anular desde aquí. Escribe a Pidemás.');
        if(m==='Sin stock'){for(const i of [...b.querySelectorAll('#pdnAgo input:checked')])try{await setDisp(i.value,false)}catch(_){}}
        else await devolverStock(o);
        const obs=[o.observaciones||'','Anulado a pedido del negocio: '+motivo].filter(Boolean).join(' | ');
        let r=await D().from('pedidos').update({estado:'cancelado',cancelado_en:new Date().toISOString(),cancelado_por:'negocio',motivo_cancelacion:motivo,observaciones:obs}).eq('id',o.id).eq('negocio_id',R().id).select('id').maybeSingle();
        if(r.error)throw r.error;if(!r.data)throw new Error('No se pudo actualizar el pedido.');
        o.estado='cancelado';o.cancelado_por='negocio';cerrar();
        try{document.querySelector('#pdoModal .pdoX, #pdoModal [data-close], #pdoModal .pdoClose')?.click()}catch(_){}
        ok('Pedido anulado. Pidemás ya fue avisado.');try{await loadBusinessOrders()}catch(_){}
      }catch(x){$('pdnAnMsg').textContent=x.message||String(x);btn.disabled=false;btn.textContent='Anular pedido'}
    };
  }

  /* ---------- 3, 8 y 9. Avisos: demora en aceptar, programados y tiempo real ---------- */
  const visto=new Set(),listos=new Map();
  function vigilar(){
    const now=Date.now();
    OR().forEach(o=>{const id=String(o.id),s=est(o);
      if(s==='pendiente'){const min=(now-T(o.creado_en))/60000;
        [[2,'Pedido '+ref(id)+' espera hace 2 min','Acéptalo ahora, el cliente está esperando tu confirmación.'],[4,'¡Pedido '+ref(id)+' sin aceptar hace 4 min!','Si no lo aceptas pronto, Pidemás llamará a tu negocio.']].forEach(([u,t,x])=>{
          if(min>=u&&min<u+15&&!visto.has(id+':'+u)){visto.add(id+':'+u);alerta({kind:'nuevo',key:'demora:'+id,pedidoId:id,title:t,text:x});try{navigator.vibrate&&navigator.vibrate([400,150,400,150,400])}catch(_){}}})}
      const pt=programado(o);
      if(pt&&!['entregado','cancelado'].includes(s)&&pt-now<=40*60000&&pt-now>-10*60000&&!visto.has(id+':prog')){visto.add(id+':prog');alerta({kind:'nuevo',key:'prog:'+id,pedidoId:id,title:'Programado '+ref(id)+' para las '+hora(pt),text:'Empieza a prepararlo para que esté listo a tiempo.'})}
      const l=o.listo_para_recojo===true;
      if(listos.has(id)&&!listos.get(id)&&l&&o.negocio_aceptado_en){const real=Math.round(((o.listo_para_recojo_en?T(o.listo_para_recojo_en):now)-T(o.negocio_aceptado_en))/60000),dijo=Number(o.tiempo_preparacion_min)||0;
        if(real>=0&&real<300)alerta({kind:'ok',pedidoId:id,title:'Lo preparaste en '+real+' min',text:dijo?(real<=dijo?'¡A tiempo! Prometiste '+dijo+' min.':'Prometiste '+dijo+' min. La próxima elige un poco más de tiempo.'):'Buen trabajo.'})}
      listos.set(id,l);
    });
  }

  let n=0;
  setInterval(()=>{if(!R()||!D())return;n++;try{tools()}catch(e){}try{botonAnular()}catch(e){}if(n%10===1)try{vigilar()}catch(e){}if(n===3||n%600===0)leerCal().then(tools).catch(()=>{})},1000);
  window.pdNeg={pausa,agotados,pagos,reportes,calificaciones};
})();
