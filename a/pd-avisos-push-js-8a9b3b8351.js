/* ===== Avisos push · Pidemás (negocio) =====
   Pide permiso una vez, guarda este celular en Supabase (tabla push_suscripciones)
   y así llegan los avisos de pedidos aunque la app esté cerrada.
   En iPhone solo funciona con la app instalada en la pantalla de inicio (iOS 16.4 o más). */
(function(){
  if(window.__pdPush)return;window.__pdPush=true;
  const ROL='negocio';
  const VAPID='BJIq-YR1vRTC7KlhzD_tJH4YLBR2Hl_vUAtvyIiRj9qaD5GENjDOsNZzlFBQYE7JFNlGpU7ENq8RDNMbx_qUSXQ';
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return;
  const cli=()=>{try{if(typeof db!=='undefined')return db}catch(_){}return window.db||null};
  const llave=()=>{const s=VAPID.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((VAPID.length+3)%4);const b=atob(s);return Uint8Array.from(b,c=>c.charCodeAt(0))};
  // Motorizado y negocio ya tienen su propio botón «Activar avisos»: allí solo se escucha el permiso.
  const TARJETA=ROL==='administrador';
  const NO='pdPushNo_'+ROL,DIAS=3;
  const descartado=()=>{try{const t=+localStorage.getItem(NO)||0;return t&&Date.now()-t<DIAS*864e5}catch(_){return false}};
  async function registro(){
    let r=await navigator.serviceWorker.getRegistration();
    if(!r)r=await navigator.serviceWorker.register('sw.js');
    return navigator.serviceWorker.ready.then(x=>x||r);
  }
  async function sesion(){const c=cli();if(!c)return null;try{const {data}=await c.auth.getSession();return data&&data.session}catch(_){return null}}
  async function guardar(sub){
    const j=sub.toJSON();
    const {error}=await cli().rpc('guardar_push',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_rol:ROL});
    if(error)console.warn('Avisos push:',error.message);
    return !error;
  }
  async function suscribir(){
    const r=await registro();
    let s=await r.pushManager.getSubscription();
    if(s){const k=s.options&&s.options.applicationServerKey;
      if(k&&new Uint8Array(k).join()!==llave().join()){await s.unsubscribe();s=null}}
    if(!s)s=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:llave()});
    return guardar(s);
  }
  // En la app instalada (APK) el permiso lo da Android; si no responde en 10 s, se explica cómo activarlo.
  const RP=Notification.requestPermission.bind(Notification);
  function pedir(){
    let pr;try{pr=Promise.resolve(RP())}catch(_){pr=Promise.resolve(Notification.permission)}
    return Promise.race([pr.catch(()=>Notification.permission),new Promise(r=>setTimeout(()=>r(Notification.permission),10000))]);
  }
  // Los botones propios del panel también pasan por aquí: tiempo límite, ayuda y registro del celular.
  try{Notification.requestPermission=function(){return pedir().then(p=>{if(p==='granted')setTimeout(revisar,300);else ayuda();return p})}}catch(_){}
  function ayuda(msg){
    let a=document.getElementById('pdPushAyuda');
    if(!a){a=document.createElement('div');a.id='pdPushAyuda';a.setAttribute('role','alert');
      a.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:2147483000;background:#2b1a12;color:#fff;border-radius:16px;padding:14px 16px;font:500 14px/1.4 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25)';
      document.body.appendChild(a)}
    a.innerHTML=(msg||'Para recibir avisos, activa las notificaciones: mantén presionado el icono de la app → <b>Información de la app</b> → <b>Notificaciones</b> → Permitir. Luego vuelve a abrir la app.')+'<button type="button" style="display:block;margin-top:10px;margin-left:auto;background:#C4410C;color:#fff;border:0;border-radius:999px;padding:8px 16px;font:700 14px Inter,system-ui,sans-serif">Entendido</button>';
    a.hidden=false;a.querySelector('button').onclick=()=>{a.hidden=true};
  }
  /* Cuando Android no deja dar el permiso desde la app, se explica cómo hacerlo en Ajustes */
  function instrucciones(){
    const t='Activa las notificaciones en tu teléfono\n1. Mantén presionado el ícono de la app y toca «Información de la app».\n2. Entra a «Notificaciones» y actívalas.\n3. Vuelve a abrir la app: los avisos quedarán activados solos.';
    if(window.pdInfo)window.pdInfo(t);else ayuda();
  }
  let card=null;
  function tarjeta(){
    if(card&&!card.hidden)return;
    if(!card){card=document.createElement('div');card.id='pdPushCard';card.setAttribute('role','dialog');card.setAttribute('aria-label','Activar avisos');document.body.appendChild(card)}
    card.innerHTML='<span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span>'+
      '<span class="tx"><b>Activa los avisos de pedidos</b><small>Te avisamos de cada pedido aunque la app esté cerrada.</small></span>'+
      '<span class="bt"><button type="button" class="si">Activar</button><button type="button" class="no">Ahora no</button></span>';
    card.hidden=false;
    const hd=document.querySelector('header');const rc=hd&&hd.getBoundingClientRect();
    if(rc&&rc.height&&rc.bottom>0)card.style.top=(rc.bottom+8)+'px';
    card.querySelector('.no').onclick=()=>{try{localStorage.setItem(NO,String(Date.now()))}catch(_){}card.hidden=true};
    card.querySelector('.si').onclick=async()=>{
      card.hidden=true;
      const p=await pedir();
      if(p==='granted')suscribir().then(ok=>{if(!ok)ayuda('No se pudo registrar este celular. Cierra sesión y vuelve a entrar.')}).catch(e=>console.warn('Avisos push:',e));
      else{try{localStorage.setItem(NO,String(Date.now()))}catch(_){}ayuda()}
    };
  }
  let revisando=false;
  async function revisar(){
    if(revisando)return;revisando=true;
    try{
      if(!(await sesion()))return;
      if(Notification.permission==='granted'){await suscribir()}
      else if(TARJETA&&Notification.permission==='default'&&!descartado()){tarjeta()}
    }catch(e){console.warn('Avisos push:',e)}finally{revisando=false}
  }
  function iniciar(){
    const c=cli();if(!c){setTimeout(iniciar,800);return}
    setTimeout(revisar,2500);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(revisar,800)});
    // si el permiso se concede desde otro botón del panel, se guarda el celular al instante
    try{navigator.permissions.query({name:'notifications'}).then(st=>{st.onchange=()=>{if(st.state==='granted')revisar()}})}catch(_){}
    document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b)return;
      const txt=(b.textContent||'')+' '+(b.id||'');
      /* Botón «Activar avisos» del panel: se pide el permiso en el mismo toque y se explica qué pasó */
      if(/activar avisos|activa los avisos|activar notificaciones/i.test(txt)&&!b.closest('#pdPushCard')&&'Notification' in window){
        if(Notification.permission==='granted'){revisar().then(()=>window.pdAviso&&pdAviso('Los avisos ya están activados en este teléfono ✓'));return}
        pedir().then(p=>{
          if(p==='granted'){setTimeout(revisar,300);window.pdAviso&&pdAviso('Avisos activados ✓ Te avisaremos de cada pedido.')}
          else instrucciones();
        });
        return;
      }
      if(/avisos|notificaci|alerta|permiso|activar/i.test(txt))[1500,5000,12000].forEach(t=>setTimeout(revisar,t))},true);
    try{c.auth.onAuthStateChange(ev=>{
      if(ev==='SIGNED_IN')setTimeout(revisar,1500);
      if(ev==='SIGNED_OUT'){if(card)card.hidden=true;navigator.serviceWorker.getRegistration().then(r=>r&&r.pushManager.getSubscription()).then(s=>s&&s.unsubscribe()).catch(()=>{})}
    })}catch(_){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
