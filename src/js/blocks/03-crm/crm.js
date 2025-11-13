//  Bloque 3: CRM & Ventas — Contactos, Empresas, Docs
  //  - CRUD básico en cada pestaña
  //  - Exportar CSV / Imprimir sección
  //  - Vínculo opcional: Doc -> Transacción
  // =============================================================

  // -------------------------- Estado inicial y helpers --------------------------
  // Añadimos contadores si aún no existen
  if(typeof state.contactSeq !== 'number') state.contactSeq = 0;
  if(typeof state.empresaSeq !== 'number') state.empresaSeq = 0;
  if(typeof state.docSeq !== 'number') state.docSeq = 0;

  // Si el usuario no tiene datos de ejemplo, añadimos algunos
  if(!state.contactos || !Array.isArray(state.contactos)) state.contactos = [];
  if(!state.empresas || !Array.isArray(state.empresas)) state.empresas = [];
  if(!state.docs || !Array.isArray(state.docs)) state.docs = [];

  if(state.contactos.length===0){
    state.contactos.push({ id: ++state.contactSeq, nombre:'Juan Pérez', telefono:'999888777', email:'juan@example.com', empresaId:null, notas:'' });
    state.contactos.push({ id: ++state.contactSeq, nombre:'María Reyes', telefono:'988777666', email:'maria@example.com', empresaId:null, notas:'' });
  }
  if(state.empresas.length===0){
    state.empresas.push({ id: ++state.empresaSeq, nombre:'Taller Don Pepe', ruc:'20123456789', telefono:'014445555', direccion:'Av. Las Lomas 123', notas:'' });
    state.empresas.push({ id: ++state.empresaSeq, nombre:'Transportes Andinos', ruc:'20654321987', telefono:'015553333', direccion:'Jr. Cusco 456', notas:'' });
  }
  if(state.docs.length===0){
    state.docs.push({
      id: ++state.docSeq,
      tipo: 'Cotización',
      numero: 'COT-0001',
      fecha: toISO(new Date()),
      contactoId: state.contactos[0]?.id || null,
      empresaId: state.empresas[0]?.id || null,
      descripcion: 'Cambio de pastillas de freno + repuesto',
      total: 480.00,
      estado: 'Pendiente',   // Pendiente | Aprobada | Facturada | Cancelada
      pagado: false
    });
  }
  saveState();

  // Utilidad para crear/obtener un <dialog> reutilizable
  function ensureDialog(id){
    let dlg = document.getElementById(id);
    if(!dlg){
      dlg = document.createElement('dialog');
      dlg.id = id;
      document.body.appendChild(dlg);
    }
    return dlg;
  }

  // Devuelve nombre de empresa por id
  function empresaNameById(id){
    const e = state.empresas.find(x=>x.id===id);
    return e? e.nombre : '—';
  }
  // Devuelve nombre de contacto por id
  function contactoNameById(id){
    const c = state.contactos.find(x=>x.id===id);
    return c? c.nombre : '—';
  }

  // -------------------------- Tabs CRM --------------------------
  const crmTabs = [
    { key:'contactos', label:'Contactos' },
    { key:'empresas',  label:'Empresas' },
    { key:'docs',      label:'Cotizaciones / Facturas' }
  ];

  function setupCrmTabs(){
    const tabsBar = document.querySelector('#route-crm .tabs');
    const container = document.getElementById('crmTabContent');
    if(!tabsBar || !container) return;

    // (Re)bind
    tabsBar.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        tabsBar.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        renderCrmTab(btn.dataset.crmTab);
      });
    });

    // Render inicial
    renderCrmTab('contactos');
  }

  function renderCrmTab(key){
    if(key==='contactos') renderCrmContactos();
    else if(key==='empresas') renderCrmEmpresas();
    else renderCrmDocs();
  }

  // -------------------------- CONTACTOS --------------------------
  function renderCrmContactos(){
    const container = document.getElementById('crmTabContent');
    if(!container) return;

    container.innerHTML = `
      <div class="card" style="padding:0; background:transparent; border:none">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px">
          <div style="display:flex; gap:8px; align-items:center">
            <h3 style="margin:0">Contactos</h3>
            <span class="pill muted">Total: ${state.contactos.length}</span>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <button class="btn ok" id="addContactoBtn">Añadir</button>
            <button class="btn ghost" onclick="exportTableCSV('contactosTable','contactos.csv')">Exportar CSV</button>
            <button class="btn ghost" onclick="printSection('route-crm')">Imprimir</button>
          </div>
        </div>
        <table id="contactosTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Empresa</th>
              <th>Notas</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody id="contactosBody"></tbody>
        </table>
      </div>
    `;

    const tbody = container.querySelector('#contactosBody');
    state.contactos.forEach((c,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(i+1).padStart(2,'0')}</td>
        <td>${c.nombre}</td>
        <td>${c.telefono||'—'}</td>
        <td>${c.email||'—'}</td>
        <td>${c.empresaId? empresaNameById(c.empresaId) : '—'}</td>
        <td><details><summary>Ver</summary>${c.notas? c.notas.replaceAll('<','&lt;') : ''}</details></td>
        <td>
          <button class="btn ghost" onclick="editContacto(${c.id})">Editar</button>
          <button class="btn bad" onclick="deleteContacto(${c.id})">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });

    document.getElementById('addContactoBtn').addEventListener('click', ()=> openContactoDialog());
  }

  function openContactoDialog(item){
    const dlg = ensureDialog('dlgContacto');
    const isEdit = !!item;
    const title = isEdit? 'Editar contacto' : 'Nuevo contacto';

    const empresaOptions = ['<option value="">— Ninguna —</option>']
      .concat(state.empresas.map(e=> `<option value="${e.id}" ${item && item.empresaId===e.id?'selected':''}>${e.nombre}</option>`))
      .join('');

    dlg.innerHTML = `
      <form id="formContacto" method="dialog" style="min-width:600px">
        <h3>${title}</h3>
        <div class="row" style="grid-template-columns:repeat(2,1fr)">
          <div>
            <label>Nombre</label>
            <input type="text" name="nombre" value="${item?.nombre||''}" required />
          </div>
          <div>
            <label>Empresa</label>
            <select name="empresaId">${empresaOptions}</select>
          </div>
          <div>
            <label>Teléfono</label>
            <input type="text" name="telefono" value="${item?.telefono||''}" />
          </div>
          <div>
            <label>Email</label>
            <input type="text" name="email" value="${item?.email||''}" />
          </div>
          <div class="span-2">
            <label>Notas</label>
            <textarea name="notas">${item?.notas||''}</textarea>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
          <button class="btn ghost" value="cancel">Cancelar</button>
          <button class="btn" value="confirm">Guardar</button>
        </div>
      </form>
    `;
    dlg.showModal();

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=='confirm') return;
      const fd = new FormData(dlg.querySelector('#formContacto'));
      const payload = {
        id: isEdit? item.id : ++state.contactSeq,
        nombre: (fd.get('nombre')||'').trim(),
        empresaId: fd.get('empresaId')? Number(fd.get('empresaId')): null,
        telefono: (fd.get('telefono')||'').trim(),
        email: (fd.get('email')||'').trim(),
        notas: (fd.get('notas')||'').trim()
      };
      if(!payload.nombre){ alert('Nombre requerido'); return; }
      if(isEdit){
        state.contactos = state.contactos.map(c=> c.id===item.id? payload : c);
      }else{
        state.contactos.push(payload);
      }
      saveState();
      renderCrmContactos();
    }, {once:true});
  }

  function editContacto(id){
    const item = state.contactos.find(c=> c.id===id);
    if(!item) return;
    openContactoDialog(item);
  }
  function deleteContacto(id){
    if(!confirm('¿Eliminar contacto?')) return;
    state.contactos = state.contactos.filter(c=> c.id!==id);
    // Limpiamos referencias en docs
    state.docs = state.docs.map(d=> d.contactoId===id? {...d, contactoId:null}: d);
    saveState();
    renderCrmContactos();
  }

  // -------------------------- EMPRESAS --------------------------
  function renderCrmEmpresas(){
    const container = document.getElementById('crmTabContent');
    if(!container) return;

    container.innerHTML = `
      <div class="card" style="padding:0; background:transparent; border:none">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px">
          <div style="display:flex; gap:8px; align-items:center">
            <h3 style="margin:0">Empresas</h3>
            <span class="pill muted">Total: ${state.empresas.length}</span>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <button class="btn ok" id="addEmpresaBtn">Añadir</button>
            <button class="btn ghost" onclick="exportTableCSV('empresasTable','empresas.csv')">Exportar CSV</button>
            <button class="btn ghost" onclick="printSection('route-crm')">Imprimir</button>
          </div>
        </div>
        <table id="empresasTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>RUC</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Notas</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody id="empresasBody"></tbody>
        </table>
      </div>
    `;

    const tbody = container.querySelector('#empresasBody');
    state.empresas.forEach((e,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(i+1).padStart(2,'0')}</td>
        <td>${e.nombre}</td>
        <td>${e.ruc||'—'}</td>
        <td>${e.telefono||'—'}</td>
        <td>${e.direccion||'—'}</td>
        <td><details><summary>Ver</summary>${e.notas? e.notas.replaceAll('<','&lt;') : ''}</details></td>
        <td>
          <button class="btn ghost" onclick="editEmpresa(${e.id})">Editar</button>
          <button class="btn bad" onclick="deleteEmpresa(${e.id})">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });

    document.getElementById('addEmpresaBtn').addEventListener('click', ()=> openEmpresaDialog());
  }

  function openEmpresaDialog(item){
    const dlg = ensureDialog('dlgEmpresa');
    const isEdit = !!item;
    const title = isEdit? 'Editar empresa' : 'Nueva empresa';

    dlg.innerHTML = `
      <form id="formEmpresa" method="dialog" style="min-width:600px">
        <h3>${title}</h3>
        <div class="row" style="grid-template-columns:repeat(2,1fr)">
          <div>
            <label>Nombre</label>
            <input type="text" name="nombre" value="${item?.nombre||''}" required />
          </div>
          <div>
            <label>RUC</label>
            <input type="text" name="ruc" value="${item?.ruc||''}" />
          </div>
          <div>
            <label>Teléfono</label>
            <input type="text" name="telefono" value="${item?.telefono||''}" />
          </div>
          <div>
            <label>Dirección</label>
            <input type="text" name="direccion" value="${item?.direccion||''}" />
          </div>
          <div class="span-2">
            <label>Notas</label>
            <textarea name="notas">${item?.notas||''}</textarea>
          </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
          <button class="btn ghost" value="cancel">Cancelar</button>
          <button class="btn" value="confirm">Guardar</button>
        </div>
      </form>
    `;
    dlg.showModal();

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=='confirm') return;
      const fd = new FormData(dlg.querySelector('#formEmpresa'));
      const payload = {
        id: isEdit? item.id : ++state.empresaSeq,
        nombre: (fd.get('nombre')||'').trim(),
        ruc: (fd.get('ruc')||'').trim(),
        telefono: (fd.get('telefono')||'').trim(),
        direccion: (fd.get('direccion')||'').trim(),
        notas: (fd.get('notas')||'').trim()
      };
      if(!payload.nombre){ alert('Nombre requerido'); return; }
      if(isEdit){
        state.empresas = state.empresas.map(e=> e.id===item.id? payload : e);
        // Sincronizar nombre en vistas derivadas no es necesario ahora (se lee en tiempo real)
      }else{
        state.empresas.push(payload);
      }
      saveState();
      renderCrmEmpresas();
    }, {once:true});
  }

  function editEmpresa(id){
    const item = state.empresas.find(e=> e.id===id);
    if(!item) return;
    openEmpresaDialog(item);
  }
  function deleteEmpresa(id){
    if(!confirm('¿Eliminar empresa?')) return;
    state.empresas = state.empresas.filter(e=> e.id!==id);
    // Limpiamos referencias en contactos y docs
    state.contactos = state.contactos.map(c=> c.empresaId===id? {...c, empresaId:null }: c);
    state.docs = state.docs.map(d=> d.empresaId===id? {...d, empresaId:null }: d);
    saveState();
    renderCrmEmpresas();
  }

  // -------------------------- DOCS (Cotizaciones/Facturas) --------------------------
  function renderCrmDocs(){
    const container = document.getElementById('crmTabContent');
    if(!container) return;

    container.innerHTML = `
      <div class="card" style="padding:0; background:transparent; border:none">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px">
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap">
            <h3 style="margin:0">Documentos</h3>
            <span class="pill muted">Total: ${state.docs.length}</span>
            <select id="docFilterEstado">
              <option value="">Todos</option>
              <option>Pendiente</option>
              <option>Aprobada</option>
              <option>Facturada</option>
              <option>Cancelada</option>
            </select>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <button class="btn ok" id="addDocBtn">Añadir</button>
            <button class="btn ghost" onclick="exportTableCSV('docsTable','documentos.csv')">Exportar CSV</button>
            <button class="btn ghost" onclick="printSection('route-crm')">Imprimir</button>
          </div>
        </div>
        <table id="docsTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Tipo</th>
              <th>Número</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Empresa</th>
              <th>Descripción</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Pagado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody id="docsBody"></tbody>
        </table>
      </div>
    `;

    const filterSel = container.querySelector('#docFilterEstado');
    filterSel.addEventListener('change', ()=> renderDocsRows(filterSel.value));
    renderDocsRows('');
    container.querySelector('#addDocBtn').addEventListener('click', ()=> openDocDialog());
  }

  function renderDocsRows(estado){
    const tbody = document.getElementById('docsBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    let list = state.docs.slice().sort((a,b)=> a.fecha<b.fecha ? 1 : -1);
    if(estado) list = list.filter(d=> d.estado===estado);

    list.forEach((d,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${String(i+1).padStart(2,'0')}</td>
        <td>${d.tipo}</td>
        <td>${d.numero||('DOC-'+String(d.id).padStart(4,'0'))}</td>
        <td>${d.fecha}</td>
        <td>${d.contactoId? contactoNameById(d.contactoId): '—'}</td>
        <td>${d.empresaId? empresaNameById(d.empresaId): '—'}</td>
        <td><details><summary>Ver</summary>${d.descripcion? d.descripcion.replaceAll('<','&lt;') : ''}</details></td>
        <td>${fmt.format(Number(d.total)||0)}</td>
        <td>${d.estado}</td>
        <td>${d.pagado? 'Sí' : 'No'}</td>
        <td style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn ghost" onclick="editDoc(${d.id})">Editar</button>
          <button class="btn bad" onclick="deleteDoc(${d.id})">Eliminar</button>
          <button class="btn" onclick="convertDocToTxn(${d.id})">Registrar transacción</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function openDocDialog(item){
    const dlg = ensureDialog('dlgDoc');
    const isEdit = !!item;
    const title = isEdit? 'Editar documento' : 'Nuevo documento';
    const tipo = item?.tipo || 'Cotización';

    const contactoOptions = ['<option value="">— Ninguno —</option>']
      .concat(state.contactos.map(c=> `<option value="${c.id}" ${item && item.contactoId===c.id?'selected':''}>${c.nombre}</option>`))
      .join('');

    const empresaOptions = ['<option value="">— Ninguna —</option>']
      .concat(state.empresas.map(e=> `<option value="${e.id}" ${item && item.empresaId===e.id?'selected':''}>${e.nombre}</option>`))
      .join('');

    dlg.innerHTML = `
      <form id="formDoc" method="dialog" style="min-width:760px">
        <h3>${title}</h3>
        <div class="row" style="grid-template-columns:repeat(3,1fr)">
          <div>
            <label>Tipo</label>
            <select name="tipo">
              <option ${tipo==='Cotización'?'selected':''}>Cotización</option>
              <option ${tipo==='Factura'?'selected':''}>Factura</option>
              <option ${tipo==='Boleta'?'selected':''}>Boleta</option>
            </select>
          </div>
          <div>
            <label>Número</label>
            <input type="text" name="numero" value="${item?.numero||''}" placeholder="AUTO si se deja vacío" />
          </div>
          <div>
            <label>Fecha</label>
            <input type="date" name="fecha" value="${item?.fecha||todayISO()}" required />
          </div>

          <div>
            <label>Contacto</label>
            <select name="contactoId">${contactoOptions}</select>
          </div>
          <div>
            <label>Empresa</label>
            <select name="empresaId">${empresaOptions}</select>
          </div>
          <div>
            <label>Estado</label>
            <select name="estado">
              ${['Pendiente','Aprobada','Facturada','Cancelada'].map(st=> `<option ${item?.estado===st?'selected':''}>${st}</option>`).join('')}
            </select>
          </div>

          <div class="span-3">
            <label>Descripción</label>
            <input type="text" name="descripcion" value="${item?.descripcion||''}" />
          </div>
          <div>
            <label>Total (S/)</label>
            <input type="number" step="0.01" name="total" value="${item?.total||0}" required />
          </div>
          <div>
            <label>¿Pagado?</label>
            <select name="pagado">
              <option value="si" ${item?.pagado?'selected':''}>Sí</option>
              <option value="no" ${!item?.pagado?'selected':''}>No</option>
            </select>
          </div>
          <div>
            <label># Interno</label>
            <input type="text" name="interno" value="${item?.id? 'DOC-'+String(item.id).padStart(4,'0'):''}" disabled />
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
          <button class="btn ghost" value="cancel">Cancelar</button>
          <button class="btn" value="confirm">Guardar</button>
        </div>
      </form>
    `;
    dlg.showModal();

    dlg.addEventListener('close', ()=>{
      if(dlg.returnValue!=='confirm') return;
      const fd = new FormData(dlg.querySelector('#formDoc'));
      const id = isEdit? item.id : ++state.docSeq;
      const numero = (fd.get('numero')||'').trim() || `${fd.get('tipo')==='Factura'?'FAC':'DOC'}-${String(id).padStart(4,'0')}`;
      const payload = {
        id,
        tipo: fd.get('tipo'),
        numero,
        fecha: fd.get('fecha'),
        contactoId: fd.get('contactoId')? Number(fd.get('contactoId')): null,
        empresaId: fd.get('empresaId')? Number(fd.get('empresaId')): null,
        descripcion: (fd.get('descripcion')||'').trim(),
        total: Number(fd.get('total'))||0,
        estado: fd.get('estado'),
        pagado: fd.get('pagado')==='si'
      };

      if(isEdit){
        state.docs = state.docs.map(d=> d.id===id? payload : d);
      } else {
        state.docs.push(payload);
      }
      saveState();
      renderCrmDocs();
    }, {once:true});
  }

  function editDoc(id){
    const item = state.docs.find(d=> d.id===id);
    if(!item) return;
    openDocDialog(item);
  }

  function deleteDoc(id){
    if(!confirm('¿Eliminar documento?')) return;
    state.docs = state.docs.filter(d=> d.id!==id);
    saveState();
    renderCrmDocs();
  }

  // Registrar un documento como transacción (interconecta con dashboard)
  function convertDocToTxn(id){
    const d = state.docs.find(x=> x.id===id);
    if(!d){ alert('Documento no encontrado'); return; }

    // Sugerimos número y datos
    const txId = ++state.txSeq;
    const numero = 'TX-'+String(txId).padStart(4,'0');
    const cliente = d.contactoId? contactoNameById(d.contactoId) : (d.empresaId? empresaNameById(d.empresaId) : 'Cliente s/n');
    const descripcion = `[${d.tipo} ${d.numero}] ${d.descripcion||''}`.trim();
    const pagado = !!d.pagado;
    const estado = d.estado==='Cancelada' ? 'Cancelado' : (pagado? 'Completado':'Pendiente');

    state.transacciones.push({
      id: txId,
      numero,
      fecha: d.fecha || todayISO(),
      cliente,
      descripcion,
      total: Number(d.total)||0,
      pagado,
      estado
    });

    // Si estaba en 'Aprobada' o 'Facturada', mantenemos; si era 'Pendiente' y pagado, la pasamos a 'Facturada'
    if(d.estado==='Pendiente' && pagado) d.estado = 'Facturada';
    saveState();

    // Refrescos
    renderTxTable();
    renderKPIs();
    drawSalesChart();
    alert('Documento registrado como transacción: '+numero);
  }

  // -------------------------- Integración de navegación --------------------------
  (function(){
    const _show = window.showRoute;
    window.showRoute = function(name){
      _show(name);
      if(name==='crm'){
        setupCrmTabs();
      }
    }
  })();

  // Inicializamos CRM si el usuario llega directo
  window.addEventListener('DOMContentLoaded', ()=>{
    const routeVisible = Array.from(document.querySelectorAll('.route')).find(r=> r.style.display!== 'none');
    if(routeVisible && routeVisible.id==='route-crm'){
      setupCrmTabs();
    }
  });

  
