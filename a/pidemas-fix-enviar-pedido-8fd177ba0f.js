(function(){
  /* 1) Los mensajes de error/éxito quedaban detrás del modal: ahora también salen en un aviso por encima de todo. */
  function toast(t,bad){
    let b=document.getElementById('pdFixToast');
    if(!b){b=document.createElement('div');b.id='pdFixToast';b.style.cssText='position:fixed;left:12px;right:12px;top:12px;z-index:2147483647;padding:14px 16px;border-radius:14px;font:700 14px/1.4 Inter,Arial,sans-serif;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.35)';document.body.appendChild(b)}
    b.style.background=bad?'#B42318':'#1B7F3B';b.textContent=t;b.hidden=false;
    clearTimeout(b._t);b._t=setTimeout(()=>{b.hidden=true},bad?9000:3500);
  }
  const showOrig=window.show;
  window.show=function(e,t){
    try{if(e&&e.id==='businessOrdersMsg'&&t&&!/^No se pudieron cargar los pedidos/i.test(t))toast(t,/no se pudo|primero|bloque|error|rls|permiso/i.test(t))}catch(x){}
    return showOrig.apply(this,arguments);
  };
  /* 2) Si Supabase rechaza el envío por una columna que no existe, reintenta sin esa columna para no bloquear el pedido. */
  window.updateBusinessOrder=async function(id,patch,success){
    const btns=[...document.querySelectorAll(`[data-business-order="${CSS.escape(String(id))}"]`)];
    btns.forEach(x=>x.disabled=true);
    const omitidas=[];
    try{
      if(!session?.user?.id) throw new Error('La sesión expiró. Cierra sesión e ingresa nuevamente.');
      if(!restaurant?.id) throw new Error('No se identificó el negocio de esta sesión.');
      let p={...patch},data=null,error=null;
      for(let i=0;i<8;i++){
        const r=await db.from('pedidos').update(p).eq('id',id).eq('negocio_id',restaurant.id).select('id').maybeSingle();
        data=r.data;error=r.error;
        if(!error)break;
        const m=String(error.message||'').match(/'([a-z0-9_]+)' column|column "?([a-z0-9_]+)"?/i);
        const col=m&&(m[1]||m[2]);
        if(col&&col in p){delete p[col];omitidas.push(col);continue}
        break;
      }
      if(error){
        if(/row-level security|permission denied/i.test(String(error.message)))throw new Error('Supabase bloqueó el envío por permisos (RLS): falta una política UPDATE para el negocio en public.pedidos.');
        throw new Error(error.message||String(error));
      }
      if(!data)throw new Error('Supabase no actualizó ningún pedido: falta la política UPDATE (RLS) del negocio en public.pedidos, o el pedido no es de este negocio.');
      if(omitidas.length)console.warn('Columnas que no existen en pedidos y se omitieron:',omitidas);
      show($('businessOrdersMsg'),success+(omitidas.length?' (Aviso: faltan columnas en la base: '+omitidas.join(', ')+')':''));
      if(typeof closePdxSheet==='function'){try{closePdxSheet()}catch(e){}}
      await loadBusinessOrders();
    }catch(e){
      console.error('No se pudo enviar el pedido:',e);
      show($('businessOrdersMsg'),'No se pudo actualizar el pedido: '+(e?.message||String(e)));
      btns.forEach(x=>x.disabled=false);
    }
  };
})();
