//  BLOQUE 4: Proyectos & Tareas — Calendario + Gantt (sin libs)
  // =============================================================

  // ----------------------- Estado e inits -----------------------
  if(typeof state.projectSeq!=='number') state.projectSeq = 0;
  if(typeof state.taskSeq!=='number') state.taskSeq = 0;
  if(!Array.isArray(state.proyectos)) state.proyectos = [];
  if(!Array.isArray(state.tareas)) state.tareas = [];

  // datos demo si vacío
  if(state.proyectos.length===0){
    state.proyectos.push({
      id: ++state.projectSeq, nombre:'Implementación área frenos',
      inicio: toISO(addDays(new Date(), -10)), fin: toISO(addDays(new Date(), 15)),
      estado:'En curso', color:'#3dd6d0'
    });
    state.proyectos.push({
      id: ++state.projectSeq, nombre:'Campaña cambios de aceite',
      inicio: toISO(addDays(new Date(), -5)), fin: toISO(addDays(new Date(), 25)),
      estado:'Planificado', color:'#eab308'
    });
  }
  if(state.tareas.length===0){
    const p1 = state.proyectos[0].id, p2 = state.proyectos[1].id;
    state.tareas.push({ id: ++state.taskSeq, projectId:p1, nombre:'Cotizar repuestos', inicio: toISO(addDays(new Date(), -9)), fin: toISO(addDays(new Date(), -3)), avance: 100 });
    state.tareas.push({ id: ++state.taskSeq, projectId:p1, nombre:'Compra y recepción', inicio: toISO(addDays(new Date(), -2)), fin: toISO(addDays(new Date(), 4)), avance: 40 });
    state.tareas.push({ id: ++state.taskSeq, projectId:p1, nombre:'Instalación', inicio: toISO(addDays(new Date(), 5)), fin: toISO(addDays(new Date(), 12)), avance: 0 });
    state.tareas.push({ id: ++state.taskSeq, projectId:p2, nombre:'Diseño de piezas', inicio: toISO(addDays(new Date(), -3)), fin: toISO(addDays(new Date(), 6)), avance: 60 });
  }
  saveState();

  // seleccion actual de UI
  let selProjectId = state.proyectos[0]?.id || null;
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth()+1; // 1-12

  // acceso rápido
  const byId = (arr, id) => arr.find(x=>x.id===id);

  // ----------------------- Render principal -----------------------
  function ensureProyectosLayout(){
    const route = document.getElementById('route-proyectos');
    if(!route) return;

    // si el layout ya fue creado, no repetir
    if(route.dataset.enhanced==='1') return;

    // Construimos UI
    route.innerHTML = `
      <div class="row cols-3">
        <!-- Proyectos -->
        <div class="card" id="pjPanel">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px">
            <h3 style="margin:0">Proyectos</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap">
              <button class="btn ok" id="btnAddProject">Añadir</button>
              <button class="btn ghost" onclick="exportTableCSV('tblProyectos','proyectos.csv')">CSV</button>
              <button class="btn ghost" onclick="printSection('route-proyectos')">Imprimir</button>
            </div>
          </div>
          <table id="tblProyectos" style="margin-top:10px">
            <thead><tr>
              <th>#</th><th>Nombre</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Acción</th>
            </tr></thead>
            <tbody id="pjBody"></tbody>
          </table>
        </div>

        <!-- Calendario -->
        <div class="card" id="calPanel">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px">
            <h3 style="margin:0">Calendario</h3>
            <div style="display:flex; gap:6px; flex-wrap:wrap">
              <select id="calYear"></select>
              <select id="calMonth"></select>
            </div>
          </div>
          <div id="calendarGrid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:6px"></div>
          <div class="muted" style="margin-top:8px">* El calendario controla el rango visible del Gantt.</div>
        </div>

        <!-- Tareas + Gantt -->
        <div class="card" id="taskPanel">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
              <h3 style="margin:0">Tareas</h3>
              <span class="pill">Proyecto: <b id="pillProjectName">—</b></span>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap">
              <button class="btn ok" id="btnAddTask">Añadir tarea</button>
              <button class="btn ghost" onclick="exportTableCSV('tblTareas','tareas.csv')">CSV</button>
            </div>
          </div>

          <table id="tblTareas" style="margin-top:10px">
            <thead><tr>
              <th>#</th><th>Nombre</th><th>Inicio</th><th>Fin</th><th>Avance</th><th>Acción</th>
            </tr></thead>
            <tbody id="taskBody"></tbody>
          </table>

          <div style="margin-top:14px">
            <h3 style="margin:0 0 6px 0">Gantt</h3>
            <div class="chart-wrap"><canvas id="ganttCanvas" class="chart" width="1000" height="260"></canvas></div>
          </div>
        </div>
      </div>

      <!-- Diálogos -->
      <dialog id="dlgProject">
        <form id="formProject" method="dialog" style="min-width:640px">
          <h3 id="dlgProjectTitle">Nuevo proyecto</h3>
          <div class="row" style="grid-template-columns:repeat(2,1fr)">
            <div><label>Nombre</label><input name="nombre" required></div>
            <div><label>Estado</label>
              <select name="estado"><option>Planificado</option><option>En curso</option><option>Completado</option></select>
            </div>
            <div><label>Inicio</label><input type="date" name="inicio" value="${todayISO()}" required></div>
            <div><label>Fin</label><input type="date" name="fin" value="${todayISO()}" required></div>
            <div class="span-2"><label>Color</label><input name="color" type="color" value="#3dd6d0"></div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
            <button class="btn ghost" value="cancel">Cancelar</button>
            <button class="btn" value="confirm">Guardar</button>
          </div>
        </form>
      </dialog>

      <dialog id="dlgTask">
        <form id="formTask" method="dialog" style="min-width:640px">
          <h3 id="dlgTaskTitle">Nueva tarea</h3>
          <div class="row" style="grid-template-columns:repeat(2,1fr)">
            <div class="span-2"><label>Nombre</label><input name="nombre" required></div>
            <div><label>Inicio</label><input type="date" name="inicio" value="${todayISO()}" required></div>
            <div><label>Fin</label><input type="date" name="fin" value="${todayISO()}" required></div>
            <div class="span-2"><label>Avance (%)</label><input type="number" name="avance" min="0" max="100" value="0"></div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
            <button class="btn ghost" value="cancel">Cancelar</button>
            <button class="btn" value="confirm">Guardar</button>
          </div>
        </form>
      </dialog>
    `;

    // combos calendario
    const ySel = route.querySelector('#calYear');
    const mSel = route.querySelector('#calMonth');
    ySel.innerHTML = Array.from({length:7},(_,i)=> {
      const y = calYear-3+i; return `<option value="${y}" ${y===calYear?'selected':''}>${y}</option>`;
    }).join('');
    mSel.innerHTML = monthNames.map((n,i)=> `<option value="${i+1}" ${i+1===calMonth?'selected':''}>${n}</option>`).join('');

    // eventos UI
    route.querySelector('#btnAddProject').addEventListener('click', ()=> openProjectDialog());
    route.querySelector('#btnAddTask').addEventListener('click', ()=> openTaskDialog());
    ySel.addEventListener('change', (e)=>{ calYear = Number(e.target.value); renderCalendar(); drawGantt(); });
    mSel.addEventListener('change', (e)=>{ calMonth = Number(e.target.value); renderCalendar(); drawGantt(); });

    route.dataset.enhanced='1';
  }

  // ----------------------- Proyectos (CRUD) -----------------------
  function renderProjectsTable(){
    const tbody = document.getElementById('pjBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    state.proyectos
      .slice()
      .sort((a,b)=> a.inicio<b.inicio?1:-1)
      .forEach((p,idx)=>{
        const tr = document.createElement('tr');
        tr.style.cursor='pointer';
        tr.innerHTML = `
          <td>${String(idx+1).padStart(2,'0')}</td>
          <td><span style="display:inline-flex; align-items:center; gap:6px"><span style="width:10px; height:10px; border-radius:50%; background:${p.color}; display:inline-block"></span>${p.nombre}</span></td>
          <td>${p.inicio}</td>
          <td>${p.fin}</td>
          <td>${p.estado}</td>
          <td style="display:flex; gap:6px; flex-wrap:wrap">
            <button class="btn ghost" onclick="editProject(${p.id})">Editar</button>
            <button class="btn bad" onclick="deleteProject(${p.id})">Eliminar</button>
          </td>
        `;
        tr.addEventListener('click', (ev)=>{
          // evitar que los botones disparen select
          if((ev.target.closest('button'))) return;
          selProjectId = p.id;
          renderTasksTable();
          setProjectPill();
          drawGantt();
        });
        if(p.id===selProjectId) tr.style.background='rgba(61,214,208,.08)';
        tbody.appendChild(tr);
      });
  }

  function setProjectPill(){
    const el = document.getElementById('pillProjectName');
    const p = byId(state.proyectos, selProjectId);
    if(el) el.textContent = p? p.nombre : '—';
  }

  function openProjectDialog(item){
    const dlg = document.getElementById('dlgProject');
    const form = document.getElementById('formProject');
    const title = document.getElementById('dlgProjectTitle');
    form.reset(); form.dataset.editId='';
    if(item){
      title.textContent='Editar proyecto';
      form.nombre.value=item.nombre; form.estado.value=item.estado;
      form.inicio.value=item.inicio; form.fin.value=item.fin;
      form.color.value=item.color || '#3dd6d0';
      form.dataset.editId=item.id;
    }else{
      title.textContent='Nuevo proyecto';
      form.inicio.value=todayISO(); form.fin.value=todayISO();
      form.color.value='#3dd6d0';
    }
    dlg.showModal();

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=='confirm') return;
      const fd = new FormData(form);
      const payload = {
        id: item? item.id : ++state.projectSeq,
        nombre: (fd.get('nombre')||'').trim(),
        inicio: fd.get('inicio'),
        fin: fd.get('fin'),
        estado: fd.get('estado'),
        color: fd.get('color') || '#3dd6d0'
      };
      if(!payload.nombre){ alert('Nombre requerido'); return; }
      // validación de fechas
      if(parseISO(payload.fin) < parseISO(payload.inicio)){ alert('Fin no puede ser anterior al inicio'); return; }
      if(item){
        state.proyectos = state.proyectos.map(p=> p.id===item.id? payload : p);
      }else{
        state.proyectos.push(payload);
        selProjectId = payload.id;
      }
      saveState();
      renderProjectsTable();
      renderTasksTable();
      setProjectPill();
      drawGantt();
    }, {once:true});
  }
  function editProject(id){ const p = byId(state.proyectos, id); if(p) openProjectDialog(p); }
  function deleteProject(id){
    if(!confirm('¿Eliminar proyecto y sus tareas?')) return;
    state.proyectos = state.proyectos.filter(p=>p.id!==id);
    state.tareas = state.tareas.filter(t=>t.projectId!==id);
    if(selProjectId===id) selProjectId = state.proyectos[0]?.id || null;
    saveState();
    renderProjectsTable();
    renderTasksTable();
    setProjectPill();
    drawGantt();
  }

  // ----------------------- Tareas (CRUD) -----------------------
  function tasksOfSelected(){
    return state.tareas.filter(t=> t.projectId===selProjectId)
      .slice().sort((a,b)=> a.inicio<b.inicio? -1 : 1);
  }
  function renderTasksTable(){
    const tbody = document.getElementById('taskBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    const list = tasksOfSelected();
    list.forEach((t,idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(idx+1).padStart(2,'0')}</td>
        <td>${t.nombre}</td>
        <td>${t.inicio}</td>
        <td>${t.fin}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px">
            <div style="flex:1; background:#0d1721; border:1px solid rgba(255,255,255,.08); height:8px; border-radius:999px; overflow:hidden">
              <div style="width:${Math.min(100,Math.max(0,Number(t.avance)))}%; height:100%; background:linear-gradient(90deg, var(--ok), #86efac)"></div>
            </div>
            <span class="muted" style="width:36px">${Math.min(100,Math.max(0,Number(t.avance)))}%</span>
          </div>
        </td>
        <td style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn ghost" onclick="editTask(${t.id})">Editar</button>
          <button class="btn bad" onclick="deleteTask(${t.id})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function openTaskDialog(item){
    if(!selProjectId){ alert('Crea o selecciona un proyecto primero.'); return; }
    const dlg = document.getElementById('dlgTask');
    const form = document.getElementById('formTask');
    const title = document.getElementById('dlgTaskTitle');
    form.reset(); form.dataset.editId='';
    if(item){
      title.textContent='Editar tarea';
      form.nombre.value=item.nombre; form.inicio.value=item.inicio; form.fin.value=item.fin; form.avance.value=item.avance;
      form.dataset.editId=item.id;
    }else{
      title.textContent='Nueva tarea';
      form.inicio.value=todayISO(); form.fin.value=todayISO(); form.avance.value=0;
    }
    dlg.showModal();

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=='confirm') return;
      const fd = new FormData(form);
      const payload = {
        id: item? item.id : ++state.taskSeq,
        projectId: selProjectId,
        nombre: (fd.get('nombre')||'').trim(),
        inicio: fd.get('inicio'),
        fin: fd.get('fin'),
        avance: Number(fd.get('avance'))||0
      };
      if(!payload.nombre){ alert('Nombre requerido'); return; }
      if(parseISO(payload.fin) < parseISO(payload.inicio)){ alert('Fin no puede ser anterior al inicio'); return; }
      if(item){
        state.tareas = state.tareas.map(t=> t.id===item.id? payload : t);
      }else{
        state.tareas.push(payload);
      }
      saveState();
      renderTasksTable();
      drawGantt();
    }, {once:true});
  }
  function editTask(id){ const t = byId(state.tareas, id); if(t) openTaskDialog(t); }
  function deleteTask(id){
    if(!confirm('¿Eliminar tarea?')) return;
    state.tareas = state.tareas.filter(t=> t.id!==id);
    saveState();
    renderTasksTable();
    drawGantt();
  }

  // ----------------------- Calendario -----------------------
  function daysInMonth(year, month){ return new Date(year, month, 0).getDate(); } // month 1-12
  function weekday(year, month, day){ return new Date(year, month-1, day).getDay(); } // 0-dom

  function renderCalendar(){
    const grid = document.getElementById('calendarGrid');
    if(!grid) return;
    grid.innerHTML = '';

    const headers = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    headers.forEach(h=>{
      const hd = document.createElement('div');
      hd.textContent = h;
      hd.className = 'muted';
      hd.style.textAlign='center';
      grid.appendChild(hd);
    });

    const days = daysInMonth(calYear, calMonth);
    const firstWd = weekday(calYear, calMonth, 1); // 0..6
    // celdas en blanco antes del 1
    for(let i=0;i<firstWd;i++){
      const empty = document.createElement('div');
      empty.style.minHeight='42px';
      grid.appendChild(empty);
    }

    for(let d=1; d<=days; d++){
      const cell = document.createElement('div');
      cell.style.minHeight='42px';
      cell.style.border='1px dashed rgba(255,255,255,.08)';
      cell.style.borderRadius='10px';
      cell.style.padding='6px';
      cell.style.display='flex';
      cell.style.flexDirection='column';
      cell.style.gap='4px';
      const label = document.createElement('div');
      label.textContent = d;
      label.className='muted';
      grid.appendChild(cell);
      cell.appendChild(label);

      // chip con tareas que tocan ese día (sólo del proyecto seleccionado)
      const tasks = tasksOfSelected().filter(t => {
        const di = parseISO(t.inicio), df = parseISO(t.fin);
        const cur = new Date(calYear, calMonth-1, d);
        return cur>=di && cur<=df;
      }).slice(0,3); // mostrar hasta 3
      tasks.forEach(t=>{
        const chip = document.createElement('div');
        chip.textContent = t.nombre;
        chip.title = `${t.nombre} (${t.inicio} → ${t.fin})`;
        chip.style.fontSize='12px';
        chip.style.padding='2px 6px';
        chip.style.borderRadius='999px';
        chip.style.background='rgba(61,214,208,.18)';
        chip.style.border='1px solid rgba(61,214,208,.35)';
        cell.appendChild(chip);
      });
    }
  }

  // ----------------------- Gantt (Canvas) -----------------------
  function drawGantt(){
    const canvas = document.getElementById('ganttCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);

    const left = 120, right = w-10, top = 20, bottom = h-30;
    const innerW = right-left, innerH = bottom-top;

    // rango del mes seleccionado
    const start = new Date(calYear, calMonth-1, 1);
    const end = new Date(calYear, calMonth, 0);
    const totalDays = (end - start)/(1000*60*60*24) + 1;

    // ejes + grid vertical por día
    ctx.strokeStyle='#294255';
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();

    ctx.strokeStyle='rgba(255,255,255,.08)';
    ctx.lineWidth=1;
    const stepX = innerW / totalDays;
    for(let i=0;i<totalDays;i++){
      const x = left + i*stepX;
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
    }

    // etiquetas de día (cada 2 o 3 días para no saturar)
    ctx.fillStyle='#9fb3c8';
    ctx.font='12px system-ui';
    const labelStep = totalDays>20? 3 : 2;
    for(let d=1; d<=totalDays; d+=labelStep){
      const x = left + (d-1)*stepX;
      ctx.fillText(String(d), x+2, h-10);
    }

    // proyecto color
    const project = byId(state.proyectos, selProjectId);
    const color = project?.color || '#3dd6d0';

    // filas de tareas
    const list = tasksOfSelected();
    const rowH = Math.max(16, Math.min(26, Math.floor(innerH/Math.max(1, list.length))));
    const rowGap = 8;
    const barH = Math.max(10, rowH-6);

    ctx.fillStyle='#cfe8ff';
    ctx.font='bold 14px system-ui';
    ctx.fillText(project? project.nombre : '—', 10, 18);

    list.forEach((t, idx)=>{
      const di = parseISO(t.inicio);
      const df = parseISO(t.fin);
      // recorte al mes visible
      const startClamped = di < start ? start : di;
      const endClamped = df > end ? end : df;

      const sIdx = Math.max(0, Math.floor((startClamped - start)/(1000*60*60*24)));
      const eIdx = Math.max(sIdx, Math.floor((endClamped - start)/(1000*60*60*24)));
      const x = left + sIdx*stepX + 1;
      const width = Math.max(2, (eIdx - sIdx + 1)*stepX - 2);
      const y = top + idx*(rowH+rowGap);

      // nombre de tarea
      ctx.fillStyle='#9fb3c8';
      ctx.font='12px system-ui';
      ctx.fillText(t.nombre, 10, y+barH);

      // barra fondo
      ctx.fillStyle='rgba(255,255,255,.06)';
      ctx.fillRect(x, y, width, barH);

      // barra progreso
      ctx.fillStyle=color;
      const progW = width * (Math.min(100,Math.max(0,Number(t.avance)))/100);
      ctx.fillRect(x, y, progW, barH);

      // borde
      ctx.strokeStyle='rgba(255,255,255,.25)';
      ctx.strokeRect(x, y, width, barH);
    });

    // leyenda progreso
    ctx.fillStyle='#cfe8ff';
    ctx.font='12px system-ui';
    ctx.fillText('Progreso = color sólido | Rango = rectángulo', left+6, top-6);
  }

  // ----------------------- Integración y arranque -----------------------
  function renderProyectosRoute(){
    ensureProyectosLayout();
    renderProjectsTable();
    renderTasksTable();
    setProjectPill();
    renderCalendar();
    drawGantt();
  }

  // Hook al router
  (function(){
    const _show = window.showRoute;
    window.showRoute = function(name){
      _show(name);
      if(name==='proyectos') renderProyectosRoute();
    }
  })();

  // Si el usuario abre directamente la ruta
  window.addEventListener('DOMContentLoaded', ()=>{
    const routeVisible = Array.from(document.querySelectorAll('.route')).find(r=> r.style.display!== 'none');
    if(routeVisible && routeVisible.id==='route-proyectos'){
      renderProyectosRoute();
    }
  });

  // ----------------------- Exponer helpers -----------------------
  window.microerp = Object.assign(window.microerp||{}, {
    renderProyectosRoute, drawGantt, renderCalendar
  });

  

//  BLOQUE 5: Apuntes (Intranet) — UI/UX enriquecido sin librerías
  // =============================================================

  // Estructura esperada en state.apuntes:
  // { pages: [{id, title, createdAt, updatedAt}], content: { [id]: "<html...>"} }

  // ----------------------- Utilidades -----------------------
  function uid() { return Math.random().toString(36).slice(2,9); }
  function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
  function sanitizeHTML(html){
    // Sencillo sanitizado: quitar scripts/iframes/eventos (defensivo)
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('script, iframe').forEach(n=> n.remove());
    // remover atributos on*
    div.querySelectorAll('*').forEach(el=>{
      [...el.attributes].forEach(attr=>{
        if(/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      });
    });
    return div.innerHTML;
  }

  // ----------------------- Layout dinámico -----------------------
  function ensureApuntesLayout(){
    const route = document.getElementById('route-apuntes');
    if(!route) return;
    if(route.dataset.enhanced==='1') return;

    route.innerHTML = `
      <div class="card" style="padding:0">
        <div style="display:grid; grid-template-columns:300px 1fr; min-height:540px">
          <!-- Panel izquierdo: páginas -->
          <aside id="notesSidebar" style="border-right:1px solid rgba(255,255,255,.06); display:flex; flex-direction:column; max-height:70vh">
            <div style="padding:12px; display:flex; gap:8px; align-items:center; border-bottom:1px solid rgba(255,255,255,.06)">
              <input id="noteSearch" placeholder="Buscar páginas…" style="flex:1">
              <button class="btn ok" id="btnNewNote">Nueva</button>
            </div>
            <div style="padding:8px; display:flex; gap:6px; flex-wrap:wrap; border-bottom:1px dashed rgba(255,255,255,.08)">
              <button class="btn ghost" id="tplMeeting">Plantilla: Reunión</button>
              <button class="btn ghost" id="tplService">Plantilla: Orden servicio</button>
              <button class="btn ghost" id="tplBlank">Plantilla: En blanco</button>
            </div>
            <div id="pagesList" style="overflow:auto; padding:8px"></div>
            <div style="margin-top:auto; padding:10px; border-top:1px solid rgba(255,255,255,.06); display:flex; gap:6px; flex-wrap:wrap">
              <button class="btn ghost" id="btnImport">Importar .md/.txt</button>
              <button class="btn ghost" id="btnExport">Exportar .md</button>
              <button class="btn ghost" onclick="printSection('route-apuntes')">Imprimir</button>
              <input type="file" id="fileImport" accept=".txt,.md" style="display:none">
            </div>
          </aside>

          <!-- Panel derecho: editor -->
          <section id="editorPanel" style="display:flex; flex-direction:column">
            <div id="editorToolbar" style="display:flex; gap:6px; flex-wrap:wrap; padding:10px; border-bottom:1px solid rgba(255,255,255,.06); background:rgba(255,255,255,.02); position:sticky; top:0; z-index:1">
              <input id="noteTitle" placeholder="Título de la página…" style="flex:1; font-weight:800">
              <div class="pill">Autosave <span id="autosaveState">—</span></div>
            </div>

            <div style="padding:8px; display:flex; flex-wrap:wrap; gap:6px; border-bottom:1px dashed rgba(255,255,255,.06)">
              <button class="btn" data-cmd="bold"><b>B</b></button>
              <button class="btn" data-cmd="italic"><i>I</i></button>
              <button class="btn" data-cmd="underline"><u>U</u></button>
              <button class="btn ghost" data-block="h1">H1</button>
              <button class="btn ghost" data-block="h2">H2</button>
              <button class="btn ghost" data-list="ul">• Lista</button>
              <button class="btn ghost" data-list="ol">1. Lista</button>
              <button class="btn ghost" id="btnChecklist">☑ Checklist</button>
              <button class="btn ghost" id="btnQuote">“” Cita</button>
              <button class="btn ghost" id="btnCode">` + "`" + ` Código</button>
              <button class="btn warn" id="btnClearFormat">Limpiar formato</button>
              <div class="pill muted" id="wordCount">0 palabras</div>
            </div>

            <div id="noteMeta" class="muted" style="padding:6px 12px; font-size:12px">—</div>

            <div id="noteEditor"
              contenteditable="true"
              style="flex:1; padding:16px; outline:none; line-height:1.8; min-height:360px; font-size:15px">
              <!-- contenido de la página -->
            </div>

            <div style="display:flex; justify-content:flex-end; gap:6px; padding:10px; border-top:1px solid rgba(255,255,255,.06)">
              <button class="btn bad" id="btnDelete">Eliminar página</button>
              <button class="btn ghost" id="btnDuplicate">Duplicar</button>
              <button class="btn" id="btnSaveNow">Guardar ahora</button>
            </div>
          </section>
        </div>
      </div>
    `;
    route.dataset.enhanced='1';
  }

  // ----------------------- Estado y selección -----------------------
  let selectedNoteId = null;

  function notesEnsureState(){
    if(!state.apuntes) state.apuntes = { pages: [], content: {} };
    if(!Array.isArray(state.apuntes.pages)) state.apuntes.pages = [];
    if(typeof state.apuntes.content !== 'object') state.apuntes.content = {};
    // Crear demo si vacío
    if(state.apuntes.pages.length===0){
      const id = uid();
      state.apuntes.pages.push({ id, title:'Bienvenida', createdAt: new Date().toISOString(), updatedAt:new Date().toISOString() });
      state.apuntes.content[id] =
        `<h1>Bienvenido a Apuntes</h1>
         <p>Usa el panel izquierdo para crear, buscar, duplicar o eliminar páginas. El contenido se guarda automáticamente en tu navegador.</p>
         <ul><li>Negrita / Itálica / Subrayado</li><li>H1, H2</li><li>Listas y Checklist</li><li>Citas y código en línea</li></ul>`;
      saveState();
    }
  }

  // ----------------------- Render principal -----------------------
  function renderApuntes(){
    ensureApuntesLayout();
    notesEnsureState();
    renderPagesList();
    // Seleccionar la última usada o la primera
    if(!selectedNoteId){
      selectedNoteId = state.apuntes.pages[0]?.id || null;
    } else if(!state.apuntes.pages.find(p=>p.id===selectedNoteId)){
      selectedNoteId = state.apuntes.pages[0]?.id || null;
    }
    openNote(selectedNoteId);
    setupNotesEvents();
  }

  // ----------------------- Lista de páginas -----------------------
  function renderPagesList(filter=''){
    const list = document.getElementById('pagesList');
    if(!list) return;
    const q = filter.trim().toLowerCase();
    const data = state.apuntes.pages
      .slice()
      .sort((a,b)=> (b.updatedAt||b.createdAt).localeCompare(a.updatedAt||a.createdAt))
      .filter(p=> !q || p.title.toLowerCase().includes(q));

    list.innerHTML = '';
    data.forEach(p=>{
      const item = document.createElement('div');
      item.style.padding='10px';
      item.style.border='1px solid rgba(255,255,255,.06)';
      item.style.borderRadius='10px';
      item.style.marginBottom='8px';
      item.style.cursor='pointer';
      item.style.background = p.id===selectedNoteId ? 'rgba(61,214,208,.12)' : 'transparent';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:8px; align-items:center">
          <div style="display:flex; gap:8px; align-items:center">
            <div style="width:8px; height:8px; border-radius:999px; background:${p.id===selectedNoteId?'var(--pri)':'rgba(255,255,255,.2)'}"></div>
            <div style="font-weight:700">${p.title}</div>
          </div>
          <div class="muted" style="font-size:12px">${new Date(p.updatedAt||p.createdAt).toLocaleString('es-PE',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short'})}</div>
        </div>
        <div style="display:flex; gap:6px; margin-top:8px">
          <button class="btn ghost" data-action="rename" data-id="${p.id}">Renombrar</button>
          <button class="btn ghost" data-action="duplicate" data-id="${p.id}">Duplicar</button>
          <button class="btn bad" data-action="delete" data-id="${p.id}">Eliminar</button>
        </div>
      `;
      item.addEventListener('click', (e)=>{
        if(e.target.closest('button')) return; // botones tienen su handler aparte
        selectedNoteId = p.id;
        openNote(p.id);
        renderPagesList(q);
      });
      list.appendChild(item);
    });

    if(data.length===0){
      const empty = document.createElement('div');
      empty.className='muted';
      empty.style.padding='10px';
      empty.textContent='Sin resultados.';
      list.appendChild(empty);
    }
  }

  // ----------------------- Abrir/crear/renombrar/eliminar -----------------------
  function newNote(template='blank'){
    const id = uid();
    const now = new Date().toISOString();
    let title = 'Nueva página';
    let body = '<p>Escribe aquí…</p>';

    if(template==='meeting'){
      title = 'Reunión — ' + new Date().toLocaleDateString('es-PE');
      body = `<h1>Reunión: ${new Date().toLocaleDateString('es-PE')}</h1>
      <h2>Participantes</h2><ul><li>—</li></ul>
      <h2>Temas</h2><ul><li>—</li></ul>
      <h2>Acuerdos</h2><ul><li>[ ] Responsable — Fecha</li></ul>`;
    } else if(template==='service'){
      title = 'Orden de servicio';
      body = `<h1>Orden de servicio</h1>
      <p><b>Cliente:</b> — &nbsp;&nbsp; <b>Vehículo:</b> — &nbsp;&nbsp; <b>Placa:</b> —</p>
      <h2>Diagnóstico</h2><p>—</p>
      <h2>Trabajo a realizar</h2><ul><li>—</li></ul>
      <h2>Repuestos utilizados</h2><table><tr><th>Cod</th><th>Nombre</th><th>Cant</th></tr><tr><td>—</td><td>—</td><td>—</td></tr></table>
      <h2>Firma</h2><p>_____________________</p>`;
    }

    state.apuntes.pages.push({ id, title, createdAt: now, updatedAt: now });
    state.apuntes.content[id] = body;
    saveState();
    selectedNoteId = id;
    renderPagesList();
    openNote(id);
  }

  function openNote(id){
    const page = state.apuntes.pages.find(p=>p.id===id);
    const editor = document.getElementById('noteEditor');
    const title = document.getElementById('noteTitle');
    const meta = document.getElementById('noteMeta');
    if(!page || !editor || !title) return;

    title.value = page.title;
    editor.innerHTML = state.apuntes.content[id] || '<p></p>';
    meta.textContent = `Creada: ${new Date(page.createdAt).toLocaleString('es-PE')} · Actualizada: ${new Date(page.updatedAt||page.createdAt).toLocaleString('es-PE')}`;
    updateWordCount();
    // Reset estado autosave
    setAutosaveState('—');
  }

  function renameNote(id){
    const page = state.apuntes.pages.find(p=>p.id===id);
    if(!page) return;
    const name = prompt('Nuevo título:', page.title);
    if(!name) return;
    page.title = name.trim() || page.title;
    page.updatedAt = new Date().toISOString();
    saveState();
    renderPagesList(document.getElementById('noteSearch').value || '');
    if(id===selectedNoteId) document.getElementById('noteTitle').value = page.title;
  }

  function duplicateNote(id){
    const page = state.apuntes.pages.find(p=>p.id===id);
    if(!page) return;
    const newId = uid();
    const now = new Date().toISOString();
    state.apuntes.pages.push({ id:newId, title: page.title + ' (copia)', createdAt: now, updatedAt: now });
    state.apuntes.content[newId] = state.apuntes.content[id];
    saveState();
    selectedNoteId = newId;
    renderPagesList();
    openNote(newId);
  }

  function deleteNote(id){
    if(!confirm('¿Eliminar esta página?')) return;
    state.apuntes.pages = state.apuntes.pages.filter(p=>p.id!==id);
    delete state.apuntes.content[id];
    saveState();
    selectedNoteId = state.apuntes.pages[0]?.id || null;
    renderPagesList();
    openNote(selectedNoteId);
  }

  // ----------------------- Toolbar acciones -----------------------
  function exec(cmd, val=null){
    document.execCommand(cmd, false, val);
  }
  function toggleBlock(tag){
    // Aplica block H1/H2 o párrafo
    if(tag==='h1' || tag==='h2') document.execCommand('formatBlock', false, tag.toUpperCase());
  }
  function toggleList(type){
    if(type==='ul') exec('insertUnorderedList');
    if(type==='ol') exec('insertOrderedList');
  }
  function insertQuote(){
    document.execCommand('formatBlock', false, 'blockquote');
  }
  function insertInlineCode(){
    // reemplaza selección por <code>..</code> sencillo
    const sel = window.getSelection();
    if(!sel || sel.rangeCount===0) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement('code');
    span.textContent = sel.toString();
    range.deleteContents();
    range.insertNode(span);
    // mover cursor al final
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(span);
    r.collapse(false);
    sel.addRange(r);
  }
  function insertChecklist(){
    // Inserta UL con elementos [ ] personalizables visualmente
    exec('insertUnorderedList');
    // marcar clase checklist al bloque actual
    const sel = window.getSelection();
    if(!sel || sel.rangeCount===0) return;
    const li = sel.anchorNode.closest('li');
    if(li && li.parentElement){
      li.parentElement.dataset.checklist = '1';
      // toggling con click
      li.parentElement.addEventListener('click', (e)=>{
        const target = e.target.closest('li');
        if(!target) return;
        target.dataset.checked = target.dataset.checked==='1' ? '0' : '1';
      }, {once:true});
    }
  }
  function clearFormat(){
    exec('removeFormat');
    // quitar bloques especiales
    document.execCommand('formatBlock', false, 'p');
  }

  // ----------------------- Autosave / palabraje -----------------------
  const debouncedSave = debounce(()=> saveCurrentNote(), 600);

  function saveCurrentNote(force=false){
    if(!selectedNoteId) return;
    const title = document.getElementById('noteTitle').value.trim() || 'Sin título';
    const html = sanitizeHTML(document.getElementById('noteEditor').innerHTML);
    const page = state.apuntes.pages.find(p=>p.id===selectedNoteId);
    if(!page) return;

    // Solo guardar si hay cambios
    const changed = (state.apuntes.content[selectedNoteId]!==html) || (page.title!==title) || force;
    if(!changed) return;

    page.title = title;
    page.updatedAt = new Date().toISOString();
    state.apuntes.content[selectedNoteId] = html;
    saveState();
    setAutosaveState('✓ guardado');
    renderPagesList(document.getElementById('noteSearch').value || '');
  }

  function setAutosaveState(text){
    const el = document.getElementById('autosaveState');
    if(el){ el.textContent = text; el.style.opacity = .9; setTimeout(()=> el.style.opacity=.5, 800); }
  }

  function updateWordCount(){
    const t = document.getElementById('noteEditor').innerText || '';
    const words = (t.trim().match(/\\S+/g)||[]).length;
    const wc = document.getElementById('wordCount');
    if(wc) wc.textContent = words+' palabras';
  }

  // ----------------------- Exportar / Importar -----------------------
  function exportCurrentNoteMD(){
    if(!selectedNoteId) return;
    const page = state.apuntes.pages.find(p=>p.id===selectedNoteId);
    const html = state.apuntes.content[selectedNoteId] || '';
    // Conversión mínima HTML->texto MD-like (simple)
    let text = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    const blob = new Blob([text], {type:'text/markdown;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=(page.title||'nota')+'.md'; a.click(); URL.revokeObjectURL(url);
}

  function importNoteFromFile(file){
    const reader = new FileReader();
    reader.onload = () =>{
      const raw = String(reader.result || '');
      // envolver como párrafos sencillos
      const html = raw
        .split(/\\n\\n+/).map(p=> `<p>${p.replace(/\\n/g,'<br>')}</p>`).join('');
      const id = uid();
      const now = new Date().toISOString();
      state.apuntes.pages.push({ id, title: (file.name||'importado').replace(/\\.(md|txt)$/i,''), createdAt:now, updatedAt:now });
      state.apuntes.content[id] = html;
      saveState();
      selectedNoteId = id;
      renderPagesList();
      openNote(id);
    };
    reader.readAsText(file);
  }

  // ----------------------- Eventos de UI -----------------------
  function setupNotesEvents(){
    const route = document.getElementById('route-apuntes');
    if(!route) return;

    // Búsqueda
    const search = document.getElementById('noteSearch');
    if(search && !search.dataset.bound){
      search.dataset.bound='1';
      search.addEventListener('input', (e)=> renderPagesList(e.target.value));
    }

    // Botones crear por plantilla
    const btnNew = document.getElementById('btnNewNote');
    const btnM = document.getElementById('tplMeeting');
    const btnS = document.getElementById('tplService');
    const btnB = document.getElementById('tplBlank');
    if(btnNew && !btnNew.dataset.bound){ btnNew.dataset.bound='1'; btnNew.addEventListener('click', ()=> newNote('blank')); }
    if(btnM && !btnM.dataset.bound){ btnM.dataset.bound='1'; btnM.addEventListener('click', ()=> newNote('meeting')); }
    if(btnS && !btnS.dataset.bound){ btnS.dataset.bound='1'; btnS.addEventListener('click', ()=> newNote('service')); }
    if(btnB && !btnB.dataset.bound){ btnB.dataset.bound='1'; btnB.addEventListener('click', ()=> newNote('blank')); }

    // Acciones en lista (delegación)
    const pagesList = document.getElementById('pagesList');
    if(pagesList && !pagesList.dataset.bound){
      pagesList.dataset.bound='1';
      pagesList.addEventListener('click', (e)=>{
        const btn = e.target.closest('button[data-action]');
        if(!btn) return;
        const id = btn.dataset.id;
        if(btn.dataset.action==='rename') renameNote(id);
        if(btn.dataset.action==='duplicate') duplicateNote(id);
        if(btn.dataset.action==='delete') deleteNote(id);
      });
    }

    // Título y editor: autosave
    const title = document.getElementById('noteTitle');
    const editor = document.getElementById('noteEditor');
    if(title && !title.dataset.bound){
      title.dataset.bound='1';
      title.addEventListener('input', ()=> { setAutosaveState('…'); debouncedSave(); });
    }
    if(editor && !editor.dataset.bound){
      editor.dataset.bound='1';
      editor.addEventListener('input', ()=> { setAutosaveState('…'); debouncedSave(); updateWordCount(); });
      editor.addEventListener('keydown', (e)=>{
        // Atajos simples
        if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); saveCurrentNote(true); }
      });
    }

    // Toolbar básica
    document.querySelectorAll('#editorPanel [data-cmd]').forEach(b=>{
      if(b.dataset.bound) return; b.dataset.bound='1';
      b.addEventListener('click', ()=> exec(b.dataset.cmd));
    });
    document.querySelectorAll('#editorPanel [data-block]').forEach(b=>{
      if(b.dataset.bound) return; b.dataset.bound='1';
      b.addEventListener('click', ()=> toggleBlock(b.dataset.block));
    });
    document.querySelectorAll('#editorPanel [data-list]').forEach(b=>{
      if(b.dataset.bound) return; b.dataset.bound='1';
      b.addEventListener('click', ()=> toggleList(b.dataset.list));
    });

    const btnChecklist = document.getElementById('btnChecklist');
    const btnQuote = document.getElementById('btnQuote');
    const btnCode = document.getElementById('btnCode');
    const btnClear = document.getElementById('btnClearFormat');
    const btnSaveNow = document.getElementById('btnSaveNow');
    const btnDelete = document.getElementById('btnDelete');
    const btnDup = document.getElementById('btnDuplicate');

    if(btnChecklist && !btnChecklist.dataset.bound){ btnChecklist.dataset.bound='1'; btnChecklist.addEventListener('click', insertChecklist); }
    if(btnQuote && !btnQuote.dataset.bound){ btnQuote.dataset.bound='1'; btnQuote.addEventListener('click', insertQuote); }
    if(btnCode && !btnCode.dataset.bound){ btnCode.dataset.bound='1'; btnCode.addEventListener('click', insertInlineCode); }
    if(btnClear && !btnClear.dataset.bound){ btnClear.dataset.bound='1'; btnClear.addEventListener('click', clearFormat); }
    if(btnSaveNow && !btnSaveNow.dataset.bound){ btnSaveNow.dataset.bound='1'; btnSaveNow.addEventListener('click', ()=> saveCurrentNote(true)); }
    if(btnDelete && !btnDelete.dataset.bound){ btnDelete.dataset.bound='1'; btnDelete.addEventListener('click', ()=> deleteNote(selectedNoteId)); }
    if(btnDup && !btnDup.dataset.bound){ btnDup.dataset.bound='1'; btnDup.addEventListener('click', ()=> duplicateNote(selectedNoteId)); }

    // Export / Import
    const btnExp = document.getElementById('btnExport');
    const btnImp = document.getElementById('btnImport');
    const fileInput = document.getElementById('fileImport');
    if(btnExp && !btnExp.dataset.bound){ btnExp.dataset.bound='1'; btnExp.addEventListener('click', exportCurrentNoteMD); }
    if(btnImp && !btnImp.dataset.bound){ btnImp.dataset.bound='1'; btnImp.addEventListener('click', ()=> fileInput.click()); }
    if(fileInput && !fileInput.dataset.bound){
      fileInput.dataset.bound='1';
      fileInput.addEventListener('change', (e)=> {
        const f = e.target.files?.[0];
        if(f) importNoteFromFile(f);
        fileInput.value='';
      });
    }
  }

  // ----------------------- Integración con router -----------------------
  (function(){
    const _show = window.showRoute;
    window.showRoute = function(name){
      _show(name);
      if(name==='apuntes') renderApuntes();
    }
  })();

  // Carga directa si el usuario cae en Apuntes
  window.addEventListener('DOMContentLoaded', ()=>{
    const routeVisible = Array.from(document.querySelectorAll('.route')).find(r=> r.style.display!== 'none');
    if(routeVisible && routeVisible.id==='route-apuntes'){
      renderApuntes();
    }
  });

  
