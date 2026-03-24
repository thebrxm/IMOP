
import { PatientState } from './types';

export const INITIAL_PATIENT_STATE: PatientState = {
  total: 0,
  atendidos: 0,
  trasladados: 0,
  obitos: 0,
  evacuados: 0,
  byGender: { male: 0, female: 0, sd: 0 },
  byAge: { minor: 0, adult: 0, sd: 0 },
  resources: { moviles: 0, aereo: 0 },
  hospitals: [{ id: '1', name: '', count: 0 }],
  methane: { m: '', e: '', t: '', h: '', a: '', n: '', e2: '' },
  incidente: '',
  direccion: '',
  intervencion: '',
  notas: '',
  lastUpdate: new Date().toISOString(),
  isFinalCount: false
};

export const HOSPITAL_LIST = [
  "HOSPITAL PENNA", "HOSPITAL ARGERICH", "HOSPITAL RAMOS MEJIA", 
  "HOSPITAL FERNANDEZ", "HOSPITAL RIVADAVIA", "HOSPITAL PIROVANO", 
  "HOSPITAL TORNU", "HOSPITAL SANTOJANNI", "HOSPITAL PIÑERO", 
  "HOSPITAL GRIERSON", "HOSPITAL ZUBIZARRETA", "HOSPITAL VELEZ SARSFIELD", 
  "HOSPITAL ALVAREZ", "HOSPITAL DURAND", "HOSPITAL MUÑIZ", 
  "HOSPITAL SANTA LUCIA", "HOSPITAL GUTIERREZ", "HOSPITAL ELIZALDE", "OTROS"
];
