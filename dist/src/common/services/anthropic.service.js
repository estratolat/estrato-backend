"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AnthropicService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicService = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
let AnthropicService = AnthropicService_1 = class AnthropicService {
    constructor() {
        this.logger = new common_1.Logger(AnthropicService_1.name);
        this.client = null;
        this.model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
    }
    getClient() {
        const apiKey = process.env.ANTHROPIC_API_KEY_2 || process.env.ANTHROPIC_API_KEY || '';
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY no está configurada. El análisis con IA no está disponible.');
        }
        if (!this.client) {
            this.client = new sdk_1.default({ apiKey });
        }
        return this.client;
    }
    async analizarCandidato(discurso, transcripcion) {
        const prompt = this.construirPrompt(discurso, transcripcion);
        const response = await this.getClient().messages.create({
            model: this.model,
            max_tokens: 2048,
            temperature: 0.3,
            system: 'Eres un analista político y de comunicación experto. Tu trabajo es leer discursos y transcripciones de un candidato y extraer su huella de comunicación. Devuelve SIEMPRE un JSON válido sin markdown, sin explicaciones adicionales.',
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join(' ');
        return this.parsearHuella(text);
    }
    async generarConHuella(huella, contexto) {
        const esRedes = contexto.tipo === 'redes';
        const system = esRedes
            ? 'Eres el community manager del candidato. Escribe un caption para redes sociales en su voz, usando sus muletillas, frases y tono. Devuelve SOLO JSON válido.'
            : 'Eres el equipo de comunicación del candidato. Redacta un boletín en la voz del candidato, usando sus muletillas, frases y tono. Devuelve SOLO JSON válido.';
        const prompt = this.construirPromptGeneracion(huella, contexto);
        const response = await this.getClient().messages.create({
            model: this.model,
            max_tokens: 2048,
            temperature: 0.7,
            system,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join(' ');
        return this.parsearGeneracion(text, esRedes);
    }
    construirPrompt(discurso, transcripcion) {
        return `Analiza el siguiente discurso y transcripción de un candidato político y extrae su huella de comunicación.

DISCURSO DE REFERENCIA:
${discurso || 'No proporcionado'}

TRANSCRIPCIÓN DE VIDEO:
${transcripcion || 'No proporcionada'}

Devuélveme UN ÚNICO OBJETO JSON con exactamente estas claves:
{
  "palabras_clave": ["...", "..."],
  "muletillas": ["...", "..."],
  "frases_recurrentes": ["...", "..."],
  "llamados_accion": ["...", "..."],
  "tono": "descripción del tono en 2-3 oraciones",
  "propuesta_central": "resumen de su propuesta principal",
  "estilo_redes": "cómo debería escribir en redes sociales en 2 oraciones"
}

Reglas:
- Máximo 8 palabras clave.
- Máximo 6 muletillas.
- Máximo 6 frases recurrentes.
- Máximo 4 llamados a la acción.
- Debe ser contenido real que el candidato diría, no genérico.`;
    }
    construirPromptGeneracion(huella, contexto) {
        const c = contexto.contexto;
        const baseInfo = `Candidato: ${contexto.perfil.nombre || 'Candidato'}
Biografía: ${contexto.perfil.biografia || 'No disponible'}
Gustos: ${contexto.perfil.gustos || 'No disponible'}
Propuesta central: ${contexto.perfil.propuesta_central || huella.propuesta_central || 'No disponible'}

HUELLA DE COMUNICACIÓN:
- Palabras clave: ${huella.palabras_clave.join(', ')}
- Muletillas: ${huella.muletillas.join(', ')}
- Frases recurrentes: ${huella.frases_recurrentes.join(', ')}
- Llamados a la acción: ${huella.llamados_accion.join(', ')}
- Tono: ${huella.tono}
- Estilo en redes: ${huella.estilo_redes}

INFORMACIÓN DEL MENSAJE:
- Tema: ${c.tema || 'No especificado'}
- Qué: ${c.que || 'No especificado'}
- Quién: ${c.quien || 'No especificado'}
- Cómo: ${c.como || 'No especificado'}
- Cuándo: ${c.cuando || 'No especificado'}
- Dónde: ${c.donde || 'No especificado'}
- Por qué: ${c.por_que || 'No especificado'}
- Para qué: ${c.para_que || 'No especificado'}`;
        const nombreRedes = contexto.perfil.nombre || 'el candidato';
        if (contexto.tipo === 'redes') {
            return `${baseInfo}

INSTRUCCIÓN: Crea 5 versiones de un post para redes sociales en PRIMERA PERSONA de ${nombreRedes}, usando sus muletillas, frases recurrentes, palabras clave y tono. Cada versión debe sentirse auténtica, no como texto de IA genérico. Responde las 7 preguntas básicas de forma natural dentro del texto.

REGLAS:
- Cada versión debe ser distinta: enfoque, ángulo, longitud o tono ligeramente diferente.
- Menciona a ${nombreRedes} en cada caption al menos una vez.
- Incluye hashtags relevantes y una idea de imagen para cada versión.

Genera UN ÚNICO OBJETO JSON:
{
  "versiones": [
    {
      "caption": "Texto del caption versión 1 de 80-150 palabras en primera persona",
      "hashtags": ["#...", "#..."],
      "idea_imagen": "Descripción de imagen o diseño para la versión 1"
    },
    {
      "caption": "Versión 2 del caption",
      "hashtags": ["#...", "#..."],
      "idea_imagen": "Idea de imagen versión 2"
    },
    {
      "caption": "Versión 3 del caption",
      "hashtags": ["#...", "#..."],
      "idea_imagen": "Idea de imagen versión 3"
    },
    {
      "caption": "Versión 4 del caption",
      "hashtags": ["#...", "#..."],
      "idea_imagen": "Idea de imagen versión 4"
    },
    {
      "caption": "Versión 5 del caption",
      "hashtags": ["#...", "#..."],
      "idea_imagen": "Idea de imagen versión 5"
    }
  ]
}`;
        }
        const nombreCandidato = contexto.perfil.nombre || 'el candidato';
        return `${baseInfo}

INSTRUCCIÓN: Redacta un boletín de campaña completo en la voz del candidato. Usa sus muletillas, frases recurrentes, palabras clave y tono. El boletín debe responder las 7 preguntas básicas (qué, quién, cómo, cuándo, dónde, por qué, para qué) de forma clara y fluida. Debe sonar como si el candidato lo estuviera diciendo, no como texto de IA genérico.

REGLAS DE PERSONALIZACIÓN:
- El candidato se llama **${nombreCandidato}**; menciónalo por nombre al menos 2 veces en el desarrollo y una vez en la bajada o título.
- El título debe sentirse propio de su campaña, no genérico.

Estructura obligatoria:
- Título: llamativo, alineado al tema e idealmente con el nombre del candidato.
- Bajada: 1-2 oraciones que resuman el mensaje central y enganchen a leer el desarrollo.
- Desarrollo: cuerpo completo de 250-400 palabras en voz del candidato. Incluye apertura con gancho, qué se anuncia, quién participa, cómo se hará, cuándo, dónde, por qué es importante, para qué sirve, y cierre con llamado a la acción.

Genera UN ÚNICO OBJETO JSON:
{
  "titulo": "Título atractivo del boletín con el nombre de ${nombreCandidato}",
  "bajada": "Bajada de 1-2 oraciones que resuma el mensaje principal y mencione a ${nombreCandidato}",
  "desarrollo": "Cuerpo completo del boletín de 250-400 palabras en voz del candidato, mencionando a ${nombreCandidato}"
}`;
    }
    parsearHuella(text) {
        const clean = this.extraerJson(text);
        const fallback = {
            palabras_clave: [],
            muletillas: [],
            frases_recurrentes: [],
            llamados_accion: [],
            tono: '',
            propuesta_central: '',
            estilo_redes: '',
        };
        try {
            const parsed = JSON.parse(clean);
            return {
                palabras_clave: Array.isArray(parsed.palabras_clave) ? parsed.palabras_clave : [],
                muletillas: Array.isArray(parsed.muletillas) ? parsed.muletillas : [],
                frases_recurrentes: Array.isArray(parsed.frases_recurrentes) ? parsed.frases_recurrentes : [],
                llamados_accion: Array.isArray(parsed.llamados_accion) ? parsed.llamados_accion : [],
                tono: String(parsed.tono || ''),
                propuesta_central: String(parsed.propuesta_central || ''),
                estilo_redes: String(parsed.estilo_redes || ''),
            };
        }
        catch (e) {
            this.logger.error('Error parseando huella de Anthropic:', e, text);
            return fallback;
        }
    }
    parsearGeneracion(text, esRedes) {
        const clean = this.extraerJson(text);
        try {
            const parsed = JSON.parse(clean);
            if (esRedes) {
                const versionesRaw = Array.isArray(parsed.versiones)
                    ? parsed.versiones
                    : parsed.versiones
                        ? [parsed.versiones]
                        : [];
                const versiones = versionesRaw.map((v) => ({
                    caption: String(v.caption || v.texto || ''),
                    hashtags: Array.isArray(v.hashtags) ? v.hashtags : [],
                    idea_imagen: String(v.idea_imagen || ''),
                }));
                if (versiones.length === 0 && (parsed.caption || parsed.texto)) {
                    versiones.push({
                        caption: String(parsed.caption || parsed.texto || ''),
                        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
                        idea_imagen: String(parsed.idea_imagen || ''),
                    });
                }
                return {
                    caption: versiones[0]?.caption || '',
                    hashtags: versiones[0]?.hashtags || [],
                    idea_imagen: versiones[0]?.idea_imagen || '',
                    versiones_redes: versiones,
                };
            }
            return {
                titulo: String(parsed.titulo || ''),
                bajada: String(parsed.bajada || ''),
                desarrollo: String(parsed.desarrollo || ''),
                texto: String(parsed.desarrollo || parsed.texto || ''),
            };
        }
        catch (e) {
            this.logger.error('Error parseando generación de Anthropic:', e, text);
            return esRedes
                ? { caption: clean, hashtags: [], idea_imagen: '', versiones_redes: [] }
                : { titulo: 'Boletín generado', bajada: '', desarrollo: clean, texto: clean };
        }
    }
    async consultarPolitico(input) {
        const system = `Eres un estratega electoral senior. Tienes acceso a datos reales de la campaña. Responde la pregunta del usuario usando ÚNICAMENTE la información del contexto que se te proporciona. Si no hay datos suficientes, di claramente qué falta. No inventes cifras. Sé concreto, accionable y devuelve la respuesta en markdown con listas y tablas cuando sea útil.`;
        const user = `CONTEXTO DE LA CAMPAÑA (datos reales del sistema):
${JSON.stringify(input.contexto, null, 2)}

PREGUNTA DEL USUARIO:
${input.pregunta}

Responde en español, de manera directa y estratégica. Incluye cifras del contexto cuando aporten valor. Si la pregunta pide una acción concreta, termina con recomendaciones ejecutivas.`;
        const response = await this.getClient().messages.create({
            model: this.model,
            max_tokens: 4096,
            temperature: 0.4,
            system,
            messages: [{ role: 'user', content: user }],
        });
        return response.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join(' ');
    }
    async analizarSeccion(datos) {
        const prompt = this.construirPromptSeccion(datos);
        const response = await this.getClient().messages.create({
            model: this.model,
            max_tokens: 2048,
            temperature: 0.3,
            system: 'Eres un estratega electoral senior y consultor político. Analiza datos reales de una sección electoral y devuelve SIEMPRE un único objeto JSON válido sin markdown ni explicaciones adicionales.',
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join(' ');
        return this.parsearAnalisisSeccion(text);
    }
    construirPromptSeccion(datos) {
        return `Analiza los datos agregados de la Sección ${datos.seccion} (Municipio: ${datos.municipio}).

DATOS AGREGADOS:
- Lista Nominal: ${datos.lista_nominal.toLocaleString()}
- Total Votos Emitidos: ${datos.total_votos.toLocaleString()} (Participación: ${datos.porcentaje_participacion.toFixed(2)}%)
- Votos Nulos en la Sección: ${datos.votos_nulos.toLocaleString()} (${datos.porcentaje_nulos.toFixed(2)}% del total)
- Actor Ganador: ${datos.actor_ganador}

DESGLOSE DE VOTOS POR ACTOR:
${JSON.stringify(datos.desglose, null, 2)}

DESGLOSE POR CASILLA E INCIDENCIAS:
${JSON.stringify(datos.desglose_casillas, null, 2)}

TAREA:
1. Evalúa si el volumen de votos nulos o las observaciones de las casillas ("Grupo de recuento", etc.) representan un riesgo de impugnación legal (Defensa Electoral).
2. Proyecta los votos mínimos necesarios para ganar la sección basándote en la lista nominal y la participación observada.
3. Devuelve tu análisis estrictamente en formato JSON con exactamente estas claves:
{
  "proyeccion_votos": integer,
  "nivel_riesgo": "ALTO" | "MEDIO" | "BAJO",
  "auditoria_nulos_observaciones": "string",
  "estrategia": ["string", "string"]
}

Reglas:
- proyeccion_votos debe ser un número entero razonable (mayor que la mitad de votos válidos proyectados).
- estrategia debe ser un array con 2 a 5 líneas de acción concretas para la campaña.`;
    }
    parsearAnalisisSeccion(text) {
        const clean = this.extraerJson(text);
        const fallback = {
            proyeccion_votos: 0,
            nivel_riesgo: 'MEDIO',
            auditoria_nulos_observaciones: '',
            estrategia: [],
        };
        try {
            const parsed = JSON.parse(clean);
            const riesgo = ['ALTO', 'MEDIO', 'BAJO'].includes(parsed.nivel_riesgo)
                ? parsed.nivel_riesgo
                : 'MEDIO';
            return {
                proyeccion_votos: Number(parsed.proyeccion_votos) || 0,
                nivel_riesgo: riesgo,
                auditoria_nulos_observaciones: String(parsed.auditoria_nulos_observaciones || ''),
                estrategia: Array.isArray(parsed.estrategia) ? parsed.estrategia.map(String) : [],
            };
        }
        catch (e) {
            this.logger.error('Error parseando análisis de sección de Anthropic:', e, text);
            return fallback;
        }
    }
    extraerJson(text) {
        const trimmed = text.trim();
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start !== -1 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }
};
exports.AnthropicService = AnthropicService;
exports.AnthropicService = AnthropicService = AnthropicService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AnthropicService);
//# sourceMappingURL=anthropic.service.js.map