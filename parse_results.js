const results = require('./results.json')
const moment = require('moment')
const math = require('mathjs')

const allHeaders = results.flatMap(r => r.info.tableValues.map(t => t.header))

const uniqueHeaders = new Set(allHeaders)


console.log(uniqueHeaders)

// given list of regexes, run them sequentially and remove any matching pieces
const strip = (regexes, str) => regexes.reduce((acc, cur) => acc.replace(cur, ''), str)

const matches = (regexes, str) => regexes.some(r => r.test(str))

const split = (regex, str) => str.split(regex).filter(s => s.length > 0)

const parseDate = (s) => {
    return moment(s, 'YYYY年MM月')
}

const firstMatchingReg = (regexes, str) => {
    const matchingRegex = regexes.find(r => r.regex.test(str))

    if (matchingRegex) {
        const matchGroup = str.match(matchingRegex.regex)

        return {
            ...matchingRegex,
            value: matchGroup[1],
        }
    }

    // TODO: throw error here and see how error handling works
    return {
        value: str,
    }

}

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
                value: {
                    hasTax: true,
                    value: strippedTaxValue
                }
            }
        }

        const doesNotHaveTax = matches(withoutTaxFilters, strippedValue)
        if (doesNotHaveTax) {
            const strippedNonTaxValue = strip(withoutTaxFilters, strippedValue)
            return {
                key: 'price',
                value: {
                    hasTax: false,
                    value: strippedNonTaxValue
                }
            }
        }

        return { key: 'price', value: { value: strippedValue } }
    },
    '発売時期': (key, value) => {
        const salesFilter = /【.*?販】/
        const strippedDates = split(salesFilter, value)

        const parsedDates = strippedDates.map(parseDate)

        return {
            key: 'releaseDate',
            value: {
                raw: parsedDates.map(d => d.format('YYYY/MM')),
                en: parsedDates.map(d => d.format('MMM YYYY'))
            }
        }
    },
    'サイズ': (key, value) => {
        const dimRegexes = [
            {
                regex: /(\d*)cm/,
                unit: 'cm',
            },
            {
                regex: /(\d*)mm/,
                unit: 'mm',
            },
        ]

        const parsedDim = firstMatchingReg(dimRegexes, value)

        const baseUnit = math.unit(parsedDim.value, parsedDim.unit)

        const metric = {
            unit: 'cm',
            value: baseUnit.to('cm').toNumber(),
        }

        const imperial = {
            unit: 'in',
            value: Math.round(baseUnit.to('in').toNumber())
        }

        return {
            key: 'size',
            value: {
                metric,
                imperial
            }
        }
    },
    '発売元': (key, value) => {
        return {
            key: 'seller',
            value,
        }
    },
    '販売元': (key, value) => {
        return {
            key: 'distributor',
            value,
        }
    },
    '仕様': (key, value) => {
        let translation;
        switch (value) {
            case 'ぬいぐるみストラップ':
                translation = 'Plush Strap'
                break;
            case 'ぬいぐるみ':
                translation = 'Plush Toy'
                break;
            default:
                translation = 'Unknown'
        }
        return {
            key: 'specification',
            value: translation,
        }
    },
    'ぬいぐるみ用キャラクターデザイン': (key, value) => {
        return {
            key: "characterDesigner",
            value,
        }
    },
    'ぬいぐるみ用\nキャラクター\nデザイン': (key, value) => {
        return {
            key: "characterDesigner",
            value,
        }
    },
    '企画協力': (key, value) => {
        if (value === 'ピンクカンパニー') {
            return {
                key: 'planningCooperation',
                value: 'Pink Company'
            }
        }
        return {
            key: 'planningCooperation',
            value,
        }
    }
}

const values = results.map(r => {
    return {
        ...r,
        info: {
            ...r.info,
            ...r.info.tableValues.reduce((acc, cur) => {
                const formatted = TABLE_PARSERS[cur.header](cur.header, cur.value)
                return {
                    ...acc,
                    [formatted.key]: formatted.value,
                }
            }, {})
        }
    }
})




console.log(JSON.stringify(values, null, 2))


// values.forEach(v => {
//     const parsed = TABLE_PARSERS[key](key, v[0])
//     console.log(`${key}, "${v[0]}", "${JSON.stringify(parsed, null, 2)}"`)
// })