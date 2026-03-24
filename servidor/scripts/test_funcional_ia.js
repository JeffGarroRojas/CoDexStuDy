require('dotenv').config({ path: '../.env' });
const { aiService } = require('../src/services/ai/AiService');

async function testSummarize() {
    console.log("\n=== 1. Prueba de Resumen (>2000 palabras NATIVE) ===");
    const baseText = "La inteligencia artificial en la tutorización permite sistemas inteligentes y adaptables, así transformando la pedagogía y ampliando grandemente la accesibilidad a materiales cognitivos muy profundos. ";
    // Base text is 24 words. 24 * 90 = 2160 words.
    const longText = baseText.repeat(90);

    const res = await aiService.summarize(longText);

    if (res.success && res.data.summary) {
        console.log("✅ Exito: Recibido resumen JSON estructurado profundo.");
        console.log("Provider usado:", res.provider);
        console.log("\nMuestra del desarrollo:\n", res.data.summary.substring(0, 400) + "...");
    } else {
        console.log("❌ Fallo en Resumen:", res.error || "No hay error reportado", res.data || "");
    }
}

async function runTests() {
    try {
        await testSummarize();
    } catch (e) {
        console.error("Failure:", e);
    }
}
runTests();
