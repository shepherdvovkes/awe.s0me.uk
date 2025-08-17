program Calculator;
var
    a, b: integer;
    choice: char;
begin
    writeln('Simple Calculator');
    writeln('Enter first number: ');
    readln(a);
    writeln('Enter second number: ');
    readln(b);
    writeln('Choose operation (+, -, *, /): ');
    readln(choice);
    
    case choice of
        '+': writeln('Result: ', a + b);
        '-': writeln('Result: ', a - b);
        '*': writeln('Result: ', a * b);
        '/': if b <> 0 then writeln('Result: ', a / b) else writeln('Division by zero!');
    else
        writeln('Invalid operation');
    end;
end.