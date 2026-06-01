export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  country: string;
  currency: string;
  sector: string;
  founded?: number | null;
  employees?: number | null;
  status: string;
  annualRevenue?: number | null;
  monthlyRevenue?: number | null;
  mainRevenue?: string | null;
  createdAt: Date;
  updatedAt: Date;
  assets?: CompanyAsset[];
  revenueRecords?: RevenueRecord[];
}

export interface CompanyAsset {
  id: string;
  companyId: string;
  name: string;
  type: string;
  value?: number | null;
  currency: string;
  description?: string | null;
  createdAt: Date;
}

export interface RevenueRecord {
  id: string;
  companyId: string;
  year: number;
  month?: number | null;
  amount: number;
  currency: string;
  type: string;
  createdAt: Date;
}

export const SECTORS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Energy",
  "Consumer Goods",
  "Real Estate",
  "Industrial",
  "Telecommunications",
  "Materials",
  "Utilities",
  "Agriculture",
  "Retail",
  "Automotive",
  "Media & Entertainment",
  "Other",
];

export const ASSET_TYPES = [
  "Real Estate",
  "Intellectual Property",
  "Equipment",
  "Investments",
  "Cash & Equivalents",
  "Inventory",
  "Receivables",
  "Brand",
  "Other",
];

export const COUNTRIES = [
  "United States",
  "Brazil",
  "United Kingdom",
  "Germany",
  "France",
  "China",
  "Japan",
  "Canada",
  "Australia",
  "India",
  "Singapore",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "South Korea",
  "Mexico",
  "Argentina",
  "Other",
];
