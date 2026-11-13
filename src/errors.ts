import { BuildedQuery } from "@xcrap/extractor"

export class XmlNodeNotFoundError extends Error {
    constructor(query?: BuildedQuery) {
        super(`Node with query "${JSON.stringify(query) || "no query provided"}" not found`)
        this.name = "XmlNodeNotFoundError"
    }
}

export class XmlMultipleQueryError extends Error {
    constructor() {
        super("Multiple value must have a 'query'")
        this.name = "XmlMultipleQueryError"
    }
}

export class UnsupportedQueryTypeError extends Error {
    constructor(type: string) {
        super(`Query type "${type}" is not supported by XML extractor, use xpath()`)
        this.name = "UnsupportedQueryTypeError"
    }
}
