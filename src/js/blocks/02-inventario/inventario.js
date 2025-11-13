//  Inventario: render, CRUD y gráficos (Bloque 2)
  // =============================================================

  // Bandera de edición (cuando editamos un repuesto existente)
  let invEditId = null;

  // Derivados de inventario (costo total y ganancia unitaria)
  function computeInvDerived(it){
    const costoTotal = (Number(it.cantidad)||0) * (Number(it.puc)||0);
    const ganancia = (Number(it.puv)||0) - (Number(it.puc)||0);
    return { costoTotal, ganancia };
  }

  // Render de la tabla de inventario
  function renderInventoryTable(){
    const tbody = document.getElementById('invBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    state.inventario.forEach((it)=>{
      const { costoTotal, ganancia } = computeInvDerived(it);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${it.codigo}</td>
        <td>${it.nombre}</td>
        <td>${it.cantidad}</td>
        <td>${fmt.format(it.puc)}</td>
        <td>${fmt.format(costoTotal)}</td>
        <td>${fmt.format(it.puv)}</td>
        <td>${fmt.format(ganancia)}</td>
        <td>
          <button class="btn ghost" onclick="editInv('${it.codigo}')">Editar</button>
          <button class="btn bad" onclick="deleteInv('${it.codigo}')">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  // Editar repuesto
  function editInv(codigo){
    const it = state.inventario.find(x=>x.codigo===codigo);
    if(!it) return;
    invEditId = codigo;
    const dlg = document.getElementById('invDialog');
    const f = document.getElementById('invForm');
    const title = document.getElementById('invDialogTitle');
    if(title) title.textContent = 'Editar repuesto';
    if(f){
      f.codigo.value = it.codigo;
      f.nombre.value = it.nombre;
      f.cantidad.value = it.cantidad;
      f.puc.value = it.puc;
      f.puv.value = it.puv;
    }
    if(dlg) dlg.showModal();
  }

  // Eliminar repuesto
  function deleteInv(codigo){
    if(!confirm('¿Eliminar repuesto '+codigo+'?')) return;
    state.inventario = state.inventario.filter(x=>x.codigo!==codigo);
    saveState();
    renderInventoryTable();
    drawInvCharts();
  }

  // Setup del formulario de inventario (añadir/editar)
  function setupInventoryForm(){
    const btn = document.getElementById('addItemBtn');
    const dlg = document.getElementById('invDialog');
    const f = document.getElementById('invForm');

    if(btn){
      btn.addEventListener('click', ()=>{
        invEditId = null;
        if(f) f.reset();
        const title = document.getElementById('invDialogTitle');
        if(title) title.textContent = 'Nuevo repuesto';
        if(dlg) dlg.showModal();
      });
    }

    

    if(dlg){
      dlg.addEventListener('close', ()=>{
        if(dlg.returnValue!=="confirm") return;
        const fd = new FormData(f);
        const nuevo = {
          codigo: (fd.get('codigo')||'').trim(),
          nombre: (fd.get('nombre')||'').trim(),
          cantidad: Number(fd.get('cantidad'))||0,
          puc: Number(fd.get('puc'))||0,
          puv: Number(fd.get('puv'))||0,
        };
        if(!nuevo.codigo || !nuevo.nombre){ alert('Completa código y nombre.'); return; }

        const exists = state.inventario.find(x=>x.codigo===nuevo.codigo);
        if(invEditId){
          // Si cambiaron el código, evitar colisión
          if(exists && exists.codigo!==invEditId){
            alert('Ya existe un repuesto con ese código.'); return;
          }
          state.inventario = state.inventario.map(x=> x.codigo===invEditId ? nuevo : x);
        } else {
          if(exists){ alert('Ya existe un repuesto con ese código.'); return; }
          state.inventario.push(nuevo);
        }

        saveState();
        renderInventoryTable();
        drawInvCharts();
      });
    }
  }

  // =============================================================
  //  Gráficos de Inventario (canvas puro, sin librerías)
  // =============================================================

  // Barras genéricas (para reutilizar con distintos datos)
  function drawBarChart(canvasId, labels, values, title){
    const c = document.getElementById(canvasId);
    if(!c) return;
    const ctx = c.getContext('2d');
    const w=c.width, h=c.height;
    ctx.clearRect(0,0,w,h);

    // Ejes
    ctx.strokeStyle = '#294255';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40,10); ctx.lineTo(40,h-30); ctx.lineTo(w-10,h-30); ctx.stroke();

    // Grid
    ctx.strokeStyle='rgba(255,255,255,.08)';
    for(let y=h-30; y>20; y-=30){
      ctx.beginPath(); ctx.moveTo(40,y); ctx.lineTo(w-10,y); ctx.stroke();
    }

    const maxVal = Math.max(10, ...values);
    const left=50, right=w-20, top=20, bottom=h-30;
    const innerW = right-left, innerH = bottom - top;
    const n = labels.length;
    const barW = Math.max(10, Math.floor((innerW - 20) / Math.max(1, n*1.4)));
    const gap = Math.max(8, Math.floor(barW*0.4));
    const stepX = (barW + gap);

    // Título
    ctx.fillStyle = '#cfe8ff';
    ctx.font = 'bold 14px system-ui';
    if(title) ctx.fillText(title, 60, 18);

    // Etiquetas Y
    ctx.fillStyle = '#9fb3c8';
    ctx.font = '12px system-ui';
    for(let i=0;i<=3;i++){
      const val = Math.round((maxVal * i)/3);
      const y = bottom - (val/maxVal)*innerH;
      ctx.fillText('S/ '+val, 4, y+4);
    }

    // Barras
    ctx.fillStyle = '#3dd6d0';
    labels.forEach((lab, i)=>{
      const x = left + i*stepX;
      const v = values[i]||0;
      const hBar = (v/maxVal)*innerH;
      const y = bottom - hBar;
      ctx.fillRect(x, y, barW, hBar);

      // Etiqueta X (no saturar)
      if (barW >= 18 || i % Math.ceil(labels.length/10) === 0){
        ctx.fillStyle = '#9fb3c8';
        ctx.fillText(lab, x, h-8);
        ctx.fillStyle = '#3dd6d0';
      }
    });

    // Línea de promedio
    const avg = values.reduce((a,b)=>a+b,0) / Math.max(1, values.length);
    const yAvg = bottom - (avg/maxVal)*innerH;
    ctx.strokeStyle = '#7ef5f0';
    ctx.setLineDash([6,6]);
    ctx.beginPath(); ctx.moveTo(40, yAvg); ctx.lineTo(w-10, yAvg); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#cfe8ff';
    ctx.fillText('Prom: '+fmt.format(avg), w-160, yAvg-6);
  }

  // Ensamblar datos y dibujar ambos gráficos
  function drawInvCharts(){
    // Chart 1: Cantidades por repuesto
    const labels1 = state.inventario.map(it=> it.codigo);
    const values1 = state.inventario.map(it=> Number(it.cantidad)||0);
    drawBarChart('invBarChart', labels1, values1, 'Stock (unidades) por repuesto');

    // Chart 2: Valor en almacén (Costo Total) por repuesto
    const labels2 = state.inventario.map(it=> it.codigo);
    const values2 = state.inventario.map(it=> (Number(it.cantidad)||0) * (Number(it.puc)||0));
    drawBarChart('invValChart', labels2, values2, 'Valor de inventario (S/) por repuesto');
  }

  // =============================================================
  //  Integración de navegación y refrescos
  // =============================================================
window.addEventListener('microerp:router-ready', () => {
  const previousShow = window.showRoute;
  window.showRoute = function(name){
    previousShow(name);
    if(name==='inventario'){
      renderInventoryTable();
      drawInvCharts();
    }
    if(name==='principal'){
      renderKPIs();
      drawSalesChart();
    }
  };
});

  // =============================================================
  //  Inicialización complementaria (Inventario)
  // =============================================================
  window.addEventListener('DOMContentLoaded', ()=>{
    setupInventoryForm();
    renderInventoryTable();
    drawInvCharts();
  });

  // =============================================================
  //  Helpers/Extensiones futuros (placeholder)
  // =============================================================
  // En futuras iteraciones: vincular ventas con salidas de inventario,
  // rotación, cobertura de stock, y alertas de mínimos.

  // Exponer utilidades por si deseas inspeccionarlas desde la consola
  window.microerp = Object.assign(window.microerp||{}, {
    renderInventoryTable,
    drawInvCharts
  });

  
