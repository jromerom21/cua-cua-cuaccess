
const fastify = require('fastify')({ logger: false });
const path = require('path');
const fs = require('fs');
const { default: PQueue } = require('p-queue');
const alasql = require('alasql');

// --- CARGA DE LIBRERÍA MDB-READER CON PARCHE ---
let MDBReader = require('mdb-reader');
if (MDBReader.default) MDBReader = MDBReader.default;

// --- CONFIGURACIÓN INICIAL ---
const queue = new PQueue({ concurrency: 1 }); // Cola para evitar bloqueos de Access
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// --- SERVIDOR DE ARCHIVOS ESTÁTICOS (FRONTEND) ---
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/', 
});

// --- FUNCIÓN NÚCLEO: EL MOTOR DE CONSULTA ---
// Esta función abre el archivo, detecta la tabla y ejecuta el SQL
async function ejecutarConsulta(dbId, queryId, valorFiltro = null) {
    const dbEntry = config.databases.find(d => d.id === dbId);
    const queryEntry = dbEntry.queries[queryId];
    const sqlOriginal = queryEntry.sql;

    return await queue.add(async () => {
        const buffer = fs.readFileSync(dbEntry.path);
        const reader = new MDBReader(buffer);
        
        const matchTabla = sqlOriginal.match(/FROM\s+([a-zA-Z0-9_]+)/i);
        const nombreTabla = matchTabla[1];
        const rawData = reader.getTable(nombreTabla).getData();
        const sqlAlasql = sqlOriginal.replace(new RegExp(nombreTabla, 'g'), '?');

        // --- MANEJO DE TIPOS DE DATOS ---
        let valorFinal = valorFiltro;
        if (valorFiltro !== null) {
            const tipo = queryEntry.param_tipo;
            if (tipo === 'numero') {
                valorFinal = Number(valorFiltro);
            } else if (tipo === 'texto') {
                valorFinal = String(valorFiltro);
            } else if (tipo === 'fecha') {
                valorFinal = new Date(valorFiltro);
            }
        }

        const argumentos = valorFiltro !== null ? [rawData, valorFinal] : [rawData];
        return alasql(sqlAlasql, argumentos);
    });
}


// --- RUTA: CATÁLOGO DE SERVICIOS (Para el Frontend) ---
fastify.get('/api/catalog', async () => {
    const catalog = [];
    config.databases.forEach(db => {
        Object.entries(db.queries).forEach(([id, info]) => {
            catalog.push({
                dbId: db.id,
                queryId: id,
                label: info.label,
                tipo: info.tipo,
                dbDesc: db.desc
            });
        });
    });
    return catalog;
});

// --- RUTA: CONSULTA DIRECTA (Sin parámetros) ---
fastify.get('/api/direct/:dbId/:queryId', async (request, reply) => {
    const { dbId, queryId } = request.params;
    try {
        const res = await ejecutarConsulta(dbId, queryId);
        return { success: true, count: res.length, results: res };
    } catch (e) {
        return reply.code(400).send({ success: false, error: e.message });
    }
});

// --- RUTA: CONSULTA CON FILTRO (Con valor en URL) ---
fastify.get('/api/filter/:dbId/:queryId/:valor', async (request, reply) => {
    const { dbId, queryId, valor } = request.params;
    try {
        const res = await ejecutarConsulta(dbId, queryId, valor);
        return { success: true, count: res.length, results: res };
    } catch (e) {
        return reply.code(400).send({ success: false, error: e.message });
    }
});

// --- INICIO DEL SERVIDOR ---
const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.clear();
        console.log("==================================================");
        console.log("       🚀 CUA CUA CUACCESS ENGINE v2.0           ");
        console.log("==================================================");
        console.log("Servidor Web y API: http://localhost:3000");
        console.log("Status: Sistema Operativo y Multiplataforma");
        console.log("--------------------------------------------------");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
