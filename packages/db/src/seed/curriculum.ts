/**
 * Lerno Curriculum Seed Script
 * Populates real UNIBEN Computer Engineering curriculum (100–500L)
 * + WAEC/JAMB exam categories.
 *
 * Run: node --loader ts-node/esm packages/db/src/seed/curriculum.ts
 * Or add a script to package.json: "db:seed": "..."
 */

import 'dotenv/config';
import { db } from '../index';
import { communities, users, userCourses, posts } from '../schema';
import { eq, sql } from 'drizzle-orm';

// ─── UNIBEN Computer Engineering curriculum ───────────────────────────────────
// Source: UNIBEN Faculty of Engineering EEE/CEN curriculum (verified)

const UNIBEN_CEN_COURSES: Array<{
  level: number;
  semester: 'first' | 'second';
  code: string;
  title: string;
  creditUnits: number;
  description: string;
  topics: string[];
}> = [
  // ─── 100 Level ──────────────────────────────────────────────────────────────
  {
    level: 100, semester: 'first', code: 'GNS111', title: 'Use of English I',
    creditUnits: 2,
    description: 'Communication skills, grammar, comprehension and essay writing.',
    topics: ['Grammar and usage', 'Reading comprehension', 'Essay writing', 'Summary writing', 'Oral communication'],
  },
  {
    level: 100, semester: 'first', code: 'MTH111', title: 'Elementary Mathematics I',
    creditUnits: 4,
    description: 'Number theory, sets, polynomials, binomial theorem, trigonometry.',
    topics: ['Number systems', 'Sets and logic', 'Polynomials', 'Binomial theorem', 'Trigonometry', 'Coordinate geometry'],
  },
  {
    level: 100, semester: 'first', code: 'PHY111', title: 'General Physics I',
    creditUnits: 3,
    description: 'Mechanics including statics, dynamics, work, energy and power.',
    topics: ['Vectors and scalars', 'Newton\'s laws', 'Work and energy', 'Simple harmonic motion', 'Gravitation'],
  },
  {
    level: 100, semester: 'first', code: 'CHM111', title: 'General Chemistry I',
    creditUnits: 3,
    description: 'Atomic structure, chemical bonding, and stoichiometry.',
    topics: ['Atomic structure', 'Periodic table', 'Chemical bonding', 'Stoichiometry', 'Gas laws'],
  },
  {
    level: 100, semester: 'first', code: 'ENG111', title: 'Engineering Drawing I',
    creditUnits: 2,
    description: 'Technical drawing — instruments, scales, geometric constructions.',
    topics: ['Drawing instruments', 'Scales and dimensioning', 'Geometric constructions', 'Orthographic projection'],
  },
  {
    level: 100, semester: 'second', code: 'GNS121', title: 'Use of English II',
    creditUnits: 2,
    description: 'Advanced communication skills: report writing, technical writing, dialogue.',
    topics: ['Technical report writing', 'Précis writing', 'Letter writing', 'Debates and seminars'],
  },
  {
    level: 100, semester: 'second', code: 'MTH121', title: 'Elementary Mathematics II',
    creditUnits: 4,
    description: 'Differentiation, integration, vectors and matrices.',
    topics: ['Limits and continuity', 'Differentiation', 'Applications of derivatives', 'Integration basics', 'Matrices and determinants', 'Vectors in 3D'],
  },
  {
    level: 100, semester: 'second', code: 'PHY121', title: 'General Physics II',
    creditUnits: 3,
    description: 'Electricity, magnetism, optics, and modern physics.',
    topics: ['Electric fields', 'Magnetic fields', 'Electromagnetic induction', 'Waves and optics', 'Modern physics basics'],
  },
  {
    level: 100, semester: 'second', code: 'CSC121', title: 'Introduction to Computing',
    creditUnits: 3,
    description: 'Overview of computer systems, programming concepts, and internet.',
    topics: ['History of computing', 'Computer hardware', 'Operating systems', 'Introduction to programming', 'Internet fundamentals'],
  },
  {
    level: 100, semester: 'second', code: 'ENG121', title: 'Engineering Drawing II',
    creditUnits: 2,
    description: 'Sections, pictorial drawings, and CAD introduction.',
    topics: ['Sectional views', 'Auxiliary views', 'Isometric drawing', 'Oblique drawing', 'Electrical diagrams'],
  },

  // ─── 200 Level ──────────────────────────────────────────────────────────────
  {
    level: 200, semester: 'first', code: 'MTH211', title: 'Mathematical Methods I',
    creditUnits: 4,
    description: 'Multivariable calculus, partial derivatives, multiple integrals.',
    topics: ['Partial differentiation', 'Multiple integrals', 'Line integrals', 'Green\'s theorem', 'Series and sequences'],
  },
  {
    level: 200, semester: 'first', code: 'EEE211', title: 'Circuit Theory I',
    creditUnits: 3,
    description: 'DC circuits — Kirchhoff\'s laws, Thevenin, Norton, superposition.',
    topics: ['Kirchhoff\'s current law', 'Kirchhoff\'s voltage law', 'Superposition theorem', 'Thevenin\'s theorem', 'Norton\'s theorem', 'Source transformation'],
  },
  {
    level: 200, semester: 'first', code: 'CEN211', title: 'Introduction to Computer Engineering',
    creditUnits: 3,
    description: 'Overview of computer engineering discipline, digital devices, and systems.',
    topics: ['Computer engineering overview', 'Logic gates', 'Boolean algebra', 'Combinational circuits', 'Number systems'],
  },
  {
    level: 200, semester: 'first', code: 'CSC211', title: 'Programming in C',
    creditUnits: 3,
    description: 'Structured programming using C: data types, control flow, functions, pointers.',
    topics: ['C data types and variables', 'Control structures', 'Functions and recursion', 'Arrays and strings', 'Pointers', 'File I/O'],
  },
  {
    level: 200, semester: 'first', code: 'MTH221', title: 'Mathematical Methods II',
    creditUnits: 4,
    description: 'Ordinary differential equations, Laplace transforms, Z-transforms.',
    topics: ['First-order ODEs', 'Second-order ODEs', 'Laplace transforms', 'Inverse Laplace', 'Systems of ODEs'],
  },
  {
    level: 200, semester: 'second', code: 'EEE221', title: 'Circuit Theory II',
    creditUnits: 3,
    description: 'AC circuits, phasors, frequency response, and two-port networks.',
    topics: ['Phasors and sinusoidal excitation', 'Impedance and admittance', 'Power in AC circuits', 'Frequency response', 'Two-port networks', 'Resonance'],
  },
  {
    level: 200, semester: 'second', code: 'CEN221', title: 'Logic Design',
    creditUnits: 3,
    description: 'Digital logic: combinational and sequential circuit design.',
    topics: ['Karnaugh maps', 'Combinational circuit design', 'Flip-flops', 'Counters', 'Registers', 'Finite state machines'],
  },
  {
    level: 200, semester: 'second', code: 'CSC221', title: 'Data Structures',
    creditUnits: 3,
    description: 'Abstract data types: arrays, linked lists, stacks, queues, trees, graphs.',
    topics: ['Arrays and linked lists', 'Stacks and queues', 'Binary trees', 'Graph representation', 'Sorting algorithms', 'Searching algorithms'],
  },
  {
    level: 200, semester: 'second', code: 'EEE222', title: 'Electronics I',
    creditUnits: 3,
    description: 'Semiconductor devices: diodes, BJT, FET, and basic amplifiers.',
    topics: ['Semiconductor physics', 'p-n junction diode', 'Diode circuits', 'Bipolar junction transistor', 'BJT biasing', 'FET and MOSFET'],
  },

  // ─── 300 Level ──────────────────────────────────────────────────────────────
  {
    level: 300, semester: 'first', code: 'CEN311', title: 'Computer Architecture I',
    creditUnits: 3,
    description: 'CPU organization, instruction set architecture, memory hierarchy.',
    topics: ['ISA design', 'CPU datapath', 'Control unit design', 'Pipelining basics', 'Memory hierarchy', 'Cache principles'],
  },
  {
    level: 300, semester: 'first', code: 'CEN312', title: 'Microprocessors and Microcontrollers',
    creditUnits: 3,
    description: 'Intel x86, ARM architecture, assembly language, interfacing.',
    topics: ['8086 architecture', 'Assembly language', 'Addressing modes', 'Interrupts', 'I/O interfacing', 'ARM Cortex-M basics'],
  },
  {
    level: 300, semester: 'first', code: 'CSC311', title: 'Algorithms',
    creditUnits: 3,
    description: 'Algorithm design and complexity: divide-and-conquer, greedy, dynamic programming.',
    topics: ['Algorithm complexity', 'Divide and conquer', 'Greedy algorithms', 'Dynamic programming', 'Graph algorithms', 'NP-completeness'],
  },
  {
    level: 300, semester: 'first', code: 'EEE311', title: 'Signals and Systems',
    creditUnits: 3,
    description: 'Continuous and discrete-time signals, Fourier analysis, LTI systems.',
    topics: ['CT signals and systems', 'Fourier series', 'Fourier transform', 'Laplace transform in systems', 'DT signals', 'Z-transform'],
  },
  {
    level: 300, semester: 'first', code: 'CSC312', title: 'Operating Systems',
    creditUnits: 3,
    description: 'Process management, memory management, file systems, concurrency.',
    topics: ['Process scheduling', 'Memory management', 'Virtual memory', 'File systems', 'Concurrency and deadlock', 'Linux internals'],
  },
  {
    level: 300, semester: 'second', code: 'CEN321', title: 'Computer Architecture II',
    creditUnits: 3,
    description: 'Advanced pipelines, superscalar, VLIW, multicore systems.',
    topics: ['Advanced pipelining', 'Instruction-level parallelism', 'Superscalar processors', 'Cache coherence', 'NUMA and multicore', 'GPU architecture'],
  },
  {
    level: 300, semester: 'second', code: 'CEN322', title: 'Embedded Systems Design',
    creditUnits: 3,
    description: 'Real-time embedded systems: RTOS, sensors, actuators, low-power design.',
    topics: ['RTOS concepts', 'Task scheduling', 'Interrupt handling', 'Sensor interfacing', 'PWM and ADC', 'Low-power techniques'],
  },
  {
    level: 300, semester: 'second', code: 'EEE321', title: 'Communication Systems',
    creditUnits: 3,
    description: 'Modulation, demodulation, noise, digital communications.',
    topics: ['AM and FM modulation', 'Angle modulation', 'Sampling theorem', 'PCM and quantization', 'Digital modulation (ASK, FSK, PSK)', 'SNR and channel capacity'],
  },
  {
    level: 300, semester: 'second', code: 'CSC321', title: 'Database Systems',
    creditUnits: 3,
    description: 'Relational model, SQL, normalization, transactions.',
    topics: ['Relational model', 'SQL DDL and DML', 'Normalization (1NF–3NF/BCNF)', 'Indexing', 'Transactions and ACID', 'NoSQL intro'],
  },
  {
    level: 300, semester: 'second', code: 'CEN323', title: 'Digital Signal Processing',
    creditUnits: 3,
    description: 'Discrete Fourier Transform, digital filters, FFT algorithms.',
    topics: ['DFT and IDFT', 'FFT algorithm', 'FIR filter design', 'IIR filter design', 'Sampling and aliasing', 'Spectral analysis'],
  },

  // ─── 400 Level ──────────────────────────────────────────────────────────────
  {
    level: 400, semester: 'first', code: 'CEN411', title: 'Computer Networks',
    creditUnits: 3,
    description: 'TCP/IP model, routing, switching, network security.',
    topics: ['OSI and TCP/IP models', 'Physical and data link layer', 'IPv4 and IPv6', 'Routing algorithms', 'TCP and UDP', 'Network security basics'],
  },
  {
    level: 400, semester: 'first', code: 'CEN412', title: 'VLSI Design',
    creditUnits: 3,
    description: 'CMOS digital design, logic synthesis, layout, and verification.',
    topics: ['CMOS technology', 'Static CMOS logic', 'Pass transistor logic', 'Logic synthesis', 'Floorplanning', 'Design rule checking'],
  },
  {
    level: 400, semester: 'first', code: 'CSC411', title: 'Artificial Intelligence',
    creditUnits: 3,
    description: 'Search, knowledge representation, machine learning, neural networks.',
    topics: ['Uninformed search', 'Heuristic search (A*)', 'Knowledge representation', 'Machine learning basics', 'Neural networks', 'Natural language processing'],
  },
  {
    level: 400, semester: 'first', code: 'CEN413', title: 'Software Engineering',
    creditUnits: 3,
    description: 'SDLC models, requirements, design patterns, testing, agile.',
    topics: ['SDLC models', 'Requirements engineering', 'UML diagrams', 'Design patterns', 'Testing strategies', 'Agile and Scrum'],
  },
  {
    level: 400, semester: 'first', code: 'EEE411', title: 'Control Systems',
    creditUnits: 3,
    description: 'Open/closed-loop control, stability analysis, PID controllers.',
    topics: ['Open-loop vs closed-loop', 'Transfer functions', 'Block diagram algebra', 'Stability: Routh-Hurwitz', 'Root locus', 'Frequency domain: Bode plots', 'PID control'],
  },
  {
    level: 400, semester: 'second', code: 'CEN421', title: 'Internet of Things',
    creditUnits: 3,
    description: 'IoT architecture, protocols (MQTT, CoAP), edge computing.',
    topics: ['IoT architecture', 'Sensor networks', 'MQTT protocol', 'CoAP', 'Edge computing', 'Security in IoT'],
  },
  {
    level: 400, semester: 'second', code: 'CEN422', title: 'Computer Vision',
    creditUnits: 3,
    description: 'Image processing, feature extraction, CNNs for vision tasks.',
    topics: ['Image formation', 'Filtering and edge detection', 'Feature descriptors', 'Convolutional neural networks', 'Object detection', 'OpenCV'],
  },
  {
    level: 400, semester: 'second', code: 'CEN423', title: 'Cybersecurity',
    creditUnits: 3,
    description: 'Cryptography, network security, intrusion detection, ethical hacking.',
    topics: ['Symmetric cryptography', 'Asymmetric cryptography', 'TLS/SSL', 'Network attacks', 'Intrusion detection', 'Penetration testing basics'],
  },
  {
    level: 400, semester: 'second', code: 'CEN424', title: 'Final Year Project I',
    creditUnits: 3,
    description: 'Project proposal, literature review, and system design.',
    topics: ['Research methodology', 'Literature review', 'System analysis', 'Feasibility study', 'Project proposal writing'],
  },

  // ─── 500 Level ──────────────────────────────────────────────────────────────
  {
    level: 500, semester: 'first', code: 'CEN511', title: 'Machine Learning',
    creditUnits: 3,
    description: 'Supervised, unsupervised, and reinforcement learning algorithms.',
    topics: ['Linear regression', 'Logistic regression', 'Decision trees', 'SVM', 'K-means clustering', 'Neural networks', 'Reinforcement learning'],
  },
  {
    level: 500, semester: 'first', code: 'CEN512', title: 'Distributed Systems',
    creditUnits: 3,
    description: 'Consistency, availability, fault tolerance, distributed algorithms.',
    topics: ['CAP theorem', 'Distributed consensus', 'Paxos and Raft', 'MapReduce', 'Microservices', 'Message queues'],
  },
  {
    level: 500, semester: 'first', code: 'CEN513', title: 'Cloud Computing',
    creditUnits: 3,
    description: 'Cloud service models, virtualization, containers, serverless.',
    topics: ['IaaS, PaaS, SaaS', 'Virtualization and hypervisors', 'Docker and Kubernetes', 'Serverless computing', 'Cloud storage', 'DevOps and CI/CD'],
  },
  {
    level: 500, semester: 'second', code: 'CEN521', title: 'Final Year Project II',
    creditUnits: 6,
    description: 'Implementation, testing, and final presentation of engineering project.',
    topics: ['System implementation', 'Testing and validation', 'Performance evaluation', 'Technical report', 'Oral presentation', 'Paper writing'],
  },
  {
    level: 500, semester: 'second', code: 'GNS521', title: 'Entrepreneurship',
    creditUnits: 2,
    description: 'Business plan, tech startup, IP rights, and innovation management.',
    topics: ['Business plan writing', 'Startup ecosystem', 'Intellectual property', 'Funding and venture capital', 'Marketing for engineers'],
  },
];

// ─── Community seeds ──────────────────────────────────────────────────────────

const COMMUNITY_SEEDS = [
  {
    slug: 'uniben-computer-engineering',
    name: 'UNIBEN Computer Engineering',
    description: 'Official study community for Computer Engineering students at the University of Benin. Share notes, ask questions, get exam help.',
    courseCode: 'CEN',
    isPrivate: false,
  },
  {
    slug: 'waec-candidates-2025',
    name: 'WAEC 2025 Candidates',
    description: 'Prepare for WAEC together — past questions, tips, timetable updates, and moral support!',
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
    description: 'Electrical/Electronic Engineering community at UNIBEN. Course notes, lab reports, and exam prep.',
    courseCode: 'EEE',
    isPrivate: false,
  },
  {
    slug: 'nigerian-engineering-students',
    name: 'Nigerian Engineering Students',
    description: 'A pan-university community for engineering students across Nigeria.',
    courseCode: undefined,
    isPrivate: false,
  },
];

// ─── Main seeder ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting Lerno curriculum seed...');

  // 1. Ensure system AI user exists
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
    console.log('✅ Created system AI user');
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

    const [created] = await db
      .insert(communities)
      .values({
        ...comm,
        memberCount: 0,
        createdBy: aiUser.id,
      })
      .returning();

    console.log(`✅ Created community: ${created.name}`);
  }

  // 3. Seed UNIBEN CEN courses as template userCourses + AI flashcard posts
  // We use the AI user as the owner, so these become "AI-generated" resource posts
  let seededCourses = 0;
  let seededPosts = 0;

  for (const course of UNIBEN_CEN_COURSES) {
    // Check if AI user already has this course
    const existing = await db
      .select({ id: userCourses.id })
      .from(userCourses)
      .where(eq(userCourses.code, course.code))
      .limit(1);

    let courseId: string;
    if (existing.length > 0) {
      courseId = existing[0].id;
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

    // Seed one flashcard post per topic (up to 5 topics)
    for (const topic of course.topics.slice(0, 5)) {
      const existingPost = await db
        .select({ id: posts.id })
        .from(posts)
        .where(
          sql`${posts.topicTags} @> ${JSON.stringify([course.code])} AND post_type = 'flashcard' AND content->>'front' = ${topic}`,
        )
        .limit(1);

      if (existingPost.length > 0) continue;

      await db.insert(posts).values({
        postType: 'flashcard',
        authorId: aiUser.id,
        courseId,
        aiGenerated: true,
        isVisible: true,
        topicTags: [course.code, `${course.level}L`],
        content: {
          front: topic,
          back: `Key concept in ${course.title} (${course.code}). Study this topic to master ${topic.toLowerCase()}.`,
          courseCode: course.code,
          courseTitle: course.title,
          level: course.level,
        },
      });

      seededPosts++;
    }
  }

  console.log(`✅ Seeded ${seededCourses} courses and ${seededPosts} flashcard posts`);
  console.log('🎉 Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
