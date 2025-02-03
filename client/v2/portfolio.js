'use strict';

/**
 * Description of the available api...
 */

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const selectSort = document.querySelector('#sort-select');
const selectFilter = document.querySelector('#filter-select');
const selectCategory = document.querySelector('#category_select');

/**
 * Set global value
 */
const setCurrentDeals = ({ result, meta }) => {
    currentDeals = result;
    currentPagination = meta;
};

/**
 * Fetch deals from api
 */
const fetchDeals = async (page = 1, size = 6, sort = '', filter = '', category = 'none') => {
    try {
        const url = `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}${sort ? `&sort=${sort}` : ''}${filter ? `&filter=${filter}` : ''}`;
        const response = await fetch(url);
        const body = await response.json();

        if (body.success !== true) {
            return { currentDeals, currentPagination };
        }

        let results = body.data.result;

        // Filtrage par catégorie
        if (category === 'vinted') {
            results = results.filter(deal => deal.source === 'vinted');
        }

        //sorters
        if (sort === 'price-asc') {
            results.sort((a, b) => a.price - b.price);
        } else if (sort === 'price-desc') {
            results.sort((a, b) => b.price - a.price);
        } else if (sort === 'date-asc') {
            results.sort((a, b) => a.published - b.published);
        } else if (sort === 'date-desc') {
            results.sort((a, b) => b.published - a.published);
        }

        //filters
        if (filter === 'discount') {
            results.sort((a, b) => b.discount - a.discount);
        }
        else if (filter === 'comments') {
            results.sort((a, b) => b.comments - a.comments);
        }
        else if (filter === 'hot') {
            results.sort((a, b) => {
                const hotScoreA = (a.discount * 0.7) + (a.comments * 0.3);
                const hotScoreB = (b.discount * 0.7) + (b.comments * 0.3);
                return hotScoreB - hotScoreA;
            });
        }

        return {
            ...body.data,
            result: results
        };
    } catch (error) {
        return { currentDeals, currentPagination };
    }
};

/**
 * Render functions...
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

const renderPagination = pagination => {
    const { currentPage, pageCount } = pagination;
    const options = Array.from(
        { 'length': pageCount },
        (value, index) => `<option value="${index + 1}">${index + 1}</option>`
    ).join('');

    selectPage.innerHTML = options;
    selectPage.selectedIndex = currentPage - 1;
};

const renderLegoSetIds = deals => {
    const ids = getIdsFromDeals(deals);
    const options = ids.map(id =>
        `<option value="${id}">${id}</option>`
    ).join('');

    selectLegoSetIds.innerHTML = options;
};

const renderIndicators = pagination => {
    const { count } = pagination;
    spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
    renderDeals(deals);
    renderPagination(pagination);
    renderIndicators(pagination);
    renderLegoSetIds(deals);
};

/**
 * Event Listeners
 */
selectShow.addEventListener('change', async (event) => {
    const deals = await fetchDeals(
        currentPagination.currentPage,
        parseInt(event.target.value),
        selectSort.value,
        selectFilter.value,
        selectCategory.value
    );
    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

document.addEventListener('DOMContentLoaded', async () => {
    const deals = await fetchDeals(
        1,
        6,
        selectSort.value,
        selectFilter.value,
        selectCategory.value
    );
    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

selectFilter.addEventListener('change', async (event) => {
    const deals = await fetchDeals(
        currentPagination.currentPage,
        parseInt(selectShow.value),
        selectSort.value,
        event.target.value,
        selectCategory.value
    );
    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
    const deals = await fetchDeals(
        parseInt(event.target.value),
        parseInt(selectShow.value),
        selectSort.value,
        selectFilter.value,
        selectCategory.value
    );
    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

selectSort.addEventListener('change', async (event) => {
    const deals = await fetchDeals(
        currentPagination.currentPage,
        parseInt(selectShow.value),
        event.target.value,
        selectFilter.value,
        selectCategory.value
    );
    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});

selectCategory.addEventListener('change', async (event) => {
    const deals = await fetchDeals(
        currentPagination.currentPage,
        parseInt(selectShow.value),
        selectSort.value,
        selectFilter.value,
        event.target.value
    );
    setCurrentDeals(deals);
    render(currentDeals, currentPagination);
});