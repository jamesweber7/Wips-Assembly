

/*=============================================
=                 MIPS                        =
=============================================*/


// working instructions: 
// R-type add, sub, and, or, nor, slt
// I-type lw, sw
function blankInstruction() {
    return '00000000000000000000000000000000';
}
function typeRInstruction(rs, rt, rd, funct) {
    let opcode = '000000';                  
    let shamt = '00000';         // n/a / 0
    return opcode + rs + rt + rd + shamt + funct;
}
function typeIInstruction(opcode, rs, rt, immediate) {
    return opcode + rs + rt + immediate;
}
function typeJInstruction(opcode, addr) {
    return opcode + addr;
}
// R-type:

// 0x20
function addInstruction(rs, rt, rd) {
    return typeRInstruction(rs, rt, rd, '100000');
}
// 0x22
function subInstruction(rs, rt, rd) {
    return typeRInstruction(rs, rt, rd, '100010');
}
// 0x25
function orInstruction(rs, rt, rd) {
    return typeRInstruction(rs, rt, rd, '100101');
}
// 0x24
function andInstruction(rs, rt, rd) {
    return typeRInstruction(rs, rt, rd, '100100');
}
// 0x27
function norInstruction(rs, rt, rd) {
    return typeRInstruction(rs, rt, rd, '100111');
}
// 0x2A
function sltInstruction(rs, rt, rd) {
    return typeRInstruction(rs, rt, rd, '101010');
}

// op 0x23 
function lwInstruction(rs, rt, imm) {
    return typeIInstruction('100011', rs, rt,  imm);
}
// op 0x2B
function swInstruction(rs, rt, imm) {
    return typeIInstruction('101011', rs, rt,  imm);
}
// op 0x8
function addiInstruction(rs, rt, imm) {
    return typeIInstruction('001000', rs, rt,  imm);
}
// pseudo
function moveInstruction(rs, rt) {
    // R[rt] = R[rs] + 0
    return addiInstruction(rs, rt, LogicGate.empty(16));
}
// op 0x4
function beqInstruction(rs, rt, imm) {
    return typeIInstruction('000100', rs, rt,  imm);
}
// op 0xd
function oriInstruction(rs, rt, imm) {
    return typeIInstruction('001101', rs, rt,  imm);
}
// op 0xf
function luiInstruction(rt, imm) {
    return typeIInstruction(
        '001111',   
        '10000',    // shift 16
        rt,  
        imm
    );
}
// pseudo
// returns 2 instructions
function liInstruction(rt, imm) {
    const splitImmediate = LogicGate.split(imm, 16, 16);
    let instruction1 = luiInstruction(
        rt,
        splitImmediate[0]
    );
    let instruction2 = oriInstruction(
        rt,
        rt,
        splitImmediate[1]
    );
    return [
        instruction1,
        instruction2
    ];
}

function syscallInstruction() {
    return typeIInstruction(
        '110011',
        '00100',     // $a0
        // '11100',     // $gp
        '00010',
        '0000000000000000'
    );
}

// $v0 (for syscall)
// mips._registerMemory._data[2] = '00000000000000000000000000000101'

// give instructions
let testInstructions = [];
let opcode, rs, rt, rd, shamt, funct;
let instruction, instructionCache;

// syscall
// li $v0, syscallCode
testInstructions['00000000010000000000000000000000'] = luiInstruction(
    '00010',
    '0000000000000000'
);
testInstructions['00000000010000000000000000000010'] = oriInstruction(
    '00010',
    '00010',
    '0000000000000001'
);
testInstructions['00000000010000000000000000000110'] = syscallInstruction();

// // sw
// // sw $v0, 0($sp)
// testInstructions['00000000010000000000000000000000'] = swInstruction(
//     '11101',
//     '00010',
//     '0000000000000000'
// );

// // lw
// // lw $a0, 0($sp)
// testInstructions['00000000010000000000000000000100'] = lwInstruction(
//     '11101',
//     '00100',
//     '0000000000000000'
// );



console.log(mips.registers());
mips.setInstructions(testInstructions);

const lastInstruction = 6;
const numCycles = lastInstruction + 4 + 1;
console.log('DOING STUFF');
for (let i = 0; i < numCycles; i++) {
    pulseMipsClock();
// console.log(mips.registers());
    console.log('_______CYCLE_'+i+'_OVER_______');
    if (LogicGate.bitToBool(mips.io.syscall)) {
        console.log('SYSCALL');
        console.log('SYSCALL');
        console.log('SYSCALL');
        console.log('SYSCALL');
        console.log('SYSCALL');
        console.log('SYSCALL');

        printObject(mips.io);
    }
    if (LogicGate.bitToBool(mips.io.exit)) {
        console.log('SYSEXIT');
        printObject(mips.io);
    }
    printPipelines();
    printObject(mips.io);
    printObject(mips.trap);
}
console.log('DONE DOING STUFF');
console.log(mips.registers());
updateUi();

/*=====  End of MIPS  ======*/

