export const USE_GLB_ASSETS = false

export const modelParts = [
  {
    id: 'intake',
    number: '01',
    name: 'Air intake',
    category: 'Flow path / inlet guide',
    description: 'The bell-mouth inlet guides incoming air into the compressor while reducing turbulence at the engine face.',
    material: 'Aluminum alloy',
    finish: 'Machined · satin silver',
    dimensions: 'Annular inlet',
    coordinates: [-1.62, 0.53, 0.56],
    meshNames: ['intake', 'inlet'],
  },
  {
    id: 'compressor',
    number: '02',
    name: 'Compressor stages',
    category: 'Rotating assembly / axial compressor',
    description: 'Alternating rows of rotor blades and stator vanes progressively raise the pressure of the incoming air.',
    material: 'Titanium · nickel alloy',
    finish: 'Precision-machined',
    dimensions: 'Three visible blade rows',
    coordinates: [-0.86, 0.91, 0.49],
    meshNames: ['compressor', 'compressor-blade', 'compressor-rotor'],
  },
  {
    id: 'combustor',
    number: '03',
    name: 'Combustion chamber',
    category: 'Hot section / combustor liner',
    description: 'The annular combustion chamber mixes compressed air with fuel and directs the hot expanding gases toward the turbine.',
    material: 'Nickel superalloy',
    finish: 'Heat-resistant liner',
    dimensions: 'Annular combustor',
    coordinates: [0.35, 0.88, 0.5],
    meshNames: ['combustor', 'combustion'],
  },
  {
    id: 'turbine',
    number: '04',
    name: 'Turbine stages',
    category: 'Hot section / turbine rotor',
    description: 'Aerodynamic turbine blades extract energy from the hot gas stream to drive the compressor through the central shaft.',
    material: 'Nickel superalloy',
    finish: 'Thermal-protective coating',
    dimensions: 'Two visible blade rows',
    coordinates: [1.08, 0.9, 0.48],
    meshNames: ['turbine', 'turbine-blade', 'turbine-rotor'],
  },
  {
    id: 'exhaust',
    number: '05',
    name: 'Exhaust nozzle',
    category: 'Flow path / exhaust diffuser',
    description: 'The expanding aft duct guides the spent gases out of the turbine and forms the engine exhaust.',
    material: 'Heat-resistant alloy',
    finish: 'Brushed steel',
    dimensions: 'Flared annular outlet',
    coordinates: [1.9, 0.48, 0.4],
    meshNames: ['exhaust', 'nozzle'],
  },
  {
    id: 'shaft',
    number: '06',
    name: 'Drive shaft',
    category: 'Rotating assembly / power transmission',
    description: 'A balanced central shaft connects the turbine rotor to the compressor and transfers rotational power.',
    material: 'High-strength alloy steel',
    finish: 'Ground · polished journals',
    dimensions: 'Axial rotor shaft',
    coordinates: [0.08, -0.3, 0.45],
    meshNames: ['main-shaft', 'drive-shaft', 'shaft'],
  },
  {
    id: 'bearing',
    number: '07',
    name: 'Bearing assembly',
    category: 'Support system / rotor bearing',
    description: 'Precision bearing supports locate the high-speed rotor and maintain shaft alignment inside the engine.',
    material: 'Bearing steel',
    finish: 'Hardened · ground',
    dimensions: 'Radial support assembly',
    coordinates: [-1.32, -0.32, 0.48],
    meshNames: ['bearing'],
  },
  {
    id: 'casing',
    number: '08',
    name: 'Split casing',
    category: 'Structure / compressor and turbine case',
    description: 'The opened upper casing reveals the engine stages; the split flanges are secured with removable fasteners.',
    material: 'Cast alloy steel',
    finish: 'Industrial grey',
    dimensions: 'Longitudinal split shell',
    coordinates: [0.12, 1.18, 0.42],
    meshNames: ['casing', 'engine-case'],
  },
  {
    id: 'fasteners',
    number: '09',
    name: 'Casing screws',
    category: 'Hardware / split-line fasteners',
    description: 'Small hex-head screws and bolts clamp the casing flanges together and secure serviceable engine components.',
    material: 'High-strength alloy steel',
    finish: 'Zinc-coated · hex drive',
    dimensions: 'Multiple small fasteners',
    coordinates: [0.78, -0.82, 0.9],
    meshNames: ['fasteners', 'casing-screw', 'bolt', 'screw'],
  },
]

function formatMeshName(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

export function createModelParts(meshes) {
  return meshes.map((mesh, index) => {
    const materialNames = (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
      .map((material) => material?.name?.trim())
      .filter(Boolean)
    const name = formatMeshName(mesh.name || `Mesh ${index + 1}`)
    const knownPart = getPartForMesh(mesh.name)

    return {
      ...knownPart,
      id: mesh.id,
      meshId: mesh.id,
      number: String(index + 1).padStart(2, '0'),
      name: knownPart?.name ?? name,
      category: knownPart?.category ?? 'Uploaded model / mesh',
      description: knownPart?.description ?? 'Mesh detected in the uploaded 3D model.',
      material: knownPart?.material
        ?? (materialNames.length ? [...new Set(materialNames)].join(', ') : 'Defined by model geometry'),
      finish: knownPart?.finish ?? 'Defined by model materials',
      dimensions: knownPart?.dimensions
        ?? mesh.size?.map((value) => `${value.toFixed(2)} units`).join(' × ')
        ?? 'Not available',
      coordinates: mesh.position,
      appearance: mesh.appearance,
      meshNames: mesh.name ? [mesh.name] : [],
    }
  })
}

export const getPart = (id) => modelParts.find((part) => part.id === id)

export const getPartForMesh = (name = '') =>
  modelParts.find((part) =>
    part.meshNames.some((meshName) => name.toLowerCase().includes(meshName.toLowerCase())),
  )

export const mainModelPath = '/models/assembly.glb'

export const getPartModelPath = (partId) => `/models/parts/${partId}.glb`
