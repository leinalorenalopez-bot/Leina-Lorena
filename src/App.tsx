/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  FileText, 
  Info, 
  User, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Home,
  Database,
  Search,
  Download,
  Save,
  MessageSquare,
  LogOut,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  Shield,
  Lock,
  Cloud,
  CloudOff,
  Key,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { jsPDF } from 'jspdf';
import { auth, db } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser 
} from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Types ---

interface AssessmentResult {
  stage: string;
  theory: string;
  description: string;
  complexityScore?: number;
  analysisDetails: {
    humanFigure: string;
    animals: string;
    objects: string;
    environment: string;
  };
  stageAnalysis?: {
    geometricShapes: string;
    recognizableIntent: string;
    complexElements: string;
  };
  keyObservations: {
    id: string;
    title: string;
    content: string;
  }[];
  pedagogicalRecommendations: string[];
  suggestedActivities: string[];
}

interface Drawing {
  id: string;
  imageUrl: string;
  date: string;
  analysis?: AssessmentResult;
  technique?: string;
  notes?: string;
}

interface Child {
  id: string;
  name: string;
  ageAtProfile: number;
  level: string;
  drawings: Drawing[];
}

// --- Firebase Syncer Helpers ---
const saveChildToCloud = async (userId: string, child: Child) => {
  try {
    const childDocRef = doc(db, 'users', userId, 'children', child.id);
    await setDoc(childDocRef, child, { merge: true });
  } catch (error) {
    console.error("Error saving child to Firestore:", error);
  }
};

const loadChildrenFromCloud = async (userId: string): Promise<Child[]> => {
  try {
    const colRef = collection(db, 'users', userId, 'children');
    const snapshot = await getDocs(colRef);
    const loaded: Child[] = [];
    snapshot.forEach(docSnap => {
      loaded.push(docSnap.data() as Child);
    });
    return loaded;
  } catch (error) {
    console.error("Error loading children from Firestore:", error);
    return [];
  }
};

const syncLocalToCloudOnLogin = async (userId: string, localChildren: Child[]) => {
  const cloudChildren = await loadChildrenFromCloud(userId);
  const cloudIds = new Set(cloudChildren.map(c => c.id));
  
  const updatedCloudList = [...cloudChildren];
  for (const localChild of localChildren) {
    if (!cloudIds.has(localChild.id)) {
      await saveChildToCloud(userId, localChild);
      updatedCloudList.push(localChild);
    }
  }
  return updatedCloudList;
};

// --- Main Component ---

export default function App() {
  // Persistence Loading
  const [children, setChildren] = useState<Child[]>(() => {
    try {
      const saved = localStorage.getItem('trazo_dato_children');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse children from localStorage", e);
    }
    
    // Seed default children if nothing exists in localStorage
    return [
      {
        id: '1',
        name: 'Mateo R.',
        ageAtProfile: 4.3,
        level: 'Jardín',
        drawings: [
          {
            id: 'd3',
            imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%' height='100%' style='background:%23EFF6FF;'><circle cx='200' cy='100' r='40' stroke='%232563EB' stroke-width='4' fill='none'/><line x1='200' y1='140' x2='200' y2='220' stroke='%232563EB' stroke-width='4'/><line x1='150' y1='170' x2='250' y2='170' stroke='%232563EB' stroke-width='4'/><line x1='170' y1='220' x2='170' y2='270' stroke='%232563EB' stroke-width='3'/><line x1='230' y1='220' x2='230' y2='270' stroke='%232563EB' stroke-width='3'/><circle cx='80' cy='80' r='20' fill='%23F59E0B'/><path d='M 185 90 A 2 2 0 1 1 185 91 M 215 90 A 2 2 0 1 1 215 91' stroke='black' stroke-width='3'/><path d='M 190 115 Q 200 125 210 115' stroke='black' stroke-width='2' fill='none'/></svg>",
            date: "2026-06-05T10:00:00.000Z",
            technique: "Acuarela",
            analysis: {
              stage: "Etapa Preesquemática Inicial",
              theory: "Búsqueda consciente de forma y representación realista de la figura humana con extremidades diferenciadas.",
              description: "Representación preesquemática bien estructurada con detalles faciales (ojos, boca) y extremidades dobles claras.",
              complexityScore: 7,
              analysisDetails: {
                humanFigure: "Cuerpo vertical y extremidades diferenciadas claramente adheridas al tronco.",
                animals: "No registra figuras de animales en este dibujo.",
                objects: "Sol en la esquina superior izquierda pintado con rayos radiantes.",
                environment: "Objetos dispuestos en el aire sin línea de tierra aún."
              },
              stageAnalysis: {
                geometricShapes: "Excelente control motor de formas esféricas, óvalos y líneas de cierre para caras.",
                recognizableIntent: "Intención figurativa de retrato corporal intencionado de sí mismo frente al espejo.",
                complexElements: "Evolución notable del renacuajo a figura compuesta con brazos y piernas bien posicionados."
              },
              keyObservations: [
                { id: 'obs-3-1', title: 'Esquema de Representación Corporal', content: 'Diferenciación de extremidades superiores e inferiores.' }
              ],
              pedagogicalRecommendations: [
                "Impulsar la observación directa del propio cuerpo.",
                "No emplear cuadernos de colorear rígidos.",
                "Fomentar el juego dramático previo al dibujo."
              ],
              suggestedActivities: [
                "Murales de siluetas de cuerpo entero.",
                "Pintura con témperas y pinceles finos.",
                "Juegos con sábanas y luz."
              ]
            }
          },
          {
            id: 'd2',
            imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%' height='100%' style='background:%23F0FDF4;'><circle cx='150' cy='120' r='50' stroke='%2316A34A' stroke-width='4' fill='none'/><line x1='150' y1='170' x2='150' y2='250' stroke='%23DC2626' stroke-width='4'/><line x1='100' y1='200' x2='200' y2='200' stroke='%232563EB' stroke-width='3'/><circle cx='300' cy='80' r='25' fill='%23FBBF24'/></svg>",
            date: "2026-04-10T10:00:00.000Z",
            technique: "Lápices de Colores",
            analysis: {
              stage: "Garabateo con Nombre",
              theory: "El niño comienza a conectar sus dibujos con la realidad del mundo circundante, nombrando su producción artística.",
              description: "Primeros intentos de representación corporal. El niño nombra el dibujo 'Papá caminando' después de terminarlo.",
              complexityScore: 5,
              analysisDetails: {
                humanFigure: "Esquema rudimentario tipo renacuajo con extremidades directas de la cabeza.",
                animals: "No registra animales claramente identificables.",
                objects: "Círculo amarillo en el fondo que representa el sol de manera intuitiva.",
                environment: "Distribución aleatoria de los elementos en la hoja de papel."
              },
              stageAnalysis: {
                geometricShapes: "Unión incipiente de círculos planos con líneas longitudinales gruesas.",
                recognizableIntent: "Se esfuerza por asignar simbólicamente nombres del entorno familiar a las formas.",
                complexElements: "Aparición preliminar del esquema renacuajo sin tronco definido."
              },
              keyObservations: [
                { id: 'obs-2-1', title: 'Nombramiento del Dibujo', content: 'Asignación de significado simbólico después del proceso creativo.' }
              ],
              pedagogicalRecommendations: [
                "Escuchar activamente la narración detrás del dibujo.",
                "Preguntar qué historia hay en el papel.",
                "No intentar corregir proporciones incorrectas."
              ],
              suggestedActivities: [
                "Escribir la historia detrás de sus dibujos en el reverso.",
                "Uso de plastilina en moldeo libre.",
                "Collage de texturas suaves."
              ]
            }
          },
          {
            id: 'd1',
            imageUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='100%' height='100%' style='background:%23FFF7ED;'><path d='M 50 150 Q 150 50 250 150 T 350 150' stroke='%23EA580C' stroke-width='4' fill='none'/><circle cx='200' cy='150' r='60' stroke='%232563EB' stroke-width='4' fill='none'/><path d='M 100 80 L 300 220' stroke='%2316A34A' stroke-width='3'/></svg>",
            date: "2026-02-15T10:00:00.000Z",
            technique: "Crayones",
            analysis: {
              stage: "Garabateo Controlado",
              theory: "Se observa el descubrimiento de una relación entre los movimientos del niño y los trazos que produce en el papel.",
              description: "Trazos circulares repetitivos y líneas que demuestran una coordinación visomotora básica en desarrollo.",
              complexityScore: 3,
              analysisDetails: {
                humanFigure: "Formas cerradas circulares sin detalles anatómicos independientes.",
                animals: "Trazos abstractos sin correspondencia analítica animal.",
                objects: "Líneas rectas horizontales cruzadas sin orden específico.",
                environment: "Uso expresivo de todo el plano sin organización geo-espacial."
              },
              stageAnalysis: {
                geometricShapes: "Presencia predominante de garabatos circulares y curvas cerradas sencillas sin cierre perfecto.",
                recognizableIntent: "Trazos abstractos guiados por el estímulo kinestésico. El menor disfruta del acto físico de dibujar.",
                complexElements: "Poco detalle. Líneas que cruzan el espacio sin una clara integración corporal u ordenación."
              },
              keyObservations: [
                { id: 'obs-1-1', title: 'Coordinación Ojo-Mano', content: 'Descubrimiento del control visual sobre los movimientos del trazo.' }
              ],
              pedagogicalRecommendations: [
                "Evitar pedirle figuras representativas concretas.",
                "Brindar espacios amplios y crayones gordos.",
                "Fomentar el disfrute del movimiento corporal libre."
              ],
              suggestedActivities: [
                "Trazado en arena con dedos.",
                "Dibujo libre gigante con tiza.",
                "Pintura gruesa con esponjas."
              ]
            }
          }
        ]
      }
    ];
  });

  const [selectedChildId, setSelectedChildId] = useState<string>(children[0]?.id || '');
  const [view, setView] = useState<'dashboard' | 'history' | 'analysis' | 'search'>('dashboard');
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState(4);
  const [newChildLevel, setNewChildLevel] = useState('Jardín');

  // New metadata fields for drawing analysis upload
  const [selectedTechnique, setSelectedTechnique] = useState('Dibujo Libre');
  const [customTechnique, setCustomTechnique] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filters for drawing history view
  const [filterCreationDate, setFilterCreationDate] = useState('');
  const [filterTechnique, setFilterTechnique] = useState('Todas');
  const [filterStage, setFilterStage] = useState('Todas');

  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<{ 
    title: string;
    body: string;
    slide: {
      title: string;
      subtitle: string;
      bullets: string[];
    } | null;
    sources: { title: string, uri: string }[];
  } | null>(null);

  // Terms and Services Popup State (requested to be enabled again/re-enabled)
  const [showTerms, setShowTerms] = useState<boolean>(() => {
    // We default to true in order to reactivate it immediately as requested by the user,
    // ignoring any previously saved accepted flags so they can accept it again.
    return true;
  });

  // Firebase Authentication States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSentSuccess, setResetSentSuccess] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Clean stale states automatically on modal toggles or mode change
  useEffect(() => {
    setAuthError(null);
    setResetSentSuccess(null);
    setShowPassword(false);
  }, [isAuthModalOpen, authMode]);

  const selectedChild = children.find(c => c.id === selectedChildId);

  // Firebase Auth Observer on Mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setChildren(prev => {
          syncLocalToCloudOnLogin(user.uid, prev).then(mergedList => {
            if (mergedList && mergedList.length > 0) {
              setChildren(mergedList);
            }
          });
          return prev;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Persistence Saving (Local + Cloud Sync)
  useEffect(() => {
    localStorage.setItem('trazo_dato_children', JSON.stringify(children));
    if (currentUser) {
      children.forEach(child => {
        saveChildToCloud(currentUser.uid, child);
      });
    }
  }, [children, currentUser]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Por favor complete todos los campos.');
      return;
    }
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        if (authPassword.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error("Auth error:", err);
      let friendlyMessage = 'Ocurrió un error inesperado. Intente de nuevo.';
      if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage = 'El inicio de sesión por correo electrónico y contraseña no está habilitado en la consola de Firebase. Por favor, ve a tu consola de Firebase > Authentication > pestaña "Sign-in method", e ingresa para habilitar "Correo electrónico/contraseña".';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Correo o contraseña incorrectos.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'El correo ya se encuentra registrado.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Formato de correo no válido.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }
      setAuthError(friendlyMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!authEmail) {
      setAuthError('Por favor ingresa tu correo electrónico en el campo superior para enviarte el enlace de recuperación.');
      setResetSentSuccess(null);
      return;
    }
    setAuthError(null);
    setResetSentSuccess(null);
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, authEmail);
      setResetSentSuccess('Se ha enviado un enlace de recuperación de contraseña a tu correo electrónico.');
    } catch (err: any) {
      console.error("Error resetting password:", err);
      let friendlyMessage = 'No se pudo enviar el correo de recuperación. Intenta más tarde.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'No se encontró ningún usuario registrado con ese correo electrónico.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'El formato del correo electrónico ingresado no es válido.';
      } else if (err.message) {
        friendlyMessage = err.message;
      }
      setAuthError(friendlyMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      const saved = localStorage.getItem('trazo_dato_children');
      if (saved) {
        setChildren(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Error signing out", err);
    }
  };

  // Export handlers
  const exportToJSON = (child: Child) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(child, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const safeName = child.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadAnchor.setAttribute("download", `evolucion_grafica_${safeName}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Error exporting to JSON", err);
    }
  };

  const exportToCSV = (child: Child) => {
    try {
      const headers = [
        "ID Alumno", "Nombre Alumno", "Edad Perfil", "Nivel", 
        "ID Dibujo", "Fecha Dibujo", "Estadio", "Descripcion General", 
        "Sustento Teorico", "Detalle Figura Humana", "Detalle Animales", 
        "Detalle Objetos", "Detalle Entorno", 
        "Formas Geometricas", "Intencionalidad Representativa", "Complejidad Detalles",
        "Observaciones Clave", "Recomendaciones Pedagogicas", "Actividades Sugeridas"
      ];

      const csvRows = [headers.join(",")];

      child.drawings.forEach(dw => {
        const obsText = dw.analysis?.keyObservations?.map(o => `${o.title}: ${o.content}`).join(" | ") || "";
        const recText = dw.analysis?.pedagogicalRecommendations?.join(" | ") || "";
        const actText = dw.analysis?.suggestedActivities?.join(" | ") || "";

        const rowValues = [
          child.id,
          child.name,
          child.ageAtProfile.toString(),
          child.level,
          dw.id,
          new Date(dw.date).toLocaleDateString('es-CO'),
          dw.analysis?.stage || "Pendiente de Análisis",
          dw.analysis?.description || "",
          dw.analysis?.theory || "",
          dw.analysis?.analysisDetails?.humanFigure || "",
          dw.analysis?.analysisDetails?.animals || "",
          dw.analysis?.analysisDetails?.objects || "",
          dw.analysis?.analysisDetails?.environment || "",
          dw.analysis?.stageAnalysis?.geometricShapes || "",
          dw.analysis?.stageAnalysis?.recognizableIntent || "",
          dw.analysis?.stageAnalysis?.complexElements || "",
          obsText,
          recText,
          actText
        ];

        // Sanitize values for CSV (escape double quotes, wrap in double quotes)
        const sanitizedRow = rowValues.map(val => {
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        });

        csvRows.push(sanitizedRow.join(","));
      });

      const csvContent = "\uFEFF" + csvRows.join("\n"); // UTF-8 BOM
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", url);
      const safeName = child.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadAnchor.setAttribute("download", `evolucion_grafica_${safeName}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting to CSV", err);
    }
  };

  const exportToPDF = (child: Child) => {
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const PAGE_WIDTH = 210;
      const PAGE_HEIGHT = 297;
      const MARGIN = 15;
      const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

      let currentY = 15;

      const drawPageBorderHeader = () => {
        // Draw elegant top border bar
        doc.setFillColor(79, 70, 229); // #4F46E5 - brand primary
        doc.rect(MARGIN, MARGIN, CONTENT_WIDTH, 2, 'F');
        
        // Draw top light banner background
        doc.setFillColor(248, 249, 250);
        doc.rect(MARGIN, MARGIN + 2, CONTENT_WIDTH, 12, 'F');

        // Draw header text
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text("TRAZO & DATO — INFORME PEDAGÓGICO DE EXPRESIÓN PLÁSTICA", MARGIN + 4, MARGIN + 9.5);
        doc.text("SISTEMA DE ANÁLISIS EVOLUTIVO INFANTIL", PAGE_WIDTH - MARGIN - 4, MARGIN + 9.5, { align: "right" });
        
        currentY = MARGIN + 20;
      };

      const checkNewPage = (heightNeeded: number) => {
        if (currentY + heightNeeded > PAGE_HEIGHT - MARGIN) {
          doc.addPage();
          currentY = MARGIN;
          drawPageBorderHeader();
        }
      };

      // Header on Page 1
      drawPageBorderHeader();

      // Platform Identity Name
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("Trazo & Dato", MARGIN, currentY);
      
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text("SOFTWARE PEDAGÓGICO CLÍNICO-EDUCATIVO", PAGE_WIDTH - MARGIN, currentY - 5, { align: "right" });
      
      const dateStr = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(`Fecha del Reporte: ${dateStr}`, PAGE_WIDTH - MARGIN, currentY, { align: "right" });
      currentY += 5;

      // Report Big Title
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("INFORME EVOLUTIVO DE EXPRESIÓN GRÁFICA", MARGIN, currentY);
      currentY += 4;

      doc.setFont('helvetica', 'oblique');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Análisis Psicomotor, Madurez Gráfica y Evolución del Dibujo Infantil", MARGIN, currentY);
      currentY += 8;

      // Horizontal Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(MARGIN, currentY, PAGE_WIDTH - MARGIN, currentY);
      currentY += 6;

      // STUDENT DATA BLOCK
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(MARGIN, currentY, CONTENT_WIDTH, 24, 3, 3, 'F');

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("DATOS GENERALES DEL ESTUDIANTE", MARGIN + 5, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Nombre del Estudiante: ${child.name}`, MARGIN + 5, currentY + 12);
      doc.text(`Nivel Educativo: ${child.level}`, MARGIN + 5, currentY + 18);
      doc.text(`Edad de Registro: ${child.ageAtProfile} años`, MARGIN + CONTENT_WIDTH / 2 + 5, currentY + 12);
      doc.text(`Docente Evaluador: ${currentUser ? currentUser.email : "Docente / Evaluador"}`, MARGIN + CONTENT_WIDTH / 2 + 5, currentY + 18);

      currentY += 32;

      // Section I header
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("EXPEDIENTES VALORADOS Y ANÁLISIS PEDAGÓGICO", MARGIN, currentY);
      currentY += 6;

      // Loop over drawings
      if (child.drawings.length === 0) {
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text("No se registran dibujos evaluados en el expediente de este estudiante.", MARGIN, currentY + 5);
      } else {
        child.drawings.forEach((dw, idx) => {
          checkNewPage(90); // Make sure there is ample space for the drawing block, otherwise push to new page

          // Drawing Title Frame
          doc.setFillColor(79, 70, 229); // Dark header bar for drawing session
          doc.rect(MARGIN, currentY, CONTENT_WIDTH, 7, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          const formattedDwDate = new Date(dw.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
          doc.text(`SESION DIBUJO #${idx + 1}: ${dw.technique || 'Dibujo Libre'}  |  FECHA: ${formattedDwDate}`, MARGIN + 3, currentY + 4.8);
          currentY += 12;

          // HEADERS DETALLADOS SOLICITADOS POR EL USUARIO
          doc.setFillColor(248, 250, 252); // slate-50
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.roundedRect(MARGIN, currentY - 2, CONTENT_WIDTH, 26, 2, 2, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105); // slate-600

          // Column 1
          doc.text("ESTUDIANTE:", MARGIN + 4, currentY + 3);
          doc.text("FECHA ELABORACION:", MARGIN + 4, currentY + 9);
          doc.text("EDAD DEL MENOR:", MARGIN + 4, currentY + 15);
          doc.text("DOCENTE & NIVEL:", MARGIN + 4, currentY + 21);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(child.name, MARGIN + 42, currentY + 3);
          doc.text(formattedDwDate, MARGIN + 42, currentY + 9);
          doc.text(`${child.ageAtProfile} años`, MARGIN + 42, currentY + 15);
          doc.text(`${currentUser ? currentUser.email : "Docente Evaluador"} — ${child.level}`, MARGIN + 42, currentY + 21);

          // Column 2
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          doc.text("TECNICA USADA:", MARGIN + CONTENT_WIDTH/2 + 4, currentY + 3);
          doc.text("ESTADIO EVOLUTIVO:", MARGIN + CONTENT_WIDTH/2 + 4, currentY + 9);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(79, 70, 229); // brand color for emphasize
          doc.text(dw.technique || 'Dibujo Libre', MARGIN + CONTENT_WIDTH/2 + 45, currentY + 3);
          doc.text(dw.analysis?.stage || 'Pendiente de Análisis', MARGIN + CONTENT_WIDTH/2 + 45, currentY + 9);

          currentY += 30;

          // VALORACION PEDAGOGICA GENERADA (DESCRIPCION)
          checkNewPage(35);
          doc.setTextColor(30, 41, 59);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text("VALORACION PEDAGOGICA GENERADA (INFORME)", MARGIN, currentY);
          currentY += 4;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85); // slate-700
          const descText = dw.analysis?.description || "Sesión pendiente de análisis. No se cuenta con informe descriptivo guardado para este dibujo.";
          const splitDesc = doc.splitTextToSize(descText, CONTENT_WIDTH);
          doc.text(splitDesc, MARGIN, currentY);
          currentY += (splitDesc.length * 4) + 6;

          // SUSTENTO TEORICO Y RECOMENDACIONES
          if (dw.analysis) {
            checkNewPage(40);
            
            // Sustento teórico
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text("SUSTENTO TEORICO Y PSICOLOGIA DEL DESARROLLO", MARGIN, currentY);
            currentY += 4;

            doc.setFont('helvetica', 'oblique');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            const theoryText = dw.analysis.theory || "Sin sustento teórico registrado.";
            const splitTheory = doc.splitTextToSize(theoryText, CONTENT_WIDTH);
            doc.text(splitTheory, MARGIN, currentY);
            currentY += (splitTheory.length * 3.8) + 6;

            // Recomendaciones Pedagógicas
            if (dw.analysis.pedagogicalRecommendations && dw.analysis.pedagogicalRecommendations.length > 0) {
              checkNewPage(30);
              doc.setTextColor(30, 41, 59);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.text("ACTUACIONES Y RECOMENDACIONES PEDAGOGICAS SUGERIDAS", MARGIN, currentY);
              currentY += 4;

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8.5);
              doc.setTextColor(51, 65, 85);
              dw.analysis.pedagogicalRecommendations.slice(0, 3).forEach((rec, rIdx) => {
                const bulletText = `•  ${rec}`;
                const splitBullet = doc.splitTextToSize(bulletText, CONTENT_WIDTH - 4);
                doc.text(splitBullet, MARGIN + 2, currentY);
                currentY += (splitBullet.length * 4) + 1.5;
              });
              currentY += 4;
            }

            // Pautas Clínicas
            checkNewPage(28);
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(MARGIN, currentY, CONTENT_WIDTH, 20, 2, 2, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text("PAUTAS CLINICO-ESTRUCTURALES DE OBSERVACION", MARGIN + 4, currentY + 4);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(51, 65, 85);
            doc.text(`Formas Geometrizadas: ${dw.analysis.stageAnalysis?.geometricShapes || "Detalles básicos consolidados"}`, MARGIN + 4, currentY + 9);
            doc.text(`Intencionalidad Figurada: ${dw.analysis.stageAnalysis?.recognizableIntent || "Reconocimiento a posteriori"}`, MARGIN + 4, currentY + 14);
            doc.text(`Estructura & Complejidad: ${dw.analysis.stageAnalysis?.complexElements || "Detalles típicos de la edad"}`, MARGIN + CONTENT_WIDTH/2 + 2, currentY + 9);
            
            if (dw.notes) {
              doc.text(`Observaciones Aula: ${dw.notes}`, MARGIN + CONTENT_WIDTH/2 + 2, currentY + 14, { maxWidth: CONTENT_WIDTH/2 - 6 });
            }
            currentY += 28;
          }

          currentY += 4;
        });
      }

      // Institutional Signature section
      checkNewPage(35);
      currentY += 10;
      doc.setDrawColor(148, 163, 184); // slate-300
      doc.setLineWidth(0.5);
      
      // Line for signature
      doc.line(MARGIN + 10, currentY, MARGIN + 70, currentY);
      doc.line(PAGE_WIDTH - MARGIN - 70, currentY, PAGE_WIDTH - MARGIN - 10, currentY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text("FIRMA DEL DOCENTE / EVALUADOR", MARGIN + 40, currentY + 4, { align: "center" });
      doc.text("FECHA DE DOCUMENTO", PAGE_WIDTH - MARGIN - 40, currentY + 4, { align: "center" });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Responsable de Diagnóstico", MARGIN + 40, currentY + 8, { align: "center" });
      doc.text("Validado en Plataforma Trazo & Dato", PAGE_WIDTH - MARGIN - 40, currentY + 8, { align: "center" });

      const safeName = child.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      // Directly download PDF
      doc.save(`valoracion_pedagogica_${safeName}.pdf`);
    } catch (err) {
      console.error("Error generating PDF", err);
      // Fallback
      window.print();
    }
  };

  // Handlers
  const handleCreateChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName) return;
    const newChild: Child = {
      id: Date.now().toString(),
      name: newChildName,
      ageAtProfile: newChildAge,
      level: newChildLevel,
      drawings: []
    };
    setChildren(prev => [...prev, newChild]);
    setSelectedChildId(newChild.id);
    setIsAddingChild(false);
    setNewChildName('');
    setView('dashboard');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setCurrentAnalysis(null);
        setError(null);
        setSelectedTechnique('Dibujo Libre');
        setCustomTechnique('');
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setView('analysis');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeDrawing = async () => {
    if (!image || !selectedChild) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const prompt = `
        Actúa como un experto en psicología evolutiva y pedagogía infantil, especialista en las teorías de Viktor Lowenfeld y Rhoda Kellogg.
        
        Analiza este dibujo de un niño de ${selectedChild.ageAtProfile} años llamado ${selectedChild.name}, estudiante de nivel ${selectedChild.level}.
        
        Tu tarea es generar una valoración pedagógica estructurada en JSON con los siguientes campos estrictos:
        - "stage": El estadio del dibujo según Lowenfeld.
        - "theory": Explicación de la etapa y su relación con este dibujo específico.
        - "description": Una descripción general.
        - "complexityScore": Un número entero del 1 al 10 que representa el nivel de complejidad estructural, detalle y madurez del dibujo infantil analizado (1 = garabateo desordenado básico sin coordinación óculo-manual; 10 = dibujo esquemático plenamente estructurado, con línea de tierra, proporciones humanas estables y rica decoración).
        - "analysisDetails": Un objeto con el análisis detallado de estas categorías:
            - "humanFigure": Análisis de figuras humanas (cabeza, ojos, tronco, extremidades), evaluando detalles y proporciones.
            - "animals": Identificación y representación de animales si existen.
            - "objects": Análisis de objetos como el sol, nubes, casa o árbol y su simbolismo.
            - "environment": Análisis del entorno (césped, flores, carretera/línea de tierra) y su organización.
        - "stageAnalysis": Un objeto con las 3 características de evolución gráfica clave solicitado por la normatividad:
            - "geometricShapes": Breve diagnóstico de la presencia y control de formas geométricas básicas (líneas, círculos, cruces, etc.).
            - "recognizableIntent": Análisis de la intención de representar figuras reconocibles (personas, animales, casas, etc.).
            - "complexElements": Evaluación de la aparición de elementos complejos (detalles, línea de apoyo, proporciones anatómicas avanzadas).
        - "keyObservations": Un array de objetos con "id", "title" y "content" (máximo 3).
        - "pedagogicalRecommendations": Un array de 3 strings con recomendaciones críticas para el docente.
        - "suggestedActivities": Un array de 3 strings con actividades lúdicas para fortalecer el desarrollo gráfico.

        Infiera aspectos pedagógicos como: la presencia/ausencia de detalles, la proporción de las partes del cuerpo, la relación espacial entre objetos y la intención comunicativa.
        
        CRÍTICO: No incluyas comas sobrantes (trailing commas) al final de los objetos o arreglos.
        Responde estrictamente en formato JSON válido.
      `;

      const base64Data = image.split(',')[1];
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      };
      const textPart = { text: prompt };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      if (responseText) {
        let parsedResult;
        
        // Robust JSON cleaning
        const cleanJSON = (str: string) => {
          // Remove Markdown code blocks if present
          let cleaned = str.replace(/```json\n?|```/g, "").trim();
          
          // Remove trailing commas before closing braces and brackets
          cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
          
          return cleaned;
        };

        try {
          const cleaned = cleanJSON(responseText);
          parsedResult = JSON.parse(cleaned);
        } catch (e) {
          console.error("JSON Parse error:", responseText);
          throw new Error("La IA devolvió un formato con errores técnicos. Por favor intenta de nuevo.");
        }
        
        setCurrentAnalysis(parsedResult);
        
        // Save drawing to history
        const finalTechnique = selectedTechnique === 'Otro' ? (customTechnique.trim() || 'Otro') : selectedTechnique;
        const finalDate = selectedDate ? new Date(selectedDate + 'T12:00:00').toISOString() : new Date().toISOString();

        const newDrawing: Drawing = {
          id: Date.now().toString(),
          imageUrl: image,
          date: finalDate,
          analysis: parsedResult,
          technique: finalTechnique
        };

        setChildren(prev => prev.map(c => 
          c.id === selectedChildId 
            ? { ...c, drawings: [newDrawing, ...c.drawings] }
            : c
        ));
      } else {
        throw new Error("No se pudo interpretar la respuesta de la IA.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al realizar la valoración. Verifica tu conexión o intenta con otra imagen.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performPedagogicalSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResponse(null);
    setError(null);

    try {
      const prompt = `Actúa como un experto en psicopedagogía infantil y desarrollo de la expresión plástica de niños de 3 a 6 años.
Responde de manera profesional, empática, profunda e instructiva a la consulta del docente.

Consulta del usuario: "${searchQuery}"

Sigue STRICTAMENTE las siguientes pautas de formato y estructura en tu respuesta:

1. NO USES ASTERISCOS (*) EN ABSOLUTO. Evita usar asteriscos para negritas (como **negrita**) o listas. Si necesitas resaltar términos o subtítulos de sección, hazlo de otra manera (ej. usando MAYÚSCULAS o simplemente formato en prosa). No debe haber ningún carácter de asterisco '*' en toda tu respuesta.
2. Estructura el inicio del texto con un título resaltado de la siguiente manera exacta en la primera línea:
TÍTULO: [Escribe aquí un título profesional y claro sin asteriscos]
3. Redacta el cuerpo de la respuesta detallado y completo dirigido al docente. Es muy importante que ofrezcas sustento y sugerencias prácticas.
4. Al final de tu respuesta, genera un bloque especial de resumen que simule una diapositiva interactiva con emojis. Este bloque debe estar estrictamente delimitado de la siguiente manera:

DIAPOSITIVA_INICIO
TÍTULO: [Título breve y llamativo para la diapositiva con un emoji]
SUBTÍTULO: [Subtítulo breve de la diapositiva]
• [Emoji] [Punto clave de resumen 1 sin asteriscos]
• [Emoji] [Punto clave de resumen 2 sin asteriscos]
• [Emoji] [Punto clave de resumen 3 sin asteriscos]
• [Emoji] [Punto clave de resumen 4 sin asteriscos]
DIAPOSITIVA_FIN

Recuerda: nada de asteriscos. Utiliza la búsqueda de Google para asegurar que tu sustento es científicamente preciso y actualizado con las teorías del desarrollo de Viktor Lowenfeld, Rhoda Kellogg, etc.`;

      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} } as any],
        }
      });

      const text = response.text || "No se encontró información relevante.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: { title: string, uri: string }[] = [];
      
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        });
      }

      // Parse the response text
      let parsedTitle = "Respuesta del Buscador";
      let parsedBody = text;
      let parsedSlide: { title: string; subtitle: string; bullets: string[] } | null = null;

      // 1. Parse TITLE (begins with TÍTULO:)
      const titleMatch = text.match(/TÍTULO:\s*(.*?)(?=\n|$)/i);
      if (titleMatch) {
        parsedTitle = titleMatch[1].replace(/\*/g, "").trim();
        parsedBody = parsedBody.replace(titleMatch[0], "").trim();
      }

      // 2. Parse DIAPOSITIVA block
      const slideMatch = text.match(/DIAPOSITIVA_INICIO([\s\S]*?)DIAPOSITIVA_FIN/i);
      if (slideMatch) {
        const slideContent = slideMatch[1].trim();
        parsedBody = parsedBody.replace(slideMatch[0], "").trim();
        
        let slideTitle = "Resumen de Aprendizaje";
        let slideSubtitle = "Recomendaciones clave";
        const bullets: string[] = [];

        const lines = slideContent.split('\n');
        lines.forEach(line => {
          const cleanLine = line.trim();
          if (cleanLine.toLowerCase().startsWith("título:") || cleanLine.toLowerCase().startsWith("titulo:")) {
            slideTitle = cleanLine.replace(/título:|titulo:/i, "").replace(/\*/g, "").trim();
          } else if (cleanLine.toLowerCase().startsWith("subtítulo:") || cleanLine.toLowerCase().startsWith("subtitulo:")) {
            slideSubtitle = cleanLine.replace(/subtítulo:|subtitulo:/i, "").replace(/\*/g, "").trim();
          } else if (cleanLine.length > 0) {
            const cleanBullet = cleanLine.replace(/^[•\-\*]\s*/, "").replace(/\*/g, "").trim();
            if (cleanBullet) {
              bullets.push(cleanBullet);
            }
          }
        });

        parsedSlide = {
          title: slideTitle,
          subtitle: slideSubtitle,
          bullets: bullets.length > 0 ? bullets : [
            "🧠 Comprender la etapa natural del desarrollo",
            "🎨 Fomentar la libre elección de materiales y texturas",
            "🌱 Evitar la imposición de estereotipos o plantillas"
          ]
        };
      } else {
        // Fallback slide if block was not matched
        parsedSlide = {
          title: "💡 Resumen Pedagógico",
          subtitle: "Ideas fundamentales de la consulta",
          bullets: [
            "🌱 Fomentar la libre expresión libre de juicio e imposiciones externas.",
            "📊 Acompañar el trazo respetando la etapa madurativa individual del infante.",
            "🖼️ El dibujo es la ventana del pensamiento infantil y construcción de realidad."
          ]
        };
      }

      // Cleanup remaining asterisks in the body text
      parsedBody = parsedBody.replace(/\*/g, "").trim();

      setSearchResponse({
        title: parsedTitle,
        body: parsedBody,
        slide: parsedSlide,
        sources
      });
    } catch (err) {
      console.error(err);
      setError("Error al realizar la búsqueda web. Por favor intenta de nuevo.");
    } finally {
      setIsSearching(false);
    }
  };

  const getComplexityScore = (dw: Drawing): number => {
    if (dw.analysis?.complexityScore !== undefined) {
      return dw.analysis.complexityScore;
    }
    // Fallback estimation using stage
    const stageLower = dw.analysis?.stage?.toLowerCase() || '';
    if (stageLower.includes('esquemática') || stageLower.includes('esquematica')) {
      return 8;
    }
    if (stageLower.includes('preesquemática') || stageLower.includes('preesquematica') || stageLower.includes('pre-esquemática')) {
      return 6;
    }
    if (stageLower.includes('nombre')) {
      return 4;
    }
    if (stageLower.includes('controlado') || stageLower.includes('control')) {
      return 2.5;
    }
    if (stageLower.includes('garabato') || stageLower.includes('desordenado') || stageLower.includes('descontrolado')) {
      return 1.5;
    }
    return 5; // Default fallback
  };

  // Computations for filtering history drawings
  const uniqueTechniques = selectedChild 
    ? Array.from(new Set(selectedChild.drawings.map(d => d.technique || 'Dibujo Libre')))
    : [];

  const uniqueStages = selectedChild
    ? Array.from(new Set(selectedChild.drawings.map(d => d.analysis?.stage).filter(Boolean) as string[]))
    : [];

  const filteredDrawings = selectedChild?.drawings.filter(dw => {
    // Creation date filter
    if (filterCreationDate) {
      try {
        const dwDateString = new Date(dw.date).toISOString().split('T')[0];
        if (dwDateString !== filterCreationDate) return false;
      } catch (e) {
        if (!dw.date.startsWith(filterCreationDate)) return false;
      }
    }
    // Technique filter
    if (filterTechnique !== 'Todas') {
      const tech = dw.technique || 'Dibujo Libre';
      if (tech.toLowerCase().trim() !== filterTechnique.toLowerCase().trim()) return false;
    }
    // Stage/Estadio filter
    if (filterStage !== 'Todas') {
      if (dw.analysis?.stage !== filterStage) return false;
    }
    return true;
  }) || [];

  const clearHistoryFilters = () => {
    setFilterCreationDate('');
    setFilterTechnique('Todas');
    setFilterStage('Todas');
  };

  const sortedChartData = selectedChild
    ? [...selectedChild.drawings]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(dw => ({
          name: new Date(dw.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
          fecha: new Date(dw.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
          complejidad: getComplexityScore(dw),
          estadio: dw.analysis?.stage || 'Pendiente de Análisis',
          tecnica: dw.technique || 'Dibujo Libre'
        }))
    : [];

  return (
    <div className="w-full h-screen bg-brand-bg text-brand-text flex overflow-hidden font-serif">
      {/* Sidebar */}
      <aside className="w-20 bg-brand-secondary border-r border-brand-border flex flex-col items-center py-4 md:py-6 gap-6 md:gap-10 shrink-0 overflow-y-auto">
        <div className="w-11 h-11 bg-gradient-to-tr from-brand-primary via-[#9333EA] to-[#FF3B70] rounded-full flex items-center justify-center text-white font-sans font-black text-sm shadow-md shadow-brand-primary/20 ring-4 ring-white">
          T&D
        </div>
        <nav className="flex flex-col gap-6 md:gap-8">
          <NavItem 
            icon={<Home size={20} />} 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <NavItem 
            icon={<Database size={20} />} 
            active={view === 'history'} 
            onClick={() => setView('history')} 
          />
          <NavItem 
            icon={<Search size={20} />} 
            active={view === 'search'}
            onClick={() => setView('search')}
          />
        </nav>
        <div className="mt-auto pt-4 flex flex-col gap-4 items-center font-sans">
          <button 
            onClick={() => setShowTerms(true)}
            title="Términos de Servicio y Privacidad"
            className="text-brand-muted hover:text-brand-primary transition-all hover:scale-110 cursor-pointer p-2 rounded-xl hover:bg-brand-accent/60"
          >
            <Shield size={20} />
          </button>

          {/* Cloud Synchronization Status Indicator */}
          {currentUser ? (
            <button 
              onClick={() => {
                alert(`Conectado como: ${currentUser.email}\nTus datos se sincronizan con la nube de forma segura.`);
              }}
              title={`Sincronizado: ${currentUser.email}`}
              className="text-emerald-500 hover:text-emerald-600 hover:scale-110 p-2 rounded-xl bg-emerald-50/55 transition-all cursor-pointer border border-emerald-100/50"
            >
              <Cloud size={20} />
            </button>
          ) : (
            <button 
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              title="Sincronizar con la Nube (Activar soporte Cloud)"
              className="text-amber-500 hover:text-amber-600 hover:scale-110 p-2 rounded-xl bg-amber-50/50 transition-all cursor-pointer border border-amber-100/50 relative group"
            >
              <CloudOff size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            </button>
          )}

          <div className="w-10 h-10 rounded-full bg-brand-accent border-2 border-brand-primary overflow-hidden shadow-inner ring-2 ring-brand-bg relative cursor-pointer"
               onClick={() => {
                 if (!currentUser) {
                   setAuthMode('login');
                   setIsAuthModalOpen(true);
                 }
               }}
               title={currentUser ? `Docente: ${currentUser.email?.split('@')[0]}` : "Invitado: Haz click para iniciar sesión"}
          >
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser ? currentUser.email : (selectedChild?.name || 'Teacher')}`} alt="Profile" />
          </div>

          {currentUser ? (
            <button 
              onClick={handleSignOut}
              title="Cerrar Sesión Cloud"
              className="text-brand-muted hover:text-rose-500 transition-colors cursor-pointer p-2 hover:bg-rose-50 rounded-xl"
            >
              <LogOut size={20} />
            </button>
          ) : (
            <button 
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              title="Iniciar Sesión Docente"
              className="text-brand-muted hover:text-brand-primary transition-colors cursor-pointer p-2 hover:bg-brand-accent/60 rounded-xl"
            >
              <Cloud size={20} className="text-brand-muted/40" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black font-sans tracking-tight cursor-pointer bg-clip-text text-transparent bg-gradient-to-r from-brand-primary via-[#8B5CF6] to-[#FF3B70] filter drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.05)] hover:opacity-95 transition-opacity duration-300" onClick={() => setView('dashboard')}>
              Trazo & Dato
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="relative group">
                <button 
                  className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-brand-border text-sm shadow-sm transition-colors"
                >
                  <User size={14} className="text-brand-primary" />
                  <span className="font-medium text-brand-text">{selectedChild?.name || 'Invitado'}</span>
                </button>
              </div>
              {selectedChild && (
                <p className="text-brand-muted italic text-sm">
                  {selectedChild.ageAtProfile} años ({selectedChild.level})
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-4 items-center">
            {/* Botón de Sincronización de Respaldo en la Cabecera */}
            {currentUser ? (
              <button 
                onClick={() => {
                  alert(`Conectado como: ${currentUser.email}\nTus datos se sincronizan automáticamente con la nube de forma segura.`);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-emerald-200 text-emerald-600 bg-emerald-50 rounded-full text-xs font-sans font-semibold tracking-wide hover:bg-emerald-100/50 transition-all cursor-pointer shadow-sm"
                title={`Sesión de la nube activa: ${currentUser.email}`}
              >
                <Cloud size={14} className="text-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">NUBE ACTIVA</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 bg-amber-50/80 rounded-full text-xs font-sans font-semibold tracking-wide hover:bg-amber-100 transition-all animate-bounce cursor-pointer shadow-sm"
                title="Activar respaldo en la nube y sincronizar datos"
              >
                <CloudOff size={14} className="text-amber-500" />
                <span>RESPALDAR NUBE</span>
              </button>
            )}

             <button 
              onClick={() => setIsAddingChild(true)}
              className="flex px-5 py-2 border-2 border-brand-primary/80 text-brand-primary rounded-full text-xs font-sans font-bold tracking-widest hover:bg-brand-secondary hover:scale-105 transition-all cursor-pointer shadow-sm"
            >
              + NUEVO ALUMNO
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-full text-xs font-sans font-bold tracking-widest shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Upload size={14} className="inline mr-1.5 align-text-bottom" /> SUBIR DIBUJO
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        </header>

        {/* View Switcher */}
        {isAddingChild && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-white rounded-2xl border border-brand-primary/20 shadow-lg max-w-md"
          >
            <h2 className="text-lg font-bold text-brand-primary mb-4">Crear Perfil de Niño</h2>
            <form onSubmit={handleCreateChild} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Nombre</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newChildName} 
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full p-2 border border-brand-border rounded-lg outline-none focus:border-brand-primary text-sm"
                  placeholder="Ej: Mateo R."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Edad Aproximada</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={newChildAge} 
                  onChange={(e) => setNewChildAge(parseFloat(e.target.value))}
                  className="w-full p-2 border border-brand-border rounded-lg outline-none focus:border-brand-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-muted uppercase mb-1">Nivel Educativo</label>
                <select 
                  value={newChildLevel} 
                  onChange={(e) => setNewChildLevel(e.target.value)}
                  className="w-full p-2 border border-brand-border rounded-lg outline-none focus:border-brand-primary text-sm bg-white"
                >
                  <option value="Maternal">Maternal</option>
                  <option value="Prejardín">Prejardín</option>
                  <option value="Jardín">Jardín</option>
                  <option value="Transición">Transición</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">Guardar</button>
                <button type="button" onClick={() => setIsAddingChild(false)} className="bg-brand-accent text-brand-muted px-4 py-2 rounded-lg text-sm font-bold">Cancelar</button>
              </div>
            </form>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {view === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row gap-8 flex-1"
            >
              {/* Image Editor/Analyzer */}
              <div className="flex-1 bg-white rounded-[32px] shadow-sm border border-brand-border p-8 flex flex-col relative">
                <div className="absolute top-6 left-8 text-[10px] text-brand-muted font-sans tracking-widest uppercase">
                  Análisis Técnico Multimodal
                </div>
                
                <div className="flex-1 flex items-center justify-center bg-[#FCFBF9] rounded-2xl border-2 border-dashed border-brand-accent overflow-hidden group">
                  {image ? (
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                      <img src={image} alt="Drawing" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                      <button 
                        onClick={() => { setImage(null); setView('dashboard'); }}
                        className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-full text-brand-muted hover:text-red-500 shadow-md transition-all"
                      >
                         <LogOut size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-brand-muted italic">No hay imagen seleccionada</div>
                  )}
                </div>

                {/* Metadata card for Technique & Date selection */}
                <div className="mt-5 p-4 bg-brand-bg rounded-2xl border border-brand-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-widest font-sans">
                      Fecha del Dibujo
                    </label>
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full text-xs font-sans p-2 border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary bg-white text-brand-text shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-widest font-sans">
                      Técnica Utilizada
                    </label>
                    <div className="flex gap-2">
                      <select 
                        value={selectedTechnique}
                        onChange={(e) => setSelectedTechnique(e.target.value)}
                        className="flex-1 text-xs font-sans p-2 border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary bg-white text-brand-text shadow-sm"
                      >
                        <option value="Dibujo Libre">Dibujo Libre</option>
                        <option value="Lápices de Colores">Lápices de Colores</option>
                        <option value="Crayones">Crayones</option>
                        <option value="Acuarela">Acuarela</option>
                        <option value="Témpera">Témpera</option>
                        <option value="Carboncillo">Carboncillo</option>
                        <option value="Plastilina">Plastilina / Modelado</option>
                        <option value="Dactilopintura">Dactilopintura</option>
                        <option value="Tizas">Tizas</option>
                        <option value="Collage">Collage / Mixta</option>
                        <option value="Otro">Otro...</option>
                      </select>
                      {selectedTechnique === 'Otro' && (
                        <input 
                          type="text"
                          placeholder="Especificar..."
                          value={customTechnique}
                          onChange={(e) => setCustomTechnique(e.target.value)}
                          className="flex-1 text-xs font-sans p-2 border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary bg-white text-brand-text shadow-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex gap-4 text-[10px] font-sans tracking-tight text-brand-muted uppercase font-bold">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date().toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button
                    onClick={analyzeDrawing}
                    disabled={!image || isAnalyzing}
                    className={`flex items-center gap-2 px-8 py-3 rounded-full font-sans font-bold transition-all ${
                      !image || isAnalyzing 
                        ? 'bg-brand-accent text-brand-muted cursor-not-allowed' 
                        : 'bg-brand-primary text-white shadow-lg hover:bg-brand-primary/90 hover:-translate-y-0.5'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        IDENTIFICANDO PATRONES...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        EJECUTAR VALORACIÓN
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Assessment Sidebar */}
              <div className="w-full lg:w-96 flex flex-col gap-6">
                {!currentAnalysis ? (
                  <div className="bg-white rounded-[24px] p-8 border border-brand-border h-64 flex flex-col items-center justify-center text-center gap-4">
                    <FileText size={32} className="text-brand-accent" />
                    <p className="text-xs text-brand-muted leading-relaxed">
                      El motor de IA analizará trazos, color y composición espacial basados en la psicología evolutiva.
                    </p>
                    {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <section className="bg-white rounded-[24px] p-6 border border-brand-border shadow-sm">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-3">Estadío Detectado</h3>
                      <div className="text-2xl font-light leading-tight mb-2 tracking-tight">{currentAnalysis.stage}</div>
                      <p className="text-[11px] text-brand-muted italic leading-relaxed">{currentAnalysis.theory}</p>
                    </section>

                    {currentAnalysis.stageAnalysis && (
                      <section className="bg-white rounded-[24px] p-6 border border-brand-border shadow-sm space-y-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-brand-primary" />
                          Características de Evolución
                        </h3>
                        <div className="space-y-3 font-sans">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold text-brand-text">
                              <span>1. Formas Geométricas</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary uppercase font-sans font-medium">Analizado</span>
                            </div>
                            <p className="text-[11px] text-brand-muted leading-relaxed">{currentAnalysis.stageAnalysis.geometricShapes}</p>
                          </div>
                          
                          <div className="space-y-1 pt-2 border-t border-brand-border/40">
                            <div className="flex items-center justify-between text-xs font-bold text-brand-text">
                              <span>2. Intencionalidad Representativa</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary uppercase font-sans font-medium">Analizado</span>
                            </div>
                            <p className="text-[11px] text-brand-muted leading-relaxed">{currentAnalysis.stageAnalysis.recognizableIntent}</p>
                          </div>

                          <div className="space-y-1 pt-2 border-t border-brand-border/40">
                            <div className="flex items-center justify-between text-xs font-bold text-brand-text">
                              <span>3. Aparición de Detalles/Complejidad</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary uppercase font-sans font-medium">Analizado</span>
                            </div>
                            <p className="text-[11px] text-brand-muted leading-relaxed">{currentAnalysis.stageAnalysis.complexElements}</p>
                          </div>
                        </div>
                      </section>
                    )}

                    <section className="bg-white rounded-[24px] p-6 border border-brand-border shadow-sm">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-3">Observaciones Clave</h3>
                      <div className="space-y-4">
                        {currentAnalysis.keyObservations.map(obs => (
                          <div key={obs.id} className="border-l-2 border-brand-accent pl-3">
                            <p className="text-xs font-bold text-brand-text">{obs.title}</p>
                            <p className="text-[11px] text-brand-muted leading-relaxed">{obs.content}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="bg-brand-primary text-white rounded-[24px] p-6 shadow-xl space-y-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60">Análisis Pedagógico</h3>
                      <div className="space-y-4">
                         <div className="group">
                           <p className="text-xs font-bold text-white/50 mb-1">Figura Humana</p>
                           <p className="text-sm font-sans leading-snug">{currentAnalysis.analysisDetails.humanFigure}</p>
                         </div>
                         <div className="group">
                           <p className="text-xs font-bold text-white/50 mb-1">Animales</p>
                           <p className="text-sm font-sans leading-snug">{currentAnalysis.analysisDetails.animals || 'No identificados'}</p>
                         </div>
                         <div className="group">
                           <p className="text-xs font-bold text-white/50 mb-1">Objetos (Casa, Sol, Árbol)</p>
                           <p className="text-sm font-sans leading-snug">{currentAnalysis.analysisDetails.objects}</p>
                         </div>
                         <div className="group">
                           <p className="text-xs font-bold text-white/50 mb-1">Entorno y Espacio</p>
                           <p className="text-sm font-sans leading-snug">{currentAnalysis.analysisDetails.environment}</p>
                         </div>
                      </div>
                    </section>
                    
                    <section className="bg-[#EBE8E2] rounded-[24px] p-6 border border-brand-border">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-4">Orientaciones Pedagógicas</h3>
                       <div className="space-y-3">
                          {currentAnalysis.pedagogicalRecommendations.map((rec, i) => (
                            <div key={i} className="flex gap-3 text-xs leading-relaxed">
                               <span className="font-bold text-brand-primary opacity-50">{i+1}.</span>
                               <p className="text-brand-text">
                                 {/* @ts-ignore - handling potential object format from older versions */}
                                 {typeof rec === 'string' ? rec : (rec as any).recommendation || JSON.stringify(rec)}
                               </p>
                            </div>
                          ))}
                       </div>
                    </section>

                    <section className="bg-white rounded-[24px] p-6 border border-brand-primary/20 shadow-lg">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-4 flex items-center gap-2">
                         <Sparkles size={14} className="text-brand-primary" />
                         Actividades Sugeridas
                       </h3>
                       <div className="space-y-4">
                          {currentAnalysis.suggestedActivities?.map((activity, i) => (
                            <div key={i} className="flex gap-4 p-3 bg-brand-bg rounded-2xl border border-brand-border/50">
                               <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                 {i+1}
                               </div>
                               <p className="text-xs text-brand-text leading-snug">{activity}</p>
                            </div>
                          ))}
                          {!currentAnalysis.suggestedActivities && (
                            <p className="text-[10px] text-brand-muted italic">Vuelve a analizar el dibujo para generar actividades personalizadas.</p>
                          )}
                       </div>
                    </section>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col gap-8"
            >
              <div className="max-w-4xl w-full mx-auto space-y-10">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-light tracking-tight">Buscador Pedagógico</h2>
                  <p className="text-brand-muted font-sans text-sm max-w-lg mx-auto">
                    Consulta bases de datos académicas y recursos en la web sobre psicología del desarrollo y técnicas artísticas infantiles.
                  </p>
                </div>

                <form onSubmit={performPedagogicalSearch} className="relative">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej: ¿Cómo interpretar el uso del color rojo en niños de 4 años?"
                    className="w-full pl-6 pr-32 py-5 bg-white border border-brand-border rounded-[24px] shadow-xl outline-none focus:border-brand-primary transition-all text-lg placeholder:text-brand-muted/50 font-serif"
                  />
                  <button 
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-3 top-3 bottom-3 px-8 bg-brand-primary text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSearching ? 'BUSCANDO...' : 'BUSCAR'}
                  </button>
                </form>

                <div className="space-y-6">
                  {isSearching && (
                    <div className="flex flex-col items-center py-20 gap-4">
                      <div className="w-10 h-10 border-4 border-brand-accent border-t-brand-primary rounded-full animate-spin" />
                      <p className="text-brand-muted italic text-sm animate-pulse">Consultando fuentes de Google Search...</p>
                    </div>
                  )}

                  {error && (
                    <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-600">
                      <AlertCircle size={24} />
                      <span className="text-sm font-bold">{error}</span>
                    </div>
                  )}

                  {searchResponse && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                      <div className="lg:col-span-2 space-y-6">
                        {/* Title Highlight Card */}
                        <div className="bg-[#EBE8E2] p-6 rounded-[28px] border border-brand-border/80 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary font-sans">Consulta Resuelta</span>
                          </div>
                          <h3 className="text-2xl font-serif font-bold text-brand-text leading-tight tracking-tight">
                            {searchResponse.title}
                          </h3>
                        </div>

                        {/* Interactive Slide Display ("Resumen en forma de diapositiva con emojis") */}
                        {searchResponse.slide && (
                          <div className="bg-slate-900 text-white p-7 rounded-[32px] border border-slate-800 shadow-xl relative overflow-hidden min-h-[320px] flex flex-col justify-between font-sans">
                            {/* Decorative cosmic background glows */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-[60px] -mr-12 -mt-12 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-accent/15 rounded-full blur-[60px] -ml-12 -mb-12 pointer-events-none" />
                            
                            <div className="space-y-4 relative z-10">
                              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                </div>
                                <span className="text-[9px] font-sans font-bold tracking-[0.2em] text-white/50 bg-white/5 px-2.5 py-1 rounded-full uppercase">
                                  💡 Diapositiva Pedagógica
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <h4 className="text-xl font-serif font-bold text-brand-accent pr-10">
                                  {searchResponse.slide.title}
                                </h4>
                                <p className="text-[10px] font-sans text-white/60 uppercase tracking-widest font-bold">
                                  {searchResponse.slide.subtitle}
                                </p>
                              </div>

                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {searchResponse.slide.bullets.map((bullet, idx) => {
                                  // Find if there is an emoji at the start
                                  const emojiMatch = bullet.match(/^\s*([^\w\s\d,.:;()\/_+\-#\[\]]{1,2})/);
                                  const emoji = emojiMatch ? emojiMatch[1] : '📂';
                                  const textOnly = emojiMatch ? bullet.slice(emojiMatch[0].length).trim() : bullet;
                                  return (
                                    <li key={idx} className="flex gap-2.5 items-start text-[11px] text-white/90 leading-snug bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all duration-250 border border-white/5">
                                      <span className="text-sm leading-none shrink-0 mt-0.5">
                                        {emoji}
                                      </span>
                                      <span>
                                        {textOnly}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/10 text-[8px] text-white/40 uppercase tracking-widest relative z-10">
                              <span>Trazo & Dato — Síntesis Didáctica</span>
                              <span>Diapositiva 1 / 1</span>
                            </div>
                          </div>
                        )}

                        {/* Main detailed text summary */}
                        <section className="bg-white p-8 rounded-[32px] border border-brand-border shadow-sm space-y-4">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Sustento Teórico Completo</h3>
                          <div className="prose prose-brand max-w-none text-brand-text leading-relaxed font-serif text-base">
                            {searchResponse.body?.split('\n').map((para, i) => para.trim() ? <p key={i} className="mb-4">{para}</p> : null)}
                          </div>
                        </section>
                      </div>

                      <div className="space-y-6">
                        <section className="bg-brand-secondary p-6 rounded-[24px] border border-brand-border">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-4 flex items-center gap-2">
                             <ArrowRight size={14} /> Fuentes Consultadas
                          </h3>
                          <div className="space-y-3">
                            {searchResponse.sources.map((source, i) => (
                              <a 
                                key={i} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="block p-3 bg-white rounded-xl border border-brand-border hover:border-brand-primary hover:shadow-md transition-all group"
                              >
                                <p className="text-xs font-bold text-brand-text mb-1 line-clamp-1 group-hover:text-brand-primary">{source.title || 'Recurso Educativo'}</p>
                                <p className="text-[9px] text-brand-muted truncate uppercase tracking-tighter">{new URL(source.uri).hostname}</p>
                              </a>
                            ))}
                            {searchResponse.sources.length === 0 && (
                              <p className="text-[10px] text-brand-muted italic">No se recuperaron enlaces directos, pero la información fue sintetizada.</p>
                            )}
                          </div>
                        </section>

                        <div className="p-6 bg-brand-primary text-white rounded-[24px] shadow-xl">
                          <Sparkles size={24} className="mb-4 opacity-50" />
                          <p className="text-xs font-serif leading-relaxed italic">
                            Recuerda validar esta información con el contexto específico de tu grupo y las directrices institucionales.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div className="space-y-1">
                  <h2 className="text-3xl font-light flex items-center gap-4">
                    <Database size={28} className="text-brand-primary" />
                    Historial: {selectedChild?.name}
                  </h2>
                  <p className="text-xs text-brand-muted font-sans pl-11">
                    Seguimiento evolutivo de expresión gráfica ({selectedChild?.ageAtProfile} años • {selectedChild?.level})
                  </p>
                </div>
                
                <div className="flex items-center flex-wrap gap-2.5">
                  <div className="text-xs font-bold text-brand-muted bg-brand-accent/50 px-4 py-2 rounded-full uppercase tracking-widest font-sans">
                    {selectedChild?.drawings.length} registros
                  </div>
                  
                  {selectedChild && selectedChild.drawings.length > 0 && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => exportToJSON(selectedChild)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-brand-accent/30 text-brand-primary border border-brand-border hover:border-brand-primary rounded-xl font-bold font-sans text-xs transition-all shadow-sm cursor-pointer"
                        title="Exportar historia de dibujos en formato JSON"
                      >
                        <Download size={14} /> EXPORTAR JSON
                      </button>
                      
                      <button 
                        onClick={() => exportToCSV(selectedChild)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-brand-accent/30 text-brand-primary border border-brand-border hover:border-brand-primary rounded-xl font-bold font-sans text-xs transition-all shadow-sm cursor-pointer"
                        title="Exportar historia de dibujos en formato CSV para Excel/Sheets"
                      >
                        <Download size={14} /> EXPORTAR CSV
                      </button>

                      <button 
                        onClick={() => exportToPDF(selectedChild)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl font-bold font-sans text-xs transition-all shadow-md cursor-pointer"
                        title="Descargar informe completo del alumno en PDF"
                      >
                        <FileText size={14} /> DESCARGAR INFORME PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Filtros de Historial */}
              {selectedChild && selectedChild.drawings.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-brand-border/80 shadow-sm mb-8 space-y-4 font-sans text-xs">
                  <div className="flex items-center justify-between border-b border-brand-border/40 pb-2.5">
                    <h3 className="font-bold text-brand-text flex items-center gap-2">
                      <Search size={14} className="text-brand-primary" />
                      Filtros de Expresión Gráfica y Evolución
                    </h3>
                    {(filterCreationDate || filterTechnique !== 'Todas' || filterStage !== 'Todas') && (
                      <button 
                        onClick={clearHistoryFilters}
                        className="text-brand-primary hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        Limpiar todos los filtros
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Fecha de Creación */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                        Fecha de Creación
                      </label>
                      <input 
                        type="date"
                        value={filterCreationDate}
                        onChange={(e) => setFilterCreationDate(e.target.value)}
                        className="w-full text-xs p-2 border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary bg-white text-brand-text"
                      />
                    </div>
                    
                    {/* Técnica */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                        Técnica Usada
                      </label>
                      <select
                        value={filterTechnique}
                        onChange={(e) => setFilterTechnique(e.target.value)}
                        className="w-full text-xs p-2 border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary bg-white text-brand-text"
                      >
                        <option value="Todas">Todas las técnicas</option>
                        <option value="Dibujo Libre">Dibujo Libre</option>
                        <option value="Figura del Cuerpo Humano">Figura del Cuerpo Humano</option>
                        <option value="Líneas y Formas">Líneas y Formas</option>
                      </select>
                    </div>
                    
                    {/* Estadio */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-brand-muted uppercase tracking-wider">
                        Estadío de Desarrollo
                      </label>
                      <select
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                        className="w-full text-xs p-2 border border-brand-border rounded-xl focus:outline-none focus:border-brand-primary bg-white text-brand-text"
                      >
                        <option value="Todas">Todos los estadios</option>
                        {uniqueStages.map((stg, idx) => {
                          const ageRange = getStageAgeRange(stg);
                          return (
                            <option key={idx} value={stg}>
                              {stg} {ageRange ? `(edad esp. ${ageRange})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
                {filteredDrawings.map(dw => (
                  <motion.div 
                    key={dw.id} 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-[40px] border border-brand-border overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col md:flex-row h-72"
                  >
                     <div 
                      className="w-full md:w-1/2 bg-brand-bg relative overflow-hidden cursor-pointer" 
                      onClick={() => {
                        setImage(dw.imageUrl);
                        setCurrentAnalysis(dw.analysis || null);
                        setView('analysis');
                      }}
                     >
                        <img src={dw.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-brand-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Search className="text-white" size={32} />
                        </div>
                     </div>
                     <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-brand-primary mb-3">
                            <Calendar size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {new Date(dw.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className="text-[9px] font-bold text-brand-muted uppercase tracking-[0.2em] mb-0.5">Estadío Detectado</h3>
                            <p className="text-xl font-light text-brand-text leading-tight mb-2">
                              {dw.analysis?.stage || 'Pendiente de Análisis'}
                            </p>
                            <div className="flex">
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-accent/50 text-brand-primary font-bold font-sans">
                                {dw.technique || 'Dibujo Libre'}
                              </span>
                            </div>
                          </div>
                        </div>
 
                        <button 
                          onClick={() => {
                            setImage(dw.imageUrl);
                            setCurrentAnalysis(dw.analysis || null);
                            setView('analysis');
                          }}
                          className="flex items-center justify-center gap-2 w-full py-4 bg-brand-primary text-white text-[10px] font-bold rounded-2xl hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/10 uppercase tracking-widest cursor-pointer"
                        >
                          <FileText size={14} /> VER VALORACIÓN
                        </button>
                     </div>
                  </motion.div>
                ))}
                
                {selectedChild && selectedChild.drawings.length > 0 && filteredDrawings.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center gap-5 bg-white rounded-[40px] border border-brand-border">
                    <Database size={36} className="text-brand-accent" />
                    <p className="text-sm text-brand-muted italic text-center">No se encontraron dibujos que coincidan con los filtros seleccionados.</p>
                    <button 
                      onClick={clearHistoryFilters}
                      className="px-6 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold font-sans shadow-md hover:scale-105 transition-transform cursor-pointer"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                )}

                {selectedChild?.drawings.length === 0 && (
                  <div className="col-span-full py-32 flex flex-col items-center gap-6 bg-white rounded-[40px] border-2 border-dashed border-brand-accent opacity-60">
                    <Database size={48} className="text-brand-accent" />
                    <p className="text-xl text-brand-muted italic">Sin registros gráficos para este alumno aún.</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-8 py-3 bg-brand-primary text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform"
                    >
                      Subir Primer Dibujo
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 space-y-12"
            >
              <section>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-6">Mis Alumnos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                   {children.map(child => (
                     <button 
                       key={child.id}
                       onClick={() => { setSelectedChildId(child.id); setView('history'); }}
                       className={`p-6 rounded-[32px] border transition-all flex flex-col items-center gap-4 group ${
                         selectedChildId === child.id 
                          ? 'bg-brand-primary text-brand-bg border-brand-primary shadow-2xl scale-105' 
                          : 'bg-white border-brand-border hover:border-brand-primary hover:shadow-xl'
                       }`}
                     >
                       <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-transparent group-hover:border-brand-primary/20 transition-all">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`} alt={child.name} />
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="font-bold text-base tracking-tight">{child.name}</span>
                          <span className={`text-[10px] font-sans font-medium ${selectedChildId === child.id ? 'opacity-60' : 'text-brand-muted'}`}>
                            {child.ageAtProfile} años • {child.level}
                          </span>
                       </div>
                     </button>
                   ))}
                   <button 
                    onClick={() => setIsAddingChild(true)}
                    className="p-6 rounded-[32px] border-2 border-dashed border-brand-border flex flex-col items-center justify-center gap-4 text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-all group"
                   >
                     <div className="w-16 h-16 rounded-full bg-brand-bg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">+</div>
                     <span className="text-[10px] font-bold uppercase">Nuevo Alumno</span>
                   </button>
                </div>
              </section>

              <section className="bg-white rounded-[40px] p-10 border border-brand-border shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-8">Guía de Referencia Técnica (3-6 años)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                      <User size={16} /> Figuras Humanas
                    </div>
                    <ul className="text-[11px] text-brand-muted space-y-2 list-disc pl-4 font-sans">
                      <li><strong>Cabeza/Ojos:</strong> Primeros rasgos de identidad y contacto.</li>
                      <li><strong>Extremidades:</strong> Indican conciencia del propio cuerpo y acción.</li>
                      <li><strong>Proporción:</strong> Refleja la importancia emocional del sujeto.</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                       <CheckCircle2 size={16} /> Objetos
                    </div>
                    <ul className="text-[11px] text-brand-muted space-y-2 list-disc pl-4 font-sans">
                      <li><strong>Casa:</strong> Representación del entorno familiar y seguridad.</li>
                      <li><strong>Árbol:</strong> Reflejo del crecimiento y esquema corporal.</li>
                      <li><strong>Sol/Nubes:</strong> Conciencia del tiempo y clima emocional.</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                       <Sparkles size={16} /> Animales
                    </div>
                    <ul className="text-[11px] text-brand-muted space-y-2 list-disc pl-4 font-sans">
                      <li><strong>Detalles:</strong> Muestran capacidad de observación del entorno real.</li>
                      <li><strong>Interacción:</strong> Proyecta habilidades sociales y empatía.</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                       <FileText size={16} /> Entorno
                    </div>
                    <ul className="text-[11px] text-brand-muted space-y-2 list-disc pl-4 font-sans">
                      <li><strong>Césped/Flores:</strong> Sensibilidad estética y arraigo.</li>
                      <li><strong>Carretera/Línea:</strong> Necesidad de orden y estructuración espacial.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-[40px] p-10 border border-brand-border shadow-sm flex flex-col md:flex-row gap-10 items-center">
                 <div className="flex-1 space-y-4">
                    <h2 className="text-3xl font-light tracking-tight">Soberanía de Datos Pedagógicos</h2>
                    <p className="text-sm text-brand-muted leading-relaxed font-sans">
                      Trazo & Dato utiliza procesamiento local y multimodal para asegurar que la privacidad de los menores sea absoluta. 
                      La IA actúa como un mediador reflexivo, guiando su planeación curricular desde la evidencia técnica.
                    </p>
                    <button className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-widest hover:gap-3 transition-all">
                      Conocer más sobre Lowenfeld <ArrowRight size={14} />
                    </button>
                 </div>
                 <div className="w-full md:w-64 aspect-video bg-brand-secondary rounded-3xl flex items-center justify-center text-brand-primary opacity-20">
                    <Sparkles size={64} />
                 </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Términos de Servicio y Consentimiento de Privacidad (Aviso de Privacidad de Datos para Menores) */}
      <AnimatePresence>
        {showTerms && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand-secondary/85 backdrop-blur-md p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] border border-brand-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-brand-border/60 bg-brand-bg/60 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shrink-0">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-brand-text tracking-tight font-serif text-left">
                    Términos y Consentimiento
                  </h2>
                  <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest font-sans mt-0.5 text-left">
                    Tratamiento Seguro de Datos Sensibles
                  </p>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm text-brand-text/95 font-sans leading-relaxed text-left">
                <div className="p-4 rounded-2xl bg-brand-accent/40 border border-brand-primary/10 flex gap-3 text-xs leading-normal">
                  <AlertCircle size={18} className="text-brand-primary shrink-0 mt-0.5" />
                  <p className="text-brand-primary font-medium">
                    Por favor, lea con atención las siguientes directrices y políticas de soberanía de datos del menor antes de proceder con el uso clínico-educativo de <strong>Trazo & Dato</strong>.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-border/40 pb-1">
                    <Lock size={12} className="text-brand-primary" />
                    1. Privacidad Infantil Absoluta
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Trazo & Dato ha sido diseñado bajo estrictos parámetros éticos. No recolectamos información que identifique de manera directa a los menores de edad. Solo procesamos representaciones gráficas y metadatos pedagógicos contextuales ingresados bajo el criterio exclusivo del docente o profesional a cargo.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-border/40 pb-1">
                    <Shield size={12} className="text-brand-primary" />
                    2. Consentimiento Institucional y de Tutores
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Al utilizar esta aplicación, usted declara, certifica y garantiza que cuenta con las debidas autorizaciones previas y consentimientos expresos de los padres, tutores legales, o directores de la institución educativa para recolectar y subir los dibujos del menor a este sistema de apoyo interpretativo.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-border/40 pb-1">
                    <FileText size={12} className="text-brand-primary" />
                    3. Herramienta de Apoyo - No Diagnóstico Clínico
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    La inteligencia artificial de Trazo & Dato provee un análisis inductivo y de apoyo pedagógico basado en la teoría del desarrollo infantil de Viktor Lowenfeld. <strong>No constituye, de ninguna manera, un diagnóstico clínico, médico o psicológico oficial.</strong> Toda observación o sospecha de anomalía emocional debe ser canalizada y derivada con un especialista credencializado en psicología clínica infantil.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider flex items-center gap-1.5 border-b border-brand-border/40 pb-1">
                    <CheckCircle2 size={12} className="text-brand-primary" />
                    4. Procesamiento de IA y Seguridad
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Las imágenes se envían de forma segura solo con fines de análisis estructural de trazos y elementos. Al aceptar, usted autoriza el procesamiento técnico para la generación de recomendaciones pedagógicas personalizadas.
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 bg-brand-bg border-t border-brand-border/60 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <span className="text-[10px] text-brand-muted font-sans font-medium">
                  Versión de Privacidad 2026.1 — Cumple con el marco ético Lowenfeld.
                </span>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setShowTerms(false);
                    }}
                    className="flex-1 sm:flex-none px-6 py-3 bg-white border border-brand-border text-brand-muted hover:text-brand-primary hover:border-brand-primary text-xs font-bold rounded-2xl transition-all cursor-pointer font-sans"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('trazo_dato_accepted_terms', 'true');
                      setShowTerms(false);
                    }}
                    className="flex-1 sm:flex-none px-8 py-3 bg-brand-primary text-white text-xs font-bold rounded-2xl hover:bg-brand-primary/95 transition-all shadow-lg shadow-brand-primary/15 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide font-sans"
                  >
                    <CheckCircle2 size={14} /> Aceptar y Habilitar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Autenticación Firebase (Registro/Login) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand-secondary/85 backdrop-blur-md p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] border border-brand-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-brand-border/60 bg-brand-bg/60 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shrink-0">
                  <Key size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-brand-text tracking-tight font-serif text-left">
                    {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  </h2>
                  <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest font-sans mt-0.5 text-left">
                    Respaldar Informes en la Nube
                  </p>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAuthSubmit} className="p-8 space-y-6 text-left font-sans">
                {authError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-3 text-xs text-rose-600 leading-normal">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {resetSentSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3 text-xs text-emerald-600 leading-normal animate-fade-in">
                    <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-500" />
                    <span>{resetSentSuccess}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block">
                    Correo Electrónico Docente
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input 
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="ejemplo@escuela.com"
                      className="w-full pl-12 pr-4 py-3 bg-brand-secondary/50 border border-brand-border rounded-2xl text-sm focus:outline-none focus:border-brand-primary text-brand-text transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-brand-muted uppercase tracking-wider block">
                      Contraseña
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        disabled={resetLoading}
                        className="text-xs text-brand-primary hover:underline cursor-pointer focus:outline-none disabled:opacity-50"
                      >
                        {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 bg-brand-secondary/50 border border-brand-border rounded-2xl text-sm focus:outline-none focus:border-brand-primary text-brand-text transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary p-1 cursor-pointer focus:outline-none"
                      title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-4 bg-brand-primary text-white text-xs font-bold rounded-2xl hover:bg-brand-primary/95 transition-all shadow-lg shadow-brand-primary/15 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
                  >
                    {authLoading ? 'Iniciando...' : (authMode === 'login' ? 'Ingresar y Sincronizar' : 'Registrar y Sincronizar')}
                  </button>
                </div>

                <div className="text-center pt-4 border-t border-brand-border/40 font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setAuthError(null);
                    }}
                    className="text-xs text-brand-primary hover:underline cursor-pointer"
                  >
                    {authMode === 'login' ? '¿No tienes una cuenta? Regístrate aquí' : '¿Ya tienes una cuenta? Inicia sesión aquí'}
                  </button>
                </div>
              </form>

              {/* Action Footer */}
              <div className="p-6 bg-brand-bg border-t border-brand-border/60 flex items-center justify-between">
                <span className="text-[10px] text-brand-muted font-sans font-medium">
                  Soberanía de datos garantizada.
                </span>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-brand-border text-brand-muted hover:text-brand-primary hover:border-brand-primary text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Printable PDF Report (Hidden on screen, visible only during window.print()) */}
      {selectedChild && (
        <div id="printable-report" className="p-10 text-black bg-white select-text font-sans">
          <div className="border-b-4 border-brand-primary pb-5 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-serif font-bold text-brand-primary tracking-tight">
                INFORME EVOLUTIVO DE EXPRESIÓN PLÁSTICA
              </h1>
              <p className="text-sm font-sans text-brand-muted font-bold tracking-wide mt-1 uppercase">
                Análisis de Psicología del Desarrollo y Madurez Gráfica Infantil
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold text-brand-primary font-serif italic text-sm">Trazo & Dato</p>
              <p className="text-brand-muted mt-1">{new Date().toLocaleDateString('es-CO')}</p>
            </div>
          </div>

          <p className="text-xs font-sans text-brand-muted uppercase tracking-widest font-bold mb-4">
            Resumen General del Alumno
          </p>

          {/* Student Header Summary Card */}
          <div className="grid grid-cols-2 gap-6 bg-brand-bg p-5 rounded-2xl border border-brand-border mb-8">
            <div className="space-y-2 text-xs">
              <p className="flex justify-between border-b border-brand-border/60 pb-1">
                <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Estudiante:</span>
                <span className="font-bold text-brand-text text-right">{selectedChild.name}</span>
              </p>
              <p className="flex justify-between border-b border-brand-border/60 pb-1">
                <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Nivel Educativo:</span>
                <span className="font-bold text-brand-text text-right">{selectedChild.level}</span>
              </p>
            </div>
            <div className="space-y-2 text-xs">
              <p className="flex justify-between border-b border-brand-border/60 pb-1">
                <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Edad de Registro:</span>
                <span className="font-bold text-brand-text text-right">{selectedChild.ageAtProfile} años</span>
              </p>
              <p className="flex justify-between border-b border-brand-border/60 pb-1">
                <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Expedientes Evaluados:</span>
                <span className="font-bold text-brand-text text-right">{selectedChild.drawings.length} dibujos</span>
              </p>
            </div>
          </div>

          {/* Section 1: Detailed Drawings Evidence with requested structured headers */}
          <div className="space-y-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-primary border-b border-brand-primary pb-1.5 mb-4">
              I. Registro Técnico y Evidencia Histórica de Sesiones
            </h2>
            
            {selectedChild.drawings.length > 0 ? (
              <div className="space-y-10">
                {selectedChild.drawings.map((dw, index) => (
                  <div key={dw.id} className="border-2 border-brand-border rounded-3xl p-6 bg-white space-y-4 shadow-none break-inside-avoid print-card mb-8">
                    {/* ENCABEZADO SOLICITADO POR EL USUARIO */}
                    <div className="bg-brand-bg/60 p-5 rounded-2xl border border-brand-border/80 space-y-3">
                      <div className="flex justify-between items-center border-b border-brand-border/50 pb-2">
                        <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-brand-primary">
                          EXPEDIENTE DE DIBUJO #{index + 1}
                        </span>
                        <span className="bg-brand-primary/10 text-brand-primary font-bold px-3 py-1 rounded-full text-[10px]">
                          Trazo & Dato
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-xs text-brand-text">
                        <p className="flex justify-between border-b border-brand-border/30 pb-1">
                          <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Estudiante:</span>
                          <span className="font-bold text-right">{selectedChild.name}</span>
                        </p>
                        <p className="flex justify-between border-b border-brand-border/30 pb-1">
                          <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Fecha de Elaboración del Dibujo:</span>
                          <span className="font-bold text-right">
                            {new Date(dw.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </p>
                        <p className="flex justify-between border-b border-brand-border/30 pb-1">
                          <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Edad del Estudiante:</span>
                          <span className="font-bold text-right">{selectedChild.ageAtProfile} años</span>
                        </p>
                        <p className="flex justify-between border-b border-brand-border/30 pb-1">
                          <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Docente y Nivel:</span>
                          <span className="font-bold text-right">
                            {currentUser ? currentUser.email : "Docente Evaluador"} — {selectedChild.level}
                          </span>
                        </p>
                        <p className="flex justify-between border-b border-brand-border/30 pb-1 col-span-2">
                          <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Técnica Usada:</span>
                          <span className="font-bold text-brand-primary text-right">{dw.technique || 'Dibujo Libre'}</span>
                        </p>
                        <p className="flex justify-between border-b border-brand-border/30 pb-1 col-span-2">
                          <span className="text-brand-muted font-bold uppercase tracking-wider text-[9px]">Estadio de Desarrollo:</span>
                          <span className="font-bold text-brand-primary text-right">{dw.analysis?.stage || 'Pendiente de Análisis'}</span>
                        </p>
                      </div>
                    </div>

                    {/* VALORACIÓN PEDAGÓGICA GENERADA */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                          Valoración Pedagógica Generada
                        </h3>
                        <p className="text-brand-text font-serif leading-relaxed text-xs bg-brand-bg/25 p-4 rounded-xl border border-brand-border/30">
                          {dw.analysis?.description || 'Sesión pendiente de análisis. No se cuenta con informe descriptivo guardado para este dibujo.'}
                        </p>
                      </div>

                      {dw.analysis && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                          <div className="md:col-span-8 space-y-3">
                            <div>
                              <strong className="text-brand-muted text-[9px] uppercase font-bold tracking-wider block mb-0.5">Sustento Teórico y Teorías del Desarrollo:</strong>
                              <p className="text-brand-muted font-serif italic text-[11px] leading-relaxed mt-0.5">{dw.analysis.theory}</p>
                            </div>
                            
                            {dw.analysis.pedagogicalRecommendations && dw.analysis.pedagogicalRecommendations.length > 0 && (
                              <div className="pt-1.5">
                                <strong className="text-brand-muted text-[9px] uppercase font-bold tracking-wider block mb-1">Actuaciones Pedagógicas Recomendadas:</strong>
                                <ul className="list-disc pl-4 space-y-1 text-brand-text text-[11px] leading-relaxed">
                                  {dw.analysis.pedagogicalRecommendations.slice(0, 3).map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          
                          <div className="md:col-span-4 bg-brand-bg/30 p-4 rounded-xl border border-brand-border/30 space-y-2 text-[10px] self-start">
                            <p className="font-bold text-[9px] uppercase tracking-widest text-brand-muted border-b border-brand-border pb-1 mb-1.5">Pautas Clínico-Estructurales</p>
                            <p className="pb-1 border-b border-brand-border/20">
                              <strong className="block text-brand-muted uppercase text-[8px] tracking-wider mb-0.5">Formas Geometrizadas:</strong> 
                              {dw.analysis.stageAnalysis?.geometricShapes || "Detalles básicos consolidados"}
                            </p>
                            <p className="pb-1 border-b border-brand-border/20">
                              <strong className="block text-brand-muted uppercase text-[8px] tracking-wider mb-0.5">Intencionalidad Figurada:</strong> 
                              {dw.analysis.stageAnalysis?.recognizableIntent || "Reconocimiento a posteriori"}
                            </p>
                            <p className="pb-1 border-b border-brand-border/20">
                              <strong className="block text-brand-muted uppercase text-[8px] tracking-wider mb-0.5">Complejidad y Estructuración:</strong> 
                              {dw.analysis.stageAnalysis?.complexElements || "Detalles típicos del rango de edad"}
                            </p>
                            {dw.notes && (
                              <div className="pt-1">
                                <strong className="text-brand-muted uppercase text-[8px] tracking-wider block mb-0.5">Observaciones de Aula:</strong>
                                <span className="text-brand-text leading-tight block italic">{dw.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-muted italic text-center py-10 bg-brand-bg rounded-2xl border border-brand-border">
                No se registran sesiones de dibujo en el expediente clínico-educativo del menor.
              </p>
            )}
          </div>

          {/* Section 2: Institutional Signatures */}
          <div className="pt-16 mt-16 border-t-2 border-brand-border flex justify-between items-center break-inside-avoid print-card text-center">
            <div className="w-64">
              <div className="border-b border-brand-border h-10 w-48 mx-auto mb-2"></div>
              <p className="font-bold text-xs text-brand-text uppercase font-sans tracking-wide">Firma del Docente / Evaluador</p>
              <p className="text-[10px] text-brand-muted font-sans mt-0.5">Responsable de Diagnóstico y Planificación</p>
            </div>
            <div className="w-64">
              <div className="h-10 flex items-end justify-center mb-2">
                <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">{new Date().toLocaleDateString('es-CO')}</span>
              </div>
              <div className="border-b border-brand-border w-48 mx-auto pb-0.5"></div>
              <p className="font-bold text-xs text-brand-text uppercase font-sans tracking-wide">Fecha de Documento</p>
              <p className="text-[10px] text-brand-muted font-sans mt-0.5">Validado en Plataforma Trazo & Dato</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

const getStageAgeRange = (stage: string): string => {
  const s = stage.toLowerCase();
  if (s.includes('desordenado') || s.includes('descontrolado')) return '1.5 - 3 años';
  if (s.includes('controlado')) return '2 - 4 años';
  if (s.includes('nombre')) return '3 - 4 años';
  if (s.includes('preesquemática') || s.includes('preesquematica')) return '4 - 7 años';
  if (s.includes('esquemática') || s.includes('esquematica')) return '7 - 9 años';
  return '';
};

function NavItem({ 
  icon, 
  active = false, 
  onClick 
}: { 
  icon: React.ReactNode, 
  active?: boolean, 
  onClick?: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className={`
      w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group/item
      ${active 
        ? 'bg-gradient-to-tr from-brand-primary to-brand-accent text-white shadow-lg shadow-brand-primary/30 scale-110' 
        : 'text-brand-muted hover:bg-brand-bg hover:text-brand-primary'}
    `}>
      {!active && (
        <span className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 to-brand-accent/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
      )}
      <div className="relative z-10">{icon}</div>
    </button>
  );
}
