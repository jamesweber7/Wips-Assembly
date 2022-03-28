# wips-assembly
Logic gates simulated in javascript which work their way up to a MIPS32 computer.
Schematic: ![Schematic](/schematics/mipsSchematic07.png)
Try it out: https://Wips-Assembly.herokuapp.com
## project vision
This project was to help me gain an understanding of the pipelined RISC architecture, and I am definitely satisfied with the outcome. The result is not an efficient MIPS simulation, but a simulation which resembles an actual implementation as closely as possible. If you decide to browse the code, you will notice that it does not always resemble typical JavaScript conventions, and that is because I tried to make the code read exactly the same as the computer. Where operations occur in parallel, the respective code is adjacent, where possible. I tried to keep operations occuring in the same unit or level of abstraction within the same function.
## mips model
The general model of the computer is based on the schematics in Computer Organization and Design: The Hardware/Software Interface. This is the textbook my Assembly Language Programming class (CSE 230 @ ASU) uses, and it is certainly the authoritative textbook for an introduction to MIPS architecture. Design implementations beyond the scope of the textbook are mostly my own, although they should closely resemble and stand as a good example of real-world MIPS implementations.
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

# not included
- Coprocessor for floating point arithmetic, multiplication, and division
  - I understand how I could implement a complex coprocessor, and I feel like the goal of this project - to better understand the pipelined RISC architecture - is well-satisfied without completing such an implementation.