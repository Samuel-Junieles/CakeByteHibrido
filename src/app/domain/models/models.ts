export type UserRole = 'Admin' | 'Vendedor' | 'Comprador';

export interface ProfileDto {
  id?: string;
  correo: string;
  nombres?: string;
  apellidos?: string;
  rol_id?: number;
  created_at?: string;
}

export interface UserEntity {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  address?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface ProductEntity {
  id?: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  imageurl?: string | null;
  createdat?: string | null;
}

export interface CartItemEntity {
  id?: number;
  productid: number;
  productname: string;
  productprice: number;
  quantity: number;
  size: string;
  note?: string | null;
  imageurl?: string | null;
  user_email?: string | null;
}

export interface OrderEntity {
  id?: number;
  customername: string;
  itemssummary: string;
  totalprice: number;
  totalitems: number;
  status: string;
  createdat?: string | null;
}

export interface DashboardStats {
  dailySalesCount: number;
  totalOrders: number;
  totalEarnings: number;
  activeProductsCount: number;
}

export interface CapturedPhoto {
  dataUrl: string;
  format: string;
  source: 'camera' | 'gallery' | 'preset';
  createdAt: string;
}

export const PRESET_PRODUCT_IMAGES: { label: string; key: string; url: string }[] = [
  { label: 'Torta de Chocolate', key: 'torta_de_chocolate', url: 'assets/images/torta_de_chocolate.png' },
  { label: 'Torta de Vainilla', key: 'torta_de_vainilla', url: 'assets/images/torta_de_vainilla.png' },
  { label: 'Red Velvet', key: 'red_velvet_torta', url: 'assets/images/red_velvet_torta.png' },
  { label: 'Carrot Cake', key: 'carrot_torta', url: 'assets/images/carrot_torta.png' },
  { label: 'Cheesecake Mora', key: 'cheesecake_de_mora', url: 'assets/images/cheesecake_de_mora.png' },
  { label: 'Cheesecake Fresa', key: 'cheesecake_de_fresa', url: 'assets/images/cheesecake_de_fresa.png' },
  { label: 'Galletas de Chocolate', key: 'galletas_de_chocolate', url: 'assets/images/galletas_de_chocolate.png' },
];

export function resolveProductImageUrl(imageurl?: string | null): string {
  if (!imageurl || imageurl.trim() === '') {
    return 'assets/images/torta_de_chocolate.png';
  }
  const trimmed = imageurl.trim();
  if (
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('assets/')
  ) {
    return trimmed;
  }
  const preset = PRESET_PRODUCT_IMAGES.find((p) => p.key === trimmed);
  if (preset) {
    return preset.url;
  }
  return `assets/images/${trimmed}.png`;
}

