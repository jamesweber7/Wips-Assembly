

/*----------  Data Declarations  ----------*/

var mips = new Mips();

const registers = [
    'zero', 'at', 'v0', 'v1', 'a0', 'a1', 'a2', 'a3', 't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 't8', 't9', 'k0', 'k1', 'gp', 'sp', 'fp', 'ra'
];
var stop = false, running = false, compiled = false, saved = false;

var INSTRUCTION_DATA;
async function loadInstructions() {
    const response = await fetch('instructions.json');
    INSTRUCTION_DATA = await response.json();
}
loadInstructions();




function compileAndRun() {
    stop = false;
    const instructions = compile();
    console.log('RUNNING INSTRUCTIONS');
    console.log(instructions);
    setInstructions(instructions);
    run();

    updateUi();
}

function compile() {
    compiled = true;
    return Compiler.createInstructions(codeInput.value);
}

function setInstructions(instructions) {
    mips = new Mips();
    for (let i = 0; i < instructions.length; i++) {
        mips.setInstruction(
            LogicGate.addNoResize(
                '00000000010000000000000000000000',
                LogicGate.toBitstring(i)
            ),
            instructions[i]
        );
    }
}

function run() {
    stop = false;
    running = true;
    
    const lastInstruction = 10;
    const numCycles = lastInstruction + 4 + 1;
    for (let i = 0; i < numCycles && !isStopped(); i++) {
        step();
    }
}

function step() {
    pulseMipsClock();
    console.log(mips._ifToId.pc);
    printPipelines();
}

function checkCompilationAndStep() {
    if (!compiled) {
        compile();
    }
    step();
}

function stopPipeline() {
    stop = true;
}

function isStopped() {
    return stop || mips.trap.trap;
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
    if (LogicGate.bitToBool(mips.io.syscall)) {
        if (!LogicGate.bitToBool(mips.io.sysin) &&
            !LogicGate.bitToBool(mips.io.exit)) {

            if(LogicGate.bitToBool(mips.io.string)) {
                outputString(mips.io.sysout);
            } else {
                outputInt(mips.io.sysout);
            }
        }
    }
}