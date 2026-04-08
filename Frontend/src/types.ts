/**
 * TypeScript interfaces mirroring FastAPI Pydantic models (schemas.py)
 */

export interface VictimResponse {
  id: number;
  name: string;
  age: number;
  description: string | null;
  reference_photo: string | null;
  additional_media_paths: string[];
}

export interface SightingResponse {
  id: number;
  victim_id: number;
  location: string;
  camera_id: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  sighting_image: string | null;
  annotated_image: string | null;
  confidence: number;
  is_alert: boolean;
  action_link: string | null;
  notes: string | null;
}

export interface DashboardStats {
  total_sightings: number;
  total_alerts: number;
  victim_name: string | null;
  top_match: {
    location: string;
    confidence: number;
    timestamp: string;
  } | null;
}
