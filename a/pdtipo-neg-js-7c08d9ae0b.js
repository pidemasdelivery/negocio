/* Etapa 4 · Plantillas por rubro en el panel del negocio: tallas y colores, opciones, fotos y precio de oferta. */
(function(){
  if(window.__pdTipoNeg)return; window.__pdTipoNeg=true;
  const COMIDA=['Restaurantes','Comida criolla','Pizzerías','Pollerías','Hamburgueserías','Comida rápida','Sangucherías','Paviferías','Cevicherías','Chifas','Sushi y comida japonesa','Parrillas y anticuchos','Heladerías','Cafeterías','Juguerías','Dulcerías y pastelerías','Panaderías'];
  const MODA=['Ropa y moda','Calzado y zapatillas'];
  window.pdPlantilla=function(cat){const c=String(cat||'').trim();if(!c||COMIDA.includes(c))return 'comida';if(MODA.includes(c))return 'moda';if(c==='Licorerías')return 'licoreria';return 'opciones'};
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arr=v=>{if(Array.isArray(v))return v;try{const p=JSON.parse(v||'[]');return Array.isArray(p)?p:[]}catch(e){return []}};
  const R=()=>typeof restaurant!=='undefined'?restaurant:null;
  const clave=v=>[v.talla,v.color,v.opcion].map(x=>String(x||'').trim()).filter(Boolean).join(' · ');
  const PRESETS={ropa:['XS','S','M','L','XL','XXL'],ropaBasica:['S','M','L','XL'],calzado:['35','36','37','38','39','40','41','42','43','44'],unica:['Talla única']};
  let st=null;

  function rowsHtml(){
    const moda=st.tipo==='moda';
    return st.vars.map((v,i)=>`<div class="pvRow ${moda?'':'one'}" data-i="${i}">${moda?`<input data-k="talla" placeholder="Talla" value="${E(v.talla||'')}" aria-label="Talla"><input data-k="color" placeholder="Color" value="${E(v.color||'')}" aria-label="Color">`:`<input data-k="opcion" placeholder="Opción" value="${E(v.opcion||'')}" aria-label="Opción">`}<div class="pvStep"><button type="button" data-st="-1" aria-label="Restar">−</button><input data-k="stock" inputmode="numeric" value="${Number(v.stock)||0}" aria-label="Stock"><button type="button" data-st="1" aria-label="Sumar">+</button></div><button type="button" class="pvDel" data-del="${i}" aria-label="Quitar">×</button></div>`).join('');
  }
  function sum(){return st.vars.reduce((a,v)=>a+Math.max(0,Math.floor(Number(v.stock)||0)),0)}
  function syncStock(){
    const box=document.getElementById('pvBox');if(!box)return;
    const s=box.querySelector('.pvSum');if(s)s.textContent=st.vars.length?`Stock total: ${sum()} (se calcula solo con las variantes)`:'Sin variantes: se usa el stock normal del producto.';
    const stepWrap=document.getElementById('pdxEStock')?.closest('.x-eLbl');
    if(stepWrap)stepWrap.style.display=st.vars.length?'none':'';
    const inp=document.getElementById('pdxEStock');if(inp&&st.vars.length)inp.value=sum();
  }
  function paintRows(){const r=document.getElementById('pvRows');if(r)r.innerHTML=rowsHtml();syncStock()}
  function fotosHtml(){
    const all=[st.main,...st.fotos].filter(Boolean);
    return all.map((u,i)=>`<div class="pvFoto"><img src="${E(u)}" alt="">${i===0?'<span class="pvMain">Principal</span>':`<button type="button" data-fdel="${i-1}" aria-label="Quitar foto">×</button>`}</div>`).join('')+(all.length<6?`<button type="button" class="pvFotoAdd" id="pvFotoAdd" aria-label="Agregar foto">+</button>`:'');
  }
  async function subirFoto(file){
    const id=st.id,ext=(file.type.split('/')[1]||'jpg').replace('jpeg','jpg');
    const path=`productos/${restaurant.id}/${id}_f${Date.now()}.${ext}`;
    const b=db.storage.from('restaurantes');
    const {error}=await b.upload(path,file,{upsert:false,contentType:file.type||'image/jpeg'});
    if(!error)return b.getPublicUrl(path).data.publicUrl;
    if(typeof compressImageForFallback==='function')return await compressImageForFallback(file);
    throw new Error(error.message);
  }

  window.pdTipoEditHook=function(p,body){
    st=null;
    const tipo=window.pdPlantilla(R()?.categoria_negocio);
    if(tipo==='comida')return;
    st={id:String(p.id),tipo,vars:arr(p.variantes).map(v=>({talla:v.talla||'',color:v.color||'',opcion:v.opcion||'',stock:Number(v.stock)||0})),fotos:arr(p.fotos).filter(Boolean),main:p.imagen_url||''};
    const label=tipo==='moda'?'Tallas y colores':tipo==='licoreria'?'Licorería · opciones (+18)':'Opciones';
    const box=document.createElement('div');box.className='pvBox';box.id='pvBox';
    box.innerHTML=`<div class="pvHead"><strong>Precio de oferta y fotos</strong></div>
      <label class="x-eLbl">Precio antes (opcional)<input class="x-in" id="pvAntes" type="number" inputmode="decimal" min="0" step="0.10" placeholder="Ej. 129.90" value="${p.precio_antes?E(Number(p.precio_antes).toFixed(2)):''}"></label>
      <p class="pvHint">Si lo llenas y es mayor que el precio, la tienda muestra el descuento.</p>
      <div class="pvFotos" id="pvFotos">${fotosHtml()}</div><input type="file" class="pvFile" id="pvFile" accept="image/*">
      <p class="pvHint">Hasta 6 fotos. La principal se cambia con «Editar foto, descripción y categoría».</p>
      <div class="pvHead" style="margin-top:6px"><strong>${E(label)}</strong><span class="pvTag">${tipo==='moda'?'Moda':tipo==='licoreria'?'+18':'Variantes'}</span></div>
      ${tipo==='moda'?`<p class="pvHint">Agrega cada talla (y color si tiene) con su stock. Atajos:</p><div class="pvPresets"><button type="button" data-pre="ropaBasica">S · M · L · XL</button><button type="button" data-pre="ropa">XS a XXL</button><button type="button" data-pre="calzado">Calzado 35–44</button><button type="button" data-pre="unica">Talla única</button></div>`:`<p class="pvHint">Ej.: 128 GB · Negro, 1 L, 750 ml, Tamaño grande. Déjalo vacío si el producto no tiene opciones.</p>`}
      <div id="pvRows" style="display:flex;flex-direction:column;gap:6px"></div>
      <button type="button" class="pvAdd" id="pvAddRow">+ Agregar ${tipo==='moda'?'talla / color':'opción'}</button>
      <div class="pvSum"></div>`;
    const anchor=body.querySelector('#pdxEFull');anchor?anchor.before(box):body.appendChild(box);
    paintRows();
    box.addEventListener('click',async e=>{
      const t=e.target;
      if(t.dataset.pre){const color=st.vars.length?st.vars[st.vars.length-1].color:'';PRESETS[t.dataset.pre].forEach(tl=>{if(!st.vars.some(v=>v.talla===tl&&v.color===color))st.vars.push({talla:tl,color,stock:0})});paintRows();return}
      if(t.id==='pvAddRow'){st.vars.push(st.tipo==='moda'?{talla:'',color:'',stock:0}:{opcion:'',stock:0});paintRows();box.querySelector(`.pvRow[data-i="${st.vars.length-1}"] input`)?.focus();return}
      if(t.dataset.del!==undefined){st.vars.splice(Number(t.dataset.del),1);paintRows();return}
      if(t.dataset.st){const row=t.closest('.pvRow'),i=Number(row.dataset.i);st.vars[i].stock=Math.max(0,(Number(st.vars[i].stock)||0)+Number(t.dataset.st));row.querySelector('[data-k=stock]').value=st.vars[i].stock;syncStock();return}
      if(t.id==='pvFotoAdd'){document.getElementById('pvFile').click();return}
      if(t.dataset.fdel!==undefined){st.fotos.splice(Number(t.dataset.fdel),1);document.getElementById('pvFotos').innerHTML=fotosHtml();return}
    });
    box.addEventListener('input',e=>{const row=e.target.closest('.pvRow');if(!row)return;const i=Number(row.dataset.i),k=e.target.dataset.k;st.vars[i][k]=k==='stock'?Math.max(0,Math.floor(Number(e.target.value)||0)):e.target.value;if(k==='stock')syncStock()});
    document.getElementById('pvFile').addEventListener('change',async e=>{
      const f=e.target.files?.[0];e.target.value='';if(!f)return;
      const add=document.getElementById('pvFotoAdd');if(add){add.disabled=true;add.textContent='…'}
      try{st.fotos.push(await subirFoto(f))}catch(err){pdAviso('No se pudo subir la foto: '+(err.message||err))}
      document.getElementById('pvFotos').innerHTML=fotosHtml();
    });
  };
  window.pdTipoPayload=function(p){
    if(!st||st.id!==String(p.id))return null;
    const vars=st.vars.map(v=>({talla:String(v.talla||'').trim(),color:String(v.color||'').trim(),opcion:String(v.opcion||'').trim(),stock:Math.max(0,Math.floor(Number(v.stock)||0))})).filter(v=>v.talla||v.color||v.opcion);
    const seen=new Set();
    for(const v of vars){const k=clave(v).toLowerCase();if(seen.has(k))return {error:'Hay una variante repetida: '+clave(v)+'.'};seen.add(k);v.clave=clave(v)}
    if(st.tipo==='moda'&&vars.some(v=>!v.talla))return {error:'Cada fila necesita una talla.'};
    const precio=Number(document.getElementById('pdxEPrecio')?.value),antesRaw=document.getElementById('pvAntes')?.value;
    let antes=antesRaw===''||antesRaw==null?null:Number(antesRaw);
    if(antes!==null&&(!Number.isFinite(antes)||antes<=precio))return {error:'El «precio antes» debe ser mayor que el precio actual (o déjalo vacío).'};
    const patch={variantes:vars,fotos:st.fotos,precio_antes:antes===null?null:Math.round(antes*100)/100};
    if(vars.length){const sc=typeof stockCol==='function'?stockCol(p):'stock';if(sc)patch[sc]=vars.reduce((a,v)=>a+v.stock,0)}
    return {patch};
  };
})();
