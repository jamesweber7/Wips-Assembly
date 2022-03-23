class LogicGate {

    /*=============================================
    =                   Binary                    =
    =============================================*/

    static testGate(gate, numInputs, resultReturn=console.log) {
        const iterations = 2**numInputs;
        for (let i = 0; i < iterations; i++) {
            const bitstring = this.bitstringToPrecision(
                this.toBitstring(i),
                numInputs
            );
            const bits = this.split(bitstring)
            resultReturn(gate(bits));
        }
    }

    static bitstringToDecimal(bitstring) {
        return Wath.parseFloat(bitstring, 2);
    }

    static sign(bitstring) {
        return bitstring[0];
    }

    static signedBitstringToDecimal(bitstring) {
        // positive
        if (!this.bitToBool(this.sign(bitstring))) {
            return this.bitstringToDecimal(bitstring);
        }
        // negative
        return -1 * this.bitstringToDecimal(this.undoTwosComplement(bitstring));
    }
    
    static toBitstring(num) {
        return num.toString(2);
    }

    static dynamicToBitstring(num) {
        if (typeof num === 'number') {
            return this.toBitstring(num);
        }
        if (typeof num === 'string') {
            if (this.isBitstring(num)) {
                return num;
            }
            if (Wath.isHex(num)) {
                return this.hexToBitstring(num);
            }
        }
        throw 'Not THAT Dynamic!';
    }

    // static toSignedBitstring(num) {
    //     const abs = Math.abs(num);
    //     const uBitstring = this.toBitstring(abs);
    //     if (num < 0) {
    //         return '1' + this.twosComplement(uBitstring);
    //     } else {
    //         return '0' + uBitstring;
    //     }
    // }

    static toSignedBitstring(num) {
        const abs = Math.abs(num);
        const uBitstring = this.toBitstring(abs);
        let result;
        if (num < 0) {
            result = this.twosComplement(uBitstring);
            if (
                LogicGate.bitToBool(
                    uBitstring[0]
                )
            ) {
                result = '1' + result;
            }
        } else {
            result = uBitstring;
            if (
                LogicGate.bitToBool(
                    uBitstring[0]
                )
            ) {
                result = '0' + result;
            }
        }
        return result;
    }

    // warning: true even if string is intended to be decimal '10'
    // false if str includes - (negative) or . (decimal)
    static isBitstring(str) {
        return !/[^10]/.test(str);
    }

    static toHexString(num) {
        return num.toString(16);
    }

    static hexToBitstring(num) {
        return this.toBitstring(Wath.parseFloat(num, 16));
    }

    static toAscii(bitstring) {
        return String.fromCharCode(
            this.bitstringToDecimal(bitstring)
        );
    }

    // returns array of words with four byte ascii bitstrings
    // last word will have nul char - if length multiple of 4, last word will be 0
    static fromAscii(str) {
        let word = '';
        let words = [];
        // "abcdefghij"     abcd    +0
        //                  efgh    +4
        //                  ij00    +8
        for (let i = 0; i < str.length; i++) {
            let byte = LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(
                    str.charCodeAt(i)
                ),
                8
            );
            word += byte;
            if (i % 4 === 3) {
                words.push(word);
                word = '';
            }
        }
        // if (word) {
            word = this.shiftLeftToPrecision(word, 32);
            words.push(word);
        // }
        return words;
    }

    static bitToBool(bit) {
        if (bit === '1') {
            return true;
        }
        if (bit === '0') {
            return false;
        }
        throw 'invalid bit';
    }

    static booleanToBit(bool) {
        return bool ? '1' : '0'
    }

    
    /*----------  primitive logic gates  ----------*/

    static bitAnd(bits) {
        if (!Array.isArray(bits)) {
            bits = [...arguments];
        }
        for (let i = 0; i < bits.length; i++) {
            if (this.bitToBool(this.bitNot(bits[i]))) {
                return '0';
            }
        }
        return '1';
    }

    static twoInputAnd(bitstring1, bitstring2) {
        let andstring = '';
        for (let i = 0; i < bitstring1.length; i++) {
            andstring += this.bitAnd(bitstring1[i], bitstring2[i]);
        }
        return andstring;
    }

    static and(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        let andstring = bitstrings[0];
        for (let i = 1; i < bitstrings.length; i++) {
            andstring = this.twoInputAnd(andstring, bitstrings[i]);
        }
        return andstring;
    }

    static bitOr(bits) {
        if (!Array.isArray(bits)) {
            bits = [...arguments];
        }
        for (let i = 0; i < bits.length; i++) {
            if (this.bitToBool(bits[i])) {
                return '1';
            }
        }
        return '0';
    }

    static twoInputOr(bitstring1, bitstring2) {
        let orstring = '';
        for (let i = 0; i < bitstring1.length; i++) {
            orstring += this.bitOr(bitstring1[i], bitstring2[i]);
        }
        return orstring;
    }

    static or(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        let orstring = bitstrings[0];
        for (let i = 1; i < bitstrings.length; i++) {
            orstring = this.twoInputOr(orstring, bitstrings[i]);
        }
        return orstring;
    }

    static bitNot(bit) {
        const bool = !this.bitToBool(bit);
        return this.booleanToBit(bool);
    }

    static not(bitstring) {
        let notstring = '';
        for (let i = 0; i < bitstring.length; i++) {
            notstring += this.bitNot(bitstring[i]);
        }
        return notstring;
    }

    static bitNand(bits) {
        if (!Array.isArray(bits)) {
            bits = [...arguments];
        }
        return this.bitNot(this.bitAnd(bits));
    }

    static nand(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        return this.not(this.and(bitstrings));
    }

    static bitNor(bits) {
        if (!Array.isArray(bits)) {
            bits = [...arguments];
        }
        return this.bitNot(this.bitOr(bits));
    }

    static nor(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        return this.not(this.or(bitstrings));
    }

    static twoInputBitXor(bit1, bit2) {
        return this.bitAnd(
            this.bitOr(bit1, bit2),
            this.bitNot(this.bitAnd(bit1, bit2))
        );
    }

    static bitXor(bits) {
        if (!Array.isArray(bits)) {
            bits = [...arguments];
        }
        let xorBit = bits[0];
        for (let i = 1; i < bits.length; i++) {
            xorBit = this.twoInputBitXor(xorBit, bits[i]);
        }
        return xorBit;
    }

    static twoInputXor(bitstring1, bitstring2) {
        let xorstring = '';
        for (let i = 0; i < bitstring1.length; i++) {
            xorstring += this.twoInputBitXor(bitstring1[i], bitstring2[i]);
        }
        return xorstring;
    }

    static xor(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        let xorBitstring = bitstrings[0];
        for (let i = 1; i < bitstrings.length; i++) {
            xorBitstring = this.twoInputXor(xorBitstring, bitstrings[i]);
        }
        return xorBitstring;
    }

    static bitXnor(bits) {
        if (!Array.isArray(bits)) {
            bits = [...arguments];
        }
        return this.bitNot(this.bitXor(bits));
    }

    static xnor(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        return this.not(this.xor(bitstrings));
    }

    
    /*----------  derived logic gates  ----------*/
    
    // each bit in bitstring AND bit
    static bitstringAndBit(bitstring, bit) {
        let result = '';
        for (let i = 0; i < bitstring.length; i++) {
            result += this.bitAnd(bitstring[i], bit);
        }
        return result;
    }

    // each bit in bitstring OR bit
    static bitstringOrBit(bitstring, bit) {
        let result = '';
        for (let i = 0; i < bitstring.length; i++) {
            result += this.bitOr(bitstring[i], bit);
        }
        return result;
    }

    static halfAdder(bit1, bit2) {
        return {
            sum: this.bitXor(bit1, bit2),
            cout: this.bitAnd(bit1, bit2)
        };
    }

    static fullAdder(bit1, bit2, cin) {
        return {
            sum: this.bitXor(bit1, bit2, cin),
            cout: this.bitOr(
                this.bitAnd(bit1, bit2),
                this.bitAnd(bit1, cin),
                this.bitAnd(bit2, cin))
        };
    }

    static fourBitAdder(a, b, cin) {
        let y = '';
        let cout3, cout4;
        let cry = cin;
        for (let i = 3; i >= 0; i--) {
            const fullAdder = this.fullAdder(a[i], b[i], cry);
            const sum = fullAdder.sum;
            cry = fullAdder.cout;
            y = sum + y;
            if (i === 1) {
                cout3 = cry;
            }
            if (i === 0) {
                cout4 = cry;
            }
        }
        const overflow = this.xor(cout3, cout4);
        const cout = cout4;
        return {
            y: y,
            overflow: overflow,
            cout: cout
        };
    }

    static standardizeBitStringLengths(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        const longestBitstring = Wunctions.getGreatestElement(bitstrings, (bitstring) => {
            return bitstring.length;
        });
        const length = longestBitstring.length;
        for (let i = 0; i < bitstrings.length; i++) {
            bitstrings[i] = this.bitstringToPrecision(bitstrings[i], length);
        }
        return bitstrings;
    }

    static twoInputAdd(bitstring1, bitstring2) {
        // make sure bitstrings are same length
        const lengthNormalizedBitStrings = this.standardizeBitStringLengths(bitstring1, bitstring2);
        bitstring1 = lengthNormalizedBitStrings[0];
        bitstring2 = lengthNormalizedBitStrings[1];

        const length = bitstring1.length;

        let result = '';
        let cry = '0';
        for (let i = length - 1; i >= 0; i--) {
            const bit1 = bitstring1[i];
            const bit2 = bitstring2[i];
            const adder = this.fullAdder(bit1, bit2, cry);
            result = adder.sum + result;
            cry = adder.cout;
        }
        if (this.bitToBool(cry)) {
            result = '1' + result;
        }
        return result;
    }

    static add(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        let sum = bitstrings[0];
        for (let i = 1; i < bitstrings.length; i++) {
            sum = this.twoInputAdd(sum, bitstrings[i]);
        }
        return sum;
    }

    static sub(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        bitstrings = this.standardizeBitStringLengths(bitstrings);
        let difference = bitstrings[0];
        for (let i = 1; i < bitstrings.length; i++) {
            let twosComplement = this.twosComplement(bitstrings[i]);
            difference = this.add(difference, twosComplement);
        }
        if (difference.length > bitstrings[0].length) {
            difference = difference.substring(1);
        }
        return difference;
    }

    static twoInputAddNoResize(bitstring1, bitstring2) {
        // make sure bitstrings are same length
        const lengthNormalizedBitStrings = this.standardizeBitStringLengths(bitstring1, bitstring2);
        bitstring1 = lengthNormalizedBitStrings[0];
        bitstring2 = lengthNormalizedBitStrings[1];

        const length = bitstring1.length;

        let result = '';
        let cry = '0';
        for (let i = length - 1; i >= 0; i--) {
            const bit1 = bitstring1[i];
            const bit2 = bitstring2[i];
            const adder = this.fullAdder(bit1, bit2, cry);
            result = adder.sum + result;
            cry = adder.cout;
        }
        return result;
    }

    static addNoResize(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        let sum = bitstrings[0];
        for (let i = 1; i < bitstrings.length; i++) {
            sum = this.twoInputAddNoResize(sum, bitstrings[i]);
        }
        return sum;
    }

    static bitGt(bit1, bit2) {
        return this.and(
            bit1,
            this.not(bit2)
        );
    }

    // ≥
    static geq(bitstring1, bitstring2) {
        return this.not(
            this.lt(bitstring1, bitstring2)
        );
    }

    static signedGeq(bitstring1, bitstring2) {
        if (bitstring1.length !== bitstring2.length) {
            throw "you're too dumb to avoid a semantic error if these can be different lengths";
        }
        const split1 = this.split(bitstring1, 1, bitstring1.length - 1);
        const sign1 = split1[0];
        const uBitstring1 = split1[1];
        const split2 = this.split(bitstring2, 1, bitstring2.length - 1);
        const sign2 = split2[0];
        const uBitstring2 = split2[1];

        const uGeq = this.geq(uBitstring1, uBitstring2);

        return this.mux(
            uGeq,   // both +
            '1',    // bitstring2 -
            '0',    // bitstring1 -
            uGeq,   // both -
            this.merge(sign1, sign2)
        );
    }

    static bitLt(bit1, bit2) {
        return this.and(
            bit2,
            this.not(bit1)
        );
    }

    // <
    static lt(bitstring1, bitstring2) {
        const lengthStandardizedBitStrings = this.standardizeBitStringLengths(bitstring1, bitstring2);
        bitstring1 = lengthStandardizedBitStrings[0];
        bitstring2 = lengthStandardizedBitStrings[1];
        const length = bitstring1.length;
        let gt = '0';
        let lt = '0';
        for (let i = 0; i < length; i++) {
            gt = this.and(
                this.not(lt),
                this.or(
                    gt,
                    this.bitGt(
                        bitstring1[i],
                        bitstring2[i]
                    )
                )
            );
            lt = this.and(
                this.not(gt),
                this.or(
                    lt,
                    this.bitLt(
                        bitstring1[i],
                        bitstring2[i]
                    )
                )
            )
        }
        return lt;
    }

    // >
    static gt(bitstring1, bitstring2) {
        const lengthStandardizedBitStrings = this.standardizeBitStringLengths(bitstring1, bitstring2);
        bitstring1 = lengthStandardizedBitStrings[0];
        bitstring2 = lengthStandardizedBitStrings[1];
        const length = bitstring1.length;
        let gt = '0';
        let lt = '0';
        for (let i = 0; i < length; i++) {
            gt = this.and(
                this.not(lt),
                this.or(
                    gt,
                    this.bitGt(
                        bitstring1[i],
                        bitstring2[i]
                    )
                )
            );
            lt = this.and(
                this.not(gt),
                this.or(
                    lt,
                    this.bitLt(
                        bitstring1[i],
                        bitstring2[i]
                    )
                )
            )
        }
        return gt;
    }

    static bitLeq(bit1, bit2) {
        return this.nand(
            bit1,
            this.not(bit2)
        );
    }

    // ≤
    static leq(bitstring1, bitstring2) {
        return this.not(
            this.gt(bitstring1, bitstring2)
        );
    }

    static bitEq(bits) {
        if (!Array.isArray(bits)) {
            bits = [...arguments];
        }
        return this.bitXnor(bits);
    }

    static twoInputEq(bitstring1, bitstring2) {
        const standardizeBitStringLengths = this.standardizeBitStringLengths(bitstring1, bitstring2);
        bitstring1 = standardizeBitStringLengths[0];
        bitstring2 = standardizeBitStringLengths[1];
        for (let i = 0; i < bitstring1.length; i++) {
            if (this.bitToBool(this.not(this.bitEq(bitstring1[i], bitstring2[i])))) {
                return '0';
            }
        }
        return '1';
    }

    static eq(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        return this.set(this.xnor(bitstrings));
    }

    static neq(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        return this.not(this.eq(bitstrings));
    }

    // returns '1' if all bits in bitstring are low
    static zero(bitstring) {
        const bits = this.split(bitstring);
        return this.nor(bits);
    }

    // returns '1' all bits in bitstring are high
    static set(bitstring) {
        const bits = this.split(bitstring);
        return this.and(bits);
    }

    static removeLeadingZeros(bitstring) {
        if (this.zero(bitstring)) {
            return '0';
        }
        return StringReader.substring(bitstring, '1');
    }

    static mux(inputs, selector) {
        if (!Array.isArray(inputs)) {
            inputs = [...arguments];
            selector = inputs.pop();
        }
        const index = this.bitstringToDecimal(selector);
        return inputs[index];
    }

    static demux(selector, enable='1') {
        const length = 2**selector.length;
        const selected = this.bitstringToDecimal(selector);
        let output = this.bitstringToPrecision('', length);
        if (this.bitToBool(this.not(enable))) {
            return output;
        }        
        output = StringReader.replaceAt(output, '1', selected);
        return output;
    }

    static split(bitstring, positions=[]) {
        const bits = bitstring.split('');
        if (!Array.isArray(positions)) {
            positions = [...arguments].splice(1);
        }
        // if no positions, return bitstring split into individual bits
        if (!positions.length) {
            return bits;
        }
        const splitOut = [];
        for (let i = 0; i < positions.length; i++) {
            bitstring = '';
            for (let j = 0; j < positions[i]; j++) {
                bitstring = this.merge(bitstring, bits.splice(0, 1));
            }
            splitOut.push(bitstring);
        }
        return splitOut;
    }

    static merge(bitstrings) {
        if (!Array.isArray(bitstrings)) {
            bitstrings = [...arguments];
        }
        let bitstring = '';
        for (let i = 0; i < bitstrings.length; i++) {
            bitstring += bitstrings[i];
        }
        return bitstring;
    }

    // duplicate bit, used for a 1-bit signal entering an array of gates 
    static duplicate(bit, length) {
        return StringReader.mult(bit, length);
    }

    static sll(bitstring, positions) {
        bitstring = bitstring.substring(positions);
        bitstring += StringReader.mult('0', positions);
        return bitstring;
    }

    static srl(bitstring, positions) {
        const length = bitstring.length;
        const shifted = this.div(bitstring,
            this.toBitstring(2**positions));
        return this.bitstringToPrecision(shifted, length);
    }

    static div(bitstring1, bitstring2) {
        return this.toBitstring(
            this.bitstringToDecimal(bitstring1) /
            this.bitstringToDecimal(bitstring2)
        );
    }

    static incrementer32(a) {
        let cry = '1';
        let incremented = '';
        for (let i = 31; i >= 0; i--) {
            const halfAdder = this.halfAdder(a[i], cry);
            cry = halfAdder.cout;
            incremented = halfAdder.sum + incremented;
        }
        return incremented;
    }

    static incrementer16(a) {
        let cry = '1';
        let incremented = '';
        for (let i = 15; i >= 0; i--) {
            const halfAdder = this.halfAdder(a[i], cry);
            cry = halfAdder.cout;
            incremented = halfAdder.sum + incremented;
        }
        return incremented;
    }

    static incrementer4(a, inc) {
        let cry = inc;
        let y = '';
        for (let i = 3; i >= 0; i--) {
            const halfAdder = this.halfAdder(a[i], cry);
            cry = halfAdder.cout;
            y = halfAdder.sum + y;
        }
        return {
            y: y,
            cry: cry
        };
    }

    static notNeg(a, invert, neg) {
        let xor = '';
        for (let i = 0; i < 4; i++) {
            xor += this.xor(a[i], invert);
        }
        const inc = this.bitAnd(invert, neg);
        return this.incrementer4(xor, inc);
    }

    // a, b 16 bits
    static andAdd(a, b, cin, add, pass) {
        const fourBitAdder = this.fourBitAdder(a, b, cin);

        const cout = fourBitAdder.cout;
        const overflow = fourBitAdder.overflow;
        const y = this.mux([
            this.mux([
                    this.and(a, b),
                    fourBitAdder.y
                ],
                add
            ), 
            a
        ], 
        pass);
        return {
            y: y,
            cout: cout,
            overflow: overflow
        };
    }

    // 16 bit a, b, 
    // cin (1 bit)
    // OPERATIONS:
    // INVERT, ARITH, PASS
    // FLAGS:
    // COUT, OF
    static ALU16(a, b, cin, invert, arith, pass) {
        const notNeg = this.notNeg(a, invert, arith);
        return this.andAdd(notNeg.y, b, cin, arith, pass);
    }

    // Figure B.5.9
    static singleBitAluAddAndOrNor(a, b, cin, aInvert, bInvert, operation) {
        a = this.mux(
            a, 
            this.not(a),
            aInvert
        );
        b = this.mux(
            b, 
            this.not(b),
            bInvert
        );
        const adder = this.fullAdder(a, b, cin);

        const operation1 = this.and(a, b);
        const operation2 = this.or(a, b);
        const operation3 = adder.sum;

        const result = this.mux(operation1, operation2, operation3, operation);
        return {
            result: result,
            cout: adder.cout
        };
    }

    // opcodes:
    // 00 → and
    // 01 → or
    // 10 → add
    // 11 → lt
    // Figure B.5.10 (top)
    static singleBitAlu(a, b, less, cin, aInvert, bInvert, operation) {
        a = this.mux(
            a, 
            this.not(a),
            aInvert
        );
        b = this.mux(
            b, 
            this.not(b),
            bInvert
        );
        const adder = this.fullAdder(a, b, cin);
        const sum = adder.sum;

        const operation1 = this.and(a, b);
        const operation2 = this.or(a, b);
        const operation3 = sum;
        const operation4 = less;

        const result = this.mux(operation1, operation2, operation3, operation4, operation);
        return {
            result: result,
            cout: adder.cout
        };
    }

    // Figure B.5.10 (bottom)
    static bottomSingleBitAlu(a, b, less, cin, aInvert, bInvert, operation) {
        a = this.mux(
            a, 
            this.not(a),
            aInvert
        );
        b = this.mux(
            b, 
            this.not(b),
            bInvert
        );
        const adder = this.fullAdder(a, b, cin);
        const sum = adder.sum;
        const cout = adder.cout;

        const operation1 = this.and(a, b);
        const operation2 = this.or(a, b);
        const operation3 = sum;
        const operation4 = less;

        const result = this.mux(operation1, operation2, operation3, operation4, operation);
        const set = sum;
        const overflow = this.overflowDetect(cin, cout);
        return {
            result: result,
            set: set,
            overflow: overflow
        };
    }

    // same as mips alu
    // flags: zero & OF
    static ALU32(a, b, opcode) {
        // 4 bit opcode = (1)aInvert (1)bNegate (2)operation
        const opcodes = this.split(opcode);
        const aInvert = opcodes[0];
        const bNegate = opcodes[1];
        const operation = this.merge(opcodes[2], opcodes[3]);

        let cin = bNegate;
        let result = '';
        let alu;
        // standard alu array
        for (let i = 31; i > 0; i--) {
            alu = this.singleBitAlu(a[i], b[i], '0', cin, aInvert, bNegate, operation);
            cin = alu.cout;
            result = alu.result + result;
        }
        // bottom alu
        alu = this.bottomSingleBitAlu(a[0], b[0], '0', cin, aInvert, bNegate, operation);
        result = alu.result + result;

        // update first alu with bottom alu's set on slt
        let lsb = result[31];
        lsb = this.mux(lsb, lsb, lsb, alu.set, operation);
        result = StringReader.replaceAt(result, lsb, 31);

        return {
            result: result,
            overflow: alu.overflow,
            zero: this.zero(result)
        };
    }
    
    static addALU32(a, b) {
        let result = '';
        let cin;
        cin = '0';
        for (let i = 31; i >= 0; i--) {
            const adder = this.fullAdder(a[i], b[i], cin);
            cin = adder.cout;
            result = adder.sum + result;
        }
        return result;
    }

    static addALU(a, b) {
        if (a.length !== b.length) {
            throw "let's keep the lengths consistent pls";
        }
        let result = '';
        let cin;
        cin = '0';
        for (let i = a.length - 1; i >= 0; i--) {
            const adder = this.fullAdder(a[i], b[i], cin);
            cin = adder.cout;
            result = adder.sum + result;
        }
        return result;
    }

    static addALUWithFlags(a, b) {
        if (a.length !== b.length) {
            throw "let's keep the lengths consistent pls";
        }
        let result = '';
        let cry, zero, overflow;
        cry = '0';
        zero = '1';
        overflow = '0';
        for (let i = a.length - 1; i >= 0; i--) {
            const adder = this.fullAdder(a[i], b[i], cry);
            if (i === 0) {
                overflow = this.xor(
                    cry,
                    adder.cout
                );
            }
            cry = adder.cout;
            const sum = adder.sum;
            result = sum + result;
            zero = this.nor(
                LogicGate.not(zero),
                sum
            );
        }
        return {
            result,
            zero,
            overflow,
            cry
        };
    } 

    static shiftLeft(bitstring, control) {
        // lsb
        let shifted = this.or(
            this.and('0', control),
            this.and(bitstring[bitstring.length - 1], this.not(control))
        );
        for (let i = bitstring.length - 1; i >= 1; i--) {
            shifted = this.or(
                this.and(bitstring[i], control),
                this.and(bitstring[i - 1], this.not(control))
            ) + shifted;
        }
        return shifted;
    }

    static shiftLeftTwo(bitstring, control) {
        return this.shiftLeft(
            this.shiftLeft(
                bitstring, 
                control
            ),
            control
        );
    }

    static shiftRight(bitstring, numpositions=1) {
        return this.bitstringToPrecision(
            this.split(bitstring, bitstring.length - numpositions)[0],
            bitstring.length
        )
    }

    static shiftRightTwo(bitstring) {
        return this.shiftRight(
            this.shiftRight(
                bitstring
            )
        )
    }


    static shiftLeftExtend(bitstring) {
        // lsb
        let shifted = '0';
        for (let i = bitstring.length - 1; i >= 0; i--) {
            shifted = bitstring[i] + shifted;
        }
        return shifted;
    }

    static shiftLeftExtendTwo(bitstring) {
        return this.shiftLeftExtend(
            this.shiftLeftExtend(
                bitstring
            )
        );
    }

    // for undoing sll+xtnd
    static shiftRightReduce(bitstring) {
        return this.split(bitstring, bitstring.length - 1, 1)[0];
    }
    static shiftRightReduceTwo(bitstring) {
        return this.shiftRightReduce(
            this.shiftRightReduce(
                bitstring
            )
        );
    }

    static encodeJAddr(jAddr32) {
        if (jAddr32.length !== 32) {
            throw 'wrong length dummy. maybe you wanna use decode?';
        }
        return this.split(
            jAddr32,
            4,      // remove first 4 bits
            26,     // result
            2       // remove last 2 bits
        )[1];
    }

    static decodeJAddr(jAddr26) {
        if (jAddr26.length !== 26) {
            throw 'wrong length dummy. maybe you wanna use encode?';
        }
        // 28 bits
        const jAddrTail = LogicGate.shiftLeftExtendTwo(jAddr26);
        // 4 bits
        const jAddrHead = LogicGate.split(pipeline.pc, 4)[0];
        // 32 bits
        return LogicGate.merge(
            jAddrHead,
            jAddrTail
        );
    }

    static encodeBAddr(bAddr32, pcAddr) {
        if (bAddr32.length !== 32) {
            throw 'wrong length dummy. maybe you wanna use decode?';
        }
        // ( BA - PC - 4 ) ÷ 4
        // (16 bits)
        return this.bitstringToPrecision(
            this.shiftRightTwo(    // ÷ 4
                this.addALU32(    // BA - PC - 4
                    this.addALU32(
                        bAddr32,    
                        this.twosComplement(    // - PC
                            pcAddr
                        ),
                    ),
                    '11111111111111111111111111111100'   // -4
                )
            ),
            16      // 16 bits
        );
    }

    static decodeBAddr(bAddr16, pcAddr) {
        if (bAddr16.length !== 16) {
            throw 'wrong length dummy. maybe you wanna use decode?';
        }
        // BA × 4
        const bAddrTimesFour = this.shiftLeftTwo(bAddr16, '1');
        const bAddr32 = this.merge(
            '0000000000000000',
            bAddrTimesFour
        );
        // PC + 4
        const pcPlusFour = this.addALU32(
            pcAddr,
            '00000000000000000000000000000100'  // 4
        );
        // (BA × 4) + PC + 4
        return this.addALU32(bAddr32, pcPlusFour);
    }

    static decodeBAddrIncrementedPc(bAddr16, pcPlusFour) {
        if (bAddr16.length !== 16) {
            throw 'wrong length dummy. maybe you wanna use decode?';
        }
        // BA × 4
        const bAddrTimesFour = this.shiftLeftTwo(bAddr16, '1');
        const bAddr32 = this.merge(
            '0000000000000000',
            bAddrTimesFour
        );
        // (BA × 4) + PC + 4
        return this.addALU32(bAddr32, pcPlusFour);
    }

    static barrelShift(bitstring, shamt, right) {
        return this.mux(
            this.barrelShiftLeft(bitstring, shamt),
            this.barrelShiftRight(bitstring, shamt),
            right
        );
    }

    static barrelShiftLeft(bitstring, shamt) {
        let columnOutput = this.split(bitstring);
        for (let i = shamt.length - 1; i >= 0; i--) {
            let columnInput = columnOutput;
            columnOutput = new Array(bitstring.length)
            const shiftBit = shamt[i];
            const currentShamt = 2**(shamt.length - 1 - i);
            for (let j = bitstring.length - 1; j >= 0; j--) {
                const muxLow = columnInput[j];
                const muxHigh = (j >= bitstring.length - currentShamt) ? '0' : columnInput[j + currentShamt];
                columnOutput[j] = this.mux(muxLow, muxHigh, shiftBit);
            }
        }
        return this.merge(columnOutput);
    }

    static barrelShiftRight(bitstring, shamt) {
        let columnOutput = this.split(bitstring);
        for (let i = shamt.length - 1; i >= 0; i--) {
            let columnInput = columnOutput;
            columnOutput = new Array(bitstring.length)
            const shiftBit = shamt[i];
            const currentShamt = 2**(shamt.length - 1 - i);
            for (let j = 0; j < bitstring.length; j++) {
                const muxLow = columnInput[j];
                const muxHigh = (j < currentShamt) ? '0' : columnInput[j - currentShamt];
                columnOutput[j] = this.mux(muxLow, muxHigh, shiftBit);
            }
        }
        return this.merge(columnOutput);
    }

    static overflowDetect(cin, cout) {
        return this.xor(cin, cout);
    }

    static twosComplement(bitstring, enable='1') {
        return this.add(
            this.mux(
                bitstring,
                this.not(bitstring),
                enable
            ),
            this.merge(
                this.empty(bitstring.length - 1),
                enable
            )
        )
    }

    static undoTwosComplement(bitstring) {
        return this.not(
                this.sub(
                bitstring,
                '1'
            )
        );
    }

    static bitstringToPrecision(bitstring, precision) {
        if (bitstring.length > precision) {
            bitstring = bitstring.substring(bitstring.length - precision);
        }
        while (bitstring.length < precision) {
            bitstring = '0' + bitstring;
        }
        return bitstring;
    }

    static signedBitstringToPrecision(bitstring, precision) {
        const sign = this.sign(bitstring);
        if (bitstring.length > precision) {
            bitstring = sign + bitstring.substring(bitstring.length - precision + 1);
        }
        while (bitstring.length < precision) {
            bitstring = sign + bitstring;
        }
        return bitstring;
    }

    static shiftLeftToPrecision(bitstring, precision) {
        if (bitstring.length > precision) {
            bitstring = bitstring.substring(bitstring.length - precision);
        }
        while (bitstring.length < precision) {
            bitstring += '0';
        }
        return bitstring;
    }

    static empty(numbits) {
        return this.bitstringToPrecision('', numbits);
    }

    static toIEEE754Float(num) {
        let bitstring = this.toBitstring(num);
        throw 'nah havent made this lolz';
    }

    static parseIEEE754Float(reg) {
        throw 'nah havent made this lolz';
    }
    
    /*=====  End of Binary  ======*/

    static simplifyTruthTable(data) {
        const DC = 'x';
        const HIGH = '1';
        const LOW = '0';
        const inputs = new Array(data.length);
        const outputs = new Array(data.length);
        const inputLen = data[0].input.length;
        const outputLen = data[0].output.length;
        for (let d = 0; d < data.length; d++) {
            inputs[d] = data[d].input;
            outputs[d] = data[d].output;
        }
        for (let o = 0; o < outputLen; o++) {
            let set = [];
            let not = [];
            for (let i = 0; i < inputs.length; i++) {
                // 1 or x
                if (outputs[i][o] !== '0') {
                    set.push(inputs[i]);
                } else {
                    not.push(inputs[i]);
                }
            }
            for (let i = 0; i < set.length; i++) {
                let input = inputs[i];
                for (let j = 0; j < inputLen; j++) {
                    for (let k = 0; k < inputs.length; k++) {
                        console.log('hi ', inputs[k][i], input[j]);
                        if (k === i) {
                            break;
                        }
                        if (input[j] === inputs[k][j]) {
                            break;
                        }
                        if (input[j] === DC || input.slice(0, j) === inputs[k].slice(0, j) &&
                            input.slice(j) === inputs[k].slice(j)) {
                                input = StringReader.replaceAt(input, 'x', j);
                                inputs[i] = input;
                                inputs[k] = input;
                        }
                    }
                }
            }
            for (let i = 0; i < not.length; i++) {
                let input = inputs[i];
                for (let j = 0; j < inputLen; j++) {
                    for (let k = 0; k < inputs.length; k++) {
                        if (k === i) {
                            break;
                        }
                        if (input[j] === inputs[k][j]) {
                            break;
                        }
                        if (input[j] === DC || input.substring(0, j) === inputs[k].substring(0, j) &&
                            input.substring(j + 1) === inputs[k].substring(j + 1)) {
                                input = StringReader.replaceAt(input, 'x', j);
                                inputs[i] = input;
                                inputs[k] = input;
                        }
                    }
                }
            }
        }
        console.log(inputs);
    }

    static simplifyInput(inputs, outputs) {
        const length = inputs.length;
        if (outputs.length !== length) {
            throw 'number of inputs does not match number of outputs';
        }
        let set = [];
        let not = [];
        for (let i = 0; i < length; i++) {
            if (this.bitToBool(outputs[i])) {
                set.push(inputs[i]);
            } else {
                not.push(inputs[i]);
            }
        }
        for (let i = 0; i < set.length; i++) {
            if (this.bitToBool(set[i])) {
                set.push(inputs[i]);
            }
        }
    }

}
