# MicroERP Repuestos (versión Lite)

Proyecto desarrollado por **Hisahito studies**.

## Estructura principal

```
src/
  index.html
  styles/
    main.css
  js/
    app.js
    components.js
    shared/
      utils.js
      store.js
    blocks/
      01-dashboard/
      02-inventario/
      03-crm/
      04-proyectos/
      05-rrhh/
  data/
    sample-data.json
tests/
  dashboard.test.js
  inventario.test.js
  crm.test.js
  proyectos.test.js
  rrhh.test.js
```

## Puesta en marcha

1. Abre `src/index.html` en tu navegador favorito.
2. El estado inicial se guarda en `localStorage`. Puedes reiniciarlo borrando la clave `microerp_repuestos_v1`.
3. Usa `data/sample-data.json` como referencia para restablecer la información base.

## Notas

- El proyecto se mantiene en HTML/CSS/JS puro, sin dependencias externas.
- Cada módulo funcional cuenta con su archivo JavaScript en `src/js/blocks`.
- Los estilos compartidos viven en `styles/main.css`; cada módulo dispone además de un archivo CSS para personalizaciones futuras.
