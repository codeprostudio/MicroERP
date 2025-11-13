// Router simple de secciones
const routes = ['principal','inventario','crm','proyectos','apuntes','rrhh','export','soporte'];
window.routes = routes;

function showRoute(name){
  routes.forEach(r => {
    const el = document.getElementById('route-' + r);
    if(!el) return;
    el.style.display = (r === name) ? 'block' : 'none';
  });
  document.querySelectorAll('#sidebar .nav button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.route === name);
  });
  const crumb = document.getElementById('crumb');
  if(crumb){
    crumb.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  localStorage.setItem('microerp_last_route', name);
}
window.showRoute = showRoute;
window.dispatchEvent(new Event('microerp:router-ready'));

function init(){
  const todayEl = document.getElementById('today');
  if(todayEl){
    todayEl.textContent = new Date().toLocaleDateString('es-PE', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  document.querySelectorAll('#sidebar .nav button').forEach(btn => {
    btn.addEventListener('click', () => showRoute(btn.dataset.route));
  });

  setupGlobalSearch();

  renderKPIs();
  renderTxTable();

  const chartPeriod = document.getElementById('chartPeriod');
  const chartMonth = document.getElementById('chartMonth');
  if(chartPeriod && chartMonth){
    const year = new Date().getFullYear();
    chartMonth.innerHTML = Array.from({length:12}, (_,i) => {
      const value = `${year}-${String(i+1).padStart(2,'0')}`;
      return `<option value="${value}">${monthNames[i]}</option>`;
    }).join('');
    chartPeriod.addEventListener('change', () => {
      chartMonth.style.display = chartPeriod.value === 'month' ? 'inline-block' : 'none';
      drawSalesChart();
    });
    chartMonth.addEventListener('change', drawSalesChart);
  }

  const downloadBtn = document.getElementById('downloadChartBtn');
  if(downloadBtn){
    downloadBtn.addEventListener('click', downloadChart);
  }

  setupTxnForm();
  drawSalesChart();

  const lastRoute = localStorage.getItem('microerp_last_route') || 'principal';
  showRoute(lastRoute);

  const saveBtn = document.getElementById('saveAllBtn');
  if(saveBtn){
    saveBtn.addEventListener('click', () => {
      saveState();
      alert('¡Todos los datos han sido guardados de forma segura en este navegador!');
    });
  }

  document.querySelectorAll('dialog').forEach(dlg => {
    dlg.querySelectorAll('button[value="cancel"]').forEach(btn => {
      btn.addEventListener('click', () => dlg.close('cancel'));
    });
  });

  const backupBtn = document.getElementById('backupBtn');
  if(backupBtn){
    backupBtn.addEventListener('click', () => {
      const data = localStorage.getItem('microerp_repuestos_v1');
      if(!data){
        alert('No hay datos para exportar.');
        return;
      }
      const blob = new Blob([data], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'microerp-backup-' + new Date().toISOString().slice(0,10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const restoreBtn = document.getElementById('restoreBtn');
  const restoreInput = document.getElementById('restoreFile');
  if(restoreBtn && restoreInput){
    restoreBtn.addEventListener('click', () => restoreInput.click());
    restoreInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try{
          const data = JSON.parse(ev.target.result);
          if(!data || typeof data !== 'object') throw new Error('Archivo inválido');
          localStorage.setItem('microerp_repuestos_v1', JSON.stringify(data));
          alert('¡Copia de seguridad restaurada! Recarga la página para ver los cambios.');
        }catch(err){
          alert('Error al importar la copia de seguridad: ' + err.message);
        }
        restoreInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  const toggleBtn = document.getElementById('toggleSidebar');
  const toggleIcon = document.getElementById('toggleIcon');
  const overlay = document.getElementById('sidebarOverlay');
  if(toggleBtn && toggleIcon && overlay){
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
      const collapsed = document.body.classList.contains('sidebar-collapsed');
      toggleIcon.textContent = collapsed ? '⮞' : '⮜';
      overlay.style.display = collapsed ? 'block' : 'none';
    });
    overlay.addEventListener('click', () => {
      document.body.classList.remove('sidebar-collapsed');
      toggleIcon.textContent = '⮜';
      overlay.style.display = 'none';
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
