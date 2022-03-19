
// for state machines, I decided to go OO

class ClockTriggeredGate {
    constructor() {
        this._clk = '0';
    }
    // rising edge trigger
    isClockPulse(clk, pClk = this._clk) {
        if (LogicGate.bitToBool(
            LogicGate.and(
                LogicGate.not(pClk),
                clk
            )
        )) {
            return true;
        }
    }
    updateClockPulse(clk) {
        this._clk = clk;
    }
}

class ClockExclusiveGate extends ClockTriggeredGate {
    write(input) {
        if (!Array.isArray(input)) {
            input = [...arguments];
        }
        const clk = input.pop();
        const wires = input;
        if (this.isClockPulse(clk)) {
            this.updateWires(...wires)
        }
        this.updateClockPulse(clk);
    }
}

/*=============================================
=                  Flip Flops                 =
=============================================*/

class D_FlipFlop extends ClockTriggeredGate {

    constructor(numBits = 1) {
        super();
        this.q = LogicGate.empty(numBits);
        this.notq = LogicGate.not(this.q);
    }

    write(d, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            this.q = d;
            this.notq = LogicGate.not(this.q);
        }
        this.updateClockPulse(clk);
    }

}

// D Flip Flop with async set & clr
class D_FlipFlopAsync extends D_FlipFlop {

    write(d, set, clr, clk) {
        // set
        if (LogicGate.bitToBool(set)) {
            this.q = '1';
            this.notq = '0';
            this.updateClockPulse();
        }
        // clr
        if (LogicGate.bitToBool(clr)) {
            this.q = '0';
            this.notq = '1';
            this.updateClockPulse(clk);
            return;
        }
        super.write(d, clk);
    }

}
class D_FlipFlopAsyncReset extends D_FlipFlop {
    write(d, clr, clk) {
        super.write(d, clk);
        this.q = LogicGate.bitstringAndBit(d, clr);
        this.notq = LogicGate.not(this.q);
    }
}

class S_R_FlipFlop extends ClockTriggeredGate {
    constructor() {
        super();
        this.q = '0';
        this.notq = '1';
    }

    write(s, r, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            // Q⁺ = S+QR'
            this.q = LogicGate.mux(
                this.q, // no input
                '0',    // reset
                '1',    // set
                LogicGate.merge(
                    s, r
                )
            );
            this.notq = LogicGate.not(this.q);
        }
        this.updateClockPulse(clk);
    }
}

class S_R_FlipFlopAsync {
    constructor() {
        this.q = '0';
        this.notq = '1';
    }

    write(s, r) {
        // Q⁺ = S+QR'
        this.q = LogicGate.mux(
            this.q, // no input
            '0',    // reset
            '1',    // set
            LogicGate.merge(
                s, r
            )
        );
        this.notq = LogicGate.not(this.q);
    }
}

class S_R_FlipFlopAsyncSet extends S_R_FlipFlop {
    write(s, r, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            // update r sync
            this.q = LogicGate.and(
                this.q,
                LogicGate.not(r)
            )
        }
        // update s async
        this.q = LogicGate.or(
            this.q,
            s
        );
        this.notq = LogicGate.not(this.q);
        this.updateClockPulse(clk);
    }
}

class J_K_FlipFlop extends ClockTriggeredGate {
    constructor() {
        super();
        this.q = '0';
        this.notq = '1';
    }
    write(j, k, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            // Q⁺ = Q'J + QK'
            this.q = LogicGate.or(
                LogicGate.and(
                    this.notq,
                    j
                ),
                LogicGate.and(
                    this.q,
                    LogicGate.not(k)
                )
            );
            this.notq = LogicGate.not(this.q);
        }
        this.updateClockPulse(clk);
    }
}

/*=====  End of Flip Flops  ======*/

class FourBitRegister {
    constructor() {
        this.q = '0000';
        this._dFlipFlops = new Array(4);
        for (let i = 0; i < this._dFlipFlops.length; i++) {
            this._dFlipFlops[i] = new D_FlipFlopAsync();
        }
    }
    write(d, enable, reset, clk) {
        const fourBitMux = LogicGate.mux([this.q, d], enable);
        let qPlus = '';
        for (let i = 0; i < 4; i++) {
            const dFlipFlop = this._dFlipFlops[i];
            const set = '0';
            dFlipFlop.write(fourBitMux[i], set, reset, clk);
            qPlus += dFlipFlop.q;
        }
        this.q = qPlus;
    }
}

class BrainlessCPU {
    constructor() {
        // stored gates:
        this._accumulator = new FourBitRegister();
        // ram with 16 randomly filled 4-bit registers
        this._programRam = SingleReadRam.randomized(4, 16);
        // outputs:
        this.aluOut = '0000';
        this.accum = '0000';
        this.dataBus = '0000';
    }

    executeInstruction(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write) {
        // no clk pulse
        this.write(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write, '0');
        // clk pulse
        this.write(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write, '1');
        // no clk pulse
        this.write(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write, '0');
    }

    write(dataIn, addrBus, invert, arith, pass, loadAcc, accToDb, reset, read, write, clk) {

        this.readProgramRam(addrBus);

        this.updateMuxesToDataBus(dataIn, accToDb, read);

        this.updateAluOut(invert, arith, pass);

        this.updateAccumulator(loadAcc, reset, clk);

        this.updateMuxesToDataBus(dataIn, accToDb, read);

        this.updateProgramRam(addrBus, write, clk);

    }

    /*----------  Update Components  ----------*/
    updateMuxesToDataBus(dataIn, accToDb, read) {
        const dataMux = this.dataMux(dataIn, read);
        const accumMux = this.accumMux(dataMux, accToDb);
        this.dataBus = accumMux;
    }

    updateAccumulator(loadAcc, reset, clk) {
        this._accumulator.write(
            this.aluOut,
            loadAcc,
            reset,
            clk
        );
        this.accum = this._accumulator.q;
    }

    updateAluOut(invert, arith, pass) {
        const alu = this.alu(invert, arith, pass);
        this.aluOut = alu.y;
    }

    updateProgramRam(addrBus, write, clk) {
        this._programRam.write(
            addrBus,
            this.dataBus,
            write,
            clk
        );
    }

    /*----------  Components  ----------*/

    readProgramRam(addr) {
        this._programRam.read(addr);
    }

    alu(invert, arith, pass) {
        const aluCin = '0';
        return LogicGate.ALU16(
            this.dataBus,
            this.accum,
            aluCin,
            invert,
            arith,
            pass
        );
    }


    dataMux(dataIn, read) {
        return LogicGate.mux(
            dataIn,
            this._programRam.dataOut,
            read
        );
    }

    accumMux(dataMux, accToDb) {
        return LogicGate.mux(
            dataMux,
            this.accum,
            accToDb
        );
    }

}

class ParentRam extends ClockTriggeredGate {

    setData(data) {
        this._data = data;
    }

    getData() {
        return this._data;
    }

}

class Ram extends ParentRam {

    constructor(data) {
        super();
        this._data = data;
        this._size = data.length;
        this._regSize = data[0].length;
    }

    dataAt(addr) {
        return LogicGate.mux(this._data, addr);
    }

    static randomized(regLength, numRegisters) {
        const data = new Array(numRegisters);
        for (let i = 0; i < data.length; i++) {
            data[i] = LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(
                    Wath.randomInt(0, 2 ** regLength - 1)
                ),
                regLength
            );
        }
        return new this(data);
    }

    static empty(regLength, numRegisters) {
        const data = new Array(numRegisters);
        for (let i = 0; i < data.length; i++) {
            data[i] = LogicGate.empty(regLength);
        }
        return new this(data);
    }

    // fills each register with the value of its index
    static indexValues(regLength, numRegisters) {
        const data = new Array(numRegisters);
        for (let i = 0; i < data.length; i++) {
            data[i] = LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(i),
                regLength
            );
        }
        return new this(data);
    }
}

// since js doesn't like arrays holding 16GiB
// creates data on access
class BigRam extends ParentRam {
    constructor(regLength) {
        super();
        this._data = [];
        this._regSize = regLength;
    }

    dataAt(addr) {
        if (this._data[addr] === undefined) {
            this._data[addr] = LogicGate.empty(this._regSize);
        }
        return this._data[addr];
    }

    setData(data) {
        this._data = data;
    }

    push(address, data) {
        this._data[address] = data;
    }

}

// RAM with only one read address
class SingleReadRam extends Ram {
    constructor(data) {
        super(data);
        this._addr = LogicGate.empty(this._regSize);
        this.dataOut = this._data[this._addr];
    }

    write(addr, dataIn, write, clk) {
        // addr updated async
        this._addr = addr;
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(write)) {
                this._data[
                    LogicGate.bitstringToDecimal(this._addr)
                ] = dataIn;
            }
        }
        this.dataOut = this.dataAt(this._addr);
        this.updateClockPulse(clk);
    }

    read(addr) {
        this._addr = addr;
        this.dataOut = this.dataAt(this._addr);
    }

    setData(data) {
        this._data = data;
        this._addr = LogicGate.empty(this._regSize);
        this.dataOut = this.dataAt(this._addr);
    }

}

class SingleReadBigRam extends BigRam {
    constructor(data) {
        super(data);
        this._addr = LogicGate.empty(this._regSize);
        this.dataOut = this._data[this._addr];
    }

    write(addr, dataIn, write, clk) {
        // addr updated async
        this._addr = addr;
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(write)) {
                this._data[this._addr] = dataIn;
            }
        }
        this.dataOut = this.dataAt(this._addr);
        this.updateClockPulse(clk);
    }

    read(addr) {
        this._addr = addr;
        this.dataOut = this.dataAt(this._addr);
    }

    setData(data) {
        super.setData(data);
        this._addr = LogicGate.empty(this._regSize);
        this.dataOut = this.dataAt(this._addr);
    }
}

class LatentRam extends SingleReadRam {
    write(addr, dataIn, write, clk) {
        if (this.isClockPulse(clk)) {
            this.dataOut = this.dataAt(this._addr);
            // addr updated sync after read
            this._addr = addr;
            if (LogicGate.bitToBool(write)) {
                this._data[
                    LogicGate.bitstringToDecimal(this._addr)
                ] = dataIn;
            }
        }
        this.updateClockPulse(clk);
    }
}
class MipsDataRam extends BigRam {
    constructor() {
        super(8);
        this._addr = LogicGate.empty(32);
        this.readData();
    }

    write(addr, dataIn, read, write, clk) {

        this._addr = addr;
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(write)) {
                this.writeData(dataIn);
            }
        }
        if (LogicGate.bitToBool(read)) {
            this.readData();
        }
        this.updateClockPulse(clk);
    }

    writeData(dataIn) {
        const bytes = LogicGate.split(dataIn, 8, 8, 8, 8);
        let addr = this._addr;
        this._data[addr] = bytes[3];
        addr = LogicGate.incrementer32(addr);
        this._data[addr] = bytes[2];
        addr = LogicGate.incrementer32(addr);
        this._data[addr] = bytes[1];
        addr = LogicGate.incrementer32(addr);
        this._data[addr] = bytes[0];
    }

    readData() {
        let addr = this._addr;
        this.dataOut1 = this.dataAt(addr);
        addr = LogicGate.incrementer32(addr);
        this.dataOut2 = this.dataAt(addr);
        addr = LogicGate.incrementer32(addr);
        this.dataOut3 = this.dataAt(addr);
        addr = LogicGate.incrementer32(addr);
        this.dataOut4 = this.dataAt(addr);
    }
}

class MipsRegisterRam extends Ram {
    constructor(data) {
        super(data);
        this._addr1 = LogicGate.empty(5);
        this.readData1 = this.dataAt(this._addr1)
        this._addr2 = LogicGate.empty(5);
        this.readData2 = this.dataAt(this._addr2)
    }

    write(readReg1, readReg2, writeReg, writeData, regWrite, clk) {
        // write updated first, then read
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(regWrite)) {
                this._data[
                    LogicGate.bitstringToDecimal(writeReg)
                ] = writeData;
            }
        }
        // read data updated async
        this._addr1 = readReg1;
        this.readData1 = this.dataAt(this._addr1);
        this._addr2 = readReg2;
        this.readData2 = this.dataAt(this._addr2);
        this.updateClockPulse(clk);
    }

    read(readReg1, readReg2) {
        this._addr1 = readReg1;
        this.readData1 = this.dataAt(this._addr1);
        this._addr2 = readReg2;
        this.readData2 = this.dataAt(this._addr2);
    }

    setData(data) {
        super.setData(data);
        this._addr1 = LogicGate.empty(5);
        this.readData1 = this.dataAt(this._addr1);
        this._addr2 = LogicGate.empty(5);
        this.readData2 = this.dataAt(this._addr2);
    }

    static randomized(regLength, numRegisters) {
        const data = new Array(numRegisters);
        for (let i = 0; i < data.length; i++) {
            data[i] = LogicGate.bitstringToPrecision(
                LogicGate.toBitstring(
                    Wath.randomInt(0, 2 ** regLength - 1)
                ),
                regLength
            );
        }
        return new this(data);
    }

    static empty(regLength, numRegisters) {
        const data = new Array(numRegisters);
        for (let i = 0; i < data.length; i++) {
            data[i] = LogicGate.empty(regLength);
        }
        return new this(data);
    }
}


class MipsTrap extends ClockExclusiveGate {
    constructor() {
        super();
        this.OvF = '0';
        this.sysin = '0';
        this.exit = '0';
        this.pipelineTrap = '0';
        this.trap = LogicGate.or(
            this.OvF,
            this.exit,
            this.sysin
        );
    }

    updateWires(wires) {
        this.OvF = wires.OvF;
        this.sysin = wires.sysin
        this.exit = wires.exit
        this.pipelineTrap = wires.string
        this.trap = LogicGate.or(
            this.OvF,
            this.exit,
            this.sysin
        );
    }
}

class MipsSyscall extends ClockExclusiveGate {
    constructor() {
        super();
        this.syscall = '0';
        this.string = '0';
        this.exit = '0';
        this.sysin = '0';
        this.sysout = LogicGate.empty(32);
        this.sysread = LogicGate.empty(32);
    }

    updateWires(writeData, opcode) {
        // syscallOp2
        const sysout = opcode[0];
        // syscallOp1
        const sysin = opcode[1];
        // syscallOp0
        const int = opcode[2];

        this.syscall = LogicGate.or(
            sysout,
            sysin
        );
        this.exit = LogicGate.and(
            sysout,
            sysin
        );
        this.sysin = LogicGate.and(
            sysin,
            this.syscall,
            LogicGate.not(
                this.exit
            )
        );
        this.string = LogicGate.and(
            this.syscall,
            LogicGate.not(
                int
            ),
            LogicGate.not(
                this.exit
            )
        );
        this.sysout = writeData;
    }

    input(input) {
        this.sysread = input;
    }
}


class Mips {
    constructor() {
        // RAM
        this._instructionMemory = new SingleReadBigRam(32);
        this._mainMemory = new MipsDataRam();
        this._registerMemory = MipsRegisterRam.empty(32, 32);
        // PC
        this._pc = new D_FlipFlop(32);
        // Wires:
        this._pcWb = LogicGate.empty(32);
        this._pcStopWb = LogicGate.empty(1);
        this._pcStartWb = LogicGate.empty(1);
        this._gpWf = LogicGate.empty(32);

        this.NOP_ADDRESS = '00000000000000000000000000000000';
        this.A0_ADDRESS = '00100';
        this.GP_ADDRESS = '11100';
        this.RA_ADDRESS = '11111';

        // exceptions
        this.trap = new MipsTrap();
        this.io = new MipsSyscall();
        this._stringLengthFlipFlop = new D_FlipFlop(32);
        this._pcBlock = new S_R_FlipFlopAsyncSet();
        this.delayPcBlock = new S_R_FlipFlop();
        this.noDelayPcBlock = new S_R_FlipFlop();
        this.asyncPcBlock = new S_R_FlipFlopAsync();

        // pipelines
        this._ifToId = new InstrFetchToInstrDecodePipeline(this);
        this._idToEx = new InstrDecodeToAluExPipeline(this);
        this._exToMem = new AluExToMemPipeline(this);
        this._memToWb = new MemToWriteBackPipeline(this);
        this._wb = new WriteBack(this);

        this.writeBootupInstructions();
        this.bootup();

    }

    write(clk) {
        this.writeBack(clk);
        if (!LogicGate.bitToBool(this.trap.trap)) {
            this.mem(clk);
            this.execAlu(clk);
            this.instructionDecodeRegRead(clk);
            this.instructionFetch(clk);
        }
    }


    /*----------  Pipelines  ----------*/

    writeBack(clk) {
        const pipeline = this._memToWb;

        const syscallOp = pipeline.syscallOp;
        const sysout = syscallOp[0];
        const sysin = syscallOp[1];
        const int = syscallOp[2];

        // regWrite
        const regWriteSrc = LogicGate.or(
            sysout,
            sysin
        );
        const regWrite = LogicGate.mux(
            pipeline.regWrite,
            LogicGate.and(  // sysin AND ~exit
                sysin,
                LogicGate.not(
                    sysout
                )
            ),
            regWriteSrc
        );

        // memToReg
        const memToReg1 = pipeline.memToReg[0];
        const memToReg0 = pipeline.memToReg[1];
        const memToReg = LogicGate.merge(
            memToReg1,
            LogicGate.and(
                memToReg0,
                LogicGate.not(int)
            )
        );

        // writeData mux
        let writeData = LogicGate.mux(
            pipeline.aluResult,
            pipeline.readData,
            pipeline.shifted,
            pipeline.pc,
            memToReg
        );

        // syscall
        this.io.write(writeData, pipeline.syscallOp, clk);

        const string = this.io.string;

        // trap
        this.trap.write(
            {
                OvF: pipeline.OvF,
                syscall: this.io.syscall,
                sysin: this.io.sysin,
                exit: this.io.exit,
                string: string,
            },
            clk
        );

        // string length
        const previousStringLen = this._stringLengthFlipFlop.q;
        const stringLength = LogicGate.addALU32(
            previousStringLen,
            '00000000000000000000000000000100'  // 4
        );
        const nextStringLen = LogicGate.mux(
            '11111111111111111111111111111100', // -4
            stringLength,
            string
        )
        this._stringLengthFlipFlop.write(
            nextStringLen,
            clk
        );

        // sysin writeData
        writeData = LogicGate.mux(
            writeData,
            this.io.sysread,
            this.io.sysin
        );

        // sysin writeReg
        const writeReg = LogicGate.mux(
            pipeline.writeReg,
            this.A0_ADDRESS,
            this.io.string
        );

        // Update WB Wires
        this._wb.write({
            string: string,
            regWrite: regWrite,
            writeData: writeData,
            writeReg: writeReg,
            len: stringLength,
        });
    }

    mem(clk) {
        const pipeline = this._exToMem;

        // writebacks
        // pc start wb
        this._pcStartWb = LogicGate.or(
            pipeline.jump,
            pipeline.jr,
            pipeline.branch,
            pipeline.bne
        );
        // pc wb
        // branch mux
        const pcBranchSrc = LogicGate.mux(
            pipeline.bne,
            pipeline.branch,
            pipeline.zero
        );

        let pc = LogicGate.mux(
            pipeline.pc,
            pipeline.branchPc,
            pcBranchSrc
        );

        // jump mux
        const pcJumpSrc = LogicGate.merge(
            pipeline.jr,
            pipeline.jump
        );

        pc = LogicGate.mux(
            pc,
            pipeline.jAddr,
            pipeline.aluResult,   // jr
            pcJumpSrc
        );

        // Update PC WB Wire
        this._pcWb = pc;

        // $gp + length
        const incrementedGp = LogicGate.addALU32(
            this._gpWf,
            this._wb.len
        );
        const string = this._wb.string;
        const aluResult = LogicGate.mux(
            pipeline.aluResult,
            incrementedGp,
            string
        );

        // data mem
        this._mainMemory.write(
            pipeline.aluResult,
            pipeline.writeData,
            pipeline.memRead,
            pipeline.memWrite,
            clk
        );

        const readData = LogicGate.merge(
            this._mainMemory.dataOut4,
            this._mainMemory.dataOut3,
            this._mainMemory.dataOut2,
            this._mainMemory.dataOut1
        );

        // update MEM → WB pipeline
        this._memToWb.write({

            pc: pipeline.pc,

            regWrite: pipeline.regWrite,
            memToReg: pipeline.memToReg,

            aluResult: aluResult,
            readData: readData,

            OvF: pipeline.OvF,
            shifted: pipeline.shifted,
            syscallOp: pipeline.syscallOp,

            writeReg: pipeline.writeReg
        },
            clk
        );

    }

    execAlu(clk) {
        const pipeline = this._idToEx;

        // pc
        const pcWbIncremented = LogicGate.addALU32(
            this._pcWb,
            '00000000000000000000000000000001'
        );
        // // pc ≤ 4 (pc = 0 or pc = 0 + 4)
        // const pcLeqFour = LogicGate.zero(
        //     LogicGate.split(pipeline.pc, 29)[0]
        // );
        // const pc = LogicGate.mux(
        //     pipeline.pc,
        //     pcWbIncremented,
        //     pcLeqFour
        // )
        // pc = 0 + 4
        const pcEqFour = LogicGate.eq(
            pipeline.pc,
            '00000000000000000000000000000100'
        );
        const pc = LogicGate.mux(
            pipeline.pc,
            pcWbIncremented,
            pcEqFour
        )

        // branch pc
        const shiftedImmediate = LogicGate.shiftLeftTwo(pipeline.immediate, '1');
        const branchPc = LogicGate.addALU32(shiftedImmediate, pipeline.pc);

        // writeReg (pipelining to wb)
        // regDst mux
        const writeReg = LogicGate.mux(
            pipeline.rt,    // 00
            pipeline.rd,    // 01
            this.RA_ADDRESS,   // 10
            pipeline.regDst
        );

        // forwarding unit
        const forward = this.forwardingUnit(
            pipeline.rs,
            pipeline.rt,
            this._exToMem.regWrite,
            this._exToMem.writeReg,
            this._exToMem.aluResult,
            this._wb.regWrite,
            this._wb.writeReg,
            this._wb.writeData
        );

        // alu
        const funct = pipeline.funct;
        const aluOp = pipeline.aluOp;
        const aluControl = this.aluControl(funct, aluOp);
        const opcode = aluControl.opcode;

        const a = LogicGate.mux(
            pipeline.readData1,
            forward.forwardA,
            forward.forwardAEnable
        );

        const bForwardMux = LogicGate.mux(
            pipeline.readData2,
            forward.forwardB,
            forward.forwardBEnable
        );
        // b aluSrc mux
        const b = LogicGate.mux(
            bForwardMux,
            pipeline.immediate,
            pipeline.aluSrc
        );

        const alu = this.alu(a, b, opcode);

        // Overflow
        const OvF = LogicGate.and(
            alu.overflow,
            LogicGate.not(
                aluControl.unsigned
            )
        );

        // shifter
        const shiftSrc = b;
        const shamt = LogicGate.mux(
            pipeline.rs,     // lui
            pipeline.shamt,  // shift logical
            pipeline.sl[1]   // shift logical?
        );

        const shifted = LogicGate.barrelShift(
            shiftSrc,
            shamt,
            pipeline.sl[0]  // shift right (srl)
        );

        // pipeline trap
        clk = LogicGate.and(
            clk,
            LogicGate.not(
                this.trap.pipelineTrap
            )
        );

        // update EX → MEM pipeline
        this._exToMem.write({
            jAddr: pipeline.jAddr,

            pc: pc,
            branchPc: branchPc,

            branch: pipeline.branch,
            bne: pipeline.bne,
            jump: pipeline.jump,
            jr: pipeline.jr,

            regWrite: pipeline.regWrite,
            zero: alu.zero,

            memRead: pipeline.memRead,
            memToReg: pipeline.memToReg,
            memWrite: pipeline.memWrite,

            aluResult: alu.result,
            writeData: pipeline.readData2,

            OvF: OvF,
            shifted: shifted,
            syscallOp: pipeline.syscallOp,

            writeReg: writeReg
        },
            clk
        );

    }

    instructionDecodeRegRead(clk) {
        const pipeline = this._ifToId;

        // Instruction
        const instruction = LogicGate.split(pipeline.instruction,
            6, // opcode
            5, // rs
            5, // rt
            5, // rd
            5, // shamt
            6  // funct
        );
        // Control
        const opcode = instruction[0];
        const funct = instruction[5];
        const control = this.control(opcode, funct);

        // PC STOP WB
        this._pcStopWb = control.pcStop;

        // jump address
        // 26 bits
        const jAddrRaw = LogicGate.split(pipeline.instruction,
            6, // ignore
            26 // jumpAddrRaw
        )[1];
        // 28 bits
        const jAddrTail = LogicGate.shiftLeftExtendTwo(jAddrRaw);
        // 4 bits
        const jAddrHead = LogicGate.split(pipeline.pc, 4)[0];
        // 32 bits
        const jAddr = LogicGate.merge(
            jAddrHead,
            jAddrTail
        );

        // Registers

        // Read Registers
        const rs = instruction[1];
        const rt = instruction[2];
        const rd = instruction[3];
        const readReg1 = rs;
        const readReg2 = LogicGate.mux(
            rt,
            this.GP_ADDRESS,
            this.trap.pipelineTrap
        );

        // Write Register
        const writeReg = this._wb.writeReg;

        // Write Signals
        const writeData = this._wb.writeData;
        const regWrite = this._wb.regWrite;

        // Update Register Memory
        this._registerMemory.write(readReg1, readReg2, writeReg, writeData, regWrite, clk);

        // signal extend immediate
        const immediate16 = LogicGate.split(pipeline.instruction, 16, 16)[1];
        const immediate32 = this.signalExtend(immediate16);

        const shamt = instruction[4];

        const readData1 = this._registerMemory.readData1;
        const readData2 = this._registerMemory.readData2;
        // syscall decode
        const syscallOp = this.syscallDecode(
            control.syscall,
            LogicGate.split(
                readData2,  // $v0
                28,         // ignore
                4           // syscall funct
            )[1]
        );

        // $gp wf (readData2)
        this._gpWf = readData2;

        // if opcode ≠ 0 (nor opcode = 0)  funct = opcode
        // if opcode = 0, (nor opcode = 1) funct = funct
        const nextFunct = LogicGate.mux(
            opcode,     // opcode
            funct,      // no opcode (r type)
            LogicGate.nor(
                LogicGate.split(
                    opcode
                )
            )
        );

        // pipeline trap
        clk = LogicGate.and(
            clk,
            LogicGate.not(
                this.trap.pipelineTrap
            )
        );

        // update ID → EX pipeline
        this._idToEx.write({
            jAddr: jAddr,
            pc: pipeline.pc,
            regDst: control.regDst,

            branch: control.branch,
            bne: control.bne,
            jump: control.jump,
            jr: control.jr,

            memRead: control.memRead,
            memToReg: control.memToReg,
            memWrite: control.memWrite,

            aluSrc: control.aluSrc,
            aluOp: control.aluOp,

            regWrite: control.regWrite,

            readData1: readData1,
            readData2: readData2,
            immediate: immediate32,

            sl: control.sl,
            rs: rs,
            shamt: shamt,
            syscallOp: syscallOp,

            funct: nextFunct,
            rt: rt,
            rd: rd
        },
            clk
        );

    }

    instructionFetch(clk) {

        // read PC Block
        const pcBlock = this._pcBlock.q;

        // update PC Block
        this._pcBlock.write(
            this._pcStopWb,
            this._pcStartWb,
            clk
        );

        // read PC
        const pc = LogicGate.mux(
            this._pc.q,
            this.NOP_ADDRESS,
            pcBlock
        );

        // PC Input
        const nextPc = this._pcWb;
        
        // write PC
        this._pc.write(
            nextPc,
            clk
        );

        // increment pc
        const pcIncrement = '00000000000000000000000000000100';     // 4

        const pcIncremented = LogicGate.addALU32(pc, pcIncrement);  // pc + 4

        // read instruction at current pc
        this._instructionMemory.write(pc, LogicGate.empty(32), '0', clk);
        const instruction = this._instructionMemory.dataOut;

        // update IF → ID pipeline
        this._ifToId.write(
            {
                pc: pcIncremented,
                instruction: instruction
            },
            clk
        );

    }


    /*----------  Gates  ----------*/

    alu(a, b, opcode) {
        // 4 bit opcode = (1)aInvert (1)bNegate (2)operation
        const opcodes = LogicGate.split(opcode);
        const aInvert = opcodes[0];
        const bNegate = opcodes[1];
        const operation = LogicGate.merge(opcodes[2], opcodes[3]);

        let cin = bNegate;
        let result = '';
        let alu;
        // standard alu array
        for (let i = 31; i > 0; i--) {
            alu = LogicGate.singleBitAlu(a[i], b[i], '0', cin, aInvert, bNegate, operation);
            cin = alu.cout;
            result = alu.result + result;
        }
        // bottom alu
        alu = LogicGate.bottomSingleBitAlu(a[0], b[0], '0', cin, aInvert, bNegate, operation);
        result = alu.result + result;

        // update first alu with bottom alu's set on slt
        let lsb = result[31];
        lsb = LogicGate.mux(lsb, lsb, lsb, alu.set, operation);
        result = StringReader.replaceAt(result, lsb, 31);

        return {
            result: result,
            overflow: alu.overflow,
            zero: LogicGate.zero(result)
        };
    }

    aluControl(funct, aluOp) {

        const f5 = funct[0];
        const f4 = funct[1];
        const f3 = funct[2];
        const f2 = funct[3];
        const f1 = funct[4];
        const f0 = funct[5];


        // output
        // 0000 AND
        // 0001 OR
        // 0010 ADD
        // 0110 SUB
        // 0111 SLT
        // 1100 NOR

        // aluOp
        // 00 → add
        // 01 → sub
        // 10 → R-type; defer to funct*     *(some I-type also; still defer to funct)

        // inputs:
        // add     R   0x20 = 100000
        // addu    R   0x09 = 001001
        // and     R   0x24 = 100100 
        // andi    I   0x0c = 001100
        // nor     R   0x27 = 100111
        // or      R   0x25 = 100101
        // ori     I   0x0d = 001101
        // slt     R   0x2a = 101010
        // sub     R   0x22 = 100010
        // subu    R   0x23 = 100011

        // nor
        const op3 = LogicGate.and(
            f2,
            f1,
            f0
        );

        // invert
        const op2 = f1;

        // op1: arith/~logic
        const logic = f2;
        // arith
        const op1 = LogicGate.not(logic);

        // or (excludes nor)
        const op0 = LogicGate.and(
            // f2 = f0
            LogicGate.xnor(
                f2,
                f0
            ),
            // (f2/f0) ≠ f1
            LogicGate.xor(
                f2,
                f1
            ),
            LogicGate.or(
                f3,
                f2
            )
        );

        const rOpcode = LogicGate.merge(op3, op2, op1, op0);
        const addOpcode = '0010';
        const subOpcode = '0110';

        const opcode = LogicGate.mux(
            addOpcode,
            subOpcode,
            rOpcode,
            aluOp
        );

        const unsigned = LogicGate.and(
            LogicGate.not(f2),
            f0
        );

        return {
            opcode: opcode,
            unsigned: unsigned
        }
    }


    control(opcode, funct) {

        let rType = LogicGate.nor(
            opcode[0],
            opcode[1],
            opcode[2],
            opcode[3],
            opcode[4],
            opcode[5]
        );

        let iType = LogicGate.or(
            opcode[0],
            opcode[1],
            opcode[2],
            opcode[3]
        );

        // 00001
        let jType = LogicGate.and(
            LogicGate.not(iType),
            opcode[5]
        );

        // opcode = 00001x (j or jal)
        let jump = LogicGate.and(
            LogicGate.not(opcode[0]),
            LogicGate.not(opcode[1]),
            LogicGate.not(opcode[2]),
            LogicGate.not(opcode[3]),
            opcode[4]
        );
        // write $ra
        let jal = LogicGate.and(
            jump,
            opcode[5]
        );

        // regDst:
        // 00 → write rt
        // 01 → write rd
        // 10 → write $ra
        let regDst = LogicGate.merge(
            jal,
            rType
        );
        // opcode = 00010x
        let someBranch = LogicGate.and(
            LogicGate.not(opcode[0]),
            LogicGate.not(opcode[1]),
            LogicGate.not(opcode[2]),
            opcode[3],
            LogicGate.not(opcode[4])
        );
        // opcode = 0x4 = 000100
        let branch = LogicGate.and(
            someBranch,
            LogicGate.not(opcode[5])
        );
        // opcode = 0x5 = 000101
        let bne = LogicGate.and(
            someBranch,
            opcode[5]
        );
        // funct = 0x8 = 001000
        let jr = LogicGate.and(
            rType,
            LogicGate.not(funct[0]),
            LogicGate.not(funct[1]),
            funct[2],
            LogicGate.not(funct[3]),
            LogicGate.not(funct[4]),
            LogicGate.not(funct[5])
        );
        // any branch or jump instruction
        let pcStop = LogicGate.or(
            branch,
            bne,
            jump,
            jr
        )
        // opcode = 0x2b = 101011 (sw)
        let memWrite = LogicGate.and(
            opcode[0],
            LogicGate.not(opcode[1]),
            opcode[2],
            LogicGate.not(opcode[3]),
            opcode[4],
            opcode[5],
        );
        // 1x0011
        let memRead = LogicGate.and(
            opcode[0],
            LogicGate.not(opcode[2]),
            LogicGate.not(opcode[3]),
            opcode[4],
            opcode[5],
        );
        // funct = 0000x0
        let sl0 = LogicGate.nor(
            LogicGate.not(rType),
            funct[0],
            funct[1],
            funct[2],
            funct[3],
            funct[5]
        );
        // Right: funct = 000010
        let sl1 = LogicGate.and(sl0, opcode[4]);
        let sl = LogicGate.merge(sl1, sl0);

        let lui = LogicGate.and(
            opcode[2],
            opcode[3],
            opcode[4],
            opcode[5]
        )

        // 00 alu result
        // 01 read result (lw or syscall)
        // 10 sl
        // 11 jal
        let memToReg = LogicGate.merge(
            LogicGate.or(
                sl0,
                lui,
                jal
            ),
            LogicGate.or(
                memRead,
                jal
            )
        );

        let aluSrc = iType;

        // opcode = 0x33 = 110011
        let syscall = LogicGate.and(
            memRead,
            opcode[1]
        );

        // xx110x
        let aluImmediate = LogicGate.and(
            opcode[2],
            opcode[3],
            LogicGate.not(opcode[4])
        )
        let aluOp1 = LogicGate.or(
            rType,
            aluImmediate
        );
        // may need to be high for other conditions too, not sure
        let aluOp0 = branch;

        let aluOp = LogicGate.merge(aluOp1, aluOp0);

        // (jal OR ~pcStop) AND ~sw AND ~jr AND ~j
        let regWrite = LogicGate.nor(
            LogicGate.and(
                LogicGate.not(jal),
                pcStop
            ),
            memWrite,
            jr,
            jump
        );

        return {
            regDst: regDst,

            branch: branch,
            bne: bne,
            jump: jump,
            jr: jr,
            pcStop: pcStop,

            memWrite: memWrite,
            memRead: memRead,
            memToReg: memToReg,

            aluSrc: aluSrc,

            sl: sl,
            syscall: syscall,

            aluOp: aluOp,
            regWrite: regWrite
        };
    }

    forwardingUnit(rs, rt, memRegWrite, memWriteReg, memAluResult, wbRegWrite, wbWriteReg, wbWriteData,) {

        const memEnable = memRegWrite;
        const wbEnable = wbRegWrite;

        /*----------  forward A  ----------*/
        const rsEqMemWriteReg = LogicGate.eq(
            memWriteReg,
            rs
        );
        const rsEqWbWriteReg = LogicGate.eq(
            wbWriteReg,
            rs
        );
        // enable
        const forwardAEnable = LogicGate.or(
            LogicGate.and(
                memEnable,
                rsEqMemWriteReg
            ),
            LogicGate.and(
                wbEnable,
                rsEqWbWriteReg
            )
        );
        const forwardA = LogicGate.mux(
            wbWriteData,
            memAluResult,
            rsEqMemWriteReg
        );

        /*----------  forward B  ----------*/
        const rtEqMemWriteReg = LogicGate.eq(
            memWriteReg,
            rt
        );
        const rtEqWbWriteReg = LogicGate.eq(
            wbWriteReg,
            rt
        );
        const forwardBEnable = LogicGate.or(
            LogicGate.and(
                memEnable,
                rtEqMemWriteReg
            ),
            LogicGate.and(
                wbEnable,
                rtEqWbWriteReg
            )
        );
        const forwardB = LogicGate.mux(
            wbWriteData,
            memAluResult,
            rtEqMemWriteReg
        );

        return {
            forwardAEnable: forwardAEnable,
            forwardA: forwardA,
            forwardBEnable: forwardBEnable,
            forwardB: forwardB
        }
    }

    signalExtend(bitstring16) {
        return LogicGate.merge(
            LogicGate.empty(16),
            bitstring16
        );
    }

    syscallDecode(syscall, funct) {
        const sysout = LogicGate.and(
            syscall,
            LogicGate.or(
                funct[2],
                LogicGate.xor(
                    funct[1],
                    funct[3]
                )
            )
        );
        const sysin = LogicGate.and(
            syscall,
            LogicGate.or(
                funct[0],
                LogicGate.and(
                    funct[1],
                    funct[3]
                )
            )
        );
        // int/~string
        const int = funct[3];

        return LogicGate.merge(
            sysout,
            sysin,
            int
        );
    }

    /*----------  Boot up  ----------*/
    writeBootupInstructions() {

        /*
         * Instructions
         */
        
        const NOP = '00000000000000000000000000000000';
        const lui = (rt, imm) => {
            const op = "001111";
            const shamt = "10000";
            return LogicGate.merge(
                op,shamt,rt,imm
            );
        }
        const ori = (rt, imm) => {
            const op = "001101";
            return LogicGate.merge(
                op,rt,rt,imm
            );
        }
        const jump = (jAddr) => {
            const op = '000010';
            const encodedJAddr = LogicGate.split(
                LogicGate.shiftRightReduceTwo(jAddr), 
                4, 26
            )[1];
            
            return LogicGate.merge(
                op,encodedJAddr
            );
        }

        // $gp = 0x 1000 8000

        // lui $gp, 0x 1000
        const LOAD_GLOBAL_POINTER_UPPER = lui(
            '11100',            // $gp addr = 0x28
            '0001000000000000'  // 0x 1000
        );
        // ori $gp, 0x 8000
        const LOAD_GLOBAL_POINTER_LOWER = ori(
            '11100',            // $gp addr = 0x28
            '1000000000000000'  // 0x 1000
        );

        // $sp = 0x 7fff fffc

        // lui $sp, 0x 7fff
        const LOAD_STACK_POINTER_UPPER = lui(
            '11101',            // $sp addr = 0x29
            '0111111111111111'  // 0x 7fff
        );
        // ori $sp, 0x fffc
        const LOAD_STACK_POINTER_LOWER = ori(
            '11101',            // $sp addr = 0x29
            '1111111111111100'  // 0x fffc
        );
        // $ra = 0x 003f fff8 → addr of syscall EXIT program
        // lui $ra, 0x 003f
        const LOAD_RETURN_ADDRESS_UPPER = lui(
            '11111',            // $ra addr = 0x31
            '0000000000111111'  // 0x 003f
        );
        // ori $ra, 0x fff8
        const LOAD_RETURN_ADDRESS_LOWER = ori(
            '11111',            // $ra addr = 0x31
            '1111111111111000'  // 0x fff8
        );

        // $v0 = 0x 0000 000a → syscall EXIT
        const LOAD_SYSCALL_EXIT_ARGUMENT_UPPER = lui(
            '00010',            // $v0 addr = 0x02
            '0000000000000000'  // 0x 0000
        );
        const LOAD_SYSCALL_EXIT_ARGUMENT_LOWER = ori(
            '00010',            // $v0 addr = 0x02
            '0000000000001010'  // 0x 000a
        );
        const SYSCALL = LogicGate.merge(
            '110011','11100','00010','0000000000000000'
        );

        // pc = 0x 0040 0000
        const JUMP_TO_PROGRAM_START = jump(
            '00000000010000000000000000000000'
        );

        // load $gp
        this._instructionMemory._data['00000000000000000000000000000001'] = LOAD_GLOBAL_POINTER_UPPER;
        this._instructionMemory._data['00000000000000000000000000000010'] = NOP;
        this._instructionMemory._data['00000000000000000000000000000011'] = LOAD_GLOBAL_POINTER_LOWER;

        // load $sp
        this._instructionMemory._data['00000000000000000000000000000100'] = LOAD_STACK_POINTER_UPPER;
        this._instructionMemory._data['00000000000000000000000000000101'] = NOP;
        this._instructionMemory._data['00000000000000000000000000000110'] = LOAD_STACK_POINTER_LOWER;

        // load $ra
        this._instructionMemory._data['00000000000000000000000000000111'] = LOAD_RETURN_ADDRESS_UPPER;
        this._instructionMemory._data['00000000000000000000000000001000'] = NOP;
        this._instructionMemory._data['00000000000000000000000000001001'] = LOAD_RETURN_ADDRESS_LOWER;

        // jump to program start
        this._instructionMemory._data['00000000000000000000000000001010'] = JUMP_TO_PROGRAM_START;

        // exit program
        this._instructionMemory._data['00000000001111111111111111111000'] = LOAD_SYSCALL_EXIT_ARGUMENT_UPPER;
        this._instructionMemory._data['00000000001111111111111111111001'] = NOP;
        this._instructionMemory._data['00000000001111111111111111111010'] = LOAD_SYSCALL_EXIT_ARGUMENT_LOWER;
        this._instructionMemory._data['00000000001111111111111111111011'] = NOP;
        this._instructionMemory._data['00000000001111111111111111111100'] = NOP;
        this._instructionMemory._data['00000000001111111111111111111101'] = NOP;
        this._instructionMemory._data['00000000001111111111111111111110'] = SYSCALL;
    }

    bootup() {
        console.log("START BOOTUP");
        printObject(this);
        const numBootupInstructions = 10;
        const bootupCycleOffset = 4;
        const numCycles = numBootupInstructions + bootupCycleOffset + 4 - 1;
        for (let i = 0; i < numCycles; i++) {
            console.log('cycle ', i);
            this.write('0');
            this.write('1');
            this.write('0');
            console.log(this._ifToId.pc);
            console.log(this._idToEx.pc);
            console.log(this._exToMem.pc);
            console.log(this._pcWb);
        }
        console.log("END BOOTUP");
        printObject(this);
    }

    /*----------  Helpers  ----------*/

    setInstructions(instructions) {
        this._instructionMemory.setData(instructions);
    }

    setInstruction(address, instruction) {
        this._instructionMemory.push(address, instruction);
    }

    input(input) {
        this.io.input(input);
        this.writeBack('0');
        this.writeBack('1');
        this.writeBack('0');
    }

    registers() {
        return this._registerMemory.getData();
    }

    stackAtPointer() {
        const stackPointerAddr = '11101'; // 31
        const stackPointer = this._registerMemory.dataAt(stackPointerAddr);
        let pointer = stackPointer;
        const dataOut1 = this._mainMemory.dataAt(pointer);
        pointer = LogicGate.incrementer32(pointer);
        const dataOut2 = this._mainMemory.dataAt(pointer);
        pointer = LogicGate.incrementer32(pointer);
        const dataOut3 = this._mainMemory.dataAt(pointer);
        pointer = LogicGate.incrementer32(pointer);
        const dataOut4 = this._mainMemory.dataAt(pointer);
        return {
            stackPointer: stackPointer,
            dataOut4: dataOut4,
            dataOut3: dataOut3,
            dataOut2: dataOut2,
            dataOut1: dataOut1
        };
    }

}

class PipelineRegister extends ClockTriggeredGate {

    constructor(computer) {
        super();
        this.computer = computer;
    }
    write(input) {
        if (!Array.isArray(input)) {
            input = [...arguments];
        }
        const clk = input.pop();
        const wires = input;
        if (this.isClockPulse(clk)) {
            this.updateWires(...wires);
        }
        this.updateClockPulse(clk);
    }
}

class InstrFetchToInstrDecodePipeline extends PipelineRegister {
    constructor(computer) {
        super(computer);
        this.pc = LogicGate.empty(32);
        this.instruction = LogicGate.empty(32);
    }
    updateWires(wires) {
        this.pc = wires.pc;
        this.instruction = wires.instruction;
    }
}

class InstrDecodeToAluExPipeline extends PipelineRegister {
    constructor(computer) {
        super(computer);
        this.jAddr = LogicGate.empty(32);
        this.pc = LogicGate.empty(32);
        this.regDst = LogicGate.empty(2);   // 2 bits

        this.branch = LogicGate.empty(1);
        this.bne = LogicGate.empty(1);
        this.jump = LogicGate.empty(1);
        this.jr = LogicGate.empty(1);

        this.memRead = LogicGate.empty(1);
        this.memToReg = LogicGate.empty(2); // 2 bits
        this.memWrite = LogicGate.empty(1);

        this.aluSrc = LogicGate.empty(1);
        this.aluOp = LogicGate.empty(2);    // 2 bits

        this.regWrite = LogicGate.empty(1);

        this.readData1 = LogicGate.empty(32);
        this.readData2 = LogicGate.empty(32);
        this.immediate = LogicGate.empty(32);

        this.sl = LogicGate.empty(2);
        this.rs = LogicGate.empty(5);
        this.shamt = LogicGate.empty(5);
        this.syscallOp = LogicGate.empty(3);

        this.funct = LogicGate.empty(6);
        this.rt = LogicGate.empty(5);
        this.rd = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.jAddr = wires.jAddr,
            this.pc = wires.pc;
        this.regDst = wires.regDst;

        this.branch = wires.branch;
        this.bne = wires.bne;
        this.jump = wires.jump;
        this.jr = wires.jr;

        this.memRead = wires.memRead;
        this.memToReg = wires.memToReg;
        this.memWrite = wires.memWrite;

        this.aluSrc = wires.aluSrc;
        this.aluOp = wires.aluOp;

        this.regWrite = wires.regWrite;

        this.readData1 = wires.readData1;
        this.readData2 = wires.readData2;
        this.immediate = wires.immediate;

        this.sl = wires.sl;
        this.rs = wires.rs;
        this.shamt = wires.shamt;
        this.syscallOp = wires.syscallOp;

        this.funct = wires.funct;
        this.rt = wires.rt;
        this.rd = wires.rd;
    }
}

class AluExToMemPipeline extends PipelineRegister {
    constructor(computer) {
        super(computer);
        this.jAddr = LogicGate.empty(32);
        this.pc = LogicGate.empty(32);
        this.branchPc = LogicGate.empty(32);

        this.branch = LogicGate.empty(1);
        this.bne = LogicGate.empty(1);
        this.jump = LogicGate.empty(1);
        this.jr = LogicGate.empty(1);

        this.regWrite = LogicGate.empty(1);
        this.zero = LogicGate.empty(1);

        this.memRead = LogicGate.empty(1);
        this.memToReg = LogicGate.empty(2);
        this.memWrite = LogicGate.empty(1);

        this.aluResult = LogicGate.empty(32);
        this.writeData = LogicGate.empty(32);

        this.OvF = LogicGate.empty(1);
        this.shifted = LogicGate.empty(32);
        this.syscallOp = LogicGate.empty(3);

        this.writeReg = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.jAddr = wires.jAddr;

        this.pc = wires.pc;
        this.branchPc = wires.branchPc;

        this.branch = wires.branch;
        this.bne = wires.bne;
        this.jump = wires.jump;
        this.jr = wires.jr;

        this.regWrite = wires.regWrite;
        this.zero = wires.zero;

        this.memRead = wires.memRead;
        this.memToReg = wires.memToReg;
        this.memWrite = wires.memWrite;

        this.aluResult = wires.aluResult;
        this.writeData = wires.writeData;

        this.OvF = wires.OvF;
        this.shifted = wires.shifted;
        this.syscallOp = wires.syscallOp;

        this.writeReg = wires.writeReg;
    }
}

class MemToWriteBackPipeline extends PipelineRegister {
    constructor(computer) {
        super(computer);
        this.pc = LogicGate.empty(32);

        this.regWrite = LogicGate.empty(1);
        this.memToReg = LogicGate.empty(2);

        this.aluResult = LogicGate.empty(32);
        this.readData = LogicGate.empty(32);

        this.OvF = LogicGate.empty(1);
        this.shifted = LogicGate.empty(32);
        this.syscallOp = LogicGate.empty(3);

        this.writeReg = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.pc = wires.pc;

        this.regWrite = wires.regWrite;
        this.memToReg = wires.memToReg;

        this.aluResult = wires.aluResult;
        this.readData = wires.readData;

        this.OvF = wires.OvF;
        this.shifted = wires.shifted;
        this.syscallOp = wires.syscallOp;

        this.writeReg = wires.writeReg;
    }
}

class WriteBack {
    constructor(computer) {
        this.computer = computer;
        this.string = LogicGate.empty(1);
        this.regWrite = LogicGate.empty(1);
        this.writeData = LogicGate.empty(32);
        this.writeReg = LogicGate.empty(5);
        this.len = LogicGate.empty(32);
    }
    write(wires) {
        this.string = wires.string;
        this.regWrite = wires.regWrite;
        this.writeData = wires.writeData;
        this.writeReg = wires.writeReg;
        this.len = wires.len;
    }
}

