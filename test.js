

/*=============================================
=                 MIPS                        =
=============================================*/

const mips = new Mips();

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


function mipsClockPulse() {
    mips.write('0');
    mips.write('1');
    mips.write('0');
}


// give instructions
let instructions = [];
let opcode, rs, rt, rd, shamt, funct;
let instruction;

// jal
// instructions['00000000010000000000000000000000'] = typeJInstruction(
//     '000011',
//     '00000000000000000000001000'
// );

// add $3 = $3 + $3
// instructions['00000000010000000000000000000000'] = addInstruction(
//     '00010',
//     '00010',
//     '00010'
// );

// jr $ra
// instructions['00000000010000000000000000000001'] = typeRInstruction(
//     '11111',
//     '00000',
//     '00000',
//     '001000'
// );

// let newStructions = liInstruction('11111', '11111111111111111111111111111111');
// instructions['00000000010000000000000000000000'] = newStructions[0];
// instructions['00000000010000000000000000000001'] = newStructions[1];
// console.log(newStructions);
// // jr   $ra
// instructions['00000000010000000000000000000010'] = typeRInstruction('11111', '00000', '00000', '001000');



console.log(instructions);
console.log(mips.registers());

// watch instructions (debugging)
const WATCH_INSTRUCTIONS = Object.keys(instructions);
for (let i = 0; i < WATCH_INSTRUCTIONS.length; i++) {
    WATCH_INSTRUCTIONS[i] = LogicGate.add(
        WATCH_INSTRUCTIONS[i],
        '100'   // 4
    );
}
mips.setInstructions(instructions);

const lastInstruction = 5;
const numCycles = lastInstruction + 4 + 1;
for (let i = 0; i < numCycles; i++) {
    mipsClockPulse();
    console.log('_______CYCLE_'+i+'_OVER_______');
}
console.log(mips._registerMemory._data);

/*=====  End of MIPS  ======*/

