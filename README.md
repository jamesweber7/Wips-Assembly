# weber-assembly
Logic gates simulated in javascript which work their way up to a MIPS32 computer.
Current Schematic: ![Schematic](/mipsSchematic01.png)
Schematic I am working on implementing: ![Schematic](/mipsSchematic02.png)
## mips model
The general model of the computer is based on the schematics in Computer Organization and Design: The Hardware/Software Interface. This is the textbook my Assembly Language Programming class (CSE 230 @ ASU) uses, and it seems to be the most popular resource for MIPS and RISC architectures. Design implementations beyond the scope of the textbook I took from miscellaneous resources or made up myself.
## use
Right now you'll need to import scripts from [Toolkit.js](https://github.com/jamesweber7/Toolkit.js). When I finish working on the MIPS computer soon, I'll import the minified scripts I need into this repository
## includes
* The MIPS computer currently supports machine code instructions for: add, sub, addi, and, or, ori, nor, slt, beq, lw, sw.
* Also includes a 4-bit brainless cpu that I used as a prototype before tackling mips.
## coming soon
* Some Hazard Detection
* Support for more (although not all) [mips commands](https://inst.eecs.berkeley.edu/~cs61c/resources/MIPS_Green_Sheet.pdf)
* Compilation of actual assembly code
* UI to write code and visualize the registers, and possibly a visualization of the computer if I don't get bored of this project by then
* I think it would be cool to make a custom computer, but I'm not sure whether I'll get to that