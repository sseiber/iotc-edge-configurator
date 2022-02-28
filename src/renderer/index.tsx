import React from 'react';
import { render } from 'react-dom';
import { MemoryRouter as Router } from 'react-router-dom';
import { configure } from 'mobx';
import { store, StoreContext } from './stores/store';
import App from './App';
import { log } from './utils';

const ModuleName = 'renderer:index';

// Don't allow MobX state mutation without a MobX action
configure({
    enforceActions: 'observed'
});

/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

void (async () => {
    log([ModuleName, 'info'], `Starting renderer index module...`);

    render(
        <Router>
            <StoreContext.Provider value={store}>
                <App />
            </StoreContext.Provider>
        </Router>,
        document.getElementById('root')
    );
})().catch();
