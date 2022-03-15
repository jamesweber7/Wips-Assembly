

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
    const MAX_CYCLES = getCyclesPerRun();
    
    for (let i = 0; i < MAX_CYCLES && !isStopped(); i++) {
        console.log('HI CYCLE, ', i);
        step();
        printObject(mips.trap);
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
    return stop || LogicGate.bitToBool(mips.trap.trap);
}

function submitInput(input) {
    if (!LogicGate.bitToBool(mips.io.sysin)) {
        return;
    }
    let inputQueue = getInputQueue(input);
    inputQueue.forEach(inputWord => {
        mips.input(inputWord);
        pulseMipsClock();
    });
}

function getInputQueue(input) {
    let inputQueue = [];
    if (LogicGate.bitToBool(mips.io.string)) {
        inputQueue = LogicGate.fromAscii(input);
    } else {
        inputQueue.push(LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(
                    Number.parseInt(input)
                ),
                32
            )
        );
    }
    return inputQueue;
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