# 🕷️ Xcrap XML Extractor: Extracting data from XML using declarative models

Xcrap XML Extractor is a package of the Xcrap framework that extracts data from XML documents (RSS, Atom, sitemaps, SOAP, feeds, etc.) using XPath and declarative models. It integrates with [`@xcrap/extractor`](https://www.npmjs.com/package/@xcrap/extractor), so XML models can be nested inside HTML and JSON models and vice versa.

---

## 📦 Installation

> [!IMPORTANT]
> `@xcrap/extractor` is a **peer dependency** and must be installed alongside this package.

```cmd
npm i @xcrap/xml-extractor @xcrap/extractor
```

---

## 🛠️ How to Use

> Queries use **XPath only**, built with `xpath()`. Passing a `css()` query throws `UnsupportedQueryTypeError`.

### Data extraction without models

```ts
import { XmlParser, extractAttribute, extractText, xpath } from "@xcrap/xml-extractor"

;(async () => {
    const xml = `
        <catalog>
            <book id="1"><title>One</title></book>
            <book id="2"><title>Two</title></book>
        </catalog>
    `

    const parser = new XmlParser(xml)

    // First match
    const title = await parser.extractValue({ query: xpath("//book[1]/title"), extractor: extractText })

    // All matches (with optional limit)
    const titles = await parser.extractValues({ query: xpath("//title"), extractor: extractText, limit: 5 })

    // Attributes selected via xpath
    const ids = await parser.extractValues({ query: xpath("//book/@id"), extractor: extractAttribute("id") })

    console.log(title) // "One"
    console.log(titles) // ["One", "Two"]
    console.log(ids) // ["1", "2"]
})()
```

### Loading an XML file

```ts
import { XmlParser } from "@xcrap/xml-extractor"

const parser = await XmlParser.loadFile("./feed.xml", { encoding: "utf-8" })
```

### Data extraction with models

```ts
import { XmlExtractionModel, extractAttribute, extractNumber, extractText, xpath } from "@xcrap/xml-extractor"

const bookModel = new XmlExtractionModel({
    id: { query: xpath("/book"), extractor: extractAttribute("id") },
    title: { query: xpath("//title"), extractor: extractText },
    price: { query: xpath("//price"), extractor: extractNumber() },
    lang: { query: xpath("/book"), extractor: extractAttribute("lang"), default: "unknown" },
})

const catalogModel = new XmlExtractionModel({
    books: { query: xpath("//book"), multiple: true, model: bookModel },
    count: { query: xpath("count(//book)"), extractor: extractNumber() },
})

const data = await catalogModel.extract(xml)
// { books: [{ id: "1", title: "One", price: 10.5, lang: "en" }, ...], count: 3 }
```

Model fields support:

| Field       | Description                                                                           |
| ----------- | ------------------------------------------------------------------------------------- |
| `query`     | XPath query (optional for base values: omitted means the document root).             |
| `extractor` | Function that receives the node and returns the value.                                |
| `model`     | Nested `ExtractionModel` (any type, including HTML/JSON models from `@xcrap/extractor`). |
| `multiple`  | Returns an array with every match (requires `query`).                                 |
| `limit`     | Maximum number of items when `multiple` is `true`.                                    |
| `default`   | Value used when nothing is found (otherwise `XmlNodeNotFoundError` is thrown).        |

> For nested models, a custom `extractor` can be used to provide the source string handed to the nested model (defaults to the node's serialized XML).

### Using a model through a parser

```ts
const parser = new XmlParser(xml)

const catalog = await parser.extractWithModel(catalogModel)
const book = await parser.extractModel({ query: xpath("//book[1]"), model: bookModel })
const books = await parser.extractModels({ query: xpath("//book"), model: bookModel, limit: 2 })
```

---

## 🧰 Extractors

| Extractor                                                      | Returns                                            |
| -------------------------------------------------------------- | -------------------------------------------------- |
| `extractText`                                                  | Trimmed text content                               |
| `extractRawText`                                               | Text content as is                                 |
| `extractOuterXml` / `extractInnerXml`                          | Serialized node / its children                     |
| `extractAttribute(name)`                                       | Attribute value (works on elements and `@attr` nodes) |
| `extractAttributes`                                            | All attributes as an object                        |
| `extractNumber(extractor?)`                                    | Number from another extractor (default: text)      |
| `extractTagName` / `extractLocalName` / `extractNamespaceUri`  | Name information                                   |
| `extractChildElementCount`                                     | Number of child elements                           |
| `matchRegexFrom(extractor, pattern, index?)`                   | Regex matches from another extractor's value       |
| `fromParent(extractor)`                                        | Runs the extractor on the parent node              |
| `fromNextElementSibling(extractor, { shouldExists? })`         | Runs the extractor on the next element sibling     |
| `fromPreviousElementSibling(extractor, { shouldExists? })`     | Runs the extractor on the previous element sibling |

Custom extractors are plain functions: `(node) => value | Promise<value>`.

---

## ❌ Errors

- `XmlNodeNotFoundError`: no node matched and no `default` was provided.
- `XmlMultipleQueryError`: a `multiple` value has no `query`.
- `UnsupportedQueryTypeError`: a non-XPath query was used.

---

## 🧪 Development

```cmd
npm run build      # compile to dist/
npm run test       # vitest (watch)
npm run test:cov   # coverage
npm run lint:fix   # eslint
npm run format     # prettier
```

---

## 🤝 Contributing

Contributions are welcome. Open an issue or pull request, and follow Conventional Commits for commit messages.

## 📝 License

MIT © Marcuth
