// Modular Sensor Definitions & Templates for AgroNexus IoT Code Generator

export const SENSORS = {
  dht22: {
    sensor_id: "dht22",
    name: "DHT22 (AM2302) Temperature & Humidity",
    shortName: "DHT22",
    category: "Climate & Air",
    description: "High-accuracy digital sensor measuring temperature (-40 to 80°C) and relative humidity (0-100%).",
    interface: "digital",
    measurements: ["temperature", "humidity"],
    fields: [
      { key: "temperature", name: "Air Temperature", unit: "°C", defaultField: "field1", dataType: "float" },
      { key: "humidity", name: "Relative Humidity", unit: "%", defaultField: "field2", dataType: "float" }
    ],
    supported_boards: ["esp32", "esp8266", "arduino_uno", "arduino_nano", "raspberry_pi"],
    required_libraries: [
      { name: "DHT sensor library", header: "DHT.h", author: "Adafruit" },
      { name: "Adafruit Unified Sensor", header: "Adafruit_Sensor.h", author: "Adafruit" }
    ],
    python_packages: ["adafruit-circuitpython-dht"],
    pin_requirements: [
      {
        name: "DATA",
        type: "digital",
        label: "Data Pin (GPIO)",
        defaultPin: { esp32: 4, esp8266: "D4", arduino_uno: 4, arduino_nano: 4, raspberry_pi: 4 }
      }
    ],
    calibration_required: false,
    wiring_information: [
      { sensorPin: "VCC (Pin 1)", boardPin: "3.3V / 5V", note: "Use 3.3V on ESP32/Pi; 5V on Arduino" },
      { sensorPin: "DATA (Pin 2)", boardPin: "Configured GPIO", note: "Add 10kΩ pull-up resistor to VCC if not using pre-soldered PCB module" },
      { sensorPin: "NC (Pin 3)", boardPin: "Not Connected", note: "Leave disconnected" },
      { sensorPin: "GND (Pin 4)", boardPin: "GND", note: "Common Ground" }
    ]
  },

  soil_moisture: {
    sensor_id: "soil_moisture",
    name: "Capacitive Soil Moisture Sensor v1.2",
    shortName: "Soil Moisture",
    category: "Soil & Agriculture",
    description: "Corrosion-resistant capacitive soil sensor providing analog voltage proportional to soil volumetric water content.",
    interface: "analog",
    measurements: ["soil_moisture"],
    fields: [
      { key: "soil_moisture", name: "Soil Moisture", unit: "%", defaultField: "field3", dataType: "float" }
    ],
    supported_boards: ["esp32", "esp8266", "arduino_uno", "arduino_nano"],
    required_libraries: [],
    python_packages: [],
    pin_requirements: [
      {
        name: "AOUT",
        type: "adc",
        label: "Analog Output (ADC Pin)",
        defaultPin: { esp32: 34, esp8266: "A0", arduino_uno: "A0", arduino_nano: "A0" }
      }
    ],
    calibration_required: true,
    calibration_config: [
      {
        key: "dryVal",
        label: "Dry Air ADC Value (0% Moisture)",
        help: "Raw ADC reading when sensor is completely dry in the air.",
        default: { esp32: 3200, esp8266: 820, arduino_uno: 650, arduino_nano: 650 }
      },
      {
        key: "wetVal",
        label: "Water Submerged ADC Value (100% Moisture)",
        help: "Raw ADC reading when probe is submerged up to the white line in water.",
        default: { esp32: 1400, esp8266: 340, arduino_uno: 280, arduino_nano: 280 }
      }
    ],
    wiring_information: [
      { sensorPin: "VCC", boardPin: "3.3V", note: "Power with 3.3V to protect ESP32 ADC and minimize sensor heating" },
      { sensorPin: "GND", boardPin: "GND", note: "Common Ground" },
      { sensorPin: "AOUT", boardPin: "Configured ADC Pin", note: "Connect directly to microcontroller ADC input" }
    ]
  },

  ph_sensor: {
    sensor_id: "ph_sensor",
    name: "Analog pH Sensor Meter (SEN0161 / E-201-C)",
    shortName: "pH Sensor",
    category: "Water Quality",
    description: "Electrochemical pH electrode and amplifier board for monitoring soil slurry or hydroponic nutrient solution acidity/alkalinity.",
    interface: "analog",
    measurements: ["ph"],
    fields: [
      { key: "ph", name: "pH Value", unit: "pH", defaultField: "field4", dataType: "float" }
    ],
    supported_boards: ["esp32", "esp8266", "arduino_uno", "arduino_nano"],
    required_libraries: [],
    python_packages: [],
    pin_requirements: [
      {
        name: "PO / AOUT",
        type: "adc",
        label: "Analog Signal (PO Pin)",
        defaultPin: { esp32: 35, esp8266: "A0", arduino_uno: "A1", arduino_nano: "A1" }
      }
    ],
    calibration_required: true,
    calibration_config: [
      {
        key: "neutralVoltage",
        label: "pH 7.0 Neutral Voltage (V)",
        help: "Analog voltage when submerged in pH 7.0 calibration buffer.",
        default: { esp32: 1.50, esp8266: 1.50, arduino_uno: 2.50, arduino_nano: 2.50 }
      },
      {
        key: "acidVoltage",
        label: "pH 4.0 Acid Voltage (V)",
        help: "Analog voltage when submerged in pH 4.0 calibration buffer.",
        default: { esp32: 2.03, esp8266: 2.03, arduino_uno: 3.05, arduino_nano: 3.05 }
      }
    ],
    wiring_information: [
      { sensorPin: "VCC", boardPin: "5V or 3.3V", note: "5V recommended for operational amplifier linear range" },
      { sensorPin: "GND", boardPin: "GND", note: "Common Ground" },
      { sensorPin: "PO", boardPin: "Configured ADC Pin", note: "Analog output pin (Do not connect TO/DO pins)" }
    ]
  },

  tds_sensor: {
    sensor_id: "tds_sensor",
    name: "Analog TDS Sensor (Nutrient EC / PPM)",
    shortName: "TDS / EC Sensor",
    category: "Water Quality",
    description: "Total Dissolved Solids probe for measuring nutrient concentration and water cleanliness (0-1000 ppm).",
    interface: "analog",
    measurements: ["tds"],
    fields: [
      { key: "tds", name: "Total Dissolved Solids", unit: "ppm", defaultField: "field5", dataType: "float" }
    ],
    supported_boards: ["esp32", "esp8266", "arduino_uno", "arduino_nano"],
    required_libraries: [],
    python_packages: [],
    pin_requirements: [
      {
        name: "AOUT",
        type: "adc",
        label: "Analog Output",
        defaultPin: { esp32: 32, esp8266: "A0", arduino_uno: "A2", arduino_nano: "A2" }
      }
    ],
    calibration_required: true,
    calibration_config: [
      {
        key: "tdsFactor",
        label: "TDS Conversion Factor",
        help: "Standard EC-to-TDS factor (typically 0.5 for freshwater irrigation).",
        default: { esp32: 0.5, esp8266: 0.5, arduino_uno: 0.5, arduino_nano: 0.5 }
      },
      {
        key: "assumedTemp",
        label: "Water Base Temperature (°C)",
        help: "Reference temperature for automatic temperature compensation curve.",
        default: { esp32: 25.0, esp8266: 25.0, arduino_uno: 25.0, arduino_nano: 25.0 }
      }
    ],
    wiring_information: [
      { sensorPin: "VCC", boardPin: "3.3V / 5V", note: "Compatible with 3.3V and 5V controllers" },
      { sensorPin: "GND", boardPin: "GND", note: "Common Ground" },
      { sensorPin: "AOUT", boardPin: "Configured ADC Pin", note: "Connect to analog input pin" }
    ]
  },

  bh1750: {
    sensor_id: "bh1750",
    name: "BH1750 Digital Ambient Light Sensor",
    shortName: "BH1750 Light",
    category: "Light & Solar",
    description: "16-bit digital ambient light sensor measuring illuminance (1 - 65535 lx) directly via I2C bus.",
    interface: "i2c",
    measurements: ["lux"],
    fields: [
      { key: "lux", name: "Ambient Light", unit: "lux", defaultField: "field6", dataType: "float" }
    ],
    supported_boards: ["esp32", "esp8266", "arduino_uno", "arduino_nano", "raspberry_pi"],
    required_libraries: [
      { name: "BH1750", header: "BH1750.h", author: "Christopher Laws" },
      { header: "Wire.h" }
    ],
    python_packages: ["smbus2"],
    pin_requirements: [
      {
        name: "SDA",
        type: "i2c_sda",
        label: "I2C SDA (Data)",
        defaultPin: { esp32: 21, esp8266: "D2", arduino_uno: "A4", arduino_nano: "A4", raspberry_pi: 2 }
      },
      {
        name: "SCL",
        type: "i2c_scl",
        label: "I2C SCL (Clock)",
        defaultPin: { esp32: 22, esp8266: "D1", arduino_uno: "A5", arduino_nano: "A5", raspberry_pi: 3 }
      }
    ],
    calibration_required: false,
    wiring_information: [
      { sensorPin: "VCC", boardPin: "3.3V", note: "Power Supply" },
      { sensorPin: "GND", boardPin: "GND", note: "Ground" },
      { sensorPin: "SDA", boardPin: "I2C SDA", note: "Connect to hardware I2C SDA pin" },
      { sensorPin: "SCL", boardPin: "I2C SCL", note: "Connect to hardware I2C SCL pin" },
      { sensorPin: "ADDR", boardPin: "GND", note: "Leaves default I2C address at 0x23" }
    ]
  },

  ds18b20: {
    sensor_id: "ds18b20",
    name: "DS18B20 Waterproof 1-Wire Temperature Probe",
    shortName: "DS18B20 Probe",
    category: "Climate & Water",
    description: "Stainless steel probe for measuring liquid, water bath, or deep soil temperatures (-55 to +125°C).",
    interface: "1-wire",
    measurements: ["temperature"],
    fields: [
      { key: "temperature", name: "Water / Soil Probe Temp", unit: "°C", defaultField: "field1", dataType: "float" }
    ],
    supported_boards: ["esp32", "esp8266", "arduino_uno", "arduino_nano", "raspberry_pi"],
    required_libraries: [
      { name: "OneWire", header: "OneWire.h", author: "Paul Stoffregen" },
      { name: "DallasTemperature", header: "DallasTemperature.h", author: "Miles Burton" }
    ],
    python_packages: ["w1thermsensor"],
    pin_requirements: [
      {
        name: "DATA",
        type: "digital",
        label: "1-Wire Data Pin",
        defaultPin: { esp32: 15, esp8266: "D3", arduino_uno: 2, arduino_nano: 2, raspberry_pi: 4 }
      }
    ],
    calibration_required: false,
    wiring_information: [
      { sensorPin: "VCC (Red Wire)", boardPin: "3.3V / 5V", note: "Power line" },
      { sensorPin: "GND (Black Wire)", boardPin: "GND", note: "Ground line" },
      { sensorPin: "DATA (Yellow / White)", boardPin: "Configured GPIO", note: "CRITICAL: Connect a 4.7kΩ pull-up resistor between VCC and DATA" }
    ]
  },

  dht11: {
    sensor_id: "dht11",
    name: "DHT11 Basic Temperature & Humidity Sensor",
    shortName: "DHT11",
    category: "Climate & Air",
    description: "Entry-level digital temperature (0 to 50°C) and humidity (20 to 80%) sensor.",
    interface: "digital",
    measurements: ["temperature", "humidity"],
    fields: [
      { key: "temperature", name: "Temperature", unit: "°C", defaultField: "field1", dataType: "float" },
      { key: "humidity", name: "Humidity", unit: "%", defaultField: "field2", dataType: "float" }
    ],
    supported_boards: ["esp32", "esp8266", "arduino_uno", "arduino_nano", "raspberry_pi"],
    required_libraries: [
      { name: "DHT sensor library", header: "DHT.h", author: "Adafruit" },
      { name: "Adafruit Unified Sensor", header: "Adafruit_Sensor.h", author: "Adafruit" }
    ],
    python_packages: ["adafruit-circuitpython-dht"],
    pin_requirements: [
      {
        name: "DATA",
        type: "digital",
        label: "Data Pin (GPIO)",
        defaultPin: { esp32: 4, esp8266: "D4", arduino_uno: 4, arduino_nano: 4, raspberry_pi: 4 }
      }
    ],
    calibration_required: false,
    wiring_information: [
      { sensorPin: "VCC", boardPin: "3.3V / 5V", note: "Power Supply" },
      { sensorPin: "DATA", boardPin: "Configured GPIO", note: "Include 10kΩ pull-up to VCC" },
      { sensorPin: "GND", boardPin: "GND", note: "Ground" }
    ]
  },

  bme280: {
    sensor_id: "bme280",
    name: "BME280 Atmospheric Sensor (Temp, Humidity, Pressure)",
    shortName: "BME280",
    category: "Climate & Weather",
    description: "Precision Bosch sensor measuring temperature, relative humidity, and barometric atmospheric pressure via I2C.",
    interface: "i2c",
    measurements: ["temperature", "humidity", "pressure"],
    fields: [
      { key: "temperature", name: "Temperature", unit: "°C", defaultField: "field1", dataType: "float" },
      { key: "humidity", name: "Humidity", unit: "%", defaultField: "field2", dataType: "float" },
      { key: "pressure", name: "Pressure", unit: "hPa", defaultField: "field3", dataType: "float" }
    ],
    supported_boards: ["esp32", "esp8266", "arduino_uno", "arduino_nano", "raspberry_pi"],
    required_libraries: [
      { name: "Adafruit BME280 Library", header: "Adafruit_BME280.h", author: "Adafruit" },
      { header: "Wire.h" }
    ],
    python_packages: ["adafruit-circuitpython-bme280"],
    pin_requirements: [
      {
        name: "SDA",
        type: "i2c_sda",
        label: "I2C SDA (Data)",
        defaultPin: { esp32: 21, esp8266: "D2", arduino_uno: "A4", arduino_nano: "A4", raspberry_pi: 2 }
      },
      {
        name: "SCL",
        type: "i2c_scl",
        label: "I2C SCL (Clock)",
        defaultPin: { esp32: 22, esp8266: "D1", arduino_uno: "A5", arduino_nano: "A5", raspberry_pi: 3 }
      }
    ],
    calibration_required: false,
    wiring_information: [
      { sensorPin: "VIN", boardPin: "3.3V", note: "Use 3.3V" },
      { sensorPin: "GND", boardPin: "GND", note: "Ground" },
      { sensorPin: "SDA", boardPin: "I2C SDA", note: "Serial Data" },
      { sensorPin: "SCL", boardPin: "I2C SCL", note: "Serial Clock" }
    ]
  }
};
