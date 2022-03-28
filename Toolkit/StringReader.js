class StringReader {

    static NULL_INDEX = -1;
    static NULL_STRING = '';

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
        if (!str.substring(fromIndex).includes(to)) {
            return this.NULL_STRING;
        }
        return this.substring(str, fromIndex, to);
    }

    static substringAfter(str, from) {
        let length = 1;
        if (typeof from === 'string') {
            length = from.length;
            from = this.toIndex(str, from);
        }
        return str.substring(from + length);
    }

    static substringBefore(str, to) {
        return this.substring(str, 0, to);
    }

    static includes(substrings) {
        if (!Array.isArray(substrings)) {
            substrings = [...arguments];
            substrings.splice(0, 1);
        }
        for (let i = 0; i < substrings.length; i++) {
            if (str.includes(substrings[i])) {
                return true;
            }
        }
        return false;
    }

    // at least one substring from substrings1 equals at least one substring from substrings2
    static hasEqual(substrings1, substrings2) {
        if (!Array.isArray(substrings1)) {
            substrings1 = [substrings1];
        }
        if (!Array.isArray(substrings2)) {
            substrings2 = [substrings2];
        }
        for (let i = 0; i < substrings1.length; i++) {
            for (let j = 0; j < substrings2.length; j++) {
                if (substrings1[i] === substrings2[j]) {
                    return true;
                }
            }
        }
        return false;
    }

    // (RegExp) validStr.test(testedStr) or (String/String Array) hasEqual(testedStr, validStr)
    static dynamicStringTest(testedStr, validStr) {
        if (this.isRegExp(validStr)) {
            return validStr.test(testedStr);
        }
        return this.hasEqual(testedStr, validStr);
    }

    // return first existant index
    static indexOf(str, substrings) {
        if (!Array.isArray(substrings)) {
            substrings = [...arguments];
            substrings.splice(0, 1);
        }
        let first = -1;
        for (let i = 0; i < substrings.length; i++) {
            let index = str.indexOf(substrings[i]);
            if (index !== -1 && index < first) {
                first = index;
            }
        }
        return first;
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
        if (this.isRegExp(identifier)) {
            return this.indexOfRegExp(str, identifier);
        } else {
            return str.indexOf(identifier);
        }
    }

    static isIndex(index) {
        return Wath.isNumber(index);
    }

    static indexOfRegExp(str, regex) {
        for (let i = 0; i < str.length; i++) {
            if (regex.test(str[i])) {
                return i;
            }
        }
        return this.NULL_INDEX;
    }

    static isRegExp(regex) {
        return regex instanceof RegExp;
    }

    static isUpperCase(str) {
        return str === str.toUpperCase();
    }

    static isLowerCase(str) {
        return str === str.toLowerCase();
    }

    static startsWith(str, end) {
        return str.indexOf(end) === 0;
    }

    static endsWith(str, end) {
        return end === '' ||
        (
            str.includes(end) && 
            (
                (str.indexOf(end) + end.length) === str.length
            )
        );
    }

    static isBetween(str, start, end) {
        return this.startsWith(str, start) && this.endsWith(str, end);
    }

    static numInstancesOf(str, substr) {
        return str.split(substr).length - 1;
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

    static removeWhiteSpace(str) {
        return this.regexReplaceAll(str, /\s/, '');
    }

    static regexReplaceAll(str, regex, replaceWith) {
        while (regex.test(str)) {
            str = str.replace(regex, replaceWith);
        }
        return str;
    }

    static mult(str, times) {
        let extended = '';
        for (let i = 0; i < times; i++) {
            extended += str;
        }
        return extended;
    }

    static getAlphabeticString(index) {
        let char = 'abcdefghijklmnopqrstuvwxyz'[index % 26];
        if (index > 25) {
            return this.getAlphabeticChar(index - 26) + char;
        }
        return char;
    }

    static firstWord(str) {
        const whitespace = /\s/;
        str = str.trim();
        if (whitespace.test(str)) {
            str = this.substringBefore(str, whitespace);
        }
        return str;
    }

    // expects first word to be start of string
    // returns string without quotes
    static getQuotedString(str, validQuoteChar=/["'`]/) {

        // \s"..."...

        // "
        const quoteChar = this.firstWord(str)[0];
        if (!this.dynamicStringTest(quoteChar, validQuoteChar)) {
            return '';
        }

        str = this.substring(str, quoteChar);
        // "..."...
        let quote;
        quote = this.substringBetween(str, quoteChar, quoteChar);
        // check for \"
        while (quote[quote.length - 1] === '\\') {
            quote += quoteChar;
            quote = this.substring(str, quote, quoteChar);
        }
        // replace \" with "
        quote = quote.replaceAll('\\' + quoteChar, quoteChar);
        return quote;
    }

    static fakeToRealSpecialCharacters(str) {
        str = str.replaceAll('\\n', '\n');
        str = str.replaceAll('\\t', '\t');
        str = str.replaceAll('\\\\', '\\');
        str = str.replaceAll('\\r', '\r');
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

    
    /*----------  Misc  ----------*/
    
    
    static bufferBefore(str, bufferWith, length) {
        while (str.length < length) {
            str = bufferWith + str;
        }
        if (str.length > length) {
            throw "tbh I don't really know what you want me to do here";
        }
        return str;
    }

    static bufferAfter(str, bufferWith, length) {
        while (str.length < length) {
            str += bufferWith;
        }
        if (str.length > length) {
            throw "tbh I don't really know what you want me to do here";
        }
        return str;
    }

}

