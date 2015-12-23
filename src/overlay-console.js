import * as utils from './utils.js';
import Console from './console.js';

const _defaultSettings = {
    autoOpen: false,
    openKey: 192,
    closeKey: 27
};

var _overlayNode = null;

class OverlayConsole extends Console {
    constructor(settings) {

        if (!_overlayNode) {
            _overlayNode = utils.createElement('<div style="display: none" class="cmdr-overlay"></div>');
            document.body.appendChild(_overlayNode);
        }

        settings = utils.extend({}, _defaultSettings, settings);

        super(_overlayNode, settings);
        
        this._overlayNode = _overlayNode;
        this._documentEventHandler = null;
    }

    init() {
        if (this.initialized) return;

        this._documentEventHandler = (function (event) {
            if (!this.isOpen() &&
                ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(event.target.tagName) === -1 &&
                !event.target.isContentEditable &&
                event.keyCode == this.settings.openKey) {
                event.preventDefault();
                this.open();
            } else if (this.isOpen() && event.keyCode == this.settings.closeKey) {
                this.close();
            }
        }).bind(this);

        document.addEventListener('keydown', this._documentEventHandler);

        super.init();

        if (this.settings.autoOpen) {
            this.open();
        }
    }

    dispose() {
        if (!this.initialized) return;

        document.removeEventListener('keydown', this._documentEventHandler);

        this.close();

        super.dispose();
    }

    isOpen() {
        return this._overlayNode.style.display !== 'none';
    }

    open() {
        this._overlayNode.style.display = '';

        setTimeout((function () {
            this._setPromptIndent();  //hack: using 'private' method from base class to fix indent
            this.focus();
        }).bind(this), 0);
    }

    close() {
        this._overlayNode.style.display = 'none';
        this.blur();
    }

    predefine() {
        super.predefine();

        this.define(['CLOSE', 'EXIT'], function () {
            this.console.close();
        }, {
                description: 'Closes the command prompt'
            });
    }
}

export default OverlayConsole;