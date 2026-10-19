package com.designsystem1.ds1

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier

/**
 * Design system 1 around an app: light or dark as the saved [DS1Preferences.theme] says (the
 * system's by default) unless [dark] says otherwise, and the device scale from the width it is
 * given. It also puts the toast stack ([toasts]) and the page's dialogs ([dialogs]) on screen,
 * so `DS1Toast.success(…)` and `DS1Overlays.confirm(…)` work from anywhere. Wrap the app once:
 * `setContent { DS1Theme { App() } }`.
 */
@Composable
fun DS1Theme(
    modifier: Modifier = Modifier,
    dark: Boolean = ds1IsDark(),
    corner: Float = DS1Metrics.radius,
    toasts: Boolean = true,
    dialogs: Boolean = true,
    content: @Composable () -> Unit,
) {
    CompositionLocalProvider(LocalDS1Dark provides dark) {
        DS1Scaled(modifier, corner) {
            Box {
                content()
                if (toasts) DS1ToastHost()
                if (dialogs) DS1OverlayHost()
            }
        }
    }
}
