import {
  CircleDot,
  Expand,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Ship,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import CameraStream from '../components/liveCamera/CameraStream';

// DEMO MODE.      ΕΠΑΝΑΦΕΡΩ ΜΕΤΑ ΤΗΝ ΕΠΙΔΕΙΞΗ
// Real detections service temporarily disabled.
//
// import {
//   getDetections,
// 
//import {
//  getDetections,
//} from '../services/detectionsService';

/*
|--------------------------------------------------------------------------
| Camera configuration
|--------------------------------------------------------------------------
*/

const CAMERAS = {
  'camera-01': {
    id: 'camera-01',
    name: 'Malta Freeport Camera 01',
    hlsUrl:
      'https://agents.sammyacht.com/mobotix/index.m3u8',
  },
  /*
    'camera-02': {
      id: 'camera-02',
      name: 'Malta Freeport Camera 02',
      hlsUrl: '',
    },
    */
};









/*
|--------------------------------------------------------------------------
| Demo detections. ΣΒΗΝΩ ΜΕΤΑ ΤΗΝ ΕΠΙΔΕΙΞΗ
|--------------------------------------------------------------------------
|
| Temporary presentation data.
| Live camera stream remains active.
|
*/

const DEMO_DETECTIONS = [
  {
    id: 'demo-pilot-8',
    vessel_class: 'Other',
    confidence: 0.951,
    crop_image_url: '/demo-detections/other2.png',
    detected_at: '2026-09-21T09:18:42',
    method: 'classification',
    direction: 'Not available',
  },
  {
    id: 'demo-pilot-7',
    vessel_class: 'Other',
    confidence: 0.762,
    crop_image_url: '/demo-detections/other1.png',
    detected_at: '2026-09-19T13:13:12',
    method: 'classification',
    direction: 'Not available',
  },
  {
    id: 'demo-pilot-6',
    vessel_class: 'Other',
    confidence: 0.760,
    crop_image_url: '/demo-detections/other1.png',
    detected_at: '2026-09-19T13:13:08',
    method: 'classification',
    direction: 'Not available',
  },
  {
    id: 'demo-pilot-5',
    vessel_class: 'Port Service Vessel',
    confidence: 0.904,
    crop_image_url: '/demo-detections/pilot5.png',
    detected_at: '2026-09-15T15:20:16',
    method: 'classification',
    direction: 'Not available',
  },
  {
    id: 'demo-pilot-4',
    vessel_class: 'Port Service Vessel',
    confidence: 0.967,
    crop_image_url: '/demo-detections/pilot4.png',
    detected_at: '2026-09-15T15:18:58',
    method: 'classification',
    direction: 'Not available',
  },
  {
    id: 'demo-pilot-3',
    vessel_class: 'Port Service Vessel',
    confidence: 0.962,
    crop_image_url: '/demo-detections/pilot3.png',
    detected_at: '2026-09-15T15:18:49',
    method: 'classification',
    direction: 'Not available',
  },
  {
    id: 'demo-pilot-2',
    vessel_class: 'Port Service Vessel',
    confidence: 0.916,
    crop_image_url: '/demo-detections/pilot2.png',
    detected_at: '2026-09-15T15:17:03',
    method: 'classification',
    direction: 'Not available',
  },
  {
    id: 'demo-pilot-1',
    vessel_class: 'Port Service Vessel',
    confidence: 0.918,
    crop_image_url: '/demo-detections/pilot1.png',
    detected_at: '2026-09-15T15:16:17',
    method: 'classification',
    direction: 'Not available',
  },
];


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatDateTime(date) {
  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date));
}


function formatTime(date) {
  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date));
}


function formatConfidence(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return '—';
  }

  return `${(
    Number(value) * 100
  ).toFixed(1)}%`;
}


function formatClassName(value) {
  if (!value) {
    return 'Unknown';
  }

  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}


/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

function LiveCameraPage() {
  const cameraFrameRef = useRef(null);

  const [
    selectedCamera,
    setSelectedCamera,
  ] = useState('camera-01');

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(true);

  const [
    isMuted,
    setIsMuted,
  ] = useState(true);

  const [
    streamStatus,
    setStreamStatus,
  ] = useState('connecting');

  const [
    streamKey,
    setStreamKey,
  ] = useState(0);

  const [
    currentDateTime,
    setCurrentDateTime,
  ] = useState(new Date());

  const [
    lastRefresh,
    setLastRefresh,
  ] = useState(new Date());


  /*
  |--------------------------------------------------------------------------
  | Detection state.  ΕΠΑΝΑΦΕΡΩ ΜΕΤΑ ΤΗΝ ΕΠΙΔΕΙΞΗ
  |--------------------------------------------------------------------------
  

  const [
    detections,
    setDetections,
  ] = useState([]);

  const [
    detectionsLoading,
    setDetectionsLoading,
  ] = useState(true);

  const [
    detectionsError,
    setDetectionsError,
  ] = useState(null);
*/
// ΣΒΗΝΩ ΜΕΤΑ ΤΗΝ ΕΠΙΔΕΙΞΗ
  const [
    detections,
    setDetections,
  ] = useState(DEMO_DETECTIONS);

  const [
    detectionsLoading,
    setDetectionsLoading,
  ] = useState(false);

  const [
    detectionsError,
    setDetectionsError,
  ] = useState(null);

  /////////////////////////////////////////////

  const activeCamera =
    CAMERAS[selectedCamera];

  const latestDetection =
    detections.length > 0
      ? detections[0]
      : null;

  const recentDetections =
    detections.slice(0, 8);


  /*
  |--------------------------------------------------------------------------
  | Load detections ΕΠΑΝΑΦΕΡΩ ΜΕΤΑ ΤΗΝ ΕΠΙΔΕΙΞΗ
  |--------------------------------------------------------------------------
  

  const loadDetections =
    useCallback(async () => {
      try {
        const data =
          await getDetections();

        setDetections(
          Array.isArray(data)
            ? data
            : [],
        );

        setDetectionsError(null);

      } catch (error) {
        console.error(
          'Failed to load detections:',
          error,
        );

        setDetectionsError(
          'Unable to load detections.',
        );

      } finally {
        setDetectionsLoading(false);
      }
    }, []);


  useEffect(() => {
    loadDetections();

    const interval = setInterval(
      loadDetections,
      10000,
    );

    return () => {
      clearInterval(interval);
    };
  }, [loadDetections]);


  /*
  |--------------------------------------------------------------------------
  | Clock
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);


  /*
  |--------------------------------------------------------------------------
  | Stream callbacks
  |--------------------------------------------------------------------------
  */

  const handleStreamReady =
    useCallback(() => {
      setStreamStatus('live');
    }, []);


  const handleStreamError =
    useCallback((error) => {
      console.error(
        'Camera stream failed:',
        error,
      );

      setStreamStatus('error');
    }, []);


  /*
  |--------------------------------------------------------------------------
  | Camera change
  |--------------------------------------------------------------------------
  */

  function handleCameraChange(event) {
    const cameraId =
      event.target.value;

    setSelectedCamera(cameraId);

    setIsPlaying(true);

    setStreamStatus(
      'connecting',
    );

    setStreamKey(
      (currentKey) =>
        currentKey + 1,
    );

    setLastRefresh(
      new Date(),
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Play / Pause
  |--------------------------------------------------------------------------
  */

  function handlePlayPause() {
    setIsPlaying(
      (currentPlaying) =>
        !currentPlaying,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Mute
  |--------------------------------------------------------------------------
  */

  function handleMuteToggle() {
    setIsMuted(
      (currentMuted) =>
        !currentMuted,
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Fullscreen
  |--------------------------------------------------------------------------
  */

  async function handleFullscreen() {
    try {
      if (
        !document.fullscreenElement
      ) {
        await cameraFrameRef
          .current
          ?.requestFullscreen();
      } else {
        await document
          .exitFullscreen();
      }

    } catch (error) {
      console.error(
        'Unable to open fullscreen:',
        error,
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  */

  function handleRefresh() {
    setLastRefresh(
      new Date(),
    );

    setIsPlaying(true);

    setStreamStatus(
      'connecting',
    );

    setStreamKey(
      (currentKey) =>
        currentKey + 1,
    );
    // ΕΠΑΝΑΦΕΡΩ ΜΕΤΑ ΤΗΝ ΕΠΙΔΕΙΞΗ
   // loadDetections();

   
  // ΣΒΗΝΩ ΜΕΤΑ ΤΗΝ ΕΠΙΔΕΙΞΗ
  setDetections(DEMO_DETECTIONS);
  }


  /*
  |--------------------------------------------------------------------------
  | Status
  |--------------------------------------------------------------------------
  */

  function getStreamStatusLabel() {
    if (!activeCamera?.hlsUrl) {
      return 'Not configured';
    }

    if (
      streamStatus === 'error'
    ) {
      return 'Offline';
    }

    if (
      streamStatus ===
      'connecting'
    ) {
      return 'Connecting...';
    }

    if (!isPlaying) {
      return 'Paused';
    }

    return 'Live';
  }


  const streamStatusLabel =
    getStreamStatusLabel();

  const streamIsHealthy =
    streamStatus === 'live';


  return (
    <div className="page-content">

      {/* ------------------------------------------------------------
          Heading
      ------------------------------------------------------------ */}

      <div className="page-heading live-camera-page-heading">

        <div>
          <span className="page-eyebrow">
            Computer vision
          </span>

          <p>
            Monitor the live Malta port camera
            feed and vessel classification results.
          </p>
        </div>

        <button
          type="button"
          className="page-refresh-button"
          onClick={handleRefresh}
        >
          <RefreshCw size={16} />

          Refresh
        </button>

      </div>


      {/* ------------------------------------------------------------
          Summary
      ------------------------------------------------------------ */}

      <section className="camera-page-summary">

        <article>
          <div className="camera-page-summary-icon">
            <Video size={20} />
          </div>

          <div>
            <span>
              Stream status
            </span>

            <strong
              className={
                streamIsHealthy &&
                  isPlaying
                  ? 'camera-summary-live'
                  : ''
              }
            >
              {streamStatusLabel}
            </strong>
          </div>
        </article>


        <article>
          <div className="camera-page-summary-icon">
            <Radio size={20} />
          </div>

          <div>
            <span>
              Classification model
            </span>

            <strong className="camera-summary-live">
              Active
            </strong>
          </div>
        </article>


        <article>
          <div className="camera-page-summary-icon">
            <Ship size={20} />
          </div>

          <div>
            <span>
              Detection events
            </span>

            <strong>
              {detections.length}
            </strong>
          </div>
        </article>


        <article>
          <div className="camera-page-summary-icon">
            <CircleDot size={20} />
          </div>

          <div>
            <span>
              Camera
            </span>

            <strong>
              {activeCamera?.name}
            </strong>
          </div>
        </article>

      </section>


      {/* ------------------------------------------------------------
          Camera + latest detection
      ------------------------------------------------------------ */}

      <section className="camera-page-layout">

        {/* ==========================================================
            LIVE CAMERA
        ========================================================== */}

        <article className="full-page-panel camera-main-panel">

          <div className="camera-page-toolbar">

            <div className="camera-selector-group">

              <label htmlFor="camera-select">
                Camera source
              </label>

              <select
                id="camera-select"
                value={selectedCamera}
                onChange={
                  handleCameraChange
                }
              >
                {Object.values(
                  CAMERAS,
                ).map((camera) => (
                  <option
                    key={camera.id}
                    value={camera.id}
                  >
                    {camera.name}
                  </option>
                ))}
              </select>

            </div>


            <div className="camera-model-status">
              <Radio size={15} />

              <span>
                Classification Active
              </span>
            </div>

          </div>


          {/* Camera */}

          <div
            ref={cameraFrameRef}
            className="camera-full-frame"
          >

            <CameraStream
              key={`${selectedCamera}-${streamKey}`}
              src={
                activeCamera?.hlsUrl ||
                ''
              }
              playing={isPlaying}
              muted={isMuted}
              onStreamReady={
                handleStreamReady
              }
              onStreamError={
                handleStreamError
              }
            />


            {/* ROI */}

            {selectedCamera ===
              'camera-01' && (
                <div className="camera-fixed-roi">

                  <span>
                    Classification ROI
                  </span>

                </div>
              )}


            {/* LIVE badge */}

            <div className="camera-full-live-badge">
              <span />

              {streamStatus === 'error'
                ? 'OFFLINE'
                : streamStatus ===
                  'connecting'
                  ? 'CONNECTING'
                  : isPlaying
                    ? 'LIVE'
                    : 'PAUSED'}
            </div>


            {/* Timestamp */}

            <div className="camera-full-timestamp">
              {formatDateTime(
                currentDateTime,
              )}
            </div>


            {/* Controls */}

            <div className="camera-full-controls">

              <div>

                <button
                  type="button"
                  onClick={
                    handlePlayPause
                  }
                >
                  {isPlaying ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} />
                  )}
                </button>


                <button
                  type="button"
                  onClick={
                    handleMuteToggle
                  }
                >
                  {isMuted ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                </button>

              </div>


              <button
                type="button"
                onClick={
                  handleFullscreen
                }
              >
                <Expand size={18} />
              </button>

            </div>

          </div>


          {/* Camera info */}

          <div className="camera-stream-information">

            <div>
              <span>
                Last refresh
              </span>

              <strong>
                {formatDateTime(
                  lastRefresh,
                )}
              </strong>
            </div>


            <div>
              <span>
                Stream
              </span>

              <strong>
                RTSP → HLS
              </strong>
            </div>


            <div>
              <span>
                Model
              </span>

              <strong>
                Vessel Classification
              </strong>
            </div>


            <div>
              <span>
                Inference
              </span>

              <strong className="camera-summary-live">
                Running
              </strong>
            </div>

          </div>

        </article>


        {/* ==========================================================
            LATEST DETECTION
        ========================================================== */}

        <aside className="full-page-panel latest-detection-panel">

          <div className="latest-detection-header">

            <div>
              <span>
                Latest result
              </span>

              <h2>
                Latest Detection
              </h2>
            </div>


            {latestDetection && (
              <div className="latest-detection-confidence">
                {formatConfidence(
                  latestDetection.confidence,
                )}
              </div>
            )}

          </div>


          {detectionsLoading ? (

            <div className="camera-empty-state">
              Loading detection...
            </div>

          ) : detectionsError ? (

            <div className="camera-empty-state">
              {detectionsError}
            </div>

          ) : !latestDetection ? (

            <div className="camera-empty-state">
              No detections available.
            </div>

          ) : (

            <>

              <div className="latest-detection-image">

                {latestDetection
                  .crop_image_url ? (

                  <img
                    src={
                      latestDetection
                        .crop_image_url
                    }
                    alt={
                      latestDetection
                        .vessel_class
                    }
                  />

                ) : (

                  <div className="camera-empty-state">
                    No image available
                  </div>

                )}

              </div>


              <div className="latest-detection-class">

                <div>
                  <span>
                    Classified as
                  </span>

                  <strong>
                    {formatClassName(
                      latestDetection
                        .vessel_class,
                    )}
                  </strong>
                </div>


                <div className="latest-detection-confidence-inline">
                  {formatConfidence(
                    latestDetection.confidence,
                  )}
                </div>

              </div>


              <div className="latest-detection-meta">

                <div>
                  <span>
                    Detected
                  </span>

                  <strong>
                    {formatDateTime(
                      latestDetection
                        .detected_at,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Method
                  </span>

                  <strong>
                    {formatClassName(
                      latestDetection
                        .method,
                    )}
                  </strong>
                </div>


                <div>
                  <span>
                    Direction
                  </span>

                  <strong>
                    {latestDetection
                      .direction ||
                      'Not available'}
                  </strong>
                </div>

              </div>

            </>

          )}

        </aside>

      </section>


      {/* ------------------------------------------------------------
          Recent detections
      ------------------------------------------------------------ */}

      <section className="full-page-panel recent-detections-panel">

        <div className="recent-detections-header">

          <div>
            <span>
              Classification history
            </span>

            <h2>
              Recent Detections
            </h2>
          </div>

          <span className="recent-detections-count">
            Last {recentDetections.length}
          </span>

        </div>


        {detectionsLoading ? (

          <div className="camera-empty-state">
            Loading detections...
          </div>

        ) : recentDetections.length === 0 ? (

          <div className="camera-empty-state">
            No classification events yet.
          </div>

        ) : (

          <div className="recent-detections-grid">

            {recentDetections.map(
              (detection) => (

                <article
                  className="recent-detection-card"
                  key={detection.id}
                >

                  <div className="recent-detection-image">

                    {detection
                      .crop_image_url ? (

                      <img
                        src={
                          detection
                            .crop_image_url
                        }
                        alt={
                          detection
                            .vessel_class
                        }
                      />

                    ) : (

                      <div className="camera-empty-state">
                        No image
                      </div>

                    )}

                  </div>


                  <div className="recent-detection-body">

                    <div className="recent-detection-title">

                      <strong>
                        {formatClassName(
                          detection
                            .vessel_class,
                        )}
                      </strong>

                      <span>
                        {formatConfidence(
                          detection
                            .confidence,
                        )}
                      </span>

                    </div>


                    <div className="recent-detection-time">

                      <CircleDot size={13} />

                      {formatDateTime(
                        detection
                          .detected_at,
                      )}

                    </div>

                  </div>

                </article>

              ),
            )}

          </div>

        )}

      </section>

    </div>
  );
}

export default LiveCameraPage;