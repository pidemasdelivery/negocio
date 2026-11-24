const SUPABASE_URL='https://escxesvzndmyfuteawey.supabase.co',SUPABASE_KEY='sb_publishable_pCP210JJcN3NP3a6Y2c--w_c7C0PjaU',db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{storageKey:'pidemas-negocio-sesion',persistSession:true,autoRefreshToken:true}});const $=id=>document.getElementById(id);let session=null,restaurant=null,products=[],categories=[];
window.addEventListener('DOMContentLoaded',()=>{if($('copiarEnlaceCarta'))$('copiarEnlaceCarta').addEventListener('click',copiarEnlaceIndividualCarta);if($('compartirEnlaceCarta'))$('compartirEnlaceCarta').addEventListener('click',compartirEnlaceIndividualCarta);if($('verMiCarta'))$('verMiCarta').addEventListener('click',verEnlaceIndividualCarta);});
function show(e,t){if(e){e.textContent=t;e.classList.remove('hidden')}}function hide(e){if(e)e.classList.add('hidden')}function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}function stockCol(p){return ['stock','stock_actual','cantidad_stock','existencias','cantidad_disponible'].find(k=>Object.prototype.hasOwnProperty.call(p||{},k))||null}
function getEnlaceIndividualCarta(){
  if(!restaurant?.id) return '';
  // Apuntar explícitamente al archivo público de la tienda, no a la raíz genérica
  // que el hosting podría resolver hacia otra página.
  const url=new URL('https://pidemas.pe/');
  url.searchParams.set('negocio',String(restaurant.id));
  return url.toString();
}
function actualizarEnlaceIndividualCarta(){
  const input=$('miEnlaceCartaUrl');
  if(!input||!restaurant?.id)return;
  input.value=getEnlaceIndividualCarta();
  const titulo=$('miEnlaceCartaTitulo');
  if(titulo)titulo.textContent='Mi enlace de carta';
}
function mensajeEnlaceCarta(texto){const e=$('miEnlaceCartaMsg');if(e){e.textContent=texto;e.classList.remove('hidden');}}
async function copiarEnlaceIndividualCarta(){
  const url=getEnlaceIndividualCarta();if(!url){mensajeEnlaceCarta('No se pudo generar el enlace. Vuelve a ingresar al panel.');return;}
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);}else{const i=$('miEnlaceCartaUrl');i.focus();i.select();if(!document.execCommand('copy'))throw new Error('copy failed');}
    mensajeEnlaceCarta('Enlace copiado. Ya puedes enviarlo a tus clientes.');
  }catch(e){const i=$('miEnlaceCartaUrl');i.focus();i.select();mensajeEnlaceCarta('Seleccionamos el enlace. Mantén presionado y elige Copiar.');}
}
function compartirEnlaceIndividualCarta(){
  const url=getEnlaceIndividualCarta();if(!url){mensajeEnlaceCarta('No se pudo generar el enlace. Vuelve a ingresar al panel.');return;}
  const nombre=restaurant?.nombre||'nuestro negocio';
  const texto=`¡Hola! Visita la carta de ${nombre} en Pidemás y realiza tu pedido aquí: ${url}`;
  window.open('https://wa.me/?text='+encodeURIComponent(texto),'_blank','noopener,noreferrer');
}
function verEnlaceIndividualCarta(){const url=getEnlaceIndividualCarta();if(url)window.open(url,'_blank','noopener,noreferrer');}
function setupLoginOptions(){const key='pidemas_negocio_remember_email',saved=localStorage.getItem(key);if(saved){$('email').value=saved;$('rememberMe').checked=true}$('togglePassword').onclick=()=>{const i=$('password'),s=i.type==='password';i.type=s?'text':'password';$('togglePassword').textContent=s?'◉':'◌';$('togglePassword').setAttribute('aria-label',s?'Ocultar contraseña':'Mostrar contraseña');$('togglePassword').setAttribute('title',s?'Ocultar contraseña':'Mostrar contraseña')}}
async function login(){const btn=$('loginBtn');hide($('loginMsg'));btn.disabled=true;btn.textContent='Ingresando...';try{const email=$('email').value.trim();const password=$('password').value;if(!email||!password){show($('loginMsg'),'Ingresa tu correo y contraseña.');return}const {data,error}=await db.auth.signInWithPassword({email,password});if(error)throw error;if(!data?.session?.user?.id)throw new Error('No se pudo iniciar la sesión.');if($('rememberMe').checked)localStorage.setItem('pidemas_negocio_remember_email',email);else localStorage.removeItem('pidemas_negocio_remember_email');session=data.session;await enter(session.user.id)}catch(e){console.error('Error de ingreso:',e);show($('loginMsg'),e?.message||'No se pudo ingresar.')}finally{btn.disabled=false;btn.textContent='Ingresar'}}
async function findRestaurant(uid){
  // Cuentas actuales conocidas. El acceso no depende de que Supabase tenga
  // actualizada la tabla de vinculación: primero resolvemos por usuario/email.
  const respaldo={
    '62315112-1a39-4c89-9f08-2075d97ff9b9':'658f5cc7-0bc8-436d-af4b-39101e5e6012',
    '91ebe043-0b62-4569-be3f-c4fc9576cfad':'623072f5-fafb-4519-b3aa-5354082ad836'
  };
  let negocioId=respaldo[uid]||null;
  const email=String(session?.user?.email||'').trim().toLowerCase();
  if(!negocioId && email==='cjotas@grupopidemas.com') negocioId='658f5cc7-0bc8-436d-af4b-39101e5e6012';
  if(!negocioId && email==='laperamadura@grupopidemas.com') negocioId='623072f5-fafb-4519-b3aa-5354082ad836';

  // Solo para cuentas no conocidas, intentar la tabla de vinculación.
  if(!negocioId){
    const r=await db.from('negocio_usuarios').select('negocio_id').eq('usuario_id',uid).maybeSingle();
    if(r.error) console.warn('Vinculación no disponible:',r.error.message);
    negocioId=r.data?.negocio_id||null;
  }
  if(!negocioId)return null;

  // Intentamos traer todos los datos. Si RLS impide leer la fila, no
  // bloqueamos el ingreso de una cuenta ya identificada.
  const rr=await db.from('negocios').select('*').eq('id',negocioId).maybeSingle();
  if(rr.error){
    console.warn('No se pudo leer negocios:',rr.error.message);
    return {id:negocioId,nombre:email==='cjotas@grupopidemas.com'?'Cjotas':'La Pera Madura'};
  }
  return rr.data||{id:negocioId,nombre:email==='cjotas@grupopidemas.com'?'Cjotas':'La Pera Madura'};
}
// Horario predeterminado para negocios cuyo campo está vacío.
// Nunca reemplaza un horario que ya exista.
const HORARIO_PREDETERMINADO_NEGOCIO = [
  'lunes=17:00-22:00',
  'martes=17:00-22:00',
  'miercoles=17:00-22:00',
  'jueves=17:00-22:00',
  'viernes=17:00-22:00',
  'sabado=17:00-22:00',
  'domingo=17:00-22:00'
].join('|');
async function asegurarHorarioPredeterminado(){
  if(!restaurant?.id) return false;
  const actual = String(restaurant.horario ?? restaurant.horarios ?? restaurant.horario_atencion ?? restaurant.horario_atencion_negocio ?? '').trim();
  // Respetar íntegramente cualquier horario ya configurado.
  if(actual) return true;
  const {error,count} = await db.from('negocios')
    .update({horario: HORARIO_PREDETERMINADO_NEGOCIO},{count:'exact'})
    .eq('id',restaurant.id);
  if(error) throw error;
  if(count !== 1) throw new Error('No se pudo guardar el horario predeterminado. Revisa los permisos UPDATE de Supabase en negocios.');
  restaurant.horario = HORARIO_PREDETERMINADO_NEGOCIO;
  return true;
}

async function enter(uid){
  let profile=null;
  try{const pr=await db.from('perfiles').select('*').eq('id',uid).maybeSingle();if(!pr.error)profile=pr.data||null}catch(e){console.warn('No se pudo leer perfil:',e)}
  if(profile?.activo===false){show($('loginMsg'),'Esta cuenta está inactiva.');return}
  /* Cuenta de otro panel (motorizado o administrador): no es un negocio */
  if(profile&&['motorizado','administrador'].includes(String(profile.rol||''))){try{await db.auth.signOut({scope:'local'})}catch(e){}show($('loginMsg'),'Esta cuenta es de '+profile.rol+'. Este panel es solo para negocios: entra con la cuenta de tu negocio.');return}
  try{restaurant=await findRestaurant(uid)}catch(e){console.error('Error de vinculación:',e);show($('loginMsg'),'No se pudo verificar la vinculación del negocio: '+(e?.message||'error desconocido'));return}
  if(!restaurant){show($('loginMsg'),'Esta cuenta todavía no está vinculada a un negocio. Verifica la vinculación en Supabase.');return}
  // Al primer ingreso, completar solo los perfiles sin horario. Los horarios
  // existentes no se modifican. Si Supabase no permite guardar, se informa
  // sin impedir el acceso al panel.
  try{await asegurarHorarioPredeterminado()}catch(e){
    console.error('No se pudo aplicar el horario predeterminado:',e);
    setTimeout(()=>show($('appMsg'),'No se pudo guardar el horario predeterminado. Revisa los permisos de Supabase: '+(e?.message||'error desconocido')),0);
  }
  // Un negocio inactivo puede entrar al panel para volver a activarse.
  $('welcome').textContent='Hola, '+(restaurant.nombre||profile?.nombre_completo||'Negocio');
  actualizarEnlaceIndividualCarta();
  $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');$('logout').classList.remove('hidden');$('nav').classList.remove('hidden');
  switchPanelTab('pedidos');
  try{await ensureDefaultCategories()}catch(e){console.warn('Categorías predeterminadas no creadas:',e?.message||e)}
  await loadCategories();await loadProducts();await loadBusinessOrders();if(window.pidemasBusinessOrdersTimer)clearInterval(window.pidemasBusinessOrdersTimer);window.pidemasBusinessOrdersTimer=setInterval(()=>{if(restaurant?.id)loadBusinessOrders()},8000)
}
function defaultCategoryNames(){
  const name=String(restaurant?.nombre||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(name.includes('cjotas')) return ['Ceviches','Sudados','Chicharrones','Criollos','Guarniciones'];
  if(name.includes('pera madura') || name==='la pera') return ['Platos','Complementos','Bebidas','Postres'];
  return [];
}
async function ensureDefaultCategories(){
  const wanted=defaultCategoryNames();
  if(!wanted.length)return;
  const {data,error}=await db.from('categorias_negocio').select('id,nombre,descripcion,activo').eq('negocio_id',restaurant.id);
  if(error)throw error;
  const existing=new Set((data||[]).map(c=>String(c.nombre||'').trim().toLowerCase()));
  for(const nombre of wanted){
    if(existing.has(nombre.toLowerCase()))continue;
    const r=await db.from('categorias_negocio').insert({negocio_id:restaurant.id,nombre,descripcion:null,activo:true});
    if(r.error)throw r.error;
  }
}
async function loadCategories(){
  const {data,error}=await db.from('categorias_negocio').select('*').eq('negocio_id',restaurant.id);
  if(error){show($('appMsg'),'No se pudieron cargar las categorías: '+error.message);return}
  const wanted=defaultCategoryNames().map(x=>x.toLowerCase());
  categories=(data||[]).sort((a,b)=>{
    const ao=Number(a.orden),bo=Number(b.orden);
    const av=Number.isFinite(ao)&&ao>0?ao:999999;
    const bv=Number.isFinite(bo)&&bo>0?bo:999999;
    if(av!==bv)return av-bv;
    const ai=wanted.indexOf(String(a.nombre||'').trim().toLowerCase());
    const bi=wanted.indexOf(String(b.nombre||'').trim().toLowerCase());
    const aw=ai<0?9999:ai,bw=bi<0?9999:bi;
    return aw-bw || String(a.nombre||'').localeCompare(String(b.nombre||''));
  });
  renderCategories();
}
function renderCategories(){$('pCategoria').innerHTML='<option value="">Sin categoría</option>';categories.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.nombre;$('pCategoria').appendChild(o)});$('categoryList').innerHTML=categories.length?categories.map(c=>`<div class="productCard"><div class="productTop"><div><b>${esc(c.nombre)}</b><div class="muted">${esc(c.descripcion||'')}</div></div></div><div class="actions"><button class="btn alt" onclick="editCategory('${c.id}')">Editar</button><button class="btn alt" onclick="deleteCategory('${c.id}')">Eliminar</button></div></div>`).join(''):'<div class="empty">Todavía no tienes categorías.</div>'}
window.editCategory=async id=>{const c=categories.find(x=>String(x.id)===String(id));if(!c)return;const n=(await pdPedir('Nombre de la categoría:',c.nombre||''));if(n===null)return;const d=(await pdPedir('Descripción:',c.descripcion||''));if(d===null)return;const {error}=await db.from('categorias_negocio').update({nombre:n.trim(),descripcion:d.trim()||null}).eq('id',id).eq('negocio_id',restaurant.id);if(error){pdAviso('No se pudo editar la categoría.');return}await loadCategories();await loadProducts()};window.toggleCategory=async id=>{const c=categories.find(x=>String(x.id)===String(id));if(!c)return;const nuevoEstado=c.activo===false;const accion=nuevoEstado?'mostrar':'ocultar';if(!(await pdConfirmar(`¿${accion.charAt(0).toUpperCase()+accion.slice(1)} esta categoría completa en la tienda?`)))return;try{const {error}=await db.from('categorias_negocio').update({activo:nuevoEstado}).eq('id',id).eq('negocio_id',restaurant.id);if(error)throw error;await loadCategories();await loadProducts()}catch(e){pdAviso('No se pudo cambiar el estado de la categoría: '+(e?.message||'Revisa los permisos de categorias_negocio.'))}};window.deleteCategory=async id=>{if(!(await pdConfirmar('¿Eliminar esta categoría?')))return;const {error}=await db.from('categorias_negocio').delete().eq('id',id).eq('negocio_id',restaurant.id);if(error){pdAviso('No se pudo eliminar la categoría.');return}await loadCategories();await loadProducts()};
async function loadProducts(){
  let {data,error}=await db.from('productos_negocio').select('*').eq('negocio_id',restaurant.id).order('orden',{ascending:true});
  if(error){/* conexión lenta o respuesta muy pesada: primero la lista sin fotos y luego las fotos */
    const r2=await db.from('productos_negocio').select('id,negocio_id,categoria_id,nombre,descripcion,precio,precio_antes,disponible,stock,orden,variantes,creado_en').eq('negocio_id',restaurant.id).order('orden',{ascending:true});
    if(r2.error){show($('appMsg'),'No se pudieron cargar los productos: '+error.message);if(window.pdAviso&&!products.length)pdAviso('No se pudieron cargar tus productos. Revisa tu internet y toca actualizar.');return}
    data=(r2.data||[]).map(p=>{const old=(products||[]).find(x=>String(x.id)===String(p.id));return Object.assign({imagen_url:old?old.imagen_url:null,fotos:old?old.fotos:null},p)});
    setTimeout(()=>pdFotosProductos(data.map(p=>p.id)),50);
  }
  products=data||[];
  setTimeout(pdMigrarFotos,1500);
  // La categoría de cada producto siempre se relaciona con el ID de
  // categorias_negocio del mismo negocio. No se usa el nombre como clave.
  const validCategoryIds=new Set((categories||[]).map(c=>String(c.id)));
  products.forEach(p=>{
    if(p.categoria_id && !validCategoryIds.has(String(p.categoria_id))){
      console.warn('categoria_id no pertenece a las categorías de este negocio:',p.id,p.categoria_id);
    }
  });
  renderProducts()
}
/* Fotos que quedaron guardadas dentro de la base de datos (porque Storage fallaba): se cargan aparte
   y se pasan a Storage una sola vez, para que la carta cargue rápido y no desaparezca. */
async function pdFotosProductos(ids){
  for(let i=0;i<ids.length;i+=4){const part=ids.slice(i,i+4);
    try{const {data}=await db.from('productos_negocio').select('id,imagen_url,fotos').in('id',part);(data||[]).forEach(d=>{const p=products.find(x=>String(x.id)===String(d.id));if(p){p.imagen_url=d.imagen_url;p.fotos=d.fotos}});renderProducts();try{window.pdAppNeg&&pdAppNeg.pintar&&pdAppNeg.pintar()}catch(_){}}catch(_){}}
}
let pdMigrando=false;
async function pdSubirDataUrl(u,pid,suf){const blob=await (await fetch(u)).blob();const ext=(blob.type.split('/')[1]||'jpg').replace('jpeg','jpg');const path=`productos/${restaurant.id}/${pid}${suf}-${Date.now()}.${ext}`;
  const b=db.storage.from('restaurantes');const {error}=await b.upload(path,blob,{upsert:false,contentType:blob.type||'image/jpeg',cacheControl:'31536000'});if(error)throw error;return b.getPublicUrl(path).data.publicUrl}
async function pdMigrarFotos(){
  if(pdMigrando||!restaurant||!restaurant.id)return;pdMigrando=true;
  try{for(const p of (products||[]).slice()){
    const esD=u=>typeof u==='string'&&u.startsWith('data:image');
    let fotos=p.fotos;try{if(typeof fotos==='string')fotos=JSON.parse(fotos)}catch(_){fotos=null}
    const tieneF=Array.isArray(fotos)&&fotos.some(esD);if(!esD(p.imagen_url)&&!tieneF)continue;
    try{const patch={};if(esD(p.imagen_url))patch.imagen_url=await pdSubirDataUrl(p.imagen_url,p.id,'');
      if(tieneF){const nf=[];for(const f of fotos)nf.push(esD(f)?await pdSubirDataUrl(f,p.id,'_f'):f);patch.fotos=nf}
      const {error}=await db.from('productos_negocio').update(patch).eq('id',p.id).eq('negocio_id',restaurant.id);if(error)throw error;Object.assign(p,patch);
    }catch(e){console.warn('[fotos] no se pudo pasar a Storage',p.id,e);break}
  }}finally{pdMigrando=false}
}
function renderProducts(){
  if(!products.length){$('productList').innerHTML='<div class="empty">Todavía no tienes productos en tu carta.</div>';return}
  const categoryMap=new Map((categories||[]).map(c=>[String(c.id),c]));
  const groups=new Map();
  products.forEach((p,index)=>{
    const c=categoryMap.get(String(p.categoria_id));
    const key=c?.id?String(c.id):'__sin_categoria__';
    if(!groups.has(key)) groups.set(key,{name:c?.nombre||'Sin categoría',orden:Number.isFinite(Number(c?.orden))?Number(c.orden):999999,items:[]});
    groups.get(key).items.push({p,index});
  });
  const orderedGroups=[...groups.values()].sort((a,b)=>a.orden-b.orden || String(a.name).localeCompare(String(b.name)));
  orderedGroups.forEach(g=>g.items.sort((a,b)=>{
    const ao=Number(a.p.orden),bo=Number(b.p.orden);
    const av=Number.isFinite(ao)&&ao>0?ao:999999;
    const bv=Number.isFinite(bo)&&bo>0?bo:999999;
    return av-bv || a.index-b.index;
  }));
  $('productList').innerHTML=orderedGroups.map(g=>`
    <div class="categoryBlock" style="margin-bottom:22px">
      <div class="categoryTitle" style="margin:0 0 10px;font-size:22px;font-weight:800;padding:0 2px">${esc(g.name)}</div>
      <div class="categoryProducts">
        ${g.items.map(({p})=>{const sc=stockCol(p),st=sc!==null?Number(p[sc]??0):null;const disponible=p.disponible!==false && (st===null || st>0);return `<article class="productCard" data-product-id="${esc(p.id)}"><div class="productTop"><div style="flex:1"><div class="big">${esc(p.nombre||'Producto')}</div><div class="muted">${esc(splitCatalogDescription(p.descripcion||'').description||'Sin descripción')}</div><div class="money" style="margin-top:7px">S/ ${Number(p.precio||0).toFixed(2)}</div><div class="muted" style="margin-top:5px">${st!==null?'Stock: '+st+' · ':''}${disponible?'Disponible':'Agotado'}</div></div>${p.imagen_url?`<img class="productImgPreview" src="${esc(p.imagen_url)}">`:''}</div><div class="actions"><button class="btn alt" type="button" data-action="edit">Editar</button><button class="btn alt" type="button" data-action="hide">${disponible?'Agotado':'Disponible'}</button><button class="btn alt" type="button" data-action="delete">Eliminar</button></div></article>`}).join('')}
      </div>
    </div>`).join('')
}
const CATALOG_META_MARKER='\n\n[[PIDEMAS_CARACTERISTICAS_V1: ';
function splitCatalogDescription(raw){const s=String(raw||'');const at=s.lastIndexOf(CATALOG_META_MARKER);if(at<0)return {description:s,features:[]};try{const end=s.indexOf(']]',at);if(end<0)return {description:s,features:[]};const json=s.slice(at+CATALOG_META_MARKER.length,end);const parsed=JSON.parse(json);return {description:s.slice(0,at).trimEnd(),features:Array.isArray(parsed)?parsed.filter(x=>x&&String(x.name||'').trim()&&String(x.value||'').trim()).map(x=>({name:String(x.name),value:String(x.value)})):[]}}catch(e){return {description:s,features:[]}}}
function composeCatalogDescription(description,features){const clean=String(description||'').trim();const valid=(features||[]).map(x=>({name:String(x.name||'').trim(),value:String(x.value||'').trim()})).filter(x=>x.name&&x.value);return clean+(valid.length?CATALOG_META_MARKER+JSON.stringify(valid)+']]':'')||null}
function renderCatalogFields(containerId,features=[]){const box=$(containerId);if(!box)return;box.innerHTML='';(features||[]).forEach(f=>addCatalogField(containerId,f.name,f.value));}
window.addCatalogField=function(containerId,name='',value=''){const box=$(containerId);if(!box)return;const row=document.createElement('div');row.className='catalog-custom-row';row.innerHTML='<input class="catalog-custom-key" aria-label="Nombre de característica" placeholder="Característica (ej. Talla)" maxlength="80"><input class="catalog-custom-value" aria-label="Valor de característica" placeholder="Valor (ej. 38, 39, 40)" maxlength="500"><button type="button" class="catalog-remove-field" aria-label="Eliminar característica">×</button>';row.querySelector('.catalog-custom-key').value=name||'';row.querySelector('.catalog-custom-value').value=value||'';row.querySelector('.catalog-remove-field').onclick=()=>row.remove();box.appendChild(row)};
function readCatalogFields(containerId){const box=$(containerId);if(!box)return [];return [...box.querySelectorAll('.catalog-custom-row')].map(row=>({name:row.querySelector('.catalog-custom-key').value.trim(),value:row.querySelector('.catalog-custom-value').value.trim()})).filter(x=>x.name&&x.value)}
function clearForm(){$('pNombre').value='';$('pDescripcion').value='';renderCatalogFields('pCustomFields',[]);$('pPrecio').value='';$('pStock').value='';$('pImagen').value='';$('pImagenFile').value='';$('pCategoria').value='';$('pActivo').checked=true;$('saveProduct').textContent='Agregar producto';delete $('saveProduct').dataset.editingId;$('cancelEdit').classList.add('hidden')}
window.editProduct=async id=>{const p=products.find(x=>String(x.id)===String(id));if(!p){show($('appMsg'),'No se encontró el producto.');return}const sel=$('editPCategoria');sel.innerHTML='<option value="">Sin categoría</option>';categories.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.nombre;sel.appendChild(o)});$('editPNombre').value=p.nombre||'';const parsedDescription=splitCatalogDescription(p.descripcion||'');$('editPDescripcion').value=parsedDescription.description;renderCatalogFields('editPCustomFields',parsedDescription.features);$('editPPrecio').value=p.precio??'';$('editPImagen').value=p.imagen_url||'';$('editPCategoria').value=p.categoria_id||'';$('editPActivo').checked=p.disponible!==false;const sc=stockCol(p);$('editPStock').value=sc?(p[sc]??0):0;$('editPImagenFile').value='';if(p.imagen_url){$('editPImagenPreview').src=p.imagen_url;$('editPImagenPreview').style.display='block';$('editPImagenCloud').style.display='none';$('editPImagenTitle').textContent='Cambiar imagen';$('editPImagenHint').textContent='Selecciona una nueva imagen o arrástrala aquí';$('editPImagenFileName').textContent='Imagen actual';$('deleteEditImage').style.display='block'}else{$('editPImagenPreview').style.display='none';$('editPImagenPreview').removeAttribute('src');$('editPImagenCloud').style.display='block';$('editPImagenTitle').textContent='Seleccionar imagen';$('editPImagenHint').textContent='Selecciona una imagen o arrástrala aquí';$('editPImagenFileName').textContent='PNG, JPG o WebP.';$('deleteEditImage').style.display='none'}$('deleteEditImage').dataset.removeImage='false';$('editProductMsg').classList.add('hidden');$('editProductMsg').textContent='';$('editProductModal').dataset.productId=String(id);$('editProductModal').classList.add('open');document.body.style.overflow='hidden';};window.deleteProduct=async id=>{if(!(await pdConfirmar('¿Eliminar este producto de tu carta?')))return;try{const r=await db.from('productos_negocio').delete().eq('id',id).eq('negocio_id',restaurant.id);if(r.error)throw r.error;clearForm();await loadProducts()}catch(e){show($('appMsg'),'No se pudo eliminar el producto: '+(e?.message||'Revisa los permisos de productos_negocio.'))}};window.hideProduct=async id=>{const p=products.find(x=>String(x.id)===String(id));if(!p)return;const sc=stockCol(p);const stock=sc!==null?Number(p[sc]??0):null;const disponible=p.disponible!==false && (stock===null || stock>0);try{let payload;if(disponible){payload={disponible:false};if(sc)payload[sc]=0;}else{if(sc!==null && Number(p[sc]??0)<=0){show($('appMsg'),'Para poner el producto como disponible, primero agrega stock mayor a 0.');return;}payload={disponible:true};}const r=await db.from('productos_negocio').update(payload).eq('id',id).eq('negocio_id',restaurant.id);if(r.error)throw r.error;await loadProducts()}catch(e){show($('appMsg'),'No se pudo cambiar el estado del producto: '+(e?.message||'Revisa los permisos de productos_negocio.'))}};
$('productList').addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;const card=b.closest('[data-product-id]');if(!card)return;const id=card.dataset.productId;const action=b.dataset.action;if(action==='edit')window.editProduct(id);if(action==='hide')window.hideProduct(id);if(action==='delete')window.deleteProduct(id)});
$('saveCategory').onclick=async()=>{const n=$('cNombre').value.trim();if(!n)return;const {error}=await db.from('categorias_negocio').insert({negocio_id:restaurant.id,nombre:n,descripcion:$('cDescripcion').value.trim()||null});if(error){pdAviso('No se pudo guardar la categoría: '+error.message);return}$('cNombre').value='';$('cDescripcion').value='';await loadCategories()};
$('pImagenFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f){$('pImagenFileName').textContent='PNG, JPG o WebP.';$('pImagenPreview').style.display='none';$('pImagenPreview').removeAttribute('src');$('pImagenCloud').style.display='';$('pImagenDropText').style.display='';return}$('pImagenFileName').textContent=f.name;const url=URL.createObjectURL(f);$('pImagenPreview').src=url;$('pImagenPreview').style.display='block';$('pImagenCloud').style.display='none';$('pImagenDropText').style.display='none'});
const uploadZone=document.querySelector('label.fileUploadButton[for="pImagenFile"]');
['dragenter','dragover'].forEach(ev=>uploadZone.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();uploadZone.style.borderColor='#1F1A17';uploadZone.style.background='#FFF9F5'}));
['dragleave','drop'].forEach(ev=>uploadZone.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();uploadZone.style.borderColor='#6F625A';uploadZone.style.background='#fff'}));
uploadZone.addEventListener('drop',e=>{const f=e.dataTransfer?.files?.[0];if(!f)return;try{const dt=new DataTransfer();dt.items.add(f);$('pImagenFile').files=dt.files}catch(_){ }$('pImagenFileName').textContent=f.name});
function closeEditProductModal(){$('editProductModal').classList.remove('open');document.body.style.overflow='';}
async function extensionFor(file){
  const type=(file?.type||'').toLowerCase();
  if(type.includes('png')) return 'png';
  if(type.includes('webp')) return 'webp';
  return 'jpg';
}
async function compressImageForFallback(file){
  if(!file) throw new Error('No se seleccionó ninguna imagen.');

  // En Android algunos navegadores pueden fallar con FileReader sobre
  // archivos seleccionados desde ciertas galerías. Usamos primero un
  // objectURL (el mismo mecanismo que funciona para la vista previa).
  const objectUrl=URL.createObjectURL(file);
  try{
    const dataUrl=await new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>{
        try{
          const w=img.naturalWidth||img.width;
          const h=img.naturalHeight||img.height;
          if(!w||!h) throw new Error('Dimensiones inválidas.');
          const max=1000;
          const scale=Math.min(1,max/Math.max(w,h));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(w*scale));
          canvas.height=Math.max(1,Math.round(h*scale));
          const ctx=canvas.getContext('2d',{alpha:false});
          if(!ctx) throw new Error('Canvas no disponible.');
          ctx.fillStyle='#ffffff';
          ctx.fillRect(0,0,canvas.width,canvas.height);
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          const out=canvas.toDataURL('image/jpeg',0.78);
          if(!out || out.length<100) throw new Error('Conversión vacía.');
          resolve(out);
        }catch(err){reject(err)}
      };
      img.onerror=()=>reject(new Error('El navegador no pudo decodificar la imagen.'));
      img.src=objectUrl;
    });
    return dataUrl;
  }catch(canvasError){
    // Último respaldo: convertir el Blob a base64 sin FileReader. Esto evita
    // el error "No se pudo leer la imagen seleccionada" que puede aparecer
    // en algunos teléfonos Android.
    try{
      const response=await fetch(objectUrl);
      const blob=await response.blob();
      const buffer=await blob.arrayBuffer();
      const bytes=new Uint8Array(buffer);
      let binary='';
      const chunk=0x8000;
      for(let i=0;i<bytes.length;i+=chunk){
        binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
      }
      const mime=blob.type||file.type||'image/jpeg';
      return `data:${mime};base64,${btoa(binary)}`;
    }catch(fallbackError){
      throw new Error('No se pudo procesar la imagen seleccionada.');
    }
  }finally{
    URL.revokeObjectURL(objectUrl);
  }
}
async function uploadProductImage(productId,file){
  if(!file)return null;
  const ext=await extensionFor(file);
  const path=`productos/${restaurant.id}/${productId}-${Date.now()}.${ext}`;
  const bucket=db.storage.from('restaurantes');
  const {error}=await bucket.upload(path,file,{upsert:false,contentType:file.type||'image/jpeg',cacheControl:'31536000'});
  if(!error){
    const {data}=bucket.getPublicUrl(path);
    return data.publicUrl;
  }
  // Si Storage no está disponible (por ejemplo, bucket inexistente o permisos),
  // no bloqueamos el producto: guardamos una versión comprimida en imagen_url.
  return await compressImageForFallback(file);
}
function storagePathFromImageUrl(url){
  const value=String(url||'');
  const marker=value.includes('/storage/v1/object/public/restaurantes/')?'/storage/v1/object/public/restaurantes/':'/storage/v1/object/public/negocios/';
  const i=value.indexOf(marker);
  if(i<0)return null;
  try{return decodeURIComponent(value.slice(i+marker.length).split('?')[0])}catch(_){return value.slice(i+marker.length).split('?')[0]}
}
async function removeProductImageUrl(url){
  const path=storagePathFromImageUrl(url);
  // Las imágenes guardadas como data URL no necesitan eliminarse de Storage.
  if(!path)return;
  const {error}=await db.storage.from(String(url).includes('/public/restaurantes/')?'restaurantes':'negocios').remove([path]);
  if(error && !/bucket not found|not found|denied|policy/i.test(String(error.message||'')))throw error;
}
$('editProductClose').onclick=closeEditProductModal;$('editProductCancel').onclick=closeEditProductModal;$('editProductModal').addEventListener('click',e=>{if(e.target===$('editProductModal'))closeEditProductModal()});$('editPImagenFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f){const current=$('editPImagen').value.trim();if(current){$('editPImagenPreview').src=current;$('editPImagenPreview').style.display='block';$('editPImagenCloud').style.display='none';$('editPImagenFileName').textContent='Imagen actual';$('deleteEditImage').style.display='block'}else{$('editPImagenPreview').style.display='none';$('editPImagenCloud').style.display='block';$('editPImagenFileName').textContent='PNG, JPG o WebP.';$('deleteEditImage').style.display='none'}return}const url=URL.createObjectURL(f);$('editPImagenPreview').src=url;$('editPImagenPreview').style.display='block';$('editPImagenCloud').style.display='none';$('editPImagenTitle').textContent='Nueva imagen';$('editPImagenHint').textContent='Se guardará al presionar Guardar cambios';$('editPImagenFileName').textContent=f.name;$('deleteEditImage').style.display='none';$('deleteEditImage').dataset.removeImage='false'});$('deleteEditImage').onclick=()=>{if(!$('editPImagen').value.trim())return;$('editPImagen').value='';$('editPImagenFile').value='';$('editPImagenPreview').style.display='none';$('editPImagenPreview').removeAttribute('src');$('editPImagenCloud').style.display='block';$('editPImagenTitle').textContent='Seleccionar imagen';$('editPImagenHint').textContent='Selecciona una imagen o arrástrala aquí';$('editPImagenFileName').textContent='Imagen eliminada. Guarda los cambios.';$('deleteEditImage').style.display='none';$('deleteEditImage').dataset.removeImage='true'};$('editProductSave').onclick=async()=>{
  const id=$('editProductModal').dataset.productId;
  if(!id)return;
  hide($('editProductMsg'));
  const nombre=$('editPNombre').value.trim();
  const precio=Number($('editPPrecio').value);
  const stock=Math.max(0,Math.floor(Number($('editPStock').value||0)));
  const imageFile=$('editPImagenFile').files[0]||null;
  if(!nombre||!Number.isFinite(precio)){
    show($('editProductMsg'),'Completa nombre y precio.');
    return;
  }
  try{
    const selectedCategoryId=$('editPCategoria').value||null;
    const selectedCategory=selectedCategoryId
      ? (categories||[]).find(c=>String(c.id)===String(selectedCategoryId))
      : null;
    if(selectedCategoryId && !selectedCategory){
      show($('editProductMsg'),'La categoría seleccionada no pertenece a este negocio.');
      return;
    }
    const payload={
      categoria_id:selectedCategoryId,
      nombre,
      descripcion:composeCatalogDescription($('editPDescripcion').value,readCatalogFields('editPCustomFields')),
      precio,
      stock,
      imagen_url:$('editPImagen').value.trim()||null,
      disponible:stock>0 && $('editPActivo').checked
    };
    const previousImageUrl=products.find(x=>String(x.id)===String(id))?.imagen_url||'';
    const removeImage=$('deleteEditImage').dataset.removeImage==='true';
    if(removeImage)payload.imagen_url=null;
    const r=await db.from('productos_negocio')
      .update(payload)
      .eq('id',id)
      .eq('negocio_id',restaurant.id);
    if(r.error)throw r.error;
    if(imageFile){
      const url=await uploadProductImage(id,imageFile);
      const upd=await db.from('productos_negocio').update({imagen_url:url}).eq('id',id).eq('negocio_id',restaurant.id);
      if(upd.error)throw upd.error;
      if(previousImageUrl && previousImageUrl!==url) await removeProductImageUrl(previousImageUrl);
    }else if(removeImage && previousImageUrl){
      await removeProductImageUrl(previousImageUrl);
    }
    const check=await db.from('productos_negocio')
      .select('*')
      .eq('id',id)
      .eq('negocio_id',restaurant.id)
      .maybeSingle();
    if(check.error)throw check.error;
    if(!check.data){throw new Error('No se pudo verificar el producto después de guardar.');}
    const savedStock=stockCol(check.data);
    if(savedStock===null || Number(check.data[savedStock])!==stock){
      throw new Error('El stock no pudo registrarse en la tabla productos_negocio. Verifica que exista la columna "stock".');
    }
    const idx=products.findIndex(x=>String(x.id)===String(id));
    if(idx>=0)products[idx]=check.data;
    closeEditProductModal();
    await loadProducts();
    show($('appMsg'),'Cambios guardados correctamente.');
  }catch(e){
    show($('editProductMsg'),'No se pudo guardar: '+(e?.message||'error desconocido')+(String(e?.message||'').toLowerCase().includes('row-level security')?' · Revisa los permisos del almacenamiento.':''));
  }
};

$('saveProduct').onclick=async()=>{
  hide($('productMsg'));
  const n=$('pNombre').value.trim();
  const price=Number($('pPrecio').value);
  const st=Math.max(0,Math.floor(Number($('pStock').value||0)));
  const imageFile=$('pImagenFile').files[0]||null;
  if(!n||!Number.isFinite(price)){show($('productMsg'),'Completa nombre y precio.');return}
  try{
    const edit=$('saveProduct').dataset.editingId||'';
    const selectedCategoryId=$('pCategoria').value||null;
    const selectedCategory=selectedCategoryId
      ? (categories||[]).find(c=>String(c.id)===String(selectedCategoryId))
      : null;
    if(selectedCategoryId && !selectedCategory){
      show($('productMsg'),'La categoría seleccionada no pertenece a este negocio.');
      return;
    }
    const payload={categoria_id:selectedCategoryId,nombre:n,descripcion:composeCatalogDescription($('pDescripcion').value,readCatalogFields('pCustomFields')),precio:price,stock:st,imagen_url:$('pImagen').value.trim()||null,disponible:st>0 && $('pActivo').checked};
    if(edit){
      const r=await db.from('productos_negocio').update(payload).eq('id',edit).eq('negocio_id',restaurant.id);
      if(r.error)throw r.error;
      if(selectedCategoryId){
        const verifyCategory=await db.from('productos_negocio').select('categoria_id').eq('id',edit).eq('negocio_id',restaurant.id).maybeSingle();
        if(verifyCategory.error)throw verifyCategory.error;
        if(String(verifyCategory.data?.categoria_id||'')!==String(selectedCategoryId)){
          throw new Error('La categoría no quedó guardada en categoria_id.');
        }
      }
      if(imageFile){
        const url=await uploadProductImage(edit,imageFile);
        const upd=await db.from('productos_negocio').update({imagen_url:url}).eq('id',edit).eq('negocio_id',restaurant.id);
        if(upd.error)throw upd.error;
      }
    }else{
      const r=await db.from('productos_negocio').insert({negocio_id:restaurant.id,...payload}).select('*').single();
      if(r.error)throw r.error;
      if(selectedCategoryId && String(r.data?.categoria_id||'')!==String(selectedCategoryId)){
        throw new Error('La categoría no quedó guardada en categoria_id.');
      }
      if(imageFile){
        const url=await uploadProductImage(r.data.id,imageFile);
        const upd=await db.from('productos_negocio').update({imagen_url:url}).eq('id',r.data.id).eq('negocio_id',restaurant.id);
        if(upd.error)throw upd.error;
      }
    }
    clearForm();
    show($('productMsg'),imageFile?'Producto e imagen guardados correctamente.':'Producto guardado correctamente.');
    closeEditProductModal();
    await loadProducts();
  }catch(e){show($('productMsg'),'No se pudo guardar el producto: '+(e?.message||'error desconocido')+(String(e?.message||'').toLowerCase().includes('row-level security')?' · Revisa los permisos del almacenamiento.':''))}
};$('cancelEdit').onclick=clearForm;
function perfilValor(candidates,def=''){
  const r=restaurant||{};
  for(const k of candidates){if(Object.prototype.hasOwnProperty.call(r,k)&&r[k]!==undefined&&r[k]!==null&&String(r[k]).trim()!=='')return r[k]}
  return def;
}
async function recargarNegocio(){
  if(!restaurant?.id)return false;
  const {data,error}=await db.from('negocios').select('*').eq('id',restaurant.id).maybeSingle();
  if(error){console.error(error);show($('perfilMsg'),'No se pudo consultar el negocio: '+error.message);return false;}
  if(data) restaurant=data;
  return !!data;
}

function renderPerfilVista(){
  if(!restaurant)return;
  const setVal=(id,candidates)=>{const el=$(id);if(el)el.value=perfilValor(candidates,'')??'';};
  setVal('perfilNombre',['nombre','nombre_negocio','razon_social']);
  setVal('perfilNumero',['telefono','numero','numero_telefono','telefono_contacto','celular','telefono_negocio','phone']);
  setVal('perfilDireccion',['direccion','direccion_negocio','ubicacion','direccion_comercial']);
  setVal('perfilLatitud',['latitud','latitude','lat']);
  setVal('perfilLongitud',['longitud','longitude','lng','lon']);
  setVal('perfilMaps',['google_maps_url','google_maps','maps_url']);
  setVal('perfilDescripcion',['descripcion','descripcion_negocio','detalle']);
  setVal('perfilCategoriaNegocio',['categoria_negocio','categoria_comercial','tipo_negocio','categoria']);
  setVal('perfilRuc',['ruc','RUC','numero_ruc']);
  const horarioRaw=perfilValor(['horario','horarios','horario_atencion','horario_atencion_negocio']);
  renderHorarioPerfil(horarioRaw);
  const activo=!(perfilValor(['activo','disponible'],true)===false||String(perfilValor(['activo','disponible'],true))==='false');
  $('verPerfilActivo').textContent=activo?'Activo':'Inactivo';
  if($('perfilActivo'))$('perfilActivo').checked=activo;
}
const DIAS_HORARIO=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
const NOMBRES_DIA={lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo'};
function formatearHoraPerfil(h){const m=String(h||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return '';let hh=Number(m[1]),mm=m[2];const ap=hh>=12?'PM':'AM';hh=hh%12||12;return String(hh).padStart(2,'0')+':'+mm+' '+ap}

function renderHorarioPerfil(raw){
  const el=$('verHorarioHorario');
  if(!el)return;
  const parsed={};
  String(raw||'').split('|').forEach(part=>{
    const [dia,horas]=part.split('=');
    if(!dia||!horas)return;
    const [abre,cierra]=horas.split('-');
    parsed[dia]=[abre||'',cierra||''];
  });
  if(!Object.keys(parsed).length){
    el.innerHTML='<div class="perfilHorarioEmpty">—</div>';
    return;
  }
  const iconos={lunes:'▣',martes:'▣',miercoles:'▣',jueves:'▣',viernes:'▣',sabado:'▣',domingo:'▣'};
  el.innerHTML=DIAS_HORARIO.map(d=>{
    const v=parsed[d]||['',''];
    const a=formatearHoraPerfil(v[0]),c=formatearHoraPerfil(v[1]);
    const abierto=!!(a&&c)&&estaAbiertoAhora(v[0],v[1],d);
    const timeAbre=/^\d{1,2}:\d{2}$/.test(v[0])?v[0]:'';
    const timeCierra=/^\d{1,2}:\d{2}$/.test(v[1])?v[1]:'';
    return `<div class="perfilHorarioRow" data-horario-dia="${d}">
      <div class="perfilHorarioDay"><span class="perfilHorarioBadge">${iconos[d]}</span></div>
      <div><div class="perfilHorarioDayName">${NOMBRES_DIA[d]}</div><div class="perfilHorarioHours"><b>${a||'—'}</b> – <b>${c||''}</b></div></div>
      <div class="perfilHorarioStatus${abierto?'':' closed'}">${abierto?'● Abierto':'Cerrado'}</div>
      <button class="perfilHorarioChevronBtn" type="button" aria-label="Editar ${NOMBRES_DIA[d]}" onclick="toggleHorarioDia('${d}')">⌄</button>
      <div class="perfilHorarioInlineEdit">
        <label class="perfilHorarioDayToggle"><input type="checkbox" class="inlineDiaActivo" checked> Atiende este día</label>
        <div class="perfilHorarioEditGrid">
          <div><label>Abre</label><div class="perfilHorarioTimePicker"><span class="perfilHorarioTimeValue${timeAbre?'':' empty'}">${timeAbre?formatearHoraPerfil(timeAbre):'Seleccionar hora'}</span><input type="time" class="perfilHorarioTimeInput inlineHoraAbre" value="${timeAbre}" aria-label="Hora de apertura"></div></div>
          <div><label>Cierra</label><div class="perfilHorarioTimePicker"><span class="perfilHorarioTimeValue${timeCierra?'':' empty'}">${timeCierra?formatearHoraPerfil(timeCierra):'Seleccionar hora'}</span><input type="time" class="perfilHorarioTimeInput inlineHoraCierra" value="${timeCierra}" aria-label="Hora de cierre"></div></div>
        </div>
        <div class="perfilHorarioInlineActions">
          <button class="btn" type="button" onclick="guardarHorarioDia('${d}')">Guardar</button>
          <button class="btn alt" type="button" onclick="toggleHorarioDia('${d}',true)">Cancelar</button>
        </div>
      </div>
    </div>`;
  }).filter(Boolean).join('') || '<div class="perfilHorarioEmpty">—</div>';
}
let intervaloEstadoHorario=null;
function refrescarEstadoHorario(){
  if(typeof restaurant==='undefined'||!restaurant)return;
  renderHorarioPerfil(perfilValor(['horario','horarios','horario_atencion','horario_atencion_negocio','horario_atencion_negocio']));
}
if(!intervaloEstadoHorario)intervaloEstadoHorario=setInterval(refrescarEstadoHorario,30000);
function actualizarTextoHora(input){
  const wrap=input?.closest('.perfilHorarioTimePicker');
  const out=wrap?.querySelector('.perfilHorarioTimeValue');
  if(!out)return;
  const valor=input.value||'';
  out.textContent=valor?formatearHoraPerfil(valor):'Seleccionar hora';
  out.classList.toggle('empty',!valor);
}
window.toggleHorarioDia=function(dia,cerrar=false){
  const row=document.querySelector('.perfilHorarioRow[data-horario-dia="'+dia+'"]');
  if(!row)return;
  const estaba=row.classList.contains('expanded');
  document.querySelectorAll('.perfilHorarioRow.expanded').forEach(r=>r.classList.remove('expanded'));
  if(!cerrar && !estaba)row.classList.add('expanded');
};
document.addEventListener('change',e=>{
  if(e.target?.matches('.perfilHorarioTimeInput')) actualizarTextoHora(e.target);
});
document.addEventListener('click',e=>{
  const picker=e.target?.closest('.perfilHorarioTimePicker');
  const input=picker?.querySelector('.perfilHorarioTimeInput');
  if(!input)return;
  try{
    input.focus({preventScroll:true});
    if(typeof input.showPicker==='function') input.showPicker();
    else input.click();
  }catch(_){
    try{input.click();}catch(__){}
  }
});
window.guardarHorarioDia=async function(dia){
  if(!restaurant?.id)return;
  const row=document.querySelector('.perfilHorarioRow[data-horario-dia="'+dia+'"]');
  if(!row)return;
  const activo=row.querySelector('.inlineDiaActivo')?.checked;
  const abre=row.querySelector('.inlineHoraAbre')?.value||'';
  const cierra=row.querySelector('.inlineHoraCierra')?.value||'';
  const boton=row.querySelector('.perfilHorarioInlineActions .btn:not(.alt)');
  if(activo && (!abre||!cierra)){
    pdAviso('Completa la hora de apertura y cierre.');
    return;
  }
  if(boton){boton.disabled=true;boton.textContent='Guardando...';}
  try{
    // Usamos el horario que ya está cargado en pantalla. No hacemos una
    // consulta previa que pueda reemplazar los cambios que el usuario acaba
    // de introducir en este día.
    const actual={};
    String(perfilValor(['horario','horarios','horario_atencion','horario_atencion_negocio'])||'').split('|').forEach(part=>{
      const [d,h]=part.split('=');
      if(d&&h){const [a,c]=h.split('-');actual[d]=[a||'',c||''];}
    });
    if(activo)actual[dia]=[abre,cierra];
    else delete actual[dia];
    const horario=DIAS_HORARIO.filter(d=>actual[d]).map(d=>`${d}=${actual[d][0]||''}-${actual[d][1]||''}`).join('|');

    // IMPORTANTE: no usamos .select() después del UPDATE.
    // En Supabase, .select() exige además una política SELECT y puede hacer
    // que un UPDATE correcto parezca fallar aunque la escritura sí se haya hecho.
    // Usamos count:'exact' para saber si realmente se modificó la fila.
    const {error,count}=await db.from('negocios')
      .update({horario:horario||null},{count:'exact'})
      .eq('id',restaurant.id);
    if(error)throw error;
    if(count!==1)throw new Error('Supabase no modificó el negocio (filas afectadas: '+(count??0)+'). Revisa la política RLS UPDATE de la tabla negocios.');

    // La escritura ya fue aceptada. Actualizamos la vista local inmediatamente
    // y luego sincronizamos con Supabase para que quede persistente.
    restaurant.horario=horario||null;
    renderPerfilVista();
    show($('perfilMsg'),'Horario guardado correctamente.');
    await recargarNegocio();
    renderPerfilVista();
  }catch(e){
    console.error('Error guardando horario:',e);
    pdAviso('No se pudo guardar el horario: '+(e?.message||'error desconocido'));
    show($('perfilMsg'),'No se pudo guardar el horario: '+(e?.message||'error desconocido'));
  }finally{
    if(boton){boton.disabled=false;boton.textContent='Guardar';}
  }
};






function horaGrupo24(row,kind){const grupos=row.querySelectorAll('.horaGrupo');const grupo=kind==='abre'?grupos[0]:grupos[1];const split=grupo?.querySelector('.horaSplit');if(!split)return null;const h=Number(split.querySelector('.horaHora')?.value);const mi=Number(split.querySelector('.horaMinuto')?.value);if(!Number.isFinite(h)||h<1||h>12||!Number.isFinite(mi)||mi<0||mi>59)return null;let hh=h;const pm=grupo.querySelector('.'+kind+'Pm')?.checked;if(pm&&hh<12)hh+=12;if(!pm&&hh===12)hh=0;return `${String(hh).padStart(2,'0')}:${String(mi).padStart(2,'0')}`}
function obtenerHorarioSemanal(){return Array.from(document.querySelectorAll('#horarioEdicion .horarioDia')).filter(row=>row.querySelector('.diaActivo')?.checked).map(row=>{const abre=horaGrupo24(row,'abre'),cierra=horaGrupo24(row,'cierra');return `${row.dataset.dia}=${abre||''}-${cierra||''}`}).join('|')}
async function cargarPerfil(){
  if(!restaurant?.id)return;
  await recargarNegocio();
  renderPerfilVista();
  prepararPerfilEditable();
}
function prepararPerfilEditable(){
  document.querySelectorAll('#perfilCamposInline .profileInlineInput').forEach(el=>{
    if(el.tagName==='SELECT') el.disabled=false;
    else el.readOnly=false;
  });
  if($('perfilActivo'))$('perfilActivo').disabled=false;
  $('editarPerfil').textContent='Guardar cambios';
  $('editarPerfil').classList.add('profileSaveMode');
}
$('editarPerfil').onclick=async()=>{await guardarPerfilAhora();};


async function guardarPerfilAhora(){
  if(!restaurant?.id)return;
  hide($('perfilMsg'));
  const payload={
    nombre:$('perfilNombre').value.trim(),telefono:$('perfilNumero').value.trim()||null,direccion:$('perfilDireccion').value.trim()||null,
    latitud:$('perfilLatitud').value.trim()===''?null:Number($('perfilLatitud').value),longitud:$('perfilLongitud').value.trim()===''?null:Number($('perfilLongitud').value),
    google_maps_url:$('perfilMaps').value.trim()||null,descripcion:$('perfilDescripcion').value.trim()||null,categoria_negocio:$('perfilCategoriaNegocio').value||null,ruc:$('perfilRuc').value.trim()||null,activo:$('perfilActivo').checked
  };
  if(!payload.nombre){show($('perfilMsg'),'El nombre es obligatorio.');return;}
  try{
    const {data,error}=await db.from('negocios').update(payload).eq('id',restaurant.id).select('*').maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('Supabase no devolvió el negocio. Verifica las políticas RLS de negocios.');
    restaurant=data;$('welcome').textContent='Hola, '+(restaurant.nombre||'Negocio');renderPerfilVista();prepararPerfilEditable();show($('perfilMsg'),'Perfil guardado correctamente.');
  }catch(e){console.error('Error guardando perfil:',e);show($('perfilMsg'),'No se pudo guardar el perfil: '+(e?.message||'error desconocido'));}
}

function cerrarEdicionHorario(){
  $('horarioEdicion').classList.add('hidden');
  document.body.style.overflow='';
  renderPerfilVista();
}
$('cerrarHorarioEdicion').onclick=cerrarEdicionHorario;
$('cancelarHorario').onclick=cerrarEdicionHorario;
$('guardarHorario').onclick=async()=>{
  if(!restaurant?.id)return;
  hide($('perfilMsg'));
  const horario=obtenerHorarioSemanal();
  try{
    const {data,error}=await db.from('negocios')
      .update({horario:horario||null})
      .eq('id',restaurant.id)
      .select('id,horario')
      .maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('Supabase no actualizó el negocio. Revisa la política RLS UPDATE de la tabla negocios para el usuario que inició sesión.');
    if(String(data.horario??'')!==String(horario||''))throw new Error('Supabase no confirmó el nuevo horario guardado.');
    restaurant.horario=data.horario||null;
    cerrarEdicionHorario();
    show($('perfilMsg'),'Horario guardado correctamente.');
  }catch(e){
    console.error('Error guardando horario:',e);
    show($('perfilMsg'),'No se pudo guardar el horario: '+(e?.message||'error desconocido'));
  }
};
let businessOrders=[];
function businessOrderLabel(o){
  const s=String(o.estado||'pendiente').toLowerCase();
  if(s==='cancelado')return 'Cancelado';
  if(s==='entregado')return 'Entregado';
  if(s==='en_entrega')return 'En entrega';
  if(s==='en_camino')return 'En camino';
  if(s==='asignado')return 'Motorizado asignado';
  if(s==='aceptado'||s==='pedido_aceptado')return 'Pedido aceptado';
  if(s==='confirmado')return 'Pedido confirmado';
  return 'Pedido recibido';
}
function businessOrderDetails(o){
  const items=Array.isArray(o.detalle_pedidos)?o.detalle_pedidos:[];
  return items.map(x=>{
    const name=x.nombre_producto||x.nombre||x.producto_nombre||x.producto||'Producto';
    const qty=Math.max(1,Number(x.cantidad||x.quantity)||1);
    const sub=Number(x.subtotal??x.total_linea??x.total_item);
    const unit=Number(x.precio_unitario??x.precio??x.precio_producto);
    const price=Number.isFinite(sub)?` — S/ ${sub.toFixed(2)}`:Number.isFinite(unit)?` — S/ ${(unit*qty).toFixed(2)}`:'';
    return `${esc(name)} × ${qty}${price}`;
  }).join('<br>')||'Detalle no disponible; revisar detalle_pedidos';
}
function pdYapeTexto(o){
  try{const r=restaurant||{};if(String(o&&o.metodo_pago||'').toLowerCase()!=='yape'||!(r.yape_qr_url||r.yape_numero))return '';
    return '\n\n*Puedes pagar por Yape:*'+(r.yape_numero?'\nNúmero: '+r.yape_numero:'')+(r.yape_titular?'\nTitular: '+r.yape_titular:'')+(r.yape_qr_url?'\nQR: '+r.yape_qr_url:'')+'\n\nCuando pagues, envíanos la captura por aquí.';}catch(e){return ''}
}
async function businessWhatsApp(orderOrId){
  // El botón envía el ID del pedido; recuperar el objeto completo antes de leer el teléfono.
  const o = (orderOrId && typeof orderOrId === 'object')
    ? orderOrId
    : businessOrders.find(x => String(x.id) === String(orderOrId));
  if(!o){
    show($('businessOrdersMsg'),'No se encontró la información de este pedido. Pulsa Actualizar e inténtalo otra vez.');
    return;
  }

  const raw=String(o.telefono_cliente||o.telefono||'').replace(/\D/g,'');
  if(!raw){
    show($('businessOrdersMsg'),'Este pedido no tiene teléfono del cliente registrado.');
    return;
  }

  let phone=raw;
  if(phone.startsWith('0') && phone.length===10) phone=phone.slice(1);
  if(phone.startsWith('51')) {
    if(phone.length!==11){
      show($('businessOrdersMsg'),'El teléfono del cliente no parece válido. Verifica que tenga 9 dígitos peruanos.');
      return;
    }
  } else if(phone.length===9) {
    phone='51'+phone;
  } else {
    show($('businessOrdersMsg'),'El teléfono del cliente no parece válido. Debe tener 9 dígitos peruanos.');
    return;
  }

  const code=String(o.id||'').slice(0,8).toUpperCase();
  // Incluir el detalle del pedido y el importe total para que el cliente sepa cuánto pagar.
  // El detalle se guarda en la tabla relacionada detalle_pedidos, no dentro
  // de la fila principal de pedidos. Consultarlo por pedido_id antes de crear WhatsApp.
  let items=Array.isArray(o.detalle_pedidos)?o.detalle_pedidos:[];
  if(!items.length){
    try{
      const {data:detalles,error:detalleError}=await db
        .from('detalle_pedidos')
        .select('*')
        .eq('pedido_id',o.id);
      if(!detalleError && Array.isArray(detalles)) items=detalles;
      else if(detalleError) {
        console.error('No se pudo consultar detalle_pedidos:',detalleError);
        show($('businessOrdersMsg'),'No se pudo leer el detalle de productos. Revisa la política SELECT de detalle_pedidos en Supabase. '+(detalleError.message||''));
      }
    }catch(e){
      console.error('Error consultando detalle del pedido:',e);
      show($('businessOrdersMsg'),'Error consultando los productos del pedido: '+(e?.message||String(e)));
    }
  }
  if(!items.length){
    show($('businessOrdersMsg'),'No enviaré un WhatsApp sin el detalle real de los productos. Verifica que existan filas en detalle_pedidos para este pedido y que el negocio tenga permiso SELECT.');
    return;
  }
  const itemLines=items.map((item)=>{
    const name=String(item.nombre_producto||item.nombre||item.producto||'Producto');
    const qty=Math.max(1,Number(item.cantidad)||1);
    const unit=Number(item.precio_unitario??item.precio??item.precio_producto);
    const subtotal=Number(item.subtotal??item.total_linea);
    if(Number.isFinite(subtotal)) return `• ${name} × ${qty}: S/ ${subtotal.toFixed(2)}`;
    if(Number.isFinite(unit)) return `• ${name} × ${qty}: S/ ${(unit*qty).toFixed(2)}`;
    return `• ${name} × ${qty}`;
  });
  const subtotal=Number(o.subtotal);
  const delivery=Number(o.costo_delivery);
  const total=Number(o.total);
  const subtotalValue=Number.isFinite(subtotal)?subtotal:(Number.isFinite(total)&&Number.isFinite(delivery)?total-delivery:NaN);
  const deliveryValue=Number.isFinite(delivery)?delivery:0;
  const subtotalText=Number.isFinite(subtotalValue)?`S/ ${subtotalValue.toFixed(2)}`:'por confirmar';
  const deliveryText=Number.isFinite(delivery)?`S/ ${deliveryValue.toFixed(2)}`:'por confirmar';
  const totalText=Number.isFinite(total)?`S/ ${total.toFixed(2)}`:'por confirmar';
  const detailText=itemLines.length?itemLines.join('\n'):'Detalle de productos no disponible en el registro.';
  const message=`Hola${o.nombre_cliente?' '+o.nombre_cliente:''}, te contacto de ${restaurant?.nombre||'tu negocio'} por tu pedido #${code}.\n\n*Detalle de tu pedido:*\n${detailText}\n\nSubtotal de productos: ${subtotalText}\nDelivery: ${deliveryText}\n*TOTAL A PAGAR: ${totalText}*\n\nQueremos coordinar el pago para continuar con el pedido.${pdYapeTexto(o)}`;
  const url=`https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  // Abrir desde la acción directa del usuario para evitar bloqueos del navegador móvil.
  const link=document.createElement('a');
  link.href=url;
  link.target='_blank';
  link.rel='noopener noreferrer';
  link.style.display='none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
window.businessWhatsApp=businessWhatsApp;
async function updateBusinessOrder(id,patch,success){
  const btns=[...document.querySelectorAll(`[data-business-order="${CSS.escape(String(id))}"]`)];
  btns.forEach(x=>x.disabled=true);
  try{
    if(!session?.user?.id) throw new Error('La sesión expiró. Cierra sesión e ingresa nuevamente.');
    if(!restaurant?.id) throw new Error('No se identificó el negocio de esta sesión.');
    const {data,error}=await db.from('pedidos')
      .update(patch)
      .eq('id',id)
      .eq('negocio_id',restaurant.id)
      .select('id, negocio_id, estado, pago_negocio_confirmado, listo_para_recojo')
      .maybeSingle();
    if(error){
      console.error('Supabase rechazó la actualización del pedido:',error);
      const detail=String(error.message||error);
      if(/row-level security|permission denied|violates row-level security/i.test(detail)){
        throw new Error('Supabase bloqueó la actualización por permisos RLS. Debe existir una política UPDATE para el negocio en public.pedidos.');
      }
      throw new Error(detail);
    }
    if(!data){
      throw new Error('Supabase no devolvió ningún pedido actualizado. La causa más probable es que falte la política UPDATE del negocio en public.pedidos, o que el pedido no pertenezca a este negocio. Revisa la política RLS antes de volver a intentar.');
    }
    show($('businessOrdersMsg'),success);
    await loadBusinessOrders();
  }catch(e){
    console.error('No se pudo actualizar el pedido del negocio:',e);
    show($('businessOrdersMsg'),'No se pudo actualizar el pedido: '+(e?.message||String(e)));
    btns.forEach(x=>x.disabled=false);
  }
}
window.businessConfirmOrder=async id=>{
  const o=businessOrders.find(x=>String(x.id)===String(id));if(!o)return;
  if(!(await pdConfirmar('¿Confirmas que el negocio acepta este pedido?')))return;
  await updateBusinessOrder(id,{estado:'confirmado'},'Pedido confirmado. Pidemás ya puede gestionarlo.');
};
window.businessConfirmPayment=async id=>{
  const o=businessOrders.find(x=>String(x.id)===String(id));if(!o)return;
  if(!(await pdConfirmar('Confirma únicamente si ya verificaste el pago con el cliente. ¿El pago fue recibido?')))return;
  await updateBusinessOrder(id,{pago_negocio_confirmado:true,pago_negocio_confirmado_en:new Date().toISOString()},'Pago del negocio confirmado. Ya puedes marcar el pedido listo para recojo.');
};
window.businessMarkReady=async id=>{
  const o=businessOrders.find(x=>String(x.id)===String(id));if(!o)return;
  if(o.pago_negocio_confirmado!==true){show($('businessOrdersMsg'),'Primero debes confirmar el pago.');return}
  if(!(await pdConfirmar('¿El pedido está completamente preparado y listo para que lo recoja el motorizado?')))return;
  await updateBusinessOrder(id,{listo_para_recojo:true,listo_para_recojo_en:new Date().toISOString()},'Pedido marcado como listo para recojo.');
};
async function loadBusinessOrders(){
  if(!restaurant?.id)return;
  const box=$('businessOrdersList');if(!box)return;
  const {data,error}=await db.from('pedidos').select('*').eq('negocio_id',restaurant.id).order('creado_en',{ascending:false}).limit(100);
  if(error){show($('businessOrdersMsg'),'No se pudieron cargar los pedidos: '+error.message);box.innerHTML='';return}
  businessOrders=data||[];
  if(!businessOrders.length){box.innerHTML='<div class="empty">Todavía no tienes pedidos recibidos.</div>';return}
  // Cargar los detalles relacionados por separado: no suelen venir anidados en pedidos.
  try{
    const ids=businessOrders.map(o=>o.id).filter(Boolean);
    if(ids.length){
      // Reintenta si falla la red ("Failed to fetch") y consulta en lotes pequeños.
      const esRed=e=>/failed to fetch|network|load failed/i.test(String((e&&e.message)||e||''));
      const pausa=ms=>new Promise(r=>setTimeout(r,ms));
      const leerLote=async lote=>{
        let r;
        for(let i=0;i<3;i++){
          try{r=await db.from('detalle_pedidos').select('*').in('pedido_id',lote)}catch(e){r={data:null,error:{message:String(e)}}}
          if(!r.error||!esRed(r.error))break;
          await pausa(600*(i+1));
        }
        return r;
      };
      let detailRows=[],detailErr=null;
      for(let i=0;i<ids.length;i+=20){
        const r=await leerLote(ids.slice(i,i+20));
        if(r.error){detailErr=r.error;break}
        detailRows=detailRows.concat(r.data||[]);
      }
      if(detailErr){
        console.warn('No se pudieron cargar los detalles de productos:',detailErr);
        show($('businessOrdersMsg'),esRed(detailErr)
          ?'Los pedidos cargaron, pero se cortó la conexión al leer el detalle de productos. Toca el botón de actualizar (↻) para reintentar.'
          :'Los pedidos cargaron, pero Supabase no permitió leer detalle_pedidos: '+(detailErr.message||'Revisa permisos SELECT.'));
      } else if(Array.isArray(detailRows)){
        const grouped={};
        detailRows.forEach(d=>{const k=String(d.pedido_id);(grouped[k]||(grouped[k]=[])).push(d)});
        businessOrders=businessOrders.map(o=>({...o,detalle_pedidos:(grouped[String(o.id)]||o.detalle_pedidos||[])}));
      }
    }
  }catch(detailException){console.warn('Error leyendo detalle de productos:',detailException)}
  box.innerHTML=businessOrders.map(o=>{
    const id=String(o.id),code=id.slice(0,8).toUpperCase();
    const terminal=['entregado','cancelado'].includes(String(o.estado||'').toLowerCase());
    const confirmed=String(o.estado||'').toLowerCase()==='confirmado'||['asignado','aceptado','en_camino','en_entrega','entregado'].includes(String(o.estado||'').toLowerCase());
    const paid=o.pago_negocio_confirmado===true;
    const ready=o.listo_para_recojo===true;
    const phone=String(o.telefono_cliente||o.telefono||'');
    return `<article class="order">
      <div class="orderHead"><div><div class="big">Pedido #${esc(code)}</div><div class="muted">${esc(o.nombre_cliente||'Cliente')}</div></div><span class="status">${esc(businessOrderLabel(o))}</span></div>
      <div class="line"><b>Teléfono:</b> ${esc(phone||'No registrado')}</div>
      <div class="line"><b>Productos:</b><br>${businessOrderDetails(o)}</div>
      <div class="line"><b>Precio del delivery:</b> ${Number.isFinite(Number(o.costo_delivery))&&o.costo_delivery!==null&&o.costo_delivery!==''?'S/ '+Number(o.costo_delivery).toFixed(2):'Por confirmar'}</div>
      <div class="line"><b>Total:</b> S/ ${Number(o.total||0).toFixed(2)}</div>
      <div class="line"><b>Pago coordinado:</b> ${paid?'Sí, confirmado':'Pendiente de confirmar'}</div>
      <div class="line"><b>Preparación:</b> ${ready?'Listo para recojo':'Aún no listo'}</div>
      <div class="actions" style="display:grid;gap:8px;margin-top:12px">
        <button class="btn alt" type="button" data-business-order="${esc(id)}" onclick="businessWhatsApp('${esc(id)}')" ${terminal?'disabled':''}>Contactar cliente por WhatsApp</button>
        <button class="btn" type="button" data-business-order="${esc(id)}" onclick="businessConfirmOrder('${esc(id)}')" ${confirmed||terminal?'disabled':''}>Confirmar pedido</button>
        <button class="btn alt" type="button" data-business-order="${esc(id)}" onclick="businessConfirmPayment('${esc(id)}')" ${!confirmed||paid||terminal?'disabled':''}>Confirmar pago</button>
        <button class="btn" type="button" data-business-order="${esc(id)}" onclick="businessMarkReady('${esc(id)}')" ${!paid||ready||terminal?'disabled':''}>Pedido listo para recojo</button>
      </div>
    </article>`;
  }).join('');
}

function switchPanelTab(tab){
  const map={carta:'cartaTab',categorias:'categoriasTab',horario:'horarioTab',perfil:'perfilTab',pedidos:'pedidosTab'};
  Object.entries(map).forEach(([key,id])=>$(id).classList.toggle('hiddenTab',key!==tab));
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  if(tab==='pedidos')loadBusinessOrders();
  if(tab==='perfil'||tab==='horario'){
    cargarPerfil().catch(e=>console.error('Error cargando datos del negocio:',e));
  }
  window.scrollTo({top:0,left:0,behavior:'smooth'});
}

document.querySelectorAll('.stockBtn').forEach(btn=>btn.addEventListener('click',()=>{const input=$(btn.dataset.stockTarget);if(!input)return;const current=Math.max(0,Math.floor(Number(input.value||0)));const step=Number(btn.dataset.stockStep||0);input.value=Math.max(0,current+step);input.dispatchEvent(new Event('input',{bubbles:true}));}));document.querySelectorAll('.priceBtn').forEach(btn=>btn.addEventListener('click',()=>{const input=$(btn.dataset.priceTarget);if(!input)return;const current=Math.max(0,Number(input.value||0));const step=Number(btn.dataset.priceStep||0);const next=Math.max(0,Math.round((current+step)*100)/100);input.value=next.toFixed(2);input.dispatchEvent(new Event('input',{bubbles:true}));}));
async function init(){try{setupLoginOptions();$('loginBtn').addEventListener('click',login);$('password').addEventListener('keydown',e=>{if(e.key==='Enter')login()});document.querySelectorAll('#nav button').forEach(b=>b.addEventListener('click',()=>switchPanelTab(b.dataset.tab)));$('logout').addEventListener('click',async()=>{hide($('nav'));await db.auth.signOut({scope:'local'});location.reload()});const {data,error}=await db.auth.getSession();if(error)throw error;if(data.session){session=data.session;await enter(data.session.user.id)}}catch(e){console.error('Error inicializando panel:',e);show($('loginMsg'),'No se pudo iniciar el panel: '+(e?.message||'error desconocido'))}}init();
