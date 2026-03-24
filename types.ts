
export enum SeverityLevel {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AlertData {
  id: string;
  incident: string;
  location: string;
  notes?: string;
  formattedMessage: string;
  severity: SeverityLevel;
  timestamp: Date;
  coordinates?: Coordinates;
  isHandled?: boolean;
}

export interface GeminiAnalysisResult {
  formattedMessage: string;
  severity: SeverityLevel;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  vibrationPattern: 'default' | 'urgent' | 'long';
  customIconUrl: string;
}

// ECUES Types
export interface MethaneData {
  m: string;
  e: string;
  t: string;
  h: string;
  a: string;
  n: string;
  e2: string;
}

export interface HospitalDestination {
  id: string;
  name: string;
  customName?: string;
  count: number;
}

export interface PatientState {
  total: number;
  atendidos: number;
  trasladados: number;
  obitos: number;
  evacuados: number;
  byGender: {
    male: number;
    female: number;
    sd: number;
  };
  byAge: {
    minor: number;
    adult: number;
    sd: number;
  };
  resources: {
    moviles: number;
    aereo: number;
  };
  hospitals: HospitalDestination[];
  methane: MethaneData;
  incidente: string;
  direccion: string;
  intervencion: string;
  notas: string;
  lastUpdate: string;
  isFinalCount: boolean;
}
