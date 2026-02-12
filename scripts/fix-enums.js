const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Conectado a la base de datos...');

        // Los comandos ALTER TYPE ADD VALUE no pueden ejecutarse dentro de una transacción en versiones antiguas de PG
        // Por eso los ejecutamos uno por uno
        const values = ['BENEFITS', 'FEATURED_CATEGORIES', 'BRAND_ESSENCE'];

        for (const val of values) {
            try {
                await client.query(`ALTER TYPE "TipoSeccionHome" ADD VALUE '${val}'`);
                console.log(`Valor '${val}' añadido con éxito.`);
            } catch (e) {
                if (e.message.includes('already exists')) {
                    console.log(`Valor '${val}' ya existía.`);
                } else {
                    console.error(`Error añadiendo valor '${val}':`, e.message);
                }
            }
        }
    } catch (err) {
        console.error('Error de conexión:', err);
    } finally {
        await client.end();
    }
}

run();
