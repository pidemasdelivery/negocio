/* ===== Ventana de pedido común =====
   cfg.abierta(): elemento abierto o null      cfg.clave(el): id del pedido
   cfg.cabecera(el): cabecera de la ventana    cfg.cerrar(el): cierra
   cfg.acciones(el): botones que van fijos abajo (opcional) */
window.pdVentanaPedido=function(cfg){
  var ultimo=null,guardado={clave:null,top:0},trabajando=false;
  function velo(on){
    var v=document.getElementById('pdVelo');
    if(on&&!v){v=document.createElement('button');v.type='button';v.id='pdVelo';v.setAttribute('aria-label','Cerrar pedido');
      v.addEventListener('click',function(){var a=cfg.abierta();if(a)cfg.cerrar(a)});document.body.appendChild(v)}
    if(!on&&v)v.remove();
    if(document.body.classList.contains('pd-modal-abierto')!==!!on)document.body.classList.toggle('pd-modal-abierto',!!on);
  }
  function sync(){
    if(trabajando)return;trabajando=true;
    try{
      var a=cfg.abierta();velo(!!a||!!(cfg.pendiente&&cfg.pendiente()));
      if(!a){ultimo=null;if(!(cfg.pendiente&&cfg.pendiente()))guardado.clave=null;return}
      var k=cfg.clave(a),nueva=(a!==ultimo);
      if(nueva&&cfg.antes)cfg.antes(a);
      var h=cfg.cabecera(a);
      if(h&&!h.querySelector(':scope > .pdCerrarX')){
        var x=document.createElement('button');x.type='button';x.className='pdCerrarX';x.setAttribute('aria-label','Cerrar pedido');x.textContent='×';
        x.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var o=cfg.abierta();if(o)cfg.cerrar(o)});
        h.appendChild(x);
      }
      if(cfg.acciones){
        var bs=(cfg.acciones(a)||[]).filter(function(b){return b&&b.isConnected});
        var pie=a.querySelector(':scope > .pdPie');
        if(bs.length){
          if(!pie){pie=document.createElement('div');pie.className='pdPie'}
          bs.forEach(function(b){if(b.parentElement!==pie)pie.appendChild(b)});
          if(a.lastElementChild!==pie)a.appendChild(pie);
        }else if(pie&&!pie.children.length)pie.remove();
      }
      if(nueva){
        ultimo=a;
        if(k===guardado.clave){                                    /* misma orden redibujada: sin salto */
          var top=guardado.top;a.scrollTop=top;
          requestAnimationFrame(function(){if(ultimo===a&&Math.abs(a.scrollTop-top)>2)a.scrollTop=top});
          setTimeout(function(){if(ultimo===a&&Math.abs(a.scrollTop-top)>2)a.scrollTop=top},200);
        }else{guardado.clave=k;guardado.top=0;a.classList.add('pd-entrando');setTimeout(function(){a.classList.remove('pd-entrando')},260)}
      }
    }finally{trabajando=false}
  }
  document.addEventListener('scroll',function(e){
    var a=ultimo;if(a&&e.target===a){guardado.clave=cfg.clave(a);guardado.top=a.scrollTop}
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){var a=cfg.abierta();if(a)cfg.cerrar(a)}});
  /* Se ejecuta antes de pintar la pantalla, así la ventana no brinca */
  new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  sync();
  return sync;
};


(function(){
  function E(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function pedidos(){try{return (typeof businessOrders!=='undefined'&&Array.isArray(businessOrders))?businessOrders:[]}catch(e){return[]}}
  function sinMarcas(t){t=String(t==null?'':t);var re=/__PIDEMAS_[A-Z0-9_]+__/,m;while((m=re.exec(t))){var i=m.index,j=i+m[0].length,k=j;if(t.charAt(j)==='{'){var p=0;for(;k<t.length;k++){var c=t.charAt(k);if(c==='{')p++;else if(c==='}'){p--;if(!p){k++;break}}}}var h=t.slice(0,i).replace(/[\s·|]+$/,''),r=t.slice(k).replace(/^[\s·|]+/,'');t=h&&r?h+' · '+r:h+r}return t}
  function nota(obs){
    return sinMarcas(obs).split(/\s+[·|]\s+/).map(function(s){return s.trim()}).filter(function(s){
      return s&&s.indexOf('__PIDEMAS_')!==0&&s!=='PRODUCTO_MAYOR_18_VERIFICAR_DNI'&&!/^Pago Yape:/i.test(s)&&!/^Ubicaci[oó]n/i.test(s);
    }).join(' · ');
  }
  function comprobante(obs){
    var t=String(obs||''),m='__PIDEMAS_COMPROBANTE__',i=t.indexOf(m);if(i<0)return null;
    var j=i+m.length,p=0,k=j;for(;k<t.length;k++){if(t[k]==='{')p++;else if(t[k]==='}'){p--;if(!p){k++;break}}}
    try{var d=JSON.parse(t.slice(j,k));return d&&d.numero?d:null}catch(e){return null}
  }
  function descartables(obs){
    var t=String(obs||''),m='__PIDEMAS_DESCARTABLES__',i=t.indexOf(m);if(i<0)return null;
    var j=i+m.length,p=0,k=j;for(;k<t.length;k++){if(t[k]==='{')p++;else if(t[k]==='}'){p--;if(!p){k++;break}}}
    try{var d=JSON.parse(t.slice(j,k));return {nombres:(d.items||[]).map(function(x){return String(x.n||'')}).filter(Boolean),cubiertos:!!d.cubiertos}}catch(e){return {nombres:[],cubiertos:false}}
  }
  function completar(){
    var lista=pedidos();if(!lista.length)return;
    var mapa={};lista.forEach(function(o){mapa[String(o.id)]=o});
    document.querySelectorAll('#businessOrdersList article.x-order[data-order]').forEach(function(card){
      var o=mapa[card.getAttribute('data-order')];if(!o||card.querySelector(':scope > .pdNegInfo'))return;
      var filas=[];
      if(o.direccion_entrega)filas.push('<div class="pdNegFila"><span>Entrega</span><b>'+E(o.direccion_entrega)+'</b></div>');
      if(o.referencia_entrega)filas.push('<div class="pdNegFila"><span>Referencia</span><b>'+E(o.referencia_entrega)+'</b></div>');
      var dsc=descartables(o.observaciones);
      if(dsc){var nm=dsc.nombres.slice();if(dsc.cubiertos)nm.push('Cubiertos');filas.push('<div class="pdNegFila"><span>Incluir</span><b>'+E(nm.join(', ')||'Descartables')+'. No olvides ponerlos en el pedido.</b></div>')}
      var cp=comprobante(o.observaciones);
      if(cp){
        var tx=cp.tipo==='factura'
          ?'<b>FACTURA · RUC '+E(cp.numero)+'</b><b>'+E(cp.razon_social||'')+'</b>'+(cp.direccion_fiscal?'<b>'+E(cp.direccion_fiscal)+'</b>':'')
          :'<b>BOLETA · DNI '+E(cp.numero)+'</b>'+(cp.nombre?'<b>'+E(cp.nombre)+'</b>':'');
        filas.push('<div class="pdNegComp"><span>Comprobante solicitado</span>'+tx+'</div>');
      }
      var n=nota(o.observaciones);if(n)filas.push('<div class="pdNegNota">Nota del cliente: '+E(n)+'</div>');
      if(/PRODUCTO_MAYOR_18_VERIFICAR_DNI/.test(String(o.observaciones||'')))filas.push('<div class="pdNeg18">Producto +18: el motorizado verificará el DNI del cliente al entregar.</div>');
      if(!filas.length)return;
      var box=document.createElement('div');box.className='pdNegInfo';box.innerHTML=filas.join('');
      var top=card.querySelector(':scope > .x-oTop');
      if(top)card.insertBefore(box,top.nextSibling);else card.appendChild(box);
    });
  }
  var abiertoId=null;
  var sync=window.pdVentanaPedido({
    abierta:function(){
      if(!abiertoId)return null;
      var c=document.querySelector('#businessOrdersList article.x-order[data-order="'+abiertoId.replace(/"/g,'')+'"]');
      if(c&&!c.classList.contains('pd-abierto'))c.classList.add('pd-abierto');
      return c;
    },
    clave:function(a){return a.getAttribute('data-order')||''},
    pendiente:function(){return !!abiertoId},
    antes:function(){completar()},
    cabecera:function(a){return a.querySelector(':scope > .x-oTop')},
    acciones:function(a){return [].slice.call(a.querySelectorAll(':scope > .x-acts > button.x-btn:not(.light)'))},
    cerrar:function(a){abiertoId=null;a.classList.remove('pd-abierto');sync()}
  });
  document.addEventListener('click',function(e){
    var card=e.target.closest&&e.target.closest('#businessOrdersList article.x-order');
    if(!card||card.classList.contains('pd-abierto'))return;
    if(e.target.closest('button,a,input,select,textarea,label'))return;
    document.querySelectorAll('#businessOrdersList article.x-order.pd-abierto').forEach(function(x){x.classList.remove('pd-abierto')});
    abiertoId=card.getAttribute('data-order');card.classList.add('pd-abierto');completar();sync();
  });
  var t=null;function luego(){if(t)return;t=setTimeout(function(){t=null;completar()},150)}
  function iniciar(){completar();new MutationObserver(luego).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
})();
