export type UserRole = "pilot" | "air_defense" | "logistics" | "intelligence" | "admin" | "public"

export type ApprovalStatus = "pending" | "approved" | "rejected" | "under_review"

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export type FlightStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "active"
  | "completed"
  | "cancelled"

export type DocumentType = "national_id" | "insurance" | "drone_registration" | "flight_plan" | "other"

export type NotificationType =
  | "profile_approved"
  | "profile_rejected"
  | "flight_approved"
  | "flight_rejected"
  | "flight_under_review"
  | "payment_received"
  | "document_required"
  | "flight_reminder"
  | "system_alert"

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface PilotProfile {
  id: string
  user_id: string
  address: string
  city: string
  country: string
  postal_code: string | null

  air_defense_status: ApprovalStatus
  air_defense_reviewed_by: string | null
  air_defense_reviewed_at: string | null
  air_defense_notes: string | null

  logistics_status: ApprovalStatus
  logistics_reviewed_by: string | null
  logistics_reviewed_at: string | null
  logistics_notes: string | null

  intelligence_status: ApprovalStatus
  intelligence_reviewed_by: string | null
  intelligence_reviewed_at: string | null
  intelligence_notes: string | null

  overall_status: ApprovalStatus

  created_at: string
  updated_at: string
}

export interface Drone {
  id: string
  pilot_id: string
  manufacturer: string
  model: string
  serial_number: string
  registration_number: string | null
  weight_kg: number
  max_altitude_m: number
  max_speed_kmh: number
  has_camera: boolean
  camera_resolution: string | null
  has_thermal_imaging: boolean
  is_registered: boolean
  registration_date: string | null
  registration_expiry: string | null
  created_at: string
  updated_at: string
}

export interface Flight {
  id: string
  pilot_id: string
  drone_id: string
  flight_number: string
  purpose: string
  description: string | null

  departure_location: string
  departure_lat: number
  departure_lng: number
  destination_location: string | null
  destination_lat: number | null
  destination_lng: number | null
  flight_area: any | null

  scheduled_start: string
  scheduled_end: string
  actual_start: string | null
  actual_end: string | null

  max_altitude_m: number
  estimated_duration_minutes: number

  status: FlightStatus

  air_defense_status: ApprovalStatus
  air_defense_reviewed_by: string | null
  air_defense_reviewed_at: string | null
  air_defense_notes: string | null

  logistics_status: ApprovalStatus
  logistics_reviewed_by: string | null
  logistics_reviewed_at: string | null
  logistics_notes: string | null

  intelligence_status: ApprovalStatus
  intelligence_reviewed_by: string | null
  intelligence_reviewed_at: string | null
  intelligence_notes: string | null

  overall_status: ApprovalStatus
  final_approved_at: string | null

  current_lat: number | null
  current_lng: number | null
  current_altitude_m: number | null
  last_gps_update: string | null

  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  document_type: DocumentType
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_at: string
  scan_status: string
  scan_date: string | null
  description: string | null
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  amount: number
  currency: string
  status: PaymentStatus
  payment_provider: string | null
  payment_intent_id: string | null
  transaction_id: string | null
  description: string | null
  metadata: any | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  read_at: string | null
  email_sent: boolean
  email_sent_at: string | null
  created_at: string
}
