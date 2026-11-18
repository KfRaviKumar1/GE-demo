// Jet Engine S00564 1.0A — content from JetEngine_Three.docx.
// Assets live in public/models/catalog/jet-engine-s00564/ (model.glb + thumbs/<node>.png).
// Source GLB per the doc: JetEngineExplode.glb (root node: MainModel).
// `node` is the object name in the GLB; `video` is empty in the doc for now.
// `explode.clip` names the GLB animation the Explode slider scrubs through on
// the full-model page (0 = compact, 100 = fully exploded).
export default {
  id: 'jet-engine-s00564',
  name: 'Jet Engine S00564 1.0A',
  node: 'MainModel',
  icon: 'engine',
  displayModes: ['opaque', 'transparent'],
  explode: { clip: 'Explode' },
  description:
    'A 3D model of a turbofan-style jet engine mounted on a steel support stand. The engine is divided into three main sections: the Intake & Fan Section, the Core Section, and the Turbine, Exhaust & Stand Section. Play the Explode animation to separate the engine into its nine components along its length, and the Assemble animation to put it back together. Select a main hotspot to isolate a section, then select one of its sub hotspots to focus on an individual component.',
  children: [
    {
      id: '1',
      name: 'Intake & Fan Section',
      node: 'Intake_Fan_Section',
      icon: 'fan',
      video: '',
      description:
        'The front of the engine, where air enters. The polished intake cowl channels air onto the large fan, while the nose spinner at the centre guides the flow smoothly around the fan hub.',
      children: [
        {
          id: '1.1',
          name: 'Nose Spinner',
          node: 'Nose_Spinner',
          video: '',
          description:
            'The pointed cone at the centre of the fan. It guides incoming air smoothly around the fan hub, reducing turbulence, and covers the hub fixings.',
        },
        {
          id: '1.2',
          name: 'Fan Blades',
          node: 'Fan_Blades',
          video: '',
          description:
            "The ring of curved fan blades at the front of the engine, together with the fan disc behind them. As the fan spins it draws in large volumes of air, producing most of the engine's thrust and feeding air into the core.",
        },
        {
          id: '1.3',
          name: 'Intake Cowl',
          node: 'Intake_Cowl',
          video: '',
          description:
            'The polished, rounded inlet ring around the fan. Its smooth lip guides air evenly into the fan and protects the fan blades, and its outer panels carry access latches.',
        },
      ],
    },
    {
      id: '2',
      name: 'Core Section',
      node: 'Core_Section',
      icon: 'core',
      video: '',
      description:
        'The middle of the engine, where air is compressed, mixed with fuel and burned. Its banded casings are wrapped in pipes, brackets and access panels that carry fuel, oil and air and allow inspection.',
      children: [
        {
          id: '2.1',
          name: 'Compressor Casing',
          node: 'Compressor_Casing',
          video: '',
          description:
            'The casing ring directly behind the fan that encloses the compressor stages. It contains the air as it is squeezed to high pressure, and its flanges join the intake section to the core.',
        },
        {
          id: '2.2',
          name: 'Core Access Panels',
          node: 'Core_Access_Panels',
          video: '',
          description:
            'The polished band of removable panels around the middle of the engine. The panels and inspection hatches give technicians access to the internal stages for maintenance.',
        },
        {
          id: '2.3',
          name: 'Combustor Casing & Piping',
          node: 'Combustor_Casing',
          video: '',
          description:
            'The casing around the combustion section, surrounded by fuel and oil lines, brackets and viewing windows. Inside, fuel is burned with the compressed air to produce the hot, high-pressure gas that drives the turbines.',
        },
      ],
    },
    {
      id: '3',
      name: 'Turbine, Exhaust & Stand Section',
      node: 'Rear_Support_Section',
      icon: 'exhaust',
      video: '',
      description:
        'The rear of the engine and its support. The turbine casing and exhaust nozzle handle the hot gas as it leaves the engine, and the steel stand holds the whole engine securely in place.',
      children: [
        {
          id: '3.1',
          name: 'Turbine Casing',
          node: 'Turbine_Casing',
          video: '',
          description:
            'The lattice-reinforced casing around the turbine stages. It contains the hot gas as it spins the turbines, which in turn drive the fan and compressor.',
        },
        {
          id: '3.2',
          name: 'Exhaust Nozzle',
          node: 'Exhaust_Nozzle',
          video: '',
          description:
            'The tapered rear cone where the hot gas leaves the engine. Its narrowing shape accelerates the exhaust into a high-speed jet, and the ribbed bands strengthen it against heat and pressure.',
        },
        {
          id: '3.3',
          name: 'Support Stand',
          node: 'Support_Stand',
          video: '',
          description:
            'The steel frame that cradles the engine. Its two curved cradles and wide base hold the engine level and stable for display, transport and maintenance.',
        },
      ],
    },
  ],
}
