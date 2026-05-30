// All mock data + TS shapes for the institutional dashboard sections.
// Frontend-only fixtures — no engine calls. The live settings integration
// lives entirely in AjustesSection.tsx (api.ts/types.ts untouched).

import type { ComponentType } from "react";
import {
  IconHome,
  IconStudents,
  IconAgents,
  IconChannels,
  IconAnalytics,
  IconSettings,
} from "./components/icons.tsx";

// ---------- Navigation model ----------
export type SectionId =
  | "inicio"
  | "estudiantes"
  | "agentes"
  | "canales"
  | "analitica"
  | "ajustes";

export interface NavSection {
  id: SectionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const SECTIONS: NavSection[] = [
  { id: "inicio", label: "Inicio", icon: IconHome },
  { id: "estudiantes", label: "Estudiantes y cohortes", icon: IconStudents },
  { id: "agentes", label: "Agentes", icon: IconAgents },
  { id: "canales", label: "Canales", icon: IconChannels },
  { id: "analitica", label: "Analítica / progreso", icon: IconAnalytics },
  { id: "ajustes", label: "Ajustes", icon: IconSettings },
];

export const SECTION_TITLES: Record<SectionId, string> = {
  inicio: "Inicio",
  estudiantes: "Estudiantes y cohortes",
  agentes: "Agentes de aprendizaje",
  canales: "Canales",
  analitica: "Analítica y progreso",
  ajustes: "Ajustes del audio",
};

// ---------- Estudiantes ----------
export interface Estudiante {
  id: string;
  nombre: string;
  cohorte: string;
  materia: string;
  audios: number;
  progreso: number;
  estado: "Activo" | "En riesgo" | "Inactivo";
}

export const ESTUDIANTES: Estudiante[] = [
  { id: "e1", nombre: "María Fernanda Gómez", cohorte: "Ingeniería 2024-A", materia: "Cálculo", audios: 42, progreso: 88, estado: "Activo" },
  { id: "e2", nombre: "José Luis Hernández", cohorte: "Ingeniería 2024-A", materia: "Cálculo", audios: 18, progreso: 41, estado: "En riesgo" },
  { id: "e3", nombre: "Ana Sofía Ramírez", cohorte: "Derecho 2024-B", materia: "Derecho", audios: 55, progreso: 95, estado: "Activo" },
  { id: "e4", nombre: "Diego Martínez Cruz", cohorte: "Prepa 2025-A", materia: "Historia de México", audios: 30, progreso: 67, estado: "Activo" },
  { id: "e5", nombre: "Valeria Torres López", cohorte: "Prepa 2025-A", materia: "Biología", audios: 12, progreso: 28, estado: "En riesgo" },
  { id: "e6", nombre: "Carlos Eduardo Mendoza", cohorte: "Derecho 2024-B", materia: "Derecho", audios: 0, progreso: 0, estado: "Inactivo" },
  { id: "e7", nombre: "Regina Castillo Vega", cohorte: "Ingeniería 2024-A", materia: "Biología", audios: 38, progreso: 79, estado: "Activo" },
  { id: "e8", nombre: "Emiliano Reyes Ortiz", cohorte: "Prepa 2025-A", materia: "Historia de México", audios: 24, progreso: 53, estado: "Activo" },
];

export const COHORTES = ["Todas", "Ingeniería 2024-A", "Derecho 2024-B", "Prepa 2025-A"];

// ---------- Agentes ----------
export interface Agente {
  id: string;
  nombre: string;
  materia: string;
  estado: "Activo" | "Pausado";
  estudiantes: number;
  audiosGenerados: number;
  ultimaEjecucion: string;
  descripcion: string;
}

export const AGENTES: Agente[] = [
  { id: "a1", nombre: "Tutor de Cálculo", materia: "Cálculo", estado: "Activo", estudiantes: 64, audiosGenerados: 1240, ultimaEjecucion: "hace 5 min", descripcion: "Convierte apuntes de límites y derivadas en repasos de audio cortos." },
  { id: "a2", nombre: "Guía de Historia", materia: "Historia de México", estado: "Activo", estudiantes: 48, audiosGenerados: 870, ultimaEjecucion: "hace 22 min", descripcion: "Resume capítulos y arma líneas de tiempo narradas." },
  { id: "a3", nombre: "Asistente de Biología", materia: "Biología", estado: "Activo", estudiantes: 51, audiosGenerados: 932, ultimaEjecucion: "hace 1 h", descripcion: "Explica procesos celulares con ejemplos y mini-quiz." },
  { id: "a4", nombre: "Repaso de Derecho", materia: "Derecho", estado: "Pausado", estudiantes: 33, audiosGenerados: 410, ultimaEjecucion: "hace 3 días", descripcion: "Lecturas de artículos y casos para preparar exámenes." },
];

// ---------- Canales ----------
export interface Canal {
  id: string;
  nombre: string;
  tipo: string;
  estado: "Conectado" | "Desconectado";
  detalle: string;
  metricaLabel: string;
  metricaValor: string;
}

export const CANALES: Canal[] = [
  { id: "c1", nombre: "WhatsApp", tipo: "Mensajería", estado: "Conectado", detalle: "Los estudiantes reciben sus audios en el chat.", metricaLabel: "Audios enviados (semana)", metricaValor: "1,820" },
  { id: "c2", nombre: "LMS / Moodle", tipo: "Plataforma", estado: "Conectado", detalle: "Integrado al aula virtual de la institución.", metricaLabel: "Cursos vinculados", metricaValor: "26" },
  { id: "c3", nombre: "Servidor MCP", tipo: "Integración", estado: "Conectado", detalle: "Expone los agentes a herramientas externas.", metricaLabel: "Llamadas (24 h)", metricaValor: "3,442" },
  { id: "c4", nombre: "Web", tipo: "Portal", estado: "Desconectado", detalle: "Portal de autoservicio para estudiantes.", metricaLabel: "Visitas (semana)", metricaValor: "—" },
];

// ---------- Stats ----------
export interface Stat {
  label: string;
  valor: string;
  delta?: string;
  deltaUp?: boolean;
  trend?: number[];
}

export const INICIO_STATS: Stat[] = [
  { label: "Estudiantes activos", valor: "1,284", delta: "+8.2%", deltaUp: true, trend: [12, 14, 13, 16, 18, 17, 21, 24] },
  { label: "Audios generados", valor: "9,412", delta: "+12%", deltaUp: true, trend: [40, 52, 49, 61, 58, 70, 77, 84] },
  { label: "Minutos escuchados", valor: "38,560", delta: "+5.4%", deltaUp: true, trend: [30, 34, 33, 38, 41, 40, 44, 47] },
  { label: "Tasa de finalización", valor: "72%", delta: "-1.1%", deltaUp: false, trend: [76, 75, 74, 73, 74, 73, 72, 72] },
];

export const ANALITICA_STATS: Stat[] = [
  { label: "Escuchas esta semana", valor: "6,108", delta: "+9.7%", deltaUp: true },
  { label: "Duración media", valor: "3.4 min", delta: "+0.2", deltaUp: true },
  { label: "Quiz completados", valor: "4,230", delta: "+14%", deltaUp: true },
];

export const AUDIOS_POR_MATERIA = [
  { label: "Cálculo", value: 1240 },
  { label: "Historia", value: 870 },
  { label: "Biología", value: 932 },
  { label: "Derecho", value: 410 },
];

export const ESCUCHAS_14D = [220, 260, 240, 300, 280, 340, 360, 330, 400, 420, 390, 460, 500, 540];

export const AUDIOS_POR_SEMANA = [
  { label: "S1", value: 620 },
  { label: "S2", value: 740 },
  { label: "S3", value: 690 },
  { label: "S4", value: 880 },
  { label: "S5", value: 940 },
  { label: "S6", value: 1020 },
];

export interface CohorteProgreso {
  cohorte: string;
  estudiantes: number;
  finalizacion: number;
}

export const PROGRESO_COHORTES: CohorteProgreso[] = [
  { cohorte: "Ingeniería 2024-A", estudiantes: 320, finalizacion: 81 },
  { cohorte: "Derecho 2024-B", estudiantes: 210, finalizacion: 64 },
  { cohorte: "Prepa 2025-A", estudiantes: 540, finalizacion: 73 },
];

export const ACTIVIDAD_RECIENTE = [
  { quien: "Tutor de Cálculo", accion: "generó 24 audios", cuando: "hace 5 min" },
  { quien: "Ana Sofía Ramírez", accion: "completó un quiz", cuando: "hace 12 min" },
  { quien: "Guía de Historia", accion: "generó 11 audios", cuando: "hace 22 min" },
  { quien: "Canal WhatsApp", accion: "envió 320 audios", cuando: "hace 40 min" },
  { quien: "Diego Martínez Cruz", accion: "escuchó 3 lecciones", cuando: "hace 1 h" },
];
