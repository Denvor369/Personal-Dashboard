// Mock data for the Agency Hub — an early workspace foundation. NOT persistent.
// Future tables: agency_clients, agency_services, agency_projects,
// agency_deliverables (user_id uuid, RLS). No invoicing/payments/contracts/team yet.

export type ClientStatus = 'Lead' | 'Active' | 'Paused' | 'Completed' | 'Archived';

export interface AgencyClient {
  id: number;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  status: ClientStatus;
  services: string[];
  projectCount: number;
  notes: string;
}

export interface AgencyService {
  id: number;
  name: string;
  description: string;
  startingPrice: string;
}

export interface AgencyProject {
  id: number;
  name: string;
  client: string;
  progress: number;
  status: 'Discovery' | 'In progress' | 'Review' | 'Delivered';
}

export interface Deliverable {
  id: number;
  title: string;
  client: string;
  due: string;
  done: boolean;
}

export const clientStatuses: ClientStatus[] = ['Lead', 'Active', 'Paused', 'Completed', 'Archived'];

export const agencyClients: AgencyClient[] = [
  { id: 1, businessName: 'Sunrise Bakery', contactName: 'Elena Roth', email: 'elena@sunrisebakery.co', phone: '+1 555 0142', industry: 'Food & Beverage', status: 'Active', services: ['Website development', 'SEO'], projectCount: 2, notes: 'Wants a seasonal menu section.' },
  { id: 2, businessName: 'Vertex Fitness', contactName: 'Sam Okoro', email: 'sam@vertexfit.io', phone: '+1 555 0199', industry: 'Health', status: 'Lead', services: ['Social media management'], projectCount: 0, notes: 'Discovery call booked.' },
  { id: 3, businessName: 'Maple & Co', contactName: 'Priya Anand', email: 'hello@mapleandco.com', phone: '', industry: 'Retail', status: 'Completed', services: ['Website design', 'Content creation'], projectCount: 1, notes: 'Delivered; may return for maintenance.' },
  { id: 4, businessName: 'Harbor Law', contactName: 'David Kline', email: 'd.kline@harborlaw.com', phone: '+1 555 0170', industry: 'Legal', status: 'Paused', services: ['Website development', 'Maintenance'], projectCount: 1, notes: 'On hold until next quarter.' },
];

export const agencyServices: AgencyService[] = [
  { id: 1, name: 'Website design', description: 'Brand-aligned UI and layout design.', startingPrice: 'from $600' },
  { id: 2, name: 'Website development', description: 'Fast, responsive builds.', startingPrice: 'from $1,200' },
  { id: 3, name: 'Social media management', description: 'Content calendar and posting.', startingPrice: 'from $400/mo' },
  { id: 4, name: 'Graphic design', description: 'Logos, banners, and assets.', startingPrice: 'from $150' },
  { id: 5, name: 'Content creation', description: 'Copy, photos, and short video.', startingPrice: 'from $300' },
  { id: 6, name: 'SEO', description: 'On-page and technical SEO.', startingPrice: 'from $350/mo' },
  { id: 7, name: 'Maintenance', description: 'Updates, backups, and monitoring.', startingPrice: 'from $80/mo' },
];

export const agencyProjects: AgencyProject[] = [
  { id: 1, name: 'Bakery site redesign', client: 'Sunrise Bakery', progress: 60, status: 'In progress' },
  { id: 2, name: 'Menu + SEO refresh', client: 'Sunrise Bakery', progress: 25, status: 'Discovery' },
  { id: 3, name: 'Retail landing page', client: 'Maple & Co', progress: 100, status: 'Delivered' },
];

export const deliverables: Deliverable[] = [
  { id: 1, title: 'Homepage design mockups', client: 'Sunrise Bakery', due: 'Jul 16', done: false },
  { id: 2, title: 'Content calendar draft', client: 'Vertex Fitness', due: 'Jul 18', done: false },
  { id: 3, title: 'Final handoff docs', client: 'Maple & Co', due: 'Jul 10', done: true },
];
