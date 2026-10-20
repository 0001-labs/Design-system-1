import type { LayoutExample } from './layout-examples';

export const SETTINGS_EXAMPLE: LayoutExample = {
  name: 'General settings',
  use: 'A complete settings page with a profile, regional preferences and notification choices.',
  height: 900,
  html: `<style>
.settings-stack { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--ds-unit); }
.settings-section { display:grid; grid-template-columns:calc(8 * var(--ds-unit)) minmax(0,1fr); gap:var(--ds-unit); padding-block:var(--ds-unit); }
.settings-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--ds-unit); }
.settings-actions { display:flex; flex-wrap:wrap; align-items:flex-end; gap:calc(var(--ds-unit) / 2); }
.settings-choice { display:flex; justify-content:space-between; align-items:flex-end; gap:var(--ds-unit); }
.settings-choice > ds-text { min-width:0; }
.settings-section h2 { margin:0; font:inherit; }
.settings-status:empty { display:none; }
@media(max-width:600px) { .settings-section,.settings-fields { grid-template-columns:minmax(0,1fr); } }
</style>
<ds-page layout="column" measure="40" data-ds-surface>
  <div slot="header"><ds-text literal strong>Studio workspace</ds-text></div>
  <div class="settings-stack">
    <div class="settings-stack">
      <ds-text literal size="display" role="heading" aria-level="1">General settings</ds-text>
      <ds-text literal tone="muted" wrap>Make this space feel like yours.</ds-text>
    </div>
    <form id="settings-form" class="settings-stack">
      <section class="settings-section" aria-labelledby="profile-heading">
        <h2 id="profile-heading"><ds-text literal strong>Profile</ds-text></h2>
        <div class="settings-stack">
          <div class="settings-actions"><ds-avatar id="settings-avatar" initial="A" size="large" color="var(--one-zenith-blue)"></ds-avatar><ds-text literal id="settings-profile-name">Alex Morgan</ds-text></div>
          <div class="settings-fields">
            <ds-input id="settings-name" label="Name" name="name" value="Alex Morgan" required></ds-input>
            <ds-input label="Email" name="email" type="email" value="alex@example.com" required></ds-input>
            <ds-input label="Workspace name" name="workspace" value="Studio" required></ds-input>
          </div>
        </div>
      </section>
      <section class="settings-section" aria-labelledby="preferences-heading">
        <h2 id="preferences-heading"><ds-text literal strong>Preferences</ds-text></h2>
        <div class="settings-stack">
          <label class="settings-stack"><ds-text literal>Time zone</ds-text><ds-select><select name="timezone" aria-label="Time zone"><option value="Europe/London">London (Europe/London)</option value="Europe/Copenhagen">Copenhagen (Europe/Copenhagen)</option><option value="Asia/Tokyo">Tokyo (Asia/Tokyo)</option><option value="America/New_York">New York (America/New_York)</option></select></ds-select></label>
          <div class="settings-fields">
            <label class="settings-stack"><ds-text literal>Week starts on</ds-text><ds-select><select name="week" aria-label="Week starts on"><option>Monday</option><option>Sunday</option><option>Saturday</option></select></ds-select></label>
            <label class="settings-stack"><ds-text literal>Time format</ds-text><ds-select><select name="clock" aria-label="Time format"><option value="24">24-hour</option><option value="12">12-hour</option></select></ds-select></label>
          </div>
        </div>
      </section>
      <section class="settings-section" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading"><ds-text literal strong>Notifications</ds-text></h2>
        <div class="settings-stack">
          <div class="settings-choice"><ds-text literal wrap>Email notifications</ds-text><ds-switch><button type="button" role="switch" aria-label="Email notifications" aria-checked="true" data-setting="email-notifications"></button></ds-switch></div>
          <div class="settings-choice"><ds-text literal wrap>Weekly summary</ds-text><ds-switch><button type="button" role="switch" aria-label="Weekly summary" aria-checked="false" data-setting="weekly-summary"></button></ds-switch></div>
          <div class="settings-choice"><ds-text literal wrap>Product news</ds-text><ds-switch><button type="button" role="switch" aria-label="Product news" aria-checked="false" data-setting="product-news"></button></ds-switch></div>
          <ds-text literal size="small" tone="muted" wrap>Choose what reaches your inbox. Essential account messages stay on.</ds-text>
        </div>
      </section>
      <div class="settings-actions">
        <ds-button control="slotted" primary><button type="submit">Save changes</button></ds-button>
        <ds-button control="slotted" secondary><button type="reset">Reset changes</button></ds-button>
      </div>
      <ds-text literal id="settings-status" class="settings-status" role="status" wrap></ds-text>
    </form>
    <ds-text literal tone="muted" size="small" wrap>Fictional settings. Changes stay in this preview and reset when you reload.</ds-text>
  </div>
</ds-page>`,
  script: `const form = document.querySelector('#settings-form');
const inputs = [...form.querySelectorAll('ds-input, select')];
const switches = [...form.querySelectorAll('[role="switch"]')];
const status = document.querySelector('#settings-status');
let saved = inputs.map(input => input.value);
let savedSwitches = switches.map(button => button.getAttribute('aria-checked'));
function changed() { status.textContent = 'Unsaved changes'; }
form.addEventListener('input', changed);
form.addEventListener('change', changed);
switches.forEach(button => button.addEventListener('click', () => {
 button.setAttribute('aria-checked', String(button.getAttribute('aria-checked') !== 'true'));
 changed();
}));
form.addEventListener('submit', event => {
 event.preventDefault();
 if (!form.reportValidity()) return;
 saved = inputs.map(input => input.value);
 savedSwitches = switches.map(button => button.getAttribute('aria-checked'));
 const name = document.querySelector('#settings-name').value.trim();
 document.querySelector('#settings-profile-name').textContent = name;
 document.querySelector('#settings-avatar').setAttribute('initial', name.charAt(0).toUpperCase() || 'A');
 status.textContent = 'Settings saved in this preview.';
});
form.addEventListener('reset', event => {
 event.preventDefault();
 inputs.forEach((input, index) => { input.value = saved[index]; });
 switches.forEach((button, index) => button.setAttribute('aria-checked', savedSwitches[index]));
 status.textContent = 'Changes reset to your last save.';
});`,
};
