const { getPage } = require('./utils')
const fs = require('fs')

/**
 * getAllProducts - create a json array of categories with nested categories and products
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
exports.getAllProducts = () => {
  const url = 'https://www.amazon.com/Best-Sellers/zgbs'
  // getPage returns a Promise
  return getPage(url).then(({ categories: mainCategories }) => {
    // Promise.all waits for all promises in the array to resolve
    return Promise.all(
      // Iterate over main categories and return an array of Promises
      mainCategories.map(mainCategory => {
        // Crawl each category url and return a promise with products and child categories
        return getPage(mainCategory.url).then(({ categories: subCategories, products: mainProducts }) => {
          // Wait to crawl subcategories
          return Promise.all(
            subCategories.map(subCategory => {
              return getPage(subCategory.url).then(({ categories: subSubCategories, products: subProducts }) => {
                // merge categories and products with the sub category object
                return Object.assign(subCategory, { categories: subSubCategories, products: subProducts })
              })
            })
          ).then(result => {
            // merge categories and products with the main category object
            return Object.assign(mainCategory, { categories: result, products: mainProducts })
          })
        })
      })
    )
    .then(results => {
      // `results` is the final JSON array after all pages have been scraped
      const file = JSON.stringify(results, null, 2)
      fs.writeFileSync('./products.json', file, 'utf8')
      return results
    })
    .catch(err => {
      console.error(err)
    })
  })
}

/**
 * json2csv takes a json array of nested categories and flattens them into a single
 * array of products with labelled categories and subcategories.
 */
exports.json2csv = (json) => {
  // container for our flat array of products
  const products = []

  // helper function to filter a product based on price and reviews
  const decentProduct = product => (
    product.price > 5 &&
    product.price < 100 &&
    product.reviews > 20 &&
    product.reviews < 1000
  )

  // json is an array of categories
  json.forEach(mainCategory => {
    mainCategory.products.forEach(product => {
      if (decentProduct(product)) {
        product.category = mainCategory.name
        products.push(product)
      }
    })
    mainCategory.categories.forEach(subCategory => {
      subCategory.products.forEach(product => {
        if (decentProduct(product)) {
          product.category = mainCategory.name
          product.subCategory = subCategory.name
          products.push(product)
        }
      })
    })
  })

  // Build the csv headings from the first product keys
  const headers = Object.keys(products[0]).concat('sub').join('\t') + '\n'
  // Build the main csv body by joining all product values with a tab
  const body = products.map(product => {
    return Object.keys(product)
      // for each key in product, return the value
      .map(key => { return `${product[key]}` })
      .join('\t')
  })
  // Build out the csv and save to file
  const csv = headers + body.join('\n')
  fs.writeFileSync('products.csv', csv, 'utf8')
  return Promise.resolve()
}
