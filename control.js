

/*----------  Data Declarations  ----------*/

var mips;
initializeMips();

const PC_START = '00000000010000000000000000000000';

const registers = [
    'zero', 'at', 'v0', 'v1', 'a0', 'a1', 'a2', 'a3', 't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 't8', 't9', 'k0', 'k1', 'gp', 'sp', 'fp', 'ra'
];

// global state information
var eStop = false, running = false, compiled = false, saved = false;
var mipsChanged = false;
var cycles = 0, stopCycle = 0;

var INSTRUCTION_DATA;
async function loadInstructions() {
    const response = await fetch('instructions.json');
    INSTRUCTION_DATA = await response.json();
}
loadInstructions();


function compile() {
    setState(COMPILING);
    compiled = true;
    const instructions = Compiler.createInstructions(codeInput.value);
    setInstructions(instructions);
    endState(COMPILING);
}

function setInstructions(instructions) {
    mipsChanged = true;
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

function stageForExecution() {
    eStop = false;
    cycles = 0;
    initializeMipsIfNecessary();
    compile();
    retreiveFreshCycles();
    updateUi();
}

function stageForExecutionIfNecessary() {
    if (!compiled) {
        stageForExecution();
    }
}


function initializeMips() {
    mipsChanged = false;
    mips = new Mips();
    mips.bootup();
}

function initializeMipsIfNecessary() {
    if (mipsChanged) {
        initializeMips();
    }
}

function retreiveFreshCycles() {
    stopCycle = cycles + getCyclesPerRun();
}

function stageForRun() {
    stageForExecutionIfNecessary();
    running = true;
}

function endRun() {
    running = false;
}

function start() {
    eStop = false;
    stageForRun();
    setState(RUNNING);
    run();
}

function run() {
    const REFRESH_AT = 10;
    let i = 0;
    do {
        i++;
        step();
    } while(!isStopped() && i < REFRESH_AT);

    if (isStopped()) {
        updateStoppedRun();
    } else {
        updateUi();
        setTimeout(run, 0);
    }
}

function updateStoppedRun() {
    if (isStoppedBecauseOfCycles()) {
        promptContinue();
    }
    if (runningComplete()) {
        endRun();
    }
    endState(RUNNING);
    updateUi();
}

function step() {
    pulseMipsClock();
    cycles ++;
}

function singleStep() {
    stageForExecutionIfNecessary();
    step();
    updateUi();
}

function stopAndReset() {
    // reset first so eStop ends true
    reset();
    pause();
}

function reset() {
    compiled = false;
    running = false;
    eStop = false;
    cycles = 0;
    initializeMipsIfNecessary();
}

function stop() {
    pause();
}

function pause() {
    eStop = true;
    running = false;
}

function codeChanged() {
    compiled = false;
    saved = false;
}

function isStopped() {
    if (eStop) {
        return true;
    }
    if (cycles >= stopCycle) {
        return true;
    }
    if (LogicGate.bitToBool(mips.trap.Tr)) {
        return true;
    }
    return false;
}

function isStoppedBecauseOfCycles() {
    if (eStop) {
        return false;
    }
    if (LogicGate.bitToBool(mips.trap.Tr)) {
        return false;
    }
    return cycles >= stopCycle;
}

function runningComplete() {
    if (LogicGate.bitToBool(mips.trap.Exit)) {
        return true;
    }
    if (LogicGate.bitToBool(mips.trap.Ov)) {
        return true;
    }
    if (eStop) {
        return true;
    }
}

function save() {
    saved = true;
    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(new Blob([codeInput.value], {type: "text/x-assembly"}));
    let title = programTitle.value;
    if (title.includes('.') && !StringReader.substringAfter(title, '.')) {
        title = StringReader.substringBefore(title, '.');
    }
    if (!title.includes('.')) {
        title += '.S';
    }
    a.download = title;
    a.click();
}

function submitInput(input) {
    if (!LogicGate.bitToBool(mips.trap.Sys)) {
        return;
    }
    let inputQueue = getInputQueue(input);
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