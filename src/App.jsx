import { Link, Navigate, useLocation, useNavigate, useRoutes } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import AdminSidebar from './components/ui/AdminSidebar.jsx'
import CatalogScene from './components/ui/CatalogScene.jsx'
import LoginPage from './components/ui/LoginPage.jsx'
import { catalogModels, catalogPath } from './data/catalogModels.js'
import { isSignedIn, signOut } from './auth.js'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const home = catalogPath(catalogModels[0])
  const signedIn = isSignedIn()

  const routes = useRoutes([
    { path: '/explore/:modelId/:nodeId?', element: <CatalogScene /> },
    { path: '*', element: <Navigate to={home} replace /> },
  ])

  // Every page except the sign-in page needs a session. `replace` keeps the
  // Back button from returning to a page the user is no longer allowed on.
  if (location.pathname === '/login') {
    return signedIn ? <Navigate to={home} replace /> : <LoginPage home={home} firstModel={catalogModels[0]} />
  }
  if (!signedIn) return <Navigate to="/login" replace />

  const logOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="workspace-topbar">
        <Link className="workspace-brand" to={home}>
          <span className="workspace-brand-mark">◆</span>
          <span>Aviation 3D Explorer</span>
        </Link>
        <button type="button" className="workspace-logout" onClick={logOut} aria-label="Log out" title="Log out">
          <LogOut size={15} /> <span>Log out</span>
        </button>
      </header>
      <div className="workspace-frame">
        <AdminSidebar />
        <div className="workspace-main" key={location.pathname}>{routes}</div>
      </div>
    </div>
  )
}

export default App
