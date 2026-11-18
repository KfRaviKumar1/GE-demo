# Aviation 3D Explorer

Interactive React Three Fiber viewer for aviation models. Each model has a collapsible entry under **MODELS** in the sidebar, which drills down from model to sections to parts. Every level has its own page:

- The selected section or part is isolated and framed.
- Numbered markers point to its children.
- The page shows a description and thumbnail, a side index, and a breadcrumb.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`.

## Routes

Routes are hash-based, so they also work on static hosts such as GitHub Pages.

- `#/explore/<model-id>` is the full model.
- `#/explore/<model-id>/<GLB node name>` is a section or part.
- Any other URL redirects to the first model.

## Adding a model

The sidebar tree, markers and pages are all generated from the model data, so no UI code changes are needed.

1. **Add the files** to `public/models/catalog/<model-id>/`:
   - `model.glb`, the 3D model. To compress it, run `npx gltf-transform meshopt input.glb model.glb`; this keeps the node hierarchy.
   - `thumbs/<GLB node name>.png`, one thumbnail per model, section or part.
2. **Create `src/data/models/<model-id>.js`**, using `motor-jet.js` as the template:
   - Each `node` must match an object name in the GLB. Missing nodes are logged in the browser console.
   - Any depth of sections and parts works.
   - Optional fields:
     - `icon`: one of `aircraft`, `engine`, `fan`, `core`, `exhaust`, `part`.
     - `video`: a URL; a "Watch video" link appears when it's set.
     - `displayModes: ['opaque', 'transparent']` on the model: shows **Opaque / Transparent** tools in the viewer. Pick a tool, then click parts of the model: Transparent makes the clicked part see-through, and Opaque makes it solid again. Other parts keep their state. **Reset**, or clicking the active tool again, makes everything solid. Each model, section or part page starts fresh, and nothing carries over between them. See `gas-turbine-cutaway.js`.
     - `explode: { clip: '<animation name>' }` on the model: adds an **Explode** slider on the full-model page only. It scrubs that GLB animation clip, so 0 is compact and 100 is fully exploded. Markers follow their parts, Opaque / Transparent work at any position, and section and part pages always show the model compact. See `jet-engine-s00564.js`.
3. **Register it** in `src/data/catalogModels.js`:
   ```js
   import myModel from './models/my-model.js'
   export const catalogModels = [motorJet, myModel]
   ```

Each GLB loads on first use and is cached by `useGLTF`.

## Deploy

- **GitHub Pages:** pushing to `main` or `master` deploys through `.github/workflows/deploy.yml`. In the repository, set **Settings → Pages** to **GitHub Actions**. Asset paths use `import.meta.env.BASE_URL`, so the `/<repo>/` project path works.
- **Any static host (for example Netlify):** build with `npm run build` and publish the `dist/` folder.

## Project map

- `src/App.jsx`: app shell, routes, and the redirect to the first model.
- `src/components/ui/AdminSidebar.jsx`: collapsible sidebar.
- `src/components/ui/CatalogSidebarTree.jsx`: the MODELS tree (model → sections → parts).
- `src/components/ui/CatalogScene.jsx`: model, section and part page (copy, index, breadcrumb).
- `src/components/3d/CatalogModelViewer.jsx`: GLB loading, isolation, framing and marker placement.
- `src/components/3d/CanvasContainer.jsx`: WebGL canvas, loading state and orbit controls.
- `src/components/3d/LightingEnvironment.jsx`: shared lights and environment.
- `src/components/ui/Hotspot.jsx`: 3D-pinned numbered markers.
- `src/data/catalogModels.js`: model registry and helpers.
- `src/data/models/motor-jet.js`: Motor Jet 1.0A content.
