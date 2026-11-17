import { useEffect, useState } from 'react'
import { Menu, PanelLeft } from 'lucide-react'
import CatalogSidebarTree from './CatalogSidebarTree.jsx'

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 560px)').matches)

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 560px)')
    const syncCollapsedState = (event) => setCollapsed(event.matches)
    mobileQuery.addEventListener('change', syncCollapsedState)
    return () => mobileQuery.removeEventListener('change', syncCollapsedState)
  }, [])

  return (
    <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar-collapsed' : ''}`}>
      <button
        className="sidebar-collapse"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        title={collapsed ? 'Expand menu' : 'Collapse menu'}
      >
        {collapsed ? <Menu size={17} /> : <><Menu size={16} /><span>Collapse menu</span></>}
      </button>

      <nav className="sidebar-navigation" aria-label="Models">
        <CatalogSidebarTree collapsed={collapsed} onExpand={() => setCollapsed(false)} />
        {!collapsed && <div className="sidebar-version"><PanelLeft size={13} /> AVIATION WORKSPACE <span>v1.0</span></div>}
      </nav>
    </aside>
  )
}
