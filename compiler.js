
class Compiler {

    static NEWLINE = '\n';
    static REGISTER = '$';
    static COMMENT = '#';
    static BRANCH_START = '<BRANCH>';
    static BRANCH_END = '</BRANCH>';
    static JUMP_START = '<JUMP>';
    static JUMP_END = '</JUMP>';
    static ASSEMBLER_TEMPORARY = '$at';

    constructor(code) {
        this.code = code;
        this.compiling = this.code;
        this.instructions = [];
        this.compileCode();
        this._data = [];
        this._labels = [];
    }

    static createInstructions(code) {
        const compiler = new this(code);
        return compiler.instructions;
    }

    // return array of instructions
    compileCode() {
        this.compiling = this.code;

        this.removeComments();
        while (this.compiling.length) {
            this.compiling.trim();
            this.compileNext(this.compiling);
        }
        this.compiling = this.compileLabels(this.compiling);
        this.compiling = this.compiling;
    }

    compileLabels() {

    }

    // returns machine code for next instruction AND returns uncompiled code after next instruction
    compileNext() {
        const instructionName = StringReader.firstWord(this.compiling);
        const instructionInfo = this.getInstruction(instructionName);
        if (!instructionInfo) {
            throw 'Invalid instruction ' + instructionName;
        }
        if (instructionInfo.pseudo) {
            return this.compilePseudo(instructionInfo);
        }
        if (instructionInfo.label) {
            return this.compileLabel(instructionInfo);
        }
        switch (instructionInfo.type) {
            case 'r':
                return this.compileR(instructionInfo);
            case 'i':
                return this.compileI(instructionInfo);
            case 'j':
                return this.compileJ(instructionInfo);
        }
    }

    compilePseudo(instructionInfo) {
        /*
            move
            blt
            ble
            bgt
            bge
            li
        */
        switch (instructionInfo.name) {
            
        }
    }

    // pseudoBranch()

    compileLabel(instructionInfo) {
        /*
            b
            beq
            bne
            blt
            ble
            bgt
            bge
            j
            jal
        */
        switch (instructionInfo.type) {
            // branch
            case 'i':
                return;
            // jump
            case 'j':
                return;
        }
    }

    compileR(instructionInfo) {
        const opcode = '000000';
        let rs = instructionInfo.rs;
        let rt = instructionInfo.rt;
        let rd = instructionInfo.rd;
        let shamt = instructionInfo.shamt;
        let funct = instructionInfo.funct;

        if (!rd) {
            this.compiling = StringReader.substringAfter(this.compiling, '$');
            rd = StringReader.firstWord(this.compiling);
            this.compiling = StringReader.substringAfter(this.compiling, rd);
            rd = rd.replace(',', '');
        }
        rd = this.getRegisterBinary(rd);
        if (!rs) {
            this.compiling = StringReader.substringAfter(this.compiling, '$');
            rs = StringReader.firstWord(this.compiling);
            this.compiling = StringReader.substringAfter(this.compiling, rs);
            rs = rs.replace(',', '');
        }
        rs = this.getRegisterBinary(rs);

        if (!rt) {
            this.compiling = StringReader.substringAfter(this.compiling, '$');
            rt = StringReader.firstWord(this.compiling);
            this.compiling = StringReader.substringAfter(this.compiling, rt);
        }
        rt = this.getRegisterBinary(rt);

        if (!shamt) {
            shamt = StringReader.firstWord(this.compiling);
            this.compiling = StringReader.substringAfter(this.compiling, shamt);
        }
        shamt = this.getShamtBinary(shamt);

        funct = this.getFunctBinary(funct);

        if (this.compiling.includes(this.NEWLINE)) {
            this.compiling = StringReader.substringAfter(this.compiling, this.NEWLINE);
        } else {
            this.compiling = '';
        }

        const instruction = LogicGate.merge(
            opcode,
            rs,
            rt,
            rd,
            shamt,
            funct
        );

        this.instructions.push(instruction);
    }

    compileI(instructionInfo) {
        const opcode = this.getOpcodeBinary(instructionInfo.opcode);
        let rs = instructionInfo.rs;
        let rt = instructionInfo.rt;
        let immediate = instructionInfo.immediate;

        switch (instructionInfo.iFormat) {
            // rs, imm(rt)
            case 'offset':
                return this.compileIOffset(opcode, rs, rt, immediate);
            // rt, rs, imm
            case 'value':
                return this.compileIValue(opcode, rs, rt, immediate);
        }

    }

    // rs, imm(rt)
    compileIOffset(opcode, rs, rt, immediate) {

        if (!rt) {
            this.compiling = StringReader.substringAfter(this.compiling, '$');
            rt = StringReader.firstWord(this.compiling);
            this.compiling = StringReader.substringAfter(this.compiling, rt);
            rt = rt.replace(',', '');
        }
        rt = this.getRegisterBinary(rt);

        if (!immediate) {
            immediate = StringReader.substringBefore(this.compiling, '(');
            immediate = immediate.replace(' ', '');
        }
        immediate = this.getImmediateBinary(immediate);

        if (!rs) {
            this.compiling = StringReader.substringAfter(this.compiling, '$');
            rs = StringReader.firstWord(this.compiling);
            rs = StringReader.substringBefore(rs, ')');
            this.compiling = StringReader.substringAfter(this.compiling, ')');
            rs = rs.replace(',', '');
        }
        rs = this.getRegisterBinary(rs);

        if (this.compiling.includes(this.NEWLINE)) {
            this.compiling = StringReader.substringAfter(this.compiling, this.NEWLINE);
        } else {
            this.compiling = '';
        }

        const instruction = LogicGate.merge(
            opcode,
            rs,
            rt,
            immediate
        );
            
        this.instructions.push(instruction);
    }

    // rt, rs, imm
    compileIValue(opcode, rs, rt, immediate) {

        if (!rt) {
            this.compiling = StringReader.substringAfter(this.compiling, '$');
            rt = StringReader.firstWord(this.compiling);
            this.compiling = StringReader.substringAfter(this.compiling, rt);
            rt = rt.replace(',', '');
        }
        rt = this.getRegisterBinary(rt);

        if (!rs) {
            this.compiling = StringReader.substringAfter(this.compiling, '$');
            rs = StringReader.firstWord(this.compiling);
            this.compiling = StringReader.substringAfter(this.compiling, rs);
            rs = rs.replace(',', '');
        }
        rs = this.getRegisterBinary(rs);

        if (!immediate) {
            immediate = StringReader.firstWord(this.compiling, this.compiling);
            this.compiling = StringReader.substringAfter(this.compiling, immediate);
        }
        immediate = this.getImmediateBinary(immediate);

        if (this.compiling.includes(this.NEWLINE)) {
            this.compiling = StringReader.substringAfter(this.compiling, this.NEWLINE);
        } else {
            this.compiling = '';
        }

        const instruction = LogicGate.merge(
            opcode,
            rs,
            rt,
            immediate
        );

        this.instructions.push(instruction);
    }

    compileJ(instruction) {

    }

    removeComments() {
        this.COMMENT
        while (this.compiling.includes(this.COMMENT) && this.compiling.includes(this.NEWLINE)) {
            this.compiling = StringReader.replaceFrom(
                this.compiling,
                this.NEWLINE,
                this.COMMENT,
                this.NEWLINE
            );
        }
        if (this.compiling.includes(this.COMMENT)) {
            this.compiling = StringReader.substringBefore(this.compiling, this.COMMENT);
        }
        return this.compiling;
    }

    removeWhiteSpace() {
        return this.compiling.trim();
    }

    goToNextLine() {
        this.compiling = StringReader.substringAfter(this.compiling, this.NEWLINE);
    }

    getInstruction(name) {
        for (let i = 0; i < INSTRUCTION_DATA.length; i++) {
            if (INSTRUCTION_DATA[i].name === name) {
                return INSTRUCTION_DATA[i];
            }
        }
    }

    getRegisterBinary(register) {
        register = register.replace(this.REGISTER, '');
        // register input as identifier (e.g. $a0)
        if (!StringReader.isNumericString(register[0])) {
            register = registers.indexOf(register);
        }
        if (!register) {
            throw 'bad register ' + register
        }
        return LogicGate.bitstringToPrecision(
            this.getBinary(register),
            5
        );
    }

    getBinary(num) {
        return LogicGate.toBitstring(
            Number.parseInt(num)
        );
    }

    getShamtBinary(shamt) {
        return LogicGate.bitstringToPrecision(
            this.getBinary(shamt),
            5
        );
    }

    getFunctBinary(funct) {
        return LogicGate.bitstringToPrecision(
            this.getBinary(funct),
            6
        );
    }

    getOpcodeBinary(opcode) {
        return LogicGate.bitstringToPrecision(
            this.getBinary(opcode),
            6
        );
    }

    getImmediateBinary(immediate) {
        return LogicGate.bitstringToPrecision(
            this.getBinary(immediate),
            16
        );
    }
}