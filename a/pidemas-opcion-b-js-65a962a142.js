(function(){
  var money=function(n){return 'S/ '+(Number(n)||0).toFixed(2)};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
  function corto(n){var p=String(n||'Cliente').trim().split(/\s+/);return p.length>1?p[0]+' '+p[1].charAt(0).toUpperCase()+'.':p[0]}
  function lista(){try{return Array.isArray(businessOrders)?businessOrders:[]}catch(e){return[]}}
  window.pdbOpen=function(id){
    var c=document.querySelector('#businessOrdersList article.x-order[data-order="'+CSS.escape(String(id))+'"]');
    if(!c||c.classList.contains('pd-abierto'))return;
    var h=c.querySelector(':scope > .x-oTop')||c;h.click();
  };
  function armar(card){
    if(card.querySelector(':scope > .pdbBody'))return;
    var id=card.getAttribute('data-order'),o=lista().find(function(x){return String(x.id)===String(id)});
    if(!o)return;
    var st=(card.querySelector('.x-stepTxt')||{}).textContent||'';
    var nuevo=card.classList.contains('new'),cobrar=/^Coordina el pago con/i.test(st),prep=/^Prepara el pedido/i.test(st);
    var det=Array.isArray(o.detalle_pedidos)?o.detalle_pedidos:[];
    var sum=det.map(function(x){return (Math.max(1,Number(x.cantidad)||1))+' × '+(x.nombre_producto||x.nombre||'Producto')}).join(', ')||'Detalle no disponible';
    var code='#'+String(id).slice(0,8).toUpperCase();
    var main='';
    if(nuevo)main='<button type="button" class="pdbMain" onclick="pdbOpen(\''+esc(id)+'\')">Aceptar pedido</button>';
    else if(cobrar)main='<button type="button" class="pdbMain" onclick="businessConfirmPayment(\''+esc(id)+'\')">Pago recibido</button>';
    else if(prep)main='<button type="button" class="pdbMain" onclick="businessMarkReady(\''+esc(id)+'\')">Pedido listo</button>';
    var b=document.createElement('div');b.className='pdbBody';
    var pillTxt=nuevo?'Nuevo · Por aceptar':(cobrar?'Por cobrar':(prep?'Preparando':(st||'En proceso')));
    b.innerHTML='<div class="pdMList"><div class="pdMListTop"><span class="pdMListKicker">'+esc(corto(o.nombre_cliente))+'</span><span class="pdMListPill'+(nuevo?' is-new':'')+'">'+esc(pillTxt)+'</span></div>'
      +'<div class="pdMListCode">'+esc(code)+'</div>'
      +'<div class="pdMListMeta">'+esc(sum)+'</div>'
      +'<div class="pdMListFoot"><span>Total del pedido</span><strong>'+money(o.total)+'</strong></div></div>'
      +'<div class="pdbBtns">'+main+'<button type="button" class="pdbDet" onclick="pdbOpen(\''+esc(id)+'\')">Detalle</button></div>';
    card.insertBefore(b,card.firstChild);
  }
  var NOM={'Nuevos por confirmar':'Nuevos','En preparación':'Preparando','Listos y en camino':'Listos'};
  function pintar(){
    document.querySelectorAll('#businessOrdersList article.x-order[data-order]').forEach(armar);
    document.querySelectorAll('#pnaSeg button[data-f]').forEach(function(b){
      var n=b.firstChild;if(n&&n.nodeType===3){var t=n.textContent.trim();if(NOM[t])n.textContent=NOM[t]}
    });
    var ab=document.querySelector('#businessOrdersList article.pd-abierto > .x-oTop');
    if(ab){
      var k=ab.querySelector('.x-kick');if(k&&k.textContent.indexOf(' · ')>0)k.textContent=k.textContent.split(' · ')[0];
      var e=ab.querySelector('.x-stepTxt');if(e&&/^Nuevo · /.test(e.textContent)){var tx=e.textContent.replace(/^Nuevo · /,'');e.textContent=tx.charAt(0).toUpperCase()+tx.slice(1)}
    }
    var h=document.querySelector('.pdpm-head h2');
    if(h&&h.textContent!=='Pedidos'){h.textContent='Pedidos'}
  }
  var t=null;function luego(){if(t)return;t=setTimeout(function(){t=null;try{pintar()}catch(e){}},80)}
  new MutationObserver(luego).observe(document.body,{childList:true,subtree:true});
  setInterval(luego,2000);luego();
})();
