/* eslint-disable @typescript-eslint/no-explicit-any */
import { BuildedQuery } from "@xcrap/extractor"
import { DOMParser } from "@xmldom/xmldom"
import * as xpathLib from "xpath"

import { UnsupportedQueryTypeError } from "./errors"

export type XmlNode = Node

export function parseXml(source: string): Document {
    return new DOMParser({
        onError: () => {},
    }).parseFromString(source, "text/xml") as unknown as Document
}

export function selectManyNodes(query: BuildedQuery, root: XmlNode): XmlNode[] {
    if (query.type !== "xpath") {
        throw new UnsupportedQueryTypeError(query.type)
    }

    const result = xpathLib.select(query.value, root as any)

    if (Array.isArray(result)) {
        return result as unknown as XmlNode[]
    }

    // Scalar results (string/number/boolean) are wrapped in a text node
    const doc = (root.nodeType === 9 ? root : root.ownerDocument) as Document

    return [doc.createTextNode(String(result))]
}

export function selectFirstNode(query: BuildedQuery, root: XmlNode): XmlNode | null {
    return selectManyNodes(query, root)[0] ?? null
}
