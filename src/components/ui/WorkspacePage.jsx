import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Box, FileUp, FolderKanban, Layers3, Trash2, Upload } from 'lucide-react'
import { modelParts } from '../../data/modelParts.js'

const pages = {
  '/workspace/dashboard': {
    breadcrumb: 'Workspace',
    title: 'Dashboard',
    description: 'A quick overview of your gas turbine model workspace.',
    cardTitle: 'Workspace overview',
    cardDescription: 'Your engine model workspace is ready. Open the 3D viewer or browse turbine components.',
  },
  '/models/library': {
    breadcrumb: '3D Models / Model Library',
    title: 'Model Library',
    description: 'Browse the 3D models available in your workspace.',
    cardTitle: 'Gas Turbine 01',
    cardDescription: 'Axial-flow gas turbine · Interactive model',
  },
  '/components': {
    breadcrumb: 'Components',
    title: 'All Components',
    description: 'Explore the gas turbine flow path and its serviceable components.',
    cardTitle: 'Engine components',
    cardDescription: 'Select a component to open its interactive 3D detail view.',
  },
  '/components/assemblies': {
    breadcrumb: 'Components / Assemblies',
    title: 'Assemblies',
    description: 'Browse the turbine’s primary rotating assemblies and flow-path hardware.',
    cardTitle: 'Gas turbine assemblies',
    cardDescription: 'Intake, compressor, combustion chamber, turbine, and exhaust.',
  },
  '/components/materials': {
    breadcrumb: 'Components / Materials',
    title: 'Materials',
    description: 'Review the materials and finishes used across the turbine assembly.',
    cardTitle: 'Material overview',
    cardDescription: 'Aluminum inlet, titanium compressor blades, nickel-alloy hot-section parts, and steel casing hardware.',
  },
  '/projects': {
    breadcrumb: 'Projects',
    title: 'Projects',
    description: 'Manage the models and components in your workspace.',
    cardTitle: 'Gas Turbine 01',
    cardDescription: 'Active · 9 engine components',
  },
  '/projects/active': {
    breadcrumb: 'Projects / Active Projects',
    title: 'Active Projects',
    description: 'Projects currently available in the workspace.',
    cardTitle: 'Gas Turbine 01',
    cardDescription: 'Active · Axial-flow gas turbine model',
  },
  '/admin/team': {
    breadcrumb: 'Administration / Team',
    title: 'Team Members',
    description: 'Workspace access and team administration.',
    cardTitle: 'Admin Workspace',
    cardDescription: 'Team management options are available to workspace administrators.',
  },
  '/admin/settings': {
    breadcrumb: 'Administration / Settings',
    title: 'Settings',
    description: 'Workspace preferences and viewer configuration.',
    cardTitle: 'Viewer settings',
    cardDescription: 'The gas turbine 3D viewer is online and ready to explore.',
  },
}

function ComponentList() {
  return (
    <div className="workspace-component-list">
      {modelParts.map((part) => (
        <Link className="workspace-component-row" key={part.id} to={`/part/${part.id}`}>
          <span className="workspace-component-number">{part.number}</span>
          <span className="workspace-component-copy">
            <strong>{part.name}</strong>
            <small>{part.category}</small>
          </span>
          <ArrowRight size={16} />
        </Link>
      ))}
    </div>
  )
}

export default function WorkspacePage({ models = [], onOpenUpload, onSelectModel, onDeleteModel }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = pages[pathname] ?? pages['/workspace/dashboard']
  const isUpload = pathname === '/models/upload'
  const isComponents = pathname.startsWith('/components')
  const isLibrary = pathname === '/models/library'
  const isProject = pathname.startsWith('/projects')
  const Icon = isUpload ? FileUp : isComponents ? Layers3 : isProject ? FolderKanban : Box

  return (
    <section className="workspace-page">
      <div className="workspace-page-heading">
        <div>
          <div className="workspace-breadcrumb">{isUpload ? '3D Models / Upload Model' : page.breadcrumb}</div>
          <h1>{isUpload ? 'Upload Model' : page.title}</h1>
        </div>
        <span className="workspace-status"><i /> Online</span>
      </div>
      <p className="workspace-description">
        {isUpload ? 'Add a 3D model and optionally provide a JSON hotspot-name list.' : page.description}
      </p>

      {isComponents ? (
        <section className="workspace-card">
          <div className="workspace-card-icon"><Layers3 size={20} /></div>
          <h2>{page.cardTitle}</h2>
          <p>{page.cardDescription}</p>
          <ComponentList />
        </section>
      ) : isUpload ? (
        <section className="workspace-card">
          <div className="workspace-card-icon"><FileUp size={20} /></div>
          <h2>Upload a 3D model</h2>
          <p>Choose local GLB or glTF models, with an optional matching JSON hotspot-name list for each.</p>
          <button type="button" className="workspace-primary-link" onClick={onOpenUpload}>
            <Upload size={15} /> Choose model files
          </button>
          <p className="upload-note">Selecting a file does not publish or store it on a server.</p>
        </section>
      ) : (
        <section className="workspace-card">
          <div className="workspace-card-icon"><Icon size={20} /></div>
          <h2>{page.cardTitle}</h2>
          <p>{page.cardDescription}</p>
          {(isLibrary || isProject || pathname === '/workspace/dashboard') && (
            <Link className="workspace-primary-link" to="/">
              Open 3D Viewer <ArrowRight size={15} />
            </Link>
          )}
          {isLibrary && (
            <div className="workspace-library-meta">
              <span><strong>03</strong> components</span>
              <span><strong>GLB</strong> supported format</span>
            </div>
          )}
          {isLibrary && (
            <div className="workspace-model-list">
              <div className="workspace-model-row">
                <span className="workspace-model-icon"><Box size={16} /></span>
                <span className="workspace-component-copy"><strong>Gas Turbine 01</strong><small>Interactive demo model</small></span>
                <button type="button" className="workspace-model-open" onClick={() => { onSelectModel(null); navigate('/') }}>Open</button>
              </div>
              {models.map((model) => (
                <div className="workspace-model-row" key={model.id}>
                  <span className="workspace-model-icon"><Box size={16} /></span>
                  <span className="workspace-component-copy"><strong title={model.name}>{model.name}</strong><small>Uploaded for this session</small></span>
                  <button type="button" className="workspace-model-open" onClick={() => { onSelectModel(model.id); navigate('/') }}>Open</button>
                  <button type="button" className="workspace-model-delete" aria-label={`Remove ${model.name}`} onClick={() => onDeleteModel(model.id)}><Trash2 size={15} /></button>
                </div>
              ))}
              <button type="button" className="workspace-model-add" onClick={onOpenUpload}><Upload size={15} /> Add models</button>
            </div>
          )}
        </section>
      )}
    </section>
  )
}
