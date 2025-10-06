//  BLOQUE 6: RR.HH. — Empleados, Ausencias, Turnos, Evaluaciones,
  //             Organigrama y Onboarding (sin librerías)
  // =============================================================

  // ---------- Estado base y datos demo ----------
  if(!state.rrhh) state.rrhh = { empleados:[], ausencias:[], turnos:[], evaluaciones:[], onboarding:[] };
  if(!Array.isArray(state.rrhh.empleados)) state.rrhh.empleados=[];
  if(!Array.isArray(state.rrhh.ausencias)) state.rrhh.ausencias=[];
  if(!Array.isArray(state.rrhh.turnos)) state.rrhh.turnos=[];
  if(!Array.isArray(state.rrhh.evaluaciones)) state.rrhh.evaluaciones=[];
  if(!Array.isArray(state.rrhh.onboarding)) state.rrhh.onboarding=[];

  if(typeof state.empSeq!=='number') state.empSeq=0;
  if(typeof state.absSeq!=='number') state.absSeq=0;
  if(typeof state.shiftSeq!=='number') state.shiftSeq=0;
  if(typeof state.evalSeq!=='number') state.evalSeq=0;
  if(typeof state.todoSeq!=='number') state.todoSeq=0;

  // Seed si está vacío
  if(state.rrhh.empleados.length===0){
    state.rrhh.empleados.push(
      { id: ++state.empSeq, nombre:'Ana Flores', cargo:'Administración', email:'ana@empresa.com', telefono:'999111222', ingreso: toISO(addDays(new Date(), -120)), sueldo: 2500, managerId:null },
      { id: ++state.empSeq, nombre:'Carlos Ruiz', cargo:'Jefe Taller', email:'carlos@empresa.com', telefono:'999333444', ingreso: toISO(addDays(new Date(), -300)), sueldo: 3500, managerId:null },
      { id: ++state.empSeq, nombre:'Diana Soto', cargo:'Mecánico', email:'diana@empresa.com', telefono:'988777666', ingreso: toISO(addDays(new Date(), -60)), sueldo: 1800, managerId: state.rrhh.empleados[1].id }
    );
    state.rrhh.ausencias.push(
      { id: ++state.absSeq, empId: state.rrhh.empleados[2].id, desde: toISO(addDays(new Date(), -5)), hasta: toISO(addDays(new Date(), -3)), tipo:'Vacaciones', motivo:'—' }
    );
    state.rrhh.turnos.push(
      { id: ++state.shiftSeq, empId: state.rrhh.empleados[2].id, fecha: toISO(new Date()), inicio:'09:00', fin:'18:00' }
    );
    state.rrhh.evaluaciones.push(
      { id: ++state.evalSeq, empId: state.rrhh.empleados[2].id, fecha: toISO(addDays(new Date(), -7)), puntaje: 4, comentarios:'Buen desempeño.' }
    );
    state.rrhh.onboarding.push(
      { id: ++state.todoSeq, empId: state.rrhh.empleados[2].id, texto:'Entregar documentos', done:true },
      { id: ++state.todoSeq, empId: state.rrhh.empleados[2].id, texto:'Capacitación seguridad', done:false }
    );
    saveState();
  }

  // ---------- Helpers ----------
  function empName(id){ const e = state.rrhh.empleados.find(x=>x.id===id); return e? e.nombre : '—'; }
  function empOptions(selectedId){
    return ['<option value="">— Seleccionar —</option>']
      .concat(state.rrhh.empleados.map(e=> `<option value="${e.id}" ${selectedId===e.id?'selected':''}>${e.nombre}</option>`))
      .join('');
  }

  // ---------- Layout principal RR.HH. ----------
  function ensureRRHHLayout(){
    const route = document.getElementById('route-rrhh');
    if(!route || route.dataset.enhanced==='1') return;
    route.innerHTML = `
      <div class="card" style="padding:0; background:transparent; border:none">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px">
          <div>
            <h3 style="margin:0">RR.HH.</h3>
            <div class="muted" style="font-size:12px">Gestión de empleados, ausencias, turnos, evaluaciones, organigrama y onboarding.</div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <button class="btn ghost" onclick="exportTableCSV(rrhhCurrentTableId(),'rrhh.csv')">Exportar CSV</button>
            <button class="btn ghost" onclick="printSection('route-rrhh')">Imprimir</button>
          </div>
        </div>
        <div class="tabs" id="rrhhTabs" style="padding:0 12px 12px">
          <button class="active" data-tab="empleados">Empleados</button>
          <button data-tab="ausencias">Ausencias</button>
          <button data-tab="turnos">Turnos</button>
          <button data-tab="evaluaciones">Evaluaciones</button>
          <button data-tab="organigrama">Organigrama</button>
          <button data-tab="onboarding">Onboarding</button>
        </div>
        <div id="rrhhContent" class="card" style="margin:0 12px 12px; min-height:420px"></div>
      </div>

      <!-- Diálogos -->
      <dialog id="dlgEmpleado">
        <form id="formEmpleado" method="dialog" style="min-width:740px">
          <h3 id="dlgEmpTitle">Nuevo empleado</h3>
          <div class="row" style="grid-template-columns:repeat(3,1fr)">
            <div><label>Nombre</label><input name="nombre" required></div>
            <div><label>Cargo</label><input name="cargo" required></div>
            <div><label>Email</label><input name="email" type="email"></div>
            <div><label>Teléfono</label><input name="telefono"></div>
            <div><label>Ingreso</label><input name="ingreso" type="date" value="${todayISO()}"></div>
            <div><label>Sueldo (S/)</label><input name="sueldo" type="number" step="0.01" value="0"></div>
            <div class="span-3"><label>Manager</label><select name="managerId"></select></div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
            <button class="btn ghost" value="cancel">Cancelar</button>
            <button class="btn" value="confirm">Guardar</button>
          </div>
        </form>
      </dialog>

      <dialog id="dlgAusencia">
        <form id="formAusencia" method="dialog" style="min-width:640px">
          <h3 id="dlgAbsTitle">Nueva ausencia</h3>
          <div class="row" style="grid-template-columns:repeat(3,1fr)">
            <div><label>Empleado</label><select name="empId">${empOptions()}</select></div>
            <div><label>Desde</label><input name="desde" type="date" value="${todayISO()}"></div>
            <div><label>Hasta</label><input name="hasta" type="date" value="${todayISO()}"></div>
            <div><label>Tipo</label><select name="tipo"><option>Vacaciones</option><option>Permiso</option><option>Licencia</option><option>Incapacidad</option></select></div>
            <div class="span-3"><label>Motivo</label><input name="motivo"></div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
            <button class="btn ghost" value="cancel">Cancelar</button>
            <button class="btn" value="confirm">Guardar</button>
          </div>
        </form>
      </dialog>

      <dialog id="dlgTurno">
        <form id="formTurno" method="dialog" style="min-width:620px">
          <h3 id="dlgTurnoTitle">Nuevo turno</h3>
          <div class="row" style="grid-template-columns:repeat(3,1fr)">
            <div><label>Empleado</label><select name="empId">${empOptions()}</select></div>
            <div><label>Fecha</label><input name="fecha" type="date" value="${todayISO()}"></div>
            <div><label>Inicio</label><input name="inicio" type="time" value="09:00"></div>
            <div><label>Fin</label><input name="fin" type="time" value="18:00"></div>
            <div class="span-3"><label>Notas</label><input name="notas"></div>
          </div>
          <div class="right" style="display:flex; gap:8px; margin-top:12px">
            <button class="btn ghost" value="cancel">Cancelar</button>
            <button class="btn" value="confirm">Guardar</button>
          </div>
        </form>
      </dialog>

      <dialog id="dlgEval">
        <form id="formEval" method="dialog" style="min-width:620px">
          <h3 id="dlgEvalTitle">Nueva evaluación</h3>
          <div class="row" style="grid-template-columns:repeat(3,1fr)">
            <div><label>Empleado</label><select name="empId">${empOptions()}</select></div>
            <div><label>Fecha</label><input name="fecha" type="date" value="${todayISO()}"></div>
            <div><label>Puntaje (1–5)</label><input name="puntaje" type="number" min="1" max="5" value="3"></div>
            <div class="span-3"><label>Comentarios</label><textarea name="comentarios" style="min-height:80px"></textarea></div>
          </div>
          <div class="right" style="display:flex; gap:8px; margin-top:12px">
            <button class="btn ghost" value="cancel">Cancelar</button>
            <button class="btn" value="confirm">Guardar</button>
          </div>
        </form>
      </dialog>
    `;
    route.dataset.enhanced='1';
  }

  // ---------- Control de tabs ----------
  function rrhhBindTabs(){
    const tabs = document.getElementById('rrhhTabs');
    const content = document.getElementById('rrhhContent');
    if(!tabs || !content) return;
    tabs.querySelectorAll('button').forEach(btn=>{
      if(btn.dataset.bound) return; btn.dataset.bound='1';
      btn.addEventListener('click', ()=>{
        tabs.querySelectorAll('button').forEach(b=> b.classList.remove('active'));
        btn.classList.add('active');
        renderRRHHTab(btn.dataset.tab);
      });
    });
    renderRRHHTab('empleados');
  }
  function renderRRHHTab(key){
    if(key==='empleados') renderEmpleados();
    else if(key==='ausencias') renderAusencias();
    else if(key==='turnos') renderTurnos();
    else if(key==='evaluaciones') renderEvaluaciones();
    else if(key==='organigrama') renderOrganigrama();
    else renderOnboarding();
  }
  function rrhhCurrentTableId(){
    const active = document.querySelector('#rrhhTabs button.active')?.dataset.tab;
    switch(active){
      case 'empleados': return 'tblEmpleados';
      case 'ausencias': return 'tblAusencias';
      case 'turnos': return 'tblTurnos';
      case 'evaluaciones': return 'tblEvaluaciones';
      case 'onboarding': return 'tblOnboarding';
      default: return 'tblEmpleados';
    }
  }

  // =============================================================
  //  Empleados
  // =============================================================
  function renderEmpleados(){
    const content = document.getElementById('rrhhContent');
    content.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px">
        <div style="display:flex; gap:8px; align-items:center">
          <h3 style="margin:0">Empleados</h3>
          <span class="pill muted">Total: ${state.rrhh.empleados.length}</span>
        </div>
        <div style="display:flex; gap:8px">
          <button class="btn ok" id="btnAddEmp">Añadir</button>
        </div>
      </div>
      <table id="tblEmpleados">
        <thead><tr>
          <th>#</th><th>Nombre</th><th>Cargo</th><th>Email</th><th>Teléfono</th><th>Ingreso</th><th>Sueldo</th><th>Manager</th><th>Acción</th>
        </tr></thead>
        <tbody id="empBody"></tbody>
      </table>
    `;
    const tbody = document.getElementById('empBody');
    state.rrhh.empleados
      .slice()
      .sort((a,b)=> a.nombre.localeCompare(b.nombre))
      .forEach((e,i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${String(i+1).padStart(2,'0')}</td>
          <td>${e.nombre}</td>
          <td>${e.cargo||'—'}</td>
          <td>${e.email||'—'}</td>
          <td>${e.telefono||'—'}</td>
          <td>${e.ingreso||'—'}</td>
          <td>${fmt.format(Number(e.sueldo)||0)}</td>
          <td>${e.managerId? empName(e.managerId): '—'}</td>
          <td style="display:flex; gap:6px; flex-wrap:wrap">
            <button class="btn ghost" onclick="editEmpleado(${e.id})">Editar</button>
            <button class="btn bad" onclick="deleteEmpleado(${e.id})">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    document.getElementById('btnAddEmp').addEventListener('click', ()=> openEmpleadoDialog());
  }

  function openEmpleadoDialog(item){
    const dlg = document.getElementById('dlgEmpleado');
    const form = document.getElementById('formEmpleado');
    const title = document.getElementById('dlgEmpTitle');
    // Rellenar managers
    form.managerId.innerHTML = ['<option value="">— Ninguno —</option>']
      .concat(state.rrhh.empleados.map(e=> `<option value="${e.id}" ${item?.managerId===e.id?'selected':''}>${e.nombre}</option>`)).join('');
    if(item){
      title.textContent='Editar empleado';
      form.nombre.value=item.nombre; form.cargo.value=item.cargo||''; form.email.value=item.email||'';
      form.telefono.value=item.telefono||''; form.ingreso.value=item.ingreso||todayISO();
      form.sueldo.value=item.sueldo||0; form.managerId.value=item.managerId||'';
      form.dataset.editId=item.id;
    }else{
      title.textContent='Nuevo empleado';
      form.reset(); form.ingreso.value=todayISO(); form.dataset.editId='';
    }
    dlg.showModal();

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=='confirm') return;
      const fd = new FormData(form);
      const payload = {
        id: item? item.id : ++state.empSeq,
        nombre: (fd.get('nombre')||'').trim(),
        cargo: (fd.get('cargo')||'').trim(),
        email: (fd.get('email')||'').trim(),
        telefono: (fd.get('telefono')||'').trim(),
        ingreso: fd.get('ingreso'),
        sueldo: Number(fd.get('sueldo'))||0,
        managerId: fd.get('managerId')? Number(fd.get('managerId')): null
      };
      if(!payload.nombre){ alert('Nombre requerido'); return; }
      if(item){
        state.rrhh.empleados = state.rrhh.empleados.map(e=> e.id===item.id? payload : e);
      }else{
        state.rrhh.empleados.push(payload);
      }
      saveState();
      renderEmpleados();
    }, {once:true});
  }
  function editEmpleado(id){ const e = state.rrhh.empleados.find(x=>x.id===id); if(e) openEmpleadoDialog(e); }
  function deleteEmpleado(id){
    if(!confirm('¿Eliminar empleado y sus registros asociados?')) return;
    state.rrhh.empleados = state.rrhh.empleados.filter(e=> e.id!==id);
    state.rrhh.ausencias = state.rrhh.ausencias.filter(a=> a.empId!==id);
    state.rrhh.turnos = state.rrhh.turnos.filter(t=> t.empId!==id);
    state.rrhh.evaluaciones = state.rrhh.evaluaciones.filter(v=> v.empId!==id);
    state.rrhh.onboarding = state.rrhh.onboarding.filter(o=> o.empId!==id);
    saveState(); renderEmpleados();
  }

  // =============================================================
  //  Ausencias
  // =============================================================
  function renderAusencias(){
    const content = document.getElementById('rrhhContent');
    content.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px">
        <div style="display:flex; gap:8px; align-items:center">
          <h3 style="margin:0">Ausencias</h3>
          <select id="absEmpFilter" style="min-width:220px">${empOptions('')}</select>
          <span class="pill muted">Total: ${state.rrhh.ausencias.length}</span>
        </div>
        <div style="display:flex; gap:8px">
          <button class="btn ok" id="btnAddAbs">Añadir</button>
        </div>
      </div>
      <table id="tblAusencias">
        <thead><tr>
          <th>#</th><th>Empleado</th><th>Desde</th><th>Hasta</th><th>Días</th><th>Tipo</th><th>Motivo</th><th>Acción</th>
        </tr></thead>
        <tbody id="absBody"></tbody>
      </table>
    `;
    const filter = document.getElementById('absEmpFilter');
    filter.addEventListener('change', ()=> fillAbsTable(filter.value? Number(filter.value): null));
    document.getElementById('btnAddAbs').addEventListener('click', ()=> openAusenciaDialog());
    fillAbsTable(null);
  }
  function fillAbsTable(empId){
    const tbody = document.getElementById('absBody');
    tbody.innerHTML='';
    let list = state.rrhh.ausencias.slice().sort((a,b)=> a.desde<b.desde?1:-1);
    if(empId) list = list.filter(a=> a.empId===empId);
    list.forEach((a,i)=>{
      const dias = Math.max(1, Math.round((parseISO(a.hasta)-parseISO(a.desde))/(1000*60*60*24))+1);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(i+1).padStart(2,'0')}</td>
        <td>${empName(a.empId)}</td>
        <td>${a.desde}</td>
        <td>${a.hasta}</td>
        <td>${dias}</td>
        <td>${a.tipo}</td>
        <td><details><summary>Ver</summary>${a.motivo||'—'}</details></td>
        <td style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn ghost" onclick="editAusencia(${a.id})">Editar</button>
          <button class="btn bad" onclick="deleteAusencia(${a.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
  function openAusenciaDialog(item){
    const dlg = document.getElementById('dlgAusencia');
    const form = document.getElementById('formAusencia');
    const title = document.getElementById('dlgAbsTitle');
    // actualizar opciones empleado
    form.empId.innerHTML = empOptions(item?.empId || '');
    if(item){
      title.textContent='Editar ausencia';
      form.empId.value=item.empId; form.desde.value=item.desde; form.hasta.value=item.hasta;
      form.tipo.value=item.tipo; form.motivo.value=item.motivo||'';
    }else{
      title.textContent='Nueva ausencia';
      form.reset(); form.desde.value=todayISO(); form.hasta.value=todayISO();
    }
    dlg.showModal();

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=='confirm') return;
      const fd = new FormData(form);
      const payload = {
        id: item? item.id : ++state.absSeq,
        empId: Number(fd.get('empId')),
        desde: fd.get('desde'),
        hasta: fd.get('hasta'),
        tipo: fd.get('tipo'),
        motivo: (fd.get('motivo')||'').trim()
      };
      if(!payload.empId){ alert('Selecciona un empleado'); return; }
      if(parseISO(payload.hasta) < parseISO(payload.desde)){ alert('Rango de fechas inválido'); return; }
      if(item){
        state.rrhh.ausencias = state.rrhh.ausencias.map(a=> a.id===item.id? payload : a);
      }else{
        state.rrhh.ausencias.push(payload);
      }
      saveState(); renderAusencias();
    }, {once:true});
  }
  function editAusencia(id){ const a = state.rrhh.ausencias.find(x=>x.id===id); if(a) openAusenciaDialog(a); }
  function deleteAusencia(id){
    if(!confirm('¿Eliminar ausencia?')) return;
    state.rrhh.ausencias = state.rrhh.ausencias.filter(a=> a.id!==id);
    saveState(); renderAusencias();
  }

  // =============================================================
  //  Turnos
  // =============================================================
  function renderTurnos(){
    const content = document.getElementById('rrhhContent');
    content.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px">
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
          <h3 style="margin:0">Turnos</h3>
          <select id="turnEmpFilter" style="min-width:220px">${empOptions('')}</select>
          <input id="turnWeek" type="week" value="${new Date().getFullYear()}-W${String(Math.ceil(( (new Date()-new Date(new Date().getFullYear(),0,1)) / 86400000 + new Date(new Date().getFullYear(),0,1).getDay()+1)/7)).padStart(2,'0')}" />
        </div>
        <div style="display:flex; gap:8px">
          <button class="btn ok" id="btnAddTurno">Añadir</button>
        </div>
      </div>
      <table id="tblTurnos">
        <thead><tr>
          <th>#</th><th>Empleado</th><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Notas</th><th>Acción</th>
        </tr></thead>
        <tbody id="turnBody"></tbody>
      </table>
    `;
    document.getElementById('btnAddTurno').addEventListener('click', ()=> openTurnoDialog());
    const fill = ()=> fillTurnos(
      document.getElementById('turnEmpFilter').value? Number(document.getElementById('turnEmpFilter').value):null,
      document.getElementById('turnWeek').value
    );
    document.getElementById('turnEmpFilter').addEventListener('change', fill);
    document.getElementById('turnWeek').addEventListener('change', fill);
    fill();
  }
  function fillTurnos(empId, weekStr){
    const tbody = document.getElementById('turnBody'); tbody.innerHTML='';
    let list = state.rrhh.turnos.slice().sort((a,b)=> a.fecha<b.fecha?1:-1);
    if(empId) list = list.filter(t=> t.empId===empId);
    if(weekStr){
      const [y, w] = weekStr.split('-W').map(Number);
      const d = new Date(y, 0, 1 + (w-1)*7);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay()||7) + 1); // lunes
      const end = addDays(start, 6);
      list = list.filter(t=> between(parseISO(t.fecha), start, end));
    }
    list.forEach((t,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(i+1).padStart(2,'0')}</td>
        <td>${empName(t.empId)}</td>
        <td>${t.fecha}</td>
        <td>${t.inicio}</td>
        <td>${t.fin}</td>
        <td>${t.notas||'—'}</td>
        <td style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn ghost" onclick="editTurno(${t.id})">Editar</button>
          <button class="btn bad" onclick="deleteTurno(${t.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
  function openTurnoDialog(item){
    const dlg = document.getElementById('dlgTurno');
    const form = document.getElementById('formTurno');
    const title = document.getElementById('dlgTurnoTitle');
    form.empId.innerHTML = empOptions(item?.empId || '');
    if(item){
      title.textContent='Editar turno';
      form.empId.value=item.empId; form.fecha.value=item.fecha; form.inicio.value=item.inicio; form.fin.value=item.fin; form.notas.value=item.notas||'';
    }else{
      title.textContent='Nuevo turno';
      form.reset(); form.fecha.value=todayISO(); form.inicio.value='09:00'; form.fin.value='18:00';
    }
    dlg.showModal();

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=='confirm') return;
      const fd = new FormData(form);
      const payload = {
        id: item? item.id : ++state.shiftSeq,
        empId: Number(fd.get('empId')),
        fecha: fd.get('fecha'),
        inicio: fd.get('inicio'),
        fin: fd.get('fin'),
        notas: (fd.get('notas')||'').trim()
      };
      if(!payload.empId){ alert('Selecciona un empleado'); return; }
      if(item){ state.rrhh.turnos = state.rrhh.turnos.map(t=> t.id===item.id? payload : t); }
      else { state.rrhh.turnos.push(payload); }
      saveState(); renderTurnos();
    }, {once:true});
  }
  function editTurno(id){ const t = state.rrhh.turnos.find(x=>x.id===id); if(t) openTurnoDialog(t); }
  function deleteTurno(id){
    if(!confirm('¿Eliminar turno?')) return;
    state.rrhh.turnos = state.rrhh.turnos.filter(t=> t.id!==id);
    saveState(); renderTurnos();
  }

  // =============================================================
  //  Evaluaciones
  // =============================================================
  function renderEvaluaciones(){
    const content = document.getElementById('rrhhContent');
    content.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px">
        <div style="display:flex; gap:8px; align-items:center">
          <h3 style="margin:0">Evaluaciones</h3>
          <select id="evalEmpFilter" style="min-width:220px">${empOptions('')}</select>
          <span class="pill muted">Total: ${state.rrhh.evaluaciones.length}</span>
        </div>
        <div style="display:flex; gap:8px">
          <button class="btn ok" id="btnAddEval">Añadir</button>
        </div>
      </div>
      <table id="tblEvaluaciones">
        <thead><tr>
          <th>#</th><th>Empleado</th><th>Fecha</th><th>Puntaje</th><th>Comentarios</th><th>Acción</th>
        </tr></thead>
        <tbody id="evalBody"></tbody>
      </table>
    `;
    document.getElementById('btnAddEval').addEventListener('click', ()=> openEvalDialog());
    const filter = document.getElementById('evalEmpFilter');
    filter.addEventListener('change', ()=> fillEval(filter.value? Number(filter.value): null));
    fillEval(null);
  }
  function fillEval(empId){
    const tbody = document.getElementById('evalBody');
    tbody.innerHTML='';
    let list = state.rrhh.evaluaciones.slice().sort((a,b)=> a.fecha<b.fecha?1:-1);
    if(empId) list = list.filter(v=> v.empId===empId);
    list.forEach((v,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(i+1).padStart(2,'0')}</td>
        <td>${empName(v.empId)}</td>
        <td>${v.fecha}</td>
        <td>${v.puntaje}</td>
        <td><details><summary>Ver</summary>${(v.comentarios||'').replaceAll('<','&lt;')}</details></td>
        <td style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn ghost" onclick="editEval(${v.id})">Editar</button>
          <button class="btn bad" onclick="deleteEval(${v.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
  function openEvalDialog(item){
    const dlg = document.getElementById('dlgEval');
    const form = document.getElementById('formEval');
    const title = document.getElementById('dlgEvalTitle');
    form.empId.innerHTML = empOptions(item?.empId || '');
    if(item){
      title.textContent='Editar evaluación';
      form.empId.value=item.empId; form.fecha.value=item.fecha; form.puntaje.value=item.puntaje; form.comentarios.value=item.comentarios||'';
    }else{
      title.textContent='Nueva evaluación';
      form.reset(); form.fecha.value=todayISO(); form.puntaje.value=3;
    }
    dlg.showModal();

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=='confirm') return;
      const fd = new FormData(form);
      const payload = {
        id: item? item.id : ++state.evalSeq,
        empId: Number(fd.get('empId')),
        fecha: fd.get('fecha'),
        puntaje: Number(fd.get('puntaje'))||0,
        comentarios: (fd.get('comentarios')||'').trim()
      };
      if(!payload.empId){ alert('Selecciona un empleado'); return; }
      if(item){ state.rrhh.evaluaciones = state.rrhh.evaluaciones.map(v=> v.id===item.id? payload : v); }
      else { state.rrhh.evaluaciones.push(payload); }
      saveState(); renderEvaluaciones();
    }, {once:true});
  }
  function editEval(id){ const v = state.rrhh.evaluaciones.find(x=>x.id===id); if(v) openEvalDialog(v); }
  function deleteEval(id){
    if(!confirm('¿Eliminar evaluación?')) return;
    state.rrhh.evaluaciones = state.rrhh.evaluaciones.filter(v=> v.id!==id);
    saveState(); renderEvaluaciones();
  }

  // =============================================================
  //  Organigrama (Canvas sencillo)
  // =============================================================
  function renderOrganigrama(){
    const content = document.getElementById('rrhhContent');
    content.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px">
        <h3 style="margin:0">Organigrama</h3>
        <div class="muted">Se dibuja a partir del campo "Manager" de cada empleado.</div>
      </div>
      <div class="chart-wrap"><canvas id="orgCanvas" class="chart" width="1000" height="360"></canvas></div>
    `;
    drawOrgChart();
  }
  function buildOrgTree(){
    const nodes = state.rrhh.empleados.map(e=> ({...e, children:[]}));
    const map = new Map(nodes.map(n=> [n.id, n]));
    const roots = [];
    nodes.forEach(n=>{
      if(n.managerId && map.has(n.managerId)) map.get(n.managerId).children.push(n);
      else roots.push(n);
    });
    return roots;
  }
  function drawOrgChart(){
    const roots = buildOrgTree();
    const c = document.getElementById('orgCanvas'); if(!c) return;
    const ctx = c.getContext('2d'); const w=c.width, h=c.height;
    ctx.clearRect(0,0,w,h);
    const levelH = 90, boxW=180, boxH=40, hGap=30, vGap=50;
    ctx.font='12px system-ui';
    function measureWidth(node){ // ancho total de subárbol
      if(node.children.length===0) return boxW;
      return Math.max(boxW, node.children.map(measureWidth).reduce((a,b)=>a+b,0) + hGap*(node.children.length-1));
    }
    function drawNode(node, x, y){
      // caja
      ctx.fillStyle='rgba(61,214,208,.18)'; ctx.strokeStyle='rgba(61,214,208,.5)';
      ctx.fillRect(x, y, boxW, boxH); ctx.strokeRect(x, y, boxW, boxH);
      ctx.fillStyle='#cfe8ff'; ctx.fillText(node.nombre, x+8, y+16);
      ctx.fillStyle='#9fb3c8'; ctx.fillText(node.cargo||'', x+8, y+30);
      // hijos
      if(node.children.length){
        // línea vertical al centro inferior
        const cx = x + boxW/2; const y2 = y + boxH;
        ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(cx, y2); ctx.lineTo(cx, y2+vGap/2); ctx.stroke();
        // ancho total y posición inicial
        const totalW = node.children.map(measureWidth).reduce((a,b)=>a+b,0) + hGap*(node.children.length-1);
        let startX = cx - totalW/2;
        node.children.forEach(ch=>{
          const chW = measureWidth(ch);
          const childX = startX;
          const childY = y + boxH + vGap;
          // conector horizontal y vertical
          ctx.beginPath();
          ctx.moveTo(cx, y + boxH + vGap/2);
          ctx.lineTo(childX + chW/2, y + boxH + vGap/2);
          ctx.lineTo(childX + chW/2, childY);
          ctx.stroke();
          drawNode(ch, childX + (chW - boxW)/2, childY);
          startX += chW + hGap;
        });
      }
    }
    // dibujar cada raíz
    let x = 20, y = 20;
    roots.forEach(r=>{
      const wTree = measureWidth(r);
      drawNode(r, x + (wTree - boxW)/2, y);
      x += wTree + 40;
    });
  }

  // =============================================================
  //  Onboarding (Checklist por empleado)
  // =============================================================
  function renderOnboarding(){
    const content = document.getElementById('rrhhContent');
    const firstEmp = state.rrhh.empleados[0]?.id || '';
    content.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px">
        <div style="display:flex; gap:8px; align-items:center">
          <h3 style="margin:0">Onboarding</h3>
          <select id="obEmp" style="min-width:220px">${empOptions(firstEmp)}</select>
          <span class="pill muted" id="obCount">—</span>
        </div>
        <div style="display:flex; gap:8px">
          <input id="obNewText" placeholder="Nuevo ítem…" style="min-width:260px">
          <button class="btn ok" id="btnAddOB">Añadir</button>
        </div>
      </div>
      <table id="tblOnboarding">
        <thead><tr>
          <th>#</th><th>Hecho</th><th>Ítem</th><th>Acción</th>
        </tr></thead>
        <tbody id="obBody"></tbody>
      </table>
    `;
    document.getElementById('btnAddOB').addEventListener('click', addOBItem);
    document.getElementById('obEmp').addEventListener('change', ()=> fillOB());
    fillOB();
  }
  function addOBItem(){
    const empId = Number(document.getElementById('obEmp').value);
    const text = (document.getElementById('obNewText').value||'').trim();
    if(!empId){ alert('Selecciona un empleado'); return; }
    if(!text){ alert('Escribe un ítem'); return; }
    state.rrhh.onboarding.push({ id: ++state.todoSeq, empId, texto:text, done:false });
    document.getElementById('obNewText').value='';
    saveState(); fillOB();
  }
  function fillOB(){
    const empId = Number(document.getElementById('obEmp').value);
    const tbody = document.getElementById('obBody'); tbody.innerHTML='';
    const list = state.rrhh.onboarding.filter(o=> o.empId===empId);
    document.getElementById('obCount').textContent = `Total: ${list.length} · Pend: ${list.filter(x=>!x.done).length}`;
    list.forEach((o,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(i+1).padStart(2,'0')}</td>
        <td><input type="checkbox" ${o.done?'checked':''} data-ob="${o.id}"></td>
        <td contenteditable="true" data-obe="${o.id}" style="outline:none">${o.texto.replaceAll('<','&lt;')}</td>
        <td><button class="btn bad" onclick="deleteOB(${o.id})">Eliminar</button></td>
      `;
      tbody.appendChild(tr);
    });
    // bind toggles y edición inline
    tbody.querySelectorAll('input[type="checkbox"][data-ob]').forEach(ch=>{
      ch.addEventListener('change', ()=>{
        const id = Number(ch.dataset.ob);
        const it = state.rrhh.onboarding.find(x=>x.id===id); if(!it) return;
        it.done = ch.checked; saveState(); fillOB();
      });
    });
    tbody.querySelectorAll('[data-obe]').forEach(cell=>{
      cell.addEventListener('blur', ()=>{
        const id = Number(cell.dataset.obe);
        const it = state.rrhh.onboarding.find(x=>x.id===id); if(!it) return;
        it.texto = cell.textContent.trim(); saveState();
      });
    });
  }
  function deleteOB(id){
    if(!confirm('¿Eliminar ítem?')) return;
    state.rrhh.onboarding = state.rrhh.onboarding.filter(o=> o.id!==id);
    saveState(); fillOB();
  }

  // =============================================================
  //  Integración con router y arranque directo
  // =============================================================
  function renderRRHHRoute(){
    ensureRRHHLayout();
    rrhhBindTabs();
  }

window.addEventListener('microerp:router-ready', () => {
  const previousShow = window.showRoute;
  window.showRoute = function(name){
    previousShow(name);
    if(name==='rrhh') renderRRHHRoute();
  };
});

  window.addEventListener('DOMContentLoaded', ()=>{
    const routeVisible = Array.from(document.querySelectorAll('.route')).find(r=> r.style.display!=='none');
    if(routeVisible && routeVisible.id==='route-rrhh'){ renderRRHHRoute(); }
  });

  
