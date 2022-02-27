
// for state machines, I decided to go OO

class ClockTriggeredGate {
    constructor() {
        this._clk = '0';
    }
    // rising edge trigger
    isClockPulse(clk, pClk=this._clk) {
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

    constructor(numBits=1) {
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

class S_R_FlipFlop extends ClockTriggeredGate {
    constructor() {
        super();
        this.q = '0';
        this.notq = '1';
    }

    write(s, r, clk) {
        // on clk pulse
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(
                LogicGate.and(s, r)
            )) {
                throw "s and r can't both be high";
            }

            // Q⁺ = S+QR'
            this.q = LogicGate.or(
                s,
                LogicGate.and(
                    this.q,
                    LogicGate.not(r)
                )
            );
            this.notq = LogicGate.not(this.q);
        }
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

class Ram extends ClockTriggeredGate {

    constructor(data) {
        super();
        this._data = data;
        this._size = data.length;
        this._regSize = data[0].length;
    }

    setData(data) {
        this._data = data;
    }

    dataAt(addr) {
        return LogicGate.mux(this._data, addr);
    }

    static randomized(regLength, numRegisters) {
        const data = new Array(numRegisters);
        for (let i = 0; i < data.length; i++) {
            data[i] = LogicGate.bitstringToPrecision(
                LogicGate.toBitString(
                    Wath.randomInt(0, 2**regLength - 1)
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
                LogicGate.toBitString(i),
                regLength
            );
        }
        return new this(data);
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

    static setData(data) {
        this._data = data;
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
class MipsDataRam extends SingleReadRam {
    write(addr, dataIn, read, write, clk) {
        this._addr = addr;
        if (this.isClockPulse(clk)) {
            if (LogicGate.bitToBool(write)) {
                this._data[
                    LogicGate.bitstringToDecimal(this._addr)
                ] = dataIn;
            }
        }
        if (LogicGate.bitToBool(read)) {
            this.dataOut = this.dataAt(this._addr);
        }
        this.updateClockPulse(clk);
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

    static setData(data) {
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
                LogicGate.toBitString(
                    Wath.randomInt(0, 2**regLength - 1)
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

class Mips {
    constructor() {
        // RAM
        // just 64 instructions for now, def gonna do a lot of work on this later
        const numInstructions = 64;
        const dataMemorySize = 64;
        this._instructionMemory = SingleReadRam.empty(32, numInstructions);
        // this._dataMemory = SingleReadRam.empty(32, dataMemorySize);
        this._dataMemory = SingleReadRam.randomized(32, dataMemorySize);
        this._registerMemory = MipsRegisterRam.indexValues(32, 32);
        // this._registerMemory = MipsRegisterRam.empty(32, 32);
        // PC
        this._pc = new D_FlipFlop(32);
        // Wires:
        this._pcWb = LogicGate.empty(32);

        // pipelines
        this._ifToId = new InstrFetchToInstrDecodePipeline();
        this._idToEx = new InstrDecodeToAluExPipeline();
        this._exToMem = new AluExToMemPipeline();
        this._memToWb = new MemToWriteBackPipeline();
        this._wb = new WriteBack();
    }

    write(clk) {
        this.writeBack(clk);
        this.mem(clk);
        this.execAlu(clk);
        this.instructionDecodeRegRead(clk);
        this.instructionFetch(clk);
    }

    
    /*----------  Pipelines  ----------*/

    writeBack(clk) {
        const pipeline = this._memToWb;

        const writeData = LogicGate.mux(
            pipeline.aluResult, 
            pipeline.readData, 
            pipeline.memToReg
        );

        // Update WB Wires
        this._wb.write({
                regDst: pipeline.regDst,
                regWrite: pipeline.regWrite,
                writeData: writeData,
                writeReg:pipeline.writeReg
            },
            clk
        );
    }

    mem(clk) {
        const pipeline = this._exToMem;
        
        // pc wb
        const pcSrc = LogicGate.and(
            pipeline.branch,
            pipeline.zero
        );
        const pc = LogicGate.mux(
            pipeline.pc,
            pipeline.branchPc,
            pcSrc
        );
        // Update PC WB Wire
        this._pcWb = pc;

        // data mem
        this._dataMemory.write(
            pipeline.aluResult, 
            pipeline.writeData, 
            pipeline.memWrite, 
            clk
        );
        const readData = this._dataMemory.dataOut;

        // update MEM → WB pipeline
        this._memToWb.write({
                regWrite: pipeline.regWrite,
                memToReg: pipeline.memToReg,
                regDst: pipeline.regDst,
                readData: readData,
                aluResult: pipeline.aluResult,
                writeReg: pipeline.writeReg
            },
            clk
        );
    }

    execAlu(clk) {
        const pipeline = this._idToEx;

        // pc
        const shiftedImmediate = LogicGate.shiftLeftTwo(pipeline.immediate, '1');
        const branchPc = LogicGate.addALU32(shiftedImmediate, pipeline.pc);

        // alu
        const funct = pipeline.funct;
        const aluOp = pipeline.aluOp;
        const opcode = this.aluControl(funct, aluOp);

        const a = pipeline.readData1;
        const b = LogicGate.mux(
            pipeline.readData2,
            pipeline.immediate,
            pipeline.aluSrc
        );
        const alu = this.alu(a, b, opcode);

        // writeReg (pipelining to wb)
        const writeReg = LogicGate.mux(
            pipeline.rt,
            pipeline.rd,
            pipeline.regDst
        );

        // update EX → MEM pipeline
        this._exToMem.write({
                pc: pipeline.pc,
                branchPc: branchPc,
                branch: pipeline.branch,
                regDst: pipeline.regDst,
                regWrite: pipeline.regWrite,
                zero: alu.zero,
                memRead: pipeline.memRead,
                memToReg: pipeline.memToReg,
                memWrite: pipeline.memWrite,
                aluResult: alu.result,
                writeData: pipeline.readData2,
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
        const control = this.control(opcode);

        // Registers

        // Read Registers
        const rs = instruction[1];
        const rt = instruction[2];
        const rd = instruction[3];
        const readReg1 = rs;
        const readReg2 = rt;

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

        // not doing anything with shamt yet
        const shiftAmt = instruction[4];
        const funct = instruction[5];

        // update ID → EX pipeline
        this._idToEx.write({
            pc: pipeline.pc, 
            regDst: control.regDst,
            branch: control.branch,
            memRead: control.memRead,
            memToReg: control.memToReg,
            memWrite: control.memWrite,
            aluSrc: control.aluSrc,
            regWrite: control.regWrite,
            readData1: this._registerMemory.readData1, 
            readData2: this._registerMemory.readData2,
            immediate: immediate32,
            funct: funct,
            aluOp: control.aluOp,
            rt: rt,
            rd: rd
        },
        clk);
    }

    instructionFetch(clk) {

        
        // READ PC
        const pc = this._pc.q;
        // UPDATE PC
        this._pc.write(
            this._pcWb,
            clk
        );

        console.log(pc);

        // increment pc
        const pcIncrement = '00000000000000000000000000000100';     // 4
        const pcIncremented = LogicGate.addALU32(pc, pcIncrement);  // pc + 4

        // read instruction at current pc
        this._instructionMemory.write(pc, LogicGate.empty(32), '0', clk);
        const instruction = this._instructionMemory.dataOut;

        // update IF → ID pipeline
        this._ifToId.write({
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

    aluControl(instruction, aluOp) {
        // need to add:
        // ori

        // only need instruction bits 3-0
        const f3 = instruction[2];
        const f2 = instruction[3];
        const f1 = instruction[4];
        const f0 = instruction[5];

        const aluOp1 = aluOp[0];
        const aluOp0 = aluOp[1];

        // Logic Friday: (F4-7 = op3-0; A-F = aluOp1, aluOp0, f3-f0
        // A: aluOp1
        // B: aluOp0
        // C: f3
        // D: f2
        // E: f1
        // F: f0

        // F4 = A E F; 
        // F5 = B  + A E ;
        // F6 = A'  + D' ;
        // F7 = A C  + A E' F;

        const op3 = 
        LogicGate.and(
            aluOp1,
            f1,
            f0
        );
        const op2 = 
        LogicGate.or(
            aluOp0,
            LogicGate.and(
                aluOp1,
                f1
            )
        );
        const op1 = LogicGate.nand(
            aluOp1,
            f2
        );
        const op0 = 
        LogicGate.and(
            aluOp1,
            LogicGate.or(
                f3,
                LogicGate.and(
                    LogicGate.not(f1),
                    f0
                )
            )
        );


        // const op3 = '0';
        // const op2 = 
        // LogicGate.or(
        //     aluOp0,
        //     LogicGate.and(
        //         LogicGate.not(f2),
        //         f1,
        //         LogicGate.not(f0)
        //     )
        // );
        // const op1 = 
        // LogicGate.nand(
        //     aluOp1,
        //     LogicGate.not(f3), 
        //     f2,
        //     LogicGate.not(f1)
        // );
        // const op0 = 
        // LogicGate.and(
        //     aluOp1,
        //     LogicGate.xor(f3,f2),
        //     LogicGate.xor(f1,f0),
        //     LogicGate.xnor(f3,f1)
        // );
        return LogicGate.merge(op3, op2, op1, op0);
    }

    // opcode control
    control(opcode) {
        // control wires missing:
        // bne
        // jump
        let regDst = LogicGate.empty(1);
        let branch = LogicGate.empty(1);
        let memRead = LogicGate.empty(1);
        let memToReg = LogicGate.empty(1);
        let aluOp = LogicGate.empty(2);    // 2 bits
        let memWrite = LogicGate.empty(1);
        let aluSrc = LogicGate.empty(1);
        let regWrite = LogicGate.empty(1);

        // R-format
        if (opcode === '000000') {
            regDst = '1'
            branch = '0'
            memRead = '0';
            memToReg = '0';
            aluOp = '10';
            memWrite = '0';
            aluSrc = '0';
            regWrite = '1';
        }
        // lw
        else if (opcode === '100011') {
            regDst = '0'
            branch = '0'
            memRead = '1';
            memToReg = '1';
            aluOp = '00';
            memWrite = '0';
            aluSrc = '1';
            regWrite = '1';
        }
        // sw
        else if (opcode === '101011') {
            regDst = '1'
            branch = '0'
            memRead = '0';
            memToReg = '0';
            aluOp = '00';
            memWrite = '1';
            aluSrc = '1';
            regWrite = '0';
        }
        // addi 0x8
        else if (opcode === '001000') {
            regDst = '0'
            branch = '0'
            memRead = '0';
            memToReg = '0';
            aluOp = '00';
            memWrite = '0';
            aluSrc = '1';
            regWrite = '1';
        }
        // beq
        else if (opcode === '000100') {
            regDst = '0'
            branch = '1'
            memRead = '0';
            memToReg = '0';
            aluOp = '01';
            memWrite = '0';
            aluSrc = '0';
            regWrite = '0';
        }
        // ori
        else if (opcode === '001101') {
            regDst = '0'    
            branch = '0'
            memRead = '0';
            memToReg = '0';
            aluOp = '00';
            memWrite = '0';
            aluSrc = '1';
            regWrite = '1';
        }
        // lui
        else if (opcode === '001111') {
            regDst = '0'    
            branch = '0'
            memRead = '0';
            memToReg = '0';
            aluOp = '00';
            memWrite = '0';
            aluSrc = '1';
            regWrite = '1';
        }
        

        return {
            regDst:     regDst,
            branch :    branch,
            memRead :   memRead,
            memToReg :  memToReg,
            aluOp :     aluOp,
            memWrite :  memWrite,
            aluSrc:     aluSrc,
            regWrite :  regWrite
        };
    }

    signalExtend(bitstring16) {
        return LogicGate.merge(
            LogicGate.empty(16),
            bitstring16
        );
    }

    
    /*----------  Helpers  ----------*/
    
    setInstructions(instructions) {
        this._instructionMemory.setData(instructions);
    }

}

class PipelineRegister extends ClockTriggeredGate {
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

class InstrFetchToInstrDecodePipeline extends PipelineRegister {
    constructor() {
        super();
        // starts at 3
        this.pc = '00000000000000000000000000000011';
        this.instruction = LogicGate.empty(32);
    }
    updateWires(wires) {
        this.pc = wires.pc;
        this.instruction = wires.instruction;
    }
}

class InstrDecodeToAluExPipeline extends PipelineRegister {
    constructor() {
        super();
        // starts at 2
        this.pc = '00000000000000000000000000000010';
        this.regDst = LogicGate.empty(1);
        this.branch = LogicGate.empty(1);
        this.memRead = LogicGate.empty(1);
        this.memToReg = LogicGate.empty(1);
        this.memWrite = LogicGate.empty(1);
        this.aluSrc = LogicGate.empty(1);
        this.regWrite = LogicGate.empty(1);
        this.readData1 = LogicGate.empty(32);
        this.readData2 = LogicGate.empty(32);
        this.immediate = LogicGate.empty(32);
        this.funct = LogicGate.empty(6);
        this.aluOp = LogicGate.empty(2);
        this.rt = LogicGate.empty(5);
        this.rd = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.pc = wires.pc;
        this.regDst = wires.regDst;
        this.branch = wires.branch;
        this.memRead = wires.memRead;
        this.memToReg = wires.memToReg;
        this.memWrite = wires.memWrite;
        this.aluSrc = wires.aluSrc;
        this.regWrite = wires.regWrite;
        this.readData1 = wires.readData1;
        this.readData2 = wires.readData2;
        this.immediate = wires.immediate;
        this.funct = wires.funct;
        this.aluOp = wires.aluOp;
        this.rt = wires.rt;
        this.rd = wires.rd;
    }
}

class AluExToMemPipeline extends PipelineRegister {
    constructor() {
        super();
        // starts at 1
        this.pc = '00000000000000000000000000000001';
        this.branchPc = LogicGate.empty(32);
        this.regDst = LogicGate.empty(1);
        this.branch = LogicGate.empty(1);
        this.regWrite = LogicGate.empty(1);
        this.zero = LogicGate.empty(1);
        this.memRead = LogicGate.empty(1);
        this.memToReg = LogicGate.empty(1);
        this.memWrite = LogicGate.empty(1);
        this.aluResult = LogicGate.empty(32);
        this.writeData = LogicGate.empty(32);
        this.writeReg = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.pc = wires.pc;
        this.branchPc = wires.branchPc;
        this.regDst = wires.regDst;
        this.branch = wires.branch;
        this.regWrite = wires.regWrite;
        this.zero = wires.zero;
        this.memRead = wires.memRead;
        this.memToReg = wires.memToReg;
        this.memWrite = wires.memWrite;
        this.aluResult = wires.aluResult;
        this.writeData = wires.writeData;
        this.writeReg = wires.writeReg;
    }
}

class MemToWriteBackPipeline extends PipelineRegister {
    constructor() {
        super();
        this.regWrite = LogicGate.empty(1);
        this.memToReg = LogicGate.empty(1);
        this.regDst = LogicGate.empty(1);
        this.readData = LogicGate.empty(32);
        this.aluResult = LogicGate.empty(32);
        this.writeReg = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.regWrite = wires.regWrite;
        this.memToReg = wires.memToReg;
        this.regDst = wires.regDst;
        this.readData = wires.readData;
        this.aluResult = wires.aluResult;
        this.writeReg = wires.writeReg;
    }
}

class WriteBack extends PipelineRegister {
    constructor() {
        super();
        this.regDst = LogicGate.empty(1);
        this.regWrite = LogicGate.empty(1);
        this.writeData = LogicGate.empty(32);
        this.writeReg = LogicGate.empty(5);
    }
    updateWires(wires) {
        this.regDst = wires.regDst;
        this.regWrite = wires.regWrite;
        this.writeData = wires.writeData;
        this.writeReg = wires.writeReg;
    }
}

