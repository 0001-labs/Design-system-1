package com.designsystem1.ds1

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource

/** Icon sizes: 14 by default, 12 small, 16 large, times the scale. */
enum class DS1IconSize(val dp: Float) { Small(12f), Regular(14f), Large(DS1Metrics.control) }

/**
 * An icon from Design system 1's library (DS1/x-icon), drawn as a vector in [tint], the text
 * colour by default, as `.ds-icon` draws it as a mask in `currentColor`. A null [tint] keeps
 * the icon's own colours. Icons are decorative unless given a [contentDescription].
 */
@Composable
fun DS1Icon(
    name: DS1IconName,
    modifier: Modifier = Modifier,
    size: DS1IconSize = DS1IconSize.Regular,
    tint: Color? = DS1Colors.text.current,
    contentDescription: String? = null,
) {
    val scale = LocalDS1Scale.current
    Image(
        painter = painterResource(name.drawable),
        contentDescription = contentDescription,
        modifier = modifier.size(scale(size.dp)),
        colorFilter = tint?.let { ColorFilter.tint(it) },
    )
}
