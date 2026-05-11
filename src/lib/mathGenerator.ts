export function getMathPrompt(area: string): string {
  // 1학년 1학기
  if (area === '1_1_1_1') return '다음은 위에 적힌 수를 아래의 두 수로 가른 것입니다. 빈 곳에 알맞은 수를 쓰세요.';
  if (area === '1_1_1_2') return '위에 있는 두 수를 모으면 아래에 있는 수가 됩니다. 빈 곳에 알맞은 수를 쓰세요.';
  if (area === '1_1_1_3') return '덧셈을 하세요.';
  if (area === '1_1_1_5') return '뺄셈을 하세요.';
  if (area === '1_1_1_6') return 'ㅁ안에 알맞은 수를 써 넣으세요.';

  // 1학년 2학기
  if (area.startsWith('1_2_1_') && parseInt(area.split('_')[3]) <= 4) return '덧셈을 하세요.';
  if (area.startsWith('1_2_1_') && parseInt(area.split('_')[3]) >= 5) return '뺄셈을 하세요.';
  if (area === '1_2_2_1') return '세 수의 덧셈 결과를 구하세요.';
  if (area === '1_2_2_2') return '세 수의 뺄셈 결과를 구하세요.';
  if (area === '1_2_2_3') return '계산을 하세요.';
  if (area === '1_2_2_4') return '다음은 10을 두 수로 가른 것입니다. 빈 곳에 알맞을 수를 쓰세요.';
  if (area === '1_2_2_5') return '다음은 두 수를 모아 10을 만드는 것입니다. 빈 곳에 알맞은 수를 쓰세요.';
  if (area === '1_2_2_6') return '□안에 알맞은 수를 써 넣으세요.';
  if (area === '1_2_2_7') return '뺄셈을 하세요.';
  if (area === '1_2_2_8') return '합이 10이 되는 두 수를 먼저 더하고 나머지 수를 더하여 합을 구하세요.';
  if (area.startsWith('1_2_3_')) {
    if (area.includes('_1') || area.includes('_3')) return '덧셈을 하세요.';
    if (area.includes('_4') || area.includes('_6')) return '뺄셈을 하세요.';
    return '계산을 하세요.';
  }

  // 2학년 ~ 6학년 자동 생성 로직
  if (area.startsWith('2_2_1_')) {
    if (area.includes('_4') || area.includes('_5') || area.includes('_6')) return '□안에 알맞은 수를 써 넣으세요.';
    return '곱셈을 하세요.';
  }

  // 3학년
  if (area === '3_2_2_7' || area === '3_2_2_9' || area === '3_2_2_12') return '나눗셈의 몫과 나머지를 구하세요.';
  if (area === '3_2_3_1') return '대분수를 가분수로 나타내보세요.';
  if (area === '3_2_3_2') return '가분수를 대분수로 나타내보세요.';
  if (area === '3_2_3_3' || area === '3_2_3_4') return '두 분수의 크기를 비교하여 안에 >, <, =를 알맞게 써 넣으세요.';

  // 4학년
  if (area === '4_1_1_11' || area === '4_1_1_15' || area === '4_1_1_19' || area === '4_1_1_21') return '나눗셈의 몫과 나머지를 구하세요.';
  if (area === '4_2_1_1' || area === '4_2_1_2' || area === '4_2_1_3' || area === '4_2_1_4' || area === '4_2_1_9') return '두 분수의 합을 구하세요.';
  if (area === '4_2_1_5' || area === '4_2_1_6' || area === '4_2_1_7' || area === '4_2_1_8' || area === '4_2_1_10') return '두 분수의 뺄셈을 하세요.';

  // 5학년 약수와 배수
  if (area === '5_1_2_1') return '다음 수의 약수를 구하시오.';
  if (area === '5_1_2_2') return '다음 수의 배수를 작은 수부터 4개 구하세요.';
  if (area === '5_1_2_3') return '두 수의 공약수를 구하세요.';
  if (area === '5_1_2_4') return '두 수의 최대공약수를 구하세요.';
  if (area === '5_1_2_5') return '두 수의 공배수를 작은 것부터 3개 쓰세요.';
  if (area === '5_1_2_6') return '두 수의 최소공배수를 구하세요.';

  // 5학년 약분과 통분
  if (area === '5_1_3_1') return '주어진 분수와 크기가 같은 분수를 하나 구하세요.';
  if (area === '5_1_3_3') return '다음 분수를 기약분수로 나타내세요.';
  if (area === '5_1_3_4') return '분모의 곱을 공통분모로 하여 두 분수를 통분하세요.';
  if (area === '5_1_3_5') return '최소공배수를 공통분모로 하여 두 분수를 통분하세요.';
  if (area === '5_1_3_7') return '다음 분수를 소수로 나타내세요.';
  if (area === '5_1_3_8') return '다음 소수를 기약분수로 나타내세요.';

  // 6학년
  if (area === '6_1_2_4') return '몫을 반올림하여 소수 첫째 자리까지 나타내세요.';
  if (area === '6_2_1_1') return '다음 분수의 나눗셈을 하세요.';
  if (area === '6_2_1_2' || area === '6_2_1_3') return '다음을 계산하여 기약분수로 나타내세요.';

  // 6학년 비와 비율, 비례식
  if (area === '6_1_3_1') return '다음 비를 비율(분수)로 나타내세요.';
  if (area === '6_1_3_2') return '다음 비율을 백분율로 나타내세요.';
  if (area === '6_2_3_1') return '다음 비를 가장 작은 자연수의 비로 나타내세요.';
  if (area === '6_2_3_2' || area === '6_2_3_3' || area === '6_2_3_4') return '비례식에서 □안에 알맞은 수를 구하세요.';
  if (area === '6_2_3_5') return '주어진 수를 비례배분하세요.';

  // 6학년 소수의 나눗셈 나머지
  if (area === '6_2_2_5') return '다음 나눗셈의 몫을 자연수까지 구하고, 나머지를 구하세요.';

  // 기본 연산 기호 기반 판별 (area ID만으로는 알기 어려우므로 일반적인 문구 제공)
  // 실제로는 문제의 연산자를 보고 결정하는 것이 좋지만, 영역 기반으로 대략적인 문구 제공
  return '다음 계산을 하세요.';
}

export function generateProblems(grade: number, semester: number, area: string, count: number = 20) {
  if ((area === '3_1_2_1' || area === '3_1_2_3') && count === 20) {
    count = 14;
  }
  if ((area === '5_1_2_1' || area === '5_1_2_2') && count === 20) {
    count = 10;
  }
  const problems = [];
  const usedQuestions = new Set<string>();
  const usedAnswers = new Set<string>();

  for (let i = 0; i < count; i++) {
    let q = '';
    let aStr = '';

    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
    const simplifyFraction = (w: number, num: number, den: number): string => {
      if (num === 0) return w === 0 ? '0' : `${w}`;
      const g = gcd(num, den);
      const sNum = num / g;
      const sDen = den / g;
      if (sDen === 1) {
        return `${w + sNum}`;
      }
      if (w === 0) {
        return `FRAC(${sNum},${sDen})`;
      }
      return `MIXED(${w},${sNum},${sDen})`;
    };
    const isVertical = i >= Math.floor(count / 2);
    let retries = 0;

    while (retries < 20) {
      if (grade === 1 && semester === 1) {
      if (area === '1_1_1_1') {
        const total = randomInt(2, 9);
        const n1 = randomInt(1, total - 1);
        q = JSON.stringify({ type: 'split_gather', mode: 'split', top: total, bottom1: n1, bottom2: '?' });
        aStr = `${total - n1}`;
      } else if (area === '1_1_1_2') {
        const total = randomInt(2, 9);
        const n1 = randomInt(1, total - 1);
        q = JSON.stringify({ type: 'split_gather', mode: 'gather', top1: n1, top2: total - n1, bottom: '?' });
        aStr = `${total}`;
      } else if (area === '1_1_1_3') {
        const n1 = randomInt(1, 8);
        const n2 = randomInt(1, 9 - n1);
        q = `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '1_1_1_5') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(1, n1 - 1);
        q = `${n1} - ${n2} = ?`;
        aStr = `${n1 - n2}`;
      } else if (area === '1_1_1_6') {
        const isAdd = Math.random() > 0.5;
        if (isAdd) {
          const n1 = randomInt(1, 8);
          const n2 = randomInt(1, 9 - n1);
          const total = n1 + n2;
          if (Math.random() > 0.5) {
            q = `☐ + ${n2} = ${total}`;
            aStr = `${n1}`;
          } else {
            q = `${n1} + ☐ = ${total}`;
            aStr = `${n2}`;
          }
        } else {
          const n1 = randomInt(2, 9);
          const n2 = randomInt(1, n1 - 1);
          const diff = n1 - n2;
          if (Math.random() > 0.5) {
            q = `☐ - ${n2} = ${diff}`;
            aStr = `${n1}`;
          } else {
            q = `${n1} - ☐ = ${diff}`;
            aStr = `${n2}`;
          }
        }
      } else {
        const def1 = randomInt(1, 5);
        const def2 = randomInt(1, 4);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else if (grade === 1 && semester === 2) {
      if (area === '1_2_1_1') {
        const tens = randomInt(1, 8) * 10;
        const ones = randomInt(1, 9);
        q = isVertical ? `${tens}\n+ ${ones}\n---` : `${tens} + ${ones} = ?`;
        aStr = `${tens + ones}`;
      } else if (area === '1_2_1_2') {
        const tens = randomInt(1, 8) * 10;
        const ones1 = randomInt(1, 8);
        const ones2 = randomInt(1, 9 - ones1);
        q = isVertical ? `${tens + ones1}\n+ ${ones2}\n---` : `${tens + ones1} + ${ones2} = ?`;
        aStr = `${tens + ones1 + ones2}`;
      } else if (area === '1_2_1_3') {
        const tens1 = randomInt(1, 8) * 10;
        const tens2 = randomInt(1, 9 - (tens1/10)) * 10;
        q = isVertical ? `${tens1}\n+ ${tens2}\n---` : `${tens1} + ${tens2} = ?`;
        aStr = `${tens1 + tens2}`;
      } else if (area === '1_2_1_4') {
        const tens1 = randomInt(1, 8) * 10;
        const ones1 = randomInt(1, 8);
        const tens2 = randomInt(1, 9 - (tens1/10)) * 10;
        const ones2 = randomInt(1, 9 - ones1);
        q = isVertical ? `${tens1 + ones1}\n+ ${tens2 + ones2}\n---` : `${tens1 + ones1} + ${tens2 + ones2} = ?`;
        aStr = `${tens1 + ones1 + tens2 + ones2}`;
      } else if (area === '1_2_1_5') {
        const tens1 = randomInt(2, 9) * 10;
        const tens2 = randomInt(1, (tens1/10) - 1) * 10;
        q = isVertical ? `${tens1}\n- ${tens2}\n---` : `${tens1} - ${tens2} = ?`;
        aStr = `${tens1 - tens2}`;
      } else if (area === '1_2_1_6') {
        const tens = randomInt(1, 9) * 10;
        const ones1 = randomInt(2, 9);
        const ones2 = randomInt(1, ones1 - 1);
        q = isVertical ? `${tens + ones1}\n- ${ones2}\n---` : `${tens + ones1} - ${ones2} = ?`;
        aStr = `${tens + ones1 - ones2}`;
      } else if (area === '1_2_1_7') {
        const tens1 = randomInt(2, 9) * 10;
        const ones1 = randomInt(2, 9);
        const tens2 = randomInt(1, (tens1/10) - 1) * 10;
        const ones2 = randomInt(1, ones1 - 1);
        q = isVertical ? `${tens1 + ones1}\n- ${tens2 + ones2}\n---` : `${tens1 + ones1} - ${tens2 + ones2} = ?`;
        aStr = `${tens1 + ones1 - (tens2 + ones2)}`;
      } else if (area === '1_2_2_1') {
        const n1 = randomInt(1, 7);
        const n2 = randomInt(1, 8 - n1);
        const n3 = randomInt(1, 9 - n1 - n2);
        q = `${n1} + ${n2} + ${n3} = ?`;
        aStr = `${n1 + n2 + n3}`;
      } else if (area === '1_2_2_2') {
        const n1 = randomInt(3, 9);
        const n2 = randomInt(1, n1 - 2);
        const n3 = randomInt(1, n1 - n2 - 1);
        q = `${n1} - ${n2} - ${n3} = ?`;
        aStr = `${n1 - n2 - n3}`;
      } else if (area === '1_2_2_3') {
        if (Math.random() > 0.5) {
          const n1 = randomInt(1, 7);
          const n2 = randomInt(1, 8 - n1);
          const n3 = randomInt(1, n1 + n2 - 1);
          q = `${n1} + ${n2} - ${n3} = ?`;
          aStr = `${n1 + n2 - n3}`;
        } else {
          const n1 = randomInt(2, 9);
          const n2 = randomInt(1, n1 - 1);
          const n3 = randomInt(1, 9 - (n1 - n2));
          q = `${n1} - ${n2} + ${n3} = ?`;
          aStr = `${n1 - n2 + n3}`;
        }
      } else if (area === '1_2_2_4') {
        const n1 = randomInt(1, 9);
        q = JSON.stringify({ type: 'split_gather', mode: 'split', top: 10, bottom1: n1, bottom2: '?' });
        aStr = `${10 - n1}`;
      } else if (area === '1_2_2_5') {
        const n1 = randomInt(1, 9);
        q = JSON.stringify({ type: 'split_gather', mode: 'gather', top1: n1, top2: '?', bottom: 10 });
        aStr = `${10 - n1}`;
      } else if (area === '1_2_2_6') {
        const n1 = randomInt(1, 9);
        q = `${n1} + ☐ = 10`;
        aStr = `${10 - n1}`;
      } else if (area === '1_2_2_7') {
        const n1 = randomInt(1, 9);
        q = `10 - ${n1} = ?`;
        aStr = `${10 - n1}`;
      } else if (area === '1_2_2_8') {
        const n1 = randomInt(1, 9);
        const n2 = 10 - n1;
        const n3 = randomInt(1, 9);
        const arr = [n1, n2, n3];
        for (let j = arr.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [arr[j], arr[k]] = [arr[k], arr[j]];
        }
        q = `${arr[0]} + ${arr[1]} + ${arr[2]} = ?`;
        aStr = `${10 + n3}`;
      } else if (area === '1_2_3_1') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(11 - n1, 9);
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '1_2_3_3') {
        const n1 = randomInt(2, 8);
        const n2 = randomInt(1, 9 - n1);
        const n3 = randomInt(11 - (n1+n2), 9);
        q = `${n1} + ${n2} + ${n3} = ?`;
        aStr = `${n1 + n2 + n3}`;
      } else if (area === '1_2_3_4') {
        const n1 = randomInt(11, 18);
        const n2 = randomInt((n1 % 10) + 1, 9);
        q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
        aStr = `${n1 - n2}`;
      } else if (area === '1_2_3_6') {
        const n1 = randomInt(12, 18);
        const n2 = randomInt(1, (n1 % 10) || 1);
        const n3 = randomInt((n1 - n2) % 10 + 1, 9);
        q = `${n1} - ${n2} - ${n3} = ?`;
        aStr = `${n1 - n2 - n3}`;
      } else if (area === '1_2_3_7') {
        if (Math.random() > 0.5) {
          const n1 = randomInt(2, 9);
          const n2 = randomInt(11 - n1, 9);
          q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
          aStr = `${n1 + n2}`;
        } else {
          const n1 = randomInt(11, 18);
          const n2 = randomInt((n1 % 10) + 1, 9);
          q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
          aStr = `${n1 - n2}`;
        }
      } else {
        const def1 = randomInt(1, 5);
        const def2 = randomInt(1, 4);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else if (grade === 2 && semester === 1) {
      if (area === '2_1_1_1') {
        const tens1 = randomInt(1, 8) * 10;
        const ones1 = randomInt(1, 9);
        const ones2 = randomInt(10 - ones1, 9);
        const n1 = tens1 + ones1;
        const n2 = ones2;
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '2_1_1_3') {
        const ones1 = randomInt(1, 9);
        const ones2 = randomInt(10 - ones1, 9);
        const tens1 = randomInt(1, 7) * 10;
        const tens2 = randomInt(1, 8 - (tens1/10)) * 10;
        const n1 = tens1 + ones1;
        const n2 = tens2 + ones2;
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '2_1_1_5') {
        const ones1 = randomInt(1, 9);
        const ones2 = randomInt(10 - ones1, 9);
        const tens1 = randomInt(1, 9) * 10;
        const tens2 = randomInt(10 - (tens1/10), 9) * 10;
        const n1 = tens1 + ones1;
        const n2 = tens2 + ones2;
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '2_1_1_7') {
        const tens1 = randomInt(1, 9) * 10;
        const ones1 = randomInt(0, 8);
        const ones2 = randomInt(ones1 + 1, 9);
        const n1 = tens1 + ones1;
        const n2 = ones2;
        q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
        aStr = `${n1 - n2}`;
      } else if (area === '2_1_1_9') {
        const tens1 = randomInt(2, 9) * 10;
        const ones1 = randomInt(0, 8);
        const tens2 = randomInt(1, (tens1/10) - 1) * 10;
        const ones2 = randomInt(ones1 + 1, 9);
        const n1 = tens1 + ones1;
        const n2 = tens2 + ones2;
        q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
        aStr = `${n1 - n2}`;
      } else if (area === '2_1_1_11') {
        if (Math.random() > 0.5) {
          const tens1 = randomInt(1, 8) * 10;
          const ones1 = randomInt(1, 9);
          const ones2 = randomInt(10 - ones1, 9);
          const n1 = tens1 + ones1;
          const n2 = ones2;
          q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
          aStr = `${n1 + n2}`;
        } else {
          const tens1 = randomInt(1, 9) * 10;
          const ones1 = randomInt(0, 8);
          const ones2 = randomInt(ones1 + 1, 9);
          const n1 = tens1 + ones1;
          const n2 = ones2;
          q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
          aStr = `${n1 - n2}`;
        }
      } else if (area === '2_1_1_13') {
        const r = Math.random();
        if (r < 0.33) {
          const ones1 = randomInt(1, 9);
          const ones2 = randomInt(10 - ones1, 9);
          const tens1 = randomInt(1, 7) * 10;
          const tens2 = randomInt(1, 8 - (tens1/10)) * 10;
          const n1 = tens1 + ones1;
          const n2 = tens2 + ones2;
          q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
          aStr = `${n1 + n2}`;
        } else if (r < 0.66) {
          const ones1 = randomInt(1, 9);
          const ones2 = randomInt(10 - ones1, 9);
          const tens1 = randomInt(1, 9) * 10;
          const tens2 = randomInt(10 - (tens1/10), 9) * 10;
          const n1 = tens1 + ones1;
          const n2 = tens2 + ones2;
          q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
          aStr = `${n1 + n2}`;
        } else {
          const tens1 = randomInt(2, 9) * 10;
          const ones1 = randomInt(0, 8);
          const tens2 = randomInt(1, (tens1/10) - 1) * 10;
          const ones2 = randomInt(ones1 + 1, 9);
          const n1 = tens1 + ones1;
          const n2 = tens2 + ones2;
          q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
          aStr = `${n1 - n2}`;
        }
      } else if (area === '2_1_1_15') {
        const n1 = randomInt(11, 89);
        const n2 = randomInt(1, 9);
        const n3 = randomInt(1, 9);
        q = `${n1} + ${n2} + ${n3} = ?`;
        aStr = `${n1 + n2 + n3}`;
      } else if (area === '2_1_1_16') {
        const n1 = randomInt(21, 99);
        const n2 = randomInt(1, 9);
        const n3 = randomInt(1, Math.min(9, n1 - n2 - 1));
        q = `${n1} - ${n2} - ${n3} = ?`;
        aStr = `${n1 - n2 - n3}`;
      } else if (area === '2_1_1_17') {
        const n1 = randomInt(11, 99);
        const n2 = randomInt(1, 9);
        const n3 = randomInt(1, 9);
        if (Math.random() > 0.5) {
          q = `${n1} + ${n2} - ${n3} = ?`;
          aStr = `${n1 + n2 - n3}`;
        } else {
          const safeN1 = Math.max(n1, n2 + 1);
          q = `${safeN1} - ${n2} + ${n3} = ?`;
          aStr = `${safeN1 - n2 + n3}`;
        }
      } else if (area === '2_1_1_18') {
        const n1 = randomInt(11, 99);
        const n2 = randomInt(1, 9);
        const n3 = randomInt(1, 9);
        const op1 = Math.random() > 0.5 ? '+' : '-';
        const op2 = Math.random() > 0.5 ? '+' : '-';
        let res = n1;
        if (op1 === '+') res += n2; else res -= n2;
        if (op2 === '+') res += n3; else res -= n3;
        if (res < 0 || (op1 === '-' && n1 - n2 < 0)) {
          q = `${n1} + ${n2} + ${n3} = ?`;
          aStr = `${n1 + n2 + n3}`;
        } else {
          q = `${n1} ${op1} ${n2} ${op2} ${n3} = ?`;
          aStr = `${res}`;
        }
      } else if (area === '2_1_1_19') {
        const n1 = randomInt(20, 80);
        const n2 = randomInt(11, 30);
        const n3 = randomInt(11, 30);
        const op1 = Math.random() > 0.5 ? '+' : '-';
        const op2 = Math.random() > 0.5 ? '+' : '-';
        let res = n1;
        if (op1 === '+') res += n2; else res -= n2;
        if (op2 === '+') res += n3; else res -= n3;
        if (res < 0 || (op1 === '-' && n1 - n2 < 0)) {
          q = `${n1} + ${n2} + ${n3} = ?`;
          aStr = `${n1 + n2 + n3}`;
        } else {
          q = `${n1} ${op1} ${n2} ${op2} ${n3} = ?`;
          aStr = `${res}`;
        }
      } else {
        const def1 = randomInt(11, 99);
        const def2 = randomInt(11, 99);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else if (grade === 2 && semester === 2) {
      if (area === '2_2_1_1') {
        const n1 = [2, 3, 4, 5][randomInt(0, 3)];
        const n2 = randomInt(1, 9);
        q = `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '2_2_1_2') {
        const n1 = randomInt(6, 9);
        const n2 = randomInt(1, 9);
        q = `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '2_2_1_3') {
        const n1 = randomInt(0, 9);
        const n2 = randomInt(0, 9);
        const n1_final = Math.random() > 0.5 ? randomInt(0, 1) : n1;
        const n2_final = n1_final > 1 ? randomInt(0, 1) : n2;
        q = `${n1_final} × ${n2_final} = ?`;
        aStr = `${n1_final * n2_final}`;
      } else if (area === '2_2_1_4') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(1, 9);
        q = `${n1} × ☐ = ${n1 * n2}`;
        aStr = `${n2}`;
      } else if (area === '2_2_1_5') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(1, 9);
        q = `☐ × ${n2} = ${n1 * n2}`;
        aStr = `${n1}`;
      } else if (area === '2_2_1_6') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(1, 9);
        if (Math.random() > 0.5) {
          q = `${n1} × ☐ = ${n1 * n2}`;
          aStr = `${n2}`;
        } else {
          q = `☐ × ${n2} = ${n1 * n2}`;
          aStr = `${n1}`;
        }
      } else {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(1, 9);
        q = `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      }
    } else if (grade === 3 && semester === 1) {
      if (area === '3_1_1_1') {
        const type = randomInt(1, 2);
        if (type === 1) {
          const n1 = randomInt(1, 8) * 100;
          const n2 = randomInt(1, 9 - (n1/100)) * 100;
          q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
          aStr = `${n1 + n2}`;
        } else {
          const h1 = randomInt(1, 8);
          const t1 = randomInt(1, 8);
          const h2 = randomInt(1, 9 - h1);
          const t2 = randomInt(1, 9 - t1);
          const n1 = h1 * 100 + t1 * 10;
          const n2 = h2 * 100 + t2 * 10;
          q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
          aStr = `${n1 + n2}`;
        }
      } else if (area === '3_1_1_3') {
        const h1 = randomInt(1, 8);
        const t1 = randomInt(1, 8);
        const o1 = randomInt(1, 8);
        const h2 = randomInt(1, 9 - h1);
        const t2 = randomInt(1, 9 - t1);
        const o2 = randomInt(1, 9 - o1);
        const n1 = h1 * 100 + t1 * 10 + o1;
        const n2 = h2 * 100 + t2 * 10 + o2;
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '3_1_1_5') {
        const pos = randomInt(1, 2); // 1: ones, 2: tens
        let h1, t1, o1, h2, t2, o2;
        if (pos === 1) {
          h1 = randomInt(1, 8); h2 = randomInt(1, 9 - h1);
          t1 = randomInt(1, 7); t2 = randomInt(1, 8 - t1);
          o1 = randomInt(1, 9); o2 = randomInt(10 - o1, 9);
        } else {
          h1 = randomInt(1, 7); h2 = randomInt(1, 8 - h1);
          t1 = randomInt(1, 9); t2 = randomInt(10 - t1, 9);
          o1 = randomInt(1, 8); o2 = randomInt(1, 9 - o1);
        }
        const n1 = h1 * 100 + t1 * 10 + o1;
        const n2 = h2 * 100 + t2 * 10 + o2;
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '3_1_1_7') {
        const h1 = randomInt(1, 7); const h2 = randomInt(1, 8 - h1);
        const t1 = randomInt(1, 9); const t2 = randomInt(10 - t1, 9);
        const o1 = randomInt(1, 9); const o2 = randomInt(10 - o1, 9);
        const n1 = h1 * 100 + t1 * 10 + o1;
        const n2 = h2 * 100 + t2 * 10 + o2;
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '3_1_1_9') {
        const h1 = randomInt(1, 9); const h2 = randomInt(10 - h1, 9);
        const t1 = randomInt(1, 9); const t2 = randomInt(10 - t1, 9);
        const o1 = randomInt(1, 9); const o2 = randomInt(10 - o1, 9);
        const n1 = h1 * 100 + t1 * 10 + o1;
        const n2 = h2 * 100 + t2 * 10 + o2;
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '3_1_1_11') {
        const n1 = randomInt(1000, 8999);
        const n2 = randomInt(100, 999);
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '3_1_1_13') {
        const n1 = randomInt(1000, 8999);
        const n2 = randomInt(1000, 9999 - n1);
        q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
        aStr = `${n1 + n2}`;
      } else if (area === '3_1_1_15') {
        const type = randomInt(1, 2);
        if (type === 1) {
          const n1 = randomInt(2, 9) * 100;
          const n2 = randomInt(1, (n1/100) - 1) * 100;
          q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
          aStr = `${n1 - n2}`;
        } else {
          const h1 = randomInt(2, 9);
          const t1 = randomInt(2, 9);
          const h2 = randomInt(1, h1 - 1);
          const t2 = randomInt(1, t1 - 1);
          const n1 = h1 * 100 + t1 * 10;
          const n2 = h2 * 100 + t2 * 10;
          q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
          aStr = `${n1 - n2}`;
        }
      } else if (area === '3_1_1_17') {
        const h1 = randomInt(2, 9);
        const t1 = randomInt(2, 9);
        const o1 = randomInt(2, 9);
        const h2 = randomInt(1, h1 - 1);
        const t2 = randomInt(1, t1 - 1);
        const o2 = randomInt(1, o1 - 1);
        const n1 = h1 * 100 + t1 * 10 + o1;
        const n2 = h2 * 100 + t2 * 10 + o2;
        q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
        aStr = `${n1 - n2}`;
      } else if (area === '3_1_1_19') {
        const pos = randomInt(1, 2); // 1: ones, 2: tens
        let h1, t1, o1, h2, t2, o2;
        if (pos === 1) {
          h1 = randomInt(2, 9); h2 = randomInt(1, h1 - 1);
          t1 = randomInt(2, 9); t2 = randomInt(1, t1 - 1);
          o1 = randomInt(0, 8); o2 = randomInt(o1 + 1, 9);
        } else {
          h1 = randomInt(2, 9); h2 = randomInt(1, h1 - 1);
          t1 = randomInt(0, 8); t2 = randomInt(t1 + 1, 9);
          o1 = randomInt(2, 9); o2 = randomInt(1, o1 - 1);
        }
        const n1 = h1 * 100 + t1 * 10 + o1;
        const n2 = h2 * 100 + t2 * 10 + o2;
        q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
        aStr = `${n1 - n2}`;
      } else if (area === '3_1_1_21') {
        const h1 = randomInt(2, 9); const h2 = randomInt(1, h1 - 1);
        const t1 = randomInt(0, 8); const t2 = randomInt(t1 + 1, 9);
        const o1 = randomInt(0, 8); const o2 = randomInt(o1 + 1, 9);
        const n1 = h1 * 100 + t1 * 10 + o1;
        const n2 = h2 * 100 + t2 * 10 + o2;
        q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
        aStr = `${n1 - n2}`;
      } else if (area === '3_1_1_23') {
        const n1 = randomInt(1000, 9999);
        const n2 = randomInt(100, 999);
        q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
        aStr = `${n1 - n2}`;
      } else if (area === '3_1_1_25') {
        const n1 = randomInt(2000, 9999);
        const n2 = randomInt(1000, n1 - 1);
        q = isVertical ? `${n1}\n- ${n2}\n---` : `${n1} - ${n2} = ?`;
        aStr = `${n1 - n2}`;
      } else if (area === '3_1_1_27') {
        const n1 = randomInt(100, 999);
        const n2 = randomInt(100, 999);
        if (Math.random() > 0.5) {
          q = isVertical ? `${n1}\n+ ${n2}\n---` : `${n1} + ${n2} = ?`;
          aStr = `${n1 + n2}`;
        } else {
          const max = Math.max(n1, n2);
          const min = Math.min(n1, n2);
          q = isVertical ? `${max}\n- ${min}\n---` : `${max} - ${min} = ?`;
          aStr = `${max - min}`;
        }
      } else if (area === '3_1_1_29') {
        const n1 = randomInt(1000, 9999);
        const n2 = randomInt(1000, 9999);
        if (Math.random() > 0.5) {
          const n1_add = randomInt(1000, 8999);
          const n2_add = randomInt(1000, 9999 - n1_add);
          q = isVertical ? `${n1_add}\n+ ${n2_add}\n---` : `${n1_add} + ${n2_add} = ?`;
          aStr = `${n1_add + n2_add}`;
        } else {
          const max = Math.max(n1, n2);
          const min = Math.min(n1, n2);
          q = isVertical ? `${max}\n- ${min}\n---` : `${max} - ${min} = ?`;
          aStr = `${max - min}`;
        }
      } else if (area === '3_1_1_31') {
        const n1 = randomInt(100, 999);
        const n2 = randomInt(100, 999);
        const n3 = randomInt(100, 999);
        const op1 = Math.random() > 0.5 ? '+' : '-';
        const op2 = Math.random() > 0.5 ? '+' : '-';
        let res = n1;
        if (op1 === '+') res += n2; else res -= n2;
        if (op2 === '+') res += n3; else res -= n3;
        if (res < 0 || (op1 === '-' && n1 - n2 < 0)) {
          q = `${n1}\n  ${n2}\n+ ${n3}\n---`;
          aStr = `${n1 + n2 + n3}`;
        } else {
          q = `${n1} ${op1} ${n2} ${op2} ${n3} = ?`;
          aStr = `${res}`;
        }
      } else if (area === '3_1_1_32') {
        const n1 = randomInt(1000, 9999);
        const n2 = randomInt(1000, 9999);
        const n3 = randomInt(1000, 9999);
        const op1 = Math.random() > 0.5 ? '+' : '-';
        const op2 = Math.random() > 0.5 ? '+' : '-';
        let res = n1;
        if (op1 === '+') res += n2; else res -= n2;
        if (op2 === '+') res += n3; else res -= n3;
        if (res < 0 || (op1 === '-' && n1 - n2 < 0)) {
          q = `${n1}\n  ${n2}\n+ ${n3}\n---`;
          aStr = `${n1 + n2 + n3}`;
        } else {
          q = `${n1} ${op1} ${n2} ${op2} ${n3} = ?`;
          aStr = `${res}`;
        }
      } else if (area === '3_1_2_1') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(2, 9);
        const prod = n1 * n2;
        q = JSON.stringify({ type: 'relation_mul_div', n1, n2, prod });
        aStr = `${prod},${n1},${n2},${prod},${n2},${n1}`;
      } else if (area === '3_1_2_3') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(2, 9);
        const prod = n1 * n2;
        q = JSON.stringify({ type: 'relation_div_mul', prod, n1, n2 });
        aStr = `${n1},${n2},${prod},${n2},${n1},${prod}`;
      } else if (area === '3_1_2_4') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(2, 9);
        const prod = n1 * n2;
        q = isVertical ? `LONGDIV(${prod},${n1})` : `${prod} ÷ ${n1} = ?`;
        aStr = `${n2}`;
      } else if (area === '3_1_3_1') {
        const n1 = randomInt(1, 9) * 10;
        const n2 = randomInt(2, 9);
        q = isVertical ? `${n1}\n× ${n2}\n---` : `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '3_1_3_3') {
        const t1 = randomInt(1, 4);
        const o1 = randomInt(1, 4);
        const n2 = randomInt(2, Math.floor(9 / Math.max(t1, o1)));
        const n1 = t1 * 10 + o1;
        q = isVertical ? `${n1}\n× ${n2}\n---` : `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '3_1_3_5') {
        const t1 = randomInt(2, 9);
        const o1 = randomInt(1, 4);
        const n2 = randomInt(Math.floor(10 / t1) + 1, 9);
        const safeN2 = Math.min(n2, Math.floor(9 / o1));
        const n1 = t1 * 10 + o1;
        q = isVertical ? `${n1}\n× ${safeN2}\n---` : `${n1} × ${safeN2} = ?`;
        aStr = `${n1 * safeN2}`;
      } else if (area === '3_1_3_7') {
        const t1 = randomInt(1, 4);
        const o1 = randomInt(2, 9);
        const n2 = randomInt(Math.floor(10 / o1) + 1, 9);
        const safeN2 = Math.min(n2, Math.floor(9 / t1));
        const n1 = t1 * 10 + o1;
        q = isVertical ? `${n1}\n× ${safeN2}\n---` : `${n1} × ${safeN2} = ?`;
        aStr = `${n1 * safeN2}`;
      } else if (area === '3_1_3_9') {
        const t1 = randomInt(2, 9);
        const o1 = randomInt(2, 9);
        const n2 = randomInt(Math.max(Math.floor(10 / t1) + 1, Math.floor(10 / o1) + 1), 9);
        const n1 = t1 * 10 + o1;
        q = isVertical ? `${n1}\n× ${n2}\n---` : `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '3_1_3_11') {
        const n1 = randomInt(11, 99);
        const n2 = randomInt(2, 9);
        q = isVertical ? `${n1}\n× ${n2}\n---` : `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else {
        const def1 = randomInt(11, 99);
        const def2 = randomInt(2, 9);
        q = `${def1} × ${def2} = ?`;
        aStr = `${def1 * def2}`;
      }
    } else if (grade === 3 && semester === 2) {
      if (area === '3_2_1_2') {
        const h1 = randomInt(1, 4);
        const t1 = randomInt(1, 4);
        const o1 = randomInt(1, 4);
        const n2 = randomInt(2, Math.floor(9 / Math.max(h1, t1, o1)));
        const n1 = h1 * 100 + t1 * 10 + o1;
        q = isVertical ? `${n1}\n× ${n2}\n---` : `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '3_2_1_4') {
        const n1 = randomInt(100, 999);
        const n2 = randomInt(2, 9);
        q = isVertical ? `${n1}\n× ${n2}\n---` : `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '3_2_1_7') {
        const n1 = randomInt(1, 9) * 10;
        const n2 = randomInt(1, 9) * 10;
        q = isVertical ? `${n1}\n× ${n2}\n---` : `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '3_2_1_9') {
        const n1 = randomInt(11, 99);
        const n2 = randomInt(1, 9) * 10;
        if (isVertical) {
          q = `${n1}\n× ${n2}\n---`;
        } else {
          q = `${n1} × ${n2} = ?`;
        }
        aStr = `${n1 * n2}`;
      } else if (area === '3_2_1_11') {
        const n1 = randomInt(11, 99);
        const n2 = randomInt(11, 99);
        if (isVertical) {
          q = `${n1}\n× ${n2}\n---`;
        } else {
          q = `${n1} × ${n2} = ?`;
        }
        aStr = `${n1 * n2}`;
      } else if (area === '3_2_2_1') {
        const n2 = randomInt(2, 9);
        const t1 = randomInt(1, Math.floor(9 / n2));
        const n1 = t1 * n2 * 10;
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `${n1 / n2}`;
      } else if (area === '3_2_2_3') {
        const n2 = randomInt(2, 9);
        const t1 = randomInt(1, Math.floor(9 / n2));
        const o1 = randomInt(1, Math.floor(9 / n2));
        const n1 = (t1 * 10 + o1) * n2;
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `${n1 / n2}`;
      } else if (area === '3_2_2_5') {
        const n2 = randomInt(2, 9);
        const ans = randomInt(11, 49);
        const n1 = ans * n2;
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `${ans}`;
      } else if (area === '3_2_2_7') {
        const n2 = randomInt(2, 9);
        const ans = randomInt(11, 49);
        const rem = randomInt(1, n2 - 1);
        const n1 = ans * n2 + rem;
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `Q_R(${ans},${rem})`;
      } else if (area === '3_2_2_9') {
        const n2 = randomInt(2, 9);
        const ans = randomInt(50, 499);
        const rem = randomInt(1, n2 - 1);
        const n1 = ans * n2 + rem;
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `Q_R(${ans},${rem})`;
      } else if (area === '3_2_2_12') {
        const n2 = randomInt(2, 9);
        const ans = randomInt(11, 99);
        const rem = randomInt(1, n2 - 1);
        const n1 = ans * n2 + rem;
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `Q_R(${ans},${rem})`;
      } else if (area === '3_2_3_1') {
        const den = randomInt(2, 9);
        const whole = randomInt(1, 5);
        const num = randomInt(1, den - 1);
        q = `MIXED(${whole},${num},${den}) = ?`;
        aStr = `FRAC(${whole * den + num},${den})`;
      } else if (area === '3_2_3_2') {
        const den = randomInt(2, 9);
        const whole = randomInt(1, 5);
        const num = randomInt(1, den - 1);
        const top = whole * den + num;
        q = `FRAC(${top},${den}) = ?`;
        aStr = `MIXED(${whole},${num},${den})`;
      } else if (area === '3_2_3_3') {
        const den = randomInt(2, 9);
        const type = randomInt(1, 2);
        if (type === 1) { // 가분수 vs 가분수
          const top1 = randomInt(den + 1, den * 5);
          let top2 = randomInt(den + 1, den * 5);
          while (top1 === top2) top2 = randomInt(den + 1, den * 5);
          q = `FRAC(${top1},${den}) ○ FRAC(${top2},${den})`;
          aStr = top1 > top2 ? '>' : '<';
        } else { // 대분수 vs 대분수
          const w1 = randomInt(1, 5);
          const n1 = randomInt(1, den - 1);
          let w2 = randomInt(1, 5);
          let n2 = randomInt(1, den - 1);
          while (w1 === w2 && n1 === n2) {
            w2 = randomInt(1, 5);
            n2 = randomInt(1, den - 1);
          }
          q = `MIXED(${w1},${n1},${den}) ○ MIXED(${w2},${n2},${den})`;
          aStr = (w1 > w2 || (w1 === w2 && n1 > n2)) ? '>' : '<';
        }
      } else if (area === '3_2_3_4') {
        const den = randomInt(2, 9);
        const w1 = randomInt(1, 5);
        const n1 = randomInt(1, den - 1);
        const top1 = w1 * den + n1;
        
        let w2 = randomInt(1, 5);
        let n2 = randomInt(1, den - 1);
        let top2 = w2 * den + n2;
        while (top1 === top2) {
          w2 = randomInt(1, 5);
          n2 = randomInt(1, den - 1);
          top2 = w2 * den + n2;
        }
        
        if (Math.random() > 0.5) {
          q = `FRAC(${top1},${den}) ○ MIXED(${w2},${n2},${den})`;
          aStr = top1 > top2 ? '>' : '<';
        } else {
          q = `MIXED(${w1},${n1},${den}) ○ FRAC(${top2},${den})`;
          aStr = top1 > top2 ? '>' : '<';
        }
      } else {
        const def1 = randomInt(11, 99);
        const def2 = randomInt(11, 99);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else if (grade === 4 && semester === 1) {
      const isVertical = randomInt(1, 2) === 1;
      if (area === '4_1_1_1') {
        const n1 = randomInt(11, 99);
        const n2 = randomInt(1, 9) * (randomInt(1, 2) === 1 ? 100 : 1000);
        q = `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '4_1_1_2') {
        const isN1Thousand = randomInt(1, 2) === 1;
        const n1Mult = isN1Thousand ? 1000 : 100;
        const n2Mult = isN1Thousand ? 100 : (randomInt(1, 2) === 1 ? 100 : 1000);
        const n1 = randomInt(1, 9) * n1Mult;
        const n2 = randomInt(1, 9) * n2Mult;
        q = `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '4_1_1_3') {
        const n1 = randomInt(100, 999);
        const n2 = randomInt(11, 99);
        q = isVertical ? `${n1}\n× ${n2}\n---` : `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '4_1_1_5') {
        const n1 = randomInt(1000, 9999);
        const n2 = randomInt(11, 99);
        q = isVertical ? `${n1}\n× ${n2}\n---` : `${n1} × ${n2} = ?`;
        aStr = `${n1 * n2}`;
      } else if (area === '4_1_1_7') {
        const n1 = randomInt(2, 20);
        const n2 = randomInt(2, 20);
        const n3 = randomInt(2, 20);
        q = `${n1} × ${n2} × ${n3} = ?`;
        aStr = `${n1 * n2 * n3}`;
      } else if (area === '4_1_1_9') {
        const n2 = randomInt(1, 9) * 10;
        const q_val = randomInt(2, 9);
        const n1 = n2 * q_val;
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `${q_val}`;
      } else if (area === '4_1_1_11') {
        const n2 = randomInt(2, 9) * 10;
        const q_val = randomInt(2, 9);
        const r = randomInt(1, n2 - 1);
        const n1 = n2 * q_val + r;
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `Q_R(${q_val},${r})`;
      } else if (area === '4_1_1_13') {
        let n1, n2, q_val;
        do {
          n2 = randomInt(11, 49);
          q_val = randomInt(2, 9);
          n1 = n2 * q_val;
        } while (n1 > 99);
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `${q_val}`;
      } else if (area === '4_1_1_15') {
        let n1, n2, q_val, r;
        do {
          n2 = randomInt(11, 49);
          q_val = randomInt(1, 8);
          r = randomInt(1, n2 - 1);
          n1 = n2 * q_val + r;
        } while (n1 > 99);
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `Q_R(${q_val},${r})`;
      } else if (area === '4_1_1_17') {
        let n1_val, n2_val, q_val_val;
        do {
          n2_val = randomInt(11, 99);
          q_val_val = randomInt(2, 9);
          n1_val = n2_val * q_val_val;
        } while (n1_val < 100);
        q = isVertical ? `LONGDIV(${n1_val},${n2_val})` : `${n1_val} ÷ ${n2_val} = ?`;
        aStr = `${q_val_val}`;
      } else if (area === '4_1_1_19') {
        let n1, n2, q_val, r;
        do {
          n2 = randomInt(11, 99);
          q_val = randomInt(1, 9);
          r = randomInt(1, n2 - 1);
          n1 = n2 * q_val + r;
        } while (n1 < 100);
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = `Q_R(${q_val},${r})`;
      } else if (area === '4_1_1_21') {
        let n1, n2, q_val, r;
        do {
          n2 = randomInt(11, 99);
          q_val = randomInt(10, 90);
          r = randomInt(0, n2 - 1);
          n1 = n2 * q_val + r;
        } while (n1 < 100 || n1 > 999);
        q = isVertical ? `LONGDIV(${n1},${n2})` : `${n1} ÷ ${n2} = ?`;
        aStr = r === 0 ? `${q_val}` : `Q_R(${q_val},${r})`;
      } else {
        const def1 = randomInt(11, 99);
        const def2 = randomInt(11, 99);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else if (grade === 4 && semester === 2) {
      const isVertical = randomInt(1, 2) === 1;
      if (area === '4_2_1_1') {
        const den = randomInt(3, 15);
        const num1 = randomInt(1, den - 2);
        const num2 = randomInt(1, den - num1 - 1);
        q = `FRAC(${num1},${den}) + FRAC(${num2},${den}) = ?`;
        aStr = simplifyFraction(0, num1 + num2, den);
      } else if (area === '4_2_1_2') {
        const den = randomInt(3, 15);
        const num1 = randomInt(Math.floor(den/2) + 1, den - 1);
        const num2 = randomInt(den - num1 + 1, den - 1);
        q = `FRAC(${num1},${den}) + FRAC(${num2},${den}) = ?`;
        const sum = num1 + num2;
        aStr = simplifyFraction(Math.floor(sum/den), sum%den, den);
      } else if (area === '4_2_1_3') {
        const den = randomInt(3, 15);
        const w1 = randomInt(1, 5);
        const w2 = randomInt(1, 5);
        const num1 = randomInt(1, den - 2);
        const num2 = randomInt(1, den - num1 - 1);
        q = `MIXED(${w1},${num1},${den}) + MIXED(${w2},${num2},${den}) = ?`;
        aStr = simplifyFraction(w1 + w2, num1 + num2, den);
      } else if (area === '4_2_1_4') {
        const den = randomInt(3, 15);
        const w1 = randomInt(1, 5);
        const w2 = randomInt(1, 5);
        const num1 = randomInt(Math.floor(den/2) + 1, den - 1);
        const num2 = randomInt(den - num1 + 1, den - 1);
        q = `MIXED(${w1},${num1},${den}) + MIXED(${w2},${num2},${den}) = ?`;
        const sumNum = num1 + num2;
        aStr = simplifyFraction(w1 + w2 + 1, sumNum - den, den);
      } else if (area === '4_2_1_5') {
        const den = randomInt(3, 15);
        const num1 = randomInt(2, den - 1);
        const num2 = randomInt(1, num1 - 1);
        q = `FRAC(${num1},${den}) - FRAC(${num2},${den}) = ?`;
        aStr = simplifyFraction(0, num1 - num2, den);
      } else if (area === '4_2_1_6') {
        const den = randomInt(3, 15);
        const w = randomInt(1, 5);
        const num = randomInt(1, den - 1);
        q = `${w} - FRAC(${num},${den}) = ?`;
        if (w === 1) {
          aStr = simplifyFraction(0, den - num, den);
        } else {
          aStr = simplifyFraction(w - 1, den - num, den);
        }
      } else if (area === '4_2_1_7') {
        const den = randomInt(3, 15);
        const w1 = randomInt(2, 5);
        const w2 = randomInt(1, w1 - 1);
        const num1 = randomInt(2, den - 1);
        const num2 = randomInt(1, num1 - 1);
        q = `MIXED(${w1},${num1},${den}) - MIXED(${w2},${num2},${den}) = ?`;
        aStr = simplifyFraction(w1 - w2, num1 - num2, den);
      } else if (area === '4_2_1_8') {
        const den = randomInt(3, 15);
        const w1 = randomInt(2, 5);
        const w2 = randomInt(1, w1 - 1);
        const num2 = randomInt(2, den - 1);
        const num1 = randomInt(1, num2 - 1);
        q = `MIXED(${w1},${num1},${den}) - MIXED(${w2},${num2},${den}) = ?`;
        const resW = w1 - 1 - w2;
        const resNum = den + num1 - num2;
        aStr = simplifyFraction(resW, resNum, den);
      } else if (area === '4_2_1_9') {
        const den = randomInt(3, 15);
        const w1 = randomInt(1, 5);
        const num1 = randomInt(1, den - 1);
        const num2 = randomInt(1, den - 1);
        q = `MIXED(${w1},${num1},${den}) + FRAC(${num2},${den}) = ?`;
        const sumNum = num1 + num2;
        if (sumNum >= den) {
          aStr = simplifyFraction(w1 + 1, sumNum - den, den);
        } else {
          aStr = simplifyFraction(w1, sumNum, den);
        }
      } else if (area === '4_2_1_10') {
        const den = randomInt(3, 15);
        const w1 = randomInt(1, 5);
        const num1 = randomInt(1, den - 1);
        const num2 = randomInt(1, den - 1);
        q = `MIXED(${w1},${num1},${den}) - FRAC(${num2},${den}) = ?`;
        if (num1 >= num2) {
          aStr = simplifyFraction(w1, num1 - num2, den);
        } else {
          const resW = w1 - 1;
          const resNum = den + num1 - num2;
          aStr = simplifyFraction(resW, resNum, den);
        }
      } else if (area === '4_2_2_1') {
        const n1 = randomInt(1, 9);
        const n2 = randomInt(1, 9);
        q = isVertical ? `0.${n1}\n+ 0.${n2}\n---` : `0.${n1} + 0.${n2} = ?`;
        aStr = `${(n1 + n2) / 10}`;
      } else if (area === '4_2_2_3') {
        const n1 = randomInt(1, 99);
        const n2 = randomInt(1, 99);
        const s1 = n1 < 10 ? `0.0${n1}` : `0.${n1}`;
        const s2 = n2 < 10 ? `0.0${n2}` : `0.${n2}`;
        q = isVertical ? `${s1}\n+ ${s2}\n---` : `${s1} + ${s2} = ?`;
        aStr = `${(n1 + n2) / 100}`;
      } else if (area === '4_2_2_5') {
        const n1 = randomInt(100, 999);
        const n2 = randomInt(100, 999);
        const s1 = (n1 / 100).toFixed(2);
        const s2 = (n2 / 100).toFixed(2);
        q = isVertical ? `${s1}\n+ ${s2}\n---` : `${s1} + ${s2} = ?`;
        aStr = `${(n1 + n2) / 100}`;
      } else if (area === '4_2_2_7') {
        const n1 = randomInt(1000, 9999);
        const n2 = randomInt(1000, 9999);
        const s1 = (n1 / 1000).toFixed(3);
        const s2 = (n2 / 1000).toFixed(3);
        q = isVertical ? `${s1}\n+ ${s2}\n---` : `${s1} + ${s2} = ?`;
        aStr = `${(n1 + n2) / 1000}`;
      } else if (area === '4_2_2_9') {
        const n1 = randomInt(2, 99);
        const n2 = randomInt(1, n1 - 1);
        const s1 = (n1 / 10).toFixed(1);
        const s2 = (n2 / 10).toFixed(1);
        q = isVertical ? `${s1}\n- ${s2}\n---` : `${s1} - ${s2} = ?`;
        aStr = `${(n1 - n2) / 10}`;
      } else if (area === '4_2_2_11') {
        const n1 = randomInt(2, 99);
        const n2 = randomInt(1, n1 - 1);
        const s1 = n1 < 10 ? `0.0${n1}` : `0.${n1}`;
        const s2 = n2 < 10 ? `0.0${n2}` : `0.${n2}`;
        q = isVertical ? `${s1}\n- ${s2}\n---` : `${s1} - ${s2} = ?`;
        aStr = `${(n1 - n2) / 100}`;
      } else if (area === '4_2_2_13') {
        const n1 = randomInt(200, 999);
        const n2 = randomInt(100, n1 - 1);
        const s1 = (n1 / 100).toFixed(2);
        const s2 = (n2 / 100).toFixed(2);
        q = isVertical ? `${s1}\n- ${s2}\n---` : `${s1} - ${s2} = ?`;
        aStr = `${(n1 - n2) / 100}`;
      } else if (area === '4_2_2_15') {
        const n1 = randomInt(2000, 9999);
        const n2 = randomInt(1000, n1 - 1);
        const s1 = (n1 / 1000).toFixed(3);
        const s2 = (n2 / 1000).toFixed(3);
        q = isVertical ? `${s1}\n- ${s2}\n---` : `${s1} - ${s2} = ?`;
        aStr = `${(n1 - n2) / 1000}`;
      } else {
        const def1 = randomInt(11, 99);
        const def2 = randomInt(11, 99);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else if (grade === 5 && semester === 1) {
      if (area === '5_1_1_1') {
        // 덧셈과 뺄셈이 섞여 있는 식 (3~4개 수)
        const count = randomInt(3, 4);
        let current = randomInt(20, 50);
        q = `${current}`;
        for (let i = 1; i < count; i++) {
          const isAdd = randomInt(0, 1) === 0;
          if (isAdd) {
            const n = randomInt(10, 40);
            q += ` + ${n}`;
            current += n;
          } else {
            const n = randomInt(5, current); // Ensure no negative
            q += ` - ${n}`;
            current -= n;
          }
        }
        q += ` = ?`;
        aStr = `${current}`;
      } else if (area === '5_1_1_2') {
        // 곱셈과 나눗셈이 섞여 있는 식 (3~4개 수)
        const count = randomInt(3, 4);
        let current = randomInt(2, 9);
        q = `${current}`;
        for (let i = 1; i < count; i++) {
          const isMul = randomInt(0, 1) === 0;
          if (isMul) {
            const n = randomInt(2, 9);
            q += ` × ${n}`;
            current *= n;
          } else {
            const n = randomInt(2, 9);
            // To ensure clean division, we multiply current by n first, or we just change the previous number
            // Actually, it's easier to build from right to left or just ensure divisibility
            current *= n; // Make it divisible
            q = `(${q}) × ${n}`; // Wait, this changes the expression.
            // Let's just do:
            // start with a number.
            // if div, multiply current by n, then append / n.
          }
        }
        // Let's use a simpler approach for 5_1_1_2:
        const n2 = randomInt(2, 9);
        const n3 = randomInt(2, 9);
        const n4 = randomInt(2, 9);
        if (randomInt(0, 1) === 0) {
          const n1 = n2 * randomInt(2, 9);
          q = `${n1} ÷ ${n2} × ${n3} = ?`;
          aStr = `${(n1 / n2) * n3}`;
        } else {
          const n1 = randomInt(2, 9);
          const n1n2 = n1 * n2;
          q = `${n1n2} × ${n3} ÷ ${n2} = ?`;
          aStr = `${n1n2 * n3 / n2}`;
        }
      } else if (area === '5_1_1_3') {
        // 덧셈, 뺄셈, 곱셈
        const n1 = randomInt(10, 30);
        const n2 = randomInt(2, 9);
        const n3 = randomInt(2, 9);
        const n4 = randomInt(5, 20);
        if (randomInt(0, 1) === 0) {
          q = `${n1} + ${n2} × ${n3} - ${n4} = ?`;
          aStr = `${n1 + n2 * n3 - n4}`;
        } else {
          const mul = n2 * n3;
          const n1_mod = randomInt(mul + 1, mul + 20);
          q = `${n1_mod} - ${n2} × ${n3} + ${n4} = ?`;
          aStr = `${n1_mod - mul + n4}`;
        }
      } else if (area === '5_1_1_4') {
        // 덧셈, 뺄셈, 나눗셈
        const n3 = randomInt(2, 9);
        const n2 = n3 * randomInt(2, 9);
        const n1 = randomInt(10, 50);
        const n4 = randomInt(5, 20);
        if (randomInt(0, 1) === 0) {
          q = `${n1} - ${n2} ÷ ${n3} + ${n4} = ?`;
          aStr = `${n1 - (n2 / n3) + n4}`;
        } else {
          q = `${n1} + ${n4} - ${n2} ÷ ${n3} = ?`;
          aStr = `${n1 + n4 - (n2 / n3)}`;
        }
      } else if (area === '5_1_1_5') {
        // 덧셈, 뺄셈, 곱셈, 나눗셈
        const n2 = randomInt(2, 9);
        const n3 = randomInt(2, 9);
        const n5 = randomInt(2, 9);
        const n4 = n5 * randomInt(2, 9);
        const mul = n2 * n3;
        const div = n4 / n5;
        const n1 = randomInt(div + 1, div + 20);
        if (randomInt(0, 1) === 0) {
          q = `${n1} + ${n2} × ${n3} - ${n4} ÷ ${n5} = ?`;
          aStr = `${n1 + mul - div}`;
        } else {
          q = `${n1} - ${n4} ÷ ${n5} + ${n2} × ${n3} = ?`;
          aStr = `${n1 - div + mul}`;
        }
      } else if (area === '5_1_1_6') {
        // ()가 있는 덧셈과 뺄셈 (()안에 3개 수 또는 () 2개)
        if (randomInt(0, 1) === 0) {
          const n2 = randomInt(10, 30);
          const n3 = randomInt(5, 15);
          const n4 = randomInt(2, 10);
          const n1 = randomInt(n2 + n3 - n4 + 1, 80);
          q = `${n1} - (${n2} + ${n3} - ${n4}) = ?`;
          aStr = `${n1 - (n2 + n3 - n4)}`;
        } else {
          const n2 = randomInt(10, 20);
          const n3 = randomInt(5, 15);
          const n4 = randomInt(5, 15);
          const n5 = randomInt(2, 10);
          const n1 = randomInt(n2 + n3 + 1, 50);
          q = `${n1} - (${n2} + ${n3}) + (${n4} - ${n5}) = ?`;
          aStr = `${n1 - (n2 + n3) + (n4 - n5)}`;
        }
      } else if (area === '5_1_1_7') {
        // ()가 있는 곱셈과 나눗셈
        const n2 = randomInt(2, 5);
        const n3 = randomInt(2, 5);
        const n4 = randomInt(2, 5);
        const n1 = (n2 * n3 * n4) * randomInt(2, 5);
        if (randomInt(0, 1) === 0) {
          q = `${n1} ÷ (${n2} × ${n3} × ${n4}) = ?`;
          aStr = `${n1 / (n2 * n3 * n4)}`;
        } else {
          const n1_alt = (n2 * n3) * randomInt(2, 5);
          q = `${n1_alt} ÷ (${n2} × ${n3}) × ${n4} = ?`;
          aStr = `${(n1_alt / (n2 * n3)) * n4}`;
        }
      } else if (area === '5_1_1_8') {
        // ()가 있는 덧셈, 뺄셈, 곱셈
        const n1 = randomInt(10, 30);
        const n2 = randomInt(5, 15);
        const n3 = randomInt(2, 9);
        const n4 = randomInt(5, 20);
        if (randomInt(0, 1) === 0) {
          q = `(${n1} + ${n2} - ${n4}) × ${n3} = ?`;
          aStr = `${(n1 + n2 - n4) * n3}`;
        } else {
          const n5 = randomInt(2, 5);
          q = `(${n1} + ${n2}) × ${n3} - ${n4} × ${n5} = ?`;
          const ans = (n1 + n2) * n3 - n4 * n5;
          if (ans < 0) {
            q = `${n4} × ${n5} + (${n1} + ${n2}) × ${n3} = ?`;
            aStr = `${n4 * n5 + (n1 + n2) * n3}`;
          } else {
            aStr = `${ans}`;
          }
        }
      } else if (area === '5_1_1_9') {
        // ()가 있는 덧셈, 뺄셈, 나눗셈
        const n3 = randomInt(2, 9);
        const sum = n3 * randomInt(3, 9);
        const n1 = randomInt(10, sum - 5);
        const n2 = sum - n1;
        const n4 = randomInt(5, 20);
        if (randomInt(0, 1) === 0) {
          q = `(${n1} + ${n2}) ÷ ${n3} + ${n4} = ?`;
          aStr = `${(n1 + n2) / n3 + n4}`;
        } else {
          const n5 = randomInt(2, 5);
          const n6 = n5 * randomInt(2, 5);
          q = `(${n1} + ${n2}) ÷ ${n3} + (${n4} - ${n6} ÷ ${n5}) = ?`;
          const ans = (n1 + n2) / n3 + (n4 - n6 / n5);
          if (n4 - n6 / n5 < 0) {
            q = `(${n1} + ${n2}) ÷ ${n3} + ${n4} = ?`;
            aStr = `${(n1 + n2) / n3 + n4}`;
          } else {
            aStr = `${ans}`;
          }
        }
      } else if (area === '5_1_1_10') {
        const numParentheses = randomInt(1, 2);
        if (numParentheses === 1) {
          const n4 = randomInt(2, 5);
          const sum = n4 * randomInt(2, 5);
          const n2 = randomInt(5, sum - 2);
          const n3 = sum - n2;
          const n1 = randomInt(10, 30);
          const n5 = randomInt(2, 5);
          if (randomInt(0, 1) === 0) {
            q = `${n1} + (${n2} + ${n3}) ÷ ${n4} × ${n5} = ?`;
            aStr = `${n1 + ((n2 + n3) / n4) * n5}`;
          } else {
            const n1_alt = randomInt(sum * n5 + 1, sum * n5 + 20);
            q = `${n1_alt} - (${n2} + ${n3}) × ${n5} ÷ ${n4} = ?`;
            aStr = `${n1_alt - ((n2 + n3) * n5) / n4}`;
          }
        } else {
          const n3 = randomInt(2, 5);
          const sum1 = n3 * randomInt(2, 5);
          const n1 = randomInt(5, sum1 - 2);
          const n2 = sum1 - n1;
          
          const n6 = randomInt(2, 5);
          const sum2 = n6 * randomInt(2, 5);
          const n4 = randomInt(5, sum2 - 2);
          const n5 = sum2 - n4;
          
          if (randomInt(0, 1) === 0) {
            q = `(${n1} + ${n2}) ÷ ${n3} + (${n4} + ${n5}) × ${n6} = ?`;
            aStr = `${((n1 + n2) / n3) + ((n4 + n5) * n6)}`;
          } else {
            const mul = ((n4 + n5) * n6);
            const div = ((n1 + n2) / n3);
            if (mul > div) {
              q = `(${n4} + ${n5}) × ${n6} - (${n1} + ${n2}) ÷ ${n3} = ?`;
              aStr = `${mul - div}`;
            } else {
              q = `(${n1} + ${n2}) ÷ ${n3} - (${n4} + ${n5}) × ${n6} = ?`;
              if (div - mul < 0) {
                q = `(${n4} + ${n5}) × ${n6} + (${n1} + ${n2}) ÷ ${n3} = ?`;
                aStr = `${mul + div}`;
              } else {
                aStr = `${div - mul}`;
              }
            }
          }
        }
      } else if (area === '5_1_1_11') {
        if (randomInt(0, 1) === 0) {
          const n5 = randomInt(2, 5);
          const res = randomInt(2, 5);
          const target = n5 * res;
          const n3 = randomInt(2, 5);
          const sum = Math.floor(target / n3) + randomInt(2, 5);
          const n1 = randomInt(2, sum - 2);
          const n2 = sum - n1;
          const n4 = (n1 + n2) * n3 - target;
          q = `{ (${n1} + ${n2}) × ${n3} - ${n4} } ÷ ${n5} = ?`;
          aStr = `${res}`;
        } else {
          const n6 = randomInt(2, 5);
          const res = randomInt(2, 5);
          const target = n6 * res;
          const n4 = randomInt(2, 5);
          const diff = Math.floor(target / n4);
          const n5 = target - diff * n4;
          const n3 = randomInt(5, 15);
          const n2 = n3 + diff;
          const n1 = randomInt(10, 30);
          q = `${n1} + { (${n2} - ${n3}) × ${n4} + ${n5} } ÷ ${n6} = ?`;
          aStr = `${n1 + res}`;
        }
      } else if (area === '5_1_2_1') {
        let n: number;
        let divisors: number[] = [];
        do {
          n = randomInt(10, 50);
          divisors = [];
          for (let i = 1; i <= n; i++) {
            if (n % i === 0) divisors.push(i);
          }
        } while (divisors.length <= 2 || divisors.length > 6);
        q = `${n}`;
        aStr = divisors.join(',');
      } else if (area === '5_1_2_2') {
        const n = randomInt(2, 15);
        q = `${n}`;
        aStr = `${n},${n*2},${n*3},${n*4}`;
      } else if (area === '5_1_2_3') {
        let n1: number = 0, n2: number = 0, g: number = 0;
        do {
          n1 = randomInt(10, 50);
          n2 = randomInt(10, 50);
          g = gcd(n1, n2);
        } while (g === 1 || n1 === n2);
        
        const getDivisors = (n: number) => {
          const d = [];
          for (let i = 1; i <= n; i++) {
            if (n % i === 0) d.push(i);
          }
          return d;
        };
        
        const dg = getDivisors(g);
        
        q = `${n1}, ${n2}`;
        aStr = dg.join(',');
      } else if (area === '5_1_2_4') {
        let n1: number = 0, n2: number = 0, g: number = 0;
        do {
          n1 = randomInt(10, 99);
          n2 = randomInt(10, 99);
          g = gcd(n1, n2);
        } while (g === 1 || n1 === n2);
        q = `${n1}, ${n2}`;
        aStr = `${g}`;
      } else if (area === '5_1_2_5') {
        const n1 = randomInt(4, 12);
        const n2 = randomInt(4, 12);
        const l = lcm(n1, n2);
        q = `${n1}, ${n2}`;
        aStr = `${l},${l*2},${l*3}`;
      } else if (area === '5_1_2_6') {
        const n1 = randomInt(2, 49);
        const n2 = randomInt(2, 49);
        const l = lcm(n1, n2);
        q = `${n1}, ${n2}`;
        aStr = `${l}`;
      } else if (area === '5_1_3_1') {
        const den = randomInt(3, 9);
        const num = randomInt(1, den - 1);
        const m = randomInt(1, 5);
        const hideNum = Math.random() < 0.5;
        if (hideNum) {
          q = JSON.stringify({ type: 'equivalent_fraction', num, den, targetDen: den * m });
          aStr = `${num * m}`;
        } else {
          q = JSON.stringify({ type: 'equivalent_fraction', num, den, targetNum: num * m });
          aStr = `${den * m}`;
        }
      } else if (area === '5_1_3_3') {
        let num, den, g;
        do {
          den = randomInt(10, 30);
          num = randomInt(2, den - 1);
          g = gcd(num, den);
        } while (g === 1);
        q = `FRAC(${num},${den})`;
        aStr = `FRAC(${num / g},${den / g})`;
      } else if (area === '5_1_3_4' || area === '5_1_3_5') {
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        let den2;
        do { den2 = randomInt(3, 9); } while (den1 === den2);
        const num2 = randomInt(1, den2 - 1);
        q = `FRAC(${num1},${den1}) , FRAC(${num2},${den2})`;
        let commonDen;
        if (area === '5_1_3_4') {
          commonDen = den1 * den2;
        } else {
          commonDen = lcm(den1, den2);
        }
        aStr = `FRAC(${num1 * (commonDen / den1)},${commonDen}),FRAC(${num2 * (commonDen / den2)},${commonDen})`;
      } else if (area === '5_1_3_6') {
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        let den2;
        do { den2 = randomInt(3, 9); } while (den1 === den2);
        const num2 = randomInt(1, den2 - 1);
        q = `FRAC(${num1},${den1}) ○ FRAC(${num2},${den2})`;
        const v1 = num1 / den1;
        const v2 = num2 / den2;
        aStr = v1 > v2 ? '>' : (v1 < v2 ? '<' : '=');
      } else if (area === '5_1_3_7') {
        const denOptions = [2, 4, 5, 10, 20, 25, 50];
        const den = denOptions[randomInt(0, denOptions.length - 1)];
        const num = randomInt(1, den - 1);
        q = `FRAC(${num},${den})`;
        aStr = `${num / den}`;
      } else if (area === '5_1_3_8') {
        const dec = randomInt(1, 99) / 100;
        q = `${dec}`;
        const num = Math.round(dec * 100);
        const den = 100;
        const g = gcd(num, den);
        aStr = `FRAC(${num / g},${den / g})`;
      } else if (area === '5_1_3_9') {
        const denOptions = [2, 4, 5, 10, 20, 25];
        const den = denOptions[randomInt(0, denOptions.length - 1)];
        const num = randomInt(1, den - 1);
        const dec = randomInt(1, 99) / 100;
        q = `FRAC(${num},${den}) ○ ${dec}`;
        const v1 = num / den;
        aStr = v1 > dec ? '>' : (v1 < dec ? '<' : '=');
      } else if (area === '5_1_4_1') {
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        let den2;
        do { den2 = randomInt(3, 9); } while (den1 === den2);
        const num2 = randomInt(1, den2 - 1);
        q = `FRAC(${num1},${den1}) + FRAC(${num2},${den2}) = ?`;
        const l = lcm(den1, den2);
        const sumNum = num1 * (l / den1) + num2 * (l / den2);
        if (sumNum >= l) {
          if (sumNum === l) aStr = '1';
          else {
            const g = gcd(sumNum - l, l);
            aStr = `MIXED(1,${(sumNum - l)/g},${l/g})`;
          }
        } else {
          const g = gcd(sumNum, l);
          aStr = `FRAC(${sumNum/g},${l/g})`;
        }
      } else if (area === '5_1_4_2' || area === '5_1_4_3') {
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        const w1 = randomInt(1, 3);
        let den2;
        do { den2 = randomInt(3, 9); } while (den1 === den2);
        const num2 = randomInt(1, den2 - 1);
        const w2 = randomInt(1, 3);
        q = `MIXED(${w1},${num1},${den1}) + MIXED(${w2},${num2},${den2}) = ?`;
        const l = lcm(den1, den2);
        const sumNum = num1 * (l / den1) + num2 * (l / den2);
        let resW = w1 + w2;
        let resNum = sumNum;
        if (resNum >= l) {
          resW += 1;
          resNum -= l;
        }
        if (resNum === 0) aStr = `${resW}`;
        else {
          const g = gcd(resNum, l);
          aStr = `MIXED(${resW},${resNum/g},${l/g})`;
        }
      } else if (area === '5_1_4_4') {
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        let den2;
        do { den2 = randomInt(3, 9); } while (den1 === den2);
        const num2 = randomInt(1, den2 - 1);
        const v1 = num1 / den1;
        const v2 = num2 / den2;
        if (v1 >= v2) {
          q = `FRAC(${num1},${den1}) - FRAC(${num2},${den2}) = ?`;
        } else {
          q = `FRAC(${num2},${den2}) - FRAC(${num1},${den1}) = ?`;
        }
        const l = lcm(den1, den2);
        const n1_adj = num1 * (l / den1);
        const n2_adj = num2 * (l / den2);
        const diffNum = Math.abs(n1_adj - n2_adj);
        if (diffNum === 0) aStr = '0';
        else {
          const g = gcd(diffNum, l);
          aStr = `FRAC(${diffNum/g},${l/g})`;
        }
      } else if (area === '5_1_4_5' || area === '5_1_4_6') {
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        const w1 = randomInt(3, 5);
        let den2;
        do { den2 = randomInt(3, 9); } while (den1 === den2);
        const num2 = randomInt(1, den2 - 1);
        const w2 = randomInt(1, 2);
        q = `MIXED(${w1},${num1},${den1}) - MIXED(${w2},${num2},${den2}) = ?`;
        const l = lcm(den1, den2);
        let n1_adj = num1 * (l / den1);
        const n2_adj = num2 * (l / den2);
        let resW = w1 - w2;
        if (n1_adj < n2_adj) {
          resW -= 1;
          n1_adj += l;
        }
        const diffNum = n1_adj - n2_adj;
        if (diffNum === 0) {
          aStr = `${resW}`;
        } else {
          const g = gcd(diffNum, l);
          if (resW === 0) aStr = `FRAC(${diffNum/g},${l/g})`;
          else aStr = `MIXED(${resW},${diffNum/g},${l/g})`;
        }
      } else {
        const def1 = randomInt(11, 99);
        const def2 = randomInt(11, 99);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else if (grade === 5 && semester === 2) {
      if (area === '5_2_1_1') {
        const den = randomInt(3, 9);
        const num = randomInt(1, den - 1);
        const n = randomInt(2, 9);
        q = `FRAC(${num},${den}) × ${n} = ?`;
        const resNum = num * n;
        if (resNum % den === 0) aStr = `${resNum / den}`;
        else {
          const g = gcd(resNum, den);
          const fNum = resNum / g;
          const fDen = den / g;
          if (fNum > fDen) aStr = `MIXED(${Math.floor(fNum/fDen)},${fNum%fDen},${fDen})`;
          else aStr = `FRAC(${fNum},${fDen})`;
        }
      } else if (area === '5_2_1_2') {
        const den = randomInt(3, 9);
        const num = randomInt(1, den - 1);
        const n = randomInt(2, 9);
        q = `${n} × FRAC(${num},${den}) = ?`;
        const resNum = num * n;
        if (resNum % den === 0) aStr = `${resNum / den}`;
        else {
          const g = gcd(resNum, den);
          const fNum = resNum / g;
          const fDen = den / g;
          if (fNum > fDen) aStr = `MIXED(${Math.floor(fNum/fDen)},${fNum%fDen},${fDen})`;
          else aStr = `FRAC(${fNum},${fDen})`;
        }
      } else if (area === '5_2_1_3') {
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        const den2 = randomInt(3, 9);
        const num2 = randomInt(1, den2 - 1);
        q = `FRAC(${num1},${den1}) × FRAC(${num2},${den2}) = ?`;
        const resNum = num1 * num2;
        const resDen = den1 * den2;
        const g = gcd(resNum, resDen);
        aStr = `FRAC(${resNum/g},${resDen/g})`;
      } else if (area === '5_2_1_4') {
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        const w1 = randomInt(1, 3);
        const den2 = randomInt(3, 9);
        const num2 = randomInt(1, den2 - 1);
        const w2 = randomInt(1, 3);
        q = `MIXED(${w1},${num1},${den1}) × MIXED(${w2},${num2},${den2}) = ?`;
        const fNum1 = w1 * den1 + num1;
        const fNum2 = w2 * den2 + num2;
        const resNum = fNum1 * fNum2;
        const resDen = den1 * den2;
        const g = gcd(resNum, resDen);
        const fNum = resNum / g;
        const fDen = resDen / g;
        if (fNum % fDen === 0) aStr = `${fNum / fDen}`;
        else aStr = `MIXED(${Math.floor(fNum/fDen)},${fNum%fDen},${fDen})`;
      } else if (area === '5_2_1_5') {
        const den1 = randomInt(2, 5);
        const num1 = randomInt(1, den1 - 1);
        const den2 = randomInt(2, 5);
        const num2 = randomInt(1, den2 - 1);
        const den3 = randomInt(2, 5);
        const num3 = randomInt(1, den3 - 1);
        q = `FRAC(${num1},${den1}) × FRAC(${num2},${den2}) × FRAC(${num3},${den3}) = ?`;
        const resNum = num1 * num2 * num3;
        const resDen = den1 * den2 * den3;
        const g = gcd(resNum, resDen);
        aStr = `FRAC(${resNum/g},${resDen/g})`;
      } else if (area === '5_2_1_6') {
        const den1 = randomInt(2, 5);
        const num1 = randomInt(1, den1 - 1);
        const w1 = randomInt(1, 2);
        const den2 = randomInt(2, 5);
        const num2 = randomInt(1, den2 - 1);
        const n3 = randomInt(2, 5);
        q = `MIXED(${w1},${num1},${den1}) × FRAC(${num2},${den2}) × ${n3} = ?`;
        const fNum1 = w1 * den1 + num1;
        const resNum = fNum1 * num2 * n3;
        const resDen = den1 * den2;
        const g = gcd(resNum, resDen);
        const fNum = resNum / g;
        const fDen = resDen / g;
        if (fNum % fDen === 0) aStr = `${fNum / fDen}`;
        else if (fNum > fDen) aStr = `MIXED(${Math.floor(fNum/fDen)},${fNum%fDen},${fDen})`;
        else aStr = `FRAC(${fNum},${fDen})`;
      } else if (area === '5_2_2_1') {
        const n1 = randomInt(11, 99) / 10;
        const n2 = randomInt(2, 9);
        q = `${n1} × ${n2} = ?`;
        aStr = `${Math.round(n1 * n2 * 10) / 10}`;
      } else if (area === '5_2_2_2') {
        const n1 = randomInt(11, 99) / 10;
        const n2 = Math.pow(10, randomInt(1, 3));
        q = `${n1} × ${n2} = ?`;
        aStr = `${Math.round(n1 * n2 * 10) / 10}`;
      } else if (area === '5_2_2_3') {
        const n1 = randomInt(11, 99) / 10;
        const n2 = randomInt(11, 99) / 10;
        q = `${n1} × ${n2} = ?`;
        aStr = `${Math.round(n1 * n2 * 100) / 100}`;
      } else if (area === '5_2_2_4') {
        const n1 = randomInt(11, 99) / 10;
        const n2 = randomInt(11, 99) / 10;
        const n3 = randomInt(2, 9) / 10;
        q = `${n1} × ${n2} × ${n3} = ?`;
        aStr = `${Math.round(n1 * n2 * n3 * 1000) / 1000}`;
      } else {
        const def1 = randomInt(11, 99);
        const def2 = randomInt(11, 99);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else if (grade === 6 && semester === 1) {
      if (area === '6_1_1_1') {
        const den = randomInt(3, 9);
        const num = randomInt(1, den - 1);
        const n = randomInt(2, 9);
        q = `FRAC(${num},${den}) ÷ ${n} = ?`;
        aStr = simplifyFraction(0, num, den * n);
      } else if (area === '6_1_1_2') {
        const den = randomInt(3, 9);
        const num = randomInt(1, den - 1);
        const n1 = randomInt(2, 9);
        const n2 = randomInt(2, 9);
        if (randomInt(0, 1) === 0) {
          q = `FRAC(${num},${den}) × ${n1} ÷ ${n2} = ?`;
        } else {
          q = `FRAC(${num},${den}) ÷ ${n2} × ${n1} = ?`;
        }
        aStr = simplifyFraction(0, num * n1, den * n2);
      } else if (area === '6_1_2_1') {
        const n2 = randomInt(2, 9);
        const ans = randomInt(11, 99);
        const n1 = ans * n2;
        q = `${(n1 / 10).toFixed(1)} ÷ ${n2} = ?`;
        aStr = `${(ans / 10).toFixed(1)}`;
      } else if (area === '6_1_2_2') {
        const n2 = randomInt(2, 8) * 2; // Ensure it terminates (factor of 2 or 5)
        const ans = randomInt(11, 99) * 5;
        const n1 = ans * n2;
        q = `${(n1 / 100).toFixed(1)} ÷ ${n2} = ?`;
        aStr = `${(ans / 100).toFixed(2)}`;
      } else if (area === '6_1_2_3') {
        const n2 = randomInt(2, 8) * 2;
        const ans = randomInt(11, 99) * 5;
        const n1 = ans * n2 / 10;
        if (Number.isInteger(n1)) {
          q = `${n1} ÷ ${n2} = ?`;
          aStr = `${(ans / 10).toFixed(1)}`;
        } else {
          q = `${n1 * 10} ÷ ${n2 * 10} = ?`;
          aStr = `${(ans / 10).toFixed(1)}`;
        }
      } else if (area === '6_1_2_4') {
        const n2 = randomInt(3, 9);
        const n1 = randomInt(10, 99);
        if (n1 % n2 === 0) {
          q = `${n1 + 1} ÷ ${n2} = ?`;
          aStr = `${((n1 + 1) / n2).toFixed(1)}`;
        } else {
          q = `${n1} ÷ ${n2} = ?`;
          aStr = `${(n1 / n2).toFixed(1)}`;
        }
      } else if (area === '6_1_3_1') {
        const n1 = randomInt(1, 20);
        const n2 = randomInt(2, 20);
        q = `${n1} : ${n2}`;
        aStr = simplifyFraction(0, n1, n2);
      } else if (area === '6_1_3_2') {
        const dens = [2, 4, 5, 10, 20, 25, 50];
        const den = dens[randomInt(0, dens.length - 1)];
        const num = randomInt(1, den - 1);
        q = `FRAC(${num},${den})`;
        aStr = `${Math.round((num / den) * 100)}%`;
      } else {
        const def1 = randomInt(11, 99);
        const def2 = randomInt(11, 99);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else if (grade === 6 && semester === 2) {
      if (area === '6_2_1_1') {
        if (randomInt(0, 1) === 0) {
          const n = randomInt(2, 10);
          const den = randomInt(2, 10);
          const num = 1;
          q = `${n} ÷ FRAC(${num},${den}) = ?`;
          aStr = simplifyFraction(0, n * den, num);
        } else {
          const den = randomInt(3, 15);
          const num2 = randomInt(1, Math.floor((den - 1) / 2));
          const mult = randomInt(2, Math.floor((den - 1) / num2));
          const num1 = num2 * mult;
          q = `FRAC(${num1},${den}) ÷ FRAC(${num2},${den}) = ?`;
          aStr = simplifyFraction(0, num1, num2);
        }
      } else if (area === '6_2_1_2') {
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        const den2 = randomInt(3, 9);
        const num2 = randomInt(1, den2 - 1);
        q = `FRAC(${num1},${den1}) ÷ FRAC(${num2},${den2}) = ?`;
        aStr = simplifyFraction(0, num1 * den2, den1 * num2);
      } else if (area === '6_2_1_3') {
        const w1 = randomInt(1, 3);
        const den1 = randomInt(3, 9);
        const num1 = randomInt(1, den1 - 1);
        const w2 = randomInt(0, 3);
        const den2 = randomInt(3, 9);
        const num2 = randomInt(1, den2 - 1);
        if (w2 === 0) {
          q = `MIXED(${w1},${num1},${den1}) ÷ FRAC(${num2},${den2}) = ?`;
          aStr = simplifyFraction(0, (w1 * den1 + num1) * den2, den1 * num2);
        } else {
          q = `MIXED(${w1},${num1},${den1}) ÷ MIXED(${w2},${num2},${den2}) = ?`;
          aStr = simplifyFraction(0, (w1 * den1 + num1) * den2, den1 * (w2 * den2 + num2));
        }
      } else if (area === '6_2_2_1') {
        const ans = randomInt(2, 20);
        const n2 = randomInt(2, 20);
        const n1 = ans * n2;
        q = `${(n1 / 10).toFixed(1)} ÷ ${(n2 / 10).toFixed(1)} = ?`;
        aStr = `${ans}`;
      } else if (area === '6_2_2_2') {
        const ans = randomInt(2, 20);
        const n2 = randomInt(2, 99);
        const n1 = ans * n2;
        q = `${(n1 / 100).toFixed(2)} ÷ ${(n2 / 100).toFixed(2)} = ?`;
        aStr = `${ans}`;
      } else if (area === '6_2_2_3') {
        const ans = randomInt(2, 20);
        const n2 = randomInt(2, 20);
        const n1 = ans * n2;
        if (randomInt(0, 1) === 0) {
          q = `${(n1 / 10).toFixed(1)} ÷ ${(n2 / 100).toFixed(2)} = ?`;
          aStr = `${ans * 10}`;
        } else {
          q = `${(n1 / 100).toFixed(2)} ÷ ${(n2 / 10).toFixed(1)} = ?`;
          aStr = `${ans / 10}`;
        }
      } else if (area === '6_2_2_4') {
        const ans = randomInt(2, 20);
        const n2 = randomInt(2, 20);
        const n1 = ans * n2;
        q = `${n1} ÷ ${(n2 / 10).toFixed(1)} = ?`;
        aStr = `${ans * 10}`;
      } else if (area === '6_2_2_5') {
        const q_val = randomInt(2, 9);
        const r_val = randomInt(1, 8);
        const n2 = randomInt(r_val + 1, 15);
        const n1 = q_val * n2 + r_val;
        q = `${(n1 / 10).toFixed(1)} ÷ ${(n2 / 10).toFixed(1)} = ?`;
        aStr = `Q_R(${q_val},${(r_val / 10).toFixed(1)})`;
      } else if (area === '6_2_2_10') {
        const ops = ['+', '-', '×', '÷'];
        const op1 = ops[randomInt(0, 3)];
        const op2 = ops[randomInt(0, 3)];
        const dens = [2, 4, 5, 8, 10];
        
        const getTerm = () => {
          if (randomInt(0, 1) === 0) {
            const den = dens[randomInt(0, dens.length - 1)];
            const num = randomInt(1, den * 2);
            return { str: `FRAC(${num},${den})`, val: num / den };
          } else {
            const val = randomInt(1, 20) / 10;
            return { str: `${val.toFixed(1)}`, val: val };
          }
        };

        const t1 = getTerm();
        const t2 = getTerm();
        const t3 = getTerm();

        q = `${t1.str} ${op1} ${t2.str} ${op2} ${t3.str} = ?`;

        const evalOp = (a: number, op: string, b: number) => {
          if (op === '+') return a + b;
          if (op === '-') return a - b;
          if (op === '×') return a * b;
          if (op === '÷') return a / b;
          return 0;
        };

        let ans = 0;
        if ((op1 === '×' || op1 === '÷') && (op2 === '+' || op2 === '-')) {
          ans = evalOp(evalOp(t1.val, op1, t2.val), op2, t3.val);
        } else if ((op1 === '+' || op1 === '-') && (op2 === '×' || op2 === '÷')) {
          ans = evalOp(t1.val, op1, evalOp(t2.val, op2, t3.val));
        } else {
          ans = evalOp(evalOp(t1.val, op1, t2.val), op2, t3.val);
        }

        aStr = `${Math.round(ans * 100) / 100}`;
      } else if (area === '6_2_2_11') {
        const ops = ['+', '-', '×', '÷'];
        const op1 = ops[randomInt(0, 3)];
        const op2 = ops[randomInt(0, 3)];
        const op3 = ops[randomInt(0, 3)];
        const dens = [2, 4, 5, 8, 10];
        
        const getTerm = () => {
          if (randomInt(0, 1) === 0) {
            const den = dens[randomInt(0, dens.length - 1)];
            const num = randomInt(1, den * 2);
            return { str: `FRAC(${num},${den})`, val: num / den };
          } else {
            const val = randomInt(1, 20) / 10;
            return { str: `${val.toFixed(1)}`, val: val };
          }
        };

        const t1 = getTerm();
        const t2 = getTerm();
        const t3 = getTerm();
        const t4 = getTerm();

        q = `${t1.str} ${op1} ${t2.str} ${op2} ${t3.str} ${op3} ${t4.str} = ?`;

        const evalOp = (a: number, op: string, b: number) => {
          if (op === '+') return a + b;
          if (op === '-') return a - b;
          if (op === '×') return a * b;
          if (op === '÷') return a / b;
          return 0;
        };

        // Simple evaluation respecting precedence
        const tokens = [t1.val, op1, t2.val, op2, t3.val, op3, t4.val];
        
        // Pass 1: × and ÷
        for (let i = 1; i < tokens.length; i += 2) {
          if (tokens[i] === '×' || tokens[i] === '÷') {
            const a = tokens[i - 1] as number;
            const b = tokens[i + 1] as number;
            const res = evalOp(a, tokens[i] as string, b);
            tokens.splice(i - 1, 3, res);
            i -= 2;
          }
        }
        
        // Pass 2: + and -
        let ans = tokens[0] as number;
        for (let i = 1; i < tokens.length; i += 2) {
          ans = evalOp(ans, tokens[i] as string, tokens[i + 1] as number);
        }

        aStr = `${Math.round(ans * 100) / 100}`;
      } else if (area === '6_2_3_1') {
        const n1 = randomInt(2, 50);
        const n2 = randomInt(2, 50);
        const g = gcd(n1, n2);
        q = `${n1} : ${n2}`;
        aStr = `${n1 / g} : ${n2 / g}`;
      } else if (area === '6_2_3_2') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(2, 9);
        const m = randomInt(2, 5);
        if (randomInt(0, 1) === 0) {
          q = `${n1} : ${n2} = ☐ : ${n2 * m}`;
          aStr = `${n1 * m}`;
        } else {
          q = `${n1} : ${n2} = ${n1 * m} : ☐`;
          aStr = `${n2 * m}`;
        }
      } else if (area === '6_2_3_3') {
        const n1 = randomInt(2, 9);
        const n2 = randomInt(2, 9);
        const m = randomInt(2, 5);
        if (randomInt(0, 1) === 0) {
          q = `${(n1 / 10).toFixed(1)} : ${(n2 / 10).toFixed(1)} = ☐ : ${n2 * m}`;
          aStr = `${n1 * m}`;
        } else {
          q = `${(n1 / 10).toFixed(1)} : ${(n2 / 10).toFixed(1)} = ${n1 * m} : ☐`;
          aStr = `${n2 * m}`;
        }
      } else if (area === '6_2_3_4') {
        const den = randomInt(3, 9);
        const num1 = randomInt(1, den - 1);
        const num2 = randomInt(1, den - 1);
        const m = randomInt(2, 5);
        if (randomInt(0, 1) === 0) {
          q = `FRAC(${num1},${den}) : FRAC(${num2},${den}) = ☐ : ${num2 * m}`;
          aStr = `${num1 * m}`;
        } else {
          q = `FRAC(${num1},${den}) : FRAC(${num2},${den}) = ${num1 * m} : ☐`;
          aStr = `${num2 * m}`;
        }
      } else if (area === '6_2_3_5') {
        const a = randomInt(1, 5);
        const b = randomInt(1, 5);
        const m = randomInt(2, 10);
        const total = (a + b) * m;
        q = `${total} (${a} : ${b})`;
        aStr = `${a * m},${b * m}`;
      } else {
        const def1 = randomInt(11, 99);
        const def2 = randomInt(11, 99);
        q = `${def1} + ${def2} = ?`;
        aStr = `${def1 + def2}`;
      }
    } else {
      // Fallback for other grades/semesters
      const def1 = randomInt(1, 10);
      const def2 = randomInt(1, 10);
      q = `${def1} + ${def2} = ?`;
      aStr = `${def1 + def2}`;
    }

      // Format answers: remove trailing zeros for decimals
      if (aStr) {
        aStr = aStr.split(/,(?![^()]*\))/g).map(part => {
          if (part.startsWith('MIXED') || part.startsWith('FRAC') || part.includes('>')) return part;
          if (part.startsWith('Q_R')) {
            const m = part.match(/Q_R\((.*?),(.*?)\)/);
            if (m) {
              const qVal = !isNaN(Number(m[1])) ? String(Number(m[1])) : m[1];
              const rVal = !isNaN(Number(m[2])) ? String(Number(m[2])) : m[2];
              return `Q_R(${qVal},${rVal})`;
            }
          }
          if (!isNaN(Number(part)) && part !== '') {
            return String(Number(part));
          }
          return part;
        }).join(',');
      }

      const fractionAreas = ['5_1_3', '5_1_4', '5_2_1', '6_1_1', '6_2_1'];
      if (grade >= 5 && fractionAreas.some(fa => area.startsWith(fa)) && area !== '6_2_1_1') {
         if (/^-?\d+$/.test(aStr)) {
            retries++;
            continue;
         }
      }

      if (grade >= 3) {
        if (!usedQuestions.has(q) && !usedAnswers.has(aStr)) break;
      } else {
        if (!usedQuestions.has(q)) break;
      }
      retries++;
    }
    
    usedQuestions.add(q);
    usedAnswers.add(aStr);
    problems.push({ question: q, correctAnswer: aStr });
  }
  return problems;
}
