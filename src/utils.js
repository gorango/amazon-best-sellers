const Request = require('request')
const cheerio = require('cheerio')

const request = url =>
  new Promise((resolve, reject) => {
    Request(url, (error, data) =>
      (error && reject(error)) || resolve(data))
  })

const getProducts = $ => {
  const products = []
  $('.zg_itemImmersion > .zg_itemWrapper > .a-section').map((i, el) => {
    [rating, reviews] = $(el).find('.a-icon-row .a-link-normal')
      .text()
      .split('\n')
      .map(e => e.trim()
        .replace(' out of 5 stars', '')
        .replace(',', ''))
      .filter(n => n)

    products[i] = {
      url: $(el).find('a.a-link-normal').attr('href'),
      img: $(el).find('img').attr('src'),
      rank: i + 1,
      name: $(el).find('.p13n-sc-truncated-hyphen').text().replace('\n', '').trim(),
      rating: Number(rating),
      reviews: Number(reviews),
      price: Number($(el).find('.p13n-sc-price').text().slice(1))
    }
  })
  return products
}

const getCategories = $ => {
  const categories = []
  $('#zg_browseRoot ul a').map((i, el) => {
    categories[i] = {
      name: $(el).text(),
      url: $(el).attr('href'),
    }
  })
  return categories
}

const getPage = url =>
  request(url)
    .then(data => {
      const $ = cheerio.load(data.body)
      const categories = getCategories($)
      const products = getProducts($)
      return {
        categories,
        products
      }
    })
    .catch(err => console.error(err))

module.exports = {
  getPage
}
