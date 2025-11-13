//  Almacenamiento local (store) — clave única del app
  // =============================================================
  const STORE_KEY = 'microerp_repuestos_v1';
  const defaultState = () => ({
    txSeq: 1,
    transacciones: [
      // demo inicial
      { id: 1, numero:'TX-0001', fecha: toISO(addDays(new Date(), -2)), cliente:'Taller Don Pepe', descripcion:'Venta de pastillas de freno + mano de obra', total: 380.00, pagado:true, estado:'Completado' },
    ],
    inventario: [
      { codigo:'REP-001', nombre:'Filtro de aceite', cantidad: 25, puc: 18.5, puv: 35.0 },
      { codigo:'REP-002', nombre:'Pastillas de freno', cantidad: 40, puc: 45.0, puv: 80.0 },
      { codigo:'REP-003', nombre:'Bujía', cantidad: 60, puc: 12.0, puv: 25.0 },
    ],
    contactos: [], empresas: [], docs: [],
    proyectos: [], tareas: [], calendario: {},
    apuntes: { pages: [], content: {} },
    rrhh: { empleados: [], ausencias: [], turnos: [], evaluaciones: [], onboarding: [] }
  });

  function loadState(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(!raw){
        const st = defaultState();
        localStorage.setItem(STORE_KEY, JSON.stringify(st));
        return st;
      }
      return JSON.parse(raw);
    }catch(e){
      console.error('Error cargando estado, usando por defecto', e);
      const st = defaultState();
      localStorage.setItem(STORE_KEY, JSON.stringify(st));
      return st;
    }
  }
  function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  let state = loadState();

  // =============================================================
  
