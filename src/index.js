
const { getPage } = require('./utils')
const fs = require('fs')

/**
 * getProducts - create a json array of categories with nested categories and products
 *
 * Object models:
 *
 *   Category: {
 *     name: String,
 *     url: String,
 *     categories: [Category],
 *     products: [Product]
 *   }
 *
 *   Product: {
 *     img: String,
 *     name: String,
 *     rank: Number,
 *     rating: Number,
 *     reviews: Number,
 *     price: Number,
 *     url: String
 *   }
 *
 */
const getProducts = config => {
  const defaults = {
    save: false,
    requirements: {
      price: {
        min: 5,
        max: 100
      },
      reviews: {
        min: 20,
        max: 1000
      }
    },
    filter: []
  }
  // Merge configuration options and extract
  const { save, requirements, filter } = Object.assign(defaults, config)
  const url = 'https://www.amazon.com/Best-Sellers/zgbs'
  // getPage returns a Promise
  return getPage(url).then(({ categories: mainCategories }) =>
    // Promise.all waits for all promises in the array to resolve
    Promise.all(
      // Iterate over main categories and return an array of Promises
      mainCategories
        .filter(({name}) => !filter.length || filter.reduce((b, s) => b || name.toLowerCase().includes(s), false))
        .map(mainCategory =>
          // Crawl each category url and return a promise with products and child categories
          getPage(mainCategory.url).then(({ categories: subCategories, products: mainProducts }) =>
            // Wait to crawl subcategories
            Promise.all(
              subCategories.map(subCategory =>
                getPage(subCategory.url).then(({ categories: subSubCategories, products: subProducts }) =>
                  // merge categories and products with the sub category object
                  Object.assign(subCategory, { categories: subSubCategories, products: subProducts })
                )
              )
            ).then(result =>
              // merge categories and products with the main category object
              Object.assign(mainCategory, { categories: result, products: mainProducts })
            )
          )
        )
    )
    .then(results => {
      // `results` is the final JSON array after all pages have been scraped
      // container for our flat array of products
      const products = []

      // helper function to filter a product based on price and reviews
      const isDecent = product => (
        product.price > requirements.price.min &&
        product.price < requirements.price.max &&
        product.reviews > requirements.reviews.min &&
        product.reviews < requirements.reviews.max
      )

      // results is an array of categories
      results.forEach(mainCategory => {
        mainCategory.products.forEach(product => {
          if (isDecent(product)) {
            product.category = mainCategory.name
            products.push(product)
          }
        })
        mainCategory.categories.forEach(subCategory => {
          subCategory.products.forEach(product => {
            if (isDecent(product)) {
              product.category = mainCategory.name
              product.subCategory = subCategory.name
              products.push(product)
            }
          })
        })
      })

      if (save) {
        const file = JSON.stringify(products, null, 2)
        fs.writeFileSync('./products.json', file, 'utf8')
      }

      return products
    })
    .catch(err => {
      throw err
    })
  )
}

/**
 * json2csv takes a json array of nested categories and flattens them into a single
 * array of products with labelled categories and subcategories.
 */
const json2csv = products => {
  // Build the csv headings from the first product keys
  const headers = Object.keys(products[0]).concat('sub').join('\t') + '\n'
  // Build the main csv body by joining all product values with a tab
  const body = products.map(product =>
    Object.keys(product)
      // for each key in product, return the value
      .map(key => `${product[key]}`)
      .join('\t'))
  // Build out the csv and save to file
  const csv = headers + body.join('\n')
  fs.writeFileSync('products.csv', csv, 'utf8')

  return Promise.resolve(csv)
}

module.exports = {
  getProducts,
  json2csv
}
