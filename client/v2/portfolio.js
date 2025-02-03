// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

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
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals= document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const selectSort = document.querySelector('#sort-select');
const selectFilter = document.querySelector('#filter-select'); 
/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @param  {String}  [sort=''] - sort parameter
 * @param  {String}  [filter=''] - filter parameter
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6, sort = '', filter = '') => {
    try {
        const url = `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}${sort ? `&sort=${sort}` : ''}${filter ? `&filter=${filter}` : ''}`;
        const response = await fetch(url);
        const body = await response.json();
        console.log('Un deal:', body.data.result[0]);
        if (body.success !== true) {
            return { currentDeals, currentPagination };
        }
        //sorters

        //sorters
        // APRÈS - Logique de tri corrigée
        if (sort === 'price-asc') {
            body.data.result.sort((a, b) => a.price - b.price);
        } else if (sort === 'price-desc') {
            body.data.result.sort((a, b) => b.price - a.price);
        } else if (sort === 'date-asc') {
            body.data.result.sort((a, b) => a.published - b.published);
        } else if (sort === 'date-desc') {
            body.data.result.sort((a, b) => b.published - a.published);
        }

        //filters
        if (filter === 'discount') {
            body.data.result.sort((a, b) => b.discount - a.discount);
        }
        else if (filter === 'comments') {
            body.data.result.sort((a, b) => {
                return b.comments - a.comments;
            });
        }
        else if (filter === 'hot') {
            body.data.result.sort((a, b) => {
                const hotScoreA = (a.discount * 0.7) + (a.comments * 0.3);
                const hotScoreB = (b.discount * 0.7) + (b.comments * 0.3);
                return hotScoreB - hotScoreA;
            });
        }

        
        return body.data;
    } catch (error) {
        return { currentDeals, currentPagination };
    }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}">${deal.title}</a>
        <span>${deal.price}</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals)
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener('change', async (event) => {
    const deals = await fetchDeals(
        currentPagination.currentPage,
        parseInt(event.target.value),
        selectSort.value,
        selectFilter.value              // Ajout du filtre
    );

    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
    const deals = await fetchDeals(
        1,
        6,
        selectSort.value,
        selectFilter.value              // Ajout du filtre
    );

    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

selectFilter.addEventListener('change', async (event) => {
    const deals = await fetchDeals(
        currentPagination.currentPage,
        parseInt(selectShow.value),
        selectSort.value,
        event.target.value
    );

    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
    const deals = await fetchDeals(
        parseInt(event.target.value),
        parseInt(selectShow.value),
        selectSort.value,
        selectFilter.value
    );

    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

selectSort.addEventListener('change', async (event) => {
    const deals = await fetchDeals(
        currentPagination.currentPage,
        parseInt(selectShow.value),
        event.target.value,
        selectFilter.value
    );

    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});
