import {MeterPage} from './meter.page';
import {HttpElectricityMeter} from '../../../../../main/angular/src/app/meter/http/http-electricity-meter';
import {MeterValueName} from '../../../../../main/angular/src/app/meter/meter-value-name';
import {HttpReadPage} from '../http/http-read.page';

export class HttpMeterPage extends MeterPage {

  private static selectorPrefix = 'app-meter-http';
  private static i18nPrefix = 'MeterHttpComponent.';

  public static async setHttpElectricityMeter(t: TestController, httpElectricityMeter: HttpElectricityMeter) {
    await HttpMeterPage.setType(t, HttpElectricityMeter.TYPE);

    const powerHttpRead = httpElectricityMeter.httpReads.find(
      httpRead => httpRead.readValues.find(httpReadValue => httpReadValue.name === MeterValueName.Power));
    let httpReadIndex = 0;
    if (powerHttpRead) {
      await HttpReadPage.setHttpRead(t, powerHttpRead, httpReadIndex, this.selectorPrefix);
    }

    const energyHttpRead = httpElectricityMeter.httpReads.find(
      httpRead => httpRead.readValues.find(httpReadValue => httpReadValue.name === MeterValueName.Energy));
    if (energyHttpRead) {
      if (powerHttpRead) {
        httpReadIndex += 1;
        await HttpReadPage.clickAddHttpRead(t, this.selectorPrefix, 'MeterHttpComponent__addHttpRead');
      }
      await HttpReadPage.setHttpRead(t, energyHttpRead, httpReadIndex, this.selectorPrefix);
    }
  }

  public static async assertHttpElectricityMeter(t: TestController, httpElectricityMeter: HttpElectricityMeter) {
    await HttpMeterPage.assertType(t, HttpElectricityMeter.TYPE);

    const powerHttpRead = httpElectricityMeter.httpReads.find(
      httpRead => httpRead.readValues.find(httpReadValue => httpReadValue.name === MeterValueName.Power));
    let httpReadIndex = 0;
    if (powerHttpRead) {
      await HttpReadPage.assertHttpRead(t, powerHttpRead, httpReadIndex, true, this.selectorPrefix, HttpMeterPage.i18nPrefix);
    }

    const energyHttpRead = httpElectricityMeter.httpReads.find(
      httpRead => httpRead.readValues.find(httpReadValue => httpReadValue.name === MeterValueName.Energy));
    if (energyHttpRead) {
      if (powerHttpRead) {
        httpReadIndex += 1;
      }
      await HttpReadPage.assertHttpRead(t, energyHttpRead, httpReadIndex, true, this.selectorPrefix, HttpMeterPage.i18nPrefix);
    }
  }

}
