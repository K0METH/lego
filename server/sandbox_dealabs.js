const dealabs = require("./websites/dealabs");

async function sandbox(pages = 3) {
  try {
    console.log(`Scraping ${pages} pages from Dealabs`);

    const deals = await dealabs.scrape(pages);

    console.log(`Found ${deals.length} deals`);
    await dealabs.saveToDisk(deals);
    console.log("Deals saved in data/dealabs.json");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

const [, , pages] = process.argv;

sandbox(parseInt(pages) || 3);
