// Motor Jet 1.0A — content from Template_Docs_Model_Details.docx.
// Assets live in public/models/catalog/motor-jet/ (model.glb + thumbs/<node>.png).
// `node` is the object name in the GLB; `video` is empty in the doc for now.
export default {
  id: 'motor-jet',
  name: 'Motor Jet 1.0A',
  node: 'MainModel',
  icon: 'engine',
  description:
    'A detailed 3D model of a jet engine, built for interactive exploration. The engine is divided into three main sections that follow the path of the air from front to back: the Fan & Intake Section, the Core Body Section and the Exhaust Section. Select a main hotspot to isolate a section, then select one of its sub hotspots to focus on an individual component.',
  children: [
    {
      id: '1',
      name: 'Fan & Intake Section',
      node: 'Fan_Intake_Section',
      icon: 'fan',
      video: '',
      description:
        'The front of the engine, where air enters. The large fan draws air in and pushes it rearward, producing most of the thrust, while the nose cone and front flange rings guide the airflow and hold the fan assembly in place.',
      children: [
        {
          id: '1.1',
          name: 'Fan Blades',
          node: 'Fan_Blades',
          video: '',
          description:
            'The ring of wide blades at the front of the engine. As the fan spins, the blades draw in large volumes of air: most of it flows around the core to produce thrust, and the rest is fed into the compressor.',
        },
        {
          id: '1.2',
          name: 'Nose Cone (Spinner)',
          node: 'Nose_Cone',
          video: '',
          description:
            'The pointed, polished cone at the centre of the fan. It guides incoming air smoothly around the fan hub to reduce turbulence and drag, and covers the hub and its fixings.',
        },
        {
          id: '1.3',
          name: 'Front Flange Rings',
          node: 'Front_Flange_Rings',
          video: '',
          description:
            'The bolted rings around the front of the fan case. They join the fan case to the rest of the engine casing and keep the front assembly rigid and aligned.',
        },
      ],
    },
    {
      id: '2',
      name: 'Core Body Section',
      node: 'Core_Body_Section',
      icon: 'core',
      video: '',
      description:
        'The main body of the engine, which houses the compressor, combustion and turbine stages. Its outer casing contains the high-pressure gas inside, while the external pipes and accessories carry fuel, oil and air and monitor the engine.',
      children: [
        {
          id: '2.1',
          name: 'Outer Casing',
          node: 'Outer_Casing',
          video: '',
          description:
            "The long, tapering shell that encloses the engine's internal stages, with reinforcing flange rings at its joints. It contains the high-pressure gas flow and is the structural backbone that everything else attaches to.",
        },
        {
          id: '2.2',
          name: 'Pipes & Tubing',
          node: 'Pipes_Tubing',
          video: '',
          description:
            'The network of tubes and pipe connectors routed along the outside of the casing. They carry fuel to the combustion chamber, circulate lubricating oil, and bleed off air for cooling and other systems.',
        },
        {
          id: '2.3',
          name: 'Mounts & Accessories',
          node: 'Mounts_Accessories',
          video: '',
          description:
            'The clamps, brackets, fasteners and gold-coloured accessory units fitted to the casing. They hold the pipework securely in place and house the sensors and control units that monitor engine operation.',
        },
      ],
    },
    {
      id: '3',
      name: 'Exhaust Section',
      node: 'Exhaust_Section',
      icon: 'exhaust',
      video: '',
      description:
        'The rear of the engine, where the hot gas leaves after driving the turbine. The parts here extract the last of the energy from the gas and shape the exhaust jet that pushes the engine forward.',
      children: [
        {
          id: '3.1',
          name: 'Exhaust Nozzle',
          node: 'Exhaust_Nozzle',
          video: '',
          description:
            "The ring of overlapping petals that forms the engine's outlet. The petals shape and accelerate the exhaust jet; on variable nozzles they move to change the outlet size for different thrust settings.",
        },
        {
          id: '3.2',
          name: 'Tail Cone',
          node: 'Tail_Cone',
          video: '',
          description:
            'The long, pointed centre body that runs through the exhaust. It shapes the hot gas flow as it leaves the turbine, reducing turbulence so the gas exits smoothly through the nozzle.',
        },
        {
          id: '3.3',
          name: 'Turbine Exhaust Frame',
          node: 'Turbine_Exhaust_Frame',
          video: '',
          description:
            'The bladed turbine disc at the rear of the core and the bolted ring that holds it. The hot gas spins the turbine blades, which drive the fan and compressor, before the gas passes into the exhaust.',
        },
      ],
    },
  ],
};

