/* eslint-disable @typescript-eslint/no-explicit-any */
import { BuildedQuery, ExtractionModel } from "@xcrap/extractor"

import { XmlMultipleQueryError, XmlNodeNotFoundError } from "./errors"
import { XmlExtractorFunction } from "./extractors"
import { parseXml, selectFirstNode, selectManyNodes, XmlNode } from "./utils"

export type XmlExtractionModelShapeBaseValue = {
    query?: BuildedQuery
    default?: any
    multiple?: boolean
    limit?: number
    extractor: XmlExtractorFunction<any>
}

export type XmlExtractionModelShapeNestedValue = {
    query: BuildedQuery
    limit?: number
    default?: any
    multiple?: boolean
    model: ExtractionModel
    extractor?: XmlExtractorFunction<any>
}

export type XmlExtractionModelValue = XmlExtractionModelShapeBaseValue | XmlExtractionModelShapeNestedValue

export type XmlExtractionModelShape = {
    [key: string]: XmlExtractionModelValue
}

export type InferXmlValue<V extends XmlExtractionModelValue> = V extends XmlExtractionModelShapeNestedValue
    ? V["multiple"] extends true
        ? V["model"] extends ExtractionModel<infer M>
            ? M[]
            : any
        : V["model"] extends ExtractionModel<infer M>
          ? M
          : any
    : V extends XmlExtractionModelShapeBaseValue
      ? V["multiple"] extends true
          ? Awaited<ReturnType<V["extractor"]>>[]
          : Awaited<ReturnType<V["extractor"]>>
      : never

export type InferXmlShape<S extends XmlExtractionModelShape> = {
    [K in keyof S]: InferXmlValue<S[K]>
}

export class XmlExtractionModel<S extends XmlExtractionModelShape> implements ExtractionModel<InferXmlShape<S>> {
    constructor(readonly shape: S) {}

    async extract(source: string): Promise<InferXmlShape<S>> {
        const root = parseXml(source) as unknown as XmlNode
        const data: any = {}

        for (const key in this.shape) {
            const value = this.shape[key]

            if ("model" in value) {
                data[key] = await this.extractNestedValue(value, root)
            } else {
                data[key] = await this.extractBaseValue(value, root)
            }
        }

        return data
    }

    protected async extractBaseValue(value: XmlExtractionModelShapeBaseValue, root: XmlNode) {
        if (value.multiple) {
            if (!value.query) {
                throw new XmlMultipleQueryError()
            }

            const nodes = selectManyNodes(value.query, root)

            if (value.limit !== undefined) nodes.splice(value.limit)

            return await Promise.all(nodes.map((node) => value.extractor(node)))
        }

        const node = value.query ? selectFirstNode(value.query, root) : root

        if (!node) {
            if (value.default === undefined) {
                throw new XmlNodeNotFoundError(value.query)
            }

            return value.default
        }

        return (await value.extractor(node)) ?? value.default
    }

    protected async extractNestedValue(value: XmlExtractionModelShapeNestedValue, root: XmlNode) {
        const getSource = async (node: XmlNode): Promise<string> =>
            value.extractor ? ((await value.extractor(node)) as string) : node.toString()

        if (value.multiple) {
            const nodes = selectManyNodes(value.query, root)

            if (value.limit !== undefined) nodes.splice(value.limit)

            return await Promise.all(nodes.map(async (node) => value.model.extract(await getSource(node))))
        }

        const node = selectFirstNode(value.query, root)

        if (!node) {
            if (value.default === undefined) {
                throw new XmlNodeNotFoundError(value.query)
            }

            return value.default
        }

        return await value.model.extract(await getSource(node))
    }
}
