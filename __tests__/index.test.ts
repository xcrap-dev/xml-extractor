import { describe, expect, test } from "vitest"

import {
    extractAttribute,
    extractNumber,
    extractText,
    matchRegexFrom,
    XmlExtractionModel,
    XmlParser,
    xpath,
} from "../src/index"

const xml = `<?xml version="1.0"?>
<catalog>
  <book id="1" lang="en"><title>One</title><price>10.5</price></book>
  <book id="2" lang="pt"><title>Two</title><price>20</price></book>
  <book id="3"><title>Three</title><price>30</price></book>
</catalog>`

describe("XmlParser", () => {
    const parser = new XmlParser(xml)

    test("extractValue", async () => {
        expect(await parser.extractValue({ query: xpath("//book[1]/title"), extractor: extractText })).toBe("One")
    })

    test("extractValues with attribute xpath and limit", async () => {
        expect(await parser.extractValues({ query: xpath("//book/@id"), extractor: extractAttribute("id") })).toEqual([
            "1",
            "2",
            "3",
        ])
        expect(await parser.extractValues({ query: xpath("//title"), extractor: extractText, limit: 2 })).toEqual([
            "One",
            "Two",
        ])
    })

    test("default and not found", async () => {
        expect(await parser.extractValue({ query: xpath("//nope"), extractor: extractText, default: null })).toBeNull()
        await expect(parser.extractValue({ query: xpath("//nope"), extractor: extractText })).rejects.toThrow()
    })
})

describe("XmlExtractionModel", () => {
    test("nested models", async () => {
        const book = new XmlExtractionModel({
            id: { query: xpath("/book"), extractor: extractAttribute("id") },
            title: { query: xpath("//title"), extractor: extractText },
            price: { query: xpath("//price"), extractor: extractNumber() },
            lang: { query: xpath("/book"), extractor: extractAttribute("lang"), default: "unknown" },
        })

        const model = new XmlExtractionModel({
            books: { query: xpath("//book"), multiple: true, model: book },
            first: { query: xpath("//book[1]"), model: book },
            count: { query: xpath("count(//book)"), extractor: extractNumber() },
            digits: { query: xpath("//price"), extractor: matchRegexFrom(extractText, /\d+/g, 0) },
        })

        const data = await model.extract(xml)

        expect(data.books).toHaveLength(3)
        expect(data.books[2]).toEqual({ id: "3", title: "Three", price: 30, lang: "unknown" })
        expect(data.first.title).toBe("One")
        expect(data.count).toBe(3)
        expect(data.digits).toBe("10")
    })
})
