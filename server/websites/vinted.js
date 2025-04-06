const fetch = require("node-fetch");
const fs = require("fs").promises;

/**
 * Parse API response data
 * @param  {Object} data - API response data
 * @return {Array} sales
 */
const parse = (data) => {
  try {
    const { items } = data;
    return items
      .filter((item) => item.brand_title === "LEGO")
      .map((item) => ({
        link: item.url,
        price: item.total_item_price.amount,
        title: item.title,
        published: new Date(
          item.photo?.high_resolution?.timestamp * 1000
        ).toISOString(),
        image: item.photo?.url,
        status: item.status,
      }));
  } catch (error) {
    console.error("Erreur de parsing:", error);
    return [];
  }
};

/**
 * Scrape sales for a specific LEGO set
 * @param {String} setId - LEGO set ID
 * @returns {Promise<Array>} sales
 */
const scrape = async (setId) => {
  try {
    console.log(`Recherche des ventes pour le set LEGO ${setId}...`);

    const response = await fetch(
      `https://www.vinted.fr/api/v2/catalog/items?page=1&per_page=96&search_text=lego ${setId}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "fr",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          "x-csrf-token": "75f6c9fa-dc8e-4e52-a000-e09dd4084b3e",
          cookie:
            "v_udt=bHQ1dzJ0blJNM2JGMGRYVHgvdms5cVZ5SmZUdC0tZDdVaXRkbHVFZXd1MERyLy0tMUhweE1OREZrY3R3WlhkR3ovVytIUT09; anon_id=d3a0b201-9b23-4509-bb2e-c359d706b772; anon_id=d3a0b201-9b23-4509-bb2e-c359d706b772; viewport_size=2544; v_sid=701d7eed-1743862266; domain_selected=true; access_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhcHBfaWQiOjQsImNsaWVudF9pZCI6IndlYiIsImF1ZCI6ImZyLmNvcmUuYXBpIiwiaXNzIjoidmludGVkLWlhbS1zZXJ2aWNlIiwiaWF0IjoxNzQzOTQ5MjM3LCJzaWQiOiI3MDFkN2VlZC0xNzQzODYyMjY2Iiwic2NvcGUiOiJwdWJsaWMiLCJleHAiOjE3NDM5NTY0MzcsInB1cnBvc2UiOiJhY2Nlc3MifQ.cFahGuIA0SKOWyfdcEU31u-Eee4426Cz7U1LtMbxWfJY_tpnCYXXZVcuObumQw0HTsuffLpbFagPvj8xbexzn7AzOYYaQSkVtoFVuZ41UwMCTl504CaaIq8XNY4dLkNUr8VHIZrpCJCoqfIFPt_AvSkDucPNE_Kn-wCHLHq5FS0638rqwa6dZND8t72AJFQwufYbuIXFaEIgomTzDxa7-SRg3n3-6j2E8j90qL9WBk1TxKTq5AECErNwPmTa57M5j971FJjTjpsFbJEbNdE7e2Y8Cz0BiXRevPT_cZ0L1VZR_OfEf2wGsMHyO4yq5M6RFBuASsWajiPCPUmhiNVxmQ; refresh_token_web=eyJraWQiOiJFNTdZZHJ1SHBsQWp1MmNObzFEb3JIM2oyN0J1NS1zX09QNVB3UGlobjVNIiwiYWxnIjoiUFMyNTYifQ.eyJhcHBfaWQiOjQsImNsaWVudF9pZCI6IndlYiIsImF1ZCI6ImZyLmNvcmUuYXBpIiwiaXNzIjoidmludGVkLWlhbS1zZXJ2aWNlIiwiaWF0IjoxNzQzOTQ5MjM3LCJzaWQiOiI3MDFkN2VlZC0xNzQzODYyMjY2Iiwic2NvcGUiOiJwdWJsaWMiLCJleHAiOjE3NDQ1NTQwMzcsInB1cnBvc2UiOiJyZWZyZXNoIn0.BO_iL3aZazGKYNIH9HKJKjIkpu0y87B5siM6hW3qNmM2reEif7nLNzvLuiuDHiWLj2MttcJgGSa4jQMuu2ERpuuW9ONcfdm4FVbNriF_c0Ze25XSzMmo8EL0zdBYR56bkB2K4H02_Aki7gc9ziW2V4mi1VN8Ie7yK9Tv5CdwJvf2Xa9pxlcfloFMKAapdhC-nb5TCVENE-hQYah3AkEcY9sqphc2T-kyyjThSoG2Inqarz12ohR1CM8vh5BFQdDjoaraCPzkQ-7_JD9pJpXhpjxy4YiRuHyb1NN3VMS2Fg_v8mfT9zo6UPJiVAw_9xGMPXPvaQTa30-7iKnIkF6VJw; OptanonAlertBoxClosed=2025-04-06T14:20:39.544Z; eupubconsent-v2=CQPcI7AQPcI7AAcABBENBkFgAAAAAAAAAChQAAAAAAFhIIAACAAFwAUABUADgAHgAQQAyADUAHgATAAqgBvAD0AH4AQkAhgCJAEcAJYATQArQBhwDKAMsAbIA74B7AHxAPsA_QCAAEUgIuAjEBGgEcAKCAVAAq4BcwDFAGiANoAbgA4gCHQEiAJ2AUOAo8BSICmwFsALkAXeAvMBhoDJAGTgMuAZzA1gDWQGxgNvAbqA5MBy4DxwHtAQhAheEAOAAOABIAOcAg4BPwEegJFASsAm0BT4CwgF5AMQAYtAyEDIwGjANTAbQA24BugD5AH7gQEAgZBBEEEwIMAQrAhcOAXAAIgAcAB4AFwASAA_ADQAOcAdwBAICDgIQAT8AqABegDpAIQAR6AkUBKwCYgEygJtAUgApMBXYC1AGIAMWAZCAyYBowDTQGpgNeAbQA2wBtwDj4HOgc-A-IB9sD9gP3AgeBBECDAEGwIVjoJYAC4AKAAqABwAEAALoAZABqADwAJgAVYAuAC6AGIAN4AegA_QCGAIkARwAlgBNACjAFaAMMAZQA0QBsgDvAHtAPsA_YCKAIwARwAoIBVwCxAFzALyAYoA2gBuADiAHUAQ6Ai8BIgCZAE7AKHAUfApoCmwFWALFAWwAuABcgC7QF3gLzAX0Aw0BjwDJAGTgMqgZYBlwDOQGqgNYAbeA3UBxYDkwHLgPHAe0A-sCAIELSABIABAAaABzgFiAR6Am0BSYC8gGpgNsAbcA58B8QD9gIHgQYAg2BCshAcAAWABQAFwAVQAuABiADeAHoAd4BFACOAEpAKCAVcAuYBigDaAHUgU0BTYCxQFogLgAXIAycBnIDVQHjgQtJQIwAEAALAAoABwAHgATAAqgBcADFAIYAiQBHACjAFaANkAd4A_ACOAFXAMUAdQBDoCLwEiAKPAU2AsUBbAC8wGTgMsAZyA1gBt4D2gIHkgBwAFwB3AEAAKgAj0BIoCVgE2gKTAYsA3IB-4EEQIMFIGwAC4AKAAqABwAEEAMgA0AB4AEwAKoAYgA_QCGAIkAUYArQBlADRAGyAO-AfYB-gEWAIwARwAoIBVwC5gF5AMUAbQA3ACHQEXgJEATsAocBTYCxQFsALgAXIAu0BeYC-gGGgMkAZPAywDLgGcwNYA1kBt4DdQHJgPHAe0BCECFpQA-ABcAEgAjgBzgDuAIAASIAsQBrwDtgH_AR6AkUBMQCbQFIAKfAV2AvIBiwDJgGpgNeAfFA_YD9wIGAQPAgmBBgCDYEKy0AEBTYAA.YAAAAAAAAAAA; OTAdditionalConsentString=1~; __cf_bm=d.8S.Ztvb6GUb8.b8ABhGmJKOWritGyiUaYG4w8yUHU-1743953611-1.0.1.1-5yT48aBZ3ANHfKFKn26VVWuQE982QIO5tPB8gHTWqjRKs.kXMJSUWjjb6seoiiMeXmQgZhzQobaJcu6_r2kAuyf7UEXnrcfsEbN0ULOF4_b_GsoCDg2dgbDKYJpKWLVI; cf_clearance=jAooFBGqrtfdgvBLqQ2euYhRtloknxEuNoocz3AhW6Q-1743953626-1.2.1.1-GaRGVNIn7jgfyPJw6Xk1YuJse0TXZinQ1xvPv4wp60b3vRIeGxQWkHR1rlop7iyUCH8ZPnQd3Y4fI_6Pt8mK5_ibUm.oBM9PJPVjheXv4xSJuzjkyPjwWjGEUQhbXpYAvjZy1.5GSxIZR423gcw9_av6OwPaQBNxT2dnuUNCLfo9poBClTyTP0.sR6tvmk67xvZG.gcyWkn5ZHhRRNcHGfVThQ8odyPdB1nknjR.MHNQWyCplaIWAGKup7UqIoU84S0cWO368NuuDvNiUB7xpAzktxkbv_TVS74zhF6W4X1jCNik0Au6wjvjEgyrT62LYRU4qYVlGkQE8GFzTvrF_EglpbHE9QxOfSzr_ErGB6g; OptanonConsent=isGpcEnabled=0&datestamp=Sun+Apr+06+2025+17%3A33%3A54+GMT%2B0200+(heure+d%E2%80%99%C3%A9t%C3%A9+d%E2%80%99Europe+centrale)&version=202312.1.0&browserGpcFlag=0&isIABGlobal=false&consentId=d3a0b201-9b23-4509-bb2e-c359d706b772&interactionCount=10&hosts=&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A0%2CC0003%3A0%2CC0004%3A0%2CC0005%3A0%2CV2STACK42%3A0%2CC0015%3A0%2CC0035%3A0&genVendors=V2%3A0%2CV1%3A0%2C&AwaitingReconsent=false&geolocation=FR%3BIDF; banners_ui_state=SUCCESS; datadome=Gx1JcLPTvReKXMNw1h9LGXmVHJzcFSALbAkl2Gf66X4eICAe5WfMRaJnFQwmhYhvnF_8npZtoMZ1zIQxK2f81COUfDDawW2o04rZNytEaMz7_3pwjeWccfqdr54Wh5Lj; _vinted_fr_session=NE5KSVgxQ2RydDZnamQwQ2JxbWw1UEVzb2VDcGtzNnN1QkpOcGM2dVhLTGtmWHU3NUlma3kxWGJZUmJoc2U0RVYrZzVncjU5T3hiN20xUHNwdEtDS3U1dUtTbHkwL0hZYmk3UmFLUDBuUisvdUlMMjArODVzY0FNQjM1OU5kbTh1Z1VsSmEzd0ZYSDg0QmZkZDRZSW53UDU5T29aZHFSUi9XbHJMQy9tSG0zb1h2V3RnRXRQa3g3MGY0OHZsaW1ZL21tQVBmSXZpNDFJKzdSVkdMbkx2bU8wNzAxZHhJQU5wQW1vQzhzVFBvTisrbGVyaXBPQklqN2ZvTk5XeVppK25IRVhOOWJKTElSVWx0N1ZXM3ZLVWU0V0NlbVZWcDIyQjFWejVkK3UrSlVXZEpjV2M3Rnl2ZHhtdG5OaFlwZG1JaDloUnh5S1V3TWphY0RhNjRWR010ZmdsdlRISnNHRU9tODgwamFjSzJ6dytUbXVCc3R6cFhZOURnVzB1NmZBVjZ6enhLYldiQU5wQ05zRnRCMjFiQ3JrMStXcmsrVTRDdVBNSFYwWDFuNitsUzVIQVJnSFFXdnMrcW8xVTJnRk5VWU9JZEZsRkZXTlFpa3hqdkgveDg1ZHl6aVEzL2FSMFBrRlpDZXZ2U1BZQUwxNjBwKzRlYURPL1ExVG84WnlPZ3ZoLzMzd3FFV1F5T3Y0bFNLQ1FiTnQ1Y2lZUkpEbk5KNzZ3U0t3ZFlXN1hmTHF3VHBETG1xcVpRQ3cxNC9lRjNmcGhhUWlYbTNsbUViVXp0VkJWbUpxWitqcjhGKzk3RGdtQ1ZyZXhON2dvOW4wTTBtU1FpS1FvZlE4dTNiZStUZWJSQnBwS2VNbWdMTWgyUGRmZW5yM1hkR3JyQ3FwTEdkQVNMYnZmdXpmQndoWkFiaGtUUHV5UnhUZmxVbXJNZHB4TEQxSzdxbnFoSGxSOC8yLzlQZW9aaVNhdW0vdVp5VmVBMDNtb3dxWEZyUElPakU2SEFZV0lDZm5XZ0hOQTU4cUxFTHMyOWVnMC9RUmNvZlJFWUsvd0dlcUlsdjhIRVJ2WHF0UzhuMnpmeHFiUFZyUHh5TmViNWpyUXJpWnpEVTg5TDc4UWQrcTZNM3lSK1ZjUlBxR1ZPTkQ0N3lQdWFKY1ZZcVNlZnpqc1N6Uzh0UDRXSFVTWUk3enNVS0JuK29zd0dXS252SUdYaERMQU9MazBFNmJ4SEFNV3FJcHN5ZGpSeFNyUld3T3VjSGRIdmRXQXNtb0FXWWNPL2lvc2Fkb1ZJUkhrVE05NVpOb1BOenVZbVU2Tm9zbFEvWnNLZVVzdHlpYmFqQzhRU24wZjgzTHEwbTBERWhhTDlHaUZUaW01N3RLTHBGbWxPVkh5cmJmZSthdGdnYzJFYUNxaWlWY2oyR0FiSE1GemNnRXF5bjRDOTZjSlZrU1pPaG9saXF2d3RnaC9VK0gzWFVQQk1mem9UYkNQSGFBUkovbVBqWUlhMm43Wm9vNUQvZDJYQ3kvVC9iL3RiWWdYMXV0aWQ3OGxTT1VXYWEwSEViR1JNYW1DWXFWU1MzQ05GNDdzQ0VLbnYvc21adWZWMHdkWjZ2czMvY3VLb29pQVlXYnVjU29nNjhsLzBpdHRzRXNzM0tEbSsyOTR5TldzQm85bmd1cUViRk15Z3JObzhwYXYwWk03Q0w5aGYvWDhoSDVPL0dMb0hIR1l0Zk5zMVhFWWxnNHE4TGVYaWQzY1g5bTJJQkdJVDYvV2lDWWpzRGZ4cUZMc2NENTVmOXFqOG5qSy94TEdRQ0liN1FOSlVkMGtUNFVmK1k3SHlBS0JIZnRhUFNCN3JsK1Rlamc0TkZXMGFobUNHWDVObWlhQU9zMkVXQUZ2MndGdHJydzBZRTVhK0U5ZE1id0xuV1dKMU5qbUgrL2pNSjlQRUNnbHEyNkM2RHF5N1dBQjE3R2szdk9IQzEvODE2U2pXbjZwRUJRQTlISUNQSnlhMytVMFlkcjNXZkZVNXdib1BaNkp2dWM3bGZ3VVpwUUVJUjVpL1pXa3pZRmZvVjF1a3BDUzY0dVlyVEQ0U3pBVjVSNDhORDh3SDYvdUp3Tks4K0RGakhDRHJJUzFLNDYyR2NCYXRZa01ZMU9KMm5GakVqQlgwdTR5Wkg1VnRsZ2JwKyt1UTZ5a1BNNnRBbFFsMFNWTnAySU9FVmdDWVhIRTRXaW9tS2V1MU9IcUdRQm55RzNEOWdLM2dWWlA5cWdhRWxWTWwySXJOTjBCUXlDRjJoTHVNWHhQVlpsUlFoeURZempzVG5OUTNubVczZTVzNnQ1TnJQSXdydHo0WW9OV2prd2M2ZUFNOW56RG1UaCtnRT0tLVhnb0M3WTBGT1Q5OWdHa0NJWDROemc9PQ%3D%3D--5a66c130610413953163aa6613bc550ada882f8f",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const sales = parse(data);

    console.log(`${sales.length} ventes trouvées`);
    return sales;
  } catch (error) {
    console.error(`Error scraping sales for set ${setId}:`, error);
    return [];
  }
};

/**
 * Save sales to JSON file
 * @param {Array} sales - sales to save
 * @param {String} setId - LEGO set ID
 */
const saveToDisk = async (sales, setId) => {
  await fs.writeFile(
    `./data/vinted_${setId}.json`,
    JSON.stringify(sales, null, 2)
  );
};

module.exports = {
  scrape,
  saveToDisk,
};
