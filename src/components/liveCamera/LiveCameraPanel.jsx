import {
  Expand,
  Pause,
  Play,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import CameraStream from './CameraStream';

const CAMERA_HLS_URL =
  'https://agents.sammyacht.com/mobotix/index.m3u8';

function formatTime(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function LiveCameraPanel() {
  const navigate = useNavigate();
  const frameRef = useRef(null);

  const [isPlaying, setIsPlaying] =
    useState(true);

  const [isMuted, setIsMuted] =
    useState(true);

  const [streamStatus, setStreamStatus] =
    useState('connecting');

  const [currentDateTime, setCurrentDateTime] =
    useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStreamReady =
    useCallback(() => {
      setStreamStatus('live');
    }, []);

  const handleStreamError =
    useCallback((error) => {
      console.error(
        'Dashboard camera stream failed:',
        error,
      );

      setStreamStatus('error');
    }, []);

  async function handleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await frameRef.current
          ?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error(
        'Unable to open fullscreen mode:',
        error,
      );
    }
  }

  function handleOpenCameraPage() {
    navigate('/live-camera');
  }

  function getStatusLabel() {
    if (streamStatus === 'error') {
      return 'Offline';
    }

    if (streamStatus === 'connecting') {
      return 'Connecting';
    }

    if (!isPlaying) {
      return 'Paused';
    }

    return 'Live';
  }

  const statusLabel =
    getStatusLabel();

  return (
    <div className="live-camera-content">
      <div className="live-camera-toolbar">
        <div className="live-camera-status">
          <span
            className={
              streamStatus === 'live'
                ? 'live-status-dot'
                : 'live-status-dot live-status-dot-offline'
            }
          />

          <span>{statusLabel}</span>
        </div>

        <div className="live-camera-model">
          <Radio size={14} />

          <span>
            Classification model pending
          </span>
        </div>
      </div>

      <div
        ref={frameRef}
        className="live-camera-frame"
      >
        <CameraStream
          src={CAMERA_HLS_URL}
          playing={isPlaying}
          muted={isMuted}
          onStreamReady={
            handleStreamReady
          }
          onStreamError={
            handleStreamError
          }
        />

        <div className="live-camera-timestamp">
          {formatTime(currentDateTime)}
        </div>

        <div className="live-camera-controls">
          <div className="camera-control-group">
            <button
              type="button"
              onClick={() =>
                setIsPlaying(
                  (current) =>
                    !current,
                )
              }
              aria-label={
                isPlaying
                  ? 'Pause camera'
                  : 'Play camera'
              }
            >
              {isPlaying ? (
                <Pause size={17} />
              ) : (
                <Play size={17} />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setIsMuted(
                  (current) =>
                    !current,
                )
              }
              aria-label={
                isMuted
                  ? 'Unmute camera'
                  : 'Mute camera'
              }
            >
              {isMuted ? (
                <VolumeX size={17} />
              ) : (
                <Volume2 size={17} />
              )}
            </button>
          </div>

          <button
            type="button"
            aria-label="Open camera full screen"
            onClick={handleFullscreen}
          >
            <Expand size={17} />
          </button>
        </div>
      </div>

      <div className="live-camera-footer">
        <div>
          <span>Stream status</span>
          <strong className="model-active">
            {statusLabel}
          </strong>
        </div>

        <div>
          <span>Model status</span>
          <strong>Pending</strong>
        </div>

        <div>
          <span>Last update</span>
          <strong>
            {formatTime(currentDateTime)}
          </strong>
        </div>
      </div>

      <div className="live-camera-panel-bottom">
        <button
          type="button"
          className="live-camera-view-all"
          onClick={handleOpenCameraPage}
        >
          View full camera
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

export default LiveCameraPanel;