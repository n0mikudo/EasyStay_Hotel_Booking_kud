export type UserRole = 'admin' | 'merchant' | 'user' | string;

export interface UserProfile {
  id?: string | number;
  userId?: string | number;
  merchantId?: string | number;
  username?: string;
  nickname?: string;
  role?: UserRole;
}

export interface HotelEntity {
  id: string;
  name: string;
  city?: string;
  address?: string;
  rating?: number;
  price?: number;
  status?: string;
}

export interface BookingEntity {
  id: string;
  hotelId?: string;
  hotelName?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  totalPrice?: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
