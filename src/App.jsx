import { Link, useLocation, useNavigate, useParams, useRoutes } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Box, Rotate3D } from 'lucide-react'
import CanvasContainer from './components/3d/CanvasContainer.jsx'
import LightingEnvironment from './components/3d/LightingEnvironment.jsx'
import MainModel from './components/3d/MainModel.jsx'
import SubPartModel from './components/3d/SubPartModel.jsx'
import AdminSidebar from './components/ui/AdminSidebar.jsx'
import NavigationOverlay from './components/ui/NavigationOverlay.jsx'
import WorkspacePage from './components/ui/WorkspacePage.jsx'
import { getPart, modelParts } from './data/modelParts.js'

function MainScene() {
  const navigate = useNavigate()

  return (
    <SceneLayout>
      <CanvasContainer cameraPosition={[6.6, 4.5, 9]}>
        <LightingEnvironment />
        <MainModel onSelectPart={(part) => navigate(`/part/${part.id}`)} />
      </CanvasContainer>
      <NavigationOverlay mode="main" />
      <div className="scene-hint"><Rotate3D size={15} strokeWidth={1.6} /> DRAG TO EXPLORE <span>·</span> SELECT A MARKER TO DISCOVER</div>
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
  const routes = useRoutes([
    { path: '/', element: <MainScene /> },
    { path: '/part/:partId', element: <PartScene /> },
    { path: '/workspace/dashboard', element: <WorkspacePage /> },
    { path: '/models/library', element: <WorkspacePage /> },
    { path: '/models/upload', element: <WorkspacePage /> },
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
        <div className="workspace-topbar-right"><Box size={14} /> Admin Workspace</div>
      </header>
      <div className="workspace-frame">
        <AdminSidebar />
        <div className="workspace-main" key={location.pathname}>{routes}</div>
      </div>
    </div>
  )
}

export default App
