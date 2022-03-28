

/*----------  Data Declarations  ----------*/

var mips = new Mips();

const PC_START = '00000000010000000000000000000000';

const registers = [
    'zero', 'at', 'v0', 'v1', 'a0', 'a1', 'a2', 'a3', 't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 't8', 't9', 'k0', 'k1', 'gp', 'sp', 'fp', 'ra'
];
var eStop = false, running = false, compiled = false, saved = false;
var cycles = 0; stopCycle = 0;

var INSTRUCTION_DATA;
async function loadInstructions() {
    const response = await fetch('instructions.json');
    INSTRUCTION_DATA = await response.json();
}
loadInstructions();




function compileAndRun() {
    stop = false;
    compile();
    retreiveFreshCyclesAndRun();
    updateUi();
}

function compile() {
    compiled = true;
    const instructions = Compiler.createInstructions(codeInput.value);
    setInstructions(instructions); 
}

function setInstructions(instructions) {
    mips = new Mips();
    mips.bootup();
    for (let i = 0; i < instructions.length; i++) {
        mips.setInstruction(
            LogicGate.addNoResize(
                PC_START,
                LogicGate.toBitstring(i * 4)
            ),
            instructions[i]
        );
    }
}

function retreiveFreshCyclesAndRun() {
    stopCycle = cycles + getCyclesPerRun();
    run();
}

function run() {
    running = true;
    let time = Date.now();
    let startCycles = cycles;
    do {
        step();
    } while(cycles < stopCycle && !isStopped());
    updateUi();
    if (!isStopped()) {
        promptContinue();
    }
}

function step() {
    pulseMipsClock();
    cycles ++;
}

function singleStep() {
    // check compilation
    if (!compiled) {
        compile();
    }
    step();
    updateUi();
}

function stopPipeline() {
    stop = true;
}

function isStopped() {
    return stop || LogicGate.bitToBool(mips.trap.trap);
}

function submitInput(input) {
    if (!LogicGate.bitToBool(mips.trap.sysin)) {
        return;
    }
    let inputQueue = getInputQueue(input);
    uiInput(input);
    mips.input(inputQueue);
    if (running) {
        run();
    }
}

function getInputQueue(input) {
    let inputQueue = [];
    if (LogicGate.bitToBool(mips.io.string)) {
        inputQueue = LogicGate.fromAscii(input);
    } else {
        inputQueue.push(
            LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(
                    Wath.parseAnyStringAsInt(input) // if string is input, will use ascii codes
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
    if (LogicGate.bitToBool(mips.io.syscall)) {
        if (!LogicGate.bitToBool(mips.io.sysin) &&
            !LogicGate.bitToBool(mips.io.exit)) {
            if(LogicGate.bitToBool(mips.io.string)) {
                outputString(mips.io.output);
            } else {
                outputInt(mips.io.output);
            }
        }
    }
}