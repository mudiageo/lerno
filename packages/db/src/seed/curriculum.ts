/**
 * Lerno Curriculum Seed Script — UNIBEN Computer Engineering (CPE)
 * Based on verified UNIBEN Faculty of Engineering curriculum
 * Course codes sourced from official UNIBEN handbook & flashlearners.com
 *
 * Run: vp run db:seed  (from packages/db)
 */

import 'dotenv/config';
import { db } from '../index';
import { communities, users, userCourses, posts } from '../schema';
import { eq, sql } from 'drizzle-orm';

// ─── UNIBEN CPE Curriculum (verified) ────────────────────────────────────────
const UNIBEN_CPE_COURSES: Array<{
  level: number;
  semester: 'first' | 'second';
  code: string;
  title: string;
  creditUnits: number;
  description: string;
  topics: string[];
}> = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 100 LEVEL — Common to Faculty of Engineering
  // ═══════════════════════════════════════════════════════════════════════════
  {
    level: 100, semester: 'first', code: 'CHM111', title: 'General Chemistry I',
    creditUnits: 3,
    description: 'Atomic structure, chemical bonding, stoichiometry, periodic table and gas laws.',
    topics: ['Atomic structure and electronic configuration', 'Periodic table and trends', 'Chemical bonding (ionic, covalent)', 'Stoichiometry and mole concept', 'Gas laws (Boyle, Charles, Ideal gas)'],
  },
  {
    level: 100, semester: 'first', code: 'CHM113', title: 'Organic Chemistry I',
    creditUnits: 2,
    description: 'Hydrocarbons, functional groups, reactions of organic compounds.',
    topics: ['Hydrocarbons: alkanes, alkenes, alkynes', 'Functional groups', 'Nomenclature (IUPAC)', 'Basic organic reactions'],
  },
  {
    level: 100, semester: 'first', code: 'MTH111', title: 'Algebra and Trigonometry',
    creditUnits: 3,
    description: 'Sets, logic, number systems, polynomials, binomial theorem, trigonometry.',
    topics: ['Sets and logic', 'Number systems', 'Polynomials and rational functions', 'Binomial theorem', 'Trigonometric functions and identities', 'Complex numbers'],
  },
  {
    level: 100, semester: 'first', code: 'MTH112', title: 'Calculus and Real Analysis',
    creditUnits: 3,
    description: 'Limits, continuity, differentiation, integration and applications.',
    topics: ['Limits and continuity', 'Rules of differentiation', 'Applications of derivatives (maxima, minima)', 'Integration techniques', 'Definite integrals and area'],
  },
  {
    level: 100, semester: 'first', code: 'PHY111', title: 'Mechanics, Thermal Physics and Properties of Matter',
    creditUnits: 3,
    description: 'Newtonian mechanics, kinematics, dynamics, thermodynamics fundamentals.',
    topics: ['Vectors and scalars', 'Kinematics (straight-line, projectile)', 'Newton\'s laws of motion', 'Work, energy and power', 'Temperature and heat', 'Thermal expansion', 'Laws of thermodynamics'],
  },
  {
    level: 100, semester: 'first', code: 'PHY113', title: 'Vibration, Waves and Optics',
    creditUnits: 3,
    description: 'Simple harmonic motion, wave motion, sound, geometric and physical optics.',
    topics: ['Simple harmonic motion', 'Wave properties', 'Sound waves and Doppler effect', 'Reflection and refraction', 'Lenses and mirrors', 'Interference and diffraction'],
  },
  {
    level: 100, semester: 'first', code: 'GST111', title: 'Use of English I',
    creditUnits: 2,
    description: 'Grammar, reading comprehension, essay writing, oral communication.',
    topics: ['Grammar and usage', 'Reading comprehension', 'Essay writing', 'Summary writing', 'Oral communication skills'],
  },
  {
    level: 100, semester: 'first', code: 'GST112', title: 'Philosophy and Logic',
    creditUnits: 2,
    description: 'Fundamentals of logic, critical thinking, philosophical reasoning.',
    topics: ['Introduction to philosophy', 'Deductive logic', 'Inductive logic', 'Logical fallacies', 'Critical thinking and argumentation'],
  },
  // 100L Second Semester
  {
    level: 100, semester: 'second', code: 'CHM122', title: 'General Chemistry II',
    creditUnits: 3,
    description: 'Equilibria, electrochemistry, thermodynamics, kinetics.',
    topics: ['Chemical equilibrium and Le Chatelier', 'Acids and bases (pH, buffers)', 'Electrochemistry', 'Chemical kinetics', 'Thermochemistry'],
  },
  {
    level: 100, semester: 'second', code: 'CHM124', title: 'Organic Chemistry II',
    creditUnits: 2,
    description: 'Aromatic compounds, polymers, biomolecules.',
    topics: ['Benzene and aromaticity', 'Aromatic reactions', 'Polymers and plastics', 'Biomolecules (carbohydrates, proteins)'],
  },
  {
    level: 100, semester: 'second', code: 'MTH123', title: 'Vectors, Geometry and Statistics',
    creditUnits: 3,
    description: 'Vectors in 3D, coordinate geometry, basic statistics and probability.',
    topics: ['Vectors in 2D and 3D', 'Dot product and cross product', 'Coordinate geometry (lines, circles, conics)', 'Basic probability', 'Descriptive statistics'],
  },
  {
    level: 100, semester: 'second', code: 'MTH125', title: 'Differential Equations and Dynamics',
    creditUnits: 3,
    description: 'First and second order ODEs, systems of equations, Newton\'s law applications.',
    topics: ['First-order differential equations', 'Second-order linear ODEs', 'Homogeneous and non-homogeneous equations', 'Particle dynamics', 'Simple pendulum and spring systems'],
  },
  {
    level: 100, semester: 'second', code: 'PHY124', title: 'Electromagnetism and Modern Physics',
    creditUnits: 3,
    description: 'Electric fields, magnetic fields, electromagnetic induction, quantum basics.',
    topics: ['Electric field and potential', 'Gauss\'s law', 'Magnetic forces', 'Electromagnetic induction', 'Maxwell\'s equations (intro)', 'Photoelectric effect', 'Atomic spectra'],
  },
  {
    level: 100, semester: 'second', code: 'GST121', title: 'Peace and Conflict Resolution',
    creditUnits: 2,
    description: 'Conflict analysis, negotiation, peacebuilding in Nigerian context.',
    topics: ['Nature of conflict', 'Conflict resolution strategies', 'Negotiation and mediation', 'Nigerian ethnic/religious conflicts', 'Peacebuilding frameworks'],
  },
  {
    level: 100, semester: 'second', code: 'GST122', title: 'Nigerian Peoples and Culture',
    creditUnits: 2,
    description: 'Nigerian history, ethnic groups, cultural practices, national integration.',
    topics: ['Pre-colonial Nigerian history', 'Major ethnic groups', 'Nigerian cultural practices', 'Colonial era and independence', 'National unity challenges'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 200 LEVEL — Common Engineering Foundation
  // ═══════════════════════════════════════════════════════════════════════════
  {
    level: 200, semester: 'first', code: 'EMA281', title: 'Engineering Mathematics I',
    creditUnits: 4,
    description: 'Multivariable calculus, partial derivatives, multiple integrals, Fourier series.',
    topics: ['Partial differentiation', 'Multivariable optimization', 'Double and triple integrals', 'Fourier series', 'Series convergence'],
  },
  {
    level: 200, semester: 'first', code: 'ECP281', title: 'Engineering Computer Programming',
    creditUnits: 3,
    description: 'C programming: data types, control flow, functions, arrays, pointers, files.',
    topics: ['Introduction to C programming', 'Variables and data types', 'Control flow (if, switch, loops)', 'Functions and recursion', 'Arrays and strings', 'Pointers and memory', 'File I/O in C'],
  },
  {
    level: 200, semester: 'first', code: 'ENS211', title: 'Engineering in Society',
    creditUnits: 2,
    description: 'Ethics, professionalism, environmental impact, engineering management.',
    topics: ['Engineering ethics', 'Professional responsibility', 'Environmental impact assessment', 'Health and safety', 'Engineering as a profession in Nigeria'],
  },
  {
    level: 200, semester: 'first', code: 'MEE211', title: 'Engineering Mechanics I (Statics)',
    creditUnits: 3,
    description: 'Equilibrium of particles and rigid bodies, friction, centroids, moments of inertia.',
    topics: ['Force systems', 'Equilibrium of particles', 'Equilibrium of rigid bodies', 'Structural analysis (trusses)', 'Friction', 'Centroids and center of gravity'],
  },
  {
    level: 200, semester: 'first', code: 'MEE221', title: 'Engineering Drawing I',
    creditUnits: 2,
    description: 'Orthographic projections, sectional views, dimensioning, geometric constructions.',
    topics: ['Drawing instruments and standards', 'Geometric constructions', 'Orthographic projection (1st and 3rd angle)', 'Sectional views', 'Dimensioning rules'],
  },
  {
    level: 200, semester: 'first', code: 'EEE211', title: 'Electrical Engineering I',
    creditUnits: 3,
    description: 'DC circuit analysis: Kirchhoff\'s laws, Thevenin, Norton, network theorems.',
    topics: ['Kirchhoff\'s current law (KCL)', 'Kirchhoff\'s voltage law (KVL)', 'Superposition theorem', 'Thevenin\'s theorem', 'Norton\'s theorem', 'Maximum power transfer'],
  },
  {
    level: 200, semester: 'first', code: 'ELA201', title: 'Basic Engineering Laboratory I',
    creditUnits: 1,
    description: 'Laboratory practice: measurements, experiments, technical report writing.',
    topics: ['Laboratory safety', 'Measurement techniques', 'DC circuit experiments', 'Data recording and analysis', 'Technical report writing'],
  },
  // 200L Second Semester
  {
    level: 200, semester: 'second', code: 'EMA282', title: 'Engineering Mathematics II',
    creditUnits: 4,
    description: 'Laplace transforms, Z-transforms, matrices, linear algebra applications.',
    topics: ['Laplace transforms', 'Inverse Laplace transform', 'Z-transform', 'Matrices and determinants', 'Eigenvalues and eigenvectors', 'Linear systems'],
  },
  {
    level: 200, semester: 'second', code: 'MEE212', title: 'Engineering Mechanics II (Dynamics)',
    creditUnits: 3,
    description: 'Kinematics and kinetics of particles and rigid bodies, energy methods.',
    topics: ['Kinematics of particles', 'Newton\'s law in dynamics', 'Work-energy theorem', 'Impulse-momentum', 'Kinematics of rigid bodies', 'Rotation about fixed axis'],
  },
  {
    level: 200, semester: 'second', code: 'MEE222', title: 'Engineering Drawing II',
    creditUnits: 2,
    description: 'Auxiliary views, pictorial drawings, surface development, CAD introduction.',
    topics: ['Auxiliary projections', 'Isometric and oblique drawing', 'Surface development', 'Assembly drawings', 'Introduction to AutoCAD'],
  },
  {
    level: 200, semester: 'second', code: 'EEE212', title: 'Electrical Engineering II',
    creditUnits: 3,
    description: 'AC circuit analysis: phasors, impedance, resonance, power, transformers.',
    topics: ['Sinusoidal signals and phasors', 'Impedance and admittance', 'Series and parallel RLC circuits', 'Resonance', 'AC power analysis', 'Transformer basics'],
  },
  {
    level: 200, semester: 'second', code: 'CHE222', title: 'Material Science',
    creditUnits: 3,
    description: 'Crystal structure, mechanical properties, semiconductors, polymers, composites.',
    topics: ['Crystal structures', 'Mechanical properties of materials', 'Failure and fracture', 'Semiconducting materials', 'Polymer materials', 'Composite materials'],
  },
  {
    level: 200, semester: 'second', code: 'ELA202', title: 'Basic Engineering Laboratory II',
    creditUnits: 1,
    description: 'AC circuits lab, electronics lab, computer programming exercises.',
    topics: ['AC circuit experiments', 'Oscilloscope usage', 'Basic electronics experiments', 'Programming lab exercises', 'Report analysis'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 300 LEVEL — Core Computer Engineering (CPE prefix)
  // ═══════════════════════════════════════════════════════════════════════════
  // 300L First Semester
  {
    level: 300, semester: 'first', code: 'CPE301', title: 'Computer Laboratory I',
    creditUnits: 2,
    description: 'Practical computing: data structures, algorithms, operating system usage.',
    topics: ['Linux command line', 'Python programming exercises', 'Data structure implementations', 'Algorithm coding practice', 'Version control (Git)'],
  },
  {
    level: 300, semester: 'first', code: 'CPE375', title: 'Computer Organization and Architecture',
    creditUnits: 3,
    description: 'CPU organization, ISA, control unit, memory hierarchy, pipelining.',
    topics: ['ISA and instruction formats', 'CPU datapath and control unit', 'RISC vs CISC', 'Memory hierarchy (cache, RAM, virtual)', 'Pipelining principles', 'Performance metrics'],
  },
  {
    level: 300, semester: 'first', code: 'CPE371', title: 'Digital System Design',
    creditUnits: 3,
    description: 'Boolean algebra, combinational logic, MSI/LSI devices, sequential circuits.',
    topics: ['Boolean algebra and theorems', 'Karnaugh maps', 'Combinational circuit design (adders, mux)', 'MSI components (decoders, encoders)', 'Sequential logic: flip-flops', 'Counters and registers', 'Finite state machines'],
  },
  {
    level: 300, semester: 'first', code: 'CPE311', title: 'Circuit Theory I',
    creditUnits: 3,
    description: 'Advanced circuit analysis: mesh, nodal, two-port networks, Laplace in circuits.',
    topics: ['Mesh analysis', 'Nodal analysis', 'Two-port network parameters (Z, Y, h, ABCD)', 'Laplace transform in circuit analysis', 'Network functions and poles/zeros', 'Frequency response'],
  },
  {
    level: 300, semester: 'first', code: 'CPE351', title: 'Communication Principles',
    creditUnits: 3,
    description: 'Amplitude, frequency and phase modulation; digital comms fundamentals.',
    topics: ['AM modulation and demodulation', 'FM modulation', 'Angle modulation', 'Sampling theorem', 'PCM and quantization', 'Digital modulation (ASK, FSK, PSK, QAM)', 'Noise and signal-to-noise ratio'],
  },
  {
    level: 300, semester: 'first', code: 'CPE381', title: 'Engineering Mathematics III',
    creditUnits: 4,
    description: 'Probability and statistics, random variables, stochastic processes.',
    topics: ['Probability axioms', 'Conditional probability and Bayes theorem', 'Random variables (discrete, continuous)', 'Common distributions (Gaussian, Poisson, Binomial)', 'Statistical inference', 'Stochastic processes intro'],
  },
  {
    level: 300, semester: 'first', code: 'CPE313', title: 'Measurement and Instrumentation',
    creditUnits: 3,
    description: 'Sensors, transducers, signal conditioning, data acquisition, calibration.',
    topics: ['Measurement systems and errors', 'Transducers (temperature, pressure, displacement)', 'Signal conditioning circuits', 'A/D and D/A conversion', 'Data acquisition systems', 'Calibration methods'],
  },
  // 300L Second Semester
  {
    level: 300, semester: 'second', code: 'CPE314', title: 'Electromagnetic Fields and Waves',
    creditUnits: 3,
    description: 'Vector calculus, Maxwell\'s equations, transmission lines, antennas.',
    topics: ['Vector calculus (gradient, divergence, curl)', 'Electrostatics and Gauss\'s law', 'Magnetostatics and Ampere\'s law', 'Faraday\'s law and induction', 'Maxwell\'s equations', 'Transmission line theory', 'Antenna fundamentals'],
  },
  {
    level: 300, semester: 'second', code: 'CPE302', title: 'Computer Laboratory II',
    creditUnits: 2,
    description: 'Advanced programming lab: databases, web development, embedded systems.',
    topics: ['Database programming (SQL)', 'Web development basics', 'Embedded system programming (Arduino/ARM)', 'Networking lab', 'Simulation tools'],
  },
  {
    level: 300, semester: 'second', code: 'CPE372', title: 'Digital Electronic Circuits',
    creditUnits: 3,
    description: 'Logic families (TTL, CMOS), semiconductor memories, ADC/DAC, PLDs.',
    topics: ['Logic families: TTL and CMOS', 'Fan-out and noise margins', 'Semiconductor memories (ROM, RAM, Flash)', 'ADC and DAC circuits', 'Programmable logic devices (PAL, PLA, CPLD, FPGA)', 'Power dissipation in digital circuits'],
  },
  {
    level: 300, semester: 'second', code: 'CPE304', title: 'Engineering Communication',
    creditUnits: 2,
    description: 'Technical writing, oral presentation, project reports, proposal writing.',
    topics: ['Technical report writing', 'Proposal writing', 'Oral presentation skills', 'Academic paper structure', 'Professional correspondence'],
  },
  {
    level: 300, semester: 'second', code: 'CPE378', title: 'Software Engineering I',
    creditUnits: 3,
    description: 'SDLC models, requirements engineering, UML, design patterns, testing.',
    topics: ['Software development lifecycle (Waterfall, Agile, Scrum)', 'Requirements engineering', 'UML diagrams (use case, class, sequence)', 'Software design principles (SOLID)', 'Design patterns (Singleton, Factory, Observer)', 'Software testing strategies'],
  },
  {
    level: 300, semester: 'second', code: 'CPE382', title: 'Engineering Mathematics IV',
    creditUnits: 4,
    description: 'Numerical analysis, optimization, differential equations for engineering.',
    topics: ['Numerical differentiation and integration', 'Root finding (Newton-Raphson, bisection)', 'Numerical solution of ODEs (Euler, Runge-Kutta)', 'Optimization methods', 'Finite difference methods'],
  },
  {
    level: 300, semester: 'second', code: 'CPE324', title: 'Operating Systems',
    creditUnits: 3,
    description: 'Process management, memory management, file systems, concurrency, Linux.',
    topics: ['Process scheduling algorithms (FCFS, SJF, Round Robin)', 'Deadlock detection and prevention', 'Memory management and virtual memory', 'Paging and segmentation', 'File system structure', 'Synchronization (mutex, semaphores)', 'Linux kernel basics'],
  },
  {
    level: 300, semester: 'second', code: 'CPE321', title: 'Programming Languages II',
    creditUnits: 3,
    description: 'Object-oriented programming, Java/C++, data structures, generic programming.',
    topics: ['OOP principles (encapsulation, inheritance, polymorphism)', 'Java and C++ comparison', 'Generic programming (templates)', 'Exception handling', 'Advanced data structures (trees, graphs)', 'Standard library usage'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 400 LEVEL — Specialization
  // ═══════════════════════════════════════════════════════════════════════════
  {
    level: 400, semester: 'first', code: 'CPE477', title: 'Computer Software Engineering',
    creditUnits: 3,
    description: 'Advanced software engineering: architecture, DevOps, microservices, cloud.',
    topics: ['Software architecture patterns (MVC, microservices)', 'CI/CD pipelines', 'Cloud deployment', 'Software metrics and quality', 'Agile at scale', 'Code review and technical debt'],
  },
  {
    level: 400, semester: 'first', code: 'CPE401', title: 'Computer Laboratory III',
    creditUnits: 2,
    description: 'Advanced hardware and software integration, FPGA programming, networking lab.',
    topics: ['FPGA design with VHDL/Verilog', 'Networking lab (packet analysis)', 'Microcontroller interfacing projects', 'Signal processing lab', 'Technical documentation'],
  },
  {
    level: 400, semester: 'first', code: 'CPE475', title: 'Microprocessor Systems and Interfacing',
    creditUnits: 3,
    description: 'x86 and ARM architecture, assembly, peripherals, real-time OS.',
    topics: ['x86 architecture and assembly language', 'ARM Cortex-M architecture', 'Memory-mapped I/O', 'Interrupt handling', 'UART, SPI, I2C interfaces', 'Real-time OS (FreeRTOS)', 'Embedded debugging techniques'],
  },
  {
    level: 400, semester: 'first', code: 'CPE473', title: 'Data Communication and Networks',
    creditUnits: 3,
    description: 'OSI model, TCP/IP, routing, switching, network security, wireless.',
    topics: ['OSI model layers', 'TCP/IP protocol suite', 'IP addressing (IPv4, IPv6)', 'Routing algorithms (RIP, OSPF, BGP)', 'Ethernet and switching', 'Wireless networks (Wi-Fi, LTE)', 'Network security (firewalls, VPN, TLS)'],
  },
  {
    level: 400, semester: 'first', code: 'CPE457', title: 'Assembly Language Programming',
    creditUnits: 3,
    description: 'Low-level programming: x86 assembly, MIPS, memory access, optimization.',
    topics: ['x86 instruction set', 'Registers and memory addressing modes', 'MIPS assembly language', 'Stack and procedure calls', 'I/O programming', 'Assembly optimization techniques'],
  },
  {
    level: 400, semester: 'first', code: 'CPE479', title: 'Prototyping Techniques',
    creditUnits: 3,
    description: 'Rapid prototyping: PCB design, 3D printing, IoT prototyping, simulation.',
    topics: ['PCB design with KiCad/Altium', '3D printing for electronics enclosures', 'IoT prototyping (Raspberry Pi, Arduino)', 'System simulation tools', 'Prototype testing and iteration'],
  },
  {
    level: 400, semester: 'first', code: 'CPE451', title: 'Control Systems',
    creditUnits: 3,
    description: 'Open/closed-loop control, stability analysis, PID controllers, digital control.',
    topics: ['Open-loop vs closed-loop systems', 'Transfer functions and block diagrams', 'Stability: Routh-Hurwitz criterion', 'Root locus analysis', 'Frequency domain: Bode plots and Nyquist', 'PID controller design', 'Digital control systems'],
  },
  // 400L Second — SIWES (industrial attachment)
  {
    level: 400, semester: 'second', code: 'UBT400', title: 'SIWES III (Industrial Training)',
    creditUnits: 6,
    description: '6-month Student Industrial Work Experience Scheme — real-world engineering exposure.',
    topics: ['Industrial orientation', 'Technical skills in industry', 'Engineering practice', 'SIWES logbook and report', 'Oral defense'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 500 LEVEL — Final Year
  // ═══════════════════════════════════════════════════════════════════════════
  {
    level: 500, semester: 'first', code: 'CPE501', title: 'Project and Thesis I',
    creditUnits: 3,
    description: 'Project proposal, literature review, system analysis and design.',
    topics: ['Research methodology', 'Literature review techniques', 'Problem statement formulation', 'System analysis (requirements gathering)', 'Architecture and design', 'Project planning (Gantt chart, milestones)'],
  },
  {
    level: 500, semester: 'first', code: 'CPE515', title: 'Computer Security Techniques I',
    creditUnits: 3,
    description: 'Cryptography, network security, ethical hacking, security protocols.',
    topics: ['Symmetric encryption (AES, DES)', 'Asymmetric encryption (RSA, ECC)', 'Hash functions (SHA-256)', 'Digital signatures and certificates', 'TLS/SSL protocol', 'Network attacks (SQL injection, XSS, MITM)', 'Ethical hacking basics'],
  },
  {
    level: 500, semester: 'first', code: 'CPE573', title: 'Artificial Neural Networks',
    creditUnits: 3,
    description: 'Neural network architectures, training algorithms, CNNs, RNNs, transformers.',
    topics: ['Perceptron and MLP', 'Backpropagation algorithm', 'Convolutional neural networks (CNNs)', 'Recurrent neural networks (RNNs/LSTMs)', 'Transformers and attention mechanism', 'Training tricks (dropout, batch norm)', 'practical frameworks (PyTorch/TensorFlow)'],
  },
  {
    level: 500, semester: 'first', code: 'CPE591', title: 'Reliability and Maintainability',
    creditUnits: 3,
    description: 'System reliability models, failure analysis, FMEA, maintenance planning.',
    topics: ['Reliability fundamentals', 'Failure rate and MTTF', 'Reliability block diagrams', 'FMEA and fault tree analysis', 'System redundancy', 'Software reliability', 'Maintenance strategies'],
  },
  {
    level: 500, semester: 'first', code: 'CPE575', title: 'Microprogramming',
    creditUnits: 3,
    description: 'Microinstruction design, control store, horizontal vs vertical microprogramming.',
    topics: ['Microprogramming concepts', 'Microinstruction formats', 'Control store organization', 'Horizontal vs vertical microprogramming', 'Nanoprogramming', 'Microprogrammed control unit design'],
  },
  {
    level: 500, semester: 'first', code: 'CPE571', title: 'Digital Computer Networks',
    creditUnits: 3,
    description: 'Advanced networking: SDN, network virtualization, cloud networking, 5G.',
    topics: ['Software-defined networking (SDN)', 'Network function virtualization (NFV)', 'Cloud networking (AWS VPC, Azure)', '5G architecture', 'Network performance analysis', 'QoS and traffic shaping'],
  },
  {
    level: 500, semester: 'first', code: 'CPE513', title: 'Cyberpreneurship and Cyber Law',
    creditUnits: 2,
    description: 'Tech entrepreneurship, startup ecosystem, IP law, NDPR/GDPR, cyber law.',
    topics: ['Tech startup fundamentals', 'Business plan for tech companies', 'Intellectual property for software', 'Nigerian Data Protection Regulation (NDPR)', 'GDPR overview', 'Cyber crime and legal frameworks', 'Funding and venture capital'],
  },
  {
    level: 500, semester: 'first', code: 'CPE504', title: 'Engineering Law',
    creditUnits: 2,
    description: 'Nigerian engineering regulations, COREN, contracts, liability, patents.',
    topics: ['COREN and engineering practice law', 'Contract law for engineers', 'Professional liability', 'Patent law basics', 'Environmental law for engineers', 'Dispute resolution'],
  },
  // 500L Second Semester
  {
    level: 500, semester: 'second', code: 'CPE502', title: 'Project and Thesis II',
    creditUnits: 6,
    description: 'System implementation, testing, documentation, final presentation and defense.',
    topics: ['System implementation', 'Software/hardware testing and validation', 'Performance evaluation', 'Technical report writing (IEEE format)', 'Oral presentation and defense', 'Research paper writing'],
  },
  {
    level: 500, semester: 'second', code: 'CPE512', title: 'Digital Signal Processing',
    creditUnits: 3,
    description: 'DFT, FFT, FIR/IIR filter design, spectral analysis, DSP applications.',
    topics: ['Discrete Fourier Transform (DFT)', 'Fast Fourier Transform (FFT)', 'FIR filter design (window method)', 'IIR filter design (Butterworth, Chebyshev)', 'Spectral analysis', 'DSP applications in audio and communications'],
  },
  {
    level: 500, semester: 'second', code: 'CPE522', title: 'Digital System Design with VHDL',
    creditUnits: 3,
    description: 'Hardware description language, FPGA synthesis, state machines in VHDL.',
    topics: ['VHDL syntax and semantics', 'Combinational circuit design in VHDL', 'Sequential circuit design in VHDL', 'Testbench writing', 'FPGA synthesis flow', 'Complex state machines in VHDL'],
  },
  {
    level: 500, semester: 'second', code: 'CPE556', title: 'Computer Graphics',
    creditUnits: 3,
    description: 'Graphics pipeline, OpenGL, transformations, shading, rendering algorithms.',
    topics: ['Graphics pipeline overview', '2D and 3D transformations', 'Viewing and projection', 'Rasterization and clipping', 'OpenGL programming', 'Shading models (Phong, Gouraud)', 'Ray tracing basics'],
  },
];

// ─── Community seeds ──────────────────────────────────────────────────────────
const COMMUNITY_SEEDS = [
  {
    slug: 'uniben-computer-engineering',
    name: 'UNIBEN Computer Engineering',
    description: 'Official study community for CPE students at the University of Benin. Share notes, ask questions, get exam help for all levels 100–500L.',
    courseCode: 'CPE',
    isPrivate: false,
  },
  {
    slug: 'waec-candidates-2025',
    name: 'WAEC 2025 Candidates',
    description: 'Prepare for WAEC together — past questions, subject tips, timetable updates, and moral support!',
    courseCode: 'WAEC',
    isPrivate: false,
  },
  {
    slug: 'jamb-utme-prep',
    name: 'JAMB UTME Preparation',
    description: 'All things JAMB: CBT practice, past questions (2010–2024), score predictions, and registration updates.',
    courseCode: 'JAMB',
    isPrivate: false,
  },
  {
    slug: 'uniben-eee-students',
    name: 'UNIBEN EEE Students',
    description: 'Electrical/Electronic Engineering community at UNIBEN. Course notes, lab reports, exam prep.',
    courseCode: 'EEE',
    isPrivate: false,
  },
  {
    slug: 'nigerian-engineering-students',
    name: 'Nigerian Engineering Students',
    description: 'A pan-university community for engineering students across Nigeria. Network, collaborate, and study together.',
    courseCode: undefined,
    isPrivate: false,
  },
];

// ─── Main seeder ──────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting Lerno curriculum seed (UNIBEN CPE — verified)...');

  // 1. Ensure AI system user exists
  let [aiUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'ai@lerno.app'))
    .limit(1);

  if (!aiUser) {
    const [created] = await db
      .insert(users)
      .values({
        name: 'Lerno AI',
        email: 'ai@lerno.app',
        emailVerified: true,
        username: 'lerno_ai',
        role: 'user',
        image: null,
      } as any)
      .returning({ id: users.id });
    aiUser = created;
    console.log('✅ Created system AI user: ai@lerno.app');
  } else {
    console.log('ℹ️  AI user already exists');
  }

  // 2. Seed communities
  for (const comm of COMMUNITY_SEEDS) {
    const existing = await db
      .select({ id: communities.id })
      .from(communities)
      .where(eq(communities.slug, comm.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`ℹ️  Community "${comm.name}" already exists`);
      continue;
    }

    await db.insert(communities).values({
      ...comm,
      memberCount: 0,
      createdBy: aiUser.id,
    });
    console.log(`✅ Created community: ${comm.name}`);
  }

  // 3. Seed CPE courses and AI flashcard posts
  let seededCourses = 0;
  let seededPosts = 0;

  for (const course of UNIBEN_CPE_COURSES) {
    const existing = await db
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(eq(userCourses.code, course.code))
      .limit(1);

    let courseId: string;
    if (existing.length > 0) {
      courseId = existing[0].id;
      console.log(`ℹ️  Course ${course.code} already seeded`);
    } else {
      const [created] = await db
        .insert(userCourses)
        .values({
          userId: aiUser.id,
          code: course.code,
          title: course.title,
          description: course.description,
          semester: course.semester as any,
          year: course.level,
          creditUnits: course.creditUnits,
          active: true,
        })
        .returning({ id: userCourses.id });

      courseId = created.id;
      seededCourses++;
    }

    // Seed one flashcard post per topic (first 5 topics)
    for (const topic of course.topics.slice(0, 5)) {
      const [existingPost] = await db
        .select({ id: posts.id })
        .from(posts)
        .where(sql`post_type = 'flashcard' AND content->>'front' = ${topic} AND content->>'courseCode' = ${course.code}`)
        .limit(1);

      if (existingPost) continue;

      await db.insert(posts).values({
        postType: 'flashcard',
        authorId: aiUser.id,
        courseId,
        aiGenerated: true,
        isVisible: true,
        topicTags: [course.code, `${course.level}L`, 'UNIBEN', 'CPE'],
        content: {
          front: topic,
          back: `This is a key topic in ${course.title} (${course.code}). Understanding "${topic}" is essential for ${course.level}L Computer Engineering students at UNIBEN.`,
          courseCode: course.code,
          courseTitle: course.title,
          level: course.level,
          university: 'UNIBEN',
          department: 'Computer Engineering',
        },
      });

      seededPosts++;
    }
  }

  console.log(`\n✅ Seeded ${seededCourses} courses`);
  console.log(`✅ Seeded ${seededPosts} AI flashcard posts`);
  console.log(`\n🎉 Seed complete! Run 'npx drizzle-kit push' first if tables are missing.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
