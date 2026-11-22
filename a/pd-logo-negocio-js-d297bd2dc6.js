(function(){
  var MAX=512;
  function neg(){try{return restaurant}catch(e){return null}}
  var COLS=['logo_url','logo','imagen_logo_url','imagen_logo'];
  function col(r){for(var i=0;i<COLS.length;i++)if(r&&Object.prototype.hasOwnProperty.call(r,COLS[i]))return COLS[i];return 'logo_url'}
  function logoDe(r){return (r&&r[col(r)])||''}
  function ini(r){return (String((r&&r.nombre)||'N').trim().charAt(0)||'N').toUpperCase()}
  function msg(t,err){var m=document.getElementById('pdLogoMsg');if(!m)return;m.textContent=t||'';m.className=err?'err':''}
  function pintar(){
    var r=neg(),prev=document.getElementById('pdLogoPrev');if(!prev||!r)return;
    var url=logoDe(r),key=url+'|'+(r.nombre||'');
    if(prev.dataset.k!==key){
      prev.dataset.k=key;prev.textContent='';
      if(url){var im=new Image();im.alt='';im.onerror=function(){prev.textContent=ini(r)};im.src=url;prev.appendChild(im)}else prev.textContent=ini(r);
    }
    var del=document.getElementById('pdLogoDel');if(del)del.style.display=url?'':'none';
    var lab=document.getElementById('pdLogoLbl');if(lab&&!lab.dataset.busy)lab.firstChild.nodeValue=url?'Cambiar logo':'Subir logo';
    var L=document.getElementById('pdxLogo');if(L&&L.dataset.k!==key){L.dataset.k=key;L.textContent='';if(url){var i2=new Image();i2.alt='';i2.src=url;L.appendChild(i2)}else L.textContent=ini(r)}
    document.querySelectorAll('.pnaLogo').forEach(function(x){if(x.dataset.k!==key){x.dataset.k=key;x.textContent='';if(url){var i3=new Image();i3.alt='';i3.src=url;x.appendChild(i3)}else x.textContent=ini(r)}});
  }
  function reducir(file){
    return new Promise(function(ok,fail){
      var u=URL.createObjectURL(file),im=new Image();
      im.onload=function(){
        try{
          var s=Math.min(1,MAX/Math.max(im.naturalWidth,im.naturalHeight)),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
          var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);
          c.toBlob(function(b){URL.revokeObjectURL(u);b?ok(b):fail(new Error('No se pudo procesar la imagen.'))},'image/webp',.88);
        }catch(e){URL.revokeObjectURL(u);fail(e)}
      };
      im.onerror=function(){URL.revokeObjectURL(u);fail(new Error('No se pudo leer la imagen.'))};
      im.src=u;
    });
  }
  function aDataUrl(blob){return new Promise(function(ok,fail){var fr=new FileReader();fr.onload=function(){ok(fr.result)};fr.onerror=function(){fail(new Error('No se pudo procesar la imagen.'))};fr.readAsDataURL(blob)})}
  async function guardarUrl(url){
    var r=neg(),c=col(r),o={};o[c]=url;
    var res=await db.from('negocios').update(o).eq('id',r.id).select('*').maybeSingle();
    if(res.error){
      var t=String(res.error.message||'');
      if(/logo/i.test(t)&&/column|schema/i.test(t))throw new Error('Falta la columna '+c+' en la tabla negocios de Supabase.');
      throw res.error;
    }
    if(!res.data)throw new Error('No se pudo guardar el logo. Revisa los permisos (RLS) de la tabla negocios.');
    restaurant=res.data;
  }
  async function subir(file){
    var r=neg();if(!r||!r.id)return;
    if(!/^image\//.test(file.type||'')){msg('Elige una imagen (JPG, PNG o WebP).',true);return}
    var lab=document.getElementById('pdLogoLbl');
    lab.dataset.busy='1';lab.setAttribute('aria-busy','true');lab.firstChild.nodeValue='Subiendo…';msg('');
    try{
      var blob=await reducir(file),ext=blob.type==='image/png'?'png':'webp',url;
      var path='logos/'+r.id+'.'+ext;
      try{
        var b=db.storage.from('negocios');
        var up=await b.upload(path,blob,{upsert:true,contentType:blob.type||'image/webp',cacheControl:'3600'});
        if(up.error)throw up.error;
        url=b.getPublicUrl(path).data.publicUrl+'?v='+Date.now();
      }catch(e){
        console.warn('[logo] Storage no disponible, se guarda comprimido en la base de datos',e);
        url=await aDataUrl(blob);
      }
      await guardarUrl(url);
      msg('Logo guardado. Ya se ve en la tienda.');
    }catch(e){
      console.error('[logo]',e);msg(e&&e.message?e.message:'No se pudo subir el logo.',true);
    }finally{
      delete lab.dataset.busy;lab.removeAttribute('aria-busy');pintar();
    }
  }
  async function quitar(){
    var r=neg();if(!r||!r.id)return;
    if(!(await pdConfirmar('¿Quitar el logo? En la tienda se verá la inicial del negocio.')))return;
    try{
      var old=String(logoDe(r)),mk='/storage/v1/object/public/negocios/',i=old.indexOf(mk);
      await guardarUrl(null);
      if(i>=0){try{await db.storage.from('negocios').remove([decodeURIComponent(old.slice(i+mk.length).split('?')[0])])}catch(e){}}
      msg('Logo quitado.');
    }catch(e){msg(e&&e.message?e.message:'No se pudo quitar el logo.',true)}
    pintar();
  }
  function montar(){
    var host=document.getElementById('pdxS1')||document.getElementById('perfilCamposInline');if(!host)return;
    var box=document.getElementById('pdLogoBox');
    if(box){
      if(host.id==='pdxS1'&&box.parentNode!==host)host.insertBefore(box,host.firstChild);
      return;
    }
    box=document.createElement('div');box.id='pdLogoBox';box.className='pdLogoBox';
    box.innerHTML='<span class="pdLogoPrev" id="pdLogoPrev"></span><div class="pdLogoTx"><strong>Logo del negocio</strong><small>Se muestra en la tienda junto al nombre de tu negocio. Mejor cuadrado y con buen contraste.</small><div class="pdLogoBtns"><label class="pdLogoBtn" id="pdLogoLbl" for="pdLogoFile">Subir logo</label><button type="button" class="pdLogoBtn pdLogoDel" id="pdLogoDel" style="display:none">Quitar</button></div><span id="pdLogoMsg" aria-live="polite"></span></div><input id="pdLogoFile" type="file" accept="image/png,image/jpeg,image/webp" hidden>';
    host.insertBefore(box,host.firstChild);
    document.getElementById('pdLogoFile').addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];e.target.value='';if(f)subir(f)});
    document.getElementById('pdLogoDel').addEventListener('click',quitar);
    pintar();
  }
  var t=null;
  new MutationObserver(function(){if(t)return;t=setTimeout(function(){t=null;montar()},150)}).observe(document.body,{childList:true,subtree:true});
  setInterval(function(){montar();pintar()},1500);
  document.addEventListener('DOMContentLoaded',montar);
  montar();
})();
