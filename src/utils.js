const request = require('request')
const cheerio = require('cheerio')

const getProducts = $ => {
  const products = []
  // Iterate over each product found by the selector
  $('.zg_itemImmersion > .zg_itemWrapper > .a-section').map((i, el) => {
    // Both rating and reviews have the same markup so we'll get an array of two values
    // Destructure the array into separate values
    [rating, reviews] = $(el).find('.a-icon-row .a-link-normal').text()
      .split('\n') // splitting creates and array which we can iterate
      .map(text => text.trim()
        .replace(' out of 5 stars', '') // (for the product rating)
        .replace(',', '')) // (for the comma in price)
      .filter(n => n) // filter out blanks resulting from the split

    products[i] = {
      img: $(el).find('img').attr('src'),
      name: $(el).find('.p13n-sc-truncated-hyphen').text().replace('\n', '').trim(),
      rank: i + 1,
      rating: Number(rating),
      reviews: Number(reviews),
      price: Number($(el).find('.p13n-sc-price').text().slice(1)),
      url: 'https://amazon.com' + $(el).find('a.a-link-normal').attr('href'),
    }
  })
  return products
}

const getCategories = $ => {
  const categories = []
  // Iterate over each category found by the selector
  $('#zg_browseRoot ul a').map((i, el) => {
    categories[i] = {
      name: $(el).text(),
      url: $(el).attr('href'),
    }
  })
  return categories
}

/**
 * getPage returns a Promise object with categories and products found on that page
 * it can be accessed by chaining the `then` method to the return value
 */
const getPage = url => {
  // Promise waits for `resolve` or `reject` to be called inside the function
  // Returns an object with methods `then` and `catch` to handle the response or error
  return new Promise((resolve, reject) => {
    request(url, (error, response) => {
      if (error) reject(error)
      else resolve(response)
    })
  })
  .then(response => {
    // response is a standard HTTP response object
    // body contains the HTML
    const $ = cheerio.load(response.body)
    return {
      categories: getCategories($),
      products: getProducts($)
    }
  })
  // will only happen if amazon blocked you or your internet is down...
  .catch(err => console.error(err))
}

module.exports = {
  getPage
}
