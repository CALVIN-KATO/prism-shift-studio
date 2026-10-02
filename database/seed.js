const bcrypt = require('bcryptjs');
const { db, init } = require('./db');

const img = (n) => `https://picsum.photos/seed/prismshift${n}/900/650`;

const portfolio = [
  { title: 'Kijani Coffee Rebrand', category: 'Branding', client_name: 'Kijani Coffee Co.', tag: 'Logo & Identity', description: 'Full identity system: logo, colour palette, visual guidelines and packaging labels for a Ugandan coffee roaster.', image_url: img(1), featured: 1 },
  { title: 'Orbit Product Renders', category: '3D Assets', client_name: 'Orbit Audio', tag: '3D Render', description: 'Photoreal 3D renders and turntable assets for a wireless headphone launch.', image_url: img(2), featured: 1 },
  { title: 'Campus Pay App', category: 'UI/UX', client_name: 'Nkozi Student Union', tag: 'App Interface', description: 'Mobile wallet UI and UX flows for paying campus fees and vendors.', image_url: img(3), featured: 0 },
  { title: 'Pulse Launch Reel', category: 'Motion Graphics', client_name: 'Pulse Fitness', tag: 'Intro Animation', description: 'Dynamic 30-second social launch reel with kinetic typography and logo sting.', image_url: img(4), featured: 1 },
  { title: 'Savanna Packaging Set', category: 'Print & Packaging', client_name: 'Savanna Honey', tag: 'Box & Label', description: 'Gift box, jar labels, brochures and business cards for a honey brand.', image_url: img(5), featured: 0 },
];

const inquiries = [
  { client_name: 'Amina Nakato', client_email: 'amina@example.com', service_type: 'Brand Identity', budget_range: '$500 - $2,000', project_brief: 'We are launching a bakery and need a logo, colour palette and menu design.', deadline: '2026-11-15', status: 'new' },
  { client_name: 'Daniel Okello', client_email: 'daniel@example.com', service_type: 'Complete Agency Package', budget_range: '$5,000+', project_brief: 'Full rebrand, website UI/UX and a 60-second explainer video for our logistics startup.', deadline: '2026-12-20', status: 'in_contact' },
  { client_name: 'Grace Namatovu', client_email: 'grace@example.com', service_type: '3D & Visual Assets', budget_range: '$2,000 - $5,000', project_brief: 'Product renders and packaging mockups for a skincare line.', deadline: '2026-10-30', status: 'approved' },
];

(async () => {
  await init();
  await db('portfolio_items').del();
  await db('inquiries').del();
  await db('admin_users').del();

  const username = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  await db('admin_users').insert({ username, password_hash: bcrypt.hashSync(password, 10), role: 'admin' });
  await db('portfolio_items').insert(portfolio);
  await db('inquiries').insert(inquiries);

  console.log(`Seeded: 1 admin (${username}), ${portfolio.length} portfolio items, ${inquiries.length} inquiries.`);
  await db.destroy();
})().catch((e) => { console.error(e); process.exit(1); });
