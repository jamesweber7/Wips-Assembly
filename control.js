
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
    const instructions = Compiler.createInstructions(codeInput.value);
    console.log(instructions);
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
    console.log('RUNNING INSTRUCTIONS');
    const lastInstruction = 10;
    const numCycles = lastInstruction + 4 + 1;
    for (let i = 0; i < numCycles; i++) {
        pulseMipsClock();
        console.log(mips._ifToId.pc);
        printPipelines();
    }

    updateUi();
}

function printObject(obj) {
    console.log(JSON.stringify(obj, (key, value) => {
        if (key !== 'computer') {
            return value;
        }
    }, 2));
}

function printPipelines() {
    printObject(mips._ifToId);
    printObject(mips._idToEx);
    printObject(mips._exToMem);
    printObject(mips._memToWb);
    printObject(mips._wb);
}

function pulseMipsClock() {
    mips.write('0');
    mips.write('1');
    mips.write('0');
    console.log('HELLO!');
    if (LogicGate.bitToBool(mips.io.syscall)) {
        if (!LogicGate.bitToBool(mips.io.sysin)) {
            outputInt(mips.io.sysout);
        }
    }
}