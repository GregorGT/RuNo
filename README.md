# Tauri + React + Typescript

Easiest to use and most versatile data processing and data view application.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)


# Installation

## On Windows
1.) Install NodeJS <br>
to get the npm package manager <br>
https://nodejs.org/en<br>

2.) Install Yarn<br>
npm install --global yarn<br>
Check the installation on Windows via<br>
yarn --version<br>

3.) Get GIT and clone the repository<br>

# Running & Compilation

## On Windows
Open a bash command line window.<br>
Goto to the cloned repository:<br>
1.) Type: <br>
Yarn<br>
2.) Type:<br>
Yarn tauri <br>
or<br>
Yarn tauri dev

## Versions:
rustc is version <br>
rustc 1.83.0 (90b35a623 2024-11-26)

yarn is version <br>
1.22.21

## Usage of formulas

Please follow the function name, description and example strictly, no spaces for ELSE{} and upper case always

Function		
MIN,	finds min number from selected numbers or single number,	MIN(1,2) , MIN(EVAL("test some {NUMBER}"),177)

MAX,	finds max number from selected numbers or single number,	MAX(1,2) , MAX(EVAL("test some {NUMBER}"),177)

TYPE,	returns type of data,	TYPE(MAX(1,2)) , TYPE("hello")

LEN,	works on TEXT finding patterns as well as text,	LEN(EVAL("name: {TEXT}")) LEN("5char")

COUNT,	gives the count of element found,	COUNT(EVAL("name {TEXT}"))

CONCAT,	concat strings takes eval or string,	CONCAT(EVAL("my {TEXT}"),"OTHER") CONCAT("ONE","TWO")

MUL(EVAL_TABLE("A1:B1", "NUMBER")) (Multiplies over all given elments)

SUM("1", EVAL("First heading {NUMBER}")) (Sums over all given elements)

TRIM,	trims text,	TRIM("HELLO   ")

EVAL("Search text {NUMBER/DATE/TEXT}") Collects all elements starting with the search text followed by a Number/DATE/TEXT

EVAL_TABLE("Tablename" (optional), "A1:A3", "NUMBER") Collects all elements inside a table with table name "Tablename" as an optional parameter (IF not given the current table is selected), "A1:A3" - Cells and the type of the evaluation "NUMBER", which can be NUMBER, DATE, or TEXT

ROUND,	rounds the values for numbers, 	ROUND(15.2) MIN(EVAL("test some {NUMBER}"))

AVERAGE,	average the list of numbers, 	AVERAGE(EVAL("test some {NUMBER}"),177)

IF,	compare both side and evaluate the output,	IF( SUM(EVAL("hello test some {NUMBER}"))>=15){SUM(1)}ELSE{SUM(MUL(SUMIF(EVAL("hello test some {NUMBER}")=15),2)1)}

SUMIF,	sum all the values which are true based on condition,	SUMIF(EVAL("test some {NUMBER}" > 15))

COUNTIF,	Similar as sumif but count true statements,	COUNTIF(EVAL("test some {NUMBER}" > 15))

ERRORIF,	error if founds error run the first condition,	ERRORIF(EVAL("a")){SUM(12 ,2)}ELSE{SUM(15)}
