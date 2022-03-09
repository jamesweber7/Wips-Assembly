
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
    static create(tagName, id='') {
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
    static createTo(parent, tagName, id='') {
        const el = this.create(tagName, id);
        parent.append(el);
        return el;
    }

    // create element and append to document body
    static createToBody(tagName, id='') {
        return this.createTo(document.body, tagName, id);
    }

    // create element and append to document head
    static createToHead(tagName, id='') {
        return this.createTo(document.head, tagName, id);
    }

    static createTextarea(id='', autoResize=true, spellcheck=false) {
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
                const TAB_STRING = '  ';

                let selectionStart = el.selectionStart;
                let selectionEnd = el.selectionEnd;

                // selection
                if (selectionEnd !== selectionStart) {
                    let value = el.value;
                    let start = value.substring(0, selectionStart);
                    let modifying = value.substring(selectionStart, selectionEnd);
                    let end = value.substring(selectionEnd);
                    if (start.includes('\n')) {
                        let newlineIndex = start.lastIndexOf('\n');
                        start = start.substring(0, newlineIndex) + '\n' + TAB_STRING + start.substring(newlineIndex + '\n'.length);
                    } else {
                        start = TAB_STRING + start;
                    }
                    modifying = modifying.replaceAll('\n', '\n' + TAB_STRING);
                    value = start + modifying + end;
                    el.value = value;
                } else {
                    let value = el.value;
                    value = value.substring(0, selectionStart) + TAB_STRING + value.substring(selectionStart);
                    el.value = value;
                    el.selectionStart = selectionStart + TAB_STRING.length;
                    el.selectionEnd = selectionStart + TAB_STRING.length;
                }
            }
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

    
    /*----------  Identifiers  ----------*/
    
    static isIdentifier(identifier) {
        return this.IDENTIFIERS.includes(identifier);
    }

}