/* Al entrar con sesión: si faltan la ubicación o los avisos, la app queda bloqueada hasta activarlos. */
(function(){
  if(window.__pdPermisos)return;window.__pdPermisos=true;
  const PIDE_GPS=false;
  const QUIEN='Sin avisos no te enterarás de los pedidos nuevos de tu negocio.';
  const ICO={gps:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    bell:'<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'};
  const PASOS='Si ya diste permiso a la app y sigue sin activarse, falta el permiso de Chrome:\n1. Abre Chrome → toca ⋮ (arriba a la derecha) → Configuración.\n2. Entra a «Configuración de sitios» → «Notificaciones».\n3. Busca pidemasdelivery.github.io y ponlo en «Permitir».\n4. Haz lo mismo en «Ubicación» si te pide GPS.\n5. Cierra la app del todo y vuelve a abrirla.';
  let gps=null,gate=null;
  const notifOk=()=>!('Notification' in window)||Notification.permission==='granted';
  const sesion=()=>{const l=document.getElementById('loginView');if(!l)return false;if(l.classList.contains('hidden')||l.hidden)return true;return getComputedStyle(l).display==='none'};
  async function estadoGps(){
    if(!PIDE_GPS)return true;
    if(!('geolocation' in navigator))return true;
    try{const p=await navigator.permissions.query({name:'geolocation'});if(p.state==='granted'){gps=true;return true}if(p.state==='denied'){gps=false;return false}}catch(_){}
    return gps===true;
  }
  function pedirGps(){
    return new Promise(r=>{try{navigator.geolocation.getCurrentPosition(()=>{gps=true;r(true)},()=>{gps=false;r(false)},{enableHighAccuracy:true,timeout:15000,maximumAge:0})}catch(_){r(false)}});
  }
  async function pedirAvisos(){
    let p='default';try{p=await Promise.race([Notification.requestPermission(),new Promise(r=>setTimeout(()=>r(Notification.permission),10000))])}catch(_){p=Notification.permission}
    return p==='granted';
  }
  function logo(){const im=document.querySelector('#loginView .lg-logo img, .lg-logo img');return im&&im.getAttribute('src')?`<img class="pgLogoImg" alt="Pidemás Delivery" src="${im.getAttribute('src')}">`:'<div class="pgLogo">PIDEMÁS</div>'}
    function estado(ok){const c=document.getElementById('pdConexion');if(c)c.remove()}
  function pintar(okG,okN){
    if(!gate){gate=document.createElement('div');gate.id='pdPermGate';gate.setAttribute('role','dialog');gate.setAttribute('aria-modal','true');document.body.appendChild(gate)}
    const item=(k,t,s,ok)=>`<div class="pgItem"><span class="pgIco">${ICO[k]}</span><span class="pgTx"><b>${t}</b><small>${s}</small></span>${ok?'<span class="pgOk">✓ Listo</span>':`<button type="button" class="pgBtn" data-pg="${k}">Activar</button>`}</div>`;
    const ayudaAbierta=gate.querySelector('.pgAyuda:not([hidden])')||('Notification' in window&&Notification.permission==='denied');
    gate.innerHTML=`<div class="pg">${logo()}<h2>Activa estos permisos para trabajar</h2>
      <p class="pgSub">${QUIEN}</p>
      ${PIDE_GPS?item('gps','Ubicación (GPS)','Para asignarte pedidos cerca y que el cliente vea por dónde vas.',okG):''}
      ${item('bell','Avisos de pedidos',('Notification' in window&&Notification.permission==='denied')?'Bloqueado en Chrome. Sigue los pasos de abajo para permitirlo.':'Para que te enteres de cada pedido aunque el teléfono esté bloqueado.',okN)}
      <p class="pgAyuda"${ayudaAbierta?'':' hidden'}>${PASOS}</p>
      <button type="button" class="pgSalir" data-pg="salir">Cerrar sesión</button></div>`;
    gate.hidden=false;document.documentElement.classList.add('pdPermOn');
  }
  function ocultar(){if(gate&&!gate.hidden){gate.hidden=true;document.documentElement.classList.remove('pdPermOn')}}
  let revisando=false;
  async function revisar(){
    if(revisando)return;revisando=true;
    try{
      if(!sesion()){ocultar();estado(false);return}
      const okG=await estadoGps(),okN=notifOk();
      estado(okG&&okN);
      if(okG&&okN){ocultar();return}
      pintar(okG,okN);
    }finally{revisando=false}
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest&&e.target.closest('#pdPermGate [data-pg]');if(!b)return;
    const k=b.dataset.pg;
    if(k==='salir'){const lo=document.getElementById('logout');ocultar();if(lo)lo.click();return}
    b.disabled=true;b.textContent='…';
    const ok=k==='gps'?await pedirGps():await pedirAvisos();
    if(!ok){const a=gate&&gate.querySelector('.pgAyuda');if(a)a.hidden=false}
    revisando=false;await revisar();
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(revisar,400)});
  try{navigator.permissions.query({name:'notifications'}).then(s=>{s.onchange=revisar})}catch(_){}
  try{navigator.permissions.query({name:'geolocation'}).then(s=>{s.onchange=()=>{gps=s.state==='granted';revisar()}})}catch(_){}
  setInterval(revisar,2500);
  setTimeout(revisar,2000);
})();
