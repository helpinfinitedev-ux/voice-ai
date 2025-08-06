import React, { useEffect } from 'react';
import PlayIcon from '@/assets/PlayIcon';
import PauseIcon from '@/assets/PauseIcon';
import { Button } from '../ui/button';

const AudioButtons = ({
  voices,
  voice,
  setSelectedVoice,
  setAudioPlaying,
  setSelectedButtons,
  audioPlaying,
  selectedButtons,
}) => {
  const handSelecteToneButtons = (idx) => {
    setAudioPlaying(idx);
    setSelectedButtons(idx);
    setSelectedVoice(voices[idx].path);
  };
  const playAudio = (audio, idx) => {
    playAudioOnButton(audio);

    setSelectedVoice(audio);
    setAudioPlaying(idx);
  };
  const pauseAudio = (audio, idx) => {
    const audioElement = document.getElementById('audio');
    audioElement.pause();
    setAudioPlaying(null);
  };
  const playAudioOnButton = (audio) => {
    console.log('playAudio');
    const audioElement = document.getElementById('audio');
    if (audioElement.getAttribute('src') !== audio) {
      audioElement.setAttribute('src', audio);
    }
    audioElement.play();
  };

  useEffect(() => {
    if (voice && (!!selectedButtons === true || selectedButtons === 0)) {
      console.log(audioPlaying);
      if (!!audioPlaying === true || audioPlaying === 0) {
        playAudioOnButton(voices[audioPlaying].path);
      }
    }
  }, [selectedButtons, voice, audioPlaying]);
  console.log(audioPlaying);
  return voices.map((item, idx) => (
    <Button
      className="flex items-center gap-2"
      onClick={(e) => {
        e.stopPropagation(); // This stops the click from propagating to child elements
        handSelecteToneButtons(idx);
      }}
      variant={selectedButtons === idx ? 'original' : 'outline'}
      key={idx}
    >
      {audioPlaying === idx ? (
        <p
          onClick={(e) => {
            e.stopPropagation(); // Stop propagation here
            pauseAudio(voices[idx].path, idx);
          }}
        >
          <PauseIcon />
        </p>
      ) : (
        <p
          onClick={(e) => {
            e.stopPropagation(); // Stop propagation here
            playAudio(voices[idx].path, idx);
          }}
        >
          <PlayIcon />
        </p>
      )}
      {item.name}
    </Button>
  ));
};

export default AudioButtons;
