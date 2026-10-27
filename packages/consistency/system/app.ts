import '../../../DS1/1-root/one.css';
import '../../../DS1/1-root/grid.css';
import '../../../DS1/3-unit/ds-tabs';
import '../../../DS1/2-core/ds-button';
import './style.css';
import { C9Y_SYSTEM } from './catalogue';
import { mountC9ySystem } from './view';

// C9Y System at system.consistency.site: every Consistency component and the client sites built on them.
const root = document.getElementById('c9y-system');
if (root) mountC9ySystem(root, C9Y_SYSTEM);
