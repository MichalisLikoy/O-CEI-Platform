import Hls from 'hls.js';
import {
  AlertCircle,
  Camera,
  LoaderCircle,
} from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
} from 'react';

const CameraStream = forwardRef(
  function CameraStream(
    {
      src,
      playing = true,
      muted = true,
      onStreamReady,
      onStreamError,
    },
    forwardedRef,
  ) {
    const videoRef = useRef(null);

    const [status, setStatus] =
      useState('idle');

    /*
     * --------------------------------------------------
     * INITIALIZE HLS STREAM
     * --------------------------------------------------
     */
    useEffect(() => {
      const video = videoRef.current;

      if (!video) {
        return undefined;
      }

      /*
       * Επιτρέπουμε στο parent component
       * να έχει πρόσβαση στο <video>.
       */
      if (typeof forwardedRef === 'function') {
        forwardedRef(video);
      } else if (forwardedRef) {
        forwardedRef.current = video;
      }

      if (!src) {
        setStatus('not-configured');
        return undefined;
      }

      let hls = null;
      let destroyed = false;

      setStatus('loading');

      /*
       * --------------------------------------------------
       * NATIVE HLS
       * Safari / iPhone / iPad
       * --------------------------------------------------
       */
      if (
        video.canPlayType(
          'application/vnd.apple.mpegurl',
        )
      ) {
        console.log(
          'Using native HLS playback:',
          src,
        );

        video.src = src;

        video.load();

        if (playing) {
          video.play().catch((error) => {
            console.warn(
              'Native HLS autoplay prevented:',
              error,
            );
          });
        }
      }

      /*
       * --------------------------------------------------
       * HLS.JS
       * Chrome / Edge / Firefox
       * --------------------------------------------------
       */
      else if (Hls.isSupported()) {
        console.log(
          'Using hls.js playback:',
          src,
        );

        hls = new Hls({
          enableWorker: true,

          /*
           * Καλύτερο για live camera stream.
           */
          lowLatencyMode: true,

          /*
           * Δεν κρατάμε μεγάλο history
           * του live stream.
           */
          backBufferLength: 10,

          /*
           * Ξεκινάμε κοντά στο live edge.
           */
          liveSyncDurationCount: 2,

          liveMaxLatencyDurationCount: 5,
        });

        /*
         * Πρώτα συνδέουμε το video element.
         */
        hls.attachMedia(video);

        /*
         * Μόλις συνδεθεί το media,
         * φορτώνουμε το HLS URL.
         */
        hls.on(
          Hls.Events.MEDIA_ATTACHED,
          () => {
            if (destroyed) {
              return;
            }

            console.log(
              'HLS media attached',
            );

            hls.loadSource(src);
          },
        );

        /*
         * Το manifest φορτώθηκε.
         *
         * Αυτό ΔΕΝ σημαίνει ακόμη ότι
         * έχουμε εικόνα.
         */
        hls.on(
          Hls.Events.MANIFEST_PARSED,
          (_, data) => {
            console.log(
              'HLS manifest parsed:',
              data.levels,
            );

            if (playing) {
              video.play().catch(
                (error) => {
                  console.warn(
                    'HLS autoplay prevented:',
                    error,
                  );
                },
              );
            }
          },
        );

        /*
         * Πολύ χρήσιμο για debugging.
         *
         * Αν βλέπουμε αυτά τα logs,
         * σημαίνει ότι φτάνουν πραγματικά
         * video fragments από MediaMTX.
         */
        hls.on(
          Hls.Events.FRAG_LOADED,
          (_, data) => {
            console.log(
              'HLS fragment loaded:',
              data.frag?.sn,
            );
          },
        );

        /*
         * --------------------------------------------------
         * HLS ERROR HANDLING
         * --------------------------------------------------
         */
        hls.on(
          Hls.Events.ERROR,
          (_, data) => {
            console.error(
              'HLS stream error:',
              data,
            );

            if (!data.fatal) {
              return;
            }

            /*
             * Network error.
             */
            if (
              data.type ===
              Hls.ErrorTypes.NETWORK_ERROR
            ) {
              console.warn(
                'Trying HLS network recovery...',
              );

              hls.startLoad();

              return;
            }

            /*
             * Video decoding error.
             */
            if (
              data.type ===
              Hls.ErrorTypes.MEDIA_ERROR
            ) {
              console.warn(
                'Trying HLS media recovery...',
              );

              hls.recoverMediaError();

              return;
            }

            /*
             * Fatal error που δεν μπορούμε
             * να ανακτήσουμε.
             */
            setStatus('error');

            onStreamError?.(data);

            hls.destroy();
          },
        );
      } else {
        const error = new Error(
          'HLS playback is not supported by this browser.',
        );

        console.error(error);

        setStatus('error');

        onStreamError?.(error);
      }

      /*
       * --------------------------------------------------
       * CLEANUP
       * --------------------------------------------------
       */
      return () => {
        destroyed = true;

        console.log(
          'Destroying camera stream',
        );

        if (hls) {
          hls.destroy();
        }

        video.pause();

        video.removeAttribute('src');

        video.load();
      };
    }, [src]);

    /*
     * --------------------------------------------------
     * PLAY / PAUSE
     * --------------------------------------------------
     */
    useEffect(() => {
      const video = videoRef.current;

      if (!video) {
        return;
      }

      if (playing) {
        video.play().catch((error) => {
          console.warn(
            'Unable to play camera stream:',
            error,
          );
        });
      } else {
        video.pause();
      }
    }, [playing]);

    /*
     * --------------------------------------------------
     * MUTE
     * --------------------------------------------------
     */
    useEffect(() => {
      const video = videoRef.current;

      if (!video) {
        return;
      }

      video.muted = muted;
    }, [muted]);

    /*
     * --------------------------------------------------
     * NO CAMERA URL
     * --------------------------------------------------
     */
    if (!src) {
      return (
        <div className="camera-full-placeholder">
          <Camera size={66} />

          <strong>
            Camera stream not configured
          </strong>

          <span>
            Add the HLS stream URL to the
            camera configuration.
          </span>
        </div>
      );
    }

    return (
      <>
        <video
          ref={videoRef}
          className="camera-stream-video"

          autoPlay
          muted={muted}
          playsInline

          /*
           * Το browser έχει metadata.
           */
          onLoadedMetadata={(event) => {
            const video =
              event.currentTarget;

            console.log(
              'VIDEO METADATA LOADED:',
              {
                width:
                  video.videoWidth,
                height:
                  video.videoHeight,
                duration:
                  video.duration,
              },
            );
          }}

          /*
           * Έχουμε πραγματικά video data.
           */
          onLoadedData={(event) => {
            const video =
              event.currentTarget;

            console.log(
              'VIDEO DATA LOADED:',
              video.videoWidth,
              video.videoHeight,
            );
          }}

          /*
           * Αυτό είναι το σημαντικότερο event.
           *
           * Τώρα ξέρουμε ότι το stream
           * πραγματικά παίζει.
           */
          onPlaying={() => {
            console.log(
              'VIDEO IS ACTUALLY PLAYING',
            );

            setStatus('ready');

            onStreamReady?.();
          }}

          onWaiting={() => {
            console.log(
              'VIDEO WAITING FOR DATA',
            );
          }}

          onStalled={() => {
            console.warn(
              'VIDEO PLAYBACK STALLED',
            );
          }}

          onError={(event) => {
            const error =
              event.currentTarget.error;

            console.error(
              'VIDEO ELEMENT ERROR:',
              error,
            );

            setStatus('error');

            onStreamError?.(error);
          }}
        />

        <div className="camera-roi-box">
          <span>Classification zone</span>
        </div>

        {status === 'loading' && (
          <div className="camera-stream-state">
            <LoaderCircle
              size={34}
              className="button-icon-spin"
            />

            <span>
              Connecting to camera...
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="camera-stream-state camera-stream-error">
            <AlertCircle size={34} />

            <strong>
              Camera unavailable
            </strong>

            <span>
              Unable to load the HLS
              stream.
            </span>
          </div>
        )}
      </>
    );
  },
);

export default CameraStream;