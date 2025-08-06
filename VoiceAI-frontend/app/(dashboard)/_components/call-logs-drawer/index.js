export const getTranscriptObject = (transcript) => {
  if (!transcript) return;
  const resultArr = [];
  let prevRole = 'agent';
  for (let i = 0; i < transcript.length; i += 1) {
    const element = transcript[i];
    if (i === 0) {
      resultArr.push({
        role: element.role,
        content: element.content,
        words: element.words,
      });
    } else if (prevRole === element.role) {
      resultArr[resultArr.length - 1].content += `\n${element.content}`;
      resultArr[resultArr.length - 1].words = [
        ...resultArr[resultArr.length - 1].words,
        ...element.words,
      ];
    } else {
      resultArr.push({
        role: element.role,
        content: element.content,
        words: element.words,
      });
    }
    prevRole = element.role;
  }
  return resultArr;
};
