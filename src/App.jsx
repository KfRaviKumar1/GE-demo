import { Link, Navigate, useLocation, useRoutes } from 'react-router-dom'
import AdminSidebar from './components/ui/AdminSidebar.jsx'
import CatalogScene from './components/ui/CatalogScene.jsx'
import { catalogModels, catalogPath } from './data/catalogModels.js'

function App() {
  const location = useLocation()
  const home = catalogPath(catalogModels[0])

  const routes = useRoutes([
    { path: '/explore/:modelId/:nodeId?', element: <CatalogScene /> },
    { path: '*', element: <Navigate to={home} replace /> },
  ])

  return (
    <div className="app-shell">
      <header className="workspace-topbar">
        <Link className="workspace-brand" to={home}>
          <span className="workspace-brand-mark">◆</span>
          <span>Aviation 3D Explorer</span>
        </Link>
      </header>
      <div className="workspace-frame">
        <AdminSidebar />
        <div className="workspace-main" key={location.pathname}>{routes}</div>
      </div>
    </div>
  )
}

export default App
