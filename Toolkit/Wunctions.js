
class Wunctions {

    
    /*----------  Arrays  ----------*/
    
    static randomArrayElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static filledArray(len, funct) {
        const arr = Array(len);
        for (let index = 0; index < arr.length; index++) {
            arr[index] = funct(index);
        }
        return arr;
    }

    static swapArrayElements(arr, index1, index2) {
        const startingEl1 = arr[index1];
        arr[index1] = arr[index2];
        arr[index2] = startingEl1;
        return arr;
    }

    // check if contents of array are equal
    static arrayEquals(arr1, arr2) {
        const length = arr1.length;
        if (length !== arr2.length) {
            return false;
        }
        for (let i = 0; i < length; i++) {
            if (arr1[i] !== arr2[i]) {
                return false;
            }
        }
        return true;
    }

    static getGreatestElement(arr, funct) {
        let greatest = {
            element: arr[0],
            value: funct(arr[0])
        };
        for (let i = 1; i < arr.length; i++) {
            if(funct(arr[i]) > greatest.value) {
                greatest = {
                    element: arr[i],
                    value: funct(arr[i])
                };
            }
        }
        return greatest.element;
    }

    
    /*----------  Color  ----------*/
    
    
    // https://css-tricks.com/converting-color-spaces-in-javascript/
    static rgbToHSL(c) {
        // keeping s = 0.5, l = 0.5

        // Make r, g, and b fractions of 1
        let r = c.r /= 255;
        let g = c.g /= 255;
        let b = c.b /= 255;

        // Find greatest and smallest channel values
        let cmin = Math.min(r,g,b),
            cmax = Math.max(r,g,b),
            delta = cmax - cmin,
            h = 0;
        
        // Calculate hue
        // No difference
        if (delta == 0)
        h = 0;
        // Red is max
        else if (cmax == r)
        h = ((g - b) / delta) % 6;
        // Green is max
        else if (cmax == g)
        h = (b - r) / delta + 2;
        // Blue is max
        else
        h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        
        // Make negative hues positive behind 360°
        if (h < 0)
            h += 360;

        return h;
    }

    static getHSLColorValue(amt) {
        amt *= 360;
        const val = (index) => {
            const k = (index + amt / 30) % 12;
            const color = 0.5 - 0.5 * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color);
        };
        return {
            r: val(0),
            g: val(8),
            b: val(4)
        };
    }

    static getHexColorValue(str) {
        str = str.replaceAll('#', '');
        str = str.trim();
        let r, g, b;
        if (str.length === 3) {
            r = str[0];
            r += r;
            g = str[1];
            g += g;
            b = str[2];
            b += b;
        } else if (str.length === 6) {
            r = str.substring(0,2);
            g = str.substring(2,4);
            b = str.substring(4,6);
        } else {
            return;
        }
        r = Number.parseInt(r, 16);
        g = Number.parseInt(g, 16);
        b = Number.parseInt(b, 16);
        return {
            r: r,
            g: g,
            b: b
        };
    }

    static getRGBColorValue(str) {
        const start = 'rgb(';
        const end = ')';
        str = StringReader.substringAfter(str, start, start.length);
        if (str.includes(end)) {
            str = str.substring(0, str.indexOf(end));
        }
        let rgb = str.split(',');
        for (let i = 0; i < rgb.length; i++) {
            rgb[i] = rgb[i].trim();
            rgb[i] = Number.parseInt(rgb[i]);
            if (!rgb[i] && rgb[i] !== 0) {
                return;
            }
        }
        return {
            r: rgb[0],
            g: rgb[1],
            b: rgb[2]
        };
    }

    static getRandomRGB() {
        return {
            r: Wath.randomInt(0, 255),
            g: Wath.randomInt(0, 255),
            b: Wath.randomInt(0, 255)
        }
    }

    
    /*----------  Misc  ----------*/


    
    /*----------  Urls  ----------*/
    
    static openLinks(links, e) {
        for (let i = 0; i < links.length - 1; i++) {
            this.openLinkInNewTab(links[i]);
        }
        this.openLink(links[links.length -1], e);
    }
    
    static openLink(url, e) {
        if (!e || !e.ctrlKey) {
            this.openLinkInCurrentTab(url);
        } else {
            this.openLinkInNewTab(url);
        }
    }

    static openLinkInCurrentTab(url) {
        window.open(url, '_self');
    }
    
    static openLinkInNewTab(url) {
        window.open(url, '_blank');
    }

    static simplifyUrl(url) {
        url = url.trim();
        url = url.toLowerCase();
        const ignoreStarts = ['https://', 'http://', 'www.'];
        for (let i = 0; i < ignoreStarts.length; i++) {
          const ignoreStart = ignoreStarts[i];
          if (url.includes(ignoreStart)) {
            url = StringReader.substring(url, ignoreStart, ignoreStart.length);
          }
        }
        const ignoreEnds = ['/', '?', '#', '&'];
        for (let i = 0; i < ignoreEnds.length; i++) {
          let ignoreEnd = ignoreEnds[i];
          if (url.includes(ignoreEnd)) {
            url = StringReader.substring(0, ignoreEnd);
          }
        }
        return url;
    }

    static uid() {
        return Wath.randomInt(Number.MAX_SAFE_INTEGER);
    }
    
    static hasData(data) {
        return !!Object.keys(data);
    }
    
    /*----------  Time  ----------*/
    
    
    static getLocalTimezoneString() {
        // minutes per hour
        const mPh = 60;
        const offset = -1 * new Date().getTimezoneOffset() / mPh;
        if (offset < 0) {
            // negative # has the minus (-) sign automatically
            return `GMT${offset}`;
        }
        // need to manually add the sum (+) sign
        return `GMT+${offset}`;
    }

    static getWeekDay() {
        return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
    }
}