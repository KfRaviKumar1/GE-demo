import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useRoutes } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Box, Eye, EyeOff, Rotate3D } from 'lucide-react'
import CanvasContainer from './components/3d/CanvasContainer.jsx'
import DynamicModelViewer from './components/3d/DynamicModelViewer.jsx'
import LightingEnvironment from './components/3d/LightingEnvironment.jsx'
import MainModel from './components/3d/MainModel.jsx'
import SubPartModel from './components/3d/SubPartModel.jsx'
import { releaseUploadedModel } from './components/3d/modelResources.js'
import AdminSidebar from './components/ui/AdminSidebar.jsx'
import CatalogScene from './components/ui/CatalogScene.jsx'
import ModelSwitcher from './components/ui/ModelSwitcher.jsx'
import MaterialAppearanceControls from './components/ui/MaterialAppearanceControls.jsx'
import NavigationOverlay from './components/ui/NavigationOverlay.jsx'
import UploadModal from './components/ui/UploadModal.jsx'
import WorkspacePage from './components/ui/WorkspacePage.jsx'
import { getPart, modelParts } from './data/modelParts.js'

const EMPTY_HOTSPOT_VISIBILITY_OVERRIDES = new Map()

function getModelDisplayName(fileName) {
  return fileName.replace(/\.(glb|gltf)$/i, '')
}

function ModelTitle({ name, partCount }) {
  const [lead, ...rest] = getModelDisplayName(name).split(/\s+/)

  return (
    <section className="scene-title uploaded-model-title">
      <div className="eyebrow"><span className="eyebrow-mark" /> INDUSTRIAL POWER SYSTEMS</div>
      <h1>{lead} {rest.length > 0 && <span>{rest.join(' ')}</span>}</h1>
      <div className="title-rule" />
      <p>
        Inside the model.<br />
        {partCount ? `Explore ${partCount} numbered ${partCount === 1 ? 'part' : 'parts'} in detail.` : 'Preparing model parts…'}
      </p>
    </section>
  )
}

function MainScene({ models, activeModelId, onSelectModel, onDeleteModel, onOpenUpload }) {
  const navigate = useNavigate()
  const activeModel = models.find(({ id }) => id === activeModelId)
  const [selectedPart, setSelectedPart] = useState(null)
  const [meshRegistry, setMeshRegistry] = useState({ modelId: null, parts: [] })
  const [appearanceOverrides, setAppearanceOverrides] = useState({})
  const [hotspotVisibilityOverridesByModel, setHotspotVisibilityOverridesByModel] = useState({})
  const selectedMeshId = activeModel && selectedPart?.modelId === activeModel.id ? selectedPart.meshId : null
  const meshNodes = meshRegistry.modelId === activeModel?.id ? meshRegistry.parts : []
  const hotspotVisibilityOverrides = activeModel
    ? hotspotVisibilityOverridesByModel[activeModel.id] ?? EMPTY_HOTSPOT_VISIBILITY_OVERRIDES
    : EMPTY_HOTSPOT_VISIBILITY_OVERRIDES
  const selectedMesh = meshNodes.find(({ meshId }) => meshId === selectedMeshId)
  const reportParts = useCallback((parts) => {
    setMeshRegistry({ modelId: activeModel?.id, parts })
  }, [activeModel?.id])
  const selectMesh = (meshId) => {
    setSelectedPart((current) => current?.modelId === activeModel?.id && current.meshId === meshId
      ? null
      : { modelId: activeModel.id, meshId })
  }
  const toggleHotspotVisibility = (meshIndex, isVisible) => {
    setHotspotVisibilityOverridesByModel((current) => {
      const hotspotVisibilityOverrides = new Map(current[activeModel.id] ?? [])
      hotspotVisibilityOverrides.set(meshIndex, isVisible)
      return { ...current, [activeModel.id]: hotspotVisibilityOverrides }
    })
  }
  const changeAppearance = (key, value) => {
    if (!selectedMeshId) return
    setAppearanceOverrides((current) => ({
      ...current,
      [selectedMeshId]: { ...current[selectedMeshId], [key]: value },
    }))
  }

  return (
    <SceneLayout>
      <CanvasContainer
        cameraPosition={[6.6, 4.5, 9]}
        cameraNear={activeModel ? 0.001 : 0.1}
        cameraFar={activeModel ? 100000 : 100}
        minDistance={activeModel ? 0.001 : 2.2}
        maxDistance={activeModel ? 100000 : 14}
      >
        <LightingEnvironment />
        {activeModel ? (
          <DynamicModelViewer
            key={activeModel.id}
            modelName={activeModel.name}
            url={activeModel.url}
            selectedMeshId={selectedMeshId}
            onSelectMesh={selectMesh}
            onPartsChange={reportParts}
            appearanceOverrides={appearanceOverrides}
            hotspotNames={activeModel.hotspotNames}
            hotspotVisibilityOverrides={hotspotVisibilityOverrides}
          />
        ) : (
          <MainModel onSelectPart={(part) => navigate(`/part/${part.id}`)} />
        )}
      </CanvasContainer>
      <ModelSwitcher
        models={models}
        activeModelId={activeModelId}
        onSelect={onSelectModel}
        onDelete={onDeleteModel}
        onUpload={onOpenUpload}
      />
      {activeModel ? (
        <>
          <ModelTitle name={activeModel.name} partCount={meshNodes.length} />
          <aside className="uploaded-model-panel">
            <header><span>MODEL PARTS</span><span>{meshNodes.length}</span></header>
            {selectedMesh && (
              <section className="uploaded-part-details" aria-live="polite">
                <h2>{selectedMesh.name}</h2>
                <p className="uploaded-part-description">{selectedMesh.description}</p>
                <div className="uploaded-part-specs">
                  <div><span>MATERIAL</span><strong>{selectedMesh.material}</strong></div>
                  <div><span>FINISH</span><strong>{selectedMesh.finish}</strong></div>
                  <div><span>DIMENSIONS</span><strong>{selectedMesh.dimensions}</strong></div>
                  <div><span>DISCIPLINE</span><strong>{selectedMesh.category.split(' / ')[0]}</strong></div>
                  <div><span>ENGINE TYPE</span><strong>{selectedMesh.engineType}</strong></div>
                  <div><span>FLOW PATH</span><strong>{selectedMesh.flowPath}</strong></div>
                </div>
                {selectedMesh.appearance && (
                  <MaterialAppearanceControls
                    appearance={{
                      ...selectedMesh.appearance,
                      ...appearanceOverrides[selectedMesh.meshId],
                    }}
                    onChange={changeAppearance}
                  />
                )}
              </section>
            )}
            {meshNodes.length > 0 && !selectedMeshId && (
              <div className="uploaded-model-parts">
                {meshNodes.map((mesh) => {
                  const isIncludedInJson = !activeModel.hotspotNames || mesh.meshNames.some((meshName) =>
                    activeModel.hotspotNames.some((name) => name.toLowerCase() === meshName.toLowerCase()),
                  )
                  const isHotspotVisible = hotspotVisibilityOverrides.get(mesh.meshIndex) ?? isIncludedInJson
                  return (
                    <div className={`uploaded-model-part ${isHotspotVisible ? '' : 'uploaded-model-part-hotspot-hidden'}`} key={mesh.meshId}>
                      <button
                        type="button"
                        className="uploaded-model-part-select"
                        onClick={() => selectMesh(mesh.meshId)}
                      >
                        <span>{mesh.number}</span>
                        <strong title={mesh.name}>{mesh.name}</strong>
                      </button>
                      <button
                        type="button"
                        className="uploaded-model-part-toggle"
                        aria-label={`${isHotspotVisible ? 'Hide' : 'Show'} ${mesh.name} hotspot`}
                        aria-pressed={isHotspotVisible}
                        onClick={() => toggleHotspotVisibility(mesh.meshIndex, !isHotspotVisible)}
                      >
                        {isHotspotVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            {meshNodes.length === 0 && <p className="uploaded-model-empty">
              {meshRegistry.modelId === activeModel.id ? 'No meshes were found in this model.' : 'Loading model parts…'}
            </p>}
            {selectedMeshId && (
              <button type="button" className="uploaded-model-back" onClick={() => setSelectedPart(null)}>
                <ArrowLeft size={14} /> Back to full model
              </button>
            )}
          </aside>
          <div className="scene-hint"><Rotate3D size={15} strokeWidth={1.6} /> DRAG TO ROTATE <span>·</span> SCROLL TO ZOOM</div>
        </>
      ) : (
        <>
          <NavigationOverlay mode="main" />
          <div className="scene-hint"><Rotate3D size={15} strokeWidth={1.6} /> DRAG TO EXPLORE <span>·</span> SELECT A MARKER TO DISCOVER</div>
        </>
      )}
    </SceneLayout>
  )
}

function PartScene() {
  const { partId } = useParams()
  const navigate = useNavigate()
  const part = getPart(partId)

  if (!part) {
    return (
      <main className="not-found">
        <span className="eyebrow">GAS TURBINE / COMPONENT NOT FOUND</span>
        <h1>Nothing to see here.</h1>
        <button className="text-button" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to the complete object
        </button>
      </main>
    )
  }

  const partIndex = modelParts.findIndex(({ id }) => id === part.id)
  const nextPart = modelParts[(partIndex + 1) % modelParts.length]

  return (
    <SceneLayout>
      <CanvasContainer key={part.id} cameraPosition={[3.5, 2.4, 4.5]} canvasClassName="part-canvas">
        <LightingEnvironment />
        <SubPartModel part={part} />
      </CanvasContainer>
      <NavigationOverlay mode="detail" part={part} onBack={() => navigate('/')} />
      <button className="next-part" onClick={() => navigate(`/part/${nextPart.id}`)}>
        NEXT COMPONENT <ArrowRight size={14} />
      </button>
      <div className="scene-hint"><Rotate3D size={15} strokeWidth={1.6} /> DRAG TO ROTATE <span>·</span> SCROLL TO ZOOM</div>
    </SceneLayout>
  )
}

function SceneLayout({ children }) {
  return <main className="scene-page">{children}</main>
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [models, setModels] = useState([])
  const [activeModelId, setActiveModelId] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const modelsRef = useRef(models)
  modelsRef.current = models

  useEffect(() => () => {
    modelsRef.current.forEach(({ url }) => {
      releaseUploadedModel(url)
      URL.revokeObjectURL(url)
    })
  }, [])

  const addModels = (uploads) => {
    const newModels = uploads.map(({ modelFile, hotspotNames }) => ({
      id: crypto.randomUUID(),
      name: modelFile.name,
      url: URL.createObjectURL(modelFile),
      hotspotNames,
    }))

    setModels((current) => [...current, ...newModels])
    setActiveModelId(newModels.at(-1)?.id ?? null)
    if (newModels.length) navigate('/')
  }

  const removeModel = (modelId) => {
    const model = models.find(({ id }) => id === modelId)
    if (!model) return

    releaseUploadedModel(model.url)
    URL.revokeObjectURL(model.url)
    const remaining = models.filter(({ id }) => id !== modelId)
    setModels(remaining)
    if (activeModelId === modelId) setActiveModelId(remaining[0]?.id ?? null)
  }

  const selectModel = (modelId) => setActiveModelId(modelId)

  const routes = useRoutes([
    { path: '/', element: <MainScene models={models} activeModelId={activeModelId} onSelectModel={selectModel} onDeleteModel={removeModel} onOpenUpload={() => setUploadOpen(true)} /> },
    { path: '/part/:partId', element: <PartScene /> },
    { path: '/explore/:modelId/:nodeId?', element: <CatalogScene /> },
    { path: '/workspace/dashboard', element: <WorkspacePage models={models} onOpenUpload={() => setUploadOpen(true)} onSelectModel={selectModel} /> },
    { path: '/models/library', element: <WorkspacePage models={models} onOpenUpload={() => setUploadOpen(true)} onSelectModel={selectModel} onDeleteModel={removeModel} /> },
    { path: '/models/upload', element: <WorkspacePage models={models} onOpenUpload={() => setUploadOpen(true)} /> },
    { path: '/components', element: <WorkspacePage /> },
    { path: '/components/assemblies', element: <WorkspacePage /> },
    { path: '/components/materials', element: <WorkspacePage /> },
    { path: '/projects', element: <WorkspacePage /> },
    { path: '/projects/active', element: <WorkspacePage /> },
    { path: '/admin/team', element: <WorkspacePage /> },
    { path: '/admin/settings', element: <WorkspacePage /> },
    { path: '*', element: <WorkspacePage /> },
  ])

  return (
    <div className="app-shell">
      <header className="workspace-topbar">
        <Link className="workspace-brand" to="/">
          <span className="workspace-brand-mark">◆</span>
          <span>Industrial Studio</span>
        </Link>
        <div className="workspace-topbar-right">
          <button type="button" className="topbar-upload" onClick={() => setUploadOpen(true)}>Upload models <ArrowRight size={14} /></button>
          <Box size={14} /> Admin Workspace
        </div>
      </header>
      <div className="workspace-frame">
        <AdminSidebar />
        <div className="workspace-main" key={location.pathname}>{routes}</div>
      </div>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={addModels} />
    </div>
  )
}

export default App
