
/*
    please do not look too deep into this code
    I was my own worst enemy here
                    ... I might be a bad programmer
*/

class Compiler {

    NEWLINE = '\n';
    COMMENT = '#';
    ASSEMBLER_ASSIGNMENT = ':';
    BRANCH_START = '<BRANCH>';
    BRANCH_END = '</BRANCH>';
    JUMP_START = '<JUMP>';
    JUMP_END = '</JUMP>';
    ASSEMBLER_TEMPORARY = '$at';
    ZERO = '$zero';
    GLOBAL_POINTER = '$gp';
    GLOBAL_POINTER_ADDRESS = '0x10008000';
    GP_OFFSET = -1 * 2 ** 15;  // 0x8000


    constructor(code) {
        this.code = code;
        this.compiling = this.code;
        this.instructions = [];
        this._data = [];
        this._labels = [];

        this.compileCode();
    }

    static createInstructions(code) {
        const compiler = new this(code);
        return compiler.instructions;
    }

    // return array of instructions
    compileCode() {
        this.compiling = this.code;
        this.instructions = [];

        this.removeComments();

        // between .data (if exists) & .text
        this.compileData();

        // jump past .text
        this.goToText();

        // .globl ...
        this.goPastGlobalDeclarations();

        // main: (or other main function name)
        this.compileMain();

        // replace jump / branch labels
        this.assignLabels();
    }

    compileData() {

        // .data ...
        if (!this.compiling.includes('.data')) {
            return;
        }
        this.goPastDataIdentifier();
        while (this.hasDataDeclarationNext()) {
            this.compileNextDataDeclaration();
        }
    }

    hasDataDeclarationNext() {
        // name: .type value
        // value:
        // number, "string", c, s, v
        let checking = this.compiling;
        let next;

        // name
        next = StringReader.firstWord(checking);
        if (next.includes(':')) {
            next = StringReader.substringBefore(next, ':');
        }
        let name = next;
        checking = StringReader.substringAfter(checking, name);

        // :
        next = StringReader.firstWord(checking);
        if (next[0] !== ':') {
            return false;
        }
        checking = StringReader.substringAfter(checking, next[0]);

        // .type
        next = StringReader.firstWord(checking);
        let type = next;
        if (type[0] !== '.') {
            return false;
        }
        type = StringReader.substringAfter(type, '.');

        return this.isValidDataType(type);
    }

    isValidDataType(type) {
        type = type.toLowerCase();
        switch (type) {
            case 'asciiz':
            case 'ascii':
            case 'word':
            case 'byte':
            case 'half':
                return true;
        }
        return false;
    }

    compileNextDataDeclaration() {
        // name: .type value
        // value:
        // number, "string", c, s, v

        // name: .type value remaining
        let name;
        let type = null;
        name = this.nextWord();
        if (name.includes(':')) {
            name = StringReader.substringBefore(name, ':');
        }
        this.goPast(name);
        this.goPastColon();

        type = this.compileNextWord();
        type = StringReader.substringAfter(type, '.');
        type = type.toLowerCase();

        const values = this.compileValues(name, type);

        this.pushData(values);
    }

    pushData(data) {
        if (!Array.isArray(data)) {
            data = [data];
        }
        data.forEach(dataPoint => {
            this._data.push(dataPoint);
        });
        this.pushDataToInstructions(data);
    }

    pushDataToInstructions(data) {
        const offsetIndex = this.indexOfDataPoint(data[0].name);
        data.forEach((dataPoint, index) => {
            const value = dataPoint.value;
            // li   $at, value
            this.pushLiInstruction(
                this.registerStringToBinary(this.ASSEMBLER_TEMPORARY),
                value
            );
            // sw   $at, offset($gp)
            this.pushInstruction(
                this.dynamicMakeInstruction({
                    name: 'sw',
                    rt: '$at',
                    rs: '$gp',
                    immediate: this.getDataOffset(index + offsetIndex)
                })
            );
        });
    }

    getDataOffset(index) {
        return this.GP_OFFSET + 4 * index;
    }

    pushLiInstruction(reg, value) {
        const split = LogicGate.split(value, 16, 16);
        const upper = split[0];
        const lower = split[1];
        // lui  reg, value[31-16]
        this.pushLuiInstruction(reg, upper);
        // ori  reg, reg, value[15-0]
        this.pushInstruction(
            this.dynamicMakeInstruction({
                name: 'ori',
                rt: reg,
                rs: reg,
                immediate: lower
            })
        );
    }

    pushSyscallInstruction() {
        // pre-bubbles
        this.pushNopInstruction();
        this.pushNopInstruction();
        // syscall
        this.pushInstruction(
            this.dynamicMakeInstruction({
                name: 'syscall'
            })
        );
        // post-bubble
        this.pushNopInstruction();
    }

    pushLuiInstruction(rt, upper) {
        this.pushInstruction(
            this.dynamicMakeInstruction({
                name: 'lui',
                rt: rt,
                immediate: upper
            })
        );
    }

    pushLaInstruction(rt, label) {
        const index = this.indexOfDataPoint(label);
        // la   $rt, LABEL
        // lw   $rt, offset($gp)
        let offset = this.getDataOffset(index);

        // rt = $gp + offset
        this.pushAddiInstruction(
            rt,
            '$gp',
            offset
        );
    }

    pushNopInstruction() {
        this.pushInstruction(
            this.dynamicMakeInstruction({
                name: 'nop'
            })
        );
    }

    pushAddiInstruction(rt, rs, immediate) {
        this.pushInstruction(
            this.dynamicMakeInstruction({
                name: 'addi',
                rt: rt,
                rs: rs,
                immediate: immediate
            })
        );
    }

    pushInstruction(instruction) {
        this.instructions.push(instruction);
    }

    pushInstructions(instructions) {
        if (!Array.isArray(instructions)) {
            instructions = [...arguments];
        }
        instructions.forEach(instruction => {
            this.pushInstruction(instruction);
        })
    }

    pushLabel(name, index = null) {
        if (index === null) {
            index = this.instructions.length
        }
        this._labels.push({
            name,
            index
        });
    }

    compileValues(name, type) {
        const QUOTE = '"';
        const COMMA = ',';
        const isString = type === 'asciiz' || type === 'ascii';
        const isNumeric = !isString;

        let values = [];

        let loopAgain = false;

        // push value(s) and compile past value (remaining is , nextValue... or ... )
        do {

            let nextValueStr;

            if (isString) {
                nextValueStr = StringReader.getQuotedString(this.compiling, QUOTE);
                let str = StringReader.fakeToRealSpecialCharacters(nextValueStr);
                let nextValues = LogicGate.fromAscii(str);
                nextValues.forEach(value => {
                    addValue(value);
                });
                // compile past quote
                nextValueStr += QUOTE;
            }
            // else
            if (isNumeric) {
                nextValueStr = this.nextWord();
                if (nextValueStr.includes(COMMA)) {
                    nextValueStr = StringReader.substringBefore(nextValueStr, COMMA);
                }
                if (!Number.isInteger(
                    Number.parseFloat(nextValueStr)
                )) {
                    this.throwUnexpected('integer');
                }
                // correct # of bits
                let numBits;
                if (type === 'byte') {
                    numBits = 8;
                } else if (type === 'half') {
                    numBits = 16;
                } else if (type === 'word') {
                    numBits = 32;
                }

                const gotBits = LogicGate.toSignedBitstring(nextValueStr).length;
                if (numBits < gotBits) {
                    this.throwUnexpected(type, gotBits + ' bits');
                }

                const num = this.numericStringToWord(nextValueStr);
                addValue(num);
            }

            this.compiling = StringReader.substringAfter(this.compiling, nextValueStr);

            if (this.nextWord()[0] === COMMA) {
                this.goPastComma();
                loopAgain = true;
            } else {
                loopAgain = false;
            }
        } while (loopAgain);

        return values;

        function addValue(value) {
            values.push({
                name: name,
                type: type,
                value: value,
                index: values.length
            });
        }
    }

    compileMain() {
        while (this.compiling.length) {
            this.compiling = this.compiling.trim();
            this.compileNextInstruction();
        }
    }

    goPastGlobalDeclarations() {
        let global = this.compileNextWord();
        const globalKeywords = [
            '.glob',
            '.globl',
            '.global'
        ];
        if (!StringReader.hasEqual(global, globalKeywords)) {
            this.throwUnexpected('.glob', global);
        }
        let main = this.compileNextWord();
        
        this.jumpTo(main);
    }

    assignLabels() {
        this._labels.forEach(label => {
            for (let i = 0; i < this.instructions.length; i++) {
                if (this.hasLabel(this.instructions[i])) {
                    if (this.getLabel(this.instructions[i]) === label.name) {
                        this.instructions[i] = this.replaceLabel(this.instructions[i], i, label.index);
                    }
                }
            }
        });
        // handle error : nonexistant function called
        for (let i = 0; i < this.instructions.length; i++) {
            if (this.hasLabel(this.instructions[i])) {
                this.throwUnexpected(
                    'valid function',
                    this.getLabel(this.instructions[i])
                )
            }
        }
    }

    getLabel(instruction) {
        // branch
        if (this.hasBranchLabel(instruction)) {
            return this.getBranchLabel(instruction);
        }
        // jump
        if (this.hasJumpLabel(instruction)) {
            return this.getJumpLabel(instruction);
        }
        this.throwUnexpected('Branch or Jump Instruction', instruction);
    }

    replaceLabel(instruction, fromIndex, gotoIndex) {
        const fromAddress = this.getInstructionAddress(
            LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(fromIndex * 4),
                32
            )
        );
        const gotoAddress = this.getInstructionAddress(
            LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(gotoIndex * 4),
                32
            )
        );
        // branch
        if (this.hasBranchLabel(instruction)) {
            const branchTo = LogicGate.encodeBAddr(gotoAddress, fromAddress);
            return StringReader.replaceFrom(instruction, branchTo, this.BRANCH_START, this.BRANCH_END);
        }
        // jump
        if (this.hasJumpLabel(instruction)) {
            const jumpTo = LogicGate.encodeJAddr(gotoAddress);
            return StringReader.replaceFrom(instruction, jumpTo, this.JUMP_START, this.JUMP_END);
        }
        this.throwUnexpected('Branch or Jump Label', instruction);
    }

    // returns machine code for next instruction AND returns uncompiled code after next instruction
    compileNextInstruction() {

        // label
        if ((!this.compiling.includes('\n') && this.compiling.includes(':')) ||
            StringReader.substringBefore(this.compiling, '\n').includes(':')) {
            this.compileFunction();
            return;
        }


        const instructionName = this.nextWord();
        const instructionInfo = this.getInstructionInfoFromName(instructionName);

        switch (instructionName) {
            // standard r
            // name $rd, $rs, $rt
            case 'add':
            case 'addu':
            case 'and':
            case 'nor':
            case 'or':
            case 'slt':
            case 'sub':
            case 'subu':
                this.compileStandardRType(instructionInfo);
                break;

            // shamt r
            // name $rd, $rt, shamt
            case 'sll':
            case 'srl':
                this.compileShamtRType(instructionInfo);
                break;

            // two reg
            // name $rd, $rs
            case 'move':
                this.compileTwoReg(instructionInfo);
                break;

            // one reg
            // name $rs
            case 'jr':
                this.compileOneReg(instructionInfo);
                break;

            // name LABEL
            // branch instruction
            case 'b':
            // jump instructions
            case 'j':
            case 'jal':
                this.compileNameLabel(instructionInfo);
                break;

            // name $rt, LABEL
            // load address instruction
            case 'la':
                this.compileLabelOneReg(instructionInfo);
                break;

            // name $rs, $rt, LABEL
            // branch instructions
            case 'bne':
            case 'beq':
            case 'bgt':
            case 'bge':
            case 'blt':
            case 'ble':
                this.compileLabelTwoReg(instructionInfo);
                break;


            // i type standard
            // name $rt, $rs, imm
            case 'addi':
            case 'andi':
            case 'ori':
            case 'slti':
                this.compileStandardIType(instructionInfo);
                break;

            // i type offset
            // name $rt, offset($rs)
            case 'lw':
            case 'sw':
                this.compileOffsetIType(instructionInfo);
                break;

            // immediate one reg
            // name $rt, imm
            case 'li':
            case 'lui':
                this.compileOneRegImmInstruction(instructionInfo);
                break;

            // no param/reg
            // name
            case 'syscall':
            case 'nop':
                this.compileNameOnlyInstruction(instructionInfo);
                break;
                

            default:
                this.throwUnsupportedInstruction(instructionName);

        }

    }

    compileFunction() {
        // FUNCT:
        let funct = this.compileNextWord();
        if (funct.includes(':')) {
            funct = StringReader.substringBefore(funct, ':');
        } else {
            this.goPastColon();
        }
        this.pushLabel(funct);
    }

    compileStandardRType(instructionInfo) {
        // name $rd, $rs, $rt
        const opcode = '000000';
        const shamt = this.numericStringToShamtBinary(instructionInfo.shamt);
        const funct = this.numericStringToFunctBinary(instructionInfo.funct);

        // name $rd, $rs, $rt remaining
        this.compiling = StringReader.substringAfter(this.compiling, instructionInfo.name);

        // $rd, $rs, $rt remaining

        // rd
        const rd = this.compileNextRegister();
        this.goPastComma();

        // $rs, $rt remaining

        // rs
        const rs = this.compileNextRegister();
        this.goPastComma();

        // $rt remaining

        // rt
        const rt = this.compileNextRegister();

        const instruction = LogicGate.merge(
            opcode,
            rs,
            rt,
            rd,
            shamt,
            funct
        );
        this.instructions.push(instruction);

        this.endLine();
    }

    compileShamtRType(instructionInfo) {
        // name $rd, $rt, shamt
        const opcode = '000000';
        const rs = this.numericStringToRegisterBinary(instructionInfo.rs);
        const funct = this.numericStringToFunctBinary(instructionInfo.funct);

        // name $rd, $rt, shamt remaining
        this.goPast(instructionInfo.name);

        // $rd, $rt, shamt remaining

        // rd
        const rd = this.compileNextRegister();
        this.goPastComma();

        // $rt, shamt remaining
        const rt = this.compileNextRegister();
        this.goPastComma();

        // shamt remaining
        const shamt = this.compileNextShamt();

        const instruction = LogicGate.merge(
            opcode,
            rs,
            rt,
            rd,
            shamt,
            funct
        );
        this.instructions.push(instruction);

        this.endLine();
    }

    compileTwoReg(instructionInfo) {
        // name $rd, $rs
        const opcode = '000000';
        const rt = this.numericStringToRegisterBinary(instructionInfo.rt);
        const shamt = this.numericStringToShamtBinary(instructionInfo.shamt);
        const funct = this.numericStringToFunctBinary(instructionInfo.funct);

        // name $rd, $rs remaining
        this.compiling = StringReader.substringAfter(this.compiling, instructionInfo.name);

        // $rd, $rs remaining

        // rd
        const rd = this.compileNextRegister();
        this.goPastComma();

        // $rs remaining
        const rs = this.compileNextRegister();

        const instruction = LogicGate.merge(
            opcode,
            rs,
            rt,
            rd,
            shamt,
            funct
        );
        this.instructions.push(instruction);

        this.endLine();
    }

    compileOneReg(instructionInfo) {
        // name $rs
        const opcode = '000000';
        const rt = this.numericStringToRegisterBinary(instructionInfo.rt);
        const rd = this.numericStringToRegisterBinary(instructionInfo.rd);
        const shamt = this.numericStringToShamtBinary(instructionInfo.shamt);
        const funct = this.numericStringToFunctBinary(instructionInfo.funct);

        // name $rs remaining
        this.compiling = StringReader.substringAfter(this.compiling, instructionInfo.name);

        // $rs remaining
        const rs = this.compileNextRegister();

        const instruction = LogicGate.merge(
            opcode,
            rs,
            rt,
            rd,
            shamt,
            funct
        );
        this.instructions.push(instruction);

        this.endLine();
    }

    compileNameLabel(instructionInfo) {
        // name LABEL

        const name = instructionInfo.name;

        this.compiling = StringReader.substringAfter(this.compiling, name);

        // LABEL remaining
        const label = this.compileNextWord();

        if (this.isSomeBranch(name)) {
            this.pushBranchInstruction(name, label);
        } else if (this.isJType(name)) {
            this.pushSomeJumpInstruction(instructionInfo, name, label);
        }

        this.endLine();
    }

    compileLabelOneReg(instructionInfo) {
        // name $rt, LABEL

        const name = instructionInfo.name;

        this.goPast(name);

        // $rt, LABEL remaining

        // rt
        const rt = this.compileNextRegister();
        this.goPastComma();

        // LABEL remaining
        const label = this.compileNextWord();

        if (name === 'la') {
            this.pushLaInstruction(rt, label);
        }

        this.endLine();
    }

    compileLabelTwoReg(instructionInfo) {
        // name $rs, $rt, LABEL

        const name = instructionInfo.name;

        this.goPast(name);

        // $rs, $rt, LABEL remaining

        // rs
        const rs = this.compileNextRegister();
        this.goPastComma();

        // rt
        const rt = this.compileNextRegister();
        this.goPastComma();

        // LABEL remaining
        const label = this.compileNextWord();

        if (this.isSomeBranch(name)) {
            this.pushSomeBranchInstruction(rs, rt, name, label);
        }
    }

    isSomeBranch(branch) {
        const branchInstructions = [
            'b',
            'beq',
            'bne',
            'blt',
            'bgt',
            'ble',
            'bge'
        ];
        return StringReader.hasEqual(branch, branchInstructions);
    }

    isJType(jump) {
        const jTypeInstructions = [
            'j',
            'jal'
        ];
        return StringReader.hasEqual(jump, jTypeInstructions);
    }

    makeJumpLabel(label) {
        return this.JUMP_START + label + this.JUMP_END;
    }

    makeBranchLabel(label) {
        return this.BRANCH_START + label + this.BRANCH_END;
    }

    decodeJumpInstruction(instruction) {
        if (!this.hasJumpLabel(instruction)) {
            this.throwUnexpected('Jump Instruction');
        }
        throw 'I think this is artifact from mark I and I dont think it works at all';
        let label = this.getJumpLabel(instruction);
        let jAddr = this.getFunctionAddress(label);
        return StringReader.replaceAt(instruction, jAddr, this.JUMP_START, this.JUMP_END);
    }

    getFunctionAddress(name) {
        for (let i = 0; i < this._labels.length; i++) {
            if (this._labels[i].name === name) {
                return this.getInstructionAddress(this._labels[i].index);
            }
        }
        this.throwUnexpected('function/label');
    }

    getInstructionAddress(offset) {
        return LogicGate.addNoResize(
            PC_START,
            offset
        );
    }

    // jr not included
    pushSomeJumpInstruction(instructionInfo, name, label) {
        this.pushInstruction(
            this.dynamicMakeInstruction({
                name: name,
                opcode: instructionInfo.opcode,
                jAddr: this.makeJumpLabel(label)
            })
        );
    }

    pushBranchInstruction(name, label) {
        // b    LABEL
        this.pushInstruction(
            this.dynamicMakeInstruction({
                name: name,
                immediate: this.makeBranchLabel(label)
            })
        );
    }

    pushBeqInstruction(rs, rt, label) {
        const opcode = this.numericStringToOpcodeBinary(
            this.getOpcodeFromName('beq')
        );
        const imm = this.makeBranchLabel(label);
        this.pushInstruction(
            LogicGate.merge(
                opcode,
                rs,
                rt,
                imm
            )
        );
    }

    pushBneInstruction(rs, rt, label) {
        const opcode = this.numericStringToOpcodeBinary(
            this.getOpcodeFromName('bne')
        );
        const imm = this.makeBranchLabel(label);
        this.pushInstruction(
            LogicGate.merge(
                opcode,
                rs,
                rt,
                imm
            )
        );
    }

    pushSltInstruction(rd, rs, rt) {
        const funct = this.numericStringToFunctBinary(
            this.getFunctFromName('slt')
        );
        this.pushInstruction(
            LogicGate.merge(
                '000000',   // r-type - 0 op
                rs,
                rt,
                rd,
                '00000',
                funct
            )
        );
    }

    pushSomeBranchInstruction(rs, rt, name, label) {

        switch (name) {
            case 'beq':
                this.pushBeqInstruction(
                    rs,
                    rt,
                    label
                );
                return;
            case 'bne':
                this.pushBneInstruction(
                    rs,
                    rt,
                    label
                );
                return;
            case 'bgt':
                // slt $at, rt, rs
                // bne $at, $zero, BRANCH
                this.pushSltInstruction(
                    this.registerStringToBinary(
                        this.ASSEMBLER_TEMPORARY
                    ),
                    rt,
                    rs
                );
                this.pushBneInstruction(
                    this.registerStringToBinary(
                        this.ASSEMBLER_TEMPORARY
                    ),
                    this.registerStringToBinary(
                        this.ZERO
                    ),
                    label
                );
                return;
            case 'bge':
                // slt $at, rs, rt
                // beq $at, $zero, BRANCH
                this.pushSltInstruction(
                    this.registerStringToBinary(
                        this.ASSEMBLER_TEMPORARY
                    ),
                    rs,
                    rt
                );
                this.pushBeqInstruction(
                    this.registerStringToBinary(
                        this.ASSEMBLER_TEMPORARY
                    ),
                    this.registerStringToBinary(
                        this.ZERO
                    ),
                    label
                );
                return;
            case 'blt':
                // slt $at, rs, rt
                // bne $at, $zero, BRANCH
                this.pushSltInstruction(
                    this.registerStringToBinary(
                        this.ASSEMBLER_TEMPORARY
                    ),
                    rs,
                    rt
                );
                this.pushBneInstruction(
                    this.registerStringToBinary(
                        this.ASSEMBLER_TEMPORARY
                    ),
                    this.registerStringToBinary(
                        this.ZERO
                    ),
                    label
                );
                return;
            case 'ble':
                // slt $at, rt, rs
                // beq $at, $zero, BRANCH
                this.pushSltInstruction(
                    this.registerStringToBinary(
                        this.ASSEMBLER_TEMPORARY
                    ),
                    rt,
                    rs
                );
                this.pushBeqInstruction(
                    this.registerStringToBinary(
                        this.ASSEMBLER_TEMPORARY
                    ),
                    this.registerStringToBinary(
                        this.ZERO
                    ),
                    label
                );
                return;
        }
    }

    compileStandardIType(instructionInfo) {
        // name $rt, $rs, imm
        const opcode = this.numericStringToOpcodeBinary(instructionInfo.opcode);

        // name $rt, $rs, imm remaining
        this.compiling = StringReader.substringAfter(this.compiling, instructionInfo.name);

        // $rt, $rs, imm remaining

        // rt
        const rt = this.compileNextRegister();
        this.goPastComma();

        // $rs, imm remaining
        const rs = this.compileNextRegister();
        this.goPastComma();

        // imm remaining
        const immediate = this.compileNextImmediate();

        const instruction = LogicGate.merge(
            opcode,
            rs,
            rt,
            immediate
        );
        this.instructions.push(instruction);

        this.endLine();
    }

    compileOffsetIType(instructionInfo) {
        // name $rt, offset($rs)
        const opcode = this.numericStringToOpcodeBinary(instructionInfo.opcode);

        // name $rt, offset($rs) remaining
        this.compiling = StringReader.substringAfter(this.compiling, instructionInfo.name);

        // $rt, offset($rs) remaining

        // rt
        const rt = this.compileNextRegister();
        this.goPastComma();

        // offset($rs) remaining

        // offset
        const offset = this.compileNextOffset();

        // ($rs) remaining
        const rs = this.compileNextOffsetRegister();

        const instruction = LogicGate.merge(
            opcode,
            rs,
            rt,
            offset
        );
        this.instructions.push(instruction);
        // assembler-level stalls
        if (instructionInfo.name === 'lw') {
            this.checkLwHazards();
        }
        this.endLine();
    }

    checkLwHazards() {
        // worst case: one bubble after
        this.pushNopInstruction();
    }

    compileOneRegImmInstruction(instructionInfo) {

        // name $rt, imm remaining
        const name = instructionInfo.name;

        this.goPast(name);

        // $rt, imm remaining

        // rt
        let rt = this.nextWord();
        if (rt.includes(',')) {
            rt = StringReader.substringBefore(rt, ',');
        }
        this.goPast(rt);
        this.goPastComma();

        // imm remaining
        let immediate = this.compileNextWord();
        if (name === 'li') {
            immediate = this.explicitSignToPreciseSignedBitstring(immediate, 32);
            this.pushLiInstruction(rt, immediate);
        } else if (name === 'lui') {
            immediate = this.explicitSignToPreciseSignedBitstring(immediate, 16);
            this.pushLuiInstruction(rt, immediate);
        }

        this.endLine();
    }

    compileNameOnlyInstruction(instructionInfo) {
        // name
        const instruction = this.instructionInfoToInstruction(instructionInfo);

        if (instructionInfo.name === 'syscall') {
            this.pushSyscallInstruction();
        } else {
            this.instructions.push(instruction);
        }

        this.endLine();
    }

    compileNextWord() {
        const next = this.nextWord();

        this.compiling = StringReader.substringAfter(this.compiling, next);

        return next;
    }

    compileNextRegister() {

        this.goPast('$');

        let reg = StringReader.firstWord(this.compiling);
        // remove comma (if included)
        reg = reg.replace(',', '');

        this.compiling = StringReader.substringAfter(this.compiling, reg);

        return this.registerStringToBinary(reg);
    }

    compileNextShamt() {
        return this.textConstantToUnsignedPrecision(
            this.compileNextWord(),
            5
        );
    }

    compileNextImmediate() {
        return LogicGate.signedBitstringToPrecision(
            LogicGate.toSignedBitstring(
                this.textConstantToNumber(
                    this.compileNextWord()
                )
            ),
            16
        );
    }

    compileNextOffset() {
        let offset = StringReader.firstWord(this.compiling);
        if (offset.includes('(')) {
            offset = StringReader.substringBefore(offset, '(');
        }
        this.goPast(offset);
        return this.numericStringToImmediateBinary(offset);
    }

    compileNextOffsetRegister() {
        this.goPastOpenParenthesis();

        this.goPast('$');

        let reg = StringReader.firstWord(this.compiling);
        // remove ) (if adjacent to reg)
        if (reg.includes(')')) {
            reg = StringReader.substringBefore(reg, ')');
        }

        this.goPast(reg);

        reg = this.registerStringToBinary(reg);

        this.goPastCloseParenthesis();

        return reg;
    }

    isValidRegister(register) {
        register = register.replace('$', '');
        // register input as identifier (e.g. $a0)
        if (!StringReader.isNumericString(register)) {
            register = registers.indexOf(register);
        }
        const MIN_REG = 0;
        const MAX_REG = 31;
        return Wath.betweenInclusive(register, MIN_REG, MAX_REG);
    }

    registerStringToBinary(register) {
        if (!this.isValidRegister(register)) {
            this.throwInvalidRegister(register);
        }

        register = register.replace('$', '');
        // register input as identifier (e.g. $a0)
        if (!StringReader.isNumericString(register)) {
            register = registers.indexOf(register);
        }

        return LogicGate.bitstringToPrecision(
            this.numericStringToBinary(register),
            5
        );
    }

    nextWord() {
        return StringReader.firstWord(this.compiling);
    }

    instructionInfoToInstruction(instructionInfo) {
        let instruction = '';

        // opcode
        if (instructionInfo.opcode) {
            instruction += this.numericStringToOpcodeBinary(instructionInfo.opcode);
        } else if (instructionInfo.type === 'r') {
            instruction += '000000';
        }

        // rs
        if (instructionInfo.rs) {
            instruction += this.numericStringToRegisterBinary(instructionInfo.rs);
        }

        // rt
        if (instructionInfo.rt) {
            instruction += this.numericStringToRegisterBinary(instructionInfo.rt);
        }

        // rd
        if (instructionInfo.rd) {
            instruction += this.numericStringToRegisterBinary(instructionInfo.rd);
        }

        // shamt
        if (instructionInfo.shamt) {
            instruction += this.numericStringToShamtBinary(instructionInfo.shamt);
        }

        // immediate
        if (instructionInfo.immediate) {
            instruction += this.numericStringToImmediateBinary(instructionInfo.immediate);
        }

        // jAddr
        if (instructionInfo.jAddr) {
            instruction += instructionInfo.jAddr;
        }

        // funct
        if (instructionInfo.funct) {
            instruction += this.numericStringToFunctBinary(instructionInfo.funct);
        }


        if (instruction.length !== 32) {
            if (!this.hasLabel(instruction)) {
                throw 'Invalid Instruction / Insufficient Information';
            }
        }
        return instruction;
    }

    dynamicMakeInstruction(neededInfo, instructionInfo = null) {
        const name = neededInfo.name;
        if (!instructionInfo) {
            instructionInfo = this.getInstructionInfoFromName(name);
        }

        let instruction = '';
        // opcode
        if (instructionInfo.opcode) {
            instruction += this.numericStringToOpcodeBinary(instructionInfo.opcode);
        } else if (instructionInfo.type === 'r') {
            instruction += '000000';
        } else if (neededInfo.opcode !== undefined) {
            instruction += this.dynamicToPrecision(neededInfo.opcode, 6);
        } else {
            this.throwUnexpected('opcode');
        }

        // rs
        if (instructionInfo.rs) {
            instruction += this.numericStringToRegisterBinary(instructionInfo.rs);
        } else if (neededInfo.rs !== undefined) {
            instruction += this.dynamicToRegisterBinary(neededInfo.rs);
        }

        // rt
        if (instructionInfo.rt) {
            instruction += this.numericStringToRegisterBinary(instructionInfo.rt);
        } else if (neededInfo.rt !== undefined) {
            instruction += this.dynamicToRegisterBinary(neededInfo.rt);
        }

        // rd
        if (instructionInfo.rd) {
            instruction += this.numericStringToRegisterBinary(instructionInfo.rd);
        } else if (neededInfo.rd !== undefined) {
            instruction += this.dynamicToRegisterBinary(neededInfo.rd);
        }

        // shamt
        if (instructionInfo.shamt) {
            instruction += this.numericStringToShamtBinary(instructionInfo.shamt);
        } else if (neededInfo.shamt !== undefined) {
            instruction += this.dynamicToPrecision(neededInfo.shamt, 5);
        }

        // funct
        if (instructionInfo.funct) {
            instruction += this.numericStringToFunctBinary(instructionInfo.funct);
        } else if (neededInfo.funct !== undefined) {
            instruction += this.dynamicToPrecision(neededInfo.funct, 6);
        }

        // immediate
        if (instructionInfo.immediate) {
            instruction += this.numericStringToImmediateBinary(instructionInfo.immediate);
        } else if (neededInfo.immediate !== undefined) {
            instruction += this.dynamicToImmediateBinary(neededInfo.immediate);
        }

        // jAddr
        if (instructionInfo.jAddr) {
            instruction += instructionInfo.jAddr;
        } else if (neededInfo.jAddr !== undefined) {
            instruction += this.dynamicToJumpAddressBinary(neededInfo.jAddr);
        }

        if (instruction.length !== 32) {
            if (!this.hasLabel(instruction)) {
                throw 'Invalid Instruction / Insufficient Information';
            }
        }
        return instruction;
    }

    dynamicToBitstring(value) {
        if (typeof value === 'number') {
            return LogicGate.toBitstring(value);
        }
        if (typeof value === 'string') {
            if (Wath.isHex(value)) {
                return this.numericStringToBinary(value);
            } else if (LogicGate.isBitstring(value)) {
                return value;
            } else {
                this.throwUnexpected('number or hex/bitstring', value);
            }
        }
    }

    dynamicToPrecision(value, precision) {
        return LogicGate.bitstringToPrecision(
            this.dynamicToBitstring(value),
            precision
        );
    }

    dynamicToSigned(value) {
        if (typeof value === 'number') {
            return LogicGate.toSignedBitstring(value);
        }
        if (typeof value === 'string') {
            if (Wath.isHex(value)) {
                return this.signedNumericStringToBinary(value);
            }
            if (value[0] === '-') {
                value = LogicGate.twosComplement(value.substring(1));
            }
            if (LogicGate.isBitstring(value)) {
                return value;
            }
        }
        this.throwUnexpected('number or hex/bitstring', value);
    }

    dynamicToSignedPrecision(value, precision) {
        return LogicGate.signedBitstringToPrecision(
            this.dynamicToSigned(value),
            precision
        );
    }

    // special case: reg name
    dynamicToRegisterBinary(reg) {
        // special case: reg name
        if (this.isValidRegister(reg)) {
            return this.registerStringToBinary(reg);
        }
        return this.dynamicToPrecision(reg, 5);
    }

    // special case: branch label
    dynamicToImmediateBinary(imm, signed = true) {
        // special case: branch label
        if (this.isBranchLabel(imm)) {
            return imm;
        }
        if (signed) {
            return this.dynamicToSignedPrecision(imm, 16);
        }
        return this.dynamicToPrecision(imm, 16);
    }

    // special case: jump label
    dynamicToJumpAddressBinary(jAddr) {
        // special case: branch label
        if (this.isJumpLabel(jAddr)) {
            return jAddr;
        }
        return this.dynamicToPrecision(jAddr, 5);
    }

    isJumpLabel(jLabel) {
        return (typeof jLabel === 'string') &&
            StringReader.isBetween(jLabel, this.JUMP_START, this.JUMP_END);
    }

    isBranchLabel(bLabel) {
        return (typeof bLabel === 'string') &&
            StringReader.isBetween(bLabel, this.BRANCH_START, this.BRANCH_END);
    }

    hasJumpLabel(instruction) {
        return instruction.includes(this.JUMP_START) &&
            this.isJumpLabel(
                StringReader.substring(instruction, this.JUMP_START)
            );
    }

    hasBranchLabel(instruction) {
        return instruction.includes(this.BRANCH_START) &&
            this.isBranchLabel(
                StringReader.substring(instruction, this.BRANCH_START)
            );
    }

    getJumpLabel(instruction) {
        if (!this.hasJumpLabel(instruction)) {
            this.throwUnexpected('jump label', instruction);
        }
        return StringReader.substringBetween(instruction, this.JUMP_START, this.JUMP_END);
    }

    getBranchLabel(instruction) {
        if (!this.hasBranchLabel(instruction)) {
            this.throwUnexpected('branch label', instruction);
        }
        return StringReader.substringBetween(instruction, this.BRANCH_START, this.BRANCH_END);
    }


    hasLabel(instruction) {
        return this.hasJumpLabel(instruction) ||
            this.hasBranchLabel(instruction);
    }

    rTypeInstruction(rd, rs, rt, funct, shamt = '00000') {
        const opcode = '000000';
        return LogicGate.merge(
            opcode,     // 6
            rs,         // 5
            rt,         // 5
            rd,         // 5
            shamt,      // 5
            funct       // 6
        );
    }

    iTypeInstruction(opcode, rs, rt, immediate) {
        return LogicGate.merge(
            opcode,     // 6
            rs,         // 5
            rt,         // 5
            immediate   // 16
        );
    }

    jTypeInstruction(opcode, jAddr) {
        return LogicGate.merge(
            opcode, // 6
            jAddr   // 26
        );
    }

    removeComments() {
        while (this.compiling.includes(this.COMMENT) && StringReader.substringAfter(this.compiling, this.COMMENT).includes(this.NEWLINE)) {
            this.compiling = StringReader.replaceFrom(
                this.compiling,
                this.NEWLINE,   // replace with \n
                this.COMMENT,   // from #
                this.NEWLINE    // to \n
            );
        }
        if (this.compiling.includes(this.COMMENT)) {
            this.compiling = StringReader.substringBefore(this.compiling, this.COMMENT);
        }
        return this.compiling;
    }

    endLine() {
        if (this.compiling.includes(this.NEWLINE)) {
            this.jumpToNextLine();
        } else {
            this.compiling = '';
        }
    }

    /*
     *  jump to : go to next instance of string (anywhere) (existance expected)
     */
    jumpTo(str) {
        if (!this.compiling.includes(str)) {
            this.throwUnexpected(str);
        }
        this.compiling = StringReader.substring(this.compiling, str);
    }

    jumpToNextLine() {
        this.jumpPast('\n');
    }

    goToText() {
        this.jumpPastTextIdentifier();
    }

    /*
     * jump past : jump past next instance of string (anywhere) (existance expected)
     */
    jumpPast(str) {
        if (!this.compiling.includes(str)) {
            this.throwUnexpected(str);
        }
        this.compiling = StringReader.substringAfter(this.compiling, str);
    }

    jumpPastTextIdentifier() {
        this.jumpPast('.text');
    }

    /*
     * gopast : go past immediately next string matching (whitespace dependent on method)
     */

    goPast(str) {
        const nextStr = StringReader.firstWord(this.compiling);
        if (nextStr.substring(0, str.length) !== str) {
            this.throwUnexpected(str);
        }
        this.compiling = StringReader.substringAfter(this.compiling, str);
        nextStr;
    }

    goPastComma() {
        this.goPast(',');
    }

    goPastOpenParenthesis() {
        this.goPast('(');
    }

    goPastCloseParenthesis() {
        this.goPast(')');
    }

    goPastColon() {
        this.goPast(':');
    }

    goPastDataIdentifier() {
        this.goPast('.data');
    }

    getInstructionInfoFromName(name) {
        for (let i = 0; i < INSTRUCTION_DATA.length; i++) {
            if (INSTRUCTION_DATA[i].name === name) {
                return INSTRUCTION_DATA[i];
            }
        }
    }

    getOpcodeFromName(name) {
        return this.getInstructionInfoFromName(name).opcode;
    }

    getFunctFromName(name) {
        return this.getInstructionInfoFromName(name).funct;
    }

    getDataPointFromName(name) {
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].name === name) {
                return this._data[i];
            }
        }
    }

    indexOfDataPoint(name) {
        for (let i = 0; i < this._data.length; i++) {
            if (this._data[i].name === name) {
                return i;
            }
        }
    }

    numericStringToBinary(num) {
        return LogicGate.toSignedBitstring(
            Number.parseInt(num)
        );
    }

    signedNumericStringToBinary(num) {
        if (Wath.isHex(num)) {
            let precision = 4 * num.length;
            num = LogicGate.hexToBitstring(num);
            num = LogicGate.signedBitstringToPrecision(num, precision);
            return num;
        } else {
            return LogicGate.toSignedBitstring(
                Number.parseInt(num)
            );
        }
    }

    numericStringToRegisterBinary(reg) {
        return LogicGate.bitstringToPrecision(
            this.numericStringToBinary(reg),
            5
        );
    }

    numericStringToShamtBinary(shamt) {
        return LogicGate.bitstringToPrecision(
            this.numericStringToBinary(shamt),
            5
        );
    }

    numericStringToFunctBinary(funct) {
        return LogicGate.bitstringToPrecision(
            this.numericStringToBinary(funct),
            6
        );
    }

    numericStringToOpcodeBinary(opcode) {
        return LogicGate.bitstringToPrecision(
            this.numericStringToBinary(opcode),
            6
        );
    }

    numericStringToImmediateBinary(immediate, signed = true) {
        if (signed) {
            return LogicGate.signedBitstringToPrecision(
                this.signedNumericStringToBinary(immediate),
                16
            );
        } else {
            LogicGate.bitstringToPrecision(
                this.numericStringToBinary(immediate),
                16
            );
        }
    }

    numericStringToWord(num) {
        return LogicGate.signedBitstringToPrecision(
            this.numericStringToBinary(num),
            32
        );
    }

    textConstantToSignedPrecision(textConstant, precision) {
        return LogicGate.signedBitstringToPrecision(
            this.textConstantToSignedBitstring(
                textConstant
            ),
            precision
        );
    }

    textConstantToSignedBitstring(textConstant) {
        return LogicGate.toSignedBitstring(
            this.textConstantToNumber(textConstant)
        )
    }

    textConstantToUnsignedPrecision(textConstant, precision) {
        return LogicGate.bitstringToPrecision(
            this.textConstantToUnsignedBitstring(
                textConstant
            ),
            precision
        );
    }

    textConstantToUnsignedBitstring(textConstant) {
        return LogicGate.toBitstring(
            this.textConstantToNumber(textConstant)
        )
    }

    // doesn't care about # of bits - just compiles decimal or decimal text
    textConstantToNumber(textConstant) {
        return Number.parseInt(textConstant);
    }

    explicitSignToSignedBitstring(num) {

        if (num[0] === '-') {
            num = num.substring(1);
            return LogicGate.twosComplement(
                '0' + this.numericStringToBinary(num)
            );
        }
        let bitstring = this.numericStringToBinary(num);
        if (LogicGate.bitToBool(LogicGate.sign(bitstring))) {
            bitstring = '0' + bitstring;
        }
        return bitstring;
    }

    explicitSignToPreciseSignedBitstring(num, precision) {
        return LogicGate.signedBitstringToPrecision(
            this.explicitSignToSignedBitstring(num),
            precision
        );
    }

    createLabel(name, address) {
        return {
            name: name,
            address: address
        };
    }


    branchAddressToMachineCode(bAddr, pcAddr) {
        throw 'im tryna use logic gate encodeBAddr instead';
        // ( BA - PC - 4 ) ÷ 4
        // (16 bits)
        return LogicGate.bitstringToPrecision(
            LogicGate.shiftRightTwo(    // ÷ 4
                LogicGate.sub(
                    bAddr,
                    pcAddr,
                    '100'   // 4
                )
            ),
            16      // 16 bits
        );
    }


    /*----------  Machine Code → components  ----------*/

    opcodeFromMachineCode(machinecode) {
        return LogicGate.split(
            machinecode,
            6   // op
        )[0];
    }

    rsFromMachineCode(machinecode) {
        return LogicGate.split(
            machinecode,
            6,  // op
            5   // rs
        )[1];
    }

    rtFromMachineCode(machinecode) {
        return LogicGate.split(
            machinecode,
            6 + // op
            5,  // rs
            5   // rt
        )[1];
    }

    rdFromMachineCode(machinecode) {
        return LogicGate.split(
            machinecode,
            6 + // op
            5 + // rs
            5,  // rt
            5   // rd
        )[1];
    }

    shamtFromMachineCode(machinecode) {
        return LogicGate.split(
            machinecode,
            6 + // op
            5 + // rs
            5 + // rt
            5,  // rd
            5   // shamt
        )[1];
    }

    functFromMachineCode(machinecode) {
        return LogicGate.split(
            machinecode,
            6 +  // op
            5 +  // rs
            5 +  // rt
            5 +  // rd
            5,   // shamt
            6    // funct
        )[1];
    }

    immediateFromMachineCode(machinecode) {
        return LogicGate.split(
            machinecode,
            6 + // op
            5 + // rs
            5,  // rt
            16  // imm
        )[1];
    }

    jAddrFromMachineCode(machinecode) {
        return LogicGate.split(
            machinecode,
            6,  // op
            26  // jAddr
        )[1];
    }

    /*----------  Errors  ----------*/

    throwInvalidRegister(received = null) {
        if (received) {
            throw 'Expected Register, got ' + received;
        } else {
            throw 'Invalid Register';
        }
    }

    throwUnexpected(expected = null, got = null) {
        if (expected === null) {
            throw `Unexpected "${this.nextWord()}"`;
        }
        if (got === null) {
            got = `"${this.nextWord()}"`;
        }
        throw `Expected ${expected}, got ${got}`;
    }

    throwUnsupportedInstruction(instruction) {
        throw `"${instruction}" instruction not supported`;
    }

    throwInvalidDataType(dataType) {
        throw `"${dataType}" data type not supported`;
    }
}