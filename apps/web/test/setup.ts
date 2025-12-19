import { Window } from 'happy-dom';

const window = new Window();

// minimal globals
(globalThis as any).window = window;
(globalThis as any).document = window.document;
(globalThis as any).navigator = window.navigator;
(globalThis as any).HTMLElement = window.HTMLElement;
(globalThis as any).CustomEvent = window.CustomEvent;
(globalThis as any).Event = window.Event;