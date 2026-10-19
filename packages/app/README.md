# App

Private app-building controls that compose Design system 1. This workspace package is not published to npm and is excluded from the public DS1 package and bundle.

Import individual controls through `@0001-labs/app/keyboard-shortcut`, `/spacing-handle` or `/loading`; optional React adapters live under `/react/`. The source is used inside this workspace and depends on its adjacent DS1 foundations. Internal products may copy selected controls and their dependencies through Sync 1. The private browser build is generated separately by `vp run app-controls:build`.

The owner-only guide is https://dash.designsystem1.com/private-app/. Its HTML and assets are checked by the Worker on every request. Public visibility is independent of the package split; hiding a catalogue entry does not exclude code from a package.
