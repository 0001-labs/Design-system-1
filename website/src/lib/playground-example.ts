// The file the playground opens with: one complete HTML document, everything in it, that loads
// Design system 1 from designsystem1.com and works as it stands when saved and opened anywhere.
export const PLAYGROUND_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Garden club</title>

  <!-- Design system 1: the stylesheet, then the components. -->
  <link rel="stylesheet" href="https://designsystem1.com/resources/design-system-1.css">
  <script type="module" src="https://designsystem1.com/resources/design-system-1.js"></script>

  <!-- Your own layout. Every size is in squares: var(--ds-unit) is one. -->
  <style>
    .stack { display: grid; gap: var(--ds-unit); }
    .actions { display: flex; flex-wrap: wrap; align-items: flex-end; gap: calc(var(--ds-unit) / 2); }
  </style>
</head>
<body>
  <ds-header brand="Garden club" literal>
    <a href="#plants">Plants</a>
    <a href="#sowing">Sowing</a>
    <a href="#join">Join</a>
    <ds-button slot="actions" primary href="#join">Join the club</ds-button>
  </ds-header>

  <ds-page layout="column">
    <div class="stack">
      <ds-text literal size="display" strong wrap role="heading" aria-level="1">Grow something this spring.</ds-text>
      <ds-text literal wrap tone="muted">Change anything in the code. The page follows when you pause.</ds-text>

      <ds-bento id="plants">
        <ds-card tone="apple-green"><span slot="label">Easy</span><span slot="title">Basil</span>Sun, water and a little patience.</ds-card>
        <ds-card tone="pink"><span slot="label">Pretty</span><span slot="title">Sweet peas</span>They climb whatever you give them.</ds-card>
        <ds-card tone="sharp-blue"><span slot="label">Hardy</span><span slot="title">Rosemary</span>Forget it for a month; it will not mind.</ds-card>
      </ds-bento>

      <ds-text literal size="heading" strong role="heading" aria-level="2">When to sow</ds-text>
      <ds-table id="sowing" label="When to sow"></ds-table>

      <form id="join" class="stack">
        <ds-text literal size="heading" strong role="heading" aria-level="2">Join the club</ds-text>
        <ds-input label="Name" name="name" required></ds-input>
        <ds-input label="Email" name="email" type="email" required></ds-input>
        <div class="actions">
          <ds-button control="slotted" primary><button type="submit">Join</button></ds-button>
          <ds-button control="slotted" secondary><button type="reset">Clear</button></ds-button>
        </div>
        <ds-message id="thanks" literal hidden></ds-message>
      </form>
    </div>
  </ds-page>

  <script type="module">
    await customElements.whenDefined('ds-table');
    const table = document.querySelector('#sowing');
    table.columns = ['Plant', 'Indoors', 'Outside'];
    table.data = [['Basil', 'March', 'May'], ['Sweet peas', 'February', 'April'], ['Rosemary', 'March', 'June']];

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
`;
