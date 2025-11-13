import { useEffect } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { sessionReplayPlugin } from '@amplitude/plugin-session-replay-browser';

export function AmplitudeProvider() {
  useEffect(() => {
    amplitude.add(sessionReplayPlugin({ sampleRate: 1 }));

    amplitude.init('7d559bd95c2dfb5a17653a383f8f2e21', {
      autocapture: {
        elementInteractions: true,
      },
    });
  }, []);

  return null;
}
