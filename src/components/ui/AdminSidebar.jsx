import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Files,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Layers3,
  Menu,
  PanelLeft,
  PanelsTopLeft,
  Settings,
  Upload,
  Users,
  Waypoints,
} from 'lucide-react'

const menuGroups = [
  {
    label: '3D Models',
    icon: PanelsTopLeft,
    items: [
      { label: 'Model Library', to: '/models/library', icon: Files },
      { label: 'Upload Model', to: '/models/upload', icon: Upload },
      { label: '3D Viewer', to: '/', icon: Waypoints, end: true },
    ],
  },
  {
    label: 'Components',
    icon: Layers3,
    items: [
      { label: 'All Components', to: '/components', icon: Files, end: true },
      { label: 'Assemblies', to: '/components/assemblies', icon: Layers3 },
      { label: 'Materials', to: '/components/materials', icon: Waypoints },
    ],
  },
  {
    label: 'Projects',
    icon: FolderKanban,
    items: [
      { label: 'All Projects', to: '/projects', icon: Files, end: true },
      { label: 'Active Projects', to: '/projects/active', icon: Gauge },
    ],
  },
]

export default function AdminSidebar() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => window.matchMedia('(max-width: 560px)').matches)
  const [openGroups, setOpenGroups] = useState({
    '3D Models': true,
    Components: true,
    Projects: true,
    Administration: false,
  })

  const toggleGroup = (label) => {
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }))
  }

  const handleGroupClick = (label) => {
    if (collapsed) {
      setCollapsed(false)
      setOpenGroups((current) => ({ ...current, [label]: true }))
      return
    }
    toggleGroup(label)
  }

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

      <nav className="sidebar-navigation" aria-label="Workspace navigation">
        {!collapsed && <div className="sidebar-section-label">MAIN MENU</div>}
        <NavLink
          to="/workspace/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <LayoutDashboard size={16} />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {menuGroups.map((group) => {
          const Icon = group.icon
          return (
            <section className="sidebar-group" key={group.label}>
              <button
                className="sidebar-link sidebar-group-toggle"
                onClick={() => handleGroupClick(group.label)}
                aria-expanded={collapsed ? undefined : openGroups[group.label]}
                title={collapsed ? group.label : undefined}
              >
                <Icon size={16} />
                {!collapsed && <><span>{group.label}</span>{openGroups[group.label] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</>}
              </button>
              {!collapsed && openGroups[group.label] && (
                <div className="sidebar-submenu">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `sidebar-sublink ${isActive || (item.to === '/' && pathname.startsWith('/part/')) ? 'sidebar-sublink-active' : ''}`}
                      >
                        <ItemIcon className="sidebar-subicon" size={14} />
                        <span>{item.label}</span>
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}

        <div className="sidebar-section-label sidebar-admin-label">{!collapsed && 'ADMINISTRATION'}</div>
        <section className="sidebar-group">
          <button
            className="sidebar-link sidebar-group-toggle"
            onClick={() => handleGroupClick('Administration')}
            aria-expanded={collapsed ? undefined : openGroups.Administration}
            title={collapsed ? 'Administration' : undefined}
          >
            <Settings size={16} />
            {!collapsed && <><span>Administration</span>{openGroups.Administration ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</>}
          </button>
          {!collapsed && openGroups.Administration && (
            <div className="sidebar-submenu">
              <NavLink to="/admin/team" className={({ isActive }) => `sidebar-sublink ${isActive ? 'sidebar-sublink-active' : ''}`}>
                <Users className="sidebar-subicon" size={14} /><span>Team members</span>
              </NavLink>
              <NavLink to="/admin/settings" className={({ isActive }) => `sidebar-sublink ${isActive ? 'sidebar-sublink-active' : ''}`}>
                <Settings className="sidebar-subicon" size={14} /><span>Settings</span>
              </NavLink>
            </div>
          )}
        </section>
        {!collapsed && <div className="sidebar-version"><PanelLeft size={13} /> GAS TURBINE WORKSPACE <span>v1.0</span></div>}
      </nav>
    </aside>
  )
}
