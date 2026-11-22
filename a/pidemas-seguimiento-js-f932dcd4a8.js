(function(){
  var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  var money=function(n){return 'S/ '+(Number(n)||0).toFixed(2)};
  var hora=function(v){if(!v)return '';var d=new Date(v);return isNaN(d)?'':d.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'America/Lima'})};
  var ORDEN=['pendiente','confirmado','asignado','aceptado','en_camino','en_entrega','entregado'];
  function rango(s){s=String(s||'').toLowerCase();if(s==='pedido_aceptado'||s==='camino_recojo')s='aceptado';if(s==='camino_entrega')s='en_camino';if(s==='confirmando_pago')s='en_entrega';return ORDEN.indexOf(s)}
  function tipo(o){var t=String(o.tipo_servicio||'').toLowerCase();if(t.indexOf('encomienda')>=0)return 'encomienda';if(t.indexOf('compra')>=0)return 'compra';if(t.indexOf('recojo')>=0)return 'recojo';return 'tienda'}
  var cfg={},abiertoId=null,timer=null;
  /* Paquetes de la encomienda (el 1 viene en el pedido; los demás en «PAQUETES ADICIONALES») */
  function paqs(o){
    var L=[{numero:1,agencia:String(o.agencia_destino||'').trim(),destino:String(o.destino_final||o.direccion_entrega||'').trim()}];
    var raw=String(o.observaciones||''),i=raw.indexOf('PAQUETES ADICIONALES:');
    if(i>=0)raw.slice(i+21).split(/\s*\|\s*PAGO_ENCOMIENDA_/i)[0].split(/\s*\|\|\s*/).forEach(function(part){var n=part.match(/Paquete\s+(\d+)/i),a=part.match(/Agencia\s+([^;]+);/i),d=part.match(/destino\s+([^;]+);/i);if(n)L.push({numero:Number(n[1]),agencia:a?a[1].trim():'',destino:d?d[1].trim():''})});
    return L.filter(function(p,k,A){return A.findIndex(function(x){return x.numero===p.numero})===k});
  }
  function guias(o){var v=o.paquetes_envio;if(!Array.isArray(v)){try{v=JSON.parse(v||'[]')}catch(e){v=[]}}return Array.isArray(v)?v:[]}
  function pasos(o){
    var r=rango(o.estado),t=tipo(o),L=[],mn=cfg.motoNombre?cfg.motoNombre(o):'';
    L.push(['Pedido recibido','',o.creado_en,true]);
    if(o.negocio_id){
      L.push(['El negocio confirmó',o.tiempo_preparacion_min?'Listo en '+o.tiempo_preparacion_min+' min':'',o.negocio_aceptado_en||o.pago_negocio_confirmado_en,r>=1||!!o.negocio_aceptado_en]);
      L.push(['Pedido listo en el negocio','',o.listo_para_recojo_en,o.listo_para_recojo===true]);
    }else if(t!=='encomienda'&&t!=='compra'&&t!=='recojo'){L.push(['Pedido aceptado por Pidemás','',null,r>=1])}
    L.push(['Motorizado asignado',mn||'',o.asignado_en,r>=2||!!o.motorizado_id]);
    L.push(['El motorizado aceptó','',o.aceptado_en,r>=3]);
    var m=String(o.pago_servicio_momento||'').toLowerCase();
    var metodo=String(o.metodo_pago||'').toLowerCase()==='yape'?'Yape':'efectivo';
    if((t==='encomienda'||t==='recojo')&&(m==='recojo_efectivo'||m==='recojo_yape'))L.push(['Cobró al recoger',money(o.total)+' · '+metodo,null,o.pago_confirmado===true]);
    if(t==='encomienda'){
      /* Mismo orden que los botones deslizantes del motorizado */
      L.push(['Recogió los paquetes','',o.en_camino_en,r>=4]);
      var PK=paqs(o),ags=[];PK.forEach(function(p){if(p.agencia&&ags.indexOf(p.agencia)<0)ags.push(p.agencia)});
      if(ags.length>1)L.push(['Llegó a las agencias',ags.join(' · '),null,o.pedido_en_agencia===true||r>=6]);
      else L.push(['Llegó a la agencia',ags[0]||'',null,o.pedido_en_agencia===true||r>=6]);
      if(PK.length>1){var G=guias(o);PK.forEach(function(p){var g=G.filter(function(x){return Number(x.numero)===p.numero})[0];L.push(['Guía del paquete '+p.numero,[p.agencia,p.destino].filter(Boolean).join(' → '),g&&g.enviado_en,!!(g&&(g.enviado_whatsapp||g.guia_url))||r>=6])})}
      else L.push(['Guía y clave registradas','',null,(!!o.guia_url&&!!o.clave_guia)||guias(o).some(function(g){return g.enviado_whatsapp||g.guia_url})||r>=6]);
      L.push(['Guía enviada al cliente','',o.guia_enviada_cliente_en,!!o.guia_enviada_cliente_en||r>=6]);
      if(m==='al_final')L.push(['Cliente pagó',money(o.total)+' por Yape',null,o.pago_confirmado===true]);
      L.push(['Encomienda terminada','',o.entregado_en,r>=6]);
    }else{
      if(o.negocio_id){
        L.push(['Llegó al local',o.codigo_recojo?'Código de recojo '+o.codigo_recojo:'',o.en_local_en,!!o.en_local_en||r>=4]);
        L.push(['Recogió el pedido','En camino al cliente',o.en_camino_en,r>=4]);
      }else{
        if(t==='compra')L.push(['Compra registrada',Number(o.subtotal)>0?'Gastó '+money(o.subtotal):'',null,Number(o.subtotal)>0||r>=4]);
        L.push(['En camino',t==='recojo'?'Hacia quien recibe':'Hacia el cliente',o.en_camino_en,r>=4]);
      }
      L.push(['Llegó donde el cliente','',o.en_entrega_en,r>=5]);
      var yaPagado=o.pago_acordado==='pagado'||m==='pagado'||m==='recojo_efectivo'||m==='recojo_yape'||!(Number(o.total)>0);
      if(!yaPagado)L.push(['Cobro confirmado',money(o.total)+' · '+metodo,null,o.pago_confirmado===true||r>=6]);
      L.push(['Pedido entregado','',o.entregado_en,r>=6]);
    }
    var ult=-1;L.forEach(function(x,i){if(x[3])ult=i});
    var cancel=String(o.estado||'').toLowerCase()==='cancelado';
    return L.map(function(x,i){return{n:x[0],s:x[1],t:hora(x[2]),hecho:i<=ult,ahora:!cancel&&i===ult&&ult<L.length-1,ultimo:i===L.length-1}});
  }
  function icoTel(){return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path></svg>'}
  function icoWa(){return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"></path></svg>'}
  function ini(n){return String(n||'?').trim().split(/\s+/).slice(0,2).map(function(p){return p[0]||''}).join('').toUpperCase()||'?'}
  function persona(rol,nombre,tel,extra){
    if(!nombre)return '';
    var d=String(tel||'').replace(/\D/g,''),intl=d.length===9?'51'+d:d;
    return '<div class="sgPer"><span class="sgAv">'+E(ini(nombre))+'</span><span class="sgPm"><span>'+E(rol)+'</span><b>'+E(nombre)+'</b>'+(extra?'<i>'+E(extra)+'</i>':'')+'</span>'+
      (d?'<a class="sgMini" href="tel:+'+E(intl)+'" aria-label="Llamar a '+E(nombre)+'">'+icoTel()+'</a><a class="sgMini" href="https://wa.me/'+E(intl)+'" target="_blank" rel="noopener" aria-label="WhatsApp de '+E(nombre)+'">'+icoWa()+'</a>':'')+'</div>';
  }
  function pintar(){
    var box=document.getElementById('pdSeg');if(!box||!abiertoId)return;
    var o=cfg.pedido?cfg.pedido(abiertoId):null;
    if(!o){box.querySelector('.sgEstado b').textContent='Pedido no disponible';return}
    var st=pasos(o),hechos=st.filter(function(s){return s.hecho}).length,cur=st.filter(function(s){return s.ahora})[0];
    var cancel=String(o.estado||'').toLowerCase()==='cancelado',t=tipo(o);
    var origen=t==='tienda'?(cfg.negocioNombre?cfg.negocioNombre(o):'')||'Negocio':(o.nombre_remitente||String(o.direccion_recojo||'').replace(/https?:\/\/\S+/g,'').replace(/^[\s·\-–]+|[\s·\-–]+$/g,'')||(t==='compra'?'Lugar de compra':'Recojo'));
    var destino=t==='encomienda'?(function(){var A=[];paqs(o).forEach(function(p){if(p.agencia&&A.indexOf(p.agencia)<0)A.push(p.agencia)});return A.join(' · ')||o.destino_final||'Agencia'})():(o.nombre_receptor||o.nombre_cliente||'Cliente');
    box.querySelector('.sgCode').textContent='#'+String(o.id).slice(0,8).toUpperCase();
    box.querySelector('.sgRuta').textContent=origen+' → '+destino;
    box.querySelector('.sgEstado b').textContent=cancel?'Pedido cancelado':(cur?cur.n:'Entregado');
    box.querySelector('.sgChip').textContent=money(o.total);
    box.querySelector('.sgBarras').innerHTML=st.map(function(s){return '<span class="'+(s.hecho?'on':'')+'"></span>'}).join('');
    box.querySelector('.sgSub').textContent=cancel?'Este pedido fue cancelado':'Paso '+Math.max(1,hechos)+' de '+st.length;
    var al=box.querySelector('.sgAlerta'),inc=o.incidencia&&o.incidencia_resuelta!==true?'Problema reportado: '+o.incidencia:'';
    al.textContent=inc;al.hidden=!inc;
    var html='<h3 class="sgTit">Línea de tiempo</h3><div>'+st.map(function(s){
      var cls=s.ahora?'ahora':(s.hecho?'hecho':'pend');
      return '<div class="sgPaso '+cls+'"><div class="sgRiel"><span class="sgPto"></span>'+(s.ultimo?'':'<span class="sgLin"></span>')+'</div><div class="sgTxt"><b>'+E(s.n)+'</b>'+(s.s?'<span>'+E(s.s)+'</span>':'')+'</div>'+(s.ahora?'<span class="sgAhora">Ahora</span>':'<span class="sgHora">'+E(s.hecho?s.t:'')+'</span>')+'</div>';
    }).join('')+'</div>';
    var c=box.querySelector('.sgCuerpo'),top=c.scrollTop;
    if(c.__html!==html){c.innerHTML=html;c.__html=html;c.scrollTop=top}
  }
  function cerrar(){
    abiertoId=null;clearInterval(timer);timer=null;
    var b=document.getElementById('pdSeg'),v=document.getElementById('pdSegVelo');if(b){try{b.close()}catch(e){}b.remove()}if(v)v.remove();
    document.body.classList.remove('pd-seg-abierto');
  }
  function abrir(id){
    if(!id)return;cerrar();abiertoId=String(id);
    
    var b=document.createElement('dialog');b.id='pdSeg';b.setAttribute('role','dialog');b.setAttribute('aria-modal','true');b.setAttribute('aria-label','Seguimiento del pedido');
    b.innerHTML='<header class="sgCab"><span class="sgKick">Seguimiento del pedido</span><span class="sgCode"></span><span class="sgRuta"></span>'+
      '<button type="button" class="sgX" aria-label="Cerrar seguimiento">×</button>'+
      '<div class="sgEstado"><b></b><span class="sgChip"></span></div><div class="sgBarras"></div><span class="sgSub"></span><div class="sgAlerta" hidden></div></header>'+
      '<div class="sgCuerpo"></div>'+
      '<footer class="sgPie"><span class="sgVivo"><i></i>Se actualiza automáticamente</span><button type="button" class="sgVolver">'+E(cfg.textoVolver||'Volver al pedido')+'</button></footer>';
    b.querySelector('.sgX').addEventListener('click',cerrar);b.querySelector('.sgVolver').addEventListener('click',cerrar);
    document.body.appendChild(b);try{b.showModal()}catch(e){b.setAttribute('open','')}b.addEventListener('click',function(e){if(e.target===b)cerrar()});b.addEventListener('cancel',function(e){e.preventDefault();cerrar()});document.body.classList.add('pd-seg-abierto');
    pintar();timer=setInterval(function(){try{var d=document.getElementById('pdSeg');if(d&&!(d.matches&&d.matches(':modal'))&&document.body.lastElementChild!==d)document.body.appendChild(d)}catch(e){}pintar()},2000);try{if(!b.matches(':modal'))document.body.appendChild(b)}catch(e){}
    b.setAttribute('tabindex','-1');b.focus();
  }
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&abiertoId){e.stopImmediatePropagation();e.preventDefault();cerrar()}},true);
  window.pdSeguimiento={configurar:function(c){cfg=c||{}},abrir:abrir,cerrar:cerrar,pintar:pintar};
})();
