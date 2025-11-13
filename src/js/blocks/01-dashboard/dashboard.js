//  Render principal: KPIs, gráfico y tabla de transacciones
  // =============================================================
  function calcMetrics(rangeStart, rangeEnd){
  const txRange = state.transacciones.filter(tx => between(parseISO(tx.fecha), rangeStart, rangeEnd));
  // Solo ingresos empresa
  const ingresos = txRange
    .filter(t => t.tipo === 'ingreso')
    .reduce((a, t) => a + (t.pagado ? Number(t.total) : 0), 0);
  // Costos = gastos empresa + reinversión capital
  const costos = txRange
    .filter(t => t.tipo === 'gasto' || t.tipo === 'reinversion')
    .reduce((a, t) => a + (t.pagado ? Number(t.total) : 0), 0);
  const ganancia = ingresos - costos;
  const tareasPend = state.tareas.filter(t => (typeof t.avance === 'number' ? t.avance < 100 : true)).length || 0;
  const proyectosAct = state.proyectos.length || 0;

  // extra: ticket promedio y uso para resumen
  const tickets = txRange.filter(t => t.tipo === 'ingreso').map(t => Number(t.total));
  const ticketProm = tickets.length ? (tickets.reduce((a, b) => a + b, 0) / tickets.length) : 0;

  return { ingresos, costos, ganancia, tareasPend, proyectosAct, diasConVentas: new Set(txRange.map(t=>t.fecha)).size, baseDias: Math.floor((rangeEnd - rangeStart)/(1000*60*60*24))+1, ticketProm };
}

  function renderKPIs(){
    const end = new Date();
    const start = addDays(end, -14);
    const m = calcMetrics(start, end);
    document.getElementById('kpiIngresos').textContent = fmt.format(m.ingresos);
    document.getElementById('kpiCostos').textContent = fmt.format(m.costos);
    document.getElementById('kpiGanancia').textContent = fmt.format(m.ganancia);
    document.getElementById('kpiTareas').textContent = m.tareasPend;
    document.getElementById('kpiProyectos').textContent = m.proyectosAct;

    document.getElementById('sumTicket').textContent = fmt.format(m.ticketProm);
    document.getElementById('sumDiasVenta').textContent = m.diasConVentas;
    document.getElementById('sumBaseDias').textContent = m.baseDias;
  }

  // ============== Tabla de transacciones ==============
  function renderTxTable(){
  const tbody = document.getElementById('txBody');
  const tipoSel = document.getElementById('txTipoFilter');
  const tipoFiltro = tipoSel ? tipoSel.value : '';
  tbody.innerHTML = '';
  state.transacciones
    .filter(tx => !tipoFiltro || tx.tipo === tipoFiltro)
    .sort((a,b)=> a.fecha<b.fecha?1:-1)
    .forEach(tx => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${tx.numero || ('TX-'+String(tx.id).padStart(4,'0'))}</td>
        <td>${tx.fecha}</td>
        <td>${tx.cliente}</td>
        <td><details><summary>Ver</summary>${tx.descripcion||''}</details></td>
        <td>${fmt.format(tx.total)} ${tx.pagado?'':'<span class="muted">(pend.)</span>'}</td>
        <td>${tx.estado}</td>
        <td>${tx.tipo==='ingreso'?'Ingresos empresa':tx.tipo==='gasto'?'Gastos empresa':'Reinversión capital'}</td>
        <td>
  <button class="btn ghost" onclick="editTx(${tx.id})">Editar</button>
  <button class="btn ghost" onclick="viewTx(${tx.id})">Ver</button>
  <button class="btn bad" onclick="deleteTx(${tx.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

// Recarga la tabla al cambiar el filtro
document.getElementById('txTipoFilter').addEventListener('change', renderTxTable);

  function viewTx(id){
    const tx = state.transacciones.find(t=>t.id===id);
    if(!tx) return;
    alert(`Transacción\n#${tx.numero || ('TX-'+String(tx.id).padStart(4,'0'))}\nFecha: ${tx.fecha}\nCliente: ${tx.cliente}\nTotal: ${fmt.format(tx.total)}\nEstado: ${tx.estado}\nPagado: ${tx.pagado?'Sí':'No'}\n\nDescripción:\n${tx.descripcion||'-'}`);
  }
  function editTx(id){
  const tx = state.transacciones.find(t=>t.id===id);
  if(!tx) return;
  const dlg = document.getElementById('txnDialog');
  const form = document.getElementById('txnForm');
  form.reset();
  form.fecha.value = tx.fecha;
  form.cliente.value = tx.cliente;
  form.estado.value = tx.estado;
  form.descripcion.value = tx.descripcion;
  form.total.value = tx.total;
  form.pagado.value = tx.pagado ? 'si' : 'no';
  form.tipo.value = tx.tipo || 'ingreso';
  form.numero.value = tx.numero || '';
  form.dataset.editId = id;
  dlg.showModal();

  dlg.addEventListener('close', function handler(){
    if(dlg.returnValue!=="confirm") { dlg.removeEventListener('close', handler); return; }
    const fd = new FormData(form);
    const editId = Number(form.dataset.editId);
    const updated = {
      id: editId,
      numero: (fd.get('numero')||'').trim() || ('TX-'+String(editId).padStart(4,'0')),
      fecha: fd.get('fecha'),
      cliente: (fd.get('cliente')||'').trim(),
      descripcion: (fd.get('descripcion')||'').trim(),
      total: Number(fd.get('total'))||0,
      pagado: fd.get('pagado')==='si',
      estado: fd.get('estado'),
      tipo: fd.get('tipo') || 'ingreso'
    };
    state.transacciones = state.transacciones.map(t=> t.id===editId ? updated : t);
    saveState();
    renderTxTable();
    renderKPIs();
    drawSalesChart();
    dlg.removeEventListener('close', handler);
  });
}
  function deleteTx(id){
    if(!confirm('¿Eliminar transacción?')) return;
    state.transacciones = state.transacciones.filter(t=>t.id!==id);
    saveState();
    renderTxTable();
    renderKPIs();
    drawSalesChart();
  }

  // ============== Formulario de nueva transacción ==============
 function setupTxnForm(){
    const dlg = document.getElementById('txnDialog');
    const form = document.getElementById('txnForm');
    document.getElementById('addTxnBtn').addEventListener('click',()=>{
      form.reset();
      form.fecha.value = todayISO();
      form.dataset.editId = ""; // <-- Limpia el flag de edición
      dlg.showModal();
    });

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=="confirm") return;
      const fd = new FormData(form);
      if(form.dataset.editId){ // Si es edición
        const editId = Number(form.dataset.editId);
        const updated = {
          id: editId,
          numero: (fd.get('numero')||'').trim() || ('TX-'+String(editId).padStart(4,'0')),
          fecha: fd.get('fecha'),
          cliente: (fd.get('cliente')||'').trim(),
          descripcion: (fd.get('descripcion')||'').trim(),
          total: Number(fd.get('total'))||0,
          pagado: fd.get('pagado')==='si',
          estado: fd.get('estado'),
          tipo: fd.get('tipo') || 'ingreso'
        };
        state.transacciones = state.transacciones.map(t=> t.id===editId ? updated : t);
        form.dataset.editId = ""; // Limpia el flag
      } else { // Si es nueva
        const id = ++state.txSeq;
        const numero = (fd.get('numero')||'').trim() || ('TX-'+String(id).padStart(4,'0'));
        const nuevo = {
          id,
          numero,
          fecha: fd.get('fecha'),
          cliente: (fd.get('cliente')||'').trim(),
          descripcion: (fd.get('descripcion')||'').trim(),
          total: Number(fd.get('total'))||0,
          pagado: fd.get('pagado')==='si',
          estado: fd.get('estado'),
          tipo: fd.get('tipo') || 'ingreso'
        };
        state.transacciones.push(nuevo);
      }
      saveState();
      renderTxTable();
      renderKPIs();
      drawSalesChart();
    });
}

  // =============================================================
  //  Gráfico de ingresos (canvas sin librerías)
  // =============================================================
  function getChartData(){
  const periodSel = document.getElementById('chartPeriod').value;
  const monthSel = document.getElementById('chartMonth');

  let labels = [], values = [], start, end;

  if(periodSel==='15'){
    end = new Date();
    start = addDays(end, -14);
    for(let d=0; d<15; d++){
      const day = addDays(start, d);
      const key = toISO(day);
      labels.push(key.slice(5));
      // SOLO ingresos empresa
      const sum = state.transacciones
        .filter(t=> t.pagado && t.fecha===key && t.tipo==='ingreso')
        .reduce((a,t)=> a+Number(t.total), 0);
      values.push(sum);
    }
  } else if(periodSel==='month'){
    const [y, m] = monthSel.value.split('-').map(Number); // yyyy-mm
    const first = new Date(y, m-1, 1);
    const last = new Date(y, m, 0);
    start = first; end = last;
    const days = last.getDate();
    for(let d=1; d<=days; d++){
      const key = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      labels.push(String(d));
      // SOLO ingresos empresa
      const sum = state.transacciones
        .filter(t=> t.pagado && t.fecha===key && t.tipo==='ingreso')
        .reduce((a,t)=> a+Number(t.total), 0);
      values.push(sum);
    }
  } else { // year
    const y = new Date().getFullYear();
    start = new Date(y,0,1); end = new Date(y,11,31);
    for(let m=1; m<=12; m++){
      labels.push(monthNames[m-1].slice(0,3));
      // SOLO ingresos empresa
      const sum = state.transacciones
        .filter(t=> t.pagado && t.fecha.startsWith(`${y}-${String(m).padStart(2,'0')}`) && t.tipo==='ingreso')
        .reduce((a,t)=> a+Number(t.total), 0);
      values.push(sum);
    }
  }

  return { labels, values, start, end };
}

  function drawGrid(ctx, w, h, stepY){
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for(let y=h-30; y>20; y-=stepY){
      ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w-10,y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawSalesChart(){
    const canvas = document.getElementById('salesChart');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);

    const { labels, values, start, end } = getChartData();

    // ejes
    ctx.strokeStyle = '#294255';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(40,10); ctx.lineTo(40,h-20); ctx.lineTo(w-10,h-20); ctx.stroke();

    const maxVal = Math.max(10, ...values);
    drawGrid(ctx, w, h, Math.max(20, Math.floor((h-60)/5)));

    // Escalas
    const left = 50, right = w-20, top = 20, bottom = h-30;
    const innerW = right-left, innerH = bottom-top;

    // Etiquetas X
    ctx.fillStyle = '#9fb3c8';
    ctx.font = '12px system-ui';
    const stepX = innerW / Math.max(1, (labels.length-1));
    labels.forEach((lab,i)=>{
      const x = left + i*stepX;
      if(i%Math.ceil(labels.length/10)===0 || labels.length<=15){
        ctx.fillText(lab, x-8, h-8);
      }
    });

    // Etiquetas Y (3 marcas)
    for(let i=0;i<=3;i++){
      const val = Math.round((maxVal*i/3));
      const y = bottom - (val/maxVal)*innerH;
      ctx.fillText('S/ '+val, 4, y+4);
    }

    // Línea
    ctx.strokeStyle = '#3dd6d0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    values.forEach((v,i)=>{
      const x = left + i*stepX;
      const y = bottom - (v/maxVal)*innerH;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();

    // Puntos
    ctx.fillStyle = '#7ef5f0';
    values.forEach((v,i)=>{
      const x = left + i*stepX;
      const y = bottom - (v/maxVal)*innerH;
      ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
    });

    // Resumen superior izquierdo
    const sum = values.reduce((a,b)=>a+b,0);
    ctx.fillStyle = '#cfe8ff';
    ctx.font = 'bold 14px system-ui';
    ctx.fillText('Total: '+fmt.format(sum), 60, 18);
  }

  function downloadChart(){
    const canvas = document.getElementById('salesChart');
    const a = document.createElement('a');
    a.download = 'ingresos.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  // =============================================================
  
