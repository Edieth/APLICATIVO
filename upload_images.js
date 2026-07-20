const https = require('https');

const imagesData = [
  { id: "61649-260", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/Attitude%20Diaper%20Cream%20Zinc%20Unscented.jpg?alt=media&token=47fc630b-f801-4427-87fc-3a9565c063c4" },
  { id: "72288-300", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/basic%20care%20acetaminophen.jpg?alt=media&token=bccdfc03-04ae-415c-b850-23fcd82eec82" },
  { id: "87053-003", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/Prime%20Tooth%20Care%20Hami%20Melon.jpg?alt=media&token=6882e124-1b57-4dd5-a302-f0a99ba65586" },
  { id: "58228-2309", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/First%20Aid%20Burn%20Cream.jpg?alt=media&token=cf1fcb36-c1a2-4371-bb5a-286761f75445" },
  { id: "41520-604", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/care%20one%20ibuprofen.jfif?alt=media&token=350a50dc-f5a5-42f5-8af7-6fd15833c101" },
  { id: "43473-050", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/health%20and%20.beyond%20Triple%20Antibiotic.jpg?alt=media&token=fabc652f-3f0d-4eb3-ba84-1843596eab6e" },
  { id: "58228-2896", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/PS-2896%20Hydrocortisone%20Cream%201%25%2C%200.9g.jfif?alt=media&token=f5124329-81a6-4563-bf16-056557377d4a" },
  { id: "53329-074", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/RemedyBarrierCream.jpg?alt=media&token=8c575918-a234-45af-a5f5-be383592128f" },
  { id: "72288-603", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/basic%20care%20daytime%20severe%20cold%20and%20flu.jpg?alt=media&token=f6f99eff-0a38-44f6-ba22-624e5ef18bc8" },
  { id: "61387-251", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/Crash%20cream.jpg?alt=media&token=076b298b-b3ff-4e7e-bc17-fc36facc0e9c" },
  { id: "69423-724", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/First%20Aid%20Burn%20Cream.jpg?alt=media&token=cf1fcb36-c1a2-4371-bb5a-286761f75445" },
  { id: "76354-416", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/acne%20calming%20water%20cream.jpg?alt=media&token=79a6a209-179f-404d-8653-d46b3fab1455" },
  { id: "71101-220", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/TheraCare%20Hydrocortisone%20Cream.jpg?alt=media&token=c84831cf-0c69-4fb5-bc87-0e18f4bfcfd9" },
  { id: "82876-221", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/Healing%20Hand%20Cream%202000mg.jpg?alt=media&token=ed247da8-1d63-4b8a-9cc8-ddf13400c390" },
  { id: "51316-200", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/CVS%20Health%20Medicated%20Chest%20Rub.jpg?alt=media&token=38acaef2-0325-44af-96dc-deac73f17257" },
  { id: "70108-298", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/Smart%20care%20hand%20sanitizer.jpg?alt=media&token=f01f3ab9-1833-4484-abd4-fd4968c8acd9" },
  { id: "41163-209", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/equaline%20first%20aid%20antibiotic.png?alt=media&token=b546a49a-4a66-4b1e-a631-dd510608fb74" },
  { id: "82461-417", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/Capsaicin%200.035%25%20cream.jpg?alt=media&token=a64c324a-82bc-43c0-a07a-813767fbfff6" },
  { id: "72288-186", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/basic%20care%20nighttime%20sleep%20aid.jpg?alt=media&token=bde43e8a-b188-46f6-97d6-f90bf83e921f" },
  { id: "53208-710", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/belif%20The%20true%20cream%20aqua.jpg?alt=media&token=3b9bea58-96a4-4880-913b-4c9d848f83e9" },
  { id: "0299-4144", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/Cetaphil.jpg?alt=media&token=138c781e-5c33-4f56-b1d1-6cbab1b631eb" },
  { id: "72330-710", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/belif%20The%20true%20cream%20aqua.jpg?alt=media&token=3b9bea58-96a4-4880-913b-4c9d848f83e9" },
  { id: "21130-987", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/cold%20hot%20medicated%20patches.jpg?alt=media&token=d2be17d4-862c-40fd-bda1-828022632ae0" },
  { id: "0135-0642", url: "https://firebasestorage.googleapis.com/v0/b/insumosmedicos-3079b.firebasestorage.app/o/Tums%20Chewy%20Bites%20Orange.jpg?alt=media&token=2f4a5299-811f-426c-94ad-fa0f7dafaa10" }
];

const projectId = "insumosmedicos-3079b";

function updateDocument(id, url) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      fields: {
        imageUrl: { stringValue: url }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${projectId}/databases/(default)/documents/product_enrichment/${id}?updateMask.fieldPaths=imageUrl`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${id} actualizado`);
          resolve();
        } else {
          console.error(`❌ ${id} falló: ${res.statusCode} - ${data}`);
          resolve(); // Resolve to continue loop
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ ${id} error de red: ${e.message}`);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log("Iniciando subida de URLs a Firestore...");
  for (const item of imagesData) {
    await updateDocument(item.id, item.url);
  }
  console.log("Completado.");
}

run();
