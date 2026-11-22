/* El motorizado cobró con tu Yape: confirma si te llegó. La respuesta le llega directo al motorizado. */
(function(){
  if(window.__pdYNN)return;window.__pdYNN=1;
  const D=()=>{try{return db}catch(e){return window.db}};
  const R=()=>{try{return restaurant}catch(e){return null}};
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cod=id=>'#'+String(id||'').replace(/-/g,'').slice(0,8).toUpperCase();
  let cola=[],abierto=null,avisados={};
  function cerrar(){const ov=document.getElementById('pdYNOv');if(ov){ov.classList.remove('open');setTimeout(()=>ov.remove(),180)}if(!document.getElementById('pdnOv'))document.documentElement.classList.remove('pdnOvOpen');abierto=null}
  function mostrar(p){
    abierto=p.id;
    let ov=document.getElementById('pdYNOv');if(ov)ov.remove();
    ov=document.createElement('div');ov.id='pdYNOv';
    ov.innerHTML='<div class="sh" role="dialog" aria-modal="true" aria-labelledby="pdYNT"><div class="hd"><h2 id="pdYNT">¿Te llegó el Yape?</h2></div><div class="bd">'
      +'<div class="mt"><small>Pedido '+E(cod(p.id))+(p.nombre_cliente?' · '+E(p.nombre_cliente):'')+'</small><b>'+E(money(p.total))+'</b></div>'
      +'<p>El motorizado dice que el cliente ya te yapeó. Revisa tu app de Yape y responde: <b>el motorizado recibe tu respuesta al instante</b>.</p>'
      +'<button type="button" class="si">Sí, me llegó</button><button type="button" class="no">No me llegó</button><p class="er" hidden></p></div></div>';
    (function(){const st=(el,o)=>{for(const k in o)el.style.setProperty(k,o[k],'important')};
      st(ov.querySelector('.sh'),{'border-radius':'24px 24px 0 0','border':'0','box-shadow':'none','margin':'0','padding':'0','background':'#fff','overflow':'hidden'});
      st(ov.querySelector('.hd'),{'border-radius':'0','border':'0','border-bottom':'1px solid #EFE3DA','box-shadow':'none','margin':'0','background':'#fff'});
      st(ov.querySelector('.bd'),{'border-radius':'0','border':'0','box-shadow':'none','margin':'0','background':'#FFF9F5','padding-bottom':'calc(20px + env(safe-area-inset-bottom,0px))'});})();
    document.body.appendChild(ov);document.documentElement.classList.add('pdnOvOpen');requestAnimationFrame(()=>ov.classList.add('open'));
    const er=ov.querySelector('.er');
    const resp=async(v,btn)=>{ov.querySelectorAll('button').forEach(b=>b.disabled=true);er.hidden=true;
      const {error}=await D().from('pedidos').update({yape_negocio_estado:v,yape_negocio_en:new Date().toISOString()}).eq('id',p.id).eq('yape_negocio_estado','esperando');
      if(error){er.textContent='No se pudo enviar: '+error.message;er.hidden=false;ov.querySelectorAll('button').forEach(b=>b.disabled=false);return}
      try{const o=(typeof businessOrders!=='undefined'?businessOrders:[]).find(x=>String(x.id)===String(p.id));if(o)o.yape_negocio_estado=v}catch(e){}
      cola=cola.filter(x=>x.id!==p.id);cerrar();
      (window.pdExito||window.pdAviso||function(){})(v==='llego'?'Listo: le avisamos al motorizado que te llegó el Yape':'Le avisamos al motorizado que no te llegó el Yape');
      setTimeout(siguiente,400)};
    ov.querySelector('.si').onclick=e=>resp('llego',e.currentTarget);
    ov.querySelector('.no').onclick=e=>resp('no_llego',e.currentTarget);
  }
  function siguiente(){if(abierto||!cola.length)return;mostrar(cola[0])}
  async function buscar(){
    const r=R();if(!r||!r.id||!D())return;
    try{const {data,error}=await D().from('pedidos').select('id,total,nombre_cliente,yape_negocio_estado,yape_negocio_en').eq('negocio_id',r.id).eq('yape_negocio_estado','esperando').order('yape_negocio_en',{ascending:true});
      if(error)return;cola=data||[];
      if(abierto&&!cola.some(x=>x.id===abierto))cerrar();
      cola.forEach(p=>{if(!avisados[p.id]){avisados[p.id]=1;try{window.pdAlert&&window.pdAlert({kind:'nuevo',pedidoId:p.id,title:'¿Te llegó el Yape? '+cod(p.id),text:'El cliente dice que yapeó '+money(p.total)+'. Confírmalo.'})}catch(e){}}});
      siguiente();
    }catch(e){}
  }
  setInterval(buscar,5000);setTimeout(buscar,1500);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')buscar()});
  window.pdYapeNegocioBuscar=buscar;
})();
