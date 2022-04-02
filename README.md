# wips-assembly
Logic gates simulated in javascript which work their way up to a MIPS32 computer.
Schematic: ![Schematic](/schematics/mipsSchematic07.png)
Try it out: https://Wips-Assembly.herokuapp.com
## why?
This project was to help me gain an understanding of pipelined RISC architectures, and I am definitely satisfied with the outcome. The result is not an efficient MIPS simulation, but a simulation which resembles an actual implementation as closely as possible. If you decide to browse the code, you will notice that it does not always resemble typical JavaScript conventions, and that is because I tried to make the code read how the computer computes... if that makes sense. Where operations occur in parallel, the respective code is adjacent. I tried to keep operations that occur in the same unit or level of abstraction within the same function. I also tried to have the parallel operations read in the same top-to-bottom order as the schematic.

## mips model
The general model of the computer is based on the schematics in Computer Organization and Design: The Hardware/Software Interface. This is the textbook my Assembly Language Programming class (CSE 230 @ ASU) uses, and its authors are as qualified as can be for teaching an introduction to MIPS architecture. Design implementations beyond the scope of the textbook are mostly my own, although they should closely resemble and stand as a good example of real-world MIPS implementations.
## supported instructions
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
- syscall - print/read int, print/read string, exit
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
- blt
- ble
- bgt
- bge
- move 

## not included
- Coprocessor for floating point arithmetic, multiplication, and division
  - I understand how I could implement a complex coprocessor, and I feel like the goal of this project - to better understand the pipelined RISC architecture - is well-satisfied without completing such an implementation.
- Branch Prediction
  - I would have liked to have implemented branch prediction, but I have ultimately spent too much time on this project.