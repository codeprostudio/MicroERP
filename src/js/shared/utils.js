//  Utils de fechas y formato
  // =============================================================
  const fmt = new Intl.NumberFormat('es-PE', { style:'currency', currency:'PEN', maximumFractionDigits:2 });
  const todayISO = () => new Date().toISOString().slice(0,10);
  const parseISO = (d) => { const [y,m,da] = d.split('-').map(Number); return new Date(y, m-1, da); };
  const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate()+n); return d };
  const between = (date, start, end) => (date>=start && date<=end);
  const toISO = (date) => date.toISOString().slice(0,10);
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  // =============================================================
  
