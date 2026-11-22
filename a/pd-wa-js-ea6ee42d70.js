/* WhatsApp sin pestañas nuevas: en el teléfono abre la app directamente y el panel se queda donde estaba. */
(function(){
  if(window.__pdWaFix)return; window.__pdWaFix=true;
  var mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');
  function toScheme(u){
    try{
      var x=new URL(String(u),location.href), h=x.hostname.toLowerCase(), phone='';
      if(h==='wa.me'||h==='www.wa.me') phone=x.pathname.replace(/\D/g,'');
      else if(/(^|\.)whatsapp\.com$/.test(h)&&/send/.test(x.pathname)) phone=(x.searchParams.get('phone')||'').replace(/\D/g,'');
      else return null;
      var p=[]; if(phone)p.push('phone='+phone);
      var t=x.searchParams.get('text'); if(t)p.push('text='+encodeURIComponent(t));
      return 'whatsapp://send?'+p.join('&');
    }catch(e){return null}
  }
  function closeSheet(){var s=document.getElementById('pdWaSheet');if(s)s.remove();}
  function sheet(scheme,web){
    closeSheet();
    var d=document.createElement('div');d.id='pdWaSheet';
    d.innerHTML='<div class="pdWaBox" role="dialog" aria-label="Enviar por WhatsApp"><span class="pdWaGrip"></span>'+
      '<p class="pdWaT">Enviar por WhatsApp</p><p class="pdWaP">El mensaje ya está listo. Toca el botón para abrir WhatsApp y luego pulsa Enviar.</p>'+
      '<a class="pdWaGo" href="'+scheme.replace(/"/g,'&quot;')+'">Abrir WhatsApp</a>'+
      '<a class="pdWaWeb" href="'+String(web).replace(/"/g,'&quot;')+'" target="_blank" rel="noopener">¿No abre? Usar WhatsApp en el navegador</a>'+
      '<button type="button" class="pdWaX">Cerrar</button></div>';
    d.addEventListener('click',function(e){
      if(e.target===d||e.target.closest('.pdWaX'))closeSheet();
      else if(e.target.closest('.pdWaGo'))setTimeout(closeSheet,400);
    });
    document.body.appendChild(d);
  }
  function go(url){
    var s=toScheme(url); if(!s)return false;
    var ua=navigator.userActivation;
    if(ua&&ua.isActive){ try{location.href=s;}catch(e){} }
    sheet(s,url);
    return true;
  }
  window.pdOpenWhatsApp=function(url){ if(mobile&&go(url))return; window.open(url,'_blank','noopener'); };
  document.addEventListener('visibilitychange',function(){ if(document.hidden)closeSheet(); });

  if(!mobile)return;
  var nativeOpen=window.open;
  window.open=function(u,t,f){
    if(!u||u==='about:blank'){
      // Pestaña reservada por los flujos antiguos: no se crea ninguna pestaña real.
      var fake={closed:false,close:function(){fake.closed=true},focus:function(){},blur:function(){},document:{write:function(){},close:function(){}},location:{}};
      var setHref=function(v){ if(fake.closed)return; fake.closed=true; if(!go(v))nativeOpen.call(window,v,'_blank'); };
      Object.defineProperty(fake.location,'href',{get:function(){return 'about:blank'},set:setHref});
      fake.location.assign=setHref; fake.location.replace=setHref;
      return fake;
    }
    if(typeof u==='string'&&toScheme(u)&&go(u))return null;
    return nativeOpen.apply(window,arguments);
  };
  document.addEventListener('click',function(e){
    var a=e.target&&e.target.closest&&e.target.closest('a[href]');
    if(!a||a.closest('#pdWaSheet'))return;
    if(!toScheme(a.href))return;
    e.preventDefault();
    go(a.href);
  },true);
})();
