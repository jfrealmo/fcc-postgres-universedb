import { useState, useEffect, useRef } from 'react';
import { Send, BookOpen, Users, BarChart3, Home, Menu, X, MessageSquare, Award, Shield, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import { PieChart } from 'react-minimal-pie-chart';

// Interfaces para tipar datos
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Skill {
  id: string;
  name: string;
  icon: string;
  description: string;
  salary: string;
  color: string;
  roadmap: {
    beginner: { duration: string; topics: string[]; resources: string[] };
    intermediate: { duration: string; topics: string[]; resources: string[] };
    advanced: { duration: string; topics: string[]; resources: string[] };
  };
}

interface Community {
  name: string;
  description: string;
  icon: string;      // Emoji o string
  platform: string;  // Ej: 'Discord', 'Telegram'
  members: string;   // Texto formateado: '2,450'
  tags: string[];    // Lista de etiquetas
}



const EduchatBot = () => {
  const [currentPage, setCurrentPage] = useState('consent');
  const [consentGiven, setConsentGiven] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [topicStats, setTopicStats] = useState<Record<string, number>>({});
  const [hourlyStats, setHourlyStats] = useState<Record<string, number>>({});
  const [requestTypes, setRequestTypes] = useState<Record<string, number>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analytics, setAnalytics] = useState<{
  totalInteractions: number;
  uniqueUsers: Set<string>;
  topicStats: Record<string, number>;
  hourlyStats: Record<string, number>;
  requestTypes: Record<string, number>;
  satisfactionRatings: number[];
}>({
  totalInteractions: 0,
  uniqueUsers: new Set(),
  topicStats: {},
  hourlyStats: {},
  requestTypes: {},
  satisfactionRatings: []
});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (consentGiven && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '¡Hola! 👋 Soy tu asistente virtual educativo. ¿En qué puedo ayudarte hoy? Puedo ayudarte con:\n\n📅 Calendario académico\n📄 Trámites y certificados\n📚 Recursos educativos\n🏫 Información institucional'
      }]);
      setAnalytics(prev => {
        const newUsers = new Set(prev.uniqueUsers);
        newUsers.add(Date.now().toString());
        return { ...prev, uniqueUsers: newUsers };
      });
    }
  }, [consentGiven]);

  const knowledgeBase = {
    'calendario': {
      keywords: ['calendario', 'fechas', 'inicio', 'clases', 'periodo', 'vacaciones'],
      response: '📅 **Calendario Académico 2025**\n\n• Inicio de clases: Enero 22, 2025\n• Fin primer periodo: Abril 10, 2025\n• Vacaciones mitad de año: Junio 15 - Julio 13, 2025\n• Inicio segundo semestre: Julio 14, 2025\n• Finalización año escolar: Noviembre 28, 2025'
    },
    'horarios': {
      keywords: ['horario', 'hora', 'clase', 'asignatura'],
      response: '⏰ **Horarios de Clase**\n\nLunes a Viernes: 7:00 AM - 2:00 PM\n• 1° Bloque: 7:00 - 8:30 AM\n• 2° Bloque: 8:30 - 10:00 AM\n• Descanso: 10:00 - 10:30 AM\n• 3° Bloque: 10:30 - 12:00 PM\n• 4° Bloque: 12:00 - 2:00 PM'
    },
    'tramites': {
      keywords: ['certificado', 'constancia', 'tramite', 'documento', 'paz y salvo'],
      response: '📄 **Trámites Disponibles**\n\n1. Certificados de estudio (3 días hábiles)\n2. Constancias de matrícula (24 horas)\n3. Paz y salvo académico (5 días hábiles)\n4. Duplicado de carnet (1 semana)\n\n**Requisitos**: Estar a paz y salvo y presentar documento de identidad.'
    },
    'rutas': {
      keywords: ['ruta', 'bus', 'transporte', 'escolar'],
      response: '🚌 **Rutas Escolares**\n\n• Ruta Norte: Salida 6:00 AM\n• Ruta Sur: Salida 6:15 AM\n• Ruta Occidente: Salida 6:00 AM\n• Ruta Oriente: Salida 6:20 AM\n\nRetorno: 2:30 PM desde la institución'
    },
    'recursos': {
      keywords: ['recurso', 'material', 'video', 'guia', 'pdf'],
      response: '📚 **Recursos Educativos**\n\n• Khan Academy: https://es.khanacademy.org\n• Colombia Aprende: https://colombiaaprende.edu.co\n• Recursos PDF por grado disponibles en nuestra biblioteca digital\n• Videos educativos en nuestro canal de YouTube'
    }
  };

  const skills = [
    {
      id: 'python',
      name: 'Programación Python',
      icon: '🐍',
      description: 'Lenguaje versátil para desarrollo web, ciencia de datos e IA',
      salary: '$2.5M - $5M COP/mes',
      color: 'from-blue-500 to-blue-700',
      roadmap: {
        beginner: {
          duration: '3-6 meses',
          topics: ['Sintaxis básica', 'Variables y tipos de datos', 'Estructuras de control', 'Funciones', 'Listas y diccionarios'],
          resources: ['Python.org Tutorial', 'Codecademy Python', 'SoloLearn']
        },
        intermediate: {
          duration: '6-12 meses',
          topics: ['POO', 'Manejo de archivos', 'APIs y requests', 'Pandas y NumPy', 'Flask/Django básico'],
          resources: ['Real Python', 'Coursera Python', 'Proyectos en GitHub']
        },
        advanced: {
          duration: '12-24 meses',
          topics: ['Machine Learning', 'Data Science avanzado', 'Async programming', 'Testing y deployment', 'Arquitecturas escalables'],
          resources: ['Fast.ai', 'Deep Learning Specialization', 'Proyectos complejos']
        }
      }
    },
    {
      id: 'webdev',
      name: 'Desarrollo Web',
      icon: '💻',
      description: 'HTML, CSS, JavaScript y frameworks modernos',
      salary: '$2M - $4.5M COP/mes',
      color: 'from-purple-500 to-purple-700',
      roadmap: {
        beginner: {
          duration: '3-6 meses',
          topics: ['HTML5 semántico', 'CSS3 y Flexbox', 'JavaScript básico', 'Git y GitHub', 'Responsive design'],
          resources: ['FreeCodeCamp', 'MDN Web Docs', 'W3Schools']
        },
        intermediate: {
          duration: '6-12 meses',
          topics: ['React o Vue.js', 'APIs REST', 'Node.js básico', 'Base de datos SQL', 'Tailwind CSS'],
          resources: ['React Docs', 'Frontend Masters', 'Udemy']
        },
        advanced: {
          duration: '12-24 meses',
          topics: ['Next.js/Nuxt.js', 'TypeScript', 'Testing (Jest)', 'CI/CD', 'Arquitectura frontend'],
          resources: ['Advanced React', 'System Design', 'Open Source']
        }
      }
    },
    {
      id: 'datascience',
      name: 'Ciencia de Datos & IA',
      icon: '🤖',
      description: 'Análisis de datos, ML y Deep Learning',
      salary: '$3M - $7M COP/mes',
      color: 'from-green-500 to-green-700',
      roadmap: {
        beginner: {
          duration: '4-6 meses',
          topics: ['Python para datos', 'Pandas y NumPy', 'Visualización (Matplotlib)', 'Estadística básica', 'SQL'],
          resources: ['DataCamp', 'Kaggle Learn', 'Google Colab']
        },
        intermediate: {
          duration: '8-12 meses',
          topics: ['Machine Learning (sklearn)', 'Feature engineering', 'Modelos supervisados', 'Evaluación de modelos', 'Big Data básico'],
          resources: ['Coursera ML', 'Fast.ai', 'Kaggle Competitions']
        },
        advanced: {
          duration: '12-24 meses',
          topics: ['Deep Learning (TensorFlow/PyTorch)', 'NLP', 'Computer Vision', 'MLOps', 'Investigación aplicada'],
          resources: ['Deep Learning.ai', 'Papers con código', 'Proyectos reales']
        }
      }
    },
    {
      id: 'marketing',
      name: 'Marketing Digital',
      icon: '📱',
      description: 'SEO, redes sociales y estrategias digitales',
      salary: '$1.8M - $4M COP/mes',
      color: 'from-pink-500 to-pink-700',
      roadmap: {
        beginner: {
          duration: '2-4 meses',
          topics: ['Fundamentos de marketing', 'Redes sociales', 'Copywriting básico', 'Google Analytics', 'Email marketing'],
          resources: ['Google Skillshop', 'HubSpot Academy', 'Meta Blueprint']
        },
        intermediate: {
          duration: '6-10 meses',
          topics: ['SEO avanzado', 'SEM y Google Ads', 'Marketing automation', 'Estrategia de contenidos', 'Analytics avanzado'],
          resources: ['Moz SEO', 'Semrush Academy', 'Certificaciones Google']
        },
        advanced: {
          duration: '12-18 meses',
          topics: ['Growth hacking', 'Marketing analytics', 'CRO', 'Estrategia omnicanal', 'Marketing con IA'],
          resources: ['CXL Institute', 'Reforge', 'Casos de estudio']
        }
      }
    },
    {
      id: 'uxui',
      name: 'Diseño UX/UI',
      icon: '🎨',
      description: 'Experiencia de usuario y diseño de interfaces',
      salary: '$2.2M - $5M COP/mes',
      color: 'from-orange-500 to-orange-700',
      roadmap: {
        beginner: {
          duration: '3-5 meses',
          topics: ['Principios de diseño', 'Figma básico', 'Wireframing', 'Teoría del color', 'Tipografía'],
          resources: ['Google UX Design', 'Figma Learn', 'Design Course YouTube']
        },
        intermediate: {
          duration: '6-12 meses',
          topics: ['User research', 'Prototyping', 'Design systems', 'Usability testing', 'Interacciones'],
          resources: ['Interaction Design Foundation', 'Nielsen Norman Group', 'Dribbble']
        },
        advanced: {
          duration: '12-20 meses',
          topics: ['Service design', 'Design thinking avanzado', 'Accessibility', 'Design ops', 'Portfolio profesional'],
          resources: ['IDEO U', 'Proyectos reales', 'Mentorías']
        }
      }
    },
    {
      id: 'cloud',
      name: 'Cloud Computing',
      icon: '☁️',
      description: 'AWS, Azure y arquitectura cloud',
      salary: '$3M - $6M COP/mes',
      color: 'from-cyan-500 to-cyan-700',
      roadmap: {
        beginner: {
          duration: '4-6 meses',
          topics: ['Conceptos de cloud', 'AWS/Azure básico', 'Redes básicas', 'Linux fundamentals', 'Docker intro'],
          resources: ['AWS Free Tier', 'Azure Learn', 'Cloud Guru']
        },
        intermediate: {
          duration: '8-12 meses',
          topics: ['EC2, S3, RDS', 'Kubernetes', 'CI/CD pipelines', 'Infrastructure as Code', 'Seguridad cloud'],
          resources: ['AWS Certification', 'Kubernetes docs', 'Terraform']
        },
        advanced: {
          duration: '12-24 meses',
          topics: ['Arquitectura cloud', 'Multi-cloud', 'Cost optimization', 'High availability', 'Cloud native'],
          resources: ['AWS Solutions Architect', 'Cloud Native Foundation', 'Casos reales']
        }
      }
    }
  ];

  const communities: Community[] = [
    {
      name: 'Discord Estudiantes Cundinamarca',
      description: 'Espacio para estudiantes de la región. Comparte, aprende y colabora.',
      icon: '💬',
      platform: 'Discord',
      members: '2,450',
      tags: ['Estudiantes', 'Ayuda Académica', 'Chat']
    },
    {
      name: 'Telegram Tareas Colaborativas',
      description: 'Grupo de ayuda mutua para tareas y proyectos escolares.',
      icon: '✈️',
      platform: 'Telegram',
      members: '1,820',
      tags: ['Estudiantes', 'Tareas', 'Colaboración']
    },
    {
      name: 'WhatsApp Padres de Familia',
      description: 'Comunicación directa entre padres y comunidad educativa.',
      icon: '📱',
      platform: 'WhatsApp',
      members: '3,100',
      tags: ['Padres', 'Comunicación', 'Información']
    },
    {
      name: 'Foro Docentes Boyacá',
      description: 'Intercambio de experiencias pedagógicas y recursos educativos.',
      icon: '👨‍🏫',
      platform: 'Foro Web',
      members: '890',
      tags: ['Docentes', 'Pedagogía', 'Recursos']
    },
    {
      name: 'Grupo Facebook STEM Educación',
      description: 'Comunidad dedicada a ciencia, tecnología, ingeniería y matemáticas.',
      icon: '🔬',
      platform: 'Facebook',
      members: '4,200',
      tags: ['STEM', 'Ciencia', 'Estudiantes']
    },
    {
      name: 'Comunidad GitHub Proyectos Educativos',
      description: 'Colaboración en código abierto y proyectos de programación.',
      icon: '💻',
      platform: 'GitHub',
      members: '1,350',
      tags: ['Programación', 'Open Source', 'Estudiantes']
    }
  ];

  const handleConsent = (accepted: boolean) => {
    if (accepted) {
      setConsentGiven(true);
      setCurrentPage('chat');
    }
  };

  const getBotResponse = (userMsg: string): string => {
    const lowerMsg = userMsg.toLowerCase();
    let category = 'general';
    let response = '';

    for (const [key, data] of Object.entries(knowledgeBase)) {
      if (data.keywords.some(keyword => lowerMsg.includes(keyword))) {
        category = key;
        response = data.response;
        break;
      }
    }

    if (!response) {
      if (lowerMsg.includes('hola') || lowerMsg.includes('buenos') || lowerMsg.includes('saludos')) {
        category = 'saludo';
        response = '¡Hola! 👋 ¿En qué puedo ayudarte hoy? Pregúntame sobre calendario, horarios, trámites, rutas escolares o recursos educativos.';
      } else if (lowerMsg.includes('gracias')) {
        category = 'despedida';
        response = '¡De nada! 😊 Estoy aquí para ayudarte cuando lo necesites. ¿Hay algo más en lo que pueda asistirte?';
      } else {
        category = 'general';
        response = '🤔 Entiendo tu consulta. Como asistente educativo, puedo ayudarte con:\n\n📅 Calendario académico y fechas importantes\n⏰ Horarios de clases\n📄 Trámites y certificados\n🚌 Rutas escolares\n📚 Recursos educativos\n\n¿Sobre cuál de estos temas te gustaría saber más?';
      }
    }

    updateAnalytics(category);

    return response;
  };

  const updateAnalytics = (category: string) => {
    const currentHour = new Date().getHours();
    const hourRange = `${currentHour}:00 - ${currentHour + 1}:00`;

    setAnalytics(prev => ({
      totalInteractions: prev.totalInteractions + 1,
      uniqueUsers: prev.uniqueUsers,
      topicStats: {
        ...prev.topicStats,
        [category]: (prev.topicStats[category] || 0) + 1
      },
      hourlyStats: {
        ...prev.hourlyStats,
        [hourRange]: (prev.hourlyStats[hourRange] || 0) + 1
      },
      requestTypes: prev.requestTypes,
      satisfactionRatings: prev.satisfactionRatings
    }));
  };

  const recordRequest = (requestType: string) => {
    setAnalytics(prev => ({
      ...prev,
      requestTypes: {
        ...prev.requestTypes,
        [requestType]: (prev.requestTypes[requestType] || 0) + 1
      }
    }));
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const userMessage: Message = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);

    const lowerInput = inputMessage.toLowerCase();
    if (lowerInput.includes('certificado')) recordRequest('certificados');
    else if (lowerInput.includes('constancia')) recordRequest('constancias');
    else if (lowerInput.includes('paz y salvo')) recordRequest('paz y salvo');
    else if (lowerInput.includes('carnet') || lowerInput.includes('carné')) recordRequest('carnet');
    else if (lowerInput.includes('inasistencia') || lowerInput.includes('falta')) recordRequest('inasistencias');
    else if (lowerInput.includes('entrevista') || lowerInput.includes('cita')) recordRequest('entrevistas');

    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponseContent = getBotResponse(inputMessage);
      const botMessage: Message = { role: 'assistant', content: botResponseContent };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const ConsentPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 md:p-12 transform transition-all">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
            <BookOpen className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Asistente Virtual Educativo
          </h1>
          <p className="text-xl text-gray-600">Cundinamarca & Boyacá</p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Política de Tratamiento de Datos Personales
          </h2>
          <div className="text-sm text-gray-700 space-y-2">
            <p className="font-semibold">Según Ley 1581 de 2012</p>
            <p>Al utilizar este asistente virtual, aceptas que:</p>
            <ul className="space-y-1 ml-4">
              <li>✅ Tus conversaciones serán almacenadas para mejorar el servicio</li>
              <li>✅ Los datos se usarán únicamente con fines educativos</li>
              <li>✅ Tu información personal está protegida</li>
              <li>✅ Puedes solicitar eliminación de tus datos en cualquier momento</li>
            </ul>
            <p className="text-xs text-gray-600 mt-3">
              <strong>Responsable:</strong> Instituciones Educativas Cundinamarca & Boyacá<br />
              <strong>Contacto:</strong> privacidad@edutech.gov.co
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer group">
          <input
            type="checkbox"
            id="consent"
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            onChange={(e) => e.target.checked && handleConsent(true)}
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">
            He leído y acepto la política de tratamiento de datos personales
          </span>
        </label>

        <button
          onClick={() => {
            const checkbox = document.getElementById('consent') as HTMLInputElement | null;
            if (checkbox?.checked) handleConsent(true);
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          Continuar al Asistente
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          HACKATHON EDUTECH 2025 - Transformación Digital Educativa
        </p>
      </div>
    </div>
  );

  const ChatPage = () => (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <BookOpen className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">Asistente Educativo</h1>
                <p className="text-sm opacity-90">Siempre listo para ayudarte</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMessages([{
                  role: 'assistant',
                  content: '¡Hola! 👋 Soy tu asistente virtual educativo. ¿En qué puedo ayudarte hoy? Puedo ayudarte con:\n\n📅 Calendario académico\n📄 Trámites y certificados\n📚 Recursos educativos\n🏫 Información institucional'
                }]);
              }}
              className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
            >
              Nueva conversación
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl p-4 shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-white text-gray-800'
              }`}>
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl p-4 shadow-md">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Escribe tu pregunta aquí..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const SkillsPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => setCurrentPage('chat')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-all hover:gap-3"
        >
          ← Volver al Chat
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">📚 Habilidades Más Demandadas 2025</h1>
          <p className="text-xl text-gray-600">Descubre las competencias más solicitadas y aprende con roadmaps estructurados</p>
        </div>

        {!selectedSkill ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map(skill => (
              <div
                key={skill.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transform hover:-translate-y-2 transition-all cursor-pointer"
                onClick={() => setSelectedSkill(skill)}
              >
                <div className={`text-6xl mb-4 text-center bg-gradient-to-br ${skill.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto`}>
                  <span>{skill.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">{skill.name}</h3>
                <p className="text-gray-600 mb-4 text-center">{skill.description}</p>
                <p className="text-lg font-semibold text-green-600 text-center">💰 {skill.salary}</p>
                <button className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition-all">
                  Ver Roadmap
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedSkill(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-all hover:gap-3"
              >
                ← Volver a Habilidades
              </button>
            </div>

            <div className="text-center mb-8">
              <div className={`text-6xl mb-4 inline-block bg-gradient-to-br ${selectedSkill.color} w-24 h-24 rounded-full flex items-center justify-center`}>
                <span>{selectedSkill.icon}</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedSkill.name}</h2>
              <p className="text-xl text-gray-600 mb-2">{selectedSkill.description}</p>
              <p className="text-2xl font-bold text-green-600">{selectedSkill.salary}</p>
            </div>

            <div className="space-y-6">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
                const labels: Record<typeof level, string> = { beginner: '🌱 Principiante', intermediate: '🚀 Intermedio', advanced: '⭐ Avanzado' };
                const data = selectedSkill.roadmap[level];

                return (
                  <div key={level} className="border-l-4 border-blue-500 pl-6 py-4">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">{labels[level]}</h3>
                    <p className="text-sm text-gray-600 mb-3"><strong>Duración:</strong> {data.duration}</p>

                    <div className="mb-4">
                      <p className="font-semibold text-gray-700 mb-2">Aprenderás:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {data.topics.map((topic: string, i: number) => <li key={i}>{topic}</li>)}
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Recursos recomendados:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-600">
                        {data.resources.map((resource: string, i: number) => <li key={i}>{resource}</li>)}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  localStorage.setItem('skill-started', selectedSkill.id);
                  alert('¡Habilidad marcada como iniciada!');
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                ✅ Marcar como iniciado
              </button>
              <button
                onClick={() => {
                  const doc = new jsPDF();
                  doc.setFontSize(16);
                  doc.text(`Roadmap ${selectedSkill.name}`, 14, 20);
                  let y = 30;
                  (['beginner', 'intermediate', 'advanced'] as const).forEach(level => {
                    const data = selectedSkill.roadmap[level];
                    doc.setFontSize(12);
                    doc.text(`- ${level}: ${data.duration}`, 14, y);
                    y += 10;
                    data.topics.forEach(t => {
                      doc.text(`  • ${t}`, 14, y);
                      y += 7;
                    });
                    y += 5;
                  });
                  doc.save(`roadmap-${selectedSkill.id}.pdf`);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                📥 Descargar Roadmap PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const CommunitiesPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => setCurrentPage('chat')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-all hover:gap-3"
        >
          ← Volver al Chat
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">👥 Únete a Nuestras Comunidades</h1>
          <p className="text-xl text-gray-600">Conecta con otros estudiantes, docentes y padres de familia</p>
        </div>

        <div className="space-y-6">
          {communities.map((community: Community, idx: number) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{community.icon}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{community.name}</h3>
                      <p className="text-sm text-gray-500">{community.platform} • {community.members} miembros</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{community.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {community.tags.map((tag: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all whitespace-nowrap">
                  🚀 Unirse
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AnalyticsPage = () => {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState('');

    const topicLabels: Record<string, string> = {
      'calendario': 'Calendario académico',
      'horarios': 'Horarios de clase',
      'tramites': 'Trámites y certificados',
      'rutas': 'Rutas escolares',
      'recursos': 'Recursos educativos',
      'saludo': 'Saludos',
      'general': 'Consultas generales'
    };

    const getTopicsData = () => {
      return Object.entries(analytics.topicStats)
        .map(([key, value]) => ({
          name: topicLabels[key] || key,
          value: value,
          color: key === 'calendario' ? 'bg-blue-500' :
                 key === 'tramites' ? 'bg-purple-500' :
                 key === 'horarios' ? 'bg-green-500' :
                 key === 'recursos' ? 'bg-orange-500' :
                 key === 'rutas' ? 'bg-pink-500' : 'bg-gray-500'
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    };

    const getHourlyData = () => {
      return Object.entries(analytics.hourlyStats)
        .map(([hour, users]) => ({
          hour,
          users,
          peak: users > 5
        }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 5);
    };

    const getRequestsData = () => {
      const requestIcons: Record<string, string> = {
        'certificados': '📜',
        'constancias': '✅',
        'paz y salvo': '🎓',
        'carnet': '🆔',
        'inasistencias': '📅',
        'entrevistas': '👨‍🏫'
      };

      return Object.entries(analytics.requestTypes)
        .map(([type, count]) => ({
          name: type,
          count,
          icon: requestIcons[type] || '📄'
        }))
        .sort((a, b) => b.count - a.count);
    };

    const topicsData = getTopicsData();
    const hourlyData = getHourlyData();
    const requestsData = getRequestsData();
    const avgResponseTime = 1.2;
    const satisfactionRate = 94;

    const PieTopics = ({ data }: { data: { name: string, value: number }[] }) => (
      <div className="w-64 h-64 mx-auto">
        <PieChart
          data={data.map((d, i) => ({
            title: d.name,
            value: d.value,
            color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'][i]
          }))}
          label={({ dataEntry }) => `${Math.round(dataEntry.percentage)}%`}
          labelStyle={{ fontSize: 8, fill: '#fff' }}
          radius={40}
          lineWidth={60}
          startAngle={-90}
        />
      </div>
    );

    const BarChart = ({ data }: { data: { name: string, value: number }[] }) => {
      const max = Math.max(...data.map(d => d.value), 1);
      return (
        <div className="space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-32 text-xs text-gray-700 truncate">{d.name}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${(d.value / max) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-800 w-8 text-right">{d.value}</span>
            </div>
          ))}
        </div>
      );
    };

    if (!authenticated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">🔒 Acceso Administrativo</h2>
              <p className="text-gray-600 mt-2">Panel de Analíticas</p>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && password === 'edutech2025' && setAuthenticated(true)}
            />
            <button
              onClick={() => password === 'edutech2025' && setAuthenticated(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Ingresar
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">
              Usuario de prueba: edutech2025
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setCurrentPage('chat')}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-all hover:gap-3"
          >
            ← Volver al Chat
          </button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Panel Analítico Educativo</h1>
            <p className="text-gray-600">Dashboard de estadísticas y métricas de uso</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600 font-semibold">Total Interacciones</h3>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-4xl font-bold text-gray-800">{analytics.totalInteractions}</p>
              <p className="text-sm text-gray-500 mt-2">Mensajes procesados</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600 font-semibold">Usuarios Únicos</h3>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-4xl font-bold text-gray-800">{analytics.uniqueUsers.size}</p>
              <p className="text-sm text-gray-500 mt-2">Sesiones activas</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600 font-semibold">Satisfacción</h3>
                <Award className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-4xl font-bold text-gray-800">{satisfactionRate}%</p>
              <p className="text-sm text-green-600 mt-2">Valoración positiva</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600 font-semibold">Tiempo Respuesta</h3>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-4xl font-bold text-gray-800">{avgResponseTime}s</p>
              <p className="text-sm text-gray-500 mt-2">Promedio de respuesta</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Temas Más Consultados (Circular)</h3>
              {topicsData.length > 0 ? (
                <PieTopics data={topicsData} />
              ) : (
                <p className="text-gray-500 text-center py-8">Sin datos aún</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Temas Más Consultados (Barras)</h3>
              {topicsData.length > 0 ? (
                <BarChart data={topicsData} />
              ) : (
                <p className="text-gray-500 text-center py-8">Sin datos aún</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Trámites Más Solicitados</h3>
            {requestsData.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {requestsData.map((item, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 text-center">
                    <div className="text-4xl mb-2">{item.icon}</div>
                    <p className="text-2xl font-bold text-gray-800">{item.count}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No hay solicitudes de trámites registradas aún.</p>
                <p className="text-sm text-gray-400">Los trámites se registran cuando los usuarios preguntan sobre certificados, constancias, etc.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
              📥 Exportar Reporte Completo (CSV)
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Sidebar = () => (
    <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-gray-800">EduTech</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'chat', icon: Home, label: 'Inicio - Chat', page: 'chat' },
            { id: 'skills', icon: BookOpen, label: 'Cursos y Habilidades', page: 'skills' },
            { id: 'communities', icon: Users, label: 'Comunidades', page: 'communities' },
            { id: 'analytics', icon: BarChart3, label: 'Panel Analítico', page: 'analytics' }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.page);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  currentPage === item.page
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">HACKATHON EDUTECH 2025</p>
            <p className="text-xs text-gray-600">Transformación Digital Educativa</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (currentPage === 'consent') {
    return <ConsentPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {currentPage === 'chat' && <ChatPage />}
        {currentPage === 'skills' && <SkillsPage />}
        {currentPage === 'communities' && <CommunitiesPage />}
        {currentPage === 'analytics' && <AnalyticsPage />}
      </div>
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default EduchatBot;
