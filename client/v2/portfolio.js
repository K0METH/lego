// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
"use strict";

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector("#show-select");
const selectPage = document.querySelector("#page-select");
const selectLegoSetIds = document.querySelector("#lego-set-id-select");
const sectionDeals = document.querySelector("#deals");
const spanNbDeals = document.querySelector("#nbDeals");
const selectFilter = document.querySelector("#filter-select");
const selectSort = document.querySelector("#sort-select");
const salesList = document.querySelector("#sales-list");
const spanNbSales = document.querySelector("#nbSales");
const spanAveragePrice = document.querySelector("#averagePrice");
const spanP5Price = document.querySelector("#p5Price");
const spanP25Price = document.querySelector("#p25Price");
const spanP50Price = document.querySelector("#p50Price");
const spanLifetimeValue = document.querySelector("#lifetimeValue");
const FAVORITES_KEY = "lego-favorites";

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({ result, meta }) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return { currentDeals, currentPagination };
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return { currentDeals, currentPagination };
  }
};

/**
 * Fetch sales from api for a given lego set id
 * @param  {String} id - lego set id
 * @return {Object}
 */
const fetchSales = async (id) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/sales?id=${id}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return [];
    }

    return body.data.result;
  } catch (error) {
    console.error(error);
    return [];
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = (deals) => {
  const favorites = getFavorites();
  const fragment = document.createDocumentFragment();
  const div = document.createElement("div");
  const template = deals
    .map((deal) => {
      const isFavorite = favorites.some((f) => f.uuid === deal.uuid);
      const starIcon = isFavorite ? "★" : "☆";

      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}" target="_blank" rel="noopener noreferrer">${deal.title}</a>
        <span>${deal.price}€</span>
        <button class="favorite-btn" data-uuid="${deal.uuid}">${starIcon}</button>
      </div>
    `;
    })
    .join("");

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = "<h2>Deals</h2>";
  sectionDeals.appendChild(fragment);

  // Ajouter les event listeners pour les boutons favoris
  document.querySelectorAll(".favorite-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const uuid = e.target.dataset.uuid;
      const deal = deals.find((d) => d.uuid === uuid);
      if (deal) {
        toggleFavorite(deal);
      }
    });
  });
};

/**
 * Render list of sales
 * @param  {Array} sales
 */
const renderSales = (sales) => {
  if (!sales.length) {
    salesList.innerHTML = "<p>Aucune vente trouvée</p>";
    return;
  }

  const template = sales
    .map((sale) => {
      return `
      <div class="sale">
        <a href="${sale.link}" target="_blank" rel="noopener noreferrer">${
        sale.title
      }</a>
        <span>${sale.price}€</span>
        <span>Publié le: ${new Date(sale.published).toLocaleDateString()}</span>
      </div>
    `;
    })
    .join("");

  salesList.innerHTML = template;
};

/**
 * Render indicators
 * @param {Object} indicators
 */
const renderIndicatorsSales = (indicators) => {
  const {
    totalSales,
    averagePrice,
    p5Price,
    p25Price,
    p50Price,
    lifetimeValue,
  } = indicators;

  spanNbSales.textContent = totalSales;
  spanAveragePrice.textContent = averagePrice;
  spanP5Price.textContent = p5Price;
  spanP25Price.textContent = p25Price;
  spanP50Price.textContent = p50Price;
  spanLifetimeValue.textContent = `${lifetimeValue} days`;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = (pagination) => {
  const { currentPage, pageCount } = pagination;
  const options = Array.from(
    { length: pageCount },
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join("");

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = (deals) => {
  const ids = getIdsFromDeals(deals);
  const options = ids
    .map((id) => `<option value="${id}">${id}</option>`)
    .join("");

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = (pagination) => {
  const { count } = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  const filteredDeals = filterDeals(deals);
  const sortedDeals = sortDeals(filteredDeals);
  renderDeals(sortedDeals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(sortedDeals);
};

const filterDeals = (deals) => {
  switch (selectFilter.value) {
    case "best-discount":
      return deals.filter((deal) => deal.discount >= 50);
    case "most-commented":
      return deals.filter((deal) => deal.comments >= 15);
    case "hot-deals":
      return deals.filter((deal) => deal.temperature >= 100);
    case "favorites":
      const favorites = getFavorites();
      return deals.filter((deal) =>
        favorites.some((f) => f.uuid === deal.uuid)
      );
    default:
      return deals;
  }
};

const sortDeals = (deals) => {
  const sortType = selectSort.value;

  switch (sortType) {
    case "price-asc":
      return [...deals].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...deals].sort((a, b) => b.price - a.price);
    case "date-asc":
      return [...deals].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    case "date-desc":
      return [...deals].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    default:
      return deals;
  }
};

/**
 * Calculate sales indicators
 * @param {Array} sales - list of sales
 * @returns {Object} indicators
 */
const calculateSalesIndicators = (sales) => {
  if (!sales.length) {
    return {
      totalSales: 0,
      averagePrice: 0,
      p5Price: 0,
      p25Price: 0,
      p50Price: 0,
      lifetimeValue: 0,
    };
  }

  // Filtrer et convertir les prix en nombres
  const validPrices = sales
    .map((sale) => parseFloat(sale.price))
    .filter((price) => !isNaN(price));

  if (!validPrices.length) {
    return {
      totalSales: sales.length,
      averagePrice: 0,
      p5Price: 0,
      p25Price: 0,
      p50Price: 0,
    };
  }

  // Trier les prix par ordre croissant
  const sortedPrices = [...validPrices].sort((a, b) => a - b);

  // Calculer la moyenne
  const averagePrice =
    sortedPrices.reduce((acc, price) => acc + price, 0) / sortedPrices.length;

  // Calculer les percentiles
  const getPercentile = (arr, p) => {
    const index = Math.floor(arr.length * p);
    return arr[index];
  };

  return {
    totalSales: sales.length,
    averagePrice: Math.round(averagePrice * 100) / 100,
    p5Price: getPercentile(sortedPrices, 0.05),
    p25Price: getPercentile(sortedPrices, 0.25),
    p50Price: getPercentile(sortedPrices, 0.5),
    lifetimeValue: calculateLifetimeValue(sales),
  };
};

/**
 * Calculate lifetime value in days
 * @param {Array} sales - list of sales
 * @returns {number} lifetime in days
 */
const calculateLifetimeValue = (sales) => {
  if (!sales.length) return 0;

  const dates = sales
    .map((sale) => new Date(sale.published))
    .filter((date) => date instanceof Date && !isNaN(date));

  if (!dates.length) {
    console.log("date : ", dates);
    return 0;
  }

  const oldestDate = new Date(Math.min(...dates));
  const newestDate = new Date(Math.max(...dates));

  const diffTime = Math.abs(newestDate - oldestDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Get favorites from localStorage
 * @returns {Array} array of favorite deals
 */
const getFavorites = () => {
  const favoritesJson = localStorage.getItem(FAVORITES_KEY);
  return favoritesJson ? JSON.parse(favoritesJson) : [];
};

/**
 * Save favorites to localStorage
 * @param {Array} favorites - array of favorite deals
 */
const saveFavorites = (favorites) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
};

/**
 * Toggle favorite status of a deal
 * @param {Object} deal - deal to toggle
 */
const toggleFavorite = (deal) => {
  const favorites = getFavorites();
  const index = favorites.findIndex((f) => f.uuid === deal.uuid);

  if (index === -1) {
    favorites.push(deal);
  } else {
    favorites.splice(index, 1);
  }

  saveFavorites(favorites);
  render(currentDeals, currentPagination);
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener("change", async (event) => {
  const deals = await fetchDeals(
    currentPagination.currentPage,
    parseInt(event.target.value)
  );

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

document.addEventListener("DOMContentLoaded", async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectFilter.addEventListener("change", () => {
  render(currentDeals, currentPagination);
});

selectSort.addEventListener("change", () => {
  render(currentDeals, currentPagination);
});

selectLegoSetIds.addEventListener("change", async (event) => {
  const sales = await fetchSales(event.target.value);
  renderSales(sales);
  const indicators = calculateSalesIndicators(sales);
  renderIndicatorsSales(indicators);
});
