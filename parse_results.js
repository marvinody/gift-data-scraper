const results = require('./results.json')

const allHeaders = results.flatMap(r => r.info.tableValues.map(t => t.header))

const uniqueHeaders = new Set(allHeaders)


console.log(uniqueHeaders)

// given list of regexes, run them sequentially and remove any matching pieces
const strip = (regexes, str) => regexes.reduce((acc, cur) => acc.replace(cur, ''), str)

const matches = (regexes, str) => regexes.some(r => r.test(str))



const TABLE_PARSERS = {
    "商品名": (key, value) => ({ key: 'name', value }),
    "作品名": (key, value) => ({ key: 'source', value }),
    '価格': (key, value) => {
        const removeStrings = [
            /^定価/g,
            /※.*$/g,
            /イベント価格.*$/g
        ]
        const strippedValue = strip(removeStrings, value)

        const withTaxFilters = [
            /（税抜価格.*円）/g,
            /（税込）/g,
        ]

        const withoutTaxFilters = [
            /（税抜）/g
        ]

        const hasTax = matches(withTaxFilters, strippedValue)
        if (hasTax) {
            const strippedTaxValue = strip(withTaxFilters, strippedValue)
            return {
                key: 'price',
                hasTax: true,
                value: strippedTaxValue
            }
        }

        const doesNotHaveTax = matches(withoutTaxFilters, strippedValue)
        if(doesNotHaveTax) {
            const strippedNonTaxValue = strip(withoutTaxFilters, strippedValue)
            return {
                key: 'price',
                hasTax: false,
                value: strippedNonTaxValue
            }
        }

        return { key: 'price', value: strippedValue }
    }
}

const key = '価格'

const values = results.map(r => r.info.tableValues.filter(t => t.header === key).map(t => t.value))

const multipleMatching = values.filter(arr => arr.length > 1)



console.log(values)
console.log(multipleMatching)


values.forEach(v => {
    const parsed = TABLE_PARSERS[key](key, v[0])
    console.log(`${key}, "${v[0]}", "${JSON.stringify(parsed)}"`)
})