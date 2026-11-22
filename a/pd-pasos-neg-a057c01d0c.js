/* ===== Pidemás · Negocio · pedido por pasos =====
   Reemplaza la ventana vieja del detalle del pedido. Usa las mismas acciones de la app:
   confirmar y enviar a Pidemás, pago recibido y pedido listo. */
(function(){
  if(window.__pdPasosNeg||!window.PdPasos)return;window.__pdPasosNeg=1;
  const U=PdPasos.util,E=U.E,M=U.money;
  const L=()=>{try{return Array.isArray(businessOrders)?businessOrders:[]}catch(e){return window.businessOrders||[]}};
  const R=()=>{try{return restaurant||{}}catch(e){return {}}};
  const D=()=>{try{return db}catch(e){return window.db}};
  const st=o=>String(o?.estado||'pendiente').toLowerCase();
  const T=window.__pdxT=window.__pdxT||{},P=window.__pdxP=window.__pdxP||{},CAP=window.__pdxCap=window.__pdxCap||{};
  const aceptado={};let abierto=null,error='';const DET={};
  const yape=o=>String(o.metodo_pago||'').toLowerCase()!=='efectivo';
  function opcTiempo(){
    const OPC=['10–20 min','20–30 min','30–40 min'];const ops=OPC.map(t=>({t,n:t.match(/\d+/g).map(Number)[1]}));
    const ns=(String(R().tiempo_estimado||'').match(/\d+/g)||[]).map(Number),hi=ns.length?ns[ns.length-1]:0;
    let def=ops[0];if(hi)ops.forEach(x=>{if(Math.abs(x.n-hi)<Math.abs(def.n-hi))def=x});return {ops,def};
  }
  function marca(obs,mk){const t=String(obs||''),i=t.indexOf(mk);if(i<0)return null;let j=i+mk.length,p=0,k=j;if(t.charAt(j)!=='{')return null;for(;k<t.length;k++){if(t[k]==='{')p++;else if(t[k]==='}'){p--;if(!p){k++;break}}}try{return JSON.parse(t.slice(j,k))}catch(e){return null}}
  function etapa(o){
    const s=st(o);
    if(s==='cancelado')return -1;
    if(['en_camino','en_entrega','camino_entrega','entregado'].includes(s))return 9;
    const conf=s!=='pendiente';
    if(!conf)return aceptado[o.id]?1:0;
    if(o.pago_negocio_confirmado!==true)return 1.5;
    if(o.listo_para_recojo!==true)return 2;
    return 3;
  }
  function items(o){
    if(Array.isArray(o.detalle_pedidos)&&o.detalle_pedidos.length){DET[o.id]={rows:o.detalle_pedidos};return o.detalle_pedidos}
    const c=DET[o.id];if(c&&c.rows)return c.rows;
    if(!c){DET[o.id]={};try{D().from('detalle_pedidos').select('*').eq('pedido_id',o.id).then(r=>{DET[o.id]={rows:(r&&r.data)||[]};PdPasos.render()},()=>{DET[o.id]={rows:[]}})}catch(e){}}
    return [];
  }
  async function correr(fn,id){
    error='';const box=document.getElementById('businessOrdersMsg');const antes=box?box.textContent:'';
    if(typeof window[fn]!=='function'){error='Esta acción no está disponible. Actualiza la app.';return}
    try{await window[fn](id)}catch(e){error=String(e?.message||e)}
    const ahora=box&&!box.classList.contains('hidden')&&box.style.display!=='none'?String(box.textContent||'').trim():'';
    if(!error&&ahora&&ahora!==antes&&/no se pudo|primero|error|bloque|sube tu qr|debes/i.test(ahora))error=ahora;
  }

  function modelo(){
    const o=L().find(x=>String(x.id)===String(abierto));if(!o)return null;
    const id=String(o.id),e=etapa(o),r=R(),pa=String(o.pago_acordado||'').toLowerCase();
    const det=items(o),cli=o.nombre_cliente||'Cliente',mn=o.motorizado_nombre||'El motorizado';
    const OT=opcTiempo();if(!T[id]||!OT.ops.some(x=>x.n===T[id]))T[id]=Number(o.tiempo_preparacion_min)||OT.def.n;
    if(!yape(o))P[id]='efectivo';else if(!P[id]&&/pagará al motorizado con QR/i.test(String(o.observaciones||'')))P[id]='yape_negocio';
    const pos=e===-1?-1:e>=9?99:e===1.5?1:Math.floor(e);
    const steps=['Aceptar el pedido','Coordinar el pago','Preparar el pedido','Entregar al motorizado'].map((t,i)=>({title:t,state:pos===99||i<pos?'done':i===pos?'active':'locked'}));
    const tmin=Number(o.tiempo_preparacion_min)||T[id];
    const listoA=o.negocio_aceptado_en&&o.tiempo_preparacion_min?U.hora(new Date(new Date(o.negocio_aceptado_en).getTime()+o.tiempo_preparacion_min*60000)):'';
    const PAT={yape_negocio:'Paga todo al recibir con tu Yape',solo_delivery:'Te pagó productos · falta el delivery',pagado:'Te pagó todo · tú pagas el delivery',efectivo:'Paga en efectivo al recibir',yape:'Paga con el Yape de Pidemás'};

    /* 1 · Aceptar */
    {const s=steps[0];s.sum='Aceptado · listo en '+tmin+' min';
      const ef=marca(o.observaciones,'__PIDEMAS_PAGO_EFECTIVO__');
      let h=U.who(cli,'Cliente · paga con '+(yape(o)?'Yape':'efectivo')+(ef&&Number(ef.monto)>0?' (con '+M(ef.monto)+')':''),'',true)+U.items('Qué pidió',det,true)+
        `<div class="sum"><div class="lbl">Montos</div><div class="li"><span>Productos</span><b>${M(o.subtotal)}</b></div><div class="li"><span>Delivery</span><b>${M(o.costo_delivery)}</b></div><div class="li t"><span>Total</span><b>${M(o.total)}</b></div></div>`;
      if(e===0)h+=`<div><div class="lbl">¿En cuánto estará listo?</div><div class="grid4" style="grid-template-columns:repeat(${OT.ops.length},minmax(0,1fr))" data-act="tiempo">${OT.ops.map(x=>`<button type="button" data-n="${x.n}" class="${x.n===T[id]?'on':''}">${E(x.t)}</button>`).join('')}</div></div>`;
      const nota=String(o.observaciones||'').replace(/__PIDEMAS_[A-Z0-9_]+__(\{[^]*?\})?/g,'').split(/\s+[·|]\s+/).map(x=>x.trim()).filter(x=>x&&!/^(Pago Yape:|Ubicaci|DELIVERY PAGADO|PRODUCTO_MAYOR)/i.test(x)).join(' · ');
      if(nota)h+=U.note('<b>Nota del cliente:</b> '+E(nota));
      if(/PRODUCTO_MAYOR_18_VERIFICAR_DNI/.test(String(o.observaciones||'')))h+=U.st('Producto +18: el motorizado verificará el DNI del cliente.','mal');
      s.body=h;}
    /* 2 · Coordinar el pago */
    {const s=steps[1];s.locked='Se muestra al aceptar el pedido';s.sum=PAT[pa]||PAT[P[id]]||'Pago coordinado';
      let h='';
      if(!yape(o)){
        const ef=marca(o.observaciones,'__PIDEMAS_PAGO_EFECTIVO__');
        h+=U.st(E(cli)+' paga en <b>efectivo</b> al recibir: el motorizado cobra '+M(o.total)+'.','ok')+
          (ef&&Number(ef.monto)>0?`<div class="sum"><div class="lbl">Pago en efectivo</div><div class="li"><span>Paga con</span><b>${M(ef.monto)}</b></div><div class="li"><span>Vuelto que lleva el motorizado</span><b>${M(Math.max(0,Number(ef.vuelto!=null?ef.vuelto:ef.monto-o.total)||0))}</b></div></div>`:'');
      }else if(e<=1){
        const sel=P[id]||'';
        h+=U.note(E(cli)+' eligió pagar con <b>Yape</b> y coordinar contigo. Escríbele: el mensaje ya lleva el total y tu Yape.')+
          `<button type="button" class="b g" data-act="wa">${U.I.wa}Coordinar por WhatsApp</button>`+
          `<div><div class="lbl">¿Cómo quedó el pago?</div><div class="opts" data-act="pago">${[['yape_negocio','Paga todo al recibir con mi Yape','El motorizado muestra tu QR'],['solo_delivery','Me pagó productos, falta el delivery','El motorizado cobra el delivery con el QR de Pidemás'],['pagado','Cliente pagó todo, yo pago','Tú yapeas el delivery a Pidemás']].map(x=>`<button type="button" class="opt${x[0]===sel?' on':''}" data-k="${x[0]}"><b>${x[1]}</b><span>${x[2]}</span></button>`).join('')}</div></div>`;
        if(sel==='yape_negocio'){
          h+=r.yape_qr_url?`<button type="button" class="qr" data-act="miqr"><span class="im" style="background-image:url('${E(r.yape_qr_url)}')"></span><span class="t"><span class="k">Tu Yape</span><span class="a">${E(r.yape_titular||r.nombre||'')}</span><span class="b2">${E(r.yape_numero||'')}</span><span class="c">El motorizado se lo mostrará al cliente</span></span></button>`+U.note('El dinero llega directo a ti. Luego Pidemás te cobra el delivery ('+M(o.costo_delivery)+').')
            :U.st('Sube tu QR de Yape: el motorizado se lo mostrará al cliente.','mal')+`<button type="button" class="b o" data-act="subirqr">Subir mi QR</button>`;
        }else if(sel==='pagado'){
          let cfg={};try{cfg=typeof window.pdYapeCfg==='function'?(window.pdYapeCfg()||{}):{}}catch(_){}
          h+=`<div class="qr" style="cursor:default"><span class="im"${cfg.url?` style="background-image:url('${E(cfg.url)}')"`:''}>${cfg.url?'':'QR'}</span><span class="t"><span class="k">Yapea ${M(o.costo_delivery)} a Pidemás</span><span class="a">${E(cfg.titular||'Pidemás')}</span><span class="b2">${E(cfg.numero||'')}</span><span class="c">Pedido ${E(U.ref(id))}</span></span></div>`+
            (CAP[id]?U.st('Captura enviada · ya puedes confirmar','ok'):`<button type="button" class="b g" data-act="captura">${U.I.wa}Enviar captura por WhatsApp</button>`);
        }else if(sel==='solo_delivery')h+=U.note('El motorizado cobrará solo el delivery ('+M(o.costo_delivery)+') con el QR de Pidemás.');
      }else h+=U.st(E(PAT[pa]||'Pago coordinado'),'ok');
      if(e===1.5)h+=U.note('Confirma solo cuando hayas verificado el pago con el cliente.');
      s.body=h;}
    /* 3 · Preparar */
    {const s=steps[2];s.locked='Se muestra cuando confirmes el pago';s.sum='Listo'+(o.listo_para_recojo_en?' a las '+U.hora(o.listo_para_recojo_en):'');
      s.body=`<div class="amt"><div class="k">Debe estar listo en</div><div class="n">${E(tmin)} min</div>${listoA?`<div class="pill">Le dijimos al cliente aprox. ${E(listoA)}</div>`:''}</div>`+U.items('Qué preparar',det,false)+
        (o.motorizado_id?U.st('El motorizado <b>'+E(mn)+'</b> '+(o.en_local_en?'ya llegó a tu local.':'ya va en camino a tu local.'),'ok'):U.note('Pidemás está asignando un motorizado.'));}
    /* 4 · Entregar al motorizado */
    {const s=steps[3];s.locked='Se muestra cuando el pedido esté listo';s.sum='Entregado a '+mn+(o.en_camino_en?' · '+U.hora(o.en_camino_en):'');
      s.body=(o.motorizado_id?U.who(mn,'Motorizado · '+(o.en_local_en?'llegó a tu local':'va camino a tu local'),'',false):U.note('Pidemás está asignando un motorizado.'))+
        (o.en_local_en?U.code('Pídele el código',o.codigo_recojo||U.ref(id),'Compáralo antes de entregarle el pedido'):U.note('Cuando llegue te mostraremos el código para compararlo.'));}

    const m={kicker:'Pedido '+U.ref(id),steps,err:error,acts:{}};
    if(e===-1){m.title='Pedido cancelado';m.chip='Cancelado';m.chipCls='mal';steps.forEach(s=>s.state='locked');m.fin={mal:true,title:'Este pedido fue cancelado',text:o.motivo_cancelacion||''};return m}
    if(e>=9){const ent=st(o)==='entregado';m.title=ent?'Entregado al cliente':'Entregado al motorizado';m.chip='Listo';m.chipCls='ok';
      const lines=[];
      if(pa==='yape_negocio')lines.push(E(cli)+' te paga '+M(o.total)+' con tu Yape'+(o.yape_negocio_estado==='llego'?' · confirmado':''));
      else if(pa==='pagado')lines.push('El cliente ya te pagó todo');
      else lines.push('El motorizado cobra '+M(pa==='solo_delivery'?o.costo_delivery:o.total)+' al cliente');
      if(pa==='yape_negocio'||pa==='solo_delivery')lines.push('Después Pidemás te cobra el delivery ('+M(o.costo_delivery)+'). Lo ves en «Mis pagos».');
      m.fin={title:ent?'Pedido entregado':'Pedido entregado al motorizado',text:ent?'El cliente ya recibió su pedido.':'Ahora va en camino a '+cli+'. Te avisamos cuando lo entregue.',lines};return m}
    const titles=['Pedido nuevo','Coordina el pago','Prepara el pedido','Entrega al motorizado'];
    m.title=titles[pos]||'';m.chip='Paso '+(pos+1)+' de 4';
    if(e===0)m.cta={label:'Aceptar pedido',run:()=>{aceptado[id]=1}};
    else if(e===1){const bloq=yape(o)&&(!P[id]||(P[id]==='pagado'&&!CAP[id])||(P[id]==='yape_negocio'&&!r.yape_qr_url));
      m.cta={label:'Confirmar y enviar a Pidemás',off:bloq,hint:bloq?(!P[id]?'Elige cómo quedó el pago para continuar':P[id]==='pagado'?'Envía la captura del Yape del delivery para continuar':'Sube tu QR de Yape para continuar'):'',run:()=>correr('pdxConfirmar',id)};
      m.alt=[{label:'Volver al paso 1',run:()=>{delete aceptado[id];PdPasos.render()}}];}
    else if(e===1.5)m.cta={label:'Pago recibido',run:()=>correr('businessConfirmPayment',id)};
    else if(e===2)m.cta={label:'Pedido listo',green:true,run:()=>correr('businessMarkReady',id)};
    else if(e===3){m.cta=null;m.alt=null}
    if(typeof window.pdnAnulable==='function'&&window.pdnAnulable(o)){m.alt=(m.alt||[]).concat([{label:'No puedo atender este pedido',mal:true,run:()=>{if(typeof window.pdnAnular==='function')window.pdnAnular(id)}}])}
    m.acts={
      tiempo:(box,ev)=>{const b=ev.target.closest('[data-n]');if(!b)return;T[id]=Number(b.dataset.n);PdPasos.render()},
      pago:(box,ev)=>{const b=ev.target.closest('[data-k]');if(!b)return;P[id]=b.dataset.k;if(typeof window.pdxPago==='function')try{window.pdxPago(id,b.dataset.k)}catch(_){}PdPasos.render()},
      wa:()=>{if(typeof window.businessWhatsApp==='function')window.businessWhatsApp(id)},
      captura:()=>{if(typeof window.pdxCapturaDelivery==='function')window.pdxCapturaDelivery(id);CAP[id]=true;PdPasos.render()},
      subirqr:()=>{if(typeof window.pdNegYape==='function')window.pdNegYape()},
      miqr:()=>{}
    };
    return m;
  }
  function abrir(id){abierto=String(id);error='';PdPasos.open(modelo,{onClose:()=>{abierto=null}})}
  window.pdAbrirPasosNeg=abrir;
  /* Tarjeta del pedido, botón «Detalle», avisos y campana abren esta vista */
  const f=function(id){return abrir(id)};f.__pasos=1;
  function enganchar(){if(window.pdoAbrir!==f)window.pdoAbrir=f;if(window.pdbOpen!==f)window.pdbOpen=f}
  enganchar();setInterval(enganchar,1000);
})();
