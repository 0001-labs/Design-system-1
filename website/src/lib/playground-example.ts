// The site the playground opens with: three pages and the stylesheet they share. Each page is a
// complete HTML document that loads Design system 1 from designsystem1.com, links to the others by
// file name and works as it stands when the site is downloaded and opened anywhere.
export interface PlaygroundFile { name: string; content: string }

const head = (title: string) => `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} · Garden club</title>

  <!-- Design system 1: the stylesheet, then the components. -->
  <link rel="stylesheet" href="https://designsystem1.com/resources/design-system-1.css">
  <script type="module" src="https://designsystem1.com/resources/design-system-1.js"></script>

  <!-- The site's own layout, shared by every page. -->
  <link rel="stylesheet" href="site.css">
</head>`;

const header = (current: string) => `  <ds-header brand="Garden club" href="index.html" literal>
    <a href="index.html"${current === 'index.html' ? ' aria-current="page"' : ''}>Home</a>
    <a href="plants.html"${current === 'plants.html' ? ' aria-current="page"' : ''}>Plants</a>
    <a href="join.html"${current === 'join.html' ? ' aria-current="page"' : ''}>Join</a>
    <ds-button slot="actions" primary href="join.html">Join the club</ds-button>
  </ds-header>`;

const footer = `    <ds-footer slot="footer" brand="Garden club" tagline="Growing things together since 2019" literal year="2026"
      columns='[{"heading":"Club","links":[{"label":"Home","href":"index.html"},{"label":"Plants","href":"plants.html"},{"label":"Join","href":"join.html"}]}]'></ds-footer>`;

export const PLAYGROUND_FILES: PlaygroundFile[] = [
  {
    name: 'index.html',
    content: `<!doctype html>
<html lang="en">
${head('Home')}
<body>
${header('index.html')}

  <ds-page layout="column">
    <div class="stack">
      <ds-text literal size="display" strong wrap role="heading" aria-level="1">Grow something this spring.</ds-text>
      <ds-text literal wrap tone="muted">Change anything in the code. The page follows when you pause, and every link on it works.</ds-text>

      <ds-bento>
        <ds-card href="plants.html" tone="apple-green"><span slot="label">Easy</span><span slot="title">Basil</span>Sun, water and a little patience.</ds-card>
        <ds-card href="plants.html" tone="pink"><span slot="label">Pretty</span><span slot="title">Sweet peas</span>They climb whatever you give them.</ds-card>
        <ds-card href="plants.html" tone="sharp-blue"><span slot="label">Hardy</span><span slot="title">Rosemary</span>Forget it for a month; it will not mind.</ds-card>
      </ds-bento>

      <div class="actions">
        <ds-button primary href="join.html">Join the club</ds-button>
        <ds-button secondary href="plants.html">See what to sow</ds-button>
      </div>
    </div>
${footer}
  </ds-page>
</body>
</html>
`,
  },
  {
    name: 'plants.html',
    content: `<!doctype html>
<html lang="en">
${head('Plants')}
<body>
${header('plants.html')}

  <ds-page layout="column">
    <div class="stack">
      <ds-text literal size="display" strong wrap role="heading" aria-level="1">What to sow, and when.</ds-text>
      <ds-text literal wrap tone="muted">Start indoors on a sunny windowsill, then move them out once the nights are warm.</ds-text>
      <ds-table id="sowing" label="When to sow"></ds-table>
      <ds-accordion literal summary="What if I only have a balcony?" open>Basil and rosemary are happy in pots. Sweet peas need something to climb: a string does.</ds-accordion>
      <ds-accordion literal summary="How often should I water?">When the top of the soil is dry to your finger. More plants are drowned than dried.</ds-accordion>
      <div class="actions"><ds-button primary href="join.html">Grow with us</ds-button></div>
    </div>
${footer}
  </ds-page>

  <script type="module">
    await customElements.whenDefined('ds-table');
    const table = document.querySelector('#sowing');
    table.columns = ['Plant', 'Indoors', 'Outside', 'Harvest'];
    table.data = [
      ['Basil', 'March', 'May', 'June to September'],
      ['Sweet peas', 'February', 'April', 'June to August'],
      ['Rosemary', 'March', 'June', 'All year'],
    ];
  </script>
</body>
</html>
`,
  },
  {
    name: 'join.html',
    content: `<!doctype html>
<html lang="en">
${head('Join')}
<body>
${header('join.html')}

  <ds-page layout="column">
    <form id="join" class="stack">
      <ds-text literal size="display" strong wrap role="heading" aria-level="1">Join the club.</ds-text>
      <ds-text literal wrap tone="muted">We meet on Saturday mornings at the allotments. Bring gloves; we have the rest.</ds-text>
      <ds-input label="Name" name="name" required></ds-input>
      <ds-input label="Email" name="email" type="email" required></ds-input>
      <div class="actions">
        <ds-button control="slotted" primary><button type="submit">Join</button></ds-button>
        <ds-button control="slotted" secondary><button type="reset">Clear</button></ds-button>
      </div>
      <ds-message id="thanks" literal hidden></ds-message>
    </form>
${footer}
  </ds-page>

  <script type="module">
    await customElements.whenDefined('ds-input');
    const form = document.querySelector('#join');
    const thanks = document.querySelector('#thanks');
    form.addEventListener('submit', event => {
      event.preventDefault();
      thanks.text = 'Welcome to the club. Nothing was sent: this is a playground.';
      thanks.hidden = false;
    });
    form.addEventListener('reset', () => { thanks.hidden = true; });
  </script>
</body>
</html>
`,
  },
  {
    name: 'site.css',
    content: `/* The site's own layout. Every size is in squares: var(--ds-unit) is one. */
.stack {
  display: grid;
  gap: var(--ds-unit);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: calc(var(--ds-unit) / 2);
}
`,
  },
];
