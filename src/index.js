const { getPage } = require('./utils')
const fs = require('fs')

const url = 'https://www.amazon.com/Best-Sellers/zgbs'

function getPages(url) {
  getPage(url).then(({ categories: mainCategories }) => {
    Promise.all(
      mainCategories.map(mainCategory => {
        return getPage(mainCategory.url).then(({ categories: subCategories, products: mainProducts }) => {
          return Promise.all(
            subCategories.map(subCategory => {
              return getPage(subCategory.url).then(({ categories: subSubCategories, products: subProducts }) => {
                console.log(`Fetching ${mainCategory.name} - ${subCategory.name} (${subSubCategories.length} additional categories)`)
                return Object.assign({}, subCategory, { categories: subSubCategories, products: subProducts })
              })
            })
          ).then(result => {
            return Object.assign(mainCategory, { categories: result, products: mainProducts })
          })
        })
      })
    )
    .then(results => {
      const file = JSON.stringify(results, null, 2)
      fs.writeFileSync('./products.json', file, 'utf8')
      console.log(`Fetched ${results.length} categories`)
      console.log(`Writing csv...`)
      writeFile()
    })
    .catch(err => {
      console.error(err)
    })
  })
}

function writeFile() {
  const file = JSON.parse(fs.readFileSync('./products.json', 'utf8'))
  const products = []

  const decentProduct = product => (
    product.price > 5 &&
    product.price < 100 &&
    product.reviews > 20 &&
    product.reviews < 1000
  )

  file.map(mainCategory => {
    mainCategory.products
      .map(product => {
        if (decentProduct(product)) {
          product.category = mainCategory.name
          products.push(product)
        }
      })
    mainCategory.categories.map(subCategory => {
      const sub = subCategory.categories.reduce((str, subSubCategory) => {
        return str + (str.length ? ', ' : '') + subSubCategory.name
      }, '')
      subCategory.products.map(product => {
        if (decentProduct(product)) {
          product.category = mainCategory.name
          product.subCategory = subCategory.name
          products.push(product)
        }
      })
    })
  })

  const headers = Object.keys(products[0]).concat('sub').join('\t') + '\n'
  const csv = headers + products.map(product => {
    return Object.keys(product).map(key => `${product[key]}`).join('\t')
  }).join('\n')

  fs.writeFileSync('products.csv', csv, 'utf8')
  console.log(`Save csv`)
}

getPages(url)
// writeFile()
