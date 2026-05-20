/* eslint-disable */
import fs from 'fs/promises';
import path from 'path';
import heicConvert from 'heic-convert';

const rootDir = process.cwd();
const photosDir = path.join(rootDir, 'public', 'photos');

const folderStructure = {
  day1: [
    '01_llegada',
    '02_hyde_park',
    '03_green_park',
    '04_abadia_de_westminster',
    '05_big_ben',
    '06_london_eye',
    '07_memorial_covid',
    '08_trafalgar_square',
    '09_national_gallery',
    '10_covent_garden',
    '11_chinatown',
    '12_piccadilly_circus',
    '13_leicester_square',
    '14_soho'
  ],
  day2: [
    '01_st_pancras',
    '02_kings_cross',
    '03_anden_9_3_4',
    '04_camden_town',
    '05_little_venice',
    '06_abbey_road',
    '07_natural_history_museum',
    '08_stamford_bridge',
    '09_notting_hill',
    '10_buckingham_palace'
  ],
  day3: [
    '01_the_garden_at_120',
    '02_leadenhall_market',
    '03_tower_bridge',
    '04_st_paul_s_cathedral',
    '05_buckingham_palace_de_dia',
    '06_hyde_park_ardillas',
    '07_greenwich_park',
    '08_canary_wharf',
    '09_londres_de_noche'
  ],
  day4: [
    '01_paseo_por_londres',
    '02_tienda_m_m_s',
    '03_chinatown_comida',
    '04_harrods',
    '05_hyde_park',
    '06_aeropuerto'
  ]
};

async function ensureDirectoriesExist() {
  console.log('📂 Verificando y creando estructura de carpetas de destinos...');
  for (const [dayName, stops] of Object.entries(folderStructure)) {
    const dayPath = path.join(photosDir, dayName);
    // Ensure day folder exists
    await fs.mkdir(dayPath, { recursive: true });

    // Also ensure the "videos" folder exists inside each day folder!
    const videosPath = path.join(dayPath, 'videos');
    try {
      await fs.access(videosPath);
    } catch {
      await fs.mkdir(videosPath, { recursive: true });
      console.log(`  📁 Creada carpeta de videos: public/photos/${dayName}/videos`);
    }

    for (const stopFolderName of stops) {
      const stopFolderPath = path.join(dayPath, stopFolderName);
      try {
        await fs.access(stopFolderPath);
      } catch {
        // Folder does not exist, create it!
        await fs.mkdir(stopFolderPath, { recursive: true });
        console.log(`  📁 Creada subcarpeta: public/photos/${dayName}/${stopFolderName}`);
      }
    }
  }
}

async function processDirectory() {
  // 1. First, automatically create the folder structure
  await ensureDirectoriesExist();

  console.log('\n🚀 Iniciando procesamiento de fotos y videos...');

  const days = ['day1', 'day2', 'day3', 'day4'];
  const generatedData = {};

  for (let i = 0; i < days.length; i++) {
    const dayName = days[i];
    const dayNum = i + 1;
    const dayPath = path.join(photosDir, dayName);

    console.log(`\n📅 Procesando ${dayName}...`);
    generatedData[dayNum] = {
      general: [],
      stops: {}
    };

    try {
      await fs.access(dayPath);
    } catch {
      console.log(`⚠️  La carpeta ${dayName} no existe. Saltando...`);
      continue;
    }

    const items = await fs.readdir(dayPath, { withFileTypes: true });

    // 1. Process files directly in the day folder root (General photos)
    const rootFiles = items.filter((item) => item.isFile());
    rootFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    for (const fileItem of rootFiles) {
      const file = fileItem.name;
      const ext = path.extname(file).toLowerCase();
      const filePath = path.join(dayPath, file);
      const baseName = path.basename(file, path.extname(file));

      await handleFileConversion(file, ext, filePath, baseName, dayPath, dayName, generatedData[dayNum].general);
    }

    // 2. Process subdirectories (Destination folders)
    const subDirs = items.filter((item) => item.isDirectory());
    subDirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    for (const subDirItem of subDirs) {
      const subDirName = subDirItem.name;
      const subDirPath = path.join(dayPath, subDirName);

      generatedData[dayNum].stops[subDirName] = [];

      const subFiles = await fs.readdir(subDirPath);
      subFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      let convertedCount = 0;
      for (const file of subFiles) {
        const ext = path.extname(file).toLowerCase();
        const filePath = path.join(subDirPath, file);
        const baseName = path.basename(file, path.extname(file));

        await handleFileConversion(file, ext, filePath, baseName, subDirPath, `${dayName}/${subDirName}`, generatedData[dayNum].stops[subDirName]);
        convertedCount++;
      }

      if (generatedData[dayNum].stops[subDirName].length > 0) {
        console.log(`  🖼️  Detectados ${generatedData[dayNum].stops[subDirName].length} archivos en: ${subDirName}`);
      }
    }
  }

  // Generate src/data/photosData.js
  const outputPath = path.join(rootDir, 'src', 'data', 'photosData.js');
  const fileContent = `// Archivo generado automáticamente por el script process-media.js
// No editar manualmente

export const photosData = ${JSON.stringify(generatedData, null, 2)};
`;

  await fs.writeFile(outputPath, fileContent);
  console.log(`\n🎉 ¡Completado con éxito! Se ha generado ${outputPath}`);
}

async function handleFileConversion(file, ext, filePath, baseName, folderPath, webSubPath, arrayDest) {
  // HEIC conversion
  if (ext === '.heic') {
    const targetJpgName = `${baseName}.jpg`;
    const targetJpgPath = path.join(folderPath, targetJpgName);

    try {
      await fs.access(targetJpgPath);
      arrayDest.push({
        src: `/photos/${webSubPath}/${targetJpgName}`,
        type: 'image',
        caption: `${baseName}`
      });
      return;
    } catch {}

    try {
      console.log(`  📸 Convirtiendo HEIC a JPG: ${file}...`);
      const inputBuffer = await fs.readFile(filePath);
      const outputBuffer = await heicConvert({
        buffer: inputBuffer,
        format: 'JPEG',
        quality: 0.85
      });

      await fs.writeFile(targetJpgPath, outputBuffer);
      await fs.unlink(filePath); // Delete HEIC

      arrayDest.push({
        src: `/photos/${webSubPath}/${targetJpgName}`,
        type: 'image',
        caption: `${baseName}`
      });
    } catch (err) {
      console.error(`  ❌ Error convirtiendo ${file}:`, err.message);
    }
  }
  // Standard images
  else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    arrayDest.push({
      src: `/photos/${webSubPath}/${file}`,
      type: 'image',
      caption: `${baseName}`
    });
  }
  // Videos
  else if (['.mov', '.mp4', '.webm'].includes(ext)) {
    arrayDest.push({
      src: `/photos/${webSubPath}/${file}`,
      type: 'video',
      caption: `${baseName}`
    });
  }
}

processDirectory().catch((err) => {
  console.error('💥 Error crítico procesando media:', err);
});
