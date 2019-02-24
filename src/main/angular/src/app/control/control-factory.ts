/*
Copyright (C) 2017 Axel Müller <axel.mueller@avanux.de>

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import {Control} from './control';
import {StartingCurrentSwitch} from '../control-startingcurrent/starting-current-switch';
import {Switch} from '../control-switch/switch';
import {ModbusSwitch} from '../control-modbus/modbus-switch';
import {HttpSwitch} from '../control-http/http-switch';
import {AlwaysOnSwitch} from './always-on-switch';
import {ControlDefaults} from './control-defaults';
import {MockSwitch} from './mock-switch';
import {Logger} from '../log/logger';
import {ModbusRegisterWrite} from '../shared/modbus-register-write';
import {ModbusRegisterWriteValue} from '../shared/modbus-register-write-value';
import {EvCharger} from '../control-evcharger/ev-charger';
import {ModbusRegisterConfguration} from '../shared/modbus-register-confguration';
import {EvModbusControl} from '../control-evcharger/ev-modbus-control';
import {ModbusRegisterRead} from '../shared/modbus-register-read';
import {ModbusRegisterReadValue} from '../shared/modbus-register-read-value';

export class ControlFactory {

  constructor(private logger: Logger) {
  }

  defaultsFromJSON(rawControlDefaults: any): ControlDefaults {
    this.logger.debug('ControlDefaults (JSON): ' + JSON.stringify(rawControlDefaults));
    const controlDefaults = new ControlDefaults();
    controlDefaults.startingCurrentSwitchDefaults_powerThreshold
      = rawControlDefaults.startingCurrentSwitchDefaults.powerThreshold;
    controlDefaults.startingCurrentSwitchDefaults_startingCurrentDetectionDuration
      = rawControlDefaults.startingCurrentSwitchDefaults.startingCurrentDetectionDuration;
    controlDefaults.startingCurrentSwitchDefaults_finishedCurrentDetectionDuration
      = rawControlDefaults.startingCurrentSwitchDefaults.finishedCurrentDetectionDuration;
    controlDefaults.startingCurrentSwitchDefaults_minRunningTime
      = rawControlDefaults.startingCurrentSwitchDefaults.minRunningTime;
    this.logger.debug('ControlDefaults (TYPE): ' + JSON.stringify(controlDefaults));
    return controlDefaults;
  }

  createEmptyControl(): Control {
    return new Control();
  }

  fromJSON(rawControl: any): Control {
    this.logger.debug('Control (JSON): ' + JSON.stringify(rawControl));
    const control = new Control();
    if (rawControl['@class'] === StartingCurrentSwitch.TYPE) {
      control.startingCurrentDetection = true;
      control.startingCurrentSwitch = this.createStartingCurrentSwitch(rawControl);
      this.fromJSONbyType(control, rawControl.control);
    } else {
      this.fromJSONbyType(control, rawControl);
    }
    this.logger.debug('Control (TYPE): ' + JSON.stringify(control));
    return control;
  }

  fromJSONbyType(control: Control, rawControl: any) {
    if (rawControl != null) {
      control.type = rawControl['@class'];
      if (control.type === AlwaysOnSwitch.TYPE) {
        control.alwaysOnSwitch = this.createAlwaysOnSwitch(rawControl);
      } else if (control.type === MockSwitch.TYPE) {
        control.mockSwitch = this.createMockSwitch(rawControl);
      } else if (control.type === Switch.TYPE) {
        control.switch_ = this.createSwitch(rawControl);
      } else if (control.type === ModbusSwitch.TYPE) {
        control.modbusSwitch = this.createModbusSwitch(rawControl);
      } else if (control.type === EvCharger.TYPE) {
        control.evCharger = this.createEvCharger(rawControl);
      } else if (control.type === HttpSwitch.TYPE) {
        control.httpSwitch = this.createHttpSwitch(rawControl);
      }
    }
  }

  getControlByType(control: Control): any {
    if (control.type === AlwaysOnSwitch.TYPE) {
      return control.alwaysOnSwitch;
    } else if (control.type === MockSwitch.TYPE) {
      return control.mockSwitch;
    } else if (control.type === Switch.TYPE) {
      return control.switch_;
    } else if (control.type === ModbusSwitch.TYPE) {
      return control.modbusSwitch;
    } else if (control.type === EvCharger.TYPE) {
      return control.evCharger;
    } else if (control.type === HttpSwitch.TYPE) {
      return control.httpSwitch;
    }
    return null;
  }

  createAlwaysOnSwitch(rawAlwaysOnSwitch: any): AlwaysOnSwitch {
    return new AlwaysOnSwitch();
  }

  createMockSwitch(rawMockSwitch: any): MockSwitch {
    return new MockSwitch();
  }

  createStartingCurrentSwitch(rawStartingCurrentSwitch: any): StartingCurrentSwitch {
    const startingCurrentSwitch = new StartingCurrentSwitch();
    startingCurrentSwitch.powerThreshold = rawStartingCurrentSwitch.powerThreshold;
    startingCurrentSwitch.startingCurrentDetectionDuration = rawStartingCurrentSwitch.startingCurrentDetectionDuration;
    startingCurrentSwitch.finishedCurrentDetectionDuration = rawStartingCurrentSwitch.finishedCurrentDetectionDuration;
    startingCurrentSwitch.minRunningTime = rawStartingCurrentSwitch.minRunningTime;
    return startingCurrentSwitch;
  }

  createSwitch(rawSwitch: any): Switch {
    const switch_ = new Switch();
    switch_.gpio = rawSwitch.gpio;
    switch_.reverseStates = rawSwitch.reverseStates;
    return switch_;
  }

  createModbusSwitch(rawModbusSwitch: any): ModbusSwitch {
    const modbusSwitch = new ModbusSwitch();
    modbusSwitch.idref = rawModbusSwitch.idref;
    modbusSwitch.slaveAddress = rawModbusSwitch.slaveAddress;
    if (rawModbusSwitch.registerWrites != null) {
      modbusSwitch.registerAddress = rawModbusSwitch.registerWrites[0].address;
      modbusSwitch.registerType = rawModbusSwitch.registerWrites[0].type;
      rawModbusSwitch.registerWrites[0].registerWriteValues.forEach((registerWrite) => {
        if (registerWrite.name === 'On') {
          modbusSwitch.onValue = registerWrite.value;
        }
        if (registerWrite.name === 'Off') {
          modbusSwitch.offValue = registerWrite.value;
        }
      });
    }
    return modbusSwitch;
  }

  createHttpSwitch(rawHttpSwitch: any): HttpSwitch {
    const httpSwitch = new HttpSwitch();
    httpSwitch.onUrl = rawHttpSwitch.onUrl;
    httpSwitch.offUrl = rawHttpSwitch.offUrl;
    httpSwitch.username = rawHttpSwitch.username;
    httpSwitch.password = rawHttpSwitch.password;
    httpSwitch.contentType = rawHttpSwitch.contentType;
    httpSwitch.onData = rawHttpSwitch.onData;
    httpSwitch.offData = rawHttpSwitch.offData;
    return httpSwitch;
  }

  createEvCharger(rawEvCharger: any): EvCharger {
    const rawModbusControl = rawEvCharger.control;

    const configurations: ModbusRegisterConfguration[] = [];

    (rawModbusControl.registerReads as any[]).map(
      registerRead => (registerRead.registerReadValues as any[]).map(registerReadValue => {
        const configuration = new ModbusRegisterConfguration({
          name: registerReadValue.name,
          address: registerRead.address,
          type: registerRead.type,
          bytes: registerRead.bytes,
          byteOrder: registerRead.byteOrder,
          extractionRegex: registerReadValue.extractionRegex,
          write: false
        });
        configurations.push(configuration);
      }));

    (rawModbusControl.registerWrites as any[]).map(
      registerWrite => (registerWrite.registerWriteValues as any[]).map(registerWriteValue => {
        const configuration = new ModbusRegisterConfguration({
          name: registerWriteValue.name,
          address: registerWrite.address,
          type: registerWrite.type,
          value: registerWriteValue.value,
          write: true
        });
        configurations.push(configuration);
      }));

    const evModbusControl = new EvModbusControl({
      idref: rawModbusControl.idref,
      slaveAddress: rawModbusControl.slaveAddress,
      configuration: configurations
    });

    const evCharger = new EvCharger({
      voltage: rawEvCharger.voltage,
      phases: rawEvCharger.phases,
      pollInterval: rawEvCharger.pollInterval,
      startChargingStateDetectionDelay: rawEvCharger.startChargingStateDetectionDelay,
      forceInitialCharging: rawEvCharger.forceInitialCharging,
      control: evModbusControl
    });
    return evCharger;
  }

  toJSON(control: Control): string {
    this.logger.debug('Control (TYPE): ' + JSON.stringify(control));
    let controlUsed: any;
    if (control.startingCurrentSwitch != null) {
      control.startingCurrentSwitch['control'] = this.getControlByType(control);
      controlUsed = control.startingCurrentSwitch;
      if (controlUsed.powerThreshold === '') {
        controlUsed.powerThreshold = null;
      }
      if (controlUsed.startingCurrentDetectionDuration === '') {
        controlUsed.startingCurrentDetectionDuration = null;
      }
      if (controlUsed.finishedCurrentDetectionDuration === '') {
        controlUsed.finishedCurrentDetectionDuration = null;
      }
      if (controlUsed.minRunningTime === '') {
        controlUsed.minRunningTime = null;
      }
    } else {
      controlUsed = this.getControlByType(control);
    }
    let rawControl: string;
    if (controlUsed != null) {
      if (control.type === ModbusSwitch.TYPE) {
        this.toJSONModbusSwitch(control);
      }
      if (control.type === EvCharger.TYPE) {
        this.toJSONEvCharger(control);
      }
      rawControl = JSON.stringify(controlUsed);
    }
    this.logger.debug('Control (JSON): ' + rawControl);
    return rawControl;
  }

  toJSONModbusSwitch(control: Control) {
    const registerWriteValueOn = new ModbusRegisterWriteValue({
      name: 'On',
      value: control.modbusSwitch.onValue
    });
    const registerWriteValueOff = new ModbusRegisterWriteValue({
      name: 'Off',
      value: control.modbusSwitch.offValue
    });

    const registerWrite = new ModbusRegisterWrite();
    registerWrite.address = control.modbusSwitch.registerAddress;
    registerWrite.type = control.modbusSwitch.registerType;
    registerWrite.registerWriteValues = [registerWriteValueOn, registerWriteValueOff];
    control.modbusSwitch.registerWrites = [registerWrite];
  }

  toJSONEvCharger(control: Control) {
    const registerReads: ModbusRegisterRead[] = [];
    control.evCharger.control.configuration
      .filter(configuration => configuration.write === false)
      .forEach(configuration => {
        let matchinRegisterRead: ModbusRegisterRead = registerReads.find(
          item => item.address === configuration.address
        );
        if (matchinRegisterRead === undefined) {
          matchinRegisterRead = new ModbusRegisterRead({
            address: configuration.address,
            type: configuration.type,
            registerReadValues: []
          });
          registerReads.push(matchinRegisterRead);
        }
        const registerReadValue = new ModbusRegisterReadValue({
          name: configuration.name,
          extractionRegex: configuration.extractionRegex
        });
        matchinRegisterRead.registerReadValues.push(registerReadValue);
      });
    control.evCharger.control.registerReads = registerReads;

    const registerWrites: ModbusRegisterWrite[] = [];
    control.evCharger.control.configuration
      .filter(configuration => configuration.write)
      .forEach(configuration => {
        let matchingRegisterWrite: ModbusRegisterWrite = registerWrites.find(
          item => item.address === configuration.address
        );
        if (matchingRegisterWrite === undefined) {
          matchingRegisterWrite = new ModbusRegisterWrite({
            address: configuration.address,
            type: configuration.type,
            registerWriteValues: []
          });
          registerWrites.push(matchingRegisterWrite);
        }
        const registerWriteValue = new ModbusRegisterWriteValue({
          name: configuration.name,
          value: configuration.value
        });
        matchingRegisterWrite.registerWriteValues.push(registerWriteValue);
      });
    control.evCharger.control.registerWrites = registerWrites;
  }
}
