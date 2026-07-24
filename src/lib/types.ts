export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type Sex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type CategoryType = 'GENERAL' | 'JOB';
export type ListingStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'PAID';
export type ReportCategory =
  | 'CATEGORY_PROBLEM'
  | 'CONTENT_PROBLEM'
  | 'PRICE_PROBLEM'
  | 'CALL_INFO_PROBLEM'
  | 'EXISTENCY_PROBLEM'
  | 'OTHER';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  // Hex color used to tint this category's pins on the app's discount map.
  color: string | null;
  type: CategoryType;
  // Display order among sibling categories (lower first), matching the
  // Figma design's category ordering.
  order: number;
  parentId: string | null;
}

export interface Banner {
  id: string;
  imageUrl: string;
  link: string | null;
  order: number;
  isActive: boolean;
  cityId: string;
  city?: { id: string; name: string; slug: string };
  createdAt: string;
}

export interface SplashScreen {
  id: string;
  cityId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  city?: { id: string; name: string; slug: string };
}

export interface AdminUser {
  id: string;
  mobile: string;
  username: string | null;
  avatar: string | null;
  sex: Sex;
  role: Role;
  cityId: string | null;
  city: City | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    advertisements: number;
    stores: number;
    jobs: number;
    bookmarks: number;
  };
}

interface ListingOwner {
  id: string;
  username: string | null;
  mobile: string;
}

interface ListingBase {
  id: string;
  status: ListingStatus;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  category: Category;
  city: City;
  user: ListingOwner;
  createdAt: string;
  updatedAt: string;
}

interface PaidListingBase extends ListingBase {
  paymentStatus: PaymentStatus;
  paymentConfirmedAt: string | null;
}

export interface Advertisement extends ListingBase {
  title: string;
  description: string;
  price: string | null;
  images: string[];
  contactInfo: string | null;
  attributes: Record<string, unknown> | null;
  viewsCount: number;
  lat: number | null;
  lng: number | null;
  ratingAvg: number;
  ratingCount: number;
  // Only set for ads under a fee-required root category (e.g. استخدامی/
  // تخفیف‌یاب — see Category.adFeeToman); null means no fee was required.
  paymentStatus: PaymentStatus | null;
  paymentConfirmedAt: string | null;
  // Set from the global AdExpirySetting at creation, or manually by a
  // SUPER_ADMIN; null means the ad never auto-archives.
  expiresAt: string | null;
  // Optional تخفیف‌یاب storefront this discount ad was posted under; null
  // for ads not tied to a store (most non-discount categories).
  store: { id: string; name: string; logo: string | null } | null;
}

export interface Store extends PaidListingBase {
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  images: string[];
  logo: string | null;
  banner: string | null;
  // Storefront subscription expiry — pushed out by StoreExpirySetting.
  // expiryDays each time confirm-payment is used (initial subscription or a
  // later renewal). Auto-archived once past (see StoreExpiryCron).
  subscriptionExpiresAt: string | null;
}

export interface Job extends PaidListingBase {
  title: string;
  description: string;
  salary: string | null;
  // Set from JobExpirySetting.expiryDays at creation and extended by the
  // same setting on a later renewal confirmation; null means the job
  // posting never auto-archives (see JobExpiryCron).
  expiresAt: string | null;
  manager: string | null;
  phone: string | null;
  registerCode: string | null;
  mobile: string | null;
  fax: string | null;
  address: string | null;
  telegram: string | null;
  instagram: string | null;
  email: string | null;
  banner: string | null;
  logo: string | null;
  lat: number | null;
  lng: number | null;
}

export interface StoreOffer {
  id: string;
  title: string;
  description: string | null;
  discountPercent: number | null;
  originalPrice: string | null;
  images: string[];
  contactInfo: string | null;
  expiresAt: string | null;
  status: ListingStatus;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  paymentStatus: PaymentStatus;
  paymentConfirmedAt: string | null;
  store: { id: string; name: string; userId: string };
  city: City;
  user: ListingOwner;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  category: ReportCategory;
  phone: string | null;
  email: string | null;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  advertisementId: string;
  advertisement: { id: string; title: string; userId: string };
  reporter: { id: string; username: string | null; mobile: string };
}

export interface Conversation {
  id: string;
  advertisementId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  createdAt: string;
  advertisement: { id: string; title: string; images: string[] };
  buyer: { id: string; username: string | null; mobile: string };
  seller: { id: string; username: string | null; mobile: string };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  readAt: string | null;
  createdAt: string;
}

export interface AttributeOption {
  id: string;
  groupKey: string;
  label: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  users: { total: number; admins: number };
  pendingReview: {
    advertisements: number;
    stores: number;
    jobs: number;
    storeOffers: number;
    reports: number;
    total: number;
  };
  listings: {
    advertisements: number;
    stores: number;
    jobs: number;
  };
}
