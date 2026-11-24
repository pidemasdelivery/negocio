(function(){
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const code=id=>'#'+String(id||'').slice(0,8).toUpperCase();
  const DB=()=>{try{return db}catch(e){return window.db}};
  let cfg=null;
  async function cargarCfg(){try{const c=DB();if(!c||!c.storage)return;const u=c.storage.from('restaurantes').getPublicUrl('config/yape.json').data.publicUrl+'?t='+Date.now();const r=await fetch(u,{cache:'no-store'});if(r.ok)cfg=await r.json()}catch(e){}}
  setTimeout(cargarCfg,800);setInterval(cargarCfg,10*60*1000);
  window.__pdxP=window.__pdxP||{};window.__pdxCap=window.__pdxCap||{};
  function efectivo(o){
    const s=String(o.observaciones||'');const i=s.indexOf('__PIDEMAS_PAGO_EFECTIVO__');let d=null;
    if(i>=0){let j=i+'__PIDEMAS_PAGO_EFECTIVO__'.length,p=0,k=j;for(;k<s.length;k++){if(s[k]==='{')p++;else if(s[k]==='}'){p--;if(!p){k++;break}}}try{d=JSON.parse(s.slice(j,k))}catch(e){}}
    return d;
  }
  /* Acciones del pedido nuevo: dependen de cómo eligió pagar el cliente en la tienda */
  window.pdxNuevoActs=function(o,c){
    const id=c.id,A=c.A,sel=c.sel,m=String(o.metodo_pago||'').toLowerCase();
    const tiempo=`<div class="x-tLbl">${m==='efectivo'?'1':'3'} · ¿En cuánto estará listo?</div><div class="x-tChips">${[10,15,20,30].map(n=>`<button type="button" class="${n===sel?'on':''}" onclick="pdxTiempo('${E(id)}',${n})">${n} min</button>`).join('')}</div>`;
    const fin=`<button type="button" class="x-btn red" ${A} onclick="pdxConfirmar('${E(id)}')">Confirmar y enviar a Pidemás</button><div class="x-grid2"><button type="button" class="x-btn light sm" ${A} onclick="businessWhatsApp('${E(id)}')">WhatsApp</button><button type="button" class="x-btn light sm x-trkBtn" onclick="pdxTrack('${E(id)}')">${c.trk||''}Seguimiento</button></div>`;
    if(m==='efectivo'){
      window.__pdxP[id]='efectivo';
      const d=efectivo(o),tot=Number(o.total)||0;
      const info=d&&Number(d.monto)>0?`<div class="r"><span>Paga con</span><b>${money(d.monto)}</b></div><div class="r" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;padding:12px 14px;border-radius:12px;background:#E9F6EE;color:#15803D;font-weight:700;font-size:15px"><span>Vuelto que lleva el motorizado</span><b style="font-size:17px;font-weight:800;color:#15803D">${money(Math.max(0,Number(d.vuelto??(d.monto-tot))||0))}</b></div>`:'<div class="r"><span>Paga con</span><b>Monto exacto</b></div>';
      return `<div class="x-cashInfo"><b class="t">Paga en efectivo al recibir</b><div class="r"><span>El motorizado cobra</span><b>${money(tot)}</b></div>${info}</div>${tiempo}${fin}`;
    }
    const pg=window.__pdxP[id]||'';
    const ops=[['yape_negocio','Paga todo al recibir con mi Yape'],['solo_delivery','Me pagó productos, falta el delivery'],['pagado','Cliente pagó todo, yo pago']];
    const del=Number(o.costo_delivery)||0;
    const qr=cfg&&cfg.url?`<img src="${E(cfg.url)}" alt="QR de Yape de Pidemás">`:'';
    const datos=[cfg&&cfg.numero?'Yape '+cfg.numero:'',cfg&&cfg.titular||''].filter(Boolean).join(' · ')||'Yape de Pidemás';
    return `<div class="x-note">El cliente eligió pagar con <b>Yape</b> y coordinar contigo. Escríbele por WhatsApp.</div>
      <button type="button" class="x-btn light" ${A} onclick="businessWhatsApp('${E(id)}')">1 · Coordinar pago por WhatsApp</button>
      <div class="x-tLbl">2 · ¿Cómo quedó el pago?</div>
      <div class="x-tChips x-pChips">${ops.map(([k,l])=>`<button type="button" data-p="${k}" class="${k===pg?'on':''}" onclick="pdxPago('${E(id)}','${k}')">${l}</button>`).join('')}</div>
      <div class="x-delPay" data-del="${E(id)}" ${pg==='pagado'?'':'hidden'}><span class="k">Pago del delivery a Pidemás</span><h5>Yapea ${money(del)}</h5><p>El cliente ya te pagó todo. Yapea el delivery a Pidemás y envía la captura.</p>
        <div class="qr">${qr}<b>${E(cfg&&cfg.numero?'Yape '+String(cfg.numero).replace(/\D/g,'').replace(/^(\d{3})(\d{3})(\d{3})$/,'$1 $2 $3'):'Yape de Pidemás')}</b><small>${E(cfg&&cfg.titular||'Pidemás')} · Pedido ${E(code(id))}</small></div>
        <button type="button" class="x-btn" onclick="pdxCapturaDelivery('${E(id)}')">Enviar captura por WhatsApp</button>
        ${window.__pdxCap[id]?'<span class="ok">Captura enviada · ya puedes confirmar el pedido</span>':''}</div>
      ${tiempo}${fin}`;
  };
  window.pdxCapturaDelivery=function(id){
    const o=(typeof businessOrders!=='undefined'?businessOrders:[]).find(x=>String(x.id)===String(id))||{};
    let ph=String(cfg&&cfg.whatsapp_admin||'986233533').replace(/\D/g,'');if(ph.length===9)ph='51'+ph;
    const neg=(typeof restaurant!=='undefined'&&restaurant&&restaurant.nombre)||'';
    const txt=['*PIDEMÁS · PAGO DE DELIVERY*',neg?'Negocio: '+neg:'','Pedido '+code(id),'Delivery yapeado: '+money(o.costo_delivery),'Adjunto la captura del Yape.'].filter(Boolean).join('\n');
    const u='https://wa.me/'+ph+'?text='+encodeURIComponent(txt);
    window.__pdxCap[id]=true;
    const box=document.querySelector(`.x-delPay[data-del="${CSS.escape(String(id))}"]`);if(box&&!box.querySelector('.ok'))box.insertAdjacentHTML('beforeend','<span class="ok">Captura enviada · ya puedes confirmar el pedido</span>');
    if(typeof window.pdOpenWhatsApp==='function')window.pdOpenWhatsApp(u);else window.open(u,'_blank');
  };
  /* Al elegir «yo pago el delivery» se muestra el QR de Pidemás */
  const espera=setInterval(()=>{
    if(typeof window.pdxPago!=='function'||window.pdxPago.__pdpg)return;clearInterval(espera);
    const base=window.pdxPago;
    window.pdxPago=function(id,k){const r=base.apply(this,arguments);const box=document.querySelector(`.x-delPay[data-del="${CSS.escape(String(id))}"]`);if(box)box.hidden=k!=='pagado';return r};window.pdxPago.__pdpg=true;
    const conf=window.pdxConfirmar;
    window.pdxConfirmar=async function(id){
      if(window.__pdxP[id]==='pagado'&&!window.__pdxCap[id]){
        (typeof show==='function'&&document.getElementById('businessOrdersMsg'))?show(document.getElementById('businessOrdersMsg'),'Primero yapea el delivery a Pidemás y envía la captura.'):pdAviso('Primero yapea el delivery a Pidemás y envía la captura.');
        document.querySelector(`.x-delPay[data-del="${CSS.escape(String(id))}"]`)?.scrollIntoView({behavior:'smooth',block:'center'});return}
      return conf.apply(this,arguments);
    };
  },300);
})();
