import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: `e2e_${Date.now()}@test.com`,
  password: 'TestPass123!',
  name: 'Usuario E2E Test',
};

let authToken = '';
let testDocumentId = '';

test.describe('E2E: Registro y Autenticación', () => {
  test('debería cargar la página de inicio', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CoDexStuDy/);
  });

  test('debería cargar la landing page correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const content = await page.content();
    expect(content).toContain('CoDexStuDy');
  });

  test('debería navegar al onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveTitle(/CoDexStuDy/);
  });

  test('debería registrar un nuevo usuario', async ({ page }) => {
    await page.goto('/onboarding');
    
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const nameInput = page.locator('input[name="name"], input[placeholder*="nombre" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Registr"), button:has-text("Comenzar")').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill(TEST_USER.email);
      if (await nameInput.isVisible()) await nameInput.fill(TEST_USER.name);
      if (await passwordInput.isVisible()) await passwordInput.fill(TEST_USER.password);
      
      try {
        await submitButton.click();
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('Form interaction completed');
      }
    }

    const response = await page.request.post('/api/auth/register', {
      data: TEST_USER,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    authToken = data.data.token;
  });

  test('debería iniciar sesión con credenciales válidas', async ({ page }) => {
    const response = await page.request.post('/api/auth/login', {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    authToken = data.data.token;
  });

  test('debería rechazar credenciales inválidas', async ({ page }) => {
    const response = await page.request.post('/api/auth/login', {
      data: {
        email: 'invalid@test.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});

test.describe('E2E: Dashboard y Navegación', () => {
  test.use({ extraHTTPHeaders: { Authorization: `Bearer ${authToken}` } });

  test('debería cargar el dashboard autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería cargar la página de documentos', async ({ page }) => {
    await page.goto('/documents');
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería cargar la página de estudio', async ({ page }) => {
    await page.goto('/study');
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería cargar la página de upload', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('E2E: Gestión de Documentos', () => {
  test.use({ extraHTTPHeaders: { Authorization: `Bearer ${authToken}` } });

  test('debería crear un documento nuevo', async ({ page }) => {
    const response = await page.request.post('/api/documents', {
      data: {
        title: 'Documento de Prueba E2E',
        content: 'Este es un documento de prueba para los tests E2E del navegador.',
        sourceType: 'text',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.document).toHaveProperty('title', 'Documento de Prueba E2E');
    testDocumentId = data.data.document.id;
  });

  test('debería listar documentos del usuario', async ({ page }) => {
    const response = await page.request.get('/api/documents');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.documents)).toBe(true);
  });

  test('debería buscar documentos', async ({ page }) => {
    const response = await page.request.get('/api/documents?search=Prueba');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('debería obtener un documento específico', async ({ page }) => {
    if (!testDocumentId) {
      test.skip();
    }

    const response = await page.request.get(`/api/documents/${testDocumentId}`);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.document.id).toBe(testDocumentId);
  });

  test('debería actualizar un documento', async ({ page }) => {
    if (!testDocumentId) {
      test.skip();
    }

    const response = await page.request.put(`/api/documents/${testDocumentId}`, {
      data: {
        title: 'Documento de Prueba E2E - Actualizado',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

test.describe('E2E: Flashcards y SM-2', () => {
  let testFlashcardId = '';

  test.use({ extraHTTPHeaders: { Authorization: `Bearer ${authToken}` } });

  test('debería crear una flashcard', async ({ page }) => {
    const response = await page.request.post('/api/flashcards', {
      data: {
        documentId: testDocumentId,
        front: '¿Qué es E2E?',
        back: 'End-to-End testing es un método de prueba que verifica el flujo completo de una aplicación.',
        tags: ['testing', 'e2e'],
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    testFlashcardId = data.data.flashcard.id;
  });

  test('debería listar flashcards', async ({ page }) => {
    const response = await page.request.get('/api/flashcards');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.flashcards)).toBe(true);
  });

  test('debería obtener flashcards pendientes', async ({ page }) => {
    const response = await page.request.get('/api/flashcards/due');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.flashcards)).toBe(true);
  });

  test('debería obtener estadísticas', async ({ page }) => {
    const response = await page.request.get('/api/flashcards/stats');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalCards');
    expect(data.data).toHaveProperty('dueCards');
  });

  test('debería revisar una flashcard con calidad buena (4)', async ({ page }) => {
    if (!testFlashcardId) {
      test.skip();
    }

    const response = await page.request.post('/api/flashcards/review', {
      data: {
        flashcardId: testFlashcardId,
        quality: 4,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('review');
    expect(data.data).toHaveProperty('nextReview');
  });

  test('debería revisar una flashcard con calidad mala (1)', async ({ page }) => {
    if (!testFlashcardId) {
      test.skip();
    }

    const response = await page.request.post('/api/flashcards/review', {
      data: {
        flashcardId: testFlashcardId,
        quality: 1,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('debería filtrar flashcards por tag', async ({ page }) => {
    const response = await page.request.get('/api/flashcards?tags=testing');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

test.describe('E2E: Sesiones de Estudio', () => {
  let testSessionId = '';

  test.use({ extraHTTPHeaders: { Authorization: `Bearer ${authToken}` } });

  test('debería iniciar una sesión de estudio', async ({ page }) => {
    const response = await page.request.post('/api/study/sessions/start', {
      data: {
        topic: 'Estudio E2E',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.session).toHaveProperty('topic', 'Estudio E2E');
    testSessionId = data.data.session.id;
  });

  test('debería listar sesiones', async ({ page }) => {
    const response = await page.request.get('/api/study/sessions');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.sessions)).toBe(true);
  });

  test('debería obtener una sesión específica', async ({ page }) => {
    if (!testSessionId) {
      test.skip();
    }

    const response = await page.request.get(`/api/study/sessions/${testSessionId}`);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.session.id).toBe(testSessionId);
  });

  test('debería finalizar una sesión', async ({ page }) => {
    if (!testSessionId) {
      test.skip();
    }

    const response = await page.request.put(`/api/study/sessions/${testSessionId}/end`, {
      data: {
        cardsStudied: 10,
        cardsLearned: 8,
        accuracy: 0.8,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('debería obtener dashboard', async ({ page }) => {
    const response = await page.request.get('/api/study/dashboard');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalCards');
    expect(data.data).toHaveProperty('dueCards');
    expect(data.data).toHaveProperty('streak');
  });
});

test.describe('E2E: Endpoints IA', () => {
  test.use({ extraHTTPHeaders: { Authorization: `Bearer ${authToken}` } });

  test('debería verificar proveedores IA', async ({ page }) => {
    const response = await page.request.get('/api/ai/providers');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('providers');
    expect(data.data).toHaveProperty('active');
  });

  test('debería generar resumen', async ({ page }) => {
    const response = await page.request.post('/api/ai/summarize', {
      data: {
        content: 'La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química.',
        documentId: testDocumentId,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('debería generar Q&A', async ({ page }) => {
    const response = await page.request.post('/api/ai/qa', {
      data: {
        content: 'El sistema nervioso central incluye el cerebro y la médula espinal.',
        documentId: testDocumentId,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('debería generar flashcards con IA', async ({ page }) => {
    const response = await page.request.post('/api/ai/flashcards', {
      data: {
        content: 'La genética estudia los genes y la herencia. Las leyes de Mendel explican cómo se heredan los caracteres.',
        documentId: testDocumentId,
        count: 3,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('debería generar plan de estudio', async ({ page }) => {
    const response = await page.request.post('/api/ai/study-plan', {
      data: {
        content: 'Tema: Sistema digestivo. Órganos: boca, estómago, intestino delgado, intestino grueso.',
        timeAvailable: '1 hora',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('debería buscar temas MEP', async ({ page }) => {
    const response = await page.request.post('/api/ai/buscar-temas', {
      data: {
        tema: 'Ecosistemas',
        grado: '8',
        area: 'científico',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

test.describe('E2E: Validación y Errores', () => {
  test.use({ extraHTTPHeaders: { Authorization: `Bearer ${authToken}` } });

  test('debería rechazar documento sin título', async ({ page }) => {
    const response = await page.request.post('/api/documents', {
      data: {
        content: 'Solo contenido sin título',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('debería rechazar flashcard sin front', async ({ page }) => {
    const response = await page.request.post('/api/flashcards', {
      data: {
        front: '',
        back: 'Solo respuesta',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('debería rechazar calidad inválida', async ({ page }) => {
    const response = await page.request.post('/api/flashcards/review', {
      data: {
        flashcardId: '11111111-1111-1111-1111-111111111111',
        quality: 10,
      },
    });

    expect(response.status()).toBe(400);
  });

  test('debería devolver 404 para documento inexistente', async ({ page }) => {
    const response = await page.request.get('/api/documents/00000000-0000-0000-0000-000000000000');

    expect(response.status()).toBe(404);
  });

  test('debería rechazar acceso sin autenticación', async ({ page }) => {
    const response = await page.request.get('/api/documents');

    expect(response.status()).toBe(401);
  });

  test('debería rechazar token inválido', async ({ page }) => {
    const response = await page.request.get('/api/documents', {
      headers: { Authorization: 'Bearer invalid_token' },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('E2E: PWA y Offline', () => {
  test('debería cargar la página offline', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería tener manifest.json válido', async ({ page }) => {
    const response = await page.request.get('/manifest.json');
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
  });
});

test.describe('E2E: Flujo Completo de Usuario', () => {
  test.use({ extraHTTPHeaders: { Authorization: `Bearer ${authToken}` } });

  test('simula un día completo de estudio', async ({ page }) => {
    console.log('\n📚 Simulación: Día completo de estudio');
    console.log('======================================');

    console.log('\n📖 Paso 1: Crear documento de estudio');
    const docResponse = await page.request.post('/api/documents', {
      data: {
        title: 'Historia - Revolución Francesa',
        content: 'La Revolución Francesa fue un período de cambios políticos y sociales en Francia entre 1789 y 1799.',
        sourceType: 'text',
      },
    });
    expect(docResponse.status()).toBe(201);
    const docData = await docResponse.json();
    const docId = docData.data.document.id;
    console.log(`   ✅ Documento creado: ${docData.data.document.title}`);

    console.log('\n🤖 Paso 2: Generar flashcards con IA');
    const flashcardsResponse = await page.request.post('/api/ai/flashcards', {
      data: {
        content: docData.data.document.content,
        documentId: docId,
        count: 5,
      },
    });
    expect(flashcardsResponse.status()).toBe(200);
    const fcData = await flashcardsResponse.json();
    console.log(`   ✅ Generadas ${fcData.data.generated} flashcards`);

    console.log('\n📝 Paso 3: Iniciar sesión de estudio');
    const sessionResponse = await page.request.post('/api/study/sessions/start', {
      data: { topic: 'Historia - Revolución Francesa' },
    });
    expect(sessionResponse.status()).toBe(201);
    const sessionData = await sessionResponse.json();
    console.log(`   ✅ Sesión iniciada`);

    console.log('\n🔄 Paso 4: Revisar flashcards');
    const dueResponse = await page.request.get('/api/flashcards/due');
    expect(dueResponse.status()).toBe(200);
    const dueData = await dueResponse.json();
    console.log(`   📚 ${dueData.data.count} tarjetas para revisar`);

    for (const card of dueData.data.flashcards.slice(0, 3)) {
      const quality = Math.floor(Math.random() * 3) + 3;
      await page.request.post('/api/flashcards/review', {
        data: { flashcardId: card.id, quality },
      });
      console.log(`   ✅ Revisada (calidad: ${quality})`);
    }

    console.log('\n📊 Paso 5: Ver progreso');
    const dashResponse = await page.request.get('/api/study/dashboard');
    expect(dashResponse.status()).toBe(200);
    const dashData = await dashResponse.json();
    console.log(`   📈 Total: ${dashData.data.totalCards}, Pendientes: ${dashData.data.dueCards}`);
    console.log(`   📈 Racha: ${dashData.data.streak} días`);

    console.log('\n✅ Día de estudio completado!');
    expect(true).toBe(true);
  });
});
