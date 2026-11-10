# Gas Turbine — Interactive 3D Explorer

An interactive React Three Fiber gas turbine viewer with a cutaway axial-flow assembly, clickable component hotspots, dedicated detail routes, casing fasteners, camera controls, and shared PBR lighting.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project to its `main` or `master` branch.
2. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
3. Each push to `main` or `master` deploys the app. The workflow is in `.github/workflows/deploy.yml`.

The app uses hash-based routes so component and workspace links continue to work on GitHub Pages without server-side route rewrites. The Vite build automatically uses the repository path for project sites and the root path for `username.github.io` sites.

## Included model and GLB assets

The app is immediately usable without external model files: the default scene is a procedural gas turbine with a cutaway casing, intake, compressor and turbine blade rows, combustor, shaft, bearing, exhaust, and visible casing screws. Detail routes contain a separate procedural assembly for every mapped component. To use your own GLBs:

1. Copy the complete model to `public/models/assembly.glb`.
2. Copy an isolated GLB for each component to `public/models/parts/<id>.glb`, using the IDs listed in `src/data/modelParts.js`.
3. In `src/data/modelParts.js`, set `USE_GLB_ASSETS` to `true`.
4. Name the relevant meshes in `assembly.glb` so their names contain the configured `meshNames` values, including `compressor-blade`, `turbine-blade`, and `casing-screw`. These names map raycast hits to component routes. Update `coordinates` to position each HTML hotspot on your model.

The main model is loaded from `/models/assembly.glb`; a detail route such as `/part/fasteners` loads `/models/parts/fasteners.glb`. `useGLTF.preload` warms the model caches when GLB mode is enabled. Both modes use the same scene lighting and route structure.

## Add a component

The sample mapping in `src/data/modelParts.js` includes nine assemblies, from the air intake through the compressor, combustor, turbine, shaft, bearing, and exhaust, plus the split casing and its small screws. Each entry's `id` maps to its isolated detail asset at `public/models/parts/<id>.glb`, `meshNames` map GLTF raycast targets to routes, and `coordinates` place main-scene hotspots.

## Workspace navigation

The collapsible sidebar links to the dashboard, model library, upload dialog, 3D viewer, component categories, project pages, and administration options. Component rows open interactive detail routes. Use **Upload models** or **3D Models → Upload Model** to select or drop multiple `.glb`/`.gltf` files, then use the viewer's model selector to switch between them. Meshes can be selected in the viewport or part list to isolate and frame them; use **Back to full model** to restore the complete assembly.

Uploads use browser object URLs and remain local to the current page session; they are not sent to a server or persisted after reload. For each uploaded model, the viewer traverses its meshes and generates a `modelParts` record (mesh name, dimensions, material names, and selection ID) for every mesh through `createModelParts` in `src/data/modelParts.js`, preserving GLB traversal order. The numbered, clickable markers and part list use the same meshes and numbering; selecting a marker or part-list entry isolates the mesh and displays its description and appearance controls. The selected part's material appearance panel exposes base/emissive color, roughness, metalness, opacity, wireframe, and supported physical-material controls. Existing texture maps are indicated; texture images themselves remain those embedded in the model. The built-in turbine demo keeps its curated part descriptions and hotspots. URLs are revoked and cached Three.js resources disposed when a model is removed or the app unmounts. A `.gltf` file must embed its buffers and textures; for portability, use a self-contained `.glb`.

The viewer dependencies are already declared in `package.json`: React, Three.js, `@react-three/fiber`, and `@react-three/drei`. Install and run with `npm install` and `npm run dev`. Styling uses the existing CSS design system in `src/styles.css`; Tailwind is not required.

## Project map

- `src/App.jsx` — routes, page transitions, model-view composition.
- `src/components/3d/CanvasContainer.jsx` — WebGL canvas, suspense fallback, camera controls.
- `src/components/3d/DynamicModelViewer.jsx` — uploaded GLTF loading, mesh selection, isolation, and bounds fitting.
- `src/components/3d/modelResources.js` — GLTF cache clearing and GPU resource disposal.
- `src/components/3d/LightingEnvironment.jsx` — shared lights, city environment, contact shadows.
- `src/components/3d/MainModel.jsx` — main GLB/procedural model, mesh interactions, hotspots.
- `src/components/3d/SubPartModel.jsx` — per-part GLB/procedural detail model and bounds fitting.
- `src/components/ui/Hotspot.jsx` — 3D-pinned HTML annotations.
- `src/components/ui/NavigationOverlay.jsx` — breadcrumbs and persistent navigation.
- `src/components/ui/ModelSwitcher.jsx` — active model selection and removal.
- `src/components/ui/UploadModal.jsx` — multi-file GLB/glTF upload and drag-and-drop.
- `src/components/ui/AdminSidebar.jsx` — collapsible workspace sidebar and navigation.
- `src/components/ui/WorkspacePage.jsx` — clickable workspace sections and local model selection.
