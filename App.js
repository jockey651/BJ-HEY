import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';

//const { uuid } = require('uuidv4');  I don't know if this needed -bj //

let Disp;
const App = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [inputPhoneNum, setInputPhoneNum] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [balance, setBalance] = useState(0.0); 

  const Submit = () => {
    setPhoneNum(inputPhoneNum);

  };
  
  const NotValid = () => {
    return inputPhoneNum.length !== 8;
  };
  
  return (
    <View style={styles.container}>
      {isSubmitted ? (
        <HomeView phoneNum={phoneNum} balance={balance}/>
      ) : (
        <RegisterView
          inputPhoneNum={inputPhoneNum}
          setInputPhoneNum={setInputPhoneNum}
          setIsSubmitted={setIsSubmitted}
          Submit={Submit}
          NotValid={NotValid}
        />
      )}
    </View>
  );
};

const RegisterView = ({
  inputPhoneNum,
  setInputPhoneNum,
  setIsSubmitted,
  Submit,
  NotValid,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Phone number"
        keyboardType="number-pad"
        style={styles.textInput}
        value={inputPhoneNum}
        onChangeText={(text) => setInputPhoneNum(text)}
      />
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => {
          Submit();
          setIsSubmitted(true);
        }}
        disabled={NotValid()}
      >
        <Text style={styles.buttonText}>Confirm</Text>
      </TouchableOpacity>
    </View>
  );
};

const HomeView = ({ phoneNum, balance }) => {
  return (
    <View style={styles.container}>
      <Text>HKD {balance.toFixed(1)}</Text>
      <Text>{phoneNum}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    width: 200,
    height: 50,
    backgroundColor: 'lightgray',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  submitButton: {
    width: 200,
    height: 50,
    backgroundColor: 'lightgray',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
});

export default App;

const TransferService = {
  serviceUUID: '4eaeddb4-5ba4-4ceb-8522-3552e3f79e2f',
  characteristicUUID: '5191fdf7-4546-4e3f-9946-0b0bfa0a4f26',
};

let phoneNum = '';

let disP;
let tranC;

class Bluetooth {
  constructor() {
    this.isConnected = false;
    this.centralManager = new BluetoothCentralManager(this);
    this.discoveredPeripheral = null;
    this.transferCharacteristic = null;
    this.writeIterationsComplete = 0;
    this.connectionIterationsComplete = 0;
    this.defaultIterations = 999;
    this.data = Buffer.from([]);
  }

  initiate() {
    this.centralManager.initiate();
  }

  retrievePeripheral() {
    const connectedPeripherals = this.centralManager.retrieveConnectedPeripherals(
      TransferService.serviceUUID,
    );

    console.log('Found connected Peripherals with transfer service:', connectedPeripherals);

    if (connectedPeripherals.length > 0) {
      console.log('Connecting to peripheral', connectedPeripherals[0]);
      this.discoveredPeripheral = connectedPeripherals[0];
      this.centralManager.connect(this.discoveredPeripheral);
    } else {
      this.centralManager.scanForPeripherals(
        [TransferService.serviceUUID],
        {
          allowDuplicates: true,
        },
      );
    }
  }

  cleanup() {
    if (
      this.discoveredPeripheral &&
      this.discoveredPeripheral.state === 'connected' &&
      this.discoveredPeripheral.services
    ) {
      for (const service of this.discoveredPeripheral.services) {
        if (service.characteristics) {
          for (const characteristic of service.characteristics) {
            if (
              characteristic.uuid === TransferService.characteristicUUID &&
              characteristic.isNotifying
            ) {
              this.discoveredPeripheral.setNotifyValue(characteristic, false);
            }
          }
        }
      }

      this.centralManager.cancelPeripheralConnection(this.discoveredPeripheral);
    }
  }

  writeData() {
    if (
      !this.discoveredPeripheral ||
      !this.transferCharacteristic ||
      !this.discoveredPeripheral.canSendWriteWithoutResponse
    ) {
      return;
    }

    while (
      this.writeIterationsComplete < this.defaultIterations &&
      this.discoveredPeripheral.canSendWriteWithoutResponse
    ) {
      const mtu = this.discoveredPeripheral.maximumWriteValueLength('withoutResponse');
      const rawPacket = [];
      const bytesToCopy = Math.min(mtu, this.data.length);
      this.data.copy(rawPacket, 0, 0, bytesToCopy);
      const packetData = Buffer.from(rawPacket.slice(0, bytesToCopy));
      const stringFromData = packetData.toString('utf8');
      console.log(`Writing ${bytesToCopy} bytes: ${stringFromData}`);
      this.discoveredPeripheral.writeValueForCharacteristicType(
        packetData,
        this.transferCharacteristic,
        'withoutResponse',
      );
      this.writeIterationsComplete += 1;
    }

    if (this.writeIterationsComplete === this.defaultIterations) {
      this.discoveredPeripheral.setNotifyValue(this.transferCharacteristic, false);
    }
  }

  onCentralManagerStateChanged(state) {
    switch (state) {
      case 'poweredOn':
        console.log('CBManager is powered on');
        this.retrievePeripheral();
        break;
      case 'poweredOff':
        console.log('CBManager is not powered on');
        break;
      case 'resetting':
        console.log('CBManager is resetting');
        break;
      case 'unauthorized':
        console.log('Not authorized');
        break;
      case 'unknown':
        console.log('CBManager state is unknown');
        break;
      case 'unsupported':
        console.log('Bluetooth is not supported on this device');
        break;
      default:
        console.log('A previously unknown central manager state occurred');
        break;
    }
  }

  onPeripheralDiscovered(peripheral) {
    if (peripheral.rssi < -70) {
      console.log('Discovered perhiperal not in expected range, at', peripheral.rssi);
      return;
    }

    console.log('Discovered', peripheral.name, 'at', peripheral.rssi);

    if (!this.discoveredPeripheral || this.discoveredPeripheral.id !== peripheral.id) {
      this.discoveredPeripheral = peripheral;
      console.log('Connecting to perhiperal', peripheral);
      this.centralManager.connect(this.discoveredPeripheral);
    }
  }

  onPeripheralConnected(peripheral) {
    console.log('Peripheral Connected');

    this.isConnected = true;
    this.centralManager.stopScan();
    console.log('Scanning stopped');

    this.connectionIterationsComplete += 1;
    this.writeIterationsComplete = 0;

    this.data = Buffer.from([]);

    peripheral.discoverAllServicesAndCharacteristics((error) => {
      if (error) {
        console.error('Error discovering services and characteristics:', error);
        return;
      }

      console.log('Services discovered:', peripheral.services);

      for (const service of peripheral.services) {
        if (service.uuid === TransferService.serviceUUID) {
          console.log('Service found with UUID:', TransferService.serviceUUID);
          for (const characteristic of service.characteristics) {
            if (characteristic.uuid === TransferService.characteristicUUID) {
              console.log('Characteristic found with UUID:', TransferService.characteristicUUID);
              this.transferCharacteristic = characteristic;
              peripheral.setNotifyValue(characteristic, true);
            }
          }
        }
      }
    });
  }

  onPeripheralDisconnected(peripheral) {
    console.log('Peripheral disconnected');
    this.isConnected = false;
    this.discoveredPeripheral = null;
    this.transferCharacteristic = null;
  }

  onCharacteristicValueChanged(characteristic) {
    const packet = characteristic.value;
    this.data = Buffer.concat([this.data, packet]);
    console.log('Received', packet.length, 'bytes');
    console.log('Total received:', this.data.length, 'bytes');

    // do something with the received data
  }
}

class BluetoothCentralManager {
  constructor(blueTooth) {
    this.bluetooth = blueTooth;
    this.state = 'unknown';
    this.peripherals = [];
  }

  initiate() {
    const noble = require('@abandonware/noble');

    noble.on('stateChange', (state) => {
      this.state = state;
      this.bluetooth.onCentralManagerStateChanged(state);
    });

    noble.on('discover', (peripheral) => {
      this.bluetooth.onPeripheralDiscovered(peripheral);
    });

    noble.on('connect', (peripheral) => {
      this.bluetooth.onPeripheralConnected(peripheral);
    });

    noble.on('disconnect', (peripheral) => {
      this.bluetooth.onPeripheralDisconnected(peripheral);
    });

    noble.on('warning', (message) => {
      console.warn('Warning:', message);
    });

    noble.on('error', (error) => {
      console.error('Error:', error);
    });

    console.log('Waiting for Bluetooth to become powered on...');
  }

  scanForPeripherals(serviceUUIDs, options) {
    console.log('Scanning for peripherals...');
    const noble = require('@abandonware/noble');
    noble.startScanning(serviceUUIDs, options, (error) => {
      if (error) {
        console.error('Error starting scan:', error);
        return;
      }
    });
  }

  connect(peripheral) {
    console.log('Connecting to peripheral', peripheral.id);
    peripheral.connect((error) => {
      if (error) {
        console.error('Error connecting to peripheral', peripheral.id, ':', error);
        return;
      }
    });
  }

  cancelPeripheralConnection(peripheral) {
    console.log('Cancelling peripheral connection');
    peripheral.disconnect((error) => {
      if (error) {
        console.error('Error disconnecting peripheral', peripheral.id, ':', error);
        return;
      }
    });
  }

  retrieveConnectedPeripherals(serviceUUIDs) {
    const noble = require('@abandonware/noble');
    const connectedPeripherals = noble
      .peripherals.filter(
        (peripheral) =>
          peripheral.state === 'connected' &&
          peripheral.services &&
          peripheral.services.some((service) => service.uuid === serviceUUIDs),
      )
      .map((peripheral) => peripheral);

    return connectedPeripherals;
  }

  stopScan() {
    const noble = require('@abandonware/noble');
    noble.stopScanning((error) => {
      if (error) {
        console.error('Error stopping scan:', error);
        return;
      }
    });
  }
}

const bluetooth = new Bluetooth();
bluetooth.initiate();
