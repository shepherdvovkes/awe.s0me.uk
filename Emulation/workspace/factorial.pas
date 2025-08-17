program Factorial;
var
    n, i, fact: integer;
begin
    writeln('Enter a number: ');
    readln(n);
    fact := 1;
    
    for i := 1 to n do
        fact := fact * i;
    
    writeln('Factorial of ', n, ' is ', fact);
end.