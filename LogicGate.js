class LogicGate {

    /*=============================================
    =                   Binary                    =
    =============================================*/

    static testGate(gate, numInputs, resultReturn=console.log) {
        const iterations = 2**numInputs;
        for (let i = 0; i < iterations; i++) {
            const bitstring = this.bitstringToPrecision(
                this.toBitString(i),
                numInputs
            );
            const bits = this.split(bitstring)
            resultReturn(gate(bits));
        }
    }

    static bitstringToDecimal(bitstring) {
        return Wath.parseFloat(bitstring, 2);
    }
    
    static toBitString(num) {
        return num.toString(2);
    }

    static toHexString(num) {
        return num.toString(16);
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

    static bitGt(bit1, bit2) {
        return this.and(
            bit1,
            this.not(bit2)
        );
    }

    // >
    static gt(bitstring1, bitstring2) {
        const lengthStandardizedBitStrings = this.standardizeBitStringLengths(bitstring1, bitstring2);
        bitstring1 = lengthStandardizedBitStrings[0];
        bitstring2 = lengthStandardizedBitStrings[1];
        const length = bitstring1.length;
        for (let i = 0; i < length; i++) {
            if (this.bitToBool(
                this.bitGt(
                    bitstring1[i],
                    bitstring2[i]))) {
                        return '1';
            }
            else if (this.bitToBool(
                this.bitLt(
                    bitstring1[i],
                    bitstring2[i]))) {
                        return '0';
            }
        }
        return '0'
    }

    // ≥
    static geq(bitstring1, bitstring2) {
        const lengthStandardizedBitStrings = this.standardizeBitStringLengths(bitstring1, bitstring2);
        bitstring1 = lengthStandardizedBitStrings[0];
        bitstring2 = lengthStandardizedBitStrings[1];
        const length = bitstring1.length;
        for (let i = 0; i < length; i++) {
            if (this.bitToBool(
                this.bitGt(
                    bitstring1[i],
                    bitstring2[i]))) {
                        return '1';
            }
            else if (this.bitToBool(
                this.bitLt(
                    bitstring1[i],
                    bitstring2[i]))) {
                        return '0';
            }
        }
        return '1'
    }

    static bitLt(bit1, bit2) {
        return this.and(
            bit2,
            this.not(bit1)
        );
    }

    // <
    static lt() {

    }

    static bitLeq(bit1, bit2) {
        return this.nand(
            bit1,
            this.not(bit2)
        );
    }

    // ≤
    static leq() {

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
        bitstrings = this.standardizeBitStringLengths(bitstrings);
        let bitstring = bitstrings[0];
        for (let i = 1; i < bitstrings.length; i++) {
            if (this.bitToBool(this.not(this.twoInputEq(bitstring, bitstrings[i])))) {
                return '0';
            }
        }
        return '1';
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
        return this.not(this.or(bits));
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
            let bitstring = '';
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
            this.toBitString(2**positions));
        return this.bitstringToPrecision(shifted, length);
    }

    static div(bitstring1, bitstring2) {
        return this.toBitString(
            this.bitstringToDecimal(bitstring1) /
            this.bitstringToDecimal(bitstring2)
        );
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

    static bitstringToPrecision(bitstring, precision) {
        if (bitstring.length > precision) {
            bitstring = bitstring.substring(bitstring.length - precision);
        }
        while (bitstring.length < precision) {
            bitstring = '0' + bitstring;
        }
        return bitstring;
    }

    static empty(numbits) {
        return this.bitstringToPrecision('', numbits);
    }

    static toIEEE754Float(num) {
        let bitstring = this.toBitString(num);
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
