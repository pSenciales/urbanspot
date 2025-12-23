// SCRIPTS PARA CORREGIR USUARIOS CON CAMPOS DESACTUALIZADOS
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import User from "../src/models/User"; 
import dbConnect from "../src/lib/mongo"; 

async function migrate() {
  try {
    console.log("🔌 Conectando a la base de datos...");
    await dbConnect();
    console.log("✅ Conectado.");

    console.log("🔄 Caso A: Migrando usuarios con 'points' numérico...");
    const resultA = await User.collection.updateMany(
      { points: { $type: "number" } }, 
      [
        {
          $set: {
            points: {
              explorer: "$points", 
              photographer: 0
            }
          }
        }
      ]
    );
    console.log(`   -> Corregidos: ${resultA.modifiedCount}`);

    console.log("🔄 Caso B: Migrando usuarios con 'puntos_explorador'...");
    const resultB = await User.collection.updateMany(
      { puntos_explorador: { $exists: true } }, 
      [
        {
          $set: {
            points: {
              explorer: "$puntos_explorador",
              photographer: { $ifNull: ["$puntos_fotografo", 0] }
            }
          }
        },
        {
          $unset: ["puntos_explorador", "puntos_fotografo"] 
        }
      ]
    );
    console.log(`   -> Corregidos: ${resultB.modifiedCount}`);

    console.log("🔄 Caso C: Inicializando usuarios que no tienen campo 'points'...");
    const resultC = await User.collection.updateMany(
      { points: { $exists: false } },
      {
        $set: {
          points: { explorer: 0, photographer: 0 }
        }
      }
    );
    console.log(`   -> Inicializados: ${resultC.modifiedCount}`);

    console.log("🔄 Caso D: Inicializando campo 'image' vacío si falta...");
    const resultD = await User.collection.updateMany(
      { image: { $exists: false } },
      {
        $set: {
          image: "" 
        }
      }
    );
    console.log(`   -> Imagen inicializada: ${resultD.modifiedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

migrate();