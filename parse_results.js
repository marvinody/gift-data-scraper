const results = require('./results.json')

const allHeaders = results.flatMap(r => r.info.tableValues.map(t => t.header))

const uniqueHeaders = new Set(allHeaders)


console.log(uniqueHeaders)

