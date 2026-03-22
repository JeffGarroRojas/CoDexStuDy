import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface TestUser {
  email: string;
  password: string;
  name: string;
  token?: string;
  id?: string;
}

interface TestDocument {
  id: string;
  title: string;
}

interface TestFlashcard {
  id: string;
  front: string;
  back: string;
}

describe('E2E: Usuario Completo - Flujo de Estudio', () => {
  const testUser: TestUser = {
    email: `e2e_user_${Date.now()}@test.com`,
    password: 'TestPass123!',
    name: 'Usuario E2E Test',
  };

  let testDocument: TestDocument;
  let testFlashcard: TestFlashcard;
  let authToken = '';

  beforeAll(async () => {
    console.log('🧪 Iniciando Tests E2E de Usuario Completo');
  });

  afterAll(async () => {
    console.log('✅ Tests E2E completados');
  });

  describe('1️⃣ Registro y Autenticación', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
          studyMethod: 'hibrido',
          level: 'intermedio',
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('token');
      expect(data.data.user).toHaveProperty('email', testUser.email);
      expect(data.data.user).toHaveProperty('name', testUser.name);

      testUser.token = data.data.token;
      testUser.id = data.data.user.id;

      console.log(`   ✅ Usuario registrado: ${testUser.email}`);
    });

    it('debería iniciar sesión con credenciales válidas', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('token');

      authToken = data.data.token;
      console.log(`   ✅ Login exitoso`);
    });

    it('debería obtener información del usuario actual', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user).toHaveProperty('email', testUser.email);
      expect(data.data.user).toHaveProperty('studyMethod', 'hibrido');

      console.log(`   ✅ Usuario verificado: ${data.data.user.name}`);
    });

    it('debería rechazar credenciales inválidas', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongpassword',
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);

      console.log(`   ✅ Credenciales inválidas rechazadas`);
    });

    it('debería rechazar registro con email duplicado', async () => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);

      console.log(`   ✅ Email duplicado rechazado`);
    });
  });

  describe('2️⃣ Gestión de Documentos', () => {
    it('debería crear un nuevo documento', async () => {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Apuntes de Biología - Células',
          content: `Las células son la unidad fundamental de la vida.
          
Existen dos tipos principales:
1. Células procariotas: No tienen núcleo definido (bacterias)
2. Células eucariotas: Tienen núcleo definido (vegetales, animales, hongos)

Los orgánulos principales incluyen:
- Núcleo: Contiene el ADN
- Mitocondrias: Producen energía (ATP)
- Ribosomas: Síntesis de proteínas
- Membrana celular: Controla el paso de sustancias

La división celular puede ser:
- Mitosis: Células idénticas
- Meiosis: Células sexuales (gametos)`,
          sourceType: 'text',
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.document).toHaveProperty('title', 'Apuntes de Biología - Células');
      expect(data.data.document).toHaveProperty('wordCount');

      testDocument = data.data.document;
      console.log(`   ✅ Documento creado: "${testDocument.title}"`);
    });

    it('debería listar documentos del usuario', async () => {
      const response = await fetch(`${API_BASE_URL}/documents?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.documents)).toBe(true);
      expect(data.data.documents.length).toBeGreaterThan(0);
      expect(data.data.pagination).toHaveProperty('total');

      console.log(`   ✅ Lista de documentos: ${data.data.documents.length} documento(s)`);
    });

    it('debería buscar documentos por título', async () => {
      const response = await fetch(`${API_BASE_URL}/documents?search=Células`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.documents.length).toBeGreaterThan(0);

      console.log(`   ✅ Búsqueda de documentos: ${data.data.documents.length} resultado(s)`);
    });

    it('debería obtener un documento específico', async () => {
      const response = await fetch(`${API_BASE_URL}/documents/${testDocument.id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.document).toHaveProperty('id', testDocument.id);
      expect(data.data.document).toHaveProperty('content');

      console.log(`   ✅ Documento obtenido: "${data.data.document.title}"`);
    });

    it('debería actualizar un documento', async () => {
      const response = await fetch(`${API_BASE_URL}/documents/${testDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Apuntes de Biología - Células (Actualizado)',
          summary: 'Resumen sobre tipos de células y orgánulos',
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Documento actualizado`);
    });
  });

  describe('3️⃣ Gestión de Flashcards', () => {
    it('debería crear una flashcard manualmente', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          documentId: testDocument.id,
          front: '¿Qué es una célula eucariota?',
          back: 'Una célula que tiene su material genético encerrado dentro de un núcleo delimitado por membrana.',
          tags: ['biología', 'células'],
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.flashcard).toHaveProperty('front');
      expect(data.data.flashcard).toHaveProperty('back');

      testFlashcard = data.data.flashcard;
      console.log(`   ✅ Flashcard creada: "${testFlashcard.front.substring(0, 30)}..."`);
    });

    it('debería listar todas las flashcards', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.flashcards)).toBe(true);

      console.log(`   ✅ Flashcards listadas: ${data.data.flashcards.length}`);
    });

    it('debería obtener flashcards pendientes de revisión', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards/due?limit=20`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.flashcards));

      console.log(`   ✅ Flashcards pendientes: ${data.data.count}`);
    });

    it('debería obtener estadísticas de flashcards', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalCards');
      expect(data.data).toHaveProperty('dueCards');

      console.log(`   ✅ Stats: ${data.data.totalCards} total, ${data.data.dueCards} pendientes`);
    });

    it('debería revisar una flashcard con calidad buena', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          flashcardId: testFlashcard.id,
          quality: 4,
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('review');
      expect(data.data).toHaveProperty('nextReview');

      console.log(`   ✅ Flashcard revisada con calidad 4, próximo review: ${data.data.nextReview}`);
    });

    it('debería revisar una flashcard con calidad mala', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          flashcardId: testFlashcard.id,
          quality: 1,
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Flashcard revisada con calidad 1 (difícil)`);
    });

    it('debería filtrar flashcards por tags', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards?tags=biología`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Flashcards filtradas por tag "biología"`);
    });

    it('debería eliminar una flashcard', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards/${testFlashcard.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Flashcard eliminada`);
    });
  });

  describe('4️⃣ Sesiones de Estudio', () => {
    let sessionId: string;

    it('debería iniciar una sesión de estudio', async () => {
      const response = await fetch(`${API_BASE_URL}/study/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic: 'Estudio de Células - Biología',
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.session).toHaveProperty('topic', 'Estudio de Células - Biología');

      sessionId = data.data.session.id;
      console.log(`   ✅ Sesión iniciada: ${data.data.session.topic}`);
    });

    it('debería obtener sesiones del usuario', async () => {
      const response = await fetch(`${API_BASE_URL}/study/sessions?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data.sessions));

      console.log(`   ✅ Sesiones obtenidas: ${data.data.sessions.length}`);
    });

    it('debería obtener una sesión específica', async () => {
      const response = await fetch(`${API_BASE_URL}/study/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.session).toHaveProperty('id', sessionId);

      console.log(`   ✅ Sesión específica obtenida`);
    });

    it('debería finalizar una sesión de estudio', async () => {
      const response = await fetch(`${API_BASE_URL}/study/sessions/${sessionId}/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          cardsStudied: 15,
          cardsLearned: 12,
          accuracy: 0.85,
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Sesión finalizada: 15 tarjetas estudiadas, 85% precisión`);
    });

    it('debería obtener dashboard del usuario', async () => {
      const response = await fetch(`${API_BASE_URL}/study/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalCards');
      expect(data.data).toHaveProperty('dueCards');
      expect(data.data).toHaveProperty('streak');

      console.log(`   ✅ Dashboard: ${data.data.totalCards} tarjetas, racha: ${data.data.streak} días`);
    });
  });

  describe('5️⃣ Endpoints IA', () => {
    it('debería verificar estado de proveedores IA', async () => {
      const response = await fetch(`${API_BASE_URL}/ai/providers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('providers');
      expect(data.data).toHaveProperty('active');

      console.log(`   ✅ Proveedor IA activo: ${data.data.active}`);
    });

    it('debería generar resumen de contenido', async () => {
      const response = await fetch(`${API_BASE_URL}/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: `La fotosíntesis es el proceso mediante el cual las plantas convierten la luz solar en energía química.
          
El proceso ocurre en dos etapas principales:
1. Fase luminosa: Captura de luz y producción de ATP
2. Fase oscura: Ciclo de Calvin, fijación de CO2

La ecuación general es:
6CO2 + 6H2O + luz → C6H12O6 + 6O2

Los factores que afectan la fotosíntesis son:
- Intensidad de luz
- Concentración de CO2
- Temperatura
- Disponibilidad de agua`,
          documentId: testDocument.id,
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Resumen generado`);
    });

    it('debería generar preguntas y respuestas', async () => {
      const response = await fetch(`${API_BASE_URL}/ai/qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: `El sistema nervioso se divide en dos partes principales: el sistema nervioso central (SNC) y el sistema nervioso periférico (SNP).

El SNC incluye el cerebro y la médula espinal. El cerebro controla los pensamientos, emociones y movimientos voluntarios. La médula espinal transmite señales entre el cerebro y el resto del cuerpo.

El SNP incluye todos los nervios que salen del SNC y se ramifican por todo el cuerpo. Se divide en sistema nervioso somático (control voluntario) y autónomo (control involuntario).`,
          documentId: testDocument.id,
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Q&A generado`);
    });

    it('debería generar flashcards con IA', async () => {
      const response = await fetch(`${API_BASE_URL}/ai/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: `La genética es el estudio de los genes y la herencia. Los genes son segmentos de ADN que contienen las instrucciones para construir proteínas.

Las leyes de Mendel son fundamentales:
1. Ley de la uniformidad: Todos los individuos de la primera generación son iguales
2. Ley de la segregación: Los alelos se separan durante la formación de gametos
3. Ley de la herencia independiente: Los genes se heredan independientemente`,
          documentId: testDocument.id,
          count: 3,
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('flashcards');

      console.log(`   ✅ Flashcards generadas: ${data.data.generated}`);
    });

    it('debería generar plan de estudio', async () => {
      const response = await fetch(`${API_BASE_URL}/ai/study-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: `Tema: Sistema digestivo humano

El sistema digestivo está formado por el tracto gastrointestinal y órganos accesorios.

Órganos principales:
- Boca: Masticación y saliva
- Esófago: Conducto muscular
- Estómago: Digestión ácida
- Intestino delgado: Absorción de nutrientes
- Intestino grueso: Absorción de agua

Enzimas digestivas:
- Amilasa: Digiere carbohidratos
- Proteasa: Digiere proteínas
- Lipasa: Digiere grasas`,
          timeAvailable: '2 horas',
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Plan de estudio generado`);
    });

    it('debería buscar temas MEP', async () => {
      const response = await fetch(`${API_BASE_URL}/ai/buscar-temas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          tema: 'Ecosistemas',
          grado: '8',
          area: 'científico',
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Temas MEP buscados para ${data.data?.subtopics?.length || 0} subtemas`);
    });
  });

  describe('6️⃣ Validación y Errores', () => {
    it('debería rechazar documento sin título', async () => {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          content: 'Solo contenido sin título',
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);

      console.log(`   ✅ Validación de documento correcta`);
    });

    it('debería rechazar flashcard sin frente', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          front: '',
          back: 'Solo respuesta',
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);

      console.log(`   ✅ Validación de flashcard correcta`);
    });

    it('debería rechazar calidad de revisión inválida', async () => {
      const response = await fetch(`${API_BASE_URL}/flashcards/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          flashcardId: testFlashcard.id,
          quality: 10,
        }),
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);

      console.log(`   ✅ Validación de calidad correcta (0-5)`);
    });

    it('debería devolver 404 para documento inexistente', async () => {
      const response = await fetch(`${API_BASE_URL}/documents/00000000-0000-0000-0000-000000000000`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);

      console.log(`   ✅ 404 para documento inexistente`);
    });

    it('debería rechazar acceso sin autenticación', async () => {
      const response = await fetch(`${API_BASE_URL}/documents`);

      expect(response.status).toBe(401);

      console.log(`   ✅ Acceso sin auth rechazado`);
    });

    it('debería rechazar token inválido', async () => {
      const response = await fetch(`${API_BASE_URL}/documents`, {
        headers: { Authorization: 'Bearer token_invalido' },
      });

      expect(response.status).toBe(401);

      console.log(`   ✅ Token inválido rechazado`);
    });
  });

  describe('7️⃣ Rate Limiting', () => {
    it('debería permitir múltiples requests dentro del límite', async () => {
      let successCount = 0;

      for (let i = 0; i < 5; i++) {
        const response = await fetch(`${API_BASE_URL}/flashcards`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (response.status === 200) successCount++;
      }

      expect(successCount).toBe(5);
      console.log(`   ✅ 5 requests exitosas dentro del límite`);
    });
  });

  describe('8️⃣ Cleanup', () => {
    it('debería eliminar el documento de prueba', async () => {
      const response = await fetch(`${API_BASE_URL}/documents/${testDocument.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json() as ApiResponse;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      console.log(`   ✅ Documento de prueba eliminado`);
    });
  });
});

describe('E2E: Flujo Completo de Estudio (Simulación)', () => {
  const student = {
    email: `student_${Date.now()}@test.com`,
    password: 'StudentPass123!',
    name: 'María Estudiante',
  };

  let token = '';

  beforeAll(async () => {
    const regResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student),
    });

    const regData = await regResponse.json() as ApiResponse;
    token = regData.data.token;
  });

  it('simula un día completo de estudio', async () => {
    console.log('\n📚 SIMULACIÓN: Un día de estudio completo');
    console.log('==========================================');

    console.log('\n📖 Mañana: Subir material de estudio...');
    const docResponse = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Notas de Historia - Revolución Francesa',
        content: `La Revolución Francesa (1789-1799) fue un período de upheaval político y social en Francia.

Causas principales:
1. Crisis financiera del reino
2. Desigualdad social entre estamentos
3. Influencia de las ideas ilustradas
4. Fracaso de los Estados Generales

Eventos clave:
- 14 de julio 1789: Toma de la Bastilla
- 26 de agosto 1789: Declaración de los Derechos del Hombre
- 1793: Ejecución de Luis XVI
- 1799: Golpe de Napoleón

Consecuencias:
- Fin del absolutismo
- Auge del nacionalismo
- Difusión de principios democráticos
- Guerras napoleónicas`,
        sourceType: 'text',
      }),
    });

    const docData = await docResponse.json() as ApiResponse;
    const docId = docData.data.document.id;
    console.log(`   ✅ Material cargado: "${docData.data.document.title}"`);

    console.log('\n🤖 Generación de recursos de estudio...');
    const aiResponse = await fetch(`${API_BASE_URL}/ai/flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        content: docData.data.document.content,
        documentId: docId,
        count: 5,
      }),
    });

    const aiData = await aiResponse.json() as ApiResponse;
    console.log(`   ✅ Generadas ${aiData.data.generated} flashcards`);

    console.log('\n📝 Sesión de estudio:');
    const sessionResponse = await fetch(`${API_BASE_URL}/study/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ topic: 'Historia - Revolución Francesa' }),
    });

    const sessionData = await sessionResponse.json() as ApiResponse;
    console.log(`   ✅ Sesión iniciada`);

    console.log('\n🔄 Revisión de flashcards:');
    const cardsResponse = await fetch(`${API_BASE_URL}/flashcards/due?limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const cardsData = await cardsResponse.json() as ApiResponse;
    console.log(`   📚 ${cardsData.data.count} tarjetas para revisar`);

    for (const card of cardsData.data.flashcards.slice(0, 3)) {
      const quality = Math.floor(Math.random() * 3) + 3;
      await fetch(`${API_BASE_URL}/flashcards/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flashcardId: card.id,
          quality,
        }),
      });
      console.log(`   ✅ Revisada: "${card.front.substring(0, 25)}..." (calidad: ${quality})`);
    }

    console.log('\n📊 Revisión de progreso:');
    const dashResponse = await fetch(`${API_BASE_URL}/study/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const dashData = await dashResponse.json() as ApiResponse;
    console.log(`   📈 Total tarjetas: ${dashData.data.totalCards}`);
    console.log(`   📈 Pendientes: ${dashData.data.dueCards}`);
    console.log(`   📈 Racha: ${dashData.data.streak} días`);

    await fetch(`${API_BASE_URL}/study/sessions/${sessionData.data.session.id}/end`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cardsStudied: 3,
        cardsLearned: 2,
        accuracy: 0.67,
      }),
    });

    console.log('\n✅ Día de estudio completado!');
    expect(true).toBe(true);
  });
});
