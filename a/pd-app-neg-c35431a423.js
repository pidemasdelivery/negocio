/* ===== Pidemás · Negocio · app nueva =====
   Todo el panel del negocio (Inicio, Pedidos, Productos, Perfil y sus páginas) como páginas completas
   dentro de una caja aislada (Shadow DOM), con el diseño del pedido por pasos. Sin ventanas encima.
   Usa los datos y las acciones de la app de siempre. */
(function(){
  if(window.__pdAppNeg||!window.PdPasos)return;window.__pdAppNeg=1;
  const U=PdPasos.util,E=U.E,M=U.money;
  const $=id=>document.getElementById(id);
  const R=()=>{try{return restaurant}catch(e){return null}};
  const PR=()=>{try{return Array.isArray(products)?products:[]}catch(e){return []}};
  const CT=()=>{try{return Array.isArray(categories)?categories:[]}catch(e){return []}};
  const BO=()=>{try{return Array.isArray(businessOrders)?businessOrders:[]}catch(e){return []}};
  const D=()=>{try{return db}catch(e){return window.db}};
  const est=o=>String(o?.estado||'').toLowerCase().trim();
  const T=v=>v?new Date(v).getTime()||0:0;
  const subt=o=>{const s=Number(o.subtotal);if(Number.isFinite(s))return s;const t=Number(o.total),d=Number(o.costo_delivery);return Number.isFinite(t)?t-(Number.isFinite(d)?d:0):0};
  const ref=U.ref,hora=U.hora;
  const diaLima=t=>new Date(t).toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const fecha=t=>{if(!t)return '';const d=new Date(t);return diaLima(d)===diaLima(Date.now())?'Hoy '+hora(d):d.toLocaleDateString('es-PE',{day:'2-digit',month:'short',timeZone:'America/Lima'}).replace('.','')+' · '+hora(d)};
  const aviso=t=>(window.pdAviso||alert)(t);
  const exito=t=>{if(window.pdExito)window.pdExito(t);else aviso(t)};
  const confirmar=t=>window.pdConfirmar?window.pdConfirmar(t):Promise.resolve(confirm(t));

  /* Eliminar una categoría: el usuario elige si borra también sus productos */
  window.pdElegirBorrarCat=function(nombre,n){
    const Es=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    if(window.pdVentana)return window.pdVentana({ic:'mal',titulo:'¿Eliminar la categoría «'+nombre+'»?',
      html:n?`<p>Tiene <b style="color:#1F1A17">${n} producto${n===1?'':'s'}</b>. Si no marcas la casilla, ${n===1?'se queda':'se quedan'} en tu carta sin categoría.</p><label style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid #F1E4DA;cursor:pointer;font-size:15px;font-weight:700"><input type="checkbox" id="pdCatTodo" style="width:22px;height:22px;accent-color:#B42318;flex:0 0 auto;margin:0">Borrar también ${n===1?'su producto':'sus '+n+' productos'}</label>`:'',
      botones:[{k:'',t:'Cancelar'},{k:'si',t:'Sí, continuar',c:'r'}],cancelar:false,
      valor:(k,r)=>k==='si'?(r.getElementById('pdCatTodo')&&r.getElementById('pdCatTodo').checked?'todo':'solo'):null});
    return Promise.resolve(confirm('¿Eliminar la categoría «'+nombre+'»?')?'solo':null)};
  window.pdElegirBorrarCatViejo=function(nombre,n){return new Promise(res=>{
    const Es=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const w=document.createElement('div');w.className='pdfxPregunta';w.setAttribute('data-pd-aislado','1');
    w.setAttribute('style','position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(31,26,23,.4);padding:16px;box-sizing:border-box;font-family:Inter,system-ui,sans-serif');
    const bt='width:100%;min-height:52px;border-radius:14px;font:800 16px Inter,system-ui,sans-serif;padding:10px 14px;cursor:pointer;';
    w.innerHTML=`<div role="dialog" aria-modal="true" style="width:100%;max-width:420px;background:#fff;border-radius:22px;padding:20px 16px 14px;box-shadow:0 14px 40px rgba(31,26,23,.25);display:flex;flex-direction:column;gap:10px;text-align:center">
      <span style="width:52px;height:52px;border-radius:50%;background:#FDE8E8;color:#B42318;display:flex;align-items:center;justify-content:center;margin:0 auto"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></span>
      <b style="font-size:19px;line-height:1.3;color:#1F1A17">Eliminar «${Es(nombre)}»</b>
      <div style="font-size:15px;line-height:1.45;color:#6B5E55">${n?`Esta categoría tiene <b style="color:#1F1A17">${n} producto${n===1?'':'s'}</b>. ¿Qué quieres hacer con ${n===1?'él':'ellos'}?`:'Esta categoría no tiene productos.'}</div>
      ${n?`<button type="button" data-r="todo" style="${bt}border:0;background:#B42318;color:#fff">${n===1?'Borrar la categoría y su producto':'Borrar la categoría y sus '+n+' productos'}</button>
      <button type="button" data-r="solo" style="${bt}border:1px solid #F1E4DA;background:#fff;color:#1F1A17">Borrar solo la categoría<br><span style="font-weight:600;font-size:13px;color:#6B5E55">Los productos se quedan, sin categoría</span></button>`
      :`<button type="button" data-r="solo" style="${bt}border:0;background:#B42318;color:#fff">Sí, eliminar</button>`}
      <button type="button" data-r="" style="${bt}border:0;background:transparent;color:#6B5E55;font-weight:700">Cancelar</button></div>`;
    const fin=v=>{w.remove();res(v||null)};w.addEventListener('click',e=>{const x=e.target.closest('[data-r]');if(x)fin(x.dataset.r);else if(e.target===w)fin(null)});
    document.body.appendChild(w);
  })};
  function preguntaDel(t){if(window.pdVentana){const [a,...b]=String(t||'').split('\n');const Es=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return window.pdVentana({ic:'mal',titulo:a,html:b.length?'<p style="white-space:pre-line">'+Es(b.join('\n'))+'</p>':'',botones:[{k:'1',t:'Eliminar',c:'r'}]}).then(v=>v==='1')}return new Promise(res=>{
    const [a,...b]=String(t||'').split('\n');const w=document.createElement('div');w.className='pdfxPregunta';w.setAttribute('data-pd-aislado','1');
    w.setAttribute('style','position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-end;justify-content:center;background:rgba(31,26,23,.28);font-family:Inter,system-ui,sans-serif');
    w.innerHTML=`<div role="dialog" aria-modal="true" style="width:100%;max-width:560px;margin:12px;background:#fff;border-radius:22px;padding:20px 18px 16px;box-shadow:0 14px 40px rgba(31,26,23,.25);display:flex;flex-direction:column;gap:12px"><b style="font-size:19px;line-height:1.3;color:#1F1A17">${E(a)}</b>${b.length?`<div style="font-size:15px;line-height:1.5;color:#6B5E55;white-space:pre-line">${E(b.join('\n'))}</div>`:''}<div style="display:flex;gap:10px;margin-top:4px"><button type="button" data-r="0" style="flex:1;height:52px;border-radius:14px;border:1px solid #F1E4DA;background:#fff;font:700 16px Inter,system-ui,sans-serif;color:#1F1A17">Cancelar</button><button type="button" data-r="1" style="flex:1;height:52px;border-radius:14px;border:0;background:#C4410C;color:#fff;font:800 16px Inter,system-ui,sans-serif">Sí, eliminar</button></div></div>`;
    const fin=v=>{w.remove();res(v)};w.addEventListener('click',e=>{const x=e.target.closest('[data-r]');if(x)fin(x.dataset.r==='1');else if(e.target===w)fin(false)});
    document.body.appendChild(w);setTimeout(()=>{const x=w.querySelector('[data-r="1"]');x&&x.focus()},30);
  })}

  const wa=u=>{if(typeof window.pdOpenWhatsApp==='function')window.pdOpenWhatsApp(u);else window.open(u,'_blank')};
  const adminTel=()=>{let ph='986233533';try{const c=typeof window.pdYapeCfg==='function'?window.pdYapeCfg():null;if(c&&c.whatsapp_admin)ph=String(c.whatsapp_admin)}catch(_){}ph=ph.replace(/\D/g,'');return ph.length===9?'51'+ph:ph};
  const stk=p=>{try{return typeof stockCol==='function'?stockCol(p):(p&&'stock' in p?'stock':null)}catch(e){return null}};
  const S=d=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  const IC={
    home:S('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),box:S('<path d="M4 7h16v13H4z"/><path d="M4 7l2-3h12l2 3"/><path d="M9 11h6"/>'),
    layers:S('<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/>'),user:S('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    bell:S('<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7"/><path d="M10 20a2 2 0 0 0 4 0"/>'),help:S('<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><path d="M12 17.5v.01"/>'),
    chev:S('<path d="M9 6l6 6-6 6"/>'),clock:S('<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3 2"/>'),chart:S('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    star:S('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),refresh:S('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
    pause:S('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'),play:S('<path d="M7 5l12 7-12 7z"/>'),
    ban:S('<circle cx="12" cy="12" r="9.5"/><path d="M5.5 5.5l13 13"/>'),cash:S('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
    qr:S('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h7v-4"/>'),
    store:S('<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 11v9h14v-9"/>'),
    link:S('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    copy:S('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
    eye:S('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    tag:S('<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),cup:S('<path d="M6 4h12l-1.5 16h-9z"/><path d="M5.5 9h13"/>'),
    lock:S('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),sound:S('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
    plus:S('<path d="M12 5v14M5 12h14"/>'),minus:S('<path d="M5 12h14"/>'),back:S('<path d="M15 18l-6-6 6-6"/>'),check:S('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    camera:S('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),logout:S('<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>'),
    up:S('<path d="M12 19V5M6 11l6-6 6 6"/>'),down:S('<path d="M12 5v14M6 13l6 6 6-6"/>'),trash:S('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    edit:S('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),search:S('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),doc:S('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>'),
    pin:S('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),moto:S('<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-3-7h4l2 7M12 10L10 6H7"/>')
  };
  /* ===== Tarjetas de pedido (diseño C): en curso grandes con avance y motorizado; terminados en filas ===== */
  const C_SV={'Compra':['#E1F1E6','#1F6F43','<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'],'Recojo y entrega':['#FDEBDF','#C4410C','<path d="M4 8h14l-4-4"/><path d="M20 16H6l4 4"/>'],'Encomienda':['#E2ECF8','#1D4F91','<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'],'Negocio':['#F1E8FA','#6D3FA0','<path d="M3 10l1.5-5h15L21 10"/><path d="M4 10v10h16V10"/><path d="M9 20v-6h6v6"/>']};
  const cSvg=(d,s)=>`<svg viewBox="0 0 24 24" width="${s||14}" height="${s||14}" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const cTel=t=>{const d=String(t||'').replace(/\D/g,'');return d?(d.length===9?'51'+d:d):''};
  const C_CSS=`
.oC{display:flex;flex-direction:column;gap:12px;width:100%;box-sizing:border-box;text-align:left;color:#1F1A17;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:22px;padding:16px;cursor:pointer;box-shadow:0 8px 22px rgba(31,26,23,.06)}
.oC.a{border:1.5px solid #C4410C}.oC.cNw{border:2px solid #C4410C;animation:cLate 1.6s ease-out infinite}
@keyframes cLate{0%{box-shadow:0 0 0 0 rgba(196,65,12,.45),0 8px 22px rgba(31,26,23,.06)}100%{box-shadow:0 0 0 12px rgba(196,65,12,0),0 8px 22px rgba(31,26,23,.06)}}
@media (prefers-reduced-motion:reduce){.oC.cNw{animation:none;box-shadow:0 0 0 4px rgba(196,65,12,.25)}}.oC.sl2{border:1.5px solid #C4410C;background:#FFF4EC}
.oC .cTp{display:flex;align-items:center;gap:8px;min-width:0}
.oC .cCh{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 11px;border-radius:999px;font-size:13px;font-weight:800;white-space:nowrap;min-width:0;overflow:hidden;flex:0 1 auto}.oC .cCh span{overflow:hidden;text-overflow:ellipsis}.oC .cCh svg{flex:0 0 auto}
.oC .cCod{font-size:12.5px;font-weight:800;color:#6B5E55;letter-spacing:.02em;margin-bottom:2px}
.oC .cPr{margin-left:auto;font-size:20px;font-weight:800;letter-spacing:-.01em;white-space:nowrap;flex:0 0 auto}
.oC .cNm{font-size:18px;font-weight:800;letter-spacing:-.01em;line-height:1.25;overflow-wrap:anywhere}
.oC .cDr{font-size:14px;color:#6B5E55;margin-top:2px;line-height:1.35;overflow-wrap:anywhere}
.oC .cStp{display:grid;gap:6px}
.oC .cStp>span{display:flex;flex-direction:column;gap:6px;min-width:0}
.oC .cStp i{height:5px;border-radius:3px;background:#EFE5DD}
.oC .cStp small{font-size:11px;font-weight:700;color:#8A7B71;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oC .cStp .d i{background:#15803D}.oC .cStp .d small{color:#0F5E2E}
.oC .cStp .a i{background:#C4410C}.oC .cStp .a small{color:#9A330A}
.oC .cFt{display:flex;align-items:center;gap:10px;padding-top:12px;border-top:1px solid #F4EBE4}
.oC .cMo{flex:0 0 36px;width:36px;height:36px;border-radius:18px;background:#F6EFE9;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#6B5E55}
.oC .cMt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}.oC .cMt b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.oC .cMt span{font-size:12px;color:#6B5E55}
.oC .cIk{flex:0 0 44px;width:44px;height:44px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;text-decoration:none}
.oC .cIk.g{background:#15803D;border-color:#15803D;color:#FFFFFF}
.oC .sel{flex:0 0 26px}
.oC .cAv{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:14px;background:#FDEBDF;color:#9A330A;font-size:14px;font-weight:800}.oC .cAv i{width:8px;height:8px;border-radius:4px;background:#C4410C}.oC .cAv em{margin-left:auto;font-style:normal;font-weight:700}
.oR{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:12px 14px;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:16px;text-align:left;font:inherit;color:#1F1A17;min-height:62px;cursor:pointer}
.oR.sl2{border:1.5px solid #C4410C;background:#FFF4EC}
.oR .cOk{flex:0 0 32px;width:32px;height:32px;border-radius:16px;background:#E9F6EE;color:#15803D;display:flex;align-items:center;justify-content:center}
.oR .cOk.no{background:#FDE8E8;color:#B42318}
.oR .cMd{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}.oR .cMd b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.oR .cMd span{font-size:13px;color:#6B5E55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oR .cMd i{font-style:normal;font-size:12.5px;font-weight:800;color:#6B5E55;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oR em{font-style:normal;font-weight:800;font-size:15px;white-space:nowrap}
.oSec{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:800;letter-spacing:.08em;color:#6B5E55;margin:6px 4px 0;text-transform:uppercase}
`;
  /* d: {id,ref,sv,neg,precio,cliente,dir,hace,fase:{n,k,txt},pasos:[5 textos],moto:{nombre,tel,rol},sel:html,arriba:html,abajo:html,act:bool,attr} */
  function cGrande(d){
    const c=C_SV[d.sv]||C_SV['Negocio'];
    const bars=(d.pasos||[]).map((t,i)=>{const k=i+1,n=d.fase.n;const cl=n===0?'':(k<n||n>=d.pasos.length)?'d':k===n?'a':'';return `<span class="${cl}"><i></i><small>${E(t)}</small></span>`}).join('');
    const m=d.moto||null,mt=m&&cTel(m.tel);
    return `<div class="oC${d.act?' a':''}${d.nuevo?' cNw':''}${d.marcado?' sl2':''}" ${d.attr||''} role="button" tabindex="0">${d.arriba||''}
      <div class="cTp">${d.sel||''}<span class="cCh" style="background:${c[0]};color:${c[1]}">${cSvg(c[2])}<span>${E(d.neg||d.sv)}</span></span><span class="cPr">${E(d.precio)}</span></div>
      <div><div class="cCod">${E(d.ref)}${d.hace?' · '+E(d.hace):''}</div><div class="cNm">${E(d.cliente||'Cliente')}</div>${d.dir?`<div class="cDr">${E(d.dir)}</div>`:''}</div>
      ${d.pasos&&d.fase.n?`<div class="cStp" style="grid-template-columns:repeat(${d.pasos.length},minmax(0,1fr))" aria-label="Avance: ${E(d.fase.txt||'')}">${bars}</div>`:''}
      ${m&&m.nombre?`<div class="cFt"><span class="cMo">${E(String(m.nombre).trim().charAt(0).toUpperCase())}</span><span class="cMt"><b>${E(m.nombre)}</b><span>${E(m.rol||'Motorizado')}</span></span>${mt?`<a class="cIk" data-lnk href="tel:+${mt}" aria-label="Llamar a ${E(m.nombre)}">${cSvg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',20)}</a><a class="cIk g" data-lnk href="https://wa.me/${mt}" target="_blank" rel="noopener" aria-label="WhatsApp a ${E(m.nombre)}">${cSvg('<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/>',20)}</a>`:''}</div>`:''}${d.abajo||''}</div>`;
  }
  function cFila(d){
    const no=d.fase.k==='no';
    return `<button type="button" class="oR${d.marcado?' sl2':''}" ${d.attr||''}>${d.sel||`<span class="cOk${no?' no':''}">${no?cSvg('<path d="M6 6l12 12M18 6L6 18"/>',16):cSvg('<path d="M5 12l5 5L19 7"/>',16)}</span>`}<span class="cMd"><i>${E([d.ref,d.cuando].filter(Boolean).join(' · '))}</i><b>${E(d.cliente||'Cliente')}</b><span>${E([d.neg||d.sv,d.moto&&d.moto.nombre?String(d.moto.nombre).split(' ')[0]:''].filter(Boolean).join(' · '))}</span></span><em>${E(d.precio)}</em></button>`;
  }
  const cPasos=(sv,neg)=>['Recibido','Asignado',sv==='Compra'?'Compra':neg?'En el local':'Recojo','En camino','Entregado'];
  const ESTILO=PdPasos.css+C_CSS+`
:host{z-index:2147482000}
.app{animation:none}
.hd{background:#FFFFFF;border-bottom:1px solid #F1E4DA;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 14px;display:flex;align-items:center;gap:12px;flex:0 0 auto}
.ib{position:relative;width:44px;height:44px;flex:0 0 44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;padding:0;cursor:pointer}
.bd{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#C4410C;color:#FFFFFF;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-sizing:border-box}
.ava{flex:0 0 48px;width:48px;height:48px;border-radius:50%;background:#FDEBDF center/cover no-repeat;color:#C4410C;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}
.dsp{display:flex;align-items:center;gap:12px;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA}
.dsp .pt{flex:0 0 12px;width:12px;height:12px;border-radius:50%;background:#15803D;box-shadow:0 0 0 5px rgba(21,128,61,.15)}
.dsp.off .pt{background:#A8988C;box-shadow:0 0 0 5px rgba(168,152,140,.18)}
.dsp .bt{height:40px;padding:0 12px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;cursor:pointer}
.dsp .bt svg{color:#C4410C;width:18px;height:18px}
.oc{display:block;width:100%;text-align:left;color:#1F1A17;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:18px;padding:14px;cursor:pointer;display:flex;flex-direction:column;gap:10px}
.oc.a{border:1.5px solid #C4410C;box-shadow:0 6px 18px rgba(196,65,12,.10)}
.oc .r1{display:flex;align-items:center;gap:8px}.oc .r1 b{font-size:17px}.oc .r1 small{font-size:12px;font-weight:700;color:#6B5E55;text-transform:uppercase;letter-spacing:.05em}.oc .r1 em{margin-left:auto;font-style:normal;font-size:18px;font-weight:800;color:#1F1A17}
.oc .pls{display:flex;gap:8px;flex-wrap:wrap}
.pl{display:inline-flex;align-items:center;height:28px;padding:0 10px;border-radius:999px;background:#FDEBDF;color:#9A330A;font-size:13px;font-weight:800}
.pl.n{background:#FFFFFF;border:1px solid #F1E4DA;color:#1F1A17;font-weight:700}.pl.g{background:#E9F6EE;color:#0F5E2E}
.oc .bars{display:grid;gap:6px}
.oc .ad{display:flex;gap:10px;align-items:flex-start}.oc .ad svg{color:#C4410C;flex:0 0 20px;width:20px;height:20px}.oc .ad b{display:block;font-size:15px}.oc .ad span{font-size:14px;color:#6B5E55}
.kick{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#C4410C}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mt{text-align:left;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;display:flex;flex-direction:column;gap:4px;color:#1F1A17;cursor:pointer}
.mt span{font-size:13px;font-weight:600;color:#6B5E55}.mt b{font-size:24px;color:#1F1A17}.mt small{font-size:12px;color:#6B5E55}
.tl{display:flex;gap:12px;align-items:center;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;color:#1F1A17;cursor:pointer;width:100%;text-align:left}
.tl .ic{flex:0 0 44px;width:44px;height:44px;border-radius:12px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center}
.tl .tx{flex:1 1 0%;min-width:0;display:flex;flex-direction:column;gap:2px}.tl .tx b{font-size:16px}.tl .tx span{font-size:13px;color:#6B5E55}
.tl>svg{color:#6B5E55;flex:0 0 auto}
.seg{display:grid;gap:4px;padding:4px;border-radius:14px;background:#F6EFE9}
.seg button{height:40px;border-radius:10px;border:0;background:transparent;color:#6B5E55;font-size:14px;font-weight:600;cursor:pointer}
.seg button.on{background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.10);color:#1F1A17;font-weight:800}
.vac{padding:28px 16px;text-align:center;color:#6B5E55;font-size:15px;border-radius:18px;border:1px dashed #E3CFC2;background:#FFFFFF}
.nv{flex:0 0 auto;display:flex;background:#FFFFFF;border-top:1px solid #F1E4DA;padding:2px 6px calc(env(safe-area-inset-bottom,0px) + 8px)}
.nv button{position:relative;flex:1 1 0%;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 0 4px;border:0;background:transparent;color:#6B5E55;font-size:12px;font-weight:600;cursor:pointer}
.nv button span.i{width:52px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center}
.nv button.on{color:#C4410C;font-weight:800}.nv button.on span.i{background:#FDEBDF}
.nv .bd{top:2px;right:calc(50% - 26px)}
.gps{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:14px;background:#FDE8E8;color:#9B1C1C;font-size:14px;font-weight:700}
.gps button{margin-left:auto;height:36px;padding:0 12px;border-radius:10px;border:0;background:#C4410C;color:#FFFFFF;font-weight:800;cursor:pointer}

.back2{width:44px;height:44px;flex:0 0 44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;padding:0;cursor:pointer}
.fld{display:flex;flex-direction:column;gap:6px}.fld label{font-size:14px;font-weight:700}
.fld input,.fld select{width:100%;height:54px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFFFFF;padding:0 16px;font:600 16px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;outline:none;box-sizing:border-box;-webkit-appearance:none;appearance:none}
.fld input:focus,.fld select:focus{border-color:#C4410C}
.mv{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #F1E4DA}.mv:last-child{border-bottom:0}
.mv .ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center}
.mv .tx{flex:1 1 0%;min-width:0}.mv .tx b{display:block;font-size:15px;overflow-wrap:anywhere}.mv .tx span{font-size:13px;color:#6B5E55}
.mv .am{font-size:16px;font-weight:800;white-space:nowrap}
.g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.kp{padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;display:flex;flex-direction:column;gap:2px}
.kp span{font-size:13px;color:#6B5E55;font-weight:600}.kp b{font-size:22px}.kp small{font-size:12px;color:#6B5E55}
.cd{background:#FFFFFF;border:1px solid #F1E4DA;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px}
.cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.slc{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}.slc>small{text-align:center;font-size:12px;font-weight:800;color:#6B5E55;padding:2px 0}.slc>div{min-height:60px;height:auto;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px 1px;font:inherit;min-width:0}.slc>div b{font-size:17px;font-weight:800;line-height:1.1}.slc>div small{font-size:10px;font-weight:700;color:#6B5E55;line-height:1.1;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.slc>div em{font-style:normal;font-size:9px;font-weight:800;color:#9A330A;background:#FDEBDF;border-radius:6px;padding:1px 3px;max-width:100%;overflow:hidden;white-space:nowrap}.slc .trabajado,.slc .ajuste{background:#E9F6EE;border-color:#CDEBD7}.slc .trabajado small,.slc .ajuste small{color:#0F5E2E}.slc .descanso{background:#FFF4EC;border-color:#F6D9C4}.slc .descanso small{color:#9A330A}.slc .falta{background:#FDE8E8;border-color:#F4C7C3}.slc .falta small,.slc .falta b{color:#9B1C1C}.slc .hoy{border:2px solid #C4410C}.slc .hoy small{color:#C4410C}.slc .libre,.slc .antes,.slc .dia31,.slc .ajusteFuturo{background:#F6EFE9;color:#9C8F86}.slc .adel{box-shadow:inset 0 0 0 2px #15803D}.slc>div{position:relative}.slc .vacp{background:#EAF1FE;border-color:#C9DBFB}.slc .vacp small,.slc .vacp b{color:#1D4ED8}.slc .vacn small{color:#9B1C1C}
.cal div{display:flex;flex-direction:column;align-items:center;gap:3px}.cal small{font-size:11px;color:#6B5E55;font-weight:700}
.cal i{width:100%;max-width:40px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12px;font-weight:800;background:#F6EFE9;color:#6B5E55}
.cal i.t{background:#E9F6EE;color:#0F5E2E}.cal i.r{background:#FDEBDF;color:#9A330A}.cal i.f{background:#FDE8E8;color:#9B1C1C}.cal i.h{background:#FFFFFF;border:1.5px solid #C4410C;color:#C4410C}
.ley{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:#6B5E55}
.bar{height:10px;border-radius:999px;background:#F6EFE9;overflow:hidden}.bar s{display:block;height:100%;background:#C4410C;border-radius:999px}
.stars{color:#C4410C;letter-spacing:2px;font-size:16px}
.cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.stop{display:flex;gap:12px;align-items:center;padding:12px 14px;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:16px}
.stop .n{flex:0 0 30px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;background:#C4410C;color:#FFFFFF}
.stop .tg{display:inline-flex;height:22px;align-items:center;padding:0 8px;border-radius:999px;font-size:12px;font-weight:800}
.ph{display:flex;gap:14px;align-items:center;padding:16px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA}
.ph .ava{flex:0 0 64px;width:64px;height:64px;font-size:26px}
.chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}
.chips button{flex:0 0 auto;height:38px;padding:0 14px;border-radius:999px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:14px;font-weight:700;cursor:pointer}
.chips button.on{border:0;background:#C4410C;color:#FFFFFF}
.av2{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;text-align:left;width:100%;color:#1F1A17}
.av2 .ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#FDEBDF;color:#C4410C}
.av2 .tx{flex:1 1 0%;min-width:0}.av2 .tx b{display:block;font-size:15px}.av2 .tx span{display:block;font-size:14px;color:#6B5E55;margin-top:2px;line-height:1.4}.av2 .tx small{display:block;font-size:12px;color:#6B5E55;margin-top:6px;font-weight:600}
.av2 .pt{flex:0 0 10px;width:10px;height:10px;border-radius:50%;background:#C4410C;margin-top:6px}
.list{scrollbar-width:none}.list::-webkit-scrollbar{display:none}
.opt span{font-size:13px;color:#6B5E55}
.msgok{padding:10px 12px;border-radius:12px;background:#E9F6EE;color:#0F5E2E;font-size:14px;font-weight:700}
.load{padding:24px;text-align:center;color:#6B5E55;font-size:15px}
`+`
:host{z-index:2147482000}
textarea.ta{width:100%;min-height:96px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFFFFF;padding:12px 16px;font:500 16px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;outline:none;box-sizing:border-box;resize:vertical}
textarea.ta:focus{border-color:#C4410C}
.fld input[type=time]{padding:0 12px}
.sw{position:relative;flex:0 0 52px;width:52px;height:32px;border-radius:999px;border:0;background:#EADFD6;cursor:pointer;padding:0;transition:background .2s}
.sw::after{content:"";position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.25);transition:transform .2s}
.sw.on{background:#C4410C}.sw.on::after{transform:translateX(20px)}.sw[disabled]{opacity:.5}
.swr{display:flex;align-items:center;gap:12px}.swr .tx{flex:1 1 0%;min-width:0}.swr .tx b{display:block;font-size:15px}.swr .tx span{display:block;font-size:13px;color:#6B5E55;margin-top:2px;line-height:1.4}
.pr{display:flex;gap:12px;align-items:center;padding:12px;border-radius:16px;background:#FFFFFF;border:1px solid #F1E4DA}
.pr.off{background:#FBF7F4}
.pr .pi{flex:0 0 56px;width:56px;height:56px;border-radius:12px;background:#FDEBDF center/cover no-repeat;color:#C4410C;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800}
.pr.off .pi{filter:grayscale(1);opacity:.6}
.pr .tx{flex:1 1 0%;min-width:0;background:transparent;border:0;padding:0;text-align:left;color:#1F1A17;cursor:pointer;display:flex;flex-direction:column;gap:3px}
.pr .tx b{font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pr .tx span{font-size:15px;font-weight:800}
.pr .tx small{font-size:12px;color:#6B5E55;font-weight:600}
.pl.r{background:#FDE8E8;color:#9B1C1C}
.cat{display:flex;align-items:center;gap:8px;margin-top:6px}.cdel{font-size:0;overflow:hidden;width:36px;height:36px;flex:0 0 36px;border-radius:10px;border:1px solid #F5C9C2;background:#FFF;color:#B42318;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}.cdel svg{width:17px;height:17px}.cat .lbl{margin:0;flex:1 1 0%}.cat small{font-size:12px;color:#6B5E55;font-weight:700}
.foto{display:flex;gap:14px;align-items:center;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA}
.foto .pi{flex:0 0 88px;width:88px;height:88px;border-radius:14px;background:#FDEBDF center/cover no-repeat;color:#C4410C;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800}
.foto .bs{display:flex;flex-direction:column;gap:8px;flex:1 1 0%;min-width:0}
.cf{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) 44px;gap:8px;align-items:center}
.cf input{height:48px!important;font-size:15px!important}
.cf button{height:44px;width:44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#B42318;font-size:20px;cursor:pointer}
.step{display:grid;grid-template-columns:54px minmax(0,1fr) 54px;gap:8px}
.step button{height:54px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;display:flex;align-items:center;justify-content:center;cursor:pointer}
.step input{text-align:center}
.dia{display:grid;grid-template-columns:56px minmax(0,1fr) 14px minmax(0,1fr);gap:8px;align-items:center}
.dia>button{height:48px;border-radius:12px;border:1px solid #F1E4DA;background:#F6EFE9;color:#6B5E55;font-size:14px;font-weight:800;cursor:pointer}
.dia.on>button{border:0;background:#C4410C;color:#FFFFFF}
.dia input{height:48px;border-radius:12px;border:1.5px solid #F1E4DA;background:#FFFFFF;padding:0 6px;text-align:center;font:700 14px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;min-width:0;width:100%;box-sizing:border-box}
.dia:not(.on) input{opacity:.35;pointer-events:none}
.dia input::-webkit-calendar-picker-indicator{display:none}
.dia input::-webkit-datetime-edit{padding:0}
.dia span{text-align:center;color:#6B5E55;font-size:13px}
.dia.hoy>button{box-shadow:0 0 0 2px #FFFFFF,0 0 0 4px #C4410C}
.url{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 14px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFF9F5}
.url span{flex:1 1 0%;min-width:0;font-size:14px;font-weight:600;color:#1F1A17;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.url button{height:40px;padding:0 14px;border-radius:10px;border:0;background:#C4410C;color:#FFFFFF;font-size:14px;font-weight:800;cursor:pointer}
.url button.ok{background:#15803D}
.qrbox{display:flex;align-items:center;justify-content:center;min-height:200px;border-radius:18px;background:#FFFFFF;border:1px dashed #E3CFC2;color:#6B5E55;font-size:15px;overflow:hidden}
.qrbox img{max-width:220px;max-height:220px;display:block}
.hrs{display:grid;gap:6px}.hrs div{display:grid;grid-template-columns:52px minmax(0,1fr) 28px;gap:8px;align-items:center;font-size:13px;color:#6B5E55}.hrs b{color:#1F1A17;text-align:right}
.hrs i{display:block;height:10px;border-radius:999px;background:#F6EFE9;overflow:hidden}.hrs s{display:block;height:100%;background:#C4410C;border-radius:999px}
.rojo{color:#B42318!important;border-color:#F4C7C3!important}
::slotted(*){display:block}
`;

  const ESTILO_EXT=`
#pdnExt#pdnExt{display:flex!important;flex-direction:column!important;gap:10px!important;font-family:PdInter,Inter,system-ui,sans-serif!important;color:#1F1A17!important}
#pdnExt#pdnExt:empty{display:none!important}
#pdnExt .pvBox,#pdnExt .pdpBox{display:flex!important;flex-direction:column!important;gap:10px!important;margin:0!important;padding:14px!important;border-radius:18px!important;background:#FFFFFF!important;border:1px solid #F1E4DA!important;box-shadow:none!important}
#pdnExt .pvHead,#pdnExt .pdpHead{display:flex!important;align-items:center!important;gap:8px!important;margin:0!important}
#pdnExt .pvHead strong,#pdnExt .pdpHead strong{font-size:12px!important;font-weight:800!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#6B5E55!important}
#pdnExt .pvTag{display:inline-flex!important;align-items:center!important;height:24px!important;padding:0 10px!important;border-radius:999px!important;background:#FDEBDF!important;color:#9A330A!important;font-size:12px!important;font-weight:800!important;margin-left:auto!important}
#pdnExt .x-eLbl{display:flex!important;flex-direction:column!important;gap:6px!important;font-size:14px!important;font-weight:700!important;color:#1F1A17!important;margin:0!important}
#pdnExt input:not([type=file]){width:100%!important;height:54px!important;border-radius:14px!important;border:1.5px solid #F1E4DA!important;background:#FFFFFF!important;padding:0 14px!important;font:600 16px PdInter,Inter,system-ui,sans-serif!important;color:#1F1A17!important;box-shadow:none!important;outline:none!important;box-sizing:border-box!important;margin:0!important}
#pdnExt input:focus{border-color:#C4410C!important}
#pdnExt .pvHint,#pdnExt .pdpHint,#pdnExt .pvSum{margin:0!important;font-size:13px!important;line-height:1.45!important;color:#6B5E55!important;font-weight:500!important}
#pdnExt .pvFile{display:none!important}
#pdnExt .pvFotos{display:flex!important;flex-wrap:wrap!important;gap:8px!important}
#pdnExt .pvFoto{position:relative!important;width:72px!important;height:72px!important;border-radius:12px!important;overflow:hidden!important;border:1px solid #F1E4DA!important}
#pdnExt .pvFoto img{width:100%!important;height:100%!important;object-fit:cover!important}
#pdnExt .pvMain{position:absolute!important;left:4px!important;bottom:4px!important;padding:1px 6px!important;border-radius:999px!important;background:#C4410C!important;color:#FFFFFF!important;font-size:10px!important;font-weight:800!important}
#pdnExt .pvFoto button{position:absolute!important;top:4px!important;right:4px!important;width:24px!important;height:24px!important;border-radius:50%!important;border:0!important;background:#FFFFFF!important;color:#B42318!important;font-size:16px!important;line-height:1!important;padding:0!important}
#pdnExt .pvFotoAdd{width:72px!important;height:72px!important;border-radius:12px!important;border:1.5px dashed #E3CFC2!important;background:#FFF9F5!important;color:#C4410C!important;font-size:26px!important;font-weight:700!important;box-shadow:none!important}
#pdnExt .pvPresets{display:flex!important;flex-wrap:wrap!important;gap:8px!important}
#pdnExt .pvPresets button,#pdnExt .pvAdd{height:42px!important;padding:0 14px!important;border-radius:12px!important;border:1px solid #F1E4DA!important;background:#FFFFFF!important;color:#1F1A17!important;font:700 14px PdInter,Inter,system-ui,sans-serif!important;box-shadow:none!important;margin:0!important}
#pdnExt .pvAdd{width:100%!important;height:46px!important}
#pdnExt .pvRow{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 128px 40px!important;gap:6px!important;align-items:center!important}
#pdnExt .pvRow.one{grid-template-columns:minmax(0,1fr) 128px 40px!important}
#pdnExt .pvRow input{height:46px!important;font-size:15px!important;padding:0 10px!important}
#pdnExt .pvStep{display:grid!important;grid-template-columns:36px minmax(0,1fr) 36px!important;gap:4px!important}
#pdnExt .pvStep button,#pdnExt .pvDel{height:46px!important;border-radius:12px!important;border:1px solid #F1E4DA!important;background:#FFFFFF!important;color:#1F1A17!important;font-size:18px!important;padding:0!important;box-shadow:none!important;margin:0!important}
#pdnExt .pvStep input{text-align:center!important;padding:0 2px!important}
#pdnExt .pvDel{color:#B42318!important}
#pdnExt .pdpRow{display:flex!important;flex-direction:column!important;gap:6px!important}
#pdnExt .pdpRow b{font-size:14px!important;font-weight:700!important}
#pdnExt .pdpSeg{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:4px!important;padding:4px!important;border-radius:14px!important;background:#F6EFE9!important}
#pdnExt .pdpSeg button{min-height:40px!important;border-radius:10px!important;border:0!important;background:transparent!important;color:#6B5E55!important;font:600 13px PdInter,Inter,system-ui,sans-serif!important;padding:4px!important;box-shadow:none!important}
#pdnExt .pdpSeg button[aria-pressed=true]{background:#FFFFFF!important;color:#1F1A17!important;font-weight:800!important;box-shadow:0 1px 3px rgba(31,26,23,.10)!important}
#pdnExt .pdpSeg button[disabled]{opacity:.45!important}
`;
  /* ---------- estado ---------- */
  window.pdEnPagina=()=>!!sub||tab!=='inicio'||!!(window.PdPasos&&PdPasos.isOpen());
  let host=null,root=null,ext=null,tab='inicio',sub=null,seg='nuevos',key='',scrollMem={},tocando=false,ignorarPop=false;
  const C={};
  function cargar(k,fn,force){const c=C[k];if(c&&!force&&(c.busy||Date.now()-c.t<45000))return c;C[k]={busy:true,t:Date.now(),data:c&&c.data,err:null};
    Promise.resolve().then(fn).then(d=>{C[k]={t:Date.now(),data:d}},e=>{C[k]={t:Date.now(),data:c&&c.data,err:String(e&&e.message||e)}}).finally(()=>{key='';pintar()});return C[k]}
  const F={q:'',cat:'',prod:null,catEd:null,catNew:{n:'',d:''},perfil:null,hor:null,yape:null,desc:null,clave:{a:'',n:'',r:'',msg:'',ver:false},rep:7,av:'todos'};
  const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};

  /* ---------- pedidos ---------- */
  function etapa(o){
    const s=est(o)||'pendiente';
    if(s==='cancelado')return {k:'cancel',i:-1,txt:'Anulado'};
    if(s==='entregado')return {k:'done',i:4,txt:'Entregado'};
    const conf=s==='confirmado'||['asignado','aceptado','en_camino','en_entrega','pedido_aceptado','camino_recojo','camino_entrega','confirmando_pago'].includes(s);
    if(!conf)return {k:'nuevo',i:0,txt:'Nuevo · acéptalo'};
    if(o.pago_negocio_confirmado!==true)return {k:'cobrar',i:1,txt:'Coordina el pago'};
    if(o.listo_para_recojo!==true){const t=o.negocio_aceptado_en&&Number(o.tiempo_preparacion_min)>0?Math.round((T(o.negocio_aceptado_en)+Number(o.tiempo_preparacion_min)*60000-Date.now())/60000):null;return {k:'preparar',i:2,txt:t===null?'Prepáralo':t>0?'Listo en '+t+' min':'Ya pasó el tiempo'}}
    if(['en_camino','en_entrega','camino_entrega','confirmando_pago'].includes(s))return {k:'camino',i:3,txt:'Va al cliente'};
    if(o.en_local_en)return {k:'local',i:3,txt:'Motorizado en tu local'};
    if(['asignado','aceptado','pedido_aceptado','camino_recojo'].includes(s))return {k:'listo',i:3,txt:'Motorizado en camino'};
    return {k:'listo',i:3,txt:'Listo · esperando motorizado'};
  }
  const nuevos=()=>BO().filter(o=>etapa(o).k==='nuevo');
  const curso=()=>BO().filter(o=>!['nuevo','done','cancel'].includes(etapa(o).k));
  const hoyK=()=>diaLima(Date.now());
  const entHoy=()=>BO().filter(o=>est(o)==='entregado'&&diaLima(o.entregado_en||o.creado_en)===hoyK());
  const anuHoy=()=>BO().filter(o=>est(o)==='cancelado'&&diaLima(o.cancelado_en||o.creado_en)===hoyK());
  const efectivoHoy=()=>entHoy().reduce((s,o)=>{const pa=String(o.pago_acordado||'').toLowerCase();return String(o.metodo_pago||'').toLowerCase()==='efectivo'&&!['pagado','solo_delivery','yape'].includes(pa)?s+subt(o):s},0);
  const itemsTxt=o=>{const L=Array.isArray(o.detalle_pedidos)?o.detalle_pedidos:Array.isArray(o.items)?o.items:[];return L.slice(0,3).map(x=>(Number(x.cantidad)||1)+'× '+(x.nombre_producto||x.producto_nombre||x.nombre||'Producto')).join(' · ')+(L.length>3?' · +'+(L.length-3):'')};
  const pago=o=>/yape|plin|transfer/i.test(String(o.metodo_pago||''))?'Yape':String(o.metodo_pago||'').toLowerCase()==='efectivo'?'Efectivo':(o.metodo_pago||'');
  function tarjeta(o,dest){
    const e=etapa(o);const s=est(o);
    const hace=o.creado_en?Math.max(0,Math.round((Date.now()-T(o.creado_en))/60000)):null;
    const hTxt=hace==null?'':hace<1?'ahora':hace<60?'hace '+hace+' min':fecha(o.creado_en);
    const it=itemsTxt(o);
    const nv=e.k==='nuevo';/* pedido nuevo: aviso y botón para verlo y aceptarlo */
    const fin=e.k==='done'||e.k==='cancel';
    const d={ref:ref(o.id),sv:'Negocio',neg:pago(o)||'Pedido',precio:M(o.total),cliente:o.nombre_cliente||'Cliente',
      dir:it||(s==='cancelado'&&o.motivo_cancelacion?o.motivo_cancelacion:o.direccion_entrega||''),hace:nv?hTxt:e.txt,
      fase:{n:e.k==='done'?6:e.k==='cancel'?0:e.i+1,k:e.k==='done'?'ok':e.k==='cancel'?'no':'new',txt:e.txt},
      pasos:['Aceptar','Pago','Preparar','Recojo','Entregado'],
      moto:o.motorizado_nombre?{nombre:o.motorizado_nombre,tel:'',rol:'Motorizado'}:null,act:!!(dest||nv),attr:`data-o="${E(o.id)}"`,
      cuando:o.entregado_en?fecha(o.entregado_en):hTxt};
    if(fin)return cFila(d);
    if(nv){d.nuevo=1;d.arriba=`<div class="cAv"><i></i>Pedido nuevo · acéptalo para prepararlo<em>${E(hTxt)}</em></div>`;d.abajo=`<button type="button" class="b o" style="height:48px" data-o="${E(o.id)}">Ver y aceptar</button>`}
    return cGrande(d);
  }
  const top=(kick,title,right,back)=>`<div class="top"><div class="row">${back?`<button type="button" class="back2" data-a="volver" aria-label="Volver">${IC.back}</button>`:''}<div class="ttl"><div class="kick" style="color:#6B5E55">${E(kick)}</div><div class="h1">${E(title)}</div></div>${right||''}</div></div>`;
  const tl=(a,ic,t,s)=>`<button type="button" class="tl" data-a="${a}"><span class="ic">${ic}</span><span class="tx"><b>${t}</b><span>${s}</span></span>${IC.chev}</button>`;
  const fld=(id,l,k,v,o)=>{o=o||{};return `<div class="fld"><label for="${id}">${l}</label><input id="${id}" type="${o.t||'text'}" value="${E(v??'')}" data-in="${k}"${o.ph?` placeholder="${E(o.ph)}"`:''}${o.im?` inputmode="${o.im}"`:''}${o.max?` maxlength="${o.max}"`:''}${o.dis?' disabled':''}${o.ac?` autocomplete="${o.ac}"`:''}></div>`};
  const sw=(a,on,lbl,dis)=>`<button type="button" class="sw${on?' on':''}" data-a="${a}" role="switch" aria-checked="${!!on}" aria-label="${E(lbl)}"${dis?' disabled':''}></button>`;
  const ini=n=>E(String(n||'N').trim().charAt(0).toUpperCase()||'N');
  const logoDe=r=>r&&(r.logo_url||r.logo||r.imagen_logo_url||r.imagen_logo)||'';

  /* ---------- horario ---------- */
  const DIAS=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
  const KEYS=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  const DN={lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo'};
  const DC={lunes:'Lun',martes:'Mar',miercoles:'Mié',jueves:'Jue',viernes:'Vie',sabado:'Sáb',domingo:'Dom'};
  function lima(){const p={};new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()).forEach(x=>{if(x.type!=='literal')p[x.type]=x.value});return new Date(+p.year,+p.month-1,+p.day,(+p.hour)%24,+p.minute)}
  function parseH(raw){const o={};String(raw||'').split('|').forEach(part=>{const [d,h]=part.split('=');if(!d||!h)return;const [a,c]=h.split('-');if(/^\d{1,2}:\d{2}$/.test(a||'')&&/^\d{1,2}:\d{2}$/.test(c||''))o[d.trim()]=[a,c]});return o}
  const toMin=t=>{const m=String(t).match(/^(\d{1,2}):(\d{2})/);return m?+m[1]*60+ +m[2]:null};
  const fmtT=t=>{const m=toMin(t);if(m===null)return '';const h=Math.floor(m/60),mm=m%60;return (h%12||12)+(mm?':'+String(mm).padStart(2,'0'):'')+' '+(h>=12?'p. m.':'a. m.')};
  const horarioRaw=()=>{const r=R()||{};return r.horario??r.horarios??r.horario_atencion??''};
  function estadoHor(){
    const h=parseH(horarioRaw()),now=lima(),cur=now.getHours()*60+now.getMinutes(),today=KEYS[now.getDay()];const t=h[today];
    if(t){const a=toMin(t[0]),c=toMin(t[1]);const open=a<c?(cur>=a&&cur<c):(cur>=a||cur<c);if(open)return {open:true,text:'Cierra a las '+fmtT(t[1])}}
    for(let i=0;i<8;i++){const d=new Date(now);d.setDate(d.getDate()+i);const k=KEYS[d.getDay()],v=h[k];if(!v)continue;const a=toMin(v[0]);if(i===0&&a<=cur)continue;return {open:false,text:'Abre '+(i===0?'hoy':i===1?'mañana':'el '+DN[k].toLowerCase())+' a las '+fmtT(v[0])}}
    return {open:false,text:'Aún no pones tu horario'};
  }
  const pausaHasta=()=>{const r=R();const t=r&&r.pausado_hasta?T(r.pausado_hasta):0;return t>Date.now()?t:0};
  function estado(){
    const r=R()||{},h=estadoHor();
    if(r.visible_admin===false)return {on:false,t:'Oculto por Pidemás',s:'Escribe a Pidemás para volver a la tienda.'};
    if(r.activo===false)return {on:false,t:'Oculto en la tienda',s:'Actívalo en Perfil para recibir pedidos.'};
    const pz=pausaHasta();if(pz)return {on:false,t:'Pedidos en pausa',s:'Hasta las '+hora(pz)+'. Los pedidos que ya tienes siguen igual.',pausa:true};
    try{if(window.pdHorarioDia&&pdHorarioDia()===false){const p=window.pdHorario&&pdHorario.proxima&&pdHorario.proxima();return {on:false,t:'Pidemás no atiende hoy',s:'La tienda no recibe pedidos hoy.'+(p?' Vuelve '+p.cuando+' desde las '+p.hora:'')}}
      if(window.pdHorarioDia&&h.open){const d=pdHorarioDia();const n=lima(),m=n.getHours()*60+n.getMinutes();if(d&&(m<d.abre||m>=d.ultimo))return {on:false,t:'Fuera del horario de Pidemás',s:'Pidemás recibe pedidos de '+pdHoraTxt(d.abre)+' a '+pdHoraTxt(d.ultimo)+'.'}}}catch(e){}
    return h.open?{on:true,t:'Recibiendo pedidos',s:h.text}:{on:false,t:'Cerrado',s:h.text};
  }

  /* ---------- avisos (salen de los pedidos, como la campana de siempre) ---------- */
  function eventos(){
    const lim=Date.now()-2*864e5,ev=[];
    BO().forEach(o=>{const c=String(o.nombre_cliente||'').trim(),mo=o.motorizado_nombre||'El motorizado';
      const add=(col,t,cat,tit,msg)=>{if(t>lim)ev.push({key:o.id+':'+col,t,cat,tit,msg,id:o.id})};
      add('nuevo',T(o.creado_en),'pedidos','Nuevo pedido',(c?c+' · ':'')+M(subt(o))+'. Acéptalo para empezar a prepararlo.');
      add('conf',T(o.negocio_aceptado_en),'pedidos','Aceptaste el pedido',(c?'Pedido de '+c+'. ':'')+'Ya puedes prepararlo.');
      if(o.motorizado_id){add('asig',T(o.asignado_en),'motorizado','Motorizado asignado',mo+' recogerá este pedido. Tenlo listo.');
        add('local',T(o.en_local_en),'motorizado',mo+' llegó a tu local','Código de recojo: '+(o.codigo_recojo||'—')+'. Compáralo antes de entregar.');
        add('camino',T(o.en_camino_en),'motorizado',mo+' recogió el pedido','Va camino al cliente'+(c?' '+c:'')+'.')}
      add('entregado',T(o.entregado_en),'pedidos','Pedido entregado','El cliente'+(c?' '+c:'')+' ya recibió su pedido.');
      if(est(o)==='cancelado')add('cancel',T(o.cancelado_en||o.creado_en),'pedidos','Pedido anulado',o.motivo_cancelacion?'Motivo: '+o.motivo_cancelacion:'No lo prepares.')});
    return ev.sort((a,b)=>b.t-a.t).slice(0,80);
  }
  const visto=()=>Number(LS.get('pdn-avisos-visto','0'))||0;
  const noLeidos=()=>eventos().filter(e=>e.t>visto()).length;

  /* =============== INICIO =============== */
  function inicio(){
    const r=R()||{},nom=r.nombre||'Mi negocio',lg=logoDe(r);const nv=nuevos(),cu=curso(),st=estado();
    let h=`<div class="dsp${st.on?'':' off'}"><span class="pt"></span><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:16px">${E(st.t)}</b><span style="font-size:13px;color:#6B5E55">${E(st.s)}</span></span><button type="button" class="bt" data-a="p:pausa">${st.pausa?IC.play+'Reanudar':IC.pause+'Pausar'}</button></div>`;
    nv.forEach((o,i)=>h+=(i===0?`<div class="kick">${nv.length>1?'Pedidos nuevos':'Pedido nuevo'}</div>`:'')+tarjeta(o,true));
    cu.forEach((o,i)=>h+=(i===0?`<div class="kick">${cu.length>1?'Pedidos en curso':'Pedido en curso'}</div>`:'')+tarjeta(o,i===0&&!nv.length));
    if(!nv.length&&!cu.length)h+=`<div class="vac">No tienes pedidos en curso.<br>Te avisamos con sonido cuando llegue uno.</div>`;
    h+=`<div class="two"><button type="button" class="mt" data-a="hoy"><span>Efectivo de hoy</span><b>${M(efectivoHoy())}</b><small>Cobrado en tus pedidos</small></button><button type="button" class="mt" data-a="hoy"><span>Entregados hoy</span><b>${entHoy().length}</b><small>Ver pedidos de hoy</small></button></div>`;
    const url=enlace();
    if(url)h+=`<div class="cd"><div class="lbl">Mi tienda</div><div class="url"><span>${E(url.replace(/^https?:\/\//,''))}</span><button type="button" data-a="copiar">Copiar</button></div><div class="btns b2"><button type="button" class="b g" data-a="compartir">${U.I.wa}Compartir</button><button type="button" class="b" data-a="vertienda">${IC.eye}Ver mi tienda</button></div></div>`;
    const ag=PR().filter(p=>p.disponible===false).length;
    const cal=C.cal&&C.cal.data;const calTxt=cal&&cal.length?(cal.reduce((s,x)=>s+Number(x.estrellas_negocio),0)/cal.length).toFixed(1)+' de 5 · '+cal.length+' opinión'+(cal.length===1?'':'es'):'Lo que dicen tus clientes';
    if(!C.cal)cargar('cal',leerCal);
    h+=tl('p:horario',IC.clock,'Horario de atención',estadoHor().text)+tl('agotados',IC.ban,'Agotados',ag?ag+' producto'+(ag===1?'':'s')+' agotado'+(ag===1?'':'s'):'Apaga lo que se terminó')+tl('p:pagos',IC.cash,'Mis pagos','Lo que te paga Pidemás')+tl('p:reportes',IC.chart,'Reportes','Ventas, tiempos y lo más vendido')+tl('p:calificaciones',IC.star,'Calificaciones',calTxt)+tl('p:yape',IC.qr,'Mi Yape (QR)',r.yape_qr_url?'Yape '+(r.yape_numero||'')+' · listo para cobrar':'Súbelo para cobrar')+tl('guia',IC.help,'Guía de uso','Aprende a usar tu panel paso a paso');
    h+=`<button type="button" class="b" data-a="act">${IC.refresh}Actualizar pedidos</button>`;
    const nb=noLeidos();
    const f=new Date().toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'short',timeZone:'America/Lima'}).replace('.','');
    return {head:`<div class="hd"><span class="ava"${lg?` style="background-image:url('${E(lg)}')"`:''}>${lg?'':ini(nom)}</span><div style="flex:1 1 0%;min-width:0"><div class="kick" style="color:#6B5E55">${E(f)}</div><div class="h1" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Hola, ${E(nom)}</div></div><button type="button" class="ib" data-a="ayuda" aria-label="Soporte">${IC.help}</button><button type="button" class="ib" data-a="p:avisos" aria-label="Avisos">${IC.bell}${nb?`<span class="bd">${nb>99?'99+':nb}</span>`:''}</button></div>`,body:h};
  }
  function enlace(){try{return (window.getEnlaceIndividualCarta&&getEnlaceIndividualCarta())||($('miEnlaceCartaUrl')||{}).value||''}catch(e){return ''}}

  let entLim=30;
  const entTodos=()=>BO().filter(o=>est(o)==='entregado').sort((a,b)=>new Date(b.entregado_en||b.creado_en)-new Date(a.entregado_en||a.creado_en));
  function entLista(T){const out=[],hk=diaLima(Date.now()),ak=diaLima(Date.now()-864e5);let last='';T.slice(0,entLim).forEach(o=>{const k=diaLima(o.entregado_en||o.creado_en);if(k!==last){last=k;const n=T.filter(x=>diaLima(x.entregado_en||x.creado_en)===k).length;out.push(`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55"><span>${k===hk?'Hoy':k===ak?'Ayer':E(new Date(k+'T12:00:00').toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'short'}).replace('.',''))}</span><span>${n} pedido${n===1?'':'s'}</span></div>`)}out.push(tarjeta(o,false))});if(T.length>entLim)out.push(`<button type="button" class="b" data-a="entmas">Ver más entregados</button>`);return out.join('')}
  /* =============== PEDIDOS =============== */
  function pedidos(){
    const nv=nuevos(),cu=curso(),ho=entHoy(),an=anuHoy();const lista={nuevos:nv,curso:cu,hoy:ho,anulados:an}[seg]||nv;
    let h=`<div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[['nuevos','Nuevos',nv.length],['curso','En curso',cu.length],['hoy','Entregados',entTodos().length]].map(x=>`<button type="button" data-s="${x[0]}" class="${seg===x[0]?'on':''}">${x[1]} · ${x[2]}</button>`).join('')}</div>`;
    const ET=seg==='hoy'?entTodos():null;
    h+=ET?(ET.length?entLista(ET):`<div class="vac">Todavía no tienes pedidos entregados.</div>`):lista.length?lista.map(o=>tarjeta(o,seg==='nuevos')).join(''):`<div class="vac">${seg==='nuevos'?'No tienes pedidos nuevos.':seg==='curso'?'No tienes pedidos en curso.':seg==='anulados'?'No hay pedidos anulados hoy.':'Aún no entregas pedidos hoy.'}</div>`;
    if(seg==='nuevos'&&nv.length)h+=U.note('Ábrelo para aceptarlo y coordinar el pago.');
    if(seg==='hoy'&&ho.length)h+=`<div class="cd"><div class="li"><span>Vendido hoy</span><b>${M(ho.reduce((s,o)=>s+subt(o),0))}</b></div><div class="li"><span>En efectivo</span><b>${M(efectivoHoy())}</b></div></div>`;
    if(an.length&&seg!=='anulados')h+=`<button type="button" class="b" data-s="anulados">Ver anulados de hoy · ${an.length}</button>`;
    return {head:top('Mis pedidos','Pedidos',`<button type="button" class="ib" data-a="act" aria-label="Actualizar">${IC.refresh}</button>`),body:h};
  }

  /* =============== PRODUCTOS =============== */
  const byOrd=(a,b)=>{const ao=Number(a.orden),bo=Number(b.orden);return (Number.isFinite(ao)&&ao>0?ao:999999)-(Number.isFinite(bo)&&bo>0?bo:999999)};
  const descDe=p=>{try{return typeof splitCatalogDescription==='function'?splitCatalogDescription(p.descripcion||''):{description:p.descripcion||'',features:[]}}catch(e){return {description:p.descripcion||'',features:[]}}};
  const agotado=p=>{const sc=stk(p);return p.disponible===false||(sc!==null&&Number(p[sc]??0)<=0)};
  function productos(){
    const L=PR(),cats=[...CT()].sort(byOrd),q=F.q.trim().toLowerCase();
    let h='';
    h+=`<div class="fld"><label for="pQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar producto</label><input id="pQ" type="search" placeholder="Buscar producto" value="${E(F.q)}" data-in="pq"></div>`;
    h+=`<div class="btns b2"><button type="button" class="b o" data-a="nuevo">${IC.plus}Producto</button><button type="button" class="b" data-a="p:categorias">${IC.tag}Categorías</button></div>`;
    {const r0=R()||{},PF0=window.pdDescPerfil?window.pdDescPerfil(r0.categoria_negocio||r0.categoria||r0.tipo_negocio):{tipo:'comida'};
      if(PF0.tipo!=='ninguno')h+=`<button type="button" class="b" data-a="p:descartables">${IC.cup}Descartables<span style="margin-left:auto;font-size:13px;font-weight:700;color:#6B5E55">${r0.descartables_activo===true?'Activados':'Apagados'}</span></button>`}
    h+=`<div class="chips">${(L0=>{const i=L0.findIndex(x=>x[0]===F.cat);return i>0?[L0[i],...L0.slice(0,i),...L0.slice(i+1)]:L0})([['','Todas'],['__ag','Agotados'],...cats.map(c=>[String(c.id),c.nombre])]).map(x=>`<button type="button" data-c="${E(x[0])}" class="${F.cat===x[0]?'on':''}">${E(x[1])}</button>`).join('')}</div>`;
    h+=`<div id="pLista" style="display:flex;flex-direction:column;gap:10px">${listaProd(L,cats,q)}</div>`;
    return {head:top('Mi carta','Productos',`<button type="button" class="ib" data-a="nuevo" aria-label="Agregar producto">${IC.plus}</button>`),body:h};
  }
  function listaProd(L,cats,q){
    const ids=new Set(cats.map(c=>String(c.id)));
    const grupos=[...cats.map(c=>({id:String(c.id),n:c.nombre,oc:c.activo===false,it:L.filter(p=>String(p.categoria_id||'')===String(c.id))})),{id:'__none',n:'Sin categoría',it:L.filter(p=>!p.categoria_id||!ids.has(String(p.categoria_id)))}];
    let h='',n=0;
    grupos.forEach(g=>{
      if(F.cat&&F.cat!=='__ag'&&F.cat!==g.id)return;
      let it=g.it.filter(p=>(!q||String(p.nombre||'').toLowerCase().includes(q))&&(F.cat!=='__ag'||agotado(p))).sort(byOrd);
      if(!it.length&&(q||F.cat==='__ag'||g.id==='__none'))return;
      n+=it.length;
      h+=`<div class="cat"><div class="lbl">${E(g.n)}</div>${g.oc?'<span class="pl r">Oculta</span>':''}<small>${it.length} producto${it.length===1?'':'s'}</small></div>`;
      h+=it.length?it.map(filaProd).join(''):'<div class="vac" style="padding:16px">Sin productos en esta categoría.</div>';
    });
    return h||`<div class="vac">${q?'No hay productos con ese nombre.':F.cat==='__ag'?'No tienes productos agotados.':'Todavía no tienes productos. Agrega el primero.'}</div>`;
  }
  function filaProd(p){
    const sc=stk(p),st=sc!==null?Number(p[sc]??0):null,off=agotado(p),img=p.imagen_url||'';
    return `<div class="pr${off?' off':''}"><span class="pi"${img?` style="background-image:url('${E(img)}')"`:''}>${img?'':ini(p.nombre)}</span><button type="button" class="tx" data-p="${E(p.id)}"><b>${E(p.nombre||'Producto')}</b><span>${M(p.precio)}</span><small>${off?(st===0?'Sin stock':'Agotado · no se puede pedir'):st!==null?'Stock: '+st:'Disponible'}</small></button>${sw('disp:'+p.id,!off,(off?'Activar ':'Agotar ')+(p.nombre||''),st===0)}</div>`;
  }
  /* --- un producto --- */
  function prodNuevo(p){
    const d=p?descDe(p):{description:'',features:[]},sc=p?stk(p):'stock';
    return {id:p?String(p.id):'',nombre:p?.nombre||'',precio:p?Number(p.precio||0).toFixed(2):'',cat:p?.categoria_id?String(p.categoria_id):(F.cat&&F.cat!=='__ag'&&F.cat!=='__none'?F.cat:''),desc:d.description,feat:d.features.map(x=>({...x})),
      sc:sc,stock:sc&&p?String(p[sc]??0):'',vis:p?p.disponible!==false:true,img:p?.imagen_url||'',file:null,prev:'',quitar:false,msg:'',busy:false};
  }
  function producto(){
    const f=F.prod;if(!f)return {head:top('Productos','Producto',null,true),body:''};
    const cats=[...CT()].sort(byOrd);const foto=f.prev||(!f.quitar&&f.img)||'';
    let h=`<div class="foto"><span class="pi"${foto?` style="background-image:url('${E(foto)}')"`:''}>${foto?'':IC.camera}</span><div class="bs"><label class="b" style="height:44px;cursor:pointer">${IC.camera}${foto?'Cambiar foto':'Subir foto'}<input type="file" accept="image/jpeg,image/png,image/webp" data-in="pfoto" style="display:none"></label>${foto?`<button type="button" class="b rojo" style="height:40px" data-a="pf:quitarfoto">Quitar foto</button>`:'<span style="font-size:13px;color:#6B5E55">Mejor cuadrada y con buena luz.</span>'}</div></div>`;
    h+=`<div class="cd">${fld('prN','Nombre del producto','pr:nombre',f.nombre,{max:120,ph:'Ej. Pollo a la brasa ¼'})}
      <div class="g2">${fld('prP','Precio (S/)','pr:precio',f.precio,{im:'decimal',ph:'0.00',max:10})}<div class="fld"><label for="prC">Categoría</label><select id="prC" data-in="pr:cat"><option value="">Sin categoría</option>${cats.map(c=>`<option value="${E(c.id)}"${String(c.id)===f.cat?' selected':''}>${E(c.nombre)}</option>`).join('')}</select></div></div>
      <div class="fld"><label for="prD">Descripción</label><textarea id="prD" class="ta" data-in="pr:desc" maxlength="600" placeholder="Qué trae, tamaño, acompañamientos…">${E(f.desc)}</textarea></div></div>`;
    h+=`<div class="cd"><div class="lbl">Características (opcional)</div>${f.feat.map((x,i)=>`<div class="cf fld"><input aria-label="Característica" placeholder="Ej. Talla" value="${E(x.name)}" data-in="ft:${i}:name" maxlength="80"><input aria-label="Valor" placeholder="Ej. 38, 39, 40" value="${E(x.value)}" data-in="ft:${i}:value" maxlength="500"><button type="button" data-a="ft:del:${i}" aria-label="Quitar">×</button></div>`).join('')}<button type="button" class="b" style="height:44px" data-a="ft:add">${IC.plus}Agregar característica</button></div>`;
    h+=`<div class="cd">`+(f.sc?`<div class="fld"><label for="prS">Stock</label><div class="step"><button type="button" data-a="st:-1" aria-label="Restar">${IC.minus}</button><input id="prS" inputmode="numeric" value="${E(f.stock)}" data-in="pr:stock" maxlength="6"><button type="button" data-a="st:1" aria-label="Sumar">${IC.plus}</button></div></div>`:'')+
      `<div class="swr"><span class="tx"><b>Visible en la tienda</b><span>Apágalo si hoy no lo vendes.</span></span>${sw('pr:vis',f.vis,'Visible en la tienda')}</div></div>`;
    if(f.id)h+=`<slot name="ext"></slot>`;
    if(f.id)h+=`<div class="btns b2"><button type="button" class="b" data-a="mv:-1">${IC.up}Subir en la carta</button><button type="button" class="b" data-a="mv:1">${IC.down}Bajar en la carta</button></div>`;
    if(f.msg)h+=`<div class="${/^✓/.test(f.msg)?'msgok':'err'}">${E(f.msg)}</div>`;
    if(f.id)h+=`<button type="button" class="b rojo" data-a="pr:borrar">${IC.trash}Eliminar producto</button>`;
    return {head:top('Productos',f.id?(f.nombre||'Producto'):'Nuevo producto',null,true),body:h,
      foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="pr:guardar"${f.busy?' disabled':''}>${f.busy?'Guardando…':f.id?'Guardar cambios':'Agregar producto'}</button>`};
  }
  /* Lo que agregan otras partes de la app a «Editar producto» (variantes, fotos extra y descartables) se dibuja aquí */
  function armarExtras(){
    if(!ext)return;ext.innerHTML='';const f=F.prod;if(!f||!f.id)return;
    const p=PR().find(x=>String(x.id)===f.id);if(!p)return;
    const pre=document.createElement('input');pre.type='hidden';pre.id='pdxEPrecio';pre.value=f.precio;ext.appendChild(pre);
    try{window.pdTipoEditHook&&window.pdTipoEditHook(p,ext)}catch(e){console.warn('Variantes',e)}
    try{window.pdDescProdHook&&window.pdDescProdHook(p,ext)}catch(e){console.warn('Descartables',e)}
    ext.querySelectorAll('.pvHint').forEach(x=>{x.textContent=x.textContent.replace(/La principal se cambia con «Editar foto, descripción y categoría»\./,'La principal es la foto de arriba.')});
  }
  async function prodGuardar(){
    const f=F.prod;f.msg='';
    const nombre=f.nombre.trim(),precio=Number(String(f.precio).replace(',','.'));
    if(!nombre)return f.msg='Escribe el nombre del producto.';
    if(!Number.isFinite(precio)||precio<0)return f.msg='Escribe un precio válido.';
    const r=R();if(!r)return f.msg='No se encontró tu negocio.';
    const payload={categoria_id:f.cat||null,nombre,descripcion:typeof composeCatalogDescription==='function'?composeCatalogDescription(f.desc,f.feat):(f.desc.trim()||null),precio:Math.round(precio*100)/100,disponible:f.vis};
    if(f.sc&&String(f.stock).trim()==='')return f.msg='Escribe cuántos tienes en stock.';
    if(f.sc){const s=Math.max(0,Math.floor(Number(f.stock)||0));payload[f.sc]=s;if(s===0&&f.vis)return f.msg='Sin stock no puede estar visible. Súmale stock o apágalo.'}
    if(f.quitar&&!f.file)payload.imagen_url=null;
    const p=f.id?PR().find(x=>String(x.id)===f.id):null;
    if(p){const pe=$('pdxEPrecio');if(pe)pe.value=String(precio);const x=window.pdTipoPayload?window.pdTipoPayload(p):null;if(x&&x.error)return f.msg=x.error;if(x&&x.patch)Object.assign(payload,x.patch);
      if(window.pdDescProdGuardar){const er=await window.pdDescProdGuardar(p);if(er)return f.msg=er}}
    try{
      let id=f.id;
      if(id){const q=await D().from('productos_negocio').update(payload).eq('id',id).eq('negocio_id',r.id);if(q.error)throw q.error}
      else{const orden=PR().filter(x=>String(x.categoria_id||'')===String(f.cat||'')).length+1;const q=await D().from('productos_negocio').insert({negocio_id:r.id,orden,...payload}).select('*').single();if(q.error)throw q.error;id=String(q.data.id)}
      if(f.file){const url=await uploadProductImage(id,f.file);const u=await D().from('productos_negocio').update({imagen_url:url}).eq('id',id).eq('negocio_id',r.id);if(u.error)throw u.error;
        if(f.img&&f.img!==url&&typeof removeProductImageUrl==='function')try{await removeProductImageUrl(f.img)}catch(_){}}
      else if(f.quitar&&f.img&&typeof removeProductImageUrl==='function')try{await removeProductImageUrl(f.img)}catch(_){}
      try{await loadProducts()}catch(_){}
      exito(f.id?'Cambios guardados':'Producto agregado');F.prod=null;volver();
    }catch(e){f.msg='No se pudo guardar: '+(e&&e.message||e)+(/row-level security/i.test(String(e&&e.message))?' · Revisa los permisos.':'')}
  }
  async function moverProd(dir){
    const f=F.prod,p=PR().find(x=>String(x.id)===f.id);if(!p)return;
    const ids=new Set(CT().map(c=>String(c.id))),cid=p.categoria_id&&ids.has(String(p.categoria_id))?String(p.categoria_id):'';
    const L=PR().filter(x=>cid?String(x.categoria_id||'')===cid:(!x.categoria_id||!ids.has(String(x.categoria_id)))).sort(byOrd);
    const i=L.indexOf(p),j=i+dir;if(j<0||j>=L.length){f.msg=dir<0?'Ya está primero en su categoría.':'Ya está último en su categoría.';return}
    [L[i],L[j]]=[L[j],L[i]];
    try{for(let k=0;k<L.length;k++){if(Number(L[k].orden)!==k+1){const q=await D().from('productos_negocio').update({orden:k+1}).eq('id',L[k].id).eq('negocio_id',R().id);if(q.error)throw q.error;L[k].orden=k+1}}
      f.msg=dir<0?'✓ Subió un lugar en la carta.':'✓ Bajó un lugar en la carta.';try{window.renderProducts&&window.renderProducts()}catch(_){}}
    catch(e){f.msg='No se pudo mover: '+(e.message||e)}
  }
  async function setDisp(id,v){
    const p=PR().find(x=>String(x.id)===String(id));if(!p)return;
    const q=await D().from('productos_negocio').update({disponible:v}).eq('id',id).eq('negocio_id',R().id);if(q.error){aviso('No se pudo cambiar: '+q.error.message);return}
    p.disponible=v;try{window.renderProducts&&window.renderProducts()}catch(_){}
  }
  /* --- categorías --- */
  function categorias(){
    const cats=[...CT()].sort(byOrd),n=F.catNew;
    let h=`<div class="cd"><div class="lbl">Nueva categoría</div>${fld('cN','Nombre','cn:n',n.n,{max:60,ph:'Ej. Bebidas'})}${fld('cD','Descripción (opcional)','cn:d',n.d,{max:200})}<button type="button" class="b o" data-a="cat:add">${IC.plus}Agregar categoría</button></div>`;
    h+=cats.length?cats.map((c,i)=>{const id=String(c.id),k=PR().filter(p=>String(p.categoria_id)===id).length;
      if(F.catEd&&F.catEd.id===id)return `<div class="cd">${fld('ceN','Nombre','ce:n',F.catEd.n,{max:60})}${fld('ceD','Descripción','ce:d',F.catEd.d,{max:200})}<div class="btns b2"><button type="button" class="b" data-a="cat:cancel">Cancelar</button><button type="button" class="b o" data-a="cat:save">Guardar</button></div></div>`;
      return `<div class="cd"><div class="swr"><span class="tx"><b>${E(c.nombre)}</b><span>${k} producto${k===1?'':'s'}${c.descripcion?' · '+E(c.descripcion):''}</span></span>${sw('cat:vis:'+id,c.activo!==false,'Mostrar en la tienda')}</div>
        <div class="btns"><button type="button" class="b" data-a="cat:ed:${E(id)}">${IC.edit}Editar</button><button type="button" class="b" data-a="cat:mv:${E(id)}:-1"${i===0?' disabled':''} aria-label="Subir">${IC.up}</button><button type="button" class="b" data-a="cat:mv:${E(id)}:1"${i===cats.length-1?' disabled':''} aria-label="Bajar">${IC.down}</button></div>
        <button type="button" class="b rojo" style="height:42px" data-a="cat:del:${E(id)}">${IC.trash}Eliminar categoría</button></div>`}).join(''):'<div class="vac">Todavía no tienes categorías.</div>';
    h+=U.note('El interruptor muestra u oculta toda la categoría en la tienda.');
    return {head:top('Productos','Categorías',null,true),body:h};
  }
  async function catAccion(A){
    const r=R();const p=A.split(':');
    if(A==='cat:add'){const n=F.catNew.n.trim();if(!n){aviso('Escribe el nombre de la categoría.');return}
      const q=await D().from('categorias_negocio').insert({negocio_id:r.id,nombre:n,descripcion:F.catNew.d.trim()||null,orden:CT().length+1});if(q.error){aviso('No se pudo guardar la categoría: '+q.error.message);return}
      F.catNew={n:'',d:''};await loadCategories();try{await loadProducts()}catch(_){}exito('Categoría agregada');return}
    if(p[1]==='ed'){const c=CT().find(x=>String(x.id)===p[2]);if(c)F.catEd={id:p[2],n:c.nombre||'',d:c.descripcion||''};return}
    if(A==='cat:cancel'){F.catEd=null;return}
    if(A==='cat:save'){const e=F.catEd;if(!e.n.trim()){aviso('Escribe el nombre.');return}const q=await D().from('categorias_negocio').update({nombre:e.n.trim(),descripcion:e.d.trim()||null}).eq('id',e.id).eq('negocio_id',r.id);if(q.error){aviso('No se pudo editar: '+q.error.message);return}F.catEd=null;await loadCategories();try{await loadProducts()}catch(_){}return}
    if(p[1]==='vis'){const c=CT().find(x=>String(x.id)===p[2]);if(!c)return;const v=c.activo===false;const q=await D().from('categorias_negocio').update({activo:v}).eq('id',c.id).eq('negocio_id',r.id);if(q.error){aviso('No se pudo cambiar: '+q.error.message);return}c.activo=v;await loadCategories();return}
    if(p[1]==='del'){const n=PR().filter(x=>String(x.categoria_id)===p[2]).length;const cc=CT().find(x=>String(x.id)===p[2]);const ch=await window.pdElegirBorrarCat((cc&&cc.nombre)||'',n);if(!ch)return;
      if(ch==='todo'){const qd=await D().from('productos_negocio').delete().eq('categoria_id',p[2]).eq('negocio_id',r.id);if(qd.error){aviso('No se pudieron borrar los productos: '+qd.error.message);return}}
      const q=await D().from('categorias_negocio').delete().eq('id',p[2]).eq('negocio_id',r.id);if(q.error){aviso('No se pudo eliminar: '+q.error.message);return}await loadCategories();try{await loadProducts()}catch(_){}return}
    if(p[1]==='mv'){const L=[...CT()].sort(byOrd),i=L.findIndex(c=>String(c.id)===p[2]),j=i+Number(p[3]);if(i<0||j<0||j>=L.length)return;[L[i],L[j]]=[L[j],L[i]];
      for(let k=0;k<L.length;k++){if(Number(L[k].orden)!==k+1){const q=await D().from('categorias_negocio').update({orden:k+1}).eq('id',L[k].id).eq('negocio_id',r.id);if(q.error){aviso('No se pudo mover: '+q.error.message);break}L[k].orden=k+1}}
      await loadCategories();try{await loadProducts()}catch(_){}}
  }

  /* =============== PERFIL =============== */
  const CATS=['Restaurantes','Comida criolla','Pizzerías','Pollerías','Hamburgueserías','Comida rápida','Sangucherías','Paviferías','Cevicherías','Chifas','Sushi y comida japonesa','Parrillas y anticuchos','Heladerías','Cafeterías','Juguerías','Dulcerías y pastelerías','Panaderías','Bodegas y minimarkets','Fruterías y verdulerías','Carnicerías','Licorerías','Farmacias y boticas','Ropa y moda','Calzado y zapatillas','Accesorios y bisutería','Tecnología','Celulares y accesorios','Belleza y cuidado personal','Hogar y decoración','Ferreterías','Deportes','Bebés y maternidad','Florerías y regalos','Mascotas','Librerías y útiles escolares','Jugueterías','Lavanderías'];
  function perfilNuevo(){const r=R()||{};return {nombre:r.nombre||'',cat:r.categoria_negocio||'',desc:r.descripcion||'',tel:r.telefono||'',ruc:r.ruc||'',dir:r.direccion||'',maps:r.google_maps_url||'',lat:r.latitud??'',lng:r.longitud??'',tiempo:r.tiempo_estimado||'',activo:r.activo!==false,pub:r.ubicacion_publica!==false,msg:'',ok:''}}
  function perfil(){
    const r=R()||{};if(!F.perfil)F.perfil=perfilNuevo();const f=F.perfil,lg=logoDe(r);
    const cats=CATS.includes(f.cat)||!f.cat?CATS:[f.cat,...CATS];
    let h=`<div class="ph"><span class="ava"${lg?` style="background-image:url('${E(lg)}')"`:''}>${lg?'':ini(f.nombre)}</span><div style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:20px;overflow-wrap:anywhere">${E(r.nombre||'Mi negocio')}</b><span class="pl${r.activo===false||r.visible_admin===false?' r':' g'}" style="margin-top:4px">${r.activo===false||r.visible_admin===false?'Oculto en la tienda':'Visible en la tienda'}</span></div><label class="b" style="height:44px;cursor:pointer">${IC.camera}Logo<input type="file" accept="image/png,image/jpeg,image/webp" data-in="logo" style="display:none"></label></div>`;
    if(lg)h+=`<button type="button" class="b rojo" style="height:40px" data-a="logo:quitar">Quitar logo</button>`;
    h+=`<div class="cd"><div class="lbl">Datos del negocio</div>${fld('pN','Nombre del negocio','pf:nombre',f.nombre,{max:80})}
      <div class="fld"><label for="pC">Rubro</label><select id="pC" data-in="pf:cat"><option value="">Elige tu rubro</option>${cats.map(c=>`<option${c===f.cat?' selected':''}>${E(c)}</option>`).join('')}</select></div>
      <div class="fld"><label for="pD">Descripción</label><textarea id="pD" class="ta" data-in="pf:desc" maxlength="300" placeholder="Qué vendes, en pocas palabras">${E(f.desc)}</textarea></div>
      <div class="g2">${fld('pT','Teléfono','pf:tel',f.tel,{t:'tel',im:'tel',max:15})}${fld('pR','RUC','pf:ruc',f.ruc,{im:'numeric',max:11})}</div></div>`;
    h+=`<div class="cd"><div class="lbl">Ubicación</div>${fld('pDi','Dirección','pf:dir',f.dir,{max:160})}${fld('pM','Enlace de Google Maps','pf:maps',f.maps,{t:'url',ph:'https://maps.google.com/…'})}<div class="swr"><span class="tx"><b>Mostrar mi dirección a los clientes</b><span>${f.pub?'Los clientes ven tu dirección en la tienda.':'Privada: los clientes no la ven. Solo se usa para el delivery.'} Apágalo si no tienes local para atender en persona.</span></span>${sw('pf:pub',f.pub,'Mostrar mi dirección a los clientes')}</div><div class="g2">${fld('pLa','Latitud','pf:lat',f.lat,{im:'decimal'})}${fld('pLo','Longitud','pf:lng',f.lng,{im:'decimal'})}</div><span style="font-size:13px;color:#6B5E55">Si pegas el enlace de Google Maps, la latitud y longitud se llenan solas.</span></div>`;
    h+=`<div class="cd"><div class="lbl">En la tienda</div>${fld('pTi','Tiempo estimado de entrega','pf:tiempo',f.tiempo,{max:20,ph:'Ej. 25–35 min'})}<div class="swr"><span class="tx"><b>Negocio visible en la tienda</b><span>Si lo apagas, los clientes no verán tu negocio.</span></span>${sw('pf:activo',f.activo,'Negocio visible',r.visible_admin===false)}</div></div>`;
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;if(f.ok)h+=`<div class="msgok">${E(f.ok)}</div>`;
    h+=`<button type="button" class="b o" data-a="pf:guardar">Guardar cambios</button>`;
    const PF=window.pdDescPerfil?window.pdDescPerfil(f.cat||r.categoria_negocio):{tipo:'bolsa'};
    h+=tl('p:horario',IC.clock,'Horario de atención',estadoHor().text)+tl('p:yape',IC.qr,'Mi Yape (QR)',r.yape_qr_url?'Yape '+(r.yape_numero||'')+' · listo':'Súbelo para cobrar')+tl('p:clave',IC.lock,'Contraseña','Cambia la clave de tu panel');
    const snd=$('pdxSnd'),sOn=!!snd&&snd.classList.contains('on');
    const perm=!('Notification' in window)?'Este navegador no permite avisos.':Notification.permission==='granted'?'Activados.':Notification.permission==='denied'?'Bloqueados. Actívalos en los ajustes del sitio.':'Desactivados.';
    h+=`<div class="cd"><div class="lbl">Avisos de pedidos</div><div class="swr"><span class="tx"><b>Sonido de avisos</b><span>Suena cuando llega un pedido nuevo.</span></span>${sw('snd',sOn,'Sonido de avisos',!snd)}</div>
      <div class="btns b2"><button type="button" class="b" data-a="probar">${IC.sound}Probar sonido</button><button type="button" class="b" data-a="permiso"${'Notification' in window&&Notification.permission==='denied'?' disabled':''}>${IC.bell}${'Notification' in window&&Notification.permission==='granted'?'Probar aviso':'Activar avisos'}</button></div><span style="font-size:13px;color:#6B5E55">Avisos del teléfono: ${E(perm)}</span></div>`;
    h+=`<button type="button" class="b rojo" style="height:54px;font-size:16px;background:#FFFFFF" data-a="salir">${IC.logout}Cerrar sesión</button>`;
    return {head:top('Mi cuenta','Mi perfil'),body:h};
  }
  async function perfilGuardar(){
    const f=F.perfil;f.msg='';f.ok='';
    if(!f.nombre.trim()){f.msg='El nombre es obligatorio.';return}
    const set=(id,v)=>{const el=$(id);if(!el)return;if(el.tagName==='SELECT'&&v&&![...el.options].some(o=>o.value===v)){const o=document.createElement('option');o.textContent=v;el.appendChild(o)}el.value=v??''};
    set('perfilNombre',f.nombre);set('perfilCategoriaNegocio',f.cat);set('perfilDescripcion',f.desc);set('perfilNumero',f.tel);set('perfilRuc',f.ruc);set('perfilDireccion',f.dir);set('perfilMaps',f.maps);set('perfilLatitud',String(f.lat??''));set('perfilLongitud',String(f.lng??''));
    const ac=$('perfilActivo');if(ac){ac.checked=f.activo;ac.dataset.touched='1'}
    const ti=$('pdxTiempo');if(ti){ti.value=f.tiempo;ti.dataset.touched='1'}
    {const r=R();if(r&&(r.ubicacion_publica!==false)!==f.pub){const q=await D().from('negocios').update({ubicacion_publica:f.pub}).eq('id',r.id);if(q.error){f.msg='No se pudo guardar si tu dirección es pública: '+q.error.message;return}r.ubicacion_publica=f.pub}}
    const box=$('perfilMsg');if(box)box.textContent='';
    try{await (window.guardarPerfilAhora||guardarPerfilAhora)()}catch(e){f.msg=String(e.message||e);return}
    const t=String(box&&box.textContent||'').trim();
    if(/correctamente/i.test(t)&&!/pero/i.test(t)){F.perfil=perfilNuevo();F.perfil.ok='Cambios guardados.';if(!ti){const r=R();if(r&&(r.tiempo_estimado||'')!==f.tiempo){const q=await D().from('negocios').update({tiempo_estimado:f.tiempo||null}).eq('id',r.id);if(!q.error){r.tiempo_estimado=f.tiempo||null;F.perfil.tiempo=f.tiempo}}}}
    else f.msg=t||'No se pudo guardar.';
  }
  function logoSubir(file){const i=$('pdLogoFile');if(!i){aviso('No se pudo subir el logo. Actualiza la app.');return}
    try{const dt=new DataTransfer();dt.items.add(file);i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){aviso('No se pudo subir el logo.');return}
    let n=0;const t=setInterval(()=>{key='';pintar();const m=$('pdLogoMsg');if(++n>40||(m&&m.textContent&&!/Subiendo/.test(m.textContent))){clearInterval(t);if(m&&m.textContent)(m.className==='err'?aviso:exito)(m.textContent)}},500)}

  /* =============== HORARIO =============== */
  function horario(){
    if(!F.hor){const p=parseH(horarioRaw());F.hor={d:Object.fromEntries(DIAS.map(d=>[d,{on:!!p[d],a:p[d]?p[d][0].padStart(5,'0'):'09:00',c:p[d]?p[d][1].padStart(5,'0'):'22:00'}])),msg:'',ok:'',dirty:false}}
    const f=F.hor,s=estadoHor(),hoy=KEYS[lima().getDay()];
    let h=`<div class="dsp${s.open?'':' off'}"><span class="pt"></span><span style="flex:1 1 0%"><b style="display:block;font-size:16px">${s.open?'Abierto ahora':'Cerrado ahora'}</b><span style="font-size:13px;color:#6B5E55">${E(s.text)}</span></span></div>`;
    h+=`<div class="cd"><div class="lbl">Días y horas</div>${DIAS.map(d=>{const v=f.d[d];return `<div class="dia${v.on?' on':''}${d===hoy?' hoy':''}"><button type="button" data-a="hd:${d}" aria-pressed="${v.on}" aria-label="${DN[d]}">${DC[d]}</button><input type="time" aria-label="Abre el ${DN[d]}" value="${E(v.a)}" data-in="ha:${d}"><span>a</span><input type="time" aria-label="Cierra el ${DN[d]}" value="${E(v.c)}" data-in="hc:${d}"></div>`}).join('')}<span style="font-size:13px;color:#6B5E55">Toca un día para abrirlo o cerrarlo.</span></div>`;
    h+=`<div class="btns b2"><button type="button" class="b" data-a="h:igual">Igual todos los días</button><button type="button" class="b" data-a="h:todos">Abrir toda la semana</button></div>`;
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;if(f.ok)h+=`<div class="msgok">${E(f.ok)}</div>`;
    return {head:top('Mi negocio','Horario de atención',null,true),body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="h:guardar">Guardar horario</button>`};
  }
  async function horGuardar(){
    const f=F.hor;f.msg='';f.ok='';const parts=[];
    for(const d of DIAS){const v=f.d[d];if(!v.on)continue;if(!v.a||!v.c){f.msg='Completa las horas del '+DN[d]+'.';return}if(v.a===v.c){f.msg='El '+DN[d]+' la hora de apertura y la de cierre no pueden ser iguales.';return}
      const err=typeof window.pdValidarHorarioDia==='function'?window.pdValidarHorarioDia(v.a,v.c):'';if(err){f.msg=DN[d]+': '+err;return}parts.push(d+'='+v.a+'-'+v.c)}
    try{const q=await D().from('negocios').update({horario:parts.join('|')||null}).eq('id',R().id).select('id,horario').maybeSingle();if(q.error)throw q.error;if(!q.data)throw new Error('Supabase no actualizó el negocio (revisa permisos).');
      R().horario=q.data.horario;try{window.renderPerfilVista&&window.renderPerfilVista()}catch(_){}F.hor=null;horario();F.hor.ok='Horario guardado.'}
    catch(e){f.msg='No se pudo guardar el horario: '+(e.message||e)}
  }

  /* =============== PAUSA =============== */
  function pausa(){
    const pz=pausaHasta(),st=estado();
    let h=pz?`<div class="amt"><div class="k">Pedidos en pausa hasta</div><div class="n">${E(hora(pz))}</div><div class="pill">Nadie puede pedirte mientras tanto</div></div>`:`<div class="dsp${st.on?'':' off'}"><span class="pt"></span><span style="flex:1 1 0%"><b style="display:block;font-size:16px">${E(st.t)}</b><span style="font-size:13px;color:#6B5E55">${E(st.s)}</span></span></div>`;
    h+=U.note(pz?'Puedes reanudar ahora o alargar la pausa.':'Mientras estés en pausa, tu negocio aparece cerrado en la tienda. Los pedidos que ya tienes siguen igual.');
    h+=`<div class="lbl">${pz?'Alargar la pausa':'Pausar por'}</div><div class="opts">${[[15,'15 minutos'],[30,'30 minutos'],[60,'1 hora'],[120,'2 horas']].map(x=>`<button type="button" class="opt" data-a="pz:${x[0]}"><b>${x[1]}</b><span>Vuelves a recibir pedidos a las ${E(hora(Date.now()+x[0]*60000))}</span></button>`).join('')}</div>`;
    return {head:top('Mi negocio','Pausar pedidos',null,true),body:h,foot:pz?`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="pz:0">${IC.play}Reanudar ahora</button>`:''};
  }
  /* Pausar pedidos como alerta (mismo diseño de las ventanas de la app) */
  async function pausaAlerta(){
    const pz=pausaHasta(),st=estado();
    const bs=[[15,'15 minutos'],[30,'30 minutos'],[60,'1 hora'],[120,'2 horas']].map(x=>({k:String(x[0]),t:(pz?'+ ':'')+x[1],sub:'Vuelves a recibir pedidos a las '+hora((pz||Date.now())+x[0]*60000)}));
    if(pz)bs.unshift({k:'0',t:'Reanudar ahora',c:'o'});
    const v=await window.pdVentana({ic:pz?'mal':'q',titulo:pz?'Pedidos en pausa hasta las '+hora(pz):'Pausar pedidos',
      html:`<p>${pz?'Puedes reanudar ahora o alargar la pausa.':'Mientras estés en pausa, tu negocio aparece cerrado en la tienda. Los pedidos que ya tienes siguen igual.'}</p>${pz?'':'<div style="font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55;margin-top:2px">Pausar por</div>'}`,
      botones:bs});
    if(v==null)return;
    const m=Number(v);try{await pausar(m?Math.round(((pz||Date.now())+m*60000-Date.now())/60000):0)}catch(err){aviso(String(err&&err.message||err))}key='';pintar();
  }
  async function pausar(m){
    const r=R();const hasta=m?new Date(Date.now()+m*60000).toISOString():null;
    const q=await D().from('negocios').update({pausado_hasta:hasta}).eq('id',r.id);if(q.error){aviso('No se pudo guardar: '+q.error.message);return}
    r.pausado_hasta=hasta;r.__pzAvisado=0;exito(m?'Pedidos en pausa hasta las '+hora(T(hasta)):'Listo, ya recibes pedidos otra vez');if(sub==='pausa')volver();
  }

  /* =============== MIS PAGOS =============== */
  function pagos(){
    const head=top('Pidemás y tú','Mis pagos',`<button type="button" class="ib" data-a="r:pagos" aria-label="Actualizar">${IC.refresh}</button>`,true);
    const c=cargar('pagos',async()=>{const q=await D().from('pedidos').select('id,estado,subtotal,total,costo_delivery,pago_acordado,metodo_pago,creado_en,entregado_en,negocio_pagado_en,negocio_pagado_metodo,negocio_pagado_monto,delivery_negocio_cobrado_en').eq('negocio_id',R().id).eq('estado','entregado').gte('creado_en',new Date(Date.now()-60*864e5).toISOString()).order('creado_en',{ascending:false}).limit(1000);if(q.error)throw q.error;return q.data||[]});
    if(!c.data)return {head,body:c.err?`<div class="err">${E(c.err)}</div>`:'<div class="load">Cargando tus pagos…</div>'};
    const P=c.data,cobra=P.filter(p=>!['solo_delivery','pagado','yape_negocio'].includes(String(p.pago_acordado||''))&&subt(p)>0);
    const pend=cobra.filter(p=>!p.negocio_pagado_en),pag=cobra.filter(p=>p.negocio_pagado_en);
    const deb=P.filter(p=>['pagado','yape_negocio'].includes(String(p.pago_acordado||''))&&!p.delivery_negocio_cobrado_en&&Number(p.costo_delivery)>0);
    const tP=pend.reduce((s,p)=>s+subt(p),0),tD=deb.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0);
    const fila=(p,v,x,ic,bg,co)=>`<div class="mv"><span class="ic" style="background:${bg};color:${co}">${ic}</span><span class="tx"><b>${E(ref(p.id))}</b><span>${E(fecha(p.entregado_en||p.creado_en))}${x?' · '+E(x):''}</span></span><span class="am">${M(v)}</span></div>`;
    let h=`<div class="amt"><div class="k">Pidemás te debe</div><div class="n">${M(tP)}</div><div class="pill">${pend.length?pend.length+' pedido'+(pend.length===1?'':'s')+' por pagarte':'Estás al día'}</div></div>`;
    h+=U.note('Son los pedidos que el cliente le pagó a Pidemás (al motorizado o por Yape). Te corresponde el valor de los productos.');
    if(pend.length)h+=`<div class="cd"><div class="lbl">Por pagarte</div>${pend.map(p=>fila(p,subt(p),'',IC.clock,'#FDEBDF','#C4410C')).join('')}</div>`;
    if(deb.length)h+=`<div class="cd"><div class="li"><span style="font-weight:800">Tú le debes a Pidemás (delivery)</span><b>${M(tD)}</b></div>${deb.map(p=>fila(p,p.costo_delivery,'delivery',IC.moto,'#F6EFE9','#6B5E55')).join('')}</div>`;
    if(pag.length)h+=`<div class="cd"><div class="lbl">Ya te pagamos · últimos 60 días</div>${pag.slice(0,40).map(p=>fila(p,p.negocio_pagado_monto??subt(p),'pagado '+fecha(p.negocio_pagado_en)+(p.negocio_pagado_metodo?' · '+p.negocio_pagado_metodo:''),IC.check,'#E9F6EE','#15803D')).join('')}</div>`;
    return {head,body:h};
  }

  /* =============== REPORTES =============== */
  function reportes(){
    const dias=F.rep,head=top('Mis números','Reportes',null,true);
    const c=cargar('rep'+dias,async()=>{
      const desde=dias===1?new Date(diaLima(Date.now())+'T00:00:00-05:00').toISOString():new Date(Date.now()-dias*864e5).toISOString();
      const q=await D().from('pedidos').select('id,estado,subtotal,total,costo_delivery,creado_en,negocio_aceptado_en,listo_para_recojo_en,tiempo_preparacion_min,entregado_en,cancelado_por,motivo_cancelacion').eq('negocio_id',R().id).gte('creado_en',desde).limit(3000);if(q.error)throw q.error;
      const P=q.data||[],ent=P.filter(p=>est(p)==='entregado');let top=[];
      try{const items=[];const ids=ent.map(p=>p.id);for(let i=0;i<ids.length;i+=80){const d=await D().from('detalle_pedidos').select('*').in('pedido_id',ids.slice(i,i+80));if(!d.error&&d.data)items.push(...d.data)}
        const g=new Map();items.forEach(x=>{const k=String(x.nombre_producto||x.producto_nombre||x.nombre||'Producto');const o=g.get(k)||{n:0,v:0};const q2=Number(x.cantidad)||1;o.n+=q2;const s2=Number(x.subtotal??x.total_linea);o.v+=Number.isFinite(s2)?s2:(Number(x.precio_unitario??x.precio)||0)*q2;g.set(k,o)});top=[...g].sort((a,b)=>b[1].n-a[1].n).slice(0,8)}catch(e){}
      return {P,top}});
    let h=`<div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[[1,'Hoy'],[7,'7 días'],[30,'30 días']].map(x=>`<button type="button" data-rp="${x[0]}" class="${dias===x[0]?'on':''}">${x[1]}</button>`).join('')}</div>`;
    if(!c.data)return {head,body:h+(c.err?`<div class="err">${E(c.err)}</div>`:'<div class="load">Cargando…</div>')};
    const {P,top:tp}=c.data,ent=P.filter(p=>est(p)==='entregado'),can=P.filter(p=>est(p)==='cancelado'),venta=ent.reduce((s,p)=>s+subt(p),0);
    const prep=P.map(p=>p.negocio_aceptado_en&&p.listo_para_recojo_en?{real:(T(p.listo_para_recojo_en)-T(p.negocio_aceptado_en))/60000,dijo:Number(p.tiempo_preparacion_min)||0}:null).filter(x=>x&&x.real>=0&&x.real<300);
    const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0,real=avg(prep.map(x=>x.real)),dijo=avg(prep.filter(x=>x.dijo).map(x=>x.dijo)),conD=prep.filter(x=>x.dijo).length,aT=prep.filter(x=>x.dijo&&x.real<=x.dijo+2).length;
    const horas=new Array(24).fill(0);P.filter(p=>est(p)!=='cancelado').forEach(p=>{horas[+new Date(p.creado_en).toLocaleString('en-US',{timeZone:'America/Lima',hour:'numeric',hour12:false})%24]++});const mx=Math.max(1,...horas);
    h+=`<div class="amt"><div class="k">Vendido</div><div class="n">${M(venta)}</div><div class="pill">${ent.length} entregado${ent.length===1?'':'s'} · ticket ${M(ent.length?venta/ent.length:0)}</div></div>`;
    h+=`<div class="cols3"><div class="kp"><span>Pedidos</span><b>${P.length}</b></div><div class="kp"><span>Anulados</span><b>${can.length}</b></div><div class="kp"><span>Anulación</span><b>${P.length?Math.round(can.length*100/P.length):0}%</b></div></div>`;
    h+=`<div class="cd"><div class="lbl">Tiempo de preparación</div>${prep.length?`<div class="li"><span>Tardas en promedio</span><b>${Math.round(real)} min</b></div><div class="li"><span>Prometes en promedio</span><b>${dijo?Math.round(dijo)+' min':'—'}</b></div><div style="font-size:14px;color:#6B5E55;line-height:1.45">${conD?'A tiempo '+aT+' de '+conD+' ('+Math.round(aT*100/conD)+'%). ':''}${dijo&&real>dijo+3?'Sueles tardar más de lo que prometes: elige un tiempo un poco mayor al aceptar.':dijo&&real<dijo-5?'Sueles terminar antes: puedes prometer menos tiempo.':'Tus tiempos van bien.'}</div>`:'<div style="font-size:15px;color:#6B5E55">Aún no hay pedidos marcados como listos en este periodo.</div>'}</div>`;
    h+=`<div class="cd"><div class="lbl">Lo más vendido</div>${tp.length?tp.map(([k,x])=>`<div class="mv"><span class="tx"><b>${E(k)}</b><span>${M(x.v)}</span></span><span class="am">${x.n}</span></div>`).join(''):'<div style="font-size:15px;color:#6B5E55">Sin ventas en este periodo.</div>'}</div>`;
    if(horas.some(Boolean))h+=`<div class="cd"><div class="lbl">Tus horas fuertes</div><div class="hrs">${horas.map((n,x)=>n?`<div><span>${x%12||12} ${x<12?'am':'pm'}</span><i><s style="width:${Math.max(4,Math.round(n*100/mx))}%"></s></i><b>${n}</b></div>`:'').join('')}</div></div>`;
    const mot=new Map();can.forEach(p=>{const k=(p.motivo_cancelacion||'Sin motivo')+(p.cancelado_por?' ('+p.cancelado_por+')':'');mot.set(k,(mot.get(k)||0)+1)});
    if(mot.size)h+=`<div class="cd"><div class="lbl">Motivos de anulación</div>${[...mot].sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<div class="li"><span>${E(k)}</span><b>${n}</b></div>`).join('')}</div>`;
    const csv=['Pedido;Estado;Productos;Total;Creado;Aceptado;Listo;Min. prometidos;Entregado;Motivo anulación',...P.map(p=>[ref(p.id),p.estado,subt(p).toFixed(2),Number(p.total||0).toFixed(2),fecha(p.creado_en),p.negocio_aceptado_en?fecha(p.negocio_aceptado_en):'',p.listo_para_recojo_en?fecha(p.listo_para_recojo_en):'',p.tiempo_preparacion_min||'',p.entregado_en?fecha(p.entregado_en):'',p.motivo_cancelacion||''].join(';'))].join('\n');
    h+=`<a class="b" download="reporte-${dias}d.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent('﻿'+csv)}">${IC.doc}Descargar Excel (CSV)</a>`;
    return {head,body:h};
  }

  /* =============== CALIFICACIONES =============== */
  async function leerCal(){const q=await D().from('calificaciones').select('pedido_id,estrellas_negocio,comentario,creado_en').eq('negocio_id',R().id).order('creado_en',{ascending:false}).limit(300);if(q.error)throw q.error;return (q.data||[]).filter(c=>Number(c.estrellas_negocio)>0)}
  function calificaciones(){
    const head=top('Clientes','Calificaciones',null,true);const c=cargar('cal',leerCal);
    if(!c.data)return {head,body:c.err?`<div class="err">${E(c.err)}</div>`:'<div class="load">Cargando…</div>'};
    const L=c.data;if(!L.length)return {head,body:'<div class="vac">Todavía no tienes calificaciones. Cuando tus clientes califiquen sus pedidos, las verás aquí.</div>'};
    const p=L.reduce((s,x)=>s+Number(x.estrellas_negocio),0)/L.length,st=v=>'★'.repeat(Math.round(v))+'☆'.repeat(5-Math.round(v));
    let h=`<div class="amt"><div class="k">Tu promedio</div><div class="n">${p.toFixed(1)}</div><div class="pill"><span class="stars">${st(p)}</span>&nbsp;${L.length} opinión${L.length===1?'':'es'}</div></div>`;
    h+=`<div class="cd">${[5,4,3,2,1].map(n=>{const k=L.filter(x=>Math.round(x.estrellas_negocio)===n).length;return `<div style="display:flex;align-items:center;gap:10px"><b style="width:28px">${n}★</b><div class="bar" style="flex:1"><s style="width:${Math.round(k*100/L.length)}%"></s></div><b style="width:24px;text-align:right">${k}</b></div>`}).join('')}</div>`;
    const com=L.filter(x=>x.comentario).slice(0,25);
    h+=`<div class="cd"><div class="lbl">Comentarios</div>${com.length?com.map(x=>`<div class="mv"><span class="tx"><span class="stars">${st(x.estrellas_negocio)}</span><b style="font-weight:500">${E(x.comentario)}</b><span>${E(fecha(x.creado_en))}</span></span></div>`).join(''):'<div style="color:#6B5E55;font-size:15px">Sin comentarios todavía.</div>'}</div>`;
    return {head,body:h};
  }

  /* =============== MI YAPE =============== */
  function yape(){
    const r=R()||{};if(!F.yape)F.yape={num:r.yape_numero||'',tit:r.yape_titular||'',file:null,prev:'',msg:''};const f=F.yape,u=f.prev||r.yape_qr_url||'';
    let h=U.note('Sube solo el QR, recortado: que se vea únicamente el cuadro del QR, sin el resto de la pantalla.');
    h+=`<div class="qrbox">${u?`<img src="${E(u)}" alt="QR de Yape">`:'Aún no subes tu QR'}</div>`;
    h+=`<label class="b" style="cursor:pointer">${IC.camera}${u?'Cambiar QR':'Elegir QR'}<input type="file" accept="image/png,image/jpeg,image/webp" data-in="yqr" style="display:none"></label>`;
    h+=`<div class="cd">${fld('yN','Número de Yape','y:num',f.num,{t:'tel',im:'numeric',max:9,ph:'9 dígitos',ac:'off'})}${fld('yT','Titular (como sale en tu Yape)','y:tit',f.tit,{max:60,ac:'off'})}</div>`;
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
    h+=U.note('Va en el WhatsApp para coordinar el pago. Si eliges «Paga todo al recibir con mi Yape», el motorizado se lo muestra al cliente para que te pague directo a ti.');
    if(r.yape_qr_url)h+=`<button type="button" class="b rojo" data-a="y:quitar">${IC.trash}Quitar mi QR</button>`;
    return {head:top('Cobros','Mi Yape (QR)',null,true),body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="y:guardar">Guardar</button>`};
  }
  function yapeArchivo(fl){const f=F.yape;f.msg='';
    if(!/^image\//.test(fl.type)){f.msg='Elige una imagen (PNG o JPG).';return}if(fl.size>5*1024*1024){f.msg='La imagen pesa más de 5 MB.';return}
    const u=URL.createObjectURL(fl),im=new Image();
    im.onload=()=>{const k=Math.max(im.width,im.height)/Math.max(1,Math.min(im.width,im.height));
      if(k>1.3){URL.revokeObjectURL(u);f.msg='Esta imagen no es solo el QR (es muy alargada). Recórtala y vuelve a elegirla.'}
      else if(Math.min(im.width,im.height)<250){URL.revokeObjectURL(u);f.msg='La imagen es muy pequeña y el QR no se podría leer. Usa una captura más nítida.'}
      else{f.file=fl;f.prev=u}key='';pintar()};
    im.onerror=()=>{URL.revokeObjectURL(u);f.msg='No se pudo abrir esa imagen.';key='';pintar()};im.src=u}
  async function yapeGuardar(){
    const r=R(),f=F.yape;f.msg='';const num=String(f.num).replace(/\D/g,''),tit=f.tit.trim();
    if(!f.file&&!r.yape_qr_url)return f.msg='Elige la imagen de tu QR.';if(num.length!==9)return f.msg='El número de Yape debe tener 9 dígitos.';if(!tit)return f.msg='Escribe el nombre del titular, tal como sale en tu Yape.';
    try{let url=r.yape_qr_url||null;const old=url;
      if(f.file){const ext=f.file.type==='image/png'?'png':f.file.type==='image/webp'?'webp':'jpg';const path='yape/'+r.id+'/qr-'+Date.now()+'.'+ext;const st=D().storage.from('restaurantes');const up=await st.upload(path,f.file,{upsert:true,contentType:f.file.type,cacheControl:'31536000'});if(up.error)throw up.error;url=st.getPublicUrl(path).data.publicUrl}
      const q=await D().from('negocios').update({yape_qr_url:url,yape_numero:num,yape_titular:tit}).eq('id',r.id);if(q.error)throw q.error;
      r.yape_qr_url=url;r.yape_numero=num;r.yape_titular=tit;
      if(f.file&&old&&old!==url){const mk='/storage/v1/object/public/restaurantes/',i=old.indexOf(mk);if(i>=0)D().storage.from('restaurantes').remove([decodeURIComponent(old.slice(i+mk.length).split('?')[0])]).catch(()=>{})}
      F.yape=null;exito('Tu Yape quedó guardado');volver()}
    catch(e){f.msg='No se pudo guardar: '+(e.message||e)}
  }
  async function yapeQuitar(){const r=R();if(!(await confirmar('¿Quitar tu QR de Yape? Ya no se enviará en el mensaje de pago.')))return;
    const old=r.yape_qr_url;const q=await D().from('negocios').update({yape_qr_url:null}).eq('id',r.id);if(q.error){aviso('No se pudo quitar: '+q.error.message);return}
    r.yape_qr_url=null;const mk='/storage/v1/object/public/restaurantes/',i=String(old).indexOf(mk);if(i>=0)D().storage.from('restaurantes').remove([decodeURIComponent(old.slice(i+mk.length).split('?')[0])]).catch(()=>{});F.yape=null;exito('Quitaste tu QR de Yape')}

  /* =============== DESCARTABLES =============== */
  const DK=['taper_p','taper_g','vaso_p','vaso_g','bolsa','cubiertos'],DL={taper_p:'Taper pequeño',taper_g:'Taper grande',vaso_p:'Vaso pequeño',vaso_g:'Vaso grande',bolsa:'Bolsa',cubiertos:'Cubiertos (opcional para el cliente)'};
  const dcfg=()=>{const r=R();let c=r&&r.descartables_config;if(typeof c==='string'){try{c=JSON.parse(c)}catch(e){c=null}}return c&&typeof c==='object'?c:{}};
  const dtxt=v=>{const n=Number(v);return v===null||v===undefined||v===''||!Number.isFinite(n)?'':(n===0?'0':n.toFixed(2))};
  function descartables(){
    const r=R()||{},PF=window.pdDescPerfil?window.pdDescPerfil(r.categoria_negocio||r.categoria||r.tipo_negocio):{tipo:'comida',keys:DK};
    if(!F.desc){const c=dcfg();F.desc={v:Object.fromEntries(DK.map(k=>[k,dtxt(c[k])])),ex:(Array.isArray(c.extras)?c.extras:[]).map(x=>({id:String(x.id),n:x.n||'',p:dtxt(x.p)})),msg:''}}const f=F.desc,on=r.descartables_activo===true;
    let h=`<div class="cd"><div class="swr"><span class="tx"><b>Descartables en los pedidos</b><span>${PF.tipo==='comida'?'El taper y el vaso los eliges en cada producto (se suman a su precio). La bolsa va en cada pedido y el cliente puede sumar cubiertos.':'La bolsa se agrega a cada pedido.'}</span></span>${sw('d:on',on,'Activar descartables')}</div></div>`;
    if(on){
      /* Una sola lista: cada descartable en una fila (nombre · precio), los propios se pueden quitar */
      const nomF=(t,sub)=>`<span style="flex:1.6 1 0;min-width:0;height:54px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;padding:0 14px;border-radius:14px;background:#F6EFE9;color:#1F1A17;font-size:15px;font-weight:700;line-height:1.2">${E(t)}${sub?`<small style="font-size:12px;font-weight:600;color:#6B5E55">${E(sub)}</small>`:''}</span>`;
      const pre=(id,k,v,l)=>`<div class="fld" style="flex:1 1 0;min-width:0;margin:0"><input id="${id}" type="text" inputmode="decimal" maxlength="6" placeholder="0.50" autocomplete="off" aria-label="Precio de ${E(l||'descartable')} (S/)" value="${E(v??'')}" data-in="${k}"></div>`;
      const hueco='<span style="flex:0 0 46px;width:46px" aria-hidden="true"></span>';
      const NF={cubiertos:['Cubiertos','Opcional para el cliente']};
      const filas=PF.keys.map(k=>{const n=NF[k]||[DL[k],''];return `<div style="display:flex;gap:8px;align-items:center">${nomF(n[0],n[1])}${pre('dc_'+k,'dc:'+k,f.v[k],n[0])}${hueco}</div>`})
        .concat(f.ex.map((x,i)=>`<div style="display:flex;gap:8px;align-items:center"><div class="fld" style="flex:1.6 1 0;min-width:0;margin:0"><input id="dx_n${i}" type="text" maxlength="30" placeholder="Ej. Caja" autocomplete="off" aria-label="Nombre del descartable" value="${E(x.n)}" data-in="dx:n:${i}"></div>${pre('dx_p'+i,'dx:p:'+i,x.p,x.n)}<button type="button" class="ib" style="flex:0 0 46px;width:46px;height:54px;color:#B42318" data-a="dx:del:${i}" aria-label="Quitar ${E(x.n||'descartable')}">${IC.trash}</button></div>`));
      h+=`<div class="cd"><div class="lbl">Descartables y precios</div><div style="display:flex;gap:8px;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#6B5E55"><span style="flex:1.6 1 0;padding-left:4px">Descartable</span><span style="flex:1 1 0;padding-left:4px">Precio (S/)</span><span style="flex:0 0 46px"></span></div>${filas.join('')}<button type="button" class="b" data-a="dx:add">${IC.plus}Agregar más descartables</button><span style="font-size:13px;color:#6B5E55;line-height:1.45">Deja el precio vacío si no lo ofreces, o pon 0 si lo das gratis. Los que agregues (caja, sobre, bandeja…) los eliges en cada producto.</span></div>`;
      if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`}
    return {head:top('Mi carta','Descartables',null,true),body:h,foot:on?`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="d:guardar">Guardar precios</button>`:''};
  }
  async function descGuardar(){
    const r=R(),f=F.desc;f.msg='';const PF=window.pdDescPerfil?window.pdDescPerfil(r.categoria_negocio||r.categoria||r.tipo_negocio):null;const cfg={};
    for(const k of DK){if(PF&&!PF.keys.includes(k)){cfg[k]=null;continue}const raw=String(f.v[k]||'').trim().replace(',','.');if(raw===''){cfg[k]=null;continue}const n=Number(raw);if(!Number.isFinite(n)||n<0||n>50){f.msg='Escribe precios válidos, por ejemplo 0.50.';return}cfg[k]=Math.round(n*100)/100}
    const ex=[];for(const x of f.ex){const n=String(x.n||'').trim();const raw=String(x.p||'').trim().replace(',','.');if(!n&&!raw)continue;if(!n){f.msg='Escribe el nombre de cada descartable.';return}const v=Number(raw);if(raw===''||!Number.isFinite(v)||v<0||v>50){f.msg=n+': escribe un precio válido, por ejemplo 0.50.';return}ex.push({id:x.id||('x'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)),n:n.slice(0,30),p:Math.round(v*100)/100})}
    cfg.extras=ex;const ids=new Set(ex.map(x=>x.id));
    let prod=dcfg().prod;if(prod&&typeof prod==='object'){prod=JSON.parse(JSON.stringify(prod));for(const k in prod){const m=prod[k];if(Array.isArray(m.ex)){m.ex=m.ex.filter(i=>ids.has(String(i)));if(!m.ex.length)delete m.ex}if(PF&&PF.tipo!=='comida'){delete m.taper;delete m.vaso}if(!Object.keys(m).length)delete prod[k]}cfg.prod=prod}
    const q=await D().from('negocios').update({descartables_config:cfg}).eq('id',r.id).select('id').maybeSingle();
    if(q.error||!q.data){f.msg=/descartables|column|schema/i.test(String(q.error&&q.error.message))?'Falta crear las columnas de descartables en Supabase. Avisa al administrador.':'No se pudo guardar: '+(q.error?q.error.message:'revisa permisos');return}
    r.descartables_config=cfg;F.desc=null;exito('Precios guardados');volver();
  }

  /* =============== CONTRASEÑA =============== */
  function clave(){
    const f=F.clave,t=f.ver?'text':'password';
    let h=`<div class="cd">${fld('kA','Contraseña actual','k:a',f.a,{t,ac:'current-password',max:72})}${fld('kN','Nueva contraseña','k:n',f.n,{t,ac:'new-password',max:72})}${fld('kR','Repite la nueva contraseña','k:r',f.r,{t,ac:'new-password',max:72})}
      <button type="button" class="b" style="height:42px" data-a="k:ver">${IC.eye}${f.ver?'Ocultar contraseñas':'Mostrar contraseñas'}</button><span style="font-size:13px;color:#6B5E55">Usa al menos 6 caracteres. Al cambiarla, entrarás con la nueva clave en todos tus teléfonos.</span></div>`;
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
    return {head:top('Seguridad','Cambiar contraseña',null,true),body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="k:guardar">Guardar contraseña</button>`};
  }
  async function claveGuardar(){
    const f=F.clave;f.msg='';
    if(!f.a)return f.msg='Escribe tu contraseña actual.';if(f.n.length<6)return f.msg='La nueva contraseña debe tener al menos 6 caracteres.';if(f.n!==f.r)return f.msg='Las contraseñas nuevas no coinciden.';if(f.n===f.a)return f.msg='La nueva contraseña debe ser diferente a la actual.';
    try{const {data:u}=await D().auth.getUser();const email=u?.user?.email;if(!email)throw new Error('Tu sesión expiró. Vuelve a ingresar.');
      const {error:e1}=await D().auth.signInWithPassword({email,password:f.a});if(e1)throw new Error('La contraseña actual no es correcta.');
      const {error:e2}=await D().auth.updateUser({password:f.n});if(e2){const t=String(e2.message||'');throw new Error(/different/i.test(t)?'La nueva contraseña debe ser diferente a la actual.':/weak|short|least/i.test(t)?'La nueva contraseña es muy débil. Usa una más larga.':'No se pudo cambiar: '+t)}
      F.clave={a:'',n:'',r:'',msg:'',ver:false};exito('Contraseña actualizada');volver()}
    catch(e){f.msg=e.message||String(e)}
  }

  /* =============== AVISOS =============== */
  function avisos(){
    const ev=eventos(),v=visto();const L=ev.filter(e=>F.av==='todos'||e.cat===F.av);
    let h=`<div class="chips">${[['todos','Todos'],['pedidos','Pedidos'],['motorizado','Motorizado']].map(x=>`<button type="button" data-av="${x[0]}" class="${F.av===x[0]?'on':''}">${x[1]}</button>`).join('')}</div>`;
    h+=L.length?L.map(n=>`<button type="button" class="av2" data-o="${E(n.id)}"><span class="ic">${n.cat==='motorizado'?S('<circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h2.5"/><path d="M21.12 20.12a3 3 0 1 0-4.24 0c.42.42 1.12 1.05 2.12 1.88 1.05-.89 1.76-1.52 2.12-1.88z"/><path d="M19 18v.01"/>'):IC.box}</span><span class="tx"><b>${E(n.tit)}</b><span>${E(n.msg)}</span><small>${E(fecha(n.t))} · Ver pedido ${E(ref(n.id))}</small></span>${n.t>v?'<span class="pt"></span>':''}</button>`).join(''):'<div class="vac">No hay avisos de los últimos 2 días.</div>';
    if(ev.some(e=>e.t>v))h+=`<button type="button" class="b" style="height:46px" data-a="av:leer">${IC.check}Marcar todo como leído</button>`;
    return {head:top('Notificaciones','Avisos',null,true),body:h};
  }

  /* =============== MENÚ Y PINTADO =============== */
  const PADRE={avisos:'inicio',pausa:'inicio',pagos:'inicio',reportes:'inicio',calificaciones:'inicio',horario:null,yape:null,producto:'productos',categorias:'productos',descartables:'perfil',clave:'perfil'};
  let origen='inicio';
  function nav(){
    const n=nuevos().length;const act=tab;/* se marca la pestaña desde donde se abrió */
    const it=[['inicio','Inicio',IC.home],['pedidos','Pedidos',IC.box],['productos','Productos',IC.layers],['perfil','Perfil',IC.user]];
    return `<nav class="nv" aria-label="Menú principal">${it.map(x=>`<button type="button" data-t="${x[0]}" class="${act===x[0]?'on':''}"${act===x[0]?' aria-current="page"':''}><span class="i">${x[2]}</span>${x[1]}${x[0]==='pedidos'&&n?`<span class="bd">${n}</span>`:''}</button>`).join('')}</nav>`;
  }
  /* Ventanas viejas de pantalla completa que quedaran debajo: si alguna se abre, esta pantalla se aparta */
  const IGNORAR=new Set(['pdAppShell','appView','loginView','pdFondoHoja','nav']);
  function tapada(){
    const W=innerWidth,H=innerHeight;
    for(const el of document.body.children){
      if(IGNORAR.has(el.id)||el.tagName==='PD-PASOS-PEDIDO'||el.tagName==='PD-VENTANA'||el.tagName==='SCRIPT'||el.tagName==='STYLE')continue;
      const cs=getComputedStyle(el);if(cs.position!=='fixed'||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0||cs.pointerEvents==='none')continue;
      const z=parseInt(cs.zIndex,10)||0;if(z>=2147482000)continue;
      const r=el.getBoundingClientRect();if(r.width*r.height<W*H*0.45)continue;
      return true;
    }
    return false;
  }
  function visible(){const av=$('appView');if(!R()||!av||av.classList.contains('hidden'))return false;if(tapada())return false;return true}
  /* Lo viejo que queda encima (menú de abajo, aviso flotante de pedido nuevo) se esconde mientras esta pantalla está abierta */
  let escondidos=[];
  function esconderViejo(on){
    if(!on){escondidos.forEach(el=>{el.style.removeProperty('visibility')});escondidos=[];return}
    const cand=[$('nav'),$('pdxBanner'),...document.querySelectorAll('.pdpNuevoPop,#pdVentanaPedido,.pdvpOv,#pdpNuevo,#pdxNuevo')].filter(Boolean);
    for(const el of document.body.children){if(el.id==='pdAppShell'||el.tagName==='PD-PASOS-PEDIDO'||el.tagName==='PD-VENTANA'||el.tagName==='SCRIPT'||el.tagName==='STYLE'||el.id==='pdAvisoPila'||el.id==='pdInstalar')continue;
      const cs=getComputedStyle(el);if(cs.position!=='fixed'||cs.display==='none')continue;const z=parseInt(cs.zIndex,10)||0;if(z>=2147482000&&z<2147483646)cand.push(el)}
    cand.forEach(el=>{if(!escondidos.includes(el)){el.style.setProperty('visibility','hidden','important');escondidos.push(el)}});
  }
  function vista(){
    if(sub)return ({avisos,pausa,pagos,reportes,calificaciones,horario,yape,producto,categorias,descartables,clave})[sub]();
    return ({inicio,pedidos,productos,perfil})[tab]();
  }
  function pintar(){
    if(!visible()){if(host&&host.style.display!=='none'){host.style.display='none';document.documentElement.style.overflow='';esconderViejo(false)}return}
    if(!host){
      host=document.createElement('pd-app-neg');
      const wrap=document.createElement('header');wrap.id='pdAppShell';wrap.style.cssText='display:contents';wrap.appendChild(host);document.body.appendChild(wrap);
      if(!$('pd-app-neg-ext')){const st=document.createElement('style');st.id='pd-app-neg-ext';st.textContent=ESTILO_EXT;document.head.appendChild(st)}
      ext=document.createElement('div');ext.slot='ext';ext.id='pdnExt';host.appendChild(ext);
      root=host.attachShadow({mode:'open'});try{PdPasos.flechas(root)}catch(_){}
      root.addEventListener('click',clic);root.addEventListener('input',entrada);root.addEventListener('change',entrada);
      root.addEventListener('pointerdown',()=>{tocando=Date.now()});root.addEventListener('pointerup',()=>setTimeout(()=>{tocando=false},150),true);root.addEventListener('click',()=>setTimeout(()=>{tocando=false},60),true);root.addEventListener('pointercancel',()=>{tocando=false});
    }
    if(host.style.display==='none')host.style.display='';
    esconderViejo(true);
    if(tocando&&Date.now()-tocando<1500)return;tocando=false;/* un toque que no terminó no deja la pantalla congelada */
    if(ext.contains(document.activeElement)&&document.activeElement!==document.body)return;
    const v=vista();const pag=sub||tab;
    {const act=root.activeElement;if(act&&(act.tagName==='INPUT'||act.tagName==='TEXTAREA'||act.tagName==='SELECT')&&act.type!=='file'){if(root.__pag===pag)return;try{act.blur()}catch(_){}}}/* escribiendo: no redibuja; si cambió de página, sí */
    const k=pag+'|'+v.head+v.body+(v.foot||'')+nav();
    if(k===key)return;key=k;
    const lst=root.querySelector('.list');if(lst&&root.__pag)scrollMem[root.__pag]=lst.scrollTop;
    root.innerHTML=`<style>${ESTILO}</style><div class="app">${v.head}<div class="list">${v.body}</div>${v.foot?`<div class="foot">${v.foot}</div>`:''}${nav()}</div>`;
    const nl=root.querySelector('.list');if(nl)nl.scrollTop=root.__pag===pag?(scrollMem[pag]||0):(scrollMem[pag]=0,0);root.__pag=pag;
    if(document.documentElement.style.overflow!=='hidden')document.documentElement.style.overflow='hidden';
  }
  var regreso=null;/* pestaña desde donde se abrió la página, para volver ahí */
  function ir(t,s){
    const antes=sub||tab;if(s&&t&&t!==tab&&!sub)regreso=tab;else if(!s)regreso=null;if(!s)origen=t||tab;tab=t||tab;sub=s||null;key='';
    if(sub&&!history.state?.pdApp)try{history.pushState({pdApp:1},'')}catch(_){}
    if(antes!==(sub||tab)){scrollMem[sub||tab]=0;const ck={pagos:'pagos',calificaciones:'cal',reportes:'rep'+F.rep}[sub];if(ck&&C[ck])C[ck].t=0}
    if(tab==='perfil'&&!sub)F.perfil=null;
    if(sub==='horario')F.hor=null;if(sub==='yape')F.yape=null;if(sub==='descartables')F.desc=null;if(sub==='clave')F.clave={a:'',n:'',r:'',msg:'',ver:false};
    if(sub!=='producto'&&ext)ext.innerHTML='';
    if(sub==='avisos')setTimeout(()=>LS.set('pdn-avisos-visto',String(Date.now())),4000);
    pintar();
    if(sub==='producto')armarExtras();
  }
  function volver(){sub=null;if(regreso){tab=regreso;regreso=null}key='';if(ext)ext.innerHTML='';pintar();if(history.state?.pdApp){ignorarPop=true;history.back()}}
  addEventListener('popstate',()=>{if(window.__pdPopPropio)return;if(ignorarPop){ignorarPop=false;return}if(sub){sub=null;if(regreso){tab=regreso;regreso=null}key='';if(ext)ext.innerHTML='';pintar()}});
  function abrirPedido(id){const f=window.pdoAbrir||window.pdAbrirPasosNeg;if(typeof f==='function')f(id)}
  function entrada(e){
    const el=e.target;const k=el.dataset&&el.dataset.in;if(!k)return;const v=el.value;
    if(k==='pq'){F.q=v;const box=root.getElementById('pLista');if(box)box.innerHTML=listaProd(PR(),[...CT()].sort(byOrd),v.trim().toLowerCase());return}
    if(k.startsWith('pr:')){F.prod[k.slice(3)]=v;return}
    if(k.startsWith('ft:')){const [,i,c]=k.split(':');F.prod.feat[+i][c]=v;return}
    if(k==='pfoto'&&e.type==='change'){const fl=el.files&&el.files[0];if(fl){F.prod.file=fl;F.prod.prev=URL.createObjectURL(fl);F.prod.quitar=false;key='';el.blur();pintar()}return}
    if(k.startsWith('cn:')){F.catNew[k.slice(3)]=v;return}
    if(k.startsWith('ce:')){F.catEd[k.slice(3)]=v;return}
    if(k.startsWith('pf:')){const c=k.slice(3);F.perfil[c]=v;
      if(c==='maps'){const m=v.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||v.match(/[?&](?:q|query|ll)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i)||v.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);if(m){F.perfil.lat=m[1];F.perfil.lng=m[2];const a=root.getElementById('pLa'),b=root.getElementById('pLo');if(a)a.value=m[1];if(b)b.value=m[2]}}return}
    if(k==='logo'&&e.type==='change'){const fl=el.files&&el.files[0];el.value='';if(fl)logoSubir(fl);return}
    if(k.startsWith('ha:')||k.startsWith('hc:')){F.hor.d[k.slice(3)][k[1]==='a'?'a':'c']=v;F.hor.dirty=true;return}
    if(k.startsWith('y:')){F.yape[k.slice(2)]=v;return}
    if(k==='yqr'&&e.type==='change'){const fl=el.files&&el.files[0];el.value='';if(fl)yapeArchivo(fl);return}
    if(k.startsWith('dc:')){F.desc.v[k.slice(3)]=v;return}
    if(k.startsWith('dx:')){const [,c,i]=k.split(':');const x=F.desc.ex[+i];if(x)x[c]=v;return}
    if(k.startsWith('k:')){F.clave[k.slice(2)]=v;return}
  }
  async function clic(e){
    if(e.target.closest('[data-lnk]'))return;/* llamar / WhatsApp: abre el enlace sin abrir el pedido */
    tocando=false;
    const t=e.target.closest('[data-t]');if(t){if(window.PdPasos&&PdPasos.isOpen())PdPasos.close();if(sub&&history.state?.pdApp){ignorarPop=true;history.back()}ir(t.dataset.t,null);return}
    const s=e.target.closest('[data-s]');if(s){seg=s.dataset.s;if(tab!=='pedidos'||sub)ir('pedidos',null);else{key='';pintar()}return}
    const cc=e.target.closest('[data-c]');if(cc){F.cat=F.cat===cc.dataset.c&&cc.dataset.c?'':cc.dataset.c;key='';pintar();try{const ch=root.querySelector('.chips button[data-c]');if(ch&&ch.parentElement)ch.parentElement.scrollTo({left:0,behavior:'smooth'})}catch(_){}return}
    const pp=e.target.closest('[data-p]');if(pp){const p=PR().find(x=>String(x.id)===pp.dataset.p);if(p){F.prod=prodNuevo(p);ir(tab,'producto')}return}
    const av=e.target.closest('[data-av]');if(av){F.av=av.dataset.av;key='';pintar();return}
    const rp=e.target.closest('[data-rp]');if(rp){F.rep=+rp.dataset.rp;key='';pintar();return}
    const o=e.target.closest('[data-o]');if(o){abrirPedido(o.dataset.o);return}
    const a=e.target.closest('[data-a]');if(!a)return;const A=a.dataset.a;
    if(A==='p:pausa'&&window.pdVentana){await pausaAlerta();return}
    if(A.startsWith('p:')){ir(tab,A.slice(2));return}
    const ocupado=async fn=>{if(a.disabled)return;a.disabled=true;const tx=a.innerHTML;a.innerHTML='Un momento…';try{await fn()}catch(err){aviso(String(err&&err.message||err))}finally{a.disabled=false;a.innerHTML=tx;key='';pintar()}};
    if(A.startsWith('disp:')){const id=A.slice(5),p=PR().find(x=>String(x.id)===id);if(p)await ocupado(()=>setDisp(id,agotado(p)));return}
    if(A.startsWith('cat:')){await ocupado(()=>catAccion(A));return}
    if(A.startsWith('ft:')){const f=F.prod;if(A==='ft:add')f.feat.push({name:'',value:''});else f.feat.splice(+A.split(':')[2],1);key='';pintar();return}
    if(A.startsWith('st:')){const f=F.prod;f.stock=String(Math.max(0,(Math.floor(Number(f.stock)||0))+Number(A.slice(3))));key='';pintar();return}
    if(A.startsWith('mv:')){await ocupado(()=>moverProd(Number(A.slice(3))));return}
    if(A.startsWith('hd:')){const d=F.hor.d[A.slice(3)];d.on=!d.on;F.hor.dirty=true;F.hor.ok='';key='';pintar();return}
    if(A.startsWith('dx:del:')){F.desc.ex.splice(+A.slice(7),1);key='';pintar();return}
    if(A.startsWith('pz:')){await ocupado(()=>pausar(Number(A.slice(3))));return}
    switch(A){
      case 'volver':volver();break;
      case 'entmas':entLim+=30;key='';pintar();break;
      case 'act':await ocupado(async()=>{try{await window.loadBusinessOrders()}catch(_){}});break;
      case 'hoy':seg='hoy';ir('pedidos',null);break;
      case 'agotados':F.cat='__ag';F.q='';ir('productos',null);break;
      case 'guia':window.open('https://pidemas.pe/guia/','_blank','noopener');break;
      case 'ayuda':if(window.pdVentana){const v=await window.pdVentana({ic:'q',titulo:'¿En qué te ayudamos?',html:'<p>Revisa la guía con capturas de cada paso, o escríbenos por WhatsApp.</p>',botones:[{k:'g',t:'Ver la guía paso a paso',sub:'Carta, pedidos, pago y entrega',c:'o'},{k:'w',t:'Escribir a Pidemás',sub:'Te respondemos por WhatsApp',c:'g'}]});if(v==='g'){window.open('https://pidemas.pe/guia/','_blank','noopener');break}if(v!=='w')break}wa('https://wa.me/'+adminTel()+'?text='+encodeURIComponent('Hola, soy del negocio '+((R()||{}).nombre||'')+' en Pidemás y necesito ayuda.'));break;
      case 'copiar':{const u=enlace();if(!u)break;const ok=()=>{a.textContent='¡Copiado!';a.classList.add('ok');setTimeout(()=>{key='';pintar()},1600)};
        if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(u).then(ok,()=>aviso(u));else{const ta=document.createElement('textarea');ta.value=u;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(_){}ta.remove()}break}
      case 'compartir':{const w=$('compartirEnlaceCarta');if(w)w.click();else{const u=enlace();if(u)wa('https://wa.me/?text='+encodeURIComponent('Pide aquí: '+u))}break}
      case 'vertienda':{const v=$('verMiCarta');if(v)v.click();else{const u=enlace();if(u)window.open(u,'_blank','noopener')}break}
      case 'nuevo':F.prod=prodNuevo(null);ir(tab,'producto');break;
      case 'pr:vis':F.prod.vis=!F.prod.vis;key='';pintar();break;
      case 'pr:quitarfoto':F.prod.quitar=true;F.prod.file=null;F.prod.prev='';key='';pintar();break;
      case 'pr:guardar':{const f=F.prod;if(f.busy)break;f.busy=true;key='';pintar();try{await prodGuardar()}finally{if(F.prod)F.prod.busy=false;key='';pintar()}break}
      case 'pr:borrar':{const f=F.prod;const n=PR().length;try{await window.deleteProduct(f.id)}catch(err){aviso(String(err.message||err))}if(!PR().some(x=>String(x.id)===f.id)||PR().length<n){F.prod=null;volver()}break}
      case 'pf:activo':F.perfil.activo=!F.perfil.activo;key='';pintar();break;
      case 'pf:pub':F.perfil.pub=!F.perfil.pub;key='';pintar();break;
      case 'pf:guardar':await ocupado(perfilGuardar);break;
      case 'logo:quitar':$('pdLogoDel')?.click();setTimeout(()=>{key='';pintar()},1500);break;
      case 'snd':$('pdxSnd')?.click();key='';pintar();break;
      case 'probar':$('pdxTest')?.click();break;
      case 'permiso':$('pdxPerm')?.click();setTimeout(()=>{key='';pintar()},1500);break;
      case 'salir':if(await confirmar('¿Cerrar sesión? Dejarás de recibir avisos de pedidos en este teléfono.'))$('logout')?.click();break;
      case 'h:igual':{const f=F.hor,src=DIAS.map(d=>f.d[d]).find(v=>v.on);if(!src){f.msg='Primero abre al menos un día.';key='';pintar();break}DIAS.forEach(d=>{if(f.d[d].on){f.d[d].a=src.a;f.d[d].c=src.c}});f.dirty=true;f.msg='';f.ok='';key='';pintar();break}
      case 'h:todos':DIAS.forEach(d=>F.hor.d[d].on=true);F.hor.dirty=true;F.hor.ok='';key='';pintar();break;
      case 'h:guardar':await ocupado(horGuardar);break;
      case 'r:pagos':C.pagos&&(C.pagos.t=0);key='';pintar();break;
      case 'y:guardar':await ocupado(yapeGuardar);break;
      case 'y:quitar':await ocupado(yapeQuitar);break;
      case 'd:on':await ocupado(async()=>{const r=R(),v=r.descartables_activo!==true;const q=await D().from('negocios').update({descartables_activo:v}).eq('id',r.id).select('id').maybeSingle();if(q.error||!q.data)throw new Error(q.error?(/column|schema/i.test(q.error.message)?'Falta crear las columnas de descartables en Supabase. Avisa al administrador.':q.error.message):'No se actualizó el negocio (revisa permisos).');r.descartables_activo=v});break;
      case 'd:guardar':await ocupado(descGuardar);break;
      case 'dx:add':F.desc.ex.push({id:'',n:'',p:''});key='';pintar();break;
      case 'k:ver':F.clave.ver=!F.clave.ver;key='';pintar();break;
      case 'k:guardar':await ocupado(claveGuardar);break;
      case 'av:leer':LS.set('pdn-avisos-visto',String(Date.now()));key='';pintar();break;
    }
  }
  /* Lo que antes abría ventanas viejas ahora va a sus páginas nuevas */
  window.pdNegYape=()=>{if(window.PdPasos&&PdPasos.isOpen())PdPasos.close();ir(tab,'yape')};
  window.pdxTrack=id=>abrirPedido(id);
  setInterval(pintar,700);
  window.pdAppNeg={pintar,ir,navEnDetalle:false,navH:()=>{if(!host||host.style.display==='none'||!root)return 0;const n=root.querySelector('.nv');return n?n.offsetHeight:0}};
})();
