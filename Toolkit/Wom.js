
class Wom {


    /*=============================================
    =                  Constants                  =
    =============================================*/

    static ID_IDENTIFIER = '#';
    static TAG_IDENTIFIER = '';
    static CLASS_IDENTIFIER = '.';
    static IDENTIFIERS = [this.ID_IDENTIFIER, this.TAG_IDENTIFIER, this.CLASS_IDENTIFIER];


    /*=====  End of Constants  ======*/


    // create element and give it an id; returns element matching id if it exists
    static create(tagName, id = '') {
        if (id && document.getElementById(id)) {
            return document.getElementById(id);
        }
        const el = document.createElement(tagName);
        if (id) {
            el.id = id;
        }
        return el;
    }

    // create element and append to parent
    static createTo(parent, tagName, id = '') {
        const el = this.create(tagName, id);
        parent.append(el);
        return el;
    }

    // create element and append to document body
    static createToBody(tagName, id = '') {
        return this.createTo(document.body, tagName, id);
    }

    // create element and append to document head
    static createToHead(tagName, id = '') {
        return this.createTo(document.head, tagName, id);
    }

    static createTextarea(id = '', autoResize = true, spellcheck = false) {
        const textarea = this.create('textarea', id);
        if (autoResize) {
            this.addAutoResize(textarea);
        }
        textarea.spellcheck = spellcheck;
        return textarea;
    }

    static addTabFunctionality(el) {
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();

                const NEWLINE_STRING = '\n';
                const TAB_STRING = '\t';
                const NEWLINE_TAB_STRING = NEWLINE_STRING + TAB_STRING

                const selectionStart = el.selectionStart;
                const selectionEnd = el.selectionEnd;

                if (e.shiftKey) {
                    let newSelectionStart = selectionStart;
                    let newSelectionEnd = selectionEnd;

                    let value = el.value;
                    let start = value.substring(0, selectionStart);
                    let modifying = value.substring(selectionStart, selectionEnd);
                    let end = value.substring(selectionEnd);
                    if (start.includes(NEWLINE_STRING)) {
                        let newlineIndex = start.lastIndexOf(NEWLINE_STRING);
                        if (start.lastIndexOf(NEWLINE_TAB_STRING) === newlineIndex) {
                            start = start.substring(0, newlineIndex) + NEWLINE_STRING + start.substring(newlineIndex + NEWLINE_TAB_STRING.length);
                            newSelectionStart -= TAB_STRING.length;
                            newSelectionEnd -= TAB_STRING.length;
                        }
                    } else if (start.indexOf(TAB_STRING) === 0) {
                        start = start.substring(TAB_STRING.length);
                        newSelectionStart -= TAB_STRING.length;
                        newSelectionEnd -= TAB_STRING.length;
                    }
                    newSelectionEnd -= TAB_STRING.length * StringReader.numInstancesOf(modifying, NEWLINE_TAB_STRING);
                    modifying = modifying.replaceAll(NEWLINE_TAB_STRING, NEWLINE_STRING);
                    value = start + modifying + end;
                    el.value = value;

                    el.selectionStart = newSelectionStart;
                    el.selectionEnd = newSelectionEnd;
                } else {
                    let numAdditions = 1;
                    if (selectionEnd !== selectionStart) {
                        let value = el.value;
                        let start = value.substring(0, selectionStart);
                        let modifying = value.substring(selectionStart, selectionEnd);
                        numAdditions += StringReader.numInstancesOf(modifying, NEWLINE_STRING);
                        let end = value.substring(selectionEnd);
                        if (start.includes(NEWLINE_STRING)) {
                            let newlineIndex = start.lastIndexOf(NEWLINE_STRING);
                            start = start.substring(0, newlineIndex) + NEWLINE_TAB_STRING + start.substring(newlineIndex + NEWLINE_STRING.length);
                        } else {
                            start = TAB_STRING + start;
                        }
                        modifying = modifying.replaceAll(NEWLINE_STRING, NEWLINE_TAB_STRING);
                        value = start + modifying + end;
                        el.value = value;

                    } else {
                        let value = el.value;
                        value = value.substring(0, selectionStart) + TAB_STRING + value.substring(selectionStart);
                        el.value = value;
                    }
                    el.selectionStart = selectionStart + TAB_STRING.length;
                    el.selectionEnd = selectionEnd + TAB_STRING.length * numAdditions;
                }
            }
        });
    }

    static addLineSelectFunctionality(el) {
        el.addEventListener('keydown', (e) => {
            if ((e.key !== 'l' && e.key !== 'L') || !e.ctrlKey) {
                return;
            }

            e.preventDefault();

            const NEWLINE_STRING = '\n';

            const selectionStart = el.selectionStart;
            
            let newSelectionStart = 0;
            let newSelectionEnd = el.value.length;

            const pre = el.value.substring(0, selectionStart);
            if (pre.includes(NEWLINE_STRING)) {
                newSelectionStart = pre.lastIndexOf(NEWLINE_STRING) + NEWLINE_STRING.length;
            }
            const post = el.value.substring(selectionStart);
            if (post.includes(NEWLINE_STRING)) {
                newSelectionEnd = pre.length + post.indexOf(NEWLINE_STRING);
            }

            el.selectionStart = newSelectionStart;
            el.selectionEnd = newSelectionEnd;
        });
    }


    static createScript(body) {
        const script = this.createToHead('script');
        script.type = 'text/javascript';
        script.innerText = body;
        return script;
    }

    static createStyle(id, innerText) {
        const style = this.createToHead('style', `${id}-style`);
        if (innerText) {
            style.innerText = innerText;
        }
        return style;
    }

    static createStyleBody(identifier, body) {
        const id = identifier.replaceAll(' ', '-');
        return this.createStyle(id,
            `${identifier} {
                ${body}
            }`);
    }

    static createRoot(id, body) {
        return this.createStyle(id,
            `:root {
                ${body}
            }`);
    }

    static createRootVariable(variable, value) {
        return this.createRoot(variable,
            `${variable}: ${value};`);
    }

    static createSVG() {
        throw 'FUNCTION NOT CREATED YET o.O';
    }

    static createPopup(text, id='') {
        const popup = this.createToBody('popup', id);
        const title = this.createTo(popup, 'popuptitle', `${id}-title`);
        title.innerText = text;
        return popup;
    }

    // get array of matching elements (not DOMList) by classname
    static getArrayByClassName(className) {
        return [...document.getElementsByClassName(className)];
    }

    // get array of matching elements (not DOMList) by tagname
    static getArrayByTagName(tagName) {
        return [...document.getElementsByTagName(tagName)];
    }

    static getChildren(element) {
        return [...element.children];
    }

    static clearAllChildren(element) {
        while (element.lastChild) {
            element.lastChild.remove();
        }
    }

    static getParent(child, identifierTitle, identifierValue) {
        if (child.getAttribute(identifierTitle) == identifierValue) {
            return child;
        }
        if (!child.parentElement) {
            return;
        }
        return getParent(child.parentElement, identifierTitle, identifierValue);
    }


    /*----------  Textareas  ----------*/


    static addAutoResizeToTextareas() {
        [...document.getElementsByTagName('textarea')].forEach(textarea => {
            this.addAutoResize(textarea);
        });
    }

    static addAutoResize(textarea) {
        textarea.setAttribute("style", "height:" + (textarea.scrollHeight) + "px;overflow-y:hidden;");
        textarea.addEventListener("input", this.expandTextarea);
    }

    static expandTextareaOnlyOnFocus(textarea) {
        textarea.addEventListener("focus", this.expandTextarea);
        textarea.addEventListener("focusout", this.collapseTextarea);
    }

    static expandTextarea() {
        const y = window.scrollY;
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
        window.scrollTo(0, y);
    }

    static collapseTextarea() {
        this.style.height = "auto";
    }

    
    /*----------  Inputs  ----------*/
    
    static controlNumberInput(input, min=null, max=null, step=null) {

        input.type = 'number';
        
        if (min === null) {
            if (input.min) {
                min = input.min;
            } else {
                min = -Infinity;
                input.min = min;
            }
        } else {
            input.min = min;
        }
        if (max === null) {
            if (input.max) {
                max = input.max;
            } else {
                max = Infinity;
                input.max = max;
            }
        } else {
            input.max = max;
        }
        if (max === null) {
            if (input.step) {
                step = input.step;
            }
        }
        // on change so user doesn't get overwritten between making valid input (add front numbers that go over max but planning to delete last numbers, inputting 0.15 on step size 0.075)
        input.addEventListener('change', () => {
            const userValue = input.value;
            let value = userValue;
            value = Wath.constrain(value, min, max);
            if (step !== null) {
                value = Wath.roundToStep(value, step);
            }
            if (value !== userValue) {
                input.value = value;
            }
        });
    }


    /*----------  Data  ----------*/

    static createDocumentData(id, data) {
        if (!id.includes('-data')) {
            id += '-data';
        }
        const el = this.create('data', id);
        el.setAttribute('data', data);
        return el;
    }

    static getDocumentData(id) {
        if (!id.includes('-data')) {
            id += '-data';
        }
        return document.getElementById(id).getAttribute('data');
    }


    /*----------  Magic Sets  ----------*/
    // "magic sets" are a pair of two elements: a "wand" and a "magicbox"
    // clicking on a wand makes its magicbox appear and disappear

    static createMagicSet(id) {
        const magicbox = this.createMagicBox(id);
        const wand = this.createWand(id, magicbox);
        return {
            magicbox: magicbox,
            wand: wand
        };
    }

    static createMagicBox(id) {
        const magicbox = this.create('magicbox', this.magicboxId(id));
        this.closeMagicBox(magicbox);
        return magicbox;
    }

    static toggleMagicBox(magicbox) {
        magicbox.classList.toggle('hidden');
    }

    static openMagicBox(magicbox) {
        magicbox.classList.remove('hidden');
    }

    static closeMagicBox(magicbox) {
        magicbox.classList.add('hidden');
    }

    static createWand(id, magicbox) {
        const wand = this.create('button', this.wandId(id));
        wand.className = 'wand';
        wand.innerText = StringReader.capitalizeFirstLetters(
            id.replace(/[-_]/g, ' ')
        );
        wand.onclick = () => {
            this.toggleMagicBox(magicbox);
        }
        return wand;
    }

    static magicboxId(id) {
        return `${id}-mb`;
    }

    static wandId(id) {
        return `${id}-wand`;
    }

    // swap visibility of buttons onclick
    static yinYang(btn1, btn2) {
        btn1.addEventListener("click", () => {
            this.onOff(btn2, btn1);
        });
        btn2.addEventListener("click", () => {
            this.onOff(btn1, btn2);
        })
    }

    // btn1 visible, btn2 invisible (reverse if !firston)
    static onOff(btn1, btn2, firstOn=true) {
        if (firstOn) {
            // 1 on
            btn1.classList.remove("hidden");
            // 2 off
            btn2.classList.add("hidden");
        } else {
            // 2 on
            btn2.classList.remove("hidden");
            // 1 off
            btn1.classList.add("hidden");
        }
    }


    /*----------  Identifiers  ----------*/

    static isIdentifier(identifier) {
        return this.IDENTIFIERS.includes(identifier);
    }

    static isFocusedOnInput() {
        return  document.activeElement.tagName === 'TEXTAREA' || 
                document.activeElement.tagName === 'INPUT';
    }

}