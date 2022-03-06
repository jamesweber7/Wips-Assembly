const NEWLINE = '\n';
const REGISTER = '$';
const COMMENT = '#';

const data = [];
const labels = [];

// return array of instructions
function compile(code) {
    const instructions = [];
    code = removeComments(code);
    while (code.length) {
        code = code.trim();
        const next = compileNext(code);
        code = next.remaining;
        instructions.push(next.instruction);
        console.log(code);
    }
    return instructions;
}

// returns machine code for next instruction AND returns uncompiled code after next instruction
function compileNext(code) {
    const instructionName = StringReader.firstWord(code);
    const instructionInfo = getInstruction(instructionName);
    if (!instructionInfo) {
        throw 'Invalid instruction ' + instructionName;
    }
    console.log(instructionInfo);
    console.log(instructionInfo.type);
    switch (instructionInfo.type) {
        case 'r':
            return compileR(code, instructionInfo);
        case 'i':
            return compileI(code, instructionInfo);
        case 'j':
            return compileJ(code, instructionInfo);
    }
}

function compileR(code, instructionInfo) {
    const opcode = '000000';
    let rs = instructionInfo.rs;
    let rt = instructionInfo.rt;
    let rd = instructionInfo.rd;
    let shamt = instructionInfo.shamt;
    let funct = instructionInfo.funct;

    if (!rd) {
        code = StringReader.substringAfter(code, '$');
        rd = StringReader.firstWord(code);
        code = StringReader.substringAfter(code, rd);
        rd = rd.replace(',', '');
    }
    rd = getRegisterBinary(rd);

    if (!rs) {
        code = StringReader.substringAfter(code, '$');
        rs = StringReader.firstWord(code);
        code = StringReader.substringAfter(code, rs);
        rs = rs.replace(',', '');
    }
    rs = getRegisterBinary(rs);

    if (!rt) {
        code = StringReader.substringAfter(code, '$');
        rt = StringReader.firstWord(code);
        code = StringReader.substringAfter(code, rt);
    }
    rt = getRegisterBinary(rt);

    if (!shamt) {
        shamt = StringReader.firstWord(code);
        code = StringReader.substringAfter(code, shamt);
    }
    shamt = getShamtBinary(shamt);

    funct = getFunctBinary(funct);

    if (code.includes(NEWLINE)) {
        code = StringReader.substringAfter(code, NEWLINE);
    } else {
        code = '';
    }

    const instruction = LogicGate.merge(
        opcode,
        rs,
        rt,
        rd,
        shamt,
        funct
    );

    return {
        remaining: code,
        instruction: instruction
    };
}

function compileI(code, instructionInfo) {
    const opcode = getOpcodeBinary(instructionInfo.opcode);
    let rs = instructionInfo.rs;
    let rt = instructionInfo.rt;
    let immediate = instructionInfo.immediate;

    switch (instructionInfo.iFormat) {
        // rs, imm(rt)
        case 'offset': 
            return compileIOffset(code, opcode, rs, rt, immediate);
        // rt, rs, imm
        case 'value':
            return compileIValue(code, opcode, rs, rt, immediate);
    }

}

// rs, imm(rt)
function compileIOffset(code, opcode, rs, rt, immediate) {

    if (!rt) {
        code = StringReader.substringAfter(code, '$');
        rt = StringReader.firstWord(code);
        code = StringReader.substringAfter(code, rt);
        rt = rt.replace(',', '');
    }
    rt = getRegisterBinary(rt);

    if (!immediate) {
        immediate = StringReader.substringBefore(code, '(');
        immediate = immediate.replace(' ', '');
    }
    immediate = getImmediateBinary(immediate);

    if (!rs) {
        code = StringReader.substringAfter(code, '$');
        rs = StringReader.firstWord(code);
        rs = StringReader.substringBefore(rs, ')');
        code = StringReader.substringAfter(code, ')');
        rs = rs.replace(',', '');
    }
    rs = getRegisterBinary(rs);

    if (code.includes(NEWLINE)) {
        code = StringReader.substringAfter(code, NEWLINE);
    } else {
        code = '';
    }

    const instruction = LogicGate.merge(
        opcode,
        rs,
        rt,
        immediate
    );

    return {
        remaining: code,
        instruction: instruction
    };
}

// rt, rs, imm
function compileIValue(code, opcode, rs, rt, immediate) {

    if (!rt) {
        code = StringReader.substringAfter(code, '$');
        rt = StringReader.firstWord(code);
        code = StringReader.substringAfter(code, rt);
        rt = rt.replace(',', '');
    }
    rt = getRegisterBinary(rt);

    if (!rs) {
        code = StringReader.substringAfter(code, '$');
        rs = StringReader.firstWord(code);
        code = StringReader.substringAfter(code, rs);
        rs = rs.replace(',', '');
    }
    rs = getRegisterBinary(rs);

    if (!immediate) {
        immediate = StringReader.firstWord(code);
        code = StringReader.substringAfter(code, immediate);
    }
    immediate = getImmediateBinary(immediate);

    if (code.includes(NEWLINE)) {
        code = StringReader.substringAfter(code, NEWLINE);
    } else {
        code = '';
    }

    const instruction = LogicGate.merge(
        opcode,
        rs,
        rt,
        immediate
    );

    return {
        remaining: code,
        instruction: instruction
    };
}

function compileJ(code, instruction) {

}

function removeComments(code) {
    while (code.includes(COMMENT) && code.includes(NEWLINE)) {
        code = StringReader.replaceFrom(
            code,
            NEWLINE,
            COMMENT, 
            NEWLINE
        );
    }
    if (code.includes(COMMENT)) {
        code = StringReader.substringBefore(code, COMMENT);
    }
    return code;
}

function removeWhiteSpace(code) {
    return code.trim();
}

function goToNextLine(code) {
    code = StringReader.stringAfter(code, NEWLINE);
}

function getInstruction(name) {
    for (let i = 0; i < INSTRUCTION_DATA.length; i++) {
        if (INSTRUCTION_DATA[i].name === name) {
            return INSTRUCTION_DATA[i];
        }
    }
}

function getRegisterBinary(register) {
    register = register.replace(REGISTER, '');
    // register input as identifier (e.g. $a0)
    if (!StringReader.isNumericString(register[0])) {
        register = registers.indexOf(register);
    }
    if (!register) {
        throw 'bad register ' + register 
    }
    return LogicGate.bitstringToPrecision(
        getBinary(register),
        5
    );
}

function getBinary(num) {
    return LogicGate.toBitstring(
        Number.parseInt(num)
    );
}

function getShamtBinary(shamt) {
    return LogicGate.bitstringToPrecision(
        getBinary(shamt),
        5
    );
}

function getFunctBinary(funct) {
    return LogicGate.bitstringToPrecision(
        getBinary(funct),
        6
    );
}

function getOpcodeBinary(opcode) {
    return LogicGate.bitstringToPrecision(
        getBinary(opcode),
        6
    );
}

function getImmediateBinary(immediate) {
    return LogicGate.bitstringToPrecision(
        getBinary(immediate),
        16
    );
}