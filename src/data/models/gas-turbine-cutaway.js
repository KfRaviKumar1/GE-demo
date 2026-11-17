// Gas Turbine Cutaway 1.0A — content from GasTurbineCutaway_Model_Docs.docx.
// Assets live in public/models/catalog/gas-turbine-cutaway/ (model.glb + thumbs/<node>.png).
// `node` is the object name in the GLB; `video` is empty in the doc for now.
// `displayModes` turns on the Opaque / Transparent buttons for this model.
export default {
  id: 'gas-turbine-cutaway',
  name: 'Gas Turbine Cutaway 1.0A',
  node: 'MainModel',
  icon: 'engine',
  displayModes: ['opaque', 'transparent'],
  description:
    'A cutaway 3D model of a gas turbine engine, with part of the outer casing removed so the internal stages can be seen. The engine is divided into three main sections: the Compressor Section, the Combustion & Turbine Section, and the Casing & Accessories Section. Select a main hotspot to isolate a section, then select one of its sub hotspots to focus on an individual component.',
  children: [
    {
      id: '1',
      name: 'Compressor Section',
      node: 'Compressor_Section',
      icon: 'fan',
      video: '',
      description:
        'The front stage of the engine, where air is drawn in through the intake and squeezed to high pressure before it reaches the combustion chamber. It contains the inlet centerbody, the rotating compressor rotor and the stationary stator vanes.',
      children: [
        {
          id: '1.1',
          name: 'Inlet Centerbody & Bearing',
          node: 'Inlet_Centerbody',
          video: '',
          description:
            'The streamlined nose at the centre of the air intake. It guides incoming air smoothly into the compressor and houses the front bearing that supports the rotating shaft.',
        },
        {
          id: '1.2',
          name: 'Compressor Rotor',
          node: 'Compressor_Rotor_Assembly',
          video: '',
          description:
            'The rotating drum fitted with rows of copper-coloured blades. Driven by the turbine, it spins at high speed and pushes the air rearward, raising its pressure with each row of blades.',
        },
        {
          id: '1.3',
          name: 'Compressor Stator Vanes',
          node: 'Compressor_Stator_Vanes',
          video: '',
          description:
            'The stationary rows of vanes between the rotor blade rows, together with the external variable stator vane (VSV) actuation lines. The vanes straighten the airflow between stages, and the VSV system adjusts their angle to keep the compressor efficient at different speeds.',
        },
      ],
    },
    {
      id: '2',
      name: 'Combustion & Turbine Section',
      node: 'Combustion_Turbine_Section',
      icon: 'core',
      video: '',
      description:
        "The hot section of the engine. Fuel is mixed with the compressed air and burned, and the expanding hot gas drives two turbines: one powers the compressor and the other delivers the engine's output power, before the gas leaves through the exhaust.",
      children: [
        {
          id: '2.1',
          name: 'Combustion Chamber',
          node: 'Combustion_Chamber',
          video: '',
          description:
            'The combustor liner where fuel and air burn, together with the fuel system ring and nozzles that deliver fuel into it. The liner contains the flame and shields the surrounding parts from the extreme heat.',
        },
        {
          id: '2.2',
          name: 'Gas Generator Turbine',
          node: 'Gas_Generator_Turbine',
          video: '',
          description:
            'The high-pressure turbine rotor and turbine stator vanes, connected to the compressor by the spool shaft. Hot gas from the combustor spins this turbine, which drives the compressor through the shaft.',
        },
        {
          id: '2.3',
          name: 'Power Turbine & Exhaust',
          node: 'Power_Turbine_Exhaust',
          video: '',
          description:
            'The free power turbine rotor and the exhaust centerbody with its support struts. The power turbine extracts energy from the remaining hot gas to drive the output load, and the centerbody guides the gas smoothly out of the engine.',
        },
      ],
    },
    {
      id: '3',
      name: 'Casing & Accessories Section',
      node: 'Casing_Accessories_Section',
      icon: 'exhaust',
      video: '',
      description:
        "The outer structure and external equipment of the engine. The cutaway casing is made up of the intake, center and exhaust casings, which hold every internal stage in position, while the external piping and accessory gearbox serve the engine's support systems.",
      children: [
        {
          id: '3.1',
          name: 'Intake Casing & Gearbox',
          node: 'Intake_Casing_Gearbox',
          video: '',
          description:
            'The flared bellmouth at the front of the engine, together with the accessory gearbox mounted beneath it. The bellmouth guides air smoothly into the compressor, and the gearbox takes power from the engine shaft to drive accessories such as the oil and fuel pumps and the starter.',
        },
        {
          id: '3.2',
          name: 'Center Casing',
          node: 'Center_Casing',
          video: '',
          description:
            'The straight central section of the casing that surrounds the compressor. It contains the high-pressure air and holds the compressor stages in alignment, joining the intake casing at the front to the rear casing behind it.',
        },
        {
          id: '3.3',
          name: 'Exhaust Casing & Piping',
          node: 'Exhaust_Casing_Piping',
          video: '',
          description:
            "The rear casing around the combustor, turbines and exhaust outlet, with its flanged rings and the external pipes and hoses routed around it. It contains the hot gas and directs it out of the engine, while the piping carries oil, fuel and air to the engine's support systems.",
        },
      ],
    },
  ],
}
