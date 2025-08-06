export const getTranscriptObject = (transcript) => {
  if (!transcript) return;
  const resultArr = [];
  let prevRole = 'agent';
  for (let i = 0; i < transcript.length; i += 1) {
    const element = transcript[i];
    if (i === 0) {
      resultArr.push({ role: element.role, content: element.content });
    } else if (prevRole === element.role) {
      resultArr[resultArr.length - 1].content += `\n${element.content}`;
    } else {
      resultArr.push({ role: element.role, content: element.content });
    }
    prevRole = element.role;
  }
  return resultArr;
};
export const color = [
  '#95daf5',
  '#91ffb6',
  '#FFBB5C',
  '#faab82',
  '#fc9d9d',
  '#f98383',
  '#e9c8fa',
];
export const textFromBg = {
  '#95daf5': '#0b4054',
  '#91ffb6': '#1a6e36',
  '#FFBB5C': '#422d10',
  '#faab82': '#541e02',
  '#fc9d9d': '#470101',
  '#f98383': '#470101',
  '#e9c8fa': '#28043b',
};
export const getBg = (idx) => color[idx % color.length];
