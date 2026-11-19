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
- `#/login` is the sign-in page.
- Any other URL redirects to the first model.

## Sign-in

Every page needs a sign-in. It is a static, client-side check against one account set in `src/auth.js`, so it keeps casual visitors out but is not real security: the credentials ship in the JavaScript bundle.

- The session lasts for the browser tab. A normal refresh keeps it.
- **Log out** in the top bar, closing the tab, or a hard refresh (Ctrl+Shift+R, Ctrl+F5, Shift+F5, Cmd+Shift+R) ends it and shows the sign-in page. The Back button can't return to the viewer after that.
- **Remember me** only remembers the username on this device.
- The first model starts downloading while the sign-in page is open, so it shows right after signing in.

## Adding a model

The sidebar tree, markers and pages are all generated from the model data, so no UI code changes are needed.

1. **Add the files** to `public/models/catalog/<model-id>/`:
   - `model.glb`, the 3D model. To compress it, run `npx gltf-transform meshopt input.glb model.glb --level high`; this keeps the node hierarchy and animations. If the model has no textures, removing its unused `TEXCOORD_0` attributes first saves more space.
   - `thumbs/<GLB node name>.png`, one thumbnail per model, section or part.
2. **Create `src/data/models/<model-id>.js`**, using `motor-jet.js` as the template:
   - Each `node` must match an object name in the GLB. Missing nodes are logged in the browser console.
   - Any depth of sections and parts works.
   - Optional fields:
     - `icon`: one of `aircraft`, `engine`, `fan`, `core`, `exhaust`, `part`.
     - `video`: a YouTube, Vimeo or video-file URL. When it's set, the part gets a video icon in the sidebar and a "Video" badge on its card. Opening the part from its hotspot, card or sidebar row starts the video, and **Play video** replays it. The video plays over the 3D view, and **×**, Esc or a click outside closes it.
     - `view: [x, y, z]` on the model: the direction the camera opens from (default `[1, 0.45, 1]`, a 3/4 view).
     - `displayModes: ['opaque', 'transparent']` on the model: shows **Opaque / Transparent** tools in the viewer. Pick a tool, then click parts of the model: Transparent makes the clicked part see-through, and Opaque makes it solid again. Other parts keep their state. **Reset**, or clicking the active tool again, makes everything solid. Each model, section or part page starts fresh, and nothing carries over between them. See `gas-turbine-cutaway.js`.
     - `explode: { clip: '<animation name>' }` on the model: adds an **Explode** slider on the full-model page only. It scrubs that GLB animation clip, so 0 is compact and 100 is fully exploded. Markers follow their parts, Opaque / Transparent work at any position, and section and part pages always show the model compact. See `jet-engine-s00564.js`.
3. **Register it** in `src/data/catalogModels.js`:
   ```js
   import myModel from './models/my-model.js'
   export const catalogModels = [motorJet, myModel]
   ```

Each GLB loads on first use and is cached by `useGLTF`.

`npm run build` replaces every `model.glb` in `dist/` with a gzipped `model.glb.gz` (about a third of the size), because static hosts such as Netlify send `.glb` files uncompressed. The viewer unzips it in the browser (`src/components/3d/gzipGLTFLoader.js`). Keep committing plain `model.glb` files; `npm run dev` serves them as they are.

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
