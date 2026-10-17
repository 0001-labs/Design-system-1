package com.designsystem1.ds1

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.util.Locale

/**
 * Words in the reader's language, as the web's `translate()` finds them: the product's own
 * words over the shared ones, looked up in the language, its primary subtag, its relatives
 * (`nn` reads `nb`, `pt-BR` reads `pt`), then English, then the key itself. `{name}` and
 * `{{name}}` take [params]. The language is snapshot state: composables that read words
 * recompose when it changes.
 */
@android.annotation.SuppressLint("ConstantLocale")
object DS1Words {
    /** The language words are read in: the device's at start; set it from a saved choice. */
    var language: DS1Language by mutableStateOf(fromLocale(Locale.getDefault()) ?: DS1Language.En)

    /** The languages the product speaks, in the order its picker shows them. */
    var languages: List<DS1Language> by mutableStateOf(DS1Language.entries.toList())

    private var productWords: Map<String, Map<String, String>> by mutableStateOf(emptyMap())

    /** The product's own words, `{ language: { English words: text } }`; they win over the shared ones. */
    fun register(words: Map<String, Map<String, String>>) {
        val merged = productWords.mapValues { it.value.toMutableMap() }.toMutableMap()
        for ((lang, table) in words) merged.getOrPut(lang) { mutableMapOf() }.putAll(table)
        productWords = merged
    }

    /** The words for [key] in [language], with [params] filled in. */
    fun text(key: String, params: Map<String, Any?> = emptyMap(), language: DS1Language = this.language): String {
        val order = buildList {
            add(language.code)
            add(language.code.substringBefore('-'))
            addAll(language.related)
            add(DS1Language.En.code)
        }.distinct()
        val found = order.firstNotNullOfOrNull { code -> productWords[code]?.get(key) ?: DS1SharedWords.tables[code]?.get(key) }
        return fill(found ?: key, params)
    }

    /** `{name}` and `{{name}}` in [text] replaced by [params]. */
    fun fill(text: String, params: Map<String, Any?>): String {
        if (params.isEmpty()) return text
        return PLACEHOLDER.replace(text) { m -> params[m.groupValues[1]]?.toString() ?: m.value }
    }

    // Android's pattern engine needs the closing braces escaped too.
    private val PLACEHOLDER = Regex("""\{\{?\s*([\w.-]+)\s*\}?\}""")

    /**
     * Any way of naming a language as one of the list (`da-DK`, `nb_NO`, `pt-br`), landing on
     * one the product speaks: a relative stands in where it lacks the language itself.
     */
    fun normalize(tag: String, allowed: List<DS1Language> = languages): DS1Language? {
        val normal = tag.trim().lowercase().replace('_', '-')
        val primary = normal.substringBefore('-')
        val member = DS1Language.entries.firstOrNull { it.code.lowercase() == normal || normal in it.aliases }
            ?: DS1Language.entries.firstOrNull { it.code.lowercase() == primary }
            ?: return null
        if (member in allowed) return member
        return member.related.firstNotNullOfOrNull { code -> allowed.firstOrNull { it.code == code } }
    }

    /** The language of a locale, among the ones the product speaks. */
    fun fromLocale(locale: Locale, allowed: List<DS1Language> = DS1Language.entries.toList()): DS1Language? =
        normalize(locale.toLanguageTag(), allowed)

    /** The language the picker steps to after the current one. */
    fun next(): DS1Language {
        val i = languages.indexOf(language)
        return languages[(i + 1).mod(languages.size)]
    }
}
