import { Client as GoogleCastClient, DefaultMediaReceiver} from 'castv2-client'
import * as googleTTS from 'google-tts-api'
import { GoogleCastDevice } from './google-cast-device'
import { GoogleHomeOptions } from './types'

export class GoogleHome {
  private device: GoogleCastDevice;
  private options: GoogleHomeOptions;

  constructor(deviceIdentifier: string, {language="en", accent="en", timeout=5000}: {language?: string, accent?: string, timeout?: number}) {
    this.device = new GoogleCastDevice(deviceIdentifier);
    this.options = {
      language: language,
      accent: accent,
      timeout: timeout
    };
  }

  public async speak(message: string, language?: string): Promise<void> {
    if (!message) {
      console.error(".speak(): The text to speak cannot be empty");
      return;
    }

    return new Promise<void>(async (resolve, reject) => {
      const url = await googleTTS(message, language || this.options.language, 1, 3000, this.options.accent);
      await this.push(url);
    });
  }

  public async push(url: string): Promise<void> {
    if (!this.device.isDiscovered()) {
      await this.device.discover(this.options.timeout);
    }

    return new Promise<void>(async (resolve, reject) => {
      const client = new GoogleCastClient();
        client.connect(this.device.ip, () => {
          client.launch(DefaultMediaReceiver, (err, player) => {
            const media = {
              contentId: url,
              contentType: "audio/mp3",
              streamType: "BUFFERED"
            };

            player.load(media, { autoplay: true }, (err, status) => {
              client.close();
              console.log(`Pushed to device at ${this.device.ip}`);
            });
          });
        }
      );

      client.on("error", err => {
        reject(`Google Cast Client error:\n${err}`);
        client.close();
      });
    });
  }
}