class StringReader {

    static NULL_INDEX = -1;
    static NULL_CHAR = '';

    static substring(str, from, to=this.NULL_INDEX) {
        let fromIndex, toIndex;
        // cases: 
        // str1, str2
        // str1, num2
        // num1, str2
        // num1, num2

        fromIndex = this.toIndex(str, from);

        if (to === this.NULL_INDEX) {
            toIndex = str.length;
        } else if (this.isIndex(to)) {
            toIndex = to;
        } else {
            toIndex = this.indexAfter(str, from, to);
        }
        
        return str.substring(fromIndex, toIndex);
    }
    

    // substring with inclusive from, to
    static substringAround(str, from, to=this.NULL_INDEX) {
        let toIndex = this.toIndex(str, to);
        let toLength = this.isIndex(to) ? 1 : to.length;
        return this.substring(str, from, toIndex + toLength);
    }

    // substring with exclusive from, to
    static substringBetween(str, from, to=this.NULL_INDEX) {
        let fromIndex = this.toIndex(str, from);
        if (this.isIndex(from)) {
            fromIndex += 1;
        } else {
            fromIndex += from.length;
        }
        return this.substring(str, fromIndex, to);
    }

    static substringAfter(str, from) {
        return this.substringBetween(str, from);
    }

    static substringBefore(str, to) {
        return this.substring(str, 0, to);
    }

    static indexAfter(str, after, find) {
        if (!Wath.isNumber(after)) {
            after = str.indexOf(after) + after.length;
        }
        str = str.substring(after);
        find = this.toIndex(str, find);

        return after + find;
    }

    // identifier index or flag string
    static toIndex(str, identifier) {
        // index
        if (this.isIndex(identifier)) {
            return identifier;
        }
        // str
        return str.indexOf(identifier);
    }

    static isIndex(index) {
        return Wath.isNumber(index);
    }

    static isUpperCase(str) {
        return str === str.toUpperCase();
    }

    static isLowerCase(str) {
        return str === str.toLowerCase();
    }

    static reverse(str) {
        let reversed = '';
        for (let i = 0; i < str.length; i++) {
            reversed = str[i] + reversed;
        }
        return reversed;
    }

    static capitalizeFirstLetters(str) {
        const words = str.split(' ');
        let capitalized = '';
        for (let i = 0; i < words.length; i++) {
            capitalized += this.capitalizeFirstLetter(words[i]);
            if (i < words.length - 1) {
                capitalized += ' ';
            }
        }
        return capitalized;
    }

    static capitalizeFirstLetter(str) {
        return this.replaceAt(str, str[0].toUpperCase(), 0);
    }
    
    static replaceAt(str, replaceWith, at) {
        const start = this.substring(str, 0, at);
        const replaced = replaceWith;
        let end;
        if (typeof at === 'string') {
            if (!str.includes(at)) {
                throw 'BAD!';
            }
            end = str.substring(str.indexOf(at) + at.length);
        } else {
            end = str.substring(at + 1);
        }
        return start + replaced + end;
    }

    // excludes from and to from new string
    static replaceFrom(str, replaceWith, from, to='') {
        if (!str.includes(from)) {
            throw 'str does not include from';
        }
        let start = this.substringBefore(str, from);
        str = this.substring(str, from);
        if (!str.includes(to)) {
            throw 'str does not include to';
        }
        return start + replaceWith + this.substringAfter(str, to);
    }

    static mult(str, times) {
        let extended = '';
        for (let i = 0; i < times; i++) {
            extended += str;
        }
        return extended;
    }

    static getAlphabeticString(index) {
        let char = 'abcdefghijklmnopqrstuvwxyz'[index];
        if (index > 25) {
            return getAlphabeticChar(index - 26) + char;
        }
        return char;
    }

    static firstWord(str) {
        str = str.trim();
        if (str.includes(' ')) {
            str = this.substringBefore(str, ' ');
        }
        if (str.includes('\n')) {
            str = this.substringBefore(str, '\n');
        }
        return str;
    }


    /*----------  Equations/Math  ----------*/

    static parseEquation(equation) {
        equation = equation.trim();
        equation = equation.replaceAll('^', '**');
        equation = this.giveOutsideParentheses(equation);
        return equation;
    }

    static giveOutsideParentheses(equation) {
        while (equation.includes(')') && (equation.indexOf(')') < equation.indexOf('(') || !equation.includes('(') || equation.split(')').length > equation.split('(').length)) {
            equation = '(' + equation;
        }
        while (equation.includes('(') && (equation.lastIndexOf('(') > equation.lastIndexOf(')') || !equation.includes(')') || equation.split('(').length > equation.split(')').length)) {
            equation = equation + ')';
        }
        return equation;
    }

    // checks if value in string is number
    // false if empty string
    static isNumericString(str) {
        return !/[^\d]/.test(str);
    }

}