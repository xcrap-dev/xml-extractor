import { XmlNode } from "./utils"

export type XmlExtractorFunction<T = unknown> = (node: XmlNode) => T | Promise<T>

export function extractText(node: XmlNode): string {
    return (node.textContent ?? "").trim()
}

export function extractRawText(node: XmlNode): string {
    return node.textContent ?? ""
}

export function extractOuterXml(node: XmlNode): string {
    return node.toString()
}

export function extractInnerXml(node: XmlNode): string {
    let result = ""

    for (let child = node.firstChild; child; child = child.nextSibling) {
        result += child.toString()
    }

    return result
}

export function extractTagName(node: XmlNode): string {
    return node.nodeName
}

export function extractLocalName(node: XmlNode): string {
    return (node as Element).localName ?? node.nodeName
}

export function extractNamespaceUri(node: XmlNode): string | null {
    return (node as Element).namespaceURI ?? null
}

export function extractChildElementCount(node: XmlNode): number {
    let count = 0

    for (let child = node.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 1) count++
    }

    return count
}

export function extractAttribute(name: string): XmlExtractorFunction<string | undefined> {
    return (node) => {
        // Attribute nodes selected through xpath (e.g. //a/@href) carry their own value
        if (node.nodeType === 2) {
            return node.nodeName === name ? (node.nodeValue ?? undefined) : undefined
        }

        const element = node as Element

        return element.hasAttribute?.(name) ? (element.getAttribute(name) ?? undefined) : undefined
    }
}

export function extractAttributes(node: XmlNode): Record<string, string> {
    const attributes: Record<string, string> = {}
    const attrs = (node as Element).attributes

    if (!attrs) return attributes

    for (let i = 0; i < attrs.length; i++) {
        attributes[attrs[i].name] = attrs[i].value
    }

    return attributes
}

export function extractNumber(extractor: XmlExtractorFunction = extractText): XmlExtractorFunction<number> {
    return async (node) => Number(await extractor(node))
}

export function matchRegexFrom(
    extractor: XmlExtractorFunction<string | undefined>,
    pattern: RegExp,
    index?: number,
): XmlExtractorFunction<string | string[] | undefined> {
    return async (node) => {
        const value = (await extractor(node)) ?? ""
        const flags = pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g"
        const matches = Array.from(value.matchAll(new RegExp(pattern.source, flags)), (m) => m[1] ?? m[0])

        return index !== undefined ? matches[index] : matches
    }
}

export function fromParent(extractor: XmlExtractorFunction): XmlExtractorFunction {
    return (node) => {
        const parent = node.parentNode

        if (!parent) return undefined

        return extractor(parent)
    }
}

export type FromSiblingOptions = {
    shouldExists?: boolean
}

function siblingElement(node: XmlNode, direction: "next" | "previous"): XmlNode | null {
    let current = direction === "next" ? node.nextSibling : node.previousSibling

    while (current && current.nodeType !== 1) {
        current = direction === "next" ? current.nextSibling : current.previousSibling
    }

    return current
}

export function fromNextElementSibling(
    extractor: XmlExtractorFunction,
    { shouldExists = true }: FromSiblingOptions = {},
): XmlExtractorFunction {
    return (node) => {
        const sibling = siblingElement(node, "next")

        if (!sibling) {
            if (shouldExists) throw new Error("Next element sibling not found")
            return undefined
        }

        return extractor(sibling)
    }
}

export function fromPreviousElementSibling(
    extractor: XmlExtractorFunction,
    { shouldExists = true }: FromSiblingOptions = {},
): XmlExtractorFunction {
    return (node) => {
        const sibling = siblingElement(node, "previous")

        if (!sibling) {
            if (shouldExists) throw new Error("Previous element sibling not found")
            return undefined
        }

        return extractor(sibling)
    }
}
