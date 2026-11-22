/* Horario general de Pidemás: los negocios solo pueden atender entre 9:00 am y 10:00 pm.
   La tienda deja de recibir pedidos a las 9:30 pm. */
(function(){
  if(window.__pdHorarioGlobal)return; window.__pdHorarioGlobal=true;
  var MIN='09:00', MAX='22:00';
  var NOTA='<b>Horario Pidemás:</b> 9:00 a. m. a 10:00 p. m. · <b>último pedido 9:30 p. m.</b> Tu horario debe estar dentro de ese rango.';
  function aMin(v){var m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?(+m[1])*60+(+m[2]):null;}
  function valido(abre,cierra){
    var a=aMin(abre),c=aMin(cierra);
    if(a==null||c==null)return 'Completa la hora de apertura y cierre.';
    if(a<aMin(MIN))return 'La hora de apertura no puede ser antes de las 9:00 a. m.';
    if(c>aMin(MAX))return 'La hora de cierre no puede ser después de las 10:00 p. m.';
    if(c<=a)return 'La hora de cierre debe ser después de la apertura.';
    return '';
  }
  window.pdValidarHorarioDia=valido;

  // Guardado por día (Perfil).
  var gDia=window.guardarHorarioDia;
  if(typeof gDia==='function'){
    window.guardarHorarioDia=function(dia){
      var row=document.querySelector('.perfilHorarioRow[data-horario-dia="'+dia+'"]');
      var activo=row&&row.querySelector('.inlineDiaActivo')?row.querySelector('.inlineDiaActivo').checked:true;
      if(row&&activo){
        var e=valido((row.querySelector('.inlineHoraAbre')||{}).value,(row.querySelector('.inlineHoraCierra')||{}).value);
        if(e){pdAviso(e);return;}
      }
      return gDia.apply(this,arguments);
    };
  }

  // Guardado de la semana completa (modal).
  var btn=document.getElementById('guardarHorario');
  if(btn&&typeof btn.onclick==='function'&&typeof window.obtenerHorarioSemanal==='function'){
    var orig=btn.onclick;
    btn.onclick=function(ev){
      var txt=String(window.obtenerHorarioSemanal()||'');
      var malos=txt.split('|').filter(Boolean).map(function(p){var d=p.split('=');var h=(d[1]||'').split('-');return {dia:d[0],err:valido(h[0],h[1])};}).filter(function(x){return x.err;});
      if(malos.length){pdAviso('Revisa '+malos[0].dia+': '+malos[0].err);return;}
      return orig.call(this,ev);
    };
  }

  // Límites en los selectores de hora y nota visible.
  function ajustar(){
    document.querySelectorAll('input[type="time"].inlineHoraAbre, input[type="time"].inlineHoraCierra, input[type="time"].perfilHorarioTimeInput, #pdxHorRows input[type="time"]').forEach(function(i){
      if(i.min!==MIN)i.min=MIN; if(i.max!==MAX)i.max=MAX;
    });
    var vis=document.getElementById('verHorarioHorario');
    if(vis&&!(vis.previousElementSibling&&vis.previousElementSibling.classList.contains('pdHorarioNota'))){
      var n=document.createElement('p');n.className='pdHorarioNota';n.innerHTML=NOTA;vis.parentNode.insertBefore(n,vis);
    }
    var pr=document.getElementById('pdxHorRows');
    if(pr&&!(pr.previousElementSibling&&pr.previousElementSibling.classList.contains('pdHorarioNota'))){var n2=document.createElement('p');n2.className='pdHorarioNota';n2.innerHTML=NOTA;pr.parentNode.insertBefore(n2,pr);}
    var help=document.querySelector('#horarioEdicion .horarioHelp');
    if(help&&!help.dataset.pdNota){help.dataset.pdNota='1';help.innerHTML=NOTA;}
  }
  new MutationObserver(function(){ajustar();}).observe(document.body,{childList:true,subtree:true});
  ajustar();
})();
