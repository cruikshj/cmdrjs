import * as utils from './utils.js';
import Definition from './definition.js';

const _defaultOptions = {
    predefined: ['HELP', 'ECHO', 'CLS'],
    allowAbbreviations: true
};

class DefinitionProvider {
    constructor(options) {
        this.options = utils.extend({}, _defaultOptions, options);
        this.shell = null;
        this.definitions = {};

        this.define = (...args) => {
            this.addDefinition(new Definition(...args));
        };

        this._predefine();
    }

    bind(shell) {
        if (typeof shell.define === 'undefined') {
            shell.define = this.define;
        }
    }

    unbind(shell) {
        if (shell.define === this.define) {
            delete shell.define;
        }
    }

    getDefinitions(name) {
        name = name.toUpperCase();

        let definition = this.definitions[name];

        if (definition) {
            if (definition.available) {
                return [definition];
            }
            return null;
        }

        let definitions = [];

        if (this.options.allowAbbreviations) {
            for (let key in this.definitions) {
                if (key.indexOf(name, 0) === 0 && utils.unwrap(this.definitions[key].available)) {
                    definitions.push(this.definitions[key]);
                }
            }
        }

        return definitions;
    }

    addDefinition(definition) {
        this.definitions[definition.name] = definition;
    }

    _predefine() {
        let provider = this;

        if (this.options.predefined.indexOf('HELP') > -1) {
            this.define({
                name: 'HELP',
                main: function () {
                    this.shell.writeLine('The following commands are available:');
                    this.shell.writeLine();
                    var availableDefinitions = Object.keys(provider.definitions)
                        .map((key) => { return provider.definitions[key]; })
                        .filter((def) => { return def.available; });
                    this.shell.writeTable(availableDefinitions, ['name:10', 'description:40']);
                    this.shell.writeLine();
                },
                description: 'Lists the available commands'
            });
        }

        if (this.options.predefined.indexOf('ECHO') > -1) {
            this.define({
                name: 'ECHO',
                main: function () {
                    let toggle = this.argString.toUpperCase();
                    if (toggle === 'ON') {
                        this.shell.echo = true;
                    } else if (toggle === 'OFF') {
                        this.shell.echo = false;
                    } else {
                        this.shell.writeLine(this.argString);
                    }
                },
                description: 'Displays provided text or toggles command echoing'
            });
        }

        if (this.options.predefined.indexOf('CLS') > -1) {
            this.define({
                name: 'CLS',
                main: function () {
                    this.shell.clear();
                },
                description: 'Clears the command prompt'
            });
        }
    }
}

export default DefinitionProvider;