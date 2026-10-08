// Where the page starts.
//
// Everything else is a component. This picks a language, mounts the app and
// gets out of the way — which is also why it is the only file that touches the
// document directly.

import { render } from 'preact';
import { App } from './App.tsx';
import { preferred, setLocale } from './i18n/index.ts';
import './styles/index.css';

setLocale(preferred());

const root = document.getElementById('app');
if (root) render(<App />, root);
