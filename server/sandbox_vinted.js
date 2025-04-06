const vinted = require("./websites/vinted");

async function sandbox(setId = "42182") {
  try {
    console.log(`Recherche des ventes pour le set LEGO ${setId}...`);

    const sales = await vinted.scrape(setId);
    console.log(`${sales.length} ventes trouvées`);

    await vinted.saveToDisk(sales, setId);
    console.log(`Ventes sauvegardées dans data/vinted_${setId}.json`);

    process.exit(0);
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  }
}

const [, , setId] = process.argv;
sandbox(setId);
