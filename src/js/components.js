// Utilidades de UI compartidas entre módulos
function printSection(sectionId){
  const target = document.getElementById(sectionId);
  if(!target) return;
  const sections = Array.from(document.querySelectorAll('main .route'));
  const prev = new Map();
  sections.forEach(sec => {
    prev.set(sec, sec.style.display);
    sec.style.display = sec === target ? 'block' : 'none';
  });
  window.print();
  sections.forEach(sec => {
    const value = prev.get(sec);
    sec.style.display = value === undefined ? '' : value;
  });
}

function setupGlobalSearch(){
  const input = document.getElementById('globalSearch');
  if(!input) return;
  const filter = () => {
    const term = input.value.toLowerCase();
    const tables = document.querySelectorAll('.route:not([style*="display: none"]) table');
    tables.forEach(tbl => {
      const tbody = tbl.tBodies[0];
      if(!tbody) return;
      Array.from(tbody.rows).forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  };
  input.addEventListener('input', filter);
  document.addEventListener('keydown', (e) => {
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}

function exportTableCSV(tableId, filename){
  const tbl = document.getElementById(tableId);
  if(!tbl) return;
  const rows = Array.from(tbl.querySelectorAll('tr'));
  const csv = rows.map(tr => Array.from(tr.children)
    .map(td => '"' + td.innerText.replaceAll('"','""') + '"')
    .join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

window.exportTableCSV = exportTableCSV;
window.printSection = printSection;
window.setupGlobalSearch = setupGlobalSearch;
