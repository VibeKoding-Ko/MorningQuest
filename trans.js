import fs from 'fs';
import fetch from 'node-fetch';

async function translate(text, target) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data[0].map(x => x[0]).join('');
  } catch(e) {
    console.error(`Error translating: ${text}`, e);
    return text;
  }
}

async function run() {
  const writingFile = fs.readFileSync('src/lib/writingTopics.ts', 'utf8');

  // get topics
  const topicsSection = writingFile.split('export const WRITING_TOPICS = [')[1].split('];')[0];
  const topicRegex = /"(.*?)"/g;
  const topics = [];
  let match;
  while ((match = topicRegex.exec(topicsSection)) !== null) {
      topics.push(match[1]);
  }

  // get guides
  const guideRegex = /guide[12] = "(.*?)";/g;
  const guides = [];
  while ((match = guideRegex.exec(writingFile)) !== null) {
      guides.push(match[1]);
  }
  guides.push("이 주제와 관련된 나의 경험이나 생각은 무엇인가요?");
  guides.push("그렇게 생각한 특별한 이유가 있나요?");

  const allStrings = [...new Set([...topics, ...guides])].filter(s => !!s.trim());

  const langs = {
    'en': 'en',
    'ru': 'ru',
    'zh': 'zh-CN',
    'vi': 'vi'
  };

  const output = fs.existsSync('src/lib/generatedThemesTranslations.json') 
    ? JSON.parse(fs.readFileSync('src/lib/generatedThemesTranslations.json', 'utf8'))
    : {};

  for (let i = 0; i < allStrings.length; i++) {
    const str = allStrings[i];
    if (output[str]) continue; // Skip existing translations
    
    output[str] = {};
    for (const [lang, target] of Object.entries(langs)) {
       output[str][lang] = await translate(str, target);
       await new Promise(r => setTimeout(r, 100)); // Sleep to prevent rate limit on free endpoint
    }
    if (i % 10 === 0) {
      console.log(`Translated ${i}/${allStrings.length}`);
      fs.writeFileSync('src/lib/generatedThemesTranslations.json', JSON.stringify(output, null, 2));
    }
  }

  fs.writeFileSync('src/lib/generatedThemesTranslations.json', JSON.stringify(output, null, 2));
  console.log('Done!');
}

run();
