/* Etapa 2 · El negocio acepta con tiempo de preparación (después de que Administración confirma). */
(function(){
  if(window.__pdFlowNeg)return; window.__pdFlowNeg=true;
  window.__pdxT=window.__pdxT||{};
  window.pdxTiempo=function(id,m){
    window.__pdxT[id]=m;
    const card=document.querySelector(`[data-order="${CSS.escape(String(id))}"]`);
    card&&card.querySelectorAll('.x-tChips button').forEach(b=>b.classList.toggle('on',b.textContent.trim()===m+' min'));
  };
  window.__pdxP=window.__pdxP||{};
  window.pdxPago=function(id,k){
    window.__pdxP[id]=k;
    const card=document.querySelector(`[data-order="${CSS.escape(String(id))}"]`);
    card&&card.querySelectorAll('.x-pChips button').forEach(b=>b.classList.toggle('on',b.dataset.p===k));
  };
  window.pdxConfirmar=async function(id){
    const o=(typeof businessOrders!=='undefined'?businessOrders:[]).find(x=>String(x.id)===String(id));if(!o)return;
    const pago=window.__pdxP[id];
    if(!pago){show($('businessOrdersMsg'),'Primero coordina el pago con el cliente y elige cómo quedó.');document.querySelector(`[data-order="${CSS.escape(String(id))}"] .x-pChips`)?.scrollIntoView({behavior:'smooth',block:'center'});return}
    const min=window.__pdxT[id]||15,now=new Date().toISOString();
    if(pago==='yape_negocio'){const rr=(typeof restaurant!=='undefined'&&restaurant)||{};if(!rr.yape_qr_url){show($('businessOrdersMsg'),'Primero sube tu QR de Yape: el motorizado se lo mostrará al cliente para que pague.');if(typeof window.pdNegYape==='function')window.pdNegYape();return}}
    const txt={efectivo:'el motorizado cobrará todo en efectivo',yape:'el motorizado cobrará todo con Yape (QR)',yape_negocio:'el motorizado cobrará todo con TU QR de Yape (el dinero llega a tu cuenta) y luego Pidemás te cobrará el delivery',solo_delivery:'el motorizado cobrará solo el delivery',pagado:'el motorizado no cobrará nada (tú ya pagaste el delivery a Pidemás)'}[pago];
    if(!(await pdConfirmar('¿Confirmas el pedido? Se enviará a Pidemás para asignar motorizado y '+txt+'.')))return;
    const patch={estado:'confirmado',pago_acordado:pago,metodo_pago:pago==='yape_negocio'?'yape':pago==='pagado'?(o.metodo_pago||'yape'):pago==='solo_delivery'?(String(o.metodo_pago||'').toLowerCase()==='efectivo'?'efectivo':'yape'):pago,pago_confirmado:pago==='pagado',pago_negocio_confirmado:true,pago_negocio_confirmado_en:now,negocio_aceptado_en:now,tiempo_preparacion_min:min};
    if(pago==='pagado'&&window.__pdxCap&&window.__pdxCap[id])patch.observaciones=[o.observaciones||'','DELIVERY PAGADO POR EL NEGOCIO A PIDEMÁS (captura enviada por WhatsApp)'].filter(Boolean).join(' | ');
    await updateBusinessOrder(id,patch,'Pedido confirmado y enviado a Pidemás. Prepáralo: estará listo en '+min+' min.');
  };
  window.pdxAceptar=async function(id){
    const min=window.__pdxT[id]||15;
    if(typeof updateBusinessOrder!=='function')return;
    await updateBusinessOrder(id,{negocio_aceptado_en:new Date().toISOString(),tiempo_preparacion_min:min},'Pedido aceptado. El motorizado y el cliente verán que estará listo en '+min+' min.');
  };
})();
