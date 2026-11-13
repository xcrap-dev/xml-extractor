/* eslint-disable @typescript-eslint/no-explicit-any */
import { BuildedQuery, ExtractionModel, SourceParser } from "@xcrap/extractor"

import { XmlNodeNotFoundError } from "./errors"
import { XmlExtractorFunction } from "./extractors"
import { parseXml, selectFirstNode, selectManyNodes, XmlNode } from "./utils"

export type ExtractXmlValuesOptions = {
    query: BuildedQuery
    extractor: XmlExtractorFunction<any>
    limit?: number
}

export type ExtractXmlValueOptions = {
    query?: BuildedQuery
    extractor: XmlExtractorFunction<any>
    default?: any
}

export type ExtractXmlModelOptions<T = any> = {
    query?: BuildedQuery
    model: ExtractionModel<T>
}

export type ExtractXmlModelsOptions<T = any> = {
    query: BuildedQuery
    model: ExtractionModel<T>
    limit?: number
}

export class XmlParser extends SourceParser {
    readonly root: XmlNode

    constructor(readonly source: string) {
        super(source)

        this.root = parseXml(source) as unknown as XmlNode
    }

    async extractValues({ query, extractor, limit }: ExtractXmlValuesOptions): Promise<any[]> {
        const nodes = selectManyNodes(query, this.root)

        if (limit !== undefined) nodes.splice(limit)

        return await Promise.all(nodes.map((node) => extractor(node)))
    }

    async extractValue({ query, extractor, default: default_ }: ExtractXmlValueOptions): Promise<any> {
        const node = query ? selectFirstNode(query, this.root) : this.root

        if (!node) {
            if (default_ !== undefined) return default_
            throw new XmlNodeNotFoundError(query)
        }

        return (await extractor(node)) ?? default_
    }

    async extractModel<T>({ model, query }: ExtractXmlModelOptions<T>): Promise<T> {
        const node = query ? selectFirstNode(query, this.root) : this.root

        if (!node) {
            throw new XmlNodeNotFoundError(query)
        }

        return await model.extract(node.toString())
    }

    async extractModels<T>({ model, query, limit }: ExtractXmlModelsOptions<T>): Promise<T[]> {
        const nodes = selectManyNodes(query, this.root)

        if (limit !== undefined) nodes.splice(limit)

        return await Promise.all(nodes.map((node) => model.extract(node.toString())))
    }
}
