
var mips = new Mips();

const registers = [
    'zero', 'at', 'v0', 'v1', 'a0', 'a1', 'a2', 'a3', 't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 't8', 't9', 'k0', 'k1', 'gp', 'sp', 'fp', 'ra'
];

var INSTRUCTION_DATA;
async function loadInstructions() {
    const response = await fetch('instructions.json');
    INSTRUCTION_DATA = await response.json();
}
loadInstructions();



function compileAndRun() {
    const instructions = compile(codeInput.value);
    mips = new Mips();
    for (let i = 0; i < instructions.length; i++) {
        mips.setInstruction(
            LogicGate.add(
                '00000000010000000000000000000000', 
                LogicGate.toBitstring(i)
            ),
            instructions[i]
        );
    }
    const lastInstruction = 5;
    const numCycles = lastInstruction + 4 + 1;
    for (let i = 0; i < numCycles; i++) {
        pulseMipsClock();
    }

    updateUi();
}

function pulseMipsClock() {
    mips.write('0');
    mips.write('1');
    mips.write('0');
}