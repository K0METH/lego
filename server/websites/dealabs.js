const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs").promises;

/**
 * Parse webpage data response
 * @param  {String} data - HTML response
 * @return {Array} deals
 */
const parse = (data) => {
  const $ = cheerio.load(data, { xmlMode: true });

  const deals = $("div.js-threadList article")
    .map((i, element) => {
      const link = $(element).find('a[data-t="threadLink"]').attr("href");

      const data = JSON.parse($(element).find("div.js-vue2").attr("data-vue2"));

      const thread = data.props.thread || null;
      const retail = thread.nextBestPrice || null;
      const price = thread.price || null;
      const discount =
        price && retail ? parseInt((1 - price / retail) * 100) : null;
      const temperature = +thread.temperature || null;
      const image = `https://static-pepper.dealabs.com/threads/raw/${thread.mainImage.slotId}/${thread.mainImage.name}/re/300x300/qt/60/${thread.mainImage.name}.${thread.mainImage.ext}`;
      const comments = +thread.commentCount || 0;
      const published = new Date(thread.publishedAt * 1000) || null;
      const title = thread.title || null;

      // Match uniquement les ID à 5 chiffres
      const idMatch = link ? link.match(/\b\d{5}\b/) : null;
      const id = idMatch ? idMatch[0] : thread?.threadId || null;

      return {
        link,
        retail,
        price,
        discount,
        temperature,
        image,
        comments,
        published,
        title,
        id,
      };
    })
    .get();

  return deals.filter((deal) => /^\d{5}$/.test(deal.id));
};

/**
 * Scrape deals from dealabs
 * @param {Number} pages - number of pages to scrape
 * @returns {Array} deals
 */
const scrape = async (pages = 1) => {
  const allDeals = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const response = await fetch(
        `https://www.dealabs.com/search?q=lego&page=${page}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            Referer: "https://www.google.com/",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const body = await response.text();
      const deals = parse(body);
      allDeals.push(...deals);
    } catch (error) {
      console.error(`Error scraping page ${page}: ${error.message}`);
    }
  }

  return allDeals;
};

/**
 * Save deals to JSON file
 * @param {Array} deals - deals to save
 */
const saveToDisk = async (deals) => {
  await fs.writeFile("./data/dealabs.json", JSON.stringify(deals, null, 2));
};

module.exports = {
  scrape,
  saveToDisk,
};
