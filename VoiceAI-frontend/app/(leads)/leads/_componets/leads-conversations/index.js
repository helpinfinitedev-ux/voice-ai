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
export function sortItems(items) {
  return items.sort((a, b) => {
    // Check if either item has the status 'scheduled'
    const isACompleted = a.status === 'completed';
    const isBCompleted = b.status === 'completed';

    if (isACompleted && !isBCompleted) {
      // 'a' is scheduled, 'b' is not, 'b' should come first
      return -1;
    }
    if (!isACompleted && isBCompleted) {
      // 'b' is scheduled, 'a' is not, 'a' should come first
      return 1;
    }
    return b.end_timestamp - a.end_timestamp;
  });
}
