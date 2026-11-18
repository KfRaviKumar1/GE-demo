// Catalog of built-in models shown under MODELS in the sidebar.
// To add a model:
//   1. Put its files in public/models/catalog/<id>/  →  model.glb + thumbs/<GLB node>.png
//   2. Create src/data/models/<id>.js (copy motor-jet.js as a template)
//   3. Import it and add it to catalogModels below
// The sidebar tree, hotspots, part index and detail copy are built from this list.
import motorJet from './models/motor-jet.js'
import gasTurbineCutaway from './models/gas-turbine-cutaway.js'
import jetEngineS00564 from './models/jet-engine-s00564.js'

export const catalogModels = [motorJet, gasTurbineCutaway, jetEngineS00564]

const assetBase = `${import.meta.env.BASE_URL}models/catalog`

// Link every item to its parent and model, and fill in asset paths.
catalogModels.forEach((model) => {
  const base = `${assetBase}/${model.id}`
  model.file = model.file || `${base}/model.glb`
  ;(function walk(item, parent) {
    item.parent = parent
    item.model = model
    item.thumb = item.thumb || `${base}/thumbs/${item.node}.png`
    item.children?.forEach((child) => walk(child, item))
  })(model, null)
})

const findIn = (item, node) =>
  item.node === node ? item : item.children?.reduce((found, child) => found || findIn(child, node), null)

export const getCatalogModel = (modelId) => catalogModels.find(({ id }) => id === modelId)

// An item is addressed by its model id plus its GLB node name.
export const getCatalogItem = (modelId, node) => {
  const model = getCatalogModel(modelId)
  return model && (node ? findIn(model, node) : model)
}

export const catalogPath = (item) =>
  item.parent ? `/explore/${item.model.id}/${item.node}` : `/explore/${item.model.id}`

export const getAncestors = (item) => {
  const path = []
  for (let current = item; current; current = current.parent) path.unshift(current)
  return path
}
