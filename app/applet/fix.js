const fs = require('fs');
let content = fs.readFileSync('src/lib/mathGenerator.ts', 'utf8');

content = content.replace(/q = `\$\{n1\}과\(와\) \$\{n2\}의 최대 공약수는\?`;/g, 'q = `${n1}, ${n2}`;');
content = content.replace(/q = `\$\{n1\}과\(와\) \$\{n2\}의 공배수`;/g, 'q = `${n1}, ${n2}`;');
content = content.replace(/q = `\$\{n1\},\$\{n2\}의 최소 공배수는\?`;/g, 'q = `${n1}, ${n2}`;');
content = content.replace(/q = `FRAC\(\$\{num\},\$\{den\}\) 와 크기가 같은 분수를 하나 구하시오\. \(분모, 분자에 \$\{m\}을 곱하기\)`;/g, 'q = `FRAC(${num},${den})`;');
content = content.replace(/q = `FRAC\(\$\{num\},\$\{den\}\) 을\(를\) 기약분수로 나타내시오\.`;/g, 'q = `FRAC(${num},${den})`;');
content = content.replace(/q = `FRAC\(\$\{num1\},\$\{den1\}\) , FRAC\(\$\{num2\},\$\{den2\}\) 을\(를\) 통분하시오\. \(쉼표로 구분\)`;/g, 'q = `FRAC(${num1},${den1}) , FRAC(${num2},${den2})`;');
content = content.replace(/q = `FRAC\(\$\{num\},\$\{den\}\) 을\(를\) 소수로 나타내시오\.`;/g, 'q = `FRAC(${num},${den})`;');

fs.writeFileSync('src/lib/mathGenerator.ts', content);
