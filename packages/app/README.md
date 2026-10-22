# App

Private app-building controls that compose Design system 1. This workspace package is not published to npm and is excluded from the public DS1 package and bundle.

Import individual controls through `@0001-labs/app/keyboard-shortcut`, `/spacing-handle` or `/loading`; their React adapters (`src/react/`) are not package entries: a React product takes them with the control through Sync 1's components export, and `"react": false` leaves them out. The source is used inside this workspace and depends on its adjacent DS1 foundations. Internal products may copy selected controls and their dependencies through Sync 1. The private browser build is generated separately by `vp run app-controls:build`.

The owner-only guide opens in the documentation shell at https://designsystem1.com/libraries/workspace/?internal=keyboard-shortcut. Muted links appear in their numbered sidebar layers after owner authorization and remain absent from public overview pages. The private document and assets are checked by the Worker on every request. Public visibility is independent of the package split; hiding a catalogue entry does not exclude code from a package.

IndexedDB is a documentation-only ghost component under 1 Root, at https://designsystem1.com/libraries/workspace/?internal=indexeddb. It describes the application-owned snapshot lifecycle and separate edit queue; there is no IndexedDB element, package entry or shared storage runtime.
