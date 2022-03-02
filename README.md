# weber-assembly
Logic gates simulated in javascript which work their way up to a MIPS32 computer.
Schematic: ![Schematic](/mipsSchematic04.png)
## mips model
The general model of the computer is based on the schematics in Computer Organization and Design: The Hardware/Software Interface. This is the textbook my Assembly Language Programming class (CSE 230 @ ASU) uses, and it seems to be the most popular resource for MIPS and RISC architectures. Design implementations beyond the scope of the textbook I took from miscellaneous resources or made up myself.
## use
Right now you'll need to import scripts from [Toolkit.js](https://github.com/jamesweber7/Toolkit.js). When I finish working on the MIPS computer soon, I'll import the minified scripts I need into this repository
## instructions
The mips computer definitely still needs tweaks, but it (should) currently support the machine code for:
- add
- addi
- addu
- and     
- andi       
- beq        
- bne        
- j          
- jal        
- jr         
- lui        
- lw         
- syscall    
- nor     
- or      
- ori        
- slt     
- slti       
- sll     
- srl     
- sw         
- sub     
- subu   
  
And it is ready for a compiler which could implement the pseudo instrucions:
- syscall
- blt
- ble
- bgt
- bge
- move
- nop
## coming soon
- Compilation of actual assembly code
- UI to write code and visualize the registers, and possibly a visualization of the computer if I don't get bored of this project by then
- I think it would be cool to make a custom computer, but I'm not sure whether I'll get to that