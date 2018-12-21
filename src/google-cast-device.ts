import * as isIp from 'is-ip'
import * as mdns from 'mdns'

export class GoogleCastDevice {
  public ip: string;
  private name?: string;

  public constructor(identifier: string) {
    if(isIp(identifier)) {
      this.ip = identifier;
    } else {
      this.name = identifier;
    }
  }

  public isDiscovered(): boolean {
    return this.ip !== undefined && isIp(this.ip);
  }

  public async discover(timeout: number): Promise<void> {
    const browser = mdns.createBrowser(mdns.tcp("googlecast"));

    return new Promise((resolve, reject) => {            
      browser.start();

      browser.on("serviceUp", service => {
        browser.stop();

        // Only use the first IP address in the array
        const address = service.addresses[0];
        console.log(
          `Device ${service.txtRecord.fn} at ${address}:${service.port} found`
        );

        if (service.txtRecord.fn.includes(this.name)) {
          this.ip = address;
          resolve();
        }
      });

      setTimeout(() => {
        reject(`.device.find(): Search timeout`);
      }, timeout);
    });
  }
}